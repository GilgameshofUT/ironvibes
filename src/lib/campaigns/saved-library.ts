import type { CampaignAsset } from './assets';
import type { CampaignFaction } from './factions';
import type { CampaignLocation } from './locations';
import type { CampaignRecord } from './records';
import type { CampaignTheme } from './themes';
import { parseCustomOracles, type CustomOracle } from '../datasworn/oracles';

export type SavedLibraryKind = 'hero' | 'npc' | 'location' | 'faction' | 'asset' | 'theme' | 'oracle';

export type SavedLibrary = {
	heroes: CampaignRecord[];
	npcs: CampaignRecord[];
	locations: CampaignLocation[];
	factions: CampaignFaction[];
	assets: CampaignAsset[];
	themes: CampaignTheme[];
	oracles: CustomOracle[];
};

export function emptySavedLibrary(): SavedLibrary {
	return {
		heroes: [],
		npcs: [],
		locations: [],
		factions: [],
		assets: [],
		themes: [],
		oracles: []
	};
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
	const index = items.findIndex((existing) => existing.id === item.id);
	if (index === -1) return [...items, item];
	const next = [...items];
	next[index] = item;
	return next;
}

export function upsertSavedRecord(library: SavedLibrary, record: CampaignRecord): SavedLibrary {
	if (record.kind === 'hero') return { ...library, heroes: upsertById(library.heroes, record) };
	return { ...library, npcs: upsertById(library.npcs, record) };
}

export function upsertSavedLocation(library: SavedLibrary, location: CampaignLocation): SavedLibrary {
	return { ...library, locations: upsertById(library.locations, location) };
}

export function upsertSavedFaction(library: SavedLibrary, faction: CampaignFaction): SavedLibrary {
	return { ...library, factions: upsertById(library.factions, faction) };
}

export function upsertSavedAsset(library: SavedLibrary, asset: CampaignAsset): SavedLibrary {
	return { ...library, assets: upsertById(library.assets, asset) };
}

export function upsertSavedTheme(library: SavedLibrary, theme: CampaignTheme): SavedLibrary {
	return { ...library, themes: upsertById(library.themes, theme) };
}

export function upsertSavedOracle(library: SavedLibrary, oracle: CustomOracle): SavedLibrary {
	return { ...library, oracles: upsertById(library.oracles ?? [], oracle) };
}

export function parseSavedLibrary(serialized: string | null): SavedLibrary {
	if (!serialized) return emptySavedLibrary();
	try {
		const raw: unknown = JSON.parse(serialized);
		const root = Array.isArray(raw) ? raw[0] : raw;
		if (!root || typeof root !== 'object') return emptySavedLibrary();
		const obj = root as Record<string, unknown>;
		return {
			heroes: Array.isArray(obj.heroes) ? (obj.heroes.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignRecord[]) : [],
			npcs: Array.isArray(obj.npcs) ? (obj.npcs.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignRecord[]) : [],
			locations: Array.isArray(obj.locations) ? (obj.locations.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignLocation[]) : [],
			factions: Array.isArray(obj.factions) ? (obj.factions.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignFaction[]) : [],
			assets: Array.isArray(obj.assets) ? (obj.assets.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignAsset[]) : [],
			themes: Array.isArray(obj.themes) ? (obj.themes.filter((item) => item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') as CampaignTheme[]) : [],
			oracles: Array.isArray(obj.oracles) ? parseCustomOracles(JSON.stringify(obj.oracles)) : []
		};
	} catch {
		return emptySavedLibrary();
	}
}

export function serializeSavedLibrary(library: SavedLibrary): string {
	return JSON.stringify([{ id: 1, ...library, oracles: library.oracles ?? [] }], null, 2);
}
