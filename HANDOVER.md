# Credit Card Wizard — handover for CMS / backend integration

This is a **static, front-end-only** build of the credit card wizard.
All wording, options and card details are plain HTML in `index.html`.
The JavaScript never builds content and never calculates which card to show:
it only shows, hides and reorders the HTML that is already on the page, and runs the animations.

There are two things you need to connect:

1. **Card and page content** → render it into the HTML (section 3).
2. **The form submission** → call your API from one function (section 5).

Embedding it in an existing page is covered in section 4; a second brand in section 6.

---

## 1. Project structure

```
index.html          every screen, label, option and card (all content lives here)
css/ccwizardv3.css  all styles, one file (edit this one):
                      1. DESIGN TOKENS at the top: colours, font, radii (the only part to change for another brand)
                      2. WIZARD STYLES, scoped to .ccw, using the tokens only
                      3. STANDALONE PAGE at the end: index.html's own background (scoped to .ccw-page, inert on other sites)
css/ccwizardv3.min.css  the same styles minified: the file index.html loads (regenerate it after every edit, see section 7)
js/ccw.js           all the wizard's JavaScript, one file, in sections (each starts with a ##### banner):
                      CORE (helpers, answers state, card catalogue) · WIZARD (screens, tiles, forms) ·
                      RESULTS (compare table, mobile view, "Change card" sheet) ·
                      THANK YOU + SHARE (Select and contact submit  <- form submit hook, share image) ·
                      STAGE (left panel cards) · SUCCESS ANIMATION (the tick, Lottie data) · START
js/vendor/          lottie player (success tick animation)
images/             card images (images/cards/), icons (images/icons-v2/)
```

**Run it locally:** nothing to install. **Double-click `index.html`** (or drag it into Chrome, Edge, Safari or Firefox).
No Python, Node or web server is needed: the scripts are plain `<script>` files, not ES modules, so browsers run them from disk.

On a web server it works the same: copy the folder as it is (IIS, Apache, Nginx, AEM, a CDN...). There is no build step.

One feature needs a real web address (`https://` or `http://localhost`): the **share image** on the thank-you screen.
Opened from disk, browsers do not allow the page to export a picture made from local files, so Share shows "Could not prepare the image".
Everything else works the same from disk.

**How the scripts fit together:** each file in `js/` is wrapped in its own function and shares what the others need
through one global object, `window.CCW`. Keep the script order in `index.html`: the four libraries (jQuery, Select2, Parsley, Inputmask),
then `js/ccw.js`.

**Libraries (loaded from CDNs, pinned versions):** jQuery 3.7.1, Select2 4.1.0-rc.0 (the two dropdowns), Parsley 2.9.2
(form validation, loaded but not run by the wizard: see section 5) and Inputmask 5.0.9 (the mobile number format), plus Select2's base stylesheet in `<head>`. They add the globals `jQuery` / `$` and the jQuery plugins.
The page therefore needs internet access, or host the files yourself and change the URLs.

---

## 2. Rules that keep it working

The script finds everything by **id, class and `data-*` attribute**. When you turn the HTML into templates:

| Do | Don't |
|---|---|
| Keep all wizard markup inside `<div class="ccw">` | Move wizard elements outside the wrapper (they would lose their styles) |
| Keep every `id`, `class` and `data-*` name and value | Rename or remove them |
| Keep the `hidden` attribute where it is | Remove `hidden`: that variant would then show all the time |
| Render the HTML **before** `js/ccw.js` runs (see 3.4) | Inject HTML after the scripts have started |
| Keep exactly **3** results cards | List more or fewer than 3 (the layout has 3 columns / 3 dots) |
| Keep a card's key the same everywhere it appears | Use different keys for the same card in different places |

The editor guide at the top of `<body>` in `index.html` and the comments on every section explain each block.

---

## 3. Content integration

### 3.1 Which three cards the results show

One attribute on the card catalogue near the end of `index.html`:

