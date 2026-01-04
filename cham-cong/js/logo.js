/************************************************************
 * LOGO LOADING + LOCK SCREEN
 * LOGIC CHUẨN:
 * - LOGO phụ thuộc DATA
 * - SHEET phụ thuộc (DATA + AUTH)
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

  /* =====================================================
     STATE (2 CỜ – KHÔNG LỆCH)
     ===================================================== */
  let DATA_READY = false;
  let AUTH_OK    = false;

  /* =====================================================
     RENDER – DUY NHẤT 1 CHỖ QUYẾT ĐỊNH UI
     ===================================================== */
  function renderUI() {
    // LOGO
    if (loadingOverlay) {
      loadingOverlay.style.display = DATA_READY ? "none" : "flex";
    }

    // LOCK
    if (lockScreen) {
      lockScreen.style.display = AUTH_OK ? "none" : "flex";
    }

    // SHEET (CHỈ KHI DATA + AUTH)
    if (sheetBtn) {
      sheetBtn.style.display = (DATA_READY && AUTH_OK) ? "flex" : "none";
    }
  }

  /* =====================================================
     INIT
     ===================================================== */
  renderUI();

  /* =====================================================
     PUBLIC API – DATA
     ===================================================== */
  window.showLogoLoading = function () {
    if (DATA_READY) return;
    renderUI();
  };

  window.hideLogoLoading = function () {
    if (DATA_READY) return;
    DATA_READY = true;
    renderUI();
  };

  /* =====================================================
     AUTH
     ===================================================== */
  function handleUnlock() {
    const pass = passwordInput?.value.trim();
    if (pass === PASSWORD) {
      AUTH_OK = true;
      try { localStorage.setItem(AUTH_KEY, "ok"); } catch (e) {}
      renderUI();
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
        AUTH_OK = true;
        renderUI();
      }
    } catch (e) {}
  });

  /* =====================================================
     DATA READY EVENT
     ===================================================== */
  document.addEventListener("dashboard-ready", () => {
    window.hideLogoLoading();
  });

})();
