// The level model: solid rectangles, line of sight, shadows and the
// circle-against-rectangle movement used by the thief and the guards.
import { TILE, WALLS, SHELVES, CRATES, SHADOWS } from './config.js';

function tileRect(r) {
  return {
    x: r.x * TILE,
    y: r.y * TILE,
    w: r.w * TILE,
    h: r.h * TILE,
  };
}

// Every rectangle that blocks movement and sight: walls, shelves, crates.
export const SOLIDS = [
  ...WALLS.map(tileRect),
  ...SHELVES.map(tileRect),
  ...CRATES.map(tileRect),
];

const SHADOW_RECTS = SHADOWS.map(tileRect);

export function pointInRect(px, py, r) {
  return px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
}

export function pointBlocked(px, py) {
  for (const r of SOLIDS) {
    if (pointInRect(px, py, r)) return true;
  }
  return false;
}

// True when the point stands in a shadow patch.
export function pointInShadow(px, py) {
  for (const r of SHADOW_RECTS) {
    if (pointInRect(px, py, r)) return true;
  }
  return false;
}

// True when the straight line between two points crosses no solid rect.
// Sampled every few pixels: cheap, and exact enough for sight cones.
export function lineOfSight(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(ax + dx * t, ay + dy * t)) return false;
  }
  return true;
}

// Move a circle of the given radius by (dx, dy), sliding along solids:
// try the x step, then the y step, keeping whichever axis stays clear.
export function moveCircle(x, y, dx, dy, radius) {
  let nx = x + dx;
  if (circleHits(nx, y, radius)) nx = x;
  let ny = y + dy;
  if (circleHits(nx, ny, radius)) ny = y;
  return { x: nx, y: ny };
}

function circleHits(cx, cy, radius) {
  for (const r of SOLIDS) {
    const qx = Math.max(r.x, Math.min(cx, r.x + r.w));
    const qy = Math.max(r.y, Math.min(cy, r.y + r.h));
    const ddx = cx - qx;
    const ddy = cy - qy;
    if (ddx * ddx + ddy * ddy < radius * radius) return true;
  }
  return false;
}

// Distance from a point to the nearest solid edge, used to keep staged
// screenshot poses from overlapping a wall.
export function clearance(px, py) {
  let best = Infinity;
  for (const r of SOLIDS) {
    const qx = Math.max(r.x, Math.min(px, r.x + r.w));
    const qy = Math.max(r.y, Math.min(py, r.y + r.h));
    best = Math.min(best, Math.hypot(px - qx, py - qy));
  }
  return best;
}
