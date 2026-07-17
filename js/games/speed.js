// Speed round: 60 seconds, Know it / Skip, no repeats until the deck runs dry.
(function(){
var U = VCF.util;
var SECONDS = 60;

VCF.games.speed = {
  _timer: null,

  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }
    var self = this;

    var left = SECONDS, known = 0, seen = 0, xpEarned = 0, over = false;
    var queue = U.shuffle(deck.cards);
    var qi = 0;

    var frame = VCF.ui.gameFrame({
      accent: deck.color,
      onClose: function(){ self._stop(); }
    });
    root.appendChild(frame.root);

    frame.mid.innerHTML = '<div class="speed-timer"><div class="speed-timer-fill" id="spFill"></div></div>';
    frame.right.innerHTML = '<div class="speed-clock" id="spClock">' + SECONDS + 's</div>';

    function card(){
      if (qi >= queue.length) return end();
      var c = queue[qi];
      var cat = null;
      deck.cats.forEach(function(x){ if (x.id === c.c) cat = x; });
      var color = cat ? cat.color : deck.color;

      frame.body.innerHTML =
        '<div class="speed-card pop-in">' +
          '<div class="speed-visual" style="color:' + color + '">' + (deck.visuals[c.n] || '') + '</div>' +
          '<div class="speed-name">' + U.esc(c.n) + '</div>' +
          '<span class="cat-chip"><span class="cat-dot" style="background:' + color + '"></span>' + U.esc(cat ? cat.label : c.c) + '</span>' +
          '<div class="speed-desc">' + U.esc(c.d) + '</div>' +
        '</div>' +
        '<div class="speed-btns">' +
          '<button class="btn speed-skip">' + VCF.ui.icons.x + ' Skip</button>' +
          '<button class="btn primary speed-know">' + VCF.ui.icons.check + ' Know it</button>' +
        '</div>' +
        '<div class="speed-score">' + known + ' known · ' + seen + ' seen</div>';

      U.$('.speed-know', frame.body).addEventListener('click', function(){
        if (over) return;
        known++; seen++; qi++;
        VCF.srs.grade(VCF.store.card(deck.id, c.n), 'good');
        xpEarned += 5;
        VCF.game.awardXp(5, 'speed');
        VCF.audio.play('correct');
        VCF.haptics.tap();
        card();
      });
      U.$('.speed-skip', frame.body).addEventListener('click', function(){
        if (over) return;
        seen++; qi++;
        VCF.srs.grade(VCF.store.card(deck.id, c.n), 'hard');
        VCF.audio.play('swoosh');
        card();
      });
    }

    function tickUi(){
      var fill = U.$('#spFill', frame.root);
      var clock = U.$('#spClock', frame.root);
      if (fill) fill.style.width = (left / SECONDS * 100) + '%';
      if (clock){
        clock.textContent = left + 's';
        clock.classList.toggle('urgent', left <= 10);
      }
    }

    this._timer = setInterval(function(){
      left--;
      tickUi();
      if (left <= 5 && left > 0) VCF.audio.play('tick');
      if (left <= 0) end();
    }, 1000);

    function end(){
      if (over) return;
      over = true;
      self._stop();
      VCF.audio.play('timeup');
      VCF.haptics.heavy();

      var s = VCF.store.state;
      var bonus = known; // +1 per known card
      xpEarned += bonus;
      if (bonus) VCF.game.awardXp(bonus, 'speed-bonus');
      s.scores.speedBestKnown = Math.max(s.scores.speedBestKnown, known);
      VCF.game.recordRound(deck.id);
      VCF.store.save();
      VCF.game.checkBadges('speed-round', { known: known, seen: seen });
      if (known >= 15) VCF.fx.confetti({ y: 0.3 });

      var pct = seen ? Math.round(known / seen * 100) : 0;
      frame.body.innerHTML = '';
      frame.mid.innerHTML = '';
      frame.right.innerHTML = '';
      frame.body.appendChild(VCF.ui.results({
        title: 'Time!',
        subtitle: deck.name + ' speed round',
        shareText: 'I knew ' + known + ' ' + deck.name + ' cards in 60 seconds on Vibe Coder Flashcards. Your turn.',
        mood: known >= 15 ? 'hype' : known >= 8 ? 'happy' : 'idle',
        xp: xpEarned,
        stats: [
          { value: known, label: 'Known', color: '#4dd08c' },
          { value: seen, label: 'Seen' },
          { value: pct + '%', label: 'Hit rate', color: '#ffd93d' }
        ],
        onAgain: function(){
          root.innerHTML = '';
          VCF.games.speed.mount(root, params);
        }
      }));
      VCF.shell.refreshHud();
    }

    card();
    tickUi();
  },

  _stop: function(){
    if (this._timer){ clearInterval(this._timer); this._timer = null; }
  },

  unmount: function(){ this._stop(); }
};

VCF.router.register('#/deck/:id/speed', VCF.games.speed);
})();
