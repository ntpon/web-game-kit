import Phaser from 'phaser';
import gameConfig from '../config/game.json';
import mapJson from '../config/map.json';
import { tileToScreen } from './isoProjection';
import { moveActor, type Blocker } from './movement';
import type { MapData } from './mapTypes';
import { EditorOverlay } from './editorOverlay';

// Terrain art is a 313x313 diamond drawn slightly larger than the 128x64
// logical tile so neighbours overlap and no seams show (same trick Taladtaek uses).
const TERRAIN_DISPLAY = 154;
const ORIGIN_X = 0;
const ORIGIN_Y = 0;
const WALK_FRAME_SIZE = 256;

type MoveKeys = Record<
  'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SHIFT',
  Phaser.Input.Keyboard.Key
>;

export class DemoScene extends Phaser.Scene {
  private map = mapJson as MapData;
  private player!: Phaser.GameObjects.Sprite;
  private position = { x: 0, y: 0 };
  private keys!: MoveKeys;
  private itemImages: Phaser.GameObjects.Image[] = [];
  private blockers: Blocker[] = [];

  constructor() {
    super('demo');
  }

  preload(): void {
    this.load.image('terrain-moss', 'assets/terrain/moss.webp');
    this.load.image('terrain-paver', 'assets/terrain/paver.webp');
    this.load.image('terrain-brick', 'assets/terrain/brick.webp');
    this.load.image('prop-stall', 'assets/props/stall.webp');
    this.load.image('prop-crates', 'assets/props/crates.webp');
    this.load.image('prop-jar', 'assets/props/jar.webp');
    this.load.image('prop-lantern', 'assets/props/lantern.webp');
    this.load.spritesheet('vendor-walk', 'assets/characters/vendor-walk.png', {
      frameWidth: WALK_FRAME_SIZE,
      frameHeight: WALK_FRAME_SIZE,
    });
  }

  create(): void {
    this.drawTerrain();
    this.refreshItems();

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('vendor-walk', { start: 0, end: 3 }),
      frameRate: gameConfig.animation.walkFrameRate,
      repeat: -1,
    });

    this.position = { ...this.map.spawn };
    const spawn = this.iso(this.position.x, this.position.y);
    this.player = this.add
      .sprite(spawn.x, spawn.y, 'vendor-walk', 0)
      .setOrigin(0.5, 0.92)
      .setScale(gameConfig.player.displayHeight / WALK_FRAME_SIZE)
      .setDepth(spawn.y);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT') as unknown as MoveKeys;

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(gameConfig.camera.zoom);

    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('edit')) {
      new EditorOverlay(this, {
        originX: ORIGIN_X,
        originY: ORIGIN_Y,
        map: this.map,
        onChange: () => this.refreshItems(),
      });
    }
  }

  private iso(x: number, y: number): { x: number; y: number } {
    return tileToScreen(x, y, ORIGIN_X, ORIGIN_Y);
  }

  private drawTerrain(): void {
    this.map.terrain.forEach((row, y) => {
      [...row].forEach((symbol, x) => {
        const tile = this.map.legend[symbol];
        if (!tile) return;
        const point = this.iso(x + 0.5, y + 0.5);
        this.add
          .image(point.x, point.y, tile.texture)
          .setDisplaySize(TERRAIN_DISPLAY, TERRAIN_DISPLAY)
          .setOrigin(0.5)
          .setDepth(-10000 + point.y);
      });
    });
  }

  /** Re-render items and rebuild collision from map.items (editor calls this too). */
  refreshItems(): void {
    for (const image of this.itemImages) image.destroy();
    this.itemImages = [];
    this.blockers = [];
    for (const item of this.map.items) {
      const def = this.map.itemTypes[item.type];
      if (!def) continue;
      const point = this.iso(item.x, item.y);
      const image = this.add
        .image(point.x, point.y, def.texture)
        .setOrigin(0.5, 0.85)
        .setDepth(point.y);
      image.setScale(def.display / image.height);
      this.itemImages.push(image);
      if (def.blocking) {
        this.blockers.push({ x: item.x - 0.5, y: item.y - 0.5, width: 1, height: 1 });
      }
    }
  }

  update(_time: number, deltaMs: number): void {
    const intent = this.readIntent();
    const moving = intent.x !== 0 || intent.y !== 0;

    if (moving) {
      const speed = this.keys.SHIFT.isDown
        ? gameConfig.player.sprintSpeed
        : gameConfig.player.walkSpeed;
      this.position = moveActor(
        this.position,
        intent,
        deltaMs / 1000,
        {
          width: this.map.grid.width,
          height: this.map.grid.height,
          blockers: this.blockers,
        },
        { unitsPerSecond: speed, actorRadius: gameConfig.player.actorRadius },
      );
      if (intent.screenX !== 0) this.player.setFlipX(intent.screenX < 0);
      this.player.anims.play('walk', true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(0);
    }

    const point = this.iso(this.position.x, this.position.y);
    this.player.setPosition(point.x, point.y).setDepth(point.y);
  }

  /** Screen-axis input (arrows/WASD) → isometric tile axes. */
  private readIntent(): { x: number; y: number; screenX: number } {
    const left = this.keys.LEFT.isDown || this.keys.A.isDown;
    const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
    const up = this.keys.UP.isDown || this.keys.W.isDown;
    const down = this.keys.DOWN.isDown || this.keys.S.isDown;
    const horizontal = (right ? 1 : 0) - (left ? 1 : 0);
    const vertical = (down ? 1 : 0) - (up ? 1 : 0);
    const length = Math.hypot(horizontal, vertical);
    if (length === 0) return { x: 0, y: 0, screenX: 0 };
    const screenX = horizontal / length;
    const screenY = vertical / length;
    return {
      x: screenY + screenX * 0.5,
      y: screenY - screenX * 0.5,
      screenX,
    };
  }
}
