const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://learning-platform-1euu.onrender.com/api/v1';

export class GameAPI {
  constructor(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
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

  async getQuestions(gameId, lessonId) {
    const endpoint = lessonId 
      ? `/student-games/${gameId}/questions?lessonId=${lessonId}`
      : `/student-games/${gameId}/questions`;
    return this.request(endpoint);
  }

  async startSession(gameId, lessonId) {
    const endpoint = lessonId 
      ? `/student-games/${gameId}/sessions?lessonId=${lessonId}`
      : `/student-games/${gameId}/sessions`;
    return this.request(endpoint, {
      method: 'POST',
    });
  }

  async submitAnswers(sessionId, answers) {
    return this.request(`/student-games/sessions/${sessionId}/submit-answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async completeSession(sessionId) {
    return this.request(`/student-games/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }
}

export const BOY_GAME_ID = 9;

// Helper function to convert Arabic word to letters (removing diacritics)
export function wordToLetters(word) {
  // Remove Arabic diacritics (Tashkeel)
  const diacritics = /[\u064B-\u065F\u0670]/g;
  const cleanWord = word.replace(diacritics, '');
  
  // Split into individual characters
  return Array.from(cleanWord);
}
