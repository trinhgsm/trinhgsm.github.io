/************************************************************
 * LOGO LOADING + LOCK SCREEN
 * LOGIC: LOGO CHỈ PHỤ THUỘC DATA LOAD
 ************************************************************/
(function () {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");
  const sheetBtn       = document.getElementById("openSheetBtn");

  const PASSWORD = "123";
  const AUTH_KEY = "dukico-auth";

  let DATA_READY = false; // 🔴 CHỈ 1 CỜ DUY NHẤT

  /* ===== INIT ===== */
  if (loadingOverlay) loadingOverlay.style.display = "flex";
  if (sheetBtn) sheetBtn.style.display = "none";

  /* ===== API ===== */
  window.showLogoLoading = function () {
    if (DATA_READY) return; // ❌ data xong rồi thì CẤM bật lại
    if (loadingOverlay) loadingOverlay.style.display = "flex";
    if (sheetBtn) sheetBtn.style.display = "none";
  };

  window.hideLogoLoading = function () {
    DATA_READY = true;
    if (loadingOverlay) loadingOverlay.style.display = "none";
    if (sheetBtn) sheetBtn.style.display = "flex";
  };

  /* ===== AUTH ===== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
    // ❌ KHÔNG show logo ở đây
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

  /* ===== DATA READY ===== */
  document.addEventListener("dashboard-ready", () => {
    hideLogoLoading(); // ✅ CHỈ TẮT 1 LẦN
  });
  //document.addEventListener("DOMContentLoaded", () => {
  //const btn = document.getElementById("openSheetBtn");
  //if (!btn) return;

  // Ẩn chắc chắn
  //btn.style.display = "none";

  // Sau 7 giây thì hiện
  //setTimeout(() => {
    //btn.style.display = "flex"; // hoặc "block" nếu bạn thích
  //}, 7000);
});

})();
