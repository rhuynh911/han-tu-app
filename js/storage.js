/**
 * storage.js — Lớp lưu trữ và đồng bộ
 *
 * Cấu trúc dữ liệu trong localStorage:
 *   hantu:chars       = ["你", "好", ...]              (danh sách chữ đang học)
 *   hantu:progress    = { "你": {seen, correct, wrong, lastSeen, customMeaning}, ... }
 *   hantu:settings    = { sheetsUrl: "..." }
 */

(function() {
  'use strict';

  const KEY_CHARS = 'hantu:chars';
  const KEY_PROGRESS = 'hantu:progress';
  const KEY_SETTINGS = 'hantu:settings';
  const KEY_LAST_SYNC = 'hantu:lastSync';

  const Storage = {

    /* ============ INIT ============ */

    init() {
      // Nếu chưa có danh sách chữ thì lấy từ dictionary làm mặc định
      if (!localStorage.getItem(KEY_CHARS)) {
        const defaultChars = Object.keys(window.HAN_VIET_DICT || {});
        localStorage.setItem(KEY_CHARS, JSON.stringify(defaultChars));
      }
      if (!localStorage.getItem(KEY_PROGRESS)) {
        localStorage.setItem(KEY_PROGRESS, JSON.stringify({}));
      }
      if (!localStorage.getItem(KEY_SETTINGS)) {
        localStorage.setItem(KEY_SETTINGS, JSON.stringify({}));
      }
    },

    /* ============ CHARACTERS LIST ============ */

    getChars() {
      try {
        return JSON.parse(localStorage.getItem(KEY_CHARS) || '[]');
      } catch (e) {
        return [];
      }
    },

    setChars(list) {
      const clean = Array.from(new Set(list.filter(c => /[\u3400-\u9fff]/.test(c))));
      localStorage.setItem(KEY_CHARS, JSON.stringify(clean));
      return clean;
    },

    /* ============ PROGRESS ============ */

    getAllProgress() {
      try {
        return JSON.parse(localStorage.getItem(KEY_PROGRESS) || '{}');
      } catch (e) {
        return {};
      }
    },

    getProgress(char) {
      const all = this.getAllProgress();
      return all[char] || { seen: 0, correct: 0, wrong: 0, lastSeen: 0, customMeaning: null };
    },

    /**
     * Cập nhật tiến độ sau một câu kiểm tra
     * @param {string} char
     * @param {boolean} isCorrect
     */
    updateProgress(char, isCorrect) {
      const all = this.getAllProgress();
      const p = all[char] || { seen: 0, correct: 0, wrong: 0, lastSeen: 0, customMeaning: null };
      p.seen += 1;
      if (isCorrect) p.correct += 1;
      else p.wrong += 1;
      p.lastSeen = Date.now();
      all[char] = p;
      localStorage.setItem(KEY_PROGRESS, JSON.stringify(all));
      // Sync ngầm sau mỗi câu (debounced)
      this._scheduleSync();
    },

    /**
     * Lưu nghĩa tự đặt cho một chữ
     */
    setCustomMeaning(char, meaning) {
      const all = this.getAllProgress();
      const p = all[char] || { seen: 0, correct: 0, wrong: 0, lastSeen: 0, customMeaning: null };
      p.customMeaning = (meaning && meaning.trim()) ? meaning.trim() : null;
      all[char] = p;
      localStorage.setItem(KEY_PROGRESS, JSON.stringify(all));
      this._scheduleSync();
    },

    /**
     * Lấy nghĩa hiển thị (ưu tiên custom, fallback dictionary)
     */
    getMeaning(char) {
      const p = this.getProgress(char);
      if (p.customMeaning) return p.customMeaning;
      const dict = (window.HAN_VIET_DICT && window.HAN_VIET_DICT[char]);
      return dict ? dict.nghia : '';
    },

    /**
     * Lấy Hán Việt
     */
    getHanViet(char) {
      const dict = (window.HAN_VIET_DICT && window.HAN_VIET_DICT[char]);
      return dict ? dict.hv : '';
    },

    /**
     * Phân loại trạng thái của một chữ
     * @returns {'new'|'learning'|'learned'|'needs-review'}
     */
    getStatus(char) {
      const p = this.getProgress(char);
      if (p.seen === 0) return 'new';
      const accuracy = p.correct / p.seen;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const isStale = (Date.now() - p.lastSeen) > sevenDaysMs;

      if (p.seen >= 3 && accuracy >= 0.85) {
        return isStale ? 'needs-review' : 'learned';
      }
      if (accuracy < 0.5 && p.seen >= 2) return 'needs-review';
      return 'learning';
    },

    /* ============ STATISTICS ============ */

    getStats() {
      const chars = this.getChars();
      let learned = 0, learning = 0, needsReview = 0, newCount = 0;
      let todayCount = 0;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayMs = startOfToday.getTime();

      const all = this.getAllProgress();

      for (const char of chars) {
        const status = this.getStatus(char);
        if (status === 'learned') learned++;
        else if (status === 'learning') learning++;
        else if (status === 'needs-review') needsReview++;
        else newCount++;

        const p = all[char];
        if (p && p.lastSeen >= todayMs) todayCount++;
      }

      return {
        total: chars.length,
        learned,
        learning,
        needsReview,
        new: newCount,
        today: todayCount,
        learnedPct: chars.length > 0 ? Math.round((learned / chars.length) * 100) : 0
      };
    },

    /* ============ SETTINGS ============ */

    getSettings() {
      try {
        return JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}');
      } catch (e) {
        return {};
      }
    },

    setSetting(key, value) {
      const s = this.getSettings();
      s[key] = value;
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
    },

    getSheetsUrl() {
      return this.getSettings().sheetsUrl || '';
    },

    setSheetsUrl(url) {
      this.setSetting('sheetsUrl', url);
    },

    /* ============ SYNC ============ */

    _syncTimer: null,

    _scheduleSync() {
      // Debounce: lưu sau 3 giây không hoạt động
      if (this._syncTimer) clearTimeout(this._syncTimer);
      this._syncTimer = setTimeout(() => {
        this.syncToSheets({ silent: true }).catch(() => {});
      }, 3000);
    },

    /**
     * Đồng bộ tất cả progress lên Google Sheets
     * @param {object} opts {silent: bool}
     */
    async syncToSheets(opts = {}) {
      const url = this.getSheetsUrl();
      if (!url) {
        if (!opts.silent) throw new Error('Chưa cài URL Google Sheets');
        return { ok: false, reason: 'no-url' };
      }

      const payload = {
        action: 'bulkSync',
        chars: this.getChars(),
        progress: this.getAllProgress(),
        timestamp: Date.now()
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          mode: 'cors',
          // Apps Script chấp nhận text/plain để tránh CORS preflight
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Lỗi không rõ');

        localStorage.setItem(KEY_LAST_SYNC, String(Date.now()));
        return { ok: true, ...data };
      } catch (err) {
        if (!opts.silent) throw err;
        return { ok: false, reason: err.message };
      }
    },

    /**
     * Kéo progress từ Google Sheets về (lần đầu chạy app)
     */
    async pullFromSheets() {
      const url = this.getSheetsUrl();
      if (!url) throw new Error('Chưa cài URL Google Sheets');

      const payload = { action: 'loadProgress' };
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Lỗi không rõ');

      // Merge: server progress override local nếu lastSeen mới hơn
      const local = this.getAllProgress();
      const server = data.progress || {};
      for (const char of Object.keys(server)) {
        const s = server[char];
        const l = local[char];
        if (!l || (s.lastSeen || 0) > (l.lastSeen || 0)) {
          local[char] = s;
        }
      }
      localStorage.setItem(KEY_PROGRESS, JSON.stringify(local));

      // Nếu server có chars list khác, áp dụng
      if (Array.isArray(data.chars) && data.chars.length > 0) {
        this.setChars(data.chars);
      }

      localStorage.setItem(KEY_LAST_SYNC, String(Date.now()));
      return { ok: true };
    },

    /**
     * Kiểm tra kết nối tới Apps Script
     */
    async testConnection() {
      const url = this.getSheetsUrl();
      if (!url) throw new Error('Chưa nhập URL');

      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Server không phản hồi đúng');
      return data;
    },

    getLastSync() {
      const t = localStorage.getItem(KEY_LAST_SYNC);
      return t ? Number(t) : 0;
    },

    /* ============ EXPORT / RESET ============ */

    exportJSON() {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        chars: this.getChars(),
        progress: this.getAllProgress(),
        settings: this.getSettings()
      };
    },

    resetProgress() {
      localStorage.setItem(KEY_PROGRESS, JSON.stringify({}));
    }
  };

  window.Storage = Storage;
})();
