import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		// Unit tests run without the SvelteKit Vite plugin, so `$app/paths`
		// resolves to a stub with the same root-relative URL behavior.
		alias: { '$app/paths': path.resolve(__dirname, './vitest.app-paths.ts') }
	},
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
