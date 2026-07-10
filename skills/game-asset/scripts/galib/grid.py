"""Grid math and sheet slicing shared by normalize/slice subcommands."""

import math
import warnings


def compute_grid(frame_count, cols):
    """Return (cols, rows) where rows is ceil(frame_count / cols)."""
    if cols < 1:
        raise ValueError("cols must be >= 1")
    rows = math.ceil(frame_count / cols)
    return cols, rows


def cell_box(idx, cols, cell_w, cell_h):
    """Return (left, upper, right, lower) pixel box of cell `idx`."""
    col, row = idx % cols, idx // cols
    x, y = col * cell_w, row * cell_h
    return (x, y, x + cell_w, y + cell_h)


def slice_sheet(img, cols, rows):
    """Cut `img` into cols*rows equal cells. Returns list of RGBA PIL Images."""
    img = img.convert("RGBA")
    if img.width % cols or img.height % rows:
        warnings.warn(
            f"sheet {img.width}x{img.height} not evenly divisible by {cols}x{rows} grid; "
            f"edge pixels will be truncated",
            stacklevel=2,
        )
    cell_w = img.width // cols
    cell_h = img.height // rows
    cells = []
    for idx in range(cols * rows):
        left, upper, right, lower = cell_box(idx, cols, cell_w, cell_h)
        cells.append(img.crop((left, upper, right, lower)))
    return cells
