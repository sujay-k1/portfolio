(function () {
  if (!document.body.classList.contains("biz2x-page")) {
    return;
  }

  var scrubSections = Array.from(document.querySelectorAll(".biz2x-pan-scrub"));

  if (!scrubSections.length) {
    return;
  }

  var ACTIVATION_RATIO = 0.3;
  var ACTIVATION_BAND_PX = 72;
  var SCROLL_UNITS = 520;
  var RELEASE_COOLDOWN_MS = 180;
  var WHEEL_DELTA_CAP = 56;
  var WHEEL_INERTIA_WINDOW_MS = 80;
  var WHEEL_INERTIA_MIN_DELTA = 10;
  var state = {
    activeSection: null,
    progress: 0,
    lockedScrollY: 0,
    touchY: null,
    releaseUntil: 0,
    lastWheelTs: 0,
    lastWheelDelta: 0
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lockPage() {
    state.lockedScrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + state.lockedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function unlockPage() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, state.lockedScrollY);
  }

  function measureSection(section) {
    var image = section.querySelector(".biz2x-pan-scrub-image");
    var windowNode = section.querySelector(".biz2x-pan-scrub-window");

    if (!image || !windowNode) {
      return null;
    }

    var visibleWidth = windowNode.clientWidth;
    var imageWidth = image.getBoundingClientRect().width;
    var overflow = Math.max(imageWidth - visibleWidth, 0);

    return {
      image: image,
      overflow: overflow
    };
  }

  function applyProgress(section) {
    var measurement = measureSection(section);

    if (!measurement) {
      return;
    }

    var offset = -measurement.overflow * state.progress;
    measurement.image.style.setProperty("--biz2x-pan-scrub-offset", offset.toFixed(2) + "px");
  }

  function activationPointReached(section) {
    var rect = section.getBoundingClientRect();
    var activationLine = window.innerHeight * ACTIVATION_RATIO;

    return rect.bottom >= activationLine
      && Math.abs(rect.top - activationLine) <= ACTIVATION_BAND_PX;
  }

  function maybeActivateSection(deltaY) {
    if (state.activeSection) {
      return state.activeSection;
    }

    if (Date.now() < state.releaseUntil) {
      return null;
    }

    var candidate = null;

    scrubSections.forEach(function (section) {
      if (!candidate && activationPointReached(section)) {
        candidate = section;
      }
    });

    if (!candidate) {
      return null;
    }

    var movingForward = deltaY > 0;
    var movingBackward = deltaY < 0;

    if ((movingForward && state.progress >= 1) || (movingBackward && state.progress <= 0)) {
      return null;
    }

    state.activeSection = candidate;
    lockPage();
    return candidate;
  }

  function normalizeWheelDelta(deltaY) {
    return clamp(deltaY, -WHEEL_DELTA_CAP, WHEEL_DELTA_CAP);
  }

  function isLikelyMomentumTail(deltaY) {
    var now = Date.now();
    var lastDelta = state.lastWheelDelta;
    var lastTs = state.lastWheelTs;
    var sameDirection = (deltaY > 0 && lastDelta > 0) || (deltaY < 0 && lastDelta < 0);
    var withinWindow = now - lastTs <= WHEEL_INERTIA_WINDOW_MS;
    var shrinking = Math.abs(deltaY) < Math.abs(lastDelta);
    var small = Math.abs(deltaY) <= WHEEL_INERTIA_MIN_DELTA;

    state.lastWheelTs = now;
    state.lastWheelDelta = deltaY;

    return sameDirection && withinWindow && shrinking && small;
  }

  function releaseIfAtBoundary(deltaY) {
    if (!state.activeSection) {
      return false;
    }

    if (
      activationPointReached(state.activeSection) &&
      ((deltaY > 0 && state.progress >= 1) || (deltaY < 0 && state.progress <= 0))
    ) {
      state.activeSection = null;
      state.releaseUntil = Date.now() + RELEASE_COOLDOWN_MS;
      unlockPage();
      return "released";
    }

    return false;
  }

  function consumeDelta(deltaY) {
    var section = maybeActivateSection(deltaY);

    if (!section) {
      return false;
    }

    var boundaryState = releaseIfAtBoundary(deltaY);

    if (boundaryState === "released") {
      return true;
    }

    state.progress = clamp(state.progress + (deltaY / SCROLL_UNITS), 0, 1);
    applyProgress(section);
    return true;
  }

  function onWheel(event) {
    var deltaY = normalizeWheelDelta(event.deltaY);

    if (!state.activeSection && Date.now() < state.releaseUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (state.activeSection && isLikelyMomentumTail(deltaY)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (consumeDelta(deltaY)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (state.activeSection) {
      event.preventDefault();
      event.stopPropagation();
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
    if (event.touches.length !== 1 || state.touchY === null) {
      return;
    }

    var nextY = event.touches[0].clientY;
    var deltaY = state.touchY - nextY;
    state.touchY = nextY;

    if (!state.activeSection && Date.now() < state.releaseUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (consumeDelta(deltaY)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (state.activeSection) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onTouchEnd() {
    state.touchY = null;
  }

  function onResize() {
    if (state.activeSection) {
      applyProgress(state.activeSection);
    } else {
      scrubSections.forEach(function (section) {
        applyProgress(section);
      });
    }
  }

  scrubSections.forEach(function (section) {
    var image = section.querySelector(".biz2x-pan-scrub-image");

    if (image && !image.complete) {
      image.addEventListener("load", onResize, { once: true });
    }
  });

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("resize", onResize);

  onResize();
})();
