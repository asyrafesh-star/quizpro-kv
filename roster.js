let rosterLookupTimer,rosterLookupGeneration=0,attendancePending=false,attendanceGeneration=0;
function scheduleRosterLookup(){
  clearTimeout(rosterLookupTimer);const generation=++rosterLookupGeneration;
  const name=$('studentName'),status=$('rosterLookupStatus');name.readOnly=true;name.value='';
  const ic=$('studentId').value.replace(/\D/g,''),code=$('joinCode').value.trim();
  if(ic.length!==12||code.length!==6){status.textContent='Isi kod permainan dan IC 12 digit untuk semak nama.';return;}
  status.textContent='Menyemak nama…';
  rosterLookupTimer=setTimeout(async()=>{try{
    const d=await call('studentRosterName',code,ic);if(generation!==rosterLookupGeneration)return;
    if(d.found){name.value=d.name;name.readOnly=true;status.textContent='✓ Nama dijumpai · '+d.className;}
    else status.textContent='IC tidak dijumpai. Semak kod permainan dan IC, atau hubungi cikgu.';
  }catch(e){if(generation===rosterLookupGeneration)status.textContent='Semakan nama gagal. Cuba semula atau hubungi cikgu.';}},350);
}
$('studentId').addEventListener('input',scheduleRosterLookup);$('joinCode').addEventListener('input',scheduleRosterLookup);
function attendanceTable(list){return list.length?'<div class="tablewrap"><table><thead><tr><th>#</th><th>Nama pelajar</th><th>IC akhir</th></tr></thead><tbody>'+list.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.name)}</td><td>•••• ${esc(p.idSuffix)}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">Tiada pelajar.</p>';}
async function refreshAttendance(){
  if(!pin||!cloudClass||attendancePending)return;attendancePending=true;
  const selected=cloudClass,generation=++attendanceGeneration;
  try{const d=await call('adminAttendance',pin,selected);if(selected!==cloudClass||generation!==attendanceGeneration)return;
    $('attendanceStatus').textContent=(d.code?'Sesi '+d.code+' · '+(d.status==='finished'?'Tamat':d.status):'Belum ada sesi untuk kelas ini. Semua pelajar disenaraikan di bawah.')+' · Kemas kini automatik';
    $('presentHeading').textContent='Sudah masuk kuiz ('+d.present.length+')';$('absentHeading').textContent='Belum masuk ('+d.absent.length+')';
    $('attendancePresent').innerHTML=attendanceTable(d.present);$('attendanceAbsent').innerHTML=attendanceTable(d.absent);
  }catch(e){$('attendanceStatus').textContent='Tidak dapat memuatkan kehadiran: '+e.message;}
  finally{attendancePending=false;}
}
const originalClassSelect=window.selectCloudClass;
window.selectCloudClass=async function(id){attendanceGeneration++;$('attendancePresent').innerHTML='';$('attendanceAbsent').innerHTML='';$('attendanceStatus').textContent='Memuatkan kehadiran…';await originalClassSelect(id);await refreshAttendance();};
setInterval(()=>{if(!$('adminView').classList.contains('hidden'))refreshAttendance();},8000);
