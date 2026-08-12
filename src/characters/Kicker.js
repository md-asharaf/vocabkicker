/**
 * Kicker.js
 * Uses the FBX model loaded from AssetManager.
 */
import * as THREE from 'three';
import { KICKER_START } from '../constants.js';
import { assetManager } from '../AssetManager.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class Kicker {
  constructor() {
    this.group = new THREE.Group();
    this.mixer = null;
    this.kickAction = null;
    
    this._kickFired = false;
    this._onKickFired = null;
    this._kicking = false;

    this._build();
    this.resetPosition();
  }

  _build() {
    const model = SkeletonUtils.clone(assetManager.models['kicker']);
    
    // Tint the Kicker (Striker) to a distinct color (e.g., White/Light Gray)
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const name = child.name.toLowerCase();
        if (name.includes('body') || name.includes('shirt') || name.includes('beta_surface')) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => {
              const newMat = m.clone();
              newMat.color.setHex(0xeeeeee); // Light gray / white
              return newMat;
            });
          } else {
            child.material = child.material.clone();
            child.material.color.setHex(0xeeeeee);
          }
        }
      }
    });

    this.group.add(model);
    
    // Setup animation
    this.mixer = new THREE.AnimationMixer(model);
    const clip = assetManager.animations['kicker'];
    if (clip) {
      this.kickAction = this.mixer.clipAction(clip);
      this.kickAction.setLoop(THREE.LoopOnce);
      this.kickAction.clampWhenFinished = true;
    }
  }

  addToScene(scene) { scene.add(this.group); }

  resetPosition() {
    this.group.position.copy(KICKER_START);
    // Face the goal
    this.group.rotation.set(0, Math.PI, 0);
    
    this._kickFired = false;
    this._kicking = false;
    
    if (this.kickAction) {
      this.kickAction.reset();
      this.kickAction.play();
      this.kickAction.timeScale = 0; // freeze at the starting pose
    }
  }

  startRunup(onKick) {
    this._onKickFired = onKick;
    this._kickFired = false;
    this._kicking = true;
    
    if (this.kickAction) {
      this.kickAction.timeScale = 1; // Unfreeze!
      this.kickAction.reset();
      this.kickAction.play();
    }
  }

  update(dt, playStep) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    if (this._kicking && this.kickAction && !this._kickFired) {
      // The kick animation duration. We fire the ball when the foot hits it.
      // Usually around 60-70% through a kick animation.
      // Let's assume foot makes contact at time = clip.duration * 0.65
      // This might need tuning based on the specific FBX.
      const contactTime = this.kickAction.getClip().duration * 0.40;
      
      if (this.kickAction.time >= contactTime) {
        this._kickFired = true;
        if (this._onKickFired) this._onKickFired();
      }
    }
  }
}
