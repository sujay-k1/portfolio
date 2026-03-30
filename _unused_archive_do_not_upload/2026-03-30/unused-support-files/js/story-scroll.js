const CASES = [
  {
    year: "2020",
    logoType: "image",
    logoSrc: "/Assets/Aangan-white-logo.png",
    logoAlt: "Aangan logo",
    brandSub: "@BRND STUDIO",
    statement: [
      { text: "Scaled risk identification", highlight: true },
      { text: "by standardizing audits for NGOs and government adoption.", highlight: false }
    ],
    keywordRows: [
      ["Data Viz", "Enterprise suite"],
      ["social service", "Brand strategy"],
      ["Usability Testing", "CMS", "Design system"]
    ],
    filledKeyword: "social service",
    companyIndex: 0
  },
  {
    year: "2021",
    logoType: "image",
    logoSrc: "/Assets/BYJU%27SLogo.png",
    logoAlt: "BYJU'S logo",
    brandSub: "@BRND STUDIO",
    statement: [
      { text: "Improved subscription renewal", highlight: true },
      { text: "by scaling “real” mentorship with MentorConnect", highlight: false }
    ],
    keywordRows: [
      ["Chatbot", "CMS", "Primary Research"],
      ["Education", "A/B Testing", "Smartfeed"],
      ["Personalization", "Data Driven Design"]
    ],
    filledKeyword: "Education",
    companyIndex: 0
  },
  {
    year: "2022",
    logoType: "text",
    logoText: "prime video",
    brandSub: "@BRND STUDIO",
    statement: [
      { text: "Strengthened accessibility", highlight: false },
      { text: "by shipping AI-enabled audio description", highlight: true },
      { text: "workflows.", highlight: false }
    ],
    keywordRows: [
      ["Accessibility", "Editing tool"],
      ["Entertainment", "Asset management"],
      ["Project management tool"]
    ],
    filledKeyword: "Entertainment",
    companyIndex: 0
  },
  {
    year: "2023",
    logoType: "image",
    logoSrc: "/Assets/JioLogo.png",
    logoAlt: "Jio logo",
    brandSub: "JioTesseract",
    statement: [
      { text: "Cut development time", highlight: true },
      { text: "with Platform SDK: patterns, practices, and multimodal interaction", highlight: false }
    ],
    keywordRows: [
      ["LMS", "System design", "Dashboard"],
      ["Immersive Learning", "No-code tool"],
      ["Enterprise Training"]
    ],
    filledKeyword: "Immersive Learning",
    companyIndex: 1
  },
  {
    year: "2024-25",
    logoType: "image",
    logoSrc: "/Assets/Biz2X-logo.png",
    logoAlt: "Biz2X logo",
    brandSub: "Biz2X",
    statement: [
      { text: "Cut development time", highlight: true },
      { text: "with Platform SDK: patterns, practices, and multimodal interaction", highlight: false }
    ],
    keywordRows: [
      ["Design Patterns", "Configurable Journey"],
      ["Lending", "System Design", "CRM"],
      ["Data Driven Design", "D"]
    ],
    filledKeyword: "Lending",
    companyIndex: 2
  },
  {
    year: "2025-26",
    logoType: "text",
    logoText: "SAISON OMNI",
    brandSub: "Dissolved by Saison International",
    statement: [
      { text: "Scaled product, fueled operations", highlight: true },
      { text: "by building reusable governance modules and design patterns", highlight: false }
    ],
    keywordRows: [
      ["Design Patterns", "Configurable modules"],
      ["Lending", "System Design", "Design Ops"],
      ["Data Driven Design"]
    ],
    filledKeyword: "Lending",
    companyIndex: 3
  }
];

const DEBUG_PLAYBACK = {
  slowFactor: 1
};

