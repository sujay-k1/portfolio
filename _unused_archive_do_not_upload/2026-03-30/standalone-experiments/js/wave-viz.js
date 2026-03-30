const GEOMETRY_URL = "Assets/waves/waves.baked.json";
const ACTIVE_WAVE_SET = "key";
const WAVE_SET_CONFIG = {
  key: {
    pathA: "keyA",
    pathB: "keyB",
    sourceA: "keyA",
    sourceB: "keyB",
    referenceImage: "Assets/waves/reference-crop.png"
  },
  harmonic: {
    pathA: "harmonicA",
    pathB: "harmonicB",
    sourceA: "harmonicA",
    sourceB: "harmonicB",
    referenceImage: "Assets/waves/reference-harmonic-crop.png"
  }
};
const REFERENCE_IMAGE_BY_SET = {
  key: WAVE_SET_CONFIG.key.referenceImage,
  harmonic: WAVE_SET_CONFIG.harmonic.referenceImage
};
const PRIMARY_BLEND_IN_BETWEEN = 100;
const BLEND_MODE_DIRECT_INDEX = "direct-index";
const BLEND_MODE_FROZEN_PHASE = "frozen-phase";
const BLEND_MODE_ARC_LENGTH = "arc-length";
const BLEND_MODE_SEAM_INVARIANT = "seam-invariant";
const BLEND_MODE_CENTER_LOCK_D3_SEAM = "center-lock-d3-seam";
const PRIMARY_BLEND_MODES = [
  BLEND_MODE_DIRECT_INDEX,
  BLEND_MODE_FROZEN_PHASE,
  BLEND_MODE_ARC_LENGTH,
  BLEND_MODE_SEAM_INVARIANT,
  BLEND_MODE_CENTER_LOCK_D3_SEAM
];
const TOKEN_RE = /[AaCcMmLlHhVvQqSsTtZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;

const CONFIG = {
  samples: 900,
  layout: {
    rightEdge: 1.175,
    topDesktop: 0,
    topMobile: 0.02,
    scaleXDesktop: 0.695,
    scaleXMobile: 0.88,
    scaleYDesktop: 1.195,
    scaleYMobile: 1.1,
    waveA: {
      xOffsetDesktop: -0.095,
      xOffsetMobile: 0.07,
      yOffsetDesktop: -0.05,
      yOffsetMobile: 0.014,
      scaleXDesktop: 1.0,
      scaleXMobile: 1.0,
      scaleYDesktop: 1.0,
      scaleYMobile: 1.0,
      rotationDesktop: 0,
      rotationMobile: 0
    },
    waveB: {
      xOffsetDesktop: -0.148,
      xOffsetMobile: -0.004,
      yOffsetDesktop: 0.02,
      yOffsetMobile: 0,
      scaleXDesktop: 1.0,
      scaleXMobile: 1.0,
      scaleYDesktop: 1.0,
      scaleYMobile: 1.0,
      rotationDesktop: 0,
      rotationMobile: 0
    }
  },
  stroke: {
    widthA: 1.2,
    widthB: 1.2,
    secondaryWidthA: 1.0,
    secondaryWidthB: 1.0,
    baselineWidth: 2.0,
    mappingWidth: 0.9,
    mappingDotRadiusPx: 2.2,
    handleGuideWidth: 1.0,
    constraintWidth: 1.1,
    handleAnchorRadiusPx: 2.8,
    handleControlRadiusPx: 2.4,
    constraintBaseRadiusPx: 2.5,
    baselineInitialPasses: 78,
    baselineFinalPasses: 22,
    baselineMinAmplitudePx: 1.3,
    baselineMinGapSamples: 12,
    baselineHandleDefault: 0.85,
    markerRadiusPx: 3.1,
    baselineAnchorRadiusPx: 3.35,
    baselineEdgeIntersectionRadiusPx: 4.0,
    markerSegments: 12
  },
  align: {
    overlayDefaultVisible: false,
    overlayDefaultOpacity: 0.5,
    step: 0.005,
    fineStep: 0.001,
    rotateStepDeg: 1.0,
    rotateFineStepDeg: 0.2
  },
  interaction: {
    mouseInfluencePx: 420,
    baselineAEllipseRadiusXPx: 650,
    baselineAEllipseRadiusYPx: 650,
    baselineAEllipseRotationDeg: 45,
    baselineAExpK: 4,
    baselineAInductionMaxAnchors: 9,
    baselineACenterRadiusPx: 160,
    baselineAMinGradientBandPx: 60,
    baselineAPivotSwitchMarginPx: 12,
    baselineAPivotStrengthLerp: 0.08,
    baselineAPivotTransitionLerp: 0.05
  },
  motion: {
    travelSpeedPxPerSecond: 76,
    travelDirectionA: 1,
    travelDirectionB: -1,
    scrubStepSeconds: 1 / 120
  },
  zoomBlur: {
    enabled: true,
    centerXNorm: 0.68,
    centerYNorm: 0.54,
    innerRadiusPx: 160,
    radiusPx: 650,
    strength: 0.14,
    kernelSize: 11
  }
};

const COLORS = {
  primaryA: [0.6784, 0.3725, 0.7804, 0.9],
  primaryB: [0.3725, 0.7804, 0.5373, 0.9],
  secondaryA: [0.89, 0.62, 0.95, 0.62],
  secondaryB: [0.42, 0.98, 0.88, 0.62],
  mappingA: [1.0, 0.9, 0.2, 0.62],
  mappingB: [0.9, 1.0, 0.3, 0.62],
  mappingDotPrimary: [1.0, 0.97, 0.75, 0.85],
  mappingDotSecondary: [0.08, 0.08, 0.08, 0.9],
  baseline: [1.0, 0.24, 0.32, 0.92],
  handleGuideA: [0.99, 0.74, 0.86, 0.58],
  handleGuideB: [0.66, 0.97, 1.0, 0.58],
  constraintLineA: [1.0, 0.84, 0.9, 0.62],
  constraintLineB: [0.72, 0.98, 1.0, 0.62],
  constraintBasePoint: [1.0, 0.35, 0.35, 0.96],
  handleAnchor: [1.0, 0.95, 0.25, 0.96],
  handleControl: [1.0, 0.58, 0.24, 0.96],
  markerA: [0.02, 0.02, 0.02, 0.96],
  markerB: [0.0, 0.94, 1.0, 0.96],
  markerSecondaryA: [0.98, 0.92, 0.22, 0.96],
  markerSecondaryB: [0.36, 0.98, 0.9, 0.96],
  baselineAnchorPoint: [0.0, 0.0, 0.0, 0.98],
  baselineEdgeIntersection: [1.0, 0.86, 0.18, 0.98],
  markerEndpointStart: [1.0, 0.15, 0.15, 1.0],
  markerEndpointEnd: [0.0, 0.0, 0.0, 1.0],
  markerEndpointOutline: [1.0, 1.0, 1.0, 0.95]
};

const BASELINE_A_ARC_OVERRIDES = Object.freeze({
  1: { x: 1.0463, y: 0.039, handleDeg: 119.84 },
  2: { x: 1.0009, y: 0.1337, handleDeg: 99.46 },
  3: { x: 0.9906, y: 0.22, handleDeg: 101.53 },
  4: { x: 0.969, y: 0.355, handleDeg: 102.15 },
  5: { x: 0.9487, y: 0.4533, handleDeg: 105.83 },
  6: { x: 0.9284, y: 0.5416, handleDeg: 106.2 },
  7: { x: 0.8932, y: 0.6685, handleDeg: 107.06 },
  8: { x: 0.8236, y: 0.8046, handleDeg: 127.06 },
  9: { x: 0.7789, y: 0.8494, handleDeg: 143.95 },
  10: { x: 0.7154, y: 0.8937, handleDeg: -207.07 },
  11: { x: 0.6628, y: 0.9254, handleDeg: 147.37 },
  12: { x: 0.579, y: 0.963, handleDeg: 160.18 },
  13: { x: 0.5099, y: 0.9866, handleDeg: 173.23 },
  14: { x: 0.4211, y: 1.0068, handleDeg: 166.9 }
});

const BASELINE_B_ARC_OVERRIDES = Object.freeze({
  2: { x: 0.2052, y: 1.0269, handleDeg: -12.93 },
  3: { x: 0.3145, y: 0.9877, handleDeg: -24.94 },
  4: { x: 0.4009, y: 0.9391, handleDeg: -36.14 },
  5: { x: 0.4716, y: 0.8942, handleDeg: -37.39 },
  6: { x: 0.5869, y: 0.8021, handleDeg: -40.58 },
  7: { x: 0.6835, y: 0.6925, handleDeg: -50.06 },
  8: { x: 0.7478, y: 0.5895, handleDeg: -58.24 },
  9: { x: 0.8116, y: 0.4466, handleDeg: -68.93 },
  10: { x: 0.8697, y: 0.2773, handleDeg: -72.15 },
  11: { x: 0.9217, y: 0.0947, handleDeg: -77.53 },
  12: { x: 0.9613, y: -0.0602, handleDeg: -78.34 }
});

const SET_LAYOUT_DEFAULTS = {
  harmonic: JSON.parse(JSON.stringify(CONFIG.layout)),
  key: {
    rightEdge: 1.175,
    topDesktop: 0,
    topMobile: 0.02,
    scaleXDesktop: 0.695,
    scaleXMobile: 0.88,
    scaleYDesktop: 1.24,
    scaleYMobile: 1.1,
    waveA: {
      xOffsetDesktop: 0.26,
      xOffsetMobile: 0.07,
      yOffsetDesktop: 0.015,
      yOffsetMobile: 0.014,
      scaleXDesktop: 1.205,
      scaleXMobile: 1.0,
      scaleYDesktop: 1.175,
      scaleYMobile: 1.0,
      rotationDesktop: -2.0,
      rotationMobile: 0
    },
    waveB: {
      xOffsetDesktop: 0.012,
      xOffsetMobile: -0.004,
      yOffsetDesktop: -0.135,
      yOffsetMobile: 0.0,
      scaleXDesktop: 1.26,
      scaleXMobile: 1.0,
      scaleYDesktop: 1.085,
      scaleYMobile: 1.0,
      rotationDesktop: -4.0,
      rotationMobile: 0
    }
  }
};

const DEFAULT_LAYOUT = deepClone(SET_LAYOUT_DEFAULTS[ACTIVE_WAVE_SET] || CONFIG.layout);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resampleOpenFloat2(source, outSamples) {
  const inSamples = (source.length / 2) | 0;
  if (inSamples < 2 || outSamples < 2) {
    return new Float32Array(source);
  }

  const out = new Float32Array(outSamples * 2);
  for (let i = 0; i < outSamples; i += 1) {
    const s = (i / Math.max(1, outSamples - 1)) * (inSamples - 1);
    const i0 = Math.floor(s);
    const i1 = Math.min(inSamples - 1, i0 + 1);
    const f = s - i0;

    const k0 = i0 * 2;
    const k1 = i1 * 2;
    const k = i * 2;

    out[k] = lerp(source[k0], source[k1], f);
    out[k + 1] = lerp(source[k0 + 1], source[k1 + 1], f);
  }

  return out;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to allocate shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "Shader compile error";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    throw new Error("Unable to allocate program");
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Program link error";
    gl.deleteProgram(program);
    throw new Error(log);
  }

  return program;
}

