/* Pure helpers shared by the UI and isolated tests. */
function parseRosterRows(rows){
  if(!Array.isArray(rows)||rows.length<2)throw Error('Fail kosong. Gunakan lajur IC dan Nama.');
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');const heads=rows[0].map(norm),icCol=heads.findIndex(h=>['ic','noic','nomboric','kadpengenalan','nomborkadpengenalan'].includes(h)),nameCol=heads.findIndex(h=>['nama','name','namapenuh','namapelajar'].includes(h));
  if(icCol<0||nameCol<0)throw Error('Tajuk lajur diperlukan: IC dan Nama.');const seen=new Set(),entries=[];
  rows.slice(1).forEach((r,i)=>{if(!r.some(v=>String(v??'').trim()))return;let ic=r[icCol];if(typeof ic==='number'){if(!Number.isSafeInteger(ic)||ic<10000000000||ic>999999999999)throw Error('Baris '+(i+2)+': format IC tidak sah.');ic=String(ic).padStart(12,'0');}else ic=String(ic??'').trim().replace(/^'/,'').replace(/[\s-]/g,'');const name=String(r[nameCol]??'').replace(/\s+/g,' ').trim();if(!/^\d{12}$/.test(ic))throw Error('Baris '+(i+2)+': IC mesti 12 digit.');if(!name||name.length>120)throw Error('Baris '+(i+2)+': nama diperlukan (maksimum 120 aksara).');if(seen.has(ic))throw Error('IC berganda pada baris '+(i+2)+'.');seen.add(ic);entries.push({ic,name});});
  if(!entries.length||entries.length>500)throw Error('Fail mesti mengandungi 1 hingga 500 pelajar.');return entries;
}
function podiumMarkup(list){
  const top=(list||[]).slice(0,3);if(!top.length)return '<p class="muted">Belum ada peserta untuk podium.</p>';
  return '<div class="podium" aria-label="Podium tiga pelajar tertinggi">'+[1,0,2].filter(i=>top[i]).map(i=>`<div class="podium-place podium-${i+1}"><span class="podium-medal">${['🥇','🥈','🥉'][i]}</span><strong>${esc(top[i].name)}</strong><span>${metricCount(top[i].points)} markah</span><div class="podium-step">${i+1}</div></div>`).join('')+'</div>';
}
