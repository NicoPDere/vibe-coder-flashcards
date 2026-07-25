// WebAudio-synthesized SFX — no audio files. Context created lazily on first
// user gesture (iOS requires this) and resumed before every play.
(function(){
var ctx = null;
var unlocked = false;

function getCtx(){
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function unlock(){
  if (unlocked) return;
  unlocked = true;
  var c = getCtx();
  if (!c) return;
  // Play a silent buffer to fully unlock iOS audio.
  var buf = c.createBuffer(1, 1, 22050);
  var src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  try { src.start(0); } catch(e){}
}
document.addEventListener('pointerdown', unlock, { once: true, capture: true });

// One oscillator note. slide = target frequency to glide to over the duration.
function tone(opts){
  var c = getCtx();
  if (!c) return;
  var t0 = c.currentTime + (opts.delay || 0);
  var osc = c.createOscillator();
  var g = c.createGain();
  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.slide), t0 + opts.dur);
  var vol = opts.vol != null ? opts.vol : 0.18;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + (opts.attack || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + opts.dur + 0.05);
}

// Filtered noise burst (swooshes, pops).
function noise(opts){
  var c = getCtx();
  if (!c) return;
  var t0 = c.currentTime + (opts.delay || 0);
  var dur = opts.dur || 0.15;
  var frames = Math.max(1, Math.floor(c.sampleRate * dur));
  var buf = c.createBuffer(1, frames, c.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  var src = c.createBufferSource();
  src.buffer = buf;
  var f = c.createBiquadFilter();
  f.type = opts.filter || 'bandpass';
  f.frequency.setValueAtTime(opts.freq || 1200, t0);
  if (opts.slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, opts.slide), t0 + dur);
  f.Q.value = opts.q || 1.2;
  var g = c.createGain();
  var vol = opts.vol != null ? opts.vol : 0.12;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start(t0);
}

// C-major pentatonic for combo pitches — always sounds musical.
var PENTA = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0];

var SFX = {
  flip:    function(){ noise({ freq: 900, slide: 2400, dur: 0.12, vol: 0.07, q: 2 }); },
  swoosh:  function(){ noise({ freq: 400, slide: 1800, dur: 0.22, vol: 0.09, q: 1 }); },
  swooshBack: function(){ noise({ freq: 1800, slide: 320, dur: 0.22, vol: 0.045, q: 1 }); },
  pop:     function(){ tone({ freq: 320, slide: 620, dur: 0.09, type: 'triangle', vol: 0.2 }); },
  tap:     function(){ tone({ freq: 700, dur: 0.05, type: 'sine', vol: 0.07 }); },
  select:  function(){ tone({ freq: 523.25, dur: 0.08, type: 'triangle', vol: 0.13 });
                       tone({ freq: 783.99, dur: 0.12, type: 'sine', vol: 0.09, delay: 0.045 }); },
  // Light, high chirp — audible but soft, never low/froggy.
  boing:   function(){ tone({ freq: 780, slide: 1560, dur: 0.13, type: 'triangle', vol: 0.09 });
                       tone({ freq: 1560, slide: 1180, dur: 0.1, type: 'sine', vol: 0.055, delay: 0.1 }); },
  toggleOn:  function(){ tone({ freq: 440, dur: 0.07, type: 'sine', vol: 0.12 });
                         tone({ freq: 659.25, dur: 0.11, type: 'sine', vol: 0.12, delay: 0.06 }); },
  toggleOff: function(){ tone({ freq: 659.25, dur: 0.07, type: 'sine', vol: 0.12 });
                         tone({ freq: 440, dur: 0.11, type: 'sine', vol: 0.1, delay: 0.06 }); },
  correct: function(){ tone({ freq: 659.25, dur: 0.12, type: 'sine', vol: 0.16 });
                       tone({ freq: 987.77, dur: 0.2, type: 'sine', vol: 0.14, delay: 0.09 }); },
  wrong:   function(){ tone({ freq: 196, dur: 0.22, type: 'sawtooth', vol: 0.08 });
                       tone({ freq: 185, dur: 0.26, type: 'sawtooth', vol: 0.06, delay: 0.02 }); },
  combo:   function(n){ var f = PENTA[Math.min(PENTA.length - 1, Math.max(0, (n || 1) - 1))];
                        tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.16 });
                        tone({ freq: f * 2, dur: 0.1, type: 'sine', vol: 0.05, delay: 0.03 }); },
  tick:    function(){ tone({ freq: 1250, dur: 0.04, type: 'square', vol: 0.045 }); },
  timeup:  function(){ tone({ freq: 440, dur: 0.25, type: 'triangle', vol: 0.15 });
                       tone({ freq: 330, dur: 0.4, type: 'triangle', vol: 0.15, delay: 0.2 }); },
  match:   function(){ tone({ freq: 523.25, dur: 0.14, vol: 0.14 });
                       tone({ freq: 783.99, dur: 0.22, vol: 0.12, delay: 0.06 }); },
  badge:   function(){ [659.25, 830.61, 987.77, 1318.5].forEach(function(f, i){
                         tone({ freq: f, dur: 0.3, type: 'sine', vol: 0.12, delay: i * 0.09 });
                       }); noise({ freq: 5000, dur: 0.35, vol: 0.03, delay: 0.3, q: 0.6 }); },
  levelup: function(){ [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function(f, i){
                         tone({ freq: f, dur: 0.35, type: 'triangle', vol: 0.13, delay: i * 0.08 });
                       });
                       tone({ freq: 2093, dur: 0.5, type: 'sine', vol: 0.06, delay: 0.42 }); }
};

VCF.audio = {
  play: function(name, arg){
    if (!VCF.store.state || !VCF.store.state.settings.sound) return;
    var fn = SFX[name];
    if (!fn) return;
    try { fn(arg); } catch(e){}
  },
  setMuted: function(muted){
    VCF.store.state.settings.sound = !muted;
    VCF.store.save();
  },
  isMuted: function(){ return !VCF.store.state.settings.sound; }
};
})();
