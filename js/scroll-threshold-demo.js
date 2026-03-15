const SECTION_COUNT = 15;
const WHEEL_SNAP_THRESHOLD = 30;
const WHEEL_COOLDOWN_MS = 40;
const SNAP_DURATION = 0.4;
const GRAPH_HORIZON_MS = 3000;
const GRAPH_SAMPLE_MS = 10;

const track = document.getElementById('demo-track');
const graphCanvas = document.getElementById('demo-graph');
const graphCtx = graphCanvas.getContext('2d');
const graphTooltip = document.getElementById('demo-graph-tooltip');
const sampleButtons = Array.from(document.querySelectorAll('[data-sample-ms]'));
const modeButtons = Array.from(document.querySelectorAll('[data-plot-mode]'));

const hud = {
  section: document.getElementById('hud-section'),
  deltaX: document.getElementById('hud-delta-x'),
  deltaY: document.getElementById('hud-delta-y'),
  accumulator: document.getElementById('hud-accumulator'),
  direction: document.getElementById('hud-direction'),
  heuristic: document.getElementById('hud-heuristic'),
  sampling: document.getElementById('hud-sampling'),
  mode: document.getElementById('hud-mode'),
  animating: document.getElementById('hud-animating'),
  cooldown: document.getElementById('hud-cooldown')
};

const state = {
  index: 0,
  y: 0,
  isAnimating: false,
  accumulator: 0,
  lastDirection: 0,
  requireFreshAfterSnap: false,
  wheelCooldownUntil: 0,
  lastDeltaX: 0,
  lastDeltaY: 0,
  lastWheelAt: 0,
  zeroSinceAt: 0,
  touchStartY: 0,
  rawEvents: [],
  graphSamples: [],
  renderedPoints: [],
  motionMarkers: [],
  heuristic: 'idle',
  heuristicMarkers: []
};

const palette = [
  ['#1f1627', '#30263a'],
  ['#18141f', '#2d2639'],
  ['#15101a', '#2a2433'],
  ['#1c1621', '#32293c'],
  ['#17131d', '#2b2534']
];

let snapTweenRaf = 0;
let graphSampleInterval = 0;
let graphStartAt = performance.now();
let graphSampleMs = GRAPH_SAMPLE_MS;
let plotMode = 'absolute';

function buildSections() {
  track.innerHTML = Array.from({ length: SECTION_COUNT }, (_, index) => {
    const [top, bottom] = palette[index % palette.length];
    return `
      <section class="demo-section" style="transform: translateY(${index * 100}%);">
        <div class="demo-section-shell" style="background:
          linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%),
          linear-gradient(135deg, ${top} 0%, ${bottom} 100%);">
          <div class="demo-eyebrow">Scroll Demo</div>
          <div class="demo-number">${String(index + 1).padStart(2, '0')}</div>
          <div class="demo-title">Index-like section snapping</div>
          <div class="demo-copy">
            This sandbox uses the same threshold, cooldown, and snap duration model as the main page.
            The HUD and graph show raw wheel deltaX and deltaY only.
          </div>
        </div>
      </section>
    `;
  }).join('');
}

function resizeGraph() {
  const rect = graphCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  graphCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  graphCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  graphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawGraph();
}

