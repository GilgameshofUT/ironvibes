import { describe, expect, it } from 'vitest';
import { assignMapRecord, fillMapPaint, makeCampaignMap, mapPaintTile, MAP_PAINTS, MAP_TERRAIN_GROUPS, moveCampaignMap, paintMapCell, parseCampaignMaps, putCampaignMap, removeCampaignMap, removeMapRecord, toggleMapPath, updateCampaignMap, updateMapCell } from './maps';

describe('campaign maps', () => {
	it('creates, parses, and rejects invalid map data', () => {
		const map = makeCampaignMap('Audit map', 'map-1', 'created');
		expect(map).toMatchObject({ id: 'map-1', name: 'Audit map', showNames: false, cells: {} });
		expect(parseCampaignMaps(JSON.stringify([map, null, { ...map, cells: { bad: { key: 'bad', paint: 'lava', path: false, name: '', assignments: {} } } }]))).toEqual([map]);
		expect(parseCampaignMaps('bad')).toEqual([]);
		expect(() => makeCampaignMap('  ')).toThrow(/name/i);
	});

	it('updates paint, paths, names and assignments without mutating prior state', () => {
		const map = makeCampaignMap('Atlas', 'map-1', 'created');
		const painted = paintMapCell(map, '3:4', 'water');
		const pathed = toggleMapPath(painted, '3:4');
		const assigned = updateMapCell(pathed, '3:4', { name: 'Grey Harbor', assignments: { location: ['loc-1'], site: ['site-1'] } });
		expect(map.cells).toEqual({});
		expect(assigned.cells['3:4']).toMatchObject({ paint: 'water', path: true, name: 'Grey Harbor', assignments: { location: ['loc-1'], site: ['site-1'] } });
		expect(parseCampaignMaps(JSON.stringify([assigned]))).toEqual([assigned]);
		expect(parseCampaignMaps(JSON.stringify(assigned))).toEqual([assigned]);
		expect(updateCampaignMap([assigned], 'map-1', { showNames: true }, 'updated')[0]).toMatchObject({ showNames: true, updatedAt: 'updated' });
	});

	it('reorders, replaces, and removes maps by ID', () => {
		const first = makeCampaignMap('First', 'first', 'created');
		const second = makeCampaignMap('Second', 'second', 'created');
		expect(moveCampaignMap([first, second], 'second', 'up').map((map) => map.id)).toEqual(['second', 'first']);
		expect(putCampaignMap([first, second], { ...first, name: 'Renamed' })).toHaveLength(2);
		expect(removeCampaignMap([first, second], 'first')).toEqual([second]);
	});
	it('retains all terrain types and fills the map without losing assigned records', () => {
		expect(MAP_PAINTS).toHaveLength(26);
		expect(MAP_TERRAIN_GROUPS).toHaveLength(12);
		expect(new Set(MAP_TERRAIN_GROUPS.flatMap(({ choices }) => choices.map(({ paint }) => paint)))).toEqual(new Set(MAP_PAINTS));
		expect(mapPaintTile('grassland').image).toContain('terrain-atlas.png');
		expect(mapPaintTile('grassland')).toMatchObject({ x: '0%', y: '0%' });
		expect(mapPaintTile('grassland', 'bw').image).toContain('terrain-atlas-bw.png');
		expect(mapPaintTile('grassland', 'bw')).toMatchObject({ x: '0%', y: '0%' });
		expect(mapPaintTile('grassland', 'painted').image).toContain('terrain-atlas-painted.png');
		expect(mapPaintTile('grassland', 'painted')).toMatchObject({ x: '0%', y: '0%' });
		expect(mapPaintTile('forest2').image).toContain('terrain-variants.png');
		expect(mapPaintTile('forest2')).toMatchObject({ x: '0%', y: '0%' });
		expect(mapPaintTile('forest2', 'bw').image).toContain('terrain-variants-bw.png');
		expect(mapPaintTile('special7').image).toContain('terrain-variants.png');
		expect(mapPaintTile('special7')).toMatchObject({ x: '33.333333333333336%', y: '100%' });
		const hexStyled = updateCampaignMap([makeCampaignMap('Hex Atlas', 'hex-1', 'created')], 'hex-1', { gridShape: 'hex', tileStyle: 'classic' }, 'updated');
		expect(parseCampaignMaps(JSON.stringify(hexStyled))[0]).toMatchObject({ gridShape: 'hex', tileStyle: 'classic' });
		const map = updateMapCell(toggleMapPath(paintMapCell(makeCampaignMap('Atlas'), '3:4', 'water'), '3:4'), '3:4', { assignments: { site: ['site-1'] } });
		for (const paint of MAP_PAINTS) expect(parseCampaignMaps(JSON.stringify([paintMapCell(map, '0:0', paint)]))).toHaveLength(1);
		const unpainted = fillMapPaint(map, 'forest1', 'unpainted');
		expect(Object.keys(unpainted.cells)).toHaveLength(200);
		expect(unpainted.cells['3:4']).toEqual(map.cells['3:4']);
		const filled = fillMapPaint(unpainted, 'hills1', 'all');
		expect(filled.cells['3:4']).toMatchObject({ paint: 'hills1', path: true, assignments: { site: ['site-1'] } });
		expect(parseCampaignMaps(JSON.stringify([filled]))).toEqual([filled]);
		const cleared = fillMapPaint(filled, '', 'all');
		expect(cleared.cells['3:4']).toMatchObject({ paint: '', path: true, assignments: { site: ['site-1'] } });
		expect(Object.keys(cleared.cells)).toEqual(['3:4']);
		expect(parseCampaignMaps(JSON.stringify([cleared]))).toEqual([cleared]);
		const pathOnly = toggleMapPath(makeCampaignMap('Blank'), '2:2');
		expect(pathOnly.cells['2:2'].paint).toBe('');
		expect(fillMapPaint(pathOnly, 'snowland', 'unpainted').cells['2:2']).toMatchObject({ paint: 'snowland', path: true });
	});
	it('migrates single-ID saves and moves a record between cells while retaining co-located records', () => {
		const original = makeCampaignMap('Older map', 'old', 'created');
		const old = { ...original, cells: { '0:0': { key: '0:0', paint: 'water', path: true, name: '', assignments: { location: 'l1' } } } };
		const migrated = parseCampaignMaps(JSON.stringify([old]))[0];
		expect(migrated.cells['0:0'].assignments.location).toEqual(['l1']);
		const together = assignMapRecord(assignMapRecord(migrated, '0:0', 'location', 'l2'), '0:0', 'site', 's1');
		expect(together.cells['0:0'].assignments).toEqual({ location: ['l1', 'l2'], site: ['s1'] });
		const moved = assignMapRecord(together, '1:0', 'location', 'l1');
		expect(moved.cells['0:0']).toMatchObject({ paint: 'water', path: true, assignments: { location: ['l2'], site: ['s1'] } });
		expect(moved.cells['1:0'].assignments.location).toEqual(['l1']);
		expect(removeMapRecord(moved, '0:0', 'location', 'l2').cells['0:0'].assignments.location).toEqual([]);
		expect(removeMapRecord(moved, '1:0', 'location', 'l1').cells['1:0']).toBeUndefined();
		expect(assignMapRecord(assignMapRecord(makeCampaignMap('Sparse'), '0:0', 'location', 'l1'), '1:0', 'location', 'l1').cells['0:0']).toBeUndefined();
		expect(parseCampaignMaps(JSON.stringify([moved]))).toEqual([moved]);
	});
});
