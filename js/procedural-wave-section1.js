const SCRIPT_CACHE = {};

function loadExternalScriptOnce(src) {
  if (SCRIPT_CACHE[src]) {
    return SCRIPT_CACHE[src];
  }
  SCRIPT_CACHE[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'yes') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed loading ${src}`)), { once: true });
      }
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'yes';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed loading ${src}`));
    document.head.appendChild(script);
  });
  return SCRIPT_CACHE[src];
}

async function ensurePixiCdnReady() {
  await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js');
  await loadExternalScriptOnce('https://cdn.jsdelivr.net/npm/pixi-filters@latest/dist/browser/pixi-filters.min.js');
  const PIXI = window.PIXI;
  const ZoomBlurFilter =
    (PIXI && PIXI.filters && PIXI.filters.ZoomBlurFilter) ||
    (window.pixiFilters && window.pixiFilters.ZoomBlurFilter) ||
    null;
  if (!PIXI || !ZoomBlurFilter) {
    throw new Error('PIXI or ZoomBlurFilter unavailable from CDN');
  }
  return { PIXI, ZoomBlurFilter };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function fract(x) { return x - Math.floor(x); }
function easeInOut(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }
function smoothstep01(t) { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); }
function normalize(v) { const len = Math.hypot(v.x, v.y) || 1; return { x: v.x / len, y: v.y / len }; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function noise1D(x) {
  const i = Math.floor(x);
  const f = fract(x);
  const u = f * f * (3 - 2 * f);
  const a = fract(Math.sin(i) * 43758.5453123);
  const b = fract(Math.sin(i + 1) * 43758.5453123);
  return a * (1 - u) + b * u;
}

function fbm(x) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = x;
  for (let i = 0; i < 5; i += 1) {
    value += amplitude * noise1D(frequency);
    frequency = frequency * 2.03 + 13.1;
    amplitude *= 0.5;
  }
  return value;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function blendColorInt(aHex, bHex, t) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return (r << 16) | (g << 8) | bl;
}

function circleArcFrame(u, params) {
  const span = Math.max(0.001, params.arcSpan * Math.PI * 2);
  const start = params.arcRotation - span * 0.5;
  const theta = start + span * u;
  const point = {
    x: params.arcX + params.arcRadius * Math.cos(theta),
    y: params.arcY + params.arcRadius * Math.sin(theta)
  };
  const tangent = normalize({ x: -Math.sin(theta), y: Math.cos(theta) });
  const normal = normalize({ x: Math.cos(theta), y: Math.sin(theta) });
  return { point, tangent, normal };
}

function carrierWaveValue(u, curveAmount, curveFrequency, carrierPhase, seed) {
  const s = lerp(-1.8, 1.8, u) + carrierPhase;
  const curve1 = Math.sin(s * curveFrequency + seed * 0.37) * curveAmount;
  const curve2 = Math.sin(s * (curveFrequency * 0.53) + 1.7 + seed * 1.91) * curveAmount * 0.65;
  const curve3 = (fbm(s * 0.42 + seed * 2.7) - 0.5) * curveAmount * 1.1;
  return curve1 + curve2 + curve3;
}

function amplitudeField(s, baseAmplitude, ampVariation, seed) {
  const n1 = fbm(s * 0.65 + 2.7 + seed * 3.1) * 2 - 1;
  const n2 = fbm(s * 1.37 + 8.1 + seed * 1.7) * 2 - 1;
  const n3 = noise1D(s * 3.4 + 1.2 + seed * 2.3) * 2 - 1;
  const centered = Math.max(-1, Math.min(1, n1 * 0.45 + n2 * 0.35 + n3 * 0.2));
  return baseAmplitude * Math.max(0.05, 1 + centered * ampVariation);
}

function wavelengthField(s, baseWavelength, wavelengthVariation, seed) {
  const n1 = fbm(s * 0.42 + seed * 2.3) * 2 - 1;
  const n2 = noise1D(s * 1.15 + seed * 0.9) * 2 - 1;
  const centered = Math.max(-1, Math.min(1, n1 * 0.65 + n2 * 0.35));
  return Math.max(0.05, baseWavelength * (1 + centered * wavelengthVariation * 0.35));
}

function estimateInfluenceAtPoint(point, mouse, interaction) {
  if (!interaction.enabled || !mouse.inside) {
    return 0;
  }
  const x = mouse.projectX(point.x);
  const y = mouse.projectY(point.y);
  const dx = x - mouse.x;
  const dy = y - mouse.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const inner = interaction.radius * (1 - interaction.softness);
  const outer = interaction.radius;
  if (distance <= inner) {
    return 1;
  }
  if (distance >= outer) {
    return 0;
  }
  return 1 - smoothstep01((distance - inner) / Math.max(0.0001, outer - inner));
}

function baselinePoint(u, params, seed, mouse = null, interaction = null) {
  const frame = circleArcFrame(u, params);
  const influence = mouse && interaction ? estimateInfluenceAtPoint(frame.point, mouse, interaction) : 0;
  const curveAmount = params.curveAmount * (1 - influence);
  const offset = carrierWaveValue(u, curveAmount, params.curveFrequency, params.carrierPhase, seed);
  return {
    x: frame.point.x + frame.normal.x * offset,
    y: frame.point.y + frame.normal.y * offset,
    carrierSimplification: influence
  };
}

function buildWaveSamples(sampleCount, travelOffset, params, seed, mouse = null, interaction = null) {
  const samples = [];
  const xMin = -1.8;
  const xMax = 1.8;
  let phaseAccum = 0;
  let prevWorldCoord = null;
  for (let i = 0; i < sampleCount; i += 1) {
    const u = i / Math.max(1, sampleCount - 1);
    const worldCoord = lerp(xMin, xMax, u);
    const frame = circleArcFrame(u, params);
    const influence = mouse && interaction ? estimateInfluenceAtPoint(frame.point, mouse, interaction) : 0;
    const curveAmount = params.curveAmount * (1 - influence);
    const carrierOffset = carrierWaveValue(u, curveAmount, params.curveFrequency, params.carrierPhase, seed);
    const basePoint = {
      x: frame.point.x + frame.normal.x * carrierOffset,
      y: frame.point.y + frame.normal.y * carrierOffset
    };
    const amp = amplitudeField(worldCoord, params.baseAmplitude, params.ampVariation, seed);
    const localWavelength = wavelengthField(worldCoord, params.baseWavelength, params.wavelengthVariation, seed);
    if (prevWorldCoord != null) {
      phaseAccum += (Math.PI * 2 * (worldCoord - prevWorldCoord)) / Math.max(0.05, localWavelength);
    }
    prevWorldCoord = worldCoord;
    const travelPhase = (-Math.PI * 2 * travelOffset) / Math.max(0.05, params.baseWavelength);
    const phaseJitter = (fbm(worldCoord * 0.7 + seed * 1.9) * 2 - 1) * 0.08;
    const phase = phaseAccum + travelPhase + phaseJitter;
    const osc = Math.sin(phase);
    samples.push({
      u,
      phase,
      osc,
      amp,
      basePoint,
      normal: frame.normal,
      travelCoord: worldCoord - travelOffset,
      carrierSimplification: influence,
      point: {
        x: basePoint.x + frame.normal.x * osc * amp,
        y: basePoint.y + frame.normal.y * osc * amp
      }
    });
  }
  return samples;
}