function sampleGraph() {
  const now = performance.now();
  if (Math.abs(state.lastDeltaX) <= 1 && Math.abs(state.lastDeltaY) <= 1) {
    if (!state.zeroSinceAt) {
      state.zeroSinceAt = now;
    }
    if (now - state.zeroSinceAt > 500) {
      return;
    }
  } else {
    state.zeroSinceAt = 0;
  }
  const t = now - graphStartAt;
  const getAverage = (key) => {
    const startAt = now - graphSampleMs;
    let total = 0;
    let count = 0;
    for (let i = state.rawEvents.length - 1; i >= 0; i -= 1) {
      const event = state.rawEvents[i];
      if (event.t < startAt) {
        break;
      }
      total += event[key];
      count += 1;
    }
    return count ? total / count : 0;
  };
  const deltaX = plotMode === 'average' ? getAverage('deltaX') : state.lastDeltaX;
  const deltaY = plotMode === 'average' ? getAverage('deltaY') : state.lastDeltaY;
  state.graphSamples.push({
    t,
    deltaX,
    deltaY
  });
  while (state.graphSamples.length && t - state.graphSamples[0].t > GRAPH_HORIZON_MS) {
    state.graphSamples.shift();
  }
  const sampleCount = state.graphSamples.length;
  const currentSample = state.graphSamples[sampleCount - 1];
  const previousSample = sampleCount > 1 ? state.graphSamples[sampleCount - 2] : null;
  let nextHeuristic = 'existing';
  const currentAbsY = Math.abs(currentSample.deltaY);
  const previousAbsY = previousSample ? Math.abs(previousSample.deltaY) : 0;
  if (currentAbsY <= 1) {
    nextHeuristic = 'idle';
  } else if (previousSample && currentAbsY > previousAbsY) {
    nextHeuristic = 'fresh';
  }
  if (nextHeuristic !== state.heuristic) {
    state.heuristic = nextHeuristic;
    state.heuristicMarkers.push({ t, heuristic: nextHeuristic });
  }
  while (state.heuristicMarkers.length && t - state.heuristicMarkers[0].t > GRAPH_HORIZON_MS) {
    state.heuristicMarkers.shift();
  }
  drawGraph();
}

function getWindowDeltaY(now) {
  if (plotMode === 'average') {
    const startAt = now - graphSampleMs;
    let total = 0;
    let count = 0;
    for (let i = state.rawEvents.length - 1; i >= 0; i -= 1) {
      const event = state.rawEvents[i];
      if (event.t < startAt) {
        break;
      }
      total += event.deltaY;
      count += 1;
    }
    return count ? total / count : 0;
  }

  for (let i = state.graphSamples.length - 1; i >= 0; i -= 1) {
    const sample = state.graphSamples[i];
    if (now - graphStartAt - sample.t >= graphSampleMs) {
      return sample.deltaY;
    }
  }
  return state.lastDeltaY;
}

function restartGraphSampling() {
  if (graphSampleInterval) {
    clearInterval(graphSampleInterval);
  }
  graphSampleInterval = window.setInterval(sampleGraph, graphSampleMs);
  if (hud.sampling) {
    hud.sampling.textContent = `${graphSampleMs}ms`;
  }
  sampleButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.sampleMs) === graphSampleMs);
  });
  modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.plotMode === plotMode);
  });
}

