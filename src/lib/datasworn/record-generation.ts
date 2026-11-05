import type { DataswornRecord } from './catalog';
import { oracleTableFromRecord, rollOracleTable } from './oracles';
import { readableOracleText } from './site-generation';

export type GenerationSetting = 'Ironsworn' | 'Starforged' | 'Sundered Isles';
type FieldMap = Record<string, string>;
const base = 'oracle_rollable:';

export const FANTASY_SPECIES = [
	'Human', 'Dwarf', 'Elf', 'Halfling', 'Gnome', 'Half-elf', 'Half-orc', 'Dragonborn', 'Tiefling', 'Drow', 'Custom'
] as const;

export const LIFE_EVENT_PROMPTS = [
	'New home or relocation',
	'Gain or loss of a loved one',
	'Hardship or disaster',
	'Conflict or war',
	'Discovery or revelation',
	'Triumph or accomplishment',
	'Betrayal or exile',
	'Strange or supernatural encounter',
	'Debt or obligation',
	'Change of allegiance or calling'
] as const;

const SETTLEMENT_TYPES = ['Stead', 'Camp', 'Outpost', 'Hamlet', 'Village', 'Hold'] as const;
const SETTLEMENT_CONDITIONS = ['Abandoned', 'Devastated', 'Besieged', 'Under construction', 'Wretched', 'Ramshackle', 'Modest', 'Well-kept', 'Prosperous', 'Grand'] as const;
const CULTURAL_TOUCHSTONES = [
	'Austere styles', 'Prophecy', 'Rites of adulthood', 'Feasting and merrymaking', 'Gambling', 'Code of pacifism',
	'Suspicion of outsiders', 'Formal duels', 'Mysticism', 'Adherence to authority', 'Song and dance', 'Uncommon languages',
	'Heavily-accented speech', 'Artistic expression', 'Distinctive armor', 'Bartering', 'Long mourning periods', 'Seasonal festivals',
	'Blood feuds', 'Banishment of the disloyal', 'Rigid hierarchy', 'Unbreakable vows', 'Communal resources', 'Spirituality',
	'Strict laws', 'Respect of elders', 'Courtesy and hospitality', 'Body modifications or tattoos', 'Pilgrimages', 'Superstition',
	'Ceremonies and rituals', 'Blood debts', 'Familial clans', 'Isolationism and privacy', 'Communal hunts', 'Competitive tournaments',
	'Code of honor', 'Storytelling', 'Conquest and battle prowess', 'Martyred heroes', 'Sacred texts', 'Rites of courtship',
	'Bonded creatures', 'Signature weapon', 'Hidden identities', 'Gift-giving', 'Animal or nature motifs', 'Independence from authority',
	'Unusual death rites', 'Elaborate styles'
] as const;

export function rollFantasySpecies(random: () => number = Math.random): string {
	const pool = FANTASY_SPECIES.slice(0, -1);
	return pool[Math.floor(Math.max(0, Math.min(0.999999, random())) * pool.length)] ?? 'Human';
}

