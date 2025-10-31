import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScore } from "../utils/scoring.js";

test("multi-stall scoring factors in usage, paper, and soap dispensers", () => {
  const result = computeScore({
    type: "multi-stall",
    doorOpenEvents: 10,
    stalls: 4,
    lowPaperStalls: 1,
    noPaperStalls: 1,
    soapDispensers: 3,
    lowSoapDispensers: 1,
    noSoapDispensers: 0
  });

  assert.equal(result.score, 75);
  assert.equal(result.category, "Clean");
  assert.ok(result.alerts.includes("1 stall low on paper"));
  assert.ok(result.alerts.includes("1 stall out of paper"));
  assert.ok(result.alerts.includes("1 soap dispenser low"));
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