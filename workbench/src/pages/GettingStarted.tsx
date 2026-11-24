export default function GettingStarted() {
  return (
    <div className="page">
      <p className="eyebrow">web-game-kit</p>
      <h1 className="hero">
        Tune it by feel here. <b>Hand your AI the numbers.</b>
      </h1>
      <p className="lede">
        Tools and Claude Code skills for building web games with AI - extracted from building{' '}
        <a href="https://taladtaek.com">Taladtaek</a>, a 10-player online survival game. AI can set
        every number, but only you can tell when it feels right. Each tool here is where you find
        the right numbers - and each exports exactly the file your agent needs.
      </p>

      <h2>The workflow these tools come from</h2>
      <table>
        <tbody>
          <tr>
            <td>1 | design</td>
            <td>
              Fill in the <a href="#/design-doc">one-page design doc</a> before asking AI to write
              any code.
            </td>
          </tr>
          <tr>
            <td>2 | build</td>
            <td>
              Start from <code>starter/</code> - a walkable isometric scene where every number is a
              JSON file (see below).
            </td>
          </tr>
          <tr>
            <td>3 | art</td>
            <td>
              Generate game-ready assets with the <a href="#/assets-ai">AI asset workflow</a>, then
              catch broken animation in <a href="#/sprite-preview">Sprite preview</a>.
            </td>
          </tr>
          <tr>
            <td>4 | layout</td>
            <td>
              Place props and paint collision in the <a href="#/map-editor">Map editor</a>, export
              the layout as JSON.
            </td>
          </tr>
          <tr>
            <td>5 | feel</td>
            <td>
              Tune screen shake, hit-stop and particles in{' '}
              <a href="#/particle-juice">Particle juice</a>, copy the numbers into your game.
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
        <code>src/config/game.json</code> and <code>src/config/map.json</code> - edit while the dev
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
        A web game has no scene editor or Inspector - and that turns out to be an advantage in the
        AI era: the whole game is text. Terrain, item placement, collision shapes, animation frames,
        balance numbers - all of it is data an AI agent can read, edit, and verify. These tools
        exist to make that loop fast for humans too.
      </p>
    </div>
  );
}
