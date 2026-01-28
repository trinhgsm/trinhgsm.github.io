/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND (OPTIMIZED – SAFE)
 * - GIỮ NGUYÊN CẤU TRÚC
 * - SHEET HIỆN NGAY
 * - MENU LOAD SAU
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

    // 🔴 HIỆN MENU NGAY
    overlay.classList.add("show-menu");
    document.dispatchEvent(new Event("sheet-overlay-open"));

    // ✅ HIỆN SHEET NGAY (KHÔNG ĐỢI MENU)
    openSheetTab(0);

    // 🔵 MENU LOAD SAU – KHÔNG BLOCK
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

    iframe    = overlay.querySelector("#sheetFrame");
    menuFile = overlay.querySelector("#sheetFileMenu");
    menuSheet= overlay.querySelector("#sheetTabMenu");

    /* ===== EVENTS ===== */
    overlay.querySelector("#btnClose").onclick = closeOverlay;

    overlay.querySelector("#btnZoomIn").onclick  = () => setZoom(zoomLevel + 0.1);
    overlay.querySelector("#btnZoomOut").onclick = () => setZoom(zoomLevel - 0.1);

    overlay.querySelector("#btnFile").onclick = () => {
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

    overlay.querySelector("#btnLog2").onclick =
      () => window.open(window.APP_CONFIG.sheets.log2, "_blank");

    overlay.querySelector("#btnLog3").onclick =
      () => window.open(window.APP_CONFIG.sheets.log3, "_blank");

    menuFile.onchange  = () => openFile(menuFile.value);
    menuSheet.onchange = () => openSheetTab(menuSheet.value);
  }

  /* ================= FILE LIST ================= */
  async function loadFileList() {
    menuFile.innerHTML = `<option>Đang tải...</option>`;
    menuSheet.innerHTML = "";

    try {
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
    } catch (e) {
      menuFile.innerHTML = `<option>Lỗi tải file</option>`;
    }
  }

  function openFile(fileId) {
    currentFileId = fileId;
    loadSheetTabs(fileId); // 🔵 menu sheet load SAU
  }

  /* ================= SHEET TABS ================= */
  async function loadSheetTabs(fileId) {
    menuSheet.innerHTML = `<option>Đang tải...</option>`;

    try {
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

    } catch (e) {
      menuSheet.innerHTML = `<option>Lỗi tải sheet</option>`;
    }
  }

  /* ================= OPEN SHEET ================= */
  function openSheetTab(gid = 0) {
    overlay.classList.remove("show");

    iframe.src = buildEmbedUrl(
      currentFileId || window.APP_CONFIG.sheets.defaultFile,
      gid
    );

    iframe.onload = () => {
      fitSheetToScreen();
      overlay.classList.add("show");
    };
  }

  function buildEmbedUrl(fileId, gid = 0) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}`;
  }

  /* ================= ZOOM ================= */
  function setZoom(z) {
    zoomLevel = Math.max(0.6, Math.min(1.4, z));
    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
  }

  /* ================= FIT ================= */
  function fitSheetToScreen() {
    if (!iframe) return;

    const BASE_W = 1500;
    const fit = Math.max(0.6, Math.min(1, window.innerWidth / BASE_W));

    zoomLevel = fit;
    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
    iframe.style.height = `${window.innerHeight / zoomLevel}px`;
  }

  window.addEventListener("resize", fitSheetToScreen);

})(); // END IIFE