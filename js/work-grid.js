// Work Grid — keyword marquee
(function () {
  var stars = Array.from(document.querySelectorAll('[data-card-badge-star]'));
  if (!stars.length || !window.lottie) return;
  stars.forEach(function (node) {
    window.lottie.loadAnimation({
      container: node,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'Assets/star.json'
    });
  });
})();

// Work Grid — keyword marquee
(function () {
  document.querySelectorAll('.wg-card').forEach(function (card, cardIndex) {
    var keyflow = card.querySelector('.wg-keyflow');
    var raw = card.dataset.keywords;
    if (!keyflow || !raw) return;
    var keywords = raw.split(',');
    var rows = 5;
    for (var r = 0; r < rows; r++) {
      var rotated = keywords.map(function (_, i) { return keywords[(i + r) % keywords.length]; });
      var repeated = rotated.concat(rotated);
      var direction = ((cardIndex + r) % 2 === 0) ? 'normal' : 'reverse';
      var duration = (14 + (cardIndex * 1.4) + (r * 1.15)).toFixed(2);
      var row = document.createElement('div');
      row.className = 'wg-keyrow';
      var track = document.createElement('div');
      track.className = 'wg-keyrow-track';
      track.style.setProperty('--row-duration', duration + 's');
      track.style.setProperty('--row-direction', direction);
      track.innerHTML = repeated.map(function (kw) { return '<span>' + kw + '</span><span>\u2022</span>'; }).join('');
      row.appendChild(track);
      keyflow.appendChild(row);
    }
  });
})();

// Work Grid — mobile viewport-active cards
(function () {
  var cards = Array.from(document.querySelectorAll('.wg-card'));
  if (!cards.length) return;

  function isMobileLike() {
    return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 768px)').matches;
  }

  function updateActiveCards() {
    if (!isMobileLike()) {
      cards.forEach(function (card) { card.classList.remove('is-mobile-active'); });
      return;
    }

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    cards.forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var fullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;
      card.classList.toggle('is-mobile-active', fullyVisible);
    });
  }

  window.addEventListener('scroll', updateActiveCards, { passive: true });
  window.addEventListener('resize', updateActiveCards);
  window.addEventListener('load', updateActiveCards);
  requestAnimationFrame(updateActiveCards);
})();

