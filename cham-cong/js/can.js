const DASH_API =
"https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard";

const qs = s => document.querySelector(s);

function getMaCan(){
  const p=new URLSearchParams(location.search).get("ma");
  if(p) return p;
  if(location.hash) return location.hash.replace("#","").replace("/","");
  return null;
}

function fmtDate(d){
  if(!d) return "--";
  const [y,m,dd]=d.split("-");
  return `${dd}-${m}-${y}`;
}

async function loadCan(){
  const maCan=getMaCan();
  if(!maCan){
    document.body.innerHTML="❌ Thiếu mã căn (?ma=)";
    return;
  }

  const res=await fetch(DASH_API);
  const data=await res.json();
  const u=data.units.find(x=>x.maCan.toLowerCase()===maCan.toLowerCase());
  if(!u){
    document.body.innerHTML="❌ Không tìm thấy căn";
    return;
  }

  render(u,data.sites||{});
}

function render(u,siteMap){
  qs("#canMa").textContent="Mã căn: "+u.maCan;

  const deg=(u.percent||0)*3.6;
  qs("#progressCircle").style.background=
    `conic-gradient(#22c55e ${deg}deg,#1e293b ${deg}deg)`;
  qs("#circleText").textContent=(u.percent||0)+"%";

  const badge=
    u.level>=3?"badge-danger":
    u.level===2?"badge-warn":"badge-ok";
  qs("#statusText").className="badge "+badge;
  qs("#statusText").textContent=u.statusText||"--";

  qs("#startDate").textContent=fmtDate(u.start);
  qs("#endDate").textContent=fmtDate(u.end);
  qs("#actualCong").textContent=u.actualCong||0;
  qs("#plannedCong").textContent=u.plannedCong||0;

  const p=u.plannedCong?Math.round(u.actualCong/u.plannedCong*100):0;
  qs("#barDone").style.width=p+"%";

  const site=siteMap[u.maCan];
  qs("#siteStatus").textContent=
    site
      ?(site.diffDays===0?"Hôm nay có thi công":site.diffDays+" ngày chưa thi công")
      :"Chưa có dữ liệu thi công";

  qs("#logList").innerHTML=`
    <li>Tiến độ: ${u.percent||0}%</li>
    <li>Công: ${u.actualCong||0}/${u.plannedCong||0}</li>
    <li>${u.statusText||""}</li>
  `;

  const shareURL=location.href;
  qs("#qrImg").src=
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
    +encodeURIComponent(shareURL);

  qs("#zaloShare").href=
    "https://zalo.me/share?url="+encodeURIComponent(shareURL);

  qs("#tickerText").textContent=
    `${u.maCan} – ${u.percent}% – ${u.statusText} – Công ${u.actualCong}/${u.plannedCong}`;
}

function toggleQR(){
  qs("#qrBox").classList.toggle("hidden");
}

function exportPDF(){
  window.print();
}

document.addEventListener("DOMContentLoaded",loadCan);