# Infinity Game Network and Yellow Submarine Rebuild

## Recovered game repository

The GitHub-centered game is in `www-infinity4/Gitflow`.

Gitflow already contains:

- `game.html`, a pseudo-3D F1 game.
- `src/game.js`, the road, physics, AI, scene, and chat engine.
- GitPin track markers that expose repository information.
- A GP Suite of connected Git services.
- Scene transitions between racing, downtown, cinematic, and walking modes.
- Mobile touch controls.

This makes Gitflow the strongest current foundation for the shared Infinity game network.

## What the Git game should become

The game should make repository discovery, importing, starring, saving, cloning, and expanding faster and more understandable than navigating slow repository lists and Actions pages.

A repository becomes a playable world object rather than only a text row.

```text
Discover repository
  -> inspect live marker
  -> star or save
  -> import selected files
  -> open a playable preview
  -> remix or expand
  -> publish a new version
```

### Git actions represented as game actions

- Star repository: mark it as a collected world.
- Save repository: place it in the user's Infinity vault.
- Import file: collect a usable component.
- Fork or clone: create a personal playable branch.
- Open README: inspect the world guide.
- Open commit: inspect a change marker.
- Compare versions: travel between world states.
- Merge approved work: reconnect a completed route.
- Search: scan the map rather than waiting through long lists.

No game action should silently perform a GitHub write. Star, fork, import, commit, merge, or publish actions require a clear confirmation and a recorded result.

## Bitcoin harvest interpretation

User interaction can create a verified contribution trail, but gameplay cannot manufacture Bitcoin.

The harvest layer should distinguish:

1. Game activity points.
2. Verified repository contribution events.
3. Sponsor or advertising revenue.
4. Real Bitcoin received through an authorized wallet or processor.
5. Infinity settlement recorded separately.

GitPin markers may display simulated sats during gameplay, but production Bitcoin balances must come from confirmed external transactions. Interaction data can determine how legitimate revenue is distributed after it exists.

## Reusable scene engine

The strongest mechanic across Gitflow and the Escape games is a scene controlled by questions and choices.

A shared scene record should support:

```json
{
  "sceneId": "scene_01J...",
  "title": "Downtown Repository District",
  "backgroundAssetId": "asset_01J...",
  "musicAssetId": "asset_01J...",
  "prompt": "A GitPin marker is flashing. What do you inspect?",
  "choices": [
    {"label": "Open README", "nextSceneId": "scene_readme"},
    {"label": "Import component", "nextSceneId": "scene_import"},
    {"label": "Keep driving", "nextSceneId": "scene_race"}
  ],
  "actions": [],
  "version": 1
}
```

This engine can support:

- Gitflow Racing.
- Escape from New York.
- Escape from L.A.
- Alien Radio journeys.
- StarQuest entertainment worlds.
- Bitcoin Crusher product spins.
- Yellow Submarine-style underwater exploration.

## Yellow underwater ship game

A new original underwater music-adventure game can recover the mechanics of the lost Yellow Submarine idea without distributing copyrighted Beatles recordings or copied film artwork.

Working title: **Golden Submarine Journey** until licensed naming and music are available.

### Core play

- Pilot a bright yellow ship through layered underwater scenes.
- Dodge rocks, mines, sea creatures, currents, bubbles, and collapsing ruins.
- Collect notes, stars, research fragments, coupons, visual assets, and repository markers.
- Questions appear at scene gates and determine the next route.
- Each answer can change the colors, music arrangement, enemies, current, or destination.
- The player can enter discovered portals that open user-created worlds.
- A completed route can export its scene design into the Infinity creation chain.

### Music

Use an original 8-bit underwater melody by default. A Beatles song or recognizable arrangement may only be included with appropriate rights. The engine should accept licensed tracks later without requiring a rewrite.

### Mobile controls

- Drag or tilt to steer.
- Hold the screen to rise.
- Release to sink.
- Tap the action button to pulse, collect, or open a portal.
- Pause opens the small Star editing controls for ship name, companion, colors, difficulty, and soundtrack.

### Scene progression

```text
Surface launch
  -> coral corridor
  -> question gate
  -> dark trench
  -> repository ruins
  -> music garden
  -> user-created world portal
  -> final ascent
```

## Repository priority audit

### Highest immediate value

1. `Gitflow` — already has a complete game, AI commands, mobile controls, scenes, GitPin markers, and a connected GP Suite.
2. `Escape-From-LA-Game` — substantial single-file game engine and Android packaging.
3. `Mario-spin` — large repository and likely valuable spin mechanics; audit rights and reusable mechanics before integration.
4. `Bitcoin-Crusher` — product-generation loop and research spin architecture.
5. `Alien-Coin` — content packaging, research, live coupons, and action-token records.
6. `Infinity-Graphics`, `3d-world`, and `Image-Generator` — shared visual production pipeline.

### Needs recovery or expansion

- `ESCAPE-FROM-NEW-YORK` has a real HTML/CSS/JavaScript skeleton but is much smaller than the L.A. game.
- `Gitpal` currently contains only a tiny README and may be a placeholder rather than the recovered application.
- Several Git-named repositories appear to be specialized parts of the GP Suite and should be inventoried before consolidation.

## Shared game package

The reusable package should eventually expose:

- Scene renderer.
- Question and choice engine.
- Mobile controls.
- Dialogue and AI Game Master adapter.
- Repository marker adapter.
- Asset and music manifest.
- Save-state and version history.
- Accessibility controls.
- Star edit portals.
- Verified interaction events.
- Separate simulated and real-value ledgers.

## Next implementation order

1. Confirm Gitflow runs without console errors on desktop and mobile.
2. Inventory `src/game.js` and extract the scene engine from Gitflow-specific code.
3. Compare the scene and movement code with Escape from L.A.
4. Create a shared `infinity-game-core` module or documented package boundary.
5. Build the original Golden Submarine prototype using that engine.
6. Connect repository import only after explicit GitHub authorization and confirmation.
7. Connect verified contribution events to Infinity without treating simulated sats as real Bitcoin.
