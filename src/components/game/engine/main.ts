import * as THREE from 'three';

import { initScene, resizeScene, scene, camera, renderer } from './scene';
import { setupLighting } from './lighting';
import { createPitch } from './world/pitch';
import { createGoal } from './world/goal';
import { createStadium } from './world/stadium';
import { Kicker } from './characters/Kicker';
import { Ball } from './game/Ball';
import { Trajectory } from './game/Trajectory';
import { ParticleSystem } from './game/Particles';
import { Input } from './game/Input';
import { Quiz } from './game/Quiz';
import { GameState } from './game/GameState';
import { GameStatus } from '@/types/game';
import { assetManager } from './AssetManager';

export interface GameController {
  waitForAssets: () => Promise<void>;
  loadQuiz: () => Promise<void>;
  startGame: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => Promise<void>;
}

export async function bootstrap(canvas: HTMLCanvasElement, onUpdate: (status: GameStatus) => void, onProgress?: (progress: number) => void): Promise<GameController> {
  initScene(canvas);
  window.addEventListener('resize', resizeScene);
  resizeScene();

  setupLighting(scene);
  createPitch(scene);
  const goal = createGoal(scene);
  createStadium(scene);

  const quiz = new Quiz();
  const input = new Input(canvas);

  let isPaused = false;
  const clock = new THREE.Clock();
  let gameState: GameState | null = null;
  let loadPromise: Promise<void>;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!isPaused && gameState) {
      gameState.update(dt);
    }

    renderer.render(scene, camera);
  }

  animate();

  loadPromise = assetManager.loadAll(onProgress || (() => { })).then(() => {
    const kicker = new Kicker();
    kicker.addToScene(scene);

    const ball = new Ball();
    ball.addToScene(scene);

    const trajectory = new Trajectory();
    trajectory.addToScene(scene);

    const particles = new ParticleSystem(scene);
    const camBase = camera.position.clone();

    gameState = new GameState({
      scene, ball, trajectory, particles, kicker, quiz, input, camBase,
      goalNet: goal.userData.backNet,
      onUpdate
    });
  }).catch(err => {
    console.error('Failed to load assets', err);
  });

  return {
    waitForAssets: async () => {
      await loadPromise;
    },
    loadQuiz: async () => {
      await quiz.load();
    },
    startGame: () => {
      gameState!.startGame();
    },
    pause: () => {
      isPaused = true;
      input.enabled = false;
    },
    resume: () => {
      isPaused = false;
      input.enabled = true;
    },
    restart: async () => {
      isPaused = false;
      input.enabled = true;
      await quiz.load();
      gameState!.startGame();
    }
  };
}

