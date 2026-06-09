/**
 * tests.js — 8 chế độ kiểm tra
 *
 * Các chế độ:
 *   flashcard      — Lật thẻ (chữ → Hán Việt + nghĩa)
 *   mc-char-hv     — Trắc nghiệm chữ → Hán Việt
 *   mc-meaning-char— Trắc nghiệm nghĩa → chữ
 *   mc-char-meaning— Trắc nghiệm chữ → nghĩa
 *   fill-blank     — Điền chữ vào câu trống
 *   arrange        — Sắp xếp chữ thành câu
 *   reading        — Đọc hiểu đoạn văn
 *   typing         — Gõ Hán Việt
 */

(function() {
  'use strict';

  /* ============ BANK CÂU MẪU & ĐOẠN VĂN ============ */
  // Mỗi entry: { cn: chữ Hán, vi: nghĩa Việt, hv?: phiên Hán Việt }
  // Khi chọn câu, app sẽ lọc chỉ những câu mà MỌI chữ Hán đều có trong danh sách đang học
  // Bank cụm/câu Hán cổ điển — chỉ dùng chữ có trong danh sách 1040 của Vinh.
  // Phong cách Hán Nôm cổ điển, phù hợp với danh sách chữ theo bộ thủ + số nét.
  const SENTENCE_BANK = [
    // Tam Tự Kinh + cổ thi (3 chữ)
    { cn: '人之初', vi: 'Con người mới sinh ra' },
    { cn: '性相近', vi: 'Bản tính gần nhau' },
    { cn: '一二三', vi: 'Một hai ba' },
    { cn: '四五六', vi: 'Bốn năm sáu' },
    { cn: '七八九', vi: 'Bảy tám chín' },
    { cn: '天地人', vi: 'Trời, đất, người' },
    { cn: '王之心', vi: 'Lòng của vua' },
    { cn: '父之子', vi: 'Con của cha' },
    { cn: '天之子', vi: 'Con của trời (thiên tử)' },

    // Thành ngữ và cụm 4 chữ
    { cn: '日久天長', vi: 'Ngày dài tháng rộng (lâu dài)' },
    { cn: '入木三分', vi: 'Vào gỗ ba phân (sâu sắc)' },
    { cn: '一夫之力', vi: 'Sức một người' },
    { cn: '三人成虎', vi: 'Ba người thành cọp (tin đồn lan)' },
    { cn: '不入虎穴', vi: 'Không vào hang cọp' },
    { cn: '心如止水', vi: 'Lòng tĩnh như nước' },
    { cn: '日月之行', vi: 'Đường đi của nhật nguyệt' },
    { cn: '王者之心', vi: 'Lòng của bậc vương' },
    { cn: '一夫一妻', vi: 'Một chồng một vợ' },
    { cn: '上下不一', vi: 'Trên dưới không đồng nhất' },
    { cn: '入水之中', vi: 'Vào trong nước' },
    { cn: '天長地久', vi: 'Trời đất dài lâu' },
    { cn: '三日五日', vi: 'Ba ngày năm ngày (vài ngày)' },
    { cn: '一二三四', vi: 'Một hai ba bốn' },
    { cn: '不可不知', vi: 'Không thể không biết' },
    { cn: '不大不小', vi: 'Không lớn không nhỏ' },
    { cn: '不上不下', vi: 'Không trên không dưới (lửng lơ)' },
    { cn: '父父子子', vi: 'Cha ra cha, con ra con (luân thường)' },
    { cn: '生死之交', vi: 'Tình bạn sinh tử' },
    { cn: '安心立命', vi: 'An tâm lập mệnh' },
    { cn: '王不王', vi: 'Vua không ra vua' },

    // Cụm 2 chữ căn bản
    { cn: '日月', vi: 'Mặt trời mặt trăng' },
    { cn: '山水', vi: 'Núi sông' },
    { cn: '父子', vi: 'Cha con' },
    { cn: '母女', vi: 'Mẹ và con gái' },
    { cn: '人心', vi: 'Lòng người' },
    { cn: '大小', vi: 'Lớn nhỏ' },
    { cn: '上下', vi: 'Trên dưới' },
    { cn: '王者', vi: 'Bậc vương' },
    { cn: '中正', vi: 'Trung chính' },
    { cn: '小心', vi: 'Cẩn thận' }
  ];

  // Bank đoạn văn cổ điển — chữ Hán theo phong cách Hán Nôm.
  // Mọi chữ đã verify nằm trong danh sách 1040 chữ.
  const PASSAGE_BANK = [
    {
      cn: '人有父母。父母有心。父母之心，子可知也。',
      vi: 'Người ta có cha mẹ. Cha mẹ có lòng. Lòng của cha mẹ, con cái có thể biết được.',
      questions: [
        { q: 'Bài này nói về điều gì?', options: ['Bốn mùa', 'Lòng của cha mẹ', 'Bậc vương', 'Núi sông'], answer: 1 },
        { q: 'Theo bài, ai có thể biết lòng cha mẹ?', options: ['Người khác', 'Cha mẹ khác', 'Con cái', 'Vua'], answer: 2 }
      ]
    },
    {
      cn: '王有大力。王之心可知。王不可不正。',
      vi: 'Vua có sức lớn. Lòng của vua có thể biết. Vua không thể không chính trực.',
      questions: [
        { q: 'Vua cần phải như thế nào?', options: ['Phải giàu có', 'Phải chính trực', 'Phải hiền hoà', 'Phải nhanh nhẹn'], answer: 1 },
        { q: 'Bài nói vua có gì?', options: ['Sức nhỏ', 'Sức lớn', 'Tài năng', 'Của cải'], answer: 1 }
      ]
    },
    {
      cn: '一年有四季。春之日，木生。秋之日，木死。冬之水，可入土中。',
      vi: 'Một năm có bốn mùa. Ngày xuân, cây sinh sôi. Ngày thu, cây chết. Nước mùa đông, có thể vào trong đất.',
      questions: [
        { q: 'Một năm có mấy mùa?', options: ['Hai', 'Ba', 'Bốn', 'Năm'], answer: 2 },
        { q: 'Cây sinh sôi vào mùa nào?', options: ['Xuân', 'Thu', 'Đông', 'Cả ba mùa'], answer: 0 }
      ]
    },
    {
      cn: '人之本心，有仁，有信，有孝，有忠，有勇。此五者，皆人之大本也。',
      vi: 'Tâm gốc của con người: có nhân, có tín, có hiếu, có trung, có dũng. Năm đức ấy đều là gốc lớn của con người.',
      questions: [
        { q: 'Bài này nói có mấy đức?', options: ['Ba', 'Bốn', 'Năm', 'Bảy'], answer: 2 },
        { q: 'Đức nào KHÔNG có trong bài?', options: ['Nhân', 'Tín', 'Trí', 'Hiếu'], answer: 2 }
      ]
    },
    {
      cn: '朋友有心。朋友之心，皆同也。生死之交，可知也。',
      vi: 'Bạn bè có lòng. Lòng bạn bè đều giống nhau. Tình bạn sinh tử có thể biết được.',
      questions: [
        { q: 'Bài này chủ yếu nói về?', options: ['Cha mẹ', 'Bạn bè', 'Vua chúa', 'Bốn mùa'], answer: 1 },
        { q: 'Lòng bạn bè theo bài là?', options: ['Khác nhau', 'Đều giống nhau', 'Không biết được', 'Thay đổi'], answer: 1 }
      ]
    }
  ];

  /* ============ TRẠNG THÁI PHIÊN KIỂM TRA ============ */

  let session = null;

  /* ============ HELPERS ============ */

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandom(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  /**
   * Chọn các chữ ưu tiên cho phiên kiểm tra:
   * - Ưu tiên chữ cần ôn và đang học
   * - Sau đó tới chữ mới
   * - Cuối cùng là chữ đã thuộc
   */
  function selectStudyChars(count = 10) {
    const all = window.Storage.getChars();
    const needsReview = [];
    const learning = [];
    const newOnes = [];
    const learned = [];

    for (const c of all) {
      const status = window.Storage.getStatus(c);
      if (status === 'needs-review') needsReview.push(c);
      else if (status === 'learning') learning.push(c);
      else if (status === 'new') newOnes.push(c);
      else learned.push(c);
    }

    const queue = [
      ...shuffle(needsReview),
      ...shuffle(learning),
      ...shuffle(newOnes),
      ...shuffle(learned)
    ];
    return queue.slice(0, count);
  }

  /** Lấy đáp án nhiễu (distractor) */
  function getDistractors(targetChar, field, count = 3) {
    const all = window.Storage.getChars();
    const target = window.HAN_VIET_DICT[targetChar];
    if (!target) return [];

    const candidates = all
      .filter(c => c !== targetChar && window.HAN_VIET_DICT[c])
      .map(c => ({ char: c, ...window.HAN_VIET_DICT[c] }))
      .filter(d => d[field] && d[field] !== target[field]);

    return shuffle(candidates).slice(0, count);
  }

  /** Chuẩn hóa Hán Việt: bỏ dấu để so sánh dễ */
  function normalizeHV(s) {
    if (!s) return '';
    return s.toLowerCase().trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s,]/g, '')
      .replace(/\s+/g, ' ');
  }

  /** So sánh đáp án gõ Hán Việt — chấp nhận có/không dấu, nhiều cách đọc cách nhau bằng dấu phẩy */
  function matchHanViet(userInput, correctHV) {
    const userNorm = normalizeHV(userInput);
    if (!userNorm) return false;
    const accepted = correctHV.split(/[,，;；]/).map(normalizeHV);
    return accepted.some(a => a === userNorm);
  }

  /* ============ DOM RENDERERS ============ */

  function el(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstChild;
  }

  function setBody(node) {
    const body = document.getElementById('testBody');
    body.innerHTML = '';
    if (typeof node === 'string') body.innerHTML = node;
    else body.appendChild(node);
  }

  function updateProgressUI() {
    const total = session.questions.length;
    const cur = session.index + 1;
    document.getElementById('testProgress').textContent =
      Math.min(cur, total) + ' / ' + total;
    document.getElementById('progressFill').style.width =
      ((Math.min(cur, total) / total) * 100) + '%';
    document.getElementById('scoreCorrect').textContent = session.correctCount;
    document.getElementById('scoreWrong').textContent = session.wrongCount;
  }

  /* ============ CÁC CHẾ ĐỘ ============ */

  // --- 1. FLASHCARD ---
  function renderFlashcard() {
    const char = session.questions[session.index];
    const meaning = window.Storage.getMeaning(char);
    const hv = window.Storage.getHanViet(char);

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="flashcard" id="flashcardEl">
          <div class="flashcard-front" id="fcFront">
            <div class="flashcard-char">${char}</div>
            <div class="flashcard-hint">Nhấn để xem đáp án</div>
          </div>
        </div>
        <div class="flashcard-actions" id="fcActions" style="display:none;">
          <button class="btn btn-secondary btn-lg" id="fcWrong">Chưa thuộc</button>
          <button class="btn btn-jade btn-lg" id="fcCorrect">Đã thuộc</button>
        </div>
      </div>
    `);

    setBody(node);

    const card = node.querySelector('#flashcardEl');
    card.addEventListener('click', () => {
      card.innerHTML = `
        <div class="flashcard-back">
          <div class="flashcard-char">${char}</div>
          <div class="flashcard-hv">${hv}</div>
          <div class="flashcard-meaning">${meaning || '(chưa có nghĩa)'}</div>
        </div>
      `;
      node.querySelector('#fcActions').style.display = 'flex';
    });

    node.querySelector('#fcCorrect').addEventListener('click', () => {
      window.Storage.updateProgress(char, true);
      session.correctCount++;
      advance();
    });
    node.querySelector('#fcWrong').addEventListener('click', () => {
      window.Storage.updateProgress(char, false);
      session.wrongCount++;
      advance();
    });
  }

  // --- 2. MC CHỮ → HÁN VIỆT ---
  function renderMcCharHV() {
    const char = session.questions[session.index];
    const correct = window.Storage.getHanViet(char);
    if (!correct) { advance(); return; }
    const distractors = getDistractors(char, 'hv', 3);
    const options = shuffle([
      { text: correct, isCorrect: true },
      ...distractors.map(d => ({ text: d.hv, isCorrect: false }))
    ]);

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt">
          <div class="mc-prompt-label">Cách đọc Hán Việt của chữ</div>
          <div class="mc-prompt-char">${char}</div>
        </div>
        <div class="mc-options" id="mcOptions"></div>
      </div>
    `);

    const optsContainer = node.querySelector('#mcOptions');
    options.forEach(opt => {
      const btn = el(`<button class="mc-option">${opt.text}</button>`);
      btn.addEventListener('click', () => handleMcAnswer(btn, opt.isCorrect, options, char, optsContainer));
      optsContainer.appendChild(btn);
    });

    setBody(node);
  }

  // --- 3. MC NGHĨA → CHỮ ---
  function renderMcMeaningChar() {
    const char = session.questions[session.index];
    const correctMeaning = window.Storage.getMeaning(char);
    if (!correctMeaning) { advance(); return; }
    const distractors = getDistractors(char, 'nghia', 3);
    const options = shuffle([
      { char: char, isCorrect: true },
      ...distractors.map(d => ({ char: d.char, isCorrect: false }))
    ]);

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt">
          <div class="mc-prompt-label">Chữ Hán có nghĩa là</div>
          <div class="mc-prompt-text">${correctMeaning}</div>
        </div>
        <div class="mc-options" id="mcOptions"></div>
      </div>
    `);

    const optsContainer = node.querySelector('#mcOptions');
    options.forEach(opt => {
      const btn = el(`<button class="mc-option"><span class="mc-option-char">${opt.char}</span></button>`);
      btn.addEventListener('click', () => handleMcAnswer(btn, opt.isCorrect, options, char, optsContainer));
      optsContainer.appendChild(btn);
    });

    setBody(node);
  }

  // --- 4. MC CHỮ → NGHĨA ---
  function renderMcCharMeaning() {
    const char = session.questions[session.index];
    const correctMeaning = window.Storage.getMeaning(char);
    if (!correctMeaning) { advance(); return; }
    const distractors = getDistractors(char, 'nghia', 3);
    const options = shuffle([
      { text: correctMeaning, isCorrect: true },
      ...distractors.map(d => ({ text: d.nghia, isCorrect: false }))
    ]);

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt">
          <div class="mc-prompt-label">Nghĩa của chữ</div>
          <div class="mc-prompt-char">${char}</div>
        </div>
        <div class="mc-options" id="mcOptions"></div>
      </div>
    `);

    const optsContainer = node.querySelector('#mcOptions');
    options.forEach(opt => {
      const btn = el(`<button class="mc-option">${opt.text}</button>`);
      btn.addEventListener('click', () => handleMcAnswer(btn, opt.isCorrect, options, char, optsContainer));
      optsContainer.appendChild(btn);
    });

    setBody(node);
  }

  function handleMcAnswer(clickedBtn, isCorrect, options, char, container) {
    Array.from(container.children).forEach((btn, idx) => {
      btn.disabled = true;
      if (options[idx].isCorrect) btn.classList.add('correct');
      else if (btn === clickedBtn) btn.classList.add('wrong');
    });

    window.Storage.updateProgress(char, isCorrect);
    if (isCorrect) session.correctCount++;
    else session.wrongCount++;

    showFeedback(isCorrect, char);
    setTimeout(advance, isCorrect ? 900 : 1800);
  }

  // --- 5. ĐIỀN CHỖ TRỐNG ---
  function renderFillBlank() {
    const userChars = new Set(window.Storage.getChars());
    const usable = SENTENCE_BANK.filter(s =>
      s.cn.split('').every(c => userChars.has(c))
    );
    if (usable.length === 0) {
      setBody('<div style="text-align:center;padding:40px;color:var(--ink-soft);">Chưa đủ chữ trong danh sách để tạo câu mẫu.<br>Học thêm vài chữ rồi quay lại nhé.</div>');
      return;
    }

    const sentence = usable[Math.floor(Math.random() * usable.length)];
    const chars = sentence.cn.split('');
    const blankIdx = Math.floor(Math.random() * chars.length);
    const target = chars[blankIdx];

    const display = chars.map((c, i) => i === blankIdx
      ? '<span class="fill-blank-blank">？</span>'
      : c
    ).join('');

    const distractors = getDistractors(target, 'nghia', 3).map(d => d.char);
    const options = shuffle([target, ...distractors]);

    session.currentChar = target;

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt-label" style="margin-bottom:var(--s-3);">Điền chữ Hán phù hợp</div>
        <div class="fill-blank-sentence">${display}</div>
        <div class="reading-translation" style="margin-bottom:24px;text-align:center;">${sentence.vi}</div>
        <div class="mc-options" id="mcOptions"></div>
      </div>
    `);

    const optsContainer = node.querySelector('#mcOptions');
    options.forEach(opt => {
      const btn = el(`<button class="mc-option"><span class="mc-option-char">${opt}</span></button>`);
      btn.addEventListener('click', () => {
        const isCorrect = opt === target;
        Array.from(optsContainer.children).forEach((b, idx) => {
          b.disabled = true;
          if (options[idx] === target) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        window.Storage.updateProgress(target, isCorrect);
        if (isCorrect) session.correctCount++;
        else session.wrongCount++;
        showFeedback(isCorrect, target);
        setTimeout(advance, isCorrect ? 900 : 1800);
      });
      optsContainer.appendChild(btn);
    });

    setBody(node);
  }

  // --- 6. SẮP XẾP CHỮ ---
  function renderArrange() {
    const userChars = new Set(window.Storage.getChars());
    const usable = SENTENCE_BANK.filter(s =>
      s.cn.length >= 3 && s.cn.length <= 6 &&
      s.cn.split('').every(c => userChars.has(c))
    );
    if (usable.length === 0) {
      setBody('<div style="text-align:center;padding:40px;color:var(--ink-soft);">Chưa đủ chữ trong danh sách để tạo câu sắp xếp.<br>Học thêm vài chữ rồi quay lại nhé.</div>');
      return;
    }

    const sentence = usable[Math.floor(Math.random() * usable.length)];
    const target = sentence.cn.split('');
    let pool = shuffle(target.slice());
    let placed = [];

    session.currentSentence = sentence;

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt-label" style="margin-bottom:var(--s-3);">Sắp xếp chữ thành câu có nghĩa</div>
        <div class="arrange-target">"${sentence.vi}"</div>
        <div class="arrange-slots" id="arrangeSlots"></div>
        <div class="arrange-pool" id="arrangePool"></div>
        <button class="btn btn-primary btn-lg" id="arrangeCheck" disabled>Kiểm tra</button>
      </div>
    `);

    const slots = node.querySelector('#arrangeSlots');
    const poolEl = node.querySelector('#arrangePool');
    const checkBtn = node.querySelector('#arrangeCheck');

    function render() {
      slots.innerHTML = '';
      placed.forEach((c, idx) => {
        const chip = el(`<button class="arrange-char">${c}</button>`);
        chip.addEventListener('click', () => {
          pool.push(placed[idx]);
          placed.splice(idx, 1);
          render();
        });
        slots.appendChild(chip);
      });
      if (placed.length === 0) {
        slots.innerHTML = '<span style="color:var(--ink-mute);font-family:var(--font-mono);font-size:12px;align-self:center;">Nhấn các chữ bên dưới để xếp lại</span>';
      }

      poolEl.innerHTML = '';
      pool.forEach((c, idx) => {
        const chip = el(`<button class="arrange-char">${c}</button>`);
        chip.addEventListener('click', () => {
          placed.push(pool[idx]);
          pool.splice(idx, 1);
          render();
        });
        poolEl.appendChild(chip);
      });

      checkBtn.disabled = placed.length !== target.length;
    }
    render();

    checkBtn.addEventListener('click', () => {
      const userAnswer = placed.join('');
      const isCorrect = userAnswer === sentence.cn;

      // Cập nhật progress cho mọi chữ trong câu
      target.forEach(c => window.Storage.updateProgress(c, isCorrect));

      if (isCorrect) session.correctCount++;
      else session.wrongCount++;

      checkBtn.disabled = true;
      showArrangeFeedback(isCorrect, sentence);
      setTimeout(advance, isCorrect ? 1200 : 2400);
    });

    setBody(node);
  }

  function showArrangeFeedback(isCorrect, sentence) {
    const fb = el(`
      <div class="test-feedback ${isCorrect ? 'correct' : 'wrong'}">
        <div class="test-feedback-label">${isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}</div>
        <div class="test-feedback-detail" style="font-family:var(--font-cn);font-size:22px;margin-top:8px;">${sentence.cn}</div>
        <div class="test-feedback-detail" style="margin-top:4px;font-style:italic;">${sentence.vi}</div>
      </div>
    `);
    document.getElementById('testBody').appendChild(fb);
  }

  // --- 7. ĐỌC HIỂU ---
  function renderReading() {
    const userChars = new Set(window.Storage.getChars());
    const usable = PASSAGE_BANK.filter(p =>
      p.cn.split('').filter(c => /[\u3400-\u9fff]/.test(c))
        .every(c => userChars.has(c))
    );
    if (usable.length === 0) {
      // Fallback: cho phép cả đoạn có chữ chưa học
      setBody('<div style="text-align:center;padding:40px;color:var(--ink-soft);">Chưa đủ chữ trong danh sách để tạo đoạn đọc hiểu.<br>Học thêm vài chữ rồi quay lại nhé.</div>');
      return;
    }

    const passage = usable[Math.floor(Math.random() * usable.length)];
    let qIndex = 0;
    let correctInPassage = 0;

    const charsInPassage = passage.cn.split('').filter(c => /[\u3400-\u9fff]/.test(c));
    session.passageChars = charsInPassage;

    function renderQuestion() {
      const q = passage.questions[qIndex];
      const options = q.options.map((text, idx) => ({ text, isCorrect: idx === q.answer }));

      const node = el(`
        <div style="width:100%;">
          <div class="reading-passage">
            ${passage.cn}
            <div class="reading-translation">${passage.vi}</div>
          </div>
          <div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--ink-mute);letter-spacing:0.05em;margin-bottom:var(--s-2);">
            CÂU HỎI ${qIndex + 1} / ${passage.questions.length}
          </div>
          <div class="reading-question" style="text-align:center;">${q.q}</div>
          <div class="mc-options" id="mcOptions" style="margin:0 auto;"></div>
        </div>
      `);

      const optsContainer = node.querySelector('#mcOptions');
      options.forEach((opt, idx) => {
        const btn = el(`<button class="mc-option">${opt.text}</button>`);
        btn.addEventListener('click', () => {
          Array.from(optsContainer.children).forEach((b, i) => {
            b.disabled = true;
            if (options[i].isCorrect) b.classList.add('correct');
            else if (b === btn) b.classList.add('wrong');
          });
          if (opt.isCorrect) correctInPassage++;

          setTimeout(() => {
            qIndex++;
            if (qIndex < passage.questions.length) {
              renderQuestion();
            } else {
              // Hoàn thành đoạn — cập nhật progress cho từng chữ trong đoạn
              const accuracy = correctInPassage / passage.questions.length;
              charsInPassage.forEach(c => {
                window.Storage.updateProgress(c, accuracy >= 0.5);
              });
              if (accuracy >= 0.5) session.correctCount++;
              else session.wrongCount++;
              advance();
            }
          }, opt.isCorrect ? 800 : 1500);
        });
        optsContainer.appendChild(btn);
      });

      setBody(node);
    }

    renderQuestion();
  }

  // --- 8. GÕ HÁN VIỆT ---
  function renderTyping() {
    const char = session.questions[session.index];
    const correct = window.Storage.getHanViet(char);
    if (!correct) { advance(); return; }

    const node = el(`
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
        <div class="mc-prompt">
          <div class="mc-prompt-label">Gõ cách đọc Hán Việt</div>
          <div class="mc-prompt-char">${char}</div>
        </div>
        <input type="text" class="typing-input" id="typingInput"
               placeholder="vd: nhân, học..." autocomplete="off" autocapitalize="off">
        <div style="margin-top:16px;font-family:var(--font-mono);font-size:11px;color:var(--ink-mute);">
          Nhấn Enter để xác nhận · chấp nhận có hoặc không dấu
        </div>
      </div>
    `);

    setBody(node);
    const input = node.querySelector('#typingInput');
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const userAnswer = input.value;
      if (!userAnswer.trim()) return;

      const isCorrect = matchHanViet(userAnswer, correct);
      input.disabled = true;
      input.classList.add(isCorrect ? 'correct' : 'wrong');

      window.Storage.updateProgress(char, isCorrect);
      if (isCorrect) session.correctCount++;
      else session.wrongCount++;

      const fb = el(`
        <div class="test-feedback ${isCorrect ? 'correct' : 'wrong'}" style="margin-top:24px;">
          <div class="test-feedback-label">${isCorrect ? '✓ Chính xác' : '✗ Đáp án đúng: ' + correct}</div>
          <div class="test-feedback-detail">${window.Storage.getMeaning(char)}</div>
        </div>
      `);
      document.getElementById('testBody').appendChild(fb);
      setTimeout(advance, isCorrect ? 1000 : 2000);
    });
  }

  /* ============ ĐIỀU KHIỂN PHIÊN ============ */

  function showFeedback(isCorrect, char) {
    const meaning = window.Storage.getMeaning(char);
    const hv = window.Storage.getHanViet(char);
    const fb = el(`
      <div class="test-feedback ${isCorrect ? 'correct' : 'wrong'}" style="margin-top:24px;">
        <div class="test-feedback-label">${isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}</div>
        <div class="test-feedback-detail"><strong>${char}</strong> — ${hv} — ${meaning}</div>
      </div>
    `);
    document.getElementById('testBody').appendChild(fb);
  }

  function advance() {
    session.index++;
    if (session.index >= session.questions.length) {
      complete();
      return;
    }
    updateProgressUI();
    renderCurrent();
  }

  function renderCurrent() {
    switch (session.mode) {
      case 'flashcard': renderFlashcard(); break;
      case 'mc-char-hv': renderMcCharHV(); break;
      case 'mc-meaning-char': renderMcMeaningChar(); break;
      case 'mc-char-meaning': renderMcCharMeaning(); break;
      case 'fill-blank': renderFillBlank(); break;
      case 'arrange': renderArrange(); break;
      case 'reading': renderReading(); break;
      case 'typing': renderTyping(); break;
    }
  }

  function complete() {
    const total = session.correctCount + session.wrongCount;
    const pct = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;
    let message = 'Tiếp tục cố gắng nhé.';
    if (pct >= 90) message = 'Xuất sắc! 學而時習之';
    else if (pct >= 70) message = 'Khá lắm! Hãy ôn tiếp.';
    else if (pct >= 50) message = 'Tạm ổn. Cần luyện thêm.';

    const node = el(`
      <div class="test-complete">
        <div class="test-complete-mark">畢</div>
        <div class="test-complete-title">${message}</div>
        <div class="test-complete-score">${session.correctCount} đúng · ${session.wrongCount} sai · ${pct}%</div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="btn btn-secondary btn-lg" id="completeBackBtn">Về trang chính</button>
          <button class="btn btn-primary btn-lg" id="completeRetryBtn">Làm lại</button>
        </div>
      </div>
    `);
    setBody(node);

    node.querySelector('#completeBackBtn').addEventListener('click', () => {
      window.Tests.exit();
    });
    node.querySelector('#completeRetryBtn').addEventListener('click', () => {
      window.Tests.start(session.mode);
    });
  }

  /* ============ API CÔNG KHAI ============ */

  window.Tests = {

    start(mode, opts = {}) {
      const count = opts.count || 10;
      const chars = selectStudyChars(count);
      if (chars.length === 0) {
        alert('Chưa có chữ nào trong danh sách. Vào "Cài đặt" để upload file ds_cac_chu.txt');
        return;
      }

      session = {
        mode,
        questions: chars,
        index: 0,
        correctCount: 0,
        wrongCount: 0
      };

      // Hiện test session, ẩn modes
      document.querySelector('.test-modes').style.display = 'none';
      document.getElementById('testSession').style.display = 'block';

      updateProgressUI();
      renderCurrent();
    },

    exit() {
      session = null;
      document.querySelector('.test-modes').style.display = 'block';
      document.getElementById('testSession').style.display = 'none';

      // Refresh dashboard nếu app expose hàm
      if (window.App && window.App.refreshStats) window.App.refreshStats();
    }
  };
})();
