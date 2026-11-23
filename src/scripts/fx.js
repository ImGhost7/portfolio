/* ══════════════════════════════════════════════════════════════════
   fx.js — generated imagery (no photos, no libraries):
     · WebGL smoke  → hero portrait backdrop, COMM.LINK beacon
     · 2D canvases  → FraudScope graph, attention map, signal bars, scope wave
   Everything sleeps when off-screen and draws one still frame under
   reduced motion.
   ══════════════════════════════════════════════════════════════════ */
import { qsa, clamp, lerp, reduced, tick, visible } from './tb.js';

  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* backing store follows CSS size; `dirty` flags a resize so static frames can redraw */
  function makeCanvas(canvas, opts) {
    const o = Object.assign({ scale: 1, dprCap: 2 }, opts);
    const st = { w: 1, h: 1, dpr: 1, dirty: true };
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, o.dprCap) * o.scale;
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      st.w = w; st.h = h; st.dpr = dpr; st.dirty = true;
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(canvas);
    else window.addEventListener('resize', fit);
    return st;
  }

  /* run `draw(seconds)` every frame while visible; one still frame at `still` seconds if motion is off */
  function run(canvas, st, draw, still, fps) {
    const vis = visible(canvas);
    let last = 0;
    tick((now) => {
      if (!vis.visible) return;
      if (reduced()) { if (st.dirty) { draw(still); st.dirty = false; } return; }
      if (fps && now - last < 1000 / fps) return;
      last = now; st.dirty = false;
      draw(now / 1000);
    });
  }

  /* ───────────────────────── WebGL smoke ───────────────────────── */
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes; uniform float uTime; uniform vec2 uBeacon; uniform float uAmt; uniform float uWarm; uniform vec3 uLight;',
    /* hero photo: base level, red lean left→right, protected head ellipse (cx, cy, rx, ry) + how much smoke stays over it,
       drift speed, density thresholds, bottom/top weight, soft edges of the square (left, right, top, bottom; off when left = 0) */
    'uniform float uBase; uniform vec2 uWarmX; uniform vec4 uHead; uniform float uHole; uniform float uSpeed; uniform vec4 uBox; uniform vec2 uCut; uniform vec2 uYW; uniform float uTone;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7; a *= 0.5; }',
    '  return v;',
    '}',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 p = vec2(uv.x * asp, uv.y) * 1.5;',
    '  float t = uTime * 0.045 * uSpeed;',
    '  vec2 q = vec2(fbm(p + vec2(0.0, -t)), fbm(p + vec2(5.2, 1.3) + t * 0.7));',
    '  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.9), fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.6));',
    '  float f = fbm(p + 2.4 * r);',
    '  float dens = smoothstep(uCut.x, uCut.y, f) * uAmt;',
    '  dens *= mix(uYW.x, uYW.y, 1.0 - smoothstep(0.0, 0.9, uv.y));',
    /* the smoke thins out over the head (hair + face) so every curl stays crisp, and fades before the edges of its square */
    '  dens *= mix(uHole, 1.0, smoothstep(1.0, 1.7, length((uv - uHead.xy) / uHead.zw)));',
    '  if (uBox.x > 0.0) dens *= smoothstep(0.0, uBox.x, uv.x) * smoothstep(0.0, uBox.y, 1.0 - uv.x) * smoothstep(0.0, uBox.z, 1.0 - uv.y) * smoothstep(0.0, uBox.w, uv.y);',
    '  vec3 col = vec3(uBase);',
    '  col += vec3(0.56, 0.55, 0.53) * dens * 0.30;',
    '  col += vec3(0.55, 0.02, 0.0) * dens * uWarm * mix(uWarmX.x, uWarmX.y, uv.x) * 0.30 * smoothstep(0.2, 0.9, f);',
    '  if (uLight.z > 0.0) {',   /* stage light behind the subject: smoke-modulated haze so a dark silhouette reads */
    '    vec2 ld = (uv - uLight.xy) * vec2(asp * 0.85, 1.0);',
    '    float lg = exp(-pow(length(ld) / 0.46, 2.0));',
    '    col += vec3(0.64, 0.62, 0.60) * lg * uLight.z * (0.45 + 1.0 * f);',
    '  }',
    '  if (uBeacon.x > 0.0) {',
    '    vec2 d = (uv - uBeacon) * vec2(asp, 1.0);',
    '    float rr = length(d);',
    '    float pulse = 0.55 + 0.45 * pow(0.5 + 0.5 * sin(uTime * 2.2), 4.0);',
    '    float scatter = 0.55 + 0.95 * f;',
    '    float core = exp(-rr * 60.0) * 1.7;',
    '    float halo = exp(-rr * 7.0) * 0.5 * scatter;',
    '    float ph = fract(rr * 2.4 - uTime * 0.2);',
    '    float ring = smoothstep(0.0, 0.012, ph) * (1.0 - smoothstep(0.012, 0.05, ph)) * exp(-rr * 3.0) * 0.5 * scatter;',
    '    vec3 red = vec3(1.0, 0.06, 0.03);',
    '    col += red * (core * pulse + halo * pulse + ring);',
    '    col += vec3(1.0, 0.8, 0.75) * core * 0.3 * pulse;',
    '  }',
    '  vec2 vc = uv - 0.5;',
    '  col *= 1.0 - smoothstep(0.25, 1.1, length(vc * vec2(1.0, 1.2)));',
    '  if (uTone > 0.0) col = 1.0 - exp(-uTone * col);',   /* soft curve: thin smoke stays visible, dense smoke is not blown out */
    '  gl_FragColor = vec4(col, 1.0);',
    '}',
  ].join('\n');

  function initSmoke(canvas) {
    const kind = canvas.dataset.smoke;
    const plain = { base: 0.026, warmX: [1, 1], head: [0.5, 0.5, 1, 1], hole: 1, speed: 1, box: [0, 0, 0, 0], cut: [0.28, 0.95], yw: [0.5, 1.15], tone: 0 };
    const cfg = kind === 'beacon'
      ? { ...plain, amt: 1.55, warm: 0.3, at: [0.61, 0.65], light: [0.61, 0.5, 0], scale: 0.7 }
      : kind === 'hero-photo'
        // the hero photo: smoke added as light around the head and over the shoulders. The head ellipse is where the face and
        // hair sit in the picture (centre 50% across, 40% down; y here counts from the bottom); the smoke leans red on the
        // right, where the photo's own red edge-light is.
        ? { amt: 3.0, warm: 0.75, at: null, light: [0.5, 0.5, 0], scale: 0.5, base: 0, warmX: [0.35, 1.5], head: [0.5, 0.6, 0.29, 0.34], hole: 0.06, speed: 1.5, box: [0.34, 0.14, 0.22, 0.3], cut: [0.16, 0.58], yw: [0.75, 1.0], tone: 2.4 }
        : { ...plain, amt: 1.0, warm: 0.6, at: null, light: [0.5, 0.64, 0.85], scale: 0.6 };
    // failIfMajorPerformanceCaveat: if the browser would only be able to software-render WebGL
    // (no real GPU: some headless/test environments), skip it. The CSS gradient behind stays.
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!gl) return;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[fx] shader:', gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uTime = U('uTime'), uBeacon = U('uBeacon'), uAmt = U('uAmt'), uWarm = U('uWarm'), uLight = U('uLight');
    const uBase = U('uBase'), uWarmX = U('uWarmX'), uHead = U('uHead'), uHole = U('uHole'), uSpeed = U('uSpeed'), uBox = U('uBox'), uCut = U('uCut'), uYW = U('uYW'), uTone = U('uTone');
    const st = makeCanvas(canvas, { scale: cfg.scale, dprCap: 1.5 });
    let shown = false;

    run(canvas, st, (t) => {
      gl.viewport(0, 0, st.w, st.h);
      gl.uniform2f(uRes, st.w, st.h);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uBeacon, cfg.at ? cfg.at[0] : -1, cfg.at ? cfg.at[1] : -1);
      gl.uniform1f(uAmt, cfg.amt);
      gl.uniform1f(uWarm, cfg.warm);
      gl.uniform3f(uLight, cfg.light[0], cfg.light[1], cfg.light[2]);
      gl.uniform1f(uBase, cfg.base);
      gl.uniform2f(uWarmX, cfg.warmX[0], cfg.warmX[1]);
      gl.uniform4f(uHead, cfg.head[0], cfg.head[1], cfg.head[2], cfg.head[3]);
      gl.uniform1f(uHole, cfg.hole);
      gl.uniform1f(uSpeed, cfg.speed);
      gl.uniform4f(uBox, cfg.box[0], cfg.box[1], cfg.box[2], cfg.box[3]);
      gl.uniform2f(uCut, cfg.cut[0], cfg.cut[1]);
      gl.uniform2f(uYW, cfg.yw[0], cfg.yw[1]);
      gl.uniform1f(uTone, cfg.tone);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // the first frame is on the canvas: let it fade in (CSS .is-live) instead of popping in
      if (!shown) { shown = true; requestAnimationFrame(() => canvas.classList.add('is-live')); }
    }, 9.0, 30);
  }

  

  /* ───────────────────────── FraudScope: temporal transaction graph ───────────────────────── */
  function initGraph(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = makeCanvas(canvas);
    const rnd = mulberry32(21);
    const nodes = [], edges = [];
    const add = (x, y, g) => { nodes.push({ x, y, g, t0: 99, r: 1.5 + rnd() * 1.1 }); return nodes.length - 1; };
    const cluster = (cx, cy, rad, n) => {
      for (let i = 0; i < n; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * rad; add(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 0); }
    };
    cluster(0.34, 0.5, 0.25, 11); cluster(0.96, 0.27, 0.22, 11); cluster(0.98, 0.74, 0.22, 10);
    const ring0 = nodes.length;
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283 + 0.4; add(1.64 + Math.cos(a) * 0.2, 0.5 + Math.sin(a) * 0.2, 1); }
    const mule0 = nodes.length;
    add(1.36, 0.26, 2); add(1.34, 0.76, 2); add(1.9, 0.5, 2);

    const have = new Set();
    const link = (a, b, t0, kind) => {
      const key = a < b ? a + '-' + b : b + '-' + a;
      if (a === b || have.has(key)) return;
      have.add(key);
      edges.push({ a, b, t0, kind, ph: rnd() });
      nodes[a].t0 = Math.min(nodes[a].t0, t0); nodes[b].t0 = Math.min(nodes[b].t0, t0);
    };
    const dist = (a, b) => Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
    for (let i = 0; i < ring0; i++) {
      const near = [];
      for (let j = 0; j < ring0; j++) if (j !== i) near.push([dist(i, j), j]);
      near.sort((p, q) => p[0] - q[0]);
      link(i, near[0][1], rnd() * 5.4, 'n'); link(i, near[1][1], rnd() * 5.4, 'n');
    }
    for (let k = 0; k < 7; k++) { const a = Math.floor(rnd() * ring0); let best = -1, bd = 9; for (let j = 0; j < ring0; j++) { const d = dist(a, j); if (d > 0.35 && d < bd && Math.abs(nodes[a].x - nodes[j].x) > 0.2) { bd = d; best = j; } } if (best >= 0) link(a, best, 1 + rnd() * 4, 'n'); }
    for (let i = 0; i < 7; i++) link(ring0 + i, ring0 + ((i + 1) % 7), 3.6 + rnd() * 2.2, 'r');
    link(ring0, ring0 + 3, 4.4, 'r'); link(ring0 + 2, ring0 + 5, 5, 'r'); link(ring0 + 4, ring0 + 1, 5.6, 'r');
    link(mule0, ring0 + 5, 4.2, 'r'); link(mule0 + 1, ring0 + 2, 4.7, 'r'); link(mule0 + 2, ring0 + 6, 5.2, 'r');
    link(mule0, 11 + 3, 3.9, 'n'); link(mule0 + 1, 22 + 2, 4.1, 'n'); link(mule0, mule0 + 2, 5.5, 'r');

    const T = 12.4, DET = 6.7, FONT = '"IBM Plex Mono", ui-monospace, monospace';
    const draw = (now) => {
      const { w, h, dpr } = st;
      const tt = reduced() ? now : now % T;
      ctx.clearRect(0, 0, w, h);
      const X = (x) => (x / 2) * w, Y = (y) => (0.07 + y * 0.66) * h;
      const fade = 1 - clamp((tt - 11) / 1.2, 0, 1);
      const det = clamp((tt - DET) / 0.9, 0, 1);
      ctx.globalAlpha = fade;

      for (const e of edges) {
        const age = tt - e.t0;
        if (age < 0) continue;
        const a = nodes[e.a], b = nodes[e.b], k = clamp(age / 0.5, 0, 1);
        ctx.beginPath();
        ctx.moveTo(X(a.x), Y(a.y));
        ctx.lineTo(lerp(X(a.x), X(b.x), k), lerp(Y(a.y), Y(b.y), k));
        if (e.kind === 'r' && det > 0) { ctx.strokeStyle = 'rgba(255,59,47,' + (0.25 + 0.65 * det) + ')'; ctx.lineWidth = 1.5 * dpr; }
        else { ctx.strokeStyle = 'rgba(236,232,224,' + (age < 0.9 ? 0.55 : 0.16) + ')'; ctx.lineWidth = dpr; }
        ctx.stroke();
        /* a transaction travelling along the edge */
        if (age > 1 && (e.ph * 7 | 0) % 2 === 0) {
          const u = (tt * 0.28 + e.ph) % 1;
          ctx.fillStyle = e.kind === 'r' && det > 0.5 ? 'rgba(255,59,47,.95)' : 'rgba(236,232,224,.7)';
          ctx.beginPath(); ctx.arc(lerp(X(a.x), X(b.x), u), lerp(Y(a.y), Y(b.y), u), 1.3 * dpr, 0, 6.283); ctx.fill();
        }
      }
      for (const n of nodes) {
        if (tt < n.t0) continue;
        const flagged = n.g > 0 && det > 0;
        const r = n.r * dpr * (flagged ? 1.5 : 1);
        ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), r, 0, 6.283);
        ctx.fillStyle = flagged ? 'rgb(255,59,47)' : 'rgba(236,232,224,.82)';
        ctx.fill();
        if (flagged) {
          const ph = (tt * 0.9 + n.x * 3) % 1;
          ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), (5 + 15 * ph) * dpr, 0, 6.283);
          ctx.strokeStyle = 'rgba(255,59,47,' + (0.5 * (1 - ph) * det) + ')'; ctx.lineWidth = dpr; ctx.stroke();
        }
      }
      /* detection box + label */
      if (det > 0) {
        const pad = lerp(46, 0, 1 - Math.pow(1 - det, 3)) * dpr;
        const x0 = X(1.3) - pad, x1 = X(1.98) + pad, y0 = Y(0.1) - pad, y1 = Y(0.9) + pad, c = 12 * dpr;
        ctx.strokeStyle = 'rgba(255,59,47,' + det + ')'; ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + c); ctx.lineTo(x0, y0); ctx.lineTo(x0 + c, y0);
        ctx.moveTo(x1 - c, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + c);
        ctx.moveTo(x0, y1 - c); ctx.lineTo(x0, y1); ctx.lineTo(x0 + c, y1);
        ctx.moveTo(x1 - c, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - c);
        ctx.stroke();
        ctx.font = (10 * dpr) + 'px ' + FONT;
        if ('letterSpacing' in ctx) ctx.letterSpacing = (1.2 * dpr) + 'px';
        ctx.fillStyle = 'rgba(255,59,47,' + det + ')';
        ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('RING-07 · FLAGGED', x1 - 4 * dpr, y0 - 6 * dpr);
      }
      /* timeline + scrubber */
      const ty = h * 0.8, lx = 14 * dpr, rx = w - 14 * dpr;
      ctx.strokeStyle = 'rgba(236,232,224,.2)'; ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(rx, ty); ctx.stroke();
      for (let i = 0; i <= 24; i++) { const x = lerp(lx, rx, i / 24); ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x, ty + (i % 6 === 0 ? 7 : 3) * dpr); ctx.stroke(); }
      const sx = lerp(lx, rx, clamp(tt / 11, 0, 1));
      ctx.strokeStyle = 'rgb(255,59,47)'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(sx, ty - 7 * dpr); ctx.lineTo(sx, ty + 9 * dpr); ctx.stroke();
      ctx.font = (9.5 * dpr) + 'px ' + FONT;
      ctx.fillStyle = 'rgba(236,232,224,.6)'; ctx.textAlign = 'right';
      ctx.fillText('t = ' + (clamp(tt, 0, 11)).toFixed(1).padStart(4, '0') + 's', rx, ty - 12 * dpr);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    };
    run(canvas, st, draw, 8.4, 40);
  }

  /* ───────────────────────── Deep Learning in NLP: attention map ───────────────────────── */
  function initAttn(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = makeCanvas(canvas);
    const N = 13;
    const toks = ['the', 'model', 'reads', 'between', 'the', 'lines', 'and', 'flags', 'what', 'humans', 'miss', '.', '·'];
    const raw = (i, j, t) => {
      const band = Math.exp(-Math.pow(i - j, 2) / 3.2);
      const hub = Math.exp(-Math.pow(j - 3, 2) / 1.1) * (i > 3 ? 0.85 : 0);
      const wob = 0.5 + 0.5 * Math.sin(i * 1.7 + j * 2.3 + t * 0.9) * Math.cos(j * 1.1 - t * 0.6 + i * 0.4);
      return band * 0.7 + hub * 0.6 + wob * 0.3;
    };
    const FONT = '"IBM Plex Mono", ui-monospace, monospace';
    const draw = (t) => {
      const { w, h, dpr } = st;
      ctx.clearRect(0, 0, w, h);
      const labelW = 64 * dpr, size = Math.min((w * 0.84 - labelW) / N, (h * 0.78) / N);
      const gx = (w - (labelW + size * N)) / 2 + labelW, gy = h * 0.09;
      const focus = Math.floor(t * 0.7) % N;
      ctx.font = (9.5 * dpr) + 'px ' + FONT; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      for (let i = 0; i < N; i++) {
        let mx = 0; const row = [];
        for (let j = 0; j < N; j++) { const v = raw(i, j, t); row.push(v); if (v > mx) mx = v; }
        const cy = gy + i * size + size / 2;
        ctx.fillStyle = i === focus ? 'rgba(236,232,224,.95)' : 'rgba(236,232,224,.38)';
        ctx.fillText(toks[i], gx - 10 * dpr, cy);
        for (let j = 0; j < N; j++) {
          const v = row[j] / mx, hot = v > 0.97 && i === focus;
          ctx.fillStyle = hot ? 'rgb(225,6,0)' : 'rgba(236,232,224,' + (Math.pow(v, 2.2) * (i === focus ? 0.95 : 0.55)).toFixed(3) + ')';
          ctx.fillRect(gx + j * size + dpr, gy + i * size + dpr, size - 2 * dpr, size - 2 * dpr);
        }
      }
      ctx.strokeStyle = 'rgba(255,59,47,.9)'; ctx.lineWidth = 1.5 * dpr;
      ctx.strokeRect(gx - 3 * dpr, gy + focus * size - dpr, size * N + 6 * dpr, size + 2 * dpr);
    };
    run(canvas, st, draw, 6.5, 24);
  }

  /* ───────────────────────── SmartAds: signal bars (decorative) ───────────────────────── */
  function initBars(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = makeCanvas(canvas);
    const N = 34, rnd = mulberry32(5);
    const bars = Array.from({ length: N }, (_, i) => ({ s: 0.7 + rnd() * 1.5, p: rnd() * 6.283, env: 0.4 + 0.6 * Math.exp(-Math.pow((i / (N - 1) - 0.6) * 2.3, 2)) }));
    const draw = (t) => {
      const { w, h, dpr } = st;
      ctx.clearRect(0, 0, w, h);
      const base = h * 0.8, top = h * 0.12, gap = w / N, bw = gap * 0.56;
      let mi = 0, mv = -1;
      const vals = bars.map((b, i) => { const v = (0.1 + 0.9 * (0.5 + 0.5 * Math.sin(t * b.s + b.p))) * b.env; if (v > mv) { mv = v; mi = i; } return v; });
      vals.forEach((v, i) => {
        const bh = (base - top) * v, x = i * gap + (gap - bw) / 2;
        ctx.fillStyle = i === mi ? 'rgb(225,6,0)' : 'rgba(236,232,224,' + (0.2 + 0.5 * v).toFixed(3) + ')';
        ctx.fillRect(x, base - bh, bw, bh);
      });
      ctx.fillStyle = 'rgba(236,232,224,.28)'; ctx.fillRect(0, base + 4 * dpr, w, dpr);
    };
    run(canvas, st, draw, 3.2, 30);
  }

  /* ───────────────────────── Signals: scope trace ───────────────────────── */
  function initWave(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = makeCanvas(canvas);
    const f = (u, t, ph) => Math.sin((u + t * 38) * 0.011 + ph) * 0.28 + Math.sin((u - t * 61) * 0.027 + ph * 2.1) * 0.14 + Math.sin((u + t * 140) * 0.06) * 0.05;
    const spike = (u, t, wpx) => {
      let s = 0;
      for (let k = 0; k < 3; k++) {
        const px = (((k * 0.34 + t * (0.035 + 0.011 * k)) % 1) * wpx);
        const d = u - px;
        s += Math.exp(-(d * d) / 240) * Math.sin(d * 0.34) * (k % 2 ? -1.6 : 2.1);
      }
      return s;
    };
    const draw = (t) => {
      const { w, h, dpr } = st;
      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.55, A = h * 0.26, wpx = w / dpr;
      ctx.strokeStyle = 'rgba(236,232,224,.07)'; ctx.lineWidth = dpr;
      for (let x = 0; x < w; x += 64 * dpr) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      const trace = (style, lw, fn) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3 * dpr) { const y = mid - fn(x / dpr) * A; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.strokeStyle = style; ctx.lineWidth = lw * dpr; ctx.stroke();
      };
      trace('rgba(236,232,224,.16)', 1, (u) => f(u, t * 0.8, 1.3) * 0.8);
      trace('rgb(225,6,0)', 1.6, (u) => f(u, t, 0) + spike(u, t, wpx) * 0.5);
    };
    run(canvas, st, draw, 5.0, 40);
  }

  /** Starts the generated visuals. The hero smoke starts at once; everything else waits until it is near the viewport. */
export function initFX() {
  const lazy = (el, fn) => {
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(el); }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  };
  qsa('canvas[data-smoke]').forEach((c) => (c.dataset.smoke.startsWith('hero') ? initSmoke(c) : lazy(c, initSmoke)));
  const map = { graph: initGraph, attn: initAttn, bars: initBars, wave: initWave };
  qsa('canvas[data-viz]').forEach((c) => { const fn = map[c.dataset.viz]; if (fn) lazy(c, fn); });
}