const characters: Record<GenerationSetting, FieldMap> = {
	Ironsworn: {
		Name: 'classic/name/ironlander',
		'Family name': 'starforged/character/name/family_name',
		Moniker: 'sundered_isles/character/name/moniker',
		Description: 'classic/character/descriptor',
		'First look': 'sundered_isles/character/first_look',
		Role: 'classic/character/role',
		'Trademark accessories': 'sundered_isles/character/trademark_accessories',
		'Trademark weapons': 'sundered_isles/character/trademark_weapons',
		Backstory: 'starforged/launching_your_campaign/character/backstory',
		Goal: 'classic/character/goal',
		Disposition: 'delve/character/disposition',
		Activity: 'compound:activity',
		Motivations: 'compound:motivations',
		'Inciting incident': 'classic/settlement/trouble'
	},
	Starforged: {
		Name: 'starforged/character/name/given_name',
		'Family name': 'starforged/character/name/family_name',
		Moniker: 'starforged/character/name/callsign',
		Description: 'classic/character/descriptor',
		'First look': 'starforged/character/first_look',
		Role: 'starforged/character/role',
		'Trademark accessories': 'sundered_isles/character/trademark_accessories',
		'Trademark weapons': 'sundered_isles/character/trademark_weapons',
		Backstory: 'starforged/launching_your_campaign/character/backstory',
		Goal: 'starforged/character/goal',
		Disposition: 'starforged/character/initial_disposition',
		Activity: 'compound:activity',
		Motivations: 'compound:motivations',
		'Inciting incident': 'starforged/launching_your_campaign/adventure/inciting_incident'
	},
	'Sundered Isles': {
		Name: 'sundered_isles/character/name/given_name',
		'Family name': 'sundered_isles/character/name/family_name',
		Moniker: 'sundered_isles/character/name/moniker',
		Description: 'classic/character/descriptor',
		'First look': 'sundered_isles/character/first_look',
		Role: 'sundered_isles/character/roles',
		'Trademark accessories': 'sundered_isles/character/trademark_accessories',
		'Trademark weapons': 'sundered_isles/character/trademark_weapons',
		Backstory: 'sundered_isles/getting_underway/create_your_character/your_backstory',
		Goal: 'sundered_isles/character/goals',
		Disposition: 'sundered_isles/character/disposition',
		Activity: 'compound:activity',
		Motivations: 'compound:motivations',
		'Inciting incident': 'sundered_isles/getting_underway/chart_your_course/details'
	}
};

const settlements: Record<GenerationSetting, FieldMap> = {
	Ironsworn: {
		settlementName: 'classic/settlement/name',
		settlementLocation: 'sundered_isles/settlement/location',
		settlementType: 'custom:settlement_type',
		condition: 'custom:settlement_condition',
		population: 'starforged/settlement/population/terminus',
		aesthetics: 'sundered_isles/settlement/aesthetics',
		description: 'classic/place/descriptor',
		firstLook: 'sundered_isles/settlement/first_look',
		controllingFaction: 'sundered_isles/settlement/identity/controlling_faction/myriads',
		disposition: 'sundered_isles/settlement/identity/disposition',
		authority: 'sundered_isles/settlement/identity/authority',
		projects: 'starforged/settlement/projects',
		culturalTouchstones: 'custom:cultural_touchstones',
		details: 'sundered_isles/settlement/details'
	},
	Starforged: {
		settlementName: 'starforged/settlement/name',
		settlementLocation: 'starforged/settlement/location',
		population: 'starforged/settlement/population/terminus',
		aesthetics: 'sundered_isles/settlement/aesthetics',
		description: 'classic/place/descriptor',
		firstLook: 'starforged/settlement/first_look',
		controllingFaction: 'sundered_isles/settlement/identity/controlling_faction/myriads',
		initialContact: 'starforged/settlement/initial_contact',
		authority: 'starforged/settlement/authority',
		projects: 'starforged/settlement/projects',
		details: 'sundered_isles/settlement/details',
		theme: 'starforged/location_theme/type'
	},
	'Sundered Isles': {
		settlementName: 'sundered_isles/settlement/name',
		settlementLocation: 'sundered_isles/settlement/location',
		population: 'starforged/settlement/population/terminus',
		size: 'sundered_isles/settlement/size/myriads',
		aesthetics: 'sundered_isles/settlement/aesthetics',
		description: 'classic/place/descriptor',
		firstLook: 'sundered_isles/settlement/first_look',
		controllingFaction: 'sundered_isles/settlement/identity/controlling_faction/myriads',
		disposition: 'sundered_isles/settlement/identity/disposition',
		authority: 'sundered_isles/settlement/identity/authority',
		focus: 'sundered_isles/settlement/focus/shore',
		details: 'sundered_isles/settlement/details',
		theme: 'starforged/location_theme/type'
	}
};

