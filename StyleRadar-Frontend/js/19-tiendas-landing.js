/* ===== TIENDAS · versión landing solo para visitantes (js/19-tiendas-landing.js) =====
   - Visitante (sin sesión): se ve el personaje con las tarjetas decorativas.
   - Usuario con sesión: se ve la sección original de tiendas, sin cambios.
   - Las fotos de las tarjetas decorativas se toman de las tarjetas reales (no hay rutas nuevas). */
(function () {
  var root = document.documentElement;

  /* SRX es la fuente de verdad, también para sesiones temporales en memoria. */
  function hasSession() {
    var auth = window.SRX;
    return !!(auth && auth.me() && auth.role());
  }

  function sync() { root.classList.toggle('sr-guest', !hasSession()); }

  /* copia las fotos reales de las tiendas a las tarjetas decorativas */
  function fillImages() {
    var real = document.querySelectorAll('#storeGrid2 img, #storeGrid img');
    var deco = document.querySelectorAll('#tiendas-landing img[data-store]');
    if (!real.length) return false;
    var done = 0;
    Array.prototype.forEach.call(deco, function (img, i) {
      var name = img.getAttribute('data-store').toLowerCase();
      var src = null;
      Array.prototype.forEach.call(real, function (r) {
        if (src) return;
        var card = r.closest('article, li, div[class*="card"], div[class*="store"]') || r.parentNode;
        if (card && card.textContent.toLowerCase().indexOf(name) > -1) src = r.currentSrc || r.src;
      });
      if (!src && real[i]) src = real[i].currentSrc || real[i].src;
      if (src) { img.src = src; done++; }
    });
    return done === deco.length;
  }

  /* "Tiendas" del menú/pie: llevan a la versión que esté visible */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#tiendas"]');
    if (!a || !root.classList.contains('sr-guest')) return;
    var t = document.getElementById('tiendas-landing');
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  sync();
  var tries = 0;
  var timer = setInterval(function () {
    if (tries < 40 && !fillImages()) tries++; else if (tries < 40) tries = 40;
  }, 700);
  window.addEventListener('sr:authchange', sync);
  window.addEventListener('storage', sync);
  window.addEventListener('hashchange', sync);
})();