const ROOT = {
  storyScroll: document.getElementById("story-scroll"),
  introStage: document.getElementById("intro-stage"),
  introWords: Array.from(document.querySelectorAll(".intro-word")).sort(
    (a, b) => Number(a.dataset.order || 0) - Number(b.dataset.order || 0)
  ),
  bitcountWords: Array.from(document.querySelectorAll(".intro-word-bitcount")),
  caseStage: document.getElementById("case-stage"),
  year: document.getElementById("case-year"),
  logo: document.getElementById("case-brand-logo"),
  brandSub: document.getElementById("case-brand-sub"),
  statement: document.getElementById("case-statement"),
  keywords: document.getElementById("case-keywords"),
  companyNav: document.getElementById("company-nav"),
  companyLinks: Array.from(document.querySelectorAll(".company-link")),
  statusPill: document.querySelector(".status-pill")
};

const STATE = {
  currentStep: 0,
  currentCaseIndex: -1,
  activeTween: null,
  navVisible: false,
  scrollActive: false,
  scrollIdleTimer: null
};

const TOTAL_STEPS = CASES.length + 1; // step 0 = intro

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initIntroBitcountLens() {
  if (!ROOT.bitcountWords.length) {
    return;
  }

  let lastX = window.innerWidth * 0.5;
  let lastY = window.innerHeight * 0.5;

  const applyLens = (pointerX, pointerY) => {
    ROOT.bitcountWords.forEach((word) => {
      const rect = word.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const dx = pointerX - cx;
      const dy = pointerY - cy;
      const distance = Math.hypot(dx, dy);
      const radius = Math.max(rect.width, rect.height) * 1.35;
      const t = clamp(1 - distance / radius, 0, 1);
      const eased = t * t * (3 - 2 * t);
      const wght = 220 + eased * 180; // 220 -> 400
      const elsh = 10 - eased * 10; // 10 -> 0
      word.style.fontVariationSettings = `"wght" ${wght.toFixed(1)}, "ELSH" ${elsh.toFixed(2)}`;
    });
  };

  const onMove = (event) => {
    lastX = event.clientX;
    lastY = event.clientY;
    applyLens(lastX, lastY);
  };

  const onLeave = () => {
    applyLens(window.innerWidth * 0.5, window.innerHeight * 0.5);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
  applyLens(lastX, lastY);
}

function getDirection(next, current) {
  if (next === current) {
    return 1;
  }
  return next > current ? 1 : -1;
}

function applyPlaybackScale() {
  if (!window.gsap || !window.gsap.globalTimeline) {
    return;
  }
  const factor = Number(DEBUG_PLAYBACK.slowFactor);
  const safeFactor = Number.isFinite(factor) && factor > 0 ? factor : 1;
  window.gsap.globalTimeline.timeScale(1 / safeFactor);
}

function tokenize(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function setActiveCompany(index) {
  ROOT.companyLinks.forEach((link, i) => {
    link.classList.toggle("is-active", i === index);
  });
}

function renderLogo(item) {
  if (item.logoType === "image" && item.logoSrc) {
    ROOT.logo.innerHTML = `<img src="${item.logoSrc}" alt="${item.logoAlt || "Brand logo"}">`;
    return;
  }
  ROOT.logo.innerHTML = `<span class="logo-fallback">${item.logoText || ""}</span>`;
}

function renderStatement(item) {
  ROOT.statement.innerHTML = "";
  item.statement.forEach((segment) => {
    tokenize(segment.text).forEach((word) => {
      const span = document.createElement("span");
      span.className = `statement-word${segment.highlight ? " highlight" : ""}`;
      span.textContent = word;
      ROOT.statement.appendChild(span);
    });
  });
}

function renderKeywords(item) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const uid = `kw-${item.year.replace(/[^a-z0-9]/gi, "")}-${Date.now().toString(36)}`;
  const keywordSize = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--case-keyword-size")
  ) || 52;
  const lineHeightPx = keywordSize * 1.15;
  const chipGap = keywordSize * 0.38;

  ROOT.keywords.innerHTML = "";
  item.keywordRows.forEach((row, rowIndex) => {
    const line = document.createElement("p");
    line.className = "keyword-line";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add("keyword-svg");
    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("height", `${Math.ceil(lineHeightPx)}`);
    svg.setAttribute("aria-hidden", "true");

    const defs = document.createElementNS(SVG_NS, "defs");
    const filter = document.createElementNS(SVG_NS, "filter");
    const filterId = `${uid}-${rowIndex}`;
    filter.setAttribute("id", filterId);
    filter.setAttribute("x", "-8%");
    filter.setAttribute("y", "-40%");
    filter.setAttribute("width", "116%");
    filter.setAttribute("height", "180%");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const dilate = document.createElementNS(SVG_NS, "feMorphology");
    dilate.setAttribute("in", "SourceAlpha");
    dilate.setAttribute("operator", "dilate");
    dilate.setAttribute("radius", "0.475");
    dilate.setAttribute("result", "dilated");

    const ring = document.createElementNS(SVG_NS, "feComposite");
    ring.setAttribute("in", "dilated");
    ring.setAttribute("in2", "SourceAlpha");
    ring.setAttribute("operator", "out");
    ring.setAttribute("result", "ring");

    const color = document.createElementNS(SVG_NS, "feFlood");
    color.setAttribute("flood-color", "rgba(216,200,220,0.92)");
    color.setAttribute("result", "strokeColor");

    const paintRing = document.createElementNS(SVG_NS, "feComposite");
    paintRing.setAttribute("in", "strokeColor");
    paintRing.setAttribute("in2", "ring");
    paintRing.setAttribute("operator", "in");
    paintRing.setAttribute("result", "outerStroke");

    const merge = document.createElementNS(SVG_NS, "feMerge");
    const mergeNode = document.createElementNS(SVG_NS, "feMergeNode");
    mergeNode.setAttribute("in", "outerStroke");
    merge.appendChild(mergeNode);

    filter.append(dilate, ring, color, paintRing, merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    line.appendChild(svg);
    ROOT.keywords.appendChild(line);

    const chips = [];
    row.forEach((phrase, index) => {
      const chip = document.createElementNS(SVG_NS, "text");
      chip.setAttribute("class", "keyword-chip");
      chip.setAttribute("y", `${lineHeightPx * 0.86}`);
      chip.setAttribute("xml:space", "preserve");
      if (phrase === item.filledKeyword) {
        chip.classList.add("is-filled");
      } else {
        chip.setAttribute("filter", `url(#${filterId})`);
      }
      chip.textContent = index === 0 ? phrase : `• ${phrase}`;
      svg.appendChild(chip);
      chips.push(chip);
    });

    let cursor = 0;
    chips.forEach((chip) => {
      chip.setAttribute("x", `${cursor}`);
      const bounds = chip.getBBox();
      cursor += bounds.width + chipGap;
    });

    const totalWidth = Math.max(Math.ceil(cursor), 1);
    svg.setAttribute("width", `${totalWidth}`);
    svg.setAttribute("viewBox", `0 0 ${totalWidth} ${Math.ceil(lineHeightPx)}`);
  });
}

function setCaseContent(index) {
  const item = CASES[index];
  ROOT.year.textContent = item.year;
  renderLogo(item);
  ROOT.brandSub.textContent = item.brandSub;
  renderStatement(item);
  renderKeywords(item);
  setActiveCompany(item.companyIndex);
}

function getStatementWords() {
  return Array.from(ROOT.statement.querySelectorAll(".statement-word"));
}

function getKeywordChips() {
  return Array.from(ROOT.keywords.querySelectorAll(".keyword-chip"));
}

function showIntroStatic() {
  gsap.set(ROOT.introStage, { autoAlpha: 1 });
  gsap.set(ROOT.caseStage, { autoAlpha: 0 });
  gsap.set(ROOT.companyNav, { autoAlpha: 0 });
  gsap.set(ROOT.introWords, { autoAlpha: 1, y: 0 });
  STATE.navVisible = false;
}

function showCaseStatic(index) {
  setCaseContent(index);
  gsap.set(ROOT.introStage, { autoAlpha: 0 });
  gsap.set(ROOT.caseStage, { autoAlpha: 1 });
  gsap.set([ROOT.year, ROOT.logo, ROOT.brandSub], { autoAlpha: 1, x: 0 });
  gsap.set(getStatementWords(), { autoAlpha: 1, x: 0, y: 0 });
  gsap.set(getKeywordChips(), { autoAlpha: 1, x: 0, y: 0 });
  gsap.set(ROOT.companyNav, { autoAlpha: 1 });
  gsap.set([...ROOT.companyLinks, ROOT.statusPill], { autoAlpha: 1, x: 0 });
  STATE.navVisible = true;
}

function playIntroIn() {
  const tl = gsap.timeline();
  gsap.set(ROOT.introStage, { autoAlpha: 1 });
  gsap.set(ROOT.caseStage, { autoAlpha: 0 });
  gsap.set(ROOT.companyNav, { autoAlpha: 0 });
  tl.fromTo(
    ROOT.introWords,
    { autoAlpha: 0, y: 14 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.48,
      ease: "power2.out",
      stagger: 0.07
    }
  );
  return tl;
}

function playIntroOut(direction) {
  gsap.killTweensOf(ROOT.introWords);
  const outY = direction > 0 ? -18 : 18;
  const tl = gsap.timeline();
  tl.to(ROOT.introWords, {
    autoAlpha: 0,
    y: outY,
    duration: 0.28,
    ease: "power2.in",
    stagger: { each: 0.05, from: "end" }
  });
  tl.to(ROOT.introStage, { autoAlpha: 0, duration: 0.2 }, 0.08);
  return tl;
}

function animateCompanyNavIn(direction) {
  const fromX = direction > 0 ? 24 : -24;
  const tl = gsap.timeline();
  tl.to(ROOT.companyNav, { autoAlpha: 1, duration: 0.2 }, 0);
  tl.fromTo(
    [...ROOT.companyLinks, ROOT.statusPill],
    { autoAlpha: 0, x: fromX },
    {
      autoAlpha: 1,
      x: 0,
      duration: 0.3,
      ease: "power2.out",
      stagger: 0.07
    },
    0.01
  );
  STATE.navVisible = true;
  return tl;
}

function animateCaseIn(index, direction) {
  const inX = direction > 0 ? 44 : -44;
  const item = CASES[index];
  setCaseContent(index);

  const statementWords = getStatementWords();
  const keywordChips = getKeywordChips();

  gsap.set(ROOT.caseStage, { autoAlpha: 1 });
  gsap.set([ROOT.year, ROOT.logo], { autoAlpha: 0, x: inX });
  gsap.set(ROOT.brandSub, { autoAlpha: 0, x: inX });
  gsap.set(statementWords, { autoAlpha: 0, x: inX * 0.34 });
  gsap.set(keywordChips, { autoAlpha: 0 });

  const tl = gsap.timeline();
  tl.to(ROOT.year, { autoAlpha: 1, x: 0, duration: 0.32, ease: "power2.out" }, 0);
  tl.to(ROOT.logo, { autoAlpha: 1, x: 0, duration: 0.32, ease: "power2.out" }, 0.03);
  tl.to(ROOT.brandSub, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }, 0.1);
  tl.to(
    statementWords,
    {
      autoAlpha: 1,
      x: 0,
      duration: 0.24,
      ease: "power2.out",
      stagger: 0.02
    },
    0.12
  );
  tl.to(
    keywordChips,
    {
      autoAlpha: 1,
      duration: 0.18,
      ease: "power2.out",
      stagger: 0.05
    },
    0.26
  );

  if (!STATE.navVisible) {
    tl.add(animateCompanyNavIn(direction), 0.03);
  } else {
    setActiveCompany(item.companyIndex);
  }

  return tl;
}

