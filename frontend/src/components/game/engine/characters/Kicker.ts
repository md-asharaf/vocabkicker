import * as THREE from 'three';
import { KICKER_START } from '../constants';
import { assetManager } from '../AssetManager';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class Kicker {
  public group: THREE.Group;
  public mixer: THREE.AnimationMixer | null;
  public kickAction: THREE.AnimationAction | null;
  private _kickFired: boolean;
  private _onKickFired: (() => void) | null;
  private _kicking: boolean;

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

  private _build() {
    const model = SkeletonUtils.clone(assetManager.models['kicker'] as THREE.Object3D) as THREE.Group;

    model.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        if (name.includes('body') || name.includes('shirt') || name.includes('beta_surface')) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => {
              const newMat = m.clone() as THREE.MeshStandardMaterial;
              newMat.color.setHex(0xeeeeee);
              return newMat;
            });
          } else {
            mesh.material = mesh.material.clone() as THREE.MeshStandardMaterial;
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(0xeeeeee);
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
      this.kickAction.setLoop(THREE.LoopOnce, 1);
      this.kickAction.clampWhenFinished = true;
    }
  }

  addToScene(scene: THREE.Scene) { scene.add(this.group); }

  resetPosition() {
    this.group.position.copy(KICKER_START);
    this.group.rotation.set(0, Math.PI, 0);

    this._kickFired = false;
    this._kicking = false;

    if (this.kickAction) {
      this.kickAction.reset();
      this.kickAction.play();
      this.kickAction.timeScale = 0;
    }
  }

  startRunup(onKick: () => void) {
    this._onKickFired = onKick;
    this._kickFired = false;
    this._kicking = true;

    if (this.kickAction) {
      this.kickAction.timeScale = 1;
      this.kickAction.reset();
      this.kickAction.play();
    }
  }

  update(dt: number) {
    if (this.mixer) {
      this.mixer.update(dt);
    }

    if (this._kicking && this.kickAction && !this._kickFired) {
      const contactTime = this.kickAction.getClip().duration * 0.40;

      if (this.kickAction.time >= contactTime) {
        this._kickFired = true;
        if (this._onKickFired) this._onKickFired();
      }
    }
  }
}
