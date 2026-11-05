# Ironvibes

A clean-room, mobile-friendly campaign companion inspired by the organizational patterns of Pocketforge and the visual style of the local Four Against Darkness Svelte app.

## Development

```sh
npm install
npm run dev
npm run check
npm run test
npm run build
```

## GitHub Pages + installable PWA

This copy builds as a fully static site with an offline-capable PWA, ready for GitHub Pages project hosting (e.g. `https://<you>.github.io/ironvibes/`).

- Static output via `@sveltejs/adapter-static` with a `404.html` SPA fallback.
- Installable manifest + icons in `static/icons/`, service worker via `@vite-pwa/sveltekit` (auto-update, precaches JS/CSS/HTML/art/fonts).
- Base path comes from the `BASE_PATH` env var at build time (Pages provides it automatically in `.github/workflows/deploy.yml`). Locally: `BASE_PATH=/ironvibes npm run build`.
- Pushes to `main` auto-deploy through the Deploy to GitHub Pages workflow. In the new repo: Settings → Pages → Source: GitHub Actions.

### Install on a Pixel (Chrome)

1. Open the Pages URL, wait for it to fully load once (this primes the offline cache).
2. Chrome menu (⋮) → Add to Home screen / Install app.
3. Launch from the home screen — it runs standalone with its own icon and theme color.

## Current foundation

- SvelteKit + Svelte 5 + TypeScript.
- Responsive desktop/mobile campaign workspaces with browser-local records, assets and custom Delve theme/domain tables.
- Alegreya / Alegreya SC typography and a parchment, verdigris, brass, and oxblood palette based on the Four Against Darkness reference project.
- Local generic parchment texture and decorative ornament with independent game artwork.
- Datasworn 0.3 core and official/community content packages as dependencies. Keep packages on the same schema line and review each package's embedded/source license metadata before redistributing content.
- `idb` for future IndexedDB-backed local campaign persistence.
- `@google/genai` and `sharp` for future trusted-server Vertex image-generation and asset-optimization workflows. Image generation has not yet been invoked.

## Product notes

- `docs/POCKETFORGE_REVIEW.md` records the observed and documented Pocketforge organization and features.
- `docs/FOUR_AGAINST_DARKNESS_STYLE.md` records the reference visual system and reused generic assets.

## Notes

- Campaigns, maps, dice, Datasworn pack/item JSON imports, and browser-local persistence are wired. Feature parity with Pocketforge remains unverified; see the evidence ledger in `docs/POCKETFORGE_REVIEW.md`.
- Never expose Vertex credentials or provider keys in client code.
