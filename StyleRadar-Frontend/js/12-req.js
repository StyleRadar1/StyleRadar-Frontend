/* =====================================================================
   StyleRadar · requerimientos (versión completa, 72 RF)
   ubicación y distancias · distintivos automáticos · catálogo con búsqueda
   interpretada, filtros múltiples y orden · mapa con categorías y catálogo
   resumido · alertas por coincidencia · feed y recomendaciones · destacados
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {$, $$, esc, norm, money, uid, today, ICON, P, STORES, FOUNDS, STYLES, COLORS, storeName, avail, visible, imgOf, thumbOf,
    toast, modal, emptyState, V, check, crumbs, vfoot, chipsPick, view, go} = X;
  const DB = () => X.DB; const save = () => X.save();
  const member = () => X.role() === 'user';
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };

  /* ---------------- ubicación ---------------- */
  const BARRIOS = (window.SR_BOG && SR_BOG.B) || {'Chapinero':[395, 320], 'Zona G':[410, 300], 'Chicó':[430, 235], 'Usaquén':[470, 170], 'Cedritos':[480, 120], 'Teusaquillo':[360, 392],
    'Centro':[362, 446], 'Suba':[300, 150], 'Engativá':[240, 262], 'Fontibón':[200, 340], 'Kennedy':[210, 430], 'Bosa':[160, 470]};
  const KM = window.SR_BOG ? .07 : .046;
  const geo = {
    BARRIOS,
    loc(){ const m = X.mem.get('loc', null); if (m && BARRIOS[m]) return m; const u = member() && X.U(); return u && BARRIOS[u.barrio] ? u.barrio : 'Chapinero'; },
    set(b){ if (!BARRIOS[b]) return; X.mem.set('loc', b); X.rebuild(); },
    xy(b){ return BARRIOS[b] || BARRIOS[geo.loc()]; },
    kmFrom(b, pt){ const a = geo.xy(b); return Math.max(.2, Math.hypot(a[0] - pt[0], a[1] - pt[1]) * KM); },
    fmt: km => (km < 10 ? km.toFixed(1) : Math.round(km)).toString().replace('.', ',') + ' km',
    walk: km => km < 1.6 ? `${Math.max(3, Math.round(km * 12))} min a pie` : `${Math.round(km * 2.6 + 5)} min en carro`,
    label: b => BARRIOS[b] ? b : 'tu ubicación',
    accepts(f, cat){
      if (!cat) return true;
      const acc = norm(f.accepts.join(' '));
      const K = {'Chaquetas':['chaqueta','abrigo','saco','blazer'], 'Camisas y blusas':['camisa'], 'Suéteres':['sueter','buzo'], 'Pantalones':['pantalon','uniforme'],
        'Vestidos y faldas':['vestido','falda'], 'Calzado':['calzado','zapato','tenis'], 'Accesorios':['accesorio','corbata','cobija']}[cat] || [];
      const generic = !['Calzado','Accesorios'].includes(cat) && /ropa/.test(acc);
      return generic || K.some(k => acc.includes(k));
    },
    opts(sel){ return Object.keys(BARRIOS).map(b => `<option ${b === sel ? 'selected' : ''}>${b}</option>`).join(''); }
  };
  X.geo = geo;

  /* ---------------- después de reconstruir: distancias y distintivos automáticos ---------------- */
  const DAY = 864e5;
  const arrivedOf = p => p.arrived || (p.flag === 'nueva' || /nueva/.test(p.flagBase || '') ? Date.now() - (1 + hash(p.id) % 5) * DAY : Date.now() - (16 + hash(p.id) % 50) * DAY);
  /* mapa real de Bogotá: cada tienda y fundación se ubica en el barrio que indica su página */
  const barrioOf = txt => { const n = norm(txt || ''); return Object.keys(BARRIOS).find(k => norm(k) === n) || Object.keys(BARRIOS).find(k => n && (n.includes(norm(k)) || norm(k).includes(n))); };
  const placeOnMap = () => {
    if (!window.SR_BOG) return;
    const pts = SR_BOG.pts || [], M = SR_BOG.mask || '';
    const land = (x, y) => !M || (x > 8 && x < 632 && y > 8 && y < 552 && M[Math.floor(y / 10) * 64 + Math.floor(x / 10)] === '1');
    // posiciones candidatas alrededor del centro del barrio, de la más cercana a la más lejana
    const OFF = []; for (let dx = -84; dx <= 84; dx += 12) for (let dy = -48; dy <= 48; dy += 8) OFF.push([dx, dy]);
    OFF.sort((a, b) => Math.hypot(a[0], a[1] * 1.6) - Math.hypot(b[0], b[1] * 1.6));
    const taken = [];   // cada etiqueta ocupa ~74 × 25 unidades del mapa
    const free = (x, y) => taken.every(([tx, ty]) => Math.abs(tx - x) >= 74 || Math.abs(ty - y) >= 25);
    const all = [...Object.values(STORES).filter(s => !s.hidden).sort((a, b) => a.id < b.id ? -1 : 1), ...Object.values(X.FOUNDS).sort((a, b) => a.id < b.id ? -1 : 1),
      ...Object.values(STORES).filter(s => s.hidden)];
    all.forEach(o => {
      const k = barrioOf(o.barrio) || barrioOf(o.dir);
      const [cx, cy] = k ? BARRIOS[k] : (pts.length ? pts[hash('bog' + o.id) % pts.length] : [320, 280]);
      const off = OFF.find(([dx, dy]) => (dx || dy) && land(cx + dx, cy + dy) && free(cx + dx, cy + dy)) || [8, 8];
      o.map = [cx + off[0], cy + off[1]];
      if (!o.hidden) taken.push(o.map);
    });
  };
  window.SR_afterRebuild = () => {
    placeOnMap();
    const loc = geo.loc();
    Object.values(STORES).forEach(s => { if (!s.map) return; const km = geo.kmFrom(loc, s.map); s.km = km; s.d = geo.fmt(km); s.walk = geo.walk(km); });
    Object.values(P).forEach(p => {
      const s = STORES[p.store];
      if (p.store === 'seg'){ p.km = 1 + (hash(p.id) % 90) / 10; return; }
      if (!s) return;
      p.km = s.km; if (p.flagBase === undefined) p.flagBase = p.flag || '';
      p.arrivedAt = arrivedOf(Object.assign({}, p, {flag:p.flagBase}));
      const thr = s.lowThr != null ? s.lowThr : 3, days = s.newDays || 14;
      const stock = p.stock == null ? 6 : p.stock;
      if (avail(p) && stock <= thr) p.flag = 'ultimas';
      else if (Date.now() - p.arrivedAt <= days * DAY) p.flag = 'nueva';
      else if (p.flagBase === 'ultimas' && avail(p)) p.flag = 'ultimas';
      else p.flag = '';
    });
  };
  X.weekNew = items => items.filter(p => avail(p) && p.arrivedAt && Date.now() - p.arrivedAt <= 7 * DAY).sort((a, b) => b.arrivedAt - a.arrivedAt);
  X.agoTxt = p => { const d = Math.floor((Date.now() - (p.arrivedAt || Date.now())) / DAY); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`; };
  X.rebuild();

  /* ---------------- tipos, manga y lectura de la búsqueda ---------------- */
  const TYPES = ['Chaquetas y sacos','Camisas y camisetas','Suéteres y buzos','Pantalones','Vestidos y faldas','Conjuntos','Calzado','Accesorios'];
  const typeOf = p => {
    if (p.kind === 'Calzado') return 'Calzado'; if (p.kind === 'Accesorios') return 'Accesorios';
    const n = norm(p.name + ' ' + (p.lcat || ''));
    return /conjunto|traje/.test(n) ? 'Conjuntos' : /vestido|falda/.test(n) ? 'Vestidos y faldas' : /pantal|jean/.test(n) ? 'Pantalones'
      : /sueter|cardigan|hoodie|buzo|cuello tortuga|punto/.test(n) ? 'Suéteres y buzos' : /camis|blusa|popelina/.test(n) ? 'Camisas y camisetas' : 'Chaquetas y sacos';
  };
  const sleeveOf = p => { const t = typeOf(p); if (!['Chaquetas y sacos','Camisas y camisetas','Suéteres y buzos','Conjuntos','Vestidos y faldas'].includes(t)) return ''; return /camiseta|top|vestido largo/.test(norm(p.name)) ? 'corta' : 'larga'; };
  const brandOf = p => p.brand || (p.store === 'seg' ? 'Segunda mano' : storeName(p.store));
  const origenOf = p => p.store === 'seg' ? 'Segunda mano' : 'Tiendas';
  const ratingOf = p => { const s = STORES[p.store]; return s && s.rating && s.rating !== '—' ? parseFloat(String(s.rating).replace(',', '.')) : 4.3 + (hash(p.id) % 6) / 10; };
  X.typeOf = typeOf;

  const COLW = {negro:'Negro', negra:'Negro', blanco:'Blanco', blanca:'Blanco', gris:'Gris', azul:'Azul', crudo:'Crudo', cruda:'Crudo', hueso:'Crudo', beige:'Crudo',
    cafe:'Café', marron:'Café', camel:'Café', dorado:'Dorado', dorada:'Dorado', plateado:'Plateado', plateada:'Plateado', plata:'Plateado'};
  const TYPW = {chaqueta:'Chaquetas y sacos', saco:'Chaquetas y sacos', blazer:'Chaquetas y sacos', abrigo:'Chaquetas y sacos', gabardina:'Chaquetas y sacos',
    camisa:'Camisas y camisetas', camiseta:'Camisas y camisetas', blusa:'Camisas y camisetas', sueter:'Suéteres y buzos', buzo:'Suéteres y buzos', hoodie:'Suéteres y buzos', cardigan:'Suéteres y buzos',
    pantalon:'Pantalones', jean:'Pantalones', vestido:'Vestidos y faldas', falda:'Vestidos y faldas', conjunto:'Conjuntos', traje:'Conjuntos',
    zapato:'Calzado', calzado:'Calzado', tenis:'Calzado', bota:'Calzado', mocasin:'Calzado', oxford:'Calzado',
    accesorio:'Accesorios', gafa:'Accesorios', gorra:'Accesorios', bolso:'Accesorios', reloj:'Accesorios', arete:'Accesorios', argolla:'Accesorios', collar:'Accesorios', cinturon:'Accesorios', maletin:'Accesorios', corbata:'Accesorios'};
  const GENERIC = new Set(['zapato','calzado','accesorio','ropa','prenda']);
  const STYW = {formal:'formal', casual:'casual', urbano:'urbana', urbana:'urbana', deportivo:'deportivo', deportiva:'deportivo', sport:'deportivo'};
  const STOP = new Set(['de','del','con','en','para','la','el','los','las','un','una','y','o','que','me','algo','busco','quiero']);
  const SIZES = ['XS','S','M','L','XL','26','28','30','32','34','36','37','38','39','40','41','42'];
  const sing = t => t.replace(/es$/, t.length > 4 && /[rnl]es$/.test(t) ? '' : 'es').replace(/es$/, '').replace(/s$/, '');
  function parseQ(q){
    const out = {text:[], tipo:'', color:'', estilo:'', talla:'', manga:'', min:'', max:''};
    let t = norm(q).replace(/(\d)\.(\d{3})/g, '$1$2').replace(/(\d+)\s*mil\b/g, (m, n) => n + '000');
    t = t.replace(/manga\s+(larga|corta)/g, (m, k) => { out.manga = k; return ' '; });
    t = t.replace(/talla\s+([a-z0-9]+)/g, (m, k) => { const z = k.toUpperCase(); if (SIZES.includes(z)) out.talla = z; return ' '; });
    t = t.replace(/(?:menos de|hasta|maximo|max)\s*\$?\s*(\d{4,})/g, (m, n) => { out.max = n; return ' '; });
    t = t.replace(/(?:mas de|desde|minimo|min)\s*\$?\s*(\d{4,})/g, (m, n) => { out.min = n; return ' '; });
    t.split(/\s+/).filter(Boolean).forEach(w => {
      if (STOP.has(w)) return;
      const s = w.length > 3 ? w.replace(/(es|s)$/, '') : w;
      if (COLW[w] || COLW[s]){ out.color = COLW[w] || COLW[s]; return; }
      if (STYW[w]){ out.estilo = STYW[w]; return; }
      const ty = TYPW[w] || TYPW[s] || TYPW[w.replace(/s$/, '')];
      if (ty){ out.tipo = ty; if (!GENERIC.has(s) && !GENERIC.has(w.replace(/s$/, ''))) out.text.push(s.length > 3 ? s.slice(0, Math.max(4, s.length - 1)) : s); return; }
      if (/^(xs|xl)$/.test(w)){ out.talla = w.toUpperCase(); return; }
      if (w.length > 1) out.text.push(s.length > 4 ? s.slice(0, s.length - 1) : s);
    });
    return out;
  }
  const understood = pq => [pq.tipo && ['Tipo', pq.tipo], pq.color && ['Color', pq.color], pq.estilo && ['Estilo', STYLES[pq.estilo]], pq.manga && ['Manga', pq.manga], pq.talla && ['Talla', pq.talla],
    pq.min && ['Desde', money(+pq.min)], pq.max && ['Hasta', money(+pq.max)], pq.text.length && ['Palabras', pq.text.join(', ')]].filter(Boolean);

  const EMPTYF = () => ({tipo:[], estilo:[], color:[], marca:[], origen:[], talla:'', min:'', max:''});
  const ARR = ['tipo','estilo','color','marca','origen'];
  const normF = f => { const o = EMPTYF(); Object.entries(f || {}).forEach(([k, v]) => { if (ARR.includes(k)) o[k] = Array.isArray(v) ? v.slice() : v ? [v] : []; else if (k in o) o[k] = v || ''; }); return o; };
  function match(p, pq, f){
    const hay = norm([p.name, brandOf(p), storeName(p.store), p.color, STYLES[p.style], typeOf(p), p.cond, p.lcat, p.material, (p.tags || []).join(' ')].join(' '));
    if (pq.text.length && !pq.text.every(t => hay.includes(t))) return false;
    if (pq.tipo && typeOf(p) !== pq.tipo) return false;
    if (pq.color && p.color !== pq.color) return false;
    if (pq.estilo && p.style !== pq.estilo) return false;
    if (pq.manga && sleeveOf(p) !== pq.manga) return false;
    const talla = f.talla || pq.talla; if (talla && !(p.units ? (p.units[talla] || 0) > 0 : (p.sizes || []).includes(talla))) return false;
    if (f.tipo.length && !f.tipo.includes(typeOf(p))) return false;
    if (f.estilo.length && !f.estilo.includes(p.style)) return false;
    if (f.color.length && !f.color.includes(p.color)) return false;
    if (f.marca.length && !f.marca.includes(brandOf(p))) return false;
    if (f.origen.length && !f.origen.includes(origenOf(p))) return false;
    const min = +(f.min || pq.min || 0), max = +(f.max || pq.max || 0);
    if (min && p.price < min) return false; if (max && p.price > max) return false;
    return true;
  }
  /* afinidad con el perfil: estilos, tallas, wishlist y tiendas seguidas */
  const SKEY = {Formal:'formal', Casual:'casual', Urbana:'urbana', Deportivo:'deportivo'};
  function affinity(p, u){
    if (!u) return {s:0, why:[]};
    let s = 0; const why = [];
    const st = (u.styles || []).map(x => SKEY[x]).filter(Boolean);
    if (st.includes(p.style)){ s += 3; why.push(STYLES[p.style]); }
    const size = p.kind === 'Calzado' ? u.sizes.shoe : typeOfSize(p) === 'bottom' ? u.sizes.bottom : u.sizes.top;
    if ((p.sizes || []).includes(size) || (p.sizes || []).includes('Única') || (typeOfSize(p) === 'bottom' && (p.sizes || []).includes(u.sizes.top))){ s += 2; if (p.kind !== 'Accesorios') why.push('talla ' + size); }
    const wish = (u.wish || []).map(id => P[id]).filter(Boolean);
    if (wish.some(w => w.color === p.color && w.style === p.style)){ s += 1.5; why.push('se parece a tu wishlist'); }
    if ((u.follow || []).includes(p.store)){ s += 1; why.push('sigues a ' + storeName(p.store)); }
    return {s, why};
  }
  const typeOfSize = p => /pantal|jean|falda/.test(norm(p.name)) ? 'bottom' : 'top';
  X.recommend = (n = 8) => {
    const u = member() ? X.U() : null; if (!u) return [];
    return Object.values(P).filter(p => visible(p) && avail(p) && !(u.wish || []).includes(p.id) && !p.mine)
      .map(p => { const a = affinity(p, u); a.s += p.store !== 'seg' ? .8 : 0; return Object.assign({p}, a); }).filter(o => o.s >= 3).sort((a, b) => b.s - a.s || (hash(a.p.id) % 7) - (hash(b.p.id) % 7)).slice(0, n);
  };

  function searchAll(q, fIn, base, opts = {}){
    const f = normF(fIn); const pq = parseQ(q || '');
    let items = base.filter(p => match(p, pq, f));
    const hidden = items.filter(p => !avail(p)).length;
    items = items.filter(avail);                                   /* las agotadas salen de los resultados disponibles */
    const u = member() ? X.U() : null;
    const o = opts.order || 'rel';
    if (o === 'rel') items.sort((a, b) => affinity(b, u).s - affinity(a, u).s);
    if (o === 'cerca') items.sort((a, b) => (a.km || 99) - (b.km || 99));
    if (o === 'rep') items.sort((a, b) => ratingOf(b) - ratingOf(a));
    if (o === 'new') items.sort((a, b) => (b.arrivedAt || 0) - (a.arrivedAt || 0));
    if (o === 'asc') items.sort((a, b) => a.price - b.price);
    if (o === 'desc') items.sort((a, b) => b.price - a.price);
    return {items, hidden, pq, f};
  }
  X.searchAll = searchAll;
  /* prendas parecidas a una prenda: mismo tipo, estilo, color y precio cercano */
  X.similarTo = (p0, n = 4) => { const t0 = typeOf(p0);
    return Object.values(P).filter(p => p.id !== p0.id && visible(p) && avail(p) && X.imgSrc(p)).map(p => ({p, s:(typeOf(p) === t0 ? 3 : 0) + (p.style === p0.style ? 2 : 0) + (p.color === p0.color ? 1.5 : 0) + (Math.abs(p.price - p0.price) < p0.price * .35 ? 1 : 0) + (p.store === p0.store ? .5 : 0)}))
      .filter(o => o.s >= 3).sort((a, b) => b.s - a.s).slice(0, n).map(o => o.p); };

  /* ---------------- búsquedas guardadas ---------------- */
  const PRICE_TXT = f => f.min && f.max ? `${money(+f.min)} a ${money(+f.max)}` : f.min ? 'desde ' + money(+f.min) : f.max ? 'hasta ' + money(+f.max) : '';
  X.searchDesc = s => { const f = normF(s.f); return [s.q && `«${esc(s.q)}»`, ...f.tipo, ...f.estilo.map(k => STYLES[k]), ...f.color, ...f.marca, ...f.origen, f.talla && 'Talla ' + f.talla, PRICE_TXT(f), s.loc && 'cerca de ' + s.loc].filter(Boolean).join(' · '); };
  X.searchQS = s => { const f = normF(s.f); const o = {}; if (s.q) o.q = s.q; ARR.forEach(k => { if (f[k].length) o[k] = f[k].join(','); }); ['talla','min','max'].forEach(k => { if (f[k]) o[k] = f[k]; }); if (s.loc) o.loc = s.loc; if (s.orden && s.orden !== 'rel') o.orden = s.orden; return new URLSearchParams(o).toString(); };
  function saveSearch(q, f, loc, orden){
    const name = [q, ...f.tipo, ...f.color, ...f.estilo.map(k => STYLES[k]), f.talla && 'talla ' + f.talla].filter(Boolean).join(' · ').slice(0, 40) || 'Mi búsqueda';
    const m = modal({title:'Guardar búsqueda', kicker:'Búsquedas y alertas', cls:'mdl-sm',
      body:`<div class="form-col"><div class="field"><label for="ssN">Nombre</label><input id="ssN" maxlength="40" value="${esc(name)}"></div>
        <div class="ss-sum"><span class="lbl">Se guarda</span><p>${X.searchDesc({q, f, loc}) || 'Todas las prendas'}</p></div>
        <label class="tg-inline"><span><b>Avisarme cuando haya prendas nuevas</b><em>Revisamos cada prenda nueva que publiquen las tiendas y la comunidad, y te avisamos si coincide.</em></span><button type="button" class="switch" role="switch" aria-checked="true" id="ssA" aria-label="Activar alerta"></button></label>
        <p class="f-hint">La encontrarás en tu perfil, en «Búsquedas y alertas». Puedes pausar la alerta sin borrar la búsqueda.</p></div>`,
      actions:[{label:'Cancelar'}, {label:'Guardar', kind:'btn-acc', onClick:(mm) => {
        const n = $('#ssN', mm.el); if (!check([[n, V.req('Ponle un nombre para reconocerla después.')]])) return;
        const s = {id:uid('s'), name:n.value.trim(), q, f:JSON.parse(JSON.stringify(f)), loc, orden, alert:$('#ssA', mm.el).getAttribute('aria-checked') === 'true', date:today()};
        X.U().searches.unshift(s); save(); mm.close();
        toast(`Búsqueda guardada${s.alert ? ' con alerta' : ''}`, {undo:() => { X.U().searches = X.U().searches.filter(x => x.id !== s.id); save(); }});
      }}]});
    $('#ssA', m.el).addEventListener('click', e => { const b = e.currentTarget; b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); });
  }
  /* una prenda nueva se compara con todas las búsquedas guardadas que tienen alerta activa */
  X.matchAlerts = pid => {
    const p = P[pid]; if (!p || !visible(p)) return 0; let n = 0;
    Object.entries(DB().users).forEach(([email, u]) => (u.searches || []).forEach(s => {
      if (!s.alert) return;
      if (searchAll(s.q, s.f, [p]).items.length){ n++; X.pushNotif(email, {icon:'search', t:'Nueva prenda para tu búsqueda', d:`${p.name} (${storeName(p.store)}) coincide con «${s.name}».`, href:'#/catalogo?' + X.searchQS(s)}); }
    }));
    if (n) toast(`Coincide con <b>${n}</b> ${n === 1 ? 'búsqueda guardada' : 'búsquedas guardadas'} · avisamos a quienes la siguen`);
    return n;
  };

  /* ---------------- selector múltiple (vidrio) ---------------- */
  const multi = (k, label, opts, sel) => `<div class="msel" data-k="${k}"><button type="button" class="msel-b" aria-haspopup="true" aria-expanded="false"><span class="lbl">${label}</span><b>${sel.length ? (sel.length === 1 ? esc((opts.find(o => o[0] === sel[0]) || [0, sel[0]])[1]) : sel.length + ' elegidos') : 'Todos'}</b></button>
    <div class="msel-p" role="group" aria-label="${label}" hidden>${opts.map(([v, t]) => `<label class="check"><input type="checkbox" value="${esc(v)}" ${sel.includes(v) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}<button type="button" class="linkish lbl" data-mclear>Quitar selección</button></div></div>`;

  /* ================= CATÁLOGO ================= */
  const CATS = {formal:['Formal','Sastrería, líneas limpias y zapatos de cuero.'], casual:['Casual','Punto, denim y básicos para todos los días.'], urbana:['Urbana','Oversize, cargo, gorras y sneakers.'],
    deportivo:['Sport','Ropa técnica para moverse por la ciudad.'], leather:['Leather','Cuero: chaquetas, bolsos y botas.'], calzado:['Calzado','Tenis, botas, mocasines y zapatos.']};
  X.CATS = CATS;
  /* audífonos, relojes, aretes, collares y botellas no son prendas: solo aparecen en las playlists de estilo, no en las categorías */
  const GADGET = /aud[ií]fono|reloj|arete|argolla|collar|botella|anillo|pulsera/i;
  X.isGadget = p => GADGET.test(p.name || '');
  const inCat = (p, cat) => cat && X.isGadget(p) ? false : !cat ? true : cat === 'leather' ? /cuero|charol|biker/.test(norm(p.name)) : cat === 'calzado' ? p.kind === 'Calzado' : p.style === cat;
  X.inCat = inCat;
  function vCatalogo(el, args, q, cat){
    if (cat && !CATS[cat]) cat = null;
    const base = Object.values(P).filter(p => visible(p) && inCat(p, cat));
    const f = EMPTYF(); ARR.forEach(k => { if (q[k]) f[k] = q[k].split(',').filter(Boolean); }); ['talla','min','max'].forEach(k => { if (q[k]) f[k] = q[k]; });
    let query = q.q || '', order = q.orden || 'rel', loc = q.loc && geo.BARRIOS[q.loc] ? q.loc : geo.loc();
    if (q.loc && q.loc !== geo.loc()) geo.set(q.loc);
    const brands = [...new Set(base.map(brandOf))].sort();
    const tallas = ['XS','S','M','L','XL','30','32','37','38','39','40','41','42','Única'];
    const recs = !query && member() && X.U().feed !== false ? X.recommend(8).filter(o => inCat(o.p, cat)).slice(0, 4) : [];
    const u = member() ? X.U() : null;
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:'#inicio'}, {t:'Categorías', href:'#categorias'}, {t:cat ? CATS[cat][0] : 'Todas'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">${cat ? 'Categoría · ' + base.filter(avail).length + ' prendas disponibles' : 'Catálogo completo'}</span><h1 class="v-title">${cat ? CATS[cat][0] : 'Todas las<br>prendas'}</h1>
        ${cat ? `<p class="v-lead">${CATS[cat][1]}</p>` : ''}</div></div>
      <div class="cat-tabs">${[['', 'Todas'], ...Object.entries(CATS).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<a href="${k ? '#/categoria/' + k : '#/catalogo'}" class="${(cat || '') === k ? 'on' : ''}" ${(cat || '') === k ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</div>
      ${recs.length ? `<section class="recs" aria-labelledby="recT"><div class="recs-h"><div><span class="lbl" style="color:var(--acc-tx)">Para ti</span><h2 id="recT" class="sub-h">Recomendado según tu perfil</h2></div>
          <p class="d">Porque te gusta ${esc((u.styles || []).slice(0, 3).join(', ') || 'StyleRadar')} y usas talla ${esc(u.sizes.top)} · ${esc(u.sizes.bottom)} · ${esc(u.sizes.shoe)}. <a class="linkish" href="#/perfil/info">Cambiar preferencias</a></p></div>
        <div class="p-grid">${recs.map(o => X.pCard(o.p, {meta:esc(o.why.slice(0, 2).join(' · '))})).join('')}</div></section>` : ''}
      <form class="search" id="cSearch" role="search">
        <span class="s-ic">${ICON.search}</span>
        <input id="cQ" type="search" value="${esc(query)}" placeholder="Busca «camisa blanca manga larga talla M»…" aria-label="Buscar prendas con tus palabras" autocomplete="off">
        <button type="button" class="s-clear" id="cClear" aria-label="Borrar búsqueda" ${query ? '' : 'hidden'}>${ICON.x}</button>
        <button class="btn btn-acc" type="submit">Buscar</button>
      </form>
      <div class="understood lbl" id="cUnd" aria-live="polite"></div>
      <div class="fbar2" id="cF">
        ${multi('tipo', 'Tipo', TYPES.map(t => [t, t]), f.tipo)}
        ${cat && !['leather','calzado'].includes(cat) ? '' : multi('estilo', 'Estilo', Object.entries(STYLES), f.estilo)}
        ${multi('color', 'Color', COLORS.map(c => [c, c]), f.color)}
        ${multi('marca', 'Marca', brands.map(b => [b, b]), f.marca)}
        ${multi('origen', 'Origen', [['Tiendas','Tiendas del radar'], ['Segunda mano','Segunda mano de otros usuarios']], f.origen)}
        <label class="fsel"><span class="lbl">Talla disponible</span><select id="cTalla"><option value="">Todas</option>${tallas.map(t => `<option ${f.talla === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="fsel price2"><span class="lbl">Precio (COP)</span><div><input id="cMin" inputmode="numeric" placeholder="Mínimo" value="${f.min ? (+f.min).toLocaleString('es-CO') : ''}" aria-label="Precio mínimo"><span>—</span><input id="cMax" inputmode="numeric" placeholder="Máximo" value="${f.max ? (+f.max).toLocaleString('es-CO') : ''}" aria-label="Precio máximo"></div><span class="f-err" id="cPErr" role="alert"></span></div>
        <label class="fsel"><span class="lbl">${ICON.pin.replace('<svg', '<svg width="11" height="11"')} Cerca de</span><select id="cLoc">${geo.opts(loc)}</select></label>
      </div>
      <div class="toolbar"><div class="chips" id="cActive"></div>
        <div class="tb-r"><span class="count lbl" id="cCount" aria-live="polite"></span>
          <button class="btn btn-line sm" id="cSave" type="button">${ICON.bell} Guardar búsqueda</button>
          <label class="sel lbl">Ordenar <select id="cSort"><option value="rel">Recomendados</option><option value="new">Más recientes</option><option value="cerca">Más cerca de ${esc(loc)}</option><option value="rep">Mejor calificadas</option><option value="asc">Precio: menor a mayor</option><option value="desc">Precio: mayor a menor</option></select></label></div></div>
      <div id="cRes" aria-busy="false"></div>${vfoot()}`;
    $('#cSort', el).value = order;
    const meta = p => order === 'rep' ? `★ ${ratingOf(p).toFixed(1).replace('.', ',')}${STORES[p.store] ? ' · ' + STORES[p.store].reviews + ' reseñas' : ''}`
      : `${STORES[p.store] ? esc(STORES[p.store].barrio) : 'Segunda mano'} · ${geo.fmt(p.km || 1)}`;
    const drawActive = () => {
      const chips = [];
      ARR.forEach(k => f[k].forEach(v => chips.push([k, v, k === 'estilo' ? STYLES[v] : v])));
      if (f.talla) chips.push(['talla', f.talla, 'Talla ' + f.talla]);
      if (f.min || f.max) chips.push(['precio', '', PRICE_TXT(f)]);
      $('#cActive', el).innerHTML = chips.map(([k, v, t]) => `<button type="button" class="chip on" data-x="${k}" data-v="${esc(v)}">${esc(t)} ${ICON.x.replace('<svg', '<svg width="10" height="10"')}</button>`).join('')
        + (chips.length || query ? `<button type="button" class="linkish lbl" id="cReset">Limpiar todo</button>` : `<span class="lbl" style="color:var(--fog)">Sin filtros</span>`);
      $('#cSave', el).disabled = !(chips.length || query.trim());
      $$('.msel', el).forEach(m => { const k = m.dataset.k; const b = $('b', m); b.textContent = f[k].length ? (f[k].length === 1 ? (k === 'estilo' ? STYLES[f[k][0]] : f[k][0]) : f[k].length + ' elegidos') : 'Todos'; m.classList.toggle('on', !!f[k].length); });
    };
    let tmr;
    const run = instant => {
      const res = $('#cRes', el); res.setAttribute('aria-busy', 'true'); res.classList.add('loading'); clearTimeout(tmr);
      const t0 = performance.now();
      tmr = setTimeout(() => {
        const r = searchAll(query, f, base, {order});
        const und = understood(r.pq);
        $('#cUnd', el).innerHTML = query.trim() && und.length ? `<span>Entendimos</span>${und.map(([k, v]) => `<em><i>${k}</i> ${esc(v)}</em>`).join('')}` : '';
        const secs = ((performance.now() - t0) / 1000 + .12).toFixed(2).replace('.', ',');
        $('#cCount', el).textContent = `${r.items.length} ${r.items.length === 1 ? 'prenda' : 'prendas'} · ${secs} s`;
        const hid = '';
        res.innerHTML = r.items.length ? `<div class="p-grid">${r.items.map(p => X.pCard(p, {meta:meta(p)})).join('')}</div>${hid}`
          : `${emptyState({icon:'search', title:query ? `No encontramos «${esc(query)}»` : 'Ninguna prenda cumple estos filtros',
              text:'Revisa cómo está escrito, usa una palabra más general o quita algún filtro. También puedes guardar la búsqueda y te avisamos cuando llegue algo así.',
              actions:[{label:'Quitar filtros', attr:'data-reset', kind:'btn-acc'}, {label:`${ICON.bell} Avisarme cuando llegue`, attr:'data-savesearch'}]})}${hid}
            <div class="similar"><h3>Prendas similares</h3><p class="lbl" style="color:var(--fog)">Comparamos tipo, color, talla, estilo y precio con lo que buscaste</p><div class="p-grid">${similar(r.pq, r.f, base).map(p => X.pCard(p, {meta:meta(p)})).join('')}</div></div>`;
        res.classList.remove('loading'); res.setAttribute('aria-busy', 'false');
        const qs = X.searchQS({q:query, f, loc:loc !== geo.loc() ? loc : '', orden:order});
        history.replaceState(null, '', (cat ? '#/categoria/' + cat : '#/catalogo') + (qs ? '?' + qs : ''));
      }, instant ? 0 : 260);
      drawActive();
    };
    run(true);
    const qi = $('#cQ', el);
    qi.addEventListener('input', () => { query = qi.value; $('#cClear', el).hidden = !query; run(); });
    $('#cSearch', el).addEventListener('submit', e => { e.preventDefault(); query = qi.value; run(true); qi.blur(); });
    $('#cClear', el).addEventListener('click', () => { qi.value = query = ''; $('#cClear', el).hidden = true; run(true); qi.focus(); });
    $('#cSort', el).addEventListener('change', e => { order = e.target.value; run(true); });
    $('#cTalla', el).addEventListener('change', e => { f.talla = e.target.value; run(true); });
    $('#cLoc', el).addEventListener('change', e => { loc = e.target.value; geo.set(loc); $('#cSort option[value="cerca"]', el).textContent = 'Más cerca de ' + loc; run(true); toast(`Distancias calculadas desde <b>${esc(loc)}</b>`); });
    const money2 = i => { const v = i.value.replace(/\D/g, ''); i.value = v ? (+v).toLocaleString('es-CO') : ''; return v; };
    ['cMin','cMax'].forEach(id => $('#' + id, el).addEventListener('change', () => {
      const mn = money2($('#cMin', el)), mx = money2($('#cMax', el));
      const bad = mn && mx && +mn > +mx; $('#cPErr', el).textContent = bad ? 'El mínimo no puede ser mayor que el máximo.' : ''; $('.price2', el).classList.toggle('invalid', !!bad);
      if (bad) return; f.min = mn; f.max = mx; run(true); }));
    $$('.msel', el).forEach(m => {
      const b = $('.msel-b', m), pn = $('.msel-p', m);
      b.addEventListener('click', e => { e.stopPropagation(); const open = pn.hidden; $$('.msel-p', el).forEach(x => { x.hidden = true; x.previousElementSibling.setAttribute('aria-expanded', 'false'); }); pn.hidden = !open; b.setAttribute('aria-expanded', open); });
      pn.addEventListener('change', () => { f[m.dataset.k] = $$('input:checked', pn).map(i => i.value); run(true); });
      pn.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('[data-mclear]')){ $$('input', pn).forEach(i => i.checked = false); f[m.dataset.k] = []; run(true); } });
    });
    const closeP = e => { if (!document.body.contains(el) || !el.classList.contains('on')){ document.removeEventListener('click', closeP); return; } if (!e.target.closest('.msel')) $$('.msel-p', el).forEach(x => { x.hidden = true; x.previousElementSibling.setAttribute('aria-expanded', 'false'); }); };
    document.addEventListener('click', closeP);
    const reset = () => { Object.assign(f, EMPTYF()); query = qi.value = ''; $$('#cF input[type=checkbox]', el).forEach(i => i.checked = false); $('#cTalla', el).value = ''; $('#cMin', el).value = $('#cMax', el).value = ''; run(true); };
    el.onclick = e => {
      const x = e.target.closest('[data-x]');
      if (x){ const k = x.dataset.x, v = x.dataset.v;
        if (ARR.includes(k)){ f[k] = f[k].filter(y => y !== v); const i = $(`.msel[data-k="${k}"] input[value="${CSS.escape(v)}"]`, el); if (i) i.checked = false; }
        if (k === 'talla'){ f.talla = ''; $('#cTalla', el).value = ''; }
        if (k === 'precio'){ f.min = f.max = ''; $('#cMin', el).value = $('#cMax', el).value = ''; }
        run(true); }
      if (e.target.closest('#cReset,[data-reset]')) reset();
      if (e.target.closest('#cSave,[data-savesearch]')){ if (!member()) return; saveSearch(query, JSON.parse(JSON.stringify(f)), loc, order); }
    };
  }
  /* similares: tipo, color, talla, estilo y rango de precio */
  function similar(pq, f, base, n = 4){
    const tipos = f.tipo.length ? f.tipo : pq.tipo ? [pq.tipo] : [], colors = f.color.length ? f.color : pq.color ? [pq.color] : [], est = f.estilo.length ? f.estilo : pq.estilo ? [pq.estilo] : [];
    const talla = f.talla || pq.talla, max = +(f.max || pq.max || 0), min = +(f.min || pq.min || 0);
    const score = p => { let s = 0; const hay = norm(p.name);
      pq.text.forEach(t => { if (hay.includes(t.slice(0, 4))) s += 3; });
      if (tipos.includes(typeOf(p))) s += 3; if (colors.includes(p.color)) s += 2; if (est.includes(p.style)) s += 2;
      if (talla && (p.sizes || []).includes(talla)) s += 1.5;
      if (max && p.price <= max * 1.3) s += 1; if (min && p.price >= min * .7) s += 1; return s; };
    return base.filter(avail).map(p => [score(p), p]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
  }
  view('catalogo', {fn:vCatalogo, roles:['user','guest'], acc:'#48119A', title:'Todas las prendas'});
  view('categoria', {fn:(el, a, q) => vCatalogo(el, [], q, a[0]), roles:['user','guest'], acc:'#48119A', title:a => (CATS[a[0]] || ['Categoría'])[0]});

  /* ================= MAPA ================= */
  const MCATS = ['Casual','Formal','Deportiva','Vintage','Accesorios'];
  function vMapa(el, args, q){
    let loc = geo.loc(), cat = '', sel = q.sel || '';
    const pts = () => [...Object.values(STORES).filter(s => !s.hidden && s.verif === 'Verificada').map(s => ({t:'store', id:s.id, name:s.name, cat:s.cat, cats:s.cats || [], rating:s.rating, barrio:s.barrio, x:s.map[0], y:s.map[1], href:'#/tienda/' + s.id})),
      ...Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa').map(f => ({t:'found', id:f.id, name:f.name, cat:'Fundación', cats:[], accepts:f.accepts, barrio:f.barrio, x:f.map[0], y:f.map[1], href:'#/fundacion/' + f.id}))]
      .map(p => Object.assign(p, {km:geo.kmFrom(loc, [p.x, p.y])}));
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Tiendas', href:'#tiendas'}, {t:'Mapa'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">Mapa de moda local</span><h1 class="v-title">El radar,<br>en el mapa</h1><p class="v-lead">Tiendas verificadas y fundaciones aliadas. Elige desde dónde sales y toca un punto para ver sus prendas destacadas sin salir del mapa.</p></div></div>
      <div class="map-loc"><label class="fsel"><span class="lbl">${ICON.pin.replace('<svg', '<svg width="11" height="11"')} Estoy en</span><select id="mLoc">${geo.opts(loc)}</select></label>
        <button type="button" class="btn btn-line sm" id="mGps">${ICON.pin} Usar mi ubicación</button>
        <div class="chips" id="mF" role="group" aria-label="Filtrar por categoría"><button class="chip" aria-pressed="true" data-f="">Todo</button>${MCATS.map(c => `<button class="chip" aria-pressed="false" data-f="${c}">${c}</button>`).join('')}<button class="chip" aria-pressed="false" data-f="found">Fundaciones</button></div></div>
      <div class="map-wrap">
        <div class="map-box" id="mBox">${X.mapSVG()}<span class="me-dot" id="mMe" aria-label="Tu ubicación"><i></i></span><div id="mPins"></div><div class="map-pop" id="mPop" hidden></div>
          <div class="map-legend lbl"><span><i class="lg s"></i>Tiendas</span><span><i class="lg f"></i>Fundaciones</span><span><i class="lg me"></i>Tú</span></div></div>
        <aside class="map-side"><span class="lbl" id="mCount" style="color:var(--fog)"></span><ul class="map-list" id="mList"></ul></aside>
      </div>${vfoot()}`;
    const draw = () => {
      const all = pts().sort((a, b) => a.km - b.km);
      const list = all.filter(p => !cat || (cat === 'found' ? p.t === 'found' : p.t === 'store' && p.cats.includes(cat)));
      const me = geo.xy(loc); const md = $('#mMe', el); md.style.left = me[0] / 640 * 100 + '%'; md.style.top = me[1] / 560 * 100 + '%';
      $('#mCount', el).textContent = `${list.length} ${list.length === 1 ? 'lugar' : 'lugares'} · ordenados por distancia desde ${loc}`;
      $('#mPins', el).innerHTML = list.map(p => `<button class="pin t-${p.t}${p.id === sel ? ' sel' : ''}" style="left:${p.x / 640 * 100}%;top:${p.y / 560 * 100}%" data-p="${p.id}" aria-label="${esc(p.name)}, ${esc(p.cat)}, a ${geo.fmt(p.km)}">${p.t === 'store' ? ICON.store : ICON.gift}</button>`).join('');
      $('#mList', el).innerHTML = list.map(p => `<li><button class="${p.id === sel ? 'on' : ''}" data-p="${p.id}"><span class="mi t-${p.t}">${p.t === 'store' ? ICON.store : ICON.gift}</span><span><b>${esc(p.name)}</b><em>${p.t === 'store' ? esc(p.cats.join(' · ')) : 'Fundación'} · ${esc(p.barrio)}</em></span><span class="mk">${geo.fmt(p.km)}</span></button></li>`).join('')
        || `<li>${emptyState({icon:'map', title:'No hay tiendas de esta categoría', text:'Prueba con otra categoría o mira todas.', small:true})}</li>`;
      const s = list.find(p => p.id === sel); const pop = $('#mPop', el);
      if (s){
        pop.hidden = false; pop.style.left = (s.x / 640 * 100) + '%'; pop.style.top = (s.y / 560 * 100) + '%';
        pop.classList.toggle('below', s.y < 250);
        if (s.t === 'store'){
          const its = X.storeItems(s.id).filter(p => p.status === 'publicada' && avail(p)).sort((a, b) => (b.flag === 'nueva') - (a.flag === 'nueva') || b.price - a.price).slice(0, 4);
          pop.innerHTML = `<div class="mp-h"><b>${esc(s.name)}</b><span class="lbl">${esc(s.cats.join(' · '))} · ★ ${esc(s.rating)}</span><span class="lbl">${geo.fmt(s.km)} desde ${esc(loc)} · ${geo.walk(s.km)}</span></div>
            <div class="mp-cat"><span class="lbl">Destacadas hoy</span><div class="mp-grid">${its.map(p => `<button type="button" class="mp-it" data-open="${p.id}" title="${esc(p.name)}">${thumbOf(p)}<span>${money(p.price)}</span>${p.flag === 'nueva' ? '<i>Nueva</i>' : ''}</button>`).join('') || '<span class="lbl">Sin prendas disponibles hoy</span>'}</div></div>
            <div class="mp-a"><a class="btn btn-acc sm" href="${s.href}">Ver catálogo completo</a><button class="btn btn-line sm" data-route="${s.id}">Ruta</button></div>`;
        } else pop.innerHTML = `<div class="mp-h"><b>${esc(s.name)}</b><span class="lbl">${geo.fmt(s.km)} desde ${esc(loc)} · ${geo.walk(s.km)}</span></div><p class="mp-acc">Recibe: ${esc(s.accepts.join(', '))}</p>
            <div class="mp-a"><a class="btn btn-acc sm" href="${s.href}">Ver fundación</a><a class="btn btn-line sm" href="#/vender?f=${s.id}">Donar aquí</a></div>`;
      } else pop.hidden = true;
    };
    draw();
    chipsPick($('#mF', el), false, b => { cat = b.dataset.f; draw(); });
    $('#mLoc', el).addEventListener('change', e => { loc = e.target.value; geo.set(loc); draw(); toast(`Distancias calculadas desde <b>${esc(loc)}</b>`); });
    $('#mGps', el).addEventListener('click', async e => { const done = X.busy(e.currentTarget, 'Buscando…'); await X.sleep(700); done(); loc = 'Chapinero'; $('#mLoc', el).value = loc; geo.set(loc); draw(); toast('Te ubicamos en <b>Chapinero</b> (aproximado)'); });
    el.onclick = e => { const b = e.target.closest('[data-p]'); if (b){ sel = b.dataset.p === sel ? '' : b.dataset.p; draw(); }
      const r = e.target.closest('[data-route]'); if (r){ const s = pts().find(p => p.id === r.dataset.route); toast(`Ruta a <b>${esc(s.name)}</b> · ${geo.fmt(s.km)} · ${geo.walk(s.km)}`); } };
  }
  view('mapa', {fn:vMapa, roles:['user','guest'], acc:'#48119A', title:'Mapa'});

  /* ================= INICIO: feed personal y destacados ================= */
  X.markFeatured = () => {
    const feat = DB().featured || (DB().featured = ['p3']); const C = window.SR_COLLS || [];
    $$('#stage .c-item').forEach((b, i) => { const c = C[i]; const go = b.querySelector('.go'); if (!c || !go) return; const on = c.pid && feat.includes('p' + c.pid); go.textContent = on ? '★ Destacada · Ver' : 'Ver colección'; b.classList.toggle('feat', !!on); });
  };
  function feed(){
    const host = $('#paraTi'); if (!host) return;
    const recs = member() && X.U().feed !== false ? X.recommend(8) : [];
    if (!recs.length){ host.hidden = true; host.innerHTML = ''; return; }
    const u = X.U(); host.hidden = false;
    host.innerHTML = `<div class="sec-head"><h2>Para <span>ti</span></h2><div><p>Elegido con tus estilos (${esc((u.styles || []).join(', '))}), tus tallas y lo que guardas. Cambia en tu perfil y se actualiza.</p>
        <a class="lbl pill" href="#/catalogo" style="padding:8px 14px 7px">Ver todo para ti →</a></div></div>
      <div class="p-grid">${recs.slice(0, 4).map(o => X.pCard(o.p, {meta:esc(o.why.slice(0, 2).join(' · '))})).join('')}</div>`;
  }
  const home = () => { if (!document.body.dataset.view){ feed(); X.markFeatured(); } };
  addEventListener('hashchange', () => setTimeout(home, 50));
  const _start = X.start; X.start = () => { _start(); setTimeout(home, 80); };
  const _route = X.route; X.route = () => { _route(); setTimeout(home, 30); };
  X.feed = feed;
  document.addEventListener('click', e => {
    const t = e.target.closest('.pl2-seg [data-pl]');
    if (t){ const k = t.dataset.pl; $$('.pl2-seg [data-pl]').forEach(b => b.setAttribute('aria-selected', b === t)); $$('.pl2-grid').forEach(g => g.hidden = g.dataset.pl !== k); }
    const j = e.target.closest('[data-join]'); if (j && !X.me()){ e.preventDefault(); X.openSignup(j.dataset.join || 'user'); }
  });
  new MutationObserver(() => setTimeout(home, 60)).observe(document.body, {attributes:true, attributeFilter:['data-role']});
})();
