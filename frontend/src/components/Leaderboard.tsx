import React, { useEffect, useState } from 'react';
import './Leaderboard.css';

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: string;
  rank: number;
  daysAgo: number;
}

interface LeaderboardProps {
  gameId: string;
  title?: string;
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  gameId,
  title = 'Leaderboard',
  limit = 10,
  showTitle = true,
  compact = false
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatRelativeTime = (daysAgo: number): string => {
    if (daysAgo === 0) {
      return 'Today';
    } else if (daysAgo === 1) {
      return 'Yesterday';
    } else if (daysAgo < 7) {
      return `${daysAgo} days ago`;
    } else if (daysAgo < 30) {
      const weeks = Math.floor(daysAgo / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (daysAgo < 365) {
      const months = Math.floor(daysAgo / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(daysAgo / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const getRankDisplay = (rank: number): string => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 
          (import.meta.env.PROD 
            ? 'https://toy-chest-backend.onrender.com' 
            : 'http://localhost:3001');
        const response = await fetch(`${backendUrl}/api/leaderboard/${gameId}?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEntries(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [gameId, limit]);

  if (loading) {
    return (
      <div className={`leaderboard ${compact ? 'leaderboard-compact' : ''}`}>
        {showTitle && <h3 className="leaderboard-title">{title}</h3>}
        <div className="leaderboard-loading">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`leaderboard ${compact ? 'leaderboard-compact' : ''}`}>
        {showTitle && <h3 className="leaderboard-title">{title}</h3>}
        <div className="leaderboard-error">Failed to load leaderboard</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={`leaderboard ${compact ? 'leaderboard-compact' : ''}`}>
        {showTitle && <h3 className="leaderboard-title">{title}</h3>}
        <div className="leaderboard-empty">
          <p>No scores yet!</p>
          <p>Be the first to set a high score.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`leaderboard ${compact ? 'leaderboard-compact' : ''}`}>
      {showTitle && <h3 className="leaderboard-title">{title}</h3>}
      
      <div className="leaderboard-list">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`leaderboard-entry ${entry.rank <= 3 ? 'leaderboard-podium' : ''}`}
          >
            <div className="leaderboard-rank">
              <span className="rank-number">{getRankDisplay(entry.rank)}</span>
              {entry.rank <= 3 && (
                <span className="rank-medal">{getMedalEmoji(entry.rank)}</span>
              )}
            </div>
            
            <div className="leaderboard-player">
              <span className="player-name">{entry.playerName}</span>
            </div>
            
            <div className="leaderboard-score">
              <span className="score-value">{formatScore(entry.score)}</span>
            </div>
            
            {!compact && (
              <div className="leaderboard-date">
                <span className="date-relative">{formatRelativeTime(entry.daysAgo)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!compact && entries.length >= limit && (
        <div className="leaderboard-footer">
          <p>Showing top {limit} scores</p>
        </div>
      )}
    </div>
  );
};