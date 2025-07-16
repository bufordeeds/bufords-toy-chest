export type Player = 'X' | 'O';
export type Cell = Player | null;
export type GameStatus = 'waiting' | 'playing' | 'won' | 'draw';

export interface Move {
  row: number;
  col: number;
  player: Player;
  moveNumber: number;
}

export interface PlayerScores {
  X: number;
  O: number;
  draws: number;
}

export interface TicTacToeState {
  board: Cell[][];
  currentPlayer: Player;
  gameStatus: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
  moveHistory: Move[];
  scores: PlayerScores;
  canUndo: boolean;
  gameCount: number;
}

export interface WinCondition {
  type: 'row' | 'col' | 'diagonal';
  index: number;
  positions: [number, number][];
}