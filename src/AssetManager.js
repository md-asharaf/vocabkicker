import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AssetManager {
  constructor() {
    this.models = {};
    this.animations = {};
  }

  async loadAll(onProgress) {
    const loader = new FBXLoader();

    const files = [
      { key: 'kicker', path: '/assets/Strike Foward Jog.fbx' },
      { key: 'gk_idle', path: '/assets/Goalkeeper Idle.fbx' },
      { key: 'gk_miss', path: '/assets/Goalkeeper Miss.fbx' },
      { key: 'dive_left', path: '/assets/Goalkeeper Left Diving Save.fbx' },
      { key: 'dive_right', path: '/assets/Goalkeeper Right Diving Save.fbx' },
      { key: 'catch_high', path: '/assets/Goalkeeper High Catch.fbx' },
      { key: 'catch_mid', path: '/assets/Goalkeeper Standing Catch.fbx' },
      { key: 'catch_low', path: '/assets/Goalkeeper Low Catch.fbx' }
    ];

    let loaded = 0;

    const loadProms = files.map(f => {
      return new Promise((resolve, reject) => {
        loader.load(f.path, (fbx) => {
          // Normalize scale since Mixamo FBX files are usually scaled by 100 or 0.01
          fbx.scale.setScalar(0.01);

          // Enable shadows
          fbx.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Fix materials (Mixamo standard materials sometimes need tweaking)
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.shininess = 0);
                } else {
                  child.material.shininess = 0;
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

  cloneGoalkeeper() {
    return SkeletonUtils.clone(this.gkBase);
  }
}

export const assetManager = new AssetManager();
