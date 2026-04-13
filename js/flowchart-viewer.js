/**
 * Flowchart Viewer — Interactive decision-tree chart component
 */

var FlowchartViewer = (function () {
  'use strict';

  var FONT_MIN = 6, FONT_MAX = 18, FONT_STEP = 1;
  var GAP_MIN  = 8, GAP_MAX  = 40, GAP_STEP  = 4;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var FLOWCHART_KEYBOARD_SCROLL_STEP = 96;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function isVisibleNode(node) {
    return !!(node && node.getClientRects && node.getClientRects().length);
  }

  function getInteractiveNodes(viewer) {
    var nodes = [];
    var scrollArea = viewer.querySelector('.fc-scroll');

    if (isVisibleNode(scrollArea)) {
      nodes.push(scrollArea);
    }

    Array.prototype.forEach.call(
      viewer.querySelectorAll('.fc-tab, .fc-ctrl-btn, .fc-fullscreen-btn'),
      function (node) {
        if (node.disabled || !isVisibleNode(node)) {
          return;
        }
        nodes.push(node);
      }
    );

    return nodes;
  }

  function syncInteractiveTabOrder(viewer) {
    var engaged = !!viewer._fcInteractionActive;
    var scrollArea = viewer.querySelector('.fc-scroll');

    viewer.classList.toggle('is-engaged', engaged);
    viewer.setAttribute(
      'aria-label',
      engaged
        ? 'Mentor Guidance nudge framework. Use Left and Right arrow keys to scroll, Tab to move between flowchart controls, and Escape to exit.'
        : 'Mentor Guidance nudge framework. Press Enter or Space to interact.'
    );

    if (scrollArea) {
      scrollArea.setAttribute('role', 'region');
      scrollArea.setAttribute(
        'aria-label',
        engaged
          ? 'Flowchart canvas. Use Left and Right arrow keys to scroll. Press Escape or Space to exit interaction.'
          : 'Flowchart canvas'
      );
      scrollArea.setAttribute('tabindex', engaged ? '0' : '-1');
    }

    Array.prototype.forEach.call(
      viewer.querySelectorAll('.fc-tab, .fc-ctrl-btn, .fc-fullscreen-btn'),
      function (node) {
        if (engaged) {
          node.removeAttribute('tabindex');
          return;
        }

        node.setAttribute('tabindex', '-1');
      }
    );
  }

  function enterInteractionMode(viewer) {
    var scrollArea = viewer.querySelector('.fc-scroll');

    viewer._fcInteractionActive = true;
    syncInteractiveTabOrder(viewer);

    if (scrollArea) {
      scrollArea.focus({ preventScroll: true });
    }
  }

  function exitInteractionMode(viewer) {
    viewer._fcInteractionActive = false;
    syncInteractiveTabOrder(viewer);
    viewer.focus({ preventScroll: true });
  }

  function moveInteractionFocus(viewer, direction) {
    var nodes = getInteractiveNodes(viewer);
    var currentIndex;

    if (!nodes.length) {
      return;
    }

    currentIndex = nodes.indexOf(document.activeElement);

    if (currentIndex === -1) {
      nodes[direction < 0 ? nodes.length - 1 : 0].focus({ preventScroll: true });
      return;
    }

    currentIndex = (currentIndex + direction + nodes.length) % nodes.length;
    nodes[currentIndex].focus({ preventScroll: true });
  }

  function handleViewerKeydown(event) {
    var viewer = event.currentTarget;
    var scrollArea = viewer.querySelector('.fc-scroll');

    if (!viewer._fcInteractionActive) {
      if (event.target === viewer && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        enterInteractionMode(viewer);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      exitInteractionMode(viewer);
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      moveInteractionFocus(viewer, event.shiftKey ? -1 : 1);
      return;
    }

    if (event.target !== scrollArea) {
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      exitInteractionMode(viewer);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollArea.scrollLeft += FLOWCHART_KEYBOARD_SCROLL_STEP;
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollArea.scrollLeft -= FLOWCHART_KEYBOARD_SCROLL_STEP;
    }
  }

  function getRectWithinGrid(node, grid) {
    var nodeRect = node.getBoundingClientRect();
    var gridRect = grid.getBoundingClientRect();
    return {
      left: nodeRect.left - gridRect.left,
      top: nodeRect.top - gridRect.top,
      width: nodeRect.width,
      height: nodeRect.height
    };
  }

  /* ── Tree utilities ── */
  function countLeaves(node) {
    if (!node.children || !node.children.length) return 1;
    var s = 0;
    for (var i = 0; i < node.children.length; i++) s += countLeaves(node.children[i]);
    return s;
  }

  function getDepth(node) {
    if (!node.children || !node.children.length) return 1;
    var m = 0;
    for (var i = 0; i < node.children.length; i++) m = Math.max(m, getDepth(node.children[i]));
    return 1 + m;
  }

  function flattenTree(root) {
    var placed = [];
    (function walk(node, depth, rowStart) {
      var span = countLeaves(node);
      placed.push({ row: rowStart, col: depth, span: span, label: node.label, color: node.color, sublabel: node.sublabel });
      if (!node.children || !node.children.length) return;
      var off = rowStart;
      for (var i = 0; i < node.children.length; i++) {
        walk(node.children[i], depth + 1, off);
        off += countLeaves(node.children[i]);
      }
    })(root, 0, 0);
    return { placed: placed, totalRows: countLeaves(root), totalCols: getDepth(root) };
  }

  function cardKey(row, col) {
    return row + ':' + col;
  }

  /* ── Connectors ── */
  function collectConnectorEdges(placed, totalCols) {
    var colMap = {};
    var edges = [];

    placed.forEach(function (p) {
      if (!colMap[p.col]) colMap[p.col] = [];
      colMap[p.col].push(p);
    });

    placed.forEach(function (parent) {
      if (parent.col >= totalCols - 1) return;
      var children = (colMap[parent.col + 1] || []).filter(function (c) {
        return c.row >= parent.row && c.row < parent.row + parent.span;
      });
      if (!children.length) return;

      children.forEach(function (child) {
        edges.push({
          path: svgEl('path', { class: 'fc-connector fc-connector--' + parent.color }),
          parentKey: cardKey(parent.row, parent.col),
          childKey: cardKey(child.row, child.col),
          dynamic: parent.span > 1 || child.span > 1
        });
      });
    });

    return edges;
  }

  function buildConnectorLayer(placed, totalCols, grid) {
    var layer = {
      svg: svgEl('svg', { class: 'fc-connectors' }),
      edges: collectConnectorEdges(placed, totalCols)
    };

    layer.edges.forEach(function (edge) {
      layer.svg.appendChild(edge.path);
    });
    grid.appendChild(layer.svg);
    return layer;
  }

  function sizeConnectorSVG(svg, grid) {
    var styles = getComputedStyle(grid);
    var padRight = parseFloat(styles.paddingRight) || 0;
    var padBottom = parseFloat(styles.paddingBottom) || 0;
    var maxRight = 0;
    var maxBottom = 0;

    // Collapse the overlay before measuring so its old size does not keep the
    // grid's scrollable area artificially large after spacing changes.
    svg.setAttribute('width', 0);
    svg.setAttribute('height', 0);
    svg.setAttribute('viewBox', '0 0 0 0');
    svg.style.width = '0px';
    svg.style.height = '0px';

    Array.prototype.forEach.call(grid.children, function (child) {
      var rect;
      if (child === svg) return;
      rect = getRectWithinGrid(child, grid);
      maxRight = Math.max(maxRight, rect.left + rect.width);
      maxBottom = Math.max(maxBottom, rect.top + rect.height);
    });

    var w = Math.max(Math.ceil(maxRight + padRight + 4), grid.clientWidth, 1);
    var h = Math.max(Math.ceil(maxBottom + padBottom + 4), grid.clientHeight, 1);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
  }

  function measureChartLayout(grid) {
    var cardsByKey = {};
    var stickyColumns = {};

    grid.querySelectorAll('.fc-card').forEach(function (card) {
      var row = parseInt(card.getAttribute('data-fc-row'), 10);
      var col = parseInt(card.getAttribute('data-fc-col'), 10);
      var key = cardKey(row, col);
      var rect = getRectWithinGrid(card, grid);
      var sticky = card.getAttribute('data-fc-sticky') === 'true';
      var lane = sticky ? card.parentElement : null;
      var laneRect = lane && lane.classList.contains('fc-card-lane') ? getRectWithinGrid(lane, grid) : null;
      var top = laneRect ? laneRect.top : rect.top;
      var metrics = {
        key: key,
        row: row,
        col: col,
        el: card,
        sticky: sticky,
        left: rect.left,
        right: rect.left + rect.width,
        width: rect.width,
        height: rect.height,
        baseTop: top,
        baseCenterY: top + rect.height / 2,
        currentTop: top,
        currentCenterY: top + rect.height / 2,
        laneTop: laneRect ? laneRect.top : top,
        laneBottom: laneRect ? laneRect.top + laneRect.height : top + rect.height,
        marginBottom: parseFloat(getComputedStyle(card).marginBottom) || 0
      };

      cardsByKey[key] = metrics;
      if (!sticky) return;
      if (!stickyColumns[col]) stickyColumns[col] = [];
      stickyColumns[col].push(metrics);
    });

    Object.keys(stickyColumns).forEach(function (col) {
      stickyColumns[col].sort(function (a, b) {
        return a.row - b.row;
      });
    });

    return {
      cardsByKey: cardsByKey,
      stickyColumns: stickyColumns
    };
  }

  function updateConnectorPath(edge, layout) {
    var parent = layout.cardsByKey[edge.parentKey];
    var child = layout.cardsByKey[edge.childKey];
    var x1;
    var y1;
    var x2;
    var y2;
    var midX;
    var r = 8;
    var path;

    if (!parent || !child) return;

    x1 = parent.right;
    y1 = parent.currentCenterY;
    x2 = child.left;
    y2 = child.currentCenterY;
    midX = (x1 + x2) / 2;

    if (Math.abs(y2 - y1) < 1) {
      path = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
    } else {
      var dy = y2 > y1 ? 1 : -1;
      var ar = Math.min(r, Math.abs(y2 - y1) / 2, Math.abs(midX - x1), Math.abs(x2 - midX));
      path = 'M' + x1 + ',' + y1 +
        'L' + (midX - ar) + ',' + y1 +
        'Q' + midX + ',' + y1 + ' ' + midX + ',' + (y1 + dy * ar) +
        'L' + midX + ',' + (y2 - dy * ar) +
        'Q' + midX + ',' + y2 + ' ' + (midX + ar) + ',' + y2 +
        'L' + x2 + ',' + y2;
    }

    edge.path.setAttribute('d', path);
  }

  function updateConnectorLayer(layer, layout, grid, resizeSvg, dynamicOnly) {
    if (resizeSvg) sizeConnectorSVG(layer.svg, grid);
    layer.edges.forEach(function (edge) {
      if (dynamicOnly && !edge.dynamic) return;
      updateConnectorPath(edge, layout);
    });
  }

  function equalizeCardWidthsByColumn(grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.fc-card'));
    var columns = {};

    cards.forEach(function (card) {
      var col = parseInt(card.getAttribute('data-fc-col'), 10);
      card.style.width = '';
      if (!columns[col]) columns[col] = [];
      columns[col].push(card);
    });

    Object.keys(columns).forEach(function (col) {
      var maxW = 0;

      columns[col].forEach(function (card) {
        maxW = Math.max(maxW, card.offsetWidth);
      });

      columns[col].forEach(function (card) {
        card.style.width = maxW + 'px';
      });
    });
  }

  /* ── Equalize ALL card heights globally ── */
  function equalizeAllCardHeights(grid) {
    var cards = grid.querySelectorAll('.fc-card');
    cards.forEach(function (c) { c.style.minHeight = ''; });
    var maxH = 0;
    cards.forEach(function (c) { if (c.offsetHeight > maxH) maxH = c.offsetHeight; });
    cards.forEach(function (c) { c.style.minHeight = maxH + 'px'; });
  }

  function getLayoutMetrics(viewer) {
    var styles = getComputedStyle(viewer);
    var gap = parseInt(styles.getPropertyValue('--fc-gap')) || 24;
    var headerH = parseInt(styles.getPropertyValue('--fc-header-h')) || 36;
    var headerOffset = parseInt(styles.getPropertyValue('--fc-header-offset')) || 0;
    return {
      gap: gap,
      headerH: headerH,
      headerOffset: headerOffset,
      stickyTop: headerOffset + headerH + gap
    };
  }

  function updateStickyCardTop(grid, stickyTop) {
    var stickyCards = grid.querySelectorAll('.fc-card[data-fc-sticky="true"]');
    stickyCards.forEach(function (card) {
      card.style.top = stickyTop + 'px';
    });
  }

  function updateStickyCardPush(layout, scrollTop, stickyTop, gap) {
    var stickyThreshold = scrollTop + stickyTop;

    Object.keys(layout.stickyColumns).forEach(function (col) {
      var cards = layout.stickyColumns[col];

      cards.forEach(function (card) {
        var maxTop = card.laneBottom - card.height;
        var naturalTop = stickyThreshold > card.laneTop
          ? clamp(stickyThreshold, card.laneTop, maxTop)
          : card.baseTop;

        card.currentTop = naturalTop;
        card.currentCenterY = naturalTop + card.height / 2;
        card._fcNaturalTop = naturalTop;
      });

      for (var i = cards.length - 2; i >= 0; i--) {
        var current = cards[i];
        var next = cards[i + 1];
        var pushedTop;

        if (stickyThreshold <= current.laneTop) continue;

        pushedTop = next.currentTop - (current.height + gap + current.marginBottom);
        if (pushedTop < current.currentTop) {
          current.currentTop = pushedTop;
          current.currentCenterY = pushedTop + current.height / 2;
        }
      }

      cards.forEach(function (card) {
        var shift = card.currentTop - card._fcNaturalTop;
        card.el.style.setProperty('--fc-card-push', shift + 'px');
      });
    });
  }

  /* ── Render ── */
  function renderChart(viewer, tabData) {
    var scroll = viewer.querySelector('.fc-scroll');
    scroll.innerHTML = '';

    var data = flattenTree(tabData.tree);
    var totalCols = Math.max(data.totalCols, tabData.columns.length);
    var metrics = getLayoutMetrics(viewer);

    var grid = el('div', 'fc-grid');
    grid.style.gridTemplateColumns = 'repeat(' + totalCols + ', max-content)';
    grid.style.gridTemplateRows = 'var(--fc-header-h) repeat(' + data.totalRows + ', auto)';

    // Headers
    for (var c = 0; c < totalCols; c++) {
      var hdr = el('div', 'fc-header-cell');
      hdr.textContent = tabData.columns[c] || '';
      hdr.setAttribute('data-fc-col', c);
      hdr.style.gridColumn = (c + 1);
      hdr.style.gridRow = '1';
      grid.appendChild(hdr);
    }

    var gridRowOffset = 2;

    // Cards
    data.placed.forEach(function (p) {
      var card = el('div', 'fc-card fc-card--' + p.color);
      var labelSpan = el('span', 'fc-card-label');
      labelSpan.textContent = p.label;
      card.appendChild(labelSpan);
      card.setAttribute('data-fc-row', p.row);
      card.setAttribute('data-fc-col', p.col);

      if (p.sublabel) {
        card.classList.add('has-sublabel');
        var sub = el('span', 'fc-card-sublabel');
        sub.textContent = p.sublabel;
        card.appendChild(sub);
      }

      // Parent cards (span > 1): wrap in a lane div that fills the grid area
      if (p.span > 1) {
        var lane = el('div', 'fc-card-lane');
        lane.style.gridColumn = (p.col + 1);
        lane.style.gridRow = (p.row + gridRowOffset) + ' / span ' + p.span;
        card.style.position = 'sticky';
        card.style.top = metrics.stickyTop + 'px';
        card.setAttribute('data-fc-sticky', 'true');
        lane.appendChild(card);
        grid.appendChild(lane);
      } else {
        card.style.gridColumn = (p.col + 1);
        card.style.gridRow = (p.row + gridRowOffset) + ' / span ' + p.span;
        grid.appendChild(card);
      }
    });

    var connectorLayer = buildConnectorLayer(data.placed, totalCols, grid);
    scroll.appendChild(grid);

    var rafId = 0;
    var needsFullLayout = false;
    var currentMetrics = metrics;
    var layoutState = null;
    var isDisposed = false;

    function syncChartLayout(fullLayout) {
      if (fullLayout) {
        currentMetrics = getLayoutMetrics(viewer);
        updateStickyCardTop(grid, currentMetrics.stickyTop);
        equalizeCardWidthsByColumn(grid);
        equalizeAllCardHeights(grid);
        layoutState = measureChartLayout(grid);
      }
      if (!layoutState) return;
      updateStickyCardPush(layoutState, scroll.scrollTop, currentMetrics.stickyTop, currentMetrics.gap);
      updateConnectorLayer(connectorLayer, layoutState, grid, fullLayout, !fullLayout);
    }

    function scheduleSync(fullLayout) {
      needsFullLayout = needsFullLayout || !!fullLayout;
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        var shouldRunFullLayout = needsFullLayout;
        rafId = 0;
        needsFullLayout = false;
        syncChartLayout(shouldRunFullLayout);
      });
    }

    function handleScroll() {
      scheduleSync(false);
    }

    scroll.addEventListener('scroll', handleScroll, { passive: true });

    // Layout pass
    requestAnimationFrame(function () {
      scheduleSync(true);
      requestAnimationFrame(function () {
        if (!isDisposed) scheduleSync(true);
      });
    });

    // Resize observer
    var ro = new ResizeObserver(function () {
      scheduleSync(true);
    });
    ro.observe(grid);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!isDisposed) scheduleSync(true);
      });
    }

    viewer._fcCleanup = function () {
      isDisposed = true;
      ro.disconnect();
      scroll.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
    viewer._fcState = {
      redraw: function () {
        scheduleSync(true);
      }
    };
  }

  /* ── Toolbar ── */
  function buildToolbar(viewer, tabs) {
    var toolbar = el('div', 'fc-toolbar');

    var titleEl = el('div', 'fc-toolbar-title');
    titleEl.textContent = 'Mentor Guidance nudge framework: Attendance';
    toolbar.appendChild(titleEl);

    var tabContainer = el('div', 'fc-tabs');
    tabs.forEach(function (tab, i) {
      var btn = el('button', 'fc-tab' + (i === 0 ? ' is-active' : ''));
      btn.type = 'button';
      btn.textContent = tab.label;
      btn.setAttribute('data-fc-tab-id', tab.id);
      btn.setAttribute('aria-label', 'Show ' + tab.label + ' flowchart');
      btn.addEventListener('click', function () {
        tabContainer.querySelectorAll('.fc-tab').forEach(function (t) { t.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (viewer._fcCleanup) viewer._fcCleanup();
        renderChart(viewer, tab);
      });
      tabContainer.appendChild(btn);
    });
    toolbar.appendChild(tabContainer);

    var controls = el('div', 'fc-controls');
    controls.appendChild(buildCtrlGroup(viewer, 'Aa', 'text size', '--fc-card-font-size', 'px', FONT_MIN, FONT_MAX, FONT_STEP));
    controls.appendChild(buildCtrlGroup(viewer, '\u21D4', 'column spacing', '--fc-gap', 'px', GAP_MIN, GAP_MAX, GAP_STEP));

    var fsBtn = el('button', 'fc-fullscreen-btn');
    fsBtn.type = 'button';
    fsBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/></svg>';
    fsBtn.title = 'Toggle fullscreen';
    fsBtn.setAttribute('aria-label', 'Toggle fullscreen');
    fsBtn.addEventListener('click', function () {
      viewer.classList.toggle('is-fullscreen');
      document.body.style.overflow = viewer.classList.contains('is-fullscreen') ? 'hidden' : '';
      triggerRedraw(viewer);
    });
    controls.appendChild(fsBtn);

    toolbar.appendChild(controls);
    viewer.appendChild(toolbar);
  }

  function triggerRedraw(viewer) {
    requestAnimationFrame(function () {
      if (viewer._fcState && viewer._fcState.redraw) {
        viewer._fcState.redraw();
      }
    });
  }

  function buildCtrlGroup(viewer, label, labelText, prop, unit, min, max, step) {
    var group = el('div', 'fc-ctrl-group');
    var lbl = el('span', 'fc-ctrl-label');
    lbl.textContent = label;

    var btnMinus = el('button', 'fc-ctrl-btn');
    btnMinus.type = 'button';
    btnMinus.textContent = '\u2212';
    btnMinus.setAttribute('aria-label', 'Decrease ' + labelText);
    var btnPlus = el('button', 'fc-ctrl-btn');
    btnPlus.type = 'button';
    btnPlus.textContent = '+';
    btnPlus.setAttribute('aria-label', 'Increase ' + labelText);

    function getCurrent() {
      return parseInt(getComputedStyle(viewer).getPropertyValue(prop)) || ((min + max) / 2);
    }

    function syncButtonState(val) {
      btnMinus.disabled = val <= min;
      btnPlus.disabled  = val >= max;
    }

    function update(delta) {
      var val = Math.max(min, Math.min(max, getCurrent() + delta));
      viewer.style.setProperty(prop, val + unit);
      syncButtonState(val);
      triggerRedraw(viewer);
    }

    btnMinus.addEventListener('click', function () { update(-step); });
    btnPlus.addEventListener('click', function ()  { update(step);  });
    syncButtonState(getCurrent());

    group.appendChild(btnMinus);
    group.appendChild(lbl);
    group.appendChild(btnPlus);
    return group;
  }

  /* ── Init ── */
  function init(container) {
    if (!container) return;
    var src = container.getAttribute('data-fc-src');
    if (!src) return;

    container.classList.add('fc-viewer');
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'group');
    container._fcInteractionActive = false;
    container.addEventListener('keydown', handleViewerKeydown);
    syncInteractiveTabOrder(container);

    var scrollArea = el('div', 'fc-scroll');
    scrollArea.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">Loading chart\u2026</div>';
    container.appendChild(scrollArea);
    syncInteractiveTabOrder(container);

    fetch(src)
      .then(function (res) { return res.json(); })
      .then(function (json) {
        container.innerHTML = '';
        var scrollArea = el('div', 'fc-scroll');
        container.appendChild(scrollArea);
        buildToolbar(container, json.tabs);
        container.appendChild(scrollArea);
        renderChart(container, json.tabs[0]);
        syncInteractiveTabOrder(container);
      })
      .catch(function (err) {
        scrollArea.innerHTML = '<div style="padding:40px;text-align:center;color:#c44;">Failed to load chart data.</div>';
        console.error('FlowchartViewer:', err);
      });
  }

  return { init: init };
})();
