import { BaseGame } from '../../types/gameFramework';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  isGameOver: boolean;
  isPaused: boolean;
  isWaiting: boolean;
  score: number;
  highScore: number;
  gridSize: number;
  speed: number;
}

export class Snake extends BaseGame {
  private static readonly DEFAULT_GRID_SIZE = 20;
  private static readonly INITIAL_SPEED = 150; // milliseconds between moves
  private static readonly SPEED_INCREMENT = 5; // speed up every 5 points
  private static readonly MIN_SPEED = 50; // fastest speed
  
  private gameLoop: NodeJS.Timeout | null = null;
  private lastMoveTime: number = 0;
  
  constructor() {
    super('snake', 'Snake', 'single');
  }
  
  initialize(): void {
    const initialSnake: Position[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    
    this.gameState = {
      snake: initialSnake,
      food: this.generateFood(initialSnake, Snake.DEFAULT_GRID_SIZE),
      direction: 'right',
      nextDirection: 'right',
      isGameOver: false,
      isPaused: false,
      isWaiting: true,
      score: 0,
      highScore: 0,
      gridSize: Snake.DEFAULT_GRID_SIZE,
      speed: Snake.INITIAL_SPEED
    };
    
    this.score = 0;
    this.isInitialized = true;
  }
  
  start(): void {
    super.start();
    // Don't start game loop if we're waiting for first input
    if (!this.gameState.isWaiting) {
      this.startGameLoop();
    }
  }
  
  pause(): void {
    super.pause();
    this.gameState.isPaused = true;
    this.stopGameLoop();
    this.onStateChange?.(this.gameState);
  }
  
  resume(): void {
    super.resume();
    this.gameState.isPaused = false;
    this.startGameLoop();
    this.onStateChange?.(this.gameState);
  }
  
  end(): void {
    this.stopGameLoop();
    super.end();
  }
  
  reset(): void {
    this.stopGameLoop();
    super.reset();
  }
  
  handleInput(input: { direction: Direction }): boolean {
    if (!this.isRunning || this.gameState.isGameOver) {
      return false;
    }
    
    const { direction } = input;
    
    // If we're waiting for the first input, start the game
    if (this.gameState.isWaiting) {
      this.gameState.isWaiting = false;
      this.gameState.direction = direction;
      this.gameState.nextDirection = direction;
      this.startGameLoop();
      this.onStateChange?.(this.gameState);
      return true;
    }
    
    // If game is paused, ignore input
    if (this.gameState.isPaused) {
      return false;
    }
    
    const currentDirection = this.gameState.direction;
    
    // Prevent snake from moving back into itself
    const isOpposite = (
      (currentDirection === 'up' && direction === 'down') ||
      (currentDirection === 'down' && direction === 'up') ||
      (currentDirection === 'left' && direction === 'right') ||
      (currentDirection === 'right' && direction === 'left')
    );
    
    if (!isOpposite) {
      // Queue the next direction to prevent multiple direction changes per tick
      this.gameState.nextDirection = direction;
      return true;
    }
    
    return false;
  }
  
  private startGameLoop(): void {
    if (this.gameLoop) {
      return;
    }
    
    const tick = () => {
      const now = Date.now();
      if (now - this.lastMoveTime >= this.gameState.speed) {
        this.moveSnake();
        this.lastMoveTime = now;
      }
      
      if (this.isRunning && !this.gameState.isGameOver && !this.gameState.isPaused && !this.gameState.isWaiting) {
        this.gameLoop = setTimeout(tick, 10);
      }
    };
    
    this.lastMoveTime = Date.now();
    tick();
  }
  
  private stopGameLoop(): void {
    if (this.gameLoop) {
      clearTimeout(this.gameLoop);
      this.gameLoop = null;
    }
  }
  
  private moveSnake(): void {
    const state = this.gameState as SnakeState;
    
    // Update direction from queued next direction
    state.direction = state.nextDirection;
    
    // Calculate new head position
    const head = state.snake[0];
    let newHead: Position;
    
    switch (state.direction) {
      case 'up':
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case 'down':
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case 'left':
        newHead = { x: head.x - 1, y: head.y };
        break;
      case 'right':
        newHead = { x: head.x + 1, y: head.y };
        break;
    }
    
    // Check wall collision
    if (newHead.x < 0 || newHead.x >= state.gridSize || 
        newHead.y < 0 || newHead.y >= state.gridSize) {
      this.gameOver();
      return;
    }
    
    // Check self collision
    if (state.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      this.gameOver();
      return;
    }
    
    // Move snake
    const newSnake = [newHead, ...state.snake];
    
    // Check food collision
    if (newHead.x === state.food.x && newHead.y === state.food.y) {
      // Snake grows (don't remove tail)
      state.score++;
      this.updateScore(state.score);
      
      // Generate new food
      state.food = this.generateFood(newSnake, state.gridSize);
      
      // Increase speed every SPEED_INCREMENT points
      if (state.score % Snake.SPEED_INCREMENT === 0) {
        state.speed = Math.max(Snake.MIN_SPEED, state.speed - 10);
      }
      
      // Update high score
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
    } else {
      // Remove tail (snake doesn't grow)
      newSnake.pop();
    }
    
    state.snake = newSnake;
    this.onStateChange?.(this.gameState);
  }
  
  private generateFood(snake: Position[], gridSize: number = Snake.DEFAULT_GRID_SIZE): Position {
    let food: Position;
    
    do {
      food = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    
    return food;
  }
  
  private gameOver(): void {
    this.gameState.isGameOver = true;
    this.stopGameLoop();
    this.end();
  }
  
  protected checkWinCondition(): boolean {
    // Snake doesn't have a win condition, just high scores
    return false;
  }
  
  public getSpeed(): number {
    return this.gameState.speed;
  }
  
  public getGridSize(): number {
    return this.gameState.gridSize;
  }
}