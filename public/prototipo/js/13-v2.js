/* =====================================================================
   StyleRadar · versión 2 (revisión UX/UI)
   Inicio sin scroll atrapado: categorías en cuadrícula, playlists en carrusel,
   tiendas con fachada, fundaciones con foto, probador estático y guía de funciones.
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {A, $, $$, esc, money, ini, P, STORES, FOUNDS, ICON, view, crumbs, vfoot, avail, visible, imgSrc} = X;
  const V2 = () => A.v2 || {};
  const DB = () => X.DB;
  const member = () => X.role() === 'user';

  /* ---------------- barra superior: «Crear cuenta» visible para invitados ---------------- */
  function navJoin(){
    const nr = $('.nav-right'); if (!nr) return;
    const g = !X.me(); let b = $('#navJoin');
    if (g && !b){ nr.insertAdjacentHTML('beforeend', '<button class="nav-join" id="navJoin" type="button" data-cursor="Crear">Crear cuenta</button>'); }
    if (!g && b) b.remove();
    const sh = $('#sheet'); if (sh){ let j = $('#sheetJoin', sh); if (g && !j) sh.insertAdjacentHTML('beforeend', '<a href="#" id="sheetJoin" class="auth-link">Crear cuenta</a>'); if (!g && j) j.remove(); }
  }
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    if (e.target.closest('#navJoin, #sheetJoin, [data-join-user]')){ e.preventDefault(); const sh = $('#sheet'); if (sh) sh.hidden = true; X.openSignup('user'); }
  });
  new MutationObserver(() => { navJoin(); drawTry(); }).observe(document.body, {attributes:true, attributeFilter:['data-role']});

  /* ---------------- categorías: seis tarjetas, sin scroll atrapado ---------------- */
  const CATS = [['formal','Formal','Sastrería, camisas y zapatos de cuero'], ['casual','Casual','Denim, punto y básicos'], ['urbana','Urbana','Oversize, cargo y sneakers'],
    ['deportivo','Sport','Ropa técnica para moverte'], ['leather','Leather','Chaquetas, bolsos y botas de cuero'], ['calzado','Calzado','Tenis, botas y mocasines']];
  function drawCats(){
    const g = $('#catGrid'); if (!g) return;
    const pool = Object.values(P).filter(p => visible(p) && avail(p) && imgSrc(p));
    g.innerHTML = CATS.map(([k, n, d]) => {
      const list = pool.filter(p => X.inCat(p, k));
      const th = list.slice(0, 3);
      return `<a class="cg-tile" href="#/categoria/${k}" data-cursor="Ver">
        <div class="cg-thumbs">${th.map(p => `<span><img src="${imgSrc(p)}" alt="" loading="lazy"></span>`).join('')}</div>
        <div class="cg-txt"><h3>${n}</h3><p>${d}</p><span class="cg-go">${list.length} prendas · Ver prendas <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
      </a>`;
    }).join('');
  }

  /* ---------------- playlists: carrusel dentro de la sección ---------------- */
  function plList(){
    const feat = DB().featured || (DB().featured = ['p3']);
    const all = Object.entries(DB().pl).filter(([, p]) => p.vis === 'Pública' && p.owner.type === 'user' && p.ids && p.ids.length);
    all.sort((a, b) => (feat.includes(b[0]) - feat.includes(a[0])) || (b[1].likes - a[1].likes));
    return all.map(([id, p]) => ({id, p, feat:feat.includes(id)}));
  }
  function drawPlaylists(){
    const tr = $('#plTrack'); if (!tr) return;
    const list = plList();
    tr.innerHTML = list.map(({id, p, feat}, i) => {
      const items = p.ids.map(x => P[x]).filter(Boolean);
      const ims = items.filter(imgSrc).slice(0, 4);
      const total = items.filter(avail).reduce((a, x) => a + x.price, 0);
      return `<a class="plx${feat ? ' feat' : ''}" href="#/playlist/${id}" data-cursor="Abrir" aria-label="Playlist ${esc(p.name)} de ${esc(p.owner.name)}">
        <div class="plx-cover" style="--h:${(i * 47) % 360}">${ims.map(x => `<span><img src="${imgSrc(x)}" alt="" loading="lazy"></span>`).join('')}
          <div class="plx-veil"></div>${feat ? '<span class="plx-feat">★ Destacada</span>' : i < 3 ? `<span class="plx-rank">Top ${i + 1}</span>` : ''}
          <div class="plx-title"><span class="lbl">Playlist de estilo</span><b>${esc(p.name)}</b></div>
          <span class="plx-play" aria-hidden="true">${ICON.play || '▶'}</span></div>
        <div class="plx-meta"><span class="plx-av">${ini(p.owner.name)}</span><div><b>${esc(p.owner.name)}</b><span>${items.length} prendas · ${money(total)}</span></div><em>♥ ${p.likes.toLocaleString('es-CO')}</em></div>
      </a>`;
    }).join('');
    updArrows();
  }
  const updArrows = () => { const tr = $('#plTrack'); if (!tr) return; const pv = $('#plPrev'), nx = $('#plNext'); if (!pv) return;
    pv.disabled = tr.scrollLeft < 8; nx.disabled = tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 8;
    const n = $('#plNow'); if (n){ const w = (tr.firstElementChild || {}).offsetWidth || 1; n.textContent = String(Math.min(tr.children.length, Math.round(tr.scrollLeft / (w + 18)) + 1)).padStart(2, '0'); const t = $('#plTot'); if (t) t.textContent = String(tr.children.length).padStart(2, '0'); } };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#plPrev, #plNext'); if (!b) return;
    const tr = $('#plTrack'); const w = (tr.firstElementChild || {}).offsetWidth || 300;
    tr.scrollBy({left:(b.id === 'plNext' ? 1 : -1) * (w + 18), behavior:X.reduce ? 'auto' : 'smooth'});
  });
  addEventListener('DOMContentLoaded', () => { const tr = $('#plTrack'); if (tr) tr.addEventListener('scroll', () => requestAnimationFrame(updArrows), {passive:true}); });
  X.markFeatured = drawPlaylists;

  /* ---------------- tiendas: fachada + datos del local ---------------- */
  function drawStores(){
    const g = $('#storeGrid2'); if (!g) return;
    const list = Object.values(STORES).filter(s => !s.hidden && s.verif === 'Verificada' && !['Vencida','Sin suscripción'].includes((s.sub || {}).estado));
    list.sort((a, b) => (X.storePhotos(b).length ? 1 : 0) - (X.storePhotos(a).length ? 1 : 0));
    g.innerHTML = list.slice(0, 6).map(s => { const ph = X.storePhotos(s)[0]; const n = X.storeItems(s.id).filter(p => p.status === 'publicada' && avail(p)).length;
      return `<article class="sg-card" data-sid="${s.id}">
        <a class="sg-img" href="#/tienda/${s.id}" data-cursor="Ver tienda">${ph ? `<img src="${ph}" alt="Fachada de ${esc(s.name)} en ${esc(s.barrio)}" loading="lazy">` : `<span class="sg-type">${esc(s.name)}</span>`}
          <span class="sg-open">Lun a sáb · 10 a 8</span><span class="sg-cat">${esc(s.cat)}</span></a>
        <div class="sg-b"><div class="sg-h"><h3>${esc(s.name)}</h3><span class="sg-rate">★ ${s.rating}<small> · ${s.reviews}</small></span></div>
          <p class="sg-dir">${ICON.pin}<span>${esc(s.dir)}<br><small>${esc(s.barrio)} · a ${s.d} · ${esc(s.walk)}</small></span></p>
          <p class="sg-hr">${ICON.clock}<span>${esc(s.hours)}<br><small>${n} prendas disponibles hoy</small></span></p>
          <div class="sg-a"><a class="btn btn-acc sm" href="#/tienda/${s.id}">Ver tienda</a><a class="btn btn-line sm" href="#/mapa?sel=${s.id}">${ICON.pin} Cómo llegar</a></div></div>
      </article>`; }).join('');
  }

  /* ---------------- fundaciones: foto real y a quién ayudan ---------------- */
  function drawFounds(){
    const g = $('#foundGrid'); if (!g) return;
    const list = Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa').slice(0, 4);
    g.classList.add('v2');
    g.innerHTML = list.map(f => { const x = (X.FD_EXTRA || {})[f.id] || {}; const ph = X.foundPhoto(f);
      return `<article class="fg-card">
        <a class="fg-img" href="#/fundacion/${f.id}" data-cursor="Conocer">${ph ? `<img src="${ph}" alt="Jornada de ${esc(f.short)}" loading="lazy">` : ''}<span class="fg-b">${esc(f.barrio)}</span></a>
        <div class="fg-body"><h3>${esc(f.name)}</h3><p>${esc(x.who || f.mission || '')}</p>
          <div class="fg-acc">${(f.accepts || []).slice(0, 3).map(a => `<span>${esc(a)}</span>`).join('')}</div>
          <div class="fg-a"><a class="btn btn-line sm" href="#/fundacion/${f.id}">Conocer la fundación</a><a class="btn btn-acc sm" href="#/vender?f=${f.id}">Donar</a></div></div>
      </article>`; }).join('');
  }

  /* ---------------- probador: vitrina estática ---------------- */
  const PIECES = [['camisa','Camisa y corbata','The Local Lab',165000,'Talla M'], ['saco','Saco y chaleco','Nómada Studio',395000,'Talla M'], ['abrigo','Abrigo largo de lana','Nómada Studio',420000,'Talla M'],
    ['pantalon','Pantalón de lana','Nómada Studio',210000,'Talla 32'], ['zapatos','Zapatos Oxford','Kicks Local',290000,'Talla 41'], ['bufanda','Bufanda de espiga','Segunda mano',38000,'Única'],
    ['maletin','Maletín de cuero','Nómada Studio',310000,'Única']];
  function drawTry(){
    const host = $('#pvShow'); if (!host) return;
    const F = (window.SR || {}).FIT_IMG || {}; const dressed = ($('#fitDressed') || {}).src || '';
    const total = PIECES.reduce((a, p) => a + p[3], 0);
    const m = member(), guest = !X.me();
    host.innerHTML = `
      <figure class="pv-fig"><img src="${dressed}" alt="Maniquí vestido con abrigo camel, saco, camisa con corbata, pantalón de lana y zapatos Oxford"><figcaption class="lbl">Look armado con 7 prendas de 3 tiendas y 1 de segunda mano</figcaption></figure>
      <div class="pv-side">
        <ol class="pv-list">${PIECES.map(([k, n, b, v, sz], i) => `<li><span class="pv-th">${F[k] ? `<img src="${F[k]}" alt="" loading="lazy">` : ''}</span><div><b>${n}</b><span class="${b === 'Segunda mano' ? 'reuse' : ''}">${b} · ${sz}</span></div><em>${money(v)}</em></li>`).join('')}</ol>
        <div class="pv-total"><span class="lbl">Total del look</span><b>${money(total)}</b></div>
        <div class="pv-cta">${guest ? `<button class="btn btn-acc" type="button" data-tryon>${ICON.lock} Inicia sesión para probártelo</button><button class="btn btn-line" type="button" data-join-user>Crear cuenta gratis</button>`
          : m ? `<a class="btn btn-acc" href="#/probador">${ICON.user} Arma tu look</a><a class="btn btn-line" href="#/probador?foto=1">${ICON.cam} Sube tu foto</a>` : ''}</div>
        <p class="pv-note">Combina prendas reales de las tiendas del radar y pruébalas sobre un maniquí o sobre tu propia foto.</p>
      </div>`;
  }

  /* ---------------- guía de funciones (lo que la revisión no encontraba) ---------------- */
  const FUNCS = [
    ['Descubrir', [
      ['spark', 'Feed personalizado', 'El inicio y el catálogo se ordenan con tus estilos y tallas.', '#/perfil/info', 'Elegir mis estilos'],
      ['user', 'Recomendaciones por tu perfil', 'Prendas elegidas por tu estilo, tus tallas y lo que guardas.', '#/catalogo', 'Ver recomendadas'],
      ['search', 'Búsqueda con tus palabras', 'Escribe «chaqueta negra de cuero talla M» y entendemos tipo, color y talla.', '#/catalogo?q=chaqueta%20negra%20de%20cuero', 'Probar búsqueda'],
      ['pin', 'Ordenar por distancia', 'Primero las prendas de las tiendas más cerca de tu barrio.', '#/catalogo?orden=cerca', 'Ordenar por cercanía'],
      ['shield', 'Ordenar por reputación', 'Primero las tiendas mejor calificadas.', '#/catalogo?orden=rep', 'Ver mejor calificadas'],
      ['grid', 'Prendas similares', 'Si no hay coincidencia exacta te mostramos las más parecidas.', '#/catalogo?q=vestido%20rojo%20de%20lentejuelas', 'Ver un ejemplo'],
    ]],
    ['Tiendas y mapa', [
      ['filter', 'Filtrar tiendas por categoría', 'En el mapa elige Formal, Sport, Calzado…', '#/mapa', 'Abrir el mapa'],
      ['map', 'Catálogo resumido desde el mapa', 'Toca una tienda del mapa para ver 4 prendas destacadas.', '#/mapa?sel=luna', 'Ver Luna Store en el mapa'],
      ['store', 'Novedades de la semana', 'Cada tienda muestra lo que publicó en los últimos 7 días.', '#/tienda/luna', 'Ver novedades de Luna Store'],
      ['cam', 'Fotos del local y cómo llegar', 'Fachada, dirección, horario y calificación de cada tienda.', '#tiendas', 'Ver tiendas'],
    ]],
    ['Alertas y segunda mano', [
      ['bell', 'Búsquedas guardadas con alerta', 'Te avisamos cuando llega una prenda que coincide con tu búsqueda.', '#/perfil/alertas', 'Mis alertas'],
      ['bag', 'Prendas de otros usuarios', 'Segunda mano publicada por la comunidad, con su estado.', '#/catalogo?origen=Segunda%20mano', 'Ver segunda mano'],
      ['chat', 'Chat con quien vende', 'Pregunta por talla, precio o estado desde la prenda.', '#/mensajes', 'Mis mensajes'],
      ['box', 'Coordinar la entrega por chat', 'Acuerda día y lugar sin llamadas; todo queda escrito.', '#/mensajes/c2', 'Ver un ejemplo'],
    ]]
  ];
  const fItem = ([ic, t, d, href, cta]) => `<a class="fx" href="${href}"><span class="fx-ic">${ICON[ic] || ICON.spark}</span><div><b>${t}</b><p>${d}</p><span class="fx-go">${cta} →</span></div></a>`;
  function drawFuncs(){
    const g = $('#funcGrid'); if (!g) return;
    g.innerHTML = FUNCS.map(([h, items]) => `<div class="fx-col"><h3 class="lbl">${h}</h3>${items.map(fItem).join('')}</div>`).join('');
  }
  function vFunciones(el){
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Guía de funciones'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc)">Guía</span><h1 class="v-title">Todo lo que<br>puedes hacer</h1><p class="v-lead">Cada función con un enlace directo para probarla.</p></div></div>
      <div class="fx-grid page">${FUNCS.map(([h, items]) => `<section class="fx-col"><h2 class="lbl">${h}</h2>${items.map(fItem).join('')}</section>`).join('')}</div>${vfoot()}`;
  }
  view('funciones', {fn:vFunciones, roles:['user','guest'], acc:'#48119A', title:'Guía de funciones'});

  /* ---------------- enganche con el inicio ---------------- */
  const L0 = X.landing;
  X.landing = () => { L0(); drawCats(); drawPlaylists(); drawStores(); drawFounds(); drawTry(); drawFuncs(); navJoin(); };
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/')) setTimeout(() => { drawPlaylists(); drawStores(); drawTry(); }, 60); });

  /* el color de acento ya no cambia al desplazarse por el inicio */
  const fixAcc = () => { if (!document.body.dataset.view) document.documentElement.style.setProperty('--acc', '#48119A'); };
  addEventListener('scroll', fixAcc, {passive:true});
})();
