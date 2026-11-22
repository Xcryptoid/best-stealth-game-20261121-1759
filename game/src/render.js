// All canvas drawing: the candlelit hall, the guards and their vision
// cones, the thief, the charts, the green door, and the overlays for
// the title, the catch and the clean escape.
import { TILE, VIEW_W, VIEW_H, WALLS, SHELVES, CRATES, LANTERNS, SHADOWS, SHARDS, EXIT, TUNE } from './config.js';
import { pointInShadow, pointBlocked } from './level.js';

const FLOOR_A = '#372b1c';
const FLOOR_B = '#2e2417';
const WALL_TOP = '#5d5348';
const WALL_FACE = '#3a332b';

function tileRect(r) {
  return { x: r.x * TILE, y: r.y * TILE, w: r.w * TILE, h: r.h * TILE };
}

function drawFloor(g) {
  g.fillStyle = FLOOR_A;
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  g.fillStyle = FLOOR_B;
  const cols = Math.floor(VIEW_W / TILE);
  const rows = Math.floor(VIEW_H / TILE);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if ((tx + ty) % 2 === 0) g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  // Parquet seams.
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= VIEW_W; x += TILE) {
    g.moveTo(x, 0);
    g.lineTo(x, VIEW_H);
  }
  for (let y = 0; y <= VIEW_H; y += TILE) {
    g.moveTo(0, y);
    g.lineTo(VIEW_W, y);
  }
  g.stroke();
}

function drawShadows(g) {
  for (const s of SHADOWS) {
    const r = tileRect(s);
    g.fillStyle = 'rgba(8,10,26,0.55)';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.strokeStyle = 'rgba(120,140,255,0.18)';
    g.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  }
}

function drawWalls(g) {
  for (const w of WALLS) {
    const r = tileRect(w);
    g.fillStyle = WALL_FACE;
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = WALL_TOP;
    g.fillRect(r.x, r.y, r.w, 5);
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }
}

function drawShelves(g) {
  for (const s of SHELVES) {
    const r = tileRect(s);
    g.fillStyle = '#4a2f1d';
    g.fillRect(r.x, r.y, r.w, r.h);
    g.fillStyle = '#6b4426';
    g.fillRect(r.x, r.y + 3, r.w, 4);
    g.fillStyle = '#3d2716';
    for (let x = r.x + 5; x < r.x + r.w - 4; x += 7) {
      g.fillRect(x, r.y + 8, 4, r.h - 14);
    }
    g.strokeStyle = 'rgba(0,0,0,0.5)';
    g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }
}

function drawCrates(g) {
  for (const c of CRATES) {
    const r = tileRect(c);
    g.fillStyle = '#7a5a30';
    g.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    g.strokeStyle = '#4a3416';
    g.lineWidth = 2;
    g.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    g.beginPath();
    g.moveTo(r.x + 2, r.y + 2);
    g.lineTo(r.x + r.w - 2, r.y + r.h - 2);
    g.moveTo(r.x + r.w - 2, r.y + 2);
    g.lineTo(r.x + 2, r.y + r.h - 2);
    g.stroke();
  }
}

