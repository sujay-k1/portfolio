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
    '  position: relative;',
    '  isolation: isolate;',
    '  overflow: hidden;',
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
    '.ga-consent-btn::before {',
    '  content: "";',
    '  position: absolute;',
    '  inset: 0;',
    '  z-index: 0;',
    '  background: rgba(255, 255, 255, 0.1);',
    '  transform: scaleX(0);',
    '  transform-origin: left center;',
    '  transition: transform 5s linear;',
    '}',
    '.ga-consent-btn.is-auto-filling::before {',
    '  transform: scaleX(1);',
    '}',
    '.ga-consent-btn span {',
    '  position: relative;',
    '  z-index: 1;',
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
  var btnLabel = document.createElement('span');
  btnLabel.textContent = 'Understood';
  btn.appendChild(btnLabel);

  banner.appendChild(text);
  banner.appendChild(btn);
  document.body.appendChild(banner);

  var autoClickTimer = null;

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      btn.classList.add('is-auto-filling');
      autoClickTimer = window.setTimeout(function () {
        btn.click();
      }, 5000);
    });
  });

  btn.addEventListener('click', function () {
    if (autoClickTimer) {
      window.clearTimeout(autoClickTimer);
      autoClickTimer = null;
    }
    localStorage.setItem(STORAGE_KEY, '1');
    banner.classList.remove('is-visible');
    banner.classList.add('is-dismissed');
    banner.addEventListener('transitionend', function () {
      banner.remove();
    }, { once: true });
  });
})();
