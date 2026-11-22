// Level layout and tuning for The Gilded Archive.
// Everything is laid out in tiles; one tile is 32 pixels. The hall is
// 30 tiles wide and 18 tall. Coordinates are tile units: x grows right,
// y grows down. Rects are {x, y, w, h} in tiles.

export const TILE = 32;
export const COLS = 30;
export const ROWS = 18;
export const VIEW_W = COLS * TILE;
export const VIEW_H = ROWS * TILE;

// Solid walls. The border is the hall itself; the inner walls split the
// floor into a top gallery, a middle stack room and a bottom reading room,
// with doorways left open so every corner stays reachable.
export const WALLS = [
  // border
  { x: 0, y: 0, w: 30, h: 1 },
  { x: 0, y: 17, w: 30, h: 1 },
  { x: 0, y: 0, w: 1, h: 18 },
  { x: 29, y: 0, w: 1, h: 18 },
  // inner walls (doorways are the gaps)
  { x: 10, y: 1, w: 1, h: 5 },
  { x: 10, y: 8, w: 1, h: 4 },
  { x: 19, y: 5, w: 1, h: 5 },
  { x: 19, y: 12, w: 1, h: 4 },
  { x: 4, y: 6, w: 4, h: 1 },
  { x: 22, y: 11, w: 5, h: 1 },
];

// Tall archive shelves. They block a guard's line of sight completely,
// so a thief can slip along their far side.
export const SHELVES = [
  { x: 5, y: 3, w: 4, h: 1 },
  { x: 5, y: 8, w: 4, h: 1 },
  { x: 5, y: 12, w: 4, h: 1 },
  { x: 21, y: 4, w: 4, h: 1 },
  { x: 21, y: 9, w: 4, h: 1 },
  { x: 13, y: 14, w: 4, h: 1 },
];

// Crates. Low enough to duck behind, tall enough to break a sightline.
export const CRATES = [
  { x: 13, y: 3, w: 1, h: 1 },
  { x: 14, y: 3, w: 1, h: 1 },
  { x: 24, y: 7, w: 1, h: 1 },
  { x: 25, y: 14, w: 1, h: 1 },
  { x: 3, y: 15, w: 1, h: 1 },
  { x: 16, y: 14, w: 1, h: 1 },
  { x: 26, y: 12, w: 1, h: 1 },
];

// Hanging lanterns. Their warm pools are the lit ground: a thief seen
// inside one is spotted far sooner than in the dark between them.
export const LANTERNS = [
  { x: 2, y: 2 },
  { x: 15, y: 2 },
  { x: 27, y: 2 },
  { x: 8, y: 9 },
  { x: 22, y: 15 },
  { x: 15, y: 16 },
];

// Shadow patches. Standing in one halves how fast a guard's suspicion
// grows. They are the dark gaps between the lantern pools.
export const SHADOWS = [
  { x: 11, y: 9, w: 4, h: 3 },
  { x: 23, y: 12, w: 4, h: 3 },
  { x: 2, y: 6, w: 3, h: 3 },
  { x: 15, y: 5, w: 2, h: 2 },
];

// Guard patrols. Each guard walks its loop of waypoints, pausing a beat
// at each corner to look around. Coordinates are tile centres.
export const GUARDS = [
  {
    name: 'Warden Ash',
    waypoints: [
      { x: 5, y: 2 },
      { x: 14, y: 2 },
      { x: 14, y: 6 },
      { x: 5, y: 6 },
    ],
  },
  {
    name: 'Warden Brine',
    waypoints: [
      { x: 21, y: 3 },
      { x: 27, y: 3 },
      { x: 27, y: 8 },
      { x: 21, y: 8 },
    ],
  },
  {
    name: 'Warden Cinder',
    waypoints: [
      { x: 4, y: 10 },
      { x: 9, y: 10 },
      { x: 9, y: 15 },
      { x: 4, y: 15 },
    ],
  },
  {
    name: 'Warden Dusk',
    waypoints: [
      { x: 17, y: 12 },
      { x: 25, y: 12 },
      { x: 25, y: 16 },
      { x: 17, y: 16 },
    ],
  },
];

// The three star-charts to steal. One hides in each wing of the hall.
export const SHARDS = [
  { x: 27, y: 1, label: 'Chart of the First Dawn' },
  { x: 2, y: 9, label: 'Chart of the Long Night' },
  { x: 15, y: 9, label: 'Chart of the Quiet Sea' },
];

// The green door in the top wall. It only opens once all three charts
// are taken; reaching it then ends the heist.
export const EXIT = { x: 14, y: 0, w: 2, h: 1 };

// Where the thief slips in: the servants' door, bottom left.
export const PLAYER_START = { x: 1.5, y: 16.5 };

// Tuning. Distances in pixels, times in seconds.
export const TUNE = {
  playerWalk: 150,
  playerSneak: 85,
  playerRadius: 11,
  guardPatrol: 62,
  guardChase: 128,
  guardSearch: 70,
  guardRadius: 12,
  coneRange: 185,
  coneHalfAngle: 0.55,
  catchRadius: 18,
  detectBase: 55,
  detectRun: 1.6,
  detectSneak: 0.65,
  detectShadow: 0.5,
  detectClose: 1.35,
  detectFar: 0.8,
  detectDecay: 26,
  suspiciousAt: 35,
  alarmAt: 100,
  searchTime: 2.6,
  giveUpTime: 3.0,
  noiseWalk: 95,
  noiseRun: 150,
  noiseSneak: 45,
  hearRadius: 210,
};
