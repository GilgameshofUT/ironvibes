# Four Against Darkness visual reference

Reference project: `/Users/joel.stucki/codeprojects/four-against-darkness`

The visual system in that Svelte 5 app is a good starting point for Ironvibes:

- Warm parchment surface over a dark, atmospheric background.
- Verdigris/teal frame and controls, aged brass highlights, oxblood for danger.
- Alegreya for body text and Alegreya SC for headings.
- Mobile-first full-width phone layout with safe-area spacing and larger-screen composition capped to a comfortable reading width.
- Generated storybook art with hand-inked contours, watercolor/gouache washes, muted earthy colors, gentle lighting, and subtle whimsy.
- Separate asset types: scenes, portraits, icons, textures, and feature illustrations, generated with Vertex AI and optimized to WebP for runtime delivery.

## Reused generic assets

The following generic resources were copied from the local reference project into this app. They are not Four Against Darkness rules or content:

- `static/art/textures/parchment.webp`
- `static/art/ui/frame_ornament.webp`
- `static/art/scenes/first-vow-reference.webp` (renamed source title illustration, used temporarily as art-direction reference)

## Asset-generation direction

For newly generated Ironvibes art, use the established Google Gen AI SDK with Vertex AI and `gemini-nano-banana-2.1`, using Application Default Credentials on the trusted development machine or a backend service. Do not call Vertex AI directly from the browser or commit credentials. Prompts should be specific to the Ironvibes setting and not reuse Four Against Darkness character/game assets.
