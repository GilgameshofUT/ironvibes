import { createId } from '../id';

export const LOCATION_ORIGINS = ['Ironsworn', 'Starforged', 'Sundered Isles'] as const;
export type LocationOrigin = (typeof LOCATION_ORIGINS)[number];
export const LOCATION_FIELDS = [
	'settlementName', 'settlementLocation', 'settlementType', 'condition', 'population', 'size', 'aesthetics', 'description', 'firstLook',
	'controllingFaction', 'disposition', 'initialContact', 'authority', 'projects', 'culturalTouchstones', 'details', 'bond', 'theme', 'focus', 'location'
] as const;
export type LocationField = (typeof LOCATION_FIELDS)[number];

export type CampaignLocation = {
	id: string;
	origin: LocationOrigin;
	type: string;
	/** Setting region, separate from record type and optional for older saved campaigns. */
	region?: string;
	rollWithCursedDie: boolean;
	useExtendedNames: boolean;
	fields: Record<LocationField, string>;
	quests?: { id: string; name: string }[];
	npcs?: string[];
	sublocations?: string[];
	notes?: string;
	createdAt: string;
	updatedAt: string;
};

const origins = new Set<string>(LOCATION_ORIGINS);

export function parseCampaignLocations(serialized: string | null): CampaignLocation[] {
	if (!serialized) return [];
	try {
		const data: unknown = JSON.parse(serialized);
		if (!Array.isArray(data)) return [];
		const unique = new Map<string, CampaignLocation>();
		for (const value of data) {
			if (!value || typeof value !== 'object') continue;
			const location = value as Partial<CampaignLocation>;
			if (typeof location.id !== 'string' || !location.id || typeof location.origin !== 'string' || !origins.has(location.origin) ||
				typeof location.type !== 'string' || (location.region !== undefined && typeof location.region !== 'string') || typeof location.rollWithCursedDie !== 'boolean' || typeof location.useExtendedNames !== 'boolean' ||
				!location.fields || typeof location.fields !== 'object' || !LOCATION_FIELDS.every((field) => typeof location.fields?.[field] === 'string') ||
				typeof location.createdAt !== 'string' || typeof location.updatedAt !== 'string') continue;
			unique.set(location.id, location as CampaignLocation);
		}
		return [...unique.values()];
	} catch { return []; }
}

export function makeCampaignLocation(input: {
	origin: LocationOrigin;
	type: string;
	region?: string;
	rollWithCursedDie?: boolean;
	useExtendedNames?: boolean;
	fields?: Partial<Record<LocationField, string>>;
}, id: string = createId(), now = new Date().toISOString()): CampaignLocation {
	if (!origins.has(input.origin)) throw new Error('Choose a supported location origin.');
	const fields = Object.fromEntries(LOCATION_FIELDS.map((field) => [field, input.fields?.[field]?.trim() ?? ''])) as Record<LocationField, string>;
	if (!fields.settlementName) throw new Error('Enter a settlement or location name.');
	return { id, origin: input.origin, type: input.type.trim(), region: input.region?.trim() ?? '', rollWithCursedDie: !!input.rollWithCursedDie, useExtendedNames: !!input.useExtendedNames, fields, createdAt: now, updatedAt: now };
}

export function putCampaignLocation(locations: CampaignLocation[], location: CampaignLocation): CampaignLocation[] {
	return [...locations.filter((item) => item.id !== location.id), location];
}

export function updateCampaignLocation(locations: CampaignLocation[], id: string, update: {
	origin?: LocationOrigin; type?: string; region?: string; rollWithCursedDie?: boolean; useExtendedNames?: boolean; fields?: Partial<Record<LocationField, string>>;
	quests?: { id: string; name: string }[]; npcs?: string[]; sublocations?: string[]; notes?: string;
}, now = new Date().toISOString()): CampaignLocation[] {
	return locations.map((location) => location.id === id
		? { ...location, ...update, fields: update.fields ? { ...location.fields, ...update.fields } : location.fields, updatedAt: now }
		: location);
}

export function removeCampaignLocation(locations: CampaignLocation[], id: string): CampaignLocation[] {
	return locations.filter((location) => location.id !== id);
}

export function moveCampaignLocation(locations: CampaignLocation[], id: string, direction: 'up' | 'down'): CampaignLocation[] {
	const index = locations.findIndex((location) => location.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= locations.length) return locations;
	const next = [...locations];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}
