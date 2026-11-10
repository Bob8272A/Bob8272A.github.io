// Off-Ramp Arcade game kit: canvas setup, input, sound, menus and high scores
// shared by the small games in games/<slug>/index.html.
(function () {
  const el = (t, p, ...kids) => { const e = Object.assign(document.createElement(t), p || {}); kids.forEach((k) => e.append(k)); return e; };
  const CSS = `
html,body{margin:0;height:100%;background:#0b0f14;color:#f3f2ec;font:600 15px/1.4 "Overpass",system-ui,Arial,sans-serif;overflow:hidden;overscroll-behavior:none}
.k-root{display:flex;flex-direction:column;height:100%;user-select:none;-webkit-user-select:none;touch-action:none}
.k-bar{display:flex;align-items:center;gap:14px;height:40px;padding:0 12px;background:#11171e;border-bottom:1px solid rgba(243,242,236,.1);flex:none}
.k-bar b{font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k-bar span{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#a7b1b8;white-space:nowrap}
.k-bar span i{font-style:normal;color:#f5b524;font-weight:700}
.k-sp{flex:1}
@media(max-width:440px){.k-bar b{display:none}.k-bar{gap:10px}}
.k-bar button{background:none;border:1px solid rgba(243,242,236,.25);color:#f3f2ec;border-radius:7px;font:700 12px inherit;padding:4px 9px;cursor:pointer;white-space:nowrap}
.k-wrap{position:relative;flex:1;display:grid;place-items:center;min-height:0}
.k-wrap canvas{display:block;border-radius:6px;box-shadow:0 0 0 1px rgba(243,242,236,.1)}
.k-ov{position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,8,11,.78);text-align:center;padding:16px}
.k-ov[hidden]{display:none}
.k-ov h1{margin:0 0 6px;font-size:clamp(26px,6vw,44px);font-weight:900;text-transform:uppercase;letter-spacing:.02em;line-height:1}
.k-ov p{margin:6px auto;color:#d3dad6;max-width:44ch}
.k-ov .k-big{font-family:ui-monospace,Menlo,Consolas,monospace;color:#f5b524;font-size:18px;font-weight:700}
.k-ov button{margin-top:14px;border:0;cursor:pointer;font:900 18px/1 inherit;letter-spacing:.07em;text-transform:uppercase;padding:15px 26px 13px;border-radius:10px;background:#f5b524;color:#1b1404}
.k-ov button:hover{filter:brightness(1.08)}`;

  let actx = null, muted = false;
  try { muted = localStorage.getItem('ora_mute') === '1'; } catch (e) {}
  function beep(freq, dur, type, vol) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = type || 'square'; o.frequency.value = freq || 440;
      g.gain.setValueAtTime(vol || 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.1));
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + (dur || 0.1));
    } catch (e) {}
  }

  window.Kit = {
    rnd: (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    irnd: (a, b) => Math.floor(b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    beep,

    // ---- drawing helpers shared by the games ----
    rr(c, x, y, w, h, r, fill) { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } },
    grad(c, x0, y0, x1, y1, ...stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; },
    rgrad(c, x, y, r, ...stops) { const g = c.createRadialGradient(x, y, 0, x, y, r); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; },
    stars(c, W, H, t, n) { for (let i = 0; i < (n || 60); i++) { const x = (i * 137.5) % W, y = (i * 71.3 + (t || 0) * (4 + (i % 3) * 5)) % H; c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(i + (t || 0) * (1 + i % 3))); c.fillStyle = i % 7 ? '#dfe8ff' : '#ffd9a0'; c.fillRect(x, y, i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5); } c.globalAlpha = 1; },
    cloud(c, x, y, s, col) { c.fillStyle = col || 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x, y, 14 * s, 0, 7); c.arc(x + 16 * s, y - 8 * s, 17 * s, 0, 7); c.arc(x + 36 * s, y - 2 * s, 14 * s, 0, 7); c.arc(x + 18 * s, y + 5 * s, 15 * s, 0, 7); c.fill(); },
    tree(c, x, y, s) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 3 * s, y + 4 * s, 13 * s, 11 * s, 0, 0, 7); c.fill(); c.fillStyle = '#1f6b3c'; c.beginPath(); c.arc(x, y, 12 * s, 0, 7); c.fill(); c.fillStyle = '#2f8f52'; c.beginPath(); c.arc(x - 3 * s, y - 3 * s, 8 * s, 0, 7); c.fill(); c.fillStyle = '#49b06c'; c.beginPath(); c.arc(x - 5 * s, y - 5 * s, 4 * s, 0, 7); c.fill(); },
    // Top-down vehicle centred on x,y. ang 0 = facing up. kind: 'car' | 'truck' | 'bus' | 'police'
    car(c, x, y, w, h, col, ang, kind) {
      c.save(); c.translate(x, y); c.rotate(ang || 0);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.roundRect(-w / 2 + 3, -h / 2 + 4, w, h, w * 0.25); c.fill();
      c.fillStyle = '#0a0c0f'; for (const sy of [-0.3, 0.3]) { c.fillRect(-w / 2 - 2, sy * h - h * 0.09, 4, h * 0.18); c.fillRect(w / 2 - 2, sy * h - h * 0.09, 4, h * 0.18); }
      const glass = '#16283a';
      if (kind === 'truck') {
        c.fillStyle = '#d9dee2'; c.beginPath(); c.roundRect(-w / 2, -h / 2 + h * 0.3, w, h * 0.7, 3); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-w / 2, -h / 2 + h * 0.3 + i * h * 0.175); c.lineTo(w / 2, -h / 2 + h * 0.3 + i * h * 0.175); c.stroke(); }
        c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2 + 1, -h / 2, w - 2, h * 0.27, 5); c.fill();
        c.fillStyle = glass; c.fillRect(-w / 2 + 4, -h / 2 + h * 0.07, w - 8, h * 0.09);
      } else if (kind === 'bus') {
        c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-w / 2 + 4, -h / 2 + h * 0.1, w - 8, h * 0.82);
        c.fillStyle = glass; c.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.06);
        for (let i = 0; i < 6; i++) { c.fillRect(-w / 2 + 1.500, -h / 2 + h * (0.14 + i * 0.135), 3, h * 0.09); c.fillRect(w / 2 - 4.500, -h / 2 + h * (0.14 + i * 0.135), 3, h * 0.09); }
      } else {
        c.fillStyle = col; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, w * 0.28); c.fill();
        c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.roundRect(-w / 2 + 2, -h / 2 + 2, w * 0.3, h - 4, w * 0.2); c.fill();
        c.fillStyle = glass; c.beginPath(); c.moveTo(-w / 2 + 4, -h * 0.14); c.lineTo(-w / 2 + 6, -h * 0.27); c.lineTo(w / 2 - 6, -h * 0.27); c.lineTo(w / 2 - 4, -h * 0.14); c.fill();
        c.beginPath(); c.moveTo(-w / 2 + 5, h * 0.22); c.lineTo(-w / 2 + 6, h * 0.32); c.lineTo(w / 2 - 6, h * 0.32); c.lineTo(w / 2 - 5, h * 0.22); c.fill();
        c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.roundRect(-w / 2 + 4, -h * 0.14, w - 8, h * 0.36, 3); c.fill();
        if (kind === 'police') { c.fillStyle = '#e2362c'; c.fillRect(-w / 2 + 5, -2, w / 2 - 5, 5); c.fillStyle = '#3b82f6'; c.fillRect(0, -2, w / 2 - 5, 5); }
      }
      c.fillStyle = '#fff2b0'; c.fillRect(-w / 2 + 2, -h / 2, w * 0.24, 3); c.fillRect(w / 2 - 2 - w * 0.24, -h / 2, w * 0.24, 3);
      c.fillStyle = '#e2362c'; c.fillRect(-w / 2 + 2, h / 2 - 3, w * 0.24, 3); c.fillRect(w / 2 - 2 - w * 0.24, h / 2 - 3, w * 0.24, 3);
      c.restore();
    },

    // o: { id, title, w, h, help, low (lower score is better), unit, start(g), update(dt,g), draw(ctx,g), tap(x,y,g), swipe(dir,g), key(code,g) }
    game(o) {
      document.head.append(el('style', { textContent: CSS }));
      const W = o.w || 480, H = o.h || 640, key = 'ora_' + o.id;
      const sEl = el('i', { textContent: '0' }), bEl = el('i', { textContent: '-' });
      const mute = el('button', { type: 'button', textContent: muted ? 'Sound off' : 'Sound on' });
      const cv = el('canvas'), ctx = cv.getContext('2d');
      const ovT = el('h1'), ovM = el('p'), ovS = el('p', { className: 'k-big' }), ovB = el('button', { type: 'button' });
      const ov = el('div', { className: 'k-ov' }, el('div', null, ovT, ovM, ovS, ovB));
      const wrap = el('div', { className: 'k-wrap' }, cv, ov);
      const bar = el('div', { className: 'k-bar' }, el('b', { textContent: o.title }), el('span', { className: 'k-sp' }),
        el('span', null, (o.unit || 'Score') + ' ', sEl), el('span', null, 'Best ', bEl), mute);
      document.body.append(el('div', { className: 'k-root' }, bar, wrap));

      let scale = 1, state = 'menu', last = 0, best = null;
      let parts = [], shakeT = 0;
      try { const v = localStorage.getItem(key); if (v !== null && v !== '') best = +v; } catch (e) {}
      const down = new Set(), hits = new Set();
      const g = {
        W, H, ctx, score: 0, t: 0, ptr: { x: W / 2, y: H / 2, down: false }, beep,
        key: (...c) => c.some((k) => down.has(k)),
        hit: (...c) => c.some((k) => hits.has(k)),
        get left() { return down.has('ArrowLeft') || down.has('KeyA'); },
        get right() { return down.has('ArrowRight') || down.has('KeyD'); },
        get up() { return down.has('ArrowUp') || down.has('KeyW'); },
        get dn() { return down.has('ArrowDown') || down.has('KeyS'); },
        get playing() { return state === 'play'; },
        burst(x, y, col, n, spd) { for (let i = 0; i < (n || 10); i++) { const a = Math.random() * 6.283, v = (spd || 160) * (0.3 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.35 + Math.random() * 0.4, col, r: 1.5 + Math.random() * 2.5 }); } },
        shake(m) { shakeT = Math.max(shakeT, m || 6); },
        over(msg) { finish(msg || 'Game over'); },
        win(msg) { finish(msg || 'You win!'); },
      };
      const fmt = (v) => (v === null ? '-' : String(Math.round(v * 10) / 10));
      function finish(title) {
        if (state !== 'play') return;
        state = 'over';
        const s = g.score;
        const better = s > 0 && !g.noBest && (best === null || (o.low ? s < best : s > best));
        if (better) { best = s; try { localStorage.setItem(key, String(s)); } catch (e) {} }
        show(title, (o.unit || 'Score') + ': ' + fmt(s) + (better ? '  ·  New best!' : ''), 'Play again');
      }
      function show(title, big, btn) {
        ovT.textContent = title; ovS.textContent = big || ''; ovB.textContent = btn; ov.hidden = false;
        ovM.textContent = o.help || '';
        bEl.textContent = fmt(best);
      }
      function begin() {
        if (state === 'play') return;
        g.score = 0; g.t = 0; g.noBest = false; hits.clear(); parts = []; shakeT = 0;
        state = 'play'; ov.hidden = true; beep(660, 0.08);
        o.start && o.start(g);
      }
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
      let sx = 0, sy = 0;
      cv.addEventListener('pointerdown', (e) => {
        pos(e); g.ptr.down = true; sx = e.clientX; sy = e.clientY;
        try { cv.setPointerCapture(e.pointerId); } catch (x) {}
        if (state === 'play' && o.tap) o.tap(g.ptr.x, g.ptr.y, g);
        e.preventDefault();
      });
      cv.addEventListener('pointermove', pos);
      const up = (e) => {
        if (!g.ptr.down) return; g.ptr.down = false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (state === 'play' && o.swipe && Math.max(Math.abs(dx), Math.abs(dy)) > 24) o.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), g);
        if (state === 'play' && o.release) o.release(g.ptr.x, g.ptr.y, g);
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^(Arrow|Space|Enter|Backspace|Tab)/.test(e.code)) e.preventDefault();
        if (e.code === 'KeyM' && !o.typing) return toggleMute();
        if (state !== 'play') { if (e.code === 'Enter' || e.code === 'Space') begin(); return; }
        if (!down.has(e.code)) hits.add(e.code);
        down.add(e.code);
        if (o.key && !e.repeat) o.key(e.code, g, e.key);
      });
      addEventListener('keyup', (e) => down.delete(e.code));
      addEventListener('blur', () => down.clear());
      function toggleMute() {
        muted = !muted; mute.textContent = muted ? 'Sound off' : 'Sound on';
        try { localStorage.setItem('ora_mute', muted ? '1' : '0'); } catch (e) {}
      }
      mute.addEventListener('click', () => { toggleMute(); mute.blur(); });
      ovB.addEventListener('click', begin);
      addEventListener('resize', fit);
      fit(); show(o.title, '', 'Play');

      function frame(ts) {
        const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
        if (state === 'play') { g.t += dt; o.update && o.update(dt, g); }
        hits.clear();
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = o.bg || '#0b0f14'; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
        if (shakeT > 0.3) { ctx.translate((Math.random() - 0.5) * shakeT, (Math.random() - 0.5) * shakeT); shakeT *= 0.86; }
        if (state !== 'menu' || o.drawOnMenu) { try { o.draw && o.draw(ctx, g); } catch (e) { if (state !== 'menu') throw e; } }
        for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.l -= dt; ctx.globalAlpha = Math.max(0, Math.min(1, q.l * 3)); ctx.fillStyle = q.col || '#f5b524'; ctx.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2); }
        ctx.globalAlpha = 1; parts = parts.filter((q) => q.l > 0);
        ctx.restore();
        sEl.textContent = fmt(g.score);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      g.begin = begin;
      return g;
    },
  };
})();