function animateCaseTransition(nextIndex, direction) {
  const prevIndex = STATE.currentCaseIndex;
  if (prevIndex < 0) {
    return animateCaseIn(nextIndex, direction);
  }

  const prev = CASES[prevIndex];
  const next = CASES[nextIndex];
  const outX = direction > 0 ? -44 : 44;
  const inX = direction > 0 ? 44 : -44;

  const oldWords = getStatementWords();
  const oldChips = getKeywordChips();
  const subtitleChanges = prev.brandSub !== next.brandSub;

  const tl = gsap.timeline();
  tl.to([ROOT.year, ROOT.logo], { autoAlpha: 0, x: outX, duration: 0.22, ease: "power2.in" }, 0);
  if (subtitleChanges) {
    tl.to(ROOT.brandSub, { autoAlpha: 0, x: outX, duration: 0.22, ease: "power2.in" }, 0);
  }
  tl.to(
    oldWords,
    {
      autoAlpha: 0,
      x: outX * 0.34,
      duration: 0.16,
      ease: "power2.in",
      stagger: { each: 0.01, from: "start" }
    },
    0.02
  );

  if (oldChips.length > 1) {
    tl.to(oldChips.slice(0, -1), { autoAlpha: 0, duration: 0.12, stagger: 0.045 }, 0.04);
    tl.to(oldChips[oldChips.length - 1], { autoAlpha: 0, duration: 0.16 }, 0.2);
  } else if (oldChips.length === 1) {
    tl.to(oldChips[0], { autoAlpha: 0, duration: 0.16 }, 0.2);
  }

  tl.call(() => {
    setCaseContent(nextIndex);
    const statementWords = getStatementWords();
    const keywordChips = getKeywordChips();
    gsap.set([ROOT.year, ROOT.logo], { autoAlpha: 0, x: inX });
    if (subtitleChanges) {
      gsap.set(ROOT.brandSub, { autoAlpha: 0, x: inX });
    } else {
      gsap.set(ROOT.brandSub, { autoAlpha: 1, x: 0 });
    }
    // Ensure new children are in a visible baseline state; animate container for robust sequencing.
    gsap.set(statementWords, { autoAlpha: 1, x: 0 });
    gsap.set(keywordChips, { autoAlpha: 1 });
    gsap.set(ROOT.statement, { autoAlpha: 0, x: inX * 0.34 });
    gsap.set(ROOT.keywords, { autoAlpha: 0, x: inX * 0.24 });
  }, null, 0.2);

  tl.to(ROOT.year, { autoAlpha: 1, x: 0, duration: 0.24, ease: "power2.out" }, 0.24);
  tl.to(ROOT.logo, { autoAlpha: 1, x: 0, duration: 0.24, ease: "power2.out" }, 0.26);
  if (subtitleChanges) {
    tl.to(ROOT.brandSub, { autoAlpha: 1, x: 0, duration: 0.24, ease: "power2.out" }, 0.32);
  }
  tl.to(ROOT.statement, { autoAlpha: 1, x: 0, duration: 0.2, ease: "power2.out" }, 0.3);
  tl.to(ROOT.keywords, { autoAlpha: 1, x: 0, duration: 0.18, ease: "power2.out" }, 0.28);
  tl.call(() => setActiveCompany(next.companyIndex), null, 0.3);

  return tl;
}

