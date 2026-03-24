const shell = document.querySelector('.prototype-shell');
const interaction = document.getElementById('prototype-interaction');
const grid = document.getElementById('prototype-grid');
const pathDebug = document.getElementById('prototype-path-debug');
const pathLayer = document.getElementById('prototype-path-layer');
const modelMount = document.getElementById('prototype-model');
const pathHudNode = document.getElementById('prototype-path-hud-node');
const pathHudHandle = document.getElementById('prototype-path-hud-handle');
const pathHudTangent = document.getElementById('prototype-path-hud-tangent');
const cards = Array.from(document.querySelectorAll('.prototype-card'));
const highlights = Array.from(document.querySelectorAll('.prototype-highlight'));

const HIGHLIGHT_PORTION = 0.2;
const GRID_STEP_PX = 18;
const GRID_SCROLL_FACTOR = 120;
const MODEL_RENDER_PIXEL_RATIO_CAP = 1.5;
const MODEL_IDLE_SPIN = 0.55;
const MODEL_SCROLL_SPIN_FACTOR = 300;
const MODEL_AUTOPLAY_RESUME_DELAY_MS = 280;
const MODEL_VIEWER_ALIGN_LERP = 0.16;
const MODEL_BASE_TILT_Z = Math.PI * 1.5;
const MODEL_DIRECTION_FLIP_LERP = 0.18;
const PATH_EDITOR_SHORTCUTS_ENABLED = false;
const NODE_MOVE_STEP = 8;
const HANDLE_ROTATE_STEP = Math.PI / 36;
const HANDLE_LENGTH_STEP = 12;
const CARD_PROGRESS_START = 0.18;
const CARD_PROGRESS_END = 0.94;
const SNAP_RADIUS = 0.085;
const CARD_ACTIVATION_ENTER_PX = 36;
const CARD_ACTIVATION_EXIT_PX = 64;
const CARD_TILT_RANGE = 40;
const CARD_SHIFT_RANGE = 40;
const DEFAULT_PATH_NODES = [
  { x: 264.5, y: 710, inAngle: 0.8321, outAngle: -2.3095, inLength: 240, outLength: 240 },
  { x: 65, y: 1054, inAngle: 4.0317, outAngle: 0.8901, inLength: 240, outLength: 240 },
  { x: 514, y: 1394, inAngle: 5.0109, outAngle: 1.8693, inLength: 240, outLength: 240 },
  { x: 518, y: 1764, inAngle: 5.1775, outAngle: 2.0359, inLength: 151.55, outLength: 151.55 },
  { x: 26, y: 2082, inAngle: 4.0519, outAngle: 0.9103, inLength: 240, outLength: 240 },
  { x: 438, y: 2416.5, inAngle: 6.127, outAngle: 2.9854, inLength: 240, outLength: 240 }
];

const waypointRects = [];
let latestScrollY = window.scrollY;
let pointerScene = null;
let cardsInitialized = false;
let activeCardIndex = -1;
let hasCustomPathEdits = false;
let latestWheelDelta = 0;

const pathEditor = {
  nodes: [],
  selectedNodeIndex: 0,
  selectedHandle: 'out'
};

const state = {
  progress: 0,
  displayProgress: 0,
  modelX: 0,
  modelY: 0,
  pathAngle: 0
};

const cardTiltSetters = cards.map((card) => {
  const shell = card.querySelector('.prototype-card-shell');
  const content = card.querySelector('.prototype-card-content');
  return {
    shellRotateX: window.gsap.quickTo(shell, 'rotationX', { duration: 0.25, ease: 'power3.out' }),
    shellRotateY: window.gsap.quickTo(shell, 'rotationY', { duration: 0.25, ease: 'power3.out' }),
    shellZ: window.gsap.quickTo(shell, 'z', { duration: 0.28, ease: 'power3.out' }),
    contentX: window.gsap.quickTo(content, 'x', { duration: 0.28, ease: 'power3.out' }),
    contentY: window.gsap.quickTo(content, 'y', { duration: 0.28, ease: 'power3.out' })
  };
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  return 1 - ((1 - t) ** 3);
}

function lerpAngle(from, to, alpha) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * alpha;
}

