import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbAll, dbGet, LeaderboardEntry } from '../services/database.js';

const router = Router();

export interface SubmitScoreRequest {
  gameId: string;
  playerName: string;
  score: number;
}

export interface LeaderboardResponse {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: string;
  rank: number;
  daysAgo: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

// Submit a new high score
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { gameId, playerName, score }: SubmitScoreRequest = req.body;
    
    if (!gameId || !playerName || typeof score !== 'number') {
      return res.status(400).json({ 
        error: 'Missing required fields: gameId, playerName, score' 
      });
    }
    
    if (score < 0) {
      return res.status(400).json({ 
        error: 'Score must be non-negative' 
      });
    }
    
    if (playerName.length > 50) {
      return res.status(400).json({ 
        error: 'Player name must be 50 characters or less' 
      });
    }
    
    const id = uuidv4();
    const achievedAt = new Date().toISOString();
    
    await dbRun(
      'INSERT INTO leaderboard (id, gameId, playerName, score, achievedAt) VALUES (?, ?, ?, ?, ?)',
      [id, gameId, playerName, score, achievedAt]
    );
    
    // Get the rank of this score
    const rankResult = await dbGet(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?',
      [gameId, score]
    );
    
    const rank = (rankResult?.rank || 0) + 1;
    
    res.status(201).json({
      id,
      gameId,
      playerName,
      score,
      achievedAt,
      rank,
      message: rank <= 10 ? `Congratulations! You're #${rank} on the leaderboard!` : 'Score submitted successfully!'
    });
    
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get leaderboard for a specific game
router.get('/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (limit > 100 || limit < 1) {
      return res.status(400).json({ 
        error: 'Limit must be between 1 and 100' 
      });
    }
    
    const entries = await dbAll(
      'SELECT * FROM leaderboard WHERE gameId = ? ORDER BY score DESC LIMIT ?',
      [gameId, limit]
    );
    
    const response: LeaderboardResponse[] = entries.map((entry: any, index: number) => {
      const achievedAt = new Date(entry.achievedAt);
      const now = new Date();
      const diffMs = now.getTime() - achievedAt.getTime();
      const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      return {
        id: entry.id,
        gameId: entry.gameId,
        playerName: entry.playerName,
        score: entry.score,
        achievedAt: entry.achievedAt,
        rank: index + 1,
        daysAgo
      };
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Check if a score would make it to the top 10
router.post('/:gameId/check-rank', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { score } = req.body;
    
    if (typeof score !== 'number') {
      return res.status(400).json({ 
        error: 'Score must be a number' 
      });
    }
    
    // Get the 10th place score (if it exists)
    const tenthPlace = await dbGet(
      'SELECT score FROM leaderboard WHERE gameId = ? ORDER BY score DESC LIMIT 1 OFFSET 9',
      [gameId]
    );
    
    // Get current rank for this score
    const rankResult = await dbGet(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?',
      [gameId, score]
    );
    
    const rank = (rankResult?.rank || 0) + 1;
    const isTopTen = rank <= 10;
    const wouldMakeTopTen = !tenthPlace || score > tenthPlace.score;
    
    res.json({
      rank,
      isTopTen,
      wouldMakeTopTen,
      tenthPlaceScore: tenthPlace?.score || null
    });
    
  } catch (error) {
    console.error('Error checking rank:', error);
    res.status(500).json({ error: 'Failed to check rank' });
  }
});

// Get player's personal best for a game
router.get('/:gameId/personal-best/:playerName', async (req: Request, res: Response) => {
  try {
    const { gameId, playerName } = req.params;
    
    const personalBest = await dbGet(
      'SELECT * FROM leaderboard WHERE gameId = ? AND playerName = ? ORDER BY score DESC LIMIT 1',
      [gameId, playerName]
    );
    
    if (!personalBest) {
      return res.json({ personalBest: null });
    }
    
    // Get rank for personal best
    const rankResult = await dbGet(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?',
      [gameId, personalBest.score]
    );
    
    const rank = (rankResult?.rank || 0) + 1;
    
    res.json({
      personalBest: {
        ...personalBest,
        rank
      }
    });
    
  } catch (error) {
    console.error('Error fetching personal best:', error);
    res.status(500).json({ error: 'Failed to fetch personal best' });
  }
});

export const leaderboardRoutes = router;