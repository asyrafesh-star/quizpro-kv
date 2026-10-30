// Only question state and answers use Firebase. IC numbers stay in Apps Script/Sheets.
const quizRealtime=(()=>{
  let sdkPromise,auth,db,active=null,stops=[],offset=0,unwatchOffset;
  const config={apiKey:'AIzaSyDsLcMZtnge0eLl9IX2ZUIXaRXnfixg70M',authDomain:'quizpro-kv.firebaseapp.com',projectId:'quizpro-kv',databaseURL:'https://quizpro-kv-default-rtdb.asia-southeast1.firebasedatabase.app',appId:'1:897822705409:web:2147b1d6720e80c5357d00'};
  async function sdk(){
    if(!sdkPromise)sdkPromise=(async()=>{
      const [app,a,d]=await Promise.all(['firebase-app','firebase-auth','firebase-database'].map(name=>import('https://www.gstatic.com/firebasejs/12.4.0/'+name+'.js')));
      const instance=app.initializeApp(config,'quizpro-live');auth=a.getAuth(instance);db=d.getDatabase(instance);
      await a.setPersistence(auth,a.browserLocalPersistence);await auth.authStateReady();
      if(!auth.currentUser)await a.signInAnonymously(auth);
      unwatchOffset=d.onValue(d.ref(db,'.info/serverTimeOffset'),s=>{offset=Number(s.val())||0;});return{a,d};
    })().catch(e=>{sdkPromise=null;throw e;});return sdkPromise;
  }
  async function token(){await sdk();return auth.currentUser.getIdToken();}
  function stop(){stops.forEach(fn=>fn());stops=[];active=null;}
  async function attach(code,id,name){
    await sdk();if(active?.code===code&&active?.id===id)return;stop();
    const {d}=await sdk(),entry={code,id,name,state:null,answers:{},pending:new Set(),error:null,connected:false};active=entry;
    const failed=e=>{if(active===entry)entry.error=e;};
    const listen=(path,fn)=>stops.push(d.onValue(d.ref(db,path),s=>{if(active===entry){entry.error=null;fn(s.val());}},failed));
    listen('sessions/'+code+'/state',value=>{entry.state=value;if(typeof pollPlayer==='function')pollPlayer();});
    listen('sessions/'+code+'/answers/'+auth.currentUser.uid,value=>{entry.answers=Object.fromEntries(Object.entries(value||{}).filter(([no])=>!entry.pending.has(no)));if(typeof pollPlayer==='function')pollPlayer();});
    listen('.info/connected',value=>{entry.connected=value===true;});
  }
  async function snapshot(code,id){
    if(!active||active.code!==code||active.id!==id)throw new Error('Sambungan Firebase belum disediakan.');
    if(active.error)throw active.error;
    if(!active.state)throw new Error('Menunggu soalan daripada cikgu…');
    const state=active.state,answer=active.answers[String(state.currentQuestion)];
    return{state,player:{valid:true,playerId:id,name:active.name,status:state.status,currentQuestion:state.currentQuestion,currentChoice:answer?.choice||'',answeredCurrent:!!answer},serverNow:Date.now()+offset};
  }
  async function submit(code,id,choice,no){
    const {d}=await sdk();if(!active||active.code!==code||active.id!==id)throw new Error('Sambungan telefon berubah.');
    if(!active.connected)throw new Error('Internet terputus. Sambung semula sebelum menghantar jawapan.');
    const state=active.state,q=state?.question,old=active.answers[String(no)];
    if(old)return{ok:true,already:true,questionNo:Number(no),choice:old.choice};
    if(state?.status!=='question'||q?.paused||Number(q?.no)!==Number(no)||Date.now()+offset>=q.endsAt)throw new Error('Masa tamat atau soalan telah berubah.');
    const entry=active,key=String(Number(no)),path=d.ref(db,'sessions/'+code+'/answers/'+auth.currentUser.uid+'/'+Number(no));entry.pending.add(key);
    try{await d.set(path,{choice,at:d.serverTimestamp(),start:q.startedAt});entry.answers[key]={choice};}
    catch(e){const saved=await d.get(path);if(saved.exists()){entry.answers[key]=saved.val();return{ok:true,already:true,questionNo:Number(no),choice:saved.val().choice};}throw e;}
    finally{entry.pending.delete(key);}
    return{ok:true,questionNo:Number(no),choice};
  }
  async function reset(){stop();const {a}=await sdk();await a.signOut(auth);await a.signInAnonymously(auth);}
  return{token,attach,snapshot,submit,reset,stop,active:()=>active};
})();
