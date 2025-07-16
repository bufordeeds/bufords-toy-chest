import React from 'react';
import { Link } from 'react-router-dom';
import type { Game } from '../../types/game';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  highScore?: number;
}

export const GameCard: React.FC<GameCardProps> = ({ game, highScore }) => {
  return (
    <Link to={`/game/${game.id}`} className="game-card">
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
          <span>Best: {highScore}</span>
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