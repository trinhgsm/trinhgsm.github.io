const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

let unitOverviewChart = null;
let projectChart = null;

/* LOAD DASHBOARD */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  renderProjectCard(json.project);

  const cardsBox = document.getElementById("unitCards");
  cardsBox.innerHTML = "";

  json.units.forEach(u => {
    cardsBox.appendChild(buildCard(u));
  });

  setTimeout(() => {
    renderUnitOverview(json.units);
  }, 0);
}

/* BUILD CARD */
function buildCard(u) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${u.maCan}</h2>

    <div class="line">
      <span>Bắt đầu ${fmtDate(u.start)}</span>
      <span>Hoàn thành ${fmtDate(u.end)}</span>
    </div>

    <div class="line">
      <span>
        Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
      </span>
      <span class="status ${u.status}">
        ${u.statusText}
      </span>
    </div>

    <div class="unit-layout">
      <div class="unit-alerts"></div>

      <div class="unit-chart">
        <canvas></canvas>
      </div>

      <div class="unit-legend"></div>
    </div>
  `;

  renderAlerts(card, u);
  drawTeamChart(
    card.querySelector(".unit-chart canvas"),
    u.byTeam,
    card.querySelector(".unit-legend")
  );

  return card;
}

/* ALERTS */
function renderAlerts(card, u) {
  const alerts = [];
  if (u.status === "yellow") alerts.push("⚠ Rủi ro tiến độ");
  if (u.status === "red") alerts.push("⛔ Không đạt tiến độ");
  if (u.warnCong) alerts.push("⚠ Sắp vượt dự tính công");
  if (u.warnCost) alerts.push("⚠ Sắp vượt dự tính chi phí");

  const box = card.querySelector(".unit-alerts");
  box.innerHTML = alerts.length
    ? alerts.map(a => `<div>${a}</div>`).join("")
    : "<div style='opacity:.4'>Không có cảnh báo</div>";
}

/* COLOR GEN */
function genColors(n) {
  return Array.from({ length: n }, (_, i) =>
    `hsl(${Math.round(i * 360 / n)},70%,55%)`
  );
}

/* DOUGHNUT + LEGEND */
function drawTeamChart(canvas, byTeam, legendBox) {
  const labels = Object.keys(byTeam);
  const values = Object.values(byTeam);
  const colors = genColors(labels.length);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });

  legendBox.innerHTML = "";
  labels.forEach((name, i) => {
    legendBox.innerHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background:${colors[i]}"></div>
        <div class="legend-text">
          ${name}<br>${values[i]} công
        </div>
      </div>
    `;
  });
}

/* OVERVIEW BAR */
function renderUnitOverview(units) {
  const canvas = document.getElementById("unitOverviewChart");
  if (!canvas) return;

  if (unitOverviewChart) unitOverviewChart.destroy();

  unitOverviewChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: units.map(u => u.maCan),
      datasets: [{
        data: units.map(u => u.percent),
        backgroundColor: units.map(u =>
          u.status === "red" ? "#ef4444" :
          u.status === "yellow" ? "#eab308" : "#22c55e"
        )
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

/* PROJECT CARD */
function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  box.innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <div class="line">
      Công: ${p.actualCong} / ${p.plannedCong} (${p.percent}%)
    </div>
    <div class="status ${p.status}">
      ${textStatus(p.status)}
    </div>
    <canvas id="projectChart"></canvas>
  `;

  if (projectChart) projectChart.destroy();

  projectChart = new Chart(
    document.getElementById("projectChart"),
    {
      type: "doughnut",
      data: {
        datasets: [{
          data: [p.actualCong, p.plannedCong - p.actualCong],
          backgroundColor: ["#22c55e", "#1f2937"]
        }]
      },
      options: { plugins: { legend: { display: false } } }
    }
  );
}

/* HELPERS */
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

/* START */
loadDashboard();
