import { createId } from '../id';
import { asset } from '$app/paths';
import type { AssetPath } from '$app/types';
import type { CampaignAsset } from './assets';
import type { CampaignTrack, TrackRank } from './tracks';

export const HERO_FIELDS = [
	'Origin', 'Name', 'Family name', 'Moniker', 'Pronouns', 'Description', 'First look', 'Role',
	'Trademark accessories', 'Trademark weapons', 'Backstory', 'Goal', 'Motivations', 'Inciting incident', 'Life events', 'Faction'
] as const;
export const NPC_FIELDS = [
	'Origin', 'NPC Type', 'Name', 'Family name', 'Moniker', 'Pronouns', 'Description', 'First look', 'Role',
	'Trademark accessories', 'Trademark weapons', 'Goal', 'Activity', 'Disposition', 'Motivations', 'Bond', 'Current location', 'Faction'
] as const;

export const IRONSWORN_DEBILITY_GROUPS = [
	{ label: 'Conditions', items: ['Wounded', 'Shaken', 'Unprepared', 'Encumbered'] },
	{ label: 'Banes', items: ['Maimed', 'Corrupted'] },
	{ label: 'Burdens', items: ['Cursed', 'Tormented'] }
] as const;

export const STARFORGED_IMPACT_GROUPS = [
	{ label: 'Misfortunes', items: ['Wounded', 'Shaken', 'Unprepared'] },
	{ label: 'Vehicle troubles', items: ['Battered', 'Cursed'] },
	{ label: 'Burdens', items: ['Doomed', 'Tormented', 'Indebted'] },
	{ label: 'Lasting effects', items: ['Permanently Harmed', 'Traumatized'] }
] as const;

export function computeMomentumLimits(debilitiesCount: number): { momentumMax: number; momentumReset: number } {
	const count = Math.max(0, debilitiesCount);
	return {
		momentumMax: Math.max(-6, 10 - count),
		momentumReset: count > 2 ? 0 : Math.max(0, 2 - count)
	};
}

export type RecordKind = 'hero' | 'npc';
export type RecordStats = { momentum: number; health: number; spirit: number; supply: number; edge: number; heart: number; iron: number; shadow: number; wits: number };
export type HeroLegacyTracks = {
	quests: number;
	bonds: number;
	discoveries: number;
};
export type RecordQuestItem = {
	id: string;
	name: string;
};
export type CampaignRecord = {
	id: string;
	kind: RecordKind;
	fields: Record<string, string>;
	stats: RecordStats;
	assets: string[];
	legacyAndVows: string[];
	debilities: string[];
	characterDetails: string;
	notes: string;
	initiative?: 'in_control' | 'bad_spot' | 'out_of_combat';
	momentumMax?: number;
	momentumReset?: number;
	experience?: number;
	spentExperience?: number;
	legacyTracks?: HeroLegacyTracks;
	vows?: CampaignTrack[];
	heroAssets?: CampaignAsset[];
	customConditions?: string[];
	isBond?: boolean;
	isConnection?: boolean;
	connectionRank?: TrackRank;
	connectionProgress?: number;
	quests?: RecordQuestItem[];
	portrait?: string;
	createdAt: string;
	updatedAt: string;
};

export type PortraitGalleryEntry = {
	id: string;
	label: string;
	category: string;
	src: string;
	kind: 'character' | 'creature';
};

export const CHARACTER_PORTRAIT_ARCHETYPES: readonly { key: string; label: string }[] = [
	{ key: 'warrior', label: 'Warrior' },
	{ key: 'ranger', label: 'Ranger' },
	{ key: 'rogue', label: 'Rogue' },
	{ key: 'wizard', label: 'Wizard' },
	{ key: 'cleric', label: 'Cleric' },
	{ key: 'paladin', label: 'Paladin' },
	{ key: 'barbarian', label: 'Barbarian' },
	{ key: 'druid', label: 'Druid' },
	{ key: 'assassin', label: 'Assassin' },
	{ key: 'swashbuckler', label: 'Swashbuckler' },
	{ key: 'acrobat', label: 'Acrobat' },
	{ key: 'illusionist', label: 'Illusionist' },
	{ key: 'bulwark', label: 'Bulwark' },
	{ key: 'light_gladiator', label: 'Gladiator' },
	{ key: 'elf', label: 'Elf' },
	{ key: 'dwarf', label: 'Dwarf' },
	{ key: 'halfling', label: 'Halfling' },
	{ key: 'gnome', label: 'Gnome' },
	{ key: 'kukla', label: 'Construct' },
	{ key: 'mushroom_monk', label: 'Myconid' }
];

