import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react';
import GettingStarted from './pages/GettingStarted';
import MapEditorPage from './pages/MapEditorPage';
import ToolFramePage from './pages/ToolFramePage';
import AssetsAiPage from './pages/AssetsAiPage';
import DesignDocPage from './pages/DesignDocPage';
import { currentTheme, setTheme, subscribeTheme } from './theme';

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
        lede="The bundled 4-frame walk starts playing on open. Drop in your own AI-generated sheet and catch drift (swapped legs, size wobble, floating feet) the moment it moves."
        artifact="config JSON + verified sheet"
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
        lede="Fire each effect at the walking sprite and drag the sliders until your hands say it feels right. The helpers are copy-paste Phaser files: tools/particle-juice/juice.ts."
        artifact="juice options JSON"
        src="tools/particle-juice/demo.html"
      />
    ),
  },
];

function currentHash(): string {
  const h = window.location.hash || '#/';
  return ROUTES.some((r) => r.hash === h) ? h : '#/';
}

function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme);
  return (
    <div className="seg theme-seg" role="group" aria-label="Color theme">
      <button
        className={theme === 'light' ? 'on' : ''}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
      >
        ☀ Light
      </button>
      <button
        className={theme === 'dark' ? 'on' : ''}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
      >
        ☾ Dark
      </button>
    </div>
  );
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
          <div className="brandmark" />
          <div>
            <b>web-game-kit</b>
            <small>workbench</small>
          </div>
        </div>
        <div className="section">Learn</div>
        {nav('learn')}
        <div className="section">Tools</div>
        {nav('tools')}
        <ThemeToggle />
        <div className="foot">
          <a href="https://github.com/ntpon/web-game-kit">GitHub</a> | MIT license
        </div>
      </nav>
      <main className="content">{route.render()}</main>
    </div>
  );
}
