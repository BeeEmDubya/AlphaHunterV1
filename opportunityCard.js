import {
  escapeHtml,
  formatCurrency,
  formatCompactCurrency,
  formatNumber,
  getRecommendationClass,
  getRiskClass
} from "./helpers.js";

import {
  buildAnalystSummary,
  renderAnalystPanel
} from "./aiAnalyst.js";

export function renderOpportunityCard(opportunity) {
  const ticker =
    escapeHtml(
      opportunity.ticker ||
      "Unknown"
    );

  const company =
    escapeHtml(
      opportunity.company ||
      "Company name unavailable"
    );

  const recommendation =
    escapeHtml(
      opportunity.recommendation ||
      "Research"
    );

  const recommendationClass =
    getRecommendationClass(
      opportunity.recommendation
    );

  const masterScore =
    Number(
      opportunity.scores?.master
    ) || 0;

  const insiderScore =
    Number(
      opportunity.scores?.insider
    ) || 0;

  const technicalScore =
    Number(
      opportunity.scores?.technical
    ) || 0;

  const plan =
    opportunity.tradePlan || {};

  const entry =
    plan.entry || {};

  const risk =
    plan.risk || {};

  const targets =
    Array.isArray(plan.targets)
      ? plan.targets
      : [];

  const reasons =
    Array.isArray(opportunity.reasons)
      ? opportunity.reasons
      : [];

  const warnings =
    Array.isArray(opportunity.warnings)
      ? opportunity.warnings
      : [];

  const owners =
    Array.isArray(
      opportunity.insiderActivity?.owners
    )
      ? opportunity.insiderActivity.owners
      : [];

  const riskClass =
    getRiskClass(
      risk.classification
    );

  const reasonsHtml =
    reasons.length
      ? `
        <div class="sectionTitle">
          Why AlphaHunter Found It
        </div>

        <ul class="why">
          ${reasons
            .slice(0, 8)
            .map(reason =>
              `<li>${escapeHtml(reason)}</li>`
            )
            .join("")}
        </ul>
      `
      : "";

  const warningsHtml =
    warnings.length
      ? `
        <div class="warningBox">
          <strong>Risk Flags</strong>

          <ul>
            ${warnings
              .map(warning =>
                `<li>${escapeHtml(warning)}</li>`
              )
              .join("")}
          </ul>
        </div>
      `
      : "";

  const targetsHtml =
    [0, 1, 2]
      .map(index => {
        const target =
          targets[index];

        return `
          <div class="box">
            <span>
              Target ${index + 1}
            </span>

            <b>
              ${
                target
                  ? formatCurrency(target.price)
                  : "—"
              }
            </b>

            <span>
              ${
                target?.rewardRisk
                  ? `${formatNumber(target.rewardRisk)}R`
                  : ""
              }
            </span>
          </div>
        `;
      })
      .join("");

  const ownerText =
    owners.length
      ? owners
          .map(owner =>
            owner.name ||
            owner.role
          )
          .filter(Boolean)
          .join(", ")
      : "Owner details unavailable";

  const chartSymbol =
    encodeURIComponent(
      opportunity.ticker || ""
    );

  const analyst =
    buildAnalystSummary(opportunity);

  const analystPanelHtml =
    renderAnalystPanel(analyst);

  return `
    <div
      class="card opportunityCard"
      id="opportunity-${chartSymbol}"
    >
      <div class="top">
        <div>
          <div class="ticker">
            ${ticker}
          </div>

          <div class="name">
            ${company}
          </div>
        </div>

        <span class="badge ${recommendationClass}">
          ${recommendation}
        </span>
      </div>

      ${analystPanelHtml}

      <div class="scoreLine">
        <div class="score">
          ${masterScore}
        </div>

        <div class="scoreSuffix">
          Master Score
        </div>
      </div>

      <div class="scoreBreakdown">
        <div class="scoreBox">
          <span>Insider Score</span>
          <b>${insiderScore}</b>
        </div>

        <div class="scoreBox">
          <span>Technical Score</span>
          <b>${technicalScore}</b>
        </div>
      </div>

      <div class="metaRow">
        <span class="metaItem">
          Price:
          ${formatCurrency(
            opportunity.market?.latestPrice
          )}
        </span>

        <span class="metaItem">
          Trend:
          ${escapeHtml(
            opportunity.market?.trend ||
            "Unknown"
          )}
        </span>

        <span class="metaItem">
          Confidence:
          ${escapeHtml(
            opportunity.confidence ||
            "Unknown"
          )}
        </span>
      </div>

      <div class="sectionTitle">
        Trade Plan
      </div>

      <div class="tradeGrid">
        <div class="box">
          <span>Entry Zone</span>

          <b>
            ${
              Number.isFinite(
                Number(entry.zoneLow)
              )
                ? `${formatCurrency(entry.zoneLow)}–${formatCurrency(entry.zoneHigh)}`
                : "Unavailable"
            }
          </b>
        </div>

        <div class="box">
          <span>Planned Entry</span>

          <b>
            ${formatCurrency(
              entry.plannedEntry
            )}
          </b>
        </div>

        <div class="box">
          <span>Stop</span>

          <b class="red">
            ${formatCurrency(
              risk.stop
            )}
          </b>
        </div>

        <div class="box">
          <span>Risk</span>

          <b class="${riskClass}">
            ${formatNumber(
              risk.riskPercent
            )}%
          </b>

          <span>
            ${escapeHtml(
              risk.classification ||
              "Unknown"
            )}
          </span>
        </div>
      </div>

      <div class="collapsedSummary">
        Tap below to view targets, insider details, reasons, warnings and actions.
      </div>

      <button
        class="cardSummaryButton"
        onclick="toggleOpportunityDetails('${chartSymbol}', this)"
        aria-expanded="false"
      >
        <span>View Details</span>
        <span class="expandIcon">⌄</span>
      </button>

      <div class="opportunityDetails">
        <div class="opportunityDetailsInner">
          <div class="sectionTitle">
            Profit Targets
          </div>

          <div class="targetGrid">
            ${targetsHtml}
          </div>

          <div class="insiderBox">
            <strong>
              Insider Activity
            </strong>

            <div class="small">
              ${
                opportunity.insiderActivity
                  ?.purchaseCount || 0
              }
              purchase(s) totaling approximately
              ${formatCompactCurrency(
                opportunity.insiderActivity
                  ?.totalPurchaseValue
              )}.
            </div>

            <div class="small">
              Reported owner:
              ${escapeHtml(ownerText)}
            </div>
          </div>

          ${reasonsHtml}
          ${warningsHtml}

          <div class="btnRow">
            <button
              onclick="addWatch('${ticker}')"
            >
              Add Watch
            </button>

            <button
              onclick="quickNote('${ticker}')"
            >
              Journal
            </button>

            <a
              class="btn"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tradingview.com/chart/?symbol=${chartSymbol}"
            >
              Chart
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

