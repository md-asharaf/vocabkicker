import { useState } from 'react';

export default function ControlsHUD({ onPause, onResume, onRestart }: { onPause: () => void, onResume: () => void, onRestart: () => void }) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <>
      <div id="controlsHUD">
        <button className="controlBtn" onClick={() => { setIsPaused(true); onPause(); }}>⏸</button>
        <button className="controlBtn" onClick={() => {
          if (confirm('Restart the game?')) {
            setIsPaused(false);
            onRestart();
          }
        }}>↺</button>
      </div>

      {isPaused && (
        <div id="pauseOverlay" className="active">
          <h1>PAUSED</h1>
          <button className="menuBtn" onClick={() => { setIsPaused(false); onResume(); }}>RESUME</button>
        </div>
      )}
    </>
  );
}