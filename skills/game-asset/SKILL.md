---
name: game-asset
description: Generate game-ready art (character spritesheets, props, backgrounds, tilesets, icons) by combining Codex image generation with a deterministic post-processing CLI. Use for any game art request - "character sprite", "walk cycle spritesheet", "tileset", "icon with transparent background".
---

# game-asset — game-tuned generation + deterministic post-processing

Two layers: this skill builds the prompt and orchestrates; the `gameasset` CLI
(`scripts/gameasset.py`, Python + Pillow) enforces pixel-level correctness —
background keying, frame slicing, uniform scale, feet anchoring, layout metadata.
Codex generation mechanics come from the **image-generation** skill (read it first).

Install deps once: `python3 -m pip install -r <skilldir>/scripts/requirements.txt`

## Key principle: generate on a key color, NOT "transparent"

Image models cannot produce real alpha this way — ask for "transparent background"
and you get an opaque near-white fill; auto-keying that then eats light skin/hair.

So: **generate every character/prop/icon on a SOLID FLAT MAGENTA (#FF00FF)
background** (a color no skin/hair/clothing uses), then key exactly that:

```bash
python3 <skilldir>/scripts/gameasset.py removebg <img.png> --key magenta --out <name>.png
```

Backgrounds/tilesets keep their full scene (no keying).

## Detect the asset type

| Signal in the request | Type |
|---|---|
| walk/run/attack/idle cycle, "spritesheet" | **sprite** |
| single object/character, transparent bg | **prop** |
| "icon", needs multiple sizes | **icon** |
| "tileset", repeating grid | **tileset** |
| scene, full-bleed | **background** |

## Per-type pipeline

### sprite (whole-sheet generation + normalize + human check)

1. Ask Codex for ONE image containing the full grid (see the policy prompt below).
   Small counts (4-8 frames) drift less than 16.
2. Key + normalize (plants feet, uniform scale, emits layout metadata):
   ```bash
   python3 <skilldir>/scripts/gameasset.py removebg sheet_raw.png --key magenta --out sheet_keyed.png
   python3 <skilldir>/scripts/gameasset.py normalize sheet_keyed.png --frames 4 --cols 4 --anchor feet --out walk
   # -> walk/sheet.png + walk/metadata.json + walk/frames/frame_*.png
   ```
3. **Check the motion by eye before it enters the game** — frame drift (swapped
   legs, face changes, size wobble) only shows when frames move. Drop
   `sheet.png` + `metadata.json` into the `sprite-preview` tool (same kit) and play it.
4. Frames drifted? Regenerate with a tighter prompt, or generate frame-by-frame
   with the first frame attached as a reference (`codex exec -i frame0.png`).

### prop / character
Single centered object on solid flat magenta → generate → `removebg --key magenta`.

### icon
Same as prop, then: `python3 <skilldir>/scripts/gameasset.py resize <transparent.png> --sizes 16,32,64,128 --out <name>`

### tileset
Prompt for an N×M grid of seamless tiles, consistent perspective/lighting →
`python3 <skilldir>/scripts/gameasset.py slice <sheet.png> --cols N --rows M --out <name>_tiles`

### background
Full-bleed scene at the target aspect ratio. No post-processing.

## Spritesheet policy prompt (embed verbatim for sprites)

- Produce ONE complete spritesheet image, a 4x1 grid of 4 frames (adjust counts as asked).
- Establish a canonical frame first, then redraw every other frame from it — keep the
  SAME hair, clothing, colors, proportions, accessories.
- The frames are a walk cycle: contact, down, passing, up.
- Every cell is a REAL redrawn frame — never a warped/scaled/rotated copy of one image.
- Place the character on a SOLID FLAT magenta (#FF00FF) background (NOT "transparent").
  Character centered in each cell, consistent size across cells.

## Layout metadata

`normalize`/`slice` emit `metadata.json` (`frame_count, cols, rows, cell, scale,
baseline_margin, anchor`) — feed it straight to your engine's spritesheet loader,
or to the `sprite-preview` tool for inspection.

## Preview GIF

```bash
python3 - walk <<'PY'
import sys, glob
from PIL import Image
slug = sys.argv[1]
frames = [Image.open(f) for f in sorted(glob.glob(f"{slug}/frames/frame_*.png"))]
frames[0].save(f"{slug}/{slug}_preview.gif", save_all=True,
               append_images=frames[1:], duration=120, loop=0, disposal=2)
PY
```

## Failure modes & cost

- `removebg` uses `rembg` if installed, else chroma-key (requires the solid-magenta prompt).
- Grid mismatch: `--frames/--cols` must match what Codex actually drew — count the cells.
- If Codex returns no new PNG, surface its message; don't silently retry.
- Every generation spends paid Codex quota — refine the prompt before re-firing.
