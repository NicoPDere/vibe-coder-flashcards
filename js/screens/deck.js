// Deck browse: header + mode launchers + search + category pills + card grid.
(function(){
var U = VCF.util;

VCF.screens.deck = {
  _deck: null,
  _cat: 'all',
  _query: '',

  mount: function(root, params){
    var deck = VCF.decks[params.id];
    if (!deck){ VCF.router.go('/home'); return; }
    this._deck = deck;
    this._cat = 'all';
    this._query = '';

    var stats = VCF.srs.deckStats(deck.id);
    var el = U.el('div', 'screen deck-screen');
    el.style.setProperty('--accent', deck.color);
    el.innerHTML =
      '<div class="deck-head">' +
        '<a class="ghost-btn back-btn" href="#/home">' + VCF.ui.icons.back + '</a>' +
        '<div class="deck-head-icon">' + deck.icon + '</div>' +
        '<div class="deck-head-text">' +
          '<h1 style="color:' + deck.color + '">' + U.esc(deck.name) + '</h1>' +
          '<p>' + U.esc(deck.tagline) + '</p>' +
          '<div class="deck-progress">' +
            '<div class="bar"><div class="bar-fill" style="width:' + stats.pct + '%;background:' + deck.color + '"></div></div>' +
            '<span>' + stats.known + '/' + stats.total + ' known · ' + stats.mastered + ' mastered</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="mode-row">' +
        '<a class="mode-card" href="#/deck/' + deck.id + '/quiz">' + VCF.ui.icons.bolt + '<span>Quiz</span></a>' +
        '<a class="mode-card" href="#/deck/' + deck.id + '/speed">' + VCF.ui.icons.timer + '<span>Speed</span></a>' +
        '<a class="mode-card" href="#/deck/' + deck.id + '/swipe">' + VCF.ui.icons.swipe + '<span>Swipe</span></a>' +
        '<a class="mode-card" href="#/deck/' + deck.id + '/match">' + VCF.ui.icons.grid + '<span>Match</span></a>' +
      '</div>' +

      '<div class="browse-tools">' +
        '<div class="search-box">' + VCF.ui.icons.search + '<input type="search" placeholder="Search ' + deck.cards.length + ' cards…" id="deckSearch"></div>' +
        '<div class="cat-pills" id="catPills"></div>' +
        '<div class="count-badge" id="countBadge"></div>' +
      '</div>' +
      '<div class="card-grid" id="cardGrid"></div>';

    root.appendChild(el);
    this._el = el;

    var self = this;
    U.$('#deckSearch', el).addEventListener('input', function(){
      self._query = this.value;
      self.renderGrid();
    });

    this.renderPills();
    this.renderGrid();
  },

  renderPills: function(){
    var self = this, deck = this._deck;
    var host = U.$('#catPills', this._el);
    var cats = [{ id: 'all', label: 'All', color: '#8a8fa3' }].concat(deck.cats);
    host.innerHTML = cats.map(function(c){
      var active = c.id === self._cat;
      var style = active ? 'background:' + c.color + '26;border-color:' + c.color + '66;color:' + c.color : '';
      return '<button class="pill' + (active ? ' active' : '') + '" data-cat="' + c.id + '" style="' + style + '">' + U.esc(c.label) + '</button>';
    }).join('');
    U.$$('.pill', host).forEach(function(b){
      b.addEventListener('click', function(){
        self._cat = b.dataset.cat;
        self.renderPills();
        self.renderGrid();
      });
    });
  },

  filtered: function(){
    var deck = this._deck, cat = this._cat, q = this._query.trim().toLowerCase();
    var items = deck.cards;
    if (cat !== 'all') items = items.filter(function(c){ return c.c === cat; });
    if (q){
      items = items.filter(function(c){
        return c.n.toLowerCase().indexOf(q) > -1 || c.d.toLowerCase().indexOf(q) > -1 ||
               c.p.toLowerCase().indexOf(q) > -1 || c.x.toLowerCase().indexOf(q) > -1;
      });
    }
    return items;
  },

  renderGrid: function(){
    var deck = this._deck;
    var grid = U.$('#cardGrid', this._el);
    var items = this.filtered();
    U.$('#countBadge', this._el).textContent = items.length + ' card' + (items.length === 1 ? '' : 's');
    grid.innerHTML = '';
    if (!items.length){
      grid.innerHTML = '<div class="no-results">No cards match. Try another search.</div>';
      return;
    }
    var frag = document.createDocumentFragment();
    items.forEach(function(card, i){
      var node = VCF.ui.flashcard(deck, card);
      node.style.animationDelay = Math.min(i * 0.03, 0.5) + 's';
      frag.appendChild(node);
    });
    grid.appendChild(frag);
  },

  unmount: function(){ this._el = null; this._deck = null; }
};

VCF.router.register('#/deck/:id', VCF.screens.deck);
})();