async function loadGeometry(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load geometry: ${response.status}`);
  }

  const json = await response.json();
  if (!json?.paths || !json?.frame) {
    throw new Error("Invalid geometry data");
  }

  const keyAPath = json.paths?.keyA;
  const keyBPath = json.paths?.keyB;
  const harmonicAPath = json.paths?.harmonicA;
  const harmonicBPath = json.paths?.harmonicB;
  if (!keyAPath || !keyBPath) {
    throw new Error("Missing one or more required key wave paths (A/B)");
  }

  const waveSets = {
    key: {
      waveA: new Float32Array(keyAPath),
      waveB: new Float32Array(keyBPath)
    },
    harmonic: {
      waveA: harmonicAPath ? new Float32Array(harmonicAPath) : new Float32Array(keyAPath),
      waveB: harmonicBPath ? new Float32Array(harmonicBPath) : new Float32Array(keyBPath)
    }
  };

  return {
    sampleCount: json.sampleCount,
    frame: json.frame,
    rangeX: json.frame.rangeX,
    sources: json.sources || {},
    waveSets,
    activeWaveSet: ACTIVE_WAVE_SET
  };
}

function parseSvgPathAndViewBox(svgText) {
  const viewBoxMatch = svgText.match(/viewBox\s*=\s*(["'])(.*?)\1/i);
  const pathMatch = svgText.match(/<path\b[^>]*\bd\s*=\s*(["'])(.*?)\1[^>]*>/is);

  if (!viewBoxMatch || !pathMatch) {
    throw new Error("Invalid SVG: missing viewBox or path d");
  }

  return {
    viewBox: viewBoxMatch[2]
      .split(/[\s,]+/)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v)),
    d: pathMatch[2]
  };
}

function parsePathSegments(d) {
  const tokens = d.match(TOKEN_RE) || [];
  const isCommand = (t) => /^[A-Za-z]$/.test(t);

  let i = 0;
  let cmd = "";
  let prevCmd = "";
  let prevCubicCtrl = null;
  let x = 0;
  let y = 0;
  const segments = [];

  const readNum = () => {
    if (i >= tokens.length) {
      throw new Error("Unexpected end of path data");
    }
    const value = Number(tokens[i++]);
    if (!Number.isFinite(value)) {
      throw new Error("Invalid number in path data");
    }
    return value;
  };

  while (i < tokens.length) {
    if (isCommand(tokens[i])) {
      cmd = tokens[i++];
    } else if (!cmd) {
      throw new Error("Path data starts without a command");
    }

    if (cmd === "M") {
      x = readNum();
      y = readNum();
      cmd = "L";
      prevCubicCtrl = null;
      prevCmd = "M";
      continue;
    }

    if (cmd === "m") {
      x += readNum();
      y += readNum();
      cmd = "l";
      prevCubicCtrl = null;
      prevCmd = "m";
      continue;
    }

    if (cmd === "C" || cmd === "c") {
      while (i < tokens.length && !isCommand(tokens[i])) {
        const x1 = readNum();
        const y1 = readNum();
        const x2 = readNum();
        const y2 = readNum();
        const x3 = readNum();
        const y3 = readNum();

        const absolute = cmd === "C";
        const p0 = { x, y };
        const p1 = absolute ? { x: x1, y: y1 } : { x: x + x1, y: y + y1 };
        const p2 = absolute ? { x: x2, y: y2 } : { x: x + x2, y: y + y2 };
        const p3 = absolute ? { x: x3, y: y3 } : { x: x + x3, y: y + y3 };

        segments.push({ type: "C", p0, p1, p2, p3 });
        x = p3.x;
        y = p3.y;
        prevCubicCtrl = { x: p2.x, y: p2.y };
        prevCmd = cmd;
      }
      continue;
    }

    if (cmd === "S" || cmd === "s") {
      while (i < tokens.length && !isCommand(tokens[i])) {
        const x2 = readNum();
        const y2 = readNum();
        const x3 = readNum();
        const y3 = readNum();

        const hasPrevCubic = prevCmd === "C" || prevCmd === "c" || prevCmd === "S" || prevCmd === "s";
        const p0 = { x, y };
        const p1 =
          hasPrevCubic && prevCubicCtrl
            ? { x: x * 2 - prevCubicCtrl.x, y: y * 2 - prevCubicCtrl.y }
            : { x, y };
        const absolute = cmd === "S";
        const p2 = absolute ? { x: x2, y: y2 } : { x: x + x2, y: y + y2 };
        const p3 = absolute ? { x: x3, y: y3 } : { x: x + x3, y: y + y3 };

        segments.push({ type: "C", p0, p1, p2, p3 });
        x = p3.x;
        y = p3.y;
        prevCubicCtrl = { x: p2.x, y: p2.y };
        prevCmd = cmd;
      }
      continue;
    }

    if (cmd === "L" || cmd === "l") {
      while (i < tokens.length && !isCommand(tokens[i])) {
        const nx = readNum();
        const ny = readNum();
        const x1 = cmd === "L" ? nx : x + nx;
        const y1 = cmd === "L" ? ny : y + ny;
        segments.push({ type: "L", p0: { x, y }, p1: { x: x1, y: y1 } });
        x = x1;
        y = y1;
        prevCubicCtrl = null;
        prevCmd = cmd;
      }
      continue;
    }

    if (cmd === "Z" || cmd === "z") {
      prevCubicCtrl = null;
      prevCmd = cmd;
      continue;
    }

    throw new Error(`Unsupported path command: ${cmd}`);
  }

  if (!segments.length) {
    throw new Error("No drawable segments in path data");
  }

  return segments;
}

function normalizePointToBakedFrame(point, frame) {
  const h = Math.max(1e-9, frame.maxY - frame.minY);
  return {
    x: (point.x - frame.minX) / h,
    y: (point.y - frame.minY) / h
  };
}

function normalizeSegmentsToBakedFrame(segments, frame) {
  const out = [];
  for (const seg of segments) {
    if (seg.type === "C") {
      out.push({
        type: "C",
        p0: normalizePointToBakedFrame(seg.p0, frame),
        p1: normalizePointToBakedFrame(seg.p1, frame),
        p2: normalizePointToBakedFrame(seg.p2, frame),
        p3: normalizePointToBakedFrame(seg.p3, frame)
      });
    } else {
      out.push({
        type: "L",
        p0: normalizePointToBakedFrame(seg.p0, frame),
        p1: normalizePointToBakedFrame(seg.p1, frame)
      });
    }
  }
  return out;
}

async function loadWaveCubicSegments(geometry) {
  const sourceNames = ["keyA", "keyB"];
  const files = {};
  for (const name of sourceNames) {
    const file = geometry.sources?.[name]?.file;
    if (!file) {
      throw new Error(`Missing source file metadata: ${name}`);
    }
    files[name] = file;
  }

  const responses = await Promise.all(
    sourceNames.map((name) => fetch(files[name], { cache: "no-store" }))
  );
  for (let i = 0; i < responses.length; i += 1) {
    if (!responses[i].ok) {
      throw new Error(`Failed to load SVG file: ${sourceNames[i]}`);
    }
  }

  const svgs = await Promise.all(responses.map((response) => response.text()));
  const parsed = {};
  for (let i = 0; i < sourceNames.length; i += 1) {
    const name = sourceNames[i];
    parsed[name] = parseSvgPathAndViewBox(svgs[i]);
  }

  return {
    key: {
      waveA: normalizeSegmentsToBakedFrame(parsePathSegments(parsed.keyA.d), geometry.frame),
      waveB: normalizeSegmentsToBakedFrame(parsePathSegments(parsed.keyB.d), geometry.frame)
    },
    harmonic: {
      waveA: [],
      waveB: []
    }
  };
}

class WaveOriginalRenderer {
  constructor(
    canvas,
    labelCanvas,
    overlays,
    hud,
    motionToggleButton,
    baselineAModeButton,
    harmonicSystemToggle,
    keySystemToggle,
    baselineSmoothInput,
    baselineSmoothValue,
    baselineHandleInput,
    baselineHandleValue,
    mouseInfluenceInput,
    mouseInfluenceValue,
    geometry,
    cubicSegments
  ) {
    this.canvas = canvas;
    this.labelCanvas = labelCanvas;
    this.labelCtx = labelCanvas ? labelCanvas.getContext("2d") : null;
    this.overlays = overlays || {};
    this.hud = hud;
    this.motionToggleButton = motionToggleButton;
    this.baselineAModeButton = baselineAModeButton;
    this.blendModeButton = document.getElementById("blend-mode-toggle");
    this.harmonicSystemToggle = harmonicSystemToggle;
    this.keySystemToggle = keySystemToggle;
    this.baselineSmoothInput = baselineSmoothInput;
    this.baselineSmoothValue = baselineSmoothValue;
    this.baselineHandleInput = baselineHandleInput;
    this.baselineHandleValue = baselineHandleValue;
    this.mouseInfluenceInput = mouseInfluenceInput;
    this.mouseInfluenceValue = mouseInfluenceValue;
    this.geometry = geometry;
    this.cubicSegments = cubicSegments || {
      key: { waveA: [], waveB: [] },
      harmonic: { waveA: [], waveB: [] }
    };
    this.activeWaveSet = geometry.activeWaveSet || ACTIVE_WAVE_SET;
    this.secondaryWaveSet = this.activeWaveSet === "harmonic" ? "key" : "harmonic";

    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.aPosition = -1;
    this.aColor = -1;
    this.pixiCanvas = document.getElementById("pixi-post-canvas");
    this.pixiApp = null;
    this.pixiTexture = null;
    this.pixiSprite = null;
    this.pixiZoomFilter = null;
    this.pixiZoomReady = false;
    this.pixiZoomError = "";

    this.isMobile = window.matchMedia("(max-width: 980px), (pointer: coarse)").matches;
    this.layout = deepClone(SET_LAYOUT_DEFAULTS[this.activeWaveSet] || DEFAULT_LAYOUT);
    this.secondaryLayout = deepClone(SET_LAYOUT_DEFAULTS[this.secondaryWaveSet] || DEFAULT_LAYOUT);

    this.overlayLoadedBySet = { harmonic: false, key: false };
    this.overlayVisible = CONFIG.align.overlayDefaultVisible;
    this.overlayOpacity = CONFIG.align.overlayDefaultOpacity;
    this.systemEnabled = { harmonic: false, key: true };
    this.hudVisible = true;
    this.showHandles = false;
    this.showBaselines = false;
    this.showMarkers = false;
    this.showMapping = false;
    this.showAnchorLabels = false;
    this.mergeSecondaryAEndpoints = true;
    this.mergeSecondaryBEndpoints = true;
    this.enableSecondaryBReplicas = false;
    this.secondaryBReplicaBeforeCount = 0;
    this.secondaryBReplicaAfterCount = 0;
    this.secondaryBReplicaShift = { valid: false, dx: 0, dy: 0 };
    this.secondaryBReplicaShiftSource = "none";
    this.baselineSmooth = CONFIG.stroke.baselineFinalPasses;
    this.baselineHandle = CONFIG.stroke.baselineHandleDefault;
    this.motionSpeedPxPerSecond = CONFIG.motion.travelSpeedPxPerSecond;
    this.travelDirectionA = Math.sign(Number(CONFIG.motion.travelDirectionA) || 1) || 1;
    this.travelDirectionB = Math.sign(Number(CONFIG.motion.travelDirectionB) || -1) || -1;
    this.primaryBlendInBetween = Math.max(0, PRIMARY_BLEND_IN_BETWEEN | 0);
    this.hidePrimaryBlendEndpoints = false;
    this.primaryBlendPocIntermediate = false;
    this.primaryBlendPocReverseA = true;
    this.primaryBlendPocReverseB = false;
    this.primaryBlendMode = BLEND_MODE_DIRECT_INDEX;
    this.primaryBlendColorScratch = new Float32Array(4);
    this.primaryBlendFrozenState = {
      initialized: false,
      segCount: 0,
      reverseFrom: false,
      phase: 0,
      target: 0
    };
    this.d3InterpolatePath = this.resolveD3InterpolatePathFunction();
    this.centerLockD3InteriorSamples = 320;
    this.centerLockD3TrimPoints = 1;
    this.centerLockD3LastError = "";
    this.motionPaused = false;
    this.motionScrubMode = false;
    this.motionScrubStepSeconds = Math.max(
      1 / 240,
      Number(CONFIG.motion.scrubStepSeconds) || 1 / 120
    );
    this.mouseInfluencePx = CONFIG.interaction.mouseInfluencePx;
    this.pixiZoomEnabled = !!CONFIG.zoomBlur.enabled;
    this.zoomBlurCenterXNorm = clamp(Number(CONFIG.zoomBlur.centerXNorm) || 0.68, 0, 1);
    this.zoomBlurCenterYNorm = clamp(Number(CONFIG.zoomBlur.centerYNorm) || 0.54, 0, 1);
    this.zoomBlurInnerRadiusPx = Math.max(0, Number(CONFIG.zoomBlur.innerRadiusPx) || 160);
    this.zoomBlurRadiusPx = Math.max(0, Number(CONFIG.zoomBlur.radiusPx) || 650);
    this.zoomBlurStrength = Math.max(0, Number(CONFIG.zoomBlur.strength) || 0.14);
    this.zoomBlurKernelSize = Math.max(3, Math.min(32, Math.round(Number(CONFIG.zoomBlur.kernelSize) || 11)));
    this.pointerActive = false;
    this.pointerXpx = 0;
    this.pointerYpx = 0;
    this.controlPanel = document.getElementById("baseline-control");
    this.baselineAEllipseRxInput = document.getElementById("baseline-a-ellipse-rx");
    this.baselineAEllipseRxValue = document.getElementById("baseline-a-ellipse-rx-value");
    this.baselineAEllipseRyInput = document.getElementById("baseline-a-ellipse-ry");
    this.baselineAEllipseRyValue = document.getElementById("baseline-a-ellipse-ry-value");
    this.pixiBlurEnabledInput = document.getElementById("pixi-blur-enabled");
    this.pixiBlurCenterXInput = document.getElementById("pixi-blur-center-x");
    this.pixiBlurCenterXValue = document.getElementById("pixi-blur-center-x-value");
    this.pixiBlurCenterYInput = document.getElementById("pixi-blur-center-y");
    this.pixiBlurCenterYValue = document.getElementById("pixi-blur-center-y-value");
    this.pixiBlurInnerRadiusInput = document.getElementById("pixi-blur-inner-radius");
    this.pixiBlurInnerRadiusValue = document.getElementById("pixi-blur-inner-radius-value");
    this.pixiBlurRadiusInput = document.getElementById("pixi-blur-radius");
    this.pixiBlurRadiusValue = document.getElementById("pixi-blur-radius-value");
    this.pixiBlurStrengthInput = document.getElementById("pixi-blur-strength");
    this.pixiBlurStrengthValue = document.getElementById("pixi-blur-strength-value");
    this.pixiBlurKernelInput = document.getElementById("pixi-blur-kernel");
    this.pixiBlurKernelValue = document.getElementById("pixi-blur-kernel-value");

    const activeWaves = geometry.waveSets?.[this.activeWaveSet] || geometry.waveSets?.harmonic || geometry.waveSets?.key;
    const secondaryWaves = geometry.waveSets?.[this.secondaryWaveSet] || activeWaves;
    this.n = Math.max(220, Math.min(CONFIG.samples, geometry.sampleCount));
    this.curveA = resampleOpenFloat2(activeWaves.waveA, this.n);
    this.curveB = resampleOpenFloat2(activeWaves.waveB, this.n);
    this.secondaryCurveA = resampleOpenFloat2(secondaryWaves.waveA, this.n);
    this.secondaryCurveB = resampleOpenFloat2(secondaryWaves.waveB, this.n);

    this.viewA = new Float32Array(this.n * 2);
    this.viewB = new Float32Array(this.n * 2);
    this.viewSecondaryA = new Float32Array(this.n * 2);
    this.viewSecondaryB = new Float32Array(this.n * 2);
    this.waveTravelA = new Float32Array(this.n * 2);
    this.waveTravelB = new Float32Array(this.n * 2);
    this.waveIntermediatePoc = new Float32Array(this.n * 2);
    this.waveStableA = new Float32Array(this.n * 2);
    this.waveStableB = new Float32Array(this.n * 2);
    this.blendMapA = this.createBlendMapTransitionState();
    this.blendMapB = this.createBlendMapTransitionState();
    this.blendMapMinDurationSec = 1 / 120;
    this.blendMapMaxDurationSec = 8;
    this.blendMapSeamJumpToleranceSegments = 2;
    this.intermediatePocTransition = this.createIntermediatePocTransitionState();
    this.intermediatePocMinDurationSec = 1 / 120;
    this.intermediatePocMaxDurationSec = 8;
    this.waveSecondaryTravelA = new Float32Array(this.n * 2);
    this.waveSecondaryTravelB = new Float32Array(this.n * 2);
    this.baseA = new Float32Array(this.n * 2);
    this.baseB = new Float32Array(this.n * 2);
    this.baseSecondaryA = new Float32Array(this.n * 2);
    this.baseSecondaryB = new Float32Array(this.n * 2);
    this.baseRestA = new Float32Array(this.n * 2);
    this.baseRestB = new Float32Array(this.n * 2);
    this.baseSecondaryRestA = new Float32Array(this.n * 2);
    this.baseSecondaryRestB = new Float32Array(this.n * 2);
    this.baseScratchA = new Float32Array(this.n * 2);
    this.baseScratchB = new Float32Array(this.n * 2);
    this.baseSecondaryScratchA = new Float32Array(this.n * 2);
    this.baseSecondaryScratchB = new Float32Array(this.n * 2);
    this.baseNormA = new Float32Array(this.n * 2);
    this.baseNormB = new Float32Array(this.n * 2);
    this.baseSecondaryNormA = new Float32Array(this.n * 2);
    this.baseSecondaryNormB = new Float32Array(this.n * 2);
    this.baseArcA = new Float32Array(this.n);
    this.baseArcB = new Float32Array(this.n);
    this.baseSecondaryArcA = new Float32Array(this.n);
    this.baseSecondaryArcB = new Float32Array(this.n);
    this.baseArcLenA = 0;
    this.baseArcLenB = 0;
    this.baseSecondaryArcLenA = 0;
    this.baseSecondaryArcLenB = 0;
    this.primaryBlendArcFrom = new Float32Array(this.n);
    this.primaryBlendArcTo = new Float32Array(this.n);
    this.blendDebugArcFrom = new Float32Array(this.n);
    this.blendDebugArcTo = new Float32Array(this.n);
    this.baseDispA = new Float32Array(this.n);
    this.baseDispB = new Float32Array(this.n);
    this.baseSecondaryDispA = new Float32Array(this.n);
    this.baseSecondaryDispB = new Float32Array(this.n);
    this.waveDispA = new Float32Array(this.n);
    this.waveDispB = new Float32Array(this.n);
    this.waveSecondaryDispA = new Float32Array(this.n);
    this.waveSecondaryDispB = new Float32Array(this.n);
    this.waveArcU0A = new Float32Array(this.n);
    this.waveArcU0B = new Float32Array(this.n);
    this.waveSecondaryArcU0A = new Float32Array(this.n);
    this.waveSecondaryArcU0B = new Float32Array(this.n);
    this.cubicOrigA = [];
    this.cubicOrigB = [];
    this.cubicSecondaryA = [];
    this.cubicSecondaryB = [];
    this.anchorStateA = [];
    this.anchorStateB = [];
    this.anchorSecondaryStateA = [];
    this.anchorSecondaryStateB = [];
    this.cubicMovedA = [];
    this.cubicMovedB = [];
    this.cubicIntermediatePoc = [];
    this.intermediatePocAnchorCount = 0;
    this.cubicSecondaryMovedA = [];
    this.cubicSecondaryMovedB = [];
    this.constraintBaseA = new Float32Array(0);
    this.constraintBaseB = new Float32Array(0);
    this.constraintAnchorA = new Float32Array(0);
    this.constraintAnchorB = new Float32Array(0);
    this.constraintHandleOutA = new Float32Array(0);
    this.constraintHandleInA = new Float32Array(0);
    this.constraintHandleOutB = new Float32Array(0);
    this.constraintHandleInB = new Float32Array(0);
    this.constraintSecondaryBaseA = new Float32Array(0);
    this.constraintSecondaryBaseB = new Float32Array(0);
    this.constraintSecondaryAnchorA = new Float32Array(0);
    this.constraintSecondaryAnchorB = new Float32Array(0);
    this.constraintIntermediatePoc = new Float32Array(0);
    this.mappingSecondaryA = new Float32Array(0);
    this.mappingSecondaryB = new Float32Array(0);
    this.constraintOrthDotA = 0;
    this.constraintOrthDotB = 0;
    this.handleLenErrorPxA = 0;
    this.handleLenErrorPxB = 0;
    this.adjMinPxA = Infinity;
    this.adjMinPxB = Infinity;
    this.adjMinPxSecondaryA = Infinity;
    this.adjMinPxSecondaryB = Infinity;
    this.adjClosePairsA = 0;
    this.adjClosePairsB = 0;
    this.adjClosePairsSecondaryA = 0;
    this.adjClosePairsSecondaryB = 0;
    this.waveSkipAStart = -1;
    this.waveSkipAEnd = -1;
    this.waveSkipBStart = -1;
    this.waveSkipBEnd = -1;
    this.waveOrderAStart = -1;
    this.waveOrderAEnd = -1;
    this.waveOrderACount = 0;
    this.waveOrderBStart = -1;
    this.waveOrderBEnd = -1;
    this.waveOrderBCount = 0;
    this.waveSecondarySkipAStart = -1;
    this.waveSecondarySkipAEnd = -1;
    this.waveSecondarySkipBStart = -1;
    this.waveSecondarySkipBEnd = -1;
    this.blendDebugSeamAStart = -1;
    this.blendDebugSeamBStart = -1;
    this.blendDebugSeamASource = "none";
    this.blendDebugSeamBSource = "none";
    this.blendDebug = {
      frame: 0,
      mode: this.primaryBlendMode,
      reverseFrom: false,
      phase: 0,
      useTransition: false,
      rawWorkPxA: 0,
      rawWorkPxB: 0,
      seamEventsA: 0,
      seamEventsB: 0,
      seamSignificantA: 0,
      seamSignificantB: 0,
      transitionStartsA: 0,
      transitionStartsB: 0,
      transitionRestartsA: 0,
      transitionRestartsB: 0,
      eventLogA: [],
      eventLogB: [],
      probePrimed: false,
      prevProbeRaw: new Float32Array(this.n * 2),
      prevProbeSmooth: new Float32Array(this.n * 2),
      probeRawScratch: new Float32Array(this.n * 2),
      probeSmoothScratch: new Float32Array(this.n * 2),
      jumpRawAllPx: 0,
      jumpSmoothAllPx: 0,
      jumpRawAwayPx: 0,
      jumpSmoothAwayPx: 0,
      seamLocalityRaw: 1,
      seamLocalitySmooth: 1,
      seamCutSuspect: false
    };
    this.crestsA = [];
    this.troughsA = [];
    this.crestsB = [];
    this.troughsB = [];
    this.crestsSecondaryA = [];
    this.troughsSecondaryA = [];
    this.crestsSecondaryB = [];
    this.troughsSecondaryB = [];
    this.baselineAnchorCountA = 0;
    this.baselineAnchorCountB = 0;
    this.baselineAnchorCountSecondaryA = 0;
    this.baselineAnchorCountSecondaryB = 0;
    this.baselineAnchorPointsA = new Float32Array(0);
    this.baselineAnchorPointsB = new Float32Array(0);
    this.baselineAnchorPointsSecondaryA = new Float32Array(0);
    this.baselineAnchorPointsSecondaryB = new Float32Array(0);
    this.baselineEdgeIntersectionPointsA = new Float32Array(0);
    this.baselineEdgeIntersectionPointsB = new Float32Array(0);
    this.baselineEdgeIntersectionLabelsA = [];
    this.baselineEdgeIntersectionLabelsB = [];
    this.baselineEdgeIntersectionDetailsA = [];
    this.baselineEdgeIntersectionDetailsB = [];
    this.baselineCurrentAnchorsA = [];
    this.baselineCurrentAnchorsB = [];
    this.baselineCurrentStateA = [];
    this.baselineCurrentStateB = [];
    this.baselineAMode = "current";
    this.baselineAArcAnchors = [];
    this.baselineBArcAnchors = [];
    this.baselineASelectedAnchor = 0;
    this.baselineBSelectedAnchor = 0;
    this.baselineAPivotIndex = -1;
    this.baselineAPivotStrength = 0;
    this.baselineAPivotEllipseDistance = Infinity;
    this.baselineAPivotCenterDistancePx = Infinity;
    this.baselineAPivotStableIndex = -1;
    this.baselineAPivotTransitionFromIndex = -1;
    this.baselineAPivotTransitionToIndex = -1;
    this.baselineAPivotTransitionT = 1;
    this.baselineAPivotSmoothedStrength = 0;
    this.baselineBPivotIndex = -1;
    this.baselineBPivotStrength = 0;
    this.baselineBPivotEllipseDistance = Infinity;
    this.baselineBPivotCenterDistancePx = Infinity;
    this.baselineBPivotStableIndex = -1;
    this.baselineBPivotTransitionFromIndex = -1;
    this.baselineBPivotTransitionToIndex = -1;
    this.baselineBPivotTransitionT = 1;
    this.baselineBPivotSmoothedStrength = 0;
    this.baselineAEllipseRadiusXPx = CONFIG.interaction.baselineAEllipseRadiusXPx;
    this.baselineAEllipseRadiusYPx = CONFIG.interaction.baselineAEllipseRadiusYPx;
    this.baselineAEllipseRotationDeg = CONFIG.interaction.baselineAEllipseRotationDeg;
    this.baselineAExpK = CONFIG.interaction.baselineAExpK;
    this.baselineAInductionMaxAnchors = CONFIG.interaction.baselineAInductionMaxAnchors;
    this.baselineACenterRadiusPx = CONFIG.interaction.baselineACenterRadiusPx;
    this.baselineAMinGradientBandPx = CONFIG.interaction.baselineAMinGradientBandPx;
    this.baselineAPivotSwitchMarginPx = CONFIG.interaction.baselineAPivotSwitchMarginPx;
    this.baselineAPivotStrengthLerp = CONFIG.interaction.baselineAPivotStrengthLerp;
    this.baselineAPivotTransitionLerp = CONFIG.interaction.baselineAPivotTransitionLerp;
    this.baselineALiveStateA = [];
    this.baselineBLiveStateB = [];
    this.markerPosA = new Float32Array(0);
    this.markerPosB = new Float32Array(0);
    this.markerPosSecondaryA = new Float32Array(0);
    this.markerPosSecondaryB = new Float32Array(0);
    this.travelArcA = 0;
    this.travelArcB = 0;
    this.lastFrameTimeMs = 0;
    this.frameHandle = 0;
    this.hudTickCounter = 0;

    this.vertexData = new Float32Array(8192);
    this.vertexCount = 0;

    this.onResize = this.onResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerOut = this.onPointerOut.bind(this);

    this.initGL();
    this.initPixiZoomBlur();
    this.setupOverlays();
    this.setupBaselineControl();
    this.attach();
    this.resize();
    this.render();
    this.updateHud();
    this.startAnimation();
  }

  initGL() {
    const gl =
      this.canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      }) ||
      this.canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      }) ||
      this.canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });

    if (!gl) {
      throw new Error("WebGL unavailable");
    }

    const vertexShader = `
      attribute vec2 aPosition;
      attribute vec4 aColor;
      varying vec4 vColor;

      void main() {
        vColor = aColor;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision mediump float;
      varying vec4 vColor;

      void main() {
        gl_FragColor = vColor;
      }
    `;

    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.buffer = gl.createBuffer();

    if (!this.buffer) {
      throw new Error("Unable to allocate vertex buffer");
    }

    this.aPosition = gl.getAttribLocation(this.program, "aPosition");
    this.aColor = gl.getAttribLocation(this.program, "aColor");

    this.gl = gl;
    this.configurePrimaryAttributes();
  }

  configurePrimaryAttributes() {
    const gl = this.gl;
    if (!gl || !this.program || !this.buffer) {
      return;
    }
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const stride = 6 * 4;
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, stride, 2 * 4);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  initPixiZoomBlur() {
    const PIXI = window.PIXI;
    const ZoomBlurFilter = window.PIXI?.filters?.ZoomBlurFilter;
    if (!PIXI || !ZoomBlurFilter || !this.pixiCanvas) {
      this.pixiZoomReady = false;
      if (!this.pixiCanvas) {
        this.pixiZoomError = "Missing #pixi-post-canvas element";
      } else if (!PIXI) {
        this.pixiZoomError = "window.PIXI unavailable (pixi.js not loaded)";
      } else {
        this.pixiZoomError = "PIXI.filters.ZoomBlurFilter unavailable (pixi-filters not loaded)";
      }
      if (this.pixiCanvas) {
        this.pixiCanvas.style.opacity = "0";
      }
      this.canvas.style.opacity = "1";
      return;
    }

    try {
      const app = new PIXI.Application({
        view: this.pixiCanvas,
        width: Math.max(1, this.canvas.width || 1),
        height: Math.max(1, this.canvas.height || 1),
        autoDensity: false,
        resolution: 1,
        transparent: true,
        antialias: true,
        backgroundAlpha: 0,
        autoStart: false,
        sharedTicker: false
      });
      if (app.ticker) {
        app.ticker.stop();
      }
      app.stage.sortableChildren = true;

      const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
      sprite.x = 0;
      sprite.y = 0;
      sprite.width = app.renderer.width;
      sprite.height = app.renderer.height;
      sprite.zIndex = 1;

      const filter = new ZoomBlurFilter();
      filter.center = [
        this.zoomBlurCenterXNorm * app.renderer.width,
        this.zoomBlurCenterYNorm * app.renderer.height
      ];
      filter.innerRadius = this.zoomBlurInnerRadiusPx;
      filter.radius = this.zoomBlurRadiusPx;
      filter.strength = this.zoomBlurStrength;
      filter.maxKernelSize = this.zoomBlurKernelSize;
      sprite.filters = [filter];

      app.stage.addChild(sprite);

      this.pixiApp = app;
      this.pixiSprite = sprite;
      this.pixiZoomFilter = filter;
      this.rebuildPixiSourceTexture();
      this.pixiZoomReady = true;
      this.pixiZoomError = "";
      this.canvas.style.opacity = this.pixiZoomEnabled ? "0" : "1";
      this.pixiCanvas.style.opacity = this.pixiZoomEnabled ? "1" : "0";
    } catch (error) {
      this.pixiApp = null;
      this.pixiTexture = null;
      this.pixiSprite = null;
      this.pixiZoomFilter = null;
      this.pixiZoomReady = false;
      this.pixiZoomError = String(error?.message || error);
      if (this.pixiCanvas) {
        this.pixiCanvas.style.opacity = "0";
      }
      this.canvas.style.opacity = "1";
    }
  }

  rebuildPixiSourceTexture() {
    const PIXI = window.PIXI;
    if (!PIXI || !this.pixiApp || !this.pixiSprite) {
      return;
    }
    try {
      if (this.pixiTexture) {
        this.pixiTexture.destroy(true);
      }
    } catch (_error) {
      // Ignore texture disposal issues; we'll replace it below.
    }
    this.pixiTexture = PIXI.Texture.from(this.canvas);
    this.pixiSprite.texture = this.pixiTexture;
  }

  resizePixiZoom(width, height) {
    if (!this.pixiZoomReady || !this.pixiApp || !this.pixiSprite || !this.pixiZoomFilter) {
      return;
    }
    this.pixiApp.renderer.resize(width, height);
    this.rebuildPixiSourceTexture();
    this.pixiSprite.width = width;
    this.pixiSprite.height = height;
    this.pixiZoomFilter.center = [
      this.zoomBlurCenterXNorm * width,
      this.zoomBlurCenterYNorm * height
    ];
  }

  renderPixiZoomOverlay() {
    if (!this.pixiZoomReady || !this.pixiApp || !this.pixiTexture || !this.pixiZoomFilter) {
      if (this.pixiCanvas) {
        this.pixiCanvas.style.opacity = "0";
      }
      this.canvas.style.opacity = "1";
      return;
    }
    const shouldRenderPixi = this.pixiZoomEnabled;
    if (this.pixiCanvas) {
      this.pixiCanvas.style.opacity = shouldRenderPixi ? "1" : "0";
    }
    this.canvas.style.opacity = shouldRenderPixi ? "0" : "1";
    if (!shouldRenderPixi) {
      return;
    }
    const baseTexture = this.pixiTexture?.baseTexture || null;
    const textureWidth = Math.round(baseTexture?.realWidth || 0);
    const textureHeight = Math.round(baseTexture?.realHeight || 0);
    if (
      !this.pixiTexture ||
      textureWidth !== Math.round(this.canvas.width) ||
      textureHeight !== Math.round(this.canvas.height)
    ) {
      this.rebuildPixiSourceTexture();
    }
    const nextBaseTexture = this.pixiTexture?.baseTexture || null;
    if (nextBaseTexture && typeof nextBaseTexture.update === "function") {
      nextBaseTexture.update();
    }
    this.pixiZoomFilter.center = [
      this.zoomBlurCenterXNorm * this.pixiApp.renderer.width,
      this.zoomBlurCenterYNorm * this.pixiApp.renderer.height
    ];
    this.pixiZoomFilter.innerRadius = this.zoomBlurInnerRadiusPx;
    this.pixiZoomFilter.radius = this.zoomBlurRadiusPx;
    this.pixiZoomFilter.strength = this.zoomBlurStrength;
    this.pixiZoomFilter.maxKernelSize = this.zoomBlurKernelSize;
    this.pixiApp.render();
  }

  setupOverlays() {
    for (const setName of ["key"]) {
      const overlay = this.overlays?.[setName];
      if (!overlay) {
        continue;
      }

      overlay.onload = () => {
        this.overlayLoadedBySet[setName] = true;
        this.applyOverlayState();
        this.updateHud();
      };

      overlay.onerror = () => {
        this.overlayLoadedBySet[setName] = false;
        overlay.hidden = true;
        this.updateHud(`Reference overlay missing for ${setName}: ${REFERENCE_IMAGE_BY_SET[setName]}`);
      };

      overlay.src = REFERENCE_IMAGE_BY_SET[setName];
      overlay.style.opacity = String(clamp(this.overlayOpacity, 0, 1));
    }

    this.applyOverlayState();
  }

  applyOverlayState() {
    for (const setName of ["key"]) {
      const overlay = this.overlays?.[setName];
      if (!overlay) {
        continue;
      }
      const loaded = !!this.overlayLoadedBySet[setName];
      const enabled = !!this.systemEnabled[setName];
      overlay.hidden = !(this.overlayVisible && loaded && enabled);
      overlay.style.opacity = String(clamp(this.overlayOpacity, 0, 1));
    }
  }

  normalizePixiBlurRadii() {
    this.zoomBlurInnerRadiusPx = Math.max(0, Number(this.zoomBlurInnerRadiusPx) || 0);
    this.zoomBlurRadiusPx = Math.max(this.zoomBlurInnerRadiusPx + 1, Number(this.zoomBlurRadiusPx) || 1);
  }

  syncPixiBlurControlsFromState() {
    this.normalizePixiBlurRadii();
    if (this.pixiBlurEnabledInput) {
      this.pixiBlurEnabledInput.checked = !!this.pixiZoomEnabled;
    }
    if (this.pixiBlurCenterXInput) {
      this.pixiBlurCenterXInput.value = this.zoomBlurCenterXNorm.toFixed(3);
    }
    if (this.pixiBlurCenterXValue) {
      this.pixiBlurCenterXValue.textContent = this.zoomBlurCenterXNorm.toFixed(3);
    }
    if (this.pixiBlurCenterYInput) {
      this.pixiBlurCenterYInput.value = this.zoomBlurCenterYNorm.toFixed(3);
    }
    if (this.pixiBlurCenterYValue) {
      this.pixiBlurCenterYValue.textContent = this.zoomBlurCenterYNorm.toFixed(3);
    }
    if (this.pixiBlurInnerRadiusInput) {
      this.pixiBlurInnerRadiusInput.value = String(Math.round(this.zoomBlurInnerRadiusPx));
    }
    if (this.pixiBlurInnerRadiusValue) {
      this.pixiBlurInnerRadiusValue.textContent = String(Math.round(this.zoomBlurInnerRadiusPx));
    }
    if (this.pixiBlurRadiusInput) {
      this.pixiBlurRadiusInput.value = String(Math.round(this.zoomBlurRadiusPx));
    }
    if (this.pixiBlurRadiusValue) {
      this.pixiBlurRadiusValue.textContent = String(Math.round(this.zoomBlurRadiusPx));
    }
    if (this.pixiBlurStrengthInput) {
      this.pixiBlurStrengthInput.value = this.zoomBlurStrength.toFixed(3);
    }
    if (this.pixiBlurStrengthValue) {
      this.pixiBlurStrengthValue.textContent = this.zoomBlurStrength.toFixed(3);
    }
    if (this.pixiBlurKernelInput) {
      this.pixiBlurKernelInput.value = String(Math.round(this.zoomBlurKernelSize));
    }
    if (this.pixiBlurKernelValue) {
      this.pixiBlurKernelValue.textContent = String(Math.round(this.zoomBlurKernelSize));
    }
  }

  setupBaselineControl() {
    this.syncPixiBlurControlsFromState();

    if (this.motionToggleButton) {
      this.motionToggleButton.addEventListener("click", () => {
        this.setMotionPaused(!this.motionPaused);
      });
      this.updateMotionToggleButton();
    }

    if (this.baselineAModeButton) {
      this.baselineAModeButton.addEventListener("click", () => {
        const next = this.baselineAMode === "arc" ? "current" : "arc";
        this.setBaselineAMode(next);
      });
      this.updateBaselineAModeButton();
    }

    if (this.blendModeButton) {
      this.blendModeButton.addEventListener("click", () => {
        this.cyclePrimaryBlendMode(1);
      });
      this.updateBlendModeButton();
    }

    if (this.baselineAEllipseRxInput) {
      this.baselineAEllipseRxInput.value = String(Math.round(this.baselineAEllipseRadiusXPx));
      if (this.baselineAEllipseRxValue) {
        this.baselineAEllipseRxValue.textContent = String(
          Math.round(this.baselineAEllipseRadiusXPx)
        );
      }
      this.baselineAEllipseRxInput.addEventListener("input", () => {
        const next = Number(this.baselineAEllipseRxInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.baselineAEllipseRadiusXPx = clamp(next, 20, 4000);
        if (this.baselineAEllipseRxValue) {
          this.baselineAEllipseRxValue.textContent = String(
            Math.round(this.baselineAEllipseRadiusXPx)
          );
        }
        this.updateHud();
      });
    }

    if (this.baselineAEllipseRyInput) {
      this.baselineAEllipseRyInput.value = String(Math.round(this.baselineAEllipseRadiusYPx));
      if (this.baselineAEllipseRyValue) {
        this.baselineAEllipseRyValue.textContent = String(
          Math.round(this.baselineAEllipseRadiusYPx)
        );
      }
      this.baselineAEllipseRyInput.addEventListener("input", () => {
        const next = Number(this.baselineAEllipseRyInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.baselineAEllipseRadiusYPx = clamp(next, 20, 4000);
        if (this.baselineAEllipseRyValue) {
          this.baselineAEllipseRyValue.textContent = String(
            Math.round(this.baselineAEllipseRadiusYPx)
          );
        }
        this.updateHud();
      });
    }

    if (this.keySystemToggle) {
      this.keySystemToggle.checked = this.systemEnabled.key;
      this.keySystemToggle.addEventListener("change", () => {
        this.setSystemEnabled("key", this.keySystemToggle.checked);
      });
    }

    if (this.pixiBlurEnabledInput) {
      this.pixiBlurEnabledInput.addEventListener("change", () => {
        this.pixiZoomEnabled = !!this.pixiBlurEnabledInput.checked;
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurCenterXInput) {
      this.pixiBlurCenterXInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurCenterXInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurCenterXNorm = clamp(next, 0, 1);
        if (this.pixiBlurCenterXValue) {
          this.pixiBlurCenterXValue.textContent = this.zoomBlurCenterXNorm.toFixed(3);
        }
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurCenterYInput) {
      this.pixiBlurCenterYInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurCenterYInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurCenterYNorm = clamp(next, 0, 1);
        if (this.pixiBlurCenterYValue) {
          this.pixiBlurCenterYValue.textContent = this.zoomBlurCenterYNorm.toFixed(3);
        }
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurInnerRadiusInput) {
      this.pixiBlurInnerRadiusInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurInnerRadiusInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurInnerRadiusPx = Math.max(0, next);
        this.normalizePixiBlurRadii();
        this.syncPixiBlurControlsFromState();
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurRadiusInput) {
      this.pixiBlurRadiusInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurRadiusInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurRadiusPx = Math.max(1, next);
        this.normalizePixiBlurRadii();
        this.syncPixiBlurControlsFromState();
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurStrengthInput) {
      this.pixiBlurStrengthInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurStrengthInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurStrength = clamp(next, 0, 2);
        if (this.pixiBlurStrengthValue) {
          this.pixiBlurStrengthValue.textContent = this.zoomBlurStrength.toFixed(3);
        }
        this.render();
        this.updateHud();
      });
    }

    if (this.pixiBlurKernelInput) {
      this.pixiBlurKernelInput.addEventListener("input", () => {
        const next = Number(this.pixiBlurKernelInput.value);
        if (!Number.isFinite(next)) {
          return;
        }
        this.zoomBlurKernelSize = Math.round(clamp(next, 3, 32));
        if (this.pixiBlurKernelValue) {
          this.pixiBlurKernelValue.textContent = String(this.zoomBlurKernelSize);
        }
        this.render();
        this.updateHud();
      });
    }
  }

  setSystemEnabled(systemName, enabled) {
    if (systemName !== "key") {
      return;
    }

    this.systemEnabled[systemName] = !!enabled;
    if (this.keySystemToggle && systemName === "key") {
      this.keySystemToggle.checked = this.systemEnabled.key;
    }

    this.applyOverlayState();
    this.buildVertices();
    this.render();
    this.updateHud();
  }

  setMotionPaused(paused) {
    const nextPaused = !!paused;
    if (!nextPaused && this.motionScrubMode) {
      this.motionScrubMode = false;
    }
    this.motionPaused = nextPaused;
    this.updateMotionToggleButton();
    this.updateHud();
  }

  updateMotionToggleButton() {
    if (!this.motionToggleButton) {
      return;
    }
    this.motionToggleButton.textContent = this.motionPaused ? "Resume Motion" : "Pause Motion";
  }

  setMotionScrubMode(enabled, autoPause = true) {
    const next = !!enabled;
    if (this.motionScrubMode === next) {
      this.updateHud();
      return;
    }
    this.motionScrubMode = next;
    if (next && autoPause) {
      this.motionPaused = true;
      this.updateMotionToggleButton();
    }
    this.updateHud();
  }

  advanceMotionByDeltaSeconds(deltaSeconds, ignorePause = false) {
    const dt = Number(deltaSeconds);
    if (!Number.isFinite(dt)) {
      return;
    }
    const speed = ignorePause ? this.motionSpeedPxPerSecond : this.motionPaused ? 0 : this.motionSpeedPxPerSecond;
    this.travelArcA = this.wrapArc(
      this.travelArcA + dt * speed * this.travelDirectionA,
      this.baseArcLenA
    );
    this.travelArcB = this.wrapArc(
      this.travelArcB + dt * speed * this.travelDirectionB,
      this.baseArcLenB
    );
    const motionDt = Math.abs(speed) > 1e-6 ? Math.abs(dt) : 0;
    if (motionDt > 0 && this.blendDebug) {
      this.blendDebug.frame += 1;
    }
    this.updateTravelWaves(motionDt);
    this.updateTravelMarkers();
    this.buildVertices();
    this.render();
  }

  stepMotionScrub(direction, stepScale = 1) {
    const dir = Math.sign(direction);
    if (!dir) {
      return;
    }
    if (!this.motionScrubMode) {
      this.setMotionScrubMode(true, true);
    }
    const scale = Math.max(1, Math.floor(Number(stepScale) || 1));
    const dt = this.motionScrubStepSeconds * scale * dir;
    this.advanceMotionByDeltaSeconds(dt, true);
    this.updateHud();
  }

  updateBaselineAModeButton() {
    if (!this.baselineAModeButton) {
      return;
    }
    this.baselineAModeButton.textContent =
      this.baselineAMode === "arc" ? "Baseline B: Arc" : "Baseline B: Current";
  }

  resolveD3InterpolatePathFunction() {
    if (typeof window === "undefined") {
      return null;
    }
    const globalAny = window;
    if (globalAny.d3 && typeof globalAny.d3.interpolatePath === "function") {
      return globalAny.d3.interpolatePath.bind(globalAny.d3);
    }
    if (typeof globalAny.interpolatePath === "function") {
      return globalAny.interpolatePath.bind(globalAny);
    }
    if (
      globalAny.d3InterpolatePath &&
      typeof globalAny.d3InterpolatePath.interpolatePath === "function"
    ) {
      return globalAny.d3InterpolatePath.interpolatePath.bind(globalAny.d3InterpolatePath);
    }
    return null;
  }

  getPrimaryBlendModeLabel(mode = this.primaryBlendMode) {
    switch (mode) {
      case BLEND_MODE_FROZEN_PHASE:
        return "Frozen Phase";
      case BLEND_MODE_ARC_LENGTH:
        return "Arc Length";
      case BLEND_MODE_SEAM_INVARIANT:
        return "Seam Invariant";
      case BLEND_MODE_CENTER_LOCK_D3_SEAM:
        return "Center Lock D3 Seam";
      case BLEND_MODE_DIRECT_INDEX:
      default:
        return "Direct Index";
    }
  }

  resetPrimaryBlendPhase() {
    this.primaryBlendFrozenState.initialized = false;
    this.primaryBlendFrozenState.segCount = 0;
    this.primaryBlendFrozenState.reverseFrom = false;
    this.primaryBlendFrozenState.phase = 0;
    this.primaryBlendFrozenState.target = 0;
  }

  createBlendMapTransitionState() {
    return {
      primed: false,
      active: false,
      prevSkipStart: -1,
      prevSkipEnd: -1,
      prevSeamPeriod: Math.max(1, this.n - 1),
      prevSeamSource: "none",
      elapsedSec: 0,
      durationSec: 1,
      lastDeltaStart: 0,
      lastDeltaEnd: 0,
      prevCurve: new Float32Array(this.n * 2),
      fromCurve: new Float32Array(this.n * 2),
      targetCurve: new Float32Array(this.n * 2),
      workCurve: new Float32Array(this.n * 2)
    };
  }

  createIntermediatePocTransitionState() {
    return {
      primed: false,
      active: false,
      count: 0,
      elapsedSec: 0,
      durationSec: 1,
      starts: 0,
      restarts: 0,
      lastMappingChanged: false,
      prevMapA: new Int32Array(0),
      prevMapB: new Int32Array(0),
      fromAnchors: new Float32Array(0),
      fromOut: new Float32Array(0),
      fromIn: new Float32Array(0),
      targetAnchors: new Float32Array(0),
      targetOut: new Float32Array(0),
      targetIn: new Float32Array(0),
      workAnchors: new Float32Array(0),
      workOut: new Float32Array(0),
      workIn: new Float32Array(0)
    };
  }

  resetIntermediatePocTransitionState() {
    const state = this.intermediatePocTransition;
    if (!state) {
      return;
    }
    state.primed = false;
    state.active = false;
    state.count = 0;
    state.elapsedSec = 0;
    state.durationSec = 1;
    state.starts = 0;
    state.restarts = 0;
    state.lastMappingChanged = false;
  }

  ensureIntermediatePocTransitionCapacity(count) {
    const state = this.intermediatePocTransition;
    const c = Math.max(0, count | 0);
    if (state.count === c) {
      return;
    }
    const vecLen = c * 2;
    state.count = c;
    state.prevMapA = new Int32Array(c);
    state.prevMapB = new Int32Array(c);
    state.prevMapA.fill(-1);
    state.prevMapB.fill(-1);
    state.fromAnchors = new Float32Array(vecLen);
    state.fromOut = new Float32Array(vecLen);
    state.fromIn = new Float32Array(vecLen);
    state.targetAnchors = new Float32Array(vecLen);
    state.targetOut = new Float32Array(vecLen);
    state.targetIn = new Float32Array(vecLen);
    state.workAnchors = new Float32Array(vecLen);
    state.workOut = new Float32Array(vecLen);
    state.workIn = new Float32Array(vecLen);
    state.primed = false;
    state.active = false;
    state.elapsedSec = 0;
  }

  estimateIntermediatePocNextSnapSeconds() {
    const nextA = this.estimateNextSeamEventSeconds(
      this.anchorStateA,
      this.baseArcLenA,
      this.travelArcA,
      this.travelDirectionA
    );
    const nextB = this.estimateNextSeamEventSeconds(
      this.anchorStateB,
      this.baseArcLenB,
      this.travelArcB,
      this.travelDirectionB
    );
    return Math.min(nextA, nextB);
  }

  pushBlendDebugEvent(label, message) {
    if (!this.blendDebug) {
      return;
    }
    const list = label === "A" ? this.blendDebug.eventLogA : this.blendDebug.eventLogB;
    list.push(message);
    if (list.length > 6) {
      list.shift();
    }
  }

  maxCurveDeltaPx(curveA, curveB, sampleStep = 1) {
    if (!curveA?.length || !curveB?.length) {
      return 0;
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let maxDist = 0;
    const step = Math.max(1, sampleStep | 0);
    for (let i = 0; i < this.n; i += step) {
      const k = i * 2;
      const dx = (curveA[k] - curveB[k]) * cw;
      const dy = (curveA[k + 1] - curveB[k + 1]) * ch;
      const d = Math.hypot(dx, dy);
      if (d > maxDist) {
        maxDist = d;
      }
    }
    return maxDist;
  }

  resetBlendMapTransitions() {
    const resetOne = (state) => {
      if (!state) {
        return;
      }
      state.primed = false;
      state.active = false;
      state.prevSkipStart = -1;
      state.prevSkipEnd = -1;
      state.prevSeamPeriod = Math.max(1, this.n - 1);
      state.prevSeamSource = "none";
      state.elapsedSec = 0;
      state.durationSec = 1;
    };
    resetOne(this.blendMapA);
    resetOne(this.blendMapB);
  }

  resolveBlendTransitionSeam(skipStart, skipEnd, orderStart, orderEnd, orderCount) {
    if (this.hasSkipRange(skipStart, skipEnd)) {
      return {
        start: skipStart,
        end: skipEnd,
        period: Math.max(1, this.n - 1),
        source: "skip"
      };
    }
    if (
      Number.isFinite(orderStart) &&
      Number.isFinite(orderEnd) &&
      Number.isFinite(orderCount) &&
      orderCount > 1
    ) {
      return {
        start: orderStart,
        end: orderEnd,
        period: Math.max(2, orderCount | 0),
        source: "order"
      };
    }
    return {
      start: -1,
      end: -1,
      period: Math.max(1, this.n - 1),
      source: "none"
    };
  }

  resetBlendDebugStats() {
    if (!this.blendDebug) {
      return;
    }
    this.blendDebug.frame = 0;
    this.blendDebug.mode = this.primaryBlendMode;
    this.blendDebug.reverseFrom = false;
    this.blendDebug.phase = 0;
    this.blendDebug.useTransition = false;
    this.blendDebug.rawWorkPxA = 0;
    this.blendDebug.rawWorkPxB = 0;
    this.blendDebug.seamEventsA = 0;
    this.blendDebug.seamEventsB = 0;
    this.blendDebug.seamSignificantA = 0;
    this.blendDebug.seamSignificantB = 0;
    this.blendDebug.transitionStartsA = 0;
    this.blendDebug.transitionStartsB = 0;
    this.blendDebug.transitionRestartsA = 0;
    this.blendDebug.transitionRestartsB = 0;
    this.blendDebug.eventLogA.length = 0;
    this.blendDebug.eventLogB.length = 0;
    this.blendDebug.probePrimed = false;
    this.blendDebug.jumpRawAllPx = 0;
    this.blendDebug.jumpSmoothAllPx = 0;
    this.blendDebug.jumpRawAwayPx = 0;
    this.blendDebug.jumpSmoothAwayPx = 0;
    this.blendDebug.seamLocalityRaw = 1;
    this.blendDebug.seamLocalitySmooth = 1;
    this.blendDebug.seamCutSuspect = false;
    this.blendDebugSeamAStart = -1;
    this.blendDebugSeamBStart = -1;
    this.blendDebugSeamASource = "none";
    this.blendDebugSeamBSource = "none";
  }

  isBlendMapTransitionMode(mode = this.primaryBlendMode) {
    return (
      mode === BLEND_MODE_DIRECT_INDEX ||
      mode === BLEND_MODE_FROZEN_PHASE ||
      mode === BLEND_MODE_ARC_LENGTH ||
      mode === BLEND_MODE_CENTER_LOCK_D3_SEAM
    );
  }

  easeBlendMapTransition(t) {
    const tc = clamp(t, 0, 1);
    return tc * tc * (3 - 2 * tc);
  }

  circularSegmentDelta(next, prev, segCount) {
    if (!Number.isFinite(next) || !Number.isFinite(prev) || segCount <= 0) {
      return 0;
    }
    let d = next - prev;
    const half = segCount * 0.5;
    if (d > half) {
      d -= segCount;
    } else if (d < -half) {
      d += segCount;
    }
    return d;
  }

  isSignificantSeamJump(prevStart, prevEnd, nextStart, nextEnd, period) {
    if (prevStart < 0 || prevEnd < 0 || nextStart < 0 || nextEnd < 0) {
      return true;
    }
    const segCount = Math.max(1, period | 0);
    const dStart = Math.abs(this.circularSegmentDelta(nextStart, prevStart, segCount));
    const dEnd = Math.abs(this.circularSegmentDelta(nextEnd, prevEnd, segCount));
    return (
      dStart > this.blendMapSeamJumpToleranceSegments ||
      dEnd > this.blendMapSeamJumpToleranceSegments
    );
  }

  estimateNextSeamEventSeconds(anchorStates, totalArc, arcOffset, direction) {
    if (!Array.isArray(anchorStates) || !anchorStates.length || totalArc <= 1e-6) {
      return Number.POSITIVE_INFINITY;
    }
    const speedAbs = Math.abs(this.motionSpeedPxPerSecond);
    if (speedAbs <= 1e-6) {
      return Number.POSITIVE_INFINITY;
    }
    const dir = Math.sign(direction) || 1;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < anchorStates.length; i += 1) {
      const state = anchorStates[i];
      const u = this.wrapArc(state.u0 + arcOffset, totalArc);
      let dist = dir >= 0 ? totalArc - u : u;
      if (dist < 1e-6) {
        dist = totalArc;
      }
      const seconds = dist / speedAbs;
      if (seconds > 1e-6 && seconds < best) {
        best = seconds;
      }
    }
    return best;
  }

  updateSingleBlendMapTransition(
    label,
    state,
    curve,
    seamStart,
    seamEnd,
    seamPeriod,
    seamSource,
    anchorStates,
    totalArc,
    arcOffset,
    direction,
    dtSeconds
  ) {
    if (!state || !curve?.length) {
      return curve;
    }

    if (!state.primed) {
      state.prevCurve.set(curve);
      state.workCurve.set(curve);
      state.prevSkipStart = seamStart;
      state.prevSkipEnd = seamEnd;
      state.prevSeamPeriod = Math.max(1, seamPeriod | 0);
      state.prevSeamSource = seamSource || "none";
      state.primed = true;
      state.active = false;
      return state.workCurve;
    }

    const segCount = Math.max(1, seamPeriod | 0);
    const seamChanged =
      state.prevSkipStart !== seamStart ||
      state.prevSkipEnd !== seamEnd ||
      state.prevSeamPeriod !== segCount ||
      state.prevSeamSource !== seamSource;
    const dStart = this.circularSegmentDelta(seamStart, state.prevSkipStart, segCount);
    const dEnd = this.circularSegmentDelta(seamEnd, state.prevSkipEnd, segCount);
    let seamJump = false;
    if (seamChanged) {
      if (seamSource === "order" && state.prevSeamSource === "order") {
        seamJump =
          seamStart >= 0 &&
          seamEnd >= 0 &&
          state.prevSkipStart >= 0 &&
          state.prevSkipEnd >= 0;
      } else {
        seamJump = this.isSignificantSeamJump(
          state.prevSkipStart,
          state.prevSkipEnd,
          seamStart,
          seamEnd,
          segCount
        );
      }
    }
    if (seamChanged && this.blendDebug) {
      if (label === "A") {
        this.blendDebug.seamEventsA += 1;
      } else {
        this.blendDebug.seamEventsB += 1;
      }
      this.pushBlendDebugEvent(
        label,
        `f${this.blendDebug.frame} ${state.prevSeamSource}:${state.prevSkipStart}/${state.prevSkipEnd} -> ${seamSource}:${seamStart}/${seamEnd} p${segCount} d(${dStart.toFixed(2)},${dEnd.toFixed(2)}) ${seamJump ? "jump" : "minor"}`
      );
      if (seamJump) {
        if (label === "A") {
          this.blendDebug.seamSignificantA += 1;
        } else {
          this.blendDebug.seamSignificantB += 1;
        }
      }
    }
    state.lastDeltaStart = dStart;
    state.lastDeltaEnd = dEnd;
    if (seamJump) {
      if (state.active) {
        state.fromCurve.set(state.workCurve);
        if (this.blendDebug) {
          if (label === "A") {
            this.blendDebug.transitionRestartsA += 1;
          } else {
            this.blendDebug.transitionRestartsB += 1;
          }
        }
      } else {
        state.fromCurve.set(state.prevCurve);
      }
      state.targetCurve.set(curve);
      state.elapsedSec = 0;
      const nextSeconds = this.estimateNextSeamEventSeconds(
        anchorStates,
        totalArc,
        arcOffset,
        direction
      );
      const fallback = Number.isFinite(state.durationSec) ? state.durationSec : 0.35;
      state.durationSec = clamp(
        Number.isFinite(nextSeconds) ? nextSeconds : fallback,
        this.blendMapMinDurationSec,
        this.blendMapMaxDurationSec
      );
      state.active = true;
      if (this.blendDebug) {
        if (label === "A") {
          this.blendDebug.transitionStartsA += 1;
        } else {
          this.blendDebug.transitionStartsB += 1;
        }
      }
    }

    if (state.active) {
      // Follow the continuously moving target mapping so the transition lands
      // on the live geometry, not on a stale snapshot.
      state.targetCurve.set(curve);
      state.elapsedSec += Math.max(0, Number(dtSeconds) || 0);
      const t = clamp(state.elapsedSec / Math.max(1e-6, state.durationSec), 0, 1);
      const w = this.easeBlendMapTransition(t);
      const inv = 1 - w;
      for (let i = 0; i < this.n * 2; i += 1) {
        state.workCurve[i] = state.fromCurve[i] * inv + state.targetCurve[i] * w;
      }
      if (t >= 1 - 1e-6) {
        state.active = false;
        state.workCurve.set(state.targetCurve);
      }
    } else {
      state.workCurve.set(curve);
    }

    state.prevCurve.set(curve);
    state.prevSkipStart = seamStart;
    state.prevSkipEnd = seamEnd;
    state.prevSeamPeriod = segCount;
    state.prevSeamSource = seamSource || "none";
    return state.workCurve;
  }

  updateBlendMapTransitions(dtSeconds = 0) {
    if (!this.isBlendMapTransitionMode()) {
      this.resetBlendMapTransitions();
      this.blendDebugSeamAStart = -1;
      this.blendDebugSeamBStart = -1;
      this.blendDebugSeamASource = "none";
      this.blendDebugSeamBSource = "none";
      return;
    }
    const dt = Math.max(0, Number(dtSeconds) || 0);
    const seamA = this.resolveBlendTransitionSeam(
      this.waveSkipAStart,
      this.waveSkipAEnd,
      this.waveOrderAStart,
      this.waveOrderAEnd,
      this.waveOrderACount
    );
    const seamB = this.resolveBlendTransitionSeam(
      this.waveSkipBStart,
      this.waveSkipBEnd,
      this.waveOrderBStart,
      this.waveOrderBEnd,
      this.waveOrderBCount
    );
    this.blendDebugSeamAStart = seamA.source === "skip" ? seamA.start : -1;
    this.blendDebugSeamBStart = seamB.source === "skip" ? seamB.start : -1;
    this.blendDebugSeamASource = seamA.source;
    this.blendDebugSeamBSource = seamB.source;
    this.updateSingleBlendMapTransition(
      "A",
      this.blendMapA,
      this.waveTravelA,
      seamA.start,
      seamA.end,
      seamA.period,
      seamA.source,
      this.anchorStateA,
      this.baseArcLenA,
      this.travelArcA,
      this.travelDirectionA,
      dt
    );
    this.updateSingleBlendMapTransition(
      "B",
      this.blendMapB,
      this.waveTravelB,
      seamB.start,
      seamB.end,
      seamB.period,
      seamB.source,
      this.anchorStateB,
      this.baseArcLenB,
      this.travelArcB,
      this.travelDirectionB,
      dt
    );
  }

  circularIndexDistance(a, b, period) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || period <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    let d = Math.abs(a - b);
    if (d > period * 0.5) {
      d = period - d;
    }
    return d;
  }

  computeMappedSeamIndexForFrom(skipStart, reverseFrom, phase, segCount) {
    if (!Number.isFinite(skipStart) || skipStart < 0) {
      return -1;
    }
    const base = reverseFrom ? segCount - 1 - skipStart : skipStart;
    const idx = base - phase;
    return this.wrapSegmentIndex(Math.round(idx), segCount);
  }

  buildProbeBlendCurve(mode, fromCurve, toCurve, reverseFrom, phase, t, outCurve) {
    const tc = clamp(t, 0, 1);
    const segCount = Math.max(1, this.n - 1);

    if (mode === BLEND_MODE_ARC_LENGTH) {
      const fromLen = this.computeArcTable(fromCurve, this.blendDebugArcFrom);
      const toLen = this.computeArcTable(toCurve, this.blendDebugArcTo);
      const phaseNorm = phase / segCount;
      for (let i = 0; i <= segCount; i += 1) {
        const u = i / segCount;
        let uf = reverseFrom ? 1 - u : u;
        uf = this.wrapUnit(uf + phaseNorm);
        const fromP = this.sampleFloat2AtArc(fromCurve, this.blendDebugArcFrom, uf * fromLen);
        const toP = this.sampleFloat2AtArc(toCurve, this.blendDebugArcTo, u * toLen);
        const k = i * 2;
        outCurve[k] = lerp(fromP.x, toP.x, tc);
        outCurve[k + 1] = lerp(fromP.y, toP.y, tc);
      }
      return outCurve;
    }

    for (let i = 0; i < segCount; i += 1) {
      const mappedBase = reverseFrom ? segCount - 1 - i : i;
      const jFloat = mappedBase + phase;
      const jFloor = Math.floor(jFloat);
      const frac = jFloat - jFloor;
      const jA = this.wrapSegmentIndex(jFloor, segCount);
      const jB = this.wrapSegmentIndex(jFloor + 1, segCount);

      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const a0 = jA * 2;
      const a1 = (jA + 1) * 2;
      const b0 = jB * 2;
      const b1 = (jB + 1) * 2;

      const fromX0 = lerp(fromCurve[a0], fromCurve[b0], frac);
      const fromY0 = lerp(fromCurve[a0 + 1], fromCurve[b0 + 1], frac);
      const fromX1 = lerp(fromCurve[a1], fromCurve[b1], frac);
      const fromY1 = lerp(fromCurve[a1 + 1], fromCurve[b1 + 1], frac);

      outCurve[k0] = lerp(fromX0, toCurve[k0], tc);
      outCurve[k0 + 1] = lerp(fromY0, toCurve[k0 + 1], tc);
      outCurve[k1] = lerp(fromX1, toCurve[k1], tc);
      outCurve[k1 + 1] = lerp(fromY1, toCurve[k1 + 1], tc);
    }
    return outCurve;
  }

  updateBlendDebugProbeMetrics({
    blendMode,
    reverseFrom,
    phase,
    rawFromCurve,
    rawToCurve,
    blendFromCurve,
    blendToCurve
  }) {
    if (!this.blendDebug) {
      return;
    }
    const dbg = this.blendDebug;
    dbg.mode = blendMode;
    dbg.reverseFrom = !!reverseFrom;
    dbg.phase = Number(phase) || 0;
    dbg.useTransition = !!(
      this.isBlendMapTransitionMode(blendMode) &&
      (this.blendMapA?.active || this.blendMapB?.active)
    );
    dbg.rawWorkPxA = this.maxCurveDeltaPx(rawToCurve, blendToCurve, 8);
    dbg.rawWorkPxB = this.maxCurveDeltaPx(rawFromCurve, blendFromCurve, 8);

    const segCount = Math.max(1, this.n - 1);
    const probeRaw = dbg.probeRawScratch;
    const probeSmooth = dbg.probeSmoothScratch;
    this.buildProbeBlendCurve(
      blendMode,
      rawFromCurve,
      rawToCurve,
      reverseFrom,
      phase,
      0.5,
      probeRaw
    );
    this.buildProbeBlendCurve(
      blendMode,
      blendFromCurve,
      blendToCurve,
      reverseFrom,
      phase,
      0.5,
      probeSmooth
    );

    const seamA = this.blendDebugSeamAStart >= 0 ? this.blendDebugSeamAStart : this.waveSkipAStart;
    const seamB = this.computeMappedSeamIndexForFrom(
      this.blendDebugSeamBStart >= 0 ? this.blendDebugSeamBStart : this.waveSkipBStart,
      reverseFrom,
      phase,
      segCount
    );
    const seamWindow = 18;

    if (!dbg.probePrimed) {
      dbg.prevProbeRaw.set(probeRaw);
      dbg.prevProbeSmooth.set(probeSmooth);
      dbg.probePrimed = true;
      dbg.jumpRawAllPx = 0;
      dbg.jumpSmoothAllPx = 0;
      dbg.jumpRawAwayPx = 0;
      dbg.jumpSmoothAwayPx = 0;
      dbg.seamLocalityRaw = 1;
      dbg.seamLocalitySmooth = 1;
      dbg.seamCutSuspect = false;
      return;
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let maxRawAll = 0;
    let maxSmoothAll = 0;
    let maxRawAway = 0;
    let maxSmoothAway = 0;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const drx = (probeRaw[k] - dbg.prevProbeRaw[k]) * cw;
      const dry = (probeRaw[k + 1] - dbg.prevProbeRaw[k + 1]) * ch;
      const dsx = (probeSmooth[k] - dbg.prevProbeSmooth[k]) * cw;
      const dsy = (probeSmooth[k + 1] - dbg.prevProbeSmooth[k + 1]) * ch;
      const dRaw = Math.hypot(drx, dry);
      const dSmooth = Math.hypot(dsx, dsy);
      if (dRaw > maxRawAll) {
        maxRawAll = dRaw;
      }
      if (dSmooth > maxSmoothAll) {
        maxSmoothAll = dSmooth;
      }

      const distA = seamA >= 0 ? this.circularIndexDistance(i, seamA, this.n) : Number.POSITIVE_INFINITY;
      const distB = seamB >= 0 ? this.circularIndexDistance(i, seamB, this.n) : Number.POSITIVE_INFINITY;
      const nearSeam = Math.min(distA, distB) <= seamWindow;
      if (!nearSeam) {
        if (dRaw > maxRawAway) {
          maxRawAway = dRaw;
        }
        if (dSmooth > maxSmoothAway) {
          maxSmoothAway = dSmooth;
        }
      }
    }

    dbg.jumpRawAllPx = maxRawAll;
    dbg.jumpSmoothAllPx = maxSmoothAll;
    dbg.jumpRawAwayPx = maxRawAway;
    dbg.jumpSmoothAwayPx = maxSmoothAway;
    dbg.seamLocalityRaw = maxRawAway > 1e-6 ? maxRawAll / maxRawAway : Number.POSITIVE_INFINITY;
    dbg.seamLocalitySmooth = maxSmoothAway > 1e-6 ? maxSmoothAll / maxSmoothAway : Number.POSITIVE_INFINITY;
    dbg.seamCutSuspect =
      dbg.seamLocalitySmooth > 1.8 && dbg.jumpSmoothAwayPx < dbg.jumpSmoothAllPx * 0.7;

    dbg.prevProbeRaw.set(probeRaw);
    dbg.prevProbeSmooth.set(probeSmooth);
  }

  getBlendDebugSectionLines() {
    if (!this.blendDebug) {
      return [];
    }
    const dbg = this.blendDebug;
    const aState = this.blendMapA;
    const bState = this.blendMapB;
    const fmtPx = (v) => (Number.isFinite(v) ? `${Number(v).toFixed(3)}px` : "n/a");
    const fmtNum = (v) => (Number.isFinite(v) ? Number(v).toFixed(3) : "n/a");
    const aProg = aState?.active
      ? Math.max(0, Math.min(1, aState.elapsedSec / Math.max(1e-6, aState.durationSec)))
      : 1;
    const bProg = bState?.active
      ? Math.max(0, Math.min(1, bState.elapsedSec / Math.max(1e-6, bState.durationSec)))
      : 1;
    const lastA = dbg.eventLogA.length ? dbg.eventLogA[dbg.eventLogA.length - 1] : "none";
    const lastB = dbg.eventLogB.length ? dbg.eventLogB[dbg.eventLogB.length - 1] : "none";
    return [
      "----- Blend Debug -----",
      `1) seam events A ${dbg.seamEventsA} (sig ${dbg.seamSignificantA}) src ${this.blendDebugSeamASource} last ${lastA} | B ${dbg.seamEventsB} (sig ${dbg.seamSignificantB}) src ${this.blendDebugSeamBSource} last ${lastB}`,
      `2) transition A ${aState?.active ? "active" : "idle"} p ${fmtNum(aProg)} t ${fmtNum(aState?.elapsedSec)}/${fmtNum(aState?.durationSec)}s starts ${dbg.transitionStartsA} restarts ${dbg.transitionRestartsA} | B ${bState?.active ? "active" : "idle"} p ${fmtNum(bProg)} t ${fmtNum(bState?.elapsedSec)}/${fmtNum(bState?.durationSec)}s starts ${dbg.transitionStartsB} restarts ${dbg.transitionRestartsB}`,
      `3) curve usage mode ${dbg.mode} reverse ${dbg.reverseFrom ? "yes" : "no"} phase ${fmtNum(dbg.phase)} transition ${dbg.useTransition ? "yes" : "no"} raw-vs-used A ${fmtPx(dbg.rawWorkPxA)} B ${fmtPx(dbg.rawWorkPxB)}`,
      `4) probe jump t=0.5 raw all ${fmtPx(dbg.jumpRawAllPx)} away ${fmtPx(dbg.jumpRawAwayPx)} | smooth all ${fmtPx(dbg.jumpSmoothAllPx)} away ${fmtPx(dbg.jumpSmoothAwayPx)}`,
      `5) seam-cut check locality raw ${fmtNum(dbg.seamLocalityRaw)} smooth ${fmtNum(dbg.seamLocalitySmooth)} suspect ${dbg.seamCutSuspect ? "yes" : "no"}`
    ];
  }

  getIntermediatePocDebugLines() {
    const st = this.intermediatePocTransition;
    if (!st) {
      return [];
    }
    const aCount = Math.max(0, (this.constraintAnchorA.length / 2) | 0);
    const bCount = Math.max(0, (this.constraintAnchorB.length / 2) | 0);
    const map = this.buildIntermediateAnchorMapRows(aCount, bCount);
    const rows = map.rows || [];
    const pick = (idx) => (idx >= 0 && idx < rows.length ? rows[idx] : null);
    const first = pick(0);
    const mid = pick((rows.length * 0.5) | 0);
    const last = pick(rows.length - 1);
    const fmt = (row) => {
      if (!row) {
        return "n/a";
      }
      const ai = this.mapLogicalToPhysicalAnchorIndex(row.a, aCount, !!this.primaryBlendPocReverseA);
      const bi = this.mapLogicalToPhysicalAnchorIndex(row.b, bCount, !!this.primaryBlendPocReverseB);
      return `I${row.i - 1}<-A${ai}+B${bi}`;
    };
    let i0AvgErrPx = Number.NaN;
    if (
      this.constraintIntermediatePoc.length >= 2 &&
      this.constraintAnchorA.length >= 2 &&
      this.constraintAnchorB.length >= 2 &&
      aCount > 0 &&
      bCount > 0
    ) {
      const a0 = this.mapLogicalToPhysicalAnchorIndex(1, aCount, !!this.primaryBlendPocReverseA) * 2;
      const b0 = this.mapLogicalToPhysicalAnchorIndex(1, bCount, !!this.primaryBlendPocReverseB) * 2;
      if (a0 >= 0 && b0 >= 0) {
        const tx = 0.5 * (this.constraintAnchorA[a0] + this.constraintAnchorB[b0]);
        const ty = 0.5 * (this.constraintAnchorA[a0 + 1] + this.constraintAnchorB[b0 + 1]);
        const dx = (this.constraintIntermediatePoc[0] - tx) * this.canvas.width;
        const dy = (this.constraintIntermediatePoc[1] - ty) * this.canvas.height;
        i0AvgErrPx = Math.hypot(dx, dy);
      }
    }
    return [
      "----- Intermediate PoC Debug -----",
      `count ${this.intermediatePocAnchorCount} | mapChanged ${st.lastMappingChanged ? "yes" : "no"} | tr ${st.active ? "active" : "idle"} ${st.elapsedSec.toFixed(3)}/${st.durationSec.toFixed(3)}s starts ${st.starts} restarts ${st.restarts}`,
      `map probes ${fmt(first)} | ${fmt(mid)} | ${fmt(last)}`,
      `I0 avg(A-start,B-start) err ${Number.isFinite(i0AvgErrPx) ? `${i0AvgErrPx.toFixed(3)}px` : "n/a"}`
    ];
  }

  buildIntermediateAnchorMapRows(aCount, bCount) {
    const aN = Math.max(0, aCount | 0);
    const bN = Math.max(0, bCount | 0);
    if (aN < 2 || bN < 2) {
      return {
        intermediateCount: 0,
        rows: [],
        notes: ["insufficient anchors"]
      };
    }

    const k = Math.max(2, Math.round((aN + bN) * 0.5));
    const rows = [];
    const notes = [];

    const pushRow = (i, a, b, mode) => {
      rows.push({ i, a, b, mode });
    };

    // PoC v0 center-compression rule used for current key setup (A16/B14),
    // and similarly for A17/B15 if present.
    if ((aN === 16 && bN === 14 && k === 15) || (aN === 17 && bN === 15 && k === 16)) {
      const left = 7;
      const rightStart = left + 3; // logical A11/B8 for 1-based mapping
      for (let i = 1; i <= left; i += 1) {
        pushRow(i, i, i, "direct");
      }
      pushRow(left + 1, left + 1, left + 1, "center-1");
      pushRow(left + 2, left + 3, left + 2, "center-2");
      for (let i = left + 3; i <= k; i += 1) {
        const d = i - (left + 3);
        pushRow(i, rightStart + d, left + 1 + d, "right");
      }
      notes.push(`A${left + 2} collapsed in center compression`);
      notes.push(`B${left + 1} reused across center transition`);
      return {
        intermediateCount: k,
        rows,
        notes
      };
    }

    // Generic fallback: stable proportional pairing (for visibility only).
    for (let i = 1; i <= k; i += 1) {
      const t = k > 1 ? (i - 1) / (k - 1) : 0;
      const a = 1 + Math.round(t * (aN - 1));
      const b = 1 + Math.round(t * (bN - 1));
      pushRow(i, clamp(a, 1, aN), clamp(b, 1, bN), "proportional");
    }
    notes.push("fallback proportional map (non-PoC case)");
    return {
      intermediateCount: k,
      rows,
      notes
    };
  }

  mapLogicalToPhysicalAnchorIndex(logicalOneBased, count, reverse) {
    const c = Math.max(0, count | 0);
    if (c <= 0) {
      return -1;
    }
    const li = Math.max(1, Math.min(c, logicalOneBased | 0));
    return reverse ? c - li : li - 1;
  }

  getIntermediateAnchorMapHudLines(aCount, bCount) {
    const map = this.buildIntermediateAnchorMapRows(aCount, bCount);
    const rows = map.rows || [];
    const reverseA = !!this.primaryBlendPocReverseA;
    const reverseB = !!this.primaryBlendPocReverseB;
    const lines = [
      "----- Intermediate Anchor Map (PoC) -----",
      `counts A ${aCount} B ${bCount} => I ${map.intermediateCount} | A reverse ${reverseA ? "yes" : "no"} B reverse ${reverseB ? "yes" : "no"}`
    ];
    if (!rows.length) {
      lines.push("no map rows");
      return lines;
    }
    for (const row of rows) {
      const ai = this.mapLogicalToPhysicalAnchorIndex(row.a, aCount, reverseA);
      const bi = this.mapLogicalToPhysicalAnchorIndex(row.b, bCount, reverseB);
      lines.push(`I${row.i - 1} <- A${ai} + B${bi} (${row.mode})`);
    }
    for (const note of map.notes || []) {
      lines.push(`note: ${note}`);
    }
    return lines;
  }

  extractCubicAnchorData(segments, maxAnchorCount = -1) {
    if (!Array.isArray(segments) || !segments.length) {
      return null;
    }
    const rawCount = segments.length + 1;
    const count = maxAnchorCount > 1 ? Math.min(rawCount, maxAnchorCount | 0) : rawCount;
    if (count < 2) {
      return null;
    }
    const anchors = new Array(count);
    const out = new Array(count);
    const inbound = new Array(count);
    for (let i = 0; i < count; i += 1) {
      anchors[i] = { x: 0, y: 0 };
      out[i] = { x: 0, y: 0 };
      inbound[i] = { x: 0, y: 0 };
    }
    anchors[0].x = segments[0].p0.x;
    anchors[0].y = segments[0].p0.y;
    const segCount = count - 1;
    for (let i = 0; i < segCount; i += 1) {
      const seg = segments[i];
      const end = seg.type === "C" ? seg.p3 : seg.p1;
      anchors[i + 1].x = end.x;
      anchors[i + 1].y = end.y;
      if (seg.type === "C") {
        out[i].x = seg.p1.x - seg.p0.x;
        out[i].y = seg.p1.y - seg.p0.y;
        inbound[i + 1].x = seg.p2.x - end.x;
        inbound[i + 1].y = seg.p2.y - end.y;
      } else {
        out[i].x = end.x - seg.p0.x;
        out[i].y = end.y - seg.p0.y;
      }
    }
    return { count, anchors, out, inbound };
  }

  ensureIntermediatePocSegmentBuffer(segmentCount) {
    const target = Math.max(0, segmentCount | 0);
    while (this.cubicIntermediatePoc.length < target) {
      this.cubicIntermediatePoc.push({
        type: "C",
        p0: { x: 0, y: 0 },
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 0 },
        p3: { x: 0, y: 0 }
      });
    }
    if (this.cubicIntermediatePoc.length > target) {
      this.cubicIntermediatePoc.length = target;
    }
  }

  writeCubicSegmentsToCurve(segments, outCurve) {
    if (!Array.isArray(segments) || !segments.length || !outCurve?.length) {
      return false;
    }
    const segCount = segments.length;
    outCurve[0] = segments[0].p0.x;
    outCurve[1] = segments[0].p0.y;
    let write = 1;
    let remaining = this.n - 1;
    for (let i = 0; i < segCount; i += 1) {
      const seg = segments[i];
      const segmentsLeft = segCount - i;
      const steps = Math.max(1, Math.floor(remaining / segmentsLeft));
      for (let j = 1; j <= steps && write < this.n; j += 1) {
        const p = this.cubicPoint(seg, j / steps);
        const k = write * 2;
        outCurve[k] = p.x;
        outCurve[k + 1] = p.y;
        write += 1;
      }
      remaining -= steps;
    }
    const tail = segments[segCount - 1].p3;
    while (write < this.n) {
      const k = write * 2;
      outCurve[k] = tail.x;
      outCurve[k + 1] = tail.y;
      write += 1;
    }
    return true;
  }

  buildIntermediatePocTargetFromMovedCubic() {
    const effectiveA = Math.max(0, (this.constraintAnchorA.length / 2) | 0);
    const effectiveB = Math.max(0, (this.constraintAnchorB.length / 2) | 0);
    if (
      effectiveA < 2 ||
      effectiveB < 2 ||
      this.constraintHandleOutA.length < effectiveA * 2 ||
      this.constraintHandleInA.length < effectiveA * 2 ||
      this.constraintHandleOutB.length < effectiveB * 2 ||
      this.constraintHandleInB.length < effectiveB * 2
    ) {
      return null;
    }
    const map = this.buildIntermediateAnchorMapRows(effectiveA, effectiveB);
    const rows = map.rows || [];
    if (rows.length < 2) {
      return null;
    }

    const vecLen = rows.length * 2;
    const anchors = new Float32Array(vecLen);
    const out = new Float32Array(vecLen);
    const inbound = new Float32Array(vecLen);
    const mapA = new Int32Array(rows.length);
    const mapB = new Int32Array(rows.length);
    const reverseA = !!this.primaryBlendPocReverseA;
    const reverseB = !!this.primaryBlendPocReverseB;
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const ai = this.mapLogicalToPhysicalAnchorIndex(row.a, effectiveA, reverseA);
      const bi = this.mapLogicalToPhysicalAnchorIndex(row.b, effectiveB, reverseB);
      mapA[i] = ai;
      mapB[i] = bi;
      const ak = ai * 2;
      const bk = bi * 2;
      const k = i * 2;
      anchors[k] = 0.5 * (this.constraintAnchorA[ak] + this.constraintAnchorB[bk]);
      anchors[k + 1] = 0.5 * (this.constraintAnchorA[ak + 1] + this.constraintAnchorB[bk + 1]);
      out[k] = 0.5 * (this.constraintHandleOutA[ak] + this.constraintHandleOutB[bk]);
      out[k + 1] = 0.5 * (this.constraintHandleOutA[ak + 1] + this.constraintHandleOutB[bk + 1]);
      inbound[k] = 0.5 * (this.constraintHandleInA[ak] + this.constraintHandleInB[bk]);
      inbound[k + 1] = 0.5 * (this.constraintHandleInA[ak + 1] + this.constraintHandleInB[bk + 1]);
    }

    return {
      count: rows.length,
      anchors,
      out,
      inbound,
      mapA,
      mapB
    };
  }

  buildIntermediatePocCurveFromMovedCubic(dtSeconds = 0) {
    const target = this.buildIntermediatePocTargetFromMovedCubic();
    if (!target) {
      this.intermediatePocAnchorCount = 0;
      this.constraintIntermediatePoc = new Float32Array(0);
      this.cubicIntermediatePoc.length = 0;
      this.resetIntermediatePocTransitionState();
      return false;
    }

    const state = this.intermediatePocTransition;
    this.ensureIntermediatePocTransitionCapacity(target.count);
    const count = state.count;
    const vecLen = count * 2;
    let mappingChanged = false;
    if (!state.primed) {
      mappingChanged = true;
    } else {
      for (let i = 0; i < count; i += 1) {
        if (target.mapA[i] !== state.prevMapA[i] || target.mapB[i] !== state.prevMapB[i]) {
          mappingChanged = true;
          break;
        }
      }
    }

    if (!state.primed) {
      state.targetAnchors.set(target.anchors);
      state.targetOut.set(target.out);
      state.targetIn.set(target.inbound);
      state.workAnchors.set(target.anchors);
      state.workOut.set(target.out);
      state.workIn.set(target.inbound);
      state.prevMapA.set(target.mapA);
      state.prevMapB.set(target.mapB);
      state.primed = true;
      state.active = false;
      state.lastMappingChanged = false;
    } else {
      if (mappingChanged) {
        if (state.active) {
          state.fromAnchors.set(state.workAnchors);
          state.fromOut.set(state.workOut);
          state.fromIn.set(state.workIn);
          state.restarts += 1;
        } else {
          state.fromAnchors.set(state.targetAnchors);
          state.fromOut.set(state.targetOut);
          state.fromIn.set(state.targetIn);
          state.starts += 1;
        }
        state.elapsedSec = 0;
        const nextSeconds = this.estimateIntermediatePocNextSnapSeconds();
        const fallback = Number.isFinite(state.durationSec) ? state.durationSec : 0.35;
        state.durationSec = clamp(
          Number.isFinite(nextSeconds) ? nextSeconds : fallback,
          this.intermediatePocMinDurationSec,
          this.intermediatePocMaxDurationSec
        );
        state.active = true;
      }

      state.targetAnchors.set(target.anchors);
      state.targetOut.set(target.out);
      state.targetIn.set(target.inbound);
      state.prevMapA.set(target.mapA);
      state.prevMapB.set(target.mapB);
      state.lastMappingChanged = mappingChanged;

      if (state.active) {
        state.elapsedSec += Math.max(0, Number(dtSeconds) || 0);
        const t = clamp(state.elapsedSec / Math.max(1e-6, state.durationSec), 0, 1);
        const w = this.easeBlendMapTransition(t);
        const inv = 1 - w;
        for (let i = 0; i < vecLen; i += 1) {
          state.workAnchors[i] = state.fromAnchors[i] * inv + state.targetAnchors[i] * w;
          state.workOut[i] = state.fromOut[i] * inv + state.targetOut[i] * w;
          state.workIn[i] = state.fromIn[i] * inv + state.targetIn[i] * w;
        }
        if (t >= 1 - 1e-6) {
          state.active = false;
          state.workAnchors.set(state.targetAnchors);
          state.workOut.set(state.targetOut);
          state.workIn.set(state.targetIn);
        }
      } else {
        state.workAnchors.set(state.targetAnchors);
        state.workOut.set(state.targetOut);
        state.workIn.set(state.targetIn);
      }
    }

    const segCount = count - 1;
    this.ensureIntermediatePocSegmentBuffer(segCount);
    for (let i = 0; i < segCount; i += 1) {
      const seg = this.cubicIntermediatePoc[i];
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      seg.type = "C";
      seg.p0.x = state.workAnchors[k0];
      seg.p0.y = state.workAnchors[k0 + 1];
      seg.p1.x = state.workAnchors[k0] + state.workOut[k0];
      seg.p1.y = state.workAnchors[k0 + 1] + state.workOut[k0 + 1];
      seg.p3.x = state.workAnchors[k1];
      seg.p3.y = state.workAnchors[k1 + 1];
      seg.p2.x = state.workAnchors[k1] + state.workIn[k1];
      seg.p2.y = state.workAnchors[k1 + 1] + state.workIn[k1 + 1];
    }

    this.intermediatePocAnchorCount = count;
    this.constraintIntermediatePoc = state.workAnchors.slice(0, vecLen);
    return this.writeCubicSegmentsToCurve(this.cubicIntermediatePoc, this.waveIntermediatePoc);
  }

  updateBlendModeButton() {
    if (!this.blendModeButton) {
      return;
    }
    this.blendModeButton.textContent = `Blend: ${this.getPrimaryBlendModeLabel()}`;
  }

  setPrimaryBlendMode(mode) {
    if (!PRIMARY_BLEND_MODES.includes(mode)) {
      return;
    }
    if (this.primaryBlendMode === mode) {
      this.updateBlendModeButton();
      return;
    }
    this.primaryBlendMode = mode;
    this.resetPrimaryBlendPhase();
    this.resetBlendMapTransitions();
    this.resetIntermediatePocTransitionState();
    this.resetBlendDebugStats();
    this.updateBlendModeButton();
    this.buildVertices();
    this.render();
    this.updateHud();
  }

  cyclePrimaryBlendMode(step = 1) {
    const modes = PRIMARY_BLEND_MODES;
    if (!modes.length) {
      return;
    }
    const current = modes.indexOf(this.primaryBlendMode);
    const base = current >= 0 ? current : 0;
    const next = ((base + step) % modes.length + modes.length) % modes.length;
    this.setPrimaryBlendMode(modes[next]);
  }

  resetBaselineAPivotTracking() {
    this.baselineAPivotIndex = -1;
    this.baselineAPivotStrength = 0;
    this.baselineAPivotEllipseDistance = Infinity;
    this.baselineAPivotCenterDistancePx = Infinity;
    this.baselineAPivotStableIndex = -1;
    this.baselineAPivotTransitionFromIndex = -1;
    this.baselineAPivotTransitionToIndex = -1;
    this.baselineAPivotTransitionT = 1;
    this.baselineAPivotSmoothedStrength = 0;
  }

  resetBaselineBPivotTracking() {
    this.baselineBPivotIndex = -1;
    this.baselineBPivotStrength = 0;
    this.baselineBPivotEllipseDistance = Infinity;
    this.baselineBPivotCenterDistancePx = Infinity;
    this.baselineBPivotStableIndex = -1;
    this.baselineBPivotTransitionFromIndex = -1;
    this.baselineBPivotTransitionToIndex = -1;
    this.baselineBPivotTransitionT = 1;
    this.baselineBPivotSmoothedStrength = 0;
  }

  setBaselineAMode(mode) {
    this.baselineAMode = mode === "arc" ? "arc" : "current";
    this.resetBaselineAPivotTracking();
    this.resetBaselineBPivotTracking();
    this.baselineALiveStateA = [];
    this.baselineBLiveStateB = [];
    this.updateBaselineAModeButton();
    this.resize();
    this.render();
    this.updateHud();
  }

  attach() {
    window.addEventListener("resize", this.onResize, { passive: true });
    document.addEventListener("keydown", this.onKeyDown, { capture: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerout", this.onPointerOut);
  }

  onPointerMove(event) {
    this.pointerActive = true;
    this.pointerXpx = event.clientX * (this.canvas.width / Math.max(1, window.innerWidth));
    this.pointerYpx = event.clientY * (this.canvas.height / Math.max(1, window.innerHeight));
  }

  onPointerOut(event) {
    if (!event.relatedTarget) {
      this.pointerActive = false;
    }
  }

  onResize() {
    this.isMobile = window.matchMedia("(max-width: 980px), (pointer: coarse)").matches;
    this.resize();
    this.render();
    this.updateHud();
  }

  getProfileSuffix() {
    return this.isMobile ? "Mobile" : "Desktop";
  }

  getShortcutTargetLayout() {
    return this.secondaryWaveSet === "key" ? this.secondaryLayout : this.layout;
  }

  getShortcutTargetSetName() {
    return this.secondaryWaveSet === "key" ? "key" : this.activeWaveSet;
  }

  nudgeGlobal(name, delta) {
    const key = `${name}${this.getProfileSuffix()}`;
    const layout = this.getShortcutTargetLayout();
    if (!Number.isFinite(layout[key])) {
      layout[key] = 0;
    }
    layout[key] += delta;
  }

  nudgeWave(waveKey, name, delta) {
    const key = `${name}${this.getProfileSuffix()}`;
    const layout = this.getShortcutTargetLayout();
    if (!Number.isFinite(layout[waveKey][key])) {
      layout[waveKey][key] = 0;
    }
    if (name === "scaleX" || name === "scaleY") {
      layout[waveKey][key] = Math.max(0.05, layout[waveKey][key] + delta);
      return;
    }
    layout[waveKey][key] += delta;
  }

  onKeyDown(event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const step = event.shiftKey ? CONFIG.align.fineStep : CONFIG.align.step;
    const rotateStep = event.shiftKey ? CONFIG.align.rotateFineStepDeg : CONFIG.align.rotateStepDeg;
    const anchorStep = event.shiftKey ? CONFIG.align.step : CONFIG.align.fineStep;
    const handleRotateRad = ((event.shiftKey ? 8 : 2) * Math.PI) / 180;
    let changed = false;

    switch (event.key) {
      case "ArrowLeft":
        if (this.baselineAMode === "arc" && event.shiftKey) {
          this.nudgeSelectedBaselineBAnchor(-anchorStep, 0);
          changed = true;
          break;
        }
        this.getShortcutTargetLayout().rightEdge -= step;
        changed = true;
        break;
      case "ArrowRight":
        if (this.baselineAMode === "arc" && event.shiftKey) {
          this.nudgeSelectedBaselineBAnchor(anchorStep, 0);
          changed = true;
          break;
        }
        this.getShortcutTargetLayout().rightEdge += step;
        changed = true;
        break;
      case "ArrowUp":
        if (this.baselineAMode === "arc" && event.shiftKey) {
          this.nudgeSelectedBaselineBAnchor(0, -anchorStep);
          changed = true;
          break;
        }
        this.nudgeGlobal("top", -step);
        changed = true;
        break;
      case "ArrowDown":
        if (this.baselineAMode === "arc" && event.shiftKey) {
          this.nudgeSelectedBaselineBAnchor(0, anchorStep);
          changed = true;
          break;
        }
        this.nudgeGlobal("top", step);
        changed = true;
        break;

      case "z":
      case "Z":
        this.nudgeGlobal("scaleX", -step);
        changed = true;
        break;
      case "x":
      case "X":
        this.nudgeGlobal("scaleX", step);
        changed = true;
        break;
      case "c":
      case "C":
        this.nudgeGlobal("scaleY", -step);
        changed = true;
        break;
      case "v":
      case "V":
        this.nudgeGlobal("scaleY", step);
        changed = true;
        break;

      case "a":
      case "A":
        this.nudgeWave("waveA", "xOffset", -step);
        changed = true;
        break;
      case "d":
      case "D":
        this.nudgeWave("waveA", "xOffset", step);
        changed = true;
        break;
      case "w":
      case "W":
        this.nudgeWave("waveA", "yOffset", -step);
        changed = true;
        break;
      case "s":
      case "S":
        this.nudgeWave("waveA", "yOffset", step);
        changed = true;
        break;
      case "q":
      case "Q":
        this.nudgeWave("waveA", "rotation", -rotateStep);
        changed = true;
        break;
      case "e":
      case "E":
        this.nudgeWave("waveA", "rotation", rotateStep);
        changed = true;
        break;

      case "j":
      case "J":
        this.nudgeWave("waveB", "xOffset", -step);
        changed = true;
        break;
      case "l":
      case "L":
        this.nudgeWave("waveB", "xOffset", step);
        changed = true;
        break;
      case "i":
      case "I":
        this.nudgeWave("waveB", "yOffset", -step);
        changed = true;
        break;
      case "k":
      case "K":
        this.nudgeWave("waveB", "yOffset", step);
        changed = true;
        break;
      case "3":
        this.nudgeWave("waveA", "scaleX", -step);
        changed = true;
        break;
      case "4":
        this.nudgeWave("waveA", "scaleX", step);
        changed = true;
        break;
      case "5":
        this.nudgeWave("waveA", "scaleY", -step);
        changed = true;
        break;
      case "6":
        this.nudgeWave("waveA", "scaleY", step);
        changed = true;
        break;
      case "7":
        this.nudgeWave("waveB", "scaleX", -step);
        changed = true;
        break;
      case "8":
        this.nudgeWave("waveB", "scaleX", step);
        changed = true;
        break;
      case "9":
        this.nudgeWave("waveB", "scaleY", -step);
        changed = true;
        break;
      case "0":
        this.nudgeWave("waveB", "scaleY", step);
        changed = true;
        break;
      case ";":
      case ":":
        this.nudgeWave("waveB", "rotation", -rotateStep);
        changed = true;
        break;
      case "'":
      case "\"":
        this.nudgeWave("waveB", "rotation", rotateStep);
        changed = true;
        break;

      case "[":
        this.overlayOpacity = clamp(this.overlayOpacity - 0.03, 0, 1);
        this.applyOverlayState();
        this.updateHud();
        event.preventDefault();
        return;
      case "]":
        this.overlayOpacity = clamp(this.overlayOpacity + 0.03, 0, 1);
        this.applyOverlayState();
        this.updateHud();
        event.preventDefault();
        return;
      case "o":
      case "O":
        this.overlayVisible = !this.overlayVisible;
        this.applyOverlayState();
        this.updateHud();
        event.preventDefault();
        return;
      case "h":
      case "H":
        this.hudVisible = !this.hudVisible;
        this.updateHud();
        event.preventDefault();
        return;
      case "p":
      case "P":
        this.setMotionPaused(!this.motionPaused);
        event.preventDefault();
        return;
      case "g":
      case "G":
        this.showHandles = !this.showHandles;
        this.buildVertices();
        this.render();
        this.updateHud();
        event.preventDefault();
        return;
      case "f":
      case "F":
        this.cyclePrimaryBlendMode(1);
        event.preventDefault();
        return;
      case "b":
      case "B":
        this.showBaselines = !this.showBaselines;
        this.buildVertices();
        this.render();
        this.updateHud();
        event.preventDefault();
        return;
      case "t":
      case "T":
        this.setMotionScrubMode(!this.motionScrubMode, true);
        event.preventDefault();
        return;
      case "u":
      case "U":
        this.showAnchorLabels = !this.showAnchorLabels;
        this.render();
        this.updateHud();
        event.preventDefault();
        return;
      case "1":
        return;
      case "2":
        this.setSystemEnabled("key", !this.systemEnabled.key);
        event.preventDefault();
        return;
      case "y":
      case "Y":
        this.showMarkers = !this.showMarkers;
        this.buildVertices();
        this.render();
        this.updateHud();
        event.preventDefault();
        return;
      case ",":
      case "<":
        if (this.motionScrubMode) {
          this.stepMotionScrub(-1, event.shiftKey ? 8 : 1);
          event.preventDefault();
          return;
        }
        if (this.baselineAMode === "arc") {
          this.selectBaselineBAnchor(-1);
          changed = true;
          break;
        }
        return;
      case ".":
      case ">":
        if (this.motionScrubMode) {
          this.stepMotionScrub(1, event.shiftKey ? 8 : 1);
          event.preventDefault();
          return;
        }
        if (this.baselineAMode === "arc") {
          this.selectBaselineBAnchor(1);
          changed = true;
          break;
        }
        return;
      case "n":
      case "N":
        if (this.baselineAMode === "arc") {
          this.rotateSelectedBaselineBHandle(-handleRotateRad);
          changed = true;
          break;
        }
        return;
      case "m":
      case "M":
        if (this.baselineAMode === "arc") {
          this.rotateSelectedBaselineBHandle(handleRotateRad);
          changed = true;
          break;
        }
        return;
      case "r":
      case "R":
        this.layout = deepClone(SET_LAYOUT_DEFAULTS[this.activeWaveSet] || DEFAULT_LAYOUT);
        this.secondaryLayout = deepClone(SET_LAYOUT_DEFAULTS[this.secondaryWaveSet] || DEFAULT_LAYOUT);
        this.baselineSmooth = CONFIG.stroke.baselineFinalPasses;
        if (this.baselineSmoothInput) {
          this.baselineSmoothInput.value = String(this.baselineSmooth);
        }
        if (this.baselineSmoothValue) {
          this.baselineSmoothValue.textContent = String(this.baselineSmooth);
        }
        this.baselineHandle = CONFIG.stroke.baselineHandleDefault;
        if (this.baselineHandleInput) {
          this.baselineHandleInput.value = this.baselineHandle.toFixed(2);
        }
        if (this.baselineHandleValue) {
          this.baselineHandleValue.textContent = this.baselineHandle.toFixed(2);
        }
        this.mouseInfluencePx = CONFIG.interaction.mouseInfluencePx;
        if (this.mouseInfluenceInput) {
          this.mouseInfluenceInput.value = String(Math.round(this.mouseInfluencePx));
        }
        if (this.mouseInfluenceValue) {
          this.mouseInfluenceValue.textContent = String(Math.round(this.mouseInfluencePx));
        }
        this.showHandles = false;
        this.showBaselines = false;
        this.showMarkers = false;
        this.showMapping = false;
        this.showAnchorLabels = false;
        this.systemEnabled.harmonic = false;
        this.systemEnabled.key = true;
        this.overlayVisible = CONFIG.align.overlayDefaultVisible;
        this.primaryBlendMode = BLEND_MODE_DIRECT_INDEX;
        this.resetPrimaryBlendPhase();
        this.resetBlendMapTransitions();
        this.resetBlendDebugStats();
        this.updateBlendModeButton();
        this.baselineAMode = "current";
        this.updateBaselineAModeButton();
        this.baselineAArcAnchors = [];
        this.baselineBArcAnchors = [];
        this.baselineASelectedAnchor = 0;
        this.baselineBSelectedAnchor = 0;
        this.baselineALiveStateA = [];
        this.baselineBLiveStateB = [];
        this.resetBaselineAPivotTracking();
        this.resetBaselineBPivotTracking();
        this.baselineAEllipseRadiusXPx = CONFIG.interaction.baselineAEllipseRadiusXPx;
        this.baselineAEllipseRadiusYPx = CONFIG.interaction.baselineAEllipseRadiusYPx;
        this.baselineAEllipseRotationDeg = CONFIG.interaction.baselineAEllipseRotationDeg;
        this.baselineACenterRadiusPx = CONFIG.interaction.baselineACenterRadiusPx;
        this.baselineAMinGradientBandPx = CONFIG.interaction.baselineAMinGradientBandPx;
        this.baselineAPivotSwitchMarginPx = CONFIG.interaction.baselineAPivotSwitchMarginPx;
        this.baselineAPivotStrengthLerp = CONFIG.interaction.baselineAPivotStrengthLerp;
        this.baselineAPivotTransitionLerp = CONFIG.interaction.baselineAPivotTransitionLerp;
        this.pixiZoomEnabled = !!CONFIG.zoomBlur.enabled;
        this.zoomBlurCenterXNorm = clamp(Number(CONFIG.zoomBlur.centerXNorm) || 0.68, 0, 1);
        this.zoomBlurCenterYNorm = clamp(Number(CONFIG.zoomBlur.centerYNorm) || 0.54, 0, 1);
        this.zoomBlurInnerRadiusPx = Math.max(0, Number(CONFIG.zoomBlur.innerRadiusPx) || 160);
        this.zoomBlurRadiusPx = Math.max(1, Number(CONFIG.zoomBlur.radiusPx) || 650);
        this.zoomBlurStrength = Math.max(0, Number(CONFIG.zoomBlur.strength) || 0.14);
        this.zoomBlurKernelSize = Math.max(
          3,
          Math.min(32, Math.round(Number(CONFIG.zoomBlur.kernelSize) || 11))
        );
        this.syncPixiBlurControlsFromState();
        if (this.baselineAEllipseRxInput) {
          this.baselineAEllipseRxInput.value = String(Math.round(this.baselineAEllipseRadiusXPx));
        }
        if (this.baselineAEllipseRxValue) {
          this.baselineAEllipseRxValue.textContent = String(Math.round(this.baselineAEllipseRadiusXPx));
        }
        if (this.baselineAEllipseRyInput) {
          this.baselineAEllipseRyInput.value = String(Math.round(this.baselineAEllipseRadiusYPx));
        }
        if (this.baselineAEllipseRyValue) {
          this.baselineAEllipseRyValue.textContent = String(Math.round(this.baselineAEllipseRadiusYPx));
        }
        if (this.keySystemToggle) {
          this.keySystemToggle.checked = true;
        }
        this.applyOverlayState();
        this.motionScrubMode = false;
        this.motionScrubStepSeconds = Math.max(
          1 / 240,
          Number(CONFIG.motion.scrubStepSeconds) || 1 / 120
        );
        this.motionPaused = false;
        this.updateMotionToggleButton();
        changed = true;
        break;
      default:
        return;
    }

    if (changed) {
      this.resize();
      this.render();
      this.updateHud();
      event.preventDefault();
    }
  }

  resize() {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2);
    const width = Math.max(1, Math.round(window.innerWidth * dpr));
    const height = Math.max(1, Math.round(window.innerHeight * dpr));

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    if (this.labelCanvas) {
      this.labelCanvas.width = width;
      this.labelCanvas.height = height;
      this.labelCanvas.style.width = "100%";
      this.labelCanvas.style.height = "100%";
    }
    if (this.pixiCanvas) {
      this.pixiCanvas.style.width = "100%";
      this.pixiCanvas.style.height = "100%";
    }

    gl.viewport(0, 0, width, height);
    this.resizePixiZoom(width, height);

    const suffix = this.getProfileSuffix();
    const scaleX = this.layout[`scaleX${suffix}`];
    const scaleY = this.layout[`scaleY${suffix}`];
    const top = this.layout[`top${suffix}`];
    const rightEdge = this.layout.rightEdge;

    const waveA = {
      xOffset: this.layout.waveA[`xOffset${suffix}`],
      yOffset: this.layout.waveA[`yOffset${suffix}`],
      scaleX: this.layout.waveA[`scaleX${suffix}`],
      scaleY: this.layout.waveA[`scaleY${suffix}`],
      rotation: this.layout.waveA[`rotation${suffix}`] ?? 0
    };

    const waveB = {
      xOffset: this.layout.waveB[`xOffset${suffix}`],
      yOffset: this.layout.waveB[`yOffset${suffix}`],
      scaleX: this.layout.waveB[`scaleX${suffix}`],
      scaleY: this.layout.waveB[`scaleY${suffix}`],
      rotation: this.layout.waveB[`rotation${suffix}`] ?? 0
    };

    const secondaryScaleX = this.secondaryLayout[`scaleX${suffix}`];
    const secondaryScaleY = this.secondaryLayout[`scaleY${suffix}`];
    const secondaryTop = this.secondaryLayout[`top${suffix}`];
    const secondaryRightEdge = this.secondaryLayout.rightEdge;
    const secondaryWaveA = {
      xOffset: this.secondaryLayout.waveA[`xOffset${suffix}`],
      yOffset: this.secondaryLayout.waveA[`yOffset${suffix}`],
      scaleX: this.secondaryLayout.waveA[`scaleX${suffix}`],
      scaleY: this.secondaryLayout.waveA[`scaleY${suffix}`],
      rotation: this.secondaryLayout.waveA[`rotation${suffix}`] ?? 0
    };
    const secondaryWaveB = {
      xOffset: this.secondaryLayout.waveB[`xOffset${suffix}`],
      yOffset: this.secondaryLayout.waveB[`yOffset${suffix}`],
      scaleX: this.secondaryLayout.waveB[`scaleX${suffix}`],
      scaleY: this.secondaryLayout.waveB[`scaleY${suffix}`],
      rotation: this.secondaryLayout.waveB[`rotation${suffix}`] ?? 0
    };

    this.assignWaveAdjustPivot(this.curveA, scaleX, scaleY, top, waveA, rightEdge);
    this.assignWaveAdjustPivot(this.curveB, scaleX, scaleY, top, waveB, rightEdge);
    this.assignWaveAdjustPivot(
      this.secondaryCurveA,
      secondaryScaleX,
      secondaryScaleY,
      secondaryTop,
      secondaryWaveA,
      secondaryRightEdge
    );
    this.assignWaveAdjustPivot(
      this.secondaryCurveB,
      secondaryScaleX,
      secondaryScaleY,
      secondaryTop,
      secondaryWaveB,
      secondaryRightEdge
    );

    this.transformToViewport(this.curveA, this.viewA, scaleX, scaleY, top, waveA, rightEdge);
    this.transformToViewport(this.curveB, this.viewB, scaleX, scaleY, top, waveB, rightEdge);
    this.transformToViewport(
      this.secondaryCurveA,
      this.viewSecondaryA,
      secondaryScaleX,
      secondaryScaleY,
      secondaryTop,
      secondaryWaveA,
      secondaryRightEdge
    );
    this.transformToViewport(
      this.secondaryCurveB,
      this.viewSecondaryB,
      secondaryScaleX,
      secondaryScaleY,
      secondaryTop,
      secondaryWaveB,
      secondaryRightEdge
    );
    const baselineA = this.buildBaselineFromCrests(
      this.viewA,
      this.baseA,
      this.baseScratchA,
      this.baseNormA,
      this.baseDispA,
      this.crestsA,
      this.troughsA
    );
    this.baselineAnchorCountA = baselineA.count;
    this.baselineAnchorPointsA = baselineA.points;
    this.baselineCurrentAnchorsA = baselineA.anchors || [];
    this.baselineCurrentStateA = this.createBaselineAArcStateFromAnchors(
      this.baselineCurrentAnchorsA,
      false
    );
    this.baselineALiveStateA = this.cloneBaselineAAnchorState(this.baselineCurrentStateA);
    if (this.baselineAMode === "arc") {
      this.ensureBaselineAArcState(this.baselineCurrentAnchorsA);
    } else {
      this.baselineAArcAnchors = this.createBaselineAArcStateFromAnchors(
        this.baselineCurrentAnchorsA,
        true
      );
      if (this.baselineAArcAnchors.length) {
        this.baselineASelectedAnchor = clamp(
          this.baselineASelectedAnchor,
          0,
          this.baselineAArcAnchors.length - 1
        ) | 0;
      } else {
        this.baselineASelectedAnchor = 0;
      }
    }

    const baselineB = this.buildBaselineFromCrests(
      this.viewB,
      this.baseB,
      this.baseScratchB,
      this.baseNormB,
      this.baseDispB,
      this.crestsB,
      this.troughsB
    );
    this.baselineAnchorCountB = baselineB.count;
    this.baselineAnchorPointsB = baselineB.points;
    this.baselineCurrentAnchorsB = baselineB.anchors || [];
    this.baselineCurrentStateB = this.createBaselineAArcStateFromAnchors(
      this.baselineCurrentAnchorsB,
      false
    );
    this.baselineBLiveStateB = this.cloneBaselineAAnchorState(this.baselineCurrentStateB);
    if (this.baselineAMode === "arc") {
      this.ensureBaselineBArcState(this.baselineCurrentAnchorsB);
    } else {
      this.baselineBArcAnchors = this.createBaselineBArcStateFromAnchors(
        this.baselineCurrentAnchorsB
      );
      if (this.baselineBArcAnchors.length) {
        this.baselineBSelectedAnchor = clamp(
          this.baselineBSelectedAnchor,
          0,
          this.baselineBArcAnchors.length - 1
        ) | 0;
      } else {
        this.baselineBSelectedAnchor = 0;
      }
    }

    const baselineSecondaryA = this.buildBaselineFromCrests(
      this.viewSecondaryA,
      this.baseSecondaryA,
      this.baseSecondaryScratchA,
      this.baseSecondaryNormA,
      this.baseSecondaryDispA,
      this.crestsSecondaryA,
      this.troughsSecondaryA
    );
    this.baselineAnchorCountSecondaryA = baselineSecondaryA.count;
    this.baselineAnchorPointsSecondaryA = baselineSecondaryA.points;

    const baselineSecondaryB = this.buildBaselineFromCrests(
      this.viewSecondaryB,
      this.baseSecondaryB,
      this.baseSecondaryScratchB,
      this.baseSecondaryNormB,
      this.baseSecondaryDispB,
      this.crestsSecondaryB,
      this.troughsSecondaryB
    );
    this.baselineAnchorCountSecondaryB = baselineSecondaryB.count;
    this.baselineAnchorPointsSecondaryB = baselineSecondaryB.points;

    const edgeA = this.collectCurveViewportIntersections(this.baseA);
    const edgeB = this.collectCurveViewportIntersections(this.baseB);
    this.baselineEdgeIntersectionPointsA = edgeA.points;
    this.baselineEdgeIntersectionPointsB = edgeB.points;
    this.baselineEdgeIntersectionLabelsA = edgeA.labels;
    this.baselineEdgeIntersectionLabelsB = edgeB.labels;
    this.baselineEdgeIntersectionDetailsA = edgeA.details;
    this.baselineEdgeIntersectionDetailsB = edgeB.details;

    this.baseRestA.set(this.baseA);
    this.baseRestB.set(this.baseB);
    this.baseSecondaryRestA.set(this.baseSecondaryA);
    this.baseSecondaryRestB.set(this.baseSecondaryB);

    this.rebuildTravelWaves();
    this.rebuildCubicWaveStates({
      active: {
        scaleX,
        scaleY,
        top,
        rightEdge,
        waveA: waveA,
        waveB: waveB
      },
      secondary: {
        scaleX: secondaryScaleX,
        scaleY: secondaryScaleY,
        top: secondaryTop,
        rightEdge: secondaryRightEdge,
        waveA: secondaryWaveA,
        waveB: secondaryWaveB
      }
    });
    this.rebuildTravelMarkers();
    this.buildVertices();
  }

  clearAnchorLabels() {
    if (!this.labelCtx || !this.labelCanvas) {
      return;
    }
    this.labelCtx.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
  }

  drawAnchorLabelSet(points, prefix, color, options = null) {
    if (!this.labelCtx || !this.labelCanvas || !points?.length) {
      return;
    }

    const count = (points.length / 2) | 0;
    if (count <= 0) {
      return;
    }

    const cw = this.labelCanvas.width;
    const ch = this.labelCanvas.height;
    const dpr = cw / Math.max(1, window.innerWidth);
    const dx = (Number.isFinite(options?.dx) ? options.dx : 8) * dpr;
    const dy = (Number.isFinite(options?.dy) ? options.dy : -8) * dpr;
    const pad = 16 * dpr;

    this.labelCtx.fillStyle = color;
    this.labelCtx.strokeStyle = options?.strokeStyle || "rgba(8, 6, 18, 0.92)";
    this.labelCtx.lineWidth = Math.max(2, 2 * dpr);
    this.labelCtx.textAlign = "center";
    this.labelCtx.textBaseline = "middle";
    this.labelCtx.font = `700 ${Math.max(11, 11 * dpr).toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;

    const skipLast = !!options?.skipLast;
    const shiftX = Number.isFinite(options?.shiftX) ? options.shiftX : 0;
    const shiftY = Number.isFinite(options?.shiftY) ? options.shiftY : 0;
    const labelSuffix = options?.labelSuffix ? String(options.labelSuffix) : "";
    const labels = Array.isArray(options?.labels) ? options.labels : null;

    for (let i = 0; i < count; i += 1) {
      if (skipLast && i === count - 1) {
        continue;
      }
      const k = i * 2;
      const x = (points[k] + shiftX) * cw;
      const y = (points[k + 1] + shiftY) * ch;
      if (x < -pad || x > cw + pad || y < -pad || y > ch + pad) {
        continue;
      }
      const label =
        labels && labels[i] != null
          ? String(labels[i])
          : `${prefix}${i}${labelSuffix}`;
      this.labelCtx.strokeText(label, x + dx, y + dy);
      this.labelCtx.fillText(label, x + dx, y + dy);
    }
  }

  drawBaselineAInfluenceEllipse() {
    if (!this.labelCtx || !this.labelCanvas) {
      return;
    }
    if (!this.pointerActive || this.baselineAMode !== "arc") {
      return;
    }

    const ctx = this.labelCtx;
    const cx = this.pointerXpx;
    const cy = this.pointerYpx;
    const rx = Math.max(1, this.baselineAEllipseRadiusXPx);
    const ry = Math.max(1, this.baselineAEllipseRadiusYPx);
    const centerRadius = Math.max(0, this.baselineACenterRadiusPx);
    const rot = (this.baselineAEllipseRotationDeg * Math.PI) / 180;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 210, 120, 0.10)";
    ctx.strokeStyle = "rgba(255, 210, 120, 0.78)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    if (centerRadius > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 120, 102, 0.15)";
      ctx.strokeStyle = "rgba(255, 120, 102, 0.88)";
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAnchorLabels() {
    if (!this.labelCtx || !this.labelCanvas) {
      return;
    }
    this.clearAnchorLabels();
    if (!this.showAnchorLabels) {
      return;
    }
    this.drawBaselineAInfluenceEllipse();

    if (this.systemEnabled[this.activeWaveSet]) {
      this.drawAnchorLabelSet(this.constraintAnchorA, "A", "rgba(255, 230, 240, 0.98)");
      this.drawAnchorLabelSet(this.constraintAnchorB, "B", "rgba(182, 255, 255, 0.98)");
      if (this.primaryBlendPocIntermediate && this.constraintIntermediatePoc.length) {
        this.drawAnchorLabelSet(
          this.constraintIntermediatePoc,
          "I",
          "rgba(255, 255, 210, 0.98)",
          { dx: 0, dy: 12 }
        );
      }
      if (this.showBaselines) {
        this.drawAnchorLabelSet(
          this.baselineAnchorPointsA,
          "BA",
          "rgba(0, 0, 0, 0.98)",
          { strokeStyle: "rgba(255, 255, 255, 0.94)" }
        );
        this.drawAnchorLabelSet(
          this.baselineAnchorPointsB,
          "BB",
          "rgba(0, 0, 0, 0.98)",
          { strokeStyle: "rgba(255, 255, 255, 0.94)" }
        );
        const edgeLabelsA = this.baselineEdgeIntersectionLabelsA.map(
          (edge, i) => `EA${i}-${edge}`
        );
        const edgeLabelsB = this.baselineEdgeIntersectionLabelsB.map(
          (edge, i) => `EB${i}-${edge}`
        );
        this.drawAnchorLabelSet(
          this.baselineEdgeIntersectionPointsA,
          "",
          "rgba(0, 0, 0, 0.98)",
          {
            strokeStyle: "rgba(255, 255, 255, 0.94)",
            labels: edgeLabelsA,
            dx: 10,
            dy: -10
          }
        );
        this.drawAnchorLabelSet(
          this.baselineEdgeIntersectionPointsB,
          "",
          "rgba(0, 0, 0, 0.98)",
          {
            strokeStyle: "rgba(255, 255, 255, 0.94)",
            labels: edgeLabelsB,
            dx: 10,
            dy: -10
          }
        );
      }
    }
    if (this.systemEnabled[this.secondaryWaveSet]) {
      this.drawAnchorLabelSet(
        this.constraintSecondaryAnchorA,
        "a",
        "rgba(255, 245, 96, 0.98)",
        { skipLast: this.mergeSecondaryAEndpoints }
      );
      this.drawAnchorLabelSet(
        this.constraintSecondaryAnchorB,
        "b",
        "rgba(108, 255, 216, 0.98)",
        { skipLast: this.mergeSecondaryBEndpoints }
      );
      if (this.enableSecondaryBReplicas && this.secondaryBReplicaShift?.valid) {
        const before = Math.max(0, this.secondaryBReplicaBeforeCount | 0);
        const after = Math.max(0, this.secondaryBReplicaAfterCount | 0);
        for (let i = 1; i <= before; i += 1) {
          this.drawAnchorLabelSet(
            this.constraintSecondaryAnchorB,
            "b",
            "rgba(108, 255, 216, 0.72)",
            {
              skipLast: this.mergeSecondaryBEndpoints,
              shiftX: this.secondaryBReplicaShift.dx * i,
              shiftY: this.secondaryBReplicaShift.dy * i,
              labelSuffix: "'".repeat(i)
            }
          );
        }
        for (let i = 1; i <= after; i += 1) {
          this.drawAnchorLabelSet(
            this.constraintSecondaryAnchorB,
            "b",
            "rgba(108, 255, 216, 0.72)",
            {
              skipLast: this.mergeSecondaryBEndpoints,
              shiftX: -this.secondaryBReplicaShift.dx * i,
              shiftY: -this.secondaryBReplicaShift.dy * i,
              labelSuffix: `+${i}`
            }
          );
        }
      }
    }
  }

  packBaselineAnchorPoints(anchors) {
    const count = Array.isArray(anchors) ? anchors.length : 0;
    if (!count) {
      return new Float32Array(0);
    }
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i += 1) {
      const k = i * 2;
      out[k] = anchors[i].x;
      out[k + 1] = anchors[i].y;
    }
    return out;
  }

  createBaselineAArcStateFromAnchors(anchors, applyOverrides = true) {
    if (!Array.isArray(anchors) || anchors.length < 2) {
      return [];
    }
    const state = new Array(anchors.length);
    for (let i = 0; i < anchors.length; i += 1) {
      const prev = anchors[Math.max(0, i - 1)];
      const next = anchors[Math.min(anchors.length - 1, i + 1)];
      const vx = next.x - prev.x;
      const vy = next.y - prev.y;
      const angle = Math.atan2(vy, vx);

      const chordPrev =
        i > 0 ? Math.hypot(anchors[i].x - prev.x, anchors[i].y - prev.y) : 0;
      const chordNext =
        i < anchors.length - 1
          ? Math.hypot(next.x - anchors[i].x, next.y - anchors[i].y)
          : 0;
      const baseChord =
        i === 0
          ? chordNext
          : i === anchors.length - 1
            ? chordPrev
            : 0.5 * (chordPrev + chordNext);
      const handleLen = Math.max(1e-4, baseChord * this.baselineHandle);

      state[i] = {
        s: Number(anchors[i].s),
        x: Number(anchors[i].x),
        y: Number(anchors[i].y),
        handleAngle: angle,
        handleLen
      };
    }

    if (applyOverrides) {
      for (const [indexText, override] of Object.entries(BASELINE_A_ARC_OVERRIDES)) {
        const index = Number(indexText);
        if (!Number.isFinite(index) || index < 0 || index >= state.length) {
          continue;
        }
        const target = state[index];
        if (Number.isFinite(override?.x)) {
          target.x = Number(override.x);
        }
        if (Number.isFinite(override?.y)) {
          target.y = Number(override.y);
        }
        if (Number.isFinite(override?.handleDeg)) {
          target.handleAngle = (Number(override.handleDeg) * Math.PI) / 180;
        }
      }
    }

    return state;
  }

  createBaselineBArcStateFromAnchors(anchors) {
    const state = this.createBaselineAArcStateFromAnchors(anchors, false);
    for (const [indexText, override] of Object.entries(BASELINE_B_ARC_OVERRIDES)) {
      const index = Number(indexText);
      if (!Number.isFinite(index) || index < 0 || index >= state.length) {
        continue;
      }
      const target = state[index];
      if (Number.isFinite(override?.x)) {
        target.x = Number(override.x);
      }
      if (Number.isFinite(override?.y)) {
        target.y = Number(override.y);
      }
      if (Number.isFinite(override?.handleDeg)) {
        target.handleAngle = (Number(override.handleDeg) * Math.PI) / 180;
      }
    }
    return state;
  }

  cloneBaselineAAnchorState(source) {
    if (!Array.isArray(source) || !source.length) {
      return [];
    }
    return source.map((anchor) => ({
      s: Number(anchor.s),
      x: Number(anchor.x),
      y: Number(anchor.y),
      handleAngle: Number(anchor.handleAngle),
      handleLen: Number(anchor.handleLen)
    }));
  }

  ensureBaselineAArcState(seedAnchors) {
    const nextCount = Array.isArray(seedAnchors) ? seedAnchors.length : 0;
    if (nextCount < 2) {
      this.baselineAArcAnchors = [];
      this.baselineASelectedAnchor = 0;
      return;
    }
    if (!this.baselineAArcAnchors.length || this.baselineAArcAnchors.length !== nextCount) {
      this.baselineAArcAnchors = this.createBaselineAArcStateFromAnchors(seedAnchors);
      this.baselineASelectedAnchor = clamp(this.baselineASelectedAnchor, 0, nextCount - 1) | 0;
    }
  }

  ensureBaselineBArcState(seedAnchors) {
    const nextCount = Array.isArray(seedAnchors) ? seedAnchors.length : 0;
    if (nextCount < 2) {
      this.baselineBArcAnchors = [];
      this.baselineBSelectedAnchor = 0;
      return;
    }
    if (!this.baselineBArcAnchors.length || this.baselineBArcAnchors.length !== nextCount) {
      this.baselineBArcAnchors = this.createBaselineBArcStateFromAnchors(seedAnchors);
      this.baselineBSelectedAnchor = clamp(this.baselineBSelectedAnchor, 0, nextCount - 1) | 0;
    }
  }

  getSelectedBaselineAAnchor() {
    const count = this.baselineAArcAnchors.length;
    if (!count) {
      return null;
    }
    this.baselineASelectedAnchor = clamp(this.baselineASelectedAnchor, 0, count - 1) | 0;
    return this.baselineAArcAnchors[this.baselineASelectedAnchor];
  }

  selectBaselineAAnchor(delta) {
    const count = this.baselineAArcAnchors.length;
    if (!count) {
      return;
    }
    const next = (this.baselineASelectedAnchor + delta + count) % count;
    this.baselineASelectedAnchor = next;
  }

  nudgeSelectedBaselineAAnchor(dx, dy) {
    const selected = this.getSelectedBaselineAAnchor();
    if (!selected) {
      return;
    }
    selected.x += dx;
    selected.y += dy;
  }

  rotateSelectedBaselineAHandle(deltaRad) {
    const selected = this.getSelectedBaselineAAnchor();
    if (!selected) {
      return;
    }
    selected.handleAngle += deltaRad;
  }

  getSelectedBaselineBAnchor() {
    const count = this.baselineBArcAnchors.length;
    if (!count) {
      return null;
    }
    this.baselineBSelectedAnchor = clamp(this.baselineBSelectedAnchor, 0, count - 1) | 0;
    return this.baselineBArcAnchors[this.baselineBSelectedAnchor];
  }

  selectBaselineBAnchor(delta) {
    const count = this.baselineBArcAnchors.length;
    if (!count) {
      return;
    }
    const next = (this.baselineBSelectedAnchor + delta + count) % count;
    this.baselineBSelectedAnchor = next;
  }

  nudgeSelectedBaselineBAnchor(dx, dy) {
    const selected = this.getSelectedBaselineBAnchor();
    if (!selected) {
      return;
    }
    selected.x += dx;
    selected.y += dy;
  }

  rotateSelectedBaselineBHandle(deltaRad) {
    const selected = this.getSelectedBaselineBAnchor();
    if (!selected) {
      return;
    }
    selected.handleAngle += deltaRad;
  }

  applyBaselineAArcStateToCurve(target, scratch, normals, anchorState = this.baselineAArcAnchors) {
    const anchors = anchorState;
    if (!Array.isArray(anchors) || anchors.length < 2) {
      return;
    }

    let seg = 0;
    for (let i = 0; i < this.n; i += 1) {
      while (seg < anchors.length - 2 && i > anchors[seg + 1].s) {
        seg += 1;
      }

      const a0 = anchors[seg];
      const a1 = anchors[Math.min(seg + 1, anchors.length - 1)];
      const ds = Math.max(1e-6, a1.s - a0.s);
      const t = clamp((i - a0.s) / ds, 0, 1);
      const tt = t * t;
      const ttt = tt * t;
      const h00 = 2 * ttt - 3 * tt + 1;
      const h10 = ttt - 2 * tt + t;
      const h01 = -2 * ttt + 3 * tt;
      const h11 = ttt - tt;

      const m0x = Math.cos(a0.handleAngle) * a0.handleLen;
      const m0y = Math.sin(a0.handleAngle) * a0.handleLen;
      const m1x = Math.cos(a1.handleAngle) * a1.handleLen;
      const m1y = Math.sin(a1.handleAngle) * a1.handleLen;

      const k = i * 2;
      scratch[k] = h00 * a0.x + h10 * m0x + h01 * a1.x + h11 * m1x;
      scratch[k + 1] = h00 * a0.y + h10 * m0y + h01 * a1.y + h11 * m1y;
    }

    target.set(scratch);
    this.computeNormals(target, normals);
  }

  shortestAngleDelta(from, to) {
    let delta = to - from;
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2;
    }
    return delta;
  }

  computeBaselineAInfluenceForPoint(point) {
    if (!point) {
      return {
        strength: 0,
        ellipseDistance: Infinity,
        gradientDistance: 1,
        centerDistancePx: Infinity
      };
    }

    const rx = Math.max(1e-6, this.baselineAEllipseRadiusXPx);
    const ry = Math.max(1e-6, this.baselineAEllipseRadiusYPx);
    const centerRadius = Math.max(0, this.baselineACenterRadiusPx);
    const minBand = Math.max(1, this.baselineAMinGradientBandPx);
    const theta = (this.baselineAEllipseRotationDeg * Math.PI) / 180;
    const cos = Math.cos(-theta);
    const sin = Math.sin(-theta);
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const dx = point.x * cw - this.pointerXpx;
    const dy = point.y * ch - this.pointerYpx;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const nx = lx / rx;
    const ny = ly / ry;
    const ellipseDistance = Math.hypot(nx, ny);
    const centerDistancePx = Math.hypot(dx, dy);

    if (centerDistancePx <= centerRadius) {
      return {
        strength: 1,
        ellipseDistance,
        gradientDistance: 0,
        centerDistancePx
      };
    }

    if (!Number.isFinite(ellipseDistance) || ellipseDistance <= 1e-8) {
      return {
        strength: 1,
        ellipseDistance: 0,
        gradientDistance: 0,
        centerDistancePx
      };
    }

    const edgeDistancePx = centerDistancePx / ellipseDistance;
    if (!Number.isFinite(edgeDistancePx)) {
      return {
        strength: 0,
        ellipseDistance,
        gradientDistance: 1,
        centerDistancePx
      };
    }

    const effectiveEdgeDistancePx = Math.max(edgeDistancePx, centerRadius + minBand);
    if (effectiveEdgeDistancePx <= centerRadius + 1e-8) {
      const full = centerDistancePx < edgeDistancePx;
      return {
        strength: full ? 1 : 0,
        ellipseDistance,
        gradientDistance: full ? 0 : 1,
        centerDistancePx
      };
    }

    if (centerDistancePx >= effectiveEdgeDistancePx) {
      return {
        strength: 0,
        ellipseDistance,
        gradientDistance: 1,
        centerDistancePx
      };
    }

    const t = clamp(
      (centerDistancePx - centerRadius) / Math.max(1e-6, effectiveEdgeDistancePx - centerRadius),
      0,
      1
    );
    return {
      strength: this.computeBaselineADirectStrengthAtDistance(t),
      ellipseDistance,
      gradientDistance: t,
      centerDistancePx
    };
  }

  computeBaselineADirectStrengthAtDistance(normDist) {
    if (!Number.isFinite(normDist) || normDist >= 1) {
      return 0;
    }
    const k = Math.max(0.01, this.baselineAExpK);
    const r = 1 - clamp(normDist, 0, 1);
    return (Math.exp(k * r) - 1) / (Math.exp(k) - 1);
  }

  computeBaselineANeighborPercent(step) {
    const maxSteps = Math.max(1, this.baselineAInductionMaxAnchors | 0);
    if (step <= 0) {
      return 100;
    }
    if (step > maxSteps) {
      return 0;
    }
    const x = maxSteps - step + 1;
    const y = 100.23538 / (1 + Math.exp(-(1.2286 * x - 4.5265))) - 1;
    return clamp(Math.round(y), 0, 100);
  }

  findClosestBaselineAAnchorCandidate(anchorState) {
    if (!this.pointerActive || !Array.isArray(anchorState) || !anchorState.length) {
      return { index: -1, distancePx: Infinity };
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let best = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < anchorState.length; i += 1) {
      const ax = anchorState[i].x * cw;
      const ay = anchorState[i].y * ch;
      const dx = ax - this.pointerXpx;
      const dy = ay - this.pointerYpx;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return { index: best, distancePx: Math.sqrt(bestD2) };
  }

  getBaselineAAnchorDistanceToPointerPx(anchorState, index) {
    if (
      !this.pointerActive ||
      !Array.isArray(anchorState) ||
      !anchorState.length ||
      !Number.isFinite(index) ||
      index < 0 ||
      index >= anchorState.length
    ) {
      return Infinity;
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ax = anchorState[index].x * cw;
    const ay = anchorState[index].y * ch;
    return Math.hypot(ax - this.pointerXpx, ay - this.pointerYpx);
  }

  resolveBaselineAPivotIndex(anchorState, candidate) {
    const count = Array.isArray(anchorState) ? anchorState.length : 0;
    if (!count) {
      this.baselineAPivotStableIndex = -1;
      return -1;
    }

    if (
      !Number.isFinite(this.baselineAPivotStableIndex) ||
      this.baselineAPivotStableIndex < 0 ||
      this.baselineAPivotStableIndex >= count
    ) {
      this.baselineAPivotStableIndex = -1;
    }

    const candIdx = Number.isFinite(candidate?.index) ? candidate.index : -1;
    const candDist = Number.isFinite(candidate?.distancePx) ? candidate.distancePx : Infinity;
    if (candIdx < 0 || candIdx >= count) {
      return this.baselineAPivotStableIndex;
    }

    if (this.baselineAPivotStableIndex < 0) {
      this.baselineAPivotStableIndex = candIdx;
      this.baselineAPivotTransitionFromIndex = -1;
      this.baselineAPivotTransitionToIndex = candIdx;
      this.baselineAPivotTransitionT = 1;
      return candIdx;
    }

    if (candIdx === this.baselineAPivotStableIndex) {
      return candIdx;
    }

    const currentDist = this.getBaselineAAnchorDistanceToPointerPx(
      anchorState,
      this.baselineAPivotStableIndex
    );
    const margin = Math.max(0, this.baselineAPivotSwitchMarginPx);
    if (candDist + margin < currentDist) {
      this.baselineAPivotTransitionFromIndex = this.baselineAPivotStableIndex;
      this.baselineAPivotTransitionToIndex = candIdx;
      this.baselineAPivotTransitionT = 0;
      this.baselineAPivotStableIndex = candIdx;
    }

    return this.baselineAPivotStableIndex;
  }

  advanceBaselineAPivotTransition() {
    if (this.baselineAPivotTransitionT >= 1) {
      this.baselineAPivotTransitionT = 1;
      this.baselineAPivotTransitionFromIndex = -1;
      return;
    }
    const rate = clamp(this.baselineAPivotTransitionLerp, 0.001, 1);
    this.baselineAPivotTransitionT = clamp(this.baselineAPivotTransitionT + rate, 0, 1);
    if (this.baselineAPivotTransitionT >= 1) {
      this.baselineAPivotTransitionFromIndex = -1;
    }
  }

  updateBaselineAPivotStrength(targetStrength) {
    const alpha = clamp(this.baselineAPivotStrengthLerp, 0.001, 1);
    this.baselineAPivotSmoothedStrength = lerp(
      this.baselineAPivotSmoothedStrength,
      clamp(targetStrength, 0, 1),
      alpha
    );
    if (Math.abs(this.baselineAPivotSmoothedStrength) < 1e-6) {
      this.baselineAPivotSmoothedStrength = 0;
    }
    return this.baselineAPivotSmoothedStrength;
  }

  computeBaselineAPivotWeights(count, pivotIndex, pivotStrength, maxSteps) {
    const weights = new Float32Array(Math.max(0, count | 0));
    if (
      !Number.isFinite(pivotIndex) ||
      pivotIndex < 0 ||
      pivotIndex >= weights.length ||
      pivotStrength <= 0
    ) {
      return weights;
    }

    for (let i = 0; i < weights.length; i += 1) {
      const steps = Math.abs(i - pivotIndex);
      let w = 0;
      if (steps === 0) {
        w = pivotStrength;
      } else if (steps <= maxSteps) {
        const pct = this.computeBaselineANeighborPercent(steps);
        w = pivotStrength * (pct / 100);
      }
      weights[i] = clamp(w, 0, 1);
    }
    return weights;
  }

  buildBaselineABlendedAnchorState(probeState = this.baselineCurrentStateA) {
    if (!Array.isArray(this.baselineCurrentStateA) || this.baselineCurrentStateA.length < 2) {
      return null;
    }
    if (!Array.isArray(this.baselineAArcAnchors) || this.baselineAArcAnchors.length < 2) {
      return null;
    }
    if (!Array.isArray(probeState) || probeState.length < 2) {
      return null;
    }

    const count = Math.min(
      this.baselineCurrentStateA.length,
      this.baselineAArcAnchors.length,
      probeState.length
    );

    const candidate = this.findClosestBaselineAAnchorCandidate(probeState);
    const pivotIndex = this.resolveBaselineAPivotIndex(probeState, candidate);
    if (pivotIndex < 0 || pivotIndex >= count) {
      return null;
    }

    const pivotPoint = probeState[pivotIndex];
    const pivotInfluence = this.pointerActive
      ? this.computeBaselineAInfluenceForPoint(pivotPoint)
      : {
          strength: 0,
          ellipseDistance: Infinity,
          gradientDistance: 1,
          centerDistancePx: Infinity
        };
    const pivotStrength = this.updateBaselineAPivotStrength(pivotInfluence.strength);
    const maxSteps = Math.max(0, this.baselineAInductionMaxAnchors | 0);
    const targetWeights = this.computeBaselineAPivotWeights(
      count,
      pivotIndex,
      pivotStrength,
      maxSteps
    );
    let weights = targetWeights;
    const fromIndex = this.baselineAPivotTransitionFromIndex;
    const toIndex = this.baselineAPivotTransitionToIndex;
    if (
      Number.isFinite(fromIndex) &&
      fromIndex >= 0 &&
      fromIndex < count &&
      Number.isFinite(toIndex) &&
      toIndex >= 0 &&
      toIndex < count &&
      fromIndex !== toIndex &&
      this.baselineAPivotTransitionT < 1
    ) {
      const fromWeights = this.computeBaselineAPivotWeights(
        count,
        fromIndex,
        pivotStrength,
        maxSteps
      );
      const t = clamp(this.baselineAPivotTransitionT, 0, 1);
      const mixed = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        mixed[i] = lerp(fromWeights[i], targetWeights[i], t);
      }
      weights = mixed;
      this.advanceBaselineAPivotTransition();
    } else {
      this.baselineAPivotTransitionT = 1;
      this.baselineAPivotTransitionFromIndex = -1;
    }

    const blended = new Array(count);
    for (let i = 0; i < count; i += 1) {
      const src = this.baselineCurrentStateA[i];
      const dst = this.baselineAArcAnchors[i];
      const w = clamp(weights[i], 0, 1);

      blended[i] = {
        s: src.s,
        x: lerp(src.x, dst.x, w),
        y: lerp(src.y, dst.y, w),
        handleAngle: src.handleAngle + this.shortestAngleDelta(src.handleAngle, dst.handleAngle) * w,
        handleLen: lerp(src.handleLen, dst.handleLen, w)
      };
    }

    return {
      anchors: blended,
      pivotIndex,
      pivotStrength,
      pivotEllipseDistance: pivotInfluence.ellipseDistance,
      pivotCenterDistancePx: pivotInfluence.centerDistancePx
    };
  }

  findClosestBaselineBAnchorCandidate(anchorState) {
    if (!this.pointerActive || !Array.isArray(anchorState) || !anchorState.length) {
      return { index: -1, distancePx: Infinity };
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let best = 0;
    let bestD2 = Infinity;
    for (let i = 0; i < anchorState.length; i += 1) {
      const ax = anchorState[i].x * cw;
      const ay = anchorState[i].y * ch;
      const dx = ax - this.pointerXpx;
      const dy = ay - this.pointerYpx;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }
    return { index: best, distancePx: Math.sqrt(bestD2) };
  }

  getBaselineBAnchorDistanceToPointerPx(anchorState, index) {
    if (
      !this.pointerActive ||
      !Array.isArray(anchorState) ||
      !anchorState.length ||
      !Number.isFinite(index) ||
      index < 0 ||
      index >= anchorState.length
    ) {
      return Infinity;
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ax = anchorState[index].x * cw;
    const ay = anchorState[index].y * ch;
    return Math.hypot(ax - this.pointerXpx, ay - this.pointerYpx);
  }

  resolveBaselineBPivotIndex(anchorState, candidate) {
    const count = Array.isArray(anchorState) ? anchorState.length : 0;
    if (!count) {
      this.baselineBPivotStableIndex = -1;
      return -1;
    }

    if (
      !Number.isFinite(this.baselineBPivotStableIndex) ||
      this.baselineBPivotStableIndex < 0 ||
      this.baselineBPivotStableIndex >= count
    ) {
      this.baselineBPivotStableIndex = -1;
    }

    const candIdx = Number.isFinite(candidate?.index) ? candidate.index : -1;
    const candDist = Number.isFinite(candidate?.distancePx) ? candidate.distancePx : Infinity;
    if (candIdx < 0 || candIdx >= count) {
      return this.baselineBPivotStableIndex;
    }

    if (this.baselineBPivotStableIndex < 0) {
      this.baselineBPivotStableIndex = candIdx;
      this.baselineBPivotTransitionFromIndex = -1;
      this.baselineBPivotTransitionToIndex = candIdx;
      this.baselineBPivotTransitionT = 1;
      return candIdx;
    }

    if (candIdx === this.baselineBPivotStableIndex) {
      return candIdx;
    }

    const currentDist = this.getBaselineBAnchorDistanceToPointerPx(
      anchorState,
      this.baselineBPivotStableIndex
    );
    const margin = Math.max(0, this.baselineAPivotSwitchMarginPx);
    if (candDist + margin < currentDist) {
      this.baselineBPivotTransitionFromIndex = this.baselineBPivotStableIndex;
      this.baselineBPivotTransitionToIndex = candIdx;
      this.baselineBPivotTransitionT = 0;
      this.baselineBPivotStableIndex = candIdx;
    }

    return this.baselineBPivotStableIndex;
  }

  advanceBaselineBPivotTransition() {
    if (this.baselineBPivotTransitionT >= 1) {
      this.baselineBPivotTransitionT = 1;
      this.baselineBPivotTransitionFromIndex = -1;
      return;
    }
    const rate = clamp(this.baselineAPivotTransitionLerp, 0.001, 1);
    this.baselineBPivotTransitionT = clamp(this.baselineBPivotTransitionT + rate, 0, 1);
    if (this.baselineBPivotTransitionT >= 1) {
      this.baselineBPivotTransitionFromIndex = -1;
    }
  }

  updateBaselineBPivotStrength(targetStrength) {
    const alpha = clamp(this.baselineAPivotStrengthLerp, 0.001, 1);
    this.baselineBPivotSmoothedStrength = lerp(
      this.baselineBPivotSmoothedStrength,
      clamp(targetStrength, 0, 1),
      alpha
    );
    if (Math.abs(this.baselineBPivotSmoothedStrength) < 1e-6) {
      this.baselineBPivotSmoothedStrength = 0;
    }
    return this.baselineBPivotSmoothedStrength;
  }

  buildBaselineBBlendedAnchorState(probeState = this.baselineCurrentStateB) {
    if (!Array.isArray(this.baselineCurrentStateB) || this.baselineCurrentStateB.length < 2) {
      return null;
    }
    if (!Array.isArray(this.baselineBArcAnchors) || this.baselineBArcAnchors.length < 2) {
      return null;
    }
    if (!Array.isArray(probeState) || probeState.length < 2) {
      return null;
    }

    const count = Math.min(
      this.baselineCurrentStateB.length,
      this.baselineBArcAnchors.length,
      probeState.length
    );

    const candidate = this.findClosestBaselineBAnchorCandidate(probeState);
    const pivotIndex = this.resolveBaselineBPivotIndex(probeState, candidate);
    if (pivotIndex < 0 || pivotIndex >= count) {
      return null;
    }

    const pivotPoint = probeState[pivotIndex];
    const pivotInfluence = this.pointerActive
      ? this.computeBaselineAInfluenceForPoint(pivotPoint)
      : {
          strength: 0,
          ellipseDistance: Infinity,
          gradientDistance: 1,
          centerDistancePx: Infinity
        };
    const pivotStrength = this.updateBaselineBPivotStrength(pivotInfluence.strength);
    const maxSteps = Math.max(0, this.baselineAInductionMaxAnchors | 0);
    const targetWeights = this.computeBaselineAPivotWeights(
      count,
      pivotIndex,
      pivotStrength,
      maxSteps
    );
    let weights = targetWeights;
    const fromIndex = this.baselineBPivotTransitionFromIndex;
    const toIndex = this.baselineBPivotTransitionToIndex;
    if (
      Number.isFinite(fromIndex) &&
      fromIndex >= 0 &&
      fromIndex < count &&
      Number.isFinite(toIndex) &&
      toIndex >= 0 &&
      toIndex < count &&
      fromIndex !== toIndex &&
      this.baselineBPivotTransitionT < 1
    ) {
      const fromWeights = this.computeBaselineAPivotWeights(
        count,
        fromIndex,
        pivotStrength,
        maxSteps
      );
      const t = clamp(this.baselineBPivotTransitionT, 0, 1);
      const mixed = new Float32Array(count);
      for (let i = 0; i < count; i += 1) {
        mixed[i] = lerp(fromWeights[i], targetWeights[i], t);
      }
      weights = mixed;
      this.advanceBaselineBPivotTransition();
    } else {
      this.baselineBPivotTransitionT = 1;
      this.baselineBPivotTransitionFromIndex = -1;
    }

    const blended = new Array(count);
    for (let i = 0; i < count; i += 1) {
      const src = this.baselineCurrentStateB[i];
      const dst = this.baselineBArcAnchors[i];
      const w = clamp(weights[i], 0, 1);

      blended[i] = {
        s: src.s,
        x: lerp(src.x, dst.x, w),
        y: lerp(src.y, dst.y, w),
        handleAngle: src.handleAngle + this.shortestAngleDelta(src.handleAngle, dst.handleAngle) * w,
        handleLen: lerp(src.handleLen, dst.handleLen, w)
      };
    }

    return {
      anchors: blended,
      pivotIndex,
      pivotStrength,
      pivotEllipseDistance: pivotInfluence.ellipseDistance,
      pivotCenterDistancePx: pivotInfluence.centerDistancePx
    };
  }

  applyBaselineAInteractiveMorph() {
    if (this.baselineCurrentStateA.length < 2) {
      return;
    }

    this.baseA.set(this.baseRestA);
    this.baselineAnchorCountA = this.baselineCurrentStateA.length;
    this.baselineAnchorPointsA = this.packBaselineAnchorPoints(this.baselineCurrentStateA);
    this.baselineAPivotIndex = -1;
    this.baselineAPivotStrength = 0;
    this.baselineAPivotEllipseDistance = Infinity;
    this.baselineAPivotCenterDistancePx = Infinity;

    if (this.baselineAMode === "arc") {
      const probeState =
        Array.isArray(this.baselineALiveStateA) &&
        this.baselineALiveStateA.length === this.baselineCurrentStateA.length
          ? this.baselineALiveStateA
          : this.baselineCurrentStateA;
      const blend = this.buildBaselineABlendedAnchorState(probeState);
      if (blend?.anchors?.length >= 2) {
        this.applyBaselineAArcStateToCurve(
          this.baseA,
          this.baseScratchA,
          this.baseNormA,
          blend.anchors
        );
        this.baselineAnchorCountA = blend.anchors.length;
        this.baselineAnchorPointsA = this.packBaselineAnchorPoints(blend.anchors);
        this.baselineAPivotIndex = blend.pivotIndex;
        this.baselineAPivotStrength = blend.pivotStrength;
        this.baselineAPivotEllipseDistance = blend.pivotEllipseDistance;
        this.baselineAPivotCenterDistancePx = blend.pivotCenterDistancePx;
        this.baselineALiveStateA = this.cloneBaselineAAnchorState(blend.anchors);
      } else {
        this.computeNormals(this.baseA, this.baseNormA);
        this.baselineALiveStateA = this.cloneBaselineAAnchorState(this.baselineCurrentStateA);
      }
    } else {
      this.computeNormals(this.baseA, this.baseNormA);
      this.baselineALiveStateA = this.cloneBaselineAAnchorState(this.baselineCurrentStateA);
    }

    this.baseArcLenA = this.computeArcTable(this.baseA, this.baseArcA);
    this.travelArcA = this.wrapArc(this.travelArcA, this.baseArcLenA);
    this.computeSignedDisplacement(this.viewA, this.baseA, this.baseNormA, this.waveDispA);
    this.waveArcU0A.set(this.baseArcA);

    const edgeA = this.collectCurveViewportIntersections(this.baseA);
    this.baselineEdgeIntersectionPointsA = edgeA.points;
    this.baselineEdgeIntersectionLabelsA = edgeA.labels;
    this.baselineEdgeIntersectionDetailsA = edgeA.details;
  }

  applyBaselineBArcEditState() {
    if (!Array.isArray(this.baselineCurrentStateB) || this.baselineCurrentStateB.length < 2) {
      return;
    }

    this.baseB.set(this.baseRestB);
    this.baselineAnchorCountB = this.baselineCurrentStateB.length;
    this.baselineAnchorPointsB = this.packBaselineAnchorPoints(this.baselineCurrentStateB);
    this.baselineBPivotIndex = -1;
    this.baselineBPivotStrength = 0;
    this.baselineBPivotEllipseDistance = Infinity;
    this.baselineBPivotCenterDistancePx = Infinity;

    if (this.baselineAMode === "arc") {
      const probeState =
        Array.isArray(this.baselineBLiveStateB) &&
        this.baselineBLiveStateB.length === this.baselineCurrentStateB.length
          ? this.baselineBLiveStateB
          : this.baselineCurrentStateB;
      const blend = this.buildBaselineBBlendedAnchorState(probeState);
      if (blend?.anchors?.length >= 2) {
        this.applyBaselineAArcStateToCurve(
          this.baseB,
          this.baseScratchB,
          this.baseNormB,
          blend.anchors
        );
        this.baselineAnchorCountB = blend.anchors.length;
        this.baselineAnchorPointsB = this.packBaselineAnchorPoints(blend.anchors);
        this.baselineBPivotIndex = blend.pivotIndex;
        this.baselineBPivotStrength = blend.pivotStrength;
        this.baselineBPivotEllipseDistance = blend.pivotEllipseDistance;
        this.baselineBPivotCenterDistancePx = blend.pivotCenterDistancePx;
        this.baselineBLiveStateB = this.cloneBaselineAAnchorState(blend.anchors);
      } else {
        this.computeNormals(this.baseB, this.baseNormB);
        this.baselineBLiveStateB = this.cloneBaselineAAnchorState(this.baselineCurrentStateB);
      }
    } else {
      this.computeNormals(this.baseB, this.baseNormB);
      this.baselineBLiveStateB = this.cloneBaselineAAnchorState(this.baselineCurrentStateB);
    }

    this.baseArcLenB = this.computeArcTable(this.baseB, this.baseArcB);
    this.travelArcB = this.wrapArc(this.travelArcB, this.baseArcLenB);
    this.computeSignedDisplacement(this.viewB, this.baseB, this.baseNormB, this.waveDispB);
    this.waveArcU0B.set(this.baseArcB);

    const edgeB = this.collectCurveViewportIntersections(this.baseB);
    this.baselineEdgeIntersectionPointsB = edgeB.points;
    this.baselineEdgeIntersectionLabelsB = edgeB.labels;
    this.baselineEdgeIntersectionDetailsB = edgeB.details;
  }

  normalizeWaveAdjust(waveAdjust) {
    return {
      xOffset: Number.isFinite(waveAdjust?.xOffset) ? waveAdjust.xOffset : 0,
      yOffset: Number.isFinite(waveAdjust?.yOffset) ? waveAdjust.yOffset : 0,
      scaleX: Number.isFinite(waveAdjust?.scaleX) ? waveAdjust.scaleX : 1,
      scaleY: Number.isFinite(waveAdjust?.scaleY) ? waveAdjust.scaleY : 1,
      rotation: Number.isFinite(waveAdjust?.rotation) ? waveAdjust.rotation : 0,
      pivotX: Number.isFinite(waveAdjust?.pivotX) ? waveAdjust.pivotX : NaN,
      pivotY: Number.isFinite(waveAdjust?.pivotY) ? waveAdjust.pivotY : NaN
    };
  }

  computeWaveTransformPivot(source, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    const rightEdge = Number.isFinite(rightEdgeValue) ? rightEdgeValue : this.layout.rightEdge;
    const rangeX = this.geometry.rangeX;
    const adj = this.normalizeWaveAdjust(waveAdjust);
    const sx = scaleX * adj.scaleX;
    const sy = scaleY * adj.scaleY;

    if (!source?.length || source.length < 2) {
      return {
        x: rightEdge - rangeX * sx * 0.5 + adj.xOffset,
        y: top + sy * 0.5 + adj.yOffset
      };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const count = (source.length / 2) | 0;

    for (let i = 0; i < count; i += 1) {
      const k = i * 2;
      const x = rightEdge - (rangeX - source[k]) * sx + adj.xOffset;
      const y = top + source[k + 1] * sy + adj.yOffset;
      if (x < minX) {
        minX = x;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (y > maxY) {
        maxY = y;
      }
    }

    return {
      x: (minX + maxX) * 0.5,
      y: (minY + maxY) * 0.5
    };
  }

  assignWaveAdjustPivot(source, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    if (!waveAdjust) {
      return;
    }
    const pivot = this.computeWaveTransformPivot(
      source,
      scaleX,
      scaleY,
      top,
      waveAdjust,
      rightEdgeValue
    );
    waveAdjust.pivotX = pivot.x;
    waveAdjust.pivotY = pivot.y;
  }

  createWaveTransformParams(source, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    const rightEdge = Number.isFinite(rightEdgeValue) ? rightEdgeValue : this.layout.rightEdge;
    const rangeX = this.geometry.rangeX;
    const adj = this.normalizeWaveAdjust(waveAdjust);
    const sx = scaleX * adj.scaleX;
    const sy = scaleY * adj.scaleY;

    let pivotX = adj.pivotX;
    let pivotY = adj.pivotY;
    if (!Number.isFinite(pivotX) || !Number.isFinite(pivotY)) {
      const pivot = this.computeWaveTransformPivot(
        source,
        scaleX,
        scaleY,
        top,
        adj,
        rightEdgeValue
      );
      pivotX = pivot.x;
      pivotY = pivot.y;
    }

    const rotationRad = (adj.rotation * Math.PI) / 180;
    const hasRotation = Math.abs(rotationRad) > 1e-9;

    return {
      rightEdge,
      rangeX,
      sx,
      sy,
      top,
      offsetX: adj.xOffset,
      offsetY: adj.yOffset,
      hasRotation,
      cos: Math.cos(rotationRad),
      sin: Math.sin(rotationRad),
      pivotX,
      pivotY
    };
  }

  transformNormPointWithParams(point, params) {
    let x = params.rightEdge - (params.rangeX - point.x) * params.sx + params.offsetX;
    let y = params.top + point.y * params.sy + params.offsetY;

    if (params.hasRotation) {
      const dx = x - params.pivotX;
      const dy = y - params.pivotY;
      x = params.pivotX + dx * params.cos - dy * params.sin;
      y = params.pivotY + dx * params.sin + dy * params.cos;
    }

    return { x, y };
  }

  transformToViewport(source, target, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    const params = this.createWaveTransformParams(
      source,
      scaleX,
      scaleY,
      top,
      waveAdjust,
      rightEdgeValue
    );

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const mapped = this.transformNormPointWithParams(
        { x: source[k], y: source[k + 1] },
        params
      );
      target[k] = mapped.x;
      target[k + 1] = mapped.y;
    }
  }

  transformNormPointToViewport(point, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    const params = this.createWaveTransformParams(
      null,
      scaleX,
      scaleY,
      top,
      waveAdjust,
      rightEdgeValue
    );
    return this.transformNormPointWithParams(point, params);
  }

  transformCubicSegmentsToViewport(normSegments, scaleX, scaleY, top, waveAdjust, rightEdgeValue) {
    const params = this.createWaveTransformParams(
      null,
      scaleX,
      scaleY,
      top,
      waveAdjust,
      rightEdgeValue
    );

    const out = [];
    for (const seg of normSegments) {
      if (seg.type === "C") {
        out.push({
          type: "C",
          p0: this.transformNormPointWithParams(seg.p0, params),
          p1: this.transformNormPointWithParams(seg.p1, params),
          p2: this.transformNormPointWithParams(seg.p2, params),
          p3: this.transformNormPointWithParams(seg.p3, params)
        });
      } else {
        out.push({
          type: "L",
          p0: this.transformNormPointWithParams(seg.p0, params),
          p1: this.transformNormPointWithParams(seg.p1, params)
        });
      }
    }
    return out;
  }

  collectAnchorPointsFromSegments(segments) {
    if (!segments.length) {
      return new Float32Array(0);
    }

    const out = new Float32Array((segments.length + 1) * 2);
    out[0] = segments[0].p0.x;
    out[1] = segments[0].p0.y;
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      const k = (i + 1) * 2;
      if (seg.type === "C") {
        out[k] = seg.p3.x;
        out[k + 1] = seg.p3.y;
      } else {
        out[k] = seg.p1.x;
        out[k + 1] = seg.p1.y;
      }
    }
    return out;
  }

  countAnchorPointsFromSegmentList(segments) {
    if (!Array.isArray(segments) || !segments.length) {
      return 0;
    }
    return segments.length + 1;
  }

  smoothOpenCurve(curve, scratch, passes) {
    const last = (this.n - 1) * 2;
    for (let pass = 0; pass < passes; pass += 1) {
      scratch[0] = curve[0];
      scratch[1] = curve[1];
      scratch[last] = curve[last];
      scratch[last + 1] = curve[last + 1];

      for (let i = 1; i < this.n - 1; i += 1) {
        const km = (i - 1) * 2;
        const k = i * 2;
        const kp = (i + 1) * 2;
        scratch[k] = curve[km] * 0.25 + curve[k] * 0.5 + curve[kp] * 0.25;
        scratch[k + 1] = curve[km + 1] * 0.25 + curve[k + 1] * 0.5 + curve[kp + 1] * 0.25;
      }

      curve.set(scratch);
    }
  }

  computeNormals(curve, normals) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const prev = Math.max(0, i - 1) * 2;
      const next = Math.min(this.n - 1, i + 1) * 2;
      const tx = (curve[next] - curve[prev]) * cw;
      const ty = (curve[next + 1] - curve[prev + 1]) * ch;
      const len = Math.max(1e-6, Math.hypot(tx, ty));
      normals[k] = -ty / len;
      normals[k + 1] = tx / len;
    }
  }

  computeSignedDisplacement(source, baseline, normals, disp) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const rx = (source[k] - baseline[k]) * cw;
      const ry = (source[k + 1] - baseline[k + 1]) * ch;
      disp[i] = rx * normals[k] + ry * normals[k + 1];
    }
  }

  detectCrestsAndTroughs(disp, crestOut, troughOut) {
    crestOut.length = 0;
    troughOut.length = 0;

    const minAmp = CONFIG.stroke.baselineMinAmplitudePx;
    const minGap = CONFIG.stroke.baselineMinGapSamples;
    const candidates = [];

    for (let i = 1; i < this.n - 1; i += 1) {
      const prev = disp[i - 1];
      const curr = disp[i];
      const next = disp[i + 1];

      if (curr >= prev && curr > next && Math.abs(curr) >= minAmp) {
        candidates.push({ idx: i, kind: 1, val: curr });
        continue;
      }
      if (curr <= prev && curr < next && Math.abs(curr) >= minAmp) {
        candidates.push({ idx: i, kind: -1, val: curr });
      }
    }

    if (!candidates.length) {
      return [];
    }

    const spaced = [];
    for (const cand of candidates) {
      const last = spaced[spaced.length - 1];
      if (!last || cand.idx - last.idx >= minGap) {
        spaced.push(cand);
        continue;
      }
      if (Math.abs(cand.val) > Math.abs(last.val)) {
        spaced[spaced.length - 1] = cand;
      }
    }

    const alternating = [];
    for (const cand of spaced) {
      const last = alternating[alternating.length - 1];
      if (!last) {
        alternating.push(cand);
        continue;
      }
      if (cand.kind === last.kind) {
        if (Math.abs(cand.val) > Math.abs(last.val)) {
          alternating[alternating.length - 1] = cand;
        }
      } else {
        alternating.push(cand);
      }
    }

    for (const ext of alternating) {
      if (ext.kind > 0) {
        crestOut.push(ext.idx);
      } else {
        troughOut.push(ext.idx);
      }
    }

    return alternating;
  }

  findWaveMidpointBetween(source, startIdx, endIdx) {
    const i0 = Math.max(0, Math.min(this.n - 1, Math.min(startIdx, endIdx) | 0));
    const i1 = Math.max(0, Math.min(this.n - 1, Math.max(startIdx, endIdx) | 0));
    if (i1 <= i0) {
      const k = i0 * 2;
      return { s: i0, x: source[k], y: source[k + 1] };
    }

    let total = 0;
    for (let i = i0; i < i1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const dx = source[k1] - source[k0];
      const dy = source[k1 + 1] - source[k0 + 1];
      total += Math.hypot(dx, dy);
    }

    if (total < 1e-8) {
      const s = 0.5 * (i0 + i1);
      const t = s - i0;
      const k0 = i0 * 2;
      const k1 = i1 * 2;
      return {
        s,
        x: lerp(source[k0], source[k1], t / Math.max(1e-6, i1 - i0)),
        y: lerp(source[k0 + 1], source[k1 + 1], t / Math.max(1e-6, i1 - i0))
      };
    }

    const half = total * 0.5;
    let acc = 0;
    for (let i = i0; i < i1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const dx = source[k1] - source[k0];
      const dy = source[k1 + 1] - source[k0 + 1];
      const segLen = Math.hypot(dx, dy);
      if (segLen < 1e-8) {
        continue;
      }
      if (acc + segLen >= half) {
        const t = (half - acc) / segLen;
        return {
          s: i + t,
          x: lerp(source[k0], source[k1], t),
          y: lerp(source[k0 + 1], source[k1 + 1], t)
        };
      }
      acc += segLen;
    }

    const k = i1 * 2;
    return { s: i1, x: source[k], y: source[k + 1] };
  }

  buildBaselineFromCrests(source, target, scratch, normals, disp, crestOut, troughOut) {
    target.set(source);
    this.smoothOpenCurve(target, scratch, CONFIG.stroke.baselineInitialPasses);
    this.computeNormals(target, normals);
    this.computeSignedDisplacement(source, target, normals, disp);

    const extrema = this.detectCrestsAndTroughs(disp, crestOut, troughOut);
    if (extrema.length < 2) {
      this.smoothOpenCurve(target, scratch, this.baselineSmooth);
      this.computeNormals(target, normals);
      const last = (this.n - 1) * 2;
      const anchors = [
        { s: 0, x: target[0], y: target[1] },
        { s: this.n - 1, x: target[last], y: target[last + 1] }
      ];
      return {
        count: 2,
        points: new Float32Array([target[0], target[1], target[last], target[last + 1]]),
        anchors
      };
    }

    const anchors = [];
    const last = (this.n - 1) * 2;
    anchors.push({ s: 0, x: target[0], y: target[1] });

    for (let i = 0; i < extrema.length - 1; i += 1) {
      const e0 = extrema[i];
      const e1 = extrema[i + 1];
      if (e0.kind === e1.kind) {
        continue;
      }
      anchors.push(this.findWaveMidpointBetween(source, e0.idx, e1.idx));
    }

    anchors.push({ s: this.n - 1, x: target[last], y: target[last + 1] });
    anchors.sort((a, b) => a.s - b.s);

    const deduped = [anchors[0]];
    for (let i = 1; i < anchors.length; i += 1) {
      const prev = deduped[deduped.length - 1];
      const cur = anchors[i];
      if (cur.s - prev.s < 0.5) {
        prev.s = 0.5 * (prev.s + cur.s);
        prev.x = 0.5 * (prev.x + cur.x);
        prev.y = 0.5 * (prev.y + cur.y);
      } else {
        deduped.push(cur);
      }
    }

    const tangentX = new Float32Array(deduped.length);
    const tangentY = new Float32Array(deduped.length);
    for (let i = 0; i < deduped.length; i += 1) {
      if (i === 0) {
        const a = deduped[i];
        const b = deduped[i + 1];
        const ds = Math.max(1e-6, b.s - a.s);
        tangentX[i] = (b.x - a.x) / ds;
        tangentY[i] = (b.y - a.y) / ds;
        continue;
      }
      if (i === deduped.length - 1) {
        const a = deduped[i - 1];
        const b = deduped[i];
        const ds = Math.max(1e-6, b.s - a.s);
        tangentX[i] = (b.x - a.x) / ds;
        tangentY[i] = (b.y - a.y) / ds;
        continue;
      }

      const a = deduped[i - 1];
      const b = deduped[i + 1];
      const ds = Math.max(1e-6, b.s - a.s);
      tangentX[i] = (b.x - a.x) / ds;
      tangentY[i] = (b.y - a.y) / ds;
    }

    let seg = 0;
    for (let i = 0; i < this.n; i += 1) {
      while (seg < deduped.length - 2 && i > deduped[seg + 1].s) {
        seg += 1;
      }

      const i0 = seg;
      const i1 = Math.min(seg + 1, deduped.length - 1);
      const a0 = deduped[i0];
      const a1 = deduped[i1];
      const ds = Math.max(1e-6, a1.s - a0.s);
      const t = clamp((i - a0.s) / ds, 0, 1);
      const tt = t * t;
      const ttt = tt * t;
      const h00 = 2 * ttt - 3 * tt + 1;
      const h10 = ttt - 2 * tt + t;
      const h01 = -2 * ttt + 3 * tt;
      const h11 = ttt - tt;

      const tangentScale = ds * this.baselineHandle;
      const m0x = tangentX[i0] * tangentScale;
      const m0y = tangentY[i0] * tangentScale;
      const m1x = tangentX[i1] * tangentScale;
      const m1y = tangentY[i1] * tangentScale;

      const k = i * 2;
      scratch[k] = h00 * a0.x + h10 * m0x + h01 * a1.x + h11 * m1x;
      scratch[k + 1] = h00 * a0.y + h10 * m0y + h01 * a1.y + h11 * m1y;
    }

    target.set(scratch);
    this.smoothOpenCurve(target, scratch, this.baselineSmooth);
    this.computeNormals(target, normals);
    const anchorPoints = new Float32Array(deduped.length * 2);
    for (let i = 0; i < deduped.length; i += 1) {
      const k = i * 2;
      anchorPoints[k] = deduped[i].x;
      anchorPoints[k + 1] = deduped[i].y;
    }

    return {
      count: deduped.length,
      points: anchorPoints,
      anchors: deduped.map((a) => ({ s: a.s, x: a.x, y: a.y }))
    };
  }

  collectCurveViewportIntersections(curve) {
    const count = (curve.length / 2) | 0;
    if (count < 2) {
      return { points: new Float32Array(0), labels: [], details: [] };
    }

    const eps = 1e-6;
    const dedupeDist = 1e-4;
    const hits = [];

    const pushHit = (edge, x, y, seg, t) => {
      const cx = clamp(x, 0, 1);
      const cy = clamp(y, 0, 1);
      for (const hit of hits) {
        const dx = hit.x - cx;
        const dy = hit.y - cy;
        if (Math.hypot(dx, dy) <= dedupeDist) {
          if (!hit.edges.includes(edge)) {
            hit.edges.push(edge);
          }
          if (seg < hit.seg || (seg === hit.seg && t < hit.t)) {
            hit.seg = seg;
            hit.t = t;
          }
          return;
        }
      }
      hits.push({ x: cx, y: cy, seg, t, edges: [edge] });
    };

    for (let i = 0; i < count - 1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const x0 = curve[k0];
      const y0 = curve[k0 + 1];
      const x1 = curve[k1];
      const y1 = curve[k1 + 1];
      const dx = x1 - x0;
      const dy = y1 - y0;

      if (Math.abs(dx) > eps) {
        let t = (0 - x0) / dx;
        if (t >= -eps && t <= 1 + eps) {
          const y = y0 + t * dy;
          if (y >= -eps && y <= 1 + eps) {
            pushHit("L", 0, y, i, t);
          }
        }
        t = (1 - x0) / dx;
        if (t >= -eps && t <= 1 + eps) {
          const y = y0 + t * dy;
          if (y >= -eps && y <= 1 + eps) {
            pushHit("R", 1, y, i, t);
          }
        }
      }

      if (Math.abs(dy) > eps) {
        let t = (0 - y0) / dy;
        if (t >= -eps && t <= 1 + eps) {
          const x = x0 + t * dx;
          if (x >= -eps && x <= 1 + eps) {
            pushHit("T", x, 0, i, t);
          }
        }
        t = (1 - y0) / dy;
        if (t >= -eps && t <= 1 + eps) {
          const x = x0 + t * dx;
          if (x >= -eps && x <= 1 + eps) {
            pushHit("B", x, 1, i, t);
          }
        }
      }
    }

    hits.sort((a, b) => (a.seg === b.seg ? a.t - b.t : a.seg - b.seg));
    const points = new Float32Array(hits.length * 2);
    const labels = new Array(hits.length);
    for (let i = 0; i < hits.length; i += 1) {
      const k = i * 2;
      points[k] = hits[i].x;
      points[k + 1] = hits[i].y;
      labels[i] = `${hits[i].edges.join("")}`;
    }

    return { points, labels, details: hits };
  }

  rebuildTravelMarkers() {
    this.markerPosA = new Float32Array(this.constraintAnchorA.length);
    this.markerPosB = new Float32Array(this.constraintAnchorB.length);
    this.markerPosSecondaryA = new Float32Array(this.constraintSecondaryAnchorA.length);
    this.markerPosSecondaryB = new Float32Array(this.constraintSecondaryAnchorB.length);
    this.updateTravelMarkers();
  }

  rebuildTravelWaves() {
    this.baseArcLenA = this.computeArcTable(this.baseA, this.baseArcA);
    this.baseArcLenB = this.computeArcTable(this.baseB, this.baseArcB);
    this.baseSecondaryArcLenA = this.computeArcTable(this.baseSecondaryA, this.baseSecondaryArcA);
    this.baseSecondaryArcLenB = this.computeArcTable(this.baseSecondaryB, this.baseSecondaryArcB);
    this.travelArcA = this.wrapArc(this.travelArcA, this.baseArcLenA);
    this.travelArcB = this.wrapArc(this.travelArcB, this.baseArcLenB);

    this.computeSignedDisplacement(this.viewA, this.baseA, this.baseNormA, this.waveDispA);
    this.computeSignedDisplacement(this.viewB, this.baseB, this.baseNormB, this.waveDispB);
    this.computeSignedDisplacement(
      this.viewSecondaryA,
      this.baseSecondaryA,
      this.baseSecondaryNormA,
      this.waveSecondaryDispA
    );
    this.computeSignedDisplacement(
      this.viewSecondaryB,
      this.baseSecondaryB,
      this.baseSecondaryNormB,
      this.waveSecondaryDispB
    );
    this.waveArcU0A.set(this.baseArcA);
    this.waveArcU0B.set(this.baseArcB);
    this.waveSecondaryArcU0A.set(this.baseSecondaryArcA);
    this.waveSecondaryArcU0B.set(this.baseSecondaryArcB);
    this.resetBlendMapTransitions();
    this.resetIntermediatePocTransitionState();
    this.updateTravelWaves();
  }

  rebuildCubicWaveStates(layoutState) {
    const activeLayout = layoutState?.active || {};
    const secondaryLayout = layoutState?.secondary || activeLayout;
    const activeCubic = this.cubicSegments?.[this.activeWaveSet] || { waveA: [], waveB: [] };
    const secondaryCubic = this.cubicSegments?.[this.secondaryWaveSet] || { waveA: [], waveB: [] };

    this.cubicOrigA = this.transformCubicSegmentsToViewport(
      activeCubic.waveA || [],
      activeLayout.scaleX,
      activeLayout.scaleY,
      activeLayout.top,
      activeLayout.waveA,
      activeLayout.rightEdge
    );
    this.cubicOrigB = this.transformCubicSegmentsToViewport(
      activeCubic.waveB || [],
      activeLayout.scaleX,
      activeLayout.scaleY,
      activeLayout.top,
      activeLayout.waveB,
      activeLayout.rightEdge
    );
    this.cubicSecondaryA = this.transformCubicSegmentsToViewport(
      secondaryCubic.waveA || [],
      secondaryLayout.scaleX,
      secondaryLayout.scaleY,
      secondaryLayout.top,
      secondaryLayout.waveA,
      secondaryLayout.rightEdge
    );
    this.cubicSecondaryB = this.transformCubicSegmentsToViewport(
      secondaryCubic.waveB || [],
      secondaryLayout.scaleX,
      secondaryLayout.scaleY,
      secondaryLayout.top,
      secondaryLayout.waveB,
      secondaryLayout.rightEdge
    );

    this.anchorStateA = this.buildAnchorTransportState(
      this.cubicOrigA,
      this.baseA,
      this.baseArcA,
      { dropLastAnchor: true }
    );
    this.anchorStateB = this.buildAnchorTransportState(
      this.cubicOrigB,
      this.baseB,
      this.baseArcB,
      { dropLastAnchor: true }
    );
    this.anchorSecondaryStateA = this.buildAnchorTransportState(
      this.cubicSecondaryA,
      this.baseSecondaryA,
      this.baseSecondaryArcA
    );
    this.anchorSecondaryStateB = this.buildAnchorTransportState(
      this.cubicSecondaryB,
      this.baseSecondaryB,
      this.baseSecondaryArcB
    );

    this.cubicMovedA = this.createMovedSegmentBuffer(this.cubicOrigA);
    this.cubicMovedB = this.createMovedSegmentBuffer(this.cubicOrigB);
    this.cubicSecondaryMovedA = this.createMovedSegmentBuffer(this.cubicSecondaryA);
    this.cubicSecondaryMovedB = this.createMovedSegmentBuffer(this.cubicSecondaryB);
    this.constraintBaseA = new Float32Array(this.anchorStateA.length * 2);
    this.constraintBaseB = new Float32Array(this.anchorStateB.length * 2);
    this.constraintAnchorA = new Float32Array(this.anchorStateA.length * 2);
    this.constraintAnchorB = new Float32Array(this.anchorStateB.length * 2);
    this.constraintHandleOutA = new Float32Array(this.anchorStateA.length * 2);
    this.constraintHandleInA = new Float32Array(this.anchorStateA.length * 2);
    this.constraintHandleOutB = new Float32Array(this.anchorStateB.length * 2);
    this.constraintHandleInB = new Float32Array(this.anchorStateB.length * 2);
    this.constraintSecondaryBaseA = new Float32Array(this.anchorSecondaryStateA.length * 2);
    this.constraintSecondaryBaseB = new Float32Array(this.anchorSecondaryStateB.length * 2);
    this.constraintSecondaryAnchorA = new Float32Array(this.anchorSecondaryStateA.length * 2);
    this.constraintSecondaryAnchorB = new Float32Array(this.anchorSecondaryStateB.length * 2);
    this.mappingSecondaryA = new Float32Array(0);
    this.mappingSecondaryB = new Float32Array(0);

    this.waveSkipAStart = -1;
    this.waveSkipAEnd = -1;
    this.waveSkipBStart = -1;
    this.waveSkipBEnd = -1;
    this.waveOrderAStart = -1;
    this.waveOrderAEnd = -1;
    this.waveOrderACount = 0;
    this.waveOrderBStart = -1;
    this.waveOrderBEnd = -1;
    this.waveOrderBCount = 0;
    this.waveSecondarySkipAStart = -1;
    this.waveSecondarySkipAEnd = -1;
    this.waveSecondarySkipBStart = -1;
    this.waveSecondarySkipBEnd = -1;
    this.resetBlendMapTransitions();
    this.resetIntermediatePocTransitionState();
    this.updateTravelWaves();
  }

  createMovedSegmentBuffer(sourceSegments) {
    const out = [];
    for (const seg of sourceSegments) {
      if (seg.type === "C") {
        out.push({
          type: "C",
          p0: { x: seg.p0.x, y: seg.p0.y },
          p1: { x: seg.p1.x, y: seg.p1.y },
          p2: { x: seg.p2.x, y: seg.p2.y },
          p3: { x: seg.p3.x, y: seg.p3.y }
        });
      } else {
        out.push({
          type: "L",
          p0: { x: seg.p0.x, y: seg.p0.y },
          p1: { x: seg.p1.x, y: seg.p1.y }
        });
      }
    }
    return out;
  }

  closestPointOnBaseline(x, y, baseline, arcTable) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const px = x * cw;
    const py = y * ch;

    let bestDist2 = Infinity;
    let best = {
      u: 0,
      d: 0,
      tx: 1,
      ty: 0
    };

    for (let i = 0; i < this.n - 1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;

      const x0 = baseline[k0] * cw;
      const y0 = baseline[k0 + 1] * ch;
      const x1 = baseline[k1] * cw;
      const y1 = baseline[k1 + 1] * ch;

      const vx = x1 - x0;
      const vy = y1 - y0;
      const segLen2 = vx * vx + vy * vy;
      if (segLen2 < 1e-9) {
        continue;
      }

      const wx = px - x0;
      const wy = py - y0;
      const t = clamp((wx * vx + wy * vy) / segLen2, 0, 1);
      const cx = x0 + vx * t;
      const cy = y0 + vy * t;
      const dx = px - cx;
      const dy = py - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        const segLen = Math.sqrt(segLen2);
        const tx = vx / segLen;
        const ty = vy / segLen;
        const nx = -ty;
        const ny = tx;
        const u = arcTable[i] + t * (arcTable[i + 1] - arcTable[i]);
        bestDist2 = d2;
        best = {
          u,
          d: dx * nx + dy * ny,
          tx,
          ty
        };
      }
    }

    return best;
  }

  intersectBaselineWithAnchorNormal(anchor, tangent, baseline, arcTable) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ax = anchor.x * cw;
    const ay = anchor.y * ch;

    const tLen = Math.max(1e-6, Math.hypot(tangent.x, tangent.y));
    const tx = tangent.x / tLen;
    const ty = tangent.y / tLen;
    const nx = -ty;
    const ny = tx;

    let best = null;
    let bestAbsS = Infinity;

    const cross2 = (ux, uy, vx, vy) => ux * vy - uy * vx;
    for (let i = 0; i < this.n - 1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;

      const x0 = baseline[k0] * cw;
      const y0 = baseline[k0 + 1] * ch;
      const x1 = baseline[k1] * cw;
      const y1 = baseline[k1 + 1] * ch;
      const vx = x1 - x0;
      const vy = y1 - y0;
      const den = cross2(nx, ny, vx, vy);
      if (Math.abs(den) < 1e-8) {
        continue;
      }

      const wx = x0 - ax;
      const wy = y0 - ay;
      const s = cross2(wx, wy, vx, vy) / den;
      const t = cross2(wx, wy, nx, ny) / den;
      if (t < -1e-6 || t > 1 + 1e-6) {
        continue;
      }

      const tc = clamp(t, 0, 1);
      const ix = x0 + vx * tc;
      const iy = y0 + vy * tc;
      const absS = Math.abs(s);
      if (absS < bestAbsS) {
        const segLen = Math.max(1e-6, Math.hypot(vx, vy));
        const btx = vx / segLen;
        const bty = vy / segLen;
        const bnx = -bty;
        const bny = btx;
        const dx = ax - ix;
        const dy = ay - iy;
        const u = arcTable[i] + tc * (arcTable[i + 1] - arcTable[i]);
        bestAbsS = absS;
        best = {
          u,
          d: dx * bnx + dy * bny,
          tx: btx,
          ty: bty
        };
      }
    }

    return best;
  }

  buildAnchorTransportState(cubicSegments, baseline, arcTable, options = null) {
    if (!cubicSegments.length) {
      return [];
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const anchorCount = cubicSegments.length + 1;
    const anchors = new Array(anchorCount);
    anchors[0] = { x: cubicSegments[0].p0.x, y: cubicSegments[0].p0.y };
    for (let i = 0; i < cubicSegments.length; i += 1) {
      const seg = cubicSegments[i];
      anchors[i + 1] = {
        x: seg.type === "C" ? seg.p3.x : seg.p1.x,
        y: seg.type === "C" ? seg.p3.y : seg.p1.y
      };
    }

    const outgoing = new Array(anchorCount);
    const incoming = new Array(anchorCount);
    for (let i = 0; i < anchorCount; i += 1) {
      outgoing[i] = { x: 0, y: 0 };
      incoming[i] = { x: 0, y: 0 };
    }

    for (let i = 0; i < cubicSegments.length; i += 1) {
      const seg = cubicSegments[i];
      if (seg.type === "C") {
        outgoing[i] = { x: seg.p1.x - seg.p0.x, y: seg.p1.y - seg.p0.y };
        incoming[i + 1] = { x: seg.p2.x - seg.p3.x, y: seg.p2.y - seg.p3.y };
      }
    }

    const chooseAnchorTangent = (anchorIndex) => {
      const out = outgoing[anchorIndex];
      const inn = incoming[anchorIndex];
      const outLen = Math.hypot(out.x, out.y);
      const inLen = Math.hypot(inn.x, inn.y);

      if (outLen > 1e-6 && inLen > 1e-6) {
        const vx = out.x - inn.x;
        const vy = out.y - inn.y;
        const vLen = Math.hypot(vx, vy);
        if (vLen > 1e-6) {
          return { x: vx / vLen, y: vy / vLen };
        }
      }
      if (outLen > 1e-6) {
        return { x: out.x / outLen, y: out.y / outLen };
      }
      if (inLen > 1e-6) {
        return { x: -inn.x / inLen, y: -inn.y / inLen };
      }

      const prev = anchors[Math.max(0, anchorIndex - 1)];
      const next = anchors[Math.min(anchorCount - 1, anchorIndex + 1)];
      const vx = next.x - prev.x;
      const vy = next.y - prev.y;
      const vLen = Math.hypot(vx, vy);
      if (vLen > 1e-6) {
        return { x: vx / vLen, y: vy / vLen };
      }
      return { x: 1, y: 0 };
    };

    const states = new Array(anchorCount);
    for (let i = 0; i < anchorCount; i += 1) {
      const anchor = anchors[i];
      const tangent = chooseAnchorTangent(i);
      const projection =
        this.intersectBaselineWithAnchorNormal(anchor, tangent, baseline, arcTable) ||
        this.closestPointOnBaseline(anchor.x, anchor.y, baseline, arcTable);
      const tLen = Math.max(1e-6, Math.hypot(projection.tx, projection.ty));
      const tanPxX = tangent.x * cw;
      const tanPxY = tangent.y * ch;
      const tanLen = Math.max(1e-6, Math.hypot(tanPxX, tanPxY));
      const tanUx = tanPxX / tanLen;
      const tanUy = tanPxY / tanLen;

      const outPxX = outgoing[i].x * cw;
      const outPxY = outgoing[i].y * ch;
      const inPxX = incoming[i].x * cw;
      const inPxY = incoming[i].y * ch;
      const outLenPx = Math.hypot(outPxX, outPxY);
      const inLenPx = Math.hypot(inPxX, inPxY);

      let outSign = outLenPx > 1e-6 ? Math.sign(outPxX * tanUx + outPxY * tanUy) : 0;
      let inSign = inLenPx > 1e-6 ? Math.sign(inPxX * tanUx + inPxY * tanUy) : 0;
      if (outSign === 0 && outLenPx > 1e-6) {
        outSign = 1;
      }
      if (inSign === 0 && inLenPx > 1e-6) {
        inSign = -1;
      }

      states[i] = {
        x0: anchor.x,
        y0: anchor.y,
        u0: projection.u,
        d: projection.d,
        tx0: projection.tx / tLen,
        ty0: projection.ty / tLen,
        outLenPx,
        inLenPx,
        outSign,
        inSign
      };
    }

    if (options?.dropLastAnchor && states.length > 2) {
      // In drop-last mode, anchor 0 becomes an interior traveling anchor.
      // The original SVG endpoint often has only one handle (incoming=0), so
      // we mirror it to keep the transported shape smooth and symmetric.
      const first = states[0];
      const outLen = Math.max(0, Number(first.outLenPx) || 0);
      const inLen = Math.max(0, Number(first.inLenPx) || 0);
      const maxLen = Math.max(outLen, inLen);
      let symLen = 0;
      if (maxLen > 1e-6) {
        symLen = outLen > 1e-6 && inLen > 1e-6 ? 0.5 * (outLen + inLen) : maxLen;
      } else {
        let sum = 0;
        let count = 0;
        for (let i = 1; i < states.length; i += 1) {
          const s = states[i];
          const so = Math.max(0, Number(s.outLenPx) || 0);
          const si = Math.max(0, Number(s.inLenPx) || 0);
          if (so > 1e-6) {
            sum += so;
            count += 1;
          }
          if (si > 1e-6) {
            sum += si;
            count += 1;
          }
        }
        if (count > 0) {
          symLen = Math.max(6, sum / count);
        }
      }
      if (symLen > 1e-6) {
        let outSign = Number(first.outSign) || 0;
        let inSign = Number(first.inSign) || 0;
        if (outSign === 0 && inSign !== 0) {
          outSign = -Math.sign(inSign);
        }
        if (inSign === 0 && outSign !== 0) {
          inSign = -Math.sign(outSign);
        }
        if (outSign === 0 && inSign === 0) {
          outSign = 1;
          inSign = -1;
        } else {
          outSign = outSign === 0 ? 1 : Math.sign(outSign);
          inSign = -outSign;
        }
        first.outLenPx = symLen;
        first.inLenPx = symLen;
        first.outSign = outSign;
        first.inSign = inSign;
      }

      states.length = states.length - 1;
    }

    return states;
  }

  cubicPoint(segment, t) {
    if (segment.type === "L") {
      return {
        x: lerp(segment.p0.x, segment.p1.x, t),
        y: lerp(segment.p0.y, segment.p1.y, t)
      };
    }

    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * segment.p0.x + 3 * mt2 * t * segment.p1.x + 3 * mt * t2 * segment.p2.x + t3 * segment.p3.x,
      y: mt3 * segment.p0.y + 3 * mt2 * t * segment.p1.y + 3 * mt * t2 * segment.p2.y + t3 * segment.p3.y
    };
  }

  writeMovedCubicWave(
    sourceSegments,
    movedSegments,
    anchorStates,
    baseline,
    normals,
    arcTable,
    totalArc,
    arcOffset,
    outCurve,
    outBasePoints,
    outAnchorPoints,
    options
  ) {
    if (!sourceSegments.length || anchorStates.length < 2) {
      return {
        skipStart: -1,
        skipEnd: -1,
        orderStart: -1,
        orderEnd: -1,
        orderCount: 0,
        maxOrthDot: 0,
        maxHandleLenErrorPx: 0,
        minAdjacentAnchorPx: Infinity,
        adjacentClosePairCount: 0
      };
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const movedAnchors = new Array(anchorStates.length);
    const tangentOut = new Array(anchorStates.length);
    const tangentIn = new Array(anchorStates.length);
    const wrappedArc = new Float32Array(anchorStates.length);
    const mergeLastAnchorWithFirst = !!options?.mergeLastAnchorWithFirst;
    const enforcePeriodicEdgeTangents = !!options?.enforcePeriodicEdgeTangents;
    const adjustFirstAnchorByNeighbors = !!options?.adjustFirstAnchorByNeighbors;
    const preserveIndexOrder = !!options?.preserveIndexOrder;
    const breakRenderSeam = !!options?.breakRenderSeam;
    const outTangentOut = options?.outTangentOut || null;
    const outTangentIn = options?.outTangentIn || null;
    let maxOrthDot = 0;
    let maxHandleLenErrorPx = 0;

    for (let i = 0; i < anchorStates.length; i += 1) {
      const state = anchorStates[i];
      const u = this.wrapArc(state.u0 + arcOffset, totalArc);
      wrappedArc[i] = u;
      const frame = this.sampleFrameAtArc(baseline, arcTable, u);
      const x = frame.x + (frame.nx * state.d) / cw;
      const y = frame.y + (frame.ny * state.d) / ch;
      movedAnchors[i] = { x, y };
      if (outBasePoints && outAnchorPoints) {
        const kb = i * 2;
        outBasePoints[kb] = frame.x;
        outBasePoints[kb + 1] = frame.y;
        outAnchorPoints[kb] = x;
        outAnchorPoints[kb + 1] = y;
      }

      const cx = (x - frame.x) * cw;
      const cy = (y - frame.y) * ch;
      const cLen = Math.hypot(cx, cy);
      if (cLen > 1e-6) {
        const cux = cx / cLen;
        const cuy = cy / cLen;
        const orthDot = Math.abs(cux * frame.tx + cuy * frame.ty);
        if (orthDot > maxOrthDot) {
          maxOrthDot = orthDot;
        }
      }

      tangentOut[i] = {
        x: (frame.tx * state.outLenPx * state.outSign) / cw,
        y: (frame.ty * state.outLenPx * state.outSign) / ch
      };
      tangentIn[i] = {
        x: (frame.tx * state.inLenPx * state.inSign) / cw,
        y: (frame.ty * state.inLenPx * state.inSign) / ch
      };
    }

    const anchorCount = movedAnchors.length;
    if (adjustFirstAnchorByNeighbors && anchorCount >= 3 && totalArc > 1e-6) {
      const idx = 0;
      const order = new Array(anchorCount);
      for (let i = 0; i < anchorCount; i += 1) {
        order[i] = i;
      }
      if (!preserveIndexOrder) {
        order.sort((ia, ib) => {
          const da = wrappedArc[ia] - wrappedArc[ib];
          if (Math.abs(da) > 1e-8) {
            return da;
          }
          return ia - ib;
        });
      }

      const pos = order.indexOf(idx);
      if (pos >= 0) {
        const prevIdx = order[(pos - 1 + anchorCount) % anchorCount];
        const nextIdx = order[(pos + 1) % anchorCount];
        if (prevIdx !== idx && nextIdx !== idx && prevIdx !== nextIdx) {
          const centerU = wrappedArc[idx];
          let prevU = wrappedArc[prevIdx];
          let nextU = wrappedArc[nextIdx];
          if (prevU > centerU) {
            prevU -= totalArc;
          }
          if (nextU < centerU) {
            nextU += totalArc;
          }
          if (nextU - prevU > 1e-4) {
            const adjustedU = this.wrapArc((prevU + nextU) * 0.5, totalArc);
            wrappedArc[idx] = adjustedU;

            const state = anchorStates[idx];
            const frame = this.sampleFrameAtArc(baseline, arcTable, adjustedU);
            const x = frame.x + (frame.nx * state.d) / cw;
            const y = frame.y + (frame.ny * state.d) / ch;
            movedAnchors[idx] = { x, y };

            if (outBasePoints && outAnchorPoints) {
              outBasePoints[0] = frame.x;
              outBasePoints[1] = frame.y;
              outAnchorPoints[0] = x;
              outAnchorPoints[1] = y;
            }

            const cx = (x - frame.x) * cw;
            const cy = (y - frame.y) * ch;
            const cLen = Math.hypot(cx, cy);
            if (cLen > 1e-6) {
              const cux = cx / cLen;
              const cuy = cy / cLen;
              const orthDot = Math.abs(cux * frame.tx + cuy * frame.ty);
              if (orthDot > maxOrthDot) {
                maxOrthDot = orthDot;
              }
            }

            tangentOut[idx] = {
              x: (frame.tx * state.outLenPx * state.outSign) / cw,
              y: (frame.ty * state.outLenPx * state.outSign) / ch
            };
            tangentIn[idx] = {
              x: (frame.tx * state.inLenPx * state.inSign) / cw,
              y: (frame.ty * state.inLenPx * state.inSign) / ch
            };
          }
        }
      }
    }

    if (mergeLastAnchorWithFirst && anchorCount >= 2) {
      const first = movedAnchors[0];
      const last = anchorCount - 1;
      const firstOut = { x: tangentOut[0].x, y: tangentOut[0].y };
      const lastIn = { x: tangentIn[last].x, y: tangentIn[last].y };
      movedAnchors[last] = { x: first.x, y: first.y };
      wrappedArc[last] = wrappedArc[0];

      const outPxX = firstOut.x * cw;
      const outPxY = firstOut.y * ch;
      const inPxX = lastIn.x * cw;
      const inPxY = lastIn.y * ch;
      const outLenPx = Math.hypot(outPxX, outPxY);
      const inLenPx = Math.hypot(inPxX, inPxY);

      if (outLenPx > 1e-6 || inLenPx > 1e-6) {
        let dirPxX = outLenPx > 1e-6 ? outPxX / outLenPx : -inPxX / Math.max(1e-6, inLenPx);
        let dirPxY = outLenPx > 1e-6 ? outPxY / outLenPx : -inPxY / Math.max(1e-6, inLenPx);
        const dirLen = Math.max(1e-6, Math.hypot(dirPxX, dirPxY));
        dirPxX /= dirLen;
        dirPxY /= dirLen;

        const handleLenPx =
          outLenPx > 1e-6 && inLenPx > 1e-6
            ? 0.5 * (outLenPx + inLenPx)
            : Math.max(outLenPx, inLenPx);
        const outVec = {
          x: (dirPxX * handleLenPx) / cw,
          y: (dirPxY * handleLenPx) / ch
        };
        const inVec = {
          x: (-dirPxX * handleLenPx) / cw,
          y: (-dirPxY * handleLenPx) / ch
        };

        tangentOut[0] = { x: outVec.x, y: outVec.y };
        tangentOut[last] = { x: outVec.x, y: outVec.y };
        tangentIn[0] = { x: inVec.x, y: inVec.y };
        tangentIn[last] = { x: inVec.x, y: inVec.y };
      } else {
        tangentOut[last] = { x: tangentOut[0].x, y: tangentOut[0].y };
        tangentIn[0] = { x: tangentIn[last].x, y: tangentIn[last].y };
      }

      if (outBasePoints && outAnchorPoints) {
        const kFirst = 0;
        const kLast = last * 2;
        outBasePoints[kLast] = outBasePoints[kFirst];
        outBasePoints[kLast + 1] = outBasePoints[kFirst + 1];
        outAnchorPoints[kLast] = outAnchorPoints[kFirst];
        outAnchorPoints[kLast + 1] = outAnchorPoints[kFirst + 1];
      }
    }

    if (anchorCount < 2) {
      return {
        skipStart: -1,
        skipEnd: -1,
        orderStart: -1,
        orderEnd: -1,
        orderCount: 0,
        maxOrthDot,
        maxHandleLenErrorPx,
        minAdjacentAnchorPx: Infinity,
        adjacentClosePairCount: 0
      };
    }

    const anchorOrder = new Array(anchorCount);
    for (let i = 0; i < anchorCount; i += 1) {
      anchorOrder[i] = i;
    }
    if (!preserveIndexOrder) {
      anchorOrder.sort((ia, ib) => {
        const da = wrappedArc[ia] - wrappedArc[ib];
        if (Math.abs(da) > 1e-8) {
          return da;
        }
        return ia - ib;
      });
      // Ends are the arc extremes (min-u and max-u). We never join across that wrap pair.
    }

    if (enforcePeriodicEdgeTangents && anchorOrder.length >= 2) {
      const edgeStart = anchorOrder[0];
      const edgeEnd = anchorOrder[anchorOrder.length - 1];
      const outStartPx = {
        x: tangentOut[edgeStart].x * cw,
        y: tangentOut[edgeStart].y * ch
      };
      const inEndPx = {
        x: tangentIn[edgeEnd].x * cw,
        y: tangentIn[edgeEnd].y * ch
      };
      const outLenPx = Math.hypot(outStartPx.x, outStartPx.y);
      const inLenPx = Math.hypot(inEndPx.x, inEndPx.y);

      if (outLenPx > 1e-6 || inLenPx > 1e-6) {
        let dirX = 0;
        let dirY = 0;

        if (outLenPx > 1e-6) {
          dirX += outStartPx.x / outLenPx;
          dirY += outStartPx.y / outLenPx;
        }
        if (inLenPx > 1e-6) {
          // Derivative at the end anchor is opposite of incoming handle.
          dirX += -inEndPx.x / inLenPx;
          dirY += -inEndPx.y / inLenPx;
        }

        const dirLen = Math.hypot(dirX, dirY);
        if (dirLen > 1e-6) {
          dirX /= dirLen;
          dirY /= dirLen;
          const handleLenPx =
            outLenPx > 1e-6 && inLenPx > 1e-6
              ? 0.5 * (outLenPx + inLenPx)
              : Math.max(outLenPx, inLenPx);
          tangentOut[edgeStart] = {
            x: (dirX * handleLenPx) / cw,
            y: (dirY * handleLenPx) / ch
          };
          tangentIn[edgeEnd] = {
            x: (-dirX * handleLenPx) / cw,
            y: (-dirY * handleLenPx) / ch
          };
        }
      }
    }

    if (outTangentOut?.length >= anchorCount * 2) {
      for (let i = 0; i < anchorCount; i += 1) {
        const k = i * 2;
        outTangentOut[k] = tangentOut[i].x;
        outTangentOut[k + 1] = tangentOut[i].y;
      }
    }
    if (outTangentIn?.length >= anchorCount * 2) {
      for (let i = 0; i < anchorCount; i += 1) {
        const k = i * 2;
        outTangentIn[k] = tangentIn[i].x;
        outTangentIn[k + 1] = tangentIn[i].y;
      }
    }

    const closeThresholdPx = 1.25;
    let minAdjacentAnchorPx = Infinity;
    let adjacentClosePairCount = 0;
    for (let i = 0; i < anchorOrder.length - 1; i += 1) {
      const aIdx = anchorOrder[i];
      const bIdx = anchorOrder[i + 1];
      const ax = movedAnchors[aIdx].x * cw;
      const ay = movedAnchors[aIdx].y * ch;
      const bx = movedAnchors[bIdx].x * cw;
      const by = movedAnchors[bIdx].y * ch;
      const d = Math.hypot(bx - ax, by - ay);
      if (d < minAdjacentAnchorPx) {
        minAdjacentAnchorPx = d;
      }
      if (d < closeThresholdPx) {
        adjacentClosePairCount += 1;
      }
    }

    const segCount = Math.min(movedSegments.length, Math.max(0, anchorOrder.length - 1));
    let seamMovedSegmentIndex = -1;
    if (breakRenderSeam && segCount >= 2) {
      const diffs = new Array(segCount);
      let positiveCount = 0;
      let negativeCount = 0;
      for (let i = 0; i < segCount; i += 1) {
        const aIdx = anchorOrder[i];
        const bIdx = anchorOrder[i + 1];
        const d = wrappedArc[bIdx] - wrappedArc[aIdx];
        diffs[i] = d;
        if (d >= 0) {
          positiveCount += 1;
        } else {
          negativeCount += 1;
        }
      }

      if (positiveCount > 0 && negativeCount > 0) {
        const forwardMajority = positiveCount >= negativeCount;
        const excluded = mergeLastAnchorWithFirst ? segCount - 1 : -1;
        let best = forwardMajority ? Infinity : -Infinity;
        let bestIndex = -1;
        let fallback = forwardMajority ? Infinity : -Infinity;
        let fallbackIndex = -1;
        for (let i = 0; i < segCount; i += 1) {
          const d = diffs[i];
          if (forwardMajority) {
            if (d < fallback) {
              fallback = d;
              fallbackIndex = i;
            }
            if (i !== excluded && d < best) {
              best = d;
              bestIndex = i;
            }
          } else {
            if (d > fallback) {
              fallback = d;
              fallbackIndex = i;
            }
            if (i !== excluded && d > best) {
              best = d;
              bestIndex = i;
            }
          }
        }
        seamMovedSegmentIndex = bestIndex >= 0 ? bestIndex : fallbackIndex;
      }
    }

    for (let i = 0; i < segCount; i += 1) {
      const src = sourceSegments[i];
      const dst = movedSegments[i];
      const aIdx = anchorOrder[i];
      const bIdx = anchorOrder[i + 1];
      const a0 = movedAnchors[aIdx];
      const a1 = movedAnchors[bIdx];

      dst.p0.x = a0.x;
      dst.p0.y = a0.y;

      if (src.type === "C") {
        dst.p1.x = a0.x + tangentOut[aIdx].x;
        dst.p1.y = a0.y + tangentOut[aIdx].y;
        dst.p2.x = a1.x + tangentIn[bIdx].x;
        dst.p2.y = a1.y + tangentIn[bIdx].y;
        dst.p3.x = a1.x;
        dst.p3.y = a1.y;

        const outLenPx = Math.hypot((dst.p1.x - a0.x) * cw, (dst.p1.y - a0.y) * ch);
        const inLenPx = Math.hypot((dst.p2.x - a1.x) * cw, (dst.p2.y - a1.y) * ch);
        maxHandleLenErrorPx = Math.max(
          maxHandleLenErrorPx,
          Math.abs(outLenPx - anchorStates[aIdx].outLenPx),
          Math.abs(inLenPx - anchorStates[bIdx].inLenPx)
        );
      } else {
        dst.p1.x = a1.x;
        dst.p1.y = a1.y;
      }
    }

    if (!segCount) {
      const only = movedAnchors[anchorOrder[0]];
      for (let i = 0; i < this.n; i += 1) {
        const k = i * 2;
        outCurve[k] = only.x;
        outCurve[k + 1] = only.y;
      }
      return {
        skipStart: -1,
        skipEnd: -1,
        orderStart: anchorOrder.length ? anchorOrder[0] : -1,
        orderEnd: anchorOrder.length ? anchorOrder[anchorOrder.length - 1] : -1,
        orderCount: anchorOrder.length,
        maxOrthDot,
        maxHandleLenErrorPx,
        minAdjacentAnchorPx,
        adjacentClosePairCount
      };
    }

    const firstSeg = movedSegments[0];
    outCurve[0] = firstSeg.p0.x;
    outCurve[1] = firstSeg.p0.y;
    let write = 1;
    let remaining = this.n - 1;
    const seamRanges = seamMovedSegmentIndex >= 0 ? new Array(segCount) : null;

    for (let i = 0; i < segCount; i += 1) {
      const seg = movedSegments[i];
      const segmentsLeft = segCount - i;
      const steps = Math.max(1, Math.floor(remaining / segmentsLeft));
      const writeBefore = write;
      for (let j = 1; j <= steps && write < this.n; j += 1) {
        const p = this.cubicPoint(seg, j / steps);
        const k = write * 2;
        outCurve[k] = p.x;
        outCurve[k + 1] = p.y;
        write += 1;
      }
      if (seamRanges) {
        const start = Math.max(0, writeBefore - 1);
        const end = Math.max(start, write - 1);
        seamRanges[i] = { start, end };
      }
      remaining -= steps;
    }

    const tailSeg = movedSegments[segCount - 1];
    const lastAnchor = tailSeg.type === "C" ? tailSeg.p3 : tailSeg.p1;
    while (write < this.n) {
      const k = write * 2;
      outCurve[k] = lastAnchor.x;
      outCurve[k + 1] = lastAnchor.y;
      write += 1;
    }

    let skipStart = -1;
    let skipEnd = -1;
    if (seamRanges && seamMovedSegmentIndex >= 0) {
      const seamRange = seamRanges[seamMovedSegmentIndex];
      if (seamRange && seamRange.end > seamRange.start) {
        skipStart = seamRange.start;
        skipEnd = seamRange.end;
      }
    }

    return {
      skipStart,
      skipEnd,
      orderStart: anchorOrder.length ? anchorOrder[0] : -1,
      orderEnd: anchorOrder.length ? anchorOrder[anchorOrder.length - 1] : -1,
      orderCount: anchorOrder.length,
      maxOrthDot,
      maxHandleLenErrorPx,
      minAdjacentAnchorPx,
      adjacentClosePairCount
    };
  }

  computeArcTable(curve, arcOut) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    arcOut[0] = 0;
    let acc = 0;
    for (let i = 1; i < this.n; i += 1) {
      const k0 = (i - 1) * 2;
      const k1 = i * 2;
      const dx = (curve[k1] - curve[k0]) * cw;
      const dy = (curve[k1 + 1] - curve[k0 + 1]) * ch;
      acc += Math.hypot(dx, dy);
      arcOut[i] = acc;
    }
    return acc;
  }

  buildMarkerTravelState(source, baseline, normals, arcTable, crests, troughs) {
    const states = [];
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const pushIdx = (idx) => {
      const i = Math.max(0, Math.min(this.n - 1, idx | 0));
      const k = i * 2;
      const rx = (source[k] - baseline[k]) * cw;
      const ry = (source[k + 1] - baseline[k + 1]) * ch;
      const d = rx * normals[k] + ry * normals[k + 1];
      states.push({ u0: arcTable[i], d });
    };

    for (const idx of crests) {
      pushIdx(idx);
    }
    for (const idx of troughs) {
      pushIdx(idx);
    }

    states.sort((a, b) => a.u0 - b.u0);
    return states;
  }

  wrapArc(arc, total) {
    if (total <= 1e-6) {
      return 0;
    }
    return ((arc % total) + total) % total;
  }

  lowerBoundArc(arcTable, target) {
    let lo = 0;
    let hi = this.n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arcTable[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  sampleFloat2AtArc(buffer, arcTable, targetArc) {
    if (this.n <= 1) {
      return { x: buffer[0] || 0, y: buffer[1] || 0 };
    }

    if (targetArc <= 0) {
      return { x: buffer[0], y: buffer[1] };
    }

    const endArc = arcTable[this.n - 1];
    if (targetArc >= endArc) {
      const last = (this.n - 1) * 2;
      return { x: buffer[last], y: buffer[last + 1] };
    }

    const i1 = this.lowerBoundArc(arcTable, targetArc);
    const i0 = Math.max(0, i1 - 1);
    const a0 = arcTable[i0];
    const a1 = arcTable[i1];
    const t = clamp((targetArc - a0) / Math.max(1e-6, a1 - a0), 0, 1);
    const k0 = i0 * 2;
    const k1 = i1 * 2;
    return {
      x: lerp(buffer[k0], buffer[k1], t),
      y: lerp(buffer[k0 + 1], buffer[k1 + 1], t)
    };
  }

  sampleFrameAtArc(curve, arcTable, targetArc) {
    if (this.n <= 1) {
      return {
        x: curve[0] || 0,
        y: curve[1] || 0,
        tx: 1,
        ty: 0,
        nx: 0,
        ny: 1
      };
    }

    const endArc = arcTable[this.n - 1];
    const arc = clamp(targetArc, 0, endArc);
    const i1 = arc <= 0 ? 1 : arc >= endArc ? this.n - 1 : this.lowerBoundArc(arcTable, arc);
    const i0 = Math.max(0, i1 - 1);

    const a0 = arcTable[i0];
    const a1 = arcTable[i1];
    const t = clamp((arc - a0) / Math.max(1e-6, a1 - a0), 0, 1);
    const k0 = i0 * 2;
    const k1 = i1 * 2;
    const x = lerp(curve[k0], curve[k1], t);
    const y = lerp(curve[k0 + 1], curve[k1 + 1], t);

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let dx = (curve[k1] - curve[k0]) * cw;
    let dy = (curve[k1 + 1] - curve[k0 + 1]) * ch;
    let len = Math.hypot(dx, dy);

    if (len < 1e-6) {
      for (let step = 1; step < this.n && len < 1e-6; step += 1) {
        const rightSeg = i1 - 1 + step;
        const leftSeg = i0 - step;

        if (rightSeg >= 0 && rightSeg < this.n - 1) {
          const rk0 = rightSeg * 2;
          const rk1 = (rightSeg + 1) * 2;
          dx = (curve[rk1] - curve[rk0]) * cw;
          dy = (curve[rk1 + 1] - curve[rk0 + 1]) * ch;
          len = Math.hypot(dx, dy);
        }
        if (len >= 1e-6) {
          break;
        }

        if (leftSeg >= 0 && leftSeg < this.n - 1) {
          const lk0 = leftSeg * 2;
          const lk1 = (leftSeg + 1) * 2;
          dx = (curve[lk1] - curve[lk0]) * cw;
          dy = (curve[lk1 + 1] - curve[lk0 + 1]) * ch;
          len = Math.hypot(dx, dy);
        }
      }
    }

    if (len < 1e-6) {
      dx = 1;
      dy = 0;
      len = 1;
    }

    const tx = dx / len;
    const ty = dy / len;
    return {
      x,
      y,
      tx,
      ty,
      nx: -ty,
      ny: tx
    };
  }

  sampleNormalAtArc(normals, arcTable, targetArc) {
    const sampled = this.sampleFloat2AtArc(normals, arcTable, targetArc);
    const len = Math.max(1e-6, Math.hypot(sampled.x, sampled.y));
    return { x: sampled.x / len, y: sampled.y / len };
  }

  copyMarkerPositions(source, target) {
    if (!source.length || !target.length) {
      return;
    }
    const count = Math.min(source.length, target.length);
    target.set(source.subarray(0, count), 0);
  }

  updateTravelMarkers() {
    this.copyMarkerPositions(this.constraintAnchorA, this.markerPosA);
    this.copyMarkerPositions(this.constraintAnchorB, this.markerPosB);
    this.copyMarkerPositions(this.constraintSecondaryAnchorA, this.markerPosSecondaryA);
    this.copyMarkerPositions(this.constraintSecondaryAnchorB, this.markerPosSecondaryB);
  }

  updateTravelWaves(dtSeconds = 0) {
    this.applyBaselineAInteractiveMorph();
    this.applyBaselineBArcEditState();

    if (this.cubicOrigA.length && this.anchorStateA.length) {
      const seamA = this.writeMovedCubicWave(
        this.cubicOrigA,
        this.cubicMovedA,
        this.anchorStateA,
        this.baseA,
        this.baseNormA,
        this.baseArcA,
        this.baseArcLenA,
        this.travelArcA,
        this.waveTravelA,
        this.constraintBaseA,
        this.constraintAnchorA,
        {
          enforcePeriodicEdgeTangents: true,
          adjustFirstAnchorByNeighbors: true,
          preserveIndexOrder: false,
          breakRenderSeam: false,
          outTangentOut: this.constraintHandleOutA,
          outTangentIn: this.constraintHandleInA
        }
      );
      this.waveSkipAStart = seamA.skipStart;
      this.waveSkipAEnd = seamA.skipEnd;
      this.waveOrderAStart = seamA.orderStart;
      this.waveOrderAEnd = seamA.orderEnd;
      this.waveOrderACount = seamA.orderCount;
      this.constraintOrthDotA = seamA.maxOrthDot;
      this.handleLenErrorPxA = seamA.maxHandleLenErrorPx;
      this.adjMinPxA = seamA.minAdjacentAnchorPx;
      this.adjClosePairsA = seamA.adjacentClosePairCount;
    } else {
      this.writeTravelWave(
        this.baseA,
        this.baseNormA,
        this.baseArcA,
        this.baseArcLenA,
        this.waveArcU0A,
        this.waveDispA,
        this.travelArcA,
        this.waveTravelA
      );
      this.waveSkipAStart = -1;
      this.waveSkipAEnd = -1;
      this.waveOrderAStart = -1;
      this.waveOrderAEnd = -1;
      this.waveOrderACount = 0;
      this.constraintOrthDotA = 0;
      this.handleLenErrorPxA = 0;
      this.adjMinPxA = Infinity;
      this.adjClosePairsA = 0;
    }

    if (this.cubicOrigB.length && this.anchorStateB.length) {
      const seamB = this.writeMovedCubicWave(
        this.cubicOrigB,
        this.cubicMovedB,
        this.anchorStateB,
        this.baseB,
        this.baseNormB,
        this.baseArcB,
        this.baseArcLenB,
        this.travelArcB,
        this.waveTravelB,
        this.constraintBaseB,
        this.constraintAnchorB,
        {
          enforcePeriodicEdgeTangents: true,
          adjustFirstAnchorByNeighbors: true,
          preserveIndexOrder: false,
          breakRenderSeam: false,
          outTangentOut: this.constraintHandleOutB,
          outTangentIn: this.constraintHandleInB
        }
      );
      this.waveSkipBStart = seamB.skipStart;
      this.waveSkipBEnd = seamB.skipEnd;
      this.waveOrderBStart = seamB.orderStart;
      this.waveOrderBEnd = seamB.orderEnd;
      this.waveOrderBCount = seamB.orderCount;
      this.constraintOrthDotB = seamB.maxOrthDot;
      this.handleLenErrorPxB = seamB.maxHandleLenErrorPx;
      this.adjMinPxB = seamB.minAdjacentAnchorPx;
      this.adjClosePairsB = seamB.adjacentClosePairCount;
    } else {
      this.writeTravelWave(
        this.baseB,
        this.baseNormB,
        this.baseArcB,
        this.baseArcLenB,
        this.waveArcU0B,
        this.waveDispB,
        this.travelArcB,
        this.waveTravelB
      );
      this.waveSkipBStart = -1;
      this.waveSkipBEnd = -1;
      this.waveOrderBStart = -1;
      this.waveOrderBEnd = -1;
      this.waveOrderBCount = 0;
      this.constraintOrthDotB = 0;
      this.handleLenErrorPxB = 0;
      this.adjMinPxB = Infinity;
      this.adjClosePairsB = 0;
    }

    // Seam-invariant blend source curves: sample by stable arc material coordinate (u0)
    // instead of dynamic seam/index ordering used by moved cubic rendering.
    this.writeTravelWave(
      this.baseA,
      this.baseNormA,
      this.baseArcA,
      this.baseArcLenA,
      this.waveArcU0A,
      this.waveDispA,
      this.travelArcA,
      this.waveStableA
    );
    this.writeTravelWave(
      this.baseB,
      this.baseNormB,
      this.baseArcB,
      this.baseArcLenB,
      this.waveArcU0B,
      this.waveDispB,
      this.travelArcB,
      this.waveStableB
    );
    this.updateBlendMapTransitions(dtSeconds);
    this.buildIntermediatePocCurveFromMovedCubic(dtSeconds);

    if (this.cubicSecondaryA.length && this.anchorSecondaryStateA.length) {
      const seamSecondaryA = this.writeMovedCubicWave(
        this.cubicSecondaryA,
        this.cubicSecondaryMovedA,
        this.anchorSecondaryStateA,
        this.baseSecondaryA,
        this.baseSecondaryNormA,
        this.baseSecondaryArcA,
        this.baseSecondaryArcLenA,
        this.travelArcA,
        this.waveSecondaryTravelA,
        this.constraintSecondaryBaseA,
        this.constraintSecondaryAnchorA,
        { mergeLastAnchorWithFirst: this.mergeSecondaryAEndpoints }
      );
      this.waveSecondarySkipAStart = seamSecondaryA.skipStart;
      this.waveSecondarySkipAEnd = seamSecondaryA.skipEnd;
      this.adjMinPxSecondaryA = seamSecondaryA.minAdjacentAnchorPx;
      this.adjClosePairsSecondaryA = seamSecondaryA.adjacentClosePairCount;
    } else {
      this.writeTravelWave(
        this.baseSecondaryA,
        this.baseSecondaryNormA,
        this.baseSecondaryArcA,
        this.baseSecondaryArcLenA,
        this.waveSecondaryArcU0A,
        this.waveSecondaryDispA,
        this.travelArcA,
        this.waveSecondaryTravelA
      );
      this.waveSecondarySkipAStart = -1;
      this.waveSecondarySkipAEnd = -1;
      this.adjMinPxSecondaryA = Infinity;
      this.adjClosePairsSecondaryA = 0;
    }

    if (this.cubicSecondaryB.length && this.anchorSecondaryStateB.length) {
      const seamSecondaryB = this.writeMovedCubicWave(
        this.cubicSecondaryB,
        this.cubicSecondaryMovedB,
        this.anchorSecondaryStateB,
        this.baseSecondaryB,
        this.baseSecondaryNormB,
        this.baseSecondaryArcB,
        this.baseSecondaryArcLenB,
        this.travelArcB,
        this.waveSecondaryTravelB,
        this.constraintSecondaryBaseB,
        this.constraintSecondaryAnchorB,
        {
          mergeLastAnchorWithFirst: this.mergeSecondaryBEndpoints,
          enforcePeriodicEdgeTangents: this.enableSecondaryBReplicas
        }
      );
      this.waveSecondarySkipBStart = seamSecondaryB.skipStart;
      this.waveSecondarySkipBEnd = seamSecondaryB.skipEnd;
      this.adjMinPxSecondaryB = seamSecondaryB.minAdjacentAnchorPx;
      this.adjClosePairsSecondaryB = seamSecondaryB.adjacentClosePairCount;
    } else {
      this.writeTravelWave(
        this.baseSecondaryB,
        this.baseSecondaryNormB,
        this.baseSecondaryArcB,
        this.baseSecondaryArcLenB,
        this.waveSecondaryArcU0B,
        this.waveSecondaryDispB,
        this.travelArcB,
        this.waveSecondaryTravelB
      );
      this.waveSecondarySkipBStart = -1;
      this.waveSecondarySkipBEnd = -1;
      this.adjMinPxSecondaryB = Infinity;
      this.adjClosePairsSecondaryB = 0;
    }

  }

  writeTravelMarkers(states, baseline, normals, arcTable, totalArc, arcOffset, out) {
    if (!states.length || !out.length) {
      return;
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      const u = this.wrapArc(state.u0 + arcOffset, totalArc);
      const frame = this.sampleFrameAtArc(baseline, arcTable, u);
      const k = i * 2;
      out[k] = frame.x + (frame.nx * state.d) / cw;
      out[k + 1] = frame.y + (frame.ny * state.d) / ch;
    }
  }

  writeTravelWave(baseline, normals, arcTable, totalArc, arcU0, displacements, arcOffset, out) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    for (let i = 0; i < this.n; i += 1) {
      const u = this.wrapArc(arcU0[i] + arcOffset, totalArc);
      const frame = this.sampleFrameAtArc(baseline, arcTable, u);
      const d = displacements[i];
      const k = i * 2;
      out[k] = frame.x + (frame.nx * d) / cw;
      out[k + 1] = frame.y + (frame.ny * d) / ch;
    }
  }

  startAnimation() {
    const tick = (timeMs) => {
      if (!this.lastFrameTimeMs) {
        this.lastFrameTimeMs = timeMs;
      }
      const dt = Math.min(0.05, (timeMs - this.lastFrameTimeMs) * 0.001);
      this.lastFrameTimeMs = timeMs;

      this.advanceMotionByDeltaSeconds(dt, false);
      if (this.hudVisible && (this.hudTickCounter++ & 15) === 0) {
        this.updateHud();
      }
      this.frameHandle = window.requestAnimationFrame(tick);
    };

    if (this.frameHandle) {
      window.cancelAnimationFrame(this.frameHandle);
    }
    this.lastFrameTimeMs = 0;
    this.frameHandle = window.requestAnimationFrame(tick);
  }

  ensureVertexCapacity(minFloats) {
    if (this.vertexData.length >= minFloats) {
      return;
    }

    let size = this.vertexData.length;
    while (size < minFloats) {
      size *= 2;
    }

    this.vertexData = new Float32Array(size);
  }

  writeVertex(ptr, x, y, r, g, b, a) {
    this.vertexData[ptr++] = x * 2 - 1;
    this.vertexData[ptr++] = 1 - y * 2;
    this.vertexData[ptr++] = r;
    this.vertexData[ptr++] = g;
    this.vertexData[ptr++] = b;
    this.vertexData[ptr++] = a;
    return ptr;
  }

  pushSegment(ptr, x0, y0, x1, y1, widthPx, color) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const x0p = x0 * cw;
    const y0p = y0 * ch;
    const x1p = x1 * cw;
    const y1p = y1 * ch;

    const dx = x1p - x0p;
    const dy = y1p - y0p;
    const len = Math.hypot(dx, dy);

    if (len < 1e-6) {
      return ptr;
    }

    const nx = -dy / len;
    const ny = dx / len;
    const half = widthPx * 0.5;

    const ox = (nx * half) / cw;
    const oy = (ny * half) / ch;

    const l0x = x0 + ox;
    const l0y = y0 + oy;
    const r0x = x0 - ox;
    const r0y = y0 - oy;
    const l1x = x1 + ox;
    const l1y = y1 + oy;
    const r1x = x1 - ox;
    const r1y = y1 - oy;

    ptr = this.writeVertex(ptr, l0x, l0y, color[0], color[1], color[2], color[3]);
    ptr = this.writeVertex(ptr, r0x, r0y, color[0], color[1], color[2], color[3]);
    ptr = this.writeVertex(ptr, l1x, l1y, color[0], color[1], color[2], color[3]);

    ptr = this.writeVertex(ptr, r0x, r0y, color[0], color[1], color[2], color[3]);
    ptr = this.writeVertex(ptr, r1x, r1y, color[0], color[1], color[2], color[3]);
    ptr = this.writeVertex(ptr, l1x, l1y, color[0], color[1], color[2], color[3]);

    return ptr;
  }

  pushPolyline(ptr, curve, widthPx, color) {
    for (let i = 0; i < this.n - 1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      ptr = this.pushSegment(
        ptr,
        curve[k0],
        curve[k0 + 1],
        curve[k1],
        curve[k1 + 1],
        widthPx,
        color
      );
    }
    return ptr;
  }

  pushPolylineBuffer(ptr, curve, widthPx, color) {
    const count = (curve.length / 2) | 0;
    if (count < 2) {
      return ptr;
    }
    for (let i = 0; i < count - 1; i += 1) {
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      ptr = this.pushSegment(
        ptr,
        curve[k0],
        curve[k0 + 1],
        curve[k1],
        curve[k1 + 1],
        widthPx,
        color
      );
    }
    return ptr;
  }

  buildSeamOrderedVisibleChain(curve, skipStart, skipEnd, reverse = false) {
    const count = (curve.length / 2) | 0;
    if (count < 2) {
      return new Float32Array(0);
    }

    const hasSkip = this.hasSkipRange(skipStart, skipEnd);
    let outCount = count;
    if (hasSkip) {
      const start = clamp(skipEnd | 0, 0, count - 1);
      const end = clamp(skipStart | 0, 0, count - 1);
      outCount = Math.max(2, count - Math.max(0, start - end - 1));
    }
    const out = new Float32Array(outCount * 2);
    let write = 0;
    const pushIndex = (index) => {
      if (write >= outCount) {
        return;
      }
      const k = index * 2;
      const w = write * 2;
      out[w] = curve[k];
      out[w + 1] = curve[k + 1];
      write += 1;
    };

    if (!hasSkip) {
      for (let i = 0; i < count; i += 1) {
        pushIndex(i);
      }
    } else {
      const start = clamp(skipEnd | 0, 0, count - 1);
      const end = clamp(skipStart | 0, 0, count - 1);
      for (let i = start; i < count; i += 1) {
        pushIndex(i);
      }
      for (let i = 0; i <= end; i += 1) {
        pushIndex(i);
      }
    }

    if (write < outCount) {
      return out.subarray(0, write * 2);
    }

    if (!reverse) {
      return out;
    }

    const reversed = new Float32Array(out.length);
    for (let i = 0; i < outCount; i += 1) {
      const src = i * 2;
      const dst = (outCount - 1 - i) * 2;
      reversed[dst] = out[src];
      reversed[dst + 1] = out[src + 1];
    }
    return reversed;
  }

  trimChainEndpoints(curve, trimPoints = 1) {
    const count = (curve.length / 2) | 0;
    const trim = Math.max(0, trimPoints | 0);
    const start = Math.min(count - 1, trim);
    const end = Math.max(start + 1, count - trim);
    const nextCount = Math.max(0, end - start);
    const out = new Float32Array(nextCount * 2);
    for (let i = 0; i < nextCount; i += 1) {
      const src = (start + i) * 2;
      const dst = i * 2;
      out[dst] = curve[src];
      out[dst + 1] = curve[src + 1];
    }
    return out;
  }

  float2ToSvgLinePath(curve) {
    const count = (curve.length / 2) | 0;
    if (count < 2) {
      return "";
    }
    let path = `M${curve[0].toFixed(6)},${curve[1].toFixed(6)}`;
    for (let i = 1; i < count; i += 1) {
      const k = i * 2;
      path += `L${curve[k].toFixed(6)},${curve[k + 1].toFixed(6)}`;
    }
    return path;
  }

  parseSvgLinePathToFloat2(pathText, expectedCount = -1) {
    if (!pathText || typeof pathText !== "string") {
      return new Float32Array(0);
    }
    const numbers = pathText.match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
    if (!numbers || numbers.length < 4) {
      return new Float32Array(0);
    }
    const count = Math.floor(numbers.length / 2);
    const out = new Float32Array(count * 2);
    for (let i = 0; i < count; i += 1) {
      const k = i * 2;
      out[k] = Number(numbers[k]);
      out[k + 1] = Number(numbers[k + 1]);
    }
    if (expectedCount > 1 && count !== expectedCount) {
      return resampleOpenFloat2(out, expectedCount);
    }
    return out;
  }

  prepareCenterLockD3Context(
    fromCurve,
    toCurve,
    reverseFrom,
    fromSkipStart,
    fromSkipEnd,
    toSkipStart,
    toSkipEnd
  ) {
    const interpolatePathFn = this.d3InterpolatePath;
    if (typeof interpolatePathFn !== "function") {
      this.centerLockD3LastError = "d3 interpolatePath unavailable";
      return null;
    }

    let fromChain = this.buildSeamOrderedVisibleChain(
      fromCurve,
      fromSkipStart,
      fromSkipEnd,
      reverseFrom
    );
    let toChain = this.buildSeamOrderedVisibleChain(toCurve, toSkipStart, toSkipEnd, false);
    const fromCount = (fromChain.length / 2) | 0;
    const toCount = (toChain.length / 2) | 0;
    if (fromCount < 4 || toCount < 4) {
      this.centerLockD3LastError = "insufficient chain points";
      return null;
    }

    const fullCount = Math.max(4, Math.min(this.n, Math.max(fromCount, toCount)));
    if (fromCount !== fullCount) {
      fromChain = resampleOpenFloat2(fromChain, fullCount);
    }
    if (toCount !== fullCount) {
      toChain = resampleOpenFloat2(toChain, fullCount);
    }

    const fromTrimmed = this.trimChainEndpoints(fromChain, this.centerLockD3TrimPoints);
    const toTrimmed = this.trimChainEndpoints(toChain, this.centerLockD3TrimPoints);
    const trimmedFromCount = (fromTrimmed.length / 2) | 0;
    const trimmedToCount = (toTrimmed.length / 2) | 0;
    if (trimmedFromCount < 2 || trimmedToCount < 2) {
      this.centerLockD3LastError = "trim removed all interior points";
      return null;
    }

    const interiorCount = Math.max(
      16,
      Math.min(this.centerLockD3InteriorSamples, trimmedFromCount, trimmedToCount)
    );
    const fromInterior =
      trimmedFromCount === interiorCount
        ? fromTrimmed
        : resampleOpenFloat2(fromTrimmed, interiorCount);
    const toInterior =
      trimmedToCount === interiorCount ? toTrimmed : resampleOpenFloat2(toTrimmed, interiorCount);

    const fromPath = this.float2ToSvgLinePath(fromInterior);
    const toPath = this.float2ToSvgLinePath(toInterior);
    if (!fromPath || !toPath) {
      this.centerLockD3LastError = "failed to build d3 line paths";
      return null;
    }

    try {
      this.centerLockD3LastError = "";
      return {
        interpolator: interpolatePathFn(fromPath, toPath),
        interiorCount,
        fromStartX: fromChain[0],
        fromStartY: fromChain[1],
        fromEndX: fromChain[fromChain.length - 2],
        fromEndY: fromChain[fromChain.length - 1],
        toStartX: toChain[0],
        toStartY: toChain[1],
        toEndX: toChain[toChain.length - 2],
        toEndY: toChain[toChain.length - 1]
      };
    } catch (error) {
      this.centerLockD3LastError = String(error?.message || error);
      return null;
    }
  }

  pushCenterLockD3SeamBlend(ptr, context, t, widthPx, color) {
    if (!context || typeof context.interpolator !== "function") {
      return ptr;
    }
    let interior = new Float32Array(0);
    try {
      const pathText = context.interpolator(clamp(t, 0, 1));
      interior = this.parseSvgLinePathToFloat2(pathText, context.interiorCount);
    } catch (error) {
      this.centerLockD3LastError = String(error?.message || error);
      return ptr;
    }

    const interiorCount = (interior.length / 2) | 0;
    if (interiorCount < 2) {
      return ptr;
    }

    const tc = clamp(t, 0, 1);
    const startX = lerp(context.fromStartX, context.toStartX, tc);
    const startY = lerp(context.fromStartY, context.toStartY, tc);
    const endX = lerp(context.fromEndX, context.toEndX, tc);
    const endY = lerp(context.fromEndY, context.toEndY, tc);
    const firstX = interior[0];
    const firstY = interior[1];
    const lastK = (interiorCount - 1) * 2;
    const lastX = interior[lastK];
    const lastY = interior[lastK + 1];

    ptr = this.pushSegment(ptr, startX, startY, firstX, firstY, widthPx, color);
    ptr = this.pushPolylineBuffer(ptr, interior, widthPx, color);
    ptr = this.pushSegment(ptr, lastX, lastY, endX, endY, widthPx, color);
    return ptr;
  }

  isSegmentInSkipRange(segmentIndex, skipStart, skipEnd) {
    return this.hasSkipRange(skipStart, skipEnd) && segmentIndex >= skipStart && segmentIndex < skipEnd;
  }

  wrapSegmentIndex(index, segCount) {
    if (segCount <= 0) {
      return 0;
    }
    return ((index % segCount) + segCount) % segCount;
  }

  alignPeriodic(target, reference, period) {
    if (!Number.isFinite(target) || !Number.isFinite(reference) || period <= 0) {
      return target;
    }
    return target + Math.round((reference - target) / period) * period;
  }

  smoothToward(current, target, alpha = 0.18, maxStep = 0.22) {
    if (!Number.isFinite(current)) {
      return target;
    }
    const desired = lerp(current, target, clamp(alpha, 0, 1));
    const delta = desired - current;
    if (Math.abs(delta) <= maxStep) {
      return desired;
    }
    return current + Math.sign(delta) * maxStep;
  }

  interpolatePrimaryBlendColor(t, out = this.primaryBlendColorScratch) {
    const tc = clamp(t, 0, 1);
    out[0] = lerp(COLORS.primaryB[0], COLORS.primaryA[0], tc);
    out[1] = lerp(COLORS.primaryB[1], COLORS.primaryA[1], tc);
    out[2] = lerp(COLORS.primaryB[2], COLORS.primaryA[2], tc);
    out[3] = lerp(COLORS.primaryB[3], COLORS.primaryA[3], tc);
    return out;
  }

  pushLerpedPolylineSkipRanges(
    ptr,
    fromCurve,
    toCurve,
    t,
    widthPx,
    color,
    fromSkipStart,
    fromSkipEnd,
    toSkipStart,
    toSkipEnd,
    reverseFrom = false
  ) {
    const tc = clamp(t, 0, 1);
    const count = Math.min((fromCurve.length / 2) | 0, (toCurve.length / 2) | 0, this.n);
    const segCount = Math.max(0, count - 1);
    if (segCount <= 0) {
      return ptr;
    }
    for (let i = 0; i < segCount; i += 1) {
      if (this.isSegmentInSkipRange(i, fromSkipStart, fromSkipEnd)) {
        continue;
      }
      if (this.isSegmentInSkipRange(i, toSkipStart, toSkipEnd)) {
        continue;
      }
      const j = reverseFrom ? segCount - 1 - i : i;
      if (this.isSegmentInSkipRange(j, fromSkipStart, fromSkipEnd)) {
        continue;
      }
      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const j0 = j * 2;
      const j1 = (j + 1) * 2;
      const x0 = lerp(fromCurve[j0], toCurve[k0], tc);
      const y0 = lerp(fromCurve[j0 + 1], toCurve[k0 + 1], tc);
      const x1 = lerp(fromCurve[j1], toCurve[k1], tc);
      const y1 = lerp(fromCurve[j1 + 1], toCurve[k1 + 1], tc);
      ptr = this.pushSegment(ptr, x0, y0, x1, y1, widthPx, color);
    }
    return ptr;
  }

  evaluateBlendPhaseScore(
    fromCurve,
    toCurve,
    segCount,
    phase,
    reverseFrom,
    fromSkipStart = -1,
    fromSkipEnd = -1,
    toSkipStart = -1,
    toSkipEnd = -1
  ) {
    if (segCount <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    const step = Math.max(1, Math.floor(segCount / 64));
    let score = 0;
    let samples = 0;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    for (let i = 0; i < segCount; i += step) {
      if (this.isSegmentInSkipRange(i, toSkipStart, toSkipEnd)) {
        continue;
      }
      const mappedBase = reverseFrom ? segCount - 1 - i : i;
      const jFloat = mappedBase + phase;
      const jFloor = Math.floor(jFloat);
      const frac = jFloat - jFloor;
      const jA = this.wrapSegmentIndex(jFloor, segCount);
      const jB = this.wrapSegmentIndex(jFloor + 1, segCount);
      if (this.isSegmentInSkipRange(jA, fromSkipStart, fromSkipEnd)) {
        continue;
      }
      if (this.isSegmentInSkipRange(jB, fromSkipStart, fromSkipEnd)) {
        continue;
      }

      const ak = i * 2;
      const aMidX = 0.5 * (toCurve[ak] + toCurve[ak + 2]);
      const aMidY = 0.5 * (toCurve[ak + 1] + toCurve[ak + 3]);

      const a0 = jA * 2;
      const a1 = (jA + 1) * 2;
      const b0 = jB * 2;
      const b1 = (jB + 1) * 2;
      const bMidAX = 0.5 * (fromCurve[a0] + fromCurve[a1]);
      const bMidAY = 0.5 * (fromCurve[a0 + 1] + fromCurve[a1 + 1]);
      const bMidBX = 0.5 * (fromCurve[b0] + fromCurve[b1]);
      const bMidBY = 0.5 * (fromCurve[b0 + 1] + fromCurve[b1 + 1]);

      const bMidX = lerp(bMidAX, bMidBX, frac);
      const bMidY = lerp(bMidAY, bMidBY, frac);
      const dx = (aMidX - bMidX) * cw;
      const dy = (aMidY - bMidY) * ch;
      score += dx * dx + dy * dy;
      samples += 1;
    }
    if (!samples) {
      return Number.POSITIVE_INFINITY;
    }
    return score / samples;
  }

  getPrimaryFrozenBlendPhase(
    fromCurve,
    toCurve,
    segCount,
    reverseFrom,
    fromSkipStart = -1,
    fromSkipEnd = -1,
    toSkipStart = -1,
    toSkipEnd = -1
  ) {
    if (segCount <= 0) {
      return 0;
    }
    const state = this.primaryBlendFrozenState;
    const needsReset =
      !state.initialized || state.segCount !== segCount || state.reverseFrom !== reverseFrom;
    if (needsReset) {
      const coarseStep = Math.max(1, Math.floor(segCount / 72));
      let bestPhase = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let p = 0; p < segCount; p += coarseStep) {
        const score = this.evaluateBlendPhaseScore(
          fromCurve,
          toCurve,
          segCount,
          p,
          reverseFrom,
          fromSkipStart,
          fromSkipEnd,
          toSkipStart,
          toSkipEnd
        );
        if (score < bestScore) {
          bestScore = score;
          bestPhase = p;
        }
      }
      state.initialized = true;
      state.segCount = segCount;
      state.reverseFrom = reverseFrom;
      state.phase = bestPhase;
      state.target = bestPhase;
      return bestPhase;
    }

    const current = state.phase;
    const offsets = [0, -1, 1, -2, 2, -0.5, 0.5];
    let bestTarget = state.target;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < offsets.length; i += 1) {
      const candidate = current + offsets[i];
      const score = this.evaluateBlendPhaseScore(
        fromCurve,
        toCurve,
        segCount,
        candidate,
        reverseFrom,
        fromSkipStart,
        fromSkipEnd,
        toSkipStart,
        toSkipEnd
      );
      if (score < bestScore) {
        bestScore = score;
        bestTarget = candidate;
      }
    }
    bestTarget = this.alignPeriodic(bestTarget, current, segCount);
    state.target = bestTarget;
    state.phase = this.smoothToward(current, bestTarget, 0.18, 0.24);
    return state.phase;
  }

  pushLerpedPolylineWithPhase(
    ptr,
    fromCurve,
    toCurve,
    t,
    widthPx,
    color,
    phase,
    reverseFrom,
    fromSkipStart = -1,
    fromSkipEnd = -1,
    toSkipStart = -1,
    toSkipEnd = -1
  ) {
    const tc = clamp(t, 0, 1);
    const count = Math.min((fromCurve.length / 2) | 0, (toCurve.length / 2) | 0, this.n);
    const segCount = Math.max(0, count - 1);
    if (segCount <= 0) {
      return ptr;
    }
    for (let i = 0; i < segCount; i += 1) {
      if (this.isSegmentInSkipRange(i, toSkipStart, toSkipEnd)) {
        continue;
      }
      const mappedBase = reverseFrom ? segCount - 1 - i : i;
      const jFloat = mappedBase + phase;
      const jFloor = Math.floor(jFloat);
      const frac = jFloat - jFloor;
      const jA = this.wrapSegmentIndex(jFloor, segCount);
      const jB = this.wrapSegmentIndex(jFloor + 1, segCount);
      if (this.isSegmentInSkipRange(jA, fromSkipStart, fromSkipEnd)) {
        continue;
      }
      if (this.isSegmentInSkipRange(jB, fromSkipStart, fromSkipEnd)) {
        continue;
      }

      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      const a0 = jA * 2;
      const a1 = (jA + 1) * 2;
      const b0 = jB * 2;
      const b1 = (jB + 1) * 2;

      const fromX0 = lerp(fromCurve[a0], fromCurve[b0], frac);
      const fromY0 = lerp(fromCurve[a0 + 1], fromCurve[b0 + 1], frac);
      const fromX1 = lerp(fromCurve[a1], fromCurve[b1], frac);
      const fromY1 = lerp(fromCurve[a1 + 1], fromCurve[b1 + 1], frac);

      const x0 = lerp(fromX0, toCurve[k0], tc);
      const y0 = lerp(fromY0, toCurve[k0 + 1], tc);
      const x1 = lerp(fromX1, toCurve[k1], tc);
      const y1 = lerp(fromY1, toCurve[k1 + 1], tc);
      ptr = this.pushSegment(ptr, x0, y0, x1, y1, widthPx, color);
    }
    return ptr;
  }

  wrapUnit(value) {
    return ((value % 1) + 1) % 1;
  }

  pushArcLengthLerpedPolyline(
    ptr,
    fromCurve,
    toCurve,
    t,
    widthPx,
    color,
    phase,
    reverseFrom,
    fromSkipStart = -1,
    fromSkipEnd = -1,
    toSkipStart = -1,
    toSkipEnd = -1
  ) {
    const tc = clamp(t, 0, 1);
    const count = Math.min((fromCurve.length / 2) | 0, (toCurve.length / 2) | 0, this.n);
    const segCount = Math.max(0, count - 1);
    if (segCount <= 0) {
      return ptr;
    }

    const fromLen = this.computeArcTable(fromCurve, this.primaryBlendArcFrom);
    const toLen = this.computeArcTable(toCurve, this.primaryBlendArcTo);
    if (fromLen <= 1e-6 || toLen <= 1e-6) {
      return ptr;
    }

    const phaseNorm = phase / Math.max(1, segCount);
    for (let i = 0; i < segCount; i += 1) {
      if (this.isSegmentInSkipRange(i, toSkipStart, toSkipEnd)) {
        continue;
      }
      const u0 = i / segCount;
      const u1 = (i + 1) / segCount;

      let uf0 = reverseFrom ? 1 - u0 : u0;
      let uf1 = reverseFrom ? 1 - u1 : u1;
      uf0 = this.wrapUnit(uf0 + phaseNorm);
      uf1 = this.wrapUnit(uf1 + phaseNorm);
      const mappedBase = reverseFrom ? segCount - 1 - i : i;
      const jFloat = mappedBase + phase;
      const jFloor = Math.floor(jFloat);
      const jA = this.wrapSegmentIndex(jFloor, segCount);
      const jB = this.wrapSegmentIndex(jFloor + 1, segCount);
      if (this.isSegmentInSkipRange(jA, fromSkipStart, fromSkipEnd)) {
        continue;
      }
      if (this.isSegmentInSkipRange(jB, fromSkipStart, fromSkipEnd)) {
        continue;
      }

      const fromP0 = this.sampleFloat2AtArc(fromCurve, this.primaryBlendArcFrom, uf0 * fromLen);
      const fromP1 = this.sampleFloat2AtArc(fromCurve, this.primaryBlendArcFrom, uf1 * fromLen);
      const toP0 = this.sampleFloat2AtArc(toCurve, this.primaryBlendArcTo, u0 * toLen);
      const toP1 = this.sampleFloat2AtArc(toCurve, this.primaryBlendArcTo, u1 * toLen);

      const x0 = lerp(fromP0.x, toP0.x, tc);
      const y0 = lerp(fromP0.y, toP0.y, tc);
      const x1 = lerp(fromP1.x, toP1.x, tc);
      const y1 = lerp(fromP1.y, toP1.y, tc);
      ptr = this.pushSegment(ptr, x0, y0, x1, y1, widthPx, color);
    }
    return ptr;
  }

  pushPolylineWithGap(ptr, curve, widthPx, color, gapSegment) {
    for (let i = 0; i < this.n - 1; i += 1) {
      if (i === gapSegment) {
        continue;
      }

      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      ptr = this.pushSegment(
        ptr,
        curve[k0],
        curve[k0 + 1],
        curve[k1],
        curve[k1 + 1],
        widthPx,
        color
      );
    }
    return ptr;
  }

  pushPolylineSkipRange(ptr, curve, widthPx, color, skipStart, skipEnd) {
    const hasSkip = skipStart >= 0 && skipEnd > skipStart;
    for (let i = 0; i < this.n - 1; i += 1) {
      if (hasSkip && i >= skipStart && i < skipEnd) {
        continue;
      }

      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      ptr = this.pushSegment(
        ptr,
        curve[k0],
        curve[k0 + 1],
        curve[k1],
        curve[k1 + 1],
        widthPx,
        color
      );
    }
    return ptr;
  }

  pushPolylineShiftedSkipRange(ptr, curve, widthPx, color, dx, dy, skipStart, skipEnd) {
    const hasSkip = skipStart >= 0 && skipEnd > skipStart;
    for (let i = 0; i < this.n - 1; i += 1) {
      if (hasSkip && i >= skipStart && i < skipEnd) {
        continue;
      }

      const k0 = i * 2;
      const k1 = (i + 1) * 2;
      ptr = this.pushSegment(
        ptr,
        curve[k0] + dx,
        curve[k0 + 1] + dy,
        curve[k1] + dx,
        curve[k1 + 1] + dy,
        widthPx,
        color
      );
    }
    return ptr;
  }

  computeCurveEndpointShift(curve) {
    const count = (curve.length / 2) | 0;
    if (count < 2) {
      return { valid: false, dx: 0, dy: 0 };
    }
    const k0 = 0;
    const k1 = (count - 1) * 2;
    const dx = curve[k0] - curve[k1];
    const dy = curve[k0 + 1] - curve[k1 + 1];
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const lenPx = Math.hypot(dx * cw, dy * ch);
    if (!Number.isFinite(lenPx) || lenPx < 1e-3) {
      return { valid: false, dx: 0, dy: 0 };
    }
    return { valid: true, dx, dy };
  }

  computeAnchorSeamShift(anchorStates, baseline, arcTable, totalArc, arcOffset) {
    if (!Array.isArray(anchorStates) || anchorStates.length < 2) {
      return { valid: false, dx: 0, dy: 0 };
    }
    if (!Number.isFinite(totalArc) || totalArc <= 1e-6) {
      return { valid: false, dx: 0, dy: 0 };
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    let minU = Infinity;
    let maxU = -Infinity;
    let minPos = null;
    let maxPos = null;

    for (let i = 0; i < anchorStates.length; i += 1) {
      const state = anchorStates[i];
      if (!state) {
        continue;
      }
      const u = this.wrapArc(state.u0 + arcOffset, totalArc);
      const frame = this.sampleFrameAtArc(baseline, arcTable, u);
      const x = frame.x + (frame.nx * state.d) / cw;
      const y = frame.y + (frame.ny * state.d) / ch;

      if (u < minU) {
        minU = u;
        minPos = { x, y };
      }
      if (u > maxU) {
        maxU = u;
        maxPos = { x, y };
      }
    }

    if (!minPos || !maxPos) {
      return { valid: false, dx: 0, dy: 0 };
    }

    const dx = minPos.x - maxPos.x;
    const dy = minPos.y - maxPos.y;
    const lenPx = Math.hypot(dx * cw, dy * ch);
    if (!Number.isFinite(lenPx) || lenPx < 1e-3) {
      return { valid: false, dx: 0, dy: 0 };
    }
    return { valid: true, dx, dy };
  }

  resolveSecondaryBReplicaShift() {
    const fromAnchorSeam = this.computeAnchorSeamShift(
      this.anchorSecondaryStateB,
      this.baseSecondaryB,
      this.baseSecondaryArcB,
      this.baseSecondaryArcLenB,
      this.travelArcB
    );
    if (fromAnchorSeam.valid) {
      return { ...fromAnchorSeam, source: "anchor-seam" };
    }

    const fromTravel = this.computeCurveEndpointShift(this.waveSecondaryTravelB);
    if (fromTravel.valid) {
      return { ...fromTravel, source: "travel-endpoints" };
    }

    const fromConstraint = this.computeCurveEndpointShift(this.constraintSecondaryAnchorB);
    if (fromConstraint.valid) {
      return { ...fromConstraint, source: "constraint-endpoints" };
    }

    const fromView = this.computeCurveEndpointShift(this.viewSecondaryB);
    if (fromView.valid) {
      return { ...fromView, source: "view-endpoints" };
    }

    return { valid: false, dx: 0, dy: 0, source: "none" };
  }

  findSeamSegment(arcU0, totalArc, arcOffset) {
    if (totalArc <= 1e-6) {
      return -1;
    }

    const wrapped = this.wrapArc(arcOffset, totalArc);
    if (wrapped <= 1e-6) {
      return -1;
    }

    const split = totalArc - wrapped;
    const firstWrapped = this.lowerBoundArc(arcU0, split);
    return Math.max(0, Math.min(this.n - 2, firstWrapped - 1));
  }

  pushDot(ptr, x, y, radiusPx, color, segments) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const rx = radiusPx / Math.max(1, cw);
    const ry = radiusPx / Math.max(1, ch);
    const segs = Math.max(6, segments | 0);
    const step = (Math.PI * 2) / segs;

    for (let i = 0; i < segs; i += 1) {
      const a0 = i * step;
      const a1 = (i + 1) * step;
      const x0 = x + Math.cos(a0) * rx;
      const y0 = y + Math.sin(a0) * ry;
      const x1 = x + Math.cos(a1) * rx;
      const y1 = y + Math.sin(a1) * ry;

      ptr = this.writeVertex(ptr, x, y, color[0], color[1], color[2], color[3]);
      ptr = this.writeVertex(ptr, x0, y0, color[0], color[1], color[2], color[3]);
      ptr = this.writeVertex(ptr, x1, y1, color[0], color[1], color[2], color[3]);
    }

    return ptr;
  }

  pushDotSetShifted(ptr, points, radiusPx, color, dx, dy) {
    const count = (points.length / 2) | 0;
    for (let p = 0; p < count; p += 1) {
      const i = p * 2;
      ptr = this.pushDot(
        ptr,
        points[i] + dx,
        points[i + 1] + dy,
        radiusPx,
        color,
        CONFIG.stroke.markerSegments
      );
    }
    return ptr;
  }

  pushBaselineAEditGuide(ptr) {
    if (this.baselineAMode !== "arc") {
      return ptr;
    }
    const selected = this.getSelectedBaselineBAnchor();
    if (!selected) {
      return ptr;
    }

    const hx = Math.cos(selected.handleAngle) * selected.handleLen;
    const hy = Math.sin(selected.handleAngle) * selected.handleLen;
    const x0 = selected.x - hx;
    const y0 = selected.y - hy;
    const x1 = selected.x + hx;
    const y1 = selected.y + hy;

    ptr = this.pushSegment(
      ptr,
      x0,
      y0,
      x1,
      y1,
      CONFIG.stroke.constraintWidth,
      COLORS.constraintBasePoint
    );
    ptr = this.pushDot(
      ptr,
      x0,
      y0,
      CONFIG.stroke.baselineAnchorRadiusPx,
      COLORS.constraintBasePoint,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      x1,
      y1,
      CONFIG.stroke.baselineAnchorRadiusPx,
      COLORS.constraintBasePoint,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      selected.x,
      selected.y,
      CONFIG.stroke.baselineAnchorRadiusPx * 1.45,
      COLORS.markerEndpointStart,
      CONFIG.stroke.markerSegments
    );

    return ptr;
  }

  hasSkipRange(skipStart, skipEnd) {
    return skipStart >= 0 && skipEnd > skipStart;
  }

  countGapEndpointMarkers(skipStart, skipEnd) {
    return this.hasSkipRange(skipStart, skipEnd) ? 2 : 0;
  }

  pushGapEndpoints(ptr, curve, skipStart, skipEnd) {
    if (!this.hasSkipRange(skipStart, skipEnd)) {
      return ptr;
    }

    const a = Math.max(0, Math.min(this.n - 1, skipStart | 0));
    const b = Math.max(0, Math.min(this.n - 1, skipEnd | 0));
    const ka = a * 2;
    const kb = b * 2;
    const radius = CONFIG.stroke.markerRadiusPx * 1.75;

    ptr = this.pushDot(
      ptr,
      curve[ka],
      curve[ka + 1],
      radius,
      COLORS.markerEndpointStart,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      curve[kb],
      curve[kb + 1],
      radius,
      COLORS.markerEndpointEnd,
      CONFIG.stroke.markerSegments
    );
    return ptr;
  }

  pushGapEndpointsShifted(ptr, curve, dx, dy, skipStart, skipEnd) {
    if (!this.hasSkipRange(skipStart, skipEnd)) {
      return ptr;
    }

    const a = Math.max(0, Math.min(this.n - 1, skipStart | 0));
    const b = Math.max(0, Math.min(this.n - 1, skipEnd | 0));
    const ka = a * 2;
    const kb = b * 2;
    const radius = CONFIG.stroke.markerRadiusPx * 1.75;

    ptr = this.pushDot(
      ptr,
      curve[ka] + dx,
      curve[ka + 1] + dy,
      radius,
      COLORS.markerEndpointStart,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      curve[kb] + dx,
      curve[kb + 1] + dy,
      radius,
      COLORS.markerEndpointEnd,
      CONFIG.stroke.markerSegments
    );
    return ptr;
  }

  countUniversalEndpointMarkers(points) {
    const count = (points.length / 2) | 0;
    return count >= 2 ? 4 : 0;
  }

  pushUniversalEndpointMarkers(ptr, points) {
    const count = (points.length / 2) | 0;
    if (count < 2) {
      return ptr;
    }

    const startK = 0;
    const endK = (count - 1) * 2;
    const inner = CONFIG.stroke.markerRadiusPx * 1.7;
    const outer = inner * 1.7;

    ptr = this.pushDot(
      ptr,
      points[startK],
      points[startK + 1],
      outer,
      COLORS.markerEndpointOutline,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      points[startK],
      points[startK + 1],
      inner,
      COLORS.markerEndpointStart,
      CONFIG.stroke.markerSegments
    );

    ptr = this.pushDot(
      ptr,
      points[endK],
      points[endK + 1],
      outer,
      COLORS.markerEndpointOutline,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      points[endK],
      points[endK + 1],
      inner,
      COLORS.markerEndpointEnd,
      CONFIG.stroke.markerSegments
    );
    return ptr;
  }

  pushUniversalEndpointMarkersShifted(ptr, points, dx, dy) {
    const count = (points.length / 2) | 0;
    if (count < 2) {
      return ptr;
    }

    const startK = 0;
    const endK = (count - 1) * 2;
    const inner = CONFIG.stroke.markerRadiusPx * 1.7;
    const outer = inner * 1.7;

    ptr = this.pushDot(
      ptr,
      points[startK] + dx,
      points[startK + 1] + dy,
      outer,
      COLORS.markerEndpointOutline,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      points[startK] + dx,
      points[startK + 1] + dy,
      inner,
      COLORS.markerEndpointStart,
      CONFIG.stroke.markerSegments
    );

    ptr = this.pushDot(
      ptr,
      points[endK] + dx,
      points[endK + 1] + dy,
      outer,
      COLORS.markerEndpointOutline,
      CONFIG.stroke.markerSegments
    );
    ptr = this.pushDot(
      ptr,
      points[endK] + dx,
      points[endK + 1] + dy,
      inner,
      COLORS.markerEndpointEnd,
      CONFIG.stroke.markerSegments
    );
    return ptr;
  }

  endpointGapPx(points) {
    const count = (points.length / 2) | 0;
    if (count < 2) {
      return NaN;
    }
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const sx = points[0] * cw;
    const sy = points[1] * ch;
    const ex = points[(count - 1) * 2] * cw;
    const ey = points[(count - 1) * 2 + 1] * ch;
    return Math.hypot(ex - sx, ey - sy);
  }

  countCubicGuideVertices(segments) {
    let cubicCount = 0;
    for (const seg of segments) {
      if (seg.type === "C") {
        cubicCount += 1;
      }
    }

    if (cubicCount === 0) {
      return 0;
    }

    const dotVerts = CONFIG.stroke.markerSegments * 3;
    const guideLineVerts = cubicCount * 2 * 6;
    const controlDotVerts = cubicCount * 2 * dotVerts;
    const anchorDotVerts = (cubicCount + 1) * dotVerts;
    return guideLineVerts + controlDotVerts + anchorDotVerts;
  }

  countConstraintVertices(basePoints) {
    const count = (basePoints.length / 2) | 0;
    if (count <= 0) {
      return 0;
    }
    const dotVerts = CONFIG.stroke.markerSegments * 3;
    const lineVerts = count * 6;
    const baseDotVerts = count * dotVerts;
    return lineVerts + baseDotVerts;
  }

  pushCubicGuides(ptr, segments, lineColor) {
    if (!segments.length) {
      return ptr;
    }

    let anchorHeadDrawn = false;
    for (const seg of segments) {
      if (seg.type !== "C") {
        continue;
      }

      ptr = this.pushSegment(
        ptr,
        seg.p0.x,
        seg.p0.y,
        seg.p1.x,
        seg.p1.y,
        CONFIG.stroke.handleGuideWidth,
        lineColor
      );
      ptr = this.pushSegment(
        ptr,
        seg.p3.x,
        seg.p3.y,
        seg.p2.x,
        seg.p2.y,
        CONFIG.stroke.handleGuideWidth,
        lineColor
      );

      if (!anchorHeadDrawn) {
        ptr = this.pushDot(
          ptr,
          seg.p0.x,
          seg.p0.y,
          CONFIG.stroke.handleAnchorRadiusPx,
          COLORS.handleAnchor,
          CONFIG.stroke.markerSegments
        );
        anchorHeadDrawn = true;
      }

      ptr = this.pushDot(
        ptr,
        seg.p3.x,
        seg.p3.y,
        CONFIG.stroke.handleAnchorRadiusPx,
        COLORS.handleAnchor,
        CONFIG.stroke.markerSegments
      );

      ptr = this.pushDot(
        ptr,
        seg.p1.x,
        seg.p1.y,
        CONFIG.stroke.handleControlRadiusPx,
        COLORS.handleControl,
        CONFIG.stroke.markerSegments
      );
      ptr = this.pushDot(
        ptr,
        seg.p2.x,
        seg.p2.y,
        CONFIG.stroke.handleControlRadiusPx,
        COLORS.handleControl,
        CONFIG.stroke.markerSegments
      );
    }

    return ptr;
  }

  pushConstraintGuides(ptr, basePoints, anchorPoints, lineColor) {
    const count = Math.min((basePoints.length / 2) | 0, (anchorPoints.length / 2) | 0);
    for (let i = 0; i < count; i += 1) {
      const k = i * 2;
      const bx = basePoints[k];
      const by = basePoints[k + 1];
      const ax = anchorPoints[k];
      const ay = anchorPoints[k + 1];

      ptr = this.pushSegment(
        ptr,
        bx,
        by,
        ax,
        ay,
        CONFIG.stroke.constraintWidth,
        lineColor
      );
      ptr = this.pushDot(
        ptr,
        bx,
        by,
        CONFIG.stroke.constraintBaseRadiusPx,
        COLORS.constraintBasePoint,
        CONFIG.stroke.markerSegments
      );
    }
    return ptr;
  }

  countAnchorMappingVertices(pointsA, pointsB) {
    const count = Math.min((pointsA.length / 2) | 0, (pointsB.length / 2) | 0);
    if (count <= 0) {
      return 0;
    }
    const dotVerts = CONFIG.stroke.markerSegments * 3;
    return count * (6 + dotVerts * 2);
  }

  pushAnchorMappingGuides(ptr, pointsA, pointsB, lineColor) {
    const count = Math.min((pointsA.length / 2) | 0, (pointsB.length / 2) | 0);
    for (let i = 0; i < count; i += 1) {
      const k = i * 2;
      const ax = pointsA[k];
      const ay = pointsA[k + 1];
      const bx = pointsB[k];
      const by = pointsB[k + 1];

      ptr = this.pushSegment(
        ptr,
        ax,
        ay,
        bx,
        by,
        CONFIG.stroke.mappingWidth,
        lineColor
      );
      ptr = this.pushDot(
        ptr,
        ax,
        ay,
        CONFIG.stroke.mappingDotRadiusPx,
        COLORS.mappingDotPrimary,
        CONFIG.stroke.markerSegments
      );
      ptr = this.pushDot(
        ptr,
        bx,
        by,
        CONFIG.stroke.mappingDotRadiusPx,
        COLORS.mappingDotSecondary,
        CONFIG.stroke.markerSegments
      );
    }
    return ptr;
  }

  buildVertices() {
    const segs = this.n - 1;
    const activeEnabled = !!this.systemEnabled[this.activeWaveSet];
    const secondaryEnabled = !!this.systemEnabled[this.secondaryWaveSet];
    const primaryBlendWaveCount = Math.max(2, (this.primaryBlendInBetween | 0) + 2);
    const pocIntermediateOnly = !!this.primaryBlendPocIntermediate;
    const hideBlendEndpoints =
      !pocIntermediateOnly && this.hidePrimaryBlendEndpoints && primaryBlendWaveCount > 2;
    const primaryBlendDrawCount = pocIntermediateOnly
      ? 3
      : Math.max(0, primaryBlendWaveCount - (hideBlendEndpoints ? 2 : 0));
    const primaryWaveVerts = activeEnabled ? segs * 6 * primaryBlendDrawCount : 0;
    const secondaryWaveVerts = secondaryEnabled ? segs * 6 * 2 : 0;
    const secondaryBReplicaCopies =
      secondaryEnabled && this.enableSecondaryBReplicas
        ? Math.max(0, this.secondaryBReplicaBeforeCount | 0) + Math.max(0, this.secondaryBReplicaAfterCount | 0)
        : 0;
    let secondaryBReplicaShift = { valid: false, dx: 0, dy: 0 };
    let secondaryBReplicaShiftSource = "none";
    if (secondaryEnabled && this.enableSecondaryBReplicas) {
      const resolved = this.resolveSecondaryBReplicaShift();
      secondaryBReplicaShift = { valid: resolved.valid, dx: resolved.dx, dy: resolved.dy };
      secondaryBReplicaShiftSource = resolved.source || "none";
    }
    this.secondaryBReplicaShift = secondaryBReplicaShift;
    this.secondaryBReplicaShiftSource = secondaryBReplicaShiftSource;
    const secondaryBReplicaVerts = secondaryBReplicaCopies * segs * 6;
    let markerCount = 0;
    if (this.showMarkers && activeEnabled) {
      markerCount += (this.markerPosA.length + this.markerPosB.length) * 0.5;
      markerCount += this.countGapEndpointMarkers(this.waveSkipAStart, this.waveSkipAEnd);
      markerCount += this.countGapEndpointMarkers(this.waveSkipBStart, this.waveSkipBEnd);
      if (this.showBaselines) {
        markerCount += (this.baselineAnchorPointsA.length + this.baselineAnchorPointsB.length) * 0.5;
        markerCount +=
          (this.baselineEdgeIntersectionPointsA.length + this.baselineEdgeIntersectionPointsB.length) * 0.5;
      }
    }
    if (this.showMarkers && secondaryEnabled) {
      markerCount += (this.markerPosSecondaryA.length + this.markerPosSecondaryB.length) * 0.5;
      markerCount += this.countGapEndpointMarkers(this.waveSecondarySkipAStart, this.waveSecondarySkipAEnd);
      markerCount += this.countGapEndpointMarkers(this.waveSecondarySkipBStart, this.waveSecondarySkipBEnd);
      if (secondaryBReplicaCopies > 0 && secondaryBReplicaShift.valid) {
        markerCount += ((this.markerPosSecondaryB.length / 2) | 0) * secondaryBReplicaCopies;
        markerCount +=
          this.countGapEndpointMarkers(this.waveSecondarySkipBStart, this.waveSecondarySkipBEnd) *
          secondaryBReplicaCopies;
      }
    }
    if (this.showMarkers && activeEnabled) {
      markerCount += this.countUniversalEndpointMarkers(this.constraintAnchorA);
      markerCount += this.countUniversalEndpointMarkers(this.constraintAnchorB);
    }
    if (this.showMarkers && secondaryEnabled) {
      markerCount += this.countUniversalEndpointMarkers(this.constraintSecondaryAnchorA);
      markerCount += this.countUniversalEndpointMarkers(this.constraintSecondaryAnchorB);
      if (secondaryBReplicaCopies > 0 && secondaryBReplicaShift.valid) {
        markerCount +=
          this.countUniversalEndpointMarkers(this.constraintSecondaryAnchorB) *
          secondaryBReplicaCopies;
      }
    }
    const markerVerts = markerCount * CONFIG.stroke.markerSegments * 3;
    let baselineVerts = 0;
    if (this.showBaselines && activeEnabled) {
      baselineVerts += segs * 6 * 2;
    }
    if (this.showBaselines && secondaryEnabled) {
      baselineVerts += segs * 6 * 2;
    }
    let guideVerts = 0;
    if (this.showMapping && activeEnabled && secondaryEnabled) {
      guideVerts += this.countAnchorMappingVertices(this.constraintAnchorA, this.mappingSecondaryA);
      guideVerts += this.countAnchorMappingVertices(this.constraintAnchorB, this.mappingSecondaryB);
    }
    if (this.showHandles) {
      if (activeEnabled) {
        guideVerts += this.countCubicGuideVertices(this.cubicMovedA);
        guideVerts += this.countCubicGuideVertices(this.cubicMovedB);
        if (this.primaryBlendPocIntermediate && this.cubicIntermediatePoc.length) {
          guideVerts += this.countCubicGuideVertices(this.cubicIntermediatePoc);
        }
        guideVerts += this.countConstraintVertices(this.constraintBaseA);
        guideVerts += this.countConstraintVertices(this.constraintBaseB);
      }
      if (secondaryEnabled) {
        guideVerts += this.countCubicGuideVertices(this.cubicSecondaryMovedA);
        guideVerts += this.countCubicGuideVertices(this.cubicSecondaryMovedB);
        guideVerts += this.countConstraintVertices(this.constraintSecondaryBaseA);
        guideVerts += this.countConstraintVertices(this.constraintSecondaryBaseB);
      }
    }
    const totalVerts =
      primaryWaveVerts +
      secondaryWaveVerts +
      secondaryBReplicaVerts +
      baselineVerts +
      markerVerts +
      guideVerts +
      256;
    this.ensureVertexCapacity(totalVerts * 6);

    let ptr = 0;
    if (secondaryEnabled) {
      ptr = this.pushPolylineSkipRange(
        ptr,
        this.waveSecondaryTravelA,
        CONFIG.stroke.secondaryWidthA,
        COLORS.secondaryA,
        this.waveSecondarySkipAStart,
        this.waveSecondarySkipAEnd
      );
      ptr = this.pushPolylineSkipRange(
        ptr,
        this.waveSecondaryTravelB,
        CONFIG.stroke.secondaryWidthB,
        COLORS.secondaryB,
        this.waveSecondarySkipBStart,
        this.waveSecondarySkipBEnd
      );
      if (this.enableSecondaryBReplicas && secondaryBReplicaShift.valid) {
        const before = Math.max(0, this.secondaryBReplicaBeforeCount | 0);
        const after = Math.max(0, this.secondaryBReplicaAfterCount | 0);
        for (let i = 1; i <= before; i += 1) {
          ptr = this.pushPolylineShiftedSkipRange(
            ptr,
            this.waveSecondaryTravelB,
            CONFIG.stroke.secondaryWidthB,
            COLORS.secondaryB,
            secondaryBReplicaShift.dx * i,
            secondaryBReplicaShift.dy * i,
            this.waveSecondarySkipBStart,
            this.waveSecondarySkipBEnd
          );
        }
        for (let i = 1; i <= after; i += 1) {
          ptr = this.pushPolylineShiftedSkipRange(
            ptr,
            this.waveSecondaryTravelB,
            CONFIG.stroke.secondaryWidthB,
            COLORS.secondaryB,
            -secondaryBReplicaShift.dx * i,
            -secondaryBReplicaShift.dy * i,
            this.waveSecondarySkipBStart,
            this.waveSecondarySkipBEnd
          );
        }
      }
    }

    if (activeEnabled) {
      const denom = Math.max(1, primaryBlendWaveCount - 1);
      const reverseFromForBlend = this.travelDirectionA * this.travelDirectionB < 0;
      const blendMode = this.primaryBlendMode;
      const rawFromCurve =
        blendMode === BLEND_MODE_SEAM_INVARIANT ? this.waveStableB : this.waveTravelB;
      const rawToCurve =
        blendMode === BLEND_MODE_SEAM_INVARIANT ? this.waveStableA : this.waveTravelA;
      let blendFromCurve = rawFromCurve;
      let blendToCurve = rawToCurve;
      if (blendMode === BLEND_MODE_SEAM_INVARIANT) {
        blendFromCurve = this.waveStableB;
        blendToCurve = this.waveStableA;
      } else if (this.isBlendMapTransitionMode(blendMode)) {
        if (this.blendMapB?.primed) {
          blendFromCurve = this.blendMapB.workCurve;
        }
        if (this.blendMapA?.primed) {
          blendToCurve = this.blendMapA.workCurve;
        }
      }
      const blendSegCount = Math.max(0, this.n - 1);
      const phaseBlendMode =
        blendMode === BLEND_MODE_FROZEN_PHASE || blendMode === BLEND_MODE_ARC_LENGTH;
      const centerLockD3Context =
        blendMode === BLEND_MODE_CENTER_LOCK_D3_SEAM
          ? this.prepareCenterLockD3Context(
              blendFromCurve,
              blendToCurve,
              reverseFromForBlend,
              this.waveSkipBStart,
              this.waveSkipBEnd,
              this.waveSkipAStart,
              this.waveSkipAEnd
            )
          : null;
      const frozenPhase = phaseBlendMode
        ? this.getPrimaryFrozenBlendPhase(
              blendFromCurve,
              blendToCurve,
              blendSegCount,
              reverseFromForBlend,
              this.waveSkipBStart,
              this.waveSkipBEnd,
              this.waveSkipAStart,
              this.waveSkipAEnd
            )
        : 0;
      this.updateBlendDebugProbeMetrics({
        blendMode,
        reverseFrom: reverseFromForBlend,
        phase: frozenPhase,
        rawFromCurve,
        rawToCurve,
        blendFromCurve,
        blendToCurve
      });
      if (pocIntermediateOnly) {
        const widthB = CONFIG.stroke.widthB;
        const widthA = CONFIG.stroke.widthA;
        ptr = this.pushPolylineSkipRange(
          ptr,
          this.waveTravelB,
          widthB,
          this.interpolatePrimaryBlendColor(0),
          this.waveSkipBStart,
          this.waveSkipBEnd
        );
        if (this.intermediatePocAnchorCount >= 2) {
          const midT = 0.5;
          ptr = this.pushPolyline(
            ptr,
            this.waveIntermediatePoc,
            lerp(widthB, widthA, midT),
            this.interpolatePrimaryBlendColor(midT)
          );
        }
        ptr = this.pushPolylineSkipRange(
          ptr,
          this.waveTravelA,
          widthA,
          this.interpolatePrimaryBlendColor(1),
          this.waveSkipAStart,
          this.waveSkipAEnd
        );
      } else {
        for (let i = 0; i < primaryBlendWaveCount; i += 1) {
          if (hideBlendEndpoints && (i === 0 || i === primaryBlendWaveCount - 1)) {
            continue;
          }
          const t = i / denom;
          const color = this.interpolatePrimaryBlendColor(t);
          const width = lerp(CONFIG.stroke.widthB, CONFIG.stroke.widthA, t);
          if (i === 0) {
            ptr = this.pushPolylineSkipRange(
              ptr,
              this.waveTravelB,
              width,
              color,
              this.waveSkipBStart,
              this.waveSkipBEnd
            );
            continue;
          }
          if (i === primaryBlendWaveCount - 1) {
            ptr = this.pushPolylineSkipRange(
              ptr,
              this.waveTravelA,
              width,
              color,
              this.waveSkipAStart,
              this.waveSkipAEnd
            );
            continue;
          }
          if (blendMode === BLEND_MODE_FROZEN_PHASE) {
            ptr = this.pushLerpedPolylineWithPhase(
              ptr,
              blendFromCurve,
              blendToCurve,
              t,
              width,
              color,
              frozenPhase,
              reverseFromForBlend,
              this.waveSkipBStart,
              this.waveSkipBEnd,
              this.waveSkipAStart,
              this.waveSkipAEnd
            );
          } else if (blendMode === BLEND_MODE_ARC_LENGTH) {
            ptr = this.pushArcLengthLerpedPolyline(
              ptr,
              blendFromCurve,
              blendToCurve,
              t,
              width,
              color,
              frozenPhase,
              reverseFromForBlend,
              this.waveSkipBStart,
              this.waveSkipBEnd,
              this.waveSkipAStart,
              this.waveSkipAEnd
            );
          } else if (blendMode === BLEND_MODE_CENTER_LOCK_D3_SEAM) {
            if (centerLockD3Context) {
              ptr = this.pushCenterLockD3SeamBlend(
                ptr,
                centerLockD3Context,
                t,
                width,
                color
              );
            } else {
              ptr = this.pushLerpedPolylineSkipRanges(
                ptr,
                blendFromCurve,
                blendToCurve,
                t,
                width,
                color,
                this.waveSkipBStart,
                this.waveSkipBEnd,
                this.waveSkipAStart,
                this.waveSkipAEnd,
                reverseFromForBlend
              );
            }
          } else if (blendMode === BLEND_MODE_SEAM_INVARIANT) {
            ptr = this.pushLerpedPolylineSkipRanges(
              ptr,
              blendFromCurve,
              blendToCurve,
              t,
              width,
              color,
              -1,
              -1,
              -1,
              -1,
              reverseFromForBlend
            );
          } else {
            ptr = this.pushLerpedPolylineSkipRanges(
              ptr,
              blendFromCurve,
              blendToCurve,
              t,
              width,
              color,
              this.waveSkipBStart,
              this.waveSkipBEnd,
              this.waveSkipAStart,
              this.waveSkipAEnd,
              reverseFromForBlend
            );
          }
        }
      }
    }
    if (this.showBaselines) {
      if (activeEnabled) {
        ptr = this.pushPolyline(ptr, this.baseA, CONFIG.stroke.baselineWidth, COLORS.baseline);
        ptr = this.pushPolyline(ptr, this.baseB, CONFIG.stroke.baselineWidth, COLORS.baseline);
      }
      if (secondaryEnabled) {
        ptr = this.pushPolyline(ptr, this.baseSecondaryA, CONFIG.stroke.baselineWidth, COLORS.baseline);
        ptr = this.pushPolyline(ptr, this.baseSecondaryB, CONFIG.stroke.baselineWidth, COLORS.baseline);
      }
    }

    if (this.showMapping && activeEnabled && secondaryEnabled) {
      ptr = this.pushAnchorMappingGuides(
        ptr,
        this.constraintAnchorA,
        this.mappingSecondaryA,
        COLORS.mappingA
      );
      ptr = this.pushAnchorMappingGuides(
        ptr,
        this.constraintAnchorB,
        this.mappingSecondaryB,
        COLORS.mappingB
      );
    }

    if (this.showHandles) {
      if (activeEnabled) {
        ptr = this.pushCubicGuides(ptr, this.cubicMovedA, COLORS.handleGuideA);
        ptr = this.pushCubicGuides(ptr, this.cubicMovedB, COLORS.handleGuideB);
        if (this.primaryBlendPocIntermediate && this.cubicIntermediatePoc.length) {
          ptr = this.pushCubicGuides(ptr, this.cubicIntermediatePoc, [1.0, 0.98, 0.72, 0.72]);
        }
        ptr = this.pushConstraintGuides(
          ptr,
          this.constraintBaseA,
          this.constraintAnchorA,
          COLORS.constraintLineA
        );
        ptr = this.pushConstraintGuides(
          ptr,
          this.constraintBaseB,
          this.constraintAnchorB,
          COLORS.constraintLineB
        );
      }
      if (secondaryEnabled) {
        ptr = this.pushCubicGuides(ptr, this.cubicSecondaryMovedA, COLORS.secondaryA);
        ptr = this.pushCubicGuides(ptr, this.cubicSecondaryMovedB, COLORS.secondaryB);
        ptr = this.pushConstraintGuides(
          ptr,
          this.constraintSecondaryBaseA,
          this.constraintSecondaryAnchorA,
          COLORS.secondaryA
        );
        ptr = this.pushConstraintGuides(
          ptr,
          this.constraintSecondaryBaseB,
          this.constraintSecondaryAnchorB,
          COLORS.secondaryB
        );
      }
    }

    if (this.showMarkers) {
      if (activeEnabled) {
        const countA = (this.markerPosA.length / 2) | 0;
        for (let p = 0; p < countA; p += 1) {
          const i = p * 2;
          ptr = this.pushDot(
            ptr,
            this.markerPosA[i],
            this.markerPosA[i + 1],
            CONFIG.stroke.markerRadiusPx,
            COLORS.markerA,
            CONFIG.stroke.markerSegments
          );
        }
        const countB = (this.markerPosB.length / 2) | 0;
        for (let p = 0; p < countB; p += 1) {
          const i = p * 2;
          ptr = this.pushDot(
            ptr,
            this.markerPosB[i],
            this.markerPosB[i + 1],
            CONFIG.stroke.markerRadiusPx,
            COLORS.markerB,
            CONFIG.stroke.markerSegments
          );
        }
        ptr = this.pushGapEndpoints(
          ptr,
          this.waveTravelA,
          this.waveSkipAStart,
          this.waveSkipAEnd
        );
        ptr = this.pushGapEndpoints(
          ptr,
          this.waveTravelB,
          this.waveSkipBStart,
          this.waveSkipBEnd
        );
        if (this.showBaselines) {
          ptr = this.pushDotSetShifted(
            ptr,
            this.baselineAnchorPointsA,
            CONFIG.stroke.baselineAnchorRadiusPx,
            COLORS.baselineAnchorPoint,
            0,
            0
          );
          ptr = this.pushDotSetShifted(
            ptr,
            this.baselineAnchorPointsB,
            CONFIG.stroke.baselineAnchorRadiusPx,
            COLORS.baselineAnchorPoint,
            0,
            0
          );
          ptr = this.pushDotSetShifted(
            ptr,
            this.baselineEdgeIntersectionPointsA,
            CONFIG.stroke.baselineEdgeIntersectionRadiusPx,
            COLORS.baselineEdgeIntersection,
            0,
            0
          );
          ptr = this.pushDotSetShifted(
            ptr,
            this.baselineEdgeIntersectionPointsB,
            CONFIG.stroke.baselineEdgeIntersectionRadiusPx,
            COLORS.baselineEdgeIntersection,
            0,
            0
          );
          ptr = this.pushBaselineAEditGuide(ptr);
        }
      }
      if (secondaryEnabled) {
        const countSecondaryA = (this.markerPosSecondaryA.length / 2) | 0;
        for (let p = 0; p < countSecondaryA; p += 1) {
          const i = p * 2;
          ptr = this.pushDot(
            ptr,
            this.markerPosSecondaryA[i],
            this.markerPosSecondaryA[i + 1],
            CONFIG.stroke.markerRadiusPx,
            COLORS.markerSecondaryA,
            CONFIG.stroke.markerSegments
          );
        }
        const countSecondaryB = (this.markerPosSecondaryB.length / 2) | 0;
        for (let p = 0; p < countSecondaryB; p += 1) {
          const i = p * 2;
          ptr = this.pushDot(
            ptr,
            this.markerPosSecondaryB[i],
            this.markerPosSecondaryB[i + 1],
            CONFIG.stroke.markerRadiusPx,
            COLORS.markerSecondaryB,
            CONFIG.stroke.markerSegments
          );
        }
        if (this.enableSecondaryBReplicas && secondaryBReplicaShift.valid) {
          const before = Math.max(0, this.secondaryBReplicaBeforeCount | 0);
          const after = Math.max(0, this.secondaryBReplicaAfterCount | 0);
          for (let i = 1; i <= before; i += 1) {
            ptr = this.pushDotSetShifted(
              ptr,
              this.markerPosSecondaryB,
              CONFIG.stroke.markerRadiusPx,
              COLORS.markerSecondaryB,
              secondaryBReplicaShift.dx * i,
              secondaryBReplicaShift.dy * i
            );
            ptr = this.pushGapEndpointsShifted(
              ptr,
              this.waveSecondaryTravelB,
              secondaryBReplicaShift.dx * i,
              secondaryBReplicaShift.dy * i,
              this.waveSecondarySkipBStart,
              this.waveSecondarySkipBEnd
            );
          }
          for (let i = 1; i <= after; i += 1) {
            ptr = this.pushDotSetShifted(
              ptr,
              this.markerPosSecondaryB,
              CONFIG.stroke.markerRadiusPx,
              COLORS.markerSecondaryB,
              -secondaryBReplicaShift.dx * i,
              -secondaryBReplicaShift.dy * i
            );
            ptr = this.pushGapEndpointsShifted(
              ptr,
              this.waveSecondaryTravelB,
              -secondaryBReplicaShift.dx * i,
              -secondaryBReplicaShift.dy * i,
              this.waveSecondarySkipBStart,
              this.waveSecondarySkipBEnd
            );
          }
        }
        ptr = this.pushGapEndpoints(
          ptr,
          this.waveSecondaryTravelA,
          this.waveSecondarySkipAStart,
          this.waveSecondarySkipAEnd
        );
        ptr = this.pushGapEndpoints(
          ptr,
          this.waveSecondaryTravelB,
          this.waveSecondarySkipBStart,
          this.waveSecondarySkipBEnd
        );
      }
    }

    if (this.showMarkers) {
      if (activeEnabled) {
        ptr = this.pushUniversalEndpointMarkers(ptr, this.constraintAnchorA);
        ptr = this.pushUniversalEndpointMarkers(ptr, this.constraintAnchorB);
      }
      if (secondaryEnabled) {
        ptr = this.pushUniversalEndpointMarkers(ptr, this.constraintSecondaryAnchorA);
        ptr = this.pushUniversalEndpointMarkers(ptr, this.constraintSecondaryAnchorB);
        if (this.enableSecondaryBReplicas && secondaryBReplicaShift.valid) {
          const before = Math.max(0, this.secondaryBReplicaBeforeCount | 0);
          const after = Math.max(0, this.secondaryBReplicaAfterCount | 0);
          for (let i = 1; i <= before; i += 1) {
            ptr = this.pushUniversalEndpointMarkersShifted(
              ptr,
              this.constraintSecondaryAnchorB,
              secondaryBReplicaShift.dx * i,
              secondaryBReplicaShift.dy * i
            );
          }
          for (let i = 1; i <= after; i += 1) {
            ptr = this.pushUniversalEndpointMarkersShifted(
              ptr,
              this.constraintSecondaryAnchorB,
              -secondaryBReplicaShift.dx * i,
              -secondaryBReplicaShift.dy * i
            );
          }
        }
      }
    }

    this.vertexCount = ptr / 6;
  }

  render() {
    const gl = this.gl;
    const width = this.canvas.width;
    const height = this.canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.vertexCount > 0) {
      this.configurePrimaryAttributes();
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.subarray(0, this.vertexCount * 6), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    this.renderPixiZoomOverlay();

    if (this.vertexCount <= 0) {
      this.clearAnchorLabels();
      return;
    }

    this.drawAnchorLabels();
  }

  updateHud(extraMessage) {
    if (!this.hud) {
      return;
    }

    if (!this.hudVisible) {
      this.hud.hidden = true;
      return;
    }

    this.hud.hidden = false;
    const suffix = this.getProfileSuffix();

    const gTop = this.layout[`top${suffix}`];
    const gSx = this.layout[`scaleX${suffix}`];
    const gSy = this.layout[`scaleY${suffix}`];

    const aX = this.layout.waveA[`xOffset${suffix}`];
    const aY = this.layout.waveA[`yOffset${suffix}`];
    const aScaleX = Number(this.layout.waveA[`scaleX${suffix}`] || 1);
    const aScaleY = Number(this.layout.waveA[`scaleY${suffix}`] || 1);
    const aRot = Number(this.layout.waveA[`rotation${suffix}`] || 0);
    const bX = this.layout.waveB[`xOffset${suffix}`];
    const bY = this.layout.waveB[`yOffset${suffix}`];
    const bScaleX = Number(this.layout.waveB[`scaleX${suffix}`] || 1);
    const bScaleY = Number(this.layout.waveB[`scaleY${suffix}`] || 1);
    const bRot = Number(this.layout.waveB[`rotation${suffix}`] || 0);
    const fmt = (v) => Number(v).toFixed(4);
    const fmtExp = (v) => Number(v).toExponential(2);
    const fmtPx = (v) => (Number.isFinite(v) ? `${Number(v).toFixed(3)}px` : "n/a");
    const overlayKey = this.overlayLoadedBySet.key ? "loaded" : "missing";
    const keyAnchorA = this.countAnchorPointsFromSegmentList(this.cubicSegments?.key?.waveA);
    const keyAnchorB = this.countAnchorPointsFromSegmentList(this.cubicSegments?.key?.waveB);
    const baselineKeyA = this.baselineAnchorCountA;
    const baselineKeyB = this.baselineAnchorCountB;
    const intersectionA = this.baselineEdgeIntersectionDetailsA || [];
    const intersectionB = this.baselineEdgeIntersectionDetailsB || [];
    const activeMarkerA = (this.markerPosA.length / 2) | 0;
    const activeMarkerB = (this.markerPosB.length / 2) | 0;
    const activeConstraintA = (this.constraintAnchorA.length / 2) | 0;
    const activeConstraintB = (this.constraintAnchorB.length / 2) | 0;
    const endpointGapActiveA = this.endpointGapPx(this.constraintAnchorA);
    const endpointGapActiveB = this.endpointGapPx(this.constraintAnchorB);
    const fmtIntersections = (entries, prefix) => {
      if (!entries.length) {
        return "none";
      }
      return entries
        .map(
          (p, i) =>
            `${prefix}${i} ${p.edges.join("")} (${fmt(p.x)}, ${fmt(p.y)})`
        )
        .join(" | ");
    };
    const selectedAnchor = this.getSelectedBaselineBAnchor();
    const selectedAnchorInfo = selectedAnchor
      ? `selected BB${this.baselineBSelectedAnchor}/${Math.max(0, this.baselineBArcAnchors.length - 1)} x ${fmt(selectedAnchor.x)} y ${fmt(selectedAnchor.y)} handle ${((selectedAnchor.handleAngle * 180) / Math.PI).toFixed(2)}deg`
      : "selected BB n/a";
    const pivotInfoA =
      this.baselineAPivotIndex >= 0
        ? `pivot BA${this.baselineAPivotIndex} strength ${(this.baselineAPivotStrength * 100).toFixed(1)} tr ${(this.baselineAPivotTransitionT * 100).toFixed(0)}% edge d ${this.baselineAPivotEllipseDistance.toFixed(3)} center d ${this.baselineAPivotCenterDistancePx.toFixed(1)}px`
        : "pivot BA n/a";
    const pivotInfoB =
      this.baselineBPivotIndex >= 0
        ? `pivot BB${this.baselineBPivotIndex} strength ${(this.baselineBPivotStrength * 100).toFixed(1)} tr ${(this.baselineBPivotTransitionT * 100).toFixed(0)}% edge d ${this.baselineBPivotEllipseDistance.toFixed(3)} center d ${this.baselineBPivotCenterDistancePx.toFixed(1)}px`
        : "pivot BB n/a";
    const blurInfo = `pixi zoom blur ${this.pixiZoomEnabled ? "on" : "off"} | ${this.pixiZoomReady ? "ready" : "disabled"} | preserveDB on | center (${fmt(this.zoomBlurCenterXNorm)}, ${fmt(this.zoomBlurCenterYNorm)}) | inner ${Math.round(this.zoomBlurInnerRadiusPx)}px radius ${Math.round(this.zoomBlurRadiusPx)}px strength ${this.zoomBlurStrength.toFixed(3)} kernel ${this.zoomBlurKernelSize}`;
    const blurErrorInfo =
      this.pixiZoomEnabled && !this.pixiZoomReady && this.pixiZoomError
        ? `pixi blur error: ${this.pixiZoomError}`
        : null;
    const blendDirInfo = `blend direction-map ${
      this.travelDirectionA * this.travelDirectionB < 0 ? "reversed-from-B" : "direct"
    }`;
    const blendModeInfo = `blend mode ${this.getPrimaryBlendModeLabel(this.primaryBlendMode)}`;
    const blendD3Info = `blend d3 ${
      this.d3InterpolatePath ? "ready" : "missing"
    } | interior ${this.centerLockD3InteriorSamples} trim ${this.centerLockD3TrimPoints}${
      this.centerLockD3LastError ? ` | err ${this.centerLockD3LastError}` : ""
    }`;
    const blendEndpointInfo = `blend key endpoints ${this.hidePrimaryBlendEndpoints ? "hidden" : "shown"}`;
    const pocTransition = this.intermediatePocTransition;
    const blendPocInfo = `blend PoC intermediate ${this.primaryBlendPocIntermediate ? "on" : "off"} | anchors ${this.intermediatePocAnchorCount} | tr ${pocTransition.active ? "active" : "idle"} ${pocTransition.elapsedSec.toFixed(3)}/${pocTransition.durationSec.toFixed(3)}s starts ${pocTransition.starts} restarts ${pocTransition.restarts}`;
    const blendMapInfo = this.isBlendMapTransitionMode()
      ? `blend map-interp A ${this.blendMapA.active ? "active" : "idle"} ${this.blendMapA.elapsedSec.toFixed(3)}/${this.blendMapA.durationSec.toFixed(3)}s | B ${this.blendMapB.active ? "active" : "idle"} ${this.blendMapB.elapsedSec.toFixed(3)}/${this.blendMapB.durationSec.toFixed(3)}s`
      : null;
    const scrubInfo = `scrub ${this.motionScrubMode ? "on" : "off"} | step ${(this.motionScrubStepSeconds * 1000).toFixed(2)}ms`;
    const blendDebugLines = this.getBlendDebugSectionLines();
    const intermediatePocDebugLines = this.getIntermediatePocDebugLines();
    const intermediateMapLines = this.getIntermediateAnchorMapHudLines(
      activeConstraintA || keyAnchorA,
      activeConstraintB || keyAnchorB
    );

    this.hud.textContent = [
      `Profile: ${suffix}`,
      "wave set key",
      `blend ${Math.max(2, (this.primaryBlendInBetween | 0) + 2)} waves (${Math.max(0, this.primaryBlendInBetween | 0)} in-between)`,
      blendModeInfo,
      blendD3Info,
      blendDirInfo,
      blendEndpointInfo,
      blendPocInfo,
      blendMapInfo,
      blurInfo,
      blurErrorInfo,
      `system key ${this.systemEnabled.key ? "on" : "off"}`,
      `motion ${this.motionPaused ? "paused" : "running"} | speed ${this.motionSpeedPxPerSecond.toFixed(1)} px/s`,
      scrubInfo,
      `rightEdge ${fmt(this.layout.rightEdge)} | top ${fmt(gTop)} | scaleX ${fmt(gSx)} | scaleY ${fmt(gSy)}`,
      `waveA x ${fmt(aX)} y ${fmt(aY)} sx ${fmt(aScaleX)} sy ${fmt(aScaleY)} rot ${aRot.toFixed(2)}deg | waveB x ${fmt(bX)} y ${fmt(bY)} sx ${fmt(bScaleX)} sy ${fmt(bScaleY)} rot ${bRot.toFixed(2)}deg`,
      `baseline B mode ${this.baselineAMode} | smooth ${this.baselineSmooth} | handle ${this.baselineHandle.toFixed(2)}`,
      selectedAnchorInfo,
      `${pivotInfoA} | ${pivotInfoB}`,
      `ellipse rx ${Math.round(this.baselineAEllipseRadiusXPx)} ry ${Math.round(this.baselineAEllipseRadiusYPx)} rot ${this.baselineAEllipseRotationDeg.toFixed(1)}deg | center ${Math.round(this.baselineACenterRadiusPx)}px band ${Math.round(this.baselineAMinGradientBandPx)}px hys ${Math.round(this.baselineAPivotSwitchMarginPx)}px | k ${this.baselineAExpK.toFixed(2)}`,
      `baselines ${this.showBaselines ? "on" : "off"} | markers ${this.showMarkers ? "on" : "off"} | labels ${this.showAnchorLabels ? "on" : "off"} | handle debug ${this.showHandles ? "on" : "off"}`,
      `A orth ${fmtExp(this.constraintOrthDotA)} handle err ${this.handleLenErrorPxA.toFixed(3)}px | B orth ${fmtExp(this.constraintOrthDotB)} handle err ${this.handleLenErrorPxB.toFixed(3)}px`,
      `adjacent anchors key A min ${fmtPx(this.adjMinPxA)} close ${this.adjClosePairsA} | B min ${fmtPx(this.adjMinPxB)} close ${this.adjClosePairsB}`,
      `wave anchors key A ${keyAnchorA} B ${keyAnchorB}`,
      `baseline anchors key A ${baselineKeyA} B ${baselineKeyB}`,
      `baseline-edge intersections A ${intersectionA.length} | B ${intersectionB.length}`,
      `A: ${fmtIntersections(intersectionA, "EA")}`,
      `B: ${fmtIntersections(intersectionB, "EB")}`,
      `anchor markers key A ${activeMarkerA} B ${activeMarkerB}`,
      `endpoint gap key A ${fmtPx(endpointGapActiveA)} B ${fmtPx(endpointGapActiveB)}`,
      `A crests ${this.crestsA.length} troughs ${this.troughsA.length} | B crests ${this.crestsB.length} troughs ${this.troughsB.length}`,
      `overlay key ${overlayKey} | visible ${this.overlayVisible ? "yes" : "no"} | opacity ${fmt(this.overlayOpacity)}`,
      "Keys: Arrows move global placement, Z/X scaleX, C/V scaleY",
      "A/D + W/S move waveA, Q/E rotate waveA, 3/4 A scaleX, 5/6 A scaleY, J/L + I/K move waveB, ;/' rotate waveB, 7/8 B scaleX, 9/0 B scaleY",
      "Baseline B: button toggles current/arc edit, ,/. select anchor, Shift+Arrows move selected anchor, N/M rotate selected handle",
      "T scrub mode, ,/. step back/forward (Shift x8 while scrub is on)",
      "[ ] overlay opacity, O overlay toggle, P pause/resume, F blend mode, B baselines, Y markers, U labels, G handles, 2 key, R reset, H hide HUD",
      extraMessage || `Reference file: key ${REFERENCE_IMAGE_BY_SET.key}`,
      "",
      ...intermediateMapLines,
      "",
      ...intermediatePocDebugLines,
      "",
      ...blendDebugLines
    ]
      .filter(Boolean)
      .join("\n");

    this.updateControlPanelWidthFromHud();
  }

  updateControlPanelWidthFromHud() {
    if (!this.controlPanel || !this.hud || this.hud.hidden) {
      return;
    }

    const hudRect = this.hud.getBoundingClientRect();
    const hudWidth = Math.max(hudRect.width || 0, this.hud.scrollWidth || 0);
    if (!Number.isFinite(hudWidth) || hudWidth <= 0) {
      return;
    }

    const panelWidth = hudWidth / 3;
    const widthPx = `${panelWidth.toFixed(1)}px`;
    this.controlPanel.style.width = widthPx;
    this.controlPanel.style.minWidth = widthPx;
    this.controlPanel.style.maxWidth = widthPx;
  }
}

async function boot() {
  const canvas = document.getElementById("wave-canvas");
  const labelCanvas = document.getElementById("anchor-label-canvas");
  const overlayKey = document.getElementById("ref-overlay-key");
  const hud = document.getElementById("align-hud");
  const motionToggleButton = document.getElementById("motion-toggle");
  const baselineAModeButton = document.getElementById("baseline-a-mode-toggle");
  const keySystemToggle = document.getElementById("system-key-toggle");

  if (!canvas) {
    return;
  }

  try {
    const geometry = await loadGeometry(GEOMETRY_URL);
    const cubicSegments = await loadWaveCubicSegments(geometry);
    const renderer = new WaveOriginalRenderer(
      canvas,
      labelCanvas,
      {
        key: overlayKey
      },
      hud,
      motionToggleButton,
      baselineAModeButton,
      null,
      keySystemToggle,
      null,
      null,
      null,
      null,
      null,
      null,
      geometry,
      cubicSegments
    );
    window.waveViz = renderer;
  } catch (error) {
    console.error("Failed to initialize wave renderer", error);
    if (hud) {
      hud.hidden = false;
      hud.textContent = `Failed to initialize: ${String(error?.message || error)}`;
    }
  }
}

boot();
