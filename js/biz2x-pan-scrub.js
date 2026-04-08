(function () {
  if (!document.body.classList.contains("biz2x-page")) {
    return;
  }

  var ACTIVATION_BAND_PX = 72;
  var RELEASE_COOLDOWN_MS = 180;
  var WHEEL_DELTA_CAP = 56;
  var WHEEL_INERTIA_WINDOW_MS = 80;
  var WHEEL_INERTIA_MIN_DELTA = 10;
  var HANDOFF_OWNER_KEY = "__caseStudyHandoffOwner";
  var HANDOFF_OWNER_ID = "biz2x-pan-scrub";
  var scrubSections = Array.prototype.slice.call(
    document.querySelectorAll(".biz2x-pan-scrub")
  ).map(function (section) {
    return {
      section: section,
      track: section.querySelector(".biz2x-pan-scrub-window"),
      strip: section.querySelector(".biz2x-pan-scrub-strip"),
      image: section.querySelector(".biz2x-pan-scrub-image"),
      overflow: 0,
      active: false
    };
  }).filter(function (entry) {
    return entry.track && entry.strip && entry.image;
  });

  if (!scrubSections.length) {
    return;
  }

  var state = {
    activeEntry: null,
    lockedScrollY: 0,
    touchY: null,
    releaseUntil: 0,
    lastWheelTs: 0,
    lastWheelDelta: 0,
    bodyLockStyles: null,
    lastObservedScrollY: window.scrollY
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hasForeignLock() {
    return !!(window[HANDOFF_OWNER_KEY] && window[HANDOFF_OWNER_KEY] !== HANDOFF_OWNER_ID);
  }

  function claimLock() {
    if (hasForeignLock()) {
      return false;
    }

    window[HANDOFF_OWNER_KEY] = HANDOFF_OWNER_ID;
    return true;
  }

  function releaseLock() {
    if (window[HANDOFF_OWNER_KEY] === HANDOFF_OWNER_ID) {
      window[HANDOFF_OWNER_KEY] = "";
    }
  }

  function consumeEvent(event) {
    if (event.cancelable) {
      event.preventDefault();
    }

    event.stopPropagation();
  }

  function getTriggerY(entry) {
    var raw = window.getComputedStyle(entry.section)
      .getPropertyValue("--biz2x-pan-handoff-top")
      .trim();

    if (raw.indexOf("vh") > -1) {
      return (parseFloat(raw) || 30) * window.innerHeight / 100;
    }

    return parseFloat(raw) || window.innerHeight * 0.3;
  }

  function getMaxScrollY() {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    ) - window.innerHeight;
  }

  function getEntryActivationScrollY(entry) {
    var rect = entry.section.getBoundingClientRect();
    var activationLine = getTriggerY(entry);

    return clamp(window.scrollY + rect.top - activationLine, 0, Math.max(getMaxScrollY(), 0));
  }

  function lockPage(targetScrollY) {
    if (state.bodyLockStyles) {
      return true;
    }

    if (!claimLock()) {
      return false;
    }

    state.lockedScrollY = clamp(
      typeof targetScrollY === "number" ? targetScrollY : window.scrollY,
      0,
      Math.max(getMaxScrollY(), 0)
    );

    if (Math.abs(window.scrollY - state.lockedScrollY) >= 0.5) {
      window.scrollTo(0, state.lockedScrollY);
    }

    state.bodyLockStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = "fixed";
    document.body.style.top = "-" + state.lockedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    syncObservedScrollY();
    return true;
  }

  function unlockPage() {
    if (!state.bodyLockStyles) {
      return;
    }

    document.body.style.position = state.bodyLockStyles.position;
    document.body.style.top = state.bodyLockStyles.top;
    document.body.style.left = state.bodyLockStyles.left;
    document.body.style.right = state.bodyLockStyles.right;
    document.body.style.width = state.bodyLockStyles.width;
    document.body.style.overflow = state.bodyLockStyles.overflow;
    state.bodyLockStyles = null;
    window.scrollTo(0, state.lockedScrollY);
    releaseLock();
    syncObservedScrollY();
  }

  function syncObservedScrollY() {
    state.lastObservedScrollY = state.activeEntry
      ? state.lockedScrollY
      : window.scrollY;
  }

  function measureSection(entry) {
    entry.overflow = Math.max(entry.track.scrollWidth - entry.track.clientWidth, 0);
    entry.active = entry.overflow > 1;

    if (!entry.active && entry.track.scrollLeft !== 0) {
      entry.track.scrollLeft = 0;
    }
  }

  function measureAll() {
    scrubSections.forEach(measureSection);

    if (state.activeEntry && !state.activeEntry.active) {
      state.activeEntry = null;
      unlockPage();
    }
  }

  function activationPointReached(entry) {
    var rect;
    var triggerY;

    if (!entry.active) {
      return false;
    }

    rect = entry.section.getBoundingClientRect();
    triggerY = getTriggerY(entry);

    return rect.bottom >= triggerY &&
      Math.abs(rect.top - triggerY) <= ACTIVATION_BAND_PX;
  }

  function doesSweepAcrossActivation(entry, deltaY) {
    var rect;
    var triggerY;
    var projectedTop;
    var projectedBottom;
    var bandTop;
    var bandBottom;

    if (!entry.active) {
      return false;
    }

    rect = entry.section.getBoundingClientRect();
    triggerY = getTriggerY(entry);
    projectedTop = rect.top - deltaY;
    projectedBottom = rect.bottom - deltaY;
    bandTop = triggerY - ACTIVATION_BAND_PX;
    bandBottom = triggerY + ACTIVATION_BAND_PX;

    return Math.min(rect.top, projectedTop) <= bandBottom &&
      Math.max(rect.top, projectedTop) >= bandTop &&
      Math.max(rect.bottom, projectedBottom) >= triggerY;
  }

  function doesScrollSweepAcrossActivation(entry, startScrollY, endScrollY) {
    var activationScrollY;
    var bandTop;
    var bandBottom;

    if (!entry.active) {
      return false;
    }

    activationScrollY = getEntryActivationScrollY(entry);
    bandTop = activationScrollY - ACTIVATION_BAND_PX;
    bandBottom = activationScrollY + ACTIVATION_BAND_PX;

    return Math.max(startScrollY, endScrollY) >= bandTop &&
      Math.min(startScrollY, endScrollY) <= bandBottom;
  }

  function hasRemainingScroll(entry, direction) {
    if (!entry || !entry.active) {
      return false;
    }

    if (direction > 0) {
      return entry.track.scrollLeft < entry.overflow - 1;
    }

    return entry.track.scrollLeft > 1;
  }

  function maybeActivateEntry(deltaY) {
    var direction;
    var candidate = null;
    var candidateActivationScrollY;

    if (state.activeEntry) {
      return state.activeEntry;
    }

    if (Date.now() < state.releaseUntil || hasForeignLock()) {
      return null;
    }

    direction = deltaY > 0 ? 1 : -1;
    candidateActivationScrollY = direction > 0 ? -Infinity : Infinity;

    scrubSections.forEach(function (entry) {
      var activationScrollY;

      activationScrollY = getEntryActivationScrollY(entry);

      if (candidate) {
        if (
          direction > 0
            ? activationScrollY <= candidateActivationScrollY
            : activationScrollY >= candidateActivationScrollY
        ) {
          return;
        }
      }

      if (
        hasRemainingScroll(entry, direction) &&
        (activationPointReached(entry) || doesSweepAcrossActivation(entry, deltaY))
      ) {
        candidate = entry;
        candidateActivationScrollY = activationScrollY;
      }
    });

    if (!candidate) {
      return null;
    }

    if (!lockPage(getEntryActivationScrollY(candidate))) {
      return null;
    }

    state.activeEntry = candidate;
    return state.activeEntry;
  }

  function maybeActivateEntryFromScroll(previousScrollY, currentScrollY) {
    var direction;
    var candidate = null;
    var candidateActivationScrollY;

    if (state.activeEntry) {
      return state.activeEntry;
    }

    if (Date.now() < state.releaseUntil || previousScrollY === currentScrollY || hasForeignLock()) {
      return null;
    }

    direction = currentScrollY > previousScrollY ? 1 : -1;
    candidateActivationScrollY = direction > 0 ? -Infinity : Infinity;

    scrubSections.forEach(function (entry) {
      var activationScrollY;

      activationScrollY = getEntryActivationScrollY(entry);

      if (candidate) {
        if (
          direction > 0
            ? activationScrollY <= candidateActivationScrollY
            : activationScrollY >= candidateActivationScrollY
        ) {
          return;
        }
      }

      if (
        hasRemainingScroll(entry, direction) &&
        (activationPointReached(entry) ||
          doesScrollSweepAcrossActivation(entry, previousScrollY, currentScrollY))
      ) {
        candidate = entry;
        candidateActivationScrollY = activationScrollY;
      }
    });

    if (!candidate) {
      return null;
    }

    if (!lockPage(getEntryActivationScrollY(candidate))) {
      return null;
    }

    state.activeEntry = candidate;
    return state.activeEntry;
  }

  function normalizeWheelDelta(deltaY) {
    return clamp(deltaY, -WHEEL_DELTA_CAP, WHEEL_DELTA_CAP);
  }

  function isLikelyMomentumTail(deltaY) {
    var now = Date.now();
    var sameDirection = (deltaY > 0 && state.lastWheelDelta > 0) || (deltaY < 0 && state.lastWheelDelta < 0);
    var withinWindow = now - state.lastWheelTs <= WHEEL_INERTIA_WINDOW_MS;
    var shrinking = Math.abs(deltaY) < Math.abs(state.lastWheelDelta);
    var small = Math.abs(deltaY) <= WHEEL_INERTIA_MIN_DELTA;

    state.lastWheelTs = now;
    state.lastWheelDelta = deltaY;

    return sameDirection && withinWindow && shrinking && small;
  }

  function releaseIfAtBoundary(deltaY) {
    var atEnd;
    var atStart;

    if (!state.activeEntry) {
      return false;
    }

    atEnd = deltaY > 0 && state.activeEntry.track.scrollLeft >= state.activeEntry.overflow - 1;
    atStart = deltaY < 0 && state.activeEntry.track.scrollLeft <= 1;

    if ((atEnd || atStart) && activationPointReached(state.activeEntry)) {
      state.activeEntry = null;
      state.releaseUntil = Date.now() + RELEASE_COOLDOWN_MS;
      unlockPage();
      return "released";
    }

    return false;
  }

  function consumeDelta(deltaY) {
    var entry = maybeActivateEntry(deltaY);
    var nextLeft;

    if (!entry) {
      return false;
    }

    if (releaseIfAtBoundary(deltaY) === "released") {
      return true;
    }

    nextLeft = clamp(entry.track.scrollLeft + deltaY, 0, entry.overflow);

    if (Math.abs(nextLeft - entry.track.scrollLeft) < 0.5) {
      return false;
    }

    entry.track.scrollLeft = nextLeft;
    return true;
  }

  function handleWheel(event) {
    var deltaY;

    if (event.defaultPrevented || event.ctrlKey) {
      return;
    }

    deltaY = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? normalizeWheelDelta(event.deltaY) : 0;
    if (!deltaY) {
      return;
    }

    if (!state.activeEntry && Date.now() < state.releaseUntil) {
      consumeEvent(event);
      return;
    }

    if (state.activeEntry && isLikelyMomentumTail(deltaY)) {
      consumeEvent(event);
      return;
    }

    if (consumeDelta(deltaY)) {
      consumeEvent(event);
      return;
    }

    if (state.activeEntry) {
      consumeEvent(event);
    }
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1) {
      state.touchY = null;
      return;
    }

    state.touchY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    var touch;
    var deltaY;

    if (!event.touches || event.touches.length !== 1 || state.touchY === null) {
      return;
    }

    touch = event.touches[0];
    deltaY = state.touchY - touch.clientY;
    state.touchY = touch.clientY;

    if (!state.activeEntry && Date.now() < state.releaseUntil) {
      consumeEvent(event);
      return;
    }

    if (consumeDelta(deltaY)) {
      consumeEvent(event);
      return;
    }

    if (state.activeEntry) {
      consumeEvent(event);
    }
  }

  function clearTouchState() {
    state.touchY = null;
  }

  function onScroll() {
    var previousScrollY = state.lastObservedScrollY;
    var currentScrollY = window.scrollY;

    if (hasForeignLock()) {
      state.lastObservedScrollY = currentScrollY;
      return;
    }

    if (state.activeEntry || state.bodyLockStyles) {
      syncObservedScrollY();
      return;
    }

    if (Math.abs(currentScrollY - previousScrollY) < 0.5) {
      state.lastObservedScrollY = currentScrollY;
      return;
    }

    maybeActivateEntryFromScroll(previousScrollY, currentScrollY);
    syncObservedScrollY();
  }

  scrubSections.forEach(function (entry) {
    if (entry.image.complete) {
      return;
    }

    entry.image.addEventListener("load", measureAll, { once: true });
  });

    if (typeof ResizeObserver === "function") {
    var observer = new ResizeObserver(measureAll);

    scrubSections.forEach(function (entry) {
      observer.observe(entry.track);
      observer.observe(entry.section);
      observer.observe(entry.strip);
    });
  }

  window.addEventListener("resize", function () {
    measureAll();
    syncObservedScrollY();
  });
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", clearTouchState, { passive: true });
  window.addEventListener("touchcancel", clearTouchState, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  measureAll();
})();
