import { describe, expect, it } from 'vitest';
import { data as classic } from '@datasworn-community/ironsworn-classic';
import { flattenDataswornPack, normalizeDataswornImport, type DataswornPack } from './catalog';
import { burnActionMomentum, oracleTableFromRecord, resolveActionRoll, rollAction, rollAskTheOracle, rollOracleTable, rollPayThePrice } from './oracles';

describe('Datasworn oracle tables', () => {
	it('adapts and rolls imported/bundled oracle_rollable rows using their declared ranges', () => {
		const record = flattenDataswornPack(classic as unknown as DataswornPack).find((item) => item.id === 'oracle_rollable:classic/action_and_theme/action');
		expect(record).toBeDefined();
		const table = oracleTableFromRecord(record!);
		expect(table?.dice).toBe('1d100');
		const result = rollOracleTable(table!, () => 0);
		expect(result.value).toBe(1);
		expect(result.row.text).toBe('Scheme');
	});

	it('rejects non-oracle records and errors when a declared roll has no matching range', () => {
		const record = flattenDataswornPack(classic as unknown as DataswornPack).find((item) => item.type === 'move');
		expect(record && oracleTableFromRecord(record)).toBeNull();
		const table = { id: 'x', name: 'Gap', dice: '1d6', packId: 'x', packTitle: 'x', category: '', sourceTitle: 'x', sourceUrl: '', description: '', rows: [{ min: 2, max: 6, text: 'Covered' }] };
		expect(() => rollOracleTable(table, () => 0)).toThrow(/not covered/);
	});

	it('supports a standalone imported Datasworn oracle item', () => {
		const normalized = normalizeDataswornImport({
			_id: 'oracle_rollable:custom/omens', name: 'Omens', type: 'oracle_rollable', dice: '1d6',
			rows: [{ roll: { min: 1, max: 3 }, text: 'A warning' }, { roll: { min: 4, max: 6 }, text: 'A gift' }],
			_source: { title: 'Test rules', license: 'CC0' }
		}, 'imported-test');
		const record = flattenDataswornPack(normalized.pack).find((item) => item.name === 'Omens');
		const table = record && oracleTableFromRecord(record);
		expect(table?.sourceTitle).toBe('Test rules');
		expect(rollOracleTable(table!, () => 0.99).row.text).toBe('A gift');
	});
});

describe('action rolls', () => {
	it('counts challenge dice strictly below the action total and formats the breakdown', () => {
		const rolls = [0, 0, 0.2];
		const result = rollAction(2, 1, () => rolls.shift() ?? 0);
		expect(result).toMatchObject({ actionDie: 1, stat: 2, adds: 1, challengeDice: [1, 3], total: 4, hits: 2, outcome: 'Strong hit' });
		expect(result.text).toContain('1 + 2 + 1 = 4');
	});

	it('validates stat and adds ranges', () => {
		expect(() => rollAction(11)).toThrow(/stat/);
		expect(() => rollAction(1, 11)).toThrow(/stat/);
	});
	it('caps action scores at ten and marks matching challenge dice', () => {
		expect(resolveActionRoll(6, 5, 3, [10, 10])).toMatchObject({ total: 10, outcome: 'Miss' });
		expect(resolveActionRoll(6, 5, 3, [10, 10]).text).toContain('(match)');
	});
	it('burns momentum using its score without changing the rolled action die', () => {
		const roll = resolveActionRoll(2, 1, 0, [4, 6]);
		expect(burnActionMomentum(roll, 5)).toMatchObject({ actionDie: 2, stat: 1, total: 5, outcome: 'Weak hit' });
	});
	it('cancels the action die when negative momentum equals its negative value', () => {
		expect(resolveActionRoll(3, 2, 0, [1, 4], -3)).toMatchObject({ actionDie: 0, total: 2, outcome: 'Weak hit', cancelledByNegativeMomentum: true });
	});
	it('resolves Ask the Oracle odds and match events plus Pay the Price', () => {
		const records = flattenDataswornPack(classic as unknown as DataswornPack);
		const ask = rollAskTheOracle('50%', 'ironsworn', records, () => 0.105);
		expect(ask).toMatchObject({ roll: 11, answer: 'No', isEvent: true });
		expect(ask.event?.text).toBeTruthy();
		const price = rollPayThePrice('ironsworn', records, () => 0.5);
		expect(price.text.length).toBeGreaterThan(5);
	});
});
