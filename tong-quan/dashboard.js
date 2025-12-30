/************************************************************
 * DUKICO DASHBOARD – FRONTEND JS
 * Tương thích backend _handleDashboard_ (4 level)
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
      console.error("Không có dữ liệu units");
      return;
    }

    updateTime(data.generatedAt);

    renderProjectCard(data.project);
    renderUnitOverview(data.units);
    renderWarnings(data.units);
    renderUnitCards(data.units);
    renderSidebarDetail(data.units);

  } catch (err) {
    console.error("Lỗi loadDashboard:", err);
  } finally {
    if (dash) dash.classList.remove("loading");
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
   PROJECT CARD (BIỂU ĐỒ TRÒN)
   ========================================================= */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  if (!box || !p) return;

  box.innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <div class="chart-wrap">
      <canvas id="projectChart"></canvas>
    </div>
    <div class="meta">
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
   OVERVIEW BAR CHART – TỔNG QUAN CÁC CĂN
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
        label: "Tiến độ (%)",
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
   SIDEBAR – CẢNH BÁO TIẾN ĐỘ (4 MỨC)
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
        ${u.debt > 0 ? `<br><span class="mini">Nợ: ${fmtMoney(u.debt)}</span>` : ""}
      </div>
    </div>
  `).join("");
}

/* =========================================================
   CARD MỖI CĂN (2 BIỂU ĐỒ NGANG)
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
        <span class="date">Bắt đầu ${fmtDate(u.start)}</span>
        <span class="date">Hoàn thành ${fmtDate(u.end)}</span>
      </div>

      <div class="line">
        <span class="work">
          Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
        </span>
        <span class="status ${u.status}">
          ${u.statusText}
        </span>
      </div>

      <div class="finance">
        <div>
          <span class="label">Đã chi:</span>
          <span class="value">${fmtShortMoney(u.actualCost)}</span>

        </div>
        <div>
          <span class="label">Đang nợ:</span>
          <span class="value debt">${fmtMoney(u.debt)}</span>
        </div>
        <div>
          <span class="label">Đã ứng CĐT:</span>
          <span class="value advance">${fmtMoney(u.advance)}</span>
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

    drawCostChart(card.querySelector(".costChart"), u.plannedCost, u.actualCost);
    drawTeamChart(card.querySelector(".teamChart"), u.byTeam);
  });
}

/* =========================================================
   SIDEBAR DETAIL – PHÂN BỔ THEO TỔ
   ========================================================= */
function renderSidebarDetail(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;

  let html = "";

  units.forEach(u => {
    html += `
      <div class="legend-item">
        <strong>${u.maCan}</strong> – ${u.actualCong} công
      </div>
    `;

    if (u.byTeam) {
      Object.keys(u.byTeam).forEach(team => {
        html += `
          <div class="legend-sub">
            Tổ ${team.toUpperCase()}: ${u.byTeam[team]} công
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
  ],
  barThickness: 22,        // 👈 độ rộng cố định
  maxBarThickness: 26,     // 👈 không cho to quá
  categoryPercentage: 0.6 // 👈 khoảng cách giữa nhóm
}]

    },
   options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => fmtShortMoney(ctx.raw)
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: v => fmtShortMoney(v)
      }
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

function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString("vi-VN") + " đ";
}
function fmtShortMoney(n) {
  n = Number(n) || 0;

  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(".0","") + " tỷ";
  }

  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(".0","") + " triệu";
  }

  if (n >= 1_000) {
    return (n / 1_000).toFixed(0) + " k";
  }

  return n.toString();
}

/* =========================================================
   START
   ========================================================= */
loadDashboard();
