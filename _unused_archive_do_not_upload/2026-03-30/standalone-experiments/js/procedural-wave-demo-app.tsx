const { useEffect, useMemo, useRef, useState } = React;

const Copy = (props) => React.createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props },
  React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
  React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
);

const ChevronRight = (props) => React.createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props },
  React.createElement("polyline", { points: "9 18 15 12 9 6" })
);

const ChevronLeft = (props) => React.createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props },
  React.createElement("polyline", { points: "15 18 9 12 15 6" })
);

const Upload = (props) => React.createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props },
  React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
  React.createElement("polyline", { points: "17 8 12 3 7 8" }),
  React.createElement("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
);

const RotateCcw = (props) => React.createElement(
  "svg",
  { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...props },
  React.createElement("polyline", { points: "1 4 1 10 7 10" }),
  React.createElement("path", { d: "M3.51 15a9 9 0 1 0 .49-5" })
);

function Control({ label, value, onChange, min, max, step = 0.01 }) {
  const safeValue = Number.isFinite(value) ? value : min;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm text-slate-200">{label}</label>
        <span className="text-xs tabular-nums text-slate-400">{safeValue.toFixed(2)}</span>
      </div>
      <input
        type="range"
        className="w-full accent-slate-200"
        value={safeValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 gap-4 cursor-pointer">
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-slate-200"
      />
    </label>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function WaveControls({ title, state, setters }) {
  return (
    <Section title={title} subtitle="Independent endpoint wave used for the blend field.">
      <Control label="Base amplitude" value={state.baseAmplitude} onChange={setters.setBaseAmplitude} min={0.02} max={0.45} step={0.01} />
      <Control label="Amplitude variation" value={state.ampVariation} onChange={setters.setAmpVariation} min={0.0} max={2.2} step={0.01} />
      <Control label="Base wavelength" value={state.baseWavelength} onChange={setters.setBaseWavelength} min={0.2} max={4.0} step={0.01} />
      <Control label="Wavelength variation" value={state.wavelengthVariation} onChange={setters.setWavelengthVariation} min={0.0} max={2.2} step={0.01} />
      <Control label="Curve amount" value={state.curveAmount} onChange={setters.setCurveAmount} min={0.0} max={0.5} step={0.01} />
      <Control label="Curve frequency" value={state.curveFrequency} onChange={setters.setCurveFrequency} min={0.2} max={12.0} step={0.05} />
      <Control label="Carrier phase" value={state.carrierPhase} onChange={setters.setCarrierPhase} min={-6.28} max={6.28} step={0.01} />
      <Control label="Arc span" value={state.arcSpan} onChange={setters.setArcSpan} min={0.01} max={1.0} step={0.01} />
      <Control label="Arc rotation" value={state.arcRotation} onChange={setters.setArcRotation} min={-3.14} max={3.14} step={0.01} />
      <Control label="Arc radius" value={state.arcRadius} onChange={setters.setArcRadius} min={0.4} max={10.0} step={0.01} />
      <Control label="Arc X" value={state.arcX} onChange={setters.setArcX} min={-50.0} max={50.0} step={0.01} />
      <Control label="Arc Y" value={state.arcY} onChange={setters.setArcY} min={-50.0} max={50.0} step={0.01} />
      <Control label="Wave speed" value={state.speed} onChange={setters.setSpeed} min={0.0} max={4.0} step={0.05} />
    </Section>
  );
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
  let v = 0, a = 0.5, f = x;
  for (let i = 0; i < 5; i += 1) {
    v += a * noise1D(f);
    f = f * 2.03 + 13.1;
    a *= 0.5;
  }
  return v;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function blendColor(aHex, bHex, t) {
  const a = hexToRgb(aHex), b = hexToRgb(bHex);
  return `rgb(${Math.round(lerp(a.r, b.r, t))}, ${Math.round(lerp(a.g, b.g, t))}, ${Math.round(lerp(a.b, b.b, t))})`;
}
function blendColorInt(aHex, bHex, t) {
  const a = hexToRgb(aHex), b = hexToRgb(bHex);
  const r = Math.round(lerp(a.r, b.r, t));
  const g = Math.round(lerp(a.g, b.g, t));
  const bl = Math.round(lerp(a.b, b.b, t));
  return (r << 16) | (g << 8) | bl;
}

function sanitizeHexColor(value, fallback) {
  const raw = String(value || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  return fallback;
}

const __scriptLoadCache = {};
function loadExternalScriptOnce(src) {
  if (__scriptLoadCache[src]) return __scriptLoadCache[src];
  __scriptLoadCache[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "yes") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
      }
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "yes"; resolve(); };
    s.onerror = () => reject(new Error(`Failed loading ${src}`));
    document.head.appendChild(s);
  });
  return __scriptLoadCache[src];
}

async function ensurePixiCdnReady() {
  await loadExternalScriptOnce("https://cdn.jsdelivr.net/npm/pixi.js@7/dist/pixi.min.js");
  await loadExternalScriptOnce("https://cdn.jsdelivr.net/npm/pixi-filters@latest/dist/browser/pixi-filters.min.js");
  const PIXI = window.PIXI;
  const ZoomBlurFilter =
    (PIXI && PIXI.filters && PIXI.filters.ZoomBlurFilter) ||
    (window.pixiFilters && window.pixiFilters.ZoomBlurFilter) ||
    null;
  if (!PIXI || !ZoomBlurFilter) throw new Error("PIXI or ZoomBlurFilter unavailable from CDN");
  return { PIXI, ZoomBlurFilter };
}

function circleArcFrame(u, params) {
  const span = Math.max(0.001, params.arcSpan * Math.PI * 2);
  const start = params.arcRotation - span * 0.5;
  const theta = start + span * u;
  const point = { x: params.arcX + params.arcRadius * Math.cos(theta), y: params.arcY + params.arcRadius * Math.sin(theta) };
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
  if (!interaction.enabled || !mouse.inside) return 0;
  const x = mouse.projectX(point.x), y = mouse.projectY(point.y);
  const dx = x - mouse.x, dy = y - mouse.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const inner = interaction.radius * (1 - interaction.softness);
  const outer = interaction.radius;
  if (d <= inner) return 1;
  if (d >= outer) return 0;
  return 1 - smoothstep01((d - inner) / Math.max(0.0001, outer - inner));
}

function arcGuidePoint(u, params) { return circleArcFrame(u, params).point; }

function baselinePoint(u, params, seed, mouse = null, interaction = null) {
  const frame = circleArcFrame(u, params);
  const influence = mouse && interaction ? estimateInfluenceAtPoint(frame.point, mouse, interaction) : 0;
  const curveAmount = params.curveAmount * (1 - influence);
  const offset = carrierWaveValue(u, curveAmount, params.curveFrequency, params.carrierPhase, seed);
  return { x: frame.point.x + frame.normal.x * offset, y: frame.point.y + frame.normal.y * offset, carrierSimplification: influence };
}

function buildWaveSamples(sampleCount, travelOffset, params, seed, mouse = null, interaction = null) {
  const samples = [];
  const xMin = -1.8, xMax = 1.8;
  let phaseAccum = 0, prevWorldCoord = null;
  for (let i = 0; i < sampleCount; i += 1) {
    const u = i / Math.max(1, sampleCount - 1);
    const worldCoord = lerp(xMin, xMax, u);
    const frame = circleArcFrame(u, params);
    const influence = mouse && interaction ? estimateInfluenceAtPoint(frame.point, mouse, interaction) : 0;
    const curveAmount = params.curveAmount * (1 - influence);
    const carrierOffset = carrierWaveValue(u, curveAmount, params.curveFrequency, params.carrierPhase, seed);
    const basePoint = { x: frame.point.x + frame.normal.x * carrierOffset, y: frame.point.y + frame.normal.y * carrierOffset };
    const amp = amplitudeField(worldCoord, params.baseAmplitude, params.ampVariation, seed);
    const localWavelength = wavelengthField(worldCoord, params.baseWavelength, params.wavelengthVariation, seed);
    if (prevWorldCoord != null) phaseAccum += (Math.PI * 2 * (worldCoord - prevWorldCoord)) / Math.max(0.05, localWavelength);
    prevWorldCoord = worldCoord;
    const travelPhase = (-Math.PI * 2 * travelOffset) / Math.max(0.05, params.baseWavelength);
    const phaseJitter = (fbm(worldCoord * 0.7 + seed * 1.9) * 2 - 1) * 0.08;
    const phase = phaseAccum + travelPhase + phaseJitter;
    const osc = Math.sin(phase);
    samples.push({
      u, phase, osc, amp, basePoint, normal: frame.normal, travelCoord: worldCoord - travelOffset,
      carrierSimplification: influence,
      point: { x: basePoint.x + frame.normal.x * osc * amp, y: basePoint.y + frame.normal.y * osc * amp }
    });
  }
  return samples;
}

