// Persistent state: single localStorage blob ('vcf2') + v1 migration.
(function(){
var U = VCF.util;
var KEY = 'vcf2';
var V1_DECKS = ['swiftui','sql','python','css','react'];

function defaultState(){
  var now = Date.now();
  return {
    v: 2,
    createdAt: now,
    updatedAt: now,
    xp: 0,
    settings: { sound: true, haptics: true, reducedFx: false },
    streak: { current: 0, best: 0, lastDay: null },
    daysActive: {},            // 'YYYY-MM-DD' -> xp earned that day
    daily: { date: null, done: false, score: 0, completions: 0, perfects: 0 },
    scores: { quizBestStreak: 0, speedBestKnown: 0, matchBestMs: null, matchNoMistakeWins: 0 },
    counters: { quizAnswers: 0, quizCorrect: 0, swipes: 0, roundsByDeck: {}, sessionsByHour: {} },
    badges: {},                 // badgeId -> unlock timestamp
    supported: null,            // timestamp of first support-link tap
    onboarding: { done: false },
    progress: {}                // deckId -> { cardName -> {box,due,last,seen,right,wrong} }
  };
}

var saveTimer = null;

VCF.store = {
  state: null,

  load: function(){
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch(e){}
    if (raw){
      try {
        var s = JSON.parse(raw);
        if (s && s.v === 2){ VCF.store.state = VCF.store._fill(s); return VCF.store.state; }
      } catch(e){ console.error('vcf2 parse failed, starting fresh', e); }
    }
    VCF.store.state = VCF.store.migrateV1(function(k){
      try { return localStorage.getItem(k); } catch(e){ return null; }
    });
    VCF.store.save(true);
    return VCF.store.state;
  },

  // Ensure newly-added fields exist on older v2 blobs.
  _fill: function(s){
    var d = defaultState();
    Object.keys(d).forEach(function(k){ if (s[k] == null) s[k] = d[k]; });
    Object.keys(d.settings).forEach(function(k){ if (s.settings[k] == null) s.settings[k] = d.settings[k]; });
    Object.keys(d.counters).forEach(function(k){ if (s.counters[k] == null) s.counters[k] = d.counters[k]; });
    Object.keys(d.scores).forEach(function(k){ if (s.scores[k] === undefined) s.scores[k] = d.scores[k]; });
    return s;
  },

  // Build a fresh v2 state, importing any v1 progress found via `getItem`.
  // v1 keys are read but never deleted (cheap rollback safety).
  migrateV1: function(getItem){
    var s = defaultState();
    var now = Date.now();
    var migrated = 0, knownCards = 0;
    V1_DECKS.forEach(function(deckId){
      var raw = getItem('vcf_' + deckId);
      if (!raw) return;
      var v1;
      try { v1 = JSON.parse(raw); } catch(e){ return; }
      if (!v1 || typeof v1 !== 'object') return;
      Object.keys(v1).forEach(function(name){
        var lvl = v1[name];
        if (typeof lvl !== 'number' || lvl < 1) return;
        var box = lvl >= 2 ? 2 : 1;
        s.progress[deckId] = s.progress[deckId] || {};
        s.progress[deckId][name] = {
          box: box, due: now, last: now,
          seen: 1, right: lvl >= 2 ? 1 : 0, wrong: 0
        };
        migrated++;
        if (box >= 2) knownCards++;
      });
    });
    var v1Streak = parseInt(getItem('vcf_best_streak') || '0', 10) || 0;
    s.scores.quizBestStreak = v1Streak;
    if (migrated > 0){
      s.xp = 15 * knownCards; // retroactive XP so returning users don't restart at level 1
      s.migratedFromV1 = { at: now, cards: migrated, bestStreak: v1Streak };
    }
    return s;
  },

  save: function(immediate){
    if (saveTimer){ clearTimeout(saveTimer); saveTimer = null; }
    if (immediate) return VCF.store._flush();
    saveTimer = setTimeout(VCF.store._flush, 250);
  },

  _flush: function(){
    saveTimer = null;
    if (!VCF.store.state) return;
    // Freshness guard: a stale tab (background window, bfcache restore) must
    // never clobber progress written more recently by another instance.
    try {
      var cur = JSON.parse(localStorage.getItem(KEY));
      if (cur && cur.v === 2 && cur.updatedAt > (VCF.store.state.updatedAt || 0)){
        VCF.store.state = VCF.store._fill(cur);
        return;
      }
    } catch(e){}
    VCF.store.state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(VCF.store.state)); }
    catch(e){ console.error('save failed', e); }
  },

  // Get-or-create the progress record for one card.
  card: function(deckId, name){
    var s = VCF.store.state;
    s.progress[deckId] = s.progress[deckId] || {};
    var rec = s.progress[deckId][name];
    if (!rec){
      rec = { box: 0, due: 0, last: 0, seen: 0, right: 0, wrong: 0 };
      s.progress[deckId][name] = rec;
    }
    return rec;
  },

  peek: function(deckId, name){
    var p = VCF.store.state.progress[deckId];
    return p ? p[name] : null;
  },

  exportJson: function(){ return JSON.stringify(VCF.store.state); },

  importJson: function(str){
    var s = JSON.parse(str); // caller catches
    if (!s || s.v !== 2 || typeof s.progress !== 'object') throw new Error('Not a valid backup');
    VCF.store.state = VCF.store._fill(s);
    VCF.store.save(true);
    return true;
  },

  resetAll: function(){
    VCF.store.state = defaultState();
    VCF.store.save(true);
  },

  _defaultState: defaultState // exposed for selftest
};

// iOS never reliably fires beforeunload — flush on hide instead.
document.addEventListener('visibilitychange', function(){
  if (document.visibilityState === 'hidden') VCF.store._flush();
});
window.addEventListener('pagehide', function(){ VCF.store._flush(); });
})();
