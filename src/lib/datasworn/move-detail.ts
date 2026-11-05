import type { DataswornRecord } from './catalog';
import { oracleTableFromRecord, type ActionRoll, type OracleTable } from './oracles';

/** Extract any embedded rollable oracle tables attached to a Datasworn move. */
export function embeddedMoveOracles(move: DataswornRecord): OracleTable[] {
	const oracles = move.data.oracles;
	if (!oracles || typeof oracles !== 'object' || Array.isArray(oracles)) return [];
	const tables: OracleTable[] = [];
	for (const [key, entry] of Object.entries(oracles as Record<string, unknown>)) {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
		const node = entry as Record<string, unknown>;
		const fakeRecord: DataswornRecord = {
			id: typeof node._id === 'string' ? node._id : `${move.id}.oracle.${key}`,
			name: typeof node.name === 'string' ? node.name : key.replaceAll('_', ' '),
			type: 'oracle_rollable',
			packId: move.packId,
			packTitle: move.packTitle,
			packLicense: move.packLicense,
			packUrl: move.packUrl,
			path: `${move.path}.oracles.${key}`,
			category: move.name,
			description: '',
			sourceTitle: move.sourceTitle,
			sourceLicense: move.sourceLicense,
			sourceUrl: move.sourceUrl,
			data: node
		};
		const table = oracleTableFromRecord(fakeRecord);
		if (table) tables.push(table);
	}
	return tables;
}

/** Use text from the selected Datasworn item; never infer a move effect from its title. */
export function moveOutcomeText(move: DataswornRecord, outcome: ActionRoll['outcome']): string {
	const key = outcome === 'Strong hit' ? 'strong_hit' : outcome === 'Weak hit' ? 'weak_hit' : 'miss';
	const outcomes = move.data.outcomes;
	if (!outcomes || typeof outcomes !== 'object' || Array.isArray(outcomes)) return '';
	const result = (outcomes as Record<string, unknown>)[key];
	if (!result || typeof result !== 'object' || Array.isArray(result)) return '';
	const text = (result as Record<string, unknown>).text;
	return typeof text === 'string' ? text : '';
}

/** Trigger conditions can offer different stats; the player still chooses which applies. */
export function moveStats(move: DataswornRecord): string[] {
	const trigger = move.data.trigger;
	if (!trigger || typeof trigger !== 'object' || Array.isArray(trigger)) return [];
	const conditions = (trigger as Record<string, unknown>).conditions;
	if (!Array.isArray(conditions)) return [];
	const stats: string[] = [];
	for (const condition of conditions) {
		if (!condition || typeof condition !== 'object') continue;
		const choices = (condition as Record<string, unknown>).roll_options;
		if (!Array.isArray(choices)) continue;
		for (const choice of choices) {
			if (!choice || typeof choice !== 'object' || Array.isArray(choice)) continue;
			const value = choice as Record<string, unknown>;
			if (value.using === 'stat' && typeof value.stat === 'string' && !stats.includes(value.stat)) stats.push(value.stat);
		}
	}
	return stats;
}

export function actionMoveStats(move: DataswornRecord): ('edge' | 'heart' | 'iron' | 'shadow' | 'wits')[] {
	const base = ['edge', 'heart', 'iron', 'shadow', 'wits'] as const;
	return moveStats(move).filter((stat): stat is (typeof base)[number] => base.some((known) => known === stat));
}

/** Plain-text rendition for safe, legible rule display; Svelte escapes the returned string. */
export function readableMoveText(text: string): string {
	return text
		.replace(/\[([^\]]+)\]\(datasworn:[^)]+\)/g, '$1')
		.replace(/\[([^\]]+)\]\((?:https?:\/\/)[^)]+\)/g, '$1')
		.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a: string | undefined, b: string | undefined) => a ?? b ?? '')
		.replace(/^[ \t]*\*\s+/gm, '• ')
		.trim();
}
