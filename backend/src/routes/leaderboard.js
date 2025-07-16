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
exports.leaderboardRoutes = void 0;
var express_1 = require("express");
var uuid_1 = require("uuid");
var database_js_1 = require("../services/database.js");
var router = (0, express_1.Router)();
// Submit a new high score
router.post('/submit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, gameId, playerName, score, id, achievedAt, rankResult, rank, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, gameId = _a.gameId, playerName = _a.playerName, score = _a.score;
                if (!gameId || !playerName || typeof score !== 'number') {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Missing required fields: gameId, playerName, score'
                        })];
                }
                if (score < 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Score must be non-negative'
                        })];
                }
                if (playerName.length > 50) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Player name must be 50 characters or less'
                        })];
                }
                id = (0, uuid_1.v4)();
                achievedAt = new Date().toISOString();
                return [4 /*yield*/, (0, database_js_1.dbRun)('INSERT INTO leaderboard (id, gameId, playerName, score, achievedAt) VALUES (?, ?, ?, ?, ?)', [id, gameId, playerName, score, achievedAt])];
            case 1:
                _b.sent();
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?', [gameId, score])];
            case 2:
                rankResult = _b.sent();
                rank = ((rankResult === null || rankResult === void 0 ? void 0 : rankResult.rank) || 0) + 1;
                return [2 /*return*/, res.status(201).json({
                        id: id,
                        gameId: gameId,
                        playerName: playerName,
                        score: score,
                        achievedAt: achievedAt,
                        rank: rank,
                        message: rank <= 10 ? "Congratulations! You're #".concat(rank, " on the leaderboard!") : 'Score submitted successfully!'
                    })];
            case 3:
                error_1 = _b.sent();
                console.error('Error submitting score:', error_1);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to submit score' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get leaderboard for a specific game
router.get('/:gameId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var gameId, limit, entries, response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                gameId = req.params.gameId;
                limit = parseInt(req.query.limit) || 10;
                if (limit > 100 || limit < 1) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Limit must be between 1 and 100'
                        })];
                }
                return [4 /*yield*/, (0, database_js_1.dbAll)('SELECT * FROM leaderboard WHERE gameId = ? ORDER BY score DESC LIMIT ?', [gameId, limit])];
            case 1:
                entries = _a.sent();
                response = entries.map(function (entry, index) {
                    var achievedAt = new Date(entry.achievedAt);
                    var now = new Date();
                    var diffMs = now.getTime() - achievedAt.getTime();
                    var daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    return {
                        id: entry.id,
                        gameId: entry.gameId,
                        playerName: entry.playerName,
                        score: entry.score,
                        achievedAt: entry.achievedAt,
                        rank: index + 1,
                        daysAgo: daysAgo
                    };
                });
                return [2 /*return*/, res.json(response)];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching leaderboard:', error_2);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to fetch leaderboard' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Check if a score would make it to the top 10
router.post('/:gameId/check-rank', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var gameId, score, tenthPlace, rankResult, rank, isTopTen, wouldMakeTopTen, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                gameId = req.params.gameId;
                score = req.body.score;
                if (typeof score !== 'number') {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Score must be a number'
                        })];
                }
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT score FROM leaderboard WHERE gameId = ? ORDER BY score DESC LIMIT 1 OFFSET 9', [gameId])];
            case 1:
                tenthPlace = _a.sent();
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?', [gameId, score])];
            case 2:
                rankResult = _a.sent();
                rank = ((rankResult === null || rankResult === void 0 ? void 0 : rankResult.rank) || 0) + 1;
                isTopTen = rank <= 10;
                wouldMakeTopTen = !tenthPlace || score > tenthPlace.score;
                return [2 /*return*/, res.json({
                        rank: rank,
                        isTopTen: isTopTen,
                        wouldMakeTopTen: wouldMakeTopTen,
                        tenthPlaceScore: (tenthPlace === null || tenthPlace === void 0 ? void 0 : tenthPlace.score) || null
                    })];
            case 3:
                error_3 = _a.sent();
                console.error('Error checking rank:', error_3);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to check rank' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get player's personal best for a game
router.get('/:gameId/personal-best/:playerName', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, gameId, playerName, personalBest, rankResult, rank, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.params, gameId = _a.gameId, playerName = _a.playerName;
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT * FROM leaderboard WHERE gameId = ? AND playerName = ? ORDER BY score DESC LIMIT 1', [gameId, playerName])];
            case 1:
                personalBest = _b.sent();
                if (!personalBest) {
                    return [2 /*return*/, res.json({ personalBest: null })];
                }
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT COUNT(*) as rank FROM leaderboard WHERE gameId = ? AND score > ?', [gameId, personalBest.score])];
            case 2:
                rankResult = _b.sent();
                rank = ((rankResult === null || rankResult === void 0 ? void 0 : rankResult.rank) || 0) + 1;
                return [2 /*return*/, res.json({
                        personalBest: __assign(__assign({}, personalBest), { rank: rank })
                    })];
            case 3:
                error_4 = _b.sent();
                console.error('Error fetching personal best:', error_4);
                return [2 /*return*/, res.status(500).json({ error: 'Failed to fetch personal best' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.leaderboardRoutes = router;
