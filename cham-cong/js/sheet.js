/* =========================================================
   SHEET OVERLAY – DUKICO
   Load động – không phụ thuộc HTML
   ========================================================= */

(() => {
  if (window.__sheetInit) return;
  window.__sheetInit = true;

  const API_FILES =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=files";

  const API_SHEETS =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=sheets&fileId=";

  let overlay, iframe, menuBox, currentFileId, zoom = 1;

  /* =======================================================
     TẠO OVERLAY + MENU
     ======================================================= */
  function createOverlay() {
    overlay = document.createElement("div");

    iframe = document.createElement("iframe");
    iframe.allowFullscreen = true;

    menuBox = document.createElement("div");
    menuBox.className = "sheet-menu";

    menuBox.innerHTML = `
      <select id="sheetFileMenu"></select>
      <select id="sheetTabMenu"></select>

      <button id="sheetDriveBtn">Drive</button>
      <button id="sheetEditBtn">Sửa</button>

      <button id="sheetZoomIn">+</button>
      <button id="sheetZoomOut">−</button>
      <button id="sheetCloseBtn">✕</button>
    `;

    overlay.appendChild(iframe);
    overlay.appendChild(menuBox);
    document.body.appendChild(overlay);

    bindMenuEvents();
  }

  /* =======================================================
     MENU EVENTS
     ======================================================= */
  function bindMenuEvents() {
    menuBox.querySelector("#sheetCloseBtn").onclick = closeSheet;

    menuBox.querySelector("#sheetZoomIn").onclick = () => {
      zoom = Math.min(1.5, zoom + 0.1);
      iframe.style.transform = `scale(${zoom})`;
      iframe.style.transformOrigin = "0 0";
    };

    menuBox.querySelector("#sheetZoomOut").onclick = () => {
      zoom = Math.max(0.6, zoom - 0.1);
      iframe.style.transform = `scale(${zoom})`;
      iframe.style.transformOrigin = "0 0";
    };

    menuBox.querySelector("#sheetDriveBtn").onclick = () => {
      if (!currentFileId) return;
      window.open(
        `https://drive.google.com/file/d/${currentFileId}`,
        "_blank"
      );
    };

    menuBox.querySelector("#sheetEditBtn").onclick = () => {
      if (!currentFileId) return;
      window.open(
        `https://docs.google.com/spreadsheets/d/${currentFileId}/edit`,
        "_blank"
      );
    };

    menuBox.querySelector("#sheetFileMenu").onchange = e => {
      loadSheetFile(e.target.value);
    };

    menuBox.querySelector("#sheetTabMenu").onchange = e => {
      loadSheetTab(e.target.value);
    };
  }

  /* =======================================================
     LOAD FILE LIST (CỘT A + C)
     ======================================================= */
  async function loadFileMenu() {
    const sel = menuBox.querySelector("#sheetFileMenu");
    sel.innerHTML = `<option>Đang tải...</option>`;

    const res = await fetch(API_FILES);
    const list = await res.json();

    sel.innerHTML = list
      .map(
        f =>
          `<option value="${f.fileId}">${f.name || "Không tên"}</option>`
      )
      .join("");

    if (list[0]) {
      loadSheetFile(list[0].fileId);
    }
  }

  /* =======================================================
     LOAD FILE → LẤY TAB (gid)
     ======================================================= */
  async function loadSheetFile(fileId) {
    currentFileId = fileId;
    zoom = 1;
    iframe.style.transform = "scale(1)";

    iframe.src =
      `https://docs.google.com/spreadsheets/d/${fileId}/preview`;

    const tabSel = menuBox.querySelector("#sheetTabMenu");
    tabSel.innerHTML = `<option>Đang tải...</option>`;

    const res = await fetch(API_SHEETS + encodeURIComponent(fileId));
    const tabs = await res.json();

    tabSel.innerHTML = tabs
      .map(
        s => `<option value="${s.gid}">${s.name}</option>`
      )
      .join("");

    if (tabs[0]) {
      loadSheetTab(tabs[0].gid);
    }
  }

  /* =======================================================
     LOAD TAB (gid)
     ======================================================= */
  function loadSheetTab(gid) {
    if (!currentFileId) return;
    iframe.src =
      `https://docs.google.com/spreadsheets/d/${currentFileId}/preview?gid=${gid}`;
  }

  /* =======================================================
     OPEN / CLOSE
     ======================================================= */
  function openSheet() {
    if (!overlay) createOverlay();
    document.body.classList.add("sheet-open");
    overlay.style.display = "flex";
    loadFileMenu();
  }

  function closeSheet() {
    if (!overlay) return;
    overlay.style.display = "none";
    document.body.classList.remove("sheet-open");
  }

  /* =======================================================
     EXPORT GLOBAL
     ======================================================= */
  window.openSheetOverlay = openSheet;
})();
