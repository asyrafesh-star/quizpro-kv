function metricCount(value){return value==null?'—':String(Math.max(0,Number(value)||0));}
function answerStatsMarkup(p,state){
  const stats=Object.assign({},p);if(state){const total=Number(state.total)||Number(p.totalQuestions)||0,current=Number(state.currentQuestion)||0,phase=String(state.status);
    const started=['waiting','idle'].includes(phase)?0:phase==='ready'?Math.max(0,current-1):current;
    stats.remainingQuestions=Math.max(0,total-started);
  }
  return '<div class="answer-stats" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">'+[['correct','✓ Betul'],['wrong','✗ Salah'],['answered','Dijawab'],['unanswered','Tidak dijawab'],['remainingQuestions','Baki soalan']].map(([key,label])=>`<div class="answer-stat stat-${key}"><strong>${metricCount(stats[key])}</strong><span>${label}</span></div>`).join('')+'</div><p class="muted">Tidak dijawab: soalan yang telah tamat tanpa jawapan. Baki soalan: soalan selepas ini yang belum bermula.</p>'+(p.pending?`<p class="muted">${metricCount(p.pending)} jawapan menunggu pendedahan keputusan.</p>`:'');
}
function metricsRankingTable(list,total=false,history=false){
  if(!list.length)return '<p class="muted">'+(history?'Belum ada keputusan. Markah terkumpul dikira selepas sesi tamat.':'Belum ada peserta.')+'</p>';
  return '<div class="tablewrap"><table><thead><tr><th>#</th><th>Nama pelajar</th><th>'+(total?'Jumlah markah':'Markah')+'</th><th>Betul</th><th>Salah</th><th>Dijawab</th><th>Tidak dijawab</th>'+(total?'<th>Kuiz</th>':'')+'</tr></thead><tbody>'+list.map(p=>`<tr><td>${p.rank}</td><td>${esc(p.name)}</td><td><b>${metricCount(p.points)}</b></td><td class="metric-correct">${metricCount(p.correct)}</td><td class="metric-wrong">${metricCount(p.wrong)}</td><td>${metricCount(p.answered)}${p.pending?` <small>(${metricCount(p.pending)} menunggu reveal)</small>`:''}</td><td>${metricCount(p.unanswered)}</td>${total?`<td>${metricCount(p.sessions)}</td>`:''}</tr>`).join('')+'</tbody></table></div>';
}

