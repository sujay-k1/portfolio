(function () {
  var frameworkMedia = window.matchMedia('(min-width: 767px)');
  var frameworkMobilePortraitMedia = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var frameworkGrid = document.querySelector('.biz2x-framework-grid');
  var frameworkConfigCards = Array.from(
    document.querySelectorAll('.biz2x-framework-card.is-config')
  );

  var SECTION_START_RATIO = 0.5;
  var SECTION_END_RATIO = 0.3;
  var CARD_FLIP_SPAN = 0.72;
  var CARD_HOLD_SPAN = 0.22;
  var MOBILE_CARD_START_RATIO = 0.76;
  var MOBILE_CARD_ANCHOR_RATIO = 0.18;
  var MOBILE_CARD_SCROLL_RATIO = 0.82;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function canRunDesktopFrameworkInteraction() {
    return frameworkMedia.matches
      && !prefersReducedMotion.matches
      && frameworkGrid
      && frameworkConfigCards.length === 3;
  }

  function canRunMobileFrameworkInteraction() {
    return frameworkMobilePortraitMedia.matches
      && !prefersReducedMotion.matches
      && frameworkGrid
      && frameworkConfigCards.length === 3;
  }

  function getSectionProgress() {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    var firstConfigRect = frameworkConfigCards[0].getBoundingClientRect();
    var lastConfigRect = frameworkConfigCards[frameworkConfigCards.length - 1].getBoundingClientRect();
    var startLine = viewportHeight * SECTION_START_RATIO;
    var endLine = viewportHeight * SECTION_END_RATIO;
    var anchor = firstConfigRect.top + ((lastConfigRect.bottom - firstConfigRect.top) * 0.18);
    return clamp((startLine - anchor) / Math.max(startLine - endLine, 1), 0, 1);
  }

  function getCardProgress(sectionProgress, index) {
    var cardUnit = CARD_FLIP_SPAN + CARD_HOLD_SPAN;
    var start = index * cardUnit;
    var local = (sectionProgress * (cardUnit * frameworkConfigCards.length)) - start;
    return clamp(local / CARD_FLIP_SPAN, 0, 1);
  }

  function hasLockedMobileCardHeights() {
    return frameworkConfigCards.every(function (card) {
      return !!card.style.height;
    });
  }

  function lockMobileCardHeights() {
    if (hasLockedMobileCardHeights()) {
      return;
    }

    frameworkConfigCards.forEach(function (card) {
      card.style.height = 'auto';
    });

    frameworkConfigCards.forEach(function (card) {
      var height = Math.ceil(card.getBoundingClientRect().height);

      if (height > 0) {
        card.style.height = height + 'px';
      }
    });
  }

  function clearMobileCardHeights() {
    frameworkConfigCards.forEach(function (card) {
      card.style.height = '';
    });
  }

  function getMobileCardProgress(card) {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    var rect = card.getBoundingClientRect();
    var triggerLine = viewportHeight * MOBILE_CARD_START_RATIO;
    var anchor = rect.top + (rect.height * MOBILE_CARD_ANCHOR_RATIO);
    var triggerDistance = Math.max(rect.height * MOBILE_CARD_SCROLL_RATIO, 1);

    return clamp((triggerLine - anchor) / triggerDistance, 0, 1);
  }

  function updateFrameworkCards() {
    if (!frameworkGrid || !frameworkConfigCards.length) {
      return;
    }

    if (canRunMobileFrameworkInteraction()) {
      lockMobileCardHeights();

      frameworkConfigCards.forEach(function (card) {
        var cardProgress = getMobileCardProgress(card);
        card.style.setProperty('--biz2x-card-rotate', (cardProgress * 180).toFixed(3) + 'deg');
      });
      return;
    }

    clearMobileCardHeights();

    if (!canRunDesktopFrameworkInteraction()) {
      frameworkConfigCards.forEach(function (card) {
        card.style.setProperty('--biz2x-card-rotate', '0deg');
      });
      return;
    }

    var sectionProgress = getSectionProgress();

    frameworkConfigCards.forEach(function (card, index) {
      var cardProgress = getCardProgress(sectionProgress, index);
      card.style.setProperty('--biz2x-card-rotate', (cardProgress * 180).toFixed(3) + 'deg');
    });
  }

  if (!frameworkGrid || !frameworkConfigCards.length) {
    return;
  }

  window.addEventListener('scroll', updateFrameworkCards, { passive: true });
  window.addEventListener('resize', function () {
    clearMobileCardHeights();
    updateFrameworkCards();
  });
  window.addEventListener('load', function () {
    clearMobileCardHeights();
    updateFrameworkCards();
  });
  updateFrameworkCards();
})();
