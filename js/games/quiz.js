// Quiz: 10-question multiple-choice round with combo multiplier + SRS grading.
// Reused by the daily challenge via VCF.games.quiz.run(root, opts).
(function(){
var U = VCF.util;
var ROUND = 10;

function pickRound(deck){
  // Prefer due cards, then unseen, then random fill.
  var due = VCF.srs.dueQueue(deck.id, 6).map(function(it){ return it.card; });
  var names = {};
  due.forEach(function(c){ names[c.n] = 1; });
  var rest = U.shuffle(deck.cards.filter(function(c){ return !names[c.n]; }));
  var cards = due.concat(rest).slice(0, Math.min(ROUND, deck.cards.length));
  return U.shuffle(cards).map(function(c){ return { deck: deck, card: c }; });
}

function options(item){
  // 3 wrong names, same category when possible, from the same deck.
  var deck = item.deck, card = item.card;
  var sameCat = deck.cards.filter(function(c){ return c.n !== card.n && c.c === card.c; });
  var others = deck.cards.filter(function(c){ return c.n !== card.n && c.c !== card.c; });
  var wrong = U.shuffle(sameCat).slice(0, 3);
  if (wrong.length < 3) wrong = wrong.concat(U.shuffle(others).slice(0, 3 - wrong.length));
  return U.shuffle([card].concat(wrong)).map(function(c){ return c.n; });
}

VCF.games.quiz = {
  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }
    VCF.games.quiz.run(root, {
      items: pickRound(deck),
      accent: deck.color,
      title: deck.name + ' Quiz',
      event: 'quiz-round',
      deckId: deck.id,
      onAgain: function(rootEl){
        rootEl.innerHTML = '';
        VCF.games.quiz.mount(rootEl, params);
      }
    });
  },
  unmount: function(){},

  // opts: { items:[{deck,card}], accent, title, event, deckId, bonus(stats), subtitle(stats), onAgain(root) }
  run: function(root, opts){
    var items = opts.items;
    var idx = 0, score = 0, combo = 0, bestCombo = 0, xpEarned = 0, answered = false;

    var frame = VCF.ui.gameFrame({ accent: opts.accent || '#9d7bff' });
    root.appendChild(frame.root);

    frame.mid.innerHTML = '<div class="round-bar"><div class="round-fill"></div></div>';
    frame.right.innerHTML = '<div class="combo-pill" id="comboPill"></div>';

    function refreshHead(){
      U.$('.round-fill', frame.root).style.width = (idx / items.length * 100) + '%';
      var pill = U.$('#comboPill', frame.root);
      var mult = VCF.game.multiplier(combo);
      if (combo >= 3){
        pill.innerHTML = VCF.ui.icons.flame + ' ' + combo + ' <b>×' + mult + '</b>';
        pill.classList.add('lit');
      } else {
        pill.textContent = score + '/' + (idx);
        pill.classList.remove('lit');
      }
    }

    function question(){
      answered = false;
      // clear any lingering focus from the previous answer button
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      var item = items[idx];
      var deck = item.deck, card = item.card;
      var cat = null;
      deck.cats.forEach(function(c){ if (c.id === card.c) cat = c; });
      var color = cat ? cat.color : deck.color;
      var visual = deck.visuals[card.n] || '';

      frame.body.innerHTML =
        '<div class="quiz-q">' +
          '<div class="quiz-visual" style="color:' + color + '">' + visual + '</div>' +
          '<span class="cat-chip"><span class="cat-dot" style="background:' + color + '"></span>' +
            U.esc(deck.name) + (cat ? ' · ' + U.esc(cat.label) : '') + '</span>' +
          '<div class="quiz-desc">' + U.esc(card.d) + '</div>' +
        '</div>' +
        '<div class="quiz-opts">' + options(item).map(function(n){
          return '<button class="quiz-opt" data-n="' + U.esc(n) + '">' + U.esc(n) + '</button>';
        }).join('') + '</div>' +
        '<button class="btn primary quiz-next hidden">Next</button>';

      refreshHead();

      U.$$('.quiz-opt', frame.body).forEach(function(btn){
        btn.addEventListener('click', function(e){
          if (answered) return;
          answered = true;
          var correct = btn.dataset.n === card.n;
          var rec = VCF.store.card(deck.id, card.n);
          VCF.srs.grade(rec, correct ? 'good' : 'again');
          var s = VCF.store.state;
          s.counters.quizAnswers++;
          if (correct) s.counters.quizCorrect++;

          U.$$('.quiz-opt', frame.body).forEach(function(b){
            b.classList.add('locked');
            if (b.dataset.n === card.n) b.classList.add('right');
            else if (b === btn) b.classList.add('missed');
          });

          if (correct){
            score++;
            combo++;
            bestCombo = Math.max(bestCombo, combo);
            var gained = Math.round(10 * VCF.game.multiplier(combo));
            xpEarned += gained;
            VCF.game.awardXp(gained, 'quiz');
            VCF.audio.play(combo >= 3 ? 'combo' : 'correct', combo);
            VCF.haptics.success();
            var r = btn.getBoundingClientRect();
            VCF.fx.xpFloat(r.left + r.width / 2, r.top, '+' + gained + ' XP');
            btn.classList.add('bounce');
          } else {
            combo = 0;
            xpEarned += 2;
            VCF.game.awardXp(2, 'quiz-wrong');
            VCF.audio.play('wrong');
            VCF.haptics.fail();
            frame.body.classList.add('shake');
            setTimeout(function(){ frame.body.classList.remove('shake'); }, 450);
          }
          VCF.store.save();
          idx++;
          refreshHead();

          if (correct){
            setTimeout(next, 850);
          } else {
            U.$('.quiz-next', frame.body).classList.remove('hidden');
          }
        });
      });
      U.$('.quiz-next', frame.body).addEventListener('click', next);
    }

    function next(){
      if (idx >= items.length) return end();
      question();
    }

    function end(){
      var stats = { score: score, total: items.length, bestCombo: bestCombo, xp: xpEarned };
      var s = VCF.store.state;
      s.scores.quizBestStreak = Math.max(s.scores.quizBestStreak, bestCombo);
      VCF.game.recordRound(opts.deckId || (items[0] && items[0].deck.id));
      var extra = opts.bonus ? opts.bonus(stats) : null;
      if (extra && extra.xp){
        stats.xp += extra.xp;
        VCF.game.awardXp(extra.xp, opts.event + '-bonus');
      }
      VCF.store.save();
      VCF.game.checkBadges(opts.event || 'quiz-round', stats);
      VCF.game.questEvent('quiz-round', stats);

      var pct = Math.round(score / items.length * 100);
      if (pct >= 80) VCF.fx.confetti({ y: 0.3 });
      VCF.audio.play(pct >= 50 ? 'match' : 'timeup');

      frame.body.innerHTML = '';
      frame.mid.innerHTML = '';
      frame.right.innerHTML = '';
      frame.body.appendChild(VCF.ui.results({
        title: pct === 100 ? 'Flawless!' : pct >= 80 ? 'So good!' : pct >= 50 ? 'Solid round' : 'Warming up',
        subtitle: (extra && extra.subtitle) || opts.title,
        shareText: 'I scored ' + score + '/' + items.length +
          (bestCombo >= 3 ? ' with a x' + bestCombo + ' combo' : '') +
          ' on ' + (opts.title || 'a quiz') + ' in Vibe Coder Flashcards. Think you can beat that?',
        mood: pct >= 80 ? 'hype' : pct >= 50 ? 'happy' : 'sad',
        xp: stats.xp,
        stats: [
          { value: score + '/' + items.length, label: 'Correct', color: '#4dd08c' },
          { value: '×' + bestCombo, label: 'Best combo', color: '#ffd93d' },
          { value: pct + '%', label: 'Accuracy' }
        ],
        onAgain: function(){ opts.onAgain ? opts.onAgain(root) : VCF.router.back(); }
      }));
      VCF.shell.refreshHud();
    }

    question();
  }
};

VCF.router.register('#/deck/:id/quiz', VCF.games.quiz);

// Guided-path unit quiz: 10 questions from one category of one deck.
VCF.games.unit = {
  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }
    var cat = null;
    deck.cats.forEach(function(c){ if (c.id === params.cat) cat = c; });
    if (!cat){ VCF.router.go('/deck/' + deck.id + '/path'); return; }
    var pool = deck.cards.filter(function(c){ return c.c === cat.id; });
    var items = U.shuffle(pool).slice(0, Math.min(10, pool.length))
      .map(function(c){ return { deck: deck, card: c }; });
    VCF.games.quiz.run(root, {
      items: items,
      accent: cat.color || deck.color,
      title: deck.name + ' · ' + cat.label,
      event: 'quiz-round',
      deckId: deck.id,
      onAgain: function(rootEl){
        rootEl.innerHTML = '';
        VCF.games.unit.mount(rootEl, params);
      }
    });
  },
  unmount: function(){}
};
VCF.router.register('#/deck/:id/unit/:cat', VCF.games.unit);
})();
