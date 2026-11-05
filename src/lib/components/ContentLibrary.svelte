<script lang="ts">
	import { createId } from '../id';
	import { onMount } from 'svelte';
	import { dataswornLibrary } from '../datasworn/library.svelte';
	import { recordMatches, type DataswornRecord } from '../datasworn/catalog';
	import RpIcon from './RpIcon.svelte';
	import { asset } from '$app/paths';

	let activeTab = $state<'browse' | 'packs'>('browse');
	let query = $state('');
	let typeFilter = $state('all');
	let packFilter = $state('all');
	let selected = $state<DataswornRecord | null>(null);
	let importMessage = $state('');
	let importError = $state('');
	let includeDisabled = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let pasteDialog = $state(false);
	let pastedJson = $state('');

	onMount(() => dataswornLibrary.initialize());

	const typeNames: Record<string, string> = {
		asset: 'Assets', asset_collection: 'Asset collections', move: 'Moves', move_category: 'Move categories',
		oracle_rollable: 'Oracles', oracle_collection: 'Oracle collections', truth: 'Truths', world: 'Worlds',
		npc: 'NPCs', npc_collection: 'NPC collections', atlas_entry: 'Atlas entries', atlas_collection: 'Atlas collections',
		delve_site: 'Sites', delve_site_theme: 'Site themes', delve_site_domain: 'Site domains', rarity: 'Rarities',
		site_theme: 'Site themes', site_domain: 'Site domains'
	};
	const typeOptions = $derived([
		{ value: 'all', label: 'Everything' },
		...Array.from(new Set(dataswornLibrary.records.map((record) => record.type)))
			.sort()
			.map((value) => ({ value, label: typeNames[value] ?? value.replaceAll('_', ' ') }))
	]);
	const visibleRecords = $derived.by(() => dataswornLibrary.records.filter((record) =>
		(typeFilter === 'all' || record.type === typeFilter) &&
		(packFilter === 'all' || record.packId === packFilter) &&
		recordMatches(record, query)
	));
	const visiblePacks = $derived(dataswornLibrary.allPacks.filter((pack) => includeDisabled || !pack.bundled || pack.count > 0));

	async function importFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		importMessage = '';
		importError = '';
		try {
			const json: unknown = JSON.parse(await file.text());
			const result = dataswornLibrary.importPack(json, `imported-${createId()}`, file.name.replace(/\.json$/i, ''));
			const pack = dataswornLibrary.packs.find((item) => item.id === result.id);
			importMessage = `Imported ${result.kind === 'item' ? 'item' : 'pack'} ${pack?.title ?? file.name}: ${result.recordCount} searchable record${result.recordCount === 1 ? '' : 's'}.` +
				(result.warnings.length ? ` Note: ${result.warnings.join(' ')}` : '');
			activeTab = 'packs';
			packFilter = result.id;
			selected = null;
		} catch (error) {
			importError = error instanceof SyntaxError
				? 'The selected file is not valid JSON.'
				: error instanceof Error ? error.message : 'Unable to import this file.';
		} finally {
			if (fileInput) fileInput.value = '';
		}
	}

	function importPastedJson() {
		importMessage = '';
		importError = '';
		try {
			const json: unknown = JSON.parse(pastedJson);
			const result = dataswornLibrary.importPack(json, `imported-${createId()}`, 'Pasted Datasworn content');
			const pack = dataswornLibrary.packs.find((item) => item.id === result.id);
			importMessage = `Imported ${result.kind === 'item' ? 'item' : 'pack'} ${pack?.title ?? 'Datasworn content'}: ${result.recordCount} searchable record${result.recordCount === 1 ? '' : 's'}.` +
				(result.warnings.length ? ` Note: ${result.warnings.join(' ')}` : '');
			activeTab = 'packs';
			packFilter = result.id;
			selected = null;
			pasteDialog = false;
			pastedJson = '';
		} catch (error) {
			importError = error instanceof SyntaxError
				? 'The entered text is not valid JSON.'
				: error instanceof Error ? error.message : 'Unable to import this JSON.';
		}
	}

	function downloadRecord(record: DataswornRecord) {
		const blob = new Blob([JSON.stringify(record.data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${record.id.replaceAll(/[^a-zA-Z0-9._-]/g, '_')}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function renderText(value: unknown): string {
		if (typeof value === 'string') return value;
		return '';
	}
</script>

<section class="library" aria-label="Datasworn content library">
	<header class="library-header">
		<div>
			<p class="eyebrow">RULES & REFERENCE</p>
			<h2>Content library</h2>
			<p class="lede">Browse, search, and manage Datasworn-compatible rules and community packs.</p>
		</div>
		<div class="header-count"><strong>{dataswornLibrary.records.length.toLocaleString()}</strong><span>indexed entries</span></div>
	</header>

	<div class="library-tabs" role="tablist" aria-label="Content library sections">
		<button class:active={activeTab === 'browse'} role="tab" aria-selected={activeTab === 'browse'} onclick={() => (activeTab = 'browse')}>Browse content</button>
		<button class:active={activeTab === 'packs'} role="tab" aria-selected={activeTab === 'packs'} onclick={() => (activeTab = 'packs')}>Content packs <span>{dataswornLibrary.packs.length}</span></button>
	</div>

	{#if importMessage}<p class="notice success" role="status">{importMessage}</p>{/if}
	{#if importError}<p class="notice error" role="alert">{importError}</p>{/if}
	{#if dataswornLibrary.error}<p class="notice error" role="alert">{dataswornLibrary.error}</p>{/if}

	{#if activeTab === 'browse'}
		<div class="filters">
			<label class="search-field"><span>Search</span><input bind:value={query} placeholder="Search names, descriptions, IDs…" /></label>
			<label><span>Type</span><select bind:value={typeFilter}>{#each typeOptions as option (option.value)}<option value={option.value}>{option.label}</option>{/each}</select></label>
			<label><span>Pack</span><select bind:value={packFilter}><option value="all">All packs</option>{#each dataswornLibrary.packs as pack}<option value={pack.id}>{pack.title}</option>{/each}</select></label>
		</div>
		<div class="browse-layout">
			<div class="results" aria-live="polite">
				<div class="results-summary">{visibleRecords.length.toLocaleString()} results</div>
				{#if visibleRecords.length}
					{#each visibleRecords.slice(0, 250) as record (record.id)}
						<button class:selected={selected?.id === record.id} class="record-row" onclick={() => (selected = record)}>
							<span class="type-mark">{typeOptions.find((option) => option.value === record.type)?.label.slice(0, 1) ?? '•'}</span>
							<span class="record-main"><strong>{record.name}</strong><small>{record.category || record.type.replaceAll('_', ' ')} · {record.packTitle}</small></span>
							<span class="chevron">›</span>
						</button>
					{/each}
					{#if visibleRecords.length > 250}<p class="cap-note">Showing the first 250 matches. Narrow the search to see more.</p>{/if}
				{:else}
					<div class="empty-state"><RpIcon name="search" size={28} /><strong>No matching content</strong><p>Try another term, pack, or entry type.</p></div>
				{/if}
			</div>
			<aside class="detail-pane" aria-label="Selected content details">
				{#if selected}
					<div class="detail-top"><span class="type-chip">{selected.type.replaceAll('_', ' ')}</span><button class="icon-action" aria-label="Download this entry as JSON" title="Download JSON" onclick={() => downloadRecord(selected!)}><RpIcon name="import" size={14} /></button></div>
					<h3>{selected.name}</h3>
					<p class="detail-category">{selected.category || selected.packTitle}</p>
					{#if selected.description}<p class="description">{selected.description}</p>{:else}<p class="description muted">This entry has structured data. Open its JSON to inspect full rules and roll tables.</p>{/if}
					{#if renderText(selected.data.requirements)}<div class="structured"><strong>Requirements</strong><p>{renderText(selected.data.requirements)}</p></div>{/if}
					<div class="provenance"><p class="eyebrow">PROVENANCE</p><strong>{selected.sourceTitle}</strong><span>Pack: {selected.packTitle}</span><span>License: {selected.sourceLicense || 'Not specified'}</span>{#if selected.sourceUrl}<a href={selected.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a>{/if}<code>{selected.id}</code></div>
				{:else}
					<div class="detail-empty"><img src={asset('art/icons/rules.webp')} alt="" style="width:3.2rem;height:3.2rem;border-radius:8px;border:1.5px solid #214c48;margin-bottom:.35rem" /><strong>Select an entry</strong><p>Content description and attribution will appear here.</p></div>
				{/if}
			</aside>
		</div>
	{:else}
		<div class="pack-actions"><div><h3>Installed content</h3><p>Bundled packages plus JSON content imported in this browser. Import a full Datasworn ruleset/expansion or an individual exported entry.</p></div><div class="pack-buttons"><input bind:this={fileInput} type="file" accept=".json,application/json" onchange={importFile} hidden /><button class="secondary-button" onclick={() => fileInput?.click()}><RpIcon name="plus" size={14} /> Import JSON file</button><button class="secondary-button" onclick={() => { importError = ''; pasteDialog = true; }}>Paste JSON</button></div></div>
		<div class="pack-grid">
			{#each visiblePacks as pack (pack.id)}
				<article class="pack-card">
					<div class="pack-card-top"><span class:local={!pack.bundled} class="pack-source">{pack.bundled ? 'BUNDLED' : 'IMPORTED'}</span><span class="pack-version">Datasworn {pack.version}</span></div>
					<h4>{pack.title}</h4><p class="pack-id">{pack.id}</p>
					<div class="pack-meta"><span>{pack.count.toLocaleString()} entries</span><span>{pack.license || 'License unspecified'}</span></div>
					<div class="pack-bottom">
						{#if pack.bundled}<button class="text-button" onclick={() => dataswornLibrary.setEnabled(pack.id, !dataswornLibrary.isEnabled(pack.id))}>{dataswornLibrary.isEnabled(pack.id) ? 'Enabled · click to disable' : 'Disabled · click to enable'}</button>
						{:else}<button class="text-button danger-text" onclick={() => dataswornLibrary.removeImported(pack.id)}>Remove imported pack</button>{/if}
						{#if pack.url}<a href={pack.url} target="_blank" rel="noreferrer" aria-label={`Source for ${pack.title}`}>Source ↗</a>{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}

	{#if pasteDialog}
		<div class="paste-scrim" role="presentation" onclick={() => (pasteDialog = false)}>
			<div class="paste-dialog" role="dialog" aria-modal="true" aria-labelledby="paste-json-title" tabindex="-1" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
				<p class="eyebrow">DATASWORN INTEROPERABILITY</p><h3 id="paste-json-title">Import pack or item JSON</h3>
				<p>Paste one Datasworn ruleset/expansion package or an individual supported Datasworn record. Content is stored locally in this browser.</p>
				<label for="datasworn-json">JSON</label><textarea id="datasworn-json" bind:value={pastedJson} rows="14" spellcheck="false" placeholder="Paste a Datasworn pack or individual item as JSON here"></textarea>
				{#if importError}<p class="notice error" role="alert">{importError}</p>{/if}
				<div class="paste-actions"><button class="secondary-button" onclick={() => (pasteDialog = false)}>Cancel</button><button class="secondary-button" onclick={importPastedJson}>Import JSON</button></div>
			</div>
		</div>
	{/if}
</section>

<style>
	.library { min-height: 30rem; color: #34291a; }
	.library-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; padding:0 0 1rem; border-bottom:1px solid #c9b88e; }
	.library h2 { margin:0 0 .25rem; font:700 1.55rem var(--font-head); }
	.eyebrow { color:#79653e; font:700 .62rem var(--font-head); letter-spacing:.15em; margin:0 0 .3rem; }
	.lede, .pack-actions p { margin:0; color:#76664a; font-size:.76rem; }
	.header-count { display:grid; text-align:right; color:#76664a; font-size:.65rem; white-space:nowrap; }
	.header-count strong { color:#214c48; font:700 1.35rem var(--font-head); }
	.library-tabs { display:flex; gap:1.2rem; border-bottom:1px solid #c9b88e; }
	.library-tabs button { display:flex; gap:.4rem; align-items:center; border:0; border-bottom:3px solid transparent; padding:.65rem .1rem .5rem; background:transparent; color:#756647; font:600 .76rem var(--font-head); }
	.library-tabs button.active { color:#214744; border-bottom-color:#2d6560; }
	.library-tabs button span { border-radius:99px; background:#dfcfaa; padding:.04rem .35rem; font:600 .58rem var(--font-head); }
	.filters { display:grid; grid-template-columns:minmax(12rem,1fr) minmax(8rem,.45fr) minmax(10rem,.55fr); gap:.6rem; padding:.8rem 0; }
	.filters label { display:grid; gap:.2rem; color:#76664a; font:600 .62rem var(--font-head); }
	.filters input, .filters select { min-width:0; height:2.25rem; border:1px solid #c2af81; border-radius:6px; background:#f6ecd6; color:#382d1d; padding:0 .6rem; font-size:.72rem; }
	.browse-layout { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(14rem,.9fr); border:1px solid #c5b28a; border-radius:8px; overflow:hidden; background:#f4e8cf; min-height:25rem; }
	.results { max-height:36rem; overflow:auto; border-right:1px solid #c5b28a; }
	.results-summary { position:sticky; top:0; z-index:1; padding:.42rem .7rem; color:#806e4b; background:#ecdfbf; border-bottom:1px solid #d0bf99; font:600 .61rem var(--font-head); }
	.record-row { width:100%; display:flex; align-items:center; gap:.55rem; text-align:left; border:0; border-bottom:1px solid #e1d3b3; background:transparent; padding:.5rem .6rem; color:#3b301f; }
	.record-row:hover, .record-row.selected { background:#e5d5b2; }
	.type-mark { display:grid; place-items:center; flex:none; width:1.5rem; height:1.5rem; border:1px solid #b89a5e; border-radius:5px; color:#28524d; background:#f8eed9; font:700 .65rem var(--font-head); }
	.record-main { min-width:0; display:grid; gap:.08rem; }
	.record-main strong { font:700 .74rem var(--font-head); }
	.record-main small { color:#837353; font-size:.58rem; text-transform:capitalize; }
	.chevron { margin-left:auto; color:#9b8250; font-size:1.1rem; }
	.detail-pane { padding:.9rem; max-height:36rem; overflow:auto; }
	.detail-top { display:flex; align-items:center; justify-content:space-between; }
	.type-chip { background:#d9e2d0; color:#28524d; border-radius:99px; padding:.18rem .5rem; font:700 .56rem var(--font-head); text-transform:uppercase; }
	.icon-action { width:1.8rem; height:1.8rem; border:1px solid #c2af81; border-radius:5px; background:#f9efd9; color:#28524d; }
	.detail-pane h3 { margin:.65rem 0 .12rem; font:700 1.15rem/1.15 var(--font-head); }
	.detail-category { color:#8a754c; font-size:.66rem; text-transform:capitalize; margin:0 0 .8rem; }
	.description { font-size:.75rem; line-height:1.5; color:#51432e; white-space:pre-wrap; }
	.description :global(em) { color:#6b5734; }
	.description.muted { color:#86785e; font-style:italic; }
	.provenance { display:grid; gap:.24rem; margin-top:1rem; border-top:1px solid #d3c29d; padding-top:.7rem; color:#756345; font-size:.63rem; overflow-wrap:anywhere; }
	.provenance .eyebrow { margin:0; font-size:.53rem; }
	.provenance strong { color:#473a26; font:700 .72rem var(--font-head); }
	.provenance a, .pack-bottom a { color:#285a55; font-weight:700; text-decoration:none; }
	.provenance code, .pack-id { color:#8d7b5b; font-size:.55rem; overflow-wrap:anywhere; }
	.detail-empty, .empty-state { display:grid; place-items:center; align-content:center; height:100%; min-height:16rem; text-align:center; color:#8b7a58; padding:1rem; }
	.detail-empty strong, .empty-state strong { color:#4e422e; font:700 .85rem var(--font-head); }
	.detail-empty p, .empty-state p { margin:.2rem 0 0; font-size:.67rem; }
	.cap-note { padding:.6rem; color:#887450; font-size:.65rem; text-align:center; }
	.notice { border-radius:6px; padding:.5rem .65rem; margin:.65rem 0 0; font-size:.68rem; }
	.notice.success { background:#dce8d7; color:#315a36; }.notice.error { background:#f2d8cf; color:#742d24; }
	.pack-actions { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:1rem 0 .75rem; }
	.pack-actions h3 { margin:0 0 .15rem; font:700 1rem var(--font-head); }
	.pack-buttons { display:flex; gap:.5rem; }
	.paste-scrim { position:fixed; inset:0; z-index:30; display:grid; place-items:center; padding:1rem; background:#0d0a07aa; }
	.paste-dialog { width:min(100%,42rem); max-height:90dvh; overflow:auto; padding:1.25rem; border:2px solid #2d6560; border-radius:10px; background:linear-gradient(#f3e8d0,#e6d4b2); box-shadow:0 12px 40px #0008,inset 0 0 0 2px #d9b66a; color:#34291a; }
	.paste-dialog h3 { margin:.2rem 0 .35rem; font:700 1.1rem var(--font-head); }.paste-dialog > p:not(.eyebrow) { color:#76664a; font-size:.7rem; }
	.paste-dialog label { display:block; margin:.6rem 0 .25rem; color:#65563b; font:700 .68rem var(--font-head); }
	.paste-dialog textarea { display:block; width:100%; min-height:12rem; padding:.6rem; border:1px solid #b9a77d; border-radius:6px; background:#f6ecd6; color:#2b2116; font: .68rem/1.45 var(--font-mono,monospace); resize:vertical; }
	.paste-actions { display:flex; justify-content:flex-end; gap:.45rem; margin-top:.75rem; }
	.secondary-button { min-height:2.25rem; border:1px solid #9b8250; border-radius:6px; color:#f6e9c8; background:#28524d; padding:.4rem .7rem; font:700 .68rem var(--font-head); }
	.pack-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.6rem; }
	.pack-card { min-width:0; border:1px solid #c5b28a; border-radius:7px; background:#f4e8cf; padding:.7rem; }
	.pack-card-top, .pack-meta, .pack-bottom { display:flex; align-items:center; justify-content:space-between; gap:.4rem; }
	.pack-source { color:#28524d; font:700 .55rem var(--font-head); letter-spacing:.08em; }.pack-source.local { color:#7b5130; }
	.pack-version { color:#8a7959; font-size:.56rem; }
	.pack-card h4 { margin:.5rem 0 .05rem; font:700 .9rem var(--font-head); }
	.pack-id { margin:0 0 .5rem; }
	.pack-meta { align-items:flex-start; color:#76664a; font-size:.58rem; }
	.pack-meta span:last-child { text-align:right; max-width:55%; overflow-wrap:anywhere; }
	.pack-bottom { margin-top:.65rem; border-top:1px solid #dfd0ad; padding-top:.45rem; }
	.pack-bottom a, .text-button { border:0; background:none; font-size:.62rem; }
	.text-button { color:#55715c; padding:0; }.text-button.danger-text { color:#8b372d; }
	@media(max-width:760px) { .browse-layout { grid-template-columns:minmax(0,1fr); } .results { border-right:0; max-height:25rem; border-bottom:1px solid #c5b28a; } .detail-pane { max-height:23rem; min-height:12rem; } }
	@media(max-width:560px) { .library-header { align-items:flex-start; }.header-count { padding-top:.3rem; }.filters { grid-template-columns:1fr 1fr; }.search-field { grid-column:1/-1; }.pack-grid { grid-template-columns:1fr; }.pack-actions { align-items:flex-start; flex-direction:column; }.library h2 { font-size:1.3rem; } }
</style>
