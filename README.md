# Credit Card Wizard

A guided "find your card" wizard for credit cards. The customer answers a few questions about spending and benefits, compares three recommended cards, picks one and leaves their details.

Plain HTML, CSS and JavaScript. No framework, no build step, nothing to install.

## Run it

Double-click `index.html`, or open it in Chrome, Edge, Safari or Firefox.

No Python, Node or web server is needed. On a web server it works the same: copy the folder as it is.

> The **share image** on the thank-you screen needs a real web address (`https://` or `http://localhost`). Opened from disk, the browser blocks it. Everything else works from disk.

## Project structure

```
index.html            all markup and content (questions, cards, results, thank-you screen)
css/main.css          all styles: design tokens at the top, wizard styles (scoped to .ccw), demo page background
js/core.js            shared helpers, answers state, card catalogue
js/wizard.js          question steps, tiles, form and validation
js/results.js         results: desktop comparison table and mobile slides
js/thanks.js          submission hook, thank-you screen, share image
js/stage.js           left panel: card carousel and animations
js/main.js            entry point (loaded last)
js/vendor/            lottie player (success tick animation)
animations/success.js success tick animation data
images/               card images, icons, logo
HANDOVER.md           integration guide for CMS / backend teams
```

## How it works

- **All content lives in `index.html`.** JavaScript does not inject any text or data; it only shows and hides steps, runs the animations and drives the card carousel.
- **The results are static.** The results screen always shows Voyager, Skywards and Marriott (set by `data-results` on `<ol id="catalog">`). No card-matching logic runs in the browser.
- **The CSS is scoped.** Every rule sits under `.ccw` and the keyframe names start with `ccw-`, so the wizard does not affect the page it is embedded in.
- **There is one global name.** The scripts share `window.CCW` and add nothing else to `window`.

## Integration

See **[HANDOVER.md](HANDOVER.md)** for:

- replacing the static cards with CMS or API data
- embedding the wizard in an existing page
- connecting the form submission (`submitChoice` in `js/thanks.js`)
- re-theming for another brand through the design tokens
- caching (`?v=` on the CSS and script links, raised on every release)
- a test checklist after integration

## Not connected yet

- **Form submission:** the thank-you screen shows a made-up reference number until `submitChoice` calls the real API.
- **Card content:** the card names, benefits and images are placeholders for the CMS to replace.
- **Font:** Plus Jakarta Sans loads from Google Fonts. Self-host it if the target network blocks Google.
