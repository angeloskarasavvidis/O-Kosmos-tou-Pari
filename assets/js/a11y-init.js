/**
 * Runs synchronously in <head>, before first paint, so stored
 * accessibility and theme preferences never flash unstyled/wrong
 * on load. Must stay a blocking <script src> (no defer/async/
 * type=module) placed above the stylesheet-affected markup — see
 * index.html.
 */
(function () {
  try {
    var root = document.documentElement;
    var fontStep = localStorage.getItem("okp-font-step");
    var contrast = localStorage.getItem("okp-contrast");
    var dyslexic = localStorage.getItem("okp-dyslexic");
    var theme = localStorage.getItem("okp-theme");
    if (fontStep === "2") root.classList.add("a11y-font-2");
    if (fontStep === "3") root.classList.add("a11y-font-3");
    if (contrast === "1") root.classList.add("a11y-contrast");
    if (dyslexic === "1") root.classList.add("a11y-dyslexic");
    // "system" (or no stored preference) intentionally sets no
    // data-theme attribute, leaving the prefers-color-scheme media
    // query in styles.css in control.
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
  } catch (e) {
    /* localStorage unavailable (e.g. private mode) — proceed with defaults */
  }
})();
