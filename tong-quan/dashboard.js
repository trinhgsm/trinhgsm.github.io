const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

let unitOverviewChart = null;

/* LOAD */
async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  renderProjectCard(json.project);

  const box = document.getElementById("unitCards");
  box.innerHTML = "";

  json.units.forEach(u => box.appendChild(buildCard(u)));

  setTimeout(() => renderUnitOverview(json.units), 0);
}

/* CARD CĂN */
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
      <span>Công: ${u.actualCong}/${u.plannedCong} (${u.percent}%)</span>
      <span class="status ${u.status}">${u.statusText}</span>
    </div>

    <div class="unit-layout">
      <div class="unit-alerts"></div>
      <div class="unit-chart"><canvas></canvas></div>
      <div class="unit-legend"></div>
    </div>
  `;

  renderAlerts(card, u);
  drawTeamChart(
    card.querySelector("canvas"),
    u.byTeam,
    card.querySelector(".unit-legend")
  );

  return card;
}

/* ALERT */
function renderAlerts(card, u) {
  const arr = [];
  if (u.status === "yellow") arr.push("⚠ Rủi ro tiến độ");
  if (u.status === "red") arr.push("⛔ Không đạt tiến độ");
  if (u.warnCong) arr.push("⚠ Sắp vượt công");
  if (u.warnCost) arr.push("⚠ Sắp vượt chi phí");

  card.querySelector(".unit-alerts").innerHTML =
    arr.length ? arr.map(a => `<div>${a}</div>`).join("") :
    "<div style='opacity:.4'>Không có cảnh báo</div>";
}

/* COLOR */
function genColors(n) {
  return Array.from({ length: n }, (_, i) =>
    `hsl(${Math.round(i * 360 / n)},70%,55%)`
  );
}

/* DOUGHNUT */
function drawTeamChart(canvas, byTeam, legendBox) {
  const labels = Object.keys(byTeam);
  const values = Object.values(byTeam);
  const colors = genColors(labels.length);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });

  legendBox.innerHTML = "";
  labels.forEach((n, i) => {
    legendBox.innerHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background:${colors[i]}"></div>
        <div class="legend-text">${n}<br>${values[i]} công</div>
      </div>
    `;
  });
}

/* OVERVIEW */
function renderUnitOverview(units) {
  const c = document.getElementById("unitOverviewChart");
  if (unitOverviewChart) unitOverviewChart.destroy();

  unitOverviewChart = new Chart(c, {
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

/* PROJECT */
function renderProjectCard(p) {
  document.getElementById("projectCard").innerHTML = `
    <h2>TỔNG DỰ ÁN</h2>
    <div class="line">Công: ${p.actualCong}/${p.plannedCong} (${p.percent}%)</div>
    <div class="status ${p.status}">${textStatus(p.status)}</div>
    <canvas id="projectChart"></canvas>
  `;
}

/* UTIL */
function fmtDate(d) {
  if (!d) return "?";
  const [y,m,dd] = d.split("-");
  return `${dd}-${m}-${y}`;
}
function textStatus(s) {
  return s === "red" ? "Không đạt" :
         s === "yellow" ? "Chậm" : "Đang làm";
}

loadDashboard();
