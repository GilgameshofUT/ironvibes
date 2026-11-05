import { describe, expect, it } from 'vitest';
import { parsePocketforgeMap } from './maps-import';
import { parseCampaignMaps } from './maps';

const known = { location: new Set(['l1', 'l2']), site: new Set(['s1']), character: new Set(['c1']) };

function fixture() {
	return {
		id: 'source-map', origin: 'ironsworn', name: 'Audit region', region: 'terminus', hasNames: true, factions: [], notes: '',
		cells: Array.from({ length: 20 }, (_, x) => Array.from({ length: 10 }, (_, y) => ({
			x, y, r: 1, id: `${x}-${y}`, isActive: false, type: '', locations: [], sites: [], characters: [], notes: '', isChartedPath: false
		}))).flat()
	};
}

describe('Pocketforge map import', () => {
	it('converts grid cells while keeping only matching local campaign references', () => {
		const source = fixture();
		source.cells[0] = { ...source.cells[0], type: 'water', isChartedPath: true, notes: 'Storm crossing', locations: ['l1', 'l2', 'missing'] as never, sites: ['s1'] as never };
		source.cells[1] = { ...source.cells[1], type: 'forest2', locations: ['l1'] as never, characters: ['c1'] as never };
		const { map, omittedReferences } = parsePocketforgeMap(JSON.stringify(source), known, 'created');
		expect(map).toMatchObject({ name: 'Audit region', origin: 'ironsworn', region: 'terminus', showNames: true, background: '', factionInfluence: '', createdAt: 'created' });
		expect(map.id).not.toBe(source.id);
		expect(map.cells['0:0']).toMatchObject({ paint: 'water', path: true, notes: 'Storm crossing', assignments: { location: ['l1', 'l2'], site: ['s1'] } });
		expect(map.cells['0:1']).toMatchObject({ paint: 'forest2', assignments: { character: ['c1'] } });
		expect(Object.keys(map.cells)).toHaveLength(2);
		expect(omittedReferences).toBe(2);
		expect(parseCampaignMaps(JSON.stringify([map]))).toEqual([map]);
	});
	it('rejects incomplete, duplicate, malformed and unknown terrain map cells', () => {
		const source = fixture();
		expect(() => parsePocketforgeMap('{', known)).toThrow('not valid JSON');
		expect(() => parsePocketforgeMap(JSON.stringify({ ...source, cells: source.cells.slice(1) }), known)).toThrow('20 × 10');
		source.cells[1].x = 0;
		source.cells[1].y = 0;
		expect(() => parsePocketforgeMap(JSON.stringify(source), known)).toThrow('duplicate');
		source.cells[1].y = 1;
		source.cells[1].type = 'unrecognized';
		expect(() => parsePocketforgeMap(JSON.stringify(source), known)).toThrow('unsupported terrain');
		source.cells[1].type = '';
		(source.cells[1] as unknown as { sites: unknown }).sites = [42];
		expect(() => parsePocketforgeMap(JSON.stringify(source), known)).toThrow('invalid cell');
	});
});
