/* Neural Void field — Canvas2D only, intentionally self-contained. */
(() => {
  'use strict';

  const canvas = document.getElementById('void-field');
  const toggle = document.getElementById('motion-toggle');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const field = canvas.closest('.field') || canvas.parentElement;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)');
  const TAU = Math.PI * 2;
  const state = {
    active: !(reduced && reduced.matches),
    userChoice: false,
    visible: true,
    balanced: false,
    width: 0,
    height: 0,
    dpr: 1,
    points: [],
    raf: 0,
    last: 0,
    phase: 0,
    scroll: 0,
    targetScroll: 0,
    pointerX: 0,
    pointerY: 0
  };

  function createPoints() {
    const compact = state.width < 600 || state.height < 300;
    // More cross-sections make this read as a luminous material, not wire rings.
    const around = compact ? 180 : 240;
    const through = compact ? 16 : 18;
    const points = [];

    for (let i = 0; i < around; i += 1) {
      for (let j = 0; j < through; j += 1) {
        // A tiny deterministic offset avoids visible latitude/longitude striping.
        const grain = ((i * 37 + j * 17) % 19) / 19;
        points.push({
          theta: (i + grain * 0.7) / around * TAU,
          phi: (j + grain * 0.55) / through * TAU,
          grain
        });
      }
    }
    state.points = points;
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    state.width = Math.max(1, box.width);
    state.height = Math.max(1, box.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    createPoints();
    drawFrame();
  }

  function paintBloom() {
    const { width: w, height: h } = state;
    ctx.clearRect(0, 0, w, h);
    const bloom = ctx.createRadialGradient(w * 0.57, h * 0.49, 0, w * 0.57, h * 0.49, Math.min(w, h) * 0.54);
    bloom.addColorStop(0, state.balanced ? 'rgba(72, 229, 248, .15)' : 'rgba(0, 212, 245, .18)');
    bloom.addColorStop(.43, 'rgba(0, 160, 203, .06)');
    bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);
  }

  function drawFrame() {
    const { width: w, height: h } = state;
    if (!w || !h || !state.points.length) return;
    paintBloom();

    const t = state.phase;
    const morph = state.scroll * state.scroll * (3 - 2 * state.scroll);
    const R = Math.min(w, h) * 0.55;
    const tube = R * 0.38;
    const tiltX = 0.85 + morph * 0.75 + state.pointerY * 0.055;
    const tiltZ = -0.35 + morph * 0.45 + state.pointerX * 0.06;
    const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
    const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
    const cx = w * 0.5, cy = h * (0.48 - morph * 0.12);
    const flow = state.balanced ? 0.36 : 0.64;
    const spin = state.balanced ? 0.18 : 0.35;

    for (const point of state.points) {
      const wave = Math.sin(point.theta * 3 - t * 2.2) * flow;
      const twist = point.phi + wave + Math.sin(point.theta * 5 + t) * 0.15;
      const pulse = 1 + Math.sin(point.theta * 4 + point.phi * 2 + t * 2.8) * 0.065;
      const orbit = point.theta + t * spin;
      const ring = R * (1 + Math.sin(point.theta * 2 - t) * 0.055) + tube * Math.cos(twist) * pulse;
      let x = ring * Math.cos(orbit);
      let y = ring * Math.sin(orbit);
      let z = tube * Math.sin(twist) * (1 + Math.cos(point.theta * 3 + t) * 0.12);
      // Scrolling gradually opens the ring into a flowing signal across the page.
      const signalX = (point.theta / TAU - 0.5) * w * 1.3;
      const signalY = Math.sin(point.theta * 2 + t + point.phi * .25) * h * .1 + Math.sin(point.phi) * h * .17;
      const signalZ = Math.cos(point.phi) * 45;
      x += (signalX - x) * morph;
      y += (signalY - y) * morph;
      z += (signalZ - z) * morph;

      // Fixed X/Z rotation keeps the object legible as a deep, tilted volume.
      const yX = y * cosX - z * sinX;
      const zX = y * sinX + z * cosX;
      const xZ = x * cosZ - yX * sinZ;
      const yZ = x * sinZ + yX * cosZ;
      const perspective = 760 / (760 + zX);
      const depth = Math.max(0, Math.min(1, (zX / (R + tube) + 1) * 0.5));
      const px = cx + xZ * perspective;
      const py = cy + yZ * perspective;
      const shimmer = .86 + Math.sin(point.theta * 11 + point.phi * 7 + t * 3) * .14;
      const alpha = (.20 + depth * .76) * shimmer * (1 - morph * .25);
      const size = (1.1 + depth * 1.85) * perspective;

      ctx.fillStyle = depth > .63
        ? `rgba(170, 249, 255, ${alpha})`
        : `rgba(0, 211, 244, ${alpha * .88})`;
      ctx.fillRect(px, py, size, size);
    }
  }

  function cancel() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function queue() {
    if (!state.active || !state.visible || document.hidden || state.raf) return;
    state.raf = requestAnimationFrame(animate);
  }

  function animate(now) {
    state.raf = 0;
    if (!state.active || !state.visible || document.hidden) return;
    // Thirty frames keeps the dense cloud calm on integrated GPUs.
    if (now - state.last >= 33) {
      state.phase += Math.min(now - state.last, 66) * 0.00019;
      state.scroll += (state.targetScroll - state.scroll) * .14;
      state.last = now;
      drawFrame();
    }
    queue();
  }

  function setMotion(on, explicit) {
    state.active = Boolean(on);
    document.body.classList.toggle('motion-paused', !state.active);
    state.last = performance.now();
    if (explicit) state.userChoice = true;
    cancel();
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(state.active));
      toggle.setAttribute('aria-label', state.active ? 'Pause background motion' : 'Resume background motion');
      toggle.title = state.active ? 'Pause background motion' : 'Resume background motion';
      toggle.textContent = `Motion: ${state.active ? 'On' : 'Off'}`;
    }
    if (state.active) { syncScroll(); queue(); }
    else drawFrame();
  }

  if (toggle) toggle.addEventListener('click', () => setMotion(!state.active, true));
  function syncScroll(hard) {
    const next = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.15)));
    state.targetScroll = next;
    if (hard === true) {
      state.scroll = next;
      drawFrame();
    }
  }
  window.addEventListener('scroll', syncScroll, { passive: true });
  window.addEventListener('pageshow', () => syncScroll(true));
  window.addEventListener('resize', syncScroll, { passive: true });

  if (reduced) {
    const onPreferenceChange = event => {
      if (!state.userChoice) setMotion(!event.matches, false);
    };
    if (reduced.addEventListener) reduced.addEventListener('change', onPreferenceChange);
    else if (reduced.addListener) reduced.addListener(onPreferenceChange);
  }

  window.addEventListener('scope:change', event => {
    if (!event.detail || typeof event.detail.balanced !== 'boolean') return;
    state.balanced = event.detail.balanced;
    drawFrame();
  });

  if (finePointer && finePointer.matches && field) {
    window.addEventListener('pointermove', event => {
      const box = canvas.getBoundingClientRect();
      state.pointerX = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
      state.pointerY = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { state.pointerX = 0; state.pointerY = 0; }, { passive: true });
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const observerTarget = field || canvas;
  const observer = new IntersectionObserver(entries => {
    state.visible = entries[0] && entries[0].isIntersecting;
    if (state.visible) { state.last = performance.now(); queue(); }
    else cancel();
  }, { threshold: 0.05 });
  observer.observe(observerTarget);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
    else { state.last = performance.now(); queue(); }
  });

  syncScroll(true);
  resize();
  setMotion(state.active, false);
})();
