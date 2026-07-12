// Kept in sync with starter/src/game/isoProjection.ts
export const HALF_TILE_W = 64;
export const HALF_TILE_H = 32;

export function tileToScreen(x: number, y: number, originX: number, originY: number) {
  return {
    x: originX + (x - y) * HALF_TILE_W,
    y: originY + (x + y) * HALF_TILE_H,
  };
}

export function screenToTile(sx: number, sy: number, originX: number, originY: number) {
  const a = (sx - originX) / HALF_TILE_W; // = x - y
  const b = (sy - originY) / HALF_TILE_H; // = x + y
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  };
}
