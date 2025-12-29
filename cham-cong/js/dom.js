/* ===== DOM ===== */
const lockScreen    = document.getElementById("lockScreen");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const unlockBtn     = document.getElementById("unlockBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const topBar    = document.getElementById("topBar");
const fileMenu  = document.getElementById("fileMenu");
const sheetMenu = document.getElementById("sheetMenu");
const editBtn   = document.getElementById("editBtn");
const driveBtn  = document.getElementById("driveBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn  = document.getElementById("zoomInBtn");
const frame     = document.getElementById("sheetFrame");
const iframeScaleDiv = document.getElementById("iframeScale");
const siteStatusBar = document.getElementById("siteStatusBar");
const statusList    = document.getElementById("statusList");
/* ===== ZOOM STATE ===== */
let baseScale = 1;       // scale theo màn hình
let zoomMultiplier = 1;  // user chỉnh thêm (0.5 → 2)
