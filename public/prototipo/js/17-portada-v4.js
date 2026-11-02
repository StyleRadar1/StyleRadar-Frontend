/* =====================================================================
   Portada v4 · carrusel de categorías
   Construye #catRail con seis tarjetas de personaje y su navegación.
   ===================================================================== */
(() => {
  const CATS = [
    { k: 'formal', n: 'Formal', d: 'Sastrería y noches de gala', img: 'assets/img/general/r3.jpg', pos: '50% 30%' },
    { k: 'casual', n: 'Casual', d: 'Denim, punto y básicos', img: 'assets/img/general/ref.jpg', pos: '50% 20%' },
    { k: 'urbana', n: 'Urbana', d: 'Oversize, cargo y sneakers', img: 'assets/img/general/r1.jpg', pos: '50% 24%' },
    { k: 'deportivo', n: 'Sport', d: 'Ropa técnica para moverte', img: 'assets/img/general/r2.jpg', pos: '50% 26%' },
    { k: 'leather', n: 'Leather', d: 'Cuero con carácter', img: 'assets/img/categorias/leather.jpg', pos: '30% 50%' },
    { k: 'calzado', n: 'Calzado', d: 'Tenis, botas y mocasines', img: 'assets/img/general/lk3.jpg', pos: '50% 38%' }
  ];
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function build() {
    const rail = document.getElementById('catRail');
    if (!rail || rail.dataset.built === '1') return;
    rail.innerHTML = CATS.map((c, i) => `
      <a class="cat-card" href="#/categoria/${c.k}" data-cursor="Ver" aria-label="${c.n}: ${c.d}">
        <span class="cat-media"><img src="${c.img}" alt="${c.n}: ${c.d}" loading="${i < 2 ? 'eager' : 'lazy'}" style="object-position:${c.pos}"></span>
        <span class="cat-shade" aria-hidden="true"></span>
        <span class="cat-num lbl">${String(i + 1).padStart(2, '0')}</span>
        <span class="cat-body">
          <span class="cat-name">${c.n}</span>
          <span class="cat-d">${c.d}</span>
          <span class="cat-go">Ver prendas ${arrow}</span>
        </span>
      </a>`).join('');
    rail.dataset.built = '1';
    const tot = document.getElementById('catTot');
    if (tot) tot.textContent = String(CATS.length).padStart(2, '0');
    wire(rail);
    update(rail);
  }

  function step(rail) {
    const first = rail.firstElementChild;
    if (!first) return 1;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 16;
    return first.getBoundingClientRect().width + gap;
  }

  function update(rail) {
    const prev = document.getElementById('catPrev'), next = document.getElementById('catNext'), now = document.getElementById('catNow');
    if (prev) prev.disabled = rail.scrollLeft < 8;
    if (next) next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    if (now) {
      const idx = Math.min(CATS.length, Math.max(1, Math.round(rail.scrollLeft / step(rail)) + 1));
      now.textContent = String(idx).padStart(2, '0');
    }
  }

  function wire(rail) {
    const prev = document.getElementById('catPrev'), next = document.getElementById('catNext');
    const go = (dir) => rail.scrollBy({ left: dir * step(rail), behavior: 'smooth' });
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    let raf;
    rail.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => update(rail)); }, { passive: true });
    rail.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    addEventListener('resize', () => update(rail));
  }

  const start = () => build();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
