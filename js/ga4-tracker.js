(function () {
  // ─── Self-exclusion ──────────────────────────────────────────────────────────
  // Visit /?internal=1 once on any device to permanently exclude it from tracking.
  // Visit /?internal=0 to clear the flag and restore tracking.
  if (/[?&]internal=0/.test(location.search)) {
    localStorage.removeItem('ga_internal');
  }
  if (/[?&]internal=1/.test(location.search)) {
    localStorage.setItem('ga_internal', '1');
  }
  if (localStorage.getItem('ga_internal') === '1') {
    return;
  }

  // ─── Init ────────────────────────────────────────────────────────────────────
  var config = window.GA4_CONFIG || {};
  var measurementId = String(config.measurementId || '').trim();
  var measurementIdPattern = /^G-[A-Z0-9]+$/i;
  var pagePath = normalizePath(window.location.pathname || '/');
  var pageType = getPageType();
  var observedNodes = new WeakSet();
  var firedEvents = new Set();

  if (!measurementIdPattern.test(measurementId)) {
    return;
  }

  bootstrapGoogleTag();
  initTracking();

  // ─── Bootstrap ───────────────────────────────────────────────────────────────
  function bootstrapGoogleTag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    if (!document.querySelector('script[data-ga4-loader="true"]')) {
      var tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      tag.setAttribute('data-ga4-loader', 'true');
      document.head.appendChild(tag);
    }

    window.gtag('js', new Date());

    var configOptions = {
      send_page_view: config.autoPageView !== false
    };

    if (config.debugMode) {
      configOptions.debug_mode = true;
    }

    window.gtag('config', measurementId, configOptions);
  }

  // ─── Tracking init ───────────────────────────────────────────────────────────
  function initTracking() {
    onReady(function () {
      trackPageContext();
      initSectionTracking();
      initCardTracking();
      initChatTracking();
      initContactTracking();
      initClosingTracking();
      initScrollDepthTracking();
      initFavoriteTracking();
    });
  }

  // ─── Page context ────────────────────────────────────────────────────────────
  function trackPageContext() {
    if (pageType !== 'case_study') {
      return;
    }

    trackOnce('portfolio_case_study_view', pagePath, {
      case_study_name: getCaseStudyName(),
      case_study_title: document.title || ''
    });
  }

  // ─── Section tracking ────────────────────────────────────────────────────────
  function initSectionTracking() {
    if (pageType === 'landing') {
      observeImpressions('.snap-section[data-section]', {
        eventName: 'portfolio_section_view',
        threshold: 0.55,
        getKey: function (node) {
          return 'landing-section:' + getLandingSectionId(node);
        },
        getParams: function (node) {
          return {
            section_id: getLandingSectionId(node),
            section_label: getLabelFromNode(node),
            section_role: String(node.getAttribute('data-section-role') || '')
          };
        }
      });

      observeImpressions('.section2-card', {
        eventName: 'portfolio_card_view',
        threshold: 0.65,
        getKey: function (node) {
          return 'section2-card:' + getCardId(node);
        },
        getParams: function (node) {
          return {
            card_id: getCardId(node),
            card_label: getLabelFromNode(node),
            card_type: 'principle_card'
          };
        }
      });

      return;
    }

    if (pageType === 'case_study') {
      observeImpressions('.section', {
        eventName: 'portfolio_section_view',
        threshold: 0.4,
        getKey: function (node) {
          return 'case-study-section:' + getCaseStudySectionId(node);
        },
        getParams: function (node) {
          return {
            section_id: getCaseStudySectionId(node),
            section_label: getCaseStudySectionLabel(node),
            case_study_name: getCaseStudyName()
          };
        }
      });
    }
  }

  // ─── Card tracking ───────────────────────────────────────────────────────────
  function initCardTracking() {
    if (pageType === 'landing') {
      // Work grid cards
      observeImpressions('.wg-card', {
        eventName: 'portfolio_card_view',
        threshold: 0.5,
        getKey: function (node) {
          return 'wg-card:' + getWgCardId(node);
        },
        getParams: function (node) {
          return {
            card_id: getWgCardId(node),
            card_label: getWgCardLabel(node),
            card_type: 'work_card',
            card_target: normalizeHref(node.getAttribute('href') || ''),
            card_tags: String(node.getAttribute('data-tags') || '')
          };
        }
      });

      // Work grid card clicks
      bindClicks('.wg-card', function (card) {
        track('portfolio_card_click', {
          card_id: getWgCardId(card),
          card_label: getWgCardLabel(card),
          card_type: 'work_card',
          card_target: normalizeHref(card.getAttribute('href') || ''),
          card_tags: String(card.getAttribute('data-tags') || '')
        });
      });

      return;
    }

    if (pageType === 'case_study') {
      observeImpressions('.next-case-study-card', {
        eventName: 'portfolio_card_view',
        threshold: 0.7,
        getKey: function (node) {
          return 'next-case-study:' + getCardId(node);
        },
        getParams: function (node) {
          return {
            card_id: getCardId(node),
            card_label: getLabelFromNode(node),
            card_type: 'next_case_study',
            card_target: normalizeHref(getCardHref(node)),
            case_study_name: getCaseStudyName()
          };
        }
      });
    }
  }

  // ─── Chat tracking ───────────────────────────────────────────────────────────
  function initChatTracking() {
    if (pageType !== 'landing') {
      return;
    }

    var messageIndex = 0;
    var pendingPromptType = null; // set when a chip is clicked before submit

    // Open
    bindClicks('[data-chat-sphere]', function () {
      track('portfolio_chat_open', {});
    });

    // Close
    bindClicks('[data-chat-close]', function () {
      track('portfolio_chat_close', {});
    });

    // Starter chip clicks — mark prompt type and also fire a chip event
    watchForNewNodes('.portfolio-chat__starter-chip', function (chip) {
      if (chip.getAttribute('data-ga-chat-bound') === 'true') {
        return;
      }
      chip.setAttribute('data-ga-chat-bound', 'true');
      chip.addEventListener('click', function () {
        pendingPromptType = 'starter';
        track('portfolio_chat_starter_click', {
          prompt_text: cleanText(chip.textContent).slice(0, 100)
        });
      });
    });

    // Follow-up chip clicks — mark prompt type and fire a chip event
    watchForNewNodes('.portfolio-chat__follow-up-chip', function (chip) {
      if (chip.getAttribute('data-ga-chat-bound') === 'true') {
        return;
      }
      chip.setAttribute('data-ga-chat-bound', 'true');
      chip.addEventListener('click', function () {
        pendingPromptType = 'follow_up';
        track('portfolio_chat_followup_click', {
          prompt_text: cleanText(chip.textContent).slice(0, 100)
        });
      });
    });

    // Message send
    var form = document.getElementById('chat-form');
    var input = document.getElementById('chat-input');

    if (form && input) {
      form.addEventListener('submit', function () {
        var text = cleanText(input.value || '');
        if (!text) {
          return;
        }

        messageIndex += 1;

        var promptType = pendingPromptType || 'custom';
        pendingPromptType = null;

        track('portfolio_chat_message_sent', {
          message_preview: text.slice(0, 100),
          keywords: extractKeywords(text),
          message_length: getMessageLength(text),
          prompt_type: promptType,
          message_index: messageIndex
        });
      });
    }
  }

  // ─── Contact tracking ────────────────────────────────────────────────────────
  function initContactTracking() {
    if (pageType !== 'landing') {
      return;
    }

    bindClicks('.wg-status-panel-icon', function (link) {
      track('portfolio_contact_click', {
        contact_type: getContactType(link),
        contact_label: cleanText(link.getAttribute('aria-label') || '').slice(0, 100)
      });
    });
  }

  // ─── Closing note tracking ───────────────────────────────────────────────────
  function initClosingTracking() {
    if (pageType !== 'landing') {
      return;
    }

    bindClicks('.wg-closing', function () {
      track('portfolio_closing_click', {});
    });
  }

  // ─── Favorite / heart tracking ──────────────────────────────────────────────
  function initFavoriteTracking() {
    // Home page: the status-panel heart button
    if (pageType === 'landing') {
      bindClicks('[data-status-favorite]', function (btn) {
        // aria-pressed reflects the state *before* work-grid.js toggles it
        var willBeSelected = btn.getAttribute('aria-pressed') !== 'true';
        track('portfolio_favorite_click', {
          favorite_selected: willBeSelected ? 'true' : 'false',
          location: 'status_panel'
        });
      });
    }

    // Case study pages: heart widget dispatches a custom event
    if (pageType === 'case_study') {
      document.addEventListener('cs:heart:click', function (e) {
        track('portfolio_favorite_click', {
          case_study_name: getCaseStudyName(),
          favorite_selected: e.detail && e.detail.selected ? 'true' : 'false',
          location: 'case_study_heart'
        });
      });
    }
  }

  // ─── Scroll depth tracking ───────────────────────────────────────────────────
  function initScrollDepthTracking() {
    if (pageType !== 'personal_story') {
      return;
    }

    var milestones = [25, 50, 75, 100];
    var fired = {};

    function getScrollPct() {
      var el = document.documentElement;
      var scrollTop = window.pageYOffset || el.scrollTop || 0;
      var maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) {
        return 100;
      }
      return Math.min(100, Math.round((scrollTop / maxScroll) * 100));
    }

    function onScroll() {
      var pct = getScrollPct();
      milestones.forEach(function (milestone) {
        if (!fired[milestone] && pct >= milestone) {
          fired[milestone] = true;
          trackOnce('portfolio_scroll_depth', 'personal-story-' + milestone, {
            depth_pct: milestone,
            depth_label: milestone + '%'
          });
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Check on load in case the page is short
    onScroll();
  }

  // ─── Impression observer ─────────────────────────────────────────────────────
  function observeImpressions(selector, options) {
    var threshold = typeof options.threshold === 'number' ? options.threshold : 0.6;

    if (!('IntersectionObserver' in window)) {
      findAll(selector).forEach(function (node) {
        fireForNode(node, options);
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < threshold) {
          return;
        }
        fireForNode(entry.target, options);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: [threshold]
    });

    function register(node) {
      if (!node || observedNodes.has(node)) {
        return;
      }
      observedNodes.add(node);
      observer.observe(node);
    }

    scanExisting(selector, register);
    watchForNewNodes(selector, register);
  }

  function fireForNode(node, options) {
    var key = options.getKey(node);
    if (!key) {
      return;
    }
    trackOnce(options.eventName, key, options.getParams(node));
  }

  // ─── DOM helpers ─────────────────────────────────────────────────────────────
  function bindClicks(selector, handler) {
    function register(node) {
      if (!node || node.getAttribute('data-ga-click-bound') === 'true') {
        return;
      }
      node.setAttribute('data-ga-click-bound', 'true');
      node.addEventListener('click', function () {
        handler(node);
      });
    }

    scanExisting(selector, register);
    watchForNewNodes(selector, register);
  }

  function scanExisting(selector, register) {
    findAll(selector).forEach(function (node) {
      register(node);
    });
  }

  function watchForNewNodes(selector, register) {
    if (!document.body) {
      return;
    }

    var mutationObserver = new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (addedNode) {
          if (!addedNode || addedNode.nodeType !== 1) {
            return;
          }

          if (matchesSelector(addedNode, selector)) {
            register(addedNode);
          }

          findAll(selector, addedNode).forEach(function (node) {
            register(node);
          });
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ─── Core track ──────────────────────────────────────────────────────────────
  function trackOnce(eventName, key, params) {
    var cacheKey = eventName + '::' + key;
    if (firedEvents.has(cacheKey)) {
      return;
    }
    firedEvents.add(cacheKey);
    track(eventName, params);
  }

  function track(eventName, params) {
    if (typeof window.gtag !== 'function') {
      return;
    }

    var eventParams = Object.assign(
      { page_type: pageType },
      sanitizeParams(params || {})
    );

    if (config.debugMode) {
      eventParams.debug_mode = true;
    }

    window.gtag('event', eventName, eventParams);
  }

  function sanitizeParams(params) {
    var output = {};
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') {
        return;
      }
      output[key] = typeof value === 'string' ? value.slice(0, 100) : value;
    });
    return output;
  }

  // ─── Keyword extraction ──────────────────────────────────────────────────────
  var STOPWORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','it','be','as','this','that','which','were','was','are','have',
    'has','had','do','does','did','so','if','then','than','when','where','what',
    'how','who','will','would','could','should','may','might','can','not','no',
    'my','your','his','her','its','our','their','i','you','he','she','we','they',
    'me','him','us','them','about','into','up','out','more','some','any','all',
    'just','like','also','been','get','got','let','make','need','see','know',
    'tell','use','want','give','take','come','go','say','look','think','feel',
    'work','try','ask','show','find','call','here','there','now','very','much',
    'only','even','back','well','still','since','after','before','over',
    'between','same','other','each','most','own','such','good','long','first',
    'last','few','new','old','big','small','right','next','early','did','am',
    'its','re','ve','ll','don','didn','doesn','isn','wasn','weren','haven',
    'can','yes','hi','hey','hello','please','thanks','thank'
  ]);

  function extractKeywords(text) {
    var words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(function (w) {
        return w.length > 2 && !STOPWORDS.has(w);
      });

    // Deduplicate while preserving order
    var seen = {};
    var unique = [];
    words.forEach(function (w) {
      if (!seen[w]) {
        seen[w] = true;
        unique.push(w);
      }
    });

    return unique.slice(0, 5).join(',');
  }

  function getMessageLength(text) {
    var len = text.length;
    if (len < 30) return 'short';
    if (len <= 100) return 'medium';
    return 'long';
  }

  // ─── Page type detection ─────────────────────────────────────────────────────
  function getPageType() {
    // Check path first — personal-story body has case-study-page class (incorrect)
    if (pagePath === '/personal-story' || pagePath.indexOf('/personal-story') === 0) {
      return 'personal_story';
    }

    var body = document.body;

    if (body && body.classList.contains('case-study-page')) {
      return 'case_study';
    }

    if (document.querySelector('.snap-section')) {
      return 'landing';
    }

    return 'page';
  }

  // ─── Label / ID helpers ──────────────────────────────────────────────────────
  function getCaseStudyName() {
    var pathParts = pagePath.split('/').filter(Boolean);
    var lastPathPart = pathParts[pathParts.length - 1] || 'case-study';
    return slugify(lastPathPart);
  }

  function getLandingSectionId(node) {
    var sectionValue = String(node.getAttribute('data-section') || '').trim();
    var sectionRole = String(node.getAttribute('data-section-role') || '').trim();

    if (sectionRole) {
      return slugify(sectionRole);
    }
    if (sectionValue) {
      return 'section-' + slugify(sectionValue);
    }
    return slugify(getLabelFromNode(node) || 'landing-section');
  }

  function getCaseStudySectionId(node) {
    var heading = node.querySelector('.headline, .section-title, h2, h3');
    if (heading && heading.textContent) {
      return slugify(heading.textContent);
    }
    return 'section-' + String(indexOfElement(node, '.section') + 1);
  }

  function getCaseStudySectionLabel(node) {
    var heading = node.querySelector('.headline, .section-title, h2, h3');
    return heading ? cleanText(heading.textContent) : '';
  }

  function getWgCardId(node) {
    var href = node.getAttribute('href') || '';
    if (href) {
      return slugify(normalizeHref(href));
    }
    return slugify(getWgCardLabel(node) || 'card');
  }

  function getWgCardLabel(node) {
    var statement = node.querySelector('.wg-card-statement');
    if (statement && statement.textContent) {
      return cleanText(statement.textContent);
    }
    // Fall back to project name from href
    var href = node.getAttribute('href') || '';
    var parts = href.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  function getCardId(node) {
    var label = getLabelFromNode(node);
    var href = getCardHref(node);
    var dataIndex = node.getAttribute('data-card-index');

    if (href) return slugify(normalizeHref(href));
    if (label) return slugify(label);
    if (dataIndex) return 'card-' + dataIndex;
    return 'card-unknown';
  }

  function getLabelFromNode(node) {
    var explicitLabel = node.getAttribute('aria-label') || '';
    if (cleanText(explicitLabel)) {
      return cleanText(explicitLabel);
    }

    var labelNode = node.querySelector(
      '.next-case-study-title, .body-text, .headline, .section-title, h1, h2, h3, p'
    );
    if (labelNode && labelNode.textContent) {
      return cleanText(labelNode.textContent);
    }

    var img = node.querySelector('img[alt]');
    if (img) {
      return cleanText(img.getAttribute('alt'));
    }

    return cleanText(node.textContent || '');
  }

  function getCardHref(node) {
    if (node.hasAttribute('data-href')) {
      return node.getAttribute('data-href') || '';
    }
    if (node.tagName && node.tagName.toLowerCase() === 'a') {
      return node.getAttribute('href') || '';
    }
    var anchor = node.querySelector('a[href]');
    return anchor ? anchor.getAttribute('href') || '' : '';
  }

  function getContactType(link) {
    var href = link.getAttribute('href') || '';
    var label = (link.getAttribute('aria-label') || '').toLowerCase();

    if (href.indexOf('linkedin') !== -1 || label.indexOf('linkedin') !== -1) return 'linkedin';
    if (href.indexOf('mailto:') === 0 || label.indexOf('email') !== -1) return 'email';
    if (href.indexOf('tel:') === 0 || label.indexOf('call') !== -1) return 'phone';
    if (href.indexOf('github') !== -1 || label.indexOf('github') !== -1) return 'github';
    return 'other';
  }

  // ─── Path / text utils ───────────────────────────────────────────────────────
  function normalizeHref(href) {
    if (!href) return '';
    if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
    return normalizePath(href);
  }

  function normalizePath(pathname) {
    var normalized = pathname || '/';
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    if (normalized.endsWith('/index.html')) {
      normalized = normalized.slice(0, -11);
    }
    return normalized || '/';
  }

  function indexOfElement(node, selector) {
    var all = findAll(selector);
    return Math.max(0, all.indexOf(node));
  }

  function findAll(selector, root) {
    var base = root && root.querySelectorAll ? root : document;
    return Array.prototype.slice.call(base.querySelectorAll(selector));
  }

  function matchesSelector(node, selector) {
    var matcher = node.matches || node.webkitMatchesSelector || node.msMatchesSelector;
    return matcher ? matcher.call(node, selector) : false;
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function slugify(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';
  }

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }
})();
