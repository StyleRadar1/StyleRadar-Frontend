/* StyleRadar · P5 · Carrusel de videos del landing
   Video al centro y los demás apilados a los lados. Al lado, la lista de pasos
   se marca según avanza el video. Se cambia con flechas, teclado y deslizando.
   El video nunca arranca solo: empieza al dar play y siempre en silencio.

   Para poner los videos reales (P4) basta con dejar los archivos en
   assets/video/ con los nombres de `src`. Mientras no existan, el carrusel
   corre una vista previa con el póster y los mismos pasos. */
(function () {
  'use strict';

  var VIDEOS = [
    {
      id: 'playlists', tag: 'Playlists', title: 'Arma tu playlist de estilo', dur: 63,
      src: 'assets/video/playlists.mp4', poster: 'assets/video/playlists.jpg',
      steps: [
        { t: 0, label: 'Abre Playlists desde el menú' },
        { t: 10, label: 'Mira los looks que arma la comunidad' },
        { t: 18, label: 'Agrega prendas de varias tiendas' },
        { t: 43, label: 'Guarda y comparte tu playlist' },
        { t: 52, label: 'Mira en el mapa dónde está cada prenda' }
      ]
    },
    {
      id: 'probador', tag: 'Probador', title: 'Pruébate la prenda antes de salir', dur: 63,
      src: 'assets/video/probador.mp4', poster: 'assets/video/probador.jpg',
      steps: [
        { t: 0, label: 'Elige una prenda del catálogo' },
        { t: 15, label: 'Sube tu foto o usa el maniquí' },
        { t: 29, label: 'Arma el look por capas' },
        { t: 45, label: 'Guarda el look o ve a la tienda' }
      ]
    },
    {
      id: 'nosotros', tag: 'Quiénes somos', title: 'Quiénes somos y por qué StyleRadar', dur: 59,
      src: 'assets/video/quienes-somos.mp4', poster: 'assets/video/quienes-somos.jpg',
      steps: [
        { t: 0, label: 'El problema de comprar moda en Bogotá' },
        { t: 15, label: 'Qué es StyleRadar' },
        { t: 30, label: 'El equipo detrás del proyecto' },
        { t: 44, label: 'Tiendas y fundaciones aliadas' }
      ]
    }
  ];
  var PREVIEW_SPEED = 3;  // la vista previa corre 3 veces más rápido que el video real

  var ICO = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 4 6M21 9l-4 6" fill="none"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none"/></svg>'
  };
  var fmt = function (s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function init() {
    var root = document.getElementById('vidCarousel');
    if (!root) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = 0, playing = false, previewT = 0, previewTimer = null, lastTick = 0;

    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carrusel');
    root.setAttribute('aria-label', 'Videos de StyleRadar');
    root.tabIndex = 0;
    root.innerHTML =
      '<div class="vc-stage">' +
        '<div class="vc-track">' + VIDEOS.map(function (v, i) {
          return '<figure class="vc-slide" data-i="' + i + '" role="group" aria-roledescription="video" aria-label="' + (i + 1) + ' de ' + VIDEOS.length + ': ' + v.title + '">' +
            '<video class="vc-video" muted playsinline preload="none" poster="' + v.poster + '" data-src="' + v.src + '"></video>' +
            '<img class="vc-poster" src="' + v.poster + '" alt="" loading="lazy">' +
            '<figcaption class="vc-cap"><span class="vc-tag">' + v.tag + '</span><b>' + v.title + '</b><em>' + fmt(v.dur) + '</em></figcaption>' +
            '<button type="button" class="vc-big" aria-label="Reproducir: ' + v.title + '">' + ICO.play + '</button>' +
          '</figure>';
        }).join('') + '</div>' +
        '<button type="button" class="vc-arrow vc-prev" aria-label="Video anterior">' + ICO.prev + '</button>' +
        '<button type="button" class="vc-arrow vc-next" aria-label="Video siguiente">' + ICO.next + '</button>' +
      '</div>' +
      '<aside class="vc-side">' +
        '<p class="vc-now"><span class="vc-count"></span><b class="vc-title"></b></p>' +
        '<div class="vc-bar">' +
          '<button type="button" class="vc-play" aria-label="Reproducir">' + ICO.play + '</button>' +
          '<div class="vc-prog" aria-hidden="true"><i></i></div>' +
          '<span class="vc-time">0:00</span>' +
          '<button type="button" class="vc-mute" aria-label="Activar sonido" aria-pressed="false">' + ICO.mute + '</button>' +
        '</div>' +
        '<p class="vc-note" hidden>Vista previa: el video todavía no está grabado.</p>' +
        '<ol class="vc-steps"></ol>' +
        '<div class="vc-dots" role="tablist" aria-label="Elegir video">' + VIDEOS.map(function (v, i) {
          return '<button type="button" role="tab" data-go="' + i + '" aria-label="' + v.tag + '"></button>';
        }).join('') + '</div>' +
      '</aside>' +
      '<p class="vc-live" aria-live="polite"></p>';

    var $ = function (s) { return root.querySelector(s); };
    var slides = [].slice.call(root.querySelectorAll('.vc-slide'));
    var stepsEl = $('.vc-steps'), playBtn = $('.vc-play'), muteBtn = $('.vc-mute');
    var progI = $('.vc-prog i'), timeEl = $('.vc-time'), note = $('.vc-note'), live = $('.vc-live');
    var vid = function () { return slides[cur].querySelector('video'); };
    var data = function () { return VIDEOS[cur]; };
    // ¿Este video ya tiene archivo? null = no se sabe, true / false después de probar
    var hasFile = VIDEOS.map(function () { return null; });

    /* ── Posiciones: centro, y los demás apilados a cada lado ── */
    function layout() {
      var n = VIDEOS.length;
      slides.forEach(function (el, i) {
        var d = i - cur;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        el.dataset.pos = d === 0 ? 'center' : (d < 0 ? 'left' : 'right');
        el.style.setProperty('--d', Math.abs(d));
        el.style.zIndex = String(10 - Math.abs(d));
        el.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
        el.querySelector('.vc-big').tabIndex = d === 0 ? 0 : -1;
      });
      [].forEach.call(root.querySelectorAll('.vc-dots button'), function (b, i) {
        b.setAttribute('aria-selected', String(i === cur));
      });
      $('.vc-count').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(VIDEOS.length).padStart(2, '0');
      $('.vc-title').textContent = data().title;
      stepsEl.innerHTML = data().steps.map(function (s, k) {
        return '<li><button type="button" data-step="' + k + '"><span class="vc-sn">' + (k + 1) + '</span><span class="vc-sl">' + s.label + '</span><time>' + fmt(s.t) + '</time></button></li>';
      }).join('');
      note.hidden = hasFile[cur] !== false;
      paintTime(0);
    }

    /* ── Tiempo y pasos ── */
    function now() { return hasFile[cur] ? (vid().currentTime || 0) : previewT; }
    function dur() { var v = vid(); return hasFile[cur] && isFinite(v.duration) ? v.duration : data().dur; }
    function paintTime(t) {
      var d = dur(), steps = data().steps, on = 0;
      steps.forEach(function (s, k) { if (t >= s.t) on = k; });
      [].forEach.call(stepsEl.children, function (li, k) {
        li.classList.toggle('is-on', k === on && (playing || t > 0));
        li.classList.toggle('is-done', k < on);
      });
      progI.style.transform = 'scaleX(' + Math.min(1, t / d).toFixed(4) + ')';
      timeEl.textContent = fmt(t) + ' / ' + fmt(d);
      var pv = slides[cur].querySelector('.vc-poster');
      if (pv) pv.style.setProperty('--zoom', (1 + Math.min(1, t / d) * 0.08).toFixed(3));
    }
    function setPlaying(p) {
      playing = p;
      root.classList.toggle('is-playing', p);
      playBtn.innerHTML = p ? ICO.pause : ICO.play;
      playBtn.setAttribute('aria-label', p ? 'Pausar' : 'Reproducir');
      slides[cur].classList.toggle('is-playing', p);
    }

    /* ── Vista previa (sin archivo de video todavía) ── */
    function previewStart() {
      note.hidden = false;
      clearInterval(previewTimer);
      lastTick = performance.now();
      previewTimer = setInterval(function () {
        var t = performance.now();
        previewT += (t - lastTick) / 1000 * PREVIEW_SPEED;
        lastTick = t;
        if (previewT >= data().dur) { previewT = data().dur; stop(); }
        paintTime(previewT);
      }, 120);
      setPlaying(true);
    }
    function previewStop() { clearInterval(previewTimer); previewTimer = null; }

    /* ── Reproducir / pausar ── */
    function play() {
      var v = vid(), i = cur;
      if (hasFile[i] === false) { previewStart(); return; }
      if (!v.src) { v.src = v.dataset.src; }
      v.muted = muteBtn.getAttribute('aria-pressed') !== 'true';
      var pr = v.play();
      setPlaying(true);
      if (pr && pr.catch) pr.catch(function () {
        if (i !== cur) return;
        hasFile[i] = false; setPlaying(false); previewStart();
      });
    }
    function stop() {
      previewStop();
      var v = vid();
      if (v && !v.paused) v.pause();
      setPlaying(false);
    }
    function toggle() { if (playing) stop(); else play(); }

    slides.forEach(function (el, i) {
      var v = el.querySelector('video');
      v.addEventListener('playing', function () { hasFile[i] = true; el.classList.add('has-video'); note.hidden = true; });
      v.addEventListener('timeupdate', function () { if (i === cur && hasFile[i]) paintTime(v.currentTime); });
      v.addEventListener('ended', function () { if (i === cur) setPlaying(false); });
      v.addEventListener('error', function () {
        hasFile[i] = false;
        if (i === cur && playing) { setPlaying(false); previewStart(); }
      });
      el.querySelector('.vc-big').addEventListener('click', function (e) { e.stopPropagation(); if (i === cur) toggle(); });
      el.addEventListener('click', function () { if (i !== cur) go(i - cur); });
    });

    /* ── Cambiar de video ── */
    function go(delta) {
      stop();
      var v = vid(); if (v && hasFile[cur]) v.currentTime = 0;
      previewT = 0;
      cur = (cur + delta + VIDEOS.length) % VIDEOS.length;
      layout();
      live.textContent = 'Video ' + (cur + 1) + ' de ' + VIDEOS.length + ': ' + data().title;
    }
    function seek(t) {
      if (hasFile[cur]) { vid().currentTime = t; }
      else previewT = t;
      paintTime(t);
      if (!playing) play();
    }

    $('.vc-prev').addEventListener('click', function () { go(-1); });
    $('.vc-next').addEventListener('click', function () { go(1); });
    playBtn.addEventListener('click', toggle);
    muteBtn.addEventListener('click', function () {
      var on = muteBtn.getAttribute('aria-pressed') !== 'true';   // on = con sonido
      muteBtn.setAttribute('aria-pressed', String(on));
      muteBtn.setAttribute('aria-label', on ? 'Silenciar' : 'Activar sonido');
      muteBtn.innerHTML = on ? ICO.sound : ICO.mute;
      var v = vid(); if (v) v.muted = !on;
    });
    stepsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]'); if (!b) return;
      seek(data().steps[+b.dataset.step].t);
    });
    root.querySelector('.vc-dots').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go - cur);
    });

    /* Teclado: con el foco dentro del carrusel */
    root.addEventListener('keydown', function (e) {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if ((e.key === ' ' || e.key === 'k') && e.target === root) { e.preventDefault(); toggle(); }
      else if (e.key === 'Home') { e.preventDefault(); go(-cur); }
      else if (e.key === 'End') { e.preventDefault(); go(VIDEOS.length - 1 - cur); }
    });

    /* Deslizar con el dedo (o arrastrar con el mouse) */
    var stage = $('.vc-stage'), sx = null, sy = 0;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        go(dx < 0 ? 1 : -1);
        stage.dataset.swiped = '1';
        setTimeout(function () { delete stage.dataset.swiped; }, 50);
      }
    });
    stage.addEventListener('pointercancel', function () { sx = null; });
    // Que un deslizamiento no cuente también como clic en el slide
    stage.addEventListener('click', function (e) { if (stage.dataset.swiped) { e.stopPropagation(); e.preventDefault(); } }, true);

    /* Si la sección sale de pantalla, se pausa */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (!en.isIntersecting && playing) stop(); });
      }, { threshold: 0.15 }).observe(root);
    }
    if (reduce) root.classList.add('vc-reduce');

    layout();
    window.SRVideos = { go: go, play: play, stop: stop, state: function () { return { cur: cur, playing: playing, t: now() }; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
