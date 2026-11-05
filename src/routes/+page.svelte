<script lang="ts">
	import { onMount } from 'svelte';
	import { asset as staticAsset } from '$app/paths';
	import { createId } from '../lib/id';
	import { ASSET_ORIGINS, ASSET_STATUSES, ASSET_TYPES, assetFromDatasworn, makeCustomAsset, moveCampaignAsset, parseCampaignAssets, putCampaignAsset, type CampaignAsset, type AssetOrigin, type AssetStatus } from '../lib/campaigns/assets';
	import { blankTheme, parseCampaignThemes, validateTheme, type CampaignTheme, type CustomThemeKind, type ThemeTable } from '../lib/campaigns/themes';
	import ContentLibrary from '../lib/components/ContentLibrary.svelte';
	import RpIcon from '../lib/components/RpIcon.svelte';
	import { dataswornLibrary } from '../lib/datasworn/library.svelte';
	import type { DataswornRecord } from '../lib/datasworn/catalog';
	import { ASK_THE_ORACLE_ODDS, burnActionMomentum, groupedDrawerOracles, oracleTableFromRecord, parseCustomOracles, resolveActionRoll, rollAction, rollAskTheOracle, rollCustomOracle, rollMatchEvent, rollOracleTable, rollPayThePrice, rollSpellforgeTable, SPELLFORGE_CATEGORIES, type ActionRoll, type AskTheOracleOdds, type CustomOracle, type OracleRoll, type OracleRulesetTab, type OracleTable } from '../lib/datasworn/oracles';
	import { CREATURE_FIELDS, FANTASY_SPECIES, generateCreatureField, generateFactionFields, generateLifeEvents, generateQuestPrompt, generateRecordField, generationFields, rollFantasySpecies, type GenerationSetting } from '../lib/datasworn/record-generation';
	import { emptySavedLibrary, parseSavedLibrary, serializeSavedLibrary, upsertSavedAsset, upsertSavedFaction, upsertSavedLocation, upsertSavedOracle, upsertSavedRecord, upsertSavedTheme, type SavedLibrary, type SavedLibraryKind } from '../lib/campaigns/saved-library';
	import { rollDelveAreaEntry, rollExplorationOracle, rollSiteName, rollSiteField, rollTypedSiteField, type SiteGeneratedField } from '../lib/datasworn/site-generation';
	import { campaignOptions, deleteCampaign, makeCampaign, parseCampaigns, putCampaign, type Campaign, type CampaignOptions, type CampaignSetting, type CharacterRuleset } from '../lib/campaigns/store';
	import { appendJournalEntry, journalEntryTitle, makeJournalEntry, moveJournalEntry, parseJournalEntries, removeJournalEntry, updateJournalEntry, type JournalEntry } from '../lib/campaigns/journal';
	import { CHARACTER_PORTRAIT_ARCHETYPES, CHARACTER_PORTRAIT_GALLERY, computeMomentumLimits, convertHeroToNpc, convertNpcToHero, CREATURE_PORTRAIT_GALLERY, exportCampaignRecord, HERO_FIELDS, IRONSWORN_DEBILITY_GROUPS, makeCampaignRecord, moveCampaignRecord, NPC_FIELDS, parseCampaignRecords, putCampaignRecord, removeCampaignRecord, resolveRecordPortrait, STARFORGED_IMPACT_GROUPS, updateCampaignRecord, type CampaignRecord, type RecordKind } from '../lib/campaigns/records';
	import { addSiteArea, addSiteWaypoint, makeCampaignSite, moveCampaignSite, parseCampaignSites, parseSiteDenizenTable, putCampaignSite, removeCampaignSite, rollSiteDenizen, rollSiteObjective, serializeSiteDenizenTable, SITE_DETAIL_FIELDS, SITE_DETAIL_LABELS, SITE_RANKS, SITE_TYPES, updateCampaignSite, updateSiteArea, type CampaignSite, type DenizenSlot, type SiteArea, type SiteDetailField, type SiteRank, type SiteType } from '../lib/campaigns/sites';
	import { FACTION_FIELDS, FACTION_ORIGINS, makeCampaignFaction, moveCampaignFaction, parseCampaignFactions, putCampaignFaction, removeCampaignFaction, SOCIETY_FIELDS, updateCampaignFaction, type CampaignFaction, type FactionField, type FactionOrigin } from '../lib/campaigns/factions';
	import { LOCATION_FIELDS, LOCATION_ORIGINS, makeCampaignLocation, moveCampaignLocation, parseCampaignLocations, putCampaignLocation, removeCampaignLocation, updateCampaignLocation, type CampaignLocation, type LocationField, type LocationOrigin } from '../lib/campaigns/locations';
	import { assignMapRecord, fillMapPaint, makeCampaignMap, mapPaintTile, MAP_TERRAIN_GROUPS, moveCampaignMap, paintMapCell, parseCampaignMaps, putCampaignMap, removeCampaignMap, removeMapRecord, toggleMapPath, updateCampaignMap, updateMapCell, type CampaignMap, type MapGridShape, type MapPaint, type MapRecordKind, type MapTileStyle } from '../lib/campaigns/maps';
	import { parsePocketforgeMap } from '../lib/campaigns/maps-import';
	import { flatDrawerMoves, flatPackMoves, groupedCampaignMoves } from '../lib/datasworn/moves';
	import { actionMoveStats, embeddedMoveOracles, moveOutcomeText, readableMoveText } from '../lib/datasworn/move-detail';
	import { extractTruthCardOptions, formatTruthSelectionText, parseCampaignTruths, removeCampaignTruth, rollTruthOption, rollTruthSuboption, saveCampaignTruth, type CampaignTruth, type CampaignTruthDraft, type TruthOptionItem, type TruthSuboptionItem } from '../lib/campaigns/truths';
	import { makeCampaignArchive, parseCampaignArchive, parseCampaignImports } from '../lib/campaigns/archive';
	import {
		buildTrackResolution,
		clockSteps,
		forsakeCampaignTrack,
		makeCampaignTrack,
		markTrackClock,
		markTrackProgress,
		markTrackThreat,
		moveCampaignTrack,
		parseCampaignTracks,
		putCampaignTrack,
		removeCampaignTrack,
		reopenCampaignTrack,
		resolveCampaignTrack,
		resolveTrackClock,
		rollTrackResolution,
		rollTrackRank,
		trackProgressBoxes,
		trackTicks,
		TRACK_TICKS_MAX,
		TRACK_RANKS,
		TRACK_TYPES,
		updateCampaignTrack,
		type CampaignTrack,
		type TrackRank,
		type TrackType
	} from '../lib/campaigns/tracks';

	const CAMPAIGNS_KEY = 'ironvibes.campaigns.v1';
	const ACTIVE_CAMPAIGN_KEY = 'ironvibes.active-campaign.v1';
	const SAVED_LIBRARY_KEY = 'ironvibes.saved-library.v1';
	const journalStorageKey = (id: string) => `ironvibes.campaign.${id}.journal.v1`;
	const trackStorageKey = (id: string) => `ironvibes.campaign.${id}.tracks.v1`;
	const recordStorageKey = (id: string) => `ironvibes.campaign.${id}.records.v1`;
	const siteStorageKey = (id: string) => `ironvibes.campaign.${id}.sites.v1`;
	const factionStorageKey = (id: string) => `ironvibes.campaign.${id}.factions.v1`;
	const locationStorageKey = (id: string) => `ironvibes.campaign.${id}.locations.v1`;
	const mapStorageKey = (id: string) => `ironvibes.campaign.${id}.maps.v1`;
	const truthStorageKey = (id: string) => `ironvibes.campaign.${id}.truths.v1`;
	const assetStorageKey = (id: string) => `ironvibes.campaign.${id}.assets.v1`;
	const themeStorageKey = (id: string) => `ironvibes.campaign.${id}.themes.v1`;
	const customOracleStorageKey = (id: string) => `ironvibes.campaign.${id}.custom-oracles.v1`;
	const ledgerStorageKey = (id: string) => `ironvibes.campaign.${id}.ledger.v1`;
	let activeArea = $state('Journal');
	let showMobileSections = $state(false);
	let showTableTools = $state(false);
	let tableTool = $state<'oracles' | 'moves'>('oracles');
	let moveSearch = $state('');
	let showUnscopedMoves = $state(false);
	let showCampaignSetup = $state(false);
	let showCampaignPicker = $state(false);
	let showCampaignTransfer = $state(false);
	let campaigns = $state<Campaign[]>([]);
	let activeCampaignId = $state('');
	let campaignName = $state('');
	let campaignSetting = $state<CampaignSetting>('ironsworn');
	let characterRuleset = $state<CharacterRuleset>('ironsworn');
	let editingCampaignId = $state('');
	let campaignError = $state('');
	let storageError = $state('');
	let campaignTransferError = $state('');
	let campaignTransferMessage = $state('');
	let journalDraft = $state('');
	let journalEntries = $state<JournalEntry[]>([]);
	let campaignTracks = $state<CampaignTrack[]>([]);
	let campaignRecords = $state<CampaignRecord[]>([]);
	let campaignSites = $state<CampaignSite[]>([]);
	let showSiteEditor = $state(false);
	let editingSiteId = $state('');
	let siteType = $state<SiteType>('Delve');
	let siteRank = $state<SiteRank>('Dangerous');
	let siteDraft = $state<CampaignSite['fields']>({ theme: '', domain: '', secondaryTheme: '', secondaryDomain: '', description: '', detail: '', namesake: '', place: '', name: '', aspectFocus: '' });
	let siteDetails = $state<Partial<Record<SiteDetailField, string>>>({});
	let siteCursed = $state(false);
	let siteError = $state('');
	let siteGenerationMessage = $state('');
	let siteSecondaryTheme = $state(false);
	let siteSecondaryDomain = $state(false);
	let siteFilter = $state('');
	let campaignFactions = $state<CampaignFaction[]>([]);
	let showFactionEditor = $state(false);
	let editingFactionId = $state('');
	let factionOrigin = $state<FactionOrigin>('Starforged');
	let factionType = $state('');
	let factionForceCursed = $state(false);
	let factionRollWithCursedDie = $state(false);
	let factionDraft = $state<Record<FactionField, string>>(Object.fromEntries([...FACTION_FIELDS, ...SOCIETY_FIELDS].map((field) => [field, ''])) as Record<FactionField, string>);
	let factionError = $state('');
	let factionFilter = $state('');
	let campaignLocations = $state<CampaignLocation[]>([]);
	let showLocationEditor = $state(false);
	let editingLocationId = $state('');
	let locationOrigin = $state<LocationOrigin>('Ironsworn');
	let locationType = $state('Settled Lands');
	let locationRegion = $state('Settled Lands');
	let locationRollWithCursedDie = $state(false);
	let locationUseExtendedNames = $state(false);
	let locationDraft = $state<Record<LocationField, string>>(Object.fromEntries(LOCATION_FIELDS.map((field) => [field, ''])) as Record<LocationField, string>);
	let locationError = $state('');
	let locationFilter = $state('');
	let campaignMaps = $state<CampaignMap[]>([]);
	let campaignTruths = $state<CampaignTruth[]>([]);
	let campaignAssets = $state<CampaignAsset[]>([]);
	let campaignThemes = $state<CampaignTheme[]>([]);
	let themeDraft = $state<CampaignTheme>(blankTheme('Ironsworn theme'));
	let showThemeEditor = $state(false);
	let themeSearch = $state('');
	let themeError = $state('');
	let showAssetEditor = $state(false);
	let showAssetImport = $state(false);
	let editingAssetId = $state('');
	let assetSearch = $state('');
	let assetImportSearch = $state('');
	let assetError = $state('');
	let assetOrigin = $state<AssetOrigin>('Ironsworn');
	let assetCategory = $state('Path');
	let assetName = $state('');
	let assetDescription = $state('');
	let assetAbilities = $state<{ text: string; enabled: boolean }[]>([{ text: '', enabled: true }, { text: '', enabled: false }, { text: '', enabled: false }]);
	let assetStatuses = $state<AssetStatus[]>([]);
	let assetFieldLabel = $state('');
	let assetSecondaryFieldLabel = $state('');
	let assetTrackMax = $state(0);
	let assetRollControl = $state(4);
	let assetFieldValue = $state('');
	let assetSecondaryFieldValue = $state('');
	let truthFilter = $state('');
	let selectedTruthCategory = $state('');
	let truthSearch = $state('');
	let truthDraft = $state('');
	let truthDescriptionDraft = $state('');
	let truthOptionId = $state('');
	let truthError = $state('');
	let truthMessage = $state('');
	let truthRollResult = $state('');
	let editingTruthId = $state('');
	let showTruthEditor = $state(false);
	let hideUnusedTruths = $state(false);
	let oracleSearch = $state('');
	let oracleTableId = $state('');
	let oracleQuestion = $state('');
	let oracleError = $state('');
	let oracleResult = $state<{ table: OracleTable; result: OracleRoll } | null>(null);
	let quickRollHeroId = $state('');
	let quickRollStat = $state<keyof CampaignRecord['stats']>('edge');
	let quickRollManualStat = $state(1);
	let quickRollAdds = $state(0);
	let diceRollCount = $state(1);
	let diceRollSides = $state(6);
	let diceRollResult = $state('');
	let showBottomRoller = $state(false);
	let showBottomDiceMenu = $state(false);
	let bottomDie = $state(20);
	let bottomResult = $state('');
	let bottomStat = $state<'edge' | 'heart' | 'iron' | 'shadow' | 'wits' | 'health' | 'spirit' | 'supply' | 'custom'>('edge');
	let bottomCustom = $state(0);
	let bottomAdds = $state(0);
	let bottomLock = $state(0);
	let bottomAction = $state<ActionRoll | null>(null);
	let bottomRollError = $state('');
	let bottomJournalRolls = $state(false);
	let bottomResultHeroId = $state('');
	let generationMessage = $state('');
	let actionRollError = $state('');
	let actionRollResult = $state<ActionRoll | null>(null);
	let activeMoveRoll = $state<DataswornRecord | null>(null);
	let moveRollResult = $state<ActionRoll | null>(null);
	let activeMapId = $state('');
	let showMapCreator = $state(false);
	let mapNameDraft = $state('');
	let mapError = $state('');
	let selectedMapTool = $state<'select' | 'paint' | 'path'>('select');
	let selectedMapPaint = $state<MapPaint>('grassland');
	let expandedTerrainGroup = $state('');
	let showMapFill = $state(false);
	let mapRecordTab = $state<MapRecordKind>('location');
	let selectedMapCell = $state('');
	let pendingMapPlacement = $state<{ campaignId: string; mapId: string; key: string; kind: MapRecordKind } | null>(null);
	let mapCellNameDraft = $state('');
	let mapCellNotesDraft = $state('');
	let mapCellRecordId = $state('');
	let mapOnlyUnassigned = $state(false);
	let mapUploadError = $state('');
	let showRecordEditor = $state(false);
	let recordKind = $state<RecordKind>('hero');
	let editingRecordId = $state('');
	let recordDraft = $state<Record<string, string>>({});
	let recordStatsDraft = $state({ momentum: 2, health: 5, spirit: 5, supply: 5, edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 });
	let recordExtras = $state({ assets: '', legacyAndVows: '', debilities: '', characterDetails: '', notes: '' });
	let recordFilter = $state('');
	let recordError = $state('');
	let expandedRecordIds = $state<string[]>([]);
	function toggleRecordExpanded(id: string) {
		expandedRecordIds = expandedRecordIds.includes(id) ? expandedRecordIds.filter((item) => item !== id) : [...expandedRecordIds, id];
	}
	type HeroStatKey = 'momentum' | 'health' | 'spirit' | 'supply' | 'edge' | 'heart' | 'iron' | 'shadow' | 'wits';
	type HeroStatField = { label: string; key: HeroStatKey; min: number; max: number };
	const HERO_ATTRIBUTE_STATS: HeroStatField[] = [
		{ label: 'Edge', key: 'edge', min: -2, max: 5 },
		{ label: 'Heart', key: 'heart', min: -2, max: 5 },
		{ label: 'Iron', key: 'iron', min: -2, max: 5 },
		{ label: 'Shadow', key: 'shadow', min: -2, max: 5 },
		{ label: 'Wits', key: 'wits', min: -2, max: 5 }
	];
	const HERO_RESOURCE_STATS: HeroStatField[] = [
		{ label: 'Health', key: 'health', min: 0, max: 5 },
		{ label: 'Spirit', key: 'spirit', min: 0, max: 5 },
		{ label: 'Supply', key: 'supply', min: 0, max: 5 },
		{ label: 'Momentum', key: 'momentum', min: -6, max: 10 }
	];
	function setHeroDraftStat(key: HeroStatKey, raw: string, min: number, max: number) {
		const value = Number(raw);
		recordStatsDraft = { ...recordStatsDraft, [key]: Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : recordStatsDraft[key] };
	}
	let showTrackEditor = $state(false);
	let editingTrackId = $state('');
	let trackName = $state('');
	let trackType = $state<TrackType>('Progress');
	let trackRank = $state<TrackRank>('Dangerous');
	let trackThreat = $state(false);
	let trackThreatName = $state('');
	let trackSteps = $state(6);
	let trackError = $state('');
	let showResolvedTracks = $state(false);
	let resolvingTrackId = $state('');
	let resolutionRoll = $state('');
	let isDrawerOpen = $state(true);
	let drawerRulesetTab = $state<OracleRulesetTab>('ironsworn');
	let payThePriceText = $state('');
	let askOracleRoll = $state(0);
	let askOracleOdds = $state<AskTheOracleOdds>('50%');
	let askOracleText = $state('');
	let askOracleEvent = $state('');
	let expandedMoveIds = $state<string[]>([]);
	let expandedOracleCats = $state<string[]>([]);
	let oracleInlineValues = $state<Record<string, string>>({});
	let cursedDieResult = $state(0);
	let bottomMatchEvent = $state('');
	let showSettingsMenu = $state(false);
	let showAppMenu = $state(false);
	let showAppThemeDialog = $state(false);
	let darkMode = $state(false);
	let swipeNav = $state(true);
	let rememberCampaign = $state(true);
	let drawerToast = $state('');
	let navTabsEl = $state<HTMLElement | null>(null);
	let editingJournalId = $state('');
	let journalBlockStyle = $state('p');
	let reorderMode = $state(false);
	let npcRoleFilter = $state<string[]>(['npc', 'bond', 'connection']);
	let siteTypeFilter = $state<string[]>(['Delve', 'Derelict', 'Vault', 'Shipwreck', 'Cave', 'Ruin']);
	let locationTypeFilter = $state<string[]>(['Settlement', 'Waypoint', 'Star', 'Planet', 'Starship', 'Ship', 'Island']);
	let savedLibrary = $state<SavedLibrary>(emptySavedLibrary());
	let showSavedImportModal = $state(false);
	let savedImportKind = $state<SavedLibraryKind>('hero');
	let selectedSavedIds = $state<string[]>([]);
	let useFantasySpecies = $state(false);
	let useExtendedNames = $state(false);
	let recordRollWithCursedDie = $state(false);
	let useLifeEvents = $state(false);
	let addNextNpc = $state(false);
	let npcDraftIsBond = $state(false);
	let npcDraftIsConnection = $state(false);
	let npcDraftConnectionRank = $state<TrackRank>('Formidable');
	let heroAssetTargetId = $state('');
	let heroAssetTab = $state<'ironsworn' | 'starforged' | 'isles' | 'vaults_and_vows' | 'fe_runners' | 'ancient_wonders' | 'custom'>('ironsworn');
	let heroAssetCategoryFilter = $state('all');
	let heroAssetSearch = $state('');
	let assetImportPackFilter = $state('all');
	let showFeRunnersTruths = $state(false);
	let recordPortraitDraft = $state('');
	let portraitModalRecordId = $state('');
	let portraitModalForDraft = $state(false);
	let portraitGalleryTab = $state<'character' | 'creature'>('character');
	let portraitArchetypeFilter = $state('all');
	let portraitSearch = $state('');
	let heroVowTargetId = $state('');
	let heroVowName = $state('');
	let heroVowRank = $state<TrackRank>('Dangerous');
	let heroVowThreat = $state(false);
	let heroVowThreatName = $state('');
	let heroConditionDrafts = $state<Record<string, string>>({});
	let npcQuestInputs = $state<Record<string, string>>({});
	let locationQuestInputs = $state<Record<string, string>>({});
	let locationAssignNpcDraft = $state<Record<string, string>>({});
	let factionAssignMemberDraft = $state<Record<string, string>>({});
	let truthSelectedOptions = $state<Record<string, string>>({});
	let truthSelectedSuboptions = $state<Record<string, string>>({});
	let appThemeColor = $state('#214c48');
	let campaignCustomOracles = $state<CustomOracle[]>([]);
	let showCustomOracleDialog = $state(false);
	let editingCustomOracleId = $state('');
	let customOracleName = $state('');
	let customOracleKind = $state<'range' | 'simple'>('range');
	let customOracleRows = $state<{ min: number; max: number; text: string }[]>([{ min: 1, max: 50, text: '' }, { min: 51, max: 100, text: '' }]);
	let denizenModalSiteId = $state('');
	let denizenDraftSlots = $state<DenizenSlot[]>([]);
	let denizenInlineRolls = $state<Record<string, string>>({});
	let showLedgerDialog = $state(false);
	let ledgerUpkeep = $state('');
	let ledgerItems = $state<{ id: string; name: string; value: number; maxValue: number; isDepleted: boolean }[]>([]);
	const THEME_SWATCHES: { name: string; color: string }[] = [
		{ name: 'base', color: '#214c48' },
		{ name: 'slate', color: '#334155' },
		{ name: 'red', color: '#7f1d1d' },
		{ name: 'orange', color: '#9a3412' },
		{ name: 'brown', color: '#5c4033' },
		{ name: 'lime', color: '#3f6212' },
		{ name: 'green', color: '#14532d' },
		{ name: 'emerald', color: '#065f46' },
		{ name: 'teal', color: '#115e59' },
		{ name: 'cyan', color: '#155e75' },
		{ name: 'sky', color: '#075985' },
		{ name: 'blue', color: '#1e3a8a' },
		{ name: 'indigo', color: '#312e81' },
		{ name: 'fuchsia', color: '#701a75' },
		{ name: 'pink', color: '#831843' },
		{ name: 'rose', color: '#881337' },
		{ name: 'black', color: '#18181b' }
	];
	const areas = ['Journal', 'Heroes', 'Tracks', 'NPC', 'Sites', 'Locations', 'Factions', 'Maps', 'Truths', 'Assets', 'Themes & Domains'];
	const areaSymbols: Record<string, string> = { Journal: '▤', Heroes: '♙', Tracks: '◉', NPC: '♟', Sites: '⌖', Locations: '⌂', Factions: '⚑', Maps: '▦', Truths: '✧', Assets: '♜', 'Themes & Domains': '✺' };
	function navigateTo(area: string) {
		activeArea = area;
		if (area === 'Heroes') recordKind = 'hero';
		else if (area === 'NPC') recordKind = 'npc';
		reorderMode = false;
		showMobileSections = false;
		showTableTools = false;
		showSettingsMenu = false;
		showAppMenu = false;
	}
	function openTableTools(tool: 'oracles' | 'moves' = 'oracles') {
		tableTool = tool;
		isDrawerOpen = true;
		showMobileSections = false;
	}
	function leaveTableTools() {
		showTableTools = false;
	}
	function scrollNavTabs(delta: number) {
		navTabsEl?.scrollBy({ left: delta, behavior: 'smooth' });
	}
	function showBriefToast(message: string) {
		drawerToast = message;
	}
	function returnToLaunchScreen() {
		activeCampaignId = '';
		activeArea = 'Journal';
		showAppMenu = false;
		showSettingsMenu = false;
		showCampaignPicker = false;
		try { localStorage.removeItem(ACTIVE_CAMPAIGN_KEY); } catch { /* ignore */ }
	}
	function triggerSpellforgeRoll(fieldId: string) {
		const enabled = dataswornLibrary.records.filter((r) => dataswornLibrary.isEnabled(r.packId));
		const res = rollSpellforgeTable(fieldId, enabled, oracleInlineValues);
		if (res.updatedValues) {
			oracleInlineValues = { ...oracleInlineValues, ...res.updatedValues };
		} else {
			setInlineOracleValue(fieldId, res.text);
		}
	}
	const settingNames: Record<CampaignSetting, string> = {
		ironsworn: 'Ironsworn', starforged: 'Starforged', 'sundered-isles': 'Sundered Isles'
	};
	const rulesetNames: Record<CharacterRuleset, string> = { ironsworn: 'Ironsworn', starforged: 'Starforged' };
	const activeCampaign = $derived(campaigns.find((campaign) => campaign.id === activeCampaignId) ?? null);
	const activeOptions = $derived(campaignOptions(activeCampaign));
	const visibleNavAreas = $derived(areas.filter((area) => {
		if (area === 'Factions') return activeOptions.hasActiveFactions;
		if (area === 'Maps') return activeOptions.hasActiveMaps;
		if (area === 'Truths') return activeOptions.hasActiveTruths;
		if (area === 'Assets') return activeOptions.hasActiveAssets;
		if (area === 'Themes & Domains') return activeOptions.hasActiveThemes;
		return true;
	}));
	const drawerTabTitle = $derived(drawerRulesetTab === 'isles' ? 'Sundered Isles' : drawerRulesetTab === 'starforged' ? 'Starforged' : 'Ironsworn');
	const drawerMoves = $derived(flatDrawerMoves(
		drawerRulesetTab,
		dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId)),
		dataswornLibrary.packs.map((source) => ({ id: source.id, bundled: source.bundled, pack: source.pack })),
		moveSearch,
		showUnscopedMoves
	));
	const drawerOraclePackIds = $derived(
		drawerRulesetTab === 'ironsworn'
			? ['classic', 'delve']
			: drawerRulesetTab === 'isles'
				? ['sundered_isles', 'starforged']
				: ['starforged']
	);
	const drawerOracleGroups = $derived(groupedDrawerOracles(
		drawerOraclePackIds,
		dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId)),
		oracleSearch
	));
	const ironsmithOracleGroups = $derived(activeOptions.isIronsmith && dataswornLibrary.isEnabled('ironsmith') ? groupedDrawerOracles(['ironsmith'], dataswornLibrary.records, oracleSearch) : []);
	const starsmithOracleGroups = $derived(activeOptions.isStarsmith && dataswornLibrary.isEnabled('starsmith') ? groupedDrawerOracles(['starsmith'], dataswornLibrary.records, oracleSearch) : []);
	const feRunnersMoves = $derived(activeOptions.isFeRunners && dataswornLibrary.isEnabled('fe_runners') ? flatPackMoves('fe_runners', dataswornLibrary.records, moveSearch) : []);
	const feRunnersOracleGroups = $derived(activeOptions.isFeRunners && dataswornLibrary.isEnabled('fe_runners') ? groupedDrawerOracles(['fe_runners'], dataswornLibrary.records, oracleSearch) : []);
	const ancientWondersMoves = $derived(activeOptions.isAncientWonders && dataswornLibrary.isEnabled('ancient_wonders') ? flatPackMoves('ancient_wonders', dataswornLibrary.records, moveSearch) : []);
	const ancientWondersOracleGroups = $derived(activeOptions.isAncientWonders && dataswornLibrary.isEnabled('ancient_wonders') ? groupedDrawerOracles(['ancient_wonders'], dataswornLibrary.records, oracleSearch) : []);
	const visibleTracks = $derived(campaignTracks.filter((track) => showResolvedTracks || !track.resolvedAt));
	const shownTrackResolution = $derived(campaignTracks.find((track) => track.id === resolvingTrackId)?.resolution ?? resolutionRoll);
	const recordFields = $derived(recordKind === 'hero' ? HERO_FIELDS : NPC_FIELDS);
	const activeRecordKind = $derived<RecordKind>(activeArea === 'NPC' ? 'npc' : 'hero');
	const visibleRecords = $derived(campaignRecords.filter((record) => {
		if (record.kind !== activeRecordKind) return false;
		if (activeRecordKind === 'npc') {
			const hasBond = !!record.isBond || !!record.fields.Bond?.trim();
			const isConnection = !!record.isConnection || record.fields['NPC Type'] === 'Connection';
			const bucket = isConnection ? 'connection' : hasBond ? 'bond' : 'npc';
			if (!npcRoleFilter.includes(bucket)) return false;
		}
		return !recordFilter.trim() || JSON.stringify(record.fields).toLowerCase().includes(recordFilter.trim().toLowerCase());
	}));
	const visibleSites = $derived(campaignSites.filter((site) => siteTypeFilter.includes(site.type) && (!siteFilter.trim() || JSON.stringify(site).toLowerCase().includes(siteFilter.trim().toLowerCase()))));
	const visibleFactions = $derived(campaignFactions.filter((faction) => !factionFilter.trim() || JSON.stringify(faction).toLowerCase().includes(factionFilter.trim().toLowerCase())));
	const visibleLocations = $derived(campaignLocations.filter((location) => {
		const normType = locationRegions[location.origin]?.includes(location.type) && !location.region ? 'Settlement' : (location.type || 'Settlement');
		if (!locationTypeFilter.some((f) => f.toLowerCase() === normType.toLowerCase())) return false;
		return !locationFilter.trim() || JSON.stringify(location).toLowerCase().includes(locationFilter.trim().toLowerCase());
	}));
	const visibleAssets = $derived(campaignAssets.filter((asset) => !assetSearch.trim() || `${asset.name} ${asset.category} ${asset.origin} ${asset.description}`.toLowerCase().includes(assetSearch.trim().toLowerCase())));
	const visibleThemes = $derived(campaignThemes.filter((theme) => !themeSearch.trim() || `${theme.name} ${theme.kind} ${theme.description}`.toLowerCase().includes(themeSearch.trim().toLowerCase())));
	const availableAssets = $derived(dataswornLibrary.records.filter((record) => record.type === 'asset' && dataswornLibrary.isEnabled(record.packId) && (assetImportPackFilter === 'all' || record.packId === assetImportPackFilter) && (!assetImportSearch.trim() || `${record.name} ${record.data.category ?? ''} ${record.packTitle} ${record.id}`.toLowerCase().includes(assetImportSearch.trim().toLowerCase()))));
	const activeMap = $derived(campaignMaps.find((map) => map.id === activeMapId) ?? campaignMaps[0] ?? null);
	const oraclePackIds: Record<CampaignSetting, string[]> = {
		ironsworn: ['classic', 'delve', 'ironsmith'],
		starforged: ['starforged', 'starsmith', 'ancient_wonders', 'fe_runners'],
		'sundered-isles': ['sundered_isles', 'starforged', 'starsmith', 'ancient_wonders', 'fe_runners']
	};
	const oracleTables = $derived.by(() => {
		if (!activeCampaign) return [] as OracleTable[];
		const preferred = oraclePackIds[activeCampaign.setting];
		return dataswornLibrary.records
			.filter((record) => record.type === 'oracle_rollable' && dataswornLibrary.isEnabled(record.packId) &&
				(preferred.includes(record.packId) || dataswornLibrary.allPacks.find((pack) => pack.id === record.packId)?.bundled === false))
			.map(oracleTableFromRecord)
			.filter((table): table is OracleTable => !!table)
			.sort((left, right) => {
				const leftRank = preferred.indexOf(left.packId);
				const rightRank = preferred.indexOf(right.packId);
				return (leftRank < 0 ? preferred.length : leftRank) - (rightRank < 0 ? preferred.length : rightRank) || left.name.localeCompare(right.name);
			});
	});
	const filteredOracleTables = $derived(oracleTables.filter((table) => !oracleSearch.trim() || `${table.name} ${table.packTitle} ${table.description}`.toLocaleLowerCase().includes(oracleSearch.trim().toLocaleLowerCase())));
	const activeOracleTable = $derived(oracleTables.find((table) => table.id === oracleTableId) ?? oracleTables.find((table) => table.name.toLocaleLowerCase() === 'action') ?? oracleTables[0] ?? null);
	const quickOraclePicks = $derived((activeCampaign?.setting === 'sundered-isles'
		? ['Action', 'Theme', 'Character Roles']
		: ['Action', 'Theme', 'Character Role']).flatMap((name) => {
		const table = oracleTables.find((candidate) => candidate.name === name && candidate.packId === (activeCampaign?.setting === 'ironsworn' ? 'classic' : activeCampaign?.setting === 'starforged' ? 'starforged' : 'sundered_isles')) ?? oracleTables.find((candidate) => candidate.name === name);
		return table ? [table] : [];
	}));
	const moveGroups = $derived(activeCampaign ? groupedCampaignMoves(
		activeCampaign.setting, activeCampaign.characterRuleset, dataswornLibrary.records,
		dataswornLibrary.packs.map((source) => ({ id: source.id, bundled: source.bundled, pack: source.pack })), moveSearch, showUnscopedMoves
	) : []);
	function describeOracleTable(table: OracleTable) {
		return [table.category, table.packTitle].filter(Boolean).join(' · ');
	}
	const quickRollHeroes = $derived(campaignRecords.filter((record) => record.kind === 'hero'));
	const selectedQuickRollHero = $derived(quickRollHeroes.find((record) => record.id === quickRollHeroId) ?? null);
	const bottomHero = $derived(quickRollHeroes.find((record) => record.id === quickRollHeroId) ?? quickRollHeroes[0] ?? null);
	const bottomStatValue = $derived(bottomStat === 'custom' ? bottomCustom : bottomHero?.stats[bottomStat] ?? 0);
	const quickRollStatValue = $derived(selectedQuickRollHero?.stats[quickRollStat] ?? quickRollManualStat);
	const settingTruthPackIds: Record<CampaignSetting, string[]> = {
		ironsworn: ['classic'],
		starforged: ['starforged'],
		'sundered-isles': ['sundered_isles']
	};
	const truthRecords = $derived.by(() => {
		if (!activeCampaign) return [] as DataswornRecord[];
		const preferred = [
			...settingTruthPackIds[activeCampaign.setting],
			...(showFeRunnersTruths ? ['fe_runners'] : [])
		];
		const baseNames = new Set(
			dataswornLibrary.records
				.filter((r) => r.type === 'truth' && settingTruthPackIds[activeCampaign.setting].includes(r.packId))
				.map((r) => r.name)
		);
		const records = dataswornLibrary.records
			.filter((record) => {
				if (record.type !== 'truth' || !dataswornLibrary.isEnabled(record.packId)) return false;
				const pack = dataswornLibrary.allPacks.find((item) => item.id === record.packId);
				return preferred.includes(record.packId) || pack?.bundled === false;
			})
			.map((record) =>
				record.packId === 'fe_runners' && baseNames.has(record.name)
					? { ...record, name: `${record.name} (Fe-Runners)` }
					: record
			);
		return records.sort((left, right) => {
			const leftRank = preferred.indexOf(left.packId);
			const rightRank = preferred.indexOf(right.packId);
			return (leftRank < 0 ? preferred.length : leftRank) - (rightRank < 0 ? preferred.length : rightRank);
		});
	});
	const truthCategories = $derived([...new Set([...truthRecords.map((record) => record.name), ...campaignTruths.map((truth) => truth.category)])]);
	const visibleTruthCategories = $derived(truthCategories.filter((category) => {
		const saved = campaignTruths.find((truth) => truth.category === category);
		const query = truthFilter.trim().toLocaleLowerCase();
		return (!hideUnusedTruths || !!saved) && (!query || `${category} ${saved?.value ?? ''}`.toLocaleLowerCase().includes(query));
	}));
	const selectedTruthRecord = $derived(
		truthRecords.find((record) => record.name === selectedTruthCategory) ??
		(() => {
			const saved = campaignTruths.find((truth) => truth.category === selectedTruthCategory && !truth.custom);
			return saved ? dataswornLibrary.records.find((record) => record.id === saved.recordId) ?? null : null;
		})()
	);
	const editingCustomTruth = $derived((!editingTruthId && !selectedTruthRecord) || !!campaignTruths.find((truth) => truth.id === editingTruthId)?.custom);
	const truthOptions = $derived(selectedTruthRecord ? (Array.isArray(selectedTruthRecord.data.options) ? selectedTruthRecord.data.options : []).flatMap((option, index) => {
			if (!option || typeof option !== 'object') return [];
			const item = option as Record<string, unknown>;
			const description = typeof item.description === 'string' ? item.description : '';
			const summary = typeof item.summary === 'string' ? item.summary : '';
			const roll = item.roll && typeof item.roll === 'object' ? item.roll as { min?: number; max?: number } : {};
			if (!description && !summary) return [];
			return [{ id: typeof (item as { _id?: unknown })._id === 'string' ? (item as { _id: string })._id : `${selectedTruthRecord.id}:${index}`, summary, description: description.replace(/\{\{[^}]+\}\}/g, '[linked Datasworn oracle content]'), min: roll.min ?? 1, max: roll.max ?? 100 }];
		}) : []);
	const sectionNames: Record<string, { subtitle: string; title: string; description: string }> = {
		Campaign: { subtitle: 'YOUR STORY, YOUR RULES', title: 'Campaign overview', description: 'Your campaign is ready for the next chapter.' },
		Journal: { subtitle: 'THE STORY SO FAR', title: 'Journal', description: 'Record discoveries, oracle results, and the moments that shape this campaign.' },
		Heroes: { subtitle: 'CHARACTERS & ASSETS', title: 'Heroes', description: 'Create and manage the protagonists and their assets.' },
		Tracks: { subtitle: 'VOWS & PROGRESS', title: 'Tracks', description: 'Follow vows, journeys, combat, and other progress tracks.' },
		NPC: { subtitle: 'PEOPLE IN THE WORLD', title: 'NPCs', description: 'Keep the important people in your campaign close at hand.' },
		Sites: { subtitle: 'DELVES & DERELICTS', title: 'Sites', description: 'Build sites, zones, and challenges for exploration.' },
		Locations: { subtitle: 'PLACES & SETTLEMENTS', title: 'Locations', description: 'Collect the places that make your world feel lived in.' },
		Factions: { subtitle: 'POWERS & INFLUENCE', title: 'Factions', description: 'Track the groups shaping events in your world.' },
		Maps: { subtitle: 'THE LAY OF THE LAND', title: 'Maps', description: 'Map important regions and place campaign locations.' },
		Truths: { subtitle: 'WORLD SETTINGS', title: 'Truths', description: 'Define the truths and assumptions of your setting.' },
		Assets: { subtitle: 'GEAR & COMPANIONS', title: 'Assets', description: 'Create and import campaign assets and track their abilities.' },
		'Themes & Domains': { subtitle: 'CUSTOM EXPLORATION', title: 'Themes & Domains', description: 'Author encounter tables for Delve sites and Starforged themes.' },
		Oracles: { subtitle: 'AT THE TABLE', title: 'Oracles & quick rolls', description: 'Roll Datasworn tables and keep the results with your campaign.' }
	};
	const foundations = [
		{ title: 'A campaign at a glance', text: 'Keep the current vow, active threads, and recent journal entries close at hand.' },
		{ title: 'Rules stay modular', text: 'Load official and community Datasworn packs, then layer in your own compatible content.' },
		{ title: 'Made for the table', text: 'Comfortable touch targets, responsive panels, and readable type from phone to desktop.' }
	];

	onMount(() => {
		try {
			if (typeof window !== 'undefined') isDrawerOpen = window.innerWidth >= 1018;
			bottomJournalRolls = localStorage.getItem('ironvibes.journal-rolls') === 'true';
			darkMode = localStorage.getItem('ironvibes.dark-mode') === 'true';
			swipeNav = localStorage.getItem('ironvibes.swipe-nav') !== 'false';
			rememberCampaign = localStorage.getItem('ironvibes.remember-campaign') !== 'false';
			appThemeColor = localStorage.getItem('ironvibes.theme-color') || '#214c48';
			savedLibrary = parseSavedLibrary(localStorage.getItem(SAVED_LIBRARY_KEY));
			campaigns = parseCampaigns(localStorage.getItem(CAMPAIGNS_KEY));
			const storedActiveId = localStorage.getItem(ACTIVE_CAMPAIGN_KEY) ?? '';
			activeCampaignId = campaigns.some((campaign) => campaign.id === storedActiveId)
				? storedActiveId
				: campaigns[0]?.id ?? '';
			const current = campaigns.find((campaign) => campaign.id === activeCampaignId) ?? null;
			drawerRulesetTab = campaignOptions(current).activeDrawerTab ?? 'ironsworn';
			journalEntries = activeCampaignId ? parseJournalEntries(localStorage.getItem(journalStorageKey(activeCampaignId))) : [];
			campaignTracks = activeCampaignId ? parseCampaignTracks(localStorage.getItem(trackStorageKey(activeCampaignId))) : [];
			campaignRecords = activeCampaignId ? parseCampaignRecords(localStorage.getItem(recordStorageKey(activeCampaignId))) : [];
			campaignSites = activeCampaignId ? parseCampaignSites(localStorage.getItem(siteStorageKey(activeCampaignId))) : [];
			campaignFactions = activeCampaignId ? parseCampaignFactions(localStorage.getItem(factionStorageKey(activeCampaignId))) : [];
			campaignLocations = activeCampaignId ? parseCampaignLocations(localStorage.getItem(locationStorageKey(activeCampaignId))) : [];
			campaignMaps = activeCampaignId ? parseCampaignMaps(localStorage.getItem(mapStorageKey(activeCampaignId))) : [];
			campaignTruths = activeCampaignId ? parseCampaignTruths(localStorage.getItem(truthStorageKey(activeCampaignId))) : [];
			campaignAssets = activeCampaignId ? parseCampaignAssets(localStorage.getItem(assetStorageKey(activeCampaignId))) : [];
			campaignThemes = activeCampaignId ? parseCampaignThemes(localStorage.getItem(themeStorageKey(activeCampaignId))) : [];
			campaignCustomOracles = activeCampaignId ? parseCustomOracles(localStorage.getItem(customOracleStorageKey(activeCampaignId))) : [];
			loadCampaignLedger(activeCampaignId);
			activeMapId = campaignMaps[0]?.id ?? '';
			dataswornLibrary.initialize();
			if (activeCampaignId !== storedActiveId) localStorage.setItem(ACTIVE_CAMPAIGN_KEY, activeCampaignId);
		} catch {
			storageError = 'Campaign storage is unavailable in this browser. Your changes may not be saved.';
		}
	});

	function saveCampaigns(next: Campaign[], nextActiveId = activeCampaignId) {
		try {
			localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(next));
			localStorage.setItem(ACTIVE_CAMPAIGN_KEY, nextActiveId);
			campaigns = next;
			activeCampaignId = nextActiveId;
			const nextCampaign = next.find((campaign) => campaign.id === nextActiveId) ?? null;
			drawerRulesetTab = campaignOptions(nextCampaign).activeDrawerTab ?? 'ironsworn';
			activeMoveRoll = null;
			moveRollResult = null;
			pendingMapPlacement = null;
			showAssetEditor = false;
			showAssetImport = false;
			showThemeEditor = false;
			journalEntries = nextActiveId ? parseJournalEntries(localStorage.getItem(journalStorageKey(nextActiveId))) : [];
			campaignTracks = nextActiveId ? parseCampaignTracks(localStorage.getItem(trackStorageKey(nextActiveId))) : [];
			campaignRecords = nextActiveId ? parseCampaignRecords(localStorage.getItem(recordStorageKey(nextActiveId))) : [];
			campaignSites = nextActiveId ? parseCampaignSites(localStorage.getItem(siteStorageKey(nextActiveId))) : [];
			campaignFactions = nextActiveId ? parseCampaignFactions(localStorage.getItem(factionStorageKey(nextActiveId))) : [];
			campaignLocations = nextActiveId ? parseCampaignLocations(localStorage.getItem(locationStorageKey(nextActiveId))) : [];
			campaignMaps = nextActiveId ? parseCampaignMaps(localStorage.getItem(mapStorageKey(nextActiveId))) : [];
			campaignTruths = nextActiveId ? parseCampaignTruths(localStorage.getItem(truthStorageKey(nextActiveId))) : [];
			campaignAssets = nextActiveId ? parseCampaignAssets(localStorage.getItem(assetStorageKey(nextActiveId))) : [];
			campaignThemes = nextActiveId ? parseCampaignThemes(localStorage.getItem(themeStorageKey(nextActiveId))) : [];
			campaignCustomOracles = nextActiveId ? parseCustomOracles(localStorage.getItem(customOracleStorageKey(nextActiveId))) : [];
			loadCampaignLedger(nextActiveId);
			activeMapId = campaignMaps[0]?.id ?? '';
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save this campaign to browser storage. Check available storage and try again.';
			return false;
		}
	}

	function openNewCampaign() {
		editingCampaignId = '';
		campaignName = '';
		campaignSetting = 'ironsworn';
		characterRuleset = 'ironsworn';
		campaignError = '';
		showCampaignSetup = true;
	}

	function openEditCampaign(campaign: Campaign) {
		editingCampaignId = campaign.id;
		campaignName = campaign.name;
		campaignSetting = campaign.setting;
		characterRuleset = campaign.characterRuleset;
		campaignError = '';
		showCampaignPicker = false;
		showCampaignSetup = true;
	}

	function saveCampaign() {
		campaignError = '';
		try {
			const previous = campaigns.find((campaign) => campaign.id === editingCampaignId);
			const now = new Date().toISOString();
			const nextCampaign = makeCampaign({ name: campaignName, setting: campaignSetting, characterRuleset }, editingCampaignId || createId(), now);
			const campaign = previous ? { ...nextCampaign, createdAt: previous.createdAt } : nextCampaign;
			const next = putCampaign(campaigns, campaign);
			if (!saveCampaigns(next, campaign.id)) return;
			showCampaignSetup = false;
			showCampaignPicker = false;
			navigateTo('Journal');
		} catch (error) {
			campaignError = error instanceof Error ? error.message : 'Could not save this campaign.';
		}
	}

	function selectCampaign(id: string) {
		if (saveCampaigns(campaigns, id)) {
			showCampaignPicker = false;
			navigateTo('Journal');
		}
	}

	function removeCampaign(id: string) {
		const campaign = campaigns.find((item) => item.id === id);
		if (!campaign || !confirm(`Delete “${campaign.name}” from this browser? This cannot be undone.`)) return;
		const next = deleteCampaign(campaigns, id);
		const nextActive = id === activeCampaignId ? next[0]?.id ?? '' : activeCampaignId;
		if (saveCampaigns(next, nextActive)) {
			localStorage.removeItem(journalStorageKey(id));
			localStorage.removeItem(trackStorageKey(id));
			localStorage.removeItem(recordStorageKey(id));
			localStorage.removeItem(siteStorageKey(id));
			localStorage.removeItem(factionStorageKey(id));
			localStorage.removeItem(locationStorageKey(id));
			localStorage.removeItem(mapStorageKey(id));
			localStorage.removeItem(truthStorageKey(id));
			localStorage.removeItem(assetStorageKey(id));
			localStorage.removeItem(themeStorageKey(id));
			if (next.length === 0) showCampaignPicker = false;
		}
	}

	function downloadText(filename: string, text: string, type: string) {
		const blob = new Blob([text], { type });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	function exportActiveCampaign() {
		if (!activeCampaign) return;
		const archive = makeCampaignArchive({
			campaign: activeCampaign, journal: journalEntries, tracks: campaignTracks, records: campaignRecords,
			sites: campaignSites, factions: campaignFactions, locations: campaignLocations, maps: campaignMaps, truths: campaignTruths, assets: campaignAssets, themes: campaignThemes
		});
		const slug = activeCampaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign';
		downloadText(`${slug}.ironvibes.json`, JSON.stringify(archive, null, 2), 'application/json');
		campaignTransferMessage = `Downloaded “${activeCampaign.name}” with its campaign records and Journal.`;
		campaignTransferError = '';
	}

	function importCampaignFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		campaignTransferError = '';
		campaignTransferMessage = '';
		file.text().then((text) => {
			const archives = parseCampaignImports(text);
			let nextCampaigns = [...campaigns];
			let lastId = activeCampaignId;
			for (const archive of archives) {
				const importedCampaign = { ...archive.campaign, id: createId(), name: `${archive.campaign.name} (imported)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
				nextCampaigns = putCampaign(nextCampaigns, importedCampaign);
				lastId = importedCampaign.id;
				const keys = [journalStorageKey(importedCampaign.id), trackStorageKey(importedCampaign.id), recordStorageKey(importedCampaign.id), siteStorageKey(importedCampaign.id), factionStorageKey(importedCampaign.id), locationStorageKey(importedCampaign.id), mapStorageKey(importedCampaign.id), truthStorageKey(importedCampaign.id), assetStorageKey(importedCampaign.id), themeStorageKey(importedCampaign.id)];
				const values = [archive.journal, archive.tracks, archive.records, archive.sites, archive.factions, archive.locations, archive.maps, archive.truths, archive.assets, archive.themes].map((value) => JSON.stringify(value));
				keys.forEach((key, index) => localStorage.setItem(key, values[index]));
			}
			if (!saveCampaigns(nextCampaigns, lastId)) throw new Error('Could not add the imported campaign to this browser.');
			campaignTransferMessage = `Imported ${archives.length} campaign${archives.length === 1 ? '' : 's'} without overwriting existing campaigns.`;
			navigateTo('Journal');
		}).catch((error) => {
			campaignTransferError = error instanceof Error ? error.message : 'Could not import this campaign.';
		}).finally(() => { input.value = ''; });
	}

	function setAppThemeColor(color: string) {
		appThemeColor = color;
		try { localStorage.setItem('ironvibes.theme-color', color); } catch { /* ignore */ }
	}

	function loadCampaignLedger(campaignId: string) {
		if (!campaignId) {
			ledgerUpkeep = '';
			ledgerItems = [];
			return;
		}
		try {
			const raw = localStorage.getItem(ledgerStorageKey(campaignId));
			if (!raw) {
				ledgerUpkeep = '';
				ledgerItems = [];
				return;
			}
			const parsed = JSON.parse(raw) as { upkeep?: unknown; items?: unknown[] };
			ledgerUpkeep = typeof parsed.upkeep === 'string' ? parsed.upkeep : '';
			ledgerItems = Array.isArray(parsed.items)
				? parsed.items.filter((item): item is { id: string; name: string; value: number; maxValue: number; isDepleted: boolean } => !!item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string')
				: [];
		} catch {
			ledgerUpkeep = '';
			ledgerItems = [];
		}
	}

	function saveCampaignLedger() {
		if (!activeCampaign) return;
		try {
			localStorage.setItem(ledgerStorageKey(activeCampaign.id), JSON.stringify({ upkeep: ledgerUpkeep, items: ledgerItems }));
		} catch { /* ignore */ }
	}

	function addLedgerItem() {
		ledgerItems = [...ledgerItems, { id: createId(), name: '', value: 0, maxValue: 5, isDepleted: false }];
		saveCampaignLedger();
	}

	function removeLedgerItem(id: string) {
		ledgerItems = ledgerItems.filter((item) => item.id !== id);
		saveCampaignLedger();
	}

	function saveCustomOracles(next: CustomOracle[]) {
		if (!activeCampaign) return;
		campaignCustomOracles = next;
		try { localStorage.setItem(customOracleStorageKey(activeCampaign.id), JSON.stringify(next)); } catch { /* ignore */ }
	}

	function openNewCustomOracle() {
		editingCustomOracleId = '';
		customOracleName = '';
		customOracleKind = 'range';
		customOracleRows = [{ min: 1, max: 50, text: '' }, { min: 51, max: 100, text: '' }];
		showCustomOracleDialog = true;
	}

	function openEditCustomOracle(oracle: CustomOracle) {
		editingCustomOracleId = oracle.id;
		customOracleName = oracle.name;
		customOracleKind = oracle.kind;
		customOracleRows = oracle.rows.map((row) => ({ ...row }));
		showCustomOracleDialog = true;
	}

	function saveCustomOracleDraft() {
		const trimmed = customOracleName.trim();
		if (!trimmed) return;
		const oracle: CustomOracle = {
			id: editingCustomOracleId || createId(),
			name: trimmed,
			kind: customOracleKind,
			rows: customOracleRows.map((row) => ({ min: Number(row.min) || 1, max: Number(row.max) || 1, text: row.text.trim() }))
		};
		const next = editingCustomOracleId
			? campaignCustomOracles.map((item) => (item.id === editingCustomOracleId ? oracle : item))
			: [...campaignCustomOracles, oracle];
		saveCustomOracles(next);
		showCustomOracleDialog = false;
	}

	function exportCustomOracleToSaved(oracle: CustomOracle) {
		saveSavedLibrary(upsertSavedOracle(savedLibrary, oracle));
		showBriefToast(`${oracle.name} oracle exported successfully`);
	}

	function openDenizensModal(site: CampaignSite) {
		denizenModalSiteId = site.id;
		denizenDraftSlots = parseSiteDenizenTable(site.denizens);
	}

	function populateDenizenDraftSlots() {
		const enabled = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
		const origin: GenerationSetting = activeCampaign?.setting === 'starforged' ? 'Starforged' : activeCampaign?.setting === 'sundered-isles' ? 'Sundered Isles' : 'Ironsworn';
		denizenDraftSlots = denizenDraftSlots.map((slot) => {
			if (slot.name.trim()) return slot;
			try {
				const role = generateRecordField('character', origin, 'Role', enabled);
				const desc = generateRecordField('character', origin, 'Description', enabled);
				return { ...slot, name: `${desc} ${role}` };
			} catch {
				return slot;
			}
		});
	}

	function saveDenizensModal() {
		const site = campaignSites.find((item) => item.id === denizenModalSiteId);
		if (!site) return;
		saveCampaignSites(updateCampaignSite(campaignSites, site.id, { denizens: serializeSiteDenizenTable(denizenDraftSlots) }));
		denizenModalSiteId = '';
	}

	function triggerSiteDenizenRoll(site: CampaignSite) {
		const slots = parseSiteDenizenTable(site.denizens);
		const rolled = rollSiteDenizen(slots);
		denizenInlineRolls = { ...denizenInlineRolls, [site.id]: rolled.text };
	}

	function downloadJournalHtml() {
		if (!activeCampaign) return;
		const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
		const entries = [...journalEntries].reverse().map((entry) => `<article><time>${escapeHtml(new Date(entry.createdAt).toLocaleString())}</time><p>${escapeHtml(entry.text)}</p></article>`).join('\n');
		const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(activeCampaign.name)} — Journal</title><style>body{max-width:48rem;margin:3rem auto;padding:0 1rem;color:#26231d;background:#f5efdf;font:16px/1.65 Georgia,serif}h1{font-size:2.3rem}article{border-top:1px solid #c9bea6;padding:1rem 0}time{font-size:.8rem;color:#6d6658}p{white-space:pre-wrap}</style><h1>${escapeHtml(activeCampaign.name)} — Journal</h1>${entries || '<p>No journal entries yet.</p>'}</html>`;
		const slug = activeCampaign.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign';
		downloadText(`${slug}-journal.html`, html, 'text/html;charset=utf-8');
	}

	function saveAssets(next: CampaignAsset[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(assetStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignAssets = next;
			assetError = '';
			return true;
		} catch {
			assetError = 'Could not save assets. Check browser storage space.';
			return false;
		}
	}
	function openNewAsset() {
		editingAssetId = '';
		assetOrigin = activeCampaign?.setting === 'starforged' ? 'Starforged' : activeCampaign?.setting === 'sundered-isles' ? 'Sundered Isles' : 'Ironsworn';
		assetCategory = ASSET_TYPES[assetOrigin][0] ?? '';
		assetName = ''; assetDescription = ''; assetAbilities = [{ text: '', enabled: true }, { text: '', enabled: false }, { text: '', enabled: false }];
		assetStatuses = []; assetFieldLabel = ''; assetSecondaryFieldLabel = ''; assetTrackMax = 0; assetRollControl = 4;
		assetFieldValue = ''; assetSecondaryFieldValue = ''; assetError = ''; showAssetEditor = true;
	}
	function openEditAsset(asset: CampaignAsset) {
		editingAssetId = asset.id; assetOrigin = asset.origin; assetCategory = asset.category; assetName = asset.name;
		assetDescription = asset.description; assetAbilities = asset.abilities.map((ability) => ({ ...ability })); assetStatuses = [...asset.statuses];
		assetFieldLabel = asset.fieldLabel; assetSecondaryFieldLabel = asset.secondaryFieldLabel;
		assetFieldValue = asset.fieldValue; assetSecondaryFieldValue = asset.secondaryFieldValue;
		assetTrackMax = asset.trackMax; assetRollControl = asset.rollControl; assetError = ''; showAssetEditor = true;
	}
	function saveAssetDraft() {
		try {
			const existing = campaignAssets.find((asset) => asset.id === editingAssetId);
			const input = { name: assetName, origin: assetOrigin, category: assetCategory, description: assetDescription,
				abilities: assetAbilities, statuses: assetStatuses, fieldLabel: assetFieldLabel, secondaryFieldLabel: assetSecondaryFieldLabel,
				trackMax: Number(assetTrackMax), rollControl: Number(assetRollControl) };
			const asset = makeCustomAsset(input, existing?.id, existing?.createdAt);
			if (saveAssets(putCampaignAsset(campaignAssets, { ...asset, fieldValue: assetFieldLabel ? assetFieldValue : '',
				secondaryFieldValue: assetSecondaryFieldLabel ? assetSecondaryFieldValue : '', trackValue: existing ? Math.min(existing.trackValue, asset.trackMax) : asset.trackMax,
				sourceId: existing?.sourceId ?? '', sourcePack: existing?.sourcePack ?? '', sourceTitle: existing?.sourceTitle ?? asset.sourceTitle, updatedAt: new Date().toISOString() }))) showAssetEditor = false;
		} catch (error) {
			assetError = error instanceof Error ? error.message : 'Could not save this asset.';
		}
	}
	function importLibraryAsset(record: DataswornRecord) {
		try {
			const asset = assetFromDatasworn(record);
			if (saveAssets([...campaignAssets, asset])) showAssetImport = false;
		} catch (error) {
			assetError = error instanceof Error ? error.message : 'Could not import this Datasworn asset.';
		}
	}
	function updateAsset(asset: CampaignAsset, update: Partial<CampaignAsset>) {
		saveAssets(putCampaignAsset(campaignAssets, { ...asset, ...update, updatedAt: new Date().toISOString() }));
	}
	function toggleAssetStatus(status: AssetStatus) {
		assetStatuses = assetStatuses.includes(status) ? assetStatuses.filter((item) => item !== status) : [...assetStatuses, status];
	}
	function saveThemes(next: CampaignTheme[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(themeStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignThemes = next;
			themeError = '';
			return true;
		} catch {
			themeError = 'Could not save themes and domains in browser storage.';
			return false;
		}
	}
	function openNewTheme(kind: CustomThemeKind = 'Ironsworn theme') {
		themeDraft = blankTheme(kind);
		themeError = '';
		showThemeEditor = true;
	}
	function saveThemeDraft() {
		try {
			const theme = validateTheme(themeDraft);
			if (saveThemes(campaignThemes.some((item) => item.id === theme.id)
				? campaignThemes.map((item) => item.id === theme.id ? theme : item) : [...campaignThemes, theme])) showThemeEditor = false;
		} catch (error) {
			themeError = error instanceof Error ? error.message : 'Could not save this theme/domain.';
		}
	}
	function setThemeKind(kind: CustomThemeKind) {
		if (themeDraft.kind === kind) return;
		const next = blankTheme(kind);
		themeDraft = { ...next, name: themeDraft.name, description: themeDraft.description };
	}

	function addJournalNote(event: SubmitEvent) {
		event.preventDefault();
		if (!activeCampaign) return;
		try {
			const next = editingJournalId
				? updateJournalEntry(journalEntries, editingJournalId, journalDraft)
				: appendJournalEntry(journalEntries, makeJournalEntry(journalDraft));
			localStorage.setItem(journalStorageKey(activeCampaign.id), JSON.stringify(next));
			journalEntries = next;
			journalDraft = '';
			editingJournalId = '';
			storageError = '';
		} catch (error) {
			storageError = error instanceof Error ? error.message : 'Could not save this journal note.';
		}
	}

	function startEditJournalNote(entry: JournalEntry) {
		editingJournalId = entry.id;
		journalDraft = entry.text;
	}

	function cancelEditJournalNote() {
		editingJournalId = '';
		journalDraft = '';
	}

	function reorderJournalNote(id: string, direction: 'up' | 'down') {
		if (!activeCampaign) return;
		const next = moveJournalEntry(journalEntries, id, direction);
		try {
			localStorage.setItem(journalStorageKey(activeCampaign.id), JSON.stringify(next));
			journalEntries = next;
		} catch {
			storageError = 'Could not reorder the campaign journal.';
		}
	}

	function applyJournalFormat(kind: 'bold' | 'italic' | 'bullet' | 'number' | 'quote' | 'hr' | 'h1' | 'h2' | 'h3') {
		const prefixMap: Record<typeof kind, string> = {
			bold: '**bold**',
			italic: '*italic*',
			bullet: '\n• ',
			number: '\n1. ',
			quote: '\n> ',
			hr: '\n---\n',
			h1: '# ',
			h2: '## ',
			h3: '### '
		};
		journalDraft = `${journalDraft}${prefixMap[kind]}`;
	}

	function adjustCampaignResource(key: 'sharedSupplies' | 'hold' | 'treasury', delta: number, max = 99) {
		const current = Number(activeOptions[key] ?? (key === 'sharedSupplies' ? 5 : 0));
		const next = Math.max(0, Math.min(max, current + delta));
		updateCampaignOption(key, next);
	}

	function rollHeroStatFromCard(hero: CampaignRecord, stat: 'edge' | 'heart' | 'iron' | 'shadow' | 'wits') {
		quickRollHeroId = hero.id;
		bottomStat = stat;
		showBottomRoller = true;
		rollBottomAction();
	}

	function toggleFilterValue(list: string[], value: string): string[] {
		return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
	}

	function rollMapFactionInfluence() {
		if (!activeMap) return;
		const roll = Math.floor(Math.random() * 100) + 1;
		const status =
			roll <= 30 ? 'Dominant' : roll <= 60 ? 'Established' : roll <= 90 ? 'Subsisting' : roll <= 98 ? 'Diminished' : 'Obscure';
		const prefix = activeMap.factionInfluence?.split(' — ')[0]?.trim() || 'Faction';
		const updated = `${prefix} — ${roll}: ${status}`;
		saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { factionInfluence: updated }), activeMap.id);
	}

	function saveCampaignRecords(next: CampaignRecord[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(recordStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignRecords = next;
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save Heroes and NPCs to browser storage.';
			return false;
		}
	}

	function openNewRecord(kind: RecordKind) {
		recordKind = kind;
		editingRecordId = '';
		recordDraft = { Origin: activeCampaign?.setting === 'starforged' ? 'Starforged' : activeCampaign?.setting === 'sundered-isles' ? 'Sundered Isles' : 'Ironsworn', ...(kind === 'npc' ? { 'NPC Type': 'NPC' } : {}) };
		recordStatsDraft = { momentum: 2, health: 5, spirit: 5, supply: 5, edge: 1, heart: 1, iron: 1, shadow: 1, wits: 1 };
		recordExtras = { assets: '', legacyAndVows: '', debilities: '', characterDetails: '', notes: '' };
		useFantasySpecies = false;
		useExtendedNames = false;
		recordRollWithCursedDie = false;
		useLifeEvents = false;
		npcDraftIsBond = false;
		npcDraftIsConnection = false;
		npcDraftConnectionRank = 'Formidable';
		recordPortraitDraft = '';
		recordError = '';
		generationMessage = '';
		showRecordEditor = true;
	}

	function saveSavedLibrary(next: SavedLibrary) {
		savedLibrary = next;
		try { localStorage.setItem(SAVED_LIBRARY_KEY, serializeSavedLibrary(next)); } catch { /* ignore */ }
	}

	function exportLocationToSaved(location: CampaignLocation) {
		saveSavedLibrary(upsertSavedLocation(savedLibrary, location));
		showBriefToast(`${location.fields.settlementName} location exported successfully`);
	}

	function exportFactionToSaved(faction: CampaignFaction) {
		saveSavedLibrary(upsertSavedFaction(savedLibrary, faction));
		showBriefToast(`${faction.fields.name} faction exported successfully`);
	}

	function exportAssetToSaved(asset: CampaignAsset) {
		saveSavedLibrary(upsertSavedAsset(savedLibrary, asset));
		showBriefToast(`${asset.name} asset exported successfully`);
	}

	function exportThemeToSaved(theme: CampaignTheme) {
		saveSavedLibrary(upsertSavedTheme(savedLibrary, theme));
		showBriefToast(`${theme.name} theme exported successfully`);
	}

	function openSavedImportModal(kind: SavedLibraryKind) {
		savedImportKind = kind;
		selectedSavedIds = [];
		showSavedImportModal = true;
	}

	function importSelectedSavedItems() {
		if (!selectedSavedIds.length) return;
		if (savedImportKind === 'hero' || savedImportKind === 'npc') {
			const pool = savedImportKind === 'hero' ? savedLibrary.heroes : savedLibrary.npcs;
			const toAdd = pool.filter((item) => selectedSavedIds.includes(item.id) && !campaignRecords.some((existing) => existing.id === item.id));
			if (toAdd.length) saveCampaignRecords([...campaignRecords, ...toAdd.map((item) => structuredClone(item))]);
		} else if (savedImportKind === 'location') {
			const toAdd = savedLibrary.locations.filter((item) => selectedSavedIds.includes(item.id) && !campaignLocations.some((existing) => existing.id === item.id));
			if (toAdd.length) saveCampaignLocations([...campaignLocations, ...toAdd.map((item) => structuredClone(item))]);
		} else if (savedImportKind === 'faction') {
			const toAdd = savedLibrary.factions.filter((item) => selectedSavedIds.includes(item.id) && !campaignFactions.some((existing) => existing.id === item.id));
			if (toAdd.length) saveCampaignFactions([...campaignFactions, ...toAdd.map((item) => structuredClone(item))]);
		} else if (savedImportKind === 'asset') {
			const toAdd = savedLibrary.assets.filter((item) => selectedSavedIds.includes(item.id) && !campaignAssets.some((existing) => existing.id === item.id));
			if (toAdd.length) saveAssets([...campaignAssets, ...toAdd.map((item) => structuredClone(item))]);
		} else if (savedImportKind === 'theme') {
			const toAdd = savedLibrary.themes.filter((item) => selectedSavedIds.includes(item.id) && !campaignThemes.some((existing) => existing.id === item.id));
			if (toAdd.length) saveThemes([...campaignThemes, ...toAdd.map((item) => structuredClone(item))]);
		} else if (savedImportKind === 'oracle') {
			const toAdd = (savedLibrary.oracles ?? []).filter((item) => selectedSavedIds.includes(item.id) && !campaignCustomOracles.some((existing) => existing.id === item.id));
			if (toAdd.length) saveCustomOracles([...campaignCustomOracles, ...toAdd.map((item) => structuredClone(item))]);
		}
		showSavedImportModal = false;
		showBriefToast('Imported successfully');
	}

	function downloadExportedData() {
		const date = new Date().toISOString().slice(0, 10);
		downloadText(`pocketforge-saved-data-${date}.json`, serializeSavedLibrary(savedLibrary), 'application/json');
	}

	function uploadExportedDataFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		file.text().then((text) => {
			saveSavedLibrary(parseSavedLibrary(text));
			showBriefToast('Saved data uploaded successfully');
		}).catch(() => {
			storageError = 'Could not load saved data JSON.';
		});
		input.value = '';
	}

	function rollRecordSpecies() {
		recordDraft = { ...recordDraft, Species: rollFantasySpecies() };
	}

	function rollRecordLifeEvents() {
		try {
			const origin = (recordDraft.Origin as GenerationSetting) || 'Ironsworn';
			const count = Math.floor(Math.random() * 4) + 1;
			const enabled = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
			recordDraft = { ...recordDraft, 'Life events': generateLifeEvents(count, origin, enabled) };
		} catch (error) {
			generationMessage = error instanceof Error ? error.message : 'Could not roll life events.';
		}
	}

	function rollCreatureFieldOnDraft(field: (typeof CREATURE_FIELDS)[number]) {
		try {
			const enabled = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
			const value = generateCreatureField(field, enabled, recordDraft.Environment || 'Land');
			recordDraft = { ...recordDraft, [field]: value };
		} catch (error) {
			generationMessage = error instanceof Error ? error.message : 'Could not roll creature field.';
		}
	}

	function rollAllCreatureFields() {
		const enabled = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
		const next = { ...recordDraft };
		for (const field of CREATURE_FIELDS) {
			try { next[field] = generateCreatureField(field, enabled, next.Environment || 'Land'); } catch { /* ignore */ }
		}
		if (!next.Name?.trim()) next.Name = [next['First look'], next['Basic form']].filter(Boolean).join(' ') || 'Creature';
		recordDraft = next;
	}

	function openEditRecord(record: CampaignRecord) {
		recordKind = record.kind;
		editingRecordId = record.id;
		recordDraft = { ...record.fields };
		recordStatsDraft = { ...record.stats };
		recordExtras = { assets: record.assets.join('\n'), legacyAndVows: record.legacyAndVows.join('\n'), debilities: record.debilities.join('\n'), characterDetails: record.characterDetails, notes: record.notes };
		npcDraftIsBond = !!record.isBond || !!record.fields.Bond?.trim();
		npcDraftIsConnection = !!record.isConnection;
		npcDraftConnectionRank = record.connectionRank ?? 'Formidable';
		recordPortraitDraft = record.portrait ?? '';
		recordError = '';
		generationMessage = '';
		showRecordEditor = true;
	}

	function openPortraitPickerForRecord(record: CampaignRecord) {
		portraitModalRecordId = record.id;
		portraitModalForDraft = false;
		portraitGalleryTab = record.kind === 'npc' && record.fields['NPC Type'] === 'Creature' ? 'creature' : 'character';
		portraitArchetypeFilter = 'all';
		portraitSearch = '';
	}

	function openPortraitPickerForDraft() {
		portraitModalRecordId = '';
		portraitModalForDraft = true;
		portraitGalleryTab = recordKind === 'npc' && recordDraft['NPC Type'] === 'Creature' ? 'creature' : 'character';
		portraitArchetypeFilter = 'all';
		portraitSearch = '';
	}

	function closePortraitModal() {
		portraitModalRecordId = '';
		portraitModalForDraft = false;
	}

	function applyChosenPortrait(src: string) {
		if (portraitModalForDraft) {
			recordPortraitDraft = src;
			closePortraitModal();
			return;
		}
		if (portraitModalRecordId) {
			saveCampaignRecords(updateCampaignRecord(campaignRecords, portraitModalRecordId, { portrait: src }));
			showBriefToast('Portrait updated');
			closePortraitModal();
		}
	}

	function randomizePortrait(forDraft = false) {
		const isCreature = forDraft
			? recordKind === 'npc' && recordDraft['NPC Type'] === 'Creature'
			: portraitGalleryTab === 'creature';
		const pool = isCreature ? CREATURE_PORTRAIT_GALLERY : CHARACTER_PORTRAIT_GALLERY;
		const pick = pool[Math.floor(Math.random() * pool.length)];
		if (!pick) return;
		if (forDraft || portraitModalForDraft) {
			recordPortraitDraft = pick.src;
		} else if (portraitModalRecordId) {
			saveCampaignRecords(updateCampaignRecord(campaignRecords, portraitModalRecordId, { portrait: pick.src }));
			showBriefToast(`Portrait set to ${pick.label}`);
		}
	}

	function handleCustomPortraitUpload(event: Event, forDraft = false) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			recordError = 'Choose an image file for the portrait.';
			input.value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== 'string') return;
			const img = new Image();
			img.onload = () => {
				const maxW = 300;
				const maxH = 380;
				const canvas = document.createElement('canvas');
				canvas.width = maxW;
				canvas.height = maxH;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					const scale = Math.max(maxW / img.width, maxH / img.height);
					const drawW = img.width * scale;
					const drawH = img.height * scale;
					const dx = (maxW - drawW) / 2;
					const dy = (maxH - drawH) / 2;
					ctx.drawImage(img, dx, dy, drawW, drawH);
					const dataUrl = canvas.toDataURL('image/webp', 0.86);
					if (forDraft || portraitModalForDraft) {
						recordPortraitDraft = dataUrl;
						closePortraitModal();
					} else if (portraitModalRecordId) {
						saveCampaignRecords(updateCampaignRecord(campaignRecords, portraitModalRecordId, { portrait: dataUrl }));
						showBriefToast('Custom portrait uploaded');
						closePortraitModal();
					}
				}
			};
			img.src = reader.result;
		};
		reader.readAsDataURL(file);
		input.value = '';
	}

	function saveRecord() {
		try {
			const previous = campaignRecords.find((record) => record.id === editingRecordId);
			const base = previous ?? makeCampaignRecord(recordKind, recordDraft);
			const debilityCount = recordExtras.debilities.split('\n').map((item) => item.trim()).filter(Boolean).length;
			const momentumCap = previous?.momentumMax ?? computeMomentumLimits(debilityCount).momentumMax;
			const nextRecord: CampaignRecord = {
				...base,
				kind: recordKind,
				fields: Object.fromEntries(Object.entries(recordDraft).map(([key, value]) => [key, value.trim()])),
				stats: { ...recordStatsDraft, momentum: Math.max(-6, Math.min(momentumCap, recordStatsDraft.momentum)) },
				assets: recordExtras.assets.split('\n').map((item) => item.trim()).filter(Boolean),
				legacyAndVows: recordExtras.legacyAndVows.split('\n').map((item) => item.trim()).filter(Boolean),
				debilities: recordExtras.debilities.split('\n').map((item) => item.trim()).filter(Boolean),
				characterDetails: recordExtras.characterDetails.trim(),
				notes: recordExtras.notes.trim(),
				portrait: recordPortraitDraft.trim() || undefined,
				...(recordKind === 'npc' ? {
					isBond: npcDraftIsBond,
					isConnection: npcDraftIsConnection,
					connectionRank: npcDraftConnectionRank,
					connectionProgress: previous?.connectionProgress ?? 0
				} : {}),
				updatedAt: new Date().toISOString()
			};
			if (!nextRecord.fields.Name?.trim()) throw new Error('Enter a name for this record.');
			if (saveCampaignRecords(putCampaignRecord(campaignRecords, nextRecord))) {
				if (!editingRecordId && !expandedRecordIds.includes(nextRecord.id)) expandedRecordIds = [...expandedRecordIds, nextRecord.id];
				finishMapPlacement(nextRecord.id, 'character');
				if (recordKind === 'npc' && !editingRecordId && addNextNpc) {
					openNewRecord('npc');
					showBriefToast(`${nextRecord.fields.Name} added — ready for next NPC`);
				} else {
					showRecordEditor = false;
				}
			}
		} catch (error) {
			recordError = error instanceof Error ? error.message : 'Could not save this record.';
		}
	}

	function heroMomentumMax(record: CampaignRecord): number {
		const limits = computeMomentumLimits(record.debilities.length);
		return record.momentumMax ?? limits.momentumMax;
	}

	function heroMomentumReset(record: CampaignRecord): number {
		const limits = computeMomentumLimits(record.debilities.length);
		return record.momentumReset ?? limits.momentumReset;
	}

	function burnHeroCardMomentum(record: CampaignRecord) {
		const resetVal = heroMomentumReset(record);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { stats: { ...record.stats, momentum: resetVal } }));
		showBriefToast(`${record.fields.Name} burned momentum (reset to ${resetVal})`);
	}

	function cycleHeroInitiative(record: CampaignRecord) {
		const isSf = activeCampaign?.characterRuleset === 'starforged';
		const current = record.initiative ?? 'out_of_combat';
		const next: 'in_control' | 'bad_spot' | 'out_of_combat' = isSf
			? current === 'out_of_combat' ? 'in_control' : current === 'in_control' ? 'bad_spot' : 'out_of_combat'
			: current === 'in_control' ? 'out_of_combat' : 'in_control';
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { initiative: next }));
	}

	function toggleHeroCondition(record: CampaignRecord, condition: string) {
		const nextDebilities = record.debilities.includes(condition)
			? record.debilities.filter((item) => item !== condition)
			: [...record.debilities, condition];
		const limits = computeMomentumLimits(nextDebilities.length);
		const clampedMomentum = Math.min(record.stats.momentum, limits.momentumMax);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			debilities: nextDebilities,
			momentumMax: limits.momentumMax,
			momentumReset: limits.momentumReset,
			stats: { ...record.stats, momentum: clampedMomentum }
		}));
	}

	function addHeroCustomCondition(record: CampaignRecord) {
		const draft = (heroConditionDrafts[record.id] ?? '').trim();
		if (!draft) return;
		const existingCustom = record.customConditions ?? [];
		const nextCustom = existingCustom.includes(draft) ? existingCustom : [...existingCustom, draft];
		const nextDebilities = record.debilities.includes(draft) ? record.debilities : [...record.debilities, draft];
		const limits = computeMomentumLimits(nextDebilities.length);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			customConditions: nextCustom,
			debilities: nextDebilities,
			momentumMax: limits.momentumMax,
			momentumReset: limits.momentumReset,
			stats: { ...record.stats, momentum: Math.min(record.stats.momentum, limits.momentumMax) }
		}));
		heroConditionDrafts = { ...heroConditionDrafts, [record.id]: '' };
	}

	function removeHeroCustomCondition(record: CampaignRecord, condition: string) {
		const nextCustom = (record.customConditions ?? []).filter((item) => item !== condition);
		const nextDebilities = record.debilities.filter((item) => item !== condition);
		const limits = computeMomentumLimits(nextDebilities.length);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			customConditions: nextCustom,
			debilities: nextDebilities,
			momentumMax: limits.momentumMax,
			momentumReset: limits.momentumReset
		}));
	}

	function markHeroLegacy(record: CampaignRecord, key: 'quests' | 'bonds' | 'discoveries', deltaTicks: number) {
		const current = record.legacyTracks ?? { quests: 0, bonds: 0, discoveries: 0 };
		const nextVal = Math.max(0, Math.min(40, (current[key] ?? 0) + deltaTicks));
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			legacyTracks: { ...current, [key]: nextVal }
		}));
	}

	function openHeroAssetsModal(record: CampaignRecord) {
		heroAssetTargetId = record.id;
		heroAssetTab = activeCampaign?.setting === 'starforged' ? 'starforged' : activeCampaign?.setting === 'sundered-isles' ? 'isles' : 'ironsworn';
		heroAssetCategoryFilter = 'all';
		heroAssetSearch = '';
	}

	function addDataswornAssetToHero(recordId: string, dsRecord: DataswornRecord) {
		const hero = campaignRecords.find((r) => r.id === recordId);
		if (!hero) return;
		const existing = hero.heroAssets ?? [];
		const asset = assetFromDatasworn(dsRecord, createId(), new Date().toISOString());
		saveCampaignRecords(updateCampaignRecord(campaignRecords, recordId, {
			heroAssets: [...existing, asset]
		}));
		showBriefToast(`Added ${asset.name} to ${hero.fields.Name}`);
	}

	function addCustomAssetToHero(recordId: string, customAsset: CampaignAsset) {
		const hero = campaignRecords.find((r) => r.id === recordId);
		if (!hero) return;
		const existing = hero.heroAssets ?? [];
		const copy = { ...structuredClone(customAsset), id: createId() };
		saveCampaignRecords(updateCampaignRecord(campaignRecords, recordId, {
			heroAssets: [...existing, copy]
		}));
		showBriefToast(`Added ${copy.name} to ${hero.fields.Name}`);
	}

	function updateHeroCardAsset(record: CampaignRecord, assetId: string, patch: Partial<CampaignAsset>) {
		const nextAssets = (record.heroAssets ?? []).map((item) => item.id === assetId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { heroAssets: nextAssets }));
	}

	function removeHeroCardAsset(record: CampaignRecord, assetId: string) {
		const nextAssets = (record.heroAssets ?? []).filter((item) => item.id !== assetId);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { heroAssets: nextAssets }));
	}

	function openHeroVowModal(record: CampaignRecord) {
		heroVowTargetId = record.id;
		heroVowName = '';
		heroVowRank = 'Dangerous';
		heroVowThreat = false;
		heroVowThreatName = '';
	}

	function saveHeroPersonalVow() {
		const hero = campaignRecords.find((r) => r.id === heroVowTargetId);
		if (!hero) return;
		const vow = makeCampaignTrack({
			name: heroVowName.trim() || 'Personal vow',
			type: 'Progress',
			rank: heroVowRank,
			threat: heroVowThreat,
			threatName: heroVowThreatName
		});
		saveCampaignRecords(updateCampaignRecord(campaignRecords, hero.id, {
			vows: [...(hero.vows ?? []), vow]
		}));
		heroVowTargetId = '';
	}

	function markHeroVow(record: CampaignRecord, vowId: string, direction: -1 | 1) {
		const nextVows = markTrackProgress(record.vows ?? [], vowId, direction);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { vows: nextVows }));
	}

	function resolveHeroVow(record: CampaignRecord, vow: CampaignTrack) {
		const res = rollTrackResolution(vow);
		const nextVows = resolveCampaignTrack(record.vows ?? [], vow.id, res);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { vows: nextVows }));
		addTrackResolutionToJournal(`${record.fields.Name} (${vow.name}) — ${res}`);
		showBriefToast(res);
	}

	function removeHeroVow(record: CampaignRecord, vowId: string) {
		const nextVows = (record.vows ?? []).filter((v) => v.id !== vowId);
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { vows: nextVows }));
	}

	function markNpcConnection(record: CampaignRecord, direction: -1 | 1) {
		const rank = record.connectionRank ?? 'Formidable';
		const step = rank === 'Troublesome' ? 12 : rank === 'Dangerous' ? 8 : rank === 'Formidable' ? 4 : rank === 'Extreme' ? 2 : 1;
		const nextProg = Math.max(0, Math.min(40, (record.connectionProgress ?? 0) + direction * step));
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { connectionProgress: nextProg }));
	}

	function rollNpcQuestInput(record: CampaignRecord) {
		const origin = (record.fields.Origin as GenerationSetting) || 'Ironsworn';
		const enabled = dataswornLibrary.records.filter((r) => dataswornLibrary.isEnabled(r.packId));
		npcQuestInputs = { ...npcQuestInputs, [record.id]: generateQuestPrompt(origin, enabled) };
	}

	function addNpcQuestItem(record: CampaignRecord) {
		const raw = (npcQuestInputs[record.id] ?? '').trim();
		if (!raw) return;
		const items = raw.split(',').map((s) => s.trim()).filter(Boolean).map((name) => ({ id: createId(), name }));
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			quests: [...(record.quests ?? []), ...items]
		}));
		npcQuestInputs = { ...npcQuestInputs, [record.id]: '' };
	}

	function removeNpcQuestItem(record: CampaignRecord, questId: string) {
		saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, {
			quests: (record.quests ?? []).filter((q) => q.id !== questId)
		}));
	}

	function deleteRecord(record: CampaignRecord) {
		const name = record.fields.Name || record.kind;
		if (confirm(`Delete “${name}” from this campaign?`)) saveCampaignRecords(removeCampaignRecord(campaignRecords, record.id));
	}

	function recordJournalEntry(record: CampaignRecord) {
		const name = record.fields.Name || record.kind;
		const details = Object.entries(record.fields).filter(([key, value]) => key !== 'Name' && value).map(([key, value]) => `${key}: ${value}`).join(' · ');
		addTrackResolutionToJournal(`${record.kind === 'hero' ? 'Hero' : 'NPC'} — ${name}${details ? ` — ${details}` : ''}`);
	}

	function exportRecord(record: CampaignRecord) {
		saveSavedLibrary(upsertSavedRecord(savedLibrary, record));
		showBriefToast(`${record.fields.Name || record.kind} exported successfully`);
		const blob = new Blob([exportCampaignRecord(record)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${(record.fields.Name || record.kind).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function importRecordFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		file.text().then((text) => {
			const parsed: unknown = JSON.parse(text);
			const candidates = Array.isArray(parsed) ? parsed : [parsed];
			const imported = parseCampaignRecords(JSON.stringify(candidates), recordKind);
			if (!imported.length) throw new Error(`Choose a valid ${recordKind.toUpperCase()} JSON record.`);
			const restored = imported.map((record) => ({ ...record, id: createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
			if (saveCampaignRecords([...campaignRecords, ...restored])) recordError = `${restored.length} ${recordKind.toUpperCase()} record${restored.length === 1 ? '' : 's'} imported.`;
		}).catch((error) => { recordError = error instanceof Error ? error.message : 'Could not import this record.'; });
		input.value = '';
	}

	function saveCampaignSites(next: CampaignSite[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(siteStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignSites = next;
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save campaign sites to browser storage.';
			return false;
		}
	}

	function openNewSite() {
		editingSiteId = '';
		siteType = 'Delve';
		siteRank = 'Dangerous';
		siteDraft = { theme: '', domain: '', secondaryTheme: '', secondaryDomain: '', description: '', detail: '', namesake: '', place: '', name: '', aspectFocus: '' };
		siteDetails = {};
		siteCursed = false;
		siteError = '';
		siteGenerationMessage = '';
		siteSecondaryTheme = false;
		siteSecondaryDomain = false;
		showSiteEditor = true;
	}

	function openEditSite(site: CampaignSite) {
		editingSiteId = site.id;
		siteType = site.type;
		siteRank = site.rank;
		siteDraft = { ...site.fields };
		siteDetails = { ...site.details };
		siteCursed = !!site.rollWithCursedDie;
		siteError = '';
		siteGenerationMessage = '';
		siteSecondaryTheme = !!site.fields.secondaryTheme;
		siteSecondaryDomain = !!site.fields.secondaryDomain;
		showSiteEditor = true;
	}

	function generateSiteField(field: SiteGeneratedField) {
		siteError = '';
		siteGenerationMessage = '';
		if (siteType !== 'Delve') {
			siteError = 'Only Delve site generation has matching Datasworn tables; enter other site fields manually.';
			return;
		}
		try {
			const next = field === 'name'
				? rollSiteName(siteDraft, dataswornLibrary.records)
				: rollSiteField(field, dataswornLibrary.records);
			if (!next) throw new Error('Roll description and place first, or enter a site name.');
			siteDraft = { ...siteDraft, [field]: next };
			siteGenerationMessage = `${field === 'name' ? 'Composed' : 'Rolled'} ${field.replaceAll(/([A-Z])/g, ' $1').toLowerCase()}: ${next}`;
		} catch (error) {
			siteError = error instanceof Error ? error.message : 'Could not roll this site field.';
		}
	}

	function generateTypedSiteField(field: SiteDetailField | 'name' | 'theme') {
		if (siteType === 'Delve') return;
		siteError = '';
		try {
			const result = rollTypedSiteField(siteType, field, dataswornLibrary.records, Math.random, siteCursed);
			if (field === 'name' || field === 'theme') siteDraft = { ...siteDraft, [field]: result };
			else siteDetails = { ...siteDetails, [field]: result };
			siteGenerationMessage = `Rolled ${SITE_DETAIL_LABELS[field as SiteDetailField] ?? field}: ${result}`;
		} catch (error) { siteError = error instanceof Error ? error.message : 'Could not roll this field.'; }
	}

	function generateSiteFields() {
		siteError = '';
		if (siteType !== 'Delve') {
			const fields = SITE_DETAIL_FIELDS[siteType];
			const next = { ...siteDetails };
			const skipped: string[] = [];
			for (const field of [...fields, 'name', 'theme'] as (SiteDetailField | 'name' | 'theme')[]) {
				try {
					const value = rollTypedSiteField(siteType, field, dataswornLibrary.records, Math.random, siteCursed);
					if (field === 'name' || field === 'theme') siteDraft = { ...siteDraft, [field]: value }; else next[field] = value;
				} catch { skipped.push(field); }
			}
			siteDetails = next;
			siteGenerationMessage = skipped.length ? `Rolled available ${siteType} tables; enter ${skipped.join(', ')} manually.` : `Rolled ${siteType} fields. Review them before saving.`;
			return;
		}
		try {
			const next = { ...siteDraft };
			for (const field of ['theme', 'domain', 'description', 'detail', 'namesake', 'place', 'aspectFocus'] as SiteGeneratedField[]) {
				next[field] = rollSiteField(field, dataswornLibrary.records);
			}
			if (siteSecondaryTheme) next.secondaryTheme = rollSiteField('secondaryTheme', dataswornLibrary.records);
			if (siteSecondaryDomain) next.secondaryDomain = rollSiteField('secondaryDomain', dataswornLibrary.records);
			next.name = rollSiteName(next, dataswornLibrary.records);
			siteDraft = next;
			siteGenerationMessage = 'Rolled Delve fields from enabled Datasworn tables; review and edit before saving.';
		} catch (error) {
			siteError = error instanceof Error ? error.message : 'Could not roll this site.';
		}
	}

	function saveSite() {
		siteError = '';
		try {
			const previous = campaignSites.find((site) => site.id === editingSiteId);
			const site = previous
				? { ...previous, type: siteType, rank: siteRank, fields: { ...siteDraft, name: siteDraft.name.trim() }, details: { ...siteDetails }, rollWithCursedDie: siteCursed, updatedAt: new Date().toISOString() }
				: makeCampaignSite({ type: siteType, rank: siteRank, fields: siteDraft, details: siteDetails, rollWithCursedDie: siteCursed });
			if (!site.fields.name) throw new Error('Enter a name for this site.');
			if (saveCampaignSites(putCampaignSite(campaignSites, site))) {
				showSiteEditor = false;
				finishMapPlacement(site.id, 'site');
			}
		} catch (error) { siteError = error instanceof Error ? error.message : 'Could not save this site.'; }
	}

	function deleteSite(site: CampaignSite) {
		if (confirm(`Delete “${site.fields.name}” from this campaign?`)) saveCampaignSites(removeCampaignSite(campaignSites, site.id));
	}

	function changeSiteArea(site: CampaignSite, area: SiteArea, patch: Partial<Omit<SiteArea, 'id'>>) {
		saveCampaignSites(updateCampaignSite(campaignSites, site.id, { areas: updateSiteArea(site, area.id, patch) }));
	}

	function appendSiteArea(site: CampaignSite) {
		siteError = '';
		if (site.resolvedAt) {
			siteError = 'Reactivate this Delve before adding another area.';
			return;
		}
		let feature = '';
		try {
			feature = rollDelveAreaEntry('feature', site.activeTheme ?? site.fields.theme, site.activeDomain ?? site.fields.domain, dataswornLibrary.records, Math.random, campaignThemes);
		} catch (error) {
			siteError = error instanceof Error ? `${error.message} Area added with an editable blank feature.` : 'Could not generate this area’s feature.';
		}
		saveCampaignSites(updateCampaignSite(campaignSites, site.id, { areas: addSiteArea(site, createId(), feature) }));
	}

	function nonDelveTable(site: CampaignSite, field: string, zone = ''): string {
		const isles = 'oracle_rollable:sundered_isles';
		const starforged = 'oracle_rollable:starforged';
		switch (site.type) {
			case 'Derelict': return `${starforged}/derelict/${(zone || 'access').toLowerCase().replaceAll(' ', '_')}/${field}`;
			case 'Vault': return `${starforged}/precursor_vault/${zone === 'Sanctum' ? 'sanctum' : 'interior'}/${field}`;
			case 'Shipwreck': return `${isles}/shipwreck/${field}`;
			case 'Cave': return `${isles}/cave/${site.details?.caveType?.toLowerCase().includes('sea') ? 'sea' : 'inland_cave'}/${field}`;
			case 'Ruin': return `${isles}/ruin/${field}`;
			default: throw new Error('Use Delve area generation for this site.');
		}
	}

	function appendSiteWaypoint(site: CampaignSite, zone = '') {
		siteError = '';
		if (site.resolvedAt) { siteError = 'Reactivate this site before adding a waypoint.'; return; }
		let area = '', feature = '';
		try {
			if (site.type === 'Derelict') area = rollExplorationOracle(nonDelveTable(site, 'area', zone || 'Access'), dataswornLibrary.records);
			if (site.type === 'Vault') feature = rollExplorationOracle(nonDelveTable(site, 'feature', zone), dataswornLibrary.records);
		} catch (error) { siteError = error instanceof Error ? `${error.message} The waypoint remains editable.` : 'Could not generate this waypoint.'; }
		saveCampaignSites(updateCampaignSite(campaignSites, site.id, { areas: addSiteWaypoint(site, zone || (site.type === 'Derelict' ? 'Access' : ''), area, feature) }));
	}

	function rollSiteWaypoint(site: CampaignSite, area: SiteArea, kind: 'area' | 'feature' | 'peril' | 'opportunity' | 'descriptor' | 'details') {
		siteError = '';
		try {
			const tableField = kind === 'details' ? 'details' : kind === 'descriptor' ? 'descriptor' : kind;
			const table = kind === 'descriptor' ? 'oracle_rollable:starforged/core/descriptor' : nonDelveTable(site, tableField, area.zone);
			const value = kind === 'descriptor'
				? `${rollExplorationOracle(table, dataswornLibrary.records)} ${rollExplorationOracle('oracle_rollable:starforged/core/focus', dataswornLibrary.records)}`
				: rollExplorationOracle(table, dataswornLibrary.records, Math.random, site.rollWithCursedDie);
			changeSiteArea(site, area, { [kind]: value });
		} catch (error) { siteError = error instanceof Error ? error.message : 'Could not roll this waypoint.'; }
	}

	function rollSiteDiscovery(site: CampaignSite, kind: 'purpose' | 'heart' | 'cipher' | 'mystery' | 'innerFirstLook') {
		siteError = '';
		const tables: Record<typeof kind, string> = {
			purpose: 'oracle_rollable:starforged/precursor_vault/sanctum/purpose',
			heart: nonDelveTable(site, 'heart'), cipher: nonDelveTable(site, 'cipher'),
			mystery: nonDelveTable(site, 'mystery'),
			innerFirstLook: site.type === 'Derelict' ? 'oracle_rollable:starforged/derelict/inner_first_look' : 'oracle_rollable:starforged/precursor_vault/interior/first_look'
		};
		try {
			const value = rollExplorationOracle(tables[kind], dataswornLibrary.records, Math.random, site.rollWithCursedDie);
			saveCampaignSites(updateCampaignSite(campaignSites, site.id, { discoveries: { ...site.discoveries, [kind]: value } }));
		} catch (error) { siteError = error instanceof Error ? error.message : 'Could not roll this site discovery.'; }
	}

	function rollSiteArea(site: CampaignSite, area: SiteArea, kind: 'feature' | 'danger' | 'opportunity' | 'aspect') {
		siteError = '';
		try {
			let value: string;
			if (kind === 'feature' || kind === 'danger') value = rollDelveAreaEntry(kind, site.activeTheme ?? site.fields.theme, site.activeDomain ?? site.fields.domain, dataswornLibrary.records, Math.random, campaignThemes);
			else if (kind === 'aspect') {
				const aspect = dataswornLibrary.records.find((record) => record.id === 'oracle_rollable:delve/feature/aspect');
				const table = aspect && oracleTableFromRecord(aspect);
				if (!table) throw new Error('No enabled Delve aspect table is available.');
				value = `${rollOracleTable(table).row.text} ${rollSiteField('aspectFocus', dataswornLibrary.records)}`;
			}
			else throw new Error('No directly mapped Delve opportunity table is available. Enter an opportunity manually.');
			changeSiteArea(site, area, { [kind]: value });
		} catch (error) { siteError = error instanceof Error ? error.message : 'Could not roll this area.'; }
	}

	function locateSiteObjective(site: CampaignSite) {
		const now = new Date().toISOString();
		const result = rollSiteObjective(site);
		if (saveCampaignSites(updateCampaignSite(campaignSites, site.id, { resolvedAt: now, resolution: result }))) addTrackResolutionToJournal(`${site.fields.name} — ${result}`);
	}

	function reactivateSite(site: CampaignSite) {
		const { resolvedAt: _resolvedAt, resolution: _resolution, ...reopened } = site;
		saveCampaignSites(putCampaignSite(campaignSites, { ...reopened, updatedAt: new Date().toISOString() }));
	}

	function setSiteAreaField(site: CampaignSite, area: SiteArea, key: keyof Omit<SiteArea, 'id'>, event: Event) {
		changeSiteArea(site, area, { [key]: (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value });
	}

	function saveCampaignFactions(next: CampaignFaction[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(factionStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignFactions = next;
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save campaign factions to browser storage.';
			return false;
		}
	}

	function resetFactionDraft() {
		factionDraft = Object.fromEntries([...FACTION_FIELDS, ...SOCIETY_FIELDS].map((field) => [field, ''])) as Record<FactionField, string>;
	}

	function openNewFaction() {
		generationMessage = '';
		editingFactionId = '';
		factionOrigin = activeCampaign?.setting === 'sundered-isles' ? 'Sundered Isles' : 'Starforged';
		factionType = '';
		factionForceCursed = false;
		factionRollWithCursedDie = false;
		resetFactionDraft();
		factionError = '';
		showFactionEditor = true;
	}

	function openEditFaction(faction: CampaignFaction) {
		editingFactionId = faction.id;
		factionOrigin = faction.origin;
		factionType = faction.type;
		factionForceCursed = faction.forceCursed;
		factionRollWithCursedDie = faction.rollWithCursedDie;
		factionDraft = { ...faction.fields };
		factionError = '';
		showFactionEditor = true;
	}

	function saveFaction() {
		factionError = '';
		try {
			const previous = campaignFactions.find((faction) => faction.id === editingFactionId);
			const faction = previous
				? { ...previous, origin: factionOrigin, type: factionType.trim(), forceCursed: factionForceCursed, rollWithCursedDie: factionRollWithCursedDie, fields: Object.fromEntries([...FACTION_FIELDS, ...SOCIETY_FIELDS].map((field) => [field, factionDraft[field].trim()])) as Record<FactionField, string>, updatedAt: new Date().toISOString() }
				: makeCampaignFaction({ origin: factionOrigin, type: factionType, forceCursed: factionForceCursed, rollWithCursedDie: factionRollWithCursedDie, fields: factionDraft });
			if (!faction.fields.name) throw new Error('Enter a name for this faction.');
			if (saveCampaignFactions(putCampaignFaction(campaignFactions, faction))) showFactionEditor = false;
		} catch (error) { factionError = error instanceof Error ? error.message : 'Could not save this faction.'; }
	}

	function deleteFaction(faction: CampaignFaction) {
		if (confirm(`Delete “${faction.fields.name}” from this campaign?`)) saveCampaignFactions(removeCampaignFaction(campaignFactions, faction.id));
	}

	function factionJournalEntry(faction: CampaignFaction) {
		const populatedFields = Object.entries(faction.fields).filter(([, value]) => value.trim()).map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}: ${value}`).join(' · ');
		addTrackResolutionToJournal(`Faction — ${faction.fields.name} (${faction.type || 'untyped'}, ${faction.origin})${populatedFields ? ` — ${populatedFields}` : ''}`);
	}

	function saveCampaignLocations(next: CampaignLocation[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(locationStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignLocations = next;
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save campaign locations to browser storage.';
			return false;
		}
	}

	function fieldsForLocationOrigin(origin: LocationOrigin, type = 'Settlement'): LocationField[] {
		if (type === 'Waypoint') return ['settlementName', 'description', 'settlementLocation', 'firstLook', 'details', 'projects', 'aesthetics', ...(origin !== 'Ironsworn' ? ['theme' as const] : [])];
		if (type === 'Star') return ['settlementName', 'settlementType', 'description', 'details', 'projects', 'firstLook', 'theme'];
		if (type === 'Planet') return ['settlementType', 'settlementName', 'condition', 'population', 'aesthetics', 'firstLook', 'details', 'projects', 'settlementLocation', 'theme'];
		if (type === 'Starship') return ['settlementName', 'firstLook', 'initialContact', 'controllingFaction', 'settlementType', 'population', 'description', 'projects', 'details', 'theme'];
		if (type === 'Island') return ['settlementName', 'size', 'settlementType', 'condition', 'population', 'settlementLocation', 'aesthetics', 'firstLook', 'theme'];
		if (type === 'Ship') return ['settlementName', 'size', 'condition', 'firstLook', 'controllingFaction', 'aesthetics', 'projects', 'details', 'description', 'theme'];
		if (origin === 'Ironsworn') return ['settlementName', 'settlementLocation', 'settlementType', 'condition', 'population', 'aesthetics', 'description', 'firstLook', 'controllingFaction', 'disposition', 'authority', 'projects', 'culturalTouchstones', 'details', 'bond'];
		if (origin === 'Starforged') return ['settlementName', 'settlementLocation', 'population', 'aesthetics', 'description', 'firstLook', 'controllingFaction', 'initialContact', 'authority', 'projects', 'details', 'bond', 'theme'];
		return ['settlementName', 'settlementLocation', 'population', 'size', 'aesthetics', 'description', 'firstLook', 'controllingFaction', 'disposition', 'authority', 'focus', 'details', 'bond', 'theme'];
	}

	const locationFieldLabels: Record<LocationField, string> = {
		settlementName: 'Settlement name', settlementLocation: 'Settlement location', settlementType: 'Settlement type', condition: 'Condition', population: 'Population', size: 'Size',
		aesthetics: 'Aesthetics', description: 'Description', firstLook: 'First look', controllingFaction: 'Controlling faction', disposition: 'Disposition', initialContact: 'Initial contact',
		authority: 'Authority', projects: 'Projects', culturalTouchstones: 'Cultural touchstones', details: 'Details', bond: 'Bond', theme: 'Theme', focus: 'Focus', location: 'Location'
	};

	function locationFieldLabelFor(type: string, field: LocationField): string {
		if (type === 'Waypoint') {
			const m: Partial<Record<LocationField, string>> = { settlementName: 'Name', description: 'Description', settlementLocation: 'Waypoint', firstLook: 'Details', details: 'Peril', projects: 'Opportunity', aesthetics: 'Descriptor + focus', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		if (type === 'Star') {
			const m: Partial<Record<LocationField, string>> = { settlementName: 'Name', settlementType: 'Stellar object', description: 'Description', details: 'Spaceborne peril', projects: 'Spaceborne opportunity', firstLook: 'Descriptor + focus', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		if (type === 'Planet') {
			const m: Partial<Record<LocationField, string>> = { settlementType: 'Planet type', settlementName: 'Name', condition: 'Atmosphere', population: 'Life', aesthetics: 'Observed from space', firstLook: 'Planetside feature', details: 'Planetside peril', projects: 'Planetside opportunity', settlementLocation: 'Settlement', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		if (type === 'Starship') {
			const m: Partial<Record<LocationField, string>> = { settlementName: 'Name', firstLook: 'First look', initialContact: 'Initial contact', controllingFaction: 'Controlling faction', settlementType: 'Starship type', population: 'Fleet', description: 'History', projects: 'Mission', details: 'Cargo', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		if (type === 'Island') {
			const m: Partial<Record<LocationField, string>> = { settlementName: 'Name', size: 'Size', settlementType: 'Terrain', condition: 'Vitality', population: 'Visible habitation', settlementLocation: 'Nearby islands', aesthetics: 'Coastline aspects', firstLook: 'Offshore observations', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		if (type === 'Ship') {
			const m: Partial<Record<LocationField, string>> = { settlementName: 'Name', size: 'Size', condition: 'Initial status', firstLook: 'First look', controllingFaction: 'Controlling faction', aesthetics: 'Symbol', projects: 'Mission', details: 'Details', description: 'Cargo', theme: 'Theme' };
			return m[field] ?? locationFieldLabels[field];
		}
		return locationFieldLabels[field];
	}
	const locationTypes: Record<LocationOrigin, string[]> = {
		Ironsworn: ['Settlement', 'Waypoint'],
		Starforged: ['Settlement', 'Waypoint', 'Star', 'Planet', 'Starship'],
		'Sundered Isles': ['Settlement', 'Waypoint', 'Island', 'Ship']
	};
	const locationRegions: Record<LocationOrigin, string[]> = {
		Ironsworn: ['Settled Lands', 'Boundary Lands', 'Remote Lands'],
		Starforged: ['Terminus', 'Outlands', 'Expanse'],
		'Sundered Isles': ['Myriads', 'Margins', 'Reaches']
	};

	function rollLocationQuestInput(location: CampaignLocation) {
		const enabled = dataswornLibrary.records.filter((r) => dataswornLibrary.isEnabled(r.packId));
		locationQuestInputs = { ...locationQuestInputs, [location.id]: generateQuestPrompt(location.origin, enabled) };
	}

	function addLocationQuestItem(location: CampaignLocation) {
		const raw = (locationQuestInputs[location.id] ?? '').trim();
		if (!raw) return;
		const items = raw.split(',').map((s) => s.trim()).filter(Boolean).map((name) => ({ id: createId(), name }));
		saveCampaignLocations(updateCampaignLocation(campaignLocations, location.id, {
			quests: [...(location.quests ?? []), ...items]
		}));
		locationQuestInputs = { ...locationQuestInputs, [location.id]: '' };
	}

	function removeLocationQuestItem(location: CampaignLocation, questId: string) {
		saveCampaignLocations(updateCampaignLocation(campaignLocations, location.id, {
			quests: (location.quests ?? []).filter((q) => q.id !== questId)
		}));
	}

	function resetLocationDraft() {
		locationDraft = Object.fromEntries(LOCATION_FIELDS.map((field) => [field, ''])) as Record<LocationField, string>;
	}

	function openNewLocation() {
		generationMessage = '';
		editingLocationId = '';
		locationOrigin = activeCampaign?.setting === 'sundered-isles' ? 'Sundered Isles' : activeCampaign?.setting === 'starforged' ? 'Starforged' : 'Ironsworn';
		locationType = locationTypes[locationOrigin][0];
		locationRegion = locationRegions[locationOrigin][0];
		locationRollWithCursedDie = false;
		locationUseExtendedNames = false;
		resetLocationDraft();
		locationError = '';
		showLocationEditor = true;
	}

	function openEditLocation(location: CampaignLocation) {
		editingLocationId = location.id;
		locationOrigin = location.origin;
		// Earlier Ironvibes saves placed the region name in `type`; expose those records as
		// Settlement + region without altering their stored data until the user saves.
		const legacyRegion = locationRegions[location.origin].includes(location.type) && !location.region;
		locationType = legacyRegion ? 'Settlement' : location.type;
		locationRegion = legacyRegion ? location.type : location.region ?? locationRegions[location.origin][0];
		locationRollWithCursedDie = location.rollWithCursedDie;
		locationUseExtendedNames = location.useExtendedNames;
		locationDraft = { ...location.fields };
		locationError = '';
		showLocationEditor = true;
	}

	function saveLocation() {
		locationError = '';
		try {
			const previous = campaignLocations.find((location) => location.id === editingLocationId);
			const location = previous
				? { ...previous, origin: locationOrigin, type: locationType, region: locationRegion, rollWithCursedDie: locationRollWithCursedDie, useExtendedNames: locationUseExtendedNames, fields: Object.fromEntries(LOCATION_FIELDS.map((field) => [field, locationDraft[field].trim()])) as Record<LocationField, string>, updatedAt: new Date().toISOString() }
				: makeCampaignLocation({ origin: locationOrigin, type: locationType, region: locationRegion, rollWithCursedDie: locationRollWithCursedDie, useExtendedNames: locationUseExtendedNames, fields: locationDraft });
			if (!location.fields.settlementName) throw new Error('Enter a settlement or location name.');
			if (saveCampaignLocations(putCampaignLocation(campaignLocations, location))) {
				showLocationEditor = false;
				finishMapPlacement(location.id, 'location');
			}
		} catch (error) { locationError = error instanceof Error ? error.message : 'Could not save this location.'; }
	}

	function deleteLocation(location: CampaignLocation) {
		if (confirm(`Delete “${location.fields.settlementName}” from this campaign?`)) saveCampaignLocations(removeCampaignLocation(campaignLocations, location.id));
	}

	function locationJournalEntry(location: CampaignLocation) {
		const details = Object.entries(location.fields).filter(([, value]) => value.trim()).map(([key, value]) => `${locationFieldLabels[key as LocationField]}: ${value}`).join(' · ');
		addTrackResolutionToJournal(`Location — ${location.fields.settlementName} (${location.type}, ${location.origin})${details ? ` — ${details}` : ''}`);
	}

	function saveCampaignMaps(next: CampaignMap[], selectedId = activeMapId) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(mapStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignMaps = next;
			activeMapId = next.some((map) => map.id === selectedId) ? selectedId : next[0]?.id ?? '';
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save campaign maps to browser storage.';
			return false;
		}
	}

	function createMap() {
		mapError = '';
		try {
			const map = makeCampaignMap(mapNameDraft);
			if (saveCampaignMaps(putCampaignMap(campaignMaps, map), map.id)) {
				mapNameDraft = '';
				showMapCreator = false;
			}
		} catch (error) { mapError = error instanceof Error ? error.message : 'Could not create this map.'; }
	}

	function deleteActiveMap() {
		if (!activeMap || !confirm(`Delete “${activeMap.name}” from this campaign?`)) return;
		saveCampaignMaps(removeCampaignMap(campaignMaps, activeMap.id));
		selectedMapCell = '';
	}

	function onMapCellClick(key: string) {
		if (!activeMap) return;
		if (selectedMapTool === 'paint') {
			saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { cells: paintMapCell(activeMap, key, selectedMapPaint).cells }), activeMap.id);
			return;
		}
		const next = toggleMapPath(activeMap, key);
		saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { cells: next.cells }), activeMap.id);
	}
	function fillActiveMap(mode: 'unpainted' | 'all' | 'clear') {
		if (!activeMap) return;
		const next = fillMapPaint(activeMap, mode === 'clear' ? '' : selectedMapPaint, mode === 'unpainted' ? 'unpainted' : 'all');
		saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { cells: next.cells }), activeMap.id);
		showMapFill = false;
	}

	function openMapCellDetails(key: string) {
		if (!activeMap) return;
		selectedMapCell = key;
		const cell = activeMap.cells[key];
		mapCellNameDraft = cell?.name ?? '';
		mapCellNotesDraft = cell?.notes ?? '';
		mapCellRecordId = '';
	}

	function createMapCellRecord(kind: MapRecordKind, characterKind: RecordKind = 'npc') {
		if (!activeCampaign || !activeMap || !selectedMapCell) return;
		pendingMapPlacement = { campaignId: activeCampaign.id, mapId: activeMap.id, key: selectedMapCell, kind };
		selectedMapCell = '';
		if (kind === 'location') openNewLocation();
		else if (kind === 'site') openNewSite();
		else openNewRecord(characterKind);
	}

	function cancelMapRecordCreation(kind: MapRecordKind) {
		if (kind === 'location') showLocationEditor = false;
		else if (kind === 'site') showSiteEditor = false;
		else showRecordEditor = false;
		if (pendingMapPlacement?.kind === kind) {
			const placement = pendingMapPlacement;
			pendingMapPlacement = null;
			if (activeCampaign?.id === placement.campaignId && campaignMaps.some((map) => map.id === placement.mapId)) {
				activeMapId = placement.mapId;
				selectedMapCell = placement.key;
			}
		}
	}

	function finishMapPlacement(id: string, kind: MapRecordKind) {
		const placement = pendingMapPlacement;
		if (!placement || placement.kind !== kind) return;
		pendingMapPlacement = null;
		if (activeCampaign?.id !== placement.campaignId) return;
		const map = campaignMaps.find((item) => item.id === placement.mapId);
		if (!map) return;
		const next = assignMapRecord(map, placement.key, kind, id);
		if (saveCampaignMaps(updateCampaignMap(campaignMaps, map.id, { cells: next.cells }), map.id)) {
			mapRecordTab = kind;
			mapCellRecordId = '';
			mapOnlyUnassigned = false;
			selectedMapCell = placement.key;
		}
	}

	function saveMapCellDetails() {
		if (!activeMap || !selectedMapCell) return;
		const named = updateMapCell(activeMap, selectedMapCell, { name: mapCellNameDraft.trim(), notes: mapCellNotesDraft.trim() });
		const next = mapCellRecordId ? assignMapRecord(named, selectedMapCell, mapRecordTab, mapCellRecordId) : named;
		if (saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { cells: next.cells }), activeMap.id)) selectedMapCell = '';
	}

	function unassignMapRecord(key: string, kind: MapRecordKind, id: string) {
		if (!activeMap) return;
		saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { cells: removeMapRecord(activeMap, key, kind, id).cells }), activeMap.id);
	}

	function mapRecords(kind: MapRecordKind) {
		if (kind === 'location') return campaignLocations.map((location) => ({ id: location.id, name: location.fields.settlementName }));
		if (kind === 'site') return campaignSites.map((site) => ({ id: site.id, name: site.fields.name }));
		return campaignRecords.filter((record) => record.kind === 'hero' || record.kind === 'npc').map((record) => ({ id: record.id, name: record.fields.Name || record.kind }));
	}

	function mapCellRecordName(cell: CampaignMap['cells'][string], kind: MapRecordKind) {
		return (cell.assignments[kind] ?? []).map((id) => mapRecords(kind).find((record) => record.id === id)?.name ?? 'Missing campaign record').join(', ');
	}

	function handleMapBackgroundUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !activeMap) return;
		mapUploadError = '';
		if (!file.type.startsWith('image/')) {
			mapUploadError = 'Choose an image file for the map background.';
			input.value = '';
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string' && activeMap) saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { background: reader.result }), activeMap.id);
		};
		reader.onerror = () => { mapUploadError = 'Could not read this image file.'; };
		reader.readAsDataURL(file);
		input.value = '';
	}

	function handleMapDataUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		mapUploadError = '';
		file.text().then((serialized) => {
			let imported = parseCampaignMaps(serialized);
			let message = '';
			if (imported.length) {
				const parsed: unknown = JSON.parse(serialized);
				if (Array.isArray(parsed) && imported.length !== parsed.length) throw new Error('The map file contains invalid Ironvibes map entries. Nothing was imported.');
			}
			if (!imported.length) {
				const result = parsePocketforgeMap(serialized, {
					location: new Set(campaignLocations.map(({ id }) => id)),
					site: new Set(campaignSites.map(({ id }) => id)),
					character: new Set(campaignRecords.map(({ id }) => id))
				});
				imported = [result.map];
				message = ` Pocketforge map converted; ${result.omittedReferences} unmatched record reference${result.omittedReferences === 1 ? '' : 's'} omitted. Original map ID is not reused; faction influence cannot be transferred.`;
			}
			const now = new Date().toISOString();
			const copies = imported.map((map) => ({ ...map, id: createId(), createdAt: now, updatedAt: now }));
			if (saveCampaignMaps([...campaignMaps, ...copies], copies[0].id)) mapUploadError = `${copies.length} map${copies.length === 1 ? '' : 's'} imported.${message}`;
		}).catch((error) => { mapUploadError = error instanceof Error ? error.message : 'Could not import map data.'; });
		input.value = '';
	}

	function exportActiveMap() {
		if (!activeMap) return;
		const blob = new Blob([JSON.stringify(activeMap, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${activeMap.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'campaign-map'}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function deleteJournalNote(id: string) {
		if (!activeCampaign) return;
		const next = removeJournalEntry(journalEntries, id);
		try {
			localStorage.setItem(journalStorageKey(activeCampaign.id), JSON.stringify(next));
			journalEntries = next;
		} catch {
			storageError = 'Could not update the campaign journal.';
		}
	}

	function saveCampaignTracks(next: CampaignTrack[]) {
		if (!activeCampaign) return false;
		try {
			localStorage.setItem(trackStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTracks = next;
			storageError = '';
			return true;
		} catch {
			storageError = 'Could not save campaign tracks to browser storage.';
			return false;
		}
	}

	function openNewTrack() {
		editingTrackId = '';
		trackName = '';
		trackType = 'Progress';
		trackRank = 'Dangerous';
		trackThreat = false;
		trackThreatName = '';
		trackSteps = 6;
		trackError = '';
		showTrackEditor = true;
	}

	function rollTrackRankChoice() {
		trackRank = rollTrackRank();
	}

	function openEditTrack(track: CampaignTrack) {
		editingTrackId = track.id;
		trackName = track.name;
		trackType = track.type;
		trackRank = track.rank;
		trackThreat = track.threat;
		trackThreatName = track.threatName ?? '';
		trackSteps = clockSteps(track);
		trackError = '';
		showTrackEditor = true;
	}

	function saveTrack() {
		if (!activeCampaign) return;
		trackError = '';
		try {
			const next = editingTrackId
				? updateCampaignTrack(campaignTracks, editingTrackId, { name: trackName, type: trackType, rank: trackRank, threat: trackThreat, threatName: trackThreat ? trackThreatName : '', steps: trackSteps })
				: putCampaignTrack(campaignTracks, makeCampaignTrack({ name: trackName, type: trackType, rank: trackRank, threat: trackThreat, threatName: trackThreatName, steps: trackSteps }));
			if (saveCampaignTracks(next)) showTrackEditor = false;
		} catch (error) {
			trackError = error instanceof Error ? error.message : 'Could not save this track.';
		}
	}

	function addTrackResolutionToJournal(resolution: string) {
		if (!activeCampaign) return false;
		try {
			const nextEntries = appendJournalEntry(journalEntries, makeJournalEntry(resolution));
			localStorage.setItem(journalStorageKey(activeCampaign.id), JSON.stringify(nextEntries));
			journalEntries = nextEntries;
			storageError = '';
			return true;
		} catch {
			storageError = 'The resolution was rolled, but could not be added to the journal.';
			return false;
		}
	}

	function rollOracle(table = activeOracleTable) {
		if (!table) return;
		try {
			oracleResult = { table, result: rollOracleTable(table) };
			oracleTableId = table.id;
			oracleError = '';
		} catch (error) {
			oracleError = error instanceof Error ? error.message : 'Could not roll this oracle.';
		}
	}

	function addOracleResultToJournal() {
		if (!oracleResult) return;
		const question = oracleQuestion.trim();
		const text = `${question ? `Ask the Oracle — ${question}: ` : ''}${oracleResult.result.text}`;
		if (addTrackResolutionToJournal(text)) {
			oracleQuestion = '';
			storageError = '';
		}
	}

	function rollQuickAction() {
		try {
			actionRollResult = rollAction(quickRollStatValue, Number(quickRollAdds));
			actionRollError = '';
		} catch (error) {
			actionRollError = error instanceof Error ? error.message : 'Could not roll the action dice.';
		}
	}

	function openMoveRoll(move: DataswornRecord) {
		activeMoveRoll = move;
		moveRollResult = null;
		actionRollError = '';
		const possibleStats = actionMoveStats(move);
		if (possibleStats.length && !possibleStats.some((stat) => stat === quickRollStat)) {
			const first = possibleStats[0];
			if (first === 'edge' || first === 'heart' || first === 'iron' || first === 'shadow' || first === 'wits') quickRollStat = first;
		}
	}

	function rollSelectedMove() {
		if (!activeMoveRoll) return;
		try {
			moveRollResult = rollAction(quickRollStatValue, Number(quickRollAdds));
			actionRollError = '';
		} catch (error) {
			actionRollError = error instanceof Error ? error.message : 'Could not roll this move.';
		}
	}

	function addMoveRollToJournal() {
		if (!activeMoveRoll || !moveRollResult) return;
		const outcome = moveOutcomeText(activeMoveRoll, moveRollResult.outcome);
		addTrackResolutionToJournal(`${activeMoveRoll.name} — ${moveRollResult.text}${outcome ? `\n${readableMoveText(outcome)}` : ''}`);
	}

	function addActionRollToJournal() {
		if (actionRollResult) addTrackResolutionToJournal(`${selectedQuickRollHero?.fields.Name ? `${selectedQuickRollHero.fields.Name} — ` : ''}${actionRollResult.text}`);
	}

	function rollGenericDice() {
		const count = Math.max(1, Math.min(20, Math.trunc(Number(diceRollCount) || 1)));
		const sides = Math.max(2, Math.min(1000, Math.trunc(Number(diceRollSides) || 2)));
		const values = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
		diceRollResult = `${count}d${sides}: ${values.join(' + ')} = ${values.reduce((total, value) => total + value, 0)}`;
	}

	function updateCampaignOption<K extends keyof CampaignOptions>(key: K, value: CampaignOptions[K]) {
		if (!activeCampaign) return;
		const nextOptions: Partial<CampaignOptions> = { ...(activeCampaign.options ?? {}), [key]: value };
		if (key === 'hasTreasury' && !value) nextOptions.hasLedger = false;
		const updated: Campaign = { ...activeCampaign, options: nextOptions, updatedAt: new Date().toISOString() };
		saveCampaigns(putCampaign(campaigns, updated), activeCampaign.id);
	}
	function setDrawerTab(tab: OracleRulesetTab) {
		drawerRulesetTab = tab;
		if (activeCampaign) updateCampaignOption('activeDrawerTab', tab);
	}
	function toggleDarkMode(next = !darkMode) {
		darkMode = next;
		try { localStorage.setItem('ironvibes.dark-mode', String(next)); } catch { /* ignore */ }
	}
	function setSwipeNav(enabled: boolean) {
		swipeNav = enabled;
		try { localStorage.setItem('ironvibes.swipe-nav', String(enabled)); } catch { /* ignore */ }
	}
	function setRememberCampaign(enabled: boolean) {
		rememberCampaign = enabled;
		try { localStorage.setItem('ironvibes.remember-campaign', String(enabled)); } catch { /* ignore */ }
	}
	function triggerPayThePrice() {
		try {
			const enabledRecords = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
			const rolled = rollPayThePrice(drawerRulesetTab, enabledRecords);
			payThePriceText = rolled.text;
		} catch (error) {
			oracleError = error instanceof Error ? error.message : 'Could not roll Pay the Price.';
		}
	}
	function addPayThePriceToJournal() {
		if (!payThePriceText.trim()) return;
		addTrackResolutionToJournal(`Pay the Price: ${payThePriceText.trim()}.`);
		showBriefToast('Journal updated');
	}
	function triggerAskTheOracle(odds: AskTheOracleOdds) {
		try {
			const enabledRecords = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
			const result = rollAskTheOracle(odds, drawerRulesetTab, enabledRecords);
			askOracleOdds = odds;
			askOracleRoll = result.roll;
			askOracleText = result.answer;
			askOracleEvent = result.event?.text ?? '';
		} catch (error) {
			oracleError = error instanceof Error ? error.message : 'Could not roll Ask the Oracle.';
		}
	}
	function clearAskTheOracle() {
		askOracleRoll = 0;
		askOracleText = '';
		askOracleEvent = '';
	}
	function addAskTheOracleToJournal() {
		if (!askOracleText.trim()) return;
		const line = askOracleRoll
			? `Ask the Oracle (${askOracleOdds}): ${askOracleRoll}, ${askOracleText.trim()}.${askOracleEvent ? ` Event: ${askOracleEvent}.` : ''}`
			: `Ask the Oracle: ${askOracleText.trim()}.`;
		addTrackResolutionToJournal(line);
		showBriefToast('Journal updated');
	}
	function rollInlineOracle(table: OracleTable) {
		try {
			const rolled = rollOracleTable(table);
			const cleaned = rolled.row.text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
			oracleInlineValues = { ...oracleInlineValues, [table.id]: cleaned };
		} catch (error) {
			oracleError = error instanceof Error ? error.message : 'Could not roll oracle table.';
		}
	}
	function setInlineOracleValue(tableId: string, value: string) {
		oracleInlineValues = { ...oracleInlineValues, [tableId]: value };
	}
	function addInlineOracleToJournal(name: string, value: string) {
		if (!value.trim()) return;
		addTrackResolutionToJournal(`${name}: ${value.trim()}.`);
		showBriefToast('Journal updated');
	}
	function toggleMoveExpanded(id: string, isOpen: boolean) {
		expandedMoveIds = isOpen ? [...new Set([...expandedMoveIds, id])] : expandedMoveIds.filter((item) => item !== id);
	}
	function toggleOracleCatExpanded(id: string, isOpen: boolean) {
		expandedOracleCats = isOpen ? [...new Set([...expandedOracleCats, id])] : expandedOracleCats.filter((item) => item !== id);
	}
	function rollBottomCursedDie() {
		cursedDieResult = Math.floor(Math.random() * 10) + 1;
		const text = cursedDieResult === 10 ? `Cursed die: ${cursedDieResult}. Cursed!` : `Cursed die: ${cursedDieResult}.`;
		if (bottomJournalRolls) addTrackResolutionToJournal(text);
	}
	function rollBottomDie(sides: number) {
		bottomDie = sides;
		bottomResult = `D${sides}: ${Math.floor(Math.random() * sides) + 1}`;
		showBottomDiceMenu = false;
		if (bottomJournalRolls) addTrackResolutionToJournal(bottomResult);
	}
	function setJournalRolls(enabled: boolean) {
		bottomJournalRolls = enabled;
		try { localStorage.setItem('ironvibes.journal-rolls', String(enabled)); } catch { /* rolls still work without storage */ }
	}
	function computeBottomMatchEvent(challengeDice: [number, number]) {
		if (challengeDice[0] !== challengeDice[1]) {
			bottomMatchEvent = '';
			return;
		}
		const enabledRecords = dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId));
		const tab: OracleRulesetTab = activeCampaign?.setting === 'starforged' ? 'starforged' : activeCampaign?.setting === 'sundered-isles' ? 'isles' : 'ironsworn';
		bottomMatchEvent = rollMatchEvent(tab, enabledRecords)?.text ?? '';
	}
	function rollBottomAction() {
		try {
			const heroMomentum = bottomHero?.stats.momentum;
			const action = rollAction(Number(bottomStatValue), Number(bottomAdds), Math.random, heroMomentum);
			const locked = Number(bottomLock);
			bottomAction = locked ? resolveActionRoll(locked, action.stat, action.adds, action.challengeDice, heroMomentum) : action;
			computeBottomMatchEvent(bottomAction.challengeDice);
			bottomResultHeroId = bottomHero?.id ?? '';
			bottomRollError = '';
			if (bottomJournalRolls) addTrackResolutionToJournal(`${bottomHero?.fields.Name ? `${bottomHero.fields.Name} — ` : ''}${bottomAction.text}${bottomMatchEvent ? ` Match event: ${bottomMatchEvent}.` : ''}`);
			bottomAdds = 0;
		} catch (error) { bottomRollError = error instanceof Error ? error.message : 'Could not roll the action dice.'; }
	}
	function rerollBottomDie(which: 'action' | 0 | 1) {
		if (!bottomAction) return;
		const die = (sides: number) => Math.floor(Math.random() * sides) + 1;
		const actionDie = which === 'action' && !Number(bottomLock) ? die(6) : bottomAction.actionDie;
		const challengeDice: [number, number] = [...bottomAction.challengeDice];
		if (which !== 'action') challengeDice[which] = die(10);
		bottomAction = resolveActionRoll(actionDie, bottomAction.stat, bottomAction.adds, challengeDice, bottomHero?.stats.momentum);
		if (which !== 'action') computeBottomMatchEvent(bottomAction.challengeDice);
		if (bottomJournalRolls) addTrackResolutionToJournal(`Reroll. ${bottomAction.text}${bottomMatchEvent ? ` Match event: ${bottomMatchEvent}.` : ''}`);
	}
	function burnBottomMomentum() {
		if (!bottomHero || bottomHero.id !== bottomResultHeroId || !bottomAction || bottomHero.stats.momentum <= bottomAction.total) return;
		const momentum = bottomHero.stats.momentum;
		const burned = burnActionMomentum(bottomAction, momentum);
		if (saveCampaignRecords(campaignRecords.map((record) => record.id === bottomHero.id ? { ...record, stats: { ...record.stats, momentum: 2 }, updatedAt: new Date().toISOString() } : record))) {
			bottomAction = burned;
			if (bottomJournalRolls) addTrackResolutionToJournal(burned.text);
		}
	}

	function mappedGeneration(kind: 'character' | 'location' | 'faction', origin: GenerationSetting, field: string, locationType = 'Settlement') {
		try {
			const value = generateRecordField(kind, origin, field, dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId)), {
				locationType,
				cursed: kind === 'faction' ? factionForceCursed || factionRollWithCursedDie : kind === 'location' ? locationRollWithCursedDie : recordRollWithCursedDie,
				region: locationRegion,
				planetClass: locationDraft.settlementType
			});
			generationMessage = '';
			return value;
		} catch (error) {
			generationMessage = error instanceof Error ? error.message : 'This table is unavailable.';
			return null;
		}
	}
	function rollRecordField(field: string) {
		const origin = recordDraft.Origin as GenerationSetting;
		const result = mappedGeneration('character', origin, field);
		if (result !== null) recordDraft = { ...recordDraft, [field]: result };
	}
	function rollRecordDefaults() {
		const origin = recordDraft.Origin as GenerationSetting;
		const next = { ...recordDraft };
		for (const field of Object.keys(generationFields('character', origin))) {
			if ((field === 'Disposition' && recordKind === 'hero') || (field === 'Backstory' && recordKind === 'npc') || (field === 'Inciting incident' && recordKind === 'npc')) continue;
			const value = mappedGeneration('character', origin, field);
			if (value !== null) next[field] = value;
		}
		recordDraft = next;
		if (recordKind === 'hero') {
			useLifeEvents = true;
			rollRecordLifeEvents();
		}
		generationMessage = '';
	}
	function rollLocationField(field: LocationField) {
		const value = mappedGeneration('location', locationOrigin, field, locationType);
		if (value !== null) locationDraft = { ...locationDraft, [field]: value };
	}
	function rollLocationDefaults() {
		const next = { ...locationDraft };
		for (const field of fieldsForLocationOrigin(locationOrigin, locationType)) {
			if (field === 'bond' || field === 'location') continue;
			const value = mappedGeneration('location', locationOrigin, field, locationType);
			if (value !== null) next[field] = value;
		}
		locationDraft = next;
		generationMessage = '';
	}
	function rollFactionField(field: FactionField | 'type') {
		const value = mappedGeneration('faction', factionOrigin, field);
		if (value !== null) {
			if (field === 'type') factionType = value;
			else factionDraft = { ...factionDraft, [field]: value };
		}
	}
	function rollFactionDefaults() {
		try {
			const fields = generateFactionFields(factionOrigin, dataswornLibrary.records.filter((record) => dataswornLibrary.isEnabled(record.packId)), { cursed: factionForceCursed || factionRollWithCursedDie });
			factionType = fields.type;
			const { type: _type, ...generated } = fields;
			factionDraft = { ...factionDraft, ...generated };
			generationMessage = '';
		} catch (error) { generationMessage = error instanceof Error ? error.message : 'Faction tables unavailable.'; }
	}

	function addGenericRollToJournal() {
		if (diceRollResult) addTrackResolutionToJournal(diceRollResult);
	}

	function selectInlineTruthOption(record: DataswornRecord, optionId: string) {
		const options = extractTruthCardOptions(record);
		const option = options.find((item) => item.id === optionId);
		if (!option) return;
		truthSelectedOptions = { ...truthSelectedOptions, [record.name]: option.id };
		truthSelectedSuboptions = { ...truthSelectedSuboptions, [record.name]: '' };
		const combined = formatTruthSelectionText(option, null);
		saveTruthSelection(record, combined, option.id, option.description);
	}

	function rollInlineTruthOption(record: DataswornRecord) {
		const options = extractTruthCardOptions(record);
		const rolled = rollTruthOption(options);
		if (!rolled) return;
		truthSelectedOptions = { ...truthSelectedOptions, [record.name]: rolled.option.id };
		truthSelectedSuboptions = { ...truthSelectedSuboptions, [record.name]: '' };
		const combined = formatTruthSelectionText(rolled.option, null);
		saveTruthSelection(record, combined, rolled.option.id, rolled.option.description);
	}

	function selectInlineTruthSuboption(record: DataswornRecord, option: TruthOptionItem, suboptionId: string) {
		const sub = option.suboptions.find((item) => item.id === suboptionId);
		if (!sub) return;
		truthSelectedSuboptions = { ...truthSelectedSuboptions, [record.name]: sub.id };
		const combined = formatTruthSelectionText(option, sub);
		saveTruthSelection(record, combined, option.id, option.description);
	}

	function rollInlineTruthSuboption(record: DataswornRecord, option: TruthOptionItem) {
		const rolled = rollTruthSuboption(option.suboptions);
		if (!rolled) return;
		truthSelectedSuboptions = { ...truthSelectedSuboptions, [record.name]: rolled.suboption.id };
		const combined = formatTruthSelectionText(option, rolled.suboption);
		saveTruthSelection(record, combined, option.id, option.description);
	}

	function updateInlineTruthText(category: string, record: DataswornRecord | undefined, text: string) {
		if (!activeCampaign) return;
		const trimmed = text.trim();
		const existing = campaignTruths.find((t) => t.category === category);
		if (!trimmed) {
			if (existing && !existing.custom) {
				const next = removeCampaignTruth(campaignTruths, existing.id);
				localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
				campaignTruths = next;
			}
			return;
		}
		if (record) {
			saveTruthSelection(record, trimmed, existing?.optionId ?? '', '');
		} else if (existing) {
			const next = saveCampaignTruth(campaignTruths, {
				recordId: existing.recordId,
				category: existing.category,
				value: trimmed,
				optionId: existing.optionId,
				optionDescription: '',
				sourceTitle: existing.sourceTitle,
				sourceUrl: existing.sourceUrl,
				custom: existing.custom
			}, existing.id);
			localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTruths = next;
		}
	}

	function openTruthCategory(category: string) {
		selectedTruthCategory = category;
		truthSearch = '';
		truthError = '';
		truthMessage = '';
		truthRollResult = '';
		const current = campaignTruths.find((truth) => truth.category === category);
		truthDraft = current?.value ?? '';
		truthDescriptionDraft = current?.optionDescription ?? '';
		truthOptionId = current?.optionId ?? '';
	}

	function saveTruthSelection(record: DataswornRecord, value: string, optionId: string, description: string) {
		if (!activeCampaign) return;
		try {
			const next = saveCampaignTruth(campaignTruths, {
				recordId: record.id, category: record.name, value, optionId, optionDescription: description,
				sourceTitle: record.sourceTitle, sourceUrl: record.sourceUrl, custom: false
			});
			localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTruths = next;
			truthDraft = value;
			truthDescriptionDraft = description;
			truthOptionId = optionId;
			truthError = '';
			truthMessage = `${record.name} saved to this campaign.`;
			storageError = '';
		} catch (error) {
			truthError = error instanceof Error ? error.message : 'Could not save this truth.';
		}
	}

	function saveCurrentTruth() {
		if (!activeCampaign || !selectedTruthCategory) return;
		const record = selectedTruthRecord;
		const current = campaignTruths.find((truth) => truth.category === selectedTruthCategory);
		try {
			const next = saveCampaignTruth(campaignTruths, {
				recordId: record?.id ?? current?.recordId ?? '', category: selectedTruthCategory, value: truthDraft,
				optionId: truthOptionId, optionDescription: truthDescriptionDraft,
				sourceTitle: record?.sourceTitle ?? current?.sourceTitle ?? '', sourceUrl: record?.sourceUrl ?? current?.sourceUrl ?? '',
				custom: current?.custom ?? !record
			}, editingTruthId || createId());
			localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTruths = next;
			truthError = '';
			truthMessage = `${selectedTruthCategory} saved to this campaign.`;
			showTruthEditor = false;
			storageError = '';
		} catch (error) {
			truthError = error instanceof Error ? error.message : 'Could not save this truth.';
		}
	}

	function openCustomTruth() {
		editingTruthId = '';
		selectedTruthCategory = '';
		truthDraft = '';
		truthDescriptionDraft = '';
		truthOptionId = '';
		truthError = '';
		truthMessage = '';
		showTruthEditor = true;
	}

	function openEditTruth(truth: CampaignTruth) {
		editingTruthId = truth.id;
		selectedTruthCategory = truth.category;
		truthDraft = truth.value;
		truthDescriptionDraft = truth.optionDescription;
		truthOptionId = truth.optionId;
		truthError = '';
		showTruthEditor = true;
	}

	function saveCustomTruth() {
		if (!activeCampaign) return;
		try {
			if (truthRecords.some((record) => record.name.toLocaleLowerCase() === selectedTruthCategory.trim().toLocaleLowerCase()) || campaignTruths.some((truth) => truth.custom && truth.id !== editingTruthId && truth.category.toLocaleLowerCase() === selectedTruthCategory.trim().toLocaleLowerCase())) {
				throw new Error('Choose a label that is not already used by a Datasworn truth category.');
			}
			const next = saveCampaignTruth(campaignTruths, {
				recordId: '', category: selectedTruthCategory, value: truthDraft, optionId: '', optionDescription: '',
				sourceTitle: '', sourceUrl: '', custom: true
			}, editingTruthId || createId());
			localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTruths = next;
			truthError = '';
			truthMessage = `${selectedTruthCategory} saved to this campaign.`;
			showTruthEditor = false;
			storageError = '';
		} catch (error) { truthError = error instanceof Error ? error.message : 'Could not save this custom truth.'; }
	}

	function deleteTruth(truth: CampaignTruth) {
		if (!activeCampaign || !confirm(`Remove “${truth.category}” from this campaign?`)) return;
		try {
			const next = removeCampaignTruth(campaignTruths, truth.id);
			localStorage.setItem(truthStorageKey(activeCampaign.id), JSON.stringify(next));
			campaignTruths = next;
			truthMessage = `${truth.category} removed from this campaign.`;
			storageError = '';
		} catch { storageError = 'Could not remove this campaign truth.'; }
	}

	function addTruthToJournal(truth: CampaignTruth) {
		addTrackResolutionToJournal(`Truth — ${truth.category}: ${truth.value}`);
	}

	function resolveTrack(track: CampaignTrack) {
		const resolution = track.type === 'Clock' ? `${track.name} ${track.progress === clockSteps(track) ? 'completed' : 'stopped'}.` : rollTrackResolution(track);
		const resolved = track.type === 'Clock' ? resolveTrackClock(campaignTracks, track.id) : resolveCampaignTrack(campaignTracks, track.id, resolution);
		if (!saveCampaignTracks(resolved)) return;
		resolutionRoll = resolution;
		resolvingTrackId = track.id;
		addTrackResolutionToJournal(resolution);
	}

	function rerollTrackResolution(track: CampaignTrack) {
		if (track.type === 'Clock' || track.resolution?.endsWith('forsaken.')) return;
		const resolution = rollTrackResolution(track);
		if (!saveCampaignTracks(resolveCampaignTrack(campaignTracks, track.id, resolution))) return;
		resolutionRoll = resolution;
		resolvingTrackId = track.id;
		addTrackResolutionToJournal(`${track.name} rerolled. ${resolution.replace(`${track.name} resolved. `, '')}`);
	}

	function resolveTrackManually(track: CampaignTrack, actionRoll: number, challengeOne: number, challengeTwo: number) {
		try {
			const resolution = buildTrackResolution(track, actionRoll, challengeOne, challengeTwo);
			if (!saveCampaignTracks(resolveCampaignTrack(campaignTracks, track.id, resolution))) return;
			resolutionRoll = resolution;
			resolvingTrackId = track.id;
			addTrackResolutionToJournal(resolution);
		} catch (error) {
			storageError = error instanceof Error ? error.message : 'Could not resolve this track.';
		}
	}

	function addTrackToJournal(track: CampaignTrack) {
		const text = `${track.name} — ${track.type} track${track.type !== 'Clock' ? ` (${track.rank}${track.threat ? ', Threat' : ''})` : ''}, progress ${track.type === 'Clock' ? track.progress : trackTicks(track) / 4}/${track.type === 'Clock' ? clockSteps(track) : trackProgressBoxes(track.rank)}.`;
		addTrackResolutionToJournal(text);
	}

	function forsakeTrack(track: CampaignTrack) {
		const next = forsakeCampaignTrack(campaignTracks, track.id);
		if (saveCampaignTracks(next)) addTrackResolutionToJournal(`${track.name} forsaken.`);
	}

	function reactivateTrack(track: CampaignTrack) {
		if (saveCampaignTracks(reopenCampaignTrack(campaignTracks, track.id))) {
			resolvingTrackId = '';
			resolutionRoll = '';
		}
	}

	function deleteTrack(track: CampaignTrack) {
		if (!confirm(`Delete “${track.name}” from this campaign?`)) return;
		if (saveCampaignTracks(removeCampaignTrack(campaignTracks, track.id)) && resolvingTrackId === track.id) resolvingTrackId = '';
	}
</script>

<svelte:head>
	<meta name="color-scheme" content="light" />
</svelte:head>

<main class="shell" class:dark-shell={darkMode} style:--theme-primary={appThemeColor} style="--parch-texture: url({staticAsset('art/textures/parchment.webp')})">
	<header class="site-header">
		<div class="site-toolbar">
			<div class="site-brand-row">
				<span class="campaign-duo-badge" title={activeCampaign ? `${settingNames[activeCampaign.setting]} · ${rulesetNames[activeCampaign.characterRuleset]} rules` : 'Ironvibes'}>
					<img src={activeCampaign?.setting === 'sundered-isles' ? staticAsset('art/icons/isles.webp') : activeCampaign?.setting === 'starforged' ? staticAsset('art/icons/starforged.webp') : staticAsset('art/icons/ironsworn.webp')} alt="" class="badge-emblem-img" />
				</span>
				<button class="campaign-title-btn" aria-label="Choose campaign" title="Switch or manage campaigns" onclick={() => (showCampaignPicker = true)}>
					<h1>{activeCampaign ? activeCampaign.name : 'Ironvibes'}</h1>
				</button>
			</div>
			<div class="header-actions">
				<button class="icon-button" aria-label="Create campaign" title="New campaign" onclick={openNewCampaign}><RpIcon name="plus" size={16} /></button>
				{#if activeCampaign}<button class="icon-button" aria-label="Campaign transfer" title="Export or import campaign" onclick={() => { campaignTransferError = ''; campaignTransferMessage = ''; showCampaignTransfer = true; }}><RpIcon name="convert" size={15} /></button>{/if}
				<details class="settings-dropdown" bind:open={showSettingsMenu}>
					<summary class="icon-button settings-gear" aria-label="Settings" title="Settings"><RpIcon name="settings" size={16} /></summary>
					{#if showSettingsMenu}<div class="app-settings-menu" role="menu" aria-label="App and campaign settings">
						<label class="settings-toggle-row"><span>Light mode</span><input type="checkbox" checked={!darkMode} onchange={(event) => toggleDarkMode(!event.currentTarget.checked)} /></label>
						{#if activeCampaign}
							<label class="settings-toggle-row"><span>Hold</span><input type="checkbox" checked={activeOptions.hasHold} onchange={(event) => updateCampaignOption('hasHold', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Treasury</span><input type="checkbox" checked={activeOptions.hasTreasury} onchange={(event) => updateCampaignOption('hasTreasury', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Ledger</span><input type="checkbox" checked={activeOptions.hasLedger} onchange={(event) => updateCampaignOption('hasLedger', event.currentTarget.checked)} /></label>
							{#if activeCampaign.setting !== 'sundered-isles'}
								<label class="settings-toggle-row"><span>Sundered Isles Roller</span><input type="checkbox" checked={activeOptions.hasSunderedRoller} onchange={(event) => updateCampaignOption('hasSunderedRoller', event.currentTarget.checked)} /></label>
							{/if}
							<label class="settings-toggle-row"><span>Vaults &amp; Vows assets</span><input type="checkbox" checked={activeOptions.isVaultsAndVows} onchange={(event) => updateCampaignOption('isVaultsAndVows', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Fe-Runners pack</span><input type="checkbox" checked={activeOptions.isFeRunners} onchange={(event) => updateCampaignOption('isFeRunners', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Ancient Wonders pack</span><input type="checkbox" checked={activeOptions.isAncientWonders} onchange={(event) => updateCampaignOption('isAncientWonders', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Ironsmith oracles</span><input type="checkbox" checked={activeOptions.isIronsmith} onchange={(event) => updateCampaignOption('isIronsmith', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Starsmith oracles</span><input type="checkbox" checked={activeOptions.isStarsmith} onchange={(event) => updateCampaignOption('isStarsmith', event.currentTarget.checked)} /></label>
							<label class="settings-toggle-row"><span>Spellforge oracles</span><input type="checkbox" checked={activeOptions.isSpellforge} onchange={(event) => updateCampaignOption('isSpellforge', event.currentTarget.checked)} /></label>
							<details class="settings-nav-options">
								<summary>Navigation options</summary>
								<div class="settings-nav-list">
									<label class="settings-toggle-row"><span>Factions</span><input type="checkbox" checked={activeOptions.hasActiveFactions} onchange={(event) => updateCampaignOption('hasActiveFactions', event.currentTarget.checked)} /></label>
									<label class="settings-toggle-row"><span>Maps</span><input type="checkbox" checked={activeOptions.hasActiveMaps} onchange={(event) => updateCampaignOption('hasActiveMaps', event.currentTarget.checked)} /></label>
									<label class="settings-toggle-row"><span>Truths</span><input type="checkbox" checked={activeOptions.hasActiveTruths} onchange={(event) => updateCampaignOption('hasActiveTruths', event.currentTarget.checked)} /></label>
									<label class="settings-toggle-row"><span>Custom assets</span><input type="checkbox" checked={activeOptions.hasActiveAssets} onchange={(event) => updateCampaignOption('hasActiveAssets', event.currentTarget.checked)} /></label>
									<label class="settings-toggle-row"><span>Custom themes &amp; domains</span><input type="checkbox" checked={activeOptions.hasActiveThemes} onchange={(event) => updateCampaignOption('hasActiveThemes', event.currentTarget.checked)} /></label>
								</div>
							</details>
							<button type="button" class="settings-action-btn" aria-label="Campaign settings" onclick={() => { showSettingsMenu = false; openEditCampaign(activeCampaign); }}><RpIcon name="edit" size={14} /> CAMPAIGN SETTINGS</button>
						{:else}
							<p class="settings-hint">Select campaign to show more options</p>
						{/if}
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; showAppThemeDialog = true; }}><RpIcon name="palette" size={14} /> APP THEME</button>
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; exportActiveCampaign(); }} disabled={!activeCampaign}><RpIcon name="import" size={14} /> DOWNLOAD CAMPAIGNS</button>
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; campaignTransferError = ''; campaignTransferMessage = ''; showCampaignTransfer = true; }}><RpIcon name="export" size={14} /> UPLOAD CAMPAIGNS</button>
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; downloadExportedData(); }}><RpIcon name="import" size={14} /> DOWNLOAD EXPORTED DATA</button>
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; document.getElementById('saved-data-upload-input')?.click(); }}><RpIcon name="export" size={14} /> UPLOAD EXPORTED DATA</button>
						<input id="saved-data-upload-input" class="visually-hidden" type="file" accept="application/json,.json" onchange={uploadExportedDataFile} />
						<button type="button" class="settings-action-btn" onclick={() => { showSettingsMenu = false; downloadJournalHtml(); }} disabled={!activeCampaign}><RpIcon name="journal" size={14} /> DOWNLOAD JOURNAL</button>
						<button type="button" class="settings-action-btn" onclick={() => navigateTo('Rules')}><RpIcon name="ledger" size={14} /> RULES LIBRARY</button>
						<label class="settings-toggle-row"><span>Add rolls to Journal</span><input type="checkbox" checked={bottomJournalRolls} onchange={(event) => setJournalRolls(event.currentTarget.checked)} /></label>
						<label class="settings-toggle-row"><span>Swipeable navigation</span><input type="checkbox" checked={swipeNav} onchange={(event) => setSwipeNav(event.currentTarget.checked)} /></label>
						<label class="settings-toggle-row"><span>Remember campaign</span><input type="checkbox" checked={rememberCampaign} onchange={(event) => setRememberCampaign(event.currentTarget.checked)} /></label>
					</div>{/if}
				</details>
				<button class="icon-button" aria-label="Open menu" title="Menu" onclick={() => (showAppMenu = true)}><RpIcon name="menu" size={16} /></button>
			</div>
		</div>
		{#if activeCampaign || activeArea === 'Rules'}
			<div class="nav-stripe">
				<button class="tabs-arrow" aria-label="Scroll tabs left" onclick={() => scrollNavTabs(-180)}>‹</button>
				<nav class="tabs" bind:this={navTabsEl} aria-label="Campaign view">
					{#each visibleNavAreas as area}
						<button class:tab-active={activeArea === area} onclick={() => navigateTo(area)}>{area.toUpperCase()}</button>
					{/each}
					<button class:tab-active={activeArea === 'Rules'} onclick={() => navigateTo('Rules')}>RULES LIBRARY</button>
				</nav>
				<button class="tabs-arrow" aria-label="Scroll tabs right" onclick={() => scrollNavTabs(180)}>›</button>
			</div>
		{/if}
	</header>

	<div class="workspace">
		<section class="main-pane" id="home">
			<div class="content">
				{#if activeArea === 'Rules'}
					<ContentLibrary />
				{:else if !activeCampaign}
					<section class="hero-card parchment" aria-labelledby="welcome-heading">
					<div class="hero-copy">
						<p class="eyebrow">A NEW KIND OF COMPANION</p>
						<h2 id="welcome-heading">Every great tale<br />begins with a vow.</h2>
						<p>Create a campaign to keep its setting, character rules, and story together on this device.</p>
						<button class="primary-button" onclick={openNewCampaign}>＋ &nbsp; Start a campaign</button>
					</div>
					<div class="hero-art" aria-hidden="true">
						<img src={staticAsset('art/scenes/first-vow.webp')} alt="" />
						<span class="art-caption">THE FIRST MILE</span>
					</div>
				</section>
					{#if campaigns.length}
						<div class="section-title"><div><p class="eyebrow">YOUR WORLDS</p><h2>Continue a campaign</h2></div><button class="text-action" onclick={() => (showCampaignPicker = true)}>View all →</button></div>
						<div class="campaign-list">
							{#each campaigns.slice(0, 3) as campaign (campaign.id)}
								<button class="campaign-card" onclick={() => selectCampaign(campaign.id)}><span class="campaign-card-mark">{settingNames[campaign.setting].slice(0, 1)}</span><span><strong>{campaign.name}</strong><small>{settingNames[campaign.setting]} · {rulesetNames[campaign.characterRuleset]} rules</small></span><b>›</b></button>
							{/each}
						</div>
					{:else}
						<div class="section-title"><div><p class="eyebrow">BUILT FOR YOUR TABLE</p><h2>Start with the story</h2></div><span class="ornament">✦</span></div>
						<div class="foundation-grid">
							{#each foundations as item, i}
								<article class="foundation-card"><span class="foundation-icon">{['◈', '⌘', '✧'][i]}</span><h3>{item.title}</h3><p>{item.text}</p></article>
							{/each}
						</div>
					{/if}
				{:else if activeArea === 'Campaign'}
					<section class="campaign-dashboard">
						<div class="dashboard-welcome"><div><p class="eyebrow">CAMPAIGN READY</p><h2>{activeCampaign.name}</h2><p>{settingNames[activeCampaign.setting]} setting with {rulesetNames[activeCampaign.characterRuleset]} character rules.</p></div><button class="secondary-button" onclick={() => openEditCampaign(activeCampaign)}>Edit campaign</button></div>
						<div class="section-title"><div><p class="eyebrow">YOUR STORY, YOUR RULES</p><h2>Make this world yours</h2></div><span class="ornament">✦</span></div>
						<div class="foundation-grid">{#each foundations as item, i}<article class="foundation-card"><span class="foundation-icon">{['◈', '⌘', '✧'][i]}</span><h3>{item.title}</h3><p>{item.text}</p></article>{/each}</div>
					</section>
				{:else if activeArea === 'Journal'}
					<section class="journal-workspace" aria-label="Campaign journal">
						{#if journalEntries.length}
							<div class="journal-entry-list">
								{#each journalEntries as entry, index (entry.id)}
									<details class="journal-entry-card" open={index === journalEntries.length - 1}>
										<summary class="journal-entry-header">
											<span class="journal-handle" title="Reorder note">⋮⋮</span>
											<span class="journal-entry-title">{journalEntryTitle(entry)}</span>
											<span class="journal-entry-controls">
												{#if journalEntries.length > 1}
													<button type="button" class="journal-icon-btn" aria-label="Move note up" title="Move up" disabled={index === 0} onclick={(event) => { event.preventDefault(); event.stopPropagation(); reorderJournalNote(entry.id, 'up'); }}><RpIcon name="up" size={14} /></button>
													<button type="button" class="journal-icon-btn" aria-label="Move note down" title="Move down" disabled={index === journalEntries.length - 1} onclick={(event) => { event.preventDefault(); event.stopPropagation(); reorderJournalNote(entry.id, 'down'); }}><RpIcon name="down" size={14} /></button>
												{/if}
												<button type="button" class="journal-icon-btn" aria-label="Edit journal note" title="Edit note" onclick={(event) => { event.preventDefault(); event.stopPropagation(); startEditJournalNote(entry); }}><RpIcon name="edit" size={14} /></button>
												<button type="button" class="journal-icon-btn" aria-label="Delete journal note" title="Delete note" onclick={(event) => { event.preventDefault(); event.stopPropagation(); deleteJournalNote(entry.id); }}><RpIcon name="delete" size={14} /></button>
											</span>
										</summary>
										<div class="journal-entry-body">
											<time datetime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
											<p>{entry.text}</p>
										</div>
									</details>
								{/each}
							</div>
						{/if}

						<form class="journal-editor-form" onsubmit={addJournalNote}>
							<div class="journal-editor-box">
								<div class="journal-editor-toolbar" role="toolbar" aria-label="Note formatting">
									<select class="editor-block-select" aria-label="Text block style" bind:value={journalBlockStyle} onchange={(event) => { const val = event.currentTarget.value; if (val === 'h1' || val === 'h2' || val === 'h3') applyJournalFormat(val); journalBlockStyle = 'p'; }}>
										<option value="p">Paragraph</option>
										<option value="h1">Heading 1</option>
										<option value="h2">Heading 2</option>
										<option value="h3">Heading 3</option>
									</select>
									<div class="editor-btn-group">
										<button type="button" class="editor-tool-btn" title="Bold" aria-label="Bold" onclick={() => applyJournalFormat('bold')}><b>B</b></button>
										<button type="button" class="editor-tool-btn" title="Italic" aria-label="Italic" onclick={() => applyJournalFormat('italic')}><i>I</i></button>
										<button type="button" class="editor-tool-btn" title="Bullet list" aria-label="Bullet list" onclick={() => applyJournalFormat('bullet')}>•≡</button>
										<button type="button" class="editor-tool-btn" title="Numbered list" aria-label="Numbered list" onclick={() => applyJournalFormat('number')}>1≡</button>
										<button type="button" class="editor-tool-btn" title="Blockquote" aria-label="Blockquote" onclick={() => applyJournalFormat('quote')}>❝</button>
										<button type="button" class="editor-tool-btn" title="Horizontal rule" aria-label="Horizontal rule" onclick={() => applyJournalFormat('hr')}>—</button>
										<button type="button" class="editor-tool-btn" title="Clear draft" aria-label="Clear draft" onclick={() => (journalDraft = '')}>↶</button>
									</div>
								</div>
								<textarea id="journal-note" aria-label="Journal note content" bind:value={journalDraft} placeholder="Write your story notes, or send oracle and move rolls here..." rows="5" maxlength="10000"></textarea>
							</div>
							<div class="journal-editor-actions">
								{#if editingJournalId}
									<button type="button" class="secondary-button" onclick={cancelEditJournalNote}>CANCEL</button>
									<button class="primary-button" type="submit" disabled={!journalDraft.trim()}>UPDATE NOTE</button>
								{:else}
									<button class="primary-button" type="submit" disabled={!journalDraft.trim()}>ADD NOTE</button>
								{/if}
							</div>
						</form>
					</section>
				{:else if (activeArea === 'Heroes' || activeArea === 'NPC') && activeCampaign}
					{@const kind: RecordKind = activeArea === 'Heroes' ? 'hero' : 'npc'}
					{@const records = campaignRecords.filter((record) => record.kind === kind)}
					<section class="records-workspace" aria-label={kind === 'hero' ? 'Campaign heroes' : 'Campaign NPCs'}>
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={() => openNewRecord(kind)}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" onclick={() => openSavedImportModal(kind)}><RpIcon name="import" size={14} /> IMPORT</button>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={records.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
								<input id={`${kind}-import`} class="visually-hidden" type="file" accept="application/json,.json" onchange={importRecordFile} />
								{#if kind === 'npc'}
									<details class="bar-filter-menu">
										<summary class="bar-btn" class:bar-btn-active={npcRoleFilter.length < 3}><RpIcon name="filter" size={14} /> FILTER</summary>
										<div class="bar-filter-popover">
											<label><input type="checkbox" checked={npcRoleFilter.includes('npc')} onchange={() => (npcRoleFilter = toggleFilterValue(npcRoleFilter, 'npc'))} /> NPCs</label>
											<label><input type="checkbox" checked={npcRoleFilter.includes('bond')} onchange={() => (npcRoleFilter = toggleFilterValue(npcRoleFilter, 'bond'))} /> Bonds</label>
											<label><input type="checkbox" checked={npcRoleFilter.includes('connection')} onchange={() => (npcRoleFilter = toggleFilterValue(npcRoleFilter, 'connection'))} /> Connections</label>
										</div>
									</details>
								{/if}
							</div>
							{#if kind === 'npc'}
								<div class="workspace-bar-right">
									<input type="search" class="bar-search" aria-label="Filter NPCs" bind:value={recordFilter} placeholder="Search" />
								</div>
							{:else if records.length > 1 || activeOptions.hasSharedSupplies || activeOptions.hasHold || activeOptions.hasTreasury || activeOptions.hasLedger}
								<div class="hero-shared-resources">
									{#if records.length > 1}
										<label class="shared-toggle"><input type="checkbox" checked={activeOptions.hasSharedSupplies} onchange={(event) => updateCampaignOption('hasSharedSupplies', event.currentTarget.checked)} /> Shared supplies</label>
									{/if}
									{#if activeOptions.hasSharedSupplies}
										<div class="shared-counter"><span>SUPPLIES</span><b>{activeOptions.sharedSupplies ?? 5}</b><button type="button" onclick={() => adjustCampaignResource('sharedSupplies', -1, 5)}>−</button><button type="button" onclick={() => adjustCampaignResource('sharedSupplies', 1, 5)}>＋</button></div>
									{/if}
									{#if activeOptions.hasHold}
										<div class="shared-counter"><span>HOLD</span><b>{activeOptions.hold ?? 0}</b><button type="button" onclick={() => adjustCampaignResource('hold', -1, 5)}>−</button><button type="button" onclick={() => adjustCampaignResource('hold', 1, 5)}>＋</button></div>
									{/if}
									{#if activeOptions.hasTreasury}
										<div class="shared-counter"><span>TREASURY</span><b>{activeOptions.treasury ?? 0}</b><button type="button" onclick={() => adjustCampaignResource('treasury', -1, 99)}>−</button><button type="button" onclick={() => adjustCampaignResource('treasury', 1, 99)}>＋</button></div>
									{/if}
									{#if activeOptions.hasLedger}
										<button type="button" class="bar-btn" onclick={() => (showLedgerDialog = true)}><RpIcon name="ledger" size={14} /> LEDGER</button>
									{/if}
								</div>
							{/if}
						</div>
						{#if visibleRecords.length === 0}<div class="empty-journal-card"><img src={kind === 'hero' ? staticAsset('art/icons/hero.webp') : staticAsset('art/icons/npc.webp')} alt="" class="empty-emblem" /><strong>{recordFilter ? 'No matching records' : `No ${kind === 'hero' ? 'heroes' : 'NPCs'} yet`}</strong><p>{recordFilter ? 'Try another name or field.' : `Add a ${kind === 'hero' ? 'hero' : 'non-player character'} to start filling this campaign.`}</p>{#if !recordFilter}<button class="secondary-button" onclick={() => openNewRecord(kind)}>Add {kind === 'hero' ? 'hero' : 'NPC'}</button>{/if}</div>
						{:else}<div class="record-list">
							{#each visibleRecords as record (record.id)}
								{@const isRecordExpanded = reorderMode || expandedRecordIds.includes(record.id)}
								<article class="record-card">
									<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
									<header class="record-heading" tabindex="0" aria-expanded={isRecordExpanded} aria-label={`${isRecordExpanded ? 'Collapse' : 'Expand'} ${record.fields.Name}`} onclick={() => toggleRecordExpanded(record.id)} onkeydown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); toggleRecordExpanded(record.id); } }}>
										<div class="record-title-cluster">
											<button type="button" class="record-portrait-frame" title="Change or upload portrait" aria-label={`Change portrait for ${record.fields.Name}`} onclick={(event) => { event.stopPropagation(); openPortraitPickerForRecord(record); }}>
												<img src={resolveRecordPortrait(record)} alt={record.fields.Name} class="record-portrait-img" />
												<span class="record-portrait-badge" aria-hidden="true"><RpIcon name="image" size={12} /></span>
											</button>
											<div>
												<h3>
													{record.fields.Name}{#if record.fields.Moniker} “{record.fields.Moniker}”{/if}{#if record.fields['Family name']} {record.fields['Family name']}{/if}
													{#if record.fields.Pronouns}<span class="record-pronouns">({record.fields.Pronouns})</span>{/if}
												</h3>
												<p>
													{record.fields.Origin || settingNames[activeCampaign.setting]}
													{#if record.fields.Role} · {record.fields.Role}{/if}
													{#if kind === 'npc' && record.fields['NPC Type']} · {record.fields['NPC Type']}{/if}
													{#if kind === 'npc' && (record.isBond || record.fields.Bond)} · <span class="badge-tag">Bond</span>{/if}
													{#if kind === 'npc' && record.isConnection} · <span class="badge-tag">Connection</span>{/if}
												</p>
											</div>
										</div>
										<div class="record-header-right">
											{#if kind === 'hero'}
												<button type="button" class="initiative-pill" class:in-control={record.initiative === 'in_control'} class:bad-spot={record.initiative === 'bad_spot'} onclick={(event) => { event.stopPropagation(); cycleHeroInitiative(record); }}>
													{#if activeCampaign.characterRuleset === 'ironsworn'}
														{record.initiative === 'in_control' ? '★ Initiative' : 'No Initiative'}
													{:else}
														{record.initiative === 'in_control' ? '★ In Control' : record.initiative === 'bad_spot' ? '⚠ In a Bad Spot' : 'Out of Combat'}
													{/if}
												</button>
											{/if}
											<button class="record-delete" aria-label={`Delete ${record.fields.Name}`} onclick={(event) => { event.stopPropagation(); deleteRecord(record); }}><RpIcon name="delete" size={16} /></button>
										</div>
									</header>
									{#if isRecordExpanded}
									<div class="card-action-strip">
										<button type="button" class="bar-btn" onclick={() => openEditRecord(record)}><RpIcon name="edit" size={14} /> EDIT</button>
										<button type="button" class="bar-btn" onclick={() => recordJournalEntry(record)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
										{#if reorderMode}
											<button type="button" class="bar-btn" onclick={() => saveCampaignRecords(moveCampaignRecord(campaignRecords, record.id, 'up'))}>↑ UP</button>
											<button type="button" class="bar-btn" onclick={() => saveCampaignRecords(moveCampaignRecord(campaignRecords, record.id, 'down'))}>↓ DOWN</button>
										{/if}
									</div>
									{#if kind === 'hero'}
										<div class="hero-momentum-strip">
											<div class="momentum-bar-head">
												<span class="momentum-bar-title">MOMENTUM <b>{record.stats.momentum >= 0 ? `+${record.stats.momentum}` : record.stats.momentum}</b></span>
												<div class="momentum-limits">
													<span>MAX <b>+{heroMomentumMax(record)}</b></span>
													<span>RESET <b>+{heroMomentumReset(record)}</b></span>
													<button type="button" class="burn-inline-btn" disabled={record.stats.momentum <= heroMomentumReset(record)} onclick={() => burnHeroCardMomentum(record)} title="Burn momentum">
														<img src={staticAsset('art/icons/burn_momentum.webp')} alt="" class="inline-emblem-xs" /> BURN
													</button>
												</div>
											</div>
											<div class="momentum-track-pills" role="group" aria-label="Momentum track">
												{#each [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10] as mval}
													<button type="button" class="mom-step" class:mom-active={record.stats.momentum === mval} disabled={mval > heroMomentumMax(record)} onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { stats: { ...record.stats, momentum: mval } }))}>{mval}</button>
												{/each}
											</div>
										</div>
										<div class="record-stat-row attributes">
											{#each [['Edge', 'edge'], ['Heart', 'heart'], ['Iron', 'iron'], ['Shadow', 'shadow'], ['Wits', 'wits']] as [label, stat]}
												<div class="hero-stat-box">
													<button type="button" class="hero-stat-roll-btn" title={`Roll +${label}`} onclick={() => rollHeroStatFromCard(record, stat as 'edge' | 'heart' | 'iron' | 'shadow' | 'wits')}>
														<small>{label.toUpperCase()}</small>
														<strong>{record.stats[stat as keyof typeof record.stats]}</strong>
														<span class="stat-roll-die" aria-hidden="true"><RpIcon name="roll" size={14} /></span>
													</button>
												</div>
											{/each}
										</div>
										<div class="record-stat-row">
											{#each [['Health', 'health'], ['Spirit', 'spirit'], ['Supply', 'supply']] as [label, stat]}
												<div class="record-stat">
													<small>{label.toUpperCase()}</small>
													<strong>{record.stats[stat as keyof typeof record.stats]}</strong>
													<span>
														<button aria-label={`Decrease ${label}`} onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { stats: { ...record.stats, [stat]: Math.max(0, record.stats[stat as keyof typeof record.stats] - 1) } }))}>−</button>
														<button aria-label={`Increase ${label}`} onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { stats: { ...record.stats, [stat]: Math.min(5, record.stats[stat as keyof typeof record.stats] + 1) } }))}>+</button>
													</span>
												</div>
											{/each}
										</div>

										<div class="hero-subpanels">
											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>Assets ({(record.heroAssets?.length ?? 0) + record.assets.length})</span></summary>
												<div class="hero-subpanel-body">
													<div class="card-action-strip">
														<button type="button" class="bar-btn" onclick={() => openHeroAssetsModal(record)}><RpIcon name="plus" size={14} /> ADD ASSETS</button>
													</div>
													{#if record.heroAssets?.length}
														<div class="asset-grid">
															{#each record.heroAssets as hAsset (hAsset.id)}
																<article class="asset-card pocket-asset-card">
																	<header class="record-heading">
																		<h3>{hAsset.name}</h3>
																		<button type="button" class="record-delete" aria-label={`Remove ${hAsset.name}`} onclick={() => removeHeroCardAsset(record, hAsset.id)}><RpIcon name="delete" size={15} /></button>
																	</header>
																	<div class="asset-type-banner">{(hAsset.category || 'ASSET').toUpperCase()}</div>
																	<div class="asset-card-body">
																		{#if hAsset.fieldLabel}
																			<label class="asset-inline-field"><span>{hAsset.fieldLabel}</span><input value={hAsset.fieldValue} onchange={(event) => updateHeroCardAsset(record, hAsset.id, { fieldValue: event.currentTarget.value })} /></label>
																		{/if}
																		{#if hAsset.description}<p class="asset-description">{readableMoveText(hAsset.description)}</p>{/if}
																		<div class="asset-abilities">
																			{#each hAsset.abilities as ability, idx}
																				<label class="asset-ability">
																					<input type="checkbox" checked={ability.enabled} onchange={(event) => updateHeroCardAsset(record, hAsset.id, { abilities: hAsset.abilities.map((it, i) => i === idx ? { ...it, enabled: event.currentTarget.checked } : it) })} />
																					<span>{readableMoveText(ability.text) || `Tier ${idx + 1}`}</span>
																				</label>
																			{/each}
																		</div>
																		{#if hAsset.trackMax}
																			<label class="asset-track-row">{hAsset.trackLabel || 'Track'} {hAsset.trackValue} / {hAsset.trackMax}<input type="range" min="0" max={hAsset.trackMax} value={hAsset.trackValue} oninput={(event) => updateHeroCardAsset(record, hAsset.id, { trackValue: Number(event.currentTarget.value) })} /></label>
																		{/if}
																	</div>
																</article>
															{/each}
														</div>
													{/if}
													{#if record.assets.length}
														<div class="record-chip-groups"><p><strong>Listed assets</strong>{#each record.assets as item}<span>{item}</span>{/each}</p></div>
													{/if}
												</div>
											</details>

											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>Legacy &amp; Vows</span></summary>
												<div class="hero-subpanel-body">
													<div class="exp-counters-row">
														<div class="shared-counter"><span>EXPERIENCE</span><b>{record.experience ?? 0}</b><button type="button" onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { experience: Math.max(0, (record.experience ?? 0) - 1) }))}>−</button><button type="button" onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { experience: (record.experience ?? 0) + 1 }))}>＋</button></div>
														<div class="shared-counter"><span>SPENT EXP</span><b>{record.spentExperience ?? 0}</b><button type="button" onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { spentExperience: Math.max(0, (record.spentExperience ?? 0) - 1) }))}>−</button><button type="button" onclick={() => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { spentExperience: Math.min(record.experience ?? 99, (record.spentExperience ?? 0) + 1) }))}>＋</button></div>
													</div>
													{#each (activeCampaign.characterRuleset === 'starforged' ? [['Quests', 'quests'], ['Bonds', 'bonds'], ['Discoveries', 'discoveries']] : [['Bonds', 'bonds']]) as [legLabel, legKey]}
														{@const legTicks = record.legacyTracks?.[legKey as 'quests' | 'bonds' | 'discoveries'] ?? 0}
														<div class="legacy-track-row">
															<div class="track-progress-label"><strong>{legLabel}:</strong> <span>{Math.floor(legTicks / 4)}/10</span></div>
															<div class="track-boxes">
																<button type="button" class="progress-step" disabled={legTicks <= 0} onclick={() => markHeroLegacy(record, legKey as 'quests' | 'bonds' | 'discoveries', -1)}>−</button>
																{#each Array.from({ length: 10 }, (_, idx) => idx) as box}
																	<span class="progress-box"><RpIcon name="progress-box" size={22} ticks={Math.max(0, Math.min(4, legTicks - box * 4))} /></span>
																{/each}
																<button type="button" class="progress-step" disabled={legTicks >= 40} onclick={() => markHeroLegacy(record, legKey as 'quests' | 'bonds' | 'discoveries', 1)}>＋</button>
															</div>
														</div>
													{/each}
													<div class="card-action-strip">
														<button type="button" class="bar-btn" onclick={() => openHeroVowModal(record)}><RpIcon name="plus" size={14} /> ADD PERSONAL VOW</button>
													</div>
													{#if record.vows?.length}
														<div class="vow-list">
															{#each record.vows as vow (vow.id)}
																<div class="hero-vow-card">
																	<div class="track-card-heading">
																		<strong>{vow.name} <small>({vow.rank})</small></strong>
																		<div class="card-action-strip" style="margin:0">
																			{#if !vow.resolvedAt}<button type="button" class="bar-btn" onclick={() => resolveHeroVow(record, vow)}><RpIcon name="roll" size={13} /> RESOLVE</button>{/if}
																			<button type="button" class="record-delete" onclick={() => removeHeroVow(record, vow.id)}><RpIcon name="delete" size={14} /></button>
																		</div>
																	</div>
																	{#if vow.resolution}<p class="track-resolution">{vow.resolution}</p>{/if}
																	<div class="track-boxes">
																		<button type="button" class="progress-step" disabled={!!vow.resolvedAt || trackTicks(vow) === 0} onclick={() => markHeroVow(record, vow.id, -1)}>−</button>
																		{#each Array.from({ length: 10 }, (_, idx) => idx) as box}
																			<span class="progress-box"><RpIcon name="progress-box" size={22} ticks={Math.max(0, Math.min(4, trackTicks(vow) - box * 4))} /></span>
																		{/each}
																		<button type="button" class="progress-step" disabled={!!vow.resolvedAt || trackTicks(vow) >= TRACK_TICKS_MAX} onclick={() => markHeroVow(record, vow.id, 1)}>＋</button>
																	</div>
																</div>
															{/each}
														</div>
													{/if}
													{#if record.legacyAndVows.length}
														<div class="record-chip-groups"><p><strong>Notes &amp; Vows</strong>{#each record.legacyAndVows as item}<span>{item}</span>{/each}</p></div>
													{/if}
												</div>
											</details>

											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>{activeCampaign.characterRuleset === 'starforged' ? 'Impacts' : 'Debilities'} ({record.debilities.length})</span></summary>
												<div class="hero-subpanel-body">
													<div class="conditions-grid">
														{#each (activeCampaign.characterRuleset === 'starforged' ? STARFORGED_IMPACT_GROUPS : IRONSWORN_DEBILITY_GROUPS) as group}
															<div class="condition-group">
																<strong>{group.label}</strong>
																{#each group.items as cond}
																	<label class="condition-check"><input type="checkbox" checked={record.debilities.includes(cond)} onchange={() => toggleHeroCondition(record, cond)} /> <span>{cond}</span></label>
																{/each}
															</div>
														{/each}
														<div class="condition-group">
															<strong>Custom</strong>
															{#each record.customConditions ?? [] as ccond}
																<div class="custom-cond-row">
																	<label class="condition-check"><input type="checkbox" checked={record.debilities.includes(ccond)} onchange={() => toggleHeroCondition(record, ccond)} /> <span>{ccond}</span></label>
																	<button type="button" class="record-delete" onclick={() => removeHeroCustomCondition(record, ccond)}>×</button>
																</div>
															{/each}
															<div class="inline-add-row">
																<input type="text" placeholder={`Add ${activeCampaign.characterRuleset === 'starforged' ? 'impact' : 'debility'}...`} value={heroConditionDrafts[record.id] ?? ''} oninput={(event) => (heroConditionDrafts = { ...heroConditionDrafts, [record.id]: event.currentTarget.value })} />
																<button type="button" class="bar-btn" onclick={() => addHeroCustomCondition(record)}>＋</button>
															</div>
														</div>
													</div>
												</div>
											</details>

											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>Character details</span></summary>
												<div class="hero-subpanel-body">
													<div class="record-field-grid">
														{#each ['Pronouns', 'Species', 'First look', 'Description', 'Role', 'Trademark accessories', 'Trademark weapons', 'Backstory', 'Goal', 'Motivations', 'Inciting incident', 'Life events', 'Faction'] as field}
															{#if record.fields[field]}<p><strong>{field}</strong><span>{record.fields[field]}</span></p>{/if}
														{/each}
													</div>
													{#if record.characterDetails}<p class="mt-sm">{record.characterDetails}</p>{/if}
													<label class="inline-notes-label">Notes
														<textarea class="inline-notes-area" rows="3" value={record.notes} placeholder="Character notes..." onchange={(event) => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { notes: event.currentTarget.value }))}></textarea>
													</label>
													<div class="card-action-strip" style="margin:.6rem 0 0">
														<button type="button" class="bar-btn" onclick={() => exportRecord(record)}><RpIcon name="export" size={14} /> EXPORT</button>
														<button type="button" class="bar-btn" onclick={() => { if (confirm(`Convert ${record.fields.Name} to an NPC?`)) saveCampaignRecords(convertHeroToNpc(campaignRecords, record.id)); }}><RpIcon name="convert" size={14} /> CONVERT TO NPC</button>
													</div>
												</div>
											</details>
										</div>
									{:else}
										<div class="record-field-grid">
											{#each ['Description', 'Species', 'First look', 'Role', 'Trademark accessories', 'Trademark weapons', 'Goal', 'Activity', 'Disposition', 'Motivations', 'Bond', 'Environment', 'Scale', 'Basic form', 'Encountered behavior', 'Revealed aspect', 'Current location', 'Faction'] as field}
												{#if record.fields[field]}<p><strong>{field}</strong><span>{record.fields[field]}</span></p>{/if}
											{/each}
										</div>
										<div class="hero-subpanels">
											{#if record.isConnection || record.isBond || record.fields.Bond}
												<details class="hero-subpanel">
													<summary class="hero-subpanel-header"><span>Connection {record.isBond || record.fields.Bond ? '(Bonded)' : ''}</span></summary>
													<div class="hero-subpanel-body">
														<div class="track-card-meta">
															<span><strong>Rank:</strong> {record.connectionRank ?? 'Formidable'}</span>
															<span><strong>Progress:</strong> {Math.floor((record.connectionProgress ?? 0) / 4)}/10</span>
														</div>
														<div class="track-boxes">
															<button type="button" class="progress-step" disabled={(record.connectionProgress ?? 0) <= 0} onclick={() => markNpcConnection(record, -1)}>−</button>
															{#each Array.from({ length: 10 }, (_, idx) => idx) as box}
																<span class="progress-box"><RpIcon name="progress-box" size={22} ticks={Math.max(0, Math.min(4, (record.connectionProgress ?? 0) - box * 4))} /></span>
															{/each}
															<button type="button" class="progress-step" disabled={(record.connectionProgress ?? 0) >= 40} onclick={() => markNpcConnection(record, 1)}>＋</button>
														</div>
													</div>
												</details>
											{/if}
											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>Quests ({record.quests?.length ?? 0})</span></summary>
												<div class="hero-subpanel-body">
													<div class="oracle-input-roll">
														<label class="oracle-field">
															<span class="oracle-field-label">Type or generate a quest</span>
															<input type="text" value={npcQuestInputs[record.id] ?? ''} oninput={(event) => (npcQuestInputs = { ...npcQuestInputs, [record.id]: event.currentTarget.value })} placeholder="Split multiple quests with commas" />
														</label>
														<button type="button" class="oracle-icon-btn" title="Roll quest" onclick={() => rollNpcQuestInput(record)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" title="Add to Journal" disabled={!npcQuestInputs[record.id]?.trim()} onclick={() => addInlineOracleToJournal(`${record.fields.Name} Quest`, npcQuestInputs[record.id] ?? '')}><RpIcon name="journal" size={16} /></button>
														<button type="button" class="oracle-icon-btn" title="Add to list" disabled={!npcQuestInputs[record.id]?.trim()} onclick={() => addNpcQuestItem(record)}><RpIcon name="plus" size={16} /></button>
													</div>
													{#if record.quests?.length}
														<ul class="quest-bullet-list">
															{#each record.quests as q (q.id)}
																<li><span>{q.name}</span><button type="button" class="record-delete" onclick={() => removeNpcQuestItem(record, q.id)}>×</button></li>
															{/each}
														</ul>
													{/if}
												</div>
											</details>
											<details class="hero-subpanel">
												<summary class="hero-subpanel-header"><span>Notes</span></summary>
												<div class="hero-subpanel-body">
													<textarea class="inline-notes-area" rows="3" value={record.notes} placeholder="NPC notes..." onchange={(event) => saveCampaignRecords(updateCampaignRecord(campaignRecords, record.id, { notes: event.currentTarget.value }))}></textarea>
													<div class="card-action-strip" style="margin:.6rem 0 0">
														<button type="button" class="bar-btn" onclick={() => exportRecord(record)}><RpIcon name="export" size={14} /> EXPORT</button>
														<button type="button" class="bar-btn" onclick={() => { if (confirm(`Convert ${record.fields.Name} to a Hero?`)) saveCampaignRecords(convertNpcToHero(campaignRecords, record.id)); }}><RpIcon name="convert" size={14} /> CONVERT TO HERO</button>
													</div>
												</div>
											</details>
										</div>
									{/if}
									{/if}
								</article>
							{/each}
						</div>{/if}
						{#if recordError}<p class="notice" role="status">{recordError}</p>{/if}
					</section>
				{:else if activeArea === 'Locations' && activeCampaign}
					<section class="locations-workspace" aria-label="Campaign locations">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openNewLocation}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" onclick={() => openSavedImportModal('location')}><RpIcon name="import" size={14} /> IMPORT</button>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={campaignLocations.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
								<details class="bar-filter-menu">
									<summary class="bar-btn" class:bar-btn-active={locationTypeFilter.length < 7}><RpIcon name="filter" size={14} /> FILTER</summary>
									<div class="bar-filter-popover">
										{#each ['Settlement', 'Waypoint', 'Star', 'Planet', 'Starship', 'Ship', 'Island'] as ltype}
											<label><input type="checkbox" checked={locationTypeFilter.includes(ltype)} onchange={() => (locationTypeFilter = toggleFilterValue(locationTypeFilter, ltype))} /> {ltype}s</label>
										{/each}
									</div>
								</details>
							</div>
							<div class="workspace-bar-right">
								<input type="search" class="bar-search" aria-label="Filter locations" bind:value={locationFilter} placeholder="Search" />
							</div>
						</div>
						{#if visibleLocations.length === 0}<div class="empty-journal-card"><img src={staticAsset('art/icons/location.webp')} alt="" class="empty-emblem" /><strong>{locationFilter ? 'No matching locations' : 'No locations yet'}</strong><p>{locationFilter ? 'Try another name or field.' : 'Add a settlement or other place to this campaign.'}</p>{#if !locationFilter}<button class="secondary-button" onclick={openNewLocation}>Add location</button>{/if}</div>
						{:else}<div class="location-grid">{#each visibleLocations as location (location.id)}<article class="location-card"><header class="record-heading"><div class="record-title-cluster"><img src={staticAsset('art/icons/location.webp')} alt="" class="card-emblem-sm" /><div><p class="eyebrow">{location.origin.toUpperCase()} · {location.type.toUpperCase()}</p><h3>{location.fields.settlementName}</h3></div></div><button class="record-delete" aria-label={`Delete ${location.fields.settlementName}`} onclick={() => deleteLocation(location)}><RpIcon name="delete" size={16} /></button></header>
								<div class="card-action-strip">
									<button type="button" class="bar-btn" onclick={() => openEditLocation(location)}><RpIcon name="edit" size={14} /> EDIT</button>
									<button type="button" class="bar-btn" onclick={() => exportLocationToSaved(location)}><RpIcon name="export" size={14} /> EXPORT</button>
									<button type="button" class="bar-btn" onclick={() => locationJournalEntry(location)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
									{#if reorderMode}
										<button type="button" class="bar-btn" aria-label={`Move ${location.fields.settlementName} up`} onclick={() => saveCampaignLocations(moveCampaignLocation(campaignLocations, location.id, 'up'))}>↑ UP</button>
										<button type="button" class="bar-btn" aria-label={`Move ${location.fields.settlementName} down`} onclick={() => saveCampaignLocations(moveCampaignLocation(campaignLocations, location.id, 'down'))}>↓ DOWN</button>
									{/if}
								</div>
								{#if location.rollWithCursedDie || location.useExtendedNames}<div class="faction-flags">{#if location.rollWithCursedDie}<span>Cursed die</span>{/if}{#if location.useExtendedNames}<span>Extended names</span>{/if}</div>{/if}
								<div class="record-field-grid">{#each LOCATION_FIELDS as field}{#if location.fields[field] && field !== 'settlementName'}<p><strong>{locationFieldLabelFor(location.type, field)}</strong><span>{location.fields[field]}</span></p>{/if}{/each}</div>
								<div class="hero-subpanels">
									<details class="hero-subpanel" open={(location.quests?.length ?? 0) > 0}>
										<summary class="hero-subpanel-header"><span>{location.type === 'Settlement' ? 'Settlement troubles' : location.type === 'Ship' || location.type === 'Starship' ? 'Missions' : 'Quests'} ({location.quests?.length ?? 0})</span></summary>
										<div class="hero-subpanel-body">
											<div class="oracle-input-roll">
												<label class="oracle-field">
													<span class="oracle-field-label">Type or generate a quest</span>
													<input type="text" value={locationQuestInputs[location.id] ?? ''} oninput={(event) => (locationQuestInputs = { ...locationQuestInputs, [location.id]: event.currentTarget.value })} placeholder="Split multiple troubles/quests with commas" />
												</label>
												<button type="button" class="oracle-icon-btn" title="Roll trouble/quest" onclick={() => rollLocationQuestInput(location)}><RpIcon name="roll" size={16} /></button>
												<button type="button" class="oracle-icon-btn" title="Add to Journal" disabled={!locationQuestInputs[location.id]?.trim()} onclick={() => addInlineOracleToJournal(`${location.fields.settlementName} Trouble`, locationQuestInputs[location.id] ?? '')}><RpIcon name="journal" size={16} /></button>
												<button type="button" class="oracle-icon-btn" title="Add to list" disabled={!locationQuestInputs[location.id]?.trim()} onclick={() => addLocationQuestItem(location)}><RpIcon name="plus" size={16} /></button>
											</div>
											{#if location.quests?.length}
												<ul class="quest-bullet-list">
													{#each location.quests as q (q.id)}
														<li><span>{q.name}</span><button type="button" class="record-delete" onclick={() => removeLocationQuestItem(location, q.id)}>×</button></li>
													{/each}
												</ul>
											{/if}
										</div>
									</details>
									<details class="hero-subpanel" open={!!location.notes}>
										<summary class="hero-subpanel-header"><span>Notes</span></summary>
										<div class="hero-subpanel-body">
											<textarea class="inline-notes-area" rows="2" value={location.notes ?? ''} placeholder="Location notes..." onchange={(event) => saveCampaignLocations(updateCampaignLocation(campaignLocations, location.id, { notes: event.currentTarget.value }))}></textarea>
										</div>
									</details>
								</div>
							</article>{/each}</div>{/if}
						{#if locationError}<p class="notice error" role="alert">{locationError}</p>{/if}
					</section>
				{:else if activeArea === 'Themes & Domains' && activeCampaign}
					<section class="records-workspace" aria-label="Campaign themes and domains">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={() => openNewTheme()}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" onclick={() => openSavedImportModal('theme')}><RpIcon name="import" size={14} /> IMPORT</button>
							</div>
							<div class="workspace-bar-right">
								<input type="search" class="bar-search" aria-label="Filter themes and domains" bind:value={themeSearch} placeholder="Search" />
							</div>
						</div>
						{#if themeError}<p class="notice error" role="alert">{themeError}</p>{/if}
						{#if !visibleThemes.length}<div class="empty-journal-card"><img src={staticAsset('art/icons/site.webp')} alt="" class="empty-emblem" /><strong>{themeSearch ? 'No matching entries' : 'No custom themes or domains yet'}</strong><p>Create a campaign table, or browse imported Datasworn theme/domain records in the Rules library.</p></div>
						{:else}<div class="asset-grid">{#each visibleThemes as theme (theme.id)}<article class="asset-card"><header class="record-heading"><div class="record-title-cluster"><img src={staticAsset('art/icons/site.webp')} alt="" class="card-emblem-sm" /><div><p class="eyebrow">{theme.kind}</p><h3>{theme.name}</h3></div></div><button class="record-delete" aria-label={`Remove ${theme.name}`} onclick={() => { if (confirm(`Remove “${theme.name}” from this campaign?`)) saveThemes(campaignThemes.filter((item) => item.id !== theme.id)); }}><RpIcon name="delete" size={16} /></button></header>
							<div class="card-action-strip">
								<button type="button" class="bar-btn" onclick={() => { themeDraft = structuredClone(theme); themeError = ''; showThemeEditor = true; }}><RpIcon name="edit" size={14} /> EDIT</button>
								<button type="button" class="bar-btn" onclick={() => exportThemeToSaved(theme)}><RpIcon name="export" size={14} /> EXPORT</button>
								<button type="button" class="bar-btn" onclick={() => addTrackResolutionToJournal(`${theme.kind} · ${theme.name}\n${theme.description}`)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
							</div>
							{#if theme.description}<p class="asset-description">{theme.description}</p>{/if}
							{#each ['features','dangers','perils','opportunities'] as table}
								{#if theme[table as ThemeTable].some((row) => !!row.text)}
									<div class="theme-range-section">
										<h4>{table[0].toUpperCase() + table.slice(1)}</h4>
										<table class="theme-range-table">
											<tbody>
												{#each theme[table as ThemeTable].filter((row) => !!row.text) as row}
													<tr><td>{row.min} – {row.max}</td><td>{row.text}</td></tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/if}
							{/each}
							{#if theme.places.length}<p class="asset-description"><strong>Places:</strong> {theme.places.join(' · ')}</p>{/if}
						</article>{/each}</div>{/if}
					</section>
				{:else if activeArea === 'Assets' && activeCampaign}
					<section class="records-workspace" aria-label="Campaign assets">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openNewAsset}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" onclick={() => { assetImportSearch = ''; assetImportPackFilter = 'all'; showAssetImport = true; }}><RpIcon name="import" size={14} /> IMPORT FROM DATASWORN</button>
								<button type="button" class="bar-btn" onclick={() => openSavedImportModal('asset')}><RpIcon name="import" size={14} /> IMPORT SAVED</button>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={campaignAssets.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
							</div>
							<div class="workspace-bar-right">
								<input type="search" class="bar-search" aria-label="Filter assets" bind:value={assetSearch} placeholder="Search" />
							</div>
						</div>
						{#if assetError}<p class="notice error" role="alert">{assetError}</p>{/if}
						{#if !visibleAssets.length}<div class="empty-journal-card"><img src={staticAsset('art/icons/asset.webp')} alt="" class="empty-emblem" /><strong>{assetSearch ? 'No matching assets' : 'No assets yet'}</strong><p>Use a Datasworn asset from the Rules library, or author one for this campaign.</p></div>
						{:else}<div class="asset-grid">{#each visibleAssets as asset (asset.id)}<article class="asset-card pocket-asset-card">
							<header class="record-heading">
								<div class="record-title-cluster">
									<img src={staticAsset('art/icons/asset.webp')} alt="" class="card-emblem-sm" />
									<h3>{asset.name}</h3>
								</div>
								<button class="record-delete" aria-label={`Remove ${asset.name}`} onclick={() => { if (confirm(`Remove “${asset.name}” from this campaign?`)) saveAssets(campaignAssets.filter((item) => item.id !== asset.id)); }}><RpIcon name="delete" size={16} /></button>
							</header>
							<div class="card-action-strip">
								<button type="button" class="bar-btn" onclick={() => openEditAsset(asset)}><RpIcon name="edit" size={14} /> EDIT</button>
								<button type="button" class="bar-btn" onclick={() => exportAssetToSaved(asset)}><RpIcon name="export" size={14} /> EXPORT</button>
								<button type="button" class="bar-btn" onclick={() => addTrackResolutionToJournal(`${asset.name} · ${asset.category}\n${readableMoveText(asset.description)}\n${asset.abilities.filter((ability) => ability.enabled).map((ability) => readableMoveText(ability.text)).join('\n')}`)}><RpIcon name="journal" size={14} /> JOURNAL</button>
								{#if reorderMode}
									<button type="button" class="bar-btn" aria-label={`Move ${asset.name} up`} onclick={() => saveAssets(moveCampaignAsset(campaignAssets, asset.id, -1))}>↑</button>
									<button type="button" class="bar-btn" aria-label={`Move ${asset.name} down`} onclick={() => saveAssets(moveCampaignAsset(campaignAssets, asset.id, 1))}>↓</button>
								{/if}
							</div>
							<div class="asset-type-banner">{(asset.category || 'CUSTOM').toUpperCase()}</div>
							<div class="asset-card-body">
								<strong class="asset-uppercase-title">{asset.name.toUpperCase()}</strong>
								{#if asset.fieldLabel}<label class="asset-inline-field"><span>{asset.fieldLabel}</span><input aria-label={`${asset.name} ${asset.fieldLabel}`} value={asset.fieldValue} onchange={(event) => updateAsset(asset, { fieldValue: event.currentTarget.value })} /></label>{/if}
								{#if asset.secondaryFieldLabel}<label class="asset-inline-field"><span>{asset.secondaryFieldLabel}</span><input aria-label={`${asset.name} ${asset.secondaryFieldLabel}`} value={asset.secondaryFieldValue} onchange={(event) => updateAsset(asset, { secondaryFieldValue: event.currentTarget.value })} /></label>{/if}
								{#if asset.description}<p class="asset-description">{readableMoveText(asset.description)}</p>{/if}
								<div class="asset-abilities">{#each asset.abilities as ability, index}<label class="asset-ability"><input type="checkbox" aria-label={`${asset.name} tier ${index + 1}`} checked={ability.enabled} onchange={(event) => updateAsset(asset, { abilities: asset.abilities.map((item, i) => i === index ? { ...item, enabled: event.currentTarget.checked } : item) })} /><span>{readableMoveText(ability.text) || `Tier ${index + 1}`}</span></label>{/each}</div>
								{#if asset.trackMax}<label class="asset-track-row">{asset.trackLabel || 'Track'} {asset.trackValue} / {asset.trackMax}<input aria-label={`${asset.name} track`} type="range" min="0" max={asset.trackMax} value={asset.trackValue} oninput={(event) => updateAsset(asset, { trackValue: Number(event.currentTarget.value) })} /></label>{/if}
								{#if asset.controls?.length}<div class="asset-control-list">{#each asset.controls as control, index (control.key)}{#if control.kind === 'choice'}<label>{control.label}{#if control.ability >= 0}<small> · Tier {control.ability + 1}</small>{/if}<select aria-label={`${asset.name} ${control.label}`} value={control.value as string} onchange={(event) => updateAsset(asset, { controls: asset.controls?.map((item, i) => i === index ? { ...item, value: event.currentTarget.value } : item) })}><option value="">Choose</option>{#each control.choices as choice}<option value={choice.value}>{choice.label}</option>{/each}</select></label>{:else if control.kind === 'checkbox'}<label class="asset-ability"><input aria-label={`${asset.name} ${control.label}`} type="checkbox" checked={control.value as boolean} onchange={(event) => updateAsset(asset, { controls: asset.controls?.map((item, i) => i === index ? { ...item, value: event.currentTarget.checked } : item) })} />{control.label}</label>{:else}<label>{control.label}{#if control.ability >= 0}<small> · Tier {control.ability + 1}</small>{/if}<input aria-label={`${asset.name} ${control.label}`} value={control.value as string} onchange={(event) => updateAsset(asset, { controls: asset.controls?.map((item, i) => i === index ? { ...item, value: event.currentTarget.value } : item) })} /></label>{/if}{/each}</div>{/if}
								{#if asset.statuses.length}<p class="asset-description">Statuses: {asset.statuses.join(' · ')}</p>{/if}
							</div>
						</article>{/each}</div>{/if}
					</section>
				{:else if activeArea === 'Truths' && activeCampaign}
					<section class="truths-workspace" aria-label="Campaign truths">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openCustomTruth}><RpIcon name="plus" size={14} /> ADD CUSTOM TRUTH</button>
								<label class="bar-toggle-pill"><span>HIDE UNUSED</span><input type="checkbox" bind:checked={hideUnusedTruths} /></label>
								{#if dataswornLibrary.isEnabled('fe_runners')}
									<label class="bar-toggle-pill"><span>FE-RUNNERS TRUTHS</span><input type="checkbox" bind:checked={showFeRunnersTruths} /></label>
								{/if}
							</div>
						</div>
						{#if truthMessage}<p class="notice" role="status">{truthMessage}</p>{/if}
						{#if truthError}<p class="notice error" role="alert">{truthError}</p>{/if}
						{#if showTruthEditor}
							<section class="truth-editor" aria-label={editingTruthId ? 'Edit truth' : 'New truth'}>
								<div class="truth-chooser-heading"><div><p class="eyebrow">{editingTruthId ? 'EDIT CUSTOM TRUTH' : 'NEW TRUTH'}</p><h3>{editingTruthId ? 'Edit custom truth' : 'New custom truth'}</h3></div><button class="record-delete" aria-label="Cancel truth edit" onclick={() => { showTruthEditor = false; truthError = ''; }}>×</button></div>
								<label>Truth label<input aria-label="Truth label" bind:value={selectedTruthCategory} placeholder="Truth label" maxlength="120" /></label>
								<label>Description<textarea aria-label="Description" bind:value={truthDraft} placeholder="Describe what is true in this world" rows="4" maxlength="4000"></textarea></label>
								<div class="truth-card-actions"><button class="secondary-button" onclick={() => { showTruthEditor = false; truthError = ''; }}>Cancel</button><button class="primary-button" onclick={saveCustomTruth}>Save truth</button></div>
							</section>
						{/if}
						{#if !truthCategories.length}<div class="empty-journal-card"><img src={staticAsset('art/icons/truth.webp')} alt="" class="empty-emblem" /><strong>No enabled Datasworn truths</strong><p>Enable a setting-appropriate content pack in the Rules library, or create a custom truth for this campaign.</p><button class="secondary-button" onclick={() => (activeArea = 'Rules')}>Open Rules library</button></div>
						{:else}<div class="truth-category-grid">
							{#each visibleTruthCategories as category (category)}
								{@const saved = campaignTruths.find((truth) => truth.category === category)}
								{@const categoryRecord = truthRecords.find((record) => record.name === category)}
								{@const cardOptions = categoryRecord ? extractTruthCardOptions(categoryRecord) : []}
								{@const activeOptId = truthSelectedOptions[category] || saved?.optionId || ''}
								{@const activeOption = cardOptions.find((item) => item.id === activeOptId) ?? cardOptions.find((item) => saved?.value?.startsWith(item.label)) ?? null}
								{@const activeSubId = truthSelectedSuboptions[category] ?? ''}
								<article class="truth-category-card" class:truth-is-custom={saved?.custom} class:truth-is-saved={!!saved?.value}>
									<div class="truth-category-heading">
										<div class="record-title-cluster">
											<img src={staticAsset('art/icons/truth.webp')} alt="" class="card-emblem-sm" />
											<h3>{category}</h3>
										</div>
										<div class="truth-inline-actions">
											{#if !categoryRecord && saved}
												<button type="button" class="oracle-icon-btn" title="Edit custom truth" onclick={() => openEditTruth(saved)}><RpIcon name="edit" size={16} /></button>
												<button type="button" class="record-delete" aria-label={`Remove ${category}`} onclick={() => deleteTruth(saved)}><RpIcon name="delete" size={16} /></button>
											{/if}
											{#if saved?.value}
												<button type="button" class="oracle-icon-btn" title="Add to Journal" onclick={() => addTruthToJournal(saved)}><RpIcon name="journal" size={16} /></button>
											{/if}
										</div>
									</div>
									{#if categoryRecord && cardOptions.length}
										<div class="truth-inline-select-row">
											<label class="truth-select-field">
												<span class="truth-select-label">Choose, roll or customize</span>
												<select aria-label={`Choose ${category} option`} value={activeOption?.id ?? ''} onchange={(event) => selectInlineTruthOption(categoryRecord, event.currentTarget.value)}>
													<option value="">Choose an option or roll d100…</option>
													{#each cardOptions as opt (opt.id)}
														<option value={opt.id}>{opt.min}–{opt.max}: {opt.label}</option>
													{/each}
												</select>
											</label>
											<button type="button" class="oracle-icon-btn truth-roll-btn" aria-label={`Roll ${category}`} title={`Roll d100 on ${category}`} onclick={() => rollInlineTruthOption(categoryRecord)}><RpIcon name="roll" size={18} /></button>
										</div>
										{#if activeOption && activeOption.suboptions.length}
											<div class="truth-inline-select-row suboption-row">
												<label class="truth-select-field">
													<span class="truth-select-label">Sub-table · Choose, roll or customize</span>
													<select aria-label={`Choose ${category} sub-option`} value={activeSubId} onchange={(event) => selectInlineTruthSuboption(categoryRecord, activeOption, event.currentTarget.value)}>
														<option value="">Choose or roll sub-option…</option>
														{#each activeOption.suboptions as sub (sub.id)}
															<option value={sub.id}>{sub.min}–{sub.max}: {sub.label}</option>
														{/each}
													</select>
												</label>
												<button type="button" class="oracle-icon-btn truth-roll-btn" aria-label={`Roll ${category} sub-table`} title="Roll d100 on sub-table" onclick={() => rollInlineTruthSuboption(categoryRecord, activeOption)}><RpIcon name="roll" size={18} /></button>
											</div>
										{/if}
									{/if}
									<textarea
										class="truth-live-textarea"
										aria-label={`${category} description`}
										rows={saved?.value ? 4 : 2}
										placeholder="Choose or roll an option above, or write your custom truth here..."
										value={saved?.value ?? ''}
										onchange={(event) => updateInlineTruthText(category, categoryRecord, event.currentTarget.value)}
									></textarea>
								</article>
							{/each}
							{#if !visibleTruthCategories.length}<div class="empty-journal-card"><strong>No matching truths</strong><p>Uncheck “Hide unused” to see all setting truth categories.</p></div>{/if}
						</div>{/if}
					</section>
				{:else if activeArea === 'Oracles' && activeCampaign}
					<section class="oracle-workspace" aria-label="Campaign oracles">
						<div class="records-toolbar"><div><p class="eyebrow">DATASWORN TABLES · {settingNames[activeCampaign.setting].toUpperCase()}</p><h2>Oracles &amp; quick rolls</h2><p>Roll enabled Datasworn oracle tables from this campaign’s setting, including imported content. Results are shown with their source and are added to the Journal only when you choose.</p></div><button class="secondary-button" onclick={() => { activeArea = 'Rules'; }}>Browse library</button></div>
						<div class="oracle-workspace-grid">
							<div class="oracle-tool-card">
								<p class="eyebrow">ASK THE ORACLE</p><h3>Roll an oracle table</h3>
								<label>Find a table<input aria-label="Search oracle tables" bind:value={oracleSearch} placeholder="Search table name or pack" /></label>
								<label>Oracle table<select aria-label="Choose oracle table" value={activeOracleTable?.id ?? ''} onchange={(event) => { oracleTableId = event.currentTarget.value; oracleResult = null; }}><option value="" disabled>Choose a table</option>{#each filteredOracleTables as table (table.id)}<option value={table.id}>{table.name} · {table.dice} · {describeOracleTable(table)}</option>{/each}</select></label>
								{#if activeOracleTable}<p class="oracle-source">{activeOracleTable.description || activeOracleTable.sourceTitle}<br />Source: {activeOracleTable.sourceTitle}{activeOracleTable.sourceUrl ? ` · ${activeOracleTable.sourceUrl}` : ''}</p><button class="primary-button" onclick={() => rollOracle(activeOracleTable)}><RpIcon name="roll" size={14} /> Roll {activeOracleTable.dice}</button>{:else}<p class="oracle-source">No enabled oracle tables match this campaign. Enable a compatible pack or import Datasworn content in Rules library.</p>{/if}
								{#if oracleError}<p class="notice error" role="alert">{oracleError}</p>{/if}
								{#if oracleResult}<div class="oracle-result" aria-live="polite"><span class="oracle-roll-number">{oracleResult.result.value}</span><div><strong>{oracleResult.result.row.text}</strong><small>{oracleResult.table.name} · {oracleResult.table.dice} · {describeOracleTable(oracleResult.table)}</small></div></div><label>Question or context (optional)<input bind:value={oracleQuestion} placeholder="What are you asking?" maxlength="500" /></label><div class="oracle-result-actions"><button class="secondary-button" onclick={() => rollOracle(oracleResult?.table)}>Reroll</button><button class="primary-button" onclick={addOracleResultToJournal}>Add to Journal</button></div>{/if}
							</div>
							<div class="oracle-tool-card quick-oracle-list"><p class="eyebrow">QUICK ORACLES</p><h3>At a glance</h3>{#if quickOraclePicks.length}{#each quickOraclePicks as table (table.id)}<button class="oracle-quick-row" onclick={() => { oracleTableId = table.id; rollOracle(table); }}><span class="die-icon">{table.dice}</span><span><strong>{table.name}</strong><small>{describeOracleTable(table)}</small></span><b>Roll ↗</b></button>{/each}{:else}<p class="oracle-source">No quick oracle tables are enabled for this setting.</p>{/if}</div>
						</div>
						<div class="oracle-tool-card action-roll-card"><div><p class="eyebrow">QUICK ACTION ROLL</p><h3>Roll an action</h3></div><div class="action-roll-controls"><label>Hero<select bind:value={quickRollHeroId}><option value="">Use manual stat</option>{#each quickRollHeroes as hero (hero.id)}<option value={hero.id}>{hero.fields.Name}</option>{/each}</select></label><label>Stat<select bind:value={quickRollStat}><option value="edge">Edge</option><option value="heart">Heart</option><option value="iron">Iron</option><option value="shadow">Shadow</option><option value="wits">Wits</option></select></label><label>Stat value<input type="number" min="0" max="10" value={quickRollStatValue} onchange={(event) => { const value = Math.max(0, Math.min(10, Number(event.currentTarget.value) || 0)); const hero = selectedQuickRollHero; if (hero) saveCampaignRecords(updateCampaignRecord(campaignRecords, hero.id, { stats: { ...hero.stats, [quickRollStat]: value } })); else quickRollManualStat = value; }} /></label><label>Adds<input type="number" min="-10" max="10" bind:value={quickRollAdds} /></label><button class="primary-button" onclick={rollQuickAction}><RpIcon name="roll" size={14} /> Roll action</button></div>{#if actionRollError}<p class="notice error" role="alert">{actionRollError}</p>{/if}{#if actionRollResult}<div class="action-roll-result" aria-live="polite"><strong>{actionRollResult.outcome}</strong><p>Action die {actionRollResult.actionDie} + {actionRollResult.stat} + {actionRollResult.adds} = <b>{actionRollResult.total}</b></p><p>Challenge dice: {actionRollResult.challengeDice[0]} and {actionRollResult.challengeDice[1]} · {actionRollResult.hits} hit{actionRollResult.hits === 1 ? '' : 's'}</p><div><button class="secondary-button" onclick={rollQuickAction}>Reroll</button><button class="secondary-button" onclick={addActionRollToJournal}>Add to Journal</button></div></div>{/if}</div>
						<div class="oracle-tool-card generic-dice-card"><div><p class="eyebrow">DICE TRAY</p><h3>Roll custom dice</h3><p>Use for non-action checks, damage, or any other table-side roll.</p></div><div class="action-roll-controls"><label>Number of dice<input type="number" min="1" max="20" bind:value={diceRollCount} /></label><label>Die sides<input type="number" min="2" max="1000" bind:value={diceRollSides} /></label><button class="primary-button" onclick={rollGenericDice}><RpIcon name="roll" size={14} /> Roll dice</button></div>{#if diceRollResult}<div class="action-roll-result" aria-live="polite"><strong>{diceRollResult}</strong><div><button class="secondary-button" onclick={rollGenericDice}>Reroll</button><button class="secondary-button" onclick={addGenericRollToJournal}>Add to Journal</button></div></div>{/if}</div>
					</section>
				{:else if activeArea === 'Rules' && activeCampaign}
					<ContentLibrary />
				{:else if activeArea === 'Maps' && activeCampaign}
					{@const activeTileStyle = activeMap?.tileStyle ?? 'classic'}
					{@const activeGridShape = activeMap?.gridShape ?? 'square'}
					<section class="maps-workspace" aria-label="Campaign maps">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={() => { mapNameDraft = ''; mapError = ''; showMapCreator = true; }}><RpIcon name="plus" size={14} /> ADD MAP</button>
								<button type="button" class="bar-btn" onclick={() => document.getElementById('map-data-import')?.click()}><RpIcon name="export" size={14} /> UPLOAD MAP DATA</button>
								<input id="map-data-import" class="visually-hidden" type="file" accept="application/json,.json" onchange={handleMapDataUpload} />
							</div>
						</div>
						{#if mapUploadError}<p class="notice" role="status">{mapUploadError}</p>{/if}
						{#if !campaignMaps.length}<div class="empty-journal-card"><img src={staticAsset('art/icons/map.webp')} alt="" class="empty-emblem" /><strong>No maps yet</strong><p>Create a campaign map to place locations, sites, and characters.</p><button class="secondary-button" onclick={() => { mapNameDraft = ''; mapError = ''; showMapCreator = true; }}>Add map</button></div>
						{:else if activeMap}<div class="map-editor">
							<div class="map-heading">
								<div class="record-title-cluster">
									<img src={staticAsset('art/icons/map.webp')} alt="" class="card-emblem-sm" />
									<label>Map<select aria-label="Select campaign map" value={activeMap.id} onchange={(event) => { activeMapId = event.currentTarget.value; selectedMapCell = ''; }}>{#each campaignMaps as map (map.id)}<option value={map.id}>{map.name}</option>{/each}</select></label>
								</div>
								<div class="map-heading-actions">
									<button type="button" class="bar-btn" onclick={exportActiveMap} title="Export map data"><RpIcon name="export" size={14} /> EXPORT</button>
									<button type="button" class="record-delete" aria-label="Delete current map" title="Delete map" onclick={deleteActiveMap}><RpIcon name="delete" size={16} /></button>
								</div>
							</div>
							<div class="map-controls">
								<label class="map-name-toggle"><input type="checkbox" checked={activeMap.showNames} onchange={(event) => saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { showNames: event.currentTarget.checked }), activeMap.id)} /><span>Names</span></label>
								<div class="map-shape-group" role="group" aria-label="Map grid shape">
									<button type="button" class="bar-btn" class:bar-btn-active={activeGridShape === 'square'} aria-pressed={activeGridShape === 'square'} onclick={() => saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { gridShape: 'square' }), activeMap.id)}><RpIcon name="grid-square" size={14} /> SQUARES</button>
									<button type="button" class="bar-btn" class:bar-btn-active={activeGridShape === 'hex'} aria-pressed={activeGridShape === 'hex'} onclick={() => saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { gridShape: 'hex' }), activeMap.id)}><RpIcon name="grid-hex" size={14} /> HEXES</button>
								</div>
								<label class="map-style-select">
									<span>Style</span>
									<select aria-label="Map tile style" value={activeTileStyle} onchange={(event) => saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { tileStyle: event.currentTarget.value as MapTileStyle }), activeMap.id)}>
										<option value="classic">Classic Color</option>
										<option value="bw">Classic Ink</option>
										<option value="painted">Detailed Painted</option>
									</select>
								</label>
								<div class="map-tool-group">
									<button class:tool-selected={selectedMapTool === 'paint'} class="bar-btn" aria-pressed={selectedMapTool === 'paint'} onclick={() => (selectedMapTool = selectedMapTool === 'paint' ? 'select' : 'paint')}><RpIcon name="paint" size={14} /> PAINT</button>
									<button class:tool-selected={selectedMapTool === 'path'} class="bar-btn" aria-pressed={selectedMapTool === 'path'} onclick={() => (selectedMapTool = selectedMapTool === 'path' ? 'select' : 'path')}><RpIcon name="compass" size={14} /> PATH</button>
									{#if selectedMapTool !== 'select'}<button class="bar-btn" onclick={() => (selectedMapTool = 'select')}>SELECT</button>{/if}
								</div>
								{#if selectedMapTool === 'paint'}
									<div class="terrain-palette" role="group" aria-label="Map terrain">
										{#each MAP_TERRAIN_GROUPS as group}
											{#if group.choices.length === 1}
												{@const paint = group.choices[0].paint}{@const tile = mapPaintTile(paint, activeTileStyle)}
												<button class:selected={selectedMapPaint === paint} class="terrain-choice" aria-label={`Paint ${group.label.toLowerCase()}`} title={group.label} aria-pressed={selectedMapPaint === paint} onclick={() => { selectedMapPaint = paint; selectedMapTool = 'paint'; expandedTerrainGroup = ''; }} style:--terrain-image={tile.image} style:--terrain-size={tile.size} style:--terrain-x={tile.x} style:--terrain-y={tile.y}></button>
											{:else}
												{@const preview = mapPaintTile(group.choices.find(({ paint }) => paint === selectedMapPaint)?.paint ?? group.choices[0].paint, activeTileStyle)}
												<div class="terrain-group"><button class:selected={group.choices.some(({ paint }) => paint === selectedMapPaint)} class="terrain-choice" aria-label={`Choose ${group.label.toLowerCase()} terrain`} title={group.label} aria-expanded={expandedTerrainGroup === group.label} onclick={() => { selectedMapTool = 'paint'; expandedTerrainGroup = expandedTerrainGroup === group.label ? '' : group.label; }} style:--terrain-image={preview.image} style:--terrain-size={preview.size} style:--terrain-x={preview.x} style:--terrain-y={preview.y}>▾</button>
													{#if expandedTerrainGroup === group.label}<div class="terrain-group-menu" role="group" aria-label={`${group.label} varieties`}>{#each group.choices as choice}{@const tile = mapPaintTile(choice.paint, activeTileStyle)}<button class:chosen={selectedMapPaint === choice.paint} onclick={() => { selectedMapPaint = choice.paint; selectedMapTool = 'paint'; expandedTerrainGroup = ''; }}><span class="terrain-menu-tile" style:--terrain-image={tile.image} style:--terrain-size={tile.size} style:--terrain-x={tile.x} style:--terrain-y={tile.y}></span>{choice.label}</button>{/each}</div>{/if}
												</div>
											{/if}
										{/each}
									</div>
									<div class="map-fill"><button class="bar-btn" aria-expanded={showMapFill} onclick={() => (showMapFill = !showMapFill)}>FILL ▾</button>{#if showMapFill}<div class="map-fill-menu"><button onclick={() => fillActiveMap('unpainted')}>Fill unpainted</button><button onclick={() => fillActiveMap('all')}>Fill everything</button><button onclick={() => fillActiveMap('clear')}>Clear everything</button></div>{/if}</div>
								{/if}
								<label class="map-image-upload bar-btn"><RpIcon name="image" size={14} /> IMAGE<input class="visually-hidden" type="file" accept="image/*" onchange={handleMapBackgroundUpload} /></label>
							</div>
							<div class="map-surface" class:hex-surface={activeGridShape === 'hex'} class:has-background={!!activeMap.background} style:--map-background={activeMap.background ? `url("${activeMap.background}")` : 'none'}>
								<div class="map-grid" class:hex-grid={activeGridShape === 'hex'} role="grid" aria-label={`${activeMap.name} map cells`}>
									{#each Array.from({ length: 10 }, (_, row) => row) as row}
										{#each Array.from({ length: 20 }, (_, column) => column) as column}
											{@const key = `${column}:${row}`}
											{@const cell = activeMap.cells[key]}
											{@const recordName = cell ? mapCellRecordName(cell, mapRecordTab) : ''}
											{@const tile = cell?.paint ? mapPaintTile(cell.paint, activeTileStyle) : null}
											<button
												class="map-cell"
												class:hex-cell={activeGridShape === 'hex'}
												class:path-cell={cell?.path}
												class:has-record={!!recordName}
												class:has-terrain={!!tile}
												style:--terrain-image={tile?.image ?? 'none'}
												style:--terrain-size={tile?.size ?? 'auto'}
												style:--terrain-x={tile?.x ?? '0%'}
												style:--terrain-y={tile?.y ?? '0%'}
												style:left={activeGridShape === 'hex' ? `${(column * 0.75 / 15.25) * 100}%` : undefined}
												style:top={activeGridShape === 'hex' ? `${((row + (column % 2) * 0.5) / 10.5) * 100}%` : undefined}
												style:width={activeGridShape === 'hex' ? `${(1 / 15.25) * 100}%` : undefined}
												style:height={activeGridShape === 'hex' ? `${(1 / 10.5) * 100}%` : undefined}
												aria-label={`Map cell column ${column + 1}, row ${row + 1}${cell?.name ? `, ${cell.name}` : ''}${recordName ? `, ${recordName}` : ''}`}
												onclick={() => selectedMapTool === 'select' ? openMapCellDetails(key) : onMapCellClick(key)}
												oncontextmenu={(event) => { event.preventDefault(); openMapCellDetails(key); }}
											>
												{#if activeGridShape === 'hex'}
													<svg class="hex-cell-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
														<polygon points="25,1.5 75,1.5 98.5,50 75,98.5 25,98.5 1.5,50" />
													</svg>
												{/if}
												{#if (activeMap.showNames && cell?.name) || recordName || cell?.path}
													<span class="map-cell-badge">{#if activeMap.showNames && cell?.name}{cell.name}{:else if recordName}{recordName}{:else if cell?.path}•{/if}</span>
												{/if}
											</button>
										{/each}
									{/each}
								</div>
							</div>
							<div class="faction-influence">
								<button type="button" class="bar-btn" onclick={rollMapFactionInfluence}><RpIcon name="sword" size={14} /> FACTION INFLUENCE</button>
								<input aria-label="Faction influence" placeholder="Faction" value={activeMap.factionInfluence} onchange={(event) => saveCampaignMaps(updateCampaignMap(campaignMaps, activeMap.id, { factionInfluence: event.currentTarget.value }), activeMap.id)} />
								<button type="button" class="oracle-icon-btn" title="Roll Faction Influence (d100)" onclick={rollMapFactionInfluence}><RpIcon name="roll" size={16} /></button>
								<button type="button" class="oracle-icon-btn" title="Add Faction Influence to Journal" disabled={!activeMap.factionInfluence?.trim()} onclick={() => addTrackResolutionToJournal(`Map (${activeMap.name}) Faction Influence: ${activeMap.factionInfluence}`)}><RpIcon name="journal" size={16} /></button>
							</div>
							<div class="map-record-tabs" role="tablist" aria-label="Map record types">{#each [{kind:'location',label:'LOCATIONS',icon: staticAsset('art/icons/location.webp')}, {kind:'site',label:'SITES',icon: staticAsset('art/icons/site.webp')}, {kind:'character',label:'CHARACTERS',icon: staticAsset('art/icons/hero.webp')}] as item}<button role="tab" aria-selected={mapRecordTab === item.kind} class:active-map-tab={mapRecordTab === item.kind} onclick={() => { mapRecordTab = item.kind as MapRecordKind; if (selectedMapCell) { mapCellRecordId = ''; mapOnlyUnassigned = false; } }}><img src={item.icon} alt="" class="inline-emblem-xs" /> {item.label}<span>{Object.values(activeMap.cells).reduce((sum, cell) => sum + (cell.assignments[item.kind as MapRecordKind]?.length ?? 0), 0)}</span></button>{/each}</div>
							<div class="map-record-list">{#if Object.values(activeMap.cells).some((cell) => cell.assignments[mapRecordTab]?.length)}{#each Object.values(activeMap.cells).filter((cell) => cell.assignments[mapRecordTab]?.length) as cell}<button class="map-record-row" onclick={() => openMapCellDetails(cell.key)}><span>{mapCellRecordName(cell, mapRecordTab)}</span><small>{cell.name || `Cell ${cell.key.replace(':', ', ')}`}</small></button>{/each}{:else}<p>List of {mapRecordTab === 'location' ? 'locations' : mapRecordTab === 'site' ? 'sites' : 'characters'} is empty, click on map cell to create or add one.</p>{/if}</div>
						</div>{/if}
					</section>
				{:else if activeArea === 'Factions' && activeCampaign}
					<section class="factions-workspace" aria-label="Campaign factions">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openNewFaction}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" onclick={() => openSavedImportModal('faction')}><RpIcon name="import" size={14} /> IMPORT</button>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={campaignFactions.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
							</div>
							<div class="workspace-bar-right">
								<input type="search" class="bar-search" aria-label="Filter factions" bind:value={factionFilter} placeholder="Search" />
							</div>
						</div>
						{#if visibleFactions.length === 0}<div class="empty-journal-card"><img src={staticAsset('art/icons/faction.webp')} alt="" class="empty-emblem" /><strong>{factionFilter ? 'No matching factions' : 'No factions yet'}</strong><p>{factionFilter ? 'Try another name or field.' : 'Add a faction to record its influence and relationships.'}</p>{#if !factionFilter}<button class="secondary-button" onclick={openNewFaction}>Add faction</button>{/if}</div>
						{:else}<div class="faction-grid">{#each visibleFactions as faction (faction.id)}<article class="faction-card"><header class="record-heading"><div class="record-title-cluster"><img src={staticAsset('art/icons/faction.webp')} alt="" class="card-emblem-sm" /><div><p class="eyebrow">{faction.origin.toUpperCase()}{#if faction.type} · {faction.type.toUpperCase()}{/if}</p><h3>{faction.fields.name}</h3></div></div><button class="record-delete" aria-label={`Delete ${faction.fields.name}`} onclick={() => deleteFaction(faction)}><RpIcon name="delete" size={16} /></button></header>
								<div class="card-action-strip">
									<button type="button" class="bar-btn" onclick={() => openEditFaction(faction)}><RpIcon name="edit" size={14} /> EDIT</button>
									<button type="button" class="bar-btn" onclick={() => exportFactionToSaved(faction)}><RpIcon name="export" size={14} /> EXPORT</button>
									<button type="button" class="bar-btn" onclick={() => factionJournalEntry(faction)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
									{#if reorderMode}
										<button type="button" class="bar-btn" aria-label={`Move ${faction.fields.name} up`} onclick={() => saveCampaignFactions(moveCampaignFaction(campaignFactions, faction.id, 'up'))}>↑ UP</button>
										<button type="button" class="bar-btn" aria-label={`Move ${faction.fields.name} down`} onclick={() => saveCampaignFactions(moveCampaignFaction(campaignFactions, faction.id, 'down'))}>↓ DOWN</button>
									{/if}
								</div>
								{#if faction.forceCursed || faction.rollWithCursedDie}<div class="faction-flags">{#if faction.forceCursed}<span>Forced cursed faction</span>{/if}{#if faction.rollWithCursedDie}<span>Cursed die</span>{/if}</div>{/if}
								<div class="record-field-grid">{#each [['Influence', faction.fields.influence], ['Projects', faction.fields.projects], ['Relationships', faction.fields.relationships], ['Culture', faction.fields.culture], ['Theme', faction.fields.theme], ['Aspect', faction.fields.aspect], ['Persona', faction.fields.persona], ['Cursed role', faction.fields.cursedRole], ['Cursed aspects', faction.fields.cursedAspects], ['Cursed goals', faction.fields.cursedGoals], ['Quirks', faction.fields.quirks], ['Rumors', faction.fields.rumors], ['Society chronicles', faction.fields.societyChronicles], ['Society overseers', faction.fields.societyOverseers], ['Society touchstones', faction.fields.societyTouchstones], ['Society identity', faction.fields.societyIdentity]] as [label, value]}{#if value}<p><strong>{label}</strong><span>{value}</span></p>{/if}{/each}</div>
								<div class="hero-subpanels">
									<details class="hero-subpanel" open={!!faction.notes}>
										<summary class="hero-subpanel-header"><span>Notes</span></summary>
										<div class="hero-subpanel-body">
											<textarea class="inline-notes-area" rows="2" value={faction.notes ?? ''} placeholder="Faction notes, plots, and members..." onchange={(event) => saveCampaignFactions(updateCampaignFaction(campaignFactions, faction.id, { notes: event.currentTarget.value }))}></textarea>
										</div>
									</details>
								</div>
							</article>{/each}</div>{/if}
						{#if factionError}<p class="notice error" role="alert">{factionError}</p>{/if}
					</section>
				{:else if activeArea === 'Sites' && activeCampaign}
					<section class="sites-workspace" aria-label="Campaign sites">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openNewSite}><RpIcon name="plus" size={14} /> ADD</button>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={campaignSites.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
								<details class="bar-filter-menu">
									<summary class="bar-btn" class:bar-btn-active={siteTypeFilter.length < 6}><RpIcon name="filter" size={14} /> FILTER</summary>
									<div class="bar-filter-popover">
										{#each SITE_TYPES as stype}
											<label><input type="checkbox" checked={siteTypeFilter.includes(stype)} onchange={() => (siteTypeFilter = toggleFilterValue(siteTypeFilter, stype))} /> {stype}s</label>
										{/each}
									</div>
								</details>
							</div>
							<div class="workspace-bar-right">
								<input type="search" class="bar-search" aria-label="Filter sites" bind:value={siteFilter} placeholder="Search" />
							</div>
						</div>
						{#if visibleSites.length === 0}<div class="empty-journal-card"><img src={staticAsset('art/icons/site.webp')} alt="" class="empty-emblem" /><strong>{siteFilter ? 'No matching sites' : 'No sites yet'}</strong><p>{siteFilter ? 'Try another term.' : 'Create a Delve or another site to begin exploring.'}</p><button class="secondary-button" onclick={openNewSite}>Add site</button></div>
						{:else}<div class="site-grid">{#each visibleSites as site (site.id)}<article class="site-card"><header class="record-heading"><div class="record-title-cluster"><img src={staticAsset('art/icons/site.webp')} alt="" class="card-emblem-sm" /><div><p class="eyebrow">{site.type.toUpperCase()} · {site.rank.toUpperCase()}</p><h3>{site.fields.name}</h3><p>{[site.fields.theme, site.fields.domain, site.details?.location].filter(Boolean).join(' · ') || 'Uncharted site'}</p></div></div><button class="record-delete" aria-label={`Delete ${site.fields.name}`} onclick={() => deleteSite(site)}><RpIcon name="delete" size={16} /></button></header>
							<div class="card-action-strip">
								<button type="button" class="bar-btn" onclick={() => openEditSite(site)}><RpIcon name="edit" size={14} /> EDIT</button>
								<button type="button" class="bar-btn" onclick={() => addTrackResolutionToJournal(`${site.fields.name} — ${site.type} site (${site.rank}), progress ${site.progress}/10.`)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
								{#if site.type === 'Delve'}<button type="button" class="bar-btn" onclick={() => openDenizensModal(site)}><RpIcon name="skull" size={14} /> DENIZENS TABLE</button>{/if}
								{#if site.type === 'Derelict' || site.type === 'Vault'}<button type="button" class="bar-btn" disabled={!!site.discoveries?.innerFirstLook} onclick={() => rollSiteDiscovery(site, 'innerFirstLook')}>EXPLORE INTERIOR</button>{/if}
								{#if site.type === 'Vault'}<button type="button" class="bar-btn" disabled={!!site.discoveries?.purpose} onclick={() => rollSiteDiscovery(site, 'purpose')}>VAULT PURPOSE</button>{/if}
								{#if site.type === 'Cave'}<button type="button" class="bar-btn" disabled={!!site.discoveries?.heart} onclick={() => rollSiteDiscovery(site, 'heart')}>REACH THE HEART</button>{/if}
								{#if site.type === 'Ruin'}<button type="button" class="bar-btn" disabled={!!site.discoveries?.cipher} onclick={() => rollSiteDiscovery(site, 'cipher')}>UNCOVER A CIPHER</button><button type="button" class="bar-btn" disabled={!!site.discoveries?.mystery} onclick={() => rollSiteDiscovery(site, 'mystery')}>ENVISION A MYSTERY</button>{/if}
								{#if reorderMode}
									<button type="button" class="bar-btn" onclick={() => saveCampaignSites(moveCampaignSite(campaignSites, site.id, 'up'))}>↑ UP</button>
									<button type="button" class="bar-btn" onclick={() => saveCampaignSites(moveCampaignSite(campaignSites, site.id, 'down'))}>↓ DOWN</button>
								{/if}
							</div>
							<div class="site-meta"><span>Rank: <strong>{site.rank}</strong></span><span>Progress: <strong>{site.progress}/10</strong></span></div>
							<div class="site-progress" role="group" aria-label={`${site.fields.name} progress`}>
								{#each Array.from({ length: 10 }, (_, i) => i + 1) as box}
									<button class:filled={site.progress >= box} aria-label={`${site.progress >= box ? 'Unmark' : 'Mark'} progress ${box}`} aria-pressed={site.progress >= box} onclick={() => saveCampaignSites(updateCampaignSite(campaignSites, site.id, { progress: site.progress >= box ? box - 1 : box }))}>
										<RpIcon name="progress-box" size={22} ticks={site.progress >= box ? 4 : 0} />
									</button>
								{/each}
							</div>
							<div class="card-action-strip">
								{#if site.resolvedAt}
									<span class="track-resolution">{site.resolution}</span>
									<button type="button" class="bar-btn" onclick={() => reactivateSite(site)}>REACTIVATE</button>
									<button type="button" class="bar-btn" onclick={() => locateSiteObjective(site)}><RpIcon name="reroll" size={14} /> REROLL DICE</button>
								{:else}
									<button type="button" class="bar-btn" onclick={() => locateSiteObjective(site)}><RpIcon name="roll" size={14} /> {site.type === 'Delve' ? 'LOCATE YOUR OBJECTIVE' : 'FINISH AN EXPEDITION'}</button>
								{/if}
								{#if site.type === 'Delve'}
									<button type="button" class="bar-btn" disabled={!!site.resolvedAt} onclick={() => appendSiteArea(site)}>＋ ADD AREA</button>
								{:else if site.type === 'Vault'}
									<button type="button" class="bar-btn" disabled={!!site.resolvedAt} onclick={() => appendSiteWaypoint(site, 'Interior')}>＋ INTERIOR WAYPOINT</button>
									<button type="button" class="bar-btn" disabled={!!site.resolvedAt} onclick={() => appendSiteWaypoint(site, 'Sanctum')}>＋ SANCTUM WAYPOINT</button>
								{:else}
									<button type="button" class="bar-btn" disabled={!!site.resolvedAt} onclick={() => appendSiteWaypoint(site)}>＋ ADD {site.type === 'Derelict' ? 'ZONE' : 'WAYPOINT'}</button>
								{/if}
							</div>
							<div class="record-field-grid">{#each site.type === 'Delve' ? [['Description', site.fields.description], ['Detail', site.fields.detail], ['Namesake', site.fields.namesake], ['Place', site.fields.place], ['Aspect focus', site.fields.aspectFocus], ['Secondary theme', site.fields.secondaryTheme], ['Secondary domain', site.fields.secondaryDomain]] as [string, string][] : SITE_DETAIL_FIELDS[site.type].map((key) => [SITE_DETAIL_LABELS[key], site.details?.[key] ?? ''] as [string, string]) as [label, value]}{#if value}<p><strong>{label}</strong><span>{value}</span></p>{/if}{/each}</div>
							{#if site.discoveries}<div class="record-field-grid">{#each Object.entries(site.discoveries) as [key, value]}<p><strong>{key.replace(/([A-Z])/g, ' $1')}</strong><span>{value}</span></p>{/each}</div>{/if}
							{#if site.type === 'Delve'}
								<div class="oracle-input-roll">
									<label class="oracle-field">
										<span class="oracle-field-label">Denizen</span>
										<input type="text" value={denizenInlineRolls[site.id] ?? ''} oninput={(event) => (denizenInlineRolls = { ...denizenInlineRolls, [site.id]: event.currentTarget.value })} placeholder="Roll on Denizens table" />
									</label>
									<button type="button" class="oracle-icon-btn" aria-label={`Roll Denizen for ${site.fields.name}`} onclick={() => triggerSiteDenizenRoll(site)}><RpIcon name="roll" size={16} /></button>
									<button type="button" class="oracle-icon-btn" aria-label={`Add Denizen for ${site.fields.name} to Journal`} disabled={!denizenInlineRolls[site.id]?.trim()} onclick={() => addInlineOracleToJournal(`${site.fields.name} Denizen`, denizenInlineRolls[site.id] ?? '')}><RpIcon name="journal" size={16} /></button>
								</div>
								<div class="site-explore-tools"><label>Active theme<input value={site.activeTheme ?? site.fields.theme} onchange={(event) => saveCampaignSites(updateCampaignSite(campaignSites, site.id, { activeTheme: event.currentTarget.value }))} /></label><label>Active domain<input value={site.activeDomain ?? site.fields.domain} onchange={(event) => saveCampaignSites(updateCampaignSite(campaignSites, site.id, { activeDomain: event.currentTarget.value }))} /></label></div>
								{#each site.areas ?? [] as area (area.id)}<div class="site-area"><div class="site-area-heading"><strong>{area.name}</strong><button class="record-delete" aria-label={`Remove ${area.name}`} onclick={() => saveCampaignSites(updateCampaignSite(campaignSites, site.id, { areas: (site.areas ?? []).filter((item) => item.id !== area.id) }))}><RpIcon name="delete" size={15} /></button></div><label>Area name<input value={area.name} onchange={(event) => setSiteAreaField(site, area, 'name', event)} /></label>{#each ['feature', 'danger', 'opportunity', 'aspect'] as kind}<div class="site-field"><label>{kind === 'aspect' ? 'Aspect focus' : kind}<input value={area[kind as 'feature' | 'danger' | 'opportunity' | 'aspect']} onchange={(event) => setSiteAreaField(site, area, kind as 'feature' | 'danger' | 'opportunity' | 'aspect', event)} /></label><button class="secondary-button" onclick={() => rollSiteArea(site, area, kind as 'feature' | 'danger' | 'opportunity' | 'aspect')}>Roll</button></div>{/each}<label>Notes<textarea rows="2" onchange={(event) => setSiteAreaField(site, area, 'notes', event)}>{area.notes}</textarea></label></div>{/each}
							{:else}
								{#each site.areas ?? [] as area (area.id)}<div class="site-area"><div class="site-area-heading"><strong>{area.name}{area.zone ? ` · ${area.zone}` : ''}</strong><button class="record-delete" aria-label={`Remove ${area.name}`} onclick={() => saveCampaignSites(updateCampaignSite(campaignSites, site.id, { areas: (site.areas ?? []).filter((item) => item.id !== area.id) }))}><RpIcon name="delete" size={15} /></button></div><label>Custom name<input value={area.name} onchange={(event) => setSiteAreaField(site, area, 'name', event)} /></label>{#if site.type === 'Derelict'}<label>Zone<select value={area.zone || 'Access'} onchange={(event) => setSiteAreaField(site, area, 'zone', event)}>{#each ['Access', 'Community', 'Engineering', 'Living', 'Medical', 'Operations', 'Production', 'Research'] as zone}<option>{zone}</option>{/each}</select></label>{/if}{#each site.type === 'Derelict' ? ['area', 'feature', 'peril', 'opportunity', 'descriptor'] : site.type === 'Shipwreck' ? ['details', 'peril', 'opportunity', 'descriptor'] : ['feature', 'peril', 'opportunity', 'descriptor'] as kind}<div class="site-field"><label>{kind}<input value={area[kind as 'area' | 'feature' | 'peril' | 'opportunity' | 'descriptor' | 'details'] ?? ''} onchange={(event) => setSiteAreaField(site, area, kind as 'area' | 'feature' | 'peril' | 'opportunity' | 'descriptor' | 'details', event)} /></label><button class="secondary-button" aria-label={`Roll ${kind} for ${area.name}`} onclick={() => rollSiteWaypoint(site, area, kind as 'area' | 'feature' | 'peril' | 'opportunity' | 'descriptor' | 'details')}>Roll</button></div>{/each}<label>Notes<textarea rows="2" onchange={(event) => setSiteAreaField(site, area, 'notes', event)}>{area.notes}</textarea></label></div>{/each}
							{/if}
						</article>{/each}</div>{/if}
						{#if siteError}<p class="notice error" role="alert">{siteError}</p>{/if}
					</section>
				{:else if activeArea === 'Tracks' && activeCampaign}
					<section class="tracks-workspace" aria-label="Campaign tracks">
						<div class="workspace-bar">
							<div class="workspace-bar-left">
								<button type="button" class="bar-btn" onclick={openNewTrack}><RpIcon name="plus" size={14} /> ADD</button>
								<label class="bar-toggle-pill"><span>RESOLVED</span><input type="checkbox" bind:checked={showResolvedTracks} /></label>
								<button type="button" class="bar-btn" class:bar-btn-active={reorderMode} disabled={campaignTracks.length < 2} onclick={() => (reorderMode = !reorderMode)}>{reorderMode ? '✓ FINISH' : '✥ REORDER'}</button>
							</div>
						</div>
						{#if campaignTracks.length === 0}
							<div class="empty-journal-card"><img src={staticAsset('art/icons/track.webp')} alt="" class="empty-emblem" /><strong>No tracks yet</strong><p>Add a vow, journey, scene, or other campaign track to get started.</p><button class="secondary-button" onclick={openNewTrack}>Create first track</button></div>
						{:else if visibleTracks.length === 0}
							<div class="empty-journal-card"><img src={staticAsset('art/icons/track.webp')} alt="" class="empty-emblem" /><strong>All tracks resolved</strong><p>Show resolved tracks to review or reactivate them.</p></div>
						{:else}
							<div class="track-grid">
								{#each visibleTracks as track (track.id)}
									<article class:track-resolved={!!track.resolvedAt} class="track-card">
										<header class="track-card-heading">
											<div class="record-title-cluster">
												<img src={staticAsset('art/icons/track.webp')} alt="" class="card-emblem-sm" />
												<h3>{track.name}{track.resolvedAt ? ' (Resolved)' : ''}</h3>
											</div>
											<button class="track-delete" aria-label={`Delete ${track.name}`} title="Delete track" onclick={() => deleteTrack(track)}><RpIcon name="delete" size={16} /></button>
										</header>
										<div class="card-action-strip">
											{#if track.resolvedAt}
												<button type="button" class="bar-btn" onclick={() => reactivateTrack(track)}><RpIcon name="sword" size={14} /> REACTIVATE</button>
												{#if track.type !== 'Clock' && !track.resolution?.endsWith('forsaken.')}<button type="button" class="bar-btn" onclick={() => rerollTrackResolution(track)}><RpIcon name="reroll" size={14} /> REROLL DICE</button>{/if}
											{:else}
												<button type="button" class="bar-btn" onclick={() => openEditTrack(track)}><RpIcon name="edit" size={14} /> EDIT</button>
												<button type="button" class="bar-btn" onclick={() => addTrackToJournal(track)}><RpIcon name="journal" size={14} /> ADD TO JOURNAL</button>
												<button type="button" class="bar-btn" onclick={() => resolveTrack(track)}><RpIcon name="roll" size={14} /> RESOLVE</button>
												{#if track.type !== 'Clock'}<button type="button" class="bar-btn" onclick={() => forsakeTrack(track)}><RpIcon name="skull" size={14} /> FORSAKE</button>{/if}
												{#if reorderMode}
													<button type="button" class="bar-btn" aria-label={`Move ${track.name} up`} onclick={() => saveCampaignTracks(moveCampaignTrack(campaignTracks, track.id, 'up'))}>↑</button>
													<button type="button" class="bar-btn" aria-label={`Move ${track.name} down`} onclick={() => saveCampaignTracks(moveCampaignTrack(campaignTracks, track.id, 'down'))}>↓</button>
												{/if}
											{/if}
										</div>
										<div class="track-card-meta">
											{#if track.type !== 'Clock'}<span><strong>Rank:</strong> {track.rank}</span>{/if}
											{#if track.threat}<span class="threat-badge">Threat{track.threatName ? ` · ${track.threatName}` : ''}</span>{/if}
										</div>
										{#if track.type !== 'Clock'}
										<div class="track-progress-label"><strong>Progress:</strong> <span>{trackTicks(track) / 4}/{trackProgressBoxes(track.rank)}</span></div>
										{#if track.resolution}<p class="track-resolution">{track.resolution}</p>{/if}
										<div class="track-boxes" role="group" aria-label={`${track.name} progress boxes`}>
											<button class="progress-step" aria-label={`Remove progress from ${track.name}`} disabled={!!track.resolvedAt || trackTicks(track) === 0} onclick={() => saveCampaignTracks(markTrackProgress(campaignTracks, track.id, -1))}>−</button>
											{#each Array.from({ length: trackProgressBoxes(track.rank) }, (_, index) => index) as box}
												<span class="progress-box" aria-label={`Box ${box + 1}: ${Math.max(0, Math.min(4, trackTicks(track) - box * 4))} of 4 ticks`}>
													<RpIcon name="progress-box" size={23} ticks={Math.max(0, Math.min(4, trackTicks(track) - box * 4))} />
												</span>
											{/each}
											<button class="progress-step" aria-label={`Mark progress on ${track.name}`} disabled={!!track.resolvedAt || trackTicks(track) === TRACK_TICKS_MAX} onclick={() => saveCampaignTracks(markTrackProgress(campaignTracks, track.id, 1))}>＋</button>
										</div>
										{:else}
											<div class="track-progress-label"><strong>Progress:</strong> <span>{track.progress}/{clockSteps(track)}</span></div>
											{#if track.resolution}<p class="track-resolution">{track.resolution}</p>{/if}
										{/if}
										{#if track.threat && track.type !== 'Clock'}<div class="track-progress-label"><strong>Threat level:</strong> <span>{track.threatLevel ?? 0}/10</span></div><div class="track-clock" role="group" aria-label={`${track.name} threat level`}><RpIcon name="clock-dial" size={28} steps={10} filled={track.threatLevel ?? 0} /><button aria-label={`Lower threat level on ${track.name}`} disabled={!!track.resolvedAt || (track.threatLevel ?? 0) === 0} onclick={() => saveCampaignTracks(markTrackThreat(campaignTracks, track.id, -1))}>−</button>{#each Array.from({ length: 10 }, (_, i) => i) as step}<span class:clock-filled={(track.threatLevel ?? 0) > step}></span>{/each}<button aria-label={`Raise threat level on ${track.name}`} disabled={!!track.resolvedAt || (track.threatLevel ?? 0) === 10} onclick={() => saveCampaignTracks(markTrackThreat(campaignTracks, track.id, 1))}>＋</button></div>{/if}
										{#if track.type === 'Clock' || track.type === 'Scene'}<div class="track-progress-label"><strong>{track.type === 'Scene' ? 'Clock:' : 'Steps:'}</strong> <span>{track.type === 'Scene' ? (track.sceneClockProgress ?? 0) : track.progress}/{clockSteps(track)}</span></div><div class="track-clock" role="group" aria-label={`${track.name} clock`}><RpIcon name="clock-dial" size={28} steps={clockSteps(track)} filled={track.type === 'Scene' ? (track.sceneClockProgress ?? 0) : track.progress} /><button aria-label={`Remove clock step from ${track.name}`} disabled={!!track.resolvedAt || (track.type === 'Scene' ? (track.sceneClockProgress ?? 0) : track.progress) === 0} onclick={() => saveCampaignTracks(markTrackClock(campaignTracks, track.id, -1))}>−</button>{#each Array.from({ length: clockSteps(track) }, (_, i) => i) as step}<span class:clock-filled={(track.type === 'Scene' ? (track.sceneClockProgress ?? 0) : track.progress) > step}></span>{/each}<button aria-label={`Add clock step to ${track.name}`} disabled={!!track.resolvedAt || (track.type === 'Scene' ? (track.sceneClockProgress ?? 0) : track.progress) === clockSteps(track)} onclick={() => saveCampaignTracks(markTrackClock(campaignTracks, track.id, 1))}>＋</button></div>{/if}
										<details class="track-notes"><summary>Notes</summary><label>Track notes<textarea rows="3" value={track.notes ?? ''} onchange={(event) => saveCampaignTracks(updateCampaignTrack(campaignTracks, track.id, { notes: event.currentTarget.value }))}></textarea></label></details>
									</article>
								{/each}
							</div>
						{/if}
					</section>
				{:else}
					<section class="section-placeholder"><span class="placeholder-glyph">{['', '▤', '♙', '◉', '♟', '⌖', '⌂', '⚑', '▦', '✧'][areas.indexOf(activeArea)]}</span><p class="eyebrow">CAMPAIGN WORKSPACE</p><h2>{sectionNames[activeArea]?.title ?? activeArea}</h2><p>{sectionNames[activeArea]?.description ?? 'Campaign content and references will appear here.'}</p><span class="stage-badge">This section is being built</span></section>
				{/if}
				{#if storageError}<p class="notice error" role="alert">{storageError}</p>{/if}
			</div>

			{#if activeCampaign}
				<div class="bottom-dice site-footer" aria-label="Campaign dice roller">
					{#if showBottomRoller}
						<div class="bottom-dice-panel" role="region" aria-label="Action and dice roller">
							{#if cursedDieResult > 0}
								<div class="bottom-dice-result cursed-result" role="status">
									<RpIcon name="die-face" sides={10} value={cursedDieResult} tone="cursed" size={34} />
									<strong>Curse: {cursedDieResult}{cursedDieResult === 10 ? ' · Cursed!' : ''}</strong>
									<button class="result-close" onclick={() => (cursedDieResult = 0)} aria-label="Clear cursed die result">×</button>
								</div>
							{/if}
							{#if bottomResult}
								<div class="bottom-dice-result" role="status">
									<RpIcon name="die-face" sides={bottomDie === 6 ? 6 : 10} value={bottomResult.split(': ')[1] ?? ''} tone="action" size={34} />
									<strong>{bottomResult}</strong>
									<button class="oracle-icon-btn" onclick={() => rollBottomDie(bottomDie)} title={`Reroll D${bottomDie}`} aria-label={`Reroll D${bottomDie}`}><RpIcon name="reroll" size={14} /></button>
									<button class="result-close" onclick={() => (bottomResult = '')} aria-label="Clear generic die result">×</button>
								</div>
							{/if}
							{#if bottomAction}
								{@const isMatch = bottomAction.challengeDice[0] === bottomAction.challengeDice[1]}
								<div class="bottom-action-result" role="status">
									<div class="bottom-outcome">
										<strong>{bottomAction.outcome}{#if bottomMatchEvent}, match event: <em>{bottomMatchEvent}</em>{:else if isMatch} · Match!{/if}</strong>
										<button aria-label="Clear action result" onclick={() => (bottomAction = null)}>×</button>
										{#if !bottomJournalRolls}
											<details class="bottom-result-options">
												<summary aria-label="Action result options">⋯</summary>
												<button class="bottom-result-save" onclick={() => addTrackResolutionToJournal(bottomAction?.text ?? '')}>Add action to Journal</button>
											</details>
										{/if}
									</div>
									<div class="bottom-action-equation" aria-label={bottomAction.text}>
										<button class="roll-die positive" aria-label="Reroll action die" title="Reroll action die" disabled={!!Number(bottomLock)} onclick={() => rerollBottomDie('action')}>
											<RpIcon name="die-face" sides={6} value={bottomAction.actionDie} tone="action" size={44} />
											<span class="die-badge" aria-hidden="true"><RpIcon name="reroll" size={11} /></span>
											{#if Number(bottomLock)}<span class="die-lock" aria-hidden="true"><RpIcon name="lock" size={11} /></span>{/if}
										</button>
										<span>+</span><span>{bottomAction.stat}</span><span>+</span><span>{bottomAction.adds}</span><span>=</span>
										<b class:hit-strong={bottomAction.outcome === 'Strong hit'} class:hit-weak={bottomAction.outcome === 'Weak hit'} class:hit-miss={bottomAction.outcome === 'Miss'}>{bottomAction.total}</b>
										<span>vs</span>
										<button class="roll-die challenge" aria-label="Reroll first challenge die" title="Reroll challenge die" onclick={() => rerollBottomDie(0)}>
											<RpIcon name="die-face" sides={10} value={bottomAction.challengeDice[0]} tone={isMatch ? 'match' : 'challenge'} size={44} />
											<span class="die-badge" aria-hidden="true"><RpIcon name="reroll" size={11} /></span>
										</button>
										<button class="roll-die challenge" aria-label="Reroll second challenge die" title="Reroll challenge die" onclick={() => rerollBottomDie(1)}>
											<RpIcon name="die-face" sides={10} value={bottomAction.challengeDice[1]} tone={isMatch ? 'match' : 'challenge'} size={44} />
											<span class="die-badge" aria-hidden="true"><RpIcon name="reroll" size={11} /></span>
										</button>
									</div>
								</div>
							{/if}
							{#if quickRollHeroes.length > 1}
								<label class="bottom-hero-picker">Hero<select aria-label="Action roller hero" bind:value={quickRollHeroId}><option value="">{quickRollHeroes[0]?.fields.Name}</option>{#each quickRollHeroes.slice(1) as hero}<option value={hero.id}>{hero.fields.Name}</option>{/each}</select></label>
							{/if}
							<div class="bottom-stat-options" role="group" aria-label="Action stat">
								<div>{#each ['edge','heart','iron','shadow','wits'] as stat}<button class:chosen={bottomStat === stat} aria-pressed={bottomStat === stat} onclick={() => (bottomStat = stat as typeof bottomStat)}>{stat.toUpperCase()} <b>{bottomHero?.stats[stat as keyof CampaignRecord['stats']] ?? 0}</b></button>{/each}</div>
								<div>{#each ['health','spirit','supply','custom'] as stat}<button class:chosen={bottomStat === stat} aria-pressed={bottomStat === stat} onclick={() => (bottomStat = stat as typeof bottomStat)}>{stat.toUpperCase()} <b>{stat === 'custom' ? bottomCustom : bottomHero?.stats[stat as keyof CampaignRecord['stats']] ?? 0}</b></button>{/each}</div>
							</div>
							{#if bottomStat === 'custom'}
								<label class="bottom-dice-field">Custom stat<select aria-label="Custom stat value" bind:value={bottomCustom}>{#each [6,5,4,3,2,1,0] as value}<option value={value}>+{value}</option>{/each}</select></label>
							{/if}
							<div class="bottom-roll-settings">
								<div class="bottom-select-pair">
									<label class="stat-pill">
										<span class="stat-pill-label">LOCK</span>
										<select aria-label="Lock action die" bind:value={bottomLock} onchange={() => (bottomAction = null)}>
											<option value={0}></option>
											{#each [6,5,4,3,2,1] as value}<option value={value}>{value}</option>{/each}
										</select>
									</label>
									{#if Number(bottomLock)}<button type="button" class="stat-clear" aria-label="Clear lock" onclick={() => { bottomLock = 0; bottomAction = null; }}>×</button>{/if}
									<label class="stat-pill">
										<span class="stat-pill-label">ADDS</span>
										<select aria-label="Action adds" bind:value={bottomAdds}>
											{#each [6,5,4,3,2,1,0] as value}<option value={value}>{value}</option>{/each}
										</select>
									</label>
									{#if Number(bottomAdds)}<button type="button" class="stat-clear" aria-label="Clear adds" onclick={() => (bottomAdds = 0)}>×</button>{/if}
								</div>
								<button type="button" class="roller-drawer-btn" aria-label="Open oracles drawer" title="Oracles" onclick={() => (isDrawerOpen = true)}><img src={staticAsset('art/icons/clues.webp')} alt="" class="roller-btn-emblem" /></button>
							</div>
							{#if bottomRollError}<p role="alert" class="notice error">{bottomRollError}</p>{/if}
							<div class="bottom-roll-actions">
								<button class="bottom-close-button" aria-label="Close dice roller" onclick={() => (showBottomRoller = false)}>×</button>
								{#if bottomHero && bottomHero.id === bottomResultHeroId && bottomAction && bottomHero.stats.momentum > bottomAction.total && bottomAction.outcome !== 'Strong hit'}
									<button class="bottom-burn-button" aria-label={`Burn ${bottomHero.stats.momentum} momentum`} onclick={burnBottomMomentum}><img src={staticAsset('art/icons/burn_momentum.webp')} alt="" class="roller-btn-emblem" /></button>
								{:else}
									<button class="bottom-burn-button" aria-label="Burn momentum unavailable" disabled><img src={staticAsset('art/icons/burn_momentum.webp')} alt="" class="roller-btn-emblem" /></button>
								{/if}
								<button class="bottom-action-button" aria-label="Roll action" title="Action roll" onclick={rollBottomAction}><img src={staticAsset('art/icons/action_roll.webp')} alt="" class="roller-btn-emblem" /></button>
								<details class="bottom-dice-menu" bind:open={showBottomDiceMenu}>
									<summary aria-label="Choose a die" title="Custom dice"><img src={staticAsset('art/icons/custom_dice.webp')} alt="" class="roller-btn-emblem" /></summary>
									<div class="bottom-dice-options">
										{#each [100, 20, 12, 10, 8, 6, 4] as sides}
											<button type="button" class:chosen={bottomDie === sides} aria-label={`Roll D${sides}`} onclick={() => rollBottomDie(sides)}>D{sides}</button>
										{/each}
									</div>
								</details>
								{#if activeCampaign.setting === 'sundered-isles' || activeOptions.hasSunderedRoller}
									<button class="bottom-cursed-button" aria-label="Cursed D10 roll" title="Cursed D10 roll" onclick={rollBottomCursedDie}><img src={staticAsset('art/icons/cursed_die.webp')} alt="" class="roller-btn-emblem" /></button>
								{/if}
							</div>
						</div>
					{:else}
						<div class="bottom-closed-actions">
							<div class="footer-empty" aria-hidden="true"></div>
							<button class="bottom-dice-trigger" aria-label="Open action and dice roller" aria-expanded={showBottomRoller} title="Action and dice roller" onclick={() => (showBottomRoller = true)}><img src={staticAsset('art/icons/action_roll.webp')} alt="" class="roller-btn-emblem" /></button>
							<button class="bottom-dice-trigger mobile-drawer-btn" aria-label="Open oracles and moves" title="Moves & Oracles" onclick={() => (isDrawerOpen = true)}><img src={staticAsset('art/icons/clues.webp')} alt="" class="roller-btn-emblem" /></button>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		{#if activeCampaign}
			{#if isDrawerOpen}
				<div class="drawer-mobile-backdrop" role="presentation" onclick={() => (isDrawerOpen = false)}></div>
				<aside class="site-drawer" aria-label="Moves and Oracles drawer">
					<div class="drawer-top-row">
						<button type="button" class="drawer-hide-btn" aria-label="Hide moves and oracles" onclick={() => (isDrawerOpen = false)}>HIDE <span>»</span></button>
						{#if drawerToast}<span class="drawer-toast" role="status">{drawerToast}</span>{/if}
					</div>
					<div class="drawer-ruleset-tabs" role="tablist" aria-label="Drawer ruleset">
						<button type="button" role="tab" aria-selected={drawerRulesetTab === 'ironsworn'} class:active={drawerRulesetTab === 'ironsworn'} title="Ironsworn" onclick={() => setDrawerTab('ironsworn')}><img src={staticAsset('art/icons/ironsworn.webp')} alt="" class="drawer-tab-emblem" /> <span>Ironsworn</span></button>
						<button type="button" role="tab" aria-selected={drawerRulesetTab === 'starforged'} class:active={drawerRulesetTab === 'starforged'} title="Starforged" onclick={() => setDrawerTab('starforged')}><img src={staticAsset('art/icons/starforged.webp')} alt="" class="drawer-tab-emblem" /> <span>Starforged</span></button>
						<button type="button" role="tab" aria-selected={drawerRulesetTab === 'isles'} class:active={drawerRulesetTab === 'isles'} title="Sundered Isles" onclick={() => setDrawerTab('isles')}><img src={staticAsset('art/icons/isles.webp')} alt="" class="drawer-tab-emblem" /> <span>Sundered Isles</span></button>
					</div>

					<div class="drawer-section pay-the-price-bar">
						<div class="oracle-input-roll">
							<label class="oracle-field">
								<span class="oracle-field-label">Pay the Price</span>
								<input type="text" bind:value={payThePriceText} placeholder="Roll or enter outcome" aria-label="Pay the Price result" />
							</label>
							{#if payThePriceText}<button type="button" class="oracle-icon-btn" aria-label="Clear Pay the Price" onclick={() => (payThePriceText = '')}>×</button>{/if}
							<button type="button" class="oracle-icon-btn" aria-label="Roll Pay the Price" title="Roll Pay the Price" onclick={triggerPayThePrice}><RpIcon name="roll" size={16} /></button>
							<button type="button" class="oracle-icon-btn" aria-label="Add Pay the Price to Journal" title="Add to Journal" disabled={!payThePriceText.trim()} onclick={addPayThePriceToJournal}><RpIcon name="journal" size={16} /></button>
						</div>
					</div>

					<div class="drawer-section ask-oracle-bar">
						<div class="odds-buttons" role="group" aria-label="Ask the Oracle odds">
							{#each ASK_THE_ORACLE_ODDS as odds}
								<button type="button" class="odds-btn" onclick={() => triggerAskTheOracle(odds)}>{odds.toUpperCase()}</button>
							{/each}
						</div>
						<div class="oracle-input-roll">
							<label class="oracle-field">
								<span class="oracle-field-label">Ask the Oracle</span>
								<div class="oracle-prefix-input">
									{#if askOracleRoll}<span class="oracle-roll-prefix">{askOracleRoll}:</span>{/if}
									<input type="text" bind:value={askOracleText} placeholder="Choose odds above or type a note" aria-label="Ask the Oracle result" />
								</div>
							</label>
							{#if askOracleText || askOracleRoll}<button type="button" class="oracle-icon-btn" aria-label="Clear Ask the Oracle" onclick={clearAskTheOracle}>×</button>{/if}
							<button type="button" class="oracle-icon-btn" aria-label="Add Ask the Oracle to Journal" title="Add to Journal" disabled={!askOracleText.trim()} onclick={addAskTheOracleToJournal}><RpIcon name="journal" size={16} /></button>
						</div>
						{#if askOracleEvent}<p class="ask-oracle-event">Event: <strong>{askOracleEvent}</strong></p>{/if}
					</div>

					<div class="drawer-panels">
						<details class="drawer-group">
							<summary class="drawer-group-header"><span>{drawerTabTitle} Moves</span></summary>
							<div class="drawer-group-body">
								<div class="drawer-search-row">
									<input type="search" aria-label="Search moves" bind:value={moveSearch} placeholder="Search" />
									<button type="button" class="drawer-close-all" disabled={expandedMoveIds.length === 0} onclick={() => (expandedMoveIds = [])}>CLOSE ALL</button>
								</div>
								<div class="drawer-move-list">
									{#each drawerMoves as item (`${item.record.packId}:${item.record.id}`)}
										<details class="drawer-move-row" open={expandedMoveIds.includes(item.record.id)} ontoggle={(event) => toggleMoveExpanded(item.record.id, event.currentTarget.open)}>
											<summary class="drawer-move-summary">
												<div class="drawer-move-meta">
													<span class="drawer-move-name">{item.record.name}</span>
													<span class="drawer-move-badge" style="background:{item.badgeTone}">{item.categoryLabel}</span>
												</div>
											</summary>
											<div class="drawer-move-detail">
												<div class="drawer-move-actions">
													<button type="button" class="drawer-inline-btn" onclick={() => { addTrackResolutionToJournal(`${item.record.name}`); showBriefToast('Journal updated'); }}><RpIcon name="journal" size={13} /> ADD TO JOURNAL</button>
													{#if item.record.data.roll_type === 'action_roll'}
														<button type="button" class="drawer-inline-btn" onclick={() => openMoveRoll(item.record)}><RpIcon name="roll" size={13} /> QUICK ROLL</button>
													{/if}
												</div>
												<div class="drawer-move-text">{readableMoveText(typeof item.record.data.text === 'string' ? item.record.data.text : item.record.description)}</div>
												{#each embeddedMoveOracles(item.record) as table (table.id)}
													<div class="oracle-input-roll embedded-move-oracle">
														<label class="oracle-field">
															<span class="oracle-field-label">{table.name}</span>
															<input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder="Roll {table.dice}" />
														</label>
														{#if oracleInlineValues[table.id]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${table.name}`} onclick={() => setInlineOracleValue(table.id, '')}>×</button>{/if}
														<button type="button" class="oracle-icon-btn" aria-label={`Roll ${table.name}`} onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" aria-label={`Add ${table.name} to Journal`} disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</div>
						</details>

						<details class="drawer-group">
							<summary class="drawer-group-header"><span>{drawerTabTitle} Oracles</span></summary>
							<div class="drawer-group-body">
								<div class="drawer-search-row">
									<input type="search" aria-label="Search oracles" bind:value={oracleSearch} placeholder="Search" />
									<button type="button" class="drawer-close-all" disabled={expandedOracleCats.length === 0} onclick={() => (expandedOracleCats = [])}>CLOSE ALL</button>
								</div>
								<div class="drawer-oracle-list">
									{#each drawerOracleGroups as cat (cat.id)}
										<details class="drawer-oracle-cat" open={expandedOracleCats.includes(cat.id)} ontoggle={(event) => toggleOracleCatExpanded(cat.id, event.currentTarget.open)}>
											<summary class="drawer-oracle-cat-summary">{cat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each cat.tables as table (`${table.packId}:${table.id}`)}
													<div class="oracle-input-roll">
														<label class="oracle-field">
															<span class="oracle-field-label">{table.name}</span>
															<input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder={table.dice} />
														</label>
														{#if oracleInlineValues[table.id]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${table.name}`} onclick={() => setInlineOracleValue(table.id, '')}>×</button>{/if}
														<button type="button" class="oracle-icon-btn" aria-label={`Roll ${table.name}`} onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" aria-label={`Add ${table.name} to Journal`} disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
									<details class="drawer-oracle-cat">
										<summary class="drawer-oracle-cat-summary">Custom</summary>
										<div class="drawer-oracle-cat-items">
											<div class="drawer-move-actions">
												<button type="button" class="drawer-inline-btn" onclick={openNewCustomOracle}><RpIcon name="plus" size={13} /> ADD CUSTOM ORACLE</button>
												<button type="button" class="drawer-inline-btn" onclick={() => openSavedImportModal('oracle')}><RpIcon name="import" size={13} /> IMPORT</button>
											</div>
											{#each campaignCustomOracles as coracle (coracle.id)}
												<div class="oracle-input-roll">
													<label class="oracle-field">
														<span class="oracle-field-label">{coracle.name}</span>
														<input type="text" value={oracleInlineValues[coracle.id] ?? ''} oninput={(event) => setInlineOracleValue(coracle.id, event.currentTarget.value)} placeholder={coracle.kind === 'simple' ? 'Simple' : 'Range'} />
													</label>
													<button type="button" class="oracle-icon-btn" aria-label={`Roll ${coracle.name}`} onclick={() => { const r = rollCustomOracle(coracle); setInlineOracleValue(coracle.id, r.text); }}><RpIcon name="roll" size={16} /></button>
													<button type="button" class="oracle-icon-btn" aria-label={`Add ${coracle.name} to Journal`} disabled={!oracleInlineValues[coracle.id]?.trim()} onclick={() => addInlineOracleToJournal(coracle.name, oracleInlineValues[coracle.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													<button type="button" class="oracle-icon-btn" title="Export custom oracle" onclick={() => exportCustomOracleToSaved(coracle)}><RpIcon name="export" size={15} /></button>
													<button type="button" class="oracle-icon-btn" title="Edit custom oracle" onclick={() => openEditCustomOracle(coracle)}><RpIcon name="edit" size={15} /></button>
													<button type="button" class="oracle-icon-btn" title="Delete custom oracle" onclick={() => saveCustomOracles(campaignCustomOracles.filter((item) => item.id !== coracle.id))}><RpIcon name="delete" size={15} /></button>
												</div>
											{/each}
										</div>
									</details>
								</div>
							</div>
						</details>

						{#if activeOptions.isFeRunners && (feRunnersMoves.length || feRunnersOracleGroups.length)}
							<details class="drawer-group">
								<summary class="drawer-group-header"><span>Fe-Runners Moves &amp; Oracles</span></summary>
								<div class="drawer-group-body">
									{#if feRunnersMoves.length}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">Fe-Runners Moves ({feRunnersMoves.length})</summary>
											<div class="drawer-move-list">
												{#each feRunnersMoves as item (`${item.record.packId}:${item.record.id}`)}
													<details class="drawer-move-row">
														<summary class="drawer-move-summary">
															<div class="drawer-move-meta">
																<span class="drawer-move-name">{item.record.name}</span>
																<span class="drawer-move-badge" style="background:{item.badgeTone}">{item.categoryLabel}</span>
															</div>
														</summary>
														<div class="drawer-move-detail">
															<div class="drawer-move-actions">
																<button type="button" class="drawer-inline-btn" onclick={() => { addTrackResolutionToJournal(`${item.record.name} (Fe-Runners)`); showBriefToast('Journal updated'); }}><RpIcon name="journal" size={13} /> ADD TO JOURNAL</button>
																{#if item.record.data.roll_type === 'action_roll'}
																	<button type="button" class="drawer-inline-btn" onclick={() => openMoveRoll(item.record)}><RpIcon name="roll" size={13} /> QUICK ROLL</button>
																{/if}
															</div>
															<div class="drawer-move-text">{readableMoveText(typeof item.record.data.text === 'string' ? item.record.data.text : item.record.description)}</div>
														</div>
													</details>
												{/each}
											</div>
										</details>
									{/if}
									{#each feRunnersOracleGroups as cat (cat.id)}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">{cat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each cat.tables as table (`${table.packId}:${table.id}`)}
													<div class="oracle-input-roll">
														<label class="oracle-field"><span class="oracle-field-label">{table.name}</span><input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder={table.dice} /></label>
														<button type="button" class="oracle-icon-btn" onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/if}

						{#if activeOptions.isAncientWonders && (ancientWondersMoves.length || ancientWondersOracleGroups.length)}
							<details class="drawer-group">
								<summary class="drawer-group-header"><span>Ancient Wonders Moves &amp; Oracles</span></summary>
								<div class="drawer-group-body">
									{#if ancientWondersMoves.length}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">Ancient Wonders Moves ({ancientWondersMoves.length})</summary>
											<div class="drawer-move-list">
												{#each ancientWondersMoves as item (`${item.record.packId}:${item.record.id}`)}
													<details class="drawer-move-row">
														<summary class="drawer-move-summary">
															<div class="drawer-move-meta">
																<span class="drawer-move-name">{item.record.name}</span>
																<span class="drawer-move-badge" style="background:{item.badgeTone}">{item.categoryLabel}</span>
															</div>
														</summary>
														<div class="drawer-move-detail">
															<div class="drawer-move-actions">
																<button type="button" class="drawer-inline-btn" onclick={() => { addTrackResolutionToJournal(`${item.record.name} (Ancient Wonders)`); showBriefToast('Journal updated'); }}><RpIcon name="journal" size={13} /> ADD TO JOURNAL</button>
																{#if item.record.data.roll_type === 'action_roll'}
																	<button type="button" class="drawer-inline-btn" onclick={() => openMoveRoll(item.record)}><RpIcon name="roll" size={13} /> QUICK ROLL</button>
																{/if}
															</div>
															<div class="drawer-move-text">{readableMoveText(typeof item.record.data.text === 'string' ? item.record.data.text : item.record.description)}</div>
														</div>
													</details>
												{/each}
											</div>
										</details>
									{/if}
									{#each ancientWondersOracleGroups as cat (cat.id)}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">{cat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each cat.tables as table (`${table.packId}:${table.id}`)}
													<div class="oracle-input-roll">
														<label class="oracle-field"><span class="oracle-field-label">{table.name}</span><input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder={table.dice} /></label>
														<button type="button" class="oracle-icon-btn" onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/if}

						{#if activeOptions.isIronsmith && ironsmithOracleGroups.length}
							<details class="drawer-group">
								<summary class="drawer-group-header"><span>Ironsmith Oracles</span></summary>
								<div class="drawer-group-body">
									{#each ironsmithOracleGroups as cat (cat.id)}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">{cat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each cat.tables as table (`${table.packId}:${table.id}`)}
													<div class="oracle-input-roll">
														<label class="oracle-field"><span class="oracle-field-label">{table.name}</span><input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder={table.dice} /></label>
														<button type="button" class="oracle-icon-btn" onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/if}

						{#if activeOptions.isStarsmith && starsmithOracleGroups.length}
							<details class="drawer-group">
								<summary class="drawer-group-header"><span>Starsmith Oracles</span></summary>
								<div class="drawer-group-body">
									{#each starsmithOracleGroups as cat (cat.id)}
										<details class="drawer-oracle-cat">
											<summary class="drawer-oracle-cat-summary">{cat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each cat.tables as table (`${table.packId}:${table.id}`)}
													<div class="oracle-input-roll">
														<label class="oracle-field"><span class="oracle-field-label">{table.name}</span><input type="text" value={oracleInlineValues[table.id] ?? ''} oninput={(event) => setInlineOracleValue(table.id, event.currentTarget.value)} placeholder={table.dice} /></label>
														<button type="button" class="oracle-icon-btn" onclick={() => rollInlineOracle(table)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" disabled={!oracleInlineValues[table.id]?.trim()} onclick={() => addInlineOracleToJournal(table.name, oracleInlineValues[table.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/if}

						{#if activeOptions.isSpellforge}
							<details class="drawer-group">
								<summary class="drawer-group-header"><span>Spellforge Oracles</span></summary>
								<div class="drawer-group-body">
									{#each SPELLFORGE_CATEGORIES as sfCat (sfCat.id)}
										<details class="drawer-oracle-cat" open={sfCat.id === 'spell'}>
											<summary class="drawer-oracle-cat-summary">{sfCat.category}</summary>
											<div class="drawer-oracle-cat-items">
												{#each sfCat.fields as sfField (sfField.id)}
													<div class="oracle-input-roll">
														<label class="oracle-field">
															<span class="oracle-field-label">{sfField.label}</span>
															{#if sfField.options}
																<select value={oracleInlineValues[sfField.id] ?? ''} onchange={(event) => setInlineOracleValue(sfField.id, event.currentTarget.value)} style="border:0;background:transparent;width:100%;font-size:.76rem;color:#241d12;padding:.15rem 0">
																	<option value="">Roll or choose…</option>
																	{#each sfField.options as opt}<option value={opt}>{opt}</option>{/each}
																</select>
															{:else}
																<input type="text" value={oracleInlineValues[sfField.id] ?? ''} oninput={(event) => setInlineOracleValue(sfField.id, event.currentTarget.value)} placeholder="1d100" />
															{/if}
														</label>
														{#if oracleInlineValues[sfField.id]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${sfField.label}`} onclick={() => setInlineOracleValue(sfField.id, '')}>×</button>{/if}
														<button type="button" class="oracle-icon-btn" aria-label={`Roll ${sfField.label}`} onclick={() => triggerSpellforgeRoll(sfField.id)}><RpIcon name="roll" size={16} /></button>
														<button type="button" class="oracle-icon-btn" aria-label={`Add ${sfField.label} to Journal`} disabled={!oracleInlineValues[sfField.id]?.trim()} onclick={() => addInlineOracleToJournal(sfField.label, oracleInlineValues[sfField.id] ?? '')}><RpIcon name="journal" size={16} /></button>
													</div>
												{/each}
											</div>
										</details>
									{/each}
								</div>
							</details>
						{/if}

						{#if activeArea !== 'Journal'}
							<details class="drawer-group" open>
								<summary class="drawer-group-header mini-journal-header">
									<span>{activeOptions.hasFullJournal ? 'Journal' : 'Mini Journal'}</span>
								</summary>
								<div class="drawer-group-body mini-journal-body">
									<label class="mini-journal-toggle">
										<span>Full Journal</span>
										<input type="checkbox" checked={activeOptions.hasFullJournal} onchange={(event) => updateCampaignOption('hasFullJournal', event.currentTarget.checked)} />
									</label>
									{#if journalEntries.length}
										{#each (activeOptions.hasFullJournal ? [...journalEntries].reverse() : [journalEntries[journalEntries.length - 1]]) as entry (entry.id)}
											<article class="mini-journal-entry">
												<time datetime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
												<p>{entry.text}</p>
											</article>
										{/each}
									{:else}
										<p class="modal-note">No journal entries yet.</p>
									{/if}
									<form class="mini-journal-form" onsubmit={addJournalNote}>
										<textarea bind:value={journalDraft} rows="2" placeholder="Quick journal note..."></textarea>
										<button type="submit" class="secondary-button" disabled={!journalDraft.trim()}>Add note</button>
									</form>
								</div>
							</details>
						{/if}
					</div>
				</aside>
			{:else}
				<aside class="drawer-aside" aria-label="Reopen moves and oracles">
					<button type="button" class="drawer-reopen-btn" aria-label="Moves & Oracles" onclick={() => (isDrawerOpen = true)}>
						<span class="drawer-reopen-avatar"><img src={staticAsset('art/icons/clues.webp')} alt="" class="roller-btn-emblem" /></span>
						<span class="drawer-reopen-label">Moves &amp; Oracles</span>
					</button>
				</aside>
			{/if}
		{/if}
	</div>

	{#if showAppMenu}
		<div class="modal-scrim" role="presentation" onclick={() => (showAppMenu = false)}>
			<div class="setup-modal app-menu-modal" role="dialog" aria-modal="true" aria-label="Application menu" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showAppMenu = false; }}>
				<button class="close-modal" aria-label="Close menu" onclick={() => (showAppMenu = false)}>×</button>
				<ul class="app-menu-links">
					<li><button type="button" onclick={returnToLaunchScreen}>Campaigns (Launch Screen)</button></li>
					<li><button type="button" onclick={() => { showAppMenu = false; showCampaignPicker = true; }}>Switch Campaign</button></li>
					<li><button type="button" onclick={() => navigateTo('Rules')}>Rules Library &amp; Packs</button></li>
					{#if activeCampaign}
						<li><button type="button" onclick={() => { showAppMenu = false; openEditCampaign(activeCampaign); }}>Campaign Settings</button></li>
					{/if}
					<li><button type="button" onclick={() => { showAppMenu = false; campaignTransferError = ''; campaignTransferMessage = ''; showCampaignTransfer = true; }}>Export / Import Data</button></li>
				</ul>
				<p class="modal-note">Ironvibes is powered by Datasworn rules packages.</p>
			</div>
		</div>
	{/if}

	{#if showAppThemeDialog}
		<div class="modal-scrim" role="presentation" onclick={() => (showAppThemeDialog = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label="App theme" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showAppThemeDialog = false; }}>
				<button class="close-modal" aria-label="Close theme dialog" onclick={() => (showAppThemeDialog = false)}>×</button>
				<p class="eyebrow">APPEARANCE</p>
				<h2>Select app theme</h2>
				<label class="location-toggle"><input type="checkbox" checked={!darkMode} onchange={(event) => toggleDarkMode(!event.currentTarget.checked)} /> {darkMode ? 'Dark mode' : 'Light mode'}</label>
				<p class="eyebrow" style="margin-top:.85rem">COLOR THEME</p>
				<div class="theme-swatches">
					{#each THEME_SWATCHES as swatch}
						<button type="button" class="theme-swatch-btn" class:chosen={appThemeColor === swatch.color} style="background:{swatch.color}" title={swatch.name} aria-label={`${swatch.name} theme`} onclick={() => setAppThemeColor(swatch.color)}></button>
					{/each}
				</div>
				<div class="modal-actions"><button class="primary-button" onclick={() => (showAppThemeDialog = false)}>Save</button></div>
			</div>
		</div>
	{/if}

	{#if showLedgerDialog && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showLedgerDialog = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label="Campaign ledger" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showLedgerDialog = false; }}>
				<button class="close-modal" aria-label="Close ledger" onclick={() => (showLedgerDialog = false)}>×</button>
				<p class="eyebrow">CAMPAIGN RESOURCES</p>
				<h2>Ledger</h2>
				<label>Upkeep<textarea rows="2" bind:value={ledgerUpkeep} onchange={saveCampaignLedger} placeholder="Crew upkeep, debt, or ongoing obligations..."></textarea></label>
				<div class="ledger-items-list">
					{#each ledgerItems as item (item.id)}
						<div class="ledger-item-row">
							<label class="location-toggle" title="Depleted"><input type="checkbox" bind:checked={item.isDepleted} onchange={saveCampaignLedger} /></label>
							<select aria-label="Item value" bind:value={item.value} onchange={saveCampaignLedger}>{#each [0,1,2,3,4,5] as v}<option value={v}>{v}</option>{/each}</select>
							<span>/</span>
							<select aria-label="Item max value" bind:value={item.maxValue} onchange={saveCampaignLedger}>{#each [0,1,2,3,4,5] as v}<option value={v}>{v}</option>{/each}</select>
							<input type="text" placeholder="Item name" bind:value={item.name} onchange={saveCampaignLedger} />
							<button type="button" class="record-delete" aria-label="Delete ledger item" onclick={() => removeLedgerItem(item.id)}><RpIcon name="delete" size={14} /></button>
						</div>
					{/each}
				</div>
				<button type="button" class="secondary-button" onclick={addLedgerItem}>＋ Add item</button>
				<div class="modal-actions"><button class="primary-button" onclick={() => (showLedgerDialog = false)}>Done</button></div>
			</div>
		</div>
	{/if}

	{#if denizenModalSiteId && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (denizenModalSiteId = '')}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label="Delve denizens table" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') denizenModalSiteId = ''; }}>
				<button class="close-modal" aria-label="Close denizens dialog" onclick={() => (denizenModalSiteId = '')}>×</button>
				<p class="eyebrow">DELVE DENIZENS</p>
				<h2>Denizens</h2>
				<button type="button" class="secondary-button" onclick={populateDenizenDraftSlots}><RpIcon name="roll" size={14} /> Populate empty slots</button>
				<div class="denizen-slots-list">
					{#each denizenDraftSlots as slot}
						<label class="denizen-slot-row">
							<span class="denizen-range">{slot.min} – {slot.max}:</span>
							<input type="text" bind:value={slot.name} placeholder={slot.tier} />
						</label>
					{/each}
				</div>
				<div class="modal-actions">
					<button type="button" class="cancel-button" onclick={() => (denizenModalSiteId = '')}>Cancel</button>
					<button type="button" class="primary-button" onclick={saveDenizensModal}>Save</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showCustomOracleDialog && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showCustomOracleDialog = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label="Custom oracle editor" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showCustomOracleDialog = false; }}>
				<button class="close-modal" aria-label="Close custom oracle dialog" onclick={() => (showCustomOracleDialog = false)}>×</button>
				<p class="eyebrow">CUSTOM ORACLE</p>
				<h2>{editingCustomOracleId ? 'Edit custom oracle' : 'New custom oracle'}</h2>
				<label>Oracle name<input type="text" bind:value={customOracleName} placeholder="e.g. Rumored Treasures" /></label>
				<div class="origin-choice" role="group" aria-label="Oracle kind">
					<button type="button" class:chosen={customOracleKind === 'range'} onclick={() => (customOracleKind = 'range')}>Range</button>
					<button type="button" class:chosen={customOracleKind === 'simple'} onclick={() => (customOracleKind = 'simple')}>Simple</button>
				</div>
				<div class="denizen-slots-list">
					{#each customOracleRows as row, idx}
						<div class="ledger-item-row">
							<input type="number" min="1" max="1000" style="width:4.2rem" bind:value={row.min} />
							<span>–</span>
							<input type="number" min="1" max="1000" style="width:4.2rem" bind:value={row.max} />
							<input type="text" bind:value={row.text} placeholder="Result label" />
							{#if customOracleRows.length > 2}
								<button type="button" class="record-delete" onclick={() => (customOracleRows = customOracleRows.filter((_, i) => i !== idx))}><RpIcon name="delete" size={14} /></button>
							{/if}
						</div>
					{/each}
				</div>
				<button type="button" class="secondary-button" onclick={() => { const last = customOracleRows[customOracleRows.length - 1]?.max ?? 0; customOracleRows = [...customOracleRows, { min: last + 1, max: last + (customOracleKind === 'simple' ? 1 : 10), text: '' }]; }}>＋ Add row</button>
				<div class="modal-actions">
					<button type="button" class="cancel-button" onclick={() => (showCustomOracleDialog = false)}>Cancel</button>
					<button type="button" class="primary-button" disabled={!customOracleName.trim()} onclick={saveCustomOracleDraft}>Save oracle</button>
				</div>
			</div>
		</div>
	{/if}

	{#if (portraitModalRecordId || portraitModalForDraft) && activeCampaign}
		{@const targetRecord = portraitModalRecordId ? campaignRecords.find((r) => r.id === portraitModalRecordId) : null}
		{@const currentSrc = portraitModalForDraft ? (recordPortraitDraft || resolveRecordPortrait({ id: editingRecordId || 'draft', kind: recordKind, fields: recordDraft })) : targetRecord ? resolveRecordPortrait(targetRecord) : ''}
		{@const galleryPool = portraitGalleryTab === 'creature' ? CREATURE_PORTRAIT_GALLERY : CHARACTER_PORTRAIT_GALLERY.filter((item) => portraitArchetypeFilter === 'all' || item.category === portraitArchetypeFilter)}
		{@const filteredGallery = galleryPool.filter((item) => !portraitSearch.trim() || `${item.label} ${item.category}`.toLowerCase().includes(portraitSearch.trim().toLowerCase()))}
		<div class="modal-scrim" role="presentation" onclick={closePortraitModal}>
			<div class="setup-modal portrait-picker-modal" role="dialog" aria-modal="true" aria-label="Choose or upload portrait" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') closePortraitModal(); }}>
				<button class="close-modal" aria-label="Close portrait dialog" onclick={closePortraitModal}>×</button>
				<p class="eyebrow">STORYBOOK PORTRAITS · {targetRecord?.fields.Name?.toUpperCase() ?? (recordDraft.Name?.toUpperCase() || 'CHARACTER')}</p>
				<h2>Choose or upload portrait</h2>
				<div class="record-portrait-editor-bar" style="margin-bottom:.65rem">
					<div class="record-portrait-frame lg">
						<img src={currentSrc} alt="Selected portrait" class="record-portrait-img" />
					</div>
					<div class="record-portrait-editor-controls">
						<p class="modal-note" style="margin:0">Pick a portrait from the Four Against Darkness gallery below, roll a random one, or upload your own image.</p>
						<div class="card-action-strip" style="margin:0">
							<label class="bar-btn" style="cursor:pointer"><RpIcon name="export" size={14} /> UPLOAD CUSTOM IMAGE<input type="file" accept="image/*" class="visually-hidden" onchange={(event) => handleCustomPortraitUpload(event, portraitModalForDraft)} /></label>
							<button type="button" class="bar-btn" onclick={() => randomizePortrait(portraitModalForDraft)}><RpIcon name="roll" size={14} /> RANDOM</button>
							<button type="button" class="bar-btn" onclick={() => applyChosenPortrait('')}>RESET TO AUTO</button>
						</div>
					</div>
				</div>
				<div class="origin-choice" role="tablist" aria-label="Portrait gallery category">
					<button type="button" class:chosen={portraitGalleryTab === 'character'} onclick={() => { portraitGalleryTab = 'character'; }}>Adventurers &amp; Heroes ({CHARACTER_PORTRAIT_GALLERY.length})</button>
					<button type="button" class:chosen={portraitGalleryTab === 'creature'} onclick={() => { portraitGalleryTab = 'creature'; }}>NPCs &amp; Creatures ({CREATURE_PORTRAIT_GALLERY.length})</button>
				</div>
				<div style="display:grid;grid-template-columns:{portraitGalleryTab === 'character' ? '1fr 1fr' : '1fr'};gap:.5rem;margin:.5rem 0">
					<label style="margin:0">Search<input type="search" bind:value={portraitSearch} placeholder="Search warrior, ranger, merchant, dragon..." /></label>
					{#if portraitGalleryTab === 'character'}
						<label style="margin:0">Archetype
							<select bind:value={portraitArchetypeFilter}>
								<option value="all">All archetypes (20)</option>
								{#each CHARACTER_PORTRAIT_ARCHETYPES as arch}
									<option value={arch.label}>{arch.label}</option>
								{/each}
							</select>
						</label>
					{/if}
				</div>
				<div class="portrait-gallery-grid" role="listbox" aria-label="Portrait options">
					{#each filteredGallery as item (item.id)}
						<button type="button" class="portrait-gallery-card" class:selected={currentSrc === item.src} onclick={() => applyChosenPortrait(item.src)}>
							<img src={item.src} alt={item.label} loading="lazy" />
							<span>{item.label}</span>
						</button>
					{/each}
				</div>
				<div class="modal-actions">
					<button type="button" class="primary-button" onclick={closePortraitModal}>Done</button>
				</div>
			</div>
		</div>
	{/if}

	{#if heroAssetTargetId && activeCampaign}
		{@const targetHero = campaignRecords.find((r) => r.id === heroAssetTargetId)}
		{@const packMatch = heroAssetTab === 'ironsworn' ? ['classic', 'delve', ...(activeOptions.isIronsmith ? ['ironsmith'] : []), ...(activeOptions.isVaultsAndVows ? ['vaults_and_vows'] : [])] : heroAssetTab === 'vaults_and_vows' ? ['vaults_and_vows'] : heroAssetTab === 'fe_runners' ? ['fe_runners'] : heroAssetTab === 'ancient_wonders' ? ['ancient_wonders'] : heroAssetTab === 'isles' ? ['sundered_isles'] : ['starforged', ...(activeOptions.isStarsmith ? ['starsmith'] : []), ...(activeOptions.isFeRunners ? ['fe_runners'] : []), ...(activeOptions.isAncientWonders ? ['ancient_wonders'] : [])]}
		{@const tabAssets = dataswornLibrary.records.filter((r) => r.type === 'asset' && dataswornLibrary.isEnabled(r.packId) && packMatch.includes(r.packId))}
		{@const tabCategories = Array.from(new Set(tabAssets.map((r) => String(r.data.category ?? 'Asset')).filter(Boolean)))}
		{@const heroDataswornAssets = tabAssets.filter((r) => (heroAssetCategoryFilter === 'all' || String(r.data.category ?? '').toLowerCase() === heroAssetCategoryFilter.toLowerCase()) && (!heroAssetSearch.trim() || `${r.name} ${r.data.category ?? ''} ${r.packTitle} ${r.description}`.toLowerCase().includes(heroAssetSearch.trim().toLowerCase())))}
		<div class="modal-scrim" role="presentation" onclick={() => (heroAssetTargetId = '')}>
			<div class="setup-modal asset-import-modal" role="dialog" aria-modal="true" aria-label="Add assets to hero" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') heroAssetTargetId = ''; }}>
				<button class="close-modal" aria-label="Close hero assets dialog" onclick={() => (heroAssetTargetId = '')}>×</button>
				<p class="eyebrow">HERO ASSETS · {targetHero?.fields.Name?.toUpperCase() ?? 'HERO'}</p>
				<h2>Add assets</h2>
				<div class="origin-choice" role="tablist" aria-label="Asset origin">
					<button type="button" class:chosen={heroAssetTab === 'ironsworn'} onclick={() => { heroAssetTab = 'ironsworn'; heroAssetCategoryFilter = 'all'; }}>Ironsworn</button>
					{#if activeOptions.isVaultsAndVows}
						<button type="button" class:chosen={heroAssetTab === 'vaults_and_vows'} onclick={() => { heroAssetTab = 'vaults_and_vows'; heroAssetCategoryFilter = 'all'; }}>Vaults &amp; Vows</button>
					{/if}
					<button type="button" class:chosen={heroAssetTab === 'starforged'} onclick={() => { heroAssetTab = 'starforged'; heroAssetCategoryFilter = 'all'; }}>Starforged</button>
					<button type="button" class:chosen={heroAssetTab === 'isles'} onclick={() => { heroAssetTab = 'isles'; heroAssetCategoryFilter = 'all'; }}>Sundered Isles</button>
					{#if activeOptions.isFeRunners}
						<button type="button" class:chosen={heroAssetTab === 'fe_runners'} onclick={() => { heroAssetTab = 'fe_runners'; heroAssetCategoryFilter = 'all'; }}>Fe-Runners</button>
					{/if}
					{#if activeOptions.isAncientWonders}
						<button type="button" class:chosen={heroAssetTab === 'ancient_wonders'} onclick={() => { heroAssetTab = 'ancient_wonders'; heroAssetCategoryFilter = 'all'; }}>Ancient Wonders</button>
					{/if}
					<button type="button" class:chosen={heroAssetTab === 'custom'} onclick={() => { heroAssetTab = 'custom'; heroAssetCategoryFilter = 'all'; }}>Custom ({campaignAssets.length})</button>
				</div>
				{#if heroAssetTab !== 'custom'}
					<div class="filters" style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:.5rem 0">
						<label style="margin:0">Search<input type="search" bind:value={heroAssetSearch} placeholder="Filter by name or ability..." /></label>
						<label style="margin:0">Category
							<select bind:value={heroAssetCategoryFilter}>
								<option value="all">All categories ({tabAssets.length})</option>
								{#each tabCategories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</label>
					</div>
					<div class="asset-import-list">
						{#each heroDataswornAssets.slice(0, 120) as dsAsset (`${dsAsset.packId}:${dsAsset.id}`)}
							<div class="asset-import-row">
								<span>
									<strong>{dsAsset.name}</strong>
									<small>{String(dsAsset.data.category ?? 'Asset')} · {dsAsset.packTitle}</small>
								</span>
								<button type="button" class="secondary-button" onclick={() => addDataswornAssetToHero(heroAssetTargetId, dsAsset)}>＋ Add</button>
							</div>
						{/each}
						{#if !heroDataswornAssets.length}<p class="modal-note">No matching Datasworn assets in this category.</p>{/if}
					</div>
				{:else}
					<div class="asset-import-list">
						{#each campaignAssets as cAsset (cAsset.id)}
							<div class="asset-import-row">
								<span><strong>{cAsset.name}</strong><small>{cAsset.category} · {cAsset.origin}</small></span>
								<button type="button" class="secondary-button" onclick={() => addCustomAssetToHero(heroAssetTargetId, cAsset)}>＋ Add</button>
							</div>
						{/each}
						{#if !campaignAssets.length}<p class="modal-note">No custom campaign assets created yet.</p>{/if}
					</div>
				{/if}
				<div class="modal-actions">
					<button type="button" class="primary-button" onclick={() => (heroAssetTargetId = '')}>Done</button>
				</div>
			</div>
		</div>
	{/if}

	{#if heroVowTargetId && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (heroVowTargetId = '')}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label="New personal vow" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') heroVowTargetId = ''; }}>
				<button class="close-modal" aria-label="Close personal vow dialog" onclick={() => (heroVowTargetId = '')}>×</button>
				<p class="eyebrow">PERSONAL VOW</p>
				<h2>New vow</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveHeroPersonalVow(); }}>
					<label>Vow name<input type="text" bind:value={heroVowName} placeholder="Swear an iron vow..." required /></label>
					<div class="rank-field">
						<label>Rank<select bind:value={heroVowRank}>{#each TRACK_RANKS as r}<option value={r}>{r}</option>{/each}</select></label>
						<button type="button" class="secondary-button" onclick={() => (heroVowRank = rollTrackRank())}>Roll</button>
					</div>
					<label class="location-toggle"><input type="checkbox" bind:checked={heroVowThreat} /> Threat</label>
					{#if heroVowThreat}
						<label>Threat name<input type="text" bind:value={heroVowThreatName} placeholder="Unknown threat" /></label>
					{/if}
					<div class="modal-actions">
						<button type="button" class="cancel-button" onclick={() => (heroVowTargetId = '')}>Cancel</button>
						<button type="submit" class="primary-button">Add vow</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showThemeEditor && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showThemeEditor = false)}><div class="setup-modal theme-editor-modal" role="dialog" aria-modal="true" aria-label="Custom theme/domain editor" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showThemeEditor = false; }}><button class="close-modal" aria-label="Close theme editor" onclick={() => (showThemeEditor = false)}>×</button><p class="eyebrow">CUSTOM EXPLORATION TABLE</p><h2>{themeDraft.createdAt ? 'Edit theme/domain' : 'New custom theme/domain'}</h2>
			<div class="tool-tabs theme-kind-tabs">{#each ['Ironsworn theme','Ironsworn domain','Starforged theme'] as kind}<button class:selected={themeDraft.kind === kind} onclick={() => setThemeKind(kind as CustomThemeKind)} disabled={!!themeDraft.createdAt}>{kind}</button>{/each}</div>
			<label>Name<input bind:value={themeDraft.name} maxlength="160" /></label><label>Description<textarea bind:value={themeDraft.description} rows="2"></textarea></label>
			{#each ['features','dangers','perils','opportunities'] as table}{#if themeDraft[table as ThemeTable].length}<h3>{table[0].toUpperCase() + table.slice(1)}</h3>{#each themeDraft[table as ThemeTable] as row}<label>{row.min}–{row.max}<input aria-label={`${table} ${row.min} to ${row.max}`} bind:value={row.text} /></label>{/each}{/if}{/each}
			{#if themeDraft.kind === 'Ironsworn domain'}<h3>Places</h3>{#each themeDraft.places as place, index}<label>Place {index + 1}<input value={place} onchange={(event) => (themeDraft.places[index] = event.currentTarget.value)} /></label>{/each}<button class="secondary-button" onclick={() => (themeDraft.places = [...themeDraft.places, ''])}>＋ Add new place</button>{/if}
			{#if themeError}<p class="notice error" role="alert">{themeError}</p>{/if}<div class="modal-actions"><button class="cancel-button" onclick={() => (showThemeEditor = false)}>Cancel</button><button class="primary-button" onclick={saveThemeDraft}>Save theme/domain</button></div>
		</div></div>
	{/if}

	{#if showAssetImport && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showAssetImport = false)}><div class="setup-modal asset-import-modal" role="dialog" aria-modal="true" aria-label="Import Datasworn asset" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showAssetImport = false; }}>
			<button class="close-modal" aria-label="Close asset import" onclick={() => (showAssetImport = false)}>×</button><p class="eyebrow">ENABLED DATASWORN PACKS</p><h2>Import an asset item</h2>
			<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin:.5rem 0">
				<label style="margin:0">Find asset<input aria-label="Search Datasworn assets" bind:value={assetImportSearch} placeholder="Name, type or pack" /></label>
				<label style="margin:0">Content pack
					<select aria-label="Filter Datasworn asset pack" bind:value={assetImportPackFilter}>
						<option value="all">All enabled packs</option>
						{#each dataswornLibrary.packs.filter((p) => dataswornLibrary.records.some((r) => r.packId === p.id && r.type === 'asset')) as pack}
							<option value={pack.id}>{pack.title}</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="asset-import-list">{#each availableAssets.slice(0, 120) as record (`${record.packId}:${record.id}`)}<div class="asset-import-row"><span><strong>{record.name}</strong><small>{String(record.data.category ?? 'Asset')} · {record.packTitle}</small></span><button class="secondary-button" aria-label={`Import ${record.name} from ${record.packTitle}`} onclick={() => importLibraryAsset(record)}>Import</button></div>{/each}{#if !availableAssets.length}<p class="modal-note">No matching Datasworn assets in enabled packs.</p>{/if}</div>
			{#if availableAssets.length > 120}<p class="modal-note">Showing the first 120 results; narrow the search to find more.</p>{/if}{#if assetError}<p class="notice error" role="alert">{assetError}</p>{/if}
			<div class="modal-actions"><button class="secondary-button" onclick={() => { showAssetImport = false; navigateTo('Rules'); }}>Open Rules library</button><button class="cancel-button" onclick={() => (showAssetImport = false)}>Close</button></div>
		</div></div>
	{/if}

	{#if showAssetEditor && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showAssetEditor = false)}><div class="setup-modal asset-editor-modal" role="dialog" aria-modal="true" aria-label="Custom asset editor" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showAssetEditor = false; }}>
			<button class="close-modal" aria-label="Close asset editor" onclick={() => (showAssetEditor = false)}>×</button><p class="eyebrow">CAMPAIGN ASSET</p><h2>{editingAssetId ? 'Edit asset' : 'New custom asset'}</h2>
			<label>Origin<select bind:value={assetOrigin} onchange={() => (assetCategory = ASSET_TYPES[assetOrigin][0] ?? '')}>{#each ASSET_ORIGINS as origin}<option value={origin}>{origin}</option>{/each}</select></label>
			{#if assetOrigin !== 'Third party'}<label>Asset type<select bind:value={assetCategory}>{#each [...new Set([...ASSET_TYPES[assetOrigin], assetCategory].filter(Boolean))] as kind}<option value={kind}>{kind}</option>{/each}</select></label>{/if}
			<label>Name<input bind:value={assetName} maxlength="160" /></label><label>Description<textarea bind:value={assetDescription} rows="2"></textarea></label>
			<fieldset class="asset-statuses"><legend>Asset statuses</legend>{#each ASSET_STATUSES as status}<label><input type="checkbox" checked={assetStatuses.includes(status)} onchange={() => toggleAssetStatus(status)} /> {status}</label>{/each}</fieldset>
			<label>Primary asset field (optional)<input bind:value={assetFieldLabel} placeholder="Companion name, item name, etc." /></label>
			{#if assetFieldLabel}<label>Field value<input bind:value={assetFieldValue} /></label><label>Secondary asset field (optional)<input bind:value={assetSecondaryFieldLabel} /></label>{/if}
			{#if assetSecondaryFieldLabel}<label>Secondary field value<input bind:value={assetSecondaryFieldValue} /></label>{/if}
			{#each assetAbilities as ability, index}<div class="asset-tier-draft"><label>Tier {index + 1} ability<textarea rows="2" bind:value={ability.text}></textarea></label><label class="truth-toggle"><input type="checkbox" bind:checked={ability.enabled} /> Enabled</label>{#if assetAbilities.length > 3}<button class="secondary-button" aria-label={`Remove tier ${index + 1}`} onclick={() => (assetAbilities = assetAbilities.filter((_, i) => i !== index))}>Remove</button>{/if}</div>{/each}
			<button class="secondary-button" onclick={() => (assetAbilities = [...assetAbilities, { text: '', enabled: false }])}>＋ Add tier</button>
			<label>Track (1 to 10; 0 for no track)<input type="number" min="0" max="10" bind:value={assetTrackMax} /></label><label>Control (0 to 4)<input type="range" min="0" max="4" bind:value={assetRollControl} />{assetRollControl}</label>
			{#if assetError}<p class="notice error" role="alert">{assetError}</p>{/if}<div class="modal-actions"><button class="cancel-button" onclick={() => (showAssetEditor = false)}>Cancel</button><button class="primary-button" onclick={saveAssetDraft}>{editingAssetId ? 'Save asset' : 'Add asset'}</button></div>
		</div></div>
	{/if}

	{#if showTableTools && activeCampaign}
		<div class="tool-scrim" role="presentation" onclick={leaveTableTools}>
			<div class="table-tool-sheet" role="dialog" aria-modal="true" aria-label="Table tools" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showTableTools = false; }} tabindex="-1">
				<header><strong>At the table</strong><button aria-label="Close table tools" onclick={() => (showTableTools = false)}>×</button></header>
				<div class="tool-tabs"><button class:selected={tableTool === 'oracles'} onclick={() => (tableTool = 'oracles')}>Oracles &amp; dice</button><button class:selected={tableTool === 'moves'} onclick={() => (tableTool = 'moves')}>Moves</button></div>
				{#if tableTool === 'moves'}
					<p class="modal-note">Moves for {rulesetNames[activeCampaign.characterRuleset]} character rules{activeCampaign.setting === 'sundered-isles' && activeCampaign.characterRuleset === 'starforged' ? ', with Sundered Isles replacements' : activeCampaign.setting === 'ironsworn' && activeCampaign.characterRuleset === 'ironsworn' ? ', including Delve' : ''}. Open a move to read its rules or roll it.</p>
					<label class="tool-search">Find a move<input aria-label="Search popup moves" bind:value={moveSearch} placeholder="Search moves or categories" /></label>
					<label class="move-scope-toggle"><input type="checkbox" bind:checked={showUnscopedMoves} /> Include unscoped imported moves</label>
					<div class="tool-move-list">{#each moveGroups as group (group.id)}<section class="move-group"><h3>{group.name}<span>{group.moves.length}</span></h3>{#each group.moves as move (`${move.packId}:${move.id}`)}<details><summary>{move.name}<small>{move.packTitle}</small></summary><p>{readableMoveText(typeof move.data.text === 'string' ? move.data.text : move.description || 'Open the item in the Rules library for its full structured data.')}</p><div class="move-actions"><button class="secondary-button" onclick={() => addTrackResolutionToJournal(`${move.name}\n${readableMoveText(typeof move.data.text === 'string' ? move.data.text : move.description)}`)}>Add to Journal</button>{#if move.data.roll_type === 'action_roll'}<button class="secondary-button" onclick={() => openMoveRoll(move)}>Quick roll {move.name}</button>{/if}</div><small class="move-source">{move.sourceTitle}</small></details>{/each}</section>{/each}{#if moveGroups.length === 0}<p class="modal-note">No moves match this search and character ruleset.</p>{/if}</div>
				{:else}
					<div class="tool-oracle-content"><label>Find an oracle<input aria-label="Search popup oracles" bind:value={oracleSearch} placeholder="Search enabled tables" /></label><label>Table<select aria-label="Choose popup oracle" value={activeOracleTable?.id ?? ''} onchange={(event) => { oracleTableId = event.currentTarget.value; oracleResult = null; }}><option value="" disabled>Choose a table</option>{#each filteredOracleTables as table (table.id)}<option value={table.id}>{table.name} · {describeOracleTable(table)}</option>{/each}</select></label>{#if activeOracleTable}<button class="primary-button" onclick={() => rollOracle(activeOracleTable)}><RpIcon name="roll" size={14} /> Roll {activeOracleTable.dice}</button>{/if}{#if oracleError}<p class="notice error" role="alert">{oracleError}</p>{/if}{#if oracleResult}<div class="oracle-result" aria-live="polite"><span class="oracle-roll-number">{oracleResult.result.value}</span><div><strong>{oracleResult.result.row.text}</strong><small>{oracleResult.table.name} · {oracleResult.table.packTitle}</small></div></div><label>Question or context<input bind:value={oracleQuestion} maxlength="500" /></label><button class="secondary-button" onclick={addOracleResultToJournal}>Add to Journal</button>{/if}<details class="tool-extra"><summary>Action &amp; dice</summary><div class="tool-dice-fields"><label>Hero<select bind:value={quickRollHeroId}><option value="">Manual</option>{#each quickRollHeroes as hero (hero.id)}<option value={hero.id}>{hero.fields.Name}</option>{/each}</select></label><label>Stat<select bind:value={quickRollStat}><option value="edge">Edge</option><option value="heart">Heart</option><option value="iron">Iron</option><option value="shadow">Shadow</option><option value="wits">Wits</option></select></label><label>Value<input type="number" min="0" max="10" bind:value={quickRollManualStat} disabled={!!selectedQuickRollHero} /></label><label>Adds<input type="number" min="-10" max="10" bind:value={quickRollAdds} /></label></div><button class="primary-button" onclick={rollQuickAction}><RpIcon name="roll" size={14} /> Roll action</button>{#if actionRollError}<p class="notice error" role="alert">{actionRollError}</p>{/if}{#if actionRollResult}<p class="oracle-source">{actionRollResult.text}</p><button class="secondary-button" onclick={addActionRollToJournal}>Add action to Journal</button>{/if}<div class="tool-dice-fields"><label>Dice<input type="number" min="1" max="20" bind:value={diceRollCount} /></label><label>Sides<input type="number" min="2" max="1000" bind:value={diceRollSides} /></label></div><button class="secondary-button" onclick={rollGenericDice}><RpIcon name="roll" size={14} /> Roll dice</button>{#if diceRollResult}<p>{diceRollResult}</p><button class="secondary-button" onclick={addGenericRollToJournal}>Add dice to Journal</button>{/if}</details><button class="text-action" onclick={() => navigateTo('Rules')}>Browse Datasworn library →</button></div>
				{/if}
			</div>
		</div>
	{/if}

	{#if activeMoveRoll && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (activeMoveRoll = null)}>
			<div class="setup-modal move-roll-modal" role="dialog" aria-modal="true" aria-labelledby="move-roll-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') activeMoveRoll = null; }}>
				<button class="close-modal" aria-label="Close move roll" onclick={() => (activeMoveRoll = null)}>×</button>
				<p class="eyebrow">DATASWORN MOVE · {activeMoveRoll.packTitle.toUpperCase()}</p><h2 id="move-roll-title">{activeMoveRoll.name}</h2>
				<p class="move-trigger">{readableMoveText(typeof activeMoveRoll.data.trigger === 'object' && activeMoveRoll.data.trigger && 'text' in activeMoveRoll.data.trigger && typeof activeMoveRoll.data.trigger.text === 'string' ? activeMoveRoll.data.trigger.text : activeMoveRoll.description)}</p>
				<label>Hero<select bind:value={quickRollHeroId}><option value="">Manual stat</option>{#each quickRollHeroes as hero (hero.id)}<option value={hero.id}>{hero.fields.Name}</option>{/each}</select></label>
				<label>Stat<select bind:value={quickRollStat}>{#each (actionMoveStats(activeMoveRoll).length ? actionMoveStats(activeMoveRoll) : ['edge', 'heart', 'iron', 'shadow', 'wits']) as stat}<option value={stat}>{stat.toUpperCase()}</option>{/each}</select></label>
				{#if selectedQuickRollHero}<p class="modal-note">{selectedQuickRollHero.fields.Name}: {quickRollStat.toUpperCase()} {quickRollStatValue}</p>{/if}
				<label>Adds<input type="number" min="-10" max="10" bind:value={quickRollAdds} /></label>
				{#if actionRollError}<p class="notice error" role="alert">{actionRollError}</p>{/if}
				{#if moveRollResult}<div class="move-outcome" aria-live="polite"><strong>{moveRollResult.outcome}</strong><p>{moveRollResult.actionDie} + {moveRollResult.stat} + {moveRollResult.adds} = {moveRollResult.total} vs {moveRollResult.challengeDice[0]}, {moveRollResult.challengeDice[1]}</p>{#if moveOutcomeText(activeMoveRoll, moveRollResult.outcome)}<p>{readableMoveText(moveOutcomeText(activeMoveRoll, moveRollResult.outcome))}</p>{/if}<button class="secondary-button" onclick={addMoveRollToJournal}>Add result to Journal</button></div>{/if}
				<div class="modal-actions"><button class="cancel-button" onclick={() => (activeMoveRoll = null)}>Close</button><button class="primary-button" onclick={rollSelectedMove}>{moveRollResult ? 'Reroll' : 'Roll move'}</button></div>
			</div>
		</div>
	{/if}

	{#if showCampaignSetup}
		<div class="modal-scrim" role="presentation" onclick={() => (showCampaignSetup = false)}>
					<div class="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showCampaignSetup = false)}>×</button>
				<p class="eyebrow">BEGIN YOUR NEXT CHAPTER</p><h2 id="setup-title">{editingCampaignId ? 'Campaign settings' : 'Shape a campaign'}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveCampaign(); }}>
					<label>Campaign name<input bind:value={campaignName} placeholder="A name for your story" maxlength="100" required /></label>
					<label>Campaign setting<select bind:value={campaignSetting}><option value="ironsworn">Ironsworn</option><option value="starforged">Starforged</option><option value="sundered-isles">Sundered Isles</option></select></label>
					<label>Character rules<select bind:value={characterRuleset}><option value="ironsworn">Ironsworn</option><option value="starforged">Starforged</option></select></label>
					<label class="location-toggle"><input type="checkbox" checked={bottomJournalRolls} onchange={(event) => setJournalRolls(event.currentTarget.checked)} /> Add dice and action rolls to Journal automatically</label>
					<p class="modal-note">Setting and character rules are independent choices. Sundered Isles commonly uses Starforged character rules.</p>
					{#if campaignError}<p class="notice error" role="alert">{campaignError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => (showCampaignSetup = false)}>Cancel</button><button type="submit" class="primary-button">{editingCampaignId ? 'Save changes' : 'Create campaign'}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showCampaignPicker}
		<div class="modal-scrim" role="presentation" onclick={() => (showCampaignPicker = false)}>
			<div class="setup-modal picker-modal" role="dialog" aria-modal="true" aria-labelledby="picker-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showCampaignPicker = false)}>×</button>
				<p class="eyebrow">LOCAL CAMPAIGNS</p><h2 id="picker-title">Choose a campaign</h2>
				{#if campaigns.length}
					<div class="picker-list">{#each campaigns as campaign (campaign.id)}<article class:current={campaign.id === activeCampaignId} class="picker-campaign"><button class="picker-select" onclick={() => selectCampaign(campaign.id)}><strong>{campaign.name}</strong><small>{settingNames[campaign.setting]} · {rulesetNames[campaign.characterRuleset]} rules</small></button><button class="picker-edit" aria-label={`Edit ${campaign.name}`} onclick={() => openEditCampaign(campaign)}>Edit</button><button class="picker-delete" aria-label={`Delete ${campaign.name}`} onclick={() => removeCampaign(campaign.id)}>×</button></article>{/each}</div>
				{:else}<p class="modal-note">No campaigns are saved in this browser yet.</p>{/if}
				<div class="modal-actions"><button type="button" class="cancel-button danger-outline" onclick={() => activeCampaign && removeCampaign(activeCampaign.id)} disabled={!activeCampaign}>Delete current</button><button class="primary-button" onclick={openNewCampaign}>＋ New campaign</button></div>
			</div>
		</div>
	{/if}

	{#if showCampaignTransfer && activeCampaign}
		<div class="modal-scrim" role="presentation" onclick={() => (showCampaignTransfer = false)}>
			<div class="setup-modal transfer-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showCampaignTransfer = false)}>×</button>
				<p class="eyebrow">CAMPAIGN DATA</p><h2 id="transfer-title">Export or import a campaign</h2>
				<p class="modal-note">Campaign exports include this campaign’s settings, Journal, Heroes/NPCs, tracks, sites, locations, factions, maps, truths, assets, and custom themes/domains. Import creates a separate campaign and never overwrites existing data.</p>
				<div class="transfer-actions"><button class="primary-button" onclick={exportActiveCampaign}>Download campaign JSON</button><button class="secondary-button" onclick={() => document.getElementById('campaign-archive-import')?.click()}>Import campaign JSON</button><input id="campaign-archive-import" class="visually-hidden" type="file" accept="application/json,.json" onchange={importCampaignFile} /></div>
				{#if campaignTransferMessage}<p class="notice" role="status">{campaignTransferMessage}</p>{/if}
				{#if campaignTransferError}<p class="notice error" role="alert">{campaignTransferError}</p>{/if}
				<div class="modal-actions"><button class="cancel-button" onclick={() => (showCampaignTransfer = false)}>Close</button></div>
			</div>
		</div>
	{/if}

	{#if showTrackEditor}
		<div class="modal-scrim" role="presentation" onclick={() => (showTrackEditor = false)}>
			<div class="setup-modal track-editor" role="dialog" aria-modal="true" aria-labelledby="track-editor-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showTrackEditor = false)}>×</button>
				<p class="eyebrow">CAMPAIGN PROGRESS</p><h2 id="track-editor-title">{editingTrackId ? 'Edit track' : 'New track'}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveTrack(); }}>
					<label>Name<input bind:value={trackName} placeholder="e.g. Swear an iron vow" maxlength="100" required /></label>
									<label>Type<select bind:value={trackType}>{#each TRACK_TYPES as type}<option value={type}>{type}</option>{/each}</select></label>
									{#if trackType !== 'Clock'}<div class="rank-field"><label>Rank<select bind:value={trackRank}>{#each TRACK_RANKS as rank}<option value={rank}>{rank}</option>{/each}</select></label><button class="secondary-button" type="button" aria-label="Roll rank" title="Roll random rank" onclick={rollTrackRankChoice}><RpIcon name="roll" size={14} /> Roll</button></div><label class="threat-toggle"><input type="checkbox" bind:checked={trackThreat} /><span>Threat</span></label>{#if trackThreat}<label>Threat name<input bind:value={trackThreatName} placeholder="Unknown threat" maxlength="100" /></label>{/if}{/if}
									{#if trackType !== 'Progress'}<label>Clock steps (2–10)<input type="range" min="2" max="10" step="1" bind:value={trackSteps} /><span>{trackSteps} steps</span></label>{/if}
									<p class="modal-note">Progress and Scene use rank-scaled ticks; Clock has 2–10 steps and resolves without challenge dice.</p>
					{#if trackError}<p class="notice error" role="alert">{trackError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => (showTrackEditor = false)}>Cancel</button><button type="submit" class="primary-button">{editingTrackId ? 'Save track' : 'Create track'}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showSavedImportModal && activeCampaign}
		{@const availableSaved =
			savedImportKind === 'hero'
				? savedLibrary.heroes.filter((item) => !campaignRecords.some((existing) => existing.id === item.id))
					.map((item) => ({ id: item.id, name: item.fields.Name || 'Hero', type: 'Hero', origin: item.fields.Origin || 'Ironsworn' }))
				: savedImportKind === 'npc'
					? savedLibrary.npcs.filter((item) => !campaignRecords.some((existing) => existing.id === item.id))
						.map((item) => ({ id: item.id, name: item.fields.Name || 'NPC', type: item.fields['NPC Type'] || 'NPC', origin: item.fields.Origin || 'Ironsworn' }))
					: savedImportKind === 'location'
						? savedLibrary.locations.filter((item) => !campaignLocations.some((existing) => existing.id === item.id))
							.map((item) => ({ id: item.id, name: item.fields.settlementName, type: item.type, origin: item.origin }))
						: savedImportKind === 'faction'
							? savedLibrary.factions.filter((item) => !campaignFactions.some((existing) => existing.id === item.id))
								.map((item) => ({ id: item.id, name: item.fields.name, type: item.type || 'Faction', origin: item.origin }))
							: savedImportKind === 'asset'
								? savedLibrary.assets.filter((item) => !campaignAssets.some((existing) => existing.id === item.id))
									.map((item) => ({ id: item.id, name: item.name, type: item.category || 'Custom', origin: item.origin }))
								: savedImportKind === 'oracle'
									? (savedLibrary.oracles ?? []).filter((item) => !campaignCustomOracles.some((existing) => existing.id === item.id))
										.map((item) => ({ id: item.id, name: item.name, type: item.kind, origin: 'Custom' }))
									: savedLibrary.themes.filter((item) => !campaignThemes.some((existing) => existing.id === item.id))
										.map((item) => ({ id: item.id, name: item.name, type: item.kind, origin: themeDraft.kind.split(' ')[0] || 'Custom' }))}
		<div class="modal-scrim" role="presentation" onclick={() => (showSavedImportModal = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-label={`Import ${savedImportKind}`} tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => { if (event.key === 'Escape') showSavedImportModal = false; }}>
				<button class="close-modal" aria-label="Close import modal" onclick={() => (showSavedImportModal = false)}>×</button>
				<h2>Import {savedImportKind === 'npc' ? 'NPC' : savedImportKind}</h2>
				{#if availableSaved.length === 0}
					<div class="saved-import-empty">⚠ <span>No data available</span></div>
					<p class="modal-note">Use <strong>Export</strong> on any {savedImportKind} card in a campaign to add it to your cross-campaign library, or upload exported data from the Settings menu.</p>
				{:else}
					<table class="saved-import-table">
						<thead>
							<tr><th></th><th>Name</th><th>Type</th><th>Origin</th></tr>
						</thead>
						<tbody>
							{#each availableSaved as row (row.id)}
								<tr>
									<td><input type="checkbox" checked={selectedSavedIds.includes(row.id)} onchange={() => (selectedSavedIds = toggleFilterValue(selectedSavedIds, row.id))} /></td>
									<td><strong>{row.name}</strong></td>
									<td>{row.type}</td>
									<td>{row.origin}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
				<div class="transfer-actions">
					{#if savedImportKind === 'hero' || savedImportKind === 'npc'}
						<button type="button" class="secondary-button" onclick={() => { showSavedImportModal = false; recordKind = savedImportKind as RecordKind; document.getElementById(`${savedImportKind}-import`)?.click(); }}>Import from JSON file</button>
					{:else if savedImportKind === 'asset'}
						<button type="button" class="secondary-button" onclick={() => { showSavedImportModal = false; assetImportSearch = ''; assetError = ''; showAssetImport = true; }}>Browse Datasworn Assets</button>
					{:else if savedImportKind === 'theme'}
						<button type="button" class="secondary-button" onclick={() => { showSavedImportModal = false; navigateTo('Rules'); }}>Open Rules Library</button>
					{/if}
				</div>
				<div class="modal-actions">
					<button type="button" class="cancel-button" onclick={() => (showSavedImportModal = false)}>Cancel</button>
					<button type="button" class="primary-button" disabled={!selectedSavedIds.length} onclick={importSelectedSavedItems}>Import {savedImportKind}</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRecordEditor}
		{@const isCreature = recordKind === 'npc' && recordDraft['NPC Type'] === 'Creature'}
		{@const draftPortraitSrc = recordPortraitDraft || resolveRecordPortrait({ id: editingRecordId || 'draft', kind: recordKind, fields: recordDraft })}
		<div class="modal-scrim" role="presentation" onclick={() => cancelMapRecordCreation('character')}>
			<div class="setup-modal record-editor" role="dialog" aria-modal="true" aria-labelledby="record-editor-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => cancelMapRecordCreation('character')}>×</button>
				<h2 id="record-editor-title">{editingRecordId ? `Edit ${recordKind === 'hero' ? 'hero' : 'NPC'}` : `New ${recordKind === 'hero' ? 'hero' : 'NPC'}`}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveRecord(); }}>
					<div class="record-portrait-editor-bar">
						<button type="button" class="record-portrait-frame lg" title="Choose portrait from gallery" onclick={openPortraitPickerForDraft}>
							<img src={draftPortraitSrc} alt="Character portrait preview" class="record-portrait-img" />
						</button>
						<div class="record-portrait-editor-controls">
							<strong>Portrait</strong>
							<div class="card-action-strip" style="margin:0">
								<button type="button" class="bar-btn" onclick={openPortraitPickerForDraft}><RpIcon name="image" size={14} /> GALLERY</button>
								<button type="button" class="bar-btn" onclick={() => randomizePortrait(true)}><RpIcon name="roll" size={14} /> RANDOM</button>
								<label class="bar-btn" style="cursor:pointer"><RpIcon name="export" size={14} /> UPLOAD<input type="file" accept="image/*" class="visually-hidden" onchange={(event) => handleCustomPortraitUpload(event, true)} /></label>
								{#if recordPortraitDraft}<button type="button" class="bar-btn" onclick={() => (recordPortraitDraft = '')}>AUTO</button>{/if}
							</div>
						</div>
					</div>
					<div class="origin-choice" role="group" aria-label="Character origin">
						{#each ['Ironsworn','Starforged','Sundered Isles'] as origin}
							<button type="button" class:chosen={recordDraft.Origin === origin} aria-pressed={recordDraft.Origin === origin} onclick={() => { recordDraft = { ...recordDraft, Origin: origin }; generationMessage = ''; }}>{origin}</button>
						{/each}
					</div>
					{#if recordKind === 'npc'}
						<div class="origin-choice" role="group" aria-label="NPC type">
							{#each ['NPC', 'Creature'] as ntype}
								<button type="button" class:chosen={(recordDraft['NPC Type'] || 'NPC') === ntype} aria-pressed={(recordDraft['NPC Type'] || 'NPC') === ntype} onclick={() => (recordDraft = { ...recordDraft, 'NPC Type': ntype })}>{ntype}</button>
							{/each}
						</div>
						<div class="faction-toggles">
							<label><input type="checkbox" bind:checked={npcDraftIsBond} /><span>Bond</span></label>
							<label><input type="checkbox" bind:checked={npcDraftIsConnection} /><span>Connection</span></label>
							{#if npcDraftIsConnection}
								<label class="inline-rank-select"><span>Connection rank:</span>
									<select bind:value={npcDraftConnectionRank}>
										{#each TRACK_RANKS as r}<option value={r}>{r}</option>{/each}
									</select>
								</label>
							{/if}
						</div>
					{/if}
					{#if !isCreature}
						<div class="faction-toggles">
							<label><input type="checkbox" bind:checked={useFantasySpecies} onchange={() => { if (!useFantasySpecies) recordDraft = { ...recordDraft, Species: '' }; }} /><span>Roll fantasy species</span></label>
							{#if !useFantasySpecies}
								<label><input type="checkbox" bind:checked={useExtendedNames} /><span>Use extended names table</span></label>
							{/if}
							{#if recordDraft.Origin === 'Sundered Isles'}
								<label><input type="checkbox" bind:checked={recordRollWithCursedDie} /><span>Roll with cursed die</span></label>
							{/if}
						</div>
						<button type="button" class="secondary-button" onclick={() => { if (useFantasySpecies && !recordDraft.Species) rollRecordSpecies(); rollRecordDefaults(); }}><RpIcon name="roll" size={14} /> Roll default fields</button>
					{:else}
						<button type="button" class="secondary-button" onclick={rollAllCreatureFields}><RpIcon name="roll" size={14} /> Roll default fields</button>
					{/if}
					{#if generationMessage}<p class="modal-note" role="status">{generationMessage}</p>{/if}

					{#if isCreature}
						<div class="record-form-grid">
							<div class="generate-field">
								<label>Name<input bind:value={recordDraft.Name} placeholder="Creature name" /></label>
								{#if recordDraft.Name}<button type="button" class="oracle-icon-btn" aria-label="Clear Name" onclick={() => (recordDraft = { ...recordDraft, Name: '' })}>×</button>{/if}
							</div>
							{#each CREATURE_FIELDS as cfield}
								<div class="generate-field">
									<label>{cfield}
										{#if cfield === 'Environment'}
											<select bind:value={recordDraft[cfield]}>
												<option value="">Choose environment</option>
												{#each ['Space', 'Interior', 'Land', 'Liquid', 'Air'] as env}<option value={env}>{env}</option>{/each}
											</select>
										{:else}
											<textarea rows="1" bind:value={recordDraft[cfield]}></textarea>
										{/if}
									</label>
									{#if recordDraft[cfield]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${cfield}`} onclick={() => (recordDraft = { ...recordDraft, [cfield]: '' })}>×</button>{/if}
									<button type="button" class="field-roll" aria-label={`Roll ${cfield}`} onclick={() => rollCreatureFieldOnDraft(cfield)}><RpIcon name="roll" size={14} /></button>
								</div>
							{/each}
							<div class="generate-field">
								<label>Disposition<textarea rows="1" bind:value={recordDraft.Disposition}></textarea></label>
								{#if recordDraft.Disposition}<button type="button" class="oracle-icon-btn" aria-label="Clear Disposition" onclick={() => (recordDraft = { ...recordDraft, Disposition: '' })}>×</button>{/if}
								<button type="button" class="field-roll" aria-label="Roll Disposition" onclick={() => rollRecordField('Disposition')}><RpIcon name="roll" size={14} /></button>
							</div>
							<div class="generate-field">
								<label>Current location<select bind:value={recordDraft['Current location']}><option value="">Unknown</option>{#each campaignLocations as location (location.id)}<option value={location.fields.settlementName}>{location.fields.settlementName}</option>{/each}</select></label>
							</div>
						</div>
					{:else}
						<div class="record-form-grid">
							{#if useFantasySpecies}
								<div class="generate-field">
									<label>Species
										<select bind:value={recordDraft.Species}>
											<option value="">Choose species</option>
											{#each FANTASY_SPECIES as sp}<option value={sp}>{sp}</option>{/each}
										</select>
									</label>
									{#if recordDraft.Species}<button type="button" class="oracle-icon-btn" aria-label="Clear species" onclick={() => (recordDraft = { ...recordDraft, Species: '' })}>×</button>{/if}
									<button type="button" class="field-roll" aria-label="Roll fantasy species" onclick={rollRecordSpecies}><RpIcon name="roll" size={14} /></button>
								</div>
							{/if}
							{#each recordFields as field}
								{#if field !== 'Origin' && field !== 'NPC Type' && field !== 'Bond'}
									{#if field === 'Life events' && recordKind === 'hero'}
										<label class="location-toggle" style="grid-column:1/-1;margin:.2rem 0 0"><input type="checkbox" bind:checked={useLifeEvents} onchange={() => { if (!useLifeEvents) recordDraft = { ...recordDraft, 'Life events': '' }; }} /> Add 1–4 random life events</label>
									{/if}
									<div class="generate-field">
										<label>{field === 'Moniker' && recordDraft.Origin === 'Starforged' ? 'Callsign' : field}
											{#if field === 'Faction'}
												<select bind:value={recordDraft[field]}><option value="">None</option>{#each campaignFactions as faction (faction.id)}<option value={faction.fields.name}>{faction.fields.name}</option>{/each}</select>
											{:else if field === 'Current location'}
												<select bind:value={recordDraft[field]}><option value="">Unknown</option>{#each campaignLocations as location (location.id)}<option value={location.fields.settlementName}>{location.fields.settlementName}</option>{/each}</select>
											{:else}
												<textarea rows={field === 'Description' || field === 'Backstory' || field === 'Life events' || field === 'Motivations' ? 2 : 1} bind:value={recordDraft[field]} disabled={field === 'Life events' && !useLifeEvents} placeholder={field === 'Motivations' ? 'Split motivations with a comma' : field === 'Life events' ? 'Split events with a comma' : ''}></textarea>
											{/if}
										</label>
										{#if field !== 'Faction' && field !== 'Current location' && recordDraft[field]}
											<button type="button" class="oracle-icon-btn" aria-label={`Clear ${field}`} onclick={() => (recordDraft = { ...recordDraft, [field]: '' })}>×</button>
										{/if}
										{#if field === 'Life events'}
											<button type="button" class="field-roll" aria-label="Roll Life events" disabled={!useLifeEvents} onclick={rollRecordLifeEvents}><RpIcon name="roll" size={14} /></button>
										{:else if generationFields('character', recordDraft.Origin as GenerationSetting)[field] && (recordKind === 'npc' ? field !== 'Backstory' && field !== 'Inciting incident' : field !== 'Disposition')}
											<button type="button" class="field-roll" aria-label={`Roll ${field}`} onclick={() => rollRecordField(field)}><RpIcon name="roll" size={14} /></button>
										{/if}
									</div>
								{/if}
							{/each}
						</div>
					{/if}
					{#if recordKind === 'npc' && !editingRecordId}
						<label class="location-toggle"><input type="checkbox" bind:checked={addNextNpc} /> Add next NPC?</label>
					{/if}
					{#if recordKind === 'hero'}
						<div class="modal-stats-editor" role="group" aria-label="Hero stats">
							<p class="modal-stats-title">Stats</p>
							<div class="modal-stats-grid">
								{#each HERO_ATTRIBUTE_STATS as stat}
									<label><span>{stat.label}</span><input type="number" inputmode="numeric" min={stat.min} max={stat.max} value={recordStatsDraft[stat.key]} onchange={(event) => setHeroDraftStat(stat.key, event.currentTarget.value, stat.min, stat.max)} /></label>
								{/each}
							</div>
							<div class="modal-stats-grid">
								{#each HERO_RESOURCE_STATS as stat}
									<label><span>{stat.label}</span><input type="number" inputmode="numeric" min={stat.min} max={stat.max} value={recordStatsDraft[stat.key]} onchange={(event) => setHeroDraftStat(stat.key, event.currentTarget.value, stat.min, stat.max)} /></label>
								{/each}
							</div>
						</div>
					{/if}
					{#if recordError}<p class="notice error" role="alert">{recordError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => cancelMapRecordCreation('character')}>Cancel</button><button type="submit" class="primary-button">{editingRecordId ? 'Save' : `Create ${recordKind === 'hero' ? 'hero' : 'NPC'}`}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showSiteEditor}
		<div class="modal-scrim" role="presentation" onclick={() => cancelMapRecordCreation('site')}>
			<div class="setup-modal site-editor" role="dialog" aria-modal="true" aria-labelledby="site-editor-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => cancelMapRecordCreation('site')}>×</button>
				<h2 id="site-editor-title">{editingSiteId ? 'Edit site' : 'New site'}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveSite(); }}>
					<label>Type<select bind:value={siteType}>{#each SITE_TYPES as type}<option value={type}>{type}</option>{/each}</select></label>
					<label>Rank<select bind:value={siteRank}>{#each SITE_RANKS as rank}<option value={rank}>{rank}</option>{/each}</select></label>
					{#if siteType === 'Shipwreck' || siteType === 'Cave' || siteType === 'Ruin'}<label class="location-toggle"><input type="checkbox" bind:checked={siteCursed} /> Roll with cursed die</label>{/if}
					<button type="button" class="secondary-button" onclick={generateSiteFields}><RpIcon name="roll" size={14} /> Roll default fields</button>
					{#if siteType === 'Delve'}
						<div class="record-form-grid">{#each [['Theme', 'theme'], ['Domain', 'domain'], ['Secondary theme', 'secondaryTheme'], ['Secondary domain', 'secondaryDomain'], ['Description', 'description'], ['Detail', 'detail'], ['Namesake', 'namesake'], ['Place', 'place'], ['Name', 'name'], ['Aspect focus', 'aspectFocus']] as [label, key]}<div class="site-field"><label>{label}{#if key === 'secondaryTheme'}<input type="checkbox" aria-label="Enable secondary theme" bind:checked={siteSecondaryTheme} />{:else if key === 'secondaryDomain'}<input type="checkbox" aria-label="Enable secondary domain" bind:checked={siteSecondaryDomain} />{/if}<textarea rows={key === 'description' || key === 'detail' ? 3 : 1} bind:value={siteDraft[key as keyof typeof siteDraft]} disabled={(key === 'secondaryTheme' && !siteSecondaryTheme) || (key === 'secondaryDomain' && !siteSecondaryDomain)}></textarea></label><button type="button" class="secondary-button" aria-label={`Generate ${label}`} onclick={() => generateSiteField(key as SiteGeneratedField)} disabled={(key === 'secondaryTheme' && !siteSecondaryTheme) || (key === 'secondaryDomain' && !siteSecondaryDomain)}><RpIcon name="roll" size={14} /></button></div>{/each}</div>
					{:else}
						<div class="record-form-grid">{#each SITE_DETAIL_FIELDS[siteType] as field}<div class="site-field"><label>{SITE_DETAIL_LABELS[field]}<textarea rows="1" bind:value={siteDetails[field]}></textarea></label><button type="button" class="secondary-button" aria-label={`Generate ${SITE_DETAIL_LABELS[field]}`} onclick={() => generateTypedSiteField(field)}><RpIcon name="roll" size={14} /></button></div>{/each}<div class="site-field"><label>Name<textarea rows="1" bind:value={siteDraft.name}></textarea></label><button type="button" class="secondary-button" aria-label="Generate site name" onclick={() => generateTypedSiteField('name')}><RpIcon name="roll" size={14} /></button></div><div class="site-field"><label>Theme<textarea rows="1" bind:value={siteDraft.theme}></textarea></label><button type="button" class="secondary-button" aria-label="Generate site theme" onclick={() => generateTypedSiteField('theme')}><RpIcon name="roll" size={14} /></button></div></div>
					{/if}
					{#if siteError}<p class="notice error" role="alert">{siteError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => cancelMapRecordCreation('site')}>Cancel</button><button type="submit" class="primary-button">{editingSiteId ? 'Save' : 'Create site'}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showFactionEditor}
		<div class="modal-scrim" role="presentation" onclick={() => (showFactionEditor = false)}>
			<div class="setup-modal faction-editor" role="dialog" aria-modal="true" aria-labelledby="faction-editor-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showFactionEditor = false)}>×</button>
				<h2 id="faction-editor-title">{editingFactionId ? 'Edit faction' : 'New faction'}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveFaction(); }}>
					<div class="origin-choice" role="group" aria-label="Faction origin">{#each FACTION_ORIGINS as origin}<button type="button" class:chosen={factionOrigin === origin} aria-pressed={factionOrigin === origin} onclick={() => { factionOrigin = origin; generationMessage = ''; }}>{origin}</button>{/each}</div>
					<div class="faction-toggles"><label><input type="checkbox" bind:checked={factionForceCursed} /><span>Force cursed faction</span></label><label><input type="checkbox" bind:checked={factionRollWithCursedDie} /><span>Roll with cursed die</span></label></div>
					<button type="button" class="secondary-button" onclick={rollFactionDefaults}><RpIcon name="roll" size={14} /> Roll all fields</button>
					<div class="generate-field">
						<label>Faction type
							<select bind:value={factionType}>
								<option value="">Choose or roll…</option>
								{#each (factionOrigin === 'Starforged' ? ['Dominion', 'Guild', 'Fringe Group'] : ['Society', 'Organization', 'Empire']) as ftype}
									<option value={ftype}>{ftype}</option>
								{/each}
							</select>
						</label>
						{#if factionType}<button type="button" class="oracle-icon-btn" aria-label="Clear faction type" onclick={() => (factionType = '')}>×</button>{/if}
						<button type="button" class="field-roll" aria-label="Roll faction type" onclick={() => rollFactionField('type')}><RpIcon name="roll" size={14} /></button>
					</div>
					<div class="record-form-grid">
						{#each [
							...(factionForceCursed || factionRollWithCursedDie ? [['Cursed role', 'cursedRole'], ['Cursed aspects', 'cursedAspects'], ['Cursed goals', 'cursedGoals']] : []),
							...(factionOrigin === 'Sundered Isles' ? [['Society chronicles', 'societyChronicles'], ['Society overseers', 'societyOverseers'], ['Society touchstones', 'societyTouchstones'], ['Society identity', 'societyIdentity'], ['Culture', 'culture'], ['Theme', 'theme'], ['Aspect', 'aspect'], ['Persona', 'persona']] : []),
							['Influence', 'influence'],
							['Projects', 'projects'],
							['Relationships', 'relationships'],
							['Name', 'name'],
							['Quirks', 'quirks'],
							['Rumors', 'rumors']
						] as [label, key]}
							<div class="generate-field">
								<label>{label}<textarea rows={['influence', 'projects', 'relationships', 'name'].includes(key) ? 2 : 1} bind:value={factionDraft[key as FactionField]}></textarea></label>
								{#if factionDraft[key as FactionField]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${label}`} onclick={() => (factionDraft = { ...factionDraft, [key]: '' })}>×</button>{/if}
								{#if generationFields('faction', factionOrigin)[key]}<button type="button" class="field-roll" aria-label={`Roll ${label}`} onclick={() => rollFactionField(key as FactionField)}><RpIcon name="roll" size={14} /></button>{/if}
							</div>
						{/each}
					</div>
					{#if factionError}<p class="notice error" role="alert">{factionError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => (showFactionEditor = false)}>Cancel</button><button type="submit" class="primary-button">{editingFactionId ? 'Save' : 'Create faction'}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showLocationEditor}
		<div class="modal-scrim" role="presentation" onclick={() => cancelMapRecordCreation('location')}>
			<div class="setup-modal location-editor" role="dialog" aria-modal="true" aria-labelledby="location-editor-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => cancelMapRecordCreation('location')}>×</button>
				<h2 id="location-editor-title">{editingLocationId ? 'Edit location' : 'New location'}</h2>
				<form onsubmit={(event) => { event.preventDefault(); saveLocation(); }}>
					<div class="origin-choice" role="group" aria-label="Location origin">{#each LOCATION_ORIGINS as origin}<button type="button" class:chosen={locationOrigin === origin} aria-pressed={locationOrigin === origin} disabled={!!editingLocationId} onclick={() => { locationOrigin = origin; locationType = locationTypes[origin][0]; locationRegion = locationRegions[origin][0]; generationMessage = ''; }}>{origin}</button>{/each}</div>
					<div class="origin-choice" role="group" aria-label="Location type">{#each locationTypes[locationOrigin] as type}<button type="button" class:chosen={locationType === type} aria-pressed={locationType === type} onclick={() => { locationType = type; generationMessage = ''; }}>{type}</button>{/each}</div>
					<label>Region<select bind:value={locationRegion}>{#each locationRegions[locationOrigin] as region}<option value={region}>{region}</option>{/each}</select></label>
					{#if locationOrigin === 'Sundered Isles'}<div class="faction-toggles"><label><input type="checkbox" bind:checked={locationRollWithCursedDie} /><span>Roll with cursed die</span></label>{#if locationType === 'Settlement'}<label><input type="checkbox" bind:checked={locationUseExtendedNames} /><span>Use extended names table</span></label>{/if}</div>{:else if locationOrigin === 'Starforged' && locationType === 'Settlement'}<label class="location-toggle"><input type="checkbox" bind:checked={locationUseExtendedNames} /><span>Use extended names table</span></label>{/if}
					<button type="button" class="secondary-button" onclick={rollLocationDefaults}><RpIcon name="roll" size={14} /> Roll default fields</button>
					<div class="record-form-grid">
						{#each fieldsForLocationOrigin(locationOrigin, locationType) as field}
							{@const fLabel = locationFieldLabelFor(locationType, field)}
							<div class="generate-field">
								<label>{fLabel}
									<textarea rows={['description', 'aesthetics', 'projects', 'culturalTouchstones', 'details'].includes(field) ? 2 : 1} bind:value={locationDraft[field]}></textarea>
								</label>
								{#if locationDraft[field]}<button type="button" class="oracle-icon-btn" aria-label={`Clear ${fLabel}`} onclick={() => (locationDraft = { ...locationDraft, [field]: '' })}>×</button>{/if}
								{#if generationFields('location', locationOrigin, locationType)[field]}
									<button type="button" class="field-roll" aria-label={`Roll ${fLabel}`} onclick={() => rollLocationField(field)}><RpIcon name="roll" size={14} /></button>
								{/if}
							</div>
						{/each}
					</div>
					{#if locationError}<p class="notice error" role="alert">{locationError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => cancelMapRecordCreation('location')}>Cancel</button><button type="submit" class="primary-button">{editingLocationId ? 'Save' : 'Create location'}</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if showMapCreator}
		<div class="modal-scrim" role="presentation" onclick={() => (showMapCreator = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-labelledby="map-create-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (showMapCreator = false)}>×</button>
				<p class="eyebrow">THE LAY OF THE LAND</p><h2 id="map-create-title">New map</h2>
				<form onsubmit={(event) => { event.preventDefault(); createMap(); }}>
					<label>Map name<input bind:value={mapNameDraft} maxlength="100" required placeholder="e.g. The Shattered Coast" /></label>
					{#if mapError}<p class="notice error" role="alert">{mapError}</p>{/if}
					<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => (showMapCreator = false)}>Cancel</button><button class="primary-button" type="submit">Create map</button></div>
				</form>
			</div>
		</div>
	{/if}

	{#if selectedMapCell && activeMap}
		<div class="modal-scrim" role="presentation" onclick={() => (selectedMapCell = '')}>
			<div class="setup-modal map-cell-editor" role="dialog" aria-modal="true" aria-labelledby="map-cell-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (selectedMapCell = '')}>×</button>
				<p class="eyebrow">{activeMap.name.toUpperCase()}</p><h2 id="map-cell-title">Map cell {selectedMapCell.replace(':', ', ')}</h2>
				<label>Cell name<input bind:value={mapCellNameDraft} placeholder="Optional name for this region" /></label>
				<label>Cell notes<textarea bind:value={mapCellNotesDraft} rows="3" placeholder="Notes about this map cell"></textarea></label>
				<label>Record type<select bind:value={mapRecordTab} onchange={() => { mapCellRecordId = ''; mapOnlyUnassigned = false; }}><option value="location">Location</option><option value="site">Site</option><option value="character">Character</option></select></label>
				<div class="map-create-actions">{#if mapRecordTab === 'character'}<button type="button" class="secondary-button" onclick={() => createMapCellRecord('character', 'hero')}>Create new hero here</button><button type="button" class="secondary-button" onclick={() => createMapCellRecord('character', 'npc')}>Create new NPC here</button>{:else}<button type="button" class="secondary-button" onclick={() => createMapCellRecord(mapRecordTab)}>Create new {mapRecordTab} here</button>{/if}</div>
				<label class="threat-toggle"><input type="checkbox" bind:checked={mapOnlyUnassigned} /><span>Show only unassigned {mapRecordTab === 'location' ? 'locations' : mapRecordTab === 'site' ? 'sites' : 'characters'}</span></label>
				<label>Assign campaign record<select bind:value={mapCellRecordId}><option value="">Choose a record</option>{#each mapRecords(mapRecordTab).filter((record) => !mapOnlyUnassigned || !Object.values(activeMap.cells).some((cell) => cell.assignments[mapRecordTab]?.includes(record.id))) as record (record.id)}<option value={record.id}>{record.name}</option>{/each}</select></label>
				{#if mapCellRecordId && Object.entries(activeMap.cells).some(([key, cell]) => key !== selectedMapCell && cell.assignments[mapRecordTab]?.includes(mapCellRecordId))}<p class="modal-note">Already on this map: adding it here will move it from its previous cell.</p>{/if}
				{#if activeMap.cells[selectedMapCell]?.assignments[mapRecordTab]?.length}<div class="map-assigned-records"><strong>On this cell</strong>{#each activeMap.cells[selectedMapCell].assignments[mapRecordTab] ?? [] as id (id)}<div><span>{mapRecords(mapRecordTab).find((record) => record.id === id)?.name ?? 'Missing campaign record'}</span><button type="button" class="secondary-button" onclick={() => unassignMapRecord(selectedMapCell, mapRecordTab, id)}>Remove</button></div>{/each}</div>{/if}
				<p class="modal-note">Add another record to this cell or remove one already here. Paint and Path tools edit the grid directly.</p>
				<div class="modal-actions"><button type="button" class="cancel-button" onclick={() => (selectedMapCell = '')}>Cancel</button><button type="button" class="primary-button" onclick={saveMapCellDetails}>{mapCellRecordId ? 'Add record & save' : 'Save cell'}</button></div>
			</div>
		</div>
	{/if}

	{#if resolvingTrackId && resolutionRoll}
		<div class="modal-scrim" role="presentation" onclick={() => (resolvingTrackId = '', resolutionRoll = '')}>
			<div class="setup-modal resolution-modal" role="dialog" aria-modal="true" aria-labelledby="resolution-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<button class="close-modal" aria-label="Close" onclick={() => (resolvingTrackId = '', resolutionRoll = '')}>×</button>
				<p class="eyebrow">TRACK RESOLVED</p><h2 id="resolution-title">Outcome recorded</h2>
				<p class="track-resolution-result">{shownTrackResolution}</p>
				<p class="modal-note">The completed track and this roll have been saved to this campaign. The result is also in Journal.</p>
				<div class="modal-actions"><button class="secondary-button" onclick={() => (resolvingTrackId = '', resolutionRoll = '')}>Close</button><button class="primary-button" onclick={() => { resolvingTrackId = ''; resolutionRoll = ''; activeArea = 'Journal'; }}>Open Journal</button></div>
			</div>
		</div>
	{/if}
</main>

<style>
	.shell { height: 100dvh; display: flex; flex-direction: column; overflow: hidden; color: var(--ink); background: linear-gradient(135deg, #f3e8d0, #e6d5b4); }
	.shell.dark-shell { filter: invert(.9) hue-rotate(180deg); }
	.site-header { flex: none; z-index: 20; background: linear-gradient(180deg, #faf1dd, #efe1c2); border-bottom: 2px solid var(--brass); box-shadow: 0 3px 12px rgba(20, 15, 10, 0.22); }
	.site-toolbar { height: 50px; padding: 0 .85rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; max-width: 2137px; margin: 0 auto; }
	.site-brand-row { display: flex; align-items: center; gap: .55rem; min-width: 0; }
	.campaign-duo-badge { flex: none; width: 2.25rem; height: 2.25rem; display: grid; place-items: center; border-radius: 7px; background: #214c48; color: #f3d98c; border: 1.5px solid #b4893c; box-shadow: 0 2px 5px rgba(0,0,0,0.3); overflow: hidden; padding: 0; }
	.badge-emblem-img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.card-emblem-sm { width: 2.2rem; height: 2.2rem; border-radius: 6px; border: 1.5px solid #b4893c; box-shadow: 0 2px 5px rgba(0,0,0,0.25); object-fit: cover; flex: none; background: #efe2c4; }
	.record-portrait-frame { position: relative; width: 4.4rem; height: 5.5rem; padding: 0; border-radius: 8px; border: 2px solid #1f4b48; box-shadow: 0 3px 8px rgba(20, 14, 8, 0.28), inset 0 0 0 1.5px #d9b66a; overflow: hidden; flex: none; background: #efe2c4; cursor: pointer; transition: transform .1s, filter .15s; }
	.record-portrait-frame:hover { transform: translateY(-1px); filter: brightness(1.04); }
	.record-portrait-frame.lg { width: 5.2rem; height: 6.5rem; }
	.record-portrait-img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
	.record-portrait-badge { position: absolute; right: 3px; bottom: 3px; width: 1.25rem; height: 1.25rem; border-radius: 4px; background: rgba(31, 75, 72, 0.88); color: #f8eed8; border: 1px solid #d9b66a; display: grid; place-items: center; opacity: 0.85; }
	.record-portrait-editor-bar { display: flex; align-items: center; gap: .8rem; padding: .6rem .75rem; margin-bottom: .55rem; border: 1.5px solid #b9a47a; border-radius: 8px; background: #f8efda; }
	.record-portrait-editor-controls { display: grid; gap: .35rem; min-width: 0; }
	.portrait-picker-modal { width: min(100%, 44rem); box-sizing: border-box; overflow-x: hidden; }
	.portrait-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.6rem, 1fr)); gap: .55rem; max-height: min(52vh, 26rem); overflow-y: auto; padding: .35rem; border: 1.5px solid #b9a47a; border-radius: 8px; background: #f6ecd6; margin: .5rem 0; }
	.portrait-gallery-card { display: grid; gap: .25rem; padding: .3rem; border: 2px solid #c5b186; border-radius: 7px; background: #fffaf0; color: #2b2116; cursor: pointer; text-align: center; transition: transform .08s, border-color .12s; }
	.portrait-gallery-card:hover { transform: translateY(-1px); border-color: #214c48; background: #f4e6c8; }
	.portrait-gallery-card.selected { border-color: #1f4b48; background: #214c48; color: #fff8e5; box-shadow: 0 0 0 2px #d9b66a; }
	.portrait-gallery-card img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; object-position: center top; border-radius: 5px; display: block; background: #efe2c4; }
	.portrait-gallery-card span { font: 700 .62rem/1.15 var(--font-head); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.empty-emblem { width: 4rem; height: 4rem; border-radius: 10px; border: 2px solid #214c48; box-shadow: 0 4px 10px rgba(0,0,0,0.25), inset 0 0 0 1px #d9b66a; object-fit: cover; margin-bottom: .35rem; }
	.inline-emblem-xs { width: 1.15rem; height: 1.15rem; border-radius: 3px; object-fit: cover; }
	.roller-btn-emblem { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
	.drawer-tab-emblem { width: 1.35rem; height: 1.35rem; border-radius: 4px; border: 1px solid #b4893c; object-fit: cover; flex: none; }
	.record-title-cluster { display: flex; align-items: center; gap: .6rem; min-width: 0; }
	.record-header-right { display: flex; align-items: center; gap: .4rem; flex: none; }
	.record-pronouns { font: 500 .72rem var(--font-sans); color: #6e5e43; margin-left: .25rem; }
	.badge-tag { display: inline-block; padding: .08rem .4rem; border-radius: 99px; background: #214c48; color: #f6ecd7; font: 700 .58rem var(--font-head); letter-spacing: .04em; }
	.initiative-pill { border: 1.5px solid #9b8250; border-radius: 99px; padding: .22rem .6rem; background: #f2e5ca; color: #4a3b25; font: 700 .64rem var(--font-head); letter-spacing: .04em; cursor: pointer; box-shadow: 0 1px 0 #9b8250; }
	.initiative-pill.in-control { background: linear-gradient(180deg, #3f7f77, #1f4b48); color: #f6ecd7; border-color: #d9b66a; }
	.initiative-pill.bad-spot { background: linear-gradient(180deg, #a03a2d, #7d2b22); color: #f6ecd7; border-color: #d9b66a; }
	.campaign-title-btn { min-width: 0; border: 0; background: transparent; padding: .2rem .35rem; border-radius: 5px; text-align: left; cursor: pointer; }
	.campaign-title-btn:hover { background: #e8dac0; }
	.campaign-title-btn h1 { margin: 0; font: 700 1.25rem/1.2 var(--font-head); color: #282015; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55vw; }
	.header-actions { display: flex; align-items: center; gap: .4rem; }
	.icon-button { display: grid; place-items: center; color: #1f4b48; background: linear-gradient(180deg, #f8eed9, #e5d3ab); border: 1.5px solid #214c48; box-shadow: 0 2px 0 #214c48, inset 0 1px 0 rgba(255,255,255,0.6); border-radius: 7px; width: 2.15rem; height: 2.15rem; font-size: .95rem; cursor: pointer; }
	.icon-button:hover { background: #e3d1ab; }
	.icon-button:active { transform: translateY(1px); box-shadow: 0 1px 0 #214c48; }
	.settings-dropdown { position: relative; }
	.settings-dropdown > summary { list-style: none; }
	.settings-dropdown > summary::-webkit-details-marker { display: none; }
	.app-settings-menu { position: absolute; right: 0; top: calc(100% + .35rem); z-index: 40; width: 17.5rem; max-height: calc(100dvh - 92px); overflow-y: auto; padding: .55rem; border: 1px solid #b89f6d; border-radius: 6px; background: #fcf5e6; box-shadow: 0 18px 40px #1b160d45; display: grid; gap: .3rem; }
	.settings-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .35rem .45rem; border-radius: 4px; font: 600 .76rem var(--font-sans); color: #2f2518; cursor: pointer; }
	.settings-toggle-row:hover { background: #efe2c8; }
	.settings-toggle-row input { accent-color: #255953; width: 1rem; height: 1rem; }
	.settings-nav-options { border-radius: 4px; background: #efe3ca; padding: .2rem .35rem; }
	.settings-nav-options > summary { cursor: pointer; padding: .3rem .15rem; font: 700 .75rem var(--font-head); color: #244e49; }
	.settings-nav-list { display: grid; gap: .15rem; padding-top: .2rem; }
	.settings-action-btn { width: 100%; text-align: left; padding: .48rem .65rem; border: 1px solid #c5b186; border-radius: 5px; background: #f2e6cc; color: #254d48; font: 700 .72rem var(--font-head); letter-spacing: .04em; cursor: pointer; }
	.settings-action-btn:hover:not(:disabled) { background: #e4d3b0; }
	.settings-action-btn:disabled { opacity: .45; cursor: not-allowed; }
	.settings-hint { margin: .25rem .4rem; font-size: .72rem; color: #6e5e43; }
	.nav-stripe { height: 36px; background: var(--theme-primary, #214c48); color: #f6ecd7; display: flex; align-items: center; justify-content: center; padding: 0 .25rem; }
	.tabs-arrow { flex: none; width: 1.8rem; height: 32px; border: 0; background: transparent; color: #f6ecd7; font-size: 1.25rem; cursor: pointer; display: none; }
	.tabs { display: flex; align-items: stretch; justify-content: center; gap: .15rem; height: 36px; overflow-x: auto; scrollbar-width: none; max-width: 100%; }
	.tabs::-webkit-scrollbar { display: none; }
	.tabs button { padding: 0 .8rem; color: #e8dcc2; background: transparent; border: 0; border-bottom: 3px solid transparent; white-space: nowrap; font: 700 .72rem var(--font-head); letter-spacing: .06em; cursor: pointer; transition: background .15s, color .15s; }
	.tabs button:hover { background: #ffffff14; color: #fff; }
	.tabs .tab-active { color: #fff; border-bottom-color: #e5c168; background: #ffffff1c; }
	.tabs button:disabled { opacity: .42; cursor: not-allowed; }
	.workspace { flex: 1; min-height: 0; width: 100%; max-width: 2137px; margin: 0 auto; display: flex; position: relative; overflow: hidden; background: linear-gradient(rgba(242, 230, 204, 0.84), rgba(232, 216, 184, 0.88)), var(--parch-texture) center / 420px repeat, #eadbc0; }
	.main-pane { flex: 1; min-width: 0; height: 100%; overflow-y: auto; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
	.content { flex: 1; padding: .85rem 1.2rem 1rem; max-width: 86rem; width: 100%; margin: 0 auto; box-sizing: border-box; }
	.eyebrow { margin: 0 0 .3rem; color: #79653e; font: 700 .68rem var(--font-head); letter-spacing: .16em; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { font: 700 1.8rem/1.05 var(--font-head); margin-bottom: .2rem; color: #282015; }
	.bottom-dice.site-footer { position: sticky; bottom: 0; z-index: 12; width: 100%; max-width: calc(600px - 2rem); margin: 0 auto; padding: .45rem .5rem; box-sizing: border-box; pointer-events: none; display: grid; justify-items: center; }
	.bottom-dice-trigger { pointer-events: auto; display: grid; place-items: center; width: 3.1rem; height: 3.1rem; padding: 2px; border: 2.5px solid #d9b66a; border-radius: 50%; background: #214c48; color: #fff0d3; box-shadow: 0 8px 20px rgba(15, 12, 8, 0.55), inset 0 0 0 1.5px #1f4b48; cursor: pointer; overflow: hidden; }
	.bottom-closed-actions { width: 100%; display: flex; align-items: center; justify-content: center; gap: .45rem; pointer-events: none; }
	.footer-empty, .mobile-drawer-btn, .roller-drawer-btn, .drawer-mobile-backdrop { display: none; }
	.bottom-dice-panel { pointer-events: auto; position: relative; box-sizing: border-box; width: 100%; overflow: visible; border: 2.5px solid #1f4b48; border-radius: 10px; background: linear-gradient(rgba(247, 238, 216, 0.94), rgba(235, 220, 188, 0.96)), var(--parch-texture) center / 420px repeat, #f7eed8; padding: .6rem; box-shadow: 0 18px 50px -8px rgba(15, 12, 8, 0.55), inset 0 0 0 1.5px #d9b66a; color: #30291e; }
	.bottom-dice-options { display: flex; flex-wrap: wrap; gap: .3rem; margin: 0; }
	.bottom-dice-options button { border: 1.5px solid #214c48; border-radius: 6px; padding: .42rem .55rem; background: linear-gradient(180deg, #faf1dd, #e8d7b4); color: #1f4b48; font: 700 .76rem var(--font-head); box-shadow: 0 1px 0 #214c48; cursor: pointer; }
	.bottom-dice-options button:hover { background: linear-gradient(180deg, #fdf6e6, #eedec0); }
	.bottom-dice-options button.chosen { border-color: #b4893c; background: linear-gradient(180deg, #3f7f77, #1f4b48); color: #fff8e8; }
	.bottom-dice-result { display: flex; align-items: center; justify-content: center; gap: .5rem; flex-wrap: wrap; padding: .2rem 0 .45rem; font: 700 .9rem var(--font-head); }
	.bottom-dice-result.cursed-result strong { color: #5d2b66; }
	.result-close { display: grid; place-items: center; width: 1.3rem; height: 1.3rem; padding: 0; border: 1px solid #534632; border-radius: 50%; background: transparent; color: #534632; font-size: .78rem; cursor: pointer; }
	.bottom-result-options { position: relative; }
	.bottom-result-options > summary { color: #245e58; font: .67rem var(--font-head); cursor: pointer; list-style: none; padding: 0 .3rem; font-size: 1rem; }
	.bottom-result-options > summary::-webkit-details-marker { display: none; }
	.bottom-result-options[open] > button { position: absolute; right: 0; top: 100%; z-index: 2; width: max-content; padding: .5rem; border: 1px solid #b9a77d; border-radius: 4px; background: #fff9ec; box-shadow: 0 5px 14px #29261d55; }
	.bottom-action-result { text-align: center; padding: .3rem 0 .45rem; }
	.bottom-outcome { display: flex; align-items: center; justify-content: center; gap: .45rem; font: 700 .92rem var(--font-head); }
	.bottom-outcome button { display: grid; place-items: center; width: 1.25rem; height: 1.25rem; padding: 0; border: 1px solid #534632; border-radius: 50%; background: transparent; color: #534632; font-size: .78rem; cursor: pointer; }
	.bottom-action-equation { display: flex; justify-content: center; align-items: center; gap: .38rem; white-space: nowrap; padding: .65rem 0 .25rem; font: 700 .95rem var(--font-head); }
	.bottom-action-equation .roll-die { position: relative; flex: none; border: 0; border-radius: 8px; width: 2.85rem; height: 2.85rem; padding: 0; background: transparent; color: #fff6dc; font: 700 1.2rem var(--font-head); cursor: pointer; display: grid; place-items: center; }
	.bottom-action-equation .roll-die:disabled { opacity: .65; cursor: not-allowed; }
	.die-badge { position: absolute; top: -.2rem; right: -.2rem; width: 1.15rem; height: 1.15rem; border-radius: 50%; background: #2b2116; color: #f9efd8; border: 1.5px solid #d9b66a; font-size: .65rem; display: grid; place-items: center; line-height: 1; }
	.die-lock { position: absolute; bottom: -.2rem; right: -.2rem; width: 1.15rem; height: 1.15rem; border-radius: 50%; background: #7d2b22; color: #f9efd8; border: 1.5px solid #d9b66a; display: grid; place-items: center; line-height: 1; }
	.bottom-action-equation b { font-size: 1.25rem; color: #8a3438; }
	.bottom-action-equation b.hit-strong { color: #246b46; }
	.bottom-action-equation b.hit-weak { color: #a6631b; }
	.bottom-action-equation b.hit-miss { color: #9c2b2b; }
	.bottom-result-save { border: 0; background: transparent; color: #245e58; text-decoration: underline; font: 700 .72rem var(--font-head); cursor: pointer; }
	.bottom-hero-picker, .bottom-dice-field { display: flex; gap: .5rem; align-items: center; justify-content: center; margin: .25rem 0; font: 700 .72rem var(--font-head); }
	.bottom-hero-picker select, .bottom-dice-field select { min-height: 2rem; border: 1px solid #b9a77d; border-radius: 5px; background: #fff9eb; color: #2d372f; }
	.bottom-stat-options { display: grid; gap: .38rem; }
	.bottom-stat-options > div { display: flex; width: 100%; border: 1px solid #c7b798; border-radius: 4px; overflow: hidden; }
	.bottom-stat-options button { min-width: 0; flex: 1; border: 0; border-right: 1px solid #dcd0b8; background: #fff9ed; color: #3b3629; padding: .42rem .1rem; font: 700 .64rem var(--font-head); cursor: pointer; }
	.bottom-stat-options button:last-child { border-right: 0; }
	.bottom-stat-options button.chosen { background: #2c6860; color: #fff8e5; }
	.bottom-roll-settings { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .45rem 0; }
	.bottom-select-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; gap: .5rem; flex: 1; }
	.stat-pill { display: flex; align-items: center; justify-content: space-between; height: 2rem; border: 1px solid #c4b28a; border-radius: 4px; overflow: hidden; background: #fff9eb; max-width: 10.5rem; }
	.stat-pill-label { flex: 1; background: #e6d8bc; color: #382f21; font: 700 .68rem var(--font-head); padding: 0 .55rem; height: 100%; display: flex; align-items: center; letter-spacing: .04em; }
	.stat-pill select { border: 0; background: transparent; color: #2d2518; font: 700 .75rem var(--font-sans); height: 100%; padding: 0 .45rem; min-width: 2.8rem; text-align: center; }
	.stat-clear { width: 1.5rem; height: 1.5rem; border: 1px solid #b9a77d; border-radius: 50%; background: #f2e5c9; color: #433724; font-size: .8rem; display: grid; place-items: center; padding: 0; cursor: pointer; }
	.bottom-roll-actions { display: flex; justify-content: center; align-items: center; gap: .8rem; padding: .2rem 0; }
	.bottom-roll-actions > button, .bottom-dice-menu > summary { display: grid; place-items: center; width: 2.85rem; height: 2.85rem; padding: 2px; border: 2px solid #b4893c; border-radius: 50%; background: linear-gradient(180deg, #2d6560, #1f4b48); color: #fff6e1; font-size: 1.3rem; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.3); overflow: hidden; }
	.bottom-roll-actions > button:first-child { background: #dfd6bf; color: #2e3d38; border-color: #9b8250; }
	.bottom-roll-actions > .bottom-cursed-button { background: #4a2352; color: #f9e8ff; border-color: #d9b66a; }
	.bottom-roll-actions > button:disabled { opacity: .45; cursor: not-allowed; }
	.bottom-dice-menu { position: relative; }
	.bottom-dice-menu > summary { list-style: none; }
	.bottom-dice-menu > summary::-webkit-details-marker { display: none; }
	.bottom-dice-menu .bottom-dice-options { position: absolute; bottom: calc(100% + .5rem); right: -.5rem; z-index: 30; width: 11rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: .32rem; padding: .5rem; border: 2px solid #1f4b48; border-radius: 8px; background: linear-gradient(rgba(251, 244, 228, 0.98), rgba(238, 224, 195, 0.99)); box-shadow: 0 10px 26px rgba(15, 12, 8, 0.45), inset 0 0 0 1.5px #d9b66a; }
	.bottom-dice-menu .bottom-dice-options button:first-child { grid-column: span 2; }
	.site-drawer { width: 460px; flex: none; height: 100%; overflow-y: auto; background: #faf3e3; border-left: 1px solid #c5b28a; display: flex; flex-direction: column; box-sizing: border-box; z-index: 15; }
	.drawer-top-row { display: flex; align-items: center; justify-content: space-between; padding: .45rem .8rem; }
	.drawer-hide-btn { border: 1px solid #c5b28a; border-radius: 5px; background: #efe3ca; color: #362c1e; padding: .3rem .65rem; font: 700 .68rem var(--font-head); letter-spacing: .06em; cursor: pointer; }
	.drawer-hide-btn:hover { background: #e2d1ae; }
	.drawer-toast { font: 700 .68rem var(--font-head); color: #246359; background: #dfeee9; border: 1px solid #8ab8ae; padding: .2rem .5rem; border-radius: 4px; }
	.drawer-ruleset-tabs { display: flex; border-top: 1px solid #d8c9a8; border-bottom: 1px solid #d8c9a8; background: #f3e7ce; }
	.drawer-ruleset-tabs button { flex: 1; padding: .5rem .35rem; border: 0; border-bottom: 3px solid transparent; background: transparent; color: #5b4d36; font: 700 .72rem var(--font-head); display: flex; align-items: center; justify-content: center; gap: .35rem; cursor: pointer; }
	.drawer-ruleset-tabs button.active { color: #1f4b48; border-bottom-color: #1f4b48; background: #faf3e3; }
	.drawer-section { padding: .55rem .8rem; border-bottom: 1px solid #dfd1b4; }
	.oracle-input-roll { display: flex; align-items: center; gap: .3rem; width: 100%; }
	.oracle-field { flex: 1; min-width: 0; display: grid; gap: .1rem; }
	.oracle-field-label { font: 600 .62rem var(--font-head); color: #6c5b3f; letter-spacing: .03em; }
	.oracle-field input { width: 100%; min-width: 0; border: 0; border-bottom: 1px solid #d5c5a3; background: transparent; color: #261e13; font: 500 .78rem var(--font-sans); padding: .2rem 0; outline: none; }
	.oracle-field input:focus { border-bottom-color: #214c48; }
	.oracle-prefix-input { display: flex; align-items: center; gap: .3rem; }
	.oracle-roll-prefix { font: 700 .78rem var(--font-head); color: #214c48; white-space: nowrap; }
	.oracle-icon-btn { flex: none; width: 1.9rem; height: 1.9rem; border: 0; border-radius: 50%; background: transparent; color: #362c1e; font-size: .95rem; display: grid; place-items: center; cursor: pointer; }
	.oracle-icon-btn:hover:not(:disabled) { background: #e8dac0; }
	.oracle-icon-btn:disabled { opacity: .35; cursor: not-allowed; }
	.odds-buttons { display: flex; flex-wrap: nowrap; justify-content: center; gap: .25rem; margin-bottom: .45rem; }
	.odds-btn { border: 1px solid #c5b28a; border-radius: 4px; background: #f1e4c9; color: #2f2518; padding: .26rem .38rem; font: 700 .56rem var(--font-head); letter-spacing: .03em; white-space: nowrap; cursor: pointer; }
	.odds-btn:hover { background: #e2d1ae; }
	.ask-oracle-event { margin: .35rem 0 0; font-size: .74rem; color: #244e49; }
	.drawer-panels { display: flex; flex-direction: column; padding-bottom: 2.5rem; }
	.drawer-group { border-bottom: 1px solid #d8c9a8; }
	.drawer-group-header { list-style: none; display: flex; align-items: center; justify-content: space-between; padding: .7rem .85rem; font: 600 1.05rem var(--font-head); color: #282015; cursor: pointer; background: #faf3e3; }
	.drawer-group-header::-webkit-details-marker { display: none; }
	.drawer-group-header::after { content: '⌄'; font-size: .95rem; opacity: .75; }
	.drawer-group[open] > .drawer-group-header { background: #214c48; color: #f6ecd7; }
	.drawer-group[open] > .drawer-group-header::after { content: '⌃'; }
	.drawer-group-body { background: #faf3e3; }
	.drawer-search-row { display: flex; align-items: center; gap: .45rem; padding: .5rem .75rem; border-bottom: 1px solid #e2d5ba; }
	.drawer-search-row input { flex: 1; min-width: 0; height: 2rem; padding: 0 .55rem; border: 1px solid #bfa97d; border-radius: 4px; background: #fffaf0; color: #2a2115; font-size: .76rem; }
	.drawer-close-all { flex: none; height: 2rem; padding: 0 .6rem; border: 1px solid #c5b28a; border-radius: 4px; background: #efe3ca; color: #362c1e; font: 700 .64rem var(--font-head); cursor: pointer; }
	.drawer-close-all:disabled { opacity: .45; cursor: not-allowed; }
	.drawer-move-list, .drawer-oracle-list { display: flex; flex-direction: column; }
	.drawer-move-row:nth-child(odd), .drawer-oracle-cat:nth-child(odd) { background: #f2e6ce; }
	.drawer-move-summary, .drawer-oracle-cat-summary { list-style: none; display: flex; align-items: center; justify-content: space-between; padding: .5rem .8rem; cursor: pointer; }
	.drawer-move-summary::-webkit-details-marker, .drawer-oracle-cat-summary::-webkit-details-marker { display: none; }
	.drawer-move-summary::after, .drawer-oracle-cat-summary::after { content: '⌄'; font-size: .85rem; color: #5b4d36; }
	.drawer-move-row[open] > .drawer-move-summary::after, .drawer-oracle-cat[open] > .drawer-oracle-cat-summary::after { content: '⌃'; }
	.drawer-move-meta { display: flex; flex-direction: column; align-items: flex-start; gap: .18rem; }
	.drawer-move-name, .drawer-oracle-cat-summary { font: 600 .88rem var(--font-head); color: #261e13; }
	.drawer-move-badge { display: inline-block; padding: .1rem .42rem; border-radius: 4px; color: #fff; font: 700 .58rem var(--font-sans); letter-spacing: .03em; }
	.drawer-move-detail { padding: .55rem .85rem .75rem; background: #fcf6e8; border-top: 1px solid #e2d5ba; display: grid; gap: .55rem; }
	.drawer-move-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
	.drawer-inline-btn { border: 1px solid #bfa97d; border-radius: 4px; background: #f1e4c9; color: #214c48; padding: .3rem .55rem; font: 700 .64rem var(--font-head); cursor: pointer; }
	.drawer-inline-btn:hover { background: #e3d1ab; }
	.drawer-move-text { font-size: .76rem; line-height: 1.5; color: #2e2418; white-space: pre-line; }
	.embedded-move-oracle { padding-top: .35rem; border-top: 1px dashed #d8c9a8; }
	.drawer-oracle-cat-items { padding: .35rem .85rem .65rem; background: #fcf6e8; border-top: 1px solid #e2d5ba; display: grid; gap: .4rem; }
	.mini-journal-toggle { display: inline-flex; align-items: center; gap: .3rem; font: 600 .68rem var(--font-sans); margin-left: auto; margin-right: .6rem; }
	.mini-journal-body { padding: .65rem .8rem; display: grid; gap: .55rem; }
	.mini-journal-entry { padding: .45rem .6rem; border-left: 3px solid #b4893c; background: #f2e6ce; border-radius: 4px; }
	.mini-journal-entry time { display: block; font-size: .62rem; color: #6e5e43; margin-bottom: .15rem; }
	.mini-journal-entry p { margin: 0; font-size: .74rem; white-space: pre-line; }
	.mini-journal-form { display: grid; gap: .4rem; }
	.mini-journal-form textarea { width: 100%; box-sizing: border-box; padding: .45rem; border: 1px solid #bfa97d; border-radius: 4px; background: #fffaf0; font-size: .75rem; }
	.drawer-aside { flex: none; padding: .85rem .65rem 0 0; display: flex; flex-direction: column; align-items: center; }
	.drawer-reopen-btn { border: 0; background: transparent; display: flex; flex-direction: column; align-items: center; gap: .65rem; cursor: pointer; }
	.drawer-reopen-avatar { width: 2.6rem; height: 2.6rem; border-radius: 50%; border: 3px solid #fbf4e4; background: #214c48; color: #f6ecd7; display: grid; place-items: center; font-size: 1.2rem; box-shadow: 0 10px 20px #161f1c35; }
	.drawer-reopen-label { background: #faf3e3; border: 1px solid #c5b28a; border-radius: 50px; color: #282015; font: 700 1.05rem var(--font-head); padding: 1.1rem .45rem; writing-mode: vertical-rl; box-shadow: 0 10px 20px #161f1c25; }
	.app-menu-modal { text-align: center; }
	.app-menu-links { list-style: none; padding: 0; margin: 1rem 0 1.5rem; display: grid; gap: .75rem; }
	.app-menu-links button { border: 0; background: transparent; color: #214c48; font: italic 700 1.75rem var(--font-head); cursor: pointer; }
	.app-menu-links button:hover { text-decoration: underline; }
	.origin-choice { display:flex; flex-wrap:wrap; gap:.3rem; margin:.5rem 0 .8rem; }
	.origin-choice button { border:1px solid #a7926a; border-radius:5px; padding:.5rem .7rem; background:#f5ecd7; color:#453820; font:700 .75rem var(--font-head); }
	.origin-choice button.chosen { background:#285955; color:#fff4da; }
	.setup-modal .origin-choice { display:flex; flex-wrap:nowrap; gap:0; margin:.4rem 0 .75rem; }
	.setup-modal .origin-choice button { flex:1; min-width:0; border-radius:0; padding:.5rem .2rem; font-size:.65rem; }
	.setup-modal .origin-choice button:first-child { border-radius:5px 0 0 5px; }
	.setup-modal .origin-choice button:last-child { border-radius:0 5px 5px 0; }
	.generate-field { display:flex; align-items:end; gap:.35rem; min-width:0; }
	.generate-field label { flex:1; min-width:0; }
	.field-roll { margin-bottom:.45rem; padding:.35rem .5rem; border:1px solid #c5b089; border-radius:5px; background:#f2e6cb; color:#275550; font:700 .7rem var(--font-head); white-space:nowrap; }
	.tool-scrim { position:fixed; inset:0; z-index:9; display:flex; justify-content:flex-end; align-items:stretch; background:#0d0a07aa; }
	.table-tool-sheet { box-sizing:border-box; width:min(100%,31rem); height:100dvh; overflow-y:auto; padding:1rem; border-left:2px solid var(--brass); background:linear-gradient(#f4e8d2,#e8d6b5); box-shadow:-10px 0 35px #0008; }
	.table-tool-sheet > header { display:flex; align-items:center; justify-content:space-between; font:700 1.2rem var(--font-head); }
	.table-tool-sheet > header button { border:0; background:transparent; color:#544530; font-size:1.8rem; }
	.tool-tabs { display:flex; gap:.5rem; margin:.7rem 0 1rem; }
	.tool-tabs button { flex:1; padding:.65rem; border:1px solid #a28c63; border-radius:6px; background:#f4e8cf; color:#315650; font:700 .78rem var(--font-head); }
	.tool-tabs button.selected { background:#23524d; color:#f4e8cf; }
	.tool-oracle-content { display:grid; gap:.7rem; }
	.tool-oracle-content label,.tool-dice-fields label { display:grid; gap:.25rem; font:700 .72rem var(--font-head); color:#5e4d30; }
	.tool-oracle-content input,.tool-oracle-content select,.tool-dice-fields input,.tool-dice-fields select { box-sizing:border-box; width:100%; min-width:0; padding:.55rem; border:1px solid #b49b6c; border-radius:5px; background:#fcf3e1; color:#302619; font:400 .8rem var(--font-sans); }
	.tool-oracle-content .primary-button,.tool-oracle-content .secondary-button { justify-self:start; }
	.tool-extra { border-top:1px solid #b49b6c; padding-top:.7rem; }
	.tool-extra summary { cursor:pointer; color:#315650; font:700 .85rem var(--font-head); }
	.tool-extra > button { margin:.5rem .4rem .3rem 0; }
	.tool-dice-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; margin:.7rem 0; }
	.tool-move-list { display:grid; gap:.45rem; }
	.move-scope-toggle { display:flex; align-items:center; gap:.45rem; margin:0 0 .7rem; color:#645137; font:600 .68rem var(--font-head); }
	.move-scope-toggle input { accent-color:#2d6560; }
	.move-group { display:grid; gap:.28rem; margin-bottom:.6rem; }
	.move-group h3 { display:flex; justify-content:space-between; align-items:center; margin:.45rem 0 .15rem; border-bottom:1px solid #b9a376; padding-bottom:.35rem; color:#554229; font:700 .86rem var(--font-head); }
	.move-group h3 span { border-radius:99px; background:#ddcda9; padding:.08rem .38rem; font-size:.63rem; }
	.tool-search { display:grid; gap:.35rem; margin-bottom:.65rem; font:700 .72rem var(--font-head); color:#5e4d30; }
	.tool-search input { padding:.55rem; border:1px solid #b49b6c; border-radius:5px; background:#fcf3e1; color:#302619; }
	.tool-move-list details { padding:.65rem; border:1px solid #c5b28a; border-radius:6px; background:#f6ecd9; }
	.tool-move-list summary { cursor:pointer; font:700 .82rem var(--font-head); color:#315650; }
	.tool-move-list summary small { display:block; margin-top:.1rem; color:#78674a; font:500 .61rem var(--font-head); }
	.tool-move-list p { margin:.6rem 0; font-size:.75rem; white-space:pre-line; }
	.move-actions { display:flex; gap:.4rem; flex-wrap:wrap; }
	.move-source { display:block; margin-top:.5rem; color:#76664d; font-size:.68rem; }
	.move-roll-modal .move-trigger,.move-outcome p { white-space:pre-line; line-height:1.5; }
	.move-outcome { margin:.8rem 0; padding:.8rem; border:1px solid #af9561; border-radius:6px; background:#faf1dc; }
	.parchment { background: linear-gradient(100deg, #f3ead5ee, #e5d4b4dd), var(--parch-texture) center/420px repeat, #efe2c4; }
	.hero-card { min-height: 17.5rem; border: 2px solid #1f4b48; border-radius: 10px; display: grid; grid-template-columns: 1.05fr .95fr; overflow: hidden; box-shadow: 0 5px 14px #35250f25, inset 0 0 0 2px #d9b66a; }
	.hero-copy { padding: 1.45rem 1.4rem; z-index: 1; }
	.hero-copy h2 { font: 700 1.65rem/1.1 var(--font-head); color: #2c2419; margin: .45rem 0 .6rem; }
	.hero-copy > p:not(.eyebrow) { font-size: .82rem; line-height: 1.5; max-width: 23rem; color: #62533a; margin-bottom: 1rem; }
	.primary-button { color: #f5e9cc; background: linear-gradient(#3f7f77, #1f4b48); border: 1px solid #b4893c; border-radius: 7px; padding: .65rem .95rem; min-height: 2.65rem; font: 700 .82rem var(--font-head); box-shadow: 0 2px 0 #143633, inset 0 1px #ffffff30; }
	.primary-button:active { transform: translateY(1px); }
	.hero-art { position: relative; min-height: 17rem; overflow: hidden; background: linear-gradient(180deg, #9ba997 0%, #d2bc88 53%, #555b43 100%); }
	.hero-art > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 72% center; }
	.hero-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #efe2c4 0%, transparent 32%), linear-gradient(0deg, #20271d66, transparent 40%); }
	.art-caption { position: absolute; z-index: 2; right: .8rem; bottom: .6rem; color: #f4e6c7; font: 600 .55rem var(--font-head); letter-spacing: .17em; }
	.section-title { display: flex; align-items: end; justify-content: space-between; margin: 1.5rem 0 .75rem; }
	.section-title .eyebrow { margin-bottom: .15rem; font-size: .6rem; }
	.section-title h2 { font: 700 1.25rem var(--font-head); margin: 0; color: #312719; }
	.ornament { color: #a17c37; font-size: 1.25rem; }
	.foundation-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; }
	.foundation-card { border: 1px solid #c7b58c; border-radius: 8px; background: #f1e5cb; padding: .85rem; min-height: 8.3rem; box-shadow: inset 0 0 0 1px #fff6; }
	.foundation-icon { display: grid; place-items: center; width: 1.7rem; height: 1.7rem; border-radius: 6px; color: #e8d7ae; background: #2d6560; margin-bottom: .45rem; }
	.foundation-card h3 { font: 700 .83rem var(--font-head); margin-bottom: .25rem; color: #34291a; }
	.foundation-card p { font-size: .7rem; line-height: 1.4; color: #66583f; margin-bottom: 0; }
	.oracle-result { display:flex; align-items:center; gap:.65rem; padding:.7rem; border:1px solid #c5a76c; border-radius:7px; background:#e9ddc1; }
	.oracle-roll-number { flex:none; display:grid; place-items:center; width:2.35rem; height:2.35rem; border-radius:50%; background:#7d2b22; color:#f5e9cc; font:700 1rem var(--font-head); }
	.oracle-result > div { display:grid; gap:.16rem; min-width:0; }
	.oracle-result strong { color:#34291a; font:700 .82rem var(--font-head); }
	.oracle-result small { color:#76664a; font-size:.58rem; }
	.workspace-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem; margin-bottom: .75rem; }
	.workspace-bar-left, .workspace-bar-right, .card-action-strip { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; }
	.card-action-strip { margin: .5rem 0; }
	.bar-btn { display: inline-flex; align-items: center; gap: .32rem; min-height: 2.1rem; padding: .32rem .7rem; border: 1.5px solid #214c48; border-radius: 6px; background: linear-gradient(180deg, #faf1dd, #e8d7b4); color: #2b2116; font: 700 .66rem var(--font-head); letter-spacing: .04em; box-shadow: 0 2px 0 #214c48, inset 0 1px 0 rgba(255,255,255,0.6); cursor: pointer; transition: transform .06s, filter .15s; }
	.bar-btn:hover:not(:disabled) { filter: brightness(1.03); background: linear-gradient(180deg, #fdf6e6, #eedec0); }
	.bar-btn:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 1px 0 #214c48; }
	.bar-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
	.bar-btn.bar-btn-active { border-color: #b4893c; background: linear-gradient(180deg, #3f7f77, #1f4b48); color: #fff8e8; box-shadow: 0 2px 0 #0f2927; }
	.bar-toggle-pill { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.1rem; padding: 0 .7rem; border: 1.5px solid #214c48; border-radius: 6px; background: linear-gradient(180deg, #faf1dd, #e8d7b4); color: #2b2116; font: 700 .66rem var(--font-head); letter-spacing: .04em; box-shadow: 0 2px 0 #214c48; cursor: pointer; }
	.bar-toggle-pill input { accent-color: #26635b; margin: 0; }
	.bar-search { height: 2.05rem; width: 14rem; max-width: 100%; padding: 0 .65rem; border: 1px solid #c5b186; border-radius: 4px; background: #fffaf0; color: #282015; font-size: .76rem; }
	.bar-filter-menu { position: relative; }
	.bar-filter-menu > summary { list-style: none; }
	.bar-filter-menu > summary::-webkit-details-marker { display: none; }
	.bar-filter-popover { position: absolute; left: 0; top: calc(100% + .25rem); z-index: 20; min-width: 10.5rem; padding: .5rem; border: 1px solid #b89f6d; border-radius: 5px; background: #fcf5e6; box-shadow: 0 10px 25px #1e180d35; display: grid; gap: .35rem; }
	.bar-filter-popover label { display: flex; align-items: center; gap: .45rem; font: 600 .74rem var(--font-sans); color: #2c2317; cursor: pointer; }
	.bar-filter-popover input { accent-color: #26635b; }
	.hero-shared-resources { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; padding: .3rem .55rem; border: 1px solid #c8b58a; border-radius: 5px; background: #faf2e0; }
	.shared-toggle { display: inline-flex; align-items: center; gap: .35rem; font: 700 .66rem var(--font-head); color: #362c1e; }
	.shared-counter { display: inline-flex; align-items: center; border: 1px solid #c4b28a; border-radius: 4px; overflow: hidden; background: #fffaf0; height: 1.95rem; }
	.shared-counter span { background: #e6d8bc; padding: 0 .45rem; height: 100%; display: flex; align-items: center; font: 700 .6rem var(--font-head); color: #382f21; }
	.shared-counter b { padding: 0 .45rem; font: 700 .78rem var(--font-head); color: #241d12; }
	.shared-counter button { width: 1.65rem; height: 100%; border: 0; border-left: 1px solid #d5c4a1; background: #f3e6cb; color: #244e49; font-weight: 700; cursor: pointer; }
	.journal-workspace { display: grid; gap: .75rem; }
	.journal-entry-list { display: grid; gap: .45rem; }
	.journal-entry-card { border: 1px solid #c8b58a; border-radius: 5px; background: #fbf4e4; overflow: hidden; }
	.journal-entry-header { list-style: none; display: flex; align-items: center; gap: .55rem; padding: .55rem .75rem; cursor: pointer; user-select: none; }
	.journal-entry-header::-webkit-details-marker { display: none; }
	.journal-entry-header::after { content: '⌄'; font-size: .9rem; color: #5b4d36; margin-left: .25rem; }
	.journal-entry-card[open] > .journal-entry-header::after { content: '⌃'; }
	.journal-handle { color: #8c7b5c; font-size: .9rem; letter-spacing: -.08em; }
	.journal-entry-title { flex: 1; min-width: 0; font: 600 .84rem var(--font-sans); color: #282015; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.journal-entry-controls { display: inline-flex; align-items: center; gap: .25rem; }
	.journal-icon-btn { width: 1.7rem; height: 1.7rem; border: 1px solid #cbb890; border-radius: 50%; background: #f2e5ca; color: #382e1f; font-size: .78rem; display: grid; place-items: center; padding: 0; cursor: pointer; }
	.journal-icon-btn:hover:not(:disabled) { background: #e3d1ab; }
	.journal-icon-btn:disabled { opacity: .4; cursor: not-allowed; }
	.journal-entry-body { padding: .65rem .85rem .8rem; border-top: 1px solid #e2d4b7; background: #fffaf0; }
	.journal-entry-body time { display: block; color: #8a7959; font: 600 .58rem var(--font-head); margin-bottom: .3rem; }
	.journal-entry-body p { margin: 0; color: #2e2418; font-size: .8rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
	.journal-editor-form { display: grid; gap: .55rem; }
	.journal-editor-box { border: 1px solid #c5b186; border-radius: 5px; background: #fffaf0; overflow: hidden; }
	.journal-editor-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem; padding: .45rem .6rem; border-bottom: 1px solid #dfd1b4; background: #f6ecd7; }
	.editor-block-select { height: 2rem; padding: 0 .5rem; border: 1px solid #c4b187; border-radius: 4px; background: #fffaf0; color: #2c2317; font: 600 .72rem var(--font-sans); }
	.editor-btn-group { display: inline-flex; align-items: center; }
	.editor-tool-btn { width: 2rem; height: 2rem; border: 1px solid #c4b187; margin-left: -1px; background: #fffaf0; color: #2c2317; font-size: .75rem; display: grid; place-items: center; padding: 0; cursor: pointer; }
	.editor-tool-btn:first-child { margin-left: 0; border-radius: 4px 0 0 4px; }
	.editor-tool-btn:last-child { border-radius: 0 4px 4px 0; }
	.editor-tool-btn:hover { background: #e9dbc0; }
	.journal-editor-box textarea { width: 100%; box-sizing: border-box; resize: vertical; min-height: 6.5rem; border: 0; background: #fffaf0; padding: .75rem .85rem; color: #2b2116; font: 400 .82rem/1.5 var(--font-sans); outline: none; }
	.journal-editor-actions { display: flex; justify-content: flex-end; gap: .5rem; }
	.primary-button:disabled { opacity: .55; cursor: not-allowed; }
	.empty-journal-card { display:grid; justify-items:center; align-content:center; min-height:11rem; border:1px dashed #c5b28a; border-radius:8px; color:#8b7a58; background:#faf2e0a8; text-align:center; padding:1rem; }
	.empty-journal-card strong { margin-top:.2rem; color:#4e422e; font:700 .85rem var(--font-head); }
	.empty-journal-card p { margin:.2rem 0 0; font-size:.67rem; }
	.tracks-workspace { display:grid; gap:.75rem; }
	.track-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,21rem),1fr)); gap:.8rem; align-items:start; }
	.track-card, .record-card, .location-card, .faction-card, .site-card, .truth-category-card, .asset-card { min-width:0; padding:.9rem; border:2px solid #1f4b48; border-radius:9px; background:linear-gradient(rgba(251,244,228,.9),rgba(238,224,195,.93)),var(--parch-texture) center/420px repeat,#fbf4e4; box-shadow:0 5px 14px rgba(25,18,10,.16),inset 0 0 0 1.5px #d9b66a,inset 0 0 18px rgba(120,80,30,.12); }
	.track-card.track-resolved { background:linear-gradient(rgba(236,225,200,.92),rgba(225,210,180,.94)),#f1e6ce; opacity:.9; }
	.track-card-heading { display:flex; justify-content:space-between; align-items:center; gap:.6rem; }
	.track-card-heading h3 { margin:0; overflow-wrap:anywhere; color:#282015; font:700 1.02rem/1.2 var(--font-head); }
	.track-delete { flex:none; width:1.85rem; height:1.85rem; border:1px solid transparent; border-radius:6px; color:#5a4b34; background:transparent; display:grid; place-items:center; cursor:pointer; }
	.track-delete:hover { background:#e6d7b9; color:#8b372d; border-color:#c5b186; }
	.track-card-meta { display:flex; align-items:center; flex-wrap:wrap; gap:.45rem; margin:.35rem 0; color:#382e1f; font-size:.74rem; }
	.threat-badge { padding:.14rem .4rem; border-radius:4px; background:#f0d7cb; color:#873c2f; font:700 .6rem var(--font-head); }
	.track-progress-label { display:flex; align-items:center; gap:.35rem; color:#2f2518; font-size:.75rem; margin:.25rem 0; }
	.track-boxes { display:flex; align-items:center; gap:.22rem; margin:.4rem 0 .65rem; flex-wrap:wrap; }
	.progress-box { width:1.5rem; height:1.5rem; flex:none; display:grid; place-items:center; position:relative; }
	.progress-step { width:1.55rem; height:1.55rem; flex:none; padding:0; border:1.5px solid #214c48; border-radius:4px; background:linear-gradient(180deg,#faf1dd,#e5d3ab); color:#1f4b48; font-weight:700; cursor:pointer; box-shadow:0 1px 0 #214c48; }
	.progress-step:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
	.track-clock { display:flex; gap:.22rem; align-items:center; margin:.35rem 0 .65rem; flex-wrap:wrap; }
	.track-clock button { flex:none; width:1.55rem; height:1.55rem; border:1.5px solid #214c48; border-radius:4px; background:linear-gradient(180deg,#faf1dd,#e5d3ab); color:#1f4b48; font-weight:700; cursor:pointer; }
	.track-clock button:disabled { opacity:.4; cursor:not-allowed; }
	.track-clock span { width:1.35rem; height:1.35rem; flex:none; border:1.5px solid #4b3b24; border-radius:3px; background:#fffaf0; }
	.track-clock span.clock-filled { background:#26635b; border-color:#1f4b48; }
	.track-resolution { margin:.35rem 0; font-weight:700; color:#282015; font-size:.75rem; }
	.track-notes { margin:.65rem -.85rem -.85rem; border-top:1px solid #dfd1b4; color:#4f422d; background:#f6ecd7; }
	.track-notes summary { padding:.5rem .85rem; font:600 .74rem var(--font-head); cursor:pointer; }
	.track-notes label { display:grid; gap:.25rem; padding:.3rem .85rem .7rem; font-size:.68rem; }
	.track-notes textarea { width:100%; box-sizing:border-box; padding:.5rem; border:1px solid #bda77a; border-radius:4px; background:#fffaf0; color:#332918; resize:vertical; }
	.track-editor .threat-toggle { display:flex; align-items:center; gap:.55rem; }
	.track-editor .threat-toggle input { width:1.05rem; min-height:1.05rem; margin:0; accent-color:#2d6560; }
	.rank-field { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:end; gap:.55rem; }
	.rank-field .secondary-button { margin-bottom:.75rem; }
	.track-resolution-result { margin:1rem 0; padding:1rem; border:1px solid #c6ae7c; border-left:4px solid #2d6560; border-radius:6px; background:#f5ead3; color:#3d3220; font:700 .85rem var(--font-head); }
	.records-workspace, .locations-workspace, .factions-workspace, .sites-workspace, .truths-workspace, .maps-workspace { display:grid; gap:.75rem; }
	.truth-category-grid { display:grid; gap:.75rem; }
	.truth-category-card { display:grid; gap:.55rem; }
	.truth-category-heading, .truth-chooser-heading { display:flex; align-items:center; justify-content:space-between; gap:.7rem; flex-wrap:wrap; }
	.truth-category-heading h3, .truth-chooser-heading h3 { margin:0; color:#282015; font:700 1.08rem/1.2 var(--font-head); }
	.truth-inline-actions { display:flex; align-items:center; gap:.35rem; }
	.truth-inline-select-row { display:flex; align-items:flex-end; gap:.45rem; }
	.truth-select-field { flex:1; min-width:0; display:grid; gap:.18rem; }
	.truth-select-label { font:700 .62rem var(--font-head); color:#5a4a36; letter-spacing:.04em; text-transform:uppercase; }
	.truth-select-field select { width:100%; height:2.2rem; padding:0 .55rem; border:1.5px solid #9b8250; border-radius:6px; background:#fffaf0; color:#2b2116; font:600 .75rem var(--font-sans); }
	.truth-roll-btn { width:2.2rem; height:2.2rem; border:1.5px solid #214c48; border-radius:6px; background:linear-gradient(180deg,#faf1dd,#e5d3ab); color:#1f4b48; box-shadow:0 2px 0 #214c48; }
	.truth-live-textarea { width:100%; box-sizing:border-box; padding:.55rem .7rem; border:1.5px solid #b9a47a; border-radius:6px; background:#fffaf0; color:#2b2116; font:400 .78rem/1.45 var(--font-sans); resize:vertical; }
	.truth-live-textarea:focus { border-color:#214c48; outline:none; }
	.hero-momentum-strip { margin-top:.55rem; padding:.5rem .65rem; border:1.5px solid #b9a47a; border-radius:7px; background:#f6ecd6; display:grid; gap:.4rem; }
	.momentum-bar-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.4rem; }
	.momentum-bar-title { font:700 .75rem var(--font-head); color:#214c48; letter-spacing:.05em; }
	.momentum-bar-title b { font-size:.95rem; color:#282015; margin-left:.2rem; }
	.momentum-limits { display:flex; align-items:center; gap:.55rem; font:700 .64rem var(--font-head); color:#5a4a36; }
	.burn-inline-btn { display:inline-flex; align-items:center; gap:.28rem; padding:.2rem .5rem; border:1.5px solid #7d2b22; border-radius:5px; background:linear-gradient(180deg,#a03a2d,#7d2b22); color:#f6ecd7; font:700 .62rem var(--font-head); cursor:pointer; }
	.burn-inline-btn:disabled { opacity:.4; cursor:not-allowed; }
	.momentum-track-pills { display:grid; grid-template-columns:repeat(17,minmax(0,1fr)); gap:2px; }
	.mom-step { min-width:0; height:1.65rem; padding:0; border:1px solid #b9a47a; border-radius:3px; background:#fffaf0; color:#382e1f; font:700 .62rem var(--font-head); cursor:pointer; }
	.mom-step.mom-active { background:#214c48; color:#fff8e5; border-color:#d9b66a; }
	.mom-step:disabled { opacity:.32; cursor:not-allowed; }
	.hero-subpanels { display:grid; gap:.45rem; margin-top:.7rem; }
	.hero-subpanel { border:1.5px solid #b9a47a; border-radius:6px; overflow:hidden; background:#fbf4e4; }
	.hero-subpanel-header { list-style:none; display:flex; align-items:center; justify-content:space-between; padding:.5rem .75rem; background:linear-gradient(180deg,#e9dbc0,#dfd0b0); color:#282015; font:700 .76rem var(--font-head); letter-spacing:.04em; cursor:pointer; }
	.hero-subpanel-header::-webkit-details-marker { display:none; }
	.hero-subpanel-header::after { content:'⌄'; font-size:.85rem; }
	.hero-subpanel[open] > .hero-subpanel-header { background:linear-gradient(180deg,#2d6560,#1f4b48); color:#f6ecd7; }
	.hero-subpanel[open] > .hero-subpanel-header::after { content:'⌃'; }
	.hero-subpanel-body { padding:.65rem .75rem; display:grid; gap:.55rem; background:#fffaf0; }
	.exp-counters-row { display:flex; flex-wrap:wrap; gap:.5rem; }
	.legacy-track-row, .hero-vow-card { padding:.45rem .55rem; border:1px solid #d5c4a1; border-radius:5px; background:#f8efda; }
	.vow-list { display:grid; gap:.45rem; }
	.conditions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr)); gap:.65rem; }
	.condition-group { display:grid; align-content:start; gap:.28rem; font-size:.74rem; }
	.condition-group strong { font:700 .68rem var(--font-head); color:#214c48; text-transform:uppercase; }
	.condition-check { display:flex; align-items:center; gap:.38rem; cursor:pointer; }
	.condition-check input { accent-color:#7d2b22; }
	.custom-cond-row, .inline-add-row { display:flex; align-items:center; gap:.3rem; }
	.inline-add-row input { flex:1; min-width:0; height:1.85rem; padding:0 .45rem; border:1px solid #b9a47a; border-radius:4px; background:#fffaf0; font-size:.72rem; }
	.inline-notes-area { width:100%; box-sizing:border-box; padding:.5rem .6rem; border:1px solid #b9a47a; border-radius:5px; background:#fbf4e4; color:#2b2116; font:400 .76rem/1.45 var(--font-sans); resize:vertical; }
	.inline-notes-label { display:block; margin:.7rem 0 0; color:#65563b; font:700 .68rem var(--font-head); letter-spacing:.06em; }
	.modal-stats-editor { margin:.4rem 0 .2rem; padding:.55rem .65rem .6rem; border:1.5px solid #c5b186; border-radius:8px; background:#f6ecd6; }
	.modal-stats-title { margin:0 0 .45rem; color:#65563b; font:700 .68rem var(--font-head); letter-spacing:.14em; text-transform:uppercase; }
	.modal-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(5.2rem,1fr)); gap:.4rem; }
	.modal-stats-grid + .modal-stats-grid { margin-top:.4rem; }
	.modal-stats-grid label { display:flex; flex-direction:column; gap:.2rem; margin:0; color:#65563b; font:700 .66rem var(--font-head); }
	.modal-stats-grid input { width:100%; box-sizing:border-box; min-height:2.3rem; padding:.4rem .5rem; border:1px solid #b9a77d; border-radius:6px; background:#f6ecd6; color:#2b2116; font:400 .82rem var(--font-sans); }
	.quest-bullet-list { list-style:disc; margin:.25rem 0 0 1.2rem; padding:0; display:grid; gap:.25rem; font-size:.75rem; }
	.quest-bullet-list li { display:flex; align-items:center; justify-content:space-between; gap:.4rem; }
	.inline-rank-select { display:inline-flex; align-items:center; gap:.35rem; }
	.inline-rank-select select { height:1.9rem; padding:0 .4rem; border:1px solid #b9a47a; border-radius:4px; background:#fffaf0; font-size:.72rem; }
	.truth-card-actions { display:flex; align-items:center; flex-wrap:wrap; gap:.35rem; margin-top:.6rem; }
	.truth-editor { display:grid; gap:.65rem; padding:1rem; border:1px solid #c5b184; border-left:4px solid #2d6560; border-radius:6px; background:#f5ead3; }
	.truth-editor label { display:grid; gap:.25rem; color:#594a30; font:600 .66rem var(--font-head); }
	.truth-editor input, .truth-editor textarea { min-width:10rem; min-height:2rem; border:1px solid #c2af81; border-radius:5px; background:#fffaf0; color:#382d1d; padding:.35rem .5rem; font:400 .72rem var(--font-sans); }
	.truth-editor textarea { width:100%; box-sizing:border-box; resize:vertical; }
	.map-heading-actions, .map-tool-group, .map-shape-group { display:flex; align-items:center; flex-wrap:wrap; gap:.35rem; }
	.map-style-select { display:inline-flex; align-items:center; gap:.35rem; color:#594a30; font:700 .66rem var(--font-head); letter-spacing:.04em; }
	.map-style-select select { height:2.1rem; padding:0 .5rem; border:1.5px solid #214c48; border-radius:6px; background:#fffaf0; color:#2b2116; font:600 .7rem var(--font-sans); }
	.map-editor { min-width:0; padding:.85rem; border:2px solid #1f4b48; border-radius:9px; background:linear-gradient(rgba(251,244,228,.92),rgba(238,224,195,.95)),var(--parch-texture) center/420px repeat,#fbf4e4; box-shadow:0 5px 14px rgba(25,18,10,.16),inset 0 0 0 1.5px #d9b66a; }
	.map-heading { display:flex; justify-content:space-between; align-items:center; gap:.8rem; margin-bottom:.6rem; }
	.map-heading label { display:flex; align-items:center; gap:.5rem; color:#5b4d36; font:700 .76rem var(--font-head); }
	.map-heading select, .map-cell-editor select, .map-cell-editor input:not([type='checkbox']), .map-cell-editor textarea { min-width:0; padding:.4rem .55rem; border:1.5px solid #9b8250; border-radius:5px; background:#fffaf0; color:#332918; font:600 .76rem var(--font-sans); }
	.map-cell-editor textarea { width:100%; box-sizing:border-box; resize:vertical; }
	.map-controls { display:flex; align-items:center; flex-wrap:wrap; gap:.45rem; margin-bottom:.65rem; }
	.terrain-palette { display:flex; flex-wrap:wrap; gap:.25rem; }
	.terrain-choice, .terrain-menu-tile { flex:none; width:2.15rem; height:2.15rem; border:1.5px solid #6e5c3b; border-radius:5px; background-image:var(--terrain-image); background-size:var(--terrain-size); background-position:var(--terrain-x) var(--terrain-y); cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.2); }
	.terrain-choice.selected { outline:3px solid #26635b; outline-offset:1px; }
	.terrain-group { position:relative; }
	.terrain-group > .terrain-choice { color:#f8eed9; text-shadow:0 1px 3px #10241b; font-weight:900; }
	.terrain-group-menu { position:absolute; left:0; top:calc(100% + .35rem); z-index:8; display:grid; width:12.5rem; max-height:19rem; overflow-y:auto; border:1.5px solid #214c48; border-radius:7px; background:#f8eed9; box-shadow:0 6px 18px rgba(0,0,0,0.35); }
	.terrain-group-menu button { display:flex; align-items:center; gap:.45rem; padding:.32rem .4rem; text-align:left; border:0; background:transparent; color:#332918; font-size:.73rem; font-weight:600; cursor:pointer; }
	.terrain-group-menu button:hover, .terrain-group-menu button.chosen { background:#e5d3ab; }
	.terrain-menu-tile { display:block; width:1.8rem; height:1.8rem; }
	.map-fill { position:relative; }
	.map-fill-menu { position:absolute; top:100%; left:0; z-index:5; display:grid; width:10rem; border:1.5px solid #214c48; border-radius:6px; background:#f8eed9; box-shadow:0 5px 16px #0005; }
	.map-fill-menu button { border:0; background:transparent; padding:.5rem; text-align:left; font-size:.7rem; cursor:pointer; }
	.map-fill-menu button:hover { background:#e5d3ab; }
	.map-name-toggle { display:flex; align-items:center; gap:.35rem; color:#594a30; font:700 .68rem var(--font-head); }
	.map-name-toggle input { accent-color:#26635b; }
	.map-tool-group .tool-selected { background:linear-gradient(180deg, #3f7f77, #1f4b48); color:#fff8e8; border-color:#b4893c; }
	.map-image-upload { position:relative; overflow:hidden; cursor:pointer; display:inline-flex; align-items:center; }
	.map-surface { width:100%; aspect-ratio:2/1; min-height:17rem; max-height:38rem; overflow:hidden; border:2px solid #4b3b24; border-radius:6px; background-color:#efe5ce; background-image:linear-gradient(#f5ecd866,#f5ecd866),var(--map-background); background-size:cover; background-position:center; box-shadow:inset 0 0 12px rgba(43,33,22,0.18); }
	.map-surface.hex-surface { aspect-ratio:1.68/1; padding:4px; box-sizing:border-box; }
	.map-surface:not(.has-background) { background-image:linear-gradient(135deg,#f3ead4,#e5d6b6); }
	.map-grid { display:grid; grid-template-columns:repeat(20,minmax(0,1fr)); grid-template-rows:repeat(10,minmax(0,1fr)); width:100%; height:100%; }
	.map-grid.hex-grid { display:block; position:relative; width:100%; height:100%; }
	.map-cell { position:relative; min-width:0; min-height:0; padding:0; border:0 solid rgba(75,59,36,0.32); border-right-width:1px; border-bottom-width:1px; background-color:rgba(255,250,240,0.45); color:#2b2116; cursor:pointer; display:grid; place-items:center; transition:filter .1s; }
	.map-cell:hover { filter:brightness(1.06); z-index:2; box-shadow:inset 0 0 0 2px #1f4b48; }
	.map-cell.hex-cell { position:absolute; border:0; clip-path:polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); background-color:rgba(251,244,228,0.68); }
	.map-cell.hex-cell:hover { box-shadow:none; }
	.hex-cell-border { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:2; }
	.hex-cell-border polygon { fill:none; stroke:rgba(60,48,30,0.52); stroke-width:2.4; vector-effect:non-scaling-stroke; }
	.map-cell.hex-cell:hover .hex-cell-border polygon { stroke:#1f4b48; stroke-width:4; }
	.map-cell.hex-cell.path-cell .hex-cell-border polygon { stroke:#b43225; stroke-width:4.2; stroke-dasharray:5 3; }
	.map-cell.hex-cell.has-record .hex-cell-border polygon { stroke:#1f4b48; stroke-width:4.5; }
	.map-cell.has-terrain { background-image:var(--terrain-image); background-size:var(--terrain-size); background-position:var(--terrain-x) var(--terrain-y); }
	.map-cell-badge { position:relative; z-index:3; display:inline-block; max-width:92%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:.08rem .28rem; border-radius:4px; background:rgba(251,244,228,0.9); border:1px solid rgba(75,59,36,0.55); color:#241c11; font:700 .52rem/1.15 var(--font-head); box-shadow:0 1px 2px rgba(0,0,0,0.25); }
	.map-cell.path-cell:not(.hex-cell) { box-shadow:inset 0 0 0 2.5px #b43225; }
	.map-cell.has-record:not(.hex-cell) { box-shadow:inset 0 0 0 2.5px #1f4b48; }
	.faction-influence { display:flex; align-items:center; gap:.45rem; margin-top:.55rem; padding:.45rem; border:1px solid #d1bf9d; border-radius:5px; background:#fffaf0; }
	.faction-influence input { flex:1; min-width:8rem; height:2rem; padding:0 .55rem; border:1px solid #c2af81; border-radius:4px; background:#fbf4e4; color:#282015; font-size:.76rem; }
	.map-record-tabs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:.65rem; border-bottom:1px solid #cbbb96; }
	.map-record-tabs button { display:flex; justify-content:center; align-items:center; gap:.45rem; padding:.6rem .3rem; border:0; border-bottom:2px solid transparent; background:transparent; color:#5b4d36; font:700 .68rem var(--font-head); cursor:pointer; }
	.map-record-tabs button.active-map-tab { border-bottom-color:#214c48; color:#214c48; }
	.map-record-tabs span { min-width:1.15rem; padding:.1rem .28rem; border-radius:99px; background:#e2d3b2; font-size:.55rem; text-align:center; }
	.map-record-list { max-height:12rem; overflow:auto; padding:.35rem 0; }
	.map-record-list > p { margin:.45rem; color:#786b50; font-size:.72rem; }
	.map-record-row { display:flex; width:100%; justify-content:space-between; gap:.75rem; padding:.45rem .5rem; border:0; border-bottom:1px solid #d8c8a7; background:transparent; color:#382d1d; text-align:left; cursor:pointer; }
	.map-record-row small { color:#786b50; }
	.map-cell-editor > label { display:grid; gap:.3rem; margin:.65rem 0; color:#51432e; font:700 .7rem var(--font-head); }
	.map-cell-editor > label.threat-toggle { display:flex; align-items:center; }
	.map-create-actions { display:flex; gap:.5rem; flex-wrap:wrap; margin:.7rem 0; }
	.map-assigned-records { display:grid; gap:.4rem; margin:.75rem 0; font-size:.72rem; }
	.map-assigned-records > div { display:flex; justify-content:space-between; align-items:center; gap:.5rem; }
	.map-cell-editor .modal-note { color:#77674b; }
	.location-grid, .faction-grid, .site-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,21rem),1fr)); gap:.75rem; align-items:start; }
	.location-card, .faction-card, .site-card { min-width:0; padding:.85rem; border:1px solid #c8b58a; border-radius:5px; background:#fbf4e4; box-shadow:0 2px 6px #392b170d; }
	.faction-flags { display:flex; flex-wrap:wrap; gap:.35rem; margin:.45rem 0; }
	.faction-flags span { padding:.18rem .45rem; border-radius:4px; background:#f0d7cb; color:#873c2f; font:700 .58rem var(--font-head); }
	.faction-toggles { display:flex; flex-wrap:wrap; gap:.5rem 1rem; margin:.4rem 0 .7rem; }
	.faction-toggles label { display:flex; align-items:center; gap:.4rem; color:#51432e; font-size:.66rem; }
	.faction-toggles input { accent-color:#2d6560; }
	.asset-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,18.5rem),1fr)); gap:.75rem; align-items:start; }
	.asset-card { min-width:0; padding:.85rem; border:1px solid #c8b58a; border-radius:5px; background:#fbf4e4; display:grid; gap:.55rem; }
	.pocket-asset-card { padding:0; overflow:hidden; gap:0; }
	.pocket-asset-card > .record-heading { padding:.65rem .8rem .25rem; }
	.pocket-asset-card > .card-action-strip { padding:0 .8rem .55rem; margin:0; }
	.asset-type-banner { background:#231f18; color:#f7eed9; font:700 .7rem var(--font-head); letter-spacing:.08em; padding:.38rem .8rem; }
	.asset-card-body { padding:.75rem .8rem; display:grid; gap:.55rem; background:#fffaf0; }
	.asset-uppercase-title { font:700 .88rem/1.2 var(--font-head); color:#241c11; letter-spacing:.03em; }
	.asset-inline-field { display:grid; gap:.15rem; font:600 .66rem var(--font-sans); color:#6e5e43; }
	.asset-inline-field input { border:0; border-bottom:1px dotted #b8a378; background:transparent; padding:.2rem 0; color:#261e13; font-size:.76rem; }
	.asset-description { white-space:pre-line; margin:0; line-height:1.45; font-size:.74rem; color:#382e1f; }
	.asset-abilities { display:grid; gap:.45rem; }
	.asset-control-list { display:grid; gap:.45rem; padding-top:.55rem; border-top:1px solid #dfd1b4; font-size:.72rem; }
	.asset-control-list label { min-width:0; display:grid; gap:.2rem; }
	.asset-ability { display:flex; align-items:flex-start; gap:.5rem; white-space:pre-line; line-height:1.4; font-size:.74rem; color:#2b2116; }
	.asset-ability input { margin-top:.18rem; flex:none; accent-color:#26635b; }
	.asset-track-row { display:grid; gap:.2rem; font:700 .68rem var(--font-head); color:#382e1f; }
	.theme-range-section h4 { margin:.4rem 0 .25rem; font:700 .82rem var(--font-head); color:#282015; }
	.theme-range-table { width:100%; border-collapse:collapse; font-size:.73rem; }
	.theme-range-table td { padding:.35rem .5rem; vertical-align:top; }
	.theme-range-table td:first-child { width:4.5rem; font-weight:700; white-space:nowrap; color:#4f412b; }
	.theme-range-table tbody tr:nth-child(odd) { background:#efe2c6; }
	.asset-import-list { max-height:min(48vh,28rem); overflow:auto; border-block:1px solid #bda880; margin:.8rem 0; }
	.asset-import-row { display:flex; justify-content:space-between; align-items:center; gap:.7rem; padding:.5rem 0; border-bottom:1px solid #d4c4a4; }
	.asset-import-row span { min-width:0; }
	.asset-import-row small { display:block; color:#716553; overflow-wrap:anywhere; }
	.asset-editor-modal, .theme-editor-modal { max-height:min(90vh,900px); overflow:auto; }
	.theme-editor-modal h3 { margin:1.2rem 0 .4rem; }
	.theme-kind-tabs { display:flex; flex-wrap:wrap; gap:.3rem; margin:.7rem 0; }
	.asset-statuses { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.4rem; padding:.8rem; border:1px solid #bda880; }
	.asset-statuses legend { font-weight:700; }
	.asset-statuses label { display:flex; align-items:center; gap:.4rem; }
	.asset-tier-draft { display:flex; align-items:end; gap:.5rem; flex-wrap:wrap; margin:.55rem 0; }
	.asset-tier-draft > label:first-child { flex:1 1 15rem; }
	.site-meta { display:flex; gap:1rem; margin-top:.45rem; color:#4e412c; font-size:.72rem; }
	.site-progress { display:grid; grid-template-columns:repeat(10,minmax(0,1fr)); gap:.2rem; margin:.4rem 0 .55rem; }
	.site-progress button { aspect-ratio:1; min-width:0; border:1px solid #594b34; border-radius:2px; background:#fffaf0; padding:0; cursor:pointer; }
	.site-progress button.filled { border-color:#26635b; background:#26635b; }
	.site-editor select { display:block; width:100%; margin-top:.25rem; min-height:2.25rem; padding:.45rem .55rem; border:1px solid #b9a77d; border-radius:6px; background:#f6ecd6; color:#2b2116; }
	.site-editor textarea:disabled { opacity:.48; cursor:not-allowed; }
	.site-editor .site-field { display:flex; align-items:end; gap:.4rem; min-width:0; }
	.site-editor .site-field label { flex:1; min-width:0; }
	.site-editor .site-field button { margin-bottom:.55rem; }
	.site-editor .site-field input[type="checkbox"] { display:inline-block; width:auto; min-height:0; margin-left:.35rem; vertical-align:middle; }
	.site-area-heading { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
	.site-explore-tools { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; margin-top:.55rem; }
	.site-explore-tools label, .site-area label { display:block; margin:.35rem 0; color:#5b4d36; font:700 .66rem var(--font-head); text-transform:capitalize; }
	.site-explore-tools input, .site-area input, .site-area select, .site-area textarea { box-sizing:border-box; width:100%; margin-top:.2rem; padding:.42rem .5rem; border:1px solid #bfa97d; border-radius:4px; background:#fffaf0; color:#2b2116; font:400 .74rem var(--font-sans); }
	.site-area .site-field { display:flex; align-items:end; gap:.4rem; }
	.site-area .site-field label { flex:1; }
	.site-area .site-field button { margin-bottom:.38rem; }
	.site-area { margin-top:.65rem; padding:.7rem; border:1px solid #d5c4a1; border-radius:5px; background:#fffaf0; }
	.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
	.record-list { display:grid; gap:.75rem; }
	.record-card { min-width:0; padding:.85rem; border:1px solid #c8b58a; border-radius:5px; background:#fbf4e4; box-shadow:0 2px 6px #392b170d; }
	.record-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:.7rem; }
	.record-card > .record-heading { cursor:pointer; }
	.record-card > .record-heading:focus-visible { outline:3px solid var(--brass-2); outline-offset:2px; border-radius:6px; }
	.record-heading .eyebrow { margin:0 0 .15rem; font-size:.53rem; }
	.record-heading h3 { margin:0; color:#282015; font:700 1.02rem var(--font-head); }
	.record-heading p { margin:.15rem 0 0; color:#6e5e43; font-size:.7rem; }
	.record-delete { width:1.8rem; height:1.8rem; border:0; border-radius:50%; color:#5a4b34; background:transparent; font-size:1rem; cursor:pointer; }
	.record-delete:hover { background:#e6d7b9; color:#8b372d; }
	.record-stat-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.45rem; margin-top:.55rem; }
	.record-stat-row.attributes { grid-template-columns:repeat(5,minmax(0,1fr)); }
	.hero-stat-roll-btn { display:flex; align-items:center; justify-content:space-between; gap:.3rem; min-height:2.3rem; padding:.35rem .55rem; border:1px solid #c5b186; border-radius:4px; background:#fffaf0; color:#2b2116; cursor:pointer; }
	.hero-stat-roll-btn:hover { background:#efe1c4; border-color:#26635b; }
	.hero-stat-roll-btn small { font:700 .62rem var(--font-head); color:#4f412b; }
	.hero-stat-roll-btn strong { font:700 .88rem var(--font-head); color:#214c48; }
	.stat-roll-die { font-size:.8rem; opacity:.7; }
	.record-stat { display:flex; justify-content:space-between; align-items:center; gap:.25rem; min-height:2.3rem; padding:.35rem .5rem; border:1px solid #d2c099; border-radius:4px; background:#fffaf0; color:#594a30; }
	.record-stat small { font:700 .58rem var(--font-head); }.record-stat strong { color:#282015; font:700 .84rem var(--font-head); }
	.record-stat span { display:flex; gap:.15rem; }.record-stat button { width:1.35rem; height:1.35rem; border:1px solid #c5b186; border-radius:3px; background:#f2e5ca; color:#244e49; font-weight:700; cursor:pointer; }
	.record-field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.4rem .8rem; margin-top:.55rem; }
	.record-field-grid p { display:grid; gap:.1rem; margin:0; color:#382e1f; font-size:.72rem; white-space:pre-wrap; }
	.record-field-grid p strong, .record-chip-groups p strong { color:#6e5e43; font:700 .58rem var(--font-head); text-transform:uppercase; letter-spacing:.04em; }
	.record-chip-groups { display:grid; gap:.35rem; margin-top:.65rem; }
	.record-chip-groups p { display:flex; align-items:center; flex-wrap:wrap; gap:.3rem; margin:0; color:#54462f; font-size:.66rem; }
	.record-chip-groups p strong { width:7.5rem; }
	.record-chip-groups span { padding:.2rem .45rem; border-radius:4px; background:#ebe0c6; }
	.saved-import-empty { display:flex; align-items:center; gap:.45rem; padding:1rem .5rem; color:#6e5e43; font:600 .8rem var(--font-sans); }
	.saved-import-table { width:100%; border-collapse:collapse; margin:.75rem 0; font-size:.76rem; }
	.saved-import-table th, .saved-import-table td { text-align:left; padding:.45rem .5rem; border-bottom:1px solid #d5c4a1; }
	.saved-import-table th { font:700 .66rem var(--font-head); color:#5b4d36; text-transform:uppercase; }
	.saved-import-table input { accent-color:#26635b; }
	.theme-swatches { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; margin:.5rem 0 1rem; }
	.theme-swatch-btn { height:2rem; border:2px solid transparent; border-radius:5px; cursor:pointer; }
	.theme-swatch-btn.chosen { border-color:#f3d98c; outline:2px solid #282015; }
	.ledger-items-list, .denizen-slots-list { display:grid; gap:.45rem; margin:.75rem 0; max-height:22rem; overflow-y:auto; }
	.ledger-item-row { display:flex; align-items:center; gap:.4rem; }
	.ledger-item-row select { width:3.6rem; min-height:2.1rem; margin:0; }
	.ledger-item-row input[type="text"] { flex:1; margin:0; min-height:2.1rem; }
	.denizen-slot-row { display:flex !important; align-items:center; gap:.5rem; margin:.25rem 0 !important; }
	.denizen-range { width:5rem; flex:none; text-align:right; font:700 .74rem var(--font-head); color:#4f412b; }
	.denizen-slot-row input { flex:1; margin:0 !important; min-height:2.1rem !important; }
	.record-editor, .faction-editor, .location-editor { width:min(100%,38rem); }
	.record-editor form, .faction-editor form, .location-editor form { display:grid; gap:.35rem; }
	.record-form-grid { display:grid; grid-template-columns:1fr; gap:.35rem; }
	.record-form-grid label { display:block; margin:.2rem 0; color:#65563b; font:700 .68rem var(--font-head); }
	.record-form-grid select, .record-form-grid input, .record-form-grid textarea { display:block; width:100%; box-sizing:border-box; margin-top:.2rem; min-height:2.25rem; padding:.45rem .55rem; border:1px solid #b9a77d; border-radius:6px; background:#f6ecd6; color:#2b2116; font:400 .74rem var(--font-sans); resize:vertical; }
	.record-form-grid textarea:not([rows="1"]) { min-height:3.6rem; }
	.modal-scrim { position: fixed; z-index: 40; inset: 0; background: #0d0a07aa; display: grid; place-items: center; padding: 1rem; }
	.setup-modal { position: relative; width: min(100%, 30rem); max-height: min(90dvh, 48rem); box-sizing: border-box; overflow-x: hidden; overflow-y: auto; padding: 1.5rem; border: 2px solid var(--teal); border-radius: 12px; background: linear-gradient(#f3e8d0, #e6d4b2); box-shadow: 0 12px 40px #0008, inset 0 0 0 2px #d9b66a; }
	.picker-modal { width: min(100%, 38rem); }
	.setup-modal h2 { margin: .25rem 0 1rem; font: 700 1.5rem var(--font-head); }
	.setup-modal label { display: block; margin: .75rem 0; color: #65563b; font: 700 .75rem var(--font-head); }
	.setup-modal input:not([type="checkbox"]):not([type="range"]), .setup-modal select { display: block; width: 100%; box-sizing:border-box; margin-top: .3rem; min-height: 2.4rem; padding: .45rem .6rem; border: 1px solid #b9a77d; border-radius: 6px; background: #f6ecd6; color: #2b2116; }
	.setup-modal input[type="checkbox"] { display: inline-block; width: 1.05rem; height: 1.05rem; min-height: 0; margin: 0; padding: 0; accent-color: #26635b; vertical-align: middle; }
	.location-toggle { display: flex !important; align-items: center; gap: .45rem; }
	.modal-note { margin: 1rem 0; color: #786b50; font-size: .72rem; }
	.transfer-actions { display:flex; flex-wrap:wrap; gap:.55rem; }
	.close-modal { position: absolute; right: .75rem; top: .6rem; border: 0; background: none; font-size: 1.5rem; color: #65563b; cursor:pointer; }
	.modal-actions { display:flex; justify-content:flex-end; align-items:center; gap:.6rem; margin-top:1.2rem; }
	.cancel-button, .secondary-button { min-height:2.2rem; border:1px solid #9b8250; border-radius:5px; color:#28524d; background:#f4e8cf; padding:.38rem .68rem; font:700 .68rem var(--font-head); cursor:pointer; }
	.setup-modal .primary-button { font-size:.72rem; }
	.danger-outline { color:#8b372d; }
	.picker-list { display:grid; gap:.45rem; max-height:55vh; overflow:auto; }
	.picker-campaign { display:flex; align-items:center; gap:.4rem; border:1px solid #c5b28a; border-radius:7px; background:#f4e8cf; padding:.35rem; }
	.picker-campaign.current { border-color:#2d6560; box-shadow:inset 3px 0 #2d6560; }
	.picker-select { display:grid; gap:.1rem; flex:1; min-width:0; text-align:left; border:0; background:transparent; padding:.45rem; color:#382d1d; cursor:pointer; }
	.picker-select strong { font:700 .84rem var(--font-head); overflow-wrap:anywhere; }
	.picker-select small { color:#76664a; font-size:.65rem; }
	.picker-edit, .picker-delete { min-height:2.2rem; border:0; border-radius:5px; padding:.35rem .55rem; color:#28524d; background:#e5d8b9; font-size:.65rem; cursor:pointer; }
	.picker-delete { color:#8b372d; font-size:1rem; }
	.campaign-list { display:grid; gap:.5rem; }
	.campaign-card { display:flex; align-items:center; gap:.65rem; width:100%; border:1px solid #c7b58c; border-radius:7px; background:#f1e5cb; padding:.65rem; color:#34291a; text-align:left; cursor:pointer; }
	.campaign-card > span:nth-child(2) { display:grid; gap:.1rem; min-width:0; }
	.campaign-card strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:700 .8rem var(--font-head); }
	.campaign-card small { color:#76664a; font-size:.62rem; }
	.campaign-card b { margin-left:auto; color:#957c4e; font-size:1.2rem; }
	.campaign-card-mark { display:grid; place-items:center; flex:none; width:2rem; height:2rem; border:1px solid #b89a5e; border-radius:6px; background:#e6dac0; color:#28524d; font:700 .8rem var(--font-head); }
	.text-action { border:0; background:transparent; color:#285a55; font:700 .68rem var(--font-head); cursor:pointer; }
	.campaign-dashboard { display:grid; gap:.5rem; }
	.dashboard-welcome { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1rem; border:1px solid #c5b28a; border-left:4px solid #2d6560; border-radius:8px; background:#f1e5cb; }
	.dashboard-welcome h2 { margin:.15rem 0; color:#34291a; font:700 1.25rem var(--font-head); }
	.dashboard-welcome p:not(.eyebrow) { margin:0; color:#76664a; font-size:.72rem; }
	.section-placeholder { display:grid; justify-items:center; text-align:center; align-content:center; min-height:20rem; border:1px dashed #b89b64; border-radius:9px; background:#f3e8d0a8; padding:1.5rem; }
	.placeholder-glyph { display:grid; place-items:center; width:3.5rem; height:3.5rem; margin-bottom:.8rem; border-radius:50%; background:#2d6560; color:#f3d98c; font-size:1.6rem; }
	.section-placeholder h2 { margin:.1rem 0 .4rem; color:#34291a; font:700 1.4rem var(--font-head); }
	.section-placeholder > p:not(.eyebrow) { max-width:25rem; margin:0; color:#76664a; font-size:.78rem; }
	.stage-badge { margin-top:1rem; padding:.25rem .55rem; border:1px solid #c5b28a; border-radius:99px; background:#e9ddc1; color:#76664a; font:700 .55rem var(--font-head); text-transform:uppercase; letter-spacing:.06em; }
	.notice { margin:.8rem 0 0; border-radius:6px; background:#f2d8cf; color:#742d24; padding:.55rem .7rem; font-size:.72rem; }
	@media (max-width: 1017px) {
		.tabs-arrow { display: grid; place-items: center; }
		.tabs { justify-content: flex-start; flex: 1; }
		.drawer-aside { display: none; }
		.drawer-mobile-backdrop { display: block; position: fixed; inset: 0; z-index: 25; background: #0d0a0788; }
		.site-drawer { position: fixed; right: 0; top: 0; bottom: 0; z-index: 30; width: min(460px, calc(100vw - 40px)); box-shadow: -12px 0 35px #0006; }
		.bottom-closed-actions { justify-content: space-between; padding: 0 .5rem; }
		.footer-empty { display: block; width: 2.9rem; }
		.mobile-drawer-btn { display: grid; }
		.roller-drawer-btn { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid #b4893c; border-radius: 5px; background: #214c48; color: #f6ecd7; font-size: 1rem; cursor: pointer; }
	}
	@media (max-width: 580px) {
		.record-form-grid, .record-field-grid { grid-template-columns:1fr; }
		.map-editor { padding:.55rem; }.map-heading { align-items:flex-start; flex-direction:column; }.map-heading label { align-items:flex-start; flex-direction:column; width:100%; }.map-heading select { width:100%; }.map-controls { align-items:flex-start; }.map-surface { min-height:14rem; }.map-cell-badge { font-size:.42rem; }.map-record-tabs button { font-size:.56rem; }.faction-influence { align-items:stretch; flex-direction:column; }
		.record-stat-row { grid-template-columns:repeat(2,minmax(0,1fr)); }.record-stat-row.attributes { grid-template-columns:repeat(3,minmax(0,1fr)); }
		.record-chip-groups p strong { width:100%; }
		.bottom-dice-panel { padding:.4rem; }
		.bottom-action-equation { gap:.24rem; font-size:.82rem; }
		.bottom-action-equation .roll-die { width:2.45rem; height:2.45rem; }
		.bottom-stat-options button { font-size:.58rem; }
		.site-toolbar { padding: 0 .5rem; }
		.campaign-title-btn h1 { font-size: 1.02rem; max-width: 44vw; }
		.header-actions { gap:.28rem; }
		.icon-button { width:1.95rem; height:1.95rem; }
		.table-tool-sheet { width:100%; border-left:0; border-top:2px solid var(--brass); border-radius:12px 12px 0 0; height:min(90dvh,48rem); align-self:flex-end; padding-bottom:calc(1rem + var(--safe-b)); }
		.content { padding: .65rem .7rem 1rem; }
		.hero-card { min-height: 0; grid-template-columns: 1fr; }
		.hero-copy { padding: 1.1rem 1rem; }
		.hero-copy h2 { font-size: 1.45rem; }
		.hero-copy > p:not(.eyebrow) { font-size: .78rem; }
		.hero-art { min-height: 9rem; }
		.foundation-grid { grid-template-columns: 1fr; gap: .5rem; }
		.foundation-card { min-height: 0; display: grid; grid-template-columns: 2rem 1fr; column-gap: .6rem; align-items: start; padding: .65rem; }
		.foundation-icon { grid-row: span 2; margin: 0; }
		.foundation-card h3 { align-self: end; }
		.foundation-card p { grid-column: 2; }
		.dashboard-welcome { align-items:flex-start; flex-direction:column; }
		.modal-actions { flex-wrap:wrap; }
	}
</style>
