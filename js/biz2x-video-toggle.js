(function () {
  if (!document.body.classList.contains("biz2x-page")) {
    return;
  }

  var toggleShells = Array.from(
    document.querySelectorAll(".biz2x-video-toggle-shell")
  );

  function setActiveButton(buttons, activeButton) {
    buttons.forEach(function (button) {
      var isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function stopVideo(video) {
    if (!video) {
      return;
    }

    video.pause();
    video.currentTime = 0;
  }

  function playVideo(video) {
    if (!video) {
      return;
    }

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(function () {});
    }
  }

  function showNode(node, shouldShow) {
    if (!node) {
      return;
    }

    node.hidden = !shouldShow;
    node.style.display = shouldShow ? "" : "none";
  }

  function updateShell(shell, button) {
    var buttons = Array.from(shell.querySelectorAll(".biz2x-video-toggle"));
    var video = shell.querySelector(".biz2x-toggle-video");
    var image = shell.querySelector(".biz2x-toggle-image");
    var description = shell.querySelector(".biz2x-video-description-text");
    var mediaType = button.getAttribute("data-media-type") || "video";
    var source =
      button.getAttribute("data-media-src") ||
      button.getAttribute("data-video-src") ||
      "";
    var label =
      button.getAttribute("data-media-alt") ||
      button.getAttribute("data-video-alt") ||
      "";
    var copy = button.getAttribute("data-video-description") || "";

    if (description) {
      description.textContent = copy;
    }

    if (mediaType === "image") {
      if (video) {
        stopVideo(video);
        showNode(video, false);
      }

      if (image) {
        if (source && image.getAttribute("src") !== source) {
          image.setAttribute("src", source);
        }
        if (label) {
          image.setAttribute("alt", label);
        }
        showNode(image, true);
      }

      setActiveButton(buttons, button);
      return;
    }

    if (image) {
      showNode(image, false);
    }

    if (video) {
      var currentSource = video.getAttribute("src");
      if (source && currentSource !== source) {
        video.setAttribute("src", source);
        video.load();
      }
      if (label) {
        video.setAttribute("aria-label", label);
        video.textContent = label;
      }
      showNode(video, true);
      playVideo(video);
    }

    setActiveButton(buttons, button);
  }

  toggleShells.forEach(function (shell) {
    var toggleGroup = shell.querySelector(".biz2x-video-toggle-group");
    var activeButton = shell.querySelector(".biz2x-video-toggle.is-active");
    if (!toggleGroup) {
      return;
    }

    if (activeButton) {
      updateShell(shell, activeButton);
    }

    toggleGroup.addEventListener("click", function (event) {
      var button = event.target.closest(".biz2x-video-toggle");

      if (!button || !toggleGroup.contains(button)) {
        return;
      }

      updateShell(shell, button);
    });
  });
})();
