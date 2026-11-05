import type { CharacterRuleset, CampaignSetting } from '../campaigns/store';
import type { DataswornRecord, DataswornPack } from './catalog';

export type MoveGroup = { id: string; name: string; moves: DataswornRecord[] };
export type MoveSource = { id: string; bundled: boolean; pack: DataswornPack };

const prefixFor = (ruleset: CharacterRuleset) => ruleset === 'ironsworn' ? 'classic' : 'starforged';
const asStringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function isCompatibleImported(record: DataswornRecord, source: MoveSource, ruleset: CharacterRuleset): boolean {
	const base = prefixFor(ruleset);
	const packRuleset = source.pack.ruleset;
	if (packRuleset === 'classic' || packRuleset === 'ironsworn' || packRuleset === 'starforged') return packRuleset === base || packRuleset === ruleset;
	if (record.id.startsWith(`move:${base}/`)) return true;
	return asStringArray(record.data.replaces).some((id) => id.startsWith(`move:${base}/`));
}

function isKnownOtherRuleset(source: MoveSource, ruleset: CharacterRuleset): boolean {
	const packRuleset = source.pack.ruleset;
	return (packRuleset === 'classic' || packRuleset === 'ironsworn' || packRuleset === 'starforged') && packRuleset !== prefixFor(ruleset) && packRuleset !== ruleset;
}

