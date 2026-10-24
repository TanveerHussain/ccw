/* ############################################################
   WIZARD
   Navigation and the question steps: screens / go(), steps 1-3 (tiles), step 4 (form).
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from core.js */
  var reduceMQ = CCW.reduceMQ,
    RESULTS = CCW.RESULTS,
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
  /* from results.js */
  function setupDesk() {
    return CCW.setupDesk.apply(this, arguments);
  }
  function resetActive() {
    return CCW.resetActive.apply(this, arguments);
  }
  function setupMobile() {
    return CCW.setupMobile.apply(this, arguments);
  }
  /* from thanks.js */
  function setupThanks() {
    return CCW.setupThanks.apply(this, arguments);
  }
  function playDone() {
    return CCW.playDone.apply(this, arguments);
  }
  /* from stage.js */
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
  var BACK = { benefit: 'spend', three: 'benefit', about: 'three' };
  var SEG = { spend: 1, benefit: 2, three: 3, about: 4, results: 5, thanks: 6 };
  function isMobile() {
    /* same breakpoints as the phone / short-screen layouts in main.css, so steps and results always use the same layout */
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
    if (s === 'about') syncErrors();
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
    if (bk) {
      state.showErr = false;
      go(bk);
    }
  };
  each('[data-next]', function (el) {
    el.onclick = function () {
      if (!el.disabled) go(el.dataset.next);
    };
  });
  each('[data-back]', function (el) {
    el.onclick = function () {
      state.showErr = false;
      go(el.dataset.back);
    };
  });

  /* ============================================================
     STEPS 1-3 - tiles
     ============================================================ */
  var PICK = { spend: 3, benefit: 1, three: 3 };
  function picked(s) {
    return s === 'benefit' ? (state.benefit ? [state.benefit] : []) : state[s];
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
          dim =
            max > 1 &&
            cur.length >= max &&
            !on; /* single-choice steps never lock: tapping another option switches */
        el.classList.toggle('is-on', on);
        el.classList.toggle('dim', dim);
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (dim) el.setAttribute('aria-disabled', 'true');
        else el.removeAttribute('aria-disabled');
        el.setAttribute(
          'aria-label',
          $('.tile__lbl', el).textContent + (on && max > 1 ? ', pick ' + (r + 1) + ' of 3' : ''),
        );
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
    $('[data-next]', v).disabled = cur.length !== max;
  }
  function nudge() {
    replay($('.count', viewEl(state.screen)), 'is-nudge');
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
  ['spend', 'three'].forEach(function (s) {
    each('[data-' + s + ']', function (el) {
      el.onclick = function () {
        if (el.classList.contains('dim')) {
          nudge();
          return;
        }
        var id = el.getAttribute('data-' + s),
          a = state[s],
          i = a.indexOf(id);
        if (i > -1) a.splice(i, 1);
        else if (a.length < 3) a.push(id);
        afterPick(el, id);
      };
    });
  });
  each('[data-benefit]', function (el) {
    el.onclick = function () {
      var id = el.dataset.benefit;
      state.benefit = state.benefit === id ? null : id;
      afterPick(el, id);
    };
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
    var s = state.screen;
    if (s === 'benefit') return state.benefit ? 'pick:' + state.benefit : 'default';
    if (state[s].length === 3) return 'done';
    if (lastPick && state[s].indexOf(lastPick) > -1) return 'pick:' + lastPick;
    return 'default';
  }
  function syncWhy(quiet) {
    var box = $('.ssub', viewEl(state.screen)),
      k = whyKey();
    if (!box) return;
    if (k === 'done' && state.screen === 'spend') orderWords($('[data-why="done"] .wls', box), state.spend);
    if (box.getAttribute('data-on') === k) return;
    box.setAttribute('data-on', k);
    only(box, 'data-why', k);
    if (!quiet) replay(box, 'is-new');
  }

  /* ============================================================
     STEP 4 - about you + contact
     ============================================================ */
  each('[data-set]', function (el) {
    /* Enter in any field = Continue */
    el.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('[data-validate]').click();
      }
    };
    el.oninput = el.onchange = function () {
      var val = el.value;
      if (el.dataset.set === 'mobile' || el.dataset.set === 'income') {
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
  function validMobile() {
    return /^[0-9]{7,}$/.test(state.mobile.replace(/\s/g, ''));
  }
  function validEmail() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
  }
  function mobileErr() {
    if (!state.mobile.trim()) return 'required';
    return validMobile() ? '' : 'invalid';
  }
  function emailErr() {
    if (!state.email.trim()) return 'required';
    return validEmail() ? '' : 'invalid';
  }
  function aboutOk() {
    return state.emirate && state.income && validMobile() && validEmail();
  }
  function setErr(id, kind, ctl) {
    var p = $('#err-' + id);
    p.closest('.field').classList.toggle('field--bad', !!kind);
    p.hidden = !kind;
    only(p, 'data-err', kind);
    if (kind) {
      ctl.setAttribute('aria-invalid', 'true');
      ctl.setAttribute('aria-describedby', 'err-' + id);
    } else {
      ctl.removeAttribute('aria-invalid');
      ctl.removeAttribute('aria-describedby');
    }
  }
  function syncErrors() {
    var bad = state.showErr;
    setErr('emirate', bad && !state.emirate ? 'required' : '', $('#cb-emirate'));
    setErr('income', bad && !state.income ? 'required' : '', $('#f-income'));
    setErr('mobile', bad ? mobileErr() : '', $('#f-mobile'));
    setErr('email', bad ? emailErr() : '', $('#f-email'));
  }
  /* after a failed submit, bring the first error into view (the page scrolls on mobile) */
  function focusErr() {
    var f = $('[aria-invalid="true"]', viewEl('about'));
    if (f) {
      f.focus({ preventScroll: true });
      f.scrollIntoView({ block: 'center', behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    }
  }
  each('[data-validate]', function (el) {
    el.onclick = function () {
      /* results always show the three cards listed in data-results (index.html); the first is Recommended */
      if (aboutOk()) {
        state.showErr = false;
        state.order = RESULTS.slice();
        state.cols = RESULTS.slice();
        go('results');
      } else {
        state.showErr = true;
        syncErrors();
        focusErr();
      }
    };
  });

  /* custom dropdowns (nationality, emirate) - options are in the markup; the control shows the chosen option's text */
  /* empty every field and dropdown (after Done or Leave) */
  function resetForm() {
    each('[data-set]', function (el) {
      el.value = '';
    });
    each('[data-combo]', syncCombo);
  }
  function syncCombo(box) {
    var f = box.dataset.combo,
      val = state[f],
      ctrl = $('.combo__ctrl', box);
    each(
      '.combo__opt',
      function (o) {
        var on = o.dataset.opt === val;
        o.classList.toggle('is-chosen', on);
        o.setAttribute('aria-selected', on ? 'true' : 'false');
      },
      box,
    );
    var c = $('.combo__opt.is-chosen', box);
    $('.combo__val', ctrl).textContent = c ? c.textContent : $('.combo__ttl', box).textContent;
    ctrl.classList.toggle('is-empty', !val);
  }
  function filterOpts(box, q) {
    q = q.toLowerCase();
    var any = false;
    each(
      '.combo__opt',
      function (o) {
        var m = o.textContent.toLowerCase().indexOf(q) > -1;
        o.style.display = m ? '' : 'none';
        if (m) any = true;
      },
      box,
    );
    var e = $('.combo__empty', box);
    if (e) e.hidden = any;
  }
  each('[data-combo]', function (box) {
    var field = box.dataset.combo,
      ctrl = $('.combo__ctrl', box),
      search = $('.combo__search', box),
      kb = search || $('.combo__list', box);
    function vis() {
      return [].filter.call(box.querySelectorAll('.combo__opt'), function (o) {
        return o.style.display !== 'none';
      });
    }
    function clearHi() {
      each(
        '.combo__opt.is-active',
        function (o) {
          o.classList.remove('is-active');
        },
        box,
      );
    }
    function setHi(o) {
      clearHi();
      if (o) {
        o.classList.add('is-active');
        kb.setAttribute('aria-activedescendant', o.id);
        o.scrollIntoView({ block: 'nearest' });
      } else kb.removeAttribute('aria-activedescendant');
    }
    function hi() {
      return $('.combo__opt.is-active', box);
    }
    function openC() {
      sheetOn();
      box.classList.add('is-open');
      ctrl.setAttribute('aria-expanded', 'true');
      if (search) {
        search.value = '';
        filterOpts(box, '');
      }
      setHi($('.combo__opt.is-chosen', box) || vis()[0]);
      kb.focus({ preventScroll: true });
      var pop = $('.combo__pop', box);
      if (pop) pop.scrollIntoView({ block: 'nearest' });
    }
    function closeC(focus) {
      sheetOff();
      box.classList.remove('is-open');
      ctrl.setAttribute('aria-expanded', 'false');
      kb.removeAttribute('aria-activedescendant');
      clearHi();
      if (focus) ctrl.focus();
    }
    function choose(o) {
      if (!o) return;
      state[field] = o.dataset.opt;
      syncCombo(box);
      closeC(true);
      syncErrors();
      stageSync();
    }
    /* phones: the list opens as a full-screen picker sized to the visible viewport, so the keyboard never covers it */
    var pop = $('.combo__pop', box),
      vv = window.visualViewport;
    function phone() {
      return matchMedia('(max-width:699.98px),(pointer:coarse) and (max-width:900px)').matches;
    }
    function fit() {
      if (!pop) return;
      var h = vv ? vv.height : innerHeight,
        t = vv ? vv.offsetTop : 0;
      pop.style.setProperty('--vvh', h + 'px');
      pop.style.setProperty('--vvt', t + 'px');
    }
    function sheetOn() {
      if (!phone()) return;
      box.classList.add('is-sheet');
      document.documentElement.classList.add('ccw-combo-sheet');
      document.body.style.overflow = 'hidden';
      fit();
      if (vv) {
        vv.addEventListener('resize', fit);
        vv.addEventListener('scroll', fit);
      }
    }
    function sheetOff() {
      if (!box.classList.contains('is-sheet')) return;
      box.classList.remove('is-sheet');
      document.documentElement.classList.remove('ccw-combo-sheet');
      document.body.style.overflow = '';
      if (vv) {
        vv.removeEventListener('resize', fit);
        vv.removeEventListener('scroll', fit);
      }
    }
    var cls = $('.combo__close', box);
    if (cls)
      cls.onclick = function (e) {
        e.stopPropagation();
        closeC(true);
      };
    ctrl.onclick = function () {
      box.classList.contains('is-open') ? closeC(true) : openC();
    };
    ctrl.onkeydown = function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openC();
      }
    };
    if (search)
      search.oninput = function () {
        filterOpts(box, search.value);
        setHi(vis()[0]);
      };
    kb.onkeydown = function (e) {
      var v = vis(),
        c = hi(),
        i = v.indexOf(c);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHi(v[Math.min(i + 1, v.length - 1)] || v[0]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHi(v[Math.max(i - 1, 0)]);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setHi(v[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        setHi(v[v.length - 1]);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choose(c || v[0]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeC(true);
      }
    };
    each(
      '.combo__opt',
      function (o) {
        o.onclick = function () {
          choose(o);
        };
        o.onmousemove = function () {
          setHi(o);
        };
      },
      box,
    );
  });
  document.addEventListener('click', function (e) {
    each('[data-combo]', function (box) {
      if (!box.contains(e.target) && !box.classList.contains('is-sheet')) {
        box.classList.remove('is-open');
        var c = $('.combo__ctrl', box);
        if (c) c.setAttribute('aria-expanded', 'false');
      }
    });
  });

  /* shared with the other files (window.CCW) */
  CCW.isMobile = isMobile;
  CCW.viewEl = viewEl;
  CCW.render = render;
  CCW.go = go;
  CCW.resetForm = resetForm;
  CCW.sheet = sheet;
})((window.CCW = window.CCW || {}));
