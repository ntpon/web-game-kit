"""slice subcommand: cut a grid sheet into tiles + metadata.json."""

import json
import os

from PIL import Image

from galib import grid


def slice_tiles(input_path, cols, rows, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    cell_w = img.width // cols
    cell_h = img.height // rows
    cells = grid.slice_sheet(img, cols, rows)

    tile_meta = []
    for idx, cell in enumerate(cells):
        fname = f"tile_{idx:03d}.png"
        cell.save(os.path.join(out_dir, fname))
        col, row = idx % cols, idx // cols
        tile_meta.append({"index": idx, "file": fname,
                          "x": col * cell_w, "y": row * cell_h})

    meta = {"source": os.path.basename(input_path),
            "cols": cols, "rows": rows,
            "cell_w": cell_w, "cell_h": cell_h,
            "count": len(tile_meta), "tiles": tile_meta}
    with open(os.path.join(out_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)
    return meta


def run(args):
    out_dir = args.out or os.path.join(
        os.path.dirname(os.path.abspath(args.input)),
        os.path.splitext(os.path.basename(args.input))[0] + "_tiles")
    meta = slice_tiles(args.input, args.cols, args.rows, out_dir)
    print(f"{meta['count']} tiles -> {out_dir}")
    return 0
