import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Snake } from './Snake';
import type { SnakeState, Direction } from './Snake';
import { useStore } from '../../store/useStore';
import { Leaderboard } from '../../components/Leaderboard';
import { HighScoreModal } from '../../components/HighScoreModal';
import { leaderboardService } from '../../services/leaderboardService';
import './SnakeComponent.css';

export const SnakeComponent: React.FC = () => {
  const gameRef = useRef<Snake | null>(null);
  const [gameState, setGameState] = useState<SnakeState | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{ 
    score: number; 
    rank?: number; 
    isHighScore: boolean; 
    hasWon: boolean 
  } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const updateGameScore = useStore((state) => state.updateGameScore);
  const gameScores = useStore((state) => state.gameScores);
  
  useEffect(() => {
    const game = new Snake();
    gameRef.current = game;
    
    // Get best score from store
    const savedScore = gameScores.find(s => s.gameId === 'snake');
    const currentBest = savedScore?.highScore || 0;
    setBestScore(currentBest);
    
    game.onStateChange = (state: SnakeState) => {
      setGameState({ ...state });
    };
    
    game.onScoreUpdate = (newScore: number) => {
      setScore(newScore);
      
      // Update best score if needed
      if (newScore > bestScore) {
        setBestScore(newScore);
        updateGameScore('snake', newScore);
      }
    };
    
    game.onGameEnd = async (finalScore: number) => {
      const savedScore = gameScores.find(s => s.gameId === 'snake');
      const previousBest = savedScore?.highScore || 0;
      const isNewHighScore = finalScore > previousBest;
      
      if (isNewHighScore) {
        updateGameScore('snake', finalScore);
      }
      
      // Check leaderboard ranking
      try {
        const rank = await leaderboardService.checkRank('snake', finalScore);
        setGameOverData({
          score: finalScore,
          rank: rank || undefined,
          isHighScore: isNewHighScore,
          hasWon: false
        });
      } catch (error) {
        console.error('Failed to check leaderboard rank:', error);
        setGameOverData({
          score: finalScore,
          isHighScore: isNewHighScore,
          hasWon: false
        });
      }
      
      setShowGameOverModal(true);
    };
    
    game.initialize();
    game.start();
    
    return () => {
      game.end();
    };
  }, []);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameRef.current || !gameState || gameState.isGameOver) return;
      
      let direction: Direction | null = null;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
        case ' ':
          e.preventDefault();
          // Don't allow pause/resume when waiting for first input
          if (gameState.isWaiting) return;
          if (gameState.isPaused) {
            gameRef.current.resume();
          } else {
            gameRef.current.pause();
          }
          return;
      }
      
      if (direction) {
        e.preventDefault();
        gameRef.current.handleInput({ direction });
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);
  
  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !gameRef.current || !gameState || gameState.isGameOver) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Minimum swipe distance
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        gameRef.current.handleInput({ direction: deltaX > 0 ? 'right' : 'left' });
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        gameRef.current.handleInput({ direction: deltaY > 0 ? 'down' : 'up' });
      }
    }
    
    setTouchStart(null);
  };
  
  const handleNewGame = useCallback(() => {
    if (gameRef.current) {
      setScore(0);
      setShowGameOverModal(false);
      setGameOverData(null);
      gameRef.current.reset();
      gameRef.current.start();
    }
  }, []);
  
  const handlePauseResume = useCallback(() => {
    if (gameRef.current && gameState && !gameState.isGameOver && !gameState.isWaiting) {
      if (gameState.isPaused) {
        gameRef.current.resume();
      } else {
        gameRef.current.pause();
      }
    }
  }, [gameState]);
  
  const handleCloseModal = useCallback(() => {
    setShowGameOverModal(false);
    handleNewGame();
  }, [handleNewGame]);
  
  if (!gameState) {
    return <div className="snake-loading">Loading Snake...</div>;
  }
  
  const cellSize = 100 / gameState.gridSize;
  
  return (
    <div className="snake-container">
      <div className="snake-main">
        <div className="snake-header">
          <h1>Snake</h1>
          <div className="snake-scores">
            <div className="snake-score">
              <span className="score-label">Score</span>
              <span className="score-value">{score}</span>
            </div>
            <div className="snake-score">
              <span className="score-label">Best</span>
              <span className="score-value">{bestScore}</span>
            </div>
          </div>
        </div>
        
        <div className="snake-game-area">
          <div 
            className="snake-board"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Snake segments */}
            {gameState.snake.map((segment, index) => (
              <div
                key={index}
                className={`snake-segment ${index === 0 ? 'snake-head' : ''}`}
                style={{
                  left: `${segment.x * cellSize}%`,
                  top: `${segment.y * cellSize}%`,
                  width: `${cellSize}%`,
                  height: `${cellSize}%`,
                }}
              />
            ))}
            
            {/* Food */}
            <div
              className="snake-food"
              style={{
                left: `${gameState.food.x * cellSize}%`,
                top: `${gameState.food.y * cellSize}%`,
                width: `${cellSize}%`,
                height: `${cellSize}%`,
              }}
            />
            
            {/* Game over overlay */}
            {gameState.isGameOver && (
              <div className="snake-game-over-overlay">
                <div className="game-over-text">Game Over!</div>
                <div className="final-score">Score: {score}</div>
              </div>
            )}
            
            {/* Pause overlay */}
            {gameState.isPaused && !gameState.isGameOver && !gameState.isWaiting && (
              <div className="snake-pause-overlay">
                <div className="pause-text">Paused</div>
                <div className="pause-hint">Press Space to Resume</div>
              </div>
            )}
            
            {/* Waiting overlay */}
            {gameState.isWaiting && (
              <div className="snake-waiting-overlay">
                <div className="waiting-text">Ready?</div>
                <div className="waiting-hint">Press any arrow key to start</div>
              </div>
            )}
          </div>
          
          <div className="snake-controls">
            <button 
              onClick={handleNewGame}
              className="snake-button new-game-button"
            >
              New Game
            </button>
            <button 
              onClick={handlePauseResume}
              className="snake-button pause-button"
              disabled={gameState.isGameOver || gameState.isWaiting}
            >
              {gameState.isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
          
          <div className="snake-instructions">
            <h3>How to Play</h3>
            <ul>
              <li>Use arrow keys or WASD to move</li>
              <li>On mobile, swipe to change direction</li>
              <li>Eat the red food to grow</li>
              <li>Avoid hitting walls or yourself</li>
              <li>Press Space to pause/resume</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="snake-sidebar">
        <Leaderboard gameId="snake" />
      </div>
      
      {showGameOverModal && gameOverData && (
        <HighScoreModal
          score={gameOverData.score}
          isHighScore={gameOverData.isHighScore}
          rank={gameOverData.rank}
          gameId="snake"
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};