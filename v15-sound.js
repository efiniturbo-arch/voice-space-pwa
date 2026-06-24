(()=>{
  function playSpaceWake(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      const ctx=new AC();const master=ctx.createGain();master.gain.value=.028;master.connect(ctx.destination);
      const start=ctx.currentTime+.03;
      const notes=[[82,0,2.5,.12],[123,.8,2.2,.09],[164,2.1,1.9,.07],[246,3.6,1.8,.055],[329,4.7,1,.035]];
      notes.forEach(n=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(n[0],start+n[1]);o.frequency.exponentialRampToValueAtTime(n[0]*1.08,start+n[1]+n[2]);g.gain.setValueAtTime(.0001,start+n[1]);g.gain.linearRampToValueAtTime(n[3],start+n[1]+.35);g.gain.exponentialRampToValueAtTime(.0001,start+n[1]+n[2]);o.connect(g).connect(master);o.start(start+n[1]);o.stop(start+n[1]+n[2]+.04)});
      [440,660,880].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(f,start+1.1+i*.12);g.gain.setValueAtTime(.0001,start+1.1+i*.12);g.gain.linearRampToValueAtTime(.012,start+1.5+i*.12);g.gain.exponentialRampToValueAtTime(.0001,start+5.4);o.connect(g).connect(master);o.start(start+1.1+i*.12);o.stop(start+5.5)});
      setTimeout(()=>ctx.close(),7000);
    }catch(_){ }
  }
  function showNoSoundSplash(reload=true){
    if(window.voraDirectV14?.showSplash) window.voraDirectV14.showSplash({force:true,sound:false,remember:false,reload});
  }
  async function update(e){
    const btn=e.target?.closest?.('#updateAppButton'); if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{if('serviceWorker'in navigator){const r=await navigator.serviceWorker.getRegistration();await r?.update()}if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('voice-events-pwa-')).map(k=>caches.delete(k)))}}catch(_){ }
    playSpaceWake();showNoSoundSplash(true);
  }
  document.addEventListener('click',update,true);
  window.voraSpaceWakeSound=playSpaceWake;
})();