import { createId } from '../id';
import { makeJournalEntry, parseJournalEntries, type JournalEntry } from './journal';
import { makeCampaignTrack, parseCampaignTracks, type CampaignTrack, type TrackRank, type TrackType } from './tracks';
import { makeCampaignRecord, parseCampaignRecords, type CampaignRecord } from './records';
import { makeCampaignSite, parseCampaignSites, type CampaignSite, type SiteRank, type SiteType } from './sites';
import { makeCampaignFaction, parseCampaignFactions, type CampaignFaction } from './factions';
import { makeCampaignLocation, parseCampaignLocations, type CampaignLocation } from './locations';
import { parseCampaignMaps, type CampaignMap } from './maps';
import { parseCampaignTruths, type CampaignTruth } from './truths';
import { parseCampaignAssets, type CampaignAsset } from './assets';
import { parseCampaignThemes, type CampaignTheme } from './themes';
import { makeCampaign, parseCampaigns, type Campaign, type CampaignSetting, type CharacterRuleset } from './store';

export type CampaignArchive = {
	format: 'ironvibes-campaign';
	version: 1;
	campaign: Campaign;
	journal: JournalEntry[];
	tracks: CampaignTrack[];
	records: CampaignRecord[];
	sites: CampaignSite[];
	factions: CampaignFaction[];
	locations: CampaignLocation[];
	maps: CampaignMap[];
	truths: CampaignTruth[];
	assets: CampaignAsset[];
	themes: CampaignTheme[];
};

type CampaignArchiveData = Omit<CampaignArchive, 'format' | 'version'>;

/** Create the portable, versioned JSON representation of one campaign and its records. */
export function makeCampaignArchive(data: Omit<CampaignArchiveData, 'assets' | 'themes'> & { assets?: CampaignAsset[]; themes?: CampaignTheme[] }): CampaignArchive {
	return { format: 'ironvibes-campaign', version: 1, ...data, assets: data.assets ?? [], themes: data.themes ?? [] };
}

/** Parse only complete archives understood by this app; reject partial or malformed data. */
export function parseCampaignArchive(serialized: string): CampaignArchive {
	let value: unknown;
	try {
		value = JSON.parse(serialized);
	} catch {
		throw new Error('This file is not valid JSON.');
	}
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Choose an Ironvibes campaign export.');
	const archive = value as Record<string, unknown>;
	if (archive.format !== 'ironvibes-campaign' || archive.version !== 1) throw new Error('This campaign export format or version is not supported.');
	const campaign = parseCampaigns(JSON.stringify([archive.campaign]));
	if (campaign.length !== 1) throw new Error('The campaign export has invalid campaign details.');
	const parseArray = <T>(key: string, parse: (raw: string) => T[]): T[] => {
		const items = archive[key];
		if (!Array.isArray(items)) throw new Error(`The campaign export is missing its ${key} data.`);
		const parsed = parse(JSON.stringify(items));
		if (parsed.length !== items.length) throw new Error(`The campaign export contains invalid ${key} data.`);
		return parsed;
	};
	return {
		format: 'ironvibes-campaign', version: 1, campaign: campaign[0],
		journal: parseArray('journal', parseJournalEntries),
		tracks: parseArray('tracks', parseCampaignTracks),
		records: parseArray('records', (raw) => parseCampaignRecords(raw)),
		sites: parseArray('sites', parseCampaignSites),
		factions: parseArray('factions', parseCampaignFactions),
		locations: parseArray('locations', parseCampaignLocations),
		maps: parseArray('maps', parseCampaignMaps),
		truths: parseArray('truths', parseCampaignTruths),
		assets: archive.assets === undefined ? [] : parseArray('assets', parseCampaignAssets),
		themes: archive.themes === undefined ? [] : parseArray('themes', parseCampaignThemes)
	};
}

function stripHtml(html: string): string {
	return html
		.replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.trim();
}

