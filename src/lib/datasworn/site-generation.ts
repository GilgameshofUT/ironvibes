import type { DataswornRecord } from './catalog';
import { oracleTableFromRecord, rollOracleTable } from './oracles';
import type { SiteDetailField, SiteType } from '../campaigns/sites';
import { rollCustomThemeEntry, type CampaignTheme } from '../campaigns/themes';

export type SiteGeneratedField = 'theme' | 'domain' | 'secondaryTheme' | 'secondaryDomain' | 'description' | 'detail' | 'namesake' | 'place' | 'name' | 'aspectFocus';

const oracleIds: Partial<Record<SiteGeneratedField, string>> = {
	theme: 'oracle_rollable:delve/site_nature/theme',
	domain: 'oracle_rollable:delve/site_nature/domain',
	secondaryTheme: 'oracle_rollable:delve/site_nature/theme',
	secondaryDomain: 'oracle_rollable:delve/site_nature/domain',
	description: 'oracle_rollable:delve/site_name/description',
	detail: 'oracle_rollable:delve/site_name/detail',
	namesake: 'oracle_rollable:delve/site_name/namesake',
	place: 'oracle_rollable:delve/site_name/place',
	aspectFocus: 'oracle_rollable:delve/feature/focus'
};

/** Datasworn link text is presented as readable text rather than raw link markup. */
export function readableOracleText(text: string): string {
	return text.replace(/\[([^\]]+)\]\(datasworn:[^)]+\)/g, '$1').trim();
}

function findOracle(records: DataswornRecord[], id: string) {
	// Prefer a later imported record with a matching ID to allow campaign content overrides.
	return [...records].reverse().find((record) => record.id === id && record.type === 'oracle_rollable');
}

const base = 'oracle_rollable:';
const siteOracleIds: Partial<Record<Exclude<SiteType, 'Delve'>, Partial<Record<SiteDetailField | 'name' | 'theme', string>>>> = {
	Derelict: {
		location: `${base}starforged/derelict/location`, condition: `${base}starforged/derelict/condition`,
		outerFirstLook: `${base}starforged/derelict/outer_first_look`, innerFirstLook: `${base}starforged/derelict/inner_first_look`,
		theme: `${base}starforged/location_theme/type`
	},
	Vault: {
		location: `${base}starforged/precursor_vault/location`, scale: `${base}starforged/precursor_vault/scale`,
		form: `${base}starforged/precursor_vault/form`, shape: `${base}starforged/precursor_vault/shape`,
		material: `${base}starforged/precursor_vault/material`, outerFirstLook: `${base}starforged/precursor_vault/outer_first_look`,
		theme: `${base}starforged/location_theme/type`
	},
	Shipwreck: {
		location: `${base}sundered_isles/shipwreck/location`, scale: `${base}sundered_isles/shipwreck/orientation/scale`,
		wholeness: `${base}sundered_isles/shipwreck/orientation/wholeness`,
		firstLook: `${base}sundered_isles/shipwreck/first_look`, name: `${base}sundered_isles/ship/name`,
		theme: `${base}starforged/location_theme/type`
	},
	Cave: {
		caveType: `${base}sundered_isles/cave/type`, threshold: `${base}sundered_isles/cave/threshold`,
		lurkingThreat: `${base}sundered_isles/cave/lurking_threat`, theme: `${base}starforged/location_theme/type`
	},
	Ruin: {
		location: `${base}sundered_isles/ruin/location`, condition: `${base}sundered_isles/ruin/condition`,
		scope: `${base}sundered_isles/ruin/scope`, firstLook: `${base}sundered_isles/ruin/first_look`,
		theme: `${base}starforged/location_theme/type`
	}
};

