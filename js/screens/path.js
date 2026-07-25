// Guided path: a deck's categories as an ordered unit trail.
// Unlock rule: first unit is open; each next unit opens when the previous one
// reaches 60% known. 100% known = gold. Tapping a unit starts its quiz.
(function(){
var U = VCF.util;
// One solid pass through a unit (each card answered right once = 33%) unlocks
// the next. Gold/mastery still rewards deeper repetition.
var UNLOCK_PCT = 30;

VCF.screens.path = {
  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }

    var el = U.el('div', 'screen path-screen');
    el.style.setProperty('--accent', deck.color);

    var overall = VCF.srs.deckStats(deck.id);
    el.innerHTML =
      '<div class="deck-head">' +
        '<a class="ghost-btn back-btn" href="#/deck/' + deck.id + '">' + VCF.ui.icons.back + '</a>' +
        '<div class="deck-head-icon">' + deck.icon + '</div>' +
        '<div class="deck-head-text">' +
          '<h1 style="color:' + deck.color + '">' + U.esc(deck.name) + '</h1>' +
          '<p>Guided path · ' + overall.known + '/' + overall.total + ' known</p>' +
        '</div>' +
      '</div>' +
      '<div class="path-trail"></div>';

    var trail = U.$('.path-trail', el);
    var prevPct = 100; // first unit always unlocked

    deck.cats.forEach(function(cat, i){
      var st = VCF.srs.catStats(deck.id, cat.id);
      var unlocked = i === 0 || prevPct >= UNLOCK_PCT;
      var gold = st.progressPct === 100;
      var state = gold ? 'gold' : unlocked ? 'open' : 'locked';
      var prevLabel = i > 0 ? deck.cats[i - 1].label : '';

      var node = U.el('button', 'path-node ' + state);
      node.style.setProperty('--nc', cat.color || deck.color);
      node.style.animationDelay = (i * 0.07) + 's';
      var sub = gold ? st.known + '/' + st.total + ' known · unit gold!'
        : !unlocked ? st.known + '/' + st.total + ' known · locked'
        : st.progressPct > 0 ? st.known + '/' + st.total + ' known · ' + st.progressPct + '% learned'
        : st.total + ' cards · start here';
      node.innerHTML =
        '<div class="path-ring">' +
          VCF.ui.ring(st.progressPct, 62, gold ? '#ffd93d' : (cat.color || deck.color), st.progressPct + '%') +
          (state === 'locked' ? '<div class="path-lock">' + VCF.ui.icons.close + '</div>' : '') +
          (gold ? '<div class="path-crown">' + VCF.ui.icons.trophy + '</div>' : '') +
        '</div>' +
        '<div class="path-info">' +
          '<b>' + U.esc(cat.label) + '</b>' +
          '<em>' + sub + '</em>' +
        '</div>' +
        '<div class="path-go">' + (unlocked ? VCF.ui.icons.play : '') + '</div>';

      node.addEventListener('click', function(){
        if (!unlocked){
          VCF.fx.toast('Finish the <b>' + U.esc(prevLabel) + '</b> quiz to unlock this unit');
          VCF.haptics.fail();
          return;
        }
        VCF.router.go('/deck/' + deck.id + '/unit/' + encodeURIComponent(cat.id));
      });

      trail.appendChild(node);
      // Gate on the SAME metric the ring shows, or it looks unlocked while
      // secretly requiring extra passes.
      prevPct = st.progressPct;
    });

    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/deck/:id/path', VCF.screens.path);
})();
