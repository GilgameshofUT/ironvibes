import { asset } from '$app/paths';
import { createId } from '../id';

export const MAP_PAINTS = [
	'grassland', 'forest1', 'jungle', 'swamp', 'wasteland', 'hills1', 'mountains1', 'water', 'snowland', 'special1', 'void', 'fog',
	'forest2', 'forest3', 'forest4', 'hills2', 'hills3', 'hills4', 'mountains2', 'mountains3',
	'special2', 'special3', 'special4', 'special5', 'special6', 'special7'
] as const;
export type MapPaint = (typeof MAP_PAINTS)[number];
export type MapGridShape = 'square' | 'hex';
export type MapTileStyle = 'classic' | 'bw' | 'painted';
export const MAP_TERRAIN_GROUPS: readonly { label: string; choices: readonly { paint: MapPaint; label: string }[] }[] = [
	{ label: 'Grassland', choices: [{ paint: 'grassland', label: 'Grassland' }] },
	{ label: 'Forest', choices: [{ paint: 'forest1', label: 'Deciduous' }, { paint: 'forest2', label: 'Evergreen' }, { paint: 'forest3', label: 'Mixed' }, { paint: 'forest4', label: 'Boreal' }] },
	{ label: 'Jungle', choices: [{ paint: 'jungle', label: 'Jungle' }] },
	{ label: 'Swamp', choices: [{ paint: 'swamp', label: 'Swamp' }] },
	{ label: 'Wasteland', choices: [{ paint: 'wasteland', label: 'Wasteland' }] },
	{ label: 'Hills', choices: [{ paint: 'hills1', label: 'Hills' }, { paint: 'hills2', label: 'Grass hills' }, { paint: 'hills3', label: 'Forest hills' }, { paint: 'hills4', label: 'Snow hills' }] },
	{ label: 'Mountains', choices: [{ paint: 'mountains1', label: 'Mountains' }, { paint: 'mountains2', label: 'Forest mountains' }, { paint: 'mountains3', label: 'Snow mountains' }] },
	{ label: 'Water', choices: [{ paint: 'water', label: 'Water' }] },
	{ label: 'Snowland', choices: [{ paint: 'snowland', label: 'Snowland' }] },
	{ label: 'Special', choices: [{ paint: 'special1', label: 'Dungeon' }, { paint: 'special2', label: 'Underground' }, { paint: 'special3', label: 'Deadlands' }, { paint: 'special4', label: 'Space station' }, { paint: 'special5', label: 'Lava' }, { paint: 'special6', label: 'Crystal' }, { paint: 'special7', label: 'Mushroom' }] },
	{ label: 'Void', choices: [{ paint: 'void', label: 'Void' }] },
	{ label: 'Fog', choices: [{ paint: 'fog', label: 'Fog of War' }] }
];

/** Base-aware terrain atlas URLs (project Pages serves under a sub-path, so absolute `/...` paths break). */
const TERRAIN_ATLAS: Record<string, string> = {
	'': asset('terrain-atlas.png'),
	'-bw': asset('terrain-atlas-bw.png'),
	'-painted': asset('terrain-atlas-painted.png')
};
const TERRAIN_VARIANTS: Record<string, string> = {
	'': asset('terrain-variants.png'),
	'-bw': asset('terrain-variants-bw.png'),
	'-painted': asset('terrain-variants-painted.png')
};

/** Coordinates into original terrain atlases (Worldographer-inspired classic drawn figures, B&W ink, or detailed painted). */
export function mapPaintTile(paint: MapPaint, style: MapTileStyle = 'classic'): { image: string; size: string; x: string; y: string } {
	const variantIndex: Partial<Record<MapPaint, number>> = {
		forest2: 0, forest3: 1, forest4: 2, hills2: 3, hills3: 4, hills4: 5,
		mountains2: 6, mountains3: 7, special2: 8, special3: 9, special4: 10,
		special5: 11, special6: 12, special7: 13
	};
	const variant = variantIndex[paint];
	const index = variant ?? MAP_PAINTS.indexOf(paint);
	const suffix = style === 'bw' ? '-bw' : style === 'painted' ? '-painted' : '';
	return {
		image: variant === undefined ? `url(${TERRAIN_ATLAS[suffix]})` : `url(${TERRAIN_VARIANTS[suffix]})`,
		size: variant === undefined ? '400% 300%' : '400% 400%',
		x: `${index % 4 * 100 / 3}%`,
		y: `${Math.floor(index / 4) * 100 / (variant === undefined ? 2 : 3)}%`
	};
}
export const MAP_RECORD_KINDS = ['location', 'site', 'character'] as const;
export type MapRecordKind = (typeof MAP_RECORD_KINDS)[number];
export type MapCell = {
	key: string;
	/** An empty string is unpainted terrain (including cells used only for paths or assignments). */
	paint: MapPaint | '';
	path: boolean;
	name: string;
	notes?: string;
	/** Multiple records can share one cell; older saves stored a single ID. */
	assignments: Partial<Record<MapRecordKind, string[]>>;
};
export type CampaignMap = {
	id: string;
	name: string;
	origin?: string;
	region?: string;
	notes?: string;
	background: string;
	factionInfluence: string;
	showNames: boolean;
	gridShape?: MapGridShape;
	tileStyle?: MapTileStyle;
	cells: Record<string, MapCell>;
	createdAt: string;
	updatedAt: string;
};

