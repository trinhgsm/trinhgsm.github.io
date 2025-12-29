/************************************************************
 * DUKICO – DASHBOARD TIẾN ĐỘ
 * FULL JS – TÁCH SIDEBAR THEO HÀNG
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

  /* TIME */
  const gen = document.getElementById("genTime");
  if (gen) {
    gen.textContent =
      "Cập nhật: " + new Date(json.generatedAt).toLocaleString();
  }

  /* ===== HÀNG 1 ===== */
  renderProjectCard(json.project);
  renderUnitOverview(json.units);
  renderSummaryWarnings(json.units);

  /* ===== HÀNG 2 ===== */
  renderUnitCards(json.units);
  renderDetailLegendByUnit(json.units);
  renderDetailLegendByTeam(json.units);
}

/* =========================================================
   HÀNG 1 – TỔNG DỰ ÁN
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
   HÀNG 1 – BIỂU ĐỒ TỔNG QUAN
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
        y: { beginAtZero: true, max: 100 },
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
   HÀNG 1 – SIDEBAR: CẢNH BÁO
   ========================================================= */
function renderSummaryWarnings(units) {
  const box = document.getElementById("sidebarSummary");
  if (!box) return;

  // clone mảng để không ảnh hưởng nơi khác
  const list = [...units];

  // sắp xếp theo mức độ rủi ro
  list.sort((a, b) => {
    // ưu tiên trạng thái
    const rank = s =>
      s === "red" ? 3 :
      s === "yellow" ? 2 : 1;

    const r = rank(b.status) - rank(a.status);
    if (r !== 0) return r;

    // nếu cùng trạng thái → % công thấp hơn nguy hiểm hơn
    return a.percent - b.percent;
  });

  // lấy tối đa 5 dòng cho đẹp
  const MAX = 5;
  const rows = [];

  for (let i = 0; i < list.length && rows.length < MAX; i++) {
    const u = list[i];
    rows.push(`
      <div class="warning-item ${u.status}">
        • <strong>${u.maCan}</strong> – ${u.statusText}
      </div>
    `);
  }

  // nếu vẫn thiếu dòng → đổ thêm căn bình thường
  if (rows.length < MAX) {
    units.forEach(u => {
      if (rows.length >= MAX) return;
      if (list.includes(u)) return;

      rows.push(`
        <div class="warning-item green">
          • <strong>${u.maCan}</strong> – Đang thi công
        </div>
      `);
    });
  }

  box.innerHTML = rows.join("");
}


/* =========================================================
   HÀNG 2 – CARD CÁC CĂN
   ========================================================= */
function renderUnitCards(units) {
  const box = document.getElementById("unitCards");
  if (!box) return;

  box.innerHTML = "";
  units.forEach(u => box.appendChild(buildUnitCard(u)));
}

/* =========================================================
   HÀNG 2 – SIDEBAR: THEO CĂN
   ========================================================= */
function renderDetailLegendByUnit(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;
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
  });

  box.innerHTML = html;
}

/* =========================================================
   HÀNG 2 – SIDEBAR: THEO TỔ
   ========================================================= */
function renderDetailLegendByTeam(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;

  let html = box.innerHTML + `<h3 style="margin-top:8px">PHÂN BỔ THEO TỔ</h3>`;

  units.forEach(u => {
    if (!u.byTeam) return;

    Object.keys(u.byTeam).forEach(team => {
      const cong = u.byTeam[team];
      if (!cong || cong <= 0) return;

      html += `
        <div class="legend-item">
          <div class="legend-color"></div>
          <div>
            <strong>TỔ ${team.toUpperCase()}</strong> – ${u.maCan}<br>
            ${cong} công
          </div>
        </div>
      `;
    });
  });

  box.innerHTML = html;
}

/* =========================================================
   CARD TỪNG CĂN
   ========================================================= */
function buildUnitCard(u) {
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
      <span style="color:${
        u.status === "red" ? "#ef4444" :
        u.status === "yellow" ? "#eab308" :
        "#22c55e"
      }">
        ${u.statusText}
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
        y: { beginAtZero: true }
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
