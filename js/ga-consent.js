(function () {
  var STORAGE_KEY = 'ga_consent_ack';

  if (localStorage.getItem(STORAGE_KEY)) return;

  var style = document.createElement('style');
  style.textContent = [
    '.ga-consent-banner {',
    '  position: fixed;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: 9999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  gap: 24px;',
    '  padding: 14px 32px;',
    '  background: #1f1826;',
    '  border-top: 1px solid rgba(199, 176, 218, 0.1);',
    '  font-family: "InterVariable", "Inter", "Avenir Next", "Futura", sans-serif;',
    '  transform: translateY(100%);',
    '  transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);',
    '}',
    '.ga-consent-banner.is-visible {',
    '  transform: translateY(0);',
    '}',
    '.ga-consent-banner.is-dismissed {',
    '  transform: translateY(100%);',
    '  pointer-events: none;',
    '}',
    '.ga-consent-text {',
    '  margin: 0;',
    '  color: rgba(199, 176, 218, 0.6);',
    '  font-size: 12px;',
    '  font-weight: 400;',
    '  line-height: 1.5;',
    '  letter-spacing: 0.01em;',
    '}',
    '.ga-consent-btn {',
    '  flex-shrink: 0;',
    '  appearance: none;',
    '  background: transparent;',
    '  border: 1px solid rgba(193, 165, 236, 0.4);',
    '  border-radius: 100px;',
    '  color: #C1A5EC;',
    '  font-family: inherit;',
    '  font-size: 12px;',
    '  font-weight: 500;',
    '  letter-spacing: 0.02em;',
    '  line-height: 1;',
    '  height: auto;',
    '  width: auto;',
    '  backdrop-filter: none;',
    '  padding: 8px 18px;',
    '  cursor: pointer;',
    '  transition: background 0.18s ease, border-color 0.18s ease;',
    '}',
    '.ga-consent-btn:hover {',
    '  background: rgba(193, 165, 236, 0.1);',
    '  border-color: rgba(193, 165, 236, 0.7);',
    '}',
    '.ga-consent-btn:focus-visible {',
    '  outline: none;',
    '  box-shadow: 0 0 0 2px rgba(193, 165, 236, 0.5);',
    '}',
    '@media (max-width: 600px) {',
    '  .ga-consent-banner {',
    '    flex-direction: column;',
    '    align-items: flex-start;',
    '    gap: 12px;',
    '    padding: 16px 20px;',
    '  }',
    '  .ga-consent-btn {',
    '    align-self: flex-end;',
    '  }',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.className = 'ga-consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Analytics consent notice');

  var text = document.createElement('p');
  text.className = 'ga-consent-text';
  text.textContent =
    'I use Google Analytics and Microsoft Clarity to understand how my work is received, which projects resonate and how people move through the portfolio. By continuing, you\u2019re okay with that.';

  var btn = document.createElement('button');
  btn.className = 'ga-consent-btn';
  btn.type = 'button';
  btn.textContent = 'Understood';

  banner.appendChild(text);
  banner.appendChild(btn);
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  });

  btn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, '1');
    banner.classList.remove('is-visible');
    banner.classList.add('is-dismissed');
    banner.addEventListener('transitionend', function () {
      banner.remove();
    }, { once: true });
  });
})();
