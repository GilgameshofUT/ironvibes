import { createId } from '../id';

export const FACTION_ORIGINS = ['Starforged', 'Sundered Isles'] as const;
export type FactionOrigin = (typeof FACTION_ORIGINS)[number];

export const FACTION_FIELDS = [
	'cursedRole', 'cursedAspects', 'cursedGoals', 'influence', 'projects', 'relationships', 'culture', 'theme', 'aspect', 'persona', 'name', 'quirks', 'rumors'
] as const;
export const SOCIETY_FIELDS = ['societyChronicles', 'societyOverseers', 'societyTouchstones', 'societyIdentity'] as const;
export type FactionField = (typeof FACTION_FIELDS)[number] | (typeof SOCIETY_FIELDS)[number];

export type CampaignFaction = {
	id: string;
	origin: FactionOrigin;
	type: string;
	forceCursed: boolean;
	rollWithCursedDie: boolean;
	fields: Record<FactionField, string>;
	members?: string[];
	notes?: string;
	createdAt: string;
	updatedAt: string;
};

const origins = new Set<string>(FACTION_ORIGINS);
const fieldNames: FactionField[] = [...FACTION_FIELDS, ...SOCIETY_FIELDS];

function isFaction(value: unknown): value is CampaignFaction {
	if (!value || typeof value !== 'object') return false;
	const faction = value as Partial<CampaignFaction>;
	if (typeof faction.id !== 'string' || !faction.id || typeof faction.origin !== 'string' || !origins.has(faction.origin) ||
		typeof faction.type !== 'string' || typeof faction.forceCursed !== 'boolean' || typeof faction.rollWithCursedDie !== 'boolean' ||
		!faction.fields || typeof faction.fields !== 'object' || typeof faction.createdAt !== 'string' || typeof faction.updatedAt !== 'string') return false;
	return fieldNames.every((field) => typeof faction.fields?.[field] === 'string');
}

export function parseCampaignFactions(serialized: string | null): CampaignFaction[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, CampaignFaction>();
		for (const item of value) if (isFaction(item)) unique.set(item.id, item);
		return [...unique.values()];
	} catch { return []; }
}

export function makeCampaignFaction(input: {
	origin: FactionOrigin;
	type?: string;
	forceCursed?: boolean;
	rollWithCursedDie?: boolean;
	fields?: Partial<Record<FactionField, string>>;
}, id: string = createId(), now = new Date().toISOString()): CampaignFaction {
	if (!origins.has(input.origin)) throw new Error('Choose a supported faction origin.');
	const fields = Object.fromEntries(fieldNames.map((field) => [field, input.fields?.[field]?.trim() ?? ''])) as Record<FactionField, string>;
	if (!fields.name) throw new Error('Enter a name for this faction.');
	return {
		id,
		origin: input.origin,
		type: input.type?.trim() ?? '',
		forceCursed: input.forceCursed ?? false,
		rollWithCursedDie: input.rollWithCursedDie ?? false,
		fields,
		createdAt: now,
		updatedAt: now
	};
}

export function putCampaignFaction(factions: CampaignFaction[], faction: CampaignFaction): CampaignFaction[] {
	return [...factions.filter((item) => item.id !== faction.id), faction];
}

export function updateCampaignFaction(
	factions: CampaignFaction[],
	id: string,
	update: { origin?: FactionOrigin; type?: string; forceCursed?: boolean; rollWithCursedDie?: boolean; fields?: Partial<Record<FactionField, string>>; members?: string[]; notes?: string },
	now = new Date().toISOString()
): CampaignFaction[] {
	return factions.map((faction) => faction.id === id
		? { ...faction, ...update, fields: update.fields ? { ...faction.fields, ...update.fields } : faction.fields, updatedAt: now }
		: faction);
}

export function removeCampaignFaction(factions: CampaignFaction[], id: string): CampaignFaction[] {
	return factions.filter((faction) => faction.id !== id);
}

export function moveCampaignFaction(factions: CampaignFaction[], id: string, direction: 'up' | 'down'): CampaignFaction[] {
	const index = factions.findIndex((faction) => faction.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= factions.length) return factions;
	const next = [...factions];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}
