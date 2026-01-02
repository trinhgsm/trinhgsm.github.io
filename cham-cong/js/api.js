/* ===== UTIL ===== */
function extractSheetId(url) {
  if (!url) return null;
  const m = String(url).match(/\/d\/([a-zA-Z0-9\-_]+)/);
  return m ? m[1] : null;
}

function isCurrentMonthValue(val, curM, curY) {
  if (!val) return false;

  if (val instanceof Date) {
    return (val.getMonth() + 1 === curM) && (val.getFullYear() === curY);
  }

  const s = String(val).trim();

  let m = s.match(/^(\d{1,2})\s*[\/\-]\s*(\d{4})$/);
  if (m) {
    const month = parseInt(m[1], 10);
    const year  = parseInt(m[2], 10);
    return month === curM && year === curY;
  }

  m = s.match(/^(\d{4})\s*[\/\-]\s*(\d{1,2})$/);
  if (m) {
    const year  = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    return month === curM && year === curY;
  }

  m = s.match(/Tháng\s*(\d{1,2})\s*[\/\-]?\s*(\d{4})?/i);
  if (m) {
    const month = parseInt(m[1], 10);
    const year  = m[2] ? parseInt(m[2], 10) : curY;
    return month === curM && year === curY;
  }

  return false;
}

/* ===== LOAD FILES ===== */
async function loadFiles() {
  showLoading();
  try {
    const res  = await fetch(API_URL + "?action=files");
    const list = await res.json();

    fileMenu.innerHTML = "";

    const now  = new Date();
    const curM = now.getMonth() + 1;
    const curY = now.getFullYear();

    let defaultIndex = -1;

    list.forEach((item, idx) => {
      if (!item.url) return;

      const op = document.createElement("option");
      op.value = item.url;
      op.textContent = item.name || ("Dòng " + item.rowIndex);
      fileMenu.appendChild(op);

      // ✅ CHỈ KIỂM TRA THÁNG
      if (item.month && isCurrentMonthValue(item.month, curM, curY)) {
        defaultIndex = idx;
      }
    });

    // ✅ ƯU TIÊN FILE THÁNG HIỆN TẠI
    if (defaultIndex >= 0) {
      fileMenu.selectedIndex = defaultIndex;
    } else {
      // fallback: chọn file cuối cùng
      fileMenu.selectedIndex = fileMenu.options.length - 1;
    }

    await loadSheetsForCurrentFile();
  } catch (err) {
    console.error(err);
    alert("Lỗi tải danh sách file");
    hideLoading();
  }
}

/* ===== LOAD SHEETS ===== */
async function loadSheetsForCurrentFile() {
  const fileUrl = fileMenu.value;
  if (!fileUrl) {
    hideLoading();
    return;
  }

  const id = extractSheetId(fileUrl);
  if (!id) {
    sheetMenu.innerHTML = "";
    hideLoading();
    return;
  }

  showLoading();
  try {
    const res  = await fetch(API_URL + "?action=sheets&fileId=" + encodeURIComponent(id));
const data = await res.json();

const tabs  = data.sheets || [];
const sites = data.sites  || [];

renderSiteStatus(sites);   // ⭐ BẮT BUỘC

sheetMenu.innerHTML = "";

const today = new Date();
const day   = today.getDate();
const preferredName = (day <= 15) ? "Ngày 1 đến 15" : "Ngày 16 đến 31";
let preferredGid = null;

tabs.forEach(t => {

      const op = document.createElement("option");
      op.value = t.gid;
      op.textContent = t.name;
      sheetMenu.appendChild(op);

      if (!preferredGid && t.name === preferredName) {
        preferredGid = t.gid;
      }
    });

    if (sheetMenu.options.length > 0) {
      if (preferredGid) {
        sheetMenu.value = preferredGid;
      } else {
        sheetMenu.selectedIndex = 0;
      }
      updateFrame();
    } else {
      hideLoading();
    }
  } catch (err) {
    console.error(err);
    alert("Lỗi tải danh sách sheet/tabs.");
    hideLoading();
  }
}

/* ===== BUILD URL EDIT#GID ===== */
function buildEditUrl() {
  const fileUrl = fileMenu.value;
  if (!fileUrl) return "";

  const id  = extractSheetId(fileUrl);
  const gid = sheetMenu.value || "";
  if (!id) return fileUrl;

  return `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${gid}`;
}

/* ===== UPDATE IFRAME ===== */
function updateFrame() {
  const url = buildEditUrl();
  if (url) {
    showLoading();
    frame.src = url;
    setTimeout(autoScaleIframe, 300);
  }
}

fileMenu.onchange  = () => { loadSheetsForCurrentFile(); };
sheetMenu.onchange = updateFrame;

/* ===== NÚT SỬA (MOBILE) ===== */
editBtn.onclick = () => {
  const url = buildEditUrl();
  if (url) window.open(url, "_blank");
};

/* ===== NÚT THƯ MỤC DRIVE ===== */
driveBtn.onclick = () => {
  window.open("https://drive.google.com/drive/folders/1o3n5GABxec53ANpnS_OaDU1w0M3cGeAX?usp=sharing", "_blank");
};
