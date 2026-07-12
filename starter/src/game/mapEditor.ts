import type { MapData, MapItem } from './mapTypes';

/**
 * Pure editor model (no Phaser, no DOM) — the overlay renders it, this owns
 * the data. Mutates map.items in place so the running scene sees every change.
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

  /** The whole map (grid + legend + terrain + items) — what Save writes back. */
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
