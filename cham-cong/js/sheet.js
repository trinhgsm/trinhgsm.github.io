/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND (FIX GID)
 ************************************************************/

(function () {
  if (window.__sheetOverlayInit) return;
  window.__sheetOverlayInit = true;

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
          <select id="sheetFileMenu"></select>
          <select id="sheetTabMenu"></select>
          <button id="btnDrive">Drive</button>
          <button id="btnEdit">Sửa</button>
          <button id="btnZoomIn">＋</button>
          <button id="btnZoomOut">－</button>
          <button id="btnClose">✕</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    iframe = overlay.querySelector("#sheetFrame");
    menuFile = overlay.querySelector("#sheetFileMenu");
    menuSheet = overlay.querySelector("#sheetTabMenu");

    overlay.querySelector("#btnClose").onclick = closeOverlay;
    overlay.querySelector("#btnZoomIn").onclick = () => setZoom(zoomLevel + 0.1);
    overlay.querySelector("#btnZoomOut").onclick = () => setZoom(zoomLevel - 0.1);

    overlay.querySelector("#btnDrive").onclick = () => {
      if (currentFileId)
        window.open(
          `https://drive.google.com/drive/search?q=${currentFileId}`,
          "_blank"
        );
    };

    overlay.querySelector("#btnEdit").onclick = () => {
      if (currentFileId)
        window.open(
          `https://docs.google.com/spreadsheets/d/${currentFileId}/edit`,
          "_blank"
        );
    };

    menuFile.onchange = () => openFile(menuFile.value);
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
  if (fitZoom < 0.5) fitZoom = 0.5;

  zoomLevel = fitZoom;

  iframe.style.transform = `scale(${zoomLevel})`;
  iframe.style.transformOrigin = "0 0";

  iframe.style.height = `${window.innerHeight / zoomLevel}px`;
}

window.addEventListener("resize", () => {
    fitSheetToScreen();
  });
})(); // 🔴 BẮT BUỘC – KẾT THÚC IIFE
