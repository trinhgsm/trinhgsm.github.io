const DASH_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

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

  /* ===== CHỈ HUY + ĐT ===== */
  document.getElementById("manager1").textContent = unit.manager1 || "--";
  document.getElementById("manager2").textContent = unit.manager2 || "--";

  const p1 = document.getElementById("phone1");
  const p2 = document.getElementById("phone2");

  if(unit.phone1){
    p1.textContent = unit.phone1;
    p1.href = "tel:"+unit.phone1;
  }else p1.textContent="--";

  if(unit.phone2){
    p2.textContent = unit.phone2;
    p2.href = "tel:"+unit.phone2;
  }else p2.textContent="--";

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

document.addEventListener("DOMContentLoaded",loadCan);