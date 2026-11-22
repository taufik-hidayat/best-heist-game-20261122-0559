// Keyboard and mouse input for The Velvet Vault.
// WASD or arrow keys move the thief; E (held) hacks a terminal;
// Q drops a smoke bomb; Enter or a click confirms on menus.
// The game also reads the mouse position for menu buttons.

export function createInput(canvas) {
  const keys = new Set();
  // Edge-triggered presses: a quick tap must still register even when
  // the key is already up again before the next animation frame.
  const queued = new Set();
  const mouse = { x: 0, y: 0, clicked: false, down: false };

  function keyName(event) {
    const k = event.key.toLowerCase();
    if (k === ' ') return 'space';
    return k;
  }

  window.addEventListener('keydown', (event) => {
    const k = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      event.preventDefault();
    }
    if (!event.repeat) queued.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => {
    keys.clear();
    queued.clear();
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (event) => {
    mouse.down = true;
    mouse.clicked = true;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    event.preventDefault();
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  return {
    keys,
    mouse,
    // -1, 0 or 1 on each axis from the held movement keys.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    hacking() {
      return keys.has('e');
    },
    smokePressed() {
      if (queued.has('q')) {
        queued.delete('q');
        return true;
      }
      return false;
    },
    confirmPressed() {
      if (queued.has('enter') || queued.has('space') || mouse.clicked) {
        mouse.clicked = false;
        queued.delete('enter');
        queued.delete('space');
        return true;
      }
      return false;
    },
    consumeClick() {
      const was = mouse.clicked;
      mouse.clicked = false;
      return was;
    },
  };
}
