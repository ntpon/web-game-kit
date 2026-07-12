import { useEffect, useRef, useState } from 'react';
import { shapeCells, type MapData } from './mapTypes';
import { tileToScreen, screenToTile, HALF_TILE_W, HALF_TILE_H } from './isoProjection';

// texture key → asset path (mirrors the starter's preload)
const TEXTURE_SRC: Record<string, string> = {
  'terrain-moss': 'assets/terrain/moss.webp',
  'terrain-paver': 'assets/terrain/paver.webp',
  'terrain-brick': 'assets/terrain/brick.webp',
  'prop-stall': 'assets/props/stall.webp',
  'prop-crates': 'assets/props/crates.webp',
  'prop-jar': 'assets/props/jar.webp',
  'prop-lantern': 'assets/props/lantern.webp',
};

const TERRAIN_DISPLAY = 154; // same overlap trick as the starter
const LIFT = 200; // world px above y=0 kept visible for tall props
const PAD = 12;

export type EditorMode = 'place' | 'collision';

export default function MapCanvas(props: {
  map: MapData;
  version: number;
  mode: EditorMode;
  selectedType: string;
  onTileClick: (tile: { x: number; y: number }) => void;
}) {
  const { map, version, mode, selectedType, onTileClick } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const [loadTick, setLoadTick] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ w: 760, h: 470 });

  // fill the space next to the panel — the map is the workspace, not a thumbnail
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.max(560, Math.min(1400, el.clientWidth));
      setSize({ w, h: Math.round(w * 0.62) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const W = size.w;
  const H = size.h;
  const worldW = (map.grid.width + map.grid.height) * HALF_TILE_W;
  const worldH = (map.grid.width + map.grid.height) * HALF_TILE_H;
  const scale = Math.min((W - PAD * 2) / worldW, (H - PAD * 2) / (worldH + LIFT));

  const toCanvas = (wx: number, wy: number) => ({
    x: W / 2 + wx * scale,
    y: PAD + (wy + LIFT) * scale,
  });
  const toWorld = (cx: number, cy: number) => ({
    x: (cx - W / 2) / scale,
    y: (cy - PAD) / scale - LIFT,
  });

  const image = (src: string): HTMLImageElement => {
    let img = imagesRef.current.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      img.onload = () => setLoadTick((t) => t + 1);
      imagesRef.current.set(src, img);
    }
    return img;
  };

  const tilePath = (ctx: CanvasRenderingContext2D, tx: number, ty: number) => {
    const corners = [
      tileToScreen(tx, ty, 0, 0),
      tileToScreen(tx + 1, ty, 0, 0),
      tileToScreen(tx + 1, ty + 1, 0, 0),
      tileToScreen(tx, ty + 1, 0, 0),
    ].map((p) => toCanvas(p.x, p.y));
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y);
    ctx.closePath();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // terrain
    map.terrain.forEach((row, y) => {
      [...row].forEach((symbol, x) => {
        const tile = map.legend[symbol];
        if (!tile) return;
        const img = image(TEXTURE_SRC[tile.texture] ?? '');
        if (!img.complete || img.naturalWidth === 0) return;
        const p = tileToScreen(x + 0.5, y + 0.5, 0, 0);
        const c = toCanvas(p.x, p.y);
        const cell = TERRAIN_DISPLAY * scale;
        ctx.drawImage(img, c.x - cell / 2, c.y - cell / 2, cell, cell);
      });
    });

    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.10)';
    for (let ty = 0; ty < map.grid.height; ty += 1) {
      for (let tx = 0; tx < map.grid.width; tx += 1) {
        tilePath(ctx, tx, ty);
        ctx.stroke();
      }
    }

    // item anchors (orange, place mode only)
    if (mode === 'place') {
      ctx.fillStyle = 'rgba(255, 170, 51, 0.18)';
      for (const item of map.items) {
        tilePath(ctx, Math.floor(item.x), Math.floor(item.y));
        ctx.fill();
      }
    }

    // collision cells: red for the selected type in collision mode,
    // grey for the rest, faint red everywhere in place mode
    for (const item of map.items) {
      const def = map.itemTypes[item.type];
      if (!def) continue;
      const selected = item.type === selectedType;
      ctx.fillStyle =
        mode === 'collision'
          ? selected
            ? 'rgba(255, 51, 85, 0.42)'
            : 'rgba(136, 136, 136, 0.22)'
          : 'rgba(255, 51, 85, 0.14)';
      for (const [dx, dy] of shapeCells(def)) {
        tilePath(ctx, Math.floor(item.x) + dx, Math.floor(item.y) + dy);
        ctx.fill();
      }
    }

    // spawn marker
    const spawnP = tileToScreen(map.spawn.x, map.spawn.y, 0, 0);
    const spawn = toCanvas(spawnP.x, spawnP.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y, 5, 0, Math.PI * 2);
    ctx.stroke();

    // items (painter's order)
    const sorted = [...map.items].sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const item of sorted) {
      const def = map.itemTypes[item.type];
      if (!def) continue;
      const p = tileToScreen(item.x, item.y, 0, 0);
      const c = toCanvas(p.x, p.y);
      const img = image(TEXTURE_SRC[def.texture] ?? '');
      if (img.complete && img.naturalWidth > 0) {
        const h = def.display * scale;
        const w = (h * img.naturalWidth) / img.naturalHeight;
        ctx.globalAlpha = mode === 'collision' ? 0.75 : 1;
        ctx.drawImage(img, c.x - w / 2, c.y - h * 0.85, w, h);
        ctx.globalAlpha = 1;
      } else {
        tilePath(ctx, Math.floor(item.x), Math.floor(item.y));
        ctx.fillStyle = 'rgba(255, 182, 72, 0.5)';
        ctx.fill();
        ctx.fillStyle = '#e8eaf0';
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.type, c.x, c.y);
      }
    }

    // hover highlight
    if (hover) {
      tilePath(ctx, hover.x, hover.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.fill();
    }
  }, [map, version, hover, loadTick, scale, mode, selectedType, W, H]);

  const pointerTile = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (W / rect.width);
    const cy = (e.clientY - rect.top) * (H / rect.height);
    const w = toWorld(cx, cy);
    const t = screenToTile(w.x, w.y, 0, 0);
    return { x: Math.floor(t.x), y: Math.floor(t.y) };
  };

  const inBounds = (t: { x: number; y: number }) =>
    t.x >= 0 && t.x < map.grid.width && t.y >= 0 && t.y < map.grid.height;

  return (
    <div ref={wrapRef} className="editor-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        onMouseMove={(e) => {
          const t = pointerTile(e);
          setHover(inBounds(t) ? t : null);
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const t = pointerTile(e);
          if (inBounds(t)) onTileClick(t);
        }}
      />
    </div>
  );
}
