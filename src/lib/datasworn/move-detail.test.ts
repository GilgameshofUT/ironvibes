import { describe, expect, it } from 'vitest';
import classic from '@datasworn-community/ironsworn-classic/json/classic.json';
import { flattenDataswornPack } from './catalog';
import { actionMoveStats, moveOutcomeText, moveStats, readableMoveText } from './move-detail';

const move = flattenDataswornPack(classic).find((record) => record.id === 'move:classic/adventure/face_danger')!;

describe('contextual Datasworn move details', () => {
	it('reads the actual outcome text and stat choices for Face Danger', () => {
		expect(moveStats(move)).toEqual(['edge', 'heart', 'iron', 'shadow', 'wits']);
		expect(actionMoveStats(move)).toEqual(['edge', 'heart', 'iron', 'shadow', 'wits']);
		expect(moveOutcomeText(move, 'Strong hit')).toContain('Take +1 momentum');
		expect(moveOutcomeText(move, 'Weak hit')).toContain('troublesome cost');
		expect(moveOutcomeText(move, 'Miss')).toContain('[Pay the Price](datasworn:move:classic/fate/pay_the_price)');
	});
	it('does not invent outcomes or stats for unstructured imports', () => {
		const custom = { ...move, data: { name: 'Custom', type: 'move' } };
		expect(moveStats(custom)).toEqual([]);
		expect(moveOutcomeText(custom, 'Miss')).toBe('');
		expect(actionMoveStats({ ...move, data: { trigger: { conditions: [{ roll_options: [{ using: 'stat', stat: 'integrity' }] }] } } })).toEqual([]);
	});
	it('renders references and emphasis without exposing raw markup', () => {
		expect(readableMoveText('__On a miss__, [Pay the Price](datasworn:move:classic/fate/pay_the_price).\n\n  * Pay a cost.')).toBe('On a miss, Pay the Price.\n\n• Pay a cost.');
	});
});
