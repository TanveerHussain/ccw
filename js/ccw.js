/* ============================================================
   CREDIT CARD WIZARD - all the wizard's JavaScript, one file (load it after jQuery, Select2, Parsley and Inputmask).
   Every screen, label and card is written in index.html. The JS never builds content:
   it shows / hides / reorders that markup, shows the three cards listed in #catalog (data-results),
   and drives the animations, the carousels, the forms and the share image.
   The only values it writes are runtime ones: counts, the reference number and the user's own picks.

   Sections, in this order (each starts with a ##### banner; they share what they need through window.CCW):
     CORE                shared helpers, the customer's answers (state), card catalogue
     WIZARD              screens / go(), steps 1-2 (tiles), About you and Contact (forms)
     RESULTS             desktop compare table and the mobile one-card view
     THANK YOU + SHARE   Select and contact submit (API hook), thank-you screen, share image + share sheet
     STAGE               left panel: card carousel, chosen card, guide line, tilt
     SUCCESS ANIMATION   the tick animation data (Lottie)
     START               draws the first screen
   ============================================================ */

/* ############################################################
   CORE
   Shared foundation: DOM helpers, the customer's answers (state), and the card catalogue.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* ============================================================
     DOM HELPERS - small shared utilities used by every module
     ============================================================ */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function each(sel, fn, root) {
    (root || document).querySelectorAll(sel).forEach(fn);
  }
  /* in a box of variants, show only the one(s) whose attribute equals val */
  function only(root, attr, val) {
    if (root)
      each(
        '[' + attr + ']',
        function (el) {
          el.hidden = el.getAttribute(attr) !== val;
        },
        root,
      );
  }
  function replay(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function swapIn(el, cls) {
    if (!reduceMQ.matches) replay(el, cls);
  }


  /* a written list of words (.wls > .wl): show the given ones, in order, with ", " and " and " between them */
  function orderWords(wrap, ids) {
    var ws = {};
    each(
      '.wl',
      function (w) {
        ws[w.dataset.w] = w;
        w.hidden = true;
        w.classList.remove('is-mid', 'is-last');
      },
      wrap,
    );
    ids = ids.filter(function (id) {
      return ws[id];
    });
    ids.forEach(function (id, i) {
      var w = ws[id];
      wrap.appendChild(w);
      w.hidden = false;
      if (i > 0) w.classList.add(i === ids.length - 1 ? 'is-last' : 'is-mid');
    });
  }

  /* ============================================================
     STATE
     ============================================================ */
  /* the three hero cards on the left panel */
  var BASE = ['voyager', 'skywards', 'marriott'];
  /* the three cards the results screen shows, in order: data-results on <ol id="catalog"> in index.html */
  var RESULTS = $('#catalog').dataset.results.split(/\s+/);
  var state = {
    screen: 'spend',
    spend: [],
    benefit: null,
    three: [],
    emirate: '',
    nationality: '',
    income: '',
    mobile: '',
    email: '',
    cols: RESULTS.slice(),
    order: RESULTS.slice(),
    chosen: null,
    ref: null,
  };
  function resetState() {
    state.spend = [];
    state.benefit = null;
    state.three = [];
    state.emirate = '';
    state.nationality = '';
    state.income = '';
    state.mobile = '';
    state.email = '';
    state.cols = RESULTS.slice();
    state.order = RESULTS.slice();
    state.chosen = null;
    state.ref = null;
  }

  /* ============================================================
     CARD CATALOGUE - read once from <ol id="catalog">
     ============================================================ */
  var CAT = {};
  each('#catalog > li', function (li) {
    var d = li.dataset;
    CAT[d.card] = { short: li.textContent, img: d.img, themeKind: d.themeKind, cols: d.themeCols.split('|') };
  });

  /* keep Tab / Shift+Tab inside an open dialog (leave confirmation, share sheet, card picker) */
  function shown(el) {
    return !el.closest('[hidden]') && el.getClientRects().length > 0;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var d = [].filter.call(document.querySelectorAll('[aria-modal="true"]'), shown)[0];
    if (!d) return;
    var f = [].filter.call(d.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'), function (el) {
      return !el.disabled && shown(el);
    });
    if (!f.length) return;
    var first = f[0],
      last = f[f.length - 1],
      a = document.activeElement;
    if (!d.contains(a)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && a === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* shared with the other files (window.CCW) */
  CCW.$ = $;
  CCW.each = each;
  CCW.only = only;
  CCW.replay = replay;
  CCW.swapIn = swapIn;
  CCW.orderWords = orderWords;
  CCW.resetState = resetState;
  CCW.reduceMQ = reduceMQ;
  CCW.BASE = BASE;
  CCW.RESULTS = RESULTS;
  CCW.state = state;
  CCW.CAT = CAT;
})((window.CCW = window.CCW || {}));

