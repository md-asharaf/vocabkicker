/**
 * stadium.js  —  Background stadium: stands, crowd, floodlight poles.
 */
import * as THREE from 'three';

/**
 * @param {THREE.Scene} scene
 */
export function createStadium(scene: THREE.Scene) {
  // ── Far ground plane ─────────────────────────────────────────────
  const farGeo = new THREE.PlaneGeometry(130, 130);
  const farMat = new THREE.MeshLambertMaterial({ color: 0x2a7a2a });
  const far    = new THREE.Mesh(farGeo, farMat);
  far.rotation.x = -Math.PI / 2;
  far.position.set(0, -0.01, 0);
  scene.add(far);

  // ── Stand walls ──────────────────────────────────────────────────
  const standMat = new THREE.MeshLambertMaterial({ color: 0x8b9a8b });
  const stands = [
    { w: 68, h: 10, d:  3, x:  0, y:  5, z: -28 },   // back
    { w:  3, h: 10, d: 40, x: -26, y:  5, z: -10 },   // left
    { w:  3, h: 10, d: 40, x:  26, y:  5, z: -10 },   // right
  ];
  stands.forEach(s => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), standMat);
    m.position.set(s.x, s.y, s.z);
    scene.add(m);
  });

  // Crowd removed as requested

  // ── Floodlight poles ─────────────────────────────────────────────
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
  const headMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
  [[-20, 0, -18], [20, 0, -18], [-20, 0, 8], [20, 0, 8]].forEach(([x, , z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 14, 8), poleMat);
    pole.position.set(x, 7, z);
    scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.8), headMat);
    head.position.set(x, 14.2, z);
    scene.add(head);
  });
}
