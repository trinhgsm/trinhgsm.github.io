/* =========================================================
   ÂM LỊCH VIỆT NAM – FULL JS (1800–2199)
   Thuật toán Hồ Ngọc Đức
   Không phụ thuộc thư viện
   ========================================================= */

/* ===== JULIAN DAY ===== */
function jdFromDate(dd, mm, yy) {
  var a = Math.floor((14 - mm) / 12);
  var y = yy + 4800 - a;
  var m = mm + 12 * a - 3;
  var jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      dd +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      32083;
  }
  return jd;
}

function jdToDate(jd) {
  var a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  var d = Math.floor((4 * c + 3) / 1461);
  var e = c - Math.floor((1461 * d) / 4);
  var m = Math.floor((5 * e + 2) / 153);
  var day = e - Math.floor((153 * m + 2) / 5) + 1;
  var month = m + 3 - 12 * Math.floor(m / 10);
  var year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

/* ===== ASTRONOMY ===== */
function getNewMoonDay(k, timeZone) {
  var T = k / 1236.85;
  var T2 = T * T;
  var T3 = T2 * T;
  var dr = Math.PI / 180;
  var Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3;
  Jd1 +=
    0.00033 *
    Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  var Mpr =
    306.0253 +
    385.81691806 * k +
    0.0107306 * T2 +
    0.00001236 * T3;
  var F =
    21.2964 +
    390.67050646 * k -
    0.0016528 * T2 -
    0.00000239 * T3;
  var C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(dr * 2 * Mpr) -
    0.0004 * Math.sin(dr * 3 * Mpr) +
    0.0104 * Math.sin(dr * 2 * F) -
    0.0051 * Math.sin(dr * (M + Mpr)) -
    0.0074 * Math.sin(dr * (M - Mpr)) +
    0.0004 * Math.sin(dr * (2 * F + M)) -
    0.0004 * Math.sin(dr * (2 * F - M)) -
    0.0006 * Math.sin(dr * (2 * F + Mpr)) +
    0.001 * Math.sin(dr * (2 * F - Mpr)) +
    0.0005 * Math.sin(dr * (2 * Mpr + M));
  var deltaT =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  var JdNew = Jd1 + C1 - deltaT;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
  var T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  var T2 = T * T;
  var dr = Math.PI / 180;
  var M =
    357.5291 +
    35999.0503 * T -
    0.0001559 * T2 -
    0.00000048 * T * T2;
  var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  var DL =
    (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  var L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

/* ===== CORE ===== */
function getLunarMonth11(yy, timeZone) {
  var off = jdFromDate(31, 12, yy) - 2415021;
  var k = Math.floor(off / 29.530588853);
  var nm = getNewMoonDay(k, timeZone);
  var sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  var k = Math.floor((a11 - 2415021) / 29.530588853 + 0.5);
  var last = 0;
  var i = 1;
  var arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc != last && i < 14);
  return i - 1;
}

function solar2lunar(dd, mm, yy, timeZone = 7) {
  var dayNumber = jdFromDate(dd, mm, yy);
  var k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  var monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);

  var a11 = getLunarMonth11(yy, timeZone);
  var b11 = a11;
  var lunarYear;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }

  var lunarDay = dayNumber - monthStart + 1;
  var diff = Math.floor((monthStart - a11) / 29);
  var lunarMonth = diff + 11;
  var leap = false;

  if (b11 - a11 > 365) {
    var leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff == leapMonthDiff) leap = true;
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear--;

  return [lunarDay, lunarMonth, lunarYear, leap];
}

/* ===== CAN CHI ===== */
function getCanChi(year) {
  var CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  var CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  return CAN[(year + 6) % 10] + " " + CHI[(year + 8) % 12];
}
/* =========================================================
   PHONG THỦY XÂY DỰNG – THEO NGÀY ÂM LỊCH
   - Hoàng đạo / Hắc đạo
   - Nên làm / Không nên làm
   - Phục vụ xây dựng nhà ở
   ========================================================= */

