// Keyboard and mouse state: arrows/WASD to move, Shift to sneak,
// hold the run key to hurry (louder), M to mute, R to restart, and a
// mouse click to walk to a spot.
export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    run: false,
    click: null,
  };
}

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  KeyF: 'run',
};

export function bindInput(input, canvas, hooks) {
  window.addEventListener('keydown', (e) => {
    const field = KEYMAP[e.code];
    if (field) {
      input[field] = true;
      e.preventDefault();
    }
    if (e.code === 'Enter' && hooks.onConfirm) hooks.onConfirm();
    if (e.code === 'KeyR' && hooks.onRestart) hooks.onRestart();
    if (e.code === 'KeyM' && hooks.onMute) hooks.onMute();
    if (hooks.onGesture) hooks.onGesture();
  });
  window.addEventListener('keyup', (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    input.click = {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
    };
    if (hooks.onGesture) hooks.onGesture();
    if (hooks.onConfirm) hooks.onConfirm();
  });
}
