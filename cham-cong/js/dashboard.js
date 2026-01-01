
/************************************************************
 * DUKICO DASHBOARD – FRONTEND JS (UPDATED)
 * Tương thích backend _handleDashboard_ (MÔ HÌNH C)
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

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
    // ================== LOAD SITE (NHẬT KÝ) ==================
let siteMap = {};

// ⚠️ fileId lấy từ URL file tháng mà dashboard đang dùng
// Nếu bạn đã có biến lưu link file tháng → dùng lại
// Ví dụ: window.currentMonthFile

if (window.currentMonthFile) {
  const fileId = window.currentMonthFile
    .match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];

  if (fileId) {
    const siteRes = await fetch(
      API_URL.replace(
        "action=dashboard",
        "action=sheets&fileId=" + fileId
      )
    );

    const siteData = await siteRes.json();

    if (siteData && Array.isArray(siteData.sites)) {
      siteData.sites.forEach(s => {
        siteMap[s.maCan] = s;
      });
    }
  }
}

    if (!data || !data.units) {
      console.error("Không có dữ liệu units");
      return;
    }

    updateTime(data.generatedAt);

    renderUnitOverview(data.units);
    renderProjectStatusChart(data.units);

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
  if (el) el.textContent = "Cập nhật: " + new Date(ts).toLocaleString();
}


/* =========================================================
   OVERVIEW BAR CHART – TIẾN ĐỘ %
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
   PROJECT STATUS CHART – BAR + MULTI LINE
   ========================================================= */
function renderProjectStatusChart(units) {
  const canvas = document.getElementById("projectStatusChart");
  if (!canvas || !units || !units.length) return;

  const labels = units.map(u => u.maCan);

  // ===== BAR: trạng thái căn =====
  const barData = units.map(() => 1);
  const barColors = units.map(u => {
    if (u.status === "red" || u.status === "red-blink") return "#ef4444";
    if (u.status === "yellow") return "#eab308";
    return "#22c55e";
  });

  // ===== LINE 1: TIẾN ĐỘ =====
  const lineProgress = units.map(u => u.level ?? 1);

  // ===== LINE 2: NỢ NCC =====
  const lineDebtNCC = units.map(u => {
    if (!u.totalPlan) return 0;
    const r = u.debtNCC / u.totalPlan;
    if (r >= 0.7) return 4;
    if (r >= 0.5) return 3;
    if (r >= 0.3) return 2;
    if (r >= 0.1) return 1;
    return 0;
  });

  // ===== LINE 3: CĐT NỢ =====
  const lineDebtCDT = units.map(u => {
    if (!u.totalPlan) return 0;
    const r = u.debtCDT / u.totalPlan;
    if (r >= 0.8) return 4;
    if (r >= 0.6) return 3;
    if (r >= 0.4) return 2;
    if (r >= 0.2) return 1;
    return 0;
  });

  new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Trạng thái căn",
          data: barData,
          backgroundColor: barColors,
          barThickness: 16
        },
        {
          type: "line",
          label: "Tiến độ",
          data: lineProgress,
          borderColor: "#60a5fa",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
        },
        {
          type: "line",
          label: "Nợ NCC",
          data: lineDebtNCC,
          borderColor: "#f97316",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
        },
        {
          type: "line",
          label: "CĐT nợ",
          data: lineDebtCDT,
          borderColor: "#a855f7",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { display: false },
        yInd: {
          position: "right",
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: v => ["OK", "Nhẹ", "TB", "Cao", "Rất cao"][v]
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/* =========================================================
   SIDEBAR – CẢNH BÁO (TIẾN ĐỘ + TIỀN)
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
        ${u.cashFlow < 0 ? `<br><span class="mini">Thiếu tiền: ${fmtShortMoney(u.cashFlow)}</span>` : ""}
        ${u.debtCDT > 0 ? `<br><span class="mini">CĐT nợ: ${fmtShortMoney(u.debtCDT)}</span>` : ""}
      </div>
    </div>
  `).join("");
}

/* =========================================================
   CARD MỖI CĂN
   ========================================================= */
function renderUnitCards(units) {
  const box = document.getElementById("unitCards");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    const site = siteMap[u.maCan];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${u.maCan}</h2>

      <div class="line">
        <span class="date">Bắt đầu ${fmtDate(u.start)}</span>
        <span class="date">Hoàn thành ${fmtDate(u.end)}</span>
      </div>
      ${site ? `
<div class="site-line site-${site.status}">
  ${
    site.diffDays === 0
      ? "Hôm nay có thi công"
      : site.diffDays + " ngày không thi công"
  }
</div>
` : ""}

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
          <span class="label">Lãi / lỗ:</span>
          <span class="value ${u.profit < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.profit)}
          </span>
        </div>

        <div>
          <span class="label">Dòng tiền:</span>
          <span class="value ${u.cashFlow < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.cashFlow)}
          </span>
        </div>

        <div>
          <span class="label">CĐT còn nợ:</span>
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
   SIDEBAR DETAIL – TỔ ĐỘI
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

function drawCostChart(canvas, totalPlan, paidCost, debtNCC) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Tổng dự tính", "Chi phí"],
      datasets: [

        // ===== TỔNG DỰ TÍNH (THAM CHIẾU) =====
        {
          label: "Tổng dự tính",
          data: [totalPlan || 0, null],
          backgroundColor: "#38bdf8",
          barThickness: 22
        },

        // ===== ĐÃ CHI (TIỀN ĐI RA) =====
        {
          label: "Đã chi",
          data: [null, paidCost || 0],
          backgroundColor: "#22c55e",
          stack: "cost",
          barThickness: 22
        },

        // ===== NỢ NCC (CŨNG LÀ CHI PHÍ) =====
        {
          label: "Nợ NCC",
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
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".0","") + " tỷ";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0","") + " triệu";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " k";
  return n.toString();
}

/* =========================================================
   START
   ========================================================= */
(function () {
  const SECRET = "dukico@2025"; // 🔒 đổi nếu muốn

  function buildTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return md5(SECRET + y + m + day);
  }

  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");

  if (!key || key !== buildTodayKey()) {
    document.body.innerHTML = `
      <div style="
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#020617;
        color:#ef4444;
        font-family:system-ui;
        font-size:18px;
        letter-spacing:0.08em;
      ">
        ⛔ BẠN BỊ CẤM TRUY CẬP KO PHẢI NV DUKICO
      </div>
    `;
    throw new Error("Access denied");
  }
})();

loadDashboard();
