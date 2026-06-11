// Offer cards interaction (extracted from inline script in index.html)
(() => {
  const cards = Array.from(document.querySelectorAll('[data-offer-card]'));
  const grid = document.querySelector('[data-offer-grid]');
  const details = document.querySelector('[data-offer-details]');
  const pointerCoarse = window.matchMedia('(pointer: coarse)');

  const isTouchLike = () => pointerCoarse.matches;

  const setDetailsState = (card, expanded) => {
    const panel = card.querySelector('.offer-card__details');
    if (panel) {
      panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    }
  };

  const openCard = (card) => {
    card.classList.add('is-open');
    card.setAttribute('aria-expanded', 'true');
    setDetailsState(card, true);
  };

  const collapseCard = (card) => {
    card.classList.remove('is-open');
    card.setAttribute('aria-expanded', 'false');
    setDetailsState(card, false);
  };

  const closeCards = (except) => {
    cards.forEach((card) => {
      if (!except || card !== except) {
        collapseCard(card);
      }
    });
  };

  if (typeof pointerCoarse.addEventListener === 'function') {
    pointerCoarse.addEventListener('change', () => {
      if (!isTouchLike()) {
        closeCards();
      }
    });
  }

  // 3D tilt on desktop
  const TILT_MAX = 7;
  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 120ms ease-out, box-shadow 320ms ease';
    });

    card.addEventListener('mousemove', (e) => {
      if (isTouchLike()) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 2 * TILT_MAX;
      const rotateX = (0.5 - (y / rect.height)) * 2 * TILT_MAX;
      card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 500ms ease, box-shadow 320ms ease';
      card.style.transform = '';
    });
  });

  cards.forEach((card) => {
    card.addEventListener('focus', () => {
      if (!card.classList.contains('is-open')) {
        card.setAttribute('aria-expanded', 'true');
        setDetailsState(card, true);
      }
    });

    card.addEventListener('blur', () => {
      if (!card.classList.contains('is-open')) {
        card.setAttribute('aria-expanded', 'false');
        setDetailsState(card, false);
      }
    });

    card.addEventListener('click', (event) => {
      if (!isTouchLike()) {
        closeCards();
        return;
      }

      if (!card.classList.contains('is-open')) {
        event.preventDefault();
        closeCards();
        openCard(card);
        return;
      }

      closeCards();
    });
  });

  const prepareDetailsReveal = () => {
    if (!details) {
      return;
    }
    details.dataset.animate = 'true';

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(details);
    } else {
      details.classList.add('is-visible');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareDetailsReveal);
  } else {
    prepareDetailsReveal();
  }
})();

