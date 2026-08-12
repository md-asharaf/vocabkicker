/**
 * GameState.js  —  Central state machine and game orchestrator.
 *
 * Phases
 * ──────
 *  IDLE     → waiting for player drag
 *  AIMING   → player dragging, trajectory shown
 *  KICKING  → kicker run-up in progress
 *  FLYING   → ball in flight
 *  RESULT   → feedback displayed, waiting for next question
 *
 * Answer cards (THREE.Sprite) are rebuilt for every question.
 */
import * as THREE from 'three';
import {
  GK_X, GK_Z, GOAL_W, GOAL_H, BALL_POS, CARD_COLORS, LETTERS,
  GK_COLORS, QUESTIONS_PER_GAME, PTS_CORRECT, PTS_WRONG
} from '../constants.js';
import { Goalkeeper } from '../characters/Goalkeeper.js';
import { camera } from '../scene.js';
import { playKick, playGoal, playMiss, playWhistle, playStep } from '../audio/sounds.js';

// ── Answer-card sprite factory ────────────────────────────────────

function makeCardSprite(letter, colorHex) {
  const CW = 160, CH = 160;
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const ctx = c.getContext('2d');

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Box background
  ctx.fillStyle = 'rgba(6,6,6,0.92)'; rr(0, 0, CW, CH, 22); ctx.fill();
  ctx.strokeStyle = colorHex; ctx.lineWidth = 8;
  rr(4, 4, CW - 8, CH - 8, 18); ctx.stroke();

  // Letter fill
  ctx.fillStyle = colorHex; rr(8, 8, CW - 16, CH - 16, 14); ctx.fill();

  // Letter text
  ctx.fillStyle = '#fff'; ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(letter, CW / 2, CH / 2 + 5);

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(1.2, 1.2, 1);
  return sp;
}

// ── Phases ────────────────────────────────────────────────────────

const PHASE = {
  IDLE: 'idle',
  AIMING: 'aiming',
  KICKING: 'kicking',
  FLYING: 'flying',
  RESULT: 'result',
};

// ── GameState ─────────────────────────────────────────────────────

export class GameState {
  constructor({ scene, ball, trajectory, particles, kicker, quiz, ui, input, camBase, goalNet }) {
    this._scene = scene;
    this._ball = ball;
    this._traj = trajectory;
    this._pfx = particles;
    this._kicker = kicker;
    this._quiz = quiz;
    this._ui = ui;
    this._input = input;
    this._camBase = camBase.clone();
    this._goalNet = goalNet;

    // Track original net vertices for deformation
    this._origNetVerts = [];
    this._netHitT = 0;
    this._netHitPos = new THREE.Vector3();
    if (this._goalNet) {
      const pos = this._goalNet.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        this._origNetVerts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
      }
    }

    // Persistent GK objects (reused, repositioned each question)
    this._gks = GK_COLORS.map((c, i) => new Goalkeeper(c, i));
    this._gks.forEach(gk => gk.addToScene(scene));

    this._cardSprites = [];

    // Scoring
    this._score = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._results = [];

    // Current question state
    this._qIdx = 0;
    this._phase = PHASE.IDLE;
    this._aimX = 0;
    this._aimY = 0.5;
    this._curveFactor = 0;
    this._aimTarget = new THREE.Vector3();

    // Camera shake
    this._shakeT = 0;
    this._shakeMag = 0;

