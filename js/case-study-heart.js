(function () {
  if (!document.body.classList.contains('case-study-page')) {
    return;
  }

  // ─── Key ─────────────────────────────────────────────────────────────────────
  var pathname = (window.location.pathname || '/')
    .toLowerCase()
    .replace(/\/$/, '')
    .replace(/\/index(?:-v\d+)?\.html$/, '');
  var parts = pathname.split('/').filter(Boolean);
  var csSlug = parts[parts.length - 1] || 'case-study';
  var STORAGE_KEY = 'cs:heart:' + csSlug;

  // ─── State ───────────────────────────────────────────────────────────────────
  function isFavorited() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setFavorited(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
    } catch (e) {}
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  var toastTimer = null;

  function showToast(msg) {
    var toast = document.getElementById('wg-copy-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wg-copy-toast';
      toast.className = 'wg-copy-toast';
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2000);
  }

  // ─── Sync all instances ──────────────────────────────────────────────────────
  function syncAll(selected) {
    document.querySelectorAll('.cs-heart-widget').forEach(function (widget) {
      widget.classList.toggle('is-favorited', selected);
      var btn = widget.querySelector('[data-cs-heart]');
      if (btn) {
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        btn.setAttribute('aria-label', selected ? 'Remove like' : 'Like this case study');
      }
    });
  }

  // ─── Build widget ────────────────────────────────────────────────────────────
  function buildWidget() {
    var favorited = isFavorited();

    var wrap = document.createElement('div');
    wrap.className = 'cs-heart-widget';
    if (favorited) {
      wrap.classList.add('is-favorited');
    }

    var label = document.createElement('span');
    label.className = 'cs-heart-label';
    label.textContent = 'Like this case study?';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cs-heart-btn';
    btn.setAttribute('data-cs-heart', '');
    btn.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    btn.setAttribute('aria-label', favorited ? 'Remove like' : 'Like this case study');

    var icon = document.createElement('span');
    icon.className = 'material-symbols-rounded cs-heart-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'favorite';

    btn.appendChild(icon);
    wrap.appendChild(label);
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      var next = !isFavorited();
      setFavorited(next);
      syncAll(next);

      if (next) {
        showToast('Thanks, appreciate it!');
      }

      document.dispatchEvent(new CustomEvent('cs:heart:click', {
        detail: { selected: next, csSlug: csSlug }
      }));
    });

    return wrap;
  }

  // ─── Inject ──────────────────────────────────────────────────────────────────
  function init() {
    var projectContent = document.querySelector('.project-content');
    if (!projectContent) {
      return;
    }

    // Desktop: fixed widget anchored to bottom-left, visually aligned with the
    // index panel column. Appended to body so it's outside all stacking contexts.
    // Only becomes visible after scrolling 40% down the page.
    var fixedWidget = buildWidget();
    fixedWidget.classList.add('cs-heart-widget--fixed');
    document.body.appendChild(fixedWidget);

    function getScrollPct() {
      var el = document.documentElement;
      var scrollTop = window.pageYOffset || el.scrollTop || 0;
      var maxScroll = el.scrollHeight - el.clientHeight;
      return maxScroll > 0 ? scrollTop / maxScroll : 0;
    }

    function updateFixedVisibility() {
      fixedWidget.classList.toggle('is-scroll-visible', getScrollPct() >= 0.40);
    }

    window.addEventListener('scroll', updateFixedVisibility, { passive: true });
    updateFixedVisibility();

    // Mobile: inline widget injected before the next-case-study card, or at the
    // end of project-content if no recommendation card exists.
    var inlineWidget = buildWidget();
    inlineWidget.classList.add('cs-heart-widget--inline');
    var nextShell = projectContent.querySelector('.next-case-study-shell');

    if (nextShell) {
      projectContent.insertBefore(inlineWidget, nextShell);
    } else {
      projectContent.appendChild(inlineWidget);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
