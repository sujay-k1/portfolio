(function () {
  var rotators = Array.prototype.slice.call(
    document.querySelectorAll("[data-mentorconnect-quotes]")
  );

  if (!rotators.length) {
    return;
  }

  function setActive(items, dots, nextIndex) {
    items.forEach(function (item, index) {
      var isActive = index === nextIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    dots.forEach(function (dot, index) {
      var isActive = index === nextIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  rotators.forEach(function (rotator) {
    var items = Array.prototype.slice.call(
      rotator.querySelectorAll("[data-mentorconnect-quote-item]")
    );
    var dots = Array.prototype.slice.call(
      rotator.querySelectorAll("[data-mentorconnect-quote-dot]")
    );
    var activeIndex = Math.max(
      items.findIndex(function (item) {
        return item.classList.contains("is-active");
      }),
      0
    );
    var timerId = 0;

    if (!items.length) {
      return;
    }

    function stopRotation() {
      if (!timerId) {
        return;
      }

      window.clearInterval(timerId);
      timerId = 0;
    }

    function startRotation() {
      stopRotation();

      if (items.length < 2) {
        return;
      }

      timerId = window.setInterval(function () {
        activeIndex = (activeIndex + 1) % items.length;
        setActive(items, dots, activeIndex);
      }, 2500);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        activeIndex = index;
        setActive(items, dots, activeIndex);
        startRotation();
      });
    });

    rotator.addEventListener("mouseenter", stopRotation);
    rotator.addEventListener("mouseleave", startRotation);
    rotator.addEventListener("focusin", stopRotation);
    rotator.addEventListener("focusout", function (event) {
      if (!rotator.contains(event.relatedTarget)) {
        startRotation();
      }
    });

    setActive(items, dots, activeIndex);
    startRotation();
  });
})();