export const CHARACTER_PORTRAIT_GALLERY: PortraitGalleryEntry[] = CHARACTER_PORTRAIT_ARCHETYPES.flatMap(({ key, label }) =>
	[1, 2, 3, 4].map((variant) => ({
		id: `${key}_${variant}`,
		label: `${label} ${variant}`,
		category: label,
		src: asset(`art/portraits/${key}_${variant}.webp` as AssetPath),
		kind: 'character' as const
	}))
);

export const CREATURE_PORTRAIT_GALLERY: PortraitGalleryEntry[] = [
	{ id: 'merchant', label: 'Merchant', category: 'NPC & Creature', src: asset('art/portraits/creatures/merchant.webp'), kind: 'creature' },
	{ id: 'wandering_alchemist', label: 'Wandering Alchemist', category: 'NPC & Creature', src: asset('art/portraits/creatures/wandering_alchemist.webp'), kind: 'creature' },
	{ id: 'dwarf_miner', label: 'Dwarf Miner', category: 'NPC & Creature', src: asset('art/portraits/creatures/dwarf_miner.webp'), kind: 'creature' },
	{ id: 'halfling_scout', label: 'Halfling Scout', category: 'NPC & Creature', src: asset('art/portraits/creatures/halfling_scout.webp'), kind: 'creature' },
	{ id: 'lady_in_white', label: 'Lady in White', category: 'NPC & Creature', src: asset('art/portraits/creatures/lady_in_white.webp'), kind: 'creature' },
	{ id: 'kelak', label: 'Kelak', category: 'NPC & Creature', src: asset('art/portraits/creatures/kelak.webp'), kind: 'creature' },
	{ id: 'milethia', label: 'Milethia', category: 'NPC & Creature', src: asset('art/portraits/creatures/milethia.webp'), kind: 'creature' },
	{ id: 'zurla', label: 'Zurla', category: 'NPC & Creature', src: asset('art/portraits/creatures/zurla.webp'), kind: 'creature' },
	{ id: 'doppelganger', label: 'Doppelganger', category: 'NPC & Creature', src: asset('art/portraits/creatures/doppelganger.webp'), kind: 'creature' },
	{ id: 'chaos_lord', label: 'Chaos Lord', category: 'NPC & Creature', src: asset('art/portraits/creatures/chaos_lord.webp'), kind: 'creature' },
	{ id: 'caveman_champion', label: 'Tribal Champion', category: 'NPC & Creature', src: asset('art/portraits/creatures/caveman_champion.webp'), kind: 'creature' },
	{ id: 'fire_bear', label: 'Fire Bear', category: 'NPC & Creature', src: asset('art/portraits/creatures/fire_bear.webp'), kind: 'creature' },
	{ id: 'cavern_werebear', label: 'Werebear', category: 'NPC & Creature', src: asset('art/portraits/creatures/cavern_werebear.webp'), kind: 'creature' },
	{ id: 'young_red_dragon', label: 'Red Dragon', category: 'NPC & Creature', src: asset('art/portraits/creatures/young_red_dragon.webp'), kind: 'creature' },
	{ id: 'young_dragon', label: 'Green Dragon', category: 'NPC & Creature', src: asset('art/portraits/creatures/young_dragon.webp'), kind: 'creature' },
	{ id: 'wraith', label: 'Wraith', category: 'NPC & Creature', src: asset('art/portraits/creatures/wraith.webp'), kind: 'creature' },
	{ id: 'ghost', label: 'Ghost', category: 'NPC & Creature', src: asset('art/portraits/creatures/ghost.webp'), kind: 'creature' },
	{ id: 'minotaur', label: 'Minotaur', category: 'NPC & Creature', src: asset('art/portraits/creatures/minotaur.webp'), kind: 'creature' },
	{ id: 'medusa', label: 'Medusa', category: 'NPC & Creature', src: asset('art/portraits/creatures/medusa.webp'), kind: 'creature' },
	{ id: 'flesh_golem', label: 'Construct Golem', category: 'NPC & Creature', src: asset('art/portraits/creatures/flesh_golem.webp'), kind: 'creature' },
	{ id: 'chimaera', label: 'Chimaera', category: 'NPC & Creature', src: asset('art/portraits/creatures/chimaera.webp'), kind: 'creature' },
	{ id: 'living_statue', label: 'Living Statue', category: 'NPC & Creature', src: asset('art/portraits/creatures/living_statue.webp'), kind: 'creature' },
	{ id: 'skeletal_demon', label: 'Skeletal Demon', category: 'NPC & Creature', src: asset('art/portraits/creatures/skeletal_demon.webp'), kind: 'creature' },
	{ id: 'myco_tyrant', label: 'Myco Tyrant', category: 'NPC & Creature', src: asset('art/portraits/creatures/myco_tyrant.webp'), kind: 'creature' }
];

