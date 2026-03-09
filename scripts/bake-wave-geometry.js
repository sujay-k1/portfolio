#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUTS = {
  keyA: path.join(ROOT, "Assets", "waves", "wave_key_a.svg"),
  keyB: path.join(ROOT, "Assets", "waves", "wave_key_b.svg"),
  harmonicA: path.join(ROOT, "Assets", "waves", "wave_harmonic_a.svg"),
  harmonicB: path.join(ROOT, "Assets", "waves", "wave_harmonic_b.svg")
};

const OUTPUT = path.join(ROOT, "Assets", "waves", "waves.baked.json");

const CUBIC_SAMPLES_PER_SEGMENT = 420;
const LINE_SAMPLES_PER_SEGMENT = 20;
const OUT_SAMPLES = 900;

const TOKEN_RE = /[AaCcMmLlHhVvQqSsTtZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function cubicPoint(seg, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * seg.p0.x + 3 * mt2 * t * seg.p1.x + 3 * mt * t2 * seg.p2.x + t3 * seg.p3.x,
    y: mt3 * seg.p0.y + 3 * mt2 * t * seg.p1.y + 3 * mt * t2 * seg.p2.y + t3 * seg.p3.y
  };
}

function parseSvg(svgText) {
  const viewBoxMatch = svgText.match(/viewBox\s*=\s*(["'])(.*?)\1/i);
  const pathMatch = svgText.match(/<path\b[^>]*\bd\s*=\s*(["'])(.*?)\1[^>]*>/is);

  if (!viewBoxMatch) {
    throw new Error("Missing viewBox");
  }
  if (!pathMatch) {
    throw new Error("Missing path d attribute");
  }

  const viewBox = viewBoxMatch[2]
    .split(/[\s,]+/)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (viewBox.length !== 4) {
    throw new Error("Invalid viewBox");
  }

  return {
    viewBox,
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

        segments.push({
          type: "L",
          p0: { x, y },
          p1: { x: x1, y: y1 }
        });

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
    throw new Error("No drawable segments found in path");
  }

  return segments;
}

function sampleSegments(segments) {
  const points = [];
  points.push({ x: segments[0].p0.x, y: segments[0].p0.y });

  for (const segment of segments) {
    if (segment.type === "C") {
      for (let i = 1; i <= CUBIC_SAMPLES_PER_SEGMENT; i += 1) {
        const t = i / CUBIC_SAMPLES_PER_SEGMENT;
        points.push(cubicPoint(segment, t));
      }
      continue;
    }

    if (segment.type === "L") {
      for (let i = 1; i <= LINE_SAMPLES_PER_SEGMENT; i += 1) {
        const t = i / LINE_SAMPLES_PER_SEGMENT;
        points.push({
          x: lerp(segment.p0.x, segment.p1.x, t),
          y: lerp(segment.p0.y, segment.p1.y, t)
        });
      }
      continue;
    }
  }

  return points;
}

function resampleByArcLength(points, outCount) {
  if (points.length < 2) {
    throw new Error("Need at least two points for resampling");
  }

  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }

  const total = cumulative[cumulative.length - 1];
  if (total < 1e-9) {
    throw new Error("Degenerate path: total length is zero");
  }

  const out = new Array(outCount);
  let seg = 0;

  for (let i = 0; i < outCount; i += 1) {
    const target = (i / Math.max(1, outCount - 1)) * total;

    while (seg < cumulative.length - 2 && cumulative[seg + 1] < target) {
      seg += 1;
    }

    const d0 = cumulative[seg];
    const d1 = cumulative[seg + 1];
    const f = d1 > d0 ? (target - d0) / (d1 - d0) : 0;

    out[i] = {
      x: lerp(points[seg].x, points[seg + 1].x, f),
      y: lerp(points[seg].y, points[seg + 1].y, f)
    };
  }

  return out;
}

function bboxOfPaths(pathMap) {
  const box = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  for (const points of Object.values(pathMap)) {
    for (const p of points) {
      if (p.x < box.minX) box.minX = p.x;
      if (p.y < box.minY) box.minY = p.y;
      if (p.x > box.maxX) box.maxX = p.x;
      if (p.y > box.maxY) box.maxY = p.y;
    }
  }

  return box;
}

function flattenNormalized(points, frame) {
  const h = Math.max(1e-9, frame.maxY - frame.minY);
  const out = new Array(points.length * 2);

  for (let i = 0; i < points.length; i += 1) {
    const k = i * 2;
    out[k] = Number(((points[i].x - frame.minX) / h).toFixed(6));
    out[k + 1] = Number(((points[i].y - frame.minY) / h).toFixed(6));
  }

  return out;
}

function main() {
  const sampled = {};
  const sourceMeta = {};

  for (const [key, filePath] of Object.entries(INPUTS)) {
    const svgText = fs.readFileSync(filePath, "utf8");
    const parsed = parseSvg(svgText);
    const segments = parsePathSegments(parsed.d);
    const dense = sampleSegments(segments);
    sampled[key] = resampleByArcLength(dense, OUT_SAMPLES);

    sourceMeta[key] = {
      file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
      viewBox: parsed.viewBox
    };
  }

  const frame = bboxOfPaths(sampled);
  const height = Math.max(1e-9, frame.maxY - frame.minY);
  const rangeX = (frame.maxX - frame.minX) / height;

  const baked = {
    version: 1,
    sampleCount: OUT_SAMPLES,
    frame: {
      minX: Number(frame.minX.toFixed(6)),
      minY: Number(frame.minY.toFixed(6)),
      maxX: Number(frame.maxX.toFixed(6)),
      maxY: Number(frame.maxY.toFixed(6)),
      rangeX: Number(rangeX.toFixed(6))
    },
    sources: sourceMeta,
    paths: {
      keyA: flattenNormalized(sampled.keyA, frame),
      keyB: flattenNormalized(sampled.keyB, frame),
      harmonicA: flattenNormalized(sampled.harmonicA, frame),
      harmonicB: flattenNormalized(sampled.harmonicB, frame)
    }
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(baked));
  process.stdout.write(`Wrote ${path.relative(ROOT, OUTPUT)} with ${OUT_SAMPLES} samples per path\n`);
}

main();