function waveInteractiveFromRaw(raw, params, shared, mouse, interaction) {
  if (!interaction.enabled || !mouse.inside) {
    return { ...raw, influence: 0 };
  }
  const sampleX = mouse.projectX(raw.point.x);
  const sampleY = mouse.projectY(raw.point.y);
  const dx = sampleX - mouse.x;
  const dy = sampleY - mouse.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const inner = interaction.radius * (1 - interaction.softness);
  const outer = interaction.radius;
  let influence = 0;
  if (distance <= inner) {
    influence = 1;
  } else if (distance < outer) {
    influence = 1 - smoothstep01((distance - inner) / Math.max(0.0001, outer - inner));
  }
  if (influence <= 0.0001) {
    return { ...raw, influence: 0 };
  }
  const targetAmp = lerp(raw.amp, shared.amplitude, influence * interaction.amplitudeStrength);
  const uniformPhase = (Math.PI * 2 * raw.travelCoord) / params.baseWavelength;
  const sharedPhase = (Math.PI * 2 * raw.travelCoord) / shared.wavelength;
  const localOsc = lerp(raw.osc, Math.sin(uniformPhase), influence * interaction.wavelengthStrength);
  const osc = Math.max(
    -1,
    Math.min(1, lerp(localOsc, Math.sin(sharedPhase), influence * interaction.wavelengthStrength))
  );
  return {
    ...raw,
    influence,
    osc,
    phase: Math.asin(osc),
    point: {
      x: raw.basePoint.x + raw.normal.x * osc * targetAmp,
      y: raw.basePoint.y + raw.normal.y * osc * targetAmp
    }
  };
}

function computeScreenSpaceAlignment(
  samplesA,
  samplesB,
  width,
  height,
  interactionRadius,
  originX = 0.5,
  originY = 0.5
) {
  const project = (p) => ({
    x: width * originX + p.x * width * 0.18,
    y: height * originY - p.y * height * 0.18
  });
  let weightedOscDiff = 0;
  let weightSum = 0;
  let pairs = 0;
  let avgDistance = 0;
  const maxDistance = Math.max(24, Math.min(interactionRadius * 0.35, 220));
  for (let i = 0; i < samplesA.length; i += 1) {
    const a = samplesA[i];
    if ((a.influence ?? 0) <= 0.0001) {
      continue;
    }
    const ap = project(a.point);
    let bestIndex = -1;
    let bestDist2 = Infinity;
    for (let j = 0; j < samplesB.length; j += 1) {
      const b = samplesB[j];
      if ((b.influence ?? 0) <= 0.0001) {
        continue;
      }
      const bp = project(b.point);
      const dx = bp.x - ap.x;
      const dy = bp.y - ap.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < bestDist2) {
        bestDist2 = dist2;
        bestIndex = j;
      }
    }
    if (bestIndex < 0) {
      continue;
    }
    const bestDist = Math.sqrt(bestDist2);
    if (bestDist > maxDistance) {
      continue;
    }
    const b = samplesB[bestIndex];
    const weight = Math.max(a.influence ?? 0, b.influence ?? 0) * (1 - bestDist / maxDistance);
    if (weight <= 0.0001) {
      continue;
    }
    weightedOscDiff += Math.abs(a.osc - b.osc) * weight;
    weightSum += weight;
    pairs += 1;
    avgDistance += bestDist;
  }
  const avgOscDiff = weightSum > 0 ? weightedOscDiff / weightSum : 2;
  return {
    alignment: 1 - Math.min(1, avgOscDiff / 2),
    pairs,
    avgDistance: pairs > 0 ? avgDistance / pairs : 0,
    maxDistance
  };
}

function signedNormalDisplacement(sample) {
  const dx = sample.point.x - sample.basePoint.x;
  const dy = sample.point.y - sample.basePoint.y;
  return dx * sample.normal.x + dy * sample.normal.y;
}

function findNearestCrestIndex(samples, screenPoints, mouse) {
  if (!mouse.inside || !samples || samples.length < 3) {
    return -1;
  }
  let bestIndex = -1;
  let bestDistSq = Infinity;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const prev = signedNormalDisplacement(samples[i - 1]);
    const curr = signedNormalDisplacement(samples[i]);
    const next = signedNormalDisplacement(samples[i + 1]);
    if (!(curr > prev && curr >= next && curr > 0)) {
      continue;
    }
    const dx = screenPoints[i].x - mouse.x;
    const dy = screenPoints[i].y - mouse.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function angleBetweenVectorsDeg(a, b) {
  const magA = Math.hypot(a.x, a.y);
  const magB = Math.hypot(b.x, b.y);
  if (magA <= 1e-6 || magB <= 1e-6) {
    return null;
  }
  const dot = (a.x * b.x + a.y * b.y) / (magA * magB);
  const clampedDot = clamp(dot, -1, 1);
  return Math.acos(clampedDot) * (180 / Math.PI);
}

function toLocalFocusMouse(mouse, offsetX, offsetY, scale) {
  if (!mouse.inside) {
    return mouse;
  }
  return {
    ...mouse,
    x: (mouse.x - offsetX) / Math.max(1e-6, scale),
    y: (mouse.y - offsetY) / Math.max(1e-6, scale)
  };
}

function tangentFromScreenPoints(points, index) {
  if (!points || points.length < 2 || index < 0 || index >= points.length) {
    return null;
  }
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude <= 1e-6) {
    return null;
  }
  return { x: dx / magnitude, y: dy / magnitude };
}

function pseudoProximityIndexFromInfluence(influence) {
  const x = clamp(influence, 0, 1) * 100;
  return 0.00000156428 * Math.pow(x, 3.9015);
}

