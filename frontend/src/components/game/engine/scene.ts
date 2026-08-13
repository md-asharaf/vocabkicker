import * as THREE from 'three';
export let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;

export function initScene(canvas: HTMLCanvasElement) {
  // ─── Scene ────────────────────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // clear sky blue
  // Light fog for depth — not enough to darken the stadium
  scene.fog = new THREE.Fog(0x9fd4ff, 55, 120);

  // ─── Camera ───────────────────────────────────────────────────────
  camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 160);
  camera.position.set(0, 5.0, 16.5); // Moved back to fit the kicker
  camera.lookAt(0, 1.8, -5);

  // ─── Renderer ─────────────────────────────────────────────────────
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  try { renderer.outputColorSpace = THREE.SRGBColorSpace; } catch (_) { }

  return { scene, camera, renderer };
}

/** Call on window resize */
export function resizeScene() {
  if (!renderer || !camera) return;
  const w = window.innerWidth, h = window.innerHeight;
  const aspect = w / h;

  if (aspect < 1.0) {
    camera.fov = 55 / aspect * 0.55; // widen vertical FOV for portrait (zoomed in a bit more)
  } else {
    camera.fov = 55;
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
