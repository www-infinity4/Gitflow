# Gitflow ≋ — Quantum Rhythm Engine · F1 Racing

**Symbol:** ≋ (The Sine Wave)

**Role:** Manages the *momentum* of the inertia pool. Ensures that when you clone or fork a world, the transition is smooth and doesn't create "rhythm shock." Also powers the **Gitflow Racing** game — a living F1 simulator where the track *is* the repo.

![Gitflow Racing Title Screen](https://github.com/user-attachments/assets/ab16a7ef-a8bd-4534-862a-707b228bb084)

---

## Files

| File | Purpose |
|---|---|
| `index.html` | **Quantum Rhythm Engine** — Bio-Digital Feedback Loop dashboard |
| `game.html` | **≋ Gitflow Racing** — Pseudo-3D F1 game (Commodore rebuilt) |
| `src/game.js` | Full game engine (road renderer, physics, AI, scenes, chat) |

---

## The GP Suite

| AI | Symbol | Role |
|---|---|---|
| **Gitflow** | ≋ | Streamliner — manages inertia pool momentum, powers smooth fork transitions |
| **GitPin** | ∆ | Anchor — pins live repo content into the race world as track markers |
| **Gitpro** | ◆ | Stylist — visual laws and car liveries of the cloned world |
| **Gitial** | ⬡ | Social mesh — connects racer identities across repos |
| **Gitpub** | 📡 | Broadcaster — live-streams your race to Main Existence |
| **Gitpulse** | ♥ | Diagnostic — monitors Erythmia, flags off-beats (dashboard) |
| **Gitarch** | 🏛 | Architect — handles repo physics / physics-law patches (dashboard) |
| **Gitsync** | ⟲ | Harmonizer — re-integrates patched rhythms into main existence |
| **Gitscan** | ◈ | Sentry — radar sweep for external inertia forces |

---

## ≋ Gitflow Racing (`game.html`)

A **living F1 racing game** rebuilt from the Commodore 64 Formula 1 Simulator. The race track is a forked spatial reality. Your opponents are GP Suite AIs. Your conversation *changes the game world*.

### Controls

| Key | Action |
|---|---|
| ↑ / W | Accelerate |
| ↓ / S | Brake |
| ← / A | Steer left |
| → / D | Steer right |
| Esc | Toggle GP Suite menu |
| Touch | Swipe to steer, tap to accelerate |

### AI Game Master (Chat)

Type in the chat bar at the bottom **while driving** — the AI Game Master (powered by Gitflow ≋) responds and can **change the game world in real time**:

| Command | Effect |
|---|---|
| `slow down` | AI warns + game brakes |
| `where am I` | AI describes current scene and speed |
| `park` / `pull over` | Car stops, cinematic begins |
| `get out` | Driver exits car, walk scene activates |
| `get in` / `drive` | Back in the car, race resumes |
| `bitcoin` | Shows current sats wallet |
| `gitpin` | Shows next GitPin marker and reward |
| `who` | Lists all AI racers and open multiplayer slots |
| `downtown` | AI narrates the downtown district |
| `help` | Full command list |

### Scene System

```
RACE ──→ DOWNTOWN ──→ CINEMATIC (car door opens, driver steps out)
                           │
                           ↓
                        WALK (explore GitPin district on foot)
                           │
                           ↓
                        RACE (get back in, race resumes)
```

### GitPin Markers (∆)

Six **GitPin anchors** are placed on the track. Driving over one:
- Shows a popup with live repo content (commit messages, stream data, user anchors)
- Awards **Bitcoin sats** (150–500 per pin)
- Logs the event to the Gitpub terminal stream

### Bitcoin (Sats) System

| Event | Reward |
|---|---|
| Complete a lap | +1,000 sats |
| Pass a GitPin | +150 – +500 sats |
| Completing downtown run (walk) | +1,000 sats |

### Multiplayer (Roadmap)

AI opponents (GitPin-α, Gitpro-β, Gitsync-γ, Gitpub-δ) race first. Two **OPEN SLOTS** are reserved for real users — connect your GitHub repo to race as yourself with your repo as your car livery.

---

## Giro Brain Dashboard (`index.html`)

Open `index.html` to launch the **Bio-Digital Feedback Loop** — a surgical monitor for the Giro healer.

### Layout

```
┌───────────┬──────────────────┬──────────────┐
│  GITPULSE │   CENTRIFUGAL    │   GITARCH    │
│  ♥ ECG    │   CORE ≋ (3D     │  🏛 Wireframe│
│  scrolling│   Sine Ribbon)   │  world-repo  │
│  feed     │                  │  + phys laws │
├───────────┤   ACTION BAR     ├──────────────┤
│  GITSCAN  │  Glitch→Buffer   │   GITSYNC    │
│  ◈ Radar  │  →Patch→Sync     │  ⟲ Re-integ │
│  sweep    │                  │  arc %match  │
└───────────┴──────────────────┴──────────────┘
│         📡 GITPUB TERMINAL STREAM            │
└──────────────────────────────────────────────┘
```

### Healing Interaction Flow

1. **⚡ INJECT GLITCH** — Gitpulse ♥ flags the off-beat; radar pings; wave turns red/jagged
2. **⬡ MOMENTUM BUFFER** — Gitflow ≋ freezes local inertia; wave slows and stabilises
3. **🏛 APPLY PATCH** — Gitarch rewrites the anomalous physics law (Gravity / Entropy / Planck)
4. **⟲ HARMONIZE & SYNC** — Gitsync pushes the patch to the Centrifugal Core; arc fills to 100%
