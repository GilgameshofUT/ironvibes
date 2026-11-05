import { describe, expect, it } from 'vitest';
import { makeCampaignLocation, moveCampaignLocation, parseCampaignLocations, putCampaignLocation, removeCampaignLocation, updateCampaignLocation } from './locations';

describe('campaign locations', () => {
	it('validates and restores supported origins and fields', () => {
		const location = makeCampaignLocation({ origin: 'Starforged', type: 'Terminus', fields: { settlementName: 'Terminus Smoke', initialContact: 'A passing ship' } }, 'location-1', 'created');
		expect(location.fields).toMatchObject({ settlementName: 'Terminus Smoke', initialContact: 'A passing ship', focus: '' });
		expect(parseCampaignLocations(JSON.stringify([location, null, { ...location, origin: 'Unknown' }]))).toEqual([location]);
		expect(parseCampaignLocations(JSON.stringify([{ ...location, region: undefined }]))).toHaveLength(1);
		expect(parseCampaignLocations(JSON.stringify([{ ...location, region: 123 }]))).toEqual([]);
		expect(parseCampaignLocations('bad')).toEqual([]);
		expect(() => makeCampaignLocation({ origin: 'Ironsworn', type: 'Settled Lands', fields: { settlementName: ' ' } })).toThrow(/name/i);
	});

	it('updates, reorders, replaces and removes location records', () => {
		const first = makeCampaignLocation({ origin: 'Ironsworn', type: 'Settled Lands', fields: { settlementName: 'Stonecross' } }, 'first', 'created');
		const second = makeCampaignLocation({ origin: 'Sundered Isles', type: 'Myriads', fields: { settlementName: 'Stormchain' } }, 'second', 'created');
		const island = makeCampaignLocation({ origin: 'Sundered Isles', type: 'Island', region: 'Margins', fields: { settlementName: 'Stormchain' } }, 'island', 'created');
		expect(parseCampaignLocations(JSON.stringify([island]))[0]).toMatchObject({ type: 'Island', region: 'Margins' });
		expect(updateCampaignLocation([first], first.id, { useExtendedNames: true, fields: { bond: 'Old allies' } }, 'updated')[0]).toMatchObject({ useExtendedNames: true, fields: { settlementName: 'Stonecross', bond: 'Old allies' }, updatedAt: 'updated' });
		expect(moveCampaignLocation([first, second], second.id, 'up').map((item) => item.id)).toEqual(['second', 'first']);
		expect(putCampaignLocation([first, second], { ...first, type: 'Other' })).toHaveLength(2);
		expect(removeCampaignLocation([first, second], first.id)).toEqual([second]);
	});
});