const nonSettlementLocations: Record<string, FieldMap> = {
	Waypoint: {
		settlementName: 'classic/place/location',
		description: 'classic/place/descriptor',
		settlementLocation: 'sundered_isles/overland/waypoints/myriads',
		firstLook: 'sundered_isles/overland/details',
		details: 'sundered_isles/overland/peril',
		projects: 'sundered_isles/overland/opportunity',
		aesthetics: 'compound:descriptor_focus',
		theme: 'starforged/location_theme/type'
	},
	Star: {
		settlementName: 'compound:sector_name',
		settlementType: 'starforged/space/stellar_object',
		description: 'starforged/core/descriptor',
		details: 'starforged/space/peril',
		projects: 'starforged/space/opportunity',
		firstLook: 'compound:descriptor_focus',
		theme: 'starforged/location_theme/type'
	},
	Planet: {
		settlementType: 'starforged/planet/class',
		settlementName: 'starforged/planet/vital/name',
		condition: 'starforged/planet/vital/atmosphere',
		population: 'starforged/planet/vital/life',
		aesthetics: 'starforged/planet/vital/observed_from_space',
		firstLook: 'starforged/planet/vital/feature',
		details: 'starforged/planet/peril/lifebearing',
		projects: 'starforged/planet/opportunity/lifebearing',
		settlementLocation: 'starforged/planet/vital/settlements/terminus',
		theme: 'starforged/location_theme/type'
	},
	Starship: {
		settlementName: 'starforged/starship/name',
		firstLook: 'starforged/starship/first_look',
		initialContact: 'starforged/starship/initial_contact',
		controllingFaction: 'sundered_isles/ship/controlling_faction/myriads',
		settlementType: 'starforged/starship/type',
		population: 'starforged/starship/fleet',
		description: 'starforged/launching_your_campaign/character/starship/history',
		projects: 'starforged/starship/mission/terminus',
		details: 'sundered_isles/ship/cargo',
		theme: 'starforged/location_theme/type'
	},
	Island: {
		settlementName: 'sundered_isles/island/name',
		size: 'sundered_isles/island/landscape/size',
		settlementType: 'sundered_isles/island/landscape/terrain',
		condition: 'sundered_isles/island/landscape/vitality/myriads',
		population: 'sundered_isles/island/visible_habitation/myriads',
		settlementLocation: 'sundered_isles/island/nearby_islands/myriads',
		aesthetics: 'sundered_isles/island/coastline_aspects',
		firstLook: 'sundered_isles/island/offshore_observations',
		theme: 'starforged/location_theme/type'
	},
	Ship: {
		settlementName: 'sundered_isles/ship/name',
		size: 'sundered_isles/ship/size',
		condition: 'sundered_isles/ship/position/status',
		firstLook: 'sundered_isles/ship/first_look',
		controllingFaction: 'sundered_isles/ship/controlling_faction/myriads',
		aesthetics: 'sundered_isles/ship/symbol',
		projects: 'sundered_isles/ship/mission/medium',
		details: 'sundered_isles/ship/details',
		description: 'sundered_isles/ship/cargo',
		theme: 'starforged/location_theme/type'
	}
};

const factions: Record<'Starforged' | 'Sundered Isles', FieldMap> = {
	Starforged: {
		type: 'starforged/faction/type',
		influence: 'starforged/faction/influence',
		projects: 'starforged/faction/projects',
		relationships: 'starforged/faction/relationships',
		quirks: 'starforged/faction/quirks',
		rumors: 'starforged/faction/rumors',
		cursedRole: 'starforged/faction/dominion',
		cursedAspects: 'starforged/faction/guild',
		cursedGoals: 'starforged/faction/fringe_group'
	},
	'Sundered Isles': {
		type: 'sundered_isles/faction/type',
		influence: 'sundered_isles/faction/influence',
		projects: 'starforged/faction/projects',
		relationships: 'sundered_isles/faction/relationship',
		cursedRole: 'sundered_isles/faction/cursed/role',
		cursedAspects: 'sundered_isles/faction/cursed/aspects',
		cursedGoals: 'sundered_isles/character/goals',
		societyChronicles: 'sundered_isles/faction/society/chronicles',
		societyOverseers: 'sundered_isles/faction/society/overseers',
		societyTouchstones: 'sundered_isles/faction/society/touchstones',
		societyIdentity: 'sundered_isles/faction/name/identity_society',
		culture: 'sundered_isles/faction/name/culture',
		theme: 'sundered_isles/faction/name/themes/type',
		aspect: 'sundered_isles/faction/name/themes/war/aspect',
		persona: 'sundered_isles/faction/name/themes/war/persona',
		quirks: 'starforged/faction/quirks',
		rumors: 'starforged/faction/rumors'
	}
};

