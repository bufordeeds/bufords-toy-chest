"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
var voting_js_1 = require("./voting.js");
var games_js_1 = require("./games.js");
var leaderboard_js_1 = require("./leaderboard.js");
function setupRoutes(app) {
    // API routes
    app.use('/api/voting', voting_js_1.votingRoutes);
    app.use('/api/games', games_js_1.gameRoutes);
    app.use('/api/leaderboard', leaderboard_js_1.leaderboardRoutes);
    // API info endpoint
    app.get('/api', function (_, res) {
        res.json({
            name: "Buford's Toy Chest API",
            version: '1.0.0',
            endpoints: {
                voting: '/api/voting',
                games: '/api/games',
                leaderboard: '/api/leaderboard',
                health: '/health'
            }
        });
    });
}
