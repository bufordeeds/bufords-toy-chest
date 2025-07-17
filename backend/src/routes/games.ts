import express from 'express';

const router = express.Router();

interface GameInfo {
  id: string;
  name: string;
  description: string;
  type: 'single' | 'multiplayer';
  status: 'available' | 'coming-soon';
  minPlayers?: number;
  maxPlayers?: number;
}

const availableGames: GameInfo[] = [
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles to combine numbers and reach 2048!',
    type: 'single',
    status: 'available'
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Find hidden words in a grid of letters',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe Plus',
    description: 'Classic game with fun variations',
    type: 'multiplayer',
    status: 'available',
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    description: 'Drop discs to connect four in a row',
    type: 'multiplayer',
    status: 'coming-soon',
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Control a growing snake to eat food and avoid walls',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Fill the grid with numbers using logic',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Classic board game with strategic moves',
    type: 'multiplayer',
    status: 'coming-soon',
    minPlayers: 2,
    maxPlayers: 2
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    description: 'Clear the field without hitting mines',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Arrange falling blocks to clear lines',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'piano-tiles',
    name: 'Piano Tiles',
    description: 'Tap the black tiles to the rhythm',
    type: 'single',
    status: 'coming-soon'
  },
  {
    id: 'tanks',
    name: 'Tanks',
    description: 'Battle with tanks in an arena',
    type: 'multiplayer',
    status: 'coming-soon',
    minPlayers: 2,
    maxPlayers: 4
  }
];

// Get all available games
router.get('/', (_, res) => {
  res.json(availableGames);
});

// Get specific game info
router.get('/:gameId', (req, res) => {
  const game = availableGames.find(g => g.id === req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  return res.json(game);
});

// Get game leaderboard (placeholder for future implementation)
router.get('/:gameId/leaderboard', (req, res) => {
  res.json({
    gameId: req.params.gameId,
    leaderboard: [],
    message: 'Leaderboards coming soon!'
  });
});

export { router as gameRoutes };