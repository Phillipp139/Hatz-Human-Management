// Minimal, defensive unlock helper.
// Runs early to remove stuck modal/nav scroll locks and to restore page scroll.
(function () {
  const STYLE_ID = 'force-unlock-style';

  function installCssOverride() {
    if (document.getElementById(STYLE_ID)) return;
    try {
      const css = `html, body { overflow: auto !important; position: static !important; top: auto !important; width: auto !important; }`;
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.appendChild(document.createTextNode(css));
      // insert as early as possible
      (document.head || document.documentElement).appendChild(el);
    } catch (e) {
      /* noop */
    }
  }

  function runCleanup() {
    try {
      const stuck = ['is-br-modal-open', 'is-nav-open'];
      stuck.forEach((c) => {
        document.body.classList.remove(c);
        document.documentElement.classList.remove(c);
      });

      // restore inline styles commonly used to lock scroll
      const topVal = document.body.style.top || '';
      const m = topVal.match(/-?(\d+)/);
      const restoreY = m ? Math.abs(parseInt(m[1], 10)) : null;

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      // If we detected a previous scroll offset encoded in top, restore it
      if (Number.isFinite(restoreY) && restoreY !== null) {
        window.setTimeout(() => { try { window.scrollTo(0, restoreY); } catch (_) {} }, 0);
      }
    } catch (e) {
      // ignore
    }
  }

  function start() {
    installCssOverride();
    // run immediately and a few times (some scripts apply locks after load)
    runCleanup();
    setTimeout(runCleanup, 100);
    setTimeout(runCleanup, 500);
    setTimeout(runCleanup, 1500);
    // Also run on DOMContentLoaded in case script runs before DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        installCssOverride();
        runCleanup();
      }, { once: true });
    }
  }

  // Kick off now
  try { start(); } catch (e) { /* noop */ }
})();
