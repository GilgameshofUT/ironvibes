import { createId } from '../id';

export const SITE_TYPES = ['Delve', 'Derelict', 'Vault', 'Shipwreck', 'Cave', 'Ruin'] as const;
export type SiteType = (typeof SITE_TYPES)[number];
export const SITE_RANKS = ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'] as const;
export type SiteRank = (typeof SITE_RANKS)[number];

export const SITE_DETAIL_FIELDS = {
	Delve: [],
	Derelict: ['location', 'kind', 'condition', 'outerFirstLook', 'innerFirstLook'],
	Vault: ['location', 'scale', 'form', 'shape', 'material', 'outerFirstLook'],
	Shipwreck: ['location', 'position', 'scale', 'wholeness', 'firstLook'],
	Cave: ['caveType', 'threshold', 'lurkingThreat'],
	Ruin: ['location', 'condition', 'scope', 'firstLook']
} as const satisfies Record<SiteType, readonly string[]>;

export type SiteDetailField = 'location' | 'kind' | 'condition' | 'outerFirstLook' | 'innerFirstLook' | 'scale' | 'form' | 'shape' | 'material' | 'position' | 'wholeness' | 'firstLook' | 'caveType' | 'threshold' | 'lurkingThreat' | 'scope';
export type SiteArea = {
	id: string;
	name: string;
	feature: string;
	danger: string;
	opportunity: string;
	aspect: string;
	notes: string;
	/** Non-Delve waypoint details; optional so existing saved areas remain readable. */
	zone?: string;
	area?: string;
	peril?: string;
	details?: string;
	descriptor?: string;
};
export const SITE_DETAIL_LABELS: Record<SiteDetailField, string> = {
	location: 'Location', kind: 'Type', condition: 'Condition', outerFirstLook: 'Outer first look', innerFirstLook: 'Inner first look',
	scale: 'Scale', form: 'Form', shape: 'Shape', material: 'Material', position: 'Position', wholeness: 'Wholeness',
	firstLook: 'First look', caveType: 'Type', threshold: 'Threshold', lurkingThreat: 'Lurking threat', scope: 'Scope'
};

export type CampaignSite = {
	id: string;
	type: SiteType;
	rank: SiteRank;
	fields: { theme: string; domain: string; secondaryTheme: string; secondaryDomain: string; description: string; detail: string; namesake: string; place: string; name: string; aspectFocus: string };
	/** Non-Delve fields are optional to preserve previously exported site archives. */
	details?: Partial<Record<SiteDetailField, string>>;
	rollWithCursedDie?: boolean;
	areas?: SiteArea[];
	activeTheme?: string;
	activeDomain?: string;
	denizens?: string;
	notes?: string;
	discoveries?: Partial<Record<'purpose' | 'heart' | 'cipher' | 'mystery' | 'innerFirstLook', string>>;
	resolvedAt?: string;
	resolution?: string;
	progress: number;
	createdAt: string;
	updatedAt: string;
};

const siteTypes = new Set<string>(SITE_TYPES);
const ranks = new Set<string>(SITE_RANKS);
const fieldNames = ['theme', 'domain', 'secondaryTheme', 'secondaryDomain', 'description', 'detail', 'namesake', 'place', 'name', 'aspectFocus'] as const;
const detailNames = new Set<string>(Object.values(SITE_DETAIL_FIELDS).flat());

function isArea(value: unknown): value is SiteArea {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const area = value as Partial<SiteArea>;
	return typeof area.id === 'string' && !!area.id &&
		(['name', 'feature', 'danger', 'opportunity', 'aspect', 'notes'] as const).every((key) => typeof area[key] === 'string') &&
		(['zone', 'area', 'peril', 'details', 'descriptor'] as const).every((key) => area[key] === undefined || typeof area[key] === 'string');
}

