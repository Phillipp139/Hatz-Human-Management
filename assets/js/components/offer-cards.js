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

