import { test } from "node:test";
import assert from "node:assert/strict";
import { computeBuildingAverages } from "../utils/analytics.js";

test("building averages combine scores across bathrooms", () => {
  const averages = computeBuildingAverages([
    {
      buildingId: "bldg-1",
      buildingName: "Innovation Hall",
      type: "single-stall",
      numUses: 0,
      soapLevel: "ok",
      toiletPaperLevel: "ok"
    },
    {
      buildingId: "bldg-1",
      buildingName: "Innovation Hall",
      type: "multi-stall",
      doorOpenEvents: 4,
      stalls: 2,
      lowPaperStalls: 0,
      noPaperStalls: 0,
      soapDispensers: 2,
      lowSoapDispensers: 0,
      noSoapDispensers: 0
    }
  ]);

  assert.equal(averages.length, 1);
  const summary = averages[0];
  assert.equal(summary.buildingId, "bldg-1");
  assert.equal(summary.averageScore, 98);
  assert.equal(summary.category, "Clean");
});