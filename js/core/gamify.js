// XP, levels, daily streak, combo multiplier, badges.
(function(){
var U = VCF.util;

// XP needed to go from level L to L+1
function levelCost(L){ return 100 + (L - 1) * 75; }

function levelForXp(xp){
  var lvl = 1, need = levelCost(1), acc = 0;
  while (xp >= acc + need){
    acc += need;
    lvl++;
    need = levelCost(lvl);
  }
  return { level: lvl, into: xp - acc, need: need };
}

var TITLES = [
  [1,'Fresh Install'], [2,'Curious Clicker'], [3,'Tab Hoarder'], [4,'Prompt Apprentice'],
  [5,'Copy-Paste Cadet'], [6,'Bug Whisperer'], [7,'Merge Conflict Survivor'], [8,'Flow State Finder'],
  [9,'Ship-It Sorcerer'], [10,'Vibe Architect'], [12,'Refactor Ranger'], [14,'Token Tamer'],
  [16,'Context Window Wizard'], [18,'Prompt Poet'], [20,'Latent Space Legend'],
  [25,'Singularity Adjacent'], [30,'The Compiler']
];
function levelTitle(level){
  var t = TITLES[0][1];
  for (var i = 0; i < TITLES.length; i++){
    if (level >= TITLES[i][0]) t = TITLES[i][1]; else break;
  }
  if (level > 30) t = 'The Compiler ★' + (level - 30);
  return t;
}

function bi(inner){ return '<svg viewBox="0 0 48 48" fill="none">' + inner + '</svg>'; }
var BADGES = [
  { id:'first-steps', name:'First Steps', desc:'Complete your first quiz round',
    icon: bi('<path d="M14 34c0-8 4-18 10-18s10 10 10 18" stroke="currentColor" stroke-width="2.5" opacity=".8"/><circle cx="24" cy="12" r="4" fill="currentColor" opacity=".6"/>') },
  { id:'combo-10', name:'Combo Machine', desc:'Hit a 10× answer streak in one quiz',
    icon: bi('<path d="M24 6l4 12h12l-10 8 4 14-10-9-10 9 4-14-10-8h12z" fill="currentColor" opacity=".55"/>') },
  { id:'speedster', name:'Speedster', desc:'20+ cards known in one speed round',
    icon: bi('<path d="M26 6L12 28h10l-4 14 16-24H24z" fill="currentColor" opacity=".65"/>') },
  { id:'deck-master', name:'Deck Master', desc:'Every card in a deck at Known or better',
    icon: bi('<rect x="10" y="14" width="22" height="28" rx="4" stroke="currentColor" stroke-width="2" opacity=".4"/><rect x="16" y="8" width="22" height="28" rx="4" fill="currentColor" opacity=".35"/><path d="M22 22l4 4 8-8" stroke="#fff" stroke-width="2.5" opacity=".9"/>') },
  { id:'week-streak', name:'On Fire', desc:'7-day study streak',
    icon: bi('<path d="M24 4c2 8 12 10 12 22a12 12 0 01-24 0c0-6 4-8 6-14 2 4 4 5 6 4-1-4 0-8 0-12z" fill="currentColor" opacity=".6"/>') },
  { id:'month-streak', name:'Eternal Flame', desc:'30-day study streak',
    icon: bi('<path d="M24 4c2 8 12 10 12 22a12 12 0 01-24 0c0-6 4-8 6-14 2 4 4 5 6 4-1-4 0-8 0-12z" fill="currentColor" opacity=".8"/><circle cx="24" cy="30" r="6" fill="#fff" opacity=".5"/>') },
  { id:'night-owl', name:'Night Owl', desc:'Finish a round between midnight and 5am',
    icon: bi('<path d="M32 8a16 16 0 108 22A14 14 0 0132 8z" fill="currentColor" opacity=".55"/><circle cx="34" cy="14" r="1.5" fill="currentColor"/><circle cx="40" cy="20" r="1" fill="currentColor"/>') },
  { id:'early-bird', name:'Early Bird', desc:'Finish a round between 5am and 8am',
    icon: bi('<circle cx="24" cy="30" r="10" fill="currentColor" opacity=".55"/><path d="M6 34h36M10 26l3 3M38 26l-3 3M24 14v4" stroke="currentColor" stroke-width="2" opacity=".5"/>') },
  { id:'tourist', name:'Deck Tourist', desc:'Play a round in all 6 decks',
    icon: bi('<circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2" opacity=".4"/><path d="M8 24h32M24 8c6 6 6 26 0 32-6-6-6-26 0-32z" stroke="currentColor" stroke-width="1.5" opacity=".5"/>') },
  { id:'daily-devotee', name:'Daily Devotee', desc:'Complete 10 daily challenges',
    icon: bi('<rect x="8" y="10" width="32" height="30" rx="4" stroke="currentColor" stroke-width="2" opacity=".4"/><path d="M8 18h32M16 6v8M32 6v8" stroke="currentColor" stroke-width="2" opacity=".4"/><path d="M17 28l5 5 9-9" stroke="currentColor" stroke-width="2.5" opacity=".8"/>') },
  { id:'perfect-day', name:'Perfect Day', desc:'Score 10/10 on a daily challenge',
    icon: bi('<circle cx="24" cy="24" r="15" stroke="currentColor" stroke-width="2.5" opacity=".5"/><circle cx="24" cy="24" r="8" fill="currentColor" opacity=".6"/>') },
  { id:'matchmaker', name:'Matchmaker', desc:'Win a match game with zero mistakes',
    icon: bi('<rect x="8" y="12" width="14" height="24" rx="3" fill="currentColor" opacity=".4"/><rect x="26" y="12" width="14" height="24" rx="3" fill="currentColor" opacity=".6"/><path d="M22 24h4" stroke="#fff" stroke-width="2"/>') },
  { id:'swipe-100', name:'Swipe Right', desc:'100 lifetime review swipes',
    icon: bi('<rect x="12" y="8" width="24" height="32" rx="4" stroke="currentColor" stroke-width="2" opacity=".5" transform="rotate(8 24 24)"/><path d="M30 34c4-2 8-6 10-10" stroke="currentColor" stroke-width="2" opacity=".7"/><path d="M40 24l1 5-5-1" stroke="currentColor" stroke-width="2" opacity=".7"/>') },
  { id:'level-10', name:'Double Digits', desc:'Reach level 10',
    icon: bi('<path d="M14 36V14l-4 4" stroke="currentColor" stroke-width="3" opacity=".7"/><rect x="24" y="12" width="14" height="24" rx="7" stroke="currentColor" stroke-width="3" opacity=".7"/>') },
  { id:'collector', name:'Collector', desc:'50 cards at Known or better',
    icon: bi('<rect x="6" y="18" width="16" height="22" rx="3" fill="currentColor" opacity=".3"/><rect x="16" y="12" width="16" height="22" rx="3" fill="currentColor" opacity=".45"/><rect x="26" y="6" width="16" height="22" rx="3" fill="currentColor" opacity=".6"/>') },
  { id:'centurion', name:'Centurion', desc:'100 cards at Known or better',
    icon: bi('<path d="M24 4l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" stroke="currentColor" stroke-width="2" opacity=".7" fill="currentColor" fill-opacity=".25"/>') }
];

// Badge conditions, evaluated against state + a round payload.
var CHECKS = {
  'first-steps': function(s, ev){ return ev === 'quiz-round'; },
  'combo-10':    function(s, ev, p){ return ev === 'quiz-round' && p.bestCombo >= 10; },
  'speedster':   function(s, ev, p){ return ev === 'speed-round' && p.known >= 20; },
  'deck-master': function(s){ return VCF.deckList().some(function(d){ var st = VCF.srs.deckStats(d.id); return st.total > 0 && st.known === st.total; }); },
  'week-streak': function(s){ return s.streak.current >= 7; },
  'month-streak':function(s){ return s.streak.current >= 30; },
  'night-owl':   function(s, ev){ if (!/round|session|daily|match/.test(ev)) return false; var h = new Date().getHours(); return h >= 0 && h < 5; },
  'early-bird':  function(s, ev){ if (!/round|session|daily|match/.test(ev)) return false; var h = new Date().getHours(); return h >= 5 && h < 8; },
  'tourist':     function(s){ var by = s.counters.roundsByDeck; return VCF.deckList().every(function(d){ return (by[d.id] || 0) > 0; }); },
  'daily-devotee': function(s){ return s.daily.completions >= 10; },
  'perfect-day': function(s, ev, p){ return ev === 'daily-round' && p.score === p.total && p.total >= 10; },
  'matchmaker':  function(s, ev, p){ return ev === 'match-round' && p.mistakes === 0; },
  'swipe-100':   function(s){ return s.counters.swipes >= 100; },
  'level-10':    function(s){ return levelForXp(s.xp).level >= 10; },
  'collector':   function(s){ return VCF.srs.totals().known >= 50; },
  'centurion':   function(s){ return VCF.srs.totals().known >= 100; }
};

// ---- daily quests ----
// Three per day, picked deterministically from the date. Each pays 40 XP.
var QUEST_DEFS = {
  'xp-120':    { label: 'Earn 120 XP today', target: 120, measure: 'xp' },
  'quiz-1':    { label: 'Finish a quiz round', target: 1, event: 'quiz-round' },
  'daily-1':   { label: 'Complete the Daily Challenge', target: 1, event: 'daily-done' },
  'match-win': { label: 'Win a Match game', target: 1, event: 'match-round' },
  'speed-10':  { label: 'Know 10 in one Speed round', target: 1, event: 'speed-round', cond: function(p){ return p.known >= 10; } },
  'swipe-15':  { label: 'Review 15 cards', target: 15, event: 'swipe-cards', countBy: function(p){ return p.reviewed || 0; } },
  'combo-5':   { label: 'Hit a 5x quiz combo', target: 1, event: 'quiz-round', cond: function(p){ return p.bestCombo >= 5; } }
};
var QUEST_XP = 40;
var questGuard = false;

function daysBetween(a, b){
  function toDate(s){ var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  return Math.round((toDate(b) - toDate(a)) / 86400000);
}

VCF.game = {
  BADGES: BADGES,
  QUEST_DEFS: QUEST_DEFS,
  daysBetween: daysBetween,
  levelCost: levelCost,
  levelForXp: levelForXp,
  levelTitle: levelTitle,

  // Today's quest set, (re)seeded from the local date.
  questsToday: function(nowDate){
    var s = VCF.store.state;
    var today = U.todayStr(nowDate);
    if (s.quests.date !== today){
      var rng = U.mulberry32(U.hashStr('vcf-quests-' + today));
      var ids = U.shuffle(Object.keys(QUEST_DEFS), rng).slice(0, 3);
      s.quests = { date: today, items: ids.map(function(id){ return { id: id, progress: 0, done: false }; }) };
      VCF.store.save();
    }
    // xp-measured quests track the day's XP live
    s.quests.items.forEach(function(q){
      var def = QUEST_DEFS[q.id];
      if (def && def.measure === 'xp' && !q.done){
        q.progress = Math.min(def.target, s.daysActive[today] || 0);
      }
    });
    return s.quests.items;
  },

  // Report a gameplay event; completes matching quests (+40 XP each).
  questEvent: function(event, payload){
    if (questGuard) return;
    var s = VCF.store.state;
    var items = VCF.game.questsToday();
    var completed = [];
    items.forEach(function(q){
      if (q.done) return;
      var def = QUEST_DEFS[q.id];
      if (!def) return;
      if (def.measure === 'xp'){
        if (q.progress >= def.target){ q.done = true; completed.push(q); }
        return;
      }
      if (def.event !== event) return;
      if (def.cond && !def.cond(payload || {})) return;
      q.progress += def.countBy ? def.countBy(payload || {}) : 1;
      if (q.progress >= def.target){ q.progress = def.target; q.done = true; completed.push(q); }
    });
    if (completed.length){
      questGuard = true;
      completed.forEach(function(q){
        VCF.game.awardXp(QUEST_XP, 'quest:' + q.id);
        VCF.bus.emit('quest', { id: q.id, label: QUEST_DEFS[q.id].label });
      });
      questGuard = false;
    }
    VCF.store.save();
    return completed;
  },

  multiplier: function(combo){
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    if (combo >= 3) return 1.5;
    return 1;
  },

  // Award XP. Updates streak + day activity, detects level-ups, emits bus events.
  awardXp: function(n, reason){
    n = Math.round(n);
    if (n <= 0) return { gained: 0 };
    var s = VCF.store.state;
    var before = levelForXp(s.xp).level;
    s.xp += n;
    var today = U.todayStr();
    s.daysActive[today] = (s.daysActive[today] || 0) + n;
    var streak = VCF.game.touchStreak();
    var after = levelForXp(s.xp);
    VCF.store.save();
    VCF.bus.emit('xp', { gained: n, reason: reason, total: s.xp, level: after });
    if (after.level > before){
      VCF.bus.emit('levelup', { level: after.level, title: levelTitle(after.level) });
    }
    if (streak.extended){
      VCF.bus.emit('streak', { current: s.streak.current, best: s.streak.best });
    }
    return { gained: n, leveledUp: after.level > before, level: after.level };
  },

  touchStreak: function(nowDate){
    var s = VCF.store.state;
    var today = U.todayStr(nowDate);
    if (s.streak.lastDay === today) return { extended: false, current: s.streak.current };
    if (s.streak.lastDay === U.yesterdayStr(nowDate)){
      s.streak.current += 1;
    } else if (s.streak.lastDay && s.freezes.count > 0 && daysBetween(s.streak.lastDay, today) === 2){
      // exactly one missed day — a streak freeze saves it
      s.freezes.count--;
      s.freezes.usedTotal++;
      s.streak.current += 1;
      VCF.bus.emit('freeze-used', { current: s.streak.current, left: s.freezes.count });
    } else {
      s.streak.current = 1;
      s.freezes.lastEarnedAtStreak = 0;
    }
    s.streak.best = Math.max(s.streak.best, s.streak.current);
    s.streak.lastDay = today;
    // earn a freeze at each 7-day milestone (carry at most 2)
    if (s.streak.current % 7 === 0 && s.streak.current > s.freezes.lastEarnedAtStreak){
      s.freezes.lastEarnedAtStreak = s.streak.current;
      if (s.freezes.count < 2){
        s.freezes.count++;
        VCF.bus.emit('freeze-earned', { count: s.freezes.count, streak: s.streak.current });
      }
    }
    return { extended: true, current: s.streak.current };
  },

  // Streak shown as alive if played today/yesterday, or if a freeze can still
  // save a single missed day.
  currentStreak: function(nowDate){
    var s = VCF.store.state;
    if (!s.streak.lastDay) return 0;
    if (s.streak.lastDay === U.todayStr(nowDate) || s.streak.lastDay === U.yesterdayStr(nowDate)) return s.streak.current;
    if (s.freezes.count > 0 && daysBetween(s.streak.lastDay, U.todayStr(nowDate)) === 2) return s.streak.current;
    return 0;
  },

  recordRound: function(deckId){
    var c = VCF.store.state.counters;
    if (deckId) c.roundsByDeck[deckId] = (c.roundsByDeck[deckId] || 0) + 1;
    var h = String(new Date().getHours());
    c.sessionsByHour[h] = (c.sessionsByHour[h] || 0) + 1;
  },

  // Diff badge conditions; award new ones (+50 XP each) and emit 'badge' events.
  checkBadges: function(event, payload){
    var s = VCF.store.state;
    var fresh = [];
    BADGES.forEach(function(b){
      if (s.badges[b.id]) return;
      var ok = false;
      try { ok = CHECKS[b.id](s, event, payload || {}); } catch(e){ console.error('badge check', b.id, e); }
      if (ok){
        s.badges[b.id] = Date.now();
        fresh.push(b);
      }
    });
    if (fresh.length){
      VCF.store.save();
      fresh.forEach(function(b){
        VCF.game.awardXp(50, 'badge:' + b.id);
        VCF.bus.emit('badge', b);
      });
    }
    return fresh;
  }
};
})();
