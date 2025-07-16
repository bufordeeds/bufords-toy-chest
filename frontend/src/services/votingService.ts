import apiClient from '../utils/apiClient';

export interface GameVotes {
  gameId: string;
  votes: number;
  userVoted: boolean;
}

export interface VoteResponse {
  gameId: string;
  votes: number;
}

class VotingService {
  async getVotes(): Promise<GameVotes[]> {
    try {
      const response = await apiClient.get<GameVotes[]>('/votes');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch votes:', error);
      return [];
    }
  }

  async voteForGame(gameId: string): Promise<VoteResponse | null> {
    try {
      const response = await apiClient.post<VoteResponse>(`/votes/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to vote for game:', error);
      return null;
    }
  }

  async removeVote(gameId: string): Promise<VoteResponse | null> {
    try {
      const response = await apiClient.delete<VoteResponse>(`/votes/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove vote:', error);
      return null;
    }
  }
}

export const votingService = new VotingService();