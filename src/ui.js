import { WORLDS } from './worlds/registry.js';
import { Sound } from './sound.js';

export function initUI(exp) {
  const root = document.getElementById('ui-root');
  const sound = new Sound();

  // ---------------- INTRO TERMINAL ----------------
  const intro = document.createElement('div');
  intro.className = 'intro';
  intro.innerHTML = `
    <div>
      <div class="terminal" id="term"></div>
      <div class="begin" id="begin"><span class="key">Enter ⏎</span><span>Begin the journey</span></div>
    </div>`;
  root.appendChild(intro);

  const term = intro.querySelector('#term');
  const begin = intro.querySelector('#begin');
  const lines = [
    { t: '> ./boot --dream', c: 'muted' },
    { t: 'Initializing imagination…' },
    { t: 'Compiling future…' },
    { t: 'Building creativity…' },
    { t: 'Loading the world of code…' },
    { t: '[ok] 18 worlds mounted', c: 'muted' },
    { t: '[ok] sunrise scheduled', c: 'muted' },
    { t: 'one line of code can change everything_', c: 'glow' },
  ];

  let started = false;
  const startJourney = () => {
    if (started) return;
    started = true;
    sound.unlock();
    intro.classList.add('hide');
    exp.igniteBirth();
    setTimeout(() => { intro.style.display = 'none'; }, 1300);
    hud.classList.add('show');
  };

  typeLines(term, lines, sound).then(() => {
    begin.classList.add('show');
  });

  begin.addEventListener('click', startJourney);
  window.addEventListener('keydown', (e) => { if (e.key === 'Enter') startJourney(); });
  // a scroll also begins, in case they skip the button
  window.addEventListener('wheel', () => { if (begin.classList.contains('show')) startJourney(); }, { once: true, passive: true });

  // ---------------- HUD ----------------
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <div class="brand">The World of Code<small>Every engineer is shaped by the world</small></div>
    <div class="sound on" id="sound"><i></i><i></i><i></i><i></i></div>
    <div class="world-caption" id="cap"></div>
    <div class="rail" id="rail"></div>
    <div class="scroll-hint" id="hint"><span>Scroll to travel</span><div class="track"></div></div>
    <div class="progress"><div class="fill" id="fill"></div></div>`;
  root.appendChild(hud);

  const cap = hud.querySelector('#cap');
  const rail = hud.querySelector('#rail');
  const fill = hud.querySelector('#fill');
  const hint = hud.querySelector('#hint');
  const soundBtn = hud.querySelector('#sound');

  // rail buttons
  WORLDS.forEach((w, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span class="lbl">${String(i + 1).padStart(2, '0')} · ${w.discipline}</span><span class="dot"></span>`;
    b.addEventListener('click', () => exp.goTo(i));
    rail.appendChild(b);
  });
  const railBtns = [...rail.children];

  soundBtn.addEventListener('click', () => {
    const on = sound.toggle();
    soundBtn.classList.toggle('on', on);
  });

  const renderCaption = (i) => {
    const w = WORLDS[i];
    cap.innerHTML = `
      <div class="idx">WORLD ${String(i + 1).padStart(2, '0')} / ${String(WORLDS.length).padStart(2, '0')}</div>
      <div class="name">${w.name}</div>
      <div class="discipline">${w.discipline}</div>
      <div class="tags">${w.tags.map((t) => `<span>${t}</span>`).join('')}</div>`;
    cap.classList.remove('caption-anim');
    void cap.offsetWidth; // restart animation
    cap.classList.add('caption-anim');
    railBtns.forEach((b, k) => b.classList.toggle('active', k === i));
    sound.setWorld(i);
  };

  exp.onWorld = renderCaption;
  renderCaption(0);

  // hide the scroll hint once travelling
  let scrolled = false;
  window.addEventListener('scroll', () => {
    if (!scrolled) { scrolled = true; hint.classList.add('gone'); }
  }, { passive: true });

  // continuous progress bar
  const tick = () => {
    fill.style.width = `${(exp.state.progress * 100).toFixed(2)}%`;
    requestAnimationFrame(tick);
  };
  tick();

  // fade the loading veil once the first frame is up
  requestAnimationFrame(() => {
    const veil = document.querySelector('.veil');
    if (veil) { veil.classList.add('hide'); setTimeout(() => veil.remove(), 900); }
  });
}

// typewriter for the intro terminal
function typeLines(container, lines, sound) {
  return new Promise((resolve) => {
    let li = 0;
    const nextLine = () => {
      if (li >= lines.length) { resolve(); return; }
      const spec = lines[li];
      const el = document.createElement('div');
      el.className = 'line' + (spec.c ? ' ' + spec.c : '');
      el.style.opacity = '1';
      container.appendChild(el);
      let ci = 0;
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      const type = () => {
        if (ci <= spec.t.length) {
          el.textContent = spec.t.slice(0, ci);
          el.appendChild(cursor);
          if (ci < spec.t.length && spec.t[ci] !== ' ') sound.tick && sound.tick();
          ci++;
          setTimeout(type, 18 + Math.random() * 40);
        } else {
          el.removeChild(cursor);
          li++;
          setTimeout(nextLine, spec.c === 'glow' ? 200 : 140);
        }
      };
      type();
    };
    nextLine();
  });
}