function categoryKey(record: DataswornRecord): string {
	// Datasworn move IDs preserve category even for standalone exports.
	return record.id.match(/^move:[^/]+\/([^/]+)\//)?.[1] ?? '';
}

function isTopLevelMove(record: DataswornRecord): boolean {
	// `assets` can contain embedded move-shaped records; a standalone export is wrapped in moves.<id>.
	return record.type === 'move' && /^moves\.[^.]+(?:\.(?:contents|collections)\..+)?$/.test(record.path);
}

function categoryName(record: DataswornRecord, category: string, categories: Map<string, string>): string {
	const packCategory = categories.get(`${record.packId}/${category}`);
	return packCategory ?? (category ? `${category.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())} Moves` : 'Other moves');
}

/** Choose the mechanical ruleset first, then compatible setting and user-installed moves. */
export function groupedCampaignMoves(
	setting: CampaignSetting,
	ruleset: CharacterRuleset,
	records: DataswornRecord[],
	sources: MoveSource[],
	query = '',
	includeUnscoped = false
): MoveGroup[] {
	const base = prefixFor(ruleset);
	const sourcesById = new Map(sources.map((source) => [source.id, source]));
	const categories = new Map(records.filter((record) => record.type === 'move_category').map((record) => [
		`${record.packId}/${record.id.match(/^move_category:[^/]+\/(.+)$/)?.[1] ?? ''}`, record.name
	]));
	const allowedBundled = new Set([base]);
	if (setting === 'ironsworn' && ruleset === 'ironsworn') allowedBundled.add('delve');
	if (setting === 'sundered-isles' && ruleset === 'starforged') allowedBundled.add('sundered_isles');

	const selected = records.filter((record) => {
		// Assets and other nodes can embed `move` objects; these are not top-level campaign moves.
		if (!isTopLevelMove(record)) return false;
		const source = sourcesById.get(record.packId);
		return !!source && (source.bundled ? allowedBundled.has(source.id) : isCompatibleImported(record, source, ruleset) || includeUnscoped && !isKnownOtherRuleset(source, ruleset));
	});
	selected.sort((left, right) => {
		const rank = (record: DataswornRecord) => record.packId === base ? 0 : record.packId === 'delve' || record.packId === 'sundered_isles' ? 1 : 2;
		return rank(left) - rank(right);
	});
	// Expansion overrides replace their named base move, rather than showing both variants.
	const replacements = new Map<string, DataswornRecord>();
	for (const record of selected) for (const id of asStringArray(record.data.replaces)) replacements.set(id, record);
	const effective: DataswornRecord[] = [];
	const added = new Set<string>();
	const available = new Set(selected.map((record) => record.id));
	for (const record of selected) {
		const replacement = replacements.get(record.id);
		if (!replacement && asStringArray(record.data.replaces).some((id) => available.has(id))) continue;
		const move = replacement ?? record;
		if (added.has(move.id)) continue;
		effective.push(move);
		added.add(move.id);
	}

	const search = query.trim().toLocaleLowerCase();
	const groups = new Map<string, MoveGroup>();
	for (const record of effective) {
		const category = asStringArray(record.data.replaces).map((id) => categoryKey({ ...record, id })).find(Boolean) ?? categoryKey(record);
		const name = categories.get(`${base}/${category}`) ?? (category === categoryKey(record) ? categoryName(record, category, categories) : categoryName({ ...record, packId: base }, category, categories));
		const terms = search.split(/\s+/).filter(Boolean);
		if (terms.length && !terms.every((term) => `${record.name} ${record.description} ${name} ${record.packTitle}`.toLocaleLowerCase().includes(term))) continue;
		const key = category || `other:${record.packId}`;
		if (!groups.has(key)) groups.set(key, { id: key, name: category ? name : 'Other moves', moves: [] });
		groups.get(key)!.moves.push(record);
	}
	return [...groups.values()];
}

export type DrawerMoveEntry = {
	record: DataswornRecord;
	categoryLabel: string;
	badgeTone: string;
};

const MOVE_BADGE_TONES: Record<string, string> = {
	Adventure: '#1e6b8c',
	Exploration: '#1b6ca8',
	Relationship: '#46539e',
	Connection: '#46539e',
	Combat: '#4f6270',
	Suffer: '#9b2c2c',
	Quest: '#5e3c99',
	Legacy: '#3b4d5e',
	Recover: '#2f6f44',
	Session: '#1f6f68',
	Threshold: '#4a4e54',
	Fate: '#8e2b5a',
	Delve: '#6d4c3d',
	Rarity: '#9c6818',
	Failure: '#a83820',
	Threat: '#8a1c1c',
	'Scene Challenges': '#1d7078',
	Artifact: '#6c3b8c',
	'Making Camp': '#2e6b54',
	'Exchanging Wealth': '#9c6818',
	'Taking A Hiatus': '#3b5984',
	'Failing Forward': '#8e2b3a',
	'Reworking Your Legacy': '#3b4d5e'
};

export function moveCategoryBadge(groupName: string): { label: string; tone: string } {
	const cleaned = groupName.replace(/\s+Moves$/i, '').trim() || 'Move';
	return {
		label: cleaned,
		tone: MOVE_BADGE_TONES[cleaned] ?? '#2d6560'
	};
}

export function flatPackMoves(
	packId: string,
	records: DataswornRecord[],
	query = ''
): DrawerMoveEntry[] {
	const categories = new Map(
		records
			.filter((record) => record.packId === packId && record.type === 'move_category')
			.map((record) => [`${record.packId}/${record.id.match(/^move_category:[^/]+\/(.+)$/)?.[1] ?? ''}`, record.name])
	);
	const search = query.trim().toLocaleLowerCase();
	const terms = search.split(/\s+/).filter(Boolean);
	return records
		.filter((record) => record.packId === packId && isTopLevelMove(record))
		.flatMap((record) => {
			const category = categoryKey(record);
			const groupName = categoryName(record, category, categories);
			if (
				terms.length &&
				!terms.every((term) => `${record.name} ${record.description} ${groupName} ${record.packTitle}`.toLocaleLowerCase().includes(term))
			) {
				return [];
			}
			const badge = moveCategoryBadge(groupName);
			return [{ record, categoryLabel: badge.label, badgeTone: badge.tone }];
		});
}

export function flatDrawerMoves(
	tab: 'ironsworn' | 'starforged' | 'isles',
	records: DataswornRecord[],
	sources: MoveSource[],
	query = '',
	includeUnscoped = false
): DrawerMoveEntry[] {
	const setting: CampaignSetting = tab === 'isles' ? 'sundered-isles' : tab;
	const ruleset: CharacterRuleset = tab === 'ironsworn' ? 'ironsworn' : 'starforged';
	const groups = groupedCampaignMoves(setting, ruleset, records, sources, query, includeUnscoped);
	return groups.flatMap((group) => {
		const badge = moveCategoryBadge(group.name);
		return group.moves.map((record) => ({
			record,
			categoryLabel: badge.label,
			badgeTone: badge.tone
		}));
	});
}
