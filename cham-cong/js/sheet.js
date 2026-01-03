/* =========================================================
   SHEET OVERLAY – DUKICO (PRO VERSION)
   - Load động
   - Fix gid = "0"
   - Mobile friendly
   - Không phá layout
   ========================================================= */

(() => {
  if (window.__sheetInit) return;
  window.__sheetInit = true;

  /* ================== API ================== */
  const API_FILES =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=files";

  const API_SHEETS =
    "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec?action=sheets&fileId=";

  /* ================== STATE ================== */
  let overlay = null;
  let iframe = null;
  let menuBox = null;

  let currentFileId = null;
  let loadedOnce = false;

  /* =======================================================
     CREATE OVERLAY
     ======================================================= */
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    overlay.style.display = "none";

    iframe = document.createElement("iframe");
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";

    menuBox = document.createElement("div");
    menuBox.className = "sheet-menu";

    menuBox.innerHTML = `
      <select id="sheetFileMenu"></select>
      <select id="sheetTabMenu"></select>

      <button id="sheetDriveBtn">Drive</button>
      <button id="sheetEditBtn">Sửa</button>
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
     LOAD FILE LIST
     ======================================================= */
  async function loadFileMenu() {
    const sel = menuBox.querySelector("#sheetFileMenu");
    sel.innerHTML = `<option>Đang tải...</option>`;

    try {
      const res = await fetch(API_FILES);
      const list = await res.json();

      if (!Array.isArray(list) || list.length === 0) {
        sel.innerHTML = `<option>Không có dữ liệu</option>`;
        return;
      }

      sel.innerHTML = list
        .map(
          f =>
            `<option value="${f.fileId}">${f.name || "Không tên"}</option>`
        )
        .join("");

      loadSheetFile(list[0].fileId);
    } catch (e) {
      sel.innerHTML = `<option>Lỗi tải file</option>`;
      console.error(e);
    }
  }

  /* =======================================================
     LOAD FILE → LOAD TAB
     ======================================================= */
  async function loadSheetFile(fileId) {
    if (!fileId) return;

    currentFileId = fileId;

    // load preview trước
    iframe.src =
      `https://docs.google.com/spreadsheets/d/${fileId}/preview`;

    const tabSel = menuBox.querySelector("#sheetTabMenu");
    tabSel.innerHTML = `<option>Đang tải...</option>`;

    try {
      const res = await fetch(API_SHEETS + encodeURIComponent(fileId));
      const tabs = await res.json();

      if (!Array.isArray(tabs) || tabs.length === 0) {
        tabSel.innerHTML = `<option>Không có sheet</option>`;
        return;
      }

      tabSel.innerHTML = tabs
        .map(
          s =>
            `<option value="${String(s.gid)}">${s.name}</option>`
        )
        .join("");

      // ⚠️ FIX GID = "0"
      loadSheetTab(String(tabs[0].gid));
    } catch (e) {
      tabSel.innerHTML = `<option>Lỗi tải tab</option>`;
      console.error(e);
    }
  }

  /* =======================================================
     LOAD TAB (gid)
     ======================================================= */
  function loadSheetTab(gid) {
    if (!currentFileId) return;
    if (gid === undefined || gid === null) return;

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

    if (!loadedOnce) {
      loadedOnce = true;
      loadFileMenu();
    }
  }

  function closeSheet() {
    if (!overlay) return;

    iframe.src = "about:blank"; // giải phóng tài nguyên
    overlay.style.display = "none";
    document.body.classList.remove("sheet-open");
  }

  /* =======================================================
     EXPORT GLOBAL
     ======================================================= */
  window.openSheetOverlay = openSheet;
})();