// Work Grid — travelling pill filter (single-select)
(function () {
  var tags = Array.from(document.querySelectorAll('.wg-filter-tag'));
  var cards = document.querySelectorAll('.wg-card');
  var pill = document.getElementById('wg-filter-pill');
  var filtersEl = document.querySelector('.wg-filters-row');
  var gridEl = document.querySelector('.wg-grid');
  if (!pill || !filtersEl || !tags.length) return;

  var selectedTag = document.querySelector('.wg-filter-tag[data-filter="all"]') || tags[0];
  var idleTimer = null;
  var IDLE_DELAY = 0;
  var PILL_SIDE_PADDING = 24;
  var PILL_VERTICAL_PADDING = 8;
  var pillStroke = pill.querySelector('.wg-filter-pill-stroke');
  var pillHighlight = pill.querySelector('.wg-filter-pill-highlight');
  var pillHighlightGlow = pill.querySelector('.wg-filter-pill-highlight-glow');
  var pillSvg = pill.querySelector('.wg-filter-pill-svg');
  var HIGHLIGHT_LENGTH = 16;
  var idleStrokeTween = null;
  var idleHighlightTween = null;
  var hoveredTag = null;
  var previewTag = null;
  var idleAnimationToken = 0;
  var pillSettleFallbackTimer = null;
  var pillSettleToken = 0;

  function buildRoundedRectPath(width, height, inset) {
    var x = inset;
    var y = inset;
    var w = Math.max(width - inset * 2, 0);
    var h = Math.max(height - inset * 2, 0);
    var r = Math.max(Math.min(h / 2, w / 2), 0);
    return [
      'M', x + r, y,
      'H', x + w - r,
      'A', r, r, 0, 0, 1, x + w, y + r,
      'V', y + h - r,
      'A', r, r, 0, 0, 1, x + w - r, y + h,
      'H', x + r,
      'A', r, r, 0, 0, 1, x, y + h - r,
      'V', y + r,
      'A', r, r, 0, 0, 1, x + r, y,
      'Z'
    ].join(' ');
  }

  function stopIdleAnimation() {
    clearTimeout(pillSettleFallbackTimer);
    if (idleStrokeTween) {
      idleStrokeTween.kill();
      idleStrokeTween = null;
    }
    if (idleHighlightTween) {
      idleHighlightTween.kill();
      idleHighlightTween = null;
    }
    [pillStroke, pillHighlight, pillHighlightGlow].forEach(function (node) {
      if (!node) return;
      node.style.opacity = '0';
      node.style.strokeDasharray = '';
      node.style.strokeDashoffset = '';
    });
  }

  function waitForPillSettle(target, callback) {
    clearTimeout(pillSettleFallbackTimer);
    var token = ++pillSettleToken;
    var settled = false;

    function finish() {
      if (settled || token !== pillSettleToken) {
        return;
      }
      settled = true;
      pill.removeEventListener('transitionend', onTransitionEnd);
      callback();
    }

    function onTransitionEnd(event) {
      if (event.target !== pill) {
        return;
      }
      if (
        event.propertyName !== 'transform' &&
        event.propertyName !== 'width' &&
        event.propertyName !== 'height'
      ) {
        return;
      }
      finish();
    }

    pill.addEventListener('transitionend', onTransitionEnd);
    pillSettleFallbackTimer = setTimeout(finish, 180);
    movePill(target);
  }

  function updatePillSvg() {
    if (!pillStroke || !pillHighlight || !pillHighlightGlow || !pillSvg) return;
    var width = Math.max(pill.offsetWidth, 0);
    var height = Math.max(pill.offsetHeight, 0);
    if (!width || !height) return;

    var inset = 1;
    pillSvg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    var d = buildRoundedRectPath(width, height, inset);
    [pillStroke, pillHighlight, pillHighlightGlow].forEach(function (node) {
      node.setAttribute('d', d);
    });

    var perimeter = pillStroke.getTotalLength();
    pill.style.setProperty('--wg-pill-perimeter', perimeter.toFixed(3));
    pill.style.setProperty('--wg-pill-highlight-length', String(HIGHLIGHT_LENGTH));
    pillStroke.style.strokeDasharray = '0 ' + perimeter;
    pillStroke.style.strokeDashoffset = perimeter;
    pillHighlight.style.strokeDasharray = HIGHLIGHT_LENGTH + ' ' + Math.max(perimeter - HIGHLIGHT_LENGTH, 0);
    pillHighlightGlow.style.strokeDasharray = HIGHLIGHT_LENGTH + ' ' + Math.max(perimeter - HIGHLIGHT_LENGTH, 0);
    pillHighlight.style.strokeDashoffset = perimeter;
    pillHighlightGlow.style.strokeDashoffset = perimeter;
  }

  function startIdleAnimation(onStrokeComplete) {
    if (!window.gsap || !pillStroke || !pillHighlight || !pillHighlightGlow) {
      return;
    }
    stopIdleAnimation();
    updatePillSvg();
    var perimeter = Number(pill.style.getPropertyValue('--wg-pill-perimeter')) || pillStroke.getTotalLength();
    pillStroke.style.opacity = '1';
    window.gsap.set([pillHighlight, pillHighlightGlow], {
      opacity: 1,
      strokeDashoffset: perimeter
    });
    var drawState = { head: 0, gap: perimeter };
    function renderDrawState() {
      var visibleLength = Math.max(perimeter - drawState.gap, 0);
      var strokeStart = drawState.head - visibleLength;
      var strokeOffset = -strokeStart;
      var headOffset = -drawState.head;
      pillStroke.style.strokeDasharray = visibleLength + ' ' + Math.max(perimeter - visibleLength, 0);
      pillStroke.style.strokeDashoffset = strokeOffset;
      pillHighlight.style.strokeDashoffset = headOffset;
      pillHighlightGlow.style.strokeDashoffset = headOffset;
    }

    idleStrokeTween = window.gsap.timeline({
      onComplete: function () {
        if (typeof onStrokeComplete === 'function') {
          onStrokeComplete();
        }
        pillStroke.style.strokeDasharray = perimeter;
        pillStroke.style.strokeDashoffset = 0;
        window.gsap.set([pillHighlight, pillHighlightGlow], {
          opacity: 0,
          strokeDashoffset: perimeter
        });

        idleHighlightTween = window.gsap.timeline({
          repeat: -1
        });

        idleHighlightTween.to([pillHighlight, pillHighlightGlow], {
          strokeDashoffset: -HIGHLIGHT_LENGTH,
          duration: 4,
          ease: 'none'
        }, 0);

        idleHighlightTween.to([pillHighlight, pillHighlightGlow], {
          opacity: 1,
          duration: 0.22,
          ease: 'power1.out'
        }, 0);

        idleHighlightTween.to([pillHighlight, pillHighlightGlow], {
          opacity: 0,
          duration: 0.28,
          ease: 'power1.in'
        }, 2.72);
      }
    });

    idleStrokeTween.to(drawState, {
      head: perimeter,
      gap: 0,
      duration: 0.6,
      ease: 'power1.in',
      onUpdate: renderDrawState
    });
  }

  // ── Position pill to match a button (CSS transition handles the travel) ──
  function movePill(target) {
    if (!target) return;
    var filtersRect = filtersEl.getBoundingClientRect();
    var tagRect = target.getBoundingClientRect();
    pill.style.transform = 'translate(' + (((tagRect.left - filtersRect.left) + filtersEl.scrollLeft) - PILL_SIDE_PADDING) + 'px, ' + ((tagRect.top - filtersRect.top) - PILL_VERTICAL_PADDING) + 'px)';
    pill.style.width = (tagRect.width + (PILL_SIDE_PADDING * 2)) + 'px';
    pill.style.height = (tagRect.height + (PILL_VERTICAL_PADDING * 2)) + 'px';
    updatePillSvg();
  }

  // ── Position pill instantly (no transition, used for init and resize) ──
  function movePillInstant(target) {
    ++pillSettleToken;
    clearTimeout(pillSettleFallbackTimer);
    pill.style.transition = 'none';
    movePill(target);
    pill.offsetHeight; // force reflow
    pill.style.transition = '';
  }

  // ── Idle gradient ──
  function resetIdle() {
    stopIdleAnimation();
    clearTimeout(idleTimer);
    var token = ++idleAnimationToken;
    idleTimer = setTimeout(function () {
      startIdleAnimation(function () {
        if (!hoveredTag) {
          return;
        }
        if (token !== idleAnimationToken) {
          return;
        }
        previewTag = hoveredTag;
        filterCards(previewTag.dataset.filter);
      });
    }, IDLE_DELAY);
  }

  // ── Filter cards ──
  function filterCards(filter) {
    var cardArray = Array.prototype.slice.call(cards);
    if (!window.gsap || !window.Flip) {
      if (filter === 'all') {
        cards.forEach(function (c) { c.classList.remove('is-hidden'); });
        return;
      }
      cards.forEach(function (c) {
        var cardTags = (c.dataset.tags || '').split(' ');
        c.classList.toggle('is-hidden', !cardTags.includes(filter));
      });
      return;
    }

    var oldVisible = cardArray.filter(function (c) { return !c.classList.contains('is-hidden'); });
    var newVisible = cardArray.filter(function (c) {
      if (filter === 'all') return true;
      var cardTags = (c.dataset.tags || '').split(' ');
      return cardTags.includes(filter);
    });
    var leaving = oldVisible.filter(function (c) { return newVisible.indexOf(c) === -1; });
    var entering = newVisible.filter(function (c) { return oldVisible.indexOf(c) === -1; });
    var staying = newVisible.filter(function (c) { return oldVisible.indexOf(c) !== -1; });

    window.gsap.killTweensOf(cardArray);
    entering.forEach(function (card) {
      card.classList.remove('is-hidden');
      card.style.visibility = 'hidden';
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
    });
    if (gridEl) gridEl.classList.add('is-filtering');

    var finishEntering = function () {
      if (!entering.length) {
        if (gridEl) gridEl.classList.remove('is-filtering');
        return;
      }

      var gridRect = gridEl ? gridEl.getBoundingClientRect() : { left: 0, width: window.innerWidth };
      var singleColumn = window.innerWidth <= 768;

      entering.forEach(function (card, index) {
        var rect = card.getBoundingClientRect();
        var fromLeft = singleColumn
          ? index % 2 === 0
          : (rect.left + rect.width / 2) < (gridRect.left + gridRect.width / 2);
        card.style.visibility = 'visible';

        window.gsap.fromTo(card,
          {
            x: fromLeft ? -80 : 80,
            opacity: 0
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.34,
            ease: 'power2.out',
            clearProps: 'x,opacity',
            onComplete: function () {
              card.style.pointerEvents = '';
              if (index === entering.length - 1 && gridEl) {
                gridEl.classList.remove('is-filtering');
              }
            }
          }
        );
      });
    };

    var runReflow = function () {
      var state = window.Flip.getState(staying);

      cards.forEach(function (c) {
        c.classList.toggle('is-hidden', newVisible.indexOf(c) === -1);
      });

      if (!staying.length) {
        finishEntering();
        return;
      }

      window.Flip.from(state, {
        duration: 0.5,
        ease: 'power2.inOut',
        stagger: 0.02,
        onStart: function () {
          window.gsap.delayedCall(0.22, finishEntering);
        }
      });
    };

    if (!leaving.length) {
      runReflow();
      return;
    }

    var gridRect = gridEl ? gridEl.getBoundingClientRect() : { left: 0, width: window.innerWidth };
    var singleColumn = window.innerWidth <= 768;
    var completedLeaves = 0;

    leaving.forEach(function (card, index) {
      var rect = card.getBoundingClientRect();
      var toLeft = singleColumn
        ? index % 2 === 0
        : (rect.left + rect.width / 2) < (gridRect.left + gridRect.width / 2);

      window.gsap.to(card, {
        x: toLeft ? -80 : 80,
        opacity: 0,
        duration: 0.24,
        ease: 'power2.in',
        onComplete: function () {
          completedLeaves += 1;
          if (completedLeaves === leaving.length) {
            runReflow();
          }
        }
      });
    });
  }

  // ── Select a tag ──
  function selectTag(tag) {
    tags.forEach(function (t) { t.classList.remove('is-active'); });
    tag.classList.add('is-active');
    selectedTag = tag;
    previewTag = null;
    hoveredTag = null;
    stopIdleAnimation();
    waitForPillSettle(tag, resetIdle);
    filterCards(tag.dataset.filter);
  }

  // ── Events ──
  tags.forEach(function (tag) {
    tag.addEventListener('mouseenter', function () {
      hoveredTag = tag;
      stopIdleAnimation();
      waitForPillSettle(tag, resetIdle);
    });

    tag.addEventListener('click', function () {
      selectTag(tag);
    });
  });

  filtersEl.addEventListener('mouseleave', function () {
    hoveredTag = null;
    previewTag = null;
    stopIdleAnimation();
    waitForPillSettle(selectedTag, resetIdle);
    filterCards(selectedTag.dataset.filter);
  });

  // ── Init ──
  requestAnimationFrame(function () {
    selectedTag.classList.add('is-active');
    movePillInstant(selectedTag);
    resetIdle();
  });

  // Reposition on resize (instant, no animation)
  window.addEventListener('resize', function () {
    movePillInstant(selectedTag);
  });

  filtersEl.addEventListener('scroll', function () {
    movePillInstant(hoveredTag || selectedTag);
  }, { passive: true });
})();