function animateBackToIntro() {
  const outX = 44;
  const statementWords = getStatementWords();
  const keywordChips = getKeywordChips();
  const tl = gsap.timeline();

  tl.to([ROOT.year, ROOT.logo, ROOT.brandSub], { autoAlpha: 0, x: outX, duration: 0.22, ease: "power2.in" }, 0);
  tl.to(
    statementWords,
    {
      autoAlpha: 0,
      x: outX * 0.34,
      duration: 0.16,
      ease: "power2.in",
      stagger: { each: 0.012, from: "end" }
    },
    0.02
  );
  tl.to(
    keywordChips,
    {
      autoAlpha: 0,
      duration: 0.14,
      ease: "power2.in",
      stagger: { each: 0.04, from: "end" }
    },
    0.02
  );
  tl.to(
    [...ROOT.companyLinks, ROOT.statusPill],
    {
      autoAlpha: 0,
      x: outX,
      duration: 0.2,
      ease: "power2.in",
      stagger: { each: 0.04, from: "end" }
    },
    0
  );
  tl.to(ROOT.caseStage, { autoAlpha: 0, duration: 0.18, ease: "power1.out" }, 0.1);
  tl.call(() => {
    gsap.set(ROOT.introStage, { autoAlpha: 1 });
    gsap.set(ROOT.introWords, { autoAlpha: 0, y: -14 });
  }, null, 0.14);
  tl.to(
    ROOT.introWords,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.28,
      ease: "power2.out",
      stagger: { each: 0.05, from: "start" }
    },
    0.16
  );

  return tl;
}

