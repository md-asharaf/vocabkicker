import { useEffect, useState } from 'react';

interface Props {
  feedback: { correct: boolean; pts: number; msg: string | null };
}

const GOAL_EMOJIS = ['⚽🎉', '🥅✨', '💯🔥', '🎯⚡', '🌟💥'];
const MISS_EMOJIS = ['😬🧤', '🙈❌', '💨🤦', '🛑😮', '😤🧤'];
const GOAL_TITLES = ['Gooal!', 'Perfect Shot!', 'BullsEye!', 'Amazing!', 'Great Kick!'];
const MISS_TITLES = ['Blocked!', 'Caught!', 'Wrong Answer!', 'Saved!', 'Missed!'];

export default function FeedbackBanner({ feedback }: Props) {
  const [show, setShow] = useState(false);
  const [emoji, setEmoji] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const idx = Math.floor(Math.random() * 5);
    setEmoji(feedback.correct ? GOAL_EMOJIS[idx] : MISS_EMOJIS[idx]);
    setTitle(feedback.msg || (feedback.correct ? GOAL_TITLES[idx] : MISS_TITLES[idx]));
    
    setShow(true);
    const timer = setTimeout(() => setShow(false), 2400); // Hide before next question
    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div id="feedbackOverlay">
      <div id="feedbackBanner" className={`${feedback.correct ? 'correct' : 'wrong'} ${show ? 'show' : ''}`}>
        <span id="feedbackEmoji">{emoji}</span>
        <div id="feedbackTitle" style={{ color: feedback.correct ? '#22c55e' : '#ef4444' }}>
          {title}
        </div>
        <div id="feedbackPoints" style={{ color: feedback.pts > 0 ? '#ffd700' : '#ff6b35' }}>
          {feedback.pts > 0 ? `+${feedback.pts}` : feedback.pts} pts
        </div>
      </div>
    </div>
  );
}