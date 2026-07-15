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
     "Αναζήτηση Υπηρεσιών" nav dropdown — desktop only (the
     dropdown trigger doesn't exist in the mobile sheet, which
     links straight to directory.html instead).
     ---------------------------------------------------------- */
  var servicesDropdownTrigger = document.getElementById("servicesDropdownTrigger");
  var servicesDropdown = document.getElementById("servicesDropdown");
  if (servicesDropdownTrigger && servicesDropdown) {
    var servicesDropdownCleanup = null;

    function openServicesDropdown() {
      servicesDropdown.classList.add("is-open");
      servicesDropdownTrigger.setAttribute("aria-expanded", "true");
      servicesDropdownCleanup = trapFocus(servicesDropdown, closeServicesDropdown);
    }
    function closeServicesDropdown() {
      servicesDropdown.classList.remove("is-open");
      servicesDropdownTrigger.setAttribute("aria-expanded", "false");
      if (servicesDropdownCleanup) servicesDropdownCleanup();
    }
    servicesDropdownTrigger.addEventListener("click", function () {
      if (servicesDropdown.classList.contains("is-open")) closeServicesDropdown();
      else openServicesDropdown();
    });
    document.addEventListener("click", function (e) {
      if (
        servicesDropdown.classList.contains("is-open") &&
        !servicesDropdown.contains(e.target) &&
        e.target !== servicesDropdownTrigger &&
        !servicesDropdownTrigger.contains(e.target)
      ) {
        closeServicesDropdown();
      }
    });
  }

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
     "Ρώτα τον Ειδικό" form — demo-only, no network call. Only
     present on ask-expert.html.
     ---------------------------------------------------------- */
  var askExpertForm = document.getElementById("askExpertForm");
  if (askExpertForm) {
    var askExpertConfirm = document.getElementById("askExpertConfirm");
    askExpertForm.addEventListener("submit", function (e) {
      e.preventDefault();
      askExpertConfirm.hidden = false;
      askExpertForm.reset();
    });
  }

  /* ----------------------------------------------------------
     WordPress feed — powers the "Νέα" and "Άρθρα" grids from the
     live okosmostoupari.gr REST API (categories 267 and 78).
     Only runs on pages that ship one of the two grid containers.
     ---------------------------------------------------------- */
  var WP_API_POSTS = "https://okosmostoupari.gr/wp-json/wp/v2/posts";
  var WP_CATEGORY_NEWS = 267;
  var WP_CATEGORY_ARTICLES = 78;
  var WP_PAGE_SIZE = 9;

  function wpHtmlToText(html) {
    var doc = new DOMParser().parseFromString(html || "", "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  function wpFormatDate(iso) {
    return new Date(iso).toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
  }

  function wpCategoryLabel(post, fallback) {
    var terms = post._embedded && post._embedded["wp:term"] && post._embedded["wp:term"][0];
    if (terms) {
      for (var i = 0; i < terms.length; i++) {
        if (terms[i].taxonomy === "category" && terms[i].slug !== "uncategorized") {
          return terms[i].name;
        }
      }
    }
    return fallback;
  }

  function wpFeaturedImageUrl(post) {
    var media = post._embedded && post._embedded["wp:featuredmedia"] && post._embedded["wp:featuredmedia"][0];
    if (!media) return null;
    var sizes = media.media_details && media.media_details.sizes;
    if (sizes) {
      if (sizes.medium_large) return sizes.medium_large.source_url;
      if (sizes.medium) return sizes.medium.source_url;
    }
    return media.source_url || null;
  }

  function wpBuildCard(post, showDate, tagFallback, showImage) {
    var article = document.createElement("article");
    article.className = "editorial-card";

    var media = document.createElement("div");
    media.className = "editorial-card__media";
    media.setAttribute("aria-hidden", "true");
    if (showImage) {
      var imageUrl = wpFeaturedImageUrl(post);
      if (imageUrl) {
        media.classList.add("editorial-card__media--photo");
        media.style.backgroundImage = "url('" + imageUrl + "')";
      }
    }

    var body = document.createElement("div");
    body.className = "editorial-card__body";

    var meta = document.createElement("div");
    meta.className = "editorial-card__meta";
    var tag = document.createElement("span");
    tag.className = "editorial-card__tag";
    tag.textContent = wpCategoryLabel(post, tagFallback);
    meta.appendChild(tag);
    if (showDate) {
      var dateSpan = document.createElement("span");
      dateSpan.textContent = wpFormatDate(post.date);
      meta.appendChild(dateSpan);
    }

    var title = document.createElement("h3");
    title.className = "editorial-card__title";
    title.textContent = wpHtmlToText(post.title.rendered);

    var desc = document.createElement("p");
    desc.className = "editorial-card__desc";
    desc.textContent = wpHtmlToText(post.excerpt.rendered);

    var link = document.createElement("a");
    link.className = "editorial-card__link";
    link.href = post.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.appendChild(document.createTextNode("Διαβάστε Περισσότερα "));
    var arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.appendChild(arrow);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(link);
    article.appendChild(media);
    article.appendChild(body);
    return article;
  }

  function initWpFeed(gridId, loadMoreId, categoryId, showDate, tagFallback, showImage) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    var loadMoreBtn = document.getElementById(loadMoreId);
    var page = 1;
    var totalPages = 1;
    var loading = false;

    function showStatus(message) {
      grid.innerHTML = "";
      var status = document.createElement("p");
      status.className = "editorial-status";
      status.setAttribute("role", "status");
      status.textContent = message;
      grid.appendChild(status);
    }

    function loadPage() {
      if (loading) return;
      loading = true;
      if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = "Φόρτωση…";
      }
      var url = WP_API_POSTS + "?_embed&categories=" + categoryId + "&per_page=" + WP_PAGE_SIZE + "&page=" + page;
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error("wp-fetch-failed");
          totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1", 10);
          return res.json();
        })
        .then(function (posts) {
          if (page === 1) grid.innerHTML = "";
          if (page === 1 && !posts.length) {
            showStatus("Δεν υπάρχουν διαθέσιμες αναρτήσεις αυτή τη στιγμή.");
          } else {
            posts.forEach(function (post) {
              grid.appendChild(wpBuildCard(post, showDate, tagFallback, showImage));
            });
          }
          loading = false;
          if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = "Φόρτωση περισσότερων";
            loadMoreBtn.hidden = page >= totalPages;
          }
        })
        .catch(function () {
          loading = false;
          if (page === 1) {
            grid.innerHTML = "";
            var status = document.createElement("p");
            status.className = "editorial-status";
            status.setAttribute("role", "status");
            status.appendChild(document.createTextNode("Δεν ήταν δυνατή η φόρτωση του περιεχομένου αυτή τη στιγμή. Δείτε το απευθείας στο "));
            var siteLink = document.createElement("a");
            siteLink.href = "https://okosmostoupari.gr";
            siteLink.target = "_blank";
            siteLink.rel = "noopener";
            siteLink.textContent = "okosmostoupari.gr";
            status.appendChild(siteLink);
            status.appendChild(document.createTextNode("."));
            grid.appendChild(status);
          }
          if (loadMoreBtn) loadMoreBtn.hidden = true;
        });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", function () {
        page += 1;
        loadPage();
      });
    }
    loadPage();
  }

  initWpFeed("newsGrid", "newsLoadMore", WP_CATEGORY_NEWS, true, "Νέα", false);
  initWpFeed("articlesGrid", "articlesLoadMore", WP_CATEGORY_ARTICLES, false, "Άρθρο", true);

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
