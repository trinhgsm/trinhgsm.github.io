document.addEventListener("DOMContentLoaded", () => {

  /* ================== CẤU HÌNH ================== */
  const API_URL =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

  const FILE_ID =
    "1brdWeBYZbnBpcokVt4lLsjJ280zlZcEm342KU_-yAAk"; // ← SỬA DUY NHẤT DÒNG NÀY

  /* ================== DOM ================== */
  const tabBar  = document.getElementById("tabBar");
  const titleEl = document.getElementById("sheetTitle");
  const tableEl = document.getElementById("sheetTable");

  if (!tabBar || !titleEl || !tableEl) {
    console.error("Thiếu tabBar / sheetTitle / sheetTable trong HTML");
    return;
  }

  /* ================== CACHE (CHỐNG LAG) ================== */
  const cache = {};

  /* =====================================================
     LOAD DANH SÁCH SHEET
     API TRẢ: { sheets: [...], sites: [...] }
     ===================================================== */
  fetch(`${API_URL}?action=sheets&fileId=${FILE_ID}`)
    .then(res => res.json())
    .then(data => {

      const sheets = data.sheets || [];   // 👈 FIX CHÍNH

      if (!Array.isArray(sheets) || sheets.length === 0) {
        tabBar.textContent = "Không có sheet";
        return;
      }

      tabBar.innerHTML = sheets.map((s, i) =>
        `<button data-gid="${s.gid}" class="${i === 0 ? "active" : ""}">
          ${s.name}
        </button>`
      ).join("");

      // load sheet đầu tiên
      loadSheet(sheets[0].gid);
    })
    .catch(err => {
      tabBar.textContent = "Lỗi tải danh sách sheet";
      console.error(err);
    });

  /* =====================================================
     CLICK TAB
     ===================================================== */
  tabBar.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    tabBar.querySelectorAll("button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    loadSheet(btn.dataset.gid);
  });

  /* =====================================================
     LOAD DATA SHEET THEO GID
     ===================================================== */
  function loadSheet(gid) {
    if (!gid) return;

    // dùng cache nếu có
    if (cache[gid]) {
      render(cache[gid]);
      return;
    }

    titleEl.textContent = "Đang tải…";
    tableEl.innerHTML = "";

    fetch(`${API_URL}?action=data&fileId=${FILE_ID}&gid=${gid}`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.rows) {
          titleEl.textContent = "Không có dữ liệu";
          return;
        }

        cache[gid] = data;
        render(data);
      })
      .catch(err => {
        titleEl.textContent = "Lỗi tải dữ liệu";
        console.error(err);
      });
  }

  /* =====================================================
     RENDER TABLE
     ===================================================== */
  function render(data) {
    titleEl.textContent = data.name || "";

    tableEl.innerHTML = data.rows
      .map(row =>
        `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
      )
      .join("");
  }

});
