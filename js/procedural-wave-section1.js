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

function computeScreenSpaceAlignment(samplesA, samplesB, width, height, interactionRadius) {
  const project = (p) => ({ x: width * 0.5 + p.x * width * 0.18, y: height * 0.5 - p.y * height * 0.18 });
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
    wavelengthVariation: 0.51,
    curveAmount: 0,
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
    curveAmount: 0,
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
  blurStrength: 0.29,
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

export async function initSectionOneProceduralWave({ host, pointerTarget }) {
  if (!host || !pointerTarget || host.dataset.waveVizMounted === 'yes') {
    return;
  }
  host.dataset.waveVizMounted = 'yes';

  const { PIXI, ZoomBlurFilter } = await ensurePixiCdnReady();
  const mouse = { x: 0, y: 0, inside: false };
  const motion = {
    lastTime: null,
    wave1Offset: 0,
    wave2Offset: 0,
    wave1CurrentSpeed: SECTION1_WAVE_CONFIG.wave1.speed,
    wave2CurrentSpeed: SECTION1_WAVE_CONFIG.wave2.speed,
    speedLocked: false,
    episodePeakAlignment: 0,
    nearPeakFrames: 0,
    interactionEpisodeActive: false
  };
  const alignmentCache = {
    frame: 0,
    stats: { alignment: 0, pairs: 0, avgDistance: 0, maxDistance: 0 }
  };

  const onMove = (event) => {
    const rect = pointerTarget.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.inside = true;
  };
  const onLeave = () => {
    mouse.inside = false;
  };

  pointerTarget.addEventListener('pointermove', onMove);
  pointerTarget.addEventListener('pointerleave', onLeave);

  const app = new PIXI.Application({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: 1
  });
  app.ticker.maxFPS = SECTION1_WAVE_TUNING.targetFps;
  host.appendChild(app.view);
  app.view.style.width = '100%';
  app.view.style.height = '100%';
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
  makeBgTexture();

  const resizeObserver = new ResizeObserver(() => {
    bgSprite.width = app.screen.width;
    bgSprite.height = app.screen.height;
    makeBgTexture();
  });
  resizeObserver.observe(host);

  const worldToScreen = (w, h, p) => ({ x: w * 0.5 + p.x * w * 0.18, y: h * 0.5 - p.y * h * 0.18 });

  const tick = () => {
    const width = app.screen.width;
    const height = app.screen.height;

    zoomBlur.strength = SECTION1_WAVE_TUNING.blurStrength;
    zoomBlur.innerRadius = SECTION1_WAVE_TUNING.blurInnerRadius;
    zoomBlur.radius = SECTION1_WAVE_TUNING.blurRadius;
    zoomBlur.center = [width * SECTION1_WAVE_TUNING.blurCenterX, height * SECTION1_WAVE_TUNING.blurCenterY];
    blurFilterArea.x = Math.max(0, width * SECTION1_WAVE_TUNING.blurCenterX - SECTION1_WAVE_TUNING.blurRadius - 64);
    blurFilterArea.y = Math.max(0, height * SECTION1_WAVE_TUNING.blurCenterY - SECTION1_WAVE_TUNING.blurRadius - 64);
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
      projectX: (x) => width * 0.5 + x * width * 0.18,
      projectY: (y) => height * 0.5 - y * height * 0.18
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
        SECTION1_WAVE_CONFIG.global.interactionRadius
      );
    }
    const spatialStats = alignmentCache.stats;
    const phaseAlignment = spatialStats.alignment;
    const peakEpsilon = 0.02;
    const unlockDrop = 0.06;
    const stabilityFramesRequired = 8;
    const minInfluence = 0.88;
    const minPairs = Math.max(80, Math.floor(SECTION1_WAVE_CONFIG.global.sampleCount * 0.45));
    const maxAvgPairDistance = 130;
    const episodeIsActive = globalInfluence >= 0.55 && SECTION1_WAVE_CONFIG.global.interactionEnabled && mouse.inside;

    if (!episodeIsActive) {
      motion.interactionEpisodeActive = false;
      motion.episodePeakAlignment = 0;
      motion.nearPeakFrames = 0;
    } else {
      if (!motion.interactionEpisodeActive) {
        motion.interactionEpisodeActive = true;
        motion.episodePeakAlignment = phaseAlignment;
        motion.nearPeakFrames = 0;
      } else {
        motion.episodePeakAlignment = Math.max(motion.episodePeakAlignment, phaseAlignment);
      }
      const nearPeak =
        phaseAlignment >= motion.episodePeakAlignment - peakEpsilon &&
        globalInfluence >= minInfluence &&
        spatialStats.pairs >= minPairs &&
        spatialStats.avgDistance <= maxAvgPairDistance;
      motion.nearPeakFrames = nearPeak ? motion.nearPeakFrames + 1 : 0;
    }

    const shouldLock =
      SECTION1_WAVE_CONFIG.global.sharedSpeedEnabled &&
      episodeIsActive &&
      motion.nearPeakFrames >= stabilityFramesRequired;
    const shouldUnlock =
      !SECTION1_WAVE_CONFIG.global.sharedSpeedEnabled ||
      !episodeIsActive ||
      phaseAlignment < motion.episodePeakAlignment - unlockDrop ||
      spatialStats.pairs < Math.max(30, Math.floor(minPairs * 0.4));

    if (shouldLock) {
      motion.speedLocked = true;
    } else if (shouldUnlock) {
      motion.speedLocked = false;
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

    const points1 = [];
    const points2 = [];
    for (let i = 0; i < SECTION1_WAVE_CONFIG.global.sampleCount; i += 1) {
      points1.push(worldToScreen(width, height, adj1[i].point));
      points2.push(worldToScreen(width, height, adj2[i].point));
    }

    blurWaveGraphics.clear();
    focusSharpGraphics.clear();

    const nearestWaveDistance = mouse.inside
      ? Math.min(
          minDistanceToPolylinePoints(points1, mouse.x, mouse.y),
          minDistanceToPolylinePoints(points2, mouse.x, mouse.y)
        )
      : Infinity;
    const clampedDistance = Math.max(
      SECTION1_WAVE_TUNING.dynamicBlendNearPx,
      Math.min(SECTION1_WAVE_TUNING.dynamicBlendFarPx, nearestWaveDistance)
    );
    const proximityMix = 1 - (clampedDistance - SECTION1_WAVE_TUNING.dynamicBlendNearPx) /
      Math.max(1, SECTION1_WAVE_TUNING.dynamicBlendFarPx - SECTION1_WAVE_TUNING.dynamicBlendNearPx);
    const focusBlendSteps = Math.round(
      lerp(SECTION1_WAVE_CONFIG.global.blendSteps, SECTION1_WAVE_TUNING.dynamicBlendMinSteps, proximityMix)
    );
    const blurTotalLines = SECTION1_WAVE_CONFIG.global.blendSteps + 2;
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
        const color = blendColorInt('#605e63', '#0c0912', raw);
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
          const color = blendColorInt('#605e63', '#0c0912', raw);
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
        drawPolylinePixi(focusSharpGraphics, points1, 0x605e63, SECTION1_WAVE_CONFIG.global.lineWidth + 0.3, 1);
        drawPolylinePixi(focusSharpGraphics, points2, 0x0c0912, SECTION1_WAVE_CONFIG.global.lineWidth + 0.3, 1);
      }
      drawPolylinePixi(blurWaveGraphics, points1, 0x605e63, SECTION1_WAVE_CONFIG.global.lineWidth + 0.9, 0.55);
      drawPolylinePixi(blurWaveGraphics, points2, 0x0c0912, SECTION1_WAVE_CONFIG.global.lineWidth + 0.9, 0.55);
    }
  };

  app.ticker.add(tick);

  host._section1WaveDestroy = () => {
    pointerTarget.removeEventListener('pointermove', onMove);
    pointerTarget.removeEventListener('pointerleave', onLeave);
    resizeObserver.disconnect();
    motion.lastTime = null;
    app.ticker.remove(tick);
    app.destroy(true, { children: true, texture: true, baseTexture: true });
    host.innerHTML = '';
    delete host.dataset.waveVizMounted;
  };
}
