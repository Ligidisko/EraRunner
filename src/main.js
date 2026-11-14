// Entry point: configures Phaser and registers every scene.
// Scene flow: Boot -> Title -> EraCard -> Run -> (EraCard -> Run)... -> End
import Phaser from 'phaser';
import '@fontsource/press-start-2p';
import { GAME_W, GAME_H } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import EraCardScene from './scenes/EraCardScene.js';
import RunScene from './scenes/RunScene.js';
import EndScene from './scenes/EndScene.js';

function start() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true, // nearest-neighbour scaling = crisp pixels
    backgroundColor: '#000000',
    physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, EraCardScene, RunScene, EndScene],
  });
  if (import.meta.env.DEV) window.__game = game; // debugging handle in dev builds only
}

// Wait for the pixel font so the first text we draw isn't in a fallback font.
document.fonts.load('8px "Press Start 2P"').then(start, start);
