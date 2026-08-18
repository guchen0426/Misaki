import type { GameId, MiniGameContext } from './types';
import type { MiniGame } from './types';
import { ParkingJamGame } from './mini-games/parkingJam';
import { PinRescueGame } from './mini-games/pinRescue';
import { SaveDogeGame } from './mini-games/saveDoge';

export function createMiniGame(gameId: GameId, context: MiniGameContext): MiniGame {
  if (gameId === 'parking-jam') {
    return new ParkingJamGame(context);
  }

  if (gameId === 'save-doge') {
    return new SaveDogeGame(context);
  }

  return new PinRescueGame(context);
}
