/* =====================================================================
   StyleRadar · fondo de gradiente en movimiento (muy difuminado)
   Se usa detrás de las vistas de cuenta, mensajes, admin, vender, mapa,
   playlists y catálogo. Colores de la marca. Resolución baja + desenfoque CSS.
   ===================================================================== */
(() => {
  const X = window.SRX; const {reduce} = X;
  const GLASS = new Set(['funciones','vendedor','marca','tienda','fundacion','mi-tienda','mi-fundacion','mensajes','perfil','admin','vender','mapa','playlist','catalogo','categoria','cuenta','donaciones','probador']);
  const cv = document.createElement('canvas'); cv.className = 'sr-bg'; cv.setAttribute('aria-hidden', 'true');
  const veil = document.createElement('div'); veil.className = 'sr-bg-veil'; veil.setAttribute('aria-hidden', 'true');
  document.body.prepend(veil); document.body.prepend(cv);
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
    uniform vec2 res;uniform float t;
    uniform vec3 c0;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;
    /* ondas continuas: cintas de seda que fluyen en diagonal */
    float band(float v, float w){ return smoothstep(-w, 0., v) * (1. - smoothstep(0., w, v)); }
    void main(){
      vec2 uv=gl_FragCoord.xy/res; float asp=res.x/res.y; vec2 p=vec2(uv.x*asp,uv.y);
      float T=t*.16;
      vec2 q=p;
      q.y+=.16*sin(q.x*1.7+T*1.1)+.09*sin(q.x*3.1-T*.8);
      q.x+=.10*sin(q.y*2.3-T*.7);
      float w1=sin(q.x*1.6+q.y*3.2+T);                       /* ola principal */
      float w2=sin(q.x*2.4-q.y*2.1-T*.8+1.7);                /* contraola */
      float w3=sin((q.x+q.y)*4.2+T*1.4+sin(q.x*1.3+T)*1.2);   /* brillos finos */
      vec3 col=c0;
      col=mix(col,c1,(.5+.5*w1)*.95);                          /* violeta */
      col=mix(col,c2,smoothstep(.35,1.,w2)*.55);               /* lavanda */
      col=mix(col,c3,smoothstep(.72,1.,w3*w1)*.35);            /* arena */
      col+=band(w1-.55,.35)*.08;
      float vg=smoothstep(1.35,.2,length((uv-vec2(.5,.35))*vec2(asp*.8,1.)));
      col=mix(c0,col,.55+.45*vg);
      gl_FragColor=vec4(col,1.);
    }`;
  let gl = null, U = {}, raf = 0, on = false, last = 0, t0 = performance.now();
  try { gl = cv.getContext('webgl', {antialias:false, premultipliedAlpha:false}); } catch(e){}
  if (gl){
    const sh = (ty, src) => { const o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    ['res','t','c0','c1','c2','c3'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    const rgb = hx => { const n = parseInt(hx.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
    const PAL = window.SR_BG_PAL || ['#1b1528', '#48119A', '#B9B9CA', '#E8DCCB'];
    ['c0','c1','c2','c3'].forEach((k, i) => gl.uniform3fv(U[k], rgb(PAL[i])));
  }
  const size = () => { const s = .4; cv.width = Math.max(32, Math.round(innerWidth * s)); cv.height = Math.max(32, Math.round(innerHeight * s)); if (gl) gl.viewport(0, 0, cv.width, cv.height); };
  size(); addEventListener('resize', size);
  function frame(now){
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return; last = now;
    if (!gl) return; gl.uniform2f(U.res, cv.width, cv.height); gl.uniform1f(U.t, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function sync(){
    const v = document.body.dataset.view; const want = !!v && GLASS.has(v);
    if (want) document.body.dataset.glass = '1'; else delete document.body.dataset.glass;
    if (want && !on && !window.SR_BG_PHOTO){ on = true; if (reduce){ frame(performance.now() + 1e5); cancelAnimationFrame(raf); } else raf = requestAnimationFrame(frame); }
    if (!want && on){ on = false; cancelAnimationFrame(raf); }
  }
  new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['data-view']});
  sync();
})();
