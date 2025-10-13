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
  const heroSection = doc.querySelector("[data-js-hero]");
  const heroStages = heroSection ? Array.from(heroSection.querySelectorAll("[data-hero-stage]")) : [];
  const heroParallax = heroSection?.querySelector("[data-hero-parallax]") || null;
  const heroPortrait = heroSection?.querySelector(".hero__portrait") || null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let navFocusElements = [];
  let navFocusIndex = 0;
  let navIsOpen = false;
  let lastFocusedElement = null;
  let carouselIndex = 0;
  let carouselTimer = null;
  let carouselAutoplay = !prefersReducedMotion.matches;
  let marqueeController = null;
  const heroState = {
    observer: null,
    isActive: false,
    parallaxRaf: null,
  };

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
    }
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
    carouselTrack.style.gridTemplateColumns = `repeat(${items.length}, 100%)`;
    goToSlide(0);
    if (carouselPrev) {
      carouselPrev.addEventListener("click", () => {
        goToSlide(carouselIndex - 1);
      });
    }
    if (carouselNext) {
      carouselNext.addEventListener("click", () => {
        goToSlide(carouselIndex + 1);
      });
    }
    if (carouselToggle) {
      carouselToggle.addEventListener("click", () => {
        const isPaused = carouselToggle.getAttribute("aria-pressed") === "true";
        if (isPaused) {
          carouselToggle.setAttribute("aria-pressed", "false");
          carouselAutoplay = true;
          startCarousel();
        } else {
          carouselToggle.setAttribute("aria-pressed", "true");
          carouselAutoplay = false;
          stopCarousel();
        }
      });
    }
    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);
    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", () => {
      if (!carousel.contains(doc.activeElement)) startCarousel();
    });
    startCarousel();
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
    let activeTab = tabs.find((tab) => tab.classList.contains("is-active")) || null;
    if (!activeTab && tabs.length) {
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
    const pixelsPerSecond = 40;
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
      if (rafId !== null || prefersReducedMotion.matches) return;
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

  const init = () => {
    initNav();
    initThemeToggle();
    initSmoothScroll();
    initHeaderObserver();
    initHero();
    initReveal();
    initAccordion();
    initOfferHub();
    initCarousel();
    marqueeController = initMarquee();
    prefersReducedMotion.addEventListener("change", (event) => {
      const prefersReduced = event.matches;
      carouselAutoplay = !prefersReduced;
      applyReducedMotionToHero(prefersReduced);
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

  doc.addEventListener("DOMContentLoaded", init);
})();
