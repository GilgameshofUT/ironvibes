import { createId } from '../id';
import type { DataswornRecord } from '../datasworn/catalog';

export type CampaignTruth = {
	id: string;
	recordId: string;
	category: string;
	value: string;
	optionId: string;
	optionDescription: string;
	sourceTitle: string;
	sourceUrl: string;
	custom: boolean;
	createdAt: string;
	updatedAt: string;
};

export type CampaignTruthDraft = Pick<CampaignTruth, 'recordId' | 'category' | 'value' | 'optionId' | 'optionDescription' | 'sourceTitle' | 'sourceUrl' | 'custom'>;

export type TruthSuboptionItem = {
	id: string;
	min: number;
	max: number;
	label: string;
};

export type TruthOptionItem = {
	id: string;
	min: number;
	max: number;
	label: string;
	description: string;
	suboptions: TruthSuboptionItem[];
};

function cleanTruthMarkdown(text: string): string {
	return text
		.replace(/\{\{table>[^}]+\}\}/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\s+\n/g, '\n')
		.replace(/\n{2,}/g, ' ')
		.trim();
}

export function extractTruthCardOptions(record: DataswornRecord): TruthOptionItem[] {
	const rawOptions = Array.isArray(record.data.options) ? record.data.options : [];
	return rawOptions.flatMap((option, index) => {
		if (!option || typeof option !== 'object') return [];
		const item = option as Record<string, unknown>;
		const roll = item.roll && typeof item.roll === 'object' ? (item.roll as { min?: unknown; max?: unknown }) : {};
		const min = typeof roll.min === 'number' ? roll.min : index * 33 + 1;
		const max = typeof roll.max === 'number' ? roll.max : Math.min(100, (index + 1) * 33 + (index === 2 ? 1 : 0));
		const rawSummary = typeof item.summary === 'string' ? cleanTruthMarkdown(item.summary) : '';
		const rawDesc = typeof item.description === 'string' ? cleanTruthMarkdown(item.description) : '';
		let label = rawSummary;
		let description = rawDesc;
		if (!label && rawDesc) {
			const match = rawDesc.match(/^([^.!?]+[.!?])\s*(.*)$/s);
			if (match) {
				label = match[1].trim();
				description = match[2].trim();
			} else {
				label = rawDesc;
				description = '';
			}
		}
		if (!label) return [];
		const suboptions: TruthSuboptionItem[] = [];
		if (item.oracles && typeof item.oracles === 'object') {
			for (const oracle of Object.values(item.oracles as Record<string, unknown>)) {
				if (!oracle || typeof oracle !== 'object') continue;
				const rows = Array.isArray((oracle as { rows?: unknown[] }).rows) ? (oracle as { rows: unknown[] }).rows : [];
				rows.forEach((r, sIdx) => {
					if (!r || typeof r !== 'object') return;
					const rowObj = r as { _id?: unknown; text?: unknown; roll?: { min?: unknown; max?: unknown } };
					const sText = typeof rowObj.text === 'string' ? cleanTruthMarkdown(rowObj.text) : '';
					if (!sText) return;
					const sMin = typeof rowObj.roll?.min === 'number' ? rowObj.roll.min : sIdx + 1;
					const sMax = typeof rowObj.roll?.max === 'number' ? rowObj.roll.max : sMin;
					suboptions.push({
						id: typeof rowObj._id === 'string' ? rowObj._id : `${record.id}-opt-${index}-sub-${sIdx}`,
						min: sMin,
						max: sMax,
						label: sText
					});
				});
			}
		}
		return [{
			id: typeof item._id === 'string' ? item._id : `${record.id}#${index}`,
			min,
			max,
			label,
			description,
			suboptions
		}];
	});
}

export function formatTruthSelectionText(option: TruthOptionItem, suboption?: TruthSuboptionItem | null): string {
	const base = option.description && option.description !== option.label
		? `${option.label} ${option.description}`
		: option.label;
	return suboption ? `${base} ${suboption.label}`.trim() : base.trim();
}

export function rollTruthOption(options: TruthOptionItem[], random: () => number = Math.random): { roll: number; option: TruthOptionItem } | null {
	if (!options.length) return null;
	const roll = Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;
	const option = options.find((candidate) => roll >= candidate.min && roll <= candidate.max) ?? options[options.length - 1];
	return { roll, option };
}

export function rollTruthSuboption(suboptions: TruthSuboptionItem[], random: () => number = Math.random): { roll: number; suboption: TruthSuboptionItem } | null {
	if (!suboptions.length) return null;
	const roll = Math.floor(Math.max(0, Math.min(0.999999999, random())) * 100) + 1;
	const suboption = suboptions.find((candidate) => roll >= candidate.min && roll <= candidate.max) ?? suboptions[suboptions.length - 1];
	return { roll, suboption };
}

function isCampaignTruth(value: unknown): value is CampaignTruth {
	if (!value || typeof value !== 'object') return false;
	const truth = value as Partial<CampaignTruth>;
	return typeof truth.id === 'string' && truth.id.length > 0 &&
		typeof truth.recordId === 'string' && typeof truth.category === 'string' && truth.category.trim().length > 0 &&
		typeof truth.value === 'string' && truth.value.trim().length > 0 && typeof truth.optionId === 'string' && typeof truth.optionDescription === 'string' &&
		typeof truth.sourceTitle === 'string' && typeof truth.sourceUrl === 'string' && typeof truth.custom === 'boolean' &&
		typeof truth.createdAt === 'string' && typeof truth.updatedAt === 'string';
}

export function parseCampaignTruths(serialized: string | null): CampaignTruth[] {
	if (!serialized) return [];
	try {
		const value: unknown = JSON.parse(serialized);
		return Array.isArray(value) ? value.filter(isCampaignTruth) : [];
	} catch {
		return [];
	}
}

export function saveCampaignTruth(truths: CampaignTruth[], draft: CampaignTruthDraft, id: string = createId(), now = new Date().toISOString()): CampaignTruth[] {
	const category = draft.category.trim();
	const value = draft.value.trim();
	if (!category) throw new Error('Enter a truth label.');
	if (!value) throw new Error('Choose or write a truth before saving.');
	const existing = draft.recordId ? truths.find((truth) => truth.recordId === draft.recordId) : truths.find((truth) => truth.id === id);
	const truth: CampaignTruth = {
		...draft,
		category,
		value,
		id: existing?.id ?? id,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now
	};
	if (existing) return truths.map((item) => item.id === existing.id ? truth : item);
	return [...truths, truth];
}

export function removeCampaignTruth(truths: CampaignTruth[], id: string): CampaignTruth[] {
	return truths.filter((truth) => truth.id !== id);
}
