export interface Group {
  name: string;
  words: string[];
  difficulty?: number;
}

export interface Puzzle {
  groups: Group[];
  date?: string;
} 