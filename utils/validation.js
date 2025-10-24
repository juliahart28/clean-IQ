export function validateBathroomInput(bathroom) {
  const errors = [];

  if (!bathroom || typeof bathroom !== "object") {
    errors.push("Bathroom payload is required");
    return { isValid: false, errors };
  }

  const type = bathroom.type || "multi-stall";

  if (type === "multi-stall") {
    const stalls = Number(bathroom.stalls);
    if (!Number.isInteger(stalls) || stalls < 1) {
      errors.push("Stalls is required for multi-stall bathrooms");
    }
  }

  return { isValid: errors.length === 0, errors };
}