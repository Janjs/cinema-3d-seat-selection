export const ROWS = 14;
export const COLS = 25;
export const AISLES = new Set([7, 17]);
export const SEAT_PITCH = 1.4;
export const ROW_PITCH = 1.95;
export const ROW_RISE = 0.52;
export const FIRST_ROW_Z = -0.1;
export const GROUND_WIDTH = 40;
export const GROUND_DEPTH = 44;
export const GROUND_CENTER_Z = 7;
export const GROUND_BACK_Z = GROUND_CENTER_Z - GROUND_DEPTH / 2;
export const GROUND_FRONT_Z = GROUND_CENTER_Z + GROUND_DEPTH / 2;
export const SCREEN_Z = GROUND_BACK_Z + 0.08;
export const ROW_CURVE = -0.0045;

const occupiedIds = new Set([
  "A3", "A8", "B12", "C2", "C6", "C13", "D4", "D9", "E1", "E7",
  "E14", "F5", "F11", "G3", "G12", "H7", "H14", "I2", "I9",
]);

export function makeSeats() {
  const seats = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (AISLES.has(col)) continue;
      const rowName = String.fromCharCode(65 + row);
      const number = col + 1;
      const id = `${rowName}${number}`;
      const curve = (col - (COLS - 1) / 2) ** 2 * ROW_CURVE;
      seats.push({
        id,
        row: rowName,
        number,
        occupied: occupiedIds.has(id),
        x: (col - (COLS - 1) / 2) * SEAT_PITCH,
        y: 0.25 + row * ROW_RISE,
        z: FIRST_ROW_Z + row * ROW_PITCH + curve,
      });
    }
  }
  return seats;
}
