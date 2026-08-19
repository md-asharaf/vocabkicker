import { QuizQuestion } from '../types/game';

export class QuizApi {
  public static async fetchQuestions(): Promise<QuizQuestion[]> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

      if (!projectId) {
        console.error('NEXT_PUBLIC_PROJECT_ID is not configured in the environment.');
        return [];
      }

      const url = `${baseUrl}/projects/${projectId}/quiz`;
      const res = await fetch(url);

      if (!res.ok) throw new Error('Failed to fetch questions from backend');

      const json = await res.json();

      if (json && json.success && Array.isArray(json.data)) {
        return json.data as QuizQuestion[];
      }

      if (Array.isArray(json)) {
        return json as QuizQuestion[];
      }

      throw new Error('Unexpected response format');
    } catch (err) {
      console.error('Backend is down!', err);
      return [];
    }
  }
}
