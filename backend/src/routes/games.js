"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRoutes = void 0;
var express_1 = require("express");
var router = express_1.default.Router();
exports.gameRoutes = router;
var availableGames = [
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
    }
];
// Get all available games
router.get('/', function (_, res) {
    res.json(availableGames);
});
// Get specific game info
router.get('/:gameId', function (req, res) {
    var game = availableGames.find(function (g) { return g.id === req.params.gameId; });
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    return res.json(game);
});
// Get game leaderboard (placeholder for future implementation)
router.get('/:gameId/leaderboard', function (req, res) {
    res.json({
        gameId: req.params.gameId,
        leaderboard: [],
        message: 'Leaderboards coming soon!'
    });
});
