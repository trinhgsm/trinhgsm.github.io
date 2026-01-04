/* =====================================================
   LOGO LOADING + LOCK SCREEN (FINAL – STABLE)
   ===================================================== */
(function () {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");

  const PASSWORD = "123";
  const AUTH_KEY = "dukico-auth";

  /* ===== SHEET BUTTON (LẤY ĐỘNG) ===== */
  function getSheetBtn() {
    return document.getElementById("openSheetBtn");
  }

  /* ===== INIT ===== */
  if (loadingOverlay) loadingOverlay.style.display = "none";
  const btnInit = getSheetBtn();
  if (btnInit) btnInit.style.display = "none";

  /* ===== PUBLIC API ===== */
  window.showLogoLoading = function () {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    const btn = getSheetBtn();
    if (btn) btn.style.display = "none";
  };

  window.hideLogoLoading = function () {
    if (loadingOverlay) loadingOverlay.style.display = "none";
    const btn = getSheetBtn();
    if (btn) btn.style.display = "";   // ✅ TRẢ VỀ CSS GỐC
  };

  /* ===== START APP ===== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
    showLogoLoading();
  }

  function handleUnlock() {
    const pass = passwordInput.value.trim();
    if (pass === PASSWORD) {
      try { localStorage.setItem(AUTH_KEY, "ok"); } catch (e) {}
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
    } catch (e) {}
  });

  /* ===== DASHBOARD READY → TẮT LOGO ===== */
  document.addEventListener("dashboard-ready", () => {
    window.hideLogoLoading();
  });
})();