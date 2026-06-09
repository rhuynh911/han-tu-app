/**
 * apps-script.gs — Backend cho web app Hán Tự
 *
 * Cách dùng:
 *   1. Tạo Google Sheet mới (tên gì cũng được)
 *   2. Extensions → Apps Script → dán toàn bộ file này
 *   3. Lưu (Ctrl+S) → đặt tên project (ví dụ "HanTu Backend")
 *   4. Deploy → New deployment → Type: Web app
 *      - Description: "Hán Tự Web App v1"
 *      - Execute as: Me
 *      - Who has access: Anyone (cần thiết để app gọi được)
 *   5. Authorize khi được hỏi
 *   6. Copy URL Web App (dạng https://script.google.com/macros/s/.../exec)
 *   7. Dán URL đó vào trang Cài đặt của app
 *
 * Lưu ý quan trọng:
 *   - Tên sheet phải là ASCII thuần (không dấu, không emoji)
 *   - Mỗi lần update code phải Deploy → Manage deployments → Edit → bump version
 */

const SHEET_PROGRESS = 'Progress';
const SHEET_CHARS = 'CharList';
const SHEET_META = 'Meta';

/**
 * Trả về số ngày từ epoch (cho việc lưu ngày an toàn timezone).
 */
function _dateSerial(d) {
  const base = new Date(1970, 0, 1).getTime();
  return Math.floor((d.getTime() - base) / 86400000);
}

/* ============ ENTRY POINT ============ */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch (action) {
      case 'ping':
        result = handlePing();
        break;
      case 'bulkSync':
        result = handleBulkSync(data);
        break;
      case 'loadProgress':
        result = handleLoadProgress();
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      message: 'Han Tu Backend is running. Use POST to interact.'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============ HANDLERS ============ */

function handlePing() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    message: 'pong',
    spreadsheet: ss.getName(),
    timestamp: new Date().toISOString()
  };
}

function handleBulkSync(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Sheet Progress
  const progressSheet = _getOrCreateSheet(ss, SHEET_PROGRESS);
  progressSheet.clear();
  progressSheet.getRange(1, 1, 1, 6).setValues([
    ['char', 'seen', 'correct', 'wrong', 'lastSeen', 'customMeaning']
  ]);
  progressSheet.setFrozenRows(1);

  const progress = data.progress || {};
  const rows = Object.keys(progress).map(char => {
    const p = progress[char];
    return [
      char,
      p.seen || 0,
      p.correct || 0,
      p.wrong || 0,
      p.lastSeen ? new Date(p.lastSeen) : '',
      p.customMeaning || ''
    ];
  });

  if (rows.length > 0) {
    progressSheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }

  // Sheet CharList
  const charsSheet = _getOrCreateSheet(ss, SHEET_CHARS);
  charsSheet.clear();
  charsSheet.getRange(1, 1, 1, 2).setValues([['index', 'char']]);
  charsSheet.setFrozenRows(1);

  const chars = data.chars || [];
  if (chars.length > 0) {
    const charRows = chars.map((c, i) => [i + 1, c]);
    charsSheet.getRange(2, 1, charRows.length, 2).setValues(charRows);
  }

  // Sheet Meta — ghi lại thời điểm sync
  const metaSheet = _getOrCreateSheet(ss, SHEET_META);
  metaSheet.clear();
  metaSheet.getRange(1, 1, 4, 2).setValues([
    ['key', 'value'],
    ['lastSync', new Date().toISOString()],
    ['totalChars', chars.length],
    ['totalProgress', rows.length]
  ]);
  metaSheet.setFrozenRows(1);

  return {
    synced: {
      chars: chars.length,
      progress: rows.length
    },
    timestamp: new Date().toISOString()
  };
}

function handleLoadProgress() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Đọc progress
  const progress = {};
  const progressSheet = ss.getSheetByName(SHEET_PROGRESS);
  if (progressSheet) {
    const lastRow = progressSheet.getLastRow();
    if (lastRow > 1) {
      const values = progressSheet.getRange(2, 1, lastRow - 1, 6).getValues();
      values.forEach(row => {
        const [char, seen, correct, wrong, lastSeen, customMeaning] = row;
        if (!char) return;
        progress[char] = {
          seen: Number(seen) || 0,
          correct: Number(correct) || 0,
          wrong: Number(wrong) || 0,
          lastSeen: lastSeen instanceof Date ? lastSeen.getTime() : Number(lastSeen) || 0,
          customMeaning: customMeaning || null
        };
      });
    }
  }

  // Đọc danh sách chars
  let chars = [];
  const charsSheet = ss.getSheetByName(SHEET_CHARS);
  if (charsSheet) {
    const lastRow = charsSheet.getLastRow();
    if (lastRow > 1) {
      const values = charsSheet.getRange(2, 2, lastRow - 1, 1).getValues();
      chars = values.map(r => r[0]).filter(c => c);
    }
  }

  return {
    progress,
    chars,
    count: Object.keys(progress).length
  };
}

/* ============ HELPERS ============ */

function _getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/* ============ TEST FUNCTIONS (chạy thủ công trong Apps Script editor) ============ */

function _testPing() {
  Logger.log(handlePing());
}

function _testBulkSync() {
  const result = handleBulkSync({
    action: 'bulkSync',
    chars: ['我', '你', '好'],
    progress: {
      '我': { seen: 5, correct: 4, wrong: 1, lastSeen: Date.now(), customMeaning: 'tôi (đại từ)' },
      '你': { seen: 3, correct: 3, wrong: 0, lastSeen: Date.now() },
      '好': { seen: 2, correct: 1, wrong: 1, lastSeen: Date.now() }
    }
  });
  Logger.log(JSON.stringify(result, null, 2));
}

function _testLoadProgress() {
  const result = handleLoadProgress();
  Logger.log(JSON.stringify(result, null, 2));
}
