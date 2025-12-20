/* =========================================================
   CONFIG
========================================================= */
const API_URL =
  "https://script.google.com/macros/s/AKfycbwHS3lImLY7cFJiWE23fZrTN1i8F_hNwfHLwTVLHuh7o1Erwylyj-KwzI7kVhZtlmWm/exec";

/* =========================================================
   DOM
========================================================= */
const fileMenu  = document.getElementById("fileMenu");
const sheetMenu = document.getElementById("sheetMenu");
const editBtn   = document.getElementById("editBtn");
const frame     = document.getElementById("sheetFrame");

const statusList      = document.getElementById("statusList");
const statusNoteTrack = document.getElementById("statusNoteTrack");

/* =========================================================
   UTIL
========================================================= */
function buildSheetUrl(fileId, gid) {
  return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}`;
}

/* =========================================================
   LOAD FILES
========================================================= */
async function loadFiles() {
  try {
    const res = await fetch(API_URL + "?action=files");
    const files = await res.json();

    fileMenu.innerHTML = "";

    files.forEach(f => {
      const op = document.createElement("option");
      op.value = f.fileId;
      op.textContent = f.name;
      fileMenu.appendChild(op);
    });

    if (files.length > 0) {
      await loadSheets(files[0].fileId);
    }
  } catch (e) {
    console.error("loadFiles error", e);
  }
}

/* =========================================================
   LOAD SHEETS + STATUS
========================================================= */
async function loadSheets(fileId) {
  try {
    const res = await fetch(
      API_URL + "?action=sheets&fileId=" + encodeURIComponent(fileId)
    );
    const data = await res.json();

    /* ===== SHEET MENU ===== */
    sheetMenu.innerHTML = "";

    (data.sheets || []).forEach(s => {
      const op = document.createElement("option");
      op.value = s.gid;
      op.textContent = s.name;
      sheetMenu.appendChild(op);
    });

    if (data.sheets && data.sheets.length > 0) {
      openSheet(fileId, data.sheets[0].gid);
    }

    /* ===== STATUS BAR ===== */
    renderSiteStatus(data.sites || []);

  } catch (e) {
    console.error("loadSheets error", e);
  }
}

/* =========================================================
   OPEN SHEET
========================================================= */
function openSheet(fileId, gid) {
  frame.src = buildSheetUrl(fileId, gid);
}

/* =========================================================
   RENDER STATUS BAR
========================================================= */
function renderSiteStatus(sites) {

  /* ---------- NÚT MÃ CĂN ---------- */
  if (statusList) {
    statusList.innerHTML = "";

    sites.forEach(s => {
      const dotClass =
        s.status === "green"  ? "green" :
        s.status === "yellow" ? "yellow" :
                                "red";

      const el = document.createElement("div");
      el.className = "site-item";
      el.innerHTML = `
        <span class="site-dot dot ${dotClass}"></span>
        <strong>${s.maCan}</strong>
      `;

      el.onclick = () => {
        sheetMenu.value = s.gid;
        openSheet(fileMenu.value, s.gid);
      };

      statusList.appendChild(el);
    });
  }

  /* ---------- GHI CHÚ TRÔI ---------- */
  if (!statusNoteTrack) return;

  statusNoteTrack.innerHTML = "";

  sites.forEach(s => {
    let text = "";

    if (s.status === "green" && s.summary) {
      text = "🟢 " + s.maCan + ": " + s.summary;
    } else if (s.status === "yellow") {
      text = "🟡 " + s.maCan + ": 1 ngày không thi công";
    } else if (s.status === "red") {
      text = "🔴 " + s.maCan + ": Trên 2 ngày không thi công";
    }

    if (!text) return;

    const span = document.createElement("span");
    span.textContent = text;
    statusNoteTrack.appendChild(span);
  });
}

/* =========================================================
   EVENTS
========================================================= */
fileMenu.addEventListener("change", () => {
  loadSheets(fileMenu.value);
});

sheetMenu.addEventListener("change", () => {
  openSheet(fileMenu.value, sheetMenu.value);
});

if (editBtn) {
  editBtn.addEventListener("click", () => {
    const url = buildSheetUrl(fileMenu.value, sheetMenu.value);
    window.open(url, "_blank");
  });
}

/* =========================================================
   START
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
});
