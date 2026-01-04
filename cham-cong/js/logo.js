/* =====================================================
   LOGO LOADING + LOCK SCREEN (FINAL – CLEAN)
   ===================================================== */
(function () {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");
  const sheetBtn       = document.getElementById("openSheetBtn");

  const PASSWORD = "123";
  const AUTH_KEY = "dukico-auth";

  /* ===== INIT ===== */
  if (sheetBtn) sheetBtn.style.display = "none";
  if (loadingOverlay) loadingOverlay.style.display = "none";

  /* ===== PUBLIC API ===== */
  window.showLogoLoading = function () {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    if (sheetBtn) sheetBtn.style.display = "none";
  };

  window.hideLogoLoading = function () {
    if (loadingOverlay) loadingOverlay.style.display = "none";
    if (sheetBtn) sheetBtn.style.display = "flex";
  };

  /* ===== START APP ===== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
    showLogoLoading();
  }

  function handleUnlock() {
    const pass = passwordInput.value.trim();
    if (pass === PASSWORD) {
      try { localStorage.setItem(AUTH_KEY, "ok"); } catch(e){}
      startApp();
    } else {
      passwordError.textContent = "Sai mật khẩu!";
    }
  }

  if (unlockBtn) unlockBtn.onclick = handleUnlock;
  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  /* ===== AUTO UNLOCK ===== */
  window.addEventListener("load", () => {
    try {
      if (localStorage.getItem(AUTH_KEY) === "ok") {
        startApp();
      }
    } catch(e){}
  });

  /* ===== CHỜ DASHBOARD READY ===== */
  document.addEventListener("dashboard-ready", () => {
    hideLogoLoading();
  });
})();