/* =====================================================
   LOGO LOADING + LOCK SCREEN
   MÔ HÌNH C – STATE SYNC (FINAL)
   ===================================================== */
(function () {
  /* ================== DOM ================== */
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");
  const sheetBtn       = document.getElementById("openSheetBtn");

  /* ================== CONFIG ================== */
  const PASSWORD = "123";            // 🔒 đổi nếu cần
  const AUTH_KEY = "dukico-auth";     // localStorage key

  /* ================== GLOBAL STATE ================== */
  window.__AUTH_READY = false;
  window.__DASHBOARD_READY = false;
  let logoClosed = false;

  /* ================== INIT UI ================== */
  if (sheetBtn) sheetBtn.style.display = "none";
  if (loadingOverlay) loadingOverlay.style.display = "none";

  /* ================== CORE LOGIC ================== */
  function showLogo() {
    if (logoClosed) return;
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    if (sheetBtn) sheetBtn.style.display = "none";
  }

  function hideLogo() {
    if (logoClosed) return;
    logoClosed = true;

    if (loadingOverlay) loadingOverlay.style.display = "none";
    if (sheetBtn) sheetBtn.style.display = "flex";
  }

  function tryHideLogo() {
    if (window.__AUTH_READY && window.__DASHBOARD_READY) {
      hideLogo();
    }
  }

  /* ================== AUTH ================== */
  function unlockSuccess() {
    window.__AUTH_READY = true;
    if (lockScreen) lockScreen.style.display = "none";
    tryHideLogo();
  }

  function handleUnlock() {
    const pass = passwordInput.value.trim();
    if (pass === PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, "ok");
      } catch (e) {}
      unlockSuccess();
    } else {
      if (passwordError) passwordError.textContent = "Sai mật khẩu!";
    }
  }

  if (unlockBtn) unlockBtn.onclick = handleUnlock;

  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  /* ================== AUTO UNLOCK ================== */
  window.addEventListener("load", () => {
    try {
      if (localStorage.getItem(AUTH_KEY) === "ok") {
        unlockSuccess();
      } else {
        showLogo(); // chưa auth → hiện logo
      }
    } catch (e) {
      showLogo();
    }
  });

  /* ================== DASHBOARD READY ================== */
  document.addEventListener("dashboard-ready", () => {
    window.__DASHBOARD_READY = true;
    tryHideLogo();
  });

  /* ================== PUBLIC API (OPTIONAL) ================== */
  window.showLogoLoading = showLogo;
  window.hideLogoLoading = hideLogo;

})();