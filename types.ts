
export interface Flashcard {
  id: string;
  question: string;
  options?: string[]; // Multiple choice options if available
  answer: string;
  explanation?: string; // Analysis or reasoning
  sourceName?: string; // Name of the document or topic source
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
  difficulty?: Difficulty;
}

export interface SessionStats {
  knownIds: string[];
  unknownIds: string[];
  timestamp: number;
}

export interface GlobalStats {
  totalReviewed: number;
  totalKnown: number;
  totalUnknown: number;
  sessions: SessionStats[];
}

export enum Difficulty {
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  EXPERT = 'EXPERT'
}

export enum ViewMode {
  LIBRARY = 'LIBRARY',
  STUDY = 'STUDY',
  CREATE = 'CREATE',
  STATS = 'STATS'
}
