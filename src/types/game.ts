export interface QuizQuestion {
  readonly prompt: { label: string, value: string };
  readonly answer: { label: string, value: string };
  readonly hint?: { label: string, value: string };
  readonly options: readonly string[];
}

export interface GameStatus {
  readonly phase: string;
  readonly score: number;
  readonly streak: number;
  readonly qIdx: number;
  readonly totalQuestions: number;
  readonly maxStreak: number;
  readonly results: readonly { readonly correct: boolean; readonly answerText: string }[];
  readonly question: QuizQuestion | null;
  readonly feedback: { readonly correct: boolean; readonly pts: number; readonly msg: string | null } | null;
}
