(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setSplitFromClientX(node, clientX) {
    var rect = node.getBoundingClientRect();
    if (!rect.width) {
      return;
    }
    var split = clamp(clientX - rect.left, 0, rect.width);
    node.style.setProperty("--folio-split-progress", ((split / rect.width) * 100).toFixed(3) + "%");
  }

  function initBannerSplit(node) {
    if (!node) {
      return;
    }

    node.addEventListener("pointermove", function (event) {
      setSplitFromClientX(node, event.clientX);
    });

    node.addEventListener("pointerenter", function (event) {
      setSplitFromClientX(node, event.clientX);
    });

    node.addEventListener("pointerleave", function () {
      node.style.setProperty("--folio-split-progress", "50%");
    });

    node.addEventListener(
      "touchmove",
      function (event) {
        var touch = event.touches && event.touches[0];
        if (!touch) {
          return;
        }
        setSplitFromClientX(node, touch.clientX);
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initBannerSplit(document.querySelector(".saison-omni-banner-split"));
    });
  } else {
    initBannerSplit(document.querySelector(".saison-omni-banner-split"));
  }
})();
