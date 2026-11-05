import { describe, expect, it } from 'vitest';
import { blankTheme, parseCampaignThemes, rollCustomThemeEntry, validateTheme } from './themes';
import { rollDelveAreaEntry } from '../datasworn/site-generation';

describe('campaign custom themes/domains', () => {
	it('retains exact observed roll ranges and persists valid authored tables', () => {
		const draft = blankTheme('Ironsworn domain');
		draft.name = ' Whispering hollows '; draft.description = 'Ancient hollows';
		draft.features.forEach((row) => { row.text = 'Old footprints'; });
		draft.dangers.forEach((row) => { row.text = 'Cold mist'; });
		const saved = validateTheme(draft, '2026-01-01');
		expect(saved.features[0]).toEqual({ min: 21, max: 43, text: 'Old footprints' });
		expect(saved.dangers.at(-1)?.max).toBe(100);
		expect(rollCustomThemeEntry([saved], 'feature', '', saved.name, 21)).toBe('Old footprints');
		expect(rollCustomThemeEntry([saved], 'danger', '', saved.name, 31)).toBe('Cold mist');
		expect(rollDelveAreaEntry('feature', '', saved.name, [], () => .205, [saved])).toBe('Old footprints');
		expect(parseCampaignThemes(JSON.stringify([saved]))).toEqual([saved]);
		expect(parseCampaignThemes(JSON.stringify([{ ...saved, features: [{ min: 1, max: 100, text: 'Fake' }] }]))).toEqual([]);
	});
	it('keeps Starforged ranges separate from Delve', () => {
		const draft = blankTheme('Starforged theme'); draft.name = 'Veiled'; draft.description = 'Hidden signs';
		expect(draft.features).toHaveLength(12);
		expect(draft.perils.at(-1)?.max).toBe(90);
		expect(draft.opportunities.at(-1)?.max).toBe(100);
		expect(() => validateTheme(draft)).toThrow('Fill every features');
		for (const table of ['features','perils','opportunities'] as const) draft[table].forEach((row) => { row.text = 'Uncharted'; });
		expect(rollCustomThemeEntry([validateTheme(draft)], 'feature', 'Veiled', '', 1)).toBeNull();
	});
});
