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

      const rawArray = (json && json.success && Array.isArray(json.data))
        ? json.data
        : (Array.isArray(json) ? json : []);

      return rawArray.map((q: any) => {
        const answerObj = q.answer || { label: "Answer", value: "Unknown" };

        return {
          prompt: q.prompt || { label: "Question", value: "Unknown Question" },
          answer: answerObj,
          hint: q.hint,
          options: q.options || []
        };
      }) as QuizQuestion[];

    } catch (err) {
      console.error('Backend is down!', err);
      return [];
    }
  }
}
