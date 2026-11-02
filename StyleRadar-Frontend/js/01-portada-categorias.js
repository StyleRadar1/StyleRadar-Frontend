/* Categorías: pila de cartas con giro (inspirada en skiper17).
   Cada carta queda fija en el centro; la siguiente sube encima y la anterior se encoge y rota.
   Cuando una carta queda completa aparecen su nombre (arriba a la izquierda) y «Ver prendas» (abajo a la derecha). */
addEventListener('DOMContentLoaded', () => {
  const stack = document.getElementById('c2Stack'); if (!stack) return;
  const IM = (window.SR_ASSETS || {}).cat2 || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATS = [['formal','Formal','Sastrería y noches de gala'], ['casual','Casual','Denim, punto y días largos'], ['urbana','Urbana','Oversize para caminar la ciudad'],
    ['deportivo','Sport','Ropa técnica para moverte'], ['leather','Leather','Cuero con carácter'], ['calzado','Calzado','Tenis, botas y mocasines']];
  const ROT = [-5, 4, -3, 5, -4, 3];
  stack.innerHTML = CATS.map(([k, n, d], i) => `<article class="c2-card" data-k="${k}" style="--i:${i}">
      <img src="${IM[k] || ''}" alt="${n}: ${d}" draggable="false"><span class="c2-shade"></span>
      <div class="c2-tl"><span class="lbl">${String(i + 1).padStart(2, '0')} · ${d}</span><h3>${n}</h3></div>
      <a class="c2-go" href="#/categoria/${k}" data-cursor="Ver"><span>Ver prendas</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg></a>
    </article>`).join('');
  const cards = [...stack.querySelectorAll('.c2-card')];
  document.getElementById('c2Tot').textContent = String(CATS.length).padStart(2, '0');
  const idx = document.getElementById('c2Idx');
  let last = -1;
  function frame(){
    requestAnimationFrame(frame);
    const r = stack.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const H = innerHeight;
    let cur = 0;
    const st = (H - cards[0].offsetHeight) / 2, sTop = r.top;
    const lt = cards.map(c => sTop + c.offsetTop);        /* posición sin la transformación */
    cards.forEach((c, i) => {
      const p = i < cards.length - 1 ? Math.min(1, Math.max(0, 1 - (lt[i + 1] - st) / (H * .85))) : 0;
      const settled = lt[i] <= st + H * .06;
      if (settled && p < .22) cur = i;
      const s = reduce ? 1 : 1 - p * .14, rot = reduce ? 0 : ROT[i] * p;
      c.style.transform = `scale(${s.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
      c.style.setProperty('--dim', (p * .6).toFixed(3));
      c.classList.toggle("full", settled && p < .22);
    });
    if (cur !== last){ last = cur; idx.textContent = String(cur + 1).padStart(2, '0'); }
  }
  requestAnimationFrame(frame);
});
