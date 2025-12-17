export enum GameState {
  SETUP = 'SETUP',
  CATEGORY_SELECT = 'CATEGORY_SELECT',
  LOADING_WORDS = 'LOADING_WORDS',
  PLAYING = 'PLAYING',
  ROUND_OVER = 'ROUND_OVER',
  ROUND_SUMMARY = 'ROUND_SUMMARY',
  GAME_OVER = 'GAME_OVER',
}

export enum TeamId {
  A = 'A',
  B = 'B',
}

export interface Team {
  id: TeamId;
  name: string;
  score: number;
  color: string;
  bgColor: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  geminiPrompt: string;
}

export interface GameSettings {
  winningScore: number;
}