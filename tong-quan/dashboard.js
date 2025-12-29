/************************************************************
 * DUKICO DASHBOARD – JS RESET SẠCH
 * An toàn – không chết JS – dễ mở rộng
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

let projectChart = null;
let unitOverviewChart = null;

/* =========================================================
   LOAD
   ========================================================= */
async function loadDashboard() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data || !data.units) {
      console.error("Không có dữ liệu units");
      return;
    }

    updateTime(data.generatedAt);

    renderProject(data.project);
    renderOverviewChart(data.units);
    renderWarnings(data.units);
    renderUnitCards(data.units);
    renderSidebarDetail(data.units);

  } catch (e) {
    console.error("Lỗi loadDashboard:", e);
  }
}

/* =========================================================
   TIME
   ========================================================= */
function updateTime(ts) {
  const el = document.getElementById("genTime");
  if (el) {
    el.textContent = "Cập nhật: " + new Date(ts).toLocaleString();
  }
}

/* =========================================================
   PROJECT CARD
   ========================================================= */
function renderProject(p) {
  const box = document.getElementById("projectCard");
  if (!box || !p) return;

  box.innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <div class="chart-wrap">
      <canvas id="projectChart"></canvas>
    </div>
    <div style="font-size:.8rem;margin-top:6px">
      Công: ${p.actualCong} / ${p.plannedCong} (${p.percent}%)
    </div>
  `;

  const canvas = document.getElementById("projectChart");
  if (!canvas) return;

  if (projectChart) projectChart.destroy();

  projectChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Đã làm", "Còn lại"],
      datasets: [{
        data: [
          p.actualCong || 0,
          Math.max(0, (p.plannedCong || 0) - (p.actualCong || 0))
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
   OVERVIEW BAR CHART
   ========================================================= */
function renderOverviewChart(units) {
  const canvas = document.getElementById("unitOverviewChart");
  if (!canvas) return;

  if (unitOverviewChart) unitOverviewChart.destroy();

  unitOverviewChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: units.map(u => u.maCan),
      datasets: [{
        data: units.map(u => u.percent || 0),
        backgroundColor: units.map(u =>
          u.status === "red" ? "#ef4444" :
          u.status === "yellow" ? "#eab308" :
          "#22c55e"
        )
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
   WARNINGS (RED → YELLOW → GREEN)
   ========================================================= */
function renderWarnings(units) {
  const box = document.getElementById("sidebarSummary");
  if (!box) return;

  const order = { red: 3, yellow: 2, green: 1 };

  const list = [...units].sort((a, b) => {
    const r = order[b.status] - order[a.status];
    if (r !== 0) return r;
    return (a.percent || 0) - (b.percent || 0);
  });

  const MAX = 5;
  box.innerHTML = list.slice(0, MAX).map(u => `
    <div class="warning-item ${u.status}">
      • <strong>${u.maCan}</strong> – ${u.statusText || ""}
    </div>
  `).join("");
}

/* =========================================================
   UNIT CARDS
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

      <div style="font-size:.75rem;opacity:.85">
        Bắt đầu: ${fmtDate(u.start)} |
        Hoàn thành: ${fmtDate(u.end)}
      </div>

      <div style="font-size:.8rem;margin-bottom:6px">
        Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
        |
        <span class="status ${u.status}">
          ${u.statusText || ""}
        </span>
      </div>

      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <div class="chart-wrap" style="height:140px">
            <canvas class="costChart"></canvas>
          </div>
        </div>
        <div style="flex:1">
          <div class="chart-wrap" style="height:140px">
            <canvas class="teamChart"></canvas>
          </div>
        </div>
      </div>
    `;

    box.appendChild(card);

    drawCostChart(card.querySelector(".costChart"), u.plannedCost, u.actualCost);
    drawTeamChart(card.querySelector(".teamChart"), u.byTeam);
  });
}

/* =========================================================
   SIDEBAR DETAIL – 1 HÀM DUY NHẤT
   ========================================================= */
function renderSidebarDetail(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;

  let html = "";

  units.forEach(u => {
    const color =
      u.status === "red" ? "#ef4444" :
      u.status === "yellow" ? "#eab308" :
      "#22c55e";

    html += `
      <div class="legend-item">
        <div class="legend-color" style="background:${color}"></div>
        <div>
          <strong>${u.maCan}</strong><br>
          ${u.actualCong} công
        </div>
      </div>
    `;

    if (u.byTeam) {
      Object.keys(u.byTeam).forEach(team => {
        const cong = u.byTeam[team];
        if (!cong) return;

        html += `
          <div class="legend-item" style="opacity:.7;padding-left:14px">
            <div class="legend-color"></div>
            <div>
              Tổ ${team.toUpperCase()} – ${cong} công
            </div>
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

function drawCostChart(canvas, planned, actual) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Dự tính", "Đã chi"],
      datasets: [{
        data: [planned || 0, actual || 0],
        backgroundColor: [
          "#38bdf8",
          actual > planned ? "#ef4444" : "#22c55e"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
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

/* =========================================================
   START
   ========================================================= */
loadDashboard();