/* ############################################################
   WIZARD
   Navigation and the question steps: screens / go(), steps 1-2 (tiles), about you and contact (forms).
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from the CORE section */
  var RESULTS = CCW.RESULTS,
    state = CCW.state;
  function $() {
    return CCW.$.apply(this, arguments);
  }
  function each() {
    return CCW.each.apply(this, arguments);
  }
  function only() {
    return CCW.only.apply(this, arguments);
  }
  function replay() {
    return CCW.replay.apply(this, arguments);
  }
  function orderWords() {
    return CCW.orderWords.apply(this, arguments);
  }
  /* from the RESULTS section */
  function setupDesk() {
    return CCW.setupDesk.apply(this, arguments);
  }
  function resetActive() {
    return CCW.resetActive.apply(this, arguments);
  }
  function setupMobile() {
    return CCW.setupMobile.apply(this, arguments);
  }
  /* from the THANK YOU section */
  function setupThanks() {
    return CCW.setupThanks.apply(this, arguments);
  }
  function playDone() {
    return CCW.playDone.apply(this, arguments);
  }
  function submitContact() {
    return CCW.submitContact.apply(this, arguments);
  }
  /* from the STAGE section */
  function deckReact() {
    return CCW.deckReact.apply(this, arguments);
  }
  function stageSync() {
    return CCW.stageSync.apply(this, arguments);
  }

  /* ============================================================
     SCREENS - each one is a [data-view] block in #body; render() shows the current one
     ============================================================ */
  var body = $('#body'),
    pbar = $('#pbar'),
    pbarTop = $('#pbarTop'),
    stepind = $('#stepind'),
    topBack = $('#topBack'),
    sheet = $('#sheet');
  /* where the top-left back arrow goes per screen (mobile) */
  var BACK = { benefit: 'spend', about: 'benefit', results: 'about', contact: 'results' };
  var SEG = { spend: 1, benefit: 2, about: 4, results: 5, contact: 6, thanks: 6 };
  function isMobile() {
    /* same breakpoints as the phone / short-screen layouts in css/ccwizardv3.css, so steps and results always use the same layout */
    return window
      .matchMedia('(max-width:699.98px),(max-width:820px) and (min-height:641px),(max-width:1100px) and (max-height:640px)')
      .matches;
  }
  function viewEl(s) {
    return s === 'results'
      ? $('[data-view="results"][data-layout="' + (isMobile() ? 'mob' : 'desk') + '"]', body)
      : $('[data-view="' + s + '"]', body);
  }
  function render() {
    var s = state.screen,
      seg = SEG[s] || 0,
      wide = s === 'results';
    [pbar, pbarTop].forEach(function (b) {
      [].forEach.call(b.children, function (i, n) {
        i.classList.toggle('on', n < seg);
      });
    });
    pbar.setAttribute('aria-valuenow', seg);
    only(stepind, 'data-s', s);
    var st = $('[data-s="' + s + '"]', stepind),
      step = st ? st.textContent : '';
    stepind.style.visibility = step && !wide ? 'visible' : 'hidden';
    if (step) pbar.setAttribute('aria-valuetext', step);
    else pbar.removeAttribute('aria-valuetext');
    sheet.classList.toggle('is-wide', wide);
    sheet.setAttribute('data-screen', s);
    sheet.classList.toggle('has-back', !!BACK[s]);
    if (BACK[s]) topBack.setAttribute('data-on', '');
    else topBack.removeAttribute('data-on');
    body.className = 'body' + (wide ? ' body--res' : '');
    var v = viewEl(s);
    each(
      '[data-view]',
      function (el) {
        el.hidden = el !== v;
      },
      body,
    );
    if (PICK[s]) {
      syncTiles();
      syncWhy(true);
    }
    if (wide) {
      if (isMobile()) setupMobile();
      else setupDesk();
    }
    if (s === 'thanks') setupThanks();
    body.scrollTop = 0;
    stageSync();
  }
  function go(s) {
    if (s === 'results') resetActive();
    clearLastPick();
    state.screen = s;
    render();
    window.scrollTo(0, 0);
    /* keyboard and screen-reader users land on the new screen's title instead of the page body */
    var h = $('h1', viewEl(s));
    if (h) h.focus({ preventScroll: true });
    if (s === 'thanks') playDone();
  }
  topBack.onclick = function () {
    var bk = BACK[state.screen];
    if (bk) go(bk);
  };
  each('[data-next]', function (el) {
    el.onclick = function () {
      if (!el.disabled) go(el.dataset.next);
    };
  });
  each('[data-back]', function (el) {
    el.onclick = function () {
      go(el.dataset.back);
    };
  });

  /* ============================================================
     STEPS 1-2 - tiles. Picks are ranked: the badge shows 1, 2, 3; on step 2 the first benefit is the main one (star)
     ============================================================ */
  var PICK = { spend: 3, benefit: 4 };
  /* step 2 keeps the main benefit in state.benefit and the others, in order, in state.three */
  function picked(s) {
    return s === 'benefit' ? (state.benefit ? [state.benefit] : []).concat(state.three) : state[s];
  }
  var lastPick = null;
  function clearLastPick() {
    lastPick = null;
  }
  function syncTiles() {
    var s = state.screen,
      v = viewEl(s),
      max = PICK[s],
      cur = picked(s);
    each(
      '[data-' + s + ']',
      function (el) {
        var id = el.getAttribute('data-' + s),
          r = cur.indexOf(id),
          on = r > -1,
          dim = cur.length >= max && !on,
          main = on && r === 0 && s === 'benefit';
        var box = $('.tile__in', el);
        el.classList.toggle('is-on', on);
        el.classList.toggle('is-main', main);
        $('.tile__rank b', el).textContent = on ? r + 1 : '';
        el.classList.toggle('dim', dim);
        box.checked = on;
        if (dim) box.setAttribute('aria-disabled', 'true');
        else box.removeAttribute('aria-disabled');
        /* screen readers hear the pick order too ("Airlines, pick 1"); unpicked tiles use their label text */
        if (on) box.setAttribute('aria-label', $('.tile__lbl', el).textContent.replace(/\u00ad/g, '') + (main ? ', main pick' : ', pick ' + (r + 1)));
        else box.removeAttribute('aria-label');
      },
      v,
    );
    each(
      '.count .pips i',
      function (p, i) {
        p.classList.toggle('on', i < cur.length);
      },
      v,
    );
    $('[data-count]', v).textContent = cur.length;
    $('[data-next]', v).disabled = !cur.length; /* one pick is enough to go on */
  }
  /* a tap past the limit says why nothing happened */
  function nudge() {
    replay($('.count', viewEl(state.screen)), 'is-nudge');
    syncWhy(false, 'limit');
  }
  function afterPick(el, id) {
    lastPick = id;
    syncTiles();
    syncWhy();
    if (el.classList.contains('is-on')) {
      replay(el, 'just-on');
      deckReact();
    }
    stageSync();
  }
  /* each tile is a <label> around a checkbox: a click or Space toggles it, and the change is checked against the limit here */
  ['spend', 'benefit'].forEach(function (s) {
    each('[data-' + s + '] .tile__in', function (box) {
      var el = box.parentNode;
      box.onchange = function () {
        var id = box.value,
          a = picked(s),
          i = a.indexOf(id);
        if (i > -1) a.splice(i, 1);
        else if (a.length < PICK[s]) a.push(id);
        else {
          box.checked = false;
          nudge();
          return;
        }
        if (s === 'benefit') {
          state.benefit = a[0] || null;
          state.three = a.slice(1);
        } else state.spend = a;
        afterPick(el, id);
      };
    });
  });
  /* tile cursor spotlight (pointer devices); reduced motion users still get the static states */
  each('.tile', function (t) {
    t.onpointermove = function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', e.clientX - r.left + 'px');
      t.style.setProperty('--my', e.clientY - r.top + 'px');
    };
  });

  /* the subtitle under each step title: one line per state is written in the markup, this picks which */
  function whyKey() {
    var s = state.screen,
      p = picked(s),
      i = lastPick ? p.indexOf(lastPick) : -1;
    if (p.length === PICK[s]) return 'done';
    if (s === 'benefit') {
      if (i === 0) return 'main:' + lastPick;
      if (i > 0) return 'added:' + lastPick;
      return p.length ? 'top:' + p[0] : 'default';
    }
    return i > -1 ? 'pick:' + lastPick : 'default';
  }
  function syncWhy(quiet, key) {
    var box = $('.ssub', viewEl(state.screen)),
      k = key || whyKey();
    if (!box) return;
    box.classList.toggle('is-warn', k === 'limit');
    if (k === 'limit') {
      box.setAttribute('data-on', k);
      only(box, 'data-why', k);
      replay(box, 'is-warn');
      return;
    }
    if (k === 'done' && state.screen === 'spend') orderWords($('[data-why="done"] .wls', box), state.spend);
    if (box.getAttribute('data-on') === k) return;
    box.setAttribute('data-on', k);
    only(box, 'data-why', k);
    if (!quiet) replay(box, 'is-new');
  }

  /* ============================================================
     FORMS - about you (before Results) and contact details (after Select)
     Validation is not done here: the CMS team adds it (the data-parsley-* rules and messages are already in index.html).
     Dropdowns: Select2 on each <select class="combo__select">, styled in css/ccwizardv3.css to look like the rest of the form.
     ============================================================ */
  var jq = window.jQuery;
  /* Inputmask: the format is the data-inputmask-* attributes on the field (index.html).
     Started before the handlers below, so they see the value after Inputmask has formatted it */
  jq('[data-inputmask-mask]').inputmask();
  each('input[data-set]', function (el) {
    /* Enter in any field = Continue */
    el.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('[data-validate]', viewEl(state.screen)).click();
      }
    };
    el.oninput = function () {
      var val = el.value;
      /* the mobile number is formatted by Inputmask; keep its digits only */
      if (el.inputmask) val = el.inputmask.unmaskedvalue();
      else if (el.dataset.set === 'income') {
        var c = el.selectionStart,
          before = val;
        val = val.replace(/\D/g, '');
        if (val !== before) {
          el.value = val;
          try {
            el.setSelectionRange(c - 1, c - 1);
          } catch (e) {}
        }
      }
      state[el.dataset.set] = val;
    };
  });

  each('form', function (form) {
    form.onsubmit = function (e) {
      e.preventDefault();
    };
  });
  each('[data-validate]', function (el) {
    el.onclick = function () {
      /* CMS: validate the step's <form> here and stop when it fails, e.g.
         if (!jq($('form', viewEl(state.screen))).parsley().validate()) return; */
      if (el.dataset.validate === 'contact') return submitContact();
      /* results always show the three cards listed in data-results (index.html); the first is Recommended */
      state.order = RESULTS.slice();
      state.cols = RESULTS.slice();
      go('results');
    };
  });

  /* Select2 dropdowns. The options are the <option>s in the markup; the chevron and the phone header (title + Done)
     are moved from the markup into Select2's control and list. Phones get the list full screen, sized to the
     visible viewport so the keyboard never covers it. */
  function phone() {
    return matchMedia('(max-width:699.98px),(pointer:coarse) and (max-width:900px)').matches;
  }
  each('[data-combo]', function (box) {
    var sel = $('select', box),
      $s = jq(sel),
      hd = $('.combo__hd', box),
      vv = window.visualViewport,
      pop;
    $s.select2({
      theme: 'ccw',
      width: '100%',
      dropdownParent: jq(box),
      placeholder: sel.dataset.placeholder,
      minimumResultsForSearch: sel.dataset.search ? 0 : Infinity,
      selectionCssClass: 'combo__ctrl is-empty',
      language: {
        noResults: function () {
          return sel.dataset.noResults || '';
        },
      },
    });
    var ctrl = jq(sel).next('.select2').find('.select2-selection')[0];
    $('.select2-selection__arrow', ctrl).replaceChildren($('.combo__arrow', box));
    /* phones: Select2 opens on the finger going down, and the full-screen list then sits under the finger, so the
       lift-off (mouseup / click) would pick whatever option is there and close the list again. Ignore it briefly. */
    var openedAt = 0;
    ['mouseup', 'click'].forEach(function (t) {
      $s.data('select2').$dropdown[0].addEventListener(
        t,
        function (e) {
          if (Date.now() - openedAt < 350) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
        true,
      );
    });
    function fit() {
      var h = vv ? vv.height : innerHeight,
        t = vv ? vv.offsetTop : 0;
      pop.style.setProperty('--vvh', h + 'px');
      pop.style.setProperty('--vvt', t + 'px');
    }
    $s.on('select2:open', function () {
      box.classList.add('is-open');
      pop = $('.select2-dropdown', box);
      var q = $('.select2-search__field', pop);
      if (q && sel.dataset.search) {
        q.placeholder = sel.dataset.search;
        q.setAttribute('aria-label', sel.dataset.search);
      }
      if (phone()) {
        openedAt = Date.now();
        box.classList.add('is-sheet');
        pop.prepend(hd);
        document.documentElement.classList.add('ccw-combo-sheet');
        document.body.style.overflow = 'hidden';
        fit();
        if (vv) {
          vv.addEventListener('resize', fit);
          vv.addEventListener('scroll', fit);
        }
      } else pop.scrollIntoView({ block: 'nearest' });
    });
    $s.on('select2:close', function () {
      box.classList.remove('is-open');
      if (!box.classList.contains('is-sheet')) return;
      box.classList.remove('is-sheet');
      box.appendChild(hd);
      document.documentElement.classList.remove('ccw-combo-sheet');
      document.body.style.overflow = '';
      if (vv) {
        vv.removeEventListener('resize', fit);
        vv.removeEventListener('scroll', fit);
      }
    });
    $('.combo__close', hd).onclick = function () {
      $s.select2('close');
    };
    $s.on('change', function () {
      state[sel.dataset.set] = sel.value;
      ctrl.classList.toggle('is-empty', !sel.value);
      stageSync();
    });
  });
  /* empty every field and dropdown (after Done or Leave) */
  function resetForm() {
    each('input[data-set]', function (el) {
      el.value = '';
    });
    each('[data-combo] select', function (sel) {
      jq(sel).val('').trigger('change');
    });
  }

  /* shared with the other files (window.CCW) */
  CCW.isMobile = isMobile;
  CCW.viewEl = viewEl;
  CCW.render = render;
  CCW.go = go;
  CCW.resetForm = resetForm;
  CCW.sheet = sheet;
})((window.CCW = window.CCW || {}));

