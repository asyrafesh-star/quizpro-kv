import * as THREE from './three.module.min.js';

const host = document.getElementById('race3d');
const status = document.getElementById('renderStatus');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function createRace() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x192b50);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x192b50, 22, 92);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 140);
  camera.position.set(0, 4.2, 8.5);
  camera.lookAt(0, 1, -13);
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x514472, 3));
  const sun = new THREE.DirectionalLight(0xffd3a5, 3);
  sun.position.set(-8, 12, -12);
  scene.add(sun);

  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color);
  }
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  function box(parent, color, size, position) {
    const mesh = new THREE.Mesh(boxGeometry, material(color));
    mesh.scale.set(...size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  box(scene, 0x213550, [160, 0.2, 150], [0, -0.25, -50]);
  box(scene, 0x39465d, [9, 0.2, 125], [0, -0.1, -48]);
  [-4.6, 4.6].forEach(x => {
    box(scene, 0x89d3c9, [0.25, 0.15, 125], [x, 0, -48]);
    box(scene, 0x263647, [1.4, 0.25, 125], [x + Math.sign(x) * 0.8, -0.02, -48]);
  });

  const stripes = [];
  for (let row = 0; row < 28; row++) {
    [-1.5, 1.5].forEach(x => stripes.push(box(scene, 0xd7c9ff, [0.08, 0.03, 1.8], [x, 0.03, -row * 4])));
  }
  const buildings = [];
  const colors = [0x385c7d, 0x5b4a83, 0x427e88, 0x6b597e];
  for (let row = 0; row < 18; row++) {
    [-1, 1].forEach(side => {
      const height = 3 + (row * 7 % 8);
      const building = new THREE.Group();
      building.position.set(side * (8 + row % 3), 0, -row * 7);
      box(building, colors[row % colors.length], [3, height, 3.5], [0, height / 2, 0]);
      for (let floor = 1; floor < height; floor += 2) {
        box(building, 0xa4ded7, [0.08, 0.6, 1.8], [-side * 1.52, floor, 0]);
      }
      scene.add(building);
      buildings.push(building);
    });
  }

  // Labels are drawn locally so no font or image download is needed.
  const gates = new THREE.Group();
  gates.position.z = -15;
  const gateColors = [0xe94378, 0x448dff, 0xe8ae41];
  [-3, 0, 3].forEach((x, index) => {
    const color = gateColors[index];
    box(gates, color, [0.12, 2.6, 0.2], [x - 1.15, 1.3, 0]);
    box(gates, color, [0.12, 2.6, 0.2], [x + 1.15, 1.3, 0]);
    box(gates, color, [2.4, 0.16, 0.2], [x, 2.6, 0]);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
    context.fillRect(0, 0, 128, 128);
    context.font = '900 88px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText('ABC'[index], 64, 67);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
    label.position.set(x, 3.25, 0.15);
    gates.add(label);
  });
  scene.add(gates);

  const runner = new THREE.Group();
  runner.position.z = 1;
  scene.add(runner);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), material(0xffca9d));
  head.position.set(0, 1.95, 0);
  runner.add(head);
  box(runner, 0x382e52, [0.47, 0.18, 0.45], [0, 2.13, 0.04]);
  box(runner, 0x9d62eb, [0.65, 0.75, 0.42], [0, 1.35, 0]);
  box(runner, 0x633aa6, [0.43, 0.52, 0.19], [0, 1.38, 0.29]);
  box(runner, 0xffd767, [0.2, 0.08, 0.05], [0, 1.4, 0.4]);
  const limbs = [];
  [-1, 1].forEach(side => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.18, 1, 0);
    box(leg, 0x222d50, [0.23, 0.75, 0.25], [0, -0.37, 0]);
    box(leg, 0xe9f5ff, [0.28, 0.18, 0.44], [0, -0.78, -0.07]);
    runner.add(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.68, 0);
    box(arm, 0xa16aee, [0.22, 0.3, 0.23], [0, -0.13, 0]);
    box(arm, 0xffca9d, [0.18, 0.38, 0.2], [0, -0.43, 0]);
    runner.add(arm);
    limbs.push({ leg, arm, side });
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), new THREE.MeshBasicMaterial({ color: 0x182238, transparent: true, opacity: 0.5 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 1);
  scene.add(shadow);
  const ice = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 0), new THREE.MeshPhongMaterial({ color: 0x8cecff, transparent: true, opacity: 0.35, flatShading: true }));
  ice.position.set(0, 1.1, 1);
  scene.add(ice);
  ice.visible = false;

  const finish = new THREE.Group();
  [-4.2, 4.2].forEach(x => box(finish, 0xe8e7ff, [0.16, 4.4, 0.2], [x, 2.2, 0]));
  for (let column = 0; column < 16; column++) {
    for (let row = 0; row < 2; row++) {
      box(finish, (column + row) % 2 ? 0xffffff : 0x151627, [0.53, 0.45, 0.12], [-3.98 + column * 0.53, 4 - row * 0.45, 0]);
    }
  }
  scene.add(finish);

  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  host.closest('.race-scene').classList.add('has-3d');
  status.textContent = '';
  let previous = 0;
  let stride = 0;
  let contextLost = false;
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    host.closest('.race-scene').classList.remove('has-3d');
    status.textContent = 'Paparan ringkas diaktifkan. Anda boleh terus menjawab.';
  });
  renderer.setAnimationLoop(time => {
    const dt = Math.min((time - previous) / 1000, 0.05);
    previous = time;
    if (contextLost || document.hidden || document.getElementById('play').hidden) return;
    const phase = host.dataset.phase;
    const moving = phase === 'answer' || phase === 'feedback';
    const speed = moving && !reducedMotion ? (phase === 'feedback' ? 18 : 8) : 0;
    stride += dt * speed;
    const lane = Number(host.dataset.lane ?? 1);
    runner.position.x += ((lane - 1) * 3 - runner.position.x) * Math.min(1, dt * 9);
    runner.position.y = moving && !reducedMotion ? Math.abs(Math.sin(stride * 2)) * 0.07 : 0;
    limbs.forEach(({ leg, arm, side }) => {
      leg.rotation.x = moving && !reducedMotion ? Math.sin(stride * 2) * 0.65 * side : 0;
      arm.rotation.x = -leg.rotation.x;
    });
    shadow.position.x = ice.position.x = runner.position.x;
    ice.visible = phase === 'penalty';
    stripes.forEach(stripe => { stripe.position.z += dt * speed; if (stripe.position.z > 10) stripe.position.z -= 112; });
    buildings.forEach(building => { building.position.z += dt * speed; if (building.position.z > 14) building.position.z -= 126; });
    const progress = Number(host.dataset.progress || 0);
    finish.position.z = -95 + progress * 92;
    gates.visible = progress < 1;
    scene.fog.color.setHex(phase === 'penalty' ? 0x244f72 : 0x192b50);
    renderer.setClearColor(scene.fog.color);
    renderer.render(scene, camera);
  });
  addEventListener('pagehide', () => {
    renderer.setAnimationLoop(null);
    resize.disconnect();
    renderer.dispose();
  }, { once: true });
}

try {
  createRace();
} catch (error) {
  host.closest('.race-scene').classList.remove('has-3d');
  status.textContent = 'Paparan ringkas diaktifkan. Anda boleh terus menjawab.';
  console.warn('QuizPro 3D renderer unavailable', error);
}
