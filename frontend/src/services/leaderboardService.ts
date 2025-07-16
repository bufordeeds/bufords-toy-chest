export interface LeaderboardEntry {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: string;
  rank: number;
  daysAgo: number;
}

export interface SubmitScoreRequest {
  gameId: string;
  playerName: string;
  score: number;
}

export interface SubmitScoreResponse {
  id: string;
  gameId: string;
  playerName: string;
  score: number;
  achievedAt: string;
  rank: number;
  message: string;
}

export interface RankCheckResponse {
  rank: number;
  isTopTen: boolean;
  wouldMakeTopTen: boolean;
  tenthPlaceScore: number | null;
}

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com' 
  : 'http://localhost:3001';

class LeaderboardService {
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

  async getLeaderboard(gameId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await this.fetchWithErrorHandling(
      `${API_BASE_URL}/api/leaderboard/${gameId}?limit=${limit}`
    );
    
    return response.json();
  }

  async submitScore(request: SubmitScoreRequest): Promise<SubmitScoreResponse> {
    const response = await this.fetchWithErrorHandling(
      `${API_BASE_URL}/api/leaderboard/submit`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    
    return response.json();
  }

  async checkRank(gameId: string, score: number): Promise<RankCheckResponse> {
    const response = await this.fetchWithErrorHandling(
      `${API_BASE_URL}/api/leaderboard/${gameId}/check-rank`,
      {
        method: 'POST',
        body: JSON.stringify({ score }),
      }
    );
    
    return response.json();
  }

  async getPersonalBest(gameId: string, playerName: string): Promise<LeaderboardEntry | null> {
    try {
      const response = await this.fetchWithErrorHandling(
        `${API_BASE_URL}/api/leaderboard/${gameId}/personal-best/${encodeURIComponent(playerName)}`
      );
      
      const data = await response.json();
      return data.personalBest;
    } catch (error) {
      console.error('Failed to fetch personal best:', error);
      return null;
    }
  }

  async isHighScore(gameId: string, score: number): Promise<boolean> {
    try {
      const rankCheck = await this.checkRank(gameId, score);
      return rankCheck.wouldMakeTopTen;
    } catch (error) {
      console.error('Failed to check if high score:', error);
      return false;
    }
  }
}

export const leaderboardService = new LeaderboardService();