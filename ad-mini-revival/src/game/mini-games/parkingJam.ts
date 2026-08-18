import Phaser from 'phaser';

import type { HudState, MiniGame, MiniGameContext } from '../types';

type Orientation = 'h' | 'v';

interface VehicleState {
  id: string;
  x: number;
  y: number;
  length: number;
  orientation: Orientation;
  color: number;
  label: string;
}

interface VehicleView {
  data: VehicleState;
  body: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

interface Level {
  exitRow: number;
  vehicles: VehicleState[];
}

const LEVEL: Level = {
  exitRow: 2,
  vehicles: [
    { id: 'target', x: 1, y: 2, length: 2, orientation: 'h', color: 0xff7b72, label: '你' },
    { id: 'v1', x: 0, y: 0, length: 3, orientation: 'v', color: 0x53b3cb, label: 'A' },
    { id: 'v2', x: 3, y: 0, length: 2, orientation: 'v', color: 0xf0b35f, label: 'B' },
    { id: 'v3', x: 4, y: 1, length: 2, orientation: 'v', color: 0x7d6df6, label: 'C' },
    { id: 'v4', x: 1, y: 0, length: 2, orientation: 'h', color: 0x8ad68a, label: 'D' },
    { id: 'v5', x: 1, y: 3, length: 2, orientation: 'v', color: 0x47c2a6, label: 'E' },
    { id: 'v6', x: 2, y: 4, length: 3, orientation: 'h', color: 0xffc857, label: 'F' },
    { id: 'v7', x: 5, y: 3, length: 2, orientation: 'v', color: 0x5d89ff, label: 'G' },
    { id: 'v8', x: 0, y: 5, length: 2, orientation: 'h', color: 0xe384d8, label: 'H' },
  ],
};

const BOARD = {
  cols: 6,
  rows: 6,
  cell: 74,
  originX: 205,
  originY: 74,
};

const BASE_HUD: HudState = {
  banner: '广告原型 02',
  objective: '拖动车辆，给红车让出离场路线。',
  status: '先观察出口行，再从长车开始挪位。',
  moves: '拖动 0 次',
  hint: '车辆只能沿车身方向移动，红车滑出右侧即过关。',
  accent: '#6ab2ff',
};

export class ParkingJamGame implements MiniGame {
  private readonly context: MiniGameContext;

  private root!: Phaser.GameObjects.Container;

  private graphics!: Phaser.GameObjects.Graphics;

  private readonly views = new Map<string, VehicleView>();

  private vehicles: VehicleState[] = [];

  private activeId: string | null = null;

  private dragStart = 0;

  private dragOrigin = 0;

  private dragMoved = false;

  private moveCount = 0;

  private finished = false;

  constructor(context: MiniGameContext) {
    this.context = context;
  }

  private get scene() {
    return this.context.scene;
  }

  mount() {
    this.root = this.scene.add.container(0, 0);
    this.graphics = this.scene.add.graphics();
    this.root.add(this.graphics);
    this.resetLevel();
    this.drawBoard();
    this.createViews();
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

    const hit = this.vehicles
      .map((vehicle) => this.views.get(vehicle.id))
      .find((view) => view && view.body.getBounds().contains(pointer.worldX, pointer.worldY));

    if (!hit) {
      return;
    }

    this.activeId = hit.data.id;
    this.dragMoved = false;
    this.dragStart = hit.data.orientation === 'h' ? pointer.worldX : pointer.worldY;
    this.dragOrigin = hit.data.orientation === 'h' ? hit.data.x : hit.data.y;
    hit.body.setStrokeStyle(4, 0xffffff, 0.9);
  }

  pointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.activeId || this.finished) {
      return;
    }

    const vehicle = this.vehicles.find((item) => item.id === this.activeId);
    if (!vehicle) {
      return;
    }

    const delta = vehicle.orientation === 'h' ? pointer.worldX - this.dragStart : pointer.worldY - this.dragStart;
    const cellDelta = Math.round(delta / BOARD.cell);
    const range = this.getTravelRange(vehicle);
    const nextValue = Phaser.Math.Clamp(this.dragOrigin + cellDelta, range.min, range.max);

    if (vehicle.orientation === 'h' && vehicle.x !== nextValue) {
      vehicle.x = nextValue;
      this.dragMoved = true;
      this.syncVehicle(vehicle);
    }

