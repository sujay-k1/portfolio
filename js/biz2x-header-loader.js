(function () {
  const STARTUP_LOADER_TIMEOUT_MS = 20000;
  const BRAND_LOADER_DOCK_OFFSET_Y = -6;
  const startupLoader = document.getElementById('startup-loader');

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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
      measureContext.font = FONT_SIZE + 'px Inter, Arial, Helvetica, sans-serif';
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
    let resolveDone = null;
    const donePromise = new Promise(function (resolve) {
      resolveDone = resolve;
    });

    const clearTimers = function () {
      while (timers.length) {
        clearTimeout(timers.pop());
      }
    };

    const schedule = function (fn, delay) {
      const id = window.setTimeout(function () {
        const index = timers.indexOf(id);
        if (index >= 0) {
          timers.splice(index, 1);
        }
        fn();
      }, delay);
      timers.push(id);
      return id;
    };

    const setPhase = function (nextPhase) {
      phase = nextPhase;
      render();
    };

    const updateAnimatedWidth = function (target, duration) {
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
      const tick = function (timestamp) {
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

    const refreshWidth = function () {
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

    const beginFinish = function () {
      schedule(function () {
        setPhase('dragHold');
        schedule(function () {
          shadowOutStart = performance.now();
          setPhase('shadowOut');
          schedule(function () {
            pointerExitStart = performance.now();
            setPhase('pointerExit');
            schedule(function () {
              if (typeof onHappyRevealStart === 'function') {
                onHappyRevealStart();
              }
              outlineFadeStart = performance.now();
              setPhase('outlineFade');
              schedule(function () {
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

    const runPendingLoop = function () {
      schedule(function () {
        pendingOutStart = performance.now();
        setPhase('pendingOut');
        schedule(function () {
          pendingBackStart = performance.now();
          setPhase('pendingBack');
          schedule(function () {
            pendingReturnCenterStart = performance.now();
            setPhase('pendingReturnCenter');
            schedule(function () {
              setPhase('pendingCenterHold');
              schedule(function () {
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

    const start = function () {
      startupLoader.classList.remove('is-hidden');
      caretInterval = window.setInterval(function () {
        showCaret = !showCaret;
        render();
      }, 530);

      schedule(function () {
        setPhase('typing');
        let index = 0;
        const typeNext = function () {
          index += 1;
          typedCount = index;
          refreshWidth();
          render();
          if (index < FULL_TEXT.length) {
            schedule(typeNext, index <= 3 ? 70 : index <= 7 ? 40 : 32);
            return;
          }
          schedule(function () {
            preResizeStart = performance.now();
            setPhase('preResize');
            schedule(function () {
              setPhase('collapse');
              refreshWidth();
              schedule(function () {
                pointerCenterStart = performance.now();
                setPhase('pointerCenter');
                schedule(function () {
                  setPhase('centerHold');
                  schedule(function () {
                    shadowInStart = performance.now();
                    setPhase('shadowIn');
                    schedule(function () {
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

      const tick = function () {
        nowTick = performance.now();
        render();
        if (!isDisposed && phase !== 'done') {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
      render();
    };

    const render = function () {
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

      const easeInOutCubic = function (value) {
        return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
      };

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

      boxWrap.style.left = boxX + 'px';
      boxWrap.style.top = boxY + 'px';
      boxWrap.style.filter = shadowLift > 0
        ? 'drop-shadow(' + shadowDistance + 'px ' + shadowDistance + 'px 0 rgba(0, 0, 0, ' + shadowOpacity.toFixed(3) + '))'
        : 'none';
      box.style.width = animatedWidth + 'px';
      box.style.height = boxHeight + 'px';
      box.style.borderColor = 'rgba(255, 255, 255, ' + (0.85 * outlineOpacity).toFixed(3) + ')';
      box.style.boxShadow = 'inset 0 0 0 0.5px rgba(255, 255, 255, ' + (0.3 * outlineOpacity).toFixed(3) + ')';
      handles.forEach(function (handle) {
        handle.style.opacity = outlineOpacity.toFixed(3);
        handle.style.borderColor = 'rgba(255, 255, 255, ' + outlineOpacity.toFixed(3) + ')';
      });
      boxShadow.style.left = boxX + 'px';
      boxShadow.style.top = boxY + 'px';
      boxShadow.style.width = animatedWidth + 'px';
      boxShadow.style.height = boxHeight + 'px';
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
      typing.style.width = typingContainerWidth + 'px';
      typingText.style.minWidth = '0px';
      caret.style.opacity = showCaret ? '1' : '0';
      caret.style.left = caretOffset + 'px';
      caret.style.top = typedText.length > 0 ? '1px' : (FONT_SIZE - 2) / 2 + 'px';
      caret.style.transform = typedText.length > 0 ? 'translateX(-50%)' : 'translate(-50%, -50%)';

      const innerWidth = Math.max(0, animatedWidth - PADDING_X * 2);
      const currentLeftMaskWidth = clamp(innerWidth * (leftTextWidth / (leftTextWidth + rightTextWidth)), sWidth, leftTextWidth);
      const currentRightMaskWidth = clamp(innerWidth * (rightTextWidth / (leftTextWidth + rightTextWidth)), kWidth, rightTextWidth);
      const groupNaturalWidth = currentLeftMaskWidth + currentRightMaskWidth;
      const centeredOffset = Math.max(0, (innerWidth - groupNaturalWidth) / 2);
      maskGroup.style.left = centeredOffset + 'px';
      maskLeft.textContent = LEFT_TEXT;
      maskRight.textContent = RIGHT_TEXT;
      maskLeft.style.width = currentLeftMaskWidth + 'px';
      maskRight.style.width = currentRightMaskWidth + 'px';

      const rightEdgeX = boxX + animatedWidth;
      const rightEdgeY = boxY + boxHeight / 2;
      const boxCenterX = boxX + animatedWidth / 2;
      const boxCenterY = boxY + boxHeight / 2;
      const boxBottomCenterX = boxX + animatedWidth / 2;
      const boxBottomCenterY = boxY + boxHeight + 18;
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
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursor.style.opacity = String(cursorOpacity);
      cursor.style.transform = cursorTransform;
    };

    const markReady = function () {
      loaderMode = 'happy';
    };

    const dispose = function () {
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
      markReady: markReady,
      dispose: dispose,
      dockFinalFrame: function () {
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
      donePromise: donePromise
    };
  }

  let appRevealed = false;
  let loaderRevealStarted = false;

  function startLoaderReveal() {
    if (loaderRevealStarted) {
      return;
    }
    loaderRevealStarted = true;
    document.body.classList.remove('app-loading');
    if (startupLoader) {
      startupLoader.classList.add('is-receding');
    }
  }

  function revealApp(loaderController) {
    if (appRevealed) {
      return;
    }
    appRevealed = true;
    startLoaderReveal();
    document.body.classList.add('loader-logo-active');
    if (loaderController) {
      loaderController.dockFinalFrame();
    }
    if (startupLoader) {
      startupLoader.classList.add('is-hidden');
    }
  }

  function createStartupDependencyPromise() {
    return Promise.resolve(true);
  }

  async function init() {
    let loaderController = null;
    loaderController = createStartupLoaderController(
      function () {
        startLoaderReveal();
      },
      function () {
        revealApp(loaderController);
      }
    );

    if (!loaderController) {
      document.body.classList.remove('app-loading');
      return;
    }

    const dependencyPromise = createStartupDependencyPromise()
      .then(function () {
        loaderController.markReady();
        return true;
      })
      .catch(function () {
        return null;
      });

    window.setTimeout(function () {
      loaderController.markReady();
    }, STARTUP_LOADER_TIMEOUT_MS);

    loaderController.donePromise.then(function () {
      revealApp(loaderController);
    });

    await loaderController.donePromise;
    revealApp(loaderController);
    loaderController.dispose();
    await dependencyPromise;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
