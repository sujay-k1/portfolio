(function () {
  var ACTIVATION_BAND_PX = 72;
  var RELEASE_COOLDOWN_MS = 180;
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
      state.activeEntry = null;
      unlockPage();
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
    entry.track.scrollLeft = nextLeft;
    return true;
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
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });

  onResize();
})();
