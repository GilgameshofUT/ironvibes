export type DataswornRecord = {
	id: string;
	name: string;
	type: string;
	packId: string;
	packTitle: string;
	packLicense: string;
	packUrl: string;
	path: string;
	category: string;
	description: string;
	sourceTitle: string;
	sourceLicense: string;
	sourceUrl: string;
	data: Record<string, unknown>;
};

export type DataswornPack = {
	_id?: string;
	type?: string;
	title?: string;
	url?: string;
	license?: string | null;
	assets?: unknown;
	oracles?: unknown;
	moves?: unknown;
	atlas?: unknown;
	npcs?: unknown;
	truths?: unknown;
	worlds?: unknown;
	delve_sites?: unknown;
	site_themes?: unknown;
	site_domains?: unknown;
	rules?: unknown;
	[key: string]: unknown;
};

const searchableTypes = new Set([
	'asset', 'move', 'oracle_rollable', 'truth', 'world', 'npc', 'atlas_entry',
	'delve_site', 'delve_site_theme', 'delve_site_domain', 'site_theme', 'site_domain', 'rarity', 'move_category',
	'oracle_collection', 'asset_collection', 'npc_collection', 'atlas_collection'
]);

const supportedSections = [
	'assets', 'oracles', 'moves', 'truths', 'worlds', 'npcs', 'atlas', 'rarities',
	'delve_sites', 'site_themes', 'site_domains', 'rules'
] as const;

const sectionForType: Record<string, string> = {
	asset: 'assets', asset_collection: 'assets',
	move: 'moves', move_category: 'moves',
	oracle_rollable: 'oracles', oracle_collection: 'oracles',
	truth: 'truths', world: 'worlds', npc: 'npcs', npc_collection: 'npcs',
	atlas_entry: 'atlas', atlas_collection: 'atlas',
	delve_site: 'delve_sites', delve_site_theme: 'site_themes', delve_site_domain: 'site_domains',
	site_theme: 'site_themes', site_domain: 'site_domains', rarity: 'rarities'
};

export type NormalizedDataswornImport = {
	pack: DataswornPack;
	kind: 'pack' | 'item';
	warnings: string[];
	recordCount: number;
};

function textValue(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(' ');
	if (!value || typeof value !== 'object') return '';
	const object = value as Record<string, unknown>;
	return [object.text, object.description, object.summary, object.name]
		.map(textValue).filter(Boolean).join(' ');
}

function categoryFromPath(path: string): string {
	const parts = path.split('.').filter((part) => !/^contents\.?/.test(part) && !/^\d+$/.test(part));
	return parts.slice(0, -1).join(' / ').replaceAll('_', ' ');
}

/** Flatten Datasworn nodes while retaining their pack, collection and source provenance. */
export function flattenDataswornPack(pack: DataswornPack, fallbackTitle = 'Imported pack'): DataswornRecord[] {
	const packId = typeof pack._id === 'string' ? pack._id : 'imported';
	const packTitle = typeof pack.title === 'string' ? pack.title : fallbackTitle;
	const packUrl = typeof pack.url === 'string' ? pack.url : '';
	const packLicense = typeof pack.license === 'string' ? pack.license : '';
	const records: DataswornRecord[] = [];

	const visit = (value: unknown, path: string, inheritedSource: Record<string, unknown>) => {
		if (!value || typeof value !== 'object') return;
		if (Array.isArray(value)) {
			value.forEach((child, index) => visit(child, `${path}[${index}]`, inheritedSource));
			return;
		}

		const node = value as Record<string, unknown>;
		const source = (node._source && typeof node._source === 'object'
			? node._source as Record<string, unknown>
			: inheritedSource);
		const type = typeof node.type === 'string' ? node.type : '';
		const id = typeof node._id === 'string' ? node._id : '';
		const name = typeof node.name === 'string' ? node.name : '';
		if (type && searchableTypes.has(type) && id && name) {
			records.push({
				id, name, type, packId, packTitle, packLicense, packUrl, path,
				category: categoryFromPath(path),
				description: textValue(node.description ?? node.summary ?? node.text ?? node.contents),
				sourceTitle: typeof source.title === 'string' ? source.title : packTitle,
				sourceLicense: typeof source.license === 'string' ? source.license : packLicense,
				sourceUrl: typeof source.url === 'string' ? source.url : packUrl,
				data: node
			});
		}
		for (const [key, child] of Object.entries(node)) {
			if (child && typeof child === 'object') visit(child, path ? `${path}.${key}` : key, source);
		}
	};

	visit(pack, '', {});
	return records;
}

