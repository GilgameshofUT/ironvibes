import {
	isDataswornPack,
	normalizeDataswornImport,
	type DataswornPack
} from './catalog';

export type ImportOutcome = {
	packs: DataswornPack[];
	id: string;
	warnings: string[];
	kind: 'pack' | 'item';
	recordCount: number;
};

/** Normalize an import and replace an existing user pack with the same ID. */
export function importDataswornPack(
	current: DataswornPack[],
	value: unknown,
	fallbackId: string,
	fallbackTitle?: string,
	reservedIds: string[] = []
): ImportOutcome {
	const normalized = normalizeDataswornImport(value, fallbackId, fallbackTitle);
	const id = String(normalized.pack._id);
	if (reservedIds.includes(id)) {
		throw new Error(`The pack ID “${id}” belongs to bundled content and cannot be replaced.`);
	}
	return {
		packs: [...current.filter((pack) => pack._id !== id), normalized.pack],
		id,
		warnings: normalized.warnings,
		kind: normalized.kind,
		recordCount: normalized.recordCount
	};
}

/** Reject stale imports that collide with bundled IDs while restoring browser storage. */
export function restoreImportedPacks(serialized: string | null, reservedIds: string[] = []): DataswornPack[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		if (!Array.isArray(value)) return [];
		return value.reduce<DataswornPack[]>((packs, pack) => {
			if (!isDataswornPack(pack) || reservedIds.includes(String(pack._id))) return packs;
			return [...packs.filter((existing) => existing._id !== pack._id), pack];
		}, []);
	} catch {
		return [];
	}
}

export function removeImportedPack(current: DataswornPack[], id: string): DataswornPack[] {
	return current.filter((pack) => pack._id !== id);
}
