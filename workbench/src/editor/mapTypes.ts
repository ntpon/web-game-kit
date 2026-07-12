// Kept in sync with starter/src/game/mapTypes.ts
export type TerrainDef = Readonly<{ texture: string }>;

export type ItemTypeDef = {
  texture: string;
  /** display height in screen pixels; width scales proportionally */
  display: number;
  /** blocking items occupy their tile for movement collision */
  blocking: boolean;
  /**
   * collision cells relative to the item's anchor tile, e.g. [[0,0],[-1,0]]
   * for a wide base. Omitted = the anchor tile when blocking, none otherwise.
   */
  shape?: number[][];
};

/** the tiles (relative to the anchor) this item type blocks */
export function shapeCells(def: ItemTypeDef): number[][] {
  if (def.shape) return def.shape;
  return def.blocking ? [[0, 0]] : [];
}

export type MapItem = { type: string; x: number; y: number };

export type MapData = {
  name: string;
  grid: { width: number; height: number };
  legend: Record<string, TerrainDef>;
  itemTypes: Record<string, ItemTypeDef>;
  terrain: string[];
  items: MapItem[];
  spawn: { x: number; y: number };
};
