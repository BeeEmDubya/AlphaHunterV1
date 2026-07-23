import {
  formatCompactCurrency
} from "./helpers.js";

export function buildAnalystSummary(opportunity) {
  const masterScore =
    Number(opportunity.scores?.master) || 0;

  const purchaseValue =
    Number(
      opportunity.insiderActivity?.totalPurchaseValue
    ) || 0;

  const reasons =
    Array.isArray(opportunity.reasons)
      ? opportunity.reasons
      : [];

  const warnings =
    Array.isArray(opportunity.warnings)
      ? opportunity.warnings
      : [];

  const recommendation =
    normalizeAction(
      opportunity.recommendation,
      masterScore
    );

  const confidence =
    Math.max(0, Math.min(100, masterScore));

  const summaryParts = [];

  if (purchaseValue > 0) {
    summaryParts.push(
      `Insiders reported approximately ${formatCompactCurrency(
        purchaseValue
      )} in open-market purchases.`
    );
  }

  const movingAverageReasons =
    reasons.filter(reason =>
      String(reason)
        .toLowerCase()
        .includes("moving average")
    );

  if (movingAverageReasons.length >= 2) {
    summaryParts.push(
      "Price remains above multiple major moving averages."
    );
  }

  if (warnings.length) {
    summaryParts.push(
      String(warnings[0]).replace(/[.]+$/, "") + "."
    );
  }

  if (!summaryParts.length) {
    summaryParts.push(
      "AlphaHunter found a developing setup that requires additional research."
    );
  }

  return {
    action: recommendation,
    confidence,
    summary: summaryParts.join(" "),
    takeaway: buildTakeaway(
      recommendation,
      warnings
    )
  };
}

function normalizeAction(
  recommendation,
  masterScore
) {
  const text =
    String(recommendation || "").toLowerCase();

  if (
    text.includes("buy") ||
    masterScore >= 75
  ) {
    return "BUY";
  }

  if (
    text.includes("avoid") ||
    text.includes("no action") ||
    masterScore < 45
  ) {
    return "PASS";
  }

  return "WAIT";
}

function buildTakeaway(
  action,
  warnings
) {
  if (action === "BUY") {
    return warnings.length
      ? "The setup is favorable, but review the listed risk flags before acting."
      : "Insider activity and technical conditions are aligned.";
  }

  if (action === "PASS") {
    return "Current evidence is not strong enough to justify a trade.";
  }

  return warnings.length
    ? "Wait for the main warning to improve before considering an entry."
    : "Keep it on watch while waiting for stronger confirmation.";
}
