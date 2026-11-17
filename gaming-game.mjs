import { orderedQuestions, racePoints, REVEAL_MS } from './race-model.mjs?v=race20261117';
import { connect, createTest } from './race-live.mjs?v=race20261117';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const tester = params.get('view') === 'tester';
const watching = params.get('watch') || '';
let code = params.get('join') || watching;
let room, bank, round, solo = false, busy = false;
let podiumStamp = '';
const timeText = milliseconds => (Math.max(0,milliseconds) / 1000).toFixed(1) + 's';
const now = () => room ? room.now() : Date.now();
const shuffled = values => orderedQuestions(values, 'random', crypto.randomUUID());

const audio = (() => {
  let context, enabled = false;
  function unlock() {
    if (!enabled) return;
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
  }
  function play(kind) {
    if (!enabled || !context) return;
    const notes = kind === 'wrong' ? [220,165] : kind === 'finish' ? [523,659,784,1047] : [523,659,784];
    notes.forEach((frequency,index) => {
      const start = context.currentTime + index * 0.1;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'sine';oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);gain.gain.linearRampToValueAtTime(0.12,start+0.008);gain.gain.exponentialRampToValueAtTime(0.001,start+0.35);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+0.4);
    });
  }
  $('sound').onclick = () => { enabled = !enabled;$('sound').textContent = enabled ? '🔊 Bunyi ON' : '🔈 Bunyi OFF';$('sound').setAttribute('aria-pressed',String(enabled));unlock(); };
  return { unlock, play };
})();

function message(text) { $('bankStatus').textContent = text; }
function shareRace() {
  $('raceShare').hidden = false;
  const url = new URL('gaming.html',location.href);url.searchParams.set('join',code);
  $('raceLink').href = url.href;$('raceLink').textContent = 'Buka pautan peserta ujian ↗';
  $('shareCode').textContent = code;
}
function updateRoom(value) {
  room = value;
  $('connection').textContent = value.error ? 'Sambungan bermasalah · cuba semula' : value.connected ? '● Disambungkan' : '○ Menyambung semula…';
  const ranking = value.ranking || [];
  const mine = ranking.find(runner => runner.uid === value.uid);
  $('raceRank').textContent = watching ? ranking.length + ' pelari' : mine ? 'Kedudukan ' + mine.rank + '/' + ranking.length : 'Menunggu peserta';
  $('rivalList').replaceChildren(...ranking.slice(0,5).map(runner => {
    const row = document.createElement('div');row.className = 'rival-row';
    const name = document.createElement('span');name.textContent = runner.rank + '. ' + runner.name + (runner.uid === value.uid ? ' · Anda' : '');
    const progress = document.createElement('strong');progress.textContent = runner.finishedAt ? '🏁 ' + timeText(runner.duration) : runner.progress + '/' + (value.state?.total || bank?.questions.length || 0);
    row.append(name,progress);return row;
  }));
  $('race3d').dataset.rivals = JSON.stringify(ranking.filter(runner => runner.uid !== value.uid).slice(0,3).map(runner => ({ name:runner.name, progress:runner.progress, finished:!!runner.finishedAt })));
  if (!$('end').hidden) renderPodium();
  if (watching) {
    $('intro').hidden = true;$('watchView').hidden = false;
    $('watchRanking').replaceChildren(...ranking.map(runner => {
      const row = document.createElement('p');row.textContent = '#' + runner.rank + ' · ' + runner.name + ' · ' + runner.progress + '/' + value.state.total + (runner.finishedAt ? ' · ' + timeText(runner.duration) : '');return row;
    }));
    $('watchStatus').textContent = value.state?.status === 'waiting' ? 'Lobi · Menunggu cikgu mula' : value.state?.status === 'finished' ? 'Perlumbaan tamat' : 'Perlumbaan sedang berlangsung';
    $('watchStart').disabled = value.state?.status !== 'waiting';
  }
}

