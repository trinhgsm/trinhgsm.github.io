/* =========================================================
   APP CONFIG – SINGLE SOURCE OF TRUTH
   ========================================================= */

window.APP_CONFIG = {

  /* ================= BRAND ================= */
  brand: {
    name: "PROXYMMO",
    short: "PROXYMMO",
    logoText: "MMO",
    url: "/"
  },

  /* ================= FOOTER ================= */
  footer: {
    text: "Dashboard nội bộ",
    devName: "Hà Trịnh",
    devUrl: "/"
  },

  /* ================= API (GAS) ================= */
  api: {
    base: "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec",

    root() {
      return this.base;
    },

    dashboard() {
      return this.base + "?action=dashboard";
    },

    unit(maCan) {
      return this.base + "?action=unit&ma=" + encodeURIComponent(maCan);
    },

    /* 🔴 PDF THEO NGÀY – GẮN TRỰC TIẾP GAS */
    pdf({ month, unit, day }) {
      return (
        this.base +
        "?action=pdf" +
        "&month=" + encodeURIComponent(month) +
        "&unit="  + encodeURIComponent(unit) +
        "&day="   + encodeURIComponent(day)
      );
    }
  },

  /* ================= LỊCH + NHẬT KÝ PDF ================= */
  calendar: {
    enabled: true,

    /*
     * format tháng khớp tên folder Drive
     * ví dụ: 1-2026
     */
    monthFormat(date = new Date()) {
      return `${date.getMonth() + 1}-${date.getFullYear()}`;
    },

    /*
     * format ngày khớp tên file PDF
     * ví dụ: 02
     */
    dayFormat(date) {
      return String(date.getDate()).padStart(2, "0");
    }
  },

  /* ================= LINK SHEET CỐ ĐỊNH ================= */
  sheets: {
    log2: "https://docs.google.com/spreadsheets/d/138SCHzhuCnaqSJVsWqVxaFEb9iLIjFguhxoJq9ASSBw/edit#gid=1",
    log3: "https://docs.google.com/spreadsheets/d/1YX7imCB3GempjY2X9z_GUc8LDl019FZvMVJ5l_aht2c/edit#gid=2"
  },

  /* ================= VERSION ================= */
  version: "v1.0.0"
};
