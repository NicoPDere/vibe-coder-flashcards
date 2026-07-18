// Swipe review: Tinder-style card stack driven by the SRS due queue.
// Drag right = know (good), left = again. Tap flips the card. Undo supported.
(function(){
var U = VCF.util;
var SESSION = 20;

VCF.games.swipe = {
  mount: function(root, params){
    var deckId = params && params.id ? params.id : null;
    var deck = deckId ? VCF.decks[deckId] : null;
    if (deckId && !deck){ VCF.router.go('/home'); return; }

    var fixMode = !!(params && params.mistakes);
    var queue = fixMode ? VCF.srs.mistakeQueue(SESSION) : VCF.srs.dueQueue(deckId, SESSION);
    var accent = deck ? deck.color : '#9d7bff';
    var reviewed = 0, knew = 0, xpEarned = 0;
    var history = []; // { item, snapshot, xp }

    var frame = VCF.ui.gameFrame({ accent: accent });
    root.appendChild(frame.root);
    frame.mid.innerHTML = '<div class="swipe-count" id="swCount"></div>';

    if (!queue.length){
      frame.body.appendChild(VCF.ui.results({
        title: fixMode ? 'Nothing to fix!' : 'All caught up!',
        subtitle: fixMode ? 'No repeat offenders in your history. Keep playing!' : 'Nothing due right now. Come back later or play a quiz.',
        mood: 'happy',
        stats: [],
        againLabel: 'Home',
        onAgain: function(){ VCF.router.go('/home'); }
      }));
      return;
    }

    function refreshCount(){
      var el = U.$('#swCount', frame.root);
      if (el) el.textContent = (queue.length - reviewed) + ' to go';
    }

    frame.body.innerHTML =
      '<div class="swipe-stage">' +
        '<div class="swipe-stamp stamp-know">KNOW</div>' +
        '<div class="swipe-stamp stamp-again">AGAIN</div>' +
        '<div class="swipe-stack" id="swStack"></div>' +
      '</div>' +
      '<div class="swipe-btns">' +
        '<button class="round-btn btn-again" title="Again">' + VCF.ui.icons.x + '</button>' +
        '<button class="round-btn btn-undo" title="Undo">' + VCF.ui.icons.undo + '</button>' +
        '<button class="round-btn btn-know" title="Know it">' + VCF.ui.icons.check + '</button>' +
      '</div>' +
      '<div class="swipe-hint">Swipe right if you know it · tap to flip</div>';

    var stack = U.$('#swStack', frame.body);
    var stampKnow = U.$('.stamp-know', frame.body);
    var stampAgain = U.$('.stamp-again', frame.body);

    function cardEl(item, depth){
      var d = item.deck, c = item.card;
      var cat = null;
      d.cats.forEach(function(x){ if (x.id === c.c) cat = x; });
      var color = cat ? cat.color : d.color;
      var el = U.el('div', 'swipe-card depth-' + depth);
      el.innerHTML =
        '<div class="swipe-inner">' +
          '<div class="swipe-face swipe-front">' +
            '<span class="cat-chip"><span class="cat-dot" style="background:' + color + '"></span>' +
              U.esc(d.name) + (cat ? ' · ' + U.esc(cat.label) : '') + '</span>' +
            '<div class="swipe-visual" style="color:' + color + '">' + (d.visuals[c.n] || '') + '</div>' +
            '<div class="swipe-name">' + U.esc(c.n) + '</div>' +
            '<div class="swipe-desc">' + U.esc(c.d) + '</div>' +
            '<div class="fcard-hint">tap to flip</div>' +
          '</div>' +
          '<div class="swipe-face swipe-back">' +
            '<div class="back-label">Say to your AI</div>' +
            '<div class="prompt-text">&ldquo;' + U.esc(c.p) + '&rdquo;</div>' +
            '<div class="code-row"><code>' + U.esc(c.x) + '</code></div>' +
          '</div>' +
        '</div>';
      return el;
    }

    function renderStack(){
      stack.innerHTML = '';
      for (var i = Math.min(queue.length - 1, reviewed + 2); i >= reviewed; i--){
        var el = cardEl(queue[i], i - reviewed);
        stack.appendChild(el);
      }
      var top = stack.lastElementChild;
      if (top) attachDrag(top);
      refreshCount();
    }

    function grade(dir){
      // dir: 1 = know, -1 = again
      var item = queue[reviewed];
      if (!item) return;
      var rec = VCF.store.card(item.deck.id, item.card.n);
      var snapshot = JSON.stringify(rec);
      VCF.srs.grade(rec, dir > 0 ? 'good' : 'again');
      var s = VCF.store.state;
      s.counters.swipes++;
      var gained = dir > 0 ? 6 : 2;
      xpEarned += gained;
      VCF.game.awardXp(gained, 'swipe');
      history.push({ item: item, snapshot: snapshot, xp: gained, dir: dir });
      if (dir > 0){ knew++; VCF.audio.play('correct'); VCF.haptics.tap(); }
      else { VCF.audio.play('swoosh'); }
      VCF.store.save();
      reviewed++;
      if (reviewed >= queue.length) setTimeout(end, 260);
      else renderStack();
    }

    function flyOut(el, dir){
      el.style.transition = 'transform .28s ease-out, opacity .28s ease-out';
      el.style.transform = 'translate(' + (dir * (window.innerWidth * 0.9)) + 'px, -40px) rotate(' + dir * 24 + 'deg)';
      el.style.opacity = '0';
      setTimeout(function(){ grade(dir); }, 200);
    }

    function attachDrag(el){
      var startX = 0, startY = 0, dx = 0, dy = 0, dragging = false, moved = false;

      el.addEventListener('pointerdown', function(e){
        if (reviewed >= queue.length) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        el.setPointerCapture(e.pointerId);
        el.style.transition = 'none';
      });

      el.addEventListener('pointermove', function(e){
        if (!dragging) return;
        dx = e.clientX - startX; dy = e.clientY - startY;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
        el.style.transform = 'translate(' + dx + 'px,' + (dy * 0.4) + 'px) rotate(' + (dx / 18) + 'deg)';
        var k = U.clamp(dx / 110, -1, 1);
        stampKnow.style.opacity = Math.max(0, k);
        stampAgain.style.opacity = Math.max(0, -k);
      });

      function release(e){
        if (!dragging) return;
        dragging = false;
        stampKnow.style.opacity = 0;
        stampAgain.style.opacity = 0;
        var threshold = Math.min(120, window.innerWidth * 0.28);
        if (moved && Math.abs(dx) > threshold){
          flyOut(el, dx > 0 ? 1 : -1);
        } else if (!moved){
          // treat as tap: flip
          U.$('.swipe-inner', el).classList.toggle('flipped');
          VCF.audio.play('flip');
          el.style.transform = '';
        } else {
          el.style.transition = 'transform .3s cubic-bezier(.2,1.4,.4,1)';
          el.style.transform = '';
        }
        dx = 0; dy = 0;
      }
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
    }

    U.$('.btn-know', frame.body).addEventListener('click', function(){
      var top = stack.lastElementChild;
      if (top) flyOut(top, 1);
    });
    U.$('.btn-again', frame.body).addEventListener('click', function(){
      var top = stack.lastElementChild;
      if (top) flyOut(top, -1);
    });
    U.$('.btn-undo', frame.body).addEventListener('click', function(){
      var last = history.pop();
      if (!last) return;
      reviewed--;
      if (queue[reviewed] !== last.item) queue.splice(reviewed, 0, last.item);
      var rec = VCF.store.card(last.item.deck.id, last.item.card.n);
      var snap = JSON.parse(last.snapshot);
      Object.keys(snap).forEach(function(k){ rec[k] = snap[k]; });
      xpEarned = Math.max(0, xpEarned - last.xp);
      if (last.dir > 0) knew = Math.max(0, knew - 1);
      var c = VCF.store.state.counters;
      c.swipes = Math.max(0, c.swipes - 1);
      VCF.store.save();
      VCF.audio.play('pop');
      renderStack();
    });

    function end(){
      var bonus = reviewed >= 5 ? 15 : 0;
      if (bonus){ xpEarned += bonus; VCF.game.awardXp(bonus, 'swipe-bonus'); }
      VCF.game.recordRound(deckId || (queue[0] && queue[0].deck.id));
      VCF.store.save();
      VCF.game.checkBadges('swipe-session', { reviewed: reviewed, knew: knew });
      VCF.game.questEvent('swipe-cards', { reviewed: reviewed, knew: knew });
      if (knew >= reviewed * 0.8 && reviewed >= 10) VCF.fx.confetti({ y: 0.3 });
      VCF.audio.play('match');

      frame.body.innerHTML = '';
      frame.mid.innerHTML = '';
      frame.body.appendChild(VCF.ui.results({
        title: fixMode ? 'Mistakes faced!' : 'Review done!',
        subtitle: fixMode ? 'Your trickiest cards, retrained' : (deck ? deck.name + ' swipe session' : 'Cross-deck smart review'),
        mood: knew >= reviewed * 0.7 ? 'hype' : 'happy',
        xp: xpEarned,
        stats: [
          { value: reviewed, label: 'Reviewed' },
          { value: knew, label: 'Knew it', color: '#4dd08c' },
          { value: reviewed - knew, label: 'Again', color: '#ff5c72' }
        ],
        onAgain: function(){
          root.innerHTML = '';
          VCF.games.swipe.mount(root, params);
        }
      }));
      VCF.shell.refreshHud();
    }

    renderStack();
  },
  unmount: function(){}
};

VCF.router.register('#/deck/:id/swipe', VCF.games.swipe);
VCF.router.register('#/review', VCF.games.swipe);

// "Fix your mistakes": same engine, queue = most-fumbled cards.
VCF.games.mistakes = {
  mount: function(root){ VCF.games.swipe.mount(root, { mistakes: true }); },
  unmount: function(){ VCF.games.swipe.unmount(); }
};
VCF.router.register('#/mistakes', VCF.games.mistakes);
})();
