// Daily challenge: 10 cards picked deterministically from today's date,
// spread across decks (max 2 per deck). First completion of the day = +100 XP.
(function(){
var U = VCF.util;
var SIZE = 10, MAX_PER_DECK = 2;

function todaysItems(){
  var rng = U.mulberry32(U.hashStr('vcf-daily-' + U.todayStr()));
  var perDeck = {};
  var pool = [];
  VCF.deckList().forEach(function(deck){
    var cards = U.shuffle(deck.cards, rng);
    cards.forEach(function(c, i){ pool.push({ deck: deck, card: c, order: rng() }); });
  });
  pool.sort(function(a, b){ return a.order - b.order; });
  var out = [];
  for (var i = 0; i < pool.length && out.length < SIZE; i++){
    var it = pool[i];
    var n = perDeck[it.deck.id] || 0;
    if (n >= MAX_PER_DECK) continue;
    perDeck[it.deck.id] = n + 1;
    out.push({ deck: it.deck, card: it.card });
  }
  return out;
}

VCF.games.daily = {
  mount: function(root){
    var s = VCF.store.state;
    var today = U.todayStr();
    var firstToday = !(s.daily.date === today && s.daily.done);

    VCF.games.quiz.run(root, {
      items: todaysItems(),
      accent: '#ffd93d',
      title: 'Daily Challenge',
      event: 'daily-round',
      bonus: function(stats){
        if (firstToday){
          s.daily.date = today;
          s.daily.done = true;
          s.daily.score = stats.score;
          s.daily.completions++;
          if (stats.score === stats.total) s.daily.perfects++;
          VCF.store.save();
          return { xp: 100, subtitle: 'Daily complete! +100 XP bonus' };
        }
        return { xp: 0, subtitle: 'Practice run — bonus already claimed today' };
      },
      onAgain: function(rootEl){
        rootEl.innerHTML = '';
        VCF.games.daily.mount(rootEl);
      }
    });
  },
  unmount: function(){}
};

VCF.router.register('#/daily', VCF.games.daily);
})();
