(function () {
  // Visit /?internal=1 once on any device to exclude it from GA4 + Clarity tracking.
  // Visit /?internal=0 to restore tracking on that device.
  var s = location.search;
  if (/[?&]internal=0/.test(s)) {
    localStorage.removeItem('ga_internal');
    document.cookie = 'CLWLOPTOUT=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.sujaykumar.net';
  }
  if (/[?&]internal=1/.test(s)) {
    localStorage.setItem('ga_internal', '1');
    document.cookie = 'CLWLOPTOUT=1; expires=Fri, 31 Dec 2099 23:59:59 GMT; path=/; domain=.sujaykumar.net';
  }
})();
