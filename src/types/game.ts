export interface QuizQuestion {
  readonly prompt: { label: string, value: string };
  readonly answerField: { label: string, value: string };
  readonly answer: string;
  readonly hints: readonly { label: string, value: string }[];
  readonly options: readonly string[];
}

export interface GameStatus {
  readonly phase: string;
  readonly score: number;
  readonly streak: number;
  readonly qIdx: number;
  readonly maxStreak: number;
  readonly results: readonly { readonly correct: boolean; readonly word: string }[];
  readonly question: QuizQuestion | null;
  readonly feedback: { readonly correct: boolean; readonly pts: number; readonly msg: string | null } | null;
}
