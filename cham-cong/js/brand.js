/************************************************************
 * BRAND BINDER
 * Lấy dữ liệu từ APP_CONFIG và gắn vào HTML
 ************************************************************/
(function () {
  if (!window.APP_CONFIG) {
    console.error("❌ APP_CONFIG not found");
    return;
  }

  const { brand, footer, version } = window.APP_CONFIG;

  /* ================= LOADING LOGO ================= */
  const logoEl = document.querySelector(".dukico-logo");
  if (logoEl && brand?.logoText) {
    logoEl.textContent = brand.logoText;
  }

  /* ================= HEADER TITLE ================= */
  const titleEl = document.querySelector("header.top .title");
  if (titleEl && brand?.name) {
    titleEl.innerHTML = `<strong>${brand.name}</strong> – Dashboard tổng quan`;
  }

  /* ================= FOOTER ================= */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const footerLeft = document.querySelector(".footer-left");
  if (footerLeft && footer) {
    footerLeft.innerHTML = `
      © ${new Date().getFullYear()} ${brand?.short || ""}
      · <span class="dev">
        ${footer.devName
          ? `Phát triển bởi <a href="${footer.devUrl}" target="_blank" rel="noopener">${footer.devName}</a>`
          : ""}
      </span>
    `;
  }

  const versionEl = document.getElementById("appVersion");
  if (versionEl && version) {
    versionEl.textContent = version;
  }

})();