/* ===== CONFIG ===== */
const API_URL = "https://script.google.com/macros/s/XXX/exec";

/* ===== DOM ===== */
const fileMenu  = document.getElementById("fileMenu");
const sheetMenu = document.getElementById("sheetMenu");
const frame     = document.getElementById("sheetFrame");

/* ===== LOAD FILES ===== */
async function loadFiles() {
  const res = await fetch(API_URL + "?action=files");
  const files = await res.json();

  fileMenu.innerHTML = "";

  files.forEach(f => {
    const op = document.createElement("option");
    op.value = f.fileId;
    op.textContent = f.name;
    fileMenu.appendChild(op);
  });

  if (files.length) {
    await loadSheets(files[0].fileId);
  }
}

/* ===== LOAD SHEETS ===== */
async function loadSheets(fileId) {
  const res = await fetch(API_URL + "?action=sheets&fileId=" + fileId);
  const data = await res.json();

  /* TAB */
  sheetMenu.innerHTML = "";
  data.sheets.forEach(t => {
    const op = document.createElement("option");
    op.value = t.gid;
    op.textContent = t.name;
    sheetMenu.appendChild(op);
  });

  if (data.sheets.length) {
    openSheet(fileId, data.sheets[0].gid);
  }

  /* STATUS BAR */
  renderSiteStatus(data.sites || []);
}

/* ===== OPEN SHEET ===== */
function openSheet(fileId, gid) {
  frame.src =
    `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${gid}`;
}

/* ===== RENDER STATUS BAR ===== */
function renderSiteStatus(sites) {

  const list = document.getElementById("statusList");
  const note = document.getElementById("statusNoteTrack");

  list.innerHTML = "";
  note.innerHTML = "";

  sites.forEach(s => {

    /* NÚT */
    const dotClass =
      s.status === "green" ? "green" :
      s.status === "yellow" ? "yellow" : "red";

    const btn = document.createElement("div");
    btn.className = "site-item";
    btn.innerHTML = `
      <span class="site-dot dot ${dotClass}"></span>
      <strong>${s.maCan}</strong>
    `;
    btn.onclick = () => {
      sheetMenu.value = s.gid;
      openSheet(fileMenu.value, s.gid);
    };
    list.appendChild(btn);

    /* GHI CHÚ TRÔI */
    let text = "";
    if (s.status === "green" && s.summary) {
      text = "🟢 " + s.maCan + ": " + s.summary;
    } else if (s.status === "yellow") {
      text = "🟡 " + s.maCan + ": 1 ngày không thi công";
    } else if (s.status === "red") {
      text = "🔴 " + s.maCan + ": trên 2 ngày không thi công";
    }

    if (text) {
      const span = document.createElement("span");
      span.textContent = text;
      note.appendChild(span);
    }
  });
}

/* ===== EVENTS ===== */
fileMenu.onchange = () => loadSheets(fileMenu.value);
sheetMenu.onchange = () => openSheet(fileMenu.value, sheetMenu.value);

/* ===== START ===== */
loadFiles();
