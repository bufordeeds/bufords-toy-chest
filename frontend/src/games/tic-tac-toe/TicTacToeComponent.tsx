import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TicTacToe } from './TicTacToe';
import type { Player, TicTacToeState } from './types';
import { useStore } from '../../store/useStore';
import { Leaderboard } from '../../components/Leaderboard';
import { HighScoreModal } from '../../components/HighScoreModal';
import { leaderboardService } from '../../services/leaderboardService';
import './TicTacToeComponent.css';

export const TicTacToeComponent: React.FC = () => {
  const gameRef = useRef<TicTacToe | null>(null);
  const [gameState, setGameState] = useState<TicTacToeState | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{ 
    score: number; 
    rank?: number; 
    isHighScore: boolean; 
    winner: Player | null;
    isDraw: boolean;
  } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const updateGameScore = useStore((state) => state.updateGameScore);
  
  useEffect(() => {
    const game = new TicTacToe();
    gameRef.current = game;
    
    game.onStateChange = (state: TicTacToeState) => {
      setGameState({ ...state });
    };
    
    game.onGameEnd = async (finalScore: number, _won: boolean) => {
      const currentState = game.getState() as TicTacToeState;
      
      // Check for high score
      const isHighScore = await leaderboardService.isHighScore('tic-tac-toe', finalScore);
      let rank;
      
      if (isHighScore) {
        rank = await leaderboardService.getRank('tic-tac-toe', finalScore);
      }
      
      setGameOverData({
        score: finalScore,
        rank,
        isHighScore,
        winner: currentState.winner,
        isDraw: currentState.gameStatus === 'draw',
      });
      
      if (isHighScore) {
        setShowGameOverModal(true);
      }
    };
    
    game.initialize();
    game.start();
    
    return () => {
      if (gameRef.current) {
        gameRef.current.end();
      }
    };
  }, []);
  
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameRef.current && gameState?.gameStatus === 'playing') {
      gameRef.current.handleInput({ row, col });
    }
  }, [gameState?.gameStatus]);
  
  const handleNewGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.newGame();
    }
    setShowGameOverModal(false);
    setGameOverData(null);
  }, []);
  
  const handleUndo = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.undoLastMove();
    }
  }, []);
  
  const handleKeyPress = useCallback((_event: KeyboardEvent) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    // Allow keyboard navigation for accessibility
    // Could add arrow key navigation in the future
  }, [gameState]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  const handleHighScoreSave = async (playerName: string) => {
    if (gameOverData) {
      await leaderboardService.addScore('tic-tac-toe', gameOverData.score, playerName);
      updateGameScore('tic-tac-toe', gameOverData.score);
    }
    setShowGameOverModal(false);
  };
  
  const handleHighScoreSkip = () => {
    setShowGameOverModal(false);
  };
  
  const renderCell = (row: number, col: number) => {
    const cell = gameState?.board[row][col];
    const isWinningCell = gameState?.winningLine?.includes(row * 3 + col);
    
    return (
      <button
        key={`${row}-${col}`}
        className={`tic-tac-toe-cell ${cell ? `tic-tac-toe-cell--${cell.toLowerCase()}` : ''} ${
          isWinningCell ? 'tic-tac-toe-cell--winning' : ''
        }`}
        onClick={() => handleCellClick(row, col)}
        disabled={cell !== null || gameState?.gameStatus !== 'playing'}
        aria-label={`Cell ${row + 1}, ${col + 1}${cell ? `, ${cell}` : ', empty'}`}
      >
        {cell && (
          <span className={`tic-tac-toe-symbol tic-tac-toe-symbol--${cell.toLowerCase()}`}>
            {cell}
          </span>
        )}
      </button>
    );
  };
  
  const getGameStatusText = () => {
    if (!gameState) return '';
    
    switch (gameState.gameStatus) {
      case 'playing':
        return `Player ${gameState.currentPlayer}'s turn`;
      case 'won':
        return `Player ${gameState.winner} wins!`;
      case 'draw':
        return "It's a draw!";
      default:
        return '';
    }
  };
  
  const getScoreText = () => {
    if (!gameState) return '';
    
    const { scores } = gameState;
    return `X: ${scores.X} | O: ${scores.O} | Draws: ${scores.draws}`;
  };
  
  if (!gameState) {
    return <div className="tic-tac-toe-loading">Loading...</div>;
  }
  
  return (
    <div className="tic-tac-toe-container">
      <div className="tic-tac-toe-header">
        <h1 className="tic-tac-toe-title">Tic-Tac-Toe</h1>
        <div className="tic-tac-toe-scores">
          {getScoreText()}
        </div>
      </div>
      
      <div className="tic-tac-toe-game-area">
        <div className="tic-tac-toe-status">
          <div className="tic-tac-toe-status-text">
            {getGameStatusText()}
          </div>
          {gameState.gameStatus === 'playing' && (
            <div className="tic-tac-toe-current-player">
              <span className={`tic-tac-toe-player-indicator tic-tac-toe-player-indicator--${gameState.currentPlayer.toLowerCase()}`}>
                {gameState.currentPlayer}
              </span>
            </div>
          )}
        </div>
        
        <div className="tic-tac-toe-board">
          {Array(3).fill(null).map((_, row) => (
            <div key={row} className="tic-tac-toe-row">
              {Array(3).fill(null).map((_, col) => renderCell(row, col))}
            </div>
          ))}
        </div>
        
        <div className="tic-tac-toe-controls">
          <button
            className="tic-tac-toe-button tic-tac-toe-button--primary"
            onClick={handleNewGame}
          >
            New Game
          </button>
          
          <button
            className="tic-tac-toe-button tic-tac-toe-button--secondary"
            onClick={handleUndo}
            disabled={!gameState.canUndo}
          >
            Undo ({gameRef.current?.getUndosRemaining() || 0}/3)
          </button>
          
          <button
            className="tic-tac-toe-button tic-tac-toe-button--secondary"
            onClick={() => setShowLeaderboard(true)}
          >
            Leaderboard
          </button>
        </div>
        
        {gameState.gameStatus !== 'playing' && (
          <div className="tic-tac-toe-game-over">
            <div className="tic-tac-toe-game-over-message">
              {gameState.gameStatus === 'won' 
                ? `🎉 Player ${gameState.winner} wins!` 
                : '🤝 It\'s a draw!'}
            </div>
            <button
              className="tic-tac-toe-button tic-tac-toe-button--primary"
              onClick={handleNewGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      
      {showLeaderboard && (
        <Leaderboard
          gameId="tic-tac-toe"
        />
      )}
      
      {showGameOverModal && gameOverData && (
        <HighScoreModal
          isOpen={showGameOverModal}
          onClose={() => setShowGameOverModal(false)}
          onSubmit={handleHighScoreSave}
          onNewGame={handleNewGame}
          gameId="tic-tac-toe"
          score={gameOverData.score}
          rank={gameOverData.rank}
          isHighScore={gameOverData.isHighScore}
        />
      )}
    </div>
  );
};