// Work Grid — contact icon tooltips + copy on desktop
(function () {
  var allIcons = Array.from(document.querySelectorAll('.wg-status-panel-icon'));
  var toast = document.getElementById('wg-copy-toast');
  if (!allIcons.length) return;

  function isDesktop() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2000);
  }

  allIcons.forEach(function (icon) {
    var inlineTooltip = icon.querySelector('.wg-icon-tooltip');
    if (!inlineTooltip) return;

    // Move tooltip to body to escape stacking context of the dock
    var tooltipText = inlineTooltip.textContent;
    inlineTooltip.remove();
    var tooltip = document.createElement('span');
    tooltip.className = 'wg-icon-tooltip';
    tooltip.textContent = tooltipText;
    document.body.appendChild(tooltip);

    function positionTooltip() {
      var rect = icon.getBoundingClientRect();
      tooltip.style.left = '0px';
      tooltip.style.top = '-9999px';
      var tooltipWidth = tooltip.offsetWidth || 160;
      var left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      tooltip.style.left = left + 'px';
      tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    }

    icon.addEventListener('mouseenter', function () {
      positionTooltip();
      tooltip.classList.add('is-visible');
    });

    icon.addEventListener('mouseleave', function () {
      tooltip.classList.remove('is-visible');
    });

    // Copy on desktop for phone/email
    var copyValue = icon.getAttribute('data-copy');
    if (!copyValue) return;

    var isEmail = icon.getAttribute('href').indexOf('mailto:') === 0;

    icon.addEventListener('click', function (event) {
      if (!isDesktop()) return;
      event.preventDefault();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyValue).then(function () {
          showToast(isEmail ? 'Email id copied' : 'Phone number copied');
        }).catch(function () {
          window.location.href = icon.getAttribute('href');
        });
      } else {
        // fallback for browsers without clipboard API
        var ta = document.createElement('textarea');
        ta.value = copyValue;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast(isEmail ? 'Email id copied' : 'Phone number copied'); }
        catch (e) { window.location.href = icon.getAttribute('href'); }
        document.body.removeChild(ta);
      }
    });
  });
})();

// Work Grid — scroll-linked media parallax
(function () {
  var visuals = Array.from(document.querySelectorAll('[data-parallax-visual]'));
  if (!visuals.length) return;

  var ticking = false;
  var MAX_SHIFT = 36;

  // Section 3 scrolls inside .snap-section-scroll, not window — use live
  // getBoundingClientRect() so we always get the current viewport position.
  function applyParallax() {
    ticking = false;
    var vh = window.innerHeight;
    var viewportCenter = vh / 2;

    for (var i = 0; i < visuals.length; i++) {
      var visual = visuals[i];
      var media = visual.closest('.wg-card-image');
      if (!media) continue;
      var rect = media.getBoundingClientRect();
      var cardCenterY = rect.top + rect.height / 2;
      // Normalize: -1 when card center is at top of viewport, +1 at bottom
      var normalized = (cardCenterY - viewportCenter) / (vh / 2);
      var shift = normalized * MAX_SHIFT;
      if (shift > MAX_SHIFT) shift = MAX_SHIFT;
      else if (shift < -MAX_SHIFT) shift = -MAX_SHIFT;
      visual.style.setProperty('--wg-parallax-y', shift.toFixed(2) + 'px');
    }
  }

  function queueParallax() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(applyParallax);
  }

  // Listen on both window and the snap scroll container
  var scrollSection = document.querySelector('.snap-section-scroll');
  if (scrollSection) scrollSection.addEventListener('scroll', queueParallax, { passive: true });
  window.addEventListener('scroll', queueParallax, { passive: true });
  window.addEventListener('resize', queueParallax);
  window.addEventListener('load', queueParallax);
  requestAnimationFrame(applyParallax);
})();

