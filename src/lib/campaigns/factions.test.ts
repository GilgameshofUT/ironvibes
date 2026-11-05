import { describe, expect, it } from 'vitest';
import { makeCampaignFaction, moveCampaignFaction, parseCampaignFactions, putCampaignFaction, removeCampaignFaction, updateCampaignFaction } from './factions';

describe('campaign factions', () => {
	it('validates faction names and restores supported campaign data', () => {
		const faction = makeCampaignFaction({
			origin: 'Sundered Isles', type: 'Society', fields: { name: 'The Wayfinders', societyChronicles: 'Founded after the storm' }
		}, 'faction-1', 'created');
		expect(faction.fields).toMatchObject({ name: 'The Wayfinders', societyChronicles: 'Founded after the storm', societyIdentity: '' });
		expect(parseCampaignFactions(JSON.stringify([faction, null, { ...faction, origin: 'Ironsworn' }]))).toEqual([faction]);
		expect(parseCampaignFactions('{bad')).toEqual([]);
		expect(() => makeCampaignFaction({ origin: 'Starforged', fields: { name: '  ' } })).toThrow(/name/i);
	});

	it('updates fields and cursed settings, reorders, replaces, and removes by ID', () => {
		const first = makeCampaignFaction({ origin: 'Starforged', type: 'Society', fields: { name: 'Wayfinders' } }, 'first', 'created');
		const second = makeCampaignFaction({ origin: 'Sundered Isles', fields: { name: 'Corsairs' } }, 'second', 'created');
		expect(updateCampaignFaction([first], first.id, {
			forceCursed: true, rollWithCursedDie: true, fields: { societyIdentity: 'Keepers of the beacon' }
		}, 'updated')[0]).toMatchObject({ forceCursed: true, rollWithCursedDie: true, fields: { name: 'Wayfinders', societyIdentity: 'Keepers of the beacon' }, updatedAt: 'updated' });
		expect(moveCampaignFaction([first, second], second.id, 'up').map((faction) => faction.id)).toEqual(['second', 'first']);
		expect(putCampaignFaction([first, second], { ...first, type: 'Cursed' })).toHaveLength(2);
		expect(removeCampaignFaction([first, second], first.id)).toEqual([second]);
	});
});