function getScrollBounds() {
  const shellRect = shell.getBoundingClientRect();
  const maxScroll = Math.max(1, shell.offsetHeight - window.innerHeight);
  const traveled = clamp(-shellRect.top, 0, maxScroll);
  return {
    normalized: clamp(traveled / maxScroll, 0, 1)
  };
}

function computeIntroProgress(normalizedScroll) {
  return clamp(normalizedScroll / HIGHLIGHT_PORTION, 0, 1);
}

function computeInteractionProgress(normalizedScroll) {
  return clamp((normalizedScroll - HIGHLIGHT_PORTION) / (1 - HIGHLIGHT_PORTION), 0, 1);
}

function measureWaypoints() {
  waypointRects.length = 0;
  cards.forEach((card) => {
    waypointRects.push({
      x: card.offsetLeft + card.offsetWidth * 0.5,
      y: card.offsetTop + card.offsetHeight * 0.5,
      width: card.offsetWidth,
      height: card.offsetHeight
    });
  });
}

function getWaypointCenters() {
  return waypointRects.map((point) => ({ x: point.x, y: point.y }));
}

function getSegmentCount() {
  return Math.max(1, waypointRects.length - 1);
}

function getAnchorProgress(index) {
  const span = CARD_PROGRESS_END - CARD_PROGRESS_START;
  return CARD_PROGRESS_START + (index / getSegmentCount()) * span;
}

function magnetizeProgress(progress) {
  let result = progress;
  for (let index = 0; index < waypointRects.length; index += 1) {
    const anchor = getAnchorProgress(index);
    const delta = anchor - result;
    const distance = Math.abs(delta);
    if (distance > SNAP_RADIUS) {
      continue;
    }
    const strength = 1 - (distance / SNAP_RADIUS);
    result += delta * easeOutCubic(strength) * 0.72;
  }
  return clamp(result, 0, 1);
}

function buildInitialPathNodes() {
  return DEFAULT_PATH_NODES.map((node) => ({ ...node }));
}

function updatePathHud() {
  if (!pathHudNode || !pathHudHandle) {
    return;
  }
  pathHudNode.textContent = `Node ${pathEditor.selectedNodeIndex + 1}`;
  pathHudHandle.textContent = pathEditor.selectedHandle.toUpperCase();
}

function updateTangentHud(angleRadians = null) {
  if (!pathHudTangent) {
    return;
  }
  if (angleRadians === null) {
    pathHudTangent.textContent = 'Tangent angle: --';
    return;
  }
  const degrees = angleRadians * (180 / Math.PI);
  pathHudTangent.textContent = `Tangent angle: ${degrees.toFixed(1)}deg`;
}

function ensurePathNodes(forceReset = false) {
  if (forceReset || !pathEditor.nodes.length) {
    pathEditor.nodes = buildInitialPathNodes();
    pathEditor.selectedNodeIndex = clamp(pathEditor.selectedNodeIndex, 0, Math.max(0, pathEditor.nodes.length - 1));
    hasCustomPathEdits = false;
  }
  updatePathHud();
}

function syncPathNodesToCardsIfNeeded() {
  ensurePathNodes();
}

function getHandlePosition(node, type) {
  const angle = type === 'in' ? node.inAngle : node.outAngle;
  const length = type === 'in' ? node.inLength : node.outLength;
  return {
    x: node.x + Math.cos(angle) * length,
    y: node.y + Math.sin(angle) * length
  };
}

