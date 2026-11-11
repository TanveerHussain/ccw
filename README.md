# Credit Card Wizard

A guided "find your card" wizard for credit cards. The customer answers a few questions about spending and benefits, compares three recommended cards, picks one and leaves their details.

Plain HTML, CSS and JavaScript, with jQuery, Select2 (dropdowns), Parsley (form validation rules, run by the CMS team) and Inputmask (mobile number format) from CDNs. No framework, no build step, nothing to install.

## Run it

Double-click `index.html`, or open it in Chrome, Edge, Safari or Firefox.

No Python, Node or web server is needed. On a web server it works the same: copy the folder as it is.

> The **share image** on the thank-you screen needs a real web address (`https://` or `http://localhost`). Opened from disk, the browser blocks it. Everything else works from disk.

## Project structure

```
index.html            all markup and content (questions, cards, results, thank-you screen)
css/ccwizardv3.css    all styles: design tokens at the top, wizard styles (scoped to .ccw), demo page background
css/ccwizardv3.min.css the same, minified (the file index.html loads; regenerate after editing, see HANDOVER.md)
js/ccw.js             all the wizard's JavaScript in one file (sections: core, wizard, results,
                      thank you + share, stage, success animation, start)
js/vendor/            lottie player (success tick animation)
images/               card images, icons, logo
HANDOVER.md           integration guide for CMS / backend teams
```

## How it works

- **All content lives in `index.html`.** JavaScript does not inject any text or data; it only shows and hides steps, runs the animations and drives the card carousel.
- **The results are static.** The results screen always shows Voyager, Skywards and Marriott (set by `data-results` on `<ol id="catalog">`). No card-matching logic runs in the browser.
- **The CSS is scoped.** Every rule sits under `.ccw` and the keyframe names start with `ccw-`, so the wizard does not affect the page it is embedded in.
- **One global name of its own.** The wizard's scripts share `window.CCW`; the libraries add `jQuery` / `$`.
- **Forms use Select2, Parsley and Inputmask.** The dropdowns are real `<select>`s shown with Select2 and styled to match the form; validation rules and messages are `data-parsley-*` attributes in the markup (the wizard does not run them; the CMS team does); the mobile number format is `data-inputmask-*` attributes.

## Integration

See **[HANDOVER.md](HANDOVER.md)** for:

- replacing the static cards with CMS or API data
- embedding the wizard in an existing page
- connecting the form submission (`submitContact` in `js/ccw.js`)
- re-theming for another brand through the design tokens
- caching (`?v=` on the CSS and script links, raised on every release)
- a test checklist after integration

## Not connected yet

- **Form submission:** the thank-you screen shows a made-up reference number until `submitContact` calls the real API.
- **Card content:** the card names, benefits and images are placeholders for the CMS to replace.
- **Font and libraries:** Plus Jakarta Sans (Google Fonts) and jQuery, Select2, Parsley and Inputmask (CDNs) load from the internet. Self-host them if the target network blocks outside sites.
