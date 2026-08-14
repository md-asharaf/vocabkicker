import * as THREE from 'three';
import { BALL_POS } from '../constants';

// ── Ball texture ───────────────────────────────────────────────────

function makeBallTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = '#111111';
  const patches = [
    [S * 0.50, S * 0.50, 58],
    [S * 0.50, S * 0.10, 44],
    [S * 0.50, S * 0.90, 44],
    [S * 0.08, S * 0.30, 44],
    [S * 0.92, S * 0.30, 44],
    [S * 0.08, S * 0.70, 44],
    [S * 0.92, S * 0.70, 44],
  ];
  patches.forEach(([cx, cy, r]) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      } else {
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
    }
    ctx.closePath();
    ctx.fill();
  });

  // Seam lines
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 8;
  [
    [S * 0.5, S * 0.5, S * 0.5, S * 0.10],
    [S * 0.5, S * 0.5, S * 0.08, S * 0.30],
    [S * 0.5, S * 0.5, S * 0.92, S * 0.30],
    [S * 0.5, S * 0.5, S * 0.08, S * 0.70],
    [S * 0.5, S * 0.5, S * 0.92, S * 0.70],
    [S * 0.5, S * 0.5, S * 0.5, S * 0.90],
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  return new THREE.CanvasTexture(c);
}

// ── Shadow (flat disc on ground) ──────────────────────────────────

function makeShadow(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(0.22, 20);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.35,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.005;
  return m;
}

// ── Bezier evaluation ─────────────────────────────────────────────

function bezier(t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  );
}

// ── Ball class ────────────────────────────────────────────────────

export class Ball {
  public mesh: THREE.Mesh;
  public shadow: THREE.Mesh;
  private _flying: boolean;
  private _falling: boolean;
  private _t: number;
  private _src: THREE.Vector3;
  private _ctrl: THREE.Vector3;
  private _dst: THREE.Vector3;
  private _velocity: THREE.Vector3;
  private _curveFactor: number;
  private _spinAxis: THREE.Vector3;
  private _onLand: (() => void) | null;
  private _landFired: boolean;
  private _isCaught: boolean;

