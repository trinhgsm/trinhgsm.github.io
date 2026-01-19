/************************************************************
 * DUKICO DASHBOARD – FRONTEND JS (FINAL – CLEAN)
 * QUẢN LÝ UI + DASHBOARD + NÚT SHEET
 ************************************************************/

/* ========= CONFIG ========= */
const API_URL = window.APP_CONFIG?.api?.dashboard;

if (!API_URL) {
  console.error("❌ Thiếu cấu hình API dashboard trong APP_CONFIG");
  throw new Error("APP_CONFIG.api.dashboard not found");
}

/* ========= STATE ========= */
let projectChart = null;
let unitOverviewChart = null;
let SITE_MAP = {};

/* =========================================================
   🔴 TRUNG TÂM QUẢN LÝ NÚT SHEET (DUY NHẤT)
   ========================================================= */
function updateOpenSheetBtnVisibility() {
  const btn = document.getElementById("openSheetBtn");
  if (!btn) return;

  const loadingVisible =
    document.getElementById("loadingOverlay")?.classList.contains("show");

  const sheetOpen =
    document.body.classList.contains("sheet-open");

  const appLocked =
    document.body.classList.contains("app-locked");

  if (loadingVisible || sheetOpen || appLocked) {
    btn.style.display = "none";
  } else {
    btn.style.display = "";
  }
}

/* =========================================================
   LOAD DASHBOARD
   ========================================================= */
async function loadDashboard() {
  const dash = document.getElementById("dashboard");
  if (dash) dash.classList.add("loading");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data || !data.units) return;

    SITE_MAP = data.sites || {};

    updateTime(data.generatedAt);
    renderUnitOverview(data.units);
    renderProjectStatusChart(data.units);
    renderWarnings(data.units, SITE_MAP);
    renderUnitCards(data.units, SITE_MAP);
    renderSidebarDetail(data.units);
    renderActivityTicker(SITE_MAP);
    renderSiteStatusExtension(data.units);

    // 🔔 BÁO DASHBOARD ĐÃ SẴN SÀNG
    document.dispatchEvent(new Event("dashboard-ready"));

  } catch (err) {
    console.error(err);
  } finally {
    if (dash) dash.classList.remove("loading");
  }
}

/* =========================================================
   TIME
   ========================================================= */
function updateTime(ts) {
  const el = document.getElementById("genTime");
  if (!el) return;

  const d = new Date(ts);
  el.innerHTML = `
    <span class="label">Cập nhật:</span>
    <span class="time">${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}</span>
    <span class="date">${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}</span>
  `;
}
/* =========================================================
   OVERVIEW BAR CHART – TIẾN ĐỘ %
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
        data: units.map(u => u.percent || 0),
        backgroundColor: units.map(u => {
          if (u.status === "red-blink") return "#ef4444";
          if (u.status === "red") return "#ef4444";
          if (u.status === "yellow") return "#eab308";
          return "#22c55e";
        })
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,



      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100 },
        x: { ticks: { autoSkip: true, maxRotation: 45 } }
      }
    }
  });
}
/* =========================================================
   PROJECT STATUS CHART – BAR + MULTI LINE
   ========================================================= */
