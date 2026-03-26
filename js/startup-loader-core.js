(() => {
  const HANDOFF_STORAGE_KEY = 'startup-loader-handoff';
  const HANDOFF_MAX_AGE_MS = 10000;
  const BRAND_LOADER_DOCK_OFFSET_Y = -6;
  const SHADOW_DISTANCE_PX = 8;
  const SHADOW_OPACITY = 0.6;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const normalizePathname = (pathname) => {
    if (!pathname) {
      return '/';
    }

    let normalized = pathname.toLowerCase();
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    if (normalized.endsWith('/index.html')) {
      normalized = normalized.slice(0, -11) || '/';
    }
    return normalized || '/';
  };

  const consumeLoaderHandoffState = () => {
    if (window.__loaderHandoffState) {
      const payload = window.__loaderHandoffState;
      window.__loaderHandoffState = null;
      return payload;
    }

    try {
      const raw = window.sessionStorage.getItem(HANDOFF_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const payload = JSON.parse(raw);
      window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);

      if (!payload || typeof payload !== 'object') {
        return null;
      }

      if (Date.now() - Number(payload.ts || 0) > HANDOFF_MAX_AGE_MS) {
        return null;
      }

      const currentPath = normalizePathname(window.location.pathname);
      const currentHash = window.location.hash || '';
      const targetPath = normalizePathname(payload.targetPath);
      const targetHash = payload.targetHash || '';

      if (currentPath !== targetPath || currentHash !== targetHash) {
        return null;
      }

      return payload;
    } catch (error) {
      try {
        window.sessionStorage.removeItem(HANDOFF_STORAGE_KEY);
      } catch (storageError) {
        return null;
      }
      return null;
    }
  };

  const easeInOutCubic = (value) =>
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

  const reversePhaseSet = new Set([
    'reverseOutlineFade',
    'reverseOutlineHold',
    'reversePointerExit',
    'reversePointerHold',
    'reverseShadowOut',
    'reverseShadowHold',
    'reverseDrag',
    'reverseDragHold',
    'reverseShadowIn',
    'reverseCenterHold'
  ]);

  const maskedPhaseSet = new Set([
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
    'done',
    ...reversePhaseSet
  ]);

  const createStartupLoaderController = (options = {}) => {
    const startupLoader = document.getElementById('startup-loader');
    if (!startupLoader) {
      return null;
    }

    let onHappyMoveStart =
      typeof options.onHappyMoveStart === 'function' ? options.onHappyMoveStart : null;
    let onHappyRevealStart =
      typeof options.onHappyRevealStart === 'function' ? options.onHappyRevealStart : null;
    const resumeFromCenter = !!options.resumeFromCenter;

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

    const debugEnabled = !!window.__STARTUP_LOADER_DEBUG__;
    const debugPrefix = '[startup-loader]';
    const logPhase = (nextPhase) => {
      if (!debugEnabled) {
        return;
      }
      console.debug(debugPrefix, nextPhase, Math.round(performance.now()));
    };

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

    if (
      !stage ||
      !boxShadow ||
      !boxWrap ||
      !box ||
      !content ||
      !mask ||
      !maskGroup ||
      !maskLeft ||
      !maskRight ||
      !typing ||
      !typingText ||
      !caret ||
      !cursor
    ) {
      return null;
    }

    let loaderMode = 'pending';
    let typedCount = 0;
    let phase = 'idle';
    let showCaret = true;
    let animatedWidth = MIN_BOX_WIDTH;
    let nowTick = 0;
    let isDisposed = false;
    let isPaused = false;
    let rafId = 0;
    let widthRafId = 0;
    let caretInterval = 0;
    let happyMoveStarted = false;
    let happyRevealStarted = false;
    let doneResolved = false;
    let reversePromise = null;
    let resolveReverse = null;

    let preResizeStart = null;
    let pointerCenterStart = null;
    let shadowInStart = null;
    let dragStart = null;
    let shadowOutStart = null;
    let pointerExitStart = null;
    let outlineFadeStart = null;
    let pendingOutStart = null;
    let pendingBackStart = null;
    let pendingReturnCenterStart = null;

    let reverseOutlineFadeStart = null;
    let reversePointerExitStart = null;
    let reverseShadowOutStart = null;
    let reverseDragStart = null;
    let reverseShadowInStart = null;

    const timers = [];
    let resolveDone = null;
    const donePromise = new Promise((resolve) => {
      resolveDone = resolve;
    });

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

    const leftTextWidth = measureRenderedText(LEFT_TEXT);
    const rightTextWidth = measureRenderedText(RIGHT_TEXT);
    const sWidth = Math.ceil(Math.max(1, measureRenderedText('s') - 1));
    const kWidth = Math.ceil(Math.max(1, measureRenderedText('k') - 4));
    const boxHeight = FONT_SIZE + PADDING_Y * 2 + 4;
    const collapsedWidth = Math.ceil(sWidth + kWidth + PADDING_X * 2);

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

    const stopWidthAnimation = () => {
      if (widthRafId) {
        cancelAnimationFrame(widthRafId);
        widthRafId = 0;
      }
    };

    const stopCaretBlink = () => {
      if (caretInterval) {
        clearInterval(caretInterval);
        caretInterval = 0;
      }
    };

    const startCaretBlink = () => {
      if (caretInterval) {
        return;
      }
      caretInterval = window.setInterval(() => {
        showCaret = !showCaret;
        render();
      }, 530);
    };

    const stopTicker = () => {
      isPaused = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const startTicker = () => {
      if (isDisposed || rafId) {
        return;
      }
      isPaused = false;
      const tick = () => {
        if (isDisposed || isPaused) {
          rafId = 0;
          return;
        }
        nowTick = performance.now();
        render();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    const pause = () => {
      clearTimers();
      stopWidthAnimation();
      stopCaretBlink();
      stopTicker();
    };

    const setPhase = (nextPhase) => {
      phase = nextPhase;
      logPhase(nextPhase);
      render();
    };

    const notifyHappyMoveStart = () => {
      happyMoveStarted = true;
      if (typeof onHappyMoveStart === 'function') {
        onHappyMoveStart();
      }
    };

    const notifyHappyRevealStart = () => {
      happyRevealStarted = true;
      if (typeof onHappyRevealStart === 'function') {
        onHappyRevealStart();
      }
    };

    const resolveDonePromise = () => {
      if (doneResolved) {
        return;
      }
      doneResolved = true;
      if (resolveDone) {
        resolveDone();
      }
    };

    const setDockedGeometry = () => {
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
    };

    const ensureStageMounted = () => {
      startupLoader.classList.remove('is-hidden');
      startupLoader.classList.remove('is-receding');
      startupLoader.classList.remove('is-resize-cursor');
      startupLoader.style.pointerEvents = 'auto';

      if (boxShadow.parentNode !== stage) {
        stage.appendChild(boxShadow);
      }
      if (boxWrap.parentNode !== stage) {
        stage.appendChild(boxWrap);
      }
      if (cursor.parentNode !== stage) {
        stage.appendChild(cursor);
      }
      boxShadow.style.display = '';
    };

    const updateAnimatedWidth = (target, duration) => {
      stopWidthAnimation();
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
        if (rawT < 1 && !isDisposed) {
          widthRafId = requestAnimationFrame(tick);
        } else {
          widthRafId = 0;
        }
      };
      widthRafId = requestAnimationFrame(tick);
    };

    const refreshWidth = () => {
      const typedText = FULL_TEXT.slice(0, typedCount);
      const isMaskedView = maskedPhaseSet.has(phase);
      const displayText = isMaskedView ? FULL_TEXT : typedText;
      const measuredDisplayWidth = measureRenderedText(displayText);
      const targetWidth = displayText.length > 0 ? measuredDisplayWidth + PADDING_X * 2 : MIN_BOX_WIDTH;
      const endWidth = isMaskedView ? collapsedWidth : targetWidth;
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
              notifyHappyRevealStart();
              outlineFadeStart = performance.now();
              setPhase('outlineFade');
              schedule(() => {
                setPhase('done');
                resolveDonePromise();
                pause();
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

    const continueForwardFromCenter = () => {
      schedule(() => {
        shadowInStart = performance.now();
        setPhase('shadowIn');
        schedule(() => {
          if (loaderMode === 'happy') {
            notifyHappyMoveStart();
            dragStart = performance.now();
            setPhase('drag');
            beginFinish();
          } else {
            runPendingLoop();
          }
        }, SHADOW_IN_DURATION + POST_SHADOW_DELAY);
      }, SHADOW_START_DELAY);
    };

    const render = () => {
      if (isDisposed) {
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

      const preResizeProgress = preResizeStart
        ? clamp((nowTick - preResizeStart) / PRE_RESIZE_MOVE, 0, 1)
        : 0;
      const pointerCenterProgress = pointerCenterStart
        ? clamp((nowTick - pointerCenterStart) / POINTER_TO_CENTER_DURATION, 0, 1)
        : 0;
      const shadowInProgress = shadowInStart
        ? clamp((nowTick - shadowInStart) / SHADOW_IN_DURATION, 0, 1)
        : 0;
      const dragProgress = dragStart ? clamp((nowTick - dragStart) / DRAG_DURATION, 0, 1) : 0;
      const pendingOutProgress = pendingOutStart
        ? clamp((nowTick - pendingOutStart) / PENDING_DRAG_OUT_DURATION, 0, 1)
        : 0;
      const pendingBackProgress = pendingBackStart
        ? clamp((nowTick - pendingBackStart) / PENDING_SNAP_BACK_DURATION, 0, 1)
        : 0;
      const pendingReturnProgress = pendingReturnCenterStart
        ? clamp((nowTick - pendingReturnCenterStart) / PENDING_RETURN_TO_CENTER_DURATION, 0, 1)
        : 0;
      const shadowOutProgress = shadowOutStart
        ? clamp((nowTick - shadowOutStart) / SHADOW_OUT_DURATION, 0, 1)
        : 0;
      const pointerExitProgress = pointerExitStart
        ? clamp((nowTick - pointerExitStart) / POINTER_EXIT_DURATION, 0, 1)
        : 0;
      const outlineFadeProgress = outlineFadeStart
        ? clamp((nowTick - outlineFadeStart) / OUTLINE_FADE_DURATION, 0, 1)
        : 0;
      const reverseOutlineFadeProgress = reverseOutlineFadeStart
        ? clamp((nowTick - reverseOutlineFadeStart) / OUTLINE_FADE_DURATION, 0, 1)
        : 0;
      const reversePointerExitProgress = reversePointerExitStart
        ? clamp((nowTick - reversePointerExitStart) / POINTER_EXIT_DURATION, 0, 1)
        : 0;
      const reverseShadowOutProgress = reverseShadowOutStart
        ? clamp((nowTick - reverseShadowOutStart) / SHADOW_OUT_DURATION, 0, 1)
        : 0;
      const reverseDragProgress = reverseDragStart
        ? clamp((nowTick - reverseDragStart) / DRAG_DURATION, 0, 1)
        : 0;
      const reverseShadowInProgress = reverseShadowInStart
        ? clamp((nowTick - reverseShadowInStart) / SHADOW_IN_DURATION, 0, 1)
        : 0;

      const preResizeEase = easeInOutCubic(preResizeProgress);
      const pointerCenterEase = easeInOutCubic(pointerCenterProgress);
      const dragEase = easeInOutCubic(dragProgress);
      const pendingOutEase = easeInOutCubic(pendingOutProgress);
      const pendingBackEase = easeInOutCubic(pendingBackProgress);
      const pendingReturnEase = easeInOutCubic(pendingReturnProgress);
      const pointerExitEase = easeInOutCubic(pointerExitProgress);
      const reversePointerExitEase = easeInOutCubic(reversePointerExitProgress);
      const reverseDragEase = easeInOutCubic(reverseDragProgress);

      let shadowLift = 0;
      if (phase === 'shadowIn') {
        shadowLift = shadowInProgress;
      } else if (
        phase === 'drag' ||
        phase === 'dragHold' ||
        phase === 'pendingOut' ||
        phase === 'reverseShadowHold' ||
        phase === 'reverseDrag' ||
        phase === 'reverseDragHold'
      ) {
        shadowLift = 1;
      } else if (phase === 'pendingBack') {
        shadowLift = 1 - pendingBackEase;
      } else if (
        phase === 'shadowOut' ||
        phase === 'pointerExit' ||
        phase === 'outlineFade' ||
        phase === 'done'
      ) {
        shadowLift = 1 - shadowOutProgress;
      } else if (phase === 'reverseShadowOut') {
        shadowLift = reverseShadowOutProgress;
      } else if (phase === 'reverseShadowIn') {
        shadowLift = 1 - reverseShadowInProgress;
      }
      shadowLift = clamp(shadowLift, 0, 1);

      const shadowDistance = Math.round(shadowLift * SHADOW_DISTANCE_PX);
      const shadowOpacity = shadowLift * SHADOW_OPACITY;

      let dragBoxX = centeredBoxX;
      let dragBoxY = centeredBoxY;
      if (
        phase === 'drag' ||
        phase === 'dragHold' ||
        phase === 'shadowOut' ||
        phase === 'pointerExit' ||
        phase === 'outlineFade' ||
        phase === 'done'
      ) {
        dragBoxX = centeredBoxX + (boxEndX - centeredBoxX) * dragEase;
        dragBoxY = centeredBoxY + (boxEndY - centeredBoxY) * dragEase;
      } else if (phase === 'pendingOut') {
        dragBoxX = centeredBoxX + (pendingTargetX - centeredBoxX) * pendingOutEase;
        dragBoxY = centeredBoxY + (pendingTargetY - centeredBoxY) * pendingOutEase;
      } else if (phase === 'pendingBack') {
        dragBoxX = pendingTargetX + (centeredBoxX - pendingTargetX) * pendingBackEase;
        dragBoxY = pendingTargetY + (centeredBoxY - pendingTargetY) * pendingBackEase;
      } else if (
        phase === 'reverseOutlineFade' ||
        phase === 'reverseOutlineHold' ||
        phase === 'reversePointerExit' ||
        phase === 'reversePointerHold' ||
        phase === 'reverseShadowOut' ||
        phase === 'reverseShadowHold'
      ) {
        dragBoxX = boxEndX;
        dragBoxY = boxEndY;
      } else if (phase === 'reverseDrag') {
        dragBoxX = centeredBoxX + (boxEndX - centeredBoxX) * (1 - reverseDragEase);
        dragBoxY = centeredBoxY + (boxEndY - centeredBoxY) * (1 - reverseDragEase);
      }

      let elevationX = 0;
      let elevationY = 0;
      if (
        phase === 'shadowIn' ||
        phase === 'drag' ||
        phase === 'dragHold' ||
        phase === 'pendingOut'
      ) {
        elevationX = -shadowDistance;
        elevationY = -shadowDistance;
      } else if (phase === 'pendingBack') {
        elevationX = -SHADOW_DISTANCE_PX + SHADOW_DISTANCE_PX * pendingBackEase;
        elevationY = -SHADOW_DISTANCE_PX + SHADOW_DISTANCE_PX * pendingBackEase;
      } else if (
        phase === 'shadowOut' ||
        phase === 'pointerExit' ||
        phase === 'outlineFade' ||
        phase === 'done'
      ) {
        elevationX = -Math.max(0, shadowDistance);
        elevationY = -Math.max(0, shadowDistance);
      } else if (
        phase === 'reverseShadowOut' ||
        phase === 'reverseShadowHold' ||
        phase === 'reverseDrag' ||
        phase === 'reverseDragHold' ||
        phase === 'reverseShadowIn'
      ) {
        elevationX = -Math.max(0, shadowDistance);
        elevationY = -Math.max(0, shadowDistance);
      }

      const boxX = dragBoxX + elevationX;
      const boxY = dragBoxY + elevationY;

      let outlineOpacity = 1;
      if (phase === 'outlineFade' || phase === 'done') {
        outlineOpacity = 1 - outlineFadeProgress;
      } else if (phase === 'reverseOutlineFade') {
        outlineOpacity = reverseOutlineFadeProgress;
      }
      outlineOpacity = clamp(outlineOpacity, 0, 1);

      boxWrap.style.left = `${boxX}px`;
      boxWrap.style.top = `${boxY}px`;
      boxWrap.style.filter =
        shadowLift > 0
          ? `drop-shadow(${shadowDistance}px ${shadowDistance}px 0 rgba(0, 0, 0, ${shadowOpacity.toFixed(3)}))`
          : 'none';
      box.style.width = `${animatedWidth}px`;
      box.style.height = `${boxHeight}px`;
      box.style.background = 'transparent';
      box.style.borderColor = `rgba(255, 255, 255, ${(0.85 * outlineOpacity).toFixed(3)})`;
      box.style.boxShadow = `inset 0 0 0 0.5px rgba(255, 255, 255, ${(0.3 * outlineOpacity).toFixed(3)})`;

      handles.forEach((handle) => {
        handle.style.display = 'block';
        handle.style.position = 'absolute';
        handle.style.width = `${HANDLE_SIZE}px`;
        handle.style.height = `${HANDLE_SIZE}px`;
        handle.style.background = 'rgba(10, 10, 10, 1)';
        handle.style.opacity = outlineOpacity.toFixed(3);
        handle.style.borderColor = `rgba(255, 255, 255, ${outlineOpacity.toFixed(3)})`;
        if (handle.classList.contains('startup-loader-handle-tl')) {
          handle.style.left = '-4px';
          handle.style.right = 'auto';
          handle.style.top = '-4px';
          handle.style.bottom = 'auto';
        } else if (handle.classList.contains('startup-loader-handle-tr')) {
          handle.style.left = 'auto';
          handle.style.right = '-4px';
          handle.style.top = '-4px';
          handle.style.bottom = 'auto';
        } else if (handle.classList.contains('startup-loader-handle-bl')) {
          handle.style.left = '-4px';
          handle.style.right = 'auto';
          handle.style.top = 'auto';
          handle.style.bottom = '-4px';
        } else if (handle.classList.contains('startup-loader-handle-br')) {
          handle.style.left = 'auto';
          handle.style.right = '-4px';
          handle.style.top = 'auto';
          handle.style.bottom = '-4px';
        }
      });

      boxShadow.style.left = `${boxX}px`;
      boxShadow.style.top = `${boxY}px`;
      boxShadow.style.width = `${animatedWidth}px`;
      boxShadow.style.height = `${boxHeight}px`;
      boxShadow.style.opacity = '0';
      boxShadow.style.boxShadow = 'none';
      boxShadow.style.filter = 'none';

      const isMaskedView = maskedPhaseSet.has(phase);
      const typedText = FULL_TEXT.slice(0, typedCount);
      typingText.textContent = typedText;
      const renderedTypingWidth = typedText.length > 0 ? measureRenderedText(typedText) : 0;
      const typingContainerWidth =
        typedText.length > 0 ? renderedTypingWidth : Math.max(0, animatedWidth - PADDING_X * 2);
      const caretOffset =
        typedText.length > 0 ? renderedTypingWidth : Math.round(typingContainerWidth / 2);

      typing.style.display = isMaskedView ? 'none' : 'block';
      mask.style.display = isMaskedView ? 'block' : 'none';
      typing.style.width = `${typingContainerWidth}px`;
      typingText.style.minWidth = '0px';
      caret.style.width = `${CARET_WIDTH}px`;
      caret.style.opacity = showCaret ? '1' : '0';
      caret.style.left = `${caretOffset}px`;
      caret.style.top = typedText.length > 0 ? '1px' : `${(FONT_SIZE - CARET_WIDTH) / 2}px`;
      caret.style.transform = typedText.length > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)';

      const innerWidth = Math.max(0, animatedWidth - PADDING_X * 2);
      const widthSum = leftTextWidth + rightTextWidth || 1;
      const currentLeftMaskWidth = clamp(
        innerWidth * (leftTextWidth / widthSum),
        sWidth,
        leftTextWidth
      );
      const currentRightMaskWidth = clamp(
        innerWidth * (rightTextWidth / widthSum),
        kWidth,
        rightTextWidth
      );
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
      const pendingPointerSlipX =
        boxCenterX + (boxEndX + animatedWidth / 2 - boxCenterX) * PENDING_POINTER_SLIP_RATIO;
      const pendingPointerSlipY =
        boxCenterY + (boxEndY + boxHeight / 2 - boxCenterY) * PENDING_POINTER_SLIP_RATIO;
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
      } else if (
        phase === 'centerHold' ||
        phase === 'shadowIn' ||
        phase === 'drag' ||
        phase === 'dragHold' ||
        phase === 'pendingCenterHold' ||
        phase === 'shadowOut' ||
        phase === 'reverseShadowOut' ||
        phase === 'reverseShadowHold' ||
        phase === 'reverseDrag' ||
        phase === 'reverseDragHold' ||
        phase === 'reverseShadowIn' ||
        phase === 'reverseCenterHold'
      ) {
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
      } else if (phase === 'reverseOutlineFade' || phase === 'reverseOutlineHold') {
        cursorX = logoFinalX;
        cursorY = logoFinalY;
        cursorTransform = 'translate(0, 0)';
      } else if (phase === 'reversePointerExit' || phase === 'reversePointerHold') {
        cursorX = logoFinalX + (boxCenterX - logoFinalX) * reversePointerExitEase;
        cursorY = logoFinalY + (boxCenterY - logoFinalY) * reversePointerExitEase;
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
      pause();
    };

    const setCallbacks = (moveCb, revealCb) => {
      onHappyMoveStart = moveCb;
      onHappyRevealStart = revealCb;
      if (happyMoveStarted && typeof onHappyMoveStart === 'function') {
        onHappyMoveStart();
      }
      if (happyRevealStarted && typeof onHappyRevealStart === 'function') {
        onHappyRevealStart();
      }
    };

    const playReverseToCenter = () => {
      if (isDisposed) {
        return Promise.resolve();
      }
      if (reversePromise) {
        return reversePromise;
      }

      clearTimers();
      stopWidthAnimation();
      stopCaretBlink();
      ensureStageMounted();
      startTicker();

      typedCount = FULL_TEXT.length;
      animatedWidth = collapsedWidth;
      showCaret = false;

      reversePromise = new Promise((resolve) => {
        resolveReverse = resolve;
      });

      const finishReverse = () => {
        setPhase('centerHold');
        pause();
        if (resolveReverse) {
          resolveReverse();
        }
        resolveReverse = null;
        reversePromise = null;
      };

      setPhase('done');
      render();

      reverseOutlineFadeStart = performance.now();
      setPhase('reverseOutlineFade');
      schedule(() => {
        setPhase('reverseOutlineHold');
        schedule(() => {
          reversePointerExitStart = performance.now();
          setPhase('reversePointerExit');
          schedule(() => {
            setPhase('reversePointerHold');
            schedule(() => {
              reverseShadowOutStart = performance.now();
              setPhase('reverseShadowOut');
              schedule(() => {
                setPhase('reverseShadowHold');
                schedule(() => {
                  reverseDragStart = performance.now();
                  setPhase('reverseDrag');
                  schedule(() => {
                    setPhase('reverseDragHold');
                    schedule(() => {
                      reverseShadowInStart = performance.now();
                      setPhase('reverseShadowIn');
                      schedule(() => {
                        setPhase('reverseCenterHold');
                        schedule(finishReverse, SHADOW_START_DELAY);
                      }, SHADOW_IN_DURATION);
                    }, POST_SHADOW_DELAY);
                  }, DRAG_DURATION);
                }, POST_DRAG_DELAY);
              }, SHADOW_OUT_DURATION);
            }, POINTER_EXIT_DELAY);
          }, POINTER_EXIT_DURATION);
        }, OUTLINE_FADE_DELAY);
      }, OUTLINE_FADE_DURATION);

      return reversePromise;
    };

    const start = () => {
      startupLoader.classList.remove('is-hidden');
      startCaretBlink();
      startTicker();

      if (resumeFromCenter) {
        typedCount = FULL_TEXT.length;
        animatedWidth = collapsedWidth;
        showCaret = false;
        setPhase('centerHold');
        continueForwardFromCenter();
        render();
        return;
      }

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
                  continueForwardFromCenter();
                }, POINTER_TO_CENTER_DURATION);
              }, COLLAPSE_DURATION + POST_SHRINK_DELAY + RESIZE_CURSOR_HOLD);
            }, PRE_RESIZE_MOVE + PRE_COLLAPSE_DELAY);
          }, HOLD_AFTER_TYPING);
        };
        typeNext();
      }, INITIAL_DELAY);

      render();
    };

    start();

    return {
      markReady,
      setCallbacks,
      pause,
      dispose,
      dockFinalFrame: setDockedGeometry,
      playReverseToCenter,
      donePromise
    };
  };

  window.StartupLoaderCore = {
    HANDOFF_STORAGE_KEY,
    HANDOFF_MAX_AGE_MS,
    normalizePathname,
    consumeLoaderHandoffState,
    createStartupLoaderController
  };
})();
