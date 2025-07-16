import { Express } from 'express';
import { votingRoutes } from './voting.js';
import { gameRoutes } from './games.js';

export function setupRoutes(app: Express): void {
  // API routes
  app.use('/api/voting', votingRoutes);
  app.use('/api/games', gameRoutes);
  
  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      name: "Buford's Toy Chest API",
      version: '1.0.0',
      endpoints: {
        voting: '/api/voting',
        games: '/api/games',
        health: '/health'
      }
    });
  });
}