# SHADOWCLOAK: The Obsidian Archive

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/malapetakasatu/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/malapetakasatu/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A pure tactical top-down stealth heist browser game built for the [make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759) competition: **"Make the best stealth game"**.

Zero external runtime dependencies. 100% vanilla ES modules, HTML5 Canvas 2D, and procedural Web Audio API.

---

## 🎯 Gameplay & Features

- **Dynamic Raycast Vision Cones**: Realistic polygonal field-of-view (FOV) calculation with line-of-sight occlusion through 2D walls, server racks, and security blast doors.
- **Atmospheric Lighting & Deep Shadows**: Standing in shadows drastically reduces guard detection range. Sneaking in deep darkness lets you slip past patrol sweeps unseen.
- **Multi-Phase Guard AI State Machine**:
  - `PATROL`: Waypoint routing with idle lookarounds.
  - `SUSPICIOUS`: Investigates flickers of movement; raises yellow suspicion meter.
  - `INVESTIGATING`: Breaks patrol to inspect sound sources.
  - `ALERT`: Full alarm chase when an operative is identified.
- **Acoustic Lure Mechanic (Pebble Toss)**: Aim and toss pebbles to emit sound wave ripples across corridors, luring guards away from high-security vaults.
- **Security Laser Tripwires & Vault Infiltration**: Avoid laser detection grids to acquire three high-value data cores (`CYBER VAULT CIPHER`, `SECURITY SCHEMATIC`, and `THE OBSIDIAN CORE`) before triggering the extraction elevator.
- **100% Procedural Web Audio**: Synthesized footsteps, pebble bounces, suspicious alert hums, klaxon alarms, and victory fanfare generated purely via the Web Audio API.

---

## 🎮 Controls

| Action | Control | Description |
|---|---|---|
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | Standard tactical movement |
| **Sneak** | `Shift` (Hold) | Silent crouching movement; cuts guard hearing radius to 0 |
| **Sprint** | `Space` (Hold) | Fast dash; generates loud footsteps that trigger investigations |
| **Aim & Throw Pebble** | `Mouse Movement` + `Left Click` | Throws a distraction pebble towards cursor |
| **Mute Audio** | `M` | Toggles procedural sound effects |

---

## 🏗️ Architecture & Source Structure

The game engine is split into focused ES modules with zero bundlers or transpilers required:

```
game/
├── index.html        # Viewport container (1024x640) & responsive UI shell
└── src/
    ├── config.js     # Viewport balance, speeds, vision FOV, and cyber palette
    ├── input.js      # Normalized keyboard & mouse pointer event coordinator
    ├── sound.js      # Procedural Web Audio oscillator synthesis (offline)
    ├── raycast.js    # 2D segment intersection & vision cone polygonal casting
    ├── guard.js      # AI state machine, FOV detection, and noise reaction
    ├── world.js      # Black-site vault layout, obstacle segments, and lasers
    ├── render.js     # Canvas renderer: lighting mask, cones, sprites, and HUD
    └── main.js       # Game loop (requestAnimationFrame), physics, and transitions
screenshots/          # 4 in-game gameplay captures (1024x640)
vendor/
└── makefun-game.ts   # MakeFun dossier generator for AI multimodal judging
main.ts               # Node 22 runner producing /output/dossier.json
```

---

## 🚀 Running Locally

Requirements: Node 22+

```bash
# 1. Build output dossier for makefun verification
MAKEFUN_OUTPUT_DIR=./output node main.ts

# 2. Serve the playable game in any local web server:
npx serve game -p 3000
# Open http://localhost:3000 in your browser
```

---

## 📜 License

[MIT](LICENSE) © 2026 malapetakasatu.
