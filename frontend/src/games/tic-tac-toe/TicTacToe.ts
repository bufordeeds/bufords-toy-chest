import { BaseGame } from '../../types/gameFramework';
import type { Player, Cell, GameStatus, Move, TicTacToeState, WinCondition } from './types';

export class TicTacToe extends BaseGame {
  private static readonly BOARD_SIZE = 3;
  private static readonly MAX_UNDOS = 3;
  
  private undosUsed: number = 0;
  
  constructor() {
    super('tic-tac-toe', 'Tic-Tac-Toe', 'multiplayer');
  }
  
  initialize(): void {
    this.gameState = {
      board: this.createEmptyBoard(),
      currentPlayer: 'X' as Player,
      gameStatus: 'playing' as GameStatus,
      winner: null,
      winningLine: null,
      moveHistory: [],
      scores: { X: 0, O: 0, draws: 0 },
      canUndo: false,
      gameCount: 0,
    };
    
    this.score = 0;
    this.undosUsed = 0;
    this.isInitialized = true;
  }
  
  handleInput(input: { row: number; col: number }): boolean {
    if (!this.isRunning || this.gameState.gameStatus !== 'playing') {
      return false;
    }
    
    const { row, col } = input;
    
    if (!this.isValidMove(row, col)) {
      return false;
    }
    
    this.makeMove(row, col);
    return true;
  }
  
  private createEmptyBoard(): Cell[][] {
    return Array(TicTacToe.BOARD_SIZE).fill(null).map(() => 
      Array(TicTacToe.BOARD_SIZE).fill(null)
    );
  }
  
  private isValidMove(row: number, col: number): boolean {
    if (row < 0 || row >= TicTacToe.BOARD_SIZE || col < 0 || col >= TicTacToe.BOARD_SIZE) {
      return false;
    }
    
    return this.gameState.board[row][col] === null;
  }
  
  private makeMove(row: number, col: number): void {
    const state = this.gameState as TicTacToeState;
    
    // Create new board with the move
    const newBoard = state.board.map(boardRow => [...boardRow]);
    newBoard[row][col] = state.currentPlayer;
    
    // Create move record
    const move: Move = {
      row,
      col,
      player: state.currentPlayer,
      moveNumber: state.moveHistory.length + 1,
    };
    
    // Update game state
    this.gameState = {
      ...state,
      board: newBoard,
      moveHistory: [...state.moveHistory, move],
      canUndo: this.undosUsed < TicTacToe.MAX_UNDOS && state.moveHistory.length >= 0,
    };
    
    // Check for win or draw
    const winCondition = this.getWinCondition();
    if (winCondition) {
      this.handleGameEnd(state.currentPlayer, winCondition);
    } else if (this.isBoardFull()) {
      this.handleDraw();
    } else {
      // Switch players
      this.gameState.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    }
    
    this.onStateChange?.(this.gameState);
  }
  
  private handleGameEnd(winner: Player, winCondition: WinCondition): void {
    const state = this.gameState as TicTacToeState;
    
    this.gameState = {
      ...state,
      gameStatus: 'won',
      winner,
      winningLine: winCondition.positions.flat(),
      canUndo: false,
    };
    
    // Update scores
    const newScores = { ...state.scores };
    newScores[winner]++;
    this.gameState.scores = newScores;
    this.gameState.gameCount++;
    
    // Calculate score for leaderboard (wins - losses)
    const finalScore = newScores.X - newScores.O;
    this.updateScore(Math.abs(finalScore));
    
    this.end();
  }
  
  private handleDraw(): void {
    const state = this.gameState as TicTacToeState;
    
    this.gameState = {
      ...state,
      gameStatus: 'draw',
      winner: null,
      canUndo: false,
    };
    
    // Update scores
    const newScores = { ...state.scores };
    newScores.draws++;
    this.gameState.scores = newScores;
    this.gameState.gameCount++;
    
    this.end();
  }
  
  private isBoardFull(): boolean {
    const state = this.gameState as TicTacToeState;
    return state.board.every(row => row.every(cell => cell !== null));
  }
  
  protected checkWinCondition(): boolean {
    return this.getWinCondition() !== null;
  }
  
  private getWinCondition(): WinCondition | null {
    const state = this.gameState as TicTacToeState;
    const board = state.board;
    
    // Check rows
    for (let row = 0; row < TicTacToe.BOARD_SIZE; row++) {
      if (board[row][0] && 
          board[row][0] === board[row][1] && 
          board[row][1] === board[row][2]) {
        return {
          type: 'row',
          index: row,
          positions: [[row, 0], [row, 1], [row, 2]],
        };
      }
    }
    
    // Check columns
    for (let col = 0; col < TicTacToe.BOARD_SIZE; col++) {
      if (board[0][col] && 
          board[0][col] === board[1][col] && 
          board[1][col] === board[2][col]) {
        return {
          type: 'col',
          index: col,
          positions: [[0, col], [1, col], [2, col]],
        };
      }
    }
    
    // Check diagonals
    if (board[0][0] && 
        board[0][0] === board[1][1] && 
        board[1][1] === board[2][2]) {
      return {
        type: 'diagonal',
        index: 0,
        positions: [[0, 0], [1, 1], [2, 2]],
      };
    }
    
    if (board[0][2] && 
        board[0][2] === board[1][1] && 
        board[1][1] === board[2][0]) {
      return {
        type: 'diagonal',
        index: 1,
        positions: [[0, 2], [1, 1], [2, 0]],
      };
    }
    
    return null;
  }
  
  public undoLastMove(): boolean {
    const state = this.gameState as TicTacToeState;
    
    if (!state.canUndo || state.moveHistory.length === 0 || this.undosUsed >= TicTacToe.MAX_UNDOS) {
      return false;
    }
    
    // Remove last move
    const newMoveHistory = state.moveHistory.slice(0, -1);
    const newBoard = this.createEmptyBoard();
    
    // Replay all moves except the last one
    newMoveHistory.forEach(move => {
      newBoard[move.row][move.col] = move.player;
    });
    
    // Determine current player (opposite of last move's player)
    const lastMove = state.moveHistory[state.moveHistory.length - 1];
    const currentPlayer = lastMove.player === 'X' ? 'O' : 'X';
    
    this.undosUsed++;
    
    this.gameState = {
      ...state,
      board: newBoard,
      currentPlayer,
      gameStatus: 'playing',
      winner: null,
      winningLine: null,
      moveHistory: newMoveHistory,
      canUndo: this.undosUsed < TicTacToe.MAX_UNDOS && newMoveHistory.length > 0,
    };
    
    this.onStateChange?.(this.gameState);
    return true;
  }
  
  public getUndosRemaining(): number {
    return Math.max(0, TicTacToe.MAX_UNDOS - this.undosUsed);
  }
  
  public newGame(): void {
    const state = this.gameState as TicTacToeState;
    
    this.gameState = {
      ...state,
      board: this.createEmptyBoard(),
      currentPlayer: 'X',
      gameStatus: 'playing',
      winner: null,
      winningLine: null,
      moveHistory: [],
      canUndo: false,
    };
    
    this.undosUsed = 0;
    this.start();
    this.onStateChange?.(this.gameState);
  }
  
  reset(): void {
    this.undosUsed = 0;
    super.reset();
  }
}