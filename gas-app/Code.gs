const SHEETS = {
  COURSES: 'Courses',
  TEACHERS: 'Teachers',
  TIMESLOTS: 'TimeSlots',
  BOOKINGS: 'Bookings',
};

const TZ_DISPLAY = 'Asia/Taipei';

function doGet(e) {
  try {
    const route = resolveRoute_(e, 'GET');

    if (route === 'courses') {
      return jsonResponse_({ ok: true, data: getCourses_() });
    }

    if (route === 'slots') {
      const courseId = requiredParam_(e, 'courseId');
      return jsonResponse_({ ok: true, data: getSlotsByCourse_(courseId) });
    }

    if (route === 'admin') {
      return HtmlService.createTemplateFromFile('admin').evaluate().setTitle('Booking Admin');
    }

    return HtmlService.createTemplateFromFile('courses').evaluate().setTitle('Course Booking');
  } catch (err) {
    return errorResponse_(err);
  }
}

function doPost(e) {
  try {
    const payload = parseJsonBody_(e);
    const route = resolveRoute_(e, 'POST', payload.action);

    if (route === 'book') {
      const result = bookSlot_(payload);
      return jsonResponse_({ ok: true, data: result });
    }

    if (route === 'cancel') {
      const result = cancelBooking_(payload);
      return jsonResponse_({ ok: true, data: result });
    }

    if (route === 'login') {
      const token = adminLogin_(payload.password);
      return jsonResponse_({ ok: true, data: { token } });
    }

    throw createError_('NOT_FOUND', 'Unsupported API route.');
  } catch (err) {
    return errorResponse_(err);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEETS.COURSES, [
    'courseId',
    'name',
    'description',
    'isActive',
    'createdAtIso',
    'updatedAtIso',
  ]);
  ensureSheet_(ss, SHEETS.TEACHERS, [
    'teacherId',
    'name',
    'email',
    'createdAtIso',
    'updatedAtIso',
  ]);
  ensureSheet_(ss, SHEETS.TIMESLOTS, [
    'slotId',
    'courseId',
    'teacherId',
    'startAtIso',
    'endAtIso',
    'capacity',
    'bookedCount',
    'status',
    'createdAtIso',
    'updatedAtIso',
  ]);
  ensureSheet_(ss, SHEETS.BOOKINGS, [
    'bookingId',
    'slotId',
    'courseId',
    'studentName',
    'studentEmail',
    'status',
    'createdAtIso',
    'cancelledAtIso',
  ]);
}

function seedSampleData_() {
  setupSheets_();
  const nowIso = toIso_(new Date());
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const coursesSheet = ss.getSheetByName(SHEETS.COURSES);
  const teachersSheet = ss.getSheetByName(SHEETS.TEACHERS);
  const slotsSheet = ss.getSheetByName(SHEETS.TIMESLOTS);

  if (coursesSheet.getLastRow() === 1) {
    coursesSheet.getRange(2, 1, 2, 6).setValues([
      ['C001', '一對一口說課', '50 分鐘英文口說', true, nowIso, nowIso],
      ['C002', '商務英文小班', '90 分鐘商務情境訓練', true, nowIso, nowIso],
    ]);
  }

  if (teachersSheet.getLastRow() === 1) {
    teachersSheet.getRange(2, 1, 2, 5).setValues([
      ['T001', 'Amy', 'amy@example.com', nowIso, nowIso],
      ['T002', 'Kevin', 'kevin@example.com', nowIso, nowIso],
    ]);
  }

  if (slotsSheet.getLastRow() === 1) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 50 * 60 * 1000);

    const tomorrow2 = new Date();
    tomorrow2.setDate(tomorrow2.getDate() + 1);
    tomorrow2.setHours(14, 0, 0, 0);
    const tomorrow2End = new Date(tomorrow2.getTime() + 90 * 60 * 1000);

    slotsSheet.getRange(2, 1, 2, 10).setValues([
      ['S001', 'C001', 'T001', toIso_(tomorrow), toIso_(tomorrowEnd), 3, 0, 'OPEN', nowIso, nowIso],
      ['S002', 'C002', 'T002', toIso_(tomorrow2), toIso_(tomorrow2End), 6, 0, 'OPEN', nowIso, nowIso],
    ]);
  }
}

function bookSlot_(payload) {
  const slotId = must_(payload.slotId, 'slotId is required.');
  const studentName = must_(payload.studentName, 'studentName is required.');
  const studentEmail = must_(payload.studentEmail, 'studentEmail is required.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const slotTable = getTable_(ss.getSheetByName(SHEETS.TIMESLOTS));
    const bookingTable = getTable_(ss.getSheetByName(SHEETS.BOOKINGS));

    const slotRow = slotTable.rows.find((row) => row.slotId === slotId);
    if (!slotRow) {
      throw createError_('NOT_FOUND', `Slot ${slotId} does not exist.`);
    }

    const capacity = Number(slotRow.capacity || 0);
    const bookedCount = Number(slotRow.bookedCount || 0);
    if (slotRow.status !== 'OPEN' || bookedCount >= capacity) {
      throw createError_('SOLD_OUT', 'This slot is sold out.');
    }

    const bookingId = `B${Date.now()}`;
    const nowIso = toIso_(new Date());

    const newCount = bookedCount + 1;
    slotTable.setValue(slotRow.__rowNumber, 'bookedCount', newCount);
    slotTable.setValue(slotRow.__rowNumber, 'updatedAtIso', nowIso);

    bookingTable.appendRow({
      bookingId,
      slotId,
      courseId: slotRow.courseId,
      studentName,
      studentEmail,
      status: 'BOOKED',
      createdAtIso: nowIso,
      cancelledAtIso: '',
    });

    return {
      bookingId,
      slotId,
      bookedCount: newCount,
    };
  } finally {
    lock.releaseLock();
  }
}

