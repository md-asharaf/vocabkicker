

interface HUDProps {
  score: number;
  streak: number;
  qIdx: number;
  totalQuestions: number;
  results: readonly { readonly correct: boolean; readonly answerText: string }[];
}

export default function HUD({ score, streak, qIdx, totalQuestions, results }: HUDProps) {
  return (
    <div id="hud" style={{ display: 'flex' }}>
      <div className="hudItem">
        <span className="hudLabel">Score</span>
        <span className="hudValue">{score}</span>
      </div>
      <div className="hudItem" style={{ flexGrow: 1, maxWidth: '400px', margin: '0 1rem' }}>
        <div id="progressBarContainer">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            let cls = '';
            if (i < results.length) {
              cls = results[i].correct ? 'correct' : 'wrong';
            } else if (i === qIdx) {
              cls = 'current';
            }
            return <div key={i} className={`progressSegment ${cls}`} style={{ width: `${100 / totalQuestions}%` }} />;
          })}
        </div>
        <span className="hudLabel">Q. {qIdx + 1} / {totalQuestions}</span>
      </div>
      <div className="hudItem">
        <span className="hudLabel">&#x1F525; Streak</span>
        <span className="hudValue">{streak}</span>
      </div>
    </div>
  );
}