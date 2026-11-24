/**
 * particle-juice - tiny juice helpers for Phaser 4 (works on Phaser 3.60+ too).
 * TypeScript source; `juice.js` is the ready-to-copy plain build of this file.
 *
 * No dependencies, no image files: particle textures are generated in code.
 * Every effect cleans up after itself. Defaults are tuned - but feel is a human
 * job: open demo.html, drag sliders until it feels right, then Copy options JSON.
 *
 * MIT | part of web-game-kit
 */

type Scene = Phaser.Scene;
type SpriteLike = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

const TEX = 'juice-dot';

function ensureTexture(scene: Scene): void {
  if (scene.textures.exists(TEX)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(TEX, 8, 8);
  g.destroy();
}

interface BurstConfig extends Record<string, unknown> { count: number; lifespan: number; }

function burst(scene: Scene, x: number, y: number, opts: BurstConfig) {
  ensureTexture(scene);
  const { count, lifespan, ...config } = opts;
  const emitter = scene.add.particles(x, y, TEX, { lifespan, emitting: false, ...config });
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 100, () => emitter.destroy());
  return emitter;
}

export interface FloatTextOptions { color?: string; fontSize?: number; rise?: number; duration?: number; stroke?: string; }

/** Floating text that rises and fades ("+$50", "MISS!"). */
export function floatText(scene: Scene, x: number, y: number, text: string, opts: FloatTextOptions = {}) {
  const o = { color: '#ffffff', fontSize: 20, rise: 44, duration: 700, stroke: '#000000', ...opts };
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: o.fontSize + 'px', color: o.color,
    stroke: o.stroke, strokeThickness: 4,
  }).setOrigin(0.5, 1).setDepth(1000);
  scene.tweens.add({
    targets: t, y: y - o.rise, alpha: { from: 1, to: 0 },
    ease: 'Cubic.easeOut', duration: o.duration,
    onComplete: () => t.destroy(),
  });
  return t;
}

export interface ShakeOptions { duration?: number; intensity?: number; }

/** Camera shake - the classic "you got hit". intensity 0.001 subtle .. 0.05 earthquake. */
export function shake(scene: Scene, opts: ShakeOptions = {}): void {
  const o = { duration: 120, intensity: 0.01, ...opts };
  scene.cameras.main.shake(o.duration, o.intensity);
}

/** Hit-stop: freeze the scene for a few ms so an impact "lands". 40-60 subtle, 80-120 heavy. */
export function hitStop(scene: Scene & { __juiceHitStop?: boolean }, ms = 70): void {
  if (scene.__juiceHitStop) return;
  scene.__juiceHitStop = true;
  const prev = { time: scene.time.timeScale, tweens: scene.tweens.timeScale, anims: scene.anims.globalTimeScale };
  scene.time.timeScale = 0.001;
  scene.tweens.timeScale = 0.001;
  scene.anims.globalTimeScale = 0.001;
  setTimeout(() => {
    scene.time.timeScale = prev.time;
    scene.tweens.timeScale = prev.tweens;
    scene.anims.globalTimeScale = prev.anims;
    scene.__juiceHitStop = false;
  }, ms);
}

export interface FlashOptions { blinks?: number; interval?: number; }

/** Apply a solid white fill tint (Phaser 4 removed setTintFill; support both). */
function tintFill(target: SpriteLike): void {
  const P = (globalThis as { Phaser?: { TintModes?: { FILL: number; NORMAL?: number } } }).Phaser;
  const t = target as SpriteLike & { setTintMode?: (mode: number) => void };
  if (P?.TintModes && t.setTintMode) {
    t.setTint(0xffffff);
    t.setTintMode(P.TintModes.FILL);
  } else {
    (t as { setTintFill: (c: number) => void }).setTintFill(0xffffff);
  }
}

function tintClear(target: SpriteLike): void {
  target.clearTint();
  const P = (globalThis as { Phaser?: { TintModes?: { FILL: number; NORMAL?: number } } }).Phaser;
  const t = target as SpriteLike & { setTintMode?: (mode: number) => void };
  if (P?.TintModes && t.setTintMode) t.setTintMode(P.TintModes.NORMAL ?? 0);
}

