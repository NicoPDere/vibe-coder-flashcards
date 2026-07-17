// Home: greeting + mascot, daily challenge, smart review, deck grid.
(function(){
var U = VCF.util;

function greeting(){
  var h = new Date().getHours();
  if (h < 5) return 'Late night vibes';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

VCF.screens.home = {
  mount: function(root){
    var s = VCF.store.state;
    var t = VCF.srs.totals();
    var due = VCF.srs.dueCount(null);
    var dailyDone = s.daily.date === U.todayStr() && s.daily.done;
    var streak = VCF.game.currentStreak();

    var el = U.el('div', 'screen home-screen');
    el.innerHTML =
      '<div class="home-hero">' +
        '<div class="home-hero-mascot"></div>' +
        '<div class="home-hero-text">' +
          '<div class="home-greet">' + greeting() + '</div>' +
          '<h1>Vibe Coder<br>Flashcards</h1>' +
          '<div class="home-sub">' + t.known + ' of ' + t.total + ' cards known</div>' +
        '</div>' +
      '</div>' +

      '<div class="action-cards">' +
        '<a class="action-card daily-card' + (dailyDone ? ' done' : '') + '" href="#/daily">' +
          '<div class="action-icn">' + VCF.ui.icons.trophy + '</div>' +
          '<div class="action-text">' +
            '<div class="action-name">Daily Challenge</div>' +
            '<div class="action-sub">' + (dailyDone
              ? 'Done — ' + s.daily.score + '/10 today. Back tomorrow!'
              : '10 mixed cards · +100 XP bonus') + '</div>' +
          '</div>' +
          '<div class="action-go">' + VCF.ui.icons.play + '</div>' +
        '</a>' +
        '<a class="action-card review-card" href="#/review">' +
          '<div class="action-icn">' + VCF.ui.icons.swipe + '</div>' +
          '<div class="action-text">' +
            '<div class="action-name">Smart Review</div>' +
            '<div class="action-sub">' + (due
              ? due + ' card' + (due === 1 ? '' : 's') + ' due — swipe through them'
              : 'Nothing due. Swipe some new cards?') + '</div>' +
          '</div>' +
          '<div class="action-go">' + VCF.ui.icons.play + '</div>' +
        '</a>' +
      '</div>' +

      '<h2 class="section-title">Decks</h2>' +
      '<div class="deck-grid"></div>' +

      '<div class="home-footer">Tap a deck to browse, flip to learn, play to remember.</div>';

    var hm = VCF.ui.mascot(streak >= 3 ? 'hype' : 'idle', 96);
    U.$('.home-hero-mascot', el).appendChild(hm);
    setTimeout(function(){ VCF.ui.mascotReact(hm, 'hop'); }, 500);

    var grid = U.$('.deck-grid', el);
    VCF.deckList().forEach(function(deck, i){
      var tile = VCF.ui.deckTile(deck);
      tile.style.animationDelay = (i * 0.06) + 's';
      grid.appendChild(tile);
    });

    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/home', VCF.screens.home);
})();