// Work Grid — hover chip
(function () {
  var chip = document.getElementById('wg-hover-chip');
  var chipText = document.getElementById('wg-hover-chip-text');
  var chipIconLeading = document.getElementById('wg-hover-chip-icon-leading');
  var chipIconTrailing = document.getElementById('wg-hover-chip-icon-trailing');
  var cards = Array.from(document.querySelectorAll('.wg-card'));
  if (!chip || !chipText || !chipIconLeading || !chipIconTrailing || !cards.length) return;
  var hoverCardIndex = null;
  var cardIndexMap = new WeakMap();
  cards.forEach(function (card, index) {
    cardIndexMap.set(card, index);
  });

  function supportsHover(event) {
    var supportsFineHover = window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches;
    if (!event) {
      return supportsFineHover;
    }
    if (event.pointerType === 'touch') {
      return false;
    }
    if (event.pointerType === 'mouse') {
      return true;
    }
    if (event.pointerType === 'pen') {
      return supportsFineHover;
    }
    return supportsFineHover;
  }

  function hideChip() {
    hoverCardIndex = null;
    chip.classList.remove('is-visible');
  }

  function getHoveredCardFromPoint(clientX, clientY) {
    var element = document.elementFromPoint(clientX, clientY);
    if (!(element instanceof Element)) {
      return null;
    }
    var card = element.closest('.wg-card');
    return card && cardIndexMap.has(card) ? card : null;
  }

  function showChip(cardIndex, clientX, clientY) {
    if (hoverCardIndex !== cardIndex) {
      hoverCardIndex = cardIndex;
      var card = cards[cardIndex];
      var leadingIcon = card ? (card.dataset.hoverChipIcon || '') : '';
      var trailingIcon = card ? (card.dataset.hoverChipTrailingIcon || 'arrow_right_alt') : 'arrow_right_alt';
      var text = card ? (card.dataset.hoverChipText || 'Open case-study') : 'Open case-study';
      chipIconLeading.textContent = leadingIcon || '';
      chipIconLeading.classList.toggle('is-hidden', !leadingIcon);
      chipIconTrailing.textContent = trailingIcon || '';
      chipIconTrailing.classList.toggle('is-hidden', !trailingIcon);
      chipText.textContent = text;
    }
    chip.style.transform =
      'translate3d(' + clientX.toFixed(2) + 'px, ' + clientY.toFixed(2) + 'px, 0) translate(-50%, -50%) scale(1)';
    chip.classList.add('is-visible');
  }

  window.addEventListener('pointermove', function (event) {
    if (!supportsHover(event)) {
      hideChip();
      return;
    }
    var hoveredCard = getHoveredCardFromPoint(event.clientX, event.clientY);
    if (!hoveredCard) {
      hideChip();
      return;
    }
    showChip(cardIndexMap.get(hoveredCard), event.clientX, event.clientY);
  });

  window.addEventListener('scroll', hideChip, { passive: true });
})();

// Work Grid — status dock panel
(function () {
  var overlay = document.querySelector('[data-dock-overlay]');
  var dock = document.querySelector('[data-status-dock]');
  var opportunityPill = document.querySelector('[data-opportunity-pill]');
  var inlineTrigger = dock ? dock.querySelector('[data-opportunity-trigger]') : null;
  var panel = dock ? dock.querySelector('[data-status-panel]') : null;
  var favorite = dock ? dock.querySelector('[data-status-favorite]') : null;
  if (!overlay || !dock || !opportunityPill || !inlineTrigger || !panel) return;

  var FAVORITE_KEY = 'wg:status-panel:favorite';
  var closeTimer = null;
  var overscrollOpen = false;
  var manualOpen = false;
  var touchStartY = null;

  function getFavoriteSelected() {
    try {
      return localStorage.getItem(FAVORITE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function setFavoriteSelected(selected) {
    try {
      localStorage.setItem(FAVORITE_KEY, selected ? 'true' : 'false');
    } catch (error) {
      return;
    }
  }

  function syncFavoriteButton() {
    if (!favorite) return;
    var selected = getFavoriteSelected();
    favorite.classList.toggle('is-selected', selected);
    favorite.setAttribute('aria-pressed', selected ? 'true' : 'false');
    favorite.setAttribute('aria-label', selected ? 'Remove favorite' : 'Favorite this card');
  }

  function isPointerWithinDock(relatedTarget) {
    return !!(relatedTarget && dock.contains(relatedTarget));
  }

  function getActiveTrigger() {
    return dock.classList.contains('is-chat-open') ? opportunityPill : dock.querySelector('[data-chat-dock]');
  }

  function getPanelWidthTarget() {
    return dock.classList.contains('is-chat-open') ? opportunityPill : dock.querySelector('[data-chat-dock]');
  }

  function getChatPanelTarget() {
    return dock.querySelector('[data-chat-dock]');
  }

  function positionPanel() {
    var targetRect = getActiveTrigger().getBoundingClientRect();
    var widthRect = getPanelWidthTarget().getBoundingClientRect();
    var dockRect = dock.getBoundingClientRect();
    var center = (targetRect.left + (targetRect.width / 2)) - dockRect.left;
    var chatTargetRect = getChatPanelTarget().getBoundingClientRect();
    var chatCenter = (chatTargetRect.left + (chatTargetRect.width / 2)) - dockRect.left;
    dock.style.setProperty('--wg-status-panel-anchor', center + 'px');
    dock.style.setProperty('--wg-status-panel-width', widthRect.width + 'px');
    dock.style.setProperty('--wg-chat-panel-anchor', chatCenter + 'px');
    dock.style.setProperty('--wg-chat-panel-width', chatTargetRect.width + 'px');
  }

  function setOpen(nextOpen) {
    positionPanel();
    dock.classList.toggle('is-open', nextOpen);
    overlay.classList.toggle('is-visible', nextOpen || dock.classList.contains('is-chat-open'));
    opportunityPill.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    inlineTrigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    panel.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      if (dock.matches(':hover') || dock.contains(document.activeElement) || manualOpen || overscrollOpen) {
        return;
      }
      setOpen(false);
    }, 80);
  }

  function openPanel() {
    clearTimeout(closeTimer);
    positionPanel();
    setOpen(true);
  }

  function closePanel(force) {
    clearTimeout(closeTimer);
    if (!force && (manualOpen || overscrollOpen)) {
      return;
    }
    setOpen(false);
  }

  function atPageEnd() {
    var scrollSection = document.querySelector('.snap-section-scroll');
    if (scrollSection) {
      return scrollSection.scrollTop + scrollSection.clientHeight >= scrollSection.scrollHeight - 2;
    }
    var scrollTop = window.scrollY || window.pageYOffset || 0;
    var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
    var doc = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    return scrollTop + viewport >= doc - 2;
  }

  if (favorite) {
    syncFavoriteButton();
    favorite.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var nextSelected = !getFavoriteSelected();
      setFavoriteSelected(nextSelected);
      syncFavoriteButton();
    });
  }

  inlineTrigger.addEventListener('mouseenter', openPanel);
  opportunityPill.addEventListener('mouseenter', openPanel);
  panel.addEventListener('mouseenter', openPanel);
  inlineTrigger.addEventListener('focus', openPanel);
  opportunityPill.addEventListener('focus', openPanel);

  dock.addEventListener('mouseleave', function (event) {
    if (isPointerWithinDock(event.relatedTarget)) return;
    scheduleClose();
  });

  dock.addEventListener('focusout', function () {
    requestAnimationFrame(function () {
      if (dock.contains(document.activeElement)) return;
      scheduleClose();
    });
  });

  inlineTrigger.addEventListener('click', function (event) {
    if (!window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    event.preventDefault();
    manualOpen = !manualOpen;
    if (manualOpen) {
      openPanel();
    } else {
      closePanel(true);
    }
  });

  inlineTrigger.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    manualOpen = !manualOpen;
    if (manualOpen) {
      openPanel();
    } else {
      closePanel(true);
    }
  });

  document.addEventListener('pointerdown', function (event) {
    if (dock.contains(event.target)) return;
    manualOpen = false;
    if (!overscrollOpen) {
      closePanel(true);
    }
  });

  window.addEventListener('wheel', function (event) {
    if (atPageEnd() && event.deltaY > 0) {
      overscrollOpen = true;
      openPanel();
      return;
    }
    if (overscrollOpen && event.deltaY < 0) {
      overscrollOpen = false;
      if (!dock.matches(':hover') && !dock.contains(document.activeElement) && !manualOpen) {
        closePanel(true);
      }
    }
  }, { passive: true });

  window.addEventListener('touchstart', function (event) {
    if (!event.touches || !event.touches.length) return;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', function (event) {
    if (!event.touches || !event.touches.length || touchStartY === null) return;
    var currentY = event.touches[0].clientY;
    var deltaY = currentY - touchStartY;
    if (atPageEnd() && deltaY < -12) {
      overscrollOpen = true;
      openPanel();
      touchStartY = currentY;
      return;
    }
    if (overscrollOpen && deltaY > 12) {
      overscrollOpen = false;
      if (!manualOpen) {
        closePanel(true);
      }
      touchStartY = currentY;
    }
  }, { passive: true });

  var scrollTarget = document.querySelector('.snap-section-scroll') || window;
  scrollTarget.addEventListener('scroll', function () {
    if (overscrollOpen && !atPageEnd()) {
      overscrollOpen = false;
      if (!dock.matches(':hover') && !dock.contains(document.activeElement) && !manualOpen) {
        closePanel(true);
      }
    }
  }, { passive: true });

  window.addEventListener('resize', positionPanel);
  requestAnimationFrame(positionPanel);
})();

