// Guided path: a deck's categories as an ordered unit trail.
// Unlock rule: first unit is open; each next unit opens when the previous one
// reaches 60% known. 100% known = gold. Tapping a unit starts its quiz.
(function(){
var U = VCF.util;
var UNLOCK_PCT = 60;

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
      var gold = st.pct === 100;
      var state = gold ? 'gold' : unlocked ? 'open' : 'locked';
      var prevLabel = i > 0 ? deck.cats[i - 1].label : '';

      var node = U.el('button', 'path-node ' + state);
      node.style.setProperty('--nc', cat.color || deck.color);
      node.style.animationDelay = (i * 0.07) + 's';
      node.innerHTML =
        '<div class="path-ring">' +
          VCF.ui.ring(st.pct, 62, gold ? '#ffd93d' : (cat.color || deck.color), st.pct + '%') +
          (state === 'locked' ? '<div class="path-lock">' + VCF.ui.icons.close + '</div>' : '') +
          (gold ? '<div class="path-crown">' + VCF.ui.icons.trophy + '</div>' : '') +
        '</div>' +
        '<div class="path-info">' +
          '<b>' + U.esc(cat.label) + '</b>' +
          '<em>' + st.known + '/' + st.total + ' known' +
            (gold ? ' · unit gold!' : unlocked ? '' : ' · locked') + '</em>' +
        '</div>' +
        '<div class="path-go">' + (unlocked ? VCF.ui.icons.play : '') + '</div>';

      node.addEventListener('click', function(){
        if (!unlocked){
          VCF.fx.toast('Reach ' + UNLOCK_PCT + '% in <b>' + U.esc(prevLabel) + '</b> to unlock this unit');
          VCF.haptics.fail();
          return;
        }
        VCF.router.go('/deck/' + deck.id + '/unit/' + encodeURIComponent(cat.id));
      });

      trail.appendChild(node);
      prevPct = st.pct;
    });

    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/deck/:id/path', VCF.screens.path);
})();
