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
