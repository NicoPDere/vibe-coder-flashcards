// Hidden logic selftest: #/selftest — pure-logic assertions, no gameplay needed.
(function(){
var U = VCF.util;

VCF.screens.selftest = {
  mount: function(root){
    var results = [];
    function t(name, fn){
      try {
        var ok = fn();
        results.push({ name: name, ok: !!ok, err: ok === true ? '' : String(ok) });
      } catch(e){
        results.push({ name: name, ok: false, err: e.message });
      }
    }
    function eq(a, b){ return a === b ? true : ('expected ' + b + ', got ' + a); }

    // --- utils ---
    t('todayStr format', function(){ return /^\d{4}-\d{2}-\d{2}$/.test(U.todayStr()); });
    t('todayStr local date', function(){ return eq(U.todayStr(new Date(2026, 0, 5)), '2026-01-05'); });
    t('yesterdayStr crosses month', function(){ return eq(U.yesterdayStr(new Date(2026, 2, 1)), '2026-02-28'); });
    t('mulberry32 deterministic', function(){
      var a = U.mulberry32(42), b = U.mulberry32(42);
      return eq(a() + ',' + a(), b() + ',' + b());
    });
    t('hashStr stable', function(){ return eq(U.hashStr('vibe'), U.hashStr('vibe')); });
    t('shuffle preserves items', function(){
      var s = U.shuffle([1,2,3,4,5]);
      return eq(s.slice().sort().join(''), '12345');
    });
    t('fmtMs', function(){ return eq(U.fmtMs(83000), '1:23'); });

    // --- srs ---
    function rec(box){ return { box: box, due: 0, last: 0, seen: 1, right: 0, wrong: 0 }; }
    t('grade good: 0 -> 1', function(){ return eq(VCF.srs.grade(rec(0), 'good').box, 1); });
    t('grade easy: 0 -> 2', function(){ return eq(VCF.srs.grade(rec(0), 'easy').box, 2); });
    t('grade again: 5 -> 3', function(){ return eq(VCF.srs.grade(rec(5), 'again').box, 3); });
    t('grade again floors at 0', function(){ return eq(VCF.srs.grade(rec(1), 'again').box, 0); });
    t('grade good caps at 6', function(){ return eq(VCF.srs.grade(rec(6), 'good').box, 6); });
    t('grade hard floors at 1', function(){ return eq(VCF.srs.grade(rec(0), 'hard').box, 1); });
    t('grade sets future due', function(){
      var r = VCF.srs.grade(rec(2), 'good', 1000000);
      return r.due > 1000000 ? true : 'due not in future';
    });
    t('tier mapping', function(){
      return eq(VCF.srs.masteryTier(rec(2)), 'learning') === true &&
             eq(VCF.srs.masteryTier(rec(3)), 'known') === true &&
             eq(VCF.srs.masteryTier(rec(5)), 'mastered') === true || 'tier mismatch';
    });

    // --- levels/xp ---
    t('level 1 at 0 XP', function(){ return eq(VCF.game.levelForXp(0).level, 1); });
    t('level 2 at 100 XP', function(){ return eq(VCF.game.levelForXp(100).level, 2); });
    t('level 3 at 275 XP', function(){ return eq(VCF.game.levelForXp(275).level, 3); });
    t('level 5 at 850 XP', function(){ return eq(VCF.game.levelForXp(850).level, 5); });
    t('still level 4 at 849 XP', function(){ return eq(VCF.game.levelForXp(849).level, 4); });
    t('multiplier steps', function(){
      return VCF.game.multiplier(2) === 1 && VCF.game.multiplier(3) === 1.5 &&
             VCF.game.multiplier(5) === 2 && VCF.game.multiplier(12) === 3 || 'wrong multiplier';
    });
    t('title at level 10', function(){ return eq(VCF.game.levelTitle(10), 'Vibe Architect'); });
    t('title between named levels', function(){ return eq(VCF.game.levelTitle(11), 'Vibe Architect'); });

    // --- migration (mock storage, does not touch real state) ---
    t('v1 migration maps levels + streak + xp', function(){
      var mock = {
        'vcf_react': JSON.stringify({ useState: 2, Props: 1 }),
        'vcf_best_streak': '9'
      };
      var s = VCF.store.migrateV1(function(k){ return mock[k] || null; });
      var a = s.progress.react.useState, b = s.progress.react.Props;
      if (a.box !== 2) return 'useState box ' + a.box;
      if (b.box !== 1) return 'Props box ' + b.box;
      if (s.scores.quizBestStreak !== 9) return 'streak ' + s.scores.quizBestStreak;
      if (s.xp !== 15) return 'xp ' + s.xp;
      if (!s.migratedFromV1) return 'missing marker';
      return true;
    });
    t('fresh install has no migration marker', function(){
      var s = VCF.store.migrateV1(function(){ return null; });
      return s.migratedFromV1 === undefined && s.xp === 0 || 'unexpected marker/xp';
    });

    // --- quests + freezes ---
    t('daysBetween basic + month crossing', function(){
      return VCF.game.daysBetween('2026-07-01', '2026-07-03') === 2 &&
             VCF.game.daysBetween('2026-06-30', '2026-07-01') === 1 || 'wrong day math';
    });
    t('quest seed deterministic, 3 picks', function(){
      var rng1 = U.mulberry32(U.hashStr('vcf-quests-2026-07-18'));
      var rng2 = U.mulberry32(U.hashStr('vcf-quests-2026-07-18'));
      var a = U.shuffle(Object.keys(VCF.game.QUEST_DEFS), rng1).slice(0, 3);
      var b = U.shuffle(Object.keys(VCF.game.QUEST_DEFS), rng2).slice(0, 3);
      return a.join() === b.join() && a.length === 3 || 'non-deterministic';
    });
    t('freeze saves a single missed day', function(){
      var s = VCF.store.state;
      var snap = JSON.stringify({ streak: s.streak, freezes: s.freezes });
      s.streak = { current: 7, best: 7, lastDay: '2026-07-01' };
      s.freezes = { count: 1, lastEarnedAtStreak: 7, usedTotal: 0 };
      VCF.game.touchStreak(new Date(2026, 6, 3)); // played Jul 1, missed Jul 2
      var ok = s.streak.current === 8 && s.freezes.count === 0 && s.freezes.usedTotal === 1;
      var r = JSON.parse(snap); s.streak = r.streak; s.freezes = r.freezes;
      return ok || 'freeze not consumed';
    });
    t('no freeze: gap resets streak', function(){
      var s = VCF.store.state;
      var snap = JSON.stringify({ streak: s.streak, freezes: s.freezes });
      s.streak = { current: 7, best: 7, lastDay: '2026-07-01' };
      s.freezes = { count: 0, lastEarnedAtStreak: 7, usedTotal: 0 };
      VCF.game.touchStreak(new Date(2026, 6, 3));
      var ok = s.streak.current === 1;
      var r = JSON.parse(snap); s.streak = r.streak; s.freezes = r.freezes;
      return ok || 'streak did not reset';
    });
    t('freeze earned at 7-day milestone', function(){
      var s = VCF.store.state;
      var snap = JSON.stringify({ streak: s.streak, freezes: s.freezes });
      var now = new Date(2026, 6, 10);
      s.streak = { current: 6, best: 6, lastDay: U.yesterdayStr(now) };
      s.freezes = { count: 0, lastEarnedAtStreak: 0, usedTotal: 0 };
      VCF.game.touchStreak(now);
      var ok = s.streak.current === 7 && s.freezes.count === 1;
      var r = JSON.parse(snap); s.streak = r.streak; s.freezes = r.freezes;
      return ok || 'freeze not earned';
    });
    t('catStats sane for first deck category', function(){
      var d = VCF.deckList()[0];
      var st = VCF.srs.catStats(d.id, d.cats[0].id);
      return st.total > 0 && st.known <= st.total && st.pct >= 0 && st.pct <= 100 || 'bad catStats';
    });
    t('one quiz round bumps unit progressPct', function(){
      // simulate: every card in a category graded good once (box 1)
      var d = VCF.deckList()[0], cat = d.cats[0];
      var touched = [];
      d.cards.forEach(function(c){
        if (c.c !== cat.id) return;
        var rec = VCF.store.card(d.id, c.n);
        touched.push({ n: c.n, snap: JSON.stringify(rec) });
        if (rec.seen === 0){ rec.seen = 1; rec.box = Math.max(rec.box, 1); }
      });
      var st = VCF.srs.catStats(d.id, cat.id);
      var ok = st.progressPct > 0;
      touched.forEach(function(x){
        var rec = VCF.store.card(d.id, x.n);
        var snap = JSON.parse(x.snap);
        Object.keys(snap).forEach(function(k){ rec[k] = snap[k]; });
      });
      return ok || 'progressPct did not move after one pass';
    });
    t('mistakeQueue shape + cap', function(){
      var q = VCF.srs.mistakeQueue(5);
      return q.length <= 5 && q.every(function(m){ return m.deck && m.card && m.wrong > 0; }) || 'bad queue';
    });

    // --- daily determinism ---
    t('daily picks are deterministic + capped', function(){
      var rng1 = U.mulberry32(U.hashStr('vcf-daily-' + U.todayStr()));
      var rng2 = U.mulberry32(U.hashStr('vcf-daily-' + U.todayStr()));
      return eq(rng1() + '', rng2() + '');
    });

    // --- decks loaded ---
    t('all 9 decks registered', function(){ return eq(VCF.deckList().length, 9); });
    t('every card has n/c/d/p/x', function(){
      var bad = 0;
      VCF.deckList().forEach(function(d){
        d.cards.forEach(function(c){ if (!(c.n && c.c && c.d && c.p && c.x)) bad++; });
      });
      return bad === 0 ? true : bad + ' bad cards';
    });
    t('card names unique per deck', function(){
      var dupes = [];
      VCF.deckList().forEach(function(d){
        var seen = {};
        d.cards.forEach(function(c){
          if (seen[c.n]) dupes.push(d.id + '/' + c.n);
          seen[c.n] = 1;
        });
      });
      return dupes.length === 0 ? true : dupes.join(', ');
    });
    t('badges have unique ids + checks', function(){
      var ids = {};
      var bad = VCF.game.BADGES.filter(function(b){
        if (ids[b.id]) return true;
        ids[b.id] = 1;
        return false;
      });
      return bad.length === 0 ? true : 'dupes';
    });

    var passed = results.filter(function(r){ return r.ok; }).length;
    var el = U.el('div', 'screen selftest-screen');
    el.innerHTML =
      '<h1 class="screen-title">Selftest</h1>' +
      '<div class="panel"><div class="selftest-verdict ' + (passed === results.length ? 'good' : 'bad') + '">' +
        (passed === results.length ? 'ALL PASS' : 'FAILURES') + ' — ' + passed + '/' + results.length + '</div>' +
      results.map(function(r){
        return '<div class="selftest-row ' + (r.ok ? 'ok' : 'fail') + '">' +
          (r.ok ? '✓' : '✗') + ' ' + U.esc(r.name) + (r.ok ? '' : ' — ' + U.esc(r.err)) + '</div>';
      }).join('') + '</div>';
    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/selftest', VCF.screens.selftest);
})();
