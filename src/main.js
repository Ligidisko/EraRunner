// Entry point: configures Phaser and registers every scene.
// Flow: Boot -> Title (attract mode / demo) -> EraCard -> era game -> ... -> End
//   era games: Shooter (1985) -> Platformer (1995) -> Rhythm (2005)
//   out of lives: Continue -> (Initials) -> Title
import Phaser from 'phaser';
import '@fontsource/press-start-2p';
import { GAME_W, GAME_H } from './config.js';
import * as audio from './audio/audio.js';
import { state } from './state.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import EraCardScene from './scenes/EraCardScene.js';
import ShooterScene from './scenes/ShooterScene.js';
import PlatformerScene from './scenes/PlatformerScene.js';
import RhythmScene from './scenes/RhythmScene.js';
import ContinueScene from './scenes/ContinueScene.js';
import InitialsScene from './scenes/InitialsScene.js';
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
    scene: [BootScene, TitleScene, EraCardScene, ShooterScene, PlatformerScene, RhythmScene, ContinueScene, InitialsScene, EndScene],
  });
  if (import.meta.env.DEV) { // debugging handles in dev builds only
    window.__game = game;
    window.__audio = audio;
    window.__state = state;
  }
}

// Wait for the pixel font so the first text we draw isn't in a fallback font.
document.fonts.load('8px "Press Start 2P"').then(start, start);