function availableOracle(records: DataswornRecord[], id: string) {
	const record = [...records].reverse().find((candidate) => candidate.id === id && candidate.type === 'oracle_rollable');
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error(`No enabled Datasworn table is available (${id}).`);
	return table;
}

/** Compose the explicitly linked Ironsworn settlement-name ingredient, not the prompt text. */
export function generateIronswornSettlementName(records: DataswornRecord[], random: () => number = Math.random): string {
	const id = `${base}classic/settlement/name`;
	const table = availableOracle(records, id);
	const roll = rollOracleTable(table, random);
	const row = (records.find((record) => record.id === id)?.data.rows as unknown[] | undefined)?.find((entry) => {
		const value = entry as { roll?: { min: number; max: number } };
		return value.roll && roll.value >= value.roll.min && roll.value <= value.roll.max;
	}) as { oracle_rolls?: { oracle?: string }[] } | undefined;
	const linked = row?.oracle_rolls?.[0]?.oracle;
	if (!linked || !linked.startsWith('oracle_rollable:classic/settlement/name/')) throw new Error('The settlement name result needs manual interpretation.');
	return readableOracleText(rollOracleTable(availableOracle(records, linked), random).row.text);
}

/** Build a Starforged or Sundered Isles faction name from Datasworn components. */
export function generateStarforgedFactionName(records: DataswornRecord[], random: () => number = Math.random): string {
	const template = rollOracleTable(availableOracle(records, `${base}starforged/faction/name/template`), random).row.text;
	const parts = [...template.matchAll(/\[([^\]]+)\]\(datasworn:(oracle_rollable:starforged\/faction\/name\/[^)]+)\)/g)];
	if (!parts.length) throw new Error('The faction-name template cannot be composed automatically.');
	let result = template;
	for (const [, token, id] of parts) result = result.replace(`[${token}](datasworn:${id})`, readableOracleText(rollOracleTable(availableOracle(records, id), random).row.text));
	return result.trim();
}

export function generateSunderedIslesFactionName(records: DataswornRecord[], random: () => number = Math.random): string {
	const culture = readableOracleText(rollOracleTable(availableOracle(records, `${base}sundered_isles/faction/name/culture`), random).row.text);
	const identity = readableOracleText(rollOracleTable(availableOracle(records, `${base}sundered_isles/faction/name/identity_society`), random).row.text);
	return `${culture} ${identity}`.trim();
}

export function generationFields(kind: 'character' | 'location' | 'faction', origin: GenerationSetting, locationType = 'Settlement'): FieldMap {
	if (kind === 'character') return characters[origin];
	if (kind === 'faction') return origin === 'Ironsworn' ? {} : origin === 'Starforged' ? { ...factions[origin], name: 'starforged/faction/name/template' } : { ...factions[origin], name: 'sundered_isles/faction/name/culture' };
	if (locationType !== 'Settlement' && nonSettlementLocations[locationType]) {
		return nonSettlementLocations[locationType];
	}
	return settlements[origin];
}

