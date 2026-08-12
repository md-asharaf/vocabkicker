/**
 * Goalkeeper.js
 * Uses the FBX model loaded from AssetManager.
 */
import * as THREE from 'three';
import { assetManager } from '../AssetManager.js';
export class Goalkeeper {
  constructor(colorHex, index) {
    this.colorHex = colorHex;
    this.index = index;
    this.isCorrect = false;

    // Animation states
    this._diveDir = 0;
    this._diveT = 0;
    this._isCaught = false;
    this._origX = 0;
    this._caughtBall = null;

    this.group = new THREE.Group();
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    // We attach the ball to the RightHand
    this.catchPoint = new THREE.Object3D();

    this._build();
  }

  _build() {
    // Clone the base FBX mesh
    const model = assetManager.cloneGoalkeeper();
    this.group.add(model);

    // Create mixer
    this.mixer = new THREE.AnimationMixer(model);

    // Create actions for all clips
    const anims = assetManager.gkAnimations;
    this.actions.idle = this.mixer.clipAction(anims.idle);
    this.actions.miss = this.mixer.clipAction(anims.miss);
    this.actions.dive_left = this.mixer.clipAction(anims.dive_left);
    this.actions.dive_right = this.mixer.clipAction(anims.dive_right);
    this.actions.catch_high = this.mixer.clipAction(anims.catch_high);
    this.actions.catch_mid = this.mixer.clipAction(anims.catch_mid);
    this.actions.catch_low = this.mixer.clipAction(anims.catch_low);

    // Find the right hand bone to attach the catch point
    let rightHand = null;
    model.traverse((child) => {
      // Mixamo rig usually has a bone named 'mixamorigRightHand' or similar
      if (child.isBone && child.name.toLowerCase().includes('righthand')) {
        rightHand = child;
      }
    });

    if (rightHand) {
      rightHand.add(this.catchPoint);
      this.catchPoint.position.set(0, 0, 0); // adjust if needed based on FBX scale/orientation
    } else {
      console.warn('RightHand bone not found for catching!');
      this.group.add(this.catchPoint); // fallback
    }

    // Play idle (but freeze it on the first frame since we don't have a dedicated idle loop)
    this.actions.idle.play();
    this.actions.idle.timeScale = 0; // Freeze at the 'ready' stance!
    this.currentAction = this.actions.idle;

    // Change shirt color (tint the main material if possible)
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        // Simple way to tint the goalkeeper to match colorHex
        if (child.name.toLowerCase().includes('body') || child.name.toLowerCase().includes('shirt')) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.color.setHex(this.colorHex));
          } else {
            child.material.color.setHex(this.colorHex);
          }
        }
      }
    });
  }

  addToScene(scene) {
    scene.add(this.group);
  }

  reset(x, z) {
    this._diveTargetX = undefined;
    this._diveTargetY = undefined;
    this._diveDir = 0;
    this._diveT = 0;
    this._isCaught = false;
    this._caughtBall = null;
    this._origX = x;
    this.group.position.set(x, 0, z);

    // Reset animations
    if (this.currentAction !== this.actions.idle) {
      this.currentAction.stop();
      this.actions.idle.reset().play();
      this.actions.idle.timeScale = 0;
      this.currentAction = this.actions.idle;
    }
  }

  dive(targetX, targetY) {
    this._diveTargetX = targetX;
    this._diveTargetY = targetY;

    const dx = targetX - this.group.position.x;

    if (Math.abs(dx) > 1.5) {
      this._diveDir = Math.sign(dx);
      this._diveBodyDx = dx - (this._diveDir * 1.5);

      // Horizontal Dive
      if (this._diveDir < 0) {
        // Target is at -X (left of screen). For a GK facing +Z, -X is their RIGHT side.
        this.crossfade(this.actions.dive_right);
      } else {
        // Target is at +X (right of screen). For a GK facing +Z, +X is their LEFT side.
        this.crossfade(this.actions.dive_left);
      }
      this.group.scale.x = 1;

    } else {
      this._diveDir = 0;
      this._diveBodyDx = dx;

      // Standing catch - pick based on height
      if (targetY > 2.0) {
        this.crossfade(this.actions.catch_high);
      } else if (targetY > 1.0) {
        this.crossfade(this.actions.catch_mid);
      } else {
        this.crossfade(this.actions.catch_low);
      }
    }
    this._diveT = 0;
  }

  miss() {
    this._diveTargetX = undefined;
    this.crossfade(this.actions.miss);
  }

  catch(ball) {
    this._isCaught = true;
    this._caughtBall = ball;
  }

  crossfade(newAction) {
    if (this.currentAction !== newAction) {
      newAction.reset();
      newAction.timeScale = 1;
      newAction.play();
      newAction.crossFadeFrom(this.currentAction, 0.2, true);
      newAction.setLoop(THREE.LoopOnce);
      newAction.clampWhenFinished = true;
      this.currentAction = newAction;
    }
  }

  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    if (this._diveTargetX !== undefined && !this._isCaught) {
      // Scale dive time so it finishes when ball reaches goal
      this._diveT = Math.min(this._diveT + dt * 1.3, 1);

      // In a fully baked animation, we generally don't move the root procedurally as much,
      // but since the ball can go ANYWHERE, we still slide the group to match the X/Y offset
      const p = this._diveT;
      const dir = this._diveDir;

      this.group.position.x = this._origX + p * this._diveBodyDx;

      // Calculate exact body height
      const finalBodyY = (dir === 0) ? Math.max(0, this._diveTargetY - 1.8) : Math.max(0.2, this._diveTargetY);
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
