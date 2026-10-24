/* ============================================================
   CARD WIZARD - entry point (index.html loads it last, after the other scripts).
   Every screen, label and card is written in index.html. The JS never builds content:
   it shows / hides / reorders that markup, shows the three cards listed in #catalog (data-results),
   and drives the animations, the carousels, the form and the share image.
   The only values it writes are runtime ones: counts, the reference number and the user's own picks.

   Files (one per job; each starts with a banner, the sections inside keep their own banners):
     core.js     shared helpers, the customer's answers (state), card catalogue
     wizard.js   screens / go(), steps 1-3 (tiles), step 4 (form)
     results.js  results: desktop compare table and the mobile one-card view
     thanks.js   thank-you screen, leave dialog, share image + share sheet
     stage.js    left panel: card carousel, chosen card, guide line, tilt
   ============================================================ */
(function (CCW) {
  'use strict';

  /* from wizard.js */
  function render() {
    return CCW.render.apply(this, arguments);
  }

  render();
})((window.CCW = window.CCW || {}));
