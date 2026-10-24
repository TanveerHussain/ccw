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
css/main.css        all styles, one file:
                      1. DESIGN TOKENS at the top: colours, font, radii (the only part to change for another brand)
                      2. WIZARD STYLES, scoped to .ccw, using the tokens only
                      3. STANDALONE PAGE at the end: index.html's own background (scoped to .ccw-page, inert on other sites)
js/main.js          entry point, loaded last (after the other scripts)
js/core.js          small DOM helpers, the customer's answers (state), card catalogue
js/wizard.js        screen switching / go(), steps 1-3 (tiles), step 4 (form + validation)
js/results.js       results: desktop compare table, mobile one-card view, "Change card" sheet
js/thanks.js        thank-you screen, leave dialog, share image + share sheet   <- form submit hook
js/stage.js         left panel: card carousel, chosen card, guide line, tilt effect
js/vendor/          lottie player (success tick animation)
images/             card images (images/cards/), icons (images/icons/, images/icons-light/)
animations/         success.js: the tick animation data (an exported Lottie JSON wrapped as a script)
```

**Run it locally:** nothing to install. **Double-click `index.html`** (or drag it into Chrome, Edge, Safari or Firefox).
No Python, Node or web server is needed: the scripts are plain `<script>` files, not ES modules, so browsers run them from disk.

On a web server it works the same: copy the folder as it is (IIS, Apache, Nginx, AEM, a CDN...). There is no build step.

One feature needs a real web address (`https://` or `http://localhost`): the **share image** on the thank-you screen.
Opened from disk, browsers do not allow the page to export a picture made from local files, so Share shows "Could not prepare the image".
Everything else works the same from disk.

**How the scripts fit together:** each file in `js/` is wrapped in its own function and shares what the others need
through one global object, `window.CCW`. That is the only global name the wizard adds, so it cannot clash with jQuery
or the bank site's scripts. Keep the script order in `index.html`: `animations/success.js`, `core`, `wizard`, `results`,
`thanks`, `stage`, `main`.

---

## 2. Rules that keep it working

The script finds everything by **id, class and `data-*` attribute**. When you turn the HTML into templates:

| Do | Don't |
|---|---|
| Keep all wizard markup inside `<div class="ccw">` | Move wizard elements outside the wrapper (they would lose their styles) |
| Keep every `id`, `class` and `data-*` name and value | Rename or remove them |
| Keep the `hidden` attribute where it is | Remove `hidden`: that variant would then show all the time |
| Render the HTML **before** `js/main.js` runs (see 3.4) | Inject HTML after the scripts have started |
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
| 10 | Mobile benefit tiles | `#mbento` | several `<li data-card="KEY" hidden class="btile">` (add `btile--wide` for a full-width tile), see 3.6 | benefit tiles |
| 11 | Mobile slide store | `.mstore` | `<div class="mslide" data-card="KEY"><img class="cardimg" src alt></div>` | image |
| 12 | "Change card" sheet | `#csList` | `<button type="button" class="csheet__row" data-pick="KEY" data-q="lowercase search text">` with image, `.csheet__n` SHORT and `.csheet__s` HEADLINE; rows sit under their group heading `<p class="csheet__g" data-g="GROUP">` | image, short name, headline, group |
| 13 | Left panel, chosen card (thank-you) | `#matchName` | `<span data-m="card:KEY" hidden><span class="nm-long">FULL NAME</span><span class="nm-short">SHORT</span></span>` | full + short name |
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
    for (const src of ['animations/success.js', 'js/core.js', 'js/wizard.js', 'js/results.js', 'js/thanks.js', 'js/stage.js', 'js/main.js']) {
      await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.body.appendChild(s); });
    }
  })();
</script>
```

### 3.5 Desktop compare rows

13 rows, in this order (each row has a comment `<!-- Row: ... -->` in `index.html`):
Rewards · Welcome offer · Airport lounge access · Golf · Movie offers · Dining offers · Valet parking · Airport transfers · Concierge · Travel insurance · Joining fee · Annual fee · Minimum salary.
Each row needs one `.crow__cell` per card (a value, or `<span class="na">–</span>`).
To add or remove a row, copy or delete a whole `<div class="crow cgrid">` block.

### 3.6 Mobile benefit tile

```html
<li data-card="KEY" hidden class="btile btile--wide">        <!-- btile--wide = full width; omit for half width -->
  <div class="btile__top">
    <p class="btile__lab">Rewards</p>                          <!-- label -->
    <img class="btile__ic" src="images/icons/rewards.png" alt="" aria-hidden="true" width="48" height="48" loading="lazy" decoding="async">
  </div>
  <p class="btile__num">20<small>%</small></p>               <!-- optional big figure -->
  <p class="btile__val">on noon Food, 10% on NowNow ...</p>    <!-- sentence -->
