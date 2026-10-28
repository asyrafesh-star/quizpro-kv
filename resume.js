function savePlayerResume(){try{localStorage.setItem('quizproResume',JSON.stringify({code:sessionCode,playerId,name:playerName}));}catch(e){}}
async function resumeSavedPlayer(){
  const params=new URLSearchParams(location.search);if(params.get('view')==='admin'||params.get('view')==='projector')return;
  try{const saved=JSON.parse(localStorage.getItem('quizproResume')||'null');if(!saved?.code||!saved.playerId)return;if(params.get('join')&&params.get('join')!==saved.code)return;
    const ps=await call('playerStatus',saved.code,saved.playerId);if(!ps.valid){localStorage.removeItem('quizproResume');return;}
    sessionCode=saved.code;playerId=ps.playerId||saved.playerId;playerName=ps.name;currentPlayerQuestion=0;selectedChoice='';savePlayerResume();$('playerHeading').textContent='Hai, '+playerName;showView('player');startPolling();notice('Permainan disambung. Jawapan dan markah anda dikekalkan.');
  }catch(e){/* Manual IC entry remains available on network failure. */}
}
resumeSavedPlayer();
