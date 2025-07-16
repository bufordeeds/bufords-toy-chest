import React from 'react';
import { GameCard } from '../components/common/GameCard';
import { games } from '../data/games';
import { useStore } from '../store/useStore';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const gameScores = useStore((state) => state.gameScores);
  
  const getHighScore = (gameId: string) => {
    const score = gameScores.find((s) => s.gameId === gameId);
    return score?.highScore;
  };
  
  const singlePlayerGames = games.filter((game) => game.type === 'single');
  const multiplayerGames = games.filter((game) => game.type === 'multiplayer');
  
  return (
    <div className="home-page">
      <div className="container">
        <section className="hero-section">
          <h1 className="hero-title">Welcome to Buford's Toy Chest!</h1>
          <p className="hero-subtitle">
            A collection of fun games to play alone or with friends
          </p>
        </section>
        
        <section className="games-section">
          <h2 className="section-title">Single Player Games</h2>
          <div className="games-grid">
            {singlePlayerGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                highScore={getHighScore(game.id)}
              />
            ))}
          </div>
        </section>
        
        <section className="games-section">
          <h2 className="section-title">Multiplayer Games</h2>
          <p className="section-description">
            Play with friends using a simple join code!
          </p>
          <div className="games-grid">
            {multiplayerGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
        
        <section className="cta-section">
          <div className="cta-card">
            <h2>Want more games?</h2>
            <p>
              Vote for which games we should add next! Your voice helps shape
              Buford's Toy Chest.
            </p>
            <a href="/vote" className="cta-button">
              Vote Now 🗳️
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};