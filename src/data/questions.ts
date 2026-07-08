export interface Question {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  category: 'math' | 'science' | 'general';
  categoryName: string;
}

// Questions are now loaded from backend API
// Admin must add questions via backend for each game and lesson
export const QUESTIONS: Question[] = [];

export const getQuestionsByCategory = (category: string | 'all'): Question[] => {
  return QUESTIONS;
};