/** White damage flash on a sprite (2 quick blinks). */
export function flash(target: SpriteLike, opts: FlashOptions = {}): void {
  const o = { blinks: 2, interval: 60, ...opts };
  const scene = target.scene;
  let n = 0;
  const timer = scene.time.addEvent({
    delay: o.interval, repeat: o.blinks * 2 - 1,
    callback: () => {
      n++;
      if (n % 2 === 1) tintFill(target);
      else tintClear(target);
    },
  });
  tintFill(target);
  scene.time.delayedCall(o.interval * (o.blinks * 2 + 1), () => { tintClear(target); timer.remove(); });
}

export interface SquashOptions { amount?: number; duration?: number; }

/** Squash & stretch - pickup / landing feedback. amount 0.15 subtle .. 0.4 cartoony. */
export function squash(target: SpriteLike, opts: SquashOptions = {}): void {
  const o = { amount: 0.25, duration: 90, ...opts };
  const scene = target.scene;
  const sx = target.scaleX, sy = target.scaleY;
  scene.tweens.add({
    targets: target,
    scaleX: sx * (1 + o.amount), scaleY: sy * (1 - o.amount),
    duration: o.duration, yoyo: true, ease: 'Quad.easeOut',
    onComplete: () => target.setScale(sx, sy),
  });
}

export interface PopOptions { overshoot?: number; duration?: number; }

/** Pop-in: spawn feedback (item appears, UI element enters). */
export function pop(target: SpriteLike, opts: PopOptions = {}): void {
  const o = { overshoot: 1.2, duration: 220, ...opts };
  const scene = target.scene;
  const sx = target.scaleX, sy = target.scaleY;
  target.setScale(0.01);
  scene.tweens.add({
    targets: target, scaleX: sx, scaleY: sy,
    ease: 'Back.easeOut', easeParams: [o.overshoot * 2.5],
    duration: o.duration,
  });
}

export interface BurstOptions { count?: number; tint?: number; lifespan?: number; }

/** Dust puffs under the feet while walking/running. */
export function dust(scene: Scene, x: number, y: number, opts: BurstOptions = {}) {
  const o = { count: 4, tint: 0xb9a98a, lifespan: 350, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: 15, max: 55 }, angle: { min: 220, max: 320 },
    scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 },
    gravityY: -40,
  });
}

/** Poof cloud - spawn/despawn smoke. */
export function poof(scene: Scene, x: number, y: number, opts: BurstOptions = {}) {
  const o = { count: 12, tint: 0xdddddd, lifespan: 500, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: 30, max: 90 }, scale: { start: 1.6, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}

export interface SparkOptions extends BurstOptions { speed?: number; }

/** Spark burst - pickup / critical hit. */
export function spark(scene: Scene, x: number, y: number, opts: SparkOptions = {}) {
  const o = { count: 14, tint: 0xffd75e, lifespan: 420, speed: 180, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: o.speed * 0.4, max: o.speed },
    scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
    gravityY: 300,
  });
}

export interface TrailOptions { tint?: number; frequency?: number; lifespan?: number; }
export interface TrailHandle { stop: () => void; }

/** Trail that follows a moving target (dash, projectile). Call .stop() when done. */
export function trail(scene: Scene, target: Phaser.GameObjects.GameObject, opts: TrailOptions = {}): TrailHandle {
  ensureTexture(scene);
  const o = { tint: 0x7ec8ff, frequency: 25, lifespan: 300, ...opts };
  const emitter = scene.add.particles(0, 0, TEX, {
    lifespan: o.lifespan, tint: o.tint, frequency: o.frequency,
    scale: { start: 0.8, end: 0 }, alpha: { start: 0.6, end: 0 },
    follow: target,
  });
  return {
    stop() {
      emitter.stop();
      scene.time.delayedCall(o.lifespan + 100, () => emitter.destroy());
    },
  };
}
