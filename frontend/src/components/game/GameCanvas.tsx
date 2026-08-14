'use client';

import { useEffect, useRef, useState } from 'react';
import { bootstrap, GameController } from './engine/main';
import { GameStatus } from '../../types/game';
import { QUESTIONS_PER_GAME } from './engine/constants';
import './engine/style.css';

import HUD from './HUD';
import MenuScreen from './MenuScreen';
import QuestionCard from './QuestionCard';
import FeedbackBanner from './FeedbackBanner';
import GameOverScreen from './GameOverScreen';
import LoadingScreen from './LoadingScreen';
import ControlsHUD from './ControlsHUD';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<GameController | null>(null);
  const initialized = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading VocabKicker 3D…");
  const [showMenu, setShowMenu] = useState(false);
  const [status, setStatus] = useState<GameStatus | null>(null);

  useEffect(() => {
    if (!initialized.current && canvasRef.current) {
      initialized.current = true;
      bootstrap(canvasRef.current, (s) => setStatus(s))
        .then((ctrl) => {
          controller.current = ctrl;
          setLoading(false);
          setShowMenu(true);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  const handleStart = async () => {
    setShowMenu(false);
    setLoadingMessage("Preparing game...");
    setLoading(true);
    await controller.current?.startGame();
    setLoading(false);
  };

  const handleMenu = () => {
    setStatus(null);
    setShowMenu(true);
  };

  const isGameOver = status && status.qIdx >= QUESTIONS_PER_GAME;
  const isGameActive = status !== null && !showMenu && !isGameOver;

  return (
    <div id="gameContainer">
      <canvas ref={canvasRef} id="gameCanvas"></canvas>

      {loading && <LoadingScreen message={loadingMessage} />}

      {!loading && showMenu && <MenuScreen onStart={handleStart} />}

      {isGameActive && status && (
        <>
          <HUD score={status.score} streak={status.streak} qIdx={status.qIdx} results={status.results} />
          <ControlsHUD
            onPause={() => controller.current?.pause()}
            onResume={() => controller.current?.resume()}
            onRestart={async () => {
              setLoadingMessage("Preparing game...");
              setLoading(true);
              setStatus(null);
              await controller.current?.restart();
              setLoading(false);
            }}
          />
          {status.question && <QuestionCard question={status.question} />}
        </>
      )}

      {status?.feedback && <FeedbackBanner feedback={status.feedback} />}

      {isGameOver && status && (
        <GameOverScreen
          score={status.score}
          results={status.results}
          maxStreak={status.maxStreak}
          onPlayAgain={handleStart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}
