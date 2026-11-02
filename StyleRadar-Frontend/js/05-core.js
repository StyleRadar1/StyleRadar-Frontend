/* =====================================================================
   StyleRadar · núcleo: datos, estado, componentes, sesión y enrutador
   ===================================================================== */
(() => {
  const A = window.SR_ASSETS || {thumbs:{}, layers:{}, img:{}};
  const SR = window.SR || {};
  const CAT = window.SR_CAT_IMAGES || {};
  const PHOTOS = SR.PHOTOS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = v => '$' + Math.round(v || 0).toLocaleString('es-CO');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const uid = (p = 'x') => p + '-' + Math.random().toString(36).slice(2, 8);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ini = s => String(s || '?').split(/[\s.]+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const today = () => new Date().toLocaleDateString('es-CO', {day:'numeric', month:'short', year:'numeric'});
  const mem = {
    get(k, d){ try { const v = localStorage.getItem('sr:' + k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
    set(k, v){ try { localStorage.setItem('sr:' + k, JSON.stringify(v)); return true; } catch(e){ return false; } },
    del(k){ try { localStorage.removeItem('sr:' + k); } catch(e){} }
  };

  const I = (p, o = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${o}>${p}</svg>`;
  const ICON = {
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.4-4.6-9.5-9.1C1 8.5 3.1 4.6 6.8 4.6c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.7 0 5.8 3.9 4.3 7.3C19.4 16.4 12 21 12 21z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    shuffle: I('<path d="M3 7h4l10 10h4M17 5l4 2-4 2M3 17h4l3-3M14 10l3-3h4M17 15l4 2-4 2"/>'),
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    up: I('<path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5"/>'),
    cam: I('<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.8"/>'),
    bell: I('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    pin: I('<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 1 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>'),
    chat: I('<path d="M4 5h16v11H9l-5 4z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
    edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    check: I('<path d="M4 12.5l5 5L20 6.5"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    eye: I('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    store: I('<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'),
    gift: I('<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>'),
    users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-4 3.4-6 6.5-6s5.7 2 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .6 3.3 2.6 3.7 6"/>'),
    card: I('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M7 15h4"/>'),
    chart: I('<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8"/>'),
    shield: I('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
    help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/>'),
    out: I('<path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10"/>'),
    send: I('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
    box: I('<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    alert: I('<path d="M12 3l10 18H2zM12 10v4M12 17.5h.01"/>'),
    list: I('<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'),
    filter: I('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4.4 4.2-6.5 8-6.5s6.8 2.1 8 6.5"/>'),
    grid: I('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'),
    bag: I('<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>'),
    lock: I('<rect x="5" y="10" width="14" height="10"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    map: I('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>'),
    spark: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-8.2-8.2L0 10l8.2-1.8z"/></svg>'
  };

  /* =====================================================================
     DATOS BASE
     ===================================================================== */
  const COLORS = ['Negro','Blanco','Gris','Azul','Crudo','Café','Dorado','Plateado'];
  const STYLES = {formal:'Formal', casual:'Casual', urbana:'Urbana', deportivo:'Deportivo'};
  const colorOf = n => /negr|charol/i.test(n) ? 'Negro' : /blanc/i.test(n) ? 'Blanco' : /gris|jaspead/i.test(n) ? 'Gris'
    : /azul|noche|marino|jean/i.test(n) ? 'Azul' : /crudo|hueso|canal/i.test(n) ? 'Crudo' : /gamuza|carey|caf|camel/i.test(n) ? 'Café'
    : /dorad|oro/i.test(n) ? 'Dorado' : /platead|\bplata\b|acero/i.test(n) ? 'Plateado' : 'Negro';
  const sizesOf = k => k === 'Calzado' ? ['37','38','39','40','41','42'] : k === 'Accesorios' ? ['Única'] : ['S','M','L','XL'];
  const kindOf = n => /Tenis|Mocasines|Botas|Oxford|Zapatos/.test(n) ? 'Calzado' : /Gafas|Aretes|Argollas|Corbata|Collar|Gorra|Piercing|Bolso|Reloj|Cinturón|Maletín|Riñonera|Audífonos|Botella/.test(n) ? 'Accesorios' : 'Ropa';

  const BASE = {};
  const addP = (id, o) => { if (o.style === 'alternativa') o.style = 'urbana'; const k = o.kind || kindOf(o.name); BASE[id] = Object.assign({id, kind:k, color:colorOf(o.name), sizes:sizesOf(k), stock:6, status:'publicada'}, o); };
  const T = (tile, key, name, price, store, style, extra = {}) => addP(`${tile}-${key}`, Object.assign({name, price, store, style, thumb:`${tile}-${key}`}, extra));
  T('r1c2','sueter','Suéter trenzado crudo',189000,'lab','casual',{by:'Valentina R.'});
  T('r1c2','jeans','Jean recto azul claro',159000,'lab','casual',{by:'Valentina R.'});
  T('r1c2','bolso-hobo','Bolso hobo de gamuza',210000,'nomada','casual',{by:'Camila S.'});
  T('r1c2','gafas-carey','Gafas de sol carey',89000,'nomada','casual',{by:'Valentina R.'});
  T('r1c2','collar','Collar medalla dorado',65000,'seg','casual',{by:'Sofía L.', seller:'Sofía L.', cond:'Como nuevo'});
  T('r1c2','aretes-oro','Argollas doradas',48000,'nomada','casual',{by:'Valentina R.'});
  T('r1c2','reloj-dorado','Reloj rectangular dorado',240000,'seg','casual',{by:'Mateo P.', seller:'Mateo P.', cond:'Muy bueno'});
  T('r1c2','gorra-ny','Gorra NY lavada',79000,'luna','urbana',{by:'Valentina R.', lcat:'Accesorios'});
  T('r1c2','tenis-retro','Tenis retro gris',329000,'kicks','urbana',{by:'Camila S.', stock:0});
  T('r2c3','chaqueta-cuero','Chaqueta biker de cuero',450000,'nomada','alternativa',{by:'Mateo P.'});
  T('r2c3','falda-cuero','Falda larga de cuero',280000,'seg','alternativa',{by:'Sofía L.', seller:'Sofía L.', cond:'Muy bueno', sold:true});
  T('r2c3','bolso-negro','Bolso media luna',260000,'nomada','alternativa',{by:'Mateo P.'});
  T('r2c3','botas','Botas Chelsea de plataforma',340000,'kicks','alternativa',{by:'Mateo P.'});
  T('r2c3','gafas-negras','Gafas cat-eye negras',85000,'lab','alternativa',{by:'Andrés M.'});
  T('r2c3','aretes-plata','Argollas plateadas',42000,'lab','alternativa',{by:'Sofía L.'});
  T('r2c3','reloj-negro','Reloj negro cuadrado',199000,'nomada','alternativa',{by:'Mateo P.'});
  T('r1c4','saco-negro','Saco sastre negro',395000,'nomada','formal',{by:'Camila S.'});
  T('r1c4','pantalon-negro','Pantalón sastre negro',210000,'nomada','formal',{by:'Camila S.'});
  T('r1c4','maletin-negro','Maletín de cuero negro',310000,'nomada','formal',{by:'Laura T.'});
  T('r1c4','oxford','Zapatos Oxford negros',290000,'kicks','formal',{by:'Camila S.'});
  T('r1c4','reloj-acero','Reloj de acero',320000,'seg','formal',{by:'Andrés M.', seller:'Andrés M.', cond:'Como nuevo'});
  T('r1c4','gafas-wayfarer','Gafas wayfarer',95000,'lab','formal',{by:'Laura T.'});
  T('r1c4','cinturon','Cinturón de cuero',95000,'nomada','formal',{by:'Camila S.'});
  T('r1c3','chaqueta-track','Chaqueta track negra',229000,'luna','deportivo',{lcat:'Chaquetas', stock:3, flag:'ultimas'});
  T('r1c3','pantalon-track','Pantalón track tres rayas',189000,'luna','deportivo',{lcat:'Pantalones'});
  T('r1c3','tenis-running','Tenis running plata',349000,'luna','deportivo',{lcat:'Calzado', flag:'nueva'});
  T('r1c3','gorra-negra','Gorra deportiva negra',69000,'luna','deportivo',{lcat:'Accesorios'});
  T('r1c3','rinonera','Riñonera deportiva',99000,'luna','deportivo',{lcat:'Accesorios'});
  T('r1c3','audifonos','Audífonos over-ear',380000,'luna','deportivo',{lcat:'Accesorios', stock:2, flag:'ultimas'});
  T('r1c3','botella','Botella térmica 1 L',89000,'luna','deportivo',{lcat:'Accesorios', stock:0});

  const CATDEF = {
    formal: [[0,'Traje sastre negro',520000,'nomada','cover','50% 40%','nueva'],[0,'Pantalón de pinzas',210000,'nomada','170%','50% 92%'],[1,'Saco de lana negro',395000,'nomada','cover','50% 25%'],[1,'Corbata de seda',79000,'lab','230%','50% 38%'],[2,'Blazer oversize',360000,'lab','cover','50% 85%','ultimas'],[2,'Aretes de gota',58000,'seg','260%','22% 48%'],[3,'Gafas rectangulares',99000,'lab','220%','52% 20%'],[3,'Camisa negra de popelina',149000,'nomada','cover','50% 80%'],[4,'Mocasines de charol',290000,'kicks','cover','50% 90%','nueva'],[4,'Pantalón gris de lana',230000,'seg','cover','50% 20%']],
    casual: [[0,'Suéter de canalé crudo',179000,'lab','cover','50% 32%'],[0,'Jean ancho azul',169000,'lab','170%','40% 85%','nueva'],[1,'Cárdigan gris de punto',159000,'seg','cover','50% 70%'],[1,'Gafas redondas',79000,'nomada','230%','58% 18%'],[2,'Pantalón ancho crudo',149000,'lab','cover','60% 78%'],[2,'Tenis retro blancos',299000,'kicks','250%','78% 88%',null,0],[3,'Hoodie gris jaspeado',139000,'luna','cover','50% 25%'],[3,'Pantalón negro recto',159000,'lab','cover','50% 80%','ultimas'],[4,'Camiseta blanca de algodón',59000,'lab','cover','50% 60%'],[4,'Collar de cadena fina',45000,'seg','200%','60% 40%']],
    urbana: [[0,'Conjunto técnico negro',389000,'luna','cover','50% 45%','nueva'],[0,'Tenis de trail',319000,'luna','220%','50% 95%'],[1,'Gorra NY azul',79000,'luna','200%','50% 12%'],[1,'Hoodie azul noche',169000,'luna','cover','50% 80%'],[2,'Chaqueta de nylon',249000,'lab','cover','50% 30%'],[2,'Pantalón ancho negro',179000,'seg','cover','50% 85%'],[3,'Tenis running plata',349000,'kicks','cover','50% 80%','ultimas'],[4,'Hoodie con estampado',189000,'lab','cover','50% 50%']],
    alternativa: [[0,'Gabardina de cuero',520000,'nomada','cover','50% 40%'],[0,'Pantalón de cuero',280000,'seg','cover','50% 90%'],[1,'Piercing de plata',39000,'lab','240%','30% 55%'],[1,'Hoodie negro',149000,'lab','cover','50% 90%'],[2,'Vestido largo negro',310000,'nomada','cover','50% 60%','nueva'],[3,'Cuello tortuga de punto',129000,'seg','cover','50% 85%'],[4,'Chaqueta con arnés',340000,'lab','cover','50% 50%','ultimas'],[5,'Botas de plataforma',360000,'kicks','cover','50% 60%']]
  };
  const SELLERS = ['Sofía L.','Mateo P.','Laura T.','Andrés M.','Camila S.'];
  Object.entries(CATDEF).forEach(([k, list]) => list.forEach((it, j) => {
    const [i, name, price, store, bs, bp, flag, stock] = it;
    const lcat = kindOf(name) === 'Calzado' ? 'Calzado' : kindOf(name) === 'Accesorios' ? 'Accesorios' : /Pantal/.test(name) ? 'Pantalones' : 'Chaquetas';
    addP(`${k}-${j}`, Object.assign({name, price, store, style: store === 'luna' && k === 'urbana' ? 'urbana' : k, photo:[k, i], bs, bp, flag, lcat},
      stock === 0 ? {stock:0} : flag === 'ultimas' ? {stock:2} : {},
      store === 'seg' ? {seller: SELLERS[j % SELLERS.length], cond: j % 2 ? 'Muy bueno' : 'Como nuevo'} : {}));
  }));

  /* catálogos por tienda: lo demás pasa a segunda mano para que las playlists sigan completas */
  const KEEP = {nomada:['formal-0','formal-1','formal-2','formal-7','casual-3','alternativa-0','alternativa-4'],
                kicks:['formal-8','casual-5','urbana-6','alternativa-7'],
                lab:['casual-0','casual-4','casual-7','casual-8','urbana-4','urbana-7','alternativa-3']};
  const CONDS = ['Como nuevo','Muy bueno','Como nuevo','Muy bueno','Bueno'];
  Object.values(BASE).forEach((p, i) => { if (KEEP[p.store] && !KEEP[p.store].includes(p.id)){ p.store = 'seg'; p.seller = p.seller || SELLERS[i % SELLERS.length]; p.cond = p.cond || CONDS[i % CONDS.length]; delete p.flag; } });
  KEEP.kicks.concat(KEEP.lab, KEEP.nomada).forEach(id => { const p = BASE[id]; if (!p) return; const st = Object.keys(KEEP).find(k => KEEP[k].includes(id)); p.store = st; delete p.seller; delete p.cond; });
  // fotos nuevas
  Object.assign(BASE['urbana-1'], {thumb:'urbana-trail'});
  Object.assign(BASE['urbana-2'], {thumb:'luna-gorra-azul'});
  Object.assign(BASE['urbana-6'], {thumb:'r1c3-tenis-running'});
  Object.assign(BASE['casual-5'], {thumb:'casual-retro-blancos'});
  // fotos reales de producto (v3): reemplazan el recorte de la foto de categoría
  Object.values(BASE).forEach(p => { const s = (A.pimg || {})[p.name]; if (s){ p.img = s; delete p.photo; delete p.thumb; } });

  const STORE_SEED = {
    luna:  {cats:['Deportiva','Casual'], name:'Luna Store', cat:'Sport', barrio:'Chapinero', dir:'Cra. 13 #57-22, Chapinero', d:'1,2 km', walk:'15 min a pie', hours:'Lun a sáb · 10:00 a 20:00', rating:'4,8', reviews:312,
            tel:'+57 601 555 0123', email:'luna@styleradar.co', nit:'901.482.337-1', rep:'Daniela Luna', photo:'store-2', ink:'#FFFFFF', verif:'Verificada', since:'feb 2026',
            desc:'Ropa deportiva y urbana para moverse por Bogotá: running, track y básicos técnicos.', pay:'Tarjeta, Nequi y efectivo', map:[392, 330],
            sub:{estado:'Activa', next:'23 oct 2026', start:'feb 2026'}},
    nomada:{cats:['Formal','Accesorios'], name:'Nómada Studio', cat:'Leather', barrio:'Usaquén', dir:'Cl. 119 #6-24, Usaquén', d:'3,4 km', walk:'12 min en carro', hours:'Lun a dom · 11:00 a 19:00', rating:'4,7', reviews:198,
            tel:'+57 601 555 0188', email:'hola@nomadastudio.co', nit:'900.771.204-3', rep:'Tomás Ríos', photo:'store-5', ink:'#E8DCCB', verif:'Verificada', since:'nov 2025',
            desc:'Sastrería contemporánea y marroquinería hecha en Bogotá.', pay:'Tarjeta y transferencia', map:[470, 170], sub:{estado:'Activa', next:'5 oct 2026', start:'nov 2025'}},
    kicks: {cats:['Deportiva','Casual','Accesorios'], name:'Kicks Local', cat:'Confort', barrio:'Chicó', dir:'Cra. 11 #93-15, Chicó', d:'4,0 km', walk:'14 min en carro', hours:'Lun a sáb · 10:00 a 21:00', rating:'4,6', reviews:421,
            tel:'+57 601 555 0142', email:'tienda@kickslocal.co', nit:'901.103.556-8', rep:'Julián Pardo', photo:'store-9', ink:'#B9B9CA', verif:'Verificada', since:'ene 2026',
            desc:'Tenis, botas y calzado cómodo para caminar la ciudad.', pay:'Tarjeta, Nequi y efectivo', map:[430, 235], sub:{estado:'Periodo gratuito', next:'30 sep 2026', start:'ago 2026'}},
    lab:   {cats:['Casual','Vintage','Accesorios'], name:'The Local Lab', cat:'Urbana', barrio:'Zona G', dir:'Cl. 69 #5-18, Zona G', d:'0,8 km', walk:'10 min a pie', hours:'Mar a dom · 12:00 a 20:00', rating:'4,9', reviews:156,
            tel:'+57 601 555 0107', email:'lab@thelocallab.co', nit:'901.337.920-5', rep:'Mariana Cruz', photo:'store-12', ink:'#E8DCCB', verif:'Verificada', since:'dic 2025',
            desc:'Marcas independientes colombianas: punto, denim y accesorios de autor.', pay:'Tarjeta y efectivo', map:[410, 300], sub:{estado:'Activa', next:'12 oct 2026', start:'dic 2025'}},
    ropero:{cats:['Vintage'], name:'Ropero 57', cat:'Vintage', barrio:'Teusaquillo', dir:'Cl. 39 #17-22, Teusaquillo', tel:'+57 601 555 0170', email:'ropero57@correo.co', nit:'901.880.114-2', rep:'Ana Beltrán',
            verif:'Pendiente', since:'sep 2026', desc:'Ropa vintage curada.', map:[360, 392], sub:{estado:'Periodo gratuito', next:'20 oct 2026', start:'sep 2026'}, hidden:true},
    norte: {cats:['Casual'], name:'Norte Denim', cat:'Denim', barrio:'Cedritos', dir:'Cl. 140 #11-45', tel:'+57 601 555 0133', email:'norte@denim.co', nit:'900.445.018-9', rep:'Luis Gómez',
            verif:'Verificada', since:'jun 2025', desc:'Denim nacional.', map:[480, 120], sub:{estado:'Vencida', next:'—', start:'jun 2025'}, hidden:true},
    tweed: {cats:['Formal'], name:'Casa Tweed', cat:'Sastrería', barrio:'Chapinero', dir:'Cra. 9 #60-11', tel:'+57 601 555 0119', email:'casatweed@correo.co', nit:'—', rep:'Pedro Vives',
            verif:'Rechazada', since:'ago 2026', desc:'—', map:[400, 318], sub:{estado:'Sin suscripción', next:'—', start:'—'}, hidden:true}
  };
  const FOUND_SEED = {
    abrigo:  {name:'Fundación Abrigo Bogotá', short:'Abrigo Bogotá', barrio:'Chapinero', dir:'Cl. 45 #13-40, Chapinero', hours:'Lun a vie · 8:00 a 17:00', tel:'+57 601 555 0301', email:'abrigo@styleradar.co',
              web:'abrigobogota.org', nit:'900.215.884-1', rep:'Lucía Herrera', color:'#48119A', map:[380, 350], state:'Activa', since:'mar 2025',
              mission:'Llevamos ropa de abrigo a personas en situación de calle en Bogotá. Cada chaqueta que recibimos sale a la calle en menos de dos semanas.',
              accepts:['Chaquetas y abrigos','Suéteres y buzos','Calzado cerrado','Cobijas'], needs:[['Chaquetas talla M y L',.82],['Calzado 40 a 43',.55],['Cobijas',.34]], stats:[1284,320,9]},
    suba:    {name:'Ropero Comunitario Suba', short:'Ropero Suba', barrio:'Suba', dir:'Cra. 91 #145-20, Suba', hours:'Mar a sáb · 9:00 a 16:00', tel:'+57 601 555 0322', email:'ropero@suba.org',
              web:'roperosuba.org', nit:'900.502.117-6', rep:'Jorge Cárdenas', color:'#B9B9CA', map:[300, 150], state:'Activa', since:'jun 2025',
              mission:'Un ropero gratuito donde las familias del barrio escogen la ropa que necesitan, con dignidad y sin filas.',
              accepts:['Ropa infantil','Uniformes escolares','Ropa de adulto','Zapatos'], needs:[['Uniformes escolares',.7],['Ropa infantil 4 a 10 años',.62],['Tenis',.4]], stats:[2310,540,4]},
    kennedy: {name:'Banco de Ropa Kennedy', short:'Banco Kennedy', barrio:'Kennedy', dir:'Cl. 38 Sur #78-12, Kennedy', hours:'Lun a vie · 8:00 a 15:00', tel:'+57 601 555 0344', email:'banco@kennedy.org',
              web:'bancoderopa.org', nit:'900.330.662-4', rep:'Martha Suárez', color:'#E8DCCB', map:[210, 430], state:'Activa', since:'ago 2025',
              mission:'Recibimos, clasificamos y entregamos ropa a comedores comunitarios y hogares de paso del sur de la ciudad.',
              accepts:['Ropa en buen estado','Calzado','Ropa de cama'], needs:[['Ropa de hombre',.66],['Calzado infantil',.5],['Toallas',.3]], stats:[3120,780,6]},
    dignidad:{name:'Vestir con Dignidad', short:'Vestir con Dignidad', barrio:'Teusaquillo', dir:'Cra. 17 #35-40, Teusaquillo', hours:'Lun a jue · 10:00 a 18:00', tel:'+57 601 555 0356', email:'hola@vestircondignidad.org',
              web:'vestircondignidad.org', nit:'901.001.448-7', rep:'Camilo Ortega', color:'#48119A', map:[350, 395], state:'Activa', since:'nov 2025',
              mission:'Ropa formal para personas que buscan empleo: un saco a la medida puede cambiar una entrevista.',
              accepts:['Sacos y blazers','Camisas','Pantalones formales','Zapatos formales'], needs:[['Sacos talla M',.74],['Zapatos formales',.46],['Corbatas',.2]], stats:[860,410,3]},
    manos:   {name:'Manos que Visten', short:'Manos que Visten', barrio:'Bosa', dir:'Cl. 65 Sur #80-10, Bosa', hours:'—', tel:'+57 601 555 0390', email:'manos@visten.org', web:'—', nit:'900.118.230-1',
              rep:'Rosa Díaz', color:'#B9B9CA', map:[160, 470], state:'Inactiva', since:'ene 2025', mission:'Fundación en pausa.', accepts:[], needs:[], stats:[410,90,2], hidden:true}
  };
  const PL_SEED = {
    p1:{name:'Días en la Ciudad', owner:{type:'user', name:'Valentina R.'}, cover:'figure-3', updated:'hace 2 días', likes:1240, saves:412, vis:'Pública',
        desc:'Capas suaves para caminar Chapinero de punta a punta: punto crudo, denim claro y un bolso que aguanta todo el día.',
        ids:['r1c2-sueter','r1c2-jeans','r1c2-bolso-hobo','r1c2-tenis-retro','r1c2-gorra-ny','r1c2-gafas-carey','r1c2-reloj-dorado','r1c2-collar','r1c2-aretes-oro']},
    p2:{name:'Vibra Indie Rock', owner:{type:'user', name:'Mateo P.'}, cover:'fabric-8', updated:'hace 5 días', likes:864, saves:230, vis:'Pública',
        desc:'Cuero de arriba abajo, plata en los detalles y botas para toda la noche en un concierto en el Teatro Libre.',
        ids:['r2c3-chaqueta-cuero','r2c3-falda-cuero','r2c3-botas','r2c3-bolso-negro','r2c3-gafas-negras','r2c3-reloj-negro','r2c3-aretes-plata']},
    p3:{name:'Oficina con Estilo', owner:{type:'user', name:'Camila S.'}, cover:'figure-14', updated:'ayer', likes:2410, saves:905, vis:'Pública',
        desc:'El uniforme de lunes a viernes: sastrería negra, un maletín que no pesa y zapatos que resisten la carrera séptima.',
        ids:['r1c4-saco-negro','r1c4-pantalon-negro','r1c4-oxford','r1c4-maletin-negro','r1c4-cinturon','r1c4-reloj-acero','r1c4-gafas-wayfarer']},
    p4:{name:'Salida Nocturna', owner:{type:'user', name:'Sofía L.'}, cover:'chrome-6', updated:'hace 3 días', likes:760, saves:188, vis:'Pública',
        desc:'Negro de pies a cabeza, charol que brilla con las luces de la Zona T y plata en los detalles.',
        ids:['alternativa-4','alternativa-0','formal-8','r2c3-bolso-negro','r2c3-aretes-plata','alternativa-2','formal-6','r2c3-reloj-negro','formal-5']},
    p5:{name:'Tonos Neutros', owner:{type:'user', name:'Laura T.'}, cover:'fabric-21', updated:'hace 1 semana', likes:640, saves:201, vis:'Pública',
        desc:'Crudo, gris y camel: prendas que combinan entre sí y aguantan cualquier clima de Bogotá.',
        ids:['casual-0','casual-4','casual-2','casual-8','r1c2-bolso-hobo','casual-9','r1c2-gafas-carey','casual-5','formal-9','r1c2-aretes-oro']},
    p6:{name:'Street Style Bogotá', owner:{type:'user', name:'Andrés M.'}, cover:'figure-33', updated:'hoy', likes:1030, saves:344, vis:'Pública',
        desc:'Técnico, oversize y cómodo para moverse en TransMilenio y terminar en un bar de Chapinero.',
        ids:['urbana-0','urbana-3','urbana-2','urbana-4','urbana-5','urbana-6','urbana-7','r1c3-rinonera','r1c3-audifonos','urbana-1','r1c2-gorra-ny']},
    p7:{name:'Segunda Vida', owner:{type:'user', name:'Comunidad'}, cover:'chrome-12', updated:'ayer', likes:512, saves:160, vis:'Pública',
        desc:'Solo piezas de segunda mano publicadas por la comunidad. Cada una ya tuvo una historia antes.',
        ids:['r1c2-collar','r1c2-reloj-dorado','r2c3-falda-cuero','r1c4-reloj-acero','casual-2','formal-9','alternativa-1','alternativa-5']},
    p8:{name:'Fin de Semana', owner:{type:'user', name:'Andrés M.'}, cover:'figure-41', updated:'hace 4 días', likes:455, saves:98, vis:'Pública',
        desc:'Para el sábado sin planes: denim, punto suave, gorra y tenis que aguantan todo el día.',
        ids:['r1c2-jeans','r1c2-sueter','casual-6','r1c2-tenis-retro','r1c2-gorra-ny','r1c3-botella','casual-1','urbana-1']},
    'u-weekend':{name:'Fin de semana en Usaquén', owner:{type:'user', email:'usuario@styleradar.co', name:'Valentina R.'}, updated:'hace 1 semana', likes:12, saves:3, vis:'Privada',
        desc:'Para el mercado de las pulgas del domingo.', ids:['casual-0','r1c2-jeans','r1c2-gorra-ny','casual-5']},
    's-luna-run':{name:'Running de ciudad', owner:{type:'store', id:'luna', name:'Luna Store'}, updated:'hace 3 días', likes:188, saves:64, vis:'Pública',
        desc:'Todo lo que necesitas para correr el Parque de la 93 al amanecer.', ids:['r1c3-tenis-running','r1c3-chaqueta-track','r1c3-pantalon-track','r1c3-rinonera']}
  };
  const PHOTO_OF = k => PHOTOS[k] || '';

  const ADMIN_USERS = [
    ['Valentina Rojas','usuario@styleradar.co','plus','Activa','mar 2025','Chapinero'],['Mateo Pérez','mateo.p@correo.com','free','Activa','abr 2025','Teusaquillo'],
    ['Camila Suárez','camila.s@correo.com','plus','Activa','may 2025','Usaquén'],['Sofía López','sofia.l@correo.com','plus','Activa','jun 2025','Chapinero'],
    ['Andrés Mora','andres.m@correo.com','free','Inactiva','jun 2025','Suba'],['Laura Torres','laura.t@correo.com','plus','Activa','jul 2025','Chicó'],
    ['Julián Rincón','julian.r@correo.com','free','Bloqueada','ago 2025','Kennedy'],['Mariana Gil','mariana.g@correo.com','free','Activa','sep 2025','Cedritos'],
    ['Santiago Vélez','santiago.v@correo.com','plus','Activa','oct 2025','Zona G'],['Daniela Ortiz','daniela.o@correo.com','free','Activa','nov 2025','Engativá'],
    ['Felipe Castro','felipe.c@correo.com','plus','Inactiva','ene 2026','Fontibón'],['Paula Méndez','paula.m@correo.com','free','Activa','feb 2026','Bosa']
  ].map(([name, email, plan, estado, since, barrio], i) => ({id:'u' + (i+1), name, email, plan, estado, since, barrio, pubs:(i*3)%5, pls:(i*7)%4 + (i===0?1:0)}));
  const PLAN = {free:{name:'Radar', price:0}, plus:{name:'Radar+', price:14900}, store:{name:'Tienda aliada', price:89000}};

  function seedPayments(){
    const out = []; const months = ['sep','ago','jul','jun'];
    const who = [['Luna Store','Tienda','store'],['Nómada Studio','Tienda','store'],['The Local Lab','Tienda','store'],['Norte Denim','Tienda','store'],
      ['Valentina Rojas','Usuario','plus'],['Camila Suárez','Usuario','plus'],['Sofía López','Usuario','plus'],['Laura Torres','Usuario','plus'],['Santiago Vélez','Usuario','plus'],['Felipe Castro','Usuario','plus']];
    const met = ['Tarjeta •••• 4821','Nequi','PSE','Tarjeta •••• 1190','Tarjeta •••• 7730'];
    let n = 1045;
    months.forEach((m, mi) => who.forEach((w, wi) => {
      const [name, tipo, plan] = w; const day = mi === 0 ? 1 + ((wi * 2) % 21) : 3 + ((wi * 3 + mi * 5) % 24);
      let estado = 'Aprobado';
      if (name === 'Norte Denim' && mi === 0) estado = 'Rechazado';
      if (name === 'Felipe Castro' && mi === 0) estado = 'Rechazado';
      if (name === 'Sofía López' && mi === 2) estado = 'Reembolsado';
      if (mi === 0 && wi === 4) estado = 'Pendiente';
      out.push({ref:'SR-' + (n--), date:`${day} ${m} 2026`, sort:(4-mi)*100 + day, name, tipo, concept:`${PLAN[plan].name} · mensual`, amount:PLAN[plan].price, method:met[(wi + mi) % met.length], estado});
    }));
    return out.sort((a, b) => b.sort - a.sort);
  }

  function seedDB(){
    const U = 'usuario@styleradar.co';
    return {
      v: 8,
      prod: {},                                 // cambios sobre BASE y prendas nuevas
      stores: {}, founds: {},                    // cambios y altas
      pl: JSON.parse(JSON.stringify(PL_SEED)),
      accounts: {
        [U]: {role:'user', name:'Valentina Rojas', user:'valentina.rojas', pass:'1234'},
        'luna@styleradar.co': {role:'store', name:'Luna Store', user:'lunastore', pass:'1234', ref:'luna'},
        'abrigo@styleradar.co': {role:'found', name:'Fundación Abrigo Bogotá', user:'abrigobogota', pass:'1234', ref:'abrigo'},
        'admin@styleradar.co': {role:'admin', name:'Mariana Bernal', user:'mbernal', pass:'1234'}
      },
      users: {[U]: seedUser(U, true)},
      adminUsers: ADMIN_USERS,
      payments: seedPayments(),
      donations: [
        {id:'d1', fid:'abrigo', from:{type:'usuario', name:'Valentina Rojas', email:U}, item:'Suéter trenzado crudo', thumb:'r1c2-sueter', kind:'Suéteres', talla:'M', cond:'Muy bueno', qty:1, date:'20 sep 2026', status:'pendiente', pub:'pub2', pickup:{how:'Que la recojan en mi dirección', date:'2 oct 2026', slot:'8:00 a 12:00', dir:'Cra. 7 #54-20, Chapinero'}},
        {id:'d2', fid:'abrigo', from:{type:'tienda', name:'Luna Store', id:'luna'}, item:'Chaquetas track (temporada pasada)', thumb:'r1c3-chaqueta-track', kind:'Chaquetas', talla:'S a XL', cond:'Como nuevo', qty:8, date:'19 sep 2026', status:'pendiente', pickup:{how:'La llevo a la sede de la fundación', date:'1 oct 2026', slot:'12:00 a 15:00', dir:'Cl. 45 #13-40, Chapinero'}},
        {id:'d3', fid:'abrigo', from:{type:'usuario', name:'Mateo Pérez'}, item:'Chaqueta biker de cuero', thumb:'r2c3-chaqueta-cuero', kind:'Chaquetas', talla:'L', cond:'Bueno', qty:1, date:'18 sep 2026', status:'aceptada', pickup:{how:'La llevo a la sede de la fundación', date:'30 sep 2026', slot:'15:00 a 18:00', dir:'Cl. 45 #13-40, Chapinero'}},
        {id:'d4', fid:'abrigo', from:{type:'tienda', name:'Nómada Studio', id:'nomada'}, item:'Sacos de lana de muestra', thumb:'r1c4-saco-negro', kind:'Chaquetas', talla:'M y L', cond:'Como nuevo', qty:5, date:'16 sep 2026', status:'recogida', pickup:{date:'25 sep 2026', slot:'9:00 a 12:00', dir:'Cl. 119 #6-24, Usaquén'}},
        {id:'d5', fid:'abrigo', from:{type:'usuario', name:'Laura Torres'}, item:'Botas Chelsea negras', thumb:'r2c3-botas', kind:'Calzado', talla:'40', cond:'Muy bueno', qty:1, date:'12 sep 2026', status:'recibida'},
        {id:'d6', fid:'abrigo', from:{type:'tienda', name:'Kicks Local', id:'kicks'}, item:'Tenis de exhibición', thumb:'r1c2-tenis-retro', kind:'Calzado', talla:'38 a 42', cond:'Como nuevo', qty:6, date:'10 sep 2026', status:'recibida'},
        {id:'d7', fid:'abrigo', from:{type:'usuario', name:'Andrés Mora'}, item:'Jean recto azul', thumb:'r1c2-jeans', kind:'Pantalones', talla:'32', cond:'Bueno', qty:1, date:'8 sep 2026', status:'rechazada', reason:'Recibimos solo ropa de abrigo y calzado este mes.'},
        {id:'d8', fid:'suba', from:{type:'usuario', name:'Sofía López'}, item:'Pantalón sastre negro', thumb:'r1c4-pantalon-negro', kind:'Pantalones', talla:'S', cond:'Como nuevo', qty:1, date:'17 sep 2026', status:'pendiente', pickup:{how:'La llevo a la sede de la fundación', date:'3 oct 2026', slot:'8:00 a 12:00', dir:'Cra. 91 #145-20, Suba'}},
        {id:'d9', fid:'dignidad', from:{type:'tienda', name:'Nómada Studio', id:'nomada'}, item:'Camisas blancas', thumb:'r1c4-saco-negro', kind:'Camisas', talla:'M', cond:'Como nuevo', qty:10, date:'15 sep 2026', status:'aceptada'}
      ],
      moderation: [
        {id:'m1', tipo:'Catálogo', origin:'Nómada Studio', item:'Bolso de gamuza café', price:230000, thumb:'r1c2-bolso-hobo', date:'22 sep 2026', note:'Prenda nueva de temporada'},
        {id:'m2', tipo:'Catálogo', origin:'Kicks Local', item:'Botas Chelsea de charol', price:350000, thumb:'r2c3-botas', date:'22 sep 2026', note:'Foto con marca de agua'},
        {id:'m3', tipo:'Segunda mano', origin:'Mateo Pérez', item:'Reloj negro cuadrado', price:120000, thumb:'r2c3-reloj-negro', date:'21 sep 2026', note:'Primera publicación del usuario'},
        {id:'m4', tipo:'Segunda mano', origin:'Sofía López', item:'Gafas cat-eye negras', price:45000, thumb:'r2c3-gafas-negras', date:'21 sep 2026', note:'Precio muy por debajo del promedio'}
      ]
    };
  }
  function seedUser(email, demo){
    if (!demo) return {wish:[], follow:[], pubs:[], saved:[], liked:[], searches:[], alerts:[], notifs:[], convos:[], looks:[], plan:'free',
      privacy:{pub:true, pls:true, loc:true, msg:false, hist:true, photos:false}, sizes:{top:'M', bottom:'30', shoe:'38'}, styles:[], phone:'', barrio:'', since:today(), photo:null};
    return {
      since:'marzo 2025', phone:'+57 310 555 0142', barrio:'Chapinero', sizes:{top:'M', bottom:'30', shoe:'38'}, styles:['Formal','Casual','Urbana'], plan:'plus', photo:null, sex:'hombre',
      privacy:{pub:true, pls:true, loc:true, msg:false, hist:true, photos:false},
      wish:['formal-8','casual-0','alternativa-7'],
      follow:['luna'], saved:['p3'], liked:['p1'], looks:[],
      pubs:[
        {id:'pub1', title:'Jean recto azul claro', cat:'Pantalones', talla:'30', cond:'Muy bueno', brand:'Levi’s', color:'Azul', price:85000, mode:'vender', status:'Activa', thumb:'r1c2-jeans', desc:'Tiro alto, lo usé pocas veces.', date:'2 sep 2026', views:48, chats:1},
        {id:'pub2', title:'Suéter trenzado crudo', cat:'Suéteres', talla:'M', cond:'Muy bueno', price:0, mode:'donar', fid:'abrigo', status:'Pendiente de la fundación', thumb:'r1c2-sueter', desc:'Lana, muy abrigado.', date:'20 sep 2026', views:0, chats:0}
      ],
      searches:[{id:'s1', name:'Botas negras talla 38', q:'botas', f:{color:['Negro'], talla:'38'}, loc:'Chapinero', alert:true, date:'10 sep 2026'}],
      alerts:[{id:'a1', pid:'r1c2-tenis-retro', on:true, date:'15 sep 2026'}],
      notifs:[
        {id:'n0', icon:'search', t:'Nueva prenda para tu búsqueda', d:'«Botas negras talla 38»: Botas Chelsea de plataforma llegaron a Kicks Local.', at:'hace 1 h', href:'#/perfil/alertas', read:false},
        {id:'n1', icon:'bell', t:'Volvió a estar disponible', d:'Gorra NY lavada llegó de nuevo a Luna Store en tu talla.', at:'hace 2 h', href:'#/tienda/luna', read:false},
        {id:'n2', icon:'chat', t:'Nuevo mensaje de Mateo P.', d:'Preguntó por tu Jean recto azul claro.', at:'hace 5 h', href:'#/mensajes/c2', read:false},
        {id:'n3', icon:'gift', t:'Tu donación está en revisión', d:'Fundación Abrigo Bogotá revisará tu suéter esta semana.', at:'ayer', href:'#/perfil/publicaciones', read:true}
      ],
      convos:[
        {id:'c1', role:'comprador', with:'Sofía L.', item:'Falda larga de cuero', pid:'r2c3-falda-cuero', msgs:[
          {me:true, t:'Hola Sofía, ¿la falda todavía está disponible? ¿Qué largo tiene?', at:'lun 10:12'},
          {me:false, t:'Hola, ya la vendí, lo siento. Pero tengo un pantalón de cuero en talla S si te interesa.', at:'lun 10:40'}]},
        {id:'c2', role:'vendedor', with:'Mateo P.', item:'Jean recto azul claro', pid:'pub-pub1', msgs:[
          {me:false, t:'Hola, ¿el jean es talla 30 de cintura? ¿Podemos vernos en Chapinero?', at:'hoy 9:05'}]}
      ]
    };
  }

  let DB = mem.get('db5', null);
  if (!DB || DB.v !== 8) DB = seedDB();
  let saveT;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { if (!mem.set('db5', DB)) console.warn('No se pudo guardar'); }, 120); };
  const resetDB = () => { DB = seedDB(); SRX.DB = DB; mem.set('db5', DB); rebuild(); };

  /* ------- vistas derivadas ------- */
  const P = {};
  const STORES = {}, FOUNDS = {};
  function rebuild(){
    Object.keys(P).forEach(k => delete P[k]);
    Object.entries(BASE).forEach(([id, b]) => { P[id] = Object.assign({}, b, DB.prod[id] || {}); });
    Object.entries(DB.prod).forEach(([id, o]) => { if (!BASE[id]) P[id] = Object.assign({id}, o); });
    // publicaciones de segunda mano de las personas usuarias (activas) → catálogo
    Object.entries(DB.users).forEach(([email, u]) => (u.pubs || []).forEach(pb => {
      if (pb.mode !== 'vender' || !['Activa','Vendida'].includes(pb.status)) return;
      const acc = DB.accounts[email] || {};
      P['pub-' + pb.id] = {id:'pub-' + pb.id, name:pb.title, price:pb.price, store:'seg', kind:/Calzado/.test(pb.cat) ? 'Calzado' : /Accesorios/.test(pb.cat) ? 'Accesorios' : 'Ropa',
        color:pb.color || colorOf(pb.title), sizes:[pb.talla], style:'casual', thumb:pb.thumb, img:pb.img, seller:(acc.name || 'Tú').split(' ')[0] + ' ' + ((acc.name || '').split(' ')[1] || '')[0] + '.',
        sellerEmail:email, cond:pb.cond, stock:1, sold:pb.status === 'Vendida', status:'publicada', mine:true, pub:pb.id};
    }));
    Object.keys(STORES).forEach(k => delete STORES[k]);
    Object.entries(STORE_SEED).forEach(([id, s]) => STORES[id] = Object.assign({id}, JSON.parse(JSON.stringify(s)), DB.stores[id] || {}));
    Object.entries(DB.stores).forEach(([id, s]) => { if (!STORE_SEED[id]) STORES[id] = Object.assign({id}, s); });
    Object.keys(FOUNDS).forEach(k => delete FOUNDS[k]);
    Object.entries(FOUND_SEED).forEach(([id, f]) => FOUNDS[id] = Object.assign({id}, JSON.parse(JSON.stringify(f)), DB.founds[id] || {}));
    Object.entries(DB.founds).forEach(([id, f]) => { if (!FOUND_SEED[id]) FOUNDS[id] = Object.assign({id}, f); });
    if (window.SR_afterRebuild) window.SR_afterRebuild();
  }
  const setProd = (id, patch) => { DB.prod[id] = Object.assign(DB.prod[id] || {}, patch); save(); rebuild(); };
  const setStore = (id, patch) => { DB.stores[id] = Object.assign(DB.stores[id] || {}, patch); save(); rebuild(); };
  const setFound = (id, patch) => { DB.founds[id] = Object.assign(DB.founds[id] || {}, patch); save(); rebuild(); };
  rebuild();

  const storeName = k => k === 'seg' ? 'Segunda mano' : STORES[k] ? STORES[k].name : k;
  const avail = p => p && !p.sold && (p.stock == null || p.stock > 0);
  const visible = p => p && p.status === 'publicada' && (p.store === 'seg' || (STORES[p.store] && STORES[p.store].verif === 'Verificada' && !['Vencida','Sin suscripción'].includes(STORES[p.store].sub.estado)));
  const imgSrc = p => p.img || (p.thumb && A.thumbs[p.thumb]) || '';
  const imgOf = (p, cls = '') => {
    const s = imgSrc(p);
    if (s) return `<img class="${cls}" src="${s}" alt="${esc(p.name)}" loading="lazy">`;
    if (p.photo) return `<div class="ph ${cls}" role="img" aria-label="${esc(p.name)}" style="background-image:url('${(CAT[p.photo[0]] || [])[p.photo[1]] || ''}');background-size:${p.bs};background-position:${p.bp}"></div>`;
    return `<div class="ph ph-empty ${cls}" role="img" aria-label="${esc(p.name)}">${ICON.box}</div>`;
  };
  const thumbOf = (p, cls = 'mini') => { const s = imgSrc(p); if (s) return `<img src="${s}" alt="">`;
    if (p.photo) return `<span class="ph-mini ${cls}" style="background-image:url('${(CAT[p.photo[0]] || [])[p.photo[1]] || ''}');background-size:${p.bs === 'cover' ? 'cover' : p.bs};background-position:${p.bp}"></span>`; return `<span class="tr-ph">${ICON.box}</span>`; };
  const flagLabel = f => f === 'ultimas' ? 'Últimas unidades' : f === 'nueva' ? 'Nueva llegada' : '';

  /* =====================================================================
     SESIÓN
     ===================================================================== */
  let session = mem.get('session', null);
  let tmpSession = null;
  const me = () => session || tmpSession;
  const acct = () => me() ? DB.accounts[me().email] : null;
  const role = () => (acct() || {}).role || null;
  function authChanged(){ dispatchEvent(new Event('sr:authchange')); }
  let GUEST = null;
  const U = () => { const s = me(); if (!s) return GUEST || (GUEST = seedUser('invitado', false)); if (!DB.users[s.email]) DB.users[s.email] = seedUser(s.email, false); return DB.users[s.email]; };
  const HOME = {user:'#inicio', store:'#/mi-tienda', found:'#/mi-fundacion', admin:'#/admin/resumen'};

  /* =====================================================================
     COMPONENTES DE INTERFAZ
     ===================================================================== */
  let toastT, undoFn = null;
  const toast = (html, opts = {}) => {
    const t = $('#toast'); t.querySelector('.t-msg').innerHTML = html;
    const ub = t.querySelector('.t-undo'); undoFn = opts.undo || null; ub.hidden = !undoFn;
    t.classList.toggle('err', !!opts.error);
    t.classList.add('on'); clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.remove('on'); undoFn = null; }, opts.ms || (undoFn ? 5200 : 2800));
  };
  document.addEventListener('click', e => { if (e.target.closest('.t-undo') && undoFn){ const f = undoFn; undoFn = null; $('#toast').classList.remove('on'); f(); } });

  const modalStack = [];
  const closeModals = () => { modalStack.slice().forEach(m => m.close()); };
  function modal({title, kicker = '', body = '', actions = [], wide = false, onOpen, onClose, cls = ''}){
    const root = $('#modalRoot');
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    const tid = uid('mt'); m.setAttribute('aria-labelledby', tid);
    m.innerHTML = `<div class="modal-bg"></div><div class="mdl ${wide ? 'wide' : ''} ${cls}">
      <header class="mdl-h"><div>${kicker ? `<span class="lbl mdl-k">${kicker}</span>` : ''}<h3 id="${tid}">${title}</h3></div>
        <button class="mdl-x" type="button" aria-label="Cerrar">${ICON.x}</button></header>
      <div class="mdl-b">${body}</div>
      ${actions.length ? `<footer class="mdl-f">${actions.map((a, i) => `<button type="button" class="btn ${a.kind || 'btn-line'}" data-a="${i}" ${a.disabled ? 'disabled' : ''}>${a.label}</button>`).join('')}</footer>` : ''}
    </div>`;
    root.appendChild(m);
    const last = document.activeElement;
    const api = {el:m, close(v){ if (api.closed) return; api.closed = true; m.classList.add('out'); setTimeout(() => m.remove(), reduce ? 0 : 260);
      modalStack.splice(modalStack.indexOf(api), 1); if (!modalStack.length) document.documentElement.classList.remove('lock'); if (onClose) onClose(v); if (last && last.focus) last.focus({preventScroll:true}); }};
    modalStack.push(api); document.documentElement.classList.add('lock');
    m.querySelector('.modal-bg').addEventListener('click', () => api.close());
    m.querySelector('.mdl-x').addEventListener('click', () => api.close());
    $$('[data-a]', m).forEach(b => b.addEventListener('click', () => { const a = actions[+b.dataset.a]; if (a.onClick) a.onClick(api, b); else api.close(); }));
    requestAnimationFrame(() => m.classList.add('on'));
    setTimeout(() => { const f = m.querySelector('input,select,textarea,.mdl-f .btn-acc,.mdl-f .btn-danger'); if (f) f.focus({preventScroll:true}); }, 60);
    if (onOpen) onOpen(api);
    return api;
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1].close(); });
  const confirmDlg = ({title = '¿Estás seguro?', text = '', ok = 'Confirmar', cancel = 'Cancelar', danger = false, kicker = 'Confirmar acción'}) => new Promise(res => {
    let done = false;
    modal({title, kicker, body:`<p class="mdl-p">${text}</p>`, cls:'mdl-sm',
      actions:[{label:cancel, onClick:m => { done = true; m.close(); res(false); }},
               {label:ok, kind:danger ? 'btn-danger' : 'btn-acc', onClick:m => { done = true; m.close(); res(true); }}],
      onClose:() => { if (!done) res(false); }});
  });
  const emptyState = ({icon = 'box', title, text = '', actions = [], small = false}) => `
    <div class="empty-st${small ? ' sm' : ''}" role="status">
      <div class="es-ic">${ICON[icon] || ICON.box}<span class="es-ring"></span></div>
      <h3>${title}</h3>${text ? `<p>${text}</p>` : ''}
      ${actions.length ? `<div class="es-a">${actions.map(a => a.href ? `<a class="btn ${a.kind || 'btn-line'}" href="${a.href}">${a.label}</a>` : `<button type="button" class="btn ${a.kind || 'btn-line'}" ${a.attr || ''}>${a.label}</button>`).join('')}</div>` : ''}
    </div>`;
  const fErr = (input, msg) => {
    const f = input.closest('.field') || input.parentElement;
    f.classList.toggle('invalid', !!msg);
    let e = f.querySelector(':scope > .f-err');
    if (!e){ e = document.createElement('span'); e.className = 'f-err'; e.setAttribute('role', 'alert'); f.appendChild(e); }
    e.textContent = msg || ''; input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  const V = {
    req: (m = 'Este campo es obligatorio.') => v => String(v).trim() ? '' : m,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.',
    min: (n, what = 'caracteres') => v => String(v).trim().length >= n ? '' : `Escribe al menos ${n} ${what}.`,
    max: n => v => String(v).trim().length <= n ? '' : `Máximo ${n} caracteres.`,
    phone: v => !String(v).trim() || /^\+?[\d\s-]{7,16}$/.test(String(v).trim()) ? '' : 'Escribe un celular válido, por ejemplo +57 300 000 0000.',
    money: (min = 1000) => v => { const n = parseInt(String(v).replace(/\D/g, ''), 10); return !n ? 'Escribe el precio en pesos.' : n < min ? `El precio mínimo es ${money(min)}.` : ''; },
    int: (min = 0) => v => /^\d+$/.test(String(v).trim()) && +v >= min ? '' : `Escribe un número desde ${min}.`
  };
  const check = (rules, live = true) => {
    let first = null;
    rules.forEach(([input, ...fns]) => {
      if (!input) return;
      const run = () => { const v = input.type === 'checkbox' ? (input.checked ? '1' : '') : input.value; for (const fn of fns){ const m = fn(v); if (m) return fErr(input, m); } return fErr(input, ''); };
      const ok = run();
      if (!ok && !first) first = input;
      if (live && !input._live){ input._live = true; input.addEventListener(input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input', () => { if (input.closest('.invalid')) run(); }); input.addEventListener('blur', () => { if (input.value) run(); }); }
    });
    if (first){ first.focus(); first.scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'}); }
    return !first;
  };
  const busy = (btn, label = 'Guardando…') => { const old = btn.innerHTML; btn.disabled = true; btn.classList.add('busy'); btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${label}`; return () => { btn.disabled = false; btn.classList.remove('busy'); btn.innerHTML = old; }; };
  const tip = t => `<span class="tip" tabindex="0" role="note" data-tip="${esc(t)}">?</span>`;
  const crumbs = (...parts) => `<nav class="crumbs lbl" aria-label="Ruta">${parts.map((p, i) => `${i ? '<span class="sep">/</span>' : ''}${p.href ? `<a href="${p.href}">${p.t}</a>` : `<span aria-current="page">${p.t}</span>`}`).join('')}</nav>`;
  const vfoot = () => `<div class="v-foot lbl"><span>© 2026 StyleRadar</span><button type="button" class="linkish" data-help>Ayuda y preguntas frecuentes</button><a href="${HOME[role()] || '#inicio'}">Volver al inicio ↑</a></div>`;
  const setAcc = c => document.documentElement.style.setProperty('--acc', c);
  const downscale = (file, max = 900) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res({src:c.toDataURL('image/jpeg', .8), w:im.width, h:im.height}); }; im.onerror = rej; im.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
  const chipsPick = (el, multi = false, cb) => el.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b || !el.contains(b)) return;
    if (multi) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    else $$('.chip', el).forEach(c => c.setAttribute('aria-pressed', c === b));
    if (cb) cb(b);
  });

  /* ayuda */
  const HELP = {
    user:[['¿Cómo encuentro una prenda?','Usa el buscador del catálogo (Categorías → Ver prendas) y combina filtros de tipo, color, talla, precio, marca y estilo. Puedes guardar la búsqueda y activar una alerta.'],
          ['¿Qué pasa si una prenda está agotada?','Toca «Avisarme» y te enviaremos una notificación cuando la tienda la vuelva a tener.'],
          ['¿Cómo dono una prenda?','En Segunda vida toca «Publicar una prenda», elige «Donar» y la fundación aliada. Ella revisa la solicitud y coordina la recogida contigo.'],
          ['¿Cómo funciona el probador?','Viste al maniquí con prendas reales de las tiendas o sube tu foto para ver una visualización aproximada. Puedes borrar tu foto cuando quieras.']],
    store:[['¿Cómo agrego una prenda?','En Mi tienda toca «Agregar prenda». Son tres pasos: fotos, datos y tallas. StyleRadar la revisa antes de publicarla.'],
           ['¿Cómo marco las últimas unidades?','En cada prenda de tu catálogo abre «Editar» y activa «Últimas unidades» o «Nueva llegada».'],
           ['¿Qué incluye la suscripción?','Tu catálogo visible en el radar, estadísticas y colecciones. Puedes cancelar la renovación cuando quieras desde Mi cuenta.']],
    found:[['¿Cómo recibo donaciones?','En Donaciones verás las solicitudes de personas y tiendas. Acéptalas o recházalas, coordina la recogida y confirma cuando la recibas.'],
           ['¿Puedo editar mi página?','Sí. En Mi fundación toca «Editar información» para cambiar misión, horario, contacto y lo que más necesitan.']],
    admin:[['¿Cómo verifico una tienda?','En Tiendas abre la tienda pendiente y toca «Aprobar» o «Rechazar». La tienda recibe un aviso.'],
           ['¿Cómo bloqueo una cuenta?','En Usuarios abre la persona y cambia su estado a Bloqueada. Siempre pedimos confirmación.']]
  };
  const openHelp = () => {
    const r = role() || 'user';
    modal({title:'Ayuda', kicker:'Preguntas frecuentes', wide:false,
      body:`<div class="faq">${(HELP[r] || HELP.user).map(([q, a], i) => `<details ${i ? '' : 'open'}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
        <p class="mdl-p" style="margin-top:14px">¿Necesitas algo más? Escríbenos a <b>soporte@styleradar.co</b> · respondemos en menos de 24 h.</p>`,
      actions:[{label:'Entendido', kind:'btn-acc'}]});
  };
  document.addEventListener('click', e => { if (e.target.closest('[data-help]')){ e.preventDefault(); openHelp(); } });

  /* =====================================================================
     BARRA SUPERIOR POR ROL
     ===================================================================== */
  const NAVS = {
    user:[['#/catalogo','Buscar'],['#categorias','Categorías'],['#colecciones','Playlists'],['#tiendas','Tiendas'],['#/mapa','Mapa'],['#fundaciones','Fundaciones'],['#/probador','Probador'],['#segunda-vida','Segunda vida']],
    store:[['#/mi-tienda','Mi tienda'],['#/mi-tienda/catalogo','Catálogo'],['#/mi-tienda/colecciones','Colecciones'],['#/mensajes','Mensajes'],['#/cuenta/estadisticas','Estadísticas']],
    found:[['#/mi-fundacion','Mi fundación'],['#/donaciones','Donaciones'],['#/mensajes','Mensajes'],['#/cuenta/estadisticas','Estadísticas']],
    admin:[]
  };
  function renderNav(){
    const r = role();
    document.body.dataset.role = r || 'guest';
    const NV = NAVS[r || 'user'];
    const links = $('.nav-links'); if (links) links.innerHTML = (NV || []).map(([h, t]) => `<a href="${h}"${h === '#/catalogo' ? ' class="nl-search"' : ''}>${h === '#/catalogo' ? ICON.search : ''}${t}</a>`).join('');
    const sheet = $('#sheet');
    if (sheet) { $$('a', sheet).forEach(a => a.remove()); sheet.insertAdjacentHTML('beforeend', (NV || []).map(([h, t]) => `<a href="${h}">${t}</a>`).join('') + `<a href="#" class="auth-link" id="sheetAuth">${r ? 'Mi cuenta' : 'Iniciar sesión'}</a>`); }
    const nr = $('.nav-right'); if (!nr) return;
    let bell = $('#navBell');
    if (r === 'user'){
      if (!bell){ nr.insertAdjacentHTML('afterbegin', `<button class="nav-bell" id="navBell" type="button" aria-label="Notificaciones" aria-haspopup="dialog" data-cursor="Avisos">${ICON.bell}<i id="bellN"></i></button>`); }
    } else if (bell) bell.remove();
    const nb = $('#navAuth'); if (nb){ const g = !r; nb.querySelector('span').textContent = g ? 'Iniciar sesión' : 'Usuario'; nb.classList.toggle('is-user', !g); nb.classList.toggle('is-guest', g);
      if (g) nb.removeAttribute('aria-haspopup'); else nb.setAttribute('aria-haspopup', 'menu'); nb.dataset.cursor = g ? 'Entrar' : 'Mi cuenta'; }
    renderBell();
  }
  const renderBell = () => { const n = $('#bellN'); if (!n || role() !== 'user') return; const c = (U().notifs || []).filter(x => !x.read).length; n.textContent = c || ''; n.hidden = !c; };
  const pushNotif = (email, n) => { const u = DB.users[email]; if (!u) return; u.notifs = u.notifs || []; u.notifs.unshift(Object.assign({id:uid('n'), at:'ahora', read:false}, n)); save(); if (me() && me().email === email){ renderBell(); } };

  function drawNotif(){
    const u = U(); const list = $('#notifList');
    list.innerHTML = (u.notifs || []).length ? u.notifs.map(n => `<li class="${n.read ? '' : 'unread'}"><a href="${n.href || '#'}" data-nid="${n.id}"><span class="ni">${ICON[n.icon] || ICON.bell}</span><span><b>${esc(n.t)}</b><span>${esc(n.d)}</span><em>${n.at}</em></span></a></li>`).join('')
      : `<li class="empty-li">${emptyState({icon:'bell', title:'Sin notificaciones', text:'Aquí te avisaremos cuando vuelva una prenda agotada, te escriban o cambie una donación.', small:true, actions:[{label:'Configurar alertas', href:'#/perfil/alertas'}]})}</li>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('#navBell'); const panel = $('#notif');
    if (b){ const open = panel.hidden; if (open){ drawNotif(); const r = b.getBoundingClientRect(); panel.style.top = (r.bottom + 10) + 'px'; panel.style.right = Math.max(12, innerWidth - r.right - 8) + 'px'; } panel.hidden = !open; b.setAttribute('aria-expanded', open); return; }
    if (!panel.hidden && !e.target.closest('#notif')) panel.hidden = true;
    const a = e.target.closest('[data-nid]'); if (a){ const n = U().notifs.find(x => x.id === a.dataset.nid); if (n){ n.read = true; save(); renderBell(); } panel.hidden = true; }
    if (e.target.closest('#notifAll')){ U().notifs.forEach(n => n.read = true); save(); drawNotif(); renderBell(); toast('Todo marcado como leído'); }
  });

  /* menú de usuario (arriba a la derecha) */
  const ACC_ROUTE = {user:'#/perfil', store:'#/cuenta', found:'#/cuenta', admin:'#/admin/cuenta'};
  function userMenu(anchor){
    $$('.umenu').forEach(m => m.remove());
    const r = role(), a = acct();
    const items = {user:[['#/perfil','Mi cuenta','user'],['#/perfil/playlists','Mis playlists','list'],['#/mensajes','Mensajes','chat'],['#/perfil/publicaciones','Mis publicaciones','bag'],['#/perfil/alertas','Mis búsquedas y alertas','search'],['#/perfil/wishlist','Mi wishlist','heart']],
      store:[['#/cuenta','Mi cuenta','user'],['#/mi-tienda','Mi tienda','store'],['#/mensajes','Mensajes','chat'],['#/cuenta/suscripcion','Mi suscripción','card']],
      found:[['#/cuenta','Mi cuenta','user'],['#/mi-fundacion','Mi fundación','gift'],['#/donaciones','Mis donaciones','box'],['#/mensajes','Mensajes','chat']],
      admin:[['#/admin/resumen','Estadísticas','chart'],['#/admin/cuenta','Mi cuenta','user']]}[r] || [];
    const m = document.createElement('div'); m.className = 'umenu'; m.setAttribute('role', 'menu');
    const rl = {user:'Usuario', store:'Tienda', found:'Fundación', admin:'Administrador'}[r];
    m.innerHTML = `<div class="um-h"><span class="av">${ini(a.name)}</span><div><b>${esc(a.name)}</b><span class="lbl">${rl} · ${esc(me().email)}</span></div></div>
      ${items.map(([h, t, ic]) => `<a role="menuitem" href="${h}">${ICON[ic]}${t}</a>`).join('')}
      <button role="menuitem" type="button" data-help>${ICON.help}Ayuda</button>
      <button role="menuitem" type="button" class="um-out" id="umOut">${ICON.out}Cerrar sesión</button>`;
    document.body.appendChild(m);
    const rc = anchor.getBoundingClientRect();
    m.style.top = (rc.bottom + 10) + 'px'; m.style.right = Math.max(12, innerWidth - rc.right) + 'px';
    requestAnimationFrame(() => m.classList.add('on'));
    const off = ev => { if (!m.contains(ev.target) && ev.target !== anchor && !anchor.contains(ev.target)){ m.remove(); document.removeEventListener('click', off, true); } };
    setTimeout(() => document.addEventListener('click', off, true), 0);
    m.addEventListener('click', ev => { if (ev.target.closest('a,button')) setTimeout(() => m.remove(), 0); });
    $('#umOut', m).addEventListener('click', logout);
    const first = m.querySelector('a'); if (first) first.focus({preventScroll:true});
  }
  document.addEventListener('click', e => { const sa = e.target.closest('#sheet a'); if (sa && sa.id !== 'sheetAuth'){ $('#sheet').hidden = true; const mb = $('#menuBtn'); if (mb) mb.setAttribute('aria-expanded', 'false'); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('#navAuth, .adm-user');
    if (b && me()){ e.preventDefault(); userMenu(b); }
    else if (b){ e.preventDefault(); openAuth(); }
    const s = e.target.closest('#sheetAuth');
    if (s){ e.preventDefault(); const sh = $('#sheet'); if (sh) sh.hidden = true; if (me()) location.hash = ACC_ROUTE[role()]; else openAuth(); }
  });
  async function logout(){
    const ok = await confirmDlg({title:'¿Cerrar sesión?', text:'Tendrás que volver a entrar con tu correo y contraseña.', ok:'Cerrar sesión', kicker:'Tu cuenta'});
    if (!ok) return;
    session = null; tmpSession = null; mem.del('session');
    GUEST = null;
    authChanged();
    renderNav();
    if (location.hash.startsWith('#/')) location.hash = '#inicio'; else route();
    scrollTo(0, 0); dispatchEvent(new Event('scroll')); toast('Sesión cerrada');
  }

  /* =====================================================================
     LOGIN Y REGISTRO (animación de la pila)
     ===================================================================== */
  const auth = $('#auth'), aBg = $('#authBg'), aPh = $('#authPhoto'), aImg = $('#authImg'), aMeta = $('#authMeta');
  const cLogin = $('#authCard'), cSign = $('#signCard');
  let authBusy = false, curCard = cLogin;
  const anim = (el, kf, o) => el.animate(kf, Object.assign({fill:'forwards'}, o)).finished;
  const cardIn = async card => { const kids = [...card.children]; if (reduce){ card.style.opacity = 1; kids.forEach(k => k.style.opacity = 1); return; }
    await anim(card, [{opacity:0, transform:'translateY(48px) scale(.9)', filter:'blur(14px)'}, {opacity:1, transform:'none', filter:'blur(0px)'}], {duration:680, easing:'cubic-bezier(.2,.7,.1,1)'});
    kids.forEach((k, i) => anim(k, [{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'none'}], {duration:440, delay:i * 45, easing:'cubic-bezier(.2,.7,.1,1)'})); };
  const cardOut = async card => { const kids = [...card.children]; if (reduce) return;
    await Promise.all(kids.slice().reverse().map((k, i) => anim(k, [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(-8px)'}], {duration:200, delay:i * 18})));
    await anim(card, [{opacity:1, transform:'none', filter:'blur(0px)'}, {opacity:0, transform:'translateY(34px) scale(.92)', filter:'blur(12px)'}], {duration:420, easing:'cubic-bezier(.4,0,.2,1)'}); };
  const resetCard = card => { [card, ...card.children].forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; }); };

  async function openAuth(card = cLogin){
    if (authBusy || !auth.hidden) return;
    authBusy = true;
    aImg.src = (A.img || {}).login || '';
    cLogin.hidden = card !== cLogin; cSign.hidden = card !== cSign; curCard = card;
    auth.hidden = false; document.documentElement.classList.add('lock');
    if (reduce){ [aBg, aPh, aMeta].forEach(e => e.style.opacity = 1); aPh.style.clipPath = 'inset(0 round 18px)'; await cardIn(card); }
    else {
      anim(aBg, [{opacity:0}, {opacity:1}], {duration:320});
      await anim(aPh, [{opacity:0, clipPath:'inset(41% 44% round 12px)', transform:'scale(.55) rotate(-4deg)'}, {opacity:1, clipPath:'inset(38% 41% round 14px)', transform:'scale(1) rotate(0)'}], {duration:520, easing:'cubic-bezier(.34,1.56,.64,1)'});
      anim(aImg, [{transform:'scale(1.4)'}, {transform:'scale(1.06)'}], {duration:950, easing:'cubic-bezier(.65,0,.35,1)'});
      await anim(aPh, [{clipPath:'inset(38% 41% round 14px)'}, {clipPath:'inset(0% 0% round 18px)'}], {duration:900, easing:'cubic-bezier(.65,0,.35,1)'});
      anim(aMeta, [{opacity:0, transform:'translateY(-8px)'}, {opacity:1, transform:'none'}], {duration:420});
      await cardIn(card);
    }
    authBusy = false;
    setTimeout(() => { const f = card.querySelector('input'); if (f) f.focus({preventScroll:true}); }, reduce ? 0 : 250);
  }
  function resetAuth(){
    [aBg, aPh, aImg, aMeta].forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; e.style.clipPath = ''; });
    resetCard(cLogin); resetCard(cSign);
    auth.hidden = true; document.documentElement.classList.remove('lock'); authBusy = false;
  }
  async function closeAuth(){
    if (authBusy || auth.hidden) return;
    authBusy = true;
    if (!reduce){
      await cardOut(curCard);
      anim(aMeta, [{opacity:1}, {opacity:0}], {duration:260});
      anim(aImg, [{transform:'scale(1.06)'}, {transform:'scale(1.4)'}], {duration:800, easing:'cubic-bezier(.65,0,.35,1)'});
      await anim(aPh, [{clipPath:'inset(0% 0% round 18px)'}, {clipPath:'inset(38% 41% round 14px)'}], {duration:780, easing:'cubic-bezier(.65,0,.35,1)'});
      await anim(aPh, [{opacity:1, transform:'scale(1) rotate(0)'}, {opacity:0, transform:'scale(.55) rotate(4deg)'}], {duration:360, easing:'cubic-bezier(.36,0,.66,-.56)'});
      await anim(aBg, [{opacity:1}, {opacity:0}], {duration:280});
    }
    [aBg, aPh, aImg, aMeta].forEach(e => { e.getAnimations().forEach(a => a.cancel()); e.style.opacity = ''; e.style.clipPath = ''; });
    resetCard(cLogin); resetCard(cSign);
    auth.hidden = true; document.documentElement.classList.remove('lock');
    authBusy = false;
  }
  async function swapCard(to){
    if (authBusy || to === curCard) return; authBusy = true;
    await cardOut(curCard); resetCard(curCard); curCard.hidden = true;
    to.hidden = false; curCard = to; await cardIn(to); authBusy = false;
    const f = to.querySelector('input'); if (f) f.focus({preventScroll:true});
  }
  $('#authClose').addEventListener('click', closeAuth);
  aBg.addEventListener('click', closeAuth);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !auth.hidden && !modalStack.length) closeAuth(); });
  $('#authSignup').addEventListener('click', e => { e.preventDefault(); swapCard(cSign); });
  $('#authBack').addEventListener('click', e => { e.preventDefault(); swapCard(cLogin); });
  $('#authShow').addEventListener('click', e => { const i = $('#authPass'); const s = i.type === 'password'; i.type = s ? 'text' : 'password'; e.currentTarget.textContent = s ? 'Ocultar' : 'Mostrar'; });
  $$('[data-show]').forEach(b => b.addEventListener('click', () => { const i = $('#' + b.dataset.show); const s = i.type === 'password'; i.type = s ? 'text' : 'password'; b.textContent = s ? 'Ocultar' : 'Mostrar'; }));
  $$('[data-demo]').forEach(b => b.addEventListener('click', () => { $('#authEmail').value = b.dataset.demo; $('#authPass').value = '1234'; fErr($('#authEmail'), ''); fErr($('#authPass'), ''); $$('[data-demo]').forEach(x => x.classList.toggle('on', x === b)); $('#authSubmit').focus(); }));
  $('#authForgot').addEventListener('click', e => { e.preventDefault();
    modal({title:'Recupera tu contraseña', kicker:'Tu cuenta', cls:'mdl-sm', body:`<p class="mdl-p">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p><div class="field"><label for="fgE">Correo</label><input id="fgE" type="email" value="${esc($('#authEmail').value)}" placeholder="tucorreo@ejemplo.com"></div>`,
      actions:[{label:'Cancelar'}, {label:'Enviar enlace', kind:'btn-acc', onClick:async (m, b) => { const i = $('#fgE', m.el); if (!check([[i, V.req('Escribe tu correo.'), V.email]])) return;
        if (!DB.accounts[i.value.trim().toLowerCase()]) return fErr(i, 'No encontramos una cuenta con ese correo. Revisa si está bien escrito o crea una cuenta nueva.');
        const done = busy(b, 'Enviando…'); await sleep(700); done(); m.close(); toast(`Enlace enviado a <b>${esc(i.value.trim())}</b>`); }}]}); });

  cLogin.addEventListener('submit', async e => {
    e.preventDefault();
    const ei = $('#authEmail'), pi = $('#authPass');
    if (!check([[ei, V.req('Escribe tu correo.'), V.email], [pi, V.req('Escribe tu contraseña.'), V.min(4)]])) return;
    const email = ei.value.trim().toLowerCase(); const a = DB.accounts[email];
    const b = $('#authSubmit'); const done = busy(b, 'Entrando…'); await sleep(600); done();
    if (!a) return fErr(ei, 'No encontramos una cuenta con ese correo. ¿Quieres crear una? Toca «Crear cuenta» abajo.');
    if (a.pass !== pi.value) return fErr(pi, 'La contraseña no coincide. Revísala o toca «¿Olvidaste tu contraseña?».');
    const au = DB.adminUsers.find(x => x.email === email);
    if (au && au.estado === 'Bloqueada') return fErr(ei, 'Esta cuenta está bloqueada. Escríbenos a soporte@styleradar.co para revisarla.');
    if (a.role === 'found' && FOUNDS[a.ref] && FOUNDS[a.ref].state === 'Inactiva') return fErr(ei, 'Esta fundación está desactivada. Escríbenos a soporte@styleradar.co.');
    if (au && au.estado === 'Inactiva'){ au.estado = 'Activa'; save(); }
    login(email, $('#authRemember').checked);
  });
  // registro: campos según el rol
  let suRole = 'user';
  const suShow = () => {
    $$('#signCard [data-for]').forEach(f => { const on = f.dataset.for.split(' ').includes(suRole); f.hidden = !on; if (!on) f.classList.remove('invalid'); });
    $$('#fsName [data-l]').forEach(x => x.hidden = x.dataset.l !== suRole);
    $('#suName').placeholder = {user:'Ej. Valentina Rojas', store:'Ej. Luna Store', found:'Ej. Fundación Abrigo Bogotá', admin:'Ej. Mariana Bernal'}[suRole];
    $('#suSubmit').textContent = {user:'Crear cuenta', store:'Registrar mi tienda', found:'Registrar mi fundación', admin:'Crear cuenta de administrador'}[suRole];
  };
  $$('.role-pick [role=radio]').forEach(b => b.addEventListener('click', () => { suRole = b.dataset.role; $$('.role-pick [role=radio]').forEach(x => x.setAttribute('aria-checked', x === b)); suShow(); }));
  $('.role-pick').addEventListener('keydown', e => { if (!['ArrowRight','ArrowLeft'].includes(e.key)) return; const bs = $$('.role-pick [role=radio]'); const i = bs.findIndex(x => x.getAttribute('aria-checked') === 'true'); const n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; n.click(); n.focus(); });
  $('#suSex').addEventListener('click', e => { const b = e.target.closest('[data-sx]'); if (!b) return; $$('#suSex [data-sx]').forEach(x => { x.setAttribute('aria-checked', x === b); x.setAttribute('aria-pressed', x === b); }); fErr($('#suSex'), ''); });
  $('#suRecv').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); fErr($('#suRecv'), ''); });
  suShow();
  $$('[data-atab]').forEach(b => b.addEventListener('click', () => { const to = b.dataset.atab === 'sign' ? cSign : cLogin; swapCard(to); }));
  cSign.addEventListener('submit', async e => {
    e.preventDefault();
    const $v = id => $('#' + id).value.trim();
    const ni = $('#suName'), ei = $('#suEmail'), pi = $('#suPass'), ti = $('#suTerms');
    const rules = [[ni, V.req(suRole === 'store' ? 'Escribe el nombre de la tienda.' : suRole === 'found' ? 'Escribe el nombre de la fundación.' : 'Escribe tu nombre.'), V.min(3)]];
    if (suRole === 'user') rules.push([$('#suUser'), V.req('Elige un nombre de usuario.'), V.min(3), v => /^[\w.\-]+$/i.test(v.trim()) ? '' : 'Usa solo letras, números, punto o guion, sin espacios.']);
    if (suRole !== 'admin') rules.push([$('#suBarrio'), V.req('Elige el barrio.')]);
    if (suRole === 'store' || suRole === 'found'){ rules.push([$('#suNit'), V.req('Escribe el NIT.'), v => /^[\d.\-\s]{8,16}$/.test(v.trim()) ? '' : 'El NIT tiene solo números, puntos y guion. Ej. 900.123.456-7']);
      rules.push([$('#suDir'), V.req('Escribe la dirección.'), V.min(6)]); rules.push([$('#suRep'), V.req('Escribe el nombre del representante legal.'), V.min(3)]); }
    if (suRole === 'store'){ rules.push([$('#suTel'), V.req('Escribe un teléfono de contacto.'), V.phone]); rules.push([$('#suCat'), V.req('Elige la categoría principal.')]); }
    if (suRole === 'admin') rules.push([$('#suCode'), V.req('Escribe el código de invitación.'), v => v.trim().toUpperCase() === 'SR-ADMIN-2026' ? '' : 'Ese código no es válido. Pídelo al equipo de StyleRadar (demo: SR-ADMIN-2026).']);
    rules.push([ei, V.req('Escribe tu correo.'), V.email, v => DB.accounts[v.trim().toLowerCase()] ? 'Ese correo ya tiene una cuenta. ¿Quieres iniciar sesión? Toca «Inicia sesión» arriba.' : ''],
      [pi, V.req('Crea una contraseña.'), V.min(6)], [ti, V.req('Acepta los términos para continuar.')]);
    let ok = check(rules);
    const sx = $('#suSex [aria-checked="true"]');
    if (suRole === 'user' && !sx){ fErr($('#suSex'), 'Elige el maniquí para tu probador.'); ok = false; }
    const recv = $$('#suRecv .chip[aria-pressed="true"]').map(c => c.textContent);
    if (suRole === 'found' && !recv.length){ fErr($('#suRecv'), 'Elige al menos un tipo de prenda que reciben.'); ok = false; }
    if (!ok){ const f = $('#signCard .field.invalid'); if (f) f.scrollIntoView({block:'center', behavior:reduce ? 'auto' : 'smooth'}); return; }
    const email = ei.value.trim().toLowerCase(), name = ni.value.trim(), barrio = suRole === 'admin' ? '' : $v('suBarrio');
    const b = $('#suSubmit'); const done = busy(b, 'Creando cuenta…'); await sleep(800); done();
    const acc = {role:suRole, name, user:suRole === 'user' ? $v('suUser') : email.split('@')[0], pass:pi.value, created:today()};
    if (suRole === 'store'){ const id = uid('st'); acc.ref = id; const cat = $v('suCat'); DB.stores[id] = {name, cat, cats:[cat], barrio, dir:$v('suDir'), d:'—', walk:'', hours:'Lun a sáb · 10:00 a 19:00', rating:'—', reviews:0, tel:$v('suTel'), email, nit:$v('suNit'), rep:$v('suRep'), photo:null,
      verif:'Pendiente', since:today(), desc:'', pay:'', map:[400, 280], sub:{estado:'Periodo gratuito', next:'30 días', start:today()}, fresh:true}; }
    if (suRole === 'found'){ const id = uid('fd'); acc.ref = id; DB.founds[id] = {name, short:name.replace(/^Fundaci[oó]n\s+/i, ''), barrio, dir:$v('suDir'), hours:'', tel:'', email, web:'', nit:$v('suNit'), rep:$v('suRep'), color:'#48119A', map:[320, 300],
      state:'Activa', since:today(), mission:'', accepts:recv, needs:[], stats:[0, 0, 0], fresh:true}; }
    if (suRole === 'user'){ const nu = seedUser(email, false); nu.sex = sx.dataset.sx; nu.barrio = barrio; DB.users[email] = nu; DB.adminUsers.unshift({id:uid('u'), name, email, plan:'free', estado:'Activa', since:today(), barrio, pubs:0, pls:0}); }
    DB.accounts[email] = acc; save(); rebuild();
    login(email, true, true);
  });

  async function login(email, remember, isNew){
    const s = {email}; if (remember){ session = s; mem.set('session', s); } else { tmpSession = s; mem.del('session'); }
    GUEST = null;
    authChanged();
    const a = DB.accounts[email];
    await closeAuth();
    renderNav();
    /* la persona usuaria se queda donde estaba; tienda, fundación y admin van a su panel */
    if (a.role === 'user'){ const y = scrollY; route(); if (!location.hash.startsWith('#/')) requestAnimationFrame(() => scrollTo(0, y)); dispatchEvent(new Event('scroll')); }
    else { const target = HOME[a.role]; if (location.hash === target) route(); else location.hash = target; }
    toast(isNew ? `Bienvenido a StyleRadar, <b>${esc(a.name.split(' ')[0])}</b>` : `Hola, <b>${esc(a.name.split(' ')[0])}</b>. Sesión iniciada.`);
    if (pendingAfterLogin && a.role === 'user'){ const f = pendingAfterLogin; pendingAfterLogin = null; setTimeout(f, 250); } else pendingAfterLogin = null;
  }

  /* =====================================================================
     INVITADOS: lo que pide iniciar sesión
     ===================================================================== */
  let pendingAfterLogin = null;
  const GATE_MSG = {mensajes:'Inicia sesión para ver tus mensajes', vender:'Inicia sesión para publicar o donar una prenda', perfil:'Inicia sesión para ver tu cuenta',
    probador:'Inicia sesión para usar el probador virtual', cuenta:'Inicia sesión para ver tu cuenta'};
  function needLogin(msg = 'Inicia sesión para continuar', after = null){
    pendingAfterLogin = after;
    $$('.modal').forEach(m => m.remove()); modalStack.length = 0; document.documentElement.classList.remove('lock');
    toast(msg); openAuth();
  }
  const GATED = [
    ['.heart', 'Inicia sesión para guardar prendas en tu wishlist'],
    ['[data-addpl], #plNew, #plNew2, [data-newpl]', 'Inicia sesión para crear playlists y agregar prendas'],
    ['#plSave, #plLike', 'Inicia sesión para guardar playlists'],
    ['[data-chat]', 'Inicia sesión para escribirle a quien vende'],
    ['[data-storechat]', 'Inicia sesión para escribirle a la tienda'],
    ['[data-alert]', 'Inicia sesión para activar alertas de disponibilidad'],
    ['#stFollow', 'Inicia sesión para seguir tiendas'],
    ['#cSave, [data-savesearch]', 'Inicia sesión para guardar búsquedas'],
    ['a[href^="#/vender"], [data-sell]', 'Inicia sesión para publicar o donar una prenda'],
    ['a[href^="#/mensajes"]', 'Inicia sesión para ver tus mensajes'],
    ['a[href^="#/perfil"]', 'Inicia sesión para ver tu cuenta'],
    ['a[href^="#/probador"], #fitGo, [data-tryon]', 'Inicia sesión para usar el probador virtual']
  ];
  document.addEventListener('click', e => {
    if (me() || !e.target.closest) return;
    const nl = e.target.closest('[data-needlogin]'); if (nl){ e.preventDefault(); e.stopImmediatePropagation(); needLogin(nl.dataset.needlogin); return; }
    for (const [sel, msg] of GATED){ if (e.target.closest(sel)){ e.preventDefault(); e.stopImmediatePropagation(); needLogin(msg); return; } }
  }, true);

  /* =====================================================================
     ENRUTADOR
     ===================================================================== */
  const VIEWS = {};
  const view = (name, def) => { VIEWS[name] = def; };
  const ensureView = name => { let v = $(`.view[data-view="${name}"]`); if (!v){ v = document.createElement('section'); v.className = 'view'; v.dataset.view = name; $('#views').appendChild(v); } return v; };
  const baseTitle = 'StyleRadar · Descubre tu estilo';
  let savedY = 0, lastView = '';
  const parseHash = () => { const h = location.hash || ''; const [path, qs] = h.split('?'); const q = Object.fromEntries(new URLSearchParams(qs || '')); return {h, path, q}; };
  function route(){
    const {h, path, q} = parseHash();
    $$('.umenu').forEach(m => m.remove()); const np = $('#notif'); if (np) np.hidden = true;
    if (me() && !acct()){ session = null; tmpSession = null; mem.del('session'); authChanged(); }
    const r = role() || 'guest';
    document.body.dataset.role = r;
    if (!path.startsWith('#/')){
      if (r !== 'user' && r !== 'guest'){ location.replace(HOME[r]); return; }
      const was = !!document.body.dataset.view; delete document.body.dataset.view;
      $$('.view').forEach(x => x.classList.remove('on'));
      document.title = baseTitle; lastView = '';
      const id = path.slice(1);
      requestAnimationFrame(() => {
        const el = id && document.getElementById(id);
        if (el && id !== 'inicio') el.scrollIntoView(); else if (id === 'inicio') scrollTo(0, 0); else if (was) scrollTo(0, savedY);
        dispatchEvent(new Event('scroll'));
      });
      return;
    }
    const parts = path.slice(2).split('/'); const name = parts[0]; const args = parts.slice(1).map(decodeURIComponent);
    const v = VIEWS[name];
    if (!v){ location.replace(HOME[r]); return; }
    if (r === 'guest' && !v.roles.includes('guest')){ location.replace('#inicio'); needLogin(GATE_MSG[name] || 'Inicia sesión para continuar'); return; }
    if (!v.roles.includes(r)){ toast('Esa sección no está disponible para tu tipo de cuenta', {error:true}); location.replace(HOME[r]); return; }
    if (!document.body.dataset.view) savedY = scrollY;
    document.body.dataset.view = name;
    const el = ensureView(name);
    $$('.view').forEach(x => x.classList.toggle('on', x === el));
    el.classList.toggle('v-admin', name === 'admin');
    setAcc(typeof v.acc === 'function' ? v.acc(args) : v.acc);
    const keepScroll = v.keep && lastView === name + ':' + args[0];
    v.fn(el, args, q);
    if (window.SR_afterView) window.SR_afterView(el, name, args);
    lastView = name + ':' + args[0];
    document.title = `${typeof v.title === 'function' ? v.title(args) : v.title} · StyleRadar`;
    if (!keepScroll) scrollTo(0, 0);
    if (v.anchor && args[v.anchor.i]){ const t = document.getElementById(v.anchor.prefix + args[v.anchor.i]); if (t) setTimeout(() => t.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}), 60); }
  }
  addEventListener('hashchange', route);
  const go = h => { if (location.hash === h) route(); else location.hash = h; };

  const veil = () => { const v = $('#navVeil'); if (v) v.classList.toggle('on', scrollY > 30); };
  addEventListener('scroll', veil, {passive:true}); addEventListener('hashchange', () => setTimeout(veil, 60));
  function start(){
    if (me() && !acct()){ session = null; tmpSession = null; mem.del('session'); authChanged(); }
    renderNav(); route();
  }

  window.SRX = {A, SR, CAT, PHOTOS, $, $$, reduce, money, esc, norm, uid, sleep, ini, today, mem, ICON, DB, save, resetDB, rebuild, P, BASE, STORES, FOUNDS, PLAN, COLORS, STYLES,
    setProd, setStore, setFound, storeName, avail, visible, imgSrc, imgOf, thumbOf, flagLabel, PHOTO_OF, seedUser,
    me, acct, role, U, HOME, toast, modal, confirmDlg, emptyState, fErr, V, check, busy, tip, crumbs, vfoot, setAcc, downscale, chipsPick, pushNotif, renderBell, renderNav,
    view, route, go, parseHash, openAuth, openSignup:r => { openAuth(cSign); if (r) setTimeout(() => { const b = $(`.role-pick [data-role="${r}"]`); if (b) b.click(); }, 60); }, logout, start, openHelp, needLogin, closeModals};
  Object.defineProperty(window.SRX, 'DB', {get: () => DB});
})();
