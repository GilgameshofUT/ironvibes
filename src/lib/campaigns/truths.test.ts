import { describe, expect, it } from 'vitest';
import { bundledRecords } from '../datasworn/packs';
import { extractTruthCardOptions, formatTruthSelectionText, parseCampaignTruths, removeCampaignTruth, rollTruthOption, rollTruthSuboption, saveCampaignTruth, type CampaignTruthDraft } from './truths';

const oldWorld: CampaignTruthDraft = {
	recordId: 'truth:classic/old_world', category: 'The Old World', value: 'The clans invaded.', optionDescription: 'The clans drove us from home.',
	optionId: 'truth.option:classic/old_world/1', sourceTitle: 'Ironsworn Rulebook', sourceUrl: 'https://example.test', custom: false
};

describe('campaign truths', () => {
	it('saves one selected or customized value per Datasworn truth category', () => {
		const first = saveCampaignTruth([], oldWorld, 'truth-1', 'created');
		const edited = saveCampaignTruth(first, { ...oldWorld, value: 'The clans invaded, but we survived.' }, 'unused', 'edited');
		expect(first[0]).toMatchObject({ id: 'truth-1', value: 'The clans invaded.', createdAt: 'created' });
		expect(edited).toHaveLength(1);
		expect(edited[0]).toMatchObject({ id: 'truth-1', value: 'The clans invaded, but we survived.', createdAt: 'created', updatedAt: 'edited' });
	});

	it('adds and removes custom campaign truths', () => {
		const custom = saveCampaignTruth([], { recordId: '', category: 'The northern pass', value: 'It is closed by winter.', optionId: '', optionDescription: '', sourceTitle: '', sourceUrl: '', custom: true }, 'custom-1', 'created');
		expect(custom[0].custom).toBe(true);
		expect(removeCampaignTruth(custom, 'custom-1')).toEqual([]);
	});

	it('validates content and safely restores browser storage', () => {
		expect(() => saveCampaignTruth([], { ...oldWorld, category: ' ' })).toThrow(/label/);
		expect(() => saveCampaignTruth([], { ...oldWorld, value: ' ' })).toThrow(/truth/);
		const valid = saveCampaignTruth([], oldWorld, 'truth-1', 'created')[0];
		expect(parseCampaignTruths(JSON.stringify([valid, null, { ...valid, id: '' }]))).toEqual([valid]);
		expect(parseCampaignTruths('{invalid')).toEqual([]);
	});

	it('extracts canonical options and suboptions from Datasworn truth records and rolls d100 inline', () => {
		const cataclysm = bundledRecords.find((r) => r.type === 'truth' && r.packId === 'starforged' && r.name === 'Cataclysm');
		expect(cataclysm).toBeTruthy();
		const options = extractTruthCardOptions(cataclysm!);
		expect(options).toHaveLength(3);
		expect(options[0]?.suboptions.length).toBeGreaterThan(0);
		expect(options[0]?.description).not.toContain('{{table>');
		const rolledOpt = rollTruthOption(options, () => 0);
		expect(rolledOpt?.option.label).toContain('Sun Plague');
		const rolledSub = rollTruthSuboption(rolledOpt!.option.suboptions, () => 0);
		expect(rolledSub?.suboption.label).toContain('Temporal distortions');
		const combined = formatTruthSelectionText(rolledOpt!.option, rolledSub!.suboption);
		expect(combined).toContain('Sun Plague');
		expect(combined).toContain('Temporal distortions');
	});
});