function applyStableState(step) {
  if (step === 0) {
    showIntroStatic();
    STATE.currentCaseIndex = -1;
    STATE.navVisible = false;
    return;
  }
  showCaseStatic(step - 1);
  STATE.currentCaseIndex = step - 1;
  STATE.navVisible = true;
}

function stopActiveTween() {
  if (!STATE.activeTween) {
    return;
  }
  STATE.activeTween.kill();
  STATE.activeTween = null;
}

function transitionToStep(nextStep) {
  const clampedStep = Math.max(0, Math.min(TOTAL_STEPS - 1, nextStep));
  const fromStep = STATE.currentStep;
  if (clampedStep === fromStep) {
    return;
  }

  const direction = getDirection(clampedStep, fromStep);
  stopActiveTween();
  applyStableState(fromStep);

  let tl;
  if (clampedStep === 0) {
    tl = animateBackToIntro();
  } else if (fromStep === 0) {
    tl = gsap.timeline();
    tl.add(playIntroOut(1), 0);
    tl.add(animateCaseIn(clampedStep - 1, 1), 0.2);
  } else {
    tl = animateCaseTransition(clampedStep - 1, direction);
  }

  STATE.activeTween = tl;
  // No fast/slow differentiation: scrolling = fixed driven speed, idle = normal completion.
  tl.timeScale(STATE.scrollActive ? 3 : 1);
  tl.eventCallback("onComplete", () => {
    STATE.currentStep = clampedStep;
    STATE.currentCaseIndex = clampedStep === 0 ? -1 : clampedStep - 1;
    STATE.navVisible = clampedStep !== 0;
    STATE.activeTween = null;
  });
}

