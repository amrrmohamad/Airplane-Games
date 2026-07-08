export interface Question {
  id: string;
  word: string;
  choices: Array<{
    text: string;
    imageUrl?: string | null;
  }>;
  correctChoice: string;
  imageUrl?: string | null;
}

// Questions are now loaded from backend API
export const QUESTIONS: Question[] = [];

export function getRandomQuestions(count: number = 10): Question[] {
  return QUESTIONS;
}