function drawGraph() {
  const rect = graphCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) {
    return;
  }

  graphCtx.clearRect(0, 0, width, height);
  graphCtx.fillStyle = 'rgba(255,255,255,0.02)';
  graphCtx.fillRect(0, 0, width, height);

  graphCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  graphCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = (height / 4) * i;
    graphCtx.beginPath();
    graphCtx.moveTo(0, y);
    graphCtx.lineTo(width, y);
    graphCtx.stroke();
  }

  const latestT = state.graphSamples.length ? state.graphSamples[state.graphSamples.length - 1].t : GRAPH_HORIZON_MS;
  const minT = Math.max(0, latestT - GRAPH_HORIZON_MS);
  const visibleSamples = state.graphSamples.filter((sample) => sample.t >= minT);
  const maxAbs = Math.max(
    1,
    ...visibleSamples.map((sample) => Math.max(Math.abs(sample.deltaX), Math.abs(sample.deltaY)))
  );
  const centerY = height * 0.5;
  const scaleY = (height * 0.42) / maxAbs;

  graphCtx.strokeStyle = 'rgba(255,255,255,0.18)';
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  graphCtx.moveTo(0, centerY);
  graphCtx.lineTo(width, centerY);
  graphCtx.stroke();

  const drawLine = (key, color) => {
    graphCtx.strokeStyle = color;
    graphCtx.lineWidth = 1.6;
    graphCtx.beginPath();
    visibleSamples.forEach((sample, index) => {
      const x = ((sample.t - minT) / GRAPH_HORIZON_MS) * width;
      const y = centerY - sample[key] * scaleY;
      if (index === 0) {
        graphCtx.moveTo(x, y);
      } else {
        graphCtx.lineTo(x, y);
      }
    });
    graphCtx.stroke();
  };

  const drawDeltaYLine = () => {
    if (visibleSamples.length < 2) {
      drawLine('deltaY', '#edf6b1');
      return;
    }
    graphCtx.lineWidth = 1.6;
    for (let i = 1; i < visibleSamples.length; i += 1) {
      const prev = visibleSamples[i - 1];
      const current = visibleSamples[i];
      const x1 = ((prev.t - minT) / GRAPH_HORIZON_MS) * width;
      const y1 = centerY - prev.deltaY * scaleY;
      const x2 = ((current.t - minT) / GRAPH_HORIZON_MS) * width;
      const y2 = centerY - current.deltaY * scaleY;
      graphCtx.strokeStyle = current.deltaY > prev.deltaY ? '#56ff8a' : '#edf6b1';
      graphCtx.beginPath();
      graphCtx.moveTo(x1, y1);
      graphCtx.lineTo(x2, y2);
      graphCtx.stroke();
    }
  };

  const drawNegativeAbsoluteYLine = () => {
    if (visibleSamples.length < 2) {
      return;
    }
    graphCtx.lineWidth = 1.2;
    for (let i = 1; i < visibleSamples.length; i += 1) {
      const prev = visibleSamples[i - 1];
      const current = visibleSamples[i];
      if (prev.deltaY >= 0 || current.deltaY >= 0) {
        continue;
      }
      const x1 = ((prev.t - minT) / GRAPH_HORIZON_MS) * width;
      const y1 = centerY - Math.abs(prev.deltaY) * scaleY;
      const x2 = ((current.t - minT) / GRAPH_HORIZON_MS) * width;
      const y2 = centerY - Math.abs(current.deltaY) * scaleY;
      graphCtx.strokeStyle =
        Math.abs(current.deltaY) > Math.abs(prev.deltaY) ? '#0f6b43' : '#ff9c43';
      graphCtx.beginPath();
      graphCtx.moveTo(x1, y1);
      graphCtx.lineTo(x2, y2);
      graphCtx.stroke();
    }
  };

  drawLine('deltaX', '#56a6ff');
  drawDeltaYLine();
  drawNegativeAbsoluteYLine();

  state.heuristicMarkers
    .filter((marker) => marker.t >= minT)
    .forEach((marker) => {
      const x = ((marker.t - minT) / GRAPH_HORIZON_MS) * width;
      const y = 10;
      graphCtx.fillStyle =
        marker.heuristic === 'fresh' ? '#9b6bff' : marker.heuristic === 'existing' ? '#ff78d2' : '#ff9c43';
      graphCtx.beginPath();
      graphCtx.arc(x, y, 4, 0, Math.PI * 2);
      graphCtx.fill();
    });

  state.motionMarkers
    .filter((marker) => marker.t >= minT)
    .forEach((marker) => {
      const x = ((marker.t - minT) / GRAPH_HORIZON_MS) * width;
      graphCtx.strokeStyle = marker.type === 'start' ? 'rgba(255, 92, 92, 0.95)' : 'rgba(255, 120, 210, 0.95)';
      graphCtx.lineWidth = 1;
      graphCtx.beginPath();
      graphCtx.moveTo(x, 0);
      graphCtx.lineTo(x, height);
      graphCtx.stroke();
    });

  state.renderedPoints = [];
  visibleSamples.forEach((sample) => {
    const x = ((sample.t - minT) / GRAPH_HORIZON_MS) * width;
    const yX = centerY - sample.deltaX * scaleY;
    const yY = centerY - sample.deltaY * scaleY;
    graphCtx.fillStyle = '#56a6ff';
    graphCtx.beginPath();
    graphCtx.arc(x, yX, 2.2, 0, Math.PI * 2);
    graphCtx.fill();
    if (sample.deltaY >= 0) {
      graphCtx.fillStyle = '#edf6b1';
      graphCtx.beginPath();
      graphCtx.arc(x, yY, 2.2, 0, Math.PI * 2);
      graphCtx.fill();
    }
    state.renderedPoints.push({ x, y: yX, axis: 'X', sample });
    if (sample.deltaY >= 0) {
      state.renderedPoints.push({ x, y: yY, axis: 'Y', sample });
    }
  });
}

