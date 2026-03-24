(function () {
  var body = document.body;

  if (!body || !body.classList.contains("case-study-page")) {
    return;
  }

  var desktopQuery = window.matchMedia("(min-width: 768px)");
  var STICKY_TOP = 124;
  var TITLE_PREPUSH_START_DISTANCE = 240;
  var state = {
    enabled: false,
    activeIndex: 0,
    sections: [],
    projectContent: null,
    indexShell: null,
    onIndexClick: null,
    onScroll: null,
    onHashChange: null
  };

  function slugify(text, index) {
    var slug = (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug ? "section-" + slug : "section-" + (index + 1);
  }

  function buildNavMarkup(sections) {
    var basePath = window.location.pathname || "";

    return [
      '<nav class="case-study-index" aria-label="Case study sections">',
      sections.map(function (section, index) {
        return (
          '<a class="case-study-index-item" href="' +
          basePath +
          "#" +
          section.titleId +
          '" data-section-index="' +
          index +
          '">' +
          section.label +
          "</a>"
        );
      }).join(""),
      "</nav>"
    ].join("");
  }

  function syncStickyTop() {
    var stickyTop = 124;

    if (desktopQuery.matches && body.classList.contains("biz2x-page")) {
      var declaredStickyTop = parseFloat(
        window.getComputedStyle(body).getPropertyValue("--biz2x-nav-total-height")
      );

      if (!isNaN(declaredStickyTop) && declaredStickyTop > 0) {
        stickyTop = Math.round(declaredStickyTop);
      }
    } else {
      var nav = document.querySelector(".top-nav");

      if (nav && desktopQuery.matches) {
        stickyTop = Math.round(nav.offsetHeight || nav.getBoundingClientRect().height || stickyTop);
      }
    }

    STICKY_TOP = stickyTop;
    body.style.setProperty("--case-study-sticky-top", stickyTop + "px");
  }

  function updateActiveSection() {
    if (!state.enabled || !state.sections.length) {
      return;
    }

    syncStickyTop();

    var activeIndex = 0;

    state.sections.forEach(function (section, index) {
      var titleNode = section.titleNode;
      var markerTop = titleNode
        ? titleNode.getBoundingClientRect().top
        : section.node.getBoundingClientRect().top;

      if (markerTop <= STICKY_TOP + 2) {
        activeIndex = index;
      }
    });

    state.activeIndex = activeIndex;

    if (!state.indexShell) {
      return;
    }

    var items = state.indexShell.querySelectorAll(".case-study-index-item");
    items.forEach(function (item, index) {
      item.classList.toggle("is-active", index === activeIndex);
    });
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateTitlePrepush() {
    if (!state.enabled || !state.sections.length) {
      return;
    }

    syncStickyTop();

    var stickyTop = STICKY_TOP;
    var startDistance = TITLE_PREPUSH_START_DISTANCE;
    var maxShift = 240;

    state.sections.forEach(function (section, index) {
      var title = section.titleNode;
      var kicker = section.kickerNode;
      var previousSection = state.sections[index - 1];
      var nextSection = state.sections[index + 1];

      if (!title) {
        return;
      }

      var titleTop = title.getBoundingClientRect().top;
      var previousPushProgress = previousSection
        ? clamp(1 - ((section.node.getBoundingClientRect().top - stickyTop) / startDistance), 0, 1)
        : 1;
      var isCurrentOrIncoming = index === state.activeIndex || index === state.activeIndex + 1;
      var showKicker = isCurrentOrIncoming
        && titleTop <= stickyTop + startDistance
        && previousPushProgress > 0;

      if (!nextSection) {
        title.style.setProperty("--section-title-prepush", "0px");

        if (kicker) {
          kicker.style.transition = showKicker ? "opacity 180ms ease, transform 180ms ease" : "none";
          kicker.style.opacity = showKicker ? "1" : "0";
          kicker.style.transform = showKicker ? "translateY(0)" : "translateY(4px)";
        }
        return;
      }

      var nextTop = nextSection.node.getBoundingClientRect().top;
      var distanceToSticky = nextTop - stickyTop;
      var progress = 1 - (distanceToSticky / startDistance);
      var shift = -clamp(progress, 0, 1) * maxShift;

      title.style.setProperty("--section-title-prepush", shift.toFixed(2) + "px");

      if (kicker) {
        kicker.style.transition = showKicker ? "opacity 180ms ease, transform 180ms ease" : "none";
        kicker.style.opacity = showKicker ? "1" : "0";
        kicker.style.transform = showKicker ? "translateY(0)" : "translateY(4px)";
      }
    });
  }

  function enable() {
    if (state.enabled) {
      syncStickyTop();
      updateActiveSection();
      return;
    }

    var projectContent = document.querySelector(".project-content");
    var sections = Array.from(document.querySelectorAll(".project-content .section"));

    if (!projectContent || !sections.length) {
      return;
    }

    state.sections = sections.map(function (section, index) {
      var headline = section.querySelector(".headline");
      var titleNode = section.querySelector(".section-title");
      var label = headline ? headline.textContent.trim() : "Section " + (index + 1);
      var id = section.id || slugify(label, index);
      var titleId = id + "-anchor";
      var kickerNode = null;
      var anchorNode = null;

      if (titleNode) {
        anchorNode = section.querySelector(".section-title-anchor");

        if (!anchorNode) {
          anchorNode = document.createElement("span");
          anchorNode.className = "section-title-anchor";
          titleNode.parentNode.insertBefore(anchorNode, titleNode);
        }

        anchorNode.id = titleId;
        kickerNode = titleNode.querySelector(".section-title-kicker");

        if (!kickerNode) {
          kickerNode = document.createElement("span");
          kickerNode.className = "section-title-kicker";
          kickerNode.textContent = label;
          titleNode.insertBefore(kickerNode, titleNode.firstChild);
        }
      }

      section.id = id;

      return {
        id: id,
        titleId: titleId,
        label: label,
        node: section,
        titleNode: titleNode,
        anchorNode: anchorNode,
        kickerNode: kickerNode
      };
    });

    state.projectContent = projectContent;
    state.indexShell = document.createElement("div");
    state.indexShell.className = "case-study-index-shell";
    state.indexShell.innerHTML = buildNavMarkup(state.sections);
    state.projectContent.insertBefore(state.indexShell, state.projectContent.firstChild);

    body.classList.add("case-study-index-enabled");

    state.onScroll = function () {
      syncStickyTop();
      updateActiveSection();
      updateTitlePrepush();
    };

    state.onIndexClick = function (event) {
      var link = event.target.closest(".case-study-index-item");

      if (!link) {
        return;
      }

      event.preventDefault();

      var href = link.getAttribute("href") || "";
      var hashIndex = href.indexOf("#");
      var id = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";

      if (!id) {
        return;
      }

      if (window.location.hash !== "#" + id) {
        window.history.pushState(null, "", window.location.pathname + "#" + id);
      }

      var target = document.getElementById(id);

      if (target) {
        syncStickyTop();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    };

    state.onHashChange = function () {
      var id = window.location.hash ? window.location.hash.slice(1) : "";

      if (id) {
        window.setTimeout(function () {
          var target = document.getElementById(id);

          if (target) {
            syncStickyTop();
            target.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
          updateActiveSection();
          updateTitlePrepush();
        }, 0);
        return;
      }

      window.setTimeout(function () {
        updateActiveSection();
        updateTitlePrepush();
      }, 0);
    };

    state.indexShell.addEventListener("click", state.onIndexClick);
    window.addEventListener("scroll", state.onScroll, { passive: true });
    window.addEventListener("resize", state.onScroll);
    window.addEventListener("hashchange", state.onHashChange);

    state.enabled = true;
    syncStickyTop();
    updateActiveSection();
    updateTitlePrepush();
  }

  function disable() {
    if (!state.enabled) {
      return;
    }

    if (state.indexShell && state.indexShell.parentNode) {
      state.indexShell.removeEventListener("click", state.onIndexClick);
      state.indexShell.parentNode.removeChild(state.indexShell);
    }

    window.removeEventListener("scroll", state.onScroll);
    window.removeEventListener("resize", state.onScroll);
    window.removeEventListener("hashchange", state.onHashChange);

    body.classList.remove("case-study-index-enabled");
    body.style.removeProperty("--case-study-sticky-top");

    state.enabled = false;
    state.sections = [];
    state.projectContent = null;
    state.indexShell = null;
    state.onIndexClick = null;
    state.onScroll = null;
    state.onHashChange = null;
  }

  function syncMode() {
    if (desktopQuery.matches) {
      enable();
    } else {
      disable();
    }
  }

  if (typeof desktopQuery.addEventListener === "function") {
    desktopQuery.addEventListener("change", syncMode);
  } else if (typeof desktopQuery.addListener === "function") {
    desktopQuery.addListener(syncMode);
  }

  syncMode();
})();
