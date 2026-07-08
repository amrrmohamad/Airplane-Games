const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://learning-platform-1euu.onrender.com/api/v1';

export interface Question {
  id: number;
  question: string;
  options: string[];
  points?: number;
  timeLimit?: number;
  order?: number;
  hint?: string;
  imageUrl?: string;
}

export interface GameSession {
  id: string;
  gameId: number;
  childId: number;
  lessonId: number;
  status: 'STARTED' | 'COMPLETED';
  score: number;
  totalPoints: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export interface Answer {
  questionId: number;
  selectedAnswer: string;
  timeTaken?: number;
}

export interface CompletionResult {
  score: number;
  percentage: number;
  stars: number;
  coins: number;
  experience: number;
  isNewReward: boolean;
  session: GameSession;
}

export class GameAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'API request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  async getQuestions(gameId: number, lessonId?: number): Promise<{ lessonId: number; lessonName: string; questions: Question[] }> {
    const endpoint = lessonId 
      ? `/student-games/${gameId}/questions?lessonId=${lessonId}`
      : `/student-games/${gameId}/questions`;
    return this.request(endpoint);
  }

  async startSession(gameId: number, lessonId?: number): Promise<GameSession> {
    const endpoint = lessonId 
      ? `/student-games/${gameId}/sessions?lessonId=${lessonId}`
      : `/student-games/${gameId}/sessions`;
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  async submitAnswers(sessionId: string, answers: Answer[]): Promise<{ answers: any[]; session: GameSession }> {
    return this.request(`/student-games/sessions/${sessionId}/submit-answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async completeSession(sessionId: string): Promise<CompletionResult> {
    return this.request(`/student-games/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }
}

export const AIRPLANE_GAME_ID = 8;
