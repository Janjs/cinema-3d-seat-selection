import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { roundedBoxGeometry } from "./roundedBox.js";
import { AISLES, COLS, ROWS, makeSeats } from "./layout.js";

const canvas = document.querySelector("#cinema");
const sceneLoader = document.querySelector(".scene-loader");
const setLoadProgress = (progress, label) => {
  sceneLoader.style.setProperty("--scene-progress", `${progress}%`);
  sceneLoader.setAttribute("aria-valuenow", progress);
  sceneLoader.querySelector("span").textContent = label;
};
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 18, 42);
scene.position.x = 2.4;

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 80);
const mobileSeatMapQuery = window.matchMedia("(max-width: 720px)");

function isMobileLayout() {
  return mobileSeatMapQuery.matches;
}

const overviewPosition = new THREE.Vector3(8.1, 10.4, 17.2);
const overviewTarget = new THREE.Vector3(1.1, 1.5, 0.2);
const mobileOverviewTarget = new THREE.Vector3(1.1, 2.6, 0.2);

function getOverviewPosition() {
  return overviewPosition.clone();
}

function getOverviewTarget() {
  return (isMobileLayout() ? mobileOverviewTarget : overviewTarget).clone();
}

camera.position.copy(getOverviewPosition());

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
const overviewMaxPolarAngle = Math.PI * 0.49;
const seatViewMaxPolarAngle = Math.PI * 0.62;
controls.target.copy(getOverviewTarget());
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 2;
controls.maxDistance = 31;
controls.maxPolarAngle = overviewMaxPolarAngle;
controls.minPolarAngle = Math.PI * 0.08;

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x242027, roughness: 0.92 }),
  step: new THREE.MeshStandardMaterial({ color: 0x302a31, roughness: 0.85 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x762d2d, roughness: 0.76 }),
  hover: new THREE.MeshStandardMaterial({ color: 0xb94a40, emissive: 0x3b0c09, emissiveIntensity: 0.55, roughness: 0.68 }),
  occupied: new THREE.MeshStandardMaterial({ color: 0x29262c, roughness: 0.9 }),
  selected: new THREE.MeshStandardMaterial({ color: 0xd95849, emissive: 0x4f100d, emissiveIntensity: 0.75, roughness: 0.62 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x6d5944, roughness: 0.42, metalness: 0.62 }),
  screen: new THREE.MeshBasicMaterial({ color: 0xe8dfd1 }),
};

