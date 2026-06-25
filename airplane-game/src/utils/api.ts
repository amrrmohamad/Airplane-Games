import type { Question } from '../data/questions';

export async function fetchGameQuestions(gameId: number, lessonId?: number): Promise<Question[]> {
  // If lessonId provided, call the public endpoint which requires lessonId
  if (typeof lessonId === 'number') {
    const res = await fetch(`/api/v1/game/${gameId}/questions?lessonId=${lessonId}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch game questions: ${res.status}`);
    }

    const body = await res.json();
    return body?.data || [];
  }

  // If lessonId is not provided, try student convenience endpoint which resolves the child's current lesson server-side
  try {
    const res = await fetch(`/api/v1/student/game/${gameId}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (res.ok) {
      const body = await res.json();
      // shape: { success: true, data: { lessonId, questions: Question[] } }
      if (body?.data?.questions) return body.data.questions as Question[];
    }
  } catch (err) {
    // ignore and fallback to public endpoint without lessonId
  }

  // Last resort: call public endpoint without lessonId (might return 400) and let caller fallback
  const res = await fetch(`/api/v1/game/${gameId}/questions`, {
    headers: { 'Accept': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch game questions: ${res.status}`);
  }

  const body = await res.json();
  return body?.data || [];
}
