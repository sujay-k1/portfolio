const GEOMETRY_URL = "Assets/waves/waves.baked.json";
const CONFIG = {
  samples: 420,
  pointer: {
    follow: 0.26,
    release: 0.12,
    engage: 0.24,
    decay: 0.12,
    localSigma: 0.11
  },
  motion: {
    travelingSpeed: 0.126,
    travelingDirection: 1,
    travelingBaselinePasses: 58,
    travelDistanceGain: 1
  },
  visual: {
    stepsMax: 100,
    stepsMin: 12,
    strokeMax: 8,
    strokeMin: 0.95,
    alphaMax: 0.24,
    alphaMin: 0.08
  },
  layout: {
    rightEdge: 1.03,
    topDesktop: -0.09,
    topMobile: -0.06,
    scaleDesktop: 1.08,
    scaleMobile: 1.22
  }
};

const COLORS = {
  waveA: [0.965, 0.745, 0.9],
  waveB: [0.61, 0.95, 0.8]
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function wrap01(value) {
  return value - Math.floor(value);
}

function resampleFloat2(source, outSamples) {
  const inSamples = (source.length / 2) | 0;
  if (inSamples < 2 || outSamples < 2) {
    return new Float32Array(source);
  }

  const out = new Float32Array(outSamples * 2);
  for (let i = 0; i < outSamples; i += 1) {
    const s = (i / (outSamples - 1)) * (inSamples - 1);
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
    const log = gl.getShaderInfoLog(shader) || "Unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to allocate program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Unknown program link error";
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

  const data = await response.json();
  if (!data?.paths || !data?.frame) {
    throw new Error("Invalid geometry JSON");
  }

  return {
    sampleCount: data.sampleCount,
    rangeX: data.frame.rangeX,
    paths: {
      keyA: new Float32Array(data.paths.keyA),
      keyB: new Float32Array(data.paths.keyB),
      harmonicA: new Float32Array(data.paths.harmonicA),
      harmonicB: new Float32Array(data.paths.harmonicB)
    }
  };
}

class WaveLandingWebGL {
  constructor(canvas, geometry) {
    this.canvas = canvas;
    this.eyebrow = document.getElementById("eyebrow-lens");
    this.eyebrowCursor = document.getElementById("eyebrow-cursor");

    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.attribPosition = -1;
    this.attribColor = -1;

    this.isMobile = window.matchMedia("(max-width: 980px), (pointer: coarse)").matches;

    this.rangeX = geometry.rangeX;
    this.n = Math.max(160, Math.min(CONFIG.samples, geometry.sampleCount));

    this.raw = {
      keyA: resampleFloat2(geometry.paths.keyA, this.n),
      keyB: resampleFloat2(geometry.paths.keyB, this.n),
      harmonicA: resampleFloat2(geometry.paths.harmonicA, this.n),
      harmonicB: resampleFloat2(geometry.paths.harmonicB, this.n)
    };

    this.keyA = new Float32Array(this.n * 2);
    this.keyB = new Float32Array(this.n * 2);
    this.harmonicA = new Float32Array(this.n * 2);
    this.harmonicB = new Float32Array(this.n * 2);

    this.srcA = new Float32Array(this.n * 2);
    this.srcB = new Float32Array(this.n * 2);
    this.motionA = new Float32Array(this.n * 2);
    this.motionB = new Float32Array(this.n * 2);

    this.baselineA = new Float32Array(this.n * 2);
    this.baselineB = new Float32Array(this.n * 2);
    this.scratchA = new Float32Array(this.n * 2);
    this.scratchB = new Float32Array(this.n * 2);

    this.normA = new Float32Array(this.n * 2);
    this.normB = new Float32Array(this.n * 2);
    this.distA = new Float32Array(this.n);
    this.distB = new Float32Array(this.n);

    this.guideMid = new Float32Array(this.n * 2);
    this.guideOuterA = new Float32Array(this.n * 2);
    this.guideOuterB = new Float32Array(this.n * 2);

    this.regularWeight = new Float32Array(this.n);

    this.vertexData = new Float32Array(1024);
    this.vertexCount = 0;

    this.pointer = {
      x: 0.56,
      y: 0.56,
      targetX: 0.56,
      targetY: 0.56,
      active: false,
      mix: 0,
      zone: 0,
      closest: Math.floor(this.n * 0.5)
    };

    this.currentSteps = CONFIG.visual.stepsMax;

    this.time = 0;
    this.travelShift = 0;
    this.travelSeam = -1;
    this.lastTs = performance.now();
    this.raf = null;

    this.tempVecA = [0, 0];
    this.tempVecB = [0, 0];

    this.onResize = this.onResize.bind(this);
    this.onPointer = this.onPointer.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.tick = this.tick.bind(this);

    this.initGL();
    this.attach();
    this.resize();
    this.raf = requestAnimationFrame(this.tick);
  }

  initGL() {
    const gl =
      this.canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      }) ||
      this.canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      }) ||
      this.canvas.getContext("experimental-webgl", {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });

    if (!gl) {
      throw new Error("WebGL not available");
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
      throw new Error("Unable to allocate GPU buffer");
    }

    this.attribPosition = gl.getAttribLocation(this.program, "aPosition");
    this.attribColor = gl.getAttribLocation(this.program, "aColor");

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const stride = 6 * 4;
    gl.enableVertexAttribArray(this.attribPosition);
    gl.vertexAttribPointer(this.attribPosition, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.attribColor);
    gl.vertexAttribPointer(this.attribColor, 4, gl.FLOAT, false, stride, 2 * 4);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.gl = gl;
  }

  attach() {
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("pointerdown", this.onPointer, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    window.addEventListener("pointerleave", this.onPointerUp, { passive: true });
    window.addEventListener("blur", this.onPointerUp, { passive: true });

  }

  onResize() {
    this.isMobile = window.matchMedia("(max-width: 980px), (pointer: coarse)").matches;
    this.resize();
  }

  onPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    this.pointer.targetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    this.pointer.targetY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    this.pointer.active = true;
  }

  onPointerUp() {
    this.pointer.active = false;
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

    gl.viewport(0, 0, width, height);

    const layoutScale = this.isMobile ? CONFIG.layout.scaleMobile : CONFIG.layout.scaleDesktop;
    const top = this.isMobile ? CONFIG.layout.topMobile : CONFIG.layout.topDesktop;

    this.layout = {
      scale: layoutScale,
      rightEdge: CONFIG.layout.rightEdge,
      top
    };

    this.transformToViewport(this.raw.keyA, this.keyA);
    this.transformToViewport(this.raw.keyB, this.keyB);
    this.transformToViewport(this.raw.harmonicA, this.harmonicA);
    this.transformToViewport(this.raw.harmonicB, this.harmonicB);
  }

  transformToViewport(source, target) {
    const scale = this.layout.scale;
    const rightEdge = this.layout.rightEdge;
    const top = this.layout.top;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const x = source[k];
      const y = source[k + 1];

      target[k] = rightEdge - (this.rangeX - x) * scale;
      target[k + 1] = top + y * scale;
    }
  }

  updatePointer() {
    const follow = this.pointer.active ? CONFIG.pointer.follow : CONFIG.pointer.release;
    this.pointer.x = lerp(this.pointer.x, this.pointer.targetX, follow);
    this.pointer.y = lerp(this.pointer.y, this.pointer.targetY, follow);

    const targetMix = this.pointer.active ? 1 : 0;
    const mixSpeed = this.pointer.active ? CONFIG.pointer.engage : CONFIG.pointer.decay;
    this.pointer.mix = lerp(this.pointer.mix, targetMix, mixSpeed);
  }

  updateEyebrowLens() {
    const viewX = this.pointer.x * window.innerWidth;
    const viewY = this.pointer.y * window.innerHeight;

    if (this.eyebrow) {
      const rect = this.eyebrow.getBoundingClientRect();
      this.eyebrow.style.setProperty("--lens-local-x", `${viewX - rect.left}px`);
      this.eyebrow.style.setProperty("--lens-local-y", `${viewY - rect.top}px`);
    }

    if (this.eyebrowCursor) {
      this.eyebrowCursor.style.transform = `translate(${viewX}px, ${viewY}px) translate(-50%, -50%)`;
    }
  }

  findClosestMid(curveA, curveB) {
    const px = this.pointer.x;
    const py = this.pointer.y;

    let bestIndex = 0;
    let bestDist2Px = Infinity;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const mx = (curveA[k] + curveB[k]) * 0.5;
      const my = (curveA[k + 1] + curveB[k + 1]) * 0.5;

      const dx = (px - mx) * cw;
      const dy = (py - my) * ch;
      const d2 = dx * dx + dy * dy;

      if (d2 < bestDist2Px) {
        bestDist2Px = d2;
        bestIndex = i;
      }
    }

    return { index: bestIndex, dist2Px: bestDist2Px };
  }

  findClosestCurve(curve) {
    const px = this.pointer.x;
    const py = this.pointer.y;

    let bestIndex = 0;
    let bestDist2Px = Infinity;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const dx = (px - curve[k]) * cw;
      const dy = (py - curve[k + 1]) * ch;
      const d2 = dx * dx + dy * dy;

      if (d2 < bestDist2Px) {
        bestDist2Px = d2;
        bestIndex = i;
      }
    }

    return { index: bestIndex, dist2Px: bestDist2Px };
  }

  buildInteractiveSources() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    const closest = this.findClosestMid(this.keyA, this.keyB);
    const i = closest.index;
    const k = i * 2;

    this.pointer.closest = i;

    const prev = Math.max(0, i - 1) * 2;
    const next = Math.min(this.n - 1, i + 1) * 2;

    const midX = (this.keyA[k] + this.keyB[k]) * 0.5;
    const midY = (this.keyA[k + 1] + this.keyB[k + 1]) * 0.5;

    const midPrevX = (this.keyA[prev] + this.keyB[prev]) * 0.5;
    const midPrevY = (this.keyA[prev + 1] + this.keyB[prev + 1]) * 0.5;
    const midNextX = (this.keyA[next] + this.keyB[next]) * 0.5;
    const midNextY = (this.keyA[next + 1] + this.keyB[next + 1]) * 0.5;

    const tx = (midNextX - midPrevX) * cw;
    const ty = (midNextY - midPrevY) * ch;
    const tLen = Math.max(1e-6, Math.hypot(tx, ty));
    const nx = -ty / tLen;
    const ny = tx / tLen;

    const dApxX = (this.keyA[k] - midX) * cw;
    const dApxY = (this.keyA[k + 1] - midY) * ch;
    const dBpxX = (this.keyB[k] - midX) * cw;
    const dBpxY = (this.keyB[k + 1] - midY) * ch;

    const halfWidth =
      Math.max(Math.abs(dApxX * nx + dApxY * ny), Math.abs(dBpxX * nx + dBpxY * ny)) * 2 + 1;

    const pDx = (this.pointer.x - midX) * cw;
    const pDy = (this.pointer.y - midY) * ch;
    const normalOffset = pDx * nx + pDy * ny;

    const band = Math.exp(-Math.pow(normalOffset / Math.max(2, halfWidth * 0.65), 2));
    const radial = Math.exp(-closest.dist2Px / Math.pow(halfWidth * 1.9 + 1, 2));
    const zoneSeed = clamp(band * radial, 0, 1) * this.pointer.mix;

    const sigma = Math.max(1.5, this.n * CONFIG.pointer.localSigma);

    for (let idx = 0; idx < this.n; idx += 1) {
      const kk = idx * 2;
      const d = (idx - i) / sigma;
      const local = Math.exp(-d * d);
      const w = clamp(zoneSeed * local, 0, 1);
      this.regularWeight[idx] = w;

      this.srcA[kk] = lerp(this.keyA[kk], this.harmonicA[kk], w);
      this.srcA[kk + 1] = lerp(this.keyA[kk + 1], this.harmonicA[kk + 1], w);

      this.srcB[kk] = lerp(this.keyB[kk], this.harmonicB[kk], w);
      this.srcB[kk + 1] = lerp(this.keyB[kk + 1], this.harmonicB[kk + 1], w);
    }
  }

  extractBaseline(source, baseline, scratch, passes) {
    baseline.set(source);

    const last = (this.n - 1) * 2;

    for (let pass = 0; pass < passes; pass += 1) {
      scratch[0] = baseline[0];
      scratch[1] = baseline[1];
      scratch[last] = baseline[last];
      scratch[last + 1] = baseline[last + 1];

      for (let i = 1; i < this.n - 1; i += 1) {
        const km = (i - 1) * 2;
        const k = i * 2;
        const kp = (i + 1) * 2;

        scratch[k] = baseline[km] * 0.25 + baseline[k] * 0.5 + baseline[kp] * 0.25;
        scratch[k + 1] = baseline[km + 1] * 0.25 + baseline[k + 1] * 0.5 + baseline[kp + 1] * 0.25;
      }

      baseline.set(scratch);
    }
  }

  buildBaselineFrame(source, baseline, normals, signedDist) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const prev = Math.max(0, i - 1) * 2;
      const next = Math.min(this.n - 1, i + 1) * 2;

      const tx = (baseline[next] - baseline[prev]) * cw;
      const ty = (baseline[next + 1] - baseline[prev + 1]) * ch;
      const tLen = Math.max(1e-6, Math.hypot(tx, ty));

      const nx = -ty / tLen;
      const ny = tx / tLen;
      normals[k] = nx;
      normals[k + 1] = ny;

      const rx = (source[k] - baseline[k]) * cw;
      const ry = (source[k + 1] - baseline[k + 1]) * ch;
      signedDist[i] = rx * nx + ry * ny;
    }
  }

  sampleOpenVec2(array, s, out) {
    const n = (array.length / 2) | 0;
    if (n < 2) {
      out[0] = n ? array[0] : 0;
      out[1] = n ? array[1] : 0;
      return;
    }

    const span = n - 1;
    const u = clamp(s, 0, 1) * span;
    const i0 = Math.floor(u);
    const i1 = Math.min(span, i0 + 1);
    const f = u - i0;
    const k0 = i0 * 2;
    const k1 = i1 * 2;

    out[0] = lerp(array[k0], array[k1], f);
    out[1] = lerp(array[k0 + 1], array[k1 + 1], f);
  }

  sampleTravelScalarOpen(array, sRaw) {
    const n = array.length;
    if (n < 2) {
      return n ? array[0] : 0;
    }

    const span = n - 1;
    let u = sRaw * span;
    u = ((u % span) + span) % span;

    const i0 = Math.floor(u);
    const i1 = Math.min(span, i0 + 1);
    const f = u - i0;

    return lerp(array[i0], array[i1], f);
  }

  applyMotion(dtSec) {
    this.time += dtSec;

    const cw = this.canvas.width;
    const ch = this.canvas.height;

    this.extractBaseline(this.srcA, this.baselineA, this.scratchA, CONFIG.motion.travelingBaselinePasses);
    this.extractBaseline(this.srcB, this.baselineB, this.scratchB, CONFIG.motion.travelingBaselinePasses);

    this.buildBaselineFrame(this.srcA, this.baselineA, this.normA, this.distA);
    this.buildBaselineFrame(this.srcB, this.baselineB, this.normB, this.distB);

    this.travelShift = wrap01(
      this.travelShift + dtSec * CONFIG.motion.travelingSpeed * CONFIG.motion.travelingDirection
    );

    this.travelSeam = -1;
    const span = Math.max(1, this.n - 1);
    for (let i = 0; i < this.n - 1; i += 1) {
      const s0 = i / span - this.travelShift;
      const s1 = (i + 1) / span - this.travelShift;
      if (Math.floor(s0) !== Math.floor(s1)) {
        this.travelSeam = i;
        break;
      }
    }

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;
      const s = i / Math.max(1, this.n - 1);
      const sSrc = s - this.travelShift;

      this.sampleOpenVec2(this.baselineA, s, this.tempVecA);
      this.sampleOpenVec2(this.normA, s, this.tempVecB);
      const nALen = Math.max(1e-6, Math.hypot(this.tempVecB[0], this.tempVecB[1]));
      const dA =
        this.sampleTravelScalarOpen(this.distA, sSrc) * CONFIG.motion.travelDistanceGain;

      this.motionA[k] = this.tempVecA[0] + (this.tempVecB[0] / nALen) * (dA / cw);
      this.motionA[k + 1] = this.tempVecA[1] + (this.tempVecB[1] / nALen) * (dA / ch);

      this.sampleOpenVec2(this.baselineB, s, this.tempVecA);
      this.sampleOpenVec2(this.normB, s, this.tempVecB);
      const nBLen = Math.max(1e-6, Math.hypot(this.tempVecB[0], this.tempVecB[1]));
      const dB =
        this.sampleTravelScalarOpen(this.distB, sSrc) * CONFIG.motion.travelDistanceGain;

      this.motionB[k] = this.tempVecA[0] + (this.tempVecB[0] / nBLen) * (dB / cw);
      this.motionB[k + 1] = this.tempVecA[1] + (this.tempVecB[1] / nBLen) * (dB / ch);
    }
  }

  buildGuidesAndZone() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    for (let i = 0; i < this.n; i += 1) {
      const k = i * 2;

      const midX = (this.motionA[k] + this.motionB[k]) * 0.5;
      const midY = (this.motionA[k + 1] + this.motionB[k + 1]) * 0.5;
      this.guideMid[k] = midX;
      this.guideMid[k + 1] = midY;

      const prev = Math.max(0, i - 1) * 2;
      const next = Math.min(this.n - 1, i + 1) * 2;

      const tApxX = (this.motionA[next] - this.motionA[prev]) * cw;
      const tApxY = (this.motionA[next + 1] - this.motionA[prev + 1]) * ch;
      const tAlen = Math.max(1e-6, Math.hypot(tApxX, tApxY));
      const nAx = -tApxY / tAlen;
      const nAy = tApxX / tAlen;

      const deltaApxX = (this.motionA[k] - midX) * cw;
      const deltaApxY = (this.motionA[k + 1] - midY) * ch;
      const signedA = deltaApxX * nAx + deltaApxY * nAy;

      this.guideOuterA[k] = this.motionA[k] + (nAx * signedA) / cw;
      this.guideOuterA[k + 1] = this.motionA[k + 1] + (nAy * signedA) / ch;

      const tBpxX = (this.motionB[next] - this.motionB[prev]) * cw;
      const tBpxY = (this.motionB[next + 1] - this.motionB[prev + 1]) * ch;
      const tBlen = Math.max(1e-6, Math.hypot(tBpxX, tBpxY));
      const nBx = -tBpxY / tBlen;
      const nBy = tBpxX / tBlen;

      const deltaBpxX = (this.motionB[k] - midX) * cw;
      const deltaBpxY = (this.motionB[k + 1] - midY) * ch;
      const signedB = deltaBpxX * nBx + deltaBpxY * nBy;

      this.guideOuterB[k] = this.motionB[k] + (nBx * signedB) / cw;
      this.guideOuterB[k + 1] = this.motionB[k + 1] + (nBy * signedB) / ch;
    }

    const closest = this.findClosestCurve(this.guideMid);
    const i = closest.index;
    const k = i * 2;
    const prev = Math.max(0, i - 1) * 2;
    const next = Math.min(this.n - 1, i + 1) * 2;

    const tx = (this.guideMid[next] - this.guideMid[prev]) * cw;
    const ty = (this.guideMid[next + 1] - this.guideMid[prev + 1]) * ch;
    const tLen = Math.max(1e-6, Math.hypot(tx, ty));
    const nx = -ty / tLen;
    const ny = tx / tLen;

    const midX = this.guideMid[k];
    const midY = this.guideMid[k + 1];

    const halfA = Math.abs((this.guideOuterA[k] - midX) * cw * nx + (this.guideOuterA[k + 1] - midY) * ch * ny);
    const halfB = Math.abs((this.guideOuterB[k] - midX) * cw * nx + (this.guideOuterB[k + 1] - midY) * ch * ny);
    const halfWidth = Math.max(halfA, halfB, 1.5);

    const pDx = (this.pointer.x - midX) * cw;
    const pDy = (this.pointer.y - midY) * ch;
    const offset = pDx * nx + pDy * ny;

    const band = 1 - smoothstep(0, halfWidth, Math.abs(offset));
    const radial = Math.exp(-closest.dist2Px / Math.pow(halfWidth * 2 + 8, 2));
    const targetZone = clamp(Math.max(0, band) * radial * this.pointer.mix, 0, 1);

    this.pointer.zone = lerp(this.pointer.zone, targetZone, 0.2);
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
    const out = this.vertexData;
    out[ptr++] = x * 2 - 1;
    out[ptr++] = 1 - y * 2;
    out[ptr++] = r;
    out[ptr++] = g;
    out[ptr++] = b;
    out[ptr++] = a;
    return ptr;
  }

  pushSegment(ptr, x0, y0, x1, y1, widthPx, r, g, b, a) {
    if (a <= 0.0001 || widthPx <= 0.01) {
      return ptr;
    }

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

    ptr = this.writeVertex(ptr, l0x, l0y, r, g, b, a);
    ptr = this.writeVertex(ptr, r0x, r0y, r, g, b, a);
    ptr = this.writeVertex(ptr, l1x, l1y, r, g, b, a);

    ptr = this.writeVertex(ptr, r0x, r0y, r, g, b, a);
    ptr = this.writeVertex(ptr, r1x, r1y, r, g, b, a);
    ptr = this.writeVertex(ptr, l1x, l1y, r, g, b, a);

    return ptr;
  }

  buildVertices() {
    const segCount = this.n - 1;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const startIndex = this.travelSeam >= 0 ? (this.travelSeam + 1) % this.n : 0;

    const targetSteps = lerp(CONFIG.visual.stepsMax, CONFIG.visual.stepsMin, this.pointer.zone);
    this.currentSteps = lerp(this.currentSteps, targetSteps, 0.18);

    const steps = Math.max(2, Math.round(this.currentSteps));
    const estimatedSegments = segCount * (steps + 5);
    const floatsNeeded = estimatedSegments * 6 * 6;

    this.ensureVertexCapacity(floatsNeeded);

    let ptr = 0;

    for (let li = 0; li < steps; li += 1) {
      const t = steps > 1 ? li / (steps - 1) : 0;
      const soften = this.pointer.zone;

      const r = lerp(COLORS.waveA[0], COLORS.waveB[0], t);
      const g = lerp(COLORS.waveA[1], COLORS.waveB[1], t);
      const b = lerp(COLORS.waveA[2], COLORS.waveB[2], t);

      const width = lerp(CONFIG.visual.strokeMax, CONFIG.visual.strokeMin, Math.pow(t, 0.72));
      const alpha =
        lerp(CONFIG.visual.alphaMax, CONFIG.visual.alphaMin, Math.pow(t, 0.75)) *
        lerp(1, 0.72, soften);

      for (let si = 0; si < segCount; si += 1) {
        const i0 = (startIndex + si) % this.n;
        const i1 = (startIndex + si + 1) % this.n;
        const k0 = i0 * 2;
        const k1 = i1 * 2;

        const x0 = lerp(this.motionA[k0], this.motionB[k0], t);
        const y0 = lerp(this.motionA[k0 + 1], this.motionB[k0 + 1], t);
        const x1 = lerp(this.motionA[k1], this.motionB[k1], t);
        const y1 = lerp(this.motionA[k1 + 1], this.motionB[k1 + 1], t);

        ptr = this.pushSegment(ptr, x0, y0, x1, y1, width, r, g, b, alpha);
      }
    }

    this.vertexCount = ptr / 6;
  }

  render() {
    const gl = this.gl;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.vertexCount <= 0) {
      return;
    }

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.subarray(0, this.vertexCount * 6), gl.DYNAMIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }

  tick(ts) {
    const dtMs = clamp(ts - this.lastTs, 8, 42);
    this.lastTs = ts;

    this.updatePointer();
    this.updateEyebrowLens();
    this.buildInteractiveSources();
    this.applyMotion(dtMs * 0.001);
    this.buildGuidesAndZone();
    this.buildVertices();
    this.render();

    this.raf = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerdown", this.onPointer);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("pointerleave", this.onPointerUp);
    window.removeEventListener("blur", this.onPointerUp);

    if (this.gl) {
      if (this.buffer) {
        this.gl.deleteBuffer(this.buffer);
      }
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
    }
  }
}

async function boot() {
  const canvas = document.getElementById("wave-canvas");

  if (!canvas) {
    return;
  }

  try {
    const geometry = await loadGeometry(GEOMETRY_URL);
    const scene = new WaveLandingWebGL(canvas, geometry);
    window.waveScene = scene;
  } catch (error) {
    console.error("Wave scene boot failure", error);
  }
}

boot();
