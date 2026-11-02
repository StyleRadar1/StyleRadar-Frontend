/* =====================================================================
   StyleRadar · versión 3 (revisión UX/UI, parte 2)
   Botón «Volver» en cada pantalla, menús desplegables en vidrio, icono de mensajes
   para tienda y fundación, mapa y vendedores en el inicio, «Cómo funciona» y manual de identidad.
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {A, $, $$, esc, money, ini, P, STORES, FOUNDS, ICON, view, crumbs, vfoot, emptyState, avail, visible, imgSrc, toast} = X;
  const V2 = () => A.v2 || {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------------- 1. «Volver» en todas las pantallas internas ---------------- */
  let steps = 0;
  addEventListener('hashchange', () => { steps++; });
  const goBack = () => { if (steps > 0){ steps -= 2; history.back(); } else location.hash = X.HOME[X.role() || 'user'] || '#inicio'; };
  window.SR_afterView = (el, name) => {
    if (name === 'admin') return;                       /* el panel ya tiene menú lateral y «Volver a …» en cada detalle */
    if (el.querySelector(':scope .v-back')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'v-back'; b.innerHTML = '<span aria-hidden="true">←</span> Volver';
    b.addEventListener('click', goBack);
    const cr = el.querySelector('.crumbs');
    if (cr){ const row = document.createElement('div'); row.className = 'v-backrow'; cr.parentNode.insertBefore(row, cr); row.appendChild(b); row.appendChild(cr); }
    else el.prepend(b);
    setTimeout(enhanceAll, 0);
  };

  /* ---------------- 2. Menús desplegables en vidrio (reemplazan la lista nativa) ---------------- */
  let openP = null;
  const closeP = () => { if (!openP) return; openP.p.remove(); openP.b.setAttribute('aria-expanded', 'false'); openP.w.classList.remove('open'); openP = null; };
  function openList(w, sel, btn){
    if (openP && openP.sel === sel){ closeP(); return; }
    closeP();
    const p = document.createElement('div'); p.className = 'gsel-p'; p.setAttribute('role', 'listbox');
    const opts = [...sel.options];
    p.innerHTML = opts.map((o, i) => `<button type="button" role="option" data-i="${i}" aria-selected="${i === sel.selectedIndex}" ${o.disabled ? 'disabled' : ''}>${i === sel.selectedIndex ? '<i aria-hidden="true">✓</i>' : '<i></i>'}<span>${esc(o.text)}</span></button>`).join('');
    document.body.appendChild(p);
    const r = btn.getBoundingClientRect(); const h = Math.min(300, p.scrollHeight);
    const below = innerHeight - r.bottom > h + 12 || r.top < h + 12;
    p.style.left = Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 190) - 8)) + 'px';
    p.style.minWidth = Math.max(r.width, 190) + 'px';
    p.style.top = (below ? r.bottom + 6 : r.top - h - 6) + 'px';
    p.addEventListener('click', e => { const o = e.target.closest('[data-i]'); if (!o) return; sel.selectedIndex = +o.dataset.i;
      sel.dispatchEvent(new Event('input', {bubbles:true})); sel.dispatchEvent(new Event('change', {bubbles:true})); sync(w); closeP(); btn.focus({preventScroll:true}); });
    p.addEventListener('keydown', e => { const items = $$('[data-i]:not([disabled])', p); const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown'){ e.preventDefault(); (items[i + 1] || items[0]).focus(); } if (e.key === 'ArrowUp'){ e.preventDefault(); (items[i - 1] || items.at(-1)).focus(); }
      if (e.key === 'Escape' || e.key === 'Tab'){ closeP(); btn.focus({preventScroll:true}); } });
    openP = {p, b:btn, w, sel}; btn.setAttribute('aria-expanded', 'true'); w.classList.add('open');
    const cur = p.querySelector('[aria-selected="true"]') || p.querySelector('[data-i]'); if (cur){ cur.focus({preventScroll:true}); cur.scrollIntoView({block:'nearest'}); }
  }
  const sync = w => { const sel = w._sel, b = w._btn; const o = sel.options[sel.selectedIndex]; const t = o ? o.text : ''; if (b._t !== t){ b._t = t; b.querySelector('span').textContent = t; } b.disabled = sel.disabled; };
  function enhance(sel){
    if (sel._g || sel.multiple || sel.closest('.gsel') || sel.closest('[data-nog]')) return; sel._g = 1;
    const w = document.createElement('span'); w.className = 'gsel'; sel.parentNode.insertBefore(w, sel); w.appendChild(sel);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gsel-b'; b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    const lab = sel.id && document.querySelector(`label[for="${sel.id}"]`); b.setAttribute('aria-label', (lab ? lab.textContent.trim() : sel.getAttribute('aria-label') || 'Elegir opción'));
    b.innerHTML = '<span></span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
    w.appendChild(b); w._sel = sel; w._btn = b; sel.tabIndex = -1;
    b.addEventListener('click', () => openList(w, sel, b));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); openList(w, sel, b); } });
    sel.addEventListener('change', () => sync(w));
    if (sel.id) $$(`label[for="${sel.id}"]`).forEach(l => l.addEventListener('click', e => { e.preventDefault(); b.focus(); }));
    sync(w);
  }
  function enhanceAll(){ $$('select').forEach(enhance); }
  setInterval(() => $$('.gsel').forEach(w => w._sel && sync(w)), 400);        /* valores cambiados por código */
  document.addEventListener('click', e => { if (openP && !e.target.closest('.gsel-p') && !e.target.closest('.gsel')) closeP(); }, true);
  addEventListener('scroll', e => { if (openP && !(e.target && e.target.closest && e.target.closest('.gsel-p'))) closeP(); }, true);
  addEventListener('resize', closeP);
  let mt = 0; new MutationObserver(() => { clearTimeout(mt); mt = setTimeout(enhanceAll, 30); }).observe(document.body, {childList:true, subtree:true});

  /* ---------------- 3. Mensajes en la barra superior (tienda y fundación) ---------------- */
  function navMsg(){
    const nr = $('.nav-right'); if (!nr) return;
    const r = X.role(); let a = $('#navMsg');
    if (r === 'store' || r === 'found'){
      if (!a){ nr.insertAdjacentHTML('afterbegin', `<a class="nav-bell nav-msg" id="navMsg" href="#/mensajes" aria-label="Mensajes" data-cursor="Mensajes">${ICON.chat}<i id="msgN"></i></a>`); a = $('#navMsg'); }
      const box = X.inbox ? X.inbox() : []; const n = box.filter(c => { const l = c.msgs[c.msgs.length - 1]; return l && !l.me; }).length;
      const i = $('#msgN'); i.textContent = n || ''; i.hidden = !n; a.setAttribute('aria-label', n ? `Mensajes, ${n} sin responder` : 'Mensajes');
    } else if (a) a.remove();
  }
  new MutationObserver(() => setTimeout(navMsg, 30)).observe(document.body, {attributes:true, attributeFilter:['data-role']});
  addEventListener('hashchange', () => setTimeout(navMsg, 80));

  /* ---------------- 4. El logo de la portada se desvanece con el título ---------------- */
  const fadeLogo = () => { const l = $('.hero-center .srlogo.hero'); if (!l) return; const p = clamp(scrollY / (innerHeight * .6));
    l.style.opacity = (1 - p).toFixed(3); l.style.transform = `translateY(${(-p * 60).toFixed(1)}px) scale(${(1 - p * .12).toFixed(3)})`;
    const sub = $('.hero-center .hero-sub'); if (sub) sub.style.opacity = (1 - p * 1.4).toFixed(3); };
  addEventListener('scroll', fadeLogo, {passive:true});

  /* ---------------- 5. Inicio: tiendas por categoría ---------------- */
  const SCATS = ['Todas', 'Casual', 'Formal', 'Deportiva', 'Vintage', 'Accesorios'];
  let scat = 'Todas';
  function storeFilter(){
    const host = $('#stFilter'); if (!host) return;
    host.innerHTML = SCATS.map(c => `<button type="button" class="chip" aria-pressed="${c === scat}" data-scat="${c}">${c}</button>`).join('');
    $$('.sg-card', $('#storeGrid2')).forEach(card => { const id = card.dataset.sid; const s = STORES[id]; const ok = scat === 'Todas' || (s && (s.cats || []).includes(scat)); card.hidden = !ok; });
    const any = $$('.sg-card:not([hidden])', $('#storeGrid2')).length; let e = $('#stEmpty'); if (!any){ if (!e){ $('#storeGrid2').insertAdjacentHTML('afterend', `<div id="stEmpty">${emptyState({icon:'store', title:'No hay tiendas de esa categoría todavía', text:'Prueba con otra categoría o mira todas en el mapa.', small:true, actions:[{label:'Ver todas', attr:'data-scat="Todas"'}]})}</div>`); } } else if (e) e.remove();
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-scat]'); if (!b) return; scat = b.dataset.scat; storeFilter(); });

  /* ---------------- 6. Inicio: el radar en el mapa (catálogo resumido sin salir) ---------------- */
  let mapSel = null;
  function drawMapSec(){
    const box = $('#lmBox'); if (!box) return;
    const list = Object.values(STORES).filter(s => !s.hidden && s.verif === 'Verificada' && s.map);
    if (!box.firstChild) box.innerHTML = X.mapSVG() + '<div id="lmPins"></div>';
    $('#lmPins').innerHTML = list.map(s => `<button type="button" class="lm-pin${mapSel === s.id ? ' on' : ''}" data-lm="${s.id}" style="left:${s.map[0] / 640 * 100}%;top:${s.map[1] / 560 * 100}%" aria-label="${esc(s.name)}, ${esc(s.barrio)}"><i></i><span>${esc(s.name)}</span></button>`).join('')
      + Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa' && f.map).map(f => `<a class="lm-pin found" href="#/fundacion/${f.id}" style="left:${f.map[0] / 640 * 100}%;top:${f.map[1] / 560 * 100}%" aria-label="${esc(f.name)}"><i></i><span>${esc(f.short)}</span></a>`).join('');
    const s = STORES[mapSel] || list[0]; if (!mapSel && s) mapSel = s.id;
    const pane = $('#lmPane'); if (!s){ pane.innerHTML = ''; return; }
    const items = X.storeItems(s.id).filter(p => p.status === 'publicada' && avail(p) && imgSrc(p)).sort((a, b) => (b.flag === 'nueva') - (a.flag === 'nueva')).slice(0, 4);
    pane.innerHTML = `<span class="lbl">${esc(s.cat)} · ${esc(s.barrio)} · a ${s.d}</span><h3>${esc(s.name)}</h3><p>${esc(s.dir)} · ${esc(s.hours)} · ★ ${s.rating}</p>
      <div class="lm-items">${items.length ? '' : '<p class="lm-empty">Esta tienda aún no tiene fotos de sus prendas destacadas. Ábrela para ver su catálogo.</p>'}${items.map(p => `<button type="button" data-open="${p.id}"><span><img src="${imgSrc(p)}" alt="" loading="lazy"></span><b>${esc(p.name)}</b><em>${money(p.price)}</em></button>`).join('')}</div>
      <div class="lm-a"><a class="btn btn-acc sm" href="#/tienda/${s.id}">Ver tienda</a><a class="btn btn-line sm" href="#/mapa?sel=${s.id}">Abrir el mapa completo</a></div>`;
    $$('.lm-pin', box).forEach(b => b.classList.toggle('on', b.dataset.lm === mapSel));
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-lm]'); if (!b) return; mapSel = b.dataset.lm; drawMapSec(); });

  /* ---------------- 7. Segunda vida: vendedores de la comunidad ---------------- */
  const slug = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function sellers(){
    const m = {};
    Object.values(P).filter(p => p.store === 'seg' && visible(p) && avail(p) && p.seller && !p.mine).forEach(p => { const k = slug(p.seller); (m[k] = m[k] || {name:p.seller, k, items:[]}).items.push(p); });
    return Object.values(m).sort((a, b) => b.items.length - a.items.length);
  }
  X.sellers = sellers;
  function drawSellers(){
    const host = $('#svSellers'); if (!host) return;
    const list = sellers();
    host.innerHTML = `<div class="svs-h"><div><span class="lbl">Perfiles públicos</span><h3>Vendedores de la comunidad</h3><p>Personas con perfil público y al menos una prenda a la venta.</p></div><a class="btn btn-line sm" href="#/catalogo?origen=Segunda%20mano">Ver toda la segunda mano</a></div>
      <div class="svs-g">${list.length ? list.slice(0, 6).map(v => `<a class="svs-c" href="#/vendedor/${v.k}"><span class="svs-av">${ini(v.name)}</span><div><b>${esc(v.name)}</b><span>${v.items.length} ${v.items.length === 1 ? 'prenda a la venta' : 'prendas a la venta'}</span></div>
        <span class="svs-th">${v.items.filter(imgSrc).slice(0, 3).map(p => `<img src="${imgSrc(p)}" alt="" loading="lazy">`).join('')}</span></a>`).join('')
        : emptyState({icon:'bag', title:'Aún no hay prendas de la comunidad', text:'Sé la primera persona en publicar.', small:true, actions:[{label:'Vender una prenda', href:'#/vender', kind:'btn-acc'}]})}</div>`;
  }
  function vVendedor(el, [k]){
    const v = sellers().find(x => x.k === k);
    if (!v){ el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Segunda vida', href:'#segunda-vida'}, {t:'Vendedor'})}${emptyState({icon:'user', title:'Este perfil ya no tiene prendas a la venta', text:'Puede que haya vendido todo o que su perfil ahora sea privado.', actions:[{label:'Ver segunda mano', href:'#/catalogo?origen=Segunda%20mano', kind:'btn-acc'}]})}${vfoot()}`; return; }
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Segunda vida', href:'#segunda-vida'}, {t:esc(v.name)})}
      <header class="pf-head"><div class="pf-av" aria-hidden="true">${ini(v.name)}</div><div><h1 class="pf-name">${esc(v.name)}</h1><div class="pf-sub lbl">Perfil público · ${v.items.length} ${v.items.length === 1 ? 'prenda a la venta' : 'prendas a la venta'} · Bogotá</div></div></header>
      <p class="v-lead">Escríbele desde cualquier prenda para preguntar por talla, estado o punto de entrega. Todo queda en tus mensajes.</p>
      <div class="p-grid">${v.items.map(p => X.pCard(p, {meta:esc(p.cond || 'Segunda mano')})).join('')}</div>${vfoot()}`;
  }
  view('vendedor', {fn:vVendedor, roles:['user','guest'], acc:'#48119A', title:'Vendedor'});

  /* ---------------- 8. «Cómo funciona»: el detalle de playlists, probador y segunda vida ---------------- */
  const HOW = [
    {id:'playlists', k:'Playlists de estilo', t:'Arma colecciones de looks y descubre las de la comunidad', steps:[
      ['Crea una playlist', 'Desde «Mi cuenta → Mis playlists» o con el botón «+» de cualquier prenda. Le pones nombre, descripción y eliges si es pública o privada.'],
      ['Agrega hasta 15 prendas', 'Mezcla prendas de distintas tiendas y de segunda mano. Si una se agota o se vende, queda marcada como no disponible y la playlist se conserva.'],
      ['Interactúa', 'Da «Me gusta» y guarda las playlists públicas de otras personas en tu perfil. Las que más interacción tienen pueden ser destacadas en el inicio.'],
      ['Pruébate la playlist', '«Probar el look» abre el probador con el maniquí para combinar esas prendas.']],
      go:[['Ver playlists', '#colecciones'], ['Mis playlists', '#/perfil/playlists']]},
    {id:'probador', k:'Probador virtual', t:'Mira cómo te queda antes de ir a la tienda', steps:[
      ['Elige sobre qué probar', 'Maniquí de mujer u hombre (según tu registro, lo cambias cuando quieras) o tu propia foto de cuerpo entero.'],
      ['Toca prendas reales', 'Camisas, pantalones, chaquetas, abrigos, zapatos y accesorios de las tiendas del radar. Cada una dice tienda, talla y precio, y el total se suma solo.'],
      ['Con tu foto', 'Sube una foto JPG, PNG o WEBP de hasta 8 MB, o usa la foto de ejemplo. El resultado es una visualización aproximada; puedes probar otra prenda o eliminar la foto.'],
      ['Guarda el look', 'Guárdalo en tu perfil o manda todas las prendas a tu wishlist para buscarlas en la tienda.']],
      go:[['Abrir el probador', '#/probador'], ['Probar con mi foto', '#/probador?foto=1']]},
    {id:'segunda', k:'Segunda vida', t:'Vende o dona la ropa que ya no usas', steps:[
      ['Publica la prenda', 'Fotos, talla, estado (Como nuevo, Muy bueno o Bueno) y una descripción corta.'],
      ['Vender', 'Pones el precio. Las personas te escriben por chat para preguntar y acordar el punto de entrega; tú la marcas como vendida o la retiras.'],
      ['Donar', 'Eliges una fundación cercana que reciba ese tipo de prenda y propones el día, la franja y el punto de entrega. La fundación acepta o rechaza la solicitud completa y confirma cuando la recibe.'],
      ['Sigue el estado', 'En «Mis publicaciones» ves si está activa, vendida, pendiente de la fundación, aceptada o recibida.']],
      go:[['Vender una prenda', '#/vender'], ['Donar a una fundación', '#/vender?f=abrigo'], ['Ver segunda mano', '#/catalogo?origen=Segunda%20mano']]}
  ];
  function vComo(el){
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Cómo funciona'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">Cómo funciona</span><h1 class="v-title">Lo que hace<br>diferente a StyleRadar</h1><p class="v-lead">Tres funciones que no encuentras en una tienda en línea común, explicadas paso a paso.</p></div></div>
      <nav class="how-nav">${HOW.map(h => `<a class="chip" href="#/funciones/${h.id}">${h.k}</a>`).join('')}</nav>
      ${HOW.map(h => `<section class="how" id="how-${h.id}"><div class="how-h"><span class="lbl">${h.k}</span><h2>${h.t}</h2></div>
        <ol class="how-steps">${h.steps.map(([a, b], i) => `<li><b>${i + 1}</b><div><h3>${a}</h3><p>${b}</p></div></li>`).join('')}</ol>
        <div class="how-go">${h.go.map(([t, href], i) => `<a class="btn ${i ? 'btn-line' : 'btn-acc'}" href="${href}">${t}</a>`).join('')}</div></section>`).join('')}${vfoot()}`;
  }
  view('funciones', {fn:vComo, roles:['user','guest'], acc:'#48119A', title:'Cómo funciona', anchor:{i:0, prefix:'how-'}});

  /* ---------------- 9. Manual de identidad ---------------- */
  function vMarca(el){
    const mark = ($('.nav .brand .srlogo') || {}).outerHTML || '';
    const PAL = [['Violeta', '#48119A', 'Acción y acento', 'Botones principales, enlaces activos y selecciones. Con texto blanco da 11,5:1 (AA y AAA). Nunca como texto sobre el fondo oscuro (1,3:1).'],
      ['Carbón', '#262626', 'Fondo base', 'Fondo de toda la plataforma. Deja que las fotos de ropa sean lo más visible. Con texto blanco da 15,1:1.'],
      ['Lavanda', '#B9B9CA', 'Texto secundario', 'Subtítulos, etiquetas y datos de apoyo. Sobre carbón da 7,8:1 (AAA).'],
      ['Arena', '#E8DCCB', 'Fondo de producto', 'Fondo de las fotos de prendas y avisos. Calidez de tienda física. Con texto carbón da 11,2:1.'],
      ['Blanco', '#FFFFFF', 'Texto principal', 'Títulos y cuerpo de texto sobre carbón y sobre violeta.']];
    const TYPE = [['Display', '900', 'clamp(46 px, 13,5 vw, 220 px)', 'StyleRadar', 'Nombre en la portada'], ['H1', '900', '46–120 px', 'Tiendas en el radar', 'Título de cada pantalla'],
      ['H2', '800', '44–112 px', 'Playlists de estilo', 'Título de sección'], ['H3', '700', '18–28 px', 'Publica tu prenda', 'Tarjetas y pasos'],
      ['Cuerpo', '400', '14–16 px', 'Encuentra la prenda en tu talla, cerca de ti.', 'Párrafos y descripciones'], ['Etiqueta', '500 · mayúsculas · +0,12 em', '10–12 px', 'VER TIENDA', 'Botones, chips y metadatos']];
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Manual de identidad'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">Manual de identidad</span><h1 class="v-title">La marca<br>StyleRadar</h1><p class="v-lead">Logo en tres versiones, paleta con su justificación y tipografía por tamaños. Todo lo que se ve en la plataforma sale de aquí.</p></div></div>
      <section class="mk-sec"><h2 class="sub-h">Logo</h2><p class="d">Un vestido que emite ondas de radar: moda + encontrar lo que buscas cerca de ti.</p>
        <div class="mk-logos">
          <figure class="mk-l dark"><div class="mk-sym">${mark}</div><figcaption><b>1 · Símbolo solo</b><span>Favicon, avatar de la app y botones pequeños.</span></figcaption></figure>
          <figure class="mk-l dark"><div class="mk-lock">${mark}<span>StyleRadar</span></div><figcaption><b>2 · Símbolo + nombre</b><span>Barra de navegación, portada e inicio de sesión.</span></figcaption></figure>
          <figure class="mk-l bw"><div class="mk-bw"><span class="on-w">${mark}<span>StyleRadar</span></span><span class="on-b">${mark}<span>StyleRadar</span></span></div><figcaption><b>3 · Fondo blanco y negro</b><span>Una sola tinta para impresos, sellos y documentos.</span></figcaption></figure>
        </div></section>
      <section class="mk-sec"><h2 class="sub-h">Paleta y justificación</h2><p class="d">Pocos colores para que el protagonista sea la ropa. Los contrastes cumplen WCAG 2.1 AA.</p>
        <div class="mk-pal">${PAL.map(([n, h, r, j]) => `<article><span class="sw" style="background:${h}"></span><b>${n}</b><code>${h}</code><em>${r}</em><p>${j}</p></article>`).join('')}</div></section>
      <section class="mk-sec"><h2 class="sub-h">Tipografía: Poppins</h2><p class="d">Geométrica y redonda, legible en celular y con pesos de 400 a 900 para jerarquía fuerte.</p>
        <div class="mk-type">${TYPE.map(([n, w, sz, ex, use]) => `<div class="mk-t"><span class="lbl">${n} · ${w} · ${sz}</span><div class="mk-ex mk-${n.toLowerCase()}">${ex}</div><em>${use}</em></div>`).join('')}</div></section>
      <section class="mk-sec"><h2 class="sub-h">Componentes</h2><div class="mk-comp"><button class="btn btn-acc" type="button">Botón principal</button><button class="btn btn-line" type="button">Botón secundario</button><span class="chip" aria-pressed="true">Chip elegido</span><span class="chip">Chip</span><span class="badge">Etiqueta</span></div>
        <p class="d">Todos los botones con esquinas de 12 px; chips y filtros en píldora; tarjetas y menús en vidrio (fondo carbón translúcido con desenfoque).</p></section>${vfoot()}`;
  }
  view('marca', {fn:vMarca, roles:['user','guest','store','found','admin'], acc:'#48119A', title:'Manual de identidad'});

  /* ---------------- enganche con el inicio ---------------- */
  const L0 = X.landing;
  X.landing = () => { L0(); storeFilter(); drawMapSec(); drawSellers(); setTimeout(() => { storeFilter(); navMsg(); }, 60); };
  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/')) setTimeout(() => { storeFilter(); drawSellers(); }, 80); });
  addEventListener('DOMContentLoaded', enhanceAll);
})();

/* v3.1 · fondo de foto difuminada para las vistas internas */
(() => { const s = (window.SR_ASSETS && SR_ASSETS.v2 || {}).bg_blur; if (s) document.documentElement.style.setProperty('--sr-photo-bg', `url("${new URL(s, document.baseURI).href}")`); })();
