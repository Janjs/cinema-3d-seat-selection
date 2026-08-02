import * as THREE from "three";
import { SEAT_PITCH } from "./layout.js";

const CINEMA_SEAT_PITCH_METERS = 0.8;
const IMAX_SCREEN_WIDTH_METERS = 22;

export const IMAX_SCREEN_WIDTH = IMAX_SCREEN_WIDTH_METERS * SEAT_PITCH / CINEMA_SEAT_PITCH_METERS;
export const IMAX_SCREEN_HEIGHT = IMAX_SCREEN_WIDTH / 1.43;

export function createCinemaScreen(screenTexture) {
  const material = new THREE.MeshBasicMaterial({
    map: screenTexture,
    color: 0xd8d8d8,
    toneMapped: true,
    fog: false,
  });

  return new THREE.Mesh(
    new THREE.PlaneGeometry(IMAX_SCREEN_WIDTH, IMAX_SCREEN_HEIGHT),
    material,
  );
}
