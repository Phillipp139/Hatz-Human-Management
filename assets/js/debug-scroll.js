(() => {
  if (!location.search.includes('debug_scroll=1')) return;
  // Minimal instrumentation: log stack when preventDefault is called on wheel events
  try {
    if (!window.__wheelPreventDetectorInstalled) {
      const _origPrevent = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        try {
          if (this && this.type === 'wheel') {
            // warn with limited stack trace to find origin
            console.warn('DETECT: preventDefault called on wheel event', { event: this }, (new Error()).stack.split('\n').slice(0,6).join('\n'));
          }
        } catch (_) {}
        return _origPrevent.apply(this, arguments);
      };
      window.__wheelPreventDetectorInstalled = true;
      console.log('wheel preventDefault detector installed (debug_scroll=1)');
    }
  } catch (e) { console.warn('failed to install wheel detector', e); }
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

  const closeBtn = create('button', { style: 'display:inline-block;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:6px 8px;border-radius:6px;cursor:pointer;margin-left:6px;' }, 'Close');
  closeBtn.addEventListener('click', () => overlay.remove());
  overlay.appendChild(closeBtn);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);
    updateInfo();
    // update periodically to catch changes
    const iv = setInterval(updateInfo, 500);
    setTimeout(() => clearInterval(iv), 20000);
  });
})();
