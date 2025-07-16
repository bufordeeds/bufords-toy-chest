import { Router, Request, Response } from 'express';
import { firebaseDb } from '../services/firebaseDatabase.js';

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
    
    const achievedAt = new Date().toISOString();
    
    const id = await firebaseDb.addLeaderboardEntry({
      gameId,
      playerName,
      score,
      achievedAt
    });
    
    // Get the rank of this score
    const rank = await firebaseDb.getLeaderboardEntryCountAboveScore(gameId, score) + 1;
    
    return res.status(201).json({
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
    return res.status(500).json({ error: 'Failed to submit score' });
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
    
    const entries = await firebaseDb.getLeaderboardEntries(gameId, limit);
    
    const response: LeaderboardResponse[] = entries.map((entry, index: number) => {
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
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
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
    
    // Get top 10 scores to find the 10th place score
    const topScores = await firebaseDb.getLeaderboardEntries(gameId, 10);
    const tenthPlace = topScores.length >= 10 ? topScores[9] : null;
    
    // Get current rank for this score
    const rank = await firebaseDb.getLeaderboardEntryCountAboveScore(gameId, score) + 1;
    const isTopTen = rank <= 10;
    const wouldMakeTopTen = !tenthPlace || score > tenthPlace.score;
    
    return res.json({
      rank,
      isTopTen,
      wouldMakeTopTen,
      tenthPlaceScore: tenthPlace?.score || null
    });
    
  } catch (error) {
    console.error('Error checking rank:', error);
    return res.status(500).json({ error: 'Failed to check rank' });
  }
});

// Get player's personal best for a game
router.get('/:gameId/personal-best/:playerName', async (req: Request, res: Response) => {
  try {
    const { gameId, playerName } = req.params;
    
    const personalBest = await firebaseDb.getPersonalBest(gameId, playerName);
    
    if (!personalBest) {
      return res.json({ personalBest: null });
    }
    
    // Get rank for personal best
    const rank = await firebaseDb.getLeaderboardEntryCountAboveScore(gameId, personalBest.score) + 1;
    
    return res.json({
      personalBest: {
        ...personalBest,
        rank
      }
    });
    
  } catch (error) {
    console.error('Error fetching personal best:', error);
    return res.status(500).json({ error: 'Failed to fetch personal best' });
  }
});

export const leaderboardRoutes = router;