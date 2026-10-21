// Runs in <head>, before first paint: applies the saved theme and arms the scroll-reveal styles.
// Kept as its own file (not an inline script) so the Content-Security-Policy can say script-src 'self'.
(function () {
  var root = document.documentElement;
  try { var t = localStorage.getItem('rpc-theme'); if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); } catch (e) {}
  root.classList.add('js');
  // failsafe: if site.js never runs, stop hiding the scroll-reveal content
  setTimeout(function () { if (!window.__rpc) root.classList.remove('js'); }, 4000);
})();