function isSite(value: unknown): value is CampaignSite {
	if (!value || typeof value !== 'object') return false;
	const site = value as Partial<CampaignSite>;
	if (typeof site.id !== 'string' || !site.id || typeof site.type !== 'string' || !siteTypes.has(site.type) || typeof site.rank !== 'string' || !ranks.has(site.rank) ||
		!site.fields || typeof site.fields !== 'object' || typeof site.progress !== 'number' || !Number.isInteger(site.progress) || site.progress < 0 || site.progress > 10 ||
		typeof site.createdAt !== 'string' || typeof site.updatedAt !== 'string') return false;
	return fieldNames.every((field) => typeof site.fields?.[field] === 'string') &&
		(site.rollWithCursedDie === undefined || typeof site.rollWithCursedDie === 'boolean') &&
		(site.areas === undefined || (Array.isArray(site.areas) && site.areas.every(isArea) && new Set(site.areas.map((area) => area.id)).size === site.areas.length)) &&
		(['activeTheme', 'activeDomain', 'denizens', 'notes', 'resolvedAt', 'resolution'] as const).every((key) => site[key] === undefined || typeof site[key] === 'string') &&
		(site.discoveries === undefined || (!!site.discoveries && typeof site.discoveries === 'object' && !Array.isArray(site.discoveries) &&
			Object.entries(site.discoveries).every(([key, value]) => ['purpose', 'heart', 'cipher', 'mystery', 'innerFirstLook'].includes(key) && typeof value === 'string'))) &&
		(site.details === undefined || (!!site.details && typeof site.details === 'object' && !Array.isArray(site.details) &&
			Object.entries(site.details).every(([key, value]) => detailNames.has(key) && typeof value === 'string')));
}

export function parseCampaignSites(serialized: string | null): CampaignSite[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, CampaignSite>();
		for (const item of value) if (isSite(item)) unique.set(item.id, item);
		return [...unique.values()];
	} catch { return []; }
}

export function makeCampaignSite(input: { type: SiteType; rank: SiteRank; fields: Partial<CampaignSite['fields']>; details?: CampaignSite['details']; rollWithCursedDie?: boolean }, id: string = createId(), now = new Date().toISOString()): CampaignSite {
	if (!siteTypes.has(input.type) || !ranks.has(input.rank)) throw new Error('Choose a supported site type and rank.');
	const fields = Object.fromEntries(fieldNames.map((field) => [field, input.fields[field]?.trim() ?? ''])) as CampaignSite['fields'];
	if (!fields.name) throw new Error('Enter a name for this site.');
	const details = Object.fromEntries(Object.entries(input.details ?? {}).filter(([key]) => (SITE_DETAIL_FIELDS[input.type] as readonly string[]).includes(key)).map(([key, value]) => [key, value?.trim() ?? ''])) as CampaignSite['details'];
	return { id, type: input.type, rank: input.rank, fields, details, rollWithCursedDie: !!input.rollWithCursedDie, areas: [], progress: 0, createdAt: now, updatedAt: now };
}

export function putCampaignSite(sites: CampaignSite[], site: CampaignSite): CampaignSite[] {
	return [...sites.filter((item) => item.id !== site.id), site];
}

export function updateCampaignSite(sites: CampaignSite[], id: string, update: { type?: SiteType; rank?: SiteRank; fields?: Partial<CampaignSite['fields']>; details?: CampaignSite['details']; rollWithCursedDie?: boolean; areas?: SiteArea[]; activeTheme?: string; activeDomain?: string; denizens?: string; notes?: string; discoveries?: CampaignSite['discoveries']; resolvedAt?: string; resolution?: string; progress?: number }, now = new Date().toISOString()): CampaignSite[] {
	return sites.map((site) => site.id === id ? { ...site, ...update, fields: update.fields ? { ...site.fields, ...update.fields } : site.fields, updatedAt: now } : site);
}

