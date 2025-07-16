"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
var uuid_1 = require("uuid");
var activeRooms = new Map();
var playerSockets = new Map();
function setupWebSocket(io) {
    var _this = this;
    io.on('connection', function (socket) {
        console.log("Player connected: ".concat(socket.id));
        socket.on('create-room', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var roomCode, playerId, room;
            return __generator(this, function (_a) {
                try {
                    roomCode = generateRoomCode();
                    playerId = (0, uuid_1.v4)();
                    room = {
                        roomCode: roomCode,
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
                        roomCode: roomCode,
                        playerId: playerId,
                        isHost: true
                    });
                    console.log("Room ".concat(roomCode, " created for game ").concat(data.gameId));
                }
                catch (error) {
                    socket.emit('error', { message: 'Failed to create room' });
                }
                return [2 /*return*/];
            });
        }); });
        socket.on('join-room', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var room, playerId, player;
            return __generator(this, function (_a) {
                try {
                    room = activeRooms.get(data.roomCode);
                    if (!room) {
                        socket.emit('error', { message: 'Room not found' });
                        return [2 /*return*/];
                    }
                    if (room.players.length >= getMaxPlayers(room.gameId)) {
                        socket.emit('error', { message: 'Room is full' });
                        return [2 /*return*/];
                    }
                    playerId = (0, uuid_1.v4)();
                    player = {
                        id: playerId,
                        socketId: socket.id,
                        name: data.playerName || "Player ".concat(room.players.length + 1)
                    };
                    room.players.push(player);
                    room.lastActivity = new Date();
                    playerSockets.set(socket.id, socket);
                    socket.join(data.roomCode);
                    socket.emit('room-joined', {
                        roomCode: data.roomCode,
                        playerId: playerId,
                        isHost: false,
                        gameState: room.gameState
                    });
                    // Notify all players in the room
                    io.to(data.roomCode).emit('player-joined', {
                        players: room.players.map(function (p) { return ({ id: p.id, name: p.name }); })
                    });
                    console.log("Player ".concat(playerId, " joined room ").concat(data.roomCode));
                }
                catch (error) {
                    socket.emit('error', { message: 'Failed to join room' });
                }
                return [2 /*return*/];
            });
        }); });
        socket.on('game-action', function (data) {
            try {
                var room = activeRooms.get(data.roomCode);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }
                var player = room.players.find(function (p) { return p.socketId === socket.id; });
                if (!player) {
                    socket.emit('error', { message: 'Player not in room' });
                    return;
                }
                // Process game action based on game type
                var newGameState = processGameAction(room.gameId, room.gameState, data.action, player.id);
                room.gameState = newGameState;
                room.lastActivity = new Date();
                // Broadcast updated game state to all players in room
                io.to(data.roomCode).emit('game-state-updated', {
                    gameState: newGameState,
                    lastAction: data.action,
                    playerId: player.id
                });
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to process game action' });
            }
        });
        socket.on('disconnect', function () {
            console.log("Player disconnected: ".concat(socket.id));
            // Find and handle player leaving rooms
            for (var _i = 0, _a = activeRooms.entries(); _i < _a.length; _i++) {
                var _b = _a[_i], roomCode = _b[0], room = _b[1];
                var playerIndex = room.players.findIndex(function (p) { return p.socketId === socket.id; });
                if (playerIndex !== -1) {
                    var player = room.players[playerIndex];
                    room.players.splice(playerIndex, 1);
                    if (room.players.length === 0) {
                        // Remove empty room
                        activeRooms.delete(roomCode);
                        console.log("Room ".concat(roomCode, " deleted (empty)"));
                    }
                    else {
                        // If host left, assign new host
                        if (player.id === room.hostId && room.players.length > 0) {
                            room.hostId = room.players[0].id;
                            io.to(roomCode).emit('host-changed', { newHostId: room.hostId });
                        }
                        // Notify remaining players
                        io.to(roomCode).emit('player-left', {
                            playerId: player.id,
                            players: room.players.map(function (p) { return ({ id: p.id, name: p.name }); })
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
function generateRoomCode() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';
    for (var i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function getInitialGameState(gameId) {
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
                board: Array(6).fill(null).map(function () { return Array(7).fill(null); }),
                currentPlayer: 'red',
                winner: null,
                gameStatus: 'waiting'
            };
        default:
            return {};
    }
}
function getMaxPlayers(gameId) {
    switch (gameId) {
        case 'tic-tac-toe':
        case 'connect4':
            return 2;
        default:
            return 4;
    }
}
function processGameAction(gameId, currentState, action, playerId) {
    switch (gameId) {
        case 'tic-tac-toe':
            return processTicTacToeAction(currentState, action, playerId);
        case 'connect4':
            return processConnect4Action(currentState, action, playerId);
        default:
            return currentState;
    }
}
function processTicTacToeAction(state, action, _) {
    if (action.type === 'make-move') {
        var newState = __assign({}, state);
        var position = action.position;
        if (newState.board[position] === null && newState.gameStatus === 'playing') {
            newState.board[position] = newState.currentPlayer;
            // Check for winner
            var winner = checkTicTacToeWinner(newState.board);
            if (winner) {
                newState.winner = winner;
                newState.gameStatus = 'finished';
            }
            else if (newState.board.every(function (cell) { return cell !== null; })) {
                newState.gameStatus = 'finished';
                newState.winner = 'tie';
            }
            else {
                newState.currentPlayer = newState.currentPlayer === 'X' ? 'O' : 'X';
            }
        }
        return newState;
    }
    if (action.type === 'start-game') {
        return __assign(__assign({}, state), { gameStatus: 'playing' });
    }
    return state;
}
function processConnect4Action(state, _, __) {
    // Connect 4 logic would go here
    return state;
}
function checkTicTacToeWinner(board) {
    var lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var _a = lines_1[_i], a = _a[0], b = _a[1], c = _a[2];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
function cleanupInactiveRooms() {
    var now = new Date();
    var maxInactiveTime = 30 * 60 * 1000; // 30 minutes
    for (var _i = 0, _a = activeRooms.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], roomCode = _b[0], room = _b[1];
        if (now.getTime() - room.lastActivity.getTime() > maxInactiveTime) {
            activeRooms.delete(roomCode);
            console.log("Room ".concat(roomCode, " cleaned up (inactive)"));
        }
    }
}
