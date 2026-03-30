(function () {
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

  function initTracking() {
    onReady(function () {
      trackPageContext();
      initSectionTracking();
      initCardTracking();
      initFavoriteTracking();
    });
  }

  function trackPageContext() {
    if (pageType !== 'case_study') {
      return;
    }

    trackOnce('portfolio_case_study_view', pagePath, {
      case_study_name: getCaseStudyName(),
      case_study_title: document.title || ''
    });
  }

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

  function initCardTracking() {
    if (pageType === 'landing') {
      observeImpressions('.folio-hcard-wrap', {
        eventName: 'portfolio_card_view',
        threshold: 0.65,
        getKey: function (node) {
          return 'horizon-card:' + getCardId(node);
        },
        getParams: function (node) {
          return {
            card_id: getCardId(node),
            card_label: getLabelFromNode(node),
            card_type: getHorizonCardType(node),
            card_target: normalizeHref(getCardHref(node))
          };
        }
      });

      return;
    }

    if (pageType === 'work_index') {
      observeImpressions('.Thumbnail-outer-container', {
        eventName: 'portfolio_card_view',
        threshold: 0.6,
        getKey: function (node) {
          return 'work-card:' + getCardId(node);
        },
        getParams: function (node) {
          return {
            card_id: getCardId(node),
            card_label: getLabelFromNode(node),
            card_type: 'work_index_card',
            card_target: normalizeHref(getCardHref(node))
          };
        }
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

  function initFavoriteTracking() {
    if (pageType !== 'landing') {
      return;
    }

    bindClicks('[data-opportunity-favorite]', function (button) {
      var card = button.closest('.folio-hcard-wrap');
      track('portfolio_favorite_click', {
        card_id: card ? getCardId(card) : 'favorite-card',
        card_label: card ? getLabelFromNode(card) : '',
        card_type: card ? getHorizonCardType(card) : 'favorite',
        favorite_selected: button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'
      });
    });
  }

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
      threshold: buildThresholds(threshold)
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
      {
        page_type: pageType
      },
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

  function getPageType() {
    var body = document.body;

    if (body && body.classList.contains('case-study-page')) {
      return 'case_study';
    }

    if (body && body.classList.contains('work-page')) {
      return 'work_index';
    }

    if (document.querySelector('.snap-section')) {
      return 'landing';
    }

    return 'page';
  }

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

  function getCardId(node) {
    var label = getLabelFromNode(node);
    var href = getCardHref(node);
    var dataIndex = node.getAttribute('data-card-index');

    if (href) {
      return slugify(normalizeHref(href));
    }

    if (label) {
      return slugify(label);
    }

    if (dataIndex) {
      return 'card-' + dataIndex;
    }

    return 'card-' + String(indexOfElement(node, node.className ? '.' + String(node.className).split(' ').join('.') : '*') + 1);
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

  function getHorizonCardType(node) {
    if (node.classList.contains('is-opportunity')) {
      return 'opportunity_card';
    }

    if (node.classList.contains('is-info-card')) {
      return 'info_card';
    }

    return 'work_card';
  }

  function buildThresholds(threshold) {
    return [threshold];
  }

  function normalizeHref(href) {
    if (!href) {
      return '';
    }

    if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
      return href;
    }

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
