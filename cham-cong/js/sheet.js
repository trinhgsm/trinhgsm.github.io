const SHEET_API =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

/* ===== PUBLIC FUNCTION ===== */
window.openSheetOverlay = async function () {
  let overlay = document.getElementById("sheetOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sheetOverlay";
    overlay.innerHTML = `
      <div class="sheet-panel">
        <div class="sheet-header">
          <strong>Google Sheet</strong>
          <button id="closeSheet">✕</button>
        </div>
        <iframe id="sheetFrame"></iframe>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("closeSheet").onclick = () => {
      overlay.classList.remove("show");
    };
  }

  overlay.classList.add("show");

  // load danh sách file & hiển thị file đầu tiên
  await loadFirstSheet();
};

async function loadFirstSheet() {
  const iframe = document.getElementById("sheetFrame");
  if (!iframe) return;

  const res = await fetch(SHEET_API);
  const files = await res.json();

  if (!files || !files.length) {
    iframe.srcdoc = "<p style='color:white;padding:16px'>Không có dữ liệu</p>";
    return;
  }

  iframe.src = files[0].url;
}
