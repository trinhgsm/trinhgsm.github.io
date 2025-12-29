/************************************************************
 * DUKICO – DASHBOARD TIẾN ĐỘ (FULL – KHÓA)
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

/* ===== GLOBAL CHART INSTANCE ===== */
let projectChart = null;
let unitOverviewChart = null;

/* =========================================================
   LOAD DASHBOARD
   ========================================================= */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  /* HEADER TIME */
  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  /* SUMMARY */
  renderProjectCard(json.project);
  renderUnitOverview(json.units);

  /* SIDEBAR */
  renderWarnings(json.units);
  renderLegend(json.units);

  /* UNIT CARDS */
  const unitBox = document.getElementById("unitCards");
  unitBox.innerHTML = "";
  json.units.forEach(u => {
    unitBox.appendChild(buildUnitCard(u));
  });
}

/* =========================================================
   TỔNG DỰ ÁN
   ========================================================= */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");

  box.innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <div class="chart-wrap">
      <canvas id="projectChart"></canvas>
    </div>
    <div style="font-size:.8rem;margin-top:6px">
      Công: ${p.actualCong} / ${p.plannedCong} (${p.percent}%)
    </div>
  `;

  if (projectChart) projectChart.destroy();

  projectChart = new Chart(
    document.getElementById("projectChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Đã làm", "Còn lại"],
        datasets: [{
          data: [
            p.actualCong,
            Math.max(0, p.plannedCong - p.actualCong)
          ],
          backgroundColor: ["#22c55e", "#1f2937"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    }
  );
}

/* =========================================================
   TỔNG QUAN TIẾN ĐỘ CÁC CĂN
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
        data: units.map(u => u.percent),
        backgroundColor: units.map(u =>
          u.status === "red" ? "#ef4444" :
          u.status === "yellow" ? "#eab308" : "#22c55e"
        )
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Tiến độ (%)" }
        },
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 30
          }
        }
      }
    }
  });
}

/* =========================================================
   SIDEBAR – CẢNH BÁO
   ========================================================= */
function renderWarnings(units) {
  const box = document.getElementById("warningList");
  if (!box) return;

  const risks = units.filter(u => u.status !== "green");

  if (!risks.length) {
    box.innerHTML = "✅ Không có rủi ro tiến độ";
    return;
  }

  box.innerHTML = risks.map(u => `
    <div class="warning-item">
      • <strong>${u.maCan}</strong> – ${u.statusText}
    </div>
  `).join("");
}

/* =========================================================
   SIDEBAR – LEGEND NÂNG CẤP
   ========================================================= */
function renderLegend(units) {
  const box = document.getElementById("legendList");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    if (!u.byTeam) return;

    Object.keys(u.byTeam).forEach(team => {
      const cong = u.byTeam[team];

      // Bỏ các tổ 0 công
      if (!cong || cong <= 0) return;

      // Màu theo trạng thái căn
      const color =
        u.status === "red" ? "#ef4444" :
        u.status === "yellow" ? "#eab308" :
        "#22c55e";

      box.innerHTML += `
        <div class="legend-item">
          <div class="legend-color" style="background:${color}"></div>
          <div>
            <div><strong>TỔ ${team.toUpperCase()}</strong> – ${u.maCan}</div>
            <div style="font-size:.7rem;opacity:.8">
              ${cong} công
            </div>
          </div>
        </div>
      `;
    });
  });
}


/* =========================================================
   CARD TỪNG CĂN (ĐÚNG 2 DÒNG + BIỂU ĐỒ NGANG)
   ========================================================= */
function buildUnitCard(u) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${u.maCan}</h2>

    <!-- DÒNG 1: THỜI GIAN -->
    <div style="
      font-size:0.75rem;
      opacity:.85;
      margin-bottom:4px;
      white-space:nowrap;
    ">
      Bắt đầu: ${fmtDate(u.start)} |
      Hoàn thành: ${fmtDate(u.end)}
    </div>

    <!-- DÒNG 2: CÔNG + TRẠNG THÁI -->
    <div style="
      font-size:0.8rem;
      margin-bottom:8px;
      white-space:nowrap;
    ">
      Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
      |
      <span style="color:${
        u.status === "red"
          ? "#ef4444"
          : u.status === "yellow"
          ? "#eab308"
          : "#22c55e"
      }">
        ${u.statusText}
      </span>
    </div>

    <!-- HÀNG BIỂU ĐỒ -->
    <div style="
      display:flex;
      gap:12px;
      align-items:stretch;
    ">
      <!-- BIỂU ĐỒ CHI TIÊU -->
      <div style="flex:1">
        <div style="font-size:.7rem;margin-bottom:4px">
          Chi tiêu (VNĐ)
        </div>
        <div class="chart-wrap" style="height:140px">
          <canvas class="costChart"></canvas>
        </div>
      </div>

      <!-- BIỂU ĐỒ CÔNG -->
      <div style="flex:1">
        <div style="font-size:.7rem;margin-bottom:4px">
          Phân bổ công
        </div>
        <div class="chart-wrap" style="height:140px">
          <canvas class="teamChart"></canvas>
        </div>
      </div>
    </div>
  `;

  /* VẼ BIỂU ĐỒ */
  drawCostChart(
    card.querySelector(".costChart"),
    u.plannedCost,
    u.actualCost
  );

  drawTeamChart(
    card.querySelector(".teamChart"),
    u.byTeam
  );

  return card;
}

/* =========================================================
   BIỂU ĐỒ CÔNG THEO TỔ
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
          "#ef4444", "#a855f7", "#f97316"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/* =========================================================
   BIỂU ĐỒ CHI TIÊU
   ========================================================= */
function drawCostChart(canvas, planned, actual) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Dự tính", "Đã chi"],
      datasets: [{
        data: [planned, actual],
        backgroundColor: [
          "#38bdf8",
          actual > planned ? "#ef4444" : "#22c55e"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => v.toLocaleString("vi-VN")
          }
        }
      }
    }
  });
}

/* =========================================================
   FORMAT DATE
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
