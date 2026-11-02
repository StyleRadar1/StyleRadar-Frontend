/* ============================================================
   StyleRadar — Landing de bienvenida
   20-landing-radar.js  |  vanilla JS  |  sin dependencias
   - Hero con fotos que cambian solas.
   - Al bajar, las letras de "StyleRadar" se dispersan y desaparecen.
   - El landing solo explica; data-enter entra a la app y data-login
     abre el inicio de sesión.
   ============================================================ */
(function () {
  'use strict';

  function init() {
    var portal = document.getElementById('srPortal');
    if (!portal) return;

    // ── Mostrar el landing solo al llegar sin una vista de la app ──
    var alreadyDismissed = false;
    try { alreadyDismissed = sessionStorage.getItem('sr_portal_dismissed') === '1'; } catch (e) {}
    var hasHashView = location.hash && location.hash.length > 2 && location.hash !== '#inicio';
    if (alreadyDismissed || hasHashView) { portal.remove(); return; }
    document.body.classList.add('in-portal');

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var header = document.getElementById('peHeader');
    var hero = document.getElementById('peHero');
    var slidesBox = document.getElementById('peSlides');
    var shade = document.getElementById('peShade');
    var word = document.getElementById('peWord');
    var mark = portal.querySelector('.pe-mark-logo');
    var pill = document.getElementById('pePill');
    var actions = document.getElementById('peActions');
    var now = document.getElementById('peSlideNow');
    var mobileToggle = document.getElementById('peMobileToggle');
    var mobileMenu = document.getElementById('peMobileMenu');
    var brandHome = document.getElementById('peBrandHome');

    // ── Fotos del hero: cambian cada 5,5 s ──
    var slides = slidesBox ? [].slice.call(slidesBox.querySelectorAll('.pe-slide')) : [];
    var cur = 0, timer = null;
    function show(i) {
      if (!slides.length) return;
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); });
      if (now) now.textContent = ('0' + (cur + 1)).slice(-2);
    }
    if (slides.length > 1 && !reduce) timer = setInterval(function () { show(cur + 1); }, 5500);

    // ── Letras de la marca, una por una ──
    var letters = [];
    if (word) {
      var text = word.textContent;
      word.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var sp = document.createElement('span');
        sp.className = 'pe-ch';
        sp.textContent = text.charAt(i);
        sp.style.setProperty('--d', (i * 0.045).toFixed(3) + 's');
        // Al terminar la entrada se quita la animación CSS: si no, su 'fill-mode' tapa el efecto de scroll
        sp.addEventListener('animationend', function (ev) { ev.target.style.animation = 'none'; onScroll(); });
        word.appendChild(sp);
        letters.push(sp);
      }
    }
    // Cada letra sale a su propia velocidad y dirección
    var drift = letters.map(function (_, k) {
      var dir = k % 2 === 0 ? -1 : 1;
      return { y: 90 + (k % 3) * 70, x: dir * (12 + (k % 4) * 10), r: dir * (6 + (k % 3) * 5) };
    });

    // ── Efecto al bajar ──
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var top = portal.scrollTop;
        if (header) header.classList.toggle('is-scrolled', top > 40);
        if (reduce || !hero) return;
        var range = Math.max(1, hero.offsetHeight - portal.clientHeight);
        var p = Math.min(1, Math.max(0, top / range));
        letters.forEach(function (l, k) {
          var d = drift[k];
          var q = Math.min(1, p * 1.5);
          l.style.transform = 'translate(' + (d.x * q).toFixed(1) + 'px,' + (-d.y * q).toFixed(1) + 'px) rotate(' + (d.r * q).toFixed(1) + 'deg)';
          l.style.opacity = Math.max(0, 1 - p * 1.8).toFixed(3);
          l.style.filter = 'blur(' + (p * 10).toFixed(1) + 'px)';
        });
        if (mark) {
          mark.style.transform = 'translateY(' + (-p * 60).toFixed(1) + 'px) scale(' + (1 + p * 0.35).toFixed(3) + ')';
          mark.style.opacity = Math.max(0, 1 - p * 1.6).toFixed(3);
        }
        [pill, actions].forEach(function (el) {
          if (!el) return;
          el.style.opacity = Math.max(0, 1 - p * 2.6).toFixed(3);
          el.style.transform = 'translateY(' + (-p * 40).toFixed(1) + 'px)';
        });
        if (slidesBox) slidesBox.style.transform = 'scale(' + (1 + p * 0.12).toFixed(3) + ')';
        if (shade) shade.style.opacity = (0.55 + p * 0.4).toFixed(3);
      });
    }
    portal.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Salir del landing y entrar a la app ──
    function dismiss(after) {
      if (timer) clearInterval(timer);
      try { sessionStorage.setItem('sr_portal_dismissed', '1'); } catch (e) {}
      portal.classList.add('is-exiting');
      setTimeout(function () {
        portal.remove();
        document.body.classList.remove('in-portal');
        if (after) after();
      }, 480);
    }
    function enter() {
      dismiss(function () {
        if (window.SRX && window.SRX.route) window.SRX.route('inicio');
        else location.hash = '#inicio';
      });
    }
    function login() {
      dismiss(function () {
        setTimeout(function () { if (window.SRX && window.SRX.openAuth) window.SRX.openAuth(); }, 30);
      });
    }

    portal.querySelectorAll('[data-enter]').forEach(function (b) { b.addEventListener('click', enter); });
    portal.querySelectorAll('[data-login]').forEach(function (b) { b.addEventListener('click', login); });

    // ── Navegación dentro del landing ──
    portal.querySelectorAll('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var sec = document.getElementById(b.getAttribute('data-scroll'));
        if (sec) portal.scrollTo({ top: sec.offsetTop - 70, behavior: reduce ? 'auto' : 'smooth' });
        if (mobileMenu) { mobileMenu.setAttribute('hidden', ''); }
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
    if (brandHome) {
      brandHome.addEventListener('click', function (e) {
        e.preventDefault();
        portal.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function () {
        var open = mobileMenu.hasAttribute('hidden');
        if (open) mobileMenu.removeAttribute('hidden'); else mobileMenu.setAttribute('hidden', '');
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
