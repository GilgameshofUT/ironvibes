import { describe, expect, it } from 'vitest';
import { deleteCampaign, makeCampaign, parseCampaigns, putCampaign } from './store';

describe('campaign storage', () => {
	it('creates a named campaign with separate setting and character rules', () => {
		const campaign = makeCampaign({
			name: '  Isles test  ',
			setting: 'sundered-isles',
			characterRuleset: 'starforged'
		}, 'campaign-1', '2026-11-04T00:00:00.000Z');

		expect(campaign).toEqual({
			id: 'campaign-1', name: 'Isles test', setting: 'sundered-isles',
			characterRuleset: 'starforged', createdAt: '2026-11-04T00:00:00.000Z',
			updatedAt: '2026-11-04T00:00:00.000Z'
		});
		expect(() => makeCampaign({ name: '  ', setting: 'ironsworn', characterRuleset: 'ironsworn' }, 'id', 'now'))
			.toThrow(/campaign name/);
	});

	it('round-trips valid local campaigns and ignores invalid data', () => {
		const campaign = makeCampaign({ name: 'Test', setting: 'starforged', characterRuleset: 'starforged' }, 'one', 'now');
		expect(parseCampaigns(JSON.stringify([campaign, { ...campaign, id: '' }, null]))).toEqual([campaign]);
		expect(parseCampaigns('{broken')).toEqual([]);
		expect(parseCampaigns(JSON.stringify({ campaign }))).toEqual([]);
	});

	it('updates a campaign by id and deletes only the selected campaign', () => {
		const one = makeCampaign({ name: 'One', setting: 'ironsworn', characterRuleset: 'ironsworn' }, 'one', 'now');
		const two = makeCampaign({ name: 'Two', setting: 'starforged', characterRuleset: 'starforged' }, 'two', 'now');
		const updated = { ...one, name: 'Renamed' };
		expect(putCampaign([one, two], updated)).toEqual([two, updated]);
		expect(deleteCampaign([one, two], 'one')).toEqual([two]);
	});
});
