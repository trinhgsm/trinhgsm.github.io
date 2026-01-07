/************************************************************
 * CAN VIEW – FULL LOGIC (TEAM + SITE + TIME)
 ************************************************************/

const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

const $ = s => document.querySelector(s);

/* =====================================================
   UTIL
   ===================================================== */
function getMaCan() {
  const qs = new URLSearchParams(location.search).get("ma");
  if (qs) return qs;

  if (location.hash) {
    return location.hash.replace("#", "").replace("/", "");
  }
  return null;
}

function fmtDate(d) {
  if (!d) return "--";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function fmtDateTime(ts) {
  if (!ts) return "--";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

/* =====================================================
   LOAD
   ===================================================== */
async function loadCan() {
  const maCan = getMaCan();

  if (!maCan) {
    document.body.innerHTML = "❌ Thiếu mã căn (?ma=)";
    return;
  }

  try {
    const res = await fetch(DASH_API);
    const data = await res.json();

    if (!data || !data.units) throw new Error("No data");

    const unit = data.units.find(
      u => u.maCan.toLowerCase() === maCan.toLowerCase()
    );

    if (!unit) {
      document.body.innerHTML = `❌ Không tìm thấy căn ${maCan}`;
      return;
    }

    renderCan(unit, data.sites || {});
  } catch (err) {
    console.error(err);
    document.body.innerHTML = "❌ Lỗi tải dữ liệu";
  }
}

/* =====================================================
   RENDER
   ===================================================== */
function renderCan(u, siteMap) {
  /* ===== HEADER ===== */
  $("#canMa").textContent = "Mã căn: " + u.maCan;

  /* ===== PERCENT CIRCLE ===== */
  const percent = u.percent || 0;
  const deg = percent * 3.6;

  $("#progressCircle").style.background =
    `conic-gradient(#22c55e ${deg}deg,#1e293b ${deg}deg)`;

  $("#circleText").textContent = percent + "%";

  /* ===== STATUS ===== */
  const badge =
    u.level >= 3 ? "badge-danger"
    : u.level === 2 ? "badge-warn"
    : "badge-ok";

  $("#statusText").className = "badge " + badge;
  $("#statusText").textContent = u.statusText || "—";

  $("#updateTime").textContent =
    "Cập nhật: " + fmtDateTime(u.updatedAt || u.generatedAt);

  /* ===== DATE ===== */
  $("#startDate").textContent = fmtDate(u.start);
  $("#endDate").textContent = fmtDate(u.end);

  /* ===== CONG ===== */
  $("#actualCong").textContent = u.actualCong ?? 0;
  $("#plannedCong").textContent = u.plannedCong ?? 0;

  const congPercent = u.plannedCong
    ? Math.round((u.actualCong / u.plannedCong) * 100)
    : 0;

  $("#barDone").style.width = congPercent + "%";

  /* ===== SITE STATUS ===== */
  const site = siteMap[u.maCan];
  let siteText = "Chưa có dữ liệu thi công";

  if (site) {
    if (site.diffDays === 0) {
      siteText = "Hôm nay có thi công";
    } else if (site.diffDays === 1) {
      siteText = "Hôm qua có thi công";
    } else {
      siteText = site.diffDays + " ngày chưa thi công";
    }

    if (site.summary) {
      siteText += " – " + site.summary;
    }
  }

  $("#siteStatus").textContent = siteText;

  /* ===== TEAM LIST ===== */
  const teams = u.byTeam || {};
  const teamNames = Object.keys(teams);

  /* ===== LOG LIST ===== */
  const log = [];
  log.push(`Tiến độ: ${percent}%`);
  log.push(`Công: ${u.actualCong}/${u.plannedCong}`);

  if (teamNames.length) {
    teamNames.forEach(t => {
      log.push(`Tổ ${t.toUpperCase()}: ${teams[t]} công`);
    });
  }

  $("#logList").innerHTML = log.map(x => `<li>${x}</li>`).join("");

  /* ===== TICKER ===== */
  let ticker = `${u.maCan} – ${percent}% – ${u.statusText}`;

  if (teamNames.length) {
    ticker += " | ";
    ticker += teamNames
      .map(t => `Tổ ${t.toUpperCase()}: ${teams[t]}c`)
      .join(" • ");
  }

  $("#tickerText").textContent = ticker;

  /* ===== QR + ZALO ===== */
  const url = location.href;

  $("#qrImg").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent(url);

  $("#zaloShare").href =
    "https://zalo.me/share?url=" + encodeURIComponent(url);
}

/* =====================================================
   ACTION
   ===================================================== */
function toggleQR() {
  $("#qrBox").classList.toggle("hidden");
}

function exportPDF() {
  window.print();
}

/* =====================================================
   START
   ===================================================== */
document.addEventListener("DOMContentLoaded", loadCan);