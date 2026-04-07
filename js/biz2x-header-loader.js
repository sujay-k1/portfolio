(function () {
  var STARTUP_LOADER_TIMEOUT_MS = 20000;
  var MIN_PROGRESS_UI_VISIBLE_MS = 320;
  var startupLoader = document.getElementById('startup-loader');
  var core = window.StartupLoaderCore;
  var appRevealed = false;
  var loaderRevealStarted = false;
  var statusEls = null;

  // ── Status UI ───────────────────────────────────────────────────────────────

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function ensureLoaderStatus() {
    var root;
    var row;
    var label;
    var percent;
    var track;
    var fill;

    if (!startupLoader) { return null; }
    if (statusEls) { return statusEls; }

    root = document.createElement('div');
    root.id = 'startup-loader-status';
    root.className = 'startup-loader-status';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-atomic', 'true');

    row = document.createElement('div');
    row.className = 'startup-loader-status-row';

    label = document.createElement('span');
    label.className = 'startup-loader-status-label';

    percent = document.createElement('span');
    percent.className = 'startup-loader-status-percent';

    track = document.createElement('div');
    track.className = 'startup-loader-progress';
    track.setAttribute('aria-hidden', 'true');

    fill = document.createElement('span');
    fill.className = 'startup-loader-progress-fill';

    row.appendChild(label);
    row.appendChild(percent);
    track.appendChild(fill);
    root.appendChild(row);
    root.appendChild(track);
    startupLoader.appendChild(root);

    statusEls = {
      root: root,
      label: label,
      percent: percent
    };

    return statusEls;
  }

  function setLoaderStatus(options) {
    var status = ensureLoaderStatus();
    var label;
    var progress;
    var percentText;

    if (!status) { return; }

    label = (options && options.label) || 'Preloading media';
    progress = options && typeof options.progress === 'number'
      ? clamp(options.progress, 0, 1)
      : 0;
    percentText = Math.round(progress * 100) + '%';

    status.label.textContent = label;
    status.percent.textContent = percentText;
    status.root.style.setProperty('--startup-loader-progress', progress.toFixed(4));
    status.root.setAttribute('aria-label', label + ' ' + percentText);
  }

  function clearLoaderStatus() {
    if (statusEls && statusEls.root) {
      statusEls.root.remove();
      statusEls = null;
    }
  }

  function getLoaderStatusLabel(remainingImages, remainingVideos) {
    if (remainingImages > 0 && remainingVideos > 0) {
      return 'Preloading media';
    }
    if (remainingVideos > 0) {
      return remainingVideos === 1 ? 'Preloading video' : 'Preloading videos';
    }
    if (remainingImages > 0) {
      return remainingImages === 1 ? 'Preloading image' : 'Preloading images';
    }
    return 'Putting it all together';
  }

  function createLoaderProgressTracker(imageCount, videoCount) {
    var total = imageCount + videoCount;
    var completed = 0;
    var remainingImages = imageCount;
    var remainingVideos = videoCount;
    var shownAt = (window.performance && typeof window.performance.now === 'function')
      ? window.performance.now()
      : Date.now();

    function render() {
      setLoaderStatus({
        label: getLoaderStatusLabel(remainingImages, remainingVideos),
        progress: total ? completed / total : 1
      });
    }

    render();

    return {
      markComplete: function (type) {
        completed = Math.min(completed + 1, total);
        if (type === 'video' && remainingVideos > 0) {
          remainingVideos -= 1;
        } else if (type === 'image' && remainingImages > 0) {
          remainingImages -= 1;
        }
        render();
      },
      hasAssets: total > 0,
      finish: function () {
        completed = total;
        remainingImages = 0;
        remainingVideos = 0;
        render();
      },
      waitForMinimumVisibleTime: function () {
        var now = (window.performance && typeof window.performance.now === 'function')
          ? window.performance.now()
          : Date.now();
        var remaining = Math.max(0, MIN_PROGRESS_UI_VISIBLE_MS - (now - shownAt));

        if (!remaining) {
          return Promise.resolve();
        }

        return new Promise(function (resolve) {
          window.setTimeout(resolve, remaining);
        });
      }
    };
  }

  // ── Reveal helpers ───────────────────────────────────────────────────────────

  function startLoaderReveal() {
    if (loaderRevealStarted) { return; }
    loaderRevealStarted = true;
    clearLoaderStatus();
    document.body.classList.remove('app-loading');
    if (startupLoader) {
      startupLoader.style.pointerEvents = 'none';
      startupLoader.classList.add('is-receding');
    }
  }

  function revealApp(loaderController) {
    if (appRevealed) { return; }
    appRevealed = true;
    startLoaderReveal();
    document.body.classList.add('loader-logo-active');
    if (loaderController && typeof loaderController.dockFinalFrame === 'function') {
      loaderController.dockFinalFrame();
    }
    if (startupLoader) {
      startupLoader.classList.add('is-hidden');
    }
  }

  // ── Asset preloading ─────────────────────────────────────────────────────────

  function createStartupDependencyPromise() {
    var promises = [];
    var progressTracker;

    // These are the assets that currently block the loader from resolving.
    // The browser does not expose exact partial byte progress for native img/video
    // loads here, so the progress bar reflects the precise percentage of blocker
    // elements that have reached their ready state.
    var visibleImages = Array.from(document.querySelectorAll('img')).filter(function (img) {
      return !img.complete;
    });

    var visibleVideos = Array.from(document.querySelectorAll('video')).filter(function (v) {
      return v.readyState < 2 && !v.error;
    });

    progressTracker = createLoaderProgressTracker(visibleImages.length, visibleVideos.length);

    // Toggle media — kick off background loads (fire-and-forget).
    // We do NOT block markReady() on these: browsers aggressively throttle
    // zero-dimension / off-screen media elements, so waiting for their events
    // causes the loader to hang until the 20 s timeout.
    var seenSrcs = new Set(
      Array.from(document.querySelectorAll('img[src], video[src]')).map(function (el) {
        return el.getAttribute('src');
      })
    );

    Array.from(document.querySelectorAll('.biz2x-video-toggle')).forEach(function (btn) {
      var mediaType = btn.getAttribute('data-media-type') || 'video';
      var src = btn.getAttribute('data-media-src') || btn.getAttribute('data-video-src') || '';
      if (!src || seenSrcs.has(src)) { return; }
      seenSrcs.add(src);

      if (mediaType === 'image') {
        // new Image().src is enough to warm the browser cache
        var img = new Image();
        img.src = src;
      } else {
        // 1×1 off-screen video (not 0×0) — browsers are more willing to load
        // non-zero-dimension elements; position:fixed keeps it out of flow
        var video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.setAttribute('aria-hidden', 'true');
        video.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;pointer-events:none;';
        document.body.appendChild(video);
        video.src = src;
      }
    });

    var hasAssets = visibleImages.length || visibleVideos.length;

    if (!hasAssets) {
      progressTracker.finish();
      return progressTracker.waitForMinimumVisibleTime().then(function () { return true; });
    }

    // Wait for visible images
    visibleImages.forEach(function (img) {
      promises.push(new Promise(function (resolve) {
        var done = false;

        function finish() {
          if (done) { return; }
          done = true;
          progressTracker.markComplete('image');
          resolve();
        }

        if (img.complete) {
          finish();
          return;
        }

        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });

        if (img.complete) {
          finish();
        }
      }));
    });

    // Wait for visible videos
    visibleVideos.forEach(function (video) {
      promises.push(new Promise(function (resolve) {
        var done = false;

        function finish() {
          if (done) { return; }
          done = true;
          progressTracker.markComplete('video');
          resolve();
        }

        if (video.readyState >= 2 || video.error) {
          finish();
          return;
        }

        video.addEventListener('loadeddata', finish, { once: true });
        video.addEventListener('canplay', finish, { once: true });
        video.addEventListener('error', finish, { once: true });

        if (video.readyState >= 2 || video.error) {
          finish();
        }
      }));
    });

    return Promise.all(promises)
      .then(function () {
        progressTracker.finish();
        return progressTracker.waitForMinimumVisibleTime();
      })
      .then(function () { return true; });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  async function init() {
    if (!startupLoader || !core) {
      document.body.classList.remove('app-loading');
      return;
    }

    var handoffState = core.consumeLoaderHandoffState();
    var loaderController = core.createStartupLoaderController({
      onHappyMoveStart: function () {
        startLoaderReveal();
      },
      onHappyRevealStart: function () {
        revealApp(loaderController);
      },
      resumeFromCenter: !!handoffState
    });

    if (!loaderController) {
      document.body.classList.remove('app-loading');
      return;
    }

    window.__activeStartupLoaderController = loaderController;
    window.__startupLoaderController = loaderController;

    var dependencyPromise = createStartupDependencyPromise()
      .then(function () {
        loaderController.markReady();
        return true;
      })
      .catch(function () {
        loaderController.markReady();
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
    await dependencyPromise;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