// Work Grid — chat dock
(function () {
  var overlay = document.querySelector('[data-dock-overlay]');
  var dock = document.querySelector('[data-status-dock]');
  var chatDock = dock ? dock.querySelector('[data-chat-dock]') : null;
  var chatPanel = dock ? dock.querySelector('[data-chat-panel]') : null;
  var sphere = dock ? dock.querySelector('[data-chat-sphere]') : null;
  var closeButton = dock ? dock.querySelector('[data-chat-close]') : null;
  var tooltip = dock ? dock.querySelector('[data-chat-tooltip]') : null;
  var opportunityPill = document.querySelector('[data-opportunity-pill]');
  var chatForm = document.getElementById('chat-form');
  var chatInput = document.getElementById('chat-input');
  var chatSend = document.getElementById('chat-send');
  var chatReset = document.getElementById('chat-reset');
  var messagesEl = document.getElementById('chat-messages');
  if (!overlay || !dock || !chatDock || !chatPanel || !sphere || !closeButton || !tooltip || !opportunityPill || !chatForm || !chatInput || !chatSend || !chatReset || !messagesEl) return;

  var API_URL = 'https://portfolio-chat-api.imsujaykumar.workers.dev';
  var SESSION_KEY = 'portfolio_chat_session_id';
  var HISTORY_KEY = 'portfolio_chat_history';
  var sessionId = localStorage.getItem(SESSION_KEY);
  var chatHistory = [];
  var isConversationClosed = false;
  var isChatOpen = false;
  var closeRevealTimer = null;

  function updateDetachedPillShift() {
    if (!dock || !chatDock) return;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    var dockRect = chatDock.getBoundingClientRect();
    var shift = 0.9 * Math.max((viewportWidth - dockRect.width) / 2, 0);
    opportunityPill.style.setProperty('--wg-opportunity-detach-shift', shift.toFixed(2) + 'px');
  }

  function makeSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      var hex = Array.from(bytes, function (b) { return b.toString(16).padStart(2, '0'); });
      return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join('')
      ].join('-');
    }
    return 'session-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  if (!sessionId) {
    sessionId = makeSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  function hasConversation() {
    return chatHistory.some(function (item) {
      return item.role === 'user';
    });
  }

  function updateTooltipCopy() {
    var text = hasConversation()
      ? 'Continue talking to my chat-bot avatar'
      : 'Hey, this is my chat-bot avatar';
    tooltip.textContent = text;
    sphere.setAttribute('aria-label', hasConversation() ? 'Continue chat' : 'Open chat');
  }

  function showTooltip() {
    updateTooltipCopy();
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
  }

  function hideTooltip() {
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  function saveHistory() {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function createLinksHtml(links) {
    if (!links || !links.length) return null;
    var wrapper = document.createElement('div');
    wrapper.className = 'portfolio-chat__links';
    links.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'portfolio-chat__link';
      a.href = window.location.origin + item.url;
      a.textContent = item.label;
      wrapper.appendChild(a);
    });
    return wrapper;
  }

  function simpleMarkdown(src) {
    // Sanitize HTML entities first
    var s = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Bold: **text**
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code: `code`
    s = s.replace(/`(.+?)`/g, '<code>$1</code>');
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Unordered list items: lines starting with - or *
    s = s.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');
    s = s.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Paragraphs: split by double newlines
    s = s.split(/\n{2,}/).map(function(p) {
      p = p.trim();
      if (!p || p.startsWith('<ul>')) return p;
      return '<p>' + p + '</p>';
    }).join('');
    // Single newlines to <br> inside paragraphs
    s = s.replace(/<p>([\s\S]*?)<\/p>/g, function(m, inner) {
      return '<p>' + inner.replace(/\n/g, '<br>') + '</p>';
    });
    return s;
  }

  function renderMessage(message) {
    var row = document.createElement('div');
    row.className = 'portfolio-chat__row ' + (message.role === 'user' ? 'portfolio-chat__row--user' : 'portfolio-chat__row--assistant');
    var bubble = document.createElement('div');
    bubble.className = 'portfolio-chat__bubble ' + (message.role === 'user' ? 'portfolio-chat__bubble--user' : 'portfolio-chat__bubble--assistant');
    if (message.role !== 'user') {
      var meta = document.createElement('div');
      meta.className = 'portfolio-chat__meta';
      meta.textContent = 'Assistant';
      bubble.appendChild(meta);
    }
    var text = document.createElement('div');
    text.innerHTML = simpleMarkdown(message.text || '');
    bubble.appendChild(text);
    if (message.typing) {
      bubble.classList.add('portfolio-chat__typing');
    }
    var linksEl = createLinksHtml(message.links);
    if (linksEl) {
      bubble.appendChild(linksEl);
    }
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  function addMessage(role, text, links) {
    var message = { role: role, text: text, links: links || [] };
    chatHistory.push(message);
    saveHistory();
    renderMessage(message);
    updateTooltipCopy();
  }

  function addTypingMessage() {
    return renderMessage({
      role: 'assistant',
      text: 'Thinking...',
      links: [],
      typing: true
    });
  }

  function setChatOpen(nextOpen) {
    clearTimeout(closeRevealTimer);
    var sphereRectBefore = sphere.getBoundingClientRect();
    isChatOpen = nextOpen;
    updateDetachedPillShift();
    dock.classList.toggle('is-chat-open', nextOpen);
    overlay.classList.toggle('is-visible', nextOpen || dock.classList.contains('is-open'));
    opportunityPill.classList.toggle('is-visible', nextOpen);
    chatPanel.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
    sphere.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    closeButton.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
    closeButton.tabIndex = nextOpen ? 0 : -1;
    window.requestAnimationFrame(function () {
      var sphereRectAfter = sphere.getBoundingClientRect();
      var deltaX = sphereRectBefore.left - sphereRectAfter.left;
      if (deltaX) {
        sphere.style.transition = 'none';
        sphere.style.transform = 'translateX(' + deltaX.toFixed(2) + 'px)';
        sphere.getBoundingClientRect();
        sphere.style.transition = '';
        sphere.style.transform = '';
      }
    });
    window.requestAnimationFrame(function () {
      var target = chatDock;
      var widthTarget = chatDock;
      if (!target || !widthTarget) return;
      var dockRect = dock.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var center = (targetRect.left + (targetRect.width / 2)) - dockRect.left;
      var width = widthTarget.getBoundingClientRect().width;
      dock.style.setProperty('--wg-chat-panel-anchor', center + 'px');
      dock.style.setProperty('--wg-chat-panel-width', width + 'px');
    });
    if (nextOpen) {
      closeRevealTimer = setTimeout(function () {
        closeButton.focus({ preventScroll: true });
      }, 420);
    } else {
      chatInput.blur();
    }
  }

  function toggleChat(forceState) {
    var nextState = typeof forceState === 'boolean' ? forceState : !isChatOpen;
    if (nextState === isChatOpen) return;
    setChatOpen(nextState);
    if (nextState) {
      window.requestAnimationFrame(function () {
        chatInput.focus({ preventScroll: true });
      });
    }
  }

  function clearChat() {
    chatHistory = [];
    sessionStorage.removeItem(HISTORY_KEY);
    messagesEl.innerHTML = '';
    isConversationClosed = false;
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.placeholder = 'Ask about systems thinking, AI, XR, lending...';
    updateTooltipCopy();
  }

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      chatHistory = JSON.parse(raw);
      chatHistory.forEach(renderMessage);
    } catch (error) {
      console.error('Could not restore chat history', error);
    }
    updateTooltipCopy();
  }

  function ensureGreeting() {
    if (chatHistory.length) return;
    addMessage(
      'assistant',
      'Hi — I can help you explore Sujay’s work. Tell me what skills or problem space you\'re evaluating, and I’ll surface the strongest examples.'
    );
  }

  async function askPortfolio(message) {
    if (isConversationClosed || !message) return;
    addMessage('user', message);
    chatInput.value = '';
    var typingRow = addTypingMessage();
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ message: message })
      });
      var data = await res.json();
      typingRow.remove();
      if (!res.ok) {
        addMessage('assistant', 'Something went wrong.');
        console.error(data);
        return;
      }
      if (data.sessionId) {
        sessionId = data.sessionId;
        localStorage.setItem(SESSION_KEY, sessionId);
      }
      addMessage('assistant', data.answer || '', data.links || []);
      if (data.locked) {
        isConversationClosed = true;
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.placeholder = 'Conversation closed';
      }
    } catch (error) {
      typingRow.remove();
      addMessage('assistant', 'Could not reach the chat service.');
      console.error(error);
    }
  }

  sphere.addEventListener('mouseenter', showTooltip);
  sphere.addEventListener('focus', showTooltip);
  sphere.addEventListener('mouseleave', hideTooltip);
  sphere.addEventListener('blur', hideTooltip);
  sphere.addEventListener('mouseenter', function () {
    if (dock.classList.contains('is-open')) {
      dock.classList.remove('is-open');
      var statusPanel = dock.querySelector('[data-status-panel]');
      var inlineTrigger = dock.querySelector('[data-opportunity-trigger]');
      if (statusPanel) {
        statusPanel.setAttribute('aria-hidden', 'true');
      }
      opportunityPill.setAttribute('aria-expanded', 'false');
      if (inlineTrigger) {
        inlineTrigger.setAttribute('aria-expanded', 'false');
      }
    }
  });
  sphere.addEventListener('click', function () {
    hideTooltip();
    toggleChat();
  });

  closeButton.addEventListener('click', function () {
    toggleChat(false);
  });

  overlay.addEventListener('click', function () {
    if (dock.classList.contains('is-chat-open')) {
      toggleChat(false);
    }
    if (dock.classList.contains('is-open')) {
      dock.classList.remove('is-open');
      var statusPanel = dock.querySelector('[data-status-panel]');
      var inlineTrigger = dock.querySelector('[data-opportunity-trigger]');
      if (statusPanel) {
        statusPanel.setAttribute('aria-hidden', 'true');
      }
      opportunityPill.setAttribute('aria-expanded', 'false');
      if (inlineTrigger) {
        inlineTrigger.setAttribute('aria-expanded', 'false');
      }
    }
    overlay.classList.remove('is-visible');
  });

  chatForm.addEventListener('submit', function (event) {
    event.preventDefault();
    askPortfolio(chatInput.value.trim());
  });

  chatReset.addEventListener('click', function () {
    clearChat();
    sessionId = makeSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
    ensureGreeting();
  });

  loadHistory();
  ensureGreeting();
  updateDetachedPillShift();
  window.addEventListener('resize', updateDetachedPillShift);
})();


