import type { DataswornRecord } from './catalog';

export type OracleRow = {
	min: number;
	max: number;
	text: string;
};

export type OracleTable = {
	id: string;
	name: string;
	dice: string;
	packId: string;
	packTitle: string;
	category: string;
	sourceTitle: string;
	sourceUrl: string;
	description: string;
	rows: OracleRow[];
};

export type OracleRoll = {
	value: number;
	row: OracleRow;
	text: string;
};

function object(value: unknown): Record<string, unknown> | null {
	return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Adapt Datasworn oracle_rollable records into safely rollable, attributed tables. */
export function oracleTableFromRecord(record: DataswornRecord): OracleTable | null {
	if (record.type !== 'oracle_rollable') return null;
	const data = record.data;
	if (typeof data.dice !== 'string' || !/^\d+d\d+$/i.test(data.dice)) return null;
	const rawRows = Array.isArray(data.rows) ? data.rows : [];
	const rows = rawRows.flatMap((value) => {
		const row = object(value);
		const roll = object(row?.roll);
		if (!roll || typeof row?.text !== 'string' || !Number.isInteger(roll.min) || !Number.isInteger(roll.max)) return [];
		const min = roll.min as number;
		const max = roll.max as number;
		if (min < 1 || max < min) return [];
		return [{ min, max, text: row.text }];
	});
	if (!rows.length) return null;
	return {
		id: record.id,
		name: record.name,
		dice: data.dice,
		packId: record.packId,
		packTitle: record.packTitle,
		category: record.category,
		sourceTitle: record.sourceTitle,
		sourceUrl: record.sourceUrl,
		description: record.description,
		rows
	};
}

/** Roll the table's declared dice and resolve against its Datasworn row ranges. */
export function rollOracleTable(table: OracleTable, random: () => number = Math.random): OracleRoll {
	const [, countText, sidesText] = table.dice.match(/^(\d+)d(\d+)$/i) ?? [];
	const count = Number(countText);
	const sides = Number(sidesText);
	if (!Number.isInteger(count) || count < 1 || count > 20 || !Number.isInteger(sides) || sides < 2 || sides > 1000) {
		throw new Error('This oracle table declares unsupported dice.');
	}
	let value = 0;
	for (let index = 0; index < count; index++) {
		value += Math.floor(Math.max(0, Math.min(0.999999999, random())) * sides) + 1;
	}
	const row = table.rows.find((candidate) => value >= candidate.min && value <= candidate.max);
	if (!row) throw new Error(`Roll ${value} is not covered by this Datasworn oracle table.`);
	return { value, row, text: `${table.name} (${table.dice}): ${value} — ${row.text}` };
}

export type ActionRoll = {
	actionDie: number;
	stat: number;
	adds: number;
	challengeDice: [number, number];
	total: number;
	hits: number;
	outcome: 'Strong hit' | 'Weak hit' | 'Miss';
	text: string;
	cancelledByNegativeMomentum?: boolean;
};

/** Recalculate an action roll after rerolling one die or burning momentum. */
export function resolveActionRoll(actionDie: number, stat: number, adds: number, challengeDice: [number, number], momentum?: number): ActionRoll {
	const cancelled = typeof momentum === 'number' && momentum < 0 && -actionDie === momentum;
	const effectiveActionDie = cancelled ? 0 : actionDie;
	const total = Math.min(10, effectiveActionDie + stat + adds);
	const hits = challengeDice.filter((challenge) => total > challenge).length;
	const outcome = hits === 2 ? 'Strong hit' : hits === 1 ? 'Weak hit' : 'Miss';
	return {
		actionDie: effectiveActionDie,
		stat,
		adds,
		challengeDice,
		total,
		hits,
		outcome,
		cancelledByNegativeMomentum: cancelled || undefined,
		text: `Action roll: ${effectiveActionDie} + ${stat} + ${adds} = ${total} vs ${challengeDice[0]}, ${challengeDice[1]} — ${outcome}${challengeDice[0] === challengeDice[1] ? ' (match)' : ''}.`
	};
}

export function burnActionMomentum(roll: ActionRoll, momentum: number): ActionRoll {
	if (!Number.isInteger(momentum) || momentum <= roll.total) throw new Error('Momentum must exceed the action score.');
	const hits = roll.challengeDice.filter((challenge) => momentum > challenge).length;
	const outcome = hits === 2 ? 'Strong hit' : hits === 1 ? 'Weak hit' : 'Miss';
	return { ...roll, total: momentum, hits, outcome,
		text: `Burned momentum (${momentum}): ${roll.actionDie} + ${roll.stat} + ${roll.adds} → ${momentum} vs ${roll.challengeDice[0]}, ${roll.challengeDice[1]} — ${outcome}${roll.challengeDice[0] === roll.challengeDice[1] ? ' (match)' : ''}.` };
}

/** Ironsworn/Starforged-style action roll, implemented from the published guide rule. */
export function rollAction(stat: number, adds = 0, random: () => number = Math.random, momentum?: number): ActionRoll {
	if (!Number.isInteger(stat) || stat < 0 || stat > 10 || !Number.isInteger(adds) || adds < -10 || adds > 10) {
		throw new Error('Choose a stat from 0–10 and adds from −10–10.');
	}
	const die = (sides: number) => Math.floor(Math.max(0, Math.min(0.999999999, random())) * sides) + 1;
	const actionDie = die(6);
	const challengeDice: [number, number] = [die(10), die(10)];
	return resolveActionRoll(actionDie, stat, adds, challengeDice, momentum);
}

export const ASK_THE_ORACLE_ODDS = ['Small Chance', 'Unlikely', '50%', 'Likely', 'Almost Certain'] as const;
export type AskTheOracleOdds = (typeof ASK_THE_ORACLE_ODDS)[number];
export type OracleRulesetTab = 'ironsworn' | 'starforged' | 'isles';

const IRONSWORN_ODDS_THRESHOLDS: Record<AskTheOracleOdds, number> = {
	'Small Chance': 91,
	Unlikely: 76,
	'50%': 51,
	Likely: 26,
	'Almost Certain': 11
};

const STARFORGED_ODDS_THRESHOLDS: Record<AskTheOracleOdds, number> = {
	'Small Chance': 10,
	Unlikely: 25,
	'50%': 50,
	Likely: 75,
	'Almost Certain': 90
};

function cleanOracleText(text: string): string {
	return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
}

export function rollMatchEvent(tab: OracleRulesetTab, records: DataswornRecord[], random: () => number = Math.random): { action: string; theme: string; text: string } | null {
	const ids = tab === 'ironsworn'
		? ['oracle_rollable:classic/action_and_theme/action', 'oracle_rollable:classic/action_and_theme/theme']
		: tab === 'isles'
			? ['oracle_rollable:sundered_isles/core/action', 'oracle_rollable:sundered_isles/core/theme']
			: ['oracle_rollable:starforged/core/action', 'oracle_rollable:starforged/core/theme'];
	const actionRec = records.find((record) => record.id === ids[0]);
	const themeRec = records.find((record) => record.id === ids[1]);
	const actionTable = actionRec && oracleTableFromRecord(actionRec);
	const themeTable = themeRec && oracleTableFromRecord(themeRec);
	if (!actionTable || !themeTable) return null;
	const action = cleanOracleText(rollOracleTable(actionTable, random).row.text);
	const theme = cleanOracleText(rollOracleTable(themeTable, random).row.text);
	return { action, theme, text: `${action} ${theme}` };
}

export type AskTheOracleResult = {
	roll: number;
	odds: AskTheOracleOdds;
	answer: 'Yes' | 'No';
	isEvent: boolean;
	event: { action: string; theme: string; text: string } | null;
	journalText: string;
};

export function rollAskTheOracle(
	odds: AskTheOracleOdds,
	tab: OracleRulesetTab,
	records: DataswornRecord[],
	random: () => number = Math.random
): AskTheOracleResult {
	const roll = Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;
	const tens = Math.floor((roll / 10) % 10);
	const ones = Math.floor(roll % 10);
	const isEvent = tens === ones && tens !== 0;
	const answer: 'Yes' | 'No' =
		tab === 'ironsworn'
			? roll >= IRONSWORN_ODDS_THRESHOLDS[odds]
				? 'Yes'
				: 'No'
			: roll <= STARFORGED_ODDS_THRESHOLDS[odds]
				? 'Yes'
				: 'No';
	const event = isEvent ? rollMatchEvent(tab, records, random) : null;
	const journalText = `Ask the Oracle (${odds}): ${roll}, ${answer}.${event ? ` Event: ${event.text}.` : ''}`;
	return { roll, odds, answer, isEvent, event, journalText };
}

export function rollPayThePrice(tab: OracleRulesetTab, records: DataswornRecord[], random: () => number = Math.random): { roll: number; text: string; journalText: string } {
	const targetId =
		tab === 'ironsworn'
			? 'move.oracle_rollable:classic/fate/pay_the_price.pay_the_price'
			: 'move.oracle_rollable:starforged/fate/pay_the_price.pay_the_price';
	const record = records.find((item) => item.id === targetId);
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error('Pay the Price table is not available in enabled packs.');
	const rolled = rollOracleTable(table, random);
	const text = cleanOracleText(rolled.row.text);
	return { roll: rolled.value, text, journalText: `Pay the Price: ${text}.` };
}

export type OracleCategoryGroup = {
	id: string;
	category: string;
	tables: OracleTable[];
};

export function groupedDrawerOracles(
	packIds: string[],
	records: DataswornRecord[],
	query = ''
): OracleCategoryGroup[] {
	const q = query.trim().toLocaleLowerCase();
	const groups = new Map<string, OracleTable[]>();
	for (const record of records) {
		if (record.type !== 'oracle_rollable' || !packIds.includes(record.packId)) continue;
		if (record.id.startsWith('move.oracle_rollable:')) continue;
		const table = oracleTableFromRecord(record);
		if (!table) continue;
		const rawCat = record.path
			.replace(/^oracles\./, '')
			.split('.')
			.filter((part) => part !== 'contents' && part !== 'collections')[0] ?? 'Core';
		const category = rawCat
			.replaceAll('_', ' ')
			.replace(/\b\w/g, (letter) => letter.toUpperCase());
		if (q && !`${table.name} ${category} ${table.packTitle}`.toLocaleLowerCase().includes(q)) continue;
		if (!groups.has(category)) groups.set(category, []);
		groups.get(category)!.push(table);
	}
	return [...groups.entries()].map(([category, tables]) => ({
		id: category.toLowerCase().replace(/\s+/g, '-'),
		category,
		tables
	}));
}

export type CustomOracle = {
	id: string;
	name: string;
	kind: 'range' | 'simple';
	rows: OracleRow[];
};

export function parseCustomOracles(serialized: string | null): CustomOracle[] {
	if (!serialized) return [];
	try {
		const raw: unknown = JSON.parse(serialized);
		if (!Array.isArray(raw)) return [];
		return raw.flatMap((entry) => {
			if (!entry || typeof entry !== 'object') return [];
			const item = entry as { id?: unknown; name?: unknown; kind?: unknown; type?: unknown; rows?: unknown; oracle?: unknown };
			if (typeof item.id !== 'string' || typeof item.name !== 'string' || !item.name.trim()) return [];
			const kind: 'range' | 'simple' = item.kind === 'simple' || item.type === 'simple' ? 'simple' : 'range';
			const rawRows = Array.isArray(item.rows) ? item.rows : Array.isArray(item.oracle) ? item.oracle : [];
			const rows: OracleRow[] = rawRows.flatMap((r) => {
				if (!r || typeof r !== 'object') return [];
				const rowObj = r as { min?: unknown; max?: unknown; text?: unknown; range?: unknown; label?: unknown };
				const min = typeof rowObj.min === 'number' ? rowObj.min : Array.isArray(rowObj.range) && typeof rowObj.range[0] === 'number' ? rowObj.range[0] : 1;
				const max = typeof rowObj.max === 'number' ? rowObj.max : Array.isArray(rowObj.range) && typeof rowObj.range[1] === 'number' ? rowObj.range[1] : min;
				const text = typeof rowObj.text === 'string' ? rowObj.text : typeof rowObj.label === 'string' ? rowObj.label : '';
				return [{ min, max, text }];
			});
			if (!rows.length) return [];
			return [{ id: item.id, name: item.name.trim(), kind, rows }];
		});
	} catch {
		return [];
	}
}

export function rollCustomOracle(oracle: CustomOracle, random: () => number = Math.random): { roll: number; text: string } {
	const maxSide = Math.max(1, ...oracle.rows.map((row) => row.max));
	const roll = Math.floor(Math.max(0, Math.min(0.999999999, random())) * maxSide) + 1;
	const row = oracle.rows.find((candidate) => roll >= candidate.min && roll <= candidate.max) ?? oracle.rows[0];
	return { roll, text: row?.text || `${roll}` };
}

export type SpellforgeField = {
	id: string;
	label: string;
	options?: string[];
};

export const SPELLFORGE_CATEGORIES: readonly { id: string; category: string; fields: readonly SpellforgeField[] }[] = [
	{
		id: 'spell',
		category: 'Spell',
		fields: [
			{ id: 'spell_intent', label: 'Spell intent', options: ['Conjure', 'Perceive', 'Transform', 'Destroy', 'Control'] },
			{ id: 'spell_essence', label: 'Spell essence', options: ['Fire', 'Water', 'Air', 'Earth', 'Plant', 'Animal', 'Light / Darkness', 'Life / Death', 'Body', 'Mind', 'Perception'] },
			{ id: 'spell_target', label: 'Spell target', options: ['Individual', 'Group', 'Circle or Sphere', 'Area', 'Structure', 'Boundary'] },
			{ id: 'spell_range', label: 'Spell range', options: ['Self', 'Touch', 'Medium', 'Sight', 'Arcane connection'] },
			{ id: 'spell_duration', label: 'Spell duration', options: ['Instant', 'About 1 minute', 'About 10 minutes', 'About 1 hour', 'About 8 hours', 'About 24 hours', 'Permanent / Until dispelled'] },
			{ id: 'spell_rank', label: 'Spell rank', options: ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'] },
			{ id: 'spell_components', label: 'Spell components', options: ['Chant', 'Gesture', 'Material', 'Chant + Gesture', 'Chant + Material', 'Gesture + Material', 'Chant + Gesture + Material'] },
			{ id: 'spell_name', label: 'Spell name' },
			{ id: 'spell_descriptor', label: 'Spell descriptor' },
			{ id: 'spell_focus', label: 'Spell focus' },
			{ id: 'spell_action', label: 'Spell action' },
			{ id: 'spell_theme', label: 'Spell theme' },
			{ id: 'chaos_magic', label: 'Chaos magic' },
			{ id: 'chaos_magic_surge', label: 'Chaos magic surge' },
			{ id: 'mystic_backlash', label: 'Mystic backlash' }
		]
	},
	{
		id: 'summon',
		category: 'Summon',
		fields: [
			{ id: 'creature_rank', label: 'Creature rank' },
			{ id: 'creature_size', label: 'Creature size' },
			{ id: 'creature_form', label: 'Creature form' },
			{ id: 'creature_characteristics', label: 'Creature characteristics' },
			{ id: 'creature_abilities', label: 'Creature abilities' }
		]
	}
];

const SPELLFORGE_RANGE_TABLES: Record<string, { min: number; max: number; text: string }[]> = {
	spell_intent: [{ min: 1, max: 20, text: 'Conjure' }, { min: 21, max: 40, text: 'Perceive' }, { min: 41, max: 60, text: 'Transform' }, { min: 61, max: 80, text: 'Destroy' }, { min: 81, max: 100, text: 'Control' }],
	spell_essence: [{ min: 1, max: 11, text: 'Fire' }, { min: 12, max: 22, text: 'Water' }, { min: 23, max: 33, text: 'Air' }, { min: 34, max: 44, text: 'Earth' }, { min: 45, max: 52, text: 'Plant' }, { min: 53, max: 60, text: 'Animal' }, { min: 61, max: 68, text: 'Light / Darkness' }, { min: 69, max: 76, text: 'Life / Death' }, { min: 77, max: 84, text: 'Body' }, { min: 85, max: 92, text: 'Mind' }, { min: 93, max: 100, text: 'Perception' }],
	spell_target: [{ min: 1, max: 25, text: 'Individual' }, { min: 26, max: 45, text: 'Group' }, { min: 46, max: 65, text: 'Circle or Sphere' }, { min: 66, max: 85, text: 'Area' }, { min: 86, max: 95, text: 'Structure' }, { min: 96, max: 100, text: 'Boundary' }],
	spell_range: [{ min: 1, max: 20, text: 'Self' }, { min: 21, max: 40, text: 'Touch' }, { min: 41, max: 60, text: 'Medium' }, { min: 61, max: 80, text: 'Sight' }, { min: 81, max: 100, text: 'Arcane connection' }],
	spell_duration: [{ min: 1, max: 25, text: 'Instant' }, { min: 26, max: 50, text: 'About 1 minute' }, { min: 51, max: 65, text: 'About 10 minutes' }, { min: 66, max: 75, text: 'About 1 hour' }, { min: 76, max: 85, text: 'About 8 hours' }, { min: 86, max: 95, text: 'About 24 hours' }, { min: 96, max: 100, text: 'Permanent / Until dispelled' }],
	spell_rank: [{ min: 1, max: 20, text: 'Troublesome' }, { min: 21, max: 55, text: 'Dangerous' }, { min: 56, max: 80, text: 'Formidable' }, { min: 81, max: 93, text: 'Extreme' }, { min: 94, max: 100, text: 'Epic' }],
	spell_components: [{ min: 1, max: 11, text: 'Chant' }, { min: 12, max: 14, text: 'Gesture' }, { min: 15, max: 15, text: 'Material' }, { min: 16, max: 45, text: 'Chant + Gesture' }, { min: 46, max: 50, text: 'Chant + Material' }, { min: 51, max: 53, text: 'Gesture + Material' }, { min: 54, max: 100, text: 'Chant + Gesture + Material' }],
	chaos_magic: [{ min: 1, max: 90, text: 'Controlled' }, { min: 91, max: 100, text: 'Chaotic' }],
	chaos_magic_surge: [
		{ min: 1, max: 34, text: 'Minor magical effect, roll Spell Descriptor + Spell Focus' },
		{ min: 35, max: 60, text: 'Empowering magic, add +1 on your next move' },
		{ min: 61, max: 62, text: 'Prophetic vision, you may reroll one challenge die' },
		{ min: 63, max: 68, text: 'Summon a hostile creature up to medium size' },
		{ min: 69, max: 78, text: 'Lethal magic, add +1 harm if your next move is a Combat Move' },
		{ min: 79, max: 80, text: 'Magic nova, enemies are blasted away, gain Initiative/Control' },
		{ min: 81, max: 84, text: 'Magic runs through you, gain 2 momentum' },
		{ min: 85, max: 92, text: 'Overwhelming magic, Pay the Price' },
		{ min: 93, max: 94, text: 'Recover 1 health' },
		{ min: 95, max: 96, text: 'Recover 1 spirit' },
		{ min: 97, max: 98, text: 'Recover 1 supply' },
		{ min: 99, max: 100, text: 'Mystic backlash' }
	],
	mystic_backlash: [
		{ min: 1, max: 4, text: 'Your ritual has the opposite effect' },
		{ min: 5, max: 8, text: 'You are sapped of strength' },
		{ min: 9, max: 12, text: 'Your friend, ally, or companion is adversely affected' },
		{ min: 13, max: 16, text: 'You destroy an important object' },
		{ min: 17, max: 20, text: 'You inadvertently summon a horror' },
		{ min: 21, max: 24, text: 'You collapse, and drift into a troubled sleep' },
		{ min: 25, max: 28, text: 'You undergo a physical torment which leaves its mark upon you' },
		{ min: 29, max: 32, text: 'You hear ghostly voices whispering of dark portents' },
		{ min: 33, max: 36, text: 'You are lost in shadow, and find yourself in another place without memory of how you got there' },
		{ min: 37, max: 40, text: 'You alert someone or something to your presence' },
		{ min: 41, max: 44, text: 'You are not yourself, and act against a friend, ally, or companion' },
		{ min: 45, max: 48, text: 'You affect or damage your surroundings, causing a disturbance or potential harm' },
		{ min: 49, max: 52, text: 'You waste resources' },
		{ min: 53, max: 56, text: 'You suffer the loss of a sense for several hours' },
		{ min: 57, max: 60, text: 'You lose your connection to magic for a day or so, and cannot perform rituals' },
		{ min: 61, max: 64, text: 'Your ritual affects the target in an unexpected and problematic way' },
		{ min: 65, max: 68, text: 'Your ritual reveals a surprising and troubling truth' },
		{ min: 69, max: 72, text: 'You are tempted by dark powers' },
		{ min: 73, max: 76, text: 'You see a troubling vision of your future' },
		{ min: 77, max: 80, text: "You can't perform this ritual again until you acquire an important component" },
		{ min: 81, max: 84, text: 'You develop a strange fear or compulsion' },
		{ min: 85, max: 88, text: 'Your ritual causes creatures to exhibit strange or aggressive behavior' },
		{ min: 89, max: 92, text: 'You are tormented by an apparition from your past' },
		{ min: 93, max: 96, text: 'You are wracked with sudden sickness' },
		{ min: 97, max: 100, text: 'Roll twice more on this table. Both results occur. If they are the same result, make it worse' }
	],
	creature_rank: [{ min: 1, max: 37, text: 'Troublesome' }, { min: 38, max: 100, text: 'Dangerous' }],
	creature_size: [{ min: 1, max: 8, text: 'Tiny (rodent-sized)' }, { min: 9, max: 49, text: 'Small (hound-sized)' }, { min: 50, max: 100, text: 'Medium (person-sized)' }],
	creature_form: [
		{ min: 1, max: 15, text: 'Beast / mammal' }, { min: 16, max: 25, text: 'Humanoid' }, { min: 26, max: 31, text: 'Bird' },
		{ min: 32, max: 37, text: 'Spider' }, { min: 38, max: 43, text: 'Snake' }, { min: 44, max: 49, text: 'Worm / slug' },
		{ min: 50, max: 55, text: 'Lizard' }, { min: 56, max: 61, text: 'Insect' }, { min: 62, max: 66, text: 'Amorphous' },
		{ min: 67, max: 69, text: 'Crustacean' }, { min: 70, max: 71, text: 'Fish' }, { min: 72, max: 73, text: 'Octopoid' },
		{ min: 74, max: 75, text: 'Amphibian' }, { min: 76, max: 77, text: 'Plant' }, { min: 78, max: 78, text: 'Incorporeal' },
		{ min: 79, max: 79, text: 'Mineral' }, { min: 80, max: 100, text: 'Elemental' }
	],
	creature_characteristics: [
		{ min: 1, max: 5, text: 'Extra limbs' }, { min: 6, max: 10, text: 'Fangs / rows of sharp teeth' }, { min: 11, max: 15, text: 'Claws / talons' },
		{ min: 16, max: 20, text: 'Strange color / markings' }, { min: 21, max: 25, text: 'Horns / tusks' }, { min: 26, max: 30, text: 'Oversized mouth' },
		{ min: 31, max: 35, text: 'Spikes / spines' }, { min: 36, max: 40, text: 'Tail' }, { min: 41, max: 45, text: 'Multi-segmented body' },
		{ min: 46, max: 50, text: 'Wings' }, { min: 51, max: 54, text: 'Stinger / barbs' }, { min: 55, max: 58, text: 'Many-eyed' },
		{ min: 59, max: 62, text: 'Distinctive sound' }, { min: 63, max: 66, text: 'Tentacles / tendrils' }, { min: 67, max: 69, text: 'Mandibles / pincers' },
		{ min: 70, max: 72, text: 'Luminescent' }, { min: 73, max: 75, text: 'Antennae / sensory organs' }, { min: 76, max: 78, text: 'Proboscis / inner jaw' },
		{ min: 79, max: 81, text: 'Exoskeleton / shell' }, { min: 82, max: 84, text: 'Bony protuberances' }, { min: 85, max: 87, text: 'Corrupted flesh' },
		{ min: 88, max: 90, text: 'Semi-transparent' }, { min: 91, max: 93, text: 'Scarred / injured' }, { min: 94, max: 95, text: 'Egg sac / carried offspring' },
		{ min: 96, max: 97, text: 'Rotting / skeletal' }, { min: 98, max: 98, text: 'Mummified / desiccated' }, { min: 99, max: 99, text: 'Multi-headed' },
		{ min: 100, max: 100, text: 'Etched with mystic runes' }
	],
	creature_abilities: [
		{ min: 1, max: 4, text: 'Keen senses' }, { min: 5, max: 8, text: 'Intimidating vocalization' }, { min: 9, max: 12, text: 'Climber' },
		{ min: 13, max: 16, text: 'Intelligent' }, { min: 17, max: 20, text: 'Swift' }, { min: 21, max: 24, text: 'Powerful bite' },
		{ min: 25, max: 28, text: 'Stealthy / ambusher' }, { min: 29, max: 32, text: 'Horrid visage' }, { min: 33, max: 36, text: 'Strong' },
		{ min: 37, max: 40, text: 'Camouflaged' }, { min: 41, max: 43, text: 'Flier / glider' }, { min: 44, max: 46, text: 'Poisonous' },
		{ min: 47, max: 49, text: 'Semiaquatic / swimmer' }, { min: 50, max: 52, text: 'Grappler / entangler' }, { min: 53, max: 55, text: 'Leaper' },
		{ min: 56, max: 58, text: 'Crusher / constrictor' }, { min: 59, max: 61, text: 'Armored' }, { min: 62, max: 64, text: 'Burrower' },
		{ min: 65, max: 67, text: 'Noxious smell' }, { min: 68, max: 69, text: 'Trap-setter' }, { min: 70, max: 71, text: 'Parasitic' },
		{ min: 72, max: 73, text: 'Vibration sense' }, { min: 74, max: 75, text: 'Breath weapon / toxic spew' }, { min: 76, max: 77, text: 'Mimicry' },
		{ min: 78, max: 79, text: 'Shapeshifting' }, { min: 80, max: 81, text: 'Control lesser creatures' }, { min: 82, max: 83, text: 'Echolocation' },
		{ min: 84, max: 85, text: 'Electric shock' }, { min: 86, max: 87, text: 'Acidic' }, { min: 88, max: 89, text: 'Symbiotic' },
		{ min: 90, max: 91, text: 'Shoot projectiles' }, { min: 92, max: 92, text: 'Paralyzing' }, { min: 93, max: 93, text: 'Immune to iron' },
		{ min: 94, max: 94, text: 'Feels no pain' }, { min: 95, max: 95, text: 'Enact rituals' }, { min: 96, max: 96, text: 'Create illusions' },
		{ min: 97, max: 97, text: 'Mind control / telepathy' }, { min: 98, max: 98, text: 'Move between realities' }, { min: 99, max: 99, text: 'Wield weapons' },
		{ min: 100, max: 100, text: 'Control elements' }
	]
};

const SPELL_LATIN_INTENTS: Record<string, string[]> = {
	conjure: ['Facio', 'Voco', 'Ferre', 'Creo', 'Fingo', 'Concalo', 'Accerso', 'Evoco', 'Prodo', 'Pario'],
	perceive: ['Veritas', 'Credo', 'Oculos', 'Scio', 'Didici', 'Pecto', 'Ecce', 'Cernentia', 'Tuor', 'Senti'],
	transform: ['Praeses', 'Alia', 'Fero', 'Cupio', 'Virtus', 'Licet', 'Immuta', 'Alta', 'Innova', 'Cambium'],
	destroy: ['Incertus', 'Pulcher', 'Imperio', 'Efflige', 'Rue', 'Interfice', 'Perime', 'Letare', 'Evoca', 'Exci'],
	control: ['Manus', 'Potentis', 'Paro', 'Modero', 'Dux', 'Regere', 'Impero', 'Regna', 'Praeeo', 'Vergo']
};

const SPELL_LATIN_ESSENCES: Record<string, string[]> = {
	fire: ['Ignis', 'Ardor', 'Fieri', 'Ambustio', 'Aedilicius', 'Fax', 'Malleolus', 'Igniculus', 'Incende', 'Exarde'],
	water: ['Aqua', 'Irrora', 'Imber', 'Rigare', 'Mersa', 'Icere', 'Procella', 'Unda', 'Confluctua', 'Glacia'],
	air: ['Aer', 'Spiraculi', 'Caelus', 'Tempestas', 'Tonitrus', 'Fulgur', 'Attona', 'Caligo', 'Ventus', 'Perurere'],
	earth: ['Terra', 'Glaria', 'Tellus', 'Cespes', 'Solum', 'Ager', 'Occo', 'Intreme', 'Scopulus', 'Contreme'],
	plant: ['Plare', 'Arsella', 'Arbor', 'Aceris', 'Ramus', 'Termes', 'Vis', 'Vitis', 'Grandesce', 'Aucta'],
	'light/darkness': ['Lux', 'Luminis', 'Tenebra', 'Lucide', 'Clarica', 'Radia', 'Illustre', 'Divini', 'Sol', 'Orior'],
	'life/death': ['Vita', 'Anima', 'Aeternus', 'Aesi', 'Cordis', 'Neuma', 'Pneuma', 'Mortis', 'Exitus', 'Fateri'],
	animal: ['Animalis', 'Averium', 'Fera', 'Trux', 'Atrox', 'Junge', 'Amicus', 'Entis', 'Dedoma', 'Cicura'],
	body: ['Corporis', 'Entis', 'Essentia', 'Fortitudo', 'Robor', 'Postestatis', 'Vigesce', 'Vigor', 'Virtus', 'Careo'],
	mind: ['Cordis', 'Animi', 'Sentis', 'Mentis', 'Adversa', 'Cogitare', 'Arbitra', 'Reor', 'Compertus', 'Experi'],
	perception: ['Prendis', 'Acuitas', 'Comprensio', 'Conspectus', 'Agnitio', 'Beia', 'Tua', 'Tueris', 'Vulticulus', 'Specula']
};

const SPELL_LATIN_MODIFIERS = [
	'Altum', 'Elatum', 'Celere', 'Actuarium', 'Immanis', 'Vaste', 'Viripotens', 'Forte', 'Belliate', 'Valens',
	'Empyrea', 'Flammide', 'Pyrie', 'Ignee', 'Infere', 'Flagranter', 'Algide', 'Frigide', 'Glacialiter', 'Congelate',
	'Nimbifere', 'Tempestuose', 'Procellose', 'Fluctuose', 'Petrose', 'Severum', 'Lucide', 'Illustris', 'Clarus', 'Serenus',
	'Tenebrose', 'Strenuus', 'Vigorose', 'Vehementer', 'Vivax', 'Ferox', 'Valorose', 'Sagax', 'Acris', 'Alacris'
];

export function rollSpellforgeTable(
	fieldId: string,
	records: DataswornRecord[],
	currentValues: Record<string, string> = {},
	random: () => number = Math.random
): { text: string; updatedValues?: Record<string, string> } {
	const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.max(0, Math.min(0.999999999, random())) * arr.length)];
	const d100 = () => Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;

	if (fieldId in SPELLFORGE_RANGE_TABLES) {
		const roll = d100();
		const rows = SPELLFORGE_RANGE_TABLES[fieldId];
		const match = rows.find((r) => roll >= r.min && roll <= r.max) ?? rows[0];
		return { text: match.text };
	}
	if (fieldId === 'spell_name') {
		const nextValues = { ...currentValues };
		if (!nextValues.spell_intent) nextValues.spell_intent = rollSpellforgeTable('spell_intent', records, nextValues, random).text;
		if (!nextValues.spell_essence) nextValues.spell_essence = rollSpellforgeTable('spell_essence', records, nextValues, random).text;
		const intentKey = nextValues.spell_intent.toLowerCase();
		const essenceKey = nextValues.spell_essence.toLowerCase().replace(/\s+/g, '');
		const intentWord = pick(SPELL_LATIN_INTENTS[intentKey] ?? SPELL_LATIN_INTENTS.conjure);
		const essenceWord = pick(SPELL_LATIN_ESSENCES[essenceKey] ?? SPELL_LATIN_ESSENCES.fire);
		const mod1 = pick(SPELL_LATIN_MODIFIERS);
		const mod2 = pick(SPELL_LATIN_MODIFIERS);
		const r = d100();
		const text =
			r <= 15 ? essenceWord :
			r <= 30 ? `${intentWord} ${essenceWord}` :
			r <= 45 ? `${intentWord} ${mod1} ${essenceWord}` :
			r <= 60 ? `${mod1} ${intentWord} ${essenceWord}` :
			r <= 75 ? `${mod1} ${essenceWord}` :
			r <= 90 ? `${mod1} ${mod2} ${essenceWord}` :
			`${mod1} ${intentWord}`;
		return { text, updatedValues: { ...nextValues, spell_name: text } };
	}
	const dsMap: Record<string, string> = {
		spell_descriptor: 'oracle_rollable:starforged/core/descriptor',
		spell_focus: 'oracle_rollable:starforged/core/focus',
		spell_action: 'oracle_rollable:starforged/core/action',
		spell_theme: 'oracle_rollable:starforged/core/theme'
	};
	if (fieldId in dsMap) {
		const rec = records.find((r) => r.id === dsMap[fieldId]);
		const tbl = rec && oracleTableFromRecord(rec);
		if (tbl) return { text: cleanOracleText(rollOracleTable(tbl, random).row.text) };
	}
	return { text: '' };
}