/* ############################################################
   RESULTS
   The results screen: desktop compare table and the mobile one-card-at-a-time view.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from the CORE section */
  var reduceMQ = CCW.reduceMQ,
    state = CCW.state,
    CAT = CCW.CAT;
  function $() {
    return CCW.$.apply(this, arguments);
  }
  function each() {
    return CCW.each.apply(this, arguments);
  }
  function only() {
    return CCW.only.apply(this, arguments);
  }
  function swapIn() {
    return CCW.swapIn.apply(this, arguments);
  }
  /* from the WIZARD section */
  function isMobile() {
    return CCW.isMobile.apply(this, arguments);
  }
  function render() {
    return CCW.render.apply(this, arguments);
  }
  /* from the THANK YOU section */
  function submitChoice() {
    return CCW.submitChoice.apply(this, arguments);
  }

  /* ============================================================
     RESULTS - desktop compare table. Every card is in each column / row; the three matched ones are shown.
     ============================================================ */
  var desk = $('[data-view="results"][data-layout="desk"]');
  function colHL(i) {
    each(
      '[data-ci]',
      function (el) {
        el.classList.toggle('is-hl', el.getAttribute('data-ci') === String(i));
      },
      desk,
    );
  }
  /* the column picker lists your three matches first, then the range by group */
  function arrangeOptions(sel) {
    var mg = $('[data-matches]', sel);
    if (!sel._home)
      sel._home = [].map.call(sel.querySelectorAll('option'), function (o) {
        return [o, o.parentNode];
      });
    sel._home.forEach(function (p) {
      if (state.order.indexOf(p[0].value) < 0) p[1].appendChild(p[0]);
    });
    state.order.forEach(function (k) {
      mg.appendChild(sel.querySelector('option[value="' + k + '"]'));
    });
  }
  function setupDesk() {
    state.cols.forEach(function (k, ci) {
      var h = $('.chead[data-ci="' + ci + '"]', desk),
        sel = $('select', h);
      each(
        '[data-card]',
        function (el) {
          el.hidden = el.dataset.card !== k;
        },
        h,
      );
      arrangeOptions(sel);
      sel.value = k;
      var sb = $('.foot__cell[data-ci="' + ci + '"] [data-select]', desk);
      sb.dataset.select = k;
      sb.setAttribute('aria-label', 'Select ' + CAT[k].short);
    });
    each(
      '.crow__cell',
      function (c) {
        var ci = state.cols.indexOf(c.dataset.card);
        c.hidden = ci < 0;
        if (ci < 0) {
          c.removeAttribute('data-ci');
          c.style.order = '';
        } else {
          c.setAttribute('data-ci', ci);
          c.style.order = ci + 1;
        }
      },
      desk,
    );
    colHL(0);
    $('.res-scroll', desk).scrollTop = 0;
    desk.classList.remove('is-collapsed');
    fitPicks();
  }
  each('select[data-col]', function (sel) {
    sel.onchange = function () {
      var ci = +sel.dataset.col,
        j = state.cols.indexOf(sel.value);
      if (j > -1 && j !== ci)
        state.cols[j] = state.cols[ci]; /* a card already in another column swaps places */
      state.cols[ci] = sel.value;
      setupDesk();
    };
  });
  (function () {
    var pick = function (e) {
      var c = e.target.closest && e.target.closest('[data-ci]');
      if (c) colHL(c.getAttribute('data-ci'));
    };
    desk.onpointerover = pick;
    desk.onfocusin = pick;
    desk.onpointerleave = function () {
      colHL(0);
    };
    /* collapse the card header on scroll, with hysteresis */
    var rs = $('.res-scroll', desk);
    rs.addEventListener('scroll', function () {
      var t = rs.scrollTop;
      if (t > 44) desk.classList.add('is-collapsed');
      else if (t < 12) desk.classList.remove('is-collapsed');
    });
  })();
  each('[data-select]', function (el) {
    el.onclick = function () {
      submitChoice(el.dataset.select);
    };
  });
  /* shrink a select's font just enough that the selected (long) card name shows in full */
  function fitSelectText(sel) {
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    if (!opt) return;
    var cs = getComputedStyle(sel),
      avail = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (avail <= 0) return;
    var ctx = fitSelectText._c || (fitSelectText._c = document.createElement('canvas').getContext('2d'));
    var size = parseFloat(cs.fontSize) || 13,
      base = size;
    while (size > 11) {
      ctx.font = '700 ' + size + 'px ' + cs.fontFamily;
      if (ctx.measureText(opt.text).width <= avail) break;
      size -= 0.5;
    }
    sel.style.fontSize = (size < base ? size : base) + 'px';
  }
  function fitPicks() {
    each('.cpick .select', fitSelectText, desk);
  }

  /* ============================================================
     RESULTS - mobile + foldables: one card at a time.
     Swiping re-themes the hero and switches the stat, name, benefit bento and Select target together.
     ============================================================ */
  var mob = $('[data-view="results"][data-layout="mob"]'),
    mcards = $('#mcards'),
    mstore = $('.mstore', mob),
    mActive = 0,
    mTarget = -1;
  function themeVars(k) {
    var c = CAT[k],
      t = c.cols;
    return c.themeKind === 'custom'
      ? '--th1:' + t[0] + ';--th2:' + t[1] + ';--th3:' + t[2] + ';--thg:' + t[3]
      : '';
  }
  function mSlideCls(i) {
    return 'mslide' + (i === mActive ? ' is-active' : i < mActive ? ' is-before' : ' is-after');
  }
  function matchKey(k) {
    var i = state.order.indexOf(k);
    return i < 0 ? 'x' : String(i);
  }
  function resetActive() {
    mActive = 0;
  }
  function setupMobile() {
    if (mActive > state.cols.length - 1) mActive = 0;
    /* the three slides go into the carousel, the rest wait in the store */
    [].slice.call(mcards.children).forEach(function (s) {
      mstore.appendChild(s);
    });
    state.cols.forEach(function (k, i) {
      var s = $('.mslide[data-card="' + k + '"]', mstore);
      s.setAttribute('data-slide', i);
      mcards.appendChild(s);
    });
    mApply(mActive);
    mcards.scrollLeft = slideLeft(mActive);
    $('#mscroll').scrollTop = 0;
    $('#mmini').classList.remove('is-on');
  }
  function mApply(i) {
    mActive = i;
    var k = state.cols[i];
    mob.setAttribute('data-theme', CAT[k].themeKind);
    mob.setAttribute('style', themeVars(k));
    each('#mdots .mdot', function (d, idx) {
      d.classList.toggle('on', idx === i);
      if (idx === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    each(
      '.mslide',
      function (s, idx) {
        s.className = mSlideCls(idx);
      },
      mcards,
    );
    $('#mprev').hidden = i === 0;
    $('#mnext').hidden = i === state.cols.length - 1;
    ['#mmini', '#mstat', '#mname', '#cpkBtn', '#mbenH', '#mbenT', '#mbento'].forEach(function (sel) {
      only($(sel), 'data-card', k);
    });
    only($('.cpk__k', mob), 'data-ml', matchKey(k));
    $('[data-select-active]', mob).setAttribute('aria-label', 'Select ' + CAT[k].short);
  }
  function mSetActive(i) {
    if (i < 0) i = 0;
    if (i > state.cols.length - 1) i = state.cols.length - 1;
    if (i === mActive && $('.mslide.is-active[data-slide="' + i + '"]', mcards)) return;
    mApply(i);
    swapIn($('#mstat'), 'is-swap');
    swapIn($('#mbento'), 'is-swap');
  }
  /* swipe, arrows and dashes all drive one active card */
  function slides() {
    return mcards.querySelectorAll('.mslide');
  }
  function slideLeft(i) {
    var sl = slides()[i];
    return sl ? sl.offsetLeft - mcards.offsetLeft - (mcards.clientWidth - sl.offsetWidth) / 2 : 0;
  }
  function nearest() {
    var c = mcards.scrollLeft,
      best = 0,
      d = 1e9,
      s = slides();
    for (var i = 0; i < s.length; i++) {
      var x = Math.abs(slideLeft(i) - c);
      if (x < d) {
        d = x;
        best = i;
      }
    }
    return best;
  }
  function mGo(i) {
    mTarget = i;
    mcards.scrollTo({ left: slideLeft(i), behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    mSetActive(i);
  }
  mcards.onscroll = function () {
    if (state.screen !== 'results') return;
    var i = nearest();
    if (mTarget > -1) {
      if (i === mTarget) mTarget = -1;
      return;
    }
    if (i !== mActive) mSetActive(i);
  };
  each('#mdots .mdot', function (d) {
    d.onclick = function () {
      mGo(+d.dataset.dot);
    };
  });
  $('#mprev').onclick = function () {
    if (mActive > 0) mGo(mActive - 1);
  };
  $('#mnext').onclick = function () {
    if (mActive < state.cols.length - 1) mGo(mActive + 1);
  };
  $('[data-select-active]', mob).onclick = function () {
    submitChoice(state.cols[mActive]);
  };
  /* compact sticky header appears once the hero has scrolled away (phones; the wide layout keeps the hero in view) */
  (function () {
    var msc = $('#mscroll'),
      mh = $('#mhead'),
      mm = $('#mmini');
    msc.addEventListener(
      'scroll',
      function () {
        mm.classList.toggle('is-on', msc.scrollTop > mh.offsetHeight - 72);
      },
      { passive: true },
    );
  })();

  /* bottom sheet: your three matches first, then the whole Emirates NBD range by group, with search */
  var csEl = $('#cSheet'),
    csList = $('#csList'),
    csQ = $('#csQ'),
    csHome = [].slice.call(csList.children);
  function groupHeads() {
    each(
      '.csheet__g',
      function (h) {
        var n = h.nextElementSibling,
          show = false;
        while (n && !n.classList.contains('csheet__g')) {
          if (n.classList.contains('csheet__row') && !n.hidden) show = true;
          n = n.nextElementSibling;
        }
        h.hidden = !show;
      },
      csList,
    );
  }
  function openCardSheet() {
    var cur = state.cols[mActive],
      rows = {};
    each(
      '.csheet__row',
      function (r) {
        rows[r.dataset.pick] = r;
        r.hidden = false;
        r.classList.toggle('is-on', r.dataset.pick === cur);
      },
      csList,
    );
    var list = [$('[data-g="matches"]', csList)].concat(
      state.order.map(function (k) {
        return rows[k];
      }),
    );
    csHome.forEach(function (n) {
      if (n.dataset.g === 'matches' || n.id === 'csNone') return;
      if (n.dataset.pick && state.order.indexOf(n.dataset.pick) > -1) return;
      list.push(n);
    });
    list.push($('#csNone'));
    list.forEach(function (n) {
      csList.appendChild(n);
    });
    csQ.value = '';
    $('#csNone').hidden = true;
    groupHeads();
    csEl.hidden = false;
    document.body.style.overflow = 'hidden';
    var on = $('.csheet__row.is-on', csList);
    if (on) on.scrollIntoView({ block: 'center' });
    setTimeout(function () {
      $('[data-csclose]', csEl).focus();
    }, 60);
  }
  function closeCardSheet() {
    csEl.hidden = true;
    document.body.style.overflow = '';
    $('#cpkBtn').focus();
  }
  function pickCard(k) {
    closeCardSheet();
    var i = state.cols.indexOf(k);
    if (i > -1) {
      mGo(i);
      return;
    }
    state.cols[mActive] = k;
    setupMobile();
  }
  $('#cpkBtn').onclick = openCardSheet;
  csEl.onclick = function (e) {
    if (e.target === csEl || e.target.closest('[data-csclose]')) closeCardSheet();
    var r = e.target.closest('[data-pick]');
    if (r) pickCard(r.dataset.pick);
  };
  csQ.oninput = function () {
    var v = csQ.value.trim().toLowerCase(),
      any = false;
    each(
      '.csheet__row',
      function (r) {
        var on = !v || r.dataset.q.indexOf(v) > -1;
        r.hidden = !on;
        if (on) any = true;
      },
      csList,
    );
    groupHeads();
    $('#csNone').hidden = any;
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !csEl.hidden) closeCardSheet();
  });
  /* crossing the mobile / desktop breakpoint swaps the results layout */
  var _wasMobile = isMobile();
  window.addEventListener('resize', function () {
    var m = isMobile();
    if (m !== _wasMobile) {
      _wasMobile = m;
      if (state.screen === 'results') render();
    }
  });

  /* shared with the other files (window.CCW) */
  CCW.setupDesk = setupDesk;
  CCW.resetActive = resetActive;
  CCW.setupMobile = setupMobile;
})((window.CCW = window.CCW || {}));

/* ############################################################
   THANK YOU + SHARE
   The thank-you screen, the leave dialog, and the share image + share sheet.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from the CORE section */
  var reduceMQ = CCW.reduceMQ,
    state = CCW.state,
    CAT = CCW.CAT;
  function $() {
    return CCW.$.apply(this, arguments);
  }
  function each() {
    return CCW.each.apply(this, arguments);
  }
  function resetState() {
    return CCW.resetState.apply(this, arguments);
  }
  /* from the WIZARD section */
  function viewEl() {
    return CCW.viewEl.apply(this, arguments);
  }
  function go() {
    return CCW.go.apply(this, arguments);
  }
  function resetForm() {
    return CCW.resetForm.apply(this, arguments);
  }

  /* ============================================================
     THANK YOU
     ============================================================ */
  /* Select on Results: remember the card, then ask for contact details */
  function submitChoice(k) {
    state.chosen = k;
    go('contact');
  }
  /* Continue on the contact step (fields already valid): the application is complete */
  function submitContact() {
    state.ref = '' + Math.floor(1e11 + Math.random() * 9e11);
    go('thanks');
  }
  function setupThanks() {
    var v = viewEl('thanks'),
      n = $('[data-ref]', v);
    n.textContent = state.ref.replace(/(\d{3})(?=\d)/g, '$1 ');
    n.setAttribute('aria-label', state.ref);
    $('[data-copy]', v).dataset.copy = state.ref;
  }
  each('[data-copy]', function (el) {
    el.onclick = function () {
      try {
        navigator.clipboard.writeText(el.dataset.copy).then(function () {
          lgToast(el.dataset.copied);
        });
      } catch (e) {}
    };
  });
  each('[data-share]', function (el) {
    el.onclick = openShareSheet;
  });
  each('[data-restart]', function (el) {
    el.onclick = function () {
      resetState();
      resetForm();
      go('spend');
    };
  });
  /* thank-you moment: the success tick animation plays once, silently */
  var doneAnim = null;
  function playDone() {
    var el = $('#doneAnim');
    if (!el || !window.lottie || !CCW.successAnimation) return;
    if (doneAnim) {
      try {
        doneAnim.destroy();
      } catch (e) {}
      doneAnim = null;
    }
    var bd = $('#doneBadge');
    if (bd) bd.classList.add('is-lottie');
    doneAnim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: false,
      autoplay: !reduceMQ.matches,
      /* a fresh copy each time: lottie changes the data it is given (SUCCESS ANIMATION section) */
      animationData: JSON.parse(JSON.stringify(CCW.successAnimation)),
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    doneAnim.addEventListener('data_failed', function () {
      if (bd) bd.classList.remove('is-lottie');
    });
    if (reduceMQ.matches)
      doneAnim.addEventListener('DOMLoaded', function () {
        doneAnim.goToAndStop(doneAnim.totalFrames - 1, true);
      });
  }

  /* leave the finder */
  var confirmX = $('#confirmX'),
    closeBtn = $('#closeBtn');
  function closeX() {
    confirmX.hidden = true;
    closeBtn.focus();
  }
  closeBtn.onclick = function () {
    confirmX.hidden = false;
    $('#cxStay').focus();
  };
  $('#cxStay').onclick = closeX;
  $('#cxLeave').onclick = function () {
    confirmX.hidden = true;
    resetState();
    resetForm();
    go('spend');
  };
  confirmX.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeX();
  });

  /* ============================================================
     SHARE - a 1080x1350 image of the application drawn on a canvas, then the device's own share sheet
     ============================================================ */
  function lgToast(t) {
    var el = $('#shareToast');
    el.textContent = t;
    el.classList.add('is-on');
    clearTimeout(lgToast.t);
    lgToast.t = setTimeout(function () {
      el.classList.remove('is-on');
    }, 2200);
  }
  function shRound(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(x, y, w, h, r);
    } else {
      c.rect(x, y, w, h);
    }
  }
  function shLoad(src) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () {
        res(i);
      };
      i.onerror = rej;
      i.src = src;
    });
  }
  function shText(c, t, x, y, font, col, align, ls) {
    c.font = font;
    c.fillStyle = col;
    c.textAlign = align || 'left';
    c.letterSpacing = (ls || 0) + 'px';
    c.fillText(t, x, y);
    c.letterSpacing = '0px';
    c.textAlign = 'left';
  }
  function shCard(c, img, cx, cy, cw, deg, shadow) {
    var ch = cw / 1.585;
    c.save();
    c.translate(cx, cy);
    c.rotate((deg * Math.PI) / 180);
    c.shadowColor = shadow;
    c.shadowBlur = cw * 0.13;
    c.shadowOffsetY = cw * 0.06;
    shRound(c, -cw / 2, -ch / 2, cw, ch, cw * 0.04);
    c.fillStyle = tok('--c-black');
    c.fill();
    c.shadowColor = 'transparent';
    shRound(c, -cw / 2, -ch / 2, cw, ch, cw * 0.04);
    c.clip();
    c.drawImage(img, -cw / 2, -ch / 2, cw, ch);
    c.restore();
  }
  /* design values come from the design tokens at the top of css/ccwizardv3.css (section 5, SHARE IMAGE); texts and logo from data-share-* on #shSheet */
  function tok(name) {
    return getComputedStyle($('.ccw')).getPropertyValue(name).trim();   /* tokens live on the wizard wrapper */
  }
  function buildShareImage() {
    var k = state.chosen || state.order[0],
      W = 1080,
      H = 1350,
      ref = String(state.ref || ''),
      name = CAT[k].short,
      T = $('#shSheet').dataset;
    var F = tok('--font-sans'),
      inkRgb = tok('--share-ink-rgb'),
      ink = function (a) {
        return 'rgb(' + inkRgb + ' / ' + a + ')';
      };
    var fonts = ['400 30px ' + F, '500 30px ' + F, '600 30px ' + F].map(function (f) {
      return document.fonts.load(f);
    });
    return Promise.all(fonts.concat([shLoad(CAT[k].img), shLoad(T.shareLogo)])).then(
      function (r) {
        var img = r[r.length - 2],
          logo = r[r.length - 1],
          cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        var c = cv.getContext('2d');
        c.textBaseline = 'alphabetic';
        var lw = parseFloat(tok('--share-logo-w')),
          lh = (lw * 52) / 190;
        /* field in the chosen card's colours, kept deep so the card and white type stay clear of it */
        var t = CAT[k].cols,
          g2 = c.createLinearGradient(0, 0, 0, H);
        g2.addColorStop(0, t[1]);
        g2.addColorStop(0.55, t[2]);
        g2.addColorStop(1, tok('--share-base'));
        c.fillStyle = g2;
        c.fillRect(0, 0, W, H);
        var gl = c.createRadialGradient(W / 2, 560, 10, W / 2, 560, 640);
        gl.addColorStop(0, t[3]);
        gl.addColorStop(1, t[3].replace(/[\d.]+\)$/, '0)'));
        c.fillStyle = gl;
        c.fillRect(0, 0, W, H);
        c.drawImage(logo, (W - lw) / 2, 80, lw, lh);
        shCard(c, img, W / 2, 500, 720, 0, tok('--share-card-shadow'));
        /* type system: one scale (66 / 44 / 28 / 24 / 18), 8px vertical rhythm, centred axis */
        shText(c, T.shareHead, W / 2, 840, '500 44px ' + F, ink(1), 'center', -0.4);
        shText(c, name, W / 2, 888, '400 28px ' + F, ink(0.62), 'center', 0.2);
        /* reference number: groups drawn with a fixed gap so 3-digit chunks read cleanly; pill hugs the number */
        var groups = ref.match(/\d{1,3}/g) || [ref],
          nf = '500 66px ' + F,
          gap = 26;
        c.font = nf;
        c.letterSpacing = '3px';
        var ws = groups.map(function (g) {
            return c.measureText(g).width;
          }),
          nw =
            ws.reduce(function (a, b) {
              return a + b;
            }, 0) +
            gap * (groups.length - 1);
        c.letterSpacing = '0px';
        var pw = Math.max(620, nw + 144),
          ph = 176,
          bx = (W - pw) / 2,
          by = 952;
        shRound(c, bx, by, pw, ph, ph / 2);
        c.fillStyle = ink(0.07);
        c.fill();
        var rim = c.createLinearGradient(0, by, 0, by + ph);
        rim.addColorStop(0, ink(0.34));
        rim.addColorStop(1, ink(0.1));
        c.strokeStyle = rim;
        c.lineWidth = 2;
        c.stroke();
        shText(c, T.shareRefLabel, W / 2, by + 56, '600 18px ' + F, ink(0.55), 'center', 5);
        var nx = (W - nw) / 2;
        groups.forEach(function (g, i) {
          shText(c, g, nx, by + 132, nf, ink(1), 'left', 3);
          nx += ws[i] + gap;
        });
        shText(c, T.shareCall, W / 2 - 24, 1262, '400 24px ' + F, ink(0.58), 'right', 0.3);
        c.fillStyle = ink(0.35);
        c.beginPath();
        c.arc(W / 2, 1254, 3, 0, Math.PI * 2);
        c.fill();
        shText(c, T.shareWeb, W / 2 + 24, 1262, '400 24px ' + F, ink(0.58), 'left', 0.3);
        return cv;
      },
    );
  }
  var shBlob = null,
    shName = '';
  function openShareSheet() {
    var sh = $('#shSheet'),
      im = $('#shImg');
    sh.hidden = false;
    document.body.style.overflow = 'hidden';
    im.removeAttribute('src');
    /* the file is built BEFORE the tap, so the tap itself can open the system share sheet (iOS/Android drop the share if it waits on async work) */
    shBlob = null;
    shBusy(true);
    buildShareImage()
      .then(function (cv) {
        im.src = cv.toDataURL('image/png');
        shName = 'Emirates-NBD-application-' + String(state.ref || '') + '.png';
        cv.toBlob(function (b) {
          shBlob = b;
          shBusy(false);
        }, 'image/png');
      })
      .catch(function () {
        shBusy(false);
        lgToast($('#shSheet').dataset.shareFail);
      });
    setTimeout(function () {
      $('#shGo').focus();
    }, 60);
  }
  function closeShareSheet() {
    $('#shSheet').hidden = true;
    document.body.style.overflow = '';
  }
  /* while the image is built, each button shows its data-busy label instead of its own */
  function shBusy(on) {
    ['shGo', 'shSave'].forEach(function (id) {
      var b = $('#' + id);
      b.disabled = on;
      b.setAttribute('aria-busy', on ? 'true' : 'false');
      each(
        '[data-busy]',
        function (s) {
          s.hidden = !on;
        },
        b,
      );
      each(
        '[data-idle]',
        function (s) {
          s.hidden = on;
        },
        b,
      );
    });
  }
  function saveShareImage(msg) {
    if (!shBlob) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(shBlob);
    a.download = shName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    lgToast(typeof msg === 'string' ? msg : $('#shSheet').dataset.shareSaved);
  }
  /* Share = the device's own share sheet via the Web Share API (needs https or localhost).
     Order: image file -> text + link -> save the image. Cancelling the sheet does nothing. */
  $('#shGo').onclick = function () {
    if (!shBlob) return;
    var k = state.chosen || state.order[0],
      T = $('#shSheet').dataset,
      file = new File([shBlob], shName, { type: 'image/png' });
    var title = T.shareTitle,
      text = T.shareText.replace('{card}', CAT[k].short);
    var url = /^https:/.test(location.protocol) ? location.href.split('#')[0] : '';
    function noSheet() {
      saveShareImage(T.shareNoSheet);
    }
    function failed(e) {
      if (e && e.name === 'AbortError') return;
      saveShareImage(T.shareNoOpen);
    }
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: title, text: text }).catch(failed);
    } else if (navigator.share) {
      var d = url ? { title: title, text: text, url: url } : { title: title, text: text };
      navigator.share(d).catch(failed);
    } else noSheet();
  };
  $('#shSave').onclick = saveShareImage;
  each('[data-shclose]', function (b) {
    b.onclick = closeShareSheet;
  });
  $('#shSheet').addEventListener('click', function (e) {
    if (e.target === this) closeShareSheet();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#shSheet').hidden) closeShareSheet();
  });

  /* shared with the other files (window.CCW) */
  CCW.submitChoice = submitChoice;
  CCW.submitContact = submitContact;
  CCW.setupThanks = setupThanks;
  CCW.playDone = playDone;
})((window.CCW = window.CCW || {}));

