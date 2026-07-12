// Kept in sync with starter/src/game/mapTypes.ts
export type TerrainDef = Readonly<{ texture: string }>;

export type ItemTypeDef = Readonly<{
  texture: string;
  /** display height in screen pixels; width scales proportionally */
  display: number;
  /** blocking items occupy their tile for movement collision */
  blocking: boolean;
}>;

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
