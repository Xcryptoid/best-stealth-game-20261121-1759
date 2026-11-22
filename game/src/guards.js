// Guards: patrols, vision cones, suspicion and the chase.
// A guard has four moods: patrol, suspicious, chase and search. Its
// suspicion meter is the game's heart: it climbs while the thief stands
// inside its cone in the open, and drains while the thief stays hidden.
import { TILE, TUNE } from './config.js';
import { lineOfSight, pointInShadow, moveCircle } from './level.js';

export function makeGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints.map((w) => ({ x: w.x * TILE, y: w.y * TILE })),
    x: start.x * TILE,
    y: start.y * TILE,
    angle: 0,
    target: 1,
    pause: 0,
    mood: 'patrol',
    suspicion: 0,
    lastSeen: null,
    searchTimer: 0,
    giveUpTimer: 0,
    scanAngle: 0,
    heard: null,
  };
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(guard, target, rate, dt) {
  const d = angleDiff(target, guard.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  guard.angle += step;
}

// Can this guard see the thief right now? Inside the cone's range and
// angle, with no wall, shelf or crate between them.
export function guardSees(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TUNE.coneRange) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.angle)) > TUNE.coneHalfAngle) {
    return false;
  }
  return lineOfSight(guard.x, guard.y, px, py);
}

// How fast suspicion grows while the guard sees the thief: quicker up
// close and in the light, slower sneaking or in shadow.
export function detectRate(guard, px, py, sneaking, running) {
  const dist = Math.hypot(px - guard.x, py - guard.y);
  let rate = TUNE.detectBase;
  if (running) rate *= TUNE.detectRun;
  if (sneaking) rate *= TUNE.detectSneak;
  if (pointInShadow(px, py)) rate *= TUNE.detectShadow;
  rate *= dist < TUNE.coneRange * 0.45 ? TUNE.detectClose : TUNE.detectFar;
  return rate;
}

function stepToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(
    guard.x,
    guard.y,
    (dx / dist) * step,
    (dy / dist) * step,
    TUNE.guardRadius,
  );
  guard.x = moved.x;
  guard.y = moved.y;
  guard.angle = angleTo(guard.x, guard.y, tx, ty);
}

export function updateGuard(guard, player, dt, onCaught) {
  const sees = guardSees(guard, player.x, player.y);
  if (sees) {
    guard.suspicion += detectRate(guard, player.x, player.y, player.sneaking, player.running) * dt;
    guard.lastSeen = { x: player.x, y: player.y };
    guard.giveUpTimer = 0;
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - TUNE.detectDecay * dt);
  }
  guard.suspicion = Math.min(TUNE.alarmAt, guard.suspicion);

  if (guard.suspicion >= TUNE.alarmAt) guard.mood = 'chase';
  else if (guard.mood === 'chase' && guard.suspicion < TUNE.suspiciousAt) guard.mood = 'search';
  else if (guard.mood !== 'chase' && guard.suspicion >= TUNE.suspiciousAt) guard.mood = 'suspicious';

  // A loud footstep nearby turns a patrolling guard toward the noise.
  if (player.noise > 0 && guard.mood === 'patrol') {
    const d = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (d < TUNE.hearRadius && d < player.noise) {
      guard.heard = { x: player.x, y: player.y };
      guard.mood = 'suspicious';
    }
  }

  if (guard.mood === 'patrol') {
    const wp = guard.waypoints[guard.target];
    if (guard.pause > 0) {
      guard.pause -= dt;
      guard.scanAngle += dt * 1.4;
      turnToward(guard, guard.scanAngle, 2.2, dt);
    } else {
      const dx = wp.x - guard.x;
      const dy = wp.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        guard.target = (guard.target + 1) % guard.waypoints.length;
        guard.pause = 1.1;
        guard.scanAngle = guard.angle;
      } else {
        stepToward(guard, wp.x, wp.y, TUNE.guardPatrol, dt);
      }
    }
  } else if (guard.mood === 'suspicious') {
    const focus = guard.lastSeen || guard.heard;
    if (focus) {
      turnToward(guard, angleTo(guard.x, guard.y, focus.x, focus.y), 3.2, dt);
      stepToward(guard, focus.x, focus.y, TUNE.guardSearch, dt);
      const d = Math.hypot(focus.x - guard.x, focus.y - guard.y);
      if (d < 26) {
        guard.mood = 'search';
        guard.searchTimer = TUNE.searchTime;
        guard.scanAngle = guard.angle;
      }
    }
    if (!sees && guard.suspicion <= 0) {
      guard.mood = 'patrol';
      guard.heard = null;
    }
  } else if (guard.mood === 'chase') {
    if (sees) {
      stepToward(guard, player.x, player.y, TUNE.guardChase, dt);
    } else if (guard.lastSeen) {
      stepToward(guard, guard.lastSeen.x, guard.lastSeen.y, TUNE.guardChase, dt);
      guard.giveUpTimer += dt;
      if (guard.giveUpTimer > TUNE.giveUpTime) {
        guard.mood = 'search';
        guard.searchTimer = TUNE.searchTime;
        guard.scanAngle = guard.angle;
      }
    }
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < TUNE.catchRadius) {
      onCaught(guard);
    }
  } else if (guard.mood === 'search') {
    guard.searchTimer -= dt;
    guard.scanAngle += dt * 2.0;
    turnToward(guard, guard.scanAngle, 2.6, dt);
    if (guard.searchTimer <= 0) {
      guard.mood = 'patrol';
      guard.heard = null;
      guard.lastSeen = null;
    }
  }
}

// The loudest suspicion among the guards: the eye the HUD shows.
export function highestSuspicion(guards) {
  let top = 0;
  for (const g of guards) top = Math.max(top, g.suspicion);
  return top;
}

export function anyAlarmed(guards) {
  return guards.some((g) => g.mood === 'chase');
}
