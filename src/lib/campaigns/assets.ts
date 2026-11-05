import { createId } from '../id';
import type { DataswornRecord } from '../datasworn/catalog';

export const ASSET_ORIGINS = ['Ironsworn', 'Starforged', 'Sundered Isles', 'Third party'] as const;
export type AssetOrigin = typeof ASSET_ORIGINS[number];
export const ASSET_STATUSES = ['Debility', 'Broken', 'Out of action', 'Battered', 'Cursed', 'Wrecked'] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];
export type AssetControl = {
	key: string;
	label: string;
	kind: 'text' | 'choice' | 'checkbox';
	value: string | boolean;
	choices: { value: string; label: string }[];
	ability: number;
};
export const ASSET_TYPES: Record<AssetOrigin, string[]> = {
	Ironsworn: ['Companion', 'Path', 'Combat talent', 'Ritual'],
	Starforged: ['Companion', 'Path', 'Module', 'Support Vehicle', 'Deed'],
	'Sundered Isles': ['Companion', 'Path', 'Module', 'Support Vehicle', 'Deed'],
	'Third party': []
};

export type CampaignAsset = {
	id: string;
	name: string;
	origin: AssetOrigin;
	category: string;
	description: string;
	abilities: { text: string; enabled: boolean }[];
	statuses: AssetStatus[];
	fieldLabel: string;
	fieldValue: string;
	secondaryFieldLabel: string;
	secondaryFieldValue: string;
	trackMax: number;
	trackValue: number;
	rollControl: number;
	/** Safe UI controls copied from declared Datasworn options; no enhancement scripts execute. */
	controls?: AssetControl[];
	trackLabel?: string;
	sourceId: string;
	sourcePack: string;
	sourceTitle: string;
	createdAt: string;
	updatedAt: string;
};

const obj = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const string = (value: unknown) => typeof value === 'string' ? value : '';
const bounded = (value: unknown, max: number) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;

function controlList(value: unknown, ability = -1, prefix = ''): AssetControl[] {
	const entries = obj(value) ?? {};
	return Object.entries(entries).flatMap(([key, raw]) => {
		const item = obj(raw);
		if (!item) return [];
		const fieldType = string(item.field_type);
		const label = string(item.label) || key.replaceAll('_', ' ');
		const id = prefix ? `${prefix}.${key}` : key;
		if (fieldType === 'condition_meter') return controlList(item.controls, ability, id);
		if (fieldType === 'text') return [{ key: id, label, kind: 'text' as const, value: string(item.value), choices: [], ability }];
		if (fieldType === 'checkbox' || fieldType === 'card_flip') return [{ key: id, label, kind: 'checkbox' as const, value: item.value === true, choices: [], ability }];
		if (fieldType === 'select_value' || fieldType === 'select_enhancement') {
			const choices = Object.entries(obj(item.choices) ?? {}).flatMap(([choiceKey, choice]) => {
				const choiceData = obj(choice);
				return choiceData ? [{ value: choiceKey, label: string(choiceData.label) || choiceKey }] : [];
			});
			return choices.length ? [{ key: id, label, kind: 'choice' as const, value: string(item.value), choices, ability }] : [];
		}
		return [];
	});
}

export function assetFromDatasworn(record: DataswornRecord, id = createId(), now = new Date().toISOString()): CampaignAsset {
	if (record.type !== 'asset') throw new Error('Choose a Datasworn asset item.');
	const data = record.data;
	const pack = `${record.packId} ${record.id}`.toLowerCase();
	const origin: AssetOrigin = /sundered/.test(pack) ? 'Sundered Isles' : /starforged|starsmith|fe_runners|ancient_wonders/.test(pack) ? 'Starforged' : /classic|delve|ironsmith|vaults_and_vows/.test(pack) ? 'Ironsworn' : 'Third party';
	const abilities = (Array.isArray(data.abilities) ? data.abilities : []).flatMap((value, index) => {
		const item = obj(value);
		return item && typeof item.text === 'string' ? [{ text: item.text, enabled: item.enabled === true || (item.enabled === undefined && index === 0) }] : [];
	});
	const controls = obj(data.controls) ?? {};
	const meter = Object.values(controls).map(obj).find((item) => item?.field_type === 'condition_meter');
	const trackMax = meter && Number.isInteger(meter.max) && (meter.max as number) > 0 && (meter.max as number) <= 10 ? meter.max as number : 0;
	const allControls = [...controlList(data.options), ...controlList(controls),
		...(Array.isArray(data.abilities) ? data.abilities.flatMap((ability, i) => controlList(obj(ability)?.options, i, `ability.${i}`)) : [])];
	const textOptions = allControls.filter((item) => item.kind === 'text' && item.ability === -1);
	return {
		id, name: record.name, origin, category: string(data.category) || 'Asset', description: string(data.description) || string(data.requirement),
		abilities, statuses: [], fieldLabel: textOptions[0]?.label ?? '', fieldValue: textOptions[0]?.value as string ?? '',
		secondaryFieldLabel: textOptions[1]?.label ?? '', secondaryFieldValue: textOptions[1]?.value as string ?? '',
		trackMax, trackValue: trackMax && bounded(meter?.value, trackMax) ? meter!.value as number : trackMax, rollControl: 0,
		trackLabel: string(meter?.label) || (trackMax ? 'Track' : ''), controls: allControls.filter((item) => !textOptions.slice(0, 2).includes(item)),
		sourceId: record.id, sourcePack: record.packId, sourceTitle: record.sourceTitle || record.packTitle, createdAt: now, updatedAt: now
	};
}

