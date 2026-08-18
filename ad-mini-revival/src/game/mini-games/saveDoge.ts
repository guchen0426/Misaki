import Phaser from 'phaser';

import type { HudState, MiniGame, MiniGameContext } from '../types';

interface Bee {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
}

interface Point {
  x: number;
  y: number;
}

const ARENA = {
  left: 110,
  right: 790,
  top: 70,
  bottom: 500,
};

const DOG = {
  x: 450,
  y: 350,
  radius: 28,
};

const BASE_HUD: HudState = {
  banner: '广告原型 03',
  objective: '画线保护小狗，坚持 8 秒不被蜜蜂碰到。',
  status: '按住拖拽画线，松手后蜂群开始进攻。',
  moves: '剩余墨水 340',
  hint: '优先围住小狗上半身，给蜜蜂留一个会反弹的弧面。',
  accent: '#ffd166',
};

export class SaveDogeGame implements MiniGame {
  private readonly context: MiniGameContext;

  private readonly root = this.scene.add.container(0, 0);

  private readonly frame = this.scene.add.graphics();

  private readonly line = this.scene.add.graphics();

  private readonly beeLayer = this.scene.add.container(0, 0);

  private dog!: Phaser.GameObjects.Arc;

  private dogFace!: Phaser.GameObjects.Text;

  private hive!: Phaser.GameObjects.Arc;

  private hiveText!: Phaser.GameObjects.Text;

  private bees: Bee[] = [];

  private points: Point[] = [];

  private drawing = false;

  private started = false;

  private finished = false;

  private inkUsed = 0;

  private elapsed = 0;

  constructor(context: MiniGameContext) {
    this.context = context;
  }

  private get scene() {
    return this.context.scene;
  }

  mount() {
    this.root.add([this.frame, this.line, this.beeLayer]);
    this.drawArena();
    this.createActors();
    this.emitHud();
  }

  unmount() {
    this.root.destroy(true);
  }

  update(_time: number, delta: number) {
    if (!this.started || this.finished) {
      return;
    }

    const dt = Math.min(delta / 1000, 0.03);
    this.elapsed += dt;

    this.bees.forEach((bee) => {
      const toDogX = DOG.x - bee.sprite.x;
      const toDogY = DOG.y - bee.sprite.y;
      const toDogLength = Math.max(Math.hypot(toDogX, toDogY), 0.0001);

      bee.vx += (toDogX / toDogLength) * 12 * dt;
      bee.vy += (toDogY / toDogLength) * 12 * dt;

      bee.sprite.x += bee.vx * dt;
      bee.sprite.y += bee.vy * dt;

      if (bee.sprite.x < ARENA.left + 10 || bee.sprite.x > ARENA.right - 10) {
        bee.vx *= -1;
        bee.sprite.x = Phaser.Math.Clamp(bee.sprite.x, ARENA.left + 10, ARENA.right - 10);
      }

      if (bee.sprite.y < ARENA.top + 10 || bee.sprite.y > ARENA.bottom - 10) {
        bee.vy *= -1;
        bee.sprite.y = Phaser.Math.Clamp(bee.sprite.y, ARENA.top + 10, ARENA.bottom - 10);
      }

      this.reflectAgainstLine(bee);

      const dogDistance = Math.hypot(bee.sprite.x - DOG.x, bee.sprite.y - DOG.y);
      if (dogDistance < DOG.radius + 8) {
        this.fail('蜜蜂碰到小狗了，线条还不够稳。');
      }
    });

    if (!this.finished) {
      const remain = Math.max(0, 8 - this.elapsed);
      this.context.emitHud({
        ...BASE_HUD,
        status: `蜂群进攻中，坚持 ${remain.toFixed(1)} 秒。`,
        moves: `剩余墨水 ${Math.max(0, Math.round(340 - this.inkUsed))}`,
        hint: '这类广告的乐趣在于“险些穿过去但又刚好挡住”。',
        accent: BASE_HUD.accent,
      });
    }

    if (this.elapsed >= 8 && !this.finished) {
      this.complete();
    }
  }

  pointerDown(pointer: Phaser.Input.Pointer) {
    if (this.started || this.finished) {
      return;
    }

    if (!this.isInArena(pointer.worldX, pointer.worldY)) {
      return;
    }

    this.drawing = true;
    this.points = [{ x: pointer.worldX, y: pointer.worldY }];
    this.inkUsed = 0;
    this.redrawLine();
    this.emitHud('正在画线，松手后开始防守。');
  }

  pointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.drawing || this.started || this.finished) {
      return;
    }

    if (!this.isInArena(pointer.worldX, pointer.worldY)) {
      return;
    }

    const last = this.points[this.points.length - 1];
    const distance = Math.hypot(pointer.worldX - last.x, pointer.worldY - last.y);
    if (distance < 6) {
      return;
    }

    if (this.inkUsed + distance > 340) {
      return;
    }

    this.inkUsed += distance;
    this.points.push({ x: pointer.worldX, y: pointer.worldY });
    this.redrawLine();
    this.context.emitHud({
      ...BASE_HUD,
      status: '线条越完整，反弹效果越稳定。',
      moves: `剩余墨水 ${Math.max(0, Math.round(340 - this.inkUsed))}`,
      hint: BASE_HUD.hint,
      accent: BASE_HUD.accent,
    });
  }

  pointerUp() {
    if (!this.drawing || this.started || this.finished) {
      return;
    }

    this.drawing = false;
    if (this.points.length < 2) {
      this.emitHud('线太短了，重新画一条。');
      this.points = [];
      this.redrawLine();
      return;
    }

    this.startSwarm();
  }

  restart() {
    this.unmount();
    this.bees = [];
    this.points = [];
    this.drawing = false;
    this.started = false;
    this.finished = false;
    this.inkUsed = 0;
    this.elapsed = 0;
    this.mount();
  }

  private drawArena() {
    this.frame.clear();
    this.frame.fillStyle(0x1d2233, 1);
    this.frame.fillRoundedRect(80, 26, 740, 510, 28);
    this.frame.lineStyle(4, 0x39415a, 1);
    this.frame.strokeRoundedRect(80, 26, 740, 510, 28);
    this.frame.fillStyle(0x111728, 1);
    this.frame.fillRoundedRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 24);
    this.frame.lineStyle(3, 0x303955, 1);
    this.frame.strokeRoundedRect(ARENA.left, ARENA.top, ARENA.right - ARENA.left, ARENA.bottom - ARENA.top, 24);

    this.root.add(
      this.scene.add.text(110, 34, '画线救狗', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px',
        fontStyle: 'bold',
      }),
    );
    this.root.add(
      this.scene.add.text(110, 72, '松手后蜂群就会来袭', {
        color: '#99a9cc',
        fontFamily: 'Arial',
        fontSize: '18px',
      }),
    );
  }

  private createActors() {
    this.hive = this.scene.add.circle(450, 145, 40, 0x8c5a2d);
    this.hiveText = this.scene.add.text(428, 132, '蜂窝', {
      color: '#fff2cf',
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
    });
    this.dog = this.scene.add.circle(DOG.x, DOG.y, DOG.radius, 0xffd95a);
    this.dogFace = this.scene.add.text(DOG.x - 20, DOG.y - 10, 'UoU', {
      color: '#3e2a0d',
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
    });

    this.root.add([this.hive, this.hiveText, this.dog, this.dogFace]);
  }

  private startSwarm() {
    this.started = true;
    this.spawnBees();
    this.emitHud('蜂群已出动，坚持住。');
  }

  private spawnBees() {
    this.bees = Array.from({ length: 8 }, (_, index) => {
      const angle = (-110 + index * 30) * (Math.PI / 180);
      const sprite = this.scene.add.circle(
        this.hive.x + Math.cos(angle) * 52,
        this.hive.y + Math.sin(angle) * 18,
        8,
        0xffd24d,
      );
      this.beeLayer.add(sprite);
      return {
        sprite,
        vx: Math.cos(angle) * 90,
        vy: 65 + Math.sin(angle) * 35,
      };
    });
  }

  private redrawLine() {
    this.line.clear();
    if (this.points.length < 2) {
      return;
    }

    this.line.lineStyle(10, 0x8af6e2, 1);
    this.line.beginPath();
    this.line.moveTo(this.points[0].x, this.points[0].y);
    for (let index = 1; index < this.points.length; index += 1) {
      this.line.lineTo(this.points[index].x, this.points[index].y);
    }
    this.line.strokePath();
  }

  private reflectAgainstLine(bee: Bee) {
    if (this.points.length < 2) {
      return;
    }

    for (let index = 1; index < this.points.length; index += 1) {
      const start = this.points[index - 1];
      const end = this.points[index];
      const projection = projectPointToSegment(bee.sprite.x, bee.sprite.y, start, end);
      const dx = bee.sprite.x - projection.x;
      const dy = bee.sprite.y - projection.y;
      const distance = Math.hypot(dx, dy);

      if (distance >= 13) {
        continue;
      }

      const nx = distance > 0.001 ? dx / distance : 0;
      const ny = distance > 0.001 ? dy / distance : -1;
      const dot = bee.vx * nx + bee.vy * ny;

      if (dot < 0) {
        bee.vx -= 2 * dot * nx;
        bee.vy -= 2 * dot * ny;
        bee.sprite.x = projection.x + nx * 14;
        bee.sprite.y = projection.y + ny * 14;
      }
    }
  }

  private complete() {
    this.finished = true;
    this.dogFace.setText('^o^');
    this.context.emitHud({
      ...BASE_HUD,
      accent: '#7bd88f',
      status: '防守成功，小狗活下来了。',
      moves: `剩余墨水 ${Math.max(0, Math.round(340 - this.inkUsed))}`,
      hint: '这一套可以继续扩展成“蜜蜂、落石、激光”等多种威胁模板。',
    });
  }

  private fail(message: string) {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.dog.setFillStyle(0xb9b0a4, 1);
    this.dogFace.setText('x_x');
    this.context.emitHud({
      ...BASE_HUD,
      accent: '#ff8b8b',
      status: message,
      moves: `剩余墨水 ${Math.max(0, Math.round(340 - this.inkUsed))}`,
      hint: '可以尝试把线画得更靠近蜂窝落点。',
    });
  }

  private emitHud(status = BASE_HUD.status) {
    this.context.emitHud({
      ...BASE_HUD,
      status,
      moves: `剩余墨水 ${Math.max(0, Math.round(340 - this.inkUsed))}`,
    });
  }

  private isInArena(x: number, y: number) {
    return x >= ARENA.left && x <= ARENA.right && y >= ARENA.top && y <= ARENA.bottom;
  }
}

function projectPointToSegment(px: number, py: number, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return { x: start.x, y: start.y };
  }

  const t = Phaser.Math.Clamp(((px - start.x) * dx + (py - start.y) * dy) / lengthSq, 0, 1);

  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
}
