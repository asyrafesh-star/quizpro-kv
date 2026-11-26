export const MAX_COINS_PER_STAGE=54;
export const RANK_WEIGHTS={correct:70,coins:20,time:10};
export function firstAttempt(previous,question,choice,stamp,openedAt,coins=0){
 if(previous?.[question.id])return null;
 return {choice,at:stamp,openedAt,coins:Math.max(0,Math.min(MAX_COINS_PER_STAGE,Math.floor(Number(coins)||0)))};
}
export function questionResult(question,answer){
 if(!answer)return {answered:false,correct:false,quizPoints:0,coins:0,responseMs:null,index:0};
 const correct=answer.choice===question.correct;
 const responseMs=Math.max(0,answer.at-answer.openedAt);
 const coins=Math.max(0,Math.min(MAX_COINS_PER_STAGE,Number(answer.coins)||0));
 const maximum=Number(question.points)||5;
 const seconds=responseMs/1000;
 const quizPoints=!correct||seconds>=30?0:seconds<=10?maximum:maximum===1?1:Math.max(1,maximum-Math.ceil((seconds-10)/(20/(maximum-1))-1e-10));
 const timeRatio=correct?Math.max(0,1-responseMs/30000):0;
 // Integer thousandths avoid rounding changing close leaderboard positions.
 const index=Math.round((70*Number(correct)+20*coins/MAX_COINS_PER_STAGE+10*timeRatio)*1000);
 return {answered:true,correct,quizPoints,coins,responseMs,index};
}
export function competitionRows(runners,profiles,questions,qid=null){
 const selected=qid?questions.filter(q=>q.id===qid):questions;
 const rows=Object.entries(runners||{}).map(([uid,runner])=>{
  const results=selected.map(q=>({qid:q.id,...questionResult(q,runner.first?.[q.id])}));
  const answered=results.filter(r=>r.answered);
  const correct=results.filter(r=>r.correct);
  return {uid,name:profiles?.[uid]?.name||'Pelari',results,firstCorrect:correct.length,
   answered:answered.length,quizPoints:results.reduce((n,r)=>n+r.quizPoints,0),
   coins:results.reduce((n,r)=>n+r.coins,0),index:results.reduce((n,r)=>n+r.index,0),
   responseMs:correct.reduce((n,r)=>n+r.responseMs,0),
   lastAt:Math.max(0,...selected.map(q=>Number(runner.first?.[q.id]?.at)||0)),
   progress:runner.progress||0,finishedAt:runner.finishedAt||null};
 });
 rows.sort((a,b)=>b.index-a.index||b.firstCorrect-a.firstCorrect||b.coins-a.coins||a.responseMs-b.responseMs||(a.lastAt||Infinity)-(b.lastAt||Infinity)||a.name.localeCompare(b.name)||a.uid.localeCompare(b.uid));
 return rows.map((row,i)=>({...row,rank:i+1}));
}
