/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types/game';
import { CARD_COLORS, LETTERS } from './engine/constants';

interface Props {
  question: QuizQuestion;
}

export default function QuestionCard({ question }: Props) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [question]);

  return (
    <>
      <div id="questionCard" style={{ display: 'block' }}>
        <div id="definitionText">&quot;{question.prompt?.value}&quot;</div>
        <div id="optionsRow">
          {question.options.map((opt, idx) => (
            <div key={idx} className="optItem" style={{ color: '#ccc' }}>
              <span className="optLetter" style={{ background: CARD_COLORS[idx] }}>
                {LETTERS[idx]}
              </span>{' '}
              {opt}
            </div>
          ))}
        </div>
        <div id="hintRow">
          <button id="hintBtn" onClick={() => setShowHint(!showHint)}>
            &#x1F4A1; Hint
          </button>
        </div>
      </div>

      {showHint && (
        <div id="hintText" style={{ display: 'inline' }}>
          {question.hint ? `${question.hint.label}: ${question.hint.value}` : "No hint available"}
        </div>
      )}
    </>
  );
}