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
    showErr: false,
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
    state.showErr = false;
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
