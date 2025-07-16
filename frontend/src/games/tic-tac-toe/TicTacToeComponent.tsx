import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TicTacToe } from './TicTacToe';
import type { Player, TicTacToeState } from './types';
import './TicTacToeComponent.css';

export const TicTacToeComponent: React.FC = () => {
  const gameRef = useRef<TicTacToe | null>(null);
  const [gameState, setGameState] = useState<TicTacToeState | null>(null);
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'multiplayer'>('menu');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinRoomCode, setJoinRoomCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>('');
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  
  useEffect(() => {
    const game = new TicTacToe();
    gameRef.current = game;
    
    game.onStateChange = (state: TicTacToeState) => {
      setGameState({ ...state });
    };
    
    // Set up multiplayer event handlers
    game.onPlayerJoined = (player) => {
      const newPlayers = game.getPlayers();
      setPlayers(newPlayers);
      
      // Auto-start game when 2 players join
      if (newPlayers.length === 2 && gameRef.current) {
        gameRef.current.sendGameAction({ type: 'start-game' });
      }
    };
    
    game.onPlayerLeft = (playerId) => {
      setPlayers(game.getPlayers());
    };
    
    game.initialize();
    game.start();
    
    // Set initial state immediately
    setGameState(game.getState() as TicTacToeState);
    
    return () => {
      if (gameRef.current) {
        gameRef.current.leaveRoom();
        gameRef.current.end();
      }
    };
  }, []); // Remove gameMode dependency
  
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameRef.current || gameState?.gameStatus !== 'playing') return;
    
    // In multiplayer mode, check if it's the current player's turn
    if (gameMode === 'multiplayer' && players.length === 2) {
      const currentPlayerIndex = gameState.currentPlayer === 'X' ? 0 : 1;
      const currentPlayerId = players[currentPlayerIndex]?.id;
      
      // Only allow the current player to make a move
      if (currentPlayerId !== gameRef.current.getCurrentPlayer()?.id) {
        return; // Not this player's turn
      }
    }
    
    gameRef.current.handleInput({ row, col });
  }, [gameState?.gameStatus, gameMode, players, gameState?.currentPlayer]);
  
  const handleNewGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.newGame();
    }
  }, []);
  
  const handleUndo = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.undoLastMove();
    }
  }, []);
  
  const handleCreateRoom = useCallback(async () => {
    if (!gameRef.current || !playerName.trim()) return;
    
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const newRoomCode = await gameRef.current.createRoom(playerName.trim());
      setRoomCode(newRoomCode);
      setIsHost(true);
      setGameMode('multiplayer');
      setPlayers(gameRef.current.getPlayers());
      setCurrentPlayerId(gameRef.current.getCurrentPlayer()?.id || '');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsConnecting(false);
    }
  }, [playerName]);
  
  const handleJoinRoom = useCallback(async () => {
    if (!gameRef.current || !joinRoomCode.trim() || !playerName.trim()) return;
    
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      await gameRef.current.joinRoom(joinRoomCode.trim().toUpperCase(), playerName.trim());
      setRoomCode(joinRoomCode.trim().toUpperCase());
      setIsHost(false);
      setGameMode('multiplayer');
      setPlayers(gameRef.current.getPlayers());
      setCurrentPlayerId(gameRef.current.getCurrentPlayer()?.id || '');
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsConnecting(false);
    }
  }, [joinRoomCode, playerName]);
  
  const handleStartGame = useCallback(() => {
    if (gameRef.current && isHost) {
      gameRef.current.sendGameAction({ type: 'start-game' });
    }
  }, [isHost]);
  
  const handleLeaveRoom = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.leaveRoom();
    }
    setGameMode('menu');
    setRoomCode('');
    setJoinRoomCode('');
    setPlayerName('');
    setPlayers([]);
    setIsHost(false);
    setCurrentPlayerId('');
    setConnectionError('');
  }, []);
  
  const handleKeyPress = useCallback((_event: KeyboardEvent) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;
    
    // Allow keyboard navigation for accessibility
    // Could add arrow key navigation in the future
  }, [gameState]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  const renderCell = (row: number, col: number) => {
    const cell = gameState?.board[row][col];
    const isWinningCell = gameState?.winningLine?.includes(row * 3 + col);
    
    // Check if it's the current player's turn in multiplayer
    let isMyTurn = true;
    if (gameMode === 'multiplayer' && players.length === 2 && gameState) {
      const currentPlayerIndex = gameState.currentPlayer === 'X' ? 0 : 1;
      const currentPlayerId = players[currentPlayerIndex]?.id;
      isMyTurn = currentPlayerId === gameRef.current?.getCurrentPlayer()?.id;
    }
    
    return (
      <button
        key={`${row}-${col}`}
        className={`tic-tac-toe-cell ${cell ? `tic-tac-toe-cell--${cell.toLowerCase()}` : ''} ${
          isWinningCell ? 'tic-tac-toe-cell--winning' : ''
        } ${!isMyTurn ? 'tic-tac-toe-cell--disabled' : ''}`}
        onClick={() => handleCellClick(row, col)}
        disabled={cell !== null || gameState?.gameStatus !== 'playing' || !isMyTurn}
        aria-label={`Cell ${row + 1}, ${col + 1}${cell ? `, ${cell}` : ', empty'}`}
      >
        {cell && (
          <span className={`tic-tac-toe-symbol tic-tac-toe-symbol--${cell.toLowerCase()}`}>
            {cell}
          </span>
        )}
      </button>
    );
  };
  
  const getGameStatusText = () => {
    if (!gameState) return '';
    
    switch (gameState.gameStatus) {
      case 'waiting':
        return gameMode === 'multiplayer' ? 
          `Waiting for ${players.length}/2 players...` :
          'Waiting to start...';
      case 'playing':
        if (gameMode === 'multiplayer') {
          // Find the current player by matching X/O to player position
          const currentPlayerIndex = gameState.currentPlayer === 'X' ? 0 : 1;
          const currentPlayerName = players[currentPlayerIndex]?.name || `Player ${gameState.currentPlayer}`;
          const isMyTurn = players[currentPlayerIndex]?.id === currentPlayerId;
          
          return isMyTurn ? "Your turn" : `${currentPlayerName}'s turn`;
        } else {
          return `Player ${gameState.currentPlayer}'s turn`;
        }
      case 'won':
        if (gameMode === 'multiplayer') {
          const winnerIndex = gameState.winner === 'X' ? 0 : 1;
          const winnerName = players[winnerIndex]?.name || `Player ${gameState.winner}`;
          const isMyWin = players[winnerIndex]?.id === currentPlayerId;
          
          return isMyWin ? "You win!" : `${winnerName} wins!`;
        } else {
          return `Player ${gameState.winner} wins!`;
        }
      case 'draw':
        return "It's a draw!";
      default:
        return '';
    }
  };
  
  const getScoreText = () => {
    if (!gameState) return '';
    
    const { scores } = gameState;
    return `X: ${scores.X} | O: ${scores.O} | Draws: ${scores.draws}`;
  };
  
  if (!gameState) {
    return <div className="tic-tac-toe-loading">Loading...</div>;
  }
  
  // Menu screen
  if (gameMode === 'menu') {
    return (
      <div className="tic-tac-toe-container">
        <div className="tic-tac-toe-header">
          <h1 className="tic-tac-toe-title">Tic-Tac-Toe</h1>
          <p className="tic-tac-toe-subtitle">Choose your game mode</p>
        </div>
        
        <div className="tic-tac-toe-menu">
          <button
            className="tic-tac-toe-button tic-tac-toe-button--primary"
            onClick={() => setGameMode('local')}
          >
            Local Game
          </button>
          
          <div className="tic-tac-toe-multiplayer-section">
            <h3>Multiplayer</h3>
            
            <div className="tic-tac-toe-multiplayer-controls">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="tic-tac-toe-input"
                maxLength={20}
              />
              
              <button
                className="tic-tac-toe-button tic-tac-toe-button--secondary"
                onClick={handleCreateRoom}
                disabled={isConnecting || !playerName.trim()}
              >
                {isConnecting ? 'Creating...' : 'Create Room'}
              </button>
              
              <div className="tic-tac-toe-join-room">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  className="tic-tac-toe-input"
                  maxLength={6}
                />
                <button
                  className="tic-tac-toe-button tic-tac-toe-button--secondary"
                  onClick={handleJoinRoom}
                  disabled={isConnecting || !joinRoomCode.trim() || !playerName.trim()}
                >
                  {isConnecting ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
            
            {connectionError && (
              <div className="tic-tac-toe-error">
                {connectionError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tic-tac-toe-container">
      <div className="tic-tac-toe-header">
        <h1 className="tic-tac-toe-title">Tic-Tac-Toe</h1>
        
        {gameMode === 'multiplayer' && (
          <div className="tic-tac-toe-room-info">
            <div className="tic-tac-toe-room-code">
              Room Code: <strong>{roomCode}</strong>
            </div>
            <div className="tic-tac-toe-players">
              Players: {players.map(p => p.name).join(', ')}
            </div>
            {players.length === 1 && (
              <div className="tic-tac-toe-waiting">
                <div className="tic-tac-toe-spinner"></div>
                <span>Waiting for second player...</span>
              </div>
            )}
          </div>
        )}
        
        {gameMode === 'local' && (
          <div className="tic-tac-toe-scores">
            {getScoreText()}
          </div>
        )}
      </div>
      
      <div className="tic-tac-toe-game-area">
        <div className="tic-tac-toe-status">
          <div className="tic-tac-toe-status-text">
            {getGameStatusText()}
          </div>
          {gameState.gameStatus === 'playing' && (
            <div className="tic-tac-toe-current-player">
              <span className={`tic-tac-toe-player-indicator tic-tac-toe-player-indicator--${gameState.currentPlayer.toLowerCase()}`}>
                {gameState.currentPlayer}
              </span>
            </div>
          )}
        </div>
        
        <div className="tic-tac-toe-board">
          {Array(3).fill(null).map((_, row) => (
            <div key={row} className="tic-tac-toe-row">
              {Array(3).fill(null).map((_, col) => renderCell(row, col))}
            </div>
          ))}
        </div>
        
        <div className="tic-tac-toe-controls">
          {gameMode === 'multiplayer' && (
            <button
              className="tic-tac-toe-button tic-tac-toe-button--secondary"
              onClick={handleLeaveRoom}
            >
              Leave Room
            </button>
          )}
          
          {gameMode === 'local' && (
            <>
              <button
                className="tic-tac-toe-button tic-tac-toe-button--primary"
                onClick={handleNewGame}
              >
                New Game
              </button>
              
              <button
                className="tic-tac-toe-button tic-tac-toe-button--secondary"
                onClick={handleUndo}
                disabled={!gameState.canUndo}
              >
                Undo ({gameRef.current?.getUndosRemaining() || 0}/3)
              </button>
            </>
          )}
          
          <button
            className="tic-tac-toe-button tic-tac-toe-button--secondary"
            onClick={() => setGameMode('menu')}
          >
            Back to Menu
          </button>
        </div>
        
        {(gameState.gameStatus === 'won' || gameState.gameStatus === 'draw') && (
          <div className="tic-tac-toe-game-over">
            <div className="tic-tac-toe-game-over-message">
              {gameState.gameStatus === 'won' 
                ? (() => {
                    if (gameMode === 'multiplayer') {
                      const winnerIndex = gameState.winner === 'X' ? 0 : 1;
                      const winnerName = players[winnerIndex]?.name || `Player ${gameState.winner}`;
                      const isMyWin = players[winnerIndex]?.id === currentPlayerId;
                      return isMyWin ? "🎉 You win!" : `🎉 ${winnerName} wins!`;
                    } else {
                      return `🎉 Player ${gameState.winner} wins!`;
                    }
                  })()
                : '🤝 It\'s a draw!'}
            </div>
            <button
              className="tic-tac-toe-button tic-tac-toe-button--primary"
              onClick={handleNewGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};