    if (vehicle.orientation === 'v' && vehicle.y !== nextValue) {
      vehicle.y = nextValue;
      this.dragMoved = true;
      this.syncVehicle(vehicle);
    }
  }

  pointerUp() {
    if (!this.activeId) {
      return;
    }

    const vehicle = this.vehicles.find((item) => item.id === this.activeId);
    const view = this.views.get(this.activeId);

    if (view) {
      view.body.setStrokeStyle(3, 0xf5f7ff, 0.45);
    }

    if (vehicle && this.dragMoved) {
      this.moveCount += 1;
      this.emitHud(`已拖动车辆 ${vehicle.label}。`);
      if (vehicle.id === 'target' && vehicle.x >= BOARD.cols - 1) {
        this.complete();
      }
    }

    this.activeId = null;
  }

  restart() {
    this.unmount();
    this.views.clear();
    this.moveCount = 0;
    this.finished = false;
    this.mount();
  }

  private resetLevel() {
    this.vehicles = LEVEL.vehicles.map((vehicle) => ({ ...vehicle }));
  }

  private drawBoard() {
    this.graphics.clear();
    this.graphics.fillStyle(0x1a2031, 1);
    this.graphics.fillRoundedRect(155, 26, 540, 510, 28);
    this.graphics.lineStyle(4, 0x35405b, 1);
    this.graphics.strokeRoundedRect(155, 26, 540, 510, 28);

    this.graphics.fillStyle(0x11182a, 1);
    this.graphics.fillRoundedRect(BOARD.originX - 8, BOARD.originY - 8, BOARD.cols * BOARD.cell + 16, BOARD.rows * BOARD.cell + 16, 18);

    this.graphics.lineStyle(2, 0x28324d, 1);
    for (let x = 0; x <= BOARD.cols; x += 1) {
      const px = BOARD.originX + x * BOARD.cell;
      this.graphics.lineBetween(px, BOARD.originY, px, BOARD.originY + BOARD.rows * BOARD.cell);
    }
    for (let y = 0; y <= BOARD.rows; y += 1) {
      const py = BOARD.originY + y * BOARD.cell;
      this.graphics.lineBetween(BOARD.originX, py, BOARD.originX + BOARD.cols * BOARD.cell, py);
    }

    this.graphics.fillStyle(0x23304d, 1);
    this.graphics.fillRoundedRect(BOARD.originX + BOARD.cols * BOARD.cell + 8, BOARD.originY + LEVEL.exitRow * BOARD.cell + 14, 54, 46, 14);
    this.graphics.fillStyle(0x9fe7ab, 1);
    this.graphics.fillTriangle(666, 250, 695, 274, 666, 298);

    this.root.add(
      this.scene.add.text(182, 34, '停车解堵', {
        color: '#ffffff',
        fontFamily: 'Arial',
        fontSize: '28px',
        fontStyle: 'bold',
      }),
    );
    this.root.add(
      this.scene.add.text(182, 70, '把红车拖到右侧出口', {
        color: '#93a5ce',
        fontFamily: 'Arial',
        fontSize: '18px',
      }),
    );
  }

  private createViews() {
    this.vehicles.forEach((vehicle) => {
      const width = vehicle.orientation === 'h' ? vehicle.length * BOARD.cell - 12 : BOARD.cell - 12;
      const height = vehicle.orientation === 'v' ? vehicle.length * BOARD.cell - 12 : BOARD.cell - 12;

      const body = this.scene.add.rectangle(0, 0, width, height, vehicle.color, 1);
      body.setStrokeStyle(3, 0xf5f7ff, 0.45);

      const text = this.scene.add.text(0, 0, vehicle.label, {
        color: vehicle.id === 'target' ? '#4a1313' : '#13223d',
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
      });
      text.setOrigin(0.5, 0.5);

      this.root.add([body, text]);
      this.views.set(vehicle.id, { data: vehicle, body, text });
      this.syncVehicle(vehicle);
    });
  }

  private syncVehicle(vehicle: VehicleState) {
    const view = this.views.get(vehicle.id);
    if (!view) {
      return;
    }

    const width = vehicle.orientation === 'h' ? vehicle.length * BOARD.cell - 12 : BOARD.cell - 12;
    const height = vehicle.orientation === 'v' ? vehicle.length * BOARD.cell - 12 : BOARD.cell - 12;

    view.body.setPosition(
      BOARD.originX + vehicle.x * BOARD.cell + width / 2 + 6,
      BOARD.originY + vehicle.y * BOARD.cell + height / 2 + 6,
    );
    view.text.setPosition(view.body.x, view.body.y);
  }

  private getTravelRange(vehicle: VehicleState) {
    const occupancy = new Set<string>();

    this.vehicles
      .filter((item) => item.id !== vehicle.id)
      .forEach((item) => {
        const cells = item.orientation === 'h'
          ? Array.from({ length: item.length }, (_, index) => `${item.x + index},${item.y}`)
          : Array.from({ length: item.length }, (_, index) => `${item.x},${item.y + index}`);

        cells.forEach((cell) => occupancy.add(cell));
      });

    let min = vehicle.orientation === 'h' ? vehicle.x : vehicle.y;
    let max = min;

    if (vehicle.orientation === 'h') {
      while (min - 1 >= 0 && !occupancy.has(`${min - 1},${vehicle.y}`)) {
        min -= 1;
      }

      while (
        max + vehicle.length < BOARD.cols &&
        !occupancy.has(`${max + vehicle.length},${vehicle.y}`)
      ) {
        max += 1;
      }

      if (
        vehicle.id === 'target' &&
        vehicle.y === LEVEL.exitRow &&
        max === BOARD.cols - vehicle.length
      ) {
        max += 1;
      }
    } else {
      while (min - 1 >= 0 && !occupancy.has(`${vehicle.x},${min - 1}`)) {
        min -= 1;
      }

      while (
        max + vehicle.length < BOARD.rows &&
        !occupancy.has(`${vehicle.x},${max + vehicle.length}`)
      ) {
        max += 1;
      }
    }

    return { min, max };
  }

  private complete() {
    if (this.finished) {
      return;
    }

    this.finished = true;
    const target = this.vehicles.find((vehicle) => vehicle.id === 'target');
    const view = this.views.get('target');

    if (target && view) {
      this.scene.tweens.add({
        targets: [view.body, view.text],
        x: '+=80',
        duration: 280,
        ease: 'Sine.easeInOut',
      });
    }

    this.emitHud('车位已清空，目标车辆顺利出场。', '#7bd88f');
  }

  private emitHud(status = BASE_HUD.status, accent = BASE_HUD.accent) {
    this.context.emitHud({
      ...BASE_HUD,
      accent,
      status,
      moves: `拖动 ${this.moveCount} 次`,
    });
  }
}
