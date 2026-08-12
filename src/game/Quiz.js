/**
 * Quiz.js  —  Vocabulary data loading and question generation.
 *
 * Each question:
 *   { definition, answer, mnemonic, options: string[4] }
 * Options are shuffled — one is the correct word, three are random distractors.
 */
import { QUESTIONS_PER_GAME } from '../constants.js';

export class Quiz {
  constructor() {
    this._vocab    = [];  // raw vocab entries from data.json
    this.questions = [];  // built for current game
  }

  /** @returns {Promise<void>} */
  async load() {
    const res       = await fetch('./data.json');
    this._vocab     = await res.json();
  }

  /** Build a fresh set of QUESTIONS_PER_GAME shuffled questions. */
  buildQuestions() {
    const shuffled = [...this._vocab].sort(() => Math.random() - 0.5);
    this.questions = shuffled.slice(0, QUESTIONS_PER_GAME).map(entry => {
      const wrong = this._vocab
        .filter(v => v.word !== entry.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.word);
      const options = [...wrong, entry.word].sort(() => Math.random() - 0.5);
      return {
        definition: entry.definition,
        answer:     entry.word,
        mnemonic:   entry.mnemonic || '',
        options,
      };
    });
  }

  /** @param {number} idx */
  getQuestion(idx) {
    return this.questions[idx] ?? null;
  }
}
