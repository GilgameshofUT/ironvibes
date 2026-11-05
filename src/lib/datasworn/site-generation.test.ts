import { describe, expect, it } from 'vitest';
import { flattenDataswornPack, type DataswornPack } from './catalog';
import { rollDelveAreaEntry, rollExplorationOracle, rollSiteField, readableOracleText, rollSiteName, rollTypedSiteField } from './site-generation';
import delve from '@datasworn-community/ironsworn-classic-delve';
import starforged from '@datasworn-community/starforged';
import isles from '@datasworn-community/sundered-isles';

const records = flattenDataswornPack(delve as unknown as DataswornPack);
const typedRecords = [...flattenDataswornPack(starforged as unknown as DataswornPack), ...flattenDataswornPack(isles as unknown as DataswornPack)];

describe('Datasworn Delve site generation', () => {
	it('resolves the bundled theme/domain tables to readable names', () => {
		expect(rollSiteField('theme', records, () => 0)).toBe('Ancient');
		expect(rollSiteField('domain', records, () => 0)).toBe('Barrow');
		expect(rollSiteField('secondaryTheme', records, () => 0)).toBe('Ancient');
	});
	it('uses the field-specific name and feature tables', () => {
		expect(rollSiteField('description', records, () => 0)).toBe('Deep');
		expect(rollSiteField('detail', records, () => 0)).toBe('Blight');
		expect(rollSiteField('aspectFocus', records, () => 0)).toBe('Attack');
		expect(rollSiteName({ description: 'Deep', place: 'Barrow', detail: 'Blight', namesake: 'Kajir' }, records, () => 0)).toBe('Deep Barrow');
		expect(rollSiteName({ description: 'Deep', place: 'Barrow', detail: 'Blight', namesake: 'Kajir' }, records, () => 0.82)).toBe("Kajir's Barrow");
	});
	it('rejects unavailable tables without writing a fabricated result', () => {
		expect(() => rollSiteField('theme', [], () => 0)).toThrow(/No enabled Datasworn table/);
		expect(() => rollSiteName({ description: 'Deep', place: '', detail: '', namesake: '' }, records, () => 0)).toThrow(/ingredients/);
	});
	it('uses a later imported table with the same Datasworn ID', () => {
		const table = records.find((record) => record.id === 'oracle_rollable:delve/site_nature/theme')!;
		const imported = { ...table, packId: 'custom', data: { ...table.data, rows: [{ roll: { min: 1, max: 100 }, text: 'Custom theme' }] } };
		expect(rollSiteField('theme', [...records, imported], () => 0)).toBe('Custom theme');
	});
	it('rolls type-specific Starforged and Sundered Isles site fields', () => {
		for (const [type, field] of [['Derelict', 'location'], ['Vault', 'scale'], ['Shipwreck', 'wholeness'], ['Cave', 'caveType'], ['Ruin', 'scope']] as const) {
			expect(rollTypedSiteField(type, field, typedRecords, () => 0).length).toBeGreaterThan(0);
		}
		expect(() => rollTypedSiteField('Ruin', 'name', typedRecords, () => 0)).toThrow(/Enter this value manually/);
	});
	it('uses Delve theme and domain feature/danger ranges', () => {
		expect(rollDelveAreaEntry('feature', 'Ancient', 'Barrow', records, () => 0)).toBe('Evidence of lost knowledge');
		expect(rollDelveAreaEntry('feature', 'Ancient', 'Barrow', records, () => 0.21)).toBe('Burial chambers');
		expect(rollDelveAreaEntry('danger', 'Ancient', 'Barrow', records, () => 0)).toBe('Ancient trap');
		expect(rollDelveAreaEntry('feature', 'Fortified', 'Shadowfen', records, () => 0).length).toBeGreaterThan(0);
		expect(rollDelveAreaEntry('feature', 'Fortified', 'Shadowfen', records, () => 0.5).length).toBeGreaterThan(0);
		expect(() => rollDelveAreaEntry('feature', 'Not imported', 'Shadowfen', records, () => 0)).toThrow(/No enabled/);
	});
	it('rolls mapped non-Delve exploration tables without inventing unavailable tables', () => {
		expect(rollExplorationOracle('oracle_rollable:starforged/derelict/access/area', typedRecords, () => 0)).toBe('Corridor');
		expect(rollExplorationOracle('oracle_rollable:sundered_isles/cave/inland_cave/heart', typedRecords, () => 0).length).toBeGreaterThan(0);
		expect(() => rollExplorationOracle('oracle_rollable:sundered_isles/shipwreck/zone', typedRecords, () => 0)).toThrow(/Enter the value manually/);
	});
	it('keeps plain text while removing Datasworn link targets', () => {
		expect(readableOracleText('[Ancient](datasworn:delve_site_theme:delve/ancient)')).toBe('Ancient');
	});
});
