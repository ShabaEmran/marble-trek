
export enum GameState {
  INTRO = 'INTRO',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  PREPARING = 'PREPARING',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER'
}

export interface LevelConfig {
  id: number;
  width: number;
  height: number;
  maze: number[][]; // 0: path, 1: wall, 2: goal
  coins: { x: number; z: number }[];
}

export interface GameScore {
  total: number;       // Cumulative total score
  levelPoints: number;  // Points earned in current level
  levelCoins: number;   // Coins collected in current level
  levelTotalCoins: number;
  levelTime: number;    // Time spent in current level (seconds)
}
