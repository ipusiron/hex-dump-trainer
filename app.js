(function () {
  'use strict';

  const core = globalThis.HexDumpCore;
  const data = globalThis.HexDumpData;
  const element = id => document.getElementById(id);
  const copy = {
    ja: {
      lead: '16進ダンプを、バイトの位置から読めるように。',
      skipLink: '問題へ移動',
      skipLearning: '学習内容へ移動',
      tabsLabel: '表示を選択',
      practiceTab: '演習',
      learnTab: '学習',
      learnTitle: 'パケットの読み方',
      learnDumpTitle: '教材の16進ダンプ',
      learnDumpNote: '行頭はフレーム先頭からの16進オフセットです。薄いバイトはこのヘッダーの外側です。ここではASCII欄を省略しています。狭い画面では横にスクロールできます。',
      learnDumpAria: header => `${header}付近の教材ダンプ。8バイトごとに表示します。`,
      learnSelectionEmpty: '図か解説行の項目を選ぶと、対応するバイトと位置を確認できます。',
      learnSelection: (absolute, relative, raw) => `絶対オフセット ${absolute} ／ ヘッダー内 ${relative}（10進数）。元のバイト：${raw}。`,
      learnNibbleTitle: 'IPv4の先頭1バイトを分けて読む',
      learnNibblePart: (half, name, value) => `${half}4ビット：${name} ${value}`,
      learnNibbleUpper: '上位',
      learnNibbleLower: '下位',
      guideTitle: '最初に：16進ダンプの読み方',
      guideOne: '16進数の2桁（00〜FF）が1バイトです。左端の0000、0008、0010は各行の先頭オフセットで、0010は10進数の16です。',
      guideTwo: '各行は8バイトです。ASCII欄では印字できないバイトを「.」で示します。ASCII表示はバイトの意味を保証しません。',
      guideThree: 'Ethernet IIヘッダーは絶対オフセット0〜13、IPv4ヘッダーは14から始まります。IPv4内の相対位置とフレーム先頭からの位置を区別しましょう。',
      skip: '導入をスキップしてEthernet IIへ',
      lessons: '教材',
      lessonNote: '教材を切り替えると、その教材の問題は未回答状態から始まります。完了の記録は残ります。',
      completed: '完了',
      done: '回答済み',
      revealedCount: count => `解答表示 ${count}`,
      question: '問題',
      dump: '16進ダンプ',
      dumpNote: 'オフセットはゼロ始まり。バイトを2回押して開始・終了を選択できます。横にスクロールできます。',
      dumpAria: '16進ダンプ。各バイトは選択できるボタンです。',
      byteAria: (offset, hex) => `オフセット${offset}、16進値${hex}`,
      selectionEmpty: '選択範囲：未指定',
      selectionStart: start => `選択範囲：開始 ${start}、終了は未指定`,
      selectionBoth: (start, end) => `選択範囲：${start}〜${end}（両端を含む）`,
      start: '開始オフセット（10進数）',
      end: '終了オフセット（10進数）',
      value: '答え',
      check: '答え合わせ',
      hint: 'ヒント',
      reveal: '答えを見る',
      next: '次の問題へ',
      nextLesson: '次の教材へ',
      solution: '解答と根拠',
      solutionRange: 'バイト範囲',
      solutionHex: '元の16進値',
      solutionValue: '読み取った値',
      solutionSteps: '読み方',
      invalid: '指定された表記で、余分な文字を付けずに入力してください。範囲は昇順の整数で指定します。',
      wrong: 'まだ違います。選んだ位置や表記を確認して、再挑戦できます。',
      correct: '正解です。下のバイトと変換手順を確認してください。',
      revealed: '解答を表示しました。この問題は「解答表示」として記録します。',
      switched: '教材を切り替えました。問題は未回答状態から始まります。',
      finished: 'この教材を完了しました。ほかの教材も選べます。',
      hintHeader: header => `対象ヘッダー：${header}`,
      hintOffset: (header, relative) => `${header}の先頭から${relative}バイト目に対象が始まります。`,
      frame: 'フレーム',
      ethernet: 'Ethernet II',
      ipv4: 'IPv4',
      scope: '教材は自作のEthernet II＋IPv4フレームです。FCSは含めず、UDPフィールドは採点しません。自由入力や外部送信はありません。',
      rangeStep: '開始と終了の両端を含む範囲です。',
      bytesStep: raw => `${raw}を順に読みます。`,
      macStep: raw => `${raw}の6バイトをコロンで区切ります。`,
      ipStep: (raw, value) => `${raw}を各バイトごとに10進数へ変換すると${value}です。`,
      typeStep: value => `ネットワークバイト順で読み、${value}はIPv4を示します。`,
      numberStep: (raw, value) => `0x${raw.replace(/ /g, '')}を10進数にすると${value}です。`,
      versionStep: (raw, value) => `0x${raw}の上位4ビット：0x${raw} >> 4 = ${value}。`,
      ihlStep: (raw, value) => `0x${raw}の下位4ビット：0x${raw} & 0x0F = ${value}。`,
      lengthStep: (ihl, value) => `IHL ${ihl} × 4バイト = ${value}バイトです。`,
      protocolStep: (raw, value) => `0x${raw} = ${value}。値17はUDPを示します。`
    },
    en: {
      lead: 'Learn to read a hex dump by finding each byte.',
      skipLink: 'Skip to exercise',
      skipLearning: 'Skip to learning content',
      tabsLabel: 'Choose a view',
      practiceTab: 'Exercises',
      learnTab: 'Learn',
      learnTitle: 'How to read the packets',
      learnDumpTitle: 'Bytes in the lesson dump',
      learnDumpNote: 'Row labels are hexadecimal offsets from the frame start. Faded bytes are outside this header. The ASCII column is omitted here. Scroll sideways on a narrow screen.',
      learnDumpAria: header => `Lesson dump around ${header}, shown in eight-byte rows.`,
      learnSelectionEmpty: 'Select a diagram field or explanation row to locate its bytes and offsets.',
      learnSelection: (absolute, relative, raw) => `Absolute offset ${absolute} / within this header ${relative} (decimal). Original bytes: ${raw}.`,
      learnNibbleTitle: 'Split the first IPv4 byte',
      learnNibblePart: (half, name, value) => `${half} four bits: ${name} ${value}`,
      learnNibbleUpper: 'Upper',
      learnNibbleLower: 'Lower',
      guideTitle: 'Start here: reading a hex dump',
      guideOne: 'Two hexadecimal digits (00–FF) represent one byte. The left labels 0000, 0008, and 0010 are row offsets; 0010 in hex is 16 in decimal.',
      guideTwo: 'Each row contains eight bytes. The ASCII column shows non-printable bytes as “.”. ASCII display does not guarantee a byte’s meaning.',
      guideThree: 'The Ethernet II header occupies absolute offsets 0–13; the IPv4 header begins at 14. Keep IPv4-relative and frame-absolute offsets distinct.',
      skip: 'Skip introduction and open Ethernet II',
      lessons: 'Lessons',
      lessonNote: 'Switching lessons starts the selected lesson unanswered. Completion records remain.',
      completed: 'Completed',
      done: 'Answered',
      revealedCount: count => `${count} revealed`,
      question: 'Question',
      dump: 'Hex dump',
      dumpNote: 'Offsets start at zero. Press two bytes to choose the inclusive start and end. Scroll sideways if needed.',
      dumpAria: 'Hex dump. Each byte is a selectable button.',
      byteAria: (offset, hex) => `Offset ${offset}, hexadecimal value ${hex}`,
      selectionEmpty: 'Selection: none',
      selectionStart: start => `Selection: start ${start}, end not set`,
      selectionBoth: (start, end) => `Selection: ${start}–${end}, inclusive`,
      start: 'Start offset (decimal)',
      end: 'End offset (decimal)',
      value: 'Answer',
      check: 'Check answer',
      hint: 'Hint',
      reveal: 'Show answer',
      next: 'Next question',
      nextLesson: 'Next lesson',
      solution: 'Answer and evidence',
      solutionRange: 'Byte range',
      solutionHex: 'Original hex bytes',
      solutionValue: 'Interpreted value',
      solutionSteps: 'How to read it',
      invalid: 'Use the requested notation without extra characters. Ranges need ascending whole-number offsets.',
      wrong: 'Not quite. Check the selected bytes or notation and try again.',
      correct: 'Correct. Review the bytes and conversion below.',
      revealed: 'Answer shown. This question is recorded as revealed.',
      switched: 'Lesson switched. Its questions start unanswered.',
      finished: 'Lesson completed. You can choose another lesson.',
      hintHeader: header => `Target header: ${header}`,
      hintOffset: (header, relative) => `The target begins ${relative} bytes from the start of ${header}.`,
      frame: 'frame',
      ethernet: 'Ethernet II',
      ipv4: 'IPv4',
      scope: 'Samples are original Ethernet II + IPv4 frames. FCS is omitted, UDP fields are not graded, and there is no free-form input or external submission.',
      rangeStep: 'The range includes both the start and end bytes.',
      bytesStep: raw => `Read the bytes ${raw} in order.`,
      macStep: raw => `Separate the six bytes ${raw} with colons.`,
      ipStep: (raw, value) => `Convert each of ${raw} to decimal to obtain ${value}.`,
      typeStep: value => `Read in network byte order; ${value} indicates IPv4.`,
      numberStep: (raw, value) => `0x${raw.replace(/ /g, '')} in decimal is ${value}.`,
      versionStep: (raw, value) => `Upper four bits of 0x${raw}: 0x${raw} >> 4 = ${value}.`,
      ihlStep: (raw, value) => `Lower four bits of 0x${raw}: 0x${raw} & 0x0F = ${value}.`,
      lengthStep: (ihl, value) => `IHL ${ihl} × 4 bytes = ${value} bytes.`,
      protocolStep: (raw, value) => `0x${raw} = ${value}; protocol 17 is UDP.`
    }
  };

  const progress = Object.fromEntries(data.lessons.map(lesson => [lesson.id, {
    solved: new Set(), revealed: new Set()
  }]));
  const state = {
    locale: 'ja', view: 'practice', lessonIndex: 0, questionIndex: 0,
    start: '', end: '', value: '', hintLevel: 0,
    outcome: '', feedbackKey: '', noticeKey: ''
  };
  const learnPanel = element('learn-panel');
  const learnItems = Array.from(learnPanel.querySelectorAll('[data-learn-field]'));
  const diagramFields = Array.from(learnPanel.querySelectorAll('.diagram-field'));
  const learningPanels = Array.from(learnPanel.querySelectorAll('[data-learn-header]'));
  const learningBytes = core.parseHex(data.frames.ipv4.hex);
  const learningRows = core.dumpRows(learningBytes, 8);
  const learnHighlight = { hovered: null, focused: null, selected: null };

  for (const field of diagramFields) {
    field.setAttribute('role', 'button');
    field.setAttribute('aria-pressed', 'false');
    field.tabIndex = 0;
  }

  function learningItem(target) {
    if (!(target instanceof Element)) return null;
    const item = target.closest('[data-learn-field]');
    return item && learnPanel.contains(item) ? item : null;
  }

  function learningRange(start, end, locale) {
    return start === end ? String(start) : `${start}${locale === 'ja' ? '〜' : '–'}${end}`;
  }

  function renderLearningDumps() {
    for (const panel of learningPanels) {
      const header = panel.dataset.learnHeader;
      const bounds = data.learningHeaders[header];
      const locale = panel.closest('[lang]').lang;
      const t = copy[locale];
      const title = document.createElement('h4');
      title.textContent = t.learnDumpTitle;
      const note = document.createElement('p');
      note.className = 'learning-dump-note';
      note.textContent = t.learnDumpNote;
      const dump = document.createElement('div');
      dump.className = 'learning-dump';
      dump.setAttribute('role', 'region');
      dump.setAttribute('aria-label', t.learnDumpAria(t[header] || 'UDP'));
      dump.tabIndex = 0;

      for (const row of learningRows) {
        if (!row.bytes.some(byte => byte.offset >= bounds.start && byte.offset <= bounds.end)) continue;
        const line = document.createElement('div');
        line.className = 'learning-dump-row';
        const offset = document.createElement('span');
        offset.className = 'learning-row-offset';
        offset.textContent = row.offsetHex;
        line.append(offset);
        for (const byte of row.bytes) {
          const cell = document.createElement('span');
          cell.className = 'learning-byte';
          if (byte.offset < bounds.start || byte.offset > bounds.end) cell.classList.add('is-context');
          cell.dataset.offset = String(byte.offset);
          cell.textContent = byte.hex;
          line.append(cell);
        }
        dump.append(line);
      }

      const selection = document.createElement('p');
      selection.className = 'learning-selection';
      selection.textContent = t.learnSelectionEmpty;
      panel.append(title, note, dump, selection);

      if (header === 'ipv4') {
        const first = learningBytes[bounds.start];
        const bits = first.toString(2).padStart(8, '0');
        const nibble = document.createElement('div');
        nibble.className = 'learning-nibble';
        const nibbleTitle = document.createElement('p');
        nibbleTitle.className = 'learning-nibble-title';
        nibbleTitle.textContent = t.learnNibbleTitle;
        const equation = document.createElement('p');
        equation.className = 'learning-nibble-equation';
        const hex = document.createElement('code');
        hex.textContent = core.byteHex(first);
        const binary = document.createElement('code');
        binary.textContent = `${bits.slice(0, 4)} ${bits.slice(4)}`;
        equation.append(hex, document.createTextNode(' = '), binary);
        const parts = document.createElement('div');
        parts.className = 'learning-nibble-parts';
        for (const [key, half, value, group] of [
          ['ip-version', t.learnNibbleUpper, first >> 4, bits.slice(0, 4)],
          ['ip-ihl', t.learnNibbleLower, first & 0x0f, bits.slice(4)]
        ]) {
          const part = document.createElement('div');
          part.className = 'learning-nibble-part';
          part.dataset.nibble = key;
          const code = document.createElement('code');
          code.textContent = group;
          const label = document.createElement('span');
          label.textContent = t.learnNibblePart(half, key === 'ip-version' ? 'Version' : 'IHL', value);
          part.append(code, label);
          parts.append(part);
        }
        nibble.append(nibbleTitle, equation, parts);
        panel.append(nibble);
      }
    }
  }

  function scrollLearningRange(key) {
    const field = data.learningFields[key];
    if (!field) return;
    const panel = element(`learn-${state.locale}`).querySelector(`[data-learn-header="${field.header}"]`);
    const dump = panel.querySelector('.learning-dump');
    const visible = Array.from(dump.querySelectorAll('.learning-byte')).filter(byte => {
      const offset = Number(byte.dataset.offset);
      return offset >= field.start && offset <= field.end;
    });
    if (!visible.length) return;
    const bounds = dump.getBoundingClientRect();
    const labelWidth = dump.querySelector('.learning-row-offset').getBoundingClientRect().width;
    const safeLeft = bounds.left + labelWidth + 8;
    const safeRight = bounds.right - 8;
    const left = Math.min(...visible.map(byte => byte.getBoundingClientRect().left));
    const right = Math.max(...visible.map(byte => byte.getBoundingClientRect().right));
    const fits = right - left <= safeRight - safeLeft;
    const first = visible.find(byte => Number(byte.dataset.offset) === field.start).getBoundingClientRect();
    const targetLeft = fits ? left : first.left;
    const targetRight = fits ? right : first.right;
    if (targetLeft < safeLeft) dump.scrollLeft += targetLeft - safeLeft;
    else if (targetRight > safeRight) dump.scrollLeft += targetRight - safeRight;
  }

  function renderLearningHighlight() {
    const active = learnHighlight.hovered || learnHighlight.focused || learnHighlight.selected;
    const activeField = active ? data.learningFields[active] : null;
    for (const item of learnItems) {
      item.classList.toggle('is-highlighted', item.dataset.learnField === active);
      item.classList.toggle('is-selected', item.dataset.learnField === active && active === learnHighlight.selected);
    }
    for (const panel of learningPanels) {
      const header = panel.dataset.learnHeader;
      const locale = panel.closest('[lang]').lang;
      const t = copy[locale];
      const matchesHeader = activeField && activeField.header === header;
      for (const byte of panel.querySelectorAll('.learning-byte')) {
        const offset = Number(byte.dataset.offset);
        const matches = matchesHeader && offset >= activeField.start && offset <= activeField.end;
        byte.classList.toggle('is-highlighted', !!matches);
        byte.classList.toggle('is-selected', !!matches && active === learnHighlight.selected);
      }
      const summary = panel.querySelector('.learning-selection');
      if (matchesHeader) {
        const base = data.learningHeaders[header].start;
        const absolute = learningRange(activeField.start, activeField.end, locale);
        const relative = learningRange(activeField.start - base, activeField.end - base, locale);
        const raw = Array.from(learningBytes.slice(activeField.start, activeField.end + 1), core.byteHex).join(' ');
        summary.textContent = t.learnSelection(absolute, relative, raw);
      } else {
        summary.textContent = t.learnSelectionEmpty;
      }
      for (const part of panel.querySelectorAll('[data-nibble]')) {
        const matches = part.dataset.nibble === active;
        part.classList.toggle('is-highlighted', matches);
        part.classList.toggle('is-selected', matches && active === learnHighlight.selected);
      }
    }
    for (const field of diagramFields) {
      field.setAttribute('aria-pressed', String(field.dataset.learnField === learnHighlight.selected));
    }
  }

  function toggleLearningSelection(key) {
    learnHighlight.selected = learnHighlight.selected === key ? null : key;
    renderLearningHighlight();
    if (learnHighlight.selected) scrollLearningRange(key);
  }

  function words() { return copy[state.locale]; }
  function lesson() { return data.lessons[state.lessonIndex]; }
  function question() { return lesson().questions[state.questionIndex]; }
  function frame() { return data.frames[lesson().frameId]; }
  function answer() { return core.answerFor(question(), frame()); }
  function setText(id, value) { element(id).textContent = value; }

  function renderTabs() {
    const t = words();
    const practice = state.view === 'practice';
    document.querySelector('.main-tabs').setAttribute('aria-label', t.tabsLabel);
    setText('practice-tab', t.practiceTab);
    setText('learn-tab', t.learnTab);
    setText('learn-title', t.learnTitle);
    for (const [id, selected] of [['practice-tab', practice], ['learn-tab', !practice]]) {
      const tab = element(id);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    element('practice-panel').hidden = !practice;
    element('learn-panel').hidden = practice;
    element('learn-ja').hidden = state.locale !== 'ja';
    element('learn-en').hidden = state.locale !== 'en';
    element('skip-link').href = practice ? '#question-title' : '#learn-panel';
    setText('skip-link', practice ? t.skipLink : t.skipLearning);
    if (!practice && learnHighlight.selected) scrollLearningRange(learnHighlight.selected);
  }

  function switchView(view, focusTab) {
    if (view !== 'practice' && view !== 'learn') return;
    state.view = view;
    renderTabs();
    if (focusTab) element(view === 'practice' ? 'practice-tab' : 'learn-tab').focus();
  }

  function resetQuestion() {
    state.start = '';
    state.end = '';
    state.value = '';
    state.hintLevel = 0;
    state.outcome = '';
    state.feedbackKey = '';
  }

  function switchLesson(index) {
    if (!Number.isInteger(index) || index < 0 || index >= data.lessons.length) return;
    state.lessonIndex = index;
    state.questionIndex = 0;
    state.noticeKey = 'switched';
    resetQuestion();
    render();
    element('question-title').focus();
  }

  function renderStatic() {
    const t = words();
    document.documentElement.lang = state.locale;
    document.title = `Hex Dump Trainer | Day114`;
    const languageButton = element('language-button');
    languageButton.textContent = state.locale === 'ja' ? 'English' : '日本語';
    languageButton.lang = state.locale === 'ja' ? 'en' : 'ja';
    languageButton.setAttribute('aria-label', state.locale === 'ja' ? 'Switch to English' : '日本語に切り替える');
    setText('lead', t.lead);
    setText('guide-title', t.guideTitle);
    setText('guide-one', t.guideOne);
    setText('guide-two', t.guideTwo);
    setText('guide-three', t.guideThree);
    element('intro-guide').hidden = state.lessonIndex !== 0;
    setText('skip-intro', t.skip);
    element('skip-intro').hidden = state.lessonIndex !== 0;
    setText('lessons-title', t.lessons);
    setText('lesson-note', t.lessonNote);
    setText('dump-title', t.dump);
    setText('dump-note', t.dumpNote);
    element('dump').setAttribute('aria-label', t.dumpAria);
    setText('start-label', t.start);
    setText('end-label', t.end);
    setText('value-label', t.value);
    setText('check-button', t.check);
    setText('hint-button', t.hint);
    setText('reveal-button', t.reveal);
    setText('solution-title', t.solution);
    setText('solution-range-label', t.solutionRange);
    setText('solution-hex-label', t.solutionHex);
    setText('solution-value-label', t.solutionValue);
    setText('solution-steps-label', t.solutionSteps);
    setText('scope-note', t.scope);
  }

  function renderLessons() {
    const t = words();
    const buttons = data.lessons.map((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-button';
      button.dataset.lessonIndex = String(index);
      if (index === state.lessonIndex) button.setAttribute('aria-current', 'true');
      const title = document.createElement('span');
      title.textContent = item.title[state.locale];
      const count = document.createElement('span');
      count.className = 'lesson-count';
      const record = progress[item.id];
      const done = new Set([...record.solved, ...record.revealed]).size;
      count.textContent = `${done}/${item.questions.length} ${done === item.questions.length ? t.completed : t.done}` +
        (record.revealed.size ? ` · ${t.revealedCount(record.revealed.size)}` : '');
      button.append(title, count);
      return button;
    });
    element('lesson-list').replaceChildren(...buttons);
  }

  function renderDump() {
    const t = words();
    const bytes = core.parseHex(frame().hex);
    const rows = core.dumpRows(bytes, 8).map(row => {
      const container = document.createElement('div');
      container.className = 'dump-row';
      const offset = document.createElement('span');
      offset.className = 'row-offset';
      offset.textContent = row.offsetHex;
      const byteList = document.createElement('div');
      byteList.className = 'byte-list';
      for (const item of row.bytes) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'byte-button';
        button.dataset.offset = String(item.offset);
        button.textContent = item.hex;
        button.setAttribute('aria-label', t.byteAria(item.offset, item.hex));
        button.setAttribute('aria-pressed', 'false');
        byteList.append(button);
      }
      const ascii = document.createElement('span');
      ascii.className = 'ascii-cell';
      ascii.textContent = row.ascii.padEnd(8, ' ');
      container.append(offset, byteList, ascii);
      return container;
    });
    element('dump').replaceChildren(...rows);
    renderSelection();
  }

  function parsedSelection() {
    const max = core.parseHex(frame().hex).length - 1;
    const valid = value => /^(0|[1-9][0-9]*)$/.test(value) && Number(value) <= max;
    return {
      start: valid(state.start) ? Number(state.start) : null,
      end: valid(state.end) ? Number(state.end) : null
    };
  }

  function renderSelection() {
    const t = words();
    const selected = parsedSelection();
    const solution = state.outcome ? answer() : null;
    for (const button of element('dump').querySelectorAll('[data-offset]')) {
      const offset = Number(button.dataset.offset);
      const inSelection = selected.start !== null && selected.end !== null &&
        selected.start <= offset && offset <= selected.end;
      button.classList.toggle('is-selected', !solution && inSelection);
      button.classList.toggle('is-start', !solution && offset === selected.start);
      button.classList.toggle('is-solution', !!solution && solution.start <= offset && offset <= solution.end);
      button.setAttribute('aria-pressed', String(!!solution
        ? solution.start <= offset && offset <= solution.end
        : inSelection || offset === selected.start));
      button.disabled = !!solution;
    }
    let preview = t.selectionEmpty;
    if (selected.start !== null) preview = selected.end === null
      ? t.selectionStart(selected.start) : t.selectionBoth(selected.start, selected.end);
    setText('selection-preview', preview);
  }

  function headerName(header) { return words()[header]; }

  function solutionSteps(result) {
    const t = words();
    const field = question().field;
    const raw = result.rawHex;
    if (field === 'version') return t.versionStep(raw, result.value);
    if (field === 'ihl') return t.ihlStep(raw, result.value);
    if (field === 'headerLength') return t.lengthStep(result.byteValue & 0x0f, result.value);
    if (field === 'etherType') return t.typeStep(result.value);
    if (field === 'protocol') return t.protocolStep(raw, result.value);
    if (result.format === 'mac') return t.macStep(raw);
    if (result.format === 'ip') return t.ipStep(raw, result.value);
    if (result.format === 'decimal') return t.numberStep(raw, result.value);
    if (result.format === 'hex') return t.bytesStep(raw);
    return t.rangeStep;
  }

  function renderOutcome() {
    const t = words();
    const result = answer();
    const hintText = state.hintLevel === 1 ? t.hintHeader(headerName(result.header))
      : state.hintLevel === 2 ? t.hintOffset(headerName(result.header), result.relativeStart)
        : '';
    setText('hint-text', hintText);
    const feedback = state.feedbackKey || state.noticeKey;
    setText('feedback', feedback ? t[feedback] : '');
    element('feedback').classList.toggle('is-error', feedback === 'invalid' || feedback === 'wrong');
    element('feedback').classList.toggle('is-success', feedback === 'correct' || feedback === 'finished');
    const finished = !!state.outcome;
    element('solution').hidden = !finished;
    if (finished) {
      setText('solution-range', `${core.offsetHex(result.start)}–${core.offsetHex(result.end)} (${result.start}–${result.end})`);
      setText('solution-hex', result.rawHex);
      setText('solution-value', result.value);
      setText('solution-steps', solutionSteps(result));
    }
    element('check-button').disabled = finished;
    element('hint-button').disabled = finished;
    element('reveal-button').disabled = finished;
    element('start-offset').disabled = finished;
    element('end-offset').disabled = finished;
    element('answer-input').disabled = finished;
    const hasNext = state.questionIndex + 1 < lesson().questions.length ||
      state.lessonIndex + 1 < data.lessons.length;
    element('next-button').hidden = !finished || !hasNext;
    setText('next-button', state.questionIndex + 1 < lesson().questions.length ? t.next : t.nextLesson);
    renderSelection();
  }

  function render() {
    const t = words();
    renderStatic();
    renderTabs();
    renderLessons();
    const item = lesson();
    const current = question();
    setText('question-count', `${item.title[state.locale]} · ${t.question} ${state.questionIndex + 1}/${item.questions.length}`);
    setText('question-title', `${t.question} ${state.questionIndex + 1}`);
    setText('question-prompt', current.prompt[state.locale]);
    element('range-fields').hidden = current.kind !== 'range';
    element('value-field').hidden = current.kind === 'range';
    element('start-offset').value = state.start;
    element('end-offset').value = state.end;
    element('answer-input').value = state.value;
    const expected = answer();
    element('answer-input').placeholder = expected.format === 'hex'
      ? '0x' + '00'.repeat(expected.rawHex.split(' ').length)
      : { decimal: '10', mac: '02:00:00:00:00:01', ip: '192.0.2.1' }[expected.format] || '';
    renderDump();
    renderOutcome();
  }

  function recordOutcome(outcome) {
    state.outcome = outcome;
    state.feedbackKey = outcome === 'correct' ? 'correct' : 'revealed';
    state.noticeKey = '';
    const record = progress[lesson().id];
    if (outcome === 'correct') {
      record.revealed.delete(question().id);
      record.solved.add(question().id);
    } else if (!record.solved.has(question().id)) {
      record.revealed.add(question().id);
    }
    const done = new Set([...record.solved, ...record.revealed]).size;
    if (done === lesson().questions.length && state.questionIndex === lesson().questions.length - 1) {
      state.feedbackKey = 'finished';
    }
    renderLessons();
    renderOutcome();
  }

  element('language-button').addEventListener('click', () => {
    state.locale = state.locale === 'ja' ? 'en' : 'ja';
    render();
  });
  element('practice-tab').addEventListener('click', () => switchView('practice', false));
  element('learn-tab').addEventListener('click', () => switchView('learn', false));
  document.querySelector('.main-tabs').addEventListener('keydown', event => {
    let view;
    if (event.key === 'Home') view = 'practice';
    else if (event.key === 'End') view = 'learn';
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      view = state.view === 'practice' ? 'learn' : 'practice';
    } else return;
    event.preventDefault();
    switchView(view, true);
  });
  learnPanel.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches) return;
    const item = learningItem(event.target);
    if (!item || item.contains(event.relatedTarget)) return;
    learnHighlight.hovered = item.dataset.learnField;
    renderLearningHighlight();
  });
  learnPanel.addEventListener('pointerout', event => {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches) return;
    const item = learningItem(event.target);
    if (!item || item.contains(event.relatedTarget)) return;
    if (learnHighlight.hovered === item.dataset.learnField) {
      learnHighlight.hovered = null;
      renderLearningHighlight();
    }
  });
  learnPanel.addEventListener('focusin', event => {
    const item = learningItem(event.target);
    if (!item || !item.classList.contains('diagram-field') || !item.matches(':focus-visible')) return;
    learnHighlight.focused = item.dataset.learnField;
    learnHighlight.hovered = null;
    renderLearningHighlight();
    scrollLearningRange(learnHighlight.focused);
  });
  learnPanel.addEventListener('focusout', event => {
    const item = learningItem(event.target);
    if (item && learnHighlight.focused === item.dataset.learnField) {
      learnHighlight.focused = null;
      renderLearningHighlight();
    }
  });
  learnPanel.addEventListener('keydown', event => {
    const item = learningItem(event.target);
    if (!item || !item.classList.contains('diagram-field')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleLearningSelection(item.dataset.learnField);
  });
  learnPanel.addEventListener('click', event => {
    const item = learningItem(event.target);
    if (item) {
      toggleLearningSelection(item.dataset.learnField);
    } else if (event.target.closest('[data-open-practice]')) {
      switchView('practice', true);
    }
  });
  element('skip-intro').addEventListener('click', () => switchLesson(1));
  element('lesson-list').addEventListener('click', event => {
    const button = event.target.closest('[data-lesson-index]');
    if (button) switchLesson(Number(button.dataset.lessonIndex));
  });
  element('dump').addEventListener('click', event => {
    const button = event.target.closest('[data-offset]');
    if (!button || state.outcome) return;
    const offset = Number(button.dataset.offset);
    const selected = parsedSelection();
    if (selected.start === null || selected.end !== null || offset < selected.start) {
      state.start = String(offset);
      state.end = '';
    } else {
      state.end = String(offset);
    }
    state.feedbackKey = '';
    state.noticeKey = '';
    element('start-offset').value = state.start;
    element('end-offset').value = state.end;
    renderSelection();
    renderOutcome();
  });
  for (const [id, key] of [['start-offset', 'start'], ['end-offset', 'end'], ['answer-input', 'value']]) {
    element(id).addEventListener('input', event => {
      state[key] = event.target.value;
      state.feedbackKey = '';
      state.noticeKey = '';
      renderSelection();
      renderOutcome();
    });
  }
  element('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (state.outcome) return;
    const response = question().kind === 'range'
      ? { start: state.start, end: state.end } : { value: state.value };
    const result = core.grade(question(), frame(), response);
    if (result.ok) {
      recordOutcome('correct');
    } else {
      state.feedbackKey = result.valid ? 'wrong' : 'invalid';
      state.noticeKey = '';
      renderOutcome();
    }
  });
  element('hint-button').addEventListener('click', () => {
    if (state.outcome) return;
    state.hintLevel += 1;
    state.feedbackKey = '';
    state.noticeKey = '';
    if (state.hintLevel >= 3) recordOutcome('revealed');
    else renderOutcome();
  });
  element('reveal-button').addEventListener('click', () => {
    if (!state.outcome) recordOutcome('revealed');
  });
  element('next-button').addEventListener('click', () => {
    if (!state.outcome) return;
    if (state.questionIndex + 1 < lesson().questions.length) {
      state.questionIndex += 1;
      state.noticeKey = '';
      resetQuestion();
      render();
      element('question-title').focus();
    } else if (state.lessonIndex + 1 < data.lessons.length) {
      switchLesson(state.lessonIndex + 1);
    }
  });

  renderLearningDumps();
  renderLearningHighlight();
  render();
})();
