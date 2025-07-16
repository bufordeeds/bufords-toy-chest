import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Game2048Component } from '../games/game-2048/Game2048Component';
import './GamePage.css';

const AVAILABLE_GAMES = {
  '2048': Game2048Component,
  // 'tic-tac-toe': TicTacToeComponent, // We'll add this later
  // 'word-search': WordSearchComponent, // We'll add this later
  // 'connect4': Connect4Component, // We'll add this later
};

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  
  if (!gameId || !AVAILABLE_GAMES[gameId as keyof typeof AVAILABLE_GAMES]) {
    return <Navigate to="/" replace />;
  }
  
  const GameComponent = AVAILABLE_GAMES[gameId as keyof typeof AVAILABLE_GAMES];
  
  return (
    <div className="game-page">
      <div className="container">
        <div className="game-wrapper">
          <GameComponent />
        </div>
      </div>
    </div>
  );
};