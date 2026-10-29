function savePlayerResume(){try{localStorage.setItem('quizproResume',JSON.stringify({code:sessionCode,playerId,name:playerName}));}catch(e){}}
function switchQuizPlayer(){
  try{localStorage.removeItem('quizproResume');}catch(e){}
  if(poller)clearInterval(poller);poller=null;if(playerCountdownTimer)clearInterval(playerCountdownTimer);playerCountdownTimer=null;
  playerId='';playerName='';currentPlayerQuestion=0;selectedChoice='';playerAnswerPending=null;playerAnswerError='';$('studentId').value='';$('studentName').value='';document.getElementById('resumeCard')?.remove();showView('student');notice('Masukkan IC pelajar yang hendak menggunakan peranti ini.');
}
const switchPlayerButton=document.createElement('button');switchPlayerButton.type='button';switchPlayerButton.className='secondary';switchPlayerButton.textContent='Tukar pelajar';switchPlayerButton.addEventListener('click',switchQuizPlayer);$('playerView').querySelector('.brand').append(switchPlayerButton);
let resumeBusy=false;
function storedPlayerResume(){try{return JSON.parse(localStorage.getItem('quizproResume')||'null');}catch(e){return null;}}
function offerPlayerResume(){
  const params=new URLSearchParams(location.search);if(['admin','projector'].includes(params.get('view')||params.get('route')||params.get('mode')))return;
  const saved=storedPlayerResume();if(!saved?.code||!saved.playerId||params.get('join')&&params.get('join')!==saved.code)return;
  let card=document.createElement('section');card.id='resumeCard';card.className='card';card.innerHTML='<div class="pill">PERMAINAN TERSIMPAN</div><h2 style="margin-top:12px">Sambung permainan anda</h2><p id="resumeName"></p><p class="muted">Jawapan dan markah sebelum ini dikekalkan. Tidak perlu isi kod atau IC semula.</p><button id="continueGame">Sambung permainan</button><button id="resumeSwitch" class="secondary">Tukar pelajar</button><p id="resumeStatus" class="muted" aria-live="polite"></p>';
  $('homeView').before(card);$('resumeName').textContent=saved.name||'Pelajar';$('continueGame').addEventListener('click',resumeSavedPlayer);$('resumeSwitch').addEventListener('click',switchQuizPlayer);
}
async function resumeSavedPlayer(){
  if(resumeBusy)return;const saved=storedPlayerResume();if(!saved)return;resumeBusy=true;const button=$('continueGame'),status=$('resumeStatus');if(button)button.disabled=true;if(status)status.textContent='Menyambung ke sesi tersimpan…';
  try{
    // A tap also permits piano playback under browser audio rules.
    if(!musicEngines.player.enabled)await toggleSuspenseMusic('player');
    const ps=await call('playerStatus',saved.code,saved.playerId);
    if(!ps.valid){if(status)status.textContent='Sesi tersimpan tidak lagi aktif. Sertai sesi baharu menggunakan kod cikgu.';return;}
    if(['finished','idle'].includes(ps.status)){if(status)status.textContent='Kuiz ini sudah tamat. Sertai sesi baharu apabila cikgu memberi kod.';return;}
    sessionCode=saved.code;playerId=ps.playerId||saved.playerId;playerName=ps.name||saved.name;currentPlayerQuestion=0;selectedChoice='';playerAnswerPending=null;playerAnswerError='';savePlayerResume();$('playerHeading').textContent='Hai, '+playerName;$('resumeCard')?.classList.add('hidden');showView('player');startPolling();notice('Permainan disambung. Jawapan dan markah anda dikekalkan.');
  }catch(e){if(status)status.textContent='Belum dapat menyambung. Tekan Sambung permainan untuk cuba lagi. '+String(e.message||'');}
  finally{resumeBusy=false;if(button)button.disabled=false;}
}
offerPlayerResume();
