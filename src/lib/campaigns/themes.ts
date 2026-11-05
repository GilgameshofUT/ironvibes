import { createId } from '../id';

export type CustomThemeKind = 'Ironsworn theme' | 'Ironsworn domain' | 'Starforged theme';
export type ThemeTable = 'features' | 'dangers' | 'perils' | 'opportunities';
export type ThemeRow = { min: number; max: number; text: string };
export type CampaignTheme = {
	id: string;
	kind: CustomThemeKind;
	name: string;
	description: string;
	features: ThemeRow[];
	dangers: ThemeRow[];
	perils: ThemeRow[];
	opportunities: ThemeRow[];
	places: string[];
	createdAt: string;
	updatedAt: string;
};

// Range labels recorded from Pocketforge's three Add theme/domain tabs.
export const THEME_RANGES: Record<CustomThemeKind, Partial<Record<ThemeTable, readonly (readonly [number, number])[]>>> = {
	'Ironsworn theme': {
		features: [[1,4],[5,8],[9,12],[13,16],[17,20]],
		dangers: [[1,5],[6,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30]]
	},
	'Ironsworn domain': {
		features: [[21,43],[44,56],[57,64],[65,68],[69,72],[73,76],[77,80],[81,84],[85,88],[89,98],[99,99],[100,100]],
		dangers: [[31,33],[34,36],[37,39],[40,42],[43,45],[46,57],[58,68],[69,76],[77,79],[80,82],[83,85],[86,88],[89,91],[92,94],[95,100]]
	},
	'Starforged theme': {
		features: [[1,8],[9,16],[17,24],[25,32],[33,40],[41,48],[49,56],[57,64],[65,72],[73,80],[81,88],[89,96]],
		perils: [[1,9],[10,18],[19,27],[28,36],[37,45],[46,54],[55,63],[64,72],[73,81],[82,90]],
		opportunities: [[1,20],[21,40],[41,60],[61,80],[81,100]]
	}
};

export function blankTheme(kind: CustomThemeKind): CampaignTheme {
	const rows = (table: ThemeTable): ThemeRow[] => (THEME_RANGES[kind][table] ?? []).map(([min, max]) => ({ min, max, text: '' }));
	return { id: createId(), kind, name: '', description: '', features: rows('features'), dangers: rows('dangers'),
		perils: rows('perils'), opportunities: rows('opportunities'), places: kind === 'Ironsworn domain' ? [''] : [], createdAt: '', updatedAt: '' };
}

export function validateTheme(input: CampaignTheme, now = new Date().toISOString(), requireComplete = true): CampaignTheme {
	if (!Object.hasOwn(THEME_RANGES, input.kind)) throw new Error('Choose a theme or domain type.');
	if (!input.name.trim()) throw new Error('Enter a theme or domain name.');
	if (requireComplete && !input.description.trim()) throw new Error('Enter a theme or domain description.');
	for (const table of ['features','dangers','perils','opportunities'] as const) {
		const expected = THEME_RANGES[input.kind][table] ?? [];
		if (input[table].length !== expected.length || input[table].some((row, i) => row.min !== expected[i][0] || row.max !== expected[i][1] || typeof row.text !== 'string')) throw new Error(`Invalid ${table} roll ranges.`);
		if (requireComplete && input[table].some((row) => !row.text.trim())) throw new Error(`Fill every ${table} roll range.`);
	}
	return { ...input, name: input.name.trim(), description: input.description.trim(),
		features: input.features.map((row) => ({ ...row, text: row.text.trim() })), dangers: input.dangers.map((row) => ({ ...row, text: row.text.trim() })),
		perils: input.perils.map((row) => ({ ...row, text: row.text.trim() })), opportunities: input.opportunities.map((row) => ({ ...row, text: row.text.trim() })),
		places: input.places.map((place) => place.trim()).filter(Boolean), createdAt: input.createdAt || now, updatedAt: now };
}

export function parseCampaignThemes(raw: string | null): CampaignTheme[] {
	if (!raw) return [];
	try {
		const value: unknown = JSON.parse(raw);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, CampaignTheme>();
		for (const item of value) {
			if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
			const theme = item as CampaignTheme;
			if (typeof theme.id !== 'string' || !theme.id || typeof theme.description !== 'string' ||
				!Array.isArray(theme.places) || !theme.places.every((place) => typeof place === 'string') ||
				typeof theme.createdAt !== 'string' || typeof theme.updatedAt !== 'string' ||
				!['features','dangers','perils','opportunities'].every((table) => Array.isArray(theme[table as ThemeTable]) && theme[table as ThemeTable].every((row: ThemeRow) => typeof row?.text === 'string'))) continue;
			try { validateTheme(theme, undefined, false); unique.set(theme.id, theme); } catch { /* skip malformed entry */ }
		}
		return [...unique.values()];
	} catch { return []; }
}

export function rollCustomThemeEntry(themes: CampaignTheme[], kind: 'feature' | 'danger', themeName: string, domainName: string, value: number): string | null {
	if (!Number.isInteger(value) || value < 1 || value > 100) return null;
	const type: CustomThemeKind = value <= (kind === 'feature' ? 20 : 30) ? 'Ironsworn theme' : 'Ironsworn domain';
	const name = type === 'Ironsworn theme' ? themeName : domainName;
	const theme = [...themes].reverse().find((item) => item.kind === type && item.name.toLowerCase() === name.trim().toLowerCase());
	const row = theme?.[kind === 'feature' ? 'features' : 'dangers'].find((item) => item.min <= value && item.max >= value);
	return row?.text.trim() || null;
}
