(function () {
  var trigger = document.querySelector('.codrops-image-reveal-root .content__text-link[data-img]');
  var root = document.getElementById('report-slideshow');

  if (!trigger || !root) {
    return;
  }

  var imageNode = document.getElementById('report-slideshow-image');
  var counterNode = document.getElementById('report-slideshow-counter');
  var thumbsNode = document.getElementById('report-slideshow-thumbs');
  var frameNode = root.querySelector('.report-slideshow-frame');
  var ringNode = root.querySelector('.report-slideshow-progress-ring');
  var toggleButton = document.getElementById('report-slideshow-toggle');
  var toggleIcon = toggleButton ? toggleButton.querySelector('.report-slideshow-toggle-icon') : null;
  var prevButton = root.querySelector('[data-slideshow-prev]');
  var nextButton = root.querySelector('[data-slideshow-next]');
  var closeButtons = Array.from(root.querySelectorAll('[data-slideshow-close]'));
  var slideSources = trigger
    .getAttribute('data-img')
    .split(',')
    .map(function (source) {
      return source.trim();
    })
    .filter(Boolean);

  var state = {
    activeIndex: 0,
    autoplayDuration: 2500,
    autoplayTimer: null,
    progressRaf: 0,
    progressStart: 0,
    elapsedBeforePause: 0,
    lastFocused: null,
    isOpen: false,
    isPaused: false,
    isPausedByZoom: false,
    isZoomedMobile: false,
    panX: 0,
    panMax: 0,
    pointerId: null,
    dragStartX: 0,
    dragStartPanX: 0,
    thumbButtons: []
  };

  var ringLength = 113.097;

  function getAlt(index) {
    return 'Report slide ' + (index + 1);
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function updatePanBounds() {
    if (!frameNode || !imageNode || !state.isZoomedMobile) {
      state.panMax = 0;
      return;
    }

    var frameRect = frameNode.getBoundingClientRect();
    var naturalWidth = imageNode.naturalWidth || 0;
    var naturalHeight = imageNode.naturalHeight || 1;
    var displayWidth = frameRect.height * (naturalWidth / naturalHeight);
    state.panMax = Math.max(0, (displayWidth - frameRect.width) / 2);
    state.panX = Math.max(-state.panMax, Math.min(state.panMax, state.panX));
  }

  function applyPan() {
    imageNode.style.transform = 'translate3d(' + state.panX.toFixed(2) + 'px, 0, 0)';
  }

  function disableMobileZoom() {
    state.isZoomedMobile = false;
    state.panX = 0;
    state.panMax = 0;
    state.pointerId = null;
    if (frameNode) {
      frameNode.classList.remove('is-zoomed');
    }
    imageNode.style.transform = 'translate3d(0, 0, 0)';

    if (state.isPausedByZoom) {
      state.isPausedByZoom = false;
      resumeAutoplay();
    }
  }

  function enableMobileZoom() {
    if (!isMobileViewport()) {
      return;
    }

    state.isZoomedMobile = true;
    state.panX = 0;
    if (frameNode) {
      frameNode.classList.add('is-zoomed');
    }
    updatePanBounds();
    applyPan();

    if (!state.isPaused) {
      state.isPausedByZoom = true;
      pauseAutoplay();
    }
  }

  function toggleMobileZoom() {
    if (!isMobileViewport()) {
      return;
    }

    if (state.isZoomedMobile) {
      disableMobileZoom();
    } else {
      enableMobileZoom();
    }
  }

  function clearAutoplay() {
    if (state.autoplayTimer) {
      clearTimeout(state.autoplayTimer);
      state.autoplayTimer = null;
    }
    if (state.progressRaf) {
      cancelAnimationFrame(state.progressRaf);
      state.progressRaf = 0;
    }
  }

  function setToggleState(isPaused) {
    if (!toggleButton || !toggleIcon) {
      return;
    }

    toggleButton.setAttribute('aria-label', isPaused ? 'Play slideshow' : 'Pause slideshow');
    toggleButton.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
    toggleIcon.classList.toggle('is-play', isPaused);
    toggleIcon.classList.toggle('is-pause', !isPaused);
  }

  function updateProgressRing() {
    if (!state.isOpen || state.isPaused) {
      return;
    }

    var elapsed = state.elapsedBeforePause + (performance.now() - state.progressStart);
    var progress = Math.max(0, Math.min(1, elapsed / state.autoplayDuration));
    ringNode.style.strokeDashoffset = String(ringLength * (1 - progress));

    if (progress < 1) {
      state.progressRaf = requestAnimationFrame(updateProgressRing);
    }
  }

  function startAutoplay() {
    clearAutoplay();
    state.isPaused = false;
    setToggleState(false);
    state.progressStart = performance.now();
    ringNode.style.strokeDasharray = String(ringLength);
    state.progressRaf = requestAnimationFrame(updateProgressRing);
    state.autoplayTimer = setTimeout(function () {
      goToSlide(state.activeIndex + 1, { wrap: true, resume: true });
    }, Math.max(0, state.autoplayDuration - state.elapsedBeforePause));
  }

  function resetProgress() {
    state.elapsedBeforePause = 0;
    ringNode.style.strokeDasharray = String(ringLength);
    ringNode.style.strokeDashoffset = String(ringLength);
  }

  function pauseAutoplay() {
    if (state.isPaused || !state.isOpen) {
      return;
    }

    state.elapsedBeforePause += performance.now() - state.progressStart;
    state.isPaused = true;
    setToggleState(true);
    clearAutoplay();
  }

  function resumeAutoplay() {
    if (!state.isPaused || !state.isOpen) {
      return;
    }

    startAutoplay();
  }

  function toggleAutoplay() {
    if (state.isPaused) {
      resumeAutoplay();
    } else {
      pauseAutoplay();
    }
  }

  function updateThumbs() {
    state.thumbButtons.forEach(function (button, index) {
      var isActive = index === state.activeIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    var activeThumb = state.thumbButtons[state.activeIndex];
    if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
      activeThumb.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth'
      });
    }
  }

  function goToSlide(index, options) {
    var settings = options || {};
    var nextIndex = index;

    if (settings.wrap) {
      nextIndex = (index + slideSources.length) % slideSources.length;
    } else {
      nextIndex = Math.max(0, Math.min(slideSources.length - 1, index));
    }

    state.activeIndex = nextIndex;
    disableMobileZoom();
    imageNode.src = slideSources[nextIndex];
    imageNode.alt = getAlt(nextIndex);
    counterNode.textContent = String(nextIndex + 1) + ' / ' + String(slideSources.length);
    updateThumbs();

    if (settings.preservePlayback) {
      resetProgress();
      if (state.isPaused) {
        setToggleState(true);
      } else {
        startAutoplay();
      }
      return;
    }

    if (settings.resume !== false) {
      resetProgress();
      startAutoplay();
    }
  }

  function openSlideshow(index) {
    state.lastFocused = document.activeElement;
    state.isOpen = true;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.isPaused = false;
    resetProgress();
    setToggleState(false);
    goToSlide(index || 0, { wrap: true, resume: true });
    if (nextButton) {
      nextButton.focus();
    }
  }

  function closeSlideshow() {
    if (!state.isOpen) {
      return;
    }
    state.isOpen = false;
    state.isPaused = false;
    state.isPausedByZoom = false;
    disableMobileZoom();
    clearAutoplay();
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetProgress();
    setToggleState(false);
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      state.lastFocused.focus();
    }
  }

  function buildThumbs() {
    slideSources.forEach(function (source, index) {
      var button = document.createElement('button');
      var img = document.createElement('img');

      button.type = 'button';
      button.className = 'report-slideshow-thumb';
      button.setAttribute('aria-label', 'Go to slide ' + (index + 1));

      img.src = source;
      img.alt = getAlt(index);

      button.appendChild(img);
      button.addEventListener('click', function () {
        goToSlide(index, { preservePlayback: true });
      });

      thumbsNode.appendChild(button);
      state.thumbButtons.push(button);
    });
  }

  trigger.addEventListener('click', function (event) {
    event.preventDefault();
    openSlideshow(state.activeIndex);
  });

  closeButtons.forEach(function (button) {
    button.addEventListener('click', closeSlideshow);
  });

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      goToSlide(state.activeIndex - 1, { wrap: true, preservePlayback: true });
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      goToSlide(state.activeIndex + 1, { wrap: true, preservePlayback: true });
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener('click', function () {
      toggleAutoplay();
    });
  }

  if (imageNode && frameNode) {
    imageNode.addEventListener('load', function () {
      if (state.isZoomedMobile) {
        updatePanBounds();
        applyPan();
      }
    });

    frameNode.addEventListener('click', function (event) {
      if (!isMobileViewport()) {
        return;
      }

      if (
        event.target.closest('.report-slideshow-arrow') ||
        event.target.closest('.report-slideshow-close') ||
        event.target.closest('.report-slideshow-toggle')
      ) {
        return;
      }

      toggleMobileZoom();
    });

    frameNode.addEventListener('pointerdown', function (event) {
      if (!state.isZoomedMobile || !isMobileViewport()) {
        return;
      }

      state.pointerId = event.pointerId;
      state.dragStartX = event.clientX;
      state.dragStartPanX = state.panX;
      frameNode.setPointerCapture(event.pointerId);
    });

    frameNode.addEventListener('pointermove', function (event) {
      if (!state.isZoomedMobile || state.pointerId !== event.pointerId) {
        return;
      }

      state.panX = state.dragStartPanX + (event.clientX - state.dragStartX);
      state.panX = Math.max(-state.panMax, Math.min(state.panMax, state.panX));
      applyPan();
    });

    var releasePointer = function (event) {
      if (state.pointerId !== event.pointerId) {
        return;
      }
      state.pointerId = null;
      if (frameNode.hasPointerCapture(event.pointerId)) {
        frameNode.releasePointerCapture(event.pointerId);
      }
    };

    frameNode.addEventListener('pointerup', releasePointer);
    frameNode.addEventListener('pointercancel', releasePointer);
  }

  window.addEventListener('resize', function () {
    if (state.isZoomedMobile) {
      updatePanBounds();
      applyPan();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!state.isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSlideshow();
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      goToSlide(state.activeIndex + 1, { wrap: true, preservePlayback: true });
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      goToSlide(state.activeIndex - 1, { wrap: true, preservePlayback: true });
    }
  });

  buildThumbs();
})();
