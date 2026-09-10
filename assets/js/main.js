/* ============================================================
   Neural Void — Main JS v2.1
   Accessible, robust vanilla JavaScript for UI interactions.
   ============================================================ */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* --- Header scroll effect --- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Mobile nav toggle & accessibility --- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    let previousBodyOverflow = '';
    const mobileMenu = () => window.matchMedia('(max-width: 768px)').matches;
    if (!navLinks.id) navLinks.id = 'site-menu';
    toggle.setAttribute('aria-controls', navLinks.id);

    const closeNav = (returnFocus = false) => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      toggle.textContent = '\u2630';
      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus) toggle.focus();
    };

    const openNav = () => {
      previousBodyOverflow = document.body.style.overflow;
      navLinks.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      toggle.textContent = '\u2715';
      document.body.style.overflow = 'hidden';
      const firstLink = navLinks.querySelector('a');
      if (firstLink) firstLink.focus();
    };

    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeNav(false);
      } else {
        openNav();
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeNav(false);
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav(true);
        return;
      }

      if (e.key === 'Tab' && navLinks.classList.contains('open') && mobileMenu()) {
        const links = [toggle, ...navLinks.querySelectorAll('a:not([disabled])')];
        if (!links.length) return;
        const first = links[0];
        const last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (!mobileMenu() && navLinks.classList.contains('open')) closeNav(false);
    });
  }

  /* --- Scroll reveal with fallback --- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      reveals.forEach(el => observer.observe(el));
    } else {
      reveals.forEach(el => el.classList.add('visible'));
    }

    // Safety fallback: ensure nothing stays invisible after 2.5s
    setTimeout(() => {
      reveals.forEach(el => el.classList.add('visible'));
    }, 2500);
  }

  /* --- Smooth scroll for same-page anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = 88; // header height buffer
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  /* --- Homepage: deterministic, illustrative Scope Swap demo --- */
  const demoButton = document.querySelector('[data-scope-demo]');
  if (demoButton) {
    const badge = document.getElementById('demo-badge');
    const afterAdded = document.getElementById('demo-injected');
    const afterRemoval = document.getElementById('demo-forecast');

    const renderDemo = (isBalanced) => {
      demoButton.setAttribute('aria-pressed', String(isBalanced));
      if (isBalanced) {
        badge.textContent = 'Balanced: 8 SP removed';
        badge.className = 'hero-demo-status balanced';
        afterAdded.textContent = '40 SP';
        afterAdded.className = 'hero-demo-stat-value is-warning';
        afterRemoval.textContent = '32 SP';
        afterRemoval.className = 'hero-demo-stat-value is-balanced';
        demoButton.textContent = 'Reset Scope Swap demo';
      } else {
        badge.textContent = 'Sample: +8 SP added';
        badge.className = 'hero-demo-status warning';
        afterAdded.textContent = '40 SP';
        afterAdded.className = 'hero-demo-stat-value is-warning';
        afterRemoval.textContent = 'Remove 8 SP';
        afterRemoval.className = 'hero-demo-stat-value is-warning';
        demoButton.textContent = 'Run Scope Swap demo';
      }
    };

    demoButton.addEventListener('click', () => {
      renderDemo(demoButton.getAttribute('aria-pressed') !== 'true');
    });
  }

  /* --- Homepage: language selection for translated Jira catalog descriptions --- */
  const languageButtons = document.querySelectorAll('[data-lang-btn]');
  if (languageButtons.length) {
    const setCatalogLanguage = (lang) => {
      document.querySelectorAll('.suite-lang-block').forEach((block) => {
        const active = block.getAttribute('data-lang') === lang;
        block.setAttribute('lang', block.getAttribute('data-lang'));
        block.hidden = !active;
        if (active) block.style.removeProperty('display');
      });
      languageButtons.forEach((button) => {
        const active = button.getAttribute('data-lang-btn') === lang;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      try { localStorage.setItem('nv_lang', lang); } catch (e) { /* Storage is optional. */ }
    };

    let savedLanguage = 'en';
    try {
      const saved = localStorage.getItem('nv_lang');
      if (saved === 'de' || saved === 'ru' || saved === 'en') savedLanguage = saved;
    } catch (e) { /* English remains the accessible default. */ }
    setCatalogLanguage(savedLanguage);
    languageButtons.forEach((button) => {
      button.addEventListener('click', () => setCatalogLanguage(button.getAttribute('data-lang-btn')));
    });
  }
})();

