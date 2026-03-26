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
    return Promise.resolve(true);
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