function minDistanceToPolylinePoints(points, x, y) {
  if (!points || !points.length) {
    return Infinity;
  }
  let minDistSq = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) {
      minDistSq = distSq;
    }
  }
  return Math.sqrt(minDistSq);
}

function buildReducedPoints(points, stride) {
  if (stride <= 1 || points.length < 3) {
    return points;
  }
  const reduced = [points[0]];
  for (let i = stride; i < points.length - 1; i += stride) {
    reduced.push(points[i]);
  }
  reduced.push(points[points.length - 1]);
  return reduced;
}

function drawPolylinePixi(gfx, points, color, widthPx, alpha = 1) {
  if (!points || points.length < 2) {
    return;
  }
  gfx.lineStyle(widthPx, color, alpha, 0.5, true);
  gfx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    gfx.lineTo(points[i].x, points[i].y);
  }
}

/*
  Section 1 procedural wave defaults.
  These are the values to change later if you want the first-screen wave tuned
  without bringing back the demo sliders.
*/
const SECTION1_WAVE_CONFIG = {
  wave1: {
    baseAmplitude: 0.26,
    ampVariation: 0.25,
    baseWavelength: 1.14,
    wavelengthVariation: 2.2,
    curveAmount: 0.18,
    curveFrequency: 4.45,
    carrierPhase: 0,
    arcSpan: 0.18,
    arcRotation: -0.54,
    arcRadius: 6.66,
    arcX: -4.64,
    arcY: 2.68,
    speed: 0.65
  },
  wave2: {
    baseAmplitude: 0.22,
    ampVariation: 1.29,
    baseWavelength: 0.74,
    wavelengthVariation: 1.65,
    curveAmount: 0.15,
    curveFrequency: 5.15,
    carrierPhase: 1.58,
    arcSpan: 0.19,
    arcRotation: -0.52,
    arcRadius: 6.61,
    arcX: -4.1,
    arcY: 2.31,
    speed: 0.9
  },
  global: {
    blendSteps: 100,
    sampleCount: 220,
    lineWidth: 0.5,
    showEndpoints: true,
    interpolationEnabled: true,
    use2DInterpolate: false,
    showBaselines: true,
    showArcGuides: true,
    interactionEnabled: true,
    interactionRadius: 880,
    interactionSoftness: 0.88,
    amplitudeUniformity: 1,
    wavelengthUniformity: 1,
    sharedSpeedEnabled: true
  }
};

/*
  Render tuning for the section 1 wave.
  These correspond to the blur/focus controls from the standalone demo.
*/
const SECTION1_WAVE_TUNING = {
  blurStrength: 0.22,
  blurInnerRadius: 0,
  blurRadius: 984,
  blurCenterX: 0.526,
  blurCenterY: 0.447,
  focusSharpOffsetX: -113,
  focusSharpOffsetY: -53,
  focusSharpScale: 1.135,
  targetFps: 45,
  blurLineStride: 2,
  blurPointStride: 2,
  focusRevealRadiusPx: 140,
  focusRevealFeatherPx: 300,
  focusSharpMaskScale: 0.765,
  focusBlurCutoutMaskScale: 1.21,
  focusTriggerInfluence: 0.08,
  dynamicBlendNearPx: 24,
  dynamicBlendFarPx: 260,
  dynamicBlendMinSteps: 25,
  alignmentUpdateIntervalActive: 2,
  alignmentUpdateIntervalIdle: 3
};
const CREST_LOCK_MIN_ANGLE_DEG = 88;
const CREST_LOCK_MAX_ANGLE_DEG = 92;
const CREST_LOCK_STABLE_FRAMES = 6;
const SECTION1_WAVE_COLOR_A = '#ABA3B8';
const SECTION1_WAVE_COLOR_B = '#000000';
const SECTION1_WAVE_MOBILE_BLEND_STEPS = 25;
const SECTION1_WAVE_MOBILE_MIN_BLEND_STEPS = 10;
const SECTION1_WAVE_LAYOUT_PRESETS = [
  {
    media: '(max-width: 767px) and (orientation: portrait)',
    aspectRatio: 16 / 10,
    compositionOffsetX: -0.2,
    compositionOffsetY: 0,
    cropAlignX: 0.5,
    cropAlignY: 1
  },
  {
    media: null,
    aspectRatio: 16 / 9,
    compositionOffsetX: 0,
    compositionOffsetY: 0,
    cropAlignX: 0.5,
    cropAlignY: 1
  }
];

