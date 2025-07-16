import React from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../../types/game';
import type { LeaderboardEntry } from '../../services/leaderboardService';
import type { GameVotes } from '../../services/votingService';
import { useStore } from '../../store/useStore';
import { votingService } from '../../services/votingService';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  highScore?: number;
  leaderboardEntry?: LeaderboardEntry | null;
  votes?: GameVotes;
}

export const GameCard: React.FC<GameCardProps> = ({ game, highScore, leaderboardEntry, votes }) => {
  const { updateGameVote } = useStore();

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!votes) return;
    
    if (votes.userVoted) {
      const result = await votingService.removeVote(game.id);
      if (result) {
        updateGameVote(game.id, result.votes, false);
      }
    } else {
      const result = await votingService.voteForGame(game.id);
      if (result) {
        updateGameVote(game.id, result.votes, true);
      }
    }
  };

  const isComingSoon = game.status === 'coming-soon';
  
  if (isComingSoon) {
    return (
      <div className={`game-card coming-soon`}>
        <div className="game-card-icon">{game.icon}</div>
        <h3 className="game-card-title">{game.name}</h3>
        <p className="game-card-description">{game.description}</p>
        
        <div className="coming-soon-badge">
          <span>Coming Soon</span>
        </div>
        
        <div className="game-card-meta">
          <span className={`game-type ${game.type}`}>
            {game.type === 'single' ? '1P' : `${game.minPlayers}-${game.maxPlayers}P`}
          </span>
          <span className={`game-difficulty ${game.difficulty}`}>
            {game.difficulty}
          </span>
        </div>
        
        {votes && (
          <div 
            className="voting-section"
            style={{ 
              position: 'relative', 
              zIndex: 10, 
              pointerEvents: 'auto'
            }}
          >
            <div className="vote-count">
              <span className="vote-number">{votes.votes}</span>
              <span className="vote-label">votes</span>
            </div>
            <button 
              className={`vote-button ${votes.userVoted ? 'voted' : ''}`}
              onClick={handleVote}
              style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                position: 'relative',
                zIndex: 11
              }}
            >
              {votes.userVoted ? 'Remove Vote' : 'Vote'}
            </button>
          </div>
        )}
        
        <div className="game-card-tags">
          {game.tags.map((tag) => (
            <span key={tag} className="game-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <Link 
      to={`/game/${game.id}`}
      className="game-card"
    >
      <div className="game-card-icon">{game.icon}</div>
      <h3 className="game-card-title">{game.name}</h3>
      <p className="game-card-description">{game.description}</p>
      
      <div className="game-card-meta">
        <span className={`game-type ${game.type}`}>
          {game.type === 'single' ? '1P' : `${game.minPlayers}-${game.maxPlayers}P`}
        </span>
        <span className={`game-difficulty ${game.difficulty}`}>
          {game.difficulty}
        </span>
      </div>
      
      {highScore !== undefined && (
        <div className="game-card-score">
          <span>Best: {highScore.toLocaleString()}</span>
        </div>
      )}
      
      {leaderboardEntry && (
        <div className="game-card-record">
          <span className="record-label">Record:</span>
          <span className="record-score">{leaderboardEntry.score.toLocaleString()}</span>
          <span className="record-holder">by {leaderboardEntry.playerName}</span>
        </div>
      )}
      
      <div className="game-card-tags">
        {game.tags.map((tag) => (
          <span key={tag} className="game-tag">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
};