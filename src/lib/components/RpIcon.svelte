<script lang="ts">
	let {
		name,
		size = 18,
		ticks = 0,
		steps = 6,
		filled = 0,
		value = 0,
		sides = 6,
		tone = 'default',
		label = ''
	}: {
		name: string;
		size?: number;
		ticks?: number;
		steps?: number;
		filled?: number;
		value?: number | string;
		sides?: number;
		tone?: 'default' | 'action' | 'challenge' | 'cursed' | 'match';
		label?: string;
	} = $props();

	function wedgePath(index: number, total: number, r = 10, cx = 12, cy = 12): string {
		const startAngle = (index / total) * Math.PI * 2 - Math.PI / 2;
		const endAngle = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2;
		const x1 = cx + r * Math.cos(startAngle);
		const y1 = cy + r * Math.sin(startAngle);
		const x2 = cx + r * Math.cos(endAngle);
		const y2 = cy + r * Math.sin(endAngle);
		const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
		return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
	}
</script>

{#if name === 'progress-box'}
	<svg width={size} height={size} viewBox="0 0 24 24" class="rp-progress-svg" class:full={ticks >= 4} aria-hidden="true">
		<rect x="2" y="2" width="20" height="20" rx="3" class="box-bg" />
		{#if ticks >= 1}<path d="M5 5 L19 19" class="tick-stroke" />{/if}
		{#if ticks >= 2}<path d="M19 5 L5 19" class="tick-stroke" />{/if}
		{#if ticks >= 3}<path d="M12 3.5 L12 20.5" class="tick-stroke" />{/if}
		{#if ticks >= 4}<path d="M3.5 12 L20.5 12" class="tick-stroke" />{/if}
	</svg>
{:else if name === 'clock-dial'}
	<svg width={size} height={size} viewBox="0 0 24 24" class="rp-clock-svg" aria-hidden="true">
		<circle cx="12" cy="12" r="10.5" class="clock-rim" />
		{#each Array.from({ length: Math.max(2, steps) }, (_, i) => i) as idx}
			<path d={wedgePath(idx, Math.max(2, steps), 9.6)} class="clock-wedge" class:wedge-filled={idx < filled} />
		{/each}
		<circle cx="12" cy="12" r="1.6" class="clock-hub" />
	</svg>
{:else if name === 'die-face'}
	{#if sides === 6}
		<svg width={size} height={size} viewBox="0 0 64 64" class="rp-die-svg die-{tone}" aria-hidden="true">
			<rect x="4" y="4" width="56" height="56" rx="11" class="die-body" />
			<rect x="8" y="8" width="48" height="48" rx="8" class="die-inner" />
			<circle cx="12" cy="12" r="1.6" class="die-rivet" />
			<circle cx="52" cy="12" r="1.6" class="die-rivet" />
			<circle cx="12" cy="52" r="1.6" class="die-rivet" />
			<circle cx="52" cy="52" r="1.6" class="die-rivet" />
			<text x="32" y="41" text-anchor="middle" class="die-text">{value}</text>
		</svg>
	{:else}
		<svg width={size} height={size} viewBox="0 0 64 64" class="rp-die-svg die-{tone}" aria-hidden="true">
			<polygon points="32,3 59,20 59,46 32,61 5,46 5,20" class="die-body" />
			<polygon points="32,8 53,22 32,55 11,22" class="die-facet" />
			<line x1="5" y1="20" x2="59" y2="20" class="die-ridge" />
			<line x1="32" y1="3" x2="32" y2="8" class="die-ridge" />
			<text x="32" y="40" text-anchor="middle" class="die-text">{value}</text>
		</svg>
	{/if}
{:else}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rp-icon" aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
		{#if name === 'roll' || name === 'dice'}
			<rect x="3" y="3" width="12" height="12" rx="2.5" />
			<path d="M15 9h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-4" />
			<circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
			<circle cx="11.5" cy="11.5" r="1" fill="currentColor" />
			<circle cx="9" cy="9" r="1" fill="currentColor" />
			<circle cx="17.5" cy="17.5" r="1" fill="currentColor" />
			<circle cx="14.5" cy="14.5" r="1" fill="currentColor" />
		{:else if name === 'd20'}
			<polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
			<polygon points="12 6 17.5 15.5 6.5 15.5" />
			<line x1="12" y1="2" x2="12" y2="6" />
			<line x1="21" y1="7" x2="17.5" y2="15.5" />
			<line x1="3" y1="7" x2="6.5" y2="15.5" />
			<line x1="12" y1="22" x2="17.5" y2="15.5" />
			<line x1="12" y1="22" x2="6.5" y2="15.5" />
		{:else if name === 'journal'}
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
			<line x1="8" y1="13" x2="16" y2="13" />
			<line x1="8" y1="17" x2="14" y2="17" />
		{:else if name === 'edit'}
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
		{:else if name === 'delete'}
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<line x1="10" y1="11" x2="10" y2="17" />
			<line x1="14" y1="11" x2="14" y2="17" />
		{:else if name === 'export'}
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" y1="3" x2="12" y2="15" />
		{:else if name === 'import'}
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" y1="15" x2="12" y2="3" />
		{:else if name === 'reorder'}
			<polyline points="5 9 2 12 5 15" />
			<polyline points="9 5 12 2 15 5" />
			<polyline points="15 19 12 22 9 19" />
			<polyline points="19 9 22 12 19 15" />
			<line x1="2" y1="12" x2="22" y2="12" />
			<line x1="12" y1="2" x2="12" y2="22" />
		{:else if name === 'filter'}
			<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
		{:else if name === 'burn'}
			<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
		{:else if name === 'skull'}
			<circle cx="9" cy="12" r="1" fill="currentColor" />
			<circle cx="15" cy="12" r="1" fill="currentColor" />
			<path d="M8 20v2h8v-2" />
			<path d="m12.5 17-.5-1-.5 1h1z" />
			<path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
		{:else if name === 'reroll'}
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		{:else if name === 'lock'}
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		{:else if name === 'settings'}
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
		{:else if name === 'menu'}
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="3" y1="12" x2="21" y2="12" />
			<line x1="3" y1="18" x2="21" y2="18" />
		{:else if name === 'plus'}
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		{:else if name === 'check'}
			<polyline points="20 6 9 17 4 12" />
		{:else if name === 'convert'}
			<polyline points="17 1 21 5 17 9" />
			<path d="M3 11V9a4 4 0 0 1 4-4h14" />
			<polyline points="7 23 3 19 7 15" />
			<path d="M21 13v2a4 4 0 0 1-4 4H3" />
		{:else if name === 'sword'}
			<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
			<line x1="13" y1="19" x2="19" y2="13" />
			<line x1="16" y1="16" x2="20" y2="20" />
			<line x1="19" y1="21" x2="21" y2="19" />
		{:else if name === 'compass'}
			<circle cx="12" cy="12" r="10" />
			<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
		{:else if name === 'ledger'}
			<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
			<line x1="8" y1="7" x2="16" y2="7" />
			<line x1="8" y1="11" x2="14" y2="11" />
		{:else if name === 'grid-square'}
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
		{:else if name === 'grid-hex'}
			<polygon points="7,3 17,3 22,12 17,21 7,21 2,12" />
			<circle cx="12" cy="12" r="2.2" fill="currentColor" />
		{:else if name === 'paint'}
			<path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
			<path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
		{:else if name === 'image'}
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<polyline points="21 15 16 10 5 21" />
		{:else if name === 'palette'}
			<circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
			<circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
			<circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
			<circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
			<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h1.99c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z" />
		{:else if name === 'up'}
			<polyline points="18 15 12 9 6 15" />
		{:else if name === 'down'}
			<polyline points="6 9 12 15 18 9" />
		{:else if name === 'search'}
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		{/if}
	</svg>
{/if}

<style>
	.rp-icon { display: inline-block; vertical-align: middle; flex: none; }
	.rp-progress-svg { display: block; flex: none; filter: drop-shadow(0 1px 1px rgba(43, 33, 22, 0.18)); }
	.rp-progress-svg .box-bg { fill: #fbf3df; stroke: #4b3b24; stroke-width: 1.8; }
	.rp-progress-svg.full .box-bg { fill: #efe0bb; stroke: #1f4b48; stroke-width: 2.1; }
	.rp-progress-svg .tick-stroke { stroke: #1f4b48; stroke-width: 2.35; stroke-linecap: round; }
	.rp-clock-svg { display: block; flex: none; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25)); }
	.rp-clock-svg .clock-rim { fill: #fbf3df; stroke: #b4893c; stroke-width: 1.6; }
	.rp-clock-svg .clock-wedge { fill: #fbf3df; stroke: #4b3b24; stroke-width: 1.1; transition: fill 0.15s; }
	.rp-clock-svg .clock-wedge.wedge-filled { fill: #26635b; }
	.rp-clock-svg .clock-hub { fill: #b4893c; stroke: #2b2116; stroke-width: 0.8; }
	.rp-die-svg { display: block; filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35)); }
	.rp-die-svg .die-body { fill: #f6ecd6; stroke: #1f4b48; stroke-width: 3.2; }
	.rp-die-svg .die-inner { fill: none; stroke: #b4893c; stroke-width: 1.2; opacity: 0.65; }
	.rp-die-svg .die-rivet { fill: #b4893c; }
	.rp-die-svg .die-facet { fill: rgba(255, 255, 255, 0.12); stroke: #d9b66a; stroke-width: 1.3; }
	.rp-die-svg .die-ridge { stroke: #d9b66a; stroke-width: 1.1; opacity: 0.7; }
	.rp-die-svg .die-text { font: 700 26px var(--font-head, Georgia, serif); fill: #2b2116; }
	.rp-die-svg.die-action .die-body { fill: #f8eed8; stroke: #214c48; }
	.rp-die-svg.die-action .die-text { fill: #1f4b48; }
	.rp-die-svg.die-challenge .die-body { fill: #214c48; stroke: #b4893c; }
	.rp-die-svg.die-challenge .die-text { fill: #f6ecd7; }
	.rp-die-svg.die-match .die-body { fill: #7d2b22; stroke: #f3d98c; }
	.rp-die-svg.die-match .die-text { fill: #fff6dc; }
	.rp-die-svg.die-cursed .die-body { fill: #4a2352; stroke: #b4893c; }
	.rp-die-svg.die-cursed .die-text { fill: #f6e6ff; }
</style>