export const ALL_PORTRAIT_GALLERY: PortraitGalleryEntry[] = [...CHARACTER_PORTRAIT_GALLERY, ...CREATURE_PORTRAIT_GALLERY];

export function resolveRecordPortrait(record: { id: string; kind: RecordKind; fields: Record<string, string>; portrait?: string }): string {
	if (record.portrait?.trim()) return record.portrait.trim();
	const seedText = `${record.id}:${record.fields.Name ?? ''}:${record.fields.Role ?? ''}`;
	let hash = 0;
	for (let i = 0; i < seedText.length; i++) {
		hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
	}
	if (record.kind === 'npc' && record.fields['NPC Type'] === 'Creature') {
		return CREATURE_PORTRAIT_GALLERY[hash % CREATURE_PORTRAIT_GALLERY.length].src;
	}
	const hint = `${record.fields.Species ?? ''} ${record.fields.Role ?? ''} ${record.fields.Description ?? ''}`.toLowerCase();
	const matchedArchetype =
		/elf/.test(hint) ? 'elf' :
		/dwarf/.test(hint) ? 'dwarf' :
		/halfling/.test(hint) ? 'halfling' :
		/gnome/.test(hint) ? 'gnome' :
		/construct|automaton|android|cyborg/.test(hint) ? 'kukla' :
		/scout|hunter|tracker|navigator|archer|ranger/.test(hint) ? 'ranger' :
		/mystic|mage|sorcerer|scholar|arcanist|seer/.test(hint) ? 'wizard' :
		/healer|priest|cleric|devout|monk/.test(hint) ? 'cleric' :
		/pirate|captain|corsair|sailor|duelist|smuggler/.test(hint) ? 'swashbuckler' :
		/thief|rogue|scoundrel|outcast|infiltrator/.test(hint) ? 'rogue' :
		/assassin|bounty|agent|shadow/.test(hint) ? 'assassin' :
		/knight|vanguard|warden|paladin|oath/.test(hint) ? 'paladin' :
		/raider|berserker|reaver|warlord/.test(hint) ? 'barbarian' :
		/guard|defender|shield|mercenary|soldier|warrior/.test(hint) ? 'warrior' :
		'';
	if (matchedArchetype) {
		const variant = (hash % 4) + 1;
		const entry = CHARACTER_PORTRAIT_GALLERY.find((item) => item.id === `${matchedArchetype}_${variant}`);
		if (entry) return entry.src;
	}
	return CHARACTER_PORTRAIT_GALLERY[hash % CHARACTER_PORTRAIT_GALLERY.length].src;
}

