const $ = (s) => document.querySelector(s);
const order = { perfect: 0, playable: 1, menu: 2, unplayable: 3 };
let games = [], sortKey = "reports", sortDir = -1;

fetch("database.json").then(r => r.json()).then(d => { games = d; render(); });

function render() {
  const q = $("#q").value.trim().toLowerCase();
  const tier = $("#tier").value;

  const list = games
    .filter(g => g.name.toLowerCase().includes(q))
    .filter(g => !tier || g.xodus === tier)
    .sort((a, b) => {
      const va = order[a[sortKey]] ?? a[sortKey];
      const vb = order[b[sortKey]] ?? b[sortKey];
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
    });

  $("#rows").innerHTML = list.map(g => `
    <tr>
      <td class="t ${g.id}">${esc(g.name)}</td>
      <td class="t ${g.xodus}">${g.xodus}</td>
      <td class="t ${g.xgameruntimeversion}">${g.xgameruntimeversion}</td>
      <td class="num">${g.reports}</td>
      <td class="t ${g.player}">${g.player}</td>
      <td class="t ${g.additionalinformation}">${g.additionalinformation}</td>
      <td>${g.updated}</td>
    </tr>`).join("");
  $("#count").textContent = `${list.length} game(s)`;
}

function esc(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "<", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

["#q", "#tier"].forEach(s => $(s).addEventListener("input", render));
document.querySelectorAll("th[data-sort]").forEach(th =>
  th.addEventListener("click", () => {
    const k = th.dataset.sort;
    sortDir = sortKey === k ? -sortDir : 1;
    sortKey = k;
    render();
  }));