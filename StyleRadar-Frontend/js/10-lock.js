/* =====================================================================
   StyleRadar · probador bloqueado para invitados: botón de radar
   Las ondas salen desde donde está el cursor y un barrido gira como un radar.
   ===================================================================== */
(() => {
  const X = window.SRX; const {A, $, reduce} = X;
  const frame = $('#fitLock'), cv = $('#flCanvas'), lock = frame;
  if (!frame || !cv) return;
  const KEYS = ['lk1', 'lk2', 'lk3'];
  const imgs = KEYS.map(k => { const im = new Image(); im.src = (A.img || {})[k] || ''; return im; });
  const SLIDE = 2600;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
    uniform sampler2D tex;uniform vec2 res;uniform vec2 ires;uniform float t;uniform vec2 c;uniform float amp;uniform float hov;uniform vec3 acc;
    void main(){
      vec2 uv=gl_FragCoord.xy/res; uv.y=1.-uv.y;
      float asp=res.x/res.y;
      vec2 p=(uv-c)*vec2(asp,1.);
      float r=length(p);
      float P=.085;
      float ph=r/P - t*(.55+.45*hov);
      float f=fract(ph);
      float fall=smoothstep(.015,.12,r)*(1.-smoothstep(.45,1.3,r));
      float k=1.-amp*fall*(f-.35);
      vec2 q=(uv-c)*k+c;
      float ia=ires.x/ires.y; vec2 s=vec2(1.);
      if(asp>ia) s.y=ia/asp; else s.x=asp/ia;
      vec2 u=(q-.5)*s/1.06+.5;
      vec3 col=texture2D(tex,clamp(u,0.,1.)).rgb;
      float edge=smoothstep(.86,1.,f)*fall; float inner=smoothstep(0.,.12,f)*(1.-smoothstep(.12,.3,f))*fall;
      col+=edge*.12; col-=inner*.06;
      /* barrido de radar */
      float a=atan(p.y,p.x);
      float sw=fract(a/6.28318+t*.22);
      float beam=pow(sw,14.)*.55+pow(sw,60.)*.6;
      col=mix(col,col+acc*.9,beam*(1.-smoothstep(.0,1.6,r))*.5);
      /* anillos finos de la pantalla */
      float grid=1.-smoothstep(0.,.004,abs(fract(r/.16+.5)-.5)*.16);
      col+=grid*.08*(1.-smoothstep(.2,1.4,r));
      float v=smoothstep(1.3,.25,length((uv-.5)*vec2(asp,1.))); col*=mix(.55,1.,v); col*=.86;
      gl_FragColor=vec4(col,1.);
    }`;
  let gl = null, prog, texs = [], U = {}, W = 0, H = 0, raf = 0, t0 = 0, run = false, ready = null, ctx2 = null;
  const cur = {x:.5, y:.5}, tgt = {x:.5, y:.5}; let hov = 0, hovT = 0, lastK = -1;
  function initGL(){
    try { gl = cv.getContext('webgl', {premultipliedAlpha:false, antialias:false}); } catch(e){ gl = null; }
    if (!gl) return false;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); } catch(e){ gl = null; return false; }
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['tex','res','ires','t','c','amp','hov','acc'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    texs = imgs.map(im => { const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); return tx; });
    return true;
  }
  const size = () => { const r = frame.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.max(1, Math.round(W * d)); cv.height = Math.max(1, Math.round(H * d)); if (gl) gl.viewport(0, 0, cv.width, cv.height); };
  const accRGB = () => { const a = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#48119A'; const h = a.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  let acc = [.28, .07, .6];
  function draw(t){
    const k = Math.floor(t / SLIDE) % imgs.length;
    cur.x += (tgt.x - cur.x) * .08; cur.y += (tgt.y - cur.y) * .08; hov += (hovT - hov) * .08;
    if (k !== lastK){ lastK = k; const ix = $('#flIdx'); if (ix) ix.textContent = `0${k + 1} / 03`; }
    frame.style.setProperty('--mx', (cur.x * 100).toFixed(1) + '%'); frame.style.setProperty('--my', (cur.y * 100).toFixed(1) + '%');
    if (gl){
      gl.bindTexture(gl.TEXTURE_2D, texs[k]); gl.uniform1i(U.tex, 0);
      gl.uniform2f(U.res, cv.width, cv.height); gl.uniform2f(U.ires, imgs[k].naturalWidth || 1, imgs[k].naturalHeight || 1);
      gl.uniform1f(U.t, t / 1000); gl.uniform2f(U.c, cur.x, cur.y); gl.uniform1f(U.amp, .05 + .03 * hov + .008 * Math.sin(t / 700)); gl.uniform1f(U.hov, hov); gl.uniform3f(U.acc, acc[0], acc[1], acc[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (ctx2 && imgs[k].naturalWidth){ const im = imgs[k]; const r = Math.max(W / im.naturalWidth, H / im.naturalHeight); ctx2.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); ctx2.drawImage(im, (W - im.naturalWidth * r) / 2, (H - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); }
  }
  function loop(now){ if (X.me()) return stop(); if (!t0) t0 = now; if (Math.abs(frame.clientWidth - W) > 1) size(); draw(now - t0); raf = requestAnimationFrame(loop); }
  function start(){ if (run) return; run = true; acc = accRGB();
    ready = ready || Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : 0)).then(() => { if (!initGL()) ctx2 = cv.getContext('2d'); });
    ready.then(() => { size(); if (reduce){ draw(0); return; } cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }); }
  function stop(){ run = false; cancelAnimationFrame(raf); }
  /* el centro de las ondas sigue al cursor por toda la sección, no solo encima del botón */
  const sec = $('#probador-anim');
  addEventListener('pointermove', e => {
    if (!run) return; const r = frame.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    tgt.x = inside ? x : .5; tgt.y = inside ? y : .5;
    const b = $('#fitGo').getBoundingClientRect(); const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
    hovT = inside ? (d < 160 ? 1 : .45) : 0;
  }, {passive:true});
  frame.addEventListener('pointerleave', () => { hovT = .2; });
  $('#fitGo').addEventListener('click', e => { e.preventDefault(); if (!X.me()) X.needLogin('Inicia sesión para usar el probador virtual'); });
  frame.addEventListener('click', e => { if (e.target.closest('#fitGo')) return; if (!X.me()) X.needLogin('Inicia sesión para usar el probador virtual'); });
  /* solo corre cuando la sección se ve y no hay sesión */
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && !X.me() && !document.body.dataset.view) start(); else stop(); }), {threshold:0});
  io.observe(sec || lock);
  addEventListener('hashchange', () => { if (document.body.dataset.view || X.me()) stop(); });
  addEventListener('resize', () => { if (run) size(); });
  setInterval(() => { if (run || X.me() || document.body.dataset.view || !sec) return; const r = sec.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) start(); }, 800);
})();
