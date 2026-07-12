// Kept in sync with starter/src/game/mapEditor.ts (plus collision-shape ops,
// which follow the collision editor this tool was extracted from)
import { shapeCells, type MapData, type MapItem } from './mapTypes';

/**
 * Collision cells are a buffer zone AROUND an item — clicks farther than this
 * (Chebyshev distance) from the nearest instance are ignored. Without the cap,
 * a distant click stores a huge offset that every other instance of the type
 * re-applies, painting cells way off the map (and exporting invisible walls).
 */
export const MAX_SHAPE_REACH = 3;

/**
 * A clicked world tile expressed relative to the nearest placed instance of
 * an item type — so painted cells travel with every instance of that type.
 * Returns null when the click is too far from every instance to be a buffer.
 */
export function relativeCell(
  map: MapData,
  type: string,
  tileX: number,
  tileY: number,
): [number, number] | null {
  const anchors = map.items.filter((item) => item.type === type);
  if (anchors.length === 0) return null;
  let best = anchors[0];
  let bestDist = Infinity;
  for (const a of anchors) {
    const d = (Math.floor(a.x) - tileX) ** 2 + (Math.floor(a.y) - tileY) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  const dx = tileX - Math.floor(best.x);
  const dy = tileY - Math.floor(best.y);
  if (Math.max(Math.abs(dx), Math.abs(dy)) > MAX_SHAPE_REACH) return null;
  return [dx, dy];
}

/**
 * Pure editor model (no canvas, no DOM) — the page renders it, this owns
 * the data. Mutates map.items in place so the canvas sees every change.
 */
export class MapEditor {
  selectedType: string;

  constructor(
    private map: MapData,
    selectedType: string,
  ) {
    this.selectedType = selectedType;
  }

  private get items(): MapItem[] {
    return this.map.items;
  }

  indexAt(tileX: number, tileY: number): number {
    return this.items.findIndex(
      (item) => Math.floor(item.x) === tileX && Math.floor(item.y) === tileY,
    );
  }

  /** Click a tile: remove whatever is there, otherwise place the selected type. */
  toggle(tileX: number, tileY: number): 'placed' | 'removed' {
    const existing = this.indexAt(tileX, tileY);
    if (existing >= 0) {
      this.items.splice(existing, 1);
      return 'removed';
    }
    this.items.push({ type: this.selectedType, x: tileX + 0.5, y: tileY + 0.5 });
    return 'placed';
  }

  count(type: string): number {
    return this.items.filter((item) => item.type === type).length;
  }

  clearType(type: string): void {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (this.items[i].type === type) this.items.splice(i, 1);
    }
  }

  shapeOf(type: string): number[][] {
    const def = this.map.itemTypes[type];
    return def ? shapeCells(def) : [];
  }

  /** paint/erase one collision cell of a type (relative to its anchor tile) */
  toggleShapeCell(type: string, dx: number, dy: number): void {
    const def = this.map.itemTypes[type];
    if (!def) return;
    const cells = shapeCells(def).map((c) => [...c]);
    const i = cells.findIndex((c) => c[0] === dx && c[1] === dy);
    if (i >= 0) cells.splice(i, 1);
    else cells.push([dx, dy]);
    def.shape = cells;
  }

  clearShape(type: string): void {
    const def = this.map.itemTypes[type];
    if (def) def.shape = [];
  }

  /** The whole map (grid + legend + terrain + items) — what Export produces. */
  toJSON(): string {
    return `${JSON.stringify(this.map, null, 2)}\n`;
  }

  /** Accepts a full map JSON or a bare items array. */
  fromJSON(text: string): void {
    const parsed = JSON.parse(text) as Partial<MapData> | MapItem[];
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) throw new Error('no items array in JSON');
    this.items.splice(0, this.items.length, ...items);
  }
}
