import Phaser from 'phaser';

import type { HudState, MiniGame, MiniGameContext } from '../types';

type PinKey = 'water' | 'gold' | 'gate';

interface PinView {
  key: PinKey;
  x: number;
  y: number;
  line: Phaser.GameObjects.Rectangle;
  cap: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  removed: boolean;
}

const BASE_HUD: HudState = {
  banner: '广告原型 01',
  objective: '点击插销，按正确顺序救出角色。',
  status: '先观察场景，再决定拉哪根。',
  moves: '已拉 0 / 3',
  hint: '正确思路通常是“先处理危险，再释放奖励”。',
  accent: '#ff6b57',
};

export class PinRescueGame implements MiniGame {
  private readonly context: MiniGameContext;

  private root!: Phaser.GameObjects.Container;

  private board!: Phaser.GameObjects.Graphics;

  private readonly pins: PinView[] = [];

  private hero!: Phaser.GameObjects.Arc;

  private heroFace!: Phaser.GameObjects.Text;

  private lava!: Phaser.GameObjects.Rectangle;

  private waterBlob!: Phaser.GameObjects.Rectangle;

  private goldOrbs: Phaser.GameObjects.Arc[] = [];

  private centerHint!: Phaser.GameObjects.Text;

  private moveCount = 0;

  private lavaSafe = false;

  private goldReady = false;

  private gateOpen = false;

  private finished = false;

  constructor(context: MiniGameContext) {
    this.context = context;
  }

  private get scene() {
    return this.context.scene;
  }

  mount() {
    this.root = this.scene.add.container(0, 0);
    this.board = this.scene.add.graphics();
    this.root.add(this.board);
    this.drawLayout();
    this.createActors();
    this.createPins();
    this.emitHud();
  }

  unmount() {
    this.root.destroy(true);
  }

  update() {}

  pointerDown(pointer: Phaser.Input.Pointer) {
    if (this.finished) {
      return;
    }

    const pin = this.pins.find((item) => {
      if (item.removed) {
        return false;
      }

      return item.line.getBounds().contains(pointer.worldX, pointer.worldY);
    });

    if (!pin) {
      return;
    }

    this.pullPin(pin);
  }

  pointerMove() {}

  pointerUp() {}

  restart() {
    this.unmount();
    this.pins.length = 0;
    this.goldOrbs = [];
    this.moveCount = 0;
    this.lavaSafe = false;
    this.goldReady = false;
    this.gateOpen = false;
    this.finished = false;
    this.mount();
  }

  private drawLayout() {
    this.board.clear();
    this.board.lineStyle(4, 0x344058, 1);
    this.board.fillStyle(0x1e2433, 1);

    this.board.fillRoundedRect(80, 70, 220, 150, 20);
    this.board.strokeRoundedRect(80, 70, 220, 150, 20);

    this.board.fillRoundedRect(350, 70, 220, 150, 20);
    this.board.strokeRoundedRect(350, 70, 220, 150, 20);

    this.board.fillRoundedRect(330, 240, 290, 120, 24);
    this.board.strokeRoundedRect(330, 240, 290, 120, 24);

    this.board.fillRoundedRect(665, 250, 170, 150, 24);
    this.board.strokeRoundedRect(665, 250, 170, 150, 24);

    this.board.fillStyle(0x2a3147, 1);
    this.board.fillRoundedRect(330, 405, 250, 80, 22);
    this.board.lineStyle(3, 0x44506d, 1);
    this.board.strokeRoundedRect(330, 405, 250, 80, 22);

    this.root.add(
      this.scene.add
        .text(110, 38, '拉针救援', {
          color: '#ffffff',
          fontFamily: 'Arial',
          fontSize: '28px',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
    );

    this.root.add(
      this.scene.add.text(110, 95, '水池', {
        color: '#95cbff',
        fontFamily: 'Arial',
        fontSize: '22px',
      }),
    );
    this.root.add(
      this.scene.add.text(380, 95, '金币仓', {
        color: '#ffd166',
        fontFamily: 'Arial',
        fontSize: '22px',
      }),
    );
    this.root.add(
      this.scene.add.text(380, 270, '汇流层', {
        color: '#d8e2ff',
        fontFamily: 'Arial',
        fontSize: '20px',
      }),
    );
    this.root.add(
      this.scene.add.text(695, 280, '幸存者', {
        color: '#7df29f',
        fontFamily: 'Arial',
        fontSize: '20px',
      }),
    );
    this.root.add(
      this.scene.add.text(390, 437, '熔岩区', {
        color: '#ff9f68',
        fontFamily: 'Arial',
        fontSize: '22px',
      }),
    );
  }

  private createActors() {
    this.lava = this.scene.add.rectangle(455, 445, 200, 42, 0xff6b35, 1);
    this.root.add(this.lava);

    this.waterBlob = this.scene.add.rectangle(190, 150, 116, 86, 0x4aa3ff, 1);
    this.root.add(this.waterBlob);

    this.goldOrbs = [
      this.scene.add.circle(420, 155, 18, 0xf9d65c),
      this.scene.add.circle(470, 145, 18, 0xf9d65c),
      this.scene.add.circle(510, 165, 18, 0xf9d65c),
      this.scene.add.circle(455, 185, 18, 0xf9d65c),
    ];
    this.root.add(this.goldOrbs);

    this.hero = this.scene.add.circle(750, 345, 30, 0x5de29e);
    this.heroFace = this.scene.add.text(735, 330, '^_^', {
      color: '#173524',
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
    });
    this.centerHint = this.scene.add.text(402, 312, '观察插销顺序', {
      color: '#8fa1c9',
      fontFamily: 'Arial',
      fontSize: '18px',
    });
    this.root.add([this.hero, this.heroFace, this.centerHint]);
  }

  private createPins() {
    const pinData = [
      { key: 'water' as const, x: 318, y: 150, label: '1' },
      { key: 'gold' as const, x: 595, y: 212, label: '2' },
      { key: 'gate' as const, x: 642, y: 325, label: '3' },
    ];

    pinData.forEach((item) => {
      const line = this.scene.add.rectangle(item.x, item.y, 18, 110, 0xff5d55, 1);
      const cap = this.scene.add.rectangle(item.x, item.y - 64, 42, 16, 0xf5d9d8, 1);
      const label = this.scene.add.text(item.x - 6, item.y - 13, item.label, {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '22px',
        fontStyle: 'bold',
      });

      this.root.add([line, cap, label]);
      this.pins.push({ key: item.key, x: item.x, y: item.y, line, cap, label, removed: false });
    });
  }

  private pullPin(pin: PinView) {
    pin.removed = true;
    this.moveCount += 1;

    this.scene.tweens.add({
      targets: [pin.line, pin.cap, pin.label],
      x: pin.x + 80,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        pin.line.destroy();
        pin.cap.destroy();
        pin.label.destroy();
      },
    });

    if (pin.key === 'water') {
      this.releaseWater();
    }

    if (pin.key === 'gold') {
      this.releaseGold();
    }

    if (pin.key === 'gate') {
      this.openGate();
    }

    this.emitHud();
  }

  private releaseWater() {
    this.context.emitHud({
      ...BASE_HUD,
      status: '冷却液正在流向熔岩区。',
      moves: `已拉 ${this.moveCount} / 3`,
      hint: '如果火没灭就放金币，广告里通常会当场翻车。',
    });

    this.scene.tweens.add({
      targets: this.waterBlob,
      x: 420,
      y: 410,
      width: 180,
      height: 28,
      duration: 520,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.lavaSafe = true;
        this.scene.tweens.add({
          targets: this.lava,
          fillAlpha: 0.5,
          duration: 200,
        });
        this.lava.setFillStyle(0x7f6b62, 0.85);
        this.centerHint.setText('熔岩已冷却，可以放金币');
        this.emitHud('危险解除，可以继续。');
        if (this.gateOpen && this.goldReady) {
          this.deliverGold();
        }
      },
    });
  }

