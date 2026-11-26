import {racePoints} from './race-model.mjs?v=competition20261125';

export function teacherRows(room,order='race') {
 const questions=room.bank?.questions||[];
 const rows=(room.ranking||[]).map(runner=>{
  const answers=Object.values(runner.correct||{});
  const times=answers.map(a=>a.at-a.openedAt).filter(ms=>Number.isFinite(ms)&&ms>=0);
  return {...runner,score:racePoints(runner,questions),correct:runner.progress||0,
   wrong:runner.mistakes||0,attempts:runner.attempts||0,
   remaining:Math.max(0,(room.state?.total||questions.length)-(runner.progress||0)),
   average:times.length?times.reduce((a,b)=>a+b,0)/times.length:null};
 });
 if(order==='score')rows.sort((a,b)=>b.score-a.score||a.rank-b.rank);
 return rows.map((row,i)=>({...row,displayRank:order==='race'?row.rank:i+1}));
}
