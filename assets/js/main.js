(() => {
  const doc = document;
  const body = doc.body;
  const header = doc.querySelector("[data-js-header]");
  const nav = doc.querySelector("[data-js-nav]");
  const navToggle = doc.querySelector("[data-js-nav-toggle]");
  const navToggleHint = navToggle?.querySelector(".sr-only") || null;
  const themeToggle = doc.querySelector("[data-js-theme-toggle]");
  const accordion = doc.querySelector("[data-js-accordion]");
  const carousel = doc.querySelector("[data-js-carousel]");
  const carouselTrack = doc.querySelector("[data-js-carousel-track]");
  const carouselPrev = doc.querySelector("[data-js-carousel-prev]");
  const carouselNext = doc.querySelector("[data-js-carousel-next]");
  const carouselToggle = doc.querySelector("[data-js-carousel-toggle]");
  const marquee = doc.querySelector("[data-js-marquee]");
  const revealEls = Array.from(doc.querySelectorAll("[data-js-reveal]"));
  const pointerFineMedia = window.matchMedia("(pointer: fine)");
  const heroSection = doc.querySelector("[data-js-hero]");
  const heroStages = heroSection ? Array.from(heroSection.querySelectorAll("[data-hero-stage]")) : [];
  const heroParallax = heroSection?.querySelector("[data-hero-parallax]") || null;
  const heroPortrait = heroSection?.querySelector(".hero__portrait") || null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroPortraitImage = heroPortrait?.querySelector("img") || null;
  let navFocusElements = [];
  let navFocusIndex = 0;
  let navIsOpen = false;
  let lastFocusedElement = null;
  let carouselIndex = 0;
  let carouselTimer = null;
  let carouselAutoplay = !prefersReducedMotion.matches;
  let marqueeController = null;
  let customCursor = null;
  let customCursorVisible = false;
  const heroState = {
    observer: null,
    isActive: false,
    parallaxRaf: null,
  };
  const cursorState = {
    isReducedMotion: prefersReducedMotion.matches,
  };
  const cursorInteractiveSelector = [
    "a[href]",
    "button",
    "[role=\"button\"]",
    ".btn",
    ".offerings-card",
    ".site-nav__list a",
    ".nav-toggle",
    ".carousel__btn",
    ".site-logo"
  ].join(", ");
  const themeInfoOverlay = doc.querySelector("[data-js-theme-info-overlay]");
  const themeInfoTriggers = Array.from(doc.querySelectorAll("[data-js-theme-info-trigger]"));
  const themeInfoClose = themeInfoOverlay?.querySelector("[data-js-theme-info-close]") || null;

  const setHeroBandDynamicOffset = (value) => {
    if (!heroParallax) return;
    const numeric = Number.isFinite(value) ? value : 0;
    heroParallax.style.setProperty("--hero-band-dynamic-offset", `${numeric.toFixed(2)}px`);
  };

  const setHeroBandParallaxY = (value) => {
    if (!heroParallax) return;
    const numeric = Number.isFinite(value) ? value : 0;
    heroParallax.style.setProperty("--hero-band-parallax-y", `${numeric.toFixed(2)}px`);
  };

  const updateHeroBandHorizontal = (heroRect, portraitRect) => {
    if (!heroParallax || !portraitRect) return;
    if (window.innerWidth >= 900) {
      const leftOffset = Math.max(0, portraitRect.left - heroRect.left - 36);
      heroParallax.style.setProperty("--hero-band-left", `${leftOffset.toFixed(2)}px`);
    } else {
      heroParallax.style.removeProperty("--hero-band-left");
      heroParallax.style.removeProperty("--hero-band-right");
    }
  };

  const isInteractiveCursorTarget = (element) => {
    if (!(element instanceof Element)) return null;
    const candidate = element.closest(cursorInteractiveSelector);
    if (!candidate) return null;
    if (candidate.hasAttribute("disabled") || candidate.getAttribute("aria-disabled") === "true") return null;
    if (candidate.matches("input, textarea, select, [contenteditable=\"true\"]")) return null;
    return candidate;
  };

  const hideCustomCursor = () => {
    if (!customCursor) return;
    customCursor.classList.remove("is-visible", "is-pressed");
    customCursorVisible = false;
  };

  const handleCursorPointerMove = (event) => {
    if (!customCursor) return;
    customCursor.style.left = `${event.clientX}px`;
    customCursor.style.top = `${event.clientY}px`;
    const interactiveTarget = isInteractiveCursorTarget(event.target instanceof Element ? event.target : null);
    if (interactiveTarget) {
      if (!customCursorVisible) {
        customCursor.classList.add("is-visible");
        customCursorVisible = true;
      }
    } else if (customCursorVisible) {
      hideCustomCursor();
    }
  };

  const handleCursorPointerLeave = () => {
    hideCustomCursor();
  };

  const handleCursorPointerDown = () => {
    if (!customCursor || !customCursorVisible) return;
    customCursor.classList.add("is-pressed");
  };

  const handleCursorPointerUp = () => {
    if (!customCursor) return;
    customCursor.classList.remove("is-pressed");
  };

  const destroyCustomCursor = () => {
    if (!customCursor) return;
    doc.removeEventListener("pointermove", handleCursorPointerMove);
    doc.removeEventListener("pointerleave", handleCursorPointerLeave);
    doc.removeEventListener("pointerdown", handleCursorPointerDown);
    doc.removeEventListener("pointerup", handleCursorPointerUp);
    customCursor.remove();
    customCursor = null;
    customCursorVisible = false;
    body.classList.remove("has-custom-cursor");
  };

  const handlePointerFineChange = (event) => {
    if (event.matches) {
      createCustomCursor();
    } else {
      destroyCustomCursor();
    }
  };

  const createCustomCursor = () => {
    if (customCursor || !pointerFineMedia.matches) return;
    customCursor = doc.createElement("span");
    customCursor.className = "cursor-dot";
    if (cursorState.isReducedMotion) {
      customCursor.classList.add("is-reduced-motion");
    }
    body.appendChild(customCursor);
    customCursor.style.left = "-100px";
    customCursor.style.top = "-100px";
    body.classList.add("has-custom-cursor");
    doc.addEventListener("pointermove", handleCursorPointerMove);
    doc.addEventListener("pointerleave", handleCursorPointerLeave);
    doc.addEventListener("pointerdown", handleCursorPointerDown);
    doc.addEventListener("pointerup", handleCursorPointerUp);
  };

  const initCustomCursor = () => {
    if (pointerFineMedia.matches) {
      createCustomCursor();
    }
    if (typeof pointerFineMedia.addEventListener === "function") {
      pointerFineMedia.addEventListener("change", handlePointerFineChange);
    } else if (typeof pointerFineMedia.addListener === "function") {
      pointerFineMedia.addListener(handlePointerFineChange);
    }
  };

  const scrollToTarget = (target) => {
    if (!target) return;
    const prefersReduced = prefersReducedMotion.matches;
    target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  };

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("is-nav-open");
    navIsOpen = false;
    if (navToggleHint) {
      navToggleHint.textContent = "Menü öffnen";
    }
    // Reset mobile subnav state (e.g., Angebot accordion)
    try {
      const subItems = Array.from(doc.querySelectorAll('.site-nav__item.has-submenu'));
      subItems.forEach((item) => {
        item.classList.remove('is-open');
        const btn = item.querySelector('.site-subnav__toggle');
        const icon = btn?.querySelector('.site-subnav__icon') || null;
        const sub = item.querySelector('.site-subnav');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = '+';
        if (sub && window.matchMedia('(max-width: 899.98px)').matches) {
          sub.setAttribute('hidden', '');
        }
      });
    } catch (_) {}
    removeFocusTrap();
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  const openNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.add("is-open");
    navToggle.classList.add("is-active");
    navToggle.setAttribute("aria-expanded", "true");
    body.classList.add("is-nav-open");
    navIsOpen = true;
    if (navToggleHint) {
      navToggleHint.textContent = "Menü schließen";
    }
    setupFocusTrap();
  };

  const toggleNav = () => {
    if (!navToggle) return;
    if (navIsOpen) {
      closeNav();
    } else {
      lastFocusedElement = doc.activeElement;
      openNav();
    }
  };

  const setupFocusTrap = () => {
    if (!nav) return;
    navFocusElements = Array.from(
      nav.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    navFocusIndex = 0;
    if (navFocusElements.length) {
      navFocusElements[0].focus();
    }
    doc.addEventListener("keydown", handleNavKeydown);
  };

  const removeFocusTrap = () => {
    doc.removeEventListener("keydown", handleNavKeydown);
  };

  const handleNavKeydown = (event) => {
    if (!navIsOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeNav();
      return;
    }
    if (event.key === "Tab") {
      if (!navFocusElements.length) return;
      event.preventDefault();
      navFocusIndex += event.shiftKey ? -1 : 1;
      if (navFocusIndex < 0) {
        navFocusIndex = navFocusElements.length - 1;
      }
      if (navFocusIndex >= navFocusElements.length) {
        navFocusIndex = 0;
      }
      navFocusElements[navFocusIndex].focus();
    }
  };

  const initNav = () => {
    if (!nav || !navToggle) return;
    navToggle.addEventListener("click", toggleNav);
    nav.addEventListener("click", (event) => {
      const isLink = event.target instanceof HTMLElement && event.target.matches("a[href]");
      if (isLink) {
        closeNav();
      }
    });
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 900px)").matches) {
        closeNav();
      }
    });
  };

  const applyTheme = (theme) => {
    if (theme !== "light" && theme !== "dark") {
      theme = "light";
    }
    body.setAttribute("data-theme", theme);
  };

  const resolveInitialTheme = () => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      applyTheme(stored);
      return stored;
    }
    applyTheme("light");
    return "light";
  };

  const initThemeToggle = () => {
    if (!themeToggle) return;
    let activeTheme = resolveInitialTheme();
    themeToggle.addEventListener("click", () => {
      activeTheme = activeTheme === "light" ? "dark" : "light";
      applyTheme(activeTheme);
      window.localStorage.setItem("theme", activeTheme);
      themeToggle.setAttribute("data-active-theme", activeTheme);
    });
    themeToggle.setAttribute("data-active-theme", activeTheme);
  };

  const initSmoothScroll = () => {
    doc.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const anchor = target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const destination = doc.querySelector(href);
      if (!destination) return;
      event.preventDefault();
      closeNav();
      scrollToTarget(destination);
    });
  };

  const initHeaderObserver = () => {
    if (!header) return;
    let ticking = false;
    const updateHeader = () => {
      const isScrolled = window.scrollY > 8;
      header.classList.toggle("is-scrolled", isScrolled);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateHeader();
  };

  const setHeroActive = (active) => {
    if (!heroSection || !heroStages.length) return;
    if (active) {
      if (heroState.isActive) return;
      heroState.isActive = true;
      heroSection.setAttribute("data-hero-active", "true");
    } else {
      if (!heroState.isActive) return;
      heroState.isActive = false;
      heroSection.removeAttribute("data-hero-active");
      if (!prefersReducedMotion.matches && heroParallax) {
        setHeroBandParallaxY(0);
      }
      setHeroBandDynamicOffset(0);
      if (heroParallax) {
        heroParallax.style.removeProperty("--hero-band-left");
        heroParallax.style.removeProperty("--hero-band-right");
      }
    }
  };

  const updateHeroParallax = () => {
    heroState.parallaxRaf = null;
    if (!heroSection || !heroParallax || prefersReducedMotion.matches) return;
    const rect = heroSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0;
    if (viewportHeight <= 0) return;

    if (rect.bottom <= 0 || rect.top >= viewportHeight) {
      setHeroBandParallaxY(0);
      setHeroBandDynamicOffset(0);
      heroParallax.style.removeProperty("--hero-band-left");
      heroParallax.style.removeProperty("--hero-band-right");
      return;
    }

    if (heroPortrait) {
      const portraitRect = heroPortrait.getBoundingClientRect();
      const offsetBottom = rect.bottom - portraitRect.bottom;
      const clampedOffset = Math.max(-120, Math.min(120, offsetBottom));
      setHeroBandDynamicOffset(clampedOffset);
      updateHeroBandHorizontal(rect, portraitRect);
    } else {
      setHeroBandDynamicOffset(0);
      setHeroBandParallaxY(0);
      heroParallax.style.removeProperty("--hero-band-left");
      heroParallax.style.removeProperty("--hero-band-right");
    }

    const heroCenter = rect.top + rect.height * 0.5;
    const viewportCenter = viewportHeight * 0.5;
    const distance = heroCenter - viewportCenter;
    const normalized = Math.max(-1, Math.min(1, distance / viewportHeight));
    const range = 12;
    const offset = Math.max(-range, Math.min(range, normalized * -range));
    setHeroBandParallaxY(offset);
  };

  const requestHeroParallaxUpdate = () => {
    if (!heroParallax || heroState.parallaxRaf !== null) return;
    heroState.parallaxRaf = window.requestAnimationFrame(updateHeroParallax);
  };

  const handleHeroIntersection = (entries) => {
    entries.forEach((entry) => {
      if (!heroSection || entry.target !== heroSection) return;
      if (entry.isIntersecting) {
        setHeroActive(true);
        requestHeroParallaxUpdate();
      } else {
        const viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0;
        if (viewportHeight <= 0) {
          setHeroActive(false);
          return;
        }
        if (entry.boundingClientRect.bottom <= 0 || entry.boundingClientRect.top >= viewportHeight) {
          setHeroActive(false);
        }
      }
    });
  };

  const enableHeroObserver = () => {
    if (!heroSection || !heroStages.length) return;
    if (!heroState.observer) {
      heroState.observer = new IntersectionObserver(handleHeroIntersection, {
        threshold: 0.45,
        rootMargin: "-12% 0px -24% 0px",
      });
    }
    heroState.observer.observe(heroSection);
  };

  const disableHeroObserver = () => {
    heroState.observer?.disconnect();
  };

  const applyReducedMotionToHero = (reduced) => {
    if (!heroSection || !heroStages.length) return;
    if (reduced) {
      disableHeroObserver();
      setHeroActive(true);
      if (heroParallax) {
        setHeroBandParallaxY(0);
        setHeroBandDynamicOffset(0);
        heroParallax.style.removeProperty("--hero-band-left");
        heroParallax.style.removeProperty("--hero-band-right");
      }
    } else {
      enableHeroObserver();
      heroSection.removeAttribute("data-hero-active");
      heroState.isActive = false;
      requestHeroParallaxUpdate();
      setHeroBandDynamicOffset(0);
      heroParallax?.style.removeProperty("--hero-band-left");
      heroParallax?.style.removeProperty("--hero-band-right");
      setHeroBandParallaxY(0);
      const rect = heroSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0;
      if (rect.bottom >= 0 && rect.top <= viewportHeight) {
        window.requestAnimationFrame(() => setHeroActive(true));
      }
    }
  };

  const initHero = () => {
    if (!heroSection || !heroStages.length) return;
    if (!prefersReducedMotion.matches) {
      enableHeroObserver();
    } else {
      setHeroActive(true);
    }
    if (heroParallax) {
      window.addEventListener("scroll", requestHeroParallaxUpdate, { passive: true });
      window.addEventListener("resize", requestHeroParallaxUpdate);
      setHeroBandDynamicOffset(0);
      heroParallax.style.removeProperty("--hero-band-left");
      heroParallax.style.removeProperty("--hero-band-right");
      setHeroBandParallaxY(0);
      requestHeroParallaxUpdate();
      updateHeroParallax();
    }
    const primeHeroParallax = () => {
      requestHeroParallaxUpdate();
      updateHeroParallax();
    };
    if (heroPortraitImage) {
      if (heroPortraitImage.complete && heroPortraitImage.naturalHeight > 0) {
        window.requestAnimationFrame(primeHeroParallax);
      } else {
        heroPortraitImage.addEventListener("load", () => window.requestAnimationFrame(primeHeroParallax), {
          once: true
        });
      }
    }
    window.addEventListener("load", () => window.requestAnimationFrame(primeHeroParallax), { once: true });
    if (!prefersReducedMotion.matches) {
      const rect = heroSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || doc.documentElement.clientHeight || 0;
      if (rect.bottom >= 0 && rect.top <= viewportHeight) {
        window.requestAnimationFrame(() => setHeroActive(true));
      }
    }
  };

  const handleReveal = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  };

  const initReveal = () => {
    if (!revealEls.length) return;
    if (prefersReducedMotion.matches) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(handleReveal, {
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    });
    revealEls.forEach((el) => observer.observe(el));
  };

  const togglePanel = (trigger, panel, expanded) => {
    trigger.setAttribute("aria-expanded", String(expanded));
    panel.classList.toggle("is-open", expanded);
  };

  const initAccordion = () => {
    if (!accordion) return;
    const triggers = Array.from(
      accordion.querySelectorAll(".accordion__trigger")
    );
    const panels = triggers.map((trigger) => doc.getElementById(trigger.getAttribute("aria-controls") || ""));
    const setExpanded = (index) => {
      triggers.forEach((trigger, idx) => {
        const panel = panels[idx];
        if (!panel) return;
        togglePanel(trigger, panel, idx === index);
      });
    };
    triggers.forEach((trigger, index) => {
      const panel = panels[index];
      if (!panel) return;
      trigger.addEventListener("click", () => {
        const isExpanded = trigger.getAttribute("aria-expanded") === "true";
        setExpanded(isExpanded ? -1 : index);
      });
      trigger.addEventListener("keydown", (event) => {
        const key = event.key;
        const lastIndex = triggers.length - 1;
        let nextIndex = null;
        if (key === "ArrowDown") {
          nextIndex = index === lastIndex ? 0 : index + 1;
        } else if (key === "ArrowUp") {
          nextIndex = index === 0 ? lastIndex : index - 1;
        } else if (key === "Home") {
          nextIndex = 0;
        } else if (key === "End") {
          nextIndex = lastIndex;
        }
        if (nextIndex !== null) {
          event.preventDefault();
          triggers[nextIndex].focus();
        }
      });
    });
  };

  // Simple disclosure toggles for About section
  const initDisclosure = () => {
    const disclosures = Array.from(doc.querySelectorAll('[data-js-disclosure]'));
    if (!disclosures.length) return;
    let openPanel = null;
    const closeOpen = () => {
      if (!openPanel) return;
      const { button, panel } = openPanel;
      button.setAttribute('aria-expanded', 'false');
      panel.setAttribute('hidden', '');
      openPanel = null;
    };
    disclosures.forEach((wrap) => {
      const button = wrap.querySelector('button');
      const panel = wrap.querySelector('.disclosure__panel');
      if (!button || !panel) return;
      button.addEventListener('click', (e) => {
        const isOpen = button.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          button.setAttribute('aria-expanded', 'false');
          panel.setAttribute('hidden', '');
          openPanel = null;
        } else {
          closeOpen();
          button.setAttribute('aria-expanded', 'true');
          panel.removeAttribute('hidden');
          openPanel = { button, panel };
        }
      });
    });
    doc.addEventListener('click', (event) => {
      if (!openPanel) return;
      const { button, panel } = openPanel;
      if (button.contains(event.target) || panel.contains(event.target)) return;
      closeOpen();
    });
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeOpen();
    });
  };

  // Sticky-Fallback für About: aktiviert Fixierung nur im Sichtbereich des Abschnitts
  const initStickyAboutFallback = () => {
    const section = doc.querySelector('#ueber.section.about.sticky-layout');
    if (!section) return;
    const sticky = section.querySelector('.col-left .sticky-box');
    const colLeft = section.querySelector('.about__media.col-left') || section.querySelector('.col-left');
    const copy = section.querySelector('.about__copy') || section.querySelector('.col-right');
    if (!sticky || !colLeft || !copy) return;

    const mql = window.matchMedia('(min-width: 1024px)');
    const OFFSET = 32; // 2rem Abstand zu Viewport

    let ticking = false;
    let lastY = window.pageYOffset || document.documentElement.scrollTop;
    let mode = 'flow'; // 'flow' | 'fixed-top' | 'fixed-bottom'

    const clearStyles = () => {
      sticky.classList.remove('is-fixed', 'is-fixed-bottom', 'is-bottom');
      sticky.style.removeProperty('--sticky-left');
      sticky.style.removeProperty('--sticky-width');
      sticky.style.removeProperty('--sticky-offset');
      sticky.style.removeProperty('top');
      sticky.style.removeProperty('bottom');
      mode = 'flow';
    };

    const update = () => {
      ticking = false;
      if (!mql.matches) { clearStyles(); return; }

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const direction = scrollY > lastY ? 'down' : (scrollY < lastY ? 'up' : 'none');
      const vh = window.innerHeight;
      const sectionRect = section.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const stickyHeight = stickyRect.height;
      const EPS = 6; // größere Hysterese gegen Flackern

      const hitBottomBoundary = copyRect.bottom <= (OFFSET + stickyHeight + EPS);
      const reachedSectionTop = sectionRect.top >= (OFFSET - EPS);
      const nearTop = stickyRect.top <= (OFFSET + EPS);
      const nearBottom = stickyRect.bottom >= ((vh - OFFSET) - EPS);
      const sectionInView = sectionRect.bottom > EPS && sectionRect.top < (vh - EPS);

      // 1) Außerhalb des Abschnitts (oberhalb oder unterhalb): niemals sticky
      if (!sectionInView) { clearStyles(); lastY = scrollY; return; }
      // 1b) Noch nicht am oberen Rand angekommen: (aus unteren Bereichen kommend)
      if (reachedSectionTop) { clearStyles(); lastY = scrollY; return; }

      // 2) Abschnittsende (nur beim Runterscrollen): Top-Position klemmen
      if (hitBottomBoundary && direction !== 'up') {
        const rect = colLeft.getBoundingClientRect();
        if (mode !== 'fixed-top') {
          sticky.classList.add('is-fixed');
          sticky.classList.remove('is-fixed-bottom', 'is-bottom');
          mode = 'fixed-top';
        }
        sticky.style.setProperty('--sticky-left', rect.left + 'px');
        sticky.style.setProperty('--sticky-width', rect.width + 'px');
        sticky.style.setProperty('--sticky-offset', OFFSET + 'px');
        sticky.style.removeProperty('bottom');
        const desiredTop = Math.min(OFFSET, copyRect.bottom - stickyHeight);
        sticky.style.top = desiredTop + 'px';
        lastY = scrollY;
        return;
      }

      // 3) Im Abschnitt: symmetrische Enthüllung
      const rect = colLeft.getBoundingClientRect();
      if (direction === 'up') {
        // Hochscrollen: von oben langsam ins Sichtfeld laufen lassen und oben fixieren,
        // sobald die Oberkante die Top-Linie erreicht (nearTop).
        if (nearTop || mode === 'fixed-top') {
          if (mode !== 'fixed-top') {
            sticky.classList.add('is-fixed');
            sticky.classList.remove('is-fixed-bottom', 'is-bottom');
            mode = 'fixed-top';
          }
          sticky.style.setProperty('--sticky-left', rect.left + 'px');
          sticky.style.setProperty('--sticky-width', rect.width + 'px');
          sticky.style.setProperty('--sticky-offset', OFFSET + 'px');
          const desiredTop = Math.min(OFFSET, copyRect.bottom - stickyHeight);
          sticky.style.removeProperty('bottom');
          sticky.style.top = desiredTop + 'px';
        } else if (mode === 'fixed-bottom') {
          // Falls zuvor unten fixiert, sanft unten weiterführen bis Top-Linie erreicht ist
          const desiredBottom = Math.min(OFFSET, Math.max(0, vh - (sectionRect.top + stickyHeight)));
          sticky.style.removeProperty('top');
          sticky.style.bottom = desiredBottom + 'px';
        } else if (mode !== 'flow') {
          clearStyles();
        }
      } else {
        // Runterscrollen: oben fixieren oder bestehenden Fix-Zustand beibehalten
        if (nearTop || mode === 'fixed-top') {
          if (mode !== 'fixed-top') {
            sticky.classList.add('is-fixed');
            sticky.classList.remove('is-fixed-bottom', 'is-bottom');
            mode = 'fixed-top';
          }
          sticky.style.setProperty('--sticky-left', rect.left + 'px');
          sticky.style.setProperty('--sticky-width', rect.width + 'px');
          sticky.style.setProperty('--sticky-offset', OFFSET + 'px');
          const desiredTop = Math.min(OFFSET, copyRect.bottom - stickyHeight);
          sticky.style.removeProperty('bottom');
          sticky.style.top = desiredTop + 'px';
        } else if (mode === 'fixed-bottom') {
          // Beim kleinen Richtungswechsel unten verankert lassen und nachführen
          const desiredBottom = Math.min(OFFSET, Math.max(0, vh - (sectionRect.top + stickyHeight)));
          sticky.style.removeProperty('top');
          sticky.style.bottom = desiredBottom + 'px';
        } else if (mode !== 'flow') {
          clearStyles();
        }
      }

      lastY = scrollY;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    const onResize = () => {
      clearStyles();
      update();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // initial
    update();
  };

  const updateCarouselPosition = () => {
    if (!carouselTrack) return;
    const items = Array.from(carouselTrack.children);
    const activeIndex = ((carouselIndex % items.length) + items.length) % items.length;
    carouselTrack.style.transform = `translateX(-${activeIndex * 100}%)`;
  };

  const goToSlide = (index) => {
    if (!carouselTrack) return;
    const items = Array.from(carouselTrack.children);
    if (!items.length) return;
    carouselIndex = ((index % items.length) + items.length) % items.length;
    items.forEach((item, idx) => {
      item.setAttribute("tabindex", idx === carouselIndex ? "0" : "-1");
      item.setAttribute("aria-hidden", idx === carouselIndex ? "false" : "true");
    });
    updateCarouselPosition();
  };

  const startCarousel = () => {
    if (!carouselAutoplay || !carouselTrack) return;
    stopCarousel();
    carouselTimer = window.setInterval(() => {
      goToSlide(carouselIndex + 1);
    }, 6000);
  };

  const stopCarousel = () => {
    if (carouselTimer) {
      window.clearInterval(carouselTimer);
      carouselTimer = null;
    }
  };

  const initCarousel = () => {
    if (!carousel || !carouselTrack) return;
    const items = Array.from(carouselTrack.children);
    // Ensure first slide visible
    goToSlide(0);
    // Dots navigation
    const dots = Array.from(carousel.querySelectorAll('[data-js-carousel-dot]'));
    const syncDots = () => {
      dots.forEach((dot, idx) => {
        const active = idx === carouselIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };
    if (dots.length) {
      dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          goToSlide(idx);
          syncDots();
        });
      });
      syncDots();
    }
    if (carouselPrev) {
      carouselPrev.addEventListener("click", () => {
        goToSlide(carouselIndex - 1);
        dots.length && syncDots();
      });
    }
    if (carouselNext) {
      carouselNext.addEventListener("click", () => {
        goToSlide(carouselIndex + 1);
        dots.length && syncDots();
      });
    }
    // Disable autoplay when dots are present to keep control consistent
    stopCarousel();
  };

  const initOfferHub = () => {
    const hub = doc.querySelector("[data-js-offer-hub]");
    if (!hub) return;

    if (!hub) return;
    const tablist = hub.querySelector('[role="tablist"]');
    const panelWrapper = hub.querySelector("[data-offer-panels]");
    if (!tablist || !panelWrapper) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const panels = new Map();
    const placeholder = hub.querySelector("[data-offer-placeholder]");
    const allowEmpty = hub.hasAttribute('data-initial-empty') || hub.hasAttribute('data-allow-empty');
    let activeTab = tabs.find((tab) => tab.classList.contains("is-active")) || null;
    if (!activeTab && tabs.length && !allowEmpty) {
      activeTab = tabs[0];
      activeTab.classList.add("is-active");
    }

    const togglePlaceholder = (show) => {
      if (!placeholder) return;
      placeholder.classList.toggle("is-visible", Boolean(show));
    };

    tabs.forEach((tab, index) => {
      const target = tab.dataset.offerTarget;
      const panel = target ? hub.querySelector(`[data-offer-panel="${target}"]`) : null;
      if (panel) {
        panels.set(tab, panel);
      const isActive = Boolean(activeTab && tab === activeTab);
      const isFocusable = activeTab ? isActive : index === 0;
        tab.setAttribute("aria-selected", String(isActive));
        tab.setAttribute("tabindex", isFocusable ? "0" : "-1");
        if (isActive) {
          panel.hidden = false;
          panel.classList.add("is-active");
        } else {
          panel.classList.remove("is-active");
          panel.hidden = true;
        }
        panel.setAttribute("aria-hidden", String(!isActive));
      } else {
        const isFocusable = activeTab ? tab === activeTab : index === 0;
        tab.setAttribute("aria-selected", "false");
        tab.setAttribute("tabindex", isFocusable ? "0" : "-1");
      }
    });

    let activePanel = activeTab ? panels.get(activeTab) : null;
    togglePlaceholder(!activePanel);

    const focusPanelHeading = (panel) => {
      const focusable = panel?.querySelector("[data-offer-heading]");
      if (focusable) {
        window.requestAnimationFrame(() => {
          try {
            focusable.focus({ preventScroll: true });
          } catch (error) {
            focusable.focus();
          }
        });
      }
    };

    const hidePanel = (panel) => {
      if (!panel) return;
      if (prefersReducedMotion.matches) {
        panel.classList.remove("is-active");
        panel.classList.remove("is-exiting");
        panel.setAttribute("aria-hidden", "true");
        panel.hidden = true;
        return;
      }
      const handleTransitionEnd = (event) => {
        if (event.target !== panel || event.propertyName !== "opacity") return;
        panel.hidden = true;
        panel.classList.remove("is-exiting");
        panel.removeEventListener("transitionend", handleTransitionEnd);
      };
      panel.addEventListener("transitionend", handleTransitionEnd);
      panel.classList.remove("is-active");
      panel.classList.add("is-exiting");
      panel.setAttribute("aria-hidden", "true");
    };

    const showPanel = (panel) => {
      if (!panel) return;
      panel.hidden = false;
      panel.setAttribute("aria-hidden", "false");
      if (prefersReducedMotion.matches) {
        panel.classList.remove("is-exiting");
        panel.classList.add("is-active");
        return;
      }
      window.requestAnimationFrame(() => {
        panel.classList.remove("is-exiting");
        panel.classList.add("is-active");
      });
    };

    const setActiveTab = (nextTab, { focusPanel = true, fromKeyboard = false } = {}) => {
      if (!nextTab || nextTab === activeTab) {
        if (fromKeyboard) {
          nextTab?.focus();
        }
        return;
      }
      const nextPanel = panels.get(nextTab);
      if (!nextPanel) return;

      const previousPanel = activePanel;

      if (activeTab) {
        activeTab.classList.remove("is-active");
        activeTab.setAttribute("aria-selected", "false");
        activeTab.setAttribute("tabindex", "-1");
      }

      nextTab.classList.add("is-active");
      nextTab.setAttribute("aria-selected", "true");
      nextTab.setAttribute("tabindex", "0");
      if (fromKeyboard) {
        nextTab.focus();
      }

      if (previousPanel && previousPanel !== nextPanel) {
        hidePanel(previousPanel);
      }

      activeTab = nextTab;
      activePanel = nextPanel;
      showPanel(activePanel);
      togglePlaceholder(false);

      if (focusPanel) {
        focusPanelHeading(activePanel);
      }
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", (event) => {
        const button = event.currentTarget;
        if (!activeTab) {
          tabs.forEach((t, idx) => {
            t.setAttribute("tabindex", idx === index ? "0" : "-1");
          });
        }
        setActiveTab(button, { focusPanel: true, fromKeyboard: false });
      });
    });

    tablist.addEventListener("keydown", (event) => {
      const { key } = event;
      const currentIndex = tabs.indexOf(doc.activeElement);
      if (currentIndex === -1) return;
      let nextIndex = null;
      if (key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (key === "Home") {
        nextIndex = 0;
      } else if (key === "End") {
        nextIndex = tabs.length - 1;
      }
      if (nextIndex !== null) {
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        setActiveTab(nextTab, { focusPanel: true, fromKeyboard: true });
      }
    });

    prefersReducedMotion.addEventListener("change", (event) => {
      const reduced = event.matches;
      panels.forEach((panel, tab) => {
        const isActive = tab === activeTab;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
        panel.setAttribute("aria-hidden", String(!isActive));
      });
      if (!reduced && activePanel) {
        window.requestAnimationFrame(() => {
          activePanel.classList.add("is-active");
        });
        togglePlaceholder(false);
      } else if (!activePanel) {
        togglePlaceholder(true);
      }
    });

    togglePlaceholder(!activePanel);

    // Close button handler (top-right inside panel)
    hub.addEventListener('click', (ev) => {
      const closeBtn = (ev.target instanceof Element) ? ev.target.closest('.mentality__close') : null;
      if (!closeBtn) return;
      ev.preventDefault();
      if (activePanel) {
        hidePanel(activePanel);
      }
      if (activeTab) {
        activeTab.classList.remove('is-active');
        activeTab.setAttribute('aria-selected', 'false');
        activeTab.setAttribute('tabindex', '0');
      }
      activeTab = null;
      activePanel = null;
      togglePlaceholder(true);
    });
  };

  const initMarquee = () => {
    if (!marquee) return null;
    const track = marquee.querySelector(".logo-marquee__track");
    if (!track) return null;
    const items = Array.from(track.children);
    if (!items.length) return null;

    const fragment = doc.createDocumentFragment();
    items.forEach((item) => fragment.appendChild(item.cloneNode(true)));
    track.appendChild(fragment);

    let offset = 0;
    let rafId = null;
    let lastTime = 0;
    const pixelsPerSecond = 80;
    const speed = pixelsPerSecond / 1000;
    let halfWidth = 0;

    const normalizeOffset = () => {
      if (halfWidth <= 0) return;
      while (offset <= -halfWidth) {
        offset += halfWidth;
      }
      while (offset > 0) {
        offset -= halfWidth;
      }
    };

    const updateMeasurements = () => {
      halfWidth = track.scrollWidth / 2;
      normalizeOffset();
      track.style.transform = `translateX(${offset}px)`;
    };

    const step = (now) => {
      const delta = now - lastTime;
      lastTime = now;
      offset -= delta * speed;
      if (halfWidth > 0) {
        while (offset <= -halfWidth) {
          offset += halfWidth;
        }
        while (offset > 0) {
          offset -= halfWidth;
        }
      }
      track.style.transform = `translateX(${offset}px)`;
      rafId = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (rafId !== null) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(step);
    };

    const stop = () => {
      if (rafId === null) return;
      window.cancelAnimationFrame(rafId);
      rafId = null;
    };

    const pause = () => {
      stop();
    };

    const resume = () => {
      start();
    };

    window.addEventListener("resize", () => {
      updateMeasurements();
    });

    marquee.addEventListener("mouseenter", pause);
    marquee.addEventListener("mouseleave", resume);
    marquee.addEventListener("focusin", pause);
    marquee.addEventListener("focusout", () => {
      if (!marquee.contains(doc.activeElement)) resume();
    });

    updateMeasurements();
    start();

    const reset = () => {
      offset = 0;
      track.style.transform = "none";
    };

    return {
      start: resume,
      stop,
      update: updateMeasurements,
      reset,
    };
  };

  const initThemeInfoOverlay = () => {
    if (!themeInfoOverlay || !themeInfoTriggers.length) return;
    const closeButton = themeInfoClose;
    const panel = themeInfoOverlay.querySelector(".theme-card-overlay__panel");
    let activeTrigger = null;

    const setOverlayState = (visible) => {
      themeInfoOverlay.classList.toggle("is-visible", visible);
      themeInfoOverlay.setAttribute("aria-hidden", String(!visible));
      if (visible) {
        themeInfoOverlay.removeAttribute("hidden");
        doc.addEventListener("keydown", handleKeydown);
      } else {
        themeInfoOverlay.setAttribute("hidden", "");
        doc.removeEventListener("keydown", handleKeydown);
      }
    };

    const focusCloseButton = () => {
      if (!closeButton) return;
      window.requestAnimationFrame(() => {
        closeButton.focus({ preventScroll: true });
      });
    };

    const openOverlay = (trigger) => {
      if (themeInfoOverlay.classList.contains("is-visible")) return;
      activeTrigger = trigger;
      trigger?.setAttribute("aria-expanded", "true");
      setOverlayState(true);
      focusCloseButton();
    };

    const closeOverlay = () => {
      if (!themeInfoOverlay.classList.contains("is-visible")) return;
      setOverlayState(false);
      if (activeTrigger) {
        activeTrigger.setAttribute("aria-expanded", "false");
        window.requestAnimationFrame(() => {
          activeTrigger?.focus({ preventScroll: true });
        });
      }
      activeTrigger = null;
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
      } else if (event.key === "Tab" && panel) {
        const focusable = Array.from(panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"));
        if (!focusable.length) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (event.shiftKey && doc.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && doc.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };

    themeInfoTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        const button = event.currentTarget;
        if (trigger.tagName.toLowerCase() === "button") {
          event.preventDefault();
        }
        if (themeInfoOverlay.classList.contains("is-visible") && button === activeTrigger) {
          closeOverlay();
        } else {
          openOverlay(button);
        }
      });
    });

    closeButton?.addEventListener("click", (event) => {
      event.preventDefault();
      closeOverlay();
    });

    themeInfoOverlay.addEventListener("click", (event) => {
      if (event.target === themeInfoOverlay) {
        closeOverlay();
      }
    });

    doc.addEventListener("click", (event) => {
      if (!themeInfoOverlay.classList.contains("is-visible")) {
        return;
      }
      if (themeInfoOverlay.contains(event.target)) {
        return;
      }
      if (activeTrigger && activeTrigger.contains(event.target)) {
        return;
      }
      closeOverlay();
    });

    setOverlayState(false);
  };

  const init = () => {
    // Defensive cleanup: remove stuck scroll-blocking classes or inline styles
    try {
      const stuckClasses = ['is-br-modal-open', 'is-nav-open'];
      stuckClasses.forEach((c) => {
        if (document.body.classList.contains(c)) document.body.classList.remove(c);
        if (document.documentElement.classList.contains(c)) document.documentElement.classList.remove(c);
      });
      // Reset inline styles that may lock scrolling
      if (document.body.style.position === 'fixed') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
      // Also clear overflow flags
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    } catch (_) {
      /* no-op */
    }
  initHtmlIncludes();
    initNav();
    initThemeToggle();
    initSmoothScroll();
    initHeaderObserver();
    initMobileSubnav();
    initHero();
    initReveal();
    initAccordion();
    // initOfferHub(); // Tabs entfernt – statische Zwei-Spalten-Variante
    initCarousel();
    initDisclosure();
    initStickyAboutFallback();
    initCustomCursor();
    initThemeInfoOverlay();
    initMobileStartScroll();
    initMobileCtasInTrustbar();
    initNoBounce();
    initCtaEnvelopeScroll();
    initCasesToggle();
    initMentalityCards();
    marqueeController = initMarquee();
    prefersReducedMotion.addEventListener("change", (event) => {
      const prefersReduced = event.matches;
      carouselAutoplay = !prefersReduced;
      applyReducedMotionToHero(prefersReduced);
      cursorState.isReducedMotion = prefersReduced;
      customCursor?.classList.toggle("is-reduced-motion", prefersReduced);
      if (prefersReduced) {
        stopCarousel();
        marqueeController?.stop();
        marqueeController?.reset();
      } else {
        startCarousel();
        marqueeController?.update();
        marqueeController?.start();
      }
    });
    doc.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navIsOpen) {
        closeNav();
      }
    });
  };

  // Re-run defensive cleanup shortly after init to catch late scripts that may set scroll lock
  const deferredCleanupRuns = [500, 1500, 3000];
  const runDeferredCleanup = () => {
    try {
      const stuckClasses = ['is-br-modal-open', 'is-nav-open'];
      stuckClasses.forEach((c) => {
        if (document.body.classList.contains(c)) document.body.classList.remove(c);
        if (document.documentElement.classList.contains(c)) document.documentElement.classList.remove(c);
      });
      if (document.body.style.position === 'fixed') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    } catch (_) { /* no-op */ }
  };
  deferredCleanupRuns.forEach((t) => setTimeout(runDeferredCleanup, t));

  // (debug helper removed for production)

  // Lightweight HTML include loader for shared components (e.g., profile/about section)
  function initHtmlIncludes() {
    const includeNodes = Array.from(document.querySelectorAll('[data-include]'));
    if (!includeNodes.length) return;
    includeNodes.forEach(async (host) => {
      const src = host.getAttribute('data-include');
      if (!src) return;
      try {
        const res = await fetch(src, { credentials: 'same-origin' });
        if (!res.ok) return;
        const html = await res.text();
        host.innerHTML = html;
        // Optional: configure video source via data attributes on host
        const videoSrc = host.getAttribute('data-video-src');
        const video = host.querySelector('video[data-profile-video]');
        if (video && videoSrc) {
          const source = document.createElement('source');
          source.src = videoSrc;
          source.type = 'video/mp4';
          video.appendChild(source);
        } else if (video && !videoSrc) {
          // Replace empty video with image fallback
          const img = document.createElement('img');
          const poster = video.getAttribute('poster') || '../Bilder/BIldRainer.jpg';
          img.src = poster;
          img.alt = '';
          img.loading = 'lazy';
          video.replaceWith(img);
        }
      } catch (_) {
        /* no-op */
      }
    });
  }

  // Mobile-only: handle subnav toggle for "Angebot" via plus button
  function initMobileSubnav() {
    const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;
    const toggles = Array.from(doc.querySelectorAll('.site-subnav__toggle'));
    const closeAll = () => {
      const items = Array.from(doc.querySelectorAll('.site-nav__item.has-submenu'));
      items.forEach((item) => {
        item.classList.remove('is-open');
        const btn = item.querySelector('.site-subnav__toggle');
        const icon = btn?.querySelector('.site-subnav__icon') || null;
        const sub = item.querySelector('.site-subnav');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = '+';
        if (sub) sub.setAttribute('hidden', '');
      });
    };
    const applyMode = () => {
      const sub = doc.getElementById('subnav-angebot');
      if (!sub) return;
      if (isDesktop()) {
        // Desktop hover menu: keep subnav available for CSS dropdown
        sub.removeAttribute('hidden');
      } else {
        // Mobile: keep closed until plus is tapped
        sub.setAttribute('hidden', '');
      }
    };
    toggles.forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const item = btn.closest('.site-nav__item.has-submenu');
        if (!item) return;
        const sub = item.querySelector('.site-subnav');
        const icon = btn.querySelector('.site-subnav__icon');
        const willOpen = !item.classList.contains('is-open');
        // One-open-at-a-time behavior
        closeAll();
        item.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (sub) {
          if (willOpen) sub.removeAttribute('hidden'); else sub.setAttribute('hidden', '');
        }
        if (icon) icon.textContent = willOpen ? '–' : '+';
      });
    });
    window.addEventListener('resize', applyMode);
    applyMode();
  }

  // Prevent iOS Safari top rubber-band (bounce) when pulling down at page top
  const initNoBounce = () => {
    // Strengere Erkennung für iOS/iPadOS: mac mit touchpoints ist nur iPadOS (MacIntel + touch)
    const isiOS = /iP(ad|hone|od)/.test(navigator.platform) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!isiOS) return;
    let startY = 0;
    const getScrollY = () => window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const hasScrollableAncestor = (node) => {
      let el = node instanceof Element ? node : node?.parentElement;
      while (el && el !== document.body) {
        try {
          const style = window.getComputedStyle(el);
          const overflowY = style.overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true;
        } catch (_) {
          // access denied? ignore and continue
        }
        el = el.parentElement;
      }
      return false;
    };

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startY = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      // only prevent when: at top of page, pulling down, event is cancelable and
      // there is no scrollable ancestor (so normal inner scrolling isn't affected)
      if (e.cancelable && getScrollY() <= 0 && deltaY > 0 && !hasScrollableAncestor(e.target)) {
        e.preventDefault();
      }
    };

  document.addEventListener('touchstart', onTouchStart, { passive: true });
  // Attach touchmove but be defensive inside handler (don't preventDefault unless cancelable and conditions match)
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  };

  // Mobile/tablet (no hover): Activate CTA envelope when its CENTER is near viewport center
  const initCtaEnvelopeScroll = () => {
    const mqCoarse = window.matchMedia('(pointer: coarse), (hover: none)');
    const section = document.querySelector('.section.cta');
    const media = section ? section.querySelector('.cta__media') : null;
    if (!section || !media) return;

    let rafId = null;
    let isActive = false;

    const evaluate = () => {
      rafId = null;
      if (!mqCoarse.matches) {
        if (isActive) { section.classList.remove('is-activated'); isActive = false; }
        return;
      }
      const rect = media.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const center = vh / 2;
      const mediaCenter = rect.top + rect.height / 2;
      const distance = Math.abs(mediaCenter - center);
      // Hysterese: früher öffnen, später schließen, damit kein Flackern
      const openThreshold = Math.max(90, Math.min(160, vh * 0.18));   // ca. 18% des Viewports
      const closeThreshold = Math.max(120, Math.min(200, vh * 0.26)); // ca. 26% des Viewports
      if (!isActive && distance <= openThreshold) {
        section.classList.add('is-activated');
        isActive = true;
      } else if (isActive && distance >= closeThreshold) {
        section.classList.remove('is-activated');
        isActive = false;
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(evaluate);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    if (typeof mqCoarse.addEventListener === 'function') {
      mqCoarse.addEventListener('change', onScroll);
    } else if (typeof mqCoarse.addListener === 'function') {
      mqCoarse.addListener(onScroll);
    }
    // Initial check
    onScroll();
  };

  // Fallback handler for mentality-card toggle via inline onclick (desktop/mobile)
  window.toggleMentalityCard = (btn) => {
    try {
      const card = btn.closest('.mentality-card');
      if (!card) return false;
      const body = card.querySelector('.mentality-card__body');
      if (!body) return false;
      const open = !card.classList.contains('is-open');
      card.classList.toggle('is-open', open);
      body.setAttribute('aria-hidden', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Weniger anzeigen' : 'Mehr anzeigen';
      if (open) {
        void body.offsetHeight;
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  // Toggle for mentality two-column cards
  const initMentalityCards = () => {
    const cards = Array.from(document.querySelectorAll('[data-mentality-card]'));
    if (!cards.length) return;
    cards.forEach((card) => {
      const body = card.querySelector('.mentality-card__body');
      const btn = card.querySelector('.mentality-card__toggle');
      if (!body || !btn) return;
      // initial collapsed
      body.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Mehr anzeigen';
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const open = !card.classList.contains('is-open');
        card.classList.toggle('is-open', open);
        body.setAttribute('aria-hidden', open ? 'false' : 'true');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.textContent = open ? 'Weniger anzeigen' : 'Mehr anzeigen';
        if (open) {
          // ensure transition
          void body.offsetHeight;
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  };

  // Scroll the initial mobile viewport slightly down on first visit
  const initMobileStartScroll = () => {
    const run = () => {
      if (window.location.hash) return; // respect deep links
      const currentY = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (currentY > 2) return; // user already scrolled or browser restored position
      const isMobile = window.matchMedia('(max-width: 540px)').matches;
      if (!isMobile) return;
      try {
        if (window.sessionStorage.getItem('initial-mobile-scroll') === '1') return;
      } catch (_) {}
      const prefersReduced = prefersReducedMotion.matches;
      const offset = Math.round(Math.min(120, Math.max(48, window.innerHeight * 0.08)));
      window.scrollTo({ top: offset, behavior: prefersReduced ? 'auto' : 'smooth' });
      try { window.sessionStorage.setItem('initial-mobile-scroll', '1'); } catch (_) {}
    };
    // Run after load so layout/hero activation is settled
    window.addEventListener('load', () => {
      // Small delay to avoid fighting with browser UI reveal on mobile
      setTimeout(() => window.requestAnimationFrame(run), 350);
    });
  };

  // Collapse/expand case cards' body text via 'Mehr anzeigen' toggle
  const initCasesToggle = () => {
    const grid = doc.querySelector('.cases__grid');
    if (!grid) return;
    if (grid.dataset.casesEnhanced === '1') return;
    grid.dataset.casesEnhanced = '1';
    const mqMobile = window.matchMedia('(max-width: 540px)');
    // Target all cards inside grid (robust against markup changes)
    const cards = Array.from(grid.querySelectorAll('.card'));

    const setupCard = (card) => {
      const actions = card.querySelector('.card__actions');
      if (!actions) return;
      let toggle = actions.querySelector('.card__toggle');
      let body = card.querySelector('.card__body');
      const mailtoLink = actions.querySelector('.card__link[href^="mailto:"]');

      // Wrap content into body if needed (all elements except H3 + actions up to actions)
      if (!body) {
        const children = Array.from(card.children);
        const contentEls = [];
        for (const el of children) {
          if (el === actions) break;
          if (el.tagName === 'H3') continue;
          contentEls.push(el);
        }
        if (contentEls.length) {
          body = doc.createElement('div');
          body.className = 'card__body';
          body.setAttribute('aria-hidden', 'true');
          contentEls.forEach((el) => body.appendChild(el));
          card.insertBefore(body, actions);
        }
      }

      if (!toggle) {
        toggle = doc.createElement('button');
        toggle.type = 'button';
        toggle.className = 'card__link card__toggle';
        actions.insertBefore(toggle, actions.firstChild);
      }
      if (!toggle || !body) return;

      const applyViewportState = () => {
        // Einheitlich für alle Viewports: geschlossen starten
        card.classList.remove('is-open');
        body.setAttribute('aria-hidden', 'true');
        setToggle(false);
        if (mailtoLink) mailtoLink.style.display = 'none';
        toggle.style.display = '';
      };

      applyViewportState();

      // Viewport-Wechsel: weiterhin geschlossen halten
      if (typeof mqMobile.addEventListener === 'function') {
        mqMobile.addEventListener('change', applyViewportState);
      } else if (typeof mqMobile.addListener === 'function') {
        mqMobile.addListener(applyViewportState);
      }

      function setToggle(open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Weniger anzeigen' : 'Mehr anzeigen';
      }
    };

    cards.forEach(setupCard);

    const toggleFromButton = (btn) => {
      const card = btn.closest('.card');
      if (!card) return;
      // Ensure body exists for this card
      let actions = card.querySelector('.card__actions');
      let body = card.querySelector('.card__body');
      if (!actions) return;
      if (!body) {
        const children = Array.from(card.children);
        const contentEls = [];
        for (const el of children) {
          if (el === actions) break;
          if (el.tagName === 'H3') continue;
          contentEls.push(el);
        }
        if (contentEls.length) {
          body = doc.createElement('div');
          body.className = 'card__body';
          body.setAttribute('aria-hidden', 'true');
          contentEls.forEach((el) => body.appendChild(el));
          card.insertBefore(body, actions);
        }
      }
      const mailto = actions.querySelector('.card__link[href^="mailto:"]');
      const open = !card.classList.contains('is-open');
      card.classList.toggle('is-open', open);
      if (body) body.setAttribute('aria-hidden', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Weniger anzeigen' : 'Mehr anzeigen';
      if (mailto) mailto.style.display = open ? '' : 'none';
      if (body) void body.offsetHeight;
      if (open) {
        card.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
      }
    };

    // Event delegation: ensure clicks on dynamically inserted toggles work reliably
    const handleGridClick = (ev) => {
      const btn = (ev.target instanceof Element) ? ev.target.closest('.card__toggle') : null;
      if (!btn) return;
      ev.preventDefault();
      toggleFromButton(btn);
    };

    grid.addEventListener('click', handleGridClick);

    // Also bind direct listeners on existing toggles
    Array.from(grid.querySelectorAll('.card__toggle')).forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        toggleFromButton(btn);
      });
    });
  };

  // Fallback: inline handler for buttons in markup
  window.toggleCaseCard = (btn) => {
    try {
      const card = btn.closest('.card');
      if (!card) return false;
      const actions = card.querySelector('.card__actions');
      let body = card.querySelector('.card__body');
      if (!actions) return false;
      // Ensure body exists
      if (!body) {
        const children = Array.from(card.children);
        const contentEls = [];
        for (const el of children) {
          if (el === actions) break;
          if (el.tagName === 'H3') continue;
          contentEls.push(el);
        }
        if (contentEls.length) {
          body = document.createElement('div');
          body.className = 'card__body';
          body.setAttribute('aria-hidden', 'true');
          contentEls.forEach((el) => body.appendChild(el));
          card.insertBefore(body, actions);
        }
      }
      const mailto = actions.querySelector('.card__link[href^="mailto:"]');
      const nowOpen = !card.classList.contains('is-open');
      card.classList.toggle('is-open', nowOpen);
      if (body) body.setAttribute('aria-hidden', nowOpen ? 'false' : 'true');
      btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      btn.textContent = nowOpen ? 'Weniger anzeigen' : 'Mehr anzeigen';
      if (mailto) mailto.style.display = nowOpen ? '' : 'none';
      if (nowOpen) {
        // kick transition and scroll into view
        if (body) void body.offsetHeight;
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return false;
    } catch (_) {
      return false;
    }
  };

  doc.addEventListener("DOMContentLoaded", init);
})();
