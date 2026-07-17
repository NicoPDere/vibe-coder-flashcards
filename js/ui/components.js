// Shared UI renderers: icons, flashcards, deck tiles, rings, mascot, game frame.
(function(){
var U = VCF.util;

// --- inline SVG icon set (24x24, stroke=currentColor) ---
function ic(inner, vb){
  return '<svg class="ic" viewBox="' + (vb || '0 0 24 24') + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
}
VCF.ui = {};
VCF.ui.icons = {
  home:   ic('<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  stats:  ic('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'),
  gear:   ic('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>'),
  flame:  ic('<path d="M12 3c1 4 6 5 6 11a6 6 0 01-12 0c0-3 2-4 3-7 1 2 2 2.5 3 2-0.5-2 0-4 0-6z"/>'),
  bolt:   ic('<path d="M13 2L5 14h6l-2 8 8-12h-6l2-8z"/>'),
  timer:  ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>'),
  cards:  ic('<rect x="3" y="6" width="12" height="16" rx="2" transform="rotate(-8 9 14)"/><rect x="9" y="4" width="12" height="16" rx="2" transform="rotate(6 15 12)"/>'),
  swipe:  ic('<rect x="6" y="3" width="12" height="17" rx="2"/><path d="M20.5 12.5c1-1 1-2 0-3"/><path d="M3.5 12.5c-1-1-1-2 0-3"/>'),
  grid:   ic('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  close:  ic('<path d="M5 5l14 14M19 5L5 19"/>'),
  back:   ic('<path d="M15 4l-8 8 8 8"/>'),
  check:  ic('<path d="M4 12.5l5 5L20 6.5"/>'),
  x:      ic('<path d="M5 5l14 14M19 5L5 19"/>'),
  undo:   ic('<path d="M8 5L3 10l5 5"/><path d="M3 10h11a7 7 0 017 7v2"/>'),
  copy:   ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>'),
  play:   ic('<path d="M7 4l13 8-13 8z"/>'),
  sparkle:ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
  search: ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
  book:   ic('<path d="M4 4.5A2.5 2.5 0 016.5 2H20v17.5H6.5A2.5 2.5 0 004 22z"/><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>'),
  trophy: ic('<path d="M7 3h10v6a5 5 0 01-10 0z"/><path d="M7 5H3.5a3.5 3.5 0 003.7 3.5M17 5h3.5a3.5 3.5 0 01-3.7 3.5"/><path d="M12 14v3M8 21h8M9.5 17.5h5"/>'),
  sun:    ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"/>'),
  zoom:   ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  share:  ic('<circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="5.5" r="2.6"/><circle cx="17.5" cy="18.5" r="2.6"/><path d="M8.4 10.8l6.8-4M8.4 13.2l6.8 4"/>')
};

VCF.ui.TIER_COLORS = { 'new': '#5f6478', learning: '#ffd93d', known: '#57c7ff', mastered: '#4dd08c' };
VCF.ui.TIER_LABELS = { 'new': 'New', learning: 'Learning', known: 'Known', mastered: 'Mastered' };

// --- progress ring (returns markup) ---
VCF.ui.ring = function(pct, size, color, label){
  size = size || 56;
  var r = (size - 8) / 2, c = 2 * Math.PI * r;
  var off = c * (1 - U.clamp(pct, 0, 100) / 100);
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" stroke="rgba(255,255,255,.08)" stroke-width="5" fill="none"/>' +
    '<circle cx="' + size/2 + '" cy="' + size/2 + '" r="' + r + '" stroke="' + color + '" stroke-width="5" fill="none" ' +
      'stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" ' +
      'transform="rotate(-90 ' + size/2 + ' ' + size/2 + ')"/>' +
    (label != null ? '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-label">' + label + '</text>' : '') +
    '</svg>';
};

// --- mascot (inline SVG, fully animated: bob, blink, antenna sway, glow) ---
var mascotEyes = {
  idle:  '<circle cx="25" cy="30" r="3.4" fill="#1b1030"/><circle cx="47" cy="30" r="3.4" fill="#1b1030"/>',
  happy: '<path d="M21 30c1.5-3 6.5-3 8 0M43 30c1.5-3 6.5-3 8 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>',
  sad:   '<path d="M21 31c2-2.4 6-2.4 8 0M43 31c2-2.4 6-2.4 8 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>',
  hype:  '<path d="M25 26l1.6 4.4 4.4 1.6-4.4 1.6L25 38l-1.6-4.4L19 32l4.4-1.6z" fill="#1b1030"/><path d="M47 26l1.6 4.4 4.4 1.6-4.4 1.6L47 38l-1.6-4.4L41 32l4.4-1.6z" fill="#1b1030"/>'
};
var mascotMouths = {
  idle:  '<path d="M28 41c3 3 13 3 16 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>',
  happy: '<path d="M27 39c3.5 5 14.5 5 18 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>',
  sad:   '<path d="M29 44c2.5-3 11.5-3 14 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>',
  hype:  '<path d="M27 41c3.5 5.5 14.5 5.5 18 0" stroke="#1b1030" stroke-width="3" stroke-linecap="round" fill="none"/>'
};
VCF.ui.mascotSVG = function(mood, size){
  size = size || 92;
  mood = mascotEyes[mood] ? mood : 'idle';
  // Ground shadow lives OUTSIDE .m-body so the body jumps above it; jump
  // keyframes shrink/fade the shadow in sync to sell the height.
  return '<svg class="mascot mood-' + mood + '" width="' + size + '" height="' + size + '" viewBox="0 0 72 78" aria-hidden="true">' +
    '<defs><linearGradient id="mgrad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#ff7ac8"/><stop offset="1" stop-color="#9d7bff"/></linearGradient></defs>' +
    '<ellipse class="m-shadow" cx="36" cy="72" rx="16" ry="3.2" fill="#000" opacity=".38"/>' +
    '<g class="m-body">' +
      '<g class="m-antenna">' +
        '<path d="M36 4v8" stroke="#9d7bff" stroke-width="3" stroke-linecap="round"/>' +
        '<circle class="m-ball" cx="36" cy="5" r="3.5" fill="#ffd93d"/>' +
      '</g>' +
      '<rect x="10" y="12" width="52" height="46" rx="16" fill="url(#mgrad)"/>' +
      '<rect x="16" y="20" width="40" height="30" rx="11" fill="rgba(15,16,22,.28)"/>' +
      '<g class="m-eyes">' + mascotEyes[mood] + '</g>' +
      '<g class="m-mouth">' + mascotMouths[mood] + '</g>' +
      '<g class="m-feet">' +
        '<rect x="24" y="60" width="8" height="6" rx="3" fill="#9d7bff"/>' +
        '<rect x="40" y="60" width="8" height="6" rx="3" fill="#9d7bff"/>' +
      '</g>' +
      '<path class="m-spark" d="M62 14l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#ffd93d"/>' +
    '</g>' +
    '</svg>';
};
VCF.ui.mascot = function(mood, size){
  // Inline SVG on purpose: crisp at any scale, ~1KB, animates cleanly, and the
  // official app icon was generated from this exact character.
  var wrap = U.el('div', 'mascot-wrap');
  wrap.innerHTML = VCF.ui.mascotSVG(mood, size || 92);
  // Idle life: an occasional spontaneous hop. Timer self-clears once the
  // mascot leaves the DOM.
  if (!VCF.fx.reduced() && mood !== 'sad'){
    var t = setInterval(function(){
      if (!wrap.isConnected){ clearInterval(t); return; }
      if (Math.random() < 0.45) VCF.ui.mascotReact(wrap, 'hop', { silent: true });
    }, 4500 + Math.random() * 4000);
  }
  return wrap;
};

// One-shot physical reactions. kind: 'hop' | 'jump' | 'double' | 'flip'
// The chirp is intentionally scarce: never on hops, occasional on jumps,
// always on the rare level-up flip. opts.silent forces it off entirely.
var REACT_MS = { hop: 550, jump: 950, double: 1250, flip: 1050 };
var REACT_SOUND_CHANCE = { hop: 0, jump: 0.65, double: 0.85, flip: 1 };
VCF.ui.mascotReact = function(wrap, kind, opts){
  if (!wrap || VCF.fx.reduced()) return;
  kind = REACT_MS[kind] ? kind : 'jump';
  ['hop','jump','double','flip'].forEach(function(k){ wrap.classList.remove('m-do-' + k); });
  void wrap.offsetWidth;
  wrap.classList.add('m-do-' + kind);
  if (!(opts && opts.silent) && Math.random() < REACT_SOUND_CHANCE[kind]) VCF.audio.play('boing');
  setTimeout(function(){ wrap.classList.remove('m-do-' + kind); }, REACT_MS[kind]);
};

// --- flashcard (browse grid) ---
VCF.ui.flashcard = function(deck, card, opts){
  opts = opts || {};
  var cat = null;
  for (var i = 0; i < deck.cats.length; i++) if (deck.cats[i].id === card.c) cat = deck.cats[i];
  var color = cat ? cat.color : deck.color;
  var visual = deck.visuals[card.n] || '';
  var rec = VCF.store.peek(deck.id, card.n);
  var tier = VCF.srs.masteryTier(rec);

  var wrap = U.el('div', 'fcard-wrap');
  wrap.innerHTML =
    '<div class="fcard" tabindex="0">' +
      '<div class="fcard-face fcard-front">' +
        '<div class="fcard-top">' +
          '<div class="fcard-meta">' +
            '<span class="cat-chip"><span class="cat-dot" style="background:' + color + '"></span>' + U.esc(cat ? cat.label : card.c) + '</span>' +
            '<div class="fcard-name">' + U.esc(card.n) + '</div>' +
          '</div>' +
          '<div class="fcard-visual" style="color:' + color + '">' + visual + '</div>' +
        '</div>' +
        '<div class="fcard-desc">' + U.esc(card.d) + '</div>' +
        '<div class="fcard-foot">' +
          '<span class="tier-pip" title="' + VCF.ui.TIER_LABELS[tier] + '" style="background:' + VCF.ui.TIER_COLORS[tier] + '"></span>' +
          '<span class="fcard-hint">tap to flip</span>' +
          '<button class="ghost-btn zoom-btn" title="Expand">' + VCF.ui.icons.zoom + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="fcard-face fcard-back">' +
        '<div class="back-label">Say to your AI</div>' +
        '<div class="prompt-text">&ldquo;' + U.esc(card.p) + '&rdquo;</div>' +
        '<div class="code-row"><code>' + U.esc(card.x) + '</code></div>' +
        '<div class="fcard-foot">' +
          '<button class="ghost-btn copy-btn">' + VCF.ui.icons.copy + '<span>Copy prompt</span></button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var el = wrap.firstChild;
  el.addEventListener('click', function(e){
    if (e.target.closest('button')) return;
    el.classList.toggle('flipped');
    VCF.audio.play('flip');
    VCF.haptics.tap();
  });
  el.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); }
  });
  U.$('.copy-btn', el).addEventListener('click', function(){
    var btn = this;
    U.copyText(card.p).then(function(ok){
      btn.classList.add('copied');
      U.$('span', btn).textContent = ok ? 'Copied!' : 'Copy failed';
      VCF.audio.play('pop');
      setTimeout(function(){ btn.classList.remove('copied'); U.$('span', btn).textContent = 'Copy prompt'; }, 1400);
    });
  });
  U.$('.zoom-btn', el).addEventListener('click', function(){
    VCF.ui.zoomCard(deck, card);
  });
  return wrap;
};

