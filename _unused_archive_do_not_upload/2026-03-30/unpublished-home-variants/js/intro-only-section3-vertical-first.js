import { initSectionOneProceduralWave } from './procedural-wave-section1.js';

const introWords = Array.from(document.querySelectorAll('.intro-word')).sort(
  (a, b) => Number(a.dataset.order || 0) - Number(b.dataset.order || 0)
);
const bitcountWords = Array.from(document.querySelectorAll('.intro-word-bitcount'));
const bitcountChars = [];
const introStage = document.getElementById('intro-stage');
const introWaveViz = document.getElementById('intro-wave-viz');
const introLine1Main = document.getElementById('intro-line-1-main');
const introLine1Tail = document.getElementById('intro-line-1-tail');
const snapRoot = document.getElementById('snap-root');
const snapTrack = document.getElementById('snap-track');
const snapSections = Array.from(document.querySelectorAll('.snap-section'));
const section1 = document.querySelector('.snap-section[data-section="1"]');
const section2 = document.querySelector('.snap-section[data-section="2"]');
const finalHorizonSection = document.querySelector('.snap-section[data-section="3"]');
const finalHorizonScroller = document.getElementById('folio-horizon');
const finalHorizonRail = document.getElementById('folio-horizon-rail');
const finalHorizonHoverChip = document.getElementById('final-horizon-hover-chip');
const finalHorizonHoverChipIconLeading = document.getElementById('final-horizon-hover-chip-icon-leading');
const finalHorizonHoverChipIconTrailing = document.getElementById('final-horizon-hover-chip-icon-trailing');
const finalHorizonHoverChipText = document.getElementById('final-horizon-hover-chip-text');
const finalHorizonLottieMarker = document.getElementById('final-horizon-lottie-marker');
const finalHorizonLottieMarkerInner = document.getElementById('final-horizon-lottie-marker-inner');
const section2ModelMount = document.getElementById('section2-model');
const animatedSections = snapSections.filter((section) => {
  const sectionNumber = Number(section.dataset.section || 0);
  return sectionNumber >= 4 && sectionNumber <= 10;
});
const persistentBottomNav = document.querySelector('.folio-bottom-nav-persistent');
const persistentStatus = document.querySelector('.folio-status-persistent');
const startupLoader = document.getElementById('startup-loader');
const sectionTransitionLayers = new Map(
  Array.from(document.querySelectorAll('.section-transition-layer-local')).map((layer) => [
    layer.dataset.transitionKey,
    {
      layer,
      fill: layer.querySelector('.section-transition-fill'),
      edge: layer.querySelector('.section-transition-edge'),
      gradient: layer.querySelector('linearGradient'),
      stopTop: layer.querySelector('.section-transition-stop-top'),
      stopBottom: layer.querySelector('.section-transition-stop-bottom'),
      label: layer.querySelector('.section-transition-label')
    }
  ])
);
const mainScrollDebugGraph = document.getElementById('main-scroll-debug-graph');
const mainScrollDebugGraphCtx = mainScrollDebugGraph?.getContext('2d') || null;
const mainScrollDebugTooltip = document.getElementById('main-scroll-debug-tooltip');
const mainScrollDebugGraphTitle = document.getElementById('main-scroll-debug-graph-title');
const mainScrollDebugSampleButtons = Array.from(document.querySelectorAll('[data-scroll-debug-sample]'));
const mainScrollDebugModeButtons = Array.from(document.querySelectorAll('[data-scroll-debug-mode]'));
const mainScrollDebugHud = {
  section: document.getElementById('main-scroll-debug-section'),
  deltaX: document.getElementById('main-scroll-debug-delta-x'),
  deltaY: document.getElementById('main-scroll-debug-delta-y'),
  primary: document.getElementById('main-scroll-debug-primary'),
  accumulator: document.getElementById('main-scroll-debug-accumulator'),
  direction: document.getElementById('main-scroll-debug-direction'),
  heuristic: document.getElementById('main-scroll-debug-heuristic'),
  sampling: document.getElementById('main-scroll-debug-sampling'),
  mode: document.getElementById('main-scroll-debug-mode'),
  animating: document.getElementById('main-scroll-debug-animating'),
  cooldown: document.getElementById('main-scroll-debug-cooldown')
};
let animatedStage = null;

const SNAP_STATE = {
  index: 0,
  isAnimating: false,
  isTransitioning: false,
  touchStartY: 0,
  wheelAccumulator: 0,
  lastWheelDirection: 0,
  wheelCooldownUntil: 0,
  section2YellowFillUnits: 0,
  section2WhiteFillProgress: 0,
  section2InteractionProgress: 0,
  section2ParagraphLockUntil: 0,
  section2EdgeAccumulator: 0,
  section2EdgeDirection: 0,
  lastPrimaryInputDelta: 0,
  finalCardsAccumulator: 0,
  finalCardsDirection: 0,
  sectionAnimationRaf: 0,
  sectionAnimationLastTs: 0
};

