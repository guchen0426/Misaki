import Phaser from 'phaser';

export type GameId = 'pin-rescue' | 'parking-jam' | 'save-doge';

export interface ResearchTopic {
  title: string;
  summary: string;
  signal: string;
  reason: string;
}

export interface GameMeta {
  id: GameId;
  title: string;
  genre: string;
  hook: string;
  focus: string;
  controls: string;
  difficulty: string;
}

export interface HudState {
  banner: string;
  objective: string;
  status: string;
  moves: string;
  hint: string;
  accent: string;
}

export interface MiniGameContext {
  scene: Phaser.Scene;
  emitHud: (state: HudState) => void;
}

export interface MiniGame {
  mount(): void;
  unmount(): void;
  update(time: number, delta: number): void;
  pointerDown(pointer: Phaser.Input.Pointer): void;
  pointerMove(pointer: Phaser.Input.Pointer): void;
  pointerUp(pointer: Phaser.Input.Pointer): void;
  restart(): void;
}
