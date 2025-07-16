import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../services/database.js';

interface Player {
  id: string;
  socketId: string;
  name?: string;
}

interface GameRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  players: Player[];
  gameState: any;
  createdAt: Date;
  lastActivity: Date;
}

const activeRooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, Socket>();

export function setupWebSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    socket.on('create-room', async (data: { gameId: string; playerName?: string }) => {
      try {
        const roomCode = generateRoomCode();
        const playerId = uuidv4();
        
        const room: GameRoom = {
          roomCode,
          gameId: data.gameId,
          hostId: playerId,
          players: [{
            id: playerId,
            socketId: socket.id,
            name: data.playerName || 'Host'
          }],
          gameState: getInitialGameState(data.gameId),
          createdAt: new Date(),
          lastActivity: new Date()
        };
        
        activeRooms.set(roomCode, room);
        playerSockets.set(socket.id, socket);
        
        socket.join(roomCode);
        socket.emit('room-created', {
          roomCode,
          playerId,
          isHost: true
        });
        
        console.log(`Room ${roomCode} created for game ${data.gameId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
      }
    });
    
    socket.on('join-room', async (data: { roomCode: string; playerName?: string }) => {
      try {
        const room = activeRooms.get(data.roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        if (room.players.length >= getMaxPlayers(room.gameId)) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }
        
        const playerId = uuidv4();
        const player: Player = {
          id: playerId,
          socketId: socket.id,
          name: data.playerName || `Player ${room.players.length + 1}`
        };
        
        room.players.push(player);
        room.lastActivity = new Date();
        playerSockets.set(socket.id, socket);
        
        socket.join(data.roomCode);
        socket.emit('room-joined', {
          roomCode: data.roomCode,
          playerId,
          isHost: false,
          gameState: room.gameState
        });
        
        // Notify all players in the room
        io.to(data.roomCode).emit('player-joined', {
          players: room.players.map(p => ({ id: p.id, name: p.name }))
        });
        
        console.log(`Player ${playerId} joined room ${data.roomCode}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    socket.on('game-action', (data: { roomCode: string; action: any }) => {
      try {
        const room = activeRooms.get(data.roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
          socket.emit('error', { message: 'Player not in room' });
          return;
        }
        
        // Process game action based on game type
        const newGameState = processGameAction(room.gameId, room.gameState, data.action, player.id);
        room.gameState = newGameState;
        room.lastActivity = new Date();
        
        // Broadcast updated game state to all players in room
        io.to(data.roomCode).emit('game-state-updated', {
          gameState: newGameState,
          lastAction: data.action,
          playerId: player.id
        });
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to process game action' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      // Find and handle player leaving rooms
      for (const [roomCode, room] of activeRooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          
          if (room.players.length === 0) {
            // Remove empty room
            activeRooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted (empty)`);
          } else {
            // If host left, assign new host
            if (player.id === room.hostId && room.players.length > 0) {
              room.hostId = room.players[0].id;
              io.to(roomCode).emit('host-changed', { newHostId: room.hostId });
            }
            
            // Notify remaining players
            io.to(roomCode).emit('player-left', {
              playerId: player.id,
              players: room.players.map(p => ({ id: p.id, name: p.name }))
            });
          }
          break;
        }
      }
      
      playerSockets.delete(socket.id);
    });
  });
  
  // Clean up inactive rooms every 5 minutes
  setInterval(cleanupInactiveRooms, 5 * 60 * 1000);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getInitialGameState(gameId: string): any {
  switch (gameId) {
    case 'tic-tac-toe':
      return {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        gameStatus: 'waiting' // waiting, playing, finished
      };
    case 'connect4':
      return {
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        currentPlayer: 'red',
        winner: null,
        gameStatus: 'waiting'
      };
    default:
      return {};
  }
}

function getMaxPlayers(gameId: string): number {
  switch (gameId) {
    case 'tic-tac-toe':
    case 'connect4':
      return 2;
    default:
      return 4;
  }
}

function processGameAction(gameId: string, currentState: any, action: any, playerId: string): any {
  switch (gameId) {
    case 'tic-tac-toe':
      return processTicTacToeAction(currentState, action, playerId);
    case 'connect4':
      return processConnect4Action(currentState, action, playerId);
    default:
      return currentState;
  }
}

function processTicTacToeAction(state: any, action: any, playerId: string): any {
  if (action.type === 'make-move') {
    const newState = { ...state };
    const { position } = action;
    
    if (newState.board[position] === null && newState.gameStatus === 'playing') {
      newState.board[position] = newState.currentPlayer;
      
      // Check for winner
      const winner = checkTicTacToeWinner(newState.board);
      if (winner) {
        newState.winner = winner;
        newState.gameStatus = 'finished';
      } else if (newState.board.every((cell: any) => cell !== null)) {
        newState.gameStatus = 'finished';
        newState.winner = 'tie';
      } else {
        newState.currentPlayer = newState.currentPlayer === 'X' ? 'O' : 'X';
      }
    }
    
    return newState;
  }
  
  if (action.type === 'start-game') {
    return { ...state, gameStatus: 'playing' };
  }
  
  return state;
}

function processConnect4Action(state: any, action: any, playerId: string): any {
  // Connect 4 logic would go here
  return state;
}

function checkTicTacToeWinner(board: string[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  
  return null;
}

function cleanupInactiveRooms(): void {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [roomCode, room] of activeRooms.entries()) {
    if (now.getTime() - room.lastActivity.getTime() > maxInactiveTime) {
      activeRooms.delete(roomCode);
      console.log(`Room ${roomCode} cleaned up (inactive)`);
    }
  }
}