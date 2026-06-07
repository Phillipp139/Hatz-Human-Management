(() => {
  if (!location.search.includes('debug_scroll=1')) return;
  const create = (tag, attrs = {}, txt) => { const el = document.createElement(tag); Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k])); if (txt) el.textContent = txt; return el; };
  const overlay = create('div', { id: 'scroll-debug-overlay', style: 'position:fixed;right:12px;top:12px;z-index:99999;background:rgba(0,0,0,0.85);color:#fff;padding:12px;border-radius:8px;font-family:system-ui,sans-serif;font-size:13px;max-width:320px;' });
  const title = create('div', {}, 'Scroll Debug');
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';
  overlay.appendChild(title);

  const info = create('pre', { id: 'scroll-debug-info', style: 'white-space:pre-wrap;margin:0 0 8px 0;max-height:220px;overflow:auto;' });
  const updateInfo = () => {
    try {
      const bodyClasses = document.body.classList.value || '(none)';
      const htmlClasses = document.documentElement.classList.value || '(none)';
      const bodyInline = `position:${document.body.style.position||'(none)'} top:${document.body.style.top||'(none)'} width:${document.body.style.width||'(none)'}`;
      const bodyOverflow = getComputedStyle(document.body).overflow;
      const htmlOverflow = getComputedStyle(document.documentElement).overflow;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      info.textContent = `body classes: ${bodyClasses}\nhtml classes: ${htmlClasses}\nbody inline: ${bodyInline}\nbody overflow: ${bodyOverflow}\nhtml overflow: ${htmlOverflow}\npageYOffset: ${y}`;
    } catch (e) { info.textContent = 'error reading state'; }
  };
  overlay.appendChild(info);

  const unlockBtn = create('button', { id: 'scroll-debug-unlock', style: 'display:block;background:#d33;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer;margin-bottom:6px;' }, 'Unlock Scroll');
  unlockBtn.addEventListener('click', () => {
    try {
      document.body.classList.remove('is-br-modal-open','is-nav-open');
      document.documentElement.classList.remove('is-br-modal-open','is-nav-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      updateInfo();
      console.log('scroll unlock attempted by debug overlay');
    } catch (_) { console.warn('unlock failed'); }
  });
  overlay.appendChild(unlockBtn);
  const forceBtn = create('button', { id: 'scroll-debug-force', style: 'display:block;background:#0066cc;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer;margin:6px 0;' }, 'Force enable wheel (click)');
  forceBtn.addEventListener('click', () => {
    try {
      if (!document.getElementById('dev-forced-scroll')) {
        const s = document.createElement('style');
        s.id = 'dev-forced-scroll';
        s.textContent = 'html, body { overflow: auto !important; position: static !important; height: auto !important; } * { pointer-events: auto !important; }';
        document.head.appendChild(s);
      }
      if (typeof window.__forceUnlockScroll === 'function') window.__forceUnlockScroll();
      updateInfo();
      console.log('force enable wheel applied');
    } catch (e) { console.warn('force enable failed', e); }
  });
  overlay.appendChild(forceBtn);
  const detectBtn = create('button', { id: 'scroll-debug-detect', style: 'display:block;background:#ff9900;color:#000;border:none;padding:8px 10px;border-radius:6px;cursor:pointer;margin:6px 0;' }, 'Detect wheel preventDefault');
  detectBtn.addEventListener('click', () => {
    try {
      if (window.__wheelPreventDetectorInstalled) { console.log('wheel preventDefault detector already installed'); return; }
      const orig = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        try { if (this && this.type === 'wheel') { console.warn('preventDefault called on wheel event:', this, '\nstack:', (new Error()).stack); } } catch (_) {}
        return orig.apply(this, arguments);
      };
      window.__wheelPreventDetectorInstalled = true;
      console.log('wheel preventDefault detector installed — now use the mouse wheel and check console for warnings');
    } catch (e) { console.warn('install failed', e); }
  });
  overlay.appendChild(detectBtn);

  const refreshBtn = create('button', { style: 'display:inline-block;background:#444;color:#fff;border:none;padding:6px 8px;border-radius:6px;cursor:pointer;margin-right:6px;' }, 'Refresh');
  refreshBtn.addEventListener('click', updateInfo);
  overlay.appendChild(refreshBtn);

  const closeBtn = create('button', { style: 'display:inline-block;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:6px 8px;border-radius:6px;cursor:pointer;margin-left:6px;' }, 'Close');
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.appendChild(closeBtn);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);
    // Try automatic unlock once (use global helper if available)
    try {
      if (typeof window.__forceUnlockScroll === 'function') {
        window.__forceUnlockScroll();
      } else {
        document.body.classList.remove('is-br-modal-open','is-nav-open');
        document.documentElement.classList.remove('is-br-modal-open','is-nav-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    } catch (_) {}
    updateInfo();
    // update periodically to catch changes
    const iv = setInterval(updateInfo, 500);
    setTimeout(() => clearInterval(iv), 20000);
  });
})();
