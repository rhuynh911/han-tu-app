/**
 * app.js — Bộ điều khiển chính
 *
 * Khởi tạo Storage, đăng ký event listeners, điều phối các view.
 */

(function() {
  'use strict';

  /* ============ TOAST ============ */

  function toast(message, kind = 'default') {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
    t.textContent = message;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('fade-out');
      setTimeout(() => t.remove(), 240);
    }, 3200);
  }

  /* ============ VIEW SWITCHING ============ */

  function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('view-' + name);
    if (view) view.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (name === 'home') refreshStats();
    else if (name === 'learn') renderCharGrid();
  }

  /* ============ DASHBOARD ============ */

  function refreshStats() {
    const stats = window.Storage.getStats();
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statLearned').textContent = stats.learned;
    document.getElementById('statLearnedPct').textContent = stats.learnedPct + '% danh sách';
    document.getElementById('statReview').textContent = stats.needsReview;
    document.getElementById('statToday').textContent = stats.today;
  }

  /* ============ LEARN VIEW ============ */

  let currentFilter = 'all';
  let currentSearch = '';

  function renderCharGrid() {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = '';

    const chars = window.Storage.getChars();
    const search = currentSearch.toLowerCase().trim();
    const filter = currentFilter;

    const filtered = chars.filter(char => {
      if (filter !== 'all') {
        const status = window.Storage.getStatus(char);
        if (status !== filter) return false;
      }
      if (search) {
        const hv = window.Storage.getHanViet(char).toLowerCase();
        const meaning = window.Storage.getMeaning(char).toLowerCase();
        if (!char.includes(search) && !hv.includes(search) && !meaning.includes(search)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--ink-mute);">Không tìm thấy chữ nào phù hợp.</div>';
      return;
    }

    // Hiển thị tối đa 200 chữ một lúc để giữ hiệu năng
    const limit = 200;
    const visible = filtered.slice(0, limit);

    const fragment = document.createDocumentFragment();
    visible.forEach(char => {
      const status = window.Storage.getStatus(char);
      const hv = window.Storage.getHanViet(char) || '—';
      const meaning = window.Storage.getMeaning(char) || '(chưa có)';
      const p = window.Storage.getProgress(char);

      const card = document.createElement('div');
      card.className = 'char-card status-' + status;
      card.dataset.char = char;
      card.innerHTML = `
        <div class="char-card-glyph">${char}</div>
        <div class="char-card-hv">${hv}</div>
        <div class="char-card-meaning">${meaning}</div>
        ${p.seen > 0 ? `<div class="char-card-stat">${p.correct}/${p.seen}</div>` : ''}
      `;
      card.addEventListener('click', () => openCharModal(char));
      fragment.appendChild(card);
    });
    grid.appendChild(fragment);

    if (filtered.length > limit) {
      const more = document.createElement('div');
      more.style.cssText = 'grid-column:1/-1;text-align:center;padding:24px;color:var(--ink-mute);font-family:var(--font-mono);font-size:12px;';
      more.textContent = `Hiển thị ${limit} / ${filtered.length} chữ. Dùng ô tìm kiếm hoặc bộ lọc để thu hẹp.`;
      grid.appendChild(more);
    }
  }

  /* ============ CHAR MODAL ============ */

  function openCharModal(char) {
    const modal = document.getElementById('charModal');
    const detail = document.getElementById('charDetail');
    const hv = window.Storage.getHanViet(char) || '(chưa có Hán Việt)';
    const meaning = window.Storage.getMeaning(char);
    const p = window.Storage.getProgress(char);
    const dictDefault = (window.HAN_VIET_DICT[char] && window.HAN_VIET_DICT[char].nghia) || '';

    detail.innerHTML = `
      <div class="char-detail-glyph">${char}</div>
      <div class="char-detail-row">
        <div class="char-detail-label">Hán Việt</div>
        <div class="char-detail-hv">${hv}</div>
      </div>
      <div class="char-detail-row">
        <div class="char-detail-label">
          Nghĩa
          ${p.customMeaning ? '<span style="color:var(--seal);font-style:italic;font-weight:normal;text-transform:none;letter-spacing:0;font-size:11px;margin-left:8px;">(đã chỉnh sửa)</span>' : ''}
        </div>
        <textarea class="char-detail-meaning-input" id="meaningInput"
                  placeholder="${dictDefault || 'Nhập nghĩa cho chữ này'}">${meaning}</textarea>
        <div style="font-size:11px;color:var(--ink-mute);margin-top:4px;font-family:var(--font-mono);">
          ${dictDefault ? 'Mặc định: ' + dictDefault : 'Chưa có nghĩa mặc định trong từ điển'}
        </div>
      </div>
      <div class="char-detail-stats">
        <div class="char-detail-stat">
          <div class="char-detail-stat-value">${p.seen}</div>
          <div class="char-detail-stat-label">Lần học</div>
        </div>
        <div class="char-detail-stat">
          <div class="char-detail-stat-value" style="color:var(--jade);">${p.correct}</div>
          <div class="char-detail-stat-label">Đúng</div>
        </div>
        <div class="char-detail-stat">
          <div class="char-detail-stat-value" style="color:var(--ochre);">${p.wrong}</div>
          <div class="char-detail-stat-label">Sai</div>
        </div>
      </div>
      <div class="char-detail-actions">
        ${p.customMeaning ? '<button class="btn btn-secondary" id="resetMeaningBtn">Khôi phục mặc định</button>' : ''}
        <button class="btn btn-primary" id="saveMeaningBtn">Lưu</button>
      </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('saveMeaningBtn').addEventListener('click', () => {
      const newMeaning = document.getElementById('meaningInput').value;
      const dictMeaning = (window.HAN_VIET_DICT[char] && window.HAN_VIET_DICT[char].nghia) || '';
      // Nếu giống hệt nghĩa mặc định thì clear custom
      if (newMeaning.trim() === dictMeaning.trim()) {
        window.Storage.setCustomMeaning(char, null);
      } else {
        window.Storage.setCustomMeaning(char, newMeaning);
      }
      modal.style.display = 'none';
      renderCharGrid();
      toast('Đã lưu nghĩa', 'success');
    });

    const resetBtn = document.getElementById('resetMeaningBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.Storage.setCustomMeaning(char, null);
        modal.style.display = 'none';
        renderCharGrid();
        toast('Đã khôi phục nghĩa mặc định', 'success');
      });
    }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
  }

  /* ============ FILE UPLOAD ============ */

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const matches = text.match(/[\u3400-\u9fff]/g) || [];
      const unique = Array.from(new Set(matches));

      if (unique.length === 0) {
        toast('File không chứa chữ Hán hợp lệ', 'error');
        return;
      }

      const current = new Set(window.Storage.getChars());
      const newOnes = unique.filter(c => !current.has(c));
      const knownInDict = unique.filter(c => window.HAN_VIET_DICT[c]);
      const unknown = unique.filter(c => !window.HAN_VIET_DICT[c]);

      const preview = document.getElementById('uploadPreview');
      preview.style.display = 'block';
      preview.innerHTML = `
        <div style="margin-bottom:8px;"><strong>Đã đọc file:</strong> ${file.name}</div>
        <div>Tổng chữ Hán duy nhất: <strong>${unique.length}</strong></div>
        <div>Đã có trong danh sách hiện tại: <strong>${unique.length - newOnes.length}</strong></div>
        <div>Sẽ thêm mới: <strong style="color:var(--jade);">${newOnes.length}</strong></div>
        <div>Có sẵn nghĩa trong từ điển: <strong>${knownInDict.length}</strong></div>
        ${unknown.length > 0 ? `<div style="color:var(--ochre);margin-top:8px;">⚠ ${unknown.length} chữ chưa có trong từ điển, cần thêm nghĩa thủ công: <span style="font-family:var(--font-cn);font-size:18px;">${unknown.slice(0, 30).join('')}</span>${unknown.length > 30 ? '...' : ''}</div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn btn-primary" id="confirmReplaceBtn">Thay thế toàn bộ</button>
          <button class="btn btn-secondary" id="confirmMergeBtn">Gộp với danh sách cũ</button>
        </div>
      `;

      document.getElementById('confirmReplaceBtn').addEventListener('click', () => {
        window.Storage.setChars(unique);
        preview.style.display = 'none';
        document.getElementById('uploadInfo').textContent = 'Đã thay thế: ' + unique.length + ' chữ';
        toast('Đã thay thế danh sách chữ', 'success');
        refreshStats();
      });

      document.getElementById('confirmMergeBtn').addEventListener('click', () => {
        const existing = window.Storage.getChars();
        const merged = existing.concat(newOnes);
        window.Storage.setChars(merged);
        preview.style.display = 'none';
        document.getElementById('uploadInfo').textContent = 'Đã gộp: thêm ' + newOnes.length + ' chữ mới';
        toast('Đã gộp ' + newOnes.length + ' chữ mới', 'success');
        refreshStats();
      });
    };
    reader.readAsText(file);
  }

  /* ============ SETTINGS ============ */

  function setupSettings() {
    // File upload
    document.getElementById('uploadBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('uploadInfo').textContent = 'Đang đọc: ' + file.name + '...';
        handleFile(file);
      }
    });

    // Sheets URL
    const sheetsUrlInput = document.getElementById('sheetsUrl');
    sheetsUrlInput.value = window.Storage.getSheetsUrl();

    document.getElementById('saveSheetsUrl').addEventListener('click', () => {
      const url = sheetsUrlInput.value.trim();
      if (url && !url.startsWith('https://script.google.com/')) {
        if (!confirm('URL không bắt đầu bằng https://script.google.com/. Vẫn lưu?')) return;
      }
      window.Storage.setSheetsUrl(url);
      toast('Đã lưu URL', 'success');
    });

    document.getElementById('testSyncBtn').addEventListener('click', async () => {
      try {
        const result = await window.Storage.testConnection();
        toast('Kết nối OK · ' + (result.message || 'Server phản hồi'), 'success');
      } catch (err) {
        toast('Lỗi: ' + err.message, 'error');
      }
    });

    document.getElementById('forceSyncBtn').addEventListener('click', async () => {
      try {
        const btn = document.getElementById('forceSyncBtn');
        btn.disabled = true;
        btn.textContent = 'Đang đồng bộ...';
        await window.Storage.syncToSheets();
        toast('Đã đồng bộ thành công', 'success');
      } catch (err) {
        toast('Lỗi đồng bộ: ' + err.message, 'error');
      } finally {
        const btn = document.getElementById('forceSyncBtn');
        btn.disabled = false;
        btn.textContent = 'Đồng bộ ngay';
      }
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
      const data = window.Storage.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().slice(0, 10);
      a.download = 'han-tu-backup-' + ts + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Đã xuất file JSON', 'success');
    });

    // Reset
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!confirm('Xóa hết tiến độ học? Hành động này không khôi phục được.')) return;
      window.Storage.resetProgress();
      toast('Đã xóa tiến độ', 'success');
      refreshStats();
    });
  }

  /* ============ HEADER SYNC BUTTON ============ */

  function setupSyncButton() {
    document.getElementById('syncBtn').addEventListener('click', async () => {
      if (!window.Storage.getSheetsUrl()) {
        toast('Chưa cài URL Google Sheets. Vào Cài đặt để cấu hình.', 'error');
        return;
      }
      const btn = document.getElementById('syncBtn');
      btn.classList.add('syncing');
      try {
        await window.Storage.syncToSheets();
        toast('Đồng bộ thành công', 'success');
      } catch (err) {
        toast('Lỗi: ' + err.message, 'error');
      } finally {
        btn.classList.remove('syncing');
      }
    });
  }

  /* ============ INIT ============ */

  function init() {
    // Đảm bảo HAN_VIET_DICT đã load
    if (!window.HAN_VIET_DICT) {
      console.error('HAN_VIET_DICT chưa được nạp');
      alert('Lỗi: từ điển Hán Việt chưa được nạp. Kiểm tra lại file js/dictionary-data.js');
      return;
    }

    // Khởi tạo storage
    window.Storage.init();

    // Wire nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Wire action cards (cả home và test view)
    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        if (!action) return;
        switchView('test');
        // Đợi view chuyển xong rồi mới start
        setTimeout(() => window.Tests.start(action), 100);
      });
    });

    // Exit test
    document.getElementById('exitTest').addEventListener('click', () => {
      if (confirm('Thoát phiên kiểm tra hiện tại?')) {
        window.Tests.exit();
      }
    });

    // Modal close
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => closeModal(el.dataset.close));
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => {
          if (m.style.display === 'flex') m.style.display = 'none';
        });
      }
    });

    // Learn view: search & filter
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = searchInput.value;
        renderCharGrid();
      }, 200);
    });
    filterSelect.addEventListener('change', () => {
      currentFilter = filterSelect.value;
      renderCharGrid();
    });

    // Settings
    setupSettings();
    setupSyncButton();

    // Show last sync time
    const lastSync = window.Storage.getLastSync();
    if (lastSync) {
      const ago = Math.floor((Date.now() - lastSync) / 60000);
      const text = ago < 1 ? 'vừa xong' :
                   ago < 60 ? ago + ' phút trước' :
                   Math.floor(ago / 60) + ' giờ trước';
      document.getElementById('syncStatus').textContent = 'Đồng bộ lần cuối: ' + text;
    }

    // Initial render
    refreshStats();
  }

  // Expose for tests.js
  window.App = {
    refreshStats,
    switchView,
    toast
  };

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
