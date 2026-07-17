// Hash router. Browser history is the nav stack, so Android back and iOS
// swipe-back work for free. Routes look like '#/deck/:id/quiz'.
(function(){
var routes = [];   // { parts: ['deck', ':id', 'quiz'], screen }
var current = null; // { screen, path }

function parseHash(){
  var h = location.hash || '';
  // Legacy hashes from the old per-deck pages ('#quiz', '#speed') land on home.
  if (!h || h === '#' || h[1] !== '/') return ['home'];
  return h.slice(2).split('/').filter(Boolean);
}

function match(parts){
  for (var i = 0; i < routes.length; i++){
    var r = routes[i];
    if (r.parts.length !== parts.length) continue;
    var params = {}, ok = true;
    for (var j = 0; j < r.parts.length; j++){
      var p = r.parts[j];
      if (p[0] === ':') params[p.slice(1)] = decodeURIComponent(parts[j]);
      else if (p !== parts[j]){ ok = false; break; }
    }
    if (ok) return { route: r, params: params };
  }
  return null;
}

// Route depth drives the transition direction: deeper = camera pushes in
// (zoom into a course/game), shallower = camera pulls back out.
function depth(parts){
  if (parts[0] === 'deck') return parts.length >= 3 ? 2 : 1;
  if (parts[0] === 'daily' || parts[0] === 'review') return 2;
  return 0; // tab roots: home, stats, settings (lateral hops = fade)
}

var lastParts = null;

function render(){
  var parts = parseHash();
  var m = match(parts);
  if (!m){
    location.replace('#/home');
    return;
  }
  var nav = 'fade';
  if (lastParts){
    var d0 = depth(lastParts), d1 = depth(parts);
    nav = d1 > d0 ? 'push' : d1 < d0 ? 'pop' : 'fade';
    // The camera move gets a voice too: airy sweep in, reverse sweep out.
    if (nav === 'push') VCF.audio.play('swoosh');
    else if (nav === 'pop') VCF.audio.play('swooshBack');
  }
  document.documentElement.setAttribute('data-nav', nav);
  lastParts = parts;
  var app = VCF.util.$('#app');
  var doSwap = function(){
    if (current && current.screen.unmount){
      try { current.screen.unmount(); } catch(e){ console.error('unmount', e); }
    }
    app.innerHTML = '';
    app.scrollTop = 0;
    window.scrollTo(0, 0);
    current = { screen: m.route.screen, path: parts.join('/') };
    m.route.screen.mount(app, m.params);
    VCF.bus.emit('route', { parts: parts, params: m.params });
  };
  VCF.fx.transition(doSwap);
}

VCF.router = {
  register: function(pattern, screen){
    routes.push({ parts: pattern.replace(/^#?\//, '').split('/'), screen: screen });
  },
  go: function(path){
    if (('#' + path).replace(/^##/, '#') === location.hash) render();
    else location.hash = path;
  },
  back: function(){
    // If the app was opened directly on a deep link there may be no history to
    // pop — fall back to home.
    var before = location.hash;
    history.back();
    setTimeout(function(){
      if (location.hash === before) VCF.router.go('/home');
    }, 120);
  },
  start: function(){
    window.addEventListener('hashchange', render);
    render();
  },
  currentPath: function(){ return parseHash().join('/'); }
};
})();
