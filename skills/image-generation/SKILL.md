---
name: image-generation
description: Generate images by delegating to the Codex CLI's built-in image_generation tool. Use whenever the user asks to generate, create, or iterate on any image, illustration, logo, mockup, icon, texture, sprite, concept art, or visual asset.
---

# image-generation — Codex-backed image generation for Claude Code

Claude has no image model of its own — asked to "draw", it produces code-drawn
vectors, which feel nothing like real art. This skill fixes that by shelling out
to the **Codex CLI**, whose built-in `image_generation` tool is backed by OpenAI's
image models. Requires: `codex` CLI installed and logged in (uses the user's
Codex/ChatGPT subscription — each run spends paid quota).

## How to invoke

```bash
cd <target-dir>   # cwd matters: this is where the file can land
codex exec --skip-git-repo-check -s workspace-write \
  "Use your image_generation tool to create the following image, save it to the relative path out/<name>.png inside this workspace, then confirm the saved path: <detailed prompt>"
```

Rules that keep it reliable:

1. **Always `-s workspace-write`** — the default sandbox can be read-only; Codex then
   generates the image but cannot save it to the host, and the PNG is lost.
2. **Always give an explicit relative save path** in the prompt (`out/foo.png`).
3. **Snapshot a timestamp before the run** and keep a fallback: Codex sometimes saves
   to `~/.codex/generated_images/<session-uuid>/ig_*.png` instead of the workspace.

```bash
TS=$(date +%s)
# ... run codex exec ...
NEWEST=$(find ~/.codex/generated_images -name 'ig_*.png' -newermt "@$TS" 2>/dev/null | head -1)
[ -f out/name.png ] || cp "$NEWEST" out/name.png
```

## Variations

Run `codex exec` once per option — each run yields a different image even with an
identical prompt. Copy out with numbered names (`concept-1.png`, `concept-2.png`).
Sequential runs are safer than parallel (parallel calls can race on the session dir).

## Reference image

`codex exec -i <ref.png> "<prompt>"` attaches an image; Codex redraws from it.
Use for keeping a character consistent across assets. If the output ignores the
reference, describe the reference in words instead and rerun.

## Cost discipline

Every call spends the user's Codex quota. Refine the prompt wording before
re-running rather than burning takes. Confirm variation counts with the user
before firing multiple runs.

## Failure modes

- **Hangs** — you forgot `exec` and opened the interactive TUI. Cancel, add `exec`.
- **"Not a git repository"** — add `--skip-git-repo-check`.
- **No new PNG anywhere** — surface Codex's own message to the user; don't silently retry.
- **Auth error** — the user must run `codex login` themselves.

For game-ready assets (transparent background, spritesheets, tilesets, icons at
multiple sizes) use the **game-asset** skill, which builds on this one.
