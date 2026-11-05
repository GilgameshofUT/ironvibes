import { describe, expect, it } from 'vitest';
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
	rollTrackRank,
	rollTrackResolution,
	resolveCampaignTrack,
	resolveTrackClock,
	trackProgressBoxes,
	trackTicks,
	ticksPerMark,
	updateTrackProgress
} from './tracks';

describe('campaign tracks', () => {
	it('creates and safely restores Pocketforge-observed track fields', () => {
		const track = makeCampaignTrack({ name: '  Audit Vow  ', type: 'Progress', rank: 'Dangerous', threat: true }, 'track-1', 'created');
		expect(track).toMatchObject({ id: 'track-1', name: 'Audit Vow', type: 'Progress', rank: 'Dangerous', threat: true, threatName: 'Unknown threat', threatLevel: 0, steps: 6, sceneClockProgress: 0, notes: '', progress: 0, createdAt: 'created', updatedAt: 'created' });
		expect(parseCampaignTracks(JSON.stringify([track, null, { ...track, id: 'bad', progress: 11 }]))).toEqual([track]);
		expect(parseCampaignTracks('{bad')).toEqual([]);
		expect(() => makeCampaignTrack({ name: ' ', type: 'Progress', rank: 'Epic', threat: false }, 'empty', 'now')).toThrow(/name/);
	});

	it('updates progress and completion state by ID', () => {
		const first = makeCampaignTrack({ name: 'Journey', type: 'Progress', rank: 'Troublesome', threat: false }, 'one', 'created');
		const second = makeCampaignTrack({ name: 'Scene', type: 'Scene', rank: 'Dangerous', threat: false }, 'two', 'created');
		const clock = makeCampaignTrack({ name: 'Clock', type: 'Clock', rank: 'Formidable', threat: false }, 'clock', 'created');
		const updated = updateTrackProgress([first, second], first.id, 4, 'progressed');
		expect(updated[0]).toMatchObject({ progress: 4, updatedAt: 'progressed' });
		expect(trackProgressBoxes(first.rank)).toBe(10);
		expect(trackProgressBoxes(second.rank)).toBe(10);
		expect(rollTrackRank(() => 0)).toBe('Troublesome');
		expect(rollTrackRank(() => 0.99)).toBe('Epic');
		expect(updateTrackProgress([first], first.id, 10, 'full')[0].progress).toBe(10);
		const resolved = resolveCampaignTrack(updated, first.id, 'Journey resolved. Miss: 4 vs 5, 9.', 'resolved');
		expect(resolved[0].resolvedAt).toBe('resolved');
		expect(resolved[0].resolution).toContain('Miss');
		expect(reopenCampaignTrack(resolved, first.id, 'reopened')[0].resolvedAt).toBeUndefined();
		expect(reopenCampaignTrack(resolved, first.id, 'reopened')[0].resolution).toBeUndefined();
		expect(putCampaignTrack([first, second], { ...first, name: 'Renamed' })).toHaveLength(2);
		expect(removeCampaignTrack([first, second], first.id)).toEqual([second]);
		expect(moveCampaignTrack([first, second, clock], clock.id, 'up')).toEqual([first, clock, second]);
		expect(moveCampaignTrack([first, second], first.id, 'up')).toEqual([first, second]);
		expect(() => updateTrackProgress([second], second.id, 11)).toThrow(/0 and 10/);
	});

	it('formats resolution results from two challenge dice', () => {
		const track = makeCampaignTrack({ name: 'Audit Vow', type: 'Progress', rank: 'Epic', threat: false }, 'vow', 'created');
		expect(buildTrackResolution(track, 5, 1, 10)).toBe('Audit Vow resolved. Weak: 5 vs 1, 10.');
		expect(buildTrackResolution(track, 1, 5, 9)).toBe('Audit Vow resolved. Miss: 1 vs 5, 9.');
		expect(buildTrackResolution(track, 10, 3, 2)).toBe('Audit Vow resolved. Strong: 10 vs 3, 2.');
		expect(() => buildTrackResolution(track, 3, 11, 2)).toThrow(/between 1 and 10/);
	});
	it('marks rank-scaled ticks and migrates old whole-box saves without losing progress', () => {
		const legacy = makeCampaignTrack({ name: 'Old vow', type: 'Progress', rank: 'Epic', threat: false }, 'old', 'created');
		const oldSave = { ...legacy, progress: 2 };
		expect(trackTicks(oldSave)).toBe(8);
		expect(trackTicks(parseCampaignTracks(JSON.stringify([oldSave]))[0])).toBe(8);
		for (const [rank, ticks] of [['Troublesome', 12], ['Dangerous', 8], ['Formidable', 4], ['Extreme', 2], ['Epic', 1]] as const) {
			expect(ticksPerMark(rank)).toBe(ticks);
			const track = { ...legacy, rank, progress: 0 };
			const once = markTrackProgress([track], track.id, 1, 'marked')[0];
			expect(trackTicks(once)).toBe(ticks);
			expect(once.progress).toBe(Math.floor(ticks / 4));
			expect(trackTicks(markTrackProgress([once], track.id, -1)[0])).toBe(0);
		}
		const marked = markTrackProgress([oldSave], 'old', 1)[0];
		expect(marked.progressTicks).toBe(9);
		expect(marked.progress).toBe(2);
		expect(parseCampaignTracks(JSON.stringify([marked]))).toEqual([marked]);
		expect(markTrackProgress([{ ...marked, resolvedAt: 'now' }], 'old', 1)[0].progressTicks).toBe(9);
	});
	it('uses step clocks without dice and independently advances scene progress, threat and notes', () => {
		const clock = makeCampaignTrack({ name: 'Escape', type: 'Clock', rank: 'Epic', threat: false, steps: 2 }, 'clock', 'created');
		const once = markTrackClock([clock], 'clock', 1)[0];
		expect(once.progress).toBe(1);
		expect(trackTicks(once)).toBe(0);
		expect(resolveTrackClock([once], 'clock')[0].resolution).toBe('Escape stopped.');
		const twice = markTrackClock([once], 'clock', 1)[0];
		expect(resolveTrackClock([twice], 'clock')[0].resolution).toBe('Escape completed.');
		expect(markTrackClock([twice], 'clock', 1)[0].progress).toBe(2);
		expect(() => rollTrackResolution(clock)).toThrow(/without challenge dice/);
		expect(parseCampaignTracks(JSON.stringify([twice]))).toEqual([twice]);
		const scene = makeCampaignTrack({ name: 'Ambush', type: 'Scene', rank: 'Formidable', threat: true, threatName: 'Pursuers', steps: 3, notes: 'Nightfall' }, 'scene', 'created');
		const progressed = markTrackClock(markTrackProgress([scene], 'scene', 1), 'scene', 1)[0];
		expect(progressed).toMatchObject({ progress: 1, progressTicks: 4, sceneClockProgress: 1, threatName: 'Pursuers', notes: 'Nightfall' });
		expect(markTrackThreat([progressed], 'scene', 1)[0].threatLevel).toBe(1);
		expect(markTrackClock([progressed], 'scene', -1)[0].sceneClockProgress).toBe(0);
		expect(forsakeCampaignTrack([progressed], 'scene')[0].resolution).toBe('Ambush forsaken.');
		expect(markTrackClock([clock], 'clock', -1)[0].progress).toBe(0);
		const oldClock = { ...clock, steps: undefined, progress: 8, progressTicks: 32 };
		expect(clockSteps(oldClock)).toBe(8);
		expect(parseCampaignTracks(JSON.stringify([oldClock]))[0]).toMatchObject({ progress: 8, steps: 8 });
		expect(parseCampaignTracks(JSON.stringify([oldClock]))[0].progressTicks).toBeUndefined();
	});
});