function drawLanterns(g) {
  for (const l of LANTERNS) {
    const cx = l.x * TILE;
    const cy = l.y * TILE;
    const glow = g.createRadialGradient(cx, cy, 4, cx, cy, 74);
    glow.addColorStop(0, 'rgba(255,196,110,0.30)');
    glow.addColorStop(1, 'rgba(255,196,110,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(cx, cy, 74, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffd98a';
    g.beginPath();
    g.arc(cx, cy, 5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#8a6a30';
    g.lineWidth = 2;
    g.stroke();
  }
}

function drawShards(g, shards) {
  for (const s of shards) {
    if (s.taken) continue;
    const cx = s.x * TILE;
    const cy = s.y * TILE;
    const pulse = 0.55 + 0.25 * Math.sin(s.pulse);
    const glow = g.createRadialGradient(cx, cy, 2, cx, cy, 30);
    glow.addColorStop(0, `rgba(110,235,255,${pulse})`);
    glow.addColorStop(1, 'rgba(110,235,255,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(cx, cy, 30, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#cfeeff';
    g.fillRect(cx - 7, cy - 4, 14, 8);
    g.fillStyle = '#1d6f86';
    g.fillRect(cx - 4, cy - 2, 8, 1);
    g.fillRect(cx - 4, cy + 1, 8, 1);
  }
}

function drawExit(g, open) {
  const r = tileRect(EXIT);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const glow = g.createRadialGradient(cx, cy, 4, cx, cy, 70);
  glow.addColorStop(0, open ? 'rgba(90,255,150,0.55)' : 'rgba(90,255,150,0.18)');
  glow.addColorStop(1, 'rgba(90,255,150,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(cx, cy, 70, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = open ? '#37d67a' : '#1f7a45';
  g.fillRect(r.x + 4, r.y, r.w - 8, r.h - 2);
  g.fillStyle = '#0c2f1a';
  g.fillRect(cx - 2, r.y, 4, r.h - 2);
  g.fillStyle = '#eafff0';
  g.font = 'bold 11px sans-serif';
  g.textAlign = 'center';
  g.fillText(open ? 'EXIT OPEN' : 'EXIT', cx, r.y + r.h + 14);
}

function coneColor(guard) {
  if (guard.mood === 'chase') return 'rgba(255,70,60,0.34)';
  if (guard.mood === 'suspicious' || guard.mood === 'search') return 'rgba(255,170,60,0.30)';
  return 'rgba(255,220,110,0.24)';
}

function drawGuard(g, guard) {
  const range = TUNE.coneRange;
  const half = TUNE.coneHalfAngle;
  // Vision cone, clipped by walls: cast a fan of rays and stop each one
  // at the first solid it meets, so the light never shines through a
  // shelf or a wall the way an unclipped wedge would.
  const rays = 28;
  const edge = [];
  for (let i = 0; i <= rays; i++) {
    const a = guard.angle - half + (2 * half * i) / rays;
    let r = range;
    for (let d = 10; d <= range; d += 6) {
      if (pointBlocked(guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d)) {
        r = d;
        break;
      }
    }
    edge.push({ x: guard.x + Math.cos(a) * r, y: guard.y + Math.sin(a) * r });
  }
  const grad = g.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, range);
  grad.addColorStop(0, coneColor(guard).replace(/0\.\d+\)$/, '0.5)'));
  grad.addColorStop(1, coneColor(guard));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(guard.x, guard.y);
  for (const p of edge) g.lineTo(p.x, p.y);
  g.closePath();
  g.fill();
  g.strokeStyle = coneColor(guard);
  g.lineWidth = 1;
  g.stroke();
  // Body: a warden in a dark blue coat and brass helmet.
  g.fillStyle = '#2c3e6b';
  g.beginPath();
  g.arc(guard.x, guard.y, TUNE.guardRadius, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d8b25c';
  g.beginPath();
  g.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1a2547';
  g.beginPath();
  g.arc(guard.x + Math.cos(guard.angle) * 8, guard.y + Math.sin(guard.angle) * 8, 4, 0, Math.PI * 2);
  g.fill();
  // "?" while suspicious, "!" while chasing.
  if (guard.mood === 'suspicious' || guard.mood === 'search') {
    g.fillStyle = '#ffb13d';
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'center';
    g.fillText('?', guard.x, guard.y - 20);
  } else if (guard.mood === 'chase') {
    g.fillStyle = '#ff5040';
    g.font = 'bold 22px sans-serif';
    g.textAlign = 'center';
    g.fillText('!', guard.x, guard.y - 20);
  }
  // Name tag on the floor plan.
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = '10px sans-serif';
  g.textAlign = 'center';
  g.fillText(guard.name, guard.x, guard.y + 26);
}

function drawPlayer(g, player) {
  // Noise ring while running.
  if (player.noise > 60) {
    g.strokeStyle = `rgba(255,255,255,${Math.min(0.35, player.noise / 500)})`;
    g.lineWidth = 1;
    g.beginPath();
    g.arc(player.x, player.y, player.noise, 0, Math.PI * 2);
    g.stroke();
  }
  // A small hooded figure: a slate-blue cloak with a brass rim so the
  // eye finds the thief at a glance, a pale face shadow, a faint lantern.
  const glow = g.createRadialGradient(player.x, player.y, 2, player.x, player.y, 42);
  glow.addColorStop(0, 'rgba(255,220,150,0.32)');
  glow.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(player.x, player.y, 42, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#39415a';
  g.beginPath();
  g.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#d8b25c';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#e8e0c8';
  g.beginPath();
  g.arc(player.x + Math.cos(player.facing) * 4, player.y + Math.sin(player.facing) * 4, 4.5, 0, Math.PI * 2);
  g.fill();
  if (player.inShadow) {
    g.fillStyle = 'rgba(140,160,255,0.85)';
    g.font = '10px sans-serif';
    g.textAlign = 'center';
    g.fillText('HIDDEN', player.x, player.y - 18);
  }
}

function drawNight(g) {
  // The hall after dark: a blue wash over everything. The lanterns, the
  // charts, the cones and the thief are drawn after it, so the light
  // reads as light instead of drowning with the floor.
  g.fillStyle = 'rgba(6,8,24,0.26)';
  g.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function renderWorld(g, state) {
  g.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(g);
  drawShadows(g);
  drawWalls(g);
  drawShelves(g);
  drawCrates(g);
  drawNight(g);
  drawLanterns(g);
  drawShards(g, state.shards);
  drawExit(g, state.shardsTaken === SHARDS.length);
  for (const guard of state.guards) drawGuard(g, guard);
  drawPlayer(g, state.player);
  // Re-draw the name tags over the night wash so they stay readable.
  for (const guard of state.guards) {
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.font = '10px sans-serif';
    g.textAlign = 'center';
    g.fillText(guard.name, guard.x, guard.y + 26);
  }
}

function banner(g, title, lines, accent) {
  g.fillStyle = 'rgba(4,6,16,0.78)';
  g.fillRect(0, VIEW_H / 2 - 92, VIEW_W, 184);
  g.strokeStyle = accent;
  g.lineWidth = 2;
  g.strokeRect(2, VIEW_H / 2 - 92, VIEW_W - 4, 184);
  g.fillStyle = accent;
  g.font = 'bold 34px sans-serif';
  g.textAlign = 'center';
  g.fillText(title, VIEW_W / 2, VIEW_H / 2 - 34);
  g.fillStyle = '#f2ead8';
  g.font = '16px sans-serif';
  lines.forEach((line, i) => {
    g.fillText(line, VIEW_W / 2, VIEW_H / 2 + 4 + i * 24);
  });
}

export function renderTitle(g) {
  banner(
    g,
    'THE GILDED ARCHIVE',
    [
      'Steal the three star-charts. Slip out the green door. Stay unseen.',
      'WASD / arrows to move · Shift to sneak · F to hurry (loud) · click to walk',
      'Shadows hide you. Lantern light betrays you. A full eye means the chase is on.',
      'Press Enter or click to begin · R restarts · M mutes',
    ],
    '#d8b25c',
  );
}

export function renderCaught(g, guardName) {
  banner(g, 'CAUGHT', [`${guardName} caught you in the lamplight.`, 'The charts stay in the archive tonight.', 'Press R to try the heist again.'], '#ff5040');
}

export function renderWin(g, unseen, seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  banner(
    g,
    unseen ? 'UNSEEN' : 'ESCAPED',
    [
      unseen
        ? 'Three charts, no alarm, no witness. The archive keeps its secret.'
        : 'Three charts and out the door — but someone raised the alarm.',
      `Time ${mins}:${secs} · all three star-charts stolen`,
      'Press R to run the heist again.',
    ],
    '#37d67a',
  );
}
