const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

/* ===== UTIL ===== */
function qs(sel) {
  return document.querySelector(sel);
}
function setText(sel, val) {
  const el = qs(sel);
  if (el) el.textContent = val;
}
function fmtDate(d) {
  if (!d) return "--";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}
function getMaCan() {
  return new URLSearchParams(location.search).get("ma");
}

/* ===== LOAD ===== */
async function loadCan() {
  const maCan = getMaCan();
  if (!maCan) {
    document.body.innerHTML = "❌ Thiếu mã căn (?ma=)";
    return;
  }

  const res = await fetch(DASH_API);
  const data = await res.json();

  const unit = data.units.find(
    u => u.maCan.toLowerCase() === maCan.toLowerCase()
  );
  if (!unit) {
    document.body.innerHTML = "❌ Không tìm thấy căn";
    return;
  }

  render(unit, data.sites || {});
}

/* ===== RENDER ===== */
function render(u, siteMap) {
  const site = siteMap[u.maCan];

  setText(".can-ma", "Mã căn: " + u.maCan);
  setText("#manager1", u.manager1 || "--");
  setText("#manager2", u.manager2 || "--");

  setText(".status-percent", (u.percent || 0) + "%");
  setText(".status-text", u.statusText || "--");
  setText(".status-time", "Cập nhật: " + (u.updatedAt || "--"));

  setText("#startDate", fmtDate(u.start));
  setText("#endDate", fmtDate(u.end));
  setText("#actualCong", u.actualCong || 0);
  setText("#plannedCong", u.plannedCong || 0);

  const siteEl = qs("#siteStatus");
  if (site) {
    siteEl.textContent =
      site.diffDays === 0
        ? "Hôm nay có thi công"
        : site.diffDays + " ngày chưa thi công";

    siteEl.className =
      "site-status " +
      (site.diffDays === 0 ? "ok" : site.diffDays === 1 ? "warn" : "danger");
  }

  // LOG
  qs("#logList").innerHTML = `
    <li>Tiến độ: ${u.percent || 0}%</li>
    <li>Công: ${u.actualCong || 0}/${u.plannedCong || 0}</li>
    <li>${u.statusText || ""}</li>
  `;

  // CHART TỔ ĐỘI
  if (u.byTeam) {
    new Chart(qs("#teamChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(u.byTeam),
        datasets: [{
          data: Object.values(u.byTeam),
        }]
      }
    });
  }

  // QR
  new QRCode(qs("#qr"), {
    text: location.href,
    width: 160,
    height: 160
  });
}

/* ===== ACTION ===== */
function toggleQR() {
  qs("#qrBox").classList.toggle("hidden");
}
function downloadPDF() {
  window.print();
}

document.addEventListener("DOMContentLoaded", loadCan);