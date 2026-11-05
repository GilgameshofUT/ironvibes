import { describe, expect, it } from 'vitest';
import classic from '@datasworn-community/ironsworn-classic/json/classic.json';
import delve from '@datasworn-community/ironsworn-classic-delve/json/delve.json';
import ancientWonders from '@datasworn-community/ancient-wonders/json/ancient_wonders.json';
import feRunners from '@datasworn-community/fe-runners/json/fe_runners.json';
import ironsmith from '@datasworn-community/ironsmith/json/ironsmith.json';
import starforged from '@datasworn-community/starforged/json/starforged.json';
import starsmith from '@datasworn-community/starsmith/json/starsmith.json';
import sunderedIsles from '@datasworn-community/sundered-isles/json/sundered_isles.json';
import vaultsAndVows from './vaults_and_vows.json';
import { flattenDataswornPack, normalizeDataswornImport, recordMatches } from './catalog';
import { importDataswornPack, removeImportedPack, restoreImportedPacks } from './imports';

describe('Datasworn import normalization', () => {
	it('accepts every bundled ruleset and expansion package', () => {
		for (const fixture of [classic, delve, starforged, sunderedIsles, ancientWonders, feRunners, ironsmith, starsmith, vaultsAndVows]) {
			const normalized = normalizeDataswornImport(fixture, 'local-id');
			expect(normalized.kind).toBe('pack');
			expect(normalized.pack._id).toBe(fixture._id);
			expect(normalized.recordCount).toBeGreaterThan(0);
		}
		const vvAssets = flattenDataswornPack(vaultsAndVows).filter((r) => r.type === 'asset');
		expect(vvAssets).toHaveLength(106);
	});

	it('indexes the concrete Datasworn site theme and domain types', () => {
		const records = flattenDataswornPack(delve);
		expect(records.some((record) => record.type === 'delve_site_theme')).toBe(true);
		expect(records.some((record) => record.type === 'delve_site_domain')).toBe(true);
		expect(records.filter((record) => record.type === 'delve_site_theme').length).toBe(8);
		expect(records.filter((record) => record.type === 'delve_site_domain').length).toBe(12);
	});

	it('wraps a single exported Datasworn item and retains source attribution', () => {
		const item = {
			type: 'move',
			_id: 'move:classic/quest/swear_an_iron_vow',
			name: 'Swear an Iron Vow',
			description: 'Write your vow and give the quest a rank.',
			_source: {
				title: 'Ironsworn Rulebook',
				license: 'https://creativecommons.org/licenses/by/4.0',
				url: 'https://example.com/source'
			}
		};
		const imported = normalizeDataswornImport(item, 'local-vow');
		const [record] = flattenDataswornPack(imported.pack);

		expect(imported.kind).toBe('item');
		expect(imported.recordCount).toBe(1);
		expect(record.name).toBe('Swear an Iron Vow');
		expect(record.sourceTitle).toBe('Ironsworn Rulebook');
		expect(record.sourceLicense).toBe('https://creativecommons.org/licenses/by/4.0');
		expect(record.sourceUrl).toBe('https://example.com/source');
	});

	it('keeps standalone item pack IDs stable without slug collisions', () => {
		const makeItem = (id: string) => ({ type: 'asset', _id: id, name: 'Imported Asset' });
		const first = normalizeDataswornImport(makeItem('asset:community/a-b'), 'fallback');
		const second = normalizeDataswornImport(makeItem('asset:community/a_b'), 'fallback');
		expect(first.pack._id).not.toBe(second.pack._id);
		expect(normalizeDataswornImport(makeItem('asset:community/a-b'), 'different-fallback').pack._id)
			.toBe(first.pack._id);
		const missingId = normalizeDataswornImport({
			type: 'expansion', assets: { a: makeItem('asset:community/a') }
		}, 'generated-id');
		expect(missingId.warnings).toContain('No stable pack ID was declared; a local ID was assigned.');
	});

	it('rejects unsupported objects and empty package shells', () => {
		expect(() => normalizeDataswornImport({ hello: 'world' }, 'local')).toThrow(/does not appear/);
		expect(() => normalizeDataswornImport({ type: 'expansion', _id: 'empty' }, 'local')).toThrow(/no supported content sections/);
		expect(() => normalizeDataswornImport({ type: 'ruleset', _id: 'empty', assets: {} }, 'local')).toThrow(/no supported searchable entries/);
	});

	it('searches indexed records by name, source and ID terms', () => {
		const [record] = flattenDataswornPack(classic).filter((item) => item.name === 'Swear an Iron Vow');
		expect(recordMatches(record, 'swear iron vow')).toBe(true);
		expect(recordMatches(record, 'move:classic/quest')).toBe(true);
		expect(recordMatches(record, 'not a matching phrase')).toBe(false);
	});

	it('replaces a duplicate imported pack ID and protects bundled IDs', () => {
		const original = { ...classic, title: 'First imported copy' };
		const replacement = { ...classic, title: 'Replacement copy' };
		const first = importDataswornPack([], original, 'fallback').packs;
		const second = importDataswornPack(first, replacement, 'fallback').packs;

		expect(second).toHaveLength(1);
		expect(second[0].title).toBe('Replacement copy');
		expect(() => importDataswornPack([], classic, 'fallback', undefined, ['classic']))
			.toThrow(/bundled content/);
	});

	it('restores valid unique imports while filtering malformed and bundled collisions', () => {
		const duplicateA = { ...classic, _id: 'custom-pack', title: 'Old copy' };
		const duplicateB = { ...classic, _id: 'custom-pack', title: 'Latest copy' };
		const restored = restoreImportedPacks(JSON.stringify([
			duplicateA,
			duplicateB,
			{ ...starforged, _id: 'starforged' },
			{ nope: true },
			null
		]), ['starforged']);

		expect(restored).toHaveLength(1);
		expect(restored[0].title).toBe('Latest copy');
		expect(restoreImportedPacks('{bad json')).toEqual([]);
		expect(restoreImportedPacks(null)).toEqual([]);
	});

	it('rejects standalone records that cannot be placed in a supported section', () => {
		expect(() => normalizeDataswornImport({
			type: 'unknown_record',
			_id: 'custom:thing',
			name: 'Unknown'
		}, 'fallback')).toThrow(/supported Datasworn item/);
	});

	it('removes one imported pack without disturbing others', () => {
		const current = [
			{ ...classic, _id: 'custom-one' },
			{ ...delve, _id: 'custom-two' }
		];
		expect(removeImportedPack(current, 'custom-one').map((pack) => pack._id)).toEqual(['custom-two']);
	});
});
