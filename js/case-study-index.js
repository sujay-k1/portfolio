(function () {
  var body = document.body;

  if (!body || !body.classList.contains("case-study-page")) {
    return;
  }

  var desktopQuery = window.matchMedia("(min-width: 1201px), (orientation: landscape)");
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
    onResize: null,
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

  function parseHexColor(value) {
    var hex = (value || "").trim().replace(/^#/, "");

    if (hex.length === 3) {
      hex = hex.split("").map(function (ch) {
        return ch + ch;
      }).join("");
    }

    if (hex.length !== 6) {
      return null;
    }

    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  function parseCssColor(value) {
    var color = (value || "").trim();
    var rgbMatch;

    if (!color) {
      return null;
    }

    if (color.charAt(0) === "#") {
      return parseHexColor(color);
    }

    rgbMatch = color.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgbMatch) {
      return null;
    }

    var channels = rgbMatch[1].split(",").map(function (part) {
      return parseFloat(part.trim());
    });

    if (channels.length < 3 || channels.some(function (channel) { return isNaN(channel); })) {
      return null;
    }

    return {
      r: channels[0],
      g: channels[1],
      b: channels[2]
    };
  }

  function getCaseStudyGradientStops() {
    var styles = window.getComputedStyle(body);
    var topColor = parseCssColor(styles.getPropertyValue("--bg-0")) || parseHexColor("#15101a");
    var bottomColor = parseCssColor(styles.getPropertyValue("--bg-2")) || parseHexColor("#2a2433");

    return {
      top: topColor,
      bottom: bottomColor
    };
  }

  function getGradientColorAtViewportY(y) {
    var stops = getCaseStudyGradientStops();
    var height = Math.max(window.innerHeight - 1, 1);
    var t = clamp(y / height, 0, 1);

    return {
      r: stops.top.r + ((stops.bottom.r - stops.top.r) * t),
      g: stops.top.g + ((stops.bottom.g - stops.top.g) * t),
      b: stops.top.b + ((stops.bottom.b - stops.top.b) * t)
    };
  }

  function rgbaString(color, alpha) {
    return "rgba(" +
      Math.round(color.r) + ", " +
      Math.round(color.g) + ", " +
      Math.round(color.b) + ", " +
      alpha + ")";
  }

  function clearStickyTitleBackdrop(section) {
    var title = section && section.titleNode;

    if (!title) {
      return;
    }

    title.style.removeProperty("--section-title-bg-top");
    title.style.removeProperty("--section-title-bg-bottom");
    title.classList.remove("is-stuck");
    section._sectionTitlePinned = false;
  }

  function freezeStickyTitleBackdrop(section) {
    var title = section && section.titleNode;
    var titleRect;
    var beforeStyles;
    var beforeTop;
    var beforeBottom;
    var stripTop;
    var stripBottom;
    var topColor;
    var bottomColor;

    if (!title) {
      return;
    }

    titleRect = title.getBoundingClientRect();
    beforeStyles = window.getComputedStyle(title, "::before");
    beforeTop = parseFloat(beforeStyles.top) || 0;
    beforeBottom = parseFloat(beforeStyles.bottom) || 0;
    stripTop = titleRect.top + beforeTop;
    stripBottom = titleRect.bottom - beforeBottom;
    topColor = getGradientColorAtViewportY(stripTop);
    bottomColor = getGradientColorAtViewportY(stripBottom);

    title.style.setProperty("--section-title-bg-top", rgbaString(topColor, 0.9));
    title.style.setProperty("--section-title-bg-bottom", rgbaString(bottomColor, 0.98));
    title.classList.add("is-stuck");
    section._sectionTitlePinned = true;
  }

  function updateStickyTitleBackdrops(forceRefresh) {
    if (!state.enabled || !state.sections.length) {
      return;
    }

    state.sections.forEach(function (section) {
      var title = section.titleNode;
      var titleRect;
      var stickyOffset;
      var isPinned;

      if (!title) {
        return;
      }

      titleRect = title.getBoundingClientRect();
      stickyOffset = parseFloat(window.getComputedStyle(title).top);
      stickyOffset = isNaN(stickyOffset) ? STICKY_TOP : stickyOffset;
      isPinned = titleRect.top <= stickyOffset + 0.5 && titleRect.bottom > 0;

      if (!isPinned) {
        if (section._sectionTitlePinned) {
          clearStickyTitleBackdrop(section);
        }
        return;
      }

      if (forceRefresh || !section._sectionTitlePinned) {
        freezeStickyTitleBackdrop(section);
      }
    });
  }

  function initMediaViewer() {
    var modal = document.getElementById("myModal");
    var closeButton = modal ? modal.querySelector(".close") : null;
    var modalImage = modal ? (modal.querySelector("#img01") || modal.querySelector("img.modal-content")) : null;
    var modalVideo = null;

    if (!modal || !closeButton || !modalImage) {
      return;
    }

    modal.setAttribute("aria-hidden", "true");
    closeButton.setAttribute("role", "button");
    closeButton.setAttribute("tabindex", "0");
    closeButton.setAttribute("aria-label", "Close media viewer");

    function ensureModalVideo() {
      if (modalVideo) {
        return modalVideo;
      }

      modalVideo = modal.querySelector("#video01");

      if (!modalVideo) {
        modalVideo = document.createElement("video");
        modalVideo.id = "video01";
        modalVideo.className = "modal-content modal-content-video";
        modalVideo.controls = true;
        modalVideo.preload = "metadata";
        modalVideo.setAttribute("playsinline", "");
        modal.insertBefore(modalVideo, closeButton);
      }

      return modalVideo;
    }

    function hideModalImage() {
      modalImage.hidden = true;
      modalImage.style.display = "none";
      modalImage.removeAttribute("src");
      modalImage.alt = "";
    }

    function stopModalVideo() {
      var video = modalVideo || modal.querySelector("#video01");

      if (!video) {
        return;
      }

      video.pause();
      video.hidden = true;
      video.style.display = "none";
      video.removeAttribute("src");
      video.removeAttribute("aria-label");
      video.load();
    }

    function openModalShell() {
      modal.style.display = "flex";
      modal.setAttribute("aria-hidden", "false");
    }

    function closeMediaViewer() {
      hideModalImage();
      stopModalVideo();
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
    }

    function openImageViewer(node) {
      var source = node.currentSrc || node.getAttribute("src");
      var alt = node.getAttribute("alt") || node.getAttribute("aria-label") || "";

      if (!source) {
        return;
      }

      stopModalVideo();
      modalImage.src = source;
      modalImage.alt = alt;
      modalImage.hidden = false;
      modalImage.style.display = "block";
      openModalShell();
    }

    function openVideoViewer(node) {
      var video = ensureModalVideo();
      var source = node.currentSrc || node.getAttribute("src");
      var label = node.getAttribute("aria-label") || node.textContent || "";

      if (!source) {
        return;
      }

      hideModalImage();
      video.src = source;
      video.loop = !!node.loop;
      video.muted = !!node.muted;
      video.hidden = false;
      video.style.display = "block";

      if (label) {
        video.setAttribute("aria-label", label.trim());
      }

      openModalShell();

      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {});
      }
    }

    function openMediaViewer(node) {
      if (!node) {
        return;
      }

      if (node.tagName && node.tagName.toLowerCase() === "video") {
        openVideoViewer(node);
        return;
      }

      openImageViewer(node);
    }

    Array.from(document.querySelectorAll(".modal-image")).forEach(function (node) {
      node.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        openMediaViewer(node);
      };
    });

    closeButton.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeMediaViewer();
    };

    closeButton.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closeMediaViewer();
      }
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeMediaViewer();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.style.display === "flex") {
        closeMediaViewer();
      }
    });
  }

  function prepareSections() {
    var projectContent = document.querySelector(".project-content");
    var sections = Array.from(document.querySelectorAll(".project-content .section"));

    if (!projectContent || !sections.length) {
      return null;
    }

    return {
      projectContent: projectContent,
      sections: sections.map(function (section, index) {
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
          kickerNode: kickerNode,
          _sectionTitlePinned: false
        };
      })
    };
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
      updateTitlePrepush();
      updateStickyTitleBackdrops(true);
      return;
    }

    var prepared = prepareSections();

    if (!prepared) {
      return;
    }

    state.sections = prepared.sections;
    state.projectContent = prepared.projectContent;
    state.indexShell = document.createElement("div");
    state.indexShell.className = "case-study-index-shell";
    state.indexShell.innerHTML = buildNavMarkup(state.sections);
    state.projectContent.insertBefore(state.indexShell, state.projectContent.firstChild);

    body.classList.add("case-study-index-enabled");

    state.onScroll = function () {
      syncStickyTop();
      updateActiveSection();
      updateTitlePrepush();
      updateStickyTitleBackdrops(false);
    };

    state.onResize = function () {
      syncStickyTop();
      updateActiveSection();
      updateTitlePrepush();
      updateStickyTitleBackdrops(true);
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
          updateStickyTitleBackdrops(true);
        }, 0);
        return;
      }

      window.setTimeout(function () {
        updateActiveSection();
        updateTitlePrepush();
        updateStickyTitleBackdrops(true);
      }, 0);
    };

    state.indexShell.addEventListener("click", state.onIndexClick);
    window.addEventListener("scroll", state.onScroll, { passive: true });
    window.addEventListener("resize", state.onResize);
    window.addEventListener("hashchange", state.onHashChange);

    state.enabled = true;
    syncStickyTop();
    updateActiveSection();
    updateTitlePrepush();
    updateStickyTitleBackdrops(true);
  }

  function disable() {
    if (!state.enabled) {
      return;
    }

    state.sections.forEach(function (section) {
      clearStickyTitleBackdrop(section);
    });

    if (state.indexShell && state.indexShell.parentNode) {
      state.indexShell.removeEventListener("click", state.onIndexClick);
      state.indexShell.parentNode.removeChild(state.indexShell);
    }

    window.removeEventListener("scroll", state.onScroll);
    window.removeEventListener("resize", state.onResize);
    window.removeEventListener("hashchange", state.onHashChange);

    body.classList.remove("case-study-index-enabled");
    body.style.removeProperty("--case-study-sticky-top");

    state.enabled = false;
    state.sections = [];
    state.projectContent = null;
    state.indexShell = null;
    state.onIndexClick = null;
    state.onScroll = null;
    state.onResize = null;
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

  initMediaViewer();
  prepareSections();
  syncMode();
})();
