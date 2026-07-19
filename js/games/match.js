// Match: pair card names with their visuals (or descriptions), against the clock.
(function(){
var U = VCF.util;
var PAIRS = 6;

VCF.games.match = {
  _timer: null,

  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }
    var self = this;

    // Prefer cards with a visual so the pairs are name <-> picture.
    var withVis = deck.cards.filter(function(c){ return deck.visuals[c.n]; });
    var pool = withVis.length >= PAIRS ? withVis : deck.cards;
    var chosen = U.shuffle(pool).slice(0, PAIRS);

    var tiles = [];
    chosen.forEach(function(c){
      var cat = null;
      deck.cats.forEach(function(x){ if (x.id === c.c) cat = x; });
      var color = cat ? cat.color : deck.color;
      tiles.push({ key: c.n, kind: 'name', html: '<div class="mt-name' + VCF.ui.nameFit(c.n) + '">' + U.esc(c.n) + '</div>', card: c });
      tiles.push({
        key: c.n, kind: 'hint',
        html: deck.visuals[c.n]
          ? '<div class="mt-visual" style="color:' + color + '">' + deck.visuals[c.n] + '</div>'
          : '<div class="mt-desc">' + U.esc(c.d) + '</div>',
        card: c
      });
    });
    tiles = U.shuffle(tiles);

    var found = 0, mistakes = 0, startAt = Date.now(), over = false;
    var first = null, lock = false;

    var frame = VCF.ui.gameFrame({
      accent: deck.color,
      onClose: function(){ self._stop(); }
    });
    root.appendChild(frame.root);
    frame.mid.innerHTML = '<div class="match-clock" id="mClock">0:00</div>';
    frame.right.innerHTML = '<div class="match-miss" id="mMiss"></div>';

    frame.body.innerHTML =
      '<div class="match-sub">Pair each name with its picture</div>' +
      '<div class="match-grid" id="mGrid"></div>';
    var grid = U.$('#mGrid', frame.body);

    tiles.forEach(function(t, i){
      var el = U.el('button', 'match-tile pop-in', t.html);
      el.style.animationDelay = (i * 0.04) + 's';
      el.dataset.key = t.key;
      el.addEventListener('click', function(){ tap(el, t); });
      grid.appendChild(el);
    });

    this._timer = setInterval(function(){
      var el = U.$('#mClock', frame.root);
      if (el) el.textContent = U.fmtMs(Date.now() - startAt);
    }, 500);

    function tap(el, t){
      if (lock || over || el.classList.contains('done') || el === (first && first.el)) return;
      VCF.audio.play('tap');
      el.classList.add('sel');
      if (!first){ first = { el: el, t: t }; return; }

      lock = true;
      var a = first; first = null;
      if (a.t.key === t.key && a.t.kind !== t.kind){
        // pair!
        found++;
        VCF.srs.nudge(VCF.store.card(deck.id, t.key));
        VCF.store.save(); // persist per pair — quitting mid-game keeps progress
        VCF.audio.play('match');
        VCF.haptics.success();
        [a.el, el].forEach(function(x){ x.classList.remove('sel'); x.classList.add('done'); });
        lock = false;
        if (found === PAIRS) win();
      } else {
        mistakes++;
        var mm = U.$('#mMiss', frame.root);
        if (mm) mm.textContent = mistakes + ' miss' + (mistakes === 1 ? '' : 'es');
        VCF.audio.play('wrong');
        VCF.haptics.fail();
        [a.el, el].forEach(function(x){ x.classList.add('nope'); });
        setTimeout(function(){
          [a.el, el].forEach(function(x){ x.classList.remove('sel', 'nope'); });
          lock = false;
        }, 550);
      }
    }

    function win(){
      over = true;
      self._stop();
      var ms = Date.now() - startAt;
      var secs = Math.round(ms / 1000);
      var xp = Math.max(10, 40 + Math.max(0, 60 - secs) - 5 * mistakes);
      VCF.game.awardXp(xp, 'match');

      var s = VCF.store.state;
      if (s.scores.matchBestMs == null || ms < s.scores.matchBestMs) s.scores.matchBestMs = ms;
      if (mistakes === 0) s.scores.matchNoMistakeWins++;
      VCF.game.recordRound(deck.id);
      VCF.store.save();
      VCF.game.checkBadges('match-round', { mistakes: mistakes, ms: ms });
      VCF.game.questEvent('match-round', { mistakes: mistakes, ms: ms });
      VCF.fx.confetti({ y: 0.35 });
      VCF.audio.play('levelup');

      frame.body.innerHTML = '';
      frame.mid.innerHTML = '';
      frame.right.innerHTML = '';
      frame.body.appendChild(VCF.ui.results({
        title: mistakes === 0 ? 'Perfect match!' : 'Matched!',
        subtitle: deck.name + ' pairs',
        shareText: 'Matched all ' + deck.name + ' pairs in ' + U.fmtMs(ms) +
          (mistakes === 0 ? ' with zero mistakes' : '') + ' on Vibe Coder Flashcards.',
        mood: mistakes === 0 ? 'hype' : 'happy',
        xp: xp,
        stats: [
          { value: U.fmtMs(ms), label: 'Time', color: '#57c7ff' },
          { value: mistakes, label: 'Misses', color: mistakes ? '#ff5c72' : '#4dd08c' },
          { value: s.scores.matchBestMs != null ? U.fmtMs(s.scores.matchBestMs) : '—', label: 'Best time' }
        ],
        onAgain: function(){
          root.innerHTML = '';
          VCF.games.match.mount(root, params);
        }
      }));
      VCF.shell.refreshHud();
    }
  },

  _stop: function(){
    if (this._timer){ clearInterval(this._timer); this._timer = null; }
  },
  unmount: function(){ this._stop(); }
};

VCF.router.register('#/deck/:id/match', VCF.games.match);
})();
