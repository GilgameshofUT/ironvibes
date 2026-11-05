import { createId } from '../id';

export type JournalEntry = {
	id: string;
	text: string;
	createdAt: string;
	kind: 'note';
};

function isJournalEntry(value: unknown): value is JournalEntry {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<JournalEntry>;
	return typeof entry.id === 'string' && entry.id.length > 0 &&
		typeof entry.text === 'string' && entry.text.trim().length > 0 &&
		typeof entry.createdAt === 'string' && entry.kind === 'note';
}

export function parseJournalEntries(serialized: string | null): JournalEntry[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		return Array.isArray(value) ? value.filter(isJournalEntry) : [];
	} catch {
		return [];
	}
}

export function makeJournalEntry(text: string, id: string = createId(), createdAt: string = new Date().toISOString()): JournalEntry {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Write a note before adding it to the journal.');
	return { id, text: trimmed, createdAt, kind: 'note' };
}

export function appendJournalEntry(entries: JournalEntry[], entry: JournalEntry): JournalEntry[] {
	return [...entries, entry];
}

export function removeJournalEntry(entries: JournalEntry[], id: string): JournalEntry[] {
	return entries.filter((entry) => entry.id !== id);
}

export function updateJournalEntry(entries: JournalEntry[], id: string, text: string): JournalEntry[] {
	const trimmed = text.trim();
	if (!trimmed) throw new Error('Write a note before updating it in the journal.');
	return entries.map((entry) => (entry.id === id ? { ...entry, text: trimmed } : entry));
}

export function moveJournalEntry(entries: JournalEntry[], id: string, direction: 'up' | 'down'): JournalEntry[] {
	const index = entries.findIndex((entry) => entry.id === id);
	const target = direction === 'up' ? index - 1 : index + 1;
	if (index < 0 || target < 0 || target >= entries.length) return entries;
	const next = [...entries];
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

export function journalEntryTitle(entry: JournalEntry): string {
	const firstLine = entry.text
		.split(/\r?\n/)
		.map((line) => line.replace(/^#+\s*|^\*\s*|^>\s*|\*\*|__/g, '').trim())
		.find(Boolean) ?? '...';
	return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine;
}
