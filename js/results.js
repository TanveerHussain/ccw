/* ############################################################
   RESULTS
   The results screen: desktop compare table and the mobile one-card-at-a-time view.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from core.js */
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
  /* from wizard.js */
  function isMobile() {
    return CCW.isMobile.apply(this, arguments);
  }
  function render() {
    return CCW.render.apply(this, arguments);
  }
  /* from thanks.js */
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
      $('.foot__cell[data-ci="' + ci + '"] [data-select]', desk).dataset.select = k;
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
