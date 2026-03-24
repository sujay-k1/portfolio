(function () {
  var phrases = Array.from(document.querySelectorAll(".scroll-fill"));
  if (!phrases.length) {
    return;
  }

  var targets = [];

  function buildFillText(text, chars) {
    var fragment = document.createDocumentFragment();
    var word = null;
    var words = [];
    var wordStart = 0;
    var wordEnd = 0;

    function flushWord() {
      if (!word) {
        return;
      }
      words.push({
        element: word,
        start: wordStart,
        duration: Math.max(wordEnd - wordStart, 1)
      });
      fragment.appendChild(word);
      word = null;
      wordStart = 0;
      wordEnd = 0;
    }

    Array.from(text).forEach(function (char) {
      if (char === " " || char === "\n" || char === "\t") {
        if (word) {
          word.appendChild(document.createTextNode("\u00A0"));
          flushWord();
        } else {
          fragment.appendChild(document.createTextNode(char));
        }
        return;
      }

      if (!word) {
        word = document.createElement("span");
        word.className = "scroll-fill-word";
        wordStart = chars.length;
      }

      var wrapper = document.createElement("span");
      wrapper.className = "scroll-fill-char";

      var baseLayer = document.createElement("span");
      baseLayer.className = "scroll-fill-char-layer scroll-fill-char-base";
      baseLayer.textContent = char;

      var accentLayer = document.createElement("span");
      accentLayer.className = "scroll-fill-char-layer scroll-fill-char-accent";
      accentLayer.setAttribute("aria-hidden", "true");
      accentLayer.textContent = char;

      wrapper.append(baseLayer, accentLayer);
      word.appendChild(wrapper);

      var start = chars.length;
      chars.push({
        start: start,
        duration: 1,
        accentFillLayer: accentLayer
      });
      wordEnd = start + 1;
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
    element.textContent = "";
    var built = buildFillText(text, chars);
    element.appendChild(built.fragment);
    return {
      element: element,
      chars: chars,
      words: built.words,
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

    target.chars.forEach(function (char) {
      var fillOpacity = Math.max(0, Math.min(1, (localUnits - char.start) / Math.max(char.duration, 0.0001)));
      char.accentFillLayer.style.opacity = fillOpacity.toFixed(3);
    });

    target.words.forEach(function (word) {
      var wordProgress = Math.max(0, Math.min(1, (localUnits - word.start) / Math.max(word.duration, 0.0001)));
      word.element.style.setProperty("--scroll-fill-underline-progress", (wordProgress * 100).toFixed(3) + "%");
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
