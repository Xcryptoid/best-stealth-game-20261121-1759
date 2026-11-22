// The thief: keyboard movement, sneak, and click-to-move.
// Running is fast and loud; sneaking is slow and quiet; walking sits
// between. Noise is a radius: a guard inside it hears the step.
import { TILE, TUNE, PLAYER_START } from './config.js';
import { moveCircle, pointInShadow } from './level.js';

export function makePlayer() {
  return {
    x: PLAYER_START.x * TILE,
    y: PLAYER_START.y * TILE,
    radius: TUNE.playerRadius,
    sneaking: false,
    running: false,
    noise: 0,
    moving: false,
    facing: -Math.PI / 2,
    clickTarget: null,
    stepTimer: 0,
    inShadow: false,
  };
}

export function updatePlayer(player, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  // A mouse click sets a walk target; any key cancels it.
  if (mx !== 0 || my !== 0) player.clickTarget = null;
  if (player.clickTarget) {
    const dx = player.clickTarget.x - player.x;
    const dy = player.clickTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      player.clickTarget = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
    }
  }

  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.sneaking = !!input.sneak;
  player.running = !!input.run && !player.sneaking;

  let speed = TUNE.playerWalk;
  if (player.sneaking) speed = TUNE.playerSneak;
  if (player.running) speed = TUNE.playerWalk * 1.45;

  if (len > 0) {
    const nx = (mx / len) * speed * dt;
    const ny = (my / len) * speed * dt;
    const moved = moveCircle(player.x, player.y, nx, ny, player.radius);
    player.x = moved.x;
    player.y = moved.y;
    player.facing = Math.atan2(ny, nx);
  }

  // Noise blooms while moving and fades at rest.
  const want = !player.moving
    ? 0
    : player.running
      ? TUNE.noiseRun
      : player.sneaking
        ? TUNE.noiseSneak
        : TUNE.noiseWalk;
  player.noise += (want - player.noise) * Math.min(1, dt * 8);

  player.inShadow = pointInShadow(player.x, player.y);

  // Footstep pacing for the sound layer.
  if (player.moving) {
    player.stepTimer -= dt;
  } else {
    player.stepTimer = 0;
  }
}