// --- zoomed card modal ---
VCF.ui.zoomCard = function(deck, card){
  var cat = null;
  for (var i = 0; i < deck.cats.length; i++) if (deck.cats[i].id === card.c) cat = deck.cats[i];
  var color = cat ? cat.color : deck.color;
  var visual = deck.visuals[card.n] || '';

  var ov = U.el('div', 'zoom-overlay');
  ov.innerHTML =
    '<div class="zoom-card" style="--accent:' + color + '">' +
      '<button class="ghost-btn zoom-close">' + VCF.ui.icons.close + '</button>' +
      '<div class="zoom-visual" style="color:' + color + '">' + visual + '</div>' +
      '<span class="cat-chip"><span class="cat-dot" style="background:' + color + '"></span>' + U.esc(cat ? cat.label : card.c) + '</span>' +
      '<h2>' + U.esc(card.n) + '</h2>' +
      '<p class="zoom-desc">' + U.esc(card.d) + '</p>' +
      '<div class="zoom-block"><div class="back-label">Say to your AI</div>' +
        '<div class="prompt-text">&ldquo;' + U.esc(card.p) + '&rdquo;</div></div>' +
      '<div class="zoom-block"><div class="back-label">Example</div>' +
        '<div class="code-row"><code>' + U.esc(card.x) + '</code></div></div>' +
      '<button class="btn primary copy-big">' + VCF.ui.icons.copy + '<span>Copy prompt</span></button>' +
    '</div>';
  document.body.appendChild(ov);
  VCF.audio.play('swoosh');
  VCF.fx.reveal(ov);

  function close(){
    ov.classList.remove('show');
    setTimeout(function(){ ov.remove(); }, 260);
  }
  ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
  U.$('.zoom-close', ov).addEventListener('click', close);
  U.$('.copy-big', ov).addEventListener('click', function(){
    var btn = this;
    U.copyText(card.p).then(function(ok){
      U.$('span', btn).textContent = ok ? 'Copied!' : 'Copy failed';
      VCF.audio.play('pop');
      setTimeout(function(){ U.$('span', btn).textContent = 'Copy prompt'; }, 1400);
    });
  });
  return ov;
};

