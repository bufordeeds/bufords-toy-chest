import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Game2048 } from './Game2048';
import type { Direction, Game2048State, TileAnimation } from './Game2048';
import { useStore } from '../../store/useStore';
import { Leaderboard } from '../../components/Leaderboard';
import { HighScoreModal } from '../../components/HighScoreModal';
import { leaderboardService } from '../../services/leaderboardService';
import './Game2048Component.css';

export const Game2048Component: React.FC = () => {
  const gameRef = useRef<Game2048 | null>(null);
  const [gameState, setGameState] = useState<Game2048State | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [gameOverData, setGameOverData] = useState<{ 
    score: number; 
    rank?: number; 
    isHighScore: boolean; 
    hasWon: boolean 
  } | null>(null);
  const updateGameScore = useStore((state) => state.updateGameScore);
  const gameScores = useStore((state) => state.gameScores);
  
  useEffect(() => {
    const game = new Game2048();
    gameRef.current = game;
    
    // Get best score from store
    const savedScore = gameScores.find(s => s.gameId === '2048');
    const currentBest = savedScore?.highScore || 0;
    setBestScore(currentBest);
    
    game.onStateChange = (state: Game2048State) => {
      setGameState({ ...state });
      
      // Check if we have new tiles appearing
      const hasNewTiles = state.animations && 
        state.animations.some(row => row.some(anim => anim && anim.type === 'new'));
      
      if (hasNewTiles) {
        setIsAnimating(true);
        // Clear animation blocking after new tile animation completes
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }
      
      // Clear animations after they complete
      if (state.animations && state.animations.some(row => row.some(anim => anim && anim.type !== 'new'))) {
        setTimeout(() => {
          if (gameRef.current) {
            const currentState = gameRef.current.getState();
            gameRef.current.setState({
              ...currentState,
              animations: currentState.animations.map((row: TileAnimation[]) => 
                row.map(() => ({ type: 'new' as const }))
              )
            });
          }
        }, 200);
      }
    };
    
    game.onScoreUpdate = async (newScore: number) => {
      setScore(newScore);
      if (newScore > currentBest) {
        setBestScore(newScore);
        updateGameScore('2048', newScore);
      }
    };
    
    game.onGameEnd = async (finalScore: number, won: boolean) => {
      if (finalScore > currentBest) {
        setBestScore(finalScore);
        updateGameScore('2048', finalScore);
      }
      
      // Check if this score qualifies for the leaderboard
      try {
        const isHighScore = await leaderboardService.isHighScore('2048', finalScore);
        let rank;
        
        if (isHighScore) {
          const rankCheck = await leaderboardService.checkRank('2048', finalScore);
          rank = rankCheck.rank;
        }
        
        setGameOverData({
          score: finalScore,
          rank,
          isHighScore,
          hasWon: won
        });
        setShowGameOverModal(true);
      } catch (error) {
        console.error('Failed to check high score status:', error);
        // Still show modal even if leaderboard check fails
        setGameOverData({
          score: finalScore,
          isHighScore: false,
          hasWon: won
        });
        setShowGameOverModal(true);
      }
      
      console.log(won ? 'You won!' : 'Game over!');
    };
    
    game.initialize();
    game.start();
    
    // Set initial state
    const initialState = game.getState();
    setGameState({ ...initialState });
    
    return () => {
      game.end();
    };
  }, []);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'isAnimating:', isAnimating, 'gameRef:', !!gameRef.current);
    
    if (!gameRef.current || isAnimating || showGameOverModal) {
      console.log('Input blocked - no game ref, animating, or modal open');
      return;
    }
    
    let direction: Direction | null = null;
    
    switch (event.key) {
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
    }
    
    if (direction) {
      console.log('Processing move:', direction);
      event.preventDefault();
      setIsAnimating(true);
      const moved = gameRef.current.handleInput({ direction });
      console.log('Move result:', moved);
      
      // If move was invalid, immediately reset animation state
      if (!moved) {
        setIsAnimating(false);
      }
    }
  }, [isAnimating, showGameOverModal]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleSwipe = (direction: Direction) => {
    if (gameRef.current && !isAnimating) {
      setIsAnimating(true);
      const moved = gameRef.current.handleInput({ direction });
      
      // If move was invalid, immediately reset animation state
      if (!moved) {
        setIsAnimating(false);
      }
    }
  };
  
  const handleNewGame = () => {
    if (gameRef.current) {
      setIsAnimating(false);
      gameRef.current.reset();
      gameRef.current.start();
      setScore(0);
      
      // Update the React state with the new board
      const newState = gameRef.current.getState();
      setGameState({ ...newState });
    }
  };
  
  const handleUndo = () => {
    if (gameRef.current) {
      const success = (gameRef.current as any).undo();
      if (success) {
        setScore(gameRef.current.getScore());
      }
    }
  };
  
  const getTileClass = (value: number, animation?: TileAnimation): string => {
    let baseClass = value === 0 ? 'tile-empty' : `tile-${value}`;
    
    if (animation) {
      switch (animation.type) {
        case 'new':
          baseClass += ' new-tile';
          break;
        case 'merged':
          baseClass += ' merged-tile';
          break;
      }
    }
    
    return baseClass;
  };
  
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const handleHighScoreSubmit = async (playerName: string) => {
    if (!gameOverData) return;
    
    try {
      await leaderboardService.submitScore({
        gameId: '2048',
        playerName,
        score: gameOverData.score
      });
      
      // The Leaderboard component will automatically refresh
    } catch (error) {
      console.error('Failed to submit high score:', error);
      throw error;
    }
  };

  const handleGameOverModalClose = () => {
    setShowGameOverModal(false);
    setGameOverData(null);
  };

  const handleModalNewGame = () => {
    handleNewGame();
    handleGameOverModalClose();
  };

  
  if (!gameState) {
    return <div className="game-loading">Loading...</div>;
  }
  
  return (
    <div className="game-2048">
      <div className="game-header">
        <h1 className="game-title">2048</h1>
        <div className="game-stats">
          <div className="score-box">
            <div className="score-label">Score</div>
            <div className="score-value">{formatNumber(score)}</div>
          </div>
          <div className="score-box">
            <div className="score-label">Best</div>
            <div className="score-value">{formatNumber(bestScore)}</div>
          </div>
        </div>
      </div>
      
      <div className="game-controls">
        <button className="btn-primary" onClick={handleNewGame}>
          New Game
        </button>
        {gameState.canUndo && (
          <button className="btn-secondary" onClick={handleUndo}>
            Undo
          </button>
        )}
      </div>
      
      <div className="game-board">
        {gameState.board.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const animation = gameState.animations?.[rowIndex]?.[colIndex];
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`tile ${getTileClass(value, animation)}`}
                data-value={value || ''}
              >
                {value > 0 && formatNumber(value)}
              </div>
            );
          })
        )}
      </div>
      
      
      <div className="game-instructions">
        <p>Use WASD or arrow keys to move tiles. Combine tiles with the same number to reach 2048!</p>
        
        <div className="mobile-controls">
          <div className="mobile-control-row">
            <button
              className="mobile-btn"
              onTouchStart={() => handleSwipe('up')}
              onClick={() => handleSwipe('up')}
            >
              ↑
            </button>
          </div>
          <div className="mobile-control-row">
            <button
              className="mobile-btn"
              onTouchStart={() => handleSwipe('left')}
              onClick={() => handleSwipe('left')}
            >
              ←
            </button>
            <button
              className="mobile-btn"
              onTouchStart={() => handleSwipe('down')}
              onClick={() => handleSwipe('down')}
            >
              ↓
            </button>
            <button
              className="mobile-btn"
              onTouchStart={() => handleSwipe('right')}
              onClick={() => handleSwipe('right')}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="game-leaderboard">
        <Leaderboard 
          gameId="2048" 
          title="2048 Leaderboard"
          limit={10}
        />
      </div>

      <HighScoreModal
        isOpen={showGameOverModal}
        onClose={handleGameOverModalClose}
        onSubmit={handleHighScoreSubmit}
        onNewGame={handleModalNewGame}
        gameId="2048"
        score={gameOverData?.score || 0}
        rank={gameOverData?.rank}
        isHighScore={gameOverData?.isHighScore || false}
        hasWon={gameOverData?.hasWon || false}
        isNewRecord={score > bestScore}
      />
    </div>
  );
};