```html
<ol class="catalog" id="catalog" hidden data-results="voyager skywards marriott">
```

- Three card keys, separated by spaces, in display order.
- The first one gets the "Recommended" (desktop) and "Best match" (mobile) labels.
- Each key must exist as a `<li data-card="...">` in the same list.

If your system decides the three cards (your own matching), render this attribute with its result.

### 3.2 Card keys

Every card has a key (e.g. `voyager`, `noon-one`, `share-infinite`). The key ties all copies of a card together.
There are 35 cards today; the full list is the `<li data-card="...">` entries of `<ol id="catalog">`.

### 3.3 Where each card appears (render one copy per card in each place)

Search `index.html` for `data-card="<key>"` (and `data-pick="<key>"`) to see a real example of each.

| # | Place | Container | One card's markup | Card data used |
|---|---|---|---|---|
| 1 | **Card catalogue** | `<ol id="catalog">` | `<li data-card="KEY" data-img="IMAGE" data-theme-kind="custom" data-theme-cols="TOP\|MID\|BOTTOM\|GLOW">SHORT NAME</li>` | short name, image, hero colours |
| 2 | Desktop results, column header (x3 columns) | `.chead[data-ci="0/1/2"]` | in `.cface`: `<img data-card="KEY" hidden class="cardimg" src alt>`; in `.cname`: `<span data-card="KEY" hidden>FULL NAME</span>`; in `.ctag`: `<span data-card="KEY" hidden>TAGLINE</span>` | image, full name, tagline |
| 3 | Desktop column picker (x3 columns) | `select[data-col]` | `<option value="KEY">SHORT NAME</option>` inside its group `<optgroup>`; keep the empty `<optgroup label="Your matches" data-matches>` first | short name, group |
| 4 | Desktop compare rows (13 rows) | each `.crow` | `<div class="crow__cell" data-card="KEY" hidden><span>VALUE</span></div>` (use `<span class="na">–</span>` when not offered) | one value per row (see 3.5) |
| 5 | Mobile mini header | `#mmini` | `<img class="mmini__img" data-card="KEY" src hidden>` and `<div data-card="KEY" hidden><p class="mmini__n">SHORT</p><p class="mmini__s">HEADLINE BIG</p></div>` | image, short name, headline |
| 6 | Mobile headline figure | `#mstat` | `<div class="vx" data-card="KEY" hidden><span class="sr-only">SHORT: </span><p class="mstat__big">HEADLINE BIG</p><p class="mstat__sub">HEADLINE SUB</p></div>` | headline |
| 7 | Mobile card name | `#mname` | `<span data-card="KEY" hidden>SHORT</span>` | short name |
| 8 | Mobile "Change card" button | `#cpkBtn` | `<img class="cpk__img" data-card="KEY" src hidden>` and in `.cpk__n`: `<span data-card="KEY" hidden>SHORT</span>` | image, short name |
| 9 | Mobile card details | `#mbenH`, `#mbenT` | `<span data-card="KEY" hidden>SHORT</span>` / `<span data-card="KEY" hidden>TAGLINE</span>` | short name, tagline |
| 10 | Mobile key benefits | `#mbento` | several `<li data-card="KEY" hidden class="kb">`, see 3.6 | key benefits (icon, label, line) |
| 11 | Mobile slide store | `.mstore` | `<div class="mslide" data-card="KEY"><img class="cardimg" src alt></div>` | image |
| 12 | "Change card" sheet | `#csList` | `<button type="button" class="csheet__row" data-pick="KEY" data-q="lowercase search text">` with image, `.csheet__n` SHORT and `.csheet__s` HEADLINE; rows sit under their group heading `<p class="csheet__g" data-g="GROUP">` | image, short name, headline, group |
| 13 | Left panel, chosen card (contact and thank-you) | `#matchName` | `<span data-m="card:KEY" hidden><span class="nm-long">FULL NAME</span><span class="nm-short">SHORT</span></span>` | full + short name |
| 14 | Left panel card carousel | `#flow` + `#dname` | `<div class="fcard" data-i="N"><img src><span class="glint"></span></div>` and `<span data-i="N" hidden>NAME</span>` (same N, in the order they rotate; only `data-i="0"` without `hidden`) | image, name |