function makeSeatMaterial(data, baseMaterial) {
  const depth = data.row.charCodeAt(0) - 65;
  const frontFactor = 1 - depth / (ROWS - 1);
  const material = baseMaterial.clone();
  material.color = baseMaterial.color.clone().multiplyScalar(0.82 + frontFactor * 0.3);
  material.emissive = new THREE.Color(0x2a0f0c);
  material.emissiveIntensity = (baseMaterial.emissiveIntensity ?? 0.12) * (0.55 + frontFactor * 0.45);
  material.roughness = baseMaterial.roughness;
  return material;
}

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
const screenGlow = new THREE.SpotLight(0xffe4bf, 28, 42, Math.PI / 3.2, 0.82, 1.4);
screenGlow.position.set(0, 4.2, -8.7);
screenGlow.target.position.set(0, 1.25, 3.6);
scene.add(screenGlow, screenGlow.target);
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
  const litMaterial = data.occupied ? makeSeatMaterial(data, materials.occupied) : makeSeatMaterial(data, materials.seat);
  const hoverMaterial = makeSeatMaterial(data, materials.hover);
  const selectedMaterial = makeSeatMaterial(data, materials.selected);
  group.userData.materials = {
    base: litMaterial,
    hover: hoverMaterial,
    selected: selectedMaterial,
    occupied: makeSeatMaterial(data, materials.occupied),
  };
  const parts = [
    [cushionGeometry, 0, 0.55, 0.04],
    [backGeometry, 0, 1.13, 0.34],
    [armGeometry, -0.53, 0.72, 0.02],
    [armGeometry, 0.53, 0.72, 0.02],
  ];
  parts.forEach(([geometry, x, y, z]) => {
    const mesh = new THREE.Mesh(geometry, group.userData.materials.base);
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
setLoadProgress(55, "Building the seating");

const map = document.querySelector("#map-grid");
const mapShell = document.querySelector(".map-shell");
const seatMap = document.querySelector(".seat-map");
const collapseMapButton = document.querySelector("#collapse-map");
const confirmCollapsedButton = document.querySelector("#confirm-collapsed");

function setMapCollapsed(collapsed) {
  mapShell.classList.toggle("collapsed", collapsed);
  seatMap.setAttribute("aria-hidden", String(collapsed));
  collapseMapButton.textContent = collapsed ? collapseMapButton.dataset.preview || "Select a seat" : "−";
  collapseMapButton.setAttribute("aria-label", collapsed ? "Show seat map" : "Minimize seat map");
  const showChipReserve = collapsed && mapShell.classList.contains("has-selection");
  confirmCollapsedButton.setAttribute("aria-hidden", String(!showChipReserve));
}

function reserveSeat() {
  const toast = document.querySelector("#toast");
  toast.textContent = `${selectedId} added to your booking`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

if (isMobileLayout()) setMapCollapsed(true);

for (let row = 8; row >= 0; row--) {
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
const seatPreviewEyeHeight = 1.95;
const selectedRow = document.querySelector("#selected-row");
const selectedSeat = document.querySelector("#selected-seat");
const selectedDetail = document.querySelector("#selected-detail");
const confirmButton = document.querySelector("#confirm");
const bookingCard = document.querySelector(".booking-card");

function updateSeatMaterial(id, material) {
  seatGroups.get(id).children.forEach((part) => { part.material = material; });
}

function animateCamera(position, target, seatView) {
  controls.maxPolarAngle = seatView ? seatViewMaxPolarAngle : overviewMaxPolarAngle;
  controls.minDistance = seatView ? 0.01 : 2;
  cameraMove = {
    start: performance.now(),
    duration: 1800,
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
    updateSeatMaterial(selectedId, seatGroups.get(selectedId).userData.materials.base);
    document.querySelector(`[data-seat="${selectedId}"]`)?.classList.remove("chosen");
  }
  selectedId = id;
  updateSeatMaterial(id, seatGroups.get(id).userData.materials.selected);
  document.querySelector(`[data-seat="${id}"]`)?.classList.add("chosen");
  selectedRow.textContent = `Row ${data.row}`;
  selectedSeat.textContent = `Seat ${data.number}`;
  collapseMapButton.dataset.preview = `Row ${data.row} · Seat ${data.number}`;
  mapShell.classList.add("has-selection");
  if (mapShell.classList.contains("collapsed")) collapseMapButton.textContent = collapseMapButton.dataset.preview;
  selectedDetail.textContent = `Standard · Excellent ${data.number >= 5 && data.number <= 11 ? "center" : "side"} view · €14.50`;
  confirmButton.disabled = false;
  confirmCollapsedButton.disabled = false;
  bookingCard.classList.add("visible");
  bookingCard.setAttribute("aria-hidden", "false");
  if (mapShell.classList.contains("collapsed")) confirmCollapsedButton.setAttribute("aria-hidden", "false");
  if (preview) {
    const eye = seatGroups.get(id).localToWorld(new THREE.Vector3(0, seatPreviewEyeHeight, -0.08));
    const target = scene.localToWorld(new THREE.Vector3(0, 4.15, -9.5)).sub(eye).setLength(0.01).add(eye);
    animateCamera(eye, target, true);
  }
}

document.querySelector("#overview").addEventListener("click", () => animateCamera(getOverviewPosition(), getOverviewTarget(), false));
collapseMapButton.addEventListener("click", () => {
  setMapCollapsed(!mapShell.classList.contains("collapsed"));
});
document.querySelector("#confirm").addEventListener("click", reserveSeat);
confirmCollapsedButton.addEventListener("click", reserveSeat);

document.addEventListener("pointerdown", (event) => {
  if (!isMobileLayout() || mapShell.classList.contains("collapsed")) return;
  if (mapShell.contains(event.target) || collapseMapButton.contains(event.target)) return;
  setMapCollapsed(true);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerStart = null;
let hoveredId = null;
function seatAtPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickableMeshes, false)[0];
  return hit && !seatGroups.get(hit.object.userData.seatId).userData.occupied ? hit.object.userData.seatId : null;
}
function hoverSeat(id) {
  if (hoveredId && hoveredId !== selectedId) updateSeatMaterial(hoveredId, seatGroups.get(hoveredId).userData.materials.base);
  hoveredId = id;
  if (id && id !== selectedId) updateSeatMaterial(id, seatGroups.get(id).userData.materials.hover);
  canvas.classList.toggle("seat-hover", Boolean(id));
}
canvas.addEventListener("pointerdown", (event) => { pointerStart = [event.clientX, event.clientY]; });
canvas.addEventListener("pointermove", (event) => hoverSeat(seatAtPointer(event)));
canvas.addEventListener("pointerleave", () => hoverSeat(null));
canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return;
  const id = seatAtPointer(event);
  if (id) chooseSeat(id, true);
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
      camera.position.copy(cameraMove.position);
      controls.target.copy(cameraMove.target);
      controls.update();
      cameraMove = null;
      controls.enabled = true;
    }
  }
  controls.update(delta);
  renderer.render(scene, camera);
}
render();

async function revealInterface() {
  setLoadProgress(78, "Lighting the auditorium");
  await Promise.all([
    renderer.compileAsync(scene, camera),
    new Promise((resolve) => setTimeout(resolve, 900)),
  ]);
  setLoadProgress(100, "Ready");
  await new Promise((resolve) => setTimeout(resolve, 250));
  document.body.classList.add("scene-ready");
}
revealInterface();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  if (!document.body.classList.contains("seat-view") && !cameraMove) {
    camera.position.copy(getOverviewPosition());
    controls.target.copy(getOverviewTarget());
    controls.update();
  }
});