function hideTooltip() {
  graphTooltip.classList.remove('is-visible');
}

function showTooltip(point) {
  const rect = graphCanvas.getBoundingClientRect();
  const shellRect = graphCanvas.closest('.demo-graph-shell').getBoundingClientRect();
  const signedValue = point.axis === 'X' ? point.sample.deltaX : point.sample.deltaY;
  graphTooltip.textContent =
    `axis ${point.axis}\nmode ${plotMode}\nplotted ${Math.abs(signedValue).toFixed(2)}\nsigned ${signedValue.toFixed(2)}\ndeltaX ${point.sample.deltaX.toFixed(2)}\ndeltaY ${point.sample.deltaY.toFixed(2)}\ntime ${(point.sample.t / 1000).toFixed(2)}s`;
  graphTooltip.classList.add('is-visible');

  const rawLeft = (rect.left - shellRect.left) + point.x;
  const rawTop = (rect.top - shellRect.top) + point.y;
  const tipRect = graphTooltip.getBoundingClientRect();
  const halfWidth = tipRect.width * 0.5;
  const minLeft = halfWidth + 8;
  const maxLeft = shellRect.width - halfWidth - 8;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));
  const minTop = tipRect.height + 16;
  const maxTop = shellRect.height - 8;
  const clampedTop = Math.max(minTop, Math.min(maxTop, rawTop));

  graphTooltip.style.left = `${clampedLeft}px`;
  graphTooltip.style.top = `${clampedTop}px`;
}

function handleGraphHover(event) {
  const rect = graphCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let closest = null;
  let closestDistance = 10;

  state.renderedPoints.forEach((point) => {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = point;
    }
  });

  if (!closest) {
    hideTooltip();
    return;
  }
  showTooltip(closest);
}

function updateHud() {
  const now = performance.now();
  hud.section.textContent = `${state.index + 1} / ${SECTION_COUNT}`;
  hud.deltaX.textContent = state.lastDeltaX.toFixed(2);
  hud.deltaY.textContent = state.lastDeltaY.toFixed(2);
  hud.accumulator.textContent = state.accumulator.toFixed(2);
  hud.direction.textContent = state.lastDirection > 0 ? 'down' : state.lastDirection < 0 ? 'up' : 'none';
  hud.heuristic.textContent = state.heuristic;
  hud.sampling.textContent = `${graphSampleMs}ms`;
  hud.mode.textContent = plotMode;
  hud.animating.textContent = state.isAnimating ? 'yes' : 'no';
  hud.cooldown.textContent = state.requireFreshAfterSnap ? 'fresh' : now < state.wheelCooldownUntil ? 'on' : 'off';
}

function easePower2InOut(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 2 * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
}

function snapTo(index) {
  const nextIndex = Math.max(0, Math.min(SECTION_COUNT - 1, index));
  if (nextIndex === state.index && !state.isAnimating) {
    return;
  }
  const now = performance.now();
  state.motionMarkers.push({ t: now - graphStartAt, type: 'start' });
  while (state.motionMarkers.length && (now - graphStartAt) - state.motionMarkers[0].t > GRAPH_HORIZON_MS) {
    state.motionMarkers.shift();
  }
  state.index = nextIndex;
  state.isAnimating = true;
  if (snapTweenRaf) {
    cancelAnimationFrame(snapTweenRaf);
  }
  const fromY = state.y;
  const toY = -window.innerHeight * nextIndex;
  const startedAt = performance.now();

  const tick = (now) => {
    const t = Math.min(1, (now - startedAt) / (SNAP_DURATION * 1000));
    const eased = easePower2InOut(t);
    state.y = fromY + (toY - fromY) * eased;
    track.style.transform = `translateY(${state.y}px)`;
    updateHud();
    if (t < 1) {
      snapTweenRaf = requestAnimationFrame(tick);
      return;
    }
    snapTweenRaf = 0;
    state.isAnimating = false;
    state.y = toY;
    track.style.transform = `translateY(${state.y}px)`;
    state.requireFreshAfterSnap = true;
    state.accumulator = 0;
    state.lastDirection = 0;
    const doneAt = performance.now();
    state.motionMarkers.push({ t: doneAt - graphStartAt, type: 'end' });
    while (state.motionMarkers.length && (doneAt - graphStartAt) - state.motionMarkers[0].t > GRAPH_HORIZON_MS) {
      state.motionMarkers.shift();
    }
    updateHud();
  };

  snapTweenRaf = requestAnimationFrame(tick);
}

