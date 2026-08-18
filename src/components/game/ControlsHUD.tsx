import { useState } from 'react';

export default function ControlsHUD({ onPause, onResume, onRestart }: { onPause: () => void, onResume: () => void, onRestart: () => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div id="controlsHUD">
        <button className="controlBtn" onClick={() => { setIsPaused(true); onPause(); }}>⏸</button>
        <button className="controlBtn" onClick={() => {
          setIsPaused(true);
          onPause();
          setShowConfirm(true);
        }}>↺</button>
      </div>

      {isPaused && !showConfirm && (
        <div id="pauseOverlay" className="active">
          <h1>PAUSED</h1>
          <button className="menuBtn" onClick={() => { setIsPaused(false); onResume(); }}>RESUME</button>
        </div>
      )}

      {showConfirm && (
        <div id="pauseOverlay" className="active" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            padding: '2rem',
            borderRadius: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>Restart the game?</h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setShowConfirm(false);
                  setIsPaused(false);
                  onResume();
                }}
              >Cancel</button>
              <button 
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(229, 62, 62, 0.3)',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setShowConfirm(false);
                  setIsPaused(false);
                  onRestart();
                }}
              >Restart</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}