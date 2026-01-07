const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

/* ===== UTIL ===== */
function qs(sel) {
  return document.querySelector(sel);
}

function getMaCan() {
  const p = new URLSearchParams(location.search).get("ma");
  if (p) return p;
  if (location.hash) return location.hash.replace("#", "");
  return null;
}

function fmtDate(d) {
  if (!d) return "--/--/----";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

/* ===== LOAD ===== */
async function loadCan() {
  const maCan = getMaCan();

  if (!maCan) {
    document.body.innerHTML =
      "<h2 style='color:red;text-align:center'>❌ Thiếu mã căn (?ma=)</h2>";
    return;
  }

  qs(".can-ma").textContent = "Mã căn: " + maCan;

  try {
    const res = await fetch(DASH_API);
    const data = await res.json();

    const unit = data.units.find(
      u => u.maCan.toLowerCase() === maCan.toLowerCase()
    );

    if (!unit) {
      document.body.innerHTML =
        `<h2 style="color:orange;text-align:center">
          ⚠ Không tìm thấy căn ${maCan}
        </h2>`;
      return;
    }

    renderCan(unit, data.sites || {});
  } catch (e) {
    console.error(e);
    document.body.innerHTML =
      "<h2 style='color:red;text-align:center'>❌ Lỗi tải dữ liệu</h2>";
  }
}

/* ===== RENDER ===== */
function renderCan(u, siteMap) {
  qs(".status-percent").textContent = (u.percent || 0) + "%";
  qs(".status-text").textContent = u.statusText || "--";
  qs(".status-time").textContent = "Cập nhật: " + (u.updatedAt || "--");

  qs("#startDate").textContent = fmtDate(u.start);
  qs("#endDate").textContent = fmtDate(u.end);

  qs("#actualCong").textContent = u.actualCong ?? 0;
  qs("#plannedCong").textContent = u.plannedCong ?? 0;

  const site = siteMap[u.maCan];
  qs("#siteStatus").textContent = site
    ? site.diffDays === 0
      ? "Hôm nay có thi công"
      : site.diffDays + " ngày chưa thi công"
    : "Chưa có dữ liệu thi công";

  qs("#logList").innerHTML = `
    <li>Tiến độ: ${u.percent || 0}%</li>
    <li>Công: ${u.actualCong || 0}/${u.plannedCong || 0}</li>
    <li>${u.statusText || "-"}</li>
  `;
}

document.addEventListener("DOMContentLoaded", loadCan);