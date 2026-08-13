import * as THREE from 'three';
import { Goalkeeper } from '../characters/Goalkeeper';
import { GK_COLORS, GK_X, GK_Z, GOAL_H, GOAL_W, CARD_COLORS, LETTERS } from '../constants';

/**
 * GoalkeeperManager handles the initialization, positioning, and diving logic for the 4 goalkeepers.
 */
export class GoalkeeperManager {
  private readonly _scene: THREE.Scene;
  private readonly _gks: readonly Goalkeeper[];
  private _cardSprites: THREE.Sprite[] = [];
  
  private _savedBy: Goalkeeper | null = null;
  private _missedBy: Goalkeeper | null = null;

  constructor(scene: THREE.Scene) {
    this._scene = scene;
    this._gks = GK_COLORS.map((c, i) => new Goalkeeper(c, i));
    this._gks.forEach(gk => gk.addToScene(scene));
  }

  /**
   * Generates a text sprite card for the answer above the goalkeeper.
   */
  private makeCardSprite(letter: string, colorHex: string): THREE.Sprite {
    const CW = 160, CH = 160;
    const c = document.createElement('canvas');
    c.width = CW; c.height = CH;
    const ctx = c.getContext('2d')!;

    function rr(x: number, y: number, w: number, h: number, r: number) {
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

    ctx.fillStyle = 'rgba(6,6,6,0.92)'; rr(0, 0, CW, CH, 22); ctx.fill();
    ctx.strokeStyle = colorHex; ctx.lineWidth = 8;
    rr(4, 4, CW - 8, CH - 8, 18); ctx.stroke();

    ctx.fillStyle = colorHex; rr(8, 8, CW - 16, CH - 16, 14); ctx.fill();

    ctx.fillStyle = '#fff'; ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, CW / 2, CH / 2 + 5);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(1.2, 1.2, 1);
    return sp;
  }

  public setupGoalkeepers(options: readonly string[], answer: string): void {
    this._cardSprites.forEach(s => this._scene.remove(s));
    this._cardSprites = [];

    options.forEach((opt, i) => {
      const gk = this._gks[i];
      gk.reset(GK_X[i], GK_Z);
      gk.isCorrect = (opt === answer);

      const sprite = this.makeCardSprite(LETTERS[i], CARD_COLORS[i]);
      sprite.position.set(GK_X[i], GOAL_H + 0.6, GK_Z);
      this._scene.add(sprite);
      this._cardSprites.push(sprite);
    });
  }

  public determineReaction(gkPassX: number, aimTarget: THREE.Vector3): void {
    let closestGk = this._gks[0], minDist = Infinity;
    this._gks.forEach(gk => {
      const d = Math.abs(gkPassX - gk.group.position.x);
      if (d < minDist) { minDist = d; closestGk = gk; }
    });

    const isWrongGk = !closestGk.isCorrect;
    const isInGoal = Math.abs(aimTarget.x) < GOAL_W / 2 && aimTarget.y < GOAL_H;
    const canCatch = minDist < (GOAL_W / 4 + 0.6) && isInGoal;

    if (isWrongGk && canCatch) {
      aimTarget.z = GK_Z - 0.2;
      this._savedBy = closestGk;
      this._missedBy = null;
    } else {
      aimTarget.z = -14.8;
      this._savedBy = null;
      this._missedBy = closestGk;
    }
  }

  public executeReaction(gkPassX: number, aimTargetY: number): void {
    this._gks.forEach(gk => {
      if (gk === this._savedBy) {
        gk.dive(gkPassX, aimTargetY);
      } else if (gk === this._missedBy) {
        gk.miss();
      }
    });
  }

  public getSavedBy(): Goalkeeper | null {
    return this._savedBy;
  }

  public highlightCorrectCards(): void {
    this._gks.forEach((gk, i) => {
      if (gk.isCorrect && this._cardSprites[i]) {
        (this._cardSprites[i].material as THREE.SpriteMaterial).color = new THREE.Color(0x22c55e);
      }
    });
  }

  public update(dt: number): void {
    this._gks.forEach(gk => gk.update(dt));
  }
}
