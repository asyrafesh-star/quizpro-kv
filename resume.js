function savePlayerResume(){try{localStorage.setItem('quizproResume',JSON.stringify({code:sessionCode,playerId,name:playerName}));}catch(e){}}
function switchQuizPlayer(){
  try{localStorage.removeItem('quizproResume');}catch(e){}
  if(poller)clearInterval(poller);poller=null;if(playerCountdownTimer)clearInterval(playerCountdownTimer);playerCountdownTimer=null;
  playerId='';playerName='';currentPlayerQuestion=0;selectedChoice='';$('studentId').value='';$('studentName').value='';showView('student');notice('Masukkan IC pelajar yang hendak menggunakan peranti ini.');
}
const switchPlayerButton=document.createElement('button');switchPlayerButton.type='button';switchPlayerButton.className='secondary';switchPlayerButton.textContent='Tukar pelajar';switchPlayerButton.addEventListener('click',switchQuizPlayer);$('playerView').querySelector('.brand').append(switchPlayerButton);
async function resumeSavedPlayer(){
  const params=new URLSearchParams(location.search);if(params.get('view')==='admin'||params.get('view')==='projector')return;
  try{const saved=JSON.parse(localStorage.getItem('quizproResume')||'null');if(!saved?.code||!saved.playerId)return;if(params.get('join')&&params.get('join')!==saved.code)return;
    const ps=await call('playerStatus',saved.code,saved.playerId);if(!ps.valid){localStorage.removeItem('quizproResume');return;}
    if(playerId)return;sessionCode=saved.code;playerId=ps.playerId||saved.playerId;playerName=ps.name;currentPlayerQuestion=0;selectedChoice='';savePlayerResume();$('playerHeading').textContent='Hai, '+playerName;showView('player');startPolling();notice('Permainan disambung. Jawapan dan markah anda dikekalkan.');
  }catch(e){/* Manual IC entry remains available on network failure. */}
}
resumeSavedPlayer();
