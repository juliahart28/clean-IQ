import { computeScore } from "./scoring.js";

const CATEGORY_PRIORITY = {
  Urgent: 0,
  "Needs Attention": 1,
  Clean: 2
};

function floorPriority(bathroomFloor, currentFloor) {
  if (typeof bathroomFloor !== "number" || typeof currentFloor !== "number") {
    return Number.MAX_SAFE_INTEGER;
  }

  if (bathroomFloor === currentFloor) {
    return 0;
  }

  return Math.abs(bathroomFloor - currentFloor);
}

export function prioritizeBathrooms({ bathrooms, currentFloor }) {
  const normalizedFloor = Number.isFinite(currentFloor)
    ? currentFloor
    : Number(currentFloor);

  const decorated = bathrooms.map(bathroom => ({
    ...bathroom,
    ...computeScore(bathroom)
  }));

  const actionable = decorated.filter(bathroom => {
    if (bathroom.category !== "Clean") {
      return true;
    }
    return bathroom.alerts.length > 0;
  });

  const prioritized = actionable.sort((a, b) => {
    const categoryDiff = CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    const floorDiff =
      floorPriority(a.floorNumber, normalizedFloor) -
      floorPriority(b.floorNumber, normalizedFloor);
    if (floorDiff !== 0) {
      return floorDiff;
    }

    if (a.score !== b.score) {
      return a.score - b.score;
    }

    return Math.random() - 0.5;
  });

  return prioritized;
}
