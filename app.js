const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const statusOrder = {
  perfect: 0,
  playable: 1,
  menu: 2,
  unplayable: 3,
  unknown: 4
};

let games = [];
let sortKey = "reports";
let sortDirection = -1;

fetch("database.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  })
  .then((data) => {
    games = Array.isArray(data) ? data : [];

    updateSummary();
    render();
  })
  .catch((error) => {
    console.error("Unable to load compatibility database:", error);

    $("#count").textContent = "Unable to load games";
    $("#error").hidden = false;
  });

function updateSummary() {
  const reports = games.reduce(
    (total, game) => total + Number(game.reports || 0),
    0
  );

  const playable = games.filter(
    (game) => game.xodus === "playable"
  ).length;

  $("#total").textContent = games.length;
  $("#playable").textContent = playable;
  $("#reports").textContent = reports;
}

function render() {
  const query = $("#q").value.trim().toLowerCase();
  const tier = $("#tier").value;

  const filtered = games
    .filter((game) => {
      if (!query) {
        return true;
      }

      return [
        game.name,
        game.xodus,
        game.xgameruntimeversion,
        game.player,
        game.additionalinformation
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    })
    .filter((game) => {
      if (!tier) {
        return true;
      }

      if (tier === "unknown") {
        return !game.xodus;
      }

      return game.xodus === tier;
    })
    .sort(compareGames);

  $("#rows").innerHTML = filtered
    .map(renderGame)
    .join("");

  $("#count").textContent =
    filtered.length === games.length
      ? `${filtered.length} games`
      : `${filtered.length} of ${games.length} games`;

  $("#empty").hidden = filtered.length !== 0;

  bindGameButtons();
}

function compareGames(a, b) {
  let result = 0;

  if (sortKey === "reports") {
    result = Number(a.reports || 0) - Number(b.reports || 0);
  } else if (sortKey === "name") {
    result = a.name.localeCompare(b.name);
  } else if (sortKey === "updated") {
    result = String(a.updated || "").localeCompare(
      String(b.updated || "")
    );
  }

  return result * sortDirection;
}

function renderGame(game, index) {
  const status = getStatus(game.xodus);
  const id = `game-${index}`;

  return `
    <article class="game" data-game="${id}">
      <div class="game-main">
        <div class="game-name">
          <button
            type="button"
            aria-expanded="false"
            aria-controls="${id}-details"
          >
            ${escapeHtml(game.name)}
          </button>
        </div>

        <div class="game-status">
          <span class="status status-${status.className}">
            ${escapeHtml(status.label)}
          </span>
        </div>

        <div class="game-reports">
          ${Number(game.reports || 0)}
          ${Number(game.reports || 0) === 1 ? "report" : "reports"}
        </div>

        <time class="game-date" datetime="${escapeHtml(game.updated || "")}">
          ${formatDate(game.updated)}
        </time>
      </div>

      <div
        id="${id}-details"
        class="game-details"
        aria-hidden="true"
      >
        <div class="detail">
          <span class="detail-label">Xodus</span>
          <span class="detail-value">
            ${escapeHtml(game.xodus || "No status reported")}
          </span>
        </div>
      
        <div class="detail">
          <span class="detail-label">XGameRuntime</span>
          <span class="detail-value runtime">
            ${formatRuntime(game.xgameruntimeversion)}
          </span>
        </div>
      
        <div class="detail">
          <span class="detail-label">Player</span>
          <span class="detail-value player">
            ${escapeHtml(game.player || "—")}
          </span>
        </div>
      
        ${
          game.additionalinformation
            ? `
              <div class="detail additional-information">
                <span class="detail-label">Additional information</span>
                <span class="detail-value notes">
                  ${escapeHtml(game.additionalinformation)}
                </span>
              </div>
            `
            : ""
        }
      </div>
      </div>
    </article>
  `;
}

function bindGameButtons() {
  $$(".game-name button").forEach((button) => {
    button.addEventListener("click", () => {
      const game = button.closest(".game");
      const details = game.querySelector(".game-details");
      const expanded = game.classList.toggle("open");

      button.setAttribute("aria-expanded", String(expanded));
      details.setAttribute("aria-hidden", String(!expanded));
    });
  });
}

function formatRuntime(value) {
  if (!value) {
    return "—";
  }

  const match = String(value).match(
    /^(.*?)\s+commit\s+([0-9a-f]+)$/i
  );

  if (!match) {
    return escapeHtml(value);
  }

  return `
    <span class="runtime-name">
      ${escapeHtml(match[1])}
    </span>
    <span class="commit">
      ${escapeHtml(match[2])}
    </span>
  `;
}

function getStatus(value) {
  if (!value) {
    return {
      className: "unknown",
      label: "No status"
    };
  }

  return {
    className: value,
    label: value
  };
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

["#q", "#tier"].forEach((selector) => {
  $(selector).addEventListener("input", render);
});

$$(".sort-button").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.sort;

    if (sortKey === key) {
      sortDirection *= -1;
    } else {
      sortKey = key;
      sortDirection = key === "name" ? 1 : -1;
    }

    $$(".sort-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    render();
  });
});
