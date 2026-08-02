import test from "node:test";
import assert from "node:assert/strict";
import { AISLES, COLS, ROWS, makeSeats } from "./layout.js";

test("seat plan has stable unique seats and clear aisles", () => {
  const seats = makeSeats();
  assert.equal(seats.length, ROWS * (COLS - AISLES.size));
  assert.equal(new Set(seats.map((seat) => seat.id)).size, seats.length);
  assert.ok(seats.every((seat) => !AISLES.has(seat.number - 1)));
});
