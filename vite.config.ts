import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { withPwa } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

const base = process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '');

export default defineConfig({
	base: base || '/',
	plugins: [
		withPwa(
			{
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }: { filename: string }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},

				// Static output for GitHub Pages; 404.html is the SPA fallback.
				adapter: adapter({
					pages: 'build',
					assets: 'build',
					fallback: '404.html',
					strict: false
				}),
				paths: {
					base: base as '' | `/${string}`
				}
			},
			{
				registerType: 'autoUpdate',
				// The datasworn bundle chunk and painted terrain atlases exceed workbox's 2 MiB default.
				maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
				manifest: {
					name: 'Ironvibes — Campaign Companion',
					short_name: 'Ironvibes',
					description: 'A mobile-friendly Ironsworn and Starforged campaign companion.',
					display: 'standalone',
					orientation: 'any',
					start_url: './',
					scope: './',
					theme_color: '#1f4b48',
					background_color: '#15120e',
					icons: [
						{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
						{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
						{
							src: 'icons/maskable-512.png',
							sizes: '512x512',
							type: 'image/png',
							purpose: 'maskable'
						}
					]
				},
				generateSW: {
					// Full offline: precache the prerendered shell + built assets.
					globPatterns: ['**/*.{js,css,html,webp,png,svg,woff,woff2}'],
					navigateFallback: './404.html'
				},
				devOptions: {
					enabled: false
				}
			}
		)
	]
});
