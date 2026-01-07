const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";
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

  const res = await fetch(DASH_API);
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

  document.getElementById("siteStatus").textContent =
    site
      ? (site.diffDays===0 ? "Hôm nay có thi công" : site.diffDays+" ngày chưa thi công")
      : "--";

  /* ===== CHỈ HUY + TRỢ LÝ + SĐT ===== */

document.getElementById("manager1").textContent =
  unit.manager1 || "--";

document.getElementById("manager2").textContent =
  unit.manager2 || "--";

// --- PHONE 1 ---
const m1p = document.getElementById("manager1Phone");
if (unit.manager1Phone) {
  m1p.textContent = "📞 " + unit.manager1Phone;
  m1p.href = "tel:" + unit.manager1Phone;
  m1p.style.display = "inline-block";
} else {
  m1p.style.display = "none";
}

// --- PHONE 2 ---
const m2p = document.getElementById("manager2Phone");
if (unit.manager2Phone) {
  m2p.textContent = "📞 " + unit.manager2Phone;
  m2p.href = "tel:" + unit.manager2Phone;
  m2p.style.display = "inline-block";
} else {
  m2p.style.display = "none";
}

/*
  API hiện trả về:
  unit.manager1 = "KTS Kiên 0912876678"
  unit.manager2 = "Trợ lý A 0987xxxx"
*/

function renderManager(el, value) {
  if (!el) return;

  if (!value) {
    el.textContent = "—";
    return;
  }

  // tách số điện thoại trong chuỗi (09xxxxxxxx, 03, 07, 08…)
  const phoneMatch = value.match(/(0[0-9]{8,10})/);
  const phone = phoneMatch ? phoneMatch[1] : null;
  const name = phone ? value.replace(phone, "").trim() : value;

  if (phone) {
    el.innerHTML = `
      <span class="manager-name">${name}</span>
      <a class="manager-phone" href="tel:${phone}">📞 ${phone}</a>
    `;
  } else {
    el.textContent = name;
  }
}

renderManager(m1El, unit.manager1);
renderManager(m2El, unit.manager2);

  /* ===== MARQUEE ===== */
  document.getElementById("tickerText").textContent =
    `${unit.maCan}: ${unit.percent||0}% – ${document.getElementById("siteStatus").textContent}`;

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

  // đổi phiên bản tại đây
  const v = document.getElementById("appVersion");
  if (v) v.textContent = "v1.0.1";
});
document.addEventListener("DOMContentLoaded",loadCan);