export function rollTypedSiteField(type: Exclude<SiteType, 'Delve'>, field: SiteDetailField | 'name' | 'theme', records: DataswornRecord[], random: () => number = Math.random, cursed = false): string {
	let ordinary = siteOracleIds[type]?.[field];
	if (type === 'Derelict' && field === 'kind') ordinary = `${base}starforged/derelict/type/planetside`;
	if (type === 'Cave' && field === 'threshold' && cursed) ordinary = `${base}sundered_isles/cave/threshold_cursed`;
	if (!ordinary) throw new Error(`No verified Datasworn table mapping is available for ${type} ${field}. Enter this value manually.`);
	const cursedId = `${ordinary}_cursed`;
	const id = cursed && findOracle(records, cursedId) ? cursedId : ordinary;
	const record = findOracle(records, id);
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error(`No enabled Datasworn table is available for ${type} ${field}.`);
	return readableOracleText(rollOracleTable(table, random).row.text);
}

export function rollSiteField(field: SiteGeneratedField, records: DataswornRecord[], random: () => number = Math.random): string {
	if (field === 'name') throw new Error('A site name is composed from its generated name fields.');
	const id = oracleIds[field];
	const record = id && findOracle(records, id);
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error(`No enabled Datasworn table is available for ${field}.`);
	return readableOracleText(rollOracleTable(table, random).row.text);
}

/** Apply Datasworn's Delve site-name format to values already rolled or entered. */
export function rollSiteName(fields: { description: string; place: string; detail: string; namesake: string }, records: DataswornRecord[], random: () => number = Math.random): string {
	const record = findOracle(records, 'oracle_rollable:delve/site_name/format');
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error('No enabled Datasworn site-name format table is available.');
	const pattern = rollOracleTable(table, random).row.text;
	const values: Record<string, string> = {
		Description: fields.description, Place: fields.place, Detail: fields.detail,
		Namesake: fields.namesake, "Namesake's": fields.namesake ? `${fields.namesake}'s` : ''
	};
	const required = [...pattern.matchAll(/\[([^\]]+)\]\(datasworn:[^)]+\)/g)].map((match) => match[1]);
	if (required.some((label) => !values[label])) throw new Error('Roll or enter the name ingredients used by this format before composing a site name.');
	const result = pattern.replace(/\[([^\]]+)\]\(datasworn:[^)]+\)/g, (_, label: string) => values[label]);
	return result.replace(/\s+/g, ' ').trim();
}

/** Roll an area feature from the active Delve theme/domain, without guessing missing ranges. */
export function rollDelveAreaEntry(kind: 'feature' | 'danger', theme: string, domain: string, records: DataswornRecord[], random: () => number = Math.random, customThemes: CampaignTheme[] = []): string {
	const value = Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;
	const custom = rollCustomThemeEntry(customThemes, kind, theme, domain, value);
	if (custom) return custom;
	for (const name of kind === 'feature' ? value <= 20 ? [theme] : [domain] : value <= 30 ? [theme] : [domain]) {
		const record = [...records].reverse().find((entry) =>
			['delve_site_theme', 'delve_site_domain'].includes(entry.type) && entry.name.toLowerCase() === name.trim().toLowerCase());
		const raw = record?.data[kind === 'feature' ? 'features' : 'dangers'];
		if (!Array.isArray(raw)) continue;
		const row = raw.find((candidate) => {
			if (!candidate || typeof candidate !== 'object') return false;
			const roll = (candidate as { roll?: { min?: number; max?: number } }).roll;
			return Number.isInteger(roll?.min) && Number.isInteger(roll?.max) && value >= roll!.min! && value <= roll!.max!;
		}) as { text?: string } | undefined;
		if (row && typeof row.text === 'string') return readableOracleText(row.text);
	}
	throw new Error(`No enabled Delve theme/domain ${kind} covers roll ${value}. Choose or edit it manually.`);
}

/** Only the directly corresponding Datasworn table is rolled; unsupported paths stay manual. */
export function rollExplorationOracle(id: string, records: DataswornRecord[], random: () => number = Math.random, cursed = false): string {
	const candidate = cursed && findOracle(records, `${id}_cursed`) ? `${id}_cursed` : id;
	const record = findOracle(records, candidate);
	const table = record && oracleTableFromRecord(record);
	if (!table) throw new Error(`No enabled Datasworn exploration table is available for ${id}. Enter the value manually.`);
	return readableOracleText(rollOracleTable(table, random).row.text);
}
