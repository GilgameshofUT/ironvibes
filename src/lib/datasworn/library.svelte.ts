import { createId } from '../id';
import { flattenDataswornPack, type DataswornPack, type DataswornRecord } from './catalog';
import { importDataswornPack, removeImportedPack, restoreImportedPacks } from './imports';
import { bundledPacks } from './packs';

const STORAGE_KEY = 'ironvibes.datasworn.packs.v1';

export type LibraryPack = {
	id: string;
	title: string;
	version: string;
	license: string;
	url: string;
	count: number;
	bundled: boolean;
	pack: DataswornPack;
};

function metadata(pack: DataswornPack, bundled: boolean): LibraryPack {
	const id = typeof pack._id === 'string' ? pack._id : `imported-${createId()}`;
	return {
		id,
		title: typeof pack.title === 'string' ? pack.title : id,
		version: typeof pack.datasworn_version === 'string' ? pack.datasworn_version : 'unknown',
		license: typeof pack.license === 'string' ? pack.license : 'Not provided',
		url: typeof pack.url === 'string' ? pack.url : '',
		count: flattenDataswornPack(pack).length,
		bundled,
		pack
	};
}

function loadImported(): DataswornPack[] {
	if (typeof window === 'undefined') return [];
	return restoreImportedPacks(localStorage.getItem(STORAGE_KEY), bundledPacks.map((pack) => String(pack._id)));
}

export class DataswornLibrary {
	private imported = $state<DataswornPack[]>([]);
	private disabled = $state<string[]>([]);
	private storageError = $state('');
	allPacks = $derived([
		...bundledPacks.map((pack) => metadata(pack, true)),
		...this.imported.map((pack) => metadata(pack, false))
	]);
	packs = $derived([
		...bundledPacks.filter((pack) => !this.disabled.includes(String(pack._id))).map((pack) => metadata(pack, true)),
		...this.imported.map((pack) => metadata(pack, false))
	]);
	records = $derived(this.packs.flatMap((pack) => flattenDataswornPack(pack.pack)));
	get error() { return this.storageError; }

	initialize() {
		this.imported = loadImported();
	}

	importPack(value: unknown, fallbackId = `imported-${createId()}`, fallbackTitle?: string) {
		const outcome = importDataswornPack(
			this.imported,
			value,
			fallbackId,
			fallbackTitle,
			bundledPacks.map((pack) => String(pack._id))
		);
		this.persist(outcome.packs);
		this.imported = outcome.packs;
		return { id: outcome.id, warnings: outcome.warnings, kind: outcome.kind, recordCount: outcome.recordCount };
	}

	setEnabled(id: string, enabled: boolean) {
		this.disabled = enabled ? this.disabled.filter((item) => item !== id) : [...new Set([...this.disabled, id])];
	}

	isEnabled(id: string) {
		return !this.disabled.includes(id);
	}

	removeImported(id: string) {
		const remaining = removeImportedPack(this.imported, id);
		this.persist(remaining);
		this.imported = remaining;
	}

	exportPack(pack: LibraryPack) {
		return JSON.stringify(pack.pack, null, 2);
	}

	private persist(packs: DataswornPack[]) {
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
				this.storageError = '';
			} catch {
				this.storageError = 'The import was read, but could not be saved in browser storage. Check available space and try again.';
				throw new Error(this.storageError);
			}
		}
	}
}

/** Shared campaign + browser-library catalog so imported content is available in every workflow. */
export const dataswornLibrary = new DataswornLibrary();

export type { DataswornRecord };
