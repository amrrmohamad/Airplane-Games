export interface Question {
  id: number;
  image: string;
  word: string;
  distractors: string[];
}

// Questions are now loaded from backend API
export const QUESTIONS: Question[] = [];