function renderProjectStatusChart(units) {
  //console.log("🔥 renderProjectStatusChart CALLED", units.length);

  const canvas = document.getElementById("projectStatusChart");
  if (!canvas || !units || !units.length) return;

  const labels = units.map(u => u.maCan);

  // ===== BAR: trạng thái căn =====
  const barData = units.map(() => 1);
  const barColors = units.map(u => {
    if (u.status === "red" || u.status === "red-blink") return "#ef4444";
    if (u.status === "yellow") return "#eab308";
    return "#22c55e";
  });

  // ===== LINE 1: TIẾN ĐỘ =====
  const lineProgress = units.map(u => u.level ?? 1);

  // ===== LINE 2: NỢ NCC =====
  const lineDebtNCC = units.map(u => {
    if (!u.totalPlan) return 0;
    const r = u.debtNCC / u.totalPlan;
    if (r >= 0.7) return 4;
    if (r >= 0.5) return 3;
    if (r >= 0.3) return 2;
    if (r >= 0.1) return 1;
    return 0;
  });

  // ===== LINE 3: CĐT NỢ =====
  const lineDebtCDT = units.map(u => {
    if (!u.totalPlan) return 0;
    const r = u.debtCDT / u.totalPlan;
    if (r >= 0.8) return 4;
    if (r >= 0.6) return 3;
    if (r >= 0.4) return 2;
    if (r >= 0.2) return 1;
    return 0;
  });

  new Chart(canvas, {
    data: {
      labels,
      datasets: [
        {
  type: "bar",
  label: "Trạng thái căn",
  data: barData,
  backgroundColor: barColors,
  barThickness: 16

  // 🔴 QUAN TRỌNG: TẮT TOOLTIP CỦA CỘT
  //tooltip: {
   // enabled: false
  //},

  //order: 10,
},

        {
          type: "line",
          label: "Tiến độ",
          data: lineProgress,
          borderColor: "#60a5fa",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
         // order: 10 // line vẽ sau
        },
        {
          type: "line",
          label: "Nợ NCC",
          data: lineDebtNCC,
          borderColor: "#f97316",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
          //order: 10 // line vẽ sau
        },
        {
          type: "line",
          label: "CĐT nợ",
          data: lineDebtCDT,
          borderColor: "#a855f7",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 2,
          yAxisID: "yInd"
         // order: 10 // line vẽ sau
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" }
      },
      scales: {
        y: { display: false },
        yInd: {
          position: "right",
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            callback: v => ["OK", "Nhẹ", "TB", "Cao", "Rất cao"][v]
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/* =========================================================
   SIDEBAR – CẢNH BÁO (TIẾN ĐỘ + TIỀN)
   ========================================================= */
function renderWarnings(units, siteMap) {
  const box = document.getElementById("sidebarSummary");
  if (!box) return;

  // ===== PHÂN NHÓM CẢNH BÁO =====

// TOP 1 – VƯỢT CHỈ TIÊU
const overLimit = [];

// TOP 2 – DỪNG THI CÔNG
const stopWork = [];

// TOP 3 – CÒN LẠI
const normal = [];

units.forEach(u => {
  const site = siteMap ? siteMap[u.maCan] : null;

  // 🚨 vượt chỉ tiêu (ưu tiên cao nhất)
  if (u.overCong || u.overCost || u.overDay) {
    overLimit.push(u);
    return;
  }

  // ⛔ dừng thi công
  if (site && site.diffDays >= 2) {
    stopWork.push(u);
    return;
  }

  normal.push(u);
});

// GHÉP THEO THỨ TỰ ƯU TIÊN
const finalList = [
  ...overLimit.sort((a, b) => b.level - a.level),
  ...stopWork.sort((a, b) => b.level - a.level),
  ...normal.sort((a, b) => b.level - a.level)
];


  box.innerHTML = finalList.map(u => {
    const site = siteMap ? siteMap[u.maCan] : null;
    // ===== LEVEL CUỐI CÙNG (KHÔNG GHI ĐÈ VƯỢT CHỈ TIÊU) =====
let level = u.level || 0;

// chỉ dùng diffDays nếu KHÔNG có vượt chỉ tiêu
if (!(u.overCong || u.overCost || u.overDay)) {
  if (site) {
    if (site.diffDays >= 3) level = 3;
    else if (site.diffDays === 2) level = 2;
    else if (site.diffDays === 1) level = 1;
  }
}


    return `
      <div class="warning-item level-${level}">
        <span class="dot level-${level}"></span>
        <div class="text">
          <strong>${u.maCan}</strong><br>

          ${site && site.diffDays >= 2
            ? "🚫 Dừng thi công"
            : u.statusText
          }

          ${site && site.diffDays > 0 ? `
            <div class="mini">
              ${site.diffDays === 0
                ? "Hôm nay có thi công"
                : site.diffDays + " ngày chưa thi công"}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");
}

/* =========================================================
   CARD MỖI CĂN
   ========================================================= */
function renderUnitCards(units, siteMap) {

  const box = document.getElementById("unitCards");
  if (!box) return;

  box.innerHTML = "";

  units.forEach(u => {
    const site = siteMap ? siteMap[u.maCan] : null;

let dayText = "";
let dayClass = "";

if (site) {
  if (site.diffDays === 0) {
    dayText = "Hôm nay có thi công";
    dayClass = "day-ok";
  } else if (site.diffDays === 1) {
    dayText = "1 ngày chưa thi công";
    dayClass = "day-warn";
  } else {
    dayText = site.diffDays + " ngày chưa thi công";
    dayClass = "day-danger";
  }
}

    const card = document.createElement("div");
    card.className = "card";
card.dataset.ma = u.maCan;
    card.innerHTML = `
      <h2 class="unit-title">
  <span class="ma-can">${u.maCan}</span>

  ${(u.manager1 || u.manager2) ? `
    <span class="manager-inline">
      ${u.manager1 ? `Chỉ huy trưởng: ${u.manager1}` : ""}
      ${u.manager1 && u.manager2 ? " | " : ""}
      ${u.manager2 ? `Trợ lý: ${u.manager2}` : ""}
    </span>
  ` : ""}
<button class="btn-qr" onclick="toggleCardQR(this)">
        QR
      </button>
      <div class="qr-box qr-hidden"></div>
</h2>

${site ? `
  <div class="site-status site-${site.status}">
    <span>
      ${site.diffDays === 0
        ? "Hôm nay có thi công"
        : site.diffDays + " ngày chưa thi công"}
      ${site.summary ? " – " + site.summary : ""}
    </span>
  </div>
` : ""}


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
      ${(u.overCong || u.overCost || u.overDay) ? `
<div class="line over-warning level-${u.level}">
  ${u.overCong ? `<span>⚠ Công</span>` : ""}
  ${u.overCost ? `<span>💰 Chi phí</span>` : ""}
  ${u.overDay  ? `<span>⏱ Thời gian</span>` : ""}
</div>
` : ""}

 <div class="finance">
        <div>
          <span class="label">Lãi / lỗ:</span>
          <span class="value ${u.profit < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.profit)}
          </span>
        </div>

        <div>
          <span class="label">Dòng tiền:</span>
          <span class="value ${u.cashFlow < 0 ? "debt" : ""}">
            ${fmtShortMoney(u.cashFlow)}
          </span>
        </div>

        <div>
          <span class="label">CĐT còn nợ:</span>
          <span class="value">
            ${fmtShortMoney(u.debtCDT)}
          </span>
        </div>
      </div>

      <div class="chart-row">
        <div class="chart-wrap">
          <canvas class="costChart"></canvas>
        </div>
        <div class="chart-wrap">
          <canvas class="teamChart"></canvas>
        </div>
      </div>
    `;

    box.appendChild(card);

    drawCostChart(
  card.querySelector(".costChart"),
  u.totalPlan,
  u.paidCost,
  u.debtNCC
);


    drawTeamChart(card.querySelector(".teamChart"), u.byTeam);
  });
}

/* =========================================================
   SIDEBAR DETAIL – TỔ ĐỘI
   ========================================================= */
function renderSidebarDetail(units) {
  const box = document.getElementById("sidebarDetail");
  if (!box) return;

  let html = "";

  units.forEach(u => {
    html += `
      <div class="legend-item">
        <strong>${u.maCan}</strong> – ${u.actualCong} công
      </div>
    `;

    if (u.byTeam) {
      Object.keys(u.byTeam).forEach(team => {
        html += `
          <div class="legend-sub">
            Tổ ${team.toUpperCase()}: ${u.byTeam[team]} công
          </div>
        `;
      });
    }
  });

  box.innerHTML = html;
}

/* =========================================================
   CHART HELPERS
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

function drawCostChart(canvas, totalPlan, paidCost, debtNCC) {
  if (!canvas) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Tổng dự tính", "Chi phí"],
      datasets: [

        // ===== TỔNG DỰ TÍNH (THAM CHIẾU) =====
        {
          label: "Tổng dự tính",
          data: [totalPlan || 0, null],
          backgroundColor: "#38bdf8",
          barThickness: 22
        },

        // ===== ĐÃ CHI (TIỀN ĐI RA) =====
        {
          label: "Đã chi",
          data: [null, paidCost || 0],
          backgroundColor: "#22c55e",
          stack: "cost",
          barThickness: 22
        },

        // ===== NỢ NCC (CŨNG LÀ CHI PHÍ) =====
        {
          label: "Nợ NCC",
          data: [null, debtNCC || 0],
          backgroundColor: "#ef4444",
          stack: "cost",
          barThickness: 22
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { boxWidth: 10, font: { size: 10 } }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              `${ctx.dataset.label}: ${fmtShortMoney(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { callback: v => fmtShortMoney(v) }
        }
      }
    }
  });
}


/* =========================================================
   UTIL
   ========================================================= */
function fmtDate(d) {
  if (!d) return "?";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function fmtShortMoney(n) {
  n = Number(n) || 0;
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(".0","") + " tỷ";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0","") + " triệu";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " k";
  return n.toString();
}

/* =========================================================
   START
   ========================================================= */
/************************************************************
(function () {
  const SECRET = "dukico@2025"; // 🔒 đổi nếu muốn

  function buildTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return md5(SECRET + y + m + day);
  }

  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");

  if (!key || key !== buildTodayKey()) {
    document.body.innerHTML = `
      <div style="
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#020617;
        color:#ef4444;
        font-family:system-ui;
        font-size:18px;
        letter-spacing:0.08em;
      ">
        ⛔ BẠN BỊ CẤM TRUY CẬP KO PHẢI NV DUKICO
      </div>
    `;
    throw new Error("Access denied");
  }
})();
* ko dùng md5)
 ************************************************************/
function renderSiteStatusExtension(units) {
  //console.log("🔥 renderSiteStatusExtension CALLED", units.length);

  if (!units || !units.length) return;
  if (!SITE_MAP) return;

  units.forEach(u => {
    const site = SITE_MAP[u.maCan];
    if (!site) return;

    // tìm card tương ứng theo tiêu đề mã căn
    const cards = document.querySelectorAll(".card h2");
    let cardEl = null;

    cards.forEach(h2 => {
      if (h2.textContent.trim() === u.maCan) {
        cardEl = h2.closest(".card");
      }
    });

    if (!cardEl) return;

    // tránh render trùng
    if (cardEl.querySelector(".site-status")) return;

    // xác định text + màu
    let text = "Chưa có dữ liệu thi công";
    let cls  = "site-none";

    if (site.diffDays === 0) {
      text = "Hôm nay có thi công";
      cls  = "site-green";
    } else {
      text = site.diffDays + " ngày không thi công";
      cls  = site.status === "yellow" ? "site-yellow" : "site-red";
    }

    // summary nếu có
    if (site.summary) {
      text += " – " + site.summary;
    }

    // tạo node
    const div = document.createElement("div");
    div.className = "site-status " + cls;
    div.textContent = text;

    // gắn vào card (sau dòng ngày)
    const line = cardEl.querySelector(".line");
    if (line) {
      line.after(div);
    } else {
      cardEl.appendChild(div);
    }
  });
}
function renderActivityTicker(siteMap) {
  const box = document.getElementById("activityTicker");
  if (!box || !siteMap) return;

  const items = Object.values(siteMap);

  box.innerHTML = `
    <span>
      ${items.map(s => `
        <b class="site-${s.status} ${s.status === "red" && s.diffDays >= 3 ? "site-blink" : ""}">
          ${s.maCan}:
          ${s.diffDays === 0
  ? "hôm nay có thi công"
  : s.diffDays === 1
    ? "hôm qua có thi công"
    : s.diffDays + " ngày chưa thi công"}

          ${s.summary ? " – " + s.summary : ""}
        </b>
      `).join(" | ")}
    </span>
  `;
}
// 🔒 KHÓA TRẠNG THÁI NGAY KHI DOM LOAD
document.addEventListener("DOMContentLoaded", () => {
  updateOpenSheetBtnVisibility();

  const btn = document.getElementById("openSheetBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!window.__sheetLoaded) {
      const s = document.createElement("script");
      s.src = "js/sheet.js";
      s.defer = true;

      s.onload = () => {
        window.__sheetLoaded = true;
        window.openSheetOverlay();
      };

      document.body.appendChild(s);
    } else {
      window.openSheetOverlay();
    }
  });
});

// 🔔 DASHBOARD READY → CHỈ TẮT LOGO + UPDATE NÚT
document.addEventListener("dashboard-ready", () => {
  if (typeof hideLogoLoading === "function") {
    hideLogoLoading();
  }
  updateOpenSheetBtnVisibility();
});

// 🔔 SHEET OVERLAY OPEN
document.addEventListener("sheet-overlay-open", () => {
  document.body.classList.add("sheet-open");
  updateOpenSheetBtnVisibility();
});

// 🔔 SHEET OVERLAY CLOSE
document.addEventListener("sheet-overlay-close", () => {
  document.body.classList.remove("sheet-open");
  updateOpenSheetBtnVisibility();
});
//qr
function toggleCardQR(btn) {
  const card = btn.closest(".card");
  if (!card) return;

  const box = card.querySelector(".qr-box");
  if (!box) return;

  // nếu đang mở → đóng
  if (!box.classList.contains("qr-hidden")) {
    box.classList.add("qr-hidden");
    box.innerHTML = "";
    return;
  }

  const maCan = card.dataset.ma;
  if (!maCan) {
    alert("❌ Không có mã căn");
    return;
  }

  // build link can.html?ma=
  const base = location.href.replace(/ds\.html.*/, "");
  const url = `${base}can.html?ma=${encodeURIComponent(maCan)}`;

  const encodedUrl  = encodeURIComponent(url);
  const shareText   = `Tiến độ căn ${maCan}`;
  const encodedText = encodeURIComponent(shareText);

  box.innerHTML = `
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}">
    <div class="qr-macan">${maCan}</div>

    <div class="qr-actions">
      <!-- mở trực tiếp -->
      <a class="open" href="${url}" target="_blank">🔗 Mở link</a>

      <!-- SHARE HỆ THỐNG (ANDROID / IOS) -->
      <a class="share"
         href="javascript:void(0)"
         onclick="navigator.share && navigator.share({ title:'${shareText}', url:'${url}' })">
         Chia sẻ…
      </a>
    </div>
  `;

  box.classList.remove("qr-hidden");
}
/* ===== AUTO RELOAD – CHỈ KHI TAB ĐANG MỞ ===== */
(function () {
  const ONE_HOUR = 3600000;
  let needReload = false;

  setTimeout(() => {
    if (document.visibilityState === "visible") {
      location.reload();
    } else {
      needReload = true;
    }
  }, ONE_HOUR);

  document.addEventListener("visibilitychange", () => {
    if (needReload && document.visibilityState === "visible") {
      location.reload();
    }
  });
// năm footer
//document.getElementById("year").textContent = new Date().getFullYear();
/* =========================================================
   FOOTER – RENDER TỪ APP_CONFIG
   ========================================================= */
(function renderFooterFromConfig() {
  if (!window.APP_CONFIG?.footer) return;

  const yearEl = document.getElementById("year");
  const footerLeft = document.querySelector(".footer-left .dev");
  const versionEl = document.getElementById("appVersion");

  // năm
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // dev name + link
  if (footerLeft) {
    const { devName, devUrl } = window.APP_CONFIG.footer;
    if (devName && devUrl) {
      footerLeft.innerHTML = `
        Phát triển bởi
        <a href="${devUrl}" target="_blank" rel="noopener">
          ${devName}
        </a>
      `;
    }
  }

  // version
  if (versionEl && window.APP_CONFIG.version) {
    versionEl.textContent = window.APP_CONFIG.version;
  }
})();

// 🚀 BẮT ĐẦU LOAD DASHBOARD
loadDashboard();