**Adding a card:** add it to every place in the table (1–14) with the same key.
**Removing a card:** remove every element with its key.

### 3.4 Card data from an API instead of server-rendered HTML

**Preferred:** render the HTML on the server / in the CMS template. Nothing in `js/` changes.

**If the browser must fetch the data:** the scripts read the page **once, when they load**. HTML added later is not connected.
So build the HTML first, then start the scripts. Replace the wizard `<script>` tags at the end of `index.html` with:

```html
<script>
  (async function () {
    const cards = await fetch('/api/cards').then(r => r.json());   // your endpoint
    renderCards(cards);   // your code: writes the markup from section 3.3 into the page
    // then start the wizard: same files, same order as in index.html
    // then start the wizard (after jQuery, Select2, Parsley and Inputmask)
    await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'js/ccw.js'; s.onload = ok; s.onerror = fail; document.body.appendChild(s); });
  })();
</script>
```

### 3.5 Desktop compare rows

13 rows, in this order (each row has a comment `<!-- Row: ... -->` in `index.html`):
Rewards · Welcome offer · Airport lounge access · Golf · Movie offers · Dining offers · Valet parking · Airport transfers · Concierge · Travel insurance · Joining fee · Annual fee · Minimum salary.
Each row needs one `.crow__cell` per card (a value, or `<span class="na">–</span>`).
To add or remove a row, copy or delete a whole `<div class="crow cgrid">` block.

### 3.6 Mobile key benefit

One row per benefit, in the order they should show:

```html
<li data-card="KEY" hidden class="kb">
  <img class="kb__ic" src="images/icons-v2/rewards.png" alt="" aria-hidden="true" width="36" height="36" loading="lazy" decoding="async">
  <div class="kb__t">
    <p class="kb__l">Rewards</p>                                      <!-- label -->
    <p class="kb__d">20% on noon Food, 10% on NowNow, 5% on noon ...</p>  <!-- the card page's own line -->
  </div>
</li>
```

### 3.7 AED amounts (optional)

Plain text like `AED 1,575` works. To show the new Dirham symbol instead, write:

```html
<span class="dh"><span role="img" aria-label="AED"><svg class="dhs" viewBox="0 0 1000 870" fill="currentColor" aria-hidden="true" focusable="false"><use href="#i-dhs"/></svg></span>1,575</span>
```

(The symbol itself is defined once at the top of `<body>`, `<symbol id="i-dhs">`.)

### 3.8 The three hero cards (left panel)

The three cards in the left-panel stack (`<div class="ccard" data-card="...">` inside `#stack`) are Voyager, Skywards and Marriott.
If you change them, update the same three keys in `js/ccw.js` (CORE section, `var BASE = [...]`) and their `data-theme-kind` in the catalogue (`voyager` / `skywards` / `marriott` use the built-in themes; any other card uses `custom` + `data-theme-cols`).

### 3.9 Questions and options

