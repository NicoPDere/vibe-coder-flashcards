// First-run onboarding: welcome -> pick decks -> daily goal -> token-savings
// pitch. Skippable, ~45 seconds, heavy on mascot joy.
(function(){
var U = VCF.util;

// Rough, honest math used in the pitch: a vague ask typically costs ~2 extra
// AI round-trips (~2.5k tokens each) before it lands. Knowing the right
// concept/prompt skips those. Averaged over a year of regular building:
var TOKENS_PER_CARD_YR = 4200;

VCF.screens.onboarding = {
  _step: 0,
  _decks: {},
  _goal: 'regular',

  mount: function(root){
    this._step = 0;
    this._decks = {};
    this._goal = 'regular';
    var el = U.el('div', 'screen ob-screen');
    el.innerHTML =
      '<button class="ghost-btn ob-skip">Skip</button>' +
      '<div class="ob-body" id="obBody"></div>' +
      '<div class="ob-foot">' +
        '<div class="ob-dots">' + [0,1,2,3].map(function(i){ return '<span class="ob-dot" data-i="' + i + '"></span>'; }).join('') + '</div>' +
        '<button class="btn primary ob-next" id="obNext">Continue</button>' +
      '</div>';
    root.appendChild(el);
    this._el = el;

    var self = this;
    U.$('.ob-skip', el).addEventListener('click', function(){ self.finish(); });
    var lastAdvance = 0;
    U.$('#obNext', el).addEventListener('click', function(){
      // debounce: double-taps (and overeager synthetic clicks) advance once
      var now = Date.now();
      if (now - lastAdvance < 350) return;
      lastAdvance = now;
      if (self._step === 3) return self.finish();
      self._step++;
      self.render();
    });
    this.render();
  },

  render: function(){
    var self = this, el = this._el;
    var body = U.$('#obBody', el);
    var next = U.$('#obNext', el);
    U.$$('.ob-dot', el).forEach(function(d, i){ d.classList.toggle('on', i <= self._step); });
    body.className = 'ob-body';
    void body.offsetWidth; // restart entrance animation
    body.classList.add('ob-in');

    if (this._step === 0){
      body.innerHTML =
        '<div class="ob-mascot"></div>' +
        '<h1 class="ob-title">Learn the words.<br><span class="grad-text">Ship the app.</span></h1>' +
        '<p class="ob-sub">' + VCF.deckList().reduce(function(n, d){ return n + d.cards.length; }, 0) + ' illustrated flashcards that make you fluent with your AI — JavaScript, Terminal, git, SwiftUI, SQL, Python, CSS, React, and the art of vibe coding itself.</p>';
      var m = VCF.ui.mascot('hype', 130);
      U.$('.ob-mascot', body).appendChild(m);
      setTimeout(function(){ VCF.ui.mascotReact(m, 'double'); }, 450);
      next.textContent = 'Let’s vibe';
    }

    if (this._step === 1){
      body.innerHTML =
        '<h1 class="ob-title">What are you building?</h1>' +
        '<p class="ob-sub">Pick the decks you care about — they go front and center. You can play all of them anytime.</p>' +
        '<div class="ob-deck-grid"></div>';
      var grid = U.$('.ob-deck-grid', body);
      VCF.deckList().forEach(function(deck){
        var chip = U.el('button', 'ob-deck' + (self._decks[deck.id] ? ' sel' : ''));
        chip.style.setProperty('--c1', deck.gradient[0]);
        chip.innerHTML = '<div class="ob-deck-icon">' + deck.icon + '</div>' +
          '<span style="color:' + deck.color + '">' + U.esc(deck.name) + '</span>' +
          '<em>' + deck.cards.length + ' cards</em>';
        chip.addEventListener('click', function(){
          self._decks[deck.id] = !self._decks[deck.id];
          chip.classList.toggle('sel', self._decks[deck.id]);
          VCF.audio.play(self._decks[deck.id] ? 'toggleOn' : 'toggleOff');
          VCF.haptics.tap();
        });
        grid.appendChild(chip);
      });
      next.textContent = 'Continue';
    }

    if (this._step === 2){
      var goals = [
        { id: 'chill', name: 'Chill', sub: '~5 min a day', flames: 1 },
        { id: 'regular', name: 'Regular', sub: '~10 min a day', flames: 2 },
        { id: 'serious', name: 'Serious', sub: '~15 min a day', flames: 3 }
      ];
      body.innerHTML =
        '<h1 class="ob-title">How hard do we vibe?</h1>' +
        '<p class="ob-sub">Streaks are kind here — one round a day keeps the flame alive.</p>' +
        '<div class="ob-goals"></div>';
      var wrap = U.$('.ob-goals', body);
      goals.forEach(function(g){
        var c = U.el('button', 'ob-goal' + (self._goal === g.id ? ' sel' : ''));
        var flames = '';
        for (var i = 0; i < g.flames; i++) flames += VCF.ui.icons.flame;
        c.innerHTML = '<div class="ob-goal-flames">' + flames + '</div>' +
          '<b>' + g.name + '</b><em>' + g.sub + '</em>';
        c.addEventListener('click', function(){
          self._goal = g.id;
          U.$$('.ob-goal', wrap).forEach(function(x){ x.classList.remove('sel'); });
          c.classList.add('sel');
          VCF.audio.play('select');
          VCF.haptics.tap();
        });
        wrap.appendChild(c);
      });
      next.textContent = 'Continue';
    }

    if (this._step === 3){
      var chosen = Object.keys(this._decks).filter(function(k){ return self._decks[k]; });
      var cardCount = 0;
      (chosen.length ? chosen : Object.keys(VCF.decks)).forEach(function(id){
        cardCount += VCF.decks[id].cards.length;
      });
      var tokens = cardCount * TOKENS_PER_CARD_YR;
      body.innerHTML =
        '<div class="ob-mascot ob-mascot-sm"></div>' +
        '<h1 class="ob-title">Stop paying your AI<br>to <span class="grad-text">guess</span></h1>' +
        '<p class="ob-sub">A vague prompt burns ~5,000 tokens in failed round-trips. Master your ' + cardCount + ' cards and that waste could add up to&hellip;</p>' +
        '<div class="ob-tokens"><span id="obTokenNum">0</span><em>tokens saved a year*</em></div>' +
        '<p class="ob-fine">*rough math: ~2 avoided re-prompts per concept, averaged over a year of building</p>' +
        '<div class="ob-links">Free, no ads, no account &mdash; ' +
          '<button class="ob-link" id="obShare">share it with a friend</button>' +
          (VCF.SUPPORT_URL ? ' or <a class="ob-link" href="' + VCF.SUPPORT_URL + '" target="_blank" rel="noopener">buy us a coffee</a>' : '') +
          ' to keep new decks coming.</div>';
      var m2 = VCF.ui.mascot('happy', 96);
      U.$('.ob-mascot', body).appendChild(m2);
      // count-up (interval, not rAF — survives background tabs)
      var numEl = U.$('#obTokenNum', body);
      var t0 = Date.now(), dur = 1400;
      var timer = setInterval(function(){
        if (!numEl.isConnected){ clearInterval(timer); return; }
        var p = Math.min(1, (Date.now() - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        numEl.textContent = '~' + Math.round(tokens * eased).toLocaleString();
        if (p >= 1) clearInterval(timer);
      }, 30);
      setTimeout(function(){ VCF.audio.play('badge'); }, 1300);
      U.$('#obShare', body).addEventListener('click', function(){ VCF.fx.share(); });
      var donate = U.$('.ob-links a', body);
      if (donate) donate.addEventListener('click', function(){ VCF.shell.noteSupportIntent(); });
      next.textContent = 'Start earning XP';
    }
  },

  finish: function(){
    var s = VCF.store.state;
    var chosen = Object.keys(this._decks).filter(function(k){ return this._decks[k]; }, this);
    var self = this;
    chosen = Object.keys(this._decks).filter(function(k){ return self._decks[k]; });
    s.onboarding = { done: true, decks: chosen, goal: this._goal, at: Date.now() };
    VCF.store.save(true);
    if (chosen.length) VCF.applyDeckOrder(chosen);
    VCF.fx.confetti({ y: 0.4, count: 120 });
    VCF.audio.play('levelup');
    VCF.haptics.success();
    VCF.router.go('/home');
  },

  unmount: function(){ this._el = null; }
};

// Chosen decks float to the front of every deck list.
VCF.applyDeckOrder = function(chosen){
  var rest = VCF.DECK_ORDER.filter(function(id){ return chosen.indexOf(id) === -1; });
  VCF.DECK_ORDER = chosen.concat(rest);
};

VCF.router.register('#/welcome', VCF.screens.onboarding);
})();
