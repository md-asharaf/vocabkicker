import * as THREE from 'three';
import {
  GK_Z, GOAL_W, GOAL_H, BALL_POS, QUESTIONS_PER_GAME, PTS_CORRECT, PTS_WRONG
} from '../constants';
import { camera } from '../scene';
import { playKick, playGoal, playMiss, playWhistle } from '../audio/sounds';
import { Ball } from './Ball';
import { Trajectory } from './Trajectory';
import { ParticleSystem } from './Particles';
import { Kicker } from '../characters/Kicker';
import { Quiz } from './Quiz';
import { GameStatus, QuizQuestion } from '@/types/game';
import { Input } from './Input';

import { CameraManager } from './CameraManager';
import { NetManager } from './NetManager';
import { GoalkeeperManager } from './GoalkeeperManager';

const PHASE = {
  IDLE: 'idle',
  AIMING: 'aiming',
  KICKING: 'kicking',
  FLYING: 'flying',
  RESULT: 'result',
} as const;

interface GameStateArgs {
  readonly scene: THREE.Scene;
  readonly ball: Ball;
  readonly trajectory: Trajectory;
  readonly particles: ParticleSystem;
  readonly kicker: Kicker;
  readonly quiz: Quiz;
  readonly input: Input;
  readonly camBase: THREE.Vector3;
  readonly goalNet: THREE.Mesh | null;
  readonly onUpdate: (status: GameStatus) => void;
}

export class GameState {
  private readonly _ball: Ball;
  private readonly _traj: Trajectory;
  private readonly _pfx: ParticleSystem;
  private readonly _kicker: Kicker;
  private readonly _quiz: Quiz;
  private readonly _input: Input;
  private readonly _onUpdate: (status: GameStatus) => void;

  private readonly _cameraManager: CameraManager;
  private readonly _netManager: NetManager;
  private readonly _gkManager: GoalkeeperManager;

  private _score: number = 0;
  private _streak: number = 0;
  private _maxStreak: number = 0;
  private _results: { readonly correct: boolean; readonly word: string }[] = [];

  private _qIdx: number = 0;
  private _phase: string = PHASE.IDLE;
  private _aimX: number = 0;
  private _aimY: number = 0.5;
  private _curveFactor: number = 0;
  private readonly _aimTarget: THREE.Vector3 = new THREE.Vector3();

  private _question: QuizQuestion | null = null;
  private _feedback: { readonly correct: boolean; readonly pts: number; readonly msg: string | null } | null = null;

  private readonly _flashMesh: THREE.Mesh;
  private _flashT: number = 0;

