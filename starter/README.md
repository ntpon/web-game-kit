# starter — React + Phaser isometric demo you can walk around in

A small, complete starting point for a web game: an isometric market scene,
a character that walks (arrow keys / WASD, Shift to sprint), props that block
movement, and a built-in map editor. Everything tunable is a JSON file.

Extracted from building [Taladtaek](https://taladtaek.com); assets included
(MIT, same as the rest of web-game-kit).

## Quick start

```bash
pnpm install
pnpm dev        # → http://localhost:5173
```

## The idea: the whole game state is JSON

| File | What it holds |
|---|---|
| `src/config/game.json` | walk/sprint speed, actor radius, camera zoom, animation frame rate |
| `src/config/map.json` | grid size, terrain legend + rows, item types, placed items, spawn point |

Both are imported as ES modules, so while `pnpm dev` runs, editing a number
reloads the page on your change. Balance tuning = editing JSON, and an AI
agent can read and write every part of it.

## Map editor (dev only)

Open [http://localhost:5173/?edit=1](http://localhost:5173/?edit=1) — an iso
grid appears with a panel on the right:

- **click a tile** — place the selected item type, or remove what's there
- **Save** — POSTs the map to a tiny vite dev plugin (`vite.config.ts`) that
  writes it back to `src/config/map.json`; the page reloads on the new map
- **Export / Import** — move layouts through the clipboard instead
- blocking items (stall, crates, jar) update collision immediately — walk into
  them to feel it

## Where things live

```
src/config/        game.json + map.json (the data)
src/game/
  isoProjection.ts tile <-> screen math (2:1 diamond)
  movement.ts      wall-slide collision movement (pure, no Phaser)
  mapTypes.ts      the map JSON shape
  mapEditor.ts     editor model (pure, no Phaser/DOM)
  editorOverlay.ts editor UI (grid + panel)
  DemoScene.ts     preload, terrain, items, player, input
  boot.ts          Phaser game config
src/App.tsx        React shell around the canvas
public/assets/     terrain tiles, props, character walk cycle
```

## Make it yours

1. Swap `public/assets/` for your art (see the kit's `skills/` for generating
   game-ready assets with AI, and `tools/sprite-preview/` to check walk cycles).
2. Describe your map in `map.json` — new terrain symbols and item types are
   just new legend entries.
3. Add juice when it feels flat: `tools/particle-juice/` drops straight in.
