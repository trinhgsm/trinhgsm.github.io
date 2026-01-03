/************************************************************
 * SHEET EMBED OVERLAY – LOAD ON DEMAND (FIX GID)
 * ✔ Load file
 * ✔ Load tab (gid)
 * ✔ Đổi tab nhảy đúng sheet
 * ✔ Zoom iframe
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
    zoomLevel = 1;

  /* ======================================================
     PUBLIC OPEN
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
        <iframe id="sheetFrame" loading="lazy"></iframe>

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

    overlay.querySelector("#btnZoomIn").onclick = () =>
      setZoom(zoomLevel + 0.1);
    overlay.querySelector("#btnZoomOut").onclick = () =>
      setZoom(zoomLevel - 0.1);

    overlay.querySelector("#btnDrive").onclick = () => {
      if (currentFileId) {
        window.open(
          `https://drive.google.com/drive/search?q=${currentFileId}`,
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

    menuFile.onchange = () => openFile(menuFile.value);
    menuSheet.onchange = () => openSheetTab(menuSheet.value);
  }

  /* ======================================================
     LOAD FILE LIST
     ====================================================== */
  async function loadFileList() {
    menuFile.innerHTML = `<option>Đang tải file...</option>`;
    menuSheet.innerHTML = "";

    const res = await fetch(API_BASE + "?action=files");
    const files = await res.json();

    if (!Array.isArray(files) || !files.length) {
      menuFile.innerHTML = `<option>Không có dữ liệu</option>`;
      return;
    }

    menuFile.innerHTML = files
  .map(f => `<option value="${f.fileId}">${f.name}</option>`)
  .join("");

// 🔴 CHỌN ĐÚNG THÁNG HIỆN TẠI
const currentFile = pickCurrentMonthFile(files);

if (currentFile) {
  menuFile.value = currentFile.fileId;
  openFile(currentFile.fileId);
}

function openFile(fileId) {
    currentFileId = fileId;
    iframe.src = buildEmbedUrl(fileId);
    loadSheetTabs(fileId);
  }

  /* ======================================================
     LOAD SHEET TABS (gid)
     ====================================================== */
  async function loadSheetTabs(fileId) {
  menuSheet.innerHTML = `<option>Đang tải sheet...</option>`;

  const res = await fetch(
    API_BASE + "?action=sheets&fileId=" + encodeURIComponent(fileId)
  );

  if (!res.ok) {
    console.error("❌ API sheets HTTP error", res.status);
    menuSheet.innerHTML = `<option>Lỗi tải sheet</option>`;
    return;
  }

  const data = await res.json();
  console.log("API sheets raw:", data);

  if (!data || !Array.isArray(data.sheets)) {
    console.error("❌ Sai format sheets", data);
    menuSheet.innerHTML = `<option>Không có sheet</option>`;
    return;
  }

  const tabs = data.sheets;

  if (!tabs.length) {
    menuSheet.innerHTML = `<option>Không có sheet</option>`;
    return;
  }

  menuSheet.innerHTML = tabs
    .map(t => `<option value="${t.gid}">${t.name}</option>`)
    .join("");

  openSheetTab(tabs[0].gid);
}


  function openSheetTab(gid) {
    if (!currentFileId) return;
    iframe.src = buildEmbedUrl(currentFileId, gid);
  }

  /* ======================================================
     URL BUILDER – FIX TRIỆT ĐỂ GID
     ====================================================== */
  function buildEmbedUrl(fileId, gid) {
    let url = `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    if (gid !== undefined && gid !== null) {
      url += `#gid=${gid}`;
    }
    return url;
  }

  /* ======================================================
     ZOOM
     ====================================================== */
  function setZoom(z) {
    zoomLevel = Math.max(0.6, Math.min(1.4, z));
    iframe.style.transform = `scale(${zoomLevel})`;
    iframe.style.transformOrigin = "0 0";
  }
}
// menu tháng hiện tại
function pickCurrentMonthFile(files) {
  const now = new Date();

  // chỉ lấy file có month hợp lệ
  const monthFiles = files
    .filter(f => f.month && !isNaN(new Date(f.month)))
    .map(f => ({ ...f, _date: new Date(f.month) }))
    .sort((a, b) => a._date - b._date);

  if (!monthFiles.length) return null;

  // ưu tiên đúng tháng hiện tại
  let current = monthFiles.find(f =>
    f._date.getFullYear() === now.getFullYear() &&
    f._date.getMonth() === now.getMonth()
  );

  // không có thì lấy tháng gần nhất trước đó
  if (!current) {
    current = monthFiles.filter(f => f._date <= now).slice(-1)[0];
  }

  return current || monthFiles[0];
}
