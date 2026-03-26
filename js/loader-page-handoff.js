(function () {
  var STORAGE_KEY = 'startup-loader-handoff';
  var MAX_AGE_MS = 10000;
  var REVERSE_NAVIGATION_TIMEOUT_MS = 5000;
  var isRunning = false;

  function normalizePathname(pathname) {
    if (!pathname) {
      return '/';
    }

    var normalized = pathname.toLowerCase();
    if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') {
      normalized = normalized.slice(0, -1);
    }
    if (normalized.slice(-11) === '/index.html') {
      normalized = normalized.slice(0, -11) || '/';
    }
    return normalized || '/';
  }

  function toUrl(target) {
    try {
      return target instanceof URL ? target : new URL(target, window.location.href);
    } catch (error) {
      return null;
    }
  }

  function isManagedTarget(target) {
    var url = toUrl(target);
    var pathname;

    if (!url || url.origin !== window.location.origin) {
      return false;
    }

    pathname = normalizePathname(url.pathname);
    return pathname.indexOf('/work/') === 0 || (pathname === '/' && url.hash === '#work');
  }

  function isSameDocumentTarget(url) {
    return !!(
      url &&
      url.origin === window.location.origin &&
      normalizePathname(url.pathname) === normalizePathname(window.location.pathname)
    );
  }

  function consumeStoredHandoffForCurrentPage() {
    var raw;
    var payload;
    var currentPath = normalizePathname(window.location.pathname);
    var currentHash = window.location.hash || '';

    try {
      raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      payload = JSON.parse(raw);
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      clearHandoffTarget();
      return null;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (Date.now() - Number(payload.ts || 0) > MAX_AGE_MS) {
      return null;
    }

    if (normalizePathname(payload.targetPath) !== currentPath) {
      return null;
    }

    if ((payload.targetHash || '') !== currentHash) {
      return null;
    }

    return payload;
  }

  function preloadCurrentPageHandoffState() {
    if (!document.body || !document.body.classList.contains('app-loading')) {
      return;
    }

    var payload = consumeStoredHandoffForCurrentPage();
    if (!payload) {
      return;
    }

    window.__loaderHandoffState = payload;
  }

  function canAnimateFromCurrentPage() {
    var controller = window.__activeStartupLoaderController || window.__startupLoaderController;

    return !!(
      controller &&
      typeof controller.playReverseToCenter === 'function' &&
      document.body &&
      document.body.classList.contains('loader-logo-active') &&
      !document.body.classList.contains('app-loading')
    );
  }

  function storeHandoffTarget(url) {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ts: Date.now(),
          targetPath: normalizePathname(url.pathname),
          targetHash: url.hash || ''
        })
      );
    } catch (error) {
      return;
    }
  }

  function clearHandoffTarget() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      return;
    }
  }

  function finishNavigation(url) {
    window.location.href = url.href;
  }

  function navigate(target) {
    var url = toUrl(target);
    var controller;
    var fallbackTimer;

    if (!url) {
      return false;
    }

    if (!isManagedTarget(url) || !canAnimateFromCurrentPage()) {
      finishNavigation(url);
      return true;
    }

    if (isSameDocumentTarget(url)) {
      finishNavigation(url);
      return true;
    }

    if (isRunning) {
      return true;
    }

    controller = window.__activeStartupLoaderController || window.__startupLoaderController;
    if (!controller || typeof controller.playReverseToCenter !== 'function') {
      finishNavigation(url);
      return true;
    }

    isRunning = true;
    storeHandoffTarget(url);

    fallbackTimer = window.setTimeout(function () {
      clearHandoffTarget();
      finishNavigation(url);
    }, REVERSE_NAVIGATION_TIMEOUT_MS);

    controller
      .playReverseToCenter()
      .then(function () {
        window.clearTimeout(fallbackTimer);
        finishNavigation(url);
      })
      .catch(function () {
        window.clearTimeout(fallbackTimer);
        clearHandoffTarget();
        finishNavigation(url);
      });

    return true;
  }

  function shouldIgnoreClick(event, anchor) {
    if (event.defaultPrevented || event.button !== 0) {
      return true;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return true;
    }

    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return true;
    }

    return false;
  }

  function onDocumentClick(event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    var url;

    if (!anchor || shouldIgnoreClick(event, anchor)) {
      return;
    }

    url = toUrl(anchor.getAttribute('href'));
    if (!url || !isManagedTarget(url) || isSameDocumentTarget(url)) {
      return;
    }

    if (!canAnimateFromCurrentPage()) {
      return;
    }

    event.preventDefault();
    navigate(url);
  }

  preloadCurrentPageHandoffState();
  document.addEventListener('click', onDocumentClick, true);

  window.LoaderPageHandoff = {
    isManagedTarget: isManagedTarget,
    navigate: navigate
  };
})();