    // Goal flash plane
    this._flashMesh = (() => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 35),
        new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide }),
      );
      m.position.set(0, 6, 0); m.rotation.x = -0.2;
      scene.add(m); return m;
    })();
    this._flashT = 0;

    this._bindInput();
  }

  // ── Input binding ─────────────────────────────────────────────

  _bindInput() {
    const inp = this._input;

    inp.onDragStart = () => {
      if (this._phase !== PHASE.IDLE) return;
      this._phase = PHASE.AIMING;
    };

    inp.onDragMove = (aimX, aimY, curveFactor, power, sx, sy) => {
      if (this._phase !== PHASE.AIMING) return;
      this._aimX = aimX;
      this._aimY = aimY;
      this._curveFactor = curveFactor;
      this._updateAimTarget();
      this._traj.update(this._ball.mesh.position, this._aimTarget, curveFactor);

      // Project aim target to screen for ring
      const proj = this._aimTarget.clone().project(camera);
      const sx2 = (proj.x * 0.5 + 0.5) * window.innerWidth;
      const sy2 = (1 - proj.y * 0.5 - 0.5) * window.innerHeight;
    };

    inp.onDragEnd = (aimX, aimY, curveFactor) => {
      if (this._phase !== PHASE.AIMING) return;
      this._aimX = aimX;
      this._aimY = aimY;
      this._curveFactor = curveFactor;
      this._updateAimTarget();
      this._traj.hide();
      this._beginKick();
    };

    inp.onCancel = () => {
      if (this._phase !== PHASE.AIMING) return;
      this._phase = PHASE.IDLE;
      this._traj.hide();
    };
  }

  _updateAimTarget() {
    this._aimTarget.set(
      this._aimX * (GOAL_W * 0.46),
      this._aimY * GOAL_H,
      -14.8,   // back of the net Z
    );
  }

  // ── Game flow ─────────────────────────────────────────────────

  startGame() {
    this._score = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._results = [];
    this._qIdx = 0;
    this._quiz.buildQuestions();
    this._ui.buildPills();
    this._ui.updateHUD(0, 0, 0);
    this._ui.hideMenu();
    this._ui.hideGameOver();
    this._ui.showGame();
    this._loadQuestion();
  }

  _loadQuestion() {
    const q = this._quiz.getQuestion(this._qIdx);
    if (!q) { this._endGame(); return; }

    this._phase = PHASE.IDLE;
    this._aimX = 0;
    this._aimY = 0.5;
    this._curveFactor = 0;

    // Reset 3D objects
    this._ball.reset();
    this._kicker.resetPosition();
    this._traj.hide();
    this._pfx.clear();
    this._flashT = 0; this._flashMesh.material.opacity = 0;
    this._ui.hideFeedback();

    // Place GKs and build answer cards
    this._setupGKs(q.options, q.answer);
    this._ui.setQuestion(q);
    this._ui.updateHUD(this._score, this._streak, this._qIdx);
    if (this._qIdx > 0) this._ui.markPillCurrent(this._qIdx);

    setTimeout(() => { if (this._phase === PHASE.IDLE) playWhistle(); }, 280);
  }

  _setupGKs(options, answer) {
    // Remove old card sprites
    this._cardSprites.forEach(s => this._scene.remove(s));
    this._cardSprites = [];

    options.forEach((opt, i) => {
      const gk = this._gks[i];
      gk.reset(GK_X[i], GK_Z);
      gk.isCorrect = (opt === answer);

      const sprite = makeCardSprite(LETTERS[i], CARD_COLORS[i]);
      sprite.position.set(GK_X[i], GOAL_H + 0.6, GK_Z);
      this._scene.add(sprite);
      this._cardSprites.push(sprite);
    });
  }

  _beginKick() {
    this._phase = PHASE.KICKING;

    const isInGoal = Math.abs(this._aimTarget.x) < GOAL_W / 2 && this._aimTarget.y < GOAL_H;

    // Calculate the ball's exact curved X-coordinate when it crosses the GK line
    const src = BALL_POS;
    const dst = this._aimTarget;
    const distance = src.distanceTo(dst);
    const ctrlX = (src.x + dst.x) / 2 + this._curveFactor * Math.min(distance * 0.28, 2.4);
    const t = (GK_Z - src.z) / (dst.z - src.z);
    const mt = 1 - t;
    const gkPassX = mt * mt * src.x + 2 * mt * t * ctrlX + t * t * dst.x;

    // Determine the closest GK using the exact passing coordinate
    let closestGk = this._gks[0], minDist = Infinity;
    this._gks.forEach(gk => {
      const d = Math.abs(gkPassX - gk.group.position.x);
      if (d < minDist) { minDist = d; closestGk = gk; }
    });

    const isWrongGk = !closestGk.isCorrect;
    const canCatch = minDist < (GOAL_W / 4 + 0.6) && isInGoal;

    // Wrong GKs definitely stop and catch balls near them.
    // Right GK NEVER stops the ball.
    if (isWrongGk && canCatch) {
      this._aimTarget.z = GK_Z - 0.2; // stop in their hands
      this._savedBy = closestGk;
      this._missedBy = null;
    } else {
      this._aimTarget.z = -14.8; // deep in the net (or wide)
      this._savedBy = null;
      this._missedBy = closestGk; // Will dive the wrong way!
    }

    this._kicker.startRunup(() => {
      playKick();
      this._ball.kick(this._aimTarget, this._curveFactor, () => this._onBallLand());
      this._reactGKs();
      this._phase = PHASE.FLYING;
    });
  }

  _reactGKs() {
    // Calculate exact ball position when it passes the goalkeepers
    const src = BALL_POS;
    const dst = this._aimTarget;
    const distance = src.distanceTo(dst);
    const ctrlX = (src.x + dst.x) / 2 + this._curveFactor * Math.min(distance * 0.28, 2.4);
    const t = (GK_Z - src.z) / (dst.z - src.z);
    const mt = 1 - t;
    const gkPassX = mt * mt * src.x + 2 * mt * t * ctrlX + t * t * dst.x;

    this._gks.forEach(gk => {
      if (gk === this._savedBy) {
        // Only the saving goalkeeper dives!
        gk.dive(gkPassX, this._aimTarget.y);
      } else if (gk === this._missedBy) {
        // The correct goalkeeper is fooled and just plays the miss/shock animation!
        gk.miss();
      }
    });
  }

  _onBallLand() {
    // Check if the ball's EXACT end position is inside the goal mouth.
    // Use the actual gkPassX since the curve might put it out of bounds even if aimTarget wasn't.
    const src = BALL_POS;
    const dst = this._aimTarget;
    const distance = src.distanceTo(dst);
    const ctrlX = (src.x + dst.x) / 2 + this._curveFactor * Math.min(distance * 0.28, 2.4);

    // Evaluate Bezier X at the goal plane (Z = -13.0)
    const t = (GK_Z - src.z) / (dst.z - src.z);
    const mt = 1 - t;
    const gkPassX = mt * mt * src.x + 2 * mt * t * ctrlX + t * t * dst.x;

    const isInGoal = Math.abs(gkPassX) <= GOAL_W / 2 && this._aimTarget.y <= GOAL_H;

    let correct = false;
    let pts = PTS_WRONG;
    let customMsg = null;

    if (this._savedBy) {
      // Saved by wrong GK
      this._savedBy.catch(this._ball);
      playMiss();
      this._pfx.spawnMiss(this._ball.mesh.position.clone());
      this._streak = 0;
      this._shake(8, 500);
      this._ball.catch(); // Ball completely freezes in GK's hands!
      customMsg = 'Saved!';
    } else if (isInGoal) {
      // Goal!
      correct = true;
      pts = PTS_CORRECT;
      this._streak++;
      this._maxStreak = Math.max(this._maxStreak, this._streak);
      this._flashT = 1;
      playGoal();
      this._pfx.spawnGoal(this._ball.mesh.position.clone());
      this._shake(5, 300);
      this._ball.drop(); // Fall and bounce inside net
      this._triggerNetHit();
    } else {
      // Missed completely (wide of net)
      playMiss();
      this._streak = 0;
      this._ball.drop();
      customMsg = this._aimTarget.y > GOAL_H ? 'Over the bar!' : 'Wide!';
    }

    this._score = Math.max(0, this._score + pts);
    this._results.push({ correct, word: this._quiz.getQuestion(this._qIdx).answer });
    this._ui.updateHUD(this._score, this._streak, this._qIdx);

    if (correct) this._ui.markPillCorrect(this._qIdx);
    else this._ui.markPillWrong(this._qIdx);

    const q = this._quiz.getQuestion(this._qIdx);
    this._ui.showFeedback(correct, q.answer, q.definition, pts, customMsg);
    this._phase = PHASE.RESULT;

    // Highlight correct GK card green
    this._gks.forEach((gk, i) => {
      if (gk.isCorrect && this._cardSprites[i]) {
        this._cardSprites[i].material.color = new THREE.Color(0x22c55e);
      }
    });

    setTimeout(() => this._nextQuestion(), 2700);
  }

  _triggerNetHit() {
    this._netHitT = 1.0;
    this._netHitPos.copy(this._ball.mesh.position);
    if (this._goalNet) {
      this._goalNet.worldToLocal(this._netHitPos);
    }
  }

  _nextQuestion() {
    this._qIdx++;
    if (this._qIdx >= QUESTIONS_PER_GAME) { this._endGame(); return; }
    this._ui.markPillCurrent(this._qIdx);
    this._loadQuestion();
  }

  _endGame() {
    this._phase = PHASE.IDLE;
    this._ui.hideGame();
    this._ui.hideFeedback();
    const correct = this._results.filter(r => r.correct).length;
    this._ui.showResults(this._score, correct, this._maxStreak);
    this._ui.showGameOver();
    playWhistle();
    if (correct >= 5) setTimeout(playGoal, 650);
  }

  // ── Camera shake ─────────────────────────────────────────────

  _shake(mag, durMs) {
    this._shakeMag = mag;
    this._shakeT = durMs;
  }

  // ── Main update ──────────────────────────────────────────────

  /** @param {number} dt seconds */
  update(dt) {
    // Characters
    this._kicker.update(dt, playStep);
    this._gks.forEach(gk => gk.update(dt));

    // Ball
    this._ball.update(dt);

    // Trajectory cursor pulse
    this._traj.updateCursorPulse(dt);

    // Particles
    this._pfx.update(dt);

    // Goal flash
    if (this._flashT > 0) {
      this._flashT = Math.max(0, this._flashT - dt * 1.6);
      this._flashMesh.material.opacity = this._flashT * 0.32;
    }

    // Net deformation
    if (this._netHitT > 0 && this._goalNet) {
      this._netHitT = Math.max(0, this._netHitT - dt * 3.0);
      const pos = this._goalNet.geometry.attributes.position;
      const bulge = Math.sin(this._netHitT * Math.PI * 4) * (this._netHitT * 0.6);

      for (let i = 0; i < pos.count; i++) {
        const ov = this._origNetVerts[i];
        const dx = ov.x - this._netHitPos.x;
        const dy = ov.y - this._netHitPos.y;
        const dist = Math.hypot(dx, dy);

        let zOff = 0;
        if (dist < 2.5) {
          const influence = 1 - (dist / 2.5);
          zOff = influence * bulge;
        }
        pos.setZ(i, ov.z - zOff); // push back in -Z direction
      }
      pos.needsUpdate = true;
    }

    // Camera shake
    if (this._shakeT > 0) {
      this._shakeT = Math.max(0, this._shakeT - dt * 1000);
      const m = this._shakeMag * (this._shakeT / 500) * 0.012;
      camera.position.set(
        this._camBase.x + (Math.random() - 0.5) * m,
        this._camBase.y + (Math.random() - 0.5) * m,
        this._camBase.z,
      );
    } else {
      camera.position.lerp(this._camBase, 0.10);
    }
  }

  get phase() { return this._phase; }
}
