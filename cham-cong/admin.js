const API_URL =
  "https://script.google.com/macros/s/AKfycbyoQOB3un6fU-bMkeIiU6s7Jy9zWSoi-JDCq2Db-YQyB2uW9gUKZv9kTr9TBpZHXVRD/exec";

const fileSelect  = document.getElementById("fileSelect");
const sheetSelect = document.getElementById("sheetSelect");
const btnSubmit   = document.getElementById("btnSubmit");

let currentFileId = "";

async function loadFiles() {
  const res = await fetch(API_URL + "?action=files");
  const files = await res.json();

  fileSelect.innerHTML = files.map(f =>
    `<option value="${f.fileId}">${f.name}</option>`
  ).join("");

  if (files[0]) {
    currentFileId = files[0].fileId;
    loadSheets();
  }
}

async function loadSheets() {
  currentFileId = fileSelect.value;
  const res = await fetch(
    API_URL + "?action=sheets&fileId=" + currentFileId
  );
  const data = await res.json();

  sheetSelect.innerHTML = (data.sites || []).map(s =>
    `<option value="Nhật ký ${s.maCan}">
      Nhật ký ${s.maCan}
    </option>`
  ).join("");
}

async function submitLog() {
  const payload = {
    action: "write-log",
    fileId: currentFileId,
    sheetName: sheetSelect.value,
    to: document.getElementById("to").value,
    cong: document.getElementById("cong").value,
    noiDung: document.getElementById("noiDung").value
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const r = await res.json();

  if (r.ok) {
    alert("Đã ghi nhật ký");
    document.getElementById("cong").value = "";
    document.getElementById("noiDung").value = "";
  } else {
    alert("Lỗi: " + r.error);
  }
}

fileSelect.addEventListener("change", loadSheets);
btnSubmit.addEventListener("click", submitLog);

loadFiles();
