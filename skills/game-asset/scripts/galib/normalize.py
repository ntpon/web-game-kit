"""normalize subcommand: uniform-scale + stable-anchor a redrawn spritesheet.

Guardrail (ported from an earlier project's spritesheet generation policy):
- ONE global uniform scale for all frames (never per-frame, never non-uniform),
  bound to the largest single content dimension so nothing overflows the cell.
- Anchor every frame to a stable reference so the character stays in place.

Anchor modes:
- "bbox" — bottom-center of the content bounding box. Good for walk/idle where
  the silhouette is stable.
- "feet" — the horizontal centroid of the character's feet/legs and the bottom of
  the *substantial* body (thin protrusions like a swung sword are ignored). Use
  for attacks, where a weapon extends the bbox and bottom-center anchoring makes
  the feet slide and float.
"""

import json
import math
import os

from PIL import Image

from galib import grid
from galib.removebg import chroma_key, key_color, parse_color

TARGET = 256
BASELINE_MARGIN = 8
CONTENT_MAX_FRAC = 0.92


def _feet_point(content):
    """Return (feet_x, feet_y) in content coords: centroid of the feet band and the
    bottom of the substantial body, ignoring thin protrusions (e.g. a sword tip)."""
    a = content.getchannel("A")
    w, h = content.size
    px = a.load()
    widths = [sum(1 for x in range(w) if px[x, y] > 10) for y in range(h)]
    # "body" threshold is relative to the content HEIGHT, not the single widest row.
    # The old `30% of max-width` rule broke on attack frames: a swung energy arc /
    # flared dress / flying hair made one row very wide, inflating the threshold so
    # the (naturally narrow) legs fell below it and were dropped — the feet line was
    # detected at the hip and the real legs were pushed off the cell bottom (clipped).
    # A height-relative floor keeps legs/feet in while still rejecting a thin sword
    # tip or stray VFX speck.
    thr = max(4, int(h * 0.10))
    body_rows = [y for y in range(h) if widths[y] >= thr]
    if not body_rows:
        bb = content.getbbox() or (0, 0, w, h)
        return ((bb[0] + bb[2]) // 2, bb[3])
    feet_y = max(body_rows)
    band = max(1, int(h * 0.12))
    xs = [x for y in range(max(0, feet_y - band), feet_y + 1)
          for x in range(w) if px[x, y] > 10]
    fx = sum(xs) // len(xs) if xs else w // 2
    return (fx, feet_y + 1)


def normalize_sheet(input_path, frames, cols, out_dir, chroma=False, key=None, anchor="bbox"):
    os.makedirs(out_dir, exist_ok=True)
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    img = Image.open(input_path).convert("RGBA")
    if key is not None:
        img = key_color(img, parse_color(key))
    elif chroma:
        img = chroma_key(img)

    rows = math.ceil(frames / cols)
    cells = grid.slice_sheet(img, cols, rows)[:frames]
    boxes = [c.getbbox() for c in cells]

    # one global uniform scale, bound to the largest content dimension across all
    # frames so nothing overflows a cell (same scale in both anchor modes).
    dims = [max(b[2] - b[0], b[3] - b[1]) for b in boxes if b]
    max_dim = max(dims) if dims else TARGET
    scale = (CONTENT_MAX_FRAC * TARGET) / max_dim

    out_frames = []
    for cell, box in zip(cells, boxes):
        canvas = Image.new("RGBA", (TARGET, TARGET), (0, 0, 0, 0))
        if box:
            content = cell.crop(box)
            nw = max(1, round(content.width * scale))
            nh = max(1, round(content.height * scale))
            content = content.resize((nw, nh), Image.LANCZOS)
            if anchor == "feet":
                fx, fy = _feet_point(content)
                # paste() allows negative offsets (clips); alpha_composite does not.
                canvas.paste(content, (TARGET // 2 - fx, (TARGET - BASELINE_MARGIN) - fy), content)
            else:
                x = (TARGET - nw) // 2
                y = TARGET - BASELINE_MARGIN - nh
                canvas.alpha_composite(content, (x, y))
        out_frames.append(canvas)

    for idx, frame in enumerate(out_frames):
        frame.save(os.path.join(frames_dir, f"frame_{idx:03d}.png"))

    sheet = Image.new("RGBA", (cols * TARGET, rows * TARGET), (0, 0, 0, 0))
    for idx, frame in enumerate(out_frames):
        col, row = idx % cols, idx // cols
        sheet.alpha_composite(frame, (col * TARGET, row * TARGET))
    sheet.save(os.path.join(out_dir, "sheet.png"))

    meta = {"source": os.path.basename(input_path),
            "frame_count": len(out_frames),
            "cols": cols, "rows": rows, "cell": TARGET,
            "scale": round(scale, 5),
            "baseline_margin": BASELINE_MARGIN,
            "anchor": anchor,
            "policy": "uniform_scale_bottom_center_anchor"}
    with open(os.path.join(out_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
    return meta


def run(args):
    out_dir = args.out or os.path.join(
        os.path.dirname(os.path.abspath(args.input)),
        os.path.splitext(os.path.basename(args.input))[0] + "_normalized")
    meta = normalize_sheet(args.input, args.frames, args.cols, out_dir,
                           getattr(args, "chroma", False),
                           getattr(args, "key", None),
                           getattr(args, "anchor", "bbox"))
    print(f"{meta['frame_count']} frames (scale={meta['scale']}, anchor={meta['anchor']}) -> {out_dir}")
    return 0
