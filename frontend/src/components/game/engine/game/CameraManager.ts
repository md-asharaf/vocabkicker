import * as THREE from 'three';

/**
 * CameraManager handles all camera movements, shaking effects, and FOV transitions.
 */
export class CameraManager {
  private readonly _camera: THREE.PerspectiveCamera;
  private readonly _basePos: THREE.Vector3;
  
  private _shakeT: number = 0;
  private _shakeMag: number = 0;

  constructor(camera: THREE.PerspectiveCamera, basePos: THREE.Vector3) {
    this._camera = camera;
    this._basePos = basePos.clone();
  }

  /**
   * Triggers a screen shake effect.
   * @param mag Magnitude of the shake.
   * @param durMs Duration in milliseconds.
   */
  public shake(mag: number, durMs: number): void {
    this._shakeMag = mag;
    this._shakeT = durMs;
  }

  public update(dt: number): void {
    if (this._shakeT > 0) {
      this._shakeT = Math.max(0, this._shakeT - dt * 1000);
      const m = this._shakeMag * (this._shakeT / 500) * 0.012;
      this._camera.position.set(
        this._basePos.x + (Math.random() - 0.5) * m,
        this._basePos.y + (Math.random() - 0.5) * m,
        this._basePos.z,
      );
    } else {
      this._camera.position.lerp(this._basePos, 0.10);
    }
  }
}
