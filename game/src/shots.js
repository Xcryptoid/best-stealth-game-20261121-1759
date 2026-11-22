// Staged states for the screenshots. Each shot freezes the game in a
// pose that shows one beat of the heist: the opening, the patient middle,
// the near miss, and the clean escape. Every value is fixed, so a shot
// renders identically on every run.
import { TILE, TUNE } from './config.js';

// Place a guard at a spot, facing an angle, in a mood, with a set
// suspicion level.
function poseGuard(guard, tx, ty, angleDeg, mood, suspicion) {
  guard.x = tx * TILE;
  guard.y = ty * TILE;
  guard.angle = (angleDeg * Math.PI) / 180;
  guard.mood = mood;
  guard.suspicion = suspicion;
  guard.pause = 999;
}

export function applyShot(state, name) {
  const p = state.player;
  const [g1, g2, g3, g4] = state.guards;
  if (name === 'start') {
    // The opening: the thief at the servants' door, all four wardens on
    // their rounds, cones sweeping the lit floor.
    p.x = 1.5 * TILE;
    p.y = 16.5 * TILE;
    p.facing = -Math.PI / 2;
    poseGuard(g1, 9, 2, 0, 'patrol', 0);
    poseGuard(g2, 24, 3, 90, 'patrol', 0);
    poseGuard(g3, 6, 12, 180, 'patrol', 0);
    poseGuard(g4, 21, 14, 270, 'patrol', 0);
    state.shardsTaken = 0;
    state.phase = 'title';
  } else if (name === 'play') {
    // The patient middle: one chart taken, the thief tucked behind the
    // crates by the middle shelves while Warden Ash's cone sweeps past.
    p.x = 13.5 * TILE;
    p.y = 4.5 * TILE;
    p.facing = Math.PI;
    p.sneaking = true;
    p.inShadow = false;
    state.shards[0].taken = true;
    state.shardsTaken = 1;
    poseGuard(g1, 12, 2, 25, 'patrol', 8);
    poseGuard(g2, 24, 6, 160, 'patrol', 0);
    poseGuard(g3, 6, 12, 0, 'patrol', 0);
    poseGuard(g4, 21, 14, 90, 'patrol', 0);
    state.phase = 'playing';
  } else if (name === 'near') {
    // The near miss: the thief frozen in a shadow patch, Warden Cinder
    // turning toward the sound, the eye more than half full.
    p.x = 12.5 * TILE;
    p.y = 10.5 * TILE;
    p.facing = -Math.PI / 2;
    p.sneaking = true;
    p.inShadow = true;
    state.shards[0].taken = true;
    state.shards[1].taken = true;
    state.shardsTaken = 2;
    poseGuard(g1, 9, 2, 90, 'patrol', 0);
    poseGuard(g2, 24, 6, 180, 'patrol', 0);
    poseGuard(g3, 10, 10, 225, 'suspicious', 62);
    poseGuard(g4, 21, 14, 270, 'patrol', 0);
    state.phase = 'playing';
  } else if (name === 'win') {
    // The clean escape: all three charts taken, the thief at the green
    // door, no alarm ever raised.
    p.x = 15 * TILE;
    p.y = 1.5 * TILE;
    p.facing = -Math.PI / 2;
    for (const s of state.shards) s.taken = true;
    state.shardsTaken = 3;
    poseGuard(g1, 5, 4, 180, 'patrol', 0);
    poseGuard(g2, 26, 5, 90, 'patrol', 0);
    poseGuard(g3, 4, 13, 0, 'patrol', 0);
    poseGuard(g4, 22, 15, 180, 'patrol', 0);
    state.phase = 'win';
    state.unseen = true;
    state.elapsed = 187;
  }
  state.shot = name;
}
