// Stats: level ring, totals, streak calendar, per-deck mastery, badges, records.
(function(){
var U = VCF.util;

function calendarCells(){
  // Last 35 days, oldest first, aligned into a 7-wide grid.
  var s = VCF.store.state;
  var cells = [];
  var d = new Date();
  d.setDate(d.getDate() - 34);
  for (var i = 0; i < 35; i++){
    var key = U.todayStr(d);
    var xp = s.daysActive[key] || 0;
    var heat = xp === 0 ? 0 : xp < 50 ? 1 : xp < 150 ? 2 : 3;
    cells.push('<div class="cal-cell heat-' + heat + '" title="' + key + (xp ? ' · ' + xp + ' XP' : '') + '"></div>');
    d.setDate(d.getDate() + 1);
  }
  return cells.join('');
}

VCF.screens.stats = {
  mount: function(root){
    var s = VCF.store.state;
    var lv = VCF.game.levelForXp(s.xp);
    var t = VCF.srs.totals();
    var streak = VCF.game.currentStreak();
    var acc = s.counters.quizAnswers ? Math.round(s.counters.quizCorrect / s.counters.quizAnswers * 100) : 0;

    var el = U.el('div', 'screen stats-screen');
    el.innerHTML =
      '<div class="stats-head"><h1 class="screen-title">Your stats</h1>' +
      '<button class="ghost-btn" id="btnShareStats">' + VCF.ui.icons.share + '<span>Share</span></button></div>' +

      '<div class="panel level-panel">' +
        '<div class="level-ring">' + VCF.ui.ring(Math.round(lv.into / lv.need * 100), 92, '#9d7bff', 'Lv ' + lv.level) + '</div>' +
        '<div class="level-info">' +
          '<div class="level-name">' + U.esc(VCF.game.levelTitle(lv.level)) + '</div>' +
          '<div class="level-xp">' + lv.into + ' / ' + lv.need + ' XP to level ' + (lv.level + 1) + '</div>' +
          '<div class="level-total">' + s.xp + ' XP lifetime</div>' +
        '</div>' +
      '</div>' +

      '<div class="stat-tiles">' +
        '<div class="stat-tile"><div class="st-num" style="color:#ff9f43">' + streak + '</div><div class="st-label">Day streak</div></div>' +
        '<div class="stat-tile"><div class="st-num" style="color:#57c7ff">' + t.known + '</div><div class="st-label">Known</div></div>' +
        '<div class="stat-tile"><div class="st-num" style="color:#4dd08c">' + t.mastered + '</div><div class="st-label">Mastered</div></div>' +
        '<div class="stat-tile"><div class="st-num" style="color:#ffd93d">' + acc + '%</div><div class="st-label">Quiz accuracy</div></div>' +
      '</div>' +

      '<div class="panel tokens-panel">' +
        '<div class="set-text"><div class="set-label">~' + (t.known * 4200).toLocaleString() + ' tokens/year saved</div>' +
        '<div class="set-sub">Rough math: every known concept skips ~2 failed AI round-trips</div></div>' +
      '</div>' +

      '<h2 class="section-title">Last 5 weeks</h2>' +
      '<div class="panel"><div class="cal-grid">' + calendarCells() + '</div>' +
      '<div class="cal-legend"><span>less</span><div class="cal-cell heat-0"></div><div class="cal-cell heat-1"></div><div class="cal-cell heat-2"></div><div class="cal-cell heat-3"></div><span>more</span></div></div>' +

      '<h2 class="section-title">Decks</h2>' +
      '<div class="panel deck-bars"></div>' +

      '<h2 class="section-title">Badges <span class="dim" id="badgeCount"></span></h2>' +
      '<div class="badge-wall"></div>' +

      '<h2 class="section-title">Records</h2>' +
      '<div class="panel records">' +
        '<div class="rec-row"><span>Best quiz combo</span><b>×' + s.scores.quizBestStreak + '</b></div>' +
        '<div class="rec-row"><span>Speed round best</span><b>' + s.scores.speedBestKnown + ' known</b></div>' +
        '<div class="rec-row"><span>Fastest match</span><b>' + (s.scores.matchBestMs != null ? U.fmtMs(s.scores.matchBestMs) : '—') + '</b></div>' +
        '<div class="rec-row"><span>Daily challenges</span><b>' + s.daily.completions + ' done · ' + s.daily.perfects + ' perfect</b></div>' +
        '<div class="rec-row"><span>Lifetime swipes</span><b>' + s.counters.swipes + '</b></div>' +
      '</div>';

    var bars = U.$('.deck-bars', el);
    VCF.deckList().forEach(function(deck){
      var st = VCF.srs.deckStats(deck.id);
      var row = U.el('div', 'deck-bar-row');
      row.innerHTML =
        '<div class="deck-bar-head"><span style="color:' + deck.color + '">' + U.esc(deck.name) + '</span>' +
        '<span class="dim">' + st.known + '/' + st.total + '</span></div>' +
        '<div class="bar"><div class="bar-fill" style="width:' + st.pct + '%;background:linear-gradient(90deg,' + deck.gradient[0] + ',' + deck.gradient[1] + ')"></div></div>';
      bars.appendChild(row);
    });

    var wall = U.$('.badge-wall', el);
    var earned = 0;
    VCF.game.BADGES.forEach(function(b){
      var got = !!s.badges[b.id];
      if (got) earned++;
      var chip = U.el('div', 'badge-chip' + (got ? ' earned' : ''));
      chip.innerHTML = '<div class="badge-art' + (got ? ' unlocked' : '') + '">' + b.icon + '</div>' +
        '<div class="badge-chip-name">' + U.esc(b.name) + '</div>' +
        '<div class="badge-chip-desc">' + U.esc(b.desc) + '</div>';
      wall.appendChild(chip);
    });
    U.$('#badgeCount', el).textContent = earned + '/' + VCF.game.BADGES.length;

    U.$('#btnShareStats', el).addEventListener('click', function(){
      VCF.fx.share('I am level ' + lv.level + ' "' + VCF.game.levelTitle(lv.level) + '" with a ' +
        streak + '-day streak and ' + t.known + ' cards known on Vibe Coder Flashcards.');
    });

    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/stats', VCF.screens.stats);
})();
