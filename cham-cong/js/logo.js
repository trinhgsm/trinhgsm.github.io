/************************************************************
 * LOGO LOADING + LOCK SCREEN
 * LOGIC:
 * - LOGO phụ thuộc DATA
 * - SHEET KHÔNG TOGGLE, CHỈ BỊ ẨN KHI LOGO CÒN
 ************************************************************/
(function () {

  /* =====================================================
     DOM
     ===================================================== */
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");
  const sheetBtn       = document.getElementById("openSheetBtn");

  /* =====================================================
     CONFIG
     ===================================================== */
  const PASSWORD = "123";
  const AUTH_KEY = "dukico-auth";

  let DATA_READY = false;

  /* =====================================================
     INIT STATE
     ===================================================== */
  if (loadingOverlay) loadingOverlay.style.display = "flex";
  if (sheetBtn) sheetBtn.style.display = "none"; // mặc định ẩn

  /* =====================================================
     CORE: ẨN / HIỆN SHEET THEO LOGO (KHÔNG LOGIC)
     ===================================================== */
  function syncSheetWithLogo() {
    if (!loadingOverlay || !sheetBtn) return;

    const logoVisible =
      loadingOverlay.style.display !== "none";

    // LOGO CÒN => ẨN SHEET
    sheetBtn.style.display = logoVisible ? "none" : "flex";
  }

  /* =====================================================
     OBSERVE LOGO (CHÌA KHOÁ)
     ===================================================== */
  if (loadingOverlay) {
    const observer = new MutationObserver(syncSheetWithLogo);
    observer.observe(loadingOverlay, {
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  /* =====================================================
     API – LOGO (GIỮ NGUYÊN)
     ===================================================== */
  window.showLogoLoading = function () {
    if (DATA_READY) return;
    if (loadingOverlay) loadingOverlay.style.display = "flex";
  };

  window.hideLogoLoading = function () {
    if (DATA_READY) return;
    DATA_READY = true;
    if (loadingOverlay) loadingOverlay.style.display = "none";
  };

  /* =====================================================
     AUTH (KHÔNG ĐỤNG SHEET)
     ===================================================== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
  }

  function handleUnlock() {
    const pass = passwordInput?.value.trim();
    if (pass === PASSWORD) {
      try { localStorage.setItem(AUTH_KEY, "ok"); } catch (e) {}
      startApp();
    } else if (passwordError) {
      passwordError.textContent = "Sai mật khẩu!";
    }
  }

  if (unlockBtn) unlockBtn.onclick = handleUnlock;

  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  /* =====================================================
     AUTO UNLOCK
     ===================================================== */
  window.addEventListener("load", () => {
    try {
      if (localStorage.getItem(AUTH_KEY) === "ok") {
        startApp();
      }
    } catch (e) {}
  });

  /* =====================================================
     DATA READY
     ===================================================== */
  document.addEventListener("dashboard-ready", () => {
    hideLogoLoading();
  });

})();
