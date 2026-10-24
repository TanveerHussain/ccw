/* ############################################################
   STAGE
   The left panel: card carousel, chosen card, guide line and tilt effect.
   ############################################################ */
(function (CCW) {
  'use strict';

  /* from core.js */
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
  /* from wizard.js */
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
    return s === 'spend' || s === 'benefit' || s === 'three' || s === 'about';
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
      ids.push('three:' + id);
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
    /* Steps 1-4: no card name, only the step's guide line and the customer's picks */
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
      setMatch('chosen', 'card:' + k, 'chosen');
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