const WHEEL_SNAP_THRESHOLD = 60;
const WHEEL_COOLDOWN_MS = 380;
const AUTOPLAY_RESUME_DELAY_MS = 300;
const SCROLL_SCRUB_SPEED_MULTIPLIER = 2;
const SECTION2_FILL_UNIT_PX = (170 / 3) / SCROLL_SCRUB_SPEED_MULTIPLIER;
const SECTION2_YELLOW_FILL_UNIT_PX = SECTION2_FILL_UNIT_PX / 3;
const SECTION2_AUTOFILL_DURATION_SECONDS = 3;
const SECTION2_WHITE_CHAR_UNITS = 1 / 12;
const SECTION2_ACCENT_CHAR_UNITS = 1;
const SECTION2_PARAGRAPH_GAP_UNITS = 0.75;
const SECTION3_TIMINGS = {
  yearStart: 0,
  logoStart: 0.15,
  subStart: 0.25,
  fadeDuration: 0.5,
  statementStart: 0.2,
  statementLineDuration: 0.2,
  statementLineStagger: 0.02,
  statementFillDuration: 0.5,
  navStart: 0,
  navDuration: 0.7,
  navStagger: 0.05,
  keywordDelay: 0.2,
  keywordFirstDuration: 0.48,
  keywordDuration: 0.48,
  keywordStagger: 0.08,
  endHold: 0.5
};
const SECTION4_PLUS_ENTRY_GAP = 0.5;
const BITCOUNT_CONFIG = {
  opsz: 8,
  slnt: 0,
  wdth: 100,
  wght: 835,
  grad: -200,
  xopq: 124,
  xtra: 379,
  yopqMin: 135,
  yopqMax: 25,
  ytas: 723,
  ytde: -203,
  ytfi: 738,
  ytlc: 514,
  ytuc: 712,
  influenceRadius: 520,
  falloff: 1.65,
  minWriteYopqDelta: 0.12
};
const SECTION2_MODEL_DEFAULT_SPIN = 0.55;
const SECTION2_MODEL_SCROLL_SPIN_FACTOR = 1;
const SECTION2_MODEL_RENDER_PIXEL_RATIO_CAP = 1.5;
const SECTION2_GRID_SCROLL_FACTOR = 120;
const SECTION2_MODEL_VIEWER_ALIGN_LERP = 0.16;
const SECTION2_MODEL_DIRECTION_FLIP_LERP = 0.18;
const SECTION2_MODEL_BASE_TILT_Z = Math.PI * 1.5;
const SECTION2_CARD_TILT_RANGE = 40;
const SECTION2_CARD_SHIFT_RANGE = 40;
const SECTION2_CARD_ACTIVATION_ENTER_PX = 36;
const SECTION2_CARD_ACTIVATION_EXIT_PX = 64;
const SECTION2_INTERACTION_TRAVEL_PX = 1800;
const SECTION2_DEFAULT_PATH_NODES = [
  { x: 264.5, y: 710, inAngle: 0.8321, outAngle: -2.3095, inLength: 240, outLength: 240 },
  { x: 65, y: 1054, inAngle: 4.0317, outAngle: 0.8901, inLength: 240, outLength: 240 },
  { x: 514, y: 1394, inAngle: 5.0109, outAngle: 1.8693, inLength: 240, outLength: 240 },
  { x: 518, y: 1764, inAngle: 5.1775, outAngle: 2.0359, inLength: 151.55, outLength: 151.55 },
  { x: 26, y: 2082, inAngle: 4.0519, outAngle: 0.9103, inLength: 240, outLength: 240 },
  { x: 438, y: 2416.5, inAngle: 6.127, outAngle: 2.9854, inLength: 240, outLength: 240 }
];
const STARTUP_LOADER_TIMEOUT_MS = 20000;
const BRAND_LOADER_DOCK_OFFSET_Y = -6;
const SECTION_MORPH_TRANSITION_DURATION = 0.78;
const SECTION_MORPH_HINT_DELAY_MS = 420;
const SECTION_MORPH_HINT_PEAK = 82;
const SECTION_MORPH_HANDOFF_THRESHOLD = 0.4;
const FINAL_HORIZON_SECTION_INDEX = 2;
const FINAL_HORIZON_WHEEL_SNAP_THRESHOLD = 2;
const FINAL_HORIZON_SNAP_DURATION = 0.8;
const FINAL_HORIZON_WHEEL_COOLDOWN_MS = 0;
const FINAL_HORIZON_DYNAMIC_DURATION_SAMPLE_MS = 50;
const FINAL_HORIZON_DYNAMIC_DURATION_MIN_MS = 100;
const FINAL_HORIZON_DYNAMIC_DURATION_MIN_DELTA = 5;
const FINAL_HORIZON_DYNAMIC_DURATION_MAX_DELTA = 180;
const FINAL_HORIZON_DYNAMIC_DURATION_CURVE_BASE_MS = 895.21248;
const FINAL_HORIZON_DYNAMIC_DURATION_CURVE_DECAY = 0.978152;
const MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS = 3000;
const MAIN_SCROLL_DEBUG_DEFAULT_SAMPLE_MS = 200;
const finalHorizonCardsData = [
  {
    kind: 'opportunity',
    year: '',
    logo: '',
    logoAlt: '',
    logoSub: '',
    statement: '',
    keywords: [],
    meta: '',
    image: ''
  },
  {
    year: '2025-26',
    logo: 'Assets/saison-omni-logo-white.png',
    logoAlt: 'Saison Omni logo',
    logoSub: 'Dissolved by Saison International',
    href: '/work/saison-omni',
    statement: '<span class="hl">Scaled product and fueled operations</span> by building reusable governance modules and design patterns',
    keywords: ['Design Patterns', 'Configurable modules', 'Lending', 'System Design', 'Design Ops', 'Data Driven Design'],
    meta: 'ENTERPRISE// FINTECH// LENDING',
    image: 'Assets/card-01.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px',
    imageAlign: 'start',
    imageWidth: '100%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  },
  {
    year: '2024-25',
    logo: 'Assets/biz2x-logo-white.png',
    logoAlt: 'Biz2X logo',
    logoSub: 'Biz2X',
    href: '/work/Biz2X',
    statement: '<span class="hl">Cut lender onboarding time to UAT</span> by 60% with configurable application journey framework',
    keywords: ['Design Patterns', 'Configurable Journey', 'Lending', 'System Design', 'CRM', 'Data Driven Design'],
    meta: 'ENTERPRISE// FINTECH// LENDING',
    image: 'Assets/card-02.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px 18px 18px',
    imageAlign: 'start',
    imageWidth: '37%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  },
  {
    year: '2024',
    logo: 'Assets/jiotesseract-logo-white.png',
    logoAlt: 'JioTesseract logo',
    logoSub: 'JioTesseract',
    href: '/work/Jio',
    statement: '<span class="hl">Cut development time</span> with Platform SDK: patterns, practices, and multimodal interaction',
    keywords: ['Design Foundation', 'System Design', 'XR Platform', 'Design Patterns', 'Spatial Design', 'Interaction Design'],
    meta: 'Platform // XR (AR/VR/MR)',
    backgroundImage: 'Assets/JioPlatformBG',
    image: 'Assets/card-03.png',
    imageFit: 'cover',
    imagePosition: '50% 50%',
    imageScale: 1,
    imagePadding: '0',
    imageAlign: 'center'
  },
  {
    year: '2023',
    logo: 'Assets/jiotesseract-logo-white.png',
    logoAlt: 'JioTesseract logo',
    logoSub: 'JioTesseract',
    href: 'https://tesseract.in/learning-and-development-ai-analytics/',
    newTab: true,
    statement: '<span class="hl">Boosted Enterprise training</span> with immersive landing platform for 20+ enterprises',
    keywords: ['LMS', 'System Design', 'Dashboard', 'Immersive Learning', 'No-code Tool', 'Enterprise Training'],
    meta: 'Enterprise // Immersive L&D',
    image: 'Assets/card-04.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px',
    imageAlign: 'start',
    imageWidth: '100%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  },
  {
    year: '2022',
    logo: 'Assets/prime-video-logo-white.png',
    logoAlt: 'Prime Video logo',
    logoSub: '@BRND STUDIO',
    href: 'https://www.primevideo.com/detail/0OKPRIFW4S22RJVLB7N5JC8LRH',
    newTab: true,
    statement: '<span class="hl">Strengthened accessibility</span> by shipping AI-enabled audio description workflows.',
    keywords: ['Accessibility', 'Editing Tool', 'Entertainment', 'Asset Management', 'Project Management Tool'],
    meta: 'ENTERPRISE// ENTERTAINMENT',
    image: 'Assets/card-05.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px',
    imageAlign: 'start',
    imageWidth: '100%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  },
  {
    year: '2021',
    logo: 'Assets/byju\'s-logo-white.png',
    logoAlt: 'BYJU’S logo',
    logoSub: '@BRND STUDIO',
    href: '/work/MentorConnect',
    statement: '<span class="hl">Improved subscription renewal</span> by scaling “real” mentorship with MentorConnect',
    keywords: ['Chatbot', 'CMS', 'Primary Research', 'Education', 'A/B Testing', 'Smartfeed', 'Personalization', 'Data Driven Design'],
    meta: 'Consumer // Education',
    image: 'Assets/card-06.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px 18px 18px',
    imageAlign: 'start',
    imageWidth: '37%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  },
  {
    year: '2020',
    logo: 'Assets/Aangan-white-logo.png',
    logoAlt: 'Aangan logo',
    logoSub: '@BRND STUDIO',
    href: '/work/SurakshaCentral',
    statement: '<span class="hl">Scaled risk identification</span> by standardizing audits for NGOs and government adoption.',
    keywords: ['Data Viz', 'Enterprise Suite', 'Social Service', 'Brand Strategy', 'Usability Testing', 'CMS', 'Design System'],
    meta: 'SaaS // Social Sector',
    image: 'Assets/card-07.png',
    imageFit: 'contain',
    imagePosition: '50% 0%',
    imageScale: 1,
    imagePadding: '24px 18px 18px',
    imageAlign: 'start',
    imageWidth: '37%',
    imageHeight: 'auto',
    imageMaxHeight: 'none'
  }
];
let section2FillTargets = [];
let section2YellowFillTotalUnits = 0;
let section2WhiteFillTotalUnits = 0;
const sectionAnimationStates = new Map();
let outlineSvgUid = 0;
let animatedTransition = null;
let section2ModelScene = null;
let section2ModelAssetsPromise = null;
let sectionOneWaveControllerPromise = null;
let sectionOneWaveController = null;
let sectionOneWaveVisibilityReady = false;
let sectionOneWaveIsVisible = true;
let sectionOneWaveNeedsRestart = true;
let appBooted = false;
let appRevealed = false;
let loaderRevealStarted = false;
const sectionMorphState = { edge: 100, peak: 100 };
let sectionMorphTween = null;
let sectionMorphHintTimeout = 0;
let sectionMorphMode = 'idle';
let sectionMorphHintProgress = 0;
const sectionMorphNextHintAt = new Map();
let activeSectionTransitionKey = null;
const activeSectionRevealMask = {
  index: null,
  direction: 0
};
const activeSectionStacking = {
  fromIndex: null,
  toIndex: null
};
const FINAL_HORIZON_STATE = {
  index: 1,
  snapIndex: 1,
  visualIndex: 1,
  x: 0,
  snapPoints: [],
  sharedLeftAnchor: 0,
  specialExpansionDelta: 0,
  specialCollapseTimer: 0,
  specialCollapsing: false,
  cards: [],
  isAnimating: false,
  entryTweenStarted: false,
  expanded: false,
  hasEntered: false,
  pointerX: window.innerWidth * 0.5,
  pointerY: window.innerHeight * 0.5,
  hoverCardIndex: null,
  lottieInstance: null
};
const MAIN_SCROLL_DEBUG_STATE = {
  graphSampleMs: MAIN_SCROLL_DEBUG_DEFAULT_SAMPLE_MS,
  plotMode: 'average',
  startAt: performance.now(),
  sampleTimer: 0,
  lastDeltaX: 0,
  lastDeltaY: 0,
  lastPrimaryDelta: 0,
  lastDirection: 0,
  zeroSinceAt: 0,
  rawEvents: [],
  graphSamples: [],
  renderedPoints: [],
  heuristic: 'idle',
  heuristicMarkers: [],
  motionMarkers: [],
  requireFreshSection3Entry: false,
  requireFreshSpecialExit: false
};

function updateIntroLine1TailOffset() {
  if (!introLine1Main || !introLine1Tail) {
    return;
  }
  /*
    Keep the "for" offset tied to the rendered width of "curious designer".
    Change the 1.02 multiplier here if this hero relationship needs retuning.
  */
  const mainWidth = introLine1Main.getBoundingClientRect().width || 0;
  introLine1Tail.style.setProperty('--intro-line1-tail-offset-dynamic', `${mainWidth * 1.02}px`);
}

function cubicBezierPoint(t, p1, p2) {
  const inv = 1 - t;
  return (3 * inv * inv * t * p1) + (3 * inv * t * t * p2) + (t * t * t);
}

function cubicBezierSlope(t, p1, p2) {
  const inv = 1 - t;
  return (3 * inv * inv * p1) + (6 * inv * t * (p2 - p1)) + (3 * t * t * (1 - p2));
}

function evaluateCubicBezier(x, x1, y1, x2, y2) {
  let t = clamp(x, 0, 1);
  for (let i = 0; i < 6; i += 1) {
    const currentX = cubicBezierPoint(t, x1, x2);
    const slope = cubicBezierSlope(t, x1, x2);
    if (Math.abs(slope) < 1e-6) {
      break;
    }
    t -= (currentX - x) / slope;
    t = clamp(t, 0, 1);
  }
  return cubicBezierPoint(t, y1, y2);
}

function easePower4Out(t) {
  const clamped = clamp(t, 0, 1);
  return 1 - ((1 - clamped) ** 4);
}

function getSectionTransitionKey(sectionIndex, direction) {
  if (sectionIndex === 0 && direction > 0) {
    return '1-2';
  }
  if (sectionIndex === 1 && direction < 0) {
    return '2-1';
  }
  if (sectionIndex === 1 && direction > 0) {
    return '2-3';
  }
  if (sectionIndex === 2 && direction < 0) {
    return '3-2';
  }
  return null;
}

function getActiveSectionTransitionRefs() {
  return activeSectionTransitionKey ? sectionTransitionLayers.get(activeSectionTransitionKey) || null : null;
}

function activateSectionTransitionLayer(sectionIndex, direction) {
  const nextKey = getSectionTransitionKey(sectionIndex, direction);
  activeSectionTransitionKey = nextKey;
  return getActiveSectionTransitionRefs();
}

function clearSectionTransitionLayers() {
  sectionTransitionLayers.forEach((refs) => {
    refs.layer.classList.remove('is-active', 'is-up', 'is-hint');
  });
  activeSectionTransitionKey = null;
}

function buildSectionRevealClipPath(edge, peak, direction) {
  const samples = 24;
  const curvePoints = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = t * 100;
    const y = ((1 - t) * (1 - t) * edge) + (2 * (1 - t) * t * peak) + (t * t * edge);
    curvePoints.push([x, direction > 0 ? y : 100 - y]);
  }

  if (direction > 0) {
    const points = [
      [0, 100],
      [0, curvePoints[0][1]],
      ...curvePoints,
      [100, 100]
    ];
    return `polygon(${points.map(([x, y]) => `${x.toFixed(3)}% ${y.toFixed(3)}%`).join(',')})`;
  }

  const points = [
    [0, 0],
    [0, curvePoints[0][1]],
    ...curvePoints,
    [100, 0]
  ];
  return `polygon(${points.map(([x, y]) => `${x.toFixed(3)}% ${y.toFixed(3)}%`).join(',')})`;
}

function applyActiveSectionRevealMask() {
  if (activeSectionRevealMask.index == null) {
    return;
  }
  const section = snapSections[activeSectionRevealMask.index];
  if (!section) {
    return;
  }
  /*
    Keep the incoming masked section attached to the boundary line in both
    directions. Forward travel lifts by the current edge height; reverse
    travel drops by the same amount.
  */
  const translateYPercent =
    activeSectionRevealMask.direction > 0 ? -sectionMorphState.edge : sectionMorphState.edge;
  section.style.transform = `translate3d(0, ${translateYPercent.toFixed(3)}%, 0)`;
  section.style.clipPath = buildSectionRevealClipPath(
    sectionMorphState.edge,
    sectionMorphState.peak,
    activeSectionRevealMask.direction
  );
}

function applyActiveSectionStacking() {
  const { fromIndex, toIndex } = activeSectionStacking;
  if (fromIndex == null || toIndex == null) {
    return;
  }
  snapSections.forEach((section, index) => {
    if (index === toIndex) {
      section.style.zIndex = '3';
    } else if (index === fromIndex) {
      section.style.zIndex = '2';
    } else {
      section.style.zIndex = '1';
    }
  });
}

function clearActiveSectionStacking() {
  snapSections.forEach((section) => {
    section.style.removeProperty('z-index');
  });
  activeSectionStacking.fromIndex = null;
  activeSectionStacking.toIndex = null;
}

function clearActiveSectionRevealMask() {
  if (activeSectionRevealMask.index != null) {
    const section = snapSections[activeSectionRevealMask.index];
    section?.style.removeProperty('clip-path');
    section?.style.removeProperty('transform');
  }
  activeSectionRevealMask.index = null;
  activeSectionRevealMask.direction = 0;
  clearActiveSectionStacking();
}

function resetSectionTransitionLabel() {
  const refs = getActiveSectionTransitionRefs();
  if (!window.gsap || !refs?.label) {
    return;
  }
  const archVisualCenter = SECTION_MORPH_HINT_PEAK + (100 - SECTION_MORPH_HINT_PEAK) * 0.4;
  refs.label.style.top = `${archVisualCenter.toFixed(2)}%`;
  window.gsap.set(refs.label, {
    opacity: 0,
    y: 10
  });
}

function resetSectionTransitionLayerOpacity() {
  const refs = getActiveSectionTransitionRefs();
  if (!window.gsap || !refs?.layer) {
    return;
  }
  window.gsap.set(refs.layer, { opacity: 1 });
}

function createPointerMaterial(THREE) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff97ff,
    metalness: 0.64,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.7,
    reflectivity: 1,
    emissive: 0x7a00ff,
    emissiveIntensity: 0.2,
    iridescence: 0.14,
    iridescenceIOR: 1.45,
    sheen: 0.28,
    sheenColor: new THREE.Color(0xfff3ff),
    specularIntensity: 1,
    specularColor: new THREE.Color(0xffffff),
    side: THREE.DoubleSide
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPointerObjectNormal;
varying vec3 vPointerObjectPosition;`
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
vPointerObjectNormal = normalize(objectNormal);`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPointerObjectPosition = position;`
      );

    shader.uniforms.uFaceTopColor = { value: new THREE.Color(0xffc6ff) };
    shader.uniforms.uFaceBottomColor = { value: new THREE.Color(0xc02eff) };
    shader.uniforms.uFaceSideWash = { value: new THREE.Color(0xff9cff) };
    shader.uniforms.uPrimarySideColor = { value: new THREE.Color(0x0d004f) };
    shader.uniforms.uSecondarySideColor = { value: new THREE.Color(0x9a14ff) };
    shader.uniforms.uHighlightColor = { value: new THREE.Color(0xffffff) };
    shader.uniforms.uFresnelPower = { value: 2.0 };
    shader.uniforms.uFresnelStrength = { value: 1.22 };
    shader.uniforms.uHighlightStrength = { value: 0.62 };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vPointerObjectNormal;
varying vec3 vPointerObjectPosition;
uniform vec3 uFaceTopColor;
uniform vec3 uFaceBottomColor;
uniform vec3 uFaceSideWash;
uniform vec3 uPrimarySideColor;
uniform vec3 uSecondarySideColor;
uniform vec3 uHighlightColor;
uniform float uFresnelPower;
uniform float uFresnelStrength;
uniform float uHighlightStrength;`
      )
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
float viewFresnel = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), uFresnelPower);
vec3 objectNormalAbs = abs(normalize(vPointerObjectNormal));
float faceMask = pow(objectNormalAbs.z, 3.0);
float sideMask = pow(objectNormalAbs.x, 1.1);
float bevelMask = pow(objectNormalAbs.y, 1.35);
float verticalGradient = clamp((vPointerObjectPosition.y + 4.2) / 8.4, 0.0, 1.0);
float horizontalGradient = clamp((vPointerObjectPosition.x + 3.8) / 7.6, 0.0, 1.0);
vec3 faceGradient = mix(uFaceBottomColor, uFaceTopColor, verticalGradient);
faceGradient = mix(faceGradient, uFaceSideWash, horizontalGradient * 0.26);
vec3 sideColor = mix(uSecondarySideColor, uPrimarySideColor, clamp(sideMask, 0.0, 1.0));
vec3 bodyTint = mix(sideColor, faceGradient, clamp(faceMask + bevelMask * 0.14, 0.0, 1.0));
float fresnelMix = clamp(viewFresnel * uFresnelStrength, 0.0, 1.0);
vec3 angleTint = mix(bodyTint, uPrimarySideColor, fresnelMix * 0.78);
outgoingLight = mix(outgoingLight * 0.78, outgoingLight * angleTint, 0.96);
outgoingLight += uHighlightColor * pow(viewFresnel, 4.5) * uHighlightStrength;`
      );
  };

  material.customProgramCacheKey = () => 'pointer-fresnel-v1';
  return material;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getSectionTransitionGradient(index) {
  const styles = getComputedStyle(document.body);
  if (index === 1) {
    return {
      top: styles.getPropertyValue('--bg-section-2-top').trim() || '#262626',
      bottom: styles.getPropertyValue('--bg-section-2-bottom').trim() || '#3A3240'
    };
  }
  return {
    top: styles.getPropertyValue('--bg-0').trim() || '#1e142e',
    bottom: styles.getPropertyValue('--bg-2').trim() || '#3e2f4a'
  };
}

function buildSectionTransitionPath(edge, peak) {
  const safeEdge = clamp(edge, 0, 100);
  const safePeak = clamp(peak, 0, 100);
  return `M 0 100 V ${safeEdge.toFixed(2)} Q 50 ${safePeak.toFixed(2)} 100 ${safeEdge.toFixed(
    2
  )} V 100 Z`;
}

function renderSectionTransitionShape() {
  const refs = getActiveSectionTransitionRefs();
  if (!refs?.fill || !refs?.edge) {
    applyActiveSectionRevealMask();
    return;
  }
  const d = buildSectionTransitionPath(sectionMorphState.edge, sectionMorphState.peak);
  refs.fill.setAttribute('d', d);
  refs.edge.setAttribute('d', d);
  const visibleTop = clamp(Math.min(sectionMorphState.edge, sectionMorphState.peak), 0, 100);
  if (refs.gradient) {
    refs.gradient.setAttribute('y1', `${visibleTop.toFixed(2)}`);
    refs.gradient.setAttribute('y2', '100');
  }
  applyActiveSectionRevealMask();
}

function setSectionTransitionGradient(index, direction = 1) {
  const refs = getActiveSectionTransitionRefs();
  if (!refs?.layer) {
    return;
  }
  const gradient = getSectionTransitionGradient(index);
  const isUp = direction < 0;
  const topColor = isUp ? gradient.bottom : gradient.top;
  const bottomColor = isUp ? gradient.top : gradient.bottom;
  if (refs.stopTop && refs.stopBottom) {
    refs.stopTop.setAttribute('stop-color', topColor);
    refs.stopBottom.setAttribute('stop-color', bottomColor);
  } else {
    refs.layer.style.setProperty('--section-transition-top', topColor);
    refs.layer.style.setProperty('--section-transition-bottom', bottomColor);
  }
}

function clearSectionMorphHintTimeout() {
  if (!sectionMorphHintTimeout) {
    return;
  }
  window.clearTimeout(sectionMorphHintTimeout);
  sectionMorphHintTimeout = 0;
}

function getSectionMorphRepeatDelayMs(index) {
  return Math.max(0, index + 2) * 1000;
}

function stopSectionMorphAnimation(hideLayer = false) {
  clearSectionMorphHintTimeout();
  if (sectionMorphTween) {
    sectionMorphTween.kill();
    sectionMorphTween = null;
  }
  const refs = getActiveSectionTransitionRefs();
  if (refs?.layer) {
    refs.layer.classList.remove('is-up', 'is-hint');
    if (hideLayer) {
      refs.layer.classList.remove('is-active');
    }
  }
  sectionMorphState.edge = 100;
  sectionMorphState.peak = 100;
  sectionMorphHintProgress = 0;
  resetSectionTransitionLayerOpacity();
  resetSectionTransitionLabel();
  renderSectionTransitionShape();
  sectionMorphMode = 'idle';
  clearActiveSectionRevealMask();
  if (hideLayer || !refs?.layer) {
    clearSectionTransitionLayers();
  }
}

function stopSectionMorphHint() {
  if (sectionMorphMode !== 'hint') {
    return;
  }
  stopSectionMorphAnimation(true);
}

function canShowSectionMorphHint() {
  return (
    !document.body.classList.contains('app-loading') &&
    !SNAP_STATE.isAnimating &&
    !SNAP_STATE.isTransitioning &&
    SNAP_STATE.index < snapSections.length - 1
  );
}

function startSectionMorphHint() {
  const refs = activateSectionTransitionLayer(SNAP_STATE.index, 1);
  if (!window.gsap || !refs?.layer || !canShowSectionMorphHint()) {
    return;
  }
  stopSectionMorphAnimation(false);
  const activeIndex = SNAP_STATE.index;
  setSectionTransitionGradient(SNAP_STATE.index + 1, 1);
  refs.layer.classList.remove('is-up');
  refs.layer.classList.add('is-active', 'is-hint');
  sectionMorphMode = 'hint';
  resetSectionTransitionLayerOpacity();
  resetSectionTransitionLabel();
  const hintDriver = { progress: 0 };
  sectionMorphTween = window.gsap.timeline({
    onComplete: () => {
      sectionMorphTween = null;
      sectionMorphNextHintAt.set(
        activeIndex,
        performance.now() + getSectionMorphRepeatDelayMs(activeIndex)
      );
      if (SNAP_STATE.index === activeIndex) {
        scheduleSectionMorphHint(0);
      }
    }
  });
  sectionMorphTween.to(hintDriver, {
    progress: 1,
    duration: 2,
    ease: 'none',
    onUpdate: () => {
      const p = hintDriver.progress;
      sectionMorphHintProgress = p;
      const peakProgress = clamp(p / 0.38, 0, 1);
      const edgeProgress = clamp((p - 0.18) / 0.82, 0, 1);
      const peakEase = evaluateCubicBezier(peakProgress, 0.77, 0.78, 0.91, 0.37);
      const edgeEase = easePower4Out(edgeProgress);
      sectionMorphState.peak = 100 + (0 - 100) * peakEase;
      sectionMorphState.edge = 100 + (0 - 100) * edgeEase;
      renderSectionTransitionShape();
    }
  });
  if (refs.label) {
    sectionMorphTween.to(
      refs.label,
      {
        opacity: 1,
        y: 0,
        duration: 0.22,
        ease: 'power2.out'
      },
      0.18
    );
    sectionMorphTween.to(
      refs.label,
      {
        opacity: 0,
        y: -8,
        duration: 0.8,
        ease: 'power4.out'
      },
      1.1
    );
  }
  sectionMorphTween.to(
    refs.layer,
    {
      opacity: 0,
      duration: 2,
      ease: 'power4.out'
    },
    0.3
  );
}

function scheduleSectionMorphHint(delay = SECTION_MORPH_HINT_DELAY_MS) {
  clearSectionMorphHintTimeout();
  if (!canShowSectionMorphHint()) {
    stopSectionMorphAnimation(true);
    return;
  }
  const activeIndex = SNAP_STATE.index;
  const now = performance.now();
  const minEligibleAt = now + delay;
  const storedNextAt = sectionMorphNextHintAt.get(activeIndex);
  const nextAt =
    storedNextAt == null
      ? Math.max(minEligibleAt, now + getSectionMorphRepeatDelayMs(activeIndex))
      : Math.max(storedNextAt, minEligibleAt);
  sectionMorphHintTimeout = window.setTimeout(() => {
    sectionMorphHintTimeout = 0;
    startSectionMorphHint();
  }, Math.max(0, nextAt - now));
}

function playSectionMorphTransition(direction, incomingIndex, duration = SECTION_MORPH_TRANSITION_DURATION) {
  const refs = activateSectionTransitionLayer(SNAP_STATE.index, direction);
  if (!window.gsap || !refs?.layer) {
    return;
  }
  const safeDuration = Math.max(0.001, duration);
  clearSectionMorphHintTimeout();
  const shouldResetFromHint =
    sectionMorphMode === 'hint' && sectionMorphHintProgress > SECTION_MORPH_HANDOFF_THRESHOLD;
  if (sectionMorphTween) {
    sectionMorphTween.kill();
    sectionMorphTween = null;
  }
  sectionMorphHintProgress = 0;
  refs.layer.classList.toggle('is-up', direction < 0);
  refs.layer.classList.remove('is-hint');
  resetSectionTransitionLayerOpacity();
  resetSectionTransitionLabel();
  if (shouldResetFromHint) {
    sectionMorphState.edge = 100;
    sectionMorphState.peak = 100;
  }
  setSectionTransitionGradient(incomingIndex, direction);
  activeSectionStacking.fromIndex = SNAP_STATE.index;
  activeSectionStacking.toIndex = incomingIndex;
  applyActiveSectionStacking();
  activeSectionRevealMask.index = incomingIndex;
  activeSectionRevealMask.direction = direction;
  refs.layer.classList.add('is-active', 'section-transition-layer-debug');
  sectionMorphMode = 'transition';
  renderSectionTransitionShape();
  const transitionDriver = { progress: 0 };
  sectionMorphTween = window.gsap.timeline({
    onComplete: () => {
      sectionMorphTween = null;
      refs.layer.classList.remove('is-active', 'is-up', 'section-transition-layer-debug');
      sectionMorphState.edge = 100;
      sectionMorphState.peak = 100;
      renderSectionTransitionShape();
      clearActiveSectionRevealMask();
      clearSectionTransitionLayers();
      scheduleSectionMorphHint();
    }
  });
  sectionMorphTween.to(transitionDriver, {
    progress: 1,
    duration: safeDuration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const p = transitionDriver.progress;
      if (p <= 0.42) {
        const local = p / 0.42;
        sectionMorphState.edge = 100 + (52 - 100) * local;
        sectionMorphState.peak = 100 + (8 - 100) * local;
      } else {
        const local = (p - 0.42) / 0.58;
        sectionMorphState.edge = 52 + (0 - 52) * local;
        sectionMorphState.peak = 8 + (0 - 8) * local;
      }
      renderSectionTransitionShape();
    }
  }, 0);
}

function createSectionAnimationState(sectionIndex, durationSeconds) {
  return {
    sectionIndex,
    durationSeconds,
    progressSeconds: 0,
    scrollPixelsPerSecond: 900 / SCROLL_SCRUB_SPEED_MULTIPLIER,
    isActive: false,
    lastInteractionAt: 0,
    reset: null,
    apply: () => {},
    refs: null
  };
}

function syncBodySectionState(index) {
  document.body.dataset.section = String(index + 1);
  document.documentElement.classList.toggle('horizon-overscroll-lock', index === FINAL_HORIZON_SECTION_INDEX);
  document.body.classList.toggle('section-2-active', index === 1);
  document.body.classList.toggle(
    'status-persistent-active',
    index === 1 || (index >= 3 && index <= 9)
  );
  document.body.classList.toggle(
    'persistent-bottom-nav-active',
    index >= 3 && index <= 9
  );
  if (persistentBottomNav) {
    persistentBottomNav.dataset.sectionIndex = String(index);
  }
  if (index >= 3) {
    if (persistentBottomNav) {
      persistentBottomNav.style.opacity = '';
      persistentBottomNav.style.transform = '';
    }
    if (persistentStatus) {
      persistentStatus.style.opacity = '';
      persistentStatus.style.transform = '';
    }
  }
  updatePersistentBottomNav(index);
  refreshSection2ModelVisibility();
  if (index === FINAL_HORIZON_SECTION_INDEX && !SNAP_STATE.isAnimating) {
    activateFinalHorizonSection(SNAP_STATE.index);
  }
}

function updateSection2ModelVisibility(isActive) {
  if (!section2ModelScene || !section2ModelScene.renderer || !section2ModelScene.animationLoop) {
    return;
  }
  if (section2ModelScene.isActive === isActive) {
    return;
  }
  section2ModelScene.isActive = isActive;
  if (isActive) {
    section2ModelScene.lastFrameTime = performance.now();
    section2ModelScene.renderer.setAnimationLoop(section2ModelScene.animationLoop);
    section2ModelScene.animationLoop();
    return;
  }
  section2ModelScene.renderer.setAnimationLoop(null);
}

function isSection2VisibleInViewport() {
  if (!section2) {
    return false;
  }
  const rect = section2.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

function refreshSection2ModelVisibility() {
  updateSection2ModelVisibility(isSection2VisibleInViewport());
}

function getPersistentBottomNavActiveIndex(sectionIndex) {
  if (sectionIndex >= 8) {
    return 3;
  }
  if (sectionIndex >= 7) {
    return 2;
  }
  if (sectionIndex >= 5) {
    return 1;
  }
  return 0;
}

function getTransitionNavProgressContext() {
  if (!animatedTransition || animatedTransition.direction <= 0) {
    return null;
  }
  const entryGap = animatedTransition.entryGap || 0;
  if (animatedTransition.progress < entryGap) {
    const currentState = getSectionAnimationState(animatedTransition.fromIndex);
    if (!currentState) {
      return null;
    }
    return {
      sectionIndex: animatedTransition.fromIndex,
      progressOverride: currentState.durationSeconds,
      durationOverride: currentState.durationSeconds
    };
  }
  const targetState = getSectionAnimationState(animatedTransition.toIndex);
  if (!targetState) {
    return null;
  }
  const progressOverride = clamp(
    animatedTransition.progress - entryGap,
    0,
    targetState.durationSeconds
  );
  return {
    sectionIndex: animatedTransition.toIndex,
    progressOverride,
    durationOverride: targetState.durationSeconds
  };
}

function resolvePersistentNavContext(sectionIndexOrContext) {
  if (typeof sectionIndexOrContext === 'object' && sectionIndexOrContext !== null) {
    return sectionIndexOrContext;
  }
  const transitionContext = getTransitionNavProgressContext();
  if (transitionContext) {
    return transitionContext;
  }
  return { sectionIndex: sectionIndexOrContext };
}

function updatePersistentBottomNav(sectionIndexOrContext) {
  if (!persistentBottomNav) {
    return;
  }
  const context = resolvePersistentNavContext(sectionIndexOrContext);
  const { sectionIndex, progressOverride = null, durationOverride = null } = context;
  const itemsWrap = persistentBottomNav.querySelector('.folio-bottom-nav-items');
  const items = Array.from(persistentBottomNav.querySelectorAll('.folio-bottom-nav-items span'));
  const indicator = persistentBottomNav.querySelector('.folio-bottom-nav-indicator');
  const indicatorFill = persistentBottomNav.querySelector('.folio-bottom-nav-indicator-fill');
  const activeIndex = getPersistentBottomNavActiveIndex(sectionIndex);
  if (sectionIndex >= 3) {
    items.forEach((item) => {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0px)';
    });
    if (indicator) {
      indicator.style.opacity = '1';
    }
  }
  items.forEach((item, index) => {
    item.classList.toggle('active', index === activeIndex);
  });
  if (!indicator) {
    return;
  }
  const activeItem = items[activeIndex];
  if (!activeItem || !itemsWrap) {
    return;
  }
  indicator.style.width = `${activeItem.offsetWidth}px`;
  indicator.style.transform = `translateX(${itemsWrap.offsetLeft + activeItem.offsetLeft}px)`;
  if (indicatorFill) {
    let progress = 1;
    if (progressOverride !== null && durationOverride !== null) {
      progress = durationOverride > 0 ? clamp(progressOverride / durationOverride, 0, 1) : 1;
    } else {
      const state = getSectionAnimationState(sectionIndex);
      if (state) {
        progress =
          state.durationSeconds > 0 ? clamp(state.progressSeconds / state.durationSeconds, 0, 1) : 1;
      }
    }
    indicatorFill.style.transform = `scaleX(${progress.toFixed(3)})`;
  }
}

function ensureAnimatedStage() {
  if (animatedStage) {
    return animatedStage;
  }
  animatedStage = document.createElement('div');
  animatedStage.className = 'animated-stage';
  animatedStage.innerHTML = '<div class="animated-stage-current"></div><div class="animated-stage-next"></div>';
  document.body.appendChild(animatedStage);
  return animatedStage;
}

function getSectionAnimationState(index) {
  return sectionAnimationStates.get(index) || null;
}

function setSectionAnimationProgress(state, nextProgress, options = {}) {
  const { suppressNavUpdate = false } = options;
  const clamped = clamp(nextProgress, 0, state.durationSeconds);
  state.progressSeconds = clamped;
  state.apply(clamped, state.durationSeconds);
  if (!suppressNavUpdate && state.sectionIndex === SNAP_STATE.index && state.sectionIndex >= 2) {
    updatePersistentBottomNav(state.sectionIndex);
  }
}

function resetSectionAnimationState(state, options = {}) {
  state.isActive = false;
  state.lastInteractionAt = 0;
  if (typeof state.reset === 'function') {
    state.reset(options);
    return;
  }
  setSectionAnimationProgress(state, 0, options);
}

function settleAfterSectionChange() {
  SNAP_STATE.wheelAccumulator = 0;
  SNAP_STATE.lastWheelDirection = 0;
  SNAP_STATE.section2EdgeAccumulator = 0;
  SNAP_STATE.section2EdgeDirection = 0;
  SNAP_STATE.wheelCooldownUntil = performance.now() + WHEEL_COOLDOWN_MS;
  scheduleSectionMorphHint(0);
}

function stopSectionAnimationLoop() {
  if (!SNAP_STATE.sectionAnimationRaf) {
    return;
  }
  cancelAnimationFrame(SNAP_STATE.sectionAnimationRaf);
  SNAP_STATE.sectionAnimationRaf = 0;
  SNAP_STATE.sectionAnimationLastTs = 0;
}

function tickSectionAnimation(ts) {
  if (SNAP_STATE.isTransitioning) {
    if (!SNAP_STATE.sectionAnimationLastTs) {
      SNAP_STATE.sectionAnimationLastTs = ts;
    }
    const dt = Math.max(0, (ts - SNAP_STATE.sectionAnimationLastTs) / 1000);
    SNAP_STATE.sectionAnimationLastTs = ts;
    tickAnimatedTransition(dt);
    SNAP_STATE.sectionAnimationRaf = requestAnimationFrame(tickSectionAnimation);
    return;
  }
  if (SNAP_STATE.index === 1) {
    if (!SNAP_STATE.sectionAnimationLastTs) {
      SNAP_STATE.sectionAnimationLastTs = ts;
    }
    const dt = Math.max(0, (ts - SNAP_STATE.sectionAnimationLastTs) / 1000);
    SNAP_STATE.sectionAnimationLastTs = ts;
    if (SNAP_STATE.section2WhiteFillProgress < 1) {
      const nextWhiteProgress =
        SECTION2_AUTOFILL_DURATION_SECONDS > 0
          ? SNAP_STATE.section2WhiteFillProgress + dt / SECTION2_AUTOFILL_DURATION_SECONDS
          : 1;
      applySection2WhiteFill(nextWhiteProgress);
    }
    SNAP_STATE.sectionAnimationRaf = requestAnimationFrame(tickSectionAnimation);
    return;
  }
  const state = getSectionAnimationState(SNAP_STATE.index);
  if (!state || !state.isActive) {
    stopSectionAnimationLoop();
    return;
  }

  if (!SNAP_STATE.sectionAnimationLastTs) {
    SNAP_STATE.sectionAnimationLastTs = ts;
  }
  const dt = Math.max(0, (ts - SNAP_STATE.sectionAnimationLastTs) / 1000);
  SNAP_STATE.sectionAnimationLastTs = ts;

  if (
    performance.now() - state.lastInteractionAt >= AUTOPLAY_RESUME_DELAY_MS &&
    state.progressSeconds < state.durationSeconds
  ) {
    setSectionAnimationProgress(state, state.progressSeconds + dt);
  }

  SNAP_STATE.sectionAnimationRaf = requestAnimationFrame(tickSectionAnimation);
}

function ensureSectionAnimationLoop() {
  if (SNAP_STATE.sectionAnimationRaf) {
    return;
  }
  SNAP_STATE.sectionAnimationLastTs = 0;
  SNAP_STATE.sectionAnimationRaf = requestAnimationFrame(tickSectionAnimation);
}

function activateSectionAnimation(index) {
  if (index === 1) {
    ensureSectionAnimationLoop();
    return;
  }
  const state = getSectionAnimationState(index);
  if (!state) {
    stopSectionAnimationLoop();
    return;
  }
  if (SNAP_STATE.isTransitioning) {
    return;
  }
  state.isActive = true;
  state.lastInteractionAt = performance.now();
  ensureSectionAnimationLoop();
}

function handleAnimatedSectionScroll(state, deltaY) {
  if (performance.now() < SNAP_STATE.wheelCooldownUntil) {
    return false;
  }
  if (SNAP_STATE.isTransitioning && animatedTransition) {
    animatedTransition.progress = clamp(
      animatedTransition.progress + deltaY / animatedTransition.scrollPixelsPerSecond,
      0,
      animatedTransition.duration
    );
    animatedTransition.lastInteractionAt = performance.now();
    return true;
  }
  if (deltaY > 0 && state.progressSeconds >= state.durationSeconds - 0.0001) {
    return false;
  }
  if (deltaY < 0 && state.sectionIndex === 3 && state.progressSeconds <= 0.0001) {
    return false;
  }
  const nextProgress = state.progressSeconds + deltaY / state.scrollPixelsPerSecond;
  if (deltaY < 0 && nextProgress <= 0.0001) {
    setSectionAnimationProgress(state, 0);
    state.lastInteractionAt = performance.now();
    if (state.sectionIndex === 3) {
      ensureSectionAnimationLoop();
      return true;
    }
    if (isAnimatedSectionIndex(state.sectionIndex - 1)) {
      if (beginAnimatedSectionTransition(state.sectionIndex - 1, -1, 0)) {
        return true;
      }
    }
  }
  setSectionAnimationProgress(state, nextProgress);
  state.lastInteractionAt = performance.now();
  ensureSectionAnimationLoop();
  return true;
}

function initBitcountLens() {
  if (!bitcountChars.length) {
    return;
  }

  let pointerEnabled = true;
  let lensRaf = 0;
  let latestPointerX = 0;
  let latestPointerY = 0;
  let pointerPending = false;

  const yopqAt = (t) =>
    BITCOUNT_CONFIG.yopqMin + (BITCOUNT_CONFIG.yopqMax - BITCOUNT_CONFIG.yopqMin) * t;

  const recalcCenters = () => {
    bitcountChars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      char._cx = rect.left + rect.width * 0.5;
      char._cy = rect.top + rect.height * 0.5;
    });
  };

  const writeVariation = (char, yopq) => {
    const lastYopq = char._lastYopq ?? BITCOUNT_CONFIG.yopqMin;
    if (Math.abs(yopq - lastYopq) < BITCOUNT_CONFIG.minWriteYopqDelta) {
      return;
    }

    char._lastYopq = yopq;
    char.style.setProperty('--intro-yopq', yopq.toFixed(2));
  };

  const applyAllAtT = (t) => {
    const yopq = yopqAt(t);
    bitcountChars.forEach((char) => {
      writeVariation(char, yopq);
    });
  };

  const applyLens = (pointerX, pointerY) => {
    bitcountChars.forEach((char) => {
      const dx = pointerX - (char._cx ?? 0);
      const dy = pointerY - (char._cy ?? 0);
      const distance = Math.hypot(dx, dy);
      const raw = clamp(1 - distance / BITCOUNT_CONFIG.influenceRadius, 0, 1);
      const eased = Math.pow(raw, BITCOUNT_CONFIG.falloff);
      writeVariation(char, yopqAt(eased));
    });
  };

  const scheduleLensUpdate = (pointerX, pointerY) => {
    latestPointerX = pointerX;
    latestPointerY = pointerY;
    pointerPending = true;
    if (lensRaf) {
      return;
    }
    lensRaf = requestAnimationFrame(() => {
      lensRaf = 0;
      if (!pointerEnabled || !pointerPending) {
        return;
      }
      pointerPending = false;
      applyLens(latestPointerX, latestPointerY);
    });
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!pointerEnabled) {
        return;
      }
      scheduleLensUpdate(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerdown',
    (event) => {
      if (!pointerEnabled) {
        return;
      }
      scheduleLensUpdate(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerleave',
    () => {
      pointerPending = false;
      applyAllAtT(0);
    },
    { passive: true }
  );

  window.addEventListener(
    'blur',
    () => {
      pointerPending = false;
      applyAllAtT(0);
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      recalcCenters();
      if (pointerEnabled) {
        applyAllAtT(0);
      }
      renderOutlineSvgKeywords();
      updatePersistentBottomNav(SNAP_STATE.index);
    },
    { passive: true }
  );

  recalcCenters();
  applyAllAtT(0);
}

function initBitcountChars() {
  bitcountWords.forEach((word) => {
    const text = word.textContent || '';
    word.textContent = '';
    [...text].forEach((letter) => {
      const char = document.createElement('span');
      char.className = 'intro-bitcount-char';
      char.textContent = letter;
      char.style.setProperty('--intro-yopq', String(BITCOUNT_CONFIG.yopqMin));
      word.appendChild(char);
      bitcountChars.push(char);
    });
  });
}

function waitForImageLoad(img) {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      resolve();
    };
    const handleError = () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      reject(new Error(`Failed to load image: ${img.currentSrc || img.src}`));
    };
    img.addEventListener('load', handleLoad, { once: true });
    img.addEventListener('error', handleError, { once: true });
  });
}

function preloadPageImages() {
  const images = Array.from(document.images).filter((img) => img.getAttribute('src'));
  return Promise.all(images.map(waitForImageLoad));
}

function preloadFonts() {
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    return document.fonts.ready;
  }
  return Promise.resolve();
}

function preloadCriticalLibraries() {
  return new Promise((resolve, reject) => {
    if (window.gsap && window.SplitText) {
      resolve();
      return;
    }
    reject(new Error('Critical animation libraries are unavailable.'));
  });
}

function preloadSection2ModelAssets() {
  if (!section2ModelMount) {
    return Promise.resolve(null);
  }
  if (section2ModelAssetsPromise) {
    return section2ModelAssetsPromise;
  }

  section2ModelAssetsPromise = (async () => {
    const [THREE, loaderModule, environmentModule] = await Promise.all([
      import('https://esm.sh/three@0.161.0'),
      import('https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js'),
      import('https://esm.sh/three@0.161.0/examples/jsm/environments/RoomEnvironment.js')
    ]);
    const loader = new loaderModule.GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load('Assets/models/pointer/pointer.gltf', resolve, undefined, reject);
    });
    return {
      THREE,
      GLTFLoader: loaderModule.GLTFLoader,
      RoomEnvironment: environmentModule.RoomEnvironment,
      gltf
    };
  })();

  return section2ModelAssetsPromise;
}

function createStartupDependencyPromise() {
  return Promise.all([
    preloadCriticalLibraries(),
    preloadFonts(),
    preloadPageImages(),
    preloadSection2ModelAssets(),
    ensureSectionOneWaveController({ startPaused: true }).then((controller) => controller?.ready ?? null)
  ]);
}

function ensureSectionOneWaveController({ startPaused = true } = {}) {
  if (!introWaveViz || !introStage) {
    return Promise.resolve(null);
  }
  if (sectionOneWaveControllerPromise) {
    return sectionOneWaveControllerPromise;
  }
  sectionOneWaveControllerPromise = initSectionOneProceduralWave({
    host: introWaveViz,
    pointerTarget: introStage,
    startPaused
  })
    .then((controller) => {
      sectionOneWaveController = controller;
      return controller;
    })
    .catch((error) => {
      sectionOneWaveControllerPromise = null;
      throw error;
    });
  return sectionOneWaveControllerPromise;
}

function syncSectionOneWavePlayback() {
  if (!sectionOneWaveController || !sectionOneWaveVisibilityReady) {
    return;
  }
  const canRun =
    loaderRevealStarted &&
    sectionOneWaveIsVisible &&
    document.visibilityState === 'visible';
  if (!canRun) {
    sectionOneWaveController.pause();
    sectionOneWaveNeedsRestart = true;
    return;
  }
  if (sectionOneWaveNeedsRestart) {
    sectionOneWaveController.restart();
    sectionOneWaveNeedsRestart = false;
    return;
  }
  sectionOneWaveController.resume();
}

function updateSectionOneWaveVisibilityFromTrackPosition(currentY) {
  sectionOneWaveVisibilityReady = true;
  sectionOneWaveIsVisible = currentY > -window.innerHeight;
  syncSectionOneWavePlayback();
}

function initSectionOneWaveLifecycle() {
  if (!section1) {
    return;
  }
  document.addEventListener('visibilitychange', syncSectionOneWavePlayback);
  const initialY = Number(gsap.getProperty(snapTrack, 'y')) || 0;
  updateSectionOneWaveVisibilityFromTrackPosition(initialY);
}

function createStartupLoaderController(onHappyMoveStart, onHappyRevealStart) {
  if (!startupLoader) {
    return null;
  }

  const FULL_TEXT = 'sujaykumar';
  const LEFT_TEXT = 'sujay';
  const RIGHT_TEXT = 'kumar';
  const FONT_SIZE = 34;
  const PADDING_X = 7;
  const PADDING_Y = 7;
  const HANDLE_SIZE = 8;
  const CARET_WIDTH = 2;
const MIN_BOX_WIDTH = 24;
const STEP_DELAY = 500;
const INITIAL_DELAY = 0;
const HOLD_AFTER_TYPING = 180;
const PRE_RESIZE_MOVE = 180;
const PRE_COLLAPSE_DELAY = 180;
const COLLAPSE_DURATION = 150;
const POST_SHRINK_DELAY = 180;
  const RESIZE_CURSOR_HOLD = 120;
  const POINTER_TO_CENTER_DURATION = 180;
  const SHADOW_START_DELAY = 120;
  const SHADOW_IN_DURATION = 120;
  const POST_SHADOW_DELAY = 120;
  const POST_DRAG_DELAY = 120;
  const DRAG_DURATION = 520;
  const SHADOW_OUT_DURATION = 120;
  const POINTER_EXIT_DELAY = 300;
  const POINTER_EXIT_DURATION = 180;
  const OUTLINE_FADE_DELAY = STEP_DELAY;
  const OUTLINE_FADE_DURATION = 140;
  const GROW_DURATION = 140;
  const PENDING_DRAG_OUT_DURATION = 440;
  const PENDING_SNAP_BACK_DURATION = 180;
  const PENDING_RETURN_TO_CENTER_DURATION = 160;
  const PENDING_HOLD_AFTER_SNAP = 300;
  const PENDING_HOLD_AT_CENTER = 300;
  const PENDING_HOLD_AT_SLIP = 300;
  const PENDING_TRAVEL_RATIO = 0.22;
  const PENDING_POINTER_SLIP_RATIO = 0.72;

  const boxShadow = document.getElementById('startup-loader-box-shadow');
  const boxWrap = document.getElementById('startup-loader-box-wrap');
  const box = document.getElementById('startup-loader-box');
  const content = document.getElementById('startup-loader-content');
  const mask = document.getElementById('startup-loader-mask');
  const maskGroup = document.getElementById('startup-loader-mask-group');
  const maskLeft = document.getElementById('startup-loader-mask-left');
  const maskRight = document.getElementById('startup-loader-mask-right');
  const typing = document.getElementById('startup-loader-typing');
  const typingText = document.getElementById('startup-loader-typing-text');
  const caret = document.getElementById('startup-loader-caret');
  const cursor = document.getElementById('startup-loader-cursor');
  const brandLoaderSlot = document.getElementById('brand-loader-slot');
  const measureNode = document.getElementById('startup-loader-measure');
  const stage = startupLoader.querySelector('.startup-loader-stage');
  const handles = Array.from(startupLoader.querySelectorAll('.startup-loader-handle'));

  let loaderMode = 'pending';
  let typedCount = 0;
  let phase = 'idle';
  let showCaret = true;
  let animatedWidth = MIN_BOX_WIDTH;
  let pointerCenterStart = null;
  let shadowInStart = null;
  let dragStart = null;
  let shadowOutStart = null;
  let pointerExitStart = null;
  let outlineFadeStart = null;
  let pendingOutStart = null;
  let pendingBackStart = null;
  let pendingReturnCenterStart = null;
  let preResizeStart = null;
  let nowTick = 0;
  let isDisposed = false;
  let rafId = 0;
  let widthRafId = 0;
  let caretInterval = 0;
  const timers = [];

  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  const measureText = (text) => {
    if (!measureContext) {
      return 0;
    }
    measureContext.font = `${FONT_SIZE}px Inter, Arial, Helvetica, sans-serif`;
    return measureContext.measureText(text).width;
  };

  const measureRenderedText = (text) => {
    if (!measureNode) {
      return Math.ceil(measureText(text));
    }
    measureNode.textContent = text || '';
    return Math.ceil(measureNode.getBoundingClientRect().width);
  };

  const fullTextWidth = measureRenderedText(FULL_TEXT);
  const leftTextWidth = measureRenderedText(LEFT_TEXT);
  const rightTextWidth = measureRenderedText(RIGHT_TEXT);
  const sWidth = Math.ceil(Math.max(1, measureRenderedText('s') - 1));
  const kWidth = Math.ceil(Math.max(1, measureRenderedText('k') - 4));
  const boxHeight = FONT_SIZE + PADDING_Y * 2 + 4;
  const collapsedWidth = Math.ceil(sWidth + kWidth + PADDING_X * 2);
  let resolveDone = null;
  const donePromise = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const clearTimers = () => {
    while (timers.length) {
      clearTimeout(timers.pop());
    }
  };

  const schedule = (fn, delay) => {
    const id = window.setTimeout(() => {
      const index = timers.indexOf(id);
      if (index >= 0) {
        timers.splice(index, 1);
      }
      fn();
    }, delay);
    timers.push(id);
    return id;
  };

  const setPhase = (nextPhase) => {
    phase = nextPhase;
    render();
  };

  const updateAnimatedWidth = (target, duration) => {
    if (widthRafId) {
      cancelAnimationFrame(widthRafId);
      widthRafId = 0;
    }
    if (!duration) {
      animatedWidth = target;
      return;
    }
    const startWidth = animatedWidth;
    const startTime = performance.now();
    const tick = (timestamp) => {
      const rawT = clamp((timestamp - startTime) / duration, 0, 1);
      const easedT = 1 - Math.pow(1 - rawT, 3);
      animatedWidth = Math.round(startWidth + (target - startWidth) * easedT);
      render();
      if (rawT < 1) {
        widthRafId = requestAnimationFrame(tick);
      }
    };
    widthRafId = requestAnimationFrame(tick);
  };

  const refreshWidth = () => {
    const maskedPhases = new Set([
      'collapse',
      'pointerCenter',
      'centerHold',
      'shadowIn',
      'drag',
      'dragHold',
      'pendingOut',
      'pendingBack',
      'pendingReturnCenter',
      'pendingCenterHold',
      'shadowOut',
      'pointerExit',
      'outlineFade',
      'done'
    ]);
    const typedText = FULL_TEXT.slice(0, typedCount);
    const displayText = maskedPhases.has(phase) ? FULL_TEXT : typedText;
    const measuredDisplayWidth = measureRenderedText(displayText);
    const targetWidth = displayText.length > 0 ? measuredDisplayWidth + PADDING_X * 2 : MIN_BOX_WIDTH;
    const endWidth = maskedPhases.has(phase) ? collapsedWidth : targetWidth;
    const duration = phase === 'collapse' ? COLLAPSE_DURATION : phase === 'typing' ? GROW_DURATION : 0;
    updateAnimatedWidth(endWidth, duration);
  };

  const beginFinish = () => {
    schedule(() => {
      setPhase('dragHold');
      schedule(() => {
        shadowOutStart = performance.now();
        setPhase('shadowOut');
        schedule(() => {
          pointerExitStart = performance.now();
          setPhase('pointerExit');
          schedule(() => {
            if (typeof onHappyRevealStart === 'function') {
              onHappyRevealStart();
            }
            outlineFadeStart = performance.now();
            setPhase('outlineFade');
            schedule(() => {
              setPhase('done');
              if (resolveDone) {
                resolveDone();
              }
            }, OUTLINE_FADE_DURATION);
          }, OUTLINE_FADE_DELAY);
        }, POINTER_EXIT_DELAY);
      }, POST_DRAG_DELAY);
    }, DRAG_DURATION);
  };

  const runPendingLoop = () => {
    schedule(() => {
      pendingOutStart = performance.now();
      setPhase('pendingOut');
      schedule(() => {
        pendingBackStart = performance.now();
        setPhase('pendingBack');
        schedule(() => {
          pendingReturnCenterStart = performance.now();
          setPhase('pendingReturnCenter');
          schedule(() => {
            setPhase('pendingCenterHold');
            schedule(() => {
              if (loaderMode === 'happy') {
                dragStart = performance.now();
                setPhase('drag');
                beginFinish();
                return;
              }
              shadowInStart = performance.now();
              setPhase('shadowIn');
              runPendingLoop();
            }, PENDING_HOLD_AT_CENTER);
          }, PENDING_RETURN_TO_CENTER_DURATION);
        }, PENDING_HOLD_AFTER_SNAP);
      }, PENDING_DRAG_OUT_DURATION + PENDING_HOLD_AT_SLIP);
    }, SHADOW_IN_DURATION + POST_SHADOW_DELAY);
  };

  const start = () => {
    startupLoader.classList.remove('is-hidden');
    caretInterval = window.setInterval(() => {
      showCaret = !showCaret;
      render();
    }, 530);

    schedule(() => {
      setPhase('typing');
      let index = 0;
      const typeNext = () => {
        index += 1;
        typedCount = index;
        refreshWidth();
        render();
        if (index < FULL_TEXT.length) {
          schedule(typeNext, index <= 3 ? 70 : index <= 7 ? 40 : 32);
          return;
        }
        schedule(() => {
          preResizeStart = performance.now();
          setPhase('preResize');
          schedule(() => {
            setPhase('collapse');
            refreshWidth();
            schedule(() => {
              pointerCenterStart = performance.now();
              setPhase('pointerCenter');
              schedule(() => {
                setPhase('centerHold');
                schedule(() => {
                  shadowInStart = performance.now();
                  setPhase('shadowIn');
                  schedule(() => {
                    if (loaderMode === 'happy') {
                      if (typeof onHappyMoveStart === 'function') {
                        onHappyMoveStart();
                      }
                      dragStart = performance.now();
                      setPhase('drag');
                      beginFinish();
                    } else {
                      runPendingLoop();
                    }
                  }, SHADOW_IN_DURATION + POST_SHADOW_DELAY);
                }, SHADOW_START_DELAY);
              }, POINTER_TO_CENTER_DURATION);
            }, COLLAPSE_DURATION + POST_SHRINK_DELAY + RESIZE_CURSOR_HOLD);
          }, PRE_RESIZE_MOVE + PRE_COLLAPSE_DELAY);
        }, HOLD_AFTER_TYPING);
      };
      typeNext();
    }, INITIAL_DELAY);

    const tick = () => {
      nowTick = performance.now();
      render();
      if (!isDisposed && phase !== 'done') {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    render();
  };

  const render = () => {
    if (isDisposed || !stage || !boxWrap || !box || !content || !cursor) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const stageWidth = stageRect.width || window.innerWidth || 760;
    const stageHeight = stageRect.height || window.innerHeight || 220;
    const centeredBoxX = (stageWidth - animatedWidth) / 2;
    const centeredBoxY = (stageHeight - boxHeight) / 2;
    const slotRect = brandLoaderSlot
      ? brandLoaderSlot.getBoundingClientRect()
      : { left: 24, top: 24, width: 52, height: 52 };
    const boxEndX = slotRect.left - stageRect.left;
    const boxEndY = slotRect.top - stageRect.top + BRAND_LOADER_DOCK_OFFSET_Y;
    const logoFinalX = boxEndX - 8;
    const logoFinalY = boxEndY - 2;
    const pointerIdleGap = 18;
    const pendingTargetX = centeredBoxX + (boxEndX - centeredBoxX) * PENDING_TRAVEL_RATIO;
    const pendingTargetY = centeredBoxY + (boxEndY - centeredBoxY) * PENDING_TRAVEL_RATIO;

    const preResizeProgress = preResizeStart ? clamp((nowTick - preResizeStart) / PRE_RESIZE_MOVE, 0, 1) : 0;
    const pointerCenterProgress = pointerCenterStart ? clamp((nowTick - pointerCenterStart) / POINTER_TO_CENTER_DURATION, 0, 1) : 0;
    const shadowInProgress = shadowInStart ? clamp((nowTick - shadowInStart) / SHADOW_IN_DURATION, 0, 1) : 0;
    const dragProgress = dragStart ? clamp((nowTick - dragStart) / DRAG_DURATION, 0, 1) : 0;
    const pendingOutProgress = pendingOutStart ? clamp((nowTick - pendingOutStart) / PENDING_DRAG_OUT_DURATION, 0, 1) : 0;
    const pendingBackProgress = pendingBackStart ? clamp((nowTick - pendingBackStart) / PENDING_SNAP_BACK_DURATION, 0, 1) : 0;
    const pendingReturnProgress = pendingReturnCenterStart ? clamp((nowTick - pendingReturnCenterStart) / PENDING_RETURN_TO_CENTER_DURATION, 0, 1) : 0;
    const shadowOutProgress = shadowOutStart ? clamp((nowTick - shadowOutStart) / SHADOW_OUT_DURATION, 0, 1) : 0;
    const pointerExitProgress = pointerExitStart ? clamp((nowTick - pointerExitStart) / POINTER_EXIT_DURATION, 0, 1) : 0;
    const outlineFadeProgress = outlineFadeStart ? clamp((nowTick - outlineFadeStart) / OUTLINE_FADE_DURATION, 0, 1) : 0;

    const easeInOutCubic = (value) =>
      value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const preResizeEase = easeInOutCubic(preResizeProgress);
    const pointerCenterEase = easeInOutCubic(pointerCenterProgress);
    const dragEase = easeInOutCubic(dragProgress);
    const pendingOutEase = easeInOutCubic(pendingOutProgress);
    const pendingBackEase = easeInOutCubic(pendingBackProgress);
    const pendingReturnEase = easeInOutCubic(pendingReturnProgress);
    const pointerExitEase = easeInOutCubic(pointerExitProgress);

    let shadowLift = 0;
    if (phase === 'shadowIn') {
      shadowLift = shadowInProgress;
    } else if (phase === 'drag' || phase === 'dragHold' || phase === 'pendingOut') {
      shadowLift = 1;
    } else if (phase === 'pendingBack') {
      shadowLift = 1 - pendingBackEase;
    } else if (phase === 'shadowOut' || phase === 'pointerExit' || phase === 'outlineFade' || phase === 'done') {
      shadowLift = 1 - shadowOutProgress;
    }
    shadowLift = clamp(shadowLift, 0, 1);
    const shadowDistance = Math.round(shadowLift * 8);
    const shadowOpacity = shadowLift * 0.6;

    let dragBoxX = centeredBoxX;
    let dragBoxY = centeredBoxY;
    if (phase === 'drag' || phase === 'dragHold' || phase === 'shadowOut' || phase === 'pointerExit' || phase === 'outlineFade' || phase === 'done') {
      dragBoxX = centeredBoxX + (boxEndX - centeredBoxX) * dragEase;
      dragBoxY = centeredBoxY + (boxEndY - centeredBoxY) * dragEase;
    } else if (phase === 'pendingOut') {
      dragBoxX = centeredBoxX + (pendingTargetX - centeredBoxX) * pendingOutEase;
      dragBoxY = centeredBoxY + (pendingTargetY - centeredBoxY) * pendingOutEase;
    } else if (phase === 'pendingBack') {
      dragBoxX = pendingTargetX + (centeredBoxX - pendingTargetX) * pendingBackEase;
      dragBoxY = pendingTargetY + (centeredBoxY - pendingTargetY) * pendingBackEase;
    }

    let elevationX = 0;
    let elevationY = 0;
    if (phase === 'shadowIn' || phase === 'drag' || phase === 'dragHold' || phase === 'pendingOut') {
      elevationX = -shadowDistance;
      elevationY = -shadowDistance;
    } else if (phase === 'pendingBack') {
      elevationX = -8 + 8 * pendingBackEase;
      elevationY = -8 + 8 * pendingBackEase;
    } else if (phase === 'shadowOut' || phase === 'pointerExit' || phase === 'outlineFade' || phase === 'done') {
      elevationX = -Math.max(0, shadowDistance);
      elevationY = -Math.max(0, shadowDistance);
    }

    const boxX = dragBoxX + elevationX;
    const boxY = dragBoxY + elevationY;
    const outlineOpacity = phase === 'outlineFade' || phase === 'done' ? 1 - outlineFadeProgress : 1;

    boxWrap.style.left = `${boxX}px`;
    boxWrap.style.top = `${boxY}px`;
    boxWrap.style.filter = shadowLift > 0
      ? `drop-shadow(${shadowDistance}px ${shadowDistance}px 0 rgba(0, 0, 0, ${shadowOpacity.toFixed(3)}))`
      : 'none';
    box.style.width = `${animatedWidth}px`;
    box.style.height = `${boxHeight}px`;
    box.style.borderColor = `rgba(255, 255, 255, ${(0.85 * outlineOpacity).toFixed(3)})`;
    box.style.boxShadow = `inset 0 0 0 0.5px rgba(255, 255, 255, ${(0.3 * outlineOpacity).toFixed(3)})`;
    handles.forEach((handle) => {
      handle.style.opacity = outlineOpacity.toFixed(3);
      handle.style.borderColor = `rgba(255, 255, 255, ${outlineOpacity.toFixed(3)})`;
    });
    boxShadow.style.left = `${boxX}px`;
    boxShadow.style.top = `${boxY}px`;
    boxShadow.style.width = `${animatedWidth}px`;
    boxShadow.style.height = `${boxHeight}px`;
    boxShadow.style.opacity = '0';
    boxShadow.style.boxShadow = 'none';
    boxShadow.style.filter = 'none';

    const maskedPhases = new Set([
      'collapse',
      'pointerCenter',
      'centerHold',
      'shadowIn',
      'drag',
      'dragHold',
      'pendingOut',
      'pendingBack',
      'pendingReturnCenter',
      'pendingCenterHold',
      'shadowOut',
      'pointerExit',
      'outlineFade',
      'done'
    ]);
    const isMaskedView = maskedPhases.has(phase);
    const typedText = FULL_TEXT.slice(0, typedCount);
    const displayText = isMaskedView ? FULL_TEXT : typedText;
    typingText.textContent = typedText;
    const renderedTypingWidth = typedText.length > 0 ? measureRenderedText(typedText) : 0;
    const typingContainerWidth = typedText.length > 0
      ? renderedTypingWidth
      : Math.max(0, animatedWidth - PADDING_X * 2);
    const caretOffset = typedText.length > 0
      ? renderedTypingWidth
      : Math.round(typingContainerWidth / 2);

    typing.style.display = isMaskedView ? 'none' : 'block';
    mask.style.display = isMaskedView ? 'block' : 'none';
    typing.style.width = `${typingContainerWidth}px`;
    typingText.style.minWidth = '0px';
    caret.style.opacity = showCaret ? '1' : '0';
    caret.style.left = `${caretOffset}px`;
    caret.style.top = typedText.length > 0 ? '1px' : `${(FONT_SIZE - 2) / 2}px`;
    caret.style.transform = typedText.length > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)';

    const innerWidth = Math.max(0, animatedWidth - PADDING_X * 2);
    const currentLeftMaskWidth = clamp(innerWidth * (leftTextWidth / (leftTextWidth + rightTextWidth)), sWidth, leftTextWidth);
    const currentRightMaskWidth = clamp(innerWidth * (rightTextWidth / (leftTextWidth + rightTextWidth)), kWidth, rightTextWidth);
    const groupNaturalWidth = currentLeftMaskWidth + currentRightMaskWidth;
    const centeredOffset = Math.max(0, (innerWidth - groupNaturalWidth) / 2);
    maskGroup.style.left = `${centeredOffset}px`;
    maskLeft.textContent = LEFT_TEXT;
    maskRight.textContent = RIGHT_TEXT;
    maskLeft.style.width = `${currentLeftMaskWidth}px`;
    maskRight.style.width = `${currentRightMaskWidth}px`;

    const rightEdgeX = boxX + animatedWidth;
    const rightEdgeY = boxY + boxHeight / 2;
    const boxCenterX = boxX + animatedWidth / 2;
    const boxCenterY = boxY + boxHeight / 2;
    const boxBottomCenterX = boxX + animatedWidth / 2;
    const boxBottomCenterY = boxY + boxHeight + pointerIdleGap;
    const pendingPointerSlipX = boxCenterX + (boxEndX + animatedWidth / 2 - boxCenterX) * PENDING_POINTER_SLIP_RATIO;
    const pendingPointerSlipY = boxCenterY + (boxEndY + boxHeight / 2 - boxCenterY) * PENDING_POINTER_SLIP_RATIO;
    const pendingFixedPointerX = pendingTargetX - 8 + animatedWidth / 2;
    const pendingFixedPointerY = pendingTargetY - 8 + boxHeight / 2;

    let cursorMode = 'arrow';
    let cursorOpacity = phase === 'idle' ? 0 : 1;
    let cursorX = boxBottomCenterX;
    let cursorY = boxBottomCenterY;
    let cursorTransform = 'translate(-20%, -20%)';

    if (phase === 'preResize') {
      cursorX = boxBottomCenterX + (rightEdgeX - boxBottomCenterX) * preResizeEase;
      cursorY = boxBottomCenterY + (rightEdgeY - boxBottomCenterY) * preResizeEase;
      cursorMode = preResizeProgress > 0.92 ? 'resize' : 'arrow';
      cursorTransform = 'translate(-50%, -50%)';
    } else if (phase === 'collapse') {
      cursorMode = 'resize';
      cursorX = rightEdgeX;
      cursorY = rightEdgeY;
      cursorTransform = 'translate(-50%, -50%)';
    } else if (phase === 'pointerCenter') {
      cursorX = rightEdgeX + (boxCenterX - rightEdgeX) * pointerCenterEase;
      cursorY = rightEdgeY + (boxCenterY - rightEdgeY) * pointerCenterEase;
    } else if (phase === 'centerHold' || phase === 'shadowIn' || phase === 'drag' || phase === 'dragHold' || phase === 'pendingCenterHold' || phase === 'shadowOut') {
      cursorX = boxCenterX;
      cursorY = boxCenterY;
    } else if (phase === 'pendingOut') {
      cursorX = boxCenterX + (pendingPointerSlipX - boxCenterX) * pendingOutEase;
      cursorY = boxCenterY + (pendingPointerSlipY - boxCenterY) * pendingOutEase;
    } else if (phase === 'pendingBack') {
      cursorX = pendingPointerSlipX + (pendingFixedPointerX - pendingPointerSlipX) * pendingBackEase;
      cursorY = pendingPointerSlipY + (pendingFixedPointerY - pendingPointerSlipY) * pendingBackEase;
    } else if (phase === 'pendingReturnCenter') {
      cursorX = pendingFixedPointerX + (boxCenterX - pendingFixedPointerX) * pendingReturnEase;
      cursorY = pendingFixedPointerY + (boxCenterY - pendingFixedPointerY) * pendingReturnEase;
    } else if (phase === 'pointerExit' || phase === 'outlineFade' || phase === 'done') {
      cursorX = boxCenterX + (logoFinalX - boxCenterX) * pointerExitEase;
      cursorY = boxCenterY + (logoFinalY - boxCenterY) * pointerExitEase;
      cursorTransform = 'translate(0, 0)';
    }

    startupLoader.classList.toggle('is-resize-cursor', cursorMode === 'resize');
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    cursor.style.opacity = `${cursorOpacity}`;
    cursor.style.transform = cursorTransform;
  };

  const markReady = () => {
    loaderMode = 'happy';
  };

  const dispose = () => {
    isDisposed = true;
    clearTimers();
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    if (widthRafId) {
      cancelAnimationFrame(widthRafId);
    }
    if (caretInterval) {
      clearInterval(caretInterval);
    }
  };

  start();

  return {
    markReady,
    dispose,
    dockFinalFrame() {
      if (!brandLoaderSlot || !boxWrap || !cursor || !boxShadow) {
        return;
      }
      brandLoaderSlot.appendChild(boxShadow);
      brandLoaderSlot.appendChild(boxWrap);
      brandLoaderSlot.appendChild(cursor);
      boxShadow.style.display = 'none';
      boxWrap.style.left = '0';
      boxWrap.style.top = '0';
      boxWrap.style.filter = 'drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.52))';
      cursor.style.left = '-8px';
      cursor.style.top = '-2px';
      cursor.style.transform = 'translate(0, 0)';
      cursor.style.opacity = '1';
    },
    donePromise
  };
}

function startCoreApp() {
  if (appBooted || !window.gsap || !introWords.length) {
    return;
  }
  appBooted = true;
  updateIntroLine1TailOffset();
  ensureSectionOneWaveController({ startPaused: true })
    .then(() => {
      syncSectionOneWavePlayback();
    })
    .catch((error) => {
      console.warn('Section 1 procedural wave failed to initialize.', error);
    });
  initSectionOneWaveLifecycle();
  renderFinalHorizonSection();
  refreshFinalHorizonSnapPoints();
  goToFinalHorizonCard(0, true);
  renderSectionTransitionShape();
  initSectionAnimations();
  initBitcountChars();
  initOutlineSvgKeywords();
  gsap.set(introWords, { autoAlpha: 0, y: 14 });
  gsap.to(introWords, {
    autoAlpha: 1,
    y: 0,
    duration: 0.48,
    ease: 'power2.out',
    stagger: 0.07
  });
  initBitcountLens();
  initSection2FillTargets();
  initSection2Model();
  initSnapScroll();
  scheduleSectionMorphHint();
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    document.fonts.ready.then(() => {
      updateIntroLine1TailOffset();
    });
  }
  window.addEventListener('resize', updateIntroLine1TailOffset);
}

function startLoaderReveal() {
  if (loaderRevealStarted) {
    return;
  }
  loaderRevealStarted = true;
  document.body.classList.remove('app-loading');
  if (startupLoader) {
    startupLoader.classList.add('is-receding');
  }
  startCoreApp();
}

function revealApp(loaderController) {
  if (appRevealed) {
    return;
  }
  appRevealed = true;
  startLoaderReveal();
  syncSectionOneWavePlayback();
  document.body.classList.add('loader-logo-active');
  if (loaderController) {
    loaderController.dockFinalFrame();
  }
  if (startupLoader) {
    startupLoader.classList.add('is-hidden');
  }
  startCoreApp();
}

async function init() {
  let loaderController =
    window.__activeStartupLoaderController || window.__startupLoaderController || null;
  if (loaderController?.setCallbacks) {
    loaderController.setCallbacks(
      () => {
        startLoaderReveal();
      },
      () => {
        revealApp(loaderController);
      }
    );
  } else {
    loaderController = createStartupLoaderController(
      () => {
        startLoaderReveal();
      },
      () => {
        revealApp(loaderController);
      }
    );
    if (loaderController) {
      window.__activeStartupLoaderController = loaderController;
      window.__startupLoaderController = loaderController;
    }
  }
  if (!loaderController) {
    startCoreApp();
    return;
  }

  const dependencyPromise = createStartupDependencyPromise()
    .then(() => {
      loaderController.markReady();
      return true;
    })
    .catch((error) => {
      console.warn('Startup dependencies did not fully resolve before loader timeout.', error);
      return null;
    });

  window.setTimeout(() => {
    loaderController.markReady();
  }, STARTUP_LOADER_TIMEOUT_MS);

  loaderController.donePromise.then(() => {
    revealApp(loaderController);
  });

  await loaderController.donePromise;
  revealApp(loaderController);
  await dependencyPromise;
}

async function initSection2Model() {
  if (!section2ModelMount) {
    return;
  }
  try {
    const section2About = section2ModelMount.closest('.folio-about');
    const grid = section2About?.querySelector('#section2-grid') || null;
    const pathLayer = section2ModelMount.querySelector('#section2-path-layer');
    const modelView = section2ModelMount.querySelector('#section2-model-view');
    const cards = Array.from(section2ModelMount.querySelectorAll('.section2-card'));
    if (!grid || !pathLayer || !modelView || !cards.length || !window.gsap) {
      return;
    }

    const assets = await preloadSection2ModelAssets();
    if (!assets) {
      return;
    }
    const { THREE, RoomEnvironment, gltf } = assets;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.25, 11.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, SECTION2_MODEL_RENDER_PIXEL_RATIO_CAP));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    renderer.setClearColor(0x000000, 0);
    modelView.replaceChildren(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.015).texture;
    scene.environment = envMap;

    const keyLight = new THREE.DirectionalLight(0xf3d7ff, 0.95);
    keyLight.position.set(5, 5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8a43ff, 0.78);
    rimLight.position.set(-4, 3, -5);
    scene.add(rimLight);

    const fillLight = new THREE.AmbientLight(0x2a1840, 0.34);
    scene.add(fillLight);

    const modelGroup = new THREE.Group();
    const modelTiltGroup = new THREE.Group();
    const modelSpinGroup = new THREE.Group();
    modelGroup.add(modelTiltGroup);
    modelTiltGroup.add(modelSpinGroup);
    scene.add(modelGroup);
    let modelRoot = null;
    let baseScale = 1;

    const reflectiveMaterial = createPointerMaterial(THREE);
    const root = gltf.scene;
    modelRoot = root;
    root.traverse((node) => {
      if (!node.isMesh) {
        return;
      }
      node.material = reflectiveMaterial.clone();
      node.material.needsUpdate = true;
      node.castShadow = false;
      node.receiveShadow = false;
    });

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z, 1);
    baseScale = (7 / maxAxis) * 0.4;
    root.scale.setScalar(baseScale);
    root.position.sub(center.multiplyScalar(baseScale));
    modelTiltGroup.rotation.z = SECTION2_MODEL_BASE_TILT_Z;
    modelSpinGroup.add(root);

    const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));
    const mixValue = (a, b, t) => a + ((b - a) * t);
    const smoothstepValue = (edge0, edge1, value) => {
      const t = clampValue((value - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - (2 * t));
    };
    const easeOutCubic = (value) => 1 - ((1 - value) ** 3);
    const lerpAngle = (from, to, alpha) => {
      const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
      return from + delta * alpha;
    };
    const getHandlePosition = (node, type) => {
      const angle = type === 'in' ? node.inAngle : node.outAngle;
      const length = type === 'in' ? node.inLength : node.outLength;
      return {
        x: node.x + Math.cos(angle) * length,
        y: node.y + Math.sin(angle) * length
      };
    };
    const getBezierPoint = (progress) => {
      const nodes = SECTION2_DEFAULT_PATH_NODES;
      if (!nodes.length) {
        return { x: 0, y: 0, angle: 0 };
      }
      if (nodes.length === 1) {
        return { x: nodes[0].x, y: nodes[0].y, angle: 0 };
      }
      const segmentCount = nodes.length - 1;
      const scaled = clampValue(progress, 0, 0.999999) * segmentCount;
      const index = Math.floor(scaled);
      const t = scaled - index;
      const current = nodes[index];
      const next = nodes[index + 1];
      const cp1 = getHandlePosition(current, 'out');
      const cp2 = getHandlePosition(next, 'in');
      const inv = 1 - t;
      const x =
        (inv ** 3) * current.x +
        3 * (inv ** 2) * t * cp1.x +
        3 * inv * (t ** 2) * cp2.x +
        (t ** 3) * next.x;
      const y =
        (inv ** 3) * current.y +
        3 * (inv ** 2) * t * cp1.y +
        3 * inv * (t ** 2) * cp2.y +
        (t ** 3) * next.y;
      const dx =
        3 * (inv ** 2) * (cp1.x - current.x) +
        6 * inv * t * (cp2.x - cp1.x) +
        3 * (t ** 2) * (next.x - cp2.x);
      const dy =
        3 * (inv ** 2) * (cp1.y - current.y) +
        6 * inv * t * (cp2.y - cp1.y) +
        3 * (t ** 2) * (next.y - cp2.y);
      return {
        x,
        y,
        angle: Math.atan2(dy, dx)
      };
    };
    const getDistanceToRect = (pointX, pointY, rect) => {
      const dx = Math.max(rect.left - pointX, 0, pointX - rect.right);
      const dy = Math.max(rect.top - pointY, 0, pointY - rect.bottom);
      return Math.hypot(dx, dy);
    };

    const cardTiltSetters = cards.map((card) => {
      const cardShell = card.querySelector('.section2-card-shell');
      const cardContent = card.querySelector('.section2-card-content');
      return {
        shellRotateX: window.gsap.quickTo(cardShell, 'rotationX', { duration: 0.25, ease: 'power3.out' }),
        shellRotateY: window.gsap.quickTo(cardShell, 'rotationY', { duration: 0.25, ease: 'power3.out' }),
        shellZ: window.gsap.quickTo(cardShell, 'z', { duration: 0.28, ease: 'power3.out' }),
        contentX: window.gsap.quickTo(cardContent, 'x', { duration: 0.28, ease: 'power3.out' }),
        contentY: window.gsap.quickTo(cardContent, 'y', { duration: 0.28, ease: 'power3.out' })
      };
    });

    const resetInactiveCardTilt = (activeCardIndex) => {
      cardTiltSetters.forEach((setters, index) => {
        if (index === activeCardIndex) {
          return;
        }
        setters.shellRotateX(0);
        setters.shellRotateY(0);
        setters.shellZ(0);
        setters.contentX(0);
        setters.contentY(0);
      });
    };
    const applyCardTiltFromObject = (cardIndex, cardRect, objectX, objectY) => {
      if (cardIndex < 0) {
        return;
      }
      const setters = cardTiltSetters[cardIndex];
      const px = clampValue((objectX - cardRect.left) / cardRect.width, 0, 1);
      const py = clampValue((objectY - cardRect.top) / cardRect.height, 0, 1);
      setters.shellRotateX(mixValue(SECTION2_CARD_TILT_RANGE, -SECTION2_CARD_TILT_RANGE, py));
      setters.shellRotateY(mixValue(-SECTION2_CARD_TILT_RANGE, SECTION2_CARD_TILT_RANGE, px));
      setters.shellZ(26);
      setters.contentX(mixValue(-SECTION2_CARD_SHIFT_RANGE, SECTION2_CARD_SHIFT_RANGE, px));
      setters.contentY(mixValue(-SECTION2_CARD_SHIFT_RANGE, SECTION2_CARD_SHIFT_RANGE, py));
    };

    const resize = () => {
      const width = Math.max(1, modelView.clientWidth);
      const height = Math.max(1, modelView.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      refreshSection2ModelVisibility();
    });
    resizeObserver.observe(section2ModelMount);
    resize();

    const animationLoop = () => {
      const nowTs = performance.now();
      const dt = Math.max(0, Math.min((nowTs - (section2ModelScene?.lastFrameTime || nowTs)) / 1000, 0.05));
      if (section2ModelScene) {
        section2ModelScene.lastFrameTime = nowTs;
      }
      if (modelSpinGroup) {
        const now = performance.now();
        const isScrollDriving = now - (section2ModelScene?.lastScrollAt || 0) < AUTOPLAY_RESUME_DELAY_MS;
        const scrollSpin = section2ModelScene?.scrollSpinVelocity || 0;
        const spinVelocity = isScrollDriving ? scrollSpin : SECTION2_MODEL_DEFAULT_SPIN;
        modelSpinGroup.rotation.y += dt * spinVelocity;
      }

      const whiteComplete = SNAP_STATE.section2WhiteFillProgress >= 0.999;
      const rawProgress = whiteComplete ? SNAP_STATE.section2InteractionProgress : 0;

      section2ModelScene.rawProgress = rawProgress;
      section2ModelScene.displayProgress += (rawProgress - section2ModelScene.displayProgress) * 0.1;

      grid.style.transform =
        `translate3d(0, ${(-section2ModelScene.displayProgress * SECTION2_GRID_SCROLL_FACTOR).toFixed(2)}px, 0)`;

      const point = getBezierPoint(section2ModelScene.displayProgress);
      const centerY = section2ModelMount.clientHeight * 0.5;
      const translateY = centerY - point.y;
      pathLayer.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;

      section2ModelScene.modelX = point.x;
      section2ModelScene.modelY = centerY;
      section2ModelScene.pathAngle = point.angle;
      section2ModelScene.viewerRotation = lerpAngle(
        section2ModelScene.viewerRotation,
        point.angle,
        SECTION2_MODEL_VIEWER_ALIGN_LERP
      );
      const scrollingUp = section2ModelScene.scrollSpinVelocity < 0;
      const targetFlipRotation = SECTION2_MODEL_BASE_TILT_Z + (scrollingUp ? Math.PI : 0);
      section2ModelScene.directionFlipRotation = lerpAngle(
        section2ModelScene.directionFlipRotation,
        targetFlipRotation,
        SECTION2_MODEL_DIRECTION_FLIP_LERP
      );
      modelTiltGroup.rotation.z = section2ModelScene.directionFlipRotation;
      modelGroup.position.x = Math.cos(point.angle) * 0.12;
      modelGroup.position.y = Math.sin(point.angle) * 0.12;
      modelView.style.transform =
        `translate(${point.x.toFixed(2)}px, ${centerY.toFixed(2)}px) translate(-50%, -50%) rotate(${section2ModelScene.viewerRotation.toFixed(4)}rad)`;

      const interactionRect = section2ModelMount.getBoundingClientRect();
      const metrics = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        const localRect = {
          left: rect.left - interactionRect.left,
          right: rect.right - interactionRect.left,
          top: rect.top - interactionRect.top,
          bottom: rect.bottom - interactionRect.top,
          width: rect.width,
          height: rect.height
        };
        return {
          card,
          index,
          distanceToRect: getDistanceToRect(point.x, centerY, localRect),
          distanceToCenter: Math.hypot(
            point.x - (localRect.left + (localRect.width * 0.5)),
            centerY - (localRect.top + (localRect.height * 0.5))
          )
        };
      });

      if (section2ModelScene.activeCardIndex >= 0) {
        const currentMetric = metrics[section2ModelScene.activeCardIndex];
        if (!currentMetric || currentMetric.distanceToRect > SECTION2_CARD_ACTIVATION_EXIT_PX) {
          section2ModelScene.activeCardIndex = -1;
        }
      }

      if (section2ModelScene.activeCardIndex < 0) {
        const candidate = metrics
          .filter((metric) => metric.distanceToRect <= SECTION2_CARD_ACTIVATION_ENTER_PX)
          .sort((a, b) => a.distanceToCenter - b.distanceToCenter)[0];
        section2ModelScene.activeCardIndex = candidate ? candidate.index : -1;
      }

      metrics.forEach((metric) => {
        const distanceWindow =
          section2ModelScene.activeCardIndex === metric.index
            ? SECTION2_CARD_ACTIVATION_EXIT_PX
            : SECTION2_CARD_ACTIVATION_ENTER_PX;
        const activeAmount = smoothstepValue(distanceWindow, 0, metric.distanceToRect);
        metric.card.querySelector('.section2-card-fill').style.opacity = activeAmount.toFixed(3);
        metric.card.querySelector('.section2-card-glow').style.opacity = (activeAmount * 0.9).toFixed(3);
        metric.card.querySelector('h2').style.color = `rgba(255, 251, 241, ${activeAmount.toFixed(3)})`;
        metric.card.style.setProperty(
          '--section2-card-outline-opacity',
          (0.42 + (activeAmount * 0.58)).toFixed(3)
        );
        metric.card.classList.toggle(
          'is-active',
          section2ModelScene.activeCardIndex === metric.index && activeAmount > 0.02
        );
      });

      if (section2ModelScene.activeCardIndex >= 0) {
        const activeMetric = metrics[section2ModelScene.activeCardIndex];
        if (activeMetric) {
          const activeRect = activeMetric.card.getBoundingClientRect();
          const localActiveRect = {
            left: activeRect.left - interactionRect.left,
            top: activeRect.top - interactionRect.top,
            width: activeRect.width,
            height: activeRect.height
          };
          applyCardTiltFromObject(
            section2ModelScene.activeCardIndex,
            localActiveRect,
            point.x,
            centerY
          );
        }
      }

      resetInactiveCardTilt(section2ModelScene.activeCardIndex);
      renderer.render(scene, camera);
    };

    section2ModelScene = {
      renderer,
      resizeObserver,
      pmremGenerator,
      modelRoot,
      modelSpinGroup,
      modelTiltGroup,
      baseScale,
      isActive: SNAP_STATE.index === 1,
      scrollSpinVelocity: SECTION2_MODEL_DEFAULT_SPIN,
      lastScrollAt: 0,
      lastFrameTime: performance.now(),
      viewerRotation: 0,
      directionFlipRotation: SECTION2_MODEL_BASE_TILT_Z,
      displayProgress: 0,
      rawProgress: 0,
      modelX: 0,
      modelY: 0,
      pathAngle: 0,
      activeCardIndex: -1,
      animationLoop
    };
    if (section2ModelScene.isActive) {
      renderer.setAnimationLoop(animationLoop);
      animationLoop();
    }
    refreshSection2ModelVisibility();
  } catch (error) {
    console.error('Section 2 model failed to load.', error);
    const modelView = section2ModelMount.querySelector('#section2-model-view');
    if (modelView) {
      modelView.innerHTML = '';
    }
  }
}

function initSectionAnimations() {
  if (!animatedSections.length) {
    return;
  }

  animatedSections.forEach((section) => {
    const sectionIndex = Number(section.dataset.section || 0) - 1;
    const refs = prepareAnimatedSection(section);
    const state = createSectionAnimationState(sectionIndex, refs.totalDuration);
    state.refs = refs;
    state.apply = (progressSeconds) => {
      applyAnimatedSection(refs, progressSeconds);
    };
    state.reset = (options = {}) => {
      refs.keywordOrder = shuffleArray(refs.keywordOrderBase);
      setSectionAnimationProgress(state, 0, options);
    };
    sectionAnimationStates.set(sectionIndex, state);
    resetSectionAnimationState(state);
  });
}

function getAnimatedSectionRefsFromClone(section) {
  const refs = {
    year: section.querySelector('.folio-year'),
    logo: section.querySelector('.folio-brand img') || section.querySelector('.folio-brand-logo-text'),
    brandSub: section.querySelector('.folio-brand-sub'),
    statementLineInners: Array.from(section.querySelectorAll('.section3-line-inner')),
    statementAccentChars: Array.from(section.querySelectorAll('.section3-fill-char-overlay')),
    navItems: [],
    filledKeyword:
      section.querySelector('.folio-key-row .fill') || section.querySelector('.folio-key-row span'),
    keywordOrderBase: Array.from(section.querySelectorAll('.folio-key-row .outline')),
    keywordOrder: Array.from(section.querySelectorAll('.folio-key-row .outline')),
    totalDuration: 0,
    keywordStart: 0,
    statementFillStart: 0,
    statementFillEnd: 0,
    eases: {
      fade: window.gsap.parseEase('power2.out'),
      line: window.gsap.parseEase('expo.out'),
      nav: window.gsap.parseEase('back.out(1.2)')
    }
  };
  applyAnimatedSectionTiming(refs);
  return refs;
}

function applyAnimatedSectionTiming(refs) {
  const statementRevealEnd =
    SECTION3_TIMINGS.statementStart +
    SECTION3_TIMINGS.statementLineDuration +
    Math.max(0, refs.statementLineInners.length - 1) * SECTION3_TIMINGS.statementLineStagger;
  const statementFillStart = statementRevealEnd;
  const statementFillEnd = statementFillStart + SECTION3_TIMINGS.statementFillDuration;
  const navEnd =
    SECTION3_TIMINGS.navStart +
    SECTION3_TIMINGS.navDuration +
    Math.max(0, refs.navItems.length - 1) * SECTION3_TIMINGS.navStagger;
  const keywordStart = Math.max(
    SECTION3_TIMINGS.subStart + SECTION3_TIMINGS.fadeDuration,
    statementFillEnd,
    navEnd
  ) + SECTION3_TIMINGS.keywordDelay;
  const keywordTailEnd =
    keywordStart +
    SECTION3_TIMINGS.keywordFirstDuration +
    (refs.keywordOrder.length ? SECTION3_TIMINGS.keywordStagger * refs.keywordOrder.length : 0) +
    (refs.keywordOrder.length ? SECTION3_TIMINGS.keywordDuration : 0);

  refs.statementFillStart = statementFillStart;
  refs.statementFillEnd = statementFillEnd;
  refs.keywordStart = keywordStart;
  refs.totalDuration = keywordTailEnd + SECTION3_TIMINGS.endHold;
}

function initOutlineSvgKeywords() {
  const outlineSpans = Array.from(document.querySelectorAll('.folio-key-row .outline'));
  outlineSpans.forEach((span) => {
    if (!span.dataset.outlineText) {
      span.dataset.outlineText = span.textContent || '';
    }
    span.textContent = '';
    span.setAttribute('aria-label', span.dataset.outlineText);
  });

  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    document.fonts.ready.then(() => {
      renderOutlineSvgKeywords();
    });
  } else {
    renderOutlineSvgKeywords();
  }
}

function renderOutlineSvgKeywords() {
  const outlineSpans = Array.from(document.querySelectorAll('.folio-key-row .outline'));
  outlineSpans.forEach((span) => {
    const text = span.dataset.outlineText || '';
    if (!text) {
      return;
    }

    span.textContent = text;
    const rect = span.getBoundingClientRect();
    const styles = window.getComputedStyle(span);
    const fontSize = Number.parseFloat(styles.fontSize) || 16;
    const letterSpacing = styles.letterSpacing === 'normal' ? '0px' : styles.letterSpacing;
    const padding = Math.max(2, Math.ceil(fontSize * 0.08));
    const width = Math.max(1, Math.ceil(rect.width + padding * 2));
    const height = Math.max(1, Math.ceil(rect.height + padding * 2));
    const filterId = `outline-keyword-${outlineSvgUid++}`;

    span.textContent = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '160%');

    const dilate = document.createElementNS('http://www.w3.org/2000/svg', 'feMorphology');
    dilate.setAttribute('in', 'SourceAlpha');
    dilate.setAttribute('operator', 'dilate');
    dilate.setAttribute('radius', '0.5');
    dilate.setAttribute('result', 'expanded');

    const outside = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    outside.setAttribute('in', 'expanded');
    outside.setAttribute('in2', 'SourceAlpha');
    outside.setAttribute('operator', 'out');
    outside.setAttribute('result', 'ring');

    const flood = document.createElementNS('http://www.w3.org/2000/svg', 'feFlood');
    flood.setAttribute('flood-color', 'rgba(216, 200, 220, 0.44)');
    flood.setAttribute('result', 'strokeColor');

    const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
    composite.setAttribute('in', 'strokeColor');
    composite.setAttribute('in2', 'ring');
    composite.setAttribute('operator', 'in');
    composite.setAttribute('result', 'outsideStroke');

    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mergeNode = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode.setAttribute('in', 'outsideStroke');
    merge.appendChild(mergeNode);

    filter.append(dilate, outside, flood, composite, merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textNode.setAttribute('x', String(padding));
    textNode.setAttribute('y', String(height - padding));
    textNode.setAttribute('dominant-baseline', 'alphabetic');
    textNode.setAttribute('alignment-baseline', 'alphabetic');
    textNode.setAttribute('fill', '#ffffff');
    textNode.setAttribute('filter', `url(#${filterId})`);
    textNode.style.fontFamily = styles.fontFamily;
    textNode.style.fontSize = styles.fontSize;
    textNode.style.fontWeight = styles.fontWeight;
    textNode.style.letterSpacing = letterSpacing;
    textNode.textContent = text;

    svg.appendChild(textNode);
    span.appendChild(svg);
  });
}

