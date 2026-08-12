/**
 * Goalkeeper.js
 * Humanoid goalkeeper with detailed limbs, spherical head, and parabolic dive mechanics.
 */
import * as THREE from 'three';

function mk(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

function makeJerseyTex(hexColor, number) {
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
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(S / 2, 0, 80, 0, Math.PI); ctx.fill();
  
  // Number on back
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 160px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(number), S * 0.25, H * 0.5);
  return new THREE.CanvasTexture(c);
}

function makeFaceTex(skinHex) {
  const S = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = H;
  const ctx = c.getContext('2d');
  
  // Skin
  ctx.fillStyle = `#${skinHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, S, H);
  
  // Hair covering top, back, and sides
  // For goalkeepers, let's keep the cap area brown/black underneath
  ctx.fillStyle = '#221100';
  ctx.fillRect(0, 0, S, H*0.25); // top
  ctx.fillRect(0, 0, S*0.35, H); // back-left
  ctx.fillRect(S*0.65, 0, S*0.35, H); // back-right
  
  // Eyes
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(S*0.42, H*0.45, 8, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(S*0.58, H*0.45, 8, 0, Math.PI*2); ctx.fill();
  
  // Brows
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(S*0.39, H*0.38); ctx.lineTo(S*0.45, H*0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(S*0.61, H*0.38); ctx.lineTo(S*0.55, H*0.42); ctx.stroke();

  // Serious mouth
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(S*0.43, H*0.65); ctx.lineTo(S*0.57, H*0.65); ctx.stroke();
  
  return new THREE.CanvasTexture(c);
}

export class Goalkeeper {
  constructor(colorHex, index) {
    this.colorHex  = colorHex;
    this.index     = index;
    this.isCorrect = false;

    // Animation states
    this._diveDir   = 0;
    this._diveT     = 0;
    this._idleT     = 0;
    this._isCaught  = false;
    this._origX     = 0;

    this.group = new THREE.Group();
    this._build();
  }

  _build() {
    const C       = this.colorHex;
    const skinC   = [0xffdbac, 0xf1c27d, 0xe0ac69, 0x8d5524][this.index % 4];
    const jerseyM = new THREE.MeshPhongMaterial({ map: makeJerseyTex(C, this.index + 1), shininess: 20 });
    const skinM   = new THREE.MeshPhongMaterial({ color: skinC });
    const faceM   = new THREE.MeshPhongMaterial({ map: makeFaceTex(skinC) });
    const shortsM = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 10 });
    const gloveM  = new THREE.MeshPhongMaterial({ color: 0xffcc00, shininess: 60 });
    const bootM   = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 40 });
    const capM    = new THREE.MeshPhongMaterial({ color: C });

    const body = new THREE.Group();

    // Torso (rounded capsule)
    const torso = mk(new THREE.CapsuleGeometry(0.2, 0.25, 8, 16), jerseyM);
    torso.position.y = 1.05;
    body.add(torso);

    // Shorts (wider capsule)
    const shorts = mk(new THREE.CapsuleGeometry(0.2, 0.18, 8, 16), shortsM);
    shorts.position.y = 0.68;
    body.add(shorts);

    // Head (spherical)
    const head = mk(new THREE.SphereGeometry(0.15, 32, 16), faceM);
    head.position.y = 1.62;
    head.rotation.y = -Math.PI / 2; // +Z face
    body.add(head);

    // Cap
    const cap = mk(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), capM);
    cap.position.set(0, 1.72, 0);
    const brim = mk(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16, 1, false, Math.PI, Math.PI), capM);
    brim.position.set(0, 1.68, 0.05);
    brim.rotation.x = -0.1;
    body.add(cap, brim);

    this.group.add(body);
    this._body = body;

    this._shoulders = this._buildArms(body, jerseyM, skinM, gloveM);
    this._hips      = this._buildLegs(this.group, shortsM, skinM, bootM);
    
    this._initPose();
  }

  _buildArms(parent, jerseyM, skinM, gloveM) {
    const arms = [];
    [-1, 1].forEach(side => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.25, 1.25, 0); 

      const upper = mk(new THREE.CapsuleGeometry(0.075, 0.28, 8, 12), jerseyM);
      upper.position.y = -0.14;
      shoulder.add(upper);

      const elbow = new THREE.Group();
      elbow.position.y = -0.32;

      const fore = mk(new THREE.CapsuleGeometry(0.065, 0.24, 8, 12), skinM);
      fore.position.y = -0.12;
      elbow.add(fore);

      // Glove (rounded)
      const gloveGroup = new THREE.Group();
      gloveGroup.position.y = -0.28;
      const gloveBase = mk(new THREE.SphereGeometry(0.09, 12, 12), gloveM);
      const gloveFingers = mk(new THREE.BoxGeometry(0.14, 0.1, 0.04), gloveM);
      gloveFingers.position.set(0, -0.06, 0.02);
      gloveGroup.add(gloveBase, gloveFingers);
      
      if (side === 1) {
        this.catchPoint = new THREE.Object3D();
        this.catchPoint.position.set(0, -0.1, 0); // slightly past the glove center
        gloveGroup.add(this.catchPoint);
      }

      elbow.add(gloveGroup);

      shoulder.add(elbow);
      parent.add(shoulder);
      arms.push({ shoulder, elbow });
    });
    return arms;
  }

  _buildLegs(parent, shortsM, skinM, bootM) {
    const hips = [];
    [-1, 1].forEach(side => {
      const hip = new THREE.Group();
      hip.position.set(side * 0.14, 0.65, 0);

      const thigh = mk(new THREE.CapsuleGeometry(0.10, 0.32, 8, 12), shortsM);
      thigh.position.y = -0.16;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.36;

      const shin = mk(new THREE.CapsuleGeometry(0.08, 0.30, 8, 12), skinM);
      shin.position.y = -0.15;
      knee.add(shin);

      // Boot
      const boot = new THREE.Group();
      boot.position.set(0, -0.32, 0.04);
      const sole = mk(new THREE.BoxGeometry(0.12, 0.04, 0.28), bootM);
      const upper = mk(new THREE.BoxGeometry(0.11, 0.08, 0.26), bootM);
      upper.position.y = 0.06;
      boot.add(sole, upper);
      knee.add(boot);

      hip.add(knee);
      parent.add(hip);
      hips.push({ hip, knee });
    });
    return hips;
  }

  _initPose() {
    this.group.rotation.set(0, 0, 0);
    this._body.rotation.x = 0;
    this._shoulders[0].shoulder.rotation.set(0.3, 0, 0.4);
    this._shoulders[0].elbow.rotation.set(-0.5, 0, 0);
    this._shoulders[1].shoulder.rotation.set(0.3, 0, -0.4);
    this._shoulders[1].elbow.rotation.set(-0.5, 0, 0);
    this._hips.forEach(h => {
      h.hip.rotation.set(-0.2, 0, 0);
      h.knee.rotation.set(0.4, 0, 0);
    });
  }

  addToScene(scene, x, z) {
    this.group.position.set(x, 0, z);
    this._origX = x;
    scene.add(this.group);
  }
  remove(scene) { scene.remove(this.group); }

  dive(targetX, targetY) {
    this._diveTargetX = targetX;
    this._diveTargetY = targetY;
    
    const dx = targetX - this._origX;
    if (Math.abs(dx) < 1.2) {
      this._diveDir = 0; // Just stand and reach
      this._diveBodyDx = dx; // step directly under it
    } else {
      this._diveDir = dx < 0 ? -1 : 1;
      this._diveBodyDx = dx - (this._diveDir * 1.8); // Offset so hands (which extend ~1.8m) catch the ball
      
      // Don't dive backward if the ball is close! Let it hit the chest.
      if (this._diveDir === 1 && this._diveBodyDx < 0) this._diveBodyDx = 0;
      if (this._diveDir === -1 && this._diveBodyDx > 0) this._diveBodyDx = 0;
    }
    
    this._diveT    = 0;
    this._isCaught = false;
    this._caughtBall = null;
  }

  catch(ball) { 
    this._isCaught = true; 
    this._caughtBall = ball; // store reference to pull it down
  }

  update(dt) {
    // If they are diving or standing up to reach the ball
    if (this._diveT > 0 || this._diveTargetX !== undefined) this._updateDive(dt);
    else this._updateIdle(dt);
  }

  _updateIdle(dt) {
    this._idleT += dt;
    const sway = Math.sin(this._idleT * 2 + this.index) * 0.04;
    this.group.position.x = this._origX + sway;
    const bounce = Math.abs(Math.sin(this._idleT * 4)) * 0.04;
    this.group.position.y = -bounce;
  }

  _updateDive(dt) {
    if (this._isCaught) {
      const targetGroundY = (this._diveDir === 0) ? 0 : 0.4;
      if (this.group.position.y > targetGroundY) {
        const fallSpeed = dt * 6;
        this.group.position.y = Math.max(targetGroundY, this.group.position.y - fallSpeed); // fall
        
        if (this._caughtBall && this.catchPoint) {
          // Ball follows exactly in the goalkeeper's hands!
          const handPos = new THREE.Vector3();
          this.catchPoint.getWorldPosition(handPos);
          this._caughtBall.mesh.position.copy(handPos);
          this._caughtBall.shadow.position.set(handPos.x, 0.005, handPos.z);
        }
      }
      return;
    }
    
    // Jump completes slightly before ball lands for dramatic effect
    this._diveT = Math.min(this._diveT + dt * 1.3, 1);
    const p   = this._diveT;
    const dir = this._diveDir;

    // Move body towards landing spot
    this.group.position.x = this._origX + p * this._diveBodyDx;
    
    // Exact body height so hands intersect the ball exactly!
    const finalBodyY = (dir === 0) ? Math.max(0, this._diveTargetY - 1.8) : Math.max(0.2, this._diveTargetY);
    const jumpArc = (dir === 0) ? 0.3 : Math.max(0.8, finalBodyY + 0.5);
    this.group.position.y = Math.sin(p * Math.PI) * jumpArc + (p * finalBodyY);

    // Body rotates to lay out horizontally (unless standing)
    if (dir !== 0) {
      const targetBodyZ = -dir * (Math.PI / 2.2);
      this.group.rotation.z = THREE.MathUtils.lerp(0, targetBodyZ, p * 1.2);
      this.group.rotation.x = p * 0.3;
      this._body.rotation.x = THREE.MathUtils.lerp(this._body.rotation.x, 0, dt * 12);
    } else {
      this.group.rotation.z = 0;
      this.group.rotation.x = 0;
      
      // Stand and bend down/forward based on height
      let bodyBend = 0;
      if (this._diveTargetY > 2.0) bodyBend = -0.1; // Arch back slightly
      else if (this._diveTargetY > 1.0) bodyBend = 0.2; // Lean forward slightly
      else bodyBend = 0.8; // Bend down for low ball
      
      this._body.rotation.x = THREE.MathUtils.lerp(this._body.rotation.x, bodyBend, dt * 12);
    }

    // Fully extend both arms towards ball
    this._shoulders.forEach(s => {
      if (dir !== 0) {
        // Horizontal dive
        const tgtZ = (dir > 0) ? (Math.PI - 0.2) : -(Math.PI - 0.2);
        s.shoulder.rotation.z = THREE.MathUtils.lerp(s.shoulder.rotation.z, tgtZ, dt * 12);
        s.shoulder.rotation.x = THREE.MathUtils.lerp(s.shoulder.rotation.x, 0.4, dt * 12);
      } else {
        // Standing save - point arms dynamically based on ball height
        let targetRotX = 0;
        if (this._diveTargetY > 2.0) targetRotX = Math.PI - 0.2; // UP
        else if (this._diveTargetY > 1.0) targetRotX = Math.PI / 2; // FORWARD
        else targetRotX = 0.5; // DOWN
        
        s.shoulder.rotation.z = THREE.MathUtils.lerp(s.shoulder.rotation.z, 0, dt * 12);
        s.shoulder.rotation.x = THREE.MathUtils.lerp(s.shoulder.rotation.x, targetRotX, dt * 12);
      }
      s.elbow.rotation.x = THREE.MathUtils.lerp(s.elbow.rotation.x, 0, dt * 12);
    });

    // Handle legs
    this._hips.forEach(h => {
      if (dir !== 0) {
        // Straighten legs for horizontal dive
        h.hip.rotation.set(0, 0, (dir > 0) ? -0.2 : 0.2);
        h.knee.rotation.x = THREE.MathUtils.lerp(h.knee.rotation.x, 0, dt * 12);
      } else {
        // Squat down slightly for low balls
        let hipBend = 0;
        let kneeBend = 0;
        if (this._diveTargetY <= 1.0) {
          hipBend = -1.0;
          kneeBend = 1.0;
        } else if (this._diveTargetY <= 2.0) {
          hipBend = -0.3;
          kneeBend = 0.3;
        }
        h.hip.rotation.set(THREE.MathUtils.lerp(h.hip.rotation.x, hipBend, dt * 12), 0, 0);
        h.knee.rotation.x = THREE.MathUtils.lerp(h.knee.rotation.x, kneeBend, dt * 12);
      }
    });
  }

  reset(x, z) {
    this._diveTargetX = undefined;
    this._diveTargetY = undefined;
    this._diveDir  = 0;
    this._diveT    = 0;
    this._isCaught = false;
    this._caughtBall = null;
    this._idleT    = 0;
    this._origX    = x;
    this.group.position.set(x, 0, z);
    this._initPose();
  }
}
