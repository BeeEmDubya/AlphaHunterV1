export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatCurrency(value, decimals = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCompactCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
}

export function formatNumber(value, decimals = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(decimals);
}

export function getRecommendationClass(recommendation) {
  const text = String(recommendation || "").toLowerCase();

  if (
    text.includes("strong") ||
    text.includes("buy")
  ) {
    return "bull";
  }

  if (
    text.includes("no action") ||
    text.includes("avoid")
  ) {
    return "bear";
  }

  if (
    text.includes("watch") ||
    text.includes("wait")
  ) {
    return "watch";
  }

  return "neutral";
}

export function getRiskClass(classification) {
  const normalized = String(classification || "")
    .toLowerCase()
    .replaceAll(" ", "");

  if (normalized === "controlled") {
    return "riskControlled";
  }

  if (normalized === "moderate") {
    return "riskModerate";
  }

  if (normalized === "elevated") {
    return "riskElevated";
  }

  return "riskExcessive";
}
