/**
 * Kicker.js
 * Right-footed penalty taker with detailed limbs and side-foot kick.
 */
import * as THREE from 'three';
import { KICKER_START } from '../constants.js';

function mk(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m; }

function makeJerseyTex(hexColor) {
  const S = 512, H = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `#${hexColor.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, S, H);
  
  // Shadows/wrinkles
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(S*0.2, 0, S*0.1, H);
  ctx.fillRect(S*0.7, 0, S*0.1, H);

  // White collar
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(S / 2, 0, 80, 0, Math.PI); ctx.fill();
  
  // Number on back only (UV for back of cylinder is typically edges if front is center)
  // With cylinder rotation, back is often at S*0.25 or S*0.75. We'll draw on back center.
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 140px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('9', S * 0.25, H * 0.45); 

  return new THREE.CanvasTexture(c);
}

// Equirectangular mapping for sphere head
function makeFaceTex(skinHex) {
  const S = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = H;
  const ctx = c.getContext('2d');
  
  // Skin base
  ctx.fillStyle = `#${skinHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, S, H);
  
  // Hair covering top, back, and sides
  ctx.fillStyle = '#221100';
  ctx.fillRect(0, 0, S, H*0.25); // top
  ctx.fillRect(0, 0, S*0.35, H); // back-left & side
  ctx.fillRect(S*0.65, 0, S*0.35, H); // back-right & side
  
  // Eyes (front center is x=S/2)
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(S*0.42, H*0.45, 8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(S*0.58, H*0.45, 8, 0, Math.PI*2); ctx.fill();
  
  // Brows
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(S*0.39, H*0.38); ctx.lineTo(S*0.45, H*0.40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(S*0.61, H*0.38); ctx.lineTo(S*0.55, H*0.40); ctx.stroke();

  // Mouth
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(S*0.45, H*0.65); ctx.quadraticCurveTo(S*0.5, H*0.68, S*0.55, H*0.65); ctx.stroke();
  
  return new THREE.CanvasTexture(c);
}

// ── Bezier Run-up ──────────────────────────────────────────────────
const RUN_P0   = KICKER_START.clone();
const RUN_CTRL = new THREE.Vector3(-0.7, 0, 7.4);
const RUN_P1   = new THREE.Vector3(-0.25, 0, 6.0); // plant position slightly wider for side-foot

function bezierPt(t, p0, ctrl, p1) {
  const mt = 1 - t;
  return new THREE.Vector3(
    mt * mt * p0.x + 2 * mt * t * ctrl.x + t * t * p1.x,
    0,
    mt * mt * p0.z + 2 * mt * t * ctrl.z + t * t * p1.z,
  );
}

const PHASE = { IDLE: 'idle', APPROACH: 'approach', BACKSWING: 'backswing', CONTACT: 'contact', FOLLOW: 'follow' };

export class Kicker {
  constructor() {
    this.group = new THREE.Group();
    this._phase = PHASE.IDLE;
    this._t = 0;
    this._stepT = 0;
    this._onKickFired = null;
    this._kickFired = false;

    this._build();
    this.resetPosition();
  }

  _build() {
    const skinHex = 0xf4a462;
    const jerseyM = new THREE.MeshPhongMaterial({ map: makeJerseyTex(0xe63946), shininess: 20 });
    const shortsM = new THREE.MeshPhongMaterial({ color: 0x1d3557, shininess: 10 });
    const skinM   = new THREE.MeshPhongMaterial({ color: skinHex });
    const faceM   = new THREE.MeshPhongMaterial({ map: makeFaceTex(skinHex) });
    const bootM   = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 50 });
    const sockM   = new THREE.MeshPhongMaterial({ color: 0xffffff });

    // Torso (rounded capsule)
    const torso = mk(new THREE.CapsuleGeometry(0.18, 0.25, 8, 16), jerseyM);
    torso.position.y = 1.08;

    // Shorts (wider capsule)
    const shorts = mk(new THREE.CapsuleGeometry(0.19, 0.15, 8, 16), shortsM);
    shorts.position.y = 0.72;

    // Head
    const head = mk(new THREE.SphereGeometry(0.15, 32, 16), faceM);
    head.position.y = 1.5;
    // Rotate head so +Z (face) points forward correctly in local space
    head.rotation.y = -Math.PI / 2;

    // Neck
    const neck = mk(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), skinM);
    neck.position.y = 1.38;

    this._lShoulder = this._buildArm(-1, jerseyM, skinM);
    this._rShoulder = this._buildArm( 1, jerseyM, skinM);

    this._lHip = this._buildLeg(-1, shortsM, skinM, sockM, bootM);
    this._rHip = this._buildLeg( 1, shortsM, skinM, sockM, bootM);

    this.group.add(torso, shorts, neck, head);
  }

  _buildArm(side, jerseyM, skinM) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.24, 1.25, 0); // Closer to capsule torso

    const upper = mk(new THREE.CapsuleGeometry(0.07, 0.22, 8, 12), jerseyM);
    upper.position.y = -0.12;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;

    const fore = mk(new THREE.CapsuleGeometry(0.06, 0.20, 8, 12), skinM);
    fore.position.y = -0.12;
    elbow.add(fore);

    // Hand (palm + fingers)
    const hand = new THREE.Group();
    hand.position.y = -0.26;
    const palm = mk(new THREE.BoxGeometry(0.08, 0.1, 0.05), skinM);
    hand.add(palm);
    // basic fingers
    const fingers = mk(new THREE.BoxGeometry(0.08, 0.08, 0.03), skinM);
    fingers.position.set(0, -0.07, 0.01);
    hand.add(fingers);

    elbow.add(hand);
    shoulder.add(elbow);
    this.group.add(shoulder);
    return shoulder;
  }

  _buildLeg(side, shortsM, skinM, sockM, bootM) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.14, 0.65, 0);

    const thigh = mk(new THREE.CapsuleGeometry(0.09, 0.28, 8, 12), shortsM);
    thigh.position.y = -0.18;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.38;

    const sock = mk(new THREE.CapsuleGeometry(0.08, 0.24, 8, 12), sockM);
    sock.position.y = -0.14;
    knee.add(sock);

    // Detailed Boot
    const boot = new THREE.Group();
    boot.position.set(0, -0.30, 0.04);
    const sole = mk(new THREE.BoxGeometry(0.12, 0.04, 0.28), bootM);
    const upper = mk(new THREE.BoxGeometry(0.11, 0.08, 0.26), bootM);
    upper.position.y = 0.06;
    boot.add(sole, upper);
    
    // Studs
    const studM = new THREE.MeshPhongMaterial({ color: 0x555555 });
    for (let i of [-1, 1]) {
      for (let j of [-1, 1]) {
        const stud = mk(new THREE.CylinderGeometry(0.015, 0.01, 0.03), studM);
        stud.position.set(i*0.04, -0.03, j*0.1);
        boot.add(stud);
      }
    }

    knee.add(boot);
    hip.add(knee);
    this.group.add(hip);
    return { hip, knee };
  }

  addToScene(scene) { scene.add(this.group); }

  resetPosition() {
    this.group.position.copy(KICKER_START);
    this.group.rotation.set(0, Math.PI, 0);
    this._phase = PHASE.IDLE;
    this._t = 0;
    this._stepT = 0;
    this._kickFired = false;
    this._resetPose();
  }

  _resetPose() {
    this._lHip.hip.rotation.set(0,0,0); this._lHip.knee.rotation.set(0,0,0);
    this._rHip.hip.rotation.set(0,0,0); this._rHip.knee.rotation.set(0,0,0);
    this._lShoulder.rotation.set(0.1, 0, 0.2); 
    this._rShoulder.rotation.set(0.1, 0, -0.2);
    this.group.position.y = 0;
  }

  startRunup(onKick) {
    this._onKickFired = onKick;
    this._phase = PHASE.APPROACH;
    this._t = 0;
    this._kickFired = false;
  }

  update(dt, playStep) {
    switch (this._phase) {
      case PHASE.APPROACH:  this._updateApproach(dt, playStep); break;
      case PHASE.BACKSWING: this._updateBackswing(dt); break;
      case PHASE.CONTACT:   this._updateContact(dt); break;
      case PHASE.FOLLOW:    this._updateFollow(dt); break;
      default:              this._updateIdle(dt); break;
    }
  }

  _updateIdle(dt) {
    const t = Date.now() * 0.001;
    this._lShoulder.rotation.z =  0.2 + Math.sin(t * 1.2) * 0.04;
    this._rShoulder.rotation.z = -0.2 - Math.sin(t * 1.2 + 1.5) * 0.04;
  }

  _updateApproach(dt, playStep) {
    const SPEED = 1.4;
    this._t = Math.min(this._t + dt * SPEED, 1);

    const pos = bezierPt(this._t, RUN_P0, RUN_CTRL, RUN_P1);
    this.group.position.set(pos.x, 0, pos.z);

    this._stepT += dt * 9;
    const s = Math.sin(this._stepT);
    const c = Math.cos(this._stepT);

    this._lHip.hip.rotation.x  =  s * 0.8;
    this._rHip.hip.rotation.x  = -s * 0.8;
    this._lHip.knee.rotation.x = Math.max(0, -s) * 1.0;
    this._rHip.knee.rotation.x = Math.max(0,  s) * 1.0;
    this._lShoulder.rotation.x = -s * 0.6;
    this._rShoulder.rotation.x =  s * 0.6;
    this._lShoulder.rotation.z = 0.4;
    this._rShoulder.rotation.z = -0.4;
    
    this.group.position.y = Math.abs(c) * 0.08;

    if (this._t < 0.98) {
      const nxt = bezierPt(Math.min(this._t + 0.02, 1), RUN_P0, RUN_CTRL, RUN_P1);
      const dx = nxt.x - pos.x, dz = nxt.z - pos.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.001) this.group.rotation.y = Math.atan2(dx, dz);
    }

    if (Math.floor(this._stepT / Math.PI) > Math.floor((this._stepT - dt * 9) / Math.PI)) {
      playStep?.();
    }

    if (this._t >= 1) {
      this.group.rotation.y = Math.PI - 0.2; // slight angle for plant foot
      this._phase = PHASE.BACKSWING;
      this._t = 0;
    }
  }

  _updateBackswing(dt) {
    this._t = Math.min(this._t + dt * 4.0, 1);
    // Right leg opens up for side-foot
    this._rHip.hip.rotation.set(-this._t * 0.8, -this._t * 0.6, this._t * 0.3);
    this._rHip.knee.rotation.set(this._t * 1.2, 0, 0);
    
    this._lHip.hip.rotation.set(0.1, 0, 0);
    this._lHip.knee.rotation.set(0.2, 0, 0);
    
    this._rShoulder.rotation.x = this._t * 0.8;
    this._lShoulder.rotation.x = -this._t * 0.8;
    this._lShoulder.rotation.z = 0.6; // arm out for balance

    if (this._t >= 1) { this._phase = PHASE.CONTACT; this._t = 0; }
  }

  _updateContact(dt) {
    this._t = Math.min(this._t + dt * 5.0, 1);
    const s = Math.sin(this._t * Math.PI);

    // Right leg swings through, keeping hip open (side-foot)
    // Hip goes from -0.8 x to +1.0 x, keeping y open
    this._rHip.hip.rotation.x = -0.8 + this._t * 1.8;
    this._rHip.hip.rotation.y = -0.6 + this._t * 0.2; // close hip slightly on follow through
    this._rHip.knee.rotation.x = Math.max(0, 1.2 - this._t * 1.0); // straighten knee slightly
    
    this.group.position.y = s * 0.1;
    this._rShoulder.rotation.x =  0.8 - this._t * 1.2;
    this._lShoulder.rotation.x = -0.8 + this._t * 0.8;

    if (!this._kickFired && this._t >= 0.4) {
      this._kickFired = true;
      this._onKickFired?.();
    }

    if (this._t >= 1) { this._phase = PHASE.FOLLOW; this._t = 0; }
  }

  _updateFollow(dt) {
    this._t = Math.min(this._t + dt * 2.0, 1);
    this._rHip.hip.rotation.x = 1.0 * (1 - this._t * 0.4);
    this.group.position.y = 0;
  }
}
