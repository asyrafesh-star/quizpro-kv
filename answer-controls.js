// A selected answer is confirmed only by the server, never by the tap alone.
let playerAnswerPending=null,playerAnswerError='',playerClockOffset=0;
function studentNow(){return Date.now()+playerClockOffset;}
function renderPlayerQuestion(q,ps,phase){
  if(Number(q.no)!==Number(currentPlayerQuestion)||!$('countdown')){
    if(Number(q.no)!==Number(currentPlayerQuestion)){selectedChoice='';playerAnswerPending=null;playerAnswerError='';}
    currentPlayerQuestion=Number(q.no);lastPlayerVibrationSecond=null;playerVibrationFinished=false;
    if(playerCountdownTimer){clearInterval(playerCountdownTimer);playerCountdownTimer=null;}
    const symbols={A:'▲',B:'◆',C:'●',D:'■'},symbolNames={A:'segitiga',B:'berlian',C:'bulatan',D:'petak'};
    $('playerContent').innerHTML=`<p class="phone-question-number">SOALAN ${q.position||q.no} / ${q.total}</p><h2 class="phone-question">${esc(q.question)}</h2>${questionImageMarkup(q.image,'student',q.no)}<div class="timer center" id="countdown"></div><div class="student-answer-grid">${['A','B','C','D'].map(k=>`<button class="student-letter choice-${k}" id="opt${k}" aria-label="Pilihan ${k}, ${symbolNames[k]}: ${esc(q[k])}" onclick="answer('${k}',${q.no})"><span class="phone-choice-key" aria-hidden="true">${symbols[k]}</span><span class="phone-choice-text">${esc(q[k])}</span></button>`).join('')}</div><div id="answerFeedback" role="status" aria-live="polite"></div>`;
  }
  playerTimerPhase=phase;playerTimerPaused=!!q.paused;
  const confirmed=Number(ps.currentQuestion)===Number(q.no)?String(ps.currentChoice||''):'';
  if(confirmed){selectedChoice=confirmed;playerAnswerPending=null;playerAnswerError='';}
  if(phase==='reveal'){
    const correctChoice=['A','B','C','D'].includes(String(q.correct||''))?String(q.correct):'';
    const answerSymbols={A:'▲',B:'◆',C:'●',D:'■'},answerChoice=selectedChoice||confirmed;
    const revealMessage=correctChoice
      ? `Jawapan betul: ${answerSymbols[correctChoice]} ${q[correctChoice]}. ${answerChoice?(answerChoice===correctChoice?'Jawapan anda betul!':`Jawapan anda ${answerSymbols[answerChoice]} salah.`):'Anda tidak menjawab.'}`
      : 'Jawapan sedang dikemas kini.';
    setAnswerState('reveal',answerChoice,revealMessage,correctChoice);
  }else if(selectedChoice)setAnswerState('selected',selectedChoice,'✓ Jawapan disahkan dan disimpan oleh server.');
  else if(q.paused)setAnswerState('paused','','Kuiz dijeda oleh cikgu. Tunggu untuk menyambung.');
  else if(playerAnswerPending?.questionNo===Number(q.no))setAnswerState('sending',playerAnswerPending.choice,'Sedang menghantar jawapan… tunggu pengesahan.');
  else if(q.endsAt&&studentNow()>=q.endsAt)setAnswerState('expired','','Masa tamat. Tunggu soalan seterusnya.');
  else setAnswerState(playerAnswerError?'retry':'open','',playerAnswerError||'Pilih satu jawapan.');
  playerTimerStartedAt=Number(q.startedAt)||0;
  const timer=$('countdown'),showTimer=phase==='question'&&(q.paused||!q.endsAt||studentNow()<q.endsAt);
  if(timer){timer.hidden=!showTimer;if(showTimer)timer.style.removeProperty('display');else timer.style.setProperty('display','none','important');}
  if(showTimer)startPlayerCountdown(q.no,q.endsAt,phase,q.seconds,q.paused,q.pausedRemainingMs,q.revealSeconds);
  else if(playerCountdownTimer){clearInterval(playerCountdownTimer);playerCountdownTimer=null;}
}
function setAnswerState(state,choice,message,correctChoice=''){
  if(state==='expired'||state==='reveal'){const timer=$('countdown');if(timer){timer.hidden=true;timer.style.setProperty('display','none','important');}if(playerCountdownTimer){clearInterval(playerCountdownTimer);playerCountdownTimer=null;}}
  const locked=['selected','locked','correct','expired','sending','paused','reveal'].includes(state);
  ['A','B','C','D'].forEach(k=>{const button=$('opt'+k);if(!button)return;
    button.classList.toggle('selected',['selected','locked','sending','reveal'].includes(state)&&k===choice);
    button.classList.toggle('correct',(state==='correct'&&k===choice)||(state==='reveal'&&k===correctChoice));button.classList.toggle('expired',state==='expired');
    button.disabled=locked;
  });
  const feedback=$('answerFeedback');if(feedback&&message){feedback.textContent=message;feedback.className='status'+(state==='retry'?' error':'');}
}
async function answer(choice,qNo){
  qNo=Number(qNo);if(qNo!==Number(currentPlayerQuestion)||selectedChoice||playerAnswerPending)return;
  if(playerTimerPaused){setAnswerState('paused','','Kuiz sedang dijeda.');return;}
  if(playerTimerPhase!=='question'||!playerTimerEndsAt||studentNow()>=playerTimerEndsAt){setAnswerState('expired','','Masa menjawab telah tamat.');return;}
  // Capture the server-synchronized clock at the tap, before any network work.
  const tappedAt=studentNow();
  const request={questionNo:qNo,choice,code:sessionCode,playerId,tappedAt,startedAt:playerTimerStartedAt,endsAt:playerTimerEndsAt};playerAnswerPending=request;playerAnswerError='';
  setAnswerState('sending',choice,'Sedang menghantar jawapan… tunggu pengesahan.');
  try{
    let confirmationTimer;
    const confirmation=call('submitAnswer',request.code,request.playerId,choice,qNo,request.tappedAt,request.startedAt,request.endsAt);
    const timeout=new Promise((_,reject)=>{confirmationTimer=setTimeout(()=>reject(new Error('Pengesahan lambat. Menyemak rekod; cuba semula selagi masa masih ada.')),10000);});
    let result;
    try{result=await Promise.race([confirmation,timeout]);}finally{clearTimeout(confirmationTimer);}
    if(playerAnswerPending!==request||qNo!==Number(currentPlayerQuestion)||request.playerId!==playerId||request.code!==sessionCode)return;
    if(!result?.ok||Number(result.questionNo)!==qNo)throw new Error('Server belum mengesahkan jawapan ini.');
    selectedChoice=result.choice||choice;playerAnswerPending=null;playerAnswerError='';setAnswerState('selected',selectedChoice,'✓ Jawapan disahkan dan disimpan oleh server.');pollPlayer();
  }catch(e){
    if(playerAnswerPending!==request||qNo!==Number(currentPlayerQuestion))return;playerAnswerPending=null;if(selectedChoice)return;
    const closed=playerTimerPhase!=='question'||studentNow()>=playerTimerEndsAt||/tamat|belum bermula|soalan telah berubah/i.test(String(e.message));
    if(closed)setAnswerState('expired','','Masa tamat atau soalan telah berubah. Menyemak rekod server…');
    else if(playerTimerPaused)setAnswerState('paused','','Kuiz dijeda. Tunggu cikgu menyambung.');
    else{playerAnswerError='Penghantaran belum dapat disahkan. Tekan jawapan sekali lagi selagi masa masih ada. '+String(e.message||'');setAnswerState('retry','',playerAnswerError);}
    pollPlayer();
  }
}