function buildBezierPathD(nodes, translateY = 0) {
  if (!nodes.length) {
    return '';
  }
  let d = `M ${nodes[0].x.toFixed(2)} ${(nodes[0].y + translateY).toFixed(2)}`;
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const current = nodes[i];
    const next = nodes[i + 1];
    const cp1 = getHandlePosition(current, 'out');
    const cp2 = getHandlePosition(next, 'in');
    d += ` C ${cp1.x.toFixed(2)} ${(cp1.y + translateY).toFixed(2)}, ${cp2.x.toFixed(2)} ${(cp2.y + translateY).toFixed(2)}, ${next.x.toFixed(2)} ${(next.y + translateY).toFixed(2)}`;
  }
  return d;
}

function renderPathDebug(nodes, translateY) {
  if (!pathDebug) {
    return;
  }
  pathDebug.setAttribute('viewBox', `0 0 ${interaction.clientWidth} ${interaction.clientHeight}`);
  pathDebug.innerHTML = '';
  if (!nodes.length) {
    return;
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'prototype-path-debug-track');
  path.setAttribute('d', buildBezierPathD(nodes, translateY));
  pathDebug.appendChild(path);

  nodes.forEach((node, index) => {
    const shiftedY = node.y + translateY;
    if (shiftedY < -180 || shiftedY > interaction.clientHeight + 180) {
      return;
    }
    const selectedNode = index === pathEditor.selectedNodeIndex;

    ['in', 'out'].forEach((handleType) => {
      const handle = getHandlePosition(node, handleType);
      const handleY = handle.y + translateY;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'prototype-path-debug-handle-line');
      line.setAttribute('x1', node.x.toFixed(2));
      line.setAttribute('y1', shiftedY.toFixed(2));
      line.setAttribute('x2', handle.x.toFixed(2));
      line.setAttribute('y2', handleY.toFixed(2));
      pathDebug.appendChild(line);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute(
        'class',
        `prototype-path-debug-handle${selectedNode && pathEditor.selectedHandle === handleType ? ' is-selected' : ''}`
      );
      dot.setAttribute('cx', handle.x.toFixed(2));
      dot.setAttribute('cy', handleY.toFixed(2));
      dot.setAttribute('r', '4');
      pathDebug.appendChild(dot);
    });

    const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    anchor.setAttribute(
      'class',
      `prototype-path-debug-anchor prototype-path-debug-node${selectedNode ? ' is-selected' : ''}`
    );
    anchor.setAttribute('cx', node.x.toFixed(2));
    anchor.setAttribute('cy', shiftedY.toFixed(2));
    anchor.setAttribute('r', selectedNode ? '6' : '4.5');
    pathDebug.appendChild(anchor);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'prototype-path-debug-label');
    label.setAttribute('x', (node.x + 10).toFixed(2));
    label.setAttribute('y', (shiftedY - 10).toFixed(2));
    label.textContent = `${index}`;
    pathDebug.appendChild(label);
  });
}

function getBezierPoint(nodes, progress) {
  if (!nodes.length) {
    return { x: 0, y: 0, angle: 0 };
  }
  if (nodes.length === 1) {
    return { x: nodes[0].x, y: nodes[0].y, angle: 0 };
  }
  const segmentCount = nodes.length - 1;
  const scaled = clamp(progress, 0, 0.999999) * segmentCount;
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
}

function renderTangentDebug(point, translateY) {
  if (!pathDebug) {
    return;
  }
  const centerX = point.x;
  const centerY = point.y + translateY;
  const tangentLength = 42;
  const tangent = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  tangent.setAttribute('class', 'prototype-path-debug-tangent');
  tangent.setAttribute('x1', (centerX - Math.cos(point.angle) * tangentLength).toFixed(2));
  tangent.setAttribute('y1', (centerY - Math.sin(point.angle) * tangentLength).toFixed(2));
  tangent.setAttribute('x2', (centerX + Math.cos(point.angle) * tangentLength).toFixed(2));
  tangent.setAttribute('y2', (centerY + Math.sin(point.angle) * tangentLength).toFixed(2));
  pathDebug.appendChild(tangent);

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('class', 'prototype-path-debug-model-ring');
  ring.setAttribute('cx', centerX.toFixed(2));
  ring.setAttribute('cy', centerY.toFixed(2));
  ring.setAttribute('r', '16');
  pathDebug.appendChild(ring);
}