const paints = new Set<string>(MAP_PAINTS);
const kinds = new Set<string>(MAP_RECORD_KINDS);
const mapKey = (key: string) => { const match = /^(\d+):(\d+)$/.exec(key); return !!match && Number(match[1]) < 20 && Number(match[2]) < 10; };

function normalizeCell(cell: MapCell & { assignments: Partial<Record<MapRecordKind, string | string[]>> }): MapCell {
	return { ...cell, assignments: Object.fromEntries(Object.entries(cell.assignments).map(([kind, ids]) => [kind, Array.isArray(ids) ? [...new Set(ids.filter(Boolean))] : ids ? [ids] : []])) };
}

function isMap(value: unknown): value is CampaignMap {
	if (!value || typeof value !== 'object') return false;
	const map = value as Partial<CampaignMap>;
	if (typeof map.id !== 'string' || !map.id || typeof map.name !== 'string' || !map.name.trim() || typeof map.background !== 'string' || typeof map.factionInfluence !== 'string' ||
		(map.origin !== undefined && typeof map.origin !== 'string') || (map.region !== undefined && typeof map.region !== 'string') || (map.notes !== undefined && typeof map.notes !== 'string') ||
		(map.gridShape !== undefined && map.gridShape !== 'square' && map.gridShape !== 'hex') ||
		(map.tileStyle !== undefined && map.tileStyle !== 'classic' && map.tileStyle !== 'bw' && map.tileStyle !== 'painted') ||
		typeof map.showNames !== 'boolean' || !map.cells || typeof map.cells !== 'object' || Array.isArray(map.cells) ||
		typeof map.createdAt !== 'string' || typeof map.updatedAt !== 'string') return false;
	return Object.entries(map.cells).every(([key, value]) => {
		if (!value || typeof value !== 'object') return false;
		const cell = value as Partial<MapCell>;
		return mapKey(key) && cell.key === key && typeof cell.paint === 'string' && (cell.paint === '' || paints.has(cell.paint)) && typeof cell.path === 'boolean' && typeof cell.name === 'string' && (cell.notes === undefined || typeof cell.notes === 'string') &&
			!!cell.assignments && typeof cell.assignments === 'object' && !Array.isArray(cell.assignments) && Object.entries(cell.assignments).every(([kind, ids]) => kinds.has(kind) && (typeof ids === 'string' || (Array.isArray(ids) && ids.every((id) => typeof id === 'string' && !!id))));
	});
}

export function parseCampaignMaps(serialized: string | null): CampaignMap[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		const items = Array.isArray(value) ? value : [value];
		const unique = new Map<string, CampaignMap>();
		for (const item of items) if (isMap(item)) unique.set(item.id, { ...item, cells: Object.fromEntries(Object.entries(item.cells).map(([key, cell]) => [key, normalizeCell(cell)])) });
		return [...unique.values()];
	} catch { return []; }
}

export function makeCampaignMap(name: string, id: string = createId(), now = new Date().toISOString()): CampaignMap {
	const cleanName = name.trim();
	if (!cleanName) throw new Error('Enter a name for this map.');
	return { id, name: cleanName, background: '', factionInfluence: '', showNames: false, cells: {}, createdAt: now, updatedAt: now };
}

export function putCampaignMap(maps: CampaignMap[], map: CampaignMap): CampaignMap[] {
	return [...maps.filter((item) => item.id !== map.id), map];
}

export function updateCampaignMap(maps: CampaignMap[], id: string, update: Partial<Pick<CampaignMap, 'name' | 'background' | 'factionInfluence' | 'showNames' | 'gridShape' | 'tileStyle' | 'cells'>>, now = new Date().toISOString()): CampaignMap[] {
	return maps.map((map) => map.id === id ? { ...map, ...update, updatedAt: now } : map);
}

