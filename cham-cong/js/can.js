/************************************************************
 * CAN VIEW – STEP 3.4 (PART 1)
 * - Lấy mã căn từ URL
 * - Gọi API dashboard
 * - Lọc đúng 1 căn
 ************************************************************/

const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

/* =====================================================
   UTIL
   ===================================================== */
function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}
function getMaCan() {
  const qs = new URLSearchParams(window.location.search).get("ma");
  if (qs) return qs;

  // fallback: #/HP823 hoặc #HP823
  if (location.hash) {
    return location.hash.replace("#", "").replace("/", "");
  }

  // fallback: /can.html/HP823
  const parts = location.pathname.split("/");
  return parts.length > 1 ? parts.pop() : null;
}


function fmtDate(d) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

/* =====================================================
   LOAD CAN
   ===================================================== */
async function loadCan() {
  const maCan = getQueryParam("ma");

  if (!maCan) {
    document.body.innerHTML = `
      <div style="
        padding:40px;
        text-align:center;
        font-family:system-ui;
        color:#ef4444">
        ❌ Thiếu mã căn (?ma=)
      </div>`;
    return;
  }

  try {
    const res = await fetch(DASH_API);
    const data = await res.json();

    if (!data || !data.units) {
      throw new Error("No units");
    }

    const unit = data.units.find(
      u => u.maCan.toLowerCase() === maCan.toLowerCase()
    );

    if (!unit) {
      document.body.innerHTML = `
        <div style="
          padding:40px;
          text-align:center;
          font-family:system-ui;
          color:#f97316">
          ⚠ Không tìm thấy căn <b>${maCan}</b>
        </div>`;
      return;
    }

    renderCan(unit, data.sites || {});
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `
      <div style="
        padding:40px;
        text-align:center;
        font-family:system-ui;
        color:#ef4444">
        ❌ Lỗi tải dữ liệu
      </div>`;
  }
}

/* =====================================================
   RENDER – BẢN TỐI GIẢN
   ===================================================== */
function renderCan(u, siteMap) {
  const site = siteMap[u.maCan];

  document.querySelector(".can-ma").textContent =
    "Mã căn: " + u.maCan;

  // ===== STATUS =====
  document.querySelector(".status-percent").textContent =
    (u.percent || 0) + "%";

  document.querySelector(".status-text").textContent =
    u.statusText || "—";

  document.querySelector(".status-time").textContent =
    "Cập nhật: " + (u.updatedAt || "");

  // ===== TIMELINE =====
  document.getElementById("startDate").textContent =
    fmtDate(u.start);

  document.getElementById("endDate").textContent =
    fmtDate(u.end);

  document.getElementById("actualCong").textContent =
    u.actualCong ?? 0;

  document.getElementById("plannedCong").textContent =
    u.plannedCong ?? 0;

  // ===== SITE =====
  if (site) {
    document.getElementById("siteStatus").textContent =
      site.diffDays === 0
        ? "Hôm nay có thi công"
        : site.diffDays + " ngày chưa thi công";
  } else {
    document.getElementById("siteStatus").textContent =
      "Chưa có dữ liệu thi công";
  }

  // ===== LOG (tạm) =====
  const logList = document.getElementById("logList");
  logList.innerHTML = `
    <li>Tiến độ: ${u.percent || 0}%</li>
    <li>Công: ${u.actualCong || 0}/${u.plannedCong || 0}</li>
    <li>Trạng thái: ${u.statusText || "-"}</li>
  `;
}

/* =====================================================
   START
   ===================================================== */
document.addEventListener("DOMContentLoaded", loadCan);