/* ===== BẢNG NGÀY HOÀNG ĐẠO THEO CHI ===== */
const HOANG_DAO_BY_CHI = {
  "Tý":  ["Thanh Long", "Minh Đường"],
  "Sửu": ["Kim Quỹ", "Thiên Đức"],
  "Dần": ["Kim Đường", "Ngọc Đường"],
  "Mão": ["Tư Mệnh", "Minh Đường"],
  "Thìn":["Thanh Long", "Kim Quỹ"],
  "Tỵ":  ["Thiên Đức", "Ngọc Đường"],
  "Ngọ": ["Kim Đường", "Tư Mệnh"],
  "Mùi": ["Minh Đường", "Thanh Long"],
  "Thân":["Ngọc Đường", "Kim Quỹ"],
  "Dậu": ["Tư Mệnh", "Thiên Đức"],
  "Tuất":["Thanh Long", "Kim Đường"],
  "Hợi": ["Minh Đường", "Ngọc Đường"]
};

/* ===== VIỆC TỐT THEO NGÀY ÂM ===== */
function goodJobsByLunarDay(lunarDay) {
  if (lunarDay === 1 || lunarDay === 15) {
    return ["Cúng lễ", "Khởi sự nhẹ", "Dọn dẹp mặt bằng"];
  }
  if (lunarDay <= 6) {
    return ["Động thổ", "Đào móng", "San nền"];
  }
  if (lunarDay <= 12) {
    return ["Đổ móng", "Xây tường", "Dựng cột"];
  }
  if (lunarDay <= 18) {
    return ["Đổ mái", "Lắp kết cấu", "Xây thô"];
  }
  if (lunarDay <= 24) {
    return ["Hoàn thiện", "Lắp điện nước", "Sơn sửa"];
  }
  return ["Dọn dẹp", "Kiểm tra", "Không nên khởi công lớn"];
}

/* ===== VIỆC XẤU THEO NGÀY ÂM ===== */
function badJobsByLunarDay(lunarDay) {
  if (lunarDay === 5 || lunarDay === 14 || lunarDay === 23) {
    return ["Động thổ", "Đổ mái", "Khai trương"];
  }
  if (lunarDay >= 27) {
    return ["Khởi công", "Đổ móng", "Đổ mái"];
  }
  return ["Cãi vã", "Quyết định vội vàng"];
}

/* ===== CAN CHI NGÀY ===== */
function getCanChiDay(dd, mm, yy) {
  const jd = jdFromDate(dd, mm, yy);
  const CAN = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const CHI = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  return {
    can: CAN[(jd + 9) % 10],
    chi: CHI[(jd + 1) % 12]
  };
}

/* ===== PHONG THỦY XÂY DỰNG NGÀY ===== */
function getConstructionFengShui(dd, mm, yy) {
  const lunar = solar2lunar(dd, mm, yy, 7);
  const lunarDay = lunar[0];
  const lunarMonth = lunar[1];
  const lunarYear = lunar[2];

  const canChi = getCanChiDay(dd, mm, yy);
  const hoangDaoList = HOANG_DAO_BY_CHI[canChi.chi] || [];

  const isHoangDao = hoangDaoList.length > 0;

  return {
    solar: `${dd}/${mm}/${yy}`,
    lunar: `${lunarDay}/${lunarMonth}/${lunarYear}`,
    canChiDay: `${canChi.can} ${canChi.chi}`,

    type: isHoangDao ? "HOÀNG ĐẠO" : "HẮC ĐẠO",

    nenLam: isHoangDao
      ? goodJobsByLunarDay(lunarDay)
      : ["Việc nhỏ", "Chuẩn bị", "Không khởi công"],

    khongNen: badJobsByLunarDay(lunarDay),

    saoTot: hoangDaoList
  };
}