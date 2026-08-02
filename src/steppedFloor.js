import * as THREE from "three";
import {
  COLS,
  FLOOR_TOP_Y,
  FIRST_ROW_Z,
  GROUND_BACK_Z,
  GROUND_FRONT_Z,
  GROUND_WIDTH,
  ROW_CURVE,
  ROW_PITCH,
  ROW_RISE,
  ROWS,
  SEAT_PITCH,
} from "./layout.js";

function addQuad(vertices, a, b, c, d) {
  vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
}

function rowPointAtX(x, row) {
  const column = x / SEAT_PITCH;
  const centerZ = FIRST_ROW_Z + row * ROW_PITCH;
  const curve = column ** 2 * ROW_CURVE;
  let frontZ = centerZ + curve - ROW_PITCH / 2;
  let backZ = centerZ + curve + ROW_PITCH / 2;
  if (row === 0) frontZ = GROUND_BACK_Z;
  if (row === ROWS - 1) backZ = GROUND_FRONT_Z;
  return { x, frontZ, backZ };
}

function createRowGeometry(row) {
  const vertices = [];
  const bottomY = -0.14;
  const topY = FLOOR_TOP_Y + row * ROW_RISE;
  const xCoords = [
    -GROUND_WIDTH / 2,
    ...Array.from({ length: COLS + 1 }, (_, index) => (index - COLS / 2) * SEAT_PITCH),
    GROUND_WIDTH / 2,
  ];
  const points = xCoords.map((x) => rowPointAtX(x, row));

  for (let index = 0; index < points.length - 1; index++) {
    const left = points[index];
    const right = points[index + 1];

    addQuad(
      vertices,
      [left.x, topY, left.frontZ],
      [left.x, topY, left.backZ],
      [right.x, topY, right.backZ],
      [right.x, topY, right.frontZ],
    );
    addQuad(
      vertices,
      [left.x, bottomY, left.frontZ],
      [left.x, topY, left.frontZ],
      [right.x, topY, right.frontZ],
      [right.x, bottomY, right.frontZ],
    );
    addQuad(
      vertices,
      [right.x, bottomY, right.backZ],
      [right.x, topY, right.backZ],
      [left.x, topY, left.backZ],
      [left.x, bottomY, left.backZ],
    );
  }

  const left = points[0];
  const right = points.at(-1);
  addQuad(
    vertices,
    [left.x, bottomY, left.frontZ],
    [left.x, bottomY, left.backZ],
    [left.x, topY, left.backZ],
    [left.x, topY, left.frontZ],
  );
  addQuad(
    vertices,
    [right.x, bottomY, right.backZ],
    [right.x, bottomY, right.frontZ],
    [right.x, topY, right.frontZ],
    [right.x, topY, right.backZ],
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createSteppedFloor(material) {
  const group = new THREE.Group();

  for (let row = 0; row < ROWS; row++) {
    const step = new THREE.Mesh(createRowGeometry(row), material);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }

  return group;
}