export function isDataswornPack(value: unknown): value is DataswornPack {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const candidate = value as DataswornPack;
	const isPack = candidate.type === 'ruleset' || candidate.type === 'expansion' || supportedSections
		.some((key) => candidate[key] !== undefined);
	return isPack && typeof candidate._id === 'string' && candidate._id.trim().length > 0 &&
		flattenDataswornPack(candidate).length > 0;
}

function slug(value: string): string {
	return value.normalize('NFKD').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'entry';
}

/** Accept a Datasworn ruleset/expansion or a single exported Datasworn record. */
export function normalizeDataswornImport(value: unknown, fallbackId: string, fallbackTitle = 'Imported pack'): NormalizedDataswornImport {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('This JSON does not appear to be a Datasworn ruleset, content pack, or item.');
	}

	const candidate = value as DataswornPack & Record<string, unknown>;
	const hasPackSections = supportedSections.some((key) => candidate[key] !== undefined);
	const hasPackType = candidate.type === 'ruleset' || candidate.type === 'expansion';
	if (hasPackSections || hasPackType) {
		if (!hasPackSections) throw new Error('This Datasworn package has no supported content sections.');
		const warnings: string[] = [];
		const declaredId = typeof candidate._id === 'string' ? candidate._id.trim() : '';
		const packId = declaredId || fallbackId;
		if (!declaredId) warnings.push('No stable pack ID was declared; a local ID was assigned.');
		const pack: DataswornPack = {
			...candidate,
			_id: packId,
			title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : fallbackTitle
		};
		const recordCount = flattenDataswornPack(pack).length;
		if (!recordCount) throw new Error('This Datasworn package contains no supported searchable entries.');
		if (typeof pack.datasworn_version !== 'string') warnings.push('No Datasworn schema version was declared.');
		return { pack, kind: 'pack', warnings, recordCount };
	}

	const itemType = typeof candidate.type === 'string' ? candidate.type : '';
	const itemId = typeof candidate._id === 'string' ? candidate._id.trim() : '';
	const itemName = typeof candidate.name === 'string' ? candidate.name.trim() : '';
	const section = sectionForType[itemType];
	if (!section || !itemId || !itemName || !searchableTypes.has(itemType)) {
		throw new Error('This JSON does not appear to be a Datasworn ruleset, content pack, or supported Datasworn item.');
	}

	const source = candidate._source && typeof candidate._source === 'object'
		? candidate._source as Record<string, unknown>
		: {};
	const key = slug(itemId.split(/[/:]/).filter(Boolean).at(-1) ?? itemName);
	const itemPack: DataswornPack = {
		_id: `ironvibes-item-${encodeURIComponent(itemId)}`,
		type: 'expansion',
		datasworn_version: typeof candidate.datasworn_version === 'string' ? candidate.datasworn_version : 'unknown',
		title: `${itemName} (imported item)`,
		license: typeof source.license === 'string' ? source.license : null,
		url: typeof source.url === 'string' ? source.url : undefined,
		[section]: { [key]: candidate }
	};
	const recordCount = flattenDataswornPack(itemPack).length;
	if (!recordCount) throw new Error('This Datasworn item could not be indexed.');
	const warnings = ['Imported as a standalone item because the file did not contain a full content pack.'];
	if (typeof source.license !== 'string') warnings.push('The item does not declare a source license.');
	return { pack: itemPack, kind: 'item', warnings, recordCount };
}

export function recordMatches(record: DataswornRecord, query: string): boolean {
	const haystack = `${record.name} ${record.type} ${record.category} ${record.packTitle} ${record.description} ${record.id} ${record.sourceTitle} ${record.sourceLicense} ${record.sourceUrl}`.toLocaleLowerCase();
	return query.trim().toLocaleLowerCase().split(/\s+/).every((term) => haystack.includes(term));
}
