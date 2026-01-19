const API_URL = window.APP_CONFIG.api.dashboard();

const m1e1 = document.getElementById("manager1");
const m2e2 = document.getElementById("manager2");
const p1   = document.getElementById("phone1");
const p2   = document.getElementById("phone2");
let chart = null;

/* ========= UTIL ========= */
function getMaCan(){
  const p = new URLSearchParams(location.search).get("ma");
  return p ? p.toUpperCase() : null;
}
function fmtDate(d){
  if(!d) return "--";
  const [y,m,dd]=d.split("-");
  return `${dd}-${m}-${y}`;
}

/* ========= LOAD ========= */
async function loadCan(){
  const maCan = getMaCan();
  if(!maCan){
    document.body.innerHTML="❌ Thiếu mã căn (?ma=)";
    return;
  }

  const res = await fetch(APP_CONFIG);
  const data = await res.json();
  const unit = data.units.find(u=>u.maCan.toUpperCase()===maCan);

  if(!unit){
    document.body.innerHTML="❌ Không tìm thấy căn";
    return;
  }

  const site = data.sites ? data.sites[unit.maCan] : null;

  document.getElementById("maCanText").textContent="Mã căn: "+unit.maCan;
  document.getElementById("percent").textContent=(unit.percent||0)+"%";
  document.getElementById("statusText").textContent=unit.statusText||"--";
  document.getElementById("updateTime").textContent="Cập nhật: "+(data.generatedAt||"--");

  document.getElementById("startDate").textContent=fmtDate(unit.start);
  document.getElementById("endDate").textContent=fmtDate(unit.end);
  document.getElementById("congText").textContent=
    `${unit.actualCong||0}/${unit.plannedCong||0}`;

  let siteStatusText = "--";

if (site && typeof site.diffDays === "number") {
  if (site.diffDays === 0) {
    siteStatusText = "Hôm nay có thi công";
  } else if (site.diffDays === 1) {
    siteStatusText = "Hôm qua có thi công";
  } else {
    siteStatusText = site.diffDays + " ngày chưa thi công";
  }
}

// ❗ TAB THI CÔNG: KHÔNG CÓ CHI TIẾT
document.getElementById("siteStatus").textContent = siteStatusText;
let tickerStatus = siteStatusText;

// ✅ CHỈ CHỮ TRÔI MỚI CÓ CHI TIẾT
if (site && site.summary) {
  tickerStatus += " – " + site.summary;
}

document.getElementById("tickerText").textContent =
  `${unit.maCan}: ${unit.percent || 0}% – ${tickerStatus}`;

/* ===== CHỈ HUY + TRỢ LÝ + SĐT (THEO API) ===== */

const m1 = document.getElementById("manager1");
const m2 = document.getElementById("manager2");
const p1 = document.getElementById("manager1Phone");
const p2 = document.getElementById("manager2Phone");

// --- CHỈ HUY ---
m1.textContent = unit.manager1 || "--";

if (unit.manager1Phone) {
  p1.textContent = unit.manager1Phone;
  p1.href = "tel:" + unit.manager1Phone;
  p1.style.display = "inline-flex";
} else {
  p1.style.display = "none";
}

// --- TRỢ LÝ ---
m2.textContent = unit.manager2 || "--";

if (unit.manager2Phone) {
  p2.textContent = unit.manager2Phone;
  p2.href = "tel:" + unit.manager2Phone;
  p2.style.display = "inline-flex";
} else {
  p2.style.display = "none";
}

  /* ===== LOG ===== */
  document.getElementById("logList").innerHTML = `
    <li>Tiến độ: ${unit.percent||0}%</li>
    <li>Công: ${unit.actualCong||0}/${unit.plannedCong||0}</li>
    <li>${unit.statusText||"--"}</li>
  `;

  drawChart(unit.byTeam||{});
}

/* ========= CHART ========= */
function drawChart(byTeam){
  const ctx = document.getElementById("teamChart");
  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:Object.keys(byTeam),
      datasets:[{
        label:"Công theo tổ",
        data:Object.values(byTeam),
        backgroundColor:"#38bdf8"
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{y:{beginAtZero:true}}
    }
  });
}

/* ========= QR ========= */
function toggleQR(){
  const box=document.getElementById("qrBox");
  if(!box.classList.contains("hidden")){
    box.classList.add("hidden");
    return;
  }
  const url=location.href;
  box.innerHTML=`<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}">`;
  box.classList.remove("hidden");
}
/* ========= FOOTER ========= */
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
// năm footer
document.getElementById("year").textContent = new Date().getFullYear();
  // đổi phiên bản tại đây
  const v = document.getElementById("appVersion");
  if (v) v.textContent = "v1.0.1";
});
document.addEventListener("DOMContentLoaded",loadCan);
