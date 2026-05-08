// Harmonic Beacon — SPA + Three.js frequencies + animaciones
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     Language switch (ES/EN) — persistente en localStorage
     ========================================================= */
  (function initLangSwitch(){
    const html = document.documentElement;
    const stored = (() => { try { return localStorage.getItem('hb-lang'); } catch { return null; } })();
    const initial = (stored === 'en' || stored === 'es') ? stored : 'es';
    setLang(initial);
    document.querySelectorAll('.lang-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        setLang(html.dataset.activeLang === 'es' ? 'en' : 'es');
      });
    });
    function setLang(l){
      html.dataset.activeLang = l;
      html.lang = l;
      try { localStorage.setItem('hb-lang', l); } catch {}
    }
  })();

  /* =========================================================
     SPA — routing por hash
     ========================================================= */
  const VALID = ['home','beacon','experiencia','hit','altermundi'];
  const body = document.body;

  function showRoute(name){
    if (!VALID.includes(name)) name = 'home';
    body.dataset.route = name;
    document.querySelectorAll('[data-tab]').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === name && name !== 'home');
    });
    document.querySelectorAll('.mobile-tabs').forEach(s => { if (s.value !== name) s.value = name; });
    window.scrollTo({ top: 0, behavior: 'instant' });
    runReveals();
    if (freqRig)   freqRig.setActive(name === 'home');
    if (auroraRig) auroraRig.setActive(name === 'home');
  }

  function syncFromHash(){
    const h = (location.hash.replace('#','') || 'home').toLowerCase();
    showRoute(h);
  }
  window.addEventListener('hashchange', syncFromHash);

  // Mobile select (one per language; both wired)
  document.querySelectorAll('.mobile-tabs').forEach(sel => {
    sel.addEventListener('change', (e) => {
      location.hash = e.target.value === 'home' ? '' : '#' + e.target.value;
      if (e.target.value === 'home') syncFromHash();
    });
  });

  /* =========================================================
     Lissajous — figura armónica que respira entre ratios consonantes
     trazada con efecto trail (tipo osciloscopio nácar)
     ========================================================= */
  let freqRig = null;
  function initLissajous(){
    const canvas = document.getElementById('freq-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d', { alpha: false });

    let W = 0, H = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize(){
      const r = canvas.getBoundingClientRect();
      const w = Math.floor(r.width);
      const h = Math.floor(r.height);
      if (w < 8 || h < 8) return; // panel oculto / no medible aún
      W = w; H = h;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      // No tocamos inline style: el CSS (width:100%; height:100%) controla el display
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#F5EFE4';
      ctx.fillRect(0, 0, W, H);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    // Lissajous de φ (proporción áurea) — fluye sin repetirse,
    // se siente respiración orgánica, no caos.
    const PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887…
    const A_RATIO = 1;
    const B_RATIO = PHI;
    const TAU_SPEED = 1.9;   // trazo lento, meditativo
    const TRAIL_FADE = 0.055; // fade rápido = menos saturación visual

    let active = true;
    let raf = 0;
    let last = performance.now();
    let tau = 0;

    function frame(now){
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const prevTau = tau;
      tau += dt * TAU_SPEED;

      // Respiración: la fase se mueve lento, la amplitud "inhala/exhala"
      const t = now / 1000;
      const delta = t * 0.16;
      const breath = 1 + Math.sin(t * 0.35) * 0.04; // ±4%

      // Trail fade cremoso — nácar lavado
      ctx.fillStyle = `rgba(245, 239, 228, ${TRAIL_FADE})`;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const amp = Math.min(W, H) * 0.34 * breath;

      // Sub-pasos para suavidad
      const SUB = Math.max(20, Math.ceil((tau - prevTau) * 220));
      ctx.beginPath();
      for (let i = 0; i <= SUB; i++){
        const tt = prevTau + (tau - prevTau) * (i / SUB);
        const x = cx + amp * Math.sin(A_RATIO * tt + delta);
        const y = cy + amp * Math.sin(B_RATIO * tt);
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.lineWidth   = 1.2;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = 'rgba(58, 46, 34, 0.62)';
      ctx.stroke();

      // Cabeza: estrellita fugaz — halo + chispa + cruz
      const xH = cx + amp * Math.sin(A_RATIO * tau + delta);
      const yH = cy + amp * Math.sin(B_RATIO * tau);

      // sparkle leve (twinkle)
      const tw = 0.85 + Math.sin(t * 4.2) * 0.15;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // halo exterior amplio
      const halo = ctx.createRadialGradient(xH, yH, 0, xH, yH, 36);
      halo.addColorStop(0.00, `rgba(255, 240, 200, ${0.40 * tw})`);
      halo.addColorStop(0.45, 'rgba(255, 225, 170, 0.10)');
      halo.addColorStop(1.00, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(xH, yH, 36, 0, Math.PI * 2);
      ctx.fill();

      // glow caliente interior
      const hot = ctx.createRadialGradient(xH, yH, 0, xH, yH, 11);
      hot.addColorStop(0.00, `rgba(255, 250, 235, ${0.95 * tw})`);
      hot.addColorStop(0.55, 'rgba(255, 232, 185, 0.45)');
      hot.addColorStop(1.00, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = hot;
      ctx.beginPath();
      ctx.arc(xH, yH, 11, 0, Math.PI * 2);
      ctx.fill();

      // cruz de chispa (lens flare)
      const spike = (angle, len, alpha) => {
        const c = Math.cos(angle), s = Math.sin(angle);
        const x1 = xH - c * len, y1 = yH - s * len;
        const x2 = xH + c * len, y2 = yH + s * len;
        const lg = ctx.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0.0,  'rgba(255, 240, 200, 0)');
        lg.addColorStop(0.5,  `rgba(255, 250, 230, ${alpha * tw})`);
        lg.addColorStop(1.0,  'rgba(255, 240, 200, 0)');
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };
      spike(0,            28, 0.75); // horizontal
      spike(Math.PI / 2,  28, 0.75); // vertical
      spike(Math.PI / 4,  18, 0.32); // diagonales sutiles
      spike(-Math.PI / 4, 18, 0.32);

      // núcleo blanco
      ctx.fillStyle = `rgba(255, 252, 240, ${0.95 * tw})`;
      ctx.beginPath();
      ctx.arc(xH, yH, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (active) raf = requestAnimationFrame(frame);
    }

    function setActive(on){
      active = on && !reduced;
      if (active && !raf){
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      if (!active && raf){ cancelAnimationFrame(raf); raf = 0; }
    }

    // pausar al cambiar de pestaña
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setActive(false);
      else if (body.dataset.route === 'home') setActive(true);
    });

    if (!reduced) setActive(true);
    else {
      // Modo reducido: dibujar una sola figura estática
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(42, 33, 24, 0.55)';
      ctx.beginPath();
      const PHI = (1 + Math.sqrt(5)) / 2;
      const steps = 4000;
      for (let i = 0; i <= steps; i++){
        const t = (i / steps) * Math.PI * 14;
        const x = (W/2) + Math.min(W, H) * 0.34 * Math.sin(t + 0.4);
        const y = (H/2) + Math.min(W, H) * 0.34 * Math.sin(PHI * t);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    return { setActive };
  }

  freqRig = initLissajous();

  /* =========================================================
     Aurora boreal — canvas + ruido FBM (cortinas que ondulan)
     ========================================================= */
  let auroraRig = null;
  function initAurora(){
    const canvas = document.querySelector('.aurora-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    // DPR moderado: el canvas va con blur grande, no necesita full DPR
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W = 0, H = 0;
    function resize(){
      const r = canvas.getBoundingClientRect();
      const w = Math.floor(r.width), h = Math.floor(r.height);
      if (w < 8 || h < 8) return;
      W = w; H = h;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    // Ruido 1D suave (smoothstep-interpolated random)
    const SEED_LEN = 2048;
    const seeds = new Float32Array(SEED_LEN);
    for (let i = 0; i < SEED_LEN; i++) seeds[i] = Math.random();
    function smooth(x){ return x * x * (3 - 2 * x); }
    function noise1(x){
      const xi = Math.floor(x);
      const xf = x - xi;
      const u = smooth(xf);
      const a = seeds[((xi % SEED_LEN) + SEED_LEN) % SEED_LEN];
      const b = seeds[((xi + 1) % SEED_LEN + SEED_LEN) % SEED_LEN];
      return a * (1 - u) + b * u;
    }
    function fbm(x){
      // 3 octavas, fractal brownian motion
      let s = 0, amp = 0.5, freq = 1, norm = 0;
      for (let i = 0; i < 3; i++){
        s    += noise1(x * freq) * amp;
        norm += amp;
        amp  *= 0.5;
        freq *= 2;
      }
      return s / norm;
    }

    // Cortinas — colores aurora boreal (verde, cyan-azul, magenta, violeta, dorado)
    const curtains = [
      { color: [110, 232, 178], cx: 0.18, w: 0.22, amp: 0.07, sp: 0.10, drift: 0.06, seed: 7   },
      { color: [148, 200, 240], cx: 0.36, w: 0.24, amp: 0.09, sp: 0.07, drift: 0.05, seed: 23  },
      { color: [228, 132, 184], cx: 0.56, w: 0.22, amp: 0.10, sp: 0.13, drift: 0.07, seed: 41  },
      { color: [186, 150, 232], cx: 0.74, w: 0.24, amp: 0.11, sp: 0.06, drift: 0.05, seed: 67  },
      { color: [238, 218, 158], cx: 0.50, w: 0.42, amp: 0.04, sp: 0.04, drift: 0.03, seed: 103 },
    ];
    const N = 36;

    let active = true;
    let raf = 0;

    function frame(now){
      const t = now * 0.0008;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (const c of curtains){
        // deriva horizontal lenta del centro
        const cx = c.cx + Math.sin(t * 0.4 + c.seed) * c.drift;

        ctx.beginPath();
        // borde izquierdo
        for (let i = 0; i <= N; i++){
          const u = i / N;
          const y = u * H;
          const n = fbm(u * 1.7 + c.seed + t * c.sp) - 0.5;
          const x = (cx - c.w / 2 + n * c.amp) * W;
          if (i === 0) ctx.moveTo(x, y);
          else         ctx.lineTo(x, y);
        }
        // borde derecho (descendiendo)
        for (let i = N; i >= 0; i--){
          const u = i / N;
          const y = u * H;
          const n = fbm(u * 1.7 + c.seed + 1000 + t * c.sp * 1.15) - 0.5;
          const x = (cx + c.w / 2 + n * c.amp) * W;
          ctx.lineTo(x, y);
        }
        ctx.closePath();

        // gradiente vertical: transparente arriba/abajo, denso al medio
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        const [r, g, b] = c.color;
        grad.addColorStop(0.00, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.18, `rgba(${r},${g},${b},0.32)`);
        grad.addColorStop(0.46, `rgba(${r},${g},${b},0.66)`);
        grad.addColorStop(0.78, `rgba(${r},${g},${b},0.30)`);
        grad.addColorStop(1.00, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      if (active) raf = requestAnimationFrame(frame);
    }

    function setActive(on){
      active = on && !reduced;
      if (active && !raf) raf = requestAnimationFrame(frame);
      if (!active && raf){ cancelAnimationFrame(raf); raf = 0; }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setActive(false);
      else if (body.dataset.route === 'home') setActive(true);
    });

    if (!reduced) setActive(true);
    else { frame(performance.now()); }

    return { setActive };
  }

  auroraRig = initAurora();

  /* =========================================================
     HIT — Lissajous de fondo (réplica del estilo del libro)
     Curva cerrada con ratio 3:2, animación lenta de fase.
     ========================================================= */
  (function initHitLissajous(){
    const c = document.querySelector('.hit-lissajous');
    if (!c) return;
    const ctx = c.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let W = 600, H = 600;
    function sizeCanvas(){
      const r = c.getBoundingClientRect();
      const w = Math.max(Math.floor(r.width),  200);
      const h = Math.max(Math.floor(r.height), 200);
      if (w === W && h === H && c.width === w * DPR) return;
      W = w; H = h;
      c.width  = W * DPR;
      c.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    new ResizeObserver(sizeCanvas).observe(c);
    sizeCanvas();

    const a  = parseFloat(c.dataset.a)     || 3;
    const b  = parseFloat(c.dataset.b)     || 2;
    const ph = parseFloat(c.dataset.phase) || 0.78;
    const STEPS = 320;
    const INTERVAL = 56; // ~18fps

    let t = 0, last = 0, raf = 0, active = true;

    function draw(ts){
      if (!active) return;
      if (!reduced && ts - last < INTERVAL){
        raf = requestAnimationFrame(draw); return;
      }
      last = ts;

      const cx = W / 2, cy = H / 2;
      const pad = Math.max(6, W * 0.06);
      const rx = cx - pad, ry = cy - pad;

      ctx.clearRect(0, 0, W, H);

      // glow suave detrás (proporcional al tamaño)
      const glowW  = Math.max(2.5, W * 0.035);
      const traceW = Math.max(1.0, W * 0.011);

      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++){
        const p = (i / STEPS) * Math.PI * 2;
        const x = cx + rx * Math.sin(a * p + ph + (reduced ? 0 : t));
        const y = cy + ry * Math.sin(b * p);
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.lineWidth   = glowW;
      ctx.strokeStyle = 'rgba(75, 60, 42, 0.10)';
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();

      // trazo principal (tinta)
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++){
        const p = (i / STEPS) * Math.PI * 2;
        const x = cx + rx * Math.sin(a * p + ph + (reduced ? 0 : t));
        const y = cy + ry * Math.sin(b * p);
        if (i === 0) ctx.moveTo(x, y);
        else         ctx.lineTo(x, y);
      }
      ctx.lineWidth   = traceW;
      ctx.strokeStyle = 'rgba(42, 33, 24, 0.78)';
      ctx.stroke();

      if (!reduced){
        t += 0.005;
        raf = requestAnimationFrame(draw);
      }
    }

    function setActive(on){
      active = on && !reduced;
      if (active && !raf) raf = requestAnimationFrame(draw);
      if (!active){ if (raf) cancelAnimationFrame(raf); raf = 0; }
    }

    // Activar solo cuando el panel HIT está visible
    function syncToRoute(){
      setActive(body.dataset.route === 'hit');
    }
    new MutationObserver(syncToRoute).observe(body, { attributes: true, attributeFilter: ['data-route'] });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setActive(false);
      else syncToRoute();
    });
    syncToRoute();
    // dibujo inicial estático aunque no esté activa
    if (reduced) draw(0);
  })();

  /* =========================================================
     Espiral logarítmica (Mito)
     ========================================================= */
  const spiralPath = document.querySelector('.mito-spiral-path');
  if (spiralPath){
    const a = 1.2, b = 0.18, turns = 5, step = 0.05;
    let d = '';
    for (let t = 0; t <= turns * Math.PI * 2; t += step){
      const r = a * Math.exp(b * t);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      d += (t === 0 ? 'M ' : 'L ') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    }
    spiralPath.setAttribute('d', d);
  }

  /* =========================================================
     Reveals con GSAP (por panel)
     ========================================================= */
  if (window.gsap){
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (!reduced && body.dataset.route === 'home'){
      gsap.from('.hero-title',  { y: 40, opacity: 0, duration: 1.2, ease: 'power3.out' });
      gsap.from('.hero-sub',    { y: 24, opacity: 0, duration: 1.0, delay: .35, ease: 'power3.out' });
      gsap.from('.hero-ctas',   { y: 20, opacity: 0, duration: 1.0, delay: .65, ease: 'power3.out' });
    }
  }

  function runReveals(){
    if (reduced){
      document.querySelectorAll('.reveal, .reveal-img').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    if (!window.gsap) return;
    const active = document.querySelector(`[data-panel="${body.dataset.route}"]`);
    if (!active) return;
    active.querySelectorAll('.reveal').forEach(el => gsap.set(el, { opacity: 0, y: 28 }));
    active.querySelectorAll('.reveal-img').forEach(el => gsap.set(el, { opacity: 0, y: 36, scale: .985 }));
    active.querySelectorAll('.reveal').forEach((el, i) => {
      gsap.to(el, { y: 0, opacity: 1, duration: 1.0, delay: i * 0.06, ease: 'power3.out' });
    });
    active.querySelectorAll('.reveal-img').forEach((el, i) => {
      gsap.to(el, { y: 0, scale: 1, opacity: 1, duration: 1.2, delay: 0.1 + i * 0.06, ease: 'power3.out' });
    });
  }

  // Initial route
  syncFromHash();
})();
