import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { roundedBoxGeometry } from "./roundedBox.js";
import {
  AISLES,
  COLS,
  FLOOR_TOP_Y,
  FIRST_ROW_Z,
  GROUND_CENTER_Z,
  GROUND_DEPTH,
  GROUND_WIDTH,
  ROW_PITCH,
  ROW_RISE,
  ROWS,
  ROW_CURVE,
  SCREEN_Z,
  SEAT_PITCH,
  makeSeats,
} from "./layout.js";
import { createCinemaScreen, IMAX_SCREEN_HEIGHT } from "./screenMaterial.js";
import { createSteppedFloor } from "./steppedFloor.js";
import { createCameraDebug, isCameraDebugEnabled } from "./cameraDebug.js";

const canvas = document.querySelector("#cinema");
const panKeyLabel = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? "⌘" : "Ctrl";
document.querySelector("#pan-hint").textContent = `${panKeyLabel}+drag`;
const sceneLoader = document.querySelector(".scene-loader");
const setLoadProgress = (progress, label) => {
  sceneLoader.style.setProperty("--scene-progress", `${progress}%`);
  sceneLoader.setAttribute("aria-valuenow", progress);
  sceneLoader.querySelector("span").textContent = label;
};
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.position.x = 2.4;
const screenCenterY = 0.35 + IMAX_SCREEN_HEIGHT / 2;

const cameraOverview = {
  position: { x: 25.47, y: 25.78, z: 40.83 },
  target: { x: -2.96, y: 7.5, z: 1.06 },
  mobilePosition: { x: 21.91, y: 32.85, z: 47.41 },
  mobileTarget: { x: 3.82, y: 12.66, z: 8.14 },
  fov: 46,
};

const mobileSeatMapQuery = window.matchMedia("(max-width: 720px)");

function isMobileLayout() {
  return mobileSeatMapQuery.matches;
}

function getOverviewPosition() {
  const source = isMobileLayout() ? cameraOverview.mobilePosition : cameraOverview.position;
  return new THREE.Vector3(source.x, source.y, source.z);
}

function getOverviewTarget() {
  const source = isMobileLayout() ? cameraOverview.mobileTarget : cameraOverview.target;
  return new THREE.Vector3(source.x, source.y, source.z);
}

const camera = new THREE.PerspectiveCamera(cameraOverview.fov, innerWidth / innerHeight, 0.1, 120);

camera.position.copy(getOverviewPosition());

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const controls = new OrbitControls(camera, canvas);
const overviewMaxPolarAngle = Math.PI * 0.49;
const seatViewMaxPolarAngle = Math.PI * 0.62;
const overviewMinDistance = 2;
const overviewMaxDistance = 55;
const seatViewMinDistance = 0.01;
const seatViewMaxDistance = 95;
controls.target.copy(getOverviewTarget());
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = overviewMinDistance;
controls.maxDistance = overviewMaxDistance;
controls.maxPolarAngle = overviewMaxPolarAngle;
controls.minPolarAngle = Math.PI * 0.08;
controls.enablePan = true;
controls.screenSpacePanning = true;

let cameraDebug = isCameraDebugEnabled()
  ? createCameraDebug({ camera, controls, overview: cameraOverview, isMobileLayout })
  : null;

addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "d" || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (!cameraDebug) {
    cameraDebug = createCameraDebug({ camera, controls, overview: cameraOverview, isMobileLayout });
  }
  cameraDebug.toggle();
});

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0x242027, roughness: 0.92 }),
  step: new THREE.MeshStandardMaterial({ color: 0x302a31, roughness: 0.85 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x762d2d, roughness: 0.76 }),
  hover: new THREE.MeshStandardMaterial({ color: 0xb94a40, emissive: 0x3b0c09, emissiveIntensity: 0.55, roughness: 0.68 }),
  occupied: new THREE.MeshStandardMaterial({ color: 0x29262c, roughness: 0.9 }),
  selected: new THREE.MeshStandardMaterial({ color: 0xd95849, emissive: 0x4f100d, emissiveIntensity: 0.75, roughness: 0.62 }),
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
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
};

// Auditorium shell and stepped floor.
box(GROUND_WIDTH, 0.25, GROUND_DEPTH, materials.floor, 0, -0.2, GROUND_CENTER_Z);
scene.add(createSteppedFloor(materials.step));
const screenVideo = document.createElement("video");
screenVideo.src = "/trailer-imax.mp4";
screenVideo.muted = true;
screenVideo.playsInline = true;
screenVideo.preload = "auto";
screenVideo.addEventListener("ended", () => {
  screenVideo.currentTime = 5;
  screenVideo.play();
});
const screenTexture = new THREE.VideoTexture(screenVideo);
screenTexture.colorSpace = THREE.SRGBColorSpace;
screenTexture.repeat.x = (1080 * 1.43) / 1920;
screenTexture.offset.x = (1 - screenTexture.repeat.x) / 2;
const screen = createCinemaScreen(screenTexture);
screen.position.set(0, screenCenterY, SCREEN_Z);
scene.add(screen);

