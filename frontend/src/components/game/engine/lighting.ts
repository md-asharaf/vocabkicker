import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene) {
  // ── Natural ambient (sky blue above, green below) ─────────────────
  const hemi = new THREE.HemisphereLight(0xb0d8ff, 0x4a7a1a, 0.75);
  scene.add(hemi);

  // ── Sun (directional, casting shadows) ────────────────────────────
  const sun = new THREE.DirectionalLight(0xfff5d0, 2.4);
  sun.position.set(12, 32, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(2048);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  // ── Stadium floodlights (warm white point lights) ─────────────────
  const floodPositions = [[-18, 18, -6], [18, 18, -6], [0, 20, 12]];
  floodPositions.forEach(([x, y, z]) => {
    const pt = new THREE.PointLight(0xfff8e7, 0.55, 65);
    pt.position.set(x, y, z);
    scene.add(pt);
  });

  // ── Subtle fill from behind camera ───────────────────────────────
  const fill = new THREE.DirectionalLight(0xddeeff, 0.3);
  fill.position.set(-5, 10, 20);
  scene.add(fill);
}
