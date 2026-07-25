// Boot: load state (migrating v1 if present) -> chrome -> router -> PWA extras.
(function(){
VCF.store.load();
document.body.classList.toggle('reduced-fx', !!VCF.store.state.settings.reducedFx);
var ob = VCF.store.state.onboarding;
if (ob && ob.done && ob.decks && ob.decks.length) VCF.applyDeckOrder(ob.decks);
VCF.shell.init();
VCF.router.start();

// First-run: everyone lands in onboarding (migrated users with progress skip it).
if (!(ob && ob.done) && VCF.srs.totals().seen === 0){
  VCF.router.go('/welcome');
} else if (ob && !ob.done){
  ob.done = true; // returning user with progress — never nag
  VCF.store.save();
}

// Every tap makes a sound. Elements in OWN_SOUND play their own context-
// specific effect (right/wrong chimes, flips, toggles) and are skipped here.
var OWN_SOUND = '.quiz-opt,.speed-btns .btn,.round-btn,.match-tile,.switch,.copy-btn,.copy-big,.fcard,.swipe-card';
document.addEventListener('click', function(e){
  var t = e.target.closest('button, a[href], [role="switch"]');
  if (!t || t.closest(OWN_SOUND)) return;
  if (t.matches('.btn.primary,.mode-card,.action-card,.deck-tile')) VCF.audio.play('select');
  else VCF.audio.play('tap');
}, true);

// One-time welcome for migrated v1 users.
var s = VCF.store.state;
if (s.migratedFromV1 && !s.migratedFromV1.toasted){
  s.migratedFromV1.toasted = true;
  VCF.store.save();
  setTimeout(function(){
    VCF.fx.toast('<b>Welcome back!</b> Imported ' + s.migratedFromV1.cards + ' cards of progress', { ms: 3600 });
  }, 800);
}

// Ask the browser not to evict our storage (no-op where unsupported).
if (navigator.storage && navigator.storage.persist){
  try { navigator.storage.persist().catch(function(){}); } catch(e){}
}

// Service worker only makes sense over http(s) — file:// runs without it.
// On localhost it's opt-in (?sw=1) so development always serves fresh files;
// test offline locally with http://localhost:8123/?sw=1
var isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
var wantSw = !isLocalhost || /[?&]sw=1/.test(location.search);
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && wantSw){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').catch(function(e){
      console.warn('SW registration failed', e);
    });
  });
}
})();
