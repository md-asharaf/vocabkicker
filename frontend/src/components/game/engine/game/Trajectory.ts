import * as THREE from 'three';

function bezier(t: number, p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3): THREE.Vector3 {
  const mt = 1 - t;
  return new THREE.Vector3(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  );
}

export class Trajectory {
  private _dots: THREE.Mesh[];
  private _shadows: THREE.Mesh[];
  public group: THREE.Group;

  constructor() {
    this._dots = [];
    this._shadows = [];

    const geo = new THREE.SphereGeometry(0.12, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.8 });
    const shadowGeo = new THREE.CircleGeometry(0.1, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });

    this.group = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const dot = new THREE.Mesh(geo, mat);
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      this._dots.push(dot);
      this._shadows.push(shadow);
      this.group.add(dot, shadow);
    }
    this.group.visible = false;
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }

  update(src: THREE.Vector3, dst: THREE.Vector3, curveFactor: number) {
    const dist = src.distanceTo(dst);
    const peakY = Math.max(src.y, dst.y) + 1.4 + dist * 0.10;
    const ctrl = new THREE.Vector3(
      (src.x + dst.x) / 2 + curveFactor * Math.min(dist * 0.28, 2.4),
      peakY,
      (src.z + dst.z) / 2,
    );

    const MAX_T = 0.6;
    for (let i = 0; i < 16; i++) {
      const t = (i / 15) * MAX_T;
      const p = bezier(t, src, ctrl, dst);

      const dot = this._dots[i];
      const shadow = this._shadows[i];

      dot.position.copy(p);

      const scale = 1 - t * 0.8;
      dot.scale.setScalar(scale);

      shadow.position.set(p.x, 0.01, p.z);
      shadow.scale.setScalar(scale * 1.5);
    }

    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  updateCursorPulse(dt: number) {
  }
}
