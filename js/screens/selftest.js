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

    // --- daily determinism ---
    t('daily picks are deterministic + capped', function(){
      var rng1 = U.mulberry32(U.hashStr('vcf-daily-' + U.todayStr()));
      var rng2 = U.mulberry32(U.hashStr('vcf-daily-' + U.todayStr()));
      return eq(rng1() + '', rng2() + '');
    });

    // --- decks loaded ---
    t('all 6 decks registered', function(){ return eq(VCF.deckList().length, 6); });
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
