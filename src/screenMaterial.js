import * as THREE from "three";
import { SEAT_PITCH } from "./layout.js";
import { createProjectionScreenMaterial, setProjectionScreenAspect } from "./screenProjection.js";

const CINEMA_SEAT_PITCH_METERS = 0.8;
const IMAX_SCREEN_WIDTH_METERS = 22;

export const IMAX_SCREEN_WIDTH = IMAX_SCREEN_WIDTH_METERS * SEAT_PITCH / CINEMA_SEAT_PITCH_METERS;
export const IMAX_SCREEN_HEIGHT = IMAX_SCREEN_WIDTH / 1.43;
export const IMAX_SCREEN_ASPECT = 1.43;

export function createCinemaScreen(screenTexture, width = IMAX_SCREEN_WIDTH, height = IMAX_SCREEN_HEIGHT) {
  const material = createProjectionScreenMaterial(screenTexture, width / height);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

export function updateCinemaScreenAspect(screen, aspect) {
  setProjectionScreenAspect(screen.material, aspect);
}
