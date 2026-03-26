(function () {
  var userAgent = navigator.userAgent || "";
  var isSafari = /Safari\//.test(userAgent)
    && !/Chrome\//.test(userAgent)
    && !/Chromium\//.test(userAgent)
    && !/CriOS\//.test(userAgent)
    && !/Android/.test(userAgent);

  if (isSafari) {
    return;
  }

  var phrases = Array.from(document.querySelectorAll(".scroll-fill"));
  if (!phrases.length) {
    return;
  }

  var targets = [];

  function parseColor(value) {
    var normalized = (value || "").trim();
    var hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    var match = normalized.match(/^rgba?\(([^)]+)\)$/i);

    if (hexMatch) {
      var hex = hexMatch[1];

      if (hex.length === 3) {
        return hex.split("").map(function (char) {
          return parseInt(char + char, 16);
        });
      }

      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }

    if (!match) {
      return [187, 187, 187];
    }

    return match[1]
      .split(",")
      .slice(0, 3)
      .map(function (channel) {
        return Math.max(0, Math.min(255, parseFloat(channel.trim()) || 0));
      });
  }

  function blendColor(base, accent, progress) {
    return "rgb(" + base.map(function (channel, index) {
      return Math.round(channel + ((accent[index] - channel) * progress));
    }).join(", ") + ")";
  }

  function buildFillText(text, chars) {
    var fragment = document.createDocumentFragment();
    var word = null;
    var words = [];
    var wordStart = 0;
    var wordText = "";

    function flushWord() {
      if (!word) {
        return;
      }
      words.push({
        element: word,
        start: wordStart,
        duration: Math.max(wordText.length, 1)
      });
      fragment.appendChild(word);
      word = null;
      wordStart = 0;
      wordText = "";
    }

    Array.from(text).forEach(function (char) {
      if (char === " " || char === "\n" || char === "\t") {
        flushWord();
        fragment.appendChild(document.createTextNode(char));
        return;
      }

      if (!word) {
        word = document.createElement("span");
        word.className = "scroll-fill-word";
        wordStart = chars.length;
      }

      wordText += char;
      chars.push(char);
      word.textContent = wordText;
    });

    flushWord();
    return {
      fragment: fragment,
      words: words
    };
  }

  function preparePhrase(element) {
    var text = element.textContent || "";
    var chars = [];
    var computedStyle = window.getComputedStyle(element);
    element.textContent = "";
    var built = buildFillText(text, chars);
    element.appendChild(built.fragment);
    return {
      element: element,
      words: built.words,
      baseColor: parseColor(computedStyle.color),
      accentColor: parseColor(
        computedStyle.getPropertyValue("--scroll-fill-accent") || "rgb(158, 131, 199)"
      ),
      duration: Math.max(chars.length, 1)
    };
  }

  function getPhraseProgress(element) {
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    var phraseRect = element.getBoundingClientRect();
    var startLine = viewportHeight * 0.6;
    var endLine = viewportHeight * 0.58;
    var anchor = phraseRect.top + phraseRect.height * 0.5;
    return Math.max(0, Math.min(1, (startLine - anchor) / Math.max(startLine - endLine, 1)));
  }

  function updatePhrase(target) {
    var progress = getPhraseProgress(target.element);
    var localUnits = progress * target.duration;

    target.words.forEach(function (word) {
      var wordProgress = Math.max(0, Math.min(1, (localUnits - word.start) / Math.max(word.duration, 0.0001)));
      word.element.style.setProperty("--scroll-fill-underline-progress", (wordProgress * 100).toFixed(3) + "%");
      word.element.style.color = blendColor(target.baseColor, target.accentColor, wordProgress);
    });
  }

  function updateAllPhrases() {
    targets.forEach(updatePhrase);
  }

  phrases.forEach(function (phrase) {
    targets.push(preparePhrase(phrase));
  });

  window.addEventListener("scroll", updateAllPhrases, { passive: true });
  window.addEventListener("resize", updateAllPhrases);
  updateAllPhrases();
})();
