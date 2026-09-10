/* ============================================================
   Neural Void — Main JS v2.1
   Accessible, robust vanilla JavaScript for UI interactions.
   ============================================================ */

(function () {
  'use strict';

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
    const closeNav = (returnFocus = false) => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '\u2630';
      document.body.style.overflow = '';
      if (returnFocus) toggle.focus();
    };

    const openNav = () => {
      navLinks.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = '\u2715';
      document.body.style.overflow = 'hidden';
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
      }
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
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