</li>
```

Half-width tiles look best in pairs.

### 3.7 AED amounts (optional)

Plain text like `AED 1,575` works. To show the new Dirham symbol instead, write:

```html
<span class="dh"><span role="img" aria-label="AED"><svg class="dhs" viewBox="0 0 1000 870" fill="currentColor" aria-hidden="true" focusable="false"><use href="#i-dhs"/></svg></span>1,575</span>
```

(The symbol itself is defined once at the top of `<body>`, `<symbol id="i-dhs">`.)

### 3.8 The three hero cards (left panel)

The three cards in the left-panel stack (`<div class="ccard" data-card="...">` inside `#stack`) are Voyager, Skywards and Marriott.
If you change them, update the same three keys in `js/core.js` (`var BASE = [...]`) and their `data-theme-kind` in the catalogue (`voyager` / `skywards` / `marriott` use the built-in themes; any other card uses `custom` + `data-theme-cols`).

### 3.9 Questions and options

- Step tiles: `data-spend="..."`, `data-benefit="..."`, `data-three="..."` = the answer ids sent to your API (section 5). The tile label is the text shown.
- Subtitle lines under each step title (`data-why`): `default`, `pick:<answer id>` after each tap, `done` when complete.
- Left panel pills (`#matchPicks`): one `<li data-pill="step:answer id">` per answer.
- Dropdown options: `<div class="combo__opt" role="option" id="FIELD-opt-N" aria-selected="false" data-opt="VALUE">TEXT</div>`; `data-opt` is the value, and the `id` (unique, e.g. `nationality-opt-0`) is needed for keyboard navigation.

If you add an answer, add its tile, its `pick:` subtitle line and its pill.

---

## 4. Embedding in another page

The wizard is built to sit inside an existing site without touching it:

- **Every CSS rule is scoped to `.ccw`**, the wrapper around all wizard markup. There are no rules for `*`, `html`, `body`, `img`, `button`, `a` etc. that could reach the host page.
- **Design tokens live on `.ccw`**, not `:root`, so they never overwrite the site's own CSS variables (even if the site also has `--navy`).
- **Animation names are prefixed `ccw-`**, so they cannot clash with the site's `@keyframes`.
- Tested: a host page with its own fonts, colours, `img` / `button` / focus styles, a `--navy` variable and a `rise` animation kept every style with the wizard CSS loaded (0 changes). The old, unscoped CSS would have changed 109 of them.

**To embed:**

1. Load the font (the Google Fonts `<link>` from `index.html`), then `css/main.css`. Do not copy the `class="ccw-page"` from the demo page's `<body>`: the STANDALONE PAGE section at the end of `main.css` uses it to give the demo page its background wall, and it has no effect anywhere else.
2. Put the wizard markup (everything inside `<div class="ccw">...</div>` in `index.html`) where the wizard should appear. The wrapper also holds the card picker sheet, the card catalogue and the Dirham `<symbol>`; keep them inside it.
3. After the markup, load the wizard scripts in the same order as at the end of `index.html` (`animations/success.js`, then `js/core.js` ... `js/main.js`). They are plain scripts; the only global they add is `window.CCW`.

**The only things the wizard touches outside its wrapper (on purpose):**

- `document.body.style.overflow` while a sheet or dialog is open (scroll lock), restored on close.
- The class `ccw-combo-sheet` on `<html>` while a dropdown is open full-screen on a phone.

**Watch the other direction (site CSS reaching into the wizard).** Scoping stops the wizard from changing the site, but broad site rules (for example `button { ... }` or `.tile { ... }`) can still apply to wizard elements wherever the wizard does not set the same property. Check the wizard once on the real page. If site CSS interferes, use more specific site selectors, or isolate the wizard in an `<iframe>` or Shadow DOM. Also make sure the site does not reuse the wizard's element ids (e.g. `body`, `sheet`, `flow`, `stack`, `match`): ids must be unique on a page.

