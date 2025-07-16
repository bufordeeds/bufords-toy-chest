# Buford's Toy Chest - Frontend

A React TypeScript frontend for Buford's Toy Chest, a collection of fun games to play alone or with friends.

## Features

- **Single Player Games**: Play classic games like 2048 with high score tracking
- **Multiplayer Games**: Join friends using simple room codes
- **Leaderboards**: Compete with other players and track your best scores
- **Game Voting**: Vote for which games should be added next
- **Responsive Design**: Works great on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Zustand** for state management
- **CSS Modules** for styling
- **WebSocket** support for real-time multiplayer

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── common/       # Shared components (Header, Footer, etc.)
│   ├── games/        # Game-specific components
│   └── voting/       # Voting system components
├── games/            # Game implementations
│   ├── game-2048/    # 2048 game logic and UI
│   └── tic-tac-toe/  # Tic-tac-toe game logic and UI
├── pages/            # Page components
├── services/         # API services
├── store/            # State management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Contributing

This is a personal project for learning and fun. Feel free to explore the code and suggest improvements!
