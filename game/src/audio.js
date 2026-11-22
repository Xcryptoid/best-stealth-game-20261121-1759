// Synthesised sound: no audio files ship with the game, every cue is
// built from oscillators at run time. The context only starts after a
// first key or click, as browsers require.
let ctx = null;
let muted = false;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, gain, when = 0) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound is garnish; a failure never stops the game.
  }
}

// A soft step: lower and quieter while sneaking.
export function playStep(sneaking) {
  tone(sneaking ? 140 : 190, 0.07, 'triangle', sneaking ? 0.02 : 0.045);
}

// Two-note chime when a star-chart is taken.
export function playPickup() {
  tone(660, 0.16, 'sine', 0.07);
  tone(990, 0.24, 'sine', 0.06, 0.09);
}

// A short alarm sting when a guard's suspicion tops out.
export function playAlarm() {
  tone(220, 0.22, 'sawtooth', 0.05);
  tone(311, 0.22, 'sawtooth', 0.05, 0.16);
}

// A rising arpeggio for slipping out unseen.
export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'sine', 0.06, i * 0.12));
}

// A low thud when a guard catches the thief.
export function playCaught() {
  tone(98, 0.4, 'sawtooth', 0.07);
  tone(65, 0.5, 'triangle', 0.06, 0.12);
}
