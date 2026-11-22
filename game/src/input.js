// Gilded Getaway — keyboard and mouse: WASD or arrows to move, Shift to sneak,
// E to grab the loot, 1/2/3 for tools, click to toss a coin at that spot,
// Enter to confirm, P or Escape to pause, M to mute.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

export function createInput(canvas, onCoinThrow) {
  const keys = new Set();
  const input = {
    mx: 0,
    my: 0,
    sneak: false,
    interact: false,
    pressed: new Set(),
    mouse: { x: 0, y: 0 },
  };

  function updateVector() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    input.mx = x;
    input.my = y;
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Enter' || event.code === 'Space') input.pressed.add(ACTION_CONFIRM);
    if (event.code === 'KeyP' || event.code === 'Escape') input.pressed.add(ACTION_PAUSE);
    if (event.code === 'KeyM') input.pressed.add(ACTION_MUTE);
    if (event.code === 'KeyE') input.interact = true;
    if (event.code === 'Digit1') input.pressed.add('smoke');
    if (event.code === 'Digit2') input.pressed.add('coin-arm');
    if (event.code === 'Digit3') input.pressed.add('emp');
    updateVector();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'KeyE') input.interact = false;
    updateVector();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    updateVector();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    input.mouse = { x, y };
    onCoinThrow(x, y);
  });

  input.consume = (action) => {
    if (!input.pressed.has(action)) return false;
    input.pressed.delete(action);
    return true;
  };
  return input;
}
