/* =========================================================
   BRAND / FOOTER / TITLE – FROM APP_CONFIG
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const cfg = window.APP_CONFIG;
  if (!cfg) return;

  /* ===== TITLE / HEADER ===== */
  const title = document.getElementById("appTitle");
  if (title) {
    title.innerHTML = `<strong>${cfg.brand.name}</strong> – Dashboard tổng quan`;
  }

  /* ===== LOADING LOGO ===== */
  const loadingBrand = document.getElementById("loadingBrand");
  if (loadingBrand) {
    loadingBrand.textContent = cfg.brand.logoText || cfg.brand.name;
  }

  /* ===== FOOTER LEFT ===== */
  const footerLeft = document.getElementById("footerLeft");
  if (footerLeft) {
    footerLeft.innerHTML = `
      © <span id="year">${new Date().getFullYear()}</span>
      ${cfg.brand.name}
      ${cfg.footer?.devName ? `
        · <span class="dev">
          Phát triển bởi
          <a href="${cfg.footer.devUrl}" target="_blank" rel="noopener">
            ${cfg.footer.devName}
          </a>
        </span>
      ` : ""}
    `;
  }

  /* ===== FOOTER RIGHT ===== */
  const footerRight = document.getElementById("footerRight");
  if (footerRight) {
    footerRight.innerHTML = `Phiên bản ${cfg.version || ""}`;
  }
});