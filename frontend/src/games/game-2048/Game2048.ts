import { BaseGame } from '../../types/gameFramework';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileAnimation {
  type: 'new' | 'merged' | 'slide';
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  value?: number;
}

export interface Game2048State {
  board: number[][];
  score: number;
  isGameOver: boolean;
  hasWon: boolean;
  canUndo: boolean;
  previousBoard?: number[][];
  previousScore?: number;
  animations: TileAnimation[][];
  lastMove?: Direction;
}

export class Game2048 extends BaseGame {
  private static readonly BOARD_SIZE = 4;
  private static readonly WIN_TILE = 2048;
  
  constructor() {
    super('2048', '2048', 'single');
  }
  
  initialize(): void {
    this.gameState = {
      board: this.createEmptyBoard(),
      score: 0,
      isGameOver: false,
      hasWon: false,
      canUndo: false,
      animations: this.createEmptyAnimationBoard(),
    };
    
    this.score = 0; // Reset base class score
    
    // Add two initial tiles with animation
    this.addRandomTileWithAnimation();
    this.addRandomTileWithAnimation();
    
    this.isInitialized = true;
    
  }
  
  handleInput(input: { direction: Direction }): boolean {
    if (!this.isRunning || this.gameState.isGameOver) {
      return false;
    }
    
    const { direction } = input;
    
    // Clear previous animations
    this.clearAnimations();
    
    const previousBoard = this.cloneBoard(this.gameState.board);
    const previousScore = this.gameState.score;
    
    let moved = false;
    
    switch (direction) {
      case 'left':
        moved = this.moveLeft();
        break;
      case 'right':
        moved = this.moveRight();
        break;
      case 'up':
        moved = this.moveUp();
        break;
      case 'down':
        moved = this.moveDown();
        break;
    }
    
    if (moved) {
      // Save previous state for undo
      this.gameState.previousBoard = previousBoard;
      this.gameState.previousScore = previousScore;
      this.gameState.canUndo = true;
      
      // Add new tile with animation
      this.addRandomTileWithAnimation();
      
      // Store the direction for animation reference
      this.gameState.lastMove = direction;
      
      // Update score
      this.updateScore(this.gameState.score);
      
      // Check win condition
      if (!this.gameState.hasWon && this.checkForWin()) {
        this.gameState.hasWon = true;
      }
      
      // Check game over
      if (this.checkGameOver()) {
        this.gameState.isGameOver = true;
        this.end();
      }
      
      // Create a new state object for React to detect changes
      this.onStateChange?.({ ...this.gameState, board: this.gameState.board.map((row: number[]) => [...row]) });
    }
    
    return moved;
  }
  
  undo(): boolean {
    if (!this.gameState.canUndo || !this.gameState.previousBoard) {
      return false;
    }
    
    this.gameState.board = this.gameState.previousBoard;
    this.gameState.score = this.gameState.previousScore || 0;
    this.gameState.canUndo = false;
    this.gameState.previousBoard = undefined;
    this.gameState.previousScore = undefined;
    
    this.updateScore(this.gameState.score);
    this.onStateChange?.({ ...this.gameState, board: this.gameState.board.map((row: number[]) => [...row]) });
    
    return true;
  }
  
  private createEmptyBoard(): number[][] {
    return Array(Game2048.BOARD_SIZE).fill(null).map(() => 
      Array(Game2048.BOARD_SIZE).fill(0)
    );
  }
  
  private createEmptyAnimationBoard(): TileAnimation[][] {
    return Array(Game2048.BOARD_SIZE).fill(null).map(() => 
      Array(Game2048.BOARD_SIZE).fill(null).map(() => ({ type: 'new' }))
    );
  }
  
  private clearAnimations(): void {
    this.gameState.animations = this.createEmptyAnimationBoard();
  }
  
  private cloneBoard(board: number[][]): number[][] {
    return board.map(row => [...row]);
  }
  
