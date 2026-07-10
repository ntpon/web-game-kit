"""resize subcommand: write an image at several square sizes."""

import os

from PIL import Image


def parse_sizes(text):
    return [int(s) for s in text.split(",") if s.strip()]


def resize_image(input_path, sizes, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(input_path).convert("RGBA")
    stem = os.path.splitext(os.path.basename(input_path))[0]
    paths = []
    for s in sizes:
        resized = img.resize((s, s), Image.LANCZOS)
        out_path = os.path.join(out_dir, f"{stem}_{s}.png")
        resized.save(out_path)
        paths.append(out_path)
    return paths


def run(args):
    out_dir = args.out or os.path.dirname(os.path.abspath(args.input))
    paths = resize_image(args.input, parse_sizes(args.sizes), out_dir)
    for p in paths:
        print(p)
    return 0
