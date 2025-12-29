const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

let unitOverviewChart = null;
let projectChart = null;

/* ================= LOAD ================= */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  renderProjectCard(json.project);
  renderUnitOverview(json.units);
  renderWarnings(json.units);
  renderLegend(json.units);

  const box = document.getElementById("unitCards");
  box.innerHTML = "";
  json.units.forEach(u => box.appendChild(buildUnitCard(u)));
}

/* ================= TỔNG DỰ ÁN ================= */
function renderProjectCard(p) {
  document.getElementById("projectCard").innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <canvas id="projectChart"></canvas>
  `;

  if (projectChart) projectChart.destroy();

  projectChart = new Chart(
    document.getElementById("projectChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Đã làm", "Còn lại"],
        datasets: [{
          data: [p.actualCong, Math.max(0, p.plannedCong - p.actualCong)],
          backgroundColor: ["#22c55e", "#1f2937"]
        }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    }
  );
}

/* ================= TỔNG QUAN ================= */
function renderUnitOverview(units) {
  if (unitOverviewChart) unitOverviewChart.destroy();

  unitOverviewChart = new Chart(
    document.getElementById("unitOverviewChart"),
    {
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
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    }
  );
}

/* ================= SIDEBAR ================= */
function renderWarnings(units) {
  const box = document.getElementById("warningList");
  const risks = units.filter(u => u.status !== "green");

  if (!risks.length) {
    box.innerHTML = "✅ Không có rủi ro tiến độ";
    return;
  }

  box.innerHTML = risks.map(u =>
    `<div class="warning-item">• ${u.maCan} – ${u.statusText}</div>`
  ).join("");
}

function renderLegend(units) {
  const box = document.getElementById("legendList");
  box.innerHTML = "";

  units.forEach(u => {
    const color =
      u.status === "red" ? "#ef4444" :
      u.status === "yellow" ? "#eab308" : "#22c55e";

    box.innerHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background:${color}"></div>
        ${u.maCan} – ${u.actualCong} công
      </div>
    `;
  });
}

/* ================= CARD CĂN ================= */
function buildUnitCard(u) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <h2>${u.maCan}</h2>
    <div>Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)</div>
    <div>Trạng thái: ${u.statusText}</div>
  `;

  return div;
}

/* ================= START ================= */
loadDashboard();
