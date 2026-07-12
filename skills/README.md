# skills

Claude Code skills that give Claude real image-generation hands by delegating to
the Codex CLI. Mentioned in the article: "build a skill that lets Claude hand
image work to Codex" — these are those skills.

| Skill | What it does |
|---|---|
| [`image-generation/`](image-generation/SKILL.md) | any image via Codex's built-in image model — reliable save paths, variations, cost discipline |
| [`game-asset/`](game-asset/SKILL.md) | game-ready art: magenta-key transparency, spritesheet slicing/normalizing with layout metadata (builds on image-generation) |

## Requirements

- Claude Code + the Codex CLI installed and logged in (`codex login`) —
  image generation runs on your Codex/ChatGPT subscription
- Python 3 + Pillow for the game-asset post-processing CLI
  (`python3 -m pip install -r game-asset/scripts/requirements.txt`)

## Install

Copy each skill folder into your skills directory:

```bash
cp -R image-generation game-asset ~/.claude/skills/
```

Restart your Claude Code session — then ask for an image or a spritesheet and the
skills trigger on their own.

Pair with the kit's `tools/sprite-preview/` to eyeball every AI-generated
animation before it enters your game.

MIT · part of [web-game-kit](https://github.com/ntpon/web-game-kit)
