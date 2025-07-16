export interface GameInstance {
  readonly id: string;
  readonly name: string;
  readonly type: 'single' | 'multiplayer';
  
  // Game lifecycle methods
  initialize(): void;
  start(): void;
  pause?(): void;
  resume?(): void;
  end(): void;
  reset(): void;
  
  // Game state
  getState(): any;
  setState(state: any): void;
  
  // Score tracking
  getScore(): number;
  
  // Input handling
  handleInput(input: any): boolean;
  
  // Event callbacks
  onScoreUpdate?: (score: number) => void;
  onGameEnd?: (finalScore: number, won: boolean) => void;
  onStateChange?: (state: any) => void;
}

export interface MultiplayerGame extends GameInstance {
  readonly type: 'multiplayer';
  
  // Multiplayer specific methods
  joinRoom(roomCode: string): Promise<void>;
  createRoom(): Promise<string>;
  leaveRoom(): void;
  
  // Player management
  getPlayers(): Player[];
  getCurrentPlayer(): Player | null;
  
  // Network events
  sendGameAction(action: any): void;
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameAction?: (action: any, playerId: string) => void;
}

export interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface GameConfig {
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  customRules?: Record<string, any>;
}

export abstract class BaseGame implements GameInstance {
  public readonly id: string;
  public readonly name: string;
  public readonly type: 'single' | 'multiplayer';
  
  protected gameState: any;
  protected score: number = 0;
  protected isInitialized: boolean = false;
  protected isRunning: boolean = false;
  
  public onScoreUpdate?: (score: number) => void;
  public onGameEnd?: (finalScore: number, won: boolean) => void;
  public onStateChange?: (state: any) => void;
  
  constructor(id: string, name: string, type: 'single' | 'multiplayer') {
    this.id = id;
    this.name = name;
    this.type = type;
  }
  
  abstract initialize(): void;
  abstract handleInput(input: any): boolean;
  
  start(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
    this.isRunning = true;
  }
  
  pause(): void {
    this.isRunning = false;
  }
  
  resume(): void {
    this.isRunning = true;
  }
  
  end(): void {
    this.isRunning = false;
    this.onGameEnd?.(this.score, this.checkWinCondition());
  }
  
  reset(): void {
    this.score = 0;
    this.isRunning = false;
    this.initialize();
  }
  
  getState(): any {
    return this.gameState;
  }
  
  setState(state: any): void {
    this.gameState = state;
    this.onStateChange?.(state);
  }
  
  getScore(): number {
    return this.score;
  }
  
  protected updateScore(newScore: number): void {
    this.score = newScore;
    this.onScoreUpdate?.(newScore);
  }
  
  protected abstract checkWinCondition(): boolean;
}