// --- deck tile (home grid) ---
VCF.ui.deckTile = function(deck){
  var stats = VCF.srs.deckStats(deck.id);
  var due = VCF.srs.dueCount(deck.id);
  var tile = U.el('a', 'deck-tile');
  tile.href = '#/deck/' + deck.id;
  tile.style.setProperty('--c1', deck.gradient[0]);
  tile.style.setProperty('--c2', deck.gradient[1]);
  tile.innerHTML =
    '<div class="deck-tile-glow"></div>' +
    '<div class="deck-tile-head">' +
      '<div class="deck-icon">' + deck.icon + '</div>' +
      VCF.ui.ring(stats.pct, 46, deck.color, stats.pct + '%') +
    '</div>' +
    '<div class="deck-tile-name" style="color:' + deck.color + '">' + U.esc(deck.name) + '</div>' +
    '<div class="deck-tile-sub">' + stats.known + '/' + stats.total + ' known' +
      (due ? ' <span class="due-pill">' + due + ' due</span>' : '') + '</div>';
  return tile;
};

// --- game frame: fullscreen skeleton shared by all modes ---
VCF.ui.gameFrame = function(opts){
  opts = opts || {};
  var root = U.el('div', 'game-screen' + (opts.cls ? ' ' + opts.cls : ''));
  if (opts.accent) root.style.setProperty('--accent', opts.accent);
  root.innerHTML =
    '<div class="game-head">' +
      '<button class="ghost-btn game-close">' + VCF.ui.icons.close + '</button>' +
      '<div class="game-head-mid"></div>' +
      '<div class="game-head-right"></div>' +
    '</div>' +
    '<div class="game-body"></div>';
  U.$('.game-close', root).addEventListener('click', function(){
    if (opts.onClose) opts.onClose();
    VCF.router.back();
  });
  return {
    root: root,
    mid: U.$('.game-head-mid', root),
    right: U.$('.game-head-right', root),
    body: U.$('.game-body', root)
  };
};

