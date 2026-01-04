/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND (FIX GID)
 ************************************************************/

(function () {
  if (window.__sheetOverlayInit) return;
  window.__sheetOverlayInit = true;
  function getOpenBtn() {
  return document.getElementById("openSheetBtn");
}
 const API_BASE =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

  let overlay,
    iframe,
    menuFile,
    menuSheet,
    currentFileId = null,
    zoomLevel = window.innerWidth < 768 ? 0.72 : 0.85;

  /* ================= OPEN ================= */
  window.openSheetOverlay = async function () {
  if (!overlay) createOverlay();
  overlay.classList.add("show");

  // ✅ LẤY NÚT TẠI THỜI ĐIỂM BẤM
  

  await loadFileList();
};
 function closeOverlay() {
  overlay.classList.remove("show");

  
}

/* ================= DOM ================= */
function createOverlay() {
  overlay = document.createElement("div");
  overlay.id = "sheetOverlay";

  overlay.innerHTML = `
    <div class="sheet-panel">
      <iframe id="sheetFrame"></iframe>

      <div class="sheet-menu">
        <!-- HÀNG 1: FILE + FILE MENU + GID -->
        <button id="btnFile">File</button>
        <select id="sheetFileMenu"></select>
        <select id="sheetTabMenu"></select>

        <!-- HÀNG 2: GHI NHẬT KÝ -->
        <button id="btnLog1">Ghi NK 1</button>
        <button id="btnLog2">Ghi NK 2</button>
        <button id="btnLog3">Ghi NK 3</button>

        <!-- HÀNG 3: ZOOM + CLOSE -->
        <button id="btnZoomIn">＋</button>
        <button id="btnZoomOut">－</button>
        <button id="btnClose">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  /* ====== BẮT DOM ====== */
  iframe = overlay.querySelector("#sheetFrame");
  menuFile = overlay.querySelector("#sheetFileMenu");
  menuSheet = overlay.querySelector("#sheetTabMenu");

  /* ====== SỰ KIỆN MENU ====== */

  // Đóng overlay
  overlay.querySelector("#btnClose").onclick = closeOverlay;

  // Zoom
  overlay.querySelector("#btnZoomIn").onclick = () =>
    setZoom(zoomLevel + 0.1);

  overlay.querySelector("#btnZoomOut").onclick = () =>
    setZoom(zoomLevel - 0.1);

  // Mở file trên Google Drive
  overlay.querySelector("#btnFile").onclick = () => {
    if (!currentFileId) return;
    window.open(
      `https://drive.google.com/drive/folders/1o3n5GABxec53ANpnS_OaDU1w0M3cGeAX}`,
      "_blank"
    );
  };

  // Ghi NK 1 (gid = 0 — đổi nếu cần)
  overlay.querySelector("#btnLog1").onclick = () => {
    if (!currentFileId) return;
    window.open(
      `https://docs.google.com/spreadsheets/d/${currentFileId}/edit#gid=0`,
      "_blank"
    );
  };

  // Ghi NK 2 (gid = 1 — đổi nếu cần)
  overlay.querySelector("#btnLog2").onclick = () => {
    if (!currentFileId) return;
    window.open(
      `https://docs.google.com/spreadsheets/d/138SCHzhuCnaqSJVsWqVxaFEb9iLIjFguhxoJq9ASSBw/edit#gid=1`,
      "_blank"
    );
  };

  // Ghi NK 3 (gid = 2 — đổi nếu cần)
  overlay.querySelector("#btnLog3").onclick = () => {
    if (!currentFileId) return;
    window.open(
      `https://docs.google.com/spreadsheets/d/1YX7imCB3GempjY2X9z_GUc8LDl019FZvMVJ5l_aht2c/edit#gid=2`,
      "_blank"
    );
  };

  // Chọn file
  menuFile.onchange = () => openFile(menuFile.value);

  // Chọn tab (gid)
  menuSheet.onchange = () => openSheetTab(menuSheet.value);
}

  /* ================= FILE LIST ================= */
  async function loadFileList() {
    menuFile.innerHTML = `<option>Đang tải...</option>`;
    menuSheet.innerHTML = "";

    const res = await fetch(API_BASE + "?action=files");
    const files = await res.json();

    menuFile.innerHTML = files
      .map(f => `<option value="${f.fileId}">${f.name}</option>`)
      .join("");

    const currentFile = pickCurrentMonthFile(files);
    if (currentFile) {
      menuFile.value = currentFile.fileId;
      openFile(currentFile.fileId);
    }
  }

  function openFile(fileId) {
  currentFileId = fileId;
  iframe.src = buildEmbedUrl(fileId);

  iframe.onload = () => {
    fitSheetToScreen();   // 🔴 FIT NGAY KHI LOAD
  };

  loadSheetTabs(fileId);
}
  /* ================= SHEET TABS ================= */
  async function loadSheetTabs(fileId) {
    menuSheet.innerHTML = `<option>Đang tải...</option>`;

    const res = await fetch(
      API_BASE + "?action=sheets&fileId=" + encodeURIComponent(fileId)
    );
    const data = await res.json();

    if (!data || !Array.isArray(data.sheets)) {
      menuSheet.innerHTML = `<option>Không có sheet</option>`;
      return;
    }

    menuSheet.innerHTML = data.sheets
      .map(t => `<option value="${t.gid}">${t.name}</option>`)
      .join("");

    openSheetTab(data.sheets[0].gid);
  }

  function openSheetTab(gid) {
  iframe.src = buildEmbedUrl(currentFileId, gid);

  iframe.onload = () => {
    fitSheetToScreen();
  };
}

  function buildEmbedUrl(fileId, gid) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}`;
  }

  function setZoom(z) {
  zoomLevel = Math.max(0.6, Math.min(1.4, z));
  iframe.style.transform = `scale(${zoomLevel})`;
  iframe.style.transformOrigin = "0 0";
}
  /* ================= MONTH PICKER ================= */
  function pickCurrentMonthFile(files) {
    const now = new Date();
    const monthFiles = files
      .filter(f => f.month && !isNaN(new Date(f.month)))
      .map(f => ({ ...f, _date: new Date(f.month) }))
      .sort((a, b) => a._date - b._date);

    let current = monthFiles.find(
      f =>
        f._date.getFullYear() === now.getFullYear() &&
        f._date.getMonth() === now.getMonth()
    );

    if (!current)
      current = monthFiles.filter(f => f._date <= now).slice(-1)[0];

    return current || monthFiles[0];
  }

/* ================= FIT TO SCREEN ================= */
  function fitSheetToScreen() {
  if (!iframe) return;

  const SHEET_BASE_WIDTH = 1500;   // PHẢI KHỚP CSS
  const screenW = window.innerWidth;

  let fitZoom = screenW / SHEET_BASE_WIDTH;

  if (fitZoom > 1) fitZoom = 1;
  if (fitZoom < 0.6) fitZoom = 0.6;

  zoomLevel = fitZoom;

  iframe.style.transform = `scale(${zoomLevel})`;
  iframe.style.transformOrigin = "0 0";

  iframe.style.height = `${window.innerHeight / zoomLevel}px`;
}

window.addEventListener("resize", () => {
    fitSheetToScreen();
  });
  
})(); // 🔴 BẮT BUỘC – KẾT THÚC IIFE
