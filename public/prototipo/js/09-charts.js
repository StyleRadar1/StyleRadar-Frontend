/* =====================================================================
   StyleRadar · gráficos animados (inspirados en bklit: barras, barras
   horizontales, compuesto, medidor, línea en vivo, torta con tramas y
   anillos con leyenda). SVG + JS sin librerías.
   Uso: X.bk.bars({...}) devuelve HTML; se monta solo al entrar al DOM.
   ===================================================================== */
(() => {
  const X = window.SRX; const {esc, reduce} = X;
  const NS = 'http://www.w3.org/2000/svg';
  const EASE = t => { /* cubic-bezier(.85,0,.15,1) aproximada */ return t < .5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2; };
  const OUT = t => 1 - Math.pow(1 - t, 3);
  const C = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
  const FMT = {
    int: v => Math.round(v).toLocaleString('es-CO'),
    money: v => '$' + Math.round(v).toLocaleString('es-CO'),
    mill: v => '$' + (v / 1e6).toLocaleString('es-CO', {maximumFractionDigits:1}) + ' M',
    pct: v => Math.round(v) + '%',
    dec: v => v.toLocaleString('es-CO', {minimumFractionDigits:1, maximumFractionDigits:1})
  };
  const fmtOf = k => FMT[k] || FMT.int;
  const tween = (dur, fn, done, delay = 0) => {
    if (reduce){ fn(1); if (done) done(); return () => {}; }
    let s = 0, id = 0, stop = false;
    const tick = now => { if (stop) return; if (!s) s = now + delay; const p = Math.min(1, Math.max(0, (now - s) / dur)); fn(p); if (p < 1) id = requestAnimationFrame(tick); else if (done) done(); };
    id = requestAnimationFrame(tick); return () => { stop = true; cancelAnimationFrame(id); };
  };
  const niceMax = m => { if (m <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(m))); const f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs){ const v = attrs[k]; if (typeof v === 'string' && v.startsWith('var(') && /^(fill|stroke|stop-color)$/.test(k)) n.style.setProperty(k, v); else n.setAttribute(k, v); } if (parent) parent.appendChild(n); return n; };
  const crPath = pts => { if (!pts.length) return ''; if (pts.length < 3) return 'M' + pts.map(p => p.join(',')).join('L');
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++){ const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const t = .42 * 0.4 + .1; /* tensión suave (≈ catmullRom.alpha(.42)) */
      d += `C${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${p2[0] - (p3[0] - p1[0]) * t},${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`; }
    return d; };

  /* ---------- número que rueda (estilo NumberFlow) ---------- */
  function roll(node, text){
    const chars = String(text).split('');
    if (!node._roll){ node._roll = true; node.classList.add('bk-roll'); }
    const old = [...node.children];
    node.innerHTML = chars.map((ch, i) => /\d/.test(ch)
      ? `<span class="rd"><span class="rs" style="transform:translateY(${old[i] && old[i].dataset.d ? -old[i].dataset.d * 10 : 0}%)">${'0123456789'.split('').map(d => `<i>${d}</i>`).join('')}</span></span>`
      : `<span class="rc">${esc(ch)}</span>`).join('');
    [...node.children].forEach((c, i) => { if (!/\d/.test(chars[i])) return; c.dataset.d = chars[i]; const s = c.firstChild;
      requestAnimationFrame(() => requestAnimationFrame(() => { s.style.transform = `translateY(${-chars[i] * 10}%)`; })); });
    node.setAttribute('aria-label', text);
  }
  X.roll = roll;

  /* ---------- tooltip compartido por gráfico ---------- */
  const tipBox = host => { let t = host.querySelector('.bk-tip'); if (!t){ t = document.createElement('div'); t.className = 'bk-tip'; t.hidden = true; host.appendChild(t); } return t; };
  const tipShow = (host, t, html, x, y) => { t.innerHTML = html; t.hidden = false; const w = t.offsetWidth, hw = host.clientWidth;
    let tx = x + 16; if (tx + w > hw - 4) tx = x - w - 16; const ty = Math.max(0, Math.min(host.clientHeight - t.offsetHeight, y - t.offsetHeight / 2));
    t.style.transform = `translate(${tx}px,${ty}px)`; };
  const rowsHTML = (title, rows) => `${title ? `<b>${esc(title)}</b>` : ''}${rows.map(r => `<div class="r"><i style="background:${r.c}"></i><span>${esc(r.l)}</span><em>${esc(r.v)}</em></div>`).join('')}`;

  /* =====================================================================
     1) BARRAS VERTICALES (una o varias series)
     ===================================================================== */
  function mBars(host, cfg){
    const S = cfg.series, D = cfg.data, f = fmtOf(cfg.fmt), H = cfg.h || 240;
    const svg = el('svg', {class:'bk-svg', role:'img', 'aria-label':cfg.label || ''}, host);
    const pill = document.createElement('div'); pill.className = 'bk-pill'; pill.hidden = true; host.appendChild(pill);
    const tip = tipBox(host); let bars = [], grown = 0, idx = -1, W = 0;
    const M = {t:10, r:8, b:34, l:8};
    function draw(){
      W = host.clientWidth; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.innerHTML = '';
      const iw = W - M.l - M.r, ih = H - M.t - M.b, n = D.length, band = iw / n;
      const max = niceMax(Math.max(...D.flatMap(d => S.map(s => d[s.key])), 1));
      const g = el('g', {class:'bk-grid'}, svg);
      for (let i = 0; i <= 4; i++){ const y = M.t + ih - ih * i / 4; el('line', {x1:M.l, x2:W - M.r, y1:y, y2:y}, g); }
      const cross = el('line', {class:'bk-cross', x1:0, x2:0, y1:M.t, y2:M.t + ih, opacity:0}, svg);
      const gw = Math.min(band * .64, S.length * 22), bw = Math.max(4, gw / S.length - 4);
      bars = [];
      D.forEach((d, i) => S.forEach((s, j) => {
        const x = M.l + band * i + (band - gw) / 2 + j * (gw / S.length) + (gw / S.length - bw) / 2;
        const r = el('rect', {class:'bk-bar', x, width:bw, rx:bw / 2, fill:s.color || C[j], y:M.t + ih, height:0}, svg);
        bars.push({r, i, j, v:d[s.key], x, bw, base:M.t + ih, full:ih * d[s.key] / max});
      }));
      const lab = el('g', {class:'bk-xl'}, svg);
      D.forEach((d, i) => { const t = el('text', {x:M.l + band * i + band / 2, y:H - 12, 'text-anchor':'middle'}, lab); t.textContent = d.k; t.dataset.i = i; });
      const hit = el('rect', {x:M.l, y:M.t, width:iw, height:ih + M.b, fill:'transparent'}, svg);
      const set = p => bars.forEach(b => { const q = cfg.stagger === 0 ? p : Math.min(1, Math.max(0, p * (1 + .35) - b.i / n * .35)); const hh = Math.max(b.v > 0 ? Math.min(b.bw, b.full) : 0, b.full * EASE(q)); b.r.setAttribute('y', b.base - hh); b.r.setAttribute('height', hh); });
      if (grown) set(1);
      const move = e => { const r = svg.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; const i = Math.max(0, Math.min(n - 1, Math.floor((x - M.l) / band)));
        if (i !== idx){ idx = i; bars.forEach(b => b.r.classList.toggle('dim', b.i !== i)); [...lab.children].forEach(t => t.classList.toggle('on', +t.dataset.i === i)); }
        const cx = M.l + band * i + band / 2; cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('opacity', 1);
        pill.hidden = false; pill.textContent = D[i].k; pill.style.transform = `translate(${cx - pill.offsetWidth / 2}px,${H - 24}px)`;
        tipShow(host, tip, rowsHTML(D[i].k, S.map((s, j) => ({c:s.color || C[j], l:s.label, v:f(D[i][s.key])}))), cx, y); };
      const leave = () => { idx = -1; bars.forEach(b => b.r.classList.remove('dim')); [...lab.children].forEach(t => t.classList.remove('on')); cross.setAttribute('opacity', 0); pill.hidden = true; tip.hidden = true; };
      hit.addEventListener('pointermove', move); hit.addEventListener('pointerleave', leave);
      return set;
    }
    let set = draw();
    return {grow(){ tween(1100 + 300, p => set(p), () => grown = 1); }, redraw(){ set = draw(); }};
  }

  /* =====================================================================
     2) BARRAS HORIZONTALES
     ===================================================================== */
  function mHBars(host, cfg){
    const D = cfg.data, f = fmtOf(cfg.fmt), n = D.length, row = cfg.row || 38, H = n * row + 30, LW = cfg.lw || 118;
    const svg = el('svg', {class:'bk-svg', role:'img', 'aria-label':cfg.label || ''}, host); const tip = tipBox(host);
    let items = [], grown = 0;
    function draw(){
      const W = host.clientWidth; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.innerHTML = '';
      const iw = W - LW - 12, max = niceMax(Math.max(...D.map(d => d[1]), 1));
      const g = el('g', {class:'bk-grid v fade'}, svg);
      for (let i = 0; i <= 5; i++){ const x = LW + iw * i / 5; el('line', {x1:x, x2:x, y1:4, y2:H - 26}, g); }
      const ax = el('g', {class:'bk-xl'}, svg);
      for (let i = 0; i <= 5; i += 1){ const t = el('text', {x:LW + iw * i / 5, y:H - 8, 'text-anchor':i ? (i === 5 ? 'end' : 'middle') : 'start'}, ax); t.textContent = f(max * i / 5); }
      items = D.map((d, i) => { const y = 6 + i * row, bh = Math.min(22, row * .56);
        const t = el('text', {class:'bk-yl', x:LW - 12, y:y + row / 2 - 2, 'text-anchor':'end', 'dominant-baseline':'middle'}, svg); t.textContent = d[0].length > 18 ? d[0].slice(0, 17) + '…' : d[0];
        const track = el('rect', {class:'bk-track', x:LW, y:y + (row - bh) / 2 - 2, width:iw, height:bh, rx:4}, svg);
        const r = el('rect', {class:'bk-bar', x:LW, y:y + (row - bh) / 2 - 2, width:0, height:bh, rx:4, fill:d[2] || cfg.color || C[0]}, svg);
        const hit = el('rect', {x:0, y, width:W, height:row, fill:'transparent'}, svg);
        const it = {t, r, w:iw * d[1] / max, v:d[1], i};
        hit.addEventListener('pointermove', e => { items.forEach(o => { o.r.classList.toggle('dim', o !== it); o.t.classList.toggle('on', o === it); });
          const b = svg.getBoundingClientRect(); tipShow(host, tip, rowsHTML(d[0], [{c:d[2] || cfg.color || C[0], l:cfg.unit || 'Total', v:f(d[1])}]), LW + it.w, e.clientY - b.top); });
        hit.addEventListener('pointerleave', () => { items.forEach(o => { o.r.classList.remove('dim'); o.t.classList.remove('on'); }); tip.hidden = true; });
        return it; });
      const set = p => items.forEach(o => { const q = Math.min(1, Math.max(0, p * 1.3 - o.i / n * .3)); o.r.setAttribute('width', Math.max(0, o.w * EASE(q))); });
      if (grown) set(1); return set;
    }
    let set = draw();
    return {grow(){ tween(1200, p => set(p), () => grown = 1); }, redraw(){ set = draw(); }};
  }

  /* =====================================================================
     3) COMPUESTO: área + barras + línea sobre el mismo eje
     ===================================================================== */
  function mComposed(host, cfg){
    const D = cfg.data, A = cfg.area, B = cfg.bar, L = cfg.line, f = fmtOf(cfg.fmt), H = cfg.h || 280;
    const svg = el('svg', {class:'bk-svg', role:'img', 'aria-label':cfg.label || ''}, host); const tip = tipBox(host);
    const uid = 'cp' + Math.random().toString(36).slice(2, 7); let grown = 0;
    function draw(){
      const W = host.clientWidth; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H); svg.innerHTML = '';
      const M = {t:12, r:8, b:34, l:8}, iw = W - M.l - M.r, ih = H - M.t - M.b, n = D.length, band = iw / n;
      const max = niceMax(Math.max(...D.flatMap(d => [d[A.key], d[B.key], d[L.key]])) * 1.05);
      const X_ = i => M.l + band * i + band / 2, Y_ = v => M.t + ih - ih * v / max;
      const defs = el('defs', {}, svg);
      const clip = el('clipPath', {id:uid}, defs); const cr = el('rect', {x:0, y:0, width:grown ? W : 0, height:H}, clip);
      const lg = el('linearGradient', {id:uid + 'a', x1:0, x2:0, y1:0, y2:1}, defs);
      el('stop', {offset:'0%', 'stop-color':A.color || C[1], 'stop-opacity':.42}, lg); el('stop', {offset:'100%', 'stop-color':A.color || C[1], 'stop-opacity':.04}, lg);
      const g = el('g', {class:'bk-grid'}, svg); for (let i = 0; i <= 4; i++){ const y = M.t + ih - ih * i / 4; el('line', {x1:M.l, x2:W - M.r, y1:y, y2:y}, g); }
      const bw = Math.min(cfg.maxBar || 32, band * .9);
      const bars = D.map((d, i) => { const h = ih * d[B.key] / max; return {r:el('rect', {class:'bk-bar soft', x:X_(i) - bw / 2, width:bw, rx:4, y:M.t + ih, height:0, fill:B.color || C[2]}, svg), h, i}; });
      const ap = D.map((d, i) => [X_(i), Y_(d[A.key])]), lp = D.map((d, i) => [X_(i), Y_(d[L.key])]);
      const gc = el('g', {'clip-path':`url(#${uid})`}, svg);
      el('path', {d:crPath(ap) + `L${ap[n - 1][0]},${M.t + ih}L${ap[0][0]},${M.t + ih}Z`, fill:`url(#${uid}a)`}, gc);
      el('path', {d:crPath(ap), fill:'none', stroke:A.color || C[1], 'stroke-width':1.5, 'stroke-opacity':.7}, gc);
      el('path', {d:crPath(lp), fill:'none', stroke:L.color || C[0], 'stroke-width':2.5, 'stroke-linecap':'round'}, gc);
      const dA = el('circle', {class:'bk-dot', r:4, cx:-10, cy:-10}, svg), dL = el('circle', {class:'bk-dot', r:4, cx:-10, cy:-10}, svg);
      const ax = el('g', {class:'bk-xl'}, svg); const nt = Math.min(cfg.ticks || 8, n), step = Math.max(1, Math.round(n / nt));
      D.forEach((d, i) => { if (i % step) return; const t = el('text', {x:X_(i), y:H - 12, 'text-anchor':'middle'}, ax); t.textContent = d.k; });
      const hit = el('rect', {x:M.l, y:0, width:iw, height:H, fill:'transparent'}, svg);
      hit.addEventListener('pointermove', e => { const b = svg.getBoundingClientRect(); const i = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - b.left - M.l) / band)));
        bars.forEach(o => o.r.classList.toggle('hi', o.i === i));
        dA.setAttribute('cx', ap[i][0]); dA.setAttribute('cy', ap[i][1]); dL.setAttribute('cx', lp[i][0]); dL.setAttribute('cy', lp[i][1]);
        tipShow(host, tip, rowsHTML(D[i].full || D[i].k, [{c:A.color || C[1], l:A.label, v:f(D[i][A.key])}, {c:B.color || C[2], l:B.label, v:f(D[i][B.key])}, {c:L.color || C[0], l:L.label, v:f(D[i][L.key])}]), X_(i), e.clientY - b.top); });
      hit.addEventListener('pointerleave', () => { bars.forEach(o => o.r.classList.remove('hi')); [dA, dL].forEach(d => { d.setAttribute('cx', -10); d.setAttribute('cy', -10); }); tip.hidden = true; });
      const set = p => { bars.forEach(o => { const q = Math.min(1, Math.max(0, p * 1.35 - o.i / n * .35)); const h = o.h * EASE(q); o.r.setAttribute('y', M.t + ih - h); o.r.setAttribute('height', h); }); cr.setAttribute('width', W * EASE(p)); };
      if (grown) set(1); return set;
    }
    let set = draw();
    return {grow(){ tween(1300, p => set(p), () => grown = 1); }, redraw(){ set = draw(); }};
  }

  /* =====================================================================
     4) MEDIDOR con muescas
     ===================================================================== */
  function mGauge(host, cfg){
    const N = cfg.notches || 44, val = Math.max(0, Math.min(100, cfg.value)), S = 220;
    host.insertAdjacentHTML('beforeend', `<div class="bk-gauge"><svg viewBox="0 0 ${S} ${S}" role="img" aria-label="${esc(cfg.label || '')}: ${val}%"></svg>
      <div class="bk-gc"><span class="bk-gv"></span><span class="bk-gl">${esc(cfg.label || '')}</span></div></div>`);
    const svg = host.querySelector('svg'); const a0 = 135, span = 270, R1 = 72, R2 = 98, cx = S / 2, cy = S / 2 + 6;
    const act = Math.round(N * val / 100);
    const ns = [...Array(N)].map((_, i) => { const a = (a0 + span * i / (N - 1)) * Math.PI / 180;
      return el('line', {class:'bk-notch', x1:cx + Math.cos(a) * R1, y1:cy + Math.sin(a) * R1, x2:cx + Math.cos(a) * R2, y2:cy + Math.sin(a) * R2, 'stroke-width':Math.max(2.5, (2 * Math.PI * R2 * span / 360) / N * .52)}, svg); });
    const gv = host.querySelector('.bk-gv'); const f = fmtOf(cfg.fmt);
    gv.textContent = f(0);
    return {grow(){ roll(gv, f(cfg.center != null ? cfg.center : val));
      tween(1400, p => { const k = Math.round(act * OUT(p)); ns.forEach((n, i) => { n.classList.toggle('on', i < k); n.style.setProperty('--o', i < k ? (.55 + .45 * i / Math.max(1, act)) : ''); }); }); }, redraw(){}};
  }

  /* =====================================================================
     5) LÍNEA EN VIVO
     ===================================================================== */
  function mLive(host, cfg){
    const H = cfg.h || 230, WIN = cfg.window || 30, f = fmtOf(cfg.fmt), step = cfg.step || 1000;
    const svg = el('svg', {class:'bk-svg', role:'img', 'aria-label':cfg.label || ''}, host); const tip = tipBox(host);
    const badge = document.createElement('div'); badge.className = 'bk-live-v'; host.appendChild(badge);
    const now0 = Date.now(); let v = cfg.base || 100; const vol = cfg.vol || v * .02;
    const pts = [...Array(WIN + 2)].map((_, i) => { v = Math.max(cfg.min || 0, v + (Math.random() - .45) * vol); return {t:now0 - (WIN + 1 - i) * step, v}; });
    let lo = 0, hi = 1, raf = 0, alive = true, hover = null, W = 0;
    const M = {t:10, r:74, b:32, l:56};
    const push = () => { v = Math.max(cfg.min || 0, v + (Math.random() - (cfg.drift || .46)) * vol); pts.push({t:Date.now(), v}); if (pts.length > WIN + 3) pts.shift(); };
    let timer = setInterval(() => { if (!document.body.contains(host)){ clearInterval(timer); alive = false; cancelAnimationFrame(raf); return; } push(); }, step);
    const g = el('g', {class:'bk-grid'}, svg), yl = el('g', {class:'bk-yl2'}, svg), xl = el('g', {class:'bk-xl'}, svg);
    const mk = 'lv' + Math.random().toString(36).slice(2, 7);
    const defs = el('defs', {}, svg); const lg = el('linearGradient', {id:mk, x1:0, x2:1, y1:0, y2:0}, defs);
    el('stop', {offset:'0', 'stop-color':cfg.color || C[0], 'stop-opacity':0}, lg); el('stop', {offset:'.18', 'stop-color':cfg.color || C[0], 'stop-opacity':1}, lg);
    const path = el('path', {fill:'none', stroke:`url(#${mk})`, 'stroke-width':2.2, 'stroke-linecap':'round'}, svg);
    const dot = el('circle', {class:'bk-livedot', r:4}, svg); const halo = el('circle', {class:'bk-halo', r:4}, svg);
    const cross = el('line', {class:'bk-cross', opacity:0}, svg), hd = el('circle', {class:'bk-dot', r:4, cx:-10, cy:-10}, svg);
    const hms = t => new Date(t).toLocaleTimeString('es-CO', {hour12:false});
    function frame(){
      if (!alive) return; raf = requestAnimationFrame(frame);
      W = host.clientWidth; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('height', H);
      const iw = W - M.l - M.r, ih = H - M.t - M.b, now = Date.now(), t1 = now - step * .8, t0 = t1 - WIN * step;
      const vis = pts.filter(p => p.t >= t0 - step * 2);
      const mn = Math.min(...vis.map(p => p.v)), mx = Math.max(...vis.map(p => p.v)), pad = (mx - mn) * .25 + vol;
      lo += ((mn - pad) - lo) * .06; hi += ((mx + pad) - hi) * .06; if (!isFinite(lo) || hi - lo < 1e-6){ lo = mn - 1; hi = mx + 1; }
      const X_ = t => M.l + iw * (t - t0) / (t1 - t0), Y_ = y => M.t + ih - ih * (y - lo) / (hi - lo);
      g.innerHTML = ''; yl.innerHTML = ''; xl.innerHTML = '';
      for (let i = 0; i <= 4; i++){ const y = M.t + ih * i / 4; el('line', {x1:M.l, x2:W - M.r + 10, y1:y, y2:y}, g); const tx = el('text', {x:M.l - 10, y:y + 4, 'text-anchor':'end'}, yl); tx.textContent = f(hi - (hi - lo) * i / 4); }
      for (let i = 0; i <= 4; i++){ const tt = t0 + (t1 - t0) * i / 4; const tx = el('text', {x:X_(tt), y:H - 10, 'text-anchor':i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}, xl); tx.textContent = hms(tt); }
      const P = vis.map(p => [Math.max(M.l - 30, X_(p.t)), Y_(p.v)]);
      const last = pts[pts.length - 1], prev = pts[pts.length - 2];
      const k = Math.min(1, (now - last.t) / 400); const ly = Y_(prev.v + (last.v - prev.v) * OUT(k)), lx = X_(last.t);
      P[P.length - 1] = [lx, ly]; path.setAttribute('d', crPath(P.filter(p => p[0] <= lx + .1)));
      dot.setAttribute('cx', lx); dot.setAttribute('cy', ly); halo.setAttribute('cx', lx); halo.setAttribute('cy', ly);
      badge.textContent = f(last.v); badge.style.transform = `translate(${Math.min(W - badge.offsetWidth - 2, lx + 10)}px,${ly - badge.offsetHeight / 2}px)`;
      if (hover != null){ const hx = Math.max(M.l, Math.min(lx, hover.x)); let best = vis[0]; vis.forEach(p => { if (Math.abs(X_(p.t) - hx) < Math.abs(X_(best.t) - hx)) best = p; });
        const bx = X_(best.t), by = Y_(best.v); cross.setAttribute('x1', bx); cross.setAttribute('x2', bx); cross.setAttribute('y1', M.t); cross.setAttribute('y2', M.t + ih); cross.setAttribute('opacity', 1);
        hd.setAttribute('cx', bx); hd.setAttribute('cy', by); tipShow(host, tip, rowsHTML(hms(best.t), [{c:cfg.color || C[0], l:cfg.unit || 'Valor', v:f(best.v)}]), bx, by); }
    }
    svg.addEventListener('pointermove', e => { const b = svg.getBoundingClientRect(); hover = {x:e.clientX - b.left}; });
    svg.addEventListener('pointerleave', () => { hover = null; cross.setAttribute('opacity', 0); hd.setAttribute('cx', -10); tip.hidden = true; });
    return {grow(){ lo = Math.min(...pts.map(p => p.v)); hi = Math.max(...pts.map(p => p.v)); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); host.classList.add('bk-in'); }, redraw(){}};
  }

  /* =====================================================================
     6) TORTA CON TRAMAS
     ===================================================================== */
  function mPie(host, cfg){
    const D = cfg.data, f = fmtOf(cfg.fmt), S = cfg.size || 200, tot = D.reduce((a, d) => a + d[1], 0) || 1, R = S / 2 - 6, c = S / 2;
    host.insertAdjacentHTML('beforeend', `<div class="bk-pie"><svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${esc(cfg.label || '')}"></svg>
      <ul class="bk-leg sm">${D.map((d, i) => `<li data-i="${i}"><i style="background:${C[i % 5]}"></i><span>${esc(d[0])}</span><em>${Math.round(d[1] / tot * 100)}%</em></li>`).join('')}</ul></div>`);
    const svg = host.querySelector('svg'); const tip = tipBox(host); const defs = el('defs', {}, svg); const id = 'pp' + Math.random().toString(36).slice(2, 7);
    const OR = [['M0,6 L6,0', 6], ['M0,3 L6,3', 6], ['M3,0 L3,6', 6], ['M0,0 L8,8', 8]];
    D.forEach((d, i) => { const [pd, w] = OR[i % 4]; const pt = el('pattern', {id:id + i, width:w, height:w, patternUnits:'userSpaceOnUse'}, defs);
      el('path', {d:pd, stroke:C[i % 5], 'stroke-width':1.4, 'stroke-linecap':'square'}, pt); if (i % 4 === 0) el('path', {d:'M-1,1 L1,-1 M5,7 L7,5', stroke:C[i % 5], 'stroke-width':1.4}, pt); });
    const arc = (a1, a2, r) => { const g = .018; a1 += g; a2 -= g; if (a2 <= a1) return ''; const L = a2 - a1 > Math.PI ? 1 : 0;
      return `M${c},${c}L${c + r * Math.cos(a1)},${c + r * Math.sin(a1)}A${r},${r} 0 ${L} 1 ${c + r * Math.cos(a2)},${c + r * Math.sin(a2)}Z`; };
    const slices = D.map((d, i) => { const p = el('path', {class:'bk-slice', fill:`url(#${id + i})`, stroke:C[i % 5], 'stroke-width':1, 'stroke-opacity':.5}, svg); p.dataset.i = i; return p; });
    const lis = [...host.querySelectorAll('.bk-leg li')];
    const hl = i => { slices.forEach((s, j) => s.classList.toggle('dim', i != null && j !== i)); lis.forEach((l, j) => l.classList.toggle('dim', i != null && j !== i)); };
    const set = p => { let a = -Math.PI / 2; const end = -Math.PI / 2 + Math.PI * 2 * EASE(p);
      D.forEach((d, i) => { const a2 = a + Math.PI * 2 * d[1] / tot; slices[i].setAttribute('d', arc(a, Math.min(a2, end), R)); slices[i]._mid = (a + a2) / 2; a = a2; }); };
    slices.forEach((s, i) => { s.addEventListener('pointermove', e => { hl(i); const b = host.getBoundingClientRect(); tipShow(host, tip, rowsHTML(D[i][0], [{c:C[i % 5], l:cfg.unit || 'Total', v:`${f(D[i][1])} · ${Math.round(D[i][1] / tot * 100)}%`}]), e.clientX - b.left, e.clientY - b.top);
      s.style.transform = `translate(${Math.cos(s._mid) * 5}px,${Math.sin(s._mid) * 5}px)`; });
      s.addEventListener('pointerleave', () => { hl(null); tip.hidden = true; s.style.transform = ''; }); });
    lis.forEach((l, i) => { l.addEventListener('pointerenter', () => hl(i)); l.addEventListener('pointerleave', () => hl(null)); });
    set(0);
    return {grow(){ tween(1200, set); }, redraw(){}};
  }

  /* =====================================================================
     7) ANILLOS CON LEYENDA
     ===================================================================== */
  function mRing(host, cfg){
    const D = cfg.data, f = fmtOf(cfg.fmt), S = cfg.size || 190, c = S / 2, per = Math.min(17, (c - 4 - 44) / Math.max(1, D.length)), sw = per * .66, gap = per * .34;
    const tot = D.reduce((a, d) => a + d[1], 0);
    host.insertAdjacentHTML('beforeend', `<div class="bk-ring"><div class="bk-rw"><svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${esc(cfg.label || '')}"></svg>
      <div class="bk-rc"><span class="bk-rv"></span><span class="bk-rl">${esc(cfg.total || 'Total')}</span></div></div>
      <ul class="bk-leg">${D.map((d, i) => { const pc = d[2] != null ? d[2] : d[1] / (tot || 1) * 100; return `<li data-i="${i}"><div class="lr"><i style="background:${C[i % 5]}"></i><span>${esc(d[0])}</span><b>${f(d[1])}</b><em>${Math.round(pc)}%</em></div><div class="pb"><s style="--w:${pc}%;background:${C[i % 5]}"></s></div></li>`; }).join('')}</ul></div>`);
    const svg = host.querySelector('svg'), rv = host.querySelector('.bk-rv'), rl = host.querySelector('.bk-rl'), lis = [...host.querySelectorAll('.bk-leg li')];
    const rings = D.map((d, i) => { const r = c - sw / 2 - 3 - i * (sw + gap); const L = 2 * Math.PI * r; const pc = (d[2] != null ? d[2] : d[1] / (tot || 1) * 100) / 100;
      const tr = el('circle', {class:'bk-rtrack', cx:c, cy:c, r, 'stroke-width':sw}, svg);
      const a = el('circle', {class:'bk-rarc', cx:c, cy:c, r, 'stroke-width':sw, stroke:C[i % 5], 'stroke-dasharray':`0 ${L}`, transform:`rotate(-90 ${c} ${c})`}, svg);
      return {tr, a, L, pc, i}; });
    const show = i => { rings.forEach(o => o.a.classList.toggle('dim', i != null && o.i !== i)); lis.forEach((l, j) => l.classList.toggle('dim', i != null && j !== i));
      roll(rv, f(i == null ? tot : D[i][1])); rl.textContent = i == null ? (cfg.total || 'Total') : D[i][0]; };
    rings.forEach(o => { [o.a, o.tr].forEach(n => { n.addEventListener('pointerenter', () => show(o.i)); n.addEventListener('pointerleave', () => show(null)); }); });
    lis.forEach((l, i) => { l.addEventListener('pointerenter', () => show(i)); l.addEventListener('pointerleave', () => show(null)); });
    rv.textContent = f(0);
    return {grow(){ roll(rv, f(tot)); host.classList.add('bk-in');
      rings.forEach((o, k) => tween(1300, p => o.a.setAttribute('stroke-dasharray', `${o.L * o.pc * EASE(p)} ${o.L}`), null, k * 110)); }, redraw(){}};
  }

  /* ---------- montaje automático ---------- */
  const TYPES = {bars:mBars, hbars:mHBars, composed:mComposed, gauge:mGauge, live:mLive, pie:mPie, ring:mRing};
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target._bk && !e.target._grown){ e.target._grown = 1; e.target._bk.grow(); io.unobserve(e.target); } }), {threshold:.25});
  const ro = new ResizeObserver(es => es.forEach(e => { const n = e.target; if (n._bk && n._w && Math.abs(n.clientWidth - n._w) > 2){ n._w = n.clientWidth; n._bk.redraw(); } }));
  function mount(root = document){
    root.querySelectorAll('[data-bk]:not([data-bk-on])').forEach(n => {
      n.setAttribute('data-bk-on', ''); let cfg; try { cfg = JSON.parse(n.dataset.bk); } catch(e){ return; }
      const fn = TYPES[cfg.type]; if (!fn) return; n._bk = fn(n, cfg); n._w = n.clientWidth; io.observe(n); ro.observe(n);
    });
    root.querySelectorAll('.kpi b:not([data-rolled])').forEach(b => { b.setAttribute('data-rolled', ''); const t = b.textContent.trim(); if (!/\d/.test(t) || t.length > 14) return; b.textContent = t.replace(/\d/g, '0'); requestAnimationFrame(() => roll(b, t)); });
  }
  new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) mount(); }).observe(document.body, {childList:true, subtree:true});
  const make = type => (cfg = {}) => `<div class="bk bk-${type}${cfg.cls ? ' ' + cfg.cls : ''}" data-bk='${JSON.stringify(Object.assign({type}, cfg)).replace(/'/g, '&#39;')}'></div>`;
  X.bk = {bars:make('bars'), hbars:make('hbars'), composed:make('composed'), gauge:make('gauge'), live:make('live'), pie:make('pie'), ring:make('ring'), mount};
})();
