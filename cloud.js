let cloudData=null,cloudClass=sessionStorage.getItem('quizproClass')||'',cloudBusy=false,cloudGeneration=0;
function cloudStatus(text,bad=false){const el=$('cloudStatus');el.textContent=text;el.className='status'+(bad?' error':'');}
function cloudDate(value){if(!value)return 'Sesi lama';const d=new Date(value);return Number.isNaN(d.getTime())?'Sesi lama':d.toLocaleString('ms-MY',{dateStyle:'medium',timeStyle:'short'});}
async function loadCloudDashboard(){
  const data=await call('adminCloudDashboard',pin);cloudData=data;
  if(!data.classes.some(c=>c.id===cloudClass))cloudClass='';
  renderCloudDashboard();if(cloudClass)await loadClassSummary();
}
function renderCloudDashboard(){
  if(!cloudData)return;
  $('classCards').innerHTML=cloudData.classes.map(c=>`<button class="class-tile ${cloudClass===c.id?'active':''}" onclick="selectCloudClass('${esc(c.id)}')"><span>KELAS</span><strong>${esc(c.name)}</strong><small>${cloudClass===c.id?'✓ Kelas dipilih':'Pilih kelas ini →'}</small></button>`).join('');
  const c=cloudData.classes.find(c=>c.id===cloudClass);
  $('selectedClassLabel').textContent=c?c.name:'Pilih kelas untuk bermula';
  $('cloudDriveLink').href=cloudData.spreadsheetUrl;
  $('activeCloudSession').textContent=cloudData.activeCode&& !['idle','finished'].includes(cloudData.activeStatus)?`Sesi aktif ${cloudData.activeCode} · ${cloudData.activeClassName||'Tanpa kelas'} · ${cloudData.activeStatus}`:'Tiada sesi aktif';
  const loaded=cloudData.quizzes.find(q=>q.id===cloudData.loadedQuizId);
  $('loadedQuizLabel').textContent=loaded?'Sedia: '+loaded.title:'Soalan semasa belum dipilih daripada perpustakaan';
  $('libraryList').innerHTML=cloudData.quizzes.length?cloudData.quizzes.map(q=>`<div class="quiz-item"><div><strong>${esc(q.title)}</strong><p class="muted">${q.count} soalan · ${esc(cloudDate(q.createdAt))}</p></div><button class="${q.id===cloudData.loadedQuizId?'secondary':''}" onclick="loadLibraryQuiz('${esc(q.id)}')">${q.id===cloudData.loadedQuizId?'Pilih semula':'Gunakan kuiz'}</button></div>`).join(''):'<div class="cloud-empty">Set kuiz belum disimpan. Import soalan Excel di bawah, kemudian tekan “Simpan sebagai set kuiz”.</div>';
  const sessions=cloudData.sessions.filter(s=>s.classId===cloudClass&&cloudClass);
  $('historyList').innerHTML=sessions.length?sessions.map(s=>`<div class="quiz-item"><div><strong>${esc(s.title)}</strong><p class="muted">${esc(cloudDate(s.startedAt))} · Kod ${esc(s.code)} · ${esc(s.status==='finished'?'Tamat':s.status)}</p></div><button class="secondary" onclick="viewSessionHistory('${esc(s.code)}')">Lihat keputusan</button></div>`).join(''):'<div class="cloud-empty">'+(cloudClass?'Belum ada sesi untuk kelas ini.':'Pilih kelas untuk melihat sejarah.')+'</div>';
  const legacy=cloudData.sessions.filter(s=>!s.classId);
  $('legacyHistory').innerHTML=legacy.length?`<details><summary>${legacy.length} sesi lama tanpa kelas</summary><p class="muted">Rekod ini belum dimasukkan dalam jumlah kelas. Jika pasti kelas yang betul, tetapkan sesi kepada kelas dipilih. Markah asal dikekalkan; soalan asal sesi lama tidak dapat disahkan.</p>${legacy.map(s=>`<div class="quiz-item"><button class="secondary" onclick="viewSessionHistory('${esc(s.code)}')">Sesi ${esc(s.code)}</button>${cloudClass&&s.status==='finished'?`<button onclick="assignLegacySession('${esc(s.code)}')">Masukkan ke ${esc(c.name)}</button>`:''}</div>`).join('')}</details>`:'';
}
async function selectCloudClass(id){
  cloudClass=id;sessionStorage.setItem('quizproClass',id);$('sessionHistoryDetail').innerHTML='';renderCloudDashboard();await loadClassSummary();
}
async function loadClassSummary(){
  const generation=++cloudGeneration,selected=cloudClass;
  $('classRanking').innerHTML='<p class="muted">Memuatkan markah kelas…</p>';
  try{
    const d=await call('adminClassSummary',pin,selected);if(generation!==cloudGeneration||selected!==cloudClass)return;
    $('classRosterCount').textContent=d.roster.length;$('classQuizCount').textContent=d.completedSessions;
    $('classRanking').innerHTML=rankingTable(d.ranking,true);
    $('classRoster').innerHTML=d.roster.length?`<div class="roster-chips">${d.roster.map(p=>`<span>${esc(p.name)}</span>`).join('')}</div>`:'<p class="muted">Nama pelajar akan disimpan secara automatik apabila mereka menyertai kuiz kelas ini.</p>';
  }catch(e){if(generation===cloudGeneration)cloudStatus(e.message,true);}
}
function rankingTable(list,total=false){return metricsRankingTable(list,total,true);}
async function cloudAction(action){
  if(cloudBusy)return;cloudBusy=true;document.querySelectorAll('.cloud-action').forEach(b=>b.disabled=true);
  cloudStatus('Sedang menyimpan ke cloud…');
  try{await action();await loadCloudDashboard();cloudStatus('Rekod cloud dikemas kini.');}
  catch(e){cloudStatus(e.message,true);}
  finally{cloudBusy=false;document.querySelectorAll('.cloud-action').forEach(b=>b.disabled=false);}
}
async function saveLibraryQuiz(){await cloudAction(async()=>{
  await call('adminSaveSettings',pin,{quizTitle:$('quizTitle').value,defaultSeconds:$('defaultSeconds').value,defaultPoints:$('defaultPoints').value,revealSeconds:$('revealSeconds').value,nextMode:$('nextMode').value});
  await call('adminSaveQuiz',pin,$('libraryTitle').value||$('quizTitle').value);await loadAdminData();
});}
async function loadLibraryQuiz(id){await cloudAction(async()=>{await call('adminLoadQuiz',pin,id);await loadAdminData();});}
async function viewSessionHistory(code){
  try{
    const d=await call('adminSessionHistory',pin,code);
    $('sessionHistoryDetail').innerHTML=`<div class="history-detail"><div class="pill">${esc(d.className)} · ${esc(d.code)}</div><h3>${esc(d.title)}</h3>${rankingTable(d.ranking)}${d.legacy?'<p class="muted">Soalan asal tidak tersedia untuk sesi lama ini.</p>':`<details><summary>Salinan asal ${d.questions.length} soalan</summary>${d.questions.map(q=>`<p><b>${q.no}.</b> ${esc(q.question)} <span class="pill">${esc(q.correct)} · ${q.points} mata</span></p>`).join('')}</details>`}</div>`;
  }catch(e){cloudStatus(e.message,true);}
}
async function exportCloudClass(){if(!cloudClass)return cloudStatus('Pilih kelas dahulu.',true);await cloudAction(async()=>{const d=await call('adminExportClass',pin,cloudClass);$('cloudExportResult').innerHTML=`<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)} — buka laporan Google Sheets</a>`;});}
async function refreshCloud(){try{await loadCloudDashboard();cloudStatus('Rekod terkini dimuatkan.');}catch(e){cloudStatus(e.message,true);}}
async function assignLegacySession(code){if(!cloudClass)return cloudStatus('Pilih kelas dahulu.',true);await cloudAction(()=>call('adminAssignLegacySession',pin,code,cloudClass));}
// One outstanding read per screen prevents slow responses from piling up.
for(const key of ['refreshTeacherLive','refreshProjector','pollPlayer']){
  const original=window[key];let pending=false;
  window[key]=async function(...args){if(pending)return;pending=true;try{return await original(...args);}finally{pending=false;}};
}

