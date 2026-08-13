'use client';

import { useEffect, useRef, useState } from 'react';
import { bootstrap, GameController } from './game/engine/main';
import { GameStatus } from '../types/game';
import { QUESTIONS_PER_GAME } from './game/engine/constants';
import './game/engine/style.css';

import HUD from './game/HUD';
import MenuScreen from './game/MenuScreen';
import QuestionCard from './game/QuestionCard';
import FeedbackBanner from './game/FeedbackBanner';
import GameOverScreen from './game/GameOverScreen';
import LoadingScreen from './game/LoadingScreen';
import ControlsHUD from './game/ControlsHUD';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<GameController | null>(null);
  const initialized = useRef(false);

  const [loading, setLoading] = useState(true);
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

  const handleStart = () => {
    setShowMenu(false);
    controller.current?.startGame();
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

      {loading && <LoadingScreen />}

      {!loading && showMenu && <MenuScreen onStart={handleStart} />}

      {isGameActive && status && (
        <>
          <HUD score={status.score} streak={status.streak} qIdx={status.qIdx} results={status.results} />
          <ControlsHUD
            onPause={() => controller.current?.pause()}
            onResume={() => controller.current?.resume()}
            onRestart={() => controller.current?.restart()}
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
