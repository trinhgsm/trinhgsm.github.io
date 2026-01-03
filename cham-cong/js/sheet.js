/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND
 * Phụ thuộc:
 *  - CSS: sheet.css (đã link sẵn trong HTML)
 *  - API dashboard?action=files & action=sheets
 ************************************************************/

(function () {
  const API_BASE =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

  let overlay, iframe, menuFile, menuSheet;
  let currentFileId = null;
  let zoomLevel = 1;

  /* ======================================================
     OPEN / CLOSE
     ====================================================== */
  window.openSheetOverlay = async function () {
    if (!overlay) createOverlay();
    overlay.classList.add("show");
    await loadFileList();
  };

  function closeOverlay() {
    overlay.classList.remove("show");
  }

  /* ======================================================
     CREATE DOM
     ====================================================== */
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.id = "sheetOverlay";

    overlay.innerHTML = `
      <div class="sheet-panel">
        <iframe id="sheetFrame" allowfullscreen></iframe>

        <!-- MENU -->
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

    /* EVENTS */
    overlay.querySelector("#btnClose").onclick = closeOverlay;

    overlay.querySelector("#btnZoomIn").onclick = () => setZoom(zoomLevel + 0.1);
    overlay.querySelector("#btnZoomOut").onclick = () => setZoom(zoomLevel - 0.1);

    overlay.querySelector("#btnDrive").onclick = () => {
      if (currentFileId) {
        window.open(
          `https://drive.google.com/drive/u/0/search?q=${currentFileId}`,
          "_blank"
        );
      }
    };

    overlay.querySelector("#btnEdit").onclick = () => {
      if (currentFileId) {
        window.open(
          `https://docs.google.com/spreadsheets/d/${currentFileId}/edit`,
          "_blank"
        );
      }
    };

    menuFile.onchange = () => loadSheetTabs(menuFile.value);
    menuSheet.onchange = () => openSheetTab(menuSheet.value);
  }

  /* ======================================================
     LOAD FILE LIST (MENU 1)
     ====================================================== */
  async function loadFileList() {
    menuFile.innerHTML = `<option>Đang tải...</option>`;

    const res = await fetch(API_BASE + "?action=files");
    const files = await res.json();

    menuFile.innerHTML = files
      .map(
        f =>
          `<option value="${f.fileId}">${f.name}</option>`
      )
      .join("");

    if (files.length) {
      currentFileId = files[0].fileId;
      openFile(currentFileId);
    }
  }

  function openFile(fileId) {
    currentFileId = fileId;
    iframe.src = buildEmbedUrl(fileId);
    loadSheetTabs(fileId);
  }

  /* ======================================================
     LOAD SHEET TABS (MENU 2)
     ====================================================== */
  async function loadSheetTabs(fileId) {
    menuSheet.innerHTML = `<option>Đang tải...</option>`;

    const res = await fetch(
      API_BASE + "?action=sheets&fileId=" + encodeURIComponent(fileId)
    );
    const tabs = await res.json();

    menuSheet.innerHTML = tabs
      .map(
        t =>
          `<option value="${t.gid}">${t.name}</option>`
      )
      .join("");

    if (tabs.length) {
      openSheetTab(tabs[0].gid);
    }
  }

  function openSheetTab(gid) {
    iframe.src = buildEmbedUrl(currentFileId, gid);
  }

  /* ======================================================
     UTIL
     ====================================================== */
  function buildEmbedUrl(fileId, gid) {
    let url = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    if (gid) url += `?gid=${gid}`;
    return url;
  }

  function setZoom(z) {
    zoomLevel = Math.max(0.6, Math.min(1.4, z));
    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
  }
})();
