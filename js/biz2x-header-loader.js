(function () {
  var STARTUP_LOADER_TIMEOUT_MS = 20000;
  var startupLoader = document.getElementById('startup-loader');
  var core = window.StartupLoaderCore;
  var appRevealed = false;
  var loaderRevealStarted = false;

  function startLoaderReveal() {
    if (loaderRevealStarted) {
      return;
    }
    loaderRevealStarted = true;
    document.body.classList.remove('app-loading');
    if (startupLoader) {
      startupLoader.style.pointerEvents = 'none';
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
    if (loaderController && typeof loaderController.dockFinalFrame === 'function') {
      loaderController.dockFinalFrame();
    }
    if (startupLoader) {
      startupLoader.classList.add('is-hidden');
    }
  }

  function createStartupDependencyPromise() {
    var promises = [];

    // Wait for all images to finish loading
    Array.from(document.querySelectorAll('img')).forEach(function (img) {
      if (img.complete && img.naturalWidth > 0) {
        return;
      }
      promises.push(new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      }));
    });

    // Wait for videos to have first-frame data ready
    Array.from(document.querySelectorAll('video')).forEach(function (video) {
      if (video.readyState >= 2) {
        return;
      }
      promises.push(new Promise(function (resolve) {
        video.addEventListener('loadeddata', resolve, { once: true });
        video.addEventListener('canplay', resolve, { once: true });
        video.addEventListener('error', resolve, { once: true });
      }));
    });

    return promises.length
      ? Promise.all(promises).then(function () { return true; })
      : Promise.resolve(true);
  }

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
