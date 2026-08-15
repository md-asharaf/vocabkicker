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
  startGame: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  restart: () => Promise<void>;
}

export async function bootstrap(canvas: HTMLCanvasElement, onUpdate: (status: GameStatus) => void): Promise<GameController> {
  initScene(canvas);
  window.addEventListener('resize', resizeScene);
  resizeScene();

  setupLighting(scene);
  createPitch(scene);
  const goal = createGoal(scene);
  createStadium(scene);

  // ── Load vocab data and 3D Assets ────────────────────────────────
  const quiz = new Quiz();
  const input = new Input(canvas);

  try {
    await assetManager.loadAll(null); // Wait for FBX files to load
  } catch (err) {
    console.error('Failed to load assets', err);
    throw err;
  }

  // ── Game objects ─────────────────────────────────────────────────
  const kicker = new Kicker();
  kicker.addToScene(scene);

  const ball = new Ball();
  ball.addToScene(scene);

  const trajectory = new Trajectory();
  trajectory.addToScene(scene);

  const particles = new ParticleSystem(scene);

  // ── Camera base position (used for shake reset) ───────────────────
  const camBase = camera.position.clone();

  // ── State machine ─────────────────────────────────────────────────
  const gameState = new GameState({
    scene, ball, trajectory, particles, kicker, quiz, input, camBase,
    goalNet: goal.userData.backNet,
    onUpdate
  });

  let isPaused = false;

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!isPaused) {
      gameState.update(dt);
    }

    renderer.render(scene, camera);
  }

  animate();

  return {
    startGame: async () => {
      await quiz.load();
      gameState.startGame();
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
      gameState.startGame();
    }
  };
}

