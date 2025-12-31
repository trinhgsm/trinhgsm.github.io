/* ===== LOADING HELPERS ===== */
function showLoading() {
  loadingOverlay.style.display = "flex";
}
function hideLoading() {
  loadingOverlay.style.display = "none";

  // ⭐ BÁO HIỆU: LOGO ĐÃ BIẾN MẤT
  document.dispatchEvent(new Event("dukico-loading-hidden"));
}

/* Khi iframe load xong thì tắt logo tải */
frame.addEventListener("load", () => {
  if (frame.src && frame.src !== "about:blank") {
    hideLoading();

    // ⭐ cho dòng ghi chú bắt đầu trôi SAU khi load xong
    setTimeout(() => {
      const note = document.getElementById("statusNoteDynamic");
      if (note) {
        note.classList.remove("paused");
      }
    }, 300);
  }
});


/* ===== INIT: AUTO UNLOCK NẾU ĐÃ LƯU ===== */
window.addEventListener("load", () => {
  try {
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth === "ok") {
      startApp();
      return;
    }
  } catch (e) {}
});

/* ===== PASSWORD ===== */
unlockBtn.onclick = handleUnlock;
passwordInput.onkeydown = (e) => { if (e.key === "Enter") handleUnlock(); };

function handleUnlock() {
  const pass = passwordInput.value.trim();
  if (pass === PASSWORD) {
    try {
      localStorage.setItem(AUTH_KEY, "ok");
    } catch (e) {}
    startApp();
  } else {
    passwordError.textContent = "Sai mật khẩu!";
  }
}

function startApp() {
  passwordError.textContent = "";
  lockScreen.style.display = "none";
  topBar.style.display = "flex";
  showLoading();
  loadFiles();
  autoScaleIframe();
}

/* ===== APPLY SCALE ===== */
function applyScale() {
  if (!iframeScaleDiv) return;
  const scale = baseScale * zoomMultiplier;
  iframeScaleDiv.style.transform = "scale(" + scale + ")";

  // ⭐ TỰ ĐỘNG BẬT/TẮT CUỘN NGANG THEO ZOOM
  const wrap = document.querySelector(".iframe-wrap");
  if (wrap) {
    if (zoomMultiplier > 1) {
      // zoom > 1: cho vuốt ngang để xem hết sheet
      wrap.style.overflowX = "auto";
      wrap.style.touchAction = "pan-x pan-y";
    } else {
      // zoom = 1: tắt ngang, tránh kéo ra thấy vùng đen
      wrap.style.overflowX = "hidden";
      wrap.style.touchAction = "pan-y";
    }
  }
}

/* ===== AUTO SCALE THEO MÀN HÌNH ===== */
function autoScaleIframe() {
  if (!iframeScaleDiv) return;
  const screenW = window.innerWidth || document.documentElement.clientWidth;
  baseScale = Math.min(1, screenW / BASE_WIDTH); // PC không phóng to quá 1
  applyScale();
}

window.addEventListener("resize", autoScaleIframe);

/* ===== NÚT ZOOM +/- ===== */
function changeZoom(delta) {
  zoomMultiplier += delta;
  if (zoomMultiplier < 1) zoomMultiplier = 1;
  if (zoomMultiplier > 4)   zoomMultiplier = 4;
  applyScale();
}

zoomOutBtn.onclick = () => changeZoom(-0.1);
zoomInBtn.onclick  = () => changeZoom(+0.1);
function renderSiteStatus(sites) {
  const bar  = document.getElementById("siteStatusBar");
  const list = document.getElementById("statusList");
/* ===== ĐỔ SUMMARY VÀO DÒNG TRÔI ===== */
const noteDynamic = document.getElementById("statusNoteDynamic");
if (!noteDynamic) return;
noteDynamic.innerHTML = "";
noteDynamic.classList.add("paused"); // ⭐ THÊM DÒNG NÀY
sites.forEach(s => {
  let d = s.diffDays;
  let text = "";

  let toText = s.summary
    ? s.summary.replace(/,\s*/g, " | ")
    : "";

  if (typeof d !== "number") {
  text = "🔴 " + s.maCan + ": không xác định ngày thi công";
}
else if (d === 0 || d === 1) {
  const whenText = (d === 0) ? "Hôm nay" : "Hôm qua";

  if (toText) {
    // Chuẩn hoá: "nề 3c | thợ sơn 2c"
    // → "Tổ nề 3 công | Tổ thợ sơn 2 công"
    const toReadable = toText
      .split("|")
      .map(item => {
        const m = item.trim().match(/^(.+?)\s+(\d+(?:\.\d+)?)c$/i);
        if (!m) return item.trim();
        return "Tổ " + m[1].trim() + " " + m[2] + " công";
      })
      .join(" | ");

    text = "🟢 " + s.maCan +
           " – " + whenText +
           " có thi công gồm: " + toReadable;
  } else {
    text = "🟢 " + s.maCan +
           " – " + whenText +
           " có thi công";
  }
}
else if (d === 2) {
  text = "🟡 " + s.maCan + ": nghỉ thi công 1 ngày";
}
else {
  text = "🔴 " + s.maCan + ": " + d + " ngày không thi công";
}
  const span = document.createElement("span");
  span.textContent = text;
  noteDynamic.appendChild(span);
});

  list.innerHTML = "";
  if (!sites.length) {
    bar.style.display = "none";
    return;
  }

  sites.forEach(s => {
    const dot =
      s.status === "green"  ? "dot-green" :
      s.status === "yellow" ? "dot-yellow" :
                              "dot-red";

    const el = document.createElement("div");
    el.className = "site-item";
    el.innerHTML = `
      <span class="site-dot ${dot}"></span>
      <strong>${s.maCan}</strong>
    `;

    el.onclick = () => {
      sheetMenu.value = s.gid;
      updateFrame();
    };

    list.appendChild(el);
  });

  bar.style.display = "block";
}
/* ===== B2: BẮT ĐẦU TRÔI KHI LOGO BIẾN MẤT ===== */
document.addEventListener("dukico-loading-hidden", () => {
  const note = document.getElementById("statusNoteDynamic");
  if (!note) return;

  note.classList.remove("paused");
});
function buildDSLink() {
  const SECRET = "dukico@2025";
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const key = md5(SECRET + y + m + day);

  return "https://trinhgsm.github.io/cham-cong/ds.html?key=" + key;
}
