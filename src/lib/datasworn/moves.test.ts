import { describe, expect, it } from 'vitest';
import classic from '@datasworn-community/ironsworn-classic/json/classic.json';
import delve from '@datasworn-community/ironsworn-classic-delve/json/delve.json';
import starforged from '@datasworn-community/starforged/json/starforged.json';
import sunderedIsles from '@datasworn-community/sundered-isles/json/sundered_isles.json';
import feRunners from '@datasworn-community/fe-runners/json/fe_runners.json';
import ancientWonders from '@datasworn-community/ancient-wonders/json/ancient_wonders.json';
import { flattenDataswornPack, type DataswornPack } from './catalog';
import { flatPackMoves, groupedCampaignMoves, type MoveSource } from './moves';

const packs: DataswornPack[] = [classic, delve, starforged, sunderedIsles, feRunners, ancientWonders] as DataswornPack[];
const records = packs.flatMap((pack) => flattenDataswornPack(pack));
const sources: MoveSource[] = packs.map((pack) => ({ id: pack._id!, bundled: true, pack }));
const names = (groups: ReturnType<typeof groupedCampaignMoves>) => groups.flatMap(({ moves }) => moves.map((move) => move.name));

describe('campaign move categories', () => {
	it('shows classic and Delve only with Ironsworn characters, retaining Datasworn order and category names', () => {
		const groups = groupedCampaignMoves('ironsworn', 'ironsworn', records, sources);
		expect(groups[0].name).toBe('Adventure Moves');
		expect(groups[0].moves.slice(0, 2).map((move) => move.name)).toEqual(['Face Danger', 'Secure an Advantage']);
		expect(groups.find((group) => group.name === 'Delve Moves')?.moves.some((move) => move.name === 'Discover a Site')).toBe(true);
		expect(names(groups)).not.toContain('Begin a Session');
		expect(groups.flatMap((group) => group.moves).some((move) => move.packId === 'fe_runners')).toBe(false);
	});
	it('follows the independent character ruleset, not just the campaign setting', () => {
		const mixed = groupedCampaignMoves('sundered-isles', 'ironsworn', records, sources);
		expect(mixed[0].moves[0].id).toBe('move:classic/adventure/face_danger');
		expect(mixed.flatMap((group) => group.moves).some((move) => move.packId === 'sundered_isles')).toBe(false);
		const star = groupedCampaignMoves('starforged', 'starforged', records, sources);
		expect(star[0].name).toBe('Session Moves');
		expect(star[0].moves[0].name).toBe('Begin a Session');
		expect(names(star)).not.toContain('Discover a Site');
		const otherMixed = groupedCampaignMoves('ironsworn', 'starforged', records, sources);
		expect(otherMixed[0].moves[0].id).toBe('move:starforged/session/begin_a_session');
		expect(otherMixed.flatMap((group) => group.moves).some((move) => move.packId === 'delve')).toBe(false);
	});
	it('uses Sundered Isles move replacements instead of duplicating Starforged originals', () => {
		const groups = groupedCampaignMoves('sundered-isles', 'starforged', records, sources);
		const voyage = groups.flatMap((group) => group.moves).filter((move) => move.name === 'Undertake an Expedition');
		expect(voyage.map((move) => move.id)).toEqual(['move:sundered_isles/exploration/undertake_an_expedition']);
		expect(groups.find((group) => group.name === 'Exploration Moves')?.moves.some((move) => move.name === 'Make a Discovery')).toBe(true);
	});
	it('only shows compatible imported moves by default, with opt-in for unscoped content', () => {
		const local: DataswornPack = { _id: 'local_pack', type: 'expansion', title: 'Local pack', moves: {
			a: { type: 'move', _id: 'move:local_pack/custom/a', name: 'Unscoped Move' },
			b: { type: 'move', _id: 'move:local_pack/custom/b', name: 'Classic Replacement', replaces: ['move:classic/adventure/face_danger'] }
		} };
		const localRecords = [...records, ...flattenDataswornPack(local)];
		const localSources = [...sources, { id: 'local_pack', bundled: false, pack: local }];
		const scoped = groupedCampaignMoves('ironsworn', 'ironsworn', localRecords, localSources);
		expect(names(scoped)).not.toContain('Unscoped Move');
		expect(names(scoped)).toContain('Classic Replacement');
		expect(names(scoped)).not.toContain('Face Danger');
		expect(names(groupedCampaignMoves('starforged', 'starforged', localRecords, localSources))).not.toContain('Classic Replacement');
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', localRecords, localSources, 'unscoped', true))).toContain('Unscoped Move');
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', localRecords, localSources, 'replacement'))).toContain('Classic Replacement');
		const versioned: DataswornPack = { ...local, _id: 'local_star_pack', ruleset: 'starforged', moves: {
			x: { type: 'move', _id: 'move:local_star_pack/session/custom', name: 'Starforged House Move' },
			y: { type: 'move', _id: 'move:local_star_pack/adventure/cross_reference', name: 'Conflicting Replacement', replaces: ['move:classic/adventure/face_danger'] }
		} };
		const withVersioned = [...localRecords, ...flattenDataswornPack(versioned)];
		const withSources = [...localSources, { id: 'local_star_pack', bundled: false, pack: versioned }];
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', withVersioned, withSources))).not.toContain('Starforged House Move');
		expect(names(groupedCampaignMoves('starforged', 'starforged', withVersioned, withSources))).toContain('Starforged House Move');
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', withVersioned, withSources, '', true))).not.toContain('Starforged House Move');
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', withVersioned, withSources, '', true))).not.toContain('Conflicting Replacement');
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', withVersioned, withSources, '', true))).toContain('Classic Replacement');

		const classicAlias: DataswornPack = { _id: 'ironsworn_house', type: 'expansion', title: 'Ironsworn House Rules', ruleset: 'ironsworn', moves: {
			custom: { type: 'move', _id: 'move:ironsworn_house/quest/custom', name: 'Ironsworn House Move' }
		} };
		const withAliasRecords = [...withVersioned, ...flattenDataswornPack(classicAlias)];
		const withAliasSources = [...withSources, { id: 'ironsworn_house', bundled: false, pack: classicAlias }];
		expect(names(groupedCampaignMoves('ironsworn', 'ironsworn', withAliasRecords, withAliasSources))).toContain('Ironsworn House Move');
		expect(names(groupedCampaignMoves('starforged', 'starforged', withAliasRecords, withAliasSources, '', true))).not.toContain('Ironsworn House Move');
	});

	it('indexes Fe-Runners and Ancient Wonders moves for their expansion drawer panels', () => {
		const feMoves = flatPackMoves('fe_runners', records);
		expect(feMoves.some((m) => m.record.name === 'Jacking in' && m.categoryLabel === 'Exploration')).toBe(true);
		expect(feMoves.some((m) => m.record.name === 'Develop an Artifact' && m.categoryLabel === 'Artifact')).toBe(true);
		const awMoves = flatPackMoves('ancient_wonders', records);
		expect(awMoves.some((m) => m.record.name === 'Hunker Down' && m.categoryLabel === 'Making Camp')).toBe(true);
		expect(awMoves.some((m) => m.record.name === 'Browse The Market' && m.categoryLabel === 'Exchanging Wealth')).toBe(true);
	});
});
