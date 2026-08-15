import { QuizQuestion } from '../types/game';

export class QuizApi {
  private static readonly API_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/quiz/generate`
    : 'http://localhost:8080/quiz/generate';
  public static async fetchQuestions(): Promise<QuizQuestion[]> {
    try {
      const res = await fetch(QuizApi.API_URL);
      if (!res.ok) throw new Error('Failed to fetch questions from backend');
      return (await res.json()) as QuizQuestion[];
    } catch (err) {
      console.error('Backend is down!', err);
      return [];
    }
  }
}