- Step tiles: each tile is a `<label class="tile">` around a checkbox, `<input type="checkbox" class="tile__in" name="spend" value="airlines">` (step 1, up to 3) or `name="benefit"` (step 2, up to 4; the first one picked is the main one). The value is the answer id sent to your API (section 5); keep it equal to the label's `data-spend` / `data-benefit`. The checkbox is not drawn: the tile shows the state. The tile label is the text shown.
- Subtitle lines under each step title (`data-why`): `default`; step 1 `pick:<id>` after each tap; step 2 `main:<id>` (first pick), `added:<id>` (later picks), `top:<id>` (after removing one); `done` when every pick is used; `limit` after a tap past the limit.
- Left panel pills (`#matchPicks`): one `<li data-pill="step:answer id">` per answer.
- Dropdowns: a normal `<select class="combo__select">` with one `<option value="VALUE">TEXT</option>` per choice (keep the empty first `<option value=""></option>`: it holds the placeholder). `data-placeholder` = the text shown when nothing is chosen, `data-search` = the search box placeholder (leave it out for no search box), `data-no-results` = the text when a search finds nothing. Select2 turns it into the styled dropdown; keep the chevron `<svg class="combo__arrow">` and the `.combo__hd` block after it.
- Validation rules (for the CMS team to run): Parsley attributes are already on each field, e.g. `required data-parsley-required-message="Field is required"`, `data-parsley-pattern="^[0-9]{7,}$" data-parsley-pattern-message="..."` on the mobile, `data-parsley-type-message="..."` on the email. The wizard does not run them. Error styles are ready in the CSS: `.field--bad` on a `.field` turns it red, and a `<p class="field__err">` inside it shows the message.
- Mobile number format: Inputmask attributes on `#f-mobile`, `data-inputmask-mask="99 999 9999"` (shown as `50 123 4567`) with `data-inputmask-autounmask="true"`, so the value read by the script and by Parsley is the digits only (`501234567`). Change the mask there if the format changes.

If you add an answer, add its tile, its `pick:` subtitle line and its pill.

---

## 4. Embedding in another page

The wizard is built to sit inside an existing site without touching it:

- **Every CSS rule is scoped to `.ccw`**, the wrapper around all wizard markup. There are no rules for `*`, `html`, `body`, `img`, `button`, `a` etc. that could reach the host page.
- **Design tokens live on `.ccw`**, not `:root`, so they never overwrite the site's own CSS variables (even if the site also has `--navy`).
- **Animation names are prefixed `ccw-`**, so they cannot clash with the site's `@keyframes`.
- Tested: a host page with its own fonts, colours, `img` / `button` / focus styles, a `--navy` variable and a `rise` animation kept every style with the wizard CSS loaded (0 changes). The old, unscoped CSS would have changed 109 of them.

**To embed:**

1. Load the font (the Google Fonts `<link>` from `index.html`), then Select2's stylesheet, then `css/ccwizardv3.min.css` (it must come after Select2's, to restyle it). Do not copy the `class="ccw-page"` from the demo page's `<body>`: the STANDALONE PAGE section at the end of `css/ccwizardv3.css` uses it to give the demo page its background wall, and it has no effect anywhere else.
2. Put the wizard markup (everything inside `<div class="ccw">...</div>` in `index.html`) where the wizard should appear. The wrapper also holds the card picker sheet, the card catalogue and the Dirham `<symbol>`; keep them inside it.
3. After the markup, load the scripts in the same order as at the end of `index.html`: jQuery, Select2, Parsley, Inputmask, then `js/ccw.js`. If the page already loads jQuery (1.9 or later), do not load it twice: drop that one `<script>`. Same for Select2, Parsley and Inputmask if the site already has them (Select2 4.1 is needed for the `selectionCssClass` option). The wizard's own scripts add only `window.CCW`.

**The only things the wizard touches outside its wrapper (on purpose):**

- `document.body.style.overflow` while a sheet or dialog is open (scroll lock), restored on close.
- The class `ccw-combo-sheet` on `<html>` while a dropdown is open full-screen on a phone.
- Select2's base stylesheet is global (`.select2-container`, `.select2-dropdown` ...), as on any page that uses Select2. The wizard's own look for it is scoped to `.ccw .combo` and its theme name `ccw`, so other Select2 dropdowns on the site keep their style.

**Checked against v3-components (`assets/webxv2/css/style.css`):** loaded before or after the wizard's CSS, on every screen at phone and desktop size, it changes nothing visible. Two of its rules needed a guard in `css/ccwizardv3.css`, now in place: `.field > label` (it floats a label over its input; our `.flabel` resets that) and its bundled Select2 base CSS (it would win ties with our dropdown styles when loaded last; ours are now more specific). For the v3 modal, `css/ccwizardv3.css` also has `#credit-cardwizard-modal form { display: contents; }` (HOST PAGE section); the gap above each form's first field is on that field, so the spacing is the same with or without it. Its `.field { position: relative }`, `body * { font-family: inherit }` and `.btn-navy` / `.btn-ghost` colours reach wizard elements but change nothing you can see.

