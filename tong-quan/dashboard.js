const API_URL =
  "https://script.google.com/macros/s/AKfycbzIAc6J2sYYj5GRmdGGAAVvXewyuwHVMQHMk_5kiCKaDU37MjNzu643FGOZDp80Q0oBEw/exec?action=dashboard";

async function loadDashboard() {
  const res = await fetch(API_URL);
  const json = await res.json();

  document.getElementById("genTime").textContent =
    "Cập nhật: " + new Date(json.generatedAt).toLocaleString();

  const board = document.getElementById("board");
  board.innerHTML = "";

  json.units.forEach(unit => {
    board.appendChild(buildCard(unit));
  });
}
function buildCard(u) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>${u.maCan}</h2>

    <!-- DÒNG 1: THỜI GIAN -->
    <div class="line">
      <span class="date">
        Bắt đầu ${fmtDate(u.start)}
      </span>
      <span class="date">
        Hoàn thành ${fmtDate(u.end)}
      </span>
    </div>

    <!-- DÒNG 2: CÔNG + TRẠNG THÁI -->
    <div class="line">
      <span class="work">
        Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
      </span>
      <span class="status ${u.status}">
        ${u.statusText || textStatus(u.status)}
      </span>
    </div>

    <!-- CẢNH BÁO PHỤ -->
    ${(u.warnCong || u.warnCost) ? `
      <div class="warning">
        ${u.warnCong ? "⚠️ Sắp vượt dự tính công" : ""}
        ${u.warnCost ? " ⚠️ Sắp vượt dự tính chi phí" : ""}
      </div>
    ` : ""}

    <!-- BIỂU ĐỒ CÔNG THEO TỔ -->
    <canvas class="teamChart" height="160"></canvas>

    <!-- BIỂU ĐỒ CHI PHÍ -->
    <div class="meta">Chi phí (VNĐ)</div>
    <canvas class="costChart" height="120"></canvas>
  `;

  drawChart(card.querySelector(".teamChart"), u.byTeam);

  drawCostChart(
    card.querySelector(".costChart"),
    u.plannedCost,
    u.actualCost
  );

  return card;
}


function drawChart(canvas, byTeam) {
  const labels = Object.keys(byTeam);
  const values = Object.values(byTeam);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#38bdf8", "#22c55e", "#eab308", "#ef4444", "#a855f7"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function textStatus(s) {
  if (s === "green") return "Đang làm";
  if (s === "yellow") return "Gần xong";
  return "Trễ";
}

loadDashboard();
function fmtDate(d) {
  if (!d) return "?";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function renderProjectCard(p) {
  const box = document.getElementById("projectCard");
  box.innerHTML = `
    <div class="card">
      <h2>TỔNG DỰ ÁN</h2>
      <div class="meta">
        Công: ${p.actualCong} / ${p.plannedCong} (${p.percent}%)
      </div>
      <div class="meta status ${p.status}">
        Trạng thái: ${textStatus(p.status)}
      </div>
      <canvas id="projectChart" height="180"></canvas>
    </div>
  `;

  new Chart(document.getElementById("projectChart"), {
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
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}
function drawCostChart(canvas, planned, actual) {
  if (!canvas) return;

  const over = actual > planned;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Dự tính", "Đã chi"],
      datasets: [{
        data: [planned, actual],
        backgroundColor: [
          "#38bdf8",
          over ? "#ef4444" : "#22c55e"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx =>
              ctx.raw.toLocaleString("vi-VN") + " đ"
          }
        }
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
function renderUnitOverview(units) {
  const ctx = document.getElementById("unitOverviewChart");
  if (!ctx) return;

  const labels = units.map(u => u.maCan);
  const values = units.map(u => u.percent);

  const colors = units.map(u => {
    if (u.status === "red") return "#ef4444";     // Không đạt tiến độ
    if (u.status === "yellow") return "#eab308";  // Chậm tiến độ
    return "#22c55e";                             // Đang thi công
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Tiến độ (%)",
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: "Phần trăm tiến độ"
          }
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 30
          }
        }
      }
    }
  });
}