  constructor() {
    const geo = new THREE.SphereGeometry(0.22, 32, 32);
    const mat = new THREE.MeshPhongMaterial({
      map: makeBallTexture(),
      shininess: 140,
      specular: new THREE.Color(0x888888),
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;

    this.shadow = makeShadow();

    // Flight state
    this._flying = false;
    this._falling = false;
    this._t = 0;
    this._src = new THREE.Vector3();
    this._ctrl = new THREE.Vector3();
    this._dst = new THREE.Vector3();
    this._velocity = new THREE.Vector3();
    this._curveFactor = 0;
    this._spinAxis = new THREE.Vector3(0, 0, 1);
    this._onLand = null;
    this._landFired = false;
    this._isCaught = false;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
    scene.add(this.shadow);
  }

  reset() {
    this.mesh.position.copy(BALL_POS);
    this.shadow.position.set(BALL_POS.x, 0.005, BALL_POS.z);
    this.shadow.scale.setScalar(1);
    (this.shadow.material as THREE.Material).opacity = 0.35;
    this._flying = false;
    this._falling = false;
    this._isCaught = false;
    this._t = 0;
    this._landFired = false;
  }

  kick(dst: THREE.Vector3, curveFactor: number, onLand: () => void) {
    this._src.copy(this.mesh.position);
    this._dst.copy(dst);
    this._curveFactor = curveFactor;
    this._onLand = onLand;
    this._flying = true;
    this._falling = false;
    this._isCaught = false;
    this._t = 0;
    this._landFired = false;

    const dist = this._src.distanceTo(dst);
    const peakY = Math.max(this._src.y, dst.y) + 1.4 + dist * 0.10;

    // Control point: midpoint lifted to peak, then laterally shifted for curve
    this._ctrl.set(
      (this._src.x + dst.x) / 2 + curveFactor * Math.min(dist * 0.28, 2.4),
      peakY,
      (this._src.z + dst.z) / 2,
    );

    // Spin axis tilts based on curve direction
    this._spinAxis.set(-curveFactor, 0, 1).normalize();
  }

  getPosAtZ(z: number): THREE.Vector3 {
    const t = (z - this._src.z) / (this._dst.z - this._src.z);
    return bezier(t, this._src, this._ctrl, this._dst);
  }

  getFlightPath(): { src: THREE.Vector3, ctrl: THREE.Vector3, dst: THREE.Vector3 } {
    return { src: this._src, ctrl: this._ctrl, dst: this._dst };
  }

  catch() {
    this._falling = false;
    this._flying = false;
    this._isCaught = true;
    this._velocity.set(0, 0, 0);
  }

  drop() {
    this._falling = true;
    this._flying = false;
    // Derive velocity from end of flight path
    const dx = this._dst.x - this._ctrl.x;
    const dy = this._dst.y - this._ctrl.y;
    const dz = this._dst.z - this._ctrl.z;
    this._velocity.set(dx * 0.5, dy * 0.5, dz * 0.5);
    // If it hit the net (z ~ -13.5), make it bounce back slightly
    if (this.mesh.position.z <= -13.0 && this.mesh.position.y < 2.44 && Math.abs(this.mesh.position.x) < 6.0) {
      this._velocity.z *= -0.4;
      this._velocity.y *= 0.5;
      this._velocity.x *= 0.5;
    }
  }

  update(dt: number) {
    if (this._falling) {
      // Gravity and bounce
      this._velocity.y -= 9.8 * dt; // gravity
      this.mesh.position.addScaledVector(this._velocity, dt);

      // Ground collision
      if (this.mesh.position.y < 0.22) {
        this.mesh.position.y = 0.22;
        this._velocity.y *= -0.6; // bounce
        this._velocity.x *= 0.9;  // friction
        this._velocity.z *= 0.9;

        // Stop completely if very slow
        if (this._velocity.lengthSq() < 0.1) {
          this._falling = false;
        }
      }

      // Keep spinning based on velocity
      const speed = this._velocity.length();
      if (speed > 0.1) {
        const axis = new THREE.Vector3(-this._velocity.z, 0, this._velocity.x).normalize();
        this.mesh.rotateOnWorldAxis(axis, speed * dt * 2);
      }

      this.shadow.position.set(this.mesh.position.x, 0.005, this.mesh.position.z);
      return;
    }

    if (this._isCaught) {
      // Freeze completely in goalkeeper's hands
      return;
    }

    if (!this._flying) {
      // Gentle idle bob (only at the start before being kicked)
      const t = Date.now() * 0.0015;
      this.mesh.position.y = BALL_POS.y + Math.sin(t) * 0.025;
      this.mesh.rotation.y += dt * 0.5;
      this.shadow.position.set(this.mesh.position.x, 0.005, this.mesh.position.z);
      return;
    }

    // Advance t (total flight ≈ 0.9 s)
    this._t = Math.min(this._t + dt * 1.1, 1);

    // Position on bezier
    const p = bezier(this._t, this._src, this._ctrl, this._dst);
    this.mesh.position.copy(p);

    // Spin around tilted axis (curve spin)
    this.mesh.rotateOnWorldAxis(this._spinAxis, dt * (9 + Math.abs(this._curveFactor) * 5));

    // Shadow: shrinks as ball rises, fades
    const groundScale = 1 - this._t * 0.55;
    this.shadow.position.set(p.x, 0.005, p.z);
    this.shadow.scale.setScalar(Math.max(0.3, groundScale));
    (this.shadow.material as THREE.Material).opacity = Math.max(0.05, 0.35 * groundScale);

    if (this._t >= 1 && !this._landFired) {
      this._landFired = true;
      // We don't stop flying here, GameState will call drop() or handle catch
      this._onLand?.();
    }
  }
}
