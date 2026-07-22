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
     Primary nav dropdowns ("Υπηρεσίες", "Η Κοινότητά μας") —
     desktop only (neither exists in the mobile sheet, which lists
     their destinations as flat links instead).
     Open on hover or keyboard focus, close on mouse-leave, blur,
     or Escape — no click-to-toggle, so a stray click never leaves
     one stuck open.
     ---------------------------------------------------------- */
  document.querySelectorAll(".primary-nav__item--dropdown").forEach(function (item) {
    var trigger = item.querySelector(".primary-nav__trigger");
    var dropdown = item.querySelector(".nav-dropdown");
    if (!trigger || !dropdown) return;
    var closeTimer = null;

    function open() {
      clearTimeout(closeTimer);
      dropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }
    function close() {
      dropdown.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, 150);
    }

    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", scheduleClose);
    item.addEventListener("focusin", open);
    item.addEventListener("focusout", function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        close();
        trigger.focus();
      }
    });
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
     WPForms bridge — submits real-site forms straight to the
     matching live WPForms form on okosmostoupari.gr. WPForms
     doesn't expose a public REST API for entries, so this
     replicates its own client-side submit contract instead: pull
     a fresh anti-spam token from the public "wpforms_get_token"
     ajax action, then POST the field values as multipart form
     data to admin-ajax.php's "wpforms_submit" action — the same
     two calls WPForms' own frontend JS makes when a form is
     embedded on a WP page. Only works when this site is served
     from the same origin as the WordPress install (admin-ajax.php
     sends no CORS headers), so it fails under a local/dev server
     on a different origin.
     Used by: askExpertForm (Ρώτα τον Ειδικό) and
     supportVolunteerForm (Στηρίζω τον κόσμο του Πάρη).
     ---------------------------------------------------------- */
  var WPFORMS_AJAX_URL = "https://okosmostoupari.gr/wp-admin/admin-ajax.php";

  function getWpFormsToken(formId) {
    var body = new URLSearchParams();
    body.set("action", "wpforms_get_token");
    body.set("formId", formId);
    return fetch(WPFORMS_AJAX_URL, { method: "POST", body: body })
      .then(function (res) {
        if (!res.ok) throw new Error("wpforms-token-http-" + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success || !data.data || !data.data.token) {
          throw new Error("wpforms-token-failed");
        }
        return data.data.token;
      });
  }

  function initWpFormsForm(opts) {
    var confirmEl = document.getElementById(opts.confirmId);
    var errorEl = document.getElementById(opts.errorId);
    var submitBtn = opts.form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.textContent;
    var startTime = Math.floor(Date.now() / 1000);

    opts.form.addEventListener("submit", function (e) {
      e.preventDefault();
      confirmEl.hidden = true;
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Αποστολή…";

      getWpFormsToken(opts.formId)
        .then(function (token) {
          var fd = new FormData();
          fd.append("action", "wpforms_submit");
          fd.append("wpforms[id]", opts.formId);
          opts.fields.forEach(function (field) {
            fd.append("wpforms[fields][" + field.wpField + "]", opts.form.elements[field.name].value);
          });
          if (opts.checkbox && opts.form.elements[opts.checkbox.name].checked) {
            fd.append("wpforms[fields][" + opts.checkbox.wpField + "][]", opts.checkbox.value);
          }
          fd.append("wpforms[token]", token);
          fd.append("wpforms[post_id]", opts.pageId);
          fd.append("page_id", opts.pageId);
          fd.append("page_title", opts.pageTitle);
          fd.append("page_url", opts.pageUrl);
          fd.append("url_referer", window.location.href);
          fd.append("start_timestamp", String(startTime));
          fd.append("end_timestamp", String(Math.floor(Date.now() / 1000)));

          return fetch(WPFORMS_AJAX_URL, { method: "POST", body: fd });
        })
        .then(function (res) {
          if (!res.ok) throw new Error("wpforms-submit-http-" + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.success) throw new Error("wpforms-submit-failed");
          confirmEl.hidden = false;
          opts.form.reset();
        })
        .catch(function () {
          errorEl.hidden = false;
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        });
    });
  }

  var WPFORMS_TERMS_CHOICE = "Έχω διαβάσει και αποδέχομαι τους όρους χρήσης και την πολιτική απορρήτου.";

  var askExpertForm = document.getElementById("askExpertForm");
  if (askExpertForm) {
    initWpFormsForm({
      form: askExpertForm,
      confirmId: "askExpertConfirm",
      errorId: "askExpertError",
      formId: "1164",
      pageId: "1229",
      pageTitle: "Ρώτα τον ειδικό",
      pageUrl: "https://okosmostoupari.gr/ρώτα-τον-ειδικό/",
      fields: [
        { name: "name", wpField: 0 },
        { name: "email", wpField: 1 },
        { name: "question", wpField: 2 },
      ],
      checkbox: { name: "terms", wpField: 5, value: WPFORMS_TERMS_CHOICE },
    });
  }

  var supportVolunteerForm = document.getElementById("supportVolunteerForm");
  if (supportVolunteerForm) {
    initWpFormsForm({
      form: supportVolunteerForm,
      confirmId: "supportVolunteerConfirm",
      errorId: "supportVolunteerError",
      formId: "1457",
      pageId: "6158",
      pageTitle: "Στηρίζω τον κόσμο του Πάρη",
      pageUrl: "https://okosmostoupari.gr/στηρίζω-τον-κόσμο-του-πάρη/",
      fields: [
        { name: "email", wpField: 1 },
        { name: "name", wpField: 0 },
        { name: "birthyear", wpField: 8 },
        { name: "area", wpField: 9 },
        { name: "notes", wpField: 2 },
      ],
      checkbox: { name: "terms", wpField: 5, value: WPFORMS_TERMS_CHOICE },
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
  var WP_CATEGORY_DRASEIS = 312;
  var WP_CATEGORY_BOOKS = 77;
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
    link.href = "article.html?slug=" + post.slug;
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

  function initWpFeed(gridId, loadMoreId, categoryId, showDate, tagFallback, showImage, pageSize) {
    var grid = document.getElementById(gridId);
    if (!grid) return;
    var loadMoreBtn = loadMoreId ? document.getElementById(loadMoreId) : null;
    var perPage = pageSize || WP_PAGE_SIZE;
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
      var url = WP_API_POSTS + "?_embed&categories=" + categoryId + "&per_page=" + perPage + "&page=" + page;
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

  initWpFeed("homeNewsGrid", null, WP_CATEGORY_NEWS, true, "Νέα", false, 3);
  initWpFeed("newsGrid", "newsLoadMore", WP_CATEGORY_NEWS, true, "Νέα", false);
  initWpFeed("articlesGrid", "articlesLoadMore", WP_CATEGORY_ARTICLES, false, "Άρθρο", true);
  initWpFeed("communityDrasseisGrid", "communityDrasseisLoadMore", WP_CATEGORY_DRASEIS, true, "Δράση", true, 3);
  initWpFeed("draseisGrid", "draseisLoadMore", WP_CATEGORY_DRASEIS, true, "Δράση", true);
  initWpFeed("booksGrid", "booksLoadMore", WP_CATEGORY_BOOKS, false, "Βιβλίο", true);

  /* ----------------------------------------------------------
     Single article page (article.html) — fetches one post by
     ?slug= from the same live WP REST API and renders it on our
     own page, so "Διαβάστε Περισσότερα" never leaves the site.
     ---------------------------------------------------------- */
  function wpSanitizeContent(html) {
    var doc = new DOMParser().parseFromString(html || "", "text/html");
    var unsafe = doc.body.querySelectorAll("script, style, iframe, object, embed, link, meta, form");
    unsafe.forEach(function (el) { el.remove(); });
    var all = doc.body.querySelectorAll("*");
    all.forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (name.indexOf("on") === 0) el.removeAttribute(attr.name);
      });
      if (el.tagName === "A") {
        var href = el.getAttribute("href") || "";
        if (href.trim().toLowerCase().indexOf("javascript:") === 0) {
          el.removeAttribute("href");
        } else {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      }
      if (el.tagName === "IMG") {
        el.setAttribute("loading", "lazy");
      }
    });
    var firstChild = doc.body.firstElementChild;
    if (firstChild && firstChild.tagName === "H1") firstChild.remove();
    return doc.body.innerHTML;
  }

  function initWpArticlePage() {
    var body = document.getElementById("articleBody");
    if (!body) return;
    var titleEl = document.getElementById("articleTitle");
    var eyebrowEl = document.getElementById("articleEyebrow");
    var metaEl = document.getElementById("articleMeta");
    var featuredEl = document.getElementById("articleFeaturedImage");
    var backLinkEl = document.getElementById("articleBackLink");
    var backLabelEl = document.getElementById("articleBackLabel");

    var slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      body.innerHTML = "";
      titleEl.textContent = "Δεν βρέθηκε άρθρο";
      var noSlugMsg = document.createElement("p");
      noSlugMsg.className = "editorial-status";
      noSlugMsg.textContent = "Δεν ορίστηκε άρθρο προς εμφάνιση.";
      body.appendChild(noSlugMsg);
      return;
    }

    fetch(WP_API_POSTS + "?slug=" + slug + "&_embed")
      .then(function (res) {
        if (!res.ok) throw new Error("wp-fetch-failed");
        return res.json();
      })
      .then(function (posts) {
        var post = posts && posts[0];
        if (!post) throw new Error("wp-post-not-found");

        var title = wpHtmlToText(post.title.rendered);
        document.title = title + " — Ο Κόσμος του Πάρη";
        titleEl.textContent = title;

        var cats = post.categories || [];
        var isNews = cats.indexOf(WP_CATEGORY_NEWS) !== -1;
        var isDraseis = cats.indexOf(WP_CATEGORY_DRASEIS) !== -1;
        var isBooks = cats.indexOf(WP_CATEGORY_BOOKS) !== -1;
        var backHref = "articles.html";
        var backLabel = "Πίσω στα Άρθρα";
        var eyebrowFallback = "Άρθρο";
        if (isNews) {
          backHref = "news.html";
          backLabel = "Πίσω στα Νέα";
          eyebrowFallback = "Νέα";
        } else if (isDraseis) {
          backHref = "community.html";
          backLabel = "Πίσω στην Κοινότητα";
          eyebrowFallback = "Δράση";
        } else if (isBooks) {
          backHref = "books.html";
          backLabel = "Πίσω στα Βιβλία";
          eyebrowFallback = "Βιβλίο";
        }
        eyebrowEl.textContent = wpCategoryLabel(post, eyebrowFallback);
        backLinkEl.href = backHref;
        backLabelEl.textContent = backLabel;

        metaEl.textContent = wpFormatDate(post.date);

        var imageUrl = wpFeaturedImageUrl(post);
        if (imageUrl) {
          var img = document.createElement("img");
          img.className = "article-featured-image";
          img.src = imageUrl;
          img.alt = "";
          featuredEl.appendChild(img);
        }

        body.innerHTML = wpSanitizeContent(post.content.rendered);
      })
      .catch(function () {
        titleEl.textContent = "Δεν ήταν δυνατή η φόρτωση του άρθρου";
        metaEl.textContent = "";
        body.innerHTML = "";
        var errStatus = document.createElement("p");
        errStatus.className = "editorial-status";
        errStatus.appendChild(document.createTextNode("Δεν ήταν δυνατή η φόρτωση αυτού του άρθρου αυτή τη στιγμή. Δείτε το απευθείας στο "));
        var siteLink = document.createElement("a");
        siteLink.href = "https://okosmostoupari.gr";
        siteLink.target = "_blank";
        siteLink.rel = "noopener";
        siteLink.textContent = "okosmostoupari.gr";
        errStatus.appendChild(siteLink);
        errStatus.appendChild(document.createTextNode("."));
        body.appendChild(errStatus);
      });
  }
  initWpArticlePage();

  /* ----------------------------------------------------------
     Single professional profile (professional.html) — renders one
     entry from the local professional-profile snapshot
     (assets/data/professionals/<id>.json). The live profile pages
     (okosmostoupari.gr/professional/<slug>/) don't send CORS
     headers and their content (bio, services, contact details,
     ratings) isn't exposed by the wp/v2/professional REST API at
     all — it's rendered straight into the page template. So, same
     approach as the schools map: a one-time server-side scrape of
     the rendered HTML, checked in as static per-profile JSON.
     ---------------------------------------------------------- */
  var PROFESSIONAL_CATEGORY_META = {
    doctors: { label: "Εξειδικευμένοι Ιατροί", href: "category-doctors.html" },
    filoxenia: { label: "Χώροι Φιλοξενίας Παιδιών & Ενηλίκων", href: "category-filoxenia.html" },
    therapeutes: { label: "Θεραπευτές – Σύμβουλοι", href: "category-therapeutes.html" },
    drastiriotites: { label: "Δραστηριότητες & Κοινωνικοποίηση", href: "category-drastiriotites.html" },
    ekpaideutes: { label: "Εκπαιδευτές – Φύλαξη", href: "category-ekpaideutes.html" },
    kentra: { label: "Εξειδικευμένα Κέντρα Θεραπειών", href: "category-kentra.html" },
    syllogoi: { label: "Σύλλογοι & Σωματεία", href: "category-syllogoi.html" }
  };

  var ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.8 2.1z"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M22 6l-10 7L2 6"/></svg>';
  var ICON_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  var ICON_FACEBOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';

  function buildProfessionalStars(value) {
    var wrap = document.createElement("div");
    wrap.className = "professional-stars";
    wrap.setAttribute("aria-hidden", "true");
    var rounded = Math.round(value);
    for (var i = 1; i <= 5; i++) {
      var star = document.createElement("span");
      star.className = "professional-stars__star" + (i <= rounded ? " is-filled" : "");
      star.textContent = "★";
      wrap.appendChild(star);
    }
    return wrap;
  }

  function buildProfessionalContactRow(iconSvg, href, label, isExternal) {
    var row = document.createElement("p");
    row.className = "professional-contact-card__row";
    var icon = document.createElement("span");
    icon.className = "professional-contact-card__icon";
    icon.innerHTML = iconSvg;
    row.appendChild(icon);
    if (href) {
      var a = document.createElement("a");
      a.href = href;
      if (isExternal) { a.target = "_blank"; a.rel = "noopener"; }
      a.textContent = label;
      row.appendChild(a);
    } else {
      var span = document.createElement("span");
      span.textContent = label;
      row.appendChild(span);
    }
    return row;
  }

  function initProfessionalProfilePage() {
    var body = document.getElementById("profBody");
    if (!body) return;
    var titleEl = document.getElementById("profTitle");
    var eyebrowEl = document.getElementById("profEyebrow");
    var tagsEl = document.getElementById("profTags");
    var photoWrap = document.getElementById("profPhotoWrap");
    var sideEl = document.getElementById("profSide");
    var contactCard = document.getElementById("profContactCard");
    var ratingsEl = document.getElementById("profRatings");
    var ratingsSummaryEl = document.getElementById("profRatingsSummary");
    var ratingsListEl = document.getElementById("profRatingsList");
    var backLinkEl = document.getElementById("profBackLink");
    var backLabelEl = document.getElementById("profBackLabel");

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var from = params.get("from");

    var catMeta = PROFESSIONAL_CATEGORY_META[from];
    if (catMeta) {
      backLinkEl.href = catMeta.href;
      backLabelEl.textContent = "Πίσω στο: " + catMeta.label;
      eyebrowEl.textContent = catMeta.label;
    }

    if (!id) {
      titleEl.textContent = "Δεν βρέθηκε προφίλ";
      body.innerHTML = "";
      var noIdMsg = document.createElement("p");
      noIdMsg.className = "editorial-status";
      noIdMsg.textContent = "Δεν ορίστηκε προφίλ προς εμφάνιση.";
      body.appendChild(noIdMsg);
      return;
    }

    fetch("assets/data/professionals/" + encodeURIComponent(id) + ".json")
      .then(function (res) {
        if (!res.ok) throw new Error("profile-fetch-failed");
        return res.json();
      })
      .then(function (prof) {
        document.title = prof.title + " — Ο Κόσμος του Πάρη";
        titleEl.textContent = prof.title;
        if (!catMeta) eyebrowEl.textContent = (prof.categories && prof.categories[0]) || "Επαγγελματίας";

        (prof.categories || []).forEach(function (cat) {
          var chip = document.createElement("span");
          chip.className = "professional-card__tag";
          chip.textContent = cat;
          tagsEl.appendChild(chip);
        });

        if (prof.photo) {
          var img = document.createElement("img");
          img.className = "professional-profile-photo";
          img.src = prof.photo;
          img.alt = "";
          img.loading = "lazy";
          photoWrap.appendChild(img);
        }

        if (prof.contentHtml) {
          body.innerHTML = wpSanitizeContent(prof.contentHtml);
        } else {
          body.innerHTML = "";
          var noContent = document.createElement("p");
          noContent.className = "editorial-status";
          noContent.textContent = "Δεν υπάρχει διαθέσιμη περιγραφή για αυτή τη δομή.";
          body.appendChild(noContent);
        }

        var hasContact = prof.address || prof.phone || prof.email || prof.website || prof.facebook || prof.hours;
        if (hasContact) {
          sideEl.hidden = false;

          if (prof.address) {
            var locBlock = document.createElement("div");
            locBlock.className = "professional-contact-card__section";
            var locTitle = document.createElement("h3");
            locTitle.textContent = "Διεύθυνση";
            locBlock.appendChild(locTitle);
            var locText = document.createElement("p");
            locText.textContent = prof.address;
            locBlock.appendChild(locText);
            var mapLink = document.createElement("a");
            mapLink.className = "professional-contact-card__map-link";
            mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(prof.address);
            mapLink.target = "_blank";
            mapLink.rel = "noopener";
            mapLink.appendChild(document.createTextNode("Δείτε στον χάρτη "));
            var mapArrow = document.createElement("span");
            mapArrow.className = "arrow";
            mapArrow.setAttribute("aria-hidden", "true");
            mapArrow.textContent = "→";
            mapLink.appendChild(mapArrow);
            locBlock.appendChild(mapLink);
            contactCard.appendChild(locBlock);
          }

          if (prof.phone || prof.email || prof.website || prof.facebook) {
            var contactBlock = document.createElement("div");
            contactBlock.className = "professional-contact-card__section";
            var contactTitle = document.createElement("h3");
            contactTitle.textContent = "Στοιχεία Επικοινωνίας";
            contactBlock.appendChild(contactTitle);
            if (prof.phone) contactBlock.appendChild(buildProfessionalContactRow(ICON_PHONE, "tel:" + prof.phone.replace(/\s+/g, ""), prof.phone, false));
            if (prof.email) contactBlock.appendChild(buildProfessionalContactRow(ICON_MAIL, "mailto:" + prof.email, prof.email, false));
            if (prof.website) contactBlock.appendChild(buildProfessionalContactRow(ICON_GLOBE, prof.website, "Ιστότοπος", true));
            if (prof.facebook) contactBlock.appendChild(buildProfessionalContactRow(ICON_FACEBOOK, prof.facebook, "Facebook", true));
            contactCard.appendChild(contactBlock);
          }

          if (prof.hours) {
            var hoursBlock = document.createElement("div");
            hoursBlock.className = "professional-contact-card__section";
            var hoursTitle = document.createElement("h3");
            hoursTitle.textContent = "Ώρες Λειτουργίας";
            hoursBlock.appendChild(hoursTitle);
            var hoursText = document.createElement("p");
            hoursText.textContent = prof.hours;
            hoursBlock.appendChild(hoursText);
            contactCard.appendChild(hoursBlock);
          }
        }

        if (prof.rating && prof.rating.count > 0) {
          ratingsEl.hidden = false;

          var summary = document.createElement("div");
          summary.className = "professional-ratings__score";
          summary.appendChild(buildProfessionalStars(prof.rating.average));
          var scoreText = document.createElement("span");
          scoreText.textContent = String(prof.rating.average).replace(".", ",") + " από 5 (" + prof.rating.count + (prof.rating.count === 1 ? " αξιολόγηση" : " αξιολογήσεις") + ")";
          summary.appendChild(scoreText);
          ratingsSummaryEl.appendChild(summary);

          (prof.reviews || []).forEach(function (review) {
            var card = document.createElement("article");
            card.className = "professional-review";

            var head = document.createElement("div");
            head.className = "professional-review__head";
            head.appendChild(buildProfessionalStars(review.rating));
            if (review.date) {
              var dateSpan = document.createElement("span");
              dateSpan.className = "professional-review__date";
              dateSpan.textContent = review.date;
              head.appendChild(dateSpan);
            }
            card.appendChild(head);

            if (review.title) {
              var reviewTitle = document.createElement("h4");
              reviewTitle.textContent = review.title;
              card.appendChild(reviewTitle);
            }
            if (review.content) {
              var content = document.createElement("p");
              content.textContent = review.content;
              card.appendChild(content);
            }
            if (review.author) {
              var author = document.createElement("p");
              author.className = "professional-review__author";
              author.textContent = "— " + review.author;
              card.appendChild(author);
            }
            ratingsListEl.appendChild(card);
          });
        }
      })
      .catch(function () {
        titleEl.textContent = "Δεν ήταν δυνατή η φόρτωση του προφίλ";
        body.innerHTML = "";
        var errStatus = document.createElement("p");
        errStatus.className = "editorial-status";
        errStatus.appendChild(document.createTextNode("Δεν ήταν δυνατή η φόρτωση αυτού του προφίλ αυτή τη στιγμή. Δείτε το απευθείας στο "));
        var siteLink = document.createElement("a");
        siteLink.href = "https://okosmostoupari.gr";
        siteLink.target = "_blank";
        siteLink.rel = "noopener";
        siteLink.textContent = "okosmostoupari.gr";
        errStatus.appendChild(siteLink);
        errStatus.appendChild(document.createTextNode("."));
        body.appendChild(errStatus);
      });
  }
  initProfessionalProfilePage();

  /* ----------------------------------------------------------
     "diafimisi" post-type features (community.html preview +
     aggelies.html/draseis-triton.html full lists + aggelia.html/
     drasi-triti.html single viewers) — the CPT's wp/v2 REST
     content is real, but the fields that actually matter (contact
     name, role, location, phone, email, expiry date) are
     template-only, same gap as professional profiles. Both the
     "aggelia" and "drasi" adtype terms are small (14 and 33 posts)
     though, so a single static snapshot per term covers grid cards
     and the detail view alike — no per-id files or index needed at
     this size. createDiafimisiFeature() factors out the grid +
     detail-page logic shared by both terms; only the data file,
     detail-page filename, element ids and Greek copy differ.
     ---------------------------------------------------------- */
  var ICON_CALENDAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var ICON_MEGAPHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a2 2 0 0 0 2 2h1l3 5h2l-2-5h5l6 4V6l-6 4H6a2 2 0 0 0-2 2z"/></svg>';

  function buildDiafimisiCard(item, detailPage) {
    var card = document.createElement("article");
    card.className = "professional-card";

    var media = document.createElement("div");
    media.className = "professional-card__media";
    media.setAttribute("aria-hidden", "true");
    if (item.photo) {
      var img = document.createElement("img");
      img.src = item.photo;
      img.alt = "";
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      media.classList.add("professional-card__media--placeholder");
      media.innerHTML = ICON_MEGAPHONE;
    }

    var body = document.createElement("div");
    body.className = "professional-card__body";

    var name = document.createElement("h3");
    name.className = "professional-card__name";
    name.textContent = item.title;
    body.appendChild(name);

    if (item.expiry) {
      var expiryRow = document.createElement("div");
      expiryRow.className = "professional-card__area";
      expiryRow.innerHTML = ICON_CALENDAR;
      expiryRow.appendChild(document.createTextNode("Έως " + item.expiry));
      body.appendChild(expiryRow);
    }
    if (item.location) {
      var locRow = document.createElement("div");
      locRow.className = "professional-card__area";
      locRow.innerHTML = ICON_PIN;
      locRow.appendChild(document.createTextNode(item.location));
      body.appendChild(locRow);
    }

    var link = document.createElement("a");
    link.className = "professional-card__link";
    link.href = detailPage + "?slug=" + encodeURIComponent(item.slug);
    link.appendChild(document.createTextNode("Προβολή "));
    var arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    link.appendChild(arrow);
    body.appendChild(link);

    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  function createDiafimisiFeature(config) {
    var dataPromise = null;
    function getData() {
      if (!dataPromise) {
        dataPromise = fetch(config.dataUrl).then(function (res) {
          if (!res.ok) throw new Error("diafimisi-fetch-failed");
          return res.json();
        });
      }
      return dataPromise;
    }

    function initGrid(gridId, pageSize, loadMoreId) {
      var grid = document.getElementById(gridId);
      if (!grid) return;
      var loadMoreBtn = loadMoreId ? document.getElementById(loadMoreId) : null;
      var shown = 0;
      grid.innerHTML = '<p class="editorial-status" role="status">' + config.text.loadingGrid + '</p>';

      function renderMore(items) {
        var next = pageSize ? items.slice(shown, shown + pageSize) : items;
        next.forEach(function (item) {
          grid.appendChild(buildDiafimisiCard(item, config.detailPage));
        });
        shown += next.length;
        if (loadMoreBtn) loadMoreBtn.hidden = shown >= items.length;
      }

      getData()
        .then(function (items) {
          grid.innerHTML = "";
          if (!items.length) {
            grid.innerHTML = '<p class="editorial-status" role="status">' + config.text.emptyGrid + '</p>';
            return;
          }
          renderMore(items);
          if (loadMoreBtn) {
            loadMoreBtn.addEventListener("click", function () {
              renderMore(items);
            });
          }
        })
        .catch(function () {
          grid.innerHTML = "";
          var status = document.createElement("p");
          status.className = "editorial-status";
          status.setAttribute("role", "status");
          status.appendChild(document.createTextNode(config.text.gridErrorPrefix));
          var siteLink = document.createElement("a");
          siteLink.href = "https://okosmostoupari.gr";
          siteLink.target = "_blank";
          siteLink.rel = "noopener";
          siteLink.textContent = "okosmostoupari.gr";
          status.appendChild(siteLink);
          status.appendChild(document.createTextNode("."));
          grid.appendChild(status);
          if (loadMoreBtn) loadMoreBtn.hidden = true;
        });
    }

    function initDetailPage() {
      var body = document.getElementById(config.ids.body);
      if (!body) return;
      var titleEl = document.getElementById(config.ids.title);
      var metaEl = document.getElementById(config.ids.meta);
      var sideEl = document.getElementById(config.ids.side);
      var contactCard = document.getElementById(config.ids.contactCard);

      var slug = new URLSearchParams(window.location.search).get("slug");
      if (!slug) {
        titleEl.textContent = config.text.notFoundTitle;
        body.innerHTML = "";
        var noSlugMsg = document.createElement("p");
        noSlugMsg.className = "editorial-status";
        noSlugMsg.textContent = config.text.notSetMsg;
        body.appendChild(noSlugMsg);
        return;
      }

      getData()
        .then(function (items) {
          var item = null;
          for (var i = 0; i < items.length; i++) {
            if (items[i].slug === slug) { item = items[i]; break; }
          }
          if (!item) throw new Error("diafimisi-item-not-found");

          document.title = item.title + " — Ο Κόσμος του Πάρη";
          titleEl.textContent = item.title;
          var metaParts = [];
          if (item.expiry) metaParts.push("Ισχύει έως " + item.expiry);
          if (item.location) metaParts.push(item.location);
          metaEl.textContent = metaParts.join(" · ");

          if (item.contentHtml) {
            body.innerHTML = wpSanitizeContent(item.contentHtml);
          } else {
            body.innerHTML = "";
            var noContent = document.createElement("p");
            noContent.className = "editorial-status";
            noContent.textContent = config.text.noContentMsg;
            body.appendChild(noContent);
          }

          var hasSide = item.role || item.expiry || item.contactName || item.phone || item.email;
          if (hasSide) {
            sideEl.hidden = false;

            if (item.role || item.expiry) {
              var adBlock = document.createElement("div");
              adBlock.className = "professional-contact-card__section";
              var adTitle = document.createElement("h3");
              adTitle.textContent = config.text.detailsSectionTitle;
              adBlock.appendChild(adTitle);
              if (item.role) {
                var roleP = document.createElement("p");
                roleP.textContent = "Ιδιότητα: " + item.role;
                adBlock.appendChild(roleP);
              }
              if (item.expiry) {
                var expiryP = document.createElement("p");
                expiryP.textContent = "Ισχύει έως: " + item.expiry;
                adBlock.appendChild(expiryP);
              }
              contactCard.appendChild(adBlock);
            }

            if (item.contactName || item.phone || item.email) {
              var contactBlock = document.createElement("div");
              contactBlock.className = "professional-contact-card__section";
              var contactTitle = document.createElement("h3");
              contactTitle.textContent = "Στοιχεία Επικοινωνίας";
              contactBlock.appendChild(contactTitle);
              if (item.contactName) {
                var nameP = document.createElement("p");
                nameP.textContent = item.contactName;
                contactBlock.appendChild(nameP);
              }
              if (item.phone) contactBlock.appendChild(buildProfessionalContactRow(ICON_PHONE, "tel:" + item.phone.replace(/\s+/g, ""), item.phone, false));
              if (item.email) contactBlock.appendChild(buildProfessionalContactRow(ICON_MAIL, "mailto:" + item.email, item.email, false));
              contactCard.appendChild(contactBlock);
            }
          }
        })
        .catch(function () {
          titleEl.textContent = config.text.detailErrorTitle;
          metaEl.textContent = "";
          body.innerHTML = "";
          var errStatus = document.createElement("p");
          errStatus.className = "editorial-status";
          errStatus.appendChild(document.createTextNode(config.text.detailErrorPrefix));
          var siteLink = document.createElement("a");
          siteLink.href = "https://okosmostoupari.gr";
          siteLink.target = "_blank";
          siteLink.rel = "noopener";
          siteLink.textContent = "okosmostoupari.gr";
          errStatus.appendChild(siteLink);
          errStatus.appendChild(document.createTextNode("."));
          body.appendChild(errStatus);
        });
    }

    return { getData: getData, initGrid: initGrid, initDetailPage: initDetailPage };
  }

  var aggeliesFeature = createDiafimisiFeature({
    dataUrl: "assets/data/aggelies.json",
    detailPage: "aggelia.html",
    ids: { title: "aggTitle", meta: "aggMeta", body: "aggBody", side: "aggSide", contactCard: "aggContactCard" },
    text: {
      loadingGrid: "Φόρτωση αγγελιών…",
      emptyGrid: "Δεν υπάρχουν διαθέσιμες αγγελίες αυτή τη στιγμή.",
      gridErrorPrefix: "Δεν ήταν δυνατή η φόρτωση των αγγελιών αυτή τη στιγμή. Δείτε τις απευθείας στο ",
      notFoundTitle: "Δεν βρέθηκε αγγελία",
      notSetMsg: "Δεν ορίστηκε αγγελία προς εμφάνιση.",
      noContentMsg: "Δείτε τα στοιχεία επικοινωνίας για περισσότερες πληροφορίες.",
      detailsSectionTitle: "Στοιχεία Αγγελίας",
      detailErrorTitle: "Δεν ήταν δυνατή η φόρτωση της αγγελίας",
      detailErrorPrefix: "Δεν ήταν δυνατή η φόρτωση αυτής της αγγελίας αυτή τη στιγμή. Δείτε την απευθείας στο "
    }
  });
  aggeliesFeature.initGrid("communityAggeliesGrid", 3, "communityAggeliesLoadMore");
  aggeliesFeature.initGrid("aggeliesGrid", null);
  aggeliesFeature.initDetailPage();

  var draseisTritonFeature = createDiafimisiFeature({
    dataUrl: "assets/data/draseis-triton.json",
    detailPage: "drasi-triti.html",
    ids: { title: "drtTitle", meta: "drtMeta", body: "drtBody", side: "drtSide", contactCard: "drtContactCard" },
    text: {
      loadingGrid: "Φόρτωση δράσεων…",
      emptyGrid: "Δεν υπάρχουν διαθέσιμες δράσεις αυτή τη στιγμή.",
      gridErrorPrefix: "Δεν ήταν δυνατή η φόρτωση των δράσεων αυτή τη στιγμή. Δείτε τις απευθείας στο ",
      notFoundTitle: "Δεν βρέθηκε δράση",
      notSetMsg: "Δεν ορίστηκε δράση προς εμφάνιση.",
      noContentMsg: "Δείτε τα στοιχεία επικοινωνίας για περισσότερες πληροφορίες.",
      detailsSectionTitle: "Στοιχεία Δράσης",
      detailErrorTitle: "Δεν ήταν δυνατή η φόρτωση της δράσης",
      detailErrorPrefix: "Δεν ήταν δυνατή η φόρτωση αυτής της δράσης αυτή τη στιγμή. Δείτε την απευθείας στο "
    }
  });
  draseisTritonFeature.initGrid("draseisTritonGrid", null);
  draseisTritonFeature.initDetailPage();

  /* ----------------------------------------------------------
     Institution directory search (seminaria.html) — plain
     client-side filtering over the hand-authored .institution-item
     list; no fetch involved, the list is static page content.
     ---------------------------------------------------------- */
  function initInstitutionsFilter() {
    var grid = document.getElementById("institutionsGrid");
    if (!grid) return;
    var searchInput = document.getElementById("institutionsSearchInput");
    var countEl = document.getElementById("institutionsResultsCount");
    var items = Array.prototype.slice.call(grid.querySelectorAll(".institution-item"));
    var total = items.length;

    function updateCount(visible) {
      if (!countEl) return;
      countEl.textContent = visible === total
        ? "Εμφανίζονται και οι " + total + " φορείς"
        : visible + " από " + total + " φορείς ταιριάζουν με την αναζήτησή σας";
    }

    function applyFilter() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var visible = 0;
      items.forEach(function (item) {
        var match = !query || (item.getAttribute("data-name") || "").indexOf(query) !== -1;
        item.hidden = !match;
        if (match) visible += 1;
      });
      updateCount(visible);
    }

    updateCount(total);
    if (searchInput) searchInput.addEventListener("input", applyFilter);
  }
  initInstitutionsFilter();

  /* ----------------------------------------------------------
     Video grid (videos.html) — renders YouTube-embed cards from a
     local placeholder list (assets/data/videos.json). Entries ship
     with an empty youtubeId until the real links are added; those
     render as a dashed placeholder slot instead of a player, same
     idea as the professional-card placeholder cell, so the page
     already has the right look while waiting on the real links.
     ---------------------------------------------------------- */
  var ICON_VIDEO_PLACEHOLDER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 9l5-3v12l-5-3"/></svg>';

  function buildVideoCard(item) {
    var card = document.createElement("article");
    card.className = "video-card";

    var embed = document.createElement("div");
    embed.className = "video-card__embed";
    if (item.youtubeId) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + encodeURIComponent(item.youtubeId);
      iframe.title = item.title || "Video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      embed.appendChild(iframe);
    } else {
      embed.classList.add("video-card__embed--placeholder");
      embed.innerHTML = ICON_VIDEO_PLACEHOLDER + "<span>Το βίντεο θα προστεθεί σύντομα</span>";
    }
    card.appendChild(embed);

    if (item.title) {
      var title = document.createElement("h3");
      title.className = "video-card__title";
      title.textContent = item.title;
      card.appendChild(title);
    }
    if (item.description) {
      var desc = document.createElement("p");
      desc.className = "video-card__desc";
      desc.textContent = item.description;
      card.appendChild(desc);
    }

    return card;
  }

  function initVideosGrid() {
    var grid = document.getElementById("videosGrid");
    if (!grid) return;

    fetch("assets/data/videos.json")
      .then(function (res) {
        if (!res.ok) throw new Error("videos-fetch-failed");
        return res.json();
      })
      .then(function (items) {
        grid.innerHTML = "";
        if (!items.length) {
          grid.innerHTML = '<p class="editorial-status" role="status">Δεν υπάρχουν διαθέσιμα video αυτή τη στιγμή.</p>';
          return;
        }
        items.forEach(function (item) {
          grid.appendChild(buildVideoCard(item));
        });
      })
      .catch(function () {
        grid.innerHTML = '<p class="editorial-status" role="status">Δεν ήταν δυνατή η φόρτωση των video αυτή τη στιγμή.</p>';
      });
  }
  initVideosGrid();

  /* ----------------------------------------------------------
     Schools map (category-schools.html) — renders a Leaflet map
     and matching list from a local snapshot of the "Ειδικά
     Σχολεία – ΚΕΔΑΣΥ" locations (assets/data/schools.json). The
     live WP Store Locator's admin-ajax.php endpoint that holds
     these coordinates doesn't send CORS headers, so it can't be
     fetched cross-origin from the browser at request time — the
     snapshot was captured from that same read-only endpoint and
     checked in as static data instead.
     ---------------------------------------------------------- */
  function initSchoolsMap() {
    var mapEl = document.getElementById("schoolsMap");
    if (!mapEl || typeof L === "undefined") return;

    var listEl = document.getElementById("schoolsList");
    var countEl = document.getElementById("schoolsResultsCount");
    var searchInput = document.getElementById("schoolsSearchInput");

    if (L.Icon && L.Icon.Default) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });
    }

    var map = L.map(mapEl).setView([38.6, 23.7], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\">OpenStreetMap</a> συνεισφέροντες"
    }).addTo(map);

    var clusterGroup = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
    map.addLayer(clusterGroup);

    var entries = [];

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    }

    function popupHtml(school) {
      var lines = [];
      lines.push('<div class="schools-popup__title">' + escapeHtml(school.name) + "</div>");
      lines.push('<div class="schools-popup__line">' + escapeHtml(school.address) + ", " + escapeHtml(school.city) + " " + escapeHtml(school.zip) + "</div>");
      if (school.phone) lines.push('<div class="schools-popup__line">' + escapeHtml(school.phone) + "</div>");
      if (school.email) lines.push('<div class="schools-popup__line"><a href="mailto:' + encodeURIComponent(school.email) + '">' + escapeHtml(school.email) + "</a></div>");
      return lines.join("");
    }

    function updateCount(visible, total) {
      if (!countEl) return;
      countEl.textContent = visible === total
        ? "Εμφανίζονται και οι " + total + " δομές"
        : visible + " από " + total + " δομές ταιριάζουν με την αναζήτησή σας";
    }

    function applyFilter() {
      var query = (searchInput ? searchInput.value.trim().toLowerCase() : "");
      var visible = 0;
      clusterGroup.clearLayers();
      entries.forEach(function (entry) {
        var match = query === "" || entry.haystack.indexOf(query) !== -1;
        entry.listEl.hidden = !match;
        if (match) {
          clusterGroup.addLayer(entry.marker);
          visible += 1;
        }
      });
      updateCount(visible, entries.length);
    }

    function focusSchool(entry) {
      map.setView(entry.marker.getLatLng(), 15);
      entry.marker.openPopup();
      entries.forEach(function (e) { e.listEl.classList.remove("is-active"); });
      entry.listEl.classList.add("is-active");
    }

    fetch("assets/data/schools.json")
      .then(function (res) {
        if (!res.ok) throw new Error("schools-fetch-failed");
        return res.json();
      })
      .then(function (schools) {
        if (countEl) countEl.textContent = "";
        schools.forEach(function (school) {
          var marker = L.marker([school.lat, school.lng]).bindPopup(popupHtml(school));

          var item = document.createElement("button");
          item.type = "button";
          item.className = "schools-list-item";
          var title = document.createElement("div");
          title.className = "schools-list-item__title";
          title.textContent = school.name;
          var line = document.createElement("div");
          line.className = "schools-list-item__line";
          line.textContent = school.address + ", " + school.city;
          item.appendChild(title);
          item.appendChild(line);
          if (listEl) listEl.appendChild(item);

          var entry = {
            marker: marker,
            listEl: item,
            haystack: (school.name + " " + school.city + " " + school.zip + " " + school.address).toLowerCase()
          };
          item.addEventListener("click", function () { focusSchool(entry); });
          entries.push(entry);
        });
        applyFilter();
      })
      .catch(function () {
        if (countEl) countEl.textContent = "Δεν ήταν δυνατή η φόρτωση των δομών αυτή τη στιγμή.";
      });

    if (searchInput) searchInput.addEventListener("input", applyFilter);
  }
  initSchoolsMap();

  /* ----------------------------------------------------------
     Professional grids (category-doctors.html + the other
     "Υπηρεσίες" category pages) — each live-fetches the same
     listing grid the WordPress site itself renders on its matching
     page via the WP Ultimate Post Grid plugin, then parses the
     returned item markup into cards with a category filter built
     from whichever specialties actually show up in that grid's
     data. This REST endpoint sends CORS headers (unlike the
     store-locator's admin-ajax.php used for the schools map), so no
     local snapshot is needed here — this reads the live WP data.

     Quirk worth documenting: some grids' JSON responses contain
     literal, unescaped newline bytes inside string values (a
     server-side encoding bug in that WP plugin, not ours) — the
     raw grid the doctors page uses happens not to trigger it, but
     others do, and it breaks both strict JSON parsers and the
     browser's native response.json(). Fetched as text and escaped
     before parsing to work around it everywhere.
     ---------------------------------------------------------- */
  var WPUPG_ENDPOINT = "https://okosmostoupari.gr/wp-json/wp-ultimate-post-grid/v1/items";

  /* slug -> numeric id lookup for the local professional-profile
     snapshot (assets/data/professionals/<id>.json). Built once
     from wp/v2/professional and shared by every category grid, so
     each grid loads it exactly once regardless of how many run on
     the page (only directory.html-style pages could run several). */
  var professionalsIndexPromise = null;
  function getProfessionalsIndex() {
    if (!professionalsIndexPromise) {
      professionalsIndexPromise = fetch("assets/data/professionals-index.json")
        .then(function (res) {
          if (!res.ok) throw new Error("professionals-index-fetch-failed");
          return res.json();
        })
        .catch(function () { return {}; });
    }
    return professionalsIndexPromise;
  }

  function wpupgFetchGrid(gridId) {
    return fetch(WPUPG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: gridId, args: {} })
    }).then(function (res) {
      if (!res.ok) throw new Error("wpupg-fetch-failed");
      return res.text();
    }).then(function (text) {
      var sanitized = text.trim().replace(/[\n\r\t]/g, function (ch) {
        if (ch === "\n") return "\\n";
        if (ch === "\r") return "\\r";
        return "\\t";
      });
      return JSON.parse(sanitized);
    });
  }

  function initProfessionalGrid(idPrefix, wpupgGridId) {
    var gridEl = document.getElementById(idPrefix + "Grid");
    if (!gridEl) return;

    var countEl = document.getElementById(idPrefix + "ResultsCount");
    var searchInput = document.getElementById(idPrefix + "SearchInput");
    var categorySelect = document.getElementById(idPrefix + "CategorySelect");
    var entries = [];

    function parseProfessionals(htmlString) {
      var doc = new DOMParser().parseFromString(htmlString, "text/html");
      var items = doc.body.querySelectorAll("a.wpupg-item");
      var results = [];
      items.forEach(function (item) {
        var fields = item.querySelectorAll(".wpupg-item-custom-field");
        var nameField = fields[0];
        var areaField = null;
        for (var i = 0; i < fields.length; i++) {
          if (fields[i].querySelector("img")) { areaField = fields[i]; break; }
        }
        var terms = Array.prototype.map.call(item.querySelectorAll(".wpupg-item-term"), function (t) {
          return t.textContent.trim();
        });
        var imgs = item.querySelectorAll("img");
        var photo = null;
        for (var j = 0; j < imgs.length; j++) {
          if (imgs[j].src.indexOf("location.png") === -1) { photo = imgs[j].src; break; }
        }
        var slug = null;
        try {
          var pathSegments = new URL(item.href).pathname.split("/").filter(Boolean);
          var lastSegment = pathSegments[pathSegments.length - 1];
          slug = lastSegment ? decodeURIComponent(lastSegment) : null;
        } catch (e) { slug = null; }
        results.push({
          name: nameField ? nameField.textContent.trim() : "",
          area: areaField ? areaField.textContent.replace(/\s+/g, " ").trim() : "",
          terms: terms,
          link: item.href,
          photo: photo,
          slug: slug
        });
      });
      return results;
    }

    function buildCard(data) {
      var card = document.createElement("article");
      card.className = "professional-card";

      var media = document.createElement("div");
      media.className = "professional-card__media";
      media.setAttribute("aria-hidden", "true");
      if (data.photo) {
        var img = document.createElement("img");
        img.src = data.photo;
        img.alt = "";
        img.loading = "lazy";
        media.appendChild(img);
      } else {
        media.classList.add("professional-card__media--placeholder");
        media.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>';
      }

      var body = document.createElement("div");
      body.className = "professional-card__body";

      var name = document.createElement("h3");
      name.className = "professional-card__name";
      name.textContent = data.name;

      var tags = document.createElement("div");
      tags.className = "professional-card__tags";
      var shown = data.terms.slice(0, 3);
      shown.forEach(function (t) {
        var tag = document.createElement("span");
        tag.className = "professional-card__tag";
        tag.textContent = t;
        tags.appendChild(tag);
      });
      if (data.terms.length > shown.length) {
        var more = document.createElement("span");
        more.className = "professional-card__tag professional-card__tag--more";
        more.textContent = "+" + (data.terms.length - shown.length);
        tags.appendChild(more);
      }

      body.appendChild(name);
      body.appendChild(tags);

      if (data.area) {
        var area = document.createElement("div");
        area.className = "professional-card__area";
        area.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
        area.appendChild(document.createTextNode(data.area));
        body.appendChild(area);
      }

      var link = document.createElement("a");
      link.className = "professional-card__link";
      if (data.internalId) {
        link.href = "professional.html?id=" + data.internalId + "&from=" + idPrefix;
      } else {
        link.href = data.link;
        link.target = "_blank";
        link.rel = "noopener";
      }
      link.appendChild(document.createTextNode("Προβολή προφίλ "));
      var arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      link.appendChild(arrow);
      body.appendChild(link);

      card.appendChild(media);
      card.appendChild(body);
      return card;
    }

    function populateCategorySelect(items) {
      var counts = {};
      items.forEach(function (it) {
        it.terms.forEach(function (t) {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      Object.keys(counts).sort(function (a, b) {
        return counts[b] - counts[a] || a.localeCompare(b, "el");
      }).forEach(function (term) {
        var opt = document.createElement("option");
        opt.value = term;
        opt.textContent = term + " (" + counts[term] + ")";
        categorySelect.appendChild(opt);
      });
    }

    function updateCount(visible, total) {
      if (!countEl) return;
      countEl.textContent = visible === total
        ? "Εμφανίζονται και οι " + total + " δομές"
        : visible + " από " + total + " δομές ταιριάζουν με τα φίλτρα σας";
    }

    function applyFilter() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
      var category = categorySelect ? categorySelect.value : "";
      var visible = 0;
      entries.forEach(function (entry) {
        var matchesCategory = !category || entry.data.terms.indexOf(category) !== -1;
        var matchesQuery = !query || entry.haystack.indexOf(query) !== -1;
        var match = matchesCategory && matchesQuery;
        entry.el.hidden = !match;
        if (match) visible += 1;
      });
      updateCount(visible, entries.length);
    }

    gridEl.innerHTML = '<p class="editorial-status" role="status">Φόρτωση δομών…</p>';

    Promise.all([wpupgFetchGrid(wpupgGridId), getProfessionalsIndex()])
      .then(function (results) {
        var data = results[0];
        var index = results[1];
        var professionals = data && data.items && data.items.html ? parseProfessionals(data.items.html) : [];
        gridEl.innerHTML = "";
        if (!professionals.length) {
          gridEl.innerHTML = '<p class="editorial-status" role="status">Δεν βρέθηκαν δομές αυτή τη στιγμή.</p>';
          if (countEl) countEl.textContent = "";
          return;
        }
        professionals.forEach(function (prof) {
          prof.internalId = prof.slug && index[prof.slug] ? index[prof.slug] : null;
          var card = buildCard(prof);
          gridEl.appendChild(card);
          entries.push({
            data: prof,
            el: card,
            haystack: (prof.name + " " + prof.area).toLowerCase()
          });
        });
        if (categorySelect) populateCategorySelect(professionals);
        applyFilter();
      })
      .catch(function () {
        gridEl.innerHTML = "";
        var status = document.createElement("p");
        status.className = "editorial-status";
        status.setAttribute("role", "status");
        status.appendChild(document.createTextNode("Δεν ήταν δυνατή η φόρτωση των δομών αυτή τη στιγμή. Δείτε τις απευθείας στο "));
        var siteLink = document.createElement("a");
        siteLink.href = "https://okosmostoupari.gr";
        siteLink.target = "_blank";
        siteLink.rel = "noopener";
        siteLink.textContent = "okosmostoupari.gr";
        status.appendChild(siteLink);
        status.appendChild(document.createTextNode("."));
        gridEl.appendChild(status);
        if (countEl) countEl.textContent = "";
      });

    if (searchInput) searchInput.addEventListener("input", applyFilter);
    if (categorySelect) categorySelect.addEventListener("change", applyFilter);
  }
  initProfessionalGrid("doctors", "1691");
  initProfessionalGrid("filoxenia", "1735");
  initProfessionalGrid("therapeutes", "1694");
  initProfessionalGrid("drastiriotites", "1716");
  initProfessionalGrid("ekpaideutes", "1705");
  initProfessionalGrid("kentra", "1700");
  initProfessionalGrid("syllogoi", "1740");

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
