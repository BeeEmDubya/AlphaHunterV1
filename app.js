import {
  escapeHtml
} from "./helpers.js";

import {
  renderOpportunityCard
} from "./opportunityCard.js";

const API_BASE_URL =
  "https://alphahunter-backend-mqx1.onrender.com";

let opportunities = [];

let watch = JSON.parse(
  localStorage.getItem("ah_watch") ||
  '["GME","SPY","TSLA"]'
);

let notes = JSON.parse(
  localStorage.getItem("ah_notes") ||
  "[]"
);

let minScore = Number(
  localStorage.getItem("ah_minScore") ||
  75
);

let opportunityLimit = Number(
  localStorage.getItem("ah_opportunityLimit") ||
  3
);

let reviewLimit = Number(
  localStorage.getItem("ah_reviewLimit") ||
  20
);

document.getElementById("minScore").value =
  minScore;

document.getElementById("opportunityLimit").value =
  String(opportunityLimit);

document.getElementById("reviewLimit").value =
  String(reviewLimit);

function setConnectionStatus(status, text) {
  const dot =
    document.getElementById("statusDot");

  const label =
    document.getElementById("statusText");

  dot.className =
    `statusDot ${status}`;

  label.textContent =
    text;
}

function tab(id, element) {
  document
    .querySelectorAll(".tabs")
    .forEach(section =>
      section.classList.remove("active")
    );

  document
    .getElementById(id)
    .classList.add("active");

  document
    .querySelectorAll("nav button")
    .forEach(button =>
      button.classList.remove("active")
    );

  element.classList.add("active");

  renderWatch();
  renderNotes();
}

function saveLocalData() {
  localStorage.setItem(
    "ah_watch",
    JSON.stringify(watch)
  );

  localStorage.setItem(
    "ah_notes",
    JSON.stringify(notes)
  );
}

function saveSettings() {
  minScore = Number(
    document.getElementById("minScore").value
  );

  opportunityLimit = Number(
    document.getElementById("opportunityLimit").value
  );

  reviewLimit = Number(
    document.getElementById("reviewLimit").value
  );

  localStorage.setItem(
    "ah_minScore",
    String(minScore)
  );

  localStorage.setItem(
    "ah_opportunityLimit",
    String(opportunityLimit)
  );

  localStorage.setItem(
    "ah_reviewLimit",
    String(reviewLimit)
  );

  updateStats();
}

async function loadOpportunities() {
  const refreshButton =
    document.getElementById("refreshButton");

  const feedStatus =
    document.getElementById("feedStatus");

  refreshButton.disabled = true;
  refreshButton.textContent =
    "Loading...";

  setConnectionStatus(
    "loading",
    "Loading"
  );

  feedStatus.innerHTML = `
    <div class="loadingState">
      <div class="spinner"></div>
      Reviewing SEC filings and building trade plans...
      <div class="small" style="margin-top:8px">
        Render may take several seconds to wake up.
      </div>
    </div>
  `;

  document.getElementById("cards").innerHTML =
    "";

  try {
    const endpoint =
      `${API_BASE_URL}/api/opportunities` +
      `?reviewLimit=${reviewLimit}` +
      `&limit=${opportunityLimit}`;

    const response =
      await fetch(endpoint);

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.details ||
        data.error ||
        "The backend returned an error."
      );
    }

    opportunities =
      Array.isArray(data.opportunities)
        ? data.opportunities
        : [];

    feedStatus.innerHTML =
      "";

    renderCards();

    const retrievedAt =
      data.retrievedAt
        ? new Date(data.retrievedAt)
        : new Date();

    document.getElementById(
      "lastUpdated"
    ).textContent =
      `Last updated ${retrievedAt.toLocaleString()} · ` +
      `${data.filingsReviewed ?? 0} filings reviewed · ` +
      `${data.failed ?? 0} failed`;

    setConnectionStatus(
      "online",
      "Live"
    );
  } catch (error) {
    console.error(
      "Opportunity loading error:",
      error
    );

    opportunities = [];

    updateStats();

    setConnectionStatus(
      "offline",
      "Error"
    );

    feedStatus.innerHTML = `
      <div class="errorState">
        <strong>Unable to load opportunities</strong>

        <div style="margin-top:8px">
          ${escapeHtml(error.message)}
        </div>

        <div class="small" style="margin-top:10px">
          Confirm that the Render backend is live, then try again.
        </div>
      </div>
    `;
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent =
      "Refresh Opportunities";
  }
}

function renderCards() {
  const cards =
    document.getElementById("cards");

  if (!opportunities.length) {
    cards.innerHTML = `
      <div class="card">
        <div class="empty">
          No qualifying opportunities were found in the reviewed filings.
          Try increasing the SEC review limit in Settings.
        </div>
      </div>
    `;

    updateStats();
    return;
  }

  cards.innerHTML =
    opportunities
      .map(renderOpportunityCard)
      .join("");

  updateStats();
}

