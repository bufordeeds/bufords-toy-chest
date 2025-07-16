export interface GameVotes {
  gameId: string;
  votes: number;
  userVoted: boolean;
}

export interface VoteResponse {
  gameId: string;
  votes: number;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://toy-chest-backend.onrender.com' 
    : 'http://localhost:3001');

class VotingService {
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getVotes(): Promise<GameVotes[]> {
    try {
      const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/api/voting/votes`);
      return response.json();
    } catch (error) {
      console.error('Failed to fetch votes:', error);
      return [];
    }
  }

  async voteForGame(gameId: string): Promise<VoteResponse | null> {
    try {
      const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/api/voting/votes/${gameId}`, {
        method: 'POST',
      });
      return response.json();
    } catch (error) {
      console.error('Failed to vote for game:', error);
      return null;
    }
  }

  async removeVote(gameId: string): Promise<VoteResponse | null> {
    try {
      const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/api/voting/votes/${gameId}`, {
        method: 'DELETE',
      });
      return response.json();
    } catch (error) {
      console.error('Failed to remove vote:', error);
      return null;
    }
  }
}

export const votingService = new VotingService();