---

## 5. Form submission (not connected yet)

Today, clicking **Select** on a card goes straight to the thank-you screen with a **random** reference number.
Nothing is sent anywhere. Connect your API in **`submitChoice()` in `js/thanks.js`**:

```js
// js/thanks.js - current
export function submitChoice(k) {
  state.chosen = k;
  state.showErr = false;
  state.ref = '' + Math.floor(1e11 + Math.random() * 9e11);   // <- placeholder, replace
  go('thanks');
}
```

Example (endpoint and field names are placeholders, use your own):

```js
export function submitChoice(k) {
  state.chosen = k;
  state.showErr = false;
  fetch('/api/card-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card: k,                       // chosen card key
      spend: state.spend,            // ['airlines', 'hotels', 'dining'] (step 1, in pick order)
      mustHave: state.benefit,       // 'lounge' (step 2)
      extras: state.three,           // ['golf', 'travelins', 'valet'] (step 3)
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

Also consider disabling the Select buttons while the request is in flight (double-clicks).

**Validation already in place (step 4):** Emirates, monthly income, mobile (at least 7 digits) and email are required; nationality is optional. The customer cannot reach the results without them.

---

## 6. Another brand (e.g. Emirates Islamic)

All colours, the font and the main corner radii are **design tokens**, in the DESIGN TOKENS section at the top of `css/main.css`.
The rest of the CSS and the JS contain no colour or font values of their own, so a second brand is a token change, not a code change.

**To create a brand version:**

1. Take a copy of the project for the brand.
2. In the DESIGN TOKENS section at the top of `css/main.css`, change:
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
   - the 3D icons (`images/icons/`, `images/icons-light/`), which are coloured in the brand palette
   - the success tick animation `animations/success.js` (export a new Lottie JSON in the brand colours and paste it in place of the object in that file)
   - brand wording in `index.html`: page `<title>`, card names, `data-share-*` texts, the bank name in the search placeholder

**Not tokenised on purpose:** layout sizes and spacing, and a few one-off radii (2-10px, 14px, 20px, 32-34px), which are geometry the brands share. The UAE flag colours next to the mobile number are the national flag, not brand colours.

The palette keeps every shade the original design used (98 colours), so the current site stays pixel-identical. A designer can later merge close shades into a shorter scale; the token names make that a find-and-replace.

---

## 7. Things to know

- **No card calculation in this project.** Results always show the 3 cards in `data-results`. The customer can still swap cards with the desktop column pickers or the mobile "Change card" sheet.
- **Answers are only displayed**, never scored: they highlight tiles, change the subtitle line and show as pills in the left panel.
- **Caching:** the CSS and script links in `index.html` end in `?v=4`. **Raise that number on every release** (e.g. `?v=4` on all of them), or returning visitors may run old cached scripts against the new HTML and the wizard will not start.
- **Fonts:** Plus Jakarta Sans is loaded from Google Fonts (the page needs internet access, or self-host the font).
- **Share:** the thank-you "Share" button draws an image in the browser and opens the device's share sheet; its texts are the `data-share-*` attributes on `#shSheet` in `index.html`.
- **Images** with `?v=2` in the path are cache-busted already; keep or replace with your CDN URLs.

---

## 8. Test checklist after integration

- [ ] Steps 1-3: tiles select / unselect, "x of 3 selected" updates, Continue enables at 3 (1 on step 2), the subtitle line changes.
- [ ] Left panel: card carousel rotates, picks appear as pills.
- [ ] Step 4: Continue with empty fields shows the 4 error messages; filling them lets you through.
- [ ] Results (desktop, wide window): the 3 cards from `data-results` show, first one "Recommended"; every compare row has a value per card; the column picker swaps a card.
- [ ] Results (mobile, narrow window): swipe / arrows / dots change the card; "Change card" opens the sheet, search works, picking a card swaps it.
- [ ] Select: your API receives the data; the thank-you screen shows your reference number; Copy and Share work (test Share on the real web address, not from disk).
- [ ] Done (thank-you screen) resets the wizard to step 1; the close (x) button asks to confirm, and Leave resets it.
- [ ] Browser console shows no errors.
