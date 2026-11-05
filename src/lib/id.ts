let localCounter = 0;

/** Browser-local record ID. LAN HTTP is not a secure context, so Web Crypto can be unavailable. */
export function createId(): string {
	if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
	const bytes = new Uint8Array(16);
	const cryptoProvider = globalThis.crypto;
	if (typeof cryptoProvider?.getRandomValues === 'function') {
		cryptoProvider.getRandomValues(bytes);
	} else {
		for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
		// Math.random is a last resort on insecure origins; include a monotonic counter and wall time.
		const stamp = `${Date.now().toString(16)}${(++localCounter).toString(16)}`.slice(-16).padStart(16, '0');
		for (let i = 0; i < 8; i++) bytes[i] ^= parseInt(stamp.slice(i * 2, i * 2 + 2), 16);
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