function prepareAnimatedSection(section) {
  const sectionNumber = Number(section.dataset.section || 0);
  const year = section.querySelector('.folio-year');
  const logo =
    section.querySelector('.folio-brand img') || section.querySelector('.folio-brand-logo-text');
  const brandSub = section.querySelector('.folio-brand-sub');
  const statement = section.querySelector('.folio-statement');
  const navItemsWrap = sectionNumber === 3 ? persistentBottomNav?.querySelector('.folio-bottom-nav-items') : null;
  const navIndicator = sectionNumber === 3 ? persistentBottomNav?.querySelector('.folio-bottom-nav-indicator') : null;
  const navItems =
    sectionNumber === 3 && persistentBottomNav
      ? Array.from(persistentBottomNav.querySelectorAll('.folio-bottom-nav-items span'))
      : [];
  const keywordItems = Array.from(section.querySelectorAll('.folio-key-row span'));
  statement.classList.add('section3-statement');

  const statementRefs = splitAnimatedSectionStatement(statement);
  const statementRevealEnd =
    SECTION3_TIMINGS.statementStart +
    SECTION3_TIMINGS.statementLineDuration +
    Math.max(0, statementRefs.lineInners.length - 1) * SECTION3_TIMINGS.statementLineStagger;
  const statementFillStart = statementRevealEnd;
  const statementFillEnd = statementFillStart + SECTION3_TIMINGS.statementFillDuration;
  const navEnd =
    SECTION3_TIMINGS.navStart +
    SECTION3_TIMINGS.navDuration +
    Math.max(0, navItems.length - 1) * SECTION3_TIMINGS.navStagger;
  const keywordStart = Math.max(
    SECTION3_TIMINGS.subStart + SECTION3_TIMINGS.fadeDuration,
    statementFillEnd,
    navEnd
  ) + SECTION3_TIMINGS.keywordDelay;

  const filledKeyword = keywordItems.find((item) => item.classList.contains('fill')) || keywordItems[0];
  const remainingKeywordItems = keywordItems.filter((item) => item !== filledKeyword);
  const keywordOrderBase = remainingKeywordItems.slice();
  const keywordTailEnd =
    keywordStart +
    SECTION3_TIMINGS.keywordFirstDuration +
    (remainingKeywordItems.length ? SECTION3_TIMINGS.keywordStagger * remainingKeywordItems.length : 0) +
    (remainingKeywordItems.length ? SECTION3_TIMINGS.keywordDuration : 0);
  const totalDuration = keywordTailEnd + SECTION3_TIMINGS.endHold;

  const refs = {
    year,
    logo,
    brandSub,
    statementLineInners: statementRefs.lineInners,
    statementAccentChars: statementRefs.accentChars,
    navItemsWrap,
    navIndicator,
    navActiveIndex: sectionNumber === 3 ? getPersistentBottomNavActiveIndex(sectionNumber - 1) : 0,
    navItems,
    filledKeyword,
    keywordOrderBase,
    keywordOrder: keywordOrderBase.slice(),
    remainingKeywordItems,
    keywordStart,
    statementFillStart,
    statementFillEnd,
    totalDuration,
    eases: {
      fade: window.gsap.parseEase('power2.out'),
      line: window.gsap.parseEase('expo.out'),
      nav: window.gsap.parseEase('back.out(1.2)')
    }
  };
  applyAnimatedSectionTiming(refs);
  return refs;
}

