import { describe, expect, it } from 'vitest';
import { convertHeroToNpc, convertNpcToHero, exportCampaignRecord, makeCampaignRecord, moveCampaignRecord, parseCampaignRecords, removeCampaignRecord, updateCampaignRecord } from './records';

describe('campaign heroes and NPCs', () => {
	it('creates, validates, and restores campaign records', () => {
		const hero = makeCampaignRecord('hero', { Name: '  Audit Hero  ', Origin: 'Ironsworn' }, 'hero-1', 'created');
		const npc = makeCampaignRecord('npc', { Name: 'Guide' }, 'npc-1', 'created');
		expect(hero.fields.Name).toBe('Audit Hero');
		expect(hero.stats).toMatchObject({ momentum: 2, health: 5, edge: 1, wits: 1 });
		expect(parseCampaignRecords(JSON.stringify([hero, npc, null, { ...npc, stats: { ...npc.stats, health: 99 } }]))).toEqual([hero, npc]);
		expect(parseCampaignRecords(JSON.stringify([hero, npc]), 'hero')).toEqual([hero]);
		expect(parseCampaignRecords('{broken')).toEqual([]);
		expect(() => makeCampaignRecord('hero', { Name: '  ' })).toThrow(/name/i);
		expect(parseCampaignRecords(JSON.stringify([JSON.parse(exportCampaignRecord(hero))]))).toEqual([hero]);
	});

	it('edits, reorders, converts, and deletes by ID', () => {
		const first = makeCampaignRecord('hero', { Name: 'Hero' }, 'hero', 'created');
		const second = makeCampaignRecord('npc', { Name: 'Guide' }, 'npc', 'created');
		expect(updateCampaignRecord([first], first.id, { stats: { ...first.stats, health: 3 } }, 'updated')[0]).toMatchObject({ stats: { health: 3 }, updatedAt: 'updated' });
		expect(moveCampaignRecord([first, second], second.id, 'up').map((item) => item.id)).toEqual(['npc', 'hero']);
		expect(convertNpcToHero([first, second], second.id, 'converted')[1]).toMatchObject({ kind: 'hero', updatedAt: 'converted' });
		expect(convertHeroToNpc([first, second], first.id, 'converted')[0]).toMatchObject({ kind: 'npc', updatedAt: 'converted' });
		expect(removeCampaignRecord([first, second], first.id)).toEqual([second]);
	});
});
