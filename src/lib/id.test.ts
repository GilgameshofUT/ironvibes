import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './id';

afterEach(() => vi.unstubAllGlobals());

describe('local record ids', () => {
	it('generates unique UUID-shaped ids without a secure crypto context', () => {
		vi.stubGlobal('crypto', undefined);
		const ids = Array.from({ length: 100 }, () => createId());
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});
	it('uses native random UUIDs when available', () => {
		vi.stubGlobal('crypto', { randomUUID: () => 'native-id' });
		expect(createId()).toBe('native-id');
	});
});
