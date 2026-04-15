(function () {
  // Visit /?internal=1 once on any device to exclude it from GA4 tracking.
  // Visit /?internal=0 to restore tracking on that device.
  var s = location.search;
  if (/[?&]internal=0/.test(s)) localStorage.removeItem('ga_internal');
  if (/[?&]internal=1/.test(s)) localStorage.setItem('ga_internal', '1');
})();
