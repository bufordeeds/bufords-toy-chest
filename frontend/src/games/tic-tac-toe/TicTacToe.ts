import { BaseGame } from '../../types/gameFramework';
import type { MultiplayerGame, Player as GamePlayer } from '../../types/gameFramework';
import type { Player, Cell, GameStatus, Move, TicTacToeState, WinCondition } from './types';
import { io, Socket } from 'socket.io-client';

export class TicTacToe extends BaseGame implements MultiplayerGame {
  private static readonly BOARD_SIZE = 3;
  private static readonly MAX_UNDOS = 3;
  
  private undosUsed: number = 0;
  private socket: Socket | null = null;
  private roomCode: string | null = null;
  private playerId: string | null = null;
  private players: GamePlayer[] = [];
  
  readonly type = 'multiplayer' as const;
  
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
  
  // Multiplayer Game interface methods
  async joinRoom(roomCode: string, playerName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        this.socket = io(backendUrl);
      }
      
      this.socket.emit('join-room', { roomCode, playerName });
      
      this.socket.once('room-joined', (data) => {
        this.roomCode = data.roomCode;
        this.playerId = data.playerId;
        
        // Update game state from server
        if (data.gameState) {
          this.syncGameStateFromServer(data.gameState);
        }
        
        resolve();
      });
      
      this.socket.once('error', (error) => {
        reject(new Error(error.message));
      });
      
      this.setupSocketListeners();
    });
  }
  
  async createRoom(playerName?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        this.socket = io(backendUrl);
      }
      
      this.socket.emit('create-room', { gameId: 'tic-tac-toe', playerName });
      
      this.socket.once('room-created', (data) => {
        this.roomCode = data.roomCode;
        this.playerId = data.playerId;
        
        resolve(data.roomCode);
      });
      
      this.socket.once('error', (error) => {
        reject(new Error(error.message));
      });
      
      this.setupSocketListeners();
    });
  }
  
  leaveRoom(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.roomCode = null;
    this.playerId = null;
    this.players = [];
  }
  
  getPlayers(): GamePlayer[] {
    return this.players;
  }
  
  getCurrentPlayer(): GamePlayer | null {
    return this.players.find(p => p.id === this.playerId) || null;
  }
  
  sendGameAction(action: any): void {
    if (this.socket && this.roomCode) {
      this.socket.emit('game-action', {
        roomCode: this.roomCode,
        action
      });
    }
  }
  
  // Multiplayer event handlers
  onPlayerJoined?: (player: GamePlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameAction?: (action: any, playerId: string) => void;
  
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('player-joined', (data) => {
      this.players = data.players;
      this.onPlayerJoined?.(data.players[data.players.length - 1]);
    });
    
    this.socket.on('player-left', (data) => {
      this.players = data.players;
      this.onPlayerLeft?.(data.playerId);
    });
    
    this.socket.on('game-state-updated', (data) => {
      this.syncGameStateFromServer(data.gameState);
      this.onGameAction?.(data.lastAction, data.playerId);
    });
    
    this.socket.on('host-changed', () => {
      // Host changed event - could be used for UI updates if needed
    });
  }
  
  private syncGameStateFromServer(serverState: any): void {
    // Convert server state (flat array) to client state (2D array)
    const board = this.createEmptyBoard();
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      board[row][col] = serverState.board[i];
    }
    
    this.gameState = {
      ...this.gameState,
      board,
      currentPlayer: serverState.currentPlayer,
      gameStatus: serverState.gameStatus === 'finished' ? 
        (serverState.winner === 'tie' ? 'draw' : 'won') : 
        serverState.gameStatus,
      winner: serverState.winner === 'tie' ? null : serverState.winner,
      winningLine: this.calculateWinningLine(board, serverState.winner),
    };
    
    this.onStateChange?.(this.gameState);
  }
  
  private calculateWinningLine(_board: Cell[][], winner: string | null): number[] | null {
    if (!winner || winner === 'tie') return null;
    
    const winCondition = this.getWinCondition();
    if (winCondition) {
      return winCondition.positions.map(([row, col]) => row * 3 + col);
    }
    
    return null;
  }
  
  // Override handleInput to send multiplayer actions
  handleInput(input: { row: number; col: number }): boolean {
    if (!this.isRunning || this.gameState.gameStatus !== 'playing') {
      return false;
    }
    
    const { row, col } = input;
    const position = row * 3 + col;
    
    if (!this.isValidMove(row, col)) {
      return false;
    }
    
    // In multiplayer mode, send action to server
    if (this.socket && this.roomCode) {
      this.sendGameAction({
        type: 'make-move',
        position
      });
      return true;
    }
    
    // Fallback to local game for single player
    this.makeMove(row, col);
    return true;
  }
}