function syncOppositeHandle(node, editedHandle) {
  if (!node) {
    return;
  }
  if (editedHandle === 'in') {
    node.outAngle = node.inAngle + Math.PI;
    node.outLength = node.inLength;
    return;
  }
  node.inAngle = node.outAngle + Math.PI;
  node.inLength = node.outLength;
}

function serializePathNodes() {
  return pathEditor.nodes.map((node, index) => ({
    index,
    x: Number(node.x.toFixed(2)),
    y: Number(node.y.toFixed(2)),
    inAngle: Number(node.inAngle.toFixed(4)),
    outAngle: Number(node.outAngle.toFixed(4)),
    inLength: Number(node.inLength.toFixed(2)),
    outLength: Number(node.outLength.toFixed(2))
  }));
}

function editSelectedNode(deltaX, deltaY) {
  const node = pathEditor.nodes[pathEditor.selectedNodeIndex];
  if (!node) {
    return;
  }
  node.x += deltaX;
  node.y += deltaY;
  hasCustomPathEdits = true;
}

function rotateSelectedHandle(direction) {
  const node = pathEditor.nodes[pathEditor.selectedNodeIndex];
  if (!node) {
    return;
  }
  const key = pathEditor.selectedHandle === 'in' ? 'inAngle' : 'outAngle';
  node[key] += HANDLE_ROTATE_STEP * direction;
  syncOppositeHandle(node, pathEditor.selectedHandle);
  hasCustomPathEdits = true;
}

function resizeSelectedHandle(direction) {
  const node = pathEditor.nodes[pathEditor.selectedNodeIndex];
  if (!node) {
    return;
  }
  const key = pathEditor.selectedHandle === 'in' ? 'inLength' : 'outLength';
  node[key] = clamp(node[key] + HANDLE_LENGTH_STEP * direction, 0, 240);
  syncOppositeHandle(node, pathEditor.selectedHandle);
  hasCustomPathEdits = true;
}

function cycleSelectedNode(direction) {
  const count = pathEditor.nodes.length;
  if (!count) {
    return;
  }
  pathEditor.selectedNodeIndex = (pathEditor.selectedNodeIndex + direction + count) % count;
  updatePathHud();
}

function selectNode(index) {
  pathEditor.selectedNodeIndex = clamp(index, 0, Math.max(0, pathEditor.nodes.length - 1));
  updatePathHud();
}

function handlePathEditorKeydown(event) {
  if (!PATH_EDITOR_SHORTCUTS_ENABLED) {
    return;
  }
  if (!pathEditor.nodes.length) {
    return;
  }
  if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    selectNode(Number(event.key) - 1);
    return;
  }
  const moveStep = event.shiftKey ? NODE_MOVE_STEP * 3 : NODE_MOVE_STEP;
  if (event.key === 'Tab') {
    event.preventDefault();
    cycleSelectedNode(event.shiftKey ? -1 : 1);
    return;
  }
  if (event.key === 'h' || event.key === 'H') {
    event.preventDefault();
    pathEditor.selectedHandle = pathEditor.selectedHandle === 'in' ? 'out' : 'in';
    updatePathHud();
    return;
  }
  if (event.key === 'q' || event.key === 'Q') {
    event.preventDefault();
    rotateSelectedHandle(-1);
    return;
  }
  if (event.key === 'e' || event.key === 'E') {
    event.preventDefault();
    rotateSelectedHandle(1);
    return;
  }
  if (event.key === '[') {
    event.preventDefault();
    resizeSelectedHandle(-1);
    return;
  }
  if (event.key === ']') {
    event.preventDefault();
    resizeSelectedHandle(1);
    return;
  }
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    ensurePathNodes(true);
    return;
  }
  if (event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    console.log('SECTION2_PATH_EXPORT');
    console.log(JSON.stringify(serializePathNodes(), null, 2));
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    editSelectedNode(0, -moveStep);
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    editSelectedNode(0, moveStep);
    return;
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    editSelectedNode(-moveStep, 0);
    return;
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    editSelectedNode(moveStep, 0);
  }
}

