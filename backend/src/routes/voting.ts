import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../services/database.js';

const router = express.Router();

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