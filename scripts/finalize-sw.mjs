import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @vite-pwa/sveltekit runs its SW generation (ctx.runBuild) before
 * adapter-static writes its files, so `404.html` — the SPA fallback — never
 * reaches the precache manifest, and the prerendered homepage is rewritten to
 * `./` instead of `index.html`. `createHandlerBoundToURL('./404.html')` then
 * throws `non-precached-url` the moment sw.js evaluates, the worker never
 * installs, and the app has no offline support at all.
 *
 * Add both HTML entries with content-hash revisions so the navigate-fallback
 * handler resolves and a changed shell re-fires the SW update.
 */
const swPath = resolve('build/sw.js');
const anchor = '],{cleanURLs';

if (!existsSync(swPath)) {
	console.error('[finalize-sw] build/sw.js not found — run vite build first.');
	process.exit(1);
}

let sw = readFileSync(swPath, 'utf8');

if (sw.includes('{url:`404.html`')) {
	console.log('[finalize-sw] 404.html precache entry already present, skipping.');
	process.exit(0);
}

const anchors = sw.split(anchor).length - 1;
if (anchors !== 1) {
	console.error(`[finalize-sw] expected exactly one precache anchor \`${anchor}\`, found ${anchors}.`);
	console.error('[finalize-sw] sw.js layout changed — refusing to patch; offline support would be broken.');
	process.exit(1);
}

const entries = ['index.html', '404.html'].map((name) => {
	const path = resolve('build', name);
	if (!existsSync(path)) {
		console.error(`[finalize-sw] build/${name} is missing — cannot precache it.`);
		process.exit(1);
	}
	const revision = createHash('sha1').update(readFileSync(path)).digest('hex');
	return `{url:\`${name}\`,revision:\`${revision}\`}`;
});

sw = sw.replace(anchor, `,${entries.join(',')}],{cleanURLs`);
writeFileSync(swPath, sw);
console.log(`[finalize-sw] precache entries added: ${entries.join(', ')}`);
