/*************************************************
 * SHEET DRAWER – ĐỘC LẬP VỚI DASHBOARD
 *************************************************/

const SHEET_API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

/* ===============================
   INIT HTML
   =============================== */
(function initSheetDrawer() {

  // nút mở
  const btn = document.createElement("button");
  btn.id = "sheetOpenBtn";
  btn.textContent = "📊 Sheet";
  document.body.appendChild(btn);

  // drawer
  const drawer = document.createElement("div");
  drawer.id = "sheetDrawer";
  drawer.innerHTML = `
    <div class="sheet-toolbar">
      <select id="sheetFileSelect"></select>
      <select id="sheetTabSelect"></select>

      <button id="sheetDriveBtn">📁</button>
      <button id="sheetZoomIn">＋</button>
      <button id="sheetZoomOut">－</button>
    </div>
    <iframe id="sheetFrame"></iframe>
  `;
  document.body.appendChild(drawer);

  // toggle
  btn.onclick = () => drawer.classList.toggle("open");

  loadSheetFiles();
})();

/* ===============================
   LOAD FILE MENU (A / C)
   =============================== */
async function loadSheetFiles() {
  const res = await fetch(SHEET_API_URL + "?action=sheetFiles");
  const files = await res.json();

  const sel = document.getElementById("sheetFileSelect");
  sel.innerHTML = files.map(f =>
    `<option value="${f.url}">${f.name}</option>`
  ).join("");

  if (files[0]) {
    loadSheet(files[0].url);
    loadTabsFromUrl(files[0].url);
  }

  sel.onchange = e => {
    loadSheet(e.target.value);
    loadTabsFromUrl(e.target.value);
  };
}

/* ===============================
   LOAD SHEET
   =============================== */
function loadSheet(url) {
  const iframe = document.getElementById("sheetFrame");
  iframe.style.transform = "scale(1)";
  iframe.src = url.replace("/edit", "/preview");
}

/* ===============================
   LOAD TABS
   =============================== */
async function loadTabsFromUrl(url) {
  const fileId = extractFileId(url);
  if (!fileId) return;

  const res = await fetch(
    SHEET_API_URL + "?action=sheetTabs&fileId=" + fileId
  );
  const tabs = await res.json();

  const sel = document.getElementById("sheetTabSelect");
  sel.innerHTML = tabs.map(t =>
    `<option value="${t}">${t}</option>`
  ).join("");

  sel.onchange = e => {
    const iframe = document.getElementById("sheetFrame");
    iframe.src = iframe.src.split("#")[0] + "#sheet=" + e.target.value;
  };
}

/* ===============================
   ZOOM
   =============================== */
let sheetZoom = 1;

document.addEventListener("click", e => {
  if (e.target.id === "sheetZoomIn") {
    sheetZoom += 0.1;
    applyZoom();
  }
  if (e.target.id === "sheetZoomOut") {
    sheetZoom = Math.max(0.7, sheetZoom - 0.1);
    applyZoom();
  }
  if (e.target.id === "sheetDriveBtn") {
    window.open("https://drive.google.com", "_blank");
  }
});

function applyZoom() {
  document.getElementById("sheetFrame")
    .style.transform = `scale(${sheetZoom})`;
}

/* ===============================
   UTIL
   =============================== */
function extractFileId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}
