/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND (FIX GID)
 * TỐI ƯU: LOAD IFRAME NGAY, MENU LOAD NỀN (KHÔNG ĐỔI CẤU TRÚC)
 ************************************************************/

(function () {
  if (window.__sheetOverlayInit) return;
  window.__sheetOverlayInit = true;

  const API_BASE = window.APP_CONFIG.api.base;

  let overlay,
    iframe,
    menuFile,
    menuSheet,
    currentFileId = null,
    zoomLevel = window.innerWidth < 768 ? 0.72 : 0.85;

  /* ================= OPEN ================= */
  window.openSheetOverlay = function () {
    if (!overlay) createOverlay();

    // hiện menu ngay
    overlay.classList.add("show-menu");
    document.dispatchEvent(new Event("sheet-overlay-open"));

    // load danh sách file nền
    loadFileList();
  };

  function closeOverlay() {
    overlay.classList.remove("show");
    overlay.classList.remove("show-menu");
    document.dispatchEvent(new Event("sheet-overlay-close"));
  }

  /* ================= DOM ================= */
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.id = "sheetOverlay";

    overlay.innerHTML = `
      <div class="sheet-panel">
        <iframe id="sheetFrame"></iframe>
      </div>

      <div class="sheet-menu">
        <button id="btnFile">File</button>
        <select id="sheetFileMenu"></select>
        <select id="sheetTabMenu"></select>

        <button id="btnLog1">Ghi N.K</button>
        <button id="btnLog2">Thu chi</button>
        <button id="btnLog3">Config</button>

        <button id="btnZoomIn">＋</button>
        <button id="btnZoomOut">－</button>
        <button id="btnClose">✕</button>
      </div>
    `;

    document.body.appendChild(overlay);

    iframe = overlay.querySelector("#sheetFrame");
    menuFile = overlay.querySelector("#sheetFileMenu");
    menuSheet = overlay.querySelector("#sheetTabMenu");

    overlay.querySelector("#btnClose").onclick = closeOverlay;

    overlay.querySelector("#btnZoomIn").onclick = () =>
      setZoom(zoomLevel + 0.1);

    overlay.querySelector("#btnZoomOut").onclick = () =>
      setZoom(zoomLevel - 0.1);

    overlay.querySelector("#btnFile").onclick = () => {
      if (!currentFileId) return;
      window.open(
        "https://drive.google.com/drive/folders/1o3n5GABxec53ANpnS_OaDU1w0M3cGeAX",
        "_blank"
      );
    };

    overlay.querySelector("#btnLog1").onclick = () => {
      if (!currentFileId) return;
      window.open(
        `https://docs.google.com/spreadsheets/d/${currentFileId}/edit#gid=0`,
        "_blank"
      );
    };

    overlay.querySelector("#btnLog2").onclick = () => {
      window.open(
        "https://docs.google.com/spreadsheets/d/138SCHzhuCnaqSJVsWqVxaFEb9iLIjFguhxoJq9ASSBw/edit#gid=1",
        "_blank"
      );
    };

    overlay.querySelector("#btnLog3").onclick = () => {
      window.open(
        "https://docs.google.com/spreadsheets/d/1YX7imCB3GempjY2X9z_GUc8LDl019FZvMVJ5l_aht2c/edit#gid=2",
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

  /* ================= CORE FIX ================= */
  function openFile(fileId) {
    currentFileId = fileId;

    // 🔵 LOAD IFRAME NGAY (gid=0)
    overlay.classList.remove("show");
    iframe.src = buildEmbedUrl(fileId, 0);

    iframe.onload = () => {
      fitSheetToScreen();
      overlay.classList.add("show");
    };

    // 🟡 LOAD TAB MENU NỀN (KHÔNG BLOCK)
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
  }

  function openSheetTab(gid) {
    overlay.classList.remove("show");
    iframe.src = buildEmbedUrl(currentFileId, gid);
    iframe.onload = () => {
      fitSheetToScreen();
      overlay.classList.add("show");
    };
  }

  function buildEmbedUrl(fileId, gid = 0) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}`;
  }

  function setZoom(z) {
    zoomLevel = Math.max(0.6, Math.min(1.4, z));
    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
  }

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

  function fitSheetToScreen() {
    if (!iframe) return;

    const SHEET_BASE_WIDTH = 1500;
    const screenW = window.innerWidth;

    let fitZoom = screenW / SHEET_BASE_WIDTH;
    if (fitZoom > 1) fitZoom = 1;
    if (fitZoom < 0.6) fitZoom = 0.6;

    zoomLevel = fitZoom;

    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
    iframe.style.height = `${window.innerHeight / zoomLevel}px`;
  }

  window.addEventListener("resize", fitSheetToScreen);
})();