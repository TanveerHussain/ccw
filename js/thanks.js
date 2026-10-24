/* ############################################################
   THANK YOU + SHARE
   The thank-you screen, the leave dialog, and the share image + share sheet.
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
  function resetState() {
    return CCW.resetState.apply(this, arguments);
  }
  /* from wizard.js */
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
  function submitChoice(k) {
    state.chosen = k;
    state.showErr = false;
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
      /* a fresh copy each time: lottie changes the data it is given (animations/success.js) */
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
  /* design values come from the design tokens at the top of css/main.css (section 5, SHARE IMAGE); texts and logo from data-share-* on #shSheet */
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
  CCW.setupThanks = setupThanks;
  CCW.playDone = playDone;
})((window.CCW = window.CCW || {}));
