export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'single' | 'multiplayer';
  minPlayers?: number;
  maxPlayers?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}