/* Gentle, locally generated piano-style voices. No external audio requests. */
const pianoProgression = [[60,64,67,72,67,64,67,64],[57,60,64,69,64,60,64,60],[53,57,60,65,60,57,60,57],[55,59,62,67,62,59,62,59]];
function pianoContext(engine) {
  if(!engine.context){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Pelayar ini tidak menyokong audio.');engine.context=new AC();}
  return engine.context;
}
function pianoNote(ctx,midi,when,volume=.12) {
  const frequency=440*Math.pow(2,(midi-69)/12);
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2400;filter.Q.value=.35;
  const envelope=ctx.createGain();envelope.gain.setValueAtTime(0,when);envelope.gain.linearRampToValueAtTime(volume,when+.009);envelope.gain.exponentialRampToValueAtTime(.025*volume,when+1.7);envelope.gain.linearRampToValueAtTime(0,when+2.3);
  filter.connect(envelope).connect(ctx.destination);
  [1,2,3,4].forEach((harmonic,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=frequency*harmonic;gain.gain.value=[.75,.16,.055,.018][i];osc.connect(gain).connect(filter);osc.start(when);osc.stop(when+2.35);});
}
async function toggleSuspenseMusic(kind) {
  const engine=musicEngines[kind];
  try {const ctx=pianoContext(engine);engine.enabled=!engine.enabled;engine.lastTick=0;engine.note=0;
    if(engine.enabled)await ctx.resume();else await ctx.suspend();
    const button=$(kind==='projector'?'soundToggle':'playerMusicToggle');if(button)button.textContent=engine.enabled?'Piano: ON':'Piano: OFF';
  }catch(e){engine.enabled=false;notice(e.message,true);}
}
function musicPulse(kind,remaining,total,paused,active) {
  const engine=musicEngines[kind];if(!engine.enabled||!engine.context)return;
  if(!active||paused||remaining<=0){if(engine.context.state==='running')engine.context.suspend();return;}
  if(engine.context.state==='suspended')engine.context.resume();
  const tick=performance.now();if(tick-engine.lastTick<620)return;engine.lastTick=tick;
  const step=engine.note||0,notes=pianoProgression[Math.floor(step/8)%4];pianoNote(engine.context,notes[step%8],engine.context.currentTime,.11);engine.note=step+1;
}
let pianoPreviewContext=null,pianoPreviewTimer=null;
async function previewPiano(){
  const button=document.getElementById('pianoPreview');
  if(pianoPreviewContext){await pianoPreviewContext.close();pianoPreviewContext=null;clearTimeout(pianoPreviewTimer);button.textContent='Dengar contoh';return;}
  try {const engine={};const ctx=pianoContext(engine);pianoPreviewContext=ctx;await ctx.resume();button.textContent='Hentikan contoh';
    pianoProgression.slice(0,2).flat().forEach((note,i)=>pianoNote(ctx,note,ctx.currentTime+i*.62,.11));
    pianoPreviewTimer=setTimeout(async()=>{if(pianoPreviewContext===ctx){await ctx.close();pianoPreviewContext=null;button.textContent='Dengar contoh';}},12000);
  }catch(e){button.textContent='Dengar contoh';if(typeof notice==='function')notice(e.message,true);}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&pianoPreviewContext){pianoPreviewContext.close();pianoPreviewContext=null;clearTimeout(pianoPreviewTimer);const b=document.getElementById('pianoPreview');if(b)b.textContent='Dengar contoh';}});