const kinds = new Set<RecordKind>(['hero', 'npc']);
const statNames = ['momentum', 'health', 'spirit', 'supply', 'edge', 'heart', 'iron', 'shadow', 'wits'] as const;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

function isRecord(value: unknown): value is CampaignRecord {
	if (!value || typeof value !== 'object') return false;
	const record = value as Partial<CampaignRecord>;
	if (typeof record.id !== 'string' || !record.id || !kinds.has(record.kind as RecordKind) ||
		!record.fields || typeof record.fields !== 'object' || Array.isArray(record.fields) ||
		!record.stats || typeof record.stats !== 'object' ||
		!isStringArray(record.assets) || !isStringArray(record.legacyAndVows) || !isStringArray(record.debilities) ||
		typeof record.characterDetails !== 'string' || typeof record.notes !== 'string' ||
		(record.portrait !== undefined && typeof record.portrait !== 'string') ||
		typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') return false;
	if (Object.values(record.fields).some((field) => typeof field !== 'string')) return false;
	const stats = record.stats;
	return !!stats && statNames.every((name) => {
		const min = name === 'momentum' ? -6 : 0;
		return Number.isInteger(stats[name]) && stats[name] >= min && stats[name] <= 10;
	});
}

export function parseCampaignRecords(serialized: string | null, kind?: RecordKind): CampaignRecord[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, CampaignRecord>();
		for (const item of value) if (isRecord(item) && (!kind || item.kind === kind)) unique.set(item.id, item);
		return [...unique.values()];
	} catch { return []; }
}

export function makeCampaignRecord(kind: RecordKind, fields: Record<string, string>, id: string = createId(), now = new Date().toISOString()): CampaignRecord {
	if (!kinds.has(kind)) throw new Error('Choose Hero or NPC.');
	const cleanFields = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()]));
	if (!cleanFields.Name) throw new Error('Enter a name for this record.');
	return {
		id, kind, fields: cleanFields,
		stats: { momentum: 2, health: 5, spirit: 5, supply: 5, edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 },
		assets: [], legacyAndVows: [], debilities: [], characterDetails: '', notes: '', createdAt: now, updatedAt: now
	};
}

export function putCampaignRecord(records: CampaignRecord[], record: CampaignRecord): CampaignRecord[] {
	return [...records.filter((item) => item.id !== record.id), record];
}

export function updateCampaignRecord(
	records: CampaignRecord[],
	id: string,
	update: Partial<Omit<CampaignRecord, 'id' | 'kind' | 'createdAt' | 'updatedAt'>>,
	now = new Date().toISOString()
): CampaignRecord[] {
	return records.map((record) => record.id === id ? { ...record, ...update, fields: update.fields ? { ...update.fields } : record.fields, stats: update.stats ? { ...record.stats, ...update.stats } : record.stats, updatedAt: now } : record);
}

export function removeCampaignRecord(records: CampaignRecord[], id: string): CampaignRecord[] {
	return records.filter((record) => record.id !== id);
}

export function moveCampaignRecord(records: CampaignRecord[], id: string, direction: 'up' | 'down'): CampaignRecord[] {
	const index = records.findIndex((record) => record.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= records.length) return records;
	const next = [...records];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

export function convertNpcToHero(records: CampaignRecord[], id: string, now = new Date().toISOString()): CampaignRecord[] {
	return records.map((record) => record.id === id && record.kind === 'npc'
		? { ...record, kind: 'hero', fields: { ...record.fields }, updatedAt: now }
		: record);
}

export function convertHeroToNpc(records: CampaignRecord[], id: string, now = new Date().toISOString()): CampaignRecord[] {
	return records.map((record) => record.id === id && record.kind === 'hero'
		? { ...record, kind: 'npc', fields: { ...record.fields }, updatedAt: now }
		: record);
}

export function exportCampaignRecord(record: CampaignRecord): string {
	return JSON.stringify(record, null, 2);
}
