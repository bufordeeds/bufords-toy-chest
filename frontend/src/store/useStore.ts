import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameVotes } from '../services/votingService';

interface UserPreferences {
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  playerName: string;
}

interface GameScore {
  gameId: string;
  highScore: number;
  lastPlayed: Date;
}

interface MultiplayerRoom {
  roomCode: string;
  gameId: string;
  players: string[];
  isHost: boolean;
  gameState: any;
}

interface AppStore {
  // User preferences
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Game scores
  gameScores: GameScore[];
  updateGameScore: (gameId: string, score: number) => void;
  
  // Multiplayer
  currentRoom: MultiplayerRoom | null;
  setCurrentRoom: (room: MultiplayerRoom | null) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Voting
  gameVotes: GameVotes[];
  setGameVotes: (votes: GameVotes[]) => void;
  updateGameVote: (gameId: string, votes: number, userVoted: boolean) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // User preferences
      preferences: {
        soundEnabled: true,
        theme: 'light',
        playerName: '',
      },
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      
      // Game scores
      gameScores: [],
      updateGameScore: (gameId, score) =>
        set((state) => {
          const existingScore = state.gameScores.find((s) => s.gameId === gameId);
          if (existingScore) {
            if (score > existingScore.highScore) {
              return {
                gameScores: state.gameScores.map((s) =>
                  s.gameId === gameId
                    ? { ...s, highScore: score, lastPlayed: new Date() }
                    : s
                ),
              };
            }
            return {
              gameScores: state.gameScores.map((s) =>
                s.gameId === gameId ? { ...s, lastPlayed: new Date() } : s
              ),
            };
          }
          return {
            gameScores: [
              ...state.gameScores,
              { gameId, highScore: score, lastPlayed: new Date() },
            ],
          };
        }),
      
      // Multiplayer
      currentRoom: null,
      setCurrentRoom: (room) => set({ currentRoom: room }),
      
      // UI state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      // Voting
      gameVotes: [],
      setGameVotes: (votes) => set({ gameVotes: votes }),
      updateGameVote: (gameId, votes, userVoted) =>
        set((state) => ({
          gameVotes: state.gameVotes.map((v) =>
            v.gameId === gameId ? { ...v, votes, userVoted } : v
          ),
        })),
    }),
    {
      name: 'bufords-toy-chest',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        gameScores: state.gameScores,
      }),
    }
  )
);