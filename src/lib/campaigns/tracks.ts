import { createId } from '../id';

export const TRACK_TYPES = ['Progress', 'Clock', 'Scene'] as const;
export type TrackType = (typeof TRACK_TYPES)[number];

export const TRACK_RANKS = ['Troublesome', 'Dangerous', 'Formidable', 'Extreme', 'Epic'] as const;
export type TrackRank = (typeof TRACK_RANKS)[number];
export const TRACK_PROGRESS_MAX = 10;
export const TRACK_TICKS_PER_BOX = 4;
export const TRACK_TICKS_MAX = TRACK_PROGRESS_MAX * TRACK_TICKS_PER_BOX;

export type CampaignTrack = {
	id: string;
	name: string;
	type: TrackType;
	rank: TrackRank;
	threat: boolean;
	progress: number;
	/** Quarter-box marks; absent on older saves, where progress stores whole boxes. */
	progressTicks?: number;
	/** Clock length applies to Clock and Scene; absent from older saves. */
	steps?: number;
	sceneClockProgress?: number;
	threatName?: string;
	threatLevel?: number;
	notes?: string;
	createdAt: string;
	updatedAt: string;
	resolvedAt?: string;
	resolution?: string;
};

const typeSet = new Set<string>(TRACK_TYPES);
const rankSet = new Set<string>(TRACK_RANKS);

function isTrack(value: unknown): value is CampaignTrack {
	if (!value || typeof value !== 'object') return false;
	const track = value as Partial<CampaignTrack>;
	return typeof track.id === 'string' && track.id.length > 0 &&
		typeof track.name === 'string' && track.name.trim().length > 0 &&
		typeof track.type === 'string' && typeSet.has(track.type) &&
		typeof track.rank === 'string' && rankSet.has(track.rank) &&
		typeof track.threat === 'boolean' && Number.isInteger(track.progress) &&
		(track.progress as number) >= 0 && (track.progress as number) <= TRACK_PROGRESS_MAX &&
		(track.progressTicks === undefined || (Number.isInteger(track.progressTicks) && track.progressTicks >= 0 && track.progressTicks <= TRACK_TICKS_MAX && (track.type === 'Clock' || Math.floor(track.progressTicks / TRACK_TICKS_PER_BOX) === track.progress))) &&
		(track.steps === undefined || (Number.isInteger(track.steps) && track.steps >= 2 && track.steps <= 10)) &&
		(track.type !== 'Clock' || track.steps === undefined || (track.progress as number) <= track.steps) &&
		(track.sceneClockProgress === undefined || (Number.isInteger(track.sceneClockProgress) && track.sceneClockProgress >= 0 && track.sceneClockProgress <= (track.steps ?? 6))) &&
		(track.threatName === undefined || typeof track.threatName === 'string') &&
		(track.threatLevel === undefined || (Number.isInteger(track.threatLevel) && track.threatLevel >= 0 && track.threatLevel <= 10)) &&
		(track.notes === undefined || typeof track.notes === 'string') &&
		typeof track.createdAt === 'string' && typeof track.updatedAt === 'string' &&
		(track.resolvedAt === undefined || typeof track.resolvedAt === 'string') &&
		(track.resolution === undefined || typeof track.resolution === 'string');
}

/** Reads the local campaign track list and skips malformed records without losing valid tracks. */
export function parseCampaignTracks(serialized: string | null): CampaignTrack[] {
	if (!serialized) return [];
	try {
		const parsed: unknown = JSON.parse(serialized);
		if (!Array.isArray(parsed)) return [];
		const byId = new Map<string, CampaignTrack>();
		for (const value of parsed) {
			if (isTrack(value)) byId.set(value.id, normalizeLegacyClock({ ...value, name: value.name.trim() }));
		}
		return [...byId.values()];
	} catch {
		return [];
	}
}

