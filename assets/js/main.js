/* ==========================================================
   SWEATPANTS vs DORY — countdown, live predictions, line-ups
   Kick-off, venue and score live in Mamar's ForgeBase (table bet_matches),
   so setting the date there updates every phone at once.
   ========================================================== */
(function () {
  'use strict';

  var API = 'https://salmanalghamdi.tailaacd46.ts.net/p/rcqpmobndclconwzwbsw/functions/v1/api/rpc/';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb3JnZWJhc2UiLCJyZWYiOiJyY3FwbW9ibmRjbGNvbnd6d2JzdyIsInJvbGUiOiJhbm9uIiwia2lkIjoiM2Y4ZTgxNmQtNDJiZS00MmE0LTg2ZjgtYjM3ODk5ZGNlYzFkIiwiaWF0IjoxNzkzNDUwNjM3fQ.Fsi-B6N0kaeq2AH45g3gL0PMCYtuK4aKaIEa7FuoseI';   // anon key: public by design
  var SLUG = 'sweatpants-vs-dory';
  var TZ = 'Asia/Riyadh';
  var MATCH_MINUTES = 90;                                         // for the calendar entry

  /* ---------- the squads (a formation concept; x/y are % of the pitch) ---------- */
  var TEAMS = {
    a: {
      name: { ar: 'سويت بانتس', en: 'Sweatpants' }, crest: 'crest-sp', formation: '1-2-1-2',
      players: [
        { no: 1,  n: 'Yousuf Qadi', pos: 'GK', x: 50, y: 90 },
        { no: 4,  n: 'Abdulaziz',   pos: 'DF', x: 25, y: 79 },
        { no: 5,  n: 'Ammar Alo',   pos: 'DF', x: 75, y: 79 },
        { no: 8,  n: 'Omar M.',     pos: 'MF', x: 50, y: 68.5 },
        { no: 11, n: 'Talal',       pos: 'FW', x: 27, y: 57 },
        { no: 10, n: 'Ahmed A.',    pos: 'FW', x: 73, y: 57 }
      ]
    },
    b: {
      name: { ar: 'دوري', en: 'Dory' }, crest: 'crest-dory', formation: '1-2-2-1',
      players: [
        { no: 1, n: 'Reda Mari',       pos: 'GK', x: 50, y: 7 },
        { no: 4, n: 'Faris Linjawi',   pos: 'DF', x: 25, y: 19 },
        { no: 5, n: 'Jad',             pos: 'DF', x: 75, y: 19 },
        { no: 6, n: 'Omar Jan',        pos: 'MF', x: 27, y: 33.5 },
        { no: 8, n: 'Yousuf Baghdadi', pos: 'MF', x: 73, y: 33.5 },
        { no: 9, n: 'Ahmed S.',        pos: 'FW', x: 50, y: 45 }
      ]
    }
  };

  /* ---------- words that change with the state ---------- */
  var T = {
    ar: {
      lbl: { tba: 'صافرة البداية · قريباً', count: 'باقي على صافرة البداية', go: 'بدأت المباراة', live: 'مباشر', ft: 'نهاية المباراة' },
      noteTba: 'الموعد ما تحدد للحين — العدّاد يشتغل أول ما يتحدد.',
      noteGo: 'الكورة في الملعب. النتيجة تنزل هنا أول ما تخلص.',
      noteLive: 'المباراة شغّالة الحين.',
      ft: { a: 'سويت بانتس فاز — دوري يطلع، وسويت بانتس ياخذ مكانه في البطولة.', b: 'دوري فاز وحافظ على مكانه في البطولة. احترام.', d: 'تعادل. ما أحد طلع… للحين.' },
      tba: 'لم يُحدد بعد', venueTba: 'يتحدد قريباً',
      cal: 'أضفها للتقويم', calTba: 'التقويم بعد تحديد الموعد',
      votes: function (n) { return n ? 'عدد التوقعات: ' + n : 'ما فيه توقعات للحين — كن أول واحد'; },
      prompt: 'اضغط على الفريق اللي تتوقع يفوز.',
      mine: function (t) { return 'توقّعك: ' + t + ' — تقدر تغيّره لين صافرة البداية.'; },
      closed: 'التوقعات قفلت مع صافرة البداية.',
      backed: function (p) { return 'التوقعات قفلت — ' + p + '% توقعوا النتيجة الصح.'; },
      soon: 'التوقعات تفتح قريباً.',
      err: 'ما قدرنا نوصل للتوقعات — تأكد من الاتصال وجرّب مرة ثانية.',
      limit: 'توقعات كثيرة من نفس الشبكة — جرّب بعدين.',
      share: 'سويت بانتس ضد دوري — مباراة الحسم. الفائز ياخذ مكان المدرسة في البطولة. توقّع الفائز هنا:',
      pos: { GK: 'حارس', DF: 'دفاع', MF: 'وسط', FW: 'هجوم' },
      days: 'ي',
      ticker: function (k) {
        return ['دوري في البطولة: خسارة ⁦0–2⁩ · خسارة ⁦0–2⁩', 'سويت بانتس يطالب بالتبديل', 'هل يبقى دوري في الدوري؟',
          'الفائز ياخذ مكان المدرسة في البطولة', 'صافرة البداية: ' + (k || 'الموعد قريباً'), 'التوقعات مفتوحة — توقّع الفائز'];
      }
    },
    en: {
      lbl: { tba: 'Kick-off · TBA', count: 'Kick-off in', go: 'Kick-off!', live: 'Live', ft: 'Full time' },
      noteTba: 'No date yet — the clock starts the moment it’s set.',
      noteGo: 'The ball’s rolling. The result lands here when it’s over.',
      noteLive: 'The match is on right now.',
      ft: { a: 'Sweatpants win — Dory are subbed off, and Sweatpants take the tournament spot.', b: 'Dory win and keep their tournament spot. Respect.', d: 'A draw. Nobody’s subbed off… yet.' },
      tba: 'TBA', venueTba: 'To be announced',
      cal: 'Add to calendar', calTba: 'Calendar link comes with the date',
      votes: function (n) { return n ? n + (n === 1 ? ' prediction' : ' predictions') : 'No predictions yet — be the first'; },
      prompt: 'Tap the team you think will win.',
      mine: function (t) { return 'Your pick: ' + t + ' — you can change it until kick-off.'; },
      closed: 'Predictions closed at kick-off.',
      backed: function (p) { return 'Predictions closed — ' + p + '% called it right.'; },
      soon: 'Predictions open soon.',
      err: 'Couldn’t reach the predictions — check your connection and try again.',
      limit: 'Lots of predictions from this network — try again later.',
      share: 'Sweatpants vs Dory — The Decider. Winner takes the school’s tournament spot. Predict the winner:',
      pos: { GK: 'GK', DF: 'DEF', MF: 'MID', FW: 'FWD' },
      days: 'D',
      ticker: function (k) {
        return ['Dory in the tournament: L 0–2 · L 0–2', 'Sweatpants demand a substitution', 'Can Dory keep their spot?',
          'Winner takes the school’s tournament spot', 'Kick-off: ' + (k || 'date TBA'), 'Predictions are open — pick your winner'];
      }
    }
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'ar';
  var t = function () { return T[lang]; };

  /* ---------- state ---------- */
  var S = { m: null, skew: 0, err: null, loaded: false };
  var now = function () { return Date.now() + S.skew; };
  var preview = new URLSearchParams(location.search).get('preview');   // ?preview=count|go|live|ft|ftb|draw — look only, nothing saved

  function phase() {
    var m = S.m;
    if (!m) return 'tba';
    if (m.status === 'full_time') return 'ft';
    if (m.status === 'live') return 'live';
    if (!m.kickoff) return 'tba';
    return now() >= Date.parse(m.kickoff) ? 'go' : 'count';
  }

  /* ---------- the device's one vote ---------- */
  var device = (function () {
    var k = 'svd-device', v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v || !/^[A-Za-z0-9-]{16,64}$/.test(v)) {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
      v = v.replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  })();

  function rpc(name, p) {
    return fetch(API + name, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY },
      body: JSON.stringify(p)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.code) || ('HTTP ' + r.status)); e.code = j && j.code; throw e; }
        return j;
      });
    });
  }

  function applyPreview(m) {
    if (!preview) return m;
    m = Object.assign({}, m || { votes: { a: 0, b: 0 }, mine: null, open: true, status: 'upcoming' });
    var soon = new Date(now() + ((3 * 24 + 4) * 3600 + 17 * 60 + 9) * 1000).toISOString();
    if (preview === 'count') { m.kickoff = soon; m.status = 'upcoming'; m.open = true; m.venue_ar = m.venue_ar || 'ملعب الحي'; m.venue_en = m.venue_en || 'The local pitch'; }
    if (preview === 'go') { m.kickoff = new Date(now() - 60000).toISOString(); m.status = 'upcoming'; m.open = false; }
    if (preview === 'live') { m.kickoff = new Date(now() - 1800000).toISOString(); m.status = 'live'; m.score_a = 1; m.score_b = 0; m.open = false; }
    if (preview === 'ft' || preview === 'ftb' || preview === 'draw') {
      m.kickoff = new Date(now() - 7200000).toISOString(); m.status = 'full_time'; m.open = false;
      m.score_a = preview === 'ft' ? 3 : preview === 'ftb' ? 1 : 2; m.score_b = preview === 'ft' ? 1 : preview === 'ftb' ? 2 : 2;
    }
    return m;
  }

  function setState(m) {
    if (m && m.now) S.skew = Date.parse(m.now) - Date.now();
    S.m = applyPreview(m);
    S.err = null; S.loaded = true;
    renderAll();
  }

  function load() {
    return rpc('pub_bet_match', { slug: SLUG, device: device })
      .then(setState)
      .catch(function (e) {
        S.loaded = true;
        if (!S.m) { S.m = applyPreview(null); S.err = e.code === 'NOT_FOUND' || /Could not find/i.test(e.message) ? 'soon' : 'err'; }
        renderAll();
      });
  }

  /* ---------- formatting ---------- */
  var two = function (n) { return (n < 10 ? '0' : '') + n; };
  function fmtDate(iso) {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
      { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(new Date(iso));
  }
  function fmtTime(iso) {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US',
      { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
  }
  var venue = function () { var m = S.m; return m && (lang === 'ar' ? (m.venue_ar || m.venue_en) : (m.venue_en || m.venue_ar)); };

  /* ---------- the scoreboard ---------- */
  var board = $('#board'), clock = $('#clock'), score = $('#score');
  var digits = {}; $$('[data-k]', clock).forEach(function (b) { digits[b.getAttribute('data-k')] = b; });
  var last = {};

  function setDigit(k, v) {
    var b = digits[k];
    if (b.textContent === v) return;
    b.textContent = v;
    if (!reduced && last[k] !== undefined) { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); }
    last[k] = v;
  }

  function renderBoard() {
    var p = phase(), m = S.m, L = t();
    board.setAttribute('data-state', p);
    var label = $('#boardLabel');
    label.innerHTML = '';
    if (p === 'live') { var d = document.createElement('span'); d.className = 'dot'; label.appendChild(d); }
    label.appendChild(document.createTextNode(L.lbl[p]));

    var showScore = p === 'live' || p === 'ft';
    clock.hidden = showScore; score.hidden = !showScore;
    if (showScore) { $('#scoreA').textContent = m.score_a == null ? 0 : m.score_a; $('#scoreB').textContent = m.score_b == null ? 0 : m.score_b; }

    var note = $('#boardNote');
    if (p === 'tba') note.textContent = L.noteTba;
    else if (p === 'go') note.textContent = L.noteGo;
    else if (p === 'live') note.textContent = L.noteLive;
    else if (p === 'ft') { var a = +m.score_a || 0, b = +m.score_b || 0; note.textContent = a > b ? L.ft.a : b > a ? L.ft.b : L.ft.d; }
    else {
      note.innerHTML = '';
      var bd = document.createElement('b'); bd.textContent = fmtDate(m.kickoff);
      note.appendChild(bd);
      note.appendChild(document.createTextNode(' · ' + fmtTime(m.kickoff) + (venue() ? ' · ' + venue() : '')));
    }
    tick();
  }

  function tick() {
    var p = phase(), m = S.m, mini = $('#miniClock');
    if (p === 'tba') { ['d', 'h', 'm', 's'].forEach(function (k) { setDigit(k, '--'); }); mini.textContent = 'SWP · TBA · DRY'; return; }
    if (p === 'live' || p === 'ft') { mini.textContent = (p === 'ft' ? 'FT  ' : '● ') + 'SWP ' + (+m.score_a || 0) + '–' + (+m.score_b || 0) + ' DRY'; return; }
    var ms = Math.max(0, Date.parse(m.kickoff) - now());
    if (p === 'count' && ms === 0) { renderBoard(); renderVotes(); return; }   // just kicked off
    var s = Math.floor(ms / 1000);
    var D = Math.floor(s / 86400), H = Math.floor(s % 86400 / 3600), M = Math.floor(s % 3600 / 60), Sx = s % 60;
    setDigit('d', two(D)); setDigit('h', two(H)); setDigit('m', two(M)); setDigit('s', two(Sx));
    mini.textContent = 'SWP  ' + D + 'D ' + two(H) + ':' + two(M) + ':' + two(Sx) + '  DRY';
  }

  /* ---------- predictions ---------- */
  var picks = $('#picks'), note = $('#predictNote');
  function renderVotes() {
    var m = S.m, L = t();
    var a = m && m.votes ? +m.votes.a || 0 : 0, b = m && m.votes ? +m.votes.b || 0 : 0, n = a + b;
    var pa = n ? Math.round(a * 100 / n) : 50, pb = n ? 100 - pa : 50;
    $('#barA').style.width = pa + '%'; $('#barB').style.width = pb + '%';
    $('#pctA').textContent = n ? pa + '%' : '–'; $('#pctB').textContent = n ? pb + '%' : '–';
    $('.tally').classList.toggle('empty', !n);
    $('#tallyN').textContent = S.err ? '' : L.votes(n);

    var mine = m && m.mine;
    $$('.pick', picks).forEach(function (el) { el.setAttribute('aria-pressed', el.getAttribute('data-pick') === mine ? 'true' : 'false'); });
    var open = !!(m && m.open && !S.err && phase() !== 'go');
    picks.classList.toggle('closed', !open);

    note.classList.toggle('err', S.err === 'err');
    if (!S.loaded) note.textContent = '';
    else if (S.err) note.textContent = L[S.err] || L.err;
    else if (!open) {
      var sa = +m.score_a || 0, sb = +m.score_b || 0;
      if (phase() === 'ft' && n && sa !== sb) note.textContent = L.backed(sa > sb ? pa : pb);
      else note.textContent = L.closed;
    }
    else if (mine) note.textContent = L.mine(TEAMS[mine].name[lang]);
    else note.textContent = L.prompt;
  }

  picks.addEventListener('click', function (e) {
    var btn = e.target.closest('.pick');
    if (!btn || picks.classList.contains('closed') || picks.classList.contains('busy')) return;
    var pick = btn.getAttribute('data-pick'), m = S.m;
    if (!m || m.mine === pick) return;
    var before = JSON.parse(JSON.stringify(m));
    m.votes[pick] = (+m.votes[pick] || 0) + 1;                 // show it straight away…
    if (m.mine) m.votes[m.mine] = Math.max(0, (+m.votes[m.mine] || 0) - 1);
    m.mine = pick;
    renderVotes();
    if (navigator.vibrate) { try { navigator.vibrate(12); } catch (x) {} }
    if (preview) return;
    picks.classList.add('busy');
    rpc('pub_bet_vote', { slug: SLUG, device: device, pick: pick })   // …then let the server have the final word
      .then(setState)
      .catch(function (err) {
        S.m = before; renderVotes();
        note.classList.add('err');
        note.textContent = err.code === 'LIMIT' ? t().limit : err.code === 'CLOSED' ? t().closed : t().err;
        if (err.code === 'CLOSED') load();
      })
      .then(function () { picks.classList.remove('busy'); });
  });

  /* ---------- line-ups ---------- */
  function renderLineups() {
    var box = $('#players'); box.innerHTML = '';
    var i = 0;
    ['b', 'a'].forEach(function (k) {
      TEAMS[k].players.forEach(function (p) {
        var el = document.createElement('div');
        el.className = 'pl pl--' + k;
        el.style.left = p.x + '%'; el.style.top = p.y + '%';
        el.style.transitionDelay = (reduced ? 0 : 120 + i++ * 55) + 'ms';
        var dot = document.createElement('span'); dot.className = 'pl__dot'; dot.textContent = p.no;
        var nm = document.createElement('span'); nm.className = 'pl__nm';
        p.n.split(' ').forEach(function (w, j) { if (j) nm.appendChild(document.createElement('br')); nm.appendChild(document.createTextNode(w)); });
        el.appendChild(dot); el.appendChild(nm); box.appendChild(el);
      });
    });
    ['a', 'b'].forEach(function (k) {
      var tm = TEAMS[k], host = $(k === 'a' ? '#squadA' : '#squadB'); host.innerHTML = '';
      var h = document.createElement('div'); h.className = 'squad__h';
      h.innerHTML = '<svg aria-hidden="true"><use href="#' + tm.crest + '"/></svg>';
      var hb = document.createElement('div'), b = document.createElement('b'), sm = document.createElement('small');
      b.textContent = tm.name[lang]; sm.textContent = tm.formation; hb.appendChild(b); hb.appendChild(sm); h.appendChild(hb);
      var ol = document.createElement('ol');
      tm.players.forEach(function (p) {
        var li = document.createElement('li');
        [['no', p.no], ['nm', p.n], ['pos', t().pos[p.pos]]].forEach(function (c) {
          var s = document.createElement('span'); s.className = c[0]; s.textContent = c[1]; li.appendChild(s);
        });
        ol.appendChild(li);
      });
      host.appendChild(h); host.appendChild(ol);
    });
  }

  /* ---------- match info + calendar ---------- */
  function renderInfo() {
    var m = S.m, L = t(), has = !!(m && m.kickoff);
    var d = $('#fDate'), tm = $('#fTime'), v = $('#fVenue');
    d.textContent = has ? fmtDate(m.kickoff) : L.tba; d.classList.toggle('tba', !has);
    tm.textContent = has ? fmtTime(m.kickoff) : L.tba; tm.classList.toggle('tba', !has);
    v.textContent = venue() || L.venueTba; v.classList.toggle('tba', !venue());
    var cal = $('#calBtn');
    $('#calTx').textContent = has ? L.cal : L.calTba;
    cal.setAttribute('aria-disabled', has && phase() === 'count' ? 'false' : 'true');
    if (has) {
      var st = new Date(m.kickoff), en = new Date(st.getTime() + MATCH_MINUTES * 60000);
      var z = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mamar//Sweatpants vs Dory//EN', 'BEGIN:VEVENT',
        'UID:' + SLUG + '@mamar.site', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(st), 'DTEND:' + z(en),
        'SUMMARY:Sweatpants vs Dory — The Decider', venue() ? 'LOCATION:' + venue().replace(/[,;]/g, ' ') : '',
        'DESCRIPTION:Winner takes the school tournament spot. ' + location.origin + location.pathname,
        'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Sweatpants vs Dory', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
      cal.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
      cal.setAttribute('download', 'sweatpants-vs-dory.ics');
    } else { cal.href = '#'; cal.removeAttribute('download'); }
  }

  /* ---------- ticker ---------- */
  var tickerKey = '';
  function renderTicker() {
    var m = S.m, k = m && m.kickoff ? fmtDate(m.kickoff) + ' · ' + fmtTime(m.kickoff) : '';
    var items = t().ticker(k);
    if (phase() !== 'count' && phase() !== 'tba') items.pop();                  // predictions are closed by then
    var key = lang + items.join('|');
    if (key === tickerKey) return;
    tickerKey = key;
    var track = $('#ticker'); track.innerHTML = '';
    var set = items.concat(items);
    set.concat(set).forEach(function (s) { var sp = document.createElement('span'); sp.dir = 'auto'; sp.textContent = s; track.appendChild(sp); });
    requestAnimationFrame(function () { track.style.animationDuration = Math.max(30, track.scrollWidth / 2 / 60) + 's'; });
  }

  function renderAll() { renderBoard(); renderVotes(); renderInfo(); renderTicker(); }

  /* ---------- language ---------- */
  var nodes = $$('[data-en]');
  function applyLang(l, persist) {
    lang = l === 'en' ? 'en' : 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    nodes.forEach(function (el) { var v = el.getAttribute('data-' + lang); if (v != null) el.textContent = v; });
    $('#langTx').textContent = lang === 'ar' ? 'EN' : 'ع';
    if (persist) { try { localStorage.setItem('svd-lang', lang); } catch (e) {} }
    renderLineups(); renderAll();
  }
  $('#langBtn').addEventListener('click', function () { applyLang(lang === 'ar' ? 'en' : 'ar', true); });

  /* ---------- share ---------- */
  function share() {
    var url = location.origin + location.pathname, text = t().share;
    if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
  }
  $$('.js-share').forEach(function (b) { b.addEventListener('click', share); });

  /* ---------- the night sky ---------- */
  (function stars() {
    var host = $('#stars'); if (!host) return;
    var n = window.innerWidth < 760 ? 46 : 90;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'), size = Math.random() < .2 ? 2.5 : Math.random() < .5 ? 1.5 : 1;
      s.style.cssText = 'left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (Math.random() * 62).toFixed(2) + '%;width:' + size + 'px;height:' + size + 'px;' +
        '--t:' + (2.5 + Math.random() * 4).toFixed(2) + 's;--d:-' + (Math.random() * 5).toFixed(2) + 's;--o:' + (.45 + Math.random() * .55).toFixed(2);
      host.appendChild(s);
    }
  })();

  /* ---------- reveals + header ---------- */
  var revs = $$('.rev');
  if (reduced || !('IntersectionObserver' in window)) revs.forEach(function (el) { el.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  }
  var top = $('#top');
  function chrome() { top.classList.toggle('stuck', window.scrollY > board.offsetTop + board.offsetHeight - 40); }
  window.addEventListener('scroll', chrome, { passive: true });

  /* ---------- go ---------- */
  var saved = null;
  try { saved = localStorage.getItem('svd-lang'); } catch (e) {}
  applyLang(saved === 'en' ? 'en' : 'ar');
  chrome();
  load();
  setInterval(tick, 1000);
  setInterval(function () { if (document.visibilityState === 'visible') load(); }, 15000);   // live votes + date changes
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') load(); });
})();