export function generateRecordField(kind: 'character' | 'location' | 'faction', origin: GenerationSetting, field: string, records: DataswornRecord[], options: { locationType?: string; cursed?: boolean; region?: string; planetClass?: string } = {}, random: () => number = Math.random): string {
	const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.max(0, Math.min(0.999999, random())) * arr.length)];
	const path = generationFields(kind, origin, options.locationType)[field];
	if (!path) throw new Error(`No mapped Datasworn table for ${field} in this ${origin} ${kind}. Enter it manually.`);
	if (kind === 'location' && origin === 'Ironsworn' && (options.locationType ?? 'Settlement') === 'Settlement' && field === 'settlementName') return generateIronswornSettlementName(records, random);
	if (kind === 'faction' && origin === 'Starforged' && field === 'name') return generateStarforgedFactionName(records, random);
	if (kind === 'faction' && origin === 'Sundered Isles' && field === 'name') return generateSunderedIslesFactionName(records, random);
	if (path === 'custom:settlement_type') return pick(SETTLEMENT_TYPES);
	if (path === 'custom:settlement_condition') return pick(SETTLEMENT_CONDITIONS);
	if (path === 'custom:cultural_touchstones') return `${pick(CULTURAL_TOUCHSTONES)}, ${pick(CULTURAL_TOUCHSTONES)}`;
	if (path === 'compound:activity') return rollActionThemePair(origin, records, random);
	if (path === 'compound:motivations') return [rollActionThemePair(origin, records, random), rollActionThemePair(origin, records, random), rollActionThemePair(origin, records, random)].join(', ');
	if (path === 'compound:sector_name') {
		const prefix = readableOracleText(rollOracleTable(availableOracle(records, `${base}starforged/space/sector_name/prefix`), random).row.text);
		const suffix = readableOracleText(rollOracleTable(availableOracle(records, `${base}starforged/space/sector_name/suffix`), random).row.text);
		return `${prefix} ${suffix}`.trim();
	}
	if (path === 'compound:descriptor_focus') {
		const [descId, focusId] = origin === 'Sundered Isles'
			? [`${base}sundered_isles/core/descriptor`, `${base}sundered_isles/core/focus`]
			: [`${base}starforged/core/descriptor`, `${base}starforged/core/focus`];
		const d = readableOracleText(rollOracleTable(availableOracle(records, descId), random).row.text);
		const f = readableOracleText(rollOracleTable(availableOracle(records, focusId), random).row.text);
		return `${d} ${f}`.trim();
	}
	let id = `${base}${path}`;
	if (kind === 'location' && options.locationType === 'Planet' && options.planetClass) {
		const pKey = options.planetClass.toLowerCase().replace(/\s+world$/i, '').trim();
		if (['desert', 'furnace', 'grave', 'ice', 'jovian', 'jungle', 'ocean', 'rocky', 'shattered', 'tainted', 'vital'].includes(pKey)) {
			id = id.replace('/planet/vital/', `/planet/${pKey}/`);
		}
	}
	if (kind === 'location' && origin === 'Starforged' && field === 'population' && options.region) {
		const candidate = `${base}starforged/settlement/population/${options.region.toLowerCase()}`;
		if (records.some((record) => record.id === candidate)) id = candidate;
	}
	const cursedId = `${id}_cursed`;
	if (options.cursed && records.some((record) => record.id === cursedId && record.type === 'oracle_rollable')) id = cursedId;
	const rolled = readableOracleText(rollOracleTable(availableOracle(records, id), random).row.text);
	if (/^action\s*\+\s*theme$/i.test(rolled)) return rollActionThemePair(origin, records, random);
	if (/^descriptor\s*\+\s*focus$/i.test(rolled)) {
		const [descId, focusId] = origin === 'Sundered Isles'
			? [`${base}sundered_isles/core/descriptor`, `${base}sundered_isles/core/focus`]
			: [`${base}starforged/core/descriptor`, `${base}starforged/core/focus`];
		const d = readableOracleText(rollOracleTable(availableOracle(records, descId), random).row.text);
		const f = readableOracleText(rollOracleTable(availableOracle(records, focusId), random).row.text);
		return `${d} ${f}`.trim();
	}
	return rolled;
}

