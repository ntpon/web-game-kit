export default function GettingStarted() {
  return (
    <div className="page">
      <h1>web-game-kit</h1>
      <p className="lede">
        Tools and Claude Code skills for building web games with AI — extracted from building{' '}
        <a href="https://taladtaek.com">Taladtaek</a>, a 10-player online survival game. Everything
        here is small, self-contained, and MIT.
      </p>

      <h2>The workflow these tools come from</h2>
      <table>
        <tbody>
          <tr>
            <td>1. Design</td>
            <td>
              Fill in the <a href="#/design-doc">one-page design doc</a> before asking AI to write
              any code.
            </td>
          </tr>
          <tr>
            <td>2. Build</td>
            <td>
              Start from <code>starter/</code> — a walkable isometric scene where every number is a
              JSON file (see below).
            </td>
          </tr>
          <tr>
            <td>3. Art</td>
            <td>
              Generate game-ready assets with the <a href="#/assets-ai">AI asset workflow</a>, then
              catch broken animation in <a href="#/sprite-preview">Sprite preview</a>.
            </td>
          </tr>
          <tr>
            <td>4. Layout</td>
            <td>
              Place props with the <a href="#/map-editor">Map editor</a> and export the layout as
              JSON.
            </td>
          </tr>
          <tr>
            <td>5. Feel</td>
            <td>
              Tune screen shake, hit-stop and particles in <a href="#/particle-juice">Particle
              juice</a>, copy the numbers into your game.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Run the starter</h2>
      <pre>
        <code>{`git clone https://github.com/ntpon/web-game-kit
cd web-game-kit/starter
pnpm install
pnpm dev        # walkable demo → http://localhost:5173
                # add ?edit=1 for the in-game map editor`}</code>
      </pre>
      <p>
        Arrows / WASD to move, Shift to sprint. All tuning lives in{' '}
        <code>src/config/game.json</code> and <code>src/config/map.json</code> — edit while the dev
        server runs and the page reloads on your change.
      </p>

      <h2>Run this workbench locally</h2>
      <pre>
        <code>{`cd web-game-kit/workbench
pnpm install
pnpm dev`}</code>
      </pre>

      <h2>Why JSON everywhere</h2>
      <p>
        A web game has no scene editor or Inspector — and that turns out to be an advantage in the
        AI era: the whole game is text. Terrain, item placement, animation frames, balance numbers —
        all of it is data an AI agent can read, edit, and verify. These tools exist to make that
        loop fast for humans too.
      </p>
    </div>
  );
}
