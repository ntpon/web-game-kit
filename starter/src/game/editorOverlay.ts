import Phaser from 'phaser';
import { MapEditor } from './mapEditor';
import { shapeCells, type MapData } from './mapTypes';
import { screenToTile, tileToScreen } from './isoProjection';

export interface EditorDeps {
  originX: number;
  originY: number;
  map: MapData;
  /** called after every edit so the scene can re-render items + collision */
  onChange: () => void;
}

/**
 * Dev-only map item editor: an iso grid over the map plus a DOM panel.
 * Click a tile to place the selected item (or remove what's there).
 * Save POSTs the whole map to the vite dev plugin, which writes
 * src/config/map.json — the page reloads on the map you just made.
 */
export class EditorOverlay {
  private editor: MapEditor;
  private graphics: Phaser.GameObjects.Graphics;
  private panel: HTMLDivElement;
  private countLabel!: HTMLSpanElement;
  private hoverTile: { x: number; y: number } | null = null;

  constructor(
    private scene: Phaser.Scene,
    private deps: EditorDeps,
  ) {
    const types = Object.keys(deps.map.itemTypes);
    this.editor = new MapEditor(deps.map, types[0] ?? 'item');
    this.graphics = scene.add.graphics().setDepth(99999);
    this.panel = this.buildPanel(types);

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.events.on('update', this.draw, this);
    scene.events.once('shutdown', () => this.destroy());
    scene.events.once('destroy', () => this.destroy());
  }

  private pointerTile(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const t = screenToTile(pointer.worldX, pointer.worldY, this.deps.originX, this.deps.originY);
    return { x: Math.floor(t.x), y: Math.floor(t.y) };
  }

  private inBounds(tile: { x: number; y: number }): boolean {
    const { width, height } = this.deps.map.grid;
    return tile.x >= 0 && tile.x < width && tile.y >= 0 && tile.y < height;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const target = pointer.event.target as HTMLElement | null;
    if (target?.closest?.('#map-editor-panel')) return;
    const tile = this.pointerTile(pointer);
    if (!this.inBounds(tile)) return;
    this.editor.toggle(tile.x, tile.y);
    this.refreshCount();
    this.deps.onChange();
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const tile = this.pointerTile(pointer);
    this.hoverTile = this.inBounds(tile) ? tile : null;
  }

  private draw(): void {
    const g = this.graphics;
    g.clear();
    const { width, height } = this.deps.map.grid;

    g.lineStyle(1, 0x00ffff, 0.12);
    for (let ty = 0; ty < height; ty += 1) {
      for (let tx = 0; tx < width; tx += 1) {
        this.strokeTile(g, tx, ty);
      }
    }

    // occupied tiles (orange), collision cells (red) + hover (white)
    g.fillStyle(0xffaa33, 0.25);
    for (const item of this.deps.map.items) {
      this.fillTile(g, Math.floor(item.x), Math.floor(item.y));
    }
    g.fillStyle(0xff3355, 0.2);
    for (const item of this.deps.map.items) {
      const def = this.deps.map.itemTypes[item.type];
      if (!def) continue;
      for (const [dx, dy] of shapeCells(def)) {
        this.fillTile(g, Math.floor(item.x) + dx, Math.floor(item.y) + dy);
      }
    }
    if (this.hoverTile) {
      g.fillStyle(0xffffff, 0.18);
      this.fillTile(g, this.hoverTile.x, this.hoverTile.y);
    }
  }

  private tileCorners(tx: number, ty: number): Phaser.Math.Vector2[] {
    const { originX, originY } = this.deps;
    return [
      tileToScreen(tx, ty, originX, originY),
      tileToScreen(tx + 1, ty, originX, originY),
      tileToScreen(tx + 1, ty + 1, originX, originY),
      tileToScreen(tx, ty + 1, originX, originY),
    ].map((p) => new Phaser.Math.Vector2(p.x, p.y));
  }

  private fillTile(g: Phaser.GameObjects.Graphics, tx: number, ty: number): void {
    g.fillPoints(this.tileCorners(tx, ty), true);
  }

  private strokeTile(g: Phaser.GameObjects.Graphics, tx: number, ty: number): void {
    g.strokePoints(this.tileCorners(tx, ty), true);
  }

  private refreshCount(): void {
    this.countLabel.textContent = `${this.editor.count(this.editor.selectedType)} placed | ${this.deps.map.items.length} total`;
  }

  private buildPanel(types: string[]): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'map-editor-panel';
    panel.style.cssText =
      'position:fixed;top:12px;right:12px;z-index:99999;background:#111d;color:#eee;' +
      'font:12px system-ui;padding:10px;border-radius:8px;width:200px;display:flex;' +
      'flex-direction:column;gap:6px;';

    const title = document.createElement('div');
    title.textContent = 'Map editor';
    title.style.fontWeight = 'bold';
    panel.appendChild(title);

    const typeSelect = document.createElement('select');
    for (const type of types) {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      typeSelect.appendChild(opt);
    }
    typeSelect.value = this.editor.selectedType;
    typeSelect.onchange = () => {
      this.editor.selectedType = typeSelect.value;
      this.refreshCount();
    };
    panel.appendChild(typeSelect);

    this.countLabel = document.createElement('span');
    panel.appendChild(this.countLabel);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save → src/config/map.json';
    saveBtn.onclick = () => {
      fetch('/__save-map', { method: 'POST', body: this.editor.toJSON() })
        .then((r) => {
          saveBtn.textContent = r.ok ? 'saved ✓' : 'save failed';
        })
        .catch(() => {
          saveBtn.textContent = 'save failed';
        });
    };
    panel.appendChild(saveBtn);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export JSON (copy)';
    exportBtn.onclick = () => navigator.clipboard?.writeText(this.editor.toJSON());
    panel.appendChild(exportBtn);

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import JSON (paste)';
    importBtn.onclick = () => {
      const text = window.prompt('Paste map or items JSON:');
      if (!text) return;
      try {
        this.editor.fromJSON(text);
        this.refreshCount();
        this.deps.onChange();
      } catch {
        importBtn.textContent = 'invalid JSON';
      }
    };
    panel.appendChild(importBtn);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear this type';
    clearBtn.onclick = () => {
      this.editor.clearType(this.editor.selectedType);
      this.refreshCount();
      this.deps.onChange();
    };
    panel.appendChild(clearBtn);

    const hint = document.createElement('div');
    hint.textContent = 'click tile: place / remove | WASD pans (moves the player)';
    hint.style.color = '#9aa0a8';
    panel.appendChild(hint);

    document.body.appendChild(panel);
    this.refreshCount();
    return panel;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.events.off('update', this.draw, this);
    this.graphics.destroy();
    this.panel.remove();
  }
}
