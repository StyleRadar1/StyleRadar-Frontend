/* =====================================================================
   StyleRadar · P16 · Nuevo inicio al entrar (persona usuaria)
   Reemplaza la página intermedia: quien inicia sesión llega aquí directo.
   Bloques: 1 saludo y buscador · 2 accesos rápidos · 3 en tu talla, cerca de ti
            4 sigue donde quedaste · 5 novedades (y aviso de plan si no es Radar+)
   La guía de primera vez (P15) se monta sobre estos bloques: cada uno lleva data-tour.
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {$, esc, money, ICON, P, STORES, DB, storeName, avail, visible, view, vfoot, emptyState, go} = X;
  const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

  /* prendas de la talla del usuario, de la más cercana a la más lejana */
  function nearInSize(n){
    const recs = (X.recommend ? X.recommend(40) : []).filter(o => o.why.some(w => /^talla /.test(w)));
    const pool = recs.length ? recs.map(o => o.p) : Object.values(P).filter(p => visible(p) && avail(p) && !p.mine);
    return pool.slice().sort((a, b) => (a.km || 99) - (b.km || 99)).slice(0, n);
  }

  /* lo último que la persona dejó a medias */
  function pending(u){
    const out = [];
    const look = (u.looks || [])[0];
    if (look) out.push({ic:'user', t:`Tu look de ${plural(look.items.length, 'prenda', 'prendas')}`, d:look.items.map(i => (X.CZI && X.CZI[i] || {}).name).filter(Boolean).slice(0, 3).join(' · ') || 'Guardado en el probador', href:'#/probador', cta:'Seguir armándolo'});
    const pls = Object.entries(DB.pl || {}).filter(([, p]) => p.owner && p.owner.email === (X.me() || {}).email);
    const pl = pls[0] || (u.saved || []).map(id => [id, (DB.pl || {})[id]]).find(([, p]) => p);
    if (pl) out.push({ic:'list', t:pl[1].name, d:`Playlist · ${plural((pl[1].ids || []).length, 'prenda', 'prendas')}`, href:'#/playlist/' + pl[0], cta:'Abrir'});
    const wish = (u.wish || []).filter(id => P[id]);
    if (wish.length) out.push({ic:'bag', t:'Tu wishlist', d:`${plural(wish.length, 'prenda guardada', 'prendas guardadas')} · ${plural(wish.filter(id => avail(P[id])).length, 'disponible', 'disponibles')}`, href:'#/perfil/wishlist', cta:'Ver'});
    return out.slice(0, 3);
  }

  function vInicio(el){
    const u = X.U(), a = X.acct() || {name:''};
    const name = (a.name || '').split(' ')[0] || 'de nuevo';
    const barrio = X.geo ? X.geo.loc() : (u.barrio || 'Chapinero');
    const fresh = X.mem.get('ini-new', false); if (fresh) X.mem.del('ini-new');
    const near = nearInSize(6);
    const todo = pending(u);
    const notifs = (u.notifs || []).slice(0, 3);
    const follow = (u.follow || []).filter(id => STORES[id]);
    const radarPlus = u.plan === 'plus';
    const sizes = u.sizes ? `${u.sizes.top} · ${u.sizes.bottom} · ${u.sizes.shoe}` : '';

    el.innerHTML = `
      <div class="ini">
        <section class="ini-hello" data-tour="saludo" aria-labelledby="iniT">
          <span class="lbl ini-k">${fresh ? 'Tu cuenta está lista' : 'Tu radar de hoy'} · ${esc(barrio)}</span>
          <h1 id="iniT" class="ini-t">${fresh ? 'Bienvenida o bienvenido,' : 'Hola,'} <b>${esc(name)}</b></h1>
          <form class="search ini-search" id="iniSearch" role="search" data-tour="buscador">
            <span class="s-ic">${ICON.search}</span>
            <input id="iniQ" type="search" placeholder="Busca una prenda, una talla o un barrio…" aria-label="Buscar prendas" autocomplete="off">
            <button class="btn btn-acc" type="submit">Buscar</button>
          </form>
        </section>

        <nav class="ini-quick" aria-label="Accesos rápidos" data-tour="accesos">
          ${[['#/probador', 'cam', 'Probador', 'Pruébate un look'], ['#/perfil/playlists', 'list', 'Mis playlists', 'Tus colecciones'],
             ['#/mapa', 'map', 'Mapa', 'Tiendas cerca'], ['#/catalogo?origen=Segunda%20mano', 'shuffle', 'Segunda vida', 'Ropa con historia']]
            .map(([h, ic, t, d]) => `<a class="ini-tile" href="${h}"><span class="ini-ic" aria-hidden="true">${ICON[ic] || ''}</span><b>${t}</b><span>${d}</span></a>`).join('')}
        </nav>

        <section class="ini-sec" data-tour="cerca" aria-labelledby="iniNearT">
          <div class="ini-h"><div><span class="lbl ini-k">${sizes ? 'Tallas ' + esc(sizes) : 'Para ti'}</span><h2 id="iniNearT" class="sub-h">En tu talla, cerca de ti</h2></div>
            <a class="linkish lbl" href="#/catalogo?orden=cerca">Ver todas →</a></div>
          ${near.length ? `<div class="ini-row">${near.map(p => X.pCard(p, {meta:`${STORES[p.store] ? esc(STORES[p.store].barrio) : 'Segunda mano'} · ${X.geo ? X.geo.fmt(p.km || 1) : ''}`})).join('')}</div>`
            : emptyState({icon:'search', title:'Todavía no hay prendas en tu talla cerca', text:'Revisa tus tallas en el perfil o busca en todo el catálogo.', small:true, actions:[{label:'Ver catálogo', href:'#/catalogo'}]})}
        </section>

        <div class="ini-two">
          <section class="ini-sec ini-card" data-tour="pendiente" aria-labelledby="iniTodoT">
            <div class="ini-h"><h2 id="iniTodoT" class="sub-h sm">Sigue donde quedaste</h2></div>
            ${todo.length ? `<ul class="ini-list">${todo.map(o => `<li><span class="ini-ic sm" aria-hidden="true">${ICON[o.ic] || ''}</span><div><b>${esc(o.t)}</b><span>${esc(o.d)}</span></div><a class="btn btn-line sm" href="${o.href}">${o.cta}</a></li>`).join('')}</ul>`
              : `<p class="ini-empty">Aún no tienes nada a medias. Arma un look en el probador o guarda prendas en tu wishlist y aparecerán aquí.</p><a class="btn btn-line sm" href="#/probador">Ir al probador</a>`}
          </section>

          <section class="ini-sec ini-card" data-tour="novedades" aria-labelledby="iniNewsT">
            <div class="ini-h"><h2 id="iniNewsT" class="sub-h sm">Novedades</h2><a class="linkish lbl" href="#/perfil/alertas">Alertas →</a></div>
            ${notifs.length ? `<ul class="ini-list">${notifs.map(n => `<li class="${n.read ? '' : 'unread'}"><span class="ini-ic sm" aria-hidden="true">${ICON[n.icon] || ICON.bell}</span><div><b>${esc(n.t)}</b><span>${esc(n.d)}${n.at ? ' · ' + esc(n.at) : ''}</span></div>${n.href ? `<a class="btn btn-line sm" href="${n.href}">Ver</a>` : ''}</li>`).join('')}</ul>`
              : '<p class="ini-empty">No tienes alertas nuevas.</p>'}
            ${follow.length ? `<div class="ini-follow"><span class="lbl">Tiendas que sigues</span><div class="chips">${follow.map(id => `<a class="chip" href="#/tienda/${id}">${esc(storeName(id))}</a>`).join('')}</div></div>` : ''}
            ${radarPlus ? '' : `<a class="ini-plan" href="#/perfil/suscripcion"><span class="ini-ic sm" aria-hidden="true">${ICON.lock}</span><div><b>Estás en el plan Radar</b><span>Con Radar+ te pruebas la ropa sobre tu foto y tienes alertas sin límite.</span></div><span class="lbl">Ver Radar+ →</span></a>`}
          </section>
        </div>
      </div>${vfoot()}`;

    $('#iniSearch', el).addEventListener('submit', e => { e.preventDefault(); const q = $('#iniQ', el).value.trim(); go('#/catalogo' + (q ? '?q=' + encodeURIComponent(q) : '')); });
  }

  view('inicio', {fn:vInicio, roles:['user'], acc:'#48119A', title:'Inicio'});
})();
