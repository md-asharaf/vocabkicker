/**
 * stadium.js  —  Background stadium: stands, crowd, floodlight poles.
 */
import * as THREE from 'three';

/**
 * @param {THREE.Scene} scene
 */
export function createStadium(scene) {
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

  // ── Crowd (low-poly spectators) ───────────────────────────────────
  const CROWD_COLORS = [0xe74c3c, 0x3498db, 0xf39c12, 0x22c55e, 0xffffff, 0xff8c00, 0x9b59b6];
  const COUNT        = 400; // Increased count for density

  // Body mesh
  const bodyGeo = new THREE.BoxGeometry(0.35, 0.45, 0.25);
  const iBody   = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial(), COUNT);
  
  // Head mesh
  const headGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2); // boxy heads look good from far away
  const iHead   = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial(), COUNT);

  const dummyBody = new THREE.Object3D();
  const dummyHead = new THREE.Object3D();
  
  for (let i = 0; i < COUNT; i++) {
    const row = Math.floor(i / 80);
    const col = i % 80;
    
    // Slight random offset to make crowd look less perfectly aligned
    const ox = (Math.random() - 0.5) * 0.2;
    const oy = (Math.random() - 0.5) * 0.1;
    
    const bx = -18.5 + col * 0.48 + ox;
    const by = 1.6 + row * 1.1 + oy;
    const bz = -26.5;

    dummyBody.position.set(bx, by, bz);
    dummyBody.updateMatrix();
    iBody.setMatrixAt(i, dummyBody.matrix);
    
    dummyHead.position.set(bx, by + 0.35, bz);
    dummyHead.updateMatrix();
    iHead.setMatrixAt(i, dummyHead.matrix);

    const c = new THREE.Color(CROWD_COLORS[Math.floor(Math.random() * CROWD_COLORS.length)]);
    iBody.setColorAt(i, c);
    
    // Skin tones for heads
    const skins = [0xffdbac, 0xf1c27d, 0xe0ac69, 0x8d5524, 0xc68642];
    iHead.setColorAt(i, new THREE.Color(skins[Math.floor(Math.random() * skins.length)]));
  }
  
  iBody.instanceMatrix.needsUpdate = true;
  iHead.instanceMatrix.needsUpdate = true;
  if (iBody.instanceColor) iBody.instanceColor.needsUpdate = true;
  if (iHead.instanceColor) iHead.instanceColor.needsUpdate = true;
  
  scene.add(iBody);
  scene.add(iHead);

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
