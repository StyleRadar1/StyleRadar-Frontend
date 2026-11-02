/* =====================================================================
   StyleRadar · rol USUARIO
   ===================================================================== */
(() => {
  const X = window.SRX;
  const {A, SR, $, $$, reduce, money, esc, norm, uid, sleep, ini, today, ICON, P, STORES, FOUNDS, PLAN, COLORS, STYLES, PHOTO_OF,
    storeName, avail, visible, imgSrc, imgOf, thumbOf, flagLabel, U, toast, modal, confirmDlg, emptyState, fErr, V, check, busy, tip, crumbs, vfoot, chipsPick, view, go} = X;
  const save = () => X.save();
  const DB = () => X.DB;
  const brandOf = p => p.brand || (p.store === 'seg' ? 'Segunda mano' : storeName(p.store));
  const isUser = () => X.role() === 'user' || !X.me();
  const isMember = () => X.role() === 'user';

  /* ============ prendas: tarjetas, detalle y acciones ============ */
  const inWish = id => isMember() && U().wish.includes(id);
  const heart = id => isUser() ? `<button class="heart${inWish(id) ? ' on' : ''}" data-id="${id}" aria-pressed="${inWish(id)}" aria-label="Guardar en wishlist" data-cursor="Guardar">${ICON.heart}</button>` : '';
  const hasAlert = pid => isMember() && U().alerts.some(a => a.pid === pid && a.on);
  const statusBadge = p => p.sold ? '<span class="badge out">Vendida</span>' : !avail(p) ? '<span class="badge out">Agotado</span>'
    : p.flag ? `<span class="badge${p.flag === 'nueva' ? ' alt' : ''}">${flagLabel(p.flag)}</span>` : p.store === 'seg' ? '<span class="badge">Segunda mano</span>' : '';
  const primaryAction = (p, full = true) => {
    const w = full ? ' style="width:100%"' : '';
    if (p.sold) return `<span class="btn btn-line is-static"${w}>No disponible</span>`;
    if (!avail(p)) return `<button class="btn ${hasAlert(p.id) ? 'btn-line' : 'btn-acc'}" data-alert="${p.id}"${w}>${ICON.bell}${hasAlert(p.id) ? 'Te avisaremos' : 'Avisarme'}</button>`;
    if (p.store === 'seg' && !p.mine) return `<button class="btn btn-acc" data-chat="${p.id}"${w}>${ICON.chat}Escribir al vendedor</button>`;
    return `<a class="btn btn-acc" href="#/probador" data-cursor="Probar"${w}>Probar en el maniquí</a>`;
  };
  const pCard = (p, opts = {}) => `
    <article class="p-card${avail(p) ? '' : ' is-out'}">
      <div class="p-img" data-open="${p.id}">${imgOf(p)}
        ${opts.badge != null ? opts.badge : statusBadge(p)}
        ${heart(p.id)}
        <div class="quick">${opts.quick || (isUser() ? `${primaryAction(p)}<button class="qbtn" data-addpl="${p.id}" aria-label="Agregar a una playlist" data-cursor="Playlist">${ICON.plus}</button>` : '')}</div>
      </div>
      <div class="p-row"><button class="p-name linkish" data-open="${p.id}">${esc(p.name)}</button><span class="p-price">${money(p.price)}</span></div>
      <div class="p-row lbl p-meta"><span class="${p.store === 'seg' ? 'seg' : ''}">${p.store === 'seg' ? 'Segunda mano · ' + esc(p.seller || '') : storeName(p.store)}</span><span>${opts.meta || (STORES[p.store] && STORES[p.store].d ? STORES[p.store].barrio + ' — ' + STORES[p.store].d : esc(p.cond || 'Comunidad'))}</span></div>
    </article>`;
  X.pCard = pCard;

  function productModal(id){
    const p = P[id]; if (!p) return;
    const s = STORES[p.store];
    const stockTxt = p.sold ? 'Vendida · ya no está disponible' : !avail(p) ? 'Agotado en este momento' : p.store === 'seg' ? 'Pieza única de segunda mano' : p.stock <= 3 ? `Últimas ${p.stock} unidades` : 'Disponible hoy en tienda';
    let size = null;
    const m = modal({title:esc(p.name), kicker:p.store === 'seg' ? 'Segunda mano' : storeName(p.store), wide:true, cls:'mdl-prod',
      body:`<div class="pd">
        <div class="pd-img">${imgOf(p)}${statusBadge(p)}</div>
        <div class="pd-info">
          <div class="pd-price">${money(p.price)}</div>
          <div class="pd-stock ${avail(p) ? '' : 'out'}">${avail(p) ? ICON.check : ICON.alert}${stockTxt}</div>
          <dl class="pd-dl">
            <div><dt>${p.store === 'seg' ? 'Vende' : 'Tienda'}</dt><dd>${p.store === 'seg' ? esc(p.seller) : `<a href="#/tienda/${p.store}">${storeName(p.store)}</a> · ${s ? s.barrio : ''}`}</dd></div>
            <div><dt>Marca</dt><dd>${esc(brandOf(p))}</dd></div><div><dt>Color</dt><dd>${esc(p.color)}</dd></div>
            <div><dt>Estilo</dt><dd>${STYLES[p.style] || '—'}</dd></div>${p.cond ? `<div><dt>Estado</dt><dd>${esc(p.cond)}</dd></div>` : ''}
          </dl>
          <div class="field"><span class="lab">Talla ${X.tip('Tus tallas guardadas en el perfil aparecen marcadas.')}</span>
            <div class="chips" id="pdSizes">${(p.sizes || []).map(z => `<button type="button" class="chip" aria-pressed="false" ${avail(p) ? '' : 'disabled'}>${z}</button>`).join('')}</div></div>
          <div class="pd-acts">
            ${!avail(p) ? primaryAction(p, false) : p.store === 'seg' ? (p.mine ? '<span class="btn btn-line is-static">Es tu publicación</span>' : primaryAction(p, false)) : `<button class="btn btn-acc" type="button" data-storechat="${p.store}">${ICON.chat}Preguntar a la tienda</button><button class="btn btn-line" type="button" data-tryon>${ICON.user}Pruébatela</button>`}
            ${isUser() ? `<button class="btn btn-line" data-addpl="${p.id}">${ICON.plus}Agregar a playlist</button>` : ''}
            ${heart(p.id)}
          </div>
          <p class="pd-note">${p.store === 'seg' ? 'Coordinas la entrega directamente con quien vende, por chat.' : 'Pregunta por tu talla y compra directamente en la tienda.'}</p>
        </div></div>${(() => { const sims = X.similarTo ? X.similarTo(p, 4) : []; return sims.length ? `<div class="pd-sim"><h4>Puede que también te guste</h4><div class="pd-sim-g">${sims.map(q => `<button type="button" class="pd-sim-i" data-sim="${q.id}"><span>${imgOf(q)}</span><b>${esc(q.name)}</b><em>${money(q.price)} · ${q.store === 'seg' ? 'Segunda mano' : esc(storeName(q.store))}</em></button>`).join('')}</div></div>` : ''; })()}`});
    m.el.addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (b){ m.close(); setTimeout(() => productModal(b.dataset.sim), 280); } });
    const sz = $('#pdSizes', m.el);
    const mine = isMember() ? [U().sizes.top, U().sizes.bottom, U().sizes.shoe] : [];
    $$('.chip', sz).forEach(c => { if (mine.includes(c.textContent)) c.classList.add('mine'); });
    chipsPick(sz, false, b => { size = b.textContent; sz.closest('.field').classList.remove('invalid'); const e = sz.closest('.field').querySelector('.f-err'); if (e) e.textContent = ''; });
    const hold = $('#pdHold', m.el);
    if (hold) hold.addEventListener('click', async () => {
      if (!size){ const f = sz.closest('.field'); f.classList.add('invalid'); let e = f.querySelector('.f-err'); if (!e){ e = document.createElement('span'); e.className = 'f-err'; e.setAttribute('role','alert'); f.appendChild(e); } e.textContent = 'Elige una talla para apartar la prenda.'; return; }
      const done = busy(hold, 'Apartando…'); await sleep(700); done(); m.close();
      toast(`<b>Apartada</b> 24 h en ${storeName(p.store)} · talla ${size}`);
    });
  }
  X.productModal = productModal;
  document.addEventListener('click', e => {
    if (!e.target.closest || X.role() !== 'user') return;
    const sc = e.target.closest('[data-storechat]'); if (sc){ e.preventDefault(); X.closeModals(); X.storeChat(sc.dataset.storechat); }
    if (e.target.closest('[data-tryon]')){ e.preventDefault(); X.closeModals(); location.hash = '#/probador'; }
  });

  function toggleWish(id){
    const w = U().wish; const i = w.indexOf(id);
    if (i >= 0){ w.splice(i, 1); toast('Quitada de tu wishlist', {undo:() => { w.push(id); save(); syncHearts(id); }}); }
    else { w.push(id); toast(`<b>♥</b> ${esc(P[id] ? P[id].name : 'Prenda')} en tu wishlist`); }
    save(); syncHearts(id);
  }
  const syncHearts = id => $$(`.heart[data-id="${id}"]`).forEach(b => { b.classList.toggle('on', inWish(id)); b.setAttribute('aria-pressed', inWish(id)); });
  function toggleAlert(pid){
    const u = U(); let a = u.alerts.find(x => x.pid === pid);
    if (a && a.on){ a.on = false; toast('Alerta desactivada'); }
    else { if (!a){ a = {id:uid('a'), pid, on:true, date:today()}; u.alerts.unshift(a); } a.on = true; toast(`Te avisaremos cuando <b>${esc(P[pid].name)}</b> vuelva a estar disponible`); }
    save();
    $$(`[data-alert="${pid}"]`).forEach(b => { const on = hasAlert(pid); b.classList.toggle('btn-acc', !on); b.classList.toggle('btn-line', on); b.innerHTML = `${ICON.bell}${on ? 'Te avisaremos' : 'Avisarme'}`; });
  }
  function openChat(pid){
    const p = P[pid]; if (!p) return;
    if (p.mine){ toast('Esta es tu propia publicación'); return; }
    const u = U(); let c = u.convos.find(x => x.pid === pid && x.role === 'comprador');
    if (!c){ c = {id:uid('c'), role:'comprador', with:p.seller || 'Vendedor', item:p.name, pid, msgs:[], fresh:true}; u.convos.unshift(c); save(); }
    go('#/mensajes/' + c.id);
  }
  document.addEventListener('click', e => {
    if (!isUser()) { const o = e.target.closest('[data-open]'); if (o && !e.target.closest('.heart,.quick a,.quick button')){ productModal(o.dataset.open); } return; }
    const h = e.target.closest('.heart[data-id]'); if (h){ e.preventDefault(); e.stopPropagation(); toggleWish(h.dataset.id); return; }
    const al = e.target.closest('[data-alert]'); if (al){ e.preventDefault(); e.stopPropagation(); toggleAlert(al.dataset.alert); return; }
    const ch = e.target.closest('[data-chat]'); if (ch){ e.preventDefault(); e.stopPropagation(); $$('.modal').forEach(m => m.remove()); document.documentElement.classList.remove('lock'); openChat(ch.dataset.chat); return; }
    const ap = e.target.closest('[data-addpl]'); if (ap){ e.preventDefault(); e.stopPropagation(); plPicker(ap.dataset.addpl); return; }
    const o = e.target.closest('[data-open]'); if (o && !e.target.closest('.quick')){ e.preventDefault(); productModal(o.dataset.open); }
  });

  /* ============ playlists ============ */
  const MAXPL = 15;
  const plId = id => /^\d+$/.test(id) ? 'p' + id : id;
  const PL = id => DB().pl[plId(id)];
  const myPls = () => Object.entries(DB().pl).filter(([, p]) => p.owner.email === X.me().email).map(([id, p]) => Object.assign({id}, p));
  const plCover = pl => pl.cover ? PHOTO_OF(pl.cover) : (pl.ids.map(i => P[i]).find(p => p && imgSrc(p)) ? imgSrc(pl.ids.map(i => P[i]).find(p => p && imgSrc(p))) : '');
  X.plCover = plCover; X.PL = PL; X.MAXPL = MAXPL;
  function plForm(pl, onSave){
    const isNew = !pl; pl = pl || {name:'', desc:'', vis:'Pública'};
    const m = modal({title:isNew ? 'Nueva playlist' : 'Editar playlist', kicker:'Playlist de estilo', cls:'mdl-sm',
      body:`<div class="form-col">
        <div class="field"><label for="plN">Título</label><input id="plN" maxlength="40" value="${esc(pl.name)}" placeholder="Ej. Domingo en Usaquén"><span class="f-hint">Máximo 40 caracteres</span></div>
        <div class="field"><label for="plD">Descripción <span class="opt">opcional</span></label><textarea id="plD" maxlength="160" placeholder="¿Para qué ocasión es? ¿Qué la hace especial?">${esc(pl.desc)}</textarea></div>
        <div class="field"><span class="lab">Visibilidad ${tip('Pública: cualquiera la ve y puede guardarla. Privada: solo tú la ves.')}</span>
          <div class="seg-toggle" id="plV"><button type="button" aria-pressed="${pl.vis === 'Pública'}" data-v="Pública">${ICON.eye} Pública</button><button type="button" aria-pressed="${pl.vis === 'Privada'}" data-v="Privada">${ICON.lock} Privada</button></div></div>
        <p class="f-hint">Puedes agregar hasta ${MAXPL} prendas.</p></div>`,
      actions:[{label:'Cancelar'}, {label:isNew ? 'Crear playlist' : 'Guardar cambios', kind:'btn-acc', onClick:async (mm, b) => {
        const n = $('#plN', mm.el), d = $('#plD', mm.el);
        const dup = v => myPls().some(x => norm(x.name) === norm(v) && x.id !== pl.id) ? 'Ya tienes una playlist con ese nombre. Elige otro.' : '';
        if (!check([[n, V.req('Ponle un título a tu playlist.'), V.min(3), V.max(40), dup]])) return;
        const done = busy(b); await sleep(400); done();
        onSave({name:n.value.trim(), desc:d.value.trim(), vis:$('#plV [aria-pressed="true"]', mm.el).dataset.v}); mm.close();
      }}]});
    $('#plV', m.el).addEventListener('click', e => { const b = e.target.closest('button'); if (b) $$('#plV button', m.el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  }
  const createPl = (first, after) => plForm(null, data => {
    const id = uid('u'); const a = X.acct();
    DB().pl[id] = Object.assign(data, {owner:{type:'user', email:X.me().email, name:a.name.split(' ')[0] + ' ' + ((a.name.split(' ')[1] || '')[0] || '') + '.'}, updated:'ahora', likes:0, saves:0, ids:first ? [first] : []});
    save(); toast(`Playlist <b>${esc(data.name)}</b> creada${first ? ' con 1 prenda' : ''}`);
    if (after) after(id); else go('#/playlist/' + id);
  });
  X.createPl = createPl;
  function plPicker(pid){
    const p = P[pid]; const mine = myPls();
    const m = modal({title:'Agregar a una playlist', kicker:esc(p.name), cls:'mdl-sm',
      body:`<ul class="pick-list">${mine.map(pl => { const full = pl.ids.length >= MAXPL, has = pl.ids.includes(pid);
          return `<li><button type="button" data-pl="${pl.id}" ${full || has ? 'disabled' : ''}><span class="cv">${plCover(pl) ? `<img src="${plCover(pl)}" alt="">` : ICON.list}</span>
            <span><b>${esc(pl.name)}</b><em>${pl.ids.length}/${MAXPL} prendas · ${pl.vis}${has ? ' · ya está aquí' : full ? ' · llena' : ''}</em></span>${has ? ICON.check : ICON.plus}</button></li>`; }).join('')
        || `<li class="pick-empty">${emptyState({icon:'list', title:'Aún no tienes playlists', text:'Crea tu primera playlist y esta prenda quedará adentro.', small:true})}</li>`}</ul>`,
      actions:[{label:'Cancelar'}, {label:`${ICON.plus} Nueva playlist`, kind:'btn-acc', onClick:mm => { mm.close(); createPl(pid, id => toast(`Prenda agregada a <b>${esc(DB().pl[id].name)}</b>`, {undo:() => { DB().pl[id].ids = DB().pl[id].ids.filter(x => x !== pid); save(); }})); }}]});
    $$('[data-pl]', m.el).forEach(b => b.addEventListener('click', () => {
      const pl = DB().pl[b.dataset.pl]; pl.ids.push(pid); pl.updated = 'ahora'; save(); m.close();
      toast(`Agregada a <b>${esc(pl.name)}</b> · ${pl.ids.length}/${MAXPL}`, {undo:() => { pl.ids = pl.ids.filter(x => x !== pid); save(); }});
    }));
  }

  function vPlaylist(el, [raw]){
    const id = plId(raw || '1'); const pl = DB().pl[id];
    const r = X.role() || 'user';
    const owner = pl && ((pl.owner.email && X.me() && pl.owner.email === X.me().email) || (r === 'store' && pl.owner.type === 'store' && pl.owner.id === X.acct().ref));
    if (!pl || (pl.vis === 'Privada' && !owner)){
      el.innerHTML = `${crumbs({t:'Inicio', href:X.HOME[r]}, {t:'Playlists', href:r === 'user' ? '#colecciones' : '#/mi-tienda/colecciones'}, {t:'No disponible'})}
        ${emptyState({icon:'lock', title:pl ? 'Esta playlist es privada' : 'No encontramos esta playlist', text:pl ? 'Solo quien la creó puede verla.' : 'Puede que la hayan eliminado o que el enlace esté incompleto.', actions:[{label:'Ver playlists populares', href:'#colecciones', kind:'btn-acc'}]})}${vfoot()}`;
      return;
    }
    const items = pl.ids.map(i => P[i]).filter(Boolean);
    const total = items.filter(avail).reduce((s, p) => s + p.price, 0);
    const storesIn = [...new Set(items.map(p => p.store))];
    const u = r === 'user' ? U() : null;
    const liked = u && u.liked.includes(id), saved = u && u.saved.includes(id);
    const cover = plCover(pl);
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:X.HOME[r]}, {t:pl.owner.type === 'store' ? pl.owner.name : 'Playlists', href:pl.owner.type === 'store' ? (r === 'store' ? '#/mi-tienda/colecciones' : '#/tienda/' + pl.owner.id) : (owner ? '#/perfil/playlists' : '#colecciones')}, {t:esc(pl.name)})}
      <div class="pl-top">
        <div class="pl-art">${cover ? `<img src="${cover}" alt="Portada de ${esc(pl.name)}">` : `<div class="pl-art-empty">${ICON.list}</div>`}</div>
        <div>
          <span class="lbl pl-kicker">${pl.owner.type === 'store' ? 'Colección de tienda' : 'Playlist de estilo'} · ${pl.vis === 'Privada' ? ICON.lock.replace('<svg', '<svg width="11" height="11"') + ' Privada' : 'Pública'}</span>
          <h1 class="pl-title">${esc(pl.name)}</h1>
          <div class="pl-cur"><span class="av">${ini(pl.owner.name)}</span>${esc(pl.owner.name)}${owner ? ' · tú' : ''}</div>
          <div class="pl-meta">${items.length}/${MAXPL} prendas · ${money(total)} disponibles · ${storesIn.length} ${storesIn.length === 1 ? 'tienda' : 'tiendas'} · <span id="plLikes">${pl.likes.toLocaleString('es-CO')}</span> me gusta · actualizada ${pl.updated}</div>
          ${pl.desc ? `<p class="pl-desc">${esc(pl.desc)}</p>` : ''}
          <div class="pl-actions">
            ${owner ? `<a class="btn btn-acc m-cta" href="${r === 'store' ? '#/mi-tienda/catalogo' : '#/catalogo'}">${ICON.plus} Agregar prendas</a>
              <button class="btn btn-line" id="plEdit">${ICON.edit} Editar</button>
              <button class="round" id="plDel" aria-label="Eliminar playlist" data-cursor="Eliminar">${ICON.trash}</button>`
            : `<a class="btn btn-acc m-cta" href="#/probador" data-cursor="Probar">${ICON.play} Probar el look</a>
              <button class="btn btn-line" id="plShuffle">${ICON.shuffle} Mezclar</button>
              ${u ? `<button class="round${liked ? ' on' : ''}" id="plLike" aria-pressed="${!!liked}" aria-label="Me gusta">${ICON.heart}</button>
              <button class="btn btn-line${saved ? ' on' : ''}" id="plSave" aria-pressed="${!!saved}">${saved ? ICON.check + ' Guardada' : ICON.plus + ' Guardar en mi perfil'}</button>` : ''}`}
            <button class="round" id="plShare" aria-label="Compartir" data-cursor="Compartir">${ICON.dots}</button>
          </div>
        </div>
      </div>
      <div id="plBody"></div>
      ${!owner && r === 'user' ? `<div class="pl-more"><h3>Más playlists de estilo</h3><div class="pl-more-grid">${['p1','p2','p3','p4','p5','p6','p7','p8'].filter(x => x !== id).slice(0, 4).map(x => { const o = DB().pl[x]; return `<a href="#/playlist/${x.slice(1)}"><div class="cv"><img src="${plCover(o)}" alt=""></div><b>${o.name}</b><span>${o.owner.name} · ${o.likes.toLocaleString('es-CO')} me gusta</span></a>`; }).join('')}</div></div>` : ''}
      ${vfoot()}`;
    let order = pl.ids.slice();
    const draw = () => {
      const rows = order.map(i => P[i]).filter(Boolean);
      $('#plBody', el).innerHTML = rows.length ? `
        <table class="tracks"><thead><tr><th class="n">#</th><th>Prenda</th><th class="col-store">Tienda</th><th class="col-who">Agregada por</th><th style="text-align:right">Precio</th><th></th></tr></thead>
        <tbody>${rows.map((p, i) => `
          <tr class="row${avail(p) ? '' : ' out'}" data-open="${p.id}" tabindex="0">
            <td class="n"><span class="num">${i + 1}</span><span class="pi">${ICON.play.replace('<svg', '<svg width="12" height="12"')}</span></td>
            <td><div class="tr-item">${thumbOf(p)}<div style="min-width:0"><b>${esc(p.name)}</b><span>${p.sold ? '<em class="na">Vendida · no disponible</em>' : !avail(p) ? '<em class="na">Agotado · no disponible</em>' : (p.store === 'seg' ? 'Segunda mano' : storeName(p.store)) + ' · ' + (p.sizes || []).slice(0, 3).join(' · ')}</span></div></div></td>
            <td class="col-store">${storeName(p.store)}</td>
            <td class="col-who"><span class="who"><i>${ini(p.by || pl.owner.name)}</i>${esc(p.by || pl.owner.name)}</span></td>
            <td class="pr">${avail(p) ? money(p.price) : '<s>' + money(p.price) + '</s>'}</td>
            <td class="hv">${owner ? `<button class="qx" data-rm="${p.id}" aria-label="Quitar ${esc(p.name)} de la playlist">${ICON.x}</button>` : heart(p.id)}</td>
          </tr>`).join('')}</tbody></table>
        <div class="tr-sum"><span>${rows.length} prendas · ${rows.filter(p => !avail(p)).length ? rows.filter(p => !avail(p)).length + ' no disponibles · ' : ''}${money(total)} disponibles</span><span>Tiendas: ${storesIn.map(storeName).join(' · ')}</span></div>`
        : emptyState({icon:'list', title:'Tu playlist está vacía', text:'Busca prendas en el catálogo y toca el botón «+» para agregarlas aquí. Caben hasta 15.', actions:[{label:'Explorar el catálogo', href:r === 'store' ? '#/mi-tienda/catalogo' : '#/catalogo', kind:'btn-acc'}]});
    };
    draw();
    el.onclick = async e => {
      const rm = e.target.closest('[data-rm]');
      if (rm){ e.stopPropagation(); const pid = rm.dataset.rm; const idx = pl.ids.indexOf(pid); pl.ids.splice(idx, 1); order = order.filter(x => x !== pid); save(); draw();
        toast(`Quitada de <b>${esc(pl.name)}</b>`, {undo:() => { pl.ids.splice(idx, 0, pid); order = pl.ids.slice(); save(); draw(); }}); return; }
      if (e.target.closest('#plShuffle')){ order = order.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); draw(); toast('Playlist mezclada'); }
      if (e.target.closest('#plShare')){ toast('Enlace copiado para compartir'); }
      if (e.target.closest('#plLike')){ const b = $('#plLike', el); const on = !u.liked.includes(id); if (on){ u.liked.push(id); pl.likes++; } else { u.liked = u.liked.filter(x => x !== id); pl.likes--; } save();
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); $('#plLikes', el).textContent = pl.likes.toLocaleString('es-CO'); toast(on ? 'Te gusta esta playlist' : 'Ya no te gusta'); }
      if (e.target.closest('#plSave')){ const b = $('#plSave', el); const on = !u.saved.includes(id); if (on){ u.saved.push(id); pl.saves++; } else { u.saved = u.saved.filter(x => x !== id); pl.saves--; } save();
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.innerHTML = on ? ICON.check + ' Guardada' : ICON.plus + ' Guardar en mi perfil'; toast(on ? 'Guardada en <b>Mis playlists</b>' : 'Quitada de tu perfil'); }
      if (e.target.closest('#plEdit')) plForm(pl, d => { Object.assign(pl, d, {updated:'ahora'}); save(); toast('Playlist actualizada'); X.route(); });
      if (e.target.closest('#plDel')){ const ok = await confirmDlg({title:'¿Eliminar esta playlist?', text:`Se borrará «${esc(pl.name)}» con sus ${pl.ids.length} prendas. Las prendas siguen en las tiendas.`, ok:'Eliminar playlist', danger:true});
        if (ok){ const copy = DB().pl[id]; delete DB().pl[id]; save(); go(r === 'store' ? '#/mi-tienda/colecciones' : '#/perfil/playlists'); toast('Playlist eliminada', {undo:() => { DB().pl[id] = copy; save(); go('#/playlist/' + id); }}); } }
    };
  }
  view('playlist', {fn:vPlaylist, roles:['user','store','guest'], acc:'#E8DCCB', title:'Playlist'});

  /* ============ catálogo: búsqueda + filtros ============ */
  const PRICE = {'': 'Cualquier precio', a:'Hasta $100.000', b:'$100.000 a $250.000', c:'$250.000 a $400.000', d:'Más de $400.000'};
  const inPrice = (v, k) => !k || (k === 'a' ? v <= 100000 : k === 'b' ? v > 100000 && v <= 250000 : k === 'c' ? v > 250000 && v <= 400000 : v > 400000);
  const SYN = {zapato:'calzado', zapatos:'calzado', tenis:'tenis', saco:'saco', chaqueta:'chaqueta', jean:'jean', blusa:'camisa'};
  function searchP(q, f, base){
    const toks = norm(q).split(/\s+/).filter(t => t.length > 1).map(t => SYN[t] || t.replace(/s$/, ''));
    return base.filter(p => {
      const hay = norm([p.name, brandOf(p), storeName(p.store), p.color, STYLES[p.style], p.kind, p.cond].join(' '));
      if (toks.length && !toks.every(t => hay.includes(t))) return false;
      if (f.tipo && p.kind !== f.tipo) return false;
      if (f.estilo && p.style !== f.estilo) return false;
      if (f.color && p.color !== f.color) return false;
      if (f.talla && !(p.sizes || []).includes(f.talla)) return false;
      if (f.marca && brandOf(p) !== f.marca) return false;
      if (!inPrice(p.price, f.precio)) return false;
      return true;
    });
  }
  X.searchP = searchP;
  function similar(q, f, base, n = 4){
    const toks = norm(q).split(/\s+/).filter(t => t.length > 2);
    const score = p => { const hay = norm(p.name + ' ' + p.color + ' ' + STYLES[p.style] + ' ' + p.kind); let s = 0;
      toks.forEach(t => { if (hay.includes(t.slice(0, 4))) s += 3; }); if (f.tipo && p.kind === f.tipo) s += 2; if (f.estilo && p.style === f.estilo) s += 2; if (f.color && p.color === f.color) s += 1; if (f.talla && (p.sizes || []).includes(f.talla)) s += 1; return s + (avail(p) ? .5 : 0); };
    return base.map(p => [score(p), p]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
  }
  const CATS = {formal:['Formal','Sastrería, líneas limpias y zapatos de cuero.'], casual:['Casual','Punto, denim y básicos para todos los días.'],
    urbana:['Urbana','Oversize, cargo, gorras y sneakers.']};
  function vCatalogo(el, args, q, cat){
    if (cat && !CATS[cat]) cat = null;
    const base = Object.values(P).filter(p => visible(p) && (!cat || p.style === cat));
    const tabs = `<div class="cat-tabs">${[['', 'Todas'], ...Object.entries(CATS).map(([k, v]) => [k, v[0]])].map(([k, t]) => `<a href="${k ? '#/categoria/' + k : '#/catalogo'}" class="${(cat || '') === k ? 'on' : ''}" ${(cat || '') === k ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</div>`;
    const f = {tipo:q.tipo || '', estilo:q.estilo || '', color:q.color || '', talla:q.talla || '', marca:q.marca || '', precio:q.precio || ''};
    let query = q.q || '', order = q.orden || 'rel';
    const brands = [...new Set(base.map(brandOf))].sort();
    const tallas = ['S','M','L','XL','37','38','39','40','41','42','Única'];
    const sel = (k, label, opts) => `<label class="fsel"><span class="lbl">${label}</span><select data-f="${k}"><option value="">Todos</option>${opts.map(([v, t]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:'#inicio'}, {t:'Categorías', href:'#categorias'}, {t:cat ? CATS[cat][0] : 'Todas'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">${cat ? 'Categoría · ' + base.length + ' prendas' : 'Catálogo completo'}</span><h1 class="v-title">${cat ? CATS[cat][0] : 'Todas las<br>prendas'}</h1>
        <p class="v-lead">${cat ? CATS[cat][1] + ' Lo que hay hoy en las tiendas del radar y en Segunda vida.' : 'Lo que hay hoy en las tiendas verificadas del radar y en Segunda vida. Busca con tus palabras y combina filtros.'}</p></div></div>
      ${tabs}
      <form class="search" id="cSearch" role="search">
        <span class="s-ic">${ICON.search}</span>
        <input id="cQ" type="search" value="${esc(query)}" placeholder="Busca «chaqueta de cuero», «tenis blancos», «saco formal»…" aria-label="Buscar prendas" autocomplete="off">
        <button type="button" class="s-clear" id="cClear" aria-label="Borrar búsqueda" ${query ? '' : 'hidden'}>${ICON.x}</button>
        <button class="btn btn-acc" type="submit">Buscar</button>
      </form>
      <div class="fbar" id="cF">
        ${sel('tipo', 'Tipo', [['Ropa','Ropa'],['Calzado','Calzado'],['Accesorios','Accesorios']])}
        ${cat ? '' : sel('estilo', 'Estilo', Object.entries(STYLES))}
        ${sel('color', 'Color', COLORS.map(c => [c, c]))}
        ${sel('talla', 'Talla', tallas.map(t => [t, t]))}
        ${sel('marca', 'Marca', brands.map(b => [b, b]))}
        <label class="fsel"><span class="lbl">Precio</span><select data-f="precio">${Object.entries(PRICE).map(([v, t]) => `<option value="${v}" ${f.precio === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <div class="toolbar"><div class="chips" id="cActive"></div>
        <div class="tb-r"><span class="count lbl" id="cCount" aria-live="polite"></span>
          <button class="btn btn-line sm" id="cSave" type="button">${ICON.bell} Guardar búsqueda</button>
          <label class="sel lbl">Ordenar <select id="cSort"><option value="rel">Relevancia</option><option value="asc">Precio: menor a mayor</option><option value="desc">Precio: mayor a menor</option><option value="disp">Disponibles primero</option></select></label></div></div>
      <div id="cRes" aria-busy="false"></div>${vfoot()}`;
    $('#cSort', el).value = order;
    const drawActive = () => {
      const act = Object.entries(f).filter(([, v]) => v);
      $('#cActive', el).innerHTML = act.map(([k, v]) => `<button type="button" class="chip on" data-x="${k}">${k === 'estilo' ? STYLES[v] : k === 'precio' ? PRICE[v] : esc(v)} ${ICON.x.replace('<svg', '<svg width="10" height="10"')}</button>`).join('')
        + (act.length || query ? `<button type="button" class="linkish lbl" id="cReset">Limpiar todo</button>` : `<span class="lbl" style="color:var(--fog)">Sin filtros · ${base.length} prendas</span>`);
      $('#cSave', el).disabled = !(act.length || query.trim());
      $('#cSave', el).title = $('#cSave', el).disabled ? 'Escribe una búsqueda o elige un filtro para poder guardarla' : '';
    };
    let tmr;
    const run = (instant) => {
      const res = $('#cRes', el); res.setAttribute('aria-busy', 'true'); res.classList.add('loading');
      clearTimeout(tmr);
      const t0 = performance.now();
      tmr = setTimeout(() => {
        let items = searchP(query, f, base);
        if (order === 'asc') items.sort((a, b) => a.price - b.price);
        if (order === 'desc') items.sort((a, b) => b.price - a.price);
        if (order === 'disp') items.sort((a, b) => avail(b) - avail(a));
        const secs = ((performance.now() - t0) / 1000 + .12).toFixed(2).replace('.', ',');
        $('#cCount', el).textContent = `${items.length} ${items.length === 1 ? 'prenda' : 'prendas'} · ${secs} s`;
        res.innerHTML = items.length ? `<div class="p-grid">${items.map(p => pCard(p)).join('')}</div>`
          : `${emptyState({icon:'search', title:query ? `No encontramos «${esc(query)}»` : 'Ninguna prenda cumple estos filtros',
              text:'Revisa cómo está escrito, usa una palabra más general o quita algún filtro. También puedes guardar la búsqueda y te avisamos cuando llegue algo así.',
              actions:[{label:'Quitar filtros', attr:'data-reset', kind:'btn-acc'}, {label:`${ICON.bell} Avisarme cuando llegue`, attr:'data-savesearch'}]})}
            <div class="similar"><h3>Prendas similares</h3><p class="lbl" style="color:var(--fog)">No son exactamente lo que buscas, pero se parecen</p><div class="p-grid">${similar(query, f, base).map(p => pCard(p)).join('')}</div></div>`;
        res.classList.remove('loading'); res.setAttribute('aria-busy', 'false');
        const qs = new URLSearchParams(Object.assign({}, query ? {q:query} : {}, Object.fromEntries(Object.entries(f).filter(([, v]) => v)), order !== 'rel' ? {orden:order} : {})).toString();
        history.replaceState(null, '', (cat ? '#/categoria/' + cat : '#/catalogo') + (qs ? '?' + qs : ''));
      }, instant ? 0 : 260);
      drawActive();
    };
    run(true);
    const qi = $('#cQ', el);
    qi.addEventListener('input', () => { query = qi.value; $('#cClear', el).hidden = !query; run(); });
    $('#cSearch', el).addEventListener('submit', e => { e.preventDefault(); query = qi.value; run(true); qi.blur(); });
    $('#cClear', el).addEventListener('click', () => { qi.value = query = ''; $('#cClear', el).hidden = true; run(true); qi.focus(); });
    $('#cF', el).addEventListener('change', e => { const s = e.target.closest('[data-f]'); if (s){ f[s.dataset.f] = s.value; run(true); } });
    $('#cSort', el).addEventListener('change', e => { order = e.target.value; run(true); });
    const reset = () => { Object.keys(f).forEach(k => f[k] = ''); query = qi.value = ''; $$('#cF select', el).forEach(s => s.value = ''); run(true); };
    el.onclick = e => {
      const x = e.target.closest('[data-x]'); if (x){ f[x.dataset.x] = ''; $(`#cF [data-f="${x.dataset.x}"]`, el).value = ''; run(true); }
      if (e.target.closest('#cReset,[data-reset]')) reset();
      if (e.target.closest('#cSave,[data-savesearch]')) saveSearch(query, Object.assign({}, f));
    };
  }
  function saveSearch(q, f){
    const parts = [q, ...Object.entries(f).filter(([, v]) => v).map(([k, v]) => k === 'estilo' ? STYLES[v] : k === 'precio' ? PRICE[v] : v)].filter(Boolean);
    const m = modal({title:'Guardar búsqueda', kicker:'Búsquedas y alertas', cls:'mdl-sm',
      body:`<div class="form-col"><div class="field"><label for="ssN">Nombre</label><input id="ssN" maxlength="40" value="${esc(parts.join(' · ').slice(0, 40))}"></div>
        <label class="tg-inline"><span><b>Avisarme cuando haya prendas nuevas</b><em>Te llega una notificación cuando una tienda publique algo que coincida.</em></span><button type="button" class="switch" role="switch" aria-checked="true" id="ssA" aria-label="Activar alerta"></button></label>
        <p class="f-hint">La encontrarás en tu perfil, en «Búsquedas y alertas».</p></div>`,
      actions:[{label:'Cancelar'}, {label:'Guardar', kind:'btn-acc', onClick:(mm) => {
        const n = $('#ssN', mm.el); if (!check([[n, V.req('Ponle un nombre para reconocerla después.')]])) return;
        const s = {id:uid('s'), name:n.value.trim(), q, f, alert:$('#ssA', mm.el).getAttribute('aria-checked') === 'true', date:today()};
        U().searches.unshift(s); save(); mm.close();
        toast(`Búsqueda guardada${s.alert ? ' con alerta' : ''}`, {undo:() => { U().searches = U().searches.filter(x => x.id !== s.id); save(); }});
      }}]});
    $('#ssA', m.el).addEventListener('click', e => { const b = e.currentTarget; b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); });
  }
  view('catalogo', {fn:vCatalogo, roles:['user','guest'], acc:'#48119A', title:'Todas las prendas'});
  view('categoria', {fn:(el, a, q) => vCatalogo(el, [], q, a[0]), roles:['user','guest'], acc:'#48119A', title:a => (CATS[a[0]] || ['Categoría'])[0]});

  /* ============ tienda (vista pública) ============ */
  function storeHero(s){
    const src = s.photoData || X.storePhotos(s)[0] || (s.photo && PHOTO_OF(s.photo));
    return `<div class="st-hero">${src ? `<img src="${src}" alt="Fachada de ${esc(s.name)}">` : `<div class="st-hero-type" aria-hidden="true"><span>${esc(s.name)}</span></div>`}</div>`;
  }
  X.storeHero = storeHero;
  /* fotos de la tienda física: las que sube la tienda + la fachada de ejemplo */
  X.storePhotos = s => { const v2 = A.v2 || {}; const own = (s.gallery || []).map(g => g.src); const fac = v2['s_' + s.id]; return own.length ? own : fac ? [fac] : []; };
  const storeItems = id => Object.values(P).filter(p => p.store === id && p.status !== 'retirada' && !p.removed);
  X.storeItems = storeItems;
  function vTienda(el, [id]){
    const s = STORES[id];
    if (!s || s.hidden || s.verif !== 'Verificada'){ el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Tiendas', href:'#tiendas'}, {t:'No disponible'})}${emptyState({icon:'store', title:'Esta tienda no está en el radar', text:'Puede que aún esté en verificación o que ya no sea aliada.', actions:[{label:'Ver tiendas', href:'#tiendas', kind:'btn-acc'}, {label:'Ver mapa', href:'#/mapa'}]})}${vfoot()}`; return; }
    const items = storeItems(id).filter(p => p.status === 'publicada');
    const follow = U().follow.includes(id);
    const cols = Object.entries(DB().pl).filter(([, p]) => p.owner.type === 'store' && p.owner.id === id && p.vis === 'Pública');
    const cats = ['Todo', ...new Set(items.map(p => p.lcat || p.kind))];
    el.innerHTML = `
      ${storeHero(s)}
      <div class="st-crumbs">${crumbs({t:'Inicio', href:'#inicio'}, {t:'Tiendas', href:'#tiendas'}, {t:esc(s.name)})}</div>
      <div class="st-info">
        <div><h1 style="color:${s.ink || '#FFFFFF'}">${esc(s.name)}</h1>
          <div class="st-tags"><span class="badge">${esc(s.cat)}</span><span class="badge alt">${ICON.shield.replace('<svg', '<svg width="10" height="10"')} Verificada</span><span class="badge alt">Abierta ahora</span></div>
          <p class="st-desc">${esc(s.desc)}</p></div>
        <div class="st-facts">
          <div><span class="k lbl">Dirección</span><span class="v">${esc(s.dir)}</span></div>
          <div><span class="k lbl">Distancia desde ${esc(X.geo.label(X.geo.loc()))}</span><span class="v">${s.d} · ${s.walk}</span></div>
          <div><span class="k lbl">Horario</span><span class="v">${esc(s.hours)}</span></div>
          <div><span class="k lbl">Calificación</span><span class="v">★ ${s.rating} · ${s.reviews} reseñas</span></div>
        </div>
        <div class="st-actions">
          <a class="btn btn-acc m-cta" href="#/mapa?sel=${id}" data-cursor="Ir">${ICON.pin} Cómo llegar</a>
          <button class="btn btn-line${follow ? ' on' : ''}" id="stFollow" aria-pressed="${follow}">${follow ? ICON.check + ' Siguiendo' : ICON.plus + ' Seguir tienda'}</button>
          <button class="btn btn-line" type="button" data-storechat="${id}" data-cursor="Escribir">${ICON.chat} Enviar mensaje</button>
        </div>
      </div>
      <div class="st-strip lbl"><span><b>${items.filter(avail).length}</b> prendas disponibles hoy</span><span><b>Tallas</b> ${esc(s.sizes || 'S a XL · 37 a 42')}</span><span><b>Pruébatela</b> en tienda o en el probador</span><span><b>Pago</b> ${esc(s.pay)}</span></div>
      ${(() => { const ph = X.storePhotos(s); const v2 = A.v2 || {}; return `<section class="st-phys"><div class="sec-top"><div><h2 class="sub-h">La tienda física</h2><p class="d">Así se ve ${esc(s.name)} cuando llegas. Pregunta por tu talla antes de ir con «Enviar mensaje».</p></div></div>
        <div class="phys-grid">${ph.length ? ph.slice(0, 3).map((src, i) => `<figure class="phys-ph${i === 0 ? ' big' : ''}"><img src="${src}" alt="Foto del local de ${esc(s.name)} ${i + 1}" loading="lazy"><figcaption class="lbl">${i === 0 ? 'Fachada' : 'Interior'}</figcaption></figure>`).join('')
          : `<div class="phys-empty">${emptyState({icon:'cam', title:'La tienda aún no sube fotos', text:'Mientras tanto, usa la dirección y el mapa para llegar.', small:true})}</div>`}
          <div class="phys-card"><span class="lbl">Cómo llegar</span><b>${esc(s.dir)}</b><span>${esc(s.barrio)} · ${s.d} · ${s.walk}</span><span>${esc(s.hours)}</span><span>★ ${s.rating} · ${s.reviews} reseñas</span>
            <div class="phys-a"><a class="btn btn-acc sm" href="#/mapa?sel=${id}">${ICON.pin} Ver en el mapa</a><button class="btn btn-line sm" type="button" data-storechat="${id}">${ICON.chat} Escribir</button></div></div></div></section>`; })()}
      ${cols.length ? `<div class="st-cols"><h2 class="sub-h">Colecciones de la tienda</h2><div class="pl-more-grid">${cols.map(([cid, c]) => `<a href="#/playlist/${cid}"><div class="cv">${plCover(c) ? `<img src="${plCover(c)}" alt="">` : ''}</div><b>${esc(c.name)}</b><span>${c.ids.length} prendas · ${c.likes} me gusta</span></a>`).join('')}</div></div>` : ''}
      ${(() => { const nw = X.weekNew(items); return `<section class="st-new"><div class="sec-top"><div><h2 class="sub-h">Novedades de la semana</h2><p class="d">Lo que ${esc(s.name)} publicó en los últimos 7 días.</p></div><span class="lbl st-new-n">${nw.length} ${nw.length === 1 ? 'prenda nueva' : 'prendas nuevas'}</span></div>
        ${nw.length ? `<div class="p-grid">${nw.slice(0, 4).map(p => pCard(p, {meta:'Llegó ' + X.agoTxt(p)})).join('')}</div>` : emptyState({icon:'spark', title:'Esta semana no hay novedades', text:'Sigue la tienda y te avisamos cuando publique algo nuevo.', small:true})}</section>`; })()}
      <h2 class="sub-h">Catálogo</h2>
      <div class="toolbar"><div class="chips" id="stF">${cats.map((f, i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${f}">${f}</button>`).join('')}</div>
        <label class="sel lbl">Ordenar <select id="stSort"><option value="rel">Destacados</option><option value="asc">Precio: menor a mayor</option><option value="desc">Precio: mayor a menor</option></select></label></div>
      <div id="stGrid"></div>${vfoot()}`;
    const draw = () => {
      const f = $('#stF [aria-pressed="true"]', el).dataset.f, o = $('#stSort', el).value;
      let list = items.filter(p => (f === 'Todo' || (p.lcat || p.kind) === f) && avail(p));
      const out = items.filter(p => (f === 'Todo' || (p.lcat || p.kind) === f) && !avail(p));
      if (o === 'asc') list.sort((a, b) => a.price - b.price); if (o === 'desc') list.sort((a, b) => b.price - a.price);
      $('#stGrid', el).innerHTML = list.length ? `<div class="p-grid">${list.map(p => pCard(p, {meta:(p.sizes || []).join(' · ')})).join('')}</div>`
        : emptyState({icon:'store', title:items.length ? 'No hay prendas en este filtro' : 'Esta tienda aún no tiene prendas publicadas', text:items.length ? 'Prueba con otra categoría.' : 'Síguela y te avisaremos cuando publique.', actions:items.length ? [{label:'Ver todo', attr:'data-all', kind:'btn-acc'}] : []});
      if (out.length) $('#stGrid', el).insertAdjacentHTML('beforeend', `<details class="st-out"><summary class="lbl">Agotadas · ${out.length} · no aparecen en los resultados, activa «Avisarme» para saber cuándo vuelven</summary><div class="p-grid">${out.map(p => pCard(p)).join('')}</div></details>`);
    };
    draw();
    chipsPick($('#stF', el), false, draw);
    $('#stSort', el).addEventListener('change', draw);
    el.onclick = e => {
      if (e.target.closest('[data-all]')){ $$('#stF .chip', el).forEach((c, i) => c.setAttribute('aria-pressed', i === 0)); draw(); }
      const fb = e.target.closest('#stFollow'); if (fb){ const u = U(); const on = !u.follow.includes(id); if (on) u.follow.push(id); else u.follow = u.follow.filter(x => x !== id); save();
        fb.classList.toggle('on', on); fb.setAttribute('aria-pressed', on); fb.innerHTML = on ? ICON.check + ' Siguiendo' : ICON.plus + ' Seguir tienda'; toast(on ? `Ahora sigues a <b>${esc(s.name)}</b>` : `Dejaste de seguir a ${esc(s.name)}`); }
    };
  }
  view('tienda', {fn:vTienda, roles:['user','guest'], acc:a => (STORES[a[0]] || {}).ink || '#B9B9CA', title:a => (STORES[a[0]] || {}).name || 'Tienda'});

  /* ============ fundación (vista pública) ============ */
  const FD_EXTRA = {
    abrigo:{ph:'f_abrigo', who:'Personas en situación de calle y familias recién llegadas a Chapinero', acts:['Jornadas nocturnas de entrega de chaquetas y cobijas','Ropero abierto los sábados para familias','Lavado y arreglo de prendas con voluntarios']},
    suba:{ph:'f_suba', who:'Niñas, niños y madres cabeza de hogar de Suba', acts:['Ropero comunitario con cita','Kits escolares de uniforme y zapatos','Talleres de costura para mamás']},
    kennedy:{ph:'f_kennedy', who:'Familias de Kennedy y Bosa con bajos ingresos', acts:['Clasificación de donaciones con voluntarios','Mercados de ropa a $1.000 para financiar la sede','Entregas en colegios del barrio']},
    dignidad:{ph:'f_dignidad', who:'Personas que buscan trabajo y necesitan ropa formal para sus entrevistas', acts:['Asesoría de imagen para entrevistas','Préstamo de trajes y blazers','Alianzas con bolsas de empleo']},
    manos:{ph:'f_manos', who:'Comunidades de Bosa', acts:['Banco de ropa por tallas','Entregas mensuales en salones comunales']}
  };
  X.FD_EXTRA = FD_EXTRA;
  X.foundPhoto = f => { const v2 = A.v2 || {}; const x = FD_EXTRA[f.id]; return f.photoData || (x && v2[x.ph]) || v2.f_manos || ''; };
  function foundHero(f){
    const src = X.foundPhoto(f);
    if (src) return `<div class="fd-hero has-photo" style="--fc:${f.color}"><img src="${src}" alt="Personas de ${esc(f.short || f.name)} en una jornada de entrega de ropa"><div class="fd-grain"></div></div>`;
    return `<div class="fd-hero" style="--fc:${f.color}"><div class="fd-mono" aria-hidden="true">${ini(f.short || f.name)}</div><div class="fd-grain"></div></div>`;
  }
  X.foundHero = foundHero;
  function foundBody(f, editable){
    const [rec, fam, yrs] = f.stats || [0, 0, 0];
    return `
      <div class="fd-info">
        <div><span class="lbl" style="color:var(--acc-tx)">Fundación aliada · ${esc(f.barrio)}</span><h1>${esc(f.name)}</h1>
          <p class="fd-mission">${esc(f.mission) || '<em class="muted">Aún no hay una descripción de la misión.</em>'}</p></div>
      </div>
      ${(() => { const x = FD_EXTRA[f.id]; const v2 = A.v2 || {}; if (!x) return ''; const gal = [X.foundPhoto(f), v2.second].filter(Boolean);
        return `<div class="fd-know"><section class="fd-card fd-who"><h2>A quién ayudamos</h2><p>${esc(x.who)}.</p><h3 class="lbl">Qué hacemos</h3><ul class="fd-acts">${x.acts.map(a => `<li>${ICON.check}<span>${esc(a)}</span></li>`).join('')}</ul></section>
          <section class="fd-gal">${gal.map((g, i) => `<figure><img src="${g}" alt="${i ? 'Ropa donada lista para entregar' : 'Actividad de la fundación'}" loading="lazy"><figcaption class="lbl">${i ? 'Así llegan tus donaciones' : 'Nuestro trabajo'}</figcaption></figure>`).join('')}</section></div>`; })()}
      <div class="fd-grid">
        <section class="fd-card"><h2>Qué recibimos</h2>${f.accepts.length ? `<div class="chips">${f.accepts.map(a => `<span class="chip static">${esc(a)}</span>`).join('')}</div>` : emptyState({icon:'gift', title:'Sin categorías todavía', text:editable ? 'Cuéntale a la gente qué tipo de ropa reciben.' : 'La fundación aún no lo ha publicado.', small:true})}</section>
        <section class="fd-card"><h2>Lo que más necesitamos</h2>${f.needs.length ? `<ul class="needs">${f.needs.map(([t, v]) => `<li><span>${esc(t)}</span><div class="pbar"><i style="width:${Math.round(v * 100)}%"></i></div><em>${Math.round(v * 100)}% de la meta</em></li>`).join('')}</ul>` : emptyState({icon:'chart', title:'Sin metas publicadas', small:true})}</section>
        <section class="fd-card"><h2>Contacto</h2><dl class="pd-dl">
          <div><dt>Dirección</dt><dd>${esc(f.dir) || '—'}</dd></div><div><dt>Horario</dt><dd>${esc(f.hours) || '—'}</dd></div>
          <div><dt>Teléfono</dt><dd>${esc(f.tel) || '—'}</dd></div><div><dt>Correo</dt><dd>${esc(f.email) || '—'}</dd></div><div><dt>Web</dt><dd>${esc(f.web) || '—'}</dd></div></dl></section>
      </div>`;
  }
  X.foundBody = foundBody;
  function vFundacion(el, [id]){
    const f = FOUNDS[id];
    if (!f || f.hidden || f.state !== 'Activa'){ el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Fundaciones', href:'#fundaciones'}, {t:'No disponible'})}${emptyState({icon:'gift', title:'Esta fundación no está recibiendo donaciones', text:'Puedes donar a otra fundación aliada.', actions:[{label:'Ver fundaciones', href:'#fundaciones', kind:'btn-acc'}]})}${vfoot()}`; return; }
    el.innerHTML = `${foundHero(f)}<div class="st-crumbs">${crumbs({t:'Inicio', href:'#inicio'}, {t:'Fundaciones', href:'#fundaciones'}, {t:esc(f.short || f.name)})}</div>
      ${foundBody(f, false)}
      <div class="fd-acts"><a class="btn btn-acc m-cta" href="#/vender?f=${id}">${ICON.gift} Donar una prenda</a><a class="btn btn-line" href="#/mapa?sel=${id}">${ICON.pin} Cómo llegar</a></div>
      <section class="fd-contact"><h2 class="sub-h">Escríbele a la fundación</h2>
        ${!X.me() ? `<button type="button" class="btn btn-line" data-needlogin="Inicia sesión para escribirle a la fundación">${ICON.chat} Inicia sesión para escribir</button></section>${vfoot()}` : `<form id="fdForm" class="form-grid" novalidate>
          <div class="field"><label for="fcN">Tu nombre</label><input id="fcN" value="${esc(X.acct().name)}"></div>
          <div class="field"><label for="fcE">Tu correo</label><input id="fcE" type="email" value="${esc(X.me().email)}"></div>
          <div class="field full"><label for="fcT">Asunto</label><select id="fcT"><option value="">Elige un asunto</option><option>Quiero donar</option><option>Quiero ser voluntario</option><option>Recogida a domicilio</option><option>Otro</option></select></div>
          <div class="field full"><label for="fcM">Mensaje</label><textarea id="fcM" maxlength="500" placeholder="Cuéntales qué quieres donar o en qué quieres ayudar."></textarea><span class="f-hint" id="fcC">0/500</span></div>
          <div class="full form-acts"><button type="reset" class="btn btn-line">Borrar</button><button class="btn btn-acc" type="submit">Enviar mensaje</button></div>
        </form></section>${vfoot()}`}`;
    if (!X.me()) return;
    $('#fcM', el).addEventListener('input', e => $('#fcC', el).textContent = `${e.target.value.length}/500`);
    $('#fdForm', el).addEventListener('submit', async e => {
      e.preventDefault();
      if (!check([[$('#fcN', el), V.req('Escribe tu nombre.')], [$('#fcE', el), V.req('Escribe tu correo.'), V.email], [$('#fcT', el), V.req('Elige un asunto.')], [$('#fcM', el), V.req('Escribe tu mensaje.'), V.min(15)]])) return;
      const b = e.submitter || $('#fdForm button[type=submit]', el); const done = busy(b, 'Enviando…'); await sleep(800); done();
      e.target.reset(); $('#fcC', el).textContent = '0/500'; toast(`Mensaje enviado a <b>${esc(f.short)}</b>. Te responderán a tu correo.`);
    });
  }
  view('fundacion', {fn:vFundacion, roles:['user','guest'], acc:a => (FOUNDS[a[0]] || {}).color || '#48119A', title:a => (FOUNDS[a[0]] || {}).name || 'Fundación'});

  /* ============ mapa de moda local ============ */
  X.mapSVG = () => mapSVG();
  function mapSVG(){
    const src = ((window.SR_ASSETS || {}).v2 || {}).bog_map || '';
    const Z = (window.SR_BOG || {}).B || {};
    const lbl = ['Usaquén','Suba','Chapinero','Engativá','Teusaquillo','Fontibón','Kennedy','Centro','Bosa'].filter(k => Z[k]).map(k => `<text x="${Z[k][0] + 9}" y="${Z[k][1] - 9}">${k.toUpperCase()}</text>`).join('');
    return `<svg viewBox="0 0 640 560" class="map-svg" role="img" aria-label="Mapa de Bogotá con tiendas y fundaciones aliadas">
      <rect width="640" height="560" fill="rgba(185,185,202,.16)"/>
      ${src ? `<image href="${src}" x="0" y="0" width="640" height="560" preserveAspectRatio="none"/>` : ''}
      <g class="map-zone">${lbl}</g>
      <text x="12" y="550" class="map-attr">Mapa: © OpenStreetMap</text>
    </svg>`;
  }
  function vMapa(el, args, q){
    const pts = [...Object.values(STORES).filter(s => !s.hidden && s.verif === 'Verificada').map(s => ({t:'store', id:s.id, name:s.name, cat:s.cat, barrio:s.barrio, d:s.d, x:s.map[0], y:s.map[1], href:'#/tienda/' + s.id})),
      ...Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa').map(f => ({t:'found', id:f.id, name:f.name, cat:'Fundación', barrio:f.barrio, d:'', x:f.map[0], y:f.map[1], href:'#/fundacion/' + f.id}))];
    let filt = 'all', sel = q.sel || '';
    el.innerHTML = `${crumbs({t:'Inicio', href:'#inicio'}, {t:'Tiendas', href:'#tiendas'}, {t:'Mapa'})}
      <div class="cat-head"><div><span class="lbl" style="color:var(--acc-tx)">Mapa de moda local</span><h1 class="v-title">El radar,<br>en el mapa</h1><p class="v-lead">Tiendas verificadas y fundaciones aliadas cerca de ti. Toca un punto para ver cómo llegar.</p></div></div>
      <div class="map-wrap">
        <div class="map-box" id="mBox">${mapSVG()}<span class="me-dot" style="left:${(X.geo ? X.geo.xy() : [395, 320])[0] / 640 * 100}%;top:${(X.geo ? X.geo.xy() : [395, 320])[1] / 560 * 100}%" aria-label="Tú estás aquí"><i></i></span><div id="mPins"></div><div class="map-pop" id="mPop" hidden></div>
          <div class="map-legend lbl"><span><i class="lg s"></i>Tiendas</span><span><i class="lg f"></i>Fundaciones</span><span><i class="lg me"></i>Tú</span></div></div>
        <aside class="map-side"><div class="chips" id="mF"><button class="chip" aria-pressed="true" data-f="all">Todo</button><button class="chip" aria-pressed="false" data-f="store">Tiendas</button><button class="chip" aria-pressed="false" data-f="found">Fundaciones</button></div>
          <ul class="map-list" id="mList"></ul></aside>
      </div>${vfoot()}`;
    const draw = () => {
      const list = pts.filter(p => filt === 'all' || p.t === filt);
      $('#mPins', el).innerHTML = list.map(p => `<button class="pin t-${p.t}${p.id === sel ? ' sel' : ''}" style="left:${p.x / 640 * 100}%;top:${p.y / 560 * 100}%" data-p="${p.id}" aria-label="${esc(p.name)}, ${p.cat}">${p.t === 'store' ? ICON.store : ICON.gift}</button>`).join('');
      $('#mList', el).innerHTML = list.map(p => `<li><button class="${p.id === sel ? 'on' : ''}" data-p="${p.id}"><span class="mi t-${p.t}">${p.t === 'store' ? ICON.store : ICON.gift}</span><span><b>${esc(p.name)}</b><em>${esc(p.cat)} · ${esc(p.barrio)}${p.d ? ' · ' + p.d : ''}</em></span></button></li>`).join('')
        || `<li>${emptyState({icon:'map', title:'Nada en este filtro', small:true})}</li>`;
      const s = pts.find(p => p.id === sel); const pop = $('#mPop', el);
      if (s && list.includes(s)){ pop.hidden = false; pop.style.left = (s.x / 640 * 100) + '%'; pop.style.top = (s.y / 560 * 100) + '%';
        pop.innerHTML = `<b>${esc(s.name)}</b><span class="lbl">${esc(s.cat)} · ${esc(s.barrio)}${s.d ? ' · ' + s.d : ''}</span><div><a class="btn btn-acc sm" href="${s.href}">${s.t === 'store' ? 'Ver tienda' : 'Ver fundación'}</a><button class="btn btn-line sm" data-route="${s.id}">Ruta</button></div>`; }
      else pop.hidden = true;
    };
    draw();
    chipsPick($('#mF', el), false, b => { filt = b.dataset.f; draw(); });
    el.onclick = e => { const b = e.target.closest('[data-p]'); if (b){ sel = b.dataset.p === sel ? '' : b.dataset.p; draw(); }
      const r = e.target.closest('[data-route]'); if (r){ const s = pts.find(p => p.id === r.dataset.route); toast(`Abriendo la ruta a <b>${esc(s.name)}</b>${s.d ? ' · ' + s.d : ''}`); } };
  }
  view('mapa', {fn:vMapa, roles:['user','guest'], acc:'#48119A', title:'Mapa'});

  /* ============ publicar / editar prenda (segunda vida) ============ */
  function vVender(el, [editId], q){
    const u = U(), a = X.acct();
    const pub = editId ? u.pubs.find(p => p.id === editId) : null;
    if (editId && !pub){ el.innerHTML = `${crumbs({t:'Mi cuenta', href:'#/perfil'}, {t:'Publicación'})}${emptyState({icon:'bag', title:'No encontramos esta publicación', text:'Puede que la hayas retirado.', actions:[{label:'Ver mis publicaciones', href:'#/perfil/publicaciones', kind:'btn-acc'}]})}${vfoot()}`; return; }
    const d = pub || {title:'', cat:'Chaquetas', talla:'M', cond:'Muy bueno', brand:'', color:'', desc:'', price:'', mode:q.f ? 'donar' : 'vender', fid:q.f || 'abrigo', ship:'Punto de encuentro'};
    let mode = d.mode;
    let files = pub ? [pub.img || (pub.thumb ? A.thumbs[pub.thumb] : null)].filter(Boolean) : [];
    const founds = Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa');
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:'#inicio'}, pub ? {t:'Mis publicaciones', href:'#/perfil/publicaciones'} : {t:'Segunda vida', href:'#segunda-vida'}, {t:pub ? 'Editar' : 'Publicar una prenda'})}
      <h1 class="v-title">${pub ? 'Edita tu<br><em>publicación</em>' : 'Publica<br>una <em>prenda</em>'}</h1>
      <p class="v-lead">${pub ? 'Los cambios se ven de inmediato en Segunda vida.' : 'Cuéntanos qué es, sube buenas fotos y elige si la vendes o la donas a una fundación aliada. Tarda unos tres minutos.'}</p>
      <ol class="steps-mini lbl" aria-label="Pasos"><li>Tus datos</li><li>La prenda</li><li>Fotos</li><li>Vender o donar</li><li>Entrega</li></ol>
      <div class="sell">
        <form id="sellForm" novalidate>
          <fieldset class="fs"><legend><span class="lbl">01</span><b>Tus datos</b></legend>
            <div class="field"><label for="sN">Nombre</label><input id="sN" value="${esc(a.name)}" placeholder="Como quieres que te vean"></div>
            <div class="field"><label for="sE">Correo</label><input id="sE" type="email" value="${esc(X.me().email)}" placeholder="tucorreo@ejemplo.com"></div>
            <div class="field"><label for="sP">Celular <span class="opt">opcional</span></label><input id="sP" inputmode="tel" value="${esc(u.phone || '')}" placeholder="+57 300 000 0000"></div>
            <div class="field"><label for="sB">Barrio</label><input id="sB" value="${esc(u.barrio || '')}" placeholder="Ej. Chapinero"></div>
          </fieldset>
          <fieldset class="fs"><legend><span class="lbl">02</span><b>La prenda</b></legend>
            <div class="field full"><label for="sT">Título</label><input id="sT" value="${esc(d.title)}" placeholder="Ej. Chaqueta de jean vintage" maxlength="60"><span class="f-hint">Di qué es, el color y un detalle. Máximo 60 caracteres.</span></div>
            <div class="field"><label for="sC">Categoría</label><select id="sC">${['Chaquetas','Camisas y blusas','Suéteres','Pantalones','Vestidos y faldas','Calzado','Accesorios'].map(c => `<option ${d.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label for="sZ">Talla</label><select id="sZ">${['XS','S','M','L','XL','26','28','30','32','34','36','37','38','39','40','41','42','Única'].map(c => `<option ${d.talla === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label for="sM">Marca <span class="opt">opcional</span></label><input id="sM" value="${esc(d.brand || '')}" placeholder="Si no sabes, déjalo vacío"></div>
            <div class="field"><label for="sK">Color</label><select id="sK"><option value="">Elige un color</option>${COLORS.map(c => `<option ${d.color === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field full"><span class="lab">Estado ${tip('Como nuevo: sin señales de uso. Muy bueno: poco uso y sin detalles. Bueno: se nota el uso; cuéntalo en la descripción.')}</span><div class="chips" id="sState">${['Como nuevo','Muy bueno','Bueno'].map(s => `<button type="button" class="chip" aria-pressed="${d.cond === s}">${s}</button>`).join('')}</div></div>
            <div class="field full"><label for="sD">Descripción</label><textarea id="sD" maxlength="400" placeholder="Cuéntanos medidas, tela, cuántas veces la usaste y cualquier detalle.">${esc(d.desc || '')}</textarea><span class="f-hint" id="sDc">${(d.desc || '').length}/400</span></div>
          </fieldset>
          <fieldset class="fs"><legend><span class="lbl">03</span><b>Fotos</b></legend>
            <div class="field full" id="sDropF"><label class="drop" id="sDrop" for="sFiles" data-cursor="Subir">${ICON.up}
              <b class="lbl">Sube tus fotos</b><p>Arrastra hasta 6 imágenes JPG o PNG (máx. 8 MB c/u) o toca para elegirlas. Luz natural y fondo liso funcionan mejor.</p>
              <input id="sFiles" type="file" accept="image/*" multiple hidden></label></div>
            <div class="thumbs" id="sThumbs"></div>
          </fieldset>
          <fieldset class="fs"><legend><span class="lbl">04</span><b>¿Vender o donar?</b></legend>
            <div class="seg-toggle" id="sMode"><button type="button" aria-pressed="${mode === 'vender'}" data-m="vender">Vender</button><button type="button" aria-pressed="${mode === 'donar'}" data-m="donar">Donar</button></div>
            <div class="field" id="sPriceF" ${mode === 'donar' ? 'hidden' : ''}><label for="sPr">Precio (COP)</label><input id="sPr" inputmode="numeric" value="${d.price ? (+d.price).toLocaleString('es-CO') : ''}" placeholder="Ej. 80.000"><span class="f-hint">Prendas parecidas se venden entre $40.000 y $120.000.</span></div>
            <div class="field" id="sOfferF" ${mode === 'donar' ? 'hidden' : ''}><span class="lab">Ofertas</span><label class="check" style="padding:11px 0"><input type="checkbox" id="sOffer" checked> Acepto ofertas por chat</label></div>
            <div class="field full" id="sFundF" ${mode === 'donar' ? '' : 'hidden'}><label for="sFu">Fundaciones aliadas cercanas</label>
              <div class="fund-tools"><span class="lbl" id="sFuNear"></span><label class="check sm"><input type="checkbox" id="sFuCat" checked> Solo las que reciben esta categoría</label></div>
              <div class="fund-pick" id="sFu" role="radiogroup" aria-label="Fundación aliada"></div></div>
          </fieldset>
          <fieldset class="fs"><legend><span class="lbl">05</span><b>Entrega</b></legend>
            <div class="field full"><div class="chips" id="sShip">${['Punto de encuentro','Envío a domicilio','Recogida de la fundación'].map(s => `<button type="button" class="chip" aria-pressed="${(d.ship || 'Punto de encuentro') === s}" ${s === 'Recogida de la fundación' && mode !== 'donar' ? 'disabled' : ''}>${s}</button>`).join('')}</div></div>
            <div class="field full don-when" id="sDonF" ${mode === 'donar' ? '' : 'hidden'}><p class="f-hint">La fundación recibe tu solicitud completa, con el punto y la franja, y solo tiene que aceptarla o rechazarla.</p>
              <div class="form-grid"><div class="field"><label for="sDw">¿Cómo la entregas?</label><select id="sDw"><option>La llevo a la sede de la fundación</option><option>Que la recojan en mi dirección</option></select></div>
              <div class="field"><label for="sDd">Día</label><input id="sDd" type="date" min="${new Date(Date.now() + 864e5).toISOString().slice(0, 10)}" value="${new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10)}"></div>
              <div class="field"><label for="sDs">Franja</label><select id="sDs"><option value="">Elige una franja</option><option>8:00 a 12:00</option><option>12:00 a 15:00</option><option>15:00 a 18:00</option></select></div>
              <div class="field"><label for="sDa">Punto de entrega o recogida</label><input id="sDa" placeholder="Dirección o sede" value=""></div></div></div>
            <div class="field full"><label class="check" style="font-size:13px;color:var(--silver)"><input type="checkbox" id="sOk" ${pub ? 'checked' : ''}> Confirmo que la prenda está limpia y en buen estado.</label></div>
            <div class="full form-acts"><a class="btn btn-line" href="${pub ? '#/perfil/publicaciones' : '#segunda-vida'}">Cancelar</a><button class="btn btn-acc m-cta" type="submit" style="min-width:220px" data-cursor="Publicar">${pub ? 'Guardar cambios' : 'Publicar prenda'}</button></div>
          </fieldset>
        </form>
        <aside class="sell-prev" aria-label="Vista previa de la publicación">
          <span class="lbl" style="color:var(--fog)">Así se verá en Segunda vida</span>
          <div class="prev-card"><div class="prev-img" id="pvImg"><span class="empty">Tu foto de portada aparece aquí</span><span class="badge" id="pvBadge">Segunda mano</span></div>
            <div class="prev-body"><span class="t" id="pvT">Título de tu prenda</span><div class="row lbl"><span id="pvMeta"></span><span class="price" id="pvPr">$0</span></div><div class="row lbl"><span id="pvWho"></span><span id="pvShip"></span></div></div></div>
          <ul class="tips"><li>Muestra la prenda completa y un detalle de la tela o la etiqueta.</li><li>Las publicaciones con 3 fotos o más se venden el doble de rápido.</li><li>Si donas, eliges el punto y la franja de entrega; la fundación solo acepta o rechaza.</li></ul>
        </aside>
      </div>${vfoot()}`;
    const pick = id => $(`#${id} [aria-pressed="true"]`, el);
    const fid = () => ($('#sFu [aria-checked="true"]', el) || {}).dataset?.fid;
    const upd = () => {
      $('#pvT', el).textContent = $('#sT', el).value.trim() || 'Título de tu prenda';
      $('#pvMeta', el).textContent = `Talla ${$('#sZ', el).value} · ${(pick('sState') || {}).textContent || 'Estado'}`;
      const pr = parseInt(($('#sPr', el).value || '').replace(/\D/g, ''), 10);
      $('#pvPr', el).textContent = mode === 'donar' ? 'Donación' : (pr ? money(pr) : '$0');
      $('#pvBadge', el).textContent = mode === 'donar' ? 'Donación · ' + ((FOUNDS[fid()] || {}).short || '') : 'Segunda mano';
      $('#pvWho', el).textContent = ($('#sN', el).value.trim() || 'Tú') + ($('#sB', el).value.trim() ? ' · ' + $('#sB', el).value.trim() : '');
      $('#pvShip', el).textContent = (pick('sShip') || {}).textContent || '';
      const pv = $('#pvImg', el); pv.querySelector('img')?.remove(); $('.empty', pv).hidden = !!files[0];
      if (files[0]){ const im = document.createElement('img'); im.src = files[0]; im.alt = 'Portada'; pv.prepend(im); }
    };
    const drawThumbs = () => { $('#sThumbs', el).innerHTML = files.map((f, i) => `<figure><img src="${f}" alt="Foto ${i + 1}"><button type="button" data-rm="${i}" aria-label="Quitar foto ${i + 1}">×</button></figure>`).join(''); upd(); };
    const addFiles = async list => {
      const drop = $('#sDrop', el); let bad = 0, big = 0;
      for (const f of [...list]){
        if (files.length >= 6){ toast('Máximo 6 fotos por publicación', {error:true}); break; }
        if (!f.type.startsWith('image/')){ bad++; continue; }
        if (f.size > 8 * 1024 * 1024){ big++; continue; }
        drop.classList.add('loading');
        try { const r = await X.downscale(f, 900); files.push(r.src); } catch(e){ bad++; }
        drop.classList.remove('loading');
      }
      fErr($('#sFiles', el), bad ? 'Uno de los archivos no es una imagen. Usa fotos JPG o PNG.' : big ? 'Una foto pesa más de 8 MB. Súbela en menor calidad.' : '');
      drawThumbs();
    };
    drawThumbs();
    $('#sFiles', el).addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
    const drop = $('#sDrop', el);
    ['dragenter','dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave','drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
    $('#sThumbs', el).addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b){ const i = +b.dataset.rm; const f = files.splice(i, 1)[0]; drawThumbs(); toast('Foto quitada', {undo:() => { files.splice(i, 0, f); drawThumbs(); }}); } });
    ['sState','sShip'].forEach(id => chipsPick($('#' + id, el), false, () => { fErr($('#' + id, el), ''); upd(); }));
    let fidSel = d.fid;
    const fillDon = () => { const a = $('#sDa', el); if (!a) return; const f = FOUNDS[fid() || fidSel]; const sede = $('#sDw', el).value.startsWith('La llevo');
      if (!a._touched) a.value = sede ? (f ? f.dir : '') : ($('#sB', el).value.trim() ? 'Mi dirección en ' + $('#sB', el).value.trim() : ''); };
    setTimeout(() => { const a = $('#sDa', el); if (!a) return; a.addEventListener('input', () => a._touched = true); $('#sDw', el).addEventListener('change', () => { a._touched = false; fillDon(); }); $('#sFu', el).addEventListener('click', () => setTimeout(fillDon, 0)); fillDon(); }, 0);
    const drawFunds = () => {
      const bar = $('#sB', el).value.trim() || X.geo.loc(); const cat = $('#sC', el).value; const only = $('#sFuCat', el).checked;
      const list = founds.map(f => ({f, km:X.geo.kmFrom(bar, f.map), ok:X.geo.accepts(f, cat)})).filter(o => !only || o.ok).sort((a, b) => a.km - b.km);
      if (!list.some(o => o.f.id === fidSel)) fidSel = list[0] ? list[0].f.id : '';
      $('#sFuNear', el).textContent = `Ordenadas por cercanía a ${X.geo.label(bar)}`;
      $('#sFu', el).innerHTML = list.map(({f, km, ok}) => `<button type="button" role="radio" aria-checked="${fidSel === f.id}" data-fid="${f.id}" style="--fc:${f.color}"><span class="mono">${ini(f.short)}</span><span><b>${esc(f.name)}</b><em>${esc(f.barrio)} · a ${X.geo.fmt(km)} · ${ok ? 'recibe ' + esc(cat.toLowerCase()) : 'recibe ' + esc(f.accepts.slice(0, 2).join(', ').toLowerCase())}</em></span></button>`).join('')
        || `<p class="f-hint">Ninguna fundación cercana recibe ${esc(cat.toLowerCase())} en este momento. Quita el filtro para ver todas.</p>`;
    };
    drawFunds();
    ['#sB', '#sC'].forEach(k => $(k, el).addEventListener('change', drawFunds)); $('#sB', el).addEventListener('input', drawFunds); $('#sFuCat', el).addEventListener('change', drawFunds);
    $('#sFu', el).addEventListener('click', e => { const bb = e.target.closest('[data-fid]'); if (bb) fidSel = bb.dataset.fid; });
    $('#sFu', el).addEventListener('click', e => { const b = e.target.closest('[data-fid]'); if (!b) return; $$('#sFu [role=radio]', el).forEach(x => x.setAttribute('aria-checked', x === b)); upd(); });
    $('#sMode', el).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m;
      $$('#sMode button', el).forEach(x => x.setAttribute('aria-pressed', x === b));
      $('#sPriceF', el).hidden = $('#sOfferF', el).hidden = mode === 'donar'; $('#sFundF', el).hidden = mode !== 'donar'; $('#sDonF', el).hidden = mode !== 'donar'; fillDon();
      const chips = $$('#sShip .chip', el); chips[2].disabled = mode !== 'donar';
      if (mode === 'donar') chips.forEach((c, i) => c.setAttribute('aria-pressed', i === 2)); else if (chips[2].getAttribute('aria-pressed') === 'true') chips.forEach((c, i) => c.setAttribute('aria-pressed', i === 0));
      upd();
    });
    $('#sPr', el).addEventListener('input', e => { const v = e.target.value.replace(/\D/g, ''); e.target.value = v ? (+v).toLocaleString('es-CO') : ''; upd(); });
    $('#sD', el).addEventListener('input', e => $('#sDc', el).textContent = `${e.target.value.length}/400`);
    el.addEventListener('input', upd); el.addEventListener('change', upd);
    $('#sellForm', el).addEventListener('submit', async e => {
      e.preventDefault();
      const rules = [[$('#sN', el), V.req('Escribe tu nombre.')], [$('#sE', el), V.req('Escribe tu correo.'), V.email], [$('#sP', el), V.phone], [$('#sB', el), V.req('Escribe tu barrio para coordinar la entrega.')],
        [$('#sT', el), V.req('Ponle un título a la prenda.'), V.min(6)], [$('#sK', el), V.req('Elige el color principal.')], [$('#sD', el), V.req('Describe la prenda en pocas palabras.'), V.min(15)]];
      if (mode === 'vender') rules.push([$('#sPr', el), V.money(5000)]);
      let ok = check(rules);
      if (!files.length){ fErr($('#sFiles', el), 'Agrega al menos una foto de la prenda.'); if (ok) $('#sDrop', el).scrollIntoView({block:'center'}); ok = false; }
      if (!pick('sState')){ fErr($('#sState', el), 'Elige el estado de la prenda.'); ok = false; }
      if (mode === 'donar' && !fid()){ fErr($('#sFu', el), 'Elige a qué fundación quieres donar.'); ok = false; }
      if (mode === 'donar' && !check([[$('#sDs', el), V.req('Elige la franja en la que puedes entregarla.')], [$('#sDa', el), V.req('Escribe el punto de entrega o recogida.'), V.min(5)], [$('#sDd', el), V.req('Elige el día.')]])) ok = false;
      if (!$('#sOk', el).checked){ fErr($('#sOk', el), 'Confirma que la prenda está limpia y en buen estado.'); ok = false; }
      if (!ok){ toast('Revisa los campos marcados en rojo', {error:true}); return; }
      const b = e.submitter || $('#sellForm [type=submit]', el); const done = busy(b, pub ? 'Guardando…' : 'Publicando…'); await sleep(900); done();
      const data = {title:$('#sT', el).value.trim(), cat:$('#sC', el).value, talla:$('#sZ', el).value, cond:pick('sState').textContent, brand:$('#sM', el).value.trim(), color:$('#sK', el).value,
        desc:$('#sD', el).value.trim(), price:mode === 'vender' ? parseInt($('#sPr', el).value.replace(/\D/g, ''), 10) : 0, mode, fid:mode === 'donar' ? fid() : null, ship:pick('sShip').textContent, img:files[0]};
      u.phone = $('#sP', el).value.trim() || u.phone; u.barrio = $('#sB', el).value.trim() || u.barrio;
      if (pub){ Object.assign(pub, data); if (pub.thumb && files[0] !== A.thumbs[pub.thumb]) delete pub.thumb; if (!files[0] || files[0] === A.thumbs[pub.thumb]) delete pub.img; save(); X.rebuild(); toast('Publicación actualizada'); go('#/perfil/publicaciones'); return; }
      const np = Object.assign({id:uid('pub'), status:mode === 'donar' ? 'Pendiente de la fundación' : 'En revisión', date:today(), views:0, chats:0}, data);
      u.pubs.unshift(np);
      if (mode === 'donar'){ DB().donations.unshift({id:uid('d'), fid:np.fid, from:{type:'usuario', name:X.acct().name, email:X.me().email}, item:np.title, img:np.img, kind:np.cat, talla:np.talla, cond:np.cond, qty:1, date:today(), status:'pendiente', pub:np.id, pickup:{date:new Date($('#sDd', el).value + 'T12:00').toLocaleDateString('es-CO', {day:'numeric', month:'short', year:'numeric'}), slot:$('#sDs', el).value, dir:$('#sDa', el).value.trim(), how:$('#sDw', el).value}}); }
      else DB().moderation.unshift({id:uid('m'), tipo:'Segunda mano', origin:X.acct().name, item:np.title, price:np.price, img:np.img, date:today(), note:'Publicación nueva', pub:np.id, email:X.me().email});
      save(); X.rebuild();
      const ov = document.createElement('div'); ov.className = 'sell-done';
      ov.innerHTML = `<div><span class="lbl" style="color:var(--acc-tx)">${mode === 'donar' ? 'Solicitud de donación enviada' : 'Publicación enviada'}</span>
        <h2>${mode === 'donar' ? 'Gracias por donar' : 'Casi en el radar'}</h2>
        <p>${esc(np.title)} ${mode === 'donar' ? `le llegó a ${esc(FOUNDS[np.fid].name)}. Te avisaremos cuando acepte tu propuesta de entrega.` : 'está en revisión. Normalmente la aprobamos en menos de 24 horas y te avisamos.'}</p>
        <div class="es-a"><a class="btn btn-acc" href="#/perfil/publicaciones">Ver mis publicaciones</a><button class="btn btn-line" id="sAgain">Publicar otra</button></div></div>`;
      document.body.appendChild(ov);
      ov.addEventListener('click', ev => { if (ev.target.closest('a')) ov.remove(); if (ev.target.closest('#sAgain')){ ov.remove(); X.route(); } });
    });
    upd();
  }
  view('vender', {fn:vVender, roles:['user'], acc:'#E8DCCB', title:a => a[0] ? 'Editar publicación' : 'Publicar una prenda'});

  /* ============ mensajes ============ */
  const REPLIES = {comprador:['¡Hola! Sí, aún está disponible.','Puedo entregarla el sábado en la tarde, ¿te sirve?','Te la dejo en $5.000 menos si la recoges esta semana.'],
                   vendedor:['¡Perfecto, gracias!','Listo, nos vemos allá.','¿Me confirmas la hora exacta?'],
                   tienda:['¡Hola! Sí, la tenemos en tienda en esa talla.','Hoy abrimos hasta las 8:00 p. m.','Con gusto, te esperamos.'],
                   donante:['¡Gracias! Te esperamos en la sede.','Perfecto, quedó anotado.','Te confirmamos un día antes.'],
                   cliente:['¡Gracias! Paso esta semana.','Perfecto, voy el sábado.','¿Tienen parqueadero cerca?'],
                   donacion:['El jueves en la tarde me queda bien.','Puedo llevarla a la sede, ¿me confirmas la dirección?','Listo, gracias por recibirla.']};
  const ROLEL = {comprador:['Te interesa','Vende'], vendedor:['Tu publicación','Pregunta por tu prenda'], tienda:['Tienda','Tienda del radar'], donante:['Tu donación','Fundación aliada'],
                 cliente:['Cliente','Escribe a tu tienda'], donacion:['Donación','Quiere donar']};
  const QUICK = {comprador:['¿Sigue disponible?','¿Podemos vernos este fin de semana?','¿Tiene algún detalle?'], vendedor:['Sí, sigue disponible','Puedo entregarla en Chapinero','Te la dejo en un mejor precio'],
                 tienda:['¿La tienen en mi talla?','¿Hasta qué hora abren hoy?','¿Tienen otros colores?'], donante:['¿Qué día puedo llevarla?','Puedo llevarla a la sede','¿Pasan a recogerla?'],
                 cliente:['Sí, la tenemos en tu talla','Hoy abrimos hasta las 8:00 p. m.','Te esperamos en la tienda'],
                 donacion:['¿Qué día te queda bien para entregarla?','Puedes traerla a la sede de lunes a viernes','Pasamos a recogerla, ¿en qué dirección?']};
  function seedInbox(r, ref){
    if (r === 'store'){ const nm = storeName(ref); const any = Object.values(P).find(p => p.store === ref && avail(p));
      return [{id:'sc1', role:'cliente', with:'Valentina R.', item:any ? any.name : 'Consulta general', pid:any ? any.id : null, msgs:[{me:false, t:'Hola, ¿la tienen en talla M? Quisiera ir a probármela el sábado.', at:'hoy 9:40'}]},
              {id:'sc2', role:'cliente', with:'Mateo P.', item:'Consulta general', msgs:[{me:false, t:`Hola ${nm}, ¿hasta qué hora abren el domingo?`, at:'ayer 18:12'}, {me:true, t:'¡Hola Mateo! El domingo abrimos de 11:00 a. m. a 6:00 p. m.', at:'ayer 18:30'}]}]; }
    if (r === 'found') return DB().donations.filter(d => d.fid === ref && d.status === 'recogida').map(d => { const id = 'dc-' + d.id; d.chat = id;
      return {id, role:'donacion', with:d.from.name, item:d.item, did:d.id, msgs:[{me:true, t:`Hola, gracias por pensar en nosotros. ¿Qué día te queda bien para entregar «${d.item}»?`, at:'lun 10:02'}, {me:false, t:'El jueves en la tarde puedo llevarlas a la sede.', at:'lun 11:15'}]}; });
    return [];
  }
  const inbox = () => { const r = X.role(); if (r === 'user') return U().convos;
    const db = DB(); db.inbox = db.inbox || {}; const k = r + ':' + X.acct().ref; if (!db.inbox[k]){ db.inbox[k] = seedInbox(r, X.acct().ref); save(); } return db.inbox[k]; };
  X.inbox = inbox;
  /* la fundación abre (o crea) la conversación de una donación */
  X.donationChat = (f, d) => {
    const box = inbox(); let c = box.find(x => x.did === d.id);
    if (!c){ c = {id:'dc-' + d.id, role:'donacion', with:d.from.name, item:d.item, did:d.id, msgs:[]}; box.unshift(c); }
    d.chat = c.id;
    if (d.from.email && DB().users[d.from.email]){ const uc = DB().users[d.from.email].convos; if (!uc.find(x => x.did === d.id)) uc.unshift({id:'ud-' + d.id, role:'donante', with:f.short, item:d.item, did:d.id, fresh:true,
      msgs:[{me:false, t:`Hola, somos ${f.short}. Aceptamos tu donación «${d.item}». ¿Qué día te queda bien para entregarla?`, at:'ahora'}]}); }
    save(); return c;
  };
  /* la persona usuaria le escribe a una tienda */
  X.storeChat = sid => {
    const s = STORES[sid]; if (!s) return; const box = U().convos; let c = box.find(x => x.role === 'tienda' && x.sid === sid);
    if (!c){ c = {id:uid('c'), role:'tienda', with:s.name, sid, item:'Consulta a la tienda', msgs:[]}; box.unshift(c); save(); }
    location.hash = '#/mensajes/' + c.id;
  };
  function vMensajes(el, [cid]){
    const r = X.role(); const box = inbox();
    const cur = box.find(c => c.id === cid);
    const home = {user:['Mi cuenta','#/perfil'], store:['Mi tienda','#/mi-tienda'], found:['Mi fundación','#/mi-fundacion']}[r];
    const FL = r === 'user' ? [['','Todos'],['usuarios','Usuarios'],['tiendas','Tiendas'],['fundaciones','Fundaciones']] : [];
    const grp = c => ['comprador','vendedor'].includes(c.role) ? 'usuarios' : c.role === 'tienda' ? 'tiendas' : c.role === 'donante' ? 'fundaciones' : c.role;
    el.innerHTML = `${crumbs({t:home[0], href:home[1]}, {t:'Mensajes'})}
      <h1 class="v-title sm">Mensajes</h1>
      ${r === 'found' ? '<p class="v-lead">Coordina con cada donante el día y el lugar de entrega. Sin llamadas: todo queda escrito aquí.</p>' : r === 'store' ? '<p class="v-lead">Preguntas de clientes sobre tus prendas, tallas y horarios.</p>' : ''}
      <div class="chat-wrap"><div class="chat-aura" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="chat${cur ? ' has-cur' : ''}">
        <aside class="chat-list">${FL.length ? `<div class="chips" id="chF">${FL.map(([k, t], i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${k}">${t}</button>`).join('')}</div>` : ''}<ul id="chL"></ul></aside>
        <section class="chat-main" id="chM"></section>
      </div></div>${vfoot()}`;
    let flt = '';
    const drawList = () => {
      const list = box.filter(c => !flt || grp(c) === flt);
      $('#chL', el).innerHTML = list.length ? list.map(c => { const last = c.msgs[c.msgs.length - 1];
        return `<li><a href="#/mensajes/${c.id}" class="${c.id === cid ? 'on' : ''}"><span class="av">${ini(c.with)}</span><span><b>${esc(c.with)}</b><em>${(ROLEL[c.role] || ['Chat'])[0]} · ${esc(c.item)}</em><i>${last ? esc(last.t) : 'Sin mensajes todavía'}</i></span></a></li>`; }).join('')
        : `<li>${emptyState({icon:'chat', title:'No hay conversaciones', text:r === 'found' ? 'Cuando aceptes una donación y toques «Coordinar por mensajes», la conversación con quien dona aparecerá aquí.' : r === 'store' ? 'Cuando un cliente te escriba desde tu página, lo verás aquí.' : 'Cuando escribas a quien vende, a una tienda o a una fundación, la verás aquí.', small:true, actions:r === 'found' ? [{label:'Ver donaciones', href:'#/donaciones'}] : r === 'user' ? [{label:'Ver Segunda vida', href:'#/catalogo'}] : []})}</li>`;
    };
    const drawMain = () => {
      const m = $('#chM', el);
      if (!cur){ m.innerHTML = emptyState({icon:'chat', title:'Elige una conversación', text:r === 'found' ? 'Aquí acuerdas con cada donante cuándo y dónde entregar la donación.' : 'Aquí coordinas entregas y respondes preguntas.'}); return; }
      const p = cur.pid && X.P[cur.pid]; const don = cur.did && DB().donations.find(d => d.id === cur.did);
      m.innerHTML = `<header class="chat-h"><a class="chat-back" href="#/mensajes" aria-label="Volver a la lista">←</a><span class="av">${ini(cur.with)}</span><div><b>${esc(cur.with)}</b><span class="lbl">${(ROLEL[cur.role] || ['',''])[1]} · ${esc(cur.item)}</span></div>
          ${p ? `<button class="chat-item" data-open="${p.id}">${thumbOf(p)}<span>${money(p.price)}${p.sold ? ' · Vendida' : ''}</span></button>` : cur.sid ? `<a class="chat-item" href="#/tienda/${cur.sid}"><span>Ver tienda →</span></a>` : don && r === 'found' ? `<a class="chat-item" href="#/donaciones"><span>${esc(don.qty > 1 ? don.qty + ' unidades' : '1 prenda')} · ver donación →</span></a>` : ''}</header>
        <ol class="chat-msgs" id="chMsgs" aria-live="polite">${cur.msgs.map(x => `<li class="${x.me ? 'me' : ''}"><p>${esc(x.t)}</p><time>${x.at}</time></li>`).join('') || `<li class="sys">${cur.role === 'donacion' ? 'Propón un día, una franja horaria y el lugar de entrega.' : 'Escribe tu primer mensaje. Sé claro sobre talla, precio y punto de entrega.'}</li>`}</ol>
        <div class="chat-quick">${(QUICK[cur.role] || []).map(t => `<button type="button" class="chip" data-q="${esc(t)}">${t}</button>`).join('')}</div>
        <form class="chat-in" id="chIn"><label class="sr-only" for="chT">Escribe un mensaje</label><input id="chT" placeholder="Escribe un mensaje…" autocomplete="off" maxlength="500"><button class="btn btn-acc" type="submit" id="chSend" disabled aria-label="Enviar">${ICON.send}</button></form>`;
      const bx = $('#chMsgs', el); bx.scrollTop = bx.scrollHeight;
      const inp = $('#chT', el), sb = $('#chSend', el);
      inp.addEventListener('input', () => sb.disabled = !inp.value.trim());
      $('#chIn', el).addEventListener('submit', e => { e.preventDefault(); send(inp.value.trim()); });
      $$('[data-q]', el).forEach(b => b.addEventListener('click', () => send(b.dataset.q)));
      if (!window.matchMedia('(max-width:760px)').matches) inp.focus({preventScroll:true});
    };
    const send = async t => {
      if (!t) return;
      cur.msgs.push({me:true, t, at:'ahora'}); delete cur.fresh; save(); drawMain(); drawList();
      const bx = $('#chMsgs', el); const typing = document.createElement('li'); typing.className = 'typing'; typing.innerHTML = `<p><span></span><span></span><span></span></p><time>${esc(cur.with)} está escribiendo…</time>`;
      await sleep(700); if (!document.body.contains(bx)) return; bx.appendChild(typing); bx.scrollTop = bx.scrollHeight;
      await sleep(1300); typing.remove();
      const pool = REPLIES[cur.role] || REPLIES.vendedor; cur.msgs.push({me:false, t:pool[cur.msgs.length % pool.length], at:'ahora'}); save();
      if (document.body.contains(bx)){ drawMain(); drawList(); }
    };
    drawList(); drawMain();
    if (FL.length) chipsPick($('#chF', el), false, b => { flt = b.dataset.f; drawList(); });
  }
  view('mensajes', {fn:vMensajes, roles:['user','store','found'], acc:'#48119A', title:'Mensajes', keep:false});

  /* ============ probador personalizable + foto propia ============ */
  const F = {
    blanco:'brightness(1.24) contrast(1.05)', celeste:'sepia(.55) hue-rotate(165deg) saturate(1.9) brightness(1.2)', negro:'brightness(.42) contrast(1.15)',
    hueso:'sepia(.4) saturate(1.1) brightness(1.2)', gris:'brightness(.85)', carbon:'brightness(.62) contrast(1.05)',
    camel:'sepia(.95) saturate(1.8) hue-rotate(-8deg) brightness(1.08)', marino:'sepia(1) hue-rotate(182deg) saturate(2.7) brightness(.6)',
    vino:'sepia(1) hue-rotate(-38deg) saturate(3.2) brightness(.66)', cafe:'sepia(1) saturate(1.6) brightness(.6)', oliva:'sepia(1) hue-rotate(38deg) saturate(1.5) brightness(.72)',
    none:'none', cuero_negro:'brightness(.55) contrast(1.2)', cuero_cafe:'sepia(1) saturate(1.8) brightness(.62) contrast(1.1)'
  };
  const CZ = [
    {tab:'Camisas', slot:'camisa', items:[['cam-bl','Camisa Oxford blanca','lab',165000,'camisa','blanco'],['cam-ce','Camisa celeste de algodón','nomada',149000,'camisa','celeste'],['cam-ne','Camisa negra de popelina','luna',139000,'camisa','negro'],['cam-hu','Camisa hueso de lino','seg',48000,'camisa','hueso']]},
    {tab:'Pantalones', slot:'pantalon', items:[['pan-gr','Pantalón de lana gris','nomada',210000,'pantalon','carbon'],['pan-ne','Pantalón sastre negro','lab',189000,'pantalon','negro'],['pan-ca','Chino camel','lab',159000,'pantalon','camel'],['pan-ma','Pantalón azul marino','seg',62000,'pantalon','marino']]},
    {tab:'Chaquetas', slot:'chaqueta', items:[['sac-ca','Saco de lana carbón','nomada',395000,'saco','carbon'],['sac-ma','Saco azul marino','lab',360000,'saco','marino'],['sac-ol','Saco verde oliva','seg',95000,'saco','oliva'],['cue-ne','Chaqueta de cuero negra','nomada',450000,'cuero','cuero_negro'],['cue-ca','Chaqueta de cuero café','nomada',430000,'cuero','cuero_cafe']]},
    {tab:'Abrigos', slot:'abrigo', items:[['abr-ca','Abrigo largo camel','nomada',420000,'abrigo','camel'],['abr-gr','Abrigo gris de lana','seg',120000,'abrigo','gris'],['abr-ne','Abrigo negro','lab',390000,'abrigo','negro'],['abr-vi','Abrigo vino','nomada',410000,'abrigo','vino']]},
    {tab:'Zapatos', slot:'zapatos', items:[['zap-ne','Oxford negros','kicks',290000,'zapatos','cuero_negro'],['zap-ca','Oxford café','kicks',290000,'zapatos','cuero_cafe'],['ten-bl','Tenis blancos','luna',260000,'tenis','blanco'],['ten-gr','Tenis grises','luna',240000,'tenis','gris']]},
    {tab:'Accesorios', slot:null, items:[['cor-ne','Corbata negra de seda','lab',55000,'corbata','negro','corbata'],['cor-vi','Corbata vino','lab',55000,'corbata','vino','corbata'],['buf-gr','Bufanda de espiga gris','seg',38000,'bufanda','gris','bufanda'],['buf-vi','Bufanda vino','nomada',89000,'bufanda','vino','bufanda'],['guan','Guantes de cuero','seg',55000,'guantes','cuero_negro','guantes'],['cint','Cinturón de cuero','nomada',95000,'cinturon','cuero_cafe','cinturon']]},
    {tab:'Maletines', slot:'maletin', items:[['mal-ca','Maletín de cuero café','nomada',310000,'maletin','none'],['mal-ne','Maletín de cuero negro','nomada',310000,'maletin','cuero_negro'],['mal-cm','Maletín camel','seg',140000,'maletin','camel']]}
  ];
  const ORDER = ['zapatos','tenis','camisa','pantalon','cinturon','corbata','saco','cuero','abrigo','bufanda','guantes'];
  const CZI = {}; CZ.forEach(t => t.items.forEach(([id, name, store, price, layer, color, sub]) => CZI[id] = {id, name, store, price, layer, color, slot:t.slot || sub, tab:t.tab}));
  let wearing = {};
  let photo = null;    // foto propia (solo en memoria de la sesión)
  function vProbador(el){
    const mannM = (A.img || {}).maniqui || ($('#fitMann') || {}).src || '', mannF = (A.v2 || {}).maniqui_f || mannM;
    const sex = () => U().sex === 'mujer' ? 'mujer' : 'hombre';
    const mannSrc = sex() === 'mujer' ? mannF : mannM;
    const bagSrc = (SR.FIT_IMG || {}).maletin || '';
    const layerImgs = ORDER.map(k => `<img class="lay" data-layer="${k}" src="${A.layers[k] || ''}" alt="" aria-hidden="true">`).join('');
    const seen = X.mem.get('tip-probador', false);
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:'#inicio'}, {t:'Probador', href:'#probador'}, {t:'Arma tu look'})}
      <div class="cz">
        <div class="cz-stage-wrap" id="czWrap">
          <span class="cz-tl lbl" id="czMode">Maniquí de ${sex()} · talla M</span>
          <div class="cz-tr"><div class="seg-mini" id="czSrc" role="tablist" aria-label="Sobre qué probar"><button role="tab" aria-selected="true" data-s="m">Maniquí</button><button role="tab" aria-selected="false" data-s="p">Mi foto</button></div><div class="seg-mini" id="czSex" role="radiogroup" aria-label="Maniquí"><button role="radio" aria-checked="${sex() === 'mujer'}" aria-selected="${sex() === 'mujer'}" data-sx="mujer">Mujer</button><button role="radio" aria-checked="${sex() === 'hombre'}" aria-selected="${sex() === 'hombre'}" data-sx="hombre">Hombre</button></div><button class="chip" id="czUndress">Quitar todo</button></div>
          <div class="cz-stage" id="czStage"><img class="mann" id="czMann" src="${mannSrc}" alt="Maniquí blanco de ${sex()}">${layerImgs}<img class="bag" id="czBag" src="${bagSrc}" alt="" aria-hidden="true"></div>
          <div class="cz-photo" id="czPhoto" hidden></div>
          <div class="cz-floor"></div>
          <div class="cz-bl"><div class="cz-sum"><b id="czTotal">$0</b><span class="lbl" id="czCount">Sin prendas todavía</span></div><span class="lbl cz-hint">Toca una prenda<br>para ponérsela</span></div>
        </div>
        <div class="cz-panel">
          <span class="lbl" style="color:var(--acc-tx)">Probador virtual</span>
          <h1>Arma tu look</h1>
          <p>Elige prendas de las tiendas del radar y míralas puestas. También puedes subir tu foto para una visualización aproximada.</p>
          ${seen ? '' : `<div class="coach" id="czCoach"><b>¿Primera vez aquí?</b><ol><li>Elige una pestaña: camisas, pantalones, zapatos…</li><li>Toca una prenda para ponérsela; tócala otra vez para quitarla.</li><li>Guarda el look o súbelo todo a tu wishlist.</li></ol><button class="linkish lbl" id="czCoachX">Entendido</button></div>`}
          <div class="upload-row"><button class="upload" id="czUpload" data-cursor="Foto">${ICON.cam}<div><b>Cargar foto</b><span>Foto de cuerpo entero, de frente. JPG, PNG o WEBP hasta 8 MB.</span></div></button>
            <button class="upload alt" id="czSample" type="button"><img src="${(A.v2 || {}).ref || ''}" alt=""><div><b>Usar foto de ejemplo</b><span>Mira cómo funciona con una foto de referencia.</span></div></button>
            <input type="file" id="czFile" accept="image/*" hidden></div>
          <div class="cz-err" id="czErr" role="alert" hidden></div>
          <div class="cz-tabs" role="tablist" id="czTabs">${CZ.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${t.tab}">${t.tab}<sup></sup></button>`).join('')}</div>
          <div class="cz-list" id="czList" role="tabpanel"></div>
          <div class="cz-look"><span class="lbl" style="color:var(--fog)">Tu look</span><ul id="czLook"></ul></div>
          <div class="cz-acts"><button class="btn btn-line" id="czWish">Todo a la wishlist</button><button class="btn btn-acc m-cta" id="czSave">Guardar look</button></div>
        </div>
      </div>${vfoot()}`;
    const drawList = tab => {
      const t = CZ.find(x => x.tab === tab);
      $('#czList', el).innerHTML = t.items.map(([id]) => {
        const it = CZI[id]; const on = wearing[it.slot] === id;
        const src = it.layer === 'maletin' ? bagSrc : ((A.lthumb || {})[it.layer] || A.layers[it.layer]);
        return `<button class="cz-item" aria-pressed="${on}" data-id="${id}"><span class="cz-sw"><img src="${src}" alt="" style="filter:${F[it.color]}"></span>
          <b>${esc(it.name)}</b><span>${it.store === 'seg' ? 'Segunda mano' : storeName(it.store)}</span><span class="pp"><span>${money(it.price)}</span>${it.store === 'seg' ? '<i>Usada</i>' : ''}</span></button>`;
      }).join('');
    };
    const apply = () => {
      const on = {}; Object.values(wearing).forEach(id => { const it = CZI[id]; if (it) on[it.layer] = it; });
      $$('#czStage img.lay', el).forEach(img => { const it = on[img.dataset.layer]; img.classList.toggle('on', !!it); if (it) img.style.filter = F[it.color]; });
      const bag = $('#czBag', el); const b = on.maletin; bag.classList.toggle('on', !!b); if (b) bag.style.filter = F[b.color];
      const st = $('#czStage', el);
      if (st) {
        st.classList.toggle('has-camisa', !!on.camisa);
        st.classList.toggle('has-saco', !!on.saco);
        st.classList.toggle('has-abrigo', !!on.abrigo);
        st.classList.toggle('has-cuero', !!on.cuero);
        st.classList.toggle('has-pantalon', !!on.pantalon);
        st.classList.toggle('has-shoes', !!(on.zapatos || on.tenis));
        st.classList.toggle('has-top', !!(on.camisa || on.saco || on.abrigo || on.cuero));
        st.classList.toggle('has-outer', !!(on.saco || on.abrigo || on.cuero));
        st.classList.toggle('has-bottom', !!on.pantalon);
      }
      const list = Object.values(wearing).map(id => CZI[id]);
      const total = list.reduce((s, it) => s + it.price, 0);
      $('#czTotal', el).textContent = money(total);
      $('#czCount', el).textContent = list.length ? `${list.length} ${list.length === 1 ? 'prenda' : 'prendas'} · ${new Set(list.map(i => i.store)).size} tiendas` : 'Sin prendas todavía';
      $('#czLook', el).innerHTML = list.length ? list.map(it => `<li><span>${esc(it.name)}</span><span>${money(it.price)}</span><button class="qx" data-off="${it.slot}" aria-label="Quitar ${esc(it.name)}">${ICON.x}</button></li>`).join('') : '<li class="empty">El maniquí está listo. Empieza por una camisa o un pantalón.</li>';
      $$('#czTabs button', el).forEach(bt => { const n = list.filter(it => it.tab === bt.dataset.tab).length; bt.querySelector('sup').textContent = n || ''; });
      $('#czSave', el).disabled = !list.length; $('#czWish', el).disabled = !list.length;
      if (photo && photo.ready) drawPhoto();
    };
    // ----- foto propia -----
    const drawPhoto = () => {
      const box = $('#czPhoto', el);
      if (!photo){ box.innerHTML = emptyState({icon:'cam', title:'Aún no has subido una foto', text:'Súbela de cuerpo entero y de frente. La procesamos solo para esta visualización y puedes borrarla cuando quieras.', actions:[{label:`${ICON.up} Cargar foto`, attr:'data-upload', kind:'btn-acc'}, {label:'Usar foto de ejemplo', attr:'data-sample'}]}); return; }
      if (!photo.ready){ box.innerHTML = `<div class="cz-proc"><img src="${photo.src}" alt="Tu foto"><div class="proc-ov"><span class="spin lg" aria-hidden="true"></span><b id="procT">Analizando tu foto…</b><div class="pbar"><i id="procB" style="width:0%"></i></div><span class="lbl" id="procS">Esto tarda menos de 30 segundos</span><button class="btn btn-line sm" id="procX">Cancelar</button></div></div>`; return; }
      const on = {}; Object.values(wearing).forEach(id => { const it = CZI[id]; if (it) on[it.layer] = it; });
      box.innerHTML = `<div class="cz-pv"><img class="pv-base" src="${photo.src}" alt="Tu foto"><div class="pv-fit" style="left:${photo.box.x}%;top:${photo.box.y}%;height:${photo.box.h}%">${ORDER.filter(k => on[k]).map(k => `<img src="${A.layers[k]}" alt="" style="filter:${F[on[k].color]}">`).join('')}</div>
        <span class="pv-tag lbl">Visualización aproximada${Object.keys(on).length ? ' · ' + Object.keys(on).length + ' prenda' + (Object.keys(on).length === 1 ? '' : 's') : ''}</span><div class="pv-acts"><button class="btn btn-line sm" id="pvOther">${ICON.shuffle} Probar otra prenda</button><button class="btn btn-line sm pv-del" id="pvDel">${ICON.trash} Eliminar foto</button></div>
        ${Object.keys(on).length ? '' : `<div class="pv-empty lbl">${ICON.arrow || ''}Elige una prenda en la lista para verla sobre tu foto</div>`}</div>`;
    };
    const setSrc = s => {
      $$('#czSrc button', el).forEach(b => b.setAttribute('aria-selected', b.dataset.s === s));
      $('#czStage', el).hidden = s === 'p'; $('#czPhoto', el).hidden = s !== 'p'; $('.cz-floor', el).hidden = s === 'p';
      $('#czMode', el).textContent = s === 'p' ? 'Mi foto · aproximado' : `Maniquí de ${sex()} · talla M`;
      if (s === 'p') drawPhoto();
    };
    const showErr = t => { const e = $('#czErr', el); e.hidden = !t; e.innerHTML = t ? `${ICON.alert}<span>${t}</span>` : ''; };
    let procTimer = null;
    const process = (src, w, h) => {
      const land = w > h * 1.05;
      photo = {src, ready:false, box:land ? {x:38, y:4, h:92} : {x:30, y:6, h:88}}; setSrc('p');
      if (land) toast('Tu foto es horizontal: la ajustamos, pero una vertical se ve mejor');
      const steps = [['Analizando tu foto…', 30], ['Detectando hombros y cadera…', 62], ['Ajustando las prendas…', 90], ['Listo', 100]];
      let i = 0;
      const tick = () => { if (!photo || photo.ready) return; const [t, p] = steps[i]; const T = $('#procT', el), B = $('#procB', el); if (T) T.textContent = t; if (B) B.style.width = p + '%';
        i++; if (i < steps.length) procTimer = setTimeout(tick, 900); else procTimer = setTimeout(() => { if (!photo) return; photo.ready = true; drawPhoto(); toast('Tu foto está lista · agrega prendas para verlas'); }, 500); };
      tick();
    };
    const upload = async file => {
      showErr('');
      if (!/^image\//.test(file.type) || /heic|heif/i.test(file.type + file.name)) return showErr(`El formato ${esc((file.name.split('.').pop() || 'del archivo').toUpperCase())} no sirve para el probador. Sube una foto JPG, PNG o WEBP, o toca «Usar foto de ejemplo».`);
      if (file.size > 8 * 1024 * 1024) return showErr('La foto pesa más de 8 MB. Súbela en menor calidad o recórtala.');
      let r; try { r = await X.downscale(file, 1100); } catch(e){ return showErr('No pudimos abrir esa imagen. Prueba con otra foto o toca «Usar foto de ejemplo».'); }
      if (r.w < 160 || r.h < 160) return showErr('La foto es muy pequeña. Usa una de al menos 400 píxeles de alto.');
      process(r.src, r.w, r.h);
    };
    const sample = () => { showErr(''); const src = (A.v2 || {}).ref; if (!src) return; process(src, 2, 3); };
    el.onclick = async e => {
      if (e.target.closest('#czUpload,[data-upload]')) $('#czFile', el).click();
      if (e.target.closest('#czSample,[data-sample]')) sample();
      const sxb = e.target.closest('#czSex [data-sx]'); if (sxb){ U().sex = sxb.dataset.sx; save(); $$('#czSex [data-sx]', el).forEach(b => { b.setAttribute('aria-checked', b === sxb); b.setAttribute('aria-selected', b === sxb); });
        const mi = $('#czMann', el); mi.src = sex() === 'mujer' ? mannF : mannM; mi.alt = 'Maniquí blanco de ' + sex(); $('#czStage', el).dataset.sex = sex(); const mod = $('#czMode', el); if (mod) mod.textContent = 'Maniquí de ' + sex() + ' · talla M'; apply(); setSrc('m'); toast(`Maniquí de ${sex()}`); }
      if (e.target.closest('#pvOther')){ const lst = $('#czList', el); lst.scrollIntoView({behavior: X.reduce ? 'auto' : 'smooth', block:'center'}); lst.classList.remove('pulse'); void lst.offsetWidth; lst.classList.add('pulse'); toast('Toca otra prenda de la lista para una nueva prueba'); }
      if (e.target.closest('#procX')){ clearTimeout(procTimer); photo = null; drawPhoto(); toast('Carga cancelada'); }
      if (e.target.closest('#pvDel')){ const ok = await confirmDlg({title:'¿Eliminar tu foto?', text:'Se borra de StyleRadar y de este probador. Puedes subir otra cuando quieras.', ok:'Eliminar foto', danger:true, kicker:'Privacidad'});
        if (ok){ photo = null; drawPhoto(); toast('Foto eliminada de StyleRadar'); } }
      const s = e.target.closest('#czSrc button'); if (s) setSrc(s.dataset.s);
      const off = e.target.closest('[data-off]'); if (off){ const was = wearing[off.dataset.off]; delete wearing[off.dataset.off]; apply(); drawList($('#czTabs [aria-selected="true"]', el).dataset.tab); toast('Prenda quitada', {undo:() => { wearing[off.dataset.off] = was; apply(); drawList($('#czTabs [aria-selected="true"]', el).dataset.tab); }}); }
      if (e.target.closest('#czCoachX')){ X.mem.set('tip-probador', true); $('#czCoach', el).remove(); }
    };
    $('#czFile', el).addEventListener('change', e => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = ''; });
    $('#czStage', el).dataset.sex = sex();
    drawList(CZ[0].tab); apply();
    if (photo) setSrc('p');
    if (X.parseHash && /foto=1/.test(location.hash)) setTimeout(() => { setSrc('p'); }, 50);
    $('#czTabs', el).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#czTabs button', el).forEach(x => x.setAttribute('aria-selected', x === b)); drawList(b.dataset.tab); });
    $('#czList', el).addEventListener('click', e => {
      const b = e.target.closest('.cz-item'); if (!b) return;
      const it = CZI[b.dataset.id];
      if (wearing[it.slot] === it.id) delete wearing[it.slot]; else wearing[it.slot] = it.id;
      apply(); drawList(it.tab);
    });
    $('#czUndress', el).addEventListener('click', () => { const was = Object.assign({}, wearing); if (!Object.keys(was).length) return toast('El maniquí ya está sin ropa'); wearing = {}; apply(); drawList($('#czTabs [aria-selected="true"]', el).dataset.tab); toast('Maniquí sin ropa', {undo:() => { wearing = was; apply(); drawList($('#czTabs [aria-selected="true"]', el).dataset.tab); }}); });
    $('#czSave', el).addEventListener('click', async e => { const n = Object.keys(wearing).length; const done = busy(e.currentTarget); await sleep(500); done(); U().looks.unshift({id:uid('lk'), items:Object.values(wearing), date:today()}); save(); toast(`Look guardado en tu perfil · ${n} prendas`); });
    $('#czWish', el).addEventListener('click', () => { const n = Object.keys(wearing).length; toast(`${n} prendas enviadas a tu wishlist`); });
  }
  view('probador', {fn:vProbador, roles:['user'], acc:'#B9B9CA', title:'Probador'});
  X.CZI = CZI;

  /* ============ perfil ============ */
  const PF = [
    ['Mi actividad', [['publicaciones','Mis publicaciones'],['playlists','Mis playlists'],['alertas','Búsquedas y alertas'],['wishlist','Wishlist'],['recomendaciones','Recomendaciones']]],
    ['Mi cuenta', [['info','Mi información'],['privacidad','Privacidad'],['suscripcion','Suscripción']]]
  ];
  function vPerfil(el, [sec = 'info']){
    const u = U(), a = X.acct(); const first = a.name.split(' ')[0];
    const created = myPls();
    el.innerHTML = `
      ${crumbs({t:'Inicio', href:'#inicio'}, {t:'Mi cuenta'})}
      <header class="pf-head">
        <div class="pf-av" aria-hidden="true">${ini(a.name)}</div>
        <div><h1 class="pf-name">Hola, ${esc(first)}</h1><div class="pf-sub lbl">${esc(X.me().email)} · Bogotá${u.barrio ? ', ' + esc(u.barrio) : ''} · Miembro desde ${u.since} · Plan ${PLAN[u.plan].name}</div></div>
      </header>
      <div class="pf-body">
        <nav class="pf-nav" aria-label="Secciones de la cuenta">${PF.map(([g, items]) => `<span class="lbl pf-g">${g}</span>${items.map(([k, t]) => `<a href="#/perfil/${k}" class="${k === sec ? 'on' : ''}" ${k === sec ? 'aria-current="page"' : ''}>${t}</a>`).join('')}`).join('')}
          <button class="btn btn-line" id="pfOut">${ICON.out} Cerrar sesión</button></nav>
        <div id="pfSec"></div>
      </div>${vfoot()}`;
    $('#pfOut', el).addEventListener('click', X.logout);
    const S = $('#pfSec', el);
    ({info:secInfo, privacidad:secPriv, suscripcion:secSub, publicaciones:secPubs, playlists:secPls, alertas:secAlerts, wishlist:secWish, recomendaciones:secRecs}[sec] || secInfo)(S, u, a);
  }
  function secRecs(S, u){
    const on = u.feed !== false;
    const recs = on ? X.recommend(8) : [];
    S.innerHTML = `<section class="pf-sec"><h2>Recomendaciones</h2><p class="d">Elegimos prendas según tus estilos (${esc((u.styles || []).join(', ') || 'sin elegir')}), tus tallas y lo que guardas. <a class="linkish" href="#/perfil/info">Cambiar estilos y tallas</a></p>
      <div class="toggles"><div class="tg"><div><b>Feed personalizado</b><span>Ordena el inicio y el catálogo con tus preferencias. Si lo apagas, verás todo en orden de relevancia general.</span></div><button class="switch" role="switch" aria-checked="${on}" id="rcFeed" aria-label="Feed personalizado"></button></div></div>
      <h3 class="sub-h sm">Recomendado para ti</h3>
      ${!on ? emptyState({icon:'spark', title:'El feed personalizado está apagado', text:'Actívalo para ver aquí las prendas elegidas para ti.', small:true})
        : recs.length ? `<div class="p-grid">${recs.map(o => X.pCard(o.p, {meta:esc(o.why.slice(0, 2).join(' · '))})).join('')}</div>` : emptyState({icon:'spark', title:'Aún no tenemos recomendaciones', text:'Elige tus estilos y tallas en «Mi información» para empezar.', small:true, actions:[{label:'Elegir estilos', href:'#/perfil/info', kind:'btn-acc'}]})}</section>`;
    $('#rcFeed', S).addEventListener('click', () => { u.feed = !on; save(); X.route(); toast(u.feed ? 'Feed personalizado <b>activado</b>' : 'Feed personalizado <b>desactivado</b>'); });
  }
  function secInfo(S, u, a){
    S.innerHTML = `<section class="pf-sec"><h2>Mi información</h2><p class="d">Tus tallas se usan para mostrarte primero lo que hay disponible para ti en cada tienda.</p>
      <form class="pf-form" id="pfForm" novalidate>
        <div class="field two"><label for="pfN">Nombre completo</label><input id="pfN" value="${esc(a.name)}"></div>
        <div class="field"><label for="pfP">Celular</label><input id="pfP" value="${esc(u.phone)}" inputmode="tel" placeholder="+57 300 000 0000"></div>
        <div class="field two"><label for="pfE">Correo</label><input id="pfE" type="email" value="${esc(X.me().email)}" disabled><span class="f-hint">Para cambiar tu correo escríbenos a soporte.</span></div>
        <div class="field"><label for="pfB">Barrio</label><input id="pfB" value="${esc(u.barrio)}" placeholder="Ej. Chapinero"></div>
        <div class="field"><span class="lab" id="pfSxL">Maniquí del probador ${tip('El probador usa un maniquí de mujer o de hombre según lo que elijas.')}</span><div class="seg-toggle" id="pfSx" role="radiogroup" aria-labelledby="pfSxL">${[['mujer','Mujer'],['hombre','Hombre']].map(([k, t]) => `<button type="button" role="radio" aria-checked="${(u.sex || 'hombre') === k}" aria-pressed="${(u.sex || 'hombre') === k}" data-sx="${k}">${t}</button>`).join('')}</div></div>
        <div class="field"><label for="pfT1">Talla superior</label><select id="pfT1">${['XS','S','M','L','XL'].map(t => `<option ${u.sizes.top === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="pfT2">Talla inferior</label><select id="pfT2">${['26','28','30','32','34','36'].map(t => `<option ${u.sizes.bottom === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="pfT3">Calzado</label><select id="pfT3">${['36','37','38','39','40','41','42','43'].map(t => `<option ${u.sizes.shoe === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field full"><span class="lab">Estilos que más te gustan ${tip('Elige hasta 4. Los usamos para ordenar el catálogo y recomendarte playlists.')}</span>
          <div class="chips" id="pfSt">${['Formal','Casual','Urbana','Deportivo','Vintage'].map(s => `<button type="button" class="chip" aria-pressed="${u.styles.includes(s)}">${s}</button>`).join('')}</div></div>
        <div class="full form-acts"><button class="btn btn-line" type="reset" id="pfReset">Descartar cambios</button><button class="btn btn-acc" type="submit">Guardar cambios</button></div>
      </form></section>`;
    const st = $('#pfSt', S);
    st.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const on = b.getAttribute('aria-pressed') !== 'true';
      if (on && $$('.chip[aria-pressed="true"]', st).length >= 4){ fErr(st, 'Puedes elegir hasta 4 estilos. Quita uno para agregar otro.'); return; } fErr(st, ''); b.setAttribute('aria-pressed', on); });
    $('#pfSx', S).addEventListener('click', e => { const b = e.target.closest('[data-sx]'); if (!b) return; $$('#pfSx [data-sx]', S).forEach(x => { x.setAttribute('aria-checked', x === b); x.setAttribute('aria-pressed', x === b); }); });
    $('#pfReset', S).addEventListener('click', e => { e.preventDefault(); X.route(); toast('Cambios descartados'); });
    $('#pfForm', S).addEventListener('submit', async e => {
      e.preventDefault();
      if (!check([[$('#pfN', S), V.req('Escribe tu nombre.'), V.min(3)], [$('#pfP', S), V.phone]])) return;
      if (!$$('.chip[aria-pressed="true"]', st).length){ fErr(st, 'Elige al menos un estilo.'); return; }
      const done = busy(e.submitter || $('#pfForm [type=submit]', S)); await sleep(600); done();
      a.name = $('#pfN', S).value.trim(); u.phone = $('#pfP', S).value.trim(); u.barrio = $('#pfB', S).value.trim();
      u.sizes = {top:$('#pfT1', S).value, bottom:$('#pfT2', S).value, shoe:$('#pfT3', S).value};
      const sx = $('#pfSx [aria-checked="true"]', S); if (sx) u.sex = sx.dataset.sx;
      u.styles = $$('.chip[aria-pressed="true"]', st).map(c => c.textContent); save(); toast('Cambios guardados'); X.route();
    });
  }
  function secPriv(S, u){
    const sw = (k, t, d) => `<div class="tg"><div><b>${t}</b><span>${d}</span></div><button class="switch" role="switch" aria-checked="${!!u.privacy[k]}" data-pk="${k}" aria-label="${esc(t)}"></button></div>`;
    S.innerHTML = `<section class="pf-sec"><h2>Privacidad</h2><p class="d">Tú decides qué ven las tiendas y la comunidad. Puedes cambiarlo cuando quieras.</p>
      <div class="toggles">${sw('pub', 'Perfil público', 'Otras personas pueden ver tu nombre y tus playlists públicas.')}${sw('pls', 'Mostrar mis playlists', 'Tus playlists públicas aparecen en el inicio si se vuelven populares.')}
        ${sw('loc', 'Usar mi ubicación', 'Para ordenar las tiendas por distancia. Nunca compartimos tu dirección exacta.')}${sw('msg', 'Mensajes de tiendas', 'Las tiendas que sigues pueden escribirte sobre nuevas llegadas.')}
        ${sw('hist', 'Guardar historial del probador', 'Recordamos los looks que armas para que puedas volver a ellos.')}${sw('photos', 'Usar mis fotos para mejorar el probador', 'Tus fotos se procesan de forma anónima. Desactivado por defecto.')}</div>
      <div class="pf-row-actions"><button class="btn btn-line" id="pvDl">Descargar mis datos</button><button class="btn btn-line danger" id="pvDelAcc">Eliminar cuenta</button></div></section>`;
    $$('.switch', S).forEach(s => s.addEventListener('click', () => { const k = s.dataset.pk; u.privacy[k] = !u.privacy[k]; s.setAttribute('aria-checked', u.privacy[k]); save();
      toast(`${s.getAttribute('aria-label')}: ${u.privacy[k] ? 'activado' : 'desactivado'}`, {undo:() => { u.privacy[k] = !u.privacy[k]; s.setAttribute('aria-checked', u.privacy[k]); save(); }}); }));
    $('#pvDl', S).addEventListener('click', async e => { const done = busy(e.currentTarget, 'Preparando…'); await sleep(900); done(); toast('Te enviamos tus datos por correo'); });
    $('#pvDelAcc', S).addEventListener('click', async () => {
      const m = modal({title:'¿Eliminar tu cuenta?', kicker:'Acción permanente', cls:'mdl-sm', body:`<p class="mdl-p">Se borrarán tus playlists, publicaciones, mensajes y wishlist. <b>No se puede deshacer.</b></p><div class="field"><label for="delC">Escribe ELIMINAR para confirmar</label><input id="delC" autocomplete="off"></div>`,
        actions:[{label:'Cancelar'}, {label:'Eliminar cuenta', kind:'btn-danger', onClick:mm => { const i = $('#delC', mm.el); if (i.value.trim().toUpperCase() !== 'ELIMINAR') return fErr(i, 'Escribe ELIMINAR, en mayúsculas, para confirmar.'); mm.close(); toast('Te enviamos un correo para confirmar la eliminación'); }}]});
    });
  }
  function secSub(S, u, a){
    const plan = (k, feats) => { const p = PLAN[k]; const cur = u.plan === k; return `<article class="plan${cur ? ' cur' : ''}">${cur ? '<span class="badge">Tu plan</span>' : ''}<h3>${p.name}</h3><div class="pr tabular">${p.price ? money(p.price) + ' <small>/ mes</small>' : '$0 <small>· gratis</small>'}</div><ul>${feats.map(f => `<li>${f}</li>`).join('')}</ul><button class="btn ${cur ? 'btn-line' : 'btn-acc'}" data-plan="${k}" ${cur ? 'disabled' : ''}>${cur ? 'Plan actual' : 'Cambiar a ' + p.name}</button></article>`; };
    S.innerHTML = `<section class="pf-sec"><h2>Suscripción</h2><p class="d">Cambia de plan cuando quieras; el cambio aplica en tu siguiente ciclo. Estado: <b class="ok">Activa</b></p>
      <div class="plans">${plan('free', ['Tiendas y playlists sin límite','Wishlist de hasta 20 prendas','Probador con el maniquí'])}${plan('plus', ['Incluye el plan Radar','Probador con tu propia foto','Alertas de disponibilidad sin límite','Wishlist sin límite'])}</div>
      <div class="bill"><span>Próximo cobro: <b>${u.plan === 'free' ? '—' : '23 oct 2026'}</b></span><span>Método de pago: <b>${u.plan === 'free' ? '—' : 'Tarjeta •••• 4821'}</b></span></div>
      </section>`;
    $$('[data-plan]', S).forEach(b => b.addEventListener('click', async () => { const k = b.dataset.plan; const p = PLAN[k];
      const ok = await confirmDlg({title:`¿Cambiar a ${p.name}?`, text:p.price ? `Desde tu próximo ciclo pagarás ${money(p.price)} al mes con tu tarjeta •••• 4821. Puedes volver a cambiar cuando quieras.` : 'Perderás los beneficios de tu plan actual al terminar el ciclo.', ok:'Cambiar plan', kicker:'Suscripción'});
      if (!ok) return; const prev = u.plan; u.plan = k; const au = X.DB.adminUsers.find(x => x.email === X.me().email); if (au) au.plan = k; save(); X.route();
      toast(`Tu plan ahora es <b>${p.name}</b>`, {undo:() => { u.plan = prev; if (au) au.plan = prev; save(); X.route(); }}); }));
  }
  function secPubs(S, u){
    let flt = 'Todas';
    const F = {'Todas':p => p.status !== 'Retirada', 'Activas':p => p.status === 'Activa', 'En revisión':p => /revisión|Pendiente/.test(p.status), 'Vendidas':p => p.status === 'Vendida', 'Donaciones':p => p.mode === 'donar', 'Retiradas':p => p.status === 'Retirada'};
    S.innerHTML = `<section class="pf-sec"><div class="sec-top"><div><h2>Mis publicaciones</h2><p class="d">Tus prendas en Segunda vida y tus donaciones. Edítalas, márcalas como vendidas o retíralas.</p></div><a class="btn btn-acc" href="#/vender">${ICON.plus} Publicar una prenda</a></div>
      <div class="chips" id="pbF">${Object.keys(F).map((k, i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${k}">${k}</button>`).join('')}</div><div id="pbL"></div></section>`;
    const stCls = s => s === 'Activa' ? 'ok' : s === 'Vendida' ? 'sold' : s === 'Retirada' ? 'off' : 'wait';
    const draw = () => {
      const list = u.pubs.filter(F[flt]);
      $('#pbL', S).innerHTML = list.length ? `<ul class="rows">${list.map(p => {
          const don = p.mode === 'donar' ? X.DB.donations.find(d => d.pub === p.id) : null;
          const st = don ? {pendiente:'Pendiente de la fundación', aceptada:'Aceptada por la fundación', rechazada:'Rechazada por la fundación', recogida:'Recogida programada', recibida:'Entregada'}[don.status] : p.status;
          return `<li class="row-card">
          <div class="rc-img">${p.img || p.thumb ? `<img src="${p.img || A.thumbs[p.thumb]}" alt="">` : ICON.box}</div>
          <div class="rc-main"><b>${esc(p.title)}</b><span class="lbl">${p.mode === 'donar' ? 'Donación · ' + esc((FOUNDS[p.fid] || {}).short || '') : money(p.price)} · Talla ${esc(p.talla)} · ${esc(p.cond)} · ${p.date}</span>
            ${don && don.status === 'rechazada' && don.reason ? `<span class="rc-note">${ICON.alert} ${esc(don.reason)}</span>` : ''}${don && don.pickup ? `<span class="rc-note">${ICON.clock} Recogida ${don.pickup.date} · ${don.pickup.slot}</span>` : ''}
            <span class="st st-${stCls(don ? (don.status === 'rechazada' ? 'Retirada' : 'x') : p.status)}">${esc(st)}</span>${p.mode === 'vender' && p.status === 'Activa' ? `<span class="lbl rc-stats">${p.views} vistas · ${p.chats} chats</span>` : ''}</div>
          <div class="rc-acts">${p.status === 'Retirada' ? `<button class="btn btn-line sm" data-re="${p.id}">Volver a publicar</button>` : `
            <a class="btn btn-line sm" href="#/vender/${p.id}">${ICON.edit} Editar</a>
            ${p.mode === 'vender' && p.status === 'Activa' ? `<button class="btn btn-line sm" data-sold="${p.id}">${ICON.check} Marcar vendida</button>` : ''}
            ${p.status !== 'Vendida' ? `<button class="btn btn-line sm danger" data-wd="${p.id}">${ICON.trash} Retirar</button>` : ''}`}</div></li>`; }).join('')}</ul>`
        : emptyState({icon:'bag', title:flt === 'Todas' ? 'Aún no has publicado nada' : `No tienes publicaciones en «${flt}»`, text:flt === 'Todas' ? 'La ropa que ya no usas puede estar en la playlist de alguien más. Véndela o dónala a una fundación.' : 'Cambia de filtro para ver las demás.', actions:flt === 'Todas' ? [{label:'Publicar una prenda', href:'#/vender', kind:'btn-acc'}] : [{label:'Ver todas', attr:'data-allpub'}]});
    };
    draw();
    chipsPick($('#pbF', S), false, b => { flt = b.dataset.f; draw(); });
    S.onclick = async e => {
      if (e.target.closest('[data-allpub]')){ flt = 'Todas'; $$('#pbF .chip', S).forEach((c, i) => c.setAttribute('aria-pressed', i === 0)); draw(); }
      const so = e.target.closest('[data-sold]'); if (so){ const p = u.pubs.find(x => x.id === so.dataset.sold);
        if (await confirmDlg({title:'¿Marcar como vendida?', text:`«${esc(p.title)}» dejará de recibir mensajes nuevos y aparecerá como no disponible.`, ok:'Marcar vendida'})){ p.status = 'Vendida'; save(); X.rebuild(); draw(); toast('Marcada como vendida', {undo:() => { p.status = 'Activa'; save(); X.rebuild(); draw(); }}); } }
      const wd = e.target.closest('[data-wd]'); if (wd){ const p = u.pubs.find(x => x.id === wd.dataset.wd);
        if (await confirmDlg({title:'¿Retirar esta publicación?', text:`«${esc(p.title)}» dejará de verse en Segunda vida${p.mode === 'donar' ? ' y se cancelará la solicitud a la fundación' : ''}. Podrás volver a publicarla.`, ok:'Retirar', danger:true})){
          const prev = p.status; p.status = 'Retirada'; const don = X.DB.donations.find(d => d.pub === p.id); const dprev = don && don.status; if (don) don.status = 'rechazada', don.reason = 'La persona retiró la donación.';
          save(); X.rebuild(); draw(); toast('Publicación retirada', {undo:() => { p.status = prev; if (don){ don.status = dprev; delete don.reason; } save(); X.rebuild(); draw(); }}); } }
      const re = e.target.closest('[data-re]'); if (re){ const p = u.pubs.find(x => x.id === re.dataset.re); p.status = p.mode === 'donar' ? 'Pendiente de la fundación' : 'En revisión'; save(); X.rebuild(); draw(); toast('Enviada otra vez a revisión'); }
    };
  }
  function secPls(S, u){
    const created = myPls(); const saved = u.saved.map(id => Object.assign({id}, X.DB.pl[id])).filter(p => p.name);
    const card = (p, own) => `<a class="plc" href="#/playlist/${/^p\d$/.test(p.id) ? p.id.slice(1) : p.id}"><div class="cv">${plCover(p) ? `<img src="${plCover(p)}" alt="">` : `<span>${ICON.list}</span>`}</div><b>${esc(p.name)}</b><span class="lbl">${p.ids.length}/${MAXPL} prendas · ${own ? (p.vis === 'Privada' ? 'Privada' : 'Pública') : esc(p.owner.name)}</span></a>`;
    S.innerHTML = `<section class="pf-sec"><div class="sec-top"><div><h2>Mis playlists</h2><p class="d">Las que creaste y las que guardaste de otras personas.</p></div><button class="btn btn-acc" id="plNew">${ICON.plus} Nueva playlist</button></div>
      <h3 class="sub-h sm">Creadas por ti · ${created.length}</h3>
      ${created.length ? `<div class="plc-grid">${created.map(p => card(p, true)).join('')}<button class="plc plc-new" id="plNew2"><div class="cv"><span>${ICON.plus}</span></div><b>Nueva playlist</b><span class="lbl">Hasta ${MAXPL} prendas</span></button></div>`
        : emptyState({icon:'list', title:'Aún no has creado playlists', text:'Junta prendas de distintas tiendas en una colección con nombre, descripción y visibilidad.', actions:[{label:'Crear mi primera playlist', attr:'data-newpl', kind:'btn-acc'}]})}
      <h3 class="sub-h sm">Guardadas · ${saved.length}</h3>
      ${saved.length ? `<div class="plc-grid">${saved.map(p => card(p, false)).join('')}</div>` : emptyState({icon:'heart', title:'No has guardado playlists', text:'Toca «Guardar en mi perfil» en cualquier playlist para tenerla aquí.', small:true, actions:[{label:'Ver las más populares', href:'#colecciones'}]})}
      <h3 class="sub-h sm">Looks del probador · ${u.looks.length}</h3>
      ${u.looks.length ? `<ul class="rows">${u.looks.map(l => `<li class="row-card"><div class="rc-main"><b>Look de ${l.items.length} prendas</b><span class="lbl">${l.items.map(i => (X.CZI[i] || {}).name).filter(Boolean).join(' · ')}</span></div><div class="rc-acts"><span class="lbl">${l.date}</span></div></li>`).join('')}</ul>`
        : emptyState({icon:'user', title:'Sin looks guardados', text:'Arma un look en el probador y toca «Guardar look».', small:true, actions:[{label:'Ir al probador', href:'#/probador'}]})}</section>`;
    S.onclick = e => { if (e.target.closest('#plNew,#plNew2,[data-newpl]')) createPl(null); };
  }
  function secAlerts(S, u){
    const fdesc = s => X.searchDesc(s);
    const qs = s => X.searchQS(s);
    const draw = () => {
      const items = u.alerts.filter(a => X.P[a.pid]);
      S.innerHTML = `<section class="pf-sec"><h2>Búsquedas y alertas</h2><p class="d">Guarda búsquedas desde el catálogo y activa avisos. Te notificamos cuando una tienda tenga disponible lo que esperas.</p>
        <h3 class="sub-h sm">Búsquedas guardadas · ${u.searches.length}</h3>
        ${u.searches.length ? `<ul class="rows">${u.searches.map(s => `<li class="row-card"><div class="rc-ic">${ICON.search}</div><div class="rc-main"><b>${esc(s.name)}</b><span class="lbl">${fdesc(s) || 'Todas las prendas'} · guardada ${s.date}</span></div>
            <div class="rc-acts"><a class="btn btn-line sm" href="#/catalogo?${qs(s)}">Ver resultados</a><label class="tg-mini"><span class="lbl">Alerta</span><button class="switch" role="switch" aria-checked="${s.alert}" data-sa="${s.id}" aria-label="Alerta para ${esc(s.name)}"></button></label>
            <button class="qx" data-sdel="${s.id}" aria-label="Eliminar búsqueda ${esc(s.name)}">${ICON.trash}</button></div></li>`).join('')}</ul>`
          : emptyState({icon:'search', title:'No tienes búsquedas guardadas', text:'En el catálogo, busca algo y toca «Guardar búsqueda». Así no tienes que volver a escribirla.', actions:[{label:'Ir al catálogo', href:'#/catalogo', kind:'btn-acc'}]})}
        <h3 class="sub-h sm">Avisos de disponibilidad · ${items.length}</h3>
        ${items.length ? `<ul class="rows">${items.map(al => { const p = X.P[al.pid]; return `<li class="row-card"><div class="rc-img">${thumbOf(p)}</div><div class="rc-main"><b>${esc(p.name)}</b><span class="lbl">${storeName(p.store)} · ${avail(p) ? '<span class="ok">¡Ya está disponible!</span>' : 'Agotado · te avisaremos'}</span></div>
            <div class="rc-acts"><button class="btn btn-line sm" data-open="${p.id}">Ver prenda</button><label class="tg-mini"><span class="lbl">Aviso</span><button class="switch" role="switch" aria-checked="${al.on}" data-aa="${al.id}" aria-label="Aviso para ${esc(p.name)}"></button></label><button class="qx" data-adel="${al.id}" aria-label="Eliminar aviso">${ICON.trash}</button></div></li>`; }).join('')}</ul>`
          : emptyState({icon:'bell', title:'Sin avisos activos', text:'Cuando una prenda esté agotada, toca «Avisarme» y la seguiremos por ti.', small:true})}
        <h3 class="sub-h sm">Notificaciones recientes</h3>
        ${u.notifs.length ? `<ul class="rows">${u.notifs.slice(0, 6).map(n => `<li class="row-card${n.read ? '' : ' unread'}"><div class="rc-ic">${ICON[n.icon] || ICON.bell}</div><div class="rc-main"><b>${esc(n.t)}</b><span class="lbl">${esc(n.d)} · ${n.at}</span></div><div class="rc-acts">${n.href ? `<a class="btn btn-line sm" href="${n.href}">Ver</a>` : ''}</div></li>`).join('')}</ul>` : emptyState({icon:'bell', title:'Sin notificaciones', small:true})}
      </section>`;
    };
    draw();
    S.onclick = e => {
      const sa = e.target.closest('[data-sa]'); if (sa){ const s = u.searches.find(x => x.id === sa.dataset.sa); s.alert = !s.alert; save(); sa.setAttribute('aria-checked', s.alert); toast(s.alert ? 'Alerta activada' : 'Alerta desactivada'); }
      const aa = e.target.closest('[data-aa]'); if (aa){ const a = u.alerts.find(x => x.id === aa.dataset.aa); a.on = !a.on; save(); aa.setAttribute('aria-checked', a.on); toast(a.on ? 'Aviso activado' : 'Aviso pausado'); }
      const sd = e.target.closest('[data-sdel]'); if (sd){ const i = u.searches.findIndex(x => x.id === sd.dataset.sdel); const s = u.searches.splice(i, 1)[0]; save(); draw(); toast('Búsqueda eliminada', {undo:() => { u.searches.splice(i, 0, s); save(); draw(); }}); }
      const ad = e.target.closest('[data-adel]'); if (ad){ const i = u.alerts.findIndex(x => x.id === ad.dataset.adel); const a = u.alerts.splice(i, 1)[0]; save(); draw(); toast('Aviso eliminado', {undo:() => { u.alerts.splice(i, 0, a); save(); draw(); }}); }
    };
  }
  function secWish(S, u){
    let flt = 'Todo';
    S.innerHTML = `<section class="pf-sec"><h2>Wishlist</h2><p class="d">Las prendas que guardas desde cualquier tienda, playlist o el catálogo.</p>
      <div class="toolbar"><div class="chips" id="wlF">${['Todo','Ropa','Calzado','Accesorios'].map((c, i) => `<button class="chip" aria-pressed="${i === 0}" data-f="${c}">${c}</button>`).join('')}</div><span class="count lbl" id="wlCount"></span></div><div id="wlGrid"></div></section>`;
    const draw = () => {
      const items = u.wish.map(id => X.P[id]).filter(p => p && (flt === 'Todo' || p.kind === flt));
      $('#wlGrid', S).innerHTML = items.length ? `<div class="p-grid wl-grid">${items.map(p => pCard(p)).join('')}</div>`
        : emptyState({icon:'heart', title:u.wish.length ? `Nada en «${flt}»` : 'Tu wishlist está vacía', text:u.wish.length ? 'Cambia de filtro para ver el resto.' : 'Toca el corazón en cualquier prenda para guardarla aquí.', actions:u.wish.length ? [] : [{label:'Explorar el catálogo', href:'#/catalogo', kind:'btn-acc'}]});
      $('#wlCount', S).textContent = `${items.length} ${items.length === 1 ? 'prenda' : 'prendas'} · ${money(items.filter(avail).reduce((s, p) => s + p.price, 0))}`;
    };
    draw();
    chipsPick($('#wlF', S), false, b => { flt = b.dataset.f; draw(); });
    S.addEventListener('click', e => { if (e.target.closest('.heart')) setTimeout(draw, 0); });
  }
  view('perfil', {fn:vPerfil, roles:['user'], acc:'#48119A', title:'Mi cuenta'});

  /* ============ ganchos en la página de inicio ============ */
  function landing(){
    const C = window.SR_COLLS || [];
    C.forEach(c => { const pl = c.pid && DB().pl['p' + c.pid]; if (!pl) return; const items = pl.ids.map(i => P[i]).filter(Boolean);
      c.items = items.length; c.price = money(items.filter(avail).reduce((a, p) => a + p.price, 0)); c.cur = pl.owner.name; });
    const d = document.getElementById('dItems'), pr = document.getElementById('dPrice'), cu = document.getElementById('dCur');
    if (C[0] && d){ d.textContent = C[0].items; pr.textContent = C[0].price; cu.textContent = C[0].cur; }
    // sección de marca
    const ps = $('#piStores'), pi = $('#piItems'), pf = $('#piFounds');
    if (ps){ ps.textContent = Object.values(STORES).filter(s => !s.hidden && s.verif === 'Verificada').length;
      pi.textContent = Object.values(P).filter(p => visible(p) && avail(p)).length;
      pf.textContent = Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa').length; }
    const pj = $('#piJoin'); if (pj && !pj._on){ pj._on = 1; pj.addEventListener('click', () => X.openSignup()); }
    // fundaciones
    const fg = $('#foundGrid');
    if (fg) fg.innerHTML = Object.values(FOUNDS).filter(f => !f.hidden && f.state === 'Activa').slice(0, 4).map((f, i) => `
      <a class="fcard-f" href="#/fundacion/${f.id}" style="--fc:${f.color}" data-cursor="Conocer">
        <div class="ff-top"><span class="lbl">${String(i + 1).padStart(2, '0')}</span><span class="lbl">${esc(f.barrio)}</span></div>
        <div class="ff-mono">${ini(f.short)}</div>
        <div class="ff-bot"><b>${esc(f.name)}</b><span class="lbl">Recibe · ${esc(f.accepts.slice(0, 2).join(', ').toLowerCase())}</span></div>
      </a>`).join('');
  }
  document.addEventListener('click', e => {
    if (X.role() && X.role() !== 'user') return;
    const cg = e.target.closest('#catsGo');
    if (cg){ e.preventDefault();
      const nm = norm(($('#catName') || {}).textContent || ''); const k = ['formal','casual','urbana'].find(x => nm.includes(x));
      const f = ($('#catsFilters [aria-pressed="true"]') || {}).dataset?.key || 'all';
      go('#/categoria/' + (k || (f !== 'all' ? f : 'formal'))); }
  });
  X.landing = landing;
})();
