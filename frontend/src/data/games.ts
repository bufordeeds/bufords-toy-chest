import type { Game } from '../types/game';

export const games: Game[] = [
  {
    id: '2048',
    name: '2048',
    description: 'Slide tiles to combine numbers and reach 2048!',
    icon: '🔢',
    type: 'single',
    difficulty: 'medium',
    tags: ['puzzle', 'numbers', 'strategy'],
  },
  {
    id: 'word-search',
    name: 'Word Search',
    description: 'Find hidden words in a grid of letters',
    icon: '🔤',
    type: 'single',
    difficulty: 'easy',
    tags: ['puzzle', 'words', 'casual'],
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe Plus',
    description: 'Classic game with fun variations',
    icon: '❌',
    type: 'multiplayer',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'easy',
    tags: ['classic', 'strategy', 'quick'],
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    description: 'Drop discs to connect four in a row',
    icon: '🔴',
    type: 'multiplayer',
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'easy',
    tags: ['classic', 'strategy', 'competitive'],
  },
];