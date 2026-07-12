export default function AssetsAiPage() {
  return (
    <div className="page">
      <h1>AI asset workflow</h1>
      <p className="lede">
        The kit ships two Claude Code skills that give Claude real image-generation hands by
        delegating to the Codex CLI — plus a deterministic CLI that makes the output game-ready.
      </p>

      <h2>Install</h2>
      <pre>
        <code>{`cp -R skills/image-generation skills/game-asset ~/.claude/skills/
python3 -m pip install -r skills/game-asset/scripts/requirements.txt
# requires the Codex CLI installed and logged in (codex login)`}</code>
      </pre>
      <p>
        Restart your Claude Code session, then ask for a sprite, tileset, icon, or background — the
        skills trigger on their own.
      </p>

      <h2>The two principles the skills encode</h2>
      <table>
        <tbody>
          <tr>
            <td>Magenta key</td>
            <td>
              Image models cannot produce real alpha transparency — ask for a transparent background
              and you get an opaque near-white fill that eats light skin and hair when keyed. So the
              skills generate on solid flat magenta (#FF00FF) and key exactly that color out.
            </td>
          </tr>
          <tr>
            <td>AI draws, code cuts</td>
            <td>
              AI is good at drawing and bad at pixel-exact edges. Let the model paint, then let the
              CLI do the deterministic part: slicing sheets, uniform scale, anchoring feet, emitting
              layout JSON your game can load.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Verify before it hits the game</h2>
      <p>
        Every generated spritesheet goes through <a href="#/sprite-preview">Sprite preview</a>{' '}
        first: play it, step frames, onion-skin, and check the baseline. Swapped legs and size
        wobble are obvious in half a second there — and invisible in a folder of stills.
      </p>
    </div>
  );
}
