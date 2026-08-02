import test from "node:test";
import assert from "node:assert/strict";
import { isPortfolioUv, ticketDisplacement } from "./ticket.js";

test("ticket fold follows the pointer without producing invalid geometry", () => {
  const idle = ticketDisplacement(0.6, 0.2, 0, 0, 1, 0);
  const folded = ticketDisplacement(0.6, 0.2, 0, 0, 1, 1);
  assert.ok(Number.isFinite(folded));
  assert.ok(Math.abs(folded - idle) > 0.05);
});

test("only the janjs.dev texture region is a portfolio link", () => {
  assert.equal(isPortfolioUv({ x: 0.35, y: 0.5 }), true);
  assert.equal(isPortfolioUv({ x: 0.15, y: 0.5 }), false);
  assert.equal(isPortfolioUv({ x: 0.35, y: 0.8 }), false);
});
