<script lang="ts">
	import { asset } from '$app/paths';

	let activeArea = $state('Campaign');
	let showCampaignSetup = $state(false);
	const areas = ['Campaign', 'Journal', 'Characters', 'Oracles', 'Moves'];
	const foundations = [
		{ title: 'A campaign at a glance', text: 'Keep the current vow, active threads, and recent journal entries close at hand.' },
		{ title: 'Rules stay modular', text: 'Load official and community Datasworn packs, then layer in your own compatible content.' },
		{ title: 'Made for the table', text: 'Comfortable touch targets, responsive panels, and readable type from phone to desktop.' }
	];
</script>

<svelte:head>
	<meta name="color-scheme" content="light" />
</svelte:head>

<main class="shell">
	<header class="topbar">
		<a class="brand" href="#home" aria-label="Ironvibes home">
			<span class="sigil" aria-hidden="true">✦</span>
			<span><strong>IRONVIBES</strong><small>CAMPAIGN COMPANION</small></span>
		</a>
		<div class="header-actions">
			<span class="local-status"><i></i> LOCAL CAMPAIGN</span>
			<button class="icon-button" aria-label="Open settings" title="Settings">⚙</button>
		</div>
	</header>

	<div class="workspace">
		<aside class="rail" aria-label="Campaign sections">
			<div class="campaign-mark">IV</div>
			{#each areas as area, i}
				<button class:chosen={activeArea === area} class="rail-button" onclick={() => (activeArea = area)} aria-label={area} title={area}>
					<span>{['⌂', '▤', '♙', '◉', '⚔'][i]}</span>
					<small>{area}</small>
				</button>
			{/each}
			<div class="rail-spacer"></div>
			<button class="rail-button" aria-label="Campaign options" title="Campaign options"><span>•••</span><small>More</small></button>
		</aside>

		<section class="main-pane" id="home">
			<div class="campaign-heading">
				<div>
					<p class="eyebrow">YOUR STORY, YOUR RULES</p>
					<h1>Ironvibes <span class="edit-mark">⌄</span></h1>
					<p class="subheading">A flexible home for solo adventures and shared worlds.</p>
				</div>
				<button class="settings-pill" aria-label="Campaign settings">☷ <span>Campaign settings</span></button>
			</div>

			<nav class="tabs" aria-label="Campaign view">
				{#each areas as area}
					<button class:tab-active={activeArea === area} onclick={() => (activeArea = area)}>{area}</button>
				{/each}
			</nav>

			<div class="content">
				<section class="hero-card parchment" style="--parch-texture: url({asset('art/textures/parchment.webp')})" aria-labelledby="welcome-heading">
					<div class="hero-copy">
						<p class="eyebrow">A NEW KIND OF COMPANION</p>
						<h2 id="welcome-heading">Every great tale<br />begins with a vow.</h2>
						<p>Bring your campaigns, oracle rolls, and notes together. Shape the rules and atmosphere to fit the story you want to tell.</p>
						<button class="primary-button" onclick={() => (showCampaignSetup = true)}>＋ &nbsp; Start a campaign</button>
					</div>
					<div class="hero-art" aria-hidden="true">
						<img src={asset('art/scenes/first-vow.webp')} alt="" />
						<span class="art-caption">THE FIRST MILE</span>
					</div>
				</section>

				<div class="section-title"><div><p class="eyebrow">BUILT FOR YOUR TABLE</p><h2>Start with the story</h2></div><span class="ornament">✦</span></div>
				<div class="foundation-grid">
					{#each foundations as item, i}
						<article class="foundation-card">
							<span class="foundation-icon">{['◈', '⌘', '✧'][i]}</span>
							<h3>{item.title}</h3><p>{item.text}</p>
						</article>
					{/each}
				</div>
				<p class="footnote">Inspired by Pocketforge’s campaign-centered organization; built independently for Ironvibes.</p>
			</div>
		</section>

		<aside class="right-panel">
			<div class="panel-heading"><span class="panel-icon">✺</span><div><h2>At the table</h2><p>Your quick tools</p></div><button class="more-button" aria-label="More table tools">•••</button></div>
			<div class="oracle-callout">
				<span class="oracle-symbol">◉</span>
				<div><strong>Ask the Oracle</strong><p>Let the dice guide the story.</p></div>
				<button aria-label="Roll oracle">↗</button>
			</div>
			<div class="quick-section"><div class="quick-title"><span>QUICK ORACLES</span><button aria-label="Search oracles">⌕</button></div>
				{#each ['Action', 'Theme', 'Character'] as oracle}
					<button class="oracle-row"><span class="die-icon">d100</span><span>{oracle}</span><b>↗</b></button>
				{/each}
			</div>
			<div class="journal-peek"><div class="quick-title"><span>LAST JOURNAL ENTRY</span><button aria-label="Open journal">↗</button></div><p class="empty-journal">Your next chapter will begin here.</p></div>
			<div class="panel-bottom"><span><i></i> READY WHEN YOU ARE</span><span>v0.1</span></div>
		</aside>
	</div>

	<nav class="mobile-nav" aria-label="Mobile navigation">
		{#each areas as area, i}
			<button class:mobile-active={activeArea === area} onclick={() => (activeArea = area)}><span>{['⌂', '▤', '♙', '◉', '⚔'][i]}</span><small>{area}</small></button>
		{/each}
	</nav>

	{#if showCampaignSetup}
		<div class="modal-scrim" role="presentation" onclick={() => (showCampaignSetup = false)}>
			<div class="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title">
				<button class="close-modal" aria-label="Close" onclick={() => (showCampaignSetup = false)}>×</button>
				<p class="eyebrow">BEGIN YOUR NEXT CHAPTER</p><h2 id="setup-title">Shape a campaign</h2>
				<label>Campaign name<input placeholder="A name for your story" /></label>
				<label>Ruleset<select><option>Ironsworn</option><option>Starforged</option><option>Sundered Isles</option></select></label>
				<p class="modal-note">Campaign setup is the first feature slice. Your selected ruleset and content packs will be configurable.</p>
				<button class="primary-button" onclick={() => (showCampaignSetup = false)}>Save for later</button>
			</div>
		</div>
	{/if}
</main>

<style>
	.shell { min-height: 100dvh; color: var(--ink); background: #17150f; padding: 0 1rem 1rem; }
	.topbar { height: 4rem; display: flex; align-items: center; justify-content: space-between; color: var(--parch); max-width: 92rem; margin: auto; }
	.brand { display: flex; align-items: center; gap: .65rem; color: inherit; text-decoration: none; }
	.brand strong { display: block; font: 700 1rem var(--font-head); letter-spacing: .12em; }
	.brand small { display: block; font: 500 .55rem var(--font-head); letter-spacing: .18em; color: #bbaa83; }
	.sigil { display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border: 1px solid var(--brass); border-radius: 50%; color: var(--brass-2); font-size: 1.3rem; }
	.header-actions { display: flex; align-items: center; gap: .85rem; }
	.local-status, .panel-bottom { display: flex; align-items: center; gap: .4rem; font: 500 .68rem var(--font-head); letter-spacing: .06em; color: #c7b994; }
	.local-status i, .panel-bottom i { width: .42rem; height: .42rem; display: inline-block; border-radius: 50%; background: #86aa78; box-shadow: 0 0 8px #86aa78; }
	.icon-button { color: var(--parch); background: transparent; border: 1px solid #5c4e35; border-radius: 50%; width: 2.2rem; height: 2.2rem; }
	.workspace { max-width: 92rem; margin: 0 auto; min-height: calc(100dvh - 5rem); display: grid; grid-template-columns: 4.25rem minmax(0, 1fr) 18rem; background: var(--parch); border: 1px solid #725c35; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 38px #0008, inset 0 0 0 2px #d9b66a30; }
	.rail { background: linear-gradient(#1f4b48, #183a37); color: #e9ddbf; display: flex; align-items: center; flex-direction: column; padding: .9rem .35rem; gap: .45rem; border-right: 1px solid #b4893c; }
	.campaign-mark { width: 2.45rem; height: 2.45rem; border: 1px solid var(--brass); border-radius: 8px; display: grid; place-items: center; color: var(--brass-2); font: 700 .85rem var(--font-head); margin-bottom: .5rem; }
	.rail-button { border: 0; width: 100%; padding: .45rem 0; color: #c9c0a8; background: transparent; display: grid; justify-items: center; gap: .15rem; border-radius: 7px; }
	.rail-button span { font-size: 1.25rem; line-height: 1; }
	.rail-button small { font: 500 .54rem var(--font-head); }
	.rail-button.chosen { color: #f3d98c; background: #ffffff13; box-shadow: inset 2px 0 var(--brass-2); }
	.rail-spacer { flex: 1; }
	.main-pane { min-width: 0; background: linear-gradient(135deg, #f0e4ca, #e9d9b8); }
	.campaign-heading { min-height: 7rem; padding: 1.1rem 1.6rem .75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.eyebrow { margin: 0 0 .3rem; color: #79653e; font: 700 .68rem var(--font-head); letter-spacing: .16em; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { font: 700 1.8rem/1.05 var(--font-head); margin-bottom: .2rem; color: #282015; }
	.edit-mark { font: 400 1rem var(--font-body); color: #837252; }
	.subheading { color: #695b43; font-size: .9rem; margin-bottom: 0; }
	.settings-pill { flex: none; border: 1px solid #c5b58f; border-radius: 7px; background: #f3e8d1; color: #53482f; padding: .5rem .65rem; font-size: .72rem; }
	.tabs { display: flex; gap: 1.2rem; padding: 0 1.6rem; border-bottom: 1px solid #c9b88e; overflow-x: auto; }
	.tabs button { padding: .65rem .1rem; color: #756647; background: transparent; border: 0; white-space: nowrap; font: 600 .75rem var(--font-head); }
	.tabs .tab-active { color: #214744; border-bottom: 3px solid #2d6560; }
	.content { padding: 1.25rem 1.6rem 1rem; }
	.parchment { background: linear-gradient(100deg, #f3ead5ee, #e5d4b4dd), var(--parch-texture, none) center/420px repeat, #efe2c4; }
	.hero-card { min-height: 17.5rem; border: 2px solid #1f4b48; border-radius: 10px; display: grid; grid-template-columns: 1.05fr .95fr; overflow: hidden; box-shadow: 0 5px 14px #35250f25, inset 0 0 0 2px #d9b66a; }
	.hero-copy { padding: 1.45rem 1.4rem; z-index: 1; }
	.hero-copy h2 { font: 700 1.65rem/1.1 var(--font-head); color: #2c2419; margin: .45rem 0 .6rem; }
	.hero-copy > p:not(.eyebrow) { font-size: .82rem; line-height: 1.5; max-width: 23rem; color: #62533a; margin-bottom: 1rem; }
	.primary-button { color: #f5e9cc; background: linear-gradient(#3f7f77, #1f4b48); border: 1px solid #b4893c; border-radius: 7px; padding: .65rem .95rem; min-height: 2.65rem; font: 700 .82rem var(--font-head); box-shadow: 0 2px 0 #143633, inset 0 1px #ffffff30; }
	.primary-button:active { transform: translateY(1px); }
	.hero-art { position: relative; min-height: 17rem; overflow: hidden; background: linear-gradient(180deg, #9ba997 0%, #d2bc88 53%, #555b43 100%); }
	.hero-art > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 72% center; }
	.hero-art::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #efe2c4 0%, transparent 32%), linear-gradient(0deg, #20271d66, transparent 40%); }
	.art-caption { position: absolute; z-index: 2; right: .8rem; bottom: .6rem; color: #f4e6c7; font: 600 .55rem var(--font-head); letter-spacing: .17em; }
	.section-title { display: flex; align-items: end; justify-content: space-between; margin: 1.5rem 0 .75rem; }
	.section-title .eyebrow { margin-bottom: .15rem; font-size: .6rem; }
	.section-title h2 { font: 700 1.25rem var(--font-head); margin: 0; color: #312719; }
	.ornament { color: #a17c37; font-size: 1.25rem; }
	.foundation-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; }
	.foundation-card { border: 1px solid #c7b58c; border-radius: 8px; background: #f1e5cb; padding: .85rem; min-height: 8.3rem; box-shadow: inset 0 0 0 1px #fff6; }
	.foundation-icon { display: grid; place-items: center; width: 1.7rem; height: 1.7rem; border-radius: 6px; color: #e8d7ae; background: #2d6560; margin-bottom: .45rem; }
	.foundation-card h3 { font: 700 .83rem var(--font-head); margin-bottom: .25rem; color: #34291a; }
	.foundation-card p { font-size: .7rem; line-height: 1.4; color: #66583f; margin-bottom: 0; }
	.footnote { margin: .75rem 0 0; color: #8c7a58; font-size: .65rem; text-align: right; }
	.right-panel { position: relative; background: #eee0c1; border-left: 1px solid #b89b64; padding: 1rem .85rem 3rem; }
	.panel-heading { display: flex; align-items: center; gap: .55rem; padding-bottom: .9rem; border-bottom: 1px solid #c9b78f; }
	.panel-icon { display: grid; place-items: center; width: 2rem; height: 2rem; color: #eedcae; background: #214c48; border-radius: 7px; font-size: 1.2rem; }
	.panel-heading h2 { font: 700 .95rem var(--font-head); margin: 0; }.panel-heading p { color: #786b50; font-size: .65rem; margin: 0; }
	.more-button { margin-left: auto; border: 0; color: #786b50; background: transparent; }
	.oracle-callout { display: flex; align-items: center; gap: .55rem; margin: .9rem 0 1rem; padding: .7rem; background: #e4d1aa; border: 1px solid #c5a76c; border-radius: 8px; }
	.oracle-symbol { width: 1.8rem; height: 1.8rem; display: grid; place-items: center; color: #f0dca9; background: #7d2b22; border-radius: 50%; }
	.oracle-callout strong { font: 700 .8rem var(--font-head); }.oracle-callout p { margin: 0; font-size: .64rem; color: #756346; }
	.oracle-callout button { margin-left: auto; border: 0; background: transparent; color: #6e2d23; font-size: 1rem; }
	.quick-title { display: flex; justify-content: space-between; align-items: center; color: #806e4b; font: 700 .62rem var(--font-head); letter-spacing: .1em; margin-bottom: .4rem; }
	.quick-title button { background: transparent; border: 0; color: #786b50; font-size: 1.1rem; }
	.oracle-row { display: flex; align-items: center; gap: .55rem; width: 100%; padding: .55rem .15rem; background: transparent; border: 0; border-bottom: 1px solid #d4c5a3; color: #403522; text-align: left; font: 600 .76rem var(--font-head); }
	.oracle-row b { margin-left: auto; color: #957c4e; font-weight: 400; }
	.die-icon { border: 1px solid #b99b60; border-radius: 4px; color: #705a30; background: #f5e9ce; padding: .16rem .25rem; font: 600 .56rem var(--font-head); }
	.journal-peek { margin-top: 1.15rem; padding-top: .75rem; border-top: 1px solid #c9b78f; }
	.empty-journal { border-left: 2px solid #b4893c; padding: .35rem .5rem; margin: .6rem 0; color: #786b50; font-style: italic; font-size: .7rem; }
	.panel-bottom { position: absolute; bottom: .75rem; left: .85rem; right: .85rem; justify-content: space-between; font-size: .55rem; }
	.panel-bottom span:last-child { color: #8b7a59; }
	.mobile-nav { display: none; }
	.modal-scrim { position: fixed; z-index: 10; inset: 0; background: #0d0a07aa; display: grid; place-items: center; padding: 1rem; }
	.setup-modal { position: relative; width: min(100%, 28rem); padding: 1.5rem; border: 2px solid var(--teal); border-radius: 12px; background: linear-gradient(#f3e8d0, #e6d4b2); box-shadow: 0 12px 40px #0008, inset 0 0 0 2px #d9b66a; }
	.setup-modal h2 { margin: .25rem 0 1rem; font: 700 1.5rem var(--font-head); }
	.setup-modal label { display: block; margin: .75rem 0; color: #65563b; font: 700 .75rem var(--font-head); }
	.setup-modal input, .setup-modal select { display: block; width: 100%; margin-top: .3rem; min-height: 2.6rem; padding: .5rem .65rem; border: 1px solid #b9a77d; border-radius: 6px; background: #f6ecd6; color: #2b2116; }
	.modal-note { margin: 1rem 0; color: #786b50; font-size: .72rem; }
	.close-modal { position: absolute; right: .75rem; top: .6rem; border: 0; background: none; font-size: 1.5rem; color: #65563b; }
	@media (max-width: 920px) {
		.shell { padding: 0 .65rem .75rem; }
		.workspace { grid-template-columns: 3.6rem minmax(0, 1fr); min-height: calc(100dvh - 4.75rem); }
		.right-panel { display: none; }
		.content { padding-inline: 1.1rem; }
		.campaign-heading { padding-inline: 1.1rem; }
		.tabs { padding-inline: 1.1rem; }
	}
	@media (max-width: 580px) {
		.shell { padding: 0; min-height: 100dvh; background: var(--parch); }
		.topbar { height: 3.5rem; padding: 0 .8rem; background: #17150f; }
		.workspace { min-height: calc(100dvh - 6.85rem); border: 0; border-radius: 0; grid-template-columns: minmax(0, 1fr); box-shadow: none; }
		.rail { display: none; }
		.campaign-heading { min-height: 6.1rem; padding: .9rem 1rem .6rem; }
		h1 { font-size: 1.5rem; }
		.subheading { font-size: .75rem; max-width: 17rem; }
		.settings-pill { width: 2.45rem; height: 2.45rem; padding: 0; font-size: 1rem; }
		.settings-pill span { display: none; }
		.tabs { gap: 1rem; padding: 0 1rem; }
		.tabs button { padding: .55rem 0; font-size: .7rem; }
		.content { padding: .9rem .8rem 1rem; }
		.hero-card { min-height: 0; grid-template-columns: 1fr; }
		.hero-copy { padding: 1.1rem 1rem; }
		.hero-copy h2 { font-size: 1.45rem; }
		.hero-copy > p:not(.eyebrow) { font-size: .78rem; }
		.hero-art { min-height: 9rem; }
		.foundation-grid { grid-template-columns: 1fr; gap: .5rem; }
		.foundation-card { min-height: 0; display: grid; grid-template-columns: 2rem 1fr; column-gap: .6rem; align-items: start; padding: .65rem; }
		.foundation-icon { grid-row: span 2; margin: 0; }
		.foundation-card h3 { align-self: end; }
		.foundation-card p { grid-column: 2; }
		.footnote { text-align: center; font-size: .58rem; }
		.mobile-nav { position: sticky; bottom: 0; z-index: 2; display: flex; justify-content: space-around; background: linear-gradient(#214c48, #173633); border-top: 2px solid var(--brass); padding: .35rem .3rem calc(.35rem + var(--safe-b)); color: #ddd1b2; }
		.mobile-nav button { display: grid; justify-items: center; gap: .05rem; min-width: 3.5rem; border: 0; border-radius: 6px; background: transparent; color: inherit; padding: .2rem; }
		.mobile-nav span { font-size: 1.1rem; line-height: 1.1; }
		.mobile-nav small { font: 500 .55rem var(--font-head); }
		.mobile-nav .mobile-active { color: #f3d98c; background: #ffffff12; }
	}
</style>
