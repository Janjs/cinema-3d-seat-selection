import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { roundedBoxGeometry } from "./roundedBox.js";
import { AISLES, COLS, makeSeats } from "./layout.js";
import "./style.css";

const canvas = document.querySelector("#cinema");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08070b);
scene.fog = new THREE.Fog(0x08070b, 17, 38);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 80);
const overviewPosition = new THREE.Vector3(12.8, 11.5, 18.5);
const overviewTarget = new THREE.Vector3(0, 1.8, 1.5);
camera.position.copy(overviewPosition);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.target.copy(overviewTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 2;
controls.maxDistance = 31;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.08;

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x17141a, roughness: 0.96 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x242027, roughness: 0.92 }),
  step: new THREE.MeshStandardMaterial({ color: 0x302a31, roughness: 0.85 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x762d2d, roughness: 0.76 }),
  occupied: new THREE.MeshStandardMaterial({ color: 0x29262c, roughness: 0.9 }),
  selected: new THREE.MeshStandardMaterial({ color: 0xd95849, emissive: 0x4f100d, emissiveIntensity: 0.75, roughness: 0.62 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x6d5944, roughness: 0.42, metalness: 0.62 }),
  screen: new THREE.MeshBasicMaterial({ color: 0xe8dfd1 }),
};

const box = (w, h, d, material, x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = material !== materials.wall;
  scene.add(mesh);
  return mesh;
};

// Auditorium shell, stepped floor and softly glowing screen.
box(23, 0.25, 26, materials.floor, 0, -0.2, 2.5);
box(0.3, 8, 26, materials.wall, -11.45, 3.7, 2.5);
box(0.3, 8, 26, materials.wall, 11.45, 3.7, 2.5);
box(23, 8, 0.3, materials.wall, 0, 3.7, 15.45);
for (let row = 0; row < 9; row++) box(21, 0.2 + row * 0.18, 1.48, materials.step, 0, -0.04 + row * 0.09, -3.3 + row * 1.48);
box(15.8, 6.5, 0.22, materials.wall, 0, 4.25, -9.35);
const screen = box(14.5, 5.4, 0.12, materials.screen, 0, 4.3, -9.12);
screen.castShadow = false;
box(16.4, 0.15, 0.55, materials.metal, 0, 1.45, -9.02);

// Curtains and aisle guide lights.
for (const x of [-8.5, 8.5]) {
  box(1.8, 7.2, 0.35, materials.seat, x, 4, -9.05);
  for (let row = 0; row < 9; row++) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf0a952 }));
    lamp.position.set(x > 0 ? 10.25 : -10.25, 0.15 + row * 0.18, -3.2 + row * 1.48);
    scene.add(lamp);
  }
}

scene.add(new THREE.HemisphereLight(0x8a7fa5, 0x170b09, 1.15));
const key = new THREE.SpotLight(0xffd7a3, 90, 34, Math.PI / 5, 0.72, 2);
key.position.set(0, 10, 7);
key.target.position.set(0, 1, -4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.bias = -0.0004;
scene.add(key, key.target);
for (const x of [-7, 0, 7]) {
  const light = new THREE.PointLight(0xd8975f, 12, 9, 2);
  light.position.set(x, 5.8, 3.5);
  scene.add(light);
}

const seatData = makeSeats();
const seatGroups = new Map();
const clickableMeshes = [];
const cushionGeometry = roundedBoxGeometry(0.92, 0.27, 0.82, 0.11);
const backGeometry = roundedBoxGeometry(0.98, 1.18, 0.25, 0.12);
const armGeometry = roundedBoxGeometry(0.13, 0.38, 0.68, 0.06);

function createSeat(data) {
  const group = new THREE.Group();
  group.position.set(data.x, data.y, data.z);
  group.rotation.y = -data.x * 0.013;
  group.userData = data;
  const material = data.occupied ? materials.occupied : materials.seat;
  const parts = [
    [cushionGeometry, 0, 0.55, 0.04],
    [backGeometry, 0, 1.13, 0.34],
    [armGeometry, -0.53, 0.72, 0.02],
    [armGeometry, 0.53, 0.72, 0.02],
  ];
  parts.forEach(([geometry, x, y, z]) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.seatId = data.id;
    clickableMeshes.push(mesh);
    group.add(mesh);
  });
  scene.add(group);
  seatGroups.set(data.id, group);
}
seatData.forEach(createSeat);

