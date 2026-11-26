import {questionResult,competitionRows} from './competition-model.mjs?v=competition20261125';
export const REVEAL_MS = 5000;
export const REVIEW_MS = 1000;

export function orderedQuestions(questions, mode, seed) {
  const order = questions.slice();
  if (mode !== 'random') return order;
  let value = 2166136261;
  for (const letter of seed) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
  for (let index = order.length - 1; index > 0; index--) {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    const target = (value >>> 0) % (index + 1);
    [order[index], order[target]] = [order[target], order[index]];
  }
  return order;
}

export function buildAttempt(previous, question, choice, startedAt, stamp, attemptId, runMs = 0) {
  if (!previous || previous.finishedAt || previous.correct?.[question.id]) return null;
  if (previous.last?.id === attemptId) return null;
  const prevCorrect = Boolean(previous.last && previous.correct?.[previous.last.qid]);
  const openedAt = (previous.last ? previous.last.at + (prevCorrect ? REVIEW_MS : REVEAL_MS) : startedAt) + runMs;
  const correct = choice === question.correct;
  const streak = correct ? previous.streak + 1 : 0;
  const next = {
    attempts: previous.attempts + 1,
    progress: previous.progress + (correct ? 1 : 0),
    mistakes: previous.mistakes + (correct ? 0 : 1),
    streak,
    last: { id: attemptId, qid: question.id, choice, at: stamp },
    correct: { ...previous.correct }
  };
  if (correct) next.correct[question.id] = { at: stamp, openedAt, streak };
  return next;
}

export function racePoints(runner, questions) {
  if(runner?.first)return questions.reduce((sum,q)=>sum+questionResult(q,runner.first[q.id]).quizPoints,0);
  const bank = new Map(questions.map(question => [question.id, question]));
  return Object.entries(runner?.correct || {}).reduce((total, [id, answer]) => {
    const maximum = Number(bank.get(id)?.points) || 5;
    const seconds = Math.max(0, (answer.at - answer.openedAt) / 1000);
    const base = seconds >= 30 ? 0 : seconds <= 10 ? maximum : maximum === 1 ? 1 : Math.max(1, maximum - Math.ceil((seconds - 10) / (20 / (maximum - 1)) - 1e-10));
    return total + base + (answer.streak >= 2 ? answer.streak : 0);
  }, 0);
}

export function rankRunners(runners, profiles, startedAt, questions = []) {
  if(questions.length&&Object.values(runners||{}).some(r=>r.first))return competitionRows(runners,profiles,questions).map(row=>({...runners[row.uid],...row,duration:row.finishedAt?row.finishedAt-startedAt:null}));
  const list = Object.entries(runners || {}).map(([uid, runner]) => ({
    uid, ...runner, name: profiles?.[uid]?.name || 'Pelari',
    duration: runner.finishedAt ? Math.max(0, runner.finishedAt - startedAt) : null
  }));
  list.sort((a, b) => {
    if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt || a.name.localeCompare(b.name);
    if (a.finishedAt) return -1;
    if (b.finishedAt) return 1;
    return b.progress - a.progress || (a.last?.at || Infinity) - (b.last?.at || Infinity) || a.name.localeCompare(b.name);
  });
  return list.map((runner, index) => ({ ...runner, rank: runner.finishedAt && list[index - 1]?.finishedAt === runner.finishedAt ? list.findIndex(entry => entry.finishedAt === runner.finishedAt) + 1 : index + 1 }));
}