export function makeCampaignTrack(
	input: { name: string; type: TrackType; rank: TrackRank; threat: boolean; steps?: number; threatName?: string; notes?: string },
	id: string = createId(),
	now: string = new Date().toISOString()
): CampaignTrack {
	const name = input.name.trim();
	if (!name) throw new Error('Enter a name for this track.');
	if (!typeSet.has(input.type) || !rankSet.has(input.rank) || typeof input.threat !== 'boolean') {
		throw new Error('Choose a supported track type, rank, and threat setting.');
	}
	const steps = input.steps ?? 6;
	if (!Number.isInteger(steps) || steps < 2 || steps > 10) throw new Error('Clock steps must be between 2 and 10.');
	return {
		id,
		name,
		type: input.type,
		rank: input.rank,
		threat: input.threat,
		progress: 0,
		steps,
		sceneClockProgress: 0,
		threatName: input.threat ? input.threatName?.trim() || 'Unknown threat' : '',
		threatLevel: 0,
		notes: input.notes ?? '',
		createdAt: now,
		updatedAt: now
	};
}

export function putCampaignTrack(tracks: CampaignTrack[], track: CampaignTrack): CampaignTrack[] {
	return [...tracks.filter((item) => item.id !== track.id), track];
}

export function updateTrackProgress(tracks: CampaignTrack[], id: string, progress: number, now = new Date().toISOString()): CampaignTrack[] {
	if (!Number.isInteger(progress) || progress < 0 || progress > TRACK_PROGRESS_MAX) throw new Error(`Progress must be between 0 and ${TRACK_PROGRESS_MAX} boxes.`);
	return tracks.map((item) => item.id === id ? { ...item, progress, progressTicks: progress * TRACK_TICKS_PER_BOX, updatedAt: now } : item);
}

export function trackTicks(track: CampaignTrack): number {
	return track.type === 'Clock' ? 0 : track.progressTicks ?? track.progress * TRACK_TICKS_PER_BOX;
}

export function clockSteps(track: CampaignTrack): number {
	return track.steps ?? Math.max(6, track.type === 'Clock' ? track.progress : track.sceneClockProgress ?? 0);
}

/** Repair older clocks created as ten-box progress tracks without discarding marks. */
export function normalizeLegacyClock(track: CampaignTrack): CampaignTrack {
	if (track.type !== 'Clock' || track.steps !== undefined) return track;
	const { progressTicks: _progressTicks, ...legacy } = track;
	return { ...legacy, steps: clockSteps(legacy), progress: Math.min(clockSteps(legacy), legacy.progress) };
}

export function markTrackClock(tracks: CampaignTrack[], id: string, direction: 1 | -1, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => {
		if (track.id !== id || (track.type !== 'Clock' && track.type !== 'Scene') || track.resolvedAt) return track;
		const steps = clockSteps(track);
		const progress = Math.max(0, Math.min(steps, (track.type === 'Scene' ? track.sceneClockProgress ?? 0 : track.progress) + direction));
		return track.type === 'Scene' ? { ...track, sceneClockProgress: progress, updatedAt: now } : { ...track, progress, updatedAt: now };
	});
}

export function markTrackThreat(tracks: CampaignTrack[], id: string, direction: 1 | -1, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => track.id === id && track.threat && !track.resolvedAt ? { ...track, threatLevel: Math.max(0, Math.min(10, (track.threatLevel ?? 0) + direction)), updatedAt: now } : track);
}

export function resolveTrackClock(tracks: CampaignTrack[], id: string, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => track.id === id && track.type === 'Clock' && !track.resolvedAt
		? { ...track, resolvedAt: now, resolution: `${track.name} ${track.progress === clockSteps(track) ? 'completed' : 'stopped'}.`, updatedAt: now } : track);
}

export function forsakeCampaignTrack(tracks: CampaignTrack[], id: string, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => track.id === id && track.type !== 'Clock' && !track.resolvedAt
		? { ...track, resolvedAt: now, resolution: `${track.name} forsaken.`, updatedAt: now } : track);
}

/** Ironsworn progress: troublesome 3 boxes, dangerous 2, formidable 1, extreme 2 ticks, epic 1 tick. */
export function ticksPerMark(rank: TrackRank): number {
	return { Troublesome: 12, Dangerous: 8, Formidable: 4, Extreme: 2, Epic: 1 }[rank];
}

export function markTrackProgress(tracks: CampaignTrack[], id: string, direction: 1 | -1, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => {
		if (track.id !== id || track.type === 'Clock' || track.resolvedAt) return track;
		const ticks = Math.max(0, Math.min(TRACK_TICKS_MAX, trackTicks(track) + direction * ticksPerMark(track.rank)));
		return { ...track, progress: Math.floor(ticks / TRACK_TICKS_PER_BOX), progressTicks: ticks, updatedAt: now };
	});
}

