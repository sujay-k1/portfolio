(function () {
  var STARTUP_LOADER_TIMEOUT_MS = 20000;
  var startupLoader = document.getElementById('startup-loader');
  var core = window.StartupLoaderCore;
  var appRevealed = false;
  var loaderRevealStarted = false;
  var statusEl = null;

  // ── Status label ────────────────────────────────────────────────────────────

  function setLoaderStatus(text) {
    if (!startupLoader) { return; }
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'startup-loader-status';
      statusEl.setAttribute('aria-live', 'polite');
      statusEl.setAttribute('aria-atomic', 'true');
      Object.assign(statusEl.style, {
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.38)',
        fontFamily: 'Inter, Arial, Helvetica, sans-serif',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      });
      startupLoader.appendChild(statusEl);
    }
    statusEl.textContent = text;
  }

  function clearLoaderStatus() {
    if (statusEl) {
      statusEl.remove();
      statusEl = null;
    }
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

    function tick(category) {
      setLoaderStatus('Preloading ' + category);
    }

    // Visible images that haven't finished loading yet.
    // Use !img.complete (not complete && naturalWidth > 0) so that failed/404
    // images (complete=true, naturalWidth=0) are also skipped — their error
    // event already fired and won't fire again, which would hang Promise.all.
    var visibleImages = Array.from(document.querySelectorAll('img')).filter(function (img) {
      return !img.complete;
    });

    // Visible videos that don't have first-frame data yet and haven't errored.
    // If video.error is set the error event already fired; don't add a listener.
    var visibleVideos = Array.from(document.querySelectorAll('video')).filter(function (v) {
      return v.readyState < 2 && !v.error;
    });

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
      return Promise.resolve(true);
    }

    setLoaderStatus('Preloading image');

    // Wait for visible images
    visibleImages.forEach(function (img) {
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load',  function () { tick('image'); resolve(); }, { once: true });
        img.addEventListener('error', function () { tick('image'); resolve(); }, { once: true });
      }));
    });

    // Wait for visible videos
    visibleVideos.forEach(function (video) {
      promises.push(new Promise(function (resolve) {
        var done = false;
        function finish() { if (done) { return; } done = true; tick('video'); resolve(); }
        video.addEventListener('loadeddata', finish, { once: true });
        video.addEventListener('canplay',    finish, { once: true });
        video.addEventListener('error',      finish, { once: true });
      }));
    });

    return Promise.all(promises).then(function () { return true; });
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
