const API_URL = window.APP_CONFIG.api.dashboard();

let chart = null;
let calYear, calMonth;

/* ========= UTIL ========= */
function getMaCan() {
  const p = new URLSearchParams(location.search).get("ma");
  return p ? p.toUpperCase() : null;
}

function fmtDate(d) {
  if (!d) return "--";
  const [y, m, dd] = d.split("-");
  return `${dd}-${m}-${y}`;
}

/* ========= LOAD ========= */
async function loadCan() {
  const maCan = getMaCan();
  if (!maCan) {
    document.body.innerHTML = "❌ Thiếu mã căn (?ma=)";
    return;
  }

  const res = await fetch(API_URL);
  const data = await res.json();
  const unit = data.units.find(u => u.maCan.toUpperCase() === maCan);

  if (!unit) {
    document.body.innerHTML = "❌ Không tìm thấy căn";
    return;
  }

  const site = data.sites ? data.sites[unit.maCan] : null;

  document.getElementById("maCanText").textContent = "Mã căn: " + unit.maCan;
  document.getElementById("percent").textContent = (unit.percent || 0) + "%";
  document.getElementById("statusText").textContent = unit.statusText || "--";
  document.getElementById("updateTime").textContent =
    "Cập nhật: " + (data.generatedAt || "--");

  document.getElementById("startDate").textContent = fmtDate(unit.start);
  document.getElementById("endDate").textContent = fmtDate(unit.end);
  document.getElementById("congText").textContent =
    `${unit.actualCong || 0}/${unit.plannedCong || 0}`;

  let siteStatusText = "--";
  if (site && typeof site.diffDays === "number") {
    if (site.diffDays === 0) siteStatusText = "Hôm nay có thi công";
    else if (site.diffDays === 1) siteStatusText = "Hôm qua có thi công";
    else siteStatusText = site.diffDays + " ngày chưa thi công";
  }

  document.getElementById("siteStatus").textContent = siteStatusText;

  let tickerStatus = siteStatusText;
  if (site && site.summary) {
    tickerStatus += " – " + site.summary;
  }

  document.getElementById("tickerText").textContent =
    `${unit.maCan}: ${unit.percent || 0}% – ${tickerStatus}`;

  const m1 = document.getElementById("manager1");
  const m2 = document.getElementById("manager2");
  const p1 = document.getElementById("manager1Phone");
  const p2 = document.getElementById("manager2Phone");

  m1.textContent = unit.manager1 || "--";
  if (unit.manager1Phone) {
    p1.textContent = unit.manager1Phone;
    p1.href = "tel:" + unit.manager1Phone;
    p1.style.display = "inline-flex";
  } else p1.style.display = "none";

  m2.textContent = unit.manager2 || "--";
  if (unit.manager2Phone) {
    p2.textContent = unit.manager2Phone;
    p2.href = "tel:" + unit.manager2Phone;
    p2.style.display = "inline-flex";
  } else p2.style.display = "none";

  document.getElementById("logList").innerHTML = `
    <li>Tiến độ: ${unit.percent || 0}%</li>
    <li>Công: ${unit.actualCong || 0}/${unit.plannedCong || 0}</li>
    <li>${unit.statusText || "--"}</li>
  `;

  drawChart(unit.byTeam || {});
}

/* ========= CHART ========= */
function drawChart(byTeam) {
  const ctx = document.getElementById("teamChart");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(byTeam),
      datasets: [{
        label: "Công theo tổ",
        data: Object.values(byTeam),
        backgroundColor: "#38bdf8"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* ================= CALENDAR + PDF ================= */

function initCalendar() {
  const today = new Date();
  calYear = today.getFullYear();
  calMonth = today.getMonth();

  document.getElementById("prevMonth").onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendarMonth();
  };

  document.getElementById("nextMonth").onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendarMonth();
  };

  renderCalendarMonth();
}

async function renderCalendarMonth() {
  const box = document.getElementById("calendar");
  box.innerHTML = "";

  document.getElementById("calTitle").textContent =
    `Tháng ${calMonth + 1}/${calYear}`;

  const firstOfMonth = new Date(calYear, calMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startOffset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maCan = getMaCan();

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const d0 = new Date(d);
    d0.setHours(0, 0, 0, 0);

    const cell = document.createElement("div");
    cell.className = "cal-day";

    if (d.getMonth() !== calMonth) cell.classList.add("other");
    if (d0.getTime() === today.getTime()) cell.classList.add("today");

    const solar = document.createElement("div");
    solar.className = "solar";
    solar.textContent = d.getDate();

    const [lunarDay] = solar2lunar(
      d.getDate(),
      d.getMonth() + 1,
      d.getFullYear(),
      7
    );

    const lunar = document.createElement("div");
    lunar.className = "lunar";
    lunar.textContent = lunarDay;

    cell.appendChild(solar);
    cell.appendChild(lunar);

    if (d0 > today) {
      cell.classList.add("future");
    } else {
      cell.classList.add("no-pdf");
    }

    const monthKey = (d.getMonth() + 1) + "-" + d.getFullYear();
    const dayStr = String(d.getDate()).padStart(2, "0");

    const pdfUrl =
      window.APP_CONFIG.api.root() +
      "?action=pdf" +
      "&month=" + encodeURIComponent(monthKey) +
      "&unit=" + encodeURIComponent(maCan) +
      "&day=" + dayStr;

    try {
      const res = await fetch(pdfUrl);
      const text = await res.text();
      if (text.startsWith("{")) {
        const js = JSON.parse(text);
        if (js.url) {
          cell.classList.remove("no-pdf");
          cell.classList.add("has-pdf");
          cell.onclick = () => window.open(js.url, "_blank");
        }
      }
    } catch (e) {}

    box.appendChild(cell);
  }
}

/* ========= QR ========= */
function toggleQR() {
  const box = document.getElementById("qrBox");
  if (!box.classList.contains("hidden")) {
    box.classList.add("hidden");
    return;
  }
  const url = location.href;
  box.innerHTML =
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}">`;
  box.classList.remove("hidden");
}

/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", initCalendar);
document.addEventListener("DOMContentLoaded", loadCan);