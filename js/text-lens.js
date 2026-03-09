const CONFIG = {
  weightMin: 200,
  weightMax: 400,
  shapeAxisTag: "ELSH",
  shapeMin: 10,
  shapeMax: 0,
  influenceRadius: 380,
  falloff: 1.65,
  minWriteShapeDelta: 0.08,
  minWriteWeightDelta: 1.2
};

const AXIS_RANGES = {
  ELSH: [0, 100],
  ELXP: [0, 100],
  CRSV: [0, 1],
  slnt: [-8, 0],
  wght: [200, 700]
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const clampBetween = (v, a, b) => clamp(v, Math.min(a, b), Math.max(a, b));
const shapeAt = (t) => lerp(CONFIG.shapeMin, CONFIG.shapeMax, t);
const weightAt = (t) => lerp(CONFIG.weightMin, CONFIG.weightMax, t);

const heading = document.getElementById("vf-text");

if (heading) {
  let pointerEnabled = true;

  const source = heading.textContent || "curious designer";
  heading.textContent = "";

  const chars = [];

  for (const ch of source) {
    if (ch === " ") {
      heading.append(document.createTextNode(" "));
      continue;
    }

    const span = document.createElement("span");
    span.className = "vf-char";
    span.textContent = ch;

    const state = {
      el: span,
      cx: 0,
      cy: 0,
      lastS: CONFIG.shapeMin,
      lastW: CONFIG.weightMin
    };

    chars.push(state);
    heading.appendChild(span);
  }

  const recalcCenters = () => {
    for (const c of chars) {
      const rect = c.el.getBoundingClientRect();
      c.cx = rect.left + rect.width * 0.5;
      c.cy = rect.top + rect.height * 0.5;
    }
  };

  const writeVariation = (c, s, w) => {
    if (
      Math.abs(s - c.lastS) < CONFIG.minWriteShapeDelta &&
      Math.abs(w - c.lastW) < CONFIG.minWriteWeightDelta
    ) {
      return;
    }

    c.lastS = s;
    c.lastW = w;
    c.el.style.fontVariationSettings = `"wght" ${w.toFixed(1)}, "${CONFIG.shapeAxisTag}" ${s.toFixed(2)}`;
  };

  const applyAllAtT = (t) => {
    const s = shapeAt(t);
    const w = weightAt(t);
    for (const c of chars) {
      writeVariation(c, s, w);
    }
  };

  const updateFromPointer = (x, y) => {
    for (const c of chars) {
      const dx = x - c.cx;
      const dy = y - c.cy;
      const d = Math.hypot(dx, dy);
      const raw = clamp(1 - d / CONFIG.influenceRadius, 0, 1);
      const t = Math.pow(raw, CONFIG.falloff);

      const s = shapeAt(t);
      const w = weightAt(t);
      writeVariation(c, s, w);
    }
  };

  const resetAll = () => applyAllAtT(0);

  const measureAxis = (tag, a, b) => {
    const probe = document.createElement("span");
    probe.textContent = "curiousdesigner";
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.whiteSpace = "nowrap";
    probe.style.fontSize = "140px";
    probe.style.lineHeight = "1";
    probe.style.fontFamily = "\"Bitcount\", \"Bitcount Variable\", sans-serif";
    if (tag === "wght") {
      probe.style.fontVariationSettings = `"wght" ${a.toFixed(1)}, "${CONFIG.shapeAxisTag}" ${CONFIG.shapeMin.toFixed(2)}`;
    } else {
      probe.style.fontVariationSettings = `"wght" ${CONFIG.weightMin.toFixed(1)}, "${tag}" ${a.toFixed(2)}`;
    }
    document.body.appendChild(probe);
    const rectA = probe.getBoundingClientRect();
    if (tag === "wght") {
      probe.style.fontVariationSettings = `"wght" ${b.toFixed(1)}, "${CONFIG.shapeAxisTag}" ${CONFIG.shapeMin.toFixed(2)}`;
    } else {
      probe.style.fontVariationSettings = `"wght" ${CONFIG.weightMin.toFixed(1)}, "${tag}" ${b.toFixed(2)}`;
    }
    const rectB = probe.getBoundingClientRect();
    document.body.removeChild(probe);
    return {
      widthDelta: Number((rectB.width - rectA.width).toFixed(4)),
      heightDelta: Number((rectB.height - rectA.height).toFixed(4))
    };
  };

  const diagnoseAxes = () => {
    const rows = Object.entries(AXIS_RANGES).map(([tag, range]) => {
      const from = range[0];
      const to = range[1];
      const m = measureAxis(tag, from, to);
      return { tag, from, to, ...m };
    });
    console.table(rows);
    return rows;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!pointerEnabled) {
        return;
      }
      updateFromPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerdown",
    (event) => {
      if (!pointerEnabled) {
        return;
      }
      updateFromPointer(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", resetAll, { passive: true });
  window.addEventListener("blur", resetAll, { passive: true });

  window.addEventListener(
    "resize",
    () => {
      recalcCenters();
      if (pointerEnabled) {
        resetAll();
      }
    },
    { passive: true }
  );

  window.textLensDebug = {
    getConfig: () => ({ ...CONFIG }),
    setAxis: (tag) => {
      const safeTag = String(tag || "").trim();
      if (!safeTag) {
        return CONFIG.shapeAxisTag;
      }
      CONFIG.shapeAxisTag = safeTag;
      pointerEnabled = true;
      resetAll();
      return CONFIG.shapeAxisTag;
    },
    setRange: (min, max) => {
      const minNum = Number(min);
      const maxNum = Number(max);
      if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) {
        return { shapeMin: CONFIG.shapeMin, shapeMax: CONFIG.shapeMax };
      }
      CONFIG.shapeMin = minNum;
      CONFIG.shapeMax = maxNum;
      pointerEnabled = true;
      resetAll();
      return { shapeMin: CONFIG.shapeMin, shapeMax: CONFIG.shapeMax };
    },
    setWeightRange: (min, max) => {
      const minNum = Number(min);
      const maxNum = Number(max);
      if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) {
        return { weightMin: CONFIG.weightMin, weightMax: CONFIG.weightMax };
      }
      CONFIG.weightMin = minNum;
      CONFIG.weightMax = maxNum;
      pointerEnabled = true;
      resetAll();
      return { weightMin: CONFIG.weightMin, weightMax: CONFIG.weightMax };
    },
    preview: (value) => {
      const v = clampBetween(Number(value), CONFIG.shapeMin, CONFIG.shapeMax);
      pointerEnabled = false;
      for (const c of chars) {
        writeVariation(c, v, CONFIG.weightMin);
      }
      return v;
    },
    resume: () => {
      pointerEnabled = true;
      resetAll();
    },
    diagnose: () => diagnoseAxes()
  };

  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    document.fonts.ready
      .then(() => {
        recalcCenters();
        resetAll();
        const hasBitcount = document.fonts.check("16px Bitcount");
        console.info("[text-lens] Bitcount loaded:", hasBitcount);
        diagnoseAxes();
        console.info("[text-lens] Debug API ready at window.textLensDebug");
      })
      .catch(() => {
        recalcCenters();
        resetAll();
      });
  } else {
    recalcCenters();
    resetAll();
  }
}
