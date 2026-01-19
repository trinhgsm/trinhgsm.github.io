/* =========================================================
   APP CONFIG – SINGLE SOURCE OF TRUTH
   ========================================================= */

window.APP_CONFIG = {

  /* ================= BRAND ================= */
  brand: {
    name: "PROXYMMO", //logo
    short: "PROXYMMO", //footer
    logoText: "MMO",      // dùng cho loading + header
    url: "/"                // click logo
  },

  /* ================= FOOTER ================= */
  footer: {
    text: "Dashboard nội bộ",
    devName: "Hà Trịnh",
    devUrl: "/"
  },

  /* ================= API (GAS) ================= */
  api: {
    /* 🔴 LINK GỐC – CHỈ KHAI BÁO 1 LẦN */
    base: "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec",

    /* ===== CASE 1: GỌI GỐC /exec ===== */
    root() {
      return this.base;
    },

    /* ===== CASE 2: DASHBOARD ===== */
    dashboard() {
      return this.base + "?action=dashboard";
    },

    /* ===== CASE 3: CHI TIẾT 1 CĂN ===== */
    unit(maCan) {
      return this.base + "?action=unit&ma=" + encodeURIComponent(maCan);
    },

    /* ===== CASE 4: CONFIG (SAU NÀY DÙNG) ===== */
    config() {
      return this.base + "?action=config";
    }
  },
 /* link nut */
   sheets: {
    log2: "https://docs.google.com/spreadsheets/d/138SCHzhuCnaqSJVsWqVxaFEb9iLIjFguhxoJq9ASSBw/edit#gid=1",
    log3: "https://docs.google.com/spreadsheets/d/1YX7imCB3GempjY2X9z_GUc8LDl019FZvMVJ5l_aht2c/edit#gid=2"
  },
  /* ================= VERSION ================= */
  version: "v1.0.0"
};
