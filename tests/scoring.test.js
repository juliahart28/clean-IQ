import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScore } from "../utils/scoring.js";

test("multi-stall scoring uses door events, stalls, and low paper", () => {
  const result = computeScore({
    type: "multi-stall",
    doorOpenEvents: 10,
    stalls: 2,
    lowPaperStalls: 1,
    soapLevel: "ok",
    toiletPaperLevel: "ok"
  });

  assert.equal(result.score, 3);
  assert.equal(result.category, "Urgent");
  assert.ok(result.alerts.includes("1 stall low on paper"));
});

test("single-stall scoring remains unchanged", () => {
  const result = computeScore({
    type: "single-stall",
    numUses: 2,
    soapLevel: "ok",
    toiletPaperLevel: "low"
  });

  assert.equal(result.score, 60);
  assert.equal(result.category, "Clean");
  assert.ok(result.alerts.includes("Toilet Paper Low"));
});