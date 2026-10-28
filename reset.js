let resetBusy=false;
async function refreshRecoveryButton(){
  if(!pin)return;try{const d=await call('adminRecoveryStatus',pin);const b=$('restoreRecordsBtn');b.disabled=!d.available;b.dataset.operation=d.id||'';b.textContent=d.available?'↶ Pulihkan pemadaman terakhir: '+d.label:'Tiada rekod untuk dipulihkan';}catch(e){$('resetStatus').textContent=e.message;}
}
async function runRecordsAction(action){
  if(resetBusy)return;resetBusy=true;document.querySelectorAll('.reset-action').forEach(b=>b.disabled=true);$('resetStatus').textContent='Sedang mengemas kini rekod…';
  try{
    const d=await action();sessionCode='';$('sessionPanel').innerHTML='<p class="muted">Tiada sesi aktif. Pilih kelas dan mula sesi baharu.</p>';$('sessionHistoryDetail').innerHTML='';$('leaderboardPanel').innerHTML='';$('cloudExportResult').innerHTML='';
    await loadAdminData();await loadCloudDashboard();await refreshAttendance();await refreshTeacherLive();
    $('resetStatus').textContent=d.restored!==undefined?'Rekod dipulihkan. Markah dikira semula.':d.removed?'Rekod dipadam. Sejarah dan jumlah markah sudah dikemas kini.':'Tiada rekod untuk dipadam.';
  }catch(e){$('resetStatus').textContent=e.message;}
  finally{resetBusy=false;document.querySelectorAll('.reset-action').forEach(b=>b.disabled=false);await refreshRecoveryButton();}
}
async function deleteQuizHistory(code){
  if(!confirm('Padam sesi '+code+' bersama jawapan dan markahnya? Jumlah markah kelas akan dikira semula.'))return;
  await runRecordsAction(()=>call('adminDeleteRecords',pin,'session',String(code)));
}
async function resetSelectedClass(){
  if(!cloudClass)return cloudStatus('Pilih kelas dahulu.',true);
  const c=cloudData.classes.find(c=>c.id===cloudClass);
  if(!confirm('Reset semua sejarah sesi dan markah '+c.name+'? Senarai pelajar dan perpustakaan soalan dikekalkan.'))return;
  await runRecordsAction(()=>call('adminDeleteRecords',pin,'class',cloudClass));
}
async function resetAllClasses(){
  if(!confirm('Reset SEMUA sejarah sesi dan markah kedua-dua kelas, termasuk sesi lama tanpa kelas? Hanya 28 pelajar berdaftar dikekalkan bagi setiap kelas. Perpustakaan soalan dikekalkan.'))return;
  await runRecordsAction(()=>call('adminDeleteRecords',pin,'all',''));
}
async function restoreLastRecords(){
  const id=$('restoreRecordsBtn').dataset.operation;if(!id)return;
  if(!confirm('Pulihkan rekod daripada pemadaman ini? Markah sesi yang dipulihkan akan dikira semula.'))return;
  await runRecordsAction(()=>call('adminRestoreRecords',pin,id));
}
const beforeResetRender=window.renderCloudDashboard;
window.renderCloudDashboard=function(){beforeResetRender();
  const decorate=(container)=>{for(const b of $(container).querySelectorAll('button[onclick^="viewSessionHistory"]')){if(b.parentElement.querySelector('.delete-history-btn'))continue;const match=b.getAttribute('onclick').match(/viewSessionHistory\('([^']+)'\)/);if(!match)continue;const del=document.createElement('button');del.type='button';del.className='danger reset-action delete-history-btn';del.textContent='Padam sesi';del.addEventListener('click',()=>deleteQuizHistory(match[1]));b.parentElement.append(del);}};
  decorate('historyList');decorate('legacyHistory');refreshRecoveryButton();
};
