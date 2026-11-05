import { createId } from '../id';

export type CampaignSetting = 'ironsworn' | 'starforged' | 'sundered-isles';
export type CharacterRuleset = 'ironsworn' | 'starforged';
export type DrawerRulesetTab = 'ironsworn' | 'starforged' | 'isles';

export type CampaignOptions = {
	hasActiveFactions: boolean;
	hasActiveMaps: boolean;
	hasActiveTruths: boolean;
	hasActiveAssets: boolean;
	hasActiveThemes: boolean;
	hasSharedSupplies: boolean;
	hasHold: boolean;
	hasTreasury: boolean;
	hasLedger: boolean;
	hasSunderedRoller: boolean;
	hasFullJournal: boolean;
	isIronsmith: boolean;
	isStarsmith: boolean;
	isFeRunners: boolean;
	isAncientWonders: boolean;
	isVaultsAndVows: boolean;
	isSpellforge: boolean;
	activeDrawerTab?: DrawerRulesetTab;
	sharedSupplies?: number;
	hold?: number;
	treasury?: number;
};

export type Campaign = {
	id: string;
	name: string;
	setting: CampaignSetting;
	characterRuleset: CharacterRuleset;
	createdAt: string;
	updatedAt: string;
	options?: Partial<CampaignOptions>;
};

export const DEFAULT_CAMPAIGN_OPTIONS: CampaignOptions = {
	hasActiveFactions: true,
	hasActiveMaps: true,
	hasActiveTruths: true,
	hasActiveAssets: true,
	hasActiveThemes: true,
	hasSharedSupplies: false,
	hasHold: false,
	hasTreasury: false,
	hasLedger: false,
	hasSunderedRoller: false,
	hasFullJournal: false,
	isIronsmith: false,
	isStarsmith: false,
	isFeRunners: false,
	isAncientWonders: false,
	isVaultsAndVows: false,
	isSpellforge: false,
	sharedSupplies: 5,
	hold: 0,
	treasury: 0
};

export function campaignOptions(campaign: Campaign | null | undefined): CampaignOptions {
	const defaultTab: DrawerRulesetTab =
		campaign?.setting === 'sundered-isles'
			? 'isles'
			: campaign?.setting === 'starforged'
				? 'starforged'
				: 'ironsworn';
	return {
		...DEFAULT_CAMPAIGN_OPTIONS,
		activeDrawerTab: defaultTab,
		...(campaign?.options ?? {})
	};
}

const settings = new Set<CampaignSetting>(['ironsworn', 'starforged', 'sundered-isles']);
const rulesets = new Set<CharacterRuleset>(['ironsworn', 'starforged']);

function isCampaign(value: unknown): value is Campaign {
	if (!value || typeof value !== 'object') return false;
	const campaign = value as Partial<Campaign>;
	return typeof campaign.id === 'string' && campaign.id.length > 0 &&
		typeof campaign.name === 'string' && campaign.name.trim().length > 0 &&
		settings.has(campaign.setting as CampaignSetting) &&
		rulesets.has(campaign.characterRuleset as CharacterRuleset) &&
		typeof campaign.createdAt === 'string' && typeof campaign.updatedAt === 'string';
}

/** Parse only campaign records this version understands; malformed data is ignored safely. */
export function parseCampaigns(serialized: string | null): Campaign[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		if (!Array.isArray(value)) return [];
		const unique = new Map<string, Campaign>();
		for (const entry of value) {
			if (isCampaign(entry)) unique.set(entry.id, { ...entry, name: entry.name.trim() });
		}
		return [...unique.values()];
	} catch {
		return [];
	}
}

export function makeCampaign(input: {
	name: string;
	setting: CampaignSetting;
	characterRuleset: CharacterRuleset;
}, id: string = createId(), now: string = new Date().toISOString()): Campaign {
	const name = input.name.trim();
	if (!name) throw new Error('Enter a campaign name.');
	if (!settings.has(input.setting) || !rulesets.has(input.characterRuleset)) {
		throw new Error('Choose a supported setting and character ruleset.');
	}
	return { id, name, setting: input.setting, characterRuleset: input.characterRuleset, createdAt: now, updatedAt: now };
}

export function putCampaign(campaigns: Campaign[], campaign: Campaign): Campaign[] {
	return [...campaigns.filter((existing) => existing.id !== campaign.id), campaign];
}

export function deleteCampaign(campaigns: Campaign[], id: string): Campaign[] {
	return campaigns.filter((campaign) => campaign.id !== id);
}