// --- results screen shared by all modes ---
VCF.ui.results = function(opts){
  var stats = (opts.stats || []).map(function(s){
    return '<div class="res-stat"><div class="res-num" style="color:' + (s.color || 'var(--text)') + '">' + s.value + '</div>' +
           '<div class="res-label">' + U.esc(s.label) + '</div></div>';
  }).join('');
  var el = U.el('div', 'results');
  el.innerHTML =
    '<div class="results-mascot"></div>' +
    '<h2 class="results-title">' + U.esc(opts.title) + '</h2>' +
    (opts.subtitle ? '<p class="results-sub">' + U.esc(opts.subtitle) + '</p>' : '') +
    '<div class="res-stats">' + stats + '</div>' +
    (opts.xp ? '<div class="res-xp">+' + opts.xp + ' XP</div>' : '') +
    '<div class="res-btns">' +
      '<button class="btn primary res-again">' + U.esc(opts.againLabel || 'Go again') + '</button>' +
      '<button class="btn res-done">Done</button>' +
    '</div>' +
    '<button class="ghost-btn res-share">' + VCF.ui.icons.share + '<span>Share this score</span></button>';
  var rm = VCF.ui.mascot(opts.mood || 'happy', 96);
  U.$('.results-mascot', el).appendChild(rm);
  if (opts.mood !== 'sad'){
    setTimeout(function(){
      VCF.ui.mascotReact(rm, opts.react || (opts.mood === 'hype' ? 'double' : 'jump'));
    }, 350);
  }
  U.$('.res-again', el).addEventListener('click', function(){ opts.onAgain && opts.onAgain(); });
  U.$('.res-done', el).addEventListener('click', function(){ VCF.router.back(); });
  U.$('.res-share', el).addEventListener('click', function(){
    VCF.fx.share(opts.shareText || ('I just scored ' +
      (opts.stats && opts.stats[0] ? opts.stats[0].value : '') +
      ' on Vibe Coder Flashcards — learning to build with AI, one card at a time.'));
  });
  return el;
};
})();
