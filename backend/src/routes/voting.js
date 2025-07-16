"use strict";
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
exports.votingRoutes = void 0;
var express_1 = require("express");
var uuid_1 = require("uuid");
var database_js_1 = require("../services/database.js");
var router = express_1.default.Router();
exports.votingRoutes = router;
// Get all nominations
router.get('/nominations', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var nominations, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, database_js_1.dbAll)('SELECT * FROM nominations ORDER BY votes DESC, submittedAt DESC')];
            case 1:
                nominations = _a.sent();
                res.json(nominations);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch nominations' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Submit a new nomination
router.post('/nominations', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, description, category, difficulty, estimatedComplexity, id, submittedAt, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_1 = _a.name, description = _a.description, category = _a.category, difficulty = _a.difficulty, estimatedComplexity = _a.estimatedComplexity;
                if (!name_1 || !description || !category || !difficulty || !estimatedComplexity) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                id = (0, uuid_1.v4)();
                submittedAt = new Date().toISOString();
                return [4 /*yield*/, (0, database_js_1.dbRun)('INSERT INTO nominations (id, name, description, category, difficulty, estimatedComplexity, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, name_1, description, category, difficulty, estimatedComplexity, submittedAt])];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ id: id, message: 'Nomination submitted successfully' })];
            case 2:
                error_2 = _b.sent();
                return [2 /*return*/, res.status(500).json({ error: 'Failed to submit nomination' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Vote for a nomination
router.post('/nominations/:id/vote', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, voterIp, existingVote, nomination, voteId, votedAt, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                id = req.params.id;
                voterIp = req.ip || req.connection.remoteAddress || 'unknown';
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT * FROM votes WHERE nominationId = ? AND voterIp = ?', [id, voterIp])];
            case 1:
                existingVote = _a.sent();
                if (existingVote) {
                    return [2 /*return*/, res.status(409).json({ error: 'You have already voted for this nomination' })];
                }
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT * FROM nominations WHERE id = ?', [id])];
            case 2:
                nomination = _a.sent();
                if (!nomination) {
                    return [2 /*return*/, res.status(404).json({ error: 'Nomination not found' })];
                }
                voteId = (0, uuid_1.v4)();
                votedAt = new Date().toISOString();
                return [4 /*yield*/, (0, database_js_1.dbRun)('INSERT INTO votes (id, nominationId, voterIp, votedAt) VALUES (?, ?, ?, ?)', [voteId, id, voterIp, votedAt])];
            case 3:
                _a.sent();
                // Update vote count
                return [4 /*yield*/, (0, database_js_1.dbRun)('UPDATE nominations SET votes = votes + 1 WHERE id = ?', [id])];
            case 4:
                // Update vote count
                _a.sent();
                return [2 /*return*/, res.json({ message: 'Vote recorded successfully' })];
            case 5:
                error_3 = _a.sent();
                return [2 /*return*/, res.status(500).json({ error: 'Failed to record vote' })];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Get voting statistics
router.get('/stats', function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalNominations, totalVotes, topNomination, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT COUNT(*) as count FROM nominations')];
            case 1:
                totalNominations = _a.sent();
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT COUNT(*) as count FROM votes')];
            case 2:
                totalVotes = _a.sent();
                return [4 /*yield*/, (0, database_js_1.dbGet)('SELECT name, votes FROM nominations ORDER BY votes DESC LIMIT 1')];
            case 3:
                topNomination = _a.sent();
                res.json({
                    totalNominations: totalNominations.count,
                    totalVotes: totalVotes.count,
                    topNomination: topNomination || null
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch stats' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
