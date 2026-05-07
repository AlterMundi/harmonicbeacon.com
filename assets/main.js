// Harmonic Beacon — SPA + Three.js frequencies + animaciones
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     SPA — routing por hash
     ========================================================= */
  const VALID = ['home','beacon','experiencia','hit','altermundi','mito'];
  const body = document.body;

  function showRoute(name){
    if (!VALID.includes(name)) name = 'home';
    body.dataset.route = name;
    document.querySelectorAll('[data-tab]').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === name && name !== 'home');
    });
    const sel = document.querySelector('.mobile-tabs');
    if (sel && sel.value !== name) sel.value = name;
    window.scrollTo({ top: 0, behavior: 'instant' });
    runReveals();
    if (freqRig) freqRig.setActive(name === 'home');
  }

  function syncFromHash(){
    const h = (location.hash.replace('#','') || 'home').toLowerCase();
    showRoute(h);
  }
  window.addEventListener('hashchange', syncFromHash);

  // Mobile select
  const sel = document.querySelector('.mobile-tabs');
  if (sel){
    sel.addEventListener('change', (e) => {
      location.hash = e.target.value === 'home' ? '' : '#' + e.target.value;
      if (e.target.value === 'home') syncFromHash();
    });
  }

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

      // Cabeza tenue (suave, no protagonista)
      const xH = cx + amp * Math.sin(A_RATIO * tau + delta);
      const yH = cy + amp * Math.sin(B_RATIO * tau);
      const grad = ctx.createRadialGradient(xH, yH, 0, xH, yH, 16);
      grad.addColorStop(0.00, 'rgba(255, 246, 220, 0.55)');
      grad.addColorStop(0.50, 'rgba(255, 230, 180, 0.18)');
      grad.addColorStop(1.00, 'rgba(255, 220, 160, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(xH, yH, 16, 0, Math.PI * 2);
      ctx.fill();

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
