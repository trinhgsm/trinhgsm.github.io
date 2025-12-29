/************************************************************
 * DUKICO – DASHBOARD TIẾN ĐỘ
 * FULL JS – SIDEBAR ĐỘC LẬP – KHÔNG KÉO MAIN
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

/* ===== GLOBAL CHART ===== */
let projectChart = null;
let unitOverviewChart = null;

/* =========================================================
   LOAD DASHBOARD
   ========================================================= */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  /* HEADER TIME */
  const gen = document.getElementById("genTime");
  if (gen) {
    gen.textContent =
      "Cập nhật: " + new Date(json.generatedAt).toLocaleString();
  }

  /* ===== MAIN (2 CỘT) ===== */
  renderProjectCard(json.project);
  renderUnitOverview(json.units);

  /* ===== SIDEBAR (ĐỘC LẬP) ===== */
  renderWarnings(json.units);        // cảnh báo tiến độ
  renderLegend(json.units);          // theo căn (cũ)
  renderTeamLegend(json.units);      // theo tổ (mới)

  /* ===== CARD TỪNG CĂN ===== */
  const unitBox = document.getElementById("unitCards");
  if (unitBox) {
    unitBox.innerHTML = "";
    json.units.forEach(u => {
      unitBox.appendChild(buildUnitCard(u));
    });
  }
}

/* =========================================================
   TỔNG DỰ ÁN – BIỂU ĐỒ TRÒN
   ========================================================= */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  if (!box) return;

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
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    }
  );
}

/* =========================================================
   TỔNG QUAN TIẾN ĐỘ CÁC CĂN – BIỂU ĐỒ CỘT
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
   SIDEBAR – CẢNH BÁO TIẾN ĐỘ
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
   SIDEBAR – PHÂN BỔ THEO CĂN (GIỮ NGUYÊN)
   ========================================================= */
function renderLegend(units) {
  const box = document.getElementById("legendList");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    const color =
      u.status === "red" ? "#ef4444" :
      u.status === "yellow" ? "#eab308" :
      "#22c55e";

    box.innerHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background:${color}"></div>
        <div>
          <div><strong>${u.maCan}</strong></div>
          <div style="font-size:.7rem;opacity:.8">
            ${u.actualCong} công
          </div>
        </div>
      </div>
    `;
  });
}

/* =========================================================
   SIDEBAR – PHÂN BỔ THEO TỔ (SIDEBAR MỚI)
   ========================================================= */
function renderTeamLegend(units) {
  const box = document.getElementById("teamLegendList");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    if (!u.byTeam) return;

    Object.keys(u.byTeam).forEach(team => {
      const cong = u.byTeam[team];
      if (!cong || cong <= 0) return;

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
   CARD TỪNG CĂN
   ========================================================= */
function buildUnitCard(u) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${u.maCan}</h2>

    <!-- DÒNG 1: THỜI GIAN -->
    <div style="font-size:.75rem;opacity:.85;margin-bottom:4px">
      Bắt đầu: ${fmtDate(u.start)} |
      Hoàn thành: ${fmtDate(u.end)}
    </div>

    <!-- DÒNG 2: CÔNG + TRẠNG THÁI -->
    <div style="font-size:.8rem;margin-bottom:8px">
      Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
      |
      <span style="color:${
        u.status === "red" ? "#ef4444" :
        u.status === "yellow" ? "#eab308" :
        "#22c55e"
      }">
        ${u.statusText}
      </span>
    </div>

    <!-- BIỂU ĐỒ NGANG -->
    <div style="display:flex;gap:12px">
      <!-- CHI TIÊU -->
      <div style="flex:1">
        <div style="font-size:.7rem;margin-bottom:4px">
          Chi tiêu (VNĐ)
        </div>
        <div class="chart-wrap" style="height:140px">
          <canvas class="costChart"></canvas>
        </div>
      </div>

      <!-- CÔNG -->
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
   BIỂU ĐỒ THEO TỔ
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
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
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
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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
