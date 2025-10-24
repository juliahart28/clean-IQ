import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBathroomInput } from "../utils/validation.js";

test("multi-stall bathrooms require a stalls value", () => {
  const invalid = validateBathroomInput({ type: "multi-stall" });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.some(message => message.includes("Stalls")));

  const valid = validateBathroomInput({ type: "multi-stall", stalls: 3 });
  assert.equal(valid.isValid, true);
});