function paintQuestion(question) {
  $('question').textContent = question.question;
  const image = $('gamingQuestionImage');image.hidden = true;image.removeAttribute('src');
  if (question.image) {
    try {
      const url = new URL(question.image);
      if (url.protocol === 'https:') {
        const id = url.hostname === 'drive.google.com' && (url.searchParams.get('id') || url.pathname.match(/\/d\/([^/]+)/)?.[1]);
        image.src = id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1000' : url.href;image.hidden = false;
      }
    } catch { /* A missing optional diagram does not block answering. */ }
  }
}
function nextQuestion() {
  if (!round.queue.length) { finish();return; }
  round.question = round.queue.shift();
  round.attemptId = crypto.randomUUID();
  const choices = round.question.options.map((text,index) => ({ text,index }));
  round.options = solo ? shuffled(choices) : shuffled([choices[round.question.correct], ...shuffled(choices.filter(choice => choice.index !== round.question.correct)).slice(0,2)]);
  round.openedAt = solo ? now() : room.self.last ? room.self.last.at + REVEAL_MS : room.state.startedAt;
  round.phase = 'answer';round.selection = null;
  paintQuestion(round.question);$('feedback').replaceChildren();$('retryAnswer').hidden = true;
  $('answers').replaceChildren(...round.options.map((option,index) => {
    const button = document.createElement('button');button.type = 'button';
    const letter = document.createElement('strong');letter.className = 'lane-letter';letter.textContent = 'ABCD'[index];
    const text = document.createElement('span');text.textContent = option.text;button.append(letter,text);
    button.onclick = () => answer(option.index);return button;
  }));
}
function self() { return solo ? round.self : room?.self; }
function start() {
  if (!bank || (!solo && !room?.self)) return;
  audio.unlock();
  const saved = solo ? { attempts:0,progress:0,mistakes:0,streak:0,correct:{} } : room.self;
  const queue = orderedQuestions(bank.questions,bank.orderMode,room?.uid || 'preview').filter(question => !saved.correct?.[question.id]);
  round = { queue, lane:1,phase:'waiting',self:saved,startedAt:now(),openedAt:0 };
  $('intro').hidden = $('end').hidden = true;$('play').hidden = false;
  $('question').textContent = 'Menunggu cikgu memulakan perlumbaan…';$('answers').replaceChildren();$('feedback').replaceChildren();
  if (saved.finishedAt) { finish();return; }
  if (saved.last) {
    const previous = bank.questions.find(question => question.id === saved.last.qid);
    if (previous && saved.last.choice !== previous.correct) {
      round.queue = queue.filter(question => question.id !== previous.id).concat(previous);
    }
    if (now() < saved.last.at + REVEAL_MS && previous) {
      round.question = previous;paintQuestion(previous);round.nextReadyAt = saved.last.at + REVEAL_MS;
      round.phase = saved.last.choice === previous.correct ? 'feedback' : 'penalty';
      $('feedback').textContent = round.phase === 'penalty' ? '❄️ Penalti 5 saat · Soalan ini kembali kemudian.' : previous.explanation;
    }
  }
  tick();
}

async function answer(choice) {
  if (!round || !['answer','retry'].includes(round.phase) || busy) return;
  if (now() - round.openedAt >= 30000) choice = -1;
  round.selection = choice;
  const lane = round.options.findIndex(option => option.index === choice);
  if (lane >= 0) round.lane = lane;
  busy = true;round.phase = 'submitting';$('retryAnswer').hidden = true;
  for (const button of $('answers').children) button.disabled = true;
  $('feedback').textContent = 'Sedang menyimpan jawapan…';
  try {
    let saved;
    if (solo) {
      const hit = choice === round.question.correct;
      saved = round.self;saved.attempts++;saved.progress += hit ? 1 : 0;saved.mistakes += hit ? 0 : 1;
      if (hit) saved.correct[round.question.id] = { at:now(),openedAt:round.openedAt,streak:0 };
      saved.last = { choice,qid:round.question.id,at:now() };
    } else saved = await room.submit(round.question,choice,round.attemptId);
    const correct = saved.last.choice === round.question.correct;
    round.phase = correct || solo ? 'feedback' : 'penalty';
    round.nextReadyAt = saved.last.at + (solo && !correct ? 750 : REVEAL_MS);
    const title = document.createElement('strong'), text = document.createElement('p');
    if (correct) {
      title.textContent = '✨ BETUL! Terus mara';text.textContent = round.question.explanation;
      const selected = $('answers').children[lane];if (selected) selected.classList.add('correct');
      audio.play('correct');
    } else {
      title.textContent = choice === -1 ? '⏳ Masa tamat · Beku 5 saat' : '❄️ Salah · Beku 5 saat';
      text.textContent = solo ? round.question.explanation : 'Soalan ini akan kembali di hadapan.';
      if (!solo) round.queue.push(round.question);
      audio.play('wrong');
    }
    $('feedback').replaceChildren(title,text);$('feedback').classList.add('pop');
  } catch (error) {
    round.phase = 'retry';$('feedback').textContent = 'Jawapan belum disahkan. ' + error.message;
    $('retryAnswer').hidden = false;
  } finally { busy = false;tick(); }
}