function updateHighlights(progress) {
  highlights.forEach((node, index) => {
    const start = index / highlights.length;
    const end = (index + 1) / highlights.length;
    const local = smoothstep(start, end, progress);
    const dim = mix(0.18, 1, local);
    node.style.color = `rgba(185, 114, 232, ${dim.toFixed(3)})`;
  });
}

function updateGrid(progress) {
  grid.style.transform = `translate3d(0, ${(-progress * GRID_SCROLL_FACTOR).toFixed(2)}px, 0)`;
}

function getDistanceToRect(pointX, pointY, rect) {
  const dx = Math.max(rect.left - pointX, 0, pointX - rect.right);
  const dy = Math.max(rect.top - pointY, 0, pointY - rect.bottom);
  return Math.hypot(dx, dy);
}

function updateCards(objectX, objectY) {
  const interactionRect = interaction.getBoundingClientRect();
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
      distanceToRect: getDistanceToRect(objectX, objectY, localRect),
      distanceToCenter: Math.hypot(
        objectX - (localRect.left + localRect.width * 0.5),
        objectY - (localRect.top + localRect.height * 0.5)
      )
    };
  });

  if (activeCardIndex >= 0) {
    const currentMetric = metrics[activeCardIndex];
    if (!currentMetric || currentMetric.distanceToRect > CARD_ACTIVATION_EXIT_PX) {
      activeCardIndex = -1;
    }
  }

  if (activeCardIndex < 0) {
    const candidate = metrics
      .filter((metric) => metric.distanceToRect <= CARD_ACTIVATION_ENTER_PX)
      .sort((a, b) => a.distanceToCenter - b.distanceToCenter)[0];
    activeCardIndex = candidate ? candidate.index : -1;
  }

  metrics.forEach((metric) => {
    const distanceWindow = activeCardIndex === metric.index ? CARD_ACTIVATION_EXIT_PX : CARD_ACTIVATION_ENTER_PX;
    const active = smoothstep(distanceWindow, 0, metric.distanceToRect);
    metric.card.querySelector('.prototype-card-fill').style.opacity = active.toFixed(3);
    metric.card.querySelector('.prototype-card-glow').style.opacity = (active * 0.9).toFixed(3);
    metric.card.querySelector('h2').style.color = `rgba(255, 251, 241, ${active.toFixed(3)})`;
    metric.card.style.setProperty('--card-outline-opacity', (0.42 + active * 0.58).toFixed(3));
    metric.card.classList.toggle('is-active', activeCardIndex === metric.index && active > 0.02);
  });
}

function resetInactiveCardTilt(activeIndexOverride = activeCardIndex) {
  cardTiltSetters.forEach((setters, index) => {
    if (index === activeIndexOverride) {
      return;
    }
    setters.shellRotateX(0);
    setters.shellRotateY(0);
    setters.shellZ(0);
    setters.contentX(0);
    setters.contentY(0);
  });
}

function handleCardPointerMove(event) {
  const cardIndex = Number(event.currentTarget.dataset.cardIndex || 0);
  if (cardIndex !== activeCardIndex || activeCardIndex < 0) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const setters = cardTiltSetters[cardIndex];
  setters.shellRotateX(mix(CARD_TILT_RANGE, -CARD_TILT_RANGE, py));
  setters.shellRotateY(mix(-CARD_TILT_RANGE, CARD_TILT_RANGE, px));
  setters.shellZ(26);
  setters.contentX(mix(-CARD_SHIFT_RANGE, CARD_SHIFT_RANGE, px));
  setters.contentY(mix(-CARD_SHIFT_RANGE, CARD_SHIFT_RANGE, py));
}