function splitAnimatedSectionStatement(statement) {
  const tokenData = extractStatementTokens(statement);
  statement.textContent = '';

  const measureWords = [];
  tokenData.forEach((token) => {
    if (token.type === 'space') {
      statement.appendChild(document.createTextNode(token.text));
      return;
    }
    const span = document.createElement('span');
    span.className = 'section3-measure-word';
    span.textContent = token.text;
    statement.appendChild(span);
    measureWords.push({ tokenIndex: token.tokenIndex, span });
    statement.appendChild(document.createTextNode(' '));
  });

  const lineGroups = [];
  let currentTop = null;
  measureWords.forEach(({ tokenIndex, span }) => {
    const top = span.offsetTop;
    if (currentTop === null || Math.abs(top - currentTop) > 1) {
      lineGroups.push([tokenIndex]);
      currentTop = top;
      return;
    }
    lineGroups[lineGroups.length - 1].push(tokenIndex);
  });

  const lineRanges = lineGroups.map((group) => ({
    startTokenIndex: group[0],
    endTokenIndex: group[group.length - 1]
  }));

  statement.textContent = '';
  const lineInners = [];
  const accentChars = [];

  lineRanges.forEach((range) => {
    const mask = document.createElement('span');
    mask.className = 'section3-line-mask';
    const inner = document.createElement('span');
    inner.className = 'section3-line-inner';

    for (let i = range.startTokenIndex; i <= range.endTokenIndex; i += 1) {
      const token = tokenData[i];
      if (!token) {
        continue;
      }
      inner.appendChild(buildAnimatedSectionStatementToken(token, accentChars));
      if (i < range.endTokenIndex) {
        inner.appendChild(document.createTextNode(' '));
      }
    }

    mask.appendChild(inner);
    statement.appendChild(mask);
    lineInners.push(inner);
  });

  return { lineInners, accentChars };
}

