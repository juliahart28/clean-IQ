const CATEGORY_THRESHOLDS = {
  clean: 50,
  needsAttention: 20
};

function normalizeLevel(level) {
  if (!level) {
    return "ok";
  }
  return String(level).toLowerCase();
}

function evaluateConsumables(score, alerts, soapLevel, toiletPaperLevel) {
  const soap = normalizeLevel(soapLevel);
  const paper = normalizeLevel(toiletPaperLevel);

  let nextScore = Number.isFinite(score) ? score : 0;

  if (soap === "empty" || paper === "empty") {
    if (soap === "empty") {
      alerts.push("Soap Empty");
    }
    if (paper === "empty") {
      alerts.push("Toilet Paper Empty");
    }
    nextScore = 0;
    return { score: nextScore, alerts };
  }

  if (soap === "low") {
    alerts.push("Soap Low");
    nextScore -= 20;
  }

  if (paper === "low") {
    alerts.push("Toilet Paper Low");
    nextScore -= 20;
  }

  return { score: nextScore, alerts };
}

function finalizeScore(score, alerts) {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  const rounded = Math.round(bounded);

  let category = "Clean";
  if (rounded < CATEGORY_THRESHOLDS.needsAttention) {
    category = "Urgent";
  } else if (rounded < CATEGORY_THRESHOLDS.clean) {
    category = "Needs Attention";
  }

  return { score: rounded, category, alerts };
}

function computeSingleOrAccessibleScore(bathroom) {
  let score = 100;
  const alerts = [];

  const parsedUses = Number(bathroom?.numUses);
  const uses = Number.isFinite(parsedUses) && parsedUses > 0 ? parsedUses : 0;
  if (uses > 0) {
    score -= uses * 10;
  }

  ({ score } = evaluateConsumables(score, alerts, bathroom?.soapLevel, bathroom?.toiletPaperLevel));

  return finalizeScore(score, alerts);
}

function computeMultiStallScore(bathroom) {
  const alerts = [];

  const rawDoorEvents = Number(bathroom?.doorOpenEvents);
  let uses;
  if (Number.isFinite(rawDoorEvents)) {
    uses = Math.max(0, Math.floor(rawDoorEvents / 2));
  } else {
    const fallbackUses = Number(bathroom?.numUses);
    uses = Number.isFinite(fallbackUses) ? Math.max(0, Math.floor(fallbackUses)) : 0;
  }

  const rawStalls = Number(bathroom?.stalls);
  const stalls = Number.isFinite(rawStalls) && rawStalls >= 1 ? Math.floor(rawStalls) : 1;

  const rawLowPaper = Number(bathroom?.lowPaperStalls);
  const lowPaperStalls = Number.isFinite(rawLowPaper)
    ? Math.min(stalls, Math.max(0, Math.floor(rawLowPaper)))
    : 0;

  if (lowPaperStalls > 0) {
    alerts.push(
      `${lowPaperStalls} stall${lowPaperStalls === 1 ? "" : "s"} low on paper`
    );
  }

  let score = 0;
  if (stalls > 0) {
    score = 5 * (uses / stalls) - 20 * (lowPaperStalls / stalls);
  }

  ({ score } = evaluateConsumables(score, alerts, bathroom?.soapLevel, bathroom?.toiletPaperLevel));

  return finalizeScore(score, alerts);
}

export function computeScore(bathroom) {
  const type = bathroom?.type || "multi-stall";

  if (type === "single-stall" || type === "accessible") {
    return computeSingleOrAccessibleScore(bathroom);
  }

  return computeMultiStallScore(bathroom);
}

export function mapScoreToCategory(score) {
  return finalizeScore(score, []).category;
}

