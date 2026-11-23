import { EDU_ITEMS, openEduGame } from './edu-engine.js';
import { drawIllustration } from './edu-art.js';
import { isDayMode, onThemeChange } from './theme.ts';

type MathTopicId = 'raqam' | 'qoshish' | 'ayirish' | 'mantiq' | 'tez';

interface MathTopic {
  id: MathTopicId;
  title: string;
  sub: string;
  desc: string;
  art: string;
  accent: string;
  itemIds: number[];
  prompts: { q: string; options: string[]; answer: string; explain: string }[];
}

const TOPICS: MathTopic[] = [
  {
    id: 'raqam', title: 'Raqamlar va sanash', sub: '1–20, tartib, taqqoslash', art: 'olma', accent: '#68b5ff',
    desc: 'Raqamlarni tanish, sanash, tartiblash va kattalikni solishtirishni o\'rganamiz.',
    itemIds: [10, 11, 12, 13, 14, 34],
    prompts: [
      { q: 'Qaysi son 6 dan katta?', options: ['4', '5', '9', '3'], answer: '9', explain: '9 soni 6 dan katta.' },
      { q: '1 dan keyin qaysi son keladi?', options: ['0', '2', '3', '5'], answer: '2', explain: 'Sanash tartibi: 1, 2, 3...' },
      { q: '10 va 12 orasida qaysi son bor?', options: ['9', '11', '13', '8'], answer: '11', explain: '10 dan keyin 11, keyin 12 keladi.' }
    ]
  },
  {
    id: 'qoshish', title: 'Qoʻshish', sub: 'birlashtirish va yigʻindi', art: 'yulduz', accent: '#5eead4',
    desc: 'Narsalarni birlashtirib qoʻshishni, 10 ga toʻldirishni va tez hisoblashni mashq qilamiz.',
    itemIds: [15, 16, 17, 18],
    prompts: [
      { q: '3 + 4 nechaga teng?', options: ['6', '7', '8', '5'], answer: '7', explain: '3 ga 4 ni qoʻshsak 7 bo\'ladi.' },
      { q: '10 ga to\'ldirish uchun 7 ga nechani qo\'shamiz?', options: ['2', '3', '4', '5'], answer: '3', explain: '7 + 3 = 10.' },
      { q: '5 + 5 nechaga teng?', options: ['9', '10', '11', '8'], answer: '10', explain: '5 + 5 = 10.' }
    ]
  },
  {
    id: 'ayirish', title: 'Ayirish', sub: 'qolganini topish', art: 'sar', accent: '#ffd166',
    desc: 'Narsalarni ayirib, nechta qolganini topishni o\'rganamiz.',
    itemIds: [19, 20],
    prompts: [
      { q: '9 − 4 nechaga teng?', options: ['3', '4', '5', '6'], answer: '5', explain: '9 dan 4 ni olsak 5 qoladi.' },
      { q: '8 − 2 nechaga teng?', options: ['5', '6', '7', '4'], answer: '6', explain: '8 dan 2 ni olsak 6 qoladi.' },
      { q: '10 − 3 nechaga teng?', options: ['6', '7', '8', '5'], answer: '7', explain: '10 dan 3 ni olsak 7 qoladi.' }
    ]
  },
  {
    id: 'mantiq', title: 'Shakl va mantiq', sub: 'naqsh, soat, juftlik', art: 'gul', accent: '#a78bfa',
    desc: 'Shakllar, ketma-ketlik, juftlik va vaqt orqali mantiqiy fikrlashni kuchaytiramiz.',
    itemIds: [23, 25, 26, 31],
    prompts: [
      { q: 'Qaysi biri uchburchak?', options: ['▲', '●', '■', '★'], answer: '▲', explain: '▲ — uchburchak shakli.' },
      { q: '2, 4, 6, ... keyingi son?', options: ['7', '8', '9', '10'], answer: '8', explain: 'Har safar 2 qo\'shiladi: 6 + 2 = 8.' },
      { q: 'Qaysi biri juft?', options: ['1', '3', '4', '5'], answer: '4', explain: '4 juft son.' }
    ]
  },
  {
    id: 'tez', title: 'Tez hisob', sub: 'tezkor mashq va sinov', art: 'raketa', accent: '#ff8fab',
    desc: 'Qoʻshish-ayirishni tez va aniq yechish uchun qisqa mashqlar.',
    itemIds: [21, 37, 24, 40],
    prompts: [
      { q: '6 + 3 nechaga teng?', options: ['8', '9', '10', '7'], answer: '9', explain: '6 + 3 = 9.' },
      { q: '10 − 5 nechaga teng?', options: ['4', '5', '6', '3'], answer: '5', explain: '10 − 5 = 5.' },
      { q: '4 + 4 nechaga teng?', options: ['6', '7', '8', '9'], answer: '8', explain: '4 + 4 = 8.' }
    ]
  }
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function createMathView() {
  const section = document.getElementById('view-math') as HTMLElement | null;
  const host = document.getElementById('math-host') as HTMLElement | null;
  if (!section || !host) return { el: section || document.createElement('div'), enter() {}, leave() {} };

  let selected = 0;
  let promptIdx = 0;
  let promptFeedback: { ok: boolean; text: string } | null = null;
  let promptOpts: string[] = [];
  let isVisible = false;
  let artRaf = 0;
  let artCanvases: Array<{ canvas: HTMLCanvasElement; art: string; accent: string; size: number }> = [];

  function getTopic() { return TOPICS[selected]; }
  function getPrompt() { const t = getTopic(); return t.prompts[promptIdx % t.prompts.length]; }
  function resetPrompt() { promptFeedback = null; promptOpts = shuffle(getPrompt().options); }

  function stopArt() { if (artRaf) { cancelAnimationFrame(artRaf); artRaf = 0; } }
  function startArt() {
    stopArt();
    const tick = (ts: number) => {
      if (!isVisible) return;
      artCanvases.forEach((e) => {
        const ctx = e.canvas.getContext('2d');
        if (ctx) drawIllustration(ctx, e.art, e.canvas.width, ts * 0.001, e.accent, e.size);
      });
      artRaf = requestAnimationFrame(tick);
    };
    artRaf = requestAnimationFrame(tick);
  }

  function render() {
    if (!host) return;
    stopArt();
    artCanvases = [];
    host.innerHTML = '';
    const topic = getTopic();
    const shell = document.createElement('div');
    shell.className = 'alpha-studio-shell math-studio-shell';

    const head = document.createElement('div');
    head.className = 'alpha-studio-head';
    head.innerHTML = `
      <div>
        <h2 class="alpha-head-title">Matematika studiyasi <span class="alpha-count-tag">${TOPICS.length} bo'lim</span></h2>
        <p class="alpha-head-sub">Sanash, qo'shish, ayirish va mantiqni o'yin orqali o'rganing.</p>
      </div>
    `;
    shell.appendChild(head);

    const tabs = document.createElement('div');
    tabs.className = 'alpha-filter-row';
    TOPICS.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `alpha-filter-btn ${i === selected ? 'is-active' : ''}`;
      b.textContent = t.title;
      b.addEventListener('click', () => { selected = i; promptIdx = 0; resetPrompt(); render(); });
      tabs.appendChild(b);
    });
    shell.appendChild(tabs);

    const layout = document.createElement('div');
    layout.className = 'alpha-matrix-layout math-layout';

    const left = document.createElement('div');
    left.className = 'alpha-matrix-board math-topic-board';
    TOPICS.forEach((t, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `alpha-matrix-cell math-topic-cell ${i === selected ? 'is-selected' : ''}`;
      card.innerHTML = `
        <span class="alpha-cell-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="alpha-cell-glyph" style="font-size:clamp(18px,2.4vw,28px)"><small>${t.title}</small></span>
        <span class="alpha-cell-word">${t.sub}</span>
      `;
      card.addEventListener('click', () => { selected = i; promptIdx = 0; resetPrompt(); render(); });
      left.appendChild(card);
    });

    const stage = document.createElement('aside');
    stage.className = 'alpha-stage-card math-stage-card';
    const top = document.createElement('div');
    top.className = 'alpha-stage-top';
    const info = document.createElement('div');
    info.className = 'alpha-stage-hero';
    info.innerHTML = `
      <div class="alpha-stage-meta"><span>${String(selected + 1).padStart(2, '0')} / ${TOPICS.length}</span><span>·</span><span>Matematika bo'limi</span></div>
      <div class="alpha-stage-pair" style="--entry-accent:${topic.accent};font-size:clamp(34px,5vw,56px);line-height:1.1">${topic.title}</div>
      <p class="alpha-spot-hint" style="margin:0 0 10px;color:var(--mute);font-weight:650">${topic.desc}</p>
      <div class="alpha-stage-words">${topic.itemIds.map((id) => { const it = EDU_ITEMS.find(x=>x.id===id); return it ? `<span class="alpha-word-chip">${it.title}</span>` : ''; }).join('')}</div>
    `;
    const art = document.createElement('canvas');
    art.width = 124; art.height = 124; art.className = 'alpha-stage-art';
    artCanvases.push({ canvas: art, art: topic.art, accent: topic.accent, size: 96 });
    top.append(info, art);
    stage.appendChild(top);

    const prompt = getPrompt();
    if (!promptOpts.length) resetPrompt();
    const quiz = document.createElement('div');
    quiz.className = 'alpha-lab-body';
    quiz.innerHTML = `
      <div class="alpha-check-form">
        <div class="alpha-check-prompt">${prompt.q}</div>
        <div class="alpha-check-opts">${promptOpts.map((o) => `<button type="button" class="alpha-check-opt" data-val="${o}">${o}</button>`).join('')}</div>
        <div class="alpha-check-msg" id="math-check-msg" style="color:${promptFeedback ? (promptFeedback.ok ? (isDayMode() ? '#047857' : '#5eead4') : (isDayMode() ? '#be123c' : '#ff8fab')) : ''}">${promptFeedback ? promptFeedback.text : ''}</div>
      </div>
    `;
    quiz.querySelectorAll('.alpha-check-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = (btn as HTMLElement).dataset.val || '';
        if (val === prompt.answer) {
          promptFeedback = { ok: true, text: prompt.explain + ' Keyingisi...' };
          render();
          setTimeout(() => { promptIdx++; promptFeedback = null; resetPrompt(); if (isVisible) render(); }, 900);
        } else {
          promptFeedback = { ok: false, text: 'Yana urinib ko\'ring.' };
          render();
        }
      });
    });
    stage.appendChild(quiz);

    layout.append(left, stage);
    shell.appendChild(layout);

    const dock = document.createElement('div');
    dock.className = 'alpha-games-dock';
    dock.innerHTML = `
      <div class="alpha-games-head">
        <div><h3 class="alpha-games-title">Matematika o'yinlari</h3><p class="alpha-games-sub">${topic.title} bo'limiga mos mashqlar</p></div>
      </div>
      <div class="alpha-games-grid math-games-grid"></div>
    `;
    const grid = dock.querySelector('.alpha-games-grid') as HTMLElement;
    topic.itemIds.forEach((id) => {
      const item = EDU_ITEMS.find((x) => x.id === id);
      if (!item) return;
      const card = document.createElement('div');
      card.className = 'alpha-game-card';
      card.innerHTML = `
        <button type="button" class="alpha-game-btn" data-role="play">
          <span class="alpha-game-glyph">${item.glyph}</span>
          <span class="alpha-game-info"><strong>${item.title}</strong><small>${item.subGlyph}</small></span>
          <span class="alpha-game-go" aria-hidden="true">→</span>
        </button>
        <button type="button" class="alpha-game-pvp-btn" data-role="pvp" title="PvP">1v2</button>
      `;
      card.querySelector('[data-role="play"]')?.addEventListener('click', () => openEduGame(item));
      card.querySelector('[data-role="pvp"]')?.addEventListener('click', () => openEduGame({ ...item, config: { ...(item.config || {}), pvpMode: true } }));
      grid.appendChild(card);
    });
    shell.appendChild(dock);

    host.appendChild(shell);
    if (isVisible) startArt();
  }

  onThemeChange(() => { if (isVisible) render(); });

  return {
    el: section,
    enter() { isVisible = true; resetPrompt(); render(); },
    leave() { isVisible = false; stopArt(); }
  };
}