function initScroll() {
  if (!window.gsap || !window.ScrollTrigger) {
    console.error("[story-scroll] GSAP or ScrollTrigger missing.");
    showCaseStatic(0);
    return;
  }

  gsap.registerPlugin(window.ScrollTrigger);
  ROOT.storyScroll.style.height = `${(TOTAL_STEPS + 1) * 100}vh`;

  window.ScrollTrigger.create({
    trigger: ROOT.storyScroll,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.08,
    snap: {
      snapTo: 1 / (TOTAL_STEPS - 1),
      duration: { min: 0.05, max: 0.16 },
      ease: "power2.out"
    },
    onUpdate(self) {
      STATE.scrollActive = true;
      if (STATE.activeTween) {
        STATE.activeTween.timeScale(3);
      }
      if (STATE.scrollIdleTimer) {
        window.clearTimeout(STATE.scrollIdleTimer);
      }
      STATE.scrollIdleTimer = window.setTimeout(() => {
        STATE.scrollActive = false;
        if (STATE.activeTween) {
          STATE.activeTween.timeScale(1);
        }
      }, 120);
      const nextStep = Math.max(0, Math.min(TOTAL_STEPS - 1, Math.round(self.progress * (TOTAL_STEPS - 1))));
      transitionToStep(nextStep);
    }
  });
}

function init() {
  if (!ROOT.storyScroll || !ROOT.introStage || !ROOT.caseStage) {
    return;
  }

  if (!window.gsap) {
    ROOT.introStage.style.opacity = "1";
    ROOT.caseStage.style.opacity = "0";
    ROOT.companyNav.style.opacity = "0";
    return;
  }

  applyPlaybackScale();
  window.storyPlaybackDebug = {
    getSlowFactor: () => DEBUG_PLAYBACK.slowFactor,
    setSlowFactor(value) {
      const next = Number(value);
      if (Number.isFinite(next) && next > 0) {
        DEBUG_PLAYBACK.slowFactor = next;
        applyPlaybackScale();
      }
      return DEBUG_PLAYBACK.slowFactor;
    }
  };

  showIntroStatic();
  initIntroBitcountLens();
  STATE.activeTween = playIntroIn();
  STATE.activeTween.eventCallback("onComplete", () => {
    STATE.activeTween = null;
  });
  initScroll();
}

document.addEventListener("DOMContentLoaded", init);
