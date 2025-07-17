import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../services/database.js';

const router = express.Router();

// Game voting endpoints
// Get all game votes
router.get('/votes', async (req, res) => {
  try {
    const voterIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Get all coming-soon games and their vote counts
    const gameVotes = await dbAll(`
      SELECT 
        gameId,
        COUNT(*) as votes,
        MAX(CASE WHEN voterIp = ? THEN 1 ELSE 0 END) as userVoted
      FROM game_votes 
      GROUP BY gameId
    `, [voterIp]);
    
    // Include games with 0 votes for coming-soon games
    const allGames = ['word-search', 'connect4', 'snake', 'memory-match', 'sudoku', 'checkers', 'minesweeper', 'tetris', 'piano-tiles', 'tanks', 'yatzy', 'cabo']; // These are the coming-soon games
    const result = allGames.map(gameId => {
      const gameVote = gameVotes.find((v: any) => v.gameId === gameId);
      return {
        gameId,
        votes: gameVote ? gameVote.votes : 0,
        userVoted: gameVote ? gameVote.userVoted === 1 : false
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to fetch game votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// Vote for a game
router.post('/votes/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const voterIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check if this IP has already voted for this game
    const existingVote = await dbGet(
      'SELECT * FROM game_votes WHERE gameId = ? AND voterIp = ?',
      [gameId, voterIp]
    );
    
    if (existingVote) {
      return res.status(409).json({ error: 'You have already voted for this game' });
    }
    
    // Add vote
    const voteId = uuidv4();
    const votedAt = new Date().toISOString();
    
    await dbRun(
      'INSERT INTO game_votes (id, gameId, voterIp, votedAt) VALUES (?, ?, ?, ?)',
      [voteId, gameId, voterIp, votedAt]
    );
    
    // Get updated vote count
    const voteCount = await dbGet(
      'SELECT COUNT(*) as votes FROM game_votes WHERE gameId = ?',
      [gameId]
    );
    
    return res.json({ 
      gameId, 
      votes: voteCount.votes 
    });
  } catch (error) {
    console.error('Failed to vote for game:', error);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Remove vote for a game
router.delete('/votes/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const voterIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check if this IP has voted for this game
    const existingVote = await dbGet(
      'SELECT * FROM game_votes WHERE gameId = ? AND voterIp = ?',
      [gameId, voterIp]
    );
    
    if (!existingVote) {
      return res.status(404).json({ error: 'No vote found for this game' });
    }
    
    // Remove vote
    await dbRun(
      'DELETE FROM game_votes WHERE gameId = ? AND voterIp = ?',
      [gameId, voterIp]
    );
    
    // Get updated vote count
    const voteCount = await dbGet(
      'SELECT COUNT(*) as votes FROM game_votes WHERE gameId = ?',
      [gameId]
    );
    
    return res.json({ 
      gameId, 
      votes: voteCount.votes 
    });
  } catch (error) {
    console.error('Failed to remove vote:', error);
    return res.status(500).json({ error: 'Failed to remove vote' });
  }
});

// Get all nominations
router.get('/nominations', async (_, res) => {
  try {
    const nominations = await dbAll('SELECT * FROM nominations ORDER BY votes DESC, submittedAt DESC');
    res.json(nominations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nominations' });
  }
});

// Submit a new nomination
router.post('/nominations', async (req, res) => {
  try {
    const { name, description, category, difficulty, estimatedComplexity } = req.body;
    
    if (!name || !description || !category || !difficulty || !estimatedComplexity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const id = uuidv4();
    const submittedAt = new Date().toISOString();
    
    await dbRun(
      'INSERT INTO nominations (id, name, description, category, difficulty, estimatedComplexity, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, category, difficulty, estimatedComplexity, submittedAt]
    );
    
    return res.json({ id, message: 'Nomination submitted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit nomination' });
  }
});

// Vote for a nomination
router.post('/nominations/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const voterIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check if this IP has already voted for this nomination
    const existingVote = await dbGet(
      'SELECT * FROM votes WHERE nominationId = ? AND voterIp = ?',
      [id, voterIp]
    );
    
    if (existingVote) {
      return res.status(409).json({ error: 'You have already voted for this nomination' });
    }
    
    // Check if nomination exists
    const nomination = await dbGet('SELECT * FROM nominations WHERE id = ?', [id]);
    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }
    
    // Add vote
    const voteId = uuidv4();
    const votedAt = new Date().toISOString();
    
    await dbRun(
      'INSERT INTO votes (id, nominationId, voterIp, votedAt) VALUES (?, ?, ?, ?)',
      [voteId, id, voterIp, votedAt]
    );
    
    // Update vote count
    await dbRun(
      'UPDATE nominations SET votes = votes + 1 WHERE id = ?',
      [id]
    );
    
    return res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get voting statistics
router.get('/stats', async (_, res) => {
  try {
    const totalNominations = await dbGet('SELECT COUNT(*) as count FROM nominations');
    const totalVotes = await dbGet('SELECT COUNT(*) as count FROM votes');
    const topNomination = await dbGet('SELECT name, votes FROM nominations ORDER BY votes DESC LIMIT 1');
    
    res.json({
      totalNominations: totalNominations.count,
      totalVotes: totalVotes.count,
      topNomination: topNomination || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export { router as votingRoutes };