export function rollActionThemePair(origin: GenerationSetting, records: DataswornRecord[], random: () => number = Math.random): string {
	const [actionId, themeId] =
		origin === 'Ironsworn'
			? [`${base}classic/action_and_theme/action`, `${base}classic/action_and_theme/theme`]
			: origin === 'Sundered Isles'
				? [`${base}sundered_isles/core/action`, `${base}sundered_isles/core/theme`]
				: [`${base}starforged/core/action`, `${base}starforged/core/theme`];
	const action = readableOracleText(rollOracleTable(availableOracle(records, actionId), random).row.text);
	const theme = readableOracleText(rollOracleTable(availableOracle(records, themeId), random).row.text);
	return `${action} ${theme}`;
}

export function generateLifeEvents(count: number, origin: GenerationSetting, records: DataswornRecord[], random: () => number = Math.random): string {
	const clamped = Math.max(1, Math.min(4, Math.trunc(count) || 1));
	const events: string[] = [];
	for (let i = 0; i < clamped; i++) {
		const prompt = LIFE_EVENT_PROMPTS[Math.floor(Math.max(0, Math.min(0.999999, random())) * LIFE_EVENT_PROMPTS.length)] ?? LIFE_EVENT_PROMPTS[0];
		events.push(`${prompt}: ${rollActionThemePair(origin, records, random)}`);
	}
	return events.join(', ');
}

export function generateQuestPrompt(origin: GenerationSetting, records: DataswornRecord[], random: () => number = Math.random): string {
	const tableId =
		origin === 'Starforged'
			? `${base}starforged/settlement/trouble`
			: origin === 'Sundered Isles'
				? `${base}sundered_isles/getting_underway/chart_your_course/details`
				: `${base}classic/settlement/trouble`;
	try {
		const rolled = readableOracleText(rollOracleTable(availableOracle(records, tableId), random).row.text);
		if (/^action\s*\+\s*theme$/i.test(rolled)) return rollActionThemePair(origin, records, random);
		return rolled;
	} catch {
		return rollActionThemePair(origin, records, random);
	}
}

export const CREATURE_FIELDS = ['Environment', 'Scale', 'Basic form', 'First look', 'Encountered behavior', 'Revealed aspect'] as const;

export function generateCreatureField(field: (typeof CREATURE_FIELDS)[number], records: DataswornRecord[], environment = 'Land', random: () => number = Math.random): string {
	const envKey = ['space', 'interior', 'land', 'liquid', 'air'].includes(environment.toLowerCase()) ? environment.toLowerCase() : 'land';
	const map: Record<(typeof CREATURE_FIELDS)[number], string> = {
		Environment: 'starforged/creature/environment',
		Scale: 'starforged/creature/scale',
		'Basic form': `starforged/creature/basic_form/${envKey}`,
		'First look': 'starforged/creature/first_look',
		'Encountered behavior': 'starforged/creature/encountered_behavior',
		'Revealed aspect': 'starforged/creature/revealed_aspect'
	};
	return readableOracleText(rollOracleTable(availableOracle(records, `${base}${map[field]}`), random).row.text);
}

export function generateFactionFields(origin: 'Starforged' | 'Sundered Isles', records: DataswornRecord[], options: { cursed?: boolean } = {}, random: () => number = Math.random): Record<string, string> {
	const result: Record<string, string> = {};
	result.type = generateRecordField('faction', origin, 'type', records, options, random);
	const type = result.type.toLowerCase();
	const normal = origin === 'Starforged'
		? ['influence', 'projects', 'relationships', 'name', 'quirks', 'rumors']
		: ['influence', 'projects', 'relationships', 'culture', 'theme', 'aspect', 'persona', 'name', 'quirks', 'rumors', ...(type === 'society' ? ['societyChronicles', 'societyOverseers', 'societyTouchstones', 'societyIdentity'] : []), ...(options.cursed || type === 'the cursed' ? ['cursedRole', 'cursedAspects', 'cursedGoals'] : [])];
	for (const field of normal) {
		try { result[field] = generateRecordField('faction', origin, field, records, options, random); }
		catch { /* ignore */ }
	}
	return result;
}
