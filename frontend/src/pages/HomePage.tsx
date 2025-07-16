import React, { useEffect, useState } from 'react';
import { GameCard } from '../components/common/GameCard';
import { games } from '../data/games';
import { useStore } from '../store/useStore';
import { leaderboardService, type LeaderboardEntry } from '../services/leaderboardService';
import { votingService } from '../services/votingService';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { gameScores, gameVotes, setGameVotes } = useStore();
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardEntry | null>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      const leaderboardEntries: Record<string, LeaderboardEntry | null> = {};
      
      for (const game of games) {
        if (game.type === 'single' && game.status === 'available') {
          try {
            const leaderboard = await leaderboardService.getLeaderboard(game.id, 1);
            leaderboardEntries[game.id] = leaderboard[0] || null;
          } catch (error) {
            console.error(`Failed to fetch leaderboard for ${game.id}:`, error);
            leaderboardEntries[game.id] = null;
          }
        }
      }
      
      setLeaderboardData(leaderboardEntries);
      
      const votes = await votingService.getVotes();
      setGameVotes(votes);
    };
    
    fetchData();
  }, [setGameVotes]);
  
  const getHighScore = (gameId: string) => {
    const score = gameScores.find((s) => s.gameId === gameId);
    return score?.highScore;
  };
  
  const getGameVotes = (gameId: string) => {
    return gameVotes.find((v) => v.gameId === gameId);
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
                leaderboardEntry={leaderboardData[game.id]}
                votes={getGameVotes(game.id)}
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
              <GameCard 
                key={game.id} 
                game={game} 
                votes={getGameVotes(game.id)}
              />
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