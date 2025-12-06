/**************************************************
 * CẤU HÌNH API
 **************************************************/
const API_BASE = 'https://script.google.com/macros/s/XXXX/exec'; // ĐỔI THÀNH URL CỦA BẠN

/**************************************************
 * STATE
 **************************************************/
let projects = [];
let currentProjectName = '';
let rooms = [];
let filteredRooms = [];
let highlightRoomId = null;

let pdfDoc = null;
let currentPage = 1;
let totalPages = 1;
let pdfScale = 1.3;

let pdfCanvas, pdfCtx;
let stage = null;
let layer = null;
let isDrawing = false;
let drawingPoints = [];
let drawingLine = null;

// room edit modal state
let editingRoomId = null;

/**************************************************
 * DOM
 **************************************************/
const projectSelect = document.getElementById('projectSelect');
const btnReloadProjects = document.getElementById('btnReloadProjects');
const projectMeta = document.getElementById('projectMeta');
const fileLinks = document.getElementById('fileLinks');
const uploadStatus = document.getElementById('uploadStatus');

const pdfInput = document.getElementById('pdfInput');
const dwgInput = document.getElementById('dwgInput');

const pageSelect = document.getElementById('pageSelect');
const btnStartDraw = document.getElementById('btnStartDraw');
const btnUndoPoint = document.getElementById('btnUndoPoint');
const btnCancelDraw = document.getElementById('btnCancelDraw');

const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnClearSearch = document.getElementById('btnClearSearch');

const menuContainer = document.getElementById('menuContainer');
const roomsList = document.getElementById('roomsList');
const statsBlock = document.getElementById('statsBlock');

const mobileDrawBar = document.getElementById('mobileDrawBar');
const mbBtnStartDraw = document.getElementById('mbBtnStartDraw');
const mbBtnUndoPoint = document.getElementById('mbBtnUndoPoint');
const mbBtnCancelDraw = document.getElementById('mbBtnCancelDraw');

const pdfWrapper = document.getElementById('pdfWrapper');

// modal
const roomModalBackdrop = document.getElementById('roomModalBackdrop');
const roomModalClose = document.getElementById('roomModalClose');
const roomModalCancel = document.getElementById('roomModalCancel');
const roomForm = document.getElementById('roomForm');
const roomNameInput = document.getElementById('roomNameInput');
const roomTypeInput = document.getElementById('roomTypeInput');
const roomFloorInput = document.getElementById('roomFloorInput');
const roomPageInput = document.getElementById('roomPageInput');
const roomColorPicker = document.getElementById('roomColorPicker');
const roomColorInput = document.getElementById('roomColorInput');
const roomAreaDisplay = document.getElementById('roomAreaDisplay');

/**************************************************
 * UTIL
 **************************************************/
function showStatus(msg) {
  uploadStatus.textContent = msg || '';
}

