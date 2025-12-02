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

function deriveUsesFromDoor(bathroom) {
  const rawDoorEvents = Number(bathroom?.doorOpenEvents);
  if (Number.isFinite(rawDoorEvents) && rawDoorEvents >= 0) {
    return Math.floor(rawDoorEvents / 2);
  }

  const fallbackUses = Number(bathroom?.numUses);
  if (Number.isFinite(fallbackUses) && fallbackUses >= 0) {
    return Math.floor(fallbackUses);
  }

  return 0;
}

function computeSingleOrAccessibleScore(bathroom) {
  let score = 100;
  const alerts = [];

  const uses = deriveUsesFromDoor(bathroom);
  if (uses > 0) {
    score -= uses * 10;
  }

  ({ score } = evaluateConsumables(score, alerts, bathroom?.soapLevel, bathroom?.toiletPaperLevel));

  return finalizeScore(score, alerts);
}

function parseNonNegativeInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(0, Math.floor(number));
}

function clampCount(value, max) {
  const parsed = parseNonNegativeInteger(value);
  if (!Number.isFinite(max)) {
    return parsed;
  }
  const ceiling = Math.max(0, Math.floor(max));
  return Math.min(parsed, ceiling);
}

function computeMultiStallScore(bathroom) {
  const alerts = [];

  const uses = deriveUsesFromDoor(bathroom);

  const paperDispensers = Array.isArray(bathroom?.paperDispensers)
    ? bathroom.paperDispensers
    : [];
  const soapDispensers = Array.isArray(bathroom?.soapDispensers)
    ? bathroom.soapDispensers
    : [];

  const rawStalls = Number(bathroom?.stalls);
  const stallsFromCounts = Number.isFinite(rawStalls) && rawStalls >= 1 ? Math.floor(rawStalls) : 0;
  const stalls = Math.max(1, stallsFromCounts, paperDispensers.length);

  const reportedLowPaper = parseNonNegativeInteger(bathroom?.lowPaperStalls);
  const reportedNoPaper = parseNonNegativeInteger(bathroom?.noPaperStalls);
  const hasPaperDetails = paperDispensers.length > 0;
  const lowPaperStalls = hasPaperDetails
    ? paperDispensers.filter(dispenser => normalizeLevel(dispenser?.level) === "low").length
    : clampCount(reportedLowPaper, stalls);
  const remainingPaperCapacity = Math.max(0, stalls - lowPaperStalls);
  const noPaperStalls = hasPaperDetails
    ? paperDispensers.filter(dispenser => normalizeLevel(dispenser?.level) === "empty").length
    : Math.min(reportedNoPaper, remainingPaperCapacity);

  if (lowPaperStalls > 0) {
    alerts.push(
      `${lowPaperStalls} stall${lowPaperStalls === 1 ? "" : "s"} low on paper`
    );
  }

  if (noPaperStalls > 0) {
    alerts.push(
      `${noPaperStalls} stall${noPaperStalls === 1 ? "" : "s"} out of paper`
    );
  }

  const reportedLowSoap = parseNonNegativeInteger(bathroom?.lowSoapDispensers);
  const reportedNoSoap = parseNonNegativeInteger(bathroom?.noSoapDispensers);
  const soapCeiling = soapDispensers.length > 0
    ? soapDispensers.length
    : parseNonNegativeInteger(bathroom?.soapDispensers) || reportedLowSoap + reportedNoSoap;
  const hasSoapDetails = soapDispensers.length > 0;
  const lowSoapDispensers = hasSoapDetails
    ? soapDispensers.filter(dispenser => normalizeLevel(dispenser?.level) === "low").length
    : clampCount(reportedLowSoap, soapCeiling);
  const remainingSoapCapacity = Math.max(0, soapCeiling - lowSoapDispensers);
  const noSoapDispensers = hasSoapDetails
    ? soapDispensers.filter(dispenser => normalizeLevel(dispenser?.level) === "empty").length
    : Math.min(reportedNoSoap, remainingSoapCapacity);

  if (lowSoapDispensers > 0) {
    alerts.push(
      `${lowSoapDispensers} soap dispenser${lowSoapDispensers === 1 ? "" : "s"} low`
    );
  }

  if (noSoapDispensers > 0) {
    alerts.push(
      `${noSoapDispensers} soap dispenser${noSoapDispensers === 1 ? "" : "s"} empty`
    );
  }

  let score = 100;
  if (stalls > 0) {
    score -= (5 * uses) / stalls;
    score -= (10 * lowPaperStalls) / stalls;
    score -= (25 * noPaperStalls) / stalls;
  }

  score -= 10 * lowSoapDispensers;
  score -= 25 * noSoapDispensers;

  return finalizeScore(score, alerts);
}

export function computeScore(bathroom) {
  const type = bathroom?.type || "multi-stall";

  if (type === "single-stall" || type === "accessible" || type === "family") {
    return computeSingleOrAccessibleScore(bathroom);
  }

  return computeMultiStallScore(bathroom);
}

export function mapScoreToCategory(score) {
  return finalizeScore(score, []).category;
}

