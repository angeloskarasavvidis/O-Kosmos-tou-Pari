/**
 * Ο Κόσμος του Πάρη — behavior layer.
 * Handles: mobile nav sheet, accessibility widget, directory live
 * search, newsletter demo form, and staggered scroll reveal.
 * Loaded with `defer` at the end of <head> — DOM is guaranteed ready.
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     Focus-trap helper — shared by the mobile sheet and the
     accessibility panel so both close cleanly on Esc and keep
     Tab cycling inside the open surface.
     ---------------------------------------------------------- */
  function trapFocus(container, closeFn) {
    function handleKeydown(e) {
      if (e.key === "Escape") {
        closeFn();
        return;
      }
      if (e.key !== "Tab") return;
      var focusables = container.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    container.addEventListener("keydown", handleKeydown);
    return function cleanup() {
      container.removeEventListener("keydown", handleKeydown);
    };
  }

  /* ----------------------------------------------------------
     Mobile navigation sheet
     ---------------------------------------------------------- */
  var menuToggle = document.getElementById("menuToggle");
  var navSheet = document.getElementById("navSheet");
  var navSheetClose = document.getElementById("navSheetClose");
  var navSheetCleanup = null;

  function openNavSheet() {
    navSheet.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    navSheet.removeAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
    navSheetCleanup = trapFocus(navSheet, closeNavSheet);
    var firstLink = navSheet.querySelector(".nav-sheet__link");
    if (firstLink) firstLink.focus();
  }
  function closeNavSheet() {
    navSheet.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (navSheetCleanup) navSheetCleanup();
    menuToggle.focus();
  }
  menuToggle.addEventListener("click", function () {
    if (navSheet.classList.contains("is-open")) closeNavSheet();
    else openNavSheet();
  });
  navSheetClose.addEventListener("click", closeNavSheet);
  navSheet.querySelectorAll(".nav-sheet__link").forEach(function (link) {
    link.addEventListener("click", closeNavSheet);
  });

  /* ----------------------------------------------------------
     Accessibility widget
     ---------------------------------------------------------- */
  var a11yToggle = document.getElementById("a11yToggle");
  var a11yPanel = document.getElementById("a11yPanel");
  var a11yClose = document.getElementById("a11yClose");
  var a11yCleanup = null;
  var root = document.documentElement;

  function openA11yPanel() {
    a11yPanel.classList.add("is-open");
    a11yToggle.setAttribute("aria-expanded", "true");
    a11yCleanup = trapFocus(a11yPanel, closeA11yPanel);
  }
  function closeA11yPanel() {
    a11yPanel.classList.remove("is-open");
    a11yToggle.setAttribute("aria-expanded", "false");
    if (a11yCleanup) a11yCleanup();
    a11yToggle.focus();
  }
  a11yToggle.addEventListener("click", function () {
    if (a11yPanel.classList.contains("is-open")) closeA11yPanel();
    else openA11yPanel();
  });
  a11yClose.addEventListener("click", closeA11yPanel);
  document.addEventListener("click", function (e) {
    if (
      a11yPanel.classList.contains("is-open") &&
      !a11yPanel.contains(e.target) &&
      e.target !== a11yToggle &&
      !a11yToggle.contains(e.target)
    ) {
      closeA11yPanel();
    }
  });

  /* ----------------------------------------------------------
     Scroll-driven chrome: the header hides on scroll down and
     reappears on scroll up; the accessibility toggle shrinks to
     an icon-only circle on scroll down and expands back on scroll
     up. Both stay in their expanded state near the top of the
     page, and the accessibility toggle never collapses while its
     panel is open (don't shrink the button a user is reading).
     ---------------------------------------------------------- */
  var siteHeader = document.querySelector(".site-header");
  var lastScrollY = window.scrollY;
  var headerHideThreshold = siteHeader.offsetHeight;
  var compactThreshold = 80;
  var scrollTicking = false;

  function updateScrollChrome() {
    var currentScrollY = window.scrollY;
    var scrollingDown = currentScrollY > lastScrollY;

    if (navSheet.classList.contains("is-open") || currentScrollY < headerHideThreshold) {
      siteHeader.classList.remove("is-hidden");
    } else if (scrollingDown) {
      siteHeader.classList.add("is-hidden");
    } else {
      siteHeader.classList.remove("is-hidden");
    }

    if (a11yPanel.classList.contains("is-open") || currentScrollY < compactThreshold) {
      a11yToggle.classList.remove("is-compact");
    } else if (scrollingDown) {
      a11yToggle.classList.add("is-compact");
    } else {
      a11yToggle.classList.remove("is-compact");
    }

    lastScrollY = currentScrollY;
    scrollTicking = false;
  }

  window.addEventListener("scroll", function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollChrome);
      scrollTicking = true;
    }
  }, { passive: true });

  // Font-size stepper
  var fontSteps = document.querySelectorAll(".a11y-step");
  function applyFontStep(step) {
    root.classList.remove("a11y-font-2", "a11y-font-3");
    if (step === "2") root.classList.add("a11y-font-2");
    if (step === "3") root.classList.add("a11y-font-3");
    fontSteps.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.fontStep === step));
    });
    try { localStorage.setItem("okp-font-step", step); } catch (e) {}
  }
  fontSteps.forEach(function (btn) {
    btn.addEventListener("click", function () { applyFontStep(btn.dataset.fontStep); });
  });

  // High-contrast switch
  var contrastSwitch = document.getElementById("contrastSwitch");
  function applyContrast(on) {
    root.classList.toggle("a11y-contrast", on);
    contrastSwitch.setAttribute("aria-checked", String(on));
    try { localStorage.setItem("okp-contrast", on ? "1" : "0"); } catch (e) {}
  }
  contrastSwitch.addEventListener("click", function () {
    applyContrast(contrastSwitch.getAttribute("aria-checked") !== "true");
  });

  // Dyslexic-friendly font switch
  var dyslexicSwitch = document.getElementById("dyslexicSwitch");
  function applyDyslexic(on) {
    root.classList.toggle("a11y-dyslexic", on);
    dyslexicSwitch.setAttribute("aria-checked", String(on));
    try { localStorage.setItem("okp-dyslexic", on ? "1" : "0"); } catch (e) {}
  }
  dyslexicSwitch.addEventListener("click", function () {
    applyDyslexic(dyslexicSwitch.getAttribute("aria-checked") !== "true");
  });

  // Sync widget UI with whatever a11y-init.js already applied pre-paint
  (function syncFromStoredState() {
    var step = "1";
    if (root.classList.contains("a11y-font-2")) step = "2";
    if (root.classList.contains("a11y-font-3")) step = "3";
    fontSteps.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.fontStep === step));
    });
    contrastSwitch.setAttribute("aria-checked", String(root.classList.contains("a11y-contrast")));
    dyslexicSwitch.setAttribute("aria-checked", String(root.classList.contains("a11y-dyslexic")));
  })();

  document.getElementById("a11yReset").addEventListener("click", function () {
    applyFontStep("1");
    applyContrast(false);
    applyDyslexic(false);
  });

  /* ----------------------------------------------------------
     Theme switch (light / dark / system) — footer control.
     "System" clears the explicit override and lets the
     prefers-color-scheme media query in styles.css decide.
     ---------------------------------------------------------- */
  var themeOptions = document.querySelectorAll(".theme-switch__option");
  function applyTheme(choice) {
    if (choice === "light" || choice === "dark") {
      root.setAttribute("data-theme", choice);
    } else {
      root.removeAttribute("data-theme");
    }
    themeOptions.forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.dataset.themeChoice === choice));
    });
    try { localStorage.setItem("okp-theme", choice); } catch (e) {}
  }
  themeOptions.forEach(function (btn) {
    btn.addEventListener("click", function () { applyTheme(btn.dataset.themeChoice); });
  });
  // Reflect whatever a11y-init.js already applied pre-paint (or the
  // "system" default if nothing was ever stored).
  (function syncThemeFromStoredState() {
    var stored = null;
    try { stored = localStorage.getItem("okp-theme"); } catch (e) {}
    var current = (stored === "light" || stored === "dark") ? stored : "system";
    themeOptions.forEach(function (btn) {
      btn.setAttribute("aria-checked", String(btn.dataset.themeChoice === current));
    });
  })();

  /* ----------------------------------------------------------
     Directory live search / filter — only present on pages that
     ship the directory grid (currently index.html, directory.html).
     ---------------------------------------------------------- */
  var searchInput = document.getElementById("directorySearchInput");
  if (searchInput) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".directory-card"));
    var resultsEl = document.getElementById("directoryResults");
    var emptyEl = document.getElementById("directoryEmpty");

    searchInput.addEventListener("input", function () {
      var query = searchInput.value.trim().toLowerCase();
      var visibleCount = 0;
      cards.forEach(function (card) {
        var haystack = (card.dataset.search + " " + card.querySelector(".directory-card__title").textContent).toLowerCase();
        var match = query === "" || haystack.indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visibleCount += 1;
      });
      if (query === "") {
        resultsEl.hidden = false;
        resultsEl.textContent = "Εμφανίζονται και οι 8 κατηγορίες";
        emptyEl.hidden = true;
      } else if (visibleCount === 0) {
        resultsEl.hidden = true;
        emptyEl.hidden = false;
      } else {
        resultsEl.hidden = false;
        emptyEl.hidden = true;
        resultsEl.textContent = visibleCount + " από 8 κατηγορίες ταιριάζουν με «" + searchInput.value.trim() + "»";
      }
    });
  }

  /* ----------------------------------------------------------
     Newsletter form — demo-only, no network call. Only present
     on pages that ship the CTA band (currently index.html,
     about.html).
     ---------------------------------------------------------- */
  var ctaForm = document.getElementById("ctaForm");
  if (ctaForm) {
    var ctaConfirm = document.getElementById("ctaConfirm");
    ctaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      ctaConfirm.hidden = false;
      ctaForm.reset();
    });
  }

  /* ----------------------------------------------------------
     Staggered scroll reveal (skipped entirely under
     prefers-reduced-motion, per the guardrail in styles.css)
     ---------------------------------------------------------- */
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var siblings = Array.prototype.slice.call(
              entry.target.parentElement.querySelectorAll(".reveal")
            );
            var index = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = Math.min(index, 4) * 90 + "ms";
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }
})();
