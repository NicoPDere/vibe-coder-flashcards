// Visual juice: confetti, toasts, floating XP numbers, screen transitions.
(function(){
var U = VCF.util;

function reduced(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return !!(VCF.store.state && VCF.store.state.settings.reducedFx);
}

var PALETTE = ['#ff7ac8', '#9d7bff', '#57c7ff', '#4dd08c', '#ffd93d', '#ff9f43'];

VCF.fx = {
  reduced: reduced,

  // Add a class after the element's initial style is committed, so its CSS
  // transition runs. Forced reflow instead of rAF: rAF starves in hidden tabs,
  // which would leave overlays permanently invisible.
  reveal: function(el, cls){
    void el.offsetWidth;
    el.classList.add(cls || 'show');
  },

  // Particle burst. opts: {x, y (0-1 fractions), count, colors, spread}
  confetti: function(opts){
    if (reduced()) return;
    opts = opts || {};
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-confetti';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    var g = canvas.getContext('2d');
    var colors = opts.colors || PALETTE;
    var cx = (opts.x != null ? opts.x : 0.5) * canvas.width;
    var cy = (opts.y != null ? opts.y : 0.35) * canvas.height;
    var count = opts.count || 90;
    var parts = [];
    for (var i = 0; i < count; i++){
      var ang = Math.random() * Math.PI * 2;
      var speed = 4 + Math.random() * (opts.spread || 9);
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 4,
        w: 5 + Math.random() * 5,
        h: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: colors[i % colors.length],
        life: 1
      });
    }
    var start = performance.now();
    function frame(now){
      var t = (now - start) / 1000;
      g.clearRect(0, 0, canvas.width, canvas.height);
      var alive = 0;
      parts.forEach(function(p){
        p.vy += 0.22;                 // gravity
        p.vx *= 0.985;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - t / 2.2);
        if (p.life <= 0 || p.y > canvas.height + 20) return;
        alive++;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.globalAlpha = p.life;
        g.fillStyle = p.color;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      });
      if (alive > 0 && t < 2.5) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  },

  toast: function(msg, opts){
    opts = opts || {};
    var host = U.$('#toasts');
    if (!host){
      host = U.el('div', '', '');
      host.id = 'toasts';
      document.body.appendChild(host);
    }
    var t = U.el('div', 'toast' + (opts.cls ? ' ' + opts.cls : ''), msg);
    host.appendChild(t);
    VCF.fx.reveal(t);
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ t.remove(); }, 350);
    }, opts.ms || 2600);
  },

  // Floating "+20 XP" near a screen point (px coordinates).
  xpFloat: function(x, y, text){
    if (reduced()) return;
    var n = U.el('div', 'xp-float', U.esc(text));
    n.style.left = Math.round(x) + 'px';
    n.style.top = Math.round(y) + 'px';
    document.body.appendChild(n);
    setTimeout(function(){ n.remove(); }, 1200);
  },

  // Share: native sheet on mobile, copy-link + toast everywhere else.
  share: function(text){
    var url = location.href.split('#')[0];
    text = text || 'Learning to build with AI — 377 flashcards, streaks and a very bouncy robot.';
    if (navigator.share){
      navigator.share({ title: 'Vibe Coder Flashcards', text: text, url: url }).catch(function(){});
    } else {
      VCF.util.copyText(text + ' ' + url).then(function(ok){
        VCF.fx.toast(ok ? '<b>Link copied!</b> Send it to a friend' : 'Could not copy — the app URL is in your address bar');
      });
    }
    VCF.audio.play('pop');
    VCF.haptics.tap();
  },

  // Screen-swap helper: View Transitions API when available, else just run.
  transition: function(update){
    if (!reduced() && document.startViewTransition){
      document.startViewTransition(update);
    } else {
      update();
    }
  }
};
})();
