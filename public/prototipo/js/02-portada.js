(() => {
  /* el color de la página cambia de sección en sección */
  const root = document.documentElement;
  const zones = [...document.querySelectorAll('section[data-acc], footer[data-acc]')];
  const paint = () => {
    if (document.body.dataset.view || document.body.dataset.gate) return;
    const mid = innerHeight * .45;
    let acc = zones[0].dataset.acc;
    for (const z of zones){ const r = z.getBoundingClientRect(); if (r.top <= mid) acc = z.dataset.acc; }
    if (root.style.getPropertyValue('--acc') !== acc) root.style.setProperty('--acc', acc);
  };
  addEventListener('scroll', paint, {passive:true}); addEventListener('resize', paint); paint();

  /* la portada rota entre tres fotos y le pasa su color a la sección */
  const hero = document.getElementById('inicio');
  const slides = [...document.querySelectorAll('.slide')];
  const capIdx = document.getElementById('slideIdx'), capName = document.getElementById('slideName');
  let cur = 0;
  const show = i => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((sl, k) => sl.classList.toggle('is-on', k === cur));
    hero.dataset.acc = slides[cur].dataset.acc;
    hero.dataset.ink = slides[cur].dataset.ink || 'light';
    hero.dataset.title = slides[cur].dataset.title || 'light';
    capIdx.textContent = String(cur + 1).padStart(2, '0');
    capName.textContent = slides[cur].dataset.cap;
    paint();
  };
  if (slides.length) {
    show(0);
    setInterval(() => { if (!document.hidden) show(cur + 1); }, 5200);
  }

  document.querySelectorAll('.nav,.hero-foot,.coll-foot,.cats-read,.cats-meta,.tryon-cap,.cursor,.bar i,.scan').forEach(el => el.classList.add('acc-t'));
})();
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r=document) => r.querySelector(s);
  const clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- PHOTOS ----------
     Put real photos here as data URIs keyed "kind-seed" (e.g. "figure-11").
     Any key missing falls back to a generated monochrome placeholder. */
  const FIT_IMG = {"abrigo": "assets/img/portada/portada.png", "camisa": "assets/img/portada/portada-2.png", "bufanda": "assets/img/portada/portada-3.png", "saco": "assets/img/portada/portada-4.png", "pantalon": "assets/img/portada/portada-5.png", "guantes": "assets/img/portada/portada-6.png", "maletin": "assets/img/portada/portada-7.png", "zapatos": "assets/img/portada/portada-8.png"};

  const PHOTOS = {
    "store-2": "assets/img/portada/portada.jpg",
    "store-9": "assets/img/portada/portada-2.jpg",
    "store-5": "assets/img/portada/portada-3.jpg",
    "store-12": "assets/img/portada/portada-4.jpg",
    "figure-3": "assets/img/portada/portada-5.jpg",
    "fabric-8": "assets/img/portada/portada-6.jpg",
    "figure-14": "assets/img/portada/portada-7.jpg",
    "chrome-6": "assets/img/portada/portada-8.jpg",
    "fabric-21": "assets/img/portada/portada-9.jpg",
    "figure-33": "assets/img/portada/portada-10.jpg",
    "chrome-12": "assets/img/portada/portada-11.jpg",
    "figure-41": "assets/img/portada/portada-12.jpg"
  };

  window.SR = Object.assign(window.SR||{}, {PHOTOS, FIT_IMG, FIT_DRESSED: 'assets/img/paginas/imagen.webp'});
  /* ---------- placeholder painter (monochrome, editorial) ---------- */
  function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const cache = {};
  function paint(kind, seed){
    const key = kind+'-'+seed;
    if (PHOTOS[key]) return PHOTOS[key];
    if (cache[key]) return cache[key];
    const W = 720, H = 900, c = document.createElement('canvas'); c.width=W; c.height=H;
    const x = c.getContext('2d'), r = rng(seed*977+13);
    const g = (v)=>`rgb(${v},${v},${v})`;
    if (kind === 'figure'){
      const top = 170 + r()*60|0, bot = 70 + r()*50|0;
      let lg = x.createLinearGradient(0,0,W*0.3,H); lg.addColorStop(0,g(top)); lg.addColorStop(1,g(bot));
      x.fillStyle=lg; x.fillRect(0,0,W,H);
      let rg = x.createRadialGradient(W*(.2+r()*.6),H*.25,10,W*.5,H*.3,W*.9); rg.addColorStop(0,'rgba(255,255,255,.55)'); rg.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=rg; x.fillRect(0,0,W,H);
      const cx = W*(.36+r()*.28), dir = r()>.5?1:-1, hy = H*(.26+r()*.08), s = .9+r()*.25;
      const body = (dx, a, blur) => {
        x.save(); x.filter=`blur(${blur}px)`; x.globalAlpha=a; x.fillStyle='#262626';
        x.beginPath(); x.ellipse(cx+dx, hy, 62*s, 80*s, 0, 0, 7); x.fill();
        x.beginPath(); x.ellipse(cx+dx-dir*18, hy-26*s, 92*s, 84*s, .3*dir, 0, 7); x.fill();
        x.fillRect(cx+dx-26*s, hy+50*s, 52*s, 70*s);
        x.beginPath(); x.moveTo(cx+dx-50*s, hy+105*s);
        x.bezierCurveTo(cx+dx-190*s, hy+130*s, cx+dx-250*s, hy+190*s, cx+dx-280*s, H+40);
        x.lineTo(cx+dx+280*s, H+40);
        x.bezierCurveTo(cx+dx+250*s, hy+190*s, cx+dx+190*s, hy+130*s, cx+dx+50*s, hy+105*s);
        x.closePath(); x.fill(); x.restore();
      };
      for (let k=6;k>=1;k--) body(dir*k*W*.055, .10, 18+k*3);
      body(0, .93, 2.5+r()*4);
      x.save(); x.filter='blur(10px)'; x.globalAlpha=.35; x.fillStyle='#FFFFFF';
      x.beginPath(); x.ellipse(cx-dir*22, hy+8, 18, 42, 0, 0, 7); x.fill(); x.restore();
    }
    if (kind === 'chrome'){
      const base = 20 + r()*30|0;
      let rg = x.createRadialGradient(W*.5,H*.45,20,W*.5,H*.5,W*.95); rg.addColorStop(0,g(base+60)); rg.addColorStop(1,g(base-10));
      x.fillStyle=rg; x.fillRect(0,0,W,H);
      const bands = (lg)=>{const st=[['#262626',0],['#FFFFFF',.18],['#B9B9CA',.33],['#FFFFFF',.48],['rgba(185,185,202,.16)',.6],['#B9B9CA',.78],['#262626',1]];st.forEach(([c,o])=>lg.addColorStop(o,c));return lg};
      x.save(); x.shadowColor='rgba(38,38,38,.6)'; x.shadowBlur=60; x.shadowOffsetY=30;
      if (r() > .5){
        x.translate(W*.5, H*.5); x.rotate(-.75 + r()*.5);
        const L = H*.55, B = W*.2;
        x.beginPath(); x.moveTo(-L,0);
        x.bezierCurveTo(-L*.4,-B*1.4, L*.5,-B*1.2, L,-B*.1);
        x.bezierCurveTo(L*.4,B*.9, -L*.4,B*1.1, -L,0); x.closePath();
        x.fillStyle=bands(x.createLinearGradient(0,-B,0,B)); x.fill();
        x.shadowColor='transparent'; x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=1.2;
        for(let i=-10;i<=10;i++){x.beginPath();x.moveTo(i*L*.08,-2);x.quadraticCurveTo(i*L*.08+L*.05,-B*.55,i*L*.08+L*.12,-B*.9);x.stroke();}
        x.beginPath(); x.moveTo(-L*1.15,6); x.lineTo(L*.95,-6); x.strokeStyle='rgba(255,255,255,.7)'; x.lineWidth=2.5; x.stroke();
      } else {
        const R = W*.3, cx = W*.5, cy = H*.56;
        const lg = bands(x.createLinearGradient(cx-R, cy-R, cx+R, cy+R));
        x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fillStyle=lg; x.fill();
        x.shadowColor='transparent';
        const vis = x.createLinearGradient(0,cy-R*.4,0,cy+R*.1); vis.addColorStop(0,'rgba(38,38,38,.85)'); vis.addColorStop(1,'rgba(38,38,38,.6)');
        x.beginPath(); x.ellipse(cx-R*.15, cy-R*.15, R*.72, R*.42, -.1, 0, 7); x.fillStyle=vis; x.fill();
        x.filter='blur(6px)'; x.fillStyle='rgba(255,255,255,.8)';
        x.beginPath(); x.ellipse(cx-R*.45, cy-R*.35, R*.18, R*.06, -.5, 0, 7); x.fill();
        x.filter='none'; x.fillStyle='#262626'; x.fillRect(cx-R*.5, 0, R*1.1, cy-R*.85);
      }
      x.restore();
    }
    if (kind === 'fabric'){
      x.fillStyle=g(60+r()*40|0); x.fillRect(0,0,W,H);
      const n = 10 + (r()*6|0), ph = r()*6, fq = .004 + r()*.004;
      x.filter='blur(9px)';
      for (let i=-1;i<=n;i++){
        const x0 = i*W/n, wv = W/n;
        const lg = x.createLinearGradient(x0,0,x0+wv,0);
        lg.addColorStop(0,'rgba(38,38,38,.55)'); lg.addColorStop(.45,`rgba(255,255,255,${.25+r()*.4})`); lg.addColorStop(1,'rgba(38,38,38,.5)');
        x.fillStyle=lg; x.beginPath(); x.moveTo(x0, 0);
        for (let y=0;y<=H;y+=30) x.lineTo(x0 + Math.sin(y*fq+ph+i)*28, y);
        for (let y=H;y>=0;y-=30) x.lineTo(x0 + wv + Math.sin(y*fq+ph+i+.6)*28, y);
        x.fill();
      }
      x.filter='none';
    }
    if (kind === 'store'){
      const wall = 150 + r()*60|0;
      let lg = x.createLinearGradient(0,0,0,H); lg.addColorStop(0,g(wall)); lg.addColorStop(.68,g(wall-40)); lg.addColorStop(.7,g(45)); lg.addColorStop(1,g(25));
      x.fillStyle=lg; x.fillRect(0,0,W,H);
      x.save(); x.filter='blur(30px)'; x.fillStyle='rgba(255,255,255,.6)'; x.fillRect(W*(.1+r()*.5), H*.08, W*.3, H*.4); x.restore();
      const rows = r()>.5 ? [H*.2] : [H*.18, H*.46];
      rows.forEach((ry, k) => {
        x.fillStyle='#262626'; x.fillRect(W*.05, ry, W*.9, 5);
        let px = W*.08;
        while (px < W*.9){
          const w = 38 + r()*44, h = (k? 170 : 300) * (.65+r()*.45), v = 20 + r()*200|0;
          x.save(); x.filter='blur(1.5px)'; x.fillStyle=g(v);
          x.beginPath(); x.moveTo(px+w*.5, ry+2); x.lineTo(px+w, ry+26); x.lineTo(px+w*1.05, ry+h); x.lineTo(px-w*.05, ry+h); x.lineTo(px, ry+26); x.closePath(); x.fill();
          x.restore(); px += w*.72;
        }
      });
      x.fillStyle='rgba(38,38,38,.35)'; x.fillRect(W*.62, H*.58, W*.3, H*.12);
    }
    const vg = x.createRadialGradient(W/2,H/2,W*.35,W/2,H/2,W*.9); vg.addColorStop(0,'rgba(38,38,38,0)'); vg.addColorStop(1,'rgba(38,38,38,.35)');
    x.filter='none'; x.fillStyle=vg; x.fillRect(0,0,W,H);
    return (cache[key] = c.toDataURL('image/jpeg', .82));
  }
  const fill = (img) => { img.src = paint(img.dataset.ph, +img.dataset.seed); };

  /* grain */
  (() => {
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const x = c.getContext('2d'), d = x.createImageData(180,180);
    for (let i=0;i<d.data.length;i+=4){const v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}
    x.putImageData(d,0,0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------- data ---------- */
  const COLLS = window.SR_COLLS = [
    {name:'Oficina con Estilo', cur:'Camila S.', items:7, price:'$1.715.000', ph:'figure', seed:14, pid:3},
    {name:'Días en la Ciudad', cur:'Valentina R.', items:9, price:'$1.408.000', ph:'figure', seed:3, pid:1},
    {name:'Vibra Indie Rock', cur:'Mateo P.', items:7, price:'$1.656.000', ph:'fabric', seed:8, pid:2},
    {name:'Salida Nocturna', cur:'Sofía L.', items:9, price:'$890.000', ph:'chrome', seed:6, pid:4},
    {name:'Tonos Neutros', cur:'Laura T.', items:10, price:'$760.000', ph:'fabric', seed:21, pid:5},
    {name:'Street Style Bogotá', cur:'Andrés M.', items:11, price:'$820.000', ph:'figure', seed:33, pid:6},
    {name:'Segunda Vida', cur:'Comunidad', items:8, price:'$210.000', ph:'chrome', seed:12, pid:7},
    {name:'Fin de Semana', cur:'Andrés M.', items:8, price:'$480.000', ph:'figure', seed:41, pid:8},
  ];
  const STORES = [
    [{id:'luna', n:'Luna Store', b:'Chapinero', d:'1,2 km', tag:'Sport', ar:'ar-32', ph:'store', seed:2},
     {id:'kicks', n:'Kicks Local', b:'Chicó', d:'4,0 km', tag:'Confort', ar:'ar-43', ph:'store', seed:9}],
    [{id:'nomada', n:'Nómada Studio', b:'Usaquén', d:'3,4 km', tag:'Leather', ar:'ar-32', ph:'store', seed:5},
     {id:'lab', n:'The Local Lab', b:'Zona G', d:'0,8 km', tag:'Urbana', ar:'ar-43', ph:'store', seed:12}],
  ];

  /* ---------- build ---------- */
  document.querySelectorAll('img[data-ph]').forEach(fill);

  const split = (el) => { const t = el.textContent; el.textContent=''; return [...t].map(ch => { const s=document.createElement('span'); s.textContent=ch; s.setAttribute('aria-hidden','true'); el.appendChild(s); return s; }); };
  const heroTitle = $('#heroTitle');
  if (heroTitle) heroTitle.setAttribute('aria-label', 'Tu estilo, tu ciudad');
  const heroLetters = [];
  const wordLetters = split($('#wordmark'));

  const man = $('[data-reveal]');
  const words = [];
  (function wrap(node){
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s=document.createElement('span'); s.className='w'; s.textContent=p; words.push(s); frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else wrap(n);
    });
  })(man);

  const grid = $('#storeGrid');
  const storeCols = STORES.map(col => {
    const d = document.createElement('div'); d.className='store-col';
    col.forEach(s => {
      d.insertAdjacentHTML('beforeend', `<a class="store" href="#/tienda/${s.id}" data-cursor="Ver tienda"><div class="store-img ${s.ar}"><img alt="Interior de ${s.n}" data-ph="${s.ph}" data-seed="${s.seed}">${s.tag?`<span class="tag lbl pill">${s.tag}</span>`:''}</div><div class="store-row"><span class="n">${s.n}</span><span class="d lbl">${s.b} — ${s.d}</span></div></a>`);
    });
    d.querySelectorAll('img').forEach(fill);
    grid.appendChild(d); return d;
  });

  const star = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 0l1.8 8.2L20 10l-8.2 1.8L10 20l-1.8-8.2L0 10l8.2-1.8z"/></svg>';
  const mqText = ['Vender','Donar','Volver a usar','Intercambiar'];
  const mqHTML = (arr) => arr.map(t => `<span>${t} ${star}</span>`).join('');
  const mq1 = $('#mq1'), mq2 = $('#mq2');
  mq1.innerHTML = `<div style="display:inline-block">${mqHTML(mqText)}${mqHTML(mqText)}</div><div style="display:inline-block">${mqHTML(mqText)}${mqHTML(mqText)}</div>`;
  mq2.innerHTML = `<div style="display:inline-block">${mqHTML(['Segunda vida','Moda circular','Fundaciones aliadas'])}${mqHTML(['Segunda vida','Moda circular','Fundaciones aliadas'])}</div><div style="display:inline-block">${mqHTML(['Segunda vida','Moda circular','Fundaciones aliadas'])}${mqHTML(['Segunda vida','Moda circular','Fundaciones aliadas'])}</div>`;

  /* ---------- nav ---------- */
  const sheet = $('#sheet'), menuBtn = $('#menuBtn');
  const setMenu = (open) => { sheet.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); };
  menuBtn.addEventListener('click', () => setMenu(true));
  $('#menuClose').addEventListener('click', () => setMenu(false));
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  $('#toTop').addEventListener('click', () => scrollTo({top:0, behavior: reduce?'auto':'smooth'}));

  /* ---------- cursor ---------- */
  const cur = $('#cursor'), curLbl = $('#cursorLabel');
  let mx = innerWidth/2, my = innerHeight/2, cxp = mx, cyp = my;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor]');
    if (t){ curLbl.textContent = t.dataset.cursor; cur.classList.add('big'); } else cur.classList.remove('big');
  });

  /* ---------- scroll engine: native scroll, eased values ---------- */
  const S = {}; const ease = reduce ? 1 : .1;
  const sm = (k, target) => { S[k] = S[k] === undefined ? target : lerp(S[k], target, ease); if (Math.abs(S[k]-target) < .0004) S[k] = target; return S[k]; };
  const pinned = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  const through = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); };

  const hero = $('#inicio'), heroMedia = $('#heroMedia'), radar = $('#radar');
  const heroImgs = [...document.querySelectorAll('.hero-media img')];
  const heroWords = [...document.querySelectorAll('#heroWords .lbl')];
  const band = $('#band'), bandImg = band ? band.querySelector('img') : null;
  const stores = $('#tiendas'), second = $('#segunda-vida'), object = $('#object'), foot = $('.foot');

  function frame(){
    const vw = innerWidth, vh = innerHeight;

    /* HERO: solo cuando la portada es más alta que la pantalla */
    if (hero && hero.offsetHeight > vh + 40){
      const hp = sm('hero', pinned(hero));
      const ix = hp*13, iy = hp*9;
      heroMedia.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${hp*18}px)`;
      const ht = `scale(${1.22 - hp*.22}) translateY(${hp*-3}%)`;
      heroImgs.forEach(im => { im.style.transform = ht; });
      heroWords.forEach(w => { w.style.transform = `translateY(${-hp*vh*(+w.dataset.speed)}px)`; });
    }
    if (radar) radar.style.transform = `rotate(${scrollY*.25}deg)`;

    /* manifesto: words light up as you read down */
    const mr = man.getBoundingClientRect();
    const mp = clamp((vh*.88 - mr.top) / (mr.height + vh*.45));
    const mps = sm('man', mp);
    words.forEach((w, i) => { w.style.opacity = .16 + .84*clamp(mps*words.length*1.15 - i); });

    /* band parallax */
    const bp = bandImg ? sm('band', through(band)) : 0;
    if (bandImg) bandImg.style.transform = `translateY(${(bp-.5)*-16}%) scale(${1.08 - bp*.06})`;

    /* stores: columns at different speeds */
    const sp = sm('stores', through(stores)) - .5;
    const speeds = vw < 860 ? [40, -60, 0] : [70, -110, 30];
    storeCols.forEach((c, i) => { c.style.transform = `translateY(${sp*speeds[i]}px)`; });

    /* second life: marquees ride the scroll, object floats */
    const sdp = sm('second', through(second));
    const w1 = mq1.firstElementChild.offsetWidth || 1;
    mq1.style.transform = `translateX(${-((sdp*w1*.9) % w1)}px)`;
    const w2 = mq2.firstElementChild.offsetWidth || 1;
    mq2.style.transform = `translateX(${-w2 + ((sdp*w2*.9) % w2)}px)`;
    object.querySelector('img').style.transform = `translateY(${(sdp-.5)*-40}px) rotate(${(sdp-.5)*-6}deg)`;

    /* footer wordmark rises */
    const fr = foot.getBoundingClientRect();
    const fp = sm('foot', clamp((vh - fr.top) / Math.min(fr.height, vh)));
    wordLetters.forEach((s, i) => { s.style.transform = `translateY(${(1-clamp(fp*1.3 - i*.03))*105}%)`; });

    /* cursor */
    cxp = lerp(cxp, mx, .22); cyp = lerp(cyp, my, .22);
    cur.style.transform = `translate(${cxp}px, ${cyp}px)`;

    requestAnimationFrame(frame);
  }
  const start = () => requestAnimationFrame(frame);
  if (document.readyState === 'complete') start(); else addEventListener('load', start, {once:true});
})();
