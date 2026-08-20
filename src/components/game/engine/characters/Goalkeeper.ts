import * as THREE from 'three';
import { assetManager } from '../AssetManager';
import { Ball } from '../game/Ball';

export class Goalkeeper {
  public colorHex: number;
  public index: number;
  public isCorrect: boolean;
  public group: THREE.Group;
  public mixer: THREE.AnimationMixer | null;
  public actions: { [key: string]: THREE.AnimationAction };
  public currentAction: THREE.AnimationAction | null;
  public catchPoint: THREE.Object3D;

  private _diveDir: number;
  private _diveT: number;
  private _isCaught: boolean;
  private _origX: number;
  private _caughtBall: Ball | null;
  private _diveTargetX?: number;
  private _diveTargetY?: number;
  private _diveBodyDx: number;

  constructor(colorHex: number, index: number) {
    this.colorHex = colorHex;
    this.index = index;
    this.isCorrect = false;

    // Animation states
    this._diveDir = 0;
    this._diveT = 0;
    this._isCaught = false;
    this._origX = 0;
    this._caughtBall = null;
    this._diveBodyDx = 0;

    this.group = new THREE.Group();
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    this.catchPoint = new THREE.Object3D();

    this._build();
  }

  private _build() {
    const model = assetManager.cloneGoalkeeper();
    this.group.add(model);

    this.mixer = new THREE.AnimationMixer(model);

    const anims = assetManager.gkAnimations;
    if (anims.idle) {
      this.actions.idle = this.mixer.clipAction(anims.idle);
    }
    // We will dynamically fetch other actions in a helper method when needed.

    let rightHand: THREE.Object3D | null = null;
    model.traverse((child: THREE.Object3D) => {
      if (child.type === 'Bone' && child.name.toLowerCase().includes('righthand')) {
        rightHand = child;
      }
    });

    if (rightHand) {
      (rightHand as THREE.Object3D).add(this.catchPoint);
      this.catchPoint.position.set(0, 0, 0);
    } else {
      console.warn('RightHand bone not found for catching!');
      this.group.add(this.catchPoint);
    }

    this.actions.idle.play();
    this.actions.idle.timeScale = 0;
    this.currentAction = this.actions.idle;

    model.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        if (name.includes('body') || name.includes('shirt') || name.includes('beta_surface')) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => {
              const newMat = m.clone() as THREE.MeshStandardMaterial;
              newMat.color.setHex(this.colorHex);
              return newMat;
            });
          } else {
            mesh.material = mesh.material.clone() as THREE.MeshStandardMaterial;
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(this.colorHex);
          }
        }
      }
    });
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }

  reset(x: number, z: number) {
    this._diveTargetX = undefined;
    this._diveTargetY = undefined;
    this._diveDir = 0;
    this._diveT = 0;
    this._isCaught = false;
    this._caughtBall = null;
    this._origX = x;
    this.group.position.set(x, 0, z);

    if (this.currentAction !== this.actions.idle) {
      this.currentAction!.stop();
      this.actions.idle.reset().play();
      this.actions.idle.timeScale = 0;
      this.currentAction = this.actions.idle;
    }
  }

  private getAction(key: string): THREE.AnimationAction | null {
    if (this.actions[key]) return this.actions[key];
    
    const anim = assetManager.gkAnimations[key];
    if (anim && this.mixer) {
      this.actions[key] = this.mixer.clipAction(anim);
      return this.actions[key];
    }
    return null;
  }

  dive(targetX: number, targetY: number) {
    this._diveTargetX = targetX;
    this._diveTargetY = targetY;

    const dx = targetX - this.group.position.x;

    if (Math.abs(dx) > 1.5) {
      this._diveDir = Math.sign(dx);
      this._diveBodyDx = dx - (this._diveDir * 1.5);

      if (this._diveDir < 0) {
        const action = this.getAction('dive_right');
        if (action) this.crossfade(action);
      } else {
        const action = this.getAction('dive_left');
        if (action) this.crossfade(action);
      }
      this.group.scale.x = 1;

    } else {
      this._diveDir = 0;
      this._diveBodyDx = dx;

      if (targetY > 2.0) {
        const action = this.getAction('catch_high');
        if (action) this.crossfade(action);
      } else if (targetY > 1.0) {
        const action = this.getAction('catch_mid');
        if (action) this.crossfade(action);
      } else {
        const action = this.getAction('catch_low');
        if (action) this.crossfade(action);
      }
    }
    this._diveT = 0;
  }

  miss() {
    this._diveTargetX = undefined;
    const action = this.getAction('miss');
    if (action) this.crossfade(action);
  }

  catch(ball: Ball) {
    this._isCaught = true;
    this._caughtBall = ball;
  }

  crossfade(newAction: THREE.AnimationAction) {
    if (this.currentAction !== newAction) {
      newAction.reset();
      newAction.timeScale = 1;
      newAction.play();
      if (this.currentAction) {
        newAction.crossFadeFrom(this.currentAction, 0.2, true);
      }
      newAction.setLoop(THREE.LoopOnce, 1);
      newAction.clampWhenFinished = true;
      this.currentAction = newAction;
    }
  }

  update(dt: number) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    if (this._diveTargetX !== undefined && !this._isCaught) {
      this._diveT = Math.min(this._diveT + dt * 1.3, 1);

      const p = this._diveT;
      const dir = this._diveDir;

      this.group.position.x = this._origX + p * this._diveBodyDx;

      const finalBodyY = (dir === 0) ? Math.max(0, this._diveTargetY! - 1.8) : Math.max(0.2, this._diveTargetY!);
      const jumpArc = (dir === 0) ? 0.0 : Math.max(0.8, finalBodyY + 0.5);
      this.group.position.y = Math.sin(p * Math.PI) * jumpArc + (p * finalBodyY);
    }

    if (this._isCaught) {
      const targetGroundY = (this._diveDir === 0) ? 0 : 0.4;
      if (this.group.position.y > targetGroundY) {
        const fallSpeed = dt * 6;
        this.group.position.y = Math.max(targetGroundY, this.group.position.y - fallSpeed);
      }

      if (this._caughtBall && this.catchPoint) {
        const handPos = new THREE.Vector3();
        this.catchPoint.getWorldPosition(handPos);
        this._caughtBall.mesh.position.copy(handPos);
        this._caughtBall.shadow.position.set(handPos.x, 0.005, handPos.z);
      }
    }
  }
}
