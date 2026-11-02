/* ===== CATEGORÍAS · carrusel responsive (js/18-categorias.js) =====
   Escritorio (más de 900px): las seis categorías fijas; se agranda la que señalas.
   Móvil/tablet (900px o menos): se desliza y la activa siempre queda en el centro. */
(function () {
  var track = document.getElementById('cxTrack');
  if (!track) return;

  var START = 0;        /* categoría activa al cargar (0 = la primera) */
  var BREAKPOINT = 900; /* debe ser igual al max-width del CSS */

  var items = Array.prototype.slice.call(track.querySelectorAll('.cx-item'));
  var prev = document.getElementById('cxPrev');
  var next = document.getElementById('cxNext');
  var now = document.getElementById('cxNow');
  var tot = document.getElementById('cxTot');
  var bar = document.getElementById('cxBar');
  var mq = window.matchMedia('(max-width: ' + BREAKPOINT + 'px)');
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var idx = -1;
  tot.textContent = pad(items.length);

  /* marca la activa y actualiza contador, barra y flechas */
  function mark(i) {
    i = Math.max(0, Math.min(items.length - 1, i));
    if (i === idx) return;
    idx = i;
    items.forEach(function (el, k) {
      el.classList.toggle('is-active', k === i);
      el.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    now.textContent = pad(i + 1);
    bar.style.transform = 'scaleX(' + ((i + 1) / items.length).toFixed(3) + ')';
    prev.disabled = i === 0;
    next.disabled = i === items.length - 1;
  }

  /* móvil: lleva la categoría al centro del carrusel */
  function center(i, smooth) {
    var el = items[i];
    var left = el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
  }

  /* activa una categoría (y en móvil la centra) */
  function select(i, smooth) {
    i = Math.max(0, Math.min(items.length - 1, i));
    mark(i);
    if (mq.matches) center(i, smooth !== false);
  }

  /* la más cercana al centro del carrusel */
  function nearest() {
    var r = track.getBoundingClientRect();
    var c = r.left + r.width / 2, best = 0, d = Infinity;
    items.forEach(function (el, k) {
      var b = el.getBoundingClientRect();
      var dist = Math.abs(b.left + b.width / 2 - c);
      if (dist < d) { d = dist; best = k; }
    });
    return best;
  }

  prev.addEventListener('click', function () { select(idx - 1); });
  next.addEventListener('click', function () { select(idx + 1); });

  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); select(idx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select(idx - 1); }
  });

  items.forEach(function (el, k) {
    /* escritorio: al pasar el mouse se agranda */
    el.addEventListener('pointerenter', function (e) {
      if (!mq.matches && e.pointerType === 'mouse') mark(k);
    });
    /* teclado: al enfocar */
    el.addEventListener('focus', function () { select(k); });
    /* toque/clic: solo la activa (ya no abre ningún enlace) */
    el.addEventListener('click', function () { select(k); });
  });

  /* móvil: mientras deslizas, la activa es la que queda en el centro */
  var ticking = false;
  track.addEventListener('scroll', function () {
    if (!mq.matches || ticking) return;
    ticking = true;
    requestAnimationFrame(function () { mark(nearest()); ticking = false; });
  }, { passive: true });

  /* al girar o cambiar el tamaño de la pantalla */
  function relayout() {
    if (mq.matches) center(idx, false);
    else track.scrollLeft = 0;
  }
  window.addEventListener('resize', relayout);
  if (mq.addEventListener) mq.addEventListener('change', relayout);

  /* arranque */
  mark(START);
  relayout();
  window.addEventListener('load', relayout);
})();
