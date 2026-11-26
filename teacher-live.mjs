import {connect} from './race-live.mjs?v=competition20261125';
import {competitionRows} from './competition-model.mjs?v=competition20261125';
const $=id=>document.getElementById(id);
let filterStamp="";
let room,stamp='',busy=false;
$('code').value=new URLSearchParams(location.search).get('code')||'';
function cell(text,css){const td=document.createElement('td');td.textContent=text;if(css)td.className=css;return td;}
function paint(value){
 room=value;
 $('connection').textContent=value.error?'Sambungan bermasalah':value.connected?'● Live disambungkan':'○ Menyambung semula';
 $('connection').dataset.ok=String(value.connected&&!value.error);
 if(!value.state)return;
 $('dashboard').hidden=false;
 $('sessionTitle').textContent=(value.bank?.title||'Perlumbaan kelas')+' · '+value.code;
 $('sessionStatus').textContent=({waiting:'Menunggu mula',running:'Sedang berlangsung',finished:'Sesi tamat'})[value.state.status]||'Menunggu data';
 const questions=value.bank?.questions||[];
 const qs=JSON.stringify(questions.map(q=>q.id));
 if(qs!==filterStamp){filterStamp=qs;$('questionFilter').replaceChildren(new Option('Keseluruhan kuiz',''),...questions.map((q,i)=>new Option('Soalan '+(i+1),q.id)));}
 const profiles=value.profiles||{},all=Object.entries(value.runners||{});
 const ready=all.filter(([uid])=>profiles[uid]?.readyAt);
 const waiting=all.filter(([uid])=>!profiles[uid]?.readyAt);
 for(const [id,list] of [['readyNames',ready],['waitingNames',waiting]])$(id).replaceChildren(...list.map(([uid])=>{const li=document.createElement('li');li.textContent=profiles[uid]?.name||'Pelari';return li;}));
 $('readyCount').textContent=ready.length+' telah bersedia · '+waiting.length+' sudah buka tetapi belum bersedia';
 const rows=competitionRows(Object.fromEntries(ready),profiles,questions,$('questionFilter').value||null).map(row=>({...row,displayRank:row.rank,score:row.quizPoints,correct:row.firstCorrect,wrong:row.answered-row.firstCorrect,attempts:value.runners[row.uid]?.attempts||0,remaining:Math.max(0,(value.state.total||questions.length)-row.progress),average:row.firstCorrect?row.responseMs/row.firstCorrect:null,duration:row.finishedAt?row.finishedAt-value.state.startedAt:null}));
 if($('order').value==='score')rows.sort((a,b)=>b.score-a.score||a.rank-b.rank);
 $('liveTrack').replaceChildren(...rows.map(row=>{
  const card=document.createElement('div');card.className='track-person';
  const name=document.createElement('p');name.textContent='#'+row.rank+' '+row.name;name.title=row.name;
  const rail=document.createElement('div');rail.className='rail';const dot=document.createElement('span');dot.className='race-dot';dot.textContent=row.name.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join('');dot.title=row.name+' · '+row.progress+'/'+value.state.total;
  dot.style.left=Math.max(0,Math.min(100,row.progress/(value.state.total||1)*100))+'%';rail.append(dot);card.append(name,rail);return card;
 }));
 const fingerprint=JSON.stringify([rows,value.state.status,$('order').value]);
 if(stamp===fingerprint)return;stamp=fingerprint;
 const finished=rows.filter(row=>row.finishedAt).length;
 $('joined').textContent=rows.length;$('finished').textContent=finished;
 $('playing').textContent=value.state.status==='running'?rows.length-finished:0;
 $('highest').textContent=rows.length?Math.max(...rows.map(row=>row.score)):0;
 $('rankNote').textContent=$('order').value==='score'?'Disusun mengikut markah tertinggi. Kedudukan perlumbaan tidak berubah.':'Disusun mengikut kedudukan perlumbaan semasa.';
 $('rows').replaceChildren(...rows.map(row=>{
  const tr=document.createElement('tr');
  tr.append(cell(row.displayRank),cell(row.name,'name'),cell(row.score,'score'),cell((row.index/1000).toFixed(2)),cell(row.coins),cell(row.correct),cell(row.wrong),cell(row.attempts),cell(row.remaining),cell(row.average===null?'—':(row.average/1000).toFixed(2)+' s'));
  const progress=cell(''),bar=document.createElement('progress');bar.max=value.state.total||1;bar.value=row.progress;bar.setAttribute('aria-label',row.progress+' daripada '+bar.max+' dilepasi');progress.append(bar,document.createTextNode(' '+row.progress+'/'+bar.max));tr.append(progress);
  const status=cell(''),badge=document.createElement('span');badge.className='status'+(row.finishedAt?' done':'');
  badge.textContent=row.finishedAt?'🏁 '+(row.duration/1000).toFixed(1)+' s':value.state.status==='finished'?'Sesi tamat':value.state.status==='waiting'?'Menunggu mula':'Belum tamat';status.append(badge);tr.append(status);return tr;
 }));
 $('empty').hidden=rows.length>0;
 $('updated').textContent='Data terakhir · '+new Date().toLocaleTimeString('ms-MY');
}
$('questionFilter').onchange=()=>{if(room){stamp='';paint(room);}};
$('order').onchange=()=>{if(room){stamp='';paint(room);}};
$('connectForm').onsubmit=async event=>{
 event.preventDefault();if(busy)return;busy=true;$('connect').disabled=true;$('message').textContent='Menyambungkan sesi…';
 const pin=$('pin').value,code=$('code').value.trim();
 try{room?.close();stamp='';await connect(code,'','',paint,pin);$('pin').value='';$('message').textContent='Sesi dibuka. Data akan dikemas kini secara automatik.';}
 catch(error){$('message').textContent='Sesi belum dapat dibuka: '+error.message;}
 finally{busy=false;$('connect').disabled=false;}
};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('dashboard').requestFullscreen();}catch{$('message').textContent='Skrin penuh tidak disokong pada pelayar ini.';}};
addEventListener('pagehide',event=>{if(!event.persisted)room?.close();});