function handleWheel(deltaX, deltaY) {
  const now = performance.now();
  state.lastDeltaX = deltaX;
  state.lastDeltaY = deltaY;
  state.rawEvents.push({ t: now, deltaX, deltaY });
  while (state.rawEvents.length && now - state.rawEvents[0].t > GRAPH_HORIZON_MS + graphSampleMs) {
    state.rawEvents.shift();
  }
  state.zeroSinceAt =
    Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1 ? state.zeroSinceAt || now : 0;
  if (state.isAnimating || now < state.wheelCooldownUntil) {
    updateHud();
    return;
  }

  const direction = deltaY === 0 ? 0 : deltaY > 0 ? 1 : -1;
  if (!direction) {
    updateHud();
    return;
  }

  const comparisonDeltaY = getWindowDeltaY(now);
  const currentAbsY = Math.abs(deltaY);
  const comparisonAbsY = Math.abs(comparisonDeltaY);
  const nextHeuristic =
    currentAbsY <= 1 ? 'idle' : currentAbsY > comparisonAbsY ? 'fresh' : 'existing';
  if (state.requireFreshAfterSnap) {
    state.heuristic = nextHeuristic;
    if (nextHeuristic !== 'fresh') {
      updateHud();
      return;
    }
    state.requireFreshAfterSnap = false;
  }

  if (state.lastDirection !== direction) {
    state.accumulator = 0;
  }
  state.lastDirection = direction;
  state.accumulator += deltaY;
  updateHud();

  if (Math.abs(state.accumulator) < WHEEL_SNAP_THRESHOLD) {
    return;
  }

  state.accumulator = 0;
  state.wheelCooldownUntil = now + WHEEL_COOLDOWN_MS;
  snapTo(state.index + direction);
}

function bindEvents() {
  sampleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMs = Number(button.dataset.sampleMs);
      if (!nextMs || nextMs === graphSampleMs) {
        return;
      }
      graphSampleMs = nextMs;
      restartGraphSampling();
      updateHud();
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.plotMode;
      if (!nextMode || nextMode === plotMode) {
        return;
      }
      plotMode = nextMode;
      restartGraphSampling();
      updateHud();
      drawGraph();
    });
  });

  graphCanvas.addEventListener('mousemove', handleGraphHover);
  graphCanvas.addEventListener('mouseleave', hideTooltip);

  window.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      handleWheel(event.deltaX, event.deltaY);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      handleWheel(0, WHEEL_SNAP_THRESHOLD);
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      handleWheel(0, -WHEEL_SNAP_THRESHOLD);
    }
  });

  window.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length) {
        state.touchStartY = event.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  window.addEventListener(
    'touchend',
    (event) => {
      if (!event.changedTouches.length) {
        return;
      }
      const dy = state.touchStartY - event.changedTouches[0].clientY;
      if (Math.abs(dy) < 28) {
        return;
      }
      handleWheel(0, dy);
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    state.y = -window.innerHeight * state.index;
    track.style.transform = `translateY(${state.y}px)`;
    resizeGraph();
    updateHud();
  });
}

buildSections();
track.style.transform = 'translateY(0px)';
resizeGraph();
updateHud();
restartGraphSampling();
bindEvents();
