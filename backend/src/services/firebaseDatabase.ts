import { 
  ref, 
  set, 
  get, 
  query, 
  orderByChild, 
  limitToLast,
  equalTo
} from 'firebase/database';
import { getFirebaseDatabase } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

export interface GameNomination {
  id: string;
  name: string;
  description: string;
  category: 'single' | 'multiplayer' | 'party';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedComplexity: number;
  submittedAt: string;
  votes: number;
}

export interface Vote {
  id: string;
  nominationId: string;
  voterIp: string;
  votedAt: string;
}

export interface GameRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  players: string[];
  gameState: any;
  createdAt: string;
  lastActivity: string;
}

export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameVote {
  id: string;
  gameId: string;
  voterIp: string;
  votedAt: string;
}

// Firebase Database Operations
export const firebaseDb = {
  // Leaderboard operations
  async addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): Promise<string> {
    const db = getFirebaseDatabase();
    const id = uuidv4();
    const entryWithId = { ...entry, id };
    
    await set(ref(db, `leaderboard/${entry.gameId}/${id}`), entryWithId);
    return id;
  },

  async getLeaderboardEntries(gameId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const db = getFirebaseDatabase();
    const leaderboardRef = ref(db, `leaderboard/${gameId}`);
    const leaderboardQuery = query(leaderboardRef, orderByChild('score'), limitToLast(limit));
    
    const snapshot = await get(leaderboardQuery);
    if (!snapshot.exists()) {
      return [];
    }
    
    const entries: LeaderboardEntry[] = [];
    snapshot.forEach((childSnapshot) => {
      entries.push(childSnapshot.val());
    });
    
    // Sort by score descending (Firebase sorts ascending, so we reverse)
    return entries.sort((a, b) => b.score - a.score);
  },

  async getLeaderboardEntryCountAboveScore(gameId: string, score: number): Promise<number> {
    const db = getFirebaseDatabase();
    const leaderboardRef = ref(db, `leaderboard/${gameId}`);
    
    const snapshot = await get(leaderboardRef);
    if (!snapshot.exists()) {
      return 0;
    }
    
    let count = 0;
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val();
      if (entry.score > score) {
        count++;
      }
    });
    
    return count;
  },

  async getPersonalBest(gameId: string, playerName: string): Promise<LeaderboardEntry | null> {
    const db = getFirebaseDatabase();
    const leaderboardRef = ref(db, `leaderboard/${gameId}`);
    const playerQuery = query(leaderboardRef, orderByChild('playerName'), equalTo(playerName));
    
    const snapshot = await get(playerQuery);
    if (!snapshot.exists()) {
      return null;
    }
    
    let bestEntry: LeaderboardEntry | null = null;
    snapshot.forEach((childSnapshot) => {
      const entry = childSnapshot.val();
      if (!bestEntry || entry.score > bestEntry.score) {
        bestEntry = entry;
      }
    });
    
    return bestEntry;
  },

  // Game Nominations operations
  async addNomination(nomination: Omit<GameNomination, 'id' | 'votes'>): Promise<string> {
    const db = getFirebaseDatabase();
    const id = uuidv4();
    const nominationWithId = { ...nomination, id, votes: 0 };
    
    await set(ref(db, `nominations/${id}`), nominationWithId);
    return id;
  },

  async getNominations(): Promise<GameNomination[]> {
    const db = getFirebaseDatabase();
    const nominationsRef = ref(db, 'nominations');
    
    const snapshot = await get(nominationsRef);
    if (!snapshot.exists()) {
      return [];
    }
    
    const nominations: GameNomination[] = [];
    snapshot.forEach((childSnapshot) => {
      nominations.push(childSnapshot.val());
    });
    
    return nominations;
  },

  async updateNominationVotes(nominationId: string, votes: number): Promise<void> {
    const db = getFirebaseDatabase();
    await set(ref(db, `nominations/${nominationId}/votes`), votes);
  },

  // Votes operations
  async addVote(vote: Omit<Vote, 'id'>): Promise<string> {
    const db = getFirebaseDatabase();
    const id = uuidv4();
    const voteWithId = { ...vote, id };
    
    await set(ref(db, `votes/${id}`), voteWithId);
    return id;
  },

  async getVotesByNomination(nominationId: string): Promise<Vote[]> {
    const db = getFirebaseDatabase();
    const votesRef = ref(db, 'votes');
    const votesQuery = query(votesRef, orderByChild('nominationId'), equalTo(nominationId));
    
    const snapshot = await get(votesQuery);
    if (!snapshot.exists()) {
      return [];
    }
    
    const votes: Vote[] = [];
    snapshot.forEach((childSnapshot) => {
      votes.push(childSnapshot.val());
    });
    
    return votes;
  },

  async hasUserVoted(nominationId: string, voterIp: string): Promise<boolean> {
    const votes = await this.getVotesByNomination(nominationId);
    return votes.some(vote => vote.voterIp === voterIp);
  },

  // Game Votes operations
  async addGameVote(gameVote: Omit<GameVote, 'id'>): Promise<string> {
    const db = getFirebaseDatabase();
    const id = uuidv4();
    const gameVoteWithId = { ...gameVote, id };
    
    await set(ref(db, `gameVotes/${id}`), gameVoteWithId);
    return id;
  },

  async getGameVotes(gameId: string): Promise<GameVote[]> {
    const db = getFirebaseDatabase();
    const gameVotesRef = ref(db, 'gameVotes');
    const gameVotesQuery = query(gameVotesRef, orderByChild('gameId'), equalTo(gameId));
    
    const snapshot = await get(gameVotesQuery);
    if (!snapshot.exists()) {
      return [];
    }
    
    const gameVotes: GameVote[] = [];
    snapshot.forEach((childSnapshot) => {
      gameVotes.push(childSnapshot.val());
    });
    
    return gameVotes;
  },

  async hasUserVotedForGame(gameId: string, voterIp: string): Promise<boolean> {
    const votes = await this.getGameVotes(gameId);
    return votes.some(vote => vote.voterIp === voterIp);
  },

  // Game Rooms operations (if needed in the future)
  async createRoom(room: GameRoom): Promise<void> {
    const db = getFirebaseDatabase();
    await set(ref(db, `rooms/${room.roomCode}`), room);
  },

  async getRoom(roomCode: string): Promise<GameRoom | null> {
    const db = getFirebaseDatabase();
    const roomRef = ref(db, `rooms/${roomCode}`);
    
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val();
  },

  async updateRoom(roomCode: string, updates: Partial<GameRoom>): Promise<void> {
    const db = getFirebaseDatabase();
    const roomRef = ref(db, `rooms/${roomCode}`);
    
    // Get current room data
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const currentRoom = snapshot.val();
      await set(roomRef, { ...currentRoom, ...updates });
    }
  },

  async deleteRoom(roomCode: string): Promise<void> {
    const db = getFirebaseDatabase();
    await set(ref(db, `rooms/${roomCode}`), null);
  }
};