/************************************************************
 * SHEET OVERLAY – ĐÚNG LUỒNG API CỦA DUKICO
 ************************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

/* ================= DOM ================= */
const overlay   = document.getElementById("sheetOverlay");
const iframe    = document.getElementById("sheetFrame");

const btnOpen   = document.getElementById("openSheetBtn");
const btnClose  = document.getElementById("sheetClose");
const btnZoomIn = document.getElementById("sheetZoomIn");
const btnZoomOut= document.getElementById("sheetZoomOut");

const menu1Box  = document.getElementById("sheetMenu1"); // FILE
const menu2Box  = document.getElementById("sheetMenu2"); // TAB

/* ================= STATE ================= */
let currentFileUrl = "";
let currentFileId  = "";
let currentZoom    = 1;

/* ================= OPEN / CLOSE ================= */
btnOpen.onclick = () => {
  overlay.classList.add("show");
  loadFileList();       // 👈 BƯỚC 1
};

btnClose.onclick = () => {
  overlay.classList.remove("show");
};

/* ================= MENU 1 – FILE ================= */
async function loadFileList() {
  menu1Box.innerHTML = "Đang tải…";
  menu2Box.innerHTML = "";

  try {
    const res = await fetch(API_URL + "?action=files");
    const files = await res.json();

    menu1Box.innerHTML = "";

    files.forEach(f => {
      const btn = document.createElement("button");
      btn.textContent = f.name;

      btn.onclick = () => {
        currentFileUrl = f.url;
        currentFileId  = f.fileId;
        currentZoom = 1;

        loadSheet(f.url);
        loadSheetTabs(f.fileId);   // 👈 BƯỚC 2
      };

      menu1Box.appendChild(btn);
    });

    // 👉 tự mở file đầu tiên
    if (files[0]) {
      currentFileUrl = files[0].url;
      currentFileId  = files[0].fileId;
      loadSheet(currentFileUrl);
      loadSheetTabs(currentFileId);
    }

  } catch (e) {
    console.error("❌ loadFileList error:", e);
    menu1Box.innerHTML = "Lỗi tải file";
  }
}

/* ================= MENU 2 – TAB ================= */
async function loadSheetTabs(fileId) {
  menu2Box.innerHTML = "Đang tải tab…";

  try {
    const res = await fetch(
      API_URL + "?action=sheets&fileId=" + encodeURIComponent(fileId)
    );
    const data = await res.json();

    menu2Box.innerHTML = "";

    (data.sheets || []).forEach(sh => {
      const btn = document.createElement("button");
      btn.textContent = sh.name;

      btn.onclick = () => {
        loadSheet(currentFileUrl, sh.gid);
      };

      menu2Box.appendChild(btn);
    });

  } catch (e) {
    console.error("❌ loadSheetTabs error:", e);
    menu2Box.innerHTML = "Lỗi tải tab";
  }
}

/* ================= LOAD SHEET ================= */
function loadSheet(url, gid) {
  if (!url) return;

  let finalUrl = url;
  if (gid) finalUrl += "#gid=" + gid;

  iframe.src = finalUrl;
  iframe.style.transform = `scale(${currentZoom})`;
  iframe.style.transformOrigin = "0 0";
}

/* ================= ZOOM ================= */
btnZoomIn.onclick = () => {
  currentZoom += 0.1;
  iframe.style.transform = `scale(${currentZoom})`;
};

btnZoomOut.onclick = () => {
  currentZoom = Math.max(0.6, currentZoom - 0.1);
  iframe.style.transform = `scale(${currentZoom})`;
};