function handleCardPointerLeave(event) {
  const cardIndex = Number(event.currentTarget.dataset.cardIndex || 0);
  const setters = cardTiltSetters[cardIndex];
  setters.shellRotateX(0);
  setters.shellRotateY(0);
  setters.shellZ(0);
  setters.contentX(0);
  setters.contentY(0);
}

function bindCardPointer() {
  if (cardsInitialized) {
    return;
  }
  cards.forEach((card) => {
    card.addEventListener('pointermove', handleCardPointerMove);
    card.addEventListener('pointerleave', handleCardPointerLeave);
  });
  cardsInitialized = true;
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
      .replace('#include <common>', `#include <common>
varying vec3 vPointerObjectNormal;
varying vec3 vPointerObjectPosition;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vPointerObjectNormal = normalize(objectNormal);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vPointerObjectPosition = position;`);

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
      .replace('#include <common>', `#include <common>
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
uniform float uHighlightStrength;`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
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
outgoingLight += uHighlightColor * pow(viewFresnel, 4.5) * uHighlightStrength;`);
  };

  material.customProgramCacheKey = () => 'pointer-fresnel-v1';
  return material;
}

async function initPointerScene() {
  const [THREE, loaderModule, environmentModule] = await Promise.all([
    import('https://esm.sh/three@0.161.0'),
    import('https://esm.sh/three@0.161.0/examples/jsm/loaders/GLTFLoader.js'),
    import('https://esm.sh/three@0.161.0/examples/jsm/environments/RoomEnvironment.js')
  ]);

  const loader = new loaderModule.GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.load('Assets/models/pointer/pointer.gltf', resolve, undefined, reject);
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.25, 11.5);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MODEL_RENDER_PIXEL_RATIO_CAP));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  renderer.setClearColor(0x000000, 0);
  modelMount.appendChild(renderer.domElement);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new environmentModule.RoomEnvironment(renderer), 0.015).texture;

  const keyLight = new THREE.DirectionalLight(0xf3d7ff, 0.95);
  keyLight.position.set(5, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8a43ff, 0.78);
  rimLight.position.set(-4, 3, -5);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0x2a1840, 0.34));

  const modelGroup = new THREE.Group();
  const modelTiltGroup = new THREE.Group();
  const modelSpinGroup = new THREE.Group();
  modelGroup.add(modelTiltGroup);
  modelTiltGroup.add(modelSpinGroup);
  scene.add(modelGroup);

  const root = gltf.scene;
  const reflectiveMaterial = createPointerMaterial(THREE);
  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }
    node.material = reflectiveMaterial.clone();
    node.material.needsUpdate = true;
  });

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 1);
  const baseScale = (7 / maxAxis) * 0.4;
  root.scale.setScalar(baseScale);
  root.position.sub(center.multiplyScalar(baseScale));
  modelTiltGroup.rotation.z = MODEL_BASE_TILT_Z;
  modelSpinGroup.add(root);

  const resize = () => {
    const width = Math.max(1, modelMount.clientWidth);
    const height = Math.max(1, modelMount.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const animationLoop = () => {
    const now = performance.now();
    const dt = Math.max(0, Math.min((now - pointerScene.lastFrameTime) / 1000, 0.05));
    pointerScene.lastFrameTime = now;
    const isScrollDriving = now - pointerScene.lastScrollAt < MODEL_AUTOPLAY_RESUME_DELAY_MS;
    const spinVelocity = isScrollDriving ? pointerScene.scrollSpinVelocity : MODEL_IDLE_SPIN;
    modelSpinGroup.rotation.y += dt * spinVelocity;
    renderer.render(scene, camera);
  };

  pointerScene = {
    renderer,
    modelGroup,
    modelTiltGroup,
    resize,
    lastFrameTime: performance.now(),
    lastScrollAt: 0,
    scrollSpinVelocity: MODEL_IDLE_SPIN,
    viewerRotation: 0,
    directionFlipRotation: MODEL_BASE_TILT_Z
  };

  resize();
  renderer.setAnimationLoop(animationLoop);
}

function updatePointerSpin() {
  if (!pointerScene) {
    return;
  }
  const scrollDelta = window.scrollY - latestScrollY;
  latestScrollY = window.scrollY;
  const delta = Math.abs(latestWheelDelta) > Math.abs(scrollDelta) ? latestWheelDelta : scrollDelta;
  latestWheelDelta = 0;
  if (!delta) {
    return;
  }
  const magnitude = Math.max(MODEL_IDLE_SPIN, Math.abs(delta) * MODEL_SCROLL_SPIN_FACTOR * 0.02);
  pointerScene.scrollSpinVelocity = (delta < 0 ? -1 : 1) * magnitude;
  pointerScene.lastScrollAt = performance.now();
}

function render() {
  const { normalized } = getScrollBounds();
  const introProgress = computeIntroProgress(normalized);
  state.progress = computeInteractionProgress(normalized);
  const magnetized = magnetizeProgress(state.progress);
  state.displayProgress += (magnetized - state.displayProgress) * 0.16;

  measureWaypoints();
  syncPathNodesToCardsIfNeeded();
  updateHighlights(introProgress);
  updateGrid(state.displayProgress);

  const point = getBezierPoint(pathEditor.nodes, state.displayProgress);
  const centerY = interaction.clientHeight * 0.5;
  const translateY = centerY - point.y;
  pathLayer.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
  renderPathDebug(pathEditor.nodes, translateY);
  renderTangentDebug(point, translateY);
  updateTangentHud(point.angle);

  state.modelX = point.x;
  state.modelY = centerY;
  state.pathAngle = point.angle;
  let viewerRotation = 0;

  if (pointerScene) {
    pointerScene.modelGroup.position.x = Math.cos(state.pathAngle) * 0.12;
    pointerScene.modelGroup.position.y = Math.sin(state.pathAngle) * 0.12;
    pointerScene.viewerRotation = lerpAngle(
      pointerScene.viewerRotation,
      state.pathAngle,
      MODEL_VIEWER_ALIGN_LERP
    );
    viewerRotation = pointerScene.viewerRotation;
    const scrollingUp = pointerScene.scrollSpinVelocity < 0;
    const targetFlipRotation = MODEL_BASE_TILT_Z + (scrollingUp ? Math.PI : 0);
    pointerScene.directionFlipRotation = lerpAngle(
      pointerScene.directionFlipRotation,
      targetFlipRotation,
      MODEL_DIRECTION_FLIP_LERP
    );
    pointerScene.modelTiltGroup.rotation.z = pointerScene.directionFlipRotation;
  }

  modelMount.style.transform =
    `translate(${state.modelX.toFixed(2)}px, ${state.modelY.toFixed(2)}px) translate(-50%, -50%) rotate(${viewerRotation.toFixed(4)}rad)`;
  updateCards(state.modelX, state.modelY);
  resetInactiveCardTilt();

  updatePointerSpin();
  requestAnimationFrame(render);
}

function handleResize() {
  measureWaypoints();
  if (!hasCustomPathEdits) {
    ensurePathNodes(true);
  }
  if (pointerScene) {
    pointerScene.resize();
  }
}

function resetPrototypeScroll() {
  window.scrollTo(0, 0);
  latestScrollY = 0;
}

async function init() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  resetPrototypeScroll();
  window.addEventListener('load', resetPrototypeScroll);
  window.addEventListener('pageshow', resetPrototypeScroll);
  bindCardPointer();
  measureWaypoints();
  ensurePathNodes(true);
  window.addEventListener(
    'wheel',
    (event) => {
      latestWheelDelta = event.deltaY;
    },
    { passive: true }
  );
  window.addEventListener('keydown', handlePathEditorKeydown);
  window.addEventListener('resize', handleResize);
  await initPointerScene();
  requestAnimationFrame(render);
}

init().catch((error) => {
  console.error('Section 2 interaction prototype failed to initialize.', error);
});
