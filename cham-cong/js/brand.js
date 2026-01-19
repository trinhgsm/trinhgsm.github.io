(function () {
  if (!window.APP_CONFIG) return;

  const { brand, footer, version } = window.APP_CONFIG;

  /* ===== TITLE ===== */
  document.title = `${brand.name} – Dashboard`;

  /* ===== LOGO (LOADING) ===== */
  const logo = document.getElementById("brandLogo");
  if (logo) logo.textContent = brand.logoText || brand.name;

  /* ===== HEADER ===== */
  const header = document.getElementById("brandHeader");
  if (header) {
    header.innerHTML = `<strong>${brand.short}</strong> – Dashboard tổng quan`;
  }

  /* ===== FOOTER ===== */
  const footerBrand = document.getElementById("brandFooter");
  if (footerBrand) footerBrand.textContent = brand.name;

  const devLink = document.getElementById("devLink");
  if (devLink) {
    devLink.textContent = footer.devName;
    devLink.href = footer.devUrl;
  }

  const v = document.getElementById("appVersion");
  if (v) v.textContent = version;
})();
