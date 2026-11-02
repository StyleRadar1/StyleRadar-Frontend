/* =====================================================================
   StyleRadar · roles TIENDA y FUNDACIÓN
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {A, $, $$, reduce, money, esc, norm, uid, sleep, ini, today, ICON, P, STORES, FOUNDS, PLAN, COLORS, STYLES,
    storeName, avail, imgSrc, imgOf, flagLabel, toast, modal, confirmDlg, emptyState, fErr, V, check, busy, tip, crumbs, vfoot, chipsPick, view, go} = X;
  const save = () => X.save();
  const DB = () => X.DB;
  const myStore = () => STORES[X.acct().ref];
  const myFound = () => FOUNDS[X.acct().ref];

  /* ---------------- gráficos simples (una serie, con tooltip) ---------------- */
  function barChart(data, {h = 180, fmt = v => v, label = ''} = {}){
    const max = Math.max(...data.map(d => d[1]), 1); const n = data.length; const W = 100 / n;
    return `<figure class="chart" aria-label="${esc(label)}"><div class="ch-plot" style="height:${h}px">
      ${[.25, .5, .75, 1].map(g => `<span class="ch-grid" style="bottom:${g * 100}%"><em>${fmt(Math.round(max * g))}</em></span>`).join('')}
      ${data.map(([k, v], i) => `<div class="ch-col" style="left:${i * W}%;width:${W}%" tabindex="0" data-tipc="${esc(k)} · ${esc(fmt(v))}"><i style="height:${v / max * 100}%"></i></div>`).join('')}
      </div><div class="ch-x">${data.map(([k]) => `<span>${esc(k)}</span>`).join('')}</div>
      <table class="sr-only"><caption>${esc(label)}</caption>${data.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(fmt(v))}</td></tr>`).join('')}</table></figure>`;
  }
  function hBars(data, fmt = v => v){
    const max = Math.max(...data.map(d => d[1]), 1);
    return `<ul class="hbars">${data.map(([k, v]) => `<li tabindex="0" data-tipc="${esc(k)} · ${esc(fmt(v))}"><span>${esc(k)}</span><div class="pbar"><i style="width:${v / max * 100}%"></i></div><b>${esc(fmt(v))}</b></li>`).join('')}</ul>`;
  }
  const kpi = (v, l, d = '', trend = '') => `<div class="kpi"><b>${v}</b><span class="lbl">${l}</span>${d ? `<em class="${trend}">${d}</em>` : ''}</div>`;
  X.barChart = barChart; X.hBars = hBars; X.kpi = kpi;
  // tooltip de gráficos
  const tipEl = document.createElement('div'); tipEl.className = 'ch-tip'; tipEl.hidden = true; document.body.appendChild(tipEl);
  const showTip = (t, x, y) => { tipEl.textContent = t; tipEl.hidden = false; tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; };
  document.addEventListener('pointerover', e => { const c = e.target.closest('[data-tipc]'); if (!c) return; const r = c.getBoundingClientRect(); showTip(c.dataset.tipc, r.left + r.width / 2, r.top); });
  document.addEventListener('pointerout', e => { if (e.target.closest('[data-tipc]')) tipEl.hidden = true; });
  document.addEventListener('focusin', e => { const c = e.target.closest('[data-tipc]'); if (c){ const r = c.getBoundingClientRect(); showTip(c.dataset.tipc, r.left + r.width / 2, r.top); } else tipEl.hidden = true; });

  /* ---------------- sub-navegación de cuenta (tienda / fundación) ---------------- */
  const seed = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 100000; return () => (h = (h * 9301 + 49297) % 233280) / 233280; };

  /* =====================================================================
     TIENDA · Mi tienda (catálogo editable, colecciones)
     ===================================================================== */
  const LCATS = ['Chaquetas','Camisas','Pantalones','Calzado','Accesorios'];
  const catOf = p => p.lcat || (p.kind === 'Calzado' ? 'Calzado' : p.kind === 'Accesorios' ? 'Accesorios' : 'Chaquetas');
  const statusOf = p => p.status === 'retirada' ? 'Retirada' : p.status === 'revision' ? 'En revisión' : p.status === 'rechazada' ? 'Rechazada' : !avail(p) ? 'Agotada' : 'Publicada';
  const stCls = s => ({Publicada:'ok', 'En revisión':'wait', Agotada:'sold', Retirada:'off', Rechazada:'off'}[s]);
  function vMiTienda(el, [sec]){
    const s = myStore(); if (!s){ el.innerHTML = emptyState({icon:'store', title:'No encontramos tu tienda'}); return; }
    const items = X.storeItems(s.id);
    const cols = Object.entries(DB().pl).filter(([, p]) => p.owner.type === 'store' && p.owner.id === s.id);
    const banner = s.verif === 'Pendiente' ? `<div class="banner wait">${ICON.clock}<div><b>Tu tienda está en revisión</b><span>StyleRadar está verificando tus datos. Mientras tanto no apareces en el radar, pero ya puedes cargar tu catálogo.</span></div><a class="btn btn-line sm" href="#/cuenta/info">Completar datos</a></div>`
      : s.verif === 'Rechazada' ? `<div class="banner err">${ICON.alert}<div><b>La verificación fue rechazada</b><span>${esc(s.verifNote || 'Revisa tus documentos y vuelve a enviarlos.')}</span></div><a class="btn btn-line sm" href="#/cuenta/info">Revisar</a></div>`
      : ['Cancelada','Vencida'].includes(s.sub.estado) ? `<div class="banner warn">${ICON.card}<div><b>Tu suscripción está ${s.sub.estado.toLowerCase()}</b><span>${s.sub.estado === 'Cancelada' ? `Tu catálogo sigue visible hasta el ${s.sub.next}.` : 'Tu catálogo no se ve en el radar.'}</span></div><a class="btn btn-acc sm" href="#/cuenta/suscripcion">Reactivar</a></div>`
      : s.sub.estado === 'Periodo gratuito' ? `<div class="banner">${ICON.spark}<div><b>Estás en el periodo gratuito</b><span>Termina el ${s.sub.next}. Activa tu suscripción para mantener el catálogo visible.</span></div><a class="btn btn-line sm" href="#/cuenta/suscripcion">Ver suscripción</a></div>` : '';
    el.innerHTML = `
      ${X.storeHero(s)}
      <div class="st-crumbs">${crumbs({t:'Mi tienda'}, {t:'Vista de administrador'})}</div>
      <div class="own-bar"><span class="lbl">${ICON.eye} Así te ven tus clientes · las herramientas de edición solo las ves tú</span><div><span class="st st-${s.verif === 'Verificada' ? 'ok' : 'wait'}">${s.verif}</span><span class="st st-${s.sub.estado === 'Activa' ? 'ok' : s.sub.estado === 'Periodo gratuito' ? 'wait' : 'off'}">Suscripción ${s.sub.estado.toLowerCase()}</span></div></div>
      ${banner}
      <div class="st-info">
        <div><h1 style="color:${s.ink || '#FFFFFF'}">${esc(s.name)}</h1><div class="st-tags"><span class="badge">${esc(s.cat)}</span>${s.verif === 'Verificada' ? '<span class="badge alt">Verificada</span>' : ''}</div>
          <p class="st-desc">${esc(s.desc) || '<em class="muted">Agrega una descripción para que la gente sepa qué vendes.</em>'}</p></div>
        <div class="st-facts">
          <div><span class="k lbl">Dirección</span><span class="v">${esc(s.dir) || '—'}</span></div><div><span class="k lbl">Teléfono</span><span class="v">${esc(s.tel) || '—'}</span></div>
          <div><span class="k lbl">Horario</span><span class="v">${esc(s.hours) || '—'}</span></div><div><span class="k lbl">Pagos</span><span class="v">${esc(s.pay) || '—'}</span></div>
        </div>
        <div class="st-actions"><button class="btn btn-acc m-cta" id="mtAdd">${ICON.plus} Agregar prenda</button><button class="btn btn-line" id="mtEdit">${ICON.edit} Editar información</button><button class="btn btn-line" id="mtRules">${ICON.spark} Distintivos</button><a class="btn btn-line" href="#/mi-tienda/fotos">${ICON.cam} Fotos de la tienda</a><a class="btn btn-line" href="#/cuenta/estadisticas">${ICON.chart} Estadísticas</a></div>
      </div>
      <div class="st-strip lbl"><span><b>${items.filter(p => p.status === 'publicada' && avail(p)).length}</b> publicadas y disponibles</span><span><b>${items.filter(p => p.status === 'revision').length}</b> en revisión</span><span><b>${items.filter(p => !avail(p) && p.status !== 'retirada').length}</b> agotadas</span><span><b>${cols.length}</b> colecciones</span></div>
      <section id="mt-fotos" class="anchor mt-phys"><div class="sec-top"><div><h2 class="sub-h">Fotos de la tienda</h2><p class="d">Fachada, vitrina e interior. Salen en tu página para que la gente te reconozca al llegar. Hasta 6 fotos.</p></div>
          <label class="btn btn-line" for="mtPh">${ICON.cam} Subir fotos<input id="mtPh" type="file" accept="image/*" multiple hidden></label></div>
        <div class="phys-own" id="mtPhG"></div></section>
      <section id="mt-catalogo" class="anchor"><div class="sec-top"><h2 class="sub-h">Catálogo</h2><div class="mt-search"><span>${ICON.search}</span><input id="mtQ" type="search" placeholder="Buscar en mi catálogo" aria-label="Buscar en mi catálogo"></div></div>
        <div class="toolbar"><div class="chips" id="mtF">${['Todas','Publicada','En revisión','Agotada','Retirada'].map((f, i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${f}">${f === 'Todas' ? 'Todas' : f === 'En revisión' ? 'En revisión' : f + 's'} <sup>${f === 'Todas' ? items.filter(p => p.status !== 'retirada').length : items.filter(p => statusOf(p) === f).length}</sup></button>`).join('')}</div>
          <label class="sel lbl">Ordenar <select id="mtSort"><option value="rel">Recientes</option><option value="asc">Precio ↑</option><option value="desc">Precio ↓</option><option value="stock">Menos unidades</option></select></label></div>
        <div id="mtGrid"></div></section>
      <section id="mt-colecciones" class="anchor"><div class="sec-top"><div><h2 class="sub-h">Colecciones y playlists</h2><p class="d">Agrupa prendas de tu catálogo. Las públicas aparecen en tu página.</p></div><button class="btn btn-line" id="colNew">${ICON.plus} Nueva colección</button></div>
        <div id="mtCols"></div></section>
      ${vfoot()}`;
    let flt = 'Todas';
    const draw = () => {
      const q = norm($('#mtQ', el).value), o = $('#mtSort', el).value;
      let list = items.filter(p => (flt === 'Todas' ? p.status !== 'retirada' : statusOf(p) === flt) && (!q || norm(p.name).includes(q)));
      if (o === 'asc') list.sort((a, b) => a.price - b.price); if (o === 'desc') list.sort((a, b) => b.price - a.price); if (o === 'stock') list.sort((a, b) => (a.stock || 0) - (b.stock || 0));
      if (o === 'rel') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      $('#mtGrid', el).innerHTML = list.length ? `<div class="p-grid">${list.map(p => { const st = statusOf(p); return `
        <article class="p-card own">
          <div class="p-img" data-open="${p.id}">${imgOf(p)}<span class="badge st-b st-${stCls(st)}">${st}</span>${p.flag ? `<span class="badge flag${p.flag === 'nueva' ? ' alt' : ''}">${flagLabel(p.flag)}</span>` : ''}</div>
          <div class="p-row"><span class="p-name">${esc(p.name)}</span><span class="p-price">${money(p.price)}</span></div>
          <div class="p-row lbl p-meta"><span>${catOf(p)}</span><span class="${(p.stock || 0) <= 2 ? 'warn' : ''}">${p.stock || 0} u · ${(p.sizes || []).join(' ')}</span></div>
          <div class="own-acts">${st === 'Retirada' ? `<button class="btn btn-line sm" data-restore="${p.id}">Volver a publicar</button>` : `
            <button class="btn btn-line sm" data-edit="${p.id}">${ICON.edit} Editar</button><button class="btn btn-line sm" data-stock="${p.id}">${ICON.box} Unidades</button>
            <button class="qx" data-col="${p.id}" aria-label="Agregar a una colección" title="Agregar a una colección">${ICON.list}</button><button class="qx danger" data-del="${p.id}" aria-label="Retirar del catálogo" title="Retirar del catálogo">${ICON.trash}</button>`}</div>
        </article>`; }).join('')}</div>`
        : emptyState({icon:'box', title:items.length ? (q ? `No hay prendas con «${esc($('#mtQ', el).value)}»` : `No tienes prendas «${flt.toLowerCase()}»`) : 'Tu catálogo está vacío',
            text:items.length ? 'Cambia el filtro o la búsqueda.' : 'Agrega tu primera prenda: son tres pasos (fotos, datos y tallas).', actions:items.length ? [{label:'Ver todas', attr:'data-allf'}] : [{label:`${ICON.plus} Agregar mi primera prenda`, attr:'data-add', kind:'btn-acc'}]});
    };
    const drawCols = () => {
      const c = Object.entries(DB().pl).filter(([, p]) => p.owner.type === 'store' && p.owner.id === s.id);
      $('#mtCols', el).innerHTML = c.length ? `<div class="plc-grid">${c.map(([id, p]) => `<a class="plc" href="#/playlist/${id}"><div class="cv">${X.plCover(p) ? `<img src="${X.plCover(p)}" alt="">` : `<span>${ICON.list}</span>`}</div><b>${esc(p.name)}</b><span class="lbl">${p.ids.length}/${X.MAXPL} prendas · ${p.vis} · ${p.likes} me gusta</span></a>`).join('')}</div>`
        : emptyState({icon:'list', title:'Aún no tienes colecciones', text:'Arma colecciones como «Running de ciudad» o «Temporada de lluvias» para inspirar a tus clientes.', actions:[{label:'Crear colección', attr:'data-newcol', kind:'btn-acc'}]});
    };
    const drawPh = () => {
      const g = s.gallery || []; const ex = !g.length && X.storePhotos(s)[0];
      $('#mtPhG', el).innerHTML = g.length ? g.map((ph, i) => `<figure><img src="${ph.src}" alt="Foto ${i + 1} de la tienda"><figcaption class="lbl">${i === 0 ? 'Portada · fachada' : 'Foto ' + (i + 1)}</figcaption><button type="button" class="qx danger" data-rmph="${ph.id}" aria-label="Eliminar foto ${i + 1}">${ICON.trash}</button></figure>`).join('')
        : ex ? `<figure class="ex"><img src="${ex}" alt="Fachada de ejemplo"><figcaption class="lbl">Foto de ejemplo · sube la tuya para reemplazarla</figcaption></figure>`
        : emptyState({icon:'cam', title:'Aún no subes fotos de la tienda', text:'Las tiendas con foto de la fachada reciben más visitas desde el mapa.', small:true, actions:[{label:`${ICON.up} Subir fotos`, attr:'data-phup', kind:'btn-acc'}]});
    };
    drawPh();
    $('#mtPh', el).addEventListener('change', async e => { const files = [...e.target.files]; e.target.value = ''; const g = (s.gallery || []).slice();
      for (const f of files){ if (g.length >= 6){ toast('Máximo 6 fotos de la tienda', {error:true}); break; } if (!f.type.startsWith('image/')){ toast('Uno de los archivos no es una imagen', {error:true}); continue; }
        const r = await X.downscale(f, 1000); g.push({id:X.uid('ph'), src:r.src}); }
      X.setStore(s.id, {gallery:g}); s.gallery = g; drawPh(); toast(`${g.length} ${g.length === 1 ? 'foto' : 'fotos'} de la tienda en tu página`); });
    draw(); drawCols();
    chipsPick($('#mtF', el), false, b => { flt = b.dataset.f; draw(); });
    $('#mtQ', el).addEventListener('input', draw); $('#mtSort', el).addEventListener('change', draw);
    if (sec) setTimeout(() => { const t = $('#mt-' + sec, el); if (t) t.scrollIntoView({behavior:reduce ? 'auto' : 'smooth'}); }, 80);
    el.onclick = async e => {
      if (e.target.closest('#mtAdd,[data-add]')) return addWizard(s);
      if (e.target.closest('#mtEdit')) return editStoreInfo(s);
      if (e.target.closest('#mtRules')) return rulesDlg(s);
      if (e.target.closest('[data-phup]')) return $('#mtPh', el).click();
      const rp = e.target.closest('[data-rmph]'); if (rp){ if (!(await confirmDlg({title:'¿Eliminar esta foto?', text:'Dejará de verse en tu página.', ok:'Eliminar', danger:true}))) return;
        const prev = s.gallery || []; const g = prev.filter(x => x.id !== rp.dataset.rmph); X.setStore(s.id, {gallery:g}); s.gallery = g; drawPh(); toast('Foto eliminada', {undo:() => { X.setStore(s.id, {gallery:prev}); s.gallery = prev; drawPh(); }}); return; }
      if (e.target.closest('[data-allf]')){ flt = 'Todas'; $('#mtQ', el).value = ''; $$('#mtF .chip', el).forEach((c, i) => c.setAttribute('aria-pressed', i === 0)); draw(); }
      if (e.target.closest('#colNew,[data-newcol]')) return newCollection(s);
      const ed = e.target.closest('[data-edit]'); if (ed) return editItem(P[ed.dataset.edit]);
      const sk = e.target.closest('[data-stock]'); if (sk) return editStock(P[sk.dataset.stock]);
      const cl = e.target.closest('[data-col]'); if (cl) return colPicker(s, P[cl.dataset.col]);
      const rs = e.target.closest('[data-restore]'); if (rs){ X.setProd(rs.dataset.restore, {status:'publicada'}); toast('Prenda publicada de nuevo'); return X.route(); }
      const dl = e.target.closest('[data-del]'); if (dl){ const p = P[dl.dataset.del];
        if (await confirmDlg({title:'¿Retirar del catálogo?', text:`«${esc(p.name)}» dejará de verse en el radar y en las playlists aparecerá como no disponible. Podrás volver a publicarla.`, ok:'Retirar prenda', danger:true})){
          const prev = p.status; X.setProd(p.id, {status:'retirada'}); X.route(); toast('Prenda retirada', {undo:() => { X.setProd(p.id, {status:prev}); X.route(); }}); } }
    };
  }
  view('mi-tienda', {fn:vMiTienda, roles:['store'], acc:'#B9B9CA', title:'Mi tienda', keep:true});

  function editStoreInfo(s){
    const m = modal({title:'Editar información', kicker:esc(s.name), wide:true,
      body:`<form class="form-grid" id="esF" novalidate>
        <div class="field"><label for="esN">Nombre de la tienda</label><input id="esN" value="${esc(s.name)}"></div>
        <div class="field"><label for="esC">Categoría</label><input id="esC" value="${esc(s.cat)}" placeholder="Ej. Sport, Vintage, Sastrería"></div>
        <div class="field full"><label for="esD">Descripción</label><textarea id="esD" maxlength="200" placeholder="¿Qué vendes y qué te hace diferente?">${esc(s.desc)}</textarea><span class="f-hint">Máximo 200 caracteres.</span></div>
        <div class="field"><label for="esA">Dirección</label><input id="esA" value="${esc(s.dir)}" placeholder="Cra. 13 #57-22, Chapinero"></div>
        <div class="field"><label for="esB">Barrio</label><input id="esB" value="${esc(s.barrio === '—' ? '' : s.barrio)}"></div>
        <div class="field"><label for="esH">Horario</label><input id="esH" value="${esc(s.hours)}" placeholder="Lun a sáb · 10:00 a 20:00"></div>
        <div class="field"><label for="esT">Teléfono</label><input id="esT" value="${esc(s.tel)}" inputmode="tel"></div>
        <div class="field full"><label for="esP">Métodos de pago</label><input id="esP" value="${esc(s.pay)}" placeholder="Tarjeta, Nequi y efectivo"></div>
        <div class="field full"><span class="lab">Foto de la fachada ${tip('Una foto horizontal de la fachada de tu tienda. Si no subes una, mostramos el nombre de la tienda en grande.')}</span><label class="drop sm" for="esI">${ICON.up}<b class="lbl">Cambiar foto</b><input id="esI" type="file" accept="image/*" hidden></label></div>
      </form>`,
      actions:[{label:'Cancelar'}, {label:'Guardar cambios', kind:'btn-acc', onClick:async (mm, b) => {
        const g = id => $('#' + id, mm.el);
        if (!check([[g('esN'), V.req('Escribe el nombre de la tienda.'), V.min(3)], [g('esA'), V.req('Escribe la dirección para que te encuentren.')], [g('esH'), V.req('Escribe tu horario.')], [g('esT'), V.req('Escribe un teléfono de contacto.'), V.phone], [g('esD'), V.max(200)]])) return;
        const done = busy(b); await sleep(600); done();
        const patch = {name:g('esN').value.trim(), cat:g('esC').value.trim() || s.cat, desc:g('esD').value.trim(), dir:g('esA').value.trim(), barrio:g('esB').value.trim() || s.barrio, hours:g('esH').value.trim(), tel:g('esT').value.trim(), pay:g('esP').value.trim()};
        if (mm._img) patch.photoData = mm._img;
        const prev = Object.fromEntries(Object.keys(patch).map(k => [k, s[k]]));
        X.setStore(s.id, patch); mm.close(); X.route(); toast('Información actualizada', {undo:() => { X.setStore(s.id, prev); X.route(); }});
      }}]});
    $('#esI', m.el).addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; if (!f.type.startsWith('image/')) return fErr(e.target, 'Ese archivo no es una imagen.'); const r = await X.downscale(f, 1400); m._img = r.src; fErr(e.target, ''); e.target.closest('.drop').querySelector('b').textContent = 'Foto lista ✓'; });
  }

  /* distintivos automáticos: umbral de «Últimas unidades» y periodo de «Nueva llegada» */
  function rulesDlg(s){
    const thr = s.lowThr != null ? s.lowThr : 3, days = s.newDays || 14;
    modal({title:'Distintivos automáticos', kicker:'Mi tienda', cls:'mdl-sm',
      body:`<p class="mdl-p">StyleRadar pone estas etiquetas solas sobre tus prendas, según tu inventario y la fecha de publicación.</p>
        <div class="form-col"><div class="field"><label for="ruT">«Últimas unidades» cuando queden</label><div class="unit-row"><input id="ruT" type="number" min="1" max="20" value="${thr}" inputmode="numeric"><span class="lbl">unidades o menos</span></div></div>
        <div class="field"><label for="ruD">«Nueva llegada» durante</label><select id="ruD">${[7, 14, 21, 30].map(n => `<option value="${n}" ${n === days ? 'selected' : ''}>${n} días desde que se publica</option>`).join('')}</select></div></div>`,
      actions:[{label:'Cancelar'}, {label:'Guardar', kind:'btn-acc', onClick:(mm) => { const t = $('#ruT', mm.el);
        if (!check([[t, V.req('Escribe un número.'), v => +v >= 1 && +v <= 20 ? '' : 'Usa un número entre 1 y 20.']])) return;
        X.setStore(s.id, {lowThr:+t.value, newDays:+$('#ruD', mm.el).value}); mm.close(); X.route(); toast('Distintivos actualizados en tu catálogo'); }}]});
  }
  /* asistente de 3 pasos para publicar una prenda */
  function addWizard(s){
    let step = 1; const d = {files:[], name:'', cat:'', price:'', color:'', brand:s.name, style:'', material:'', tags:'', desc:'', units:{}, flag:'nueva'};
    const m = modal({title:'Agregar prenda', kicker:'Paso 1 de 3 · Fotos', wide:true, cls:'wiz', body:'<div id="wz"></div>',
      actions:[{label:'Atrás', onClick:() => { if (step > 1){ collect(); step--; draw(); } else close(); }}, {label:'Siguiente', kind:'btn-acc', onClick:(mm, b) => next(b)}]});
    const close = async () => { if ((d.files.length || d.name) && !(await confirmDlg({title:'¿Salir sin publicar?', text:'Perderás lo que llevas de esta prenda.', ok:'Salir', danger:true}))) return; m.close(); };
    m.el.querySelector('.mdl-x').replaceWith(Object.assign(document.createElement('button'), {className:'mdl-x', type:'button', innerHTML:ICON.x, onclick:close, ariaLabel:'Cerrar'}));
    m.el.querySelector('.modal-bg').onclick = e => { e.stopImmediatePropagation(); close(); };
    const W = () => $('#wz', m.el);
    const SIZES = cat => cat === 'Calzado' ? ['37','38','39','40','41','42'] : cat === 'Accesorios' ? ['Única'] : ['XS','S','M','L','XL'];
    const collect = () => {
      if (step === 2){ ['name','price','color','brand','style','material','tags','desc','cat'].forEach(k => { const i = $('#wz_' + k, m.el); if (i) d[k] = i.value; }); }
      if (step === 3){ $$('[data-u]', m.el).forEach(i => d.units[i.dataset.u] = i.value); d.flag = ($('#wzFlag [aria-pressed="true"]', m.el) || {}).dataset?.v || ''; }
    };
    const draw = () => {
      m.el.querySelector('.mdl-k').textContent = `Paso ${step} de 3 · ${['Fotos','Datos','Tallas y disponibilidad'][step - 1]}`;
      const bs = $$('.mdl-f .btn', m.el); bs[0].textContent = step === 1 ? 'Cancelar' : '← Atrás'; bs[1].innerHTML = step === 3 ? 'Enviar a revisión' : 'Siguiente →';
      const bar = `<ol class="wz-steps">${['Fotos','Datos','Tallas'].map((t, i) => `<li class="${i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''}"><span>${i + 1 < step ? '✓' : i + 1}</span>${t}</li>`).join('')}</ol>`;
      if (step === 1) W().innerHTML = `${bar}<div class="field" id="wzFf"><label class="drop" for="wzF" id="wzDrop">${ICON.up}<b class="lbl">Sube las fotos de la prenda</b><p>Hasta 5 fotos JPG o PNG. La primera será la portada. Fondo liso y buena luz.</p><input id="wzF" type="file" accept="image/*" multiple hidden></label></div><div class="thumbs" id="wzT">${d.files.map((f, i) => `<figure><img src="${f}" alt="Foto ${i + 1}"><button type="button" data-rmf="${i}" aria-label="Quitar foto ${i + 1}">×</button></figure>`).join('')}</div>`;
      if (step === 2) W().innerHTML = `${bar}<div class="form-grid"><h4 class="wz-g full"><span>1</span>Datos básicos</h4>
        <div class="field full"><label for="wz_name">Nombre de la prenda</label><input id="wz_name" value="${esc(d.name)}" maxlength="50" placeholder="Ej. Chaqueta rompevientos negra"></div>
        <div class="field"><label for="wz_cat">Categoría</label><select id="wz_cat"><option value="">Elige una</option>${LCATS.map(c => `<option ${d.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="wz_price">Precio (COP)</label><input id="wz_price" inputmode="numeric" value="${esc(d.price)}" placeholder="Ej. 189.000"></div>
        <fieldset class="wz-attrs full"><legend><span>2</span>Atributos de búsqueda</legend><p class="f-hint">Así te encuentran cuando alguien escribe «chaqueta negra de cuero» o filtra por color, marca y estilo.</p><div class="form-grid">
        <div class="field"><label for="wz_color">Color</label><select id="wz_color"><option value="">Elige uno</option>${COLORS.map(c => `<option ${d.color === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="wz_brand">Marca ${tip('Sirve para el filtro de marca del catálogo y para las recomendaciones.')}</label><input id="wz_brand" value="${esc(d.brand)}" maxlength="40" placeholder="Ej. ${esc(s.name)}"></div>
        <div class="field"><label for="wz_style">Estilo ${tip('Ayuda a que la prenda aparezca en los filtros de estilo del catálogo.')}</label><select id="wz_style"><option value="">Elige uno</option>${Object.entries(STYLES).map(([k, v]) => `<option value="${k}" ${d.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="wz_material">Material <span class="opt">opcional</span></label><select id="wz_material"><option value="">Elige uno</option>${['Algodón','Denim','Cuero','Lana','Lino','Poliéster','Punto','Sintético'].map(c => `<option ${d.material === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field full"><label for="wz_tags">Palabras clave <span class="opt">opcional</span> ${tip('Sepáralas con comas. Ej. oversize, impermeable, manga larga.')}</label><input id="wz_tags" value="${esc(d.tags)}" maxlength="80" placeholder="Ej. oversize, impermeable, manga larga"></div>
        </div></fieldset>
        <div class="field full"><label for="wz_desc">Descripción <span class="opt">opcional</span></label><textarea id="wz_desc" maxlength="300" placeholder="Material, calce, cuidados.">${esc(d.desc)}</textarea></div></div>`;
      if (step === 3){ const sz = SIZES(d.cat); W().innerHTML = `${bar}<p class="mdl-p">¿Cuántas unidades tienes por talla? Deja en 0 las tallas que no tienes.</p>
        <div class="units">${sz.map(z => `<label class="unit"><span>${z}</span><input type="number" min="0" max="999" inputmode="numeric" data-u="${z}" value="${d.units[z] != null ? d.units[z] : 0}" aria-label="Unidades talla ${z}"></label>`).join('')}</div>
        <div class="field" id="wzUf"><span class="f-err" role="alert"></span></div>
        <div class="field"><span class="lab">Etiqueta en el catálogo</span><div class="chips" id="wzFlag"><button type="button" class="chip" aria-pressed="${d.flag === 'nueva'}" data-v="nueva">Nueva llegada</button><button type="button" class="chip" aria-pressed="${d.flag === 'ultimas'}" data-v="ultimas">Últimas unidades</button><button type="button" class="chip" aria-pressed="${!d.flag}" data-v="">Ninguna</button></div></div>
        <div class="wz-sum"><div class="wz-img">${d.files[0] ? `<img src="${d.files[0]}" alt="">` : ''}</div><div><b>${esc(d.name)}</b><span class="lbl">${esc(d.cat)} · ${esc(d.color)} · ${esc(d.brand)} · ${STYLES[d.style] || ''}${d.material ? ' · ' + esc(d.material) : ''} · ${d.files.length} ${d.files.length === 1 ? 'foto' : 'fotos'}</span><span>${money(parseInt(String(d.price).replace(/\D/g, ''), 10))}</span></div></div>
        <p class="f-hint">${ICON.shield.replace('<svg', '<svg width="12" height="12"')} StyleRadar revisa cada prenda antes de publicarla (normalmente en menos de 24 h).</p>`;
        chipsPick($('#wzFlag', m.el)); }
      bind();
    };
    const bind = () => {
      const f = $('#wzF', m.el);
      if (f){ const add = async list => { for (const x of [...list]){ if (d.files.length >= 5){ toast('Máximo 5 fotos', {error:true}); break; } if (!x.type.startsWith('image/')){ fErr(f, 'Uno de los archivos no es una imagen. Usa JPG o PNG.'); continue; } const r = await X.downscale(x, 800); d.files.push(r.src); fErr(f, ''); } draw(); };
        f.addEventListener('change', e => add(e.target.files)); const dr = $('#wzDrop', m.el);
        ['dragenter','dragover'].forEach(t => dr.addEventListener(t, e => { e.preventDefault(); dr.classList.add('over'); })); ['dragleave','drop'].forEach(t => dr.addEventListener(t, e => { e.preventDefault(); dr.classList.remove('over'); }));
        dr.addEventListener('drop', e => add(e.dataTransfer.files));
        $$('[data-rmf]', m.el).forEach(b => b.addEventListener('click', () => { d.files.splice(+b.dataset.rmf, 1); draw(); })); }
      const pr = $('#wz_price', m.el); if (pr) pr.addEventListener('input', e => { const v = e.target.value.replace(/\D/g, ''); e.target.value = v ? (+v).toLocaleString('es-CO') : ''; });
    };
    const next = async b => {
      if (step === 1){ if (!d.files.length){ fErr($('#wzF', m.el), 'Agrega al menos una foto para continuar.'); return; } step = 2; return draw(); }
      if (step === 2){ collect(); if (!check([[$('#wz_name', m.el), V.req('Escribe el nombre de la prenda.'), V.min(4)], [$('#wz_cat', m.el), V.req('Elige la categoría.')], [$('#wz_price', m.el), V.money(10000)], [$('#wz_color', m.el), V.req('Elige el color.')], [$('#wz_brand', m.el), V.req('Escribe la marca.')], [$('#wz_style', m.el), V.req('Elige el estilo.')]])) return; step = 3; return draw(); }
      collect();
      const total = Object.values(d.units).reduce((a, v) => a + (parseInt(v, 10) || 0), 0);
      if (Object.values(d.units).some(v => !/^\d+$/.test(String(v)))){ const e = $('#wzUf .f-err', m.el); e.textContent = 'Usa solo números enteros (0 o más).'; $('#wzUf', m.el).classList.add('invalid'); return; }
      if (!total){ const e = $('#wzUf .f-err', m.el); e.textContent = 'Indica al menos 1 unidad en alguna talla.'; $('#wzUf', m.el).classList.add('invalid'); return; }
      const done = busy(b, 'Enviando…'); await sleep(900); done();
      const id = uid('np'); const price = parseInt(d.price.replace(/\D/g, ''), 10);
      const kind = d.cat === 'Calzado' ? 'Calzado' : d.cat === 'Accesorios' ? 'Accesorios' : 'Ropa';
      DB().prod[id] = {name:d.name.trim(), price, store:s.id, kind, lcat:d.cat, color:d.color, brand:d.brand.trim(), style:d.style, material:d.material, tags:d.tags.split(',').map(t => t.trim()).filter(Boolean), desc:d.desc, img:d.files[0], imgs:d.files.slice(), arrived:Date.now(), sizes:Object.keys(d.units).filter(k => +d.units[k] > 0), units:Object.fromEntries(Object.entries(d.units).map(([k, v]) => [k, +v])), stock:total, flag:d.flag, status:'revision', isNew:true, date:today()};
      DB().moderation.unshift({id:uid('m'), tipo:'Catálogo', origin:s.name, item:d.name.trim(), price, img:d.files[0], date:today(), note:'Prenda nueva', pid:id});
      save(); X.rebuild(); m.close(); X.route();
      toast(`<b>${esc(d.name)}</b> enviada a revisión`);
    };
    draw();
  }
  function editItem(p){
    const m = modal({title:'Editar prenda', kicker:esc(p.name), wide:true,
      body:`<div class="form-grid">
        <div class="field full"><label for="eiN">Nombre</label><input id="eiN" value="${esc(p.name)}" maxlength="50"></div>
        <div class="field"><label for="eiP">Precio (COP)</label><input id="eiP" inputmode="numeric" value="${(+p.price).toLocaleString('es-CO')}"></div>
        <div class="field"><label for="eiC">Categoría</label><select id="eiC">${LCATS.map(c => `<option ${catOf(p) === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="eiK">Color</label><select id="eiK">${COLORS.map(c => `<option ${p.color === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="eiB">Marca</label><input id="eiB" value="${esc(p.brand || storeName(p.store))}" maxlength="40"></div>
        <div class="field"><label for="eiS">Estilo</label><select id="eiS">${Object.entries(STYLES).map(([k, v]) => `<option value="${k}" ${p.style === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field full"><span class="lab">Etiqueta ${tip('Últimas unidades y Nueva llegada aparecen como etiqueta sobre la foto en el catálogo.')}</span><div class="chips" id="eiF"><button type="button" class="chip" aria-pressed="${p.flag === 'nueva'}" data-v="nueva">Nueva llegada</button><button type="button" class="chip" aria-pressed="${p.flag === 'ultimas'}" data-v="ultimas">Últimas unidades</button><button type="button" class="chip" aria-pressed="${!p.flag}" data-v="">Ninguna</button></div></div>
      </div>`,
      actions:[{label:'Cancelar'}, {label:'Guardar cambios', kind:'btn-acc', onClick:async (mm, b) => {
        const g = id => $('#' + id, mm.el);
        if (!check([[g('eiN'), V.req('El nombre no puede quedar vacío.'), V.min(4)], [g('eiP'), V.money(10000)]])) return;
        const done = busy(b); await sleep(500); done();
        const prev = {name:p.name, price:p.price, lcat:p.lcat, color:p.color, style:p.style, flag:p.flag};
        X.setProd(p.id, {brand:g('eiB').value.trim() || storeName(p.store), name:g('eiN').value.trim(), price:parseInt(g('eiP').value.replace(/\D/g, ''), 10), lcat:g('eiC').value, color:g('eiK').value, style:g('eiS').value, flag:$('#eiF [aria-pressed="true"]', mm.el).dataset.v});
        mm.close(); X.route(); toast('Prenda actualizada', {undo:() => { X.setProd(p.id, prev); X.route(); }});
      }}]});
    chipsPick($('#eiF', m.el));
    $('#eiP', m.el).addEventListener('input', e => { const v = e.target.value.replace(/\D/g, ''); e.target.value = v ? (+v).toLocaleString('es-CO') : ''; });
  }
  function editStock(p){
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['S','M','L'];
    const units = p.units || Object.fromEntries(sizes.map((z, i) => [z, Math.max(0, Math.round((p.stock || 0) / sizes.length) + (i === 0 ? (p.stock || 0) % sizes.length : 0))]));
    const waiting = Object.values(DB().users).filter(u => (u.alerts || []).some(a => a.pid === p.id && a.on)).length;
    const m = modal({title:'Unidades disponibles', kicker:esc(p.name), cls:'mdl-sm',
      body:`<p class="mdl-p">Actualiza cuántas unidades tienes hoy por talla. Lo que ves aquí es lo que ven tus clientes.</p>
        <div class="units">${Object.keys(units).map(z => `<label class="unit"><span>${z}</span><input type="number" min="0" max="999" data-u="${z}" value="${units[z]}" aria-label="Unidades talla ${z}"></label>`).join('')}</div>
        <div class="field" id="suF"><span class="f-err" role="alert"></span></div>
        ${waiting ? `<p class="f-hint">${ICON.bell.replace('<svg', '<svg width="12" height="12"')} ${waiting} ${waiting === 1 ? 'persona espera' : 'personas esperan'} que vuelva. Les avisaremos al guardar.</p>` : ''}`,
      actions:[{label:'Cancelar'}, {label:'Guardar', kind:'btn-acc', onClick:async (mm, b) => {
        const vals = $$('[data-u]', mm.el).map(i => [i.dataset.u, i.value]);
        if (vals.some(([, v]) => !/^\d+$/.test(v))){ $('#suF .f-err', mm.el).textContent = 'Usa solo números enteros, desde 0.'; $('#suF', mm.el).classList.add('invalid'); return; }
        const done = busy(b); await sleep(500); done();
        const nu = Object.fromEntries(vals.map(([k, v]) => [k, +v])); const total = Object.values(nu).reduce((a, v) => a + v, 0);
        const was = p.stock || 0; X.setProd(p.id, {units:nu, stock:total});
        let notified = 0;
        if (!was && total){ Object.entries(DB().users).forEach(([email, u]) => { if ((u.alerts || []).some(a => a.pid === p.id && a.on)){ X.pushNotif(email, {icon:'bell', t:'Volvió a estar disponible', d:`${p.name} llegó de nuevo a ${storeName(p.store)}.`, href:'#/tienda/' + p.store}); notified++; } }); }
        mm.close(); X.route();
        toast(total ? `${total} unidades disponibles${notified ? ` · avisamos a <b>${notified}</b> ${notified === 1 ? 'persona' : 'personas'}` : ''}` : 'Marcada como <b>agotada</b>');
      }}]});
  }
  function newCollection(s, first){
    const m = modal({title:'Nueva colección', kicker:esc(s.name), cls:'mdl-sm',
      body:`<div class="form-col"><div class="field"><label for="ncN">Título</label><input id="ncN" maxlength="40" placeholder="Ej. Temporada de lluvias"></div>
        <div class="field"><label for="ncD">Descripción <span class="opt">opcional</span></label><textarea id="ncD" maxlength="160"></textarea></div>
        <div class="field"><span class="lab">Visibilidad</span><div class="seg-toggle" id="ncV"><button type="button" aria-pressed="true" data-v="Pública">${ICON.eye} Pública</button><button type="button" aria-pressed="false" data-v="Privada">${ICON.lock} Borrador</button></div></div></div>`,
      actions:[{label:'Cancelar'}, {label:'Crear colección', kind:'btn-acc', onClick:(mm) => {
        const n = $('#ncN', mm.el); if (!check([[n, V.req('Ponle un título.'), V.min(3)]])) return;
        const id = uid('s'); DB().pl[id] = {name:n.value.trim(), desc:$('#ncD', mm.el).value.trim(), vis:$('#ncV [aria-pressed="true"]', mm.el).dataset.v, owner:{type:'store', id:s.id, name:s.name}, updated:'ahora', likes:0, saves:0, ids:first ? [first] : []};
        save(); mm.close(); X.route(); toast(`Colección <b>${esc(n.value.trim())}</b> creada`);
      }}]});
    $('#ncV', m.el).addEventListener('click', e => { const b = e.target.closest('button'); if (b) $$('#ncV button', m.el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  }
  function colPicker(s, p){
    if (X.isGadget && X.isGadget(p)) return toast('Audífonos, relojes y joyería no van en las colecciones de la tienda; sí en el catálogo y en las playlists de estilo', {error:true});
    const cols = Object.entries(DB().pl).filter(([, c]) => c.owner.type === 'store' && c.owner.id === s.id);
    const m = modal({title:'Agregar a una colección', kicker:esc(p.name), cls:'mdl-sm',
      body:`<ul class="pick-list">${cols.map(([id, c]) => { const has = c.ids.includes(p.id), full = c.ids.length >= X.MAXPL; return `<li><button type="button" data-c="${id}" ${has || full ? 'disabled' : ''}><span class="cv">${ICON.list}</span><span><b>${esc(c.name)}</b><em>${c.ids.length}/${X.MAXPL}${has ? ' · ya está' : full ? ' · llena' : ''}</em></span>${has ? ICON.check : ICON.plus}</button></li>`; }).join('')
        || `<li class="pick-empty">${emptyState({icon:'list', title:'No tienes colecciones', small:true})}</li>`}</ul>`,
      actions:[{label:'Cancelar'}, {label:`${ICON.plus} Nueva colección`, kind:'btn-acc', onClick:mm => { mm.close(); newCollection(s, p.id); }}]});
    $$('[data-c]', m.el).forEach(b => b.addEventListener('click', () => { const c = DB().pl[b.dataset.c]; c.ids.push(p.id); save(); m.close(); X.route(); toast(`Agregada a <b>${esc(c.name)}</b>`, {undo:() => { c.ids = c.ids.filter(x => x !== p.id); save(); X.route(); }}); }));
  }

  /* =====================================================================
     CUENTA (tienda y fundación): información interna, estadísticas, suscripción
     ===================================================================== */
  function vCuenta(el, [sec = 'info']){
    const r = X.role(); const ent = r === 'store' ? myStore() : myFound();
    const secs = r === 'store' ? [['info','Información de la tienda'],['estadisticas','Estadísticas'],['suscripcion','Suscripción']] : [['info','Información de la fundación'],['estadisticas','Estadísticas'],['estado','Estado de la cuenta']];
    el.innerHTML = `${crumbs({t:r === 'store' ? 'Mi tienda' : 'Mi fundación', href:X.HOME[r]}, {t:'Mi cuenta'})}
      <header class="pf-head"><div class="pf-av" aria-hidden="true">${ini(ent.short || ent.name)}</div>
        <div><h1 class="pf-name">${esc(ent.short || ent.name)}</h1><div class="pf-sub lbl">${r === 'store' ? 'Tienda aliada' : 'Fundación aliada'} · ${esc(X.me().email)} · desde ${ent.since}</div></div>
        <div class="pf-stats">${r === 'store' ? `<div><b>${ent.verif}</b><span class="lbl">Verificación</span></div><div><b>${ent.sub.estado}</b><span class="lbl">Suscripción</span></div>`
          : `<div><b>${DB().donations.filter(d => d.fid === ent.id && d.status === 'pendiente').length}</b><span class="lbl">Pendientes</span></div><div><b>${DB().donations.filter(d => d.fid === ent.id && d.status === 'recibida').length}</b><span class="lbl">Recibidas</span></div><div><b>${ent.state}</b><span class="lbl">Estado</span></div>`}</div></header>
      <div class="pf-body"><nav class="pf-nav" aria-label="Secciones">${secs.map(([k, t]) => `<a href="#/cuenta/${k}" class="${k === sec ? 'on' : ''}">${t}</a>`).join('')}<button class="btn btn-line" id="acOut">${ICON.out} Cerrar sesión</button></nav><div id="acS"></div></div>${vfoot()}`;
    $('#acOut', el).addEventListener('click', X.logout);
    const S = $('#acS', el);
    if (sec === 'estadisticas') return r === 'store' ? storeStats(S, ent) : foundStats(S, ent);
    if (sec === 'suscripcion' && r === 'store') return storeSub(S, ent);
    if (sec === 'estado' && r === 'found') return foundState(S, ent);
    internalInfo(S, ent, r);
  }
  view('cuenta', {fn:vCuenta, roles:['store','found'], acc:'#48119A', title:'Mi cuenta'});

  function internalInfo(S, e, r){
    S.innerHTML = `<section class="pf-sec"><h2>${r === 'store' ? 'Información de la tienda' : 'Información de la fundación'}</h2><p class="d">Datos legales y de contacto de la ${r === 'store' ? 'tienda' : 'fundación'}. StyleRadar los usa para verificarla y facturar; no se muestran al público.</p>
      <form class="pf-form" id="iiF" novalidate>
        <div class="field two"><label for="iiN">${r === 'store' ? 'Razón social' : 'Nombre legal'}</label><input id="iiN" value="${esc(e.legal || e.name)}"></div>
        <div class="field"><label for="iiT">NIT ${tip('Número de identificación tributaria con dígito de verificación, por ejemplo 901.482.337-1.')}</label><input id="iiT" value="${esc(e.nit)}" placeholder="000.000.000-0"></div>
        <div class="field two"><label for="iiR">Representante legal</label><input id="iiR" value="${esc(e.rep)}"></div>
        <div class="field"><label for="iiP">Teléfono</label><input id="iiP" value="${esc(e.tel)}" inputmode="tel"></div>
        <div class="field two"><label for="iiE">Correo de la cuenta</label><input id="iiE" value="${esc(X.me().email)}" disabled></div>
        <div class="field"><label for="iiB">${r === 'store' ? 'Cuenta para pagos' : 'Cuenta para certificados'}</label><input id="iiB" value="${esc(e.bank || (r === 'store' ? 'Bancolombia ••• 4410' : 'Certificados de donación por correo'))}"></div>
        <div class="full form-acts"><button class="btn btn-line" type="button" id="iiX">Descartar</button><button class="btn btn-acc" type="submit">Guardar</button></div></form></section>`;
    $('#iiX', S).addEventListener('click', () => { X.route(); toast('Cambios descartados'); });
    $('#iiF', S).addEventListener('submit', async ev => { ev.preventDefault();
      if (!check([[$('#iiN', S), V.req('Escribe el nombre legal.')], [$('#iiT', S), V.req('Escribe el NIT.'), v => /^[\d.]{9,13}-\d$/.test(v.trim()) ? '' : 'Escribe el NIT con dígito de verificación, por ejemplo 901.482.337-1.'], [$('#iiR', S), V.req('Escribe el nombre del representante.')], [$('#iiP', S), V.req('Escribe un teléfono.'), V.phone]])) return;
      const done = busy(ev.submitter || $('#iiF [type=submit]', S)); await sleep(600); done();
      const patch = {legal:$('#iiN', S).value.trim(), nit:$('#iiT', S).value.trim(), rep:$('#iiR', S).value.trim(), tel:$('#iiP', S).value.trim(), bank:$('#iiB', S).value.trim()};
      if (r === 'store') X.setStore(e.id, patch); else X.setFound(e.id, patch); toast('Información guardada'); });
  }
  function storeStats(S, s){
    const R = seed(s.id); const items = X.storeItems(s.id).filter(p => p.status === 'publicada'); const bk = X.bk;
    const days = [...Array(24)].map((_, i) => { const d = new Date(2026, 7, 31 + i); const wk = d.getDay(); const boost = wk === 6 || wk === 0 ? 1.35 : 1;
      return {k:d.getDate() + ' ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()], full:d.toLocaleDateString('es-CO', {weekday:'short', day:'numeric', month:'short'}),
        vis:Math.round((70 + R() * 50) * boost), sav:Math.round((24 + R() * 22) * boost), hold:Math.round((3 + R() * 7) * boost)}; });
    const top = items.map(p => [p.name, Math.round(8 + R() * 60)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const visits = days.reduce((a, w) => a + w.vis, 0), holds = days.reduce((a, w) => a + w.hold, 0);
    const inv = [['Disponibles', items.filter(p => avail(p) && !(p.stock <= 3)).length], ['Últimas unidades', items.filter(p => avail(p) && p.stock <= 3).length], ['Agotadas', items.filter(p => !avail(p)).length]];
    const goal = 500;
    S.innerHTML = `<section class="pf-sec"><h2>Estadísticas</h2><p class="d">Últimas semanas · solo tú y StyleRadar ven estos datos.</p>
      <div class="kpis">${kpi(visits.toLocaleString('es-CO'), 'Visitas a tu página', '▲ 12% vs. periodo anterior', 'up')}${kpi(holds, 'Mensajes de clientes', '▲ 4%', 'up')}${kpi(days.reduce((a, w) => a + w.sav, 0).toLocaleString('es-CO'), 'Guardadas en wishlist')}${kpi(Math.round(visits * .03), 'Clics en «Cómo llegar»', '▼ 2%', 'down')}</div>
      ${items.length ? `<div class="card ch-wide"><h3 class="card-h">Visitas, guardadas y mensajes por día</h3>
          ${bk.composed({data:days, area:{key:'vis', label:'Visitas'}, bar:{key:'sav', label:'Guardadas'}, line:{key:'hold', label:'Mensajes'}, ticks:8, h:280, label:'Visitas, guardadas y mensajes por día'})}</div>
        <div class="ch-grid2"><div class="card"><h3 class="card-h">Viendo tu tienda ahora</h3><p class="card-sub">Personas con tu página abierta, en tiempo real.</p>
            ${bk.live({base:14, vol:1.6, min:2, drift:.5, unit:'Personas', label:'Personas viendo tu tienda ahora'})}</div>
          <div class="card"><h3 class="card-h">Meta de visitas de la semana</h3><p class="card-sub">${Math.round(visits / 6).toLocaleString('es-CO')} de ${goal.toLocaleString('es-CO')} visitas esta semana.</p>
            ${bk.gauge({value:Math.min(100, Math.round(visits / 6 / goal * 100)), center:Math.min(100, Math.round(visits / 6 / goal * 100)), fmt:'pct', label:'de la meta'})}</div></div>
        <div class="ch-grid2"><div class="card"><h3 class="card-h">Prendas más guardadas</h3>${bk.hbars({data:top, unit:'Guardada', fmt:'int', lw:150, label:'Prendas más guardadas'})}</div>
          <div class="card"><h3 class="card-h">Inventario</h3>${bk.ring({data:inv, total:'Prendas', label:'Inventario por estado'})}</div></div>`
        : emptyState({icon:'chart', title:'Aún no hay datos suficientes', text:'Cuando publiques prendas y la gente visite tu página, verás aquí visitas, mensajes y las prendas más guardadas.', actions:[{label:'Agregar prendas', href:'#/mi-tienda', kind:'btn-acc'}]})}</section>`;
  }
  function storeSub(S, s){
    const sub = s.sub; const price = PLAN.store.price;
    const pays = DB().payments.filter(p => p.name === s.name);
    const cls = {Activa:'ok', 'Periodo gratuito':'wait', Cancelada:'off', Vencida:'off', 'Sin suscripción':'off'}[sub.estado];
    S.innerHTML = `<section class="pf-sec"><h2>Suscripción</h2><p class="d">La suscripción mantiene tu catálogo visible en el radar después del periodo gratuito de 30 días.</p>
      <article class="plan cur wide"><span class="st st-${cls}">${sub.estado}</span><h3>Tienda aliada</h3><div class="pr tabular">${money(price)} <small>/ mes</small></div>
        <ul><li>Catálogo ilimitado visible en el radar y en el mapa</li><li>Colecciones y playlists de tienda</li><li>Estadísticas de visitas, guardados y mensajes</li><li>Avisos automáticos a quienes esperan una prenda</li></ul>
        <div class="bill"><span>${sub.estado === 'Periodo gratuito' ? 'Periodo gratuito hasta' : sub.estado === 'Cancelada' ? 'Visible hasta' : 'Próximo cobro'}: <b>${sub.next}</b></span><span>Desde: <b>${sub.start}</b></span><span>Método: <b>${sub.method || 'Tarjeta •••• 7730'}</b></span></div>
        <div class="pf-row-actions">${sub.estado === 'Activa' ? `<button class="btn btn-line danger" id="subCancel">Cancelar renovación</button><button class="btn btn-line" id="subMethod">Cambiar método de pago</button>`
          : `<button class="btn btn-acc" id="subOn">${sub.estado === 'Cancelada' ? 'Reactivar renovación' : 'Activar suscripción'}</button>`}</div></article>
      </section>`;
    const on = $('#subOn', S), off = $('#subCancel', S), mt = $('#subMethod', S);
    if (on) on.addEventListener('click', () => {
      const m = modal({title:sub.estado === 'Cancelada' ? 'Reactivar renovación' : 'Activar suscripción', kicker:'Tienda aliada · ' + money(price) + ' / mes', cls:'mdl-sm',
        body:`<div class="form-col"><div class="field"><span class="lab">Método de pago</span><div class="chips" id="pmC"><button type="button" class="chip" aria-pressed="true">Tarjeta •••• 7730</button><button type="button" class="chip" aria-pressed="false">PSE</button><button type="button" class="chip" aria-pressed="false">Nequi</button></div></div>
          <label class="check"><input type="checkbox" id="pmOk"> Autorizo el cobro mensual de ${money(price)}. Puedo cancelar cuando quiera.</label></div>`,
        actions:[{label:'Cancelar'}, {label:'Confirmar y activar', kind:'btn-acc', onClick:async (mm, b) => {
          if (!check([[$('#pmOk', mm.el), V.req('Autoriza el cobro para activar la suscripción.')]])) return;
          const done = busy(b, 'Procesando pago…'); await sleep(1100); done();
          const method = $('#pmC [aria-pressed="true"]', mm.el).textContent;
          X.setStore(s.id, {sub:Object.assign({}, sub, {estado:'Activa', next:'23 oct 2026', method, start:sub.start === '—' ? today() : sub.start})});
          if (sub.estado !== 'Cancelada') DB().payments.unshift({ref:'SR-' + (1100 + DB().payments.length), date:today(), sort:999, name:s.name, tipo:'Tienda', concept:'Tienda aliada · mensual', amount:price, method, estado:'Aprobado'});
          save(); mm.close(); X.route(); toast('Suscripción <b>activa</b>. Tu catálogo sigue en el radar.'); }}]});
      chipsPick($('#pmC', m.el));
    });
    if (off) off.addEventListener('click', async () => {
      const ok = await confirmDlg({title:'¿Cancelar la renovación?', text:`Tu catálogo seguirá visible hasta el ${sub.next}. Después dejará de aparecer en el radar y en las playlists, hasta que reactives la suscripción.`, ok:'Cancelar renovación', cancel:'Mantener suscripción', danger:true, kicker:'Suscripción'});
      if (!ok) return; X.setStore(s.id, {sub:Object.assign({}, sub, {estado:'Cancelada'})}); X.route();
      toast('Renovación cancelada', {undo:() => { X.setStore(s.id, {sub:Object.assign({}, sub, {estado:'Activa'})}); X.route(); }});
    });
    if (mt) mt.addEventListener('click', () => toast('Te enviamos un enlace seguro para cambiar el método de pago'));
  }

  /* =====================================================================
     FUNDACIÓN · Mi fundación (editable) y Donaciones
     ===================================================================== */
  const ACCEPT_OPTS = ['Chaquetas y abrigos','Suéteres y buzos','Calzado cerrado','Cobijas','Ropa infantil','Uniformes escolares','Ropa de adulto','Ropa formal','Ropa de cama','Zapatos'];
  function vMiFundacion(el){
    const f = myFound(); if (!f){ el.innerHTML = emptyState({icon:'gift', title:'No encontramos tu fundación'}); return; }
    const pend = DB().donations.filter(d => d.fid === f.id && d.status === 'pendiente').length;
    const incomplete = !f.mission || !f.dir || !f.accepts.length;
    el.innerHTML = `${X.foundHero(f)}<div class="st-crumbs">${crumbs({t:'Mi fundación'}, {t:'Vista de administrador'})}</div>
      <div class="own-bar"><span class="lbl">${ICON.eye} Así ven tu página las personas que quieren donar</span><div><span class="st st-${f.state === 'Activa' ? 'ok' : 'off'}">${f.state}</span></div></div>
      ${incomplete ? `<div class="banner">${ICON.spark}<div><b>Completa tu página</b><span>Agrega tu misión, dirección y qué reciben. Las fundaciones con la página completa reciben 3 veces más donaciones.</span></div><button class="btn btn-acc sm" data-editf>Completar ahora</button></div>` : ''}
      ${pend ? `<div class="banner warn">${ICON.gift}<div><b>Tienes ${pend} ${pend === 1 ? 'donación pendiente' : 'donaciones pendientes'}</b><span>Acéptalas o recházalas para que las personas sepan qué hacer.</span></div><a class="btn btn-acc sm" href="#/donaciones?f=pendiente">Revisar</a></div>` : ''}
      ${X.foundBody(f, true)}
      <div class="fd-acts"><button class="btn btn-acc m-cta" data-editf>${ICON.edit} Editar información</button><a class="btn btn-line" href="#/donaciones">${ICON.box} Ver donaciones</a></div>${vfoot()}`;
    el.onclick = e => { if (e.target.closest('[data-editf]')) editFound(f); };
  }
  view('mi-fundacion', {fn:vMiFundacion, roles:['found'], acc:() => (myFound() || {}).color || '#48119A', title:'Mi fundación'});
  function editFound(f){
    const needs = f.needs.concat([['', 0], ['', 0], ['', 0]]).slice(0, 3);
    const m = modal({title:'Editar información', kicker:esc(f.name), wide:true,
      body:`<form class="form-grid" novalidate>
        <div class="field"><label for="efN">Nombre</label><input id="efN" value="${esc(f.name)}"></div>
        <div class="field"><label for="efS">Nombre corto ${tip('Así aparece en las tarjetas y en el mapa. Máximo 22 caracteres.')}</label><input id="efS" maxlength="22" value="${esc(f.short)}"></div>
        <div class="field full"><label for="efM">Misión</label><textarea id="efM" maxlength="300" placeholder="¿A quién ayudan y cómo?">${esc(f.mission)}</textarea><span class="f-hint">Entre 30 y 300 caracteres.</span></div>
        <div class="field"><label for="efA">Dirección</label><input id="efA" value="${esc(f.dir)}"></div><div class="field"><label for="efB">Barrio</label><input id="efB" value="${esc(f.barrio === '—' ? '' : f.barrio)}"></div>
        <div class="field"><label for="efH">Horario de recepción</label><input id="efH" value="${esc(f.hours)}" placeholder="Lun a vie · 8:00 a 17:00"></div><div class="field"><label for="efT">Teléfono</label><input id="efT" value="${esc(f.tel)}"></div>
        <div class="field"><label for="efE">Correo público</label><input id="efE" type="email" value="${esc(f.email)}"></div><div class="field"><label for="efW">Web <span class="opt">opcional</span></label><input id="efW" value="${esc(f.web === '—' ? '' : f.web)}"></div>
        <div class="field full"><span class="lab">Qué reciben</span><div class="chips" id="efAc">${ACCEPT_OPTS.map(a => `<button type="button" class="chip" aria-pressed="${f.accepts.includes(a)}">${a}</button>`).join('')}</div></div>
        <div class="field full"><span class="lab">Lo que más necesitan ${tip('Escribe la necesidad y qué tanto de la meta llevan. Deja vacío lo que no uses.')}</span>
          ${needs.map(([t, v], i) => `<div class="need-row"><input data-nt="${i}" value="${esc(t)}" placeholder="Ej. Chaquetas talla M" aria-label="Necesidad ${i + 1}"><input type="number" min="0" max="100" data-nv="${i}" value="${Math.round(v * 100)}" aria-label="Porcentaje de la meta ${i + 1}"><span>%</span></div>`).join('')}</div>
      </form>`,
      actions:[{label:'Cancelar'}, {label:'Guardar cambios', kind:'btn-acc', onClick:async (mm, b) => {
        const g = id => $('#' + id, mm.el);
        if (!check([[g('efN'), V.req('Escribe el nombre.'), V.min(4)], [g('efS'), V.req('Escribe un nombre corto.')], [g('efM'), V.req('Cuéntale a la gente su misión.'), V.min(30)], [g('efA'), V.req('Escribe la dirección donde reciben.')], [g('efH'), V.req('Escribe el horario.')], [g('efT'), V.req('Escribe un teléfono.'), V.phone], [g('efE'), V.req('Escribe un correo.'), V.email]])) return;
        const acc = $$('#efAc .chip[aria-pressed="true"]', mm.el).map(c => c.textContent);
        if (!acc.length){ fErr($('#efAc', mm.el), 'Elige al menos un tipo de prenda que reciban.'); return; }
        const nd = [0, 1, 2].map(i => [$(`[data-nt="${i}"]`, mm.el).value.trim(), Math.min(100, Math.max(0, +$(`[data-nv="${i}"]`, mm.el).value || 0)) / 100]).filter(([t]) => t);
        const done = busy(b); await sleep(600); done();
        const prev = JSON.parse(JSON.stringify({name:f.name, short:f.short, mission:f.mission, dir:f.dir, barrio:f.barrio, hours:f.hours, tel:f.tel, email:f.email, web:f.web, accepts:f.accepts, needs:f.needs}));
        X.setFound(f.id, {name:g('efN').value.trim(), short:g('efS').value.trim(), mission:g('efM').value.trim(), dir:g('efA').value.trim(), barrio:g('efB').value.trim() || f.barrio, hours:g('efH').value.trim(), tel:g('efT').value.trim(), email:g('efE').value.trim(), web:g('efW').value.trim(), accepts:acc, needs:nd});
        mm.close(); X.route(); toast('Página actualizada', {undo:() => { X.setFound(f.id, prev); X.route(); }});
      }}]});
    chipsPick($('#efAc', m.el), true, () => fErr($('#efAc', m.el), ''));
  }

  const DSTAT = {pendiente:['Pendiente','wait'], aceptada:['Aceptada','ok'], recogida:['Entrega acordada','info'], recibida:['Recibida','done'], rechazada:['Rechazada','off']};
  function vDonaciones(el, args, q){
    const f = myFound(); const all = () => DB().donations.filter(d => d.fid === f.id);
    let flt = q.f || 'todas', origin = '', query = '';
    const cnt = k => all().filter(d => k === 'todas' || d.status === k).length;
    el.innerHTML = `${crumbs({t:'Mi fundación', href:'#/mi-fundacion'}, {t:'Donaciones'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">Catálogo de donaciones</span><h1 class="v-title">Donaciones</h1><p class="v-lead">Solo ves lo que personas y tiendas quieren donarle a ${esc(f.short)}. Cada solicitud llega completa, con la prenda, el punto y la franja de entrega. Acéptala o recházala y confirma cuando la recibas.</p></div></div>
      <div class="toolbar"><div class="chips" id="dnF">${[['todas','Todas'], ...Object.entries(DSTAT).map(([k, [t]]) => [k, t])].map(([k, t]) => `<button class="chip" aria-pressed="${k === flt}" data-f="${k}">${t} <sup>${cnt(k)}</sup></button>`).join('')}</div>
        <div class="tb-r"><div class="mt-search"><span>${ICON.search}</span><input id="dnQ" type="search" placeholder="Buscar prenda o donante" aria-label="Buscar donaciones"></div>
          <label class="sel lbl">Origen <select id="dnO"><option value="">Todos</option><option value="usuario">Personas</option><option value="tienda">Tiendas</option></select></label></div></div>
      <div id="dnL"></div>${vfoot()}`;
    const draw = () => {
      const list = all().filter(d => (flt === 'todas' || d.status === flt) && (!origin || d.from.type === origin) && (!query || norm(d.item + ' ' + d.from.name).includes(norm(query))));
      $('#dnL', el).innerHTML = list.length ? `<div class="dn-grid">${list.map(d => { const [t, c] = DSTAT[d.status]; return `
        <article class="dn-card">
          <div class="dn-img">${d.img || d.thumb ? `<img src="${d.img || A.thumbs[d.thumb]}" alt="">` : ICON.box}<span class="st st-${c}">${t}</span></div>
          <div class="dn-b"><b>${esc(d.item)}</b>
            <span class="lbl">${d.qty > 1 ? d.qty + ' unidades · ' : ''}${esc(d.kind)} · talla ${esc(d.talla)} · ${esc(d.cond)}</span>
            <span class="dn-from"><span class="tag ${d.from.type}">${d.from.type === 'tienda' ? 'Tienda' : 'Persona'}</span>${esc(d.from.name)} · ${d.date}</span>
            ${d.pickup ? `<span class="rc-note">${ICON.clock} ${d.pickup.how ? esc(d.pickup.how) + ' · ' : ''}${d.pickup.date} · ${d.pickup.slot} · ${esc(d.pickup.dir)}</span>` : d.status === 'pendiente' ? `<span class="rc-note">${ICON.clock} Entrega en la sede, en el horario de la fundación</span>` : ''}${d.chat ? `<a class="rc-note" href="#/mensajes/${d.chat}">${ICON.chat || ''} Ver conversación con ${esc(d.from.name.split(' ')[0])}</a>` : ''}${d.reason ? `<span class="rc-note">${ICON.alert} ${esc(d.reason)}</span>` : ''}
          </div>
          <div class="dn-a">${d.status === 'pendiente' ? `<button class="btn btn-line sm" data-rej="${d.id}">Rechazar</button><button class="btn btn-acc sm" data-acc="${d.id}">${ICON.check} Aceptar</button>`
            : ['aceptada','recogida'].includes(d.status) ? `<button class="btn btn-line sm" data-pick="${d.id}">${ICON.chat || ''} Escribir</button><button class="btn btn-acc sm" data-recv="${d.id}">${ICON.check} Confirmar recepción</button>`
            : `<span class="lbl muted">${d.status === 'recibida' ? 'Donación cerrada' : 'Sin acciones'}</span>`}</div>
        </article>`; }).join('')}</div>`
        : emptyState({icon:'gift', title:all().length ? 'No hay donaciones en este filtro' : 'Aún no has recibido donaciones', text:all().length ? 'Prueba con otro estado u origen.' : 'Cuando una persona o una tienda elija tu fundación, su solicitud aparecerá aquí. Completar tu página ayuda a recibir más.', actions:all().length ? [{label:'Ver todas', attr:'data-alld', kind:'btn-acc'}] : [{label:'Completar mi página', href:'#/mi-fundacion', kind:'btn-acc'}]});
    };
    draw();
    chipsPick($('#dnF', el), false, b => { flt = b.dataset.f; draw(); });
    $('#dnO', el).addEventListener('change', e => { origin = e.target.value; draw(); });
    $('#dnQ', el).addEventListener('input', e => { query = e.target.value; draw(); });
    const notifyDonor = (d, t, desc) => { if (d.from.email) X.pushNotif(d.from.email, {icon:'gift', t, d:desc, href:'#/perfil/publicaciones'}); };
    const refresh = () => { save(); X.route(); };
    el.onclick = async e => {
      if (e.target.closest('[data-alld]')){ flt = 'todas'; origin = ''; $('#dnO', el).value = ''; $$('#dnF .chip', el).forEach(c => c.setAttribute('aria-pressed', c.dataset.f === 'todas')); draw(); }
      const ac = e.target.closest('[data-acc]'); if (ac){ const d = all().find(x => x.id === ac.dataset.acc);
        if (!(await confirmDlg({title:'¿Aceptar esta donación?', text:`Aceptas la prenda y la entrega que propuso ${esc(d.from.name)}${d.pickup ? ` (${d.pickup.date}, ${d.pickup.slot}, ${esc(d.pickup.dir)})` : ''}. Le avisaremos.`, ok:'Aceptar donación'}))) return;
        d.status = 'aceptada'; notifyDonor(d, 'Tu donación fue aceptada', `${f.short} aceptó «${d.item}». La entrega queda como la propusiste.`); refresh(); toast('Donación aceptada', {undo:() => { d.status = 'pendiente'; refresh(); }}); }
      const rj = e.target.closest('[data-rej]'); if (rj){ const d = all().find(x => x.id === rj.dataset.rej);
        modal({title:'Rechazar donación', kicker:esc(d.item), cls:'mdl-sm', body:`<div class="form-col"><div class="field"><label for="rjR">Motivo</label><select id="rjR"><option value="">Elige un motivo</option><option>No recibimos este tipo de prenda</option><option>La prenda no está en buen estado</option><option>No tenemos espacio este mes</option><option>Otro</option></select></div>
          <div class="field"><label for="rjM">Mensaje para ${esc(d.from.name)}</label><textarea id="rjM" maxlength="200" placeholder="Explica con amabilidad y, si puedes, sugiere otra fundación."></textarea></div></div>`,
          actions:[{label:'Cancelar'}, {label:'Rechazar donación', kind:'btn-danger', onClick:mm => { if (!check([[$('#rjR', mm.el), V.req('Elige un motivo para que la persona entienda.')]])) return;
            d.status = 'rechazada'; d.reason = $('#rjR', mm.el).value + ($('#rjM', mm.el).value.trim() ? ' · ' + $('#rjM', mm.el).value.trim() : ''); notifyDonor(d, 'Tu donación no fue aceptada', `${f.short}: ${d.reason}`); mm.close(); refresh();
            toast('Donación rechazada', {undo:() => { d.status = 'pendiente'; delete d.reason; refresh(); }}); }}]}); }
      const pk = e.target.closest('[data-pick]'); if (pk){ const d = all().find(x => x.id === pk.dataset.pick);
        const c = X.donationChat(f, d);
        save(); location.hash = '#/mensajes/' + c.id; }
      const rc = e.target.closest('[data-recv]'); if (rc){ const d = all().find(x => x.id === rc.dataset.recv);
        if (!(await confirmDlg({title:'¿Confirmar que la recibieron?', text:`Marcaremos «${esc(d.item)}» como recibida y le enviaremos un agradecimiento a ${esc(d.from.name)}. Esta acción cierra la donación.`, ok:'Confirmar recepción'}))) return;
        d.status = 'recibida'; X.setFound(f.id, {stats:[(f.stats[0] || 0) + d.qty, f.stats[1], f.stats[2]]}); notifyDonor(d, 'Tu donación llegó', `${f.short} recibió «${d.item}». ¡Gracias!`); refresh();
        toast('Donación recibida · ¡gracias!', {undo:() => { d.status = 'recogida'; X.setFound(f.id, {stats:[(myFound().stats[0] || 0) - d.qty, f.stats[1], f.stats[2]]}); refresh(); }}); }
    };
  }
  view('donaciones', {fn:vDonaciones, roles:['found'], acc:'#E8DCCB', title:'Donaciones'});

  function foundStats(S, f){
    const ds = DB().donations.filter(d => d.fid === f.id); const R = seed(f.id); const bk = X.bk;
    const months = ['abr','may','jun','jul','ago','sep'].map((m, i) => ({k:m, per:i === 5 ? ds.filter(d => d.from.type === 'usuario').length + 9 : Math.round(8 + R() * 14), tie:i === 5 ? ds.filter(d => d.from.type === 'tienda').length + 3 : Math.round(2 + R() * 7)}));
    const kinds = {}; ds.forEach(d => kinds[d.kind] = (kinds[d.kind] || 0) + d.qty); const base = [['Chaquetas', 38], ['Calzado', 22], ['Suéteres', 17], ['Pantalones', 12]];
    const pie = base.map(([k, v]) => [k, v + (kinds[k] || 0)]);
    const st = Object.entries(DSTAT).map(([k, [t]]) => [t, ds.filter(d => d.status === k).length]).filter(x => x[1] > 0);
    const got = (f.stats[0] || 0) % 100 + 58, goal = 180;
    S.innerHTML = `<section class="pf-sec"><h2>Estadísticas</h2><p class="d">Cómo llegan las donaciones a ${esc(f.short)}.</p>
      <div class="kpis">${kpi((f.stats[0] || 0).toLocaleString('es-CO'), 'Prendas recibidas en total')}${kpi(ds.filter(d => d.from.type === 'tienda').length, 'Donaciones de tiendas')}${kpi(ds.filter(d => d.from.type === 'usuario').length, 'Donaciones de personas')}${kpi(ds.length ? Math.round(ds.filter(d => ['aceptada','recogida','recibida'].includes(d.status)).length / ds.length * 100) + '%' : '—', 'Tasa de aceptación')}</div>
      ${ds.length ? `<div class="ch-grid2"><div class="card"><h3 class="card-h">Solicitudes por mes</h3>${bk.bars({data:months, series:[{key:'per', label:'Personas'}, {key:'tie', label:'Tiendas'}], h:250, label:'Solicitudes de donación por mes'})}</div>
          <div class="card"><h3 class="card-h">Meta de prendas del mes</h3><p class="card-sub">${got} de ${goal} prendas recibidas en septiembre.</p>${bk.gauge({value:Math.round(got / goal * 100), center:got, fmt:'int', label:'prendas recibidas'})}</div></div>
        <div class="ch-grid2"><div class="card"><h3 class="card-h">Qué prendas llegan</h3>${bk.pie({data:pie, unit:'Prendas', label:'Donaciones por tipo de prenda'})}</div>
          <div class="card"><h3 class="card-h">Por estado</h3>${bk.ring({data:st, total:'Solicitudes', label:'Solicitudes por estado'})}</div></div>`
        : emptyState({icon:'chart', title:'Aún no hay datos', text:'Cuando recibas solicitudes de donación verás aquí cuántas llegan y cómo avanzan.'})}</section>`;
  }
  function foundState(S, f){
    S.innerHTML = `<section class="pf-sec"><h2>Estado de la cuenta</h2><p class="d">Las fundaciones aliadas no pagan suscripción.</p>
      <div class="kpis">${kpi(f.state, 'Estado')}${kpi('Exenta', 'Suscripción')}${kpi(f.since, 'Aliada desde')}${kpi(f.nit || '—', 'NIT')}</div>
      <div class="banner">${ICON.shield}<div><b>Cuenta verificada por StyleRadar</b><span>Si necesitas pausar la recepción de donaciones, escríbenos a soporte@styleradar.co. Tu historial se conserva.</span></div></div></section>`;
  }
})();