function convertPocketforgeCampaignObject(raw: Record<string, unknown>): CampaignArchive {
	const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Imported Pocketforge Campaign';
	const rawType = typeof raw.type === 'string' ? raw.type : 'ironsworn';
	const setting: CampaignSetting = rawType === 'isles' || rawType === 'sundered-isles' ? 'sundered-isles' : rawType === 'starforged' ? 'starforged' : 'ironsworn';
	const characterRuleset: CharacterRuleset = raw.rules === 'starforged' ? 'starforged' : 'ironsworn';
	const now = typeof raw.created === 'number' && raw.created > 0 ? new Date(raw.created).toISOString() : new Date().toISOString();
	const campaign = makeCampaign({ name, setting, characterRuleset }, typeof raw.id === 'string' && raw.id ? raw.id : createId(), now);

	const journalRaw = raw.journal && typeof raw.journal === 'object' ? (raw.journal as { entries?: unknown[]; wip?: { content?: unknown } }) : {};
	const journalEntries: JournalEntry[] = [];
	if (Array.isArray(journalRaw.entries)) {
		for (const item of journalRaw.entries) {
			if (item && typeof item === 'object') {
				const entry = item as { id?: unknown; content?: unknown; text?: unknown };
				const text = typeof entry.content === 'string' ? stripHtml(entry.content) : typeof entry.text === 'string' ? entry.text.trim() : '';
				if (text) journalEntries.push(makeJournalEntry(text, typeof entry.id === 'string' && entry.id ? entry.id : createId(), now));
			}
		}
	}
	if (journalRaw.wip && typeof journalRaw.wip.content === 'string') {
		const wipText = stripHtml(journalRaw.wip.content);
		if (wipText) journalEntries.push(makeJournalEntry(wipText, createId(), now));
	}

	const records: CampaignRecord[] = [];
	const mapOrigin = (o: unknown) => (o === 'starforged' ? 'Starforged' : o === 'isles' ? 'Sundered Isles' : 'Ironsworn');
	if (Array.isArray(raw.heroes)) {
		for (const h of raw.heroes) {
			if (!h || typeof h !== 'object') continue;
			const hero = h as Record<string, unknown>;
			const heroName = typeof hero.name === 'string' && hero.name.trim() ? hero.name.trim() : 'Imported Hero';
			const rec = makeCampaignRecord('hero', {
				Origin: mapOrigin(hero.origin),
				Name: heroName,
				'Family name': typeof hero.familyName === 'string' ? hero.familyName : '',
				Moniker: typeof hero.callsign === 'string' ? hero.callsign : '',
				Pronouns: typeof hero.pronouns === 'string' ? hero.pronouns : '',
				Description: typeof hero.description === 'string' ? hero.description : '',
				'First look': typeof hero.firstLook === 'string' ? hero.firstLook : '',
				Role: typeof hero.role === 'string' ? hero.role : '',
				Goal: typeof hero.goal === 'string' ? hero.goal : '',
				Backstory: typeof hero.backstory === 'string' ? hero.backstory : ''
			}, typeof hero.id === 'string' && hero.id ? hero.id : createId(), now);
			records.push(rec);
		}
	}
	if (Array.isArray(raw.npcs)) {
		for (const n of raw.npcs) {
			if (!n || typeof n !== 'object') continue;
			const npc = n as Record<string, unknown>;
			const npcName = typeof npc.name === 'string' && npc.name.trim() ? npc.name.trim() : 'Imported NPC';
			const rec = makeCampaignRecord('npc', {
				Origin: mapOrigin(npc.origin),
				Name: npcName,
				'NPC Type': npc.characterType === 'Creature' ? 'Creature' : 'NPC',
				Role: typeof npc.role === 'string' ? npc.role : '',
				Goal: typeof npc.goal === 'string' ? npc.goal : '',
				Disposition: typeof npc.disposition === 'string' ? npc.disposition : '',
				Description: typeof npc.description === 'string' ? npc.description : ''
			}, typeof npc.id === 'string' && npc.id ? npc.id : createId(), now);
			records.push(rec);
		}
	}

	const tracks: CampaignTrack[] = [];
	if (Array.isArray(raw.tracks)) {
		for (const t of raw.tracks) {
			if (!t || typeof t !== 'object') continue;
			const tr = t as Record<string, unknown>;
			const trName = typeof tr.name === 'string' && tr.name.trim() ? tr.name.trim() : 'Imported Track';
			const trType: TrackType = tr.type === 'Clock' || tr.type === 'Scene' ? tr.type : 'Progress';
			const trRank: TrackRank = ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'].includes(String(tr.rank)) ? (tr.rank as TrackRank) : 'Dangerous';
			tracks.push(makeCampaignTrack({ name: trName, type: trType, rank: trRank, threat: !!tr.hasThreat, steps: typeof tr.steps === 'number' ? tr.steps : 6 }, typeof tr.id === 'string' && tr.id ? tr.id : createId(), now));
		}
	}

	const sites: CampaignSite[] = [];
	if (Array.isArray(raw.sites)) {
		for (const s of raw.sites) {
			if (!s || typeof s !== 'object') continue;
			const st = s as Record<string, unknown>;
			const stName = typeof st.name === 'string' && st.name.trim() ? st.name.trim() : 'Imported Site';
			const rawSiteType = typeof st.siteType === 'string' ? st.siteType.charAt(0).toUpperCase() + st.siteType.slice(1) : 'Delve';
			const stType: SiteType = ['Delve', 'Derelict', 'Vault', 'Shipwreck', 'Cave', 'Ruin'].includes(rawSiteType) ? (rawSiteType as SiteType) : 'Delve';
			const trackObj = st.track && typeof st.track === 'object' ? (st.track as { rank?: unknown }) : {};
			const stRank: SiteRank = ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'].includes(String(trackObj.rank)) ? (trackObj.rank as SiteRank) : 'Dangerous';
			sites.push(makeCampaignSite({ type: stType, rank: stRank, fields: { name: stName, theme: typeof st.theme === 'string' ? st.theme : '', domain: typeof st.domain === 'string' ? st.domain : '' } }, typeof st.id === 'string' && st.id ? st.id : createId(), now));
		}
	}

	const locations: CampaignLocation[] = [];
	if (Array.isArray(raw.locations)) {
		for (const l of raw.locations) {
			if (!l || typeof l !== 'object') continue;
			const loc = l as Record<string, unknown>;
			const locName = typeof loc.name === 'string' && loc.name.trim() ? loc.name.trim() : 'Imported Location';
			locations.push(makeCampaignLocation({
				origin: mapOrigin(loc.origin),
				type: 'Settlement',
				fields: { settlementName: locName, description: typeof loc.description === 'string' ? loc.description : '' }
			}, typeof loc.id === 'string' && loc.id ? loc.id : createId(), now));
		}
	}

	const factions: CampaignFaction[] = [];
	if (Array.isArray(raw.factions)) {
		for (const f of raw.factions) {
			if (!f || typeof f !== 'object') continue;
			const fac = f as Record<string, unknown>;
			const facName = typeof fac.name === 'string' && fac.name.trim() ? fac.name.trim() : 'Imported Faction';
			factions.push(makeCampaignFaction({
				origin: fac.origin === 'isles' ? 'Sundered Isles' : 'Starforged',
				type: typeof fac.type === 'string' ? fac.type : 'Dominion',
				fields: { name: facName, influence: typeof fac.influence === 'string' ? fac.influence : '' }
			}, typeof fac.id === 'string' && fac.id ? fac.id : createId(), now));
		}
	}

	return makeCampaignArchive({
		campaign,
		journal: journalEntries,
		tracks,
		records,
		sites,
		factions,
		locations,
		maps: [],
		truths: [],
		assets: [],
		themes: []
	});
}

/** Accept either an Ironvibes single-campaign archive or a Pocketforge campaigns array export. */
export function parseCampaignImports(serialized: string): CampaignArchive[] {
	let value: unknown;
	try {
		value = JSON.parse(serialized);
	} catch {
		throw new Error('This file is not valid JSON.');
	}
	if (Array.isArray(value)) {
		const imported = value
			.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && typeof (entry as { name?: unknown }).name === 'string')
			.map(convertPocketforgeCampaignObject);
		if (!imported.length) throw new Error('No valid campaigns found in this JSON array.');
		return imported;
	}
	return [parseCampaignArchive(serialized)];
}
