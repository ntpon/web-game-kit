import { useEffect, useRef } from 'react';
import { bootGame } from './game/boot';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const game = bootGame(mountRef.current);
    return () => game.destroy(true);
  }, []);

  const editing = new URLSearchParams(window.location.search).has('edit');

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 12 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <strong>web-game-starter</strong>
        <span>
          arrows / WASD to move · Shift to sprint ·{' '}
          {editing ? (
            <a href="./" style={{ color: '#ffb648' }}>
              exit edit mode
            </a>
          ) : (
            <a href="?edit=1" style={{ color: '#ffb648' }}>
              edit the map
            </a>
          )}
        </span>
      </header>
      <div ref={mountRef} style={{ marginTop: 10 }} />
      <p style={{ color: '#8b90a0' }}>
        Every number lives in <code>src/config/*.json</code> — edit while <code>pnpm dev</code> runs
        and the page reloads on your change. Part of web-game-kit · by{' '}
        <a href="https://ntpon.com" style={{ color: '#8b90a0' }}>
          Nattapon Suetrong
        </a>
        .
      </p>
    </div>
  );
}
