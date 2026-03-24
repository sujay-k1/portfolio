(function () {
  if (!document.body.classList.contains("biz2x-page")) {
    return;
  }

  var toggleGroup = document.querySelector(".biz2x-video-toggle-group");
  var video = document.querySelector(".biz2x-toggle-video");
  var description = document.querySelector(".biz2x-video-description-text");

  if (!toggleGroup || !video) {
    return;
  }

  var buttons = Array.from(toggleGroup.querySelectorAll(".biz2x-video-toggle"));

  function setActiveButton(activeButton) {
    buttons.forEach(function (button) {
      var isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function switchVideo(button) {
    var source = button.getAttribute("data-video-src");
    var copy = button.getAttribute("data-video-description") || "";

    if (!source || video.getAttribute("src") === source) {
      if (description) {
        description.textContent = copy;
      }
      setActiveButton(button);
      return;
    }

    var wasPlaying = !video.paused;
    video.setAttribute("src", source);
    video.load();

    if (wasPlaying) {
      var playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(function () {});
      }
    }

    if (description) {
      description.textContent = copy;
    }

    setActiveButton(button);
  }

  toggleGroup.addEventListener("click", function (event) {
    var button = event.target.closest(".biz2x-video-toggle");

    if (!button) {
      return;
    }

    switchVideo(button);
  });
})();