export function makeCustomAsset(input: Pick<CampaignAsset, 'name' | 'origin' | 'category' | 'description' | 'abilities' | 'statuses' | 'fieldLabel' | 'secondaryFieldLabel' | 'trackMax' | 'rollControl'>, id = createId(), now = new Date().toISOString()): CampaignAsset {
	const name = input.name.trim();
	if (!name) throw new Error('Enter an asset name.');
	if (!ASSET_ORIGINS.includes(input.origin) || (input.origin !== 'Third party' && !ASSET_TYPES[input.origin].includes(input.category.trim()))) throw new Error('Choose an origin and asset type.');
	if (!bounded(input.trackMax, 10) || !bounded(input.rollControl, 4)) throw new Error('Asset track and control must be within their ranges.');
	return { ...input, id, name, category: input.origin === 'Third party' ? '' : input.category.trim(), description: input.description.trim(),
		abilities: input.abilities.map((ability) => ({ text: ability.text.trim(), enabled: ability.enabled })),
		statuses: [...new Set(input.statuses)], fieldLabel: input.fieldLabel.trim(), fieldValue: '', secondaryFieldLabel: input.secondaryFieldLabel.trim(), secondaryFieldValue: '',
		trackValue: input.trackMax, trackLabel: input.trackMax ? 'Track' : '', controls: [], sourceId: '', sourcePack: '', sourceTitle: 'Campaign custom asset', createdAt: now, updatedAt: now };
}

function validControl(value: unknown): value is AssetControl {
	const item = obj(value);
	if (!item || typeof item.key !== 'string' || !item.key || typeof item.label !== 'string' ||
		!Number.isInteger(item.ability) || (item.ability as number) < -1 ||
		!['text','choice','checkbox'].includes(String(item.kind)) || !Array.isArray(item.choices) ||
		!item.choices.every((choice: unknown) => typeof obj(choice)?.value === 'string' && typeof obj(choice)?.label === 'string')) return false;
	return item.kind === 'checkbox' ? typeof item.value === 'boolean' : typeof item.value === 'string' &&
		(item.kind !== 'choice' || item.value === '' || item.choices.some((choice: AssetControl['choices'][number]) => choice.value === item.value));
}

export function parseCampaignAssets(raw: string | null): CampaignAsset[] {
	if (!raw) return [];
	try {
		const value: unknown = JSON.parse(raw);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, CampaignAsset>();
		for (const item of value) {
			const asset = obj(item);
			if (!asset || !string(asset.id) || !string(asset.name).trim() || !ASSET_ORIGINS.includes(asset.origin as AssetOrigin) ||
				typeof asset.category !== 'string' || typeof asset.description !== 'string' || !Array.isArray(asset.abilities) ||
				!asset.abilities.every((ability: unknown) => typeof obj(ability)?.text === 'string' && typeof obj(ability)?.enabled === 'boolean') ||
				!Array.isArray(asset.statuses) || !asset.statuses.every((status: unknown) => ASSET_STATUSES.includes(status as AssetStatus)) ||
				!['fieldLabel','fieldValue','secondaryFieldLabel','secondaryFieldValue','sourceId','sourcePack','sourceTitle','createdAt','updatedAt'].every((key) => typeof asset[key] === 'string') ||
				!bounded(asset.trackMax, 10) || !bounded(asset.trackValue, asset.trackMax as number) || !bounded(asset.rollControl, 4) ||
				(asset.trackLabel !== undefined && typeof asset.trackLabel !== 'string') ||
				(asset.controls !== undefined && (!Array.isArray(asset.controls) || !asset.controls.every(validControl)))) continue;
			unique.set(asset.id as string, { ...asset, controls: asset.controls ?? [], trackLabel: asset.trackLabel ?? (asset.trackMax ? 'Track' : '') } as CampaignAsset);
		}
		return [...unique.values()];
	} catch { return []; }
}

export function putCampaignAsset(assets: CampaignAsset[], asset: CampaignAsset): CampaignAsset[] {
	return assets.some((item) => item.id === asset.id) ? assets.map((item) => item.id === asset.id ? asset : item) : [...assets, asset];
}

export function moveCampaignAsset(assets: CampaignAsset[], id: string, direction: -1 | 1): CampaignAsset[] {
	const index = assets.findIndex((item) => item.id === id);
	const nextIndex = index + direction;
	if (index < 0 || nextIndex < 0 || nextIndex >= assets.length) return assets;
	const next = [...assets];
	[next[index], next[nextIndex]] = [next[nextIndex], next[index]];
	return next;
}