  constructor(args: GameStateArgs) {
    this._ball = args.ball;
    this._traj = args.trajectory;
    this._pfx = args.particles;
    this._kicker = args.kicker;
    this._quiz = args.quiz;
    this._input = args.input;
    this._onUpdate = args.onUpdate;

    this._cameraManager = new CameraManager(camera, args.camBase);
    this._netManager = new NetManager(args.goalNet);
    this._gkManager = new GoalkeeperManager(args.scene);

    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0, depthTest: false, side: THREE.DoubleSide });
    this._flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 35), mat);
    this._flashMesh.position.set(0, 6, 0);
    this._flashMesh.rotation.x = -0.2;
    args.scene.add(this._flashMesh);

    this._bindInput();
  }

  private _emitUpdate(): void {
    this._onUpdate({
      phase: this._phase,
      score: this._score,
      streak: this._streak,
      qIdx: this._qIdx,
      maxStreak: this._maxStreak,
      results: this._results,
      question: this._question,
      feedback: this._feedback
    });
  }

  private _bindInput(): void {
    const inp = this._input;

    inp.onDragStart = () => {
      if (this._phase !== PHASE.IDLE) return;
      this._phase = PHASE.AIMING;
      this._emitUpdate();
    };

    inp.onDragMove = (aimX: number, aimY: number, curveFactor: number) => {
      if (this._phase !== PHASE.AIMING) return;
      this._aimX = aimX;
      this._aimY = aimY;
      this._curveFactor = curveFactor;
      this._updateAimTarget();
      this._traj.update(this._ball.mesh.position, this._aimTarget, curveFactor);
    };

    inp.onDragEnd = (aimX: number, aimY: number, curveFactor: number) => {
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
      this._emitUpdate();
    };
  }

  private _updateAimTarget(): void {
    this._aimTarget.set(
      this._aimX * (GOAL_W * 0.46),
      this._aimY * GOAL_H,
      -14.8,
    );
  }

  public startGame(): void {
    this._score = 0;
    this._streak = 0;
    this._maxStreak = 0;
    this._results = [];
    this._qIdx = 0;
    this._feedback = null;
    this._loadQuestion();
  }

  private _loadQuestion(): void {
    const q = this._quiz.getQuestion(this._qIdx);
    if (!q) { this._endGame(); return; }

    this._question = q;
    this._phase = PHASE.IDLE;
    this._aimX = 0;
    this._aimY = 0.5;
    this._curveFactor = 0;
    this._feedback = null;

    this._ball.reset();
    this._kicker.resetPosition();
    this._traj.hide();
    this._pfx.clear();
    this._flashT = 0;
    (this._flashMesh.material as THREE.Material).opacity = 0;

    this._gkManager.setupGoalkeepers(q.options, q.answer);
    this._emitUpdate();

    setTimeout(() => { if (this._phase === PHASE.IDLE) playWhistle(); }, 280);
  }

  private _beginKick(): void {
    this._phase = PHASE.KICKING;
    this._emitUpdate();

    const src = BALL_POS;
    const dst = this._aimTarget;
    const distance = src.distanceTo(dst);
    const ctrlX = (src.x + dst.x) / 2 + this._curveFactor * Math.min(distance * 0.28, 2.4);
    const t = (GK_Z - src.z) / (dst.z - src.z);
    const mt = 1 - t;
    const gkPassX = mt * mt * src.x + 2 * mt * t * ctrlX + t * t * dst.x;

    this._gkManager.determineReaction(gkPassX, this._aimTarget);

    this._kicker.startRunup(() => {
      playKick();
      this._ball.kick(this._aimTarget, this._curveFactor, () => this._onBallLand());
      this._gkManager.executeReaction(gkPassX, this._aimTarget.y);
      this._phase = PHASE.FLYING;
      this._emitUpdate();
    });
  }

  private _onBallLand(): void {
    const src = BALL_POS;
    const dst = this._aimTarget;
    const distance = src.distanceTo(dst);
    const ctrlX = (src.x + dst.x) / 2 + this._curveFactor * Math.min(distance * 0.28, 2.4);

    const t = (GK_Z - src.z) / (dst.z - src.z);
    const mt = 1 - t;
    const gkPassX = mt * mt * src.x + 2 * mt * t * ctrlX + t * t * dst.x;

    const isInGoal = Math.abs(gkPassX) <= GOAL_W / 2 && this._aimTarget.y <= GOAL_H;
    const savedBy = this._gkManager.getSavedBy();

    let correct = false;
    let pts = PTS_WRONG;
    let customMsg: string | null = null;

    if (savedBy) {
      savedBy.catch(this._ball);
      playMiss();
      this._pfx.spawnMiss(this._ball.mesh.position.clone());
      this._streak = 0;
      this._cameraManager.shake(8, 500);
      this._ball.catch();
      customMsg = 'Saved!';
    } else if (isInGoal) {
      correct = true;
      pts = PTS_CORRECT;
      this._streak++;
      this._maxStreak = Math.max(this._maxStreak, this._streak);
      this._flashT = 1;
      playGoal();
      this._pfx.spawnGoal(this._ball.mesh.position.clone());
      this._cameraManager.shake(5, 300);
      this._ball.drop();
      this._netManager.triggerHit(this._ball.mesh.position);
    } else {
      playMiss();
      this._streak = 0;
      this._ball.drop();
      customMsg = this._aimTarget.y > GOAL_H ? 'Over the bar!' : 'Wide!';
    }

    this._score = Math.max(0, this._score + pts);
    const q = this._quiz.getQuestion(this._qIdx)!;
    this._results.push({ correct, word: q.answer });

    this._phase = PHASE.RESULT;
    this._feedback = { correct, pts, msg: customMsg };
    this._emitUpdate();

    this._gkManager.highlightCorrectCards();

    setTimeout(() => this._nextQuestion(), 2700);
  }

  private _nextQuestion(): void {
    this._qIdx++;
    if (this._qIdx >= QUESTIONS_PER_GAME) { this._endGame(); return; }
    this._loadQuestion();
  }

  private _endGame(): void {
    this._phase = PHASE.RESULT;
    this._emitUpdate();
    playWhistle();
    const correct = this._results.filter(r => r.correct).length;
    if (correct >= 5) setTimeout(playGoal, 650);
  }

  public update(dt: number): void {
    this._kicker.update(dt);
    this._ball.update(dt);
    this._pfx.update(dt);

    this._gkManager.update(dt);
    this._netManager.update(dt);
    this._cameraManager.update(dt);

    if (this._flashT > 0) {
      this._flashT = Math.max(0, this._flashT - dt * 1.6);
      (this._flashMesh.material as THREE.Material).opacity = this._flashT * 0.32;
    }
  }

  public get phase(): string { return this._phase; }
}

