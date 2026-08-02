import test from "node:test";
import assert from "node:assert/strict";
import { AISLES, COLS, ROWS, SCREEN_Z, makeSeats } from "./layout.js";

test("seat plan has stable unique seats and clear aisles", () => {
  const seats = makeSeats();
  assert.equal(seats.length, ROWS * (COLS - AISLES.size));
  assert.equal(new Set(seats.map((seat) => seat.id)).size, seats.length);
  assert.ok(seats.every((seat) => !AISLES.has(seat.number - 1)));
});

test("seat plan has an IMAX setback and stadium rake", () => {
  const seats = makeSeats();
  const frontRow = seats.filter((seat) => seat.row === "A");
  const backRow = seats.filter((seat) => seat.row === String.fromCharCode(64 + ROWS));

  assert.ok(Math.min(...frontRow.map((seat) => seat.z)) - SCREEN_Z > 12);
  assert.ok(Math.min(...backRow.map((seat) => seat.y)) - Math.min(...frontRow.map((seat) => seat.y)) > 6);
  assert.ok(frontRow.find((seat) => seat.number === 1).z < frontRow.find((seat) => seat.number === 13).z);
});