function waveInteractiveFromRaw(raw, params, shared, mouse, interaction) {
  if (!interaction.enabled || !mouse.inside) return { ...raw, influence: 0 };
  const sampleX = mouse.projectX(raw.point.x), sampleY = mouse.projectY(raw.point.y);
  const dx = sampleX - mouse.x, dy = sampleY - mouse.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const inner = interaction.radius * (1 - interaction.softness), outer = interaction.radius;
  let influence = 0;
  if (d <= inner) influence = 1; else if (d < outer) influence = 1 - smoothstep01((d - inner) / Math.max(0.0001, outer - inner));
  if (influence <= 0.0001) return { ...raw, influence: 0 };
  const targetAmp = lerp(raw.amp, shared.amplitude, influence * interaction.amplitudeStrength);
  const uniformPhase = (Math.PI * 2 * raw.travelCoord) / params.baseWavelength;
  const sharedPhase = (Math.PI * 2 * raw.travelCoord) / shared.wavelength;
  const localOsc = lerp(raw.osc, Math.sin(uniformPhase), influence * interaction.wavelengthStrength);
  const osc = Math.max(-1, Math.min(1, lerp(localOsc, Math.sin(sharedPhase), influence * interaction.wavelengthStrength)));
  return { ...raw, influence, osc, phase: Math.asin(osc), point: { x: raw.basePoint.x + raw.normal.x * osc * targetAmp, y: raw.basePoint.y + raw.normal.y * osc * targetAmp } };
}

function estimatePhaseDensityFromSamples(samples, index) {
  const prev = samples[Math.max(0, index - 1)], next = samples[Math.min(samples.length - 1, index + 1)];
  const du = Math.max(0.0001, next.u - prev.u);
  return Math.abs((next.phase - prev.phase) / du);
}

function computeScreenSpaceAlignment(samplesA, samplesB, width, height, interactionRadius) {
  const project = (p) => ({ x: width * 0.5 + p.x * width * 0.18, y: height * 0.5 - p.y * height * 0.18 });
  let weightedOscDiff = 0, weightSum = 0, pairs = 0, avgDistance = 0;
  const maxDistance = Math.max(24, Math.min(interactionRadius * 0.35, 220));
  const pairLines = [];
  for (let i = 0; i < samplesA.length; i += 1) {
    const a = samplesA[i];
    if ((a.influence ?? 0) <= 0.0001) continue;
    const ap = project(a.point);
    let bestIndex = -1, bestDist2 = Infinity;
    for (let j = 0; j < samplesB.length; j += 1) {
      const b = samplesB[j];
      if ((b.influence ?? 0) <= 0.0001) continue;
      const bp = project(b.point), dx = bp.x - ap.x, dy = bp.y - ap.y, d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) { bestDist2 = d2; bestIndex = j; }
    }
    if (bestIndex < 0) continue;
    const bestDist = Math.sqrt(bestDist2);
    if (bestDist > maxDistance) continue;
    const b = samplesB[bestIndex];
    const weight = Math.max(a.influence ?? 0, b.influence ?? 0) * (1 - bestDist / maxDistance);
    if (weight <= 0.0001) continue;
    weightedOscDiff += Math.abs(a.osc - b.osc) * weight;
    weightSum += weight; pairs += 1; avgDistance += bestDist;
    if (pairLines.length < 40) {
      const bp = project(b.point);
      pairLines.push({ ax: ap.x, ay: ap.y, bx: bp.x, by: bp.y, dist: bestDist });
    }
  }
  const avgOscDiff = weightSum > 0 ? weightedOscDiff / weightSum : 2;
  return { alignment: 1 - Math.min(1, avgOscDiff / 2), pairs, avgDistance: pairs > 0 ? avgDistance / pairs : 0, pairLines, maxDistance };
}

const DEFAULT_CONFIG = {
  wave1: { baseAmplitude: 0.26, ampVariation: 0.25, baseWavelength: 1.14, wavelengthVariation: 2.2, curveAmount: 0.18, curveFrequency: 4.45, carrierPhase: 0, arcSpan: 0.18, arcRotation: -0.54, arcRadius: 6.66, arcX: -4.64, arcY: 2.68, speed: 0.65 },
  wave2: { baseAmplitude: 0.22, ampVariation: 1.29, baseWavelength: 0.74, wavelengthVariation: 1.65, curveAmount: 0.15, curveFrequency: 5.15, carrierPhase: 1.58, arcSpan: 0.19, arcRotation: -0.52, arcRadius: 6.61, arcX: -4.1, arcY: 2.31, speed: 0.9 },
  global: { blendSteps: 100, sampleCount: 220, lineWidth: 0.5, showEndpoints: true, interpolationEnabled: true, use2DInterpolate: false, showBaselines: true, showArcGuides: true, interactionEnabled: true, interactionRadius: 880, interactionSoftness: 0.88, amplitudeUniformity: 1, wavelengthUniformity: 1, sharedSpeedEnabled: true, showPhaseDensityDebug: false }
};

const SHARP_LAYER_ALPHA = 0;
const BLUR_LAYER_ALPHA = 1;
const TARGET_FPS = 45;
const BLUR_RENDER_LINE_STRIDE = 2;
const BLUR_RENDER_POINT_STRIDE = 2;
const FOCUS_REVEAL_RADIUS_PX = 140;
const FOCUS_REVEAL_FEATHER_PX = 300;
const FOCUS_SHARP_MASK_SCALE = 0.765;
const FOCUS_BLUR_CUTOUT_MASK_SCALE = 1.21;
const FOCUS_TRIGGER_INFLUENCE = 0.08;
const DYNAMIC_BLEND_NEAR_PX = 24;
const DYNAMIC_BLEND_FAR_PX = 260;
const DYNAMIC_BLEND_MIN_STEPS = 25;
const ALIGNMENT_UPDATE_INTERVAL_ACTIVE = 2;
const ALIGNMENT_UPDATE_INTERVAL_IDLE = 3;
const CREST_LOCK_MIN_ANGLE_DEG = 88;
const CREST_LOCK_MAX_ANGLE_DEG = 92;
const CREST_LOCK_STABLE_FRAMES = 6;

function safeMergeConfig(input) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (!input || typeof input !== "object") return merged;
  for (const bucket of ["wave1", "wave2", "global"]) {
    if (!input[bucket] || typeof input[bucket] !== "object") continue;
    for (const key of Object.keys(merged[bucket])) {
      const next = input[bucket][key];
      if (typeof merged[bucket][key] === "boolean") { if (typeof next === "boolean") merged[bucket][key] = next; }
      else if (typeof merged[bucket][key] === "number") { if (Number.isFinite(next)) merged[bucket][key] = next; }
    }
  }
  return merged;
}

function minDistanceToPolylinePoints(points, x, y) {
  if (!points || points.length === 0) return Infinity;
  let minDistSq = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) minDistSq = distSq;
  }
  return Math.sqrt(minDistSq);
}

function signedNormalDisplacement(sample) {
  const dx = sample.point.x - sample.basePoint.x;
  const dy = sample.point.y - sample.basePoint.y;
  return dx * sample.normal.x + dy * sample.normal.y;
}

function findNearestCrestIndex(samples, screenPoints, mouse) {
  if (!mouse.inside || !samples || samples.length < 3) return -1;
  let bestIndex = -1;
  let bestDistSq = Infinity;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const prev = signedNormalDisplacement(samples[i - 1]);
    const curr = signedNormalDisplacement(samples[i]);
    const next = signedNormalDisplacement(samples[i + 1]);
    if (!(curr > prev && curr >= next && curr > 0)) continue;
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
  if (magA <= 1e-6 || magB <= 1e-6) return null;
  const dot = (a.x * b.x + a.y * b.y) / (magA * magB);
  const clamped = Math.max(-1, Math.min(1, dot));
  return Math.acos(clamped) * (180 / Math.PI);
}

function toLocalFocusMouse(mouse, offsetX, offsetY, scale) {
  if (!mouse.inside) return mouse;
  return {
    ...mouse,
    x: (mouse.x - offsetX) / Math.max(1e-6, scale),
    y: (mouse.y - offsetY) / Math.max(1e-6, scale),
  };
}

