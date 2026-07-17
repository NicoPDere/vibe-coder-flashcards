// Vibration wrapper — garnish only. iOS Safari has no navigator.vibrate; every
// call is a silent no-op there.
(function(){
function buzz(pattern){
  if (!navigator.vibrate) return;
  if (!VCF.store.state || !VCF.store.state.settings.haptics) return;
  try { navigator.vibrate(pattern); } catch(e){}
}

VCF.haptics = {
  tap:     function(){ buzz(10); },
  success: function(){ buzz([15, 30, 15]); },
  fail:    function(){ buzz(40); },
  heavy:   function(){ buzz([10, 20, 40]); }
};
})();
