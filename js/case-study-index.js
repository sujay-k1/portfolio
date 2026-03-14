(function () {
  var body = document.body;

  if (!body || !body.classList.contains("case-study-page")) {
    return;
  }

  var desktopQuery = window.matchMedia("(min-width: 768px)");
  var state = {
    enabled: false,
    sections: [],
    projectContent: null,
    indexShell: null,
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
    return [
      '<nav class="case-study-index" aria-label="Case study sections">',
      sections.map(function (section, index) {
        return (
          '<a class="case-study-index-item" href="#' +
          section.id +
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

  function updateActiveSection() {
    if (!state.enabled || !state.sections.length) {
      return;
    }

    var marker = 140;
    var activeIndex = 0;

    state.sections.forEach(function (section, index) {
      if (section.node.getBoundingClientRect().top <= marker) {
        activeIndex = index;
      }
    });

    if (!state.indexShell) {
      return;
    }

    var items = state.indexShell.querySelectorAll(".case-study-index-item");
    items.forEach(function (item, index) {
      item.classList.toggle("is-active", index === activeIndex);
    });
  }

  function enable() {
    if (state.enabled) {
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
      var label = headline ? headline.textContent.trim() : "Section " + (index + 1);
      var id = section.id || slugify(label, index);
      section.id = id;

      return {
        id: id,
        label: label,
        node: section
      };
    });

    state.projectContent = projectContent;
    state.indexShell = document.createElement("div");
    state.indexShell.className = "case-study-index-shell";
    state.indexShell.innerHTML = buildNavMarkup(state.sections);
    state.projectContent.insertBefore(state.indexShell, state.projectContent.firstChild);

    body.classList.add("case-study-index-enabled");

    state.onScroll = function () {
      updateActiveSection();
    };

    state.onHashChange = function () {
      window.setTimeout(updateActiveSection, 0);
    };

    window.addEventListener("scroll", state.onScroll, { passive: true });
    window.addEventListener("resize", state.onScroll);
    window.addEventListener("hashchange", state.onHashChange);

    state.enabled = true;
    updateActiveSection();
  }

  function disable() {
    if (!state.enabled) {
      return;
    }

    if (state.indexShell && state.indexShell.parentNode) {
      state.indexShell.parentNode.removeChild(state.indexShell);
    }

    window.removeEventListener("scroll", state.onScroll);
    window.removeEventListener("resize", state.onScroll);
    window.removeEventListener("hashchange", state.onHashChange);

    body.classList.remove("case-study-index-enabled");

    state.enabled = false;
    state.sections = [];
    state.projectContent = null;
    state.indexShell = null;
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
