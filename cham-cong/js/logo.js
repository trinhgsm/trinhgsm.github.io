/************************************************************
 * LOGO LOADING + LOCK SCREEN
 * LOGIC CHUẨN:
 * - LOGO HIỆN  => NÚT SHEET ẨN
 * - LOGO ẨN   => NÚT SHEET HIỆN
 * - LOGO CHỈ PHỤ THUỘC DATA LOAD
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
     STATE – CHỈ 1 NGUỒN SỰ THẬT
     ===================================================== */
  let DATA_READY = false;

  /* =====================================================
     CORE TOGGLE (DUY NHẤT)
     ===================================================== */
  function toggleLogoAndSheet(showLogo) {
    if (loadingOverlay)
      loadingOverlay.style.display = showLogo ? "flex" : "none";

    if (sheetBtn)
      sheetBtn.style.display = showLogo ? "none" : "flex";
  }

  /* =====================================================
     INIT
     ===================================================== */
  toggleLogoAndSheet(true); // load trang => logo hiện

  /* =====================================================
     PUBLIC API – DÙNG Ở FILE KHÁC
     ===================================================== */
  window.showLogoLoading = function () {
    if (DATA_READY) return;          // ❌ data xong là cấm bật lại
    toggleLogoAndSheet(true);
  };

  window.hideLogoLoading = function () {
    if (DATA_READY) return;
    DATA_READY = true;
    toggleLogoAndSheet(false);
  };

  /* =====================================================
     AUTH
     ===================================================== */
  function startApp() {
    if (lockScreen)
      lockScreen.style.display = "none";
    // ❌ KHÔNG đụng logo ở đây
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

  if (unlockBtn)
    unlockBtn.onclick = handleUnlock;

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
     DATA READY EVENT (GỌI 1 LẦN)
     ===================================================== */
  document.addEventListener("dashboard-ready", () => {
    window.hideLogoLoading(); // ✅ tắt logo + bật sheet
  });

})();