/* ############################################################
   STAGE
   The left panel: card carousel, chosen card, guide line and tilt effect.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from the CORE section */
  var reduceMQ = CCW.reduceMQ,
    BASE = CCW.BASE,
    state = CCW.state,
    CAT = CCW.CAT;
  function $() {
    return CCW.$.apply(this, arguments);
  }
  function each() {
    return CCW.each.apply(this, arguments);
  }
  function only() {
    return CCW.only.apply(this, arguments);
  }
  function replay() {
    return CCW.replay.apply(this, arguments);
  }
  /* from the WIZARD section */
  var sheet = CCW.sheet;

  /* ============================================================
     LIVING CARD STAGE - coverflow on steps 1-4, the chosen card on Thank you, the guide line
     ============================================================ */
  var stackEl = $('#stack'),
    sceneEl = $('#scene'),
    matchEl = $('#match'),
    matchK = $('#matchK'),
    matchName = $('#matchName'),
    matchSub = $('#matchSub'),
    matchPicks = $('#matchPicks');
  var cardEls = {};
  each(
    '.ccard',
    function (c) {
      cardEls[c.dataset.card] = c;
    },
    stackEl,
  );
  var deckFront = 'voyager',
    swapT,
    lastM = '',
    ORIG = {},
    swapped = false;
  function onSteps() {
    var s = state.screen;
    return s === 'spend' || s === 'benefit' || s === 'about';
  }
  function faceImg(k) {
    return $('.ccard__face img', cardEls[k]);
  }
  function restoreDeck() {
    for (var k in cardEls) cardEls[k].classList.remove('no-trans');
    if (!swapped) return;
    for (var j in ORIG) faceImg(j).src = ORIG[j];
    swapped = false;
  }
  /* coverflow: every card of the range is in the markup; step through them */
  var flowEl = $('#flow'),
    fcards = [].slice.call(flowEl.children),
    flowCur = 0,
    flowPrev = {},
    dnameEl = $('#dname');
  /* a dropped request (busy local server, flaky Wi-Fi) retries instead of leaving a blank card */
  fcards.forEach(function (el) {
    var im = $('img', el),
      n = 0;
    im.onerror = function () {
      if (n++ < 3)
        setTimeout(function () {
          im.src = im.src.split('?')[0] + '?r=' + n;
        }, 700 * n);
    };
  });
  function flowLayout() {
    var N = fcards.length;
    fcards.forEach(function (el, i) {
      var d = (((i - flowCur) % N) + N) % N;
      if (d > N / 2) d -= N;
      var ad = Math.abs(d),
        pd = flowPrev[i];
      if (pd !== undefined && Math.abs(pd - d) > 1) el.classList.add('no-trans');
      else el.classList.remove('no-trans');
      var x = d * 0.5,
        y = ad * 0.05,
        z = d === 0 ? 0.18 : -ad * 0.5,
        ry = Math.max(-62, Math.min(62, -d * 30)),
        rz = d === 0 ? -3 : d * 1.5;
      el.style.transform =
        'translate3d(calc(var(--cw) * ' +
        x +
        '),calc(var(--cw) * ' +
        y +
        '),calc(var(--cw) * ' +
        z +
        ')) rotateY(' +
        ry +
        'deg) rotateZ(' +
        rz +
        'deg)';
      el.style.opacity = ad === 0 ? 1 : ad === 1 ? 0.92 : ad === 2 ? 0.55 : 0;
      el.style.filter = ad === 0 ? 'none' : 'brightness(' + (ad === 1 ? 0.62 : 0.45) + ')';
      flowPrev[i] = d;
    });
    void flowEl.offsetWidth;
    fcards.forEach(function (el) {
      if (el.classList.contains('no-trans')) el.classList.remove('no-trans');
    });
  }
  function flowName() {
    only(dnameEl, 'data-i', String(flowCur));
    replay(dnameEl, 'is-in');
  }
  function flowStep() {
    flowCur = (flowCur + 1) % fcards.length;
    flowLayout();
    setTimeout(flowName, 480);
    replay(fcards[flowCur], 'is-glint');
  }
  flowLayout();
  flowName();
  setInterval(function () {
    if (reduceMQ.matches || document.hidden || !onSteps()) return;
    flowStep();
  }, 2800);
  function deckReact() {
    if (reduceMQ.matches) return;
    replay(fcards[flowCur], 'is-glint');
    BASE.forEach(function (k) {
      replay(cardEls[k], 'is-sweep');
    });
  }
  function glintOn(k) {
    each(
      '.is-glint',
      function (c) {
        c.classList.remove('is-glint');
      },
      stackEl,
    );
    if (reduceMQ.matches) return;
    void cardEls[k].offsetWidth;
    cardEls[k].classList.add('is-glint');
  }
  function setDeck(order, solo, glint) {
    var front = order[0],
      prev = deckFront;
    stackEl.classList.toggle('is-solo', !!solo);
    clearTimeout(swapT);
    function place(skip) {
      order.forEach(function (k, i) {
        if (k !== skip) cardEls[k].dataset.pos = String(i);
      });
    }
    if (front !== prev && !solo && !reduceMQ.matches) {
      /* pull the new leader out to the side, then slot it in front */
      cardEls[front].dataset.pos = 'out';
      place(front);
      swapT = setTimeout(function () {
        cardEls[front].dataset.pos = '0';
      }, 380);
      glintOn(front);
    } else place();
    if (glint) glintOn(front);
    deckFront = front;
  }
  function tintStage(k) {
    var el = $('#htint');
    if (!k) {
      sheet.classList.remove('is-tinted');
      return;
    }
    var t = CAT[k].cols;
    el.style.cssText = '--th1:' + t[0] + ';--th2:' + t[1] + ';--th3:' + t[2] + ';--thg:' + t[3];
    sheet.classList.add('is-tinted');
  }
  /* the guide line: every text is in #match; pick the one for this screen and echo the picks as pills */
  function setMatch(kKey, nameKey, subKey) {
    only(matchK, 'data-m', kKey);
    only(matchName, 'data-m', nameKey);
    only(matchSub, 'data-m', subKey);
    if (nameKey !== lastM) {
      replay(matchEl, 'is-swap');
      lastM = nameKey;
    }
  }
  function syncPills(on) {
    each(
      'li',
      function (li) {
        li.hidden = true;
      },
      matchPicks,
    );
    if (!on) return;
    var ids = state.spend.map(function (id) {
      return 'spend:' + id;
    });
    if (state.benefit) ids.push('benefit:' + state.benefit);
    state.three.forEach(function (id) {
      ids.push('benefit:' + id);
    });
    ids.forEach(function (p) {
      var li = $('[data-pill="' + p + '"]', matchPicks);
      matchPicks.appendChild(li);
      li.hidden = false;
    });
  }
  function stageSync() {
    var s = state.screen;
    if (s === 'results') {
      tintStage(null);
      return;
    }
    /* Steps 1-3: no card name, only the step's guide line and the customer's picks */
    if (onSteps()) {
      if (deckFront !== BASE[0]) setDeck(BASE, false);
      tintStage(null);
      matchEl.hidden = false;
      matchEl.classList.add('is-guide');
      setMatch('guide', s, s);
      syncPills(true);
    } else {
      matchEl.hidden = false;
      matchEl.classList.remove('is-guide');
      restoreDeck();
      var k = state.chosen || state.order[0],
        slot = k;
      /* a card picked from the full range has no slot of its own: load its art into the front slot (restoreDeck puts it back) */
      if (!cardEls[k]) {
        slot = BASE[0];
        var im = faceImg(slot);
        if (!(slot in ORIG)) ORIG[slot] = im.getAttribute('src');
        im.src = CAT[k].img;
        swapped = true;
      }
      setDeck(
        [slot].concat(
          BASE.filter(function (x) {
            return x !== slot;
          }),
        ),
        true,
        s === 'thanks',
      );
      tintStage(k);
      setMatch('chosen', 'card:' + k, s === 'thanks' ? 'chosen' : 'apply');
      syncPills(false);
    }
  }

  /* pointer-driven tilt + moving key light (desktop pointers only; transform only, rAF eased) */
  (function () {
    var hero = $('#brand'),
      bloom = $('#bloom');
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = 0;
    function frame() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      var u = getComputedStyle(stackEl).getPropertyValue('--u').trim();
      stackEl.style.transform =
        'translate3d(calc(' +
        u +
        ' * -.4),calc(' +
        u +
        ' * .2),0) rotateX(' +
        (10 - cy * 6).toFixed(2) +
        'deg) rotateY(' +
        (16 + cx * 8).toFixed(2) +
        'deg)';
      stackEl.style.setProperty('--lx', (8 - cx * 22).toFixed(1) + '%');
      stackEl.style.setProperty('--ly', (-10 - cy * 18).toFixed(1) + '%');
      bloom.style.transform = 'translate3d(' + (cx * 36).toFixed(1) + 'px,' + (cy * 24).toFixed(1) + 'px,0)';
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(frame);
      else raf = 0;
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', function (e) {
      if (reduceMQ.matches || !fine.matches) return;
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    });
    hero.addEventListener('pointerleave', function () {
      tx = 0;
      ty = 0;
      kick();
    });
    /* reveal the deck once the card art is decoded, so it never shows empty frames */
    Promise.all(
      [].map.call(stackEl.querySelectorAll('img'), function (im) {
        return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
      }),
    ).then(function () {
      sceneEl.classList.add('is-ready');
    });
    setTimeout(function () {
      sceneEl.classList.add('is-ready');
    }, 1500);
  })();

  /* shared with the other files (window.CCW) */
  CCW.deckReact = deckReact;
  CCW.stageSync = stageSync;
})((window.CCW = window.CCW || {}));