// Aisle and side-corridor guide lights.
const aisleLightXs = [...AISLES].map((col) => (col - (COLS - 1) / 2) * SEAT_PITCH);
const seatingHalfWidth = (COLS / 2) * SEAT_PITCH;
const sideCorridorX = seatingHalfWidth + (GROUND_WIDTH / 2 - seatingHalfWidth) / 2;
const guideLightXs = [-sideCorridorX, ...aisleLightXs, sideCorridorX];
const guideLampMaterial = new THREE.MeshBasicMaterial({ color: 0xf0a952 });

function addGuideLight(x, row, withPointLight = false) {
  const column = x / SEAT_PITCH;
  const curve = column ** 2 * ROW_CURVE;
  const y = FLOOR_TOP_Y + row * ROW_RISE + 0.12;
  const z = FIRST_ROW_Z + row * ROW_PITCH + curve + 0.5;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), guideLampMaterial);
  lamp.position.set(x, y, z);
  scene.add(lamp);
  if (withPointLight) {
    const light = new THREE.PointLight(0xffb76d, 2.4, 3.8, 2);
    light.position.set(x, y + 0.2, z);
    scene.add(light);
  }
}

for (const x of guideLightXs) {
  for (let row = 0; row < ROWS; row++) {
    addGuideLight(x, row, row % 3 === 0);
  }
}

scene.add(new THREE.HemisphereLight(0x8a7fa5, 0x170b09, 0.28));
const screenLight = new THREE.RectAreaLight(0xdde8ff, 1.03, 36.1899, 25.3076);
screenLight.position.set(0, 13.81153, -14.57);
screenLight.lookAt(0, -5, 8);
scene.add(screenLight);

const projector = new THREE.SpotLight(0xfff2df, 14, 50, 0.78, 0.72, 1.35);
projector.position.set(0, 12, 30);
projector.target.position.set(0, screenCenterY, SCREEN_Z);
scene.add(projector, projector.target);

const seatData = makeSeats();
const seatGroups = new Map();
const clickableMeshes = [];
const cushionGeometry = roundedBoxGeometry(0.92, 0.27, 0.82, 0.11);
const backGeometry = roundedBoxGeometry(0.98, 1.18, 0.25, 0.12);
const armGeometry = roundedBoxGeometry(0.13, 0.38, 0.68, 0.06);

function createSeat(data) {
  const group = new THREE.Group();
  group.position.set(data.x, data.y, data.z);
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
map.style.setProperty("--seat-columns", COLS);
const mapShell = document.querySelector(".map-shell");
const seatMap = document.querySelector(".seat-map");
const mapChip = document.querySelector(".map-chip");
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

for (let row = ROWS - 1; row >= 0; row--) {
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
  controls.minDistance = seatView ? seatViewMinDistance : overviewMinDistance;
  controls.maxDistance = seatView ? seatViewMaxDistance : overviewMaxDistance;
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
  selectedDetail.textContent = `Standard · Excellent ${Math.abs(data.number - (COLS + 1) / 2) <= 4 ? "center" : "side"} view · €14.50`;
  confirmButton.disabled = false;
  confirmCollapsedButton.disabled = false;
  bookingCard.classList.add("visible");
  bookingCard.setAttribute("aria-hidden", "false");
  if (mapShell.classList.contains("collapsed")) confirmCollapsedButton.setAttribute("aria-hidden", "false");
  if (preview) {
    const eye = seatGroups.get(id).localToWorld(new THREE.Vector3(0, seatPreviewEyeHeight, -0.08));
    const target = scene.localToWorld(new THREE.Vector3(0, screenCenterY, SCREEN_Z - 0.3)).sub(eye).setLength(0.01).add(eye);
    animateCamera(eye, target, true);
  }
}

document.querySelector("#overview").addEventListener("click", () => animateCamera(getOverviewPosition(), getOverviewTarget(), false));
mapChip.addEventListener("click", (event) => {
  if (event.target.closest(".map-chip-reserve")) return;
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
function isPanModifier(event) {
  return event.metaKey || event.ctrlKey;
}

canvas.addEventListener("pointermove", (event) => {
  if (isPanModifier(event)) {
    hoverSeat(null);
    return;
  }
  hoverSeat(seatAtPointer(event));
});
canvas.addEventListener("pointerleave", () => hoverSeat(null));
canvas.addEventListener("pointerup", (event) => {
  if (isPanModifier(event)) return;
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
  cameraDebug?.update();
  renderer.render(scene, camera);
}
render();

async function loadScreenVideo() {
  await new Promise((resolve, reject) => {
    screenVideo.addEventListener("canplay", resolve, { once: true });
    screenVideo.addEventListener("error", reject, { once: true });
    screenVideo.load();
  });
  screenVideo.currentTime = 5;
  await screenVideo.play();
}

async function revealInterface() {
  setLoadProgress(65, "Starting preview");
  await loadScreenVideo();
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
