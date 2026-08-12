/**
 * main.js  —  Entry point.
 *
 * Wires together all systems and runs the game loop.
 */
import * as THREE from 'three';

import { initScene, resizeScene, scene, camera, renderer } from './scene.js';
import { setupLighting }   from './lighting.js';
import { createPitch }     from './world/pitch.js';
import { createGoal }      from './world/goal.js';
import { createStadium }   from './world/stadium.js';
import { Kicker }          from './characters/Kicker.js';
import { Ball }            from './game/Ball.js';
import { Trajectory }      from './game/Trajectory.js';
import { ParticleSystem }  from './game/Particles.js';
import { Input }           from './game/Input.js';
import { Quiz }            from './game/Quiz.js';
import { GameState }       from './game/GameState.js';
import { UIManager }       from './ui/UIManager.js';
import { assetManager }    from './AssetManager.js';

async function bootstrap() {
  const canvas = document.getElementById('gameCanvas');

  // ── Three.js scene ──────────────────────────────────────────────
  initScene(canvas);
  window.addEventListener('resize', resizeScene);
  resizeScene();

  // ── World ────────────────────────────────────────────────────────
  setupLighting(scene);
  createPitch(scene);
  const goal = createGoal(scene);
  createStadium(scene);

  // ── Load vocab data and 3D Assets ────────────────────────────────
  const ui    = new UIManager();
  ui.showLoading();
  const quiz  = new Quiz();
  const input = new Input(canvas);

  try {
    await quiz.load();
    await assetManager.loadAll(); // Wait for FBX files to load
  } catch (err) {
    console.error('Failed to load data or assets', err);
    document.getElementById('loadingScreen').innerHTML =
      '<p style="color:#f88;font-family:Outfit,sans-serif;font-size:1rem">Failed to load data or assets.</p>';
    return;
  }
  ui.hideLoading();
  ui.showMenu();

  // ── Game objects ─────────────────────────────────────────────────
  const kicker     = new Kicker();
  kicker.addToScene(scene);

  const ball       = new Ball();
  ball.addToScene(scene);

  const trajectory = new Trajectory();
  trajectory.addToScene(scene);

  const particles  = new ParticleSystem(scene);

  // ── Camera base position (used for shake reset) ───────────────────
  const camBase = camera.position.clone();

  // ── State machine ─────────────────────────────────────────────────
  const gameState = new GameState({
    scene, ball, trajectory, particles, kicker, quiz, ui, input, camBase,
    goalNet: goal.userData.backNet
  });

  // ── Button wiring ─────────────────────────────────────────────────
  document.getElementById('startBtn').addEventListener('click', () => gameState.startGame());
  document.getElementById('playAgainBtn').addEventListener('click', () => gameState.startGame());
  document.getElementById('menuBtn2').addEventListener('click', () => {
    ui.hideGameOver();
    ui.hideGame();
    ui.showMenu();
  });
  document.getElementById('hintBtn').addEventListener('click', () => ui.toggleHint());

  let isPaused = false;
  const pauseOverlay = document.getElementById('pauseOverlay');

  document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = true;
    input.enabled = false;
    pauseOverlay.classList.add('active');
  });

  document.getElementById('resumeBtn').addEventListener('click', () => {
    isPaused = false;
    input.enabled = true;
    pauseOverlay.classList.remove('active');
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    if (confirm('Restart the game?')) {
      isPaused = false;
      input.enabled = true;
      pauseOverlay.classList.remove('active');
      gameState.startGame();
    }
  });

  // ── Game loop ─────────────────────────────────────────────────────
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
}

bootstrap();
