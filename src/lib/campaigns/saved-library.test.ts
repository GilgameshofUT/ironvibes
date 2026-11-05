import { describe, expect, it } from 'vitest';
import { emptySavedLibrary, parseSavedLibrary, serializeSavedLibrary, upsertSavedAsset, upsertSavedRecord } from './saved-library';
import { makeCampaignRecord } from './records';
import { makeCustomAsset } from './assets';

describe('cross-campaign saved library', () => {
	it('upserts exported heroes, NPCs, and custom assets and round-trips Pocketforge saved-data JSON', () => {
		const hero = makeCampaignRecord('hero', { Name: 'Kara', Origin: 'Ironsworn' });
		const asset = makeCustomAsset({
			name: 'Wayfinder',
			origin: 'Ironsworn',
			category: 'Path',
			description: 'A seasoned guide.',
			abilities: [{ text: 'Scout ahead', enabled: true }, { text: 'Find shelter', enabled: false }, { text: 'Track quarry', enabled: false }],
			statuses: [],
			fieldLabel: '',
			secondaryFieldLabel: '',
			trackMax: 0,
			rollControl: 4
		});
		let lib = emptySavedLibrary();
		lib = upsertSavedRecord(lib, hero);
		lib = upsertSavedAsset(lib, asset);
		const json = serializeSavedLibrary(lib);
		const parsed = parseSavedLibrary(json);
		expect(parsed.heroes).toHaveLength(1);
		expect(parsed.heroes[0]?.fields.Name).toBe('Kara');
		expect(parsed.assets).toHaveLength(1);
		expect(parsed.assets[0]?.name).toBe('Wayfinder');
	});
});
