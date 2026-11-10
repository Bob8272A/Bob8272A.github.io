// Off-Ramp Arcade game kit: canvas setup, input (keyboard, mouse, touch buttons), sound,
// menus, pause, difficulty modes, particles and high scores, shared by games/<slug>/index.html.
(function () {
  const el = (t, p, ...kids) => { const e = Object.assign(document.createElement(t), p || {}); kids.forEach((k) => k != null && e.append(k)); return e; };
  const CSS = `
html,body{margin:0;height:100%;background:#0b0f14;color:#f3f2ec;font:600 15px/1.4 "Overpass",system-ui,Arial,sans-serif;overflow:hidden;overscroll-behavior:none}
.k-root{display:flex;flex-direction:column;height:100%;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent}
.k-bar{display:flex;align-items:center;gap:12px;height:40px;padding:0 12px;background:#11171e;border-bottom:1px solid rgba(243,242,236,.1);flex:none}
.k-bar b{font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k-bar span{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#a7b1b8;white-space:nowrap}
.k-bar span i{font-style:normal;color:#f5b524;font-weight:700}
.k-sp{flex:1}
@media(max-width:520px){.k-bar b{display:none}.k-bar{gap:9px}}
.k-bar button{background:none;border:1px solid rgba(243,242,236,.25);color:#f3f2ec;border-radius:7px;font:700 12px inherit;padding:4px 9px;cursor:pointer;white-space:nowrap}
.k-bar button:hover{border-color:#f5b524}
.k-wrap{position:relative;flex:1;display:grid;place-items:center;min-height:0}
.k-wrap canvas{display:block;border-radius:6px;box-shadow:0 0 0 1px rgba(243,242,236,.1);cursor:default}
.k-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,8,11,.74);backdrop-filter:blur(3px);text-align:center;padding:12px;overflow:auto}
.k-ov[hidden]{display:none}
.k-card{max-width:440px;width:100%}
.k-ov h1{margin:0 0 6px;font-size:clamp(26px,6vw,44px);font-weight:900;text-transform:uppercase;letter-spacing:.02em;line-height:1;text-shadow:0 3px 0 rgba(0,0,0,.4)}
.k-ov p{margin:8px auto;color:#d3dad6;max-width:46ch;font-size:14px}
.k-ov .k-big{font-family:ui-monospace,Menlo,Consolas,monospace;color:#f5b524;font-size:18px;font-weight:700}
.k-stats{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#a7b1b8}
.k-stats b{color:#f3f2ec}
.k-modes{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0 2px}
.k-modes button{border:1px solid rgba(243,242,236,.3);background:rgba(243,242,236,.06);color:#f3f2ec;border-radius:999px;font:800 13px inherit;padding:7px 14px;cursor:pointer;letter-spacing:.04em;text-transform:uppercase}
.k-modes button[aria-pressed="true"]{background:#f5b524;border-color:#f5b524;color:#1b1404}
.k-keys{display:grid;gap:4px;margin:10px auto 0;max-width:340px;text-align:left;font-size:13px}
.k-keys div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed rgba(243,242,236,.14);padding:2px 0}
.k-keys span:last-child{font-family:ui-monospace,Menlo,Consolas,monospace;color:#f5b524;text-align:right}
.k-go{margin-top:14px;border:0;cursor:pointer;font:900 18px/1 inherit;letter-spacing:.07em;text-transform:uppercase;padding:15px 30px 13px;border-radius:10px;background:#f5b524;color:#1b1404;box-shadow:0 4px 0 #a87608}
.k-go:hover{filter:brightness(1.08)}.k-go:active{transform:translateY(2px);box-shadow:0 2px 0 #a87608}
.k-pad{display:none;flex:none;justify-content:space-between;align-items:center;gap:10px;padding:8px 14px calc(8px + env(safe-area-inset-bottom));background:#11171e;border-top:1px solid rgba(243,242,236,.1)}
.k-touch .k-pad{display:flex}
.k-pad div{display:flex;gap:8px;align-items:center}
.k-pad .k-d{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,46px);gap:5px;align-items:stretch}
.k-pad button{min-width:58px;height:58px;border-radius:14px;border:1px solid rgba(243,242,236,.25);background:rgba(243,242,236,.08);color:#f3f2ec;font:900 15px inherit;letter-spacing:.04em;touch-action:none}
.k-pad .k-d button{min-width:0;height:100%;border-radius:12px}
.k-pad button.on{background:#f5b524;color:#1b1404;border-color:#f5b524}
.k-pad .k-a{background:rgba(245,181,36,.18);border-color:#f5b524;padding:0 16px}`;

  // ---------------- sound ----------------
  let actx = null, muted = false, noiseBuf = null;
  try { muted = localStorage.getItem('ora_mute') === '1'; } catch (e) {}
  function ac() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} return actx; }
  function tone(f0, f1, dur, type, vol, delay) {
    if (muted || !ac()) return;
    try {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + (delay || 0);
      o.type = type || 'square'; o.frequency.setValueAtTime(Math.max(20, f0), t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol || 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function noise(dur, vol, freq, delay) {
    if (muted || !ac()) return;
    try {
      if (!noiseBuf) { noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter(), t = actx.currentTime + (delay || 0);
      s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.setValueAtTime(freq || 1200, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, (freq || 1200) / 6), t + dur);
      g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(actx.destination); s.start(t); s.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const beep = (f, d, type, vol) => tone(f || 440, 0, d || 0.1, type, vol);
  const SFX = {
    click: () => tone(700, 500, 0.04, 'triangle', 0.07),
    tick: () => tone(1200, 0, 0.02, 'square', 0.03),
    jump: () => tone(280, 620, 0.14, 'square', 0.05),
    coin: () => { tone(988, 0, 0.07, 'square', 0.05); tone(1319, 0, 0.16, 'square', 0.05, 0.07); },
    shoot: () => tone(900, 180, 0.1, 'sawtooth', 0.045),
    hit: () => { noise(0.12, 0.14, 2200); tone(220, 90, 0.1, 'square', 0.05); },
    boom: () => { noise(0.5, 0.26, 1400); tone(130, 36, 0.45, 'sine', 0.2); },
    thud: () => { noise(0.08, 0.12, 500); tone(110, 60, 0.09, 'sine', 0.14); },
    power: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0, 0.1, 'square', 0.05, i * 0.06)),
    good: () => { tone(660, 0, 0.08, 'triangle', 0.08); tone(880, 0, 0.14, 'triangle', 0.08, 0.08); },
    bad: () => tone(200, 110, 0.22, 'sawtooth', 0.06),
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0, 0.18, 'triangle', 0.08, i * 0.15)),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0, 0.14, 'square', 0.05, i * 0.1)),
    level: () => [440, 554, 659, 880].forEach((f, i) => tone(f, 0, 0.12, 'triangle', 0.08, i * 0.08)),
    whoosh: () => noise(0.18, 0.07, 3000),
    bounce: () => tone(420, 640, 0.07, 'sine', 0.1),
    flip: () => { noise(0.04, 0.05, 4000); tone(520, 700, 0.05, 'triangle', 0.05); },
  };
  const sfx = (n) => { if (SFX[n]) SFX[n](); };

  const Kit = window.Kit = {
    rnd: (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    irnd: (a, b) => Math.floor(b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    hash: (a, b) => ((Math.sin(a * 91.7 + (b || 0) * 47.3) * 43758.5453) % 1 + 1) % 1,
    easeOut: (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3),
    beep, tone, noise, sfx,

    // ---- drawing helpers shared by the games ----
    rr(c, x, y, w, h, r, fill) { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } },
    grad(c, x0, y0, x1, y1, ...stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; },
    rgrad(c, x, y, r, ...stops) { const g = c.createRadialGradient(x, y, 0, x, y, Math.max(0.01, r)); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; },
    text(c, s, x, y, size, col, align, font) { c.font = '900 ' + (size || 16) + 'px ' + (font || 'system-ui,Arial,sans-serif'); c.textAlign = align || 'left'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, (size || 16) / 5); c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(s, x, y); c.fillStyle = col || '#f3f2ec'; c.fillText(s, x, y); c.textAlign = 'left'; },
    heart(c, x, y, s, col) { c.fillStyle = col || '#e2362c'; c.beginPath(); c.moveTo(x, y + 7 * s); c.bezierCurveTo(x - 13 * s, y - 2 * s, x - 5 * s, y - 11 * s, x, y - 4 * s); c.bezierCurveTo(x + 5 * s, y - 11 * s, x + 13 * s, y - 2 * s, x, y + 7 * s); c.fill(); },
    hearts(c, x, y, n, max) { for (let i = 0; i < (max || n); i++) { Kit.heart(c, x + i * 22, y, 1, i < n ? '#e2362c' : 'rgba(255,255,255,.16)'); if (i < n) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x + i * 22 - 4, y - 3, 2, 0, 7); c.fill(); } } },
    bar(c, x, y, w, h, f, col, back) { c.fillStyle = back || 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect(x, y, w, h, h / 2); c.fill(); if (f > 0) { c.fillStyle = col || '#f5b524'; c.beginPath(); c.roundRect(x + 1.5, y + 1.5, Math.max(h - 3, (w - 3) * Math.min(1, f)), h - 3, (h - 3) / 2); c.fill(); } },
    coin(c, x, y, r, t) { const w = Math.abs(Math.cos((t || 0) * 5)) * r + r * 0.18; c.fillStyle = '#a8760a'; c.beginPath(); c.ellipse(x, y + 1.5, w, r, 0, 0, 7); c.fill(); c.fillStyle = '#f5c531'; c.beginPath(); c.ellipse(x, y, w, r, 0, 0, 7); c.fill(); c.fillStyle = '#fff3b0'; c.beginPath(); c.ellipse(x - w * 0.3, y - r * 0.3, w * 0.25, r * 0.3, 0, 0, 7); c.fill(); },
    star(c, x, y, r, col, rot) { c.fillStyle = col || '#f5c531'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); },
    stars(c, W, H, t, n) { for (let i = 0; i < (n || 60); i++) { const x = (i * 137.5) % W, y = (i * 71.3 + (t || 0) * (4 + (i % 3) * 5)) % H; c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(i + (t || 0) * (1 + i % 3))); c.fillStyle = i % 7 ? '#dfe8ff' : '#ffd9a0'; c.fillRect(x, y, i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5); } c.globalAlpha = 1; },
    cloud(c, x, y, s, col) { c.fillStyle = col || 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x, y, 14 * s, 0, 7); c.arc(x + 16 * s, y - 8 * s, 17 * s, 0, 7); c.arc(x + 36 * s, y - 2 * s, 14 * s, 0, 7); c.arc(x + 18 * s, y + 5 * s, 15 * s, 0, 7); c.fill(); },
    tree(c, x, y, s) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 3 * s, y + 4 * s, 13 * s, 11 * s, 0, 0, 7); c.fill(); c.fillStyle = '#1f6b3c'; c.beginPath(); c.arc(x, y, 12 * s, 0, 7); c.fill(); c.fillStyle = '#2f8f52'; c.beginPath(); c.arc(x - 3 * s, y - 3 * s, 8 * s, 0, 7); c.fill(); c.fillStyle = '#49b06c'; c.beginPath(); c.arc(x - 5 * s, y - 5 * s, 4 * s, 0, 7); c.fill(); },
    // Top-down vehicle centred on x,y. ang 0 = facing up. kind: 'car' | 'truck' | 'bus' | 'police' | 'taxi' | 'van'
    car(c, x, y, w, h, col, ang, kind) {
      c.save(); c.translate(x, y); c.rotate(ang || 0);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect(-w / 2 + 3, -h / 2 + 4, w, h, w * 0.25); c.fill();
      c.fillStyle = '#0a0c0f'; for (const sy of [-0.3, 0.3]) { c.fillRect(-w / 2 - 2, sy * h - h * 0.09, 4, h * 0.18); c.fillRect(w / 2 - 2, sy * h - h * 0.09, 4, h * 0.18); }
      const glass = '#16283a';
      if (kind === 'truck') {
        c.fillStyle = '#d9dee2'; c.beginPath(); c.roundRect(-w / 2, -h / 2 + h * 0.3, w, h * 0.7, 3); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-w / 2, -h / 2 + h * 0.3 + i * h * 0.175); c.lineTo(w / 2, -h / 2 + h * 0.3 + i * h * 0.175); c.stroke(); }
        c.fillStyle = col; c.fillRect(-w / 2 + 3, -h / 2 + h * 0.52, w - 6, h * 0.12);
        c.beginPath(); c.roundRect(-w / 2 + 1, -h / 2, w - 2, h * 0.27, 5); c.fill();
        c.fillStyle = glass; c.fillRect(-w / 2 + 4, -h / 2 + h * 0.07, w - 8, h * 0.09);
      } else if (kind === 'bus') {
        c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-w / 2 + 4, -h / 2 + h * 0.1, w - 8, h * 0.82);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-w / 4, -h / 2 + h * 0.3, w / 2, h * 0.1); c.fillRect(-w / 4, -h / 2 + h * 0.62, w / 2, h * 0.1);
        c.fillStyle = glass; c.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.06);
        for (let i = 0; i < 6; i++) { c.fillRect(-w / 2 + 1.5, -h / 2 + h * (0.14 + i * 0.135), 3, h * 0.09); c.fillRect(w / 2 - 4.5, -h / 2 + h * (0.14 + i * 0.135), 3, h * 0.09); }
      } else {
        c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, kind === 'van' ? 5 : w * 0.28); c.fill();
        c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.roundRect(-w / 2 + 2, -h / 2 + 2, w * 0.3, h - 4, w * 0.2); c.fill();
        c.fillStyle = glass; c.beginPath(); c.moveTo(-w / 2 + 4, -h * 0.14); c.lineTo(-w / 2 + 6, -h * 0.27); c.lineTo(w / 2 - 6, -h * 0.27); c.lineTo(w / 2 - 4, -h * 0.14); c.fill();
        c.beginPath(); c.moveTo(-w / 2 + 5, h * 0.22); c.lineTo(-w / 2 + 6, h * 0.32); c.lineTo(w / 2 - 6, h * 0.32); c.lineTo(w / 2 - 5, h * 0.22); c.fill();
        c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.roundRect(-w / 2 + 4, -h * 0.14, w - 8, h * 0.36, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-w / 2 + 6, -h * 0.25, w * 0.2, 2);
        if (kind === 'police') { c.fillStyle = '#e2362c'; c.fillRect(-w / 2 + 5, -2, w / 2 - 5, 5); c.fillStyle = '#3b82f6'; c.fillRect(0, -2, w / 2 - 5, 5); }
        if (kind === 'taxi') { c.fillStyle = '#1b1404'; c.fillRect(-5, -3, 10, 6); c.fillStyle = '#fff3b0'; c.fillRect(-3.5, -1.5, 7, 3); }
      }
      c.fillStyle = '#fff2b0'; c.fillRect(-w / 2 + 2, -h / 2, w * 0.24, 3); c.fillRect(w / 2 - 2 - w * 0.24, -h / 2, w * 0.24, 3);
      c.fillStyle = '#e2362c'; c.fillRect(-w / 2 + 2, h / 2 - 3, w * 0.24, 3); c.fillRect(w / 2 - 2 - w * 0.24, h / 2 - 3, w * 0.24, 3);
      c.restore();
    },

    // o: { id, title, w, h, help, keys:[[label,keys]], modes:[[id,label]], pad:'lr'|'dpad', btns:[[code,label]], low, unit, typing,
    //      start(g), update(dt,g), draw(ctx,g), tap(x,y,g), release(x,y,g), rtap(x,y,g), hold(x,y,g), swipe(dir,g), key(code,g,ch) }
    game(o) {
      document.head.append(el('style', { textContent: CSS }));
      const W = o.w || 480, H = o.h || 640, key = 'ora_' + o.id;
      const sEl = el('i', { textContent: '0' }), bEl = el('i', { textContent: '-' });
      const mute = el('button', { type: 'button', textContent: muted ? 'Sound off' : 'Sound on' });
      const pauseB = el('button', { type: 'button', textContent: 'Pause' });
      const cv = el('canvas'), ctx = cv.getContext('2d');
      const ovT = el('h1'), ovS = el('p', { className: 'k-big' }), ovSt = el('div', { className: 'k-stats' }), ovModes = el('div', { className: 'k-modes' });
      const ovM = el('p'), ovK = el('div', { className: 'k-keys' }), ovB = el('button', { type: 'button', className: 'k-go' });
      const ov = el('div', { className: 'k-ov' }, el('div', { className: 'k-card' }, ovT, ovS, ovSt, ovModes, ovM, ovK, ovB));
      const wrap = el('div', { className: 'k-wrap' }, cv, ov);
      const bar = el('div', { className: 'k-bar' }, el('b', { textContent: o.title }), el('span', { className: 'k-sp' }),
        el('span', null, (o.unit || 'Score') + ' ', sEl), el('span', null, 'Best ', bEl), pauseB, mute);
      const pad = el('div', { className: 'k-pad' });
      const root = el('div', { className: 'k-root' }, bar, wrap, pad);
      document.body.append(root);

      let scale = 1, state = 'menu', last = 0, best = null, parts = [], pops = [], shakeT = 0, freezeT = 0, banner = null;
      let mode = o.modes ? o.modes[0][0] : '';
      try { const m = localStorage.getItem(key + '_mode'); if (o.modes && o.modes.some((q) => q[0] === m)) mode = m; } catch (e) {}
      const bkey = () => key + (o.modes && mode !== o.modes[0][0] ? '_' + mode : '');
      const loadBest = () => { best = null; try { const v = localStorage.getItem(bkey()); if (v !== null && v !== '') best = +v; } catch (e) {} };
      loadBest();
      const down = new Set(), hits = new Set();
      const g = {
        W, H, ctx, score: 0, t: 0, ptr: { x: W / 2, y: H / 2, down: false }, beep, tone, noise, sfx, stats: null,
        get mode() { return mode; },
        get best() { return best; },
        key: (...c) => c.some((k) => down.has(k)),
        hit: (...c) => c.some((k) => hits.has(k)),
        get left() { return down.has('ArrowLeft') || down.has('KeyA'); },
        get right() { return down.has('ArrowRight') || down.has('KeyD'); },
        get up() { return down.has('ArrowUp') || down.has('KeyW'); },
        get dn() { return down.has('ArrowDown') || down.has('KeyS'); },
        get playing() { return state === 'play'; },
        burst(x, y, col, n, spd, opt) { opt = opt || {}; for (let i = 0; i < (n || 10); i++) { const a = Math.random() * 6.283, v = (spd || 160) * (0.3 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opt.up || 0), l: (opt.life || 0.4) * (0.6 + Math.random()), col: Array.isArray(col) ? col[i % col.length] : col, r: (opt.size || 2.4) * (0.6 + Math.random()), gr: opt.grav === undefined ? 300 : opt.grav, round: opt.round }); } },
        pop(x, y, text, col, size) { pops.push({ x, y, text: String(text), col: col || '#fff3b0', l: 0.9, size: size || 16 }); },
        banner(text, sub, dur) { banner = { text, sub, l: dur || 1.6, d: dur || 1.6 }; },
        shake(m) { shakeT = Math.max(shakeT, m || 6); },
        freeze(s) { freezeT = Math.max(freezeT, s || 0.06); },
        over(msg) { finish(msg || 'Game over', false); },
        win(msg) { finish(msg || 'You win!', true); },
      };
      const fmt = (v) => (v === null || v === undefined ? '-' : String(Math.round(v * 10) / 10));
      function finish(title, won) {
        if (state !== 'play') return;
        state = 'over';
        const s = g.score;
        const better = s > 0 && !g.noBest && (best === null || (o.low ? s < best : s > best));
        if (better) { best = s; try { localStorage.setItem(bkey(), String(s)); } catch (e) {} }
        sfx(won ? 'win' : 'lose');
        setTimeout(() => { if (state === 'over') show(title, (o.unit || 'Score') + ': ' + fmt(s) + (better ? '  ·  New best!' : ''), 'Play again'); }, o.overDelay === undefined ? 650 : o.overDelay);
      }
      function show(title, big, btn) {
        ovT.textContent = title; ovS.textContent = big || ''; ovB.textContent = btn; ov.hidden = false;
        const menu = state !== 'pause';
        ovM.textContent = menu ? (o.help || '') : '';
        ovSt.replaceChildren(...(state === 'over' && g.stats ? g.stats.map(([a, b]) => el('span', null, a + ' ', el('b', { textContent: String(b) }))) : []));
        ovK.replaceChildren(...(menu && state !== 'over' ? (o.keys || []).map(([a, b]) => el('div', null, el('span', { textContent: a }), el('span', { textContent: b }))) : []));
        ovModes.replaceChildren(...(menu && o.modes ? o.modes.map(([id, label]) => {
          const b = el('button', { type: 'button', textContent: label }); b.setAttribute('aria-pressed', String(id === mode));
          b.addEventListener('click', () => { mode = id; try { localStorage.setItem(key + '_mode', id); } catch (e) {} loadBest(); sfx('click'); preview(); show(ovT.textContent, state === 'over' ? '' : ovS.textContent, ovB.textContent); });
          return b;
        }) : []));
        bEl.textContent = fmt(best);
      }
      function preview() { if (state === 'play' || state === 'pause') return; try { g.score = 0; g.t = 0; parts = []; pops = []; banner = null; o.start && o.start(g); g.ready = true; } catch (e) { g.ready = false; } }
      function begin() {
        if (state === 'pause') return resume();
        if (state === 'play') return;
        g.score = 0; g.t = 0; g.noBest = false; g.stats = null; hits.clear(); down.clear(); parts = []; pops = []; shakeT = 0; freezeT = 0; banner = null;
        state = 'play'; ov.hidden = true; ac(); sfx('click');
        o.start && o.start(g); g.ready = true;
      }
      function pause() { if (state !== 'play') return; state = 'pause'; down.clear(); show('Paused', '', 'Resume'); }
      function resume() { if (state !== 'pause') return; state = 'play'; ov.hidden = true; last = performance.now(); }
      function fit() {
        const r = wrap.getBoundingClientRect(), s = Math.max(0.1, Math.min(r.width / W, r.height / H));
        const d = Math.min(window.devicePixelRatio || 1, 2);
        cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
        cv.width = Math.round(W * s * d); cv.height = Math.round(H * s * d); scale = s * d;
      }
      function pos(e) {
        const r = cv.getBoundingClientRect();
        g.ptr.x = ((e.clientX - r.left) / r.width) * W; g.ptr.y = ((e.clientY - r.top) / r.height) * H;
      }
      let sx = 0, sy = 0, holdTimer = 0, held = false;
      cv.addEventListener('pointerdown', (e) => {
        pos(e); ac();
        if (e.button === 2) { if (state === 'play' && o.rtap) o.rtap(g.ptr.x, g.ptr.y, g); e.preventDefault(); return; }
        g.ptr.down = true; sx = e.clientX; sy = e.clientY; held = false;
        try { cv.setPointerCapture(e.pointerId); } catch (x) {}
        clearTimeout(holdTimer);
        if (o.hold) { const hx = g.ptr.x, hy = g.ptr.y; holdTimer = setTimeout(() => { if (g.ptr.down && state === 'play' && Math.hypot(g.ptr.x - hx, g.ptr.y - hy) < 12) { held = true; o.hold(hx, hy, g); } }, 420); }
        if (state === 'play' && o.tap && !o.hold) o.tap(g.ptr.x, g.ptr.y, g);
        e.preventDefault();
      });
      cv.addEventListener('pointermove', pos);
      const up = (e) => {
        if (!g.ptr.down) return; g.ptr.down = false; clearTimeout(holdTimer);
        const dx = e.clientX - sx, dy = e.clientY - sy, far = Math.max(Math.abs(dx), Math.abs(dy)) > 24;
        if (state !== 'play') return;
        if (o.hold && o.tap && !held && !far) o.tap(g.ptr.x, g.ptr.y, g);
        if (o.swipe && far) o.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), g);
        if (o.release) o.release(g.ptr.x, g.ptr.y, g);
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      function press(code, ch) { if (!down.has(code)) hits.add(code); down.add(code); if (o.key) o.key(code, g, ch || ''); }
      addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^(Arrow|Space|Enter|Backspace|Tab)/.test(e.code)) e.preventDefault();
        if (e.code === 'KeyM' && !o.typing) return toggleMute();
        if (e.code === 'Escape' || (e.code === 'KeyP' && !o.typing)) { if (state === 'play') pause(); else if (state === 'pause') resume(); return; }
        if (state !== 'play') { if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat && !(state === 'over' && ov.hidden)) begin(); return; }
        if (e.repeat) { return; }
        press(e.code, e.key);
      });
      addEventListener('keyup', (e) => down.delete(e.code));
      addEventListener('blur', () => { down.clear(); if (o.autoPause !== false) pause(); });
      function toggleMute() {
        muted = !muted; mute.textContent = muted ? 'Sound off' : 'Sound on';
        try { localStorage.setItem('ora_mute', muted ? '1' : '0'); } catch (e) {}
      }
      mute.addEventListener('click', () => { toggleMute(); mute.blur(); });
      pauseB.addEventListener('click', () => { if (state === 'play') pause(); else if (state === 'pause') resume(); pauseB.blur(); });
      ovB.addEventListener('click', begin);

      // on-screen buttons for touch devices
      const mkBtn = (code, label, cls) => {
        const b = el('button', { type: 'button', textContent: label, className: cls || '' });
        const on = (e) => { e.preventDefault(); ac(); b.classList.add('on'); if (state === 'play') press(code, ''); };
        const off = (e) => { e.preventDefault(); b.classList.remove('on'); down.delete(code); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        return b;
      };
      if (o.pad || o.btns) {
        const L = el('div'), R = el('div');
        if (o.pad === 'dpad') { const d = el('div', { className: 'k-d' }, el('span'), mkBtn('ArrowUp', '▲'), el('span'), mkBtn('ArrowLeft', '◀'), mkBtn('ArrowDown', '▼'), mkBtn('ArrowRight', '▶')); L.append(d); }
        else if (o.pad === 'lr') L.append(mkBtn('ArrowLeft', '◀'), mkBtn('ArrowRight', '▶'));
        else if (o.pad === 'ud') L.append(mkBtn('ArrowUp', '▲'), mkBtn('ArrowDown', '▼'));
        (o.btns || []).forEach(([code, label]) => R.append(mkBtn(code, label, 'k-a')));
        pad.append(L, R);
        const touchy = () => { if (!root.classList.contains('k-touch')) { root.classList.add('k-touch'); fit(); } };
        if (window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches) touchy();
        addEventListener('touchstart', touchy, { passive: true, once: true });
      }
      addEventListener('resize', fit);
      fit(); if (o.preview !== false) preview(); show(o.title, '', 'Play');

      function frame(ts) {
        let dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
        if (freezeT > 0) { freezeT -= dt; dt = 0; }
        if (state === 'play' && dt > 0) { g.t += dt; o.update && o.update(dt, g); }
        hits.clear();
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = o.bg || '#0b0f14'; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
        if (shakeT > 0.3) { ctx.translate((Math.random() - 0.5) * shakeT, (Math.random() - 0.5) * shakeT); shakeT *= 0.86; }
        if (g.ready) { ctx.save(); try { o.draw && o.draw(ctx, g); } catch (e) { if (state === 'play') { ctx.restore(); ctx.restore(); throw e; } } ctx.restore(); }
        const pdt = state === 'pause' ? 0 : dt;
        for (const q of parts) { q.x += q.vx * pdt; q.y += q.vy * pdt; q.vy += q.gr * pdt; q.l -= pdt; ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 3)); ctx.fillStyle = q.col || '#f5b524'; if (q.round) { ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); } else ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
        ctx.globalAlpha = 1; parts = parts.filter((q) => q.l > 0);
        ctx.textBaseline = 'alphabetic';
        for (const q of pops) { q.l -= pdt; q.y -= 34 * pdt; ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 2.5)); Kit.text(ctx, q.text, q.x, q.y, q.size, q.col, 'center'); }
        ctx.globalAlpha = 1; pops = pops.filter((q) => q.l > 0);
        if (banner) { banner.l -= pdt; const a = Math.min(1, banner.l * 3, (banner.d - banner.l) * 5); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = 'rgba(5,8,11,.55)'; ctx.fillRect(0, H / 2 - 48, W, banner.sub ? 92 : 70); Kit.text(ctx, banner.text, W / 2, H / 2, Math.min(40, W / 12), '#f5b524', 'center'); if (banner.sub) Kit.text(ctx, banner.sub, W / 2, H / 2 + 28, 15, '#f3f2ec', 'center'); ctx.globalAlpha = 1; } if (banner.l <= 0) banner = null; }
        ctx.restore();
        sEl.textContent = fmt(g.score);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      g.begin = begin; g.pause = pause;
      return g;
    },
  };
})();