  private getEmptyCells(): Array<{ row: number; col: number }> {
    const emptyCells: Array<{ row: number; col: number }> = [];
    
    for (let row = 0; row < Game2048.BOARD_SIZE; row++) {
      for (let col = 0; col < Game2048.BOARD_SIZE; col++) {
        if (this.gameState.board[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    
    return emptyCells;
  }
  
  
  private addRandomTileWithAnimation(): void {
    const emptyCells = this.getEmptyCells();
    
    if (emptyCells.length === 0) {
      return;
    }
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4; // 90% chance for 2, 10% for 4
    
    this.gameState.board[randomCell.row][randomCell.col] = value;
    this.gameState.animations[randomCell.row][randomCell.col] = {
      type: 'new',
      value: value
    };
  }
  
  private moveLeft(): boolean {
    let moved = false;
    
    for (let row = 0; row < Game2048.BOARD_SIZE; row++) {
      const originalRow = [...this.gameState.board[row]];
      const { row: newRow, scoreGained } = this.slideAndMergeRowWithScore(originalRow);
      
      if (!this.arraysEqual(originalRow, newRow)) {
        moved = true;
        this.gameState.board[row] = newRow;
        this.gameState.score += scoreGained;
      }
    }
    
    return moved;
  }
  
  private moveRight(): boolean {
    let moved = false;
    
    for (let row = 0; row < Game2048.BOARD_SIZE; row++) {
      const originalRow = [...this.gameState.board[row]];
      const reversedRow = [...originalRow].reverse();
      const { row: newReversedRow, scoreGained } = this.slideAndMergeRowWithScore(reversedRow);
      const newRow = [...newReversedRow].reverse();
      
      if (!this.arraysEqual(originalRow, newRow)) {
        moved = true;
        this.gameState.board[row] = newRow;
        this.gameState.score += scoreGained;
      }
    }
    
    return moved;
  }
  
  private moveUp(): boolean {
    let moved = false;
    
    for (let col = 0; col < Game2048.BOARD_SIZE; col++) {
      const originalColumn = this.getColumn(col);
      const { row: newColumn, scoreGained } = this.slideAndMergeRowWithScore(originalColumn);
      
      if (!this.arraysEqual(originalColumn, newColumn)) {
        moved = true;
        this.setColumn(col, newColumn);
        this.gameState.score += scoreGained;
      }
    }
    
    return moved;
  }
  
  private moveDown(): boolean {
    let moved = false;
    
    for (let col = 0; col < Game2048.BOARD_SIZE; col++) {
      const originalColumn = this.getColumn(col);
      const reversedColumn = [...originalColumn].reverse();
      const { row: newReversedColumn, scoreGained } = this.slideAndMergeRowWithScore(reversedColumn);
      const newColumn = [...newReversedColumn].reverse();
      
      if (!this.arraysEqual(originalColumn, newColumn)) {
        moved = true;
        this.setColumn(col, newColumn);
        this.gameState.score += scoreGained;
      }
    }
    
    return moved;
  }
  
  private slideAndMergeRowWithScore(row: number[]): { row: number[]; scoreGained: number } {
    // Remove zeros
    const filtered = row.filter(val => val !== 0);
    
    // Merge tiles
    const merged: number[] = [];
    let scoreGained = 0;
    let i = 0;
    
    while (i < filtered.length) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        // Merge tiles
        const mergedValue = filtered[i] * 2;
        merged.push(mergedValue);
        scoreGained += mergedValue;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i++;
      }
    }
    
    // Fill with zeros
    while (merged.length < Game2048.BOARD_SIZE) {
      merged.push(0);
    }
    
    return { row: merged, scoreGained };
  }
  
  private getColumn(colIndex: number): number[] {
    return this.gameState.board.map((row: number[]) => row[colIndex]);
  }
  
  private setColumn(colIndex: number, column: number[]): void {
    for (let rowIndex = 0; rowIndex < Game2048.BOARD_SIZE; rowIndex++) {
      this.gameState.board[rowIndex][colIndex] = column[rowIndex];
    }
  }
  
  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }
  
  private checkForWin(): boolean {
    for (let row = 0; row < Game2048.BOARD_SIZE; row++) {
      for (let col = 0; col < Game2048.BOARD_SIZE; col++) {
        if (this.gameState.board[row][col] === Game2048.WIN_TILE) {
          return true;
        }
      }
    }
    return false;
  }
  
  private checkGameOver(): boolean {
    // Check for empty cells
    if (this.getEmptyCells().length > 0) {
      return false;
    }
    
    // Check for possible merges
    for (let row = 0; row < Game2048.BOARD_SIZE; row++) {
      for (let col = 0; col < Game2048.BOARD_SIZE; col++) {
        const current = this.gameState.board[row][col];
        
        // Check right neighbor
        if (col < Game2048.BOARD_SIZE - 1 && current === this.gameState.board[row][col + 1]) {
          return false;
        }
        
        // Check bottom neighbor
        if (row < Game2048.BOARD_SIZE - 1 && current === this.gameState.board[row + 1][col]) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  protected checkWinCondition(): boolean {
    return this.gameState.hasWon;
  }
}