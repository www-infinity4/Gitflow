# Infinity Repository Recovery and Build Priority

## Honest current state

The Infinity organization contains many valuable prototypes, product ideas, game engines, interfaces, and research concepts. They are not all functioning products yet. Some repositories contain substantial code; others contain only a README, placeholder, duplicated concept, simulated integration, or code that has not been browser-tested.

The next phase must favor working shared infrastructure over creating more isolated descriptions.

## Primary objective

Build one dependable Infinity runtime that can power the strongest existing projects:

- identity and local/session state
- safe AI provider adapter
- repository search/import adapter
- action-event ledger
- versioned asset/content manifests
- small star editing portals
- reusable game scene engine
- shared design/image/3D asset pipeline
- mobile-first shell and installable app support
- tests, diagnostics, and deployment checks

No project should claim real Bitcoin, spendable Infinity, studio licensing, or live AI integration unless the corresponding external service and authoritative ledger are actually connected and verified.

## Priority 1 — Make Gitflow Racing a real proof application

Gitflow already has a complete game page and a large JavaScript engine. It should become the first end-to-end test of the shared runtime.

Required work:

1. Run browser syntax and startup tests.
2. Verify canvas initialization, controls, resize behavior, race loop, scene changes, popups, touch input, and audio handling.
3. Add an in-game diagnostics panel that reports failed assets, unavailable APIs, uncaught errors, frame rate, and current scene.
4. Replace simulated repository markers with an adapter that can load approved public repository metadata.
5. Keep starring, forking, importing, and writing as explicit confirmed operations.
6. Mark sats and Infinity displays as simulated until connected to verified external settlement.
7. Add save/resume and deterministic scene-state serialization.
8. Package shared modules for reuse by the Escape games and future underwater game.
9. Test desktop and Android/mobile layouts.
10. Deploy a stable preview before adding additional economies.

## Priority 2 — Establish the AI brain adapter

The Gemma chatbot repositories should not be hard-wired as the only brain. Create a provider-neutral adapter.

The adapter must support:

- a local mock provider for offline testing
- provider configuration outside committed source
- secure server-side credentials for production
- request cancellation and timeout
- conversation state limits
- structured tool/action responses
- source and attribution records for research
- clear errors when a model name or endpoint is unsupported
- per-project prompts without duplicating the entire AI client

Gemma4-AI can become one interface using this adapter after its advertised model names and API routes are verified against current official provider documentation.

## Priority 3 — Shared scene and question engine

Extract reusable mechanics from Gitflow, Escape from L.A., Escape from New York, and future games.

Common modules:

- scene registry
- player state
- movement and collision
- dialogue/question gates
- branching choices
- objectives and inventory
- repository/content markers
- reward-event recording
- save/resume
- touch and keyboard controls
- audio manager
- asset manifest
- diagnostics

This allows a scene to be authored as data instead of rewriting a new game engine for every repository.

## Priority 4 — Repository game and import workflow

Create a safe GitHub game layer where users can:

1. discover a repository
2. inspect its README, files, language, license, and activity
3. collect it into a personal library
4. choose specific files to import
5. open a sandboxed preview
6. remix into a personal version
7. compare versions
8. explicitly confirm any star, fork, commit, push, or pull request

Repository metadata and user interactions can become C13b0 action events. They must not automatically become spendable currency.

## Priority 5 — StarQuest and user worlds

Finish and test the current world builder before extending its economy:

- verify the small star edit portal
- add reversible version history
- add content shelves and module configuration
- connect the creation gallery
- add public/private publishing states
- add adoption and qualified-use measurement
- move production state out of localStorage into authenticated storage
- preserve immutable IDs under editable names

## Priority 6 — Shared design pipeline

Connect Image Generator, Infinity Graphics, GPT Vector Design, and 3D World through one asset manifest and export protocol.

Every asset should include:

- permanent asset ID
- creator and AI attribution
- source prompt/brief
- type and formats
- dimensions
- rights status
- version ancestry
- integrity hash
- preview
- destination-site compatibility

The first usable deliverable should be a Design Dock embedded in multiple Infinity sites rather than a separate disconnected demo.

## Priority 7 — Alien Coin

Implement the Coin Studio only after identity, manifests, and versioning exist.

First functional scope:

- five-word vector input
- visible research/action ledger
- typed content items
- numbered edition
- live coupon slots with expiration history
- source and rights records
- reversible personalization
- simulated contribution display

No browser-side mint authority.

## Priority 8 — Bitcoin Crusher and Harvest Feed

Treat Bitcoin harvesting as verified revenue attribution, not creation of Bitcoin from clicks.

Build:

- research spin that creates a real product brief
- action-event trail
- website/product generation handoff
- verified revenue-source adapters
- separate BTC, Infinity, StarCoin, Avatar Coin, and simulated-game ledgers
- reconciliation and anti-duplication rules

## Priority 9 — Alien Radio

Convert it into an app-like world after the shared runtime is stable:

- persistent player
- current research feed
- Harvest Feed with verified source labels
- offline-friendly shell
- world themes
- companion integration
- design dock
- article personalization and versioning

## Repository classes

### A — substantial code, inspect and repair first

- Gitflow
- Escape-From-LA-Game
- TV-Database / StarQuest
- Bitcoin-Crusher
- Alien-Coin
- Alien-Radio
- Mario-spin
- Infinity-Graphics
- 3d-world
- Cartoon-Generator
- GP

### B — useful component or concept, integrate after the core works

- Gitpin
- Gitpro
- Gitpub
- Git-Stream
- GPT-Vector-Design
- Image-Generator
- Emulation-Station
- Worldwide-Radio
- research-token-assem
- AI-Agent-Knowledge-Base-
- Camera-app

### C — small, duplicate, placeholder, or unverified

Examples include repositories containing only a short README or nearly no code. Preserve them, but do not spend primary development time on them until their unique purpose is confirmed. Consolidate concepts into the shared core rather than deleting history.

## Definition of working

A project is not considered working merely because files exist.

It must:

- load without uncaught errors
- have functional primary controls
- survive mobile viewport changes
- explain unavailable external services
- avoid exposing secrets
- save and restore expected state
- distinguish simulated from real financial data
- include a basic test/check workflow
- have a deployable preview
- document the exact remaining limitations

## Immediate execution order

1. Audit and repair Gitflow Racing startup and controls.
2. Add diagnostics and a local mock AI brain.
3. Define the shared scene-state format.
4. Connect read-only repository metadata.
5. Reuse the scene engine in one Escape game.
6. Stabilize StarQuest user worlds and edit portals.
7. Connect the shared Design Dock.
8. Implement Alien Coin Studio.
9. Upgrade Bitcoin Crusher.
10. Rebuild the original underwater yellow-ship game with original music and artwork unless licensed media is supplied.
