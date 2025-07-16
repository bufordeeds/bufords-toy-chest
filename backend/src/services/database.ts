import sqlite3 from 'sqlite3';
import { promisify } from 'util';

let db: sqlite3.Database;

export interface GameNomination {
  id: string;
  name: string;
  description: string;
  category: 'single' | 'multiplayer' | 'party';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedComplexity: number;
  submittedAt: Date;
  votes: number;
}

export interface Vote {
  id: string;
  nominationId: string;
  voterIp: string;
  votedAt: Date;
}

export interface GameRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  players: string[];
  gameState: any;
  createdAt: Date;
  lastActivity: Date;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: Date;
}

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./game_data.db', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create tables
      const createTables = [
        `CREATE TABLE IF NOT EXISTS nominations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          estimatedComplexity INTEGER NOT NULL,
          submittedAt TEXT NOT NULL,
          votes INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS votes (
          id TEXT PRIMARY KEY,
          nominationId TEXT NOT NULL,
          voterIp TEXT NOT NULL,
          votedAt TEXT NOT NULL,
          UNIQUE(nominationId, voterIp)
        )`,
        `CREATE TABLE IF NOT EXISTS rooms (
          roomCode TEXT PRIMARY KEY,
          gameId TEXT NOT NULL,
          hostId TEXT NOT NULL,
          players TEXT NOT NULL,
          gameState TEXT,
          createdAt TEXT NOT NULL,
          lastActivity TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS leaderboard (
          id TEXT PRIMARY KEY,
          gameId TEXT NOT NULL,
          playerName TEXT NOT NULL,
          score INTEGER NOT NULL,
          achievedAt TEXT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score 
         ON leaderboard(gameId, score DESC)`
      ];
      
      let completed = 0;
      createTables.forEach((sql) => {
        db.run(sql, (err) => {
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
  });
}

export function getDatabase(): sqlite3.Database {
  return db;
}

// Promisified database operations
export const dbRun = (sql: string, params?: any[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const dbGet = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql: string, params?: any[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};