function tangentFromScreenPoints(points, index) {
  if (!points || points.length < 2 || index < 0 || index >= points.length) return null;
  const prev = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const mag = Math.hypot(dx, dy);
  if (mag <= 1e-6) return null;
  return { x: dx / mag, y: dy / mag };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pseudoProximityIndexFromInfluence(influence) {
  const x = clamp(influence, 0, 1) * 100;
  return 0.00000156428 * Math.pow(x, 3.9015);
}

function ProceduralWaveBlendDemo() {
  const hostRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const motionRef = useRef({ lastTime: null, wave1Offset: 0, wave2Offset: 0, wave1CurrentSpeed: 0.65, wave2CurrentSpeed: 0.9, speedLocked: false, crestAlignedFrames: 0 });
  const liveMetricsRef = useRef({ wave1Speed: 0.65, wave2Speed: 0.9, sharedSpeed: 0.775, speedMix: 0, spatialAlignment: 0, indexAlignment: 0, influence: 0, pseudoProximityIndex: 0, complexityIndex: 100, speedLocked: 0, alignmentPairs: 0, avgPairDistance: 0, avgCarrierSimplification: 0, crestAngleDeg: null, crestAngleWave2Deg: null, crestAlignedFrames: 0, crestInRange: 0, lockProgressInitialAngle: null, lockProgressTarget: null, lockProgressCurrentTarget: null, lockProgressSpan: null, lockProgressCurrentDistance: null, lockProgressPercent: 0 });
  const alignmentCacheRef = useRef({ frame: 0, stats: { alignment: 0, pairs: 0, avgDistance: 0, pairLines: [], maxDistance: 0 } });
  const lockProgressRef = useRef({ active: false, initialAngle: null, initialTarget: null, span: null });

  const [wave1BaseAmplitude, setWave1BaseAmplitude] = useState(DEFAULT_CONFIG.wave1.baseAmplitude);
  const [wave1AmpVariation, setWave1AmpVariation] = useState(DEFAULT_CONFIG.wave1.ampVariation);
  const [wave1BaseWavelength, setWave1BaseWavelength] = useState(DEFAULT_CONFIG.wave1.baseWavelength);
  const [wave1WavelengthVariation, setWave1WavelengthVariation] = useState(DEFAULT_CONFIG.wave1.wavelengthVariation);
  const [wave1CurveAmount, setWave1CurveAmount] = useState(DEFAULT_CONFIG.wave1.curveAmount);
  const [wave1CurveFrequency, setWave1CurveFrequency] = useState(DEFAULT_CONFIG.wave1.curveFrequency);
  const [wave1CarrierPhase, setWave1CarrierPhase] = useState(DEFAULT_CONFIG.wave1.carrierPhase);
  const [wave1ArcSpan, setWave1ArcSpan] = useState(DEFAULT_CONFIG.wave1.arcSpan);
  const [wave1ArcRotation, setWave1ArcRotation] = useState(DEFAULT_CONFIG.wave1.arcRotation);
  const [wave1ArcRadius, setWave1ArcRadius] = useState(DEFAULT_CONFIG.wave1.arcRadius);
  const [wave1ArcX, setWave1ArcX] = useState(DEFAULT_CONFIG.wave1.arcX);
  const [wave1ArcY, setWave1ArcY] = useState(DEFAULT_CONFIG.wave1.arcY);
  const [wave1Speed, setWave1Speed] = useState(DEFAULT_CONFIG.wave1.speed);
  const [wave2BaseAmplitude, setWave2BaseAmplitude] = useState(DEFAULT_CONFIG.wave2.baseAmplitude);
  const [wave2AmpVariation, setWave2AmpVariation] = useState(DEFAULT_CONFIG.wave2.ampVariation);
  const [wave2BaseWavelength, setWave2BaseWavelength] = useState(DEFAULT_CONFIG.wave2.baseWavelength);
  const [wave2WavelengthVariation, setWave2WavelengthVariation] = useState(DEFAULT_CONFIG.wave2.wavelengthVariation);
  const [wave2CurveAmount, setWave2CurveAmount] = useState(DEFAULT_CONFIG.wave2.curveAmount);
  const [wave2CurveFrequency, setWave2CurveFrequency] = useState(DEFAULT_CONFIG.wave2.curveFrequency);
  const [wave2CarrierPhase, setWave2CarrierPhase] = useState(DEFAULT_CONFIG.wave2.carrierPhase);
  const [wave2ArcSpan, setWave2ArcSpan] = useState(DEFAULT_CONFIG.wave2.arcSpan);
  const [wave2ArcRotation, setWave2ArcRotation] = useState(DEFAULT_CONFIG.wave2.arcRotation);
  const [wave2ArcRadius, setWave2ArcRadius] = useState(DEFAULT_CONFIG.wave2.arcRadius);
  const [wave2ArcX, setWave2ArcX] = useState(DEFAULT_CONFIG.wave2.arcX);
  const [wave2ArcY, setWave2ArcY] = useState(DEFAULT_CONFIG.wave2.arcY);
  const [wave2Speed, setWave2Speed] = useState(DEFAULT_CONFIG.wave2.speed);
  const [blendSteps, setBlendSteps] = useState(DEFAULT_CONFIG.global.blendSteps);
  const [sampleCount, setSampleCount] = useState(DEFAULT_CONFIG.global.sampleCount);
  const [lineWidth, setLineWidth] = useState(DEFAULT_CONFIG.global.lineWidth);
  const [showEndpoints, setShowEndpoints] = useState(DEFAULT_CONFIG.global.showEndpoints);
  const [interpolationEnabled, setInterpolationEnabled] = useState(DEFAULT_CONFIG.global.interpolationEnabled);
  const [use2DInterpolate, setUse2DInterpolate] = useState(DEFAULT_CONFIG.global.use2DInterpolate);
  const [showBaselines, setShowBaselines] = useState(DEFAULT_CONFIG.global.showBaselines);
  const [showArcGuides, setShowArcGuides] = useState(DEFAULT_CONFIG.global.showArcGuides);
  const [interactionEnabled, setInteractionEnabled] = useState(DEFAULT_CONFIG.global.interactionEnabled);
  const [interactionRadius, setInteractionRadius] = useState(DEFAULT_CONFIG.global.interactionRadius);
  const [interactionSoftness, setInteractionSoftness] = useState(DEFAULT_CONFIG.global.interactionSoftness);
  const [amplitudeUniformity, setAmplitudeUniformity] = useState(DEFAULT_CONFIG.global.amplitudeUniformity);
  const [wavelengthUniformity, setWavelengthUniformity] = useState(DEFAULT_CONFIG.global.wavelengthUniformity);
  const [sharedSpeedEnabled, setSharedSpeedEnabled] = useState(DEFAULT_CONFIG.global.sharedSpeedEnabled);
  const [speedLockEnabled, setSpeedLockEnabled] = useState(true);
  const [showPhaseDensityDebug, setShowPhaseDensityDebug] = useState(DEFAULT_CONFIG.global.showPhaseDensityDebug);
  const [showAlignmentDebug, setShowAlignmentDebug] = useState(false);
  const [debugTick, setDebugTick] = useState(0);
  const [pointerHudState, setPointerHudState] = useState({ x: 0, y: 0, pseudoProximityIndex: 0, complexityIndex: 100, visible: false });
  const [pointerOverlayEnabled, setPointerOverlayEnabled] = useState(false);
  const [blurStrength, setBlurStrength] = useState(0.22);
  const [blurInnerRadius, setBlurInnerRadius] = useState(0);
  const [blurRadius, setBlurRadius] = useState(984);
  const [blurCenterX, setBlurCenterX] = useState(0.526);
  const [blurCenterY, setBlurCenterY] = useState(0.447);
  const [waveAColorInput, setWaveAColorInput] = useState("#ABA3B8");
  const [waveBColorInput, setWaveBColorInput] = useState("#000000");
  const [focusSharpOffsetX, setFocusSharpOffsetX] = useState(-113);
  const [focusSharpOffsetY, setFocusSharpOffsetY] = useState(-53);
  const [focusSharpScale, setFocusSharpScale] = useState(1.135);
  const blurParamsRef = useRef({ strength: 0.22, innerRadius: 0, radius: 984, centerX: 0.526, centerY: 0.447 });

  const wave1 = useMemo(() => ({ baseAmplitude: wave1BaseAmplitude, ampVariation: wave1AmpVariation, baseWavelength: wave1BaseWavelength, wavelengthVariation: wave1WavelengthVariation, curveAmount: wave1CurveAmount, curveFrequency: wave1CurveFrequency, carrierPhase: wave1CarrierPhase, arcSpan: wave1ArcSpan, arcRotation: wave1ArcRotation, arcRadius: wave1ArcRadius, arcX: wave1ArcX, arcY: wave1ArcY, speed: wave1Speed }), [wave1BaseAmplitude, wave1AmpVariation, wave1BaseWavelength, wave1WavelengthVariation, wave1CurveAmount, wave1CurveFrequency, wave1CarrierPhase, wave1ArcSpan, wave1ArcRotation, wave1ArcRadius, wave1ArcX, wave1ArcY, wave1Speed]);
  const wave2 = useMemo(() => ({ baseAmplitude: wave2BaseAmplitude, ampVariation: wave2AmpVariation, baseWavelength: wave2BaseWavelength, wavelengthVariation: wave2WavelengthVariation, curveAmount: wave2CurveAmount, curveFrequency: wave2CurveFrequency, carrierPhase: wave2CarrierPhase, arcSpan: wave2ArcSpan, arcRotation: wave2ArcRotation, arcRadius: wave2ArcRadius, arcX: wave2ArcX, arcY: wave2ArcY, speed: wave2Speed }), [wave2BaseAmplitude, wave2AmpVariation, wave2BaseWavelength, wave2WavelengthVariation, wave2CurveAmount, wave2CurveFrequency, wave2CarrierPhase, wave2ArcSpan, wave2ArcRotation, wave2ArcRadius, wave2ArcX, wave2ArcY, wave2Speed]);
  const waveAColor = useMemo(() => sanitizeHexColor(waveAColorInput, "#ABA3B8"), [waveAColorInput]);
  const waveBColor = useMemo(() => sanitizeHexColor(waveBColorInput, "#000000"), [waveBColorInput]);
  const displayPseudoProximityIndex = Math.ceil(liveMetricsRef.current.pseudoProximityIndex);
  const displayComplexityIndex = Math.ceil(liveMetricsRef.current.complexityIndex);
  const pointerHudVisible = pointerHudState.visible;
  const pointerHudLeft = pointerHudState.x + 18;
  const pointerHudTop = pointerHudState.y + 18;
  const displayPointerPseudoProximityIndex = Math.ceil(pointerHudState.pseudoProximityIndex);
  const displayPointerComplexityIndex = Math.ceil(pointerHudState.complexityIndex);
  const pointerHudSegments = 16;
  const pointerCuriosityFilled = Math.max(0, Math.min(pointerHudSegments, Math.round((displayPointerPseudoProximityIndex / 100) * pointerHudSegments)));
  const pointerComplexityFilled = Math.max(0, Math.min(pointerHudSegments, Math.round((displayPointerComplexityIndex / 100) * pointerHudSegments)));
  useEffect(() => { motionRef.current.wave1CurrentSpeed = wave1Speed; motionRef.current.wave2CurrentSpeed = wave2Speed; }, [wave1Speed, wave2Speed]);
  useEffect(() => {
    blurParamsRef.current = {
      strength: blurStrength,
      innerRadius: blurInnerRadius,
      radius: blurRadius,
      centerX: blurCenterX,
      centerY: blurCenterY,
    };
  }, [blurStrength, blurInnerRadius, blurRadius, blurCenterX, blurCenterY]);

  useEffect(() => {
    const id = window.setInterval(() => setDebugTick((v) => (v + 1) % 100000), 120);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target;
        const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
        if (tagName === "input" || tagName === "textarea" || (target && target.isContentEditable)) return;
        event.preventDefault();
        setPointerOverlayEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let lastValueUpdate = 0;
    const tick = (time) => {
      setPointerHudState((prev) => {
        const nextVisible = mouseRef.current.inside;
        if (!nextVisible) {
          return prev.visible ? { ...prev, visible: false } : prev;
        }
        const targetX = mouseRef.current.x;
        const targetY = mouseRef.current.y;
        const shouldUpdateValues = time - lastValueUpdate >= 60;
        const targetPseudo = shouldUpdateValues ? Math.max(0, Math.min(100, liveMetricsRef.current.pseudoProximityIndex)) : prev.pseudoProximityIndex;
        const targetComplexity = shouldUpdateValues ? Math.max(0, Math.min(100, liveMetricsRef.current.complexityIndex)) : prev.complexityIndex;
        const positionMix = 0.78;
        const valueMix = 0.16;
        if (shouldUpdateValues) lastValueUpdate = time;
        return {
          x: prev.x + (targetX - prev.x) * positionMix,
          y: prev.y + (targetY - prev.y) * positionMix,
          pseudoProximityIndex: prev.pseudoProximityIndex + (targetPseudo - prev.pseudoProximityIndex) * valueMix,
          complexityIndex: prev.complexityIndex + (targetComplexity - prev.complexityIndex) * valueMix,
          visible: true,
        };
      });
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const host = hostRef.current; if (!host) return undefined;
    const onMove = (event) => {
      const rect = host.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      mouseRef.current = {
        x: localX,
        y: localY,
        inside: localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height,
      };
    };
    const onLeaveWindow = () => { mouseRef.current = { ...mouseRef.current, inside: false }; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let app = null;
    let ro = null;
    let stopTicker = null;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      const { PIXI, ZoomBlurFilter } = await ensurePixiCdnReady();
      if (cancelled || !hostRef.current) return;

      // Initialize one Pixi renderer for the lifetime of the visualization.
      app = new PIXI.Application({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: 1,
      });
      app.ticker.maxFPS = TARGET_FPS;
      host.appendChild(app.view);
      app.view.style.width = "100%";
      app.view.style.height = "100%";
      app.view.style.display = "block";

      const backgroundLayer = new PIXI.Container();
      const blurWaveLayer = new PIXI.Container();
      const blurCutoutLayer = new PIXI.Container();
      const focusSharpLayer = new PIXI.Container();
      const guideLayer = new PIXI.Container();
      app.stage.addChild(backgroundLayer);
      app.stage.addChild(blurWaveLayer);
      app.stage.addChild(blurCutoutLayer);
      app.stage.addChild(focusSharpLayer);
      app.stage.addChild(guideLayer);

      const bgSprite = new PIXI.Sprite();
      const bgCutoutSprite = new PIXI.Sprite();
      backgroundLayer.addChild(bgSprite);
      blurCutoutLayer.addChild(bgCutoutSprite);

      const blurWaveGraphics = new PIXI.Graphics();
      const focusSharpGraphics = new PIXI.Graphics();
      const guideGraphics = new PIXI.Graphics();
      blurWaveLayer.addChild(blurWaveGraphics);
      focusSharpLayer.addChild(focusSharpGraphics);
      guideLayer.addChild(guideGraphics);
      blurWaveLayer.alpha = 1;
      focusSharpLayer.alpha = 1;
      guideLayer.visible = false;

      // The sharp focus reveal is masked by a feathered alpha texture around the pointer.
      const focusMaskCanvas = document.createElement("canvas");
      focusMaskCanvas.width = 512;
      focusMaskCanvas.height = 512;
      const focusMaskCtx = focusMaskCanvas.getContext("2d");
      const focusMaskGradient = focusMaskCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
      const innerStop = FOCUS_REVEAL_RADIUS_PX / (FOCUS_REVEAL_RADIUS_PX + FOCUS_REVEAL_FEATHER_PX);
      focusMaskGradient.addColorStop(0, "rgba(255,255,255,1)");
      focusMaskGradient.addColorStop(Math.max(0, innerStop), "rgba(255,255,255,1)");
      focusMaskGradient.addColorStop(1, "rgba(255,255,255,0)");
      focusMaskCtx.clearRect(0, 0, 512, 512);
      focusMaskCtx.fillStyle = focusMaskGradient;
      focusMaskCtx.fillRect(0, 0, 512, 512);
      const focusMaskTexture = PIXI.Texture.from(focusMaskCanvas);
      const focusMaskSprite = new PIXI.Sprite(focusMaskTexture);
      focusMaskSprite.anchor.set(0.5);
      focusMaskSprite.width = (FOCUS_REVEAL_RADIUS_PX + FOCUS_REVEAL_FEATHER_PX) * 2 * FOCUS_SHARP_MASK_SCALE;
      focusMaskSprite.height = (FOCUS_REVEAL_RADIUS_PX + FOCUS_REVEAL_FEATHER_PX) * 2 * FOCUS_SHARP_MASK_SCALE;
      focusMaskSprite.renderable = false;
      const blurCutoutMaskSprite = new PIXI.Sprite(focusMaskTexture);
      blurCutoutMaskSprite.anchor.set(0.5);
      blurCutoutMaskSprite.width = (FOCUS_REVEAL_RADIUS_PX + FOCUS_REVEAL_FEATHER_PX) * 2 * FOCUS_BLUR_CUTOUT_MASK_SCALE;
      blurCutoutMaskSprite.height = (FOCUS_REVEAL_RADIUS_PX + FOCUS_REVEAL_FEATHER_PX) * 2 * FOCUS_BLUR_CUTOUT_MASK_SCALE;
      blurCutoutMaskSprite.renderable = false;
      app.stage.addChild(blurCutoutMaskSprite);
      app.stage.addChild(focusMaskSprite);
      blurCutoutLayer.mask = blurCutoutMaskSprite;
      focusSharpLayer.mask = focusMaskSprite;
      blurCutoutLayer.visible = false;
      focusSharpLayer.visible = false;

      // Zoom blur is applied only to the reduced-detail blur layer.
      const zoomBlur = new ZoomBlurFilter();
      zoomBlur.strength = blurParamsRef.current.strength;
      zoomBlur.innerRadius = blurParamsRef.current.innerRadius;
      zoomBlur.radius = blurParamsRef.current.radius;
      zoomBlur.resolution = 0.75;
      blurWaveLayer.filters = [zoomBlur];
      const blurFilterArea = new PIXI.Rectangle(0, 0, 1, 1);
      blurWaveLayer.filterArea = blurFilterArea;

      const makeBgTexture = () => {
        const w = Math.max(2, Math.floor(app.screen.width));
        const h = Math.max(2, Math.floor(app.screen.height));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const cctx = c.getContext("2d");
        const g = cctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#15101A");
        g.addColorStop(1, "#2A2433");
        cctx.fillStyle = g;
        cctx.fillRect(0, 0, w, h);
        if (bgSprite.texture) bgSprite.texture.destroy(true);
        bgSprite.texture = PIXI.Texture.from(c);
        bgSprite.width = app.screen.width;
        bgSprite.height = app.screen.height;
        bgCutoutSprite.texture = bgSprite.texture;
        bgCutoutSprite.width = app.screen.width;
        bgCutoutSprite.height = app.screen.height;
      };
      makeBgTexture();

      ro = new ResizeObserver(() => {
        if (!app) return;
        bgSprite.width = app.screen.width;
        bgSprite.height = app.screen.height;
        makeBgTexture();
      });
      ro.observe(host);

      const worldToScreen = (w, h, p) => ({ x: w * 0.5 + p.x * w * 0.18, y: h * 0.5 - p.y * h * 0.18 });
      const drawPolylinePixi = (gfx, points, color, widthPx, alpha = 1) => {
        if (!points || points.length < 2) return;
        gfx.lineStyle(widthPx, color, alpha, 0.5, true);
        gfx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) gfx.lineTo(points[i].x, points[i].y);
      };
      const buildReducedPoints = (points, stride) => {
        if (stride <= 1 || points.length < 3) return points;
        const reduced = [points[0]];
        for (let i = stride; i < points.length - 1; i += stride) reduced.push(points[i]);
        reduced.push(points[points.length - 1]);
        return reduced;
      };

      // The render loop preserves the existing wave logic and only changes the drawing backend.
      const tick = () => {
        const width = app.screen.width;
        const height = app.screen.height;
        const bp = blurParamsRef.current;
        zoomBlur.strength = bp.strength;
        zoomBlur.innerRadius = bp.innerRadius;
        zoomBlur.radius = bp.radius;
        zoomBlur.center = [width * bp.centerX, height * bp.centerY];
        blurFilterArea.x = Math.max(0, width * bp.centerX - bp.radius - 64);
        blurFilterArea.y = Math.max(0, height * bp.centerY - bp.radius - 64);
        blurFilterArea.width = Math.min(width - blurFilterArea.x, bp.radius * 2 + 128);
        blurFilterArea.height = Math.min(height - blurFilterArea.y, bp.radius * 2 + 128);

        const frameNow = performance.now();
        const dt = motionRef.current.lastTime == null ? 1 / 60 : Math.min(0.05, (frameNow - motionRef.current.lastTime) * 0.001);
        motionRef.current.lastTime = frameNow;
        const mouse = { ...mouseRef.current, projectX: (x) => width * 0.5 + x * width * 0.18, projectY: (y) => height * 0.5 - y * height * 0.18 };
        const interaction = { enabled: interactionEnabled, radius: interactionRadius, softness: interactionSoftness, amplitudeStrength: amplitudeUniformity, wavelengthStrength: wavelengthUniformity };
        const sharedAmplitude = 0.5 * (wave1.baseAmplitude + wave2.baseAmplitude);
        const sharedWavelength = 0.5 * (wave1.baseWavelength + wave2.baseWavelength);
        const sharedSpeed = 0.5 * (wave1.speed + wave2.speed);
        const raw1 = buildWaveSamples(sampleCount, motionRef.current.wave1Offset, wave1, 0, mouse, interaction);
        const raw2 = buildWaveSamples(sampleCount, motionRef.current.wave2Offset, wave2, 11, mouse, interaction);
        const adj1 = raw1.map((raw) => waveInteractiveFromRaw(raw, wave1, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, mouse, interaction));
        const adj2 = raw2.map((raw) => waveInteractiveFromRaw(raw, wave2, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, mouse, interaction));
        let weightedOscDiff = 0;
        let weightSum = 0;
        let globalInfluence = 0;
        let carrierSimplificationSum = 0;
        for (let i = 0; i < sampleCount; i += 1) {
          const p1 = adj1[i];
          const p2 = adj2[i];
          const localWeight = Math.max(p1.influence ?? 0, p2.influence ?? 0);
          globalInfluence = Math.max(globalInfluence, localWeight);
          carrierSimplificationSum += 0.5 * ((raw1[i].carrierSimplification ?? 0) + (raw2[i].carrierSimplification ?? 0));
          if (localWeight > 0.0001) {
            weightedOscDiff += Math.abs(p1.osc - p2.osc) * localWeight;
            weightSum += localWeight;
          }
        }
        const indexAlignment = 1 - Math.min(1, (weightSum > 0 ? weightedOscDiff / weightSum : 2) / 2);
        alignmentCacheRef.current.frame += 1;
        const alignmentInterval = mouse.inside && globalInfluence >= 0.15
          ? ALIGNMENT_UPDATE_INTERVAL_ACTIVE
          : ALIGNMENT_UPDATE_INTERVAL_IDLE;
        const shouldRefreshAlignment =
          showAlignmentDebug ||
          alignmentCacheRef.current.frame === 1 ||
          alignmentCacheRef.current.frame % alignmentInterval === 0;
        if (shouldRefreshAlignment) {
          alignmentCacheRef.current.stats = computeScreenSpaceAlignment(adj1, adj2, width, height, interactionRadius);
        }
        const spatialStats = alignmentCacheRef.current.stats;
        const phaseAlignment = spatialStats.alignment;
        const avgCarrierSimplification = carrierSimplificationSum / Math.max(1, sampleCount);
        const points1 = [];
        const points2 = [];
        const base1 = [];
        const base2 = [];
        const arc1 = [];
        const arc2 = [];
        const debug1 = [];
        const debug2 = [];
        for (let i = 0; i < sampleCount; i += 1) {
          const u = i / Math.max(1, sampleCount - 1);
          const p1 = adj1[i];
          const p2 = adj2[i];
          points1.push(worldToScreen(width, height, p1.point));
          points2.push(worldToScreen(width, height, p2.point));
          base1.push(worldToScreen(width, height, baselinePoint(u, wave1, 0, mouse, interaction)));
          base2.push(worldToScreen(width, height, baselinePoint(u, wave2, 11, mouse, interaction)));
          arc1.push(worldToScreen(width, height, arcGuidePoint(u, wave1)));
          arc2.push(worldToScreen(width, height, arcGuidePoint(u, wave2)));
          debug1.push({ ...worldToScreen(width, height, p1.point), density: estimatePhaseDensityFromSamples(raw1, i) });
          debug2.push({ ...worldToScreen(width, height, p2.point), density: estimatePhaseDensityFromSamples(raw2, i) });
        }

        focusSharpGraphics.clear();
        blurWaveGraphics.clear();
        guideGraphics.clear();

        const nearestWaveDistance = mouse.inside
          ? Math.min(
              minDistanceToPolylinePoints(points1, mouse.x, mouse.y),
              minDistanceToPolylinePoints(points2, mouse.x, mouse.y),
            )
          : Infinity;
        const focusLocalMouse = toLocalFocusMouse(mouse, focusSharpOffsetX, focusSharpOffsetY, focusSharpScale);
        const nearestCrestIndex1 = findNearestCrestIndex(adj1, points1, focusLocalMouse);
        const nearestCrestIndex2 = findNearestCrestIndex(adj2, points2, focusLocalMouse);
        let crestAngleDeg = null;
        let crestAngleWave2Deg = null;
        if (nearestCrestIndex1 >= 0 && nearestCrestIndex2 >= 0) {
          const connector = {
            x: points2[nearestCrestIndex2].x - points1[nearestCrestIndex1].x,
            y: points2[nearestCrestIndex2].y - points1[nearestCrestIndex1].y,
          };
          const tangent = tangentFromScreenPoints(points1, nearestCrestIndex1);
          crestAngleDeg = angleBetweenVectorsDeg(tangent, connector);
          const tangentWave2 = tangentFromScreenPoints(points2, nearestCrestIndex2);
          crestAngleWave2Deg = angleBetweenVectorsDeg(tangentWave2, { x: -connector.x, y: -connector.y });
        }
        const crestInfluenceActive =
          interactionEnabled &&
          mouse.inside &&
          globalInfluence >= 0.55 &&
          nearestCrestIndex1 >= 0 &&
          nearestCrestIndex2 >= 0;
        const pseudoProximityIndex = pseudoProximityIndexFromInfluence(globalInfluence);
        const displayedPseudoProximityIndex = Math.ceil(pseudoProximityIndex);
        const pseudoProximityReady = displayedPseudoProximityIndex >= 100;
        const crestAngleInRange =
          crestInfluenceActive &&
          (
            (crestAngleDeg != null &&
              crestAngleDeg >= CREST_LOCK_MIN_ANGLE_DEG &&
              crestAngleDeg <= CREST_LOCK_MAX_ANGLE_DEG) ||
            (crestAngleWave2Deg != null &&
              crestAngleWave2Deg >= CREST_LOCK_MIN_ANGLE_DEG &&
              crestAngleWave2Deg <= CREST_LOCK_MAX_ANGLE_DEG)
          );
        if (!crestInfluenceActive || !pseudoProximityReady || crestAngleDeg == null) {
          lockProgressRef.current = { active: false, initialAngle: null, initialTarget: null, span: null };
        } else if (!lockProgressRef.current.active) {
          const initialTarget = crestAngleDeg > CREST_LOCK_MAX_ANGLE_DEG ? CREST_LOCK_MAX_ANGLE_DEG : crestAngleDeg < CREST_LOCK_MIN_ANGLE_DEG ? 0 : 90;
          const span = Math.max(1e-6, Math.abs(crestAngleDeg - initialTarget));
          lockProgressRef.current = { active: true, initialAngle: crestAngleDeg, initialTarget, span };
        }
        motionRef.current.crestAlignedFrames = crestAngleInRange ? motionRef.current.crestAlignedFrames + 1 : 0;
        if (!sharedSpeedEnabled || !speedLockEnabled || !crestInfluenceActive) motionRef.current.speedLocked = false;
        else if (motionRef.current.crestAlignedFrames >= CREST_LOCK_STABLE_FRAMES) motionRef.current.speedLocked = true;
        const gatedSpeedMix = motionRef.current.speedLocked ? Math.max(globalInfluence, 0.92) : sharedSpeedEnabled ? globalInfluence * Math.max(0, (phaseAlignment - 0.4) / 0.25) * 0.35 : 0;
        const speedResponse = motionRef.current.speedLocked ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 6.5);
        const targetWave1Speed = motionRef.current.speedLocked ? sharedSpeed : lerp(wave1.speed, sharedSpeed, gatedSpeedMix);
        const targetWave2Speed = motionRef.current.speedLocked ? sharedSpeed : lerp(wave2.speed, sharedSpeed, gatedSpeedMix);
        motionRef.current.wave1CurrentSpeed = lerp(motionRef.current.wave1CurrentSpeed, targetWave1Speed, speedResponse);
        motionRef.current.wave2CurrentSpeed = lerp(motionRef.current.wave2CurrentSpeed, targetWave2Speed, speedResponse);
        motionRef.current.wave1Offset += motionRef.current.wave1CurrentSpeed * 0.42 * dt;
        motionRef.current.wave2Offset += motionRef.current.wave2CurrentSpeed * 0.42 * dt;
        const progressInitialAngle = lockProgressRef.current.initialAngle;
        const progressTarget = lockProgressRef.current.initialTarget;
        const progressSpan = lockProgressRef.current.span;
        const progressCurrentTarget =
          crestAngleDeg == null ? null :
          crestAngleDeg > CREST_LOCK_MAX_ANGLE_DEG ? CREST_LOCK_MAX_ANGLE_DEG :
          crestAngleDeg < CREST_LOCK_MIN_ANGLE_DEG ? 0 :
          90;
        const progressCurrentDistance =
          crestAngleDeg == null || progressCurrentTarget == null ? null :
          Math.abs(crestAngleDeg - progressCurrentTarget);
        const lockProgressPercent =
          motionRef.current.speedLocked ? 100 :
          !crestInfluenceActive || !pseudoProximityReady || progressInitialAngle == null || progressSpan == null || progressCurrentDistance == null ? 0 :
          clamp((1 - progressCurrentDistance / progressSpan) * 100, 0, 100);
        const displayedLockProgressPercent = Math.ceil(lockProgressPercent);
        const complexityIndex = 100 - (displayedLockProgressPercent / 2 + displayedPseudoProximityIndex / 2);
        liveMetricsRef.current = { wave1Speed: motionRef.current.wave1CurrentSpeed, wave2Speed: motionRef.current.wave2CurrentSpeed, sharedSpeed, speedMix: gatedSpeedMix, spatialAlignment: phaseAlignment, indexAlignment, influence: globalInfluence, pseudoProximityIndex, complexityIndex, speedLocked: motionRef.current.speedLocked ? 1 : 0, alignmentPairs: spatialStats.pairs, avgPairDistance: spatialStats.avgDistance, avgCarrierSimplification, crestAngleDeg, crestAngleWave2Deg, crestAlignedFrames: motionRef.current.crestAlignedFrames, crestInRange: crestAngleInRange ? 1 : 0, lockProgressInitialAngle: progressInitialAngle, lockProgressTarget: progressTarget, lockProgressCurrentTarget: progressCurrentTarget, lockProgressSpan: progressSpan, lockProgressCurrentDistance: progressCurrentDistance, lockProgressPercent };
        const clampedDistance = Math.max(DYNAMIC_BLEND_NEAR_PX, Math.min(DYNAMIC_BLEND_FAR_PX, nearestWaveDistance));
        const proximityMix = 1 - (clampedDistance - DYNAMIC_BLEND_NEAR_PX) / Math.max(1, DYNAMIC_BLEND_FAR_PX - DYNAMIC_BLEND_NEAR_PX);
        const focusBlendSteps = Math.round(lerp(blendSteps, DYNAMIC_BLEND_MIN_STEPS, proximityMix));
        const blurBlendSteps = blendSteps;
        const focusRevealActive = mouse.inside && globalInfluence >= FOCUS_TRIGGER_INFLUENCE && nearestWaveDistance <= interactionRadius;
        blurCutoutLayer.visible = focusRevealActive;
        focusSharpLayer.visible = focusRevealActive;
        focusSharpLayer.position.set(focusSharpOffsetX, focusSharpOffsetY);
        focusSharpLayer.scale.set(focusSharpScale, focusSharpScale);
        focusMaskSprite.position.set(mouse.x, mouse.y);
        blurCutoutMaskSprite.position.set(mouse.x, mouse.y);

        if (showArcGuides) {
          drawPolylinePixi(guideGraphics, arc1, 0xffffff, 1.1, 0.22);
          drawPolylinePixi(guideGraphics, arc2, 0xffffff, 1.1, 0.22);
        }
        if (showBaselines) {
          drawPolylinePixi(guideGraphics, base1, 0xffffff, 1.2, 0.28);
          drawPolylinePixi(guideGraphics, base2, 0xffffff, 1.2, 0.28);
        }
        if (showPhaseDensityDebug) {
          for (let i = 0; i < debug1.length; i += 4) {
            for (const item of [debug1[i], debug2[i]]) {
              const hot = Math.max(0, Math.min(1, (item.density - 6) / 10));
              if (hot <= 0) continue;
              guideGraphics.beginFill(0xff5050, 0.15 + hot * 0.6);
              guideGraphics.drawCircle(item.x, item.y, 2.5 + hot * 2.5);
              guideGraphics.endFill();
            }
          }
        }
        if (showAlignmentDebug) {
          for (const line of spatialStats.pairLines) {
            const closeness = 1 - Math.min(1, line.dist / Math.max(1, spatialStats.maxDistance));
            drawPolylinePixi(guideGraphics, [{ x: line.ax, y: line.ay }, { x: line.bx, y: line.by }], 0x78dcff, 1, 0.12 + closeness * 0.35);
          }
        }
        if (interpolationEnabled) {
          const blurTotalLines = blurBlendSteps + 2;
          const focusTotalLines = focusBlendSteps + 2;
          const blurLineStride = BLUR_RENDER_LINE_STRIDE;
          const blurPointStride = BLUR_RENDER_POINT_STRIDE;
          const reducedPoints1 = buildReducedPoints(points1, blurPointStride);
          const reducedPoints2 = buildReducedPoints(points2, blurPointStride);
          for (let lineIndex = 0; lineIndex < blurTotalLines; lineIndex += 1) {
            const raw = lineIndex / Math.max(1, blurTotalLines - 1);
            const eased = easeInOut(raw);
            const shouldDraw = showEndpoints || (raw !== 0 && raw !== 1);
            if (!shouldDraw) continue;
            const endpointAlpha = raw === 0 || raw === 1 ? 1 : 0.88;
            const widthBoost = raw === 0 || raw === 1 ? 0.3 : 0;
            const color = blendColorInt(waveAColor, waveBColor, raw);
            if (lineIndex % blurLineStride === 0) {
              const blurPts = [];
              for (let i = 0; i < reducedPoints1.length; i += 1) {
                blurPts.push({
                  x: lerp(reducedPoints1[i].x, reducedPoints2[i].x, use2DInterpolate ? eased : raw),
                  y: lerp(reducedPoints1[i].y, reducedPoints2[i].y, eased),
                });
              }
              drawPolylinePixi(blurWaveGraphics, blurPts, color, lineWidth + widthBoost + 0.75, 0.55);
            }
          }
          if (focusRevealActive) {
            for (let lineIndex = 0; lineIndex < focusTotalLines; lineIndex += 1) {
              const raw = lineIndex / Math.max(1, focusTotalLines - 1);
              const eased = easeInOut(raw);
              const shouldDraw = showEndpoints || (raw !== 0 && raw !== 1);
              if (!shouldDraw) continue;
              const endpointAlpha = raw === 0 || raw === 1 ? 1 : 0.88;
              const widthBoost = raw === 0 || raw === 1 ? 0.3 : 0;
              const color = blendColorInt(waveAColor, waveBColor, raw);
              const sharpPts = [];
              for (let i = 0; i < sampleCount; i += 1) {
                sharpPts.push({
                  x: lerp(points1[i].x, points2[i].x, use2DInterpolate ? eased : raw),
                  y: lerp(points1[i].y, points2[i].y, eased),
                });
              }
              drawPolylinePixi(focusSharpGraphics, sharpPts, color, lineWidth + widthBoost, endpointAlpha);
            }
          }
        } else if (showEndpoints) {
          if (focusRevealActive) {
            drawPolylinePixi(focusSharpGraphics, points1, parseInt(waveAColor.slice(1), 16), lineWidth + 0.3, 1);
            drawPolylinePixi(focusSharpGraphics, points2, parseInt(waveBColor.slice(1), 16), lineWidth + 0.3, 1);
          }
          drawPolylinePixi(blurWaveGraphics, points1, parseInt(waveAColor.slice(1), 16), lineWidth + 0.9, 0.55);
          drawPolylinePixi(blurWaveGraphics, points2, parseInt(waveBColor.slice(1), 16), lineWidth + 0.9, 0.55);
        }
      };

      app.ticker.add(tick);
      stopTicker = () => app.ticker.remove(tick);
    })().catch((error) => {
      console.error("PIXI init failed", error);
    });

    return () => {
      cancelled = true;
      if (stopTicker) stopTicker();
      if (ro) ro.disconnect();
      motionRef.current.lastTime = null;
      if (app) app.destroy(true, { children: true, texture: true, baseTexture: true });
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [wave1, wave2, waveAColor, waveBColor, blendSteps, sampleCount, lineWidth, showEndpoints, interpolationEnabled, use2DInterpolate, showBaselines, showArcGuides, interactionEnabled, interactionRadius, interactionSoftness, amplitudeUniformity, wavelengthUniformity, sharedSpeedEnabled, speedLockEnabled, showPhaseDensityDebug, showAlignmentDebug, focusSharpOffsetX, focusSharpOffsetY, focusSharpScale]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 relative cursor-none">
      <div ref={hostRef} className="h-full w-full block" />
      <div className="absolute top-4 left-4 z-20 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 backdrop-blur">
        <div className="text-sm font-semibold mb-2">Zoom Blur</div>
        <div className="space-y-2 text-xs">
          <label className="block">strength {blurStrength.toFixed(3)}<input className="w-full" type="range" min="0" max="0.6" step="0.005" value={blurStrength} onChange={(e) => setBlurStrength(Number(e.target.value))} /></label>
          <label className="block">innerRadius {Math.round(blurInnerRadius)}<input className="w-full" type="range" min="0" max="500" step="1" value={blurInnerRadius} onChange={(e) => setBlurInnerRadius(Number(e.target.value))} /></label>
          <label className="block">radius {Math.round(blurRadius)}<input className="w-full" type="range" min="50" max="1800" step="1" value={blurRadius} onChange={(e) => setBlurRadius(Number(e.target.value))} /></label>
          <label className="block">centerX {blurCenterX.toFixed(3)}<input className="w-full" type="range" min="0" max="1" step="0.001" value={blurCenterX} onChange={(e) => setBlurCenterX(Number(e.target.value))} /></label>
          <label className="block">centerY {blurCenterY.toFixed(3)}<input className="w-full" type="range" min="0" max="1" step="0.001" value={blurCenterY} onChange={(e) => setBlurCenterY(Number(e.target.value))} /></label>
          <label className="block">sharpOffsetX {focusSharpOffsetX.toFixed(0)}<input className="w-full" type="range" min="-400" max="400" step="1" value={focusSharpOffsetX} onChange={(e) => setFocusSharpOffsetX(Number(e.target.value))} /></label>
          <label className="block">sharpOffsetY {focusSharpOffsetY.toFixed(0)}<input className="w-full" type="range" min="-400" max="400" step="1" value={focusSharpOffsetY} onChange={(e) => setFocusSharpOffsetY(Number(e.target.value))} /></label>
          <label className="block">sharpScale {focusSharpScale.toFixed(3)}<input className="w-full" type="range" min="0.7" max="1.5" step="0.005" value={focusSharpScale} onChange={(e) => setFocusSharpScale(Number(e.target.value))} /></label>
          <label className="flex items-center justify-between gap-3 pt-1">
            <span>speedLock</span>
            <input type="checkbox" checked={speedLockEnabled} onChange={(e) => setSpeedLockEnabled(e.target.checked)} />
          </label>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="text-sm font-semibold mb-2">Wave 1</div>
          <div className="space-y-2 text-xs">
            <label className="block">amplitude {wave1BaseAmplitude.toFixed(3)}<input className="w-full" type="range" min="0.02" max="0.45" step="0.01" value={wave1BaseAmplitude} onChange={(e) => setWave1BaseAmplitude(Number(e.target.value))} /></label>
            <label className="block">amplitudeVariation {wave1AmpVariation.toFixed(3)}<input className="w-full" type="range" min="0" max="2.2" step="0.01" value={wave1AmpVariation} onChange={(e) => setWave1AmpVariation(Number(e.target.value))} /></label>
            <label className="block">frequency {wave1BaseWavelength.toFixed(3)}<input className="w-full" type="range" min="0.2" max="4" step="0.01" value={wave1BaseWavelength} onChange={(e) => setWave1BaseWavelength(Number(e.target.value))} /></label>
            <label className="block">frequencyVariation {wave1WavelengthVariation.toFixed(3)}<input className="w-full" type="range" min="0" max="2.2" step="0.01" value={wave1WavelengthVariation} onChange={(e) => setWave1WavelengthVariation(Number(e.target.value))} /></label>
            <label className="block">curveAmount {wave1CurveAmount.toFixed(3)}<input className="w-full" type="range" min="0" max="0.5" step="0.01" value={wave1CurveAmount} onChange={(e) => setWave1CurveAmount(Number(e.target.value))} /></label>
            <label className="block">curveFrequency {wave1CurveFrequency.toFixed(3)}<input className="w-full" type="range" min="0.2" max="12" step="0.05" value={wave1CurveFrequency} onChange={(e) => setWave1CurveFrequency(Number(e.target.value))} /></label>
            <label className="block">arcness {wave1ArcSpan.toFixed(3)}<input className="w-full" type="range" min="0.01" max="1" step="0.01" value={wave1ArcSpan} onChange={(e) => setWave1ArcSpan(Number(e.target.value))} /></label>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="text-sm font-semibold mb-2">Wave 2</div>
          <div className="space-y-2 text-xs">
            <label className="block">amplitude {wave2BaseAmplitude.toFixed(3)}<input className="w-full" type="range" min="0.02" max="0.45" step="0.01" value={wave2BaseAmplitude} onChange={(e) => setWave2BaseAmplitude(Number(e.target.value))} /></label>
            <label className="block">amplitudeVariation {wave2AmpVariation.toFixed(3)}<input className="w-full" type="range" min="0" max="2.2" step="0.01" value={wave2AmpVariation} onChange={(e) => setWave2AmpVariation(Number(e.target.value))} /></label>
            <label className="block">frequency {wave2BaseWavelength.toFixed(3)}<input className="w-full" type="range" min="0.2" max="4" step="0.01" value={wave2BaseWavelength} onChange={(e) => setWave2BaseWavelength(Number(e.target.value))} /></label>
            <label className="block">frequencyVariation {wave2WavelengthVariation.toFixed(3)}<input className="w-full" type="range" min="0" max="2.2" step="0.01" value={wave2WavelengthVariation} onChange={(e) => setWave2WavelengthVariation(Number(e.target.value))} /></label>
            <label className="block">curveAmount {wave2CurveAmount.toFixed(3)}<input className="w-full" type="range" min="0" max="0.5" step="0.01" value={wave2CurveAmount} onChange={(e) => setWave2CurveAmount(Number(e.target.value))} /></label>
            <label className="block">curveFrequency {wave2CurveFrequency.toFixed(3)}<input className="w-full" type="range" min="0.2" max="12" step="0.05" value={wave2CurveFrequency} onChange={(e) => setWave2CurveFrequency(Number(e.target.value))} /></label>
            <label className="block">arcness {wave2ArcSpan.toFixed(3)}<input className="w-full" type="range" min="0.01" max="1" step="0.01" value={wave2ArcSpan} onChange={(e) => setWave2ArcSpan(Number(e.target.value))} /></label>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="text-sm font-semibold mb-2">Endpoint Colors</div>
          <div className="space-y-2 text-xs">
            <label className="block">
              <div className="mb-1">Wave A</div>
              <input className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100" type="text" value={waveAColorInput} onChange={(e) => setWaveAColorInput(e.target.value)} />
            </label>
            <label className="block">
              <div className="mb-1">Wave B</div>
              <input className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100" type="text" value={waveBColorInput} onChange={(e) => setWaveBColorInput(e.target.value)} />
            </label>
          </div>
        </div>
      </div>
      <div className="absolute top-4 left-[19rem] z-20 w-80 rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 backdrop-blur">
        <div className="text-sm font-semibold mb-2">Speed / Phase Debug</div>
        <div className="space-y-1 text-xs tabular-nums">
          <div>tick {debugTick}</div>
          <div>influence {liveMetricsRef.current.influence.toFixed(3)}</div>
          <div>pseudoProximityIndex {displayPseudoProximityIndex}</div>
          <div>complexityIndex {displayComplexityIndex}</div>
          <div>indexAlignment {liveMetricsRef.current.indexAlignment.toFixed(3)}</div>
          <div>spatialAlignment {liveMetricsRef.current.spatialAlignment.toFixed(3)}</div>
          <div>crestInRange {liveMetricsRef.current.crestInRange ? "yes" : "no"}</div>
          <div>crestAlignedFrames {liveMetricsRef.current.crestAlignedFrames}</div>
          <div>alignmentPairs {liveMetricsRef.current.alignmentPairs}</div>
          <div>avgPairDistance {liveMetricsRef.current.avgPairDistance.toFixed(3)}</div>
          <div>crestAngleDeg {liveMetricsRef.current.crestAngleDeg == null ? "n/a" : liveMetricsRef.current.crestAngleDeg.toFixed(2)}</div>
          <div>crestAngleWave2Deg {liveMetricsRef.current.crestAngleWave2Deg == null ? "n/a" : liveMetricsRef.current.crestAngleWave2Deg.toFixed(2)}</div>
          <div>lockProgressInitialAngle {liveMetricsRef.current.lockProgressInitialAngle == null ? "n/a" : liveMetricsRef.current.lockProgressInitialAngle.toFixed(2)}</div>
          <div>lockProgressTarget {liveMetricsRef.current.lockProgressTarget == null ? "n/a" : liveMetricsRef.current.lockProgressTarget.toFixed(2)}</div>
          <div>lockProgressCurrentTarget {liveMetricsRef.current.lockProgressCurrentTarget == null ? "n/a" : liveMetricsRef.current.lockProgressCurrentTarget.toFixed(2)}</div>
          <div>lockProgressSpan {liveMetricsRef.current.lockProgressSpan == null ? "n/a" : liveMetricsRef.current.lockProgressSpan.toFixed(2)}</div>
          <div>lockProgressCurrentDistance {liveMetricsRef.current.lockProgressCurrentDistance == null ? "n/a" : liveMetricsRef.current.lockProgressCurrentDistance.toFixed(2)}</div>
          <div>lockProgressPercent {liveMetricsRef.current.lockProgressPercent.toFixed(1)}%</div>
          <div>speedLocked {liveMetricsRef.current.speedLocked ? "yes" : "no"}</div>
          <div>speedMix {liveMetricsRef.current.speedMix.toFixed(3)}</div>
          <div>wave1Speed {liveMetricsRef.current.wave1Speed.toFixed(4)}</div>
          <div>wave2Speed {liveMetricsRef.current.wave2Speed.toFixed(4)}</div>
          <div>sharedSpeed {liveMetricsRef.current.sharedSpeed.toFixed(4)}</div>
          <div>avgCarrierSimplification {liveMetricsRef.current.avgCarrierSimplification.toFixed(3)}</div>
        </div>
      </div>
      {pointerHudVisible ? (
        <>
        <div
          className="pointer-events-none absolute z-20"
          style={{ left: `${pointerHudState.x}px`, top: `${pointerHudState.y}px` }}
        >
          <img
            src="Assets/Arrow-2.png"
            alt=""
            className="block h-6 w-6 object-contain drop-shadow-[0_0_12px_rgba(211,154,252,0.28)]"
            draggable={false}
          />
        </div>
        {pointerOverlayEnabled ? (
        <div
          className="pointer-events-none absolute z-20 -ml-6 mt-[0.875rem] text-[#d39afc]"
          style={{ left: `${pointerHudState.x}px`, top: `${pointerHudState.y}px` }}
        >
          <div className="flex items-center gap-3 text-[22px] leading-none font-light tracking-[-0.03em]">
            <span className="inline-block w-[120px] text-right">Curiosity</span>
            <div className="flex items-center justify-start gap-[2px] text-[19px] leading-none min-w-[124px]">
              {Array.from({ length: pointerHudSegments }, (_, i) => (
                <span key={`curiosity-${i}`} className={i < pointerCuriosityFilled ? "text-[#d39afc]" : "text-[#6f6877]"}>|</span>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[22px] leading-none font-light tracking-[-0.03em]">
            <span className="inline-block w-[120px] text-right">Complexity</span>
            <div className="flex items-center justify-start gap-[2px] text-[19px] leading-none min-w-[124px]">
              {Array.from({ length: pointerHudSegments }, (_, i) => (
                <span key={`complexity-${i}`} className={i < pointerComplexityFilled ? "text-[#d39afc]" : "text-[#6f6877]"}>|</span>
              ))}
            </div>
          </div>
        </div>
        ) : null}
        </>
      ) : null}
      {!pointerOverlayEnabled ? (
        <div className="pointer-events-none absolute bottom-6 right-6 z-20 text-xs text-white/30">
          Press / to find how curiosity &amp; complexity are related
        </div>
      ) : null}
    </div>
  );
}

const rootEl = document.getElementById("app");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(ProceduralWaveBlendDemo));
}
