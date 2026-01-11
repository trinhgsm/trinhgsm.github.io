/************************************************************
 * ADMIN.JS – NHẬT KÝ CÔNG TRÌNH (FINAL)
 * - Load file
 * - Load sheet (Nhật ký XXX)
 * - Đồng bộ header (CĂN)
 * - Load dữ liệu A–F (25→38) từ Sheet → HTML
 * - Ghi dữ liệu từ HTML → Sheet (MAP THEO Ô)
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

/* ======================================================
   ELEMENT
   ====================================================== */
const fileSelect  = document.getElementById("fileSelect");
const sheetSelect = document.getElementById("sheetSelect");
const btnSubmit   = document.getElementById("btnSubmit");
const canNameEl   = document.getElementById("canName");

/* ======================================================
   STATE
   ====================================================== */
let currentFileId = "";
let currentSheet  = "";

/* ======================================================
   LOAD FILE
   ====================================================== */
async function loadFiles() {
  const res = await fetch(API_URL + "?action=files");
  const files = await res.json();

  fileSelect.innerHTML = files.map(f =>
    `<option value="${f.fileId}">${f.name}</option>`
  ).join("");

  if (files.length > 0) {
    fileSelect.selectedIndex = 0;
    currentFileId = fileSelect.value;
    await loadSheets();
  }
}

/* ======================================================
   LOAD SHEETS (NHẬT KÝ XXX)
   ====================================================== */
async function loadSheets() {
  currentFileId = fileSelect.value;

  const res = await fetch(
    API_URL + "?action=sheets&fileId=" + currentFileId
  );
  const data = await res.json();
  const sites = data.sites || [];

  sheetSelect.innerHTML = sites.map(s =>
    `<option value="Nhật ký ${s.maCan}">
      Nhật ký ${s.maCan}
    </option>`
  ).join("");

  if (sites.length > 0) {
    sheetSelect.selectedIndex = 0;
    currentSheet = sheetSelect.value;
    updateHeader();
    await loadSheetData();
  }
}

/* ======================================================
   UPDATE HEADER (CĂN)
   ====================================================== */
function updateHeader() {
  currentSheet = sheetSelect.value || "";
  const maCan = currentSheet.replace(/^Nhật ký\s+/i, "").trim();
  if (canNameEl) {
    canNameEl.textContent = maCan || "---";
  }
}

/* ======================================================
   LOAD DATA FROM SHEET → HTML
   ====================================================== */
async function loadSheetData() {
  if (!currentFileId || !currentSheet) return;

  const url =
    API_URL +
    "?action=read-cells" +
    "&fileId=" + encodeURIComponent(currentFileId) +
    "&sheetName=" + encodeURIComponent(currentSheet);

  const data = await fetch(url).then(r => r.json());

  /* ===== CLEAR INPUT ===== */
  document.querySelectorAll(".cell").forEach(el => {
    el.value = "";
  });

  /* ===== LOAD STT A25:A38 ===== */
  if (data["A25:A38"]) {
    data["A25:A38"].forEach((row, i) => {
      const r = 25 + i;
      const el = document.querySelector(`.stt[data-row="${r}"]`);
      if (el) el.textContent = row[0] ?? "";
    });
  }

  /* ===== LOAD TỔ B25:B38 ===== */
  if (data["B25:B38"]) {
    data["B25:B38"].forEach((row, i) => {
      const r = 25 + i;
      const el = document.querySelector(`.to[data-row="${r}"]`);
      if (el) el.textContent = row[0] ?? "";
    });
  }

  /* ===== LOAD C–F (25→38) ===== */
  if (data["C25:F38"]) {
    const cols = ["C", "D", "E", "F"];
    data["C25:F38"].forEach((row, i) => {
      const r = 25 + i;
      cols.forEach((c, j) => {
        const el = document.querySelector(
          `.cell[data-col="${c}"][data-row="${r}"]`
        );
        if (el) el.value = row[j] ?? "";
      });
    });
  }

  /* ===== LOAD CÁC Ô KHÁC (NẾU CÓ) ===== */
  ["A18","A20","A21","A38","A40"].forEach(key => {
    if (!data[key]) return;
    const el = document.querySelector(
      `.cell[data-col="${key[0]}"][data-row="${key.slice(1)}"]`
    );
    if (el) el.value = data[key][0][0] ?? "";
  });
}

/* ======================================================
   COLLECT CELL DATA → PAYLOAD
   ====================================================== */
function collectCells() {
  const cells = [];
  document.querySelectorAll(".cell").forEach(el => {
    if (el.value === "") return;
    const row = el.dataset.row;
    const col = el.dataset.col;
    if (!row || !col) return;

    const v = el.value;
    cells.push({
      row: Number(row),
      col: col,
      value: isNaN(v) ? v : Number(v)
    });
  });
  return cells;
}

/* ======================================================
   SUBMIT DATA → GAS
   ====================================================== */
async function submitLog() {
  const cells = collectCells();
  if (!cells.length) {
    alert("Không có dữ liệu để ghi");
    return;
  }

  const payload = {
    action: "write-cells",
    fileId: currentFileId,
    sheetName: currentSheet,
    cells: cells
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const r = await res.json();

  if (r.ok) {
    alert("Đã ghi nhật ký");
    await loadSheetData(); // reload để đồng bộ
  } else {
    alert("Lỗi: " + (r.error || "Không xác định"));
  }
}

/* ======================================================
   EVENT
   ====================================================== */
fileSelect.addEventListener("change", loadSheets);

sheetSelect.addEventListener("change", async () => {
  updateHeader();
  await loadSheetData();
});

btnSubmit.addEventListener("click", submitLog);

/* ======================================================
   INIT
   ====================================================== */
loadFiles();