export function removeCampaignMap(maps: CampaignMap[], id: string): CampaignMap[] {
	return maps.filter((map) => map.id !== id);
}

export function paintMapCell(map: CampaignMap, key: string, paint: MapPaint): CampaignMap {
	if (!mapKey(key)) throw new Error('Choose a cell inside the 20 × 10 map.');
	if (!paints.has(paint)) throw new Error('Choose a supported map paint.');
	const previous = map.cells[key] ?? { key, paint, path: false, name: '', assignments: {} };
	return { ...map, cells: { ...map.cells, [key]: { ...previous, paint } } };
}

/** Preserve existing assignments and paths when filling or clearing terrain. */
export function fillMapPaint(map: CampaignMap, paint: MapPaint | '', mode: 'unpainted' | 'all'): CampaignMap {
	if (paint && !paints.has(paint)) throw new Error('Choose a supported map paint.');
	const cells = { ...map.cells };
	for (let column = 0; column < 20; column++) for (let row = 0; row < 10; row++) {
		const key = `${column}:${row}`;
		const current = cells[key];
		if (mode === 'unpainted' && current?.paint) continue;
		if (paint) cells[key] = { ...(current ?? { key, path: false, name: '', assignments: {} }), paint };
		else if (current) {
			const cleared = { ...current, paint: '' as const };
			if (cleared.path || cleared.name || cleared.notes || Object.values(cleared.assignments).some((ids) => ids?.length)) cells[key] = cleared;
			else delete cells[key];
		}
	}
	return { ...map, cells };
}

export function toggleMapPath(map: CampaignMap, key: string): CampaignMap {
	if (!mapKey(key)) throw new Error('Choose a cell inside the 20 × 10 map.');
	const previous = map.cells[key] ?? { key, paint: '' as const, path: false, name: '', assignments: {} };
	return { ...map, cells: { ...map.cells, [key]: { ...previous, path: !previous.path } } };
}

export function updateMapCell(map: CampaignMap, key: string, update: Partial<Pick<MapCell, 'name' | 'notes' | 'assignments'>>): CampaignMap {
	if (!mapKey(key)) throw new Error('Choose a cell inside the 20 × 10 map.');
	const previous = map.cells[key] ?? { key, paint: '' as const, path: false, name: '', assignments: {} };
	return { ...map, cells: { ...map.cells, [key]: { ...previous, ...update, assignments: update.assignments ? { ...previous.assignments, ...update.assignments } : previous.assignments } } };
}

/** A record has one map position; assigning it again moves it without disturbing co-located records. */
export function assignMapRecord(map: CampaignMap, key: string, kind: MapRecordKind, id: string): CampaignMap {
	if (!mapKey(key)) throw new Error('Choose a cell inside the 20 × 10 map.');
	if (!kinds.has(kind) || !id.trim()) throw new Error('Choose a campaign record to place.');
	const cells = { ...map.cells };
	for (const [position, cell] of Object.entries(cells)) {
		if (cell.assignments[kind]?.includes(id)) {
			if (position === key) continue;
			const assignments = { ...cell.assignments, [kind]: cell.assignments[kind]!.filter((value) => value !== id) };
			if (position !== key && !cell.paint && !cell.path && !cell.name && !cell.notes && !Object.values(assignments).some((ids) => ids?.length)) delete cells[position];
			else cells[position] = { ...cell, assignments };
		}
	}
	const current = cells[key] ?? { key, paint: '' as const, path: false, name: '', assignments: {} };
	cells[key] = { ...current, assignments: { ...current.assignments, [kind]: [...new Set([...(current.assignments[kind] ?? []), id])] } };
	return { ...map, cells };
}

export function removeMapRecord(map: CampaignMap, key: string, kind: MapRecordKind, id: string): CampaignMap {
	const cell = map.cells[key];
	if (!cell || !kinds.has(kind)) return map;
	const assignments = { ...cell.assignments, [kind]: (cell.assignments[kind] ?? []).filter((value) => value !== id) };
	const cells = { ...map.cells };
	if (!cell.paint && !cell.path && !cell.name && !cell.notes && !Object.values(assignments).some((ids) => ids?.length)) delete cells[key];
	else cells[key] = { ...cell, assignments };
	return { ...map, cells };
}

export function moveCampaignMap(maps: CampaignMap[], id: string, direction: 'up' | 'down'): CampaignMap[] {
	const index = maps.findIndex((map) => map.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= maps.length) return maps;
	const next = [...maps];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}