function tick() {
  if (!round || $('play').hidden) return;
  const current = self();if (!current) return;
  const state = room?.state;
  const clock = now();
  if (!solo && state?.status === 'finished') { finish();return; }
  const scene = $('race3d');scene.dataset.phase = round.phase;scene.dataset.lane = round.lane;
  scene.dataset.progress = current.progress / bank.questions.length;scene.dataset.total = bank.questions.length;
  scene.dataset.feedbackAge = current.last ? Math.max(0,clock-current.last.at) : 0;
  $('runner').classList.toggle('frozen',round.phase === 'penalty');
  $('runner').style.left = current.progress / bank.questions.length * 100 + '%';
  $('progress').textContent = current.progress + '/' + bank.questions.length + ' betul';
  $('score').textContent = racePoints(current,bank.questions) + ' markah';
  $('streak').textContent = '🔥 ' + current.streak + ' berturut';
  $('elapsed').textContent = '⏱ ' + timeText(solo ? clock-round.startedAt : Math.max(0,clock-(state?.startedAt || clock)));
  $('raceDistance').textContent = current.progress + '/' + bank.questions.length + ' halangan dilepasi';
  if (round.phase === 'waiting') {
    if (!solo && (!state?.startedAt || state.status === 'waiting')) { $('timer').textContent = 'Lobi · Menunggu cikgu';return; }
    const left = solo ? 0 : state.startedAt-clock;
    if (left > 0) { $('timer').textContent = '🏁 Mula dalam ' + Math.ceil(left/1000);return; }
    nextQuestion();return;
  }
  if (['penalty','feedback'].includes(round.phase)) {
    $('bar').value = 0;
    $('timer').textContent = (round.phase === 'penalty' ? '❄️ Beku · ' : '✨ Semakan · ') + Math.max(0,Math.ceil((round.nextReadyAt-clock)/1000)) + ' saat';
    if (clock >= round.nextReadyAt) nextQuestion();
    return;
  }
  if (round.phase !== 'answer') { $('timer').textContent = round.phase === 'retry' ? 'Menunggu penghantaran semula' : 'Mengesahkan jawapan…';return; }
  const left = Math.max(0,30-(clock-round.openedAt)/1000);
  $('timer').textContent = Math.ceil(left) + ' saat';$('bar').value = left;
  if (left <= 0) answer(-1);
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = $('confetti');layer.replaceChildren();
  for (let index = 0; index < 32; index++) {
    const particle = document.createElement('i');particle.style.left = index/32*100 + '%';particle.style.backgroundColor = ['#bda0ff','#ffcf6e','#77dfd5','#ff89ae'][index%4];particle.style.animationDelay = index%7*0.08 + 's';layer.append(particle);
  }
}
function renderPodium() {
  const leaders = room?.ranking?.filter(runner => runner.finishedAt).slice(0,5) || [];
  const stamp = JSON.stringify(leaders.map(runner => [runner.uid,runner.rank,runner.duration]));
  if (stamp === podiumStamp) return;podiumStamp = stamp;
  $('podium').replaceChildren(...[3,1,0,2,4].filter(index => leaders[index]).map(index => {
    const runner = leaders[index], card = document.createElement('article');card.className = 'podium-place place-' + (index+1);
    const medal = document.createElement('span');medal.className = 'podium-medal';medal.textContent = ['🥇','🥈','🥉','🏅','🏅'][index];
    const name = document.createElement('strong');name.textContent = runner.name;
    const time = document.createElement('small');time.textContent = timeText(runner.duration);
    const step = document.createElement('div');step.className = 'podium-step';step.textContent = '#' + runner.rank;
    card.append(medal,name,time,step);return card;
  }));
  $('podiumStatus').textContent = leaders.length ? 'Masa tamat disahkan pelayan. Kedudukan dikemas kini apabila peserta lain selesai.' : 'Menunggu peserta sampai ke penamat.';
}
function finish() {
  if (!round || round.phase === 'finished') return;
  round.phase = 'finished';$('play').hidden = true;$('end').hidden = false;
  const current = self();
  $('finishHeading').textContent = solo ? 'Pratonton selesai' : current.finishedAt ? '🏁 Anda sampai ke penamat!' : 'Perlumbaan ditamatkan';
  const duration = current.finishedAt ? current.finishedAt-room.state.startedAt : now()-round.startedAt;
  $('result').textContent = racePoints(current,bank.questions) + ' markah · ' + timeText(duration) + ' · ' + current.mistakes + ' kesilapan';
  $('record').textContent = solo ? 'Pratonton dalam pelayar ini.' : 'Keputusan perlumbaan disimpan dalam sesi ini.';
  $('restart').hidden = !solo && !tester;
  renderPodium();if (current.finishedAt || solo) { celebrate();audio.play('finish'); }
}

