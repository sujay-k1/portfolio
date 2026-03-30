(() => {
  const startupLoader = document.getElementById('startup-loader');
  const core = window.StartupLoaderCore;

  if (!startupLoader || !core) {
    return;
  }

  if (window.__activeStartupLoaderController) {
    window.__startupLoaderController = window.__activeStartupLoaderController;
    return;
  }

  const handoffState = core.consumeLoaderHandoffState();
  const controller = core.createStartupLoaderController({
    resumeFromCenter: !!handoffState
  });

  if (!controller) {
    return;
  }

  window.__activeStartupLoaderController = controller;
  window.__startupLoaderController = controller;
})();
