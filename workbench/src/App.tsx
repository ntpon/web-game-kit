import { useEffect, useState, type ReactElement } from 'react';
import GettingStarted from './pages/GettingStarted';
import MapEditorPage from './pages/MapEditorPage';
import ToolFramePage from './pages/ToolFramePage';
import AssetsAiPage from './pages/AssetsAiPage';
import DesignDocPage from './pages/DesignDocPage';

type Route = {
  hash: string;
  label: string;
  section: 'learn' | 'tools';
  render: () => ReactElement;
};

const ROUTES: Route[] = [
  { hash: '#/', label: 'Getting started', section: 'learn', render: () => <GettingStarted /> },
  { hash: '#/design-doc', label: 'Design doc template', section: 'learn', render: () => <DesignDocPage /> },
  { hash: '#/assets-ai', label: 'AI asset workflow', section: 'learn', render: () => <AssetsAiPage /> },
  { hash: '#/map-editor', label: 'Map editor', section: 'tools', render: () => <MapEditorPage /> },
  {
    hash: '#/sprite-preview',
    label: 'Sprite preview',
    section: 'tools',
    render: () => (
      <ToolFramePage
        title="Sprite preview"
        lede="Drop in an AI-generated spritesheet and catch drift (swapped legs, size wobble, floating feet) before it hits your game. Try the bundled sample: tools/sprite-preview/sample/walk.png."
        src="tools/sprite-preview/index.html"
      />
    ),
  },
  {
    hash: '#/particle-juice',
    label: 'Particle juice',
    section: 'tools',
    render: () => (
      <ToolFramePage
        title="Particle juice"
        lede="Fire each effect, drag the sliders until it feels right, then Copy options JSON into your game. The helpers are copy-paste files for Phaser: tools/particle-juice/juice.ts."
        src="tools/particle-juice/demo.html"
      />
    ),
  },
];

function currentHash(): string {
  const h = window.location.hash || '#/';
  return ROUTES.some((r) => r.hash === h) ? h : '#/';
}

export default function App() {
  const [hash, setHash] = useState(currentHash);

  useEffect(() => {
    const onChange = () => setHash(currentHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const route = ROUTES.find((r) => r.hash === hash) ?? ROUTES[0];

  const nav = (section: Route['section']) =>
    ROUTES.filter((r) => r.section === section).map((r) => (
      <a key={r.hash} className={`nav${r.hash === hash ? ' active' : ''}`} href={r.hash}>
        {r.label}
      </a>
    ));

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">
          web-game-kit
          <small>workbench</small>
        </div>
        <div className="section">Learn</div>
        {nav('learn')}
        <div className="section">Tools</div>
        {nav('tools')}
        <div className="foot">
          MIT · by <a href="https://ntpon.com">Nattapon Suetrong</a>
          <br />
          <a href="https://github.com/ntpon/web-game-kit">GitHub</a>
        </div>
      </nav>
      <main className="content">{route.render()}</main>
    </div>
  );
}
