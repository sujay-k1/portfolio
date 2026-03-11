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
  wave1: { baseAmplitude: 0.26, ampVariation: 0.25, baseWavelength: 1.14, wavelengthVariation: 0.51, curveAmount: 0.18, curveFrequency: 4.45, carrierPhase: 0, arcSpan: 0.18, arcRotation: -0.54, arcRadius: 6.66, arcX: -4.64, arcY: 2.68, speed: 0.65 },
  wave2: { baseAmplitude: 0.22, ampVariation: 1.29, baseWavelength: 0.74, wavelengthVariation: 1.65, curveAmount: 0.15, curveFrequency: 5.15, carrierPhase: 1.58, arcSpan: 0.19, arcRotation: -0.52, arcRadius: 6.61, arcX: -4.1, arcY: 2.31, speed: 0.9 },
  global: { blendSteps: 100, sampleCount: 220, lineWidth: 0.5, showEndpoints: true, interpolationEnabled: true, use2DInterpolate: false, showBaselines: true, showArcGuides: true, interactionEnabled: true, interactionRadius: 880, interactionSoftness: 0.88, amplitudeUniformity: 1, wavelengthUniformity: 1, sharedSpeedEnabled: true, showPhaseDensityDebug: false }
};

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

function ProceduralWaveBlendDemo() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, inside: false });
  const rafRef = useRef(0);
  const motionRef = useRef({ lastTime: null, wave1Offset: 0, wave2Offset: 0, wave1CurrentSpeed: 0.65, wave2CurrentSpeed: 0.9, speedLocked: false, episodePeakAlignment: 0, nearPeakFrames: 0, interactionEpisodeActive: false });

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
  const [showPhaseDensityDebug, setShowPhaseDensityDebug] = useState(DEFAULT_CONFIG.global.showPhaseDensityDebug);
  const [showAlignmentDebug, setShowAlignmentDebug] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [configJson, setConfigJson] = useState("");
  const [configMessage, setConfigMessage] = useState("Ready");
  const [liveMetrics, setLiveMetrics] = useState({ wave1Speed: 0.65, wave2Speed: 0.9, sharedSpeed: 0.775, speedMix: 0, spatialAlignment: 0, indexAlignment: 0, influence: 0, speedLocked: 0, alignmentPairs: 0, avgPairDistance: 0, episodePeakAlignment: 0, nearPeakFrames: 0, avgCarrierSimplification: 0 });

  const wave1 = useMemo(() => ({ baseAmplitude: wave1BaseAmplitude, ampVariation: wave1AmpVariation, baseWavelength: wave1BaseWavelength, wavelengthVariation: wave1WavelengthVariation, curveAmount: wave1CurveAmount, curveFrequency: wave1CurveFrequency, carrierPhase: wave1CarrierPhase, arcSpan: wave1ArcSpan, arcRotation: wave1ArcRotation, arcRadius: wave1ArcRadius, arcX: wave1ArcX, arcY: wave1ArcY, speed: wave1Speed }), [wave1BaseAmplitude, wave1AmpVariation, wave1BaseWavelength, wave1WavelengthVariation, wave1CurveAmount, wave1CurveFrequency, wave1CarrierPhase, wave1ArcSpan, wave1ArcRotation, wave1ArcRadius, wave1ArcX, wave1ArcY, wave1Speed]);
  const wave2 = useMemo(() => ({ baseAmplitude: wave2BaseAmplitude, ampVariation: wave2AmpVariation, baseWavelength: wave2BaseWavelength, wavelengthVariation: wave2WavelengthVariation, curveAmount: wave2CurveAmount, curveFrequency: wave2CurveFrequency, carrierPhase: wave2CarrierPhase, arcSpan: wave2ArcSpan, arcRotation: wave2ArcRotation, arcRadius: wave2ArcRadius, arcX: wave2ArcX, arcY: wave2ArcY, speed: wave2Speed }), [wave2BaseAmplitude, wave2AmpVariation, wave2BaseWavelength, wave2WavelengthVariation, wave2CurveAmount, wave2CurveFrequency, wave2CarrierPhase, wave2ArcSpan, wave2ArcRotation, wave2ArcRadius, wave2ArcX, wave2ArcY, wave2Speed]);
  const currentConfig = useMemo(() => ({ wave1, wave2, global: { blendSteps, sampleCount, lineWidth, showEndpoints, interpolationEnabled, use2DInterpolate, showBaselines, showArcGuides, interactionEnabled, interactionRadius, interactionSoftness, amplitudeUniformity, wavelengthUniformity, sharedSpeedEnabled, showPhaseDensityDebug } }), [wave1, wave2, blendSteps, sampleCount, lineWidth, showEndpoints, interpolationEnabled, use2DInterpolate, showBaselines, showArcGuides, interactionEnabled, interactionRadius, interactionSoftness, amplitudeUniformity, wavelengthUniformity, sharedSpeedEnabled, showPhaseDensityDebug]);

  useEffect(() => { setConfigJson(JSON.stringify(currentConfig, null, 2)); }, [currentConfig]);
  useEffect(() => { motionRef.current.wave1CurrentSpeed = wave1Speed; motionRef.current.wave2CurrentSpeed = wave2Speed; }, [wave1Speed, wave2Speed]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return undefined;
    const onMove = (event) => { const rect = canvas.getBoundingClientRect(); mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, inside: true }; };
    const onLeave = () => { mouseRef.current = { ...mouseRef.current, inside: false }; };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerleave", onLeave);
    return () => { canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return undefined;
    const ctx = canvas.getContext("2d"); if (!ctx) return undefined;
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); const rect = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.floor(rect.width * dpr)); canvas.height = Math.max(1, Math.floor(rect.height * dpr)); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); const ro = new ResizeObserver(resize); ro.observe(canvas);
    const drawPolyline = (points, strokeStyle, widthPx, alpha = 1) => { if (points.length < 2) return; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y); ctx.globalAlpha = alpha; ctx.strokeStyle = strokeStyle; ctx.lineWidth = widthPx; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke(); ctx.globalAlpha = 1; };
    const worldToScreen = (w, h, p) => ({ x: w * 0.5 + p.x * w * 0.18, y: h * 0.5 - p.y * h * 0.18 });

    const render = (now) => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      const dt = motionRef.current.lastTime == null ? 1 / 60 : Math.min(0.05, (now - motionRef.current.lastTime) * 0.001);
      motionRef.current.lastTime = now;
      const bg = ctx.createLinearGradient(0, 0, width, height); bg.addColorStop(0, "#3b1d57"); bg.addColorStop(1, "#2a0d54"); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
      const mouse = { ...mouseRef.current, projectX: (x) => width * 0.5 + x * width * 0.18, projectY: (y) => height * 0.5 - y * height * 0.18 };
      const interaction = { enabled: interactionEnabled, radius: interactionRadius, softness: interactionSoftness, amplitudeStrength: amplitudeUniformity, wavelengthStrength: wavelengthUniformity };
      const sharedAmplitude = 0.5 * (wave1.baseAmplitude + wave2.baseAmplitude), sharedWavelength = 0.5 * (wave1.baseWavelength + wave2.baseWavelength), sharedSpeed = 0.5 * (wave1.speed + wave2.speed);
      const raw1 = buildWaveSamples(sampleCount, motionRef.current.wave1Offset, wave1, 0, mouse, interaction);
      const raw2 = buildWaveSamples(sampleCount, motionRef.current.wave2Offset, wave2, 11, mouse, interaction);
      const adj1 = raw1.map((raw) => waveInteractiveFromRaw(raw, wave1, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, mouse, interaction));
      const adj2 = raw2.map((raw) => waveInteractiveFromRaw(raw, wave2, { amplitude: sharedAmplitude, wavelength: sharedWavelength }, mouse, interaction));
      let weightedOscDiff = 0, weightSum = 0, globalInfluence = 0, carrierSimplificationSum = 0;
      for (let i = 0; i < sampleCount; i += 1) {
        const p1 = adj1[i], p2 = adj2[i], localWeight = Math.max(p1.influence ?? 0, p2.influence ?? 0);
        globalInfluence = Math.max(globalInfluence, localWeight);
        carrierSimplificationSum += 0.5 * ((raw1[i].carrierSimplification ?? 0) + (raw2[i].carrierSimplification ?? 0));
        if (localWeight > 0.0001) { weightedOscDiff += Math.abs(p1.osc - p2.osc) * localWeight; weightSum += localWeight; }
      }
      const indexAlignment = 1 - Math.min(1, (weightSum > 0 ? weightedOscDiff / weightSum : 2) / 2);
      const spatialStats = computeScreenSpaceAlignment(adj1, adj2, width, height, interactionRadius);
      const phaseAlignment = spatialStats.alignment;
      const avgCarrierSimplification = carrierSimplificationSum / Math.max(1, sampleCount);
      const peakEpsilon = 0.02, unlockDrop = 0.06, stabilityFramesRequired = 8, minInfluence = 0.88, minPairs = Math.max(80, Math.floor(sampleCount * 0.45)), maxAvgPairDistance = 130;
      const episodeIsActive = globalInfluence >= 0.55 && interactionEnabled && mouse.inside;
      if (!episodeIsActive) { motionRef.current.interactionEpisodeActive = false; motionRef.current.episodePeakAlignment = 0; motionRef.current.nearPeakFrames = 0; }
      else {
        if (!motionRef.current.interactionEpisodeActive) { motionRef.current.interactionEpisodeActive = true; motionRef.current.episodePeakAlignment = phaseAlignment; motionRef.current.nearPeakFrames = 0; }
        else motionRef.current.episodePeakAlignment = Math.max(motionRef.current.episodePeakAlignment, phaseAlignment);
        const nearPeak = phaseAlignment >= motionRef.current.episodePeakAlignment - peakEpsilon && globalInfluence >= minInfluence && spatialStats.pairs >= minPairs && spatialStats.avgDistance <= maxAvgPairDistance;
        motionRef.current.nearPeakFrames = nearPeak ? motionRef.current.nearPeakFrames + 1 : 0;
      }
      const shouldLock = sharedSpeedEnabled && episodeIsActive && motionRef.current.nearPeakFrames >= stabilityFramesRequired;
      const shouldUnlock = !sharedSpeedEnabled || !episodeIsActive || phaseAlignment < motionRef.current.episodePeakAlignment - unlockDrop || spatialStats.pairs < Math.max(30, Math.floor(minPairs * 0.4));
      if (shouldLock) motionRef.current.speedLocked = true; else if (shouldUnlock) motionRef.current.speedLocked = false;
      const gatedSpeedMix = motionRef.current.speedLocked ? Math.max(globalInfluence, 0.92) : sharedSpeedEnabled ? globalInfluence * Math.max(0, (phaseAlignment - 0.4) / 0.25) * 0.35 : 0;
      const speedResponse = motionRef.current.speedLocked ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 6.5);
      const targetWave1Speed = motionRef.current.speedLocked ? sharedSpeed : lerp(wave1.speed, sharedSpeed, gatedSpeedMix);
      const targetWave2Speed = motionRef.current.speedLocked ? sharedSpeed : lerp(wave2.speed, sharedSpeed, gatedSpeedMix);
      motionRef.current.wave1CurrentSpeed = lerp(motionRef.current.wave1CurrentSpeed, targetWave1Speed, speedResponse);
      motionRef.current.wave2CurrentSpeed = lerp(motionRef.current.wave2CurrentSpeed, targetWave2Speed, speedResponse);
      motionRef.current.wave1Offset += motionRef.current.wave1CurrentSpeed * 0.42 * dt; motionRef.current.wave2Offset += motionRef.current.wave2CurrentSpeed * 0.42 * dt;
      setLiveMetrics((prev) => {
        const next = { wave1Speed: motionRef.current.wave1CurrentSpeed, wave2Speed: motionRef.current.wave2CurrentSpeed, sharedSpeed, speedMix: gatedSpeedMix, spatialAlignment: phaseAlignment, indexAlignment, influence: globalInfluence, speedLocked: motionRef.current.speedLocked ? 1 : 0, alignmentPairs: spatialStats.pairs, avgPairDistance: spatialStats.avgDistance, episodePeakAlignment: motionRef.current.episodePeakAlignment, nearPeakFrames: motionRef.current.nearPeakFrames, avgCarrierSimplification };
        const changed = Object.keys(next).some((k) => Math.abs((prev[k] ?? 0) - next[k]) > 0.001); return changed ? next : prev;
      });
      const points1 = [], points2 = [], base1 = [], base2 = [], arc1 = [], arc2 = [], debug1 = [], debug2 = [];
      for (let i = 0; i < sampleCount; i += 1) {
        const u = i / Math.max(1, sampleCount - 1), p1 = adj1[i], p2 = adj2[i];
        points1.push(worldToScreen(width, height, p1.point)); points2.push(worldToScreen(width, height, p2.point));
        base1.push(worldToScreen(width, height, baselinePoint(u, wave1, 0, mouse, interaction))); base2.push(worldToScreen(width, height, baselinePoint(u, wave2, 11, mouse, interaction)));
        arc1.push(worldToScreen(width, height, arcGuidePoint(u, wave1))); arc2.push(worldToScreen(width, height, arcGuidePoint(u, wave2)));
        debug1.push({ ...worldToScreen(width, height, p1.point), density: estimatePhaseDensityFromSamples(raw1, i) }); debug2.push({ ...worldToScreen(width, height, p2.point), density: estimatePhaseDensityFromSamples(raw2, i) });
      }
      if (showArcGuides) { drawPolyline(arc1, "rgba(255,255,255,0.22)", 1.1, 1); drawPolyline(arc2, "rgba(255,255,255,0.22)", 1.1, 1); }
      if (showBaselines) { ctx.setLineDash([6, 6]); drawPolyline(base1, "rgba(255,255,255,0.28)", 1.2, 1); drawPolyline(base2, "rgba(255,255,255,0.28)", 1.2, 1); ctx.setLineDash([]); }
      if (showPhaseDensityDebug) {
        for (let i = 0; i < debug1.length; i += 4) for (const item of [debug1[i], debug2[i]]) { const hot = Math.max(0, Math.min(1, (item.density - 6) / 10)); if (hot <= 0) continue; ctx.beginPath(); ctx.arc(item.x, item.y, 2.5 + hot * 2.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,80,80,${0.15 + hot * 0.6})`; ctx.fill(); }
      }
      if (showAlignmentDebug) {
        for (const line of spatialStats.pairLines) { const closeness = 1 - Math.min(1, line.dist / Math.max(1, spatialStats.maxDistance)); ctx.beginPath(); ctx.moveTo(line.ax, line.ay); ctx.lineTo(line.bx, line.by); ctx.strokeStyle = `rgba(120,220,255,${0.12 + closeness * 0.35})`; ctx.lineWidth = 1; ctx.stroke(); }
      }
      if (interpolationEnabled) {
        const totalLines = blendSteps + 2;
        for (let lineIndex = 0; lineIndex < totalLines; lineIndex += 1) {
          const raw = lineIndex / Math.max(1, totalLines - 1), eased = easeInOut(raw), pts = [];
          for (let i = 0; i < sampleCount; i += 1) pts.push({ x: lerp(points1[i].x, points2[i].x, use2DInterpolate ? eased : raw), y: lerp(points1[i].y, points2[i].y, eased) });
          const color = blendColor("#c85cff", "#9db300", raw), endpointAlpha = raw === 0 || raw === 1 ? 1 : 0.88, widthBoost = raw === 0 || raw === 1 ? 0.3 : 0, shouldDraw = showEndpoints || (raw !== 0 && raw !== 1);
          if (shouldDraw) drawPolyline(pts, color, lineWidth + widthBoost, endpointAlpha);
        }
      } else if (showEndpoints) { drawPolyline(points1, "#c85cff", lineWidth + 0.3, 1); drawPolyline(points2, "#9db300", lineWidth + 0.3, 1); }
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); motionRef.current.lastTime = null; };
  }, [wave1, wave2, blendSteps, sampleCount, lineWidth, showEndpoints, interpolationEnabled, use2DInterpolate, showBaselines, showArcGuides, interactionEnabled, interactionRadius, interactionSoftness, amplitudeUniformity, wavelengthUniformity, sharedSpeedEnabled, showPhaseDensityDebug, showAlignmentDebug]);

  const handleCopyConfig = async () => { const text = JSON.stringify(currentConfig, null, 2); setConfigJson(text); try { await navigator.clipboard.writeText(text); setConfigMessage("Configuration copied to clipboard."); } catch { setConfigMessage("Copied into the JSON box. Manual copy may be needed."); } };
  const handleApplyJson = () => { try { const cfg = safeMergeConfig(JSON.parse(configJson)); Object.entries(cfg.wave1).forEach(([k,v])=>({baseAmplitude:setWave1BaseAmplitude,ampVariation:setWave1AmpVariation,baseWavelength:setWave1BaseWavelength,wavelengthVariation:setWave1WavelengthVariation,curveAmount:setWave1CurveAmount,curveFrequency:setWave1CurveFrequency,carrierPhase:setWave1CarrierPhase,arcSpan:setWave1ArcSpan,arcRotation:setWave1ArcRotation,arcRadius:setWave1ArcRadius,arcX:setWave1ArcX,arcY:setWave1ArcY,speed:setWave1Speed}[k])(v)); Object.entries(cfg.wave2).forEach(([k,v])=>({baseAmplitude:setWave2BaseAmplitude,ampVariation:setWave2AmpVariation,baseWavelength:setWave2BaseWavelength,wavelengthVariation:setWave2WavelengthVariation,curveAmount:setWave2CurveAmount,curveFrequency:setWave2CurveFrequency,carrierPhase:setWave2CarrierPhase,arcSpan:setWave2ArcSpan,arcRotation:setWave2ArcRotation,arcRadius:setWave2ArcRadius,arcX:setWave2ArcX,arcY:setWave2ArcY,speed:setWave2Speed}[k])(v)); setBlendSteps(cfg.global.blendSteps); setSampleCount(cfg.global.sampleCount); setLineWidth(cfg.global.lineWidth); setShowEndpoints(cfg.global.showEndpoints); setInterpolationEnabled(cfg.global.interpolationEnabled); setUse2DInterpolate(cfg.global.use2DInterpolate); setShowBaselines(cfg.global.showBaselines); setShowArcGuides(cfg.global.showArcGuides); setInteractionEnabled(cfg.global.interactionEnabled); setInteractionRadius(cfg.global.interactionRadius); setInteractionSoftness(cfg.global.interactionSoftness); setAmplitudeUniformity(cfg.global.amplitudeUniformity); setWavelengthUniformity(cfg.global.wavelengthUniformity); setSharedSpeedEnabled(cfg.global.sharedSpeedEnabled); setShowPhaseDensityDebug(cfg.global.showPhaseDensityDebug); setConfigMessage("Configuration applied."); } catch { setConfigMessage("Invalid JSON. Please check formatting."); } };
  const handleResetConfig = () => { const cfg = DEFAULT_CONFIG; setWave1BaseAmplitude(cfg.wave1.baseAmplitude); setWave1AmpVariation(cfg.wave1.ampVariation); setWave1BaseWavelength(cfg.wave1.baseWavelength); setWave1WavelengthVariation(cfg.wave1.wavelengthVariation); setWave1CurveAmount(cfg.wave1.curveAmount); setWave1CurveFrequency(cfg.wave1.curveFrequency); setWave1CarrierPhase(cfg.wave1.carrierPhase); setWave1ArcSpan(cfg.wave1.arcSpan); setWave1ArcRotation(cfg.wave1.arcRotation); setWave1ArcRadius(cfg.wave1.arcRadius); setWave1ArcX(cfg.wave1.arcX); setWave1ArcY(cfg.wave1.arcY); setWave1Speed(cfg.wave1.speed); setWave2BaseAmplitude(cfg.wave2.baseAmplitude); setWave2AmpVariation(cfg.wave2.ampVariation); setWave2BaseWavelength(cfg.wave2.baseWavelength); setWave2WavelengthVariation(cfg.wave2.wavelengthVariation); setWave2CurveAmount(cfg.wave2.curveAmount); setWave2CurveFrequency(cfg.wave2.curveFrequency); setWave2CarrierPhase(cfg.wave2.carrierPhase); setWave2ArcSpan(cfg.wave2.arcSpan); setWave2ArcRotation(cfg.wave2.arcRotation); setWave2ArcRadius(cfg.wave2.arcRadius); setWave2ArcX(cfg.wave2.arcX); setWave2ArcY(cfg.wave2.arcY); setWave2Speed(cfg.wave2.speed); setBlendSteps(cfg.global.blendSteps); setSampleCount(cfg.global.sampleCount); setLineWidth(cfg.global.lineWidth); setShowEndpoints(cfg.global.showEndpoints); setInterpolationEnabled(cfg.global.interpolationEnabled); setUse2DInterpolate(cfg.global.use2DInterpolate); setShowBaselines(cfg.global.showBaselines); setShowArcGuides(cfg.global.showArcGuides); setInteractionEnabled(cfg.global.interactionEnabled); setInteractionRadius(cfg.global.interactionRadius); setInteractionSoftness(cfg.global.interactionSoftness); setAmplitudeUniformity(cfg.global.amplitudeUniformity); setWavelengthUniformity(cfg.global.wavelengthUniformity); setSharedSpeedEnabled(cfg.global.sharedSpeedEnabled); setShowPhaseDensityDebug(cfg.global.showPhaseDensityDebug); setConfigMessage("Reset to defaults."); };

  return <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-50 relative"><div className="absolute inset-0"><canvas ref={canvasRef} className="h-full w-full block" /></div><div className="absolute top-4 left-4 z-20 rounded-2xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/30 max-w-md"><h2 className="text-lg font-semibold">Wave Blend Demo</h2><p className="text-xs text-slate-400 mt-1">Full-screen visualization with a collapsible configuration overlay. You can copy the current setup as JSON and paste JSON back to restore it.</p></div><div className={`absolute top-0 left-0 z-30 h-full transition-transform duration-300 ${panelCollapsed ? "-translate-x-[calc(100%-3.5rem)]" : "translate-x-0"}`}><div className="relative h-full"><button type="button" onClick={() => setPanelCollapsed((v) => !v)} className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 rounded-r-2xl border border-l-0 border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-3 py-4 text-slate-200 shadow-xl" aria-label={panelCollapsed ? "Open controls" : "Collapse controls"}>{panelCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}</button><div className="h-full w-[min(460px,92vw)] border-r border-slate-800/80 bg-slate-950/78 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"><div className="h-full overflow-y-auto p-4 md:p-5 space-y-5"><Section title="Configuration" subtitle="Collapse this panel when you want to inspect only the full-screen visualization."><div className="grid grid-cols-3 gap-2"><button type="button" onClick={handleCopyConfig} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"><Copy className="h-4 w-4" /> Copy JSON</button><button type="button" onClick={handleApplyJson} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"><Upload className="h-4 w-4" /> Apply</button><button type="button" onClick={handleResetConfig} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"><RotateCcw className="h-4 w-4" /> Reset</button></div><textarea value={configJson} onChange={(e) => setConfigJson(e.target.value)} spellCheck={false} className="h-48 w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-slate-200 font-mono leading-5 outline-none focus:border-slate-600" /><p className="text-xs text-slate-400">{configMessage}</p></Section><Section title="Blend field" subtitle="Controls for the interpolated stack and carrier visibility."><Toggle label="Enable interpolation" description="Off by default so interaction can be tested on the two key waves first." checked={interpolationEnabled} onChange={setInterpolationEnabled} /><Control label="In-between steps" value={blendSteps} onChange={(v) => setBlendSteps(Math.round(v))} min={1} max={120} step={1} /><Control label="Sample count" value={sampleCount} onChange={(v) => setSampleCount(Math.round(v))} min={80} max={420} step={10} /><Control label="Line width" value={lineWidth} onChange={setLineWidth} min={0.5} max={4} step={0.1} /><Toggle label="Show endpoint waves" description="Keep the top and bottom boundary curves visible." checked={showEndpoints} onChange={setShowEndpoints} /><Toggle label="Show carrier paths" description="Displays the wavy baseline paths for the two key waves." checked={showBaselines} onChange={setShowBaselines} /><Toggle label="Show arc guides" description="Displays the clean arc guide for each wave without baseline waviness." checked={showArcGuides} onChange={setShowArcGuides} /><Toggle label="2D interpolation" description="Off = index-matched interpolation. On = full 2D point interpolation." checked={use2DInterpolate} onChange={setUse2DInterpolate} /></Section><Section title="Mouse interaction" subtitle="Base amplitude and base wavelength act as the defaults. Variation controls bounded random deviation around those defaults."><Toggle label="Enable interaction" description="Nearby wave segments become more uniform as the pointer approaches." checked={interactionEnabled} onChange={setInteractionEnabled} /><Control label="Interaction radius" value={interactionRadius} onChange={setInteractionRadius} min={40} max={1200} step={5} /><Control label="Falloff softness" value={interactionSoftness} onChange={setInteractionSoftness} min={0.05} max={0.95} step={0.01} /><Control label="Amplitude uniformity" value={amplitudeUniformity} onChange={setAmplitudeUniformity} min={1} max={1} step={0.01} /><Control label="Wavelength uniformity" value={wavelengthUniformity} onChange={setWavelengthUniformity} min={1} max={1} step={0.01} /><Toggle label="Enable shared speed convergence" description="Speed lock now triggers near the best alignment reached during the current interaction episode." checked={sharedSpeedEnabled} onChange={setSharedSpeedEnabled} /><Toggle label="Show phase density debug" description="Diagnostic overlay. Red hotspots indicate regions where local phase changes too quickly." checked={showPhaseDensityDebug} onChange={setShowPhaseDensityDebug} /><Toggle label="Show alignment debug" description="Draws nearest screen-space pairing lines used by the spatial phase-alignment metric." checked={showAlignmentDebug} onChange={setShowAlignmentDebug} /></Section><WaveControls title="Wave system 1" state={wave1} setters={{ setBaseAmplitude: setWave1BaseAmplitude, setAmpVariation: setWave1AmpVariation, setBaseWavelength: setWave1BaseWavelength, setWavelengthVariation: setWave1WavelengthVariation, setCurveAmount: setWave1CurveAmount, setCurveFrequency: setWave1CurveFrequency, setCarrierPhase: setWave1CarrierPhase, setArcSpan: setWave1ArcSpan, setArcRotation: setWave1ArcRotation, setArcRadius: setWave1ArcRadius, setArcX: setWave1ArcX, setArcY: setWave1ArcY, setSpeed: setWave1Speed }} /><WaveControls title="Wave system 2" state={wave2} setters={{ setBaseAmplitude: setWave2BaseAmplitude, setAmpVariation: setWave2AmpVariation, setBaseWavelength: setWave2BaseWavelength, setWavelengthVariation: setWave2WavelengthVariation, setCurveAmount: setWave2CurveAmount, setCurveFrequency: setWave2CurveFrequency, setCarrierPhase: setWave2CarrierPhase, setArcSpan: setWave2ArcSpan, setArcRotation: setWave2ArcRotation, setArcRadius: setWave2ArcRadius, setArcX: setWave2ArcX, setArcY: setWave2ArcY, setSpeed: setWave2Speed }} /><Section title="Live readouts" subtitle="Helpful when checking speed lock and local carrier simplification."><p className="text-sm text-slate-300 leading-6"><span className="text-slate-100 font-medium">Live speed debug:</span> wave 1 <span className="tabular-nums">{liveMetrics.wave1Speed.toFixed(3)}</span>, wave 2 <span className="tabular-nums">{liveMetrics.wave2Speed.toFixed(3)}</span>, shared target <span className="tabular-nums">{liveMetrics.sharedSpeed.toFixed(3)}</span>, speed mix <span className="tabular-nums">{liveMetrics.speedMix.toFixed(3)}</span>, spatial alignment <span className="tabular-nums">{liveMetrics.spatialAlignment.toFixed(3)}</span>, index alignment <span className="tabular-nums">{liveMetrics.indexAlignment.toFixed(3)}</span>, influence <span className="tabular-nums">{liveMetrics.influence.toFixed(3)}</span>, locked <span className="tabular-nums">{liveMetrics.speedLocked ? "yes" : "no"}</span>.</p><p className="text-sm text-slate-300 leading-6"><span className="text-slate-100 font-medium">Spatial match details:</span> paired samples <span className="tabular-nums">{liveMetrics.alignmentPairs}</span>, average pair distance <span className="tabular-nums">{liveMetrics.avgPairDistance.toFixed(2)}</span> px, episode peak <span className="tabular-nums">{liveMetrics.episodePeakAlignment.toFixed(3)}</span>, near-peak frames <span className="tabular-nums">{liveMetrics.nearPeakFrames}</span>, average carrier simplification <span className="tabular-nums">{liveMetrics.avgCarrierSimplification.toFixed(3)}</span>.</p></Section></div></div></div></div></div>;
}

const rootEl = document.getElementById("app");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(ProceduralWaveBlendDemo));
}
