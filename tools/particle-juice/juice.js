/**
 * particle-juice - tiny juice helpers for Phaser 4 (works on Phaser 3.60+ too).
 *
 * Copy this one file into your game. No dependencies, no image files:
 * particle textures are generated in code on first use.
 *
 * Every effect cleans up after itself (no leaked tweens/emitters/timers).
 * Every option has a tuned default - but feel is a human job: open demo.html,
 * drag the sliders until it feels right, then Copy options JSON.
 *
 * MIT | part of web-game-kit
 */

const TEX = 'juice-dot';

/** Ensure the shared 8x8 white dot texture exists (tinted per effect). */
function ensureTexture(scene) {
  if (scene.textures.exists(TEX)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(TEX, 8, 8);
  g.destroy();
}

/** One-shot particle burst; destroys its emitter automatically. */
function burst(scene, x, y, opts) {
  ensureTexture(scene);
  const { count, lifespan, ...config } = opts;
  const emitter = scene.add.particles(x, y, TEX, { lifespan, emitting: false, ...config });
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 100, () => emitter.destroy());
  return emitter;
}

/**
 * Floating text that rises and fades ("+$50", "MISS!").
 * @param {Phaser.Scene} scene
 * @param {number} x @param {number} y
 * @param {string} text
 * @param {{color?:string, fontSize?:number, rise?:number, duration?:number, stroke?:string}} [opts]
 */
export function floatText(scene, x, y, text, opts = {}) {
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

/**
 * Camera shake - the classic "you got hit".
 * @param {Phaser.Scene} scene
 * @param {{duration?:number, intensity?:number}} [opts] intensity 0.001 (subtle) .. 0.05 (earthquake)
 */
export function shake(scene, opts = {}) {
  const o = { duration: 120, intensity: 0.01, ...opts };
  scene.cameras.main.shake(o.duration, o.intensity);
}

/**
 * Hit-stop: freeze the whole scene for a few milliseconds so an impact "lands".
 * Uses real time to recover, so it works even while the scene is frozen.
 * @param {Phaser.Scene} scene
 * @param {number} [ms=70] 40-60 subtle, 80-120 heavy
 */
export function hitStop(scene, ms = 70) {
  if (scene.__juiceHitStop) return; // don't stack freezes
  scene.__juiceHitStop = true;
  const prev = {
    time: scene.time.timeScale,
    tweens: scene.tweens.timeScale,
    anims: scene.anims.globalTimeScale,
  };
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

/** Apply a solid white fill tint (Phaser 4 removed setTintFill; support both). */
function tintFill(target) {
  if (typeof Phaser !== 'undefined' && Phaser.TintModes && target.setTintMode) {
    target.setTint(0xffffff);
    target.setTintMode(Phaser.TintModes.FILL);
  } else {
    target.setTintFill(0xffffff);
  }
}

function tintClear(target) {
  target.clearTint();
  if (typeof Phaser !== 'undefined' && Phaser.TintModes && target.setTintMode) {
    target.setTintMode(Phaser.TintModes.NORMAL ?? 0);
  }
}

/**
 * White damage flash on a sprite (2 quick blinks).
 * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} target
 * @param {{blinks?:number, interval?:number}} [opts]
 */
export function flash(target, opts = {}) {
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

/**
 * Squash & stretch - pickup / landing feedback.
 * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} target
 * @param {{amount?:number, duration?:number}} [opts] amount 0.15 subtle .. 0.4 cartoony
 */
export function squash(target, opts = {}) {
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

/**
 * Pop-in: spawn feedback (item appears, UI element enters).
 * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} target
 * @param {{overshoot?:number, duration?:number}} [opts]
 */
export function pop(target, opts = {}) {
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

/**
 * Dust puffs under the feet while walking/running.
 * @param {Phaser.Scene} scene @param {number} x @param {number} y
 * @param {{count?:number, tint?:number, lifespan?:number}} [opts]
 */
export function dust(scene, x, y, opts = {}) {
  const o = { count: 4, tint: 0xb9a98a, lifespan: 350, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: 15, max: 55 }, angle: { min: 220, max: 320 },
    scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 },
    gravityY: -40,
  });
}

/**
 * Poof cloud - spawn/despawn smoke.
 * @param {Phaser.Scene} scene @param {number} x @param {number} y
 * @param {{count?:number, tint?:number, lifespan?:number}} [opts]
 */
export function poof(scene, x, y, opts = {}) {
  const o = { count: 12, tint: 0xdddddd, lifespan: 500, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: 30, max: 90 }, scale: { start: 1.6, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}

/**
 * Spark burst - pickup / critical hit.
 * @param {Phaser.Scene} scene @param {number} x @param {number} y
 * @param {{count?:number, tint?:number, lifespan?:number, speed?:number}} [opts]
 */
export function spark(scene, x, y, opts = {}) {
  const o = { count: 14, tint: 0xffd75e, lifespan: 420, speed: 180, ...opts };
  return burst(scene, x, y, {
    count: o.count, lifespan: o.lifespan, tint: o.tint,
    speed: { min: o.speed * 0.4, max: o.speed },
    scale: { start: 0.7, end: 0 }, alpha: { start: 1, end: 0 },
    gravityY: 300,
  });
}

/**
 * Trail that follows a moving target (dash, projectile). Returns a handle.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.GameObject} target
 * @param {{tint?:number, frequency?:number, lifespan?:number}} [opts]
 * @returns {{stop: () => void}} call stop() when the dash ends
 */
export function trail(scene, target, opts = {}) {
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
