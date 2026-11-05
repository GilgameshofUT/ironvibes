import { describe, expect, it } from 'vitest';
import { makeCampaign } from './store';
import { makeCampaignArchive, parseCampaignArchive, parseCampaignImports } from './archive';
import { makeJournalEntry } from './journal';
import { makeCampaignRecord } from './records';
import { blankTheme, validateTheme } from './themes';

const campaign = makeCampaign({ name: 'Archive test', setting: 'starforged', characterRuleset: 'starforged' }, 'campaign-1', '2026-01-01T00:00:00.000Z');

describe('campaign archives', () => {
	it('round-trips a complete campaign with journal and records', () => {
		const archive = makeCampaignArchive({
			campaign, journal: [makeJournalEntry('The crew found a signal.', 'entry-1', '2026-01-02T00:00:00.000Z')],
			tracks: [], records: [makeCampaignRecord('hero', { Name: 'Rook' }, 'hero-1')],
			sites: [], factions: [], locations: [], maps: [], truths: []
		});
		expect(parseCampaignArchive(JSON.stringify(archive))).toEqual(archive);
		expect(parseCampaignArchive(JSON.stringify({ ...archive, assets: undefined })).assets).toEqual([]);
		const theme = blankTheme('Ironsworn theme'); theme.name = 'Forgotten'; theme.description = 'Lost trails';
		theme.features.forEach((row) => { row.text = 'Trail'; }); theme.dangers.forEach((row) => { row.text = 'Hazard'; });
		const themed = makeCampaignArchive({ ...archive, themes: [validateTheme(theme)] });
		expect(parseCampaignArchive(JSON.stringify(themed)).themes).toEqual(themed.themes);
	});

	it('rejects invalid JSON, unsupported formats, and malformed nested data', () => {
		expect(() => parseCampaignArchive('{')).toThrow('not valid JSON');
		expect(() => parseCampaignArchive(JSON.stringify({ format: 'other', version: 1 }))).toThrow('not supported');
		const archive = makeCampaignArchive({ campaign, journal: [], tracks: [], records: [], sites: [], factions: [], locations: [], maps: [], truths: [] });
		expect(() => parseCampaignArchive(JSON.stringify({ ...archive, records: [{ id: 'bad' }] }))).toThrow('invalid records');
		expect(() => parseCampaignArchive(JSON.stringify({ ...archive, maps: undefined }))).toThrow('missing its maps');
		expect(() => parseCampaignArchive(JSON.stringify({ ...archive, assets: [{ id: 'bad' }] }))).toThrow('invalid assets');
	});

	it('imports a native Pocketforge campaigns JSON array', () => {
		const pfJson = JSON.stringify([
			{
				id: 'pf-1',
				created: 1700000000000,
				name: 'Pocketforge Voyage',
				type: 'isles',
				rules: 'starforged',
				journal: { entries: [{ id: 'j-1', content: '<p>Set sail at dawn.</p>' }], wip: null },
				heroes: [{ id: 'h-1', origin: 'isles', name: 'Vane', role: 'Captain' }],
				npcs: [{ id: 'n-1', origin: 'isles', name: 'Maren', characterType: 'NPC' }],
				tracks: [{ id: 't-1', name: 'Find the charts', type: 'Progress', rank: 'Formidable' }],
				sites: [],
				locations: [],
				factions: []
			}
		]);
		const imported = parseCampaignImports(pfJson);
		expect(imported).toHaveLength(1);
		expect(imported[0]?.campaign).toMatchObject({ name: 'Pocketforge Voyage', setting: 'sundered-isles', characterRuleset: 'starforged' });
		expect(imported[0]?.journal[0]?.text).toBe('Set sail at dawn.');
		expect(imported[0]?.records).toHaveLength(2);
		expect(imported[0]?.tracks[0]?.name).toBe('Find the charts');
	});
});