/* ############################################################
   SUCCESS ANIMATION
   ############################################################ */
/* Success tick animation (Lottie). Same data as an exported Lottie .json, wrapped as a script so the page
   also works opened from disk (browsers block loading .json files on file://).
   To change it: export a new Lottie JSON and paste it in place of the object below. */
(window.CCW = window.CCW || {}).successAnimation = {"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.20","a":"","k":"","d":"","tc":"#FFFFFF"},"fr":60,"ip":0,"op":180,"w":1920,"h":1920,"nm":"ENBD success tick (from LottieFiles free animation by SANIMAN, recoloured)","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Tick","parent":4,"sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":4,"s":[100]},{"t":32,"s":[100]}],"ix":11},"r":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30,"s":[-99]},{"t":60,"s":[0]}],"ix":10},"p":{"a":0,"k":[346.916,346.917,0],"ix":2},"a":{"a":0,"k":[278.033,227.218,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.333,0.333,0.333],"y":[0,0,0]},"t":30,"s":[20,20,100]},{"t":60,"s":[100,100,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0]],"v":[[-153.033,0.588],[-51.404,102.218],[153.032,-102.218]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[1,1,1,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":50,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[278.033,227.218],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":0,"k":0,"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.33],"y":[1]},"o":{"x":[0.67],"y":[0]},"t":31,"s":[0]},{"t":60,"s":[100]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Glow Mask","td":1,"sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":4,"s":[100]},{"t":32,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.783,"y":0.496},"o":{"x":0.506,"y":0},"t":0,"s":[1099.01,1187.835,0],"to":[-51.058,-20.951,0],"ti":[23.519,29.424,0]},{"i":{"x":0.576,"y":1},"o":{"x":0.337,"y":0.495},"t":30,"s":[989.155,1114.015,0],"to":[-26.997,-33.775,0],"ti":[3.563,56.649,0]},{"t":50,"s":[947.01,981.835,0]}],"ix":2},"a":{"a":0,"k":[346.917,346.917,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.333,0.333,0.333],"y":[0,0,0]},"t":30,"s":[20,20,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.333,0.333,0.333],"y":[0,0,0]},"t":60,"s":[110,110,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":80,"s":[95,95,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":92,"s":[102,102,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":100,"s":[98,98,100]},{"t":110,"s":[100,100,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,-191.459],[191.459,0],[0,191.458],[-191.458,0]],"o":[[0,191.458],[-191.458,0],[0,-191.459],[191.459,0]],"v":[[346.667,0],[0,346.667],[-346.667,0],[0,-346.666]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.118000000598,0.442999985639,0.929000016755,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[346.916,346.917],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":4,"nm":"Glow","tt":1,"sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.643]},"o":{"x":[0.72],"y":[0]},"t":110,"s":[100]},{"t":140,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.833,"y":0.788},"o":{"x":0.72,"y":0},"t":94,"s":[56,440,0],"to":[226.667,131.333,0],"ti":[-226.667,-131.333,0]},{"t":140,"s":[1416,1228,0]}],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[348.655,1.947],[0,0],[35.647,880.072]],"o":[[0,0],[-8.868,-0.049],[0,0],[-3.819,-94.283]],"v":[[211.999,-440],[-480,280],[-136,648],[483.999,-312]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.788235294117647,0.8274509803921568,0.9372549019607843,1],"ix":4},"o":{"a":0,"k":30,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Shape 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":4,"ty":4,"nm":"Background Circle (Blue)","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":4,"s":[100]},{"t":32,"s":[100]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.783,"y":0.496},"o":{"x":0.506,"y":0},"t":0,"s":[1099.01,1187.835,0],"to":[-51.058,-20.951,0],"ti":[23.519,29.424,0]},{"i":{"x":0.576,"y":1},"o":{"x":0.337,"y":0.495},"t":30,"s":[989.155,1114.015,0],"to":[-26.997,-33.775,0],"ti":[3.563,56.649,0]},{"t":50,"s":[947.01,981.835,0]}],"ix":2},"a":{"a":0,"k":[346.917,346.917,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667,0.667],"y":[1,1,1]},"o":{"x":[0.333,0.333,0.333],"y":[0,0,0]},"t":30,"s":[20,20,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.333,0.333,0.333],"y":[0,0,0]},"t":60,"s":[110,110,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":80,"s":[95,95,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":92,"s":[102,102,100]},{"i":{"x":[0.833,0.833,0.833],"y":[1,1,1]},"o":{"x":[0.167,0.167,0.167],"y":[0,0,0]},"t":100,"s":[98,98,100]},{"t":110,"s":[100,100,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,-191.459],[191.459,0],[0,191.458],[-191.458,0]],"o":[[0,191.458],[-191.458,0],[0,-191.459],[191.459,0]],"v":[[346.667,0],[0,346.667],[-346.667,0],[0,-346.666]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.12156862745098039,0.3333333333333333,0.8117647058823529,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[346.916,346.917],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":5,"ty":4,"nm":"Background(Blue)","parent":4,"sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":4,"s":[20]},{"t":32,"s":[20]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":30,"s":[346.917,346.917,0],"to":[0,0,0],"ti":[0,0,0]},{"t":49,"s":[346.917,346.917,0]}],"ix":2},"a":{"a":0,"k":[346.917,346.917,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.33,0.33,0.33],"y":[1,1,1]},"o":{"x":[0.67,0.67,0.67],"y":[0,0,0]},"t":0,"s":[100,100,100]},{"i":{"x":[0.33,0.33,0.33],"y":[1,1,1]},"o":{"x":[0.67,0.67,0.67],"y":[0,0,0]},"t":60,"s":[148,148,100]},{"t":110,"s":[88,88,100]}],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,-191.459],[191.459,0],[0,191.458],[-191.458,0]],"o":[[0,191.458],[-191.458,0],[0,-191.459],[191.459,0]],"v":[[346.667,0],[0,346.667],[-346.667,0],[0,-346.666]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.12156862745098039,0.3333333333333333,0.8117647058823529,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[346.916,346.917],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":6,"ty":4,"nm":"Element 11","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.174,"y":0},"t":10,"s":[1088.545,1185.048,0],"to":[-154.333,61,0],"ti":[34.333,-69,0]},{"t":42,"s":[774.545,1455.048,0]}],"ix":2},"a":{"a":0,"k":[88.379,84.132,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[-17.539,13.457],[-12.743,-16.607],[0,0]],"o":[[-12.743,-16.608],[17.539,-13.458],[0,0],[0,0]],"v":[[-25.635,34.132],[-16.894,-20.673],[38.306,-14.931],[38.379,-14.837]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0.6039215686274509,0.7215686274509804,0.9490196078431372,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":20,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[88.378,84.131],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":7,"ty":4,"nm":"Element 10","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.229,"y":0},"t":10,"s":[1088.113,1187.051,0],"to":[37.667,40,0],"ti":[-71.667,-48,0]},{"t":46,"s":[1314.113,1427.051,0]}],"ix":2},"a":{"a":0,"k":[33.514,41.664,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[3.281,-1.895],[0,0],[1.894,3.281],[0,0],[-3.281,1.894],[0,0],[-1.894,-3.282],[0,0]],"o":[[0,0],[-3.281,1.894],[0,0],[-1.894,-3.283],[0,0],[3.281,-1.895],[0,0],[1.894,3.281]],"v":[[28.859,29.055],[10.732,39.52],[1.361,37.009],[-31.37,-19.681],[-28.859,-29.053],[-10.732,-39.519],[-1.361,-37.008],[31.37,19.683]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.15294117647058825,0.396078431372549,1.0,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[33.514,41.664],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":8,"ty":4,"nm":"Element 9","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.189,"y":0},"t":10,"s":[1106.768,1189.936,0],"to":[70.333,-5.667,0],"ti":[-62.333,-30.333,0]},{"t":43,"s":[1420.768,1239.936,0]}],"ix":2},"a":{"a":0,"k":[60.548,78.82,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[2.886,-21.917],[20.753,2.734],[0.039,0.005]],"o":[[20.754,2.733],[-2.886,21.918],[-0.04,-0.005],[0,0]],"v":[[-12.409,-41.32],[20.162,3.615],[-22.93,38.586],[-23.048,38.571]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0.043137254901960784,0.16862745098039217,0.3686274509803922,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":15,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[60.548,78.82],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":9,"ty":4,"nm":"Element 8","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.263,"y":0},"t":10,"s":[1095.413,1171.271,0],"to":[46.333,-81.667,0],"ti":[-98.333,51.667,0]},{"t":68,"s":[1397.413,873.271,0]}],"ix":2},"a":{"a":0,"k":[47.326,47.325,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-11.644,-3.948],[0,0],[-3.912,2.92],[0,0],[0.157,-12.294],[0,0],[-3.985,-2.819],[0,0],[11.74,-3.65],[0,0],[1.449,-4.662],[0,0],[7.098,10.038],[0,0],[4.882,-0.063],[0,0],[-7.354,9.853],[0,0],[1.569,4.624],[0,0]],"o":[[0,0],[4.623,1.568],[0,0],[9.854,-7.353],[0,0],[-0.062,4.882],[0,0],[10.038,7.099],[0,0],[-4.662,1.449],[0,0],[-3.649,11.74],[0,0],[-2.82,-3.986],[0,0],[-12.293,0.156],[0,0],[2.92,-3.913],[0,0],[-3.948,-11.644]],"v":[[-17.558,-36.37],[-13.481,-34.987],[0.154,-37.147],[3.606,-39.722],[27.31,-27.644],[27.255,-23.339],[33.522,-11.038],[37.038,-8.552],[32.877,17.724],[28.763,19.002],[19.003,28.764],[17.724,32.876],[-8.551,37.037],[-11.037,33.522],[-23.338,27.255],[-27.644,27.31],[-39.721,3.606],[-37.146,0.155],[-34.987,-13.481],[-36.37,-17.558]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.6039215686274509,0.7215686274509804,0.9490196078431372,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[47.325,47.325],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":10,"ty":4,"nm":"Element 7","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.229,"y":0},"t":10,"s":[1086.148,1173.839,0],"to":[18.333,-110,0],"ti":[-64.333,76,0]},{"t":46,"s":[1316.148,645.839,0]}],"ix":2},"a":{"a":0,"k":[77.856,74.774,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[-12.731,9.768],[-9.249,-12.055],[-0.018,-0.022]],"o":[[-9.249,-12.055],[12.73,-9.768],[0.018,0.023],[0,0]],"v":[[-18.607,24.774],[-12.262,-15.006],[27.805,-10.838],[27.857,-10.77]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0.15294117647058825,0.396078431372549,1.0,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":20,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[77.856,74.774],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":11,"ty":4,"nm":"Element 6","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.189,"y":0},"t":10,"s":[1081.471,1169.811,0],"to":[-138,24.333,0],"ti":[110,-64.333,0]},{"t":43,"s":[529.471,1363.811,0]}],"ix":2},"a":{"a":0,"k":[47.326,47.325,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-11.644,-3.948],[0,0],[-3.913,2.92],[0,0],[0.157,-12.294],[0,0],[-3.986,-2.819],[0,0],[11.74,-3.65],[0,0],[1.449,-4.662],[0,0],[7.099,10.038],[0,0],[4.881,-0.062],[0,0],[-7.353,9.853],[0,0],[1.568,4.624],[0,0]],"o":[[0,0],[4.623,1.567],[0,0],[9.853,-7.352],[0,0],[-0.063,4.882],[0,0],[10.038,7.1],[0,0],[-4.662,1.449],[0,0],[-3.649,11.741],[0,0],[-2.819,-3.987],[0,0],[-12.293,0.157],[0,0],[2.92,-3.913],[0,0],[-3.948,-11.644]],"v":[[-17.558,-36.37],[-13.481,-34.987],[0.154,-37.147],[3.605,-39.723],[27.31,-27.644],[27.255,-23.339],[33.521,-11.038],[37.037,-8.553],[32.875,17.724],[28.763,19.002],[19.003,28.764],[17.724,32.875],[-8.552,37.037],[-11.039,33.522],[-23.339,27.254],[-27.645,27.31],[-39.722,3.606],[-37.146,0.154],[-34.987,-13.481],[-36.37,-17.558]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.15294117647058825,0.396078431372549,1.0,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[47.325,47.325],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":12,"ty":4,"nm":"Element 5","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.283,"y":0},"t":10,"s":[1071.297,1171.159,0],"to":[-118.333,-25,0],"ti":[132.333,-35,0]},{"t":70,"s":[517.297,1177.159,0]}],"ix":2},"a":{"a":0,"k":[30.771,30.771,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,-16.856],[16.856,0],[0,16.856],[-16.857,0]],"o":[[0,16.856],[-16.857,0],[0,-16.856],[16.856,0]],"v":[[30.521,0],[0,30.521],[-30.521,0],[0,-30.521]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.3568627450980392,0.5529411764705883,0.9372549019607843,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[30.771,30.771],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":13,"ty":4,"nm":"Element 4","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.273,"y":0},"t":10,"s":[1074.624,1178.727,0],"to":[-94.667,-86.667,0],"ti":[140.667,20.667,0]},{"t":69,"s":[446.624,934.727,0]}],"ix":2},"a":{"a":0,"k":[42,25.144,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-0.829,-3.697],[0,0],[3.698,-0.828],[0,0],[0.83,3.697],[0,0],[-3.697,0.828],[0,0]],"o":[[0,0],[0.829,3.697],[0,0],[-3.697,0.828],[0,0],[-0.828,-3.697],[0,0],[3.697,-0.828]],"v":[[36.343,-18.872],[40.921,1.552],[35.727,9.747],[-28.148,24.066],[-36.344,18.872],[-40.922,-1.553],[-35.728,-9.747],[28.148,-24.066]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.15294117647058825,0.396078431372549,1.0,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[42,25.144],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":14,"ty":4,"nm":"Element 3","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.174,"y":0},"t":10,"s":[1067.471,1180.071,0],"to":[-115.667,-176,0],"ti":[149.667,68,0]},{"t":61,"s":[529.471,736.071,0]}],"ix":2},"a":{"a":0,"k":[47.326,47.325,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-11.644,-3.948],[0,0],[-3.913,2.92],[0,0],[0.157,-12.294],[0,0],[-3.986,-2.819],[0,0],[11.74,-3.65],[0,0],[1.449,-4.662],[0,0],[7.099,10.038],[0,0],[4.881,-0.063],[0,0],[-7.353,9.854],[0,0],[1.568,4.624],[0,0]],"o":[[0,0],[4.623,1.568],[0,0],[9.853,-7.353],[0,0],[-0.063,4.882],[0,0],[10.038,7.099],[0,0],[-4.662,1.449],[0,0],[-3.649,11.74],[0,0],[-2.819,-3.986],[0,0],[-12.293,0.157],[0,0],[2.92,-3.912],[0,0],[-3.948,-11.644]],"v":[[-17.558,-36.37],[-13.481,-34.987],[0.154,-37.147],[3.605,-39.722],[27.31,-27.644],[27.255,-23.339],[33.521,-11.038],[37.037,-8.552],[32.875,17.724],[28.763,19.002],[19.003,28.764],[17.724,32.876],[-8.552,37.037],[-11.039,33.522],[-23.339,27.255],[-27.645,27.309],[-39.722,3.605],[-37.146,0.154],[-34.987,-13.481],[-36.37,-17.558]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.08627450980392157,0.40784313725490196,0.8901960784313725,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[47.325,47.325],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":15,"ty":4,"nm":"Element 2","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[1]},"o":{"x":[0.167],"y":[0]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.601]},"o":{"x":[0.72],"y":[0]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.292,"y":0},"t":10,"s":[1098.638,1189.457,0],"to":[-95.667,-127,0],"ti":[3.667,95,0]},{"t":71,"s":[788.638,547.457,0]}],"ix":2},"a":{"a":0,"k":[33.515,41.664,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[3.281,-1.895],[0,0],[1.895,3.281],[0,0],[-3.281,1.894],[0,0],[-1.895,-3.281],[0,0]],"o":[[0,0],[-3.282,1.895],[0,0],[-1.895,-3.281],[0,0],[3.281,-1.894],[0,0],[1.895,3.282]],"v":[[28.859,29.054],[10.733,39.519],[1.36,37.008],[-31.37,-19.683],[-28.859,-29.054],[-10.732,-39.52],[-1.36,-37.009],[31.37,19.682]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.6039215686274509,0.7215686274509804,0.9490196078431372,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[33.515,41.664],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0},{"ddd":0,"ind":16,"ty":4,"nm":"Element 1","sr":1,"ks":{"o":{"a":1,"k":[{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":0,"s":[0]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":4,"s":[100]},{"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]},"t":32,"s":[100]},{"t":87,"s":[0]}],"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":1,"k":[{"i":{"x":0.33,"y":1},"o":{"x":0.252,"y":0},"t":10,"s":[1087.199,1174.507,0],"to":[22,-151.667,0],"ti":[40,75.667,0]},{"t":67,"s":[1027.199,504.507,0]}],"ix":2},"a":{"a":0,"k":[30.771,30.771,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,-16.856],[16.856,0],[0,16.857],[-16.857,0]],"o":[[0,16.857],[-16.857,0],[0,-16.856],[16.856,0]],"v":[[30.522,-0.001],[0,30.522],[-30.522,-0.001],[0,-30.522]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"fl","c":{"a":0,"k":[0.6039215686274509,0.7215686274509804,0.9490196078431372,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[30.771,30.772],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":1800,"st":0,"bm":0}],"markers":[]};

/* ############################################################
   START
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from the WIZARD section */
  function render() {
    return CCW.render.apply(this, arguments);
  }

  render();
})((window.CCW = window.CCW || {}));
