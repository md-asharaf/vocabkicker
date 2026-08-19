import { QUESTIONS_PER_GAME } from './engine/constants';

interface Props {
  score: number;
  results: readonly { readonly correct: boolean; readonly answerText: string }[];
  maxStreak: number;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ score, results, maxStreak, onPlayAgain, onMenu }: Props) {
  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = Math.round((correctCount / QUESTIONS_PER_GAME) * 100);
  const stars = correctCount >= 8 ? '⭐⭐⭐' : correctCount >= 5 ? '⭐⭐' : correctCount >= 3 ? '⭐' : '😔';

  return (
    <div id="gameOverScreen" style={{ display: 'flex' }}>
      <div className="starsRow">{stars}</div>
      <h2>FULL TIME!</h2>
      <div id="goScoreBig">{score}</div>
      <div className="goStat">
        Goals: <span>{correctCount}</span> / {QUESTIONS_PER_GAME}
      </div>
      <div className="goStat">
        Best Streak: <span>{maxStreak}</span> &#x1F525;
      </div>
      <div className="goStat">
        Accuracy: <span>{accuracy}%</span>
      </div>

      <div className="goButtons">
        <button className="goBtn primary" onClick={onPlayAgain}>&#x26BD; Play Again</button>
        <button className="goBtn secondary" onClick={onMenu}>&#x1F3E0; Menu</button>
      </div>
    </div>
  );
}