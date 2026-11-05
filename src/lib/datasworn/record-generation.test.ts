import { describe, expect, it } from 'vitest';
import classic from '@datasworn-community/ironsworn-classic/json/classic.json';
import starforged from '@datasworn-community/starforged/json/starforged.json';
import isles from '@datasworn-community/sundered-isles/json/sundered_isles.json';
import { flattenDataswornPack } from './catalog';
import { generateCreatureField, generateFactionFields, generateLifeEvents, generateRecordField, generationFields, rollFantasySpecies } from './record-generation';

const records = [classic, starforged, isles].flatMap((pack) => flattenDataswornPack(pack));

describe('record field generation', () => {
	it('resolves enabled origin-specific character, faction and place rolls into editable text', () => {
		for (const [kind, origin, field] of [
			['character','Ironsworn','Name'], ['character','Starforged','Role'], ['character','Sundered Isles','Trademark weapons'],
			['faction','Starforged','influence'], ['faction','Sundered Isles','societyChronicles'],
			['location','Starforged','settlementName'], ['location','Sundered Isles','aesthetics']
		] as const) {
			const result = generateRecordField(kind, origin, field, records, {}, () => 0);
			expect(result.length).toBeGreaterThan(0);
			expect(result).not.toContain('datasworn:');
		}
	});
	it('offers matching tables for non-settlement location types (Ship, Island, Planet, Star, Starship, Waypoint)', () => {
		expect(generationFields('location','Sundered Isles','Ship')).toMatchObject({ settlementName: 'sundered_isles/ship/name', firstLook: 'sundered_isles/ship/first_look' });
		expect(generationFields('location','Ironsworn','Waypoint')).toMatchObject({ settlementName: 'classic/place/location', description: 'classic/place/descriptor' });
		expect(generateRecordField('location','Ironsworn','settlementName',records,{},() => 0)).not.toMatch(/Envision|feature of the landscape/);
	});
	it('uses the settlement population table for the selected Starforged region', () => {
		expect(generateRecordField('location','Starforged','population',records,{ region: 'Terminus' },() => 0)).toBe('Few');
		expect(generateRecordField('character','Starforged','Backstory',records,{},() => 0)).toContain('kin');
	});
	it('composes faction names for both Starforged and Sundered Isles and refuses unavailable tables', () => {
		expect(generateRecordField('faction','Starforged','name',records,{},() => 0)).not.toContain('datasworn:');
		expect(generateRecordField('faction','Sundered Isles','name',records,{},() => 0)).toBeTruthy();
		expect(() => generateRecordField('character','Starforged','Name',[])).toThrow('No enabled Datasworn');
	});
	it('uses the rolled faction type to select only applicable Sundered Isles details', () => {
		const society = generateFactionFields('Sundered Isles', records, {}, () => 0);
		expect(society.type).toBe('Society');
		expect(society.societyChronicles).toBeTruthy();
		expect(society.cursedRole).toBeUndefined();
		const cursed = generateFactionFields('Sundered Isles', records, { cursed: true }, () => 0);
		expect(cursed.cursedRole).toBeTruthy();
	});
	it('rolls fantasy species, life events, motivations, and creature NPC fields', () => {
		expect(rollFantasySpecies(() => 0)).toBe('Human');
		expect(generateLifeEvents(2, 'Starforged', records, () => 0)).toContain(':');
		expect(generateRecordField('character', 'Ironsworn', 'Motivations', records, {}, () => 0)).toContain(',');
		expect(generateCreatureField('Scale', records, 'Land', () => 0)).toBeTruthy();
	});
});
