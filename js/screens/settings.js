// Settings: toggles, backup export/import, reset, about.
(function(){
var U = VCF.util;

function toggleRow(id, label, sub, on){
  return '<div class="set-row">' +
    '<div class="set-text"><div class="set-label">' + label + '</div><div class="set-sub">' + sub + '</div></div>' +
    '<button class="switch' + (on ? ' on' : '') + '" id="' + id + '" role="switch" aria-checked="' + on + '"><span class="knob"></span></button>' +
    '</div>';
}

VCF.screens.settings = {
  mount: function(root){
    var s = VCF.store.state;
    var el = U.el('div', 'screen settings-screen');
    el.innerHTML =
      '<h1 class="screen-title">Settings</h1>' +

      '<div class="panel">' +
        toggleRow('setSound', 'Sound effects', 'Chimes, combos and fanfares', s.settings.sound) +
        toggleRow('setHaptics', 'Haptics', 'Vibration on Android devices', s.settings.haptics) +
        toggleRow('setFx', 'Reduce effects', 'Skip confetti and big animations', s.settings.reducedFx) +
      '</div>' +

      '<h2 class="section-title">Backup</h2>' +
      '<div class="panel">' +
        '<p class="set-sub" style="margin-bottom:12px">Your progress lives on this device. Export a backup before switching phones or clearing the browser.</p>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btnExport">' + VCF.ui.icons.copy + ' Export progress</button>' +
          '<button class="btn" id="btnImport">Import</button>' +
        '</div>' +
        '<textarea id="backupBox" class="backup-box" placeholder="Exported backup appears here. To restore: paste a backup, then tap Import." spellcheck="false"></textarea>' +
      '</div>' +

      '<h2 class="section-title">Spread the vibes</h2>' +
      '<div class="panel">' +
        '<div class="set-row">' +
          '<div class="set-text"><div class="set-label">Share with a friend</div><div class="set-sub">Vibe coders are made, not born</div></div>' +
          '<button class="btn" id="btnShareApp">' + VCF.ui.icons.share + ' Share</button>' +
        '</div>' +
        '<div class="set-row">' +
          '<div class="set-text"><div class="set-label">How it works</div><div class="set-sub">Replay the intro tour anytime</div></div>' +
          '<button class="btn" id="btnReplayIntro">Replay</button>' +
        '</div>' +
      '</div>' +

      (VCF.SUPPORT_URL ?
        '<h2 class="section-title">Support</h2>' +
        '<div class="panel"><div class="set-row">' +
          (s.supported
            ? '<div class="set-text"><div class="set-label">You supported the app — THANK YOU!</div>' +
              '<div class="set-sub">You keep it free for everyone and help us build <a class="ob-link" href="' + VCF.MORE_APPS_URL + '" target="_blank" rel="noopener">more useful apps</a></div></div>' +
              '<a class="btn" id="btnSupport" href="' + VCF.SUPPORT_URL + '" target="_blank" rel="noopener">' + VCF.ui.icons.sparkle + ' Again?</a>'
            : '<div class="set-text"><div class="set-label">Love the app?</div>' +
              '<div class="set-sub">Pay what you want — it keeps new decks coming and helps us build more useful apps</div></div>' +
              '<a class="btn primary" id="btnSupport" href="' + VCF.SUPPORT_URL + '" target="_blank" rel="noopener">' + VCF.ui.icons.sparkle + ' Support</a>') +
        '</div></div>' : '') +

      '<h2 class="section-title">Danger zone</h2>' +
      '<div class="panel">' +
        '<div class="set-row">' +
          '<div class="set-text"><div class="set-label">Reset everything</div><div class="set-sub">Wipes XP, streaks, badges and card progress</div></div>' +
          '<button class="btn danger" id="btnReset">Reset</button>' +
        '</div>' +
      '</div>' +

      '<div class="about">Vibe Coder Flashcards v' + VCF.VERSION + ' · ' +
        VCF.deckList().reduce(function(n, d){ return n + d.cards.length; }, 0) + ' cards · made with good vibes' +
        '<br>more apps at <a class="ob-link" href="' + VCF.MORE_APPS_URL + '" target="_blank" rel="noopener">evergreencontent.app</a></div>';

    function wireToggle(id, key){
      U.$('#' + id, el).addEventListener('click', function(){
        s.settings[key] = !s.settings[key];
        this.classList.toggle('on', s.settings[key]);
        this.setAttribute('aria-checked', s.settings[key]);
        if (key === 'reducedFx') document.body.classList.toggle('reduced-fx', s.settings.reducedFx);
        VCF.store.save();
        VCF.audio.play(s.settings[key] ? 'toggleOn' : 'toggleOff');
        VCF.haptics.tap();
      });
    }
    wireToggle('setSound', 'sound');
    wireToggle('setHaptics', 'haptics');
    wireToggle('setFx', 'reducedFx');

    var supBtn = U.$('#btnSupport', el);
    if (supBtn) supBtn.addEventListener('click', function(){ VCF.shell.noteSupportIntent(); });

    U.$('#btnShareApp', el).addEventListener('click', function(){
      VCF.fx.share();
    });
    U.$('#btnReplayIntro', el).addEventListener('click', function(){
      VCF.router.go('/welcome');
    });

    U.$('#btnExport', el).addEventListener('click', function(){
      var json = VCF.store.exportJson();
      U.$('#backupBox', el).value = json;
      U.copyText(json).then(function(ok){
        VCF.fx.toast(ok ? 'Backup copied to clipboard' : 'Backup ready below — copy it manually');
      });
    });

    U.$('#btnImport', el).addEventListener('click', function(){
      var raw = U.$('#backupBox', el).value.trim();
      if (!raw){ VCF.fx.toast('Paste a backup into the box first'); return; }
      try {
        VCF.store.importJson(raw);
        VCF.fx.toast('Progress restored!');
        VCF.shell.refreshHud();
      } catch(e){
        VCF.fx.toast('That does not look like a valid backup', { cls: 'toast-bad' });
      }
    });

    var resetArmed = false;
    U.$('#btnReset', el).addEventListener('click', function(){
      if (!resetArmed){
        resetArmed = true;
        this.textContent = 'Tap again to confirm';
        var btn = this;
        setTimeout(function(){ resetArmed = false; btn.textContent = 'Reset'; }, 3500);
        return;
      }
      VCF.store.resetAll();
      VCF.shell.refreshHud();
      VCF.fx.toast('Fresh start. Everything reset.');
      VCF.router.go('/home');
    });

    root.appendChild(el);
  },
  unmount: function(){}
};

VCF.router.register('#/settings', VCF.screens.settings);
})();