**Watch the other direction (site CSS reaching into the wizard).** Scoping stops the wizard from changing the site, but broad site rules (for example `button { ... }` or `.tile { ... }`) can still apply to wizard elements wherever the wizard does not set the same property. Check the wizard once on the real page. If site CSS interferes, use more specific site selectors, or isolate the wizard in an `<iframe>` or Shadow DOM. Also make sure the site does not reuse the wizard's element ids (e.g. `body`, `sheet`, `flow`, `stack`, `match`): ids must be unique on a page.

---

## 5. Form submission (not connected yet)

Today, clicking **Select** on a card opens the **Contact** step (mobile and email). Its Continue goes to the thank-you screen with a **random** reference number.
Nothing is sent anywhere. Connect your API in **`submitContact()` in `js/ccw.js`** (THANK YOU + SHARE section) (it runs once the mobile and email are valid):

```js
// js/ccw.js, THANK YOU + SHARE section - current
function submitContact() {
  state.ref = '' + Math.floor(1e11 + Math.random() * 9e11);   // <- placeholder, replace
  go('thanks');
}
```

Example (endpoint and field names are placeholders, use your own):

```js
function submitContact() {
  fetch('/api/card-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card: state.chosen,            // chosen card key (set by Select on Results)
      spend: state.spend,            // ['airlines', 'hotels', 'dining'] (step 1, in pick order)
      mainBenefit: state.benefit,    // 'lounge' (step 2, first pick)
      moreBenefits: state.three,     // ['movie', 'cashback', 'valet'] (step 2, picks 2-4 in order)
      nationality: state.nationality,
      emirate: state.emirate,
      income: state.income,          // digits only, AED per month
      mobile: state.mobile,          // digits only, without +971
      email: state.email,
    }),
  })
    .then(r => r.json())
    .then(d => { state.ref = String(d.reference); go('thanks'); })  // your reference number
    .catch(() => { /* show an error message and let the customer try again */ });
}
```

Also consider disabling the Contact step's Continue button while the request is in flight (double-clicks).

**Validation is not done by the wizard.** The CMS team adds it. Both steps are real `<form>`s with the Parsley rules and messages already on their fields, and the hook is the Continue handler in `js/ccw.js` (search for `CMS: validate`): run the validation there and stop when it fails, for example

```js
if (!jq($('form', viewEl(state.screen))).parsley().validate()) return;
```

Today both Continue buttons go straight on, whatever is in the fields.

---

## 6. Another brand (e.g. Emirates Islamic)

All colours, the font and the main corner radii are **design tokens**, in the DESIGN TOKENS section at the top of `css/ccwizardv3.css`.
The rest of the CSS and the JS contain no colour or font values of their own, so a second brand is a token change, not a code change.

**To create a brand version:**

1. Take a copy of the project for the brand.
2. In the DESIGN TOKENS section at the top of `css/ccwizardv3.css`, change:
   - **Palette** (section 1): `--c-primary-*` (the deep brand colour, today's navy) and `--c-accent-*` (the bright brand colour, today's blue).
     Each colour has a channel token (`--c-primary-794-rgb: 11 43 94;`) and every translucent use follows it, so change the `-rgb` values only.
     The number in the name is darkness (000 = white, 999 = black); keep the same light-to-dark order.
     `neutral`, `danger`, `success` and the decorative `glow-*` colours can usually stay.
   - **Typography** (section 2): `--font-sans`, and the Google Fonts `<link>` in `index.html`.
   - **Shape** (section 3): `--radius-*` if the brand uses different corner rounding.
   - **Share image** (section 5): `--share-*` colours.
