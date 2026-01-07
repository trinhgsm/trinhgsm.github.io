const API =
"https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

function qs(id){ return document.getElementById(id); }

function getMaCan(){
  return new URLSearchParams(location.search).get("ma");
}

async function loadCan(){
  const ma = getMaCan();
  if(!ma){ document.body.innerHTML="❌ Thiếu mã căn"; return; }

  const res = await fetch(API);
  const data = await res.json();

  const u = data.units.find(x=>x.maCan.toLowerCase()===ma.toLowerCase());
  if(!u){ document.body.innerHTML="❌ Không tìm thấy căn"; return; }

  const site = data.sites?.[u.maCan];

  qs("maCan").textContent = "Mã căn: " + u.maCan;
  qs("percent").textContent = (u.percent||0) + "%";
  qs("statusText").textContent = u.statusText||"--";
  qs("updatedAt").textContent = "Cập nhật: " + (u.updatedAt||"--");

  qs("startDate").textContent = u.start||"--";
  qs("endDate").textContent = u.end||"--";
  qs("actualCong").textContent = u.actualCong||0;
  qs("plannedCong").textContent = u.plannedCong||0;

  qs("manager1").textContent = u.manager1||"--";
  qs("manager2").textContent = u.manager2||"--";

  if(u.manager3){
    qs("phone1").textContent = u.manager3;
    qs("phone1").href = "tel:"+u.manager3;
  }
  if(u.manager4){
    qs("phone2").textContent = u.manager4;
    qs("phone2").href = "tel:"+u.manager4;
  }

  qs("siteStatus").textContent = site
    ? (site.diffDays===0?"Hôm nay có thi công":site.diffDays+" ngày chưa thi công")
    : "Chưa có dữ liệu thi công";

  qs("ticker").innerHTML = `
    <span>
      ${u.maCan}: ${qs("siteStatus").textContent}
      ${site?.summary? " – "+site.summary:""}
    </span>
  `;

  qs("logList").innerHTML = `
    <li>Tiến độ: ${u.percent||0}%</li>
    <li>Công: ${u.actualCong||0}/${u.plannedCong||0}</li>
    <li>${u.statusText||""}</li>
  `;

  drawCharts(u);
}

function drawCharts(u){
  new Chart(qs("progressChart"),{
    type:"doughnut",
    data:{
      labels:["Hoàn thành","Còn lại"],
      datasets:[{
        data:[u.percent||0,100-(u.percent||0)],
        backgroundColor:["#22c55e","#1e293b"]
      }]
    },
    options:{plugins:{legend:{display:false}}}
  });

  if(u.byTeam){
    new Chart(qs("teamChart"),{
      type:"bar",
      data:{
        labels:Object.keys(u.byTeam),
        datasets:[{
          data:Object.values(u.byTeam),
          backgroundColor:"#38bdf8"
        }]
      },
      options:{plugins:{legend:{display:false}}}
    });
  }
}

function makeQR(){
  qs("qrBox").innerHTML="";
  new QRCode(qs("qrBox"), location.href);
}

document.addEventListener("DOMContentLoaded", loadCan);