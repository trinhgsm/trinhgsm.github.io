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

  const PASSWORD = "123";
  const AUTH_KEY = "dukico-auth";

  let DATA_READY = false; // 🔴 CHỈ 1 CỜ DUY NHẤT

  /* ===== INIT ===== */
  if (loadingOverlay) loadingOverlay.style.display = "flex";

  /* ===== API ===== */
  window.showLogoLoading = function () {
    if (DATA_READY) return;
    if (loadingOverlay) loadingOverlay.style.display = "flex";
  };

  window.hideLogoLoading = function () {
    DATA_READY = true;
    if (loadingOverlay) loadingOverlay.style.display = "none";
  };

  /* ===== AUTH ===== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
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

})();
