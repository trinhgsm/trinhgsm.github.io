const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

const fileSelect  = document.getElementById("fileSelect");
const sheetSelect = document.getElementById("sheetSelect");
const btnSubmit   = document.getElementById("btnSubmit");

let currentFileId = "";

/* ======================================================
   LOAD FILE + SHEET (GIỮ NGUYÊN LOGIC CŨ)
   ====================================================== */
async function loadFiles() {
  const res = await fetch(API_URL + "?action=files");
  const files = await res.json();

  fileSelect.innerHTML = files.map(f =>
    `<option value="${f.fileId}">${f.name}</option>`
  ).join("");

  if (files[0]) {
    currentFileId = files[0].fileId;
    loadSheets();
  }
}

async function loadSheets() {
  currentFileId = fileSelect.value;
  const res = await fetch(
    API_URL + "?action=sheets&fileId=" + currentFileId
  );
  const data = await res.json();

  sheetSelect.innerHTML = (data.sites || []).map(s =>
    `<option value="Nhật ký ${s.maCan}">
      Nhật ký ${s.maCan}
    </option>`
  ).join("");

  // ✅ LOAD DỮ LIỆU NGAY KHI CHỌN
  setTimeout(loadSheetData, 100);
}


/* ======================================================
   COLLECT CELL DATA (CORE)
   ====================================================== */
function collectCells() {
  const cells = [];

  document.querySelectorAll(".cell").forEach(el => {
    const v = el.value;
    if (v === "" || v === null) return;

    const row = el.dataset.row;
    const col = el.dataset.col;

    if (!row || !col) return;

    cells.push({
      row: Number(row),
      col: col,
      value: isNaN(v) ? v : Number(v)
    });
  });

  return cells;
}

/* ======================================================
   SUBMIT TO API (WRITE CELLS)
   ====================================================== */
async function submitLog() {
  const cells = collectCells();

  if (!cells.length) {
    alert("Chưa nhập dữ liệu nào");
    return;
  }

  const payload = {
    action: "write-cells",
    fileId: currentFileId,
    sheetName: sheetSelect.value,
    cells: cells
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const r = await res.json();

  if (r.ok) {
    alert("Đã ghi nhật ký");

    // clear input sau khi ghi
    document.querySelectorAll(".cell").forEach(el => {
      el.value = "";
    });

  } else {
    alert("Lỗi: " + r.error);
  }
}

/* ======================================================
   EVENT
   ====================================================== */
fileSelect.addEventListener("change", loadSheets);
btnSubmit.addEventListener("click", submitLog);
/* ======================================================
   LOAD DATA FROM SHEET → HTML
   ====================================================== */
async function loadSheetData() {
  if (!currentFileId || !sheetSelect.value) return;

  const url =
    API_URL +
    "?action=read-cells" +
    "&fileId=" + encodeURIComponent(currentFileId) +
    "&sheetName=" + encodeURIComponent(sheetSelect.value);

  const data = await fetch(url).then(r => r.json());

  // ===== CLEAR TRƯỚC =====
  document.querySelectorAll(".cell").forEach(el => {
    el.value = "";
  });

  // ===== A18, A20, A21, A38, A40 =====
  ["A18","A20","A21","A38","A40"].forEach(key => {
    if (!data[key]) return;

    const el = document.querySelector(
      `.cell[data-col="${key[0]}"][data-row="${key.slice(1)}"]`
    );
    if (el) el.value = data[key][0][0] || "";
  });

  // ===== BẢNG NHÂN LỰC C25:F29 =====
  if (data["C25:F29"]) {
    data["C25:F29"].forEach((rowData, i) => {
      const sheetRow = 25 + i;
      const cols = ["C","D","E","F"];

      cols.forEach((col, j) => {
        const el = document.querySelector(
          `.cell[data-col="${col}"][data-row="${sheetRow}"]`
        );
        if (el) el.value = rowData[j] ?? "";
      });
    });
  }
}


// init
loadFiles();
