// VCF — Vibe Coder Flashcards. Global namespace + shared utilities.
(function(){
window.VCF = window.VCF || {};
VCF.decks = VCF.decks || {};
VCF.screens = {};
VCF.games = {};
VCF.VERSION = '2.0.0';

// "Support this app" link (Buy Me a Coffee — Stripe-backed). Empty string
// would hide every support button in the app.
VCF.SUPPORT_URL = 'https://buymeacoffee.com/nicopdev';
VCF.MORE_APPS_URL = 'https://www.evergreencontent.app';

// Preferred display order of decks on the home screen.
VCF.DECK_ORDER = ['vibe','swiftui','sql','python','css','react'];
VCF.deckList = function(){
  var out = [];
  VCF.DECK_ORDER.forEach(function(id){ if (VCF.decks[id]) out.push(VCF.decks[id]); });
  Object.keys(VCF.decks).forEach(function(id){
    if (VCF.DECK_ORDER.indexOf(id) === -1) out.push(VCF.decks[id]);
  });
  return out;
};

// --- tiny event bus ---
var listeners = {};
VCF.bus = {
  on: function(ev, fn){ (listeners[ev] = listeners[ev] || []).push(fn); },
  emit: function(ev, payload){
    (listeners[ev] || []).forEach(function(fn){
      try { fn(payload); } catch(e){ console.error('[bus:' + ev + ']', e); }
    });
  }
};

// --- utilities ---
VCF.util = {
  $: function(sel, root){ return (root || document).querySelector(sel); },
  $$: function(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },

  el: function(tag, cls, html){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  },

  esc: function(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  },

  shuffle: function(arr, rng){
    var a = arr.slice(), r = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--){
      var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  },

  pick: function(arr, rng){ return arr[Math.floor((rng || Math.random)() * arr.length)]; },

  clamp: function(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); },

  // Deterministic PRNG for the daily challenge.
  mulberry32: function(seed){
    var a = seed >>> 0;
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  hashStr: function(s){
    var h = 2166136261;
    for (var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  // Local calendar date as YYYY-MM-DD (never UTC — avoids off-by-one at midnight).
  todayStr: function(d){
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  },

  yesterdayStr: function(d){
    var y = new Date((d || new Date()).getTime());
    y.setDate(y.getDate() - 1);
    return VCF.util.todayStr(y);
  },

  fmtMs: function(ms){
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    s = s % 60;
    return (m ? m + ':' : '0:') + (s < 10 ? '0' : '') + s;
  },

  // Copy with file://-safe fallback (navigator.clipboard needs a secure context).
  copyText: function(text){
    if (navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text).then(function(){ return true; }, function(){ return VCF.util._copyFallback(text); });
    }
    return Promise.resolve(VCF.util._copyFallback(text));
  },
  _copyFallback: function(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){}
    ta.remove();
    return ok;
  }
};
})();