export function addSiteArea(site: CampaignSite, id: string = createId(), feature = ''): SiteArea[] {
	if (site.resolvedAt) throw new Error('Reactivate this Delve before adding another area.');
	const nextNumber = Math.max(0, ...(site.areas ?? []).map((area) => /^Area #(\d+)$/.exec(area.name)?.[1]).filter((value): value is string => !!value).map(Number)) + 1;
	return [...(site.areas ?? []), { id, name: `Area #${nextNumber}`, feature, danger: '', opportunity: '', aspect: '', notes: '' }];
}

export function addSiteWaypoint(site: CampaignSite, zone = '', area = '', feature = '', id: string = createId()): SiteArea[] {
	if (site.type === 'Delve') throw new Error('Use Delve areas for this site.');
	if (site.resolvedAt) throw new Error('Reactivate this site before adding a waypoint.');
	const prefix = site.type === 'Derelict' ? 'Zone' : site.type === 'Vault' && zone === 'Sanctum' ? 'Sanctum' : 'Waypoint';
	const nextNumber = Math.max(0, ...(site.areas ?? []).map((item) => new RegExp(`^${prefix} #(\\d+)$`).exec(item.name)?.[1]).filter((value): value is string => !!value).map(Number)) + 1;
	return [...(site.areas ?? []), { id, name: `${prefix} #${nextNumber}`, zone, area, feature, peril: '', details: '', descriptor: '', danger: '', opportunity: '', aspect: '', notes: '' }];
}

export function updateSiteArea(site: CampaignSite, areaId: string, patch: Partial<Omit<SiteArea, 'id'>>): SiteArea[] {
	return (site.areas ?? []).map((area) => area.id === areaId ? { ...area, ...patch } : area);
}

export function rollSiteObjective(site: CampaignSite, random: () => number = Math.random): string {
	const die = () => Math.floor(Math.max(0, Math.min(0.999999999, random())) * 10) + 1;
	const first = die(), second = die();
	const outcome = site.progress > first && site.progress > second ? 'Strong hit' : site.progress > first || site.progress > second ? 'Weak hit' : 'Miss';
	return `Result: ${first}, ${second} vs ${site.progress} progress, ${outcome}.`;
}

export function removeCampaignSite(sites: CampaignSite[], id: string): CampaignSite[] {
	return sites.filter((site) => site.id !== id);
}

export function moveCampaignSite(sites: CampaignSite[], id: string, direction: 'up' | 'down'): CampaignSite[] {
	const index = sites.findIndex((site) => site.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= sites.length) return sites;
	const next = [...sites];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

export type DenizenSlot = {
	min: number;
	max: number;
	tier: string;
	name: string;
};

export const DEFAULT_DENIZEN_SLOTS: readonly DenizenSlot[] = [
	{ min: 1, max: 27, tier: 'Very common', name: '' },
	{ min: 28, max: 41, tier: 'Common', name: '' },
	{ min: 42, max: 55, tier: 'Common', name: '' },
	{ min: 56, max: 69, tier: 'Common', name: '' },
	{ min: 70, max: 75, tier: 'Uncommon', name: '' },
	{ min: 76, max: 81, tier: 'Uncommon', name: '' },
	{ min: 82, max: 87, tier: 'Uncommon', name: '' },
	{ min: 88, max: 93, tier: 'Uncommon', name: '' },
	{ min: 94, max: 95, tier: 'Rare', name: '' },
	{ min: 96, max: 97, tier: 'Rare', name: '' },
	{ min: 98, max: 99, tier: 'Rare', name: '' },
	{ min: 100, max: 100, tier: 'Unforseen', name: '' }
];

export function parseSiteDenizenTable(serialized: string | undefined): DenizenSlot[] {
	const base = DEFAULT_DENIZEN_SLOTS.map((slot) => ({ ...slot }));
	if (!serialized) return base;
	try {
		const raw: unknown = JSON.parse(serialized);
		if (!Array.isArray(raw)) return base;
		return base.map((slot, index) => {
			const item = raw[index] as { name?: unknown; label?: unknown } | undefined;
			const name = typeof item?.name === 'string' ? item.name : typeof item?.label === 'string' && item.label !== 'None' ? item.label : '';
			return { ...slot, name: name.trim() };
		});
	} catch {
		return base;
	}
}

export function serializeSiteDenizenTable(slots: DenizenSlot[]): string {
	return JSON.stringify(slots.map((slot) => ({ min: slot.min, max: slot.max, tier: slot.tier, name: slot.name.trim() })));
}

export function rollSiteDenizen(slots: DenizenSlot[], random: () => number = Math.random): { roll: number; slot: DenizenSlot; text: string } {
	const roll = Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;
	const slot = slots.find((item) => roll >= item.min && roll <= item.max) ?? slots[0] ?? DEFAULT_DENIZEN_SLOTS[0];
	const label = slot.name.trim() || `${slot.tier} (${slot.min}–${slot.max})`;
	return { roll, slot, text: `${roll}: ${label}` };
}
