// The game loop and state machine: title, playing, caught, win.
// A ?shot= parameter freezes the game in one of the staged screenshot
// poses instead of running the loop.
import { TILE, VIEW_W, VIEW_H, SHARDS, EXIT, TUNE } from './config.js';
import { makeGuard, updateGuard, highestSuspicion, anyAlarmed } from './guards.js';
import { GUARDS } from './config.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeInput, bindInput } from './input.js';
import { renderWorld, renderTitle, renderCaught, renderWin } from './render.js';
import { applyShot } from './shots.js';
import { ensureAudio, playStep, playPickup, playAlarm, playWin, playCaught, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const hudShards = document.getElementById('hud-shards');
const hudEye = document.getElementById('hud-eye');
const hudEyeFill = document.getElementById('hud-eye-fill');
const hudTimer = document.getElementById('hud-timer');
const hudAlert = document.getElementById('hud-alert');
const hudHint = document.getElementById('hud-hint');

function freshState() {
  return {
    phase: 'title',
    player: makePlayer(),
    guards: GUARDS.map(makeGuard),
    shards: SHARDS.map((s) => ({
      x: s.x * TILE,
      y: s.y * TILE,
      label: s.label,
      taken: false,
      pulse: 0,
    })),
    shardsTaken: 0,
    elapsed: 0,
    unseen: true,
    caughtBy: null,
    shot: null,
    alarmedBefore: false,
  };
}

let state = freshState();
const input = makeInput();
let lastAlarm = false;

function restart() {
  state = freshState();
  state.phase = 'playing';
  updateHud();
}

bindInput(input, canvas, {
  onConfirm() {
    ensureAudio();
    if (state.phase === 'title') {
      state.phase = 'playing';
      updateHud();
    }
  },
  onRestart() {
    if (state.phase !== 'title') restart();
  },
  onMute() {
    const muted = toggleMute();
    hudHint.textContent = muted ? 'Sound off (M to unmute)' : 'WASD move · Shift sneak · F hurry · click to walk';
  },
  onGesture() {
    ensureAudio();
  },
});

canvas.addEventListener('pointerdown', () => {
  if (input.click) {
    state.player.clickTarget = { x: input.click.x, y: input.click.y };
    input.click = null;
  }
});

function updateHud() {
  hudShards.textContent = `Charts ${state.shardsTaken} / ${SHARDS.length}`;
  const eye = Math.round(highestSuspicion(state.guards));
  hudEyeFill.style.width = `${eye}%`;
  hudEyeFill.style.background = eye >= TUNE.alarmAt ? '#ff5040' : eye >= TUNE.suspiciousAt ? '#ffb13d' : '#ffd86e';
  hudEye.title = `Suspicion ${eye}%`;
  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60).toString().padStart(2, '0');
  hudTimer.textContent = `${mins}:${secs}`;
  const alarmed = anyAlarmed(state.guards);
  hudAlert.textContent = alarmed ? 'ALARM — RUN' : state.phase === 'win' ? 'OUT CLEAN' : state.phase === 'caught' ? 'CAUGHT' : 'UNSEEN';
  hudAlert.className = alarmed ? 'alert on' : 'alert';
}

function step(dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;

  updatePlayer(state.player, input, dt);
  if (state.player.moving && state.player.stepTimer <= 0) {
    playStep(state.player.sneaking);
    state.player.stepTimer = state.player.sneaking ? 0.55 : 0.34;
  }

  let caught = null;
  for (const guard of state.guards) {
    updateGuard(guard, state.player, dt, (g) => {
      caught = g;
    });
  }
  if (caught) {
    state.phase = 'caught';
    state.caughtBy = caught.name;
    playCaught();
    updateHud();
    return;
  }

  const alarmed = anyAlarmed(state.guards);
  if (alarmed && !lastAlarm) {
    playAlarm();
    state.unseen = false;
  }
  lastAlarm = alarmed;
  if (alarmed) state.alarmedBefore = true;

  // Pick up a chart by walking over it.
  for (const shard of state.shards) {
    if (shard.taken) continue;
    shard.pulse += dt * 3;
    if (Math.hypot(state.player.x - shard.x, state.player.y - shard.y) < 26) {
      shard.taken = true;
      state.shardsTaken += 1;
      playPickup();
    }
  }

  // The green door opens once all three charts are taken; stepping
  // through it ends the heist.
  if (state.shardsTaken === SHARDS.length) {
    const door = { x: (EXIT.x + EXIT.w / 2) * TILE, y: (EXIT.y + EXIT.h / 2) * TILE };
    if (Math.hypot(state.player.x - door.x, state.player.y - door.y) < 34) {
      state.phase = 'win';
      playWin();
    }
  }

  updateHud();
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
  frame.last = now;
  step(dt);
  renderWorld(ctx, state);
  if (state.phase === 'title') renderTitle(ctx);
  else if (state.phase === 'caught') renderCaught(ctx, state.caughtBy || 'A warden');
  else if (state.phase === 'win') renderWin(ctx, state.unseen && !state.alarmedBefore, state.elapsed);
  requestAnimationFrame(frame);
}

// A staged shot renders one frozen frame and stops: deterministic, so
// the screenshots never catch a guard mid-step.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(state, shot);
  state.elapsed = state.elapsed || 0;
  renderWorld(ctx, state);
  if (state.phase === 'title') renderTitle(ctx);
  else if (state.phase === 'win') renderWin(ctx, true, state.elapsed);
  updateHud();
  window.__ready = true;
} else {
  updateHud();
  requestAnimationFrame(frame);
}
