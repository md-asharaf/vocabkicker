/**
 * goal.js  —  3D goal: round posts, crossbar, and 4-panel net.
 */
import * as THREE from 'three';
import { GOAL_W, GOAL_H, GOAL_Z, GOAL_D } from '../constants.js';

const POST_R    = 0.055;
const WHITE_MAT = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });

/** Creates a cylinder post/bar and positions it. */
function bar(h, rx = 0, rz = 0, x = 0, y = 0, z = 0) {
  const geo  = new THREE.CylinderGeometry(POST_R, POST_R, h, 14);
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.castShadow    = true;
  mesh.rotation.set(rx, 0, rz);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Creates a net panel (transparent plane with grid canvas texture). */
function netPanel(w, h, rx = 0, ry = 0, x = 0, y = 0, z = 0, segmentsX = 1, segmentsY = 1) {
  const S   = 256;
  const c   = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; // Brighter white
  ctx.lineWidth   = 3.0; // Thicker lines
  const step = S / 12; // Denser net
  for (let i = 0; i <= S; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0);  ctx.lineTo(i, S);   ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,  i); ctx.lineTo(S, i);   ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w * 2, h * 2);

  const geo  = new THREE.PlaneGeometry(w, h, segmentsX, segmentsY);
  const mat  = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.9, // Higher opacity
    side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rx, ry, 0);
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * @param {THREE.Scene} scene
 * @returns {THREE.Group}
 */
export function createGoal(scene) {
  const grp = new THREE.Group();

  const hw = GOAL_W / 2;   // half-width
  const hd = GOAL_D / 2;   // half-depth

  // ── Front frame ─────────────────────────────────────────────────
  grp.add(bar(GOAL_H, 0, 0,  -hw, GOAL_H / 2, GOAL_Z)); // left post
  grp.add(bar(GOAL_H, 0, 0,   hw, GOAL_H / 2, GOAL_Z)); // right post
  grp.add(bar(GOAL_W, 0, Math.PI / 2, 0, GOAL_H, GOAL_Z)); // crossbar

  // ── Back frame ──────────────────────────────────────────────────
  grp.add(bar(GOAL_H, 0, 0,  -hw, GOAL_H / 2, GOAL_Z - GOAL_D));
  grp.add(bar(GOAL_H, 0, 0,   hw, GOAL_H / 2, GOAL_Z - GOAL_D));
  grp.add(bar(GOAL_W, 0, Math.PI / 2, 0, GOAL_H, GOAL_Z - GOAL_D));

  // ── Side bars (depth connectors) ─────────────────────────────────
  const sb = (x, y) => bar(GOAL_D, Math.PI / 2, 0, x, y, GOAL_Z - hd);
  grp.add(sb(-hw, 0),       sb(hw, 0));       // ground level
  grp.add(sb(-hw, GOAL_H),  sb(hw, GOAL_H));  // top

  // ── Net panels ──────────────────────────────────────────────────
  // Back net needs segments so we can deform its vertices when hit
  const backNet = netPanel(GOAL_W, GOAL_H, 0, 0, 0, GOAL_H / 2, GOAL_Z - GOAL_D + 0.01, 24, 12);
  grp.add(backNet);
  // Top
  grp.add(netPanel(GOAL_W, GOAL_D, -Math.PI / 2, 0, 0, GOAL_H, GOAL_Z - hd));
  // Left side
  grp.add(netPanel(GOAL_D, GOAL_H, 0, Math.PI / 2, -hw, GOAL_H / 2, GOAL_Z - hd));
  // Right side
  grp.add(netPanel(GOAL_D, GOAL_H, 0, -Math.PI / 2, hw, GOAL_H / 2, GOAL_Z - hd));

  // Expose backNet for deformation
  grp.userData.backNet = backNet;

  scene.add(grp);
  return grp;
}
