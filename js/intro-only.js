const introWords = Array.from(document.querySelectorAll('.intro-word')).sort(
  (a, b) => Number(a.dataset.order || 0) - Number(b.dataset.order || 0)
);
const bitcountWords = Array.from(document.querySelectorAll('.intro-word-bitcount'));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function initBitcountLens() {
  if (!bitcountWords.length) {
    return;
  }

  const applyLens = (pointerX, pointerY) => {
    bitcountWords.forEach((word) => {
      const rect = word.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const distance = Math.hypot(pointerX - cx, pointerY - cy);
      const radius = Math.max(rect.width, rect.height) * 1.35;
      const t = clamp(1 - distance / radius, 0, 1);
      const eased = t * t * (3 - 2 * t);
      const wght = 220 + eased * 180; // 220 -> 400
      const elsh = 10 - eased * 10; // 10 -> 0
      word.style.fontVariationSettings = `"wght" ${wght.toFixed(1)}, "ELSH" ${elsh.toFixed(2)}`;
    });
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      applyLens(event.clientX, event.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerleave',
    () => {
      applyLens(window.innerWidth * 0.5, window.innerHeight * 0.5);
    },
    { passive: true }
  );

  applyLens(window.innerWidth * 0.5, window.innerHeight * 0.5);
}

function init() {
  if (!window.gsap || !introWords.length) {
    return;
  }

  gsap.set(introWords, { autoAlpha: 0, y: 14 });
  gsap.to(introWords, {
    autoAlpha: 1,
    y: 0,
    duration: 0.48,
    ease: 'power2.out',
    stagger: 0.07
  });
  initBitcountLens();
}

document.addEventListener('DOMContentLoaded', init);