  private releaseGold() {
    const targetX = this.gateOpen ? 750 : 470;
    const targetY = this.gateOpen ? 340 : 300;

    this.goldOrbs.forEach((orb, index) => {
      this.scene.tweens.add({
        targets: orb,
        x: targetX + (index - 1.5) * 18,
        y: targetY,
        duration: 420,
        ease: 'Sine.easeInOut',
      });
    });

    this.scene.tweens.add({
      targets: this.goldOrbs[0],
      duration: 420,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!this.lavaSafe) {
          this.fail('金币直接掉进了熔岩，角色没救下来。');
          this.scene.tweens.add({
            targets: this.goldOrbs,
            y: 442,
            alpha: 0.15,
            duration: 260,
          });
          return;
        }

        this.goldReady = true;
        this.centerHint.setText(this.gateOpen ? '金币已经直达出口' : '金币已就位，开门即可过关');
        this.emitHud(this.gateOpen ? '金币顺利通过。' : '金币安全到达汇流层。');

        if (this.gateOpen) {
          this.deliverGold();
        }
      },
    });
  }

  private openGate() {
    this.gateOpen = true;
    this.centerHint.setText('出口已开启');
    this.emitHud(this.goldReady ? '出口开启，正在送达奖励。' : '门先开了，接下来把金币送过去。');

    if (this.goldReady && this.lavaSafe) {
      this.deliverGold();
    }
  }

  private deliverGold() {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.goldOrbs.forEach((orb, index) => {
      this.scene.tweens.add({
        targets: orb,
        x: 745 + (index - 1.5) * 12,
        y: 305,
        scale: 0.6,
        duration: 280,
      });
    });
    this.scene.tweens.add({
      targets: [this.hero, this.heroFace],
      y: '-=14',
      yoyo: true,
      repeat: 2,
      duration: 120,
    });
    this.heroFace.setText('^o^');
    this.emitHud('救援成功，点击“重开当前玩法”可以继续试错。');
  }

  private fail(message: string) {
    this.finished = true;
    this.hero.setFillStyle(0xb5b5b5, 1);
    this.heroFace.setText('x_x');
    this.emitHud(message, '#ff8b8b');
  }

  private emitHud(status = BASE_HUD.status, accent = BASE_HUD.accent) {
    const success = this.finished && this.goldReady && this.lavaSafe;

    this.context.emitHud({
      ...BASE_HUD,
      accent,
      status,
      moves: `已拉 ${this.moveCount} / 3`,
      hint: success ? '这一版主打“广告看到的玩法真的能玩”。' : BASE_HUD.hint,
    });
  }
}