function polygonArea(points) {
  if (!points || points.length < 6) return 0;
  let area = 0;
  const n = points.length / 2;
  for (let i = 0; i < n; i++) {
    const x1 = points[2 * i];
    const y1 = points[2 * i + 1];
    const j = (i + 1) % n;
    const x2 = points[2 * j];
    const y2 = points[2 * j + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function groupRoomsByFloorAndType(list) {
  const byFloor = {};
  list.forEach((r) => {
    const f = r.floor ?? 0;
    if (!byFloor[f]) byFloor[f] = {};
    const t = r.type || 'Khác';
    if (!byFloor[f][t]) byFloor[f][t] = [];
    byFloor[f][t].push(r);
  });
  return byFloor;
}

function filterRoomsByQuery(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  let pageFilter = null;
  const pageMatch = q.match(/trang\s+(\d+)/);
  if (pageMatch) pageFilter = parseInt(pageMatch[1], 10);

  let floorFilter = null;
  const floorMatch = q.match(/tầng\s+(\d+)/);
  if (floorMatch) floorFilter = parseInt(floorMatch[1], 10);

  const cleaned = q
    .replace(/tầng\s+\d+/g, '')
    .replace(/trang\s+\d+/g, '')
    .trim();

  const keywords = cleaned.split(/\s+/).filter(Boolean);

  return rooms.filter((r) => {
    if (floorFilter != null && Number(r.floor) !== floorFilter) return false;
    if (pageFilter != null && Number(r.page) !== pageFilter) return false;

    if (!keywords.length) return true;
    const hay = `${(r.name || '').toLowerCase()} ${(r.type || '').toLowerCase()}`;
    return keywords.every((kw) => hay.includes(kw));
  });
}

/**************************************************
 * API helpers
 **************************************************/
async function apiGet(params) {
  const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function apiPostForm(action, payloadObj) {
  const body = new URLSearchParams();
  body.set('action', action);
  if (payloadObj) {
    body.set('payload', JSON.stringify(payloadObj));
  }
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function apiUploadFile(projectName, fileType, file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('projectName', projectName);
  fd.append('fileType', fileType);
  fd.append('action', 'uploadFile');

  const res = await fetch(API_BASE, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/**************************************************
 * PROJECTS
 **************************************************/
async function loadProjects() {
  projectSelect.innerHTML = '<option value="">Đang tải...</option>';
  try {
    const data = await apiGet({ action: 'projects' });
    if (!data.success) throw new Error(data.error || 'Failed');
    projects = data.projects || [];
    renderProjectSelect();
  } catch (err) {
    console.error(err);
    projectSelect.innerHTML = '<option value="">Lỗi tải dự án</option>';
  }
}

function renderProjectSelect() {
  projectSelect.innerHTML = '';
  if (!projects.length) {
    projectSelect.innerHTML = '<option value="">Chưa có dự án trong sheet</option>';
    currentProjectName = '';
    return;
  }
  projects.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.projectName;
    opt.textContent = p.projectName;
    projectSelect.appendChild(opt);
  });

  if (!currentProjectName) {
    currentProjectName = projects[0].projectName;
  }
  projectSelect.value = currentProjectName;
  onProjectChange();
}

async function onProjectChange() {
  currentProjectName = projectSelect.value;
  highlightRoomId = null;
  filteredRooms = [];
  searchInput.value = '';

  const proj = projects.find((p) => p.projectName === currentProjectName);
  if (!proj) {
    projectMeta.textContent = '';
    fileLinks.innerHTML = '';
    rooms = [];
    renderRoomsUI();
    clearPdf();
    return;
  }

  projectMeta.textContent = proj.folderUrl
    ? `Thư mục: ${proj.folderId}`
    : 'Chưa có thư mục dự án';

  fileLinks.innerHTML = '';
  const lines = [];
  if (proj.pdfLink) {
    lines.push(
      `PDF: <a href="${proj.pdfLink}" target="_blank" rel="noopener">Mở trên Drive</a>`
    );
  } else {
    lines.push('PDF: <span class="muted">Chưa có</span>');
  }
  if (proj.dwgLink) {
    lines.push(
      `DWG: <a href="${proj.dwgLink}" target="_blank" rel="noopener">Mở trên Drive</a>`
    );
  } else {
    lines.push('DWG: <span class="muted">Chưa có</span>');
  }
  fileLinks.innerHTML = lines.join('<br/>');

  await Promise.all([loadRoomsForCurrentProject(), loadPdfFromProjectConfig(proj)]);
}

/**************************************************
 * ROOMS
 **************************************************/
async function loadRoomsForCurrentProject() {
  if (!currentProjectName) return;
  try {
    const data = await apiGet({ action: 'rooms', projectName: currentProjectName });
    if (!data.success) throw new Error(data.error || 'Failed');
    rooms = (data.rooms || []).map((r) => ({
      ...r,
      floor: Number(r.floor || 0),
      area: Number(r.area || 0),
      page: Number(r.page || 1),
      polygon: Array.isArray(r.polygon) ? r.polygon : [],
    }));
    renderRoomsUI();
    redrawRoomsOnCanvas();
  } catch (err) {
    console.error(err);
    rooms = [];
    renderRoomsUI();
  }
}

function renderRoomsUI() {
  const list = filteredRooms.length ? filteredRooms : rooms;

  // rooms list
  roomsList.innerHTML = '';
  if (!list.length) {
    roomsList.innerHTML =
      '<div style="font-size:12px;color:#9ca3af;">Chưa có phòng.</div>';
  } else {
    list.forEach((r) => {
      const item = document.createElement('div');
      item.className = 'rooms-item';

      const main = document.createElement('div');
      main.className = 'rooms-main';

      const title = document.createElement('div');
      title.className = 'rooms-title';

      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.backgroundColor = r.color || '#22c55e';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = r.name || '(Không tên)';
      nameSpan.style.cursor = 'pointer';

      nameSpan.onclick = () => highlightRoom(r);

      title.appendChild(dot);
      title.appendChild(nameSpan);

      const sub = document.createElement('div');
      sub.className = 'rooms-sub';
      sub.textContent = `Tầng ${r.floor} · ${r.type || 'Chưa phân loại'} · Trang ${
        r.page
      } · Diện tích(px²): ${Math.round(r.area || 0)}`;

      main.appendChild(title);
      main.appendChild(sub);

      const actions = document.createElement('div');
      actions.className = 'rooms-actions';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn ghost';
      btnEdit.textContent = 'Sửa';
      btnEdit.style.fontSize = '11px';
      btnEdit.onclick = (ev) => {
        ev.stopPropagation();
        openRoomModal(r);
      };

      const btnDel = document.createElement('button');
      btnDel.className = 'btn ghost';
      btnDel.textContent = 'Xóa';
      btnDel.style.fontSize = '11px';
      btnDel.onclick = async (ev) => {
        ev.stopPropagation();
        await onDeleteRoom(r);
      };

      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);

      item.appendChild(main);
      item.appendChild(actions);
      roomsList.appendChild(item);
    });
  }

  // menu by floor / type (chỉ hiển thị phòng của trang hiện tại)
  const currentList = (filteredRooms.length ? filteredRooms : rooms).filter(
    (r) => r.page === currentPage
  );
  menuContainer.innerHTML = '';
  if (!currentList.length) {
    menuContainer.innerHTML =
      '<div style="font-size:12px;color:#9ca3af;">Chưa có phòng trên trang này.</div>';
  } else {
    const grouped = groupRoomsByFloorAndType(currentList);
    Object.keys(grouped)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((floor) => {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'menu-floor';

        const floorTitle = document.createElement('div');
        floorTitle.className = 'menu-floor-title';
        floorTitle.textContent = 'Tầng ' + floor;
        floorDiv.appendChild(floorTitle);

        const types = grouped[floor];
        Object.entries(types).forEach(([type, arr]) => {
          const typeDiv = document.createElement('div');
          typeDiv.className = 'menu-type-item';

          const typeLabel = document.createElement('div');
          typeLabel.className = 'menu-type-label';
          typeLabel.textContent = `${type} (${arr.length})`;
          typeDiv.appendChild(typeLabel);

          const ul = document.createElement('ul');
          ul.className = 'menu-room-list';

          arr.forEach((r) => {
            const li = document.createElement('li');
            li.className = 'menu-room-item';
            li.textContent = r.name || '(Không tên)';
            li.onclick = () => highlightRoom(r);
            ul.appendChild(li);
          });

          typeDiv.appendChild(ul);
          floorDiv.appendChild(typeDiv);
        });

        menuContainer.appendChild(floorDiv);
      });
  }

  renderStats();
}

function renderStats() {
  if (!rooms.length) {
    statsBlock.textContent = 'Chưa có dữ liệu.';
    return;
  }
  const totalRooms = rooms.length;
  const byFloor = {};
  const byType = {};
  rooms.forEach((r) => {
    const f = String(r.floor ?? 'N/A');
    const t = r.type || 'Khác';
    const a = Number(r.area || 0);

    if (!byFloor[f]) byFloor[f] = { count: 0, area: 0 };
    byFloor[f].count++;
    byFloor[f].area += a;

    if (!byType[t]) byType[t] = { count: 0, area: 0 };
    byType[t].count++;
    byType[t].area += a;
  });

  let html = `<div>Tổng phòng: ${totalRooms}</div>`;
  html += '<h4>Theo tầng</h4><ul>';
  Object.entries(byFloor)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([f, v]) => {
      html += `<li>Tầng ${f}: ${v.count} phòng · Tổng px²: ${Math.round(
        v.area
      )}</li>`;
    });
  html += '</ul><h4>Theo loại phòng</h4><ul>';
  Object.entries(byType).forEach(([t, v]) => {
    html += `<li>${t}: ${v.count} phòng · Tổng px²: ${Math.round(v.area)}</li>`;
  });
  html += '</ul>';

  statsBlock.innerHTML = html;
}

async function onDeleteRoom(room) {
  if (!confirm('Xóa phòng này khỏi dự án?')) return;
  try {
    await apiPostForm('deleteRoom', {
      projectName: currentProjectName,
      roomId: room.roomId,
    });
    rooms = rooms.filter((r) => r.roomId !== room.roomId);
    filteredRooms = filteredRooms.filter((r) => r.roomId !== room.roomId);
    if (highlightRoomId === room.roomId) highlightRoomId = null;
    renderRoomsUI();
    redrawRoomsOnCanvas();
  } catch (err) {
    console.error(err);
    alert('Lỗi xóa phòng');
  }
}

function highlightRoom(room) {
  if (!room) return;
  // Nếu phòng ở trang khác, chuyển trang
  if (room.page !== currentPage) {
    currentPage = room.page;
    pageSelect.value = String(currentPage);
    renderPage(currentPage).then(() => {
      highlightRoomId = room.roomId;
      redrawRoomsOnCanvas();
    });
  } else {
    highlightRoomId = room.roomId;
    redrawRoomsOnCanvas();
  }
}

/**************************************************
 * MODAL EDIT ROOM
 **************************************************/
function openRoomModal(room) {
  if (!room) return;
  editingRoomId = room.roomId;

  roomNameInput.value = room.name || '';
  roomTypeInput.value = room.type || '';
  roomFloorInput.value = room.floor ?? 0;
  roomPageInput.value = room.page ?? currentPage;

  const color = room.color || '#22c55e';
  roomColorPicker.value = validHexColor(color) || '#22c55e';
  roomColorInput.value = validHexColor(color) || '#22c55e';

  roomAreaDisplay.value = Math.round(room.area || 0);

  roomModalBackdrop.classList.add('show');
}

function closeRoomModal() {
  editingRoomId = null;
  roomModalBackdrop.classList.remove('show');
}

function validHexColor(c) {
  if (!c) return null;
  let s = c.trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  return null;
}

/**************************************************
 * PDF & KONVA
 **************************************************/
function clearPdf() {
  const canvas = pdfCanvas;
  if (!canvas) return;
  const ctx = pdfCtx;
  ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  if (stage) {
    stage.destroy();
    stage = null;
    layer = null;
  }
  totalPages = 1;
  currentPage = 1;
  pageSelect.innerHTML = '';
  btnStartDraw.disabled = true;
  btnUndoPoint.disabled = true;
  btnCancelDraw.disabled = true;
  mbBtnStartDraw.disabled = true;
  mbBtnUndoPoint.disabled = true;
  mbBtnCancelDraw.disabled = true;
}

async function loadPdfFromProjectConfig(proj) {
  if (!proj || !proj.pdfLink) {
    clearPdf();
    return;
  }
  try {
    showStatus('Đang tải PDF từ Drive...');
    await loadPdfFromUrl(proj.pdfLink);
    showStatus('');
  } catch (err) {
    console.error(err);
    showStatus('Không tải được PDF từ Drive. Có thể lỗi quyền chia sẻ hoặc CORS.');
    clearPdf();
  }
}

async function loadPdfFromUrl(url) {
  if (!url) return;
  const loadingTask = pdfjsLib.getDocument(url);
  pdfDoc = await loadingTask.promise;
  totalPages = pdfDoc.numPages;
  currentPage = 1;

  renderPageSelect();
  await renderPage(currentPage);
}

function renderPageSelect() {
  pageSelect.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Trang ${i}`;
    pageSelect.appendChild(opt);
  }
  pageSelect.value = String(currentPage);
}

async function renderPage(pageNum) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: pdfScale });

  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;
  const ctx = pdfCtx;
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Konva
  const container = document.getElementById('konvaContainer');
  container.style.width = viewport.width + 'px';
  container.style.height = viewport.height + 'px';

  if (stage) stage.destroy();
  stage = new Konva.Stage({
    container: 'konvaContainer',
    width: viewport.width,
    height: viewport.height,
  });
  layer = new Konva.Layer();
  stage.add(layer);

  attachKonvaEvents();
  redrawRoomsOnCanvas();
}

function attachKonvaEvents() {
  if (!stage) return;

  stage.on('click tap', () => {
    if (!isDrawing) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    drawingPoints.push(pos.x, pos.y);
    if (!drawingLine) {
      drawingLine = new Konva.Line({
        points: drawingPoints,
        stroke: '#f97316',
        strokeWidth: 2,
        closed: false,
      });
      layer.add(drawingLine);
    } else {
      drawingLine.points(drawingPoints);
    }
    layer.draw();
    updateUndoButtons();
  });

  stage.on('dblclick dbltap', () => {
    if (!isDrawing) return;
    finishPolygon();
  });

  stage.on('touchmove', (e) => {
    e.evt.preventDefault();
  });
}

function redrawRoomsOnCanvas() {
  if (!layer) return;
  layer.destroyChildren();
  const list = rooms.filter((r) => r.page === currentPage);
  list.forEach((r) => {
    const isHL = r.roomId === highlightRoomId;
    const line = new Konva.Line({
      points: r.polygon || [],
      closed: true,
      stroke: isHL ? '#f97316' : r.color || '#22c55e',
      strokeWidth: isHL ? 3 : 1.5,
      fill: (r.color || '#22c55e') + '44',
    });
    layer.add(line);
  });
  if (drawingLine) layer.add(drawingLine);
  layer.draw();
}

/**************************************************
 * DRAWING MODE
 **************************************************/
function startDrawMode() {
  if (!pdfDoc || !layer) return;
  isDrawing = true;
  drawingPoints = [];
  if (drawingLine) {
    drawingLine.destroy();
    drawingLine = null;
  }
  layer.draw();

  btnStartDraw.disabled = true;
  btnUndoPoint.disabled = true;
  btnCancelDraw.disabled = false;

  mbBtnStartDraw.disabled = true;
  mbBtnUndoPoint.disabled = true;
  mbBtnCancelDraw.disabled = false;

  document.body.style.overflow = 'hidden';
}

function cancelDrawMode() {
  isDrawing = false;
  drawingPoints = [];
  if (drawingLine) {
    drawingLine.destroy();
    drawingLine = null;
    layer && layer.draw();
  }

  btnStartDraw.disabled = false;
  btnUndoPoint.disabled = true;
  btnCancelDraw.disabled = true;

  mbBtnStartDraw.disabled = false;
  mbBtnUndoPoint.disabled = true;
  mbBtnCancelDraw.disabled = true;

  document.body.style.overflow = '';
}

function undoLastPoint() {
  if (!drawingPoints.length) return;
  drawingPoints.splice(drawingPoints.length - 2, 2);
  if (!drawingPoints.length) {
    if (drawingLine) {
      drawingLine.destroy();
      drawingLine = null;
    }
    layer && layer.draw();
  } else if (drawingLine) {
    drawingLine.points(drawingPoints);
    layer && layer.draw();
  }
  updateUndoButtons();
}

function updateUndoButtons() {
  const hasPoints = drawingPoints.length > 0;
  btnUndoPoint.disabled = !hasPoints;
  mbBtnUndoPoint.disabled = !hasPoints;
}

function finishPolygon() {
  if (drawingPoints.length < 6) {
    alert('Polygon cần ít nhất 3 điểm.');
    drawingPoints = [];
    if (drawingLine) {
      drawingLine.destroy();
      drawingLine = null;
      layer && layer.draw();
    }
    cancelDrawMode();
    return;
  }
  const area = polygonArea(drawingPoints);
  const polygon = drawingPoints.slice();

  const name = prompt('Tên phòng (VD: Phòng ngủ 1):') || '';
  const type =
    prompt('Loại phòng (VD: Phòng ngủ, WC, khách...):') || '';
  const floorInput = prompt('Tầng số mấy? (VD: 1, 2, 3):') || '0';
  const floor = Number(floorInput) || 0;
  const color =
    prompt('Màu hex (VD: #ffcc00, để trống dùng mặc định #22c55e):') ||
    '#22c55e';

  if (!confirm('Lưu phòng này vào dự án?')) {
    drawingPoints = [];
    if (drawingLine) {
      drawingLine.destroy();
      drawingLine = null;
      layer && layer.draw();
    }
    cancelDrawMode();
    return;
  }

  saveRoomToServer({
    name,
    type,
    floor,
    color,
    area,
    page: currentPage,
    polygon,
  });
}

async function saveRoomToServer({ name, type, floor, color, area, page, polygon }) {
  try {
    const payload = {
      projectName: currentProjectName,
      name,
      type,
      floor,
      color,
      area,
      page,
      polygon,
    };
    const data = await apiPostForm('saveRoom', payload);
    if (!data.success) throw new Error(data.error || 'Failed');
    const r = data.room;
    const newRoom = {
      ...r,
      floor: Number(r.floor || 0),
      area: Number(r.area || 0),
      page: Number(r.page || 1),
      polygon: Array.isArray(r.polygon) ? r.polygon : [],
    };
    rooms.push(newRoom);
    filteredRooms = [];
    renderRoomsUI();

    highlightRoomId = newRoom.roomId;
    redrawRoomsOnCanvas();
  } catch (err) {
    console.error(err);
    alert('Lỗi lưu phòng lên Google Sheets');
  } finally {
    drawingPoints = [];
    if (drawingLine) {
      drawingLine.destroy();
      drawingLine = null;
      layer && layer.draw();
    }
    cancelDrawMode();
  }
}

/**************************************************
 * EVENTS
 **************************************************/
btnReloadProjects.addEventListener('click', loadProjects);

projectSelect.addEventListener('change', () => {
  onProjectChange();
});

pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !currentProjectName) return;
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Chỉ nhận file PDF.');
    return;
  }

  showStatus('Đang tải PDF cục bộ & upload lên Drive...');
  try {
    // Hiển thị PDF từ file local ngay lập tức
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;
    currentPage = 1;
    renderPageSelect();
    await renderPage(currentPage);

    // Upload lên Drive + cập nhật sheet
    const res = await apiUploadFile(currentProjectName, 'pdf', file);
    if (!res.success) throw new Error(res.error || 'Failed');

    // Cập nhật projects (pdfLink)
    await loadProjects();
    showStatus('Đã upload PDF & cập nhật sheet.');
  } catch (err) {
    console.error(err);
    showStatus('Lỗi khi xử lý PDF / upload Drive.');
  }
});

dwgInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !currentProjectName) return;
  if (!file.name.toLowerCase().endsWith('.dwg')) {
    alert('Chỉ nhận file DWG.');
    return;
  }
  showStatus('Đang upload DWG lên Drive...');
  try {
    const res = await apiUploadFile(currentProjectName, 'dwg', file);
    if (!res.success) throw new Error(res.error || 'Failed');
    await loadProjects();
    showStatus('Đã upload DWG & cập nhật sheet.');
  } catch (err) {
    console.error(err);
    showStatus('Lỗi upload DWG.');
  }
});

pageSelect.addEventListener('change', async () => {
  const val = parseInt(pageSelect.value, 10) || 1;
  currentPage = val;
  await renderPage(currentPage);
  renderRoomsUI();
});

btnStartDraw.addEventListener('click', startDrawMode);
btnCancelDraw.addEventListener('click', cancelDrawMode);
btnUndoPoint.addEventListener('click', undoLastPoint);

mbBtnStartDraw.addEventListener('click', startDrawMode);
mbBtnCancelDraw.addEventListener('click', cancelDrawMode);
mbBtnUndoPoint.addEventListener('click', undoLastPoint);

btnSearch.addEventListener('click', () => {
  const q = searchInput.value.trim();
  if (!q) {
    filteredRooms = [];
  } else {
    filteredRooms = filterRoomsByQuery(q);
  }
  renderRoomsUI();
  redrawRoomsOnCanvas();
});

btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  filteredRooms = [];
  renderRoomsUI();
  redrawRoomsOnCanvas();
});

/* Modal events */
roomModalClose.addEventListener('click', closeRoomModal);
roomModalCancel.addEventListener('click', (e) => {
  e.preventDefault();
  closeRoomModal();
});

roomModalBackdrop.addEventListener('click', (e) => {
  if (e.target === roomModalBackdrop) {
    closeRoomModal();
  }
});

roomColorPicker.addEventListener('input', () => {
  roomColorInput.value = roomColorPicker.value;
});

roomColorInput.addEventListener('blur', () => {
  const v = validHexColor(roomColorInput.value);
  if (v) {
    roomColorInput.value = v;
    roomColorPicker.value = v;
  }
});

/* Submit edit room */
roomForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingRoomId || !currentProjectName) return;
  const room = rooms.find((r) => r.roomId === editingRoomId);
  if (!room) {
    closeRoomModal();
    return;
  }

  const name = roomNameInput.value.trim();
  const type = roomTypeInput.value.trim();
  const floor = Number(roomFloorInput.value || 0);
  const page = Number(roomPageInput.value || 1);
  const color = validHexColor(roomColorInput.value) || '#22c55e';

  try {
    const payload = {
      projectName: currentProjectName,
      roomId: room.roomId,
      name,
      type,
      floor,
      color,
      page,
      // không sửa polygon/area ở form này
    };
    const data = await apiPostForm('updateRoom', payload);
    if (!data.success) throw new Error(data.error || 'Failed');
    const updated = {
      ...data.room,
      floor: Number(data.room.floor || 0),
      area: Number(data.room.area || 0),
      page: Number(data.room.page || 1),
      polygon: Array.isArray(data.room.polygon) ? data.room.polygon : [],
    };

    // cập nhật trong mảng rooms
    rooms = rooms.map((r) => (r.roomId === updated.roomId ? updated : r));
    filteredRooms = filteredRooms.map((r) =>
      r.roomId === updated.roomId ? updated : r
    );
    highlightRoomId = updated.roomId;

    // nếu đổi trang, render lại trang mới
    if (updated.page !== currentPage) {
      currentPage = updated.page;
      pageSelect.value = String(currentPage);
      await renderPage(currentPage);
    }

    renderRoomsUI();
    redrawRoomsOnCanvas();
    closeRoomModal();
  } catch (err) {
    console.error(err);
    alert('Lỗi lưu chỉnh sửa phòng');
  }
});

/**************************************************
 * INIT
 **************************************************/
window.addEventListener('DOMContentLoaded', () => {
  pdfCanvas = document.getElementById('pdfCanvas');
  pdfCtx = pdfCanvas.getContext('2d');

  pdfWrapper.addEventListener(
    'touchmove',
    (e) => {
      if (isDrawing) e.preventDefault();
    },
    { passive: false }
  );

  loadProjects();
});
