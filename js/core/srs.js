// SRS-lite: Leitner boxes 0-6 with graded steps. Pure logic, no DOM.
(function(){
var MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
// interval to next review, per box
var INTERVALS = [0, 10 * MIN, 4 * HOUR, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];

VCF.srs = {
  INTERVALS: INTERVALS,

  // rating: 'again' | 'hard' | 'good' | 'easy'
  grade: function(rec, rating, now, rng){
    now = now || Date.now();
    var box = rec.box || 0;
    if (rating === 'again'){ box = Math.max(0, box - 2); rec.wrong++; }
    else if (rating === 'hard'){ box = Math.max(1, box); }
    else if (rating === 'good'){ box = Math.min(6, box + 1); rec.right++; }
    else if (rating === 'easy'){ box = Math.min(6, box + 2); rec.right++; }
    rec.box = box;
    rec.seen++;
    rec.last = now;
    var iv = INTERVALS[box];
    if (rating === 'hard') iv = iv * 0.5;
    var jitter = 0.9 + 0.2 * (rng || Math.random)(); // spread due times so reviews don't pile up
    rec.due = now + Math.round(iv * jitter);
    return rec;
  },

  // Gentle reinforcement (match game): bump floor to box 1, no scheduling change.
  nudge: function(rec){
    rec.box = Math.max(rec.box || 0, 1);
    rec.seen++;
    return rec;
  },

  masteryTier: function(rec){
    if (!rec || rec.seen === 0) return 'new';
    if (rec.box <= 2) return 'learning';
    if (rec.box <= 4) return 'known';
    return 'mastered';
  },

  // Cards with due <= now (sorted oldest-due first), then unseen fill. deckId null = all decks.
  dueQueue: function(deckId, limit, now){
    now = now || Date.now();
    limit = limit || 20;
    var due = [], fresh = [];
    var decks = deckId ? [VCF.decks[deckId]] : VCF.deckList();
    decks.forEach(function(deck){
      if (!deck) return;
      deck.cards.forEach(function(card){
        var rec = VCF.store.peek(deck.id, card.n);
        if (rec && rec.seen > 0){
          if (rec.due <= now) due.push({ deck: deck, card: card, due: rec.due });
        } else {
          fresh.push({ deck: deck, card: card });
        }
      });
    });
    due.sort(function(a, b){ return a.due - b.due; });
    var out = due.slice(0, limit);
    if (out.length < limit){
      out = out.concat(VCF.util.shuffle(fresh).slice(0, limit - out.length));
    }
    return out;
  },

  dueCount: function(deckId, now){
    now = now || Date.now();
    var n = 0;
    var decks = deckId ? [VCF.decks[deckId]] : VCF.deckList();
    decks.forEach(function(deck){
      if (!deck) return;
      deck.cards.forEach(function(card){
        var rec = VCF.store.peek(deck.id, card.n);
        if (rec && rec.seen > 0 && rec.due <= now) n++;
      });
    });
    return n;
  },

  // Cards the user keeps getting wrong — the "Fix your mistakes" queue.
  mistakeQueue: function(limit){
    limit = limit || 15;
    var out = [];
    VCF.deckList().forEach(function(deck){
      deck.cards.forEach(function(card){
        var rec = VCF.store.peek(deck.id, card.n);
        if (rec && rec.wrong > 0 && rec.box < 5){
          out.push({ deck: deck, card: card, wrong: rec.wrong, box: rec.box });
        }
      });
    });
    out.sort(function(a, b){ return (b.wrong - a.wrong) || (a.box - b.box); });
    return out.slice(0, limit);
  },

  // Per-category stats inside a deck — drives the guided path.
  catStats: function(deckId, catId){
    var deck = VCF.decks[deckId];
    var total = 0, known = 0, mastered = 0;
    if (deck) deck.cards.forEach(function(card){
      if (card.c !== catId) return;
      total++;
      var rec = VCF.store.peek(deckId, card.n);
      if (rec && rec.seen > 0){
        if (rec.box >= 3) known++;
        if (rec.box >= 5) mastered++;
      }
    });
    return { total: total, known: known, mastered: mastered,
             pct: total ? Math.round(known / total * 100) : 0 };
  },

  // Deck stats for progress UI. known = box>=3, mastered = box>=5.
  deckStats: function(deckId){
    var deck = VCF.decks[deckId];
    var total = deck ? deck.cards.length : 0;
    var known = 0, mastered = 0, seen = 0;
    if (deck) deck.cards.forEach(function(card){
      var rec = VCF.store.peek(deckId, card.n);
      if (!rec || rec.seen === 0) return;
      seen++;
      if (rec.box >= 3) known++;
      if (rec.box >= 5) mastered++;
    });
    return { total: total, seen: seen, known: known, mastered: mastered,
             pct: total ? Math.round(known / total * 100) : 0 };
  },

  totals: function(){
    var t = { total: 0, seen: 0, known: 0, mastered: 0 };
    VCF.deckList().forEach(function(deck){
      var s = VCF.srs.deckStats(deck.id);
      t.total += s.total; t.seen += s.seen; t.known += s.known; t.mastered += s.mastered;
    });
    return t;
  }
};
})();
