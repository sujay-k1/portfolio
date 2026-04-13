(function () {
  var ACTIVATION_BAND_PX = 72;
  var RELEASE_COOLDOWN_MS = 180;
  var AUTOSCROLL_RESUME_DELAY_MS = 300;
  var AUTOSCROLL_TARGET_TRAVEL_SECONDS = 12;
  var AUTOSCROLL_MIN_PX_PER_SECOND = 56;
  var AUTOSCROLL_MAX_PX_PER_SECOND = 140;
  var KEYBOARD_STEP_PX = 88;
  var KEYBOARD_PAGE_STEP_PX = 220;
  var WHEEL_DELTA_CAP = 56;
  var WHEEL_INERTIA_WINDOW_MS = 80;
  var WHEEL_INERTIA_MIN_DELTA = 10;
  var HANDOFF_OWNER_KEY = "__caseStudyHandoffOwner";
  var HANDOFF_OWNER_ID = "mentorconnect-gallery";
  var galleries = Array.prototype.slice.call(
    document.querySelectorAll("[data-horizontal-handoff]")
  ).map(function (gallery) {
    return {
      gallery: gallery,
      sticky: gallery.querySelector("[data-horizontal-handoff-sticky]"),
      track: gallery.querySelector("[data-horizontal-handoff-track]"),
      overflow: 0,
      active: false
    };
  }).filter(function (entry) {
    return entry.sticky && entry.track;
  });
  var state = {
    activeEntry: null,
    lockedScrollY: 0,
    touchY: null,
    releaseUntil: 0,
    lastWheelTs: 0,
    lastWheelDelta: 0,
    bodyLockStyles: null,
    lastObservedScrollY: window.scrollY,
    lastInteractionAt: Number.NEGATIVE_INFINITY,
    autoplayRaf: 0,
    autoplayLastTs: 0,
    lastFocusedElement: null
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

  function stopAutoplayLoop() {
    if (!state.autoplayRaf) {
      return;
    }

    window.cancelAnimationFrame(state.autoplayRaf);
    state.autoplayRaf = 0;
    state.autoplayLastTs = 0;
  }

  function focusActiveTrack(entry) {
    if (!entry || !entry.track || typeof entry.track.focus !== "function") {
      return;
    }

    if (!entry.track.hasAttribute("tabindex")) {
      entry.track.setAttribute("tabindex", "-1");
    }

    if (
      document.activeElement &&
      document.activeElement !== document.body &&
      document.activeElement !== document.documentElement &&
      document.activeElement !== entry.track
    ) {
      state.lastFocusedElement = document.activeElement;
    }

    entry.track.focus({ preventScroll: true });
  }

  function restorePreviousFocus() {
    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement.focus === "function" &&
      document.contains(state.lastFocusedElement)
    ) {
      state.lastFocusedElement.focus({ preventScroll: true });
    }

    state.lastFocusedElement = null;
  }

  function consumeEvent(event) {
    if (event.cancelable) {
      event.preventDefault();
    }

    event.stopPropagation();
  }

  function isEditableTarget(target) {
    if (!target) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    return !!target.closest("input, textarea, select, button, [contenteditable='true']");
  }

  function getStickyTopPx(entry) {
    var raw = window.getComputedStyle(entry.gallery).getPropertyValue("--mc-handoff-top").trim();

    if (raw.indexOf("vh") > -1) {
      return (parseFloat(raw) || 40) * window.innerHeight / 100;
    }

    return parseFloat(raw) || window.innerHeight * 0.4;
  }

  function getMaxScrollY() {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    ) - window.innerHeight;
  }

  function getEntryActivationScrollY(entry) {
    var rect = entry.gallery.getBoundingClientRect();
    var activationLine = getStickyTopPx(entry);

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

  function clearActiveEntry(useCooldown) {
    state.activeEntry = null;
    state.touchY = null;
    state.lastInteractionAt = Number.NEGATIVE_INFINITY;
    if (useCooldown) {
      state.releaseUntil = Date.now() + RELEASE_COOLDOWN_MS;
    }
    stopAutoplayLoop();
    unlockPage();
    restorePreviousFocus();
  }

  function syncObservedScrollY() {
    state.lastObservedScrollY = state.activeEntry
      ? state.lockedScrollY
      : window.scrollY;
  }

  function measureGallery(entry) {
    entry.overflow = Math.max(entry.track.scrollWidth - entry.track.clientWidth, 0);
    entry.active = entry.overflow > 1;

    if (!entry.active && entry.track.scrollLeft !== 0) {
      entry.track.scrollLeft = 0;
    }
  }

  function measureAll() {
    galleries.forEach(measureGallery);

    if (state.activeEntry && !state.activeEntry.active) {
      clearActiveEntry(false);
    }
  }

  function activationPointReached(entry) {
    var rect;
    var activationLine;

    if (!entry.active) {
      return false;
    }

    rect = entry.gallery.getBoundingClientRect();
    activationLine = getStickyTopPx(entry);

    return rect.bottom >= activationLine &&
      Math.abs(rect.top - activationLine) <= ACTIVATION_BAND_PX;
  }

  function doesSweepAcrossActivation(entry, deltaY) {
    var rect;
    var activationLine;
    var projectedTop;
    var projectedBottom;
    var bandTop;
    var bandBottom;

    if (!entry.active) {
      return false;
    }

    rect = entry.gallery.getBoundingClientRect();
    activationLine = getStickyTopPx(entry);
    projectedTop = rect.top - deltaY;
    projectedBottom = rect.bottom - deltaY;
    bandTop = activationLine - ACTIVATION_BAND_PX;
    bandBottom = activationLine + ACTIVATION_BAND_PX;

    return Math.min(rect.top, projectedTop) <= bandBottom &&
      Math.max(rect.top, projectedTop) >= bandTop &&
      Math.max(rect.bottom, projectedBottom) >= activationLine;
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

  function getAutoplayVelocity(entry) {
    return clamp(
      entry.overflow / AUTOSCROLL_TARGET_TRAVEL_SECONDS,
      AUTOSCROLL_MIN_PX_PER_SECOND,
      AUTOSCROLL_MAX_PX_PER_SECOND
    );
  }

  function noteInteraction(deltaY) {
    if (Math.abs(deltaY) < 0.5) {
      return;
    }

    state.lastInteractionAt = performance.now();
  }

  function maybeReleaseAtBoundary(entry, deltaY, nextLeft) {
    var atEnd;
    var atStart;

    if (!entry || !state.activeEntry) {
      return false;
    }

    atEnd = deltaY > 0 && nextLeft >= entry.overflow - 1;
    atStart = deltaY < 0 && nextLeft <= 1;

    if ((atEnd || atStart) && activationPointReached(entry)) {
      clearActiveEntry(true);
      return true;
    }

    return false;
  }

  function ensureAutoplayLoop() {
    if (state.autoplayRaf || !state.activeEntry) {
      return;
    }

    state.autoplayLastTs = performance.now();
    state.autoplayRaf = window.requestAnimationFrame(runAutoplayFrame);
  }

  function runAutoplayFrame(timestamp) {
    var entry = state.activeEntry;
    var dt;
    var deltaY;

    state.autoplayRaf = 0;

    if (!entry || hasForeignLock()) {
      state.autoplayLastTs = timestamp;
      return;
    }

    dt = Math.max(0, Math.min((timestamp - (state.autoplayLastTs || timestamp)) / 1000, 0.05));
    state.autoplayLastTs = timestamp;

    if (performance.now() - state.lastInteractionAt >= AUTOSCROLL_RESUME_DELAY_MS) {
      deltaY = getAutoplayVelocity(entry) * dt;
      consumeDelta(deltaY, false);
    }

    if (state.activeEntry) {
      state.autoplayRaf = window.requestAnimationFrame(runAutoplayFrame);
    }
  }

  function activateEntry(entry) {
    state.activeEntry = entry;
    focusActiveTrack(entry);
    ensureAutoplayLoop();
    return state.activeEntry;
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

    galleries.forEach(function (entry) {
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

    return activateEntry(candidate);
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

    galleries.forEach(function (entry) {
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

    return activateEntry(candidate);
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

  function consumeDelta(deltaY, shouldTrackInteraction) {
    var entry = maybeActivateEntry(deltaY);
    var nextLeft;
    var currentLeft;

    if (!entry) {
      return false;
    }

    if (shouldTrackInteraction !== false) {
      noteInteraction(deltaY);
    }

    currentLeft = entry.track.scrollLeft;
    nextLeft = clamp(currentLeft + deltaY, 0, entry.overflow);

    if (Math.abs(nextLeft - currentLeft) >= 0.5) {
      entry.track.scrollLeft = nextLeft;
    }

    if (maybeReleaseAtBoundary(entry, deltaY, nextLeft)) {
      return true;
    }

    return Math.abs(nextLeft - currentLeft) >= 0.5;
  }

  function onWheel(event) {
    var deltaY = normalizeWheelDelta(event.deltaY);

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

  function onTouchStart(event) {
    if (event.touches.length !== 1) {
      state.touchY = null;
      return;
    }

    state.touchY = event.touches[0].clientY;
  }

  function onTouchMove(event) {
    var nextY;
    var deltaY;

    if (event.touches.length !== 1 || state.touchY === null) {
      return;
    }

    nextY = event.touches[0].clientY;
    deltaY = state.touchY - nextY;
    state.touchY = nextY;

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

  function onTouchEnd() {
    state.touchY = null;
  }

  function onKeyDown(event) {
    var deltaY = 0;

    if (
      !state.activeEntry ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      deltaY = KEYBOARD_STEP_PX;
    } else if (event.key === "ArrowUp") {
      deltaY = -KEYBOARD_STEP_PX;
    } else if (event.key === "PageDown" || event.key === " ") {
      deltaY = KEYBOARD_PAGE_STEP_PX;
    } else if (event.key === "PageUp") {
      deltaY = -KEYBOARD_PAGE_STEP_PX;
    } else {
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

  function onResize() {
    measureAll();
    syncObservedScrollY();
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

  if (!galleries.length) {
    return;
  }

  galleries.forEach(function (entry) {
    Array.prototype.forEach.call(entry.track.querySelectorAll("img"), function (img) {
      if (img.complete) {
        return;
      }

      img.addEventListener("load", onResize, { once: true });
    });
  });

  if (typeof ResizeObserver === "function") {
    var observer = new ResizeObserver(onResize);
    galleries.forEach(function (entry) {
      observer.observe(entry.track);
      observer.observe(entry.sticky);
    });
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("touchcancel", onTouchEnd);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });

  onResize();
})();