export function resolveCampaignTrack(tracks: CampaignTrack[], id: string, resolution: string, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => track.id === id ? { ...track, resolvedAt: now, resolution, updatedAt: now } : track);
}

export function updateCampaignTrack(tracks: CampaignTrack[], id: string, patch: Partial<Pick<CampaignTrack, 'name' | 'type' | 'rank' | 'threat' | 'steps' | 'threatName' | 'notes'>>, now = new Date().toISOString()): CampaignTrack[] {
	const track = tracks.find((item) => item.id === id);
	if (!track) return tracks;
	const next = { ...track, ...patch, updatedAt: now };
	if (patch.type && patch.type !== track.type) {
		// A clock's step count cannot be interpreted as progress ticks, or vice versa.
		next.progress = 0;
		next.progressTicks = undefined;
		next.sceneClockProgress = 0;
		next.threatLevel = 0;
	}
	if (!next.name.trim()) throw new Error('Enter a name for this track.');
	if (!typeSet.has(next.type) || !rankSet.has(next.rank) || typeof next.threat !== 'boolean') throw new Error('Choose a supported track type, rank, and threat setting.');
	if (!Number.isInteger(clockSteps(next)) || clockSteps(next) < 2 || clockSteps(next) > 10 || (next.type === 'Clock' && next.progress > clockSteps(next)) || (next.sceneClockProgress ?? 0) > clockSteps(next)) throw new Error('Clock steps must be between 2 and 10 and no fewer than existing marks.');
	return tracks.map((item) => item.id === id ? { ...next, name: next.name.trim() } : item);
}

export function reopenCampaignTrack(tracks: CampaignTrack[], id: string, now = new Date().toISOString()): CampaignTrack[] {
	return tracks.map((track) => {
		if (track.id !== id) return track;
		const { resolvedAt: _resolvedAt, resolution: _resolution, ...reopened } = track;
		return { ...reopened, updatedAt: now };
	});
}

export function removeCampaignTrack(tracks: CampaignTrack[], id: string): CampaignTrack[] {
	return tracks.filter((track) => track.id !== id);
}

export function moveCampaignTrack(tracks: CampaignTrack[], id: string, direction: 'up' | 'down'): CampaignTrack[] {
	const from = tracks.findIndex((track) => track.id === id);
	if (from < 0) return tracks;
	const to = from + (direction === 'up' ? -1 : 1);
	if (to < 0 || to >= tracks.length) return tracks;
	const next = [...tracks];
	[next[from], next[to]] = [next[to], next[from]];
	return next;
}

export function trackProgressBoxes(rank: TrackRank): number {
	void rank;
	return TRACK_PROGRESS_MAX;
}

export function rollTrackRank(random: () => number = Math.random): TrackRank {
	const index = Math.floor(Math.max(0, Math.min(0.999999999, random())) * TRACK_RANKS.length);
	return TRACK_RANKS[index];
}

export function buildTrackResolution(track: CampaignTrack, actionRoll: number, challengeOne: number, challengeTwo: number): string {
	if (!Number.isInteger(actionRoll) || actionRoll < 0 || actionRoll > TRACK_PROGRESS_MAX) throw new Error(`Progress must be between 0 and ${TRACK_PROGRESS_MAX}.`);
	for (const value of [challengeOne, challengeTwo]) if (!Number.isInteger(value) || value < 1 || value > 10) {
		throw new Error('Track challenge dice must each be between 1 and 10.');
	}
	const result = actionRoll > challengeOne && actionRoll > challengeTwo ? 'Strong' : actionRoll > challengeOne || actionRoll > challengeTwo ? 'Weak' : 'Miss';
	return `${track.name} resolved. ${result}: ${actionRoll} vs ${challengeOne}, ${challengeTwo}.`;
}

export function rollTrackResolution(track: CampaignTrack, random: () => number = Math.random): string {
	if (track.type === 'Clock') throw new Error('Clock tracks resolve as completed or stopped, without challenge dice.');
	const rollChallenge = () => Math.floor(Math.max(0, Math.min(0.999999999, random())) * 10) + 1;
	const challengeOne = rollChallenge();
	const challengeTwo = rollChallenge();
	return buildTrackResolution(track, Math.floor(trackTicks(track) / TRACK_TICKS_PER_BOX), challengeOne, challengeTwo);
}
