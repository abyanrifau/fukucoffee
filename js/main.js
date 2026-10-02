/* ==========================================================================
   FUKU COFFEE — main.js
   Small, dependency-free behaviours:
     1. Sticky header state on scroll
     2. Mobile navigation toggle
     3. IntersectionObserver scroll-reveal (respects prefers-reduced-motion)
     4. Front-end-only reservation inquiry form (events.html)
     5. Footer year
   ========================================================================== */

(function () {
  'use strict';

  // Mark the document as JS-enabled so reveal styles only apply when they can
  // be resolved. If this script never runs, content stays visible.
  document.documentElement.classList.add('js');

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. Sticky header — add a subtle shadow/background once scrolled
     ------------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  if (header) {
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ------------------------------------------------------------------------
     2. Mobile navigation
     ------------------------------------------------------------------------ */
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNav(!isOpen);
    });

    // Close on Escape, on outside click, and when resizing back to desktop.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 832) setNav(false);
    });
  }

  /* ------------------------------------------------------------------------
     3. Scroll reveal
        Elements with .reveal fade + slide up as they enter the viewport.
        Add data-delay="1|2|3" for a gentle stagger.
     ------------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      );
      revealEls.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ------------------------------------------------------------------------
     4. Reservation inquiry form (no backend — shows a confirmation state)
     ------------------------------------------------------------------------ */
  var form = document.getElementById('reservation-form');
  var success = document.getElementById('reservation-success');

  if (form && success) {
    // Prevent past dates being chosen.
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput) {
      var today = new Date();
      var iso = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
      dateInput.min = iso;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var date = (data.get('date') || '').toString();
      var party = (data.get('party') || '').toString();

      // Friendly date, e.g. "Saturday, 14 September"
      var prettyDate = date;
      if (date) {
        var parts = date.split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        try {
          prettyDate = d.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long'
          });
        } catch (err) { /* keep ISO string */ }
      }

      // Ticket-style reference number (purely cosmetic)
      var ref = 'FK-' + String(Math.floor(1000 + Math.random() * 9000));

      var nameEl = success.querySelector('[data-success-name]');
      var detailEl = success.querySelector('[data-success-detail]');
      var refEl = success.querySelector('[data-success-ref]');

      if (nameEl) nameEl.textContent = name ? name.split(' ')[0] : 'there';
      if (detailEl) {
        detailEl.textContent = prettyDate + (party ? ' · ' + party : '');
      }
      if (refEl) refEl.textContent = 'Inquiry ' + ref;

      form.hidden = true;
      success.hidden = false;
      success.setAttribute('tabindex', '-1');
      success.focus({ preventScroll: false });
    });

    var resetBtn = success.querySelector('[data-success-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        success.hidden = true;
        form.hidden = false;
        var first = form.querySelector('input, select, textarea');
        if (first) first.focus();
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. Footer year
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
