import { buildAttempt, rankRunners } from './race-model.mjs?v=race20261117';

const config = { apiKey:'AIzaSyDsLcMZtnge0eLl9IX2ZUIXaRXnfixg70M', authDomain:'quizpro-kv.firebaseapp.com', projectId:'quizpro-kv', databaseURL:'https://quizpro-kv-default-rtdb.asia-southeast1.firebasedatabase.app', appId:'1:897822705409:web:2147b1d6720e80c5357d00' };
let sdkPromise;
async function sdk() {
  if (!sdkPromise) sdkPromise = (async () => {
    const [app, a, d] = await Promise.all(['firebase-app','firebase-auth','firebase-database'].map(name => import('https://www.gstatic.com/firebasejs/12.4.0/' + name + '.js')));
    const instance = app.initializeApp(config, 'quizpro-race');
    const auth = a.getAuth(instance);
    await a.setPersistence(auth, a.browserLocalPersistence);
    await auth.authStateReady();
    if (!auth.currentUser) await a.signInAnonymously(auth);
    return { a, d, auth, db:d.getDatabase(instance) };
  })().catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}

export async function createTest(pin, quizId, orderMode) {
  return legacyCall('adminRaceTest', pin, quizId, orderMode);
}

export async function connect(code, ic, name, onUpdate, observerPin) {
  const { d, db, auth } = await sdk();
  const token = await auth.currentUser.getIdToken();
  const bank = observerPin ? await legacyCall('adminRaceWatch', observerPin, code, token) : await legacyCall('raceJoin', code, ic, name, token);
  const root = 'gamingRaces/' + code;
  const stops = [];
  const room = { bank, code, uid:auth.currentUser.uid, state:null, runners:{}, profiles:{}, connected:false, offset:0, error:'', closed:false };
  room.now = () => Date.now() + room.offset;
  const notify = () => {
    if (room.closed) return;
    room.self = room.runners[room.uid];
    room.ranking = rankRunners(room.runners, room.profiles, room.state?.startedAt || 0);
    onUpdate(room);
  };
  const listen = (path, callback) => stops.push(d.onValue(d.ref(db,path), snapshot => { callback(snapshot.val()); notify(); }, error => { room.error = error.message; notify(); }));
  listen('.info/serverTimeOffset', value => { room.offset = Number(value) || 0; });
  listen('.info/connected', value => { room.connected = value === true; });
  listen(root + '/state', value => { room.state = value; });
  listen(root + '/profiles', value => { room.profiles = value || {}; });
  listen(root + '/runners', value => {
    room.runners = value || {};
    if (room.pending) room.runners[room.uid] = room.confirmed;
  });
  // Initial reads let Continue restore the committed answers before any new question opens.
  const [state, runners, profiles] = await Promise.all(['state','runners','profiles'].map(path => d.get(d.ref(db,root+'/'+path))));
  room.state = state.val();room.runners = runners.val() || {};room.profiles = profiles.val() || {};
  room.close = () => { room.closed = true; stops.forEach(stop => stop()); };
  room.submit = async (question, choice, attemptId) => {
    if (room.self?.last?.id === attemptId) return room.self;
    if (!room.connected) throw Error('Internet terputus. Sambung semula dan cuba hantar lagi.');
    const target = d.ref(db,root+'/runners/'+room.uid);
    const previous = (await d.get(target)).val();
    if (previous?.last?.id === attemptId) return previous;
    const next = buildAttempt(previous, question, choice, room.state.startedAt, d.serverTimestamp(), attemptId);
    if (!next) throw Error('Soalan ini sudah disahkan. Muat semula untuk sambung.');
    const changes = { attempts:next.attempts,progress:next.progress,mistakes:next.mistakes,streak:next.streak,last:next.last };
    if (next.correct[question.id]) changes['correct/'+question.id] = next.correct[question.id];
    if (next.progress === room.state.total) changes.finishedAt = d.serverTimestamp();
    room.confirmed = previous;room.pending = true;
    try { await d.update(target,changes); }
    catch (error) {
      const committed = (await d.get(target)).val();
      if (committed?.last?.id !== attemptId) throw error;
    }
    finally { room.pending = false; }
    const saved = (await d.get(target)).val();
    if (saved?.last?.id !== attemptId) throw Error('Jawapan belum diterima. Muat semula untuk sambung rekod terakhir.');
    room.runners[room.uid] = saved;room.error = '';notify();
    return saved;
  };
  notify();
  return room;
}
