// One-shot key presses straight from the browser (one call per physical press,
// auto-repeat ignored). Used for menus, cheat words and the rhythm game, where
// every press must count exactly once. Cleaned up when the scene shuts down.
export function onKeyPress(scene, handler) {
  const listener = (e) => {
    if (e.repeat) return;
    handler(e);
  };
  window.addEventListener('keydown', listener);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', listener));
}