3. Replace the **brand assets** (these are files, not tokens):
   - logo: `data-share-logo` on `#shSheet` in `index.html` (used on the share image)
   - card images (`images/cards/`, `images/*.webp`) and the per-card hero colours (`data-theme-kind` / `data-theme-cols` in the catalogue)
   - the 3D icons (`images/icons-v2/`), which are coloured in the brand palette
   - the success tick animation in `js/ccw.js`, SUCCESS ANIMATION section (export a new Lottie JSON in the brand colours and paste it in place of the object there)
   - brand wording in `index.html`: page `<title>`, card names, `data-share-*` texts, the bank name in the search placeholder

**Not tokenised on purpose:** layout sizes and spacing, and a few one-off radii (2-10px, 14px, 20px, 32-34px), which are geometry the brands share. The UAE flag colours next to the mobile number are the national flag, not brand colours.

The palette keeps every shade the original design used (98 colours), so the current site stays pixel-identical. A designer can later merge close shades into a shorter scale; the token names make that a find-and-replace.

---

## 7. Things to know

- **No card calculation in this project.** Results always show the 3 cards in `data-results`. The customer can still swap cards with the desktop column pickers or the mobile "Change card" sheet.
- **Answers are only displayed**, never scored: they highlight tiles, change the subtitle line and show as pills in the left panel.
- **A page, not a pop-up:** the close (x) button and the leave dialog are hidden by CSS (V6 DESIGN section of `css/ccwizardv3.css`); their markup stays in case a pop-up version is wanted again.
- **Manchester United** is a closed card: it is not offered in the column pickers or the "Change card" sheet. Its other markup stays, in case it returns.
- **Caching:** the CSS and script links in `index.html` end in `?v=21`. **Raise that number on every release** (e.g. `?v=22` on all of them), or returning visitors may run old cached files against the new HTML and the wizard will not start.
- **Minified CSS:** `index.html` loads `css/ccwizardv3.min.css`. Edit `css/ccwizardv3.css`, then regenerate the minified file (Node.js needed, nothing installed in the project):

  ```bash
  npx lightningcss-cli@1.25.1 --minify --targets "safari >= 15, ios_saf >= 15, chrome >= 90, firefox >= 90, edge >= 90" css/ccwizardv3.css -o css/ccwizardv3.min.css
  ```

  Keep the `--targets`: without them the minifier drops the `-webkit-backdrop-filter` prefixes Safari needs and some `100vh` fallbacks.
- **Fonts and libraries:** Plus Jakarta Sans (Google Fonts) and jQuery, Select2, Parsley and Inputmask (CDNs) load from the internet; self-host them for a network without internet access.
- **Share:** the thank-you "Share" button draws an image in the browser and opens the device's share sheet; its texts are the `data-share-*` attributes on `#shSheet` in `index.html`.
- **Images** with `?v=2` in the path are cache-busted already; keep or replace with your CDN URLs.

---

## 8. Test checklist after integration

- [ ] Steps 1-2: tiles select / unselect and show their pick number (a star on the first benefit); Continue enables after one pick; a tap past the limit (3, then 4) shows the limit message; the subtitle line changes.
- [ ] Left panel: card carousel rotates, picks appear as pills.
- [ ] About you: your validation stops Continue with empty Emirates / income and shows the messages; filling them lets you through.
- [ ] Results (desktop, wide window): the 3 cards from `data-results` show, first one "Recommended"; every compare row has a value per card; the column picker swaps a card.
- [ ] Results (mobile, narrow window): swipe / arrows / dots change the card; "Change card" opens the sheet, search works, picking a card swaps it.
- [ ] Select opens Contact; your validation stops Continue with an empty or short mobile / invalid email; Previous goes back to Results.
- [ ] Contact Continue: your API receives the data; the thank-you screen shows your reference number; Copy and Share work (test Share on the real web address, not from disk).
- [ ] Done (thank-you screen) resets the wizard to step 1.
- [ ] Browser console shows no errors.
