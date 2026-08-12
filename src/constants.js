// ─── World layout constants ────────────────────────────────────────
import * as THREE from 'three';

/** Goal dimensions (FIFA standard scale) */
export const GOAL_W = 15.0;   // goal width (widened)
export const GOAL_H = 4.0;    // goal height (increased even more)
export const GOAL_Z = -13.5;  // goal front face Z
export const GOAL_D = 1.5;    // goal depth  (m)

/** Goalkeeper Z (just inside goal mouth) */
export const GK_Z = GOAL_Z + 0.5;

/** GK X positions — evenly spaced across goal width */
export const GK_X = [
  -GOAL_W / 2 + GOAL_W * 0.125,   // A  (far left)
  -GOAL_W / 2 + GOAL_W * 0.375,   // B
   GOAL_W / 2 - GOAL_W * 0.375,   // C
   GOAL_W / 2 - GOAL_W * 0.125,   // D  (far right)
];

/** Ball rests at the penalty spot */
export const BALL_POS = new THREE.Vector3(0, 0.22, 5.5);

/**
 * Kicker starts slightly behind the ball to match the 2-3 step animation runup.
 */
export const KICKER_START = new THREE.Vector3(-0.1, 0, 7.3);

/** Jersey colors per goalkeeper slot */
export const GK_COLORS = [0xe74c3c, 0x3498db, 0xf39c12, 0x9b59b6];

/** Human-readable answer labels */
export const LETTERS = ['A', 'B', 'C', 'D'];
export const CARD_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'];

/** How many questions per game */
export const QUESTIONS_PER_GAME = 10;

/** Scoring */
export const PTS_CORRECT = 100;
export const PTS_WRONG   = -10;
