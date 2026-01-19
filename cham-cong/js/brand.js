(function () {
  if (!window.APP_CONFIG) return;

  const { brand, version } = window.APP_CONFIG;

  /* ===== TITLE ===== */
  document.title = `${brand.name} – Dashboard`;

  /* ===== LOGO LOADING ===== */
  const logo = document.getElementById("brandLogo");
  if (logo) logo.textContent = brand.logoText || brand.name;

  /* ===== HEADER ===== */
  const header = document.getElementById("brandHeader");
  if (header) {
    header.innerHTML = `<strong>${brand.short}</strong> – Dashboard tổng quan`;
  }

  /* ===== VERSION ===== */
  const v = document.getElementById("appVersion");
  if (v) v.textContent = version;
})();
