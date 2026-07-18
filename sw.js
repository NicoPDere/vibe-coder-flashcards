// Service worker: offline-first app shell.
// Bump CACHE_VERSION on every deploy so clients pick up new files.
var CACHE_VERSION = 'vcf-v13';
var FONT_CACHE = 'vcf-fonts-v1';

var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/games.css',
  './js/core/namespace.js',
  './js/core/store.js',
  './js/core/srs.js',
  './js/core/gamify.js',
  './js/core/audio.js',
  './js/core/haptics.js',
  './js/core/fx.js',
  './js/core/router.js',
  './js/ui/components.js',
  './js/ui/shell.js',
  './js/screens/home.js',
  './js/screens/deck.js',
  './js/screens/stats.js',
  './js/screens/settings.js',
  './js/screens/selftest.js',
  './js/screens/onboarding.js',
  './js/games/quiz.js',
  './js/games/speed.js',
  './js/games/swipe.js',
  './js/games/match.js',
  './js/games/daily.js',
  './js/app.js',
  './data/deck-vibe.js',
  './data/deck-js.js',
  './data/deck-terminal.js',
  './data/deck-setup.js',
  './js/screens/path.js',
  './data/deck-swiftui.js',
  './data/deck-sql.js',
  './data/deck-python.js',
  './data/deck-css.js',
  './data/deck-react.js'
];

// Nice-to-have: cached individually so a missing file can't fail the install.
var OPTIONAL = [
  './assets/icons/favicon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/apple-touch-icon.png',
  './landing.html',
  './privacy.html',
  './assets/mascot/mascot-hero-1024.png',
  './swiftui-flashcards.html',
  './sql-flashcards.html',
  './python-flashcards.html',
  './css-flashcards.html',
  './react-flashcards.html'
];

// cache:'reload' forces install to bypass the HTTP cache — otherwise a host
// serving max-age (e.g. GitHub Pages) can fill a NEW cache version with
// PRE-deploy files, freezing a mismatched shell until the next bump.
function freshReq(url){ return new Request(url, { cache: 'reload' }); }

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      var optional = Promise.all(OPTIONAL.map(function(url){
        return cache.add(freshReq(url)).catch(function(){ /* fine if absent */ });
      }));
      return cache.addAll(SHELL.map(freshReq)).then(function(){ return optional; });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE_VERSION && k !== FONT_CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Google Fonts: CSS stale-while-revalidate, font files cache-first.
  // Opaque responses are accepted here — the stylesheet <link> is a no-cors
  // request, so its response has ok=false yet is perfectly cacheable.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(
      caches.open(FONT_CACHE).then(function(cache){
        return cache.match(e.request).then(function(hit){
          var fetched = fetch(e.request).then(function(res){
            if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
            return res;
          }).catch(function(){
            return hit || new Response('', { status: 504, statusText: 'offline' });
          });
          return hit || fetched;
        });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Navigations: network-first so deploys are picked up, cache fallback offline.
  // Only cache good same-origin responses — a 503 during a deploy or a
  // captive-portal page must never overwrite the app shell.
  if (e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(function(res){
        if (res && res.ok && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // Everything else same-origin: cache-first.
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
