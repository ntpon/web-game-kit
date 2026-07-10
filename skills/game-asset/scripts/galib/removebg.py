"""removebg subcommand: transparent background via rembg, an explicit key color, or auto chroma-key.

Three keying paths:
- `key=<color>` — remove a known background color (e.g. magenta) with a tight
  threshold. This is the reliable path: generate the asset on a SOLID flat color
  that the character never wears (magenta/green), then key exactly that. No risk
  of eating light skin/hair the way auto-keying a near-white background does.
- rembg (if installed) — ML matting.
- auto chroma-key — sample the corners; fallback when no key color is given.
"""

import os
import sys

from PIL import Image, ImageFilter

THRESHOLD = 60

NAMED_COLORS = {
    "magenta": (255, 0, 255),
    "green": (0, 177, 64),
    "white": (247, 247, 247),
    "black": (0, 0, 0),
}


def parse_color(s):
    """'magenta' | '#ff00ff' | 'ff00ff' -> (r,g,b)."""
    if s is None:
        return None
    s = s.strip().lower()
    if s in NAMED_COLORS:
        return NAMED_COLORS[s]
    h = s.lstrip("#")
    if len(h) == 6:
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    raise ValueError(f"unrecognized color: {s}")


def defringe(img):
    """Erode the alpha by 1px to kill the key-color halo ring left on soft edges."""
    img = img.convert("RGBA")
    eroded = img.getchannel("A").filter(ImageFilter.MinFilter(3))
    img.putalpha(eroded)
    return img


def key_color(img, color, threshold=THRESHOLD, do_defringe=True):
    """Make every pixel within `threshold` (RGB Euclidean) of `color` transparent."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    kr, kg, kb = color
    t2 = threshold * threshold
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if (r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2 <= t2:
                px[x, y] = (r, g, b, 0)
    if do_defringe:
        img = defringe(img)
    return img


def _bg_color(img):
    w, h = img.size
    corners = [img.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    r = sum(c[0] for c in corners) // 4
    g = sum(c[1] for c in corners) // 4
    b = sum(c[2] for c in corners) // 4
    return (r, g, b)


def chroma_key(img, threshold=THRESHOLD):
    """Auto path: sample the corner color and key it out."""
    img = img.convert("RGBA")
    return key_color(img, _bg_color(img), threshold, do_defringe=False)


def _rembg_available():
    try:
        import rembg  # noqa: F401
        return True
    except Exception:
        return False


def remove_background(input_path, out_path, method="auto", key=None, threshold=THRESHOLD):
    img = Image.open(input_path).convert("RGBA")
    if key is not None:
        out = key_color(img, parse_color(key), threshold)
    elif method in ("auto", "rembg") and _rembg_available():
        import rembg
        out = rembg.remove(img)
    else:
        if method == "rembg":
            print("warning: rembg not installed, falling back to chroma-key",
                  file=sys.stderr)
        out = chroma_key(img)
    out.save(out_path)
    return out_path


def run(args):
    out_path = args.out or (os.path.splitext(args.input)[0] + "_transparent.png")
    remove_background(args.input, out_path,
                      getattr(args, "method", "auto"),
                      getattr(args, "key", None),
                      getattr(args, "threshold", THRESHOLD))
    print(out_path)
    return 0