function extractStatementTokens(element, accentActive = false, tokens = []) {
  Array.from(element.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = (node.textContent || '').trim().split(/\s+/).filter(Boolean);
      parts.forEach((part) => {
        tokens.push({
          type: 'word',
          text: part,
          accent: accentActive,
          tokenIndex: tokens.length
        });
      });
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const nextAccent = accentActive || node.classList.contains('hl');
    extractStatementTokens(node, nextAccent, tokens);
  });

  return tokens;
}

function buildAnimatedSectionStatementToken(token, accentChars) {
  if (token.type === 'space') {
    return document.createTextNode(token.text);
  }

  if (!token.accent) {
    return document.createTextNode(token.text);
  }

  const word = document.createElement('span');
  word.className = 'section3-fill-word hl';

  [...token.text].forEach((char) => {
    const wrapper = document.createElement('span');
    wrapper.className = 'section3-fill-char';

    const base = document.createElement('span');
    base.className = 'section3-fill-char-layer section3-fill-char-base';
    base.textContent = char;

    const overlay = document.createElement('span');
    overlay.className = 'section3-fill-char-layer section3-fill-char-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.textContent = char;

    wrapper.append(base, overlay);
    word.appendChild(wrapper);
    accentChars.push(overlay);
  });

  return word;
}

function applyTimedFade(el, progress, start, duration, ease, distance = 48, maxOpacity = 1) {
  if (!el) {
    return;
  }
  const local = clamp((progress - start) / duration, 0, 1);
  const eased = ease(local);
  el.style.opacity = (eased * maxOpacity).toFixed(3);
  el.style.transform = `translateX(${((1 - eased) * distance).toFixed(2)}px)`;
}

function applyAnimatedSection(refs, progress) {
  applyTimedFade(
    refs.year,
    progress,
    SECTION3_TIMINGS.yearStart,
    SECTION3_TIMINGS.fadeDuration,
    refs.eases.fade,
    48,
    0.5
  );
  applyTimedFade(
    refs.logo,
    progress,
    SECTION3_TIMINGS.logoStart,
    SECTION3_TIMINGS.fadeDuration,
    refs.eases.fade
  );
  applyTimedFade(
    refs.brandSub,
    progress,
    SECTION3_TIMINGS.subStart,
    SECTION3_TIMINGS.fadeDuration,
    refs.eases.fade
  );

  refs.statementLineInners.forEach((line, index) => {
    const local = clamp(
      (progress - (SECTION3_TIMINGS.statementStart + index * SECTION3_TIMINGS.statementLineStagger)) /
        SECTION3_TIMINGS.statementLineDuration,
      0,
      1
    );
    const eased = refs.eases.line(local);
    line.style.opacity = eased.toFixed(3);
    line.style.transform = `translateY(${((1 - eased) * 50).toFixed(2)}%)`;
  });

  const fillLocal = clamp(
    (progress - refs.statementFillStart) / SECTION3_TIMINGS.statementFillDuration,
    0,
    1
  );
  const fillProgress = fillLocal * refs.statementAccentChars.length;
  refs.statementAccentChars.forEach((char, index) => {
    char.style.opacity = clamp(fillProgress - index, 0, 1).toFixed(3);
  });

  refs.navItems.forEach((item, index) => {
    const local = clamp(
      (progress - (SECTION3_TIMINGS.navStart + index * SECTION3_TIMINGS.navStagger)) /
        SECTION3_TIMINGS.navDuration,
      0,
      1
    );
    const eased = refs.eases.nav(local);
    item.style.opacity = eased.toFixed(3);
    item.style.transform = `translateX(${((1 - eased) * 60).toFixed(2)}px)`;
  });
  if (refs.navIndicator && refs.navItemsWrap && refs.navItems[refs.navActiveIndex]) {
    const activeItem = refs.navItems[refs.navActiveIndex];
    const local = clamp(
      (progress - (SECTION3_TIMINGS.navStart + refs.navActiveIndex * SECTION3_TIMINGS.navStagger)) /
        SECTION3_TIMINGS.navDuration,
      0,
      1
    );
    const eased = refs.eases.nav(local);
    const baseX = refs.navItemsWrap.offsetLeft + activeItem.offsetLeft;
    refs.navIndicator.style.width = `${activeItem.offsetWidth}px`;
    refs.navIndicator.style.transform = `translateX(${(baseX + (1 - eased) * 60).toFixed(2)}px)`;
    refs.navIndicator.style.opacity = eased.toFixed(3);
  }

  const filledKeywordLocal = clamp(
    (progress - refs.keywordStart) / SECTION3_TIMINGS.keywordFirstDuration,
    0,
    1
  );
  refs.filledKeyword.style.opacity = filledKeywordLocal.toFixed(3);

  refs.keywordOrder.forEach((item, index) => {
    const local = clamp(
      (progress -
        (refs.keywordStart + SECTION3_TIMINGS.keywordFirstDuration + index * SECTION3_TIMINGS.keywordStagger)) /
        SECTION3_TIMINGS.keywordDuration,
      0,
      1
    );
    item.style.opacity = local.toFixed(3);
  });
}

function applyAnimatedSectionExit(refs, progress) {
  applyTimedFade(refs.year, progress, 0, 0.5, refs.eases.fade, 48, 0.5);
  refs.year.style.opacity = (0.5 - Number(refs.year.style.opacity || 0)).toFixed(3);
  refs.year.style.transform = `translateX(${(progress <= 0.5 ? progress / 0.5 : 1) * -48}px)`;

  const logoLocal = clamp((progress - 0.1) / 0.5, 0, 1);
  const logoEase = refs.eases.fade(1 - logoLocal);
  if (refs.logo) {
    refs.logo.style.opacity = logoEase.toFixed(3);
    refs.logo.style.transform = `translateX(${(logoLocal * -48).toFixed(2)}px)`;
  }

  const subLocal = clamp((progress - 0.15) / 0.5, 0, 1);
  const subEase = refs.eases.fade(1 - subLocal);
  if (refs.brandSub) {
    refs.brandSub.style.opacity = subEase.toFixed(3);
    refs.brandSub.style.transform = `translateX(${(subLocal * -48).toFixed(2)}px)`;
  }

  const statementExitStart = 0.25;
  const statementExitDuration =
    SECTION3_TIMINGS.statementLineDuration +
    Math.max(0, refs.statementLineInners.length - 1) * SECTION3_TIMINGS.statementLineStagger;
  refs.statementLineInners.forEach((line) => {
    const local = clamp((progress - statementExitStart) / statementExitDuration, 0, 1);
    line.style.opacity = (1 - local).toFixed(3);
    line.style.transform = `translateY(${(-50 * local).toFixed(2)}%)`;
  });
  refs.statementAccentChars.forEach((char) => {
    const local = clamp((progress - statementExitStart) / statementExitDuration, 0, 1);
    char.style.opacity = (1 - local).toFixed(3);
  });

  const keywordExitStart = statementExitStart + statementExitDuration;
  refs.keywordOrder.forEach((item, index) => {
    const local = clamp(
      (progress - (keywordExitStart + index * (SECTION3_TIMINGS.keywordStagger / 3))) /
        (SECTION3_TIMINGS.keywordDuration / 3),
      0,
      1
    );
    item.style.opacity = (1 - local).toFixed(3);
  });
  const filledStart =
    keywordExitStart +
    refs.keywordOrder.length * (SECTION3_TIMINGS.keywordStagger / 3) +
    SECTION3_TIMINGS.keywordDuration / 3;
  if (refs.filledKeyword) {
    const local = clamp((progress - filledStart) / (SECTION3_TIMINGS.keywordFirstDuration / 3), 0, 1);
    refs.filledKeyword.style.opacity = (1 - local).toFixed(3);
  }
}

function getExitDuration(refs) {
  const statementExitDuration =
    SECTION3_TIMINGS.statementLineDuration +
    Math.max(0, refs.statementLineInners.length - 1) * SECTION3_TIMINGS.statementLineStagger;
  return (
    0.25 +
    statementExitDuration +
    refs.keywordOrder.length * (SECTION3_TIMINGS.keywordStagger / 3) +
    SECTION3_TIMINGS.keywordDuration / 3 +
    SECTION3_TIMINGS.keywordFirstDuration / 3
  );
}

function isAnimatedSectionIndex(index) {
  return index >= 3 && index <= 9;
}

function beginAnimatedSectionTransition(targetIndex, direction, carryDelta = 0) {
  const activeIndex = SNAP_STATE.index;
  const pairFromIndex = direction > 0 ? activeIndex : targetIndex;
  const pairToIndex = direction > 0 ? targetIndex : activeIndex;
  const fromState = getSectionAnimationState(pairFromIndex);
  const toState = getSectionAnimationState(pairToIndex);
  const targetState = getSectionAnimationState(targetIndex);
  if (!fromState || !toState) {
    return false;
  }
  const stage = ensureAnimatedStage();
  const currentLayer = stage.querySelector('.animated-stage-current');
  const nextLayer = stage.querySelector('.animated-stage-next');
  currentLayer.innerHTML = '';
  nextLayer.innerHTML = '';
  const currentClone = snapSections[pairFromIndex].cloneNode(true);
  const nextClone = snapSections[pairToIndex].cloneNode(true);
  if (activeIndex >= 2 || targetIndex >= 2) {
    document.body.classList.add('persistent-bottom-nav-active');
    updatePersistentBottomNav(activeIndex);
  }
  currentLayer.appendChild(currentClone);
  nextLayer.appendChild(nextClone);
  stage.classList.add('is-active');
  SNAP_STATE.isTransitioning = true;
  stopSectionAnimationLoop();
  snapRoot.classList.add('animated-stage-active');
  const currentRefs = getAnimatedSectionRefsFromClone(currentClone);
  const nextRefs = getAnimatedSectionRefsFromClone(nextClone);
  if (direction > 0) {
    nextRefs.keywordOrder = shuffleArray(nextRefs.keywordOrderBase);
  } else if (fromState.refs?.keywordOrderBase) {
    fromState.refs.keywordOrder = shuffleArray(fromState.refs.keywordOrderBase);
    currentRefs.keywordOrder = fromState.refs.keywordOrder.slice();
  }
  const transition = {
    fromIndex: pairFromIndex,
    toIndex: pairToIndex,
    finalIndex: targetIndex,
    direction,
    progress: 0,
    entryGap: pairToIndex >= 3 ? SECTION4_PLUS_ENTRY_GAP : 0,
    duration: 0,
    fromProgress: fromState.progressSeconds,
    currentRefs,
    nextRefs,
    scrollPixelsPerSecond: 900 / SCROLL_SCRUB_SPEED_MULTIPLIER,
    lastInteractionAt: performance.now(),
    hasLeftStartBoundary: direction < 0
  };
  transition.duration = Math.max(getExitDuration(currentRefs), transition.entryGap + toState.durationSeconds);
  playSectionMorphTransition(direction, targetIndex);
  transition.progress = direction > 0 ? 0 : clamp(transition.entryGap + carryDelta / transition.scrollPixelsPerSecond, 0, transition.duration);
  animatedTransition = transition;
  applyAnimatedSection(currentRefs, fromState.progressSeconds);
  applyAnimatedSection(nextRefs, Math.max(0, transition.progress - transition.entryGap));
  currentLayer.style.opacity = '1';
  nextLayer.style.opacity = '1';
  ensureTransitionLoop();
  return true;
}

function beginSection3To2Transition() {
  if (SNAP_STATE.index !== 2) {
    return false;
  }
  stopSectionAnimationLoop();
  playSectionMorphTransition(-1, 1);
  SNAP_STATE.isAnimating = true;
  const fadeTargets = [persistentBottomNav, persistentStatus].filter(Boolean);
  window.gsap.killTweensOf(fadeTargets);
  window.gsap.to(fadeTargets, {
    opacity: 0,
    x: 48,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: () => {
      goToSection(1, false, { suppressMorph: true });
    }
  });
  return true;
}

function ensureTransitionLoop() {
  ensureSectionAnimationLoop();
}

function tickAnimatedTransition(dt) {
  if (!animatedTransition) {
    return;
  }
  if (performance.now() - animatedTransition.lastInteractionAt >= AUTOPLAY_RESUME_DELAY_MS) {
    animatedTransition.progress = clamp(animatedTransition.progress + dt, 0, animatedTransition.duration);
  }
  if (animatedTransition.progress > 0.0001) {
    animatedTransition.hasLeftStartBoundary = true;
  }
  applyAnimatedSectionExit(animatedTransition.currentRefs, animatedTransition.progress);
  if (animatedTransition.nextRefs) {
    applyAnimatedSection(
      animatedTransition.nextRefs,
      Math.max(0, animatedTransition.progress - (animatedTransition.entryGap || 0))
    );
  }
  const navContext = getTransitionNavProgressContext();
  if (navContext) {
    updatePersistentBottomNav(navContext);
  }
  if (animatedTransition.progress <= 0 && animatedTransition.hasLeftStartBoundary) {
    finishAnimatedTransition('start');
    return;
  }
  if (animatedTransition.progress >= animatedTransition.duration) {
    finishAnimatedTransition('end');
  }
}

