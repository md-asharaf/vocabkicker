import { QUESTIONS_PER_GAME } from './engine/constants';

interface HUDProps {
  score: number;
  streak: number;
  qIdx: number;
  results: readonly { readonly correct: boolean; readonly word: string }[];
}

export default function HUD({ score, streak, qIdx, results }: HUDProps) {
  return (
    <div id="hud" style={{ display: 'flex' }}>
      <div className="hudItem">
        <span className="hudLabel">Score</span>
        <span className="hudValue">{score}</span>
      </div>
      <div className="hudItem">
        <div id="questionPills">
          {Array.from({ length: QUESTIONS_PER_GAME }).map((_, i) => {
            let cls = '';
            if (i < results.length) {
              cls = results[i].correct ? 'correct' : 'wrong';
            } else if (i === qIdx) {
              cls = 'current';
            }
            return <div key={i} className={`qPill ${cls}`} />;
          })}
        </div>
        <span className="hudLabel">Q. {qIdx + 1} / {QUESTIONS_PER_GAME}</span>
      </div>
      <div className="hudItem">
        <span className="hudLabel">&#x1F525; Streak</span>
        <span className="hudValue">{streak}</span>
      </div>
    </div>
  );
}