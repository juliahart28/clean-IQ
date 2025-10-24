import { computeScore, mapScoreToCategory } from "./scoring.js";

export function computeBuildingAverages(bathrooms = []) {
  const byBuilding = new Map();

  for (const bathroom of bathrooms) {
    if (!bathroom || !bathroom.buildingId) {
      continue;
    }

    const existing = byBuilding.get(bathroom.buildingId) || {
      buildingId: bathroom.buildingId,
      buildingName: bathroom.buildingName || "",
      totalScore: 0,
      count: 0
    };

    if (!existing.buildingName && bathroom.buildingName) {
      existing.buildingName = bathroom.buildingName;
    }

    const scoreSource =
      typeof bathroom.score === "number" && Number.isFinite(bathroom.score)
        ? bathroom.score
        : computeScore(bathroom).score;

    existing.totalScore += Number.isFinite(scoreSource) ? scoreSource : 0;
    existing.count += 1;

    byBuilding.set(bathroom.buildingId, existing);
  }

  return Array.from(byBuilding.values()).map(entry => {
    const average = entry.count === 0 ? 0 : entry.totalScore / entry.count;
    const clampedAverage = Math.max(0, Math.min(100, average));
    const roundedAverage = Math.round(clampedAverage);

    return {
      buildingId: entry.buildingId,
      buildingName: entry.buildingName,
      averageScore: roundedAverage,
      category: mapScoreToCategory(roundedAverage)
    };
  });
}