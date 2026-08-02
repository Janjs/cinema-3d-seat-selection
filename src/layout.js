export const ROWS = 9;
export const COLS = 15;
export const AISLES = new Set([4, 10]);

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
      const curve = (col - (COLS - 1) / 2) ** 2 * 0.018;
      seats.push({
        id,
        row: rowName,
        number,
        occupied: occupiedIds.has(id),
        x: (col - (COLS - 1) / 2) * 1.22,
        y: 0.25 + row * 0.18,
        z: -3.4 + row * 1.48 + curve,
      });
    }
  }
  return seats;
}
