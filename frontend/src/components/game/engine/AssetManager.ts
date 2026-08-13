import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AssetManager {
  public models: { [key: string]: THREE.Group };
  public animations: { [key: string]: THREE.AnimationClip };
  public gkBase: THREE.Group | null = null;
  public gkAnimations: { [key: string]: THREE.AnimationClip } = {};

  constructor() {
    this.models = {};
    this.animations = {};
  }

  async loadAll(onProgress: ((progress: number) => void) | null) {
    const loader = new FBXLoader();

    const files = [
      { key: 'kicker', path: './assets/Strike Foward Jog.fbx' },
      { key: 'gk_idle', path: './assets/Goalkeeper Idle.fbx' },
      { key: 'gk_miss', path: './assets/Goalkeeper Miss.fbx' },
      { key: 'dive_left', path: './assets/Goalkeeper Left Diving Save.fbx' },
      { key: 'dive_right', path: './assets/Goalkeeper Right Diving Save.fbx' },
      { key: 'catch_high', path: './assets/Goalkeeper High Catch.fbx' },
      { key: 'catch_mid', path: './assets/Goalkeeper Standing Catch.fbx' },
      { key: 'catch_low', path: './assets/Goalkeeper Low Catch.fbx' }
    ];

    let loaded = 0;

    const loadProms = files.map(f => {
      return new Promise<void>((resolve, reject) => {
        loader.load(f.path, (fbx: THREE.Group) => {
          // Normalize scale since Mixamo FBX files are usually scaled by 100 or 0.01
          fbx.scale.setScalar(0.01);

          // Enable shadows
          fbx.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              // Fix materials (Mixamo standard materials sometimes need tweaking)
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(m => {
                    if ((m as THREE.MeshPhongMaterial).shininess !== undefined) {
                        (m as THREE.MeshPhongMaterial).shininess = 0;
                    }
                  });
                } else {
                  if ((mesh.material as THREE.MeshPhongMaterial).shininess !== undefined) {
                    (mesh.material as THREE.MeshPhongMaterial).shininess = 0;
                  }
                }
              }
            }
          });

          this.models[f.key] = fbx;

          if (fbx.animations && fbx.animations.length > 0) {
            this.animations[f.key] = fbx.animations[0];
          }

          loaded++;
          if (onProgress) onProgress(loaded / files.length);
          resolve();
        }, undefined, reject);
      });
    });

    await Promise.all(loadProms);

    // Process goalkeeper base model
    this.gkBase = this.models['gk_idle'];
    
    this.gkAnimations = {
      idle: this.animations['gk_idle'],
      miss: this.animations['gk_miss'],
      dive_left: this.animations['dive_left'],
      dive_right: this.animations['dive_right'],
      catch_high: this.animations['catch_high'],
      catch_mid: this.animations['catch_mid'],
      catch_low: this.animations['catch_low']
    };
  }

  cloneGoalkeeper(): THREE.Group {
    return SkeletonUtils.clone(this.gkBase as THREE.Object3D) as THREE.Group;
  }
}

export const assetManager = new AssetManager();
