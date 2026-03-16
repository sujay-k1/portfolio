(function () {
  const railWrap = document.getElementById('demo-rail-wrap');
  const logNode = document.getElementById('demo-log');
  if (!railWrap || !logNode) {
    return;
  }

  const hud = {
    deltaX: document.getElementById('hud-delta-x'),
    deltaY: document.getElementById('hud-delta-y'),
    primary: document.getElementById('hud-primary'),
    axis: document.getElementById('hud-axis'),
    snapIndex: document.getElementById('hud-snap-index'),
    accumulator: document.getElementById('hud-accumulator'),
    animating: document.getElementById('hud-animating'),
    scrollLeft: document.getElementById('hud-scroll-left'),
    maxScroll: document.getElementById('hud-max-scroll'),
    edge: document.getElementById('hud-edge'),
    events: document.getElementById('hud-events')
  };

  const state = {
    eventCount: 0,
    logLines: [],
    snapIndex: 0,
    accumulator: 0,
    direction: 0,
    snapPoints: [],
    animating: false,
    tweenRaf: 0
  };
  const SNAP_THRESHOLD = 40;
  const SNAP_DURATION_MS = 800;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getEdgeState() {
    const maxScroll = Math.max(0, railWrap.scrollWidth - railWrap.clientWidth);
    if (maxScroll <= 0) {
      return 'locked';
    }
    if (railWrap.scrollLeft <= 1) {
      return 'left';
    }
    if (railWrap.scrollLeft >= maxScroll - 1) {
      return 'right';
    }
    return 'middle';
  }

  function refreshHud(deltaX = 0, deltaY = 0, primary = 0, axis = 'none') {
    const maxScroll = Math.max(0, railWrap.scrollWidth - railWrap.clientWidth);
    if (hud.deltaX) hud.deltaX.textContent = deltaX.toFixed(2);
    if (hud.deltaY) hud.deltaY.textContent = deltaY.toFixed(2);
    if (hud.primary) hud.primary.textContent = primary.toFixed(2);
    if (hud.axis) hud.axis.textContent = axis;
    if (hud.snapIndex) hud.snapIndex.textContent = String(state.snapIndex);
    if (hud.accumulator) hud.accumulator.textContent = state.accumulator.toFixed(2);
    if (hud.animating) hud.animating.textContent = state.animating ? 'yes' : 'no';
    if (hud.scrollLeft) hud.scrollLeft.textContent = Math.round(railWrap.scrollLeft).toString();
    if (hud.maxScroll) hud.maxScroll.textContent = Math.round(maxScroll).toString();
    if (hud.edge) hud.edge.textContent = getEdgeState();
    if (hud.events) hud.events.textContent = state.eventCount.toString();
  }

  function pushLog(line) {
    state.logLines.push(line);
    while (state.logLines.length > 18) {
      state.logLines.shift();
    }
    logNode.textContent = state.logLines.join('\n');
  }

  function evaluateCubicBezier(t, x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sampleCurveX = (v) => ((ax * v + bx) * v + cx) * v;
    const sampleCurveY = (v) => ((ay * v + by) * v + cy) * v;
    const sampleCurveDerivativeX = (v) => (3 * ax * v + 2 * bx) * v + cx;
    let u = t;
    for (let i = 0; i < 6; i += 1) {
      const x = sampleCurveX(u) - t;
      const dx = sampleCurveDerivativeX(u);
      if (Math.abs(x) < 0.00001 || Math.abs(dx) < 0.00001) {
        break;
      }
      u -= x / dx;
    }
    u = clamp(u, 0, 1);
    return sampleCurveY(u);
  }

  function refreshSnapPoints() {
    const cards = Array.from(railWrap.querySelectorAll('.demo-card'));
    const firstOffset = cards[0]?.offsetLeft ?? 0;
    const maxScroll = Math.max(0, railWrap.scrollWidth - railWrap.clientWidth);
    state.snapPoints = cards.map((card) => clamp(card.offsetLeft - firstOffset, 0, maxScroll));
  }

  function settleSnapState() {
    state.accumulator = 0;
    state.direction = 0;
  }

  function goToSnap(index) {
    if (!state.snapPoints.length) {
      return;
    }
    const clampedIndex = clamp(index, 0, state.snapPoints.length - 1);
    const startX = railWrap.scrollLeft;
    const targetX = state.snapPoints[clampedIndex];
    state.snapIndex = clampedIndex;
    if (state.tweenRaf) {
      cancelAnimationFrame(state.tweenRaf);
      state.tweenRaf = 0;
    }
    if (Math.abs(targetX - startX) < 0.5) {
      railWrap.scrollLeft = targetX;
      state.animating = false;
      settleSnapState();
      refreshHud();
      return;
    }
    state.animating = true;
    const startTime = performance.now();
    const tick = (now) => {
      const rawT = clamp((now - startTime) / SNAP_DURATION_MS, 0, 1);
      const eased = evaluateCubicBezier(rawT, 0.74, 0.25, 0.63, 0.97);
      railWrap.scrollLeft = startX + (targetX - startX) * eased;
      refreshHud();
      if (rawT < 1) {
        state.tweenRaf = requestAnimationFrame(tick);
        return;
      }
      railWrap.scrollLeft = targetX;
      state.animating = false;
      state.tweenRaf = 0;
      settleSnapState();
      refreshHud();
    };
    state.tweenRaf = requestAnimationFrame(tick);
  }

  function handleWheel(event) {
    event.preventDefault();
    state.eventCount += 1;
    const dominantAxis = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? 'x' : 'y';
    const primary = event.deltaX;
    const direction = primary > 0 ? 1 : primary < 0 ? -1 : 0;
    if (state.animating || !direction) {
      refreshHud(event.deltaX, event.deltaY, primary, dominantAxis);
      pushLog(
        [
          `${state.eventCount}.`,
          `dx=${event.deltaX.toFixed(2)}`,
          `dy=${event.deltaY.toFixed(2)}`,
          `primary=${primary.toFixed(2)}`,
          `axis=${dominantAxis}`,
          `ignored=${state.animating ? 'animating' : 'zero'}`
        ].join(' ')
      );
      return;
    }
    if (state.direction !== direction) {
      state.accumulator = 0;
    }
    state.direction = direction;
    state.accumulator += primary;

    if (Math.abs(state.accumulator) >= SNAP_THRESHOLD) {
      goToSnap(state.snapIndex + direction);
    }

    refreshHud(event.deltaX, event.deltaY, primary, dominantAxis);
    pushLog(
      [
        `${state.eventCount}.`,
        `dx=${event.deltaX.toFixed(2)}`,
        `dy=${event.deltaY.toFixed(2)}`,
        `primary=${primary.toFixed(2)}`,
        `axis=${dominantAxis}`,
        `snap=${state.snapIndex}`,
        `acc=${state.accumulator.toFixed(2)}`,
        `left=${Math.round(railWrap.scrollLeft)}`,
        `edge=${getEdgeState()}`
      ].join(' ')
    );
  }

  railWrap.addEventListener('wheel', handleWheel, { passive: false });
  railWrap.addEventListener('scroll', () => {
    refreshHud();
  }, { passive: true });

  refreshSnapPoints();
  goToSnap(0);
  refreshHud();
  pushLog('Horizontal-wheel-only snap demo ready.');
})();
