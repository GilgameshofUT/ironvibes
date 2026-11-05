/** Test stub for `$app/paths`: mirrors the framework's root-relative asset URLs. */
export const base = '';
export const assets = '';

export function asset(file: string): string {
	return `/${String(file).replace(/^\/+/, '')}`;
}

export function resolve(...parts: Array<string | Record<string, string>>): string {
	const [id] = parts as [string];
	if (typeof id === 'string' && id.startsWith('/')) return id;
	return `/${parts.map((part) => String(part)).join('/').replace(/\/+/g, '/').replace(/^\/+/, '')}`;
}

export async function match(_url: unknown): Promise<null> {
	return null;
}