function toggleOpportunityDetails(
  symbol,
  button
) {
  const card =
    document.getElementById(
      `opportunity-${symbol}`
    );

  if (!card) {
    return;
  }

  const isExpanded =
    card.classList.toggle(
      "expanded"
    );

  button.setAttribute(
    "aria-expanded",
    String(isExpanded)
  );

  const label =
    button.querySelector(
      "span:first-child"
    );

  if (label) {
    label.textContent =
      isExpanded
        ? "Hide Details"
        : "View Details";
  }
}

function updateStats() {
  const highConviction =
    opportunities.filter(
      opportunity =>
        Number(
          opportunity.scores?.master
        ) >= minScore
    ).length;

  const riskFlags =
    opportunities.filter(
      opportunity =>
        Array.isArray(
          opportunity.warnings
        ) &&
        opportunity.warnings.length > 0
    ).length;

  document.getElementById(
    "opportunityCount"
  ).textContent =
    opportunities.length;

  document.getElementById(
    "highCount"
  ).textContent =
    highConviction;

  document.getElementById(
    "riskCount"
  ).textContent =
    riskFlags;
}

function addWatch(value) {
  const input =
    document.getElementById(
      "watchInput"
    );

  const ticker =
    String(
      value || input.value || ""
    )
      .trim()
      .toUpperCase();

  if (!ticker) {
    return;
  }

  if (!watch.includes(ticker)) {
    watch.push(ticker);
  }

  input.value = "";

  saveLocalData();
  renderWatch();
}

function renderWatch() {
  const element =
    document.getElementById(
      "watchItems"
    );

  if (!watch.length) {
    element.innerHTML = `
      <div class="empty">
        No watchlist tickers.
      </div>
    `;

    return;
  }

  element.innerHTML =
    watch
      .map(ticker => `
        <div class="card">
          <div class="top">
            <div class="ticker">
              ${escapeHtml(ticker)}
            </div>

            <button
              class="danger"
              onclick="removeWatch('${escapeHtml(ticker)}')"
            >
              Remove
            </button>
          </div>

          <div class="btnRow">
            <a
              class="btn"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker)}"
            >
              SEC
            </a>

            <a
              class="btn"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(ticker)}"
            >
              Chart
            </a>
          </div>
        </div>
      `)
      .join("");
}

function removeWatch(ticker) {
  watch =
    watch.filter(
      item =>
        item !== ticker
    );

  saveLocalData();
  renderWatch();
}

function quickNote(ticker) {
  document
    .querySelectorAll(
      "nav button"
    )[3]
    .click();

  document.getElementById(
    "jTicker"
  ).value =
    ticker;

  document.getElementById(
    "jNote"
  ).focus();
}

function saveNote() {
  const ticker =
    document.getElementById(
      "jTicker"
    )
      .value
      .trim()
      .toUpperCase();

  const body =
    document.getElementById(
      "jNote"
    )
      .value
      .trim();

  if (!ticker || !body) {
    return;
  }

  notes.unshift({
    ticker,
    body,
    date:
      new Date().toLocaleString()
  });

  document.getElementById(
    "jTicker"
  ).value =
    "";

  document.getElementById(
    "jNote"
  ).value =
    "";

  saveLocalData();
  renderNotes();
}

function renderNotes() {
  const element =
    document.getElementById(
      "notes"
    );

  if (!notes.length) {
    element.innerHTML = `
      <div class="empty">
        No journal notes yet.
      </div>
    `;

    return;
  }

  element.innerHTML =
    notes
      .map((note, index) => `
        <div class="card">
          <div class="top">
            <div>
              <div class="ticker">
                ${escapeHtml(
                  note.ticker ||
                  note.t ||
                  ""
                )}
              </div>

              <div class="name">
                ${escapeHtml(note.date)}
              </div>
            </div>

            <button
              class="danger"
              onclick="deleteNote(${index})"
            >
              Delete
            </button>
          </div>

          <p class="small">
            ${escapeHtml(note.body)}
          </p>
        </div>
      `)
      .join("");
}

function deleteNote(index) {
  notes.splice(index, 1);

  saveLocalData();
  renderNotes();
}

function openSecLookup() {
  const ticker =
    document.getElementById(
      "scanTicker"
    )
      .value
      .trim()
      .toUpperCase();

  const url =
    "https://www.sec.gov/edgar/search/#/q=" +
    encodeURIComponent(ticker);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

window.tab = tab;
window.loadOpportunities = loadOpportunities;
window.toggleOpportunityDetails =
  toggleOpportunityDetails;
window.addWatch = addWatch;
window.removeWatch = removeWatch;
window.quickNote = quickNote;
window.saveNote = saveNote;
window.deleteNote = deleteNote;
window.openSecLookup = openSecLookup;
window.saveSettings = saveSettings;

renderWatch();
renderNotes();
updateStats();

loadOpportunities();