function finishAnimatedTransition(boundary) {
  if (!animatedTransition) {
    return;
  }
  const targetIndex =
    boundary === 'start' ? animatedTransition.fromIndex : animatedTransition.toIndex;
  const targetState = getSectionAnimationState(targetIndex);
  const stage = ensureAnimatedStage();
  stage.classList.remove('is-active');
  SNAP_STATE.isTransitioning = false;
  if (targetState && !animatedTransition.specialSection2Return) {
    const targetProgress =
      boundary === 'start'
        ? targetState.durationSeconds
        : clamp(animatedTransition.progress - (animatedTransition.entryGap || 0), 0, targetState.durationSeconds);
    setSectionAnimationProgress(targetState, targetProgress);
  }
  animatedTransition = null;
  if (!SNAP_STATE.isAnimating) {
    snapRoot.classList.remove('animated-stage-active');
    goToSection(targetIndex, true);
  }
  activateSectionAnimation(targetIndex);
  settleAfterSectionChange();
}

function shuffleArray(items) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildFinalHorizonRows(keywords, cardIndex) {
  return Array.from({ length: 5 }, (_, rowIndex) => {
    const rotated = keywords.map((_, keywordIndex) => keywords[(keywordIndex + rowIndex) % keywords.length]);
    const repeated = [...rotated, ...rotated];
    const direction = ((cardIndex + rowIndex) % 2 === 0) ? 'normal' : 'reverse';
    const duration = 14 + (cardIndex * 1.4) + (rowIndex * 1.15);
    return `
      <div class="folio-hcard-keyrow">
        <div class="folio-hcard-keyrow-track" style="--row-duration:${duration.toFixed(2)}s; --row-direction:${direction};">
          ${repeated.map((keyword) => `<span>${keyword}</span><span>•</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function getFinalHorizonHoverChipContent(cardIndex) {
  if (cardIndex === 4) {
    return {
      leadingIcon: 'public',
      trailingIcon: 'arrow_outward',
      text: 'Open product page'
    };
  }
  if (cardIndex === 5) {
    return {
      leadingIcon: 'public',
      trailingIcon: 'arrow_outward',
      text: 'Open example content: No Country For Old Men'
    };
  }
  const card = finalHorizonCardsData[cardIndex];
  if (card?.href) {
    return {
      leadingIcon: '',
      trailingIcon: 'arrow_right_alt',
      text: 'Open case-study'
    };
  }
  return {
    leadingIcon: '',
    trailingIcon: 'arrow_right_alt',
    text: 'Open case-study'
  };
}

function updateFinalHorizonHoverChipPosition(clientX, clientY) {
  if (!finalHorizonHoverChip) {
    return;
  }
  FINAL_HORIZON_STATE.pointerX = clientX;
  FINAL_HORIZON_STATE.pointerY = clientY;
  finalHorizonHoverChip.style.transform =
    `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%) scale(1)`;
}

function hideFinalHorizonHoverChip() {
  FINAL_HORIZON_STATE.hoverCardIndex = null;
  finalHorizonHoverChip?.classList.remove('is-visible');
}

function hideFinalHorizonLottieMarker() {
  finalHorizonLottieMarker?.classList.remove('is-visible');
  if (finalHorizonLottieMarker) {
    finalHorizonLottieMarker.style.transform = 'translate3d(-9999px, -9999px, 0)';
  }
  FINAL_HORIZON_STATE.lottieInstance?.pause?.();
}

function ensureFinalHorizonLottieMarker() {
  if (FINAL_HORIZON_STATE.lottieInstance || !finalHorizonLottieMarkerInner || !window.lottie) {
    return;
  }
  FINAL_HORIZON_STATE.lottieInstance = window.lottie.loadAnimation({
    container: finalHorizonLottieMarkerInner,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: 'Assets/data.json'
  });
}

function updateFinalHorizonLottieMarker(activeIndex) {
  if (document.body.dataset.section !== String(FINAL_HORIZON_SECTION_INDEX + 1)) {
    hideFinalHorizonLottieMarker();
    return;
  }
  if (FINAL_HORIZON_STATE.isAnimating) {
    hideFinalHorizonLottieMarker();
    return;
  }
  ensureFinalHorizonLottieMarker();
  if (!FINAL_HORIZON_STATE.lottieInstance || !FINAL_HORIZON_STATE.cards.length) {
    return;
  }
  const currentCard = FINAL_HORIZON_STATE.cards[activeIndex];
  const nextCard = FINAL_HORIZON_STATE.cards[activeIndex + 1];
  if (!currentCard || !nextCard) {
    hideFinalHorizonLottieMarker();
    return;
  }
  const currentRect = currentCard.getBoundingClientRect();
  const nextRect = nextCard.getBoundingClientRect();
  const markerWidth = finalHorizonLottieMarker?.offsetWidth || 120;
  const markerHeight = finalHorizonLottieMarker?.offsetHeight || 200;
  const x = ((window.innerWidth + currentRect.right) * 0.5) - (markerWidth * 0.5);
  const y = nextRect.top - markerHeight - 16;
  finalHorizonLottieMarker.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
  finalHorizonLottieMarker.classList.add('is-visible');
  FINAL_HORIZON_STATE.lottieInstance.play?.();
}

function showFinalHorizonHoverChip(cardIndex, clientX, clientY) {
  if (
    !finalHorizonHoverChip ||
    !finalHorizonHoverChipIconLeading ||
    !finalHorizonHoverChipIconTrailing ||
    !finalHorizonHoverChipText
  ) {
    return;
  }
  if (FINAL_HORIZON_STATE.hoverCardIndex !== cardIndex) {
    const chip = getFinalHorizonHoverChipContent(cardIndex);
    FINAL_HORIZON_STATE.hoverCardIndex = cardIndex;
    finalHorizonHoverChipIconLeading.textContent = chip.leadingIcon || '';
    finalHorizonHoverChipIconLeading.classList.toggle('is-hidden', !chip.leadingIcon);
    finalHorizonHoverChipIconTrailing.textContent = chip.trailingIcon || '';
    finalHorizonHoverChipIconTrailing.classList.toggle('is-hidden', !chip.trailingIcon);
    finalHorizonHoverChipText.textContent = chip.text;
  }
  updateFinalHorizonHoverChipPosition(clientX, clientY);
  finalHorizonHoverChip.classList.add('is-visible');
}

function renderFinalHorizonSection() {
  if (!finalHorizonRail) {
    return;
  }
  finalHorizonRail.innerHTML = finalHorizonCardsData.map((card, index) => {
    if (card.kind === 'opportunity') {
      return `
        <article class="folio-hcard-wrap is-opportunity ${index === 0 ? 'is-active' : ''}" data-card-index="${index}">
          <div class="folio-hcard-year"></div>
          <div class="folio-opportunity-card">
            <div class="folio-hcard-frame"></div>
            <div class="folio-opportunity-content">
              <div class="folio-opportunity-mark" aria-hidden="true">
                <svg class="folio-opportunity-mark-svg" viewBox="0 0 620 240" role="presentation">
                  <defs>
                    <filter id="folio-opportunity-mark-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feOffset dx="-3" dy="-3" result="offset-shadow"></feOffset>
                      <feGaussianBlur in="offset-shadow" stdDeviation="1.8" result="blur-shadow"></feGaussianBlur>
                      <feComposite
                        in="blur-shadow"
                        in2="SourceAlpha"
                        operator="arithmetic"
                        k2="-1"
                        k3="1"
                        result="inner-shadow-mask"
                      ></feComposite>
                      <feFlood flood-color="#ffffff" flood-opacity="0.18" result="inner-shadow-color"></feFlood>
                      <feComposite
                        in="inner-shadow-color"
                        in2="inner-shadow-mask"
                        operator="in"
                        result="inner-shadow"
                      ></feComposite>
                      <feMerge>
                        <feMergeNode in="SourceGraphic"></feMergeNode>
                        <feMergeNode in="inner-shadow"></feMergeNode>
                      </feMerge>
                    </filter>
                  </defs>
                  <text
                    x="50%"
                    y="236"
                    class="folio-opportunity-mark-text"
                    text-anchor="middle"
                    filter="url(#folio-opportunity-mark-inner-shadow)"
                  >hi,</text>
                </svg>
              </div>
              <div class="folio-opportunity-copy">
                <p>Like what you see?</p>
                <p>I’d love to share the thinking and stories behind my work. If you’re exploring collaborators for your project, I’d be happy to chat.</p>
                <p>I’m also building a side passion project that I’d be delighted to geek out about.</p>
              </div>
              <div class="folio-opportunity-icons">
                <a
                  class="folio-opportunity-icon folio-opportunity-icon-link"
                  href="https://linkedin.com/in/sujay-k"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open LinkedIn profile in a new tab"
                ><img src="Assets/contact-icons-04.png" alt=""></a>
                <a
                  class="folio-opportunity-icon folio-opportunity-icon-link"
                  href="mailto:imsujaykumar@gmail.com"
                  aria-label="Email imsujaykumar@gmail.com"
                ><img src="Assets/contact-icons-03.png" alt=""></a>
                <a
                  class="folio-opportunity-icon folio-opportunity-icon-link"
                  href="tel:+918828290489"
                  aria-label="Call +91 88282 90489"
                ><img src="Assets/contact-icons-02.png" alt=""></a>
                <span class="folio-opportunity-icon"><img src="Assets/contact-icons-01.png" alt=""></span>
              </div>
            </div>
            <div class="folio-opportunity-pill"><span class="folio-status-dot" aria-hidden="true"></span><span>open to opportunities</span></div>
          </div>
        </article>
      `;
    }
    return `
      <article
        class="folio-hcard-wrap ${index === 1 ? 'is-active' : ''}"
        data-card-index="${index}"
        ${card.href ? `data-href="${card.href}" ${card.newTab ? 'data-new-tab="true"' : ''} role="link" tabindex="0"` : ''}
        data-hover-chip-icon="arrow_right_alt"
        data-hover-chip-text="Open case-study"
        style="
          --folio-image-position:${card.imagePosition || '50% 50%'};
          --folio-image-fit:${card.imageFit || 'cover'};
          --folio-image-scale:${card.imageScale || 1};
          --folio-image-padding:${card.imagePadding || '24px 18px 18px'};
          --folio-image-align:${card.imageAlign || 'center'};
          --folio-image-width:${card.imageWidth || '100%'};
          --folio-image-height:${card.imageHeight || '100%'};
          --folio-image-max-height:${card.imageMaxHeight || '100%'};
          --folio-image-translate-y:${card.imageTranslateY || '0px'};
          --folio-image-position-mobile:${card.imagePositionMobile || card.imagePosition || '50% 50%'};
          --folio-image-fit-mobile:${card.imageFitMobile || card.imageFit || 'cover'};
          --folio-image-scale-mobile:${card.imageScaleMobile || card.imageScale || 1};
          --folio-image-padding-mobile:${card.imagePaddingMobile || card.imagePadding || '24px 18px 18px'};
          --folio-image-align-mobile:${card.imageAlignMobile || card.imageAlign || 'center'};
          --folio-image-width-mobile:${card.imageWidthMobile || card.imageWidth || '100%'};
          --folio-image-height-mobile:${card.imageHeightMobile || card.imageHeight || '100%'};
          --folio-image-max-height-mobile:${card.imageMaxHeightMobile || card.imageMaxHeight || '100%'};
          --folio-image-translate-y-mobile:${card.imageTranslateYMobile || card.imageTranslateY || '0px'};
        "
      >
        <div class="folio-hcard-year">${card.year}</div>
        <div class="folio-hcard-logo"><img src="${card.logo}" alt="${card.logoAlt}"><div class="folio-hcard-logo-sub">${card.logoSub}</div></div>
        <div class="folio-hcard">
          <div class="folio-hcard-frame">
            <div class="folio-hcard-media">
              ${card.backgroundImage ? `<div class="folio-hcard-background"><img src="${card.backgroundImage}" alt=""></div>` : ''}
              <div class="folio-hcard-noise"></div>
              <div class="folio-hcard-keyflow">${buildFinalHorizonRows(card.keywords, index)}</div>
              ${
                index === 1
                  ? `<div class="folio-hcard-image folio-hcard-image-split">
                       <div class="folio-hcard-image-stack">
                         <img class="folio-hcard-image-base" src="Assets/card-01-01.png" alt="">
                         <img class="folio-hcard-image-overlay" src="${card.image}" alt="">
                       </div>
                     </div>`
                  : `<div class="folio-hcard-image"><img src="${card.image}" alt=""></div>`
              }
            </div>
            <div class="folio-hcard-copy">
              <p class="folio-hcard-statement">${card.statement}</p>
              <p class="folio-hcard-meta">${card.meta}</p>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
  FINAL_HORIZON_STATE.cards = Array.from(finalHorizonRail.querySelectorAll('.folio-hcard-wrap'));
  FINAL_HORIZON_STATE.cards.forEach((card) => {
    if (card.classList.contains('is-opportunity')) {
      return;
    }
    const href = card.dataset.href;
    const newTab = card.dataset.newTab === 'true';
    const openCardHref = () => {
      if (!href) {
        return;
      }
      if (newTab) {
        window.open(href, '_blank', 'noopener');
        return;
      }
      if (window.LoaderPageHandoff && window.LoaderPageHandoff.isManagedTarget(href)) {
        window.LoaderPageHandoff.navigate(href);
        return;
      }
      window.location.href = href;
    };
    card.addEventListener('pointerenter', (event) => {
      if (document.body.dataset.section !== String(FINAL_HORIZON_SECTION_INDEX + 1)) {
        return;
      }
      showFinalHorizonHoverChip(Number(card.dataset.cardIndex), event.clientX, event.clientY);
    });
    card.addEventListener('pointermove', (event) => {
      if (document.body.dataset.section !== String(FINAL_HORIZON_SECTION_INDEX + 1)) {
        hideFinalHorizonHoverChip();
        return;
      }
      showFinalHorizonHoverChip(Number(card.dataset.cardIndex), event.clientX, event.clientY);
    });
    card.addEventListener('pointerleave', () => {
      hideFinalHorizonHoverChip();
    });
    if (href) {
      card.addEventListener('click', openCardHref);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCardHref();
        }
      });
    }
  });
}

function refreshFinalHorizonSnapPoints() {
  if (!finalHorizonRail || !FINAL_HORIZON_STATE.cards.length) {
    return;
  }
  const railStyles = getComputedStyle(finalHorizonRail);
  const lead = parseFloat(railStyles.paddingLeft) || 0;
  const trail = parseFloat(railStyles.paddingRight) || 0;
  const gap = parseFloat(railStyles.columnGap || railStyles.gap) || 0;
  const baseYearOffset = clamp(window.innerWidth * 0.017, 18, 28);
  const sharedLeftAnchor = Math.max(0, lead - baseYearOffset);
  const specialWidth = Math.max(0, sharedLeftAnchor - gap - window.innerWidth * 0.01);
  const specialExpandedWidth = specialWidth * 6;
  FINAL_HORIZON_STATE.sharedLeftAnchor = sharedLeftAnchor;
  FINAL_HORIZON_STATE.specialExpansionDelta = specialExpandedWidth - specialWidth;
  finalHorizonRail.style.setProperty('--folio-special-card-width', `${specialWidth}px`);
  finalHorizonRail.style.setProperty('--folio-special-card-expanded-width', `${specialExpandedWidth}px`);
  const computedSnapPoints = FINAL_HORIZON_STATE.cards.map((card) => {
    const adjustedLeft =
      FINAL_HORIZON_STATE.specialCollapsing && card.dataset.cardIndex !== '0'
        ? card.offsetLeft - FINAL_HORIZON_STATE.specialExpansionDelta
        : card.offsetLeft;
    return Math.max(0, adjustedLeft - sharedLeftAnchor);
  });
  const currentMaxScroll = Math.max(
    finalHorizonScroller.scrollWidth - finalHorizonScroller.clientWidth,
    0
  );
  const requiredMaxScroll = computedSnapPoints[computedSnapPoints.length - 1] ?? 0;
  const trailingPadding = Math.max(trail + (requiredMaxScroll - currentMaxScroll), 0);
  finalHorizonRail.style.paddingRight = `${trailingPadding}px`;
  FINAL_HORIZON_STATE.snapPoints = FINAL_HORIZON_STATE.cards.map((card) => {
    const adjustedLeft =
      FINAL_HORIZON_STATE.specialCollapsing && card.dataset.cardIndex !== '0'
        ? card.offsetLeft - FINAL_HORIZON_STATE.specialExpansionDelta
        : card.offsetLeft;
    return Math.max(0, adjustedLeft - sharedLeftAnchor);
  });
}

function updateFinalHorizonVisuals() {
  if (!FINAL_HORIZON_STATE.cards.length) {
    return;
  }
  let activeIndex = clamp(
    FINAL_HORIZON_STATE.visualIndex,
    0,
    FINAL_HORIZON_STATE.cards.length - 1
  );
  if (!FINAL_HORIZON_STATE.isAnimating) {
    let visibleIndex = 0;
    let maxVisible = -1;
    const viewportWidth = window.innerWidth;
    FINAL_HORIZON_STATE.cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
      if (visible > maxVisible) {
        maxVisible = visible;
        visibleIndex = index;
      }
    });
    activeIndex = FINAL_HORIZON_STATE.snapIndex === 0 ? 0 : visibleIndex;
    FINAL_HORIZON_STATE.visualIndex = activeIndex;
  }
  FINAL_HORIZON_STATE.index = activeIndex;
  FINAL_HORIZON_STATE.cards.forEach((card, index) => {
    card.classList.toggle('is-active', index === activeIndex);
    card.classList.toggle('is-left-of-active', index < activeIndex);
    card.classList.toggle('is-right-of-active', index > activeIndex);
    if (index === 1) {
      updateFinalHorizonCardOneSplit(card, index === activeIndex);
    }
    const image = card.querySelector('.folio-hcard-image');
    if (image) {
      const rect = card.getBoundingClientRect();
      const restingX = FINAL_HORIZON_STATE.snapPoints[index] ?? 0;
      const currentShift = FINAL_HORIZON_STATE.x - restingX;
      const normalized = clamp(currentShift / Math.max(rect.width, 1), -1, 1);
      const offset = normalized * -128;
      const cardBodyDrop = Math.max(rect.height - 108, 0);
      const yOffset = index > activeIndex ? cardBodyDrop * 0.14 : 0;
      image.style.transform = `translate3d(${offset.toFixed(2)}px, ${yOffset.toFixed(2)}px, 0)`;
    }
  });
  updateFinalHorizonLottieMarker(activeIndex);
}

function getMainScrollDebugAccumulator() {
  if (SNAP_STATE.index === FINAL_HORIZON_SECTION_INDEX) {
    return SNAP_STATE.finalCardsAccumulator;
  }
  if (SNAP_STATE.index === 1) {
    return SNAP_STATE.section2EdgeAccumulator;
  }
  return SNAP_STATE.wheelAccumulator;
}

function getFinalHorizonSpeedMetrics() {
  const now = performance.now();
  const startAt = now - FINAL_HORIZON_DYNAMIC_DURATION_SAMPLE_MS;
  let total = 0;
  let count = 0;
  for (let i = MAIN_SCROLL_DEBUG_STATE.rawEvents.length - 1; i >= 0; i -= 1) {
    const event = MAIN_SCROLL_DEBUG_STATE.rawEvents[i];
    if (event.t < startAt) {
      break;
    }
    total += Math.abs(event.primaryDelta);
    count += 1;
  }
  const averagedAbsDelta = count ? total / count : 0;
  const clampedAbsDelta = clamp(
    averagedAbsDelta,
    FINAL_HORIZON_DYNAMIC_DURATION_MIN_DELTA,
    FINAL_HORIZON_DYNAMIC_DURATION_MAX_DELTA
  );
  const normalized = clamp(
    (clampedAbsDelta - FINAL_HORIZON_DYNAMIC_DURATION_MIN_DELTA) /
      (FINAL_HORIZON_DYNAMIC_DURATION_MAX_DELTA - FINAL_HORIZON_DYNAMIC_DURATION_MIN_DELTA),
    0,
    1
  );
  const curvedDurationMs = FINAL_HORIZON_DYNAMIC_DURATION_CURVE_BASE_MS *
    (FINAL_HORIZON_DYNAMIC_DURATION_CURVE_DECAY ** clampedAbsDelta);
  const mappedDurationMs = clamp(
    curvedDurationMs,
    FINAL_HORIZON_DYNAMIC_DURATION_MIN_MS,
    FINAL_HORIZON_SNAP_DURATION * 1000
  );
  return {
    averagedAbsDelta,
    clampedAbsDelta,
    normalized,
    mappedDurationMs
  };
}

function setFinalHorizonTransitionDuration(durationSeconds) {
  if (!finalHorizonSection) {
    return;
  }
  const verticalDurationSeconds = Math.min(durationSeconds * 0.4, 0.26);
  finalHorizonSection.style.setProperty(
    '--final-horizon-transition-duration',
    `${durationSeconds.toFixed(3)}s`
  );
  finalHorizonSection.style.setProperty(
    '--final-horizon-vertical-duration',
    `${verticalDurationSeconds.toFixed(3)}s`
  );
}

function recordMainScrollDebugMotion(type) {
  const t = performance.now() - MAIN_SCROLL_DEBUG_STATE.startAt;
  MAIN_SCROLL_DEBUG_STATE.motionMarkers.push({ t, type });
  while (
    MAIN_SCROLL_DEBUG_STATE.motionMarkers.length &&
    t - MAIN_SCROLL_DEBUG_STATE.motionMarkers[0].t > MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS
  ) {
    MAIN_SCROLL_DEBUG_STATE.motionMarkers.shift();
  }
}

function resizeMainScrollDebugGraph() {
  if (!mainScrollDebugGraph || !mainScrollDebugGraphCtx) {
    return;
  }
  const rect = mainScrollDebugGraph.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mainScrollDebugGraph.width = Math.max(1, Math.round(rect.width * dpr));
  mainScrollDebugGraph.height = Math.max(1, Math.round(rect.height * dpr));
  mainScrollDebugGraphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawMainScrollDebugGraph();
}

function getMainScrollDebugWindowPrimary(now) {
  if (MAIN_SCROLL_DEBUG_STATE.plotMode === 'average') {
    const startAt = now - MAIN_SCROLL_DEBUG_STATE.graphSampleMs;
    let total = 0;
    let count = 0;
    for (let i = MAIN_SCROLL_DEBUG_STATE.rawEvents.length - 1; i >= 0; i -= 1) {
      const event = MAIN_SCROLL_DEBUG_STATE.rawEvents[i];
      if (event.t < startAt) {
        break;
      }
      total += event.primaryDelta;
      count += 1;
    }
    return count ? total / count : 0;
  }

  const elapsed = now - MAIN_SCROLL_DEBUG_STATE.startAt;
  for (let i = MAIN_SCROLL_DEBUG_STATE.graphSamples.length - 1; i >= 0; i -= 1) {
    const sample = MAIN_SCROLL_DEBUG_STATE.graphSamples[i];
    if (elapsed - sample.t >= MAIN_SCROLL_DEBUG_STATE.graphSampleMs) {
      return sample.primaryDelta;
    }
  }
  return MAIN_SCROLL_DEBUG_STATE.lastPrimaryDelta;
}

function sampleMainScrollDebugGraph() {
  const now = performance.now();
  if (Math.abs(MAIN_SCROLL_DEBUG_STATE.lastDeltaX) <= 1 && Math.abs(MAIN_SCROLL_DEBUG_STATE.lastDeltaY) <= 1) {
    if (!MAIN_SCROLL_DEBUG_STATE.zeroSinceAt) {
      MAIN_SCROLL_DEBUG_STATE.zeroSinceAt = now;
    }
    if (now - MAIN_SCROLL_DEBUG_STATE.zeroSinceAt > 500) {
      return;
    }
  } else {
    MAIN_SCROLL_DEBUG_STATE.zeroSinceAt = 0;
  }

  const t = now - MAIN_SCROLL_DEBUG_STATE.startAt;
  const getAverage = (key) => {
    const startAt = now - MAIN_SCROLL_DEBUG_STATE.graphSampleMs;
    let total = 0;
    let count = 0;
    for (let i = MAIN_SCROLL_DEBUG_STATE.rawEvents.length - 1; i >= 0; i -= 1) {
      const event = MAIN_SCROLL_DEBUG_STATE.rawEvents[i];
      if (event.t < startAt) {
        break;
      }
      total += event[key];
      count += 1;
    }
    return count ? total / count : 0;
  };

  const deltaX = MAIN_SCROLL_DEBUG_STATE.plotMode === 'average'
    ? getAverage('deltaX')
    : MAIN_SCROLL_DEBUG_STATE.lastDeltaX;
  const deltaY = MAIN_SCROLL_DEBUG_STATE.plotMode === 'average'
    ? getAverage('deltaY')
    : MAIN_SCROLL_DEBUG_STATE.lastDeltaY;
  const primaryDelta = MAIN_SCROLL_DEBUG_STATE.plotMode === 'average'
    ? getAverage('primaryDelta')
    : MAIN_SCROLL_DEBUG_STATE.lastPrimaryDelta;

  MAIN_SCROLL_DEBUG_STATE.graphSamples.push({ t, deltaX, deltaY, primaryDelta });
  while (
    MAIN_SCROLL_DEBUG_STATE.graphSamples.length &&
    t - MAIN_SCROLL_DEBUG_STATE.graphSamples[0].t > MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS
  ) {
    MAIN_SCROLL_DEBUG_STATE.graphSamples.shift();
  }

  const sampleCount = MAIN_SCROLL_DEBUG_STATE.graphSamples.length;
  const currentSample = MAIN_SCROLL_DEBUG_STATE.graphSamples[sampleCount - 1];
  const previousSample = sampleCount > 1 ? MAIN_SCROLL_DEBUG_STATE.graphSamples[sampleCount - 2] : null;
  const currentAbs = Math.abs(currentSample.primaryDelta);
  const previousAbs = previousSample ? Math.abs(previousSample.primaryDelta) : 0;
  let nextHeuristic = 'existing';
  if (currentAbs <= 1) {
    nextHeuristic = 'idle';
  } else if (previousSample && currentAbs > previousAbs) {
    nextHeuristic = 'fresh';
  }
  if (nextHeuristic !== MAIN_SCROLL_DEBUG_STATE.heuristic) {
    MAIN_SCROLL_DEBUG_STATE.heuristic = nextHeuristic;
    MAIN_SCROLL_DEBUG_STATE.heuristicMarkers.push({ t, heuristic: nextHeuristic });
  }
  while (
    MAIN_SCROLL_DEBUG_STATE.heuristicMarkers.length &&
    t - MAIN_SCROLL_DEBUG_STATE.heuristicMarkers[0].t > MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS
  ) {
    MAIN_SCROLL_DEBUG_STATE.heuristicMarkers.shift();
  }

  drawMainScrollDebugGraph();
}

function drawMainScrollDebugGraph() {
  if (!mainScrollDebugGraph || !mainScrollDebugGraphCtx) {
    return;
  }
  const rect = mainScrollDebugGraph.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) {
    return;
  }

  mainScrollDebugGraphCtx.clearRect(0, 0, width, height);
  mainScrollDebugGraphCtx.fillStyle = 'rgba(255,255,255,0.02)';
  mainScrollDebugGraphCtx.fillRect(0, 0, width, height);

  mainScrollDebugGraphCtx.strokeStyle = 'rgba(255,255,255,0.08)';
  mainScrollDebugGraphCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = (height / 4) * i;
    mainScrollDebugGraphCtx.beginPath();
    mainScrollDebugGraphCtx.moveTo(0, y);
    mainScrollDebugGraphCtx.lineTo(width, y);
    mainScrollDebugGraphCtx.stroke();
  }

  const latestT = MAIN_SCROLL_DEBUG_STATE.graphSamples.length
    ? MAIN_SCROLL_DEBUG_STATE.graphSamples[MAIN_SCROLL_DEBUG_STATE.graphSamples.length - 1].t
    : MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS;
  const minT = Math.max(0, latestT - MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS);
  const visibleSamples = MAIN_SCROLL_DEBUG_STATE.graphSamples.filter((sample) => sample.t >= minT);
  const maxAbs = Math.max(
    1,
    ...visibleSamples.map((sample) => Math.max(Math.abs(sample.deltaX), Math.abs(sample.deltaY)))
  );
  const centerY = height * 0.5;
  const scaleY = (height * 0.42) / maxAbs;

  mainScrollDebugGraphCtx.strokeStyle = 'rgba(255,255,255,0.18)';
  mainScrollDebugGraphCtx.lineWidth = 1;
  mainScrollDebugGraphCtx.beginPath();
  mainScrollDebugGraphCtx.moveTo(0, centerY);
  mainScrollDebugGraphCtx.lineTo(width, centerY);
  mainScrollDebugGraphCtx.stroke();

  const drawLine = (key, color) => {
    mainScrollDebugGraphCtx.strokeStyle = color;
    mainScrollDebugGraphCtx.lineWidth = 1.6;
    mainScrollDebugGraphCtx.beginPath();
    visibleSamples.forEach((sample, index) => {
      const x = ((sample.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      const y = centerY - sample[key] * scaleY;
      if (index === 0) {
        mainScrollDebugGraphCtx.moveTo(x, y);
      } else {
        mainScrollDebugGraphCtx.lineTo(x, y);
      }
    });
    mainScrollDebugGraphCtx.stroke();
  };

  const drawDeltaYLine = () => {
    if (visibleSamples.length < 2) {
      drawLine('deltaY', '#edf6b1');
      return;
    }
    mainScrollDebugGraphCtx.lineWidth = 1.6;
    for (let i = 1; i < visibleSamples.length; i += 1) {
      const prev = visibleSamples[i - 1];
      const current = visibleSamples[i];
      const x1 = ((prev.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      const y1 = centerY - prev.deltaY * scaleY;
      const x2 = ((current.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      const y2 = centerY - current.deltaY * scaleY;
      mainScrollDebugGraphCtx.strokeStyle = current.deltaY > prev.deltaY ? '#56ff8a' : '#edf6b1';
      mainScrollDebugGraphCtx.beginPath();
      mainScrollDebugGraphCtx.moveTo(x1, y1);
      mainScrollDebugGraphCtx.lineTo(x2, y2);
      mainScrollDebugGraphCtx.stroke();
    }
  };

  const drawNegativeAbsoluteYLine = () => {
    if (visibleSamples.length < 2) {
      return;
    }
    mainScrollDebugGraphCtx.lineWidth = 1.2;
    for (let i = 1; i < visibleSamples.length; i += 1) {
      const prev = visibleSamples[i - 1];
      const current = visibleSamples[i];
      if (prev.deltaY >= 0 || current.deltaY >= 0) {
        continue;
      }
      const x1 = ((prev.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      const y1 = centerY - Math.abs(prev.deltaY) * scaleY;
      const x2 = ((current.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      const y2 = centerY - Math.abs(current.deltaY) * scaleY;
      mainScrollDebugGraphCtx.strokeStyle =
        Math.abs(current.deltaY) > Math.abs(prev.deltaY) ? '#0f6b43' : '#ff9c43';
      mainScrollDebugGraphCtx.beginPath();
      mainScrollDebugGraphCtx.moveTo(x1, y1);
      mainScrollDebugGraphCtx.lineTo(x2, y2);
      mainScrollDebugGraphCtx.stroke();
    }
  };

  drawLine('deltaX', '#56a6ff');
  drawDeltaYLine();
  drawNegativeAbsoluteYLine();

  MAIN_SCROLL_DEBUG_STATE.heuristicMarkers
    .filter((marker) => marker.t >= minT)
    .forEach((marker) => {
      const x = ((marker.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      mainScrollDebugGraphCtx.fillStyle =
        marker.heuristic === 'fresh' ? '#9b6bff' : marker.heuristic === 'existing' ? '#ff78d2' : '#ff9c43';
      mainScrollDebugGraphCtx.beginPath();
      mainScrollDebugGraphCtx.arc(x, 10, 4, 0, Math.PI * 2);
      mainScrollDebugGraphCtx.fill();
    });

  MAIN_SCROLL_DEBUG_STATE.motionMarkers
    .filter((marker) => marker.t >= minT)
    .forEach((marker) => {
      const x = ((marker.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
      mainScrollDebugGraphCtx.strokeStyle =
        marker.type === 'start' ? 'rgba(255, 92, 92, 0.95)' : 'rgba(255, 120, 210, 0.95)';
      mainScrollDebugGraphCtx.lineWidth = 1;
      mainScrollDebugGraphCtx.beginPath();
      mainScrollDebugGraphCtx.moveTo(x, 0);
      mainScrollDebugGraphCtx.lineTo(x, height);
      mainScrollDebugGraphCtx.stroke();
    });

  MAIN_SCROLL_DEBUG_STATE.renderedPoints = [];
  visibleSamples.forEach((sample) => {
    const x = ((sample.t - minT) / MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS) * width;
    const yX = centerY - sample.deltaX * scaleY;
    const yY = centerY - sample.deltaY * scaleY;
    mainScrollDebugGraphCtx.fillStyle = '#56a6ff';
    mainScrollDebugGraphCtx.beginPath();
    mainScrollDebugGraphCtx.arc(x, yX, 2.2, 0, Math.PI * 2);
    mainScrollDebugGraphCtx.fill();
    if (sample.deltaY >= 0) {
      mainScrollDebugGraphCtx.fillStyle = '#edf6b1';
      mainScrollDebugGraphCtx.beginPath();
      mainScrollDebugGraphCtx.arc(x, yY, 2.2, 0, Math.PI * 2);
      mainScrollDebugGraphCtx.fill();
    }
    MAIN_SCROLL_DEBUG_STATE.renderedPoints.push({ x, y: yX, axis: 'X', sample });
    if (sample.deltaY >= 0) {
      MAIN_SCROLL_DEBUG_STATE.renderedPoints.push({ x, y: yY, axis: 'Y', sample });
    }
  });
}

function hideMainScrollDebugTooltip() {
  if (mainScrollDebugTooltip) {
    mainScrollDebugTooltip.classList.remove('is-visible');
  }
}

function showMainScrollDebugTooltip(point) {
  if (!mainScrollDebugTooltip || !mainScrollDebugGraph) {
    return;
  }
  const rect = mainScrollDebugGraph.getBoundingClientRect();
  const shellRect = mainScrollDebugGraph.closest('.main-scroll-debug-graph-shell')?.getBoundingClientRect();
  if (!shellRect) {
    return;
  }
  const signedValue = point.axis === 'X' ? point.sample.deltaX : point.sample.deltaY;
  mainScrollDebugTooltip.textContent =
    `axis ${point.axis}\nmode ${MAIN_SCROLL_DEBUG_STATE.plotMode}\nplotted ${Math.abs(signedValue).toFixed(2)}\nsigned ${signedValue.toFixed(2)}\ndeltaX ${point.sample.deltaX.toFixed(2)}\ndeltaY ${point.sample.deltaY.toFixed(2)}\nprimary ${point.sample.primaryDelta.toFixed(2)}\ntime ${(point.sample.t / 1000).toFixed(2)}s`;
  mainScrollDebugTooltip.classList.add('is-visible');

  const rawLeft = (rect.left - shellRect.left) + point.x;
  const rawTop = (rect.top - shellRect.top) + point.y;
  const tipRect = mainScrollDebugTooltip.getBoundingClientRect();
  const halfWidth = tipRect.width * 0.5;
  const minLeft = halfWidth + 8;
  const maxLeft = shellRect.width - halfWidth - 8;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));
  const minTop = tipRect.height + 16;
  const maxTop = shellRect.height - 8;
  const clampedTop = Math.max(minTop, Math.min(maxTop, rawTop));

  mainScrollDebugTooltip.style.left = `${clampedLeft}px`;
  mainScrollDebugTooltip.style.top = `${clampedTop}px`;
}

function handleMainScrollDebugGraphHover(event) {
  if (!mainScrollDebugGraph) {
    return;
  }
  const rect = mainScrollDebugGraph.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let closest = null;
  let closestDistance = 10;

  MAIN_SCROLL_DEBUG_STATE.renderedPoints.forEach((point) => {
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = Math.hypot(dx, dy);
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = point;
    }
  });

  if (!closest) {
    hideMainScrollDebugTooltip();
    return;
  }
  showMainScrollDebugTooltip(closest);
}

function updateMainScrollDebugHud() {
  if (mainScrollDebugHud.section) {
    mainScrollDebugHud.section.textContent = `${SNAP_STATE.index + 1} / ${snapSections.length}`;
  }
  if (mainScrollDebugHud.deltaX) {
    mainScrollDebugHud.deltaX.textContent = MAIN_SCROLL_DEBUG_STATE.lastDeltaX.toFixed(2);
  }
  if (mainScrollDebugHud.deltaY) {
    mainScrollDebugHud.deltaY.textContent = MAIN_SCROLL_DEBUG_STATE.lastDeltaY.toFixed(2);
  }
  if (mainScrollDebugHud.primary) {
    mainScrollDebugHud.primary.textContent = MAIN_SCROLL_DEBUG_STATE.lastPrimaryDelta.toFixed(2);
  }
  if (mainScrollDebugHud.accumulator) {
    mainScrollDebugHud.accumulator.textContent = getMainScrollDebugAccumulator().toFixed(2);
  }
  if (mainScrollDebugHud.direction) {
    mainScrollDebugHud.direction.textContent =
      MAIN_SCROLL_DEBUG_STATE.lastDirection > 0 ? 'forward' : MAIN_SCROLL_DEBUG_STATE.lastDirection < 0 ? 'back' : 'none';
  }
  if (mainScrollDebugHud.heuristic) {
    mainScrollDebugHud.heuristic.textContent = MAIN_SCROLL_DEBUG_STATE.heuristic;
  }
  if (mainScrollDebugHud.sampling) {
    mainScrollDebugHud.sampling.textContent = `${MAIN_SCROLL_DEBUG_STATE.graphSampleMs}ms`;
  }
  if (mainScrollDebugHud.mode) {
    mainScrollDebugHud.mode.textContent = MAIN_SCROLL_DEBUG_STATE.plotMode;
  }
  if (mainScrollDebugHud.animating) {
    mainScrollDebugHud.animating.textContent = SNAP_STATE.isAnimating || FINAL_HORIZON_STATE.isAnimating ? 'yes' : 'no';
  }
  if (mainScrollDebugHud.cooldown) {
    const gateActive =
      MAIN_SCROLL_DEBUG_STATE.requireFreshSection3Entry ||
      MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit;
    mainScrollDebugHud.cooldown.textContent = gateActive ? 'fresh' : 'off';
  }
  if (mainScrollDebugGraphTitle) {
    mainScrollDebugGraphTitle.textContent = `Delta X / Delta Y sampled every ${MAIN_SCROLL_DEBUG_STATE.graphSampleMs}ms`;
  }
}

function restartMainScrollDebugSampling() {
  if (MAIN_SCROLL_DEBUG_STATE.sampleTimer) {
    clearInterval(MAIN_SCROLL_DEBUG_STATE.sampleTimer);
  }
  MAIN_SCROLL_DEBUG_STATE.sampleTimer = window.setInterval(
    sampleMainScrollDebugGraph,
    MAIN_SCROLL_DEBUG_STATE.graphSampleMs
  );
  mainScrollDebugSampleButtons.forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.scrollDebugSample) === MAIN_SCROLL_DEBUG_STATE.graphSampleMs);
  });
  mainScrollDebugModeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.scrollDebugMode === MAIN_SCROLL_DEBUG_STATE.plotMode);
  });
  updateMainScrollDebugHud();
}

function recordMainScrollDebugInput(deltaX, deltaY) {
  const now = performance.now();
  const primaryDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
  MAIN_SCROLL_DEBUG_STATE.lastDeltaX = deltaX;
  MAIN_SCROLL_DEBUG_STATE.lastDeltaY = deltaY;
  MAIN_SCROLL_DEBUG_STATE.lastPrimaryDelta = primaryDelta;
  MAIN_SCROLL_DEBUG_STATE.lastDirection = primaryDelta === 0 ? 0 : primaryDelta > 0 ? 1 : -1;
  MAIN_SCROLL_DEBUG_STATE.rawEvents.push({ t: now, deltaX, deltaY, primaryDelta });
  while (
    MAIN_SCROLL_DEBUG_STATE.rawEvents.length &&
    now - MAIN_SCROLL_DEBUG_STATE.rawEvents[0].t > MAIN_SCROLL_DEBUG_GRAPH_HORIZON_MS + MAIN_SCROLL_DEBUG_STATE.graphSampleMs
  ) {
    MAIN_SCROLL_DEBUG_STATE.rawEvents.shift();
  }
  updateMainScrollDebugHud();
}

function consumeMainScrollDebugFreshGate() {
  updateMainScrollDebugHud();
  if (MAIN_SCROLL_DEBUG_STATE.heuristic !== 'fresh') {
    return false;
  }
  MAIN_SCROLL_DEBUG_STATE.requireFreshSection3Entry = false;
  MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit = false;
  updateMainScrollDebugHud();
  return true;
}

function initMainScrollDebug() {
  if (!mainScrollDebugGraph || !mainScrollDebugGraphCtx) {
    return;
  }
  resizeMainScrollDebugGraph();
  restartMainScrollDebugSampling();
  updateMainScrollDebugHud();

  mainScrollDebugSampleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMs = Number(button.dataset.scrollDebugSample);
      if (!nextMs || nextMs === MAIN_SCROLL_DEBUG_STATE.graphSampleMs) {
        return;
      }
      MAIN_SCROLL_DEBUG_STATE.graphSampleMs = nextMs;
      restartMainScrollDebugSampling();
      drawMainScrollDebugGraph();
    });
  });

  mainScrollDebugModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.scrollDebugMode;
      if (!nextMode || nextMode === MAIN_SCROLL_DEBUG_STATE.plotMode) {
        return;
      }
      MAIN_SCROLL_DEBUG_STATE.plotMode = nextMode;
      restartMainScrollDebugSampling();
      drawMainScrollDebugGraph();
    });
  });

  mainScrollDebugGraph.addEventListener('mousemove', handleMainScrollDebugGraphHover);
  mainScrollDebugGraph.addEventListener('mouseleave', hideMainScrollDebugTooltip);
}

function updateFinalHorizonCardOneSplit(card, isActive) {
  const overlay = card.querySelector('.folio-hcard-image-overlay');
  if (!overlay) {
    return;
  }
  if (!isActive) {
    overlay.style.setProperty('--folio-split-progress', '0%');
    return;
  }
  const mediaRect = card.querySelector('.folio-hcard-media')?.getBoundingClientRect();
  if (!mediaRect) {
    return;
  }
  const split = clamp(FINAL_HORIZON_STATE.pointerX - mediaRect.left, 0, mediaRect.width);
  overlay.style.setProperty('--folio-split-progress', `${((split / mediaRect.width) * 100).toFixed(3)}%`);
}

function setFinalHorizonX(x) {
  FINAL_HORIZON_STATE.x = x;
  if (finalHorizonScroller) {
    finalHorizonScroller.scrollLeft = x;
  }
  updateFinalHorizonVisuals();
}

function settleFinalHorizonCardSnap() {
  SNAP_STATE.finalCardsAccumulator = 0;
  SNAP_STATE.finalCardsDirection = 0;
  SNAP_STATE.wheelCooldownUntil = 0;
}

function goToFinalHorizonCard(index, immediate = false, targetOverride = null) {
  if (!FINAL_HORIZON_STATE.snapPoints.length || !finalHorizonScroller) {
    return false;
  }
  const clamped = clamp(index, 0, FINAL_HORIZON_STATE.cards.length - 1);
  FINAL_HORIZON_STATE.snapIndex = clamped;
  const targetX = targetOverride ?? FINAL_HORIZON_STATE.snapPoints[clamped] ?? 0;
  const snapDurationSeconds = getFinalHorizonSpeedMetrics().mappedDurationMs / 1000;
  setFinalHorizonTransitionDuration(snapDurationSeconds);
  const verticalPhaseSeconds = Math.min(snapDurationSeconds * 0.4, 0.26);
  if (immediate) {
    FINAL_HORIZON_STATE.isAnimating = false;
    FINAL_HORIZON_STATE.visualIndex = clamped;
    setFinalHorizonX(targetX);
    return true;
  }
  FINAL_HORIZON_STATE.isAnimating = true;
  FINAL_HORIZON_STATE.visualIndex = clamped;
  updateFinalHorizonVisuals();
  recordMainScrollDebugMotion('start');
  gsap.killTweensOf(FINAL_HORIZON_STATE);
  gsap.timeline({
    onComplete: () => {
      FINAL_HORIZON_STATE.isAnimating = false;
      FINAL_HORIZON_STATE.visualIndex = clamped;
      setFinalHorizonX(targetX);
      recordMainScrollDebugMotion('end');
      settleFinalHorizonCardSnap();
    }
  }).to({}, {
    duration: verticalPhaseSeconds,
    ease: 'power2.out'
  }).to(FINAL_HORIZON_STATE, {
    x: targetX,
    duration: Math.max(snapDurationSeconds - verticalPhaseSeconds, 0.18),
    ease: (t) => evaluateCubicBezier(t, 0.74, 0.25, 0.63, 0.97),
    onUpdate: () => setFinalHorizonX(FINAL_HORIZON_STATE.x)
  });
  return true;
}

function setFinalOpportunityExpanded(expanded) {
  if (FINAL_HORIZON_STATE.expanded === expanded && !FINAL_HORIZON_STATE.specialCollapsing) {
    return;
  }
  if (FINAL_HORIZON_STATE.specialCollapseTimer) {
    clearTimeout(FINAL_HORIZON_STATE.specialCollapseTimer);
    FINAL_HORIZON_STATE.specialCollapseTimer = 0;
  }
  FINAL_HORIZON_STATE.expanded = expanded;
  FINAL_HORIZON_STATE.specialCollapsing = !expanded;
  const card = FINAL_HORIZON_STATE.cards[0];
  if (!card) {
    return;
  }
  card.classList.toggle('is-expanded', expanded);
  refreshFinalHorizonSnapPoints();
  if (!expanded) {
    FINAL_HORIZON_STATE.specialCollapseTimer = window.setTimeout(() => {
      FINAL_HORIZON_STATE.specialCollapsing = false;
      FINAL_HORIZON_STATE.specialCollapseTimer = 0;
      refreshFinalHorizonSnapPoints();
    }, 800);
  }
}

function prepareFinalHorizonEntryState() {
  if (!FINAL_HORIZON_STATE.cards.length) {
    return;
  }
  FINAL_HORIZON_STATE.entryTweenStarted = false;
  if (FINAL_HORIZON_STATE.specialCollapseTimer) {
    clearTimeout(FINAL_HORIZON_STATE.specialCollapseTimer);
    FINAL_HORIZON_STATE.specialCollapseTimer = 0;
  }
  FINAL_HORIZON_STATE.expanded = false;
  FINAL_HORIZON_STATE.specialCollapsing = false;
  FINAL_HORIZON_STATE.cards[0]?.classList.add('is-resetting');
  FINAL_HORIZON_STATE.cards[0]?.classList.remove('is-expanded');
  refreshFinalHorizonSnapPoints();
  goToFinalHorizonCard(1, true);
  gsap.killTweensOf(FINAL_HORIZON_STATE.cards);
  gsap.set(FINAL_HORIZON_STATE.cards, {
    x: 96,
    opacity: 0
  });
}

function startFinalHorizonEntryTween() {
  if (!FINAL_HORIZON_STATE.cards.length || FINAL_HORIZON_STATE.entryTweenStarted) {
    return;
  }
  FINAL_HORIZON_STATE.entryTweenStarted = true;
  gsap.to(FINAL_HORIZON_STATE.cards, {
    x: 0,
    opacity: 1,
    duration: 0.7,
    ease: 'power4.out',
    stagger: 0.05,
    clearProps: 'opacity,transform'
  });
}

function activateFinalHorizonSection(fromIndex) {
  if (!FINAL_HORIZON_STATE.cards.length) {
    return;
  }
  FINAL_HORIZON_STATE.hasEntered = true;
  MAIN_SCROLL_DEBUG_STATE.requireFreshSection3Entry = false;
  MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit = false;
  SNAP_STATE.finalCardsAccumulator = 0;
  SNAP_STATE.finalCardsDirection = 0;
  if (fromIndex !== FINAL_HORIZON_SECTION_INDEX) {
    requestAnimationFrame(() => {
      refreshFinalHorizonSnapPoints();
      if (fromIndex === 1) {
        MAIN_SCROLL_DEBUG_STATE.requireFreshSection3Entry = true;
        SNAP_STATE.wheelCooldownUntil = 0;
      } else {
        goToFinalHorizonCard(1, true);
      }
      updateFinalHorizonVisuals();
      updateMainScrollDebugHud();
      requestAnimationFrame(() => {
        FINAL_HORIZON_STATE.cards[0]?.classList.remove('is-resetting');
      });
    });
    startFinalHorizonEntryTween();
  } else {
    refreshFinalHorizonSnapPoints();
    goToFinalHorizonCard(FINAL_HORIZON_STATE.snapIndex, true);
  }
}

function handleFinalHorizonScroll(deltaX, deltaY) {
  if (!FINAL_HORIZON_STATE.cards.length) {
    return false;
  }
  if (SNAP_STATE.isAnimating || FINAL_HORIZON_STATE.isAnimating || performance.now() < SNAP_STATE.wheelCooldownUntil) {
    return true;
  }
  const primaryDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
  const direction = primaryDelta > 0 ? 1 : primaryDelta < 0 ? -1 : 0;
  if (!direction) {
    return true;
  }
  if (MAIN_SCROLL_DEBUG_STATE.requireFreshSection3Entry) {
    if (!consumeMainScrollDebugFreshGate()) {
      return true;
    }
  }
  if (MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit && FINAL_HORIZON_STATE.snapIndex === 0 && direction < 0) {
    if (!consumeMainScrollDebugFreshGate()) {
      return true;
    }
  }
  if (SNAP_STATE.finalCardsDirection !== direction) {
    SNAP_STATE.finalCardsAccumulator = 0;
  }
  SNAP_STATE.finalCardsDirection = direction;
  SNAP_STATE.finalCardsAccumulator += primaryDelta;
  if (Math.abs(SNAP_STATE.finalCardsAccumulator) < FINAL_HORIZON_WHEEL_SNAP_THRESHOLD) {
    return true;
  }
  SNAP_STATE.finalCardsAccumulator = 0;
  SNAP_STATE.wheelCooldownUntil = performance.now() + FINAL_HORIZON_WHEEL_COOLDOWN_MS;
  if (direction < 0) {
    if (FINAL_HORIZON_STATE.snapIndex > 1) {
      setFinalOpportunityExpanded(false);
      goToFinalHorizonCard(FINAL_HORIZON_STATE.snapIndex - 1);
      return true;
    }
    if (FINAL_HORIZON_STATE.snapIndex === 1) {
      MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit = true;
      setFinalOpportunityExpanded(true);
      goToFinalHorizonCard(0);
      return true;
    }
    SNAP_STATE.finalCardsAccumulator = 0;
    SNAP_STATE.finalCardsDirection = 0;
    SNAP_STATE.wheelCooldownUntil = performance.now() + WHEEL_COOLDOWN_MS;
    refreshFinalHorizonSnapPoints();
    goToFinalHorizonCard(0, true);
    goToSection(FINAL_HORIZON_SECTION_INDEX - 1, false, { allowIncomingCarry: true });
    return true;
  }
  if (FINAL_HORIZON_STATE.expanded) {
    const cardOne = FINAL_HORIZON_STATE.cards[1];
    setFinalOpportunityExpanded(false);
    if (FINAL_HORIZON_STATE.snapIndex === 0 && cardOne) {
      MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit = false;
      updateMainScrollDebugHud();
      const collapsedTarget = Math.max(
        0,
        cardOne.offsetLeft - FINAL_HORIZON_STATE.sharedLeftAnchor - FINAL_HORIZON_STATE.specialExpansionDelta
      );
      goToFinalHorizonCard(1, false, collapsedTarget);
      return true;
    }
  }
  if (FINAL_HORIZON_STATE.snapIndex === 0) {
    MAIN_SCROLL_DEBUG_STATE.requireFreshSpecialExit = false;
    updateMainScrollDebugHud();
    goToFinalHorizonCard(1);
    return true;
  }
  if (FINAL_HORIZON_STATE.snapIndex < FINAL_HORIZON_STATE.cards.length - 1) {
    goToFinalHorizonCard(FINAL_HORIZON_STATE.snapIndex + 1);
  } else {
    settleFinalHorizonCardSnap();
  }
  return true;
}

function initSection2FillTargets() {
  if (!section2) {
    return;
  }
  const paragraphs = Array.from(section2.querySelectorAll('.folio-about-copy p'));
  let yellowCursor = 0;
  let whiteCursor = 0;

  section2FillTargets = paragraphs.map((paragraph) => {
    paragraph.classList.add('scroll-fill-paragraph');
    const sourceNodes = Array.from(paragraph.childNodes);
    const chars = [];
    const accentWords = [];
    paragraph.textContent = '';
    sourceNodes.forEach((node) => {
      paragraph.appendChild(buildSection2FillNode(node, false, chars, accentWords));
    });
    const start = yellowCursor;
    const paragraphUnits = chars.reduce((sum, char) => sum + char.yellowDuration, 0);
    const target = {
      start,
      whiteStart: whiteCursor,
      whiteDuration: 1,
      chars,
      accentWords
    };
    yellowCursor += paragraphUnits + SECTION2_PARAGRAPH_GAP_UNITS;
    whiteCursor += 1;
    return target;
  });

  section2YellowFillTotalUnits = Math.max(0, yellowCursor - SECTION2_PARAGRAPH_GAP_UNITS);
  section2WhiteFillTotalUnits = Math.max(0, whiteCursor);

  applySection2WhiteFill(0);
  applySection2YellowFill(0);
  applySection2InteractionProgress(0);
}

function applySection2WhiteFill(progress) {
  const clamped = clamp(progress, 0, 1);
  SNAP_STATE.section2WhiteFillProgress = clamped;
  const totalUnits = Math.max(0, section2WhiteFillTotalUnits);
  const localUnits = clamped * totalUnits;
  section2FillTargets.forEach((target) => {
    const fillOpacity = clamp(
      (localUnits - target.whiteStart) / Math.max(target.whiteDuration, 0.0001),
      0,
      1
    );
    target.chars.forEach((char) => {
      if (char.whiteFillLayer) {
        char.whiteFillLayer.style.opacity = fillOpacity.toFixed(3);
      }
    });
  });
}

function applySection2WhiteFillUnits(progressUnits) {
  const totalUnits = Math.max(0.0001, section2WhiteFillTotalUnits);
  applySection2WhiteFill(clamp(progressUnits / totalUnits, 0, 1));
}

function applySection2YellowFill(progressUnits) {
  const safeTotal = Math.max(section2YellowFillTotalUnits, 0);
  const clamped = clamp(progressUnits, 0, safeTotal);
  SNAP_STATE.section2YellowFillUnits = clamped;
  section2FillTargets.forEach((target) => {
    const localUnits = Math.max(0, clamped - target.start);
    target.chars.forEach((char) => {
      if (!char.accentFillLayer) {
        return;
      }
      const fillOpacity = clamp((localUnits - char.start) / char.yellowDuration, 0, 1);
      char.accentFillLayer.style.opacity = fillOpacity.toFixed(3);
    });
    target.accentWords.forEach((word) => {
      const wordProgress = clamp((localUnits - word.start) / Math.max(word.duration, 0.0001), 0, 1);
      word.element.style.setProperty('--scroll-fill-underline-progress', `${(wordProgress * 100).toFixed(3)}%`);
    });
  });
}

function applySection2InteractionProgress(progress) {
  SNAP_STATE.section2InteractionProgress = clamp(progress, 0, 1);
}

function buildSection2FillNode(node, accentActive, chars, accentWords) {
  if (node.nodeType === Node.TEXT_NODE) {
    return buildSection2FillText(node.textContent || '', accentActive, chars, accentWords);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return document.createDocumentFragment();
  }

  const element = node;
  const clone = element.cloneNode(false);
  const accentScopeRoot = element.classList.contains('scroll-fill');
  const nextAccentActive = accentActive || accentScopeRoot;
  const accentStart =
    accentScopeRoot && chars.length ? chars[chars.length - 1].start + chars[chars.length - 1].yellowDuration : 0;
  Array.from(element.childNodes).forEach((child) => {
    clone.appendChild(buildSection2FillNode(child, nextAccentActive, chars, accentWords));
  });
  if (accentScopeRoot) {
    const accentEnd = chars.length ? chars[chars.length - 1].start + chars[chars.length - 1].yellowDuration : accentStart;
    accentWords.push({
      element: clone,
      start: accentStart,
      duration: Math.max(accentEnd - accentStart, SECTION2_ACCENT_CHAR_UNITS)
    });
  }
  return clone;
}

function buildSection2FillText(text, accentActive, chars, accentWords) {
  const fragment = document.createDocumentFragment();
  let word = null;
  let wordStart = 0;
  let wordEnd = 0;

  const flushWord = () => {
    if (!word) {
      return;
    }
    fragment.appendChild(word);
    word = null;
    wordStart = 0;
    wordEnd = 0;
  };

  [...text].forEach((char) => {
    if (char === ' ' || char === '\n' || char === '\t') {
      flushWord();
      fragment.appendChild(document.createTextNode(char));
      return;
    }

    if (!word) {
      word = document.createElement('span');
      word.className = 'scroll-fill-word';
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'scroll-fill-char';

    const baseLayer = document.createElement('span');
    baseLayer.className = 'scroll-fill-char-layer scroll-fill-char-base';
    baseLayer.textContent = char;

    const whiteLayer = document.createElement('span');
    whiteLayer.className = 'scroll-fill-char-layer scroll-fill-char-fill';
    whiteLayer.setAttribute('aria-hidden', 'true');
    whiteLayer.textContent = char;

    let accentLayer = null;
    if (accentActive) {
      accentLayer = document.createElement('span');
      accentLayer.className = 'scroll-fill-char-layer scroll-fill-char-accent';
      accentLayer.setAttribute('aria-hidden', 'true');
      accentLayer.textContent = char;
    }

    wrapper.append(baseLayer, whiteLayer);
    if (accentLayer) {
      wrapper.append(accentLayer);
    }
    word.appendChild(wrapper);
    const yellowDuration = accentActive ? SECTION2_ACCENT_CHAR_UNITS : SECTION2_WHITE_CHAR_UNITS;
    const start =
      chars.length ? chars[chars.length - 1].start + chars[chars.length - 1].yellowDuration : 0;
    if (accentActive && word.childNodes.length === 1) {
      wordStart = start;
    }
    if (accentActive) {
      wordEnd = start + yellowDuration;
    }
    chars.push({
      start,
      yellowDuration,
      whiteFillLayer: whiteLayer,
      accentFillLayer: accentLayer
    });
  });

  flushWord();

  return fragment;
}

function handleSection2Scroll(deltaY) {
  if (!section2FillTargets.length) {
    return false;
  }
  if (section2ModelScene) {
    const scrollSpinMagnitude = Math.max(
      SECTION2_MODEL_DEFAULT_SPIN,
      Math.abs(deltaY) * SECTION2_MODEL_SCROLL_SPIN_FACTOR
    );
    section2ModelScene.scrollSpinVelocity =
      (deltaY < 0 ? -1 : 1) * scrollSpinMagnitude;
    section2ModelScene.lastScrollAt = performance.now();
  }
  if (performance.now() < SNAP_STATE.section2ParagraphLockUntil) {
    return true;
  }
  const atTop = SNAP_STATE.section2YellowFillUnits <= 0.0001;
  const atBottom = SNAP_STATE.section2YellowFillUnits >= section2YellowFillTotalUnits - 0.0001;
  const interactionAtStart = SNAP_STATE.section2InteractionProgress <= 0.0001;
  const interactionAtEnd = SNAP_STATE.section2InteractionProgress >= 0.9999;

  if (deltaY > 0 && !atBottom) {
    SNAP_STATE.section2EdgeAccumulator = 0;
    applySection2WhiteFillUnits(
      SNAP_STATE.section2WhiteFillProgress * section2WhiteFillTotalUnits + deltaY / SECTION2_FILL_UNIT_PX
    );
    applySection2YellowFill(
      SNAP_STATE.section2YellowFillUnits + deltaY / SECTION2_YELLOW_FILL_UNIT_PX
    );
    ensureSectionAnimationLoop();
    return true;
  }

  if (deltaY > 0 && atBottom && !interactionAtEnd) {
    SNAP_STATE.section2EdgeAccumulator = 0;
    applySection2InteractionProgress(clamp(
      SNAP_STATE.section2InteractionProgress + deltaY / SECTION2_INTERACTION_TRAVEL_PX,
      0,
      1
    ));
    ensureSectionAnimationLoop();
    return true;
  }

  if (deltaY < 0 && !interactionAtStart) {
    SNAP_STATE.section2EdgeAccumulator = 0;
    applySection2InteractionProgress(clamp(
      SNAP_STATE.section2InteractionProgress + deltaY / SECTION2_INTERACTION_TRAVEL_PX,
      0,
      1
    ));
    ensureSectionAnimationLoop();
    return true;
  }

  if (deltaY < 0 && !atTop) {
    SNAP_STATE.section2EdgeAccumulator = 0;
    applySection2YellowFill(
      SNAP_STATE.section2YellowFillUnits + deltaY / SECTION2_YELLOW_FILL_UNIT_PX
    );
    ensureSectionAnimationLoop();
    return true;
  }

  const edgeDirection = deltaY > 0 ? 1 : -1;
  if (SNAP_STATE.section2EdgeDirection !== edgeDirection) {
    SNAP_STATE.section2EdgeAccumulator = 0;
  }
  SNAP_STATE.section2EdgeDirection = edgeDirection;
  SNAP_STATE.section2EdgeAccumulator += deltaY;

  if (Math.abs(SNAP_STATE.section2EdgeAccumulator) >= WHEEL_SNAP_THRESHOLD) {
    SNAP_STATE.section2EdgeAccumulator = 0;
    SNAP_STATE.lastPrimaryInputDelta = deltaY;
    queueOrGo(edgeDirection);
  }
  return true;
}

function goToSection(nextIndex, immediate = false, options = {}) {
  const { suppressMorph = false, allowIncomingCarry = false } = options;
  const clamped = clamp(nextIndex, 0, snapSections.length - 1);
  if (clamped !== FINAL_HORIZON_SECTION_INDEX) {
    hideFinalHorizonHoverChip();
    hideFinalHorizonLottieMarker();
  }
  const previousIndex = SNAP_STATE.index;
  if (clamped === SNAP_STATE.index && !immediate) {
    return;
  }

  const previousAnimatedState = getSectionAnimationState(SNAP_STATE.index);
  if (previousAnimatedState && clamped !== SNAP_STATE.index) {
    resetSectionAnimationState(previousAnimatedState, { suppressNavUpdate: true });
  }
  if (clamped === 0) {
    applySection2WhiteFill(0);
    applySection2YellowFill(0);
    applySection2InteractionProgress(0);
  }

  const targetY = -clamped * window.innerHeight;
  const startY = -previousIndex * window.innerHeight;
  if (immediate) {
    gsap.set(snapTrack, { y: targetY });
    SNAP_STATE.index = clamped;
    syncBodySectionState(clamped);
    updateSectionOneWaveVisibilityFromTrackPosition(targetY);
    refreshSection2ModelVisibility();
    if (clamped === FINAL_HORIZON_SECTION_INDEX) {
      activateFinalHorizonSection(previousIndex);
    } else {
      hideFinalHorizonLottieMarker();
    }
    activateSectionAnimation(clamped);
    settleAfterSectionChange();
    if (allowIncomingCarry && clamped === 1) {
      SNAP_STATE.wheelCooldownUntil = 0;
      SNAP_STATE.section2ParagraphLockUntil = 0;
    }
    return;
  }

  SNAP_STATE.isAnimating = true;
  recordMainScrollDebugMotion('start');
  if (clamped === FINAL_HORIZON_SECTION_INDEX && previousIndex !== FINAL_HORIZON_SECTION_INDEX) {
    prepareFinalHorizonEntryState();
  }
  gsap.to(snapTrack, {
    y: targetY,
    duration: 0.78,
    ease: 'power2.inOut',
    onStart: () => {
      if (!suppressMorph && clamped !== SNAP_STATE.index) {
        playSectionMorphTransition(clamped > SNAP_STATE.index ? 1 : -1, clamped);
      }
      if (clamped === 1 && clamped !== SNAP_STATE.index && !allowIncomingCarry) {
        SNAP_STATE.section2ParagraphLockUntil = performance.now() + WHEEL_COOLDOWN_MS;
      }
      syncBodySectionState(clamped);
    },
    onUpdate: () => {
      const currentY = Number(gsap.getProperty(snapTrack, 'y')) || 0;
      updateSectionOneWaveVisibilityFromTrackPosition(currentY);
      if (previousIndex === 1 && clamped === FINAL_HORIZON_SECTION_INDEX) {
        const travel = targetY - startY;
        const progress = travel === 0 ? 1 : clamp((currentY - startY) / travel, 0, 1);
        if (progress >= 0.4) {
          startFinalHorizonEntryTween();
        }
      }
      refreshSection2ModelVisibility();
    },
    onComplete: () => {
      SNAP_STATE.index = clamped;
      SNAP_STATE.isAnimating = false;
      recordMainScrollDebugMotion('end');
      updateSectionOneWaveVisibilityFromTrackPosition(targetY);
      refreshSection2ModelVisibility();
      if (clamped === FINAL_HORIZON_SECTION_INDEX) {
        activateFinalHorizonSection(previousIndex);
      }
      activateSectionAnimation(clamped);
      settleAfterSectionChange();
      if (allowIncomingCarry && clamped === 1) {
        SNAP_STATE.wheelCooldownUntil = 0;
        SNAP_STATE.section2ParagraphLockUntil = 0;
      }
    }
  });
}

function queueOrGo(direction) {
  if (!direction) {
    return;
  }
  const dir = direction > 0 ? 1 : -1;
  if (SNAP_STATE.isAnimating) {
    return;
  }
  if (SNAP_STATE.isTransitioning) {
    return;
  }
  if (dir > 0 && isAnimatedSectionIndex(SNAP_STATE.index)) {
    const state = getSectionAnimationState(SNAP_STATE.index);
    if (state && state.progressSeconds >= state.durationSeconds && isAnimatedSectionIndex(SNAP_STATE.index + 1)) {
      if (beginAnimatedSectionTransition(SNAP_STATE.index + 1, 1)) {
        return;
      }
    }
  }
  if (dir < 0 && isAnimatedSectionIndex(SNAP_STATE.index) && isAnimatedSectionIndex(SNAP_STATE.index - 1)) {
    const state = getSectionAnimationState(SNAP_STATE.index);
    if (!state || state.progressSeconds > 0.0001) {
      return;
    }
    if (beginAnimatedSectionTransition(SNAP_STATE.index - 1, -1)) {
      return;
    }
  }
  goToSection(SNAP_STATE.index + dir);
}

function initSnapScroll() {
  if (!snapRoot || !snapTrack || !snapSections.length) {
    return;
  }

  goToSection(0, true);
  initMainScrollDebug();

  if (finalHorizonScroller) {
    finalHorizonScroller.addEventListener(
      'scroll',
      () => {
        if (FINAL_HORIZON_STATE.isAnimating) {
          return;
        }
        FINAL_HORIZON_STATE.x = finalHorizonScroller.scrollLeft;
        updateFinalHorizonVisuals();
      },
      { passive: true }
    );
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      FINAL_HORIZON_STATE.pointerX = event.clientX;
      FINAL_HORIZON_STATE.pointerY = event.clientY;
      if (FINAL_HORIZON_STATE.hoverCardIndex != null) {
        updateFinalHorizonHoverChipPosition(event.clientX, event.clientY);
      }
      if (document.body.dataset.section === String(FINAL_HORIZON_SECTION_INDEX + 1) && FINAL_HORIZON_STATE.index === 1) {
        const card = FINAL_HORIZON_STATE.cards[1];
        if (card) {
          updateFinalHorizonCardOneSplit(card, true);
        }
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const now = performance.now();
      SNAP_STATE.lastPrimaryInputDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      recordMainScrollDebugInput(event.deltaX, event.deltaY);
      if (SNAP_STATE.index === FINAL_HORIZON_SECTION_INDEX && !SNAP_STATE.isAnimating) {
        handleFinalHorizonScroll(event.deltaX, event.deltaY);
        return;
      }
      if (SNAP_STATE.index === 1 && !SNAP_STATE.isAnimating) {
        handleSection2Scroll(event.deltaY);
        return;
      }
      const animatedState = getSectionAnimationState(SNAP_STATE.index);
      if (animatedState && !SNAP_STATE.isAnimating) {
        if (handleAnimatedSectionScroll(animatedState, event.deltaY)) {
          return;
        }
      }
      if (SNAP_STATE.isAnimating || now < SNAP_STATE.wheelCooldownUntil) {
        return;
      }
      const direction = event.deltaY === 0 ? 0 : event.deltaY > 0 ? 1 : -1;
      if (!direction) {
        return;
      }
      if (SNAP_STATE.lastWheelDirection !== direction) {
        SNAP_STATE.wheelAccumulator = 0;
      }
      SNAP_STATE.lastWheelDirection = direction;
      SNAP_STATE.wheelAccumulator += event.deltaY;

      if (Math.abs(SNAP_STATE.wheelAccumulator) < WHEEL_SNAP_THRESHOLD) {
        return;
      }

      SNAP_STATE.wheelAccumulator = 0;
      SNAP_STATE.wheelCooldownUntil = now + WHEEL_COOLDOWN_MS;
      queueOrGo(direction);
    },
    { passive: false }
  );

  window.addEventListener(
    'keydown',
    (event) => {
      if (SNAP_STATE.index === FINAL_HORIZON_SECTION_INDEX && !SNAP_STATE.isAnimating) {
        if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
          event.preventDefault();
          handleFinalHorizonScroll(0, WHEEL_SNAP_THRESHOLD);
          return;
        }
        if (event.key === 'ArrowUp' || event.key === 'PageUp') {
          event.preventDefault();
          handleFinalHorizonScroll(0, -WHEEL_SNAP_THRESHOLD);
          return;
        }
      }
      const animatedState = getSectionAnimationState(SNAP_STATE.index);
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        if (animatedState && animatedState.progressSeconds < animatedState.durationSeconds) {
          handleAnimatedSectionScroll(animatedState, WHEEL_SNAP_THRESHOLD);
          return;
        }
        queueOrGo(1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        if (animatedState) {
          if (handleAnimatedSectionScroll(animatedState, -WHEEL_SNAP_THRESHOLD)) {
            return;
          }
        }
        queueOrGo(-1);
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'touchstart',
    (event) => {
      if (!event.touches.length) {
        return;
      }
      SNAP_STATE.touchStartY = event.touches[0].clientY;
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
      const dy = SNAP_STATE.touchStartY - event.changedTouches[0].clientY;
      if (Math.abs(dy) < 40) {
        return;
      }
      if (SNAP_STATE.index === FINAL_HORIZON_SECTION_INDEX && !SNAP_STATE.isAnimating) {
        handleFinalHorizonScroll(0, dy);
        return;
      }
      const animatedState = getSectionAnimationState(SNAP_STATE.index);
      if (animatedState) {
        if (handleAnimatedSectionScroll(animatedState, dy)) {
          return;
        }
      }
      queueOrGo(dy > 0 ? 1 : -1);
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      resizeMainScrollDebugGraph();
      renderSectionTransitionShape();
      goToSection(SNAP_STATE.index, true);
      updatePersistentBottomNav(SNAP_STATE.index);
      refreshFinalHorizonSnapPoints();
      if (SNAP_STATE.index === FINAL_HORIZON_SECTION_INDEX) {
        goToFinalHorizonCard(FINAL_HORIZON_STATE.snapIndex, true);
        updateFinalHorizonLottieMarker(FINAL_HORIZON_STATE.index);
      } else {
        hideFinalHorizonLottieMarker();
      }
      scheduleSectionMorphHint();
    },
    { passive: true }
  );
}

document.addEventListener('DOMContentLoaded', init);
