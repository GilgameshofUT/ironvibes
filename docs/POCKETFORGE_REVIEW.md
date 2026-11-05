# Pocketforge product and UI review

Review date: 2026-11-03

## Scope and method

This is a clean-room product review of the publicly accessible Pocketforge app and its published user guide. I used a 390 × 844 mobile viewport and inspected the no-campaign start screen, app menu/settings, and new-campaign dialog. I did not create a campaign or write data to the live app. The guide is more complete than the logged-out app walkthrough for areas requiring a campaign, so the feature notes below distinguish documented features from directly observed screens. It is not a source-code audit.

## Confirmed technical observations

- The deployed client uses Nuxt/Vue conventions: assets are emitted from `/_nuxt/`, and the UI uses Quasar classes such as `q-btn`. This identifies the client framework family, not the entire backend architecture.
- The public product guide describes an installable PWA with browser-local campaign data and offline use. Campaign transfer is through export/import.
- The initial screen has a global header, campaign picker/start action, app theme entry and import/export actions in the settings menu.
- New-campaign setup independently chooses campaign theme and character rules, with Ironsworn, Starforged, and Sundered Isles choices. The guide documents Sundered Isles campaigns using Starforged character rules by default.
- The guide documents app appearance controls for light/dark mode, color scheme, and background; navigation controls; campaign options; campaign/data import/export; and journal HTML export.

## Published organization and workflows

- **Campaign setup:** choose a setting/content theme separately from character rules; settings drive default origins, oracle and move context, available site categories, character tracks, and conditions.
- **In-campaign workspace:** app header and settings, main navigation tabs, a contextual sidebar for moves/oracles, quick-roll affordances, and a dice roller available from the lower UI.
- **Hero and NPC records:** create/edit, randomly fill fields, assign origins, assets, stats/conditions and relationships; promote NPCs to heroes or vice versa; export/reuse records.
- **Tracks and vows:** track journeys, vows, exploration, combat, and scene challenges.
- **Sites/instances:** Delves, Derelicts, Vaults, Shipwrecks, Caves, and Ruins with progress, areas/zones, waypoints, and generated features; users can edit or reroll output.
- **Locations and factions:** link characters, NPCs, quests/missions/troubles, and nested locations.
- **Custom data:** user-created assets, themes/domains, and custom oracle tables (the latter is present in recent public announcements; confirm UX/format during implementation).
- **Journaling:** insert oracle results, continue writing while navigating elsewhere, and export campaign journals as styled HTML.

## UX patterns worth carrying forward

1. Separate campaign content selection from mechanical character rules.
2. Keep contextual oracles/moves close to the journal and active view, rather than requiring navigation to a separate reference screen.
3. Make generated values editable and rerollable; generation should support play, not take control away from the player.
4. Keep campaign and content import/export visible in the settings model.
5. Adapt navigation and sidebar behavior on mobile while preserving a wider multi-pane workspace on desktop/tablet.

## Clean-room implementation boundary

Ironvibes is independently implemented. We can borrow general workflow ideas and product organization, but should not copy Pocketforge source, branding, visual assets, or distinctive screen designs. Datasworn's JSON schema and content packages are a separate, documented interoperability format for rules data.

## Reference sources

- [Pocketforge](https://pocketforge.rockpaperstory.com/)
- [How to use Pocketforge](https://rockpaperstory.com/blog/how-to-use-pocketforge/)
- [Pocketforge overview](https://rockpaperstory.com/pocketforge/)
- [Datasworn Community](https://github.com/datasworn-community/datasworn)
- [Datasworn community content packages](https://github.com/datasworn-community/community-content)