$('retryAnswer').onclick = () => answer(round.selection);
$('gamingJoin').value = code;
try{$('studentIC').value=sessionStorage.getItem('quizproRaceIC:'+code)||'';}catch{}
$('testName').value = 'Penguji';
function updateFields() {
  const test = tester || $('gamingJoin').value.trim().startsWith('test-');
  $('testIdentity').hidden = !test;$('studentIdentity').hidden = test || !!watching;
}
$('gamingJoin').oninput = updateFields;updateFields();
$('start').disabled = true;
$('loadBank').onclick = async () => {
  $('loadBank').disabled = true;$('start').disabled = true;message('Memuatkan set cikgu…');
  try {
    room?.close();room = null;round = null;podiumStamp = '';
    solo = tester && $('testerMode').value === 'classic';
    if (solo) {
      bank = await legacyCall('adminTesterBank',$('testerPin').value,$('testerSet').value);
      bank.questions = bank.questions.map((question,index) => ({...question,id:'q'+(index+1)}));bank.orderMode = $('testerOrder').value;
    } else {
      if (tester) { const test = await createTest($('testerPin').value,$('testerSet').value,$('testerOrder').value);code = test.code;shareRace(); }
      else code = $('gamingJoin').value.trim();
      const joined = await connect(code,$('studentIC').value,$('testName').value,updateRoom);
      room = joined;bank = joined.bank;$('studentName').value = bank.name;
      if(!bank.test){try{localStorage.setItem('quizproResume',JSON.stringify({code,playerId:bank.playerId,name:bank.name,gameplayMode:'gaming'}));sessionStorage.removeItem('quizproRaceIC:'+code);}catch{}}
    }
    if (!bank?.questions?.length) throw Error('Set soalan kosong.');
    message(bank.title + ' · ' + bank.questions.length + ' soalan' + (solo ? '' : ' · ' + bank.name));
    $('start').disabled = false;$('start').textContent = solo ? 'Mula pratonton' : 'Masuk / Sambung perlumbaan';
  } catch (error) { message(error.message); }
  finally { $('loadBank').disabled = false; }
};
$('start').onclick = async () => {
  $('start').disabled = true;
  try {
    if (tester && !solo && room.state.status === 'waiting') await legacyCall('adminRaceStart',$('testerPin').value,code);
    start();
  } catch (error) { message(error.message); }
  finally { $('start').disabled = false; }
};
$('restart').onclick = () => { if (solo) start();else { $('end').hidden = true;$('intro').hidden = false;message('Tekan Muatkan soalan untuk sesi ujian baharu.'); } };
if (tester) {
  $('testBanner').hidden = $('testerSetup').hidden = false;
  $('gamingJoin').hidden = document.querySelector('label[for="gamingJoin"]').hidden = true;
  $('testerList').onclick = async () => {
    $('testerList').disabled = true;
    try { const sets = await legacyCall('adminTesterBank',$('testerPin').value);$('testerSet').replaceChildren(...sets.map(set => new Option(set.title+' · '+set.count+' soalan',set.id)));message('Pilih set, mod dan susunan.'); }
    catch (error) { message(error.message); }
    finally { $('testerList').disabled = false; }
  };
}
if (watching) {
  $('watchSetup').hidden = false;$('studentIdentity').hidden = $('testIdentity').hidden = true;$('loadBank').hidden = $('start').hidden = true;
  $('watchConnect').onclick = async () => {
    try { room = await connect(watching,'','',updateRoom,$('watchPin').value);bank = room.bank; }
    catch (error) { message(error.message); }
  };
  $('watchStart').onclick = async () => {
    try { await legacyCall('adminRaceStart',$('watchPin').value,watching); }
    catch (error) { $('watchStatus').textContent = error.message; }
  };
}
setInterval(tick,100);
