import { describe, expect, it } from 'vitest';
import classic from '@datasworn-community/ironsworn-classic/json/classic.json';
import starforged from '@datasworn-community/starforged/json/starforged.json';
import { flattenDataswornPack } from '../datasworn/catalog';
import { ASSET_TYPES, assetFromDatasworn, makeCustomAsset, moveCampaignAsset, parseCampaignAssets, putCampaignAsset } from './assets';

const records = flattenDataswornPack(classic);
describe('campaign asset copies', () => {
	it('imports abilities, source and companion controls from real Datasworn items', () => {
		const archer = assetFromDatasworn(records.find((item) => item.name === 'Archer' && item.type === 'asset')!, 'archer');
		const hawk = assetFromDatasworn(records.find((item) => item.name === 'Hawk' && item.type === 'asset')!, 'hawk');
		expect(archer.abilities).toHaveLength(3);
		expect(archer.abilities[0].enabled).toBe(true);
		expect(archer.sourceId).toMatch(/^asset:classic/);
		expect(hawk.trackMax).toBe(3);
		expect(hawk.fieldLabel).toBe('name');
		expect(parseCampaignAssets(JSON.stringify([archer, hawk]))).toEqual([archer, hawk]);
	});
	it('requires authored name and type, preserves IDs and ignores malformed saves', () => {
		const input = { name: ' Local relic ', origin: 'Ironsworn' as const, category: 'Ritual', description: '', abilities: [{ text: 'Remember', enabled: false }], statuses: [] as [], fieldLabel: '', secondaryFieldLabel: '', trackMax: 5, rollControl: 2 };
		const asset = makeCustomAsset(input, 'local');
		expect(asset.name).toBe('Local relic');
		expect(putCampaignAsset([asset], { ...asset, trackValue: 2 })).toHaveLength(1);
		expect(moveCampaignAsset([asset], 'local', 1)).toEqual([asset]);
		expect(parseCampaignAssets(JSON.stringify([asset, { ...asset, trackValue: 11 }]))).toEqual([asset]);
		expect(() => makeCustomAsset({ ...input, name: '' })).toThrow('name');
		expect(() => makeCustomAsset({ ...input, category: '' })).toThrow('origin and asset type');
		expect(ASSET_TYPES.Starforged).toEqual(['Companion','Path','Module','Support Vehicle','Deed']);
		expect(ASSET_TYPES['Sundered Isles']).toEqual(ASSET_TYPES.Starforged);
		expect(ASSET_TYPES['Third party']).toEqual([]);
		expect(makeCustomAsset({ ...input, origin: 'Third party', category: 'Other' }).category).toBe('');
	});
	it('keeps Datasworn select, flip, text and nested meter controls editable and validates saved choices', () => {
		const starAssets = flattenDataswornPack(starforged).filter((item) => item.type === 'asset');
		const devotant = assetFromDatasworn(starAssets.find((item) => item.name === 'Devotant')!, 'devotant');
		const engine = assetFromDatasworn(starAssets.find((item) => item.name === 'Engine Upgrade')!, 'engine');
		const ship = assetFromDatasworn(starAssets.find((item) => item.name === 'Starship')!, 'ship');
		expect(devotant.controls?.find((item) => item.kind === 'choice')?.choices.map((item) => item.value)).toContain('wits');
		expect(engine.controls?.find((item) => item.key === 'broken')?.kind).toBe('checkbox');
		expect(ship.trackLabel).toBe('integrity');
		expect(ship.controls?.map((item) => item.label)).toEqual(expect.arrayContaining(['battered', 'cursed']));
		const edited = { ...devotant, controls: devotant.controls?.map((item) => item.kind === 'choice' ? { ...item, value: 'wits' } : item) };
		expect(parseCampaignAssets(JSON.stringify([edited]))[0].controls).toEqual(edited.controls);
		expect(parseCampaignAssets(JSON.stringify([{ ...edited, controls: edited.controls?.map((item) => item.kind === 'choice' ? { ...item, value: 'bogus' } : item) }]))).toEqual([]);
	});
});
