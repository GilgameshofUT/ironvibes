<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import { asset } from '$app/paths';
	import type { LayoutProps } from './$types';
	import '../lib/styles.css';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="./manifest.webmanifest" />
	<link rel="apple-touch-icon" href={asset('icons/apple-touch-icon.png')} />
	<meta name="theme-color" content="#1f4b48" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Ironvibes" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="description" content="A mobile-friendly Ironsworn and Starforged campaign companion." />
	<title>Ironvibes</title>
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		font-family: 'Alegreya', Georgia, serif;
		color: #2b2116;
		background: #15120e;
		font-size: clamp(16px, 3.8vw, 20px);
		line-height: 1.35;
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-webkit-tap-highlight-color: transparent;
		--parch: #efe2c4;
		--parch-2: #e5d3ab;
		--parch-3: #d8c294;
		--ink: #2b2116;
		--ink-soft: #5a4a36;
		--teal: #1f4b48;
		--teal-2: #2d6560;
		--teal-3: #3f7f77;
		--verdigris: #6fa394;
		--oxblood: #7d2b22;
		--brass: #b4893c;
		--brass-2: #d9b66a;
		--night: #15120e;
		--font-body: 'Alegreya', Georgia, serif;
		--font-head: 'Alegreya SC', 'Alegreya', Georgia, serif;
		--radius: 10px;
		--safe-b: env(safe-area-inset-bottom, 0px);
		--safe-t: env(safe-area-inset-top, 0px);
	}
	:global(*) { box-sizing: border-box; }
	:global(html), :global(body) { margin: 0; min-height: 100%; }
	:global(body) {
		background: radial-gradient(ellipse at 50% 20%, #2a231a 0%, #15120e 60%, #0b0907 100%);
	}
	:global(button), :global(input), :global(textarea), :global(select) { font: inherit; }
	:global(button) { color: inherit; -webkit-tap-highlight-color: transparent; }
	:global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible) {
		outline: 3px solid var(--brass-2);
		outline-offset: 2px;
	}
	:global(img) { max-width: 100%; display: block; }
</style>
