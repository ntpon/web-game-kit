import { useEffect, useRef, useState } from 'react';
import type { MapData } from './mapTypes';
import type { MapEditor } from './mapEditor';
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
const W = 640;
const H = 440;
const PAD = 10;

export default function MapCanvas(props: {
  map: MapData;
  editor: MapEditor;
  version: number;
  onEdit: () => void;
}) {
  const { map, editor, version, onEdit } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const [loadTick, setLoadTick] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

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
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
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
        const size = TERRAIN_DISPLAY * scale;
        ctx.drawImage(img, c.x - size / 2, c.y - size / 2, size, size);
      });
    });

    // grid + occupied tiles
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.10)';
    for (let ty = 0; ty < map.grid.height; ty += 1) {
      for (let tx = 0; tx < map.grid.width; tx += 1) {
        tilePath(ctx, tx, ty);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255, 170, 51, 0.18)';
    for (const item of map.items) {
      tilePath(ctx, Math.floor(item.x), Math.floor(item.y));
      ctx.fill();
    }

    // spawn marker
    const spawn = toCanvas(
      tileToScreen(map.spawn.x, map.spawn.y, 0, 0).x,
      tileToScreen(map.spawn.x, map.spawn.y, 0, 0).y,
    );
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
        ctx.drawImage(img, c.x - w / 2, c.y - h * 0.85, w, h);
      } else {
        tilePath(ctx, Math.floor(item.x), Math.floor(item.y));
        ctx.fillStyle = 'rgba(122, 184, 255, 0.5)';
        ctx.fill();
        ctx.fillStyle = '#e8e8e8';
        ctx.font = '10px system-ui';
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
  }, [map, version, hover, loadTick, scale]);

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
    <canvas
      ref={canvasRef}
      className="editor-canvas"
      style={{ width: W, height: H }}
      onMouseMove={(e) => {
        const t = pointerTile(e);
        setHover(inBounds(t) ? t : null);
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        const t = pointerTile(e);
        if (!inBounds(t)) return;
        editor.toggle(t.x, t.y);
        onEdit();
      }}
    />
  );
}
