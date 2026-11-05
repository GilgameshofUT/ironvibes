import { describe, expect, it } from 'vitest';
import { appendJournalEntry, journalEntryTitle, makeJournalEntry, moveJournalEntry, parseJournalEntries, removeJournalEntry, updateJournalEntry } from './journal';

describe('campaign journal notes', () => {
	it('trims and creates notes, rejecting blank content', () => {
		expect(makeJournalEntry('  The trail turns north.  ', 'entry-1', '2026-11-04T10:00:00.000Z'))
			.toEqual({ id: 'entry-1', text: 'The trail turns north.', createdAt: '2026-11-04T10:00:00.000Z', kind: 'note' });
		expect(() => makeJournalEntry('  ', 'empty', 'now')).toThrow(/write a note/i);
	});

	it('parses saved notes safely and appends/removes by entry ID', () => {
		const first = makeJournalEntry('First note', 'one', 'first');
		const second = makeJournalEntry('Second note', 'two', 'second');
		expect(parseJournalEntries(JSON.stringify([first, null, { ...second, text: '  ' }]))).toEqual([first]);
		expect(parseJournalEntries('{bad')).toEqual([]);
		expect(appendJournalEntry([first], second)).toEqual([first, second]);
		expect(removeJournalEntry([first, second], 'one')).toEqual([second]);
		expect(updateJournalEntry([first, second], 'one', 'Updated first')).toEqual([{ ...first, text: 'Updated first' }, second]);
		expect(moveJournalEntry([first, second], 'two', 'up')).toEqual([second, first]);
		expect(journalEntryTitle(makeJournalEntry('# Chapter One\nMore details', 'id', 'now'))).toBe('Chapter One');
	});
});