// Work Grid — split reveal
(function () {
  var splitCards = document.querySelectorAll('.wg-card--split-reveal');
  if (!splitCards.length) return;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  splitCards.forEach(function (card) {
    var media = card.querySelector('.wg-card-image-inner');
    var overlay = card.querySelector('.wg-image-overlay');
    if (!media || !overlay) return;

    function update(clientX) {
      var rect = media.getBoundingClientRect();
      var split = clamp(clientX - rect.left, 0, rect.width);
      overlay.style.setProperty('--wg-split-progress', ((split / rect.width) * 100).toFixed(3) + '%');
    }

    card.addEventListener('pointerenter', function (event) {
      update(event.clientX);
    });

    card.addEventListener('pointermove', function (event) {
      update(event.clientX);
    });

    card.addEventListener('pointerleave', function () {
      overlay.style.setProperty('--wg-split-progress', '0%');
    });
  });
})();

// Work Grid — procedural wire sphere
(function () {
  var canvas = document.querySelector('.wg-sphere-canvas');
  if (!canvas) return;

  // ── Configurable parameters ──
  var config = {
    wireCount: 28,
    waveAmp: 0.18,
    waveFreq: 1.0,
    travelSpeed: 1.25,
    phaseWrap: 1.0,
    axisTiltX: 0.4091,
    axisTiltY: 0.0,
    autoRotateZ: 0.08,
    spin: 0.0,
    pinch: 1.6,
    radiusScale: 0.42,
    showSilhouette: false,
    showBackWires: true,
    bodyBlendMode: 'multiply',
    seamBlendMode: 'darken',
    frontLayerBlendMode: 'hard-light',
    blurAmount: 2
  };

  var SIZE = 48;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(SIZE * dpr);
  canvas.height = Math.floor(SIZE * dpr);
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';

  var ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var backCanvas = document.createElement('canvas');
  backCanvas.width = canvas.width;
  backCanvas.height = canvas.height;
  var backCtx = backCanvas.getContext('2d', { alpha: true, desynchronized: true });
  backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var frontCanvas = document.createElement('canvas');
  frontCanvas.width = canvas.width;
  frontCanvas.height = canvas.height;
  var frontCtx = frontCanvas.getContext('2d', { alpha: true, desynchronized: true });
  frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = canvas.width;
  compositeCanvas.height = canvas.height;
  var compositeCtx = compositeCanvas.getContext('2d', { alpha: true, desynchronized: true });
  compositeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var elapsed = 0;
  var lastNow = null;
  var hoverTarget = 0;
  var hoverAmount = 0;
  var autoSpinAngle = 0;
  var autoRotateZAngle = 0;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wrapAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function lerpAngle(from, to, t) { return from + wrapAngle(to - from) * t; }
  function hsla(h, s, l, a) { return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')'; }

  function rotateY(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }
  function rotateZ(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
  }
  function normalize(v) {
    var len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
  function cross(a, b) {
    return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
  }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
  function scale(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; }
  function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
  function project(p, radius, cx, cy) {
    return { x: cx + p.x * radius, y: cy - p.y * radius, z: p.z, p3: p };
  }

  function buildAxisBasis() {
    var tiltedAxis = normalize(
      rotateZ(rotateY({ x: 0, y: 1, z: 0 }, config.axisTiltY), config.axisTiltX + autoRotateZAngle)
    );
    var reference = Math.abs(tiltedAxis.y) < 0.95 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    var b = normalize(cross(reference, tiltedAxis));
    var c = normalize(cross(tiltedAxis, b));
    return { axis: tiltedAxis, b: b, c: c };
  }

  function drawSegment(targetCtx, a, b, strokeStyle, lineWidth, composite) {
    targetCtx.globalCompositeOperation = composite || 'source-over';
    targetCtx.strokeStyle = strokeStyle;
    targetCtx.lineWidth = lineWidth;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.beginPath();
    targetCtx.moveTo(a.x, a.y);
    targetCtx.lineTo(b.x, b.y);
    targetCtx.stroke();
  }

  function drawSphereBody(cx, cy, radius, width, height) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);

    var body = ctx.createRadialGradient(
      cx + radius * 0.28, cy - radius * 0.34, radius * 0.02,
      cx, cy, radius * 1.04
    );
    body.addColorStop(0, 'rgba(22, 62, 86, 0.28)');
    body.addColorStop(0.18, 'rgba(11, 28, 41, 0.36)');
    body.addColorStop(0.56, 'rgba(4, 10, 16, 0.96)');
    body.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
    ctx.fill();

    var spec = ctx.createRadialGradient(
      cx + radius * 0.4, cy - radius * 0.44, 0,
      cx + radius * 0.4, cy - radius * 0.44, radius * 0.24
    );
    spec.addColorStop(0, 'rgba(120, 226, 255, 0.1)');
    spec.addColorStop(0.45, 'rgba(64, 177, 222, 0.04)');
    spec.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.01, 0, Math.PI * 2);
    ctx.fill();

    if (config.showSilhouette) {
      ctx.strokeStyle = 'rgba(98, 226, 255, 0.1)';
      ctx.lineWidth = Math.max(0.75, radius * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function splitAtViewPlane(a, b) {
    if ((a.z >= 0 && b.z >= 0) || (a.z <= 0 && b.z <= 0) || a.z === b.z) {
      return [[a, b]];
    }
    var t = a.z / (a.z - b.z);
    var midP3 = { x: lerp(a.p3.x, b.p3.x, t), y: lerp(a.p3.y, b.p3.y, t), z: 0 };
    var mid = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: 0, p3: midP3 };
    return [[a, mid], [mid, b]];
  }

  function appendRibbonSegments(backSegments, frontSegments, points, baseWidth, hideBack, wireIndex, totalWires) {
    if (points.length < 2) return;
    var lightDir = normalize({ x: 0.72, y: 0.26, z: 1.05 });
    var wireT = totalWires <= 0 ? 0 : wireIndex / totalWires;
    var hueOrbit = 30 * Math.sin(wireT * Math.PI * 2) + 16 * Math.sin(wireT * Math.PI * 6 + 0.85);

    for (var i = 0; i < points.length - 1; i++) {
      var originalA = points[i];
      var originalB = points[i + 1];
      var segmentU = (i + 0.5) / (points.length - 1);
      var lengthEnvelope = Math.pow(Math.sin(segmentU * Math.PI), 1.35);
      var taper = 0.08 + 1.92 * lengthEnvelope;

      var splits = splitAtViewPlane(originalA, originalB);
      for (var si = 0; si < splits.length; si++) {
        var a = splits[si][0], b = splits[si][1];
        var mid3 = normalize({
          x: (a.p3.x + b.p3.x) * 0.5,
          y: (a.p3.y + b.p3.y) * 0.5,
          z: (a.p3.z + b.p3.z) * 0.5
        });
        var depth = (a.z + b.z) * 0.5;
        var visibility = clamp((depth + 1) * 0.5, 0, 1);
        var lit = Math.pow(clamp(dot(mid3, lightDir) * 0.5 + 0.5, 0, 1), 1.35);
        var presence = clamp(0.56 * lit + 0.44 * visibility, 0, 1);
        var coolMix = clamp(
          0.58 * (1 - visibility) + 0.16 * (1 - lit) + 0.16 * Math.abs(mid3.x) +
          0.1 * Math.sin(segmentU * Math.PI * 2 + wireT * Math.PI * 4), 0, 1
        );
        var hue = clamp(lerp(136, 224, coolMix) + hueOrbit, 112, 252);
        var saturation = lerp(82, 100, clamp(0.25 + 0.75 * presence, 0, 1));
        var bodyLight = lerp(34, 60, presence);
        var seamLight = lerp(68, 86, clamp(0.22 + 0.78 * lit, 0, 1));
        var bodyAlpha = 0.5 * lerp(0.84, 1, visibility);
        var seamAlpha = 0.72 * lerp(0.88, 1, visibility);

        if (hideBack && depth < 0) continue;

        var bodyWidth = Math.max(0.34, baseWidth * 1.42 * taper);
        var seamWidth = Math.max(0.2, baseWidth * 0.34 * taper);
        var target = depth < 0 ? backSegments : frontSegments;
        target.push({
          a: a, b: b,
          passes: [
            { strokeStyle: hsla(hue, saturation, bodyLight, bodyAlpha), lineWidth: bodyWidth, composite: config.bodyBlendMode },
            { strokeStyle: hsla(clamp(lerp(hue - 16, 188, 0.22), 108, 236), Math.min(100, saturation * 0.9 + 8), seamLight, seamAlpha), lineWidth: seamWidth, composite: config.seamBlendMode }
          ]
        });
      }
    }
  }

  function drawRibbonSegments(targetCtx, segments) {
    if (!segments.length) return;
    targetCtx.save();
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var j = 0; j < seg.passes.length; j++) {
        var pass = seg.passes[j];
        drawSegment(targetCtx, seg.a, seg.b, pass.strokeStyle, pass.lineWidth, pass.composite);
      }
    }
    targetCtx.restore();
  }

  canvas.addEventListener('pointerenter', function () { hoverTarget = 1; });
  canvas.addEventListener('pointerleave', function () { hoverTarget = 0; });

  function render(now) {
    if (lastNow === null) lastNow = now;
    var dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    elapsed += dt;

    var hoverEase = 1 - Math.exp(-dt * 9);
    hoverAmount = lerp(hoverAmount, hoverTarget, hoverEase);
    var spinMultiplier = 1 - hoverAmount;
    autoSpinAngle += dt * 1.0 * spinMultiplier;
    autoRotateZAngle += dt * config.autoRotateZ * spinMultiplier;

    var width = SIZE, height = SIZE;
    var cx = width / 2, cy = height / 2;
    var radius = Math.min(width, height) * config.radiusScale;

    backCtx.clearRect(0, 0, width, height);
    frontCtx.clearRect(0, 0, width, height);
    compositeCtx.clearRect(0, 0, width, height);

    drawSphereBody(cx, cy, radius, width, height);

    var basis = buildAxisBasis();
    var samples = Math.max(32, Math.min(80, Math.round(radius * 2.4)));
    var strokeWidth = Math.max(1.2, Math.min(3, radius * 0.096));
    var phaseStep = (Math.PI * 2) / config.wireCount;
    var autoSpin = config.spin + autoSpinAngle;
    var leftStackAngle = -Math.PI * 0.5;
    var rightStackAngle = Math.PI * 0.5;
    var wirePhaseStep = (Math.PI * 2 * config.phaseWrap) / config.wireCount;

    var backSegments = [];
    var frontSegments = [];

    for (var i = 0; i < config.wireCount; i++) {
      var baseAlpha = i * phaseStep + autoSpin;
      var relativeToPlane = wrapAngle(baseAlpha);
      var stackTarget = relativeToPlane >= 0 ? rightStackAngle : leftStackAngle;
      var alpha = lerpAngle(baseAlpha, stackTarget, hoverAmount);
      var wirePhase = i * wirePhaseStep;
      var points = [];

      for (var s = 0; s <= samples; s++) {
        var u = s / samples;
        var theta = u * Math.PI;
        var envelope = Math.pow(Math.sin(theta), config.pinch);
        var wave = config.waveAmp * envelope * Math.sin(theta * Math.PI * config.waveFreq - elapsed * config.travelSpeed + wirePhase);
        var radialScale = 1 + wave;
        var radialDir = add(scale(basis.b, Math.cos(alpha)), scale(basis.c, Math.sin(alpha)));
        var point3d = add(scale(basis.axis, Math.cos(theta)), scale(radialDir, Math.sin(theta) * radialScale));
        points.push(project(point3d, radius, cx, cy));
      }

      appendRibbonSegments(backSegments, frontSegments, points, strokeWidth, !config.showBackWires, i, config.wireCount);
    }

    drawRibbonSegments(backCtx, backSegments);
    drawRibbonSegments(frontCtx, frontSegments);

    compositeCtx.save();
    compositeCtx.globalCompositeOperation = 'source-over';
    compositeCtx.drawImage(backCanvas, 0, 0, width, height);
    compositeCtx.globalCompositeOperation = config.frontLayerBlendMode;
    compositeCtx.drawImage(frontCanvas, 0, 0, width, height);
    compositeCtx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    if (config.blurAmount > 0) {
      ctx.filter = 'blur(' + config.blurAmount.toFixed(2) + 'px)';
    }
    ctx.drawImage(compositeCanvas, 0, 0, width, height);
    ctx.restore();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
