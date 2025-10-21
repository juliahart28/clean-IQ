
export function computeScore(numUses, soap, tp) {
  let score = 100 - numUses * 10;
  let message = null;

  if (soap === "empty" || tp === "empty") {
    score = 0;
    message = "Supplies Empty";
  } else {
    if (soap === "low") message = "Soap Low";
    if (tp === "low")
      message = message ? message + " & TP Low" : "Toilet Paper Low";
    if (message) score -= 20;
  }

  let category =
    score >= 50
      ? "Clean"
      : score >= 20
      ? "Needs Attention"
      : "Urgent";

  return { score, category, message };
}

