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
    <div class="meta">
      ${u.start || "?"} → ${u.end || "?"}
    </div>
    <div class="meta">
      Công: ${u.actualCong} / ${u.plannedCong} (${u.percent}%)
    </div>
    <div class="meta status ${u.status}">
      Trạng thái: ${textStatus(u.status)}
    </div>
    <canvas height="160"></canvas>
  `;

  drawChart(card.querySelector("canvas"), u.byTeam);
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