export async function initSectionOneProceduralWave({ host, pointerTarget, startPaused = false }) {
  if (!host || !pointerTarget || host.dataset.waveVizMounted === 'yes') {
    return null;
  }
  host.dataset.waveVizMounted = 'yes';

  const { PIXI, ZoomBlurFilter } = await ensurePixiCdnReady();
  const mouse = { x: 0, y: 0, inside: false };
  const pointerDisplay = { x: 0, y: 0 };
  const viewportPointer = { clientX: 0, clientY: 0, seen: false };
  const syntheticPointer = { clientX: 0, clientY: 0, enabled: false };
  const stageLayout = {
    hostWidth: 1,
    hostHeight: 1,
    renderWidth: 1,
    renderHeight: 1,
    canvasLeft: 0,
    canvasTop: 0,
    compositionOffsetX: 0,
    compositionOffsetY: 0
  };
  const motion = {
    lastTime: null,
    wave1Offset: 0,
    wave2Offset: 0,
    wave1CurrentSpeed: SECTION1_WAVE_CONFIG.wave1.speed,
    wave2CurrentSpeed: SECTION1_WAVE_CONFIG.wave2.speed,
    speedLocked: false,
    crestAlignedFrames: 0
  };
  const alignmentCache = {
    frame: 0,
    stats: { alignment: 0, pairs: 0, avgDistance: 0, maxDistance: 0 }
  };
  const lockProgress = { active: false, initialAngle: null, initialTarget: null, span: null };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  let isPaused = Boolean(startPaused) || reducedMotion;
  let hasRenderedFrame = false;
  let destroyed = false;
  let readyResolve = null;
  const ready = new Promise((resolve) => {
    readyResolve = resolve;
  });
  const pointerHudSegments = 16;
  const pointerHud = document.createElement('div');
  pointerHud.className = 'intro-wave-pointer-hud';
  pointerHud.innerHTML = `
    <img class="intro-wave-pointer-arrow" src="Assets/Arrow-2.webp" alt="">
    <div class="intro-wave-pointer-bars is-hidden">
      <div class="intro-wave-pointer-row">
        <span class="intro-wave-pointer-label">Curiosity</span>
        <div class="intro-wave-pointer-segments" data-wave-pointer-curiosity></div>
      </div>
      <div class="intro-wave-pointer-row">
        <span class="intro-wave-pointer-label">Complexity</span>
        <div class="intro-wave-pointer-segments" data-wave-pointer-complexity></div>
      </div>
    </div>
  `;
  const pointerPrompt = document.createElement('div');
  pointerPrompt.className = 'intro-wave-pointer-prompt';
  pointerPrompt.textContent = 'Press / to find how curiosity & complexity are related';
  const curiositySegmentsWrap = pointerHud.querySelector('[data-wave-pointer-curiosity]');
  const complexitySegmentsWrap = pointerHud.querySelector('[data-wave-pointer-complexity]');
  const pointerBars = pointerHud.querySelector('.intro-wave-pointer-bars');
  const curiositySegments = [];
  const complexitySegments = [];
  let pointerOverlayEnabled = false;
  for (let i = 0; i < pointerHudSegments; i += 1) {
    const curiositySegment = document.createElement('span');
    curiositySegment.className = 'intro-wave-pointer-segment';
    curiositySegment.textContent = '|';
    curiositySegmentsWrap.appendChild(curiositySegment);
    curiositySegments.push(curiositySegment);
    const complexitySegment = document.createElement('span');
    complexitySegment.className = 'intro-wave-pointer-segment';
    complexitySegment.textContent = '|';
    complexitySegmentsWrap.appendChild(complexitySegment);
    complexitySegments.push(complexitySegment);
  }
  pointerTarget.appendChild(pointerHud);
  pointerTarget.appendChild(pointerPrompt);

  const applyPointerFromClient = (clientX, clientY) => {
    const rect = pointerTarget.getBoundingClientRect();
    pointerDisplay.x = clientX - rect.left;
    pointerDisplay.y = clientY - rect.top;
    mouse.x = pointerDisplay.x - stageLayout.canvasLeft;
    mouse.y = pointerDisplay.y - stageLayout.canvasTop;
    mouse.inside =
      pointerDisplay.x >= 0 &&
      pointerDisplay.x <= rect.width &&
      pointerDisplay.y >= 0 &&
      pointerDisplay.y <= rect.height;
  };

  const updatePointerFromEvent = (event) => {
    if (event.pointerType === 'touch' && !event.isPrimary) {
      return;
    }
    if (syntheticPointer.enabled) {
      return;
    }
    viewportPointer.clientX = event.clientX;
    viewportPointer.clientY = event.clientY;
    viewportPointer.seen = true;
    applyPointerFromClient(event.clientX, event.clientY);
  };
  const onLeave = () => {
    if (syntheticPointer.enabled) {
      return;
    }
    mouse.inside = false;
  };
  const onKeyDown = (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const target = event.target;
    const tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tagName === 'input' || tagName === 'textarea' || (target && target.isContentEditable)) {
      return;
    }
    event.preventDefault();
    pointerOverlayEnabled = !pointerOverlayEnabled;
    pointerBars.classList.toggle('is-hidden', !pointerOverlayEnabled);
    pointerPrompt.classList.toggle('is-hidden', pointerOverlayEnabled);
  };

  window.addEventListener('pointermove', updatePointerFromEvent);
  window.addEventListener('pointerdown', updatePointerFromEvent);
  window.addEventListener('pointerleave', onLeave);
  window.addEventListener('keydown', onKeyDown);

  const app = new PIXI.Application({
    width: 1,
    height: 1,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: 1
  });
  app.ticker.maxFPS = SECTION1_WAVE_TUNING.targetFps;
  host.appendChild(app.view);
  app.view.style.position = 'absolute';
  app.view.style.left = '0';
  app.view.style.top = '0';
  app.view.style.width = '1px';
  app.view.style.height = '1px';
  app.view.style.display = 'block';

  const backgroundLayer = new PIXI.Container();
  const blurWaveLayer = new PIXI.Container();
  const blurCutoutLayer = new PIXI.Container();
  const focusSharpLayer = new PIXI.Container();
  app.stage.addChild(backgroundLayer);
  app.stage.addChild(blurWaveLayer);
  app.stage.addChild(blurCutoutLayer);
  app.stage.addChild(focusSharpLayer);

  const bgSprite = new PIXI.Sprite();
  const bgCutoutSprite = new PIXI.Sprite();
  backgroundLayer.addChild(bgSprite);
  blurCutoutLayer.addChild(bgCutoutSprite);

  const blurWaveGraphics = new PIXI.Graphics();
  const focusSharpGraphics = new PIXI.Graphics();
  blurWaveLayer.addChild(blurWaveGraphics);
  focusSharpLayer.addChild(focusSharpGraphics);

  const focusMaskCanvas = document.createElement('canvas');
  focusMaskCanvas.width = 512;
  focusMaskCanvas.height = 512;
  const focusMaskCtx = focusMaskCanvas.getContext('2d');
  const focusMaskGradient = focusMaskCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
  const innerStop = SECTION1_WAVE_TUNING.focusRevealRadiusPx /
    (SECTION1_WAVE_TUNING.focusRevealRadiusPx + SECTION1_WAVE_TUNING.focusRevealFeatherPx);
  focusMaskGradient.addColorStop(0, 'rgba(255,255,255,1)');
  focusMaskGradient.addColorStop(Math.max(0, innerStop), 'rgba(255,255,255,1)');
  focusMaskGradient.addColorStop(1, 'rgba(255,255,255,0)');
  focusMaskCtx.clearRect(0, 0, 512, 512);
  focusMaskCtx.fillStyle = focusMaskGradient;
  focusMaskCtx.fillRect(0, 0, 512, 512);
  const focusMaskTexture = PIXI.Texture.from(focusMaskCanvas);
  const focusMaskSprite = new PIXI.Sprite(focusMaskTexture);
  focusMaskSprite.anchor.set(0.5);
  focusMaskSprite.width = (SECTION1_WAVE_TUNING.focusRevealRadiusPx + SECTION1_WAVE_TUNING.focusRevealFeatherPx) * 2 * SECTION1_WAVE_TUNING.focusSharpMaskScale;
  focusMaskSprite.height = (SECTION1_WAVE_TUNING.focusRevealRadiusPx + SECTION1_WAVE_TUNING.focusRevealFeatherPx) * 2 * SECTION1_WAVE_TUNING.focusSharpMaskScale;
  focusMaskSprite.renderable = false;

  const blurCutoutMaskSprite = new PIXI.Sprite(focusMaskTexture);
  blurCutoutMaskSprite.anchor.set(0.5);
  blurCutoutMaskSprite.width = (SECTION1_WAVE_TUNING.focusRevealRadiusPx + SECTION1_WAVE_TUNING.focusRevealFeatherPx) * 2 * SECTION1_WAVE_TUNING.focusBlurCutoutMaskScale;
  blurCutoutMaskSprite.height = (SECTION1_WAVE_TUNING.focusRevealRadiusPx + SECTION1_WAVE_TUNING.focusRevealFeatherPx) * 2 * SECTION1_WAVE_TUNING.focusBlurCutoutMaskScale;
  blurCutoutMaskSprite.renderable = false;
  app.stage.addChild(blurCutoutMaskSprite);
  app.stage.addChild(focusMaskSprite);
  blurCutoutLayer.mask = blurCutoutMaskSprite;
  focusSharpLayer.mask = focusMaskSprite;
  blurCutoutLayer.visible = false;
  focusSharpLayer.visible = false;

  const zoomBlur = new ZoomBlurFilter();
  zoomBlur.strength = SECTION1_WAVE_TUNING.blurStrength;
  zoomBlur.innerRadius = SECTION1_WAVE_TUNING.blurInnerRadius;
  zoomBlur.radius = SECTION1_WAVE_TUNING.blurRadius;
  zoomBlur.resolution = 0.75;
  blurWaveLayer.filters = [zoomBlur];
  const blurFilterArea = new PIXI.Rectangle(0, 0, 1, 1);
  blurWaveLayer.filterArea = blurFilterArea;

  const getActiveLayoutPreset = () =>
    SECTION1_WAVE_LAYOUT_PRESETS.find((preset) =>
      !preset.media || (window.matchMedia?.(preset.media)?.matches ?? false)
    ) || SECTION1_WAVE_LAYOUT_PRESETS[SECTION1_WAVE_LAYOUT_PRESETS.length - 1];

  const syncRendererLayout = () => {
    const hostWidth = Math.max(
      2,
      Math.round(host.clientWidth || host.getBoundingClientRect().width || 1)
    );
    const hostHeight = Math.max(
      2,
      Math.round(host.clientHeight || host.getBoundingClientRect().height || 1)
    );
    const preset = getActiveLayoutPreset();
    const aspectRatio = preset.aspectRatio;
    let renderWidth = hostWidth;
    let renderHeight = hostHeight;
    let canvasLeft = 0;
    let canvasTop = 0;

    const hostAspectRatio = hostWidth / Math.max(1, hostHeight);

    if (hostAspectRatio < aspectRatio) {
      renderHeight = hostHeight;
      renderWidth = Math.round(renderHeight * aspectRatio);
      canvasLeft = Math.round((hostWidth - renderWidth) * preset.cropAlignX);
    } else {
      renderWidth = hostWidth;
      renderHeight = Math.round(renderWidth / aspectRatio);
      canvasTop = Math.round((hostHeight - renderHeight) * preset.cropAlignY);
    }

    if (app.renderer.width !== renderWidth || app.renderer.height !== renderHeight) {
      app.renderer.resize(renderWidth, renderHeight);
    }

    app.view.style.left = `${canvasLeft}px`;
    app.view.style.top = `${canvasTop}px`;
    app.view.style.width = `${renderWidth}px`;
    app.view.style.height = `${renderHeight}px`;

    stageLayout.hostWidth = hostWidth;
    stageLayout.hostHeight = hostHeight;
    stageLayout.renderWidth = renderWidth;
    stageLayout.renderHeight = renderHeight;
    stageLayout.canvasLeft = canvasLeft;
    stageLayout.canvasTop = canvasTop;
    stageLayout.compositionOffsetX = preset.compositionOffsetX;
    stageLayout.compositionOffsetY = preset.compositionOffsetY;
  };

  const makeBgTexture = () => {
    const w = Math.max(2, Math.floor(app.screen.width));
    const h = Math.max(2, Math.floor(app.screen.height));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#15101A');
    gradient.addColorStop(1, '#2A2433');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    if (bgSprite.texture) {
      bgSprite.texture.destroy(true);
    }
    bgSprite.texture = PIXI.Texture.from(c);
    bgSprite.width = app.screen.width;
    bgSprite.height = app.screen.height;
    bgCutoutSprite.texture = bgSprite.texture;
    bgCutoutSprite.width = app.screen.width;
    bgCutoutSprite.height = app.screen.height;
  };
  syncRendererLayout();
  makeBgTexture();

  const resizeObserver = new ResizeObserver(() => {
    syncRendererLayout();
    makeBgTexture();
    syncMouseFromViewportPointer();
  });
  resizeObserver.observe(host);

  const worldToScreen = (w, h, p) => ({
    x: w * (0.5 + stageLayout.compositionOffsetX) + p.x * w * 0.18,
    y: h * (0.5 + stageLayout.compositionOffsetY) - p.y * h * 0.18
  });
  const isMobileBlendMode = () =>
    window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 768;
  const syncMouseFromViewportPointer = () => {
    if (syntheticPointer.enabled) {
      applyPointerFromClient(syntheticPointer.clientX, syntheticPointer.clientY);
      return;
    }
    if (!viewportPointer.seen) {
      return;
    }
    applyPointerFromClient(viewportPointer.clientX, viewportPointer.clientY);
  };

  const resetMotion = () => {
    motion.lastTime = null;
    motion.wave1Offset = 0;
    motion.wave2Offset = 0;
    motion.wave1CurrentSpeed = SECTION1_WAVE_CONFIG.wave1.speed;
    motion.wave2CurrentSpeed = SECTION1_WAVE_CONFIG.wave2.speed;
    motion.speedLocked = false;
    motion.crestAlignedFrames = 0;
    alignmentCache.frame = 0;
    lockProgress.active = false;
    lockProgress.initialAngle = null;
    lockProgress.initialTarget = null;
    lockProgress.span = null;
    syncMouseFromViewportPointer();
  };

  const tick = () => {
    if (destroyed) {
      return;
    }
    const width = app.screen.width;
    const height = app.screen.height;

    zoomBlur.strength = SECTION1_WAVE_TUNING.blurStrength;
    zoomBlur.innerRadius = SECTION1_WAVE_TUNING.blurInnerRadius;
    zoomBlur.radius = SECTION1_WAVE_TUNING.blurRadius;
    zoomBlur.center = [
      width * (SECTION1_WAVE_TUNING.blurCenterX + stageLayout.compositionOffsetX),
      height * (SECTION1_WAVE_TUNING.blurCenterY + stageLayout.compositionOffsetY)
    ];
    blurFilterArea.x = Math.max(
      0,
      width * (SECTION1_WAVE_TUNING.blurCenterX + stageLayout.compositionOffsetX) -
        SECTION1_WAVE_TUNING.blurRadius -
        64
    );
    blurFilterArea.y = Math.max(
      0,
      height * (SECTION1_WAVE_TUNING.blurCenterY + stageLayout.compositionOffsetY) -
        SECTION1_WAVE_TUNING.blurRadius -
        64
    );
    blurFilterArea.width = Math.min(width - blurFilterArea.x, SECTION1_WAVE_TUNING.blurRadius * 2 + 128);
    blurFilterArea.height = Math.min(height - blurFilterArea.y, SECTION1_WAVE_TUNING.blurRadius * 2 + 128);

    const frameNow = performance.now();
    const dt = motion.lastTime == null ? 1 / 60 : Math.min(0.05, (frameNow - motion.lastTime) * 0.001);
    motion.lastTime = frameNow;

    const interaction = {
      enabled: SECTION1_WAVE_CONFIG.global.interactionEnabled,
      radius: SECTION1_WAVE_CONFIG.global.interactionRadius,
      softness: SECTION1_WAVE_CONFIG.global.interactionSoftness,
      amplitudeStrength: SECTION1_WAVE_CONFIG.global.amplitudeUniformity,
      wavelengthStrength: SECTION1_WAVE_CONFIG.global.wavelengthUniformity
    };
    const projectedMouse = {
      ...mouse,
      projectX: (x) => width * (0.5 + stageLayout.compositionOffsetX) + x * width * 0.18,
      projectY: (y) => height * (0.5 + stageLayout.compositionOffsetY) - y * height * 0.18
    };

    const wave1 = SECTION1_WAVE_CONFIG.wave1;
    const wave2 = SECTION1_WAVE_CONFIG.wave2;
    const sharedAmplitude = 0.5 * (wave1.baseAmplitude + wave2.baseAmplitude);
    const sharedWavelength = 0.5 * (wave1.baseWavelength + wave2.baseWavelength);
    const sharedSpeed = 0.5 * (wave1.speed + wave2.speed);

    const raw1 = buildWaveSamples(SECTION1_WAVE_CONFIG.global.sampleCount, motion.wave1Offset, wave1, 0, projectedMouse, interaction);
    const raw2 = buildWaveSamples(SECTION1_WAVE_CONFIG.global.sampleCount, motion.wave2Offset, wave2, 11, projectedMouse, interaction);
    const adj1 = raw1.map((raw) => waveInteractiveFromRaw(raw, wave1, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, projectedMouse, interaction));
    const adj2 = raw2.map((raw) => waveInteractiveFromRaw(raw, wave2, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, projectedMouse, interaction));

    let weightedOscDiff = 0;
    let weightSum = 0;
    let globalInfluence = 0;
    for (let i = 0; i < SECTION1_WAVE_CONFIG.global.sampleCount; i += 1) {
      const p1 = adj1[i];
      const p2 = adj2[i];
      const localWeight = Math.max(p1.influence ?? 0, p2.influence ?? 0);
      globalInfluence = Math.max(globalInfluence, localWeight);
      if (localWeight > 0.0001) {
        weightedOscDiff += Math.abs(p1.osc - p2.osc) * localWeight;
        weightSum += localWeight;
      }
    }
    const indexAlignment = 1 - Math.min(1, (weightSum > 0 ? weightedOscDiff / weightSum : 2) / 2);
    alignmentCache.frame += 1;
    const alignmentInterval = mouse.inside && globalInfluence >= 0.15
      ? SECTION1_WAVE_TUNING.alignmentUpdateIntervalActive
      : SECTION1_WAVE_TUNING.alignmentUpdateIntervalIdle;
    if (alignmentCache.frame === 1 || alignmentCache.frame % alignmentInterval === 0) {
      alignmentCache.stats = computeScreenSpaceAlignment(
        adj1,
        adj2,
        width,
        height,
        SECTION1_WAVE_CONFIG.global.interactionRadius,
        0.5 + stageLayout.compositionOffsetX,
        0.5 + stageLayout.compositionOffsetY
      );
    }
    const spatialStats = alignmentCache.stats;
    const phaseAlignment = spatialStats.alignment;
    const points1 = [];
    const points2 = [];
    for (let i = 0; i < SECTION1_WAVE_CONFIG.global.sampleCount; i += 1) {
      points1.push(worldToScreen(width, height, adj1[i].point));
      points2.push(worldToScreen(width, height, adj2[i].point));
    }

    const nearestWaveDistance = mouse.inside
      ? Math.min(
          minDistanceToPolylinePoints(points1, mouse.x, mouse.y),
          minDistanceToPolylinePoints(points2, mouse.x, mouse.y)
        )
      : Infinity;
    const focusLocalMouse = toLocalFocusMouse(
      mouse,
      SECTION1_WAVE_TUNING.focusSharpOffsetX,
      SECTION1_WAVE_TUNING.focusSharpOffsetY,
      SECTION1_WAVE_TUNING.focusSharpScale
    );
    const nearestCrestIndex1 = findNearestCrestIndex(adj1, points1, focusLocalMouse);
    const nearestCrestIndex2 = findNearestCrestIndex(adj2, points2, focusLocalMouse);
    let crestAngleDeg = null;
    let crestAngleWave2Deg = null;
    if (nearestCrestIndex1 >= 0 && nearestCrestIndex2 >= 0) {
      const connector = {
        x: points2[nearestCrestIndex2].x - points1[nearestCrestIndex1].x,
        y: points2[nearestCrestIndex2].y - points1[nearestCrestIndex1].y
      };
      const tangent = tangentFromScreenPoints(points1, nearestCrestIndex1);
      crestAngleDeg = angleBetweenVectorsDeg(tangent, connector);
      const tangentWave2 = tangentFromScreenPoints(points2, nearestCrestIndex2);
      crestAngleWave2Deg = angleBetweenVectorsDeg(tangentWave2, { x: -connector.x, y: -connector.y });
    }
    const crestInfluenceActive =
      SECTION1_WAVE_CONFIG.global.interactionEnabled &&
      mouse.inside &&
      globalInfluence >= 0.55 &&
      nearestCrestIndex1 >= 0 &&
      nearestCrestIndex2 >= 0;
    const pseudoProximityIndex = pseudoProximityIndexFromInfluence(globalInfluence);
    const pseudoProximityReady = Math.ceil(pseudoProximityIndex) >= 100;
    const crestAngleInRange =
      crestInfluenceActive &&
      ((crestAngleDeg != null &&
        crestAngleDeg >= CREST_LOCK_MIN_ANGLE_DEG &&
        crestAngleDeg <= CREST_LOCK_MAX_ANGLE_DEG) ||
        (crestAngleWave2Deg != null &&
          crestAngleWave2Deg >= CREST_LOCK_MIN_ANGLE_DEG &&
          crestAngleWave2Deg <= CREST_LOCK_MAX_ANGLE_DEG));
    if (!crestInfluenceActive || !pseudoProximityReady || crestAngleDeg == null) {
      lockProgress.active = false;
      lockProgress.initialAngle = null;
      lockProgress.initialTarget = null;
      lockProgress.span = null;
    } else if (!lockProgress.active) {
      const initialTarget =
        crestAngleDeg > CREST_LOCK_MAX_ANGLE_DEG
          ? CREST_LOCK_MAX_ANGLE_DEG
          : crestAngleDeg < CREST_LOCK_MIN_ANGLE_DEG
            ? 0
            : 90;
      lockProgress.active = true;
      lockProgress.initialAngle = crestAngleDeg;
      lockProgress.initialTarget = initialTarget;
      lockProgress.span = Math.max(1e-6, Math.abs(crestAngleDeg - initialTarget));
    }
    motion.crestAlignedFrames = crestAngleInRange ? motion.crestAlignedFrames + 1 : 0;
    if (!SECTION1_WAVE_CONFIG.global.sharedSpeedEnabled || !crestInfluenceActive) {
      motion.speedLocked = false;
    } else if (motion.crestAlignedFrames >= CREST_LOCK_STABLE_FRAMES) {
      motion.speedLocked = true;
    }

    const gatedSpeedMix = motion.speedLocked
      ? Math.max(globalInfluence, 0.92)
      : SECTION1_WAVE_CONFIG.global.sharedSpeedEnabled
        ? globalInfluence * Math.max(0, (phaseAlignment - 0.4) / 0.25) * 0.35
        : 0;
    const speedResponse = motion.speedLocked ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 6.5);
    const targetWave1Speed = motion.speedLocked ? sharedSpeed : lerp(wave1.speed, sharedSpeed, gatedSpeedMix);
    const targetWave2Speed = motion.speedLocked ? sharedSpeed : lerp(wave2.speed, sharedSpeed, gatedSpeedMix);
    motion.wave1CurrentSpeed = lerp(motion.wave1CurrentSpeed, targetWave1Speed, speedResponse);
    motion.wave2CurrentSpeed = lerp(motion.wave2CurrentSpeed, targetWave2Speed, speedResponse);
    motion.wave1Offset += motion.wave1CurrentSpeed * 0.42 * dt;
    motion.wave2Offset += motion.wave2CurrentSpeed * 0.42 * dt;

    blurWaveGraphics.clear();
    focusSharpGraphics.clear();

    const totalBlendSteps = isMobileBlendMode()
      ? SECTION1_WAVE_MOBILE_BLEND_STEPS
      : SECTION1_WAVE_CONFIG.global.blendSteps;
    const dynamicMinSteps = isMobileBlendMode()
      ? SECTION1_WAVE_MOBILE_MIN_BLEND_STEPS
      : SECTION1_WAVE_TUNING.dynamicBlendMinSteps;
    const progressCurrentTarget =
      crestAngleDeg == null
        ? null
        : crestAngleDeg > CREST_LOCK_MAX_ANGLE_DEG
          ? CREST_LOCK_MAX_ANGLE_DEG
          : crestAngleDeg < CREST_LOCK_MIN_ANGLE_DEG
            ? 0
            : 90;
    const progressCurrentDistance =
      crestAngleDeg == null || progressCurrentTarget == null
        ? null
        : Math.abs(crestAngleDeg - progressCurrentTarget);
    const lockProgressPercent =
      motion.speedLocked
        ? 100
        : !crestInfluenceActive || !pseudoProximityReady || lockProgress.initialAngle == null || lockProgress.span == null || progressCurrentDistance == null
          ? 0
          : clamp((1 - progressCurrentDistance / lockProgress.span) * 100, 0, 100);
    const displayedPseudoProximityIndex = Math.ceil(pseudoProximityIndex);
    const displayedLockProgressPercent = Math.ceil(lockProgressPercent);
    const complexityIndex = 100 - (displayedLockProgressPercent / 2 + displayedPseudoProximityIndex / 2);
    const pointerHudVisible = mouse.inside && !syntheticPointer.enabled;
    pointerHud.classList.toggle('is-visible', pointerHudVisible);
    pointerHud.style.transform = `translate3d(${pointerDisplay.x}px, ${pointerDisplay.y}px, 0)`;
    const curiosityFilled = Math.max(
      0,
      Math.min(pointerHudSegments, Math.round((displayedPseudoProximityIndex / 100) * pointerHudSegments))
    );
    const complexityFilled = Math.max(
      0,
      Math.min(pointerHudSegments, Math.round((Math.ceil(complexityIndex) / 100) * pointerHudSegments))
    );
    curiositySegments.forEach((segment, index) => {
      segment.classList.toggle('is-filled', index < curiosityFilled);
    });
    complexitySegments.forEach((segment, index) => {
      segment.classList.toggle('is-filled', index < complexityFilled);
    });
    const clampedDistance = Math.max(
      SECTION1_WAVE_TUNING.dynamicBlendNearPx,
      Math.min(SECTION1_WAVE_TUNING.dynamicBlendFarPx, nearestWaveDistance)
    );
    const proximityMix = 1 - (clampedDistance - SECTION1_WAVE_TUNING.dynamicBlendNearPx) /
      Math.max(1, SECTION1_WAVE_TUNING.dynamicBlendFarPx - SECTION1_WAVE_TUNING.dynamicBlendNearPx);
    const focusBlendSteps = Math.round(
      lerp(totalBlendSteps, dynamicMinSteps, proximityMix)
    );
    const blurTotalLines = totalBlendSteps + 2;
    const focusTotalLines = focusBlendSteps + 2;
    const reducedPoints1 = buildReducedPoints(points1, SECTION1_WAVE_TUNING.blurPointStride);
    const reducedPoints2 = buildReducedPoints(points2, SECTION1_WAVE_TUNING.blurPointStride);
    const focusRevealActive =
      mouse.inside &&
      globalInfluence >= SECTION1_WAVE_TUNING.focusTriggerInfluence &&
      nearestWaveDistance <= SECTION1_WAVE_CONFIG.global.interactionRadius;

    blurCutoutLayer.visible = focusRevealActive;
    focusSharpLayer.visible = focusRevealActive;
    focusSharpLayer.position.set(
      SECTION1_WAVE_TUNING.focusSharpOffsetX,
      SECTION1_WAVE_TUNING.focusSharpOffsetY
    );
    focusSharpLayer.scale.set(
      SECTION1_WAVE_TUNING.focusSharpScale,
      SECTION1_WAVE_TUNING.focusSharpScale
    );
    focusMaskSprite.position.set(mouse.x, mouse.y);
    blurCutoutMaskSprite.position.set(mouse.x, mouse.y);

    if (SECTION1_WAVE_CONFIG.global.interpolationEnabled) {
      for (let lineIndex = 0; lineIndex < blurTotalLines; lineIndex += 1) {
        const raw = lineIndex / Math.max(1, blurTotalLines - 1);
        const eased = easeInOut(raw);
        const shouldDraw = SECTION1_WAVE_CONFIG.global.showEndpoints || (raw !== 0 && raw !== 1);
        if (!shouldDraw) {
          continue;
        }
        const endpointAlpha = raw === 0 || raw === 1 ? 1 : 0.88;
        const widthBoost = raw === 0 || raw === 1 ? 0.3 : 0;
        const color = blendColorInt(SECTION1_WAVE_COLOR_A, SECTION1_WAVE_COLOR_B, raw);
        if (lineIndex % SECTION1_WAVE_TUNING.blurLineStride === 0) {
          const blurPts = [];
          for (let i = 0; i < reducedPoints1.length; i += 1) {
            blurPts.push({
              x: lerp(
                reducedPoints1[i].x,
                reducedPoints2[i].x,
                SECTION1_WAVE_CONFIG.global.use2DInterpolate ? eased : raw
              ),
              y: lerp(reducedPoints1[i].y, reducedPoints2[i].y, eased)
            });
          }
          drawPolylinePixi(
            blurWaveGraphics,
            blurPts,
            color,
            SECTION1_WAVE_CONFIG.global.lineWidth + widthBoost + 0.75,
            0.55
          );
        }
      }

      if (focusRevealActive) {
        for (let lineIndex = 0; lineIndex < focusTotalLines; lineIndex += 1) {
          const raw = lineIndex / Math.max(1, focusTotalLines - 1);
          const eased = easeInOut(raw);
          const shouldDraw = SECTION1_WAVE_CONFIG.global.showEndpoints || (raw !== 0 && raw !== 1);
          if (!shouldDraw) {
            continue;
          }
          const endpointAlpha = raw === 0 || raw === 1 ? 1 : 0.88;
          const widthBoost = raw === 0 || raw === 1 ? 0.3 : 0;
          const color = blendColorInt(SECTION1_WAVE_COLOR_A, SECTION1_WAVE_COLOR_B, raw);
          const sharpPts = [];
          for (let i = 0; i < SECTION1_WAVE_CONFIG.global.sampleCount; i += 1) {
            sharpPts.push({
              x: lerp(
                points1[i].x,
                points2[i].x,
                SECTION1_WAVE_CONFIG.global.use2DInterpolate ? eased : raw
              ),
              y: lerp(points1[i].y, points2[i].y, eased)
            });
          }
          drawPolylinePixi(
            focusSharpGraphics,
            sharpPts,
            color,
            SECTION1_WAVE_CONFIG.global.lineWidth + widthBoost,
            endpointAlpha
          );
        }
      }
    } else if (SECTION1_WAVE_CONFIG.global.showEndpoints) {
      if (focusRevealActive) {
        drawPolylinePixi(
          focusSharpGraphics,
          points1,
          parseInt(SECTION1_WAVE_COLOR_A.slice(1), 16),
          SECTION1_WAVE_CONFIG.global.lineWidth + 0.3,
          1
        );
        drawPolylinePixi(
          focusSharpGraphics,
          points2,
          parseInt(SECTION1_WAVE_COLOR_B.slice(1), 16),
          SECTION1_WAVE_CONFIG.global.lineWidth + 0.3,
          1
        );
      }
      drawPolylinePixi(
        blurWaveGraphics,
        points1,
        parseInt(SECTION1_WAVE_COLOR_A.slice(1), 16),
        SECTION1_WAVE_CONFIG.global.lineWidth + 0.9,
        0.55
      );
      drawPolylinePixi(
        blurWaveGraphics,
        points2,
        parseInt(SECTION1_WAVE_COLOR_B.slice(1), 16),
        SECTION1_WAVE_CONFIG.global.lineWidth + 0.9,
        0.55
      );
    }

    if (!hasRenderedFrame) {
      hasRenderedFrame = true;
      readyResolve?.();
      if (isPaused) {
        app.ticker.stop();
        motion.lastTime = null;
      }
    }
  };

  app.ticker.add(tick);
  const pause = () => {
    if (destroyed || isPaused) {
      return;
    }
    isPaused = true;
    pointerHud.classList.remove('is-visible');
    app.ticker.stop();
    motion.lastTime = null;
  };
  const resume = () => {
    if (destroyed || reducedMotion) {
      return;
    }
    if (!hasRenderedFrame) {
      return;
    }
    syncMouseFromViewportPointer();
    isPaused = false;
    motion.lastTime = null;
    app.ticker.start();
  };
  const restart = () => {
    if (destroyed) {
      return;
    }
    resetMotion();
    isPaused = reducedMotion;
    pointerHud.classList.remove('is-visible');
    tick();
    if (!reducedMotion) {
      isPaused = false;
      motion.lastTime = null;
      app.ticker.start();
    }
  };
  const destroy = () => {
    if (destroyed) {
      return;
    }
    destroyed = true;
    window.removeEventListener('pointermove', updatePointerFromEvent);
    window.removeEventListener('pointerdown', updatePointerFromEvent);
    window.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('keydown', onKeyDown);
    pointerHud.remove();
    pointerPrompt.remove();
    resizeObserver.disconnect();
    motion.lastTime = null;
    app.ticker.remove(tick);
    app.destroy(true, { children: true, texture: true, baseTexture: true });
    host.innerHTML = '';
    delete host.dataset.waveVizMounted;
  };

  host._section1WaveDestroy = destroy;

  return {
    ready,
    pause,
    resume,
    restart,
    setSyntheticPointer(clientX, clientY) {
      syntheticPointer.enabled = true;
      syntheticPointer.clientX = clientX;
      syntheticPointer.clientY = clientY;
      applyPointerFromClient(clientX, clientY);
    },
    clearSyntheticPointer() {
      syntheticPointer.enabled = false;
      mouse.inside = false;
    },
    destroy,
    isReducedMotion: reducedMotion
  };
}
