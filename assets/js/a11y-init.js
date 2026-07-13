/**
 * Runs synchronously in <head>, before first paint, so stored
 * accessibility preferences (font scale, contrast, dyslexic font)
 * never flash unstyled on load. Must stay a blocking <script src>
 * (no defer/async/type=module) placed above the stylesheet-affected
 * markup — see index.html.
 */
(function () {
  try {
    var root = document.documentElement;
    var fontStep = localStorage.getItem("okp-font-step");
    var contrast = localStorage.getItem("okp-contrast");
    var dyslexic = localStorage.getItem("okp-dyslexic");
    if (fontStep === "2") root.classList.add("a11y-font-2");
    if (fontStep === "3") root.classList.add("a11y-font-3");
    if (contrast === "1") root.classList.add("a11y-contrast");
    if (dyslexic === "1") root.classList.add("a11y-dyslexic");
  } catch (e) {
    /* localStorage unavailable (e.g. private mode) — proceed with defaults */
  }
})();
