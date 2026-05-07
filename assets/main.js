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
     Three.js — 5 frecuencias en espacio 3D
     ========================================================= */
  let freqRig = null;
  function initThree(){
    if (!window.THREE) return;
    const canvas = document.getElementById('freq-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xF5EFE4, 18, 42);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    function resize(){
      const r = canvas.getBoundingClientRect();
      const w = Math.max(r.width  | 0, 320);
      const h = Math.max(r.height | 0, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();

    // 5 frecuencias armónicas — cada una es una línea en 3D
    const COUNT     = 5;
    const SAMPLES   = 220;
    const LINE_LEN  = 36;     // ancho en mundo
    const Y_SPACING = 1.9;
    const harmonics = [1, 2, 3, 4, 5];
    // Tonos nácar / tinta (más oscuro al centro)
    const colors = [
      0x6B5C49, 0x4A3D2E, 0x2A2118, 0x4A3D2E, 0x6B5C49
    ];
    const lines = [];

    for (let i = 0; i < COUNT; i++){
      const positions = new Float32Array((SAMPLES + 1) * 3);
      for (let s = 0; s <= SAMPLES; s++){
        const x = (s / SAMPLES - 0.5) * LINE_LEN;
        positions[s*3]     = x;
        positions[s*3 + 1] = 0;
        positions[s*3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.55,
        linewidth: 1
      });

      const line = new THREE.Line(geo, mat);
      line.position.y = (i - (COUNT - 1) / 2) * Y_SPACING;
      scene.add(line);

      lines.push({
        line,
        geo,
        positions,
        harmonic: harmonics[i],
        ampBase: 0.45 + i * 0.05,
        zAmpBase: 1.6 + i * 0.18,
        phaseSpeed: 0.0006 + i * 0.0004,   // velocidad de fase (latente)
        zSpeed: 0.0004 + i * 0.0002,
        phase0: i * 1.3
      });
    }

    // Glow halos (puntos suaves al fondo)
    const haloGeo = new THREE.BufferGeometry();
    const haloCount = 80;
    const haloPos = new Float32Array(haloCount * 3);
    for (let i = 0; i < haloCount; i++){
      haloPos[i*3]     = (Math.random() - 0.5) * 38;
      haloPos[i*3 + 1] = (Math.random() - 0.5) * 14;
      haloPos[i*3 + 2] = -8 - Math.random() * 14;
    }
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
    const haloMat = new THREE.PointsMaterial({
      color: 0xCFBC9B,
      size: 0.18,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true
    });
    const halos = new THREE.Points(haloGeo, haloMat);
    scene.add(halos);

    let active = true;
    let raf = 0;
    const start = performance.now();

    function frame(now){
      const t = (now - start) * 0.001;

      // animar líneas
      for (const L of lines){
        const arr = L.positions;
        const ph = L.phase0 + t * L.phaseSpeed * 1000;
        for (let s = 0; s <= SAMPLES; s++){
          const u = s / SAMPLES;
          const x = (u - 0.5) * LINE_LEN;
          // onda principal
          const wave = Math.sin(u * Math.PI * 2 * L.harmonic + ph);
          // modulación lenta (espacio latente)
          const latent = Math.sin(u * Math.PI + ph * 0.18) * 0.35;
          arr[s*3 + 1] = (wave + latent) * L.ampBase;
          // profundidad ondulante
          arr[s*3 + 2] = Math.cos(u * Math.PI * L.harmonic * 0.7 + ph * 0.6) * L.zAmpBase;
          arr[s*3]     = x;
        }
        L.geo.attributes.position.needsUpdate = true;
        L.geo.computeBoundingSphere();
      }

      // suave deriva de cámara/escena
      scene.rotation.y = Math.sin(t * 0.06) * 0.18;
      scene.rotation.x = Math.cos(t * 0.04) * 0.10;
      camera.position.z = 22 + Math.sin(t * 0.08) * 0.6;

      // halos rotan apenas
      halos.rotation.z = t * 0.02;

      renderer.render(scene, camera);
      if (active) raf = requestAnimationFrame(frame);
    }

    function setActive(on){
      active = on && !reduced;
      if (active && !raf) raf = requestAnimationFrame(frame);
      if (!active && raf){ cancelAnimationFrame(raf); raf = 0; }
    }

    // pausar cuando la pestaña no está visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setActive(false);
      else if (body.dataset.route === 'home') setActive(true);
    });

    if (!reduced) setActive(true);
    else { renderer.render(scene, camera); }

    return { setActive };
  }

  freqRig = initThree();

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
