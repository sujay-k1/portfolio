/* mc-delivery-row.js
   Sizes the guide-wrap so its width = loops height × guide aspect ratio.
   Loops define the row height; guide matches it. When the loops container
   would shrink below 20% of the guide's computed width, the row stacks. */
(function () {
  var row = document.querySelector(".mc-delivery-row");
  if (!row) return;

  var loops = row.querySelector(".mc-delivery-row__loops");
  var guideWrap = row.querySelector(".mc-delivery-row__guide-wrap");
  var guideImg = guideWrap && guideWrap.querySelector("img.mc-delivery-row__guide");
  if (!loops || !guideWrap || !guideImg) return;

  var GUIDE_RATIO_FALLBACK = 711 / 572;
  var MIN_LOOPS_FRACTION = 0.20; // stack if loops < 20% of guide width
  var updating = false;

  function update() {
    if (updating) return;
    updating = true;

    // Hide guide so it doesn't influence the row height
    guideWrap.style.display = "none";

    // Measure loops at their natural height (loops define the row)
    var loopsHeight = loops.offsetHeight;
    var guideRatio =
      guideImg.naturalWidth && guideImg.naturalHeight
        ? guideImg.naturalWidth / guideImg.naturalHeight
        : GUIDE_RATIO_FALLBACK;
    var guideWidth = Math.round(loopsHeight * guideRatio);
    var gap = 16;
    var availableForLoops = row.offsetWidth - guideWidth - gap;

    // If loops would be too narrow, stack vertically (clear inline styles)
    if (availableForLoops < guideWidth * MIN_LOOPS_FRACTION) {
      guideWrap.style.display = "";
      guideWrap.style.width = "";
      guideWrap.style.height = "";
      updating = false;
      return;
    }

    // Set explicit dimensions so the guide matches the loops height
    guideWrap.style.width = guideWidth + "px";
    guideWrap.style.height = loopsHeight + "px";
    guideWrap.style.display = "";

    updating = false;
  }

  // Run on load, resize, and when guide image loads
  if (guideImg.complete) {
    update();
  } else {
    guideImg.addEventListener("load", update, { once: true });
  }

  window.addEventListener("resize", update);

  if (typeof ResizeObserver === "function") {
    var ro = new ResizeObserver(update);
    ro.observe(loops);
  }
})();
