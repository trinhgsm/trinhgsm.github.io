/* =====================================================
   LOGO LOADING + LOCK SCREEN (FINAL)
   - Chỉ LOADING + MẬT KHẨU
   - Không chữ trôi
   - Không event trung gian
   ===================================================== */

(function () {
  /* ===== DOM ===== */
  const loadingOverlay = document.getElementById("loadingOverlay");
  const lockScreen     = document.getElementById("lockScreen");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const unlockBtn      = document.getElementById("unlockBtn");

  /* ===== CONFIG ===== */
  const PASSWORD = "123";            // 🔴 đổi theo ý bạn
  const AUTH_KEY = "dukico-auth";    // key lưu localStorage

  /* =====================================================
     LOADING API (CHO FILE KHÁC GỌI)
     ===================================================== */

  // HIỆN LOGO
  window.showLogoLoading = function () {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = "flex";
  };

  // TẮT LOGO
  window.hideLogoLoading = function () {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = "none";
  };

  /* =====================================================
     LOCK SCREEN
     ===================================================== */

  function startApp() {
    if (lockScreen) lockScreen.style.display = "none";
    showLogoLoading(); // 🔴 luôn hiện logo sau khi unlock
  }

  function handleUnlock() {
    if (!passwordInput) return;

    const pass = passwordInput.value.trim();
    if (pass === PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, "ok");
      } catch (e) {}

      if (passwordError) passwordError.textContent = "";
      startApp();
    } else {
      if (passwordError) {
        passwordError.textContent = "Sai mật khẩu!";
      }
    }
  }

  /* ===== EVENTS ===== */

  if (unlockBtn) {
    unlockBtn.onclick = handleUnlock;
  }

  if (passwordInput) {
    passwordInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleUnlock();
    });
  }

  /* ===== AUTO UNLOCK ===== */
  window.addEventListener("load", () => {
    try {
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth === "ok") {
        startApp();
      }
    } catch (e) {}
  });
})();