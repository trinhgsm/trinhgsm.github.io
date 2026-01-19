window.APP_CONFIG = {
  brand: {
    name: "DUKICO",
    short: "DUKICO",
    logoText: "DUKICO",
    url: "/"
  },

  footer: {
    text: "Dashboard nội bộ",
    devName: "Hà Trịnh",
    devUrl: "/"
  },

  api: {
    dashboard:
      "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=dashboard"
  },

  /* ================= SHEET CONFIG ================= */
  sheet: {
    driveFolder: "https://drive.google.com/drive/folders/1o3n5GABxec53ANpnS_OaDU1w0M3cGeAX",

    logs: {
      log1: { fileId: "CURRENT", gid: 0 },   // Nhật ký chính (theo file đang mở)
      log2: { fileId: "138SCHzhuCnaqSJVsWqVxaFEb9iLIjFguhxoJq9ASSBw", gid: 1 },
      log3: { fileId: "1YX7imCB3GempjY2X9z_GUc8LDl019FZvMVJ5l_aht2c", gid: 2 }
    },

    labels: {
      file: "File",
      log1: "Ghi nhật ký",
      log2: "Thu chi",
      log3: "Cấu hình"
    }
  },

  version: "v1.0.1"
};
