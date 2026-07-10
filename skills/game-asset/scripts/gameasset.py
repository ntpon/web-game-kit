#!/usr/bin/env python3
"""gameasset — deterministic post-processing for game assets."""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def _cmd_normalize(args):
    from galib import normalize
    return normalize.run(args)


def _cmd_removebg(args):
    from galib import removebg
    return removebg.run(args)


def _cmd_slice(args):
    from galib import tiles
    return tiles.run(args)


def _cmd_resize(args):
    from galib import resize
    return resize.run(args)


def build_parser():
    p = argparse.ArgumentParser(prog="gameasset",
                                description="Deterministic game-asset post-processing")
    sub = p.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("normalize", help="uniform-scale + anchor + slice a spritesheet")
    n.add_argument("input")
    n.add_argument("--frames", type=int, default=16)
    n.add_argument("--cols", type=int, default=4)
    n.add_argument("--out", default=None)
    n.add_argument("--chroma", action="store_true", help="auto chroma-key (sample corners) first")
    n.add_argument("--key", default=None,
                   help="key out an exact bg color first, e.g. magenta / green / #ff00ff")
    n.add_argument("--threshold", type=int, default=60, help="color-key tolerance")
    n.add_argument("--anchor", choices=["bbox", "feet"], default="feet",
                   help="feet = stable feet/legs anchor (good for attacks); bbox = bbox bottom-center")
    n.set_defaults(func=_cmd_normalize)

    r = sub.add_parser("removebg", help="make background transparent")
    r.add_argument("input")
    r.add_argument("--out", default=None)
    r.add_argument("--method", choices=["auto", "rembg", "chroma"], default="auto")
    r.add_argument("--key", default=None,
                   help="key out an exact bg color, e.g. magenta / green / #ff00ff")
    r.add_argument("--threshold", type=int, default=60, help="color-key tolerance")
    r.set_defaults(func=_cmd_removebg)

    s = sub.add_parser("slice", help="cut a grid sheet into tiles + metadata")
    s.add_argument("input")
    s.add_argument("--cols", type=int, required=True)
    s.add_argument("--rows", type=int, required=True)
    s.add_argument("--out", default=None)
    s.set_defaults(func=_cmd_slice)

    z = sub.add_parser("resize", help="write the image at several square sizes")
    z.add_argument("input")
    z.add_argument("--sizes", default="16,32,64,128")
    z.add_argument("--out", default=None)
    z.set_defaults(func=_cmd_resize)

    return p


def main(argv=None):
    args = build_parser().parse_args(argv)
    return args.func(args) or 0


if __name__ == "__main__":
    raise SystemExit(main())
