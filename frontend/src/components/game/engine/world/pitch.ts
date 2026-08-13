/**
 * pitch.js  —  Football pitch ground plane with canvas-painted field markings.
 */
import * as THREE from 'three';

function makePitchTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');

  // Alternating grass stripes (16 vertical)
  for (let i = 0; i < 16; i++) {
    ctx!.fillStyle = i % 2 === 0 ? '#2a8a2a' : '#339933';
    ctx!.fillRect(i * (S / 16), 0, S / 16, S);
  }

  // ── Field markings ─────────────────────────────────────────────
  ctx!.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx!.lineWidth   = 9;

  // Outer boundary
  ctx!.strokeRect(30, 30, S - 60, S - 60);

  // Half-way line
  ctx!.beginPath(); ctx!.moveTo(30, S / 2); ctx!.lineTo(S - 30, S / 2); ctx!.stroke();

  // Centre circle
  ctx!.beginPath(); ctx!.arc(S / 2, S / 2, 80, 0, Math.PI * 2); ctx!.stroke();

  // Centre spot
  ctx!.fillStyle = 'rgba(255,255,255,0.8)';
  ctx!.beginPath(); ctx!.arc(S / 2, S / 2, 7, 0, Math.PI * 2); ctx!.fill();

  // Penalty area (goal end — top of texture)
  ctx!.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx!.strokeRect(155, 28, S - 310, 195);   // big box
  ctx!.strokeRect(270, 28, S - 540,  88);   // 6-yard box

  // Penalty spot
  ctx!.fillStyle = 'rgba(255,255,255,0.8)';
  ctx!.beginPath(); ctx!.arc(S / 2, 252, 7, 0, Math.PI * 2); ctx!.fill();

  // Penalty arc
  ctx!.lineWidth = 9;
  ctx!.beginPath(); ctx!.arc(S / 2, 252, 115, Math.PI * 0.08, Math.PI * 0.92); ctx!.stroke();

  // Corner arcs
  [[30, 30], [S - 30, 30], [30, S - 30], [S - 30, S - 30]].forEach(([cx, cy]) => {
    ctx!.beginPath(); ctx!.arc(cx, cy, 32, 0, Math.PI * 2); ctx!.stroke();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
export function createPitch(scene: THREE.Scene) {
  const tex = makePitchTexture();
  const geo = new THREE.PlaneGeometry(34, 62, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ map: tex });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x  = -Math.PI / 2;
  mesh.position.set(0, 0, -7);
  mesh.receiveShadow = true;

  scene.add(mesh);
  return mesh;
}