function cancelBooking_(payload) {
  const bookingId = must_(payload.bookingId, 'bookingId is required.');
  verifyAdminToken_(payload.token);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const slotTable = getTable_(ss.getSheetByName(SHEETS.TIMESLOTS));
    const bookingTable = getTable_(ss.getSheetByName(SHEETS.BOOKINGS));

    const bookingRow = bookingTable.rows.find((row) => row.bookingId === bookingId);
    if (!bookingRow) {
      throw createError_('NOT_FOUND', `Booking ${bookingId} not found.`);
    }
    if (bookingRow.status === 'CANCELLED') {
      return { bookingId, status: 'CANCELLED' };
    }

    const slotRow = slotTable.rows.find((row) => row.slotId === bookingRow.slotId);
    if (!slotRow) {
      throw createError_('NOT_FOUND', `Slot ${bookingRow.slotId} not found.`);
    }

    const nowIso = toIso_(new Date());
    const bookedCount = Math.max(0, Number(slotRow.bookedCount || 0) - 1);
    slotTable.setValue(slotRow.__rowNumber, 'bookedCount', bookedCount);
    slotTable.setValue(slotRow.__rowNumber, 'updatedAtIso', nowIso);

    bookingTable.setValue(bookingRow.__rowNumber, 'status', 'CANCELLED');
    bookingTable.setValue(bookingRow.__rowNumber, 'cancelledAtIso', nowIso);

    return { bookingId, status: 'CANCELLED', bookedCount };
  } finally {
    lock.releaseLock();
  }
}

function getCourses_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.COURSES);
  return getTable_(sheet).rows
    .filter((row) => row.isActive === true || String(row.isActive).toLowerCase() === 'true')
    .map((row) => ({
      courseId: row.courseId,
      name: row.name,
      description: row.description,
    }));
}

function getSlotsByCourse_(courseId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const slotRows = getTable_(ss.getSheetByName(SHEETS.TIMESLOTS)).rows;
  const teacherRows = getTable_(ss.getSheetByName(SHEETS.TEACHERS)).rows;
  const teacherMap = teacherRows.reduce((acc, row) => {
    acc[row.teacherId] = row;
    return acc;
  }, {});

  return slotRows
    .filter((row) => row.courseId === courseId && row.status === 'OPEN')
    .map((row) => ({
      slotId: row.slotId,
      courseId: row.courseId,
      teacherId: row.teacherId,
      teacherName: teacherMap[row.teacherId] ? teacherMap[row.teacherId].name : '',
      startAtIso: row.startAtIso,
      endAtIso: row.endAtIso,
      startAtDisplay: formatTaipei_(row.startAtIso),
      endAtDisplay: formatTaipei_(row.endAtIso),
      capacity: Number(row.capacity || 0),
      bookedCount: Number(row.bookedCount || 0),
      available: Number(row.capacity || 0) - Number(row.bookedCount || 0),
    }));
}

function adminLogin_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  const token = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');

  if (!expected || !token) {
    throw createError_('CONFIG_ERROR', 'ADMIN_PASSWORD / ADMIN_TOKEN not set in Script Properties.');
  }
  if (!password || password !== expected) {
    throw createError_('UNAUTHORIZED', 'Invalid password.');
  }
  return token;
}

function verifyAdminToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  if (!expected || token !== expected) {
    throw createError_('UNAUTHORIZED', 'Invalid admin token.');
  }
}

function resolveRoute_(e, method, actionFromBody) {
  const route = (e && e.parameter && e.parameter.route) || actionFromBody || '';
  return String(route).trim().toLowerCase();
}

function parseJsonBody_(e) {
  try {
    return JSON.parse((e.postData && e.postData.contents) || '{}');
  } catch (err) {
    throw createError_('BAD_REQUEST', 'Invalid JSON payload.');
  }
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(err) {
  const code = err && err.code ? err.code : 'INTERNAL_ERROR';
  const message = err && err.message ? err.message : 'Unknown error';
  return jsonResponse_({ ok: false, error: { code, message } });
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function getTable_(sheet) {
  if (!sheet) {
    throw createError_('CONFIG_ERROR', 'Expected sheet was not found.');
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const rows = values.slice(1).map((rowValues, index) => {
    const obj = { __rowNumber: index + 2 };
    headers.forEach((header, colIndex) => {
      obj[header] = rowValues[colIndex];
    });
    return obj;
  });

  return {
    headers,
    rows,
    appendRow: (rowObj) => {
      const newRow = headers.map((header) => rowObj[header] ?? '');
      sheet.appendRow(newRow);
    },
    setValue: (rowNumber, header, value) => {
      const colIndex = headers.indexOf(header);
      if (colIndex < 0) {
        throw createError_('CONFIG_ERROR', `Header ${header} does not exist.`);
      }
      sheet.getRange(rowNumber, colIndex + 1).setValue(value);
    },
  };
}

function toIso_(date) {
  return new Date(date).toISOString();
}

function formatTaipei_(isoString) {
  if (!isoString) return '';
  return Utilities.formatDate(new Date(isoString), TZ_DISPLAY, 'yyyy/MM/dd HH:mm');
}

function must_(value, message) {
  if (value === null || value === undefined || value === '') {
    throw createError_('BAD_REQUEST', message);
  }
  return value;
}

function requiredParam_(e, param) {
  const value = e && e.parameter ? e.parameter[param] : null;
  return must_(value, `${param} is required.`);
}

function createError_(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}
