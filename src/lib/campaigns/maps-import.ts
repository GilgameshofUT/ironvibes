import { createId } from '../id';
import { MAP_PAINTS, type CampaignMap, type MapCell, type MapPaint, type MapRecordKind } from './maps';

type KnownRecords = Record<MapRecordKind, ReadonlySet<string>>;
type JsonObject = Record<string, unknown>;

function object(value: unknown): value is JsonObject {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Convert a published Pocketforge map export without accepting its IDs as Ironvibes map IDs. */
export function parsePocketforgeMap(serialized: string, known: KnownRecords, now = new Date().toISOString()): { map: CampaignMap; omittedReferences: number } {
	let data: unknown;
	try { data = JSON.parse(serialized); } catch { throw new Error('The map file is not valid JSON.'); }
	if (!object(data) || typeof data.id !== 'string' || !data.id || typeof data.name !== 'string' || !data.name.trim() || typeof data.hasNames !== 'boolean' ||
		!['ironsworn', 'starforged', 'isles'].includes(String(data.origin)) || typeof data.region !== 'string' || !Array.isArray(data.factions) || typeof data.notes !== 'string' || !Array.isArray(data.cells) || data.cells.length !== 200) {
		throw new Error('Choose valid Ironvibes map data or a 20 × 10 Pocketforge map export.');
	}
	const cells: CampaignMap['cells'] = {};
	const seenCells = new Set<string>();
	let omittedReferences = 0;
	const seenRecords: Record<MapRecordKind, Set<string>> = { location: new Set(), site: new Set(), character: new Set() };
	const paints = new Set<string>(MAP_PAINTS);
	for (const value of data.cells) {
		if (!object(value) || !Number.isInteger(value.x) || !Number.isInteger(value.y) || (value.x as number) < 0 || (value.x as number) >= 20 ||
			(value.y as number) < 0 || (value.y as number) >= 10 || typeof value.type !== 'string' || (value.type !== '' && !paints.has(value.type)) ||
			typeof value.id !== 'string' || !value.id || typeof value.isActive !== 'boolean' || typeof value.notes !== 'string' ||
			(value.isChartedPath !== undefined && typeof value.isChartedPath !== 'boolean') ||
			!['locations', 'sites', 'characters'].every((kind) => Array.isArray(value[kind]) && (value[kind] as unknown[]).every((id) => typeof id === 'string'))) {
			throw new Error('The Pocketforge map contains invalid cell data or an unsupported terrain type.');
		}
		const key = `${value.x}:${value.y}`;
		if (seenCells.has(key)) throw new Error('The Pocketforge map contains duplicate cell coordinates.');
		seenCells.add(key);
		const assignments: MapCell['assignments'] = {};
		for (const [field, kind] of [['locations', 'location'], ['sites', 'site'], ['characters', 'character']] as const) {
			const selected: string[] = [];
			for (const id of value[field] as string[]) {
				if (!known[kind].has(id) || seenRecords[kind].has(id)) { omittedReferences++; continue; }
				selected.push(id);
				seenRecords[kind].add(id);
			}
			if (selected.length) assignments[kind] = selected;
		}
		if (value.type || value.isChartedPath || Object.keys(assignments).length || value.notes) {
			cells[key] = { key, paint: value.type as MapPaint | '', path: value.isChartedPath === true, name: '', notes: value.notes, assignments };
		}
	}
	if (seenCells.size !== 200) throw new Error('The Pocketforge map is missing grid cells.');
	return {
		map: { id: createId(), name: data.name.trim(), origin: data.origin as string, region: data.region, notes: data.notes, background: '', factionInfluence: '', showNames: data.hasNames, cells, createdAt: now, updatedAt: now },
		omittedReferences
	};
}
