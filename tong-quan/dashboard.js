/************************************************************
 * DUKICO DASHBOARD â€“ FRONTEND JS (UPDATED)
 * TÆ°Æ¡ng thĂ­ch backend _handleDashboard_ (MĂ” HĂŒNH C)
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

let projectChart = null;
let unitOverviewChart = null;

/* =========================================================
   LOAD DASHBOARD
   ========================================================= */
async function loadDashboard() {
  const dash = document.getElementById("dashboard");
  if (dash) dash.classList.add("loading");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data || !data.units) {
      console.error("KhĂ´ng cĂ³ dá»¯ liá»‡u units");
      return;
    }

    updateTime(data.generatedAt);

    renderProjectCard(data.project);
    renderUnitOverview(data.units);
    renderWarnings(data.units);
    renderUnitCards(data.units);
    renderSidebarDetail(data.units);

  } catch (err) {
    console.error("Lá»—i loadDashboard:", err);
  } finally {
    if (dash) dash.classList.remove("loading");
  }
}

/* =========================================================
   TIME
   ========================================================= */
function updateTime(ts) {
  const el = document.getElementById("genTime");
  if (el) el.textContent = "Cáº­p nháº­t: " + new Date(ts).toLocaleString();
}

/* =========================================================
   PROJECT CARD (CĂ”NG + TĂ€I CHĂNH)
   ========================================================= */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  if (!box || !p) return;

  box.innerHTML = `
    <h2>Tá»”NG Dá»° ĂN</h2>
    <div class="chart-wrap">
      <canvas id="projectChart"></canvas>
    </div>
    <div class="meta">
      <div>LĂ£i / lá»—: <b class="${p.profit < 0 ? "debt" : ""}">
        ${fmtShortMoney(p.profit)}</b></div>
      <div>DĂ²ng tiá»n: <b class="${p.cashFlow < 0 ? "debt" : ""}">
        ${fmtShortMoney(p.cashFlow)}</b></div>
      <div>CÄT cĂ²n ná»£: ${fmtShortMoney(p.debtCDT)}</div>
    </div>
  `;

  const canvas = document.getElementById("projectChart");
  if (!canvas) return;

  if (projectChart) projectChart.destroy();

  projectChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["ÄĂ£ chi", "CĂ²n láº¡i"],
      datasets: [{
        data: [
          p.totalCost || 0,
          Math.max(0, (p.totalPlan || 0) - (p.totalCost || 0))
        ],
        backgroundColor: ["#22c55e", "#1f2937"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* =========================================================
   OVERVIEW BAR CHART â€“ TIáº¾N Äá»˜ %
   ========================================================= */
function renderUnitOverview(units) {
  const canvas = document.getElementById("unitOverviewChart");
  if (!canvas) return;

  if (unitOverviewChart) unitOverviewChart.destroy();

  unitOverviewChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: units.map(u => u.maCan),
      datasets: [{
        label: "Tiáº¿n Ä‘á»™ (%)",
        data: units.map(u => u.percent || 0),
        backgroundColor: units.map(u => {
          if (u.status === "red-blink") return "#ef4444";
          if (u.status === "red") return "#ef4444";
          if (u.status === "yellow") return "#eab308";
          return "#22c55e";
        })
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
        x: { ticks: { autoSkip: true, maxRotation: 45 } }
      }
    }
  });
}

/* =========================================================
   SIDEBAR â€“ Cáº¢NH BĂO (TIáº¾N Äá»˜ + TIá»€N)
   ========================================================= */
function renderWarnings(units) {
  const box = document.getElementById("sidebarSummary");
  if (!box) return;

  const list = [...units].sort((a, b) => b.level - a.level);

  box.innerHTML = list.map(u => `
    <div class="warning-item warning-${u.status}">
      <span class="dot"></span>
      <div class="text">
        <strong>${u.maCan}</strong><br>
        ${u.statusText}
        ${u.cashFlow < 0 ? `<br><span class="mini">Thiáº¿u tiá»n: ${fmtShortMoney(u.cashFlow)}</span>` : ""}
        ${u.debtCDT > 0 ? `<br><span class="mini">CÄT ná»£: ${fmtShortMoney(u.debtCDT)}</span>` : ""}
      </div>
    </div>
  `).join("");
}

/* =========================================================
   CARD Má»–I CÄ‚N
   ========================================================= */
function renderUnitCards(units) {
  const box = document.getElementById("unitCards");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${u.maCan}</h2>

      <div class="line">
        <span class="date">Báº¯t Ä‘áº§u ${fmtDate(u.start)}</span>
        <span class="date">HoĂ n thĂ nh ${fmtDate(u.end)}</span>
      </div>

      <div class="line">
        <span class="work">
          CĂ´ng: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
        </span>
        <span class="status ${u.status}">
          ${u.statusText}
        </span>
      </div>

      <div class="finance">
        <div>
          <span class="label">LĂ£i / lá»—:</span>
          <span class="value ${u.profit < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.profit)}
          </span>
        </div>

        <div>
          <span class="label">DĂ²ng tiá»n:</span>
          <span class="value ${u.cashFlow < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.cashFlow)}
          </span>
        </div>

        <div>
          <span class="label">CÄT cĂ²n ná»£:</span>
          <span class="value">
            ${fmtShortMoney(u.debtCDT)}
          </span>
        </div>
      </div>

      <div class="chart-row">
        <div class="chart-wrap">
          <canvas class="costChart"></canvas>
        </div>
        <div class="chart-wrap">
          <canvas class="teamChart"></canvas>
        </div>
      </div>
    `;

    box.appendChild(card);

    drawCostChart(
  card.querySelector(".costChart"),
  u.totalPlan,
  u.paidCost,
  u.debtNCC
);


    drawTeamChart(card.querySelector(".teamChart"), u.byTeam);
  });
}

/* =========================================================
   SIDEBAR DETAIL â€“ Tá»” Äá»˜I
   ========================================================= */
function renderSidebarDetail(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;

  let html = "";

  units.forEach(u => {
    html += `
      <div class="legend-item">
        <strong>${u.maCan}</strong> â€“ ${u.actualCong} cĂ´ng
      </div>
    `;

    if (u.byTeam) {
      Object.keys(u.byTeam).forEach(team => {
        html += `
          <div class="legend-sub">
            Tá»• ${team.toUpperCase()}: ${u.byTeam[team]} cĂ´ng
          </div>
        `;
      });
    }
  });

  box.innerHTML = html;
}

/* =========================================================
   CHART HELPERS
   ========================================================= */
function drawTeamChart(canvas, byTeam) {
  if (!canvas || !byTeam) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(byTeam),
      datasets: [{
        data: Object.values(byTeam),
        backgroundColor: [
          "#38bdf8", "#22c55e", "#eab308",
          "#ef4444", "#a855f7"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

function drawCostChart(canvas, totalPlan, paidCost, debtNCC) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Tá»•ng dá»± tĂ­nh", "Chi phĂ­"],
      datasets: [

        // ===== Tá»”NG Dá»° TĂNH (THAM CHIáº¾U) =====
        {
          label: "Tá»•ng dá»± tĂ­nh",
          data: [totalPlan || 0, null],
          backgroundColor: "#38bdf8",
          barThickness: 22
        },

        // ===== ÄĂƒ CHI (TIá»€N ÄI RA) =====
        {
          label: "ÄĂ£ chi",
          data: [null, paidCost || 0],
          backgroundColor: "#22c55e",
          stack: "cost",
          barThickness: 22
        },

        // ===== Ná»¢ NCC (CÅ¨NG LĂ€ CHI PHĂ) =====
        {
          label: "Ná»£ NCC",
          data: [null, debtNCC || 0],
          backgroundColor: "#ef4444",
          stack: "cost",
          barThickness: 22
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { boxWidth: 10, font: { size: 10 } }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              `${ctx.dataset.label}: ${fmtShortMoney(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { callback: v => fmtShortMoney(v) }
        }
      }
    }
  });
}


/* =========================================================
   UTIL
   ========================================================= */
function fmtDate(d) {
  if (!d) return "?";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function fmtShortMoney(n) {
  n = Number(n) || 0;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".0","") + " tá»·";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0","") + " triá»‡u";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " k";
  return n.toString();
}

/* =========================================================
   START
   ========================================================= */
loadDashboard();
