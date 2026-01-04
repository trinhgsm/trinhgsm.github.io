/* =====================================================
   LOGO LOADING + LOCK SCREEN
   ===================================================== */

(function () {
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");

  // ===== CONFIG =====
  const PASSWORD = "123";        // đổi theo ý bạn
  const AUTH_KEY = "dukico-auth";   // key lưu localStorage

  /* ===== LOADING ===== */
  window.showLogoLoading = function () {
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    }
  };

  //window.hideLogoLoading = function () {
    //if (!loadingOverlay) return;
    //loadingOverlay.style.display = "none";
    //document.dispatchEvent(new //Event("dukico-loading-hidden"));
  //};

  /* ===== LOCK ===== */
  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
    showLogoLoading();
  }

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

  if (unlockBtn) {
    unlockBtn.onclick = handleUnlock;
  }

  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  // ===== AUTO UNLOCK =====
  window.addEventListener("load", () => {
    try {
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth === "ok") {
        startApp();
      }
    } catch (e) {}
  });
})();