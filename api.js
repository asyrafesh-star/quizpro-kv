// Each bridge connection gets a fresh channel; failed connections can be retried.
const quizBridge=(()=>{
  let connection=null;const pending=new Map();
  const trusted=origin=>/^https:\/\/([a-z0-9-]+[.-])?script\.googleusercontent\.com$/.test(origin)||origin==='https://script.google.com';
  function disconnect(c,error){
    if(connection!==c)return;connection=null;clearTimeout(c.timer);c.frame?.remove();
    if(!c.connected)c.reject(error);
    for(const [id,task]of pending){if(task.connection!==c)continue;clearTimeout(task.timer);pending.delete(id);task.reject(error);}
  }
  window.addEventListener('message',event=>{
    const c=connection,m=event.data;if(!c||!m||m.channel!==c.channel||!trusted(event.origin))return;
    if(m.type==='quiz-ready'&&!c.connected){c.connected=true;c.remote=event.source;c.origin=event.origin;clearTimeout(c.timer);c.resolve(c);return;}
    if(event.source!==c.remote||event.origin!==c.origin||m.type!=='quiz-result')return;
    const task=pending.get(m.id);if(!task||task.connection!==c)return;clearTimeout(task.timer);pending.delete(m.id);m.ok?task.resolve(m.data):task.reject(new Error(m.error||'Permintaan gagal.'));
  });
  function connect(){
    if(connection)return connection.promise;
    const c={channel:crypto.randomUUID(),connected:false};connection=c;
    c.promise=new Promise((resolve,reject)=>{c.resolve=resolve;c.reject=reject;});
    c.timer=setTimeout(()=>disconnect(c,new Error('Sambungan belum berjaya. Cuba semula untuk menyambung semula.')),45000);
    try{const url=new URL(window.QUIZPRO_CONFIG.apiUrl);url.searchParams.set('view','github-bridge');url.searchParams.set('channel',c.channel);c.frame=document.createElement('iframe');c.frame.hidden=true;c.frame.title='Sambungan QuizPro';c.frame.src=url.href;document.body.append(c.frame);}
    catch(e){disconnect(c,e);}
    return c.promise;
  }
  return async(fn,args)=>{
    const c=await connect();return new Promise((resolve,reject)=>{
      const id=crypto.randomUUID(),task={connection:c,resolve,reject};
      task.timer=setTimeout(()=>disconnect(c,new Error('Sambungan terputus atau permintaan terlalu lama. Semak rekod sebelum mengulang penghantaran.')),45000);pending.set(id,task);
      try{c.remote.postMessage({type:'quiz-call',channel:c.channel,id,fn,args},c.origin);}catch(e){disconnect(c,e);}
    });
  };
})();
async function call(fn,...args){const data=await quizBridge(fn,args);const site=new URL(location.href);site.search='';site.hash='';if(fn==='adminGetData'&&data)data.webAppUrl=site.href;if(fn==='adminStartSession'&&data){site.searchParams.set('join',data.code);data.url=site.href;}return data;}
