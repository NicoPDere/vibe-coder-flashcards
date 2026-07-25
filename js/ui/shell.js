// App chrome: top HUD (level, XP bar, streak), bottom tab nav, modal queue
// (level-ups + badge unlocks), streak toasts. Hidden on game routes.
(function(){
var U = VCF.util;

var GAME_MODES = { quiz: 1, speed: 1, swipe: 1, match: 1 };

function isGameRoute(parts){
  if (parts[0] === 'daily' || parts[0] === 'review' || parts[0] === 'welcome' || parts[0] === 'mistakes') return true;
  if (parts[0] === 'deck' && parts[2] === 'unit') return true;
  return parts[0] === 'deck' && parts.length === 3 && GAME_MODES[parts[2]];
}

VCF.shell = {
  init: function(){
    var chrome = U.el('div', '', '');
    chrome.id = 'chrome';
    chrome.innerHTML =
      '<header class="hud">' +
        '<div class="hud-level">' +
          '<div class="level-badge" id="hudLevel">1</div>' +
          '<div class="hud-level-text"><div class="hud-title" id="hudTitle"></div>' +
          '<div class="xp-bar"><div class="xp-fill" id="hudXpFill"></div></div></div>' +
        '</div>' +
        '<div class="hud-right">' +
          '<div class="hud-streak" id="hudStreak">' + VCF.ui.icons.flame + '<span>0</span></div>' +
        '</div>' +
      '</header>' +
      '<nav class="tabbar">' +
        '<a href="#/home" data-tab="home">' + VCF.ui.icons.home + '<span>Home</span></a>' +
        '<a href="#/stats" data-tab="stats">' + VCF.ui.icons.stats + '<span>Stats</span></a>' +
        '<a href="#/settings" data-tab="settings">' + VCF.ui.icons.gear + '<span>Settings</span></a>' +
      '</nav>';
    document.body.appendChild(chrome);

    VCF.shell.refreshHud();

    VCF.bus.on('route', function(e){
      document.body.classList.toggle('in-game', isGameRoute(e.parts));
      var tab = e.parts[0] === 'deck' ? 'home' : e.parts[0];
      U.$$('.tabbar a').forEach(function(a){
        a.classList.toggle('active', a.dataset.tab === tab);
      });
    });

    VCF.bus.on('xp', function(){
      VCF.shell.refreshHud();
      var bar = U.$('#hudXpFill');
      if (bar){ bar.classList.remove('pulse'); void bar.offsetWidth; bar.classList.add('pulse'); }
    });

    VCF.bus.on('levelup', function(e){
      VCF.shell.enqueueModal(function(done){
        VCF.audio.play('levelup');
        VCF.haptics.heavy();
        VCF.fx.confetti({ y: 0.3, count: 130 });
        var ov = U.el('div', 'big-modal-overlay');
        ov.innerHTML =
          '<div class="big-modal levelup-modal">' +
            '<div class="big-modal-mascot"></div>' +
            '<div class="levelup-kicker">Level up!</div>' +
            '<div class="levelup-num">' + e.level + '</div>' +
            '<div class="levelup-title">' + U.esc(e.title) + '</div>' +
            '<button class="btn primary">Keep vibing</button>' +
          '</div>';
        var lm = VCF.ui.mascot('hype', 110);
        U.$('.big-modal-mascot', ov).appendChild(lm);
        document.body.appendChild(ov);
        VCF.fx.reveal(ov);
        setTimeout(function(){ VCF.ui.mascotReact(lm, 'flip'); }, 380);
        U.$('button', ov).addEventListener('click', function(){
          ov.classList.remove('show');
          setTimeout(function(){ ov.remove(); done(); }, 240);
        });
      });
    });

    VCF.bus.on('badge', function(b){
      VCF.shell.enqueueModal(function(done){
        VCF.audio.play('badge');
        VCF.haptics.success();
        VCF.fx.confetti({ y: 0.35, count: 80 });
        var ov = U.el('div', 'big-modal-overlay');
        ov.innerHTML =
          '<div class="big-modal badge-modal">' +
            '<div class="badge-art unlocked">' + b.icon + '</div>' +
            '<div class="levelup-kicker">Badge unlocked</div>' +
            '<div class="badge-name">' + U.esc(b.name) + '</div>' +
            '<div class="badge-desc">' + U.esc(b.desc) + '</div>' +
            '<div class="res-xp">+50 XP</div>' +
            '<button class="btn primary">Nice</button>' +
          '</div>';
        document.body.appendChild(ov);
        VCF.fx.reveal(ov);
        U.$('button', ov).addEventListener('click', function(){
          ov.classList.remove('show');
          setTimeout(function(){ ov.remove(); done(); }, 240);
        });
      });
    });

    // Returning from a support tab -> big thank-you
    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'visible' && VCF.shell._pendingThanks){
        VCF.shell._pendingThanks = false;
        VCF.shell.bigThanks();
      }
    });

    VCF.bus.on('quest', function(q){
      VCF.audio.play('badge');
      VCF.fx.toast(VCF.ui.icons.check + ' <b>Quest done:</b> ' + q.label + ' (+40 XP)');
    });
    VCF.bus.on('freeze-earned', function(e){
      VCF.audio.play('badge');
      VCF.fx.toast(VCF.ui.icons.flame + ' <b>Streak freeze earned!</b> A missed day will not break your streak (' + e.count + ' held)');
    });
    VCF.bus.on('freeze-used', function(e){
      VCF.audio.play('match');
      VCF.fx.toast(VCF.ui.icons.flame + ' <b>Streak freeze used</b> — your ' + e.current + '-day streak survived!', { ms: 3600 });
    });

    VCF.bus.on('streak', function(e){
      if (e.current >= 2){
        VCF.fx.toast(VCF.ui.icons.flame + ' <b>' + e.current + '-day streak!</b> Keep it going', { cls: 'toast-streak' });
      }
    });
  },

  refreshHud: function(){
    var s = VCF.store.state;
    var lv = VCF.game.levelForXp(s.xp);
    var elLevel = U.$('#hudLevel');
    if (!elLevel) return;
    elLevel.textContent = lv.level;
    U.$('#hudTitle').textContent = VCF.game.levelTitle(lv.level) + ' · ' + lv.into + '/' + lv.need + ' XP';
    U.$('#hudXpFill').style.width = Math.round(lv.into / lv.need * 100) + '%';
    var streak = VCF.game.currentStreak();
    var st = U.$('#hudStreak');
    st.classList.toggle('lit', streak > 0);
    U.$('span', st).textContent = streak;
  },

  // --- supporter thank-you: flag intent when a support link is tapped, then
  // celebrate big when they come back to this tab ---
  _pendingThanks: false,
  noteSupportIntent: function(){
    VCF.shell._pendingThanks = true;
    VCF.store.state.supported = Date.now();
    VCF.store.save(true);
  },
  bigThanks: function(){
    VCF.shell.enqueueModal(function(done){
      VCF.audio.play('levelup');
      VCF.haptics.success();
      VCF.fx.confetti({ y: 0.3, count: 160 });
      var ov = VCF.util.el('div', 'big-modal-overlay');
      ov.innerHTML =
        '<div class="big-modal">' +
          '<div class="big-modal-mascot"></div>' +
          '<div class="levelup-kicker">You legend</div>' +
          '<div class="badge-name" style="font-size:30px">THANK YOU!</div>' +
          '<div class="badge-desc">Your support keeps Vibe Cards free for everyone &mdash; and helps us build more useful apps.</div>' +
          '<a class="ghost-btn" style="margin-top:4px" href="' + VCF.MORE_APPS_URL + '" target="_blank" rel="noopener">See what else we are building &rarr;</a>' +
          '<button class="btn primary">Back to the vibes</button>' +
        '</div>';
      var m = VCF.ui.mascot('hype', 110);
      VCF.util.$('.big-modal-mascot', ov).appendChild(m);
      document.body.appendChild(ov);
      VCF.fx.reveal(ov);
      setTimeout(function(){ VCF.ui.mascotReact(m, 'flip'); }, 400);
      VCF.util.$('button.btn', ov).addEventListener('click', function(){
        ov.classList.remove('show');
        setTimeout(function(){ ov.remove(); done(); }, 240);
      });
    });
  },

  // --- modal queue: level-ups and badges never stack on each other ---
  _queue: [],
  _showing: false,
  enqueueModal: function(build){
    VCF.shell._queue.push(build);
    VCF.shell._drain();
  },
  _drain: function(){
    if (VCF.shell._showing) return;
    var next = VCF.shell._queue.shift();
    if (!next) return;
    VCF.shell._showing = true;
    next(function(){
      VCF.shell._showing = false;
      setTimeout(VCF.shell._drain, 150);
    });
  }
};
})();
