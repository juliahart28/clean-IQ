const CATEGORY_THRESHOLDS = {
  clean: 50,
  needsAttention: 20
};

function normalizeLevel(level) {
  if (!level) return "ok";
  return String(level).toLowerCase();
}

export function computeScore(numUses, soapLevel, toiletPaperLevel) {
  let score = 100;
  const alerts = [];

  const uses = Number.isFinite(numUses) ? numUses : 0;
  if (uses > 0) {
    score -= uses * 10;
  }

const soap = normalizeLevel(soapLevel);
  const paper = normalizeLevel(toiletPaperLevel);

  if (soap === "empty" || paper === "empty") {
    if (soap === "empty") {
      alerts.push("Soap Empty");
    }
    if (paper === "empty") {
      alerts.push("Toilet Paper Empty");
    }
    score = 0;
  } else {
    if (soap === "low") {
      alerts.push("Soap Low");
      score -= 20;
    }
    if (paper === "low") {
      alerts.push("Toilet Paper Low");
      score -= 20;
    }
  }

   score = Math.max(0, score);
     let category = "Clean";
  if (score < CATEGORY_THRESHOLDS.needsAttention) {
    category = "Urgent";
  } else if (score < CATEGORY_THRESHOLDS.clean) {
    category = "Needs Attention";
  }

  return { score, category, alerts };
}

