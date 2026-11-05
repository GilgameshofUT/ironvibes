import { describe, expect, it } from 'vitest';
import { addSiteArea, addSiteWaypoint, makeCampaignSite, moveCampaignSite, parseCampaignSites, parseSiteDenizenTable, putCampaignSite, removeCampaignSite, rollSiteDenizen, rollSiteObjective, serializeSiteDenizenTable, updateCampaignSite, updateSiteArea } from './sites';

describe('campaign sites', () => {
	it('validates and restores directly observed site data', () => {
		const site = makeCampaignSite({ type: 'Delve', rank: 'Dangerous', fields: { name: 'Audit Delve', theme: 'Ancient' } }, 'site-1', 'created');
		expect(site.fields).toMatchObject({ name: 'Audit Delve', theme: 'Ancient', secondaryTheme: '' });
		expect(parseCampaignSites(JSON.stringify([site, null, { ...site, progress: 11 }]))).toEqual([site]);
		expect(parseCampaignSites('bad')).toEqual([]);
		expect(() => makeCampaignSite({ type: 'Delve', rank: 'Epic', fields: { name: ' ' } })).toThrow(/name/i);
	});

	it('updates, reorders, and deletes sites by ID', () => {
		const first = makeCampaignSite({ type: 'Vault', rank: 'Epic', fields: { name: 'Vault' } }, 'first', 'created');
		const second = makeCampaignSite({ type: 'Cave', rank: 'Troublesome', fields: { name: 'Cave' } }, 'second', 'created');
		const shipwreck = makeCampaignSite({ type: 'Shipwreck', rank: 'Dangerous', fields: { name: 'Wreck' }, details: { location: 'Sea cave', wholeness: 'Mostly intact', scope: 'not a shipwreck field' }, rollWithCursedDie: true }, 'wreck', 'created');
		expect(shipwreck.details).toEqual({ location: 'Sea cave', wholeness: 'Mostly intact' });
		expect(parseCampaignSites(JSON.stringify([shipwreck]))).toEqual([shipwreck]);
		expect(parseCampaignSites(JSON.stringify([{ ...shipwreck, details: { bogus: 'test' } }]))).toEqual([]);
		expect(updateCampaignSite([first], first.id, { progress: 4, fields: { description: 'Hidden below' } }, 'updated')[0]).toMatchObject({ progress: 4, fields: { name: 'Vault', description: 'Hidden below' }, updatedAt: 'updated' });
		expect(moveCampaignSite([first, second], second.id, 'up').map((site) => site.id)).toEqual(['second', 'first']);
		expect(putCampaignSite([first, second], { ...first, fields: { ...first.fields, name: 'Renamed' } })).toHaveLength(2);
		expect(removeCampaignSite([first, second], first.id)).toEqual([second]);
	});
	it('stores site areas and explicit objective outcomes without breaking old site data', () => {
		const site = makeCampaignSite({ type: 'Delve', rank: 'Troublesome', fields: { name: 'Fortified Shadowfen' } }, 'site', 'created');
		const [area] = addSiteArea(site, 'area');
		const next = updateCampaignSite([site], site.id, { areas: updateSiteArea({ ...site, areas: [area] }, area.id, { feature: 'Camp or outpost' }), progress: 4 }, 'updated')[0];
		expect(parseCampaignSites(JSON.stringify([next]))[0].areas?.[0].feature).toBe('Camp or outpost');
		expect(addSiteArea(site, 'another', 'Fortified outpost')[0].feature).toBe('Fortified outpost');
		expect(() => addSiteArea({ ...site, resolvedAt: 'now' }, 'completed')).toThrow(/Reactivate/);
		expect(addSiteArea({ ...site, areas: [{ ...area, name: 'Area #3' }] }, 'fourth')[1].name).toBe('Area #4');
		expect(rollSiteObjective(next, () => 0)).toContain('Strong hit');
		expect(parseCampaignSites(JSON.stringify([{ ...site, areas: [{ id: 'area', name: 'Only a name' }] }]))).toEqual([]);
		const { areas: _areas, ...oldSite } = site;
		expect(parseCampaignSites(JSON.stringify([oldSite]))).toEqual([oldSite]);
	});
	it('persists non-Delve zones, waypoints and site discoveries', () => {
		const derelict = makeCampaignSite({ type: 'Derelict', rank: 'Dangerous', fields: { name: 'Audit derelict' } }, 'derelict', 'created');
		const areas = addSiteWaypoint(derelict, 'Access', 'Corridor', '', 'waypoint');
		expect(areas[0]).toMatchObject({ name: 'Zone #1', zone: 'Access', area: 'Corridor' });
		const saved = updateCampaignSite([derelict], derelict.id, { areas, discoveries: { innerFirstLook: 'Evidence of inhabitants' } })[0];
		expect(parseCampaignSites(JSON.stringify([saved]))).toEqual([saved]);
		expect(addSiteWaypoint({ ...derelict, areas }, 'Community', 'Camp', '', 'next')[1].name).toBe('Zone #2');
		expect(() => addSiteWaypoint({ ...saved, resolvedAt: 'done' })).toThrow(/Reactivate/);
		expect(parseCampaignSites(JSON.stringify([{ ...saved, discoveries: { unsafe: 'bad' } }]))).toEqual([]);
		expect(parseCampaignSites(JSON.stringify([{ ...saved, areas: [{ ...areas[0], peril: 4 }] }]))).toEqual([]);
	});
	it('round-trips the 12-slot Delve denizens matrix and resolves d100 denizen rolls', () => {
		const slots = parseSiteDenizenTable(undefined);
		expect(slots).toHaveLength(12);
		slots[0].name = 'Marsh Raiders';
		const restored = parseSiteDenizenTable(serializeSiteDenizenTable(slots));
		expect(restored[0]?.name).toBe('Marsh Raiders');
		expect(rollSiteDenizen(restored, () => 0).text).toBe('1: Marsh Raiders');
	});
});
