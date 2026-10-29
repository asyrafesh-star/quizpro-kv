// A selected answer is confirmed only by the server, never by the tap alone.
let playerAnswerPending=null,playerAnswerError='',playerClockOffset=0;
function studentNow(){return Date.now()+playerClockOffset;}
function renderPlayerQuestion(q,ps,phase){
  if(Number(q.no)!==Number(currentPlayerQuestion)||!$('countdown')){
    if(Number(q.no)!==Number(currentPlayerQuestion)){selectedChoice='';playerAnswerPending=null;playerAnswerError='';}
    currentPlayerQuestion=Number(q.no);lastPlayerVibrationSecond=null;playerVibrationFinished=false;
    if(playerCountdownTimer){clearInterval(playerCountdownTimer);playerCountdownTimer=null;}
    const symbols={A:'▲',B:'◆',C:'●',D:'■'};
    $('playerContent').innerHTML=`<p class="muted center">SOALAN ${q.no} / ${q.total}</p><div class="timer center" id="countdown"></div><div class="student-answer-grid">${['A','B','C','D'].map(k=>`<button class="student-letter choice-${k}" id="opt${k}" aria-label="Jawapan ${k}" onclick="answer('${k}',${q.no})">${symbols[k]}</button>`).join('')}</div><div id="answerFeedback" role="status" aria-live="polite"></div>`;
  }
  playerTimerPhase=phase;playerTimerPaused=!!q.paused;
  const confirmed=Number(ps.currentQuestion)===Number(q.no)?String(ps.currentChoice||''):'';
  if(confirmed){selectedChoice=confirmed;playerAnswerPending=null;playerAnswerError='';}
  if(phase==='reveal'){
    const result=ps.lastResult&&Number(ps.lastResult.questionNo)===Number(q.no)?ps.lastResult:null;
    if(selectedChoice&&result?.correct)setAnswerState('correct',selectedChoice,'Jawapan anda betul.');
    else if(selectedChoice)setAnswerState('locked',selectedChoice,result?'Jawapan anda salah. Jawapan disimpan; lihat jawapan betul pada projector.':'Jawapan anda telah disimpan. Keputusan dipaparkan pada projector.');
    else setAnswerState('expired','','Masa tamat. Tiada jawapan direkodkan untuk soalan ini.');
  }else if(selectedChoice)setAnswerState('selected',selectedChoice,'✓ Jawapan disahkan dan disimpan oleh server.');
  else if(q.paused)setAnswerState('paused','','Kuiz dijeda oleh cikgu. Tunggu untuk menyambung.');
  else if(playerAnswerPending?.questionNo===Number(q.no))setAnswerState('sending',playerAnswerPending.choice,'Sedang menghantar jawapan… tunggu pengesahan.');
  else if(q.endsAt&&studentNow()>=q.endsAt)setAnswerState('expired','','Masa tamat. Tunggu soalan seterusnya.');
  else setAnswerState(playerAnswerError?'retry':'open','',playerAnswerError||'Pilih satu jawapan.');
  startPlayerCountdown(q.no,q.endsAt,phase,q.seconds,q.paused,q.pausedRemainingMs,q.revealSeconds);
}
function setAnswerState(state,choice,message){
  const locked=['selected','locked','correct','expired','sending','paused'].includes(state);
  ['A','B','C','D'].forEach(k=>{const button=$('opt'+k);if(!button)return;
    button.classList.toggle('selected',['selected','locked','sending'].includes(state)&&k===choice);
    button.classList.toggle('correct',state==='correct'&&k===choice);button.classList.toggle('expired',state==='expired');
    button.disabled=locked;
  });
  const feedback=$('answerFeedback');if(feedback&&message){feedback.textContent=message;feedback.className='status'+(state==='retry'?' error':'');}
}
async function answer(choice,qNo){
  qNo=Number(qNo);if(qNo!==Number(currentPlayerQuestion)||selectedChoice||playerAnswerPending)return;
  if(playerTimerPaused){setAnswerState('paused','','Kuiz sedang dijeda.');return;}
  if(playerTimerPhase!=='question'||!playerTimerEndsAt||studentNow()>=playerTimerEndsAt){setAnswerState('expired','','Masa menjawab telah tamat.');return;}
  const request={questionNo:qNo,choice,code:sessionCode,playerId};playerAnswerPending=request;playerAnswerError='';
  setAnswerState('sending',choice,'Sedang menghantar jawapan… tunggu pengesahan.');
  try{
    const result=await call('submitAnswer',request.code,request.playerId,choice,qNo);
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