const map = document.querySelector("#map-grid");
for (let row = 0; row < 9; row++) {
  for (let col = 0; col < COLS; col++) {
    if (AISLES.has(col)) {
      const gap = document.createElement("span");
      map.append(gap);
      continue;
    }
    const data = seatData.find((seat) => seat.row.charCodeAt(0) - 65 === row && seat.number === col + 1);
    const button = document.createElement("button");
    button.className = `map-seat${data.occupied ? " occupied" : ""}`;
    button.dataset.seat = data.id;
    button.disabled = data.occupied;
    button.title = data.occupied ? `Seat ${data.id} is occupied` : `Preview seat ${data.id}`;
    button.setAttribute("aria-label", button.title);
    button.addEventListener("click", () => chooseSeat(data.id, true));
    map.append(button);
  }
}

let selectedId = null;
let cameraMove = null;
const selectedLabel = document.querySelector("#selected-label");
const selectedDetail = document.querySelector("#selected-detail");
const confirmButton = document.querySelector("#confirm");

function updateSeatMaterial(id, material) {
  seatGroups.get(id).children.forEach((part) => { part.material = material; });
}

function animateCamera(position, target, seatView) {
  cameraMove = {
    start: performance.now(),
    duration: 1150,
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    position,
    target,
  };
  controls.enabled = false;
  document.body.classList.toggle("seat-view", seatView);
}

function chooseSeat(id, preview) {
  const data = seatData.find((seat) => seat.id === id);
  if (!data || data.occupied) return;
  if (selectedId) {
    updateSeatMaterial(selectedId, materials.seat);
    document.querySelector(`[data-seat="${selectedId}"]`)?.classList.remove("chosen");
  }
  selectedId = id;
  updateSeatMaterial(id, materials.selected);
  document.querySelector(`[data-seat="${id}"]`)?.classList.add("chosen");
  selectedLabel.textContent = `Row ${data.row} · Seat ${data.number}`;
  selectedDetail.textContent = `Standard · Excellent ${data.number >= 5 && data.number <= 11 ? "center" : "side"} view · €14.50`;
  confirmButton.disabled = false;
  if (preview) {
    const eye = new THREE.Vector3(data.x, data.y + 1.65, data.z - 0.08);
    animateCamera(eye, new THREE.Vector3(0, 4.15, -9.5), true);
  }
}

document.querySelector("#overview").addEventListener("click", () => animateCamera(overviewPosition.clone(), overviewTarget.clone(), false));
document.querySelector("#collapse-map").addEventListener("click", (event) => {
  const panel = document.querySelector(".seat-map");
  panel.classList.toggle("minimized");
  event.currentTarget.textContent = panel.classList.contains("minimized") ? "+" : "−";
});
document.querySelector("#confirm").addEventListener("click", () => {
  const toast = document.querySelector("#toast");
  toast.textContent = `${selectedId} added to your booking`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerStart = null;
canvas.addEventListener("pointerdown", (event) => { pointerStart = [event.clientX, event.clientY]; });
canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return;
  const rect = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickableMeshes, false)[0];
  if (hit) chooseSeat(hit.object.userData.seatId, false);
});

const clock = new THREE.Clock();
function render() {
  requestAnimationFrame(render);
  const delta = Math.min(clock.getDelta(), 0.05);
  if (cameraMove) {
    const raw = Math.min((performance.now() - cameraMove.start) / cameraMove.duration, 1);
    const t = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2;
    camera.position.lerpVectors(cameraMove.fromPosition, cameraMove.position, t);
    controls.target.lerpVectors(cameraMove.fromTarget, cameraMove.target, t);
    if (raw === 1) {
      cameraMove = null;
      controls.enabled = true;
    }
  }
  controls.update(delta);
  renderer.render(scene, camera);
}
render();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
