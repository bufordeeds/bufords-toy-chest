import React, { useState, useEffect } from 'react';
import './HighScoreModal.css';

interface HighScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerName: string) => void;
  onNewGame: () => void;
  gameId: string;
  score: number;
  rank?: number;
  isNewRecord?: boolean;
  isHighScore?: boolean;
  hasWon?: boolean;
}

export const HighScoreModal: React.FC<HighScoreModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onNewGame,
  gameId: _gameId,
  score,
  rank,
  isNewRecord = false,
  isHighScore = false,
  hasWon = false
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlayerName('');
      setIsSubmitting(false);
      setHasSubmitted(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || hasSubmitted) return;
    
    setIsSubmitting(true);
    
    try {
      const finalName = playerName.trim() || 'Anonymous';
      await onSubmit(finalName);
      setHasSubmitted(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleTryAgain = () => {
    onNewGame();
    onClose();
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  if (!isOpen) return null;

  return (
    <div className="high-score-modal-overlay" onClick={onClose}>
      <div className="high-score-modal" onClick={(e) => e.stopPropagation()}>
        {hasSubmitted ? (
          <div className="high-score-success">
            <div className="success-icon">🎉</div>
            <h2>Score Saved!</h2>
            {rank && (
              <p className="success-rank">
                You're #{rank} on the leaderboard!
              </p>
            )}
            <p className="success-message">
              Great job, {playerName || 'Anonymous'}!
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={handleTryAgain}>
                Play Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="high-score-header">
              {hasWon ? (
                <>
                  <div className="record-icon">🏆</div>
                  <h2>You Win!</h2>
                </>
              ) : isHighScore ? (
                isNewRecord ? (
                  <>
                    <div className="record-icon">🏆</div>
                    <h2>New High Score!</h2>
                  </>
                ) : (
                  <>
                    <div className="score-icon">⭐</div>
                    <h2>Great Score!</h2>
                  </>
                )
              ) : (
                <>
                  <div className="score-icon">🎮</div>
                  <h2>Game Over!</h2>
                </>
              )}
              
              <div className="score-display">
                <span className="score-value">{formatScore(score)}</span>
                {rank && (
                  <span className="score-rank">
                    #{rank}{getRankSuffix(rank)} place
                  </span>
                )}
              </div>
            </div>

            <div className="high-score-content">
              {isHighScore ? (
                <>
                  <p className="save-prompt">
                    Save your score to the leaderboard?
                  </p>

                  <form onSubmit={handleSubmit} className="score-form">
                    <div className="form-group">
                      <label htmlFor="playerName" className="form-label">
                        Your Name (optional)
                      </label>
                      <input
                        type="text"
                        id="playerName"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name or leave blank for 'Anonymous'"
                        maxLength={50}
                        className="form-input"
                        disabled={isSubmitting}
                        autoFocus
                      />
                      <div className="form-hint">
                        {playerName.length}/50 characters
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleTryAgain}
                        className="btn-secondary"
                        disabled={isSubmitting}
                      >
                        Play Again
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Score'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="game-over-actions">
                  <button className="btn-primary" onClick={handleTryAgain}>
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};