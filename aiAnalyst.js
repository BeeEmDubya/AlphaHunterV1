import {
  escapeHtml,
  formatCompactCurrency
} from "./helpers.js";

export function buildAnalystSummary(opportunity) {
  const masterScore =
    clampScore(opportunity.scores?.master);

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

  const action =
    normalizeAction(
      opportunity.recommendation,
      masterScore
    );

  const confidence =
    calculateConfidence(
      masterScore,
      reasons,
      warnings
    );

  const summaryParts = [];

  if (purchaseValue > 0) {
    const purchaseStrength =
      purchaseValue >= 500000
        ? "substantial"
        : purchaseValue >= 100000
          ? "meaningful"
          : "reported";

    summaryParts.push(
      `${purchaseStrength[0].toUpperCase()}${purchaseStrength.slice(1)} insider buying of approximately ${formatCompactCurrency(
        purchaseValue
      )} was detected.`
    );
  }

  const movingAverageCount =
    reasons.filter(reason =>
      String(reason)
        .toLowerCase()
        .includes("moving average")
    ).length;

  if (movingAverageCount >= 3) {
    summaryParts.push(
      "Price remains above the 20, 50 and 200-day moving averages, showing broad technical alignment."
    );
  } else if (movingAverageCount >= 2) {
    summaryParts.push(
      "Price remains above multiple major moving averages."
    );
  } else if (movingAverageCount === 1) {
    summaryParts.push(
      "At least one major moving average is supporting the setup."
    );
  }

  if (warnings.length) {
    summaryParts.push(
      `${sentenceCase(warnings[0])}.`
    );
  }

  if (!summaryParts.length) {
    summaryParts.push(
      "AlphaHunter found a developing setup, but the available evidence remains limited."
    );
  }

  return {
    action,
    actionClass: getActionClass(action),
    confidence,
    confidenceClass:
      getConfidenceClass(confidence),
    summary: summaryParts.join(" "),
    takeaway: buildTakeaway(
      action,
      warnings,
      movingAverageCount
    ),
    bullCase: reasons.slice(0, 4),
    bearCase:
      warnings.length
        ? warnings.slice(0, 4)
        : buildFallbackBearCase(
            action,
            masterScore
          )
  };
}

export function renderAnalystPanel(analysis) {
  const bullCaseHtml =
    analysis.bullCase.length
      ? analysis.bullCase
          .map(item => `
            <li>
              <span class="signalIcon positive">
                ✓
              </span>
              <span>${escapeHtml(item)}</span>
            </li>
          `)
          .join("")
      : `
        <li>
          <span class="signalIcon neutralSignal">
            •
          </span>
          <span>No strong bullish confirmation yet.</span>
        </li>
      `;

  const bearCaseHtml =
    analysis.bearCase
      .map(item => `
        <li>
          <span class="signalIcon negative">
            !
          </span>
          <span>${escapeHtml(item)}</span>
        </li>
      `)
      .join("");

  return `
    <section
      class="analystPanel ${analysis.actionClass}"
      aria-label="AlphaHunter AI analyst"
    >
      <div class="analystHeader">
        <div>
          <div class="analystEyebrow">
            <span class="analystRobot">✦</span>
            AlphaHunter Analyst
          </div>

          <div class="analystQuestion">
            What should I do?
          </div>
        </div>

        <span class="analystAction">
          ${escapeHtml(analysis.action)}
        </span>
      </div>

      <div class="confidenceBlock">
        <div class="confidenceTop">
          <span>Decision Confidence</span>
          <strong>${analysis.confidence}%</strong>
        </div>

        <div
          class="confidenceTrack"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${analysis.confidence}"
        >
          <div
            class="confidenceFill ${analysis.confidenceClass}"
            style="width:${analysis.confidence}%"
          ></div>
        </div>
      </div>

      <div class="analystSummary">
        <div class="analystLabel">
          Analyst Summary
        </div>

        <p>
          ${escapeHtml(analysis.summary)}
        </p>
      </div>

      <div class="analystTakeaway">
        <span>Best action now</span>
        <strong>
          ${escapeHtml(analysis.takeaway)}
        </strong>
      </div>

      <div class="analystDebate">
        <div class="debateColumn bullCase">
          <div class="debateTitle">
            Bull Case
          </div>

          <ul>
            ${bullCaseHtml}
          </ul>
        </div>

        <div class="debateColumn bearCase">
          <div class="debateTitle">
            Why Not?
          </div>

          <ul>
            ${bearCaseHtml}
          </ul>
        </div>
      </div>

      <div class="analystDisclaimer">
        Rule-based research summary—not personalized financial advice.
      </div>
    </section>
  `;
}

function normalizeAction(
  recommendation,
  masterScore
) {
  const text =
    String(recommendation || "").toLowerCase();

  if (
    text.includes("strong buy") ||
    text === "buy" ||
    masterScore >= 75
  ) {
    return "BUY";
  }

  if (
    text.includes("avoid") ||
    text.includes("pass") ||
    masterScore < 45
  ) {
    return "PASS";
  }

  return "WAIT";
}

function calculateConfidence(
  masterScore,
  reasons,
  warnings
) {
  const evidenceBonus =
    Math.min(reasons.length, 5) * 2;

  const warningPenalty =
    Math.min(warnings.length, 4) * 3;

  return clampScore(
    masterScore +
    evidenceBonus -
    warningPenalty
  );
}

function buildTakeaway(
  action,
  warnings,
  movingAverageCount
) {
  if (action === "BUY") {
    return warnings.length
      ? "The setup is favorable, but review the listed risks before acting."
      : "Technical alignment and insider activity support further research.";
  }

  if (action === "PASS") {
    return "The current evidence does not justify taking a position.";
  }

  if (warnings.length) {
    return "Wait for the primary warning to improve before considering an entry.";
  }

  if (movingAverageCount >= 2) {
    return "Keep it on watch and wait for stronger confirmation.";
  }

  return "Continue monitoring while the setup develops.";
}

function buildFallbackBearCase(
  action,
  masterScore
) {
  if (action === "BUY") {
    return [
      "No major warning was reported, but every trade can still fail."
    ];
  }

  if (masterScore < 60) {
    return [
      "Decision score remains below the stronger-conviction range."
    ];
  }

  return [
    "The setup still needs additional confirmation."
  ];
}

function getActionClass(action) {
  if (action === "BUY") {
    return "analystBuy";
  }

  if (action === "PASS") {
    return "analystPass";
  }

  return "analystWait";
}

function getConfidenceClass(confidence) {
  if (confidence >= 75) {
    return "confidenceHigh";
  }

  if (confidence >= 50) {
    return "confidenceMedium";
  }

  return "confidenceLow";
}

function clampScore(value) {
  const number = Number(value) || 0;

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
}

function sentenceCase(value) {
  const text =
    String(value || "")
      .trim()
      .replace(/[.]+$/, "");

  if (!text) {
    return "A risk flag is present";
  }

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}
