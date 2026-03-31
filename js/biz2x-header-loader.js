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
    var loaded = 0;
    var total = 0;

    function tick() {
      loaded++;
      setLoaderStatus('Preloading — ' + loaded + ' / ' + total);
    }

    // Visible images that haven't finished loading yet
    var visibleImages = Array.from(document.querySelectorAll('img')).filter(function (img) {
      return !(img.complete && img.naturalWidth > 0);
    });

    // Visible videos that don't have first-frame data yet
    var visibleVideos = Array.from(document.querySelectorAll('video')).filter(function (v) {
      return v.readyState < 2;
    });

    // Toggle media — collect sources not already represented in the DOM
    var seenSrcs = new Set(
      Array.from(document.querySelectorAll('img[src], video[src]')).map(function (el) {
        return el.getAttribute('src');
      })
    );
    var toggleImages = [];  // Image() objects
    var toggleVideos = [];  // detached <video> elements appended to body

    Array.from(document.querySelectorAll('.biz2x-video-toggle')).forEach(function (btn) {
      var mediaType = btn.getAttribute('data-media-type') || 'video';
      var src = btn.getAttribute('data-media-src') || btn.getAttribute('data-video-src') || '';
      if (!src || seenSrcs.has(src)) { return; }
      seenSrcs.add(src);

      if (mediaType === 'image') {
        var img = new Image();
        img.src = src;
        toggleImages.push(img);
      } else {
        var video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.setAttribute('aria-hidden', 'true');
        video.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';
        document.body.appendChild(video);
        video.src = src;  // set src after append so load starts
        toggleVideos.push(video);
      }
    });

    total = visibleImages.length + visibleVideos.length + toggleImages.length + toggleVideos.length;

    if (total === 0) {
      return Promise.resolve(true);
    }

    setLoaderStatus('Preloading — 0 / ' + total);

    // Wait for visible images
    visibleImages.forEach(function (img) {
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load',  function () { tick(); resolve(); }, { once: true });
        img.addEventListener('error', function () { tick(); resolve(); }, { once: true });
      }));
    });

    // Wait for visible videos
    visibleVideos.forEach(function (video) {
      promises.push(new Promise(function (resolve) {
        var done = false;
        function finish() { if (done) { return; } done = true; tick(); resolve(); }
        video.addEventListener('loadeddata', finish, { once: true });
        video.addEventListener('canplay',    finish, { once: true });
        video.addEventListener('error',      finish, { once: true });
      }));
    });

    // Wait for toggle images
    toggleImages.forEach(function (img) {
      promises.push(new Promise(function (resolve) {
        if (img.complete && img.naturalWidth > 0) { tick(); resolve(); return; }
        img.addEventListener('load',  function () { tick(); resolve(); }, { once: true });
        img.addEventListener('error', function () { tick(); resolve(); }, { once: true });
      }));
    });

    // Wait for toggle videos
    toggleVideos.forEach(function (video) {
      promises.push(new Promise(function (resolve) {
        var done = false;
        function finish() { if (done) { return; } done = true; tick(); resolve(); }
        if (video.readyState >= 2) { finish(); return; }
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
