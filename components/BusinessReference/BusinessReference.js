(function () {
  function qs(root, sel) { return root.querySelector(sel); }
  function qsa(root, sel) { return Array.from(root.querySelectorAll(sel)); }

  function init(root) {
    if (!root || root.dataset.brInitialized === '1') return;
    const brSection = root;
    const tmpl = qs(brSection, '#br-all-template');
    if (!tmpl) return;
    const previewList = qs(brSection, '[data-br-preview]');
    const openBtn = qs(brSection, '[data-br-open]');
    const modal = qs(brSection, '[data-br-modal]');
    const dialog = qs(brSection, '.br-modal__dialog');
    const backdrop = qs(brSection, '[data-br-backdrop]');
    const closeBtn = qs(brSection, '[data-br-close]');
    const body = qs(brSection, '[data-br-body]');

    const PREVIEW_COUNT = 5;
    let lastFocused = null;

    // Build lists from template
    const frag = tmpl.content.cloneNode(true);
    const allList = frag.querySelector('.br__all-list');
    const items = allList ? qsa(allList, 'li') : [];

    // Preview (first N)
    if (previewList && items.length) {
      const prevFrag = document.createDocumentFragment();
      items.slice(0, PREVIEW_COUNT).forEach((li) => {
        const clone = li.cloneNode(true);
        prevFrag.appendChild(clone);
      });
      previewList.appendChild(prevFrag);
    }

    // Modal content: two sections (featured vs. rest)
    if (body) {
      const featured = [];
      const rest = [];
      items.forEach((li) => {
        if (li.hasAttribute('data-br-featured') || /Dozent\s*\/\s*Freier Referent/i.test(li.textContent || '')) {
          featured.push(li.cloneNode(true));
        } else {
          rest.push(li.cloneNode(true));
        }
      });
      const wrapper = document.createElement('div');
      const allUl = document.createElement('ul');
      allUl.className = 'br-list';
      rest.forEach((n) => allUl.appendChild(n));
      wrapper.appendChild(allUl);

      if (featured.length) {
        const sec = document.createElement('section');
        sec.className = 'br-section';
        const h = document.createElement('h4');
        h.className = 'br-section__title';
        h.textContent = 'Lehre / Dozententätigkeit';
        const ul = document.createElement('ul');
        ul.className = 'br-list';
        featured.forEach((n) => { n.classList.add('br-featured'); ul.appendChild(n); });
        sec.appendChild(h);
        sec.appendChild(ul);
        wrapper.appendChild(sec);
      }
      body.appendChild(wrapper);
    }

    // Focus trap helpers
    function getFocusable(container) {
      const focusSel = [
        'a[href]','area[href]','button:not([disabled])','input:not([disabled])',
        'select:not([disabled])','textarea:not([disabled])','[tabindex]:not([tabindex="-1"])'
      ].join(',');
      return qsa(container, focusSel).filter((el) => el.offsetParent !== null || el === closeBtn);
    }

    function handleKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === 'Tab' && dialog) {
        const focusables = getFocusable(dialog);
        if (!focusables.length) return;
        const current = document.activeElement;
        const idx = focusables.indexOf(current);
        let nextIdx = idx;
        if (e.shiftKey) {
          nextIdx = idx <= 0 ? focusables.length - 1 : idx - 1;
        } else {
          nextIdx = idx === focusables.length - 1 ? 0 : idx + 1;
        }
        if (idx === -1) return;
        e.preventDefault();
        focusables[nextIdx].focus();
      }
    }

    let scrollYCache = 0;

    function unlockScroll() {
      try {
        document.body.classList.remove('is-br-modal-open');
        document.documentElement.classList.remove('is-br-modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      } catch (_) { /* no-op */ }
    }

    function openModal() {
      if (!modal || !dialog) return;
      lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      // Ensure modal is a direct child of body to avoid transformed ancestor issues
      try {
        if (modal.parentElement !== document.body) {
          document.body.appendChild(modal);
        }
      } catch (_) {}

      modal.setAttribute('aria-hidden', 'false');

      // Lock background scroll robustly (works on iOS)
      scrollYCache = window.scrollY || window.pageYOffset || 0;
      document.body.classList.add('is-br-modal-open');
      document.documentElement.classList.add('is-br-modal-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYCache}px`;
      document.body.style.width = '100%';

      const focusables = getFocusable(dialog);
      const first = focusables[0] || closeBtn || dialog;
      window.setTimeout(() => first.focus(), 0);
      document.addEventListener('keydown', handleKeydown);
    }

    function closeModal() {
      if (!modal || !dialog) return;
      modal.setAttribute('aria-hidden', 'true');
      // release scroll lock
      unlockScroll();
      if (Number.isFinite(scrollYCache)) {
        window.scrollTo(0, scrollYCache);
      }
      document.removeEventListener('keydown', handleKeydown);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      } else if (openBtn) {
        openBtn.focus();
      }
    }

    // Bindings
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // Safety: if body remained locked but no visible modal exists, unlock on next user interaction
    document.addEventListener('click', (ev) => {
      try {
        if (document.body.style.position === 'fixed') {
          const visible = document.querySelector('[data-br-modal][aria-hidden="false"]');
          if (!visible) {
            unlockScroll();
          }
        }
      } catch (_) {}
    }, true);

    brSection.dataset.brInitialized = '1';
  }

  function tryInitNow() {
    const el = document.querySelector('.br');
    if (el) init(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitNow);
  } else {
    tryInitNow();
  }

  // Also observe for dynamic include
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            const host = n.closest && (n.matches('.br') ? n : n.querySelector && n.querySelector('.br'));
            if (host) init(host.matches('.br') ? host : host.querySelector('.br'));
          }
        });
      }
    }
  });
  try { mo.observe(document.body, { childList: true, subtree: true }); } catch (_) {}
})();
