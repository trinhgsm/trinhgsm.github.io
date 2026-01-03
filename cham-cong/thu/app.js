/* =====================================================
   SHEET VIEWER DEMO – DÙNG API THỰC TẾ
   ===================================================== */

/* 🔧 API + FILE (ĐIỀN FILE ID CỦA BẠN) */
const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

const FILE_ID =
  "1brdWeBYZbnBpcokVt4lLsjJ280zlZcEm342KU_-yAAk";

/* DOM */
const tabBar  = document.getElementById("tabBar");
const titleEl = document.getElementById("sheetTitle");
const tableEl = document.getElementById("sheetTable");

/* CACHE – chống lag */
const cache = {};

/* =====================================================
   LOAD DANH SÁCH SHEET (KHÔNG HARD-CODE GID)
   ===================================================== */
fetch(`${API_URL}?action=sheets&fileId=${FILE_ID}`)
  .then(r => r.json())
  .then(sheets => {
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
tabBar.onclick = e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  tabBar.querySelectorAll("button")
    .forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  loadSheet(btn.dataset.gid);
};

/* =====================================================
   LOAD DATA SHEET
   ===================================================== */
function loadSheet(gid) {
  if (cache[gid]) {
    render(cache[gid]);
    return;
  }

  titleEl.textContent = "Đang tải…";
  tableEl.innerHTML = "";

  fetch(`${API_URL}?action=data&fileId=${FILE_ID}&gid=${gid}`)
    .then(r => r.json())
    .then(data => {
      cache[gid] = data;
      render(data);
    })
    .catch(err => {
      titleEl.textContent = "Lỗi tải dữ liệu";
      console.error(err);
    });
}

/* =====================================================
   RENDER
   ===================================================== */
function render(data) {
  titleEl.textContent = data.name;

  tableEl.innerHTML = data.rows
    .map(row =>
      `<tr>${row.map(c => `<td>${c}</td>`).join("")}</tr>`
    )
    .join("");
}
