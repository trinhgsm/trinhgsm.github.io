/* =========================================================
   CAN.JS – FULL (DƯƠNG LỊCH TRƯỚC, ÂM + PDF SAU, FIX MATCH NGÀY)
   Yêu cầu:
   - Dương lịch render ngay (ổn định bố cục)
   - Âm lịch render ngay sau (từ amlich.js)
   - PDF load sau cùng, match CHUỖI NGÀY ĐẦY ĐỦ d.m.y
   ========================================================= */

const API_URL = window.APP_CONFIG.api.dashboard();

let chart = null;
let calYear, calMonth;

/* ================= UTIL ================= */
function getMaCan() {
  const p = new URLSearchParams(location.search).get("ma");
  return p ? p.toUpperCase() : null;
}
function fmtDate(d) {
  if (!d) return "--";
  const [y, m, dd] = d.split("-");
  return `${dd}-${m}-${y}`;
}

/* ================= LOAD CĂN ================= */
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
  if (site && site.summary) tickerStatus += " – " + site.summary;
  document.getElementById("tickerText").textContent =
    `${unit.maCan}: ${unit.percent || 0}% – ${tickerStatus}`;

  // chỉ huy
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

/* ================= CHART ================= */
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

/* ================= CALENDAR ================= */

/* INIT */
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

/* RENDER 1 THÁNG – DƯƠNG LỊCH TRƯỚC */
function renderCalendarMonth() {
  const box = document.getElementById("calendar");
  box.innerHTML = "";

  document.getElementById("calTitle").textContent =
    `Tháng ${calMonth + 1}/${calYear}`;

  const first = new Date(calYear, calMonth, 1);
  const offset = (first.getDay() + 6) % 7; // Thứ 2 = 0
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ===== render khung trước =====
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const cell = document.createElement("div");
    cell.className = "cal-day";

    if (d.getMonth() !== calMonth) cell.classList.add("other");
    if (d.getTime() === today.getTime()) cell.classList.add("today");
    if (d > today) cell.classList.add("future");
    else cell.classList.add("no-pdf");

    const solar = document.createElement("div");
    solar.className = "solar";
    solar.textContent = d.getDate();

    const lunar = document.createElement("div");
    lunar.className = "lunar";
    lunar.textContent = "";

    cell.appendChild(solar);
    cell.appendChild(lunar);

    box.appendChild(cell);
    cells.push({ cell, date: d, lunar });
  }

  // ===== gắn âm lịch =====
  cells.forEach(o => {
    const [ld] = solar2lunar(
      o.date.getDate(),
      o.date.getMonth() + 1,
      o.date.getFullYear(),
      7
    );
    o.lunar.textContent = ld;
  });

  // ===== gắn PDF (LOAD SAU) =====
  attachPdfLinks(cells);
}

/* ================= PDF ================= */
async function attachPdfLinks(cells) {
  const maCan = getMaCan();

  for (const o of cells) {
    if (o.date > new Date()) continue;

    const d = o.date;
    const day = d.getDate();
    const monthKey = (d.getMonth() + 1) + "-" + d.getFullYear();

    const pdfUrl =
      window.APP_CONFIG.api.root() +
      "?action=pdf" +
      "&month=" + encodeURIComponent(monthKey) +
      "&unit=" + encodeURIComponent(maCan) +
      "&day=" + day; // 🔴 KHÔNG PAD – GAS MATCH d.m.y

    try {
      const res = await fetch(pdfUrl);
      const text = await res.text();
      if (text.startsWith("{")) {
        const js = JSON.parse(text);
        if (js.url) {
          o.cell.classList.remove("no-pdf");
          o.cell.classList.add("has-pdf");
          o.cell.onclick = () => window.open(js.url, "_blank");
        }
      }
    } catch (e) {}
  }
}

/* ================= QR ================= */
function toggleQR() {
  const box = document.getElementById("qrBox");
  if (!box.classList.contains("hidden")) {
    box.classList.add("hidden");
    return;
  }
  box.innerHTML =
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(location.href)}">`;
  box.classList.remove("hidden");
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", initCalendar);
document.addEventListener("DOMContentLoaded", loadCan);
