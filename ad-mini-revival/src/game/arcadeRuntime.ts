import Phaser from 'phaser';

import { defaultGameId } from './catalog';
import { createMiniGame } from './factory';
import type { GameId, HudState, MiniGame } from './types';

class ArcadeScene extends Phaser.Scene {
  private currentGame?: MiniGame;

  private currentGameId: GameId = defaultGameId;

  private ready = false;

  private readonly onHud: (state: HudState) => void;

  constructor(onHud: (state: HudState) => void) {
    super('ad-arcade');
    this.onHud = onHud;
  }

  create() {
    this.cameras.main.setBackgroundColor('#121826');
    this.ready = true;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.currentGame?.pointerDown(pointer);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.currentGame?.pointerMove(pointer);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.currentGame?.pointerUp(pointer);
    });

    this.switchGame(this.currentGameId);
  }

  update(time: number, delta: number) {
    this.currentGame?.update(time, delta);
  }

  switchGame(gameId: GameId) {
    this.currentGameId = gameId;

    if (!this.ready) {
      return;
    }

    this.currentGame?.unmount();
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#121826');

    this.currentGame = createMiniGame(gameId, {
      scene: this,
      emitHud: this.onHud,
    });
    this.currentGame.mount();
  }

  restartCurrentGame() {
    this.currentGame?.restart();
  }
}

export class ArcadeRuntime {
  private readonly scene: ArcadeScene;

  private readonly phaser: Phaser.Game;

  constructor(parent: string, onHud: (state: HudState) => void) {
    this.scene = new ArcadeScene(onHud);
    this.phaser = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 900,
      height: 560,
      backgroundColor: '#121826',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [this.scene],
    });
  }

  selectGame(gameId: GameId) {
    this.scene.switchGame(gameId);
  }

  restart() {
    this.scene.restartCurrentGame();
  }

  destroy() {
    this.phaser.destroy(true);
  }
}
