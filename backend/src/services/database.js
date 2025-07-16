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
exports.dbAll = exports.dbGet = exports.dbRun = void 0;
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
var sqlite3_1 = require("sqlite3");
var db;
function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    db = new sqlite3_1.default.Database('./game_data.db', function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // Create tables
                        var createTables = [
                            "CREATE TABLE IF NOT EXISTS nominations (\n          id TEXT PRIMARY KEY,\n          name TEXT NOT NULL,\n          description TEXT NOT NULL,\n          category TEXT NOT NULL,\n          difficulty TEXT NOT NULL,\n          estimatedComplexity INTEGER NOT NULL,\n          submittedAt TEXT NOT NULL,\n          votes INTEGER DEFAULT 0\n        )",
                            "CREATE TABLE IF NOT EXISTS votes (\n          id TEXT PRIMARY KEY,\n          nominationId TEXT NOT NULL,\n          voterIp TEXT NOT NULL,\n          votedAt TEXT NOT NULL,\n          UNIQUE(nominationId, voterIp)\n        )",
                            "CREATE TABLE IF NOT EXISTS rooms (\n          roomCode TEXT PRIMARY KEY,\n          gameId TEXT NOT NULL,\n          hostId TEXT NOT NULL,\n          players TEXT NOT NULL,\n          gameState TEXT,\n          createdAt TEXT NOT NULL,\n          lastActivity TEXT NOT NULL\n        )",
                            "CREATE TABLE IF NOT EXISTS leaderboard (\n          id TEXT PRIMARY KEY,\n          gameId TEXT NOT NULL,\n          playerName TEXT NOT NULL,\n          score INTEGER NOT NULL,\n          achievedAt TEXT NOT NULL\n        )",
                            "CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score \n         ON leaderboard(gameId, score DESC)"
                        ];
                        var completed = 0;
                        createTables.forEach(function (sql) {
                            db.run(sql, function (err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                completed++;
                                if (completed === createTables.length) {
                                    resolve();
                                }
                            });
                        });
                    });
                })];
        });
    });
}
function getDatabase() {
    return db;
}
// Promisified database operations
var dbRun = function (sql, params) {
    return new Promise(function (resolve, reject) {
        db.run(sql, params, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
};
exports.dbRun = dbRun;
var dbGet = function (sql, params) {
    return new Promise(function (resolve, reject) {
        db.get(sql, params, function (err, row) {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
exports.dbGet = dbGet;
var dbAll = function (sql, params) {
    return new Promise(function (resolve, reject) {
        db.all(sql, params, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
exports.dbAll = dbAll;
