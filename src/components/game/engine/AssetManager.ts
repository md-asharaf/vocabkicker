import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class AssetManager {
  public models: { [key: string]: THREE.Group };
  public animations: { [key: string]: THREE.AnimationClip };
  public gkBase: THREE.Group | null = null;
  public gkAnimations: { [key: string]: THREE.AnimationClip } = {};

  private loader: GLTFLoader;

  constructor() {
    this.models = {};
    this.animations = {};

    this.loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.loader.setDRACOLoader(dracoLoader);
  }

  private _loadPromise: Promise<void> | null = null;

  loadAll(onProgress: (progress: number) => void) {
    if (this._loadPromise) return this._loadPromise;

    const files = [
      { key: 'kicker', path: './assets/Strike Foward Jog.glb' },
      { key: 'gk_idle', path: './assets/Goalkeeper Idle.glb' },
      { key: 'gk_miss', path: './assets/Goalkeeper Miss.glb' },
      { key: 'dive_left', path: './assets/Goalkeeper Left Diving Save.glb' },
      { key: 'dive_right', path: './assets/Goalkeeper Right Diving Save.glb' },
      { key: 'catch_high', path: './assets/Goalkeeper High Catch.glb' },
      { key: 'catch_mid', path: './assets/Goalkeeper Standing Catch.glb' },
      { key: 'catch_low', path: './assets/Goalkeeper Low Catch.glb' }
    ];

    this._loadPromise = this._loadFiles(files, onProgress).then(() => {
      this.gkBase = this.models['gk_idle'];
      this.gkAnimations['idle'] = this.animations['gk_idle'];
      this.gkAnimations['miss'] = this.animations['gk_miss'];
      this.gkAnimations['dive_left'] = this.animations['dive_left'];
      this.gkAnimations['dive_right'] = this.animations['dive_right'];
      this.gkAnimations['catch_high'] = this.animations['catch_high'];
      this.gkAnimations['catch_mid'] = this.animations['catch_mid'];
      this.gkAnimations['catch_low'] = this.animations['catch_low'];
    });

    return this._loadPromise;
  }

  private async _loadFiles(files: { key: string, path: string }[], onProgress: ((progress: number) => void) | null) {
    let loaded = 0;
    const loadProms = files.map(f => {
      return new Promise<void>((resolve, reject) => {
        this.loader.load(f.path, (gltf) => {
          const fbx = gltf.scene;
          fbx.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(m => {
                    if ((m as THREE.MeshStandardMaterial).roughness !== undefined) {
                      (m as THREE.MeshStandardMaterial).roughness = 1;
                      (m as THREE.MeshStandardMaterial).metalness = 0;
                    }
                  });
                } else {
                  if ((mesh.material as THREE.MeshStandardMaterial).roughness !== undefined) {
                    (mesh.material as THREE.MeshStandardMaterial).roughness = 1;
                    (mesh.material as THREE.MeshStandardMaterial).metalness = 0;
                  }
                }
              }
            }
          });
          this.models[f.key] = fbx;
          if (gltf.animations && gltf.animations.length > 0) {
            this.animations[f.key] = gltf.animations[0];
          }
          loaded++;
          if (onProgress) onProgress(loaded / files.length);
          resolve();
        }, undefined, reject);
      });
    });
    await Promise.all(loadProms);
  }

  cloneGoalkeeper(): THREE.Group {
    return SkeletonUtils.clone(this.gkBase as THREE.Object3D) as THREE.Group;
  }
}

export const assetManager = new AssetManager();
