/* =====================================================================
   StyleRadar · rol ADMINISTRADOR
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {A, $, $$, reduce, money, esc, norm, uid, sleep, ini, today, ICON, P, STORES, FOUNDS, PLAN,
    toast, modal, confirmDlg, emptyState, fErr, V, check, busy, tip, view, go} = X;
  const save = () => X.save();
  const DB = () => X.DB;
  const NAV = [['resumen','Estadísticas','chart'],['usuarios','Usuarios','users'],['tiendas','Tiendas','store'],['fundaciones','Fundaciones','gift'],['publicaciones','Publicaciones','shield'],['playlists','Playlists','list'],['pagos','Pagos','card']];
  const PAGE = 8;
  const stc = s => ({'Activa':'ok','Verificada':'ok','Aprobado':'ok','Periodo gratuito':'wait','Pendiente':'wait','Inactiva':'off','Cancelada':'off','Vencida':'sold','Bloqueada':'sold','Rechazada':'sold','Rechazado':'sold','Sin suscripción':'off','Reembolsado':'info','Exenta':'info'}[s] || 'wait');
  const badge = s => `<span class="st st-${stc(s)}">${esc(s)}</span>`;

  function shell(el, sec, title, kicker, content){
    const a = X.acct(); const pend = DB().moderation.length;
    const pendStores = Object.values(STORES).filter(s => s.verif === 'Pendiente').length;
    el.innerHTML = `<div class="adm">
      <aside class="adm-side" id="admSide">
        <div class="adm-brand"><span class="brand-s"><svg class="srlogo sm" viewBox="0 0 556 935" aria-hidden="true"><path class="srl-d" d="M237 6 L234 6 L209 23 L195 83 L193 85 L147 30 L108 40 L138 147 L58 233 L68 496 L68 544 L62 621 L86 629 L128 639 L160 643 L190 643 L225 636 L245 627 L264 614 L284 594 L298 576 L292 568 L192 477 L210 347 L210 329 L194 169Z"/><path class="srl-w srl-w1" d="M410 646 L380 631 L347 610 L344 610 L321 639 L295 663 L274 677 L258 685 L225 696 L189 701 L147 700 L108 694 L54 680 L43 749 L97 767 L128 774 L163 779 L221 779 L264 771 L283 765 L310 753 L330 741 L351 725 L369 708 L389 684 L407 656Z"/><path class="srl-w srl-w2" d="M549 696 L467 671 L452 699 L425 736 L396 766 L378 781 L345 803 L321 815 L286 828 L258 835 L202 841 L144 838 L75 824 L29 809 L20 845 L6 888 L43 905 L74 915 L117 924 L154 928 L214 928 L259 923 L303 914 L348 900 L403 875 L431 858 L467 830 L490 807 L507 786 L525 758 L541 724Z"/></svg><span>StyleRadar</span></span><span class="lbl">Módulo de administración</span></div>
        <div class="adm-me"><span class="av">${ini(a.name)}</span><div><b>${esc(a.name)}</b><span class="lbl">Administrador</span></div></div>
        <nav class="adm-nav" aria-label="Administración">${NAV.map(([k, t, ic]) => `<a href="#/admin/${k}" class="${k === sec ? 'on' : ''}" ${k === sec ? 'aria-current="page"' : ''}>${ICON[ic]}<span>${t}</span>${k === 'publicaciones' && pend ? `<em>${pend}</em>` : k === 'tiendas' && pendStores ? `<em>${pendStores}</em>` : ''}</a>`).join('')}</nav>
        <div class="adm-foot"><button type="button" data-help>${ICON.help}<span>Ayuda</span></button><button type="button" id="admOut">${ICON.out}<span>Cerrar sesión</span></button></div>
      </aside>
      <div class="adm-main">
        <header class="adm-top"><button class="adm-burger" id="admBurger" aria-label="Abrir menú" aria-controls="admSide" aria-expanded="false"><span></span><span></span><span></span></button>
          <span class="lbl adm-path">Administración / ${title}</span><span class="adm-sp"></span><kbd class="lbl" title="Atajo: / para buscar">/ buscar</kbd><button class="adm-user" type="button" aria-haspopup="menu"><span class="av">${ini(a.name)}</span><span class="lbl">Usuario</span></button></header>
        <div class="adm-head"><div><span class="lbl adm-k">${kicker}</span><h1>${title}</h1></div><div class="adm-logo">StyleRadar<sup>®</sup><span class="lbl">Bogotá</span></div></div>
        <div class="adm-body">${content}</div>
      </div></div>`;
    $('#admOut', el).addEventListener('click', X.logout);
    $('#admBurger', el).addEventListener('click', e => { const s = $('#admSide', el); const o = !s.classList.contains('open'); s.classList.toggle('open', o); e.currentTarget.setAttribute('aria-expanded', o); });
    $$('.adm-nav a', el).forEach(l => l.addEventListener('click', () => $('#admSide', el).classList.remove('open')));
  }
  addEventListener('keydown', e => { if (e.key === '/' && document.body.dataset.view === 'admin' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){ const s = $('.adm-body .t-search input'); if (s){ e.preventDefault(); s.focus(); } } });

  /* ---------- tabla genérica con búsqueda, filtros, orden, selección y paginación ---------- */
  function table(root, {rows, cols, filters = [], search, onRow, tools = '', bulk, empty, key = 'id'}){
    const st = {q:'', f:{}, sort:null, dir:1, page:0, sel:new Set()};
    root.innerHTML = `<div class="t-card">
      <div class="t-tools"><div class="t-btns">${tools}</div>
        <div class="t-search"><span>${ICON.search}</span><input type="search" placeholder="${esc(search.ph)}" aria-label="${esc(search.ph)}"></div>
        ${filters.map(f => `<label class="sel lbl">${f.label}<select data-tf="${f.k}"><option value="">Todos</option>${f.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="t-bulk" hidden><span class="lbl"></span>${bulk ? bulk.html : ''}<button type="button" class="linkish lbl" data-clear>Quitar selección</button></div>
      <div class="t-wrap"><table class="tbl adm-t"><thead><tr>${cols.map((c, i) => `<th ${c.sort !== false ? `data-sort="${i}" tabindex="0" aria-sort="none"` : ''} class="${c.cls || ''}">${c.t}${c.sort !== false ? '<i class="so"></i>' : ''}</th>`).join('')}${onRow ? '<th class="t-act"><span class="sr-only">Acciones</span></th>' : ''}</tr></thead><tbody></tbody></table></div>
      <div class="t-foot"><div class="pager"></div><span class="lbl t-count"></span></div></div>`;
    const tb = $('tbody', root);
    const data = () => {
      let list = rows().filter(r => (!st.q || norm(search.text(r)).includes(norm(st.q))) && filters.every(f => !st.f[f.k] || f.get(r) === st.f[f.k]));
      if (st.sort != null){ const c = cols[st.sort]; const g = c.sv || (r => norm(String(c.v(r)).replace(/<[^>]+>/g, ''))); list = list.slice().sort((a, b) => (g(a) > g(b) ? 1 : g(a) < g(b) ? -1 : 0) * st.dir); }
      return list;
    };
    const draw = () => {
      const list = data(); const pages = Math.max(1, Math.ceil(list.length / PAGE)); st.page = Math.min(st.page, pages - 1);
      const slice = list.slice(st.page * PAGE, st.page * PAGE + PAGE);
      tb.innerHTML = slice.length ? slice.map(r => `<tr tabindex="0" data-k="${esc(r[key])}" ">${cols.map(c => `<td class="${c.cls || ''}">${c.v(r)}</td>`).join('')}${onRow ? `<td class="t-act"><button type="button" class="btn btn-line sm t-edit" data-edit="${esc(r[key])}">${ICON.edit} Editar</button></td>` : ''}</tr>`).join('')
        : `<tr class="t-empty"><td colspan="${cols.length + (onRow ? 1 : 0)}">${emptyState(Object.assign({small:true, actions:[{label:'Limpiar búsqueda y filtros', attr:'data-treset'}]}, empty || {icon:'search', title:'No hay registros con esos criterios', text:'Revisa la búsqueda o quita algún filtro.'}))}</td></tr>`;
      $('.pager', root).innerHTML = pages > 1 ? `<button type="button" data-pg="${st.page - 1}" ${st.page ? '' : 'disabled'} aria-label="Página anterior">‹</button>${Array.from({length:pages}, (_, i) => `<button type="button" data-pg="${i}" class="${i === st.page ? 'on' : ''}" ${i === st.page ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}<button type="button" data-pg="${st.page + 1}" ${st.page < pages - 1 ? '' : 'disabled'} aria-label="Página siguiente">›</button>` : `<button type="button" class="on" aria-current="page">1</button>`;
      $('.t-count', root).textContent = `${list.length} ${list.length === 1 ? 'registro encontrado' : 'registros encontrados'}`;
      const bk = $('.t-bulk', root); bk.hidden = !st.sel.size; $('.lbl', bk).textContent = `${st.sel.size} seleccionados`;
      $$('th[data-sort]', root).forEach(th => { const on = +th.dataset.sort === st.sort; th.classList.toggle('on', on); th.setAttribute('aria-sort', on ? (st.dir > 0 ? 'ascending' : 'descending') : 'none'); });
    };
    $('.t-search input', root).addEventListener('input', e => { st.q = e.target.value; st.page = 0; draw(); });
    $$('[data-tf]', root).forEach(s => s.addEventListener('change', () => { st.f[s.dataset.tf] = s.value; st.page = 0; draw(); }));
    root.addEventListener('click', e => {
      const th = e.target.closest('th[data-sort]'); if (th){ const i = +th.dataset.sort; st.dir = st.sort === i ? -st.dir : 1; st.sort = i; draw(); return; }
      const pg = e.target.closest('[data-pg]'); if (pg && !pg.disabled){ st.page = +pg.dataset.pg; draw(); return; }
      if (e.target.closest('[data-all]')){ const on = e.target.checked; const list = data().slice(st.page * PAGE, st.page * PAGE + PAGE); list.forEach(r => on ? st.sel.add(r[key]) : st.sel.delete(r[key])); draw(); return; }
      const ck = e.target.closest('[data-ck]'); if (ck){ ck.checked ? st.sel.add(ck.dataset.ck) : st.sel.delete(ck.dataset.ck); draw(); return; }
      if (e.target.closest('.ck')) return;
      if (e.target.closest('[data-clear]')){ st.sel.clear(); draw(); return; }
      if (e.target.closest('[data-treset]')){ st.q = ''; st.f = {}; $('.t-search input', root).value = ''; $$('[data-tf]', root).forEach(s => s.value = ''); draw(); return; }
      if (bulk && e.target.closest('[data-bulk]')){ bulk.run(e.target.closest('[data-bulk]').dataset.bulk, [...st.sel], () => { st.sel.clear(); draw(); }); return; }
      const ed = e.target.closest('[data-edit]'); if (ed && onRow){ onRow(ed.dataset.edit); return; }
      const tr = e.target.closest('tr[data-k]'); if (tr && onRow) onRow(tr.dataset.k);
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter'){ const th = e.target.closest('th[data-sort]'); if (th) th.click(); const tr = e.target.closest('tr[data-k]'); if (tr && e.target === tr && onRow) onRow(tr.dataset.k); } });
    draw();
    return {draw, st};
  }
  const who = (name, sub) => `<span class="who2"><span class="av">${ini(name)}</span><span><b>${esc(name)}</b>${sub ? `<em>${esc(sub)}</em>` : ''}</span></span>`;
  const back = (href, t) => `<a class="adm-back lbl" href="${href}">← ${t}</a>`;
  const card = (t, body, extra = '') => `<section class="card"><header class="card-top"><h3 class="card-h">${t}</h3>${extra}</header>${body}</section>`;
  const dl = pairs => `<dl class="pd-dl">${pairs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  const payTable = list => list.length ? `<table class="tbl"><thead><tr><th>Fecha</th><th>Referencia</th><th>Concepto</th><th>Método</th><th class="num">Valor</th><th>Estado</th></tr></thead><tbody>${list.map(p => `<tr><td>${p.date}</td><td>${p.ref}</td><td>${p.concept}</td><td>${p.method}</td><td class="num">${money(p.amount)}</td><td>${badge(p.estado)}</td></tr>`).join('')}</tbody></table>`
    : emptyState({icon:'card', title:'Sin transacciones', text:'Aún no hay pagos registrados.', small:true});

  /* ================= ESTADÍSTICAS ================= */
  function resumen(el){
    const pays = DB().payments; const sep = pays.filter(p => /sep/.test(p.date) && p.estado === 'Aprobado');
    const rev = sep.reduce((a, p) => a + p.amount, 0);
    const users = DB().adminUsers; const stores = Object.values(STORES); const founds = Object.values(FOUNDS);
    const prods = Object.values(P).filter(X.visible);
    const byMonth = ['jun','jul','ago','sep'].map(m => [m, pays.filter(p => p.date.includes(m) && p.estado === 'Aprobado').reduce((a, p) => a + p.amount, 0)]);
    const signups = [['feb', 41], ['mar', 58], ['abr', 73], ['may', 66], ['jun', 92], ['jul', 118], ['ago', 131], ['sep', 147]];
    let h = 11; const R = () => (h = (h * 9301 + 49297) % 233280) / 233280;
    const daily = [...Array(24)].map((_, i) => { const d = new Date(2026, 8, i + 1); const we = [0, 6].includes(d.getDay()) ? 1.3 : 1;
      return {k:(i + 1) + ' sep', full:d.toLocaleDateString('es-CO', {weekday:'short', day:'numeric', month:'short'}), bus:Math.round((62 + R() * 30 + i * .8) * we), reg:Math.round((3 + R() * 5 + i * .15) * we) * 4, pub:Math.round((30 + R() * 22 + i * .6) * we)}; });
    const income = ['jun','jul','ago','sep'].map(m => ({k:m, u:pays.filter(p => p.date.includes(m) && p.estado === 'Aprobado' && p.tipo === 'Usuario').reduce((a, p) => a + p.amount, 0), t:pays.filter(p => p.date.includes(m) && p.estado === 'Aprobado' && p.tipo === 'Tienda').reduce((a, p) => a + p.amount, 0)}));
    const goal = 600000;
    const plans = [['Radar (gratis)', users.filter(u => u.plan === 'free').length * 120], ['Radar+', users.filter(u => u.plan === 'plus').length * 60], ['Tiendas', stores.length * 9]];
    const dstat = [['Pendientes','pendiente'], ['Aceptadas','aceptada'], ['Recogida','recogida'], ['Recibidas','recibida'], ['Rechazadas','rechazada']].map(([t, k]) => [t, DB().donations.filter(d => d.status === k).length + {pendiente:18, aceptada:24, recogida:9, recibida:41, rechazada:6}[k]]);
    shell(el, 'resumen', 'Estadísticas', 'Resumen general · septiembre 2026', `
      <div class="kpis k4">${X.kpi(users.filter(u => u.estado === 'Activa').length + 1850, 'Usuarios activos', '▲ 11% vs. agosto', 'up')}${X.kpi(stores.filter(s => s.verif === 'Verificada').length, 'Tiendas verificadas', stores.filter(s => s.verif === 'Pendiente').length + ' pendientes')}
        ${X.kpi(founds.filter(f => f.state === 'Activa').length, 'Fundaciones activas')}${X.kpi(money(rev), 'Ingresos de septiembre', '▲ 8% vs. agosto', 'up')}
        ${X.kpi(prods.length, 'Prendas publicadas')}${X.kpi(Object.keys(DB().pl).length + 412, 'Playlists creadas')}${X.kpi(DB().donations.length + 86, 'Donaciones este mes')}${X.kpi(DB().moderation.length, 'Publicaciones por moderar', DB().moderation.length ? 'Revisar →' : 'Todo al día')}</div>
      ${card('Actividad diaria · septiembre', X.bk.composed({data:daily, area:{key:'bus', label:'Búsquedas (x10)'}, bar:{key:'reg', label:'Registros'}, line:{key:'pub', label:'Publicaciones'}, ticks:8, h:290, label:'Actividad diaria de septiembre'}))}
      <div class="ch-grid2">${card('Ingresos por suscripciones', X.bk.bars({data:income, series:[{key:'u', label:'Usuarios'}, {key:'t', label:'Tiendas'}], fmt:'money', h:250, label:'Ingresos aprobados por mes'}))}
        ${card('Usuarios conectados ahora', '<p class="card-sub">Sesiones abiertas en este momento.</p>' + X.bk.live({base:236, vol:9, min:120, drift:.49, unit:'Usuarios', label:'Usuarios conectados en tiempo real'}))}</div>
      <div class="ch-grid3">${card('Meta de ingresos', '<p class="card-sub">' + money(rev) + ' de ' + money(goal) + '</p>' + X.bk.gauge({value:Math.min(100, Math.round(rev / goal * 100)), center:Math.min(100, Math.round(rev / goal * 100)), fmt:'pct', label:'de la meta de septiembre'}))}
        ${card('Planes de usuarios', X.bk.pie({data:plans, unit:'Cuentas', size:180, label:'Cuentas por plan'}))}
        ${card('Donaciones por estado', X.bk.ring({data:dstat, total:'Donaciones', size:170, label:'Donaciones por estado'}))}</div>
      ${card('Prendas por estilo', X.bk.hbars({data:Object.entries(X.STYLES).map(([k, t]) => [t, prods.filter(p => p.style === k).length]), unit:'Prendas', lw:100, label:'Prendas publicadas por estilo'}))}
      ${card('Actividad reciente', `<ul class="feed">${[['store','Ropero 57 envió sus documentos para verificación','hace 2 h'],['shield',`${DB().moderation.length} publicaciones esperan moderación`,'hoy'],['card','Norte Denim: el cobro de septiembre fue rechazado','ayer'],['users','Julián Rincón fue bloqueado por reportes de la comunidad','hace 3 días']].map(([ic, t, at]) => `<li>${ICON[ic]}<span>${t}</span><em class="lbl">${at}</em></li>`).join('')}</ul>`)}`);
    el.querySelector('.kpis .kpi:last-child').addEventListener('click', () => go('#/admin/publicaciones'));
  }

  /* ================= USUARIOS ================= */
  function usuarios(el, id){
    const users = DB().adminUsers;
    if (id){ const u = users.find(x => x.id === id); if (!u) return go('#/admin/usuarios');
      const ud = DB().users[u.email];
      shell(el, 'usuarios', esc(u.name), 'Usuarios · detalle', `${back('#/admin/usuarios', 'Volver a usuarios')}
        <div class="adm-detail">${card('Información general', `<div class="det-h">${who(u.name, u.email)}${badge(u.estado)}</div>${dl([['Rol', 'Usuario comprador'], ['Barrio', esc(u.barrio)], ['Miembro desde', u.since], ['Publicaciones', ud ? ud.pubs.length : u.pubs], ['Playlists', u.pls], ['Wishlist', ud ? ud.wish.length + ' prendas' : '—']])}`)}
          ${card('Estado de la cuenta', `<p class="mdl-p">Activa: puede usar StyleRadar. Inactiva: sin uso reciente, se reactiva al entrar. Bloqueada: no puede iniciar sesión.</p>
            <div class="seg-toggle three" id="uSt">${['Activa','Inactiva','Bloqueada'].map(s => `<button type="button" aria-pressed="${u.estado === s}" data-s="${s}">${s}</button>`).join('')}</div>`)}
          ${card('Suscripción', dl([['Plan', PLAN[u.plan].name], ['Valor', PLAN[u.plan].price ? money(PLAN[u.plan].price) + ' / mes' : 'Gratis'], ['Estado', u.plan === 'free' ? badge('Sin suscripción') : badge(u.estado === 'Bloqueada' ? 'Cancelada' : 'Activa')], ['Próximo cobro', u.plan === 'free' ? '—' : '23 oct 2026']]))}</div>`);
      $('#uSt', el).addEventListener('click', async e => { const b = e.target.closest('[data-s]'); if (!b || b.dataset.s === u.estado) return; const s = b.dataset.s;
        const ok = await confirmDlg({title:`¿Cambiar a ${s}?`, text:s === 'Bloqueada' ? `${esc(u.name)} no podrá iniciar sesión y sus publicaciones se ocultarán. Puedes revertirlo cuando quieras.` : `La cuenta de ${esc(u.name)} quedará ${s.toLowerCase()}.`, ok:`Cambiar a ${s}`, danger:s === 'Bloqueada', kicker:'Estado de la cuenta'});
        if (!ok) return; const prev = u.estado; u.estado = s; save(); X.route(); toast(`${esc(u.name)} ahora está <b>${s}</b>`, {undo:() => { u.estado = prev; save(); X.route(); }}); });
      return; }
    shell(el, 'usuarios', 'Usuarios', 'Configuración', '<div id="tbl"></div>');
    table($('#tbl', el), {rows:() => DB().adminUsers, search:{ph:'Buscar por nombre o correo', text:r => r.name + ' ' + r.email},
      cols:[{t:'Nombre', v:r => who(r.name), sv:r => norm(r.name)}, {t:'Correo', v:r => esc(r.email)}, {t:'Plan', v:r => PLAN[r.plan].name}, {t:'Estado', v:r => badge(r.estado), sv:r => r.estado}, {t:'Barrio', v:r => esc(r.barrio), cls:'hide-s'}, {t:'Miembro desde', v:r => r.since, cls:'hide-s'}],
      filters:[{k:'estado', label:'Estado', opts:['Activa','Inactiva','Bloqueada'], get:r => r.estado}, {k:'plan', label:'Plan', opts:['Radar','Radar+'], get:r => PLAN[r.plan].name}],
      tools:`<button class="btn btn-line sm" id="uExp">Exportar a Excel</button>`,
      bulk:{html:`<button type="button" class="btn btn-line sm" data-bulk="Inactiva">Marcar inactivas</button><button type="button" class="btn btn-line sm danger" data-bulk="Bloqueada">Bloquear</button>`,
        run:async (s, keys, done) => { const ok = await confirmDlg({title:`¿Cambiar ${keys.length} cuentas a ${s}?`, text:'Las personas seleccionadas verán el cambio la próxima vez que entren.', ok:'Cambiar estado', danger:s === 'Bloqueada'}); if (!ok) return;
          const prev = keys.map(k => [k, DB().adminUsers.find(u => u.id === k).estado]); keys.forEach(k => DB().adminUsers.find(u => u.id === k).estado = s); save(); done(); toast(`${keys.length} cuentas ahora están <b>${s}</b>`, {undo:() => { prev.forEach(([k, v]) => DB().adminUsers.find(u => u.id === k).estado = v); save(); X.route(); }}); }},
      onRow:k => go('#/admin/usuarios/' + k)});
    $('#uExp', el).addEventListener('click', () => toast('Descargando usuarios en Excel (.xlsx)…'));
  }

  /* ================= TIENDAS ================= */
  function tiendas(el, id){
    if (id){ const s = STORES[id]; if (!s) return go('#/admin/tiendas');
      const items = X.storeItems(id);
      shell(el, 'tiendas', esc(s.name), 'Tiendas · detalle', `${back('#/admin/tiendas', 'Volver a tiendas')}
        <div class="adm-detail">${card('Información general', `<div class="det-h">${who(s.name, s.cat + ' · ' + s.barrio)}${badge(s.verif)}</div>${dl([['Dirección', esc(s.dir) || '—'], ['Teléfono', esc(s.tel) || '—'], ['Correo', esc(s.email)], ['NIT', esc(s.nit) || '—'], ['Representante', esc(s.rep)], ['Aliada desde', s.since]])}`)}
          ${card('Verificación', `<p class="mdl-p">${s.verif === 'Pendiente' ? 'Revisa los documentos antes de aprobar. Al aprobarla, la tienda aparece en el radar.' : s.verif === 'Verificada' ? 'La tienda fue verificada y aparece en el radar.' : 'La verificación fue rechazada. La tienda puede volver a enviar sus documentos.'}</p>
            <ul class="docs">${[['RUT', s.nit && s.nit !== '—'], ['Cámara de comercio', s.verif !== 'Rechazada'], ['Fotos del local', !!s.photo || s.verif === 'Pendiente'], ['Cuenta bancaria', s.verif === 'Verificada']].map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? ICON.check : ICON.alert}${t}<em class="lbl">${ok ? 'Recibido' : 'Falta'}</em></li>`).join('')}</ul>
            ${s.verif !== 'Verificada' ? `<div class="pf-row-actions"><button class="btn btn-line danger" id="vRej">Rechazar</button><button class="btn btn-acc" id="vOk">${ICON.check} Aprobar tienda</button></div>` : `<div class="pf-row-actions"><button class="btn btn-line danger" id="vRevoke">Retirar verificación</button></div>`}`)}
          ${card('Suscripción', dl([['Plan', 'Tienda aliada · ' + money(PLAN.store.price) + ' / mes'], ['Estado', badge(s.sub.estado)], [s.sub.estado === 'Periodo gratuito' ? 'Periodo gratuito hasta' : 'Próximo cobro', s.sub.next], ['Inicio', s.sub.start]]) + (s.sub.estado === 'Periodo gratuito' ? `<div class="pf-row-actions"><button class="btn btn-line sm" id="sExt">Extender periodo gratuito 15 días</button></div>` : ''))}
          ${card('Catálogo', X.hBars([['Publicadas', items.filter(p => p.status === 'publicada').length], ['En revisión', items.filter(p => p.status === 'revision').length], ['Agotadas', items.filter(p => !X.avail(p)).length], ['Retiradas', items.filter(p => p.status === 'retirada').length]], v => v + ' prendas'))}
          ${card('Transacciones', payTable(DB().payments.filter(p => p.name === s.name)))}</div>`);
      const set = (patch, msg, prevPatch) => { X.setStore(id, patch); X.route(); toast(msg, {undo:() => { X.setStore(id, prevPatch); X.route(); }}); };
      const ok = $('#vOk', el), rj = $('#vRej', el), rv = $('#vRevoke', el), ex = $('#sExt', el);
      if (ok) ok.addEventListener('click', async () => { if (await confirmDlg({title:'¿Aprobar esta tienda?', text:`${esc(s.name)} aparecerá en el radar, en el mapa y su catálogo será visible para todas las personas.`, ok:'Aprobar tienda'})) set({verif:'Verificada', hidden:false}, `<b>${esc(s.name)}</b> verificada`, {verif:s.verif, hidden:s.hidden}); });
      if (rj) rj.addEventListener('click', () => modal({title:'Rechazar verificación', kicker:esc(s.name), cls:'mdl-sm', body:`<div class="field"><label for="vrM">Motivo (se lo enviaremos a la tienda)</label><textarea id="vrM" maxlength="200" placeholder="Ej. La cámara de comercio está vencida."></textarea></div>`,
        actions:[{label:'Cancelar'}, {label:'Rechazar', kind:'btn-danger', onClick:m => { const t = $('#vrM', m.el); if (!check([[t, V.req('Escribe el motivo para que la tienda sepa qué corregir.'), V.min(10)]])) return; m.close(); set({verif:'Rechazada', verifNote:t.value.trim()}, 'Verificación rechazada', {verif:s.verif, verifNote:s.verifNote}); }}]}));
      if (rv) rv.addEventListener('click', async () => { if (await confirmDlg({title:'¿Retirar la verificación?', text:`El catálogo de ${esc(s.name)} dejará de verse en el radar hasta que se verifique de nuevo.`, ok:'Retirar verificación', danger:true})) set({verif:'Pendiente'}, 'Verificación retirada', {verif:'Verificada'}); });
      if (ex) ex.addEventListener('click', () => set({sub:Object.assign({}, s.sub, {next:s.sub.next + ' + 15 días'})}, 'Periodo gratuito extendido', {sub:s.sub}));
      return; }
    shell(el, 'tiendas', 'Tiendas', 'Configuración', '<div id="tbl"></div>');
    table($('#tbl', el), {rows:() => Object.values(STORES), search:{ph:'Buscar tienda, NIT o barrio', text:r => r.name + ' ' + r.nit + ' ' + r.barrio},
      cols:[{t:'Tienda', v:r => who(r.name, r.cat), sv:r => norm(r.name)}, {t:'NIT', v:r => esc(r.nit) || '—', cls:'hide-s'}, {t:'Barrio', v:r => esc(r.barrio)}, {t:'Verificación', v:r => badge(r.verif), sv:r => r.verif}, {t:'Suscripción', v:r => badge(r.sub.estado), sv:r => r.sub.estado}, {t:'Prendas', v:r => X.storeItems(r.id).filter(p => p.status === 'publicada').length, sv:r => X.storeItems(r.id).length, cls:'num'}],
      filters:[{k:'v', label:'Verificación', opts:['Verificada','Pendiente','Rechazada'], get:r => r.verif}, {k:'s', label:'Suscripción', opts:['Activa','Periodo gratuito','Cancelada','Vencida','Sin suscripción'], get:r => r.sub.estado}],
      tools:`<button class="btn btn-line sm" id="tExp">Exportar a Excel</button>`, onRow:k => go('#/admin/tiendas/' + k)});
    $('#tExp', el).addEventListener('click', () => toast('Descargando tiendas en Excel (.xlsx)…'));
  }

  /* ================= FUNDACIONES ================= */
  const foundForm = (f = {}) => `<form class="form-grid" novalidate>
    <div class="field"><label for="afN">Nombre</label><input id="afN" value="${esc(f.name || '')}"></div><div class="field"><label for="afT">NIT</label><input id="afT" value="${esc(f.nit || '')}" placeholder="900.000.000-0"></div>
    <div class="field"><label for="afE">Correo</label><input id="afE" type="email" value="${esc(f.email || '')}"></div><div class="field"><label for="afP">Teléfono</label><input id="afP" value="${esc(f.tel || '')}"></div>
    <div class="field"><label for="afB">Barrio</label><input id="afB" value="${esc(f.barrio || '')}"></div><div class="field"><label for="afA">Dirección</label><input id="afA" value="${esc(f.dir || '')}"></div>
    <div class="field full"><label for="afR">Representante legal</label><input id="afR" value="${esc(f.rep || '')}"></div></form>`;
  const foundRules = (m, selfId) => [[$('#afN', m), V.req('Escribe el nombre de la fundación.'), V.min(4)], [$('#afT', m), V.req('Escribe el NIT.'), v => /^[\d.]{9,13}-\d$/.test(v.trim()) ? '' : 'Escribe el NIT con dígito de verificación, por ejemplo 900.215.884-1.', v => Object.values(FOUNDS).some(f => f.nit === v.trim() && f.id !== selfId) ? 'Ya hay una fundación registrada con ese NIT.' : ''],
    [$('#afE', m), V.req('Escribe el correo.'), V.email], [$('#afP', m), V.req('Escribe un teléfono.'), V.phone], [$('#afB', m), V.req('Escribe el barrio.')], [$('#afA', m), V.req('Escribe la dirección.')], [$('#afR', m), V.req('Escribe el representante legal.')]];
  const foundVals = m => ({name:$('#afN', m).value.trim(), nit:$('#afT', m).value.trim(), email:$('#afE', m).value.trim(), tel:$('#afP', m).value.trim(), barrio:$('#afB', m).value.trim(), dir:$('#afA', m).value.trim(), rep:$('#afR', m).value.trim()});
  function fundaciones(el, id){
    if (id){ const f = FOUNDS[id]; if (!f) return go('#/admin/fundaciones');
      const ds = DB().donations.filter(d => d.fid === id);
      shell(el, 'fundaciones', esc(f.name), 'Fundaciones · detalle', `${back('#/admin/fundaciones', 'Volver a fundaciones')}
        <div class="adm-detail">${card('Información general', `<div class="det-h">${who(f.name, f.barrio)}${badge(f.state)}</div><div id="afEdit">${foundForm(f)}</div><div class="pf-row-actions"><button class="btn btn-acc" id="afSave">Guardar cambios</button></div>`)}
          ${card('Estado y suscripción', `${dl([['Estado', badge(f.state)], ['Suscripción', badge('Exenta')], ['Aliada desde', f.since], ['Donaciones en historial', ds.length]])}
            <p class="mdl-p">${f.state === 'Activa' ? 'Si la desactivas, dejará de recibir donaciones nuevas y de aparecer en el radar. Su historial se conserva.' : 'Está desactivada: no recibe donaciones nuevas. Su historial se conserva.'}</p>
            <div class="pf-row-actions">${f.state === 'Activa' ? `<button class="btn btn-line danger" id="afOff">Desactivar fundación</button>` : `<button class="btn btn-acc" id="afOn">Reactivar fundación</button>`}</div>`)}
          ${card('Donaciones', ds.length ? X.hBars([['Pendientes', ds.filter(d => d.status === 'pendiente').length], ['En proceso', ds.filter(d => ['aceptada','recogida'].includes(d.status)).length], ['Recibidas', ds.filter(d => d.status === 'recibida').length], ['Rechazadas', ds.filter(d => d.status === 'rechazada').length]]) : emptyState({icon:'gift', title:'Sin donaciones', small:true}))}</div>`);
      $('#afSave', el).addEventListener('click', async e => { if (!check(foundRules($('#afEdit', el), id))) return; const done = busy(e.currentTarget); await sleep(500); done();
        const prev = {name:f.name, nit:f.nit, email:f.email, tel:f.tel, barrio:f.barrio, dir:f.dir, rep:f.rep}; X.setFound(id, foundVals($('#afEdit', el))); X.route(); toast('Fundación actualizada', {undo:() => { X.setFound(id, prev); X.route(); }}); });
      const off = $('#afOff', el), on = $('#afOn', el);
      if (off) off.addEventListener('click', async () => { if (!(await confirmDlg({title:'¿Desactivar esta fundación?', text:`${esc(f.name)} no podrá recibir donaciones nuevas ni aparecerá en el radar. Se conservan sus ${ds.length} donaciones en el historial.`, ok:'Desactivar', danger:true}))) return;
        X.setFound(id, {state:'Inactiva'}); X.route(); toast('Fundación desactivada', {undo:() => { X.setFound(id, {state:'Activa'}); X.route(); }}); });
      if (on) on.addEventListener('click', () => { X.setFound(id, {state:'Activa', hidden:false}); X.route(); toast('Fundación reactivada'); });
      return; }
    shell(el, 'fundaciones', 'Fundaciones', 'Configuración', '<div id="tbl"></div>');
    table($('#tbl', el), {rows:() => Object.values(FOUNDS), search:{ph:'Buscar fundación, NIT o barrio', text:r => r.name + ' ' + r.nit + ' ' + r.barrio},
      cols:[{t:'Fundación', v:r => who(r.name, r.email), sv:r => norm(r.name)}, {t:'NIT', v:r => esc(r.nit) || '—', cls:'hide-s'}, {t:'Barrio', v:r => esc(r.barrio)}, {t:'Estado', v:r => badge(r.state), sv:r => r.state}, {t:'Suscripción', v:() => badge('Exenta'), sort:false, cls:'hide-s'}, {t:'Donaciones', v:r => DB().donations.filter(d => d.fid === r.id).length, sv:r => DB().donations.filter(d => d.fid === r.id).length, cls:'num'}],
      filters:[{k:'e', label:'Estado', opts:['Activa','Inactiva'], get:r => r.state}],
      tools:`<button class="btn btn-acc sm" id="fNew">${ICON.plus} Nueva fundación</button>`, onRow:k => go('#/admin/fundaciones/' + k)});
    $('#fNew', el).addEventListener('click', () => modal({title:'Registrar fundación aliada', kicker:'Fundaciones', wide:true, body:foundForm(),
      actions:[{label:'Cancelar'}, {label:'Registrar fundación', kind:'btn-acc', onClick:async (m, b) => { if (!check(foundRules(m.el))) return; const done = busy(b, 'Registrando…'); await sleep(700); done();
        const v = foundVals(m.el); const fid = uid('fd'); DB().founds[fid] = Object.assign(v, {short:v.name.slice(0, 22), hours:'', web:'', color:'#B9B9CA', map:[300, 300], state:'Activa', since:today(), mission:'', accepts:[], needs:[], stats:[0, 0, 0]});
        save(); X.rebuild(); m.close(); X.route(); toast(`<b>${esc(v.name)}</b> registrada como aliada`); }}]}));
  }

  /* ================= PUBLICACIONES (moderación) ================= */
  function publicaciones(el){
    const q = DB().moderation; const hist = DB().modHist || (DB().modHist = []);
    let tipo = '';
    shell(el, 'publicaciones', 'Publicaciones', 'Moderación del catálogo', `
      <div class="toolbar"><div class="chips" id="moF"><button class="chip" aria-pressed="true" data-f="">Todas <sup>${q.length}</sup></button><button class="chip" aria-pressed="false" data-f="Catálogo">Catálogo de tiendas <sup>${q.filter(x => x.tipo === 'Catálogo').length}</sup></button><button class="chip" aria-pressed="false" data-f="Segunda mano">Segunda mano <sup>${q.filter(x => x.tipo === 'Segunda mano').length}</sup></button></div>
        <span class="lbl" style="color:var(--fog)">Revisa fotos, precio y descripción antes de aprobar</span></div>
      <div id="moL"></div>
      <details class="mo-hist"><summary class="lbl">Historial de decisiones (${hist.length})</summary><ul class="feed">${hist.map(h => `<li>${h.ok ? ICON.check : ICON.x}<span><b>${esc(h.item)}</b> · ${esc(h.origin)} ${h.ok ? 'aprobada' : 'rechazada: ' + esc(h.reason)}</span><em class="lbl">${h.date}</em></li>`).join('') || '<li><span>Aún no hay decisiones.</span></li>'}</ul></details>`);
    const draw = () => {
      const list = q.filter(x => !tipo || x.tipo === tipo);
      $('#moL', el).innerHTML = list.length ? `<div class="dn-grid">${list.map(m => `<article class="dn-card"><div class="dn-img">${m.img || m.thumb ? `<img src="${m.img || A.thumbs[m.thumb]}" alt="">` : ICON.box}<span class="st st-wait">${m.tipo}</span></div>
        <div class="dn-b"><b>${esc(m.item)}</b><span class="lbl">${money(m.price)} · ${m.date}</span><span class="dn-from"><span class="tag ${m.tipo === 'Catálogo' ? 'tienda' : 'usuario'}">${m.tipo === 'Catálogo' ? 'Tienda' : 'Persona'}</span>${esc(m.origin)}</span>${m.note ? `<span class="rc-note">${ICON.alert} ${esc(m.note)}</span>` : ''}</div>
        <div class="dn-a"><button class="btn btn-line sm" data-mr="${m.id}">Rechazar</button><button class="btn btn-acc sm" data-ma="${m.id}">${ICON.check} Aprobar</button></div></article>`).join('')}</div>`
        : emptyState({icon:'shield', title:'Todo al día', text:'No hay publicaciones esperando moderación. Las nuevas prendas de tiendas y de segunda mano aparecerán aquí.', actions:tipo ? [{label:'Ver todas', attr:'data-mall'}] : []});
    };
    draw();
    X.chipsPick($('#moF', el), false, b => { tipo = b.dataset.f; draw(); });
    const decide = (m, ok, reason) => {
      const i = q.indexOf(m); q.splice(i, 1); hist.unshift({item:m.item, origin:m.origin, ok, reason, date:today()});
      if (m.pid) X.setProd(m.pid, {status:ok ? 'publicada' : 'rechazada'});
      if (ok && X.matchAlerts) setTimeout(() => X.matchAlerts(m.pid || (m.pub ? 'pub-' + m.pub : '')), 50);
      if (m.pub && m.email){ const u = DB().users[m.email]; const p = u && u.pubs.find(x => x.id === m.pub); if (p) p.status = ok ? 'Activa' : 'Rechazada'; X.pushNotif(m.email, {icon:ok ? 'check' : 'alert', t:ok ? 'Tu publicación ya está en el radar' : 'Tu publicación no fue aprobada', d:ok ? `«${m.item}» ya aparece en Segunda vida.` : `«${m.item}»: ${reason}`, href:'#/perfil/publicaciones'}); }
      save(); X.rebuild(); X.route();
      toast(ok ? `<b>${esc(m.item)}</b> aprobada` : 'Publicación rechazada', {undo:() => { q.splice(i, 0, m); hist.shift(); if (m.pid) X.setProd(m.pid, {status:'revision'}); if (m.pub && m.email){ const u = DB().users[m.email]; const p = u && u.pubs.find(x => x.id === m.pub); if (p) p.status = 'En revisión'; } save(); X.rebuild(); X.route(); }});
    };
    el.onclick = async e => {
      if (e.target.closest('[data-mall]')){ tipo = ''; X.route(); }
      const a = e.target.closest('[data-ma]'); if (a){ const m = q.find(x => x.id === a.dataset.ma); if (await confirmDlg({title:'¿Aprobar publicación?', text:`«${esc(m.item)}» de ${esc(m.origin)} será visible en el radar.`, ok:'Aprobar'})) decide(m, true); }
      const r = e.target.closest('[data-mr]'); if (r){ const m = q.find(x => x.id === r.dataset.mr);
        modal({title:'Rechazar publicación', kicker:esc(m.item), cls:'mdl-sm', body:`<div class="field"><label for="mrR">Motivo</label><select id="mrR"><option value="">Elige un motivo</option><option>Las fotos no muestran bien la prenda</option><option>El precio no es coherente</option><option>Prenda no permitida en StyleRadar</option><option>Descripción incompleta</option></select></div>`,
          actions:[{label:'Cancelar'}, {label:'Rechazar', kind:'btn-danger', onClick:mm => { const s = $('#mrR', mm.el); if (!check([[s, V.req('Elige el motivo; se lo enviaremos a quien publicó.')]])) return; mm.close(); decide(m, false, s.value); }}]}); }
    };
  }

  /* ================= PAGOS ================= */
  function pagos(el){
    const pays = DB().payments;
    const sum = f => pays.filter(f).reduce((a, p) => a + p.amount, 0);
    shell(el, 'pagos', 'Pagos', 'Historial de transacciones', `
      <div class="kpis k4">${X.kpi(money(sum(p => /sep/.test(p.date) && p.estado === 'Aprobado')), 'Recaudado en septiembre')}${X.kpi(money(sum(p => /sep/.test(p.date) && p.tipo === 'Tienda' && p.estado === 'Aprobado')), 'De tiendas')}${X.kpi(money(sum(p => /sep/.test(p.date) && p.tipo === 'Usuario' && p.estado === 'Aprobado')), 'De usuarios')}${X.kpi(pays.filter(p => p.estado === 'Rechazado').length, 'Cobros rechazados', 'Reintentar →', 'down')}</div>
      <div id="tbl"></div>`);
    const t = table($('#tbl', el), {rows:() => DB().payments, key:'ref', search:{ph:'Buscar referencia o cliente', text:r => r.ref + ' ' + r.name},
      cols:[{t:'Fecha', v:r => r.date, sv:r => r.sort}, {t:'Referencia', v:r => r.ref, cls:'hide-s'}, {t:'Cliente', v:r => who(r.name, r.tipo), sv:r => norm(r.name)}, {t:'Concepto', v:r => r.concept, cls:'hide-s'}, {t:'Método', v:r => r.method, cls:'hide-s'}, {t:'Valor', v:r => money(r.amount), sv:r => r.amount, cls:'num'}, {t:'Estado', v:r => badge(r.estado), sv:r => r.estado}],
      filters:[{k:'t', label:'Tipo', opts:['Usuario','Tienda'], get:r => r.tipo}, {k:'e', label:'Estado', opts:['Aprobado','Pendiente','Rechazado','Reembolsado'], get:r => r.estado}, {k:'m', label:'Mes', opts:['sep','ago','jul','jun'], get:r => r.date.split(' ')[1]}],
      tools:`<button class="btn btn-line sm" id="pExp">Exportar a Excel</button>`,
      onRow:k => { const p = DB().payments.find(x => x.ref === k);
        const m = modal({title:`Transacción ${p.ref}`, kicker:p.tipo + ' · ' + esc(p.name), cls:'mdl-sm', body:dl([['Fecha', p.date], ['Concepto', p.concept], ['Método', p.method], ['Valor', money(p.amount)], ['Estado', badge(p.estado)]]),
          actions:[{label:'Cerrar'}].concat(p.estado === 'Aprobado' ? [{label:'Reembolsar', kind:'btn-danger', onClick:async mm => { mm.close(); if (await confirmDlg({title:'¿Reembolsar este pago?', text:`Se devolverán ${money(p.amount)} a ${esc(p.name)} por ${p.method}. Tarda de 3 a 5 días hábiles.`, ok:'Reembolsar', danger:true})){ p.estado = 'Reembolsado'; save(); t.draw(); toast('Reembolso iniciado'); } }}]
            : p.estado === 'Rechazado' ? [{label:'Reintentar cobro', kind:'btn-acc', onClick:async (mm, b) => { const done = busy(b, 'Cobrando…'); await sleep(1000); done(); p.estado = 'Aprobado'; save(); mm.close(); t.draw(); toast('Cobro aprobado'); }}] : [])}); }});
    $('#pExp', el).addEventListener('click', () => toast('Descargando pagos en Excel (.xlsx)…'));
    el.querySelector('.kpis .kpi:last-child').addEventListener('click', () => { const s = $('[data-tf="e"]', el); s.value = 'Rechazado'; s.dispatchEvent(new Event('change')); });
  }

  function cuenta(el){
    const a = X.acct();
    shell(el, '', 'Mi cuenta', 'Administrador', `<div class="adm-detail">${card('Tus datos', dl([['Nombre', esc(a.name)], ['Correo', esc(X.me().email)], ['Rol', 'Administrador StyleRadar'], ['Permisos', 'Usuarios, tiendas, fundaciones, moderación y pagos']]))}
      ${card('Datos de demostración', `<p class="mdl-p">Restablece todos los datos del prototipo (cuentas, publicaciones, donaciones y pagos) a su estado inicial.</p><div class="pf-row-actions"><button class="btn btn-line danger" id="rsDb">Restablecer datos</button></div>`)}</div>`);
    $('#rsDb', el).addEventListener('click', async () => { if (await confirmDlg({title:'¿Restablecer todos los datos?', text:'Se perderán los cambios hechos en esta demostración en este navegador.', ok:'Restablecer', danger:true})){ X.resetDB(); toast('Datos restablecidos'); X.route(); } });
  }

  /* ================= PLAYLISTS: las de mayor interacción y cuáles se destacan en el inicio ================= */
  function playlists(el){
    const score = p => p.likes + p.saves * 2;
    const rows = () => Object.entries(DB().pl).filter(([, p]) => p.vis === 'Pública').map(([id, p]) => Object.assign({id, score:score(p)}, p)).sort((a, b) => b.score - a.score);
    const feat = () => DB().featured || (DB().featured = ['p3']);
    shell(el, 'playlists', 'Playlists', 'Moderación · destacados del inicio', `
      <div class="banner">${ICON.spark}<div><b>Destaca hasta 3 playlists en el inicio</b><span>La lista está ordenada por interacción (me gusta + guardados × 2). Las destacadas aparecen con la etiqueta «★ Destacada» en la sección Playlists de estilo.</span></div></div>
      <div id="tbl"></div>`);
    table($('#tbl', el), {rows, search:{ph:'Buscar playlist o creador', text:r => r.name + ' ' + r.owner.name},
      cols:[{t:'#', v:r => rows().findIndex(x => x.id === r.id) + 1, sv:r => -r.score, cls:'num'}, {t:'Playlist', v:r => `<b>${esc(r.name)}</b>`, sv:r => norm(r.name)}, {t:'Creada por', v:r => esc(r.owner.name)},
        {t:'Me gusta', v:r => r.likes.toLocaleString('es-CO'), sv:r => r.likes, cls:'num'}, {t:'Guardados', v:r => r.saves.toLocaleString('es-CO'), sv:r => r.saves, cls:'num'}, {t:'Prendas', v:r => r.ids.length + '/15', sv:r => r.ids.length, cls:'num hide-s'},
        {t:'Inicio', v:r => `<button type="button" class="btn sm ${feat().includes(r.id) ? 'btn-acc' : 'btn-line'}" data-feat="${r.id}">${feat().includes(r.id) ? '★ Destacada' : 'Destacar'}</button>`, sort:false}]});
    el.onclick = e => { const b = e.target.closest('[data-feat]'); if (!b) return; const f = feat(); const id = b.dataset.feat; const i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1); else { if (f.length >= 3){ toast('Ya hay 3 playlists destacadas. Quita una primero.', {error:true}); return; } f.push(id); }
      save(); const on = f.includes(id); b.className = `btn sm ${on ? 'btn-acc' : 'btn-line'}`; b.textContent = on ? '★ Destacada' : 'Destacar';
      toast(on ? `<b>${esc(DB().pl[id].name)}</b> se destaca en el inicio` : 'Ya no se destaca en el inicio'); if (X.markFeatured) X.markFeatured(); };
  }
  function vAdmin(el, [sec = 'resumen', id]){
    ({resumen, usuarios, tiendas, fundaciones, publicaciones, playlists, pagos, cuenta}[sec] || resumen)(el, id);
  }
  view('admin', {fn:vAdmin, roles:['admin'], acc:'#48119A', title:a => 'Admin · ' + ({resumen:'Estadísticas', usuarios:'Usuarios', tiendas:'Tiendas', fundaciones:'Fundaciones', publicaciones:'Publicaciones', playlists:'Playlists', pagos:'Pagos', cuenta:'Mi cuenta'}[a[0]] || 'Estadísticas')});
})();
