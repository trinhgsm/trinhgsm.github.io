const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

/* ================= GLOBAL CHART ================= */
let unitOverviewChart = null;
let projectChart = null;

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  /* 1. CARD TỔNG */
  renderProjectCard(json.project);

  /* 2. BIỂU ĐỒ TỔNG QUAN (1 LẦN) */
  setTimeout(() => {
    renderUnitOverview(json.units);
  }, 0);

  /* 3. CARD TỪNG CĂN */
  const cardsBox = document.getElementById("unitCards");
  cardsBox.innerHTML = "";

  json.units.forEach(unit => {
    cardsBox.appendChild(buildCard(unit));
  });
}

/* ================= BUILD CARD ================= */
function buildCard(u) {
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

    ${(u.warnCong || u.warnCost) ? `
      <div class="warning">
        ${u.warnCong ? "⚠️ Sắp vượt dự tính công" : ""}
        ${u.warnCost ? " ⚠️ Sắp vượt dự tính chi phí" : ""}
      </div>
    ` : ""}

    <canvas class="teamChart" height="160"></canvas>

    <div class="meta">Chi phí (VNĐ)</div>
    <canvas class="costChart" height="120"></canvas>
  `;

  drawTeamChart(card.querySelector(".teamChart"), u.byTeam);
  drawCostChart(card.querySelector(".costChart"), u.plannedCost, u.actualCost);

  return card;
}

/* ================= BIỂU ĐỒ THEO TỔ ================= */
function drawTeamChart(canvas, byTeam) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: Object.keys(byTeam),
      datasets: [{
        data: Object.values(byTeam),
        backgroundColor: [
          "#38bdf8", "#22c55e", "#eab308", "#ef4444", "#a855f7"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

/* ================= BIỂU ĐỒ CHI PHÍ ================= */
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
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* ================= BIỂU ĐỒ TỔNG QUAN ================= */
function renderUnitOverview(units) {
  const canvas = document.getElementById("unitOverviewChart");
  if (!canvas) return;

  if (unitOverviewChart) {
    unitOverviewChart.destroy();
  }

  unitOverviewChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: units.map(u => u.maCan),
      datasets: [{
        label: "Tiến độ (%)",
        data: units.map(u => u.percent),
        backgroundColor: units.map(u => {
          if (u.status === "red") return "#ef4444";
          if (u.status === "yellow") return "#eab308";
          return "#22c55e";
        })
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
        x: {
          ticks: { autoSkip: false, maxRotation: 45, minRotation: 30 }
        }
      }
    }
  });
}

/* ================= CARD TỔNG DỰ ÁN ================= */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  box.innerHTML = `
    <div class="card">
      <h2>TỔNG DỰ ÁN</h2>
      <div class="meta">
        Công: ${p.actualCong} / ${p.plannedCong} (${p.percent}%)
      </div>
      <div class="meta status ${p.status}">
        ${textStatus(p.status)}
      </div>
      <canvas id="projectChart" height="180"></canvas>
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
          backgroundColor: [
            p.status === "red" ? "#ef4444" :
            p.status === "yellow" ? "#eab308" : "#22c55e",
            "#1f2937"
          ]
        }]
      },
      options: { plugins: { legend: { position: "bottom" } } }
    }
  );
}

/* ================= HELPER ================= */
function fmtDate(d) {
  if (!d) return "?";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function textStatus(s) {
  if (s === "red") return "Không đạt tiến độ";
  if (s === "yellow") return "Chậm tiến độ";
  return "Đang thi công";
}

/* ================= START ================= */
loadDashboard();
