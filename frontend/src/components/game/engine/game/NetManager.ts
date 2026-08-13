import * as THREE from 'three';

/**
 * NetManager handles the vertex deformation (bulging) of the goal net mesh when the ball hits it.
 */
export class NetManager {
  private readonly _goalNet: THREE.Mesh | null;
  private readonly _origNetVerts: readonly THREE.Vector3[];
  
  private _netHitT: number = 0;
  private readonly _netHitPos: THREE.Vector3 = new THREE.Vector3();

  constructor(goalNet: THREE.Mesh | null) {
    this._goalNet = goalNet;
    
    const verts: THREE.Vector3[] = [];
    if (this._goalNet) {
      const pos = this._goalNet.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
      }
    }
    this._origNetVerts = verts;
  }

  /**
   * Triggers the net hit animation at the given world position.
   */
  public triggerHit(worldPos: THREE.Vector3): void {
    if (!this._goalNet) return;
    this._netHitT = 1.0;
    this._netHitPos.copy(worldPos);
    this._goalNet.worldToLocal(this._netHitPos);
  }

  public update(dt: number): void {
    if (this._netHitT > 0 && this._goalNet) {
      this._netHitT = Math.max(0, this._netHitT - dt * 3.0);
      const pos = this._goalNet.geometry.attributes.position as THREE.BufferAttribute;
      const bulge = Math.sin(this._netHitT * Math.PI * 4) * (this._netHitT * 0.6);

      for (let i = 0; i < pos.count; i++) {
        const ov = this._origNetVerts[i];
        const dx = ov.x - this._netHitPos.x;
        const dy = ov.y - this._netHitPos.y;
        const dist = Math.hypot(dx, dy);

        let zOff = 0;
        if (dist < 2.5) {
          const influence = 1 - (dist / 2.5);
          zOff = influence * bulge;
        }
        pos.setZ(i, ov.z - zOff);
      }
      pos.needsUpdate = true;
    }
  }
}
