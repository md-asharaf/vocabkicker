import { QuizApi } from '@/api/quizApi';
import { QuizQuestion } from '@/types/game';

export class Quiz {
  private _questions: readonly QuizQuestion[];

  constructor() {
    this._questions = [];
  }

  public async load(): Promise<void> {
    this._questions = await QuizApi.fetchQuestions();
  }

  public get length(): number {
    return this._questions.length;
  }

  public getQuestion(idx: number): QuizQuestion | null {
    return this._questions[idx] ?? null;
  }
}

