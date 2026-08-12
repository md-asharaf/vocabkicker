/**
 * Particles.js  —  3D explosion particles for goal / miss events.
 */
import * as THREE from 'three';

class Particle {
  constructor(scene, pos, color) {
    const r   = 0.05 + Math.random() * 0.07;
    const geo = new THREE.SphereGeometry(r, 6, 5);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(pos);
    scene.add(this.mesh);

    const spd = 2.5 + Math.random() * 6;
    const az  = Math.random() * Math.PI * 2;
    const el  = Math.random() * Math.PI;
    this.vel  = new THREE.Vector3(
      Math.sin(el) * Math.cos(az) * spd,
      2 + Math.random() * 5,
      Math.cos(el) * spd * 0.5,
    );
    this.life    = 1;
    this.decay   = 0.016 + Math.random() * 0.022;
    this._scene  = scene;
  }

  /** @returns {boolean} false when dead */
  update(dt) {
    this.vel.y -= 5.5 * dt;
    this.mesh.position.addScaledVector(this.vel, dt);
    this.life  -= this.decay;
    this.mesh.material.opacity = Math.max(0, this.life);
    if (this.life <= 0) {
      this._scene.remove(this.mesh);
      return false;
    }
    return true;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this._scene     = scene;
    this._particles = [];
  }

  _spawn(pos, colors, count) {
    for (const col of colors) {
      for (let i = 0; i < count; i++) {
        this._particles.push(new Particle(this._scene, pos, col));
      }
    }
  }

  /** Golden explosion on GOAL */
  spawnGoal(pos) {
    this._spawn(pos,
      [0xffd700, 0x22c55e, 0xff8c00, 0xffffff, 0x00e5ff, 0xff69b4],
      12,
    );
  }

  /** Red burst on MISS / CATCH */
  spawnMiss(pos) {
    this._spawn(pos, [0xef4444, 0xff6b35, 0xcc2200], 10);
  }

  /** @param {number} dt */
  update(dt) {
    this._particles = this._particles.filter(p => p.update(dt));
  }

  clear() {
    this._particles.forEach(p => { this._scene.remove(p.mesh); });
    this._particles = [];
  }
}
