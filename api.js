// Apps Script iframe bridge avoids cross-origin HTTP response restrictions.
const quizBridge = (() => {
  let ready, frame, remote, remoteOrigin;
  const pending = new Map();
  const channel = crypto.randomUUID();
  window.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || msg.channel !== channel) return;
    if (!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
    if (msg.type === 'quiz-ready' && ready) { remote = event.source; remoteOrigin = event.origin; ready.resolve(); return; }
    if (event.source !== remote || event.origin !== remoteOrigin || msg.type !== 'quiz-result') return;
    const task = pending.get(msg.id); if (!task) return;
    clearTimeout(task.timer); pending.delete(msg.id);
    if (msg.ok) task.resolve(msg.data); else task.reject(new Error(msg.error || 'Permintaan gagal.'));
  });
  function connect() {
    if (ready) return ready.promise;
    ready = {};
    ready.promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Tidak dapat menyambung. Semak deployment Apps Script.')), 45000);
      ready.resolve = () => { clearTimeout(timer); resolve(); };
    });
    const url = new URL(window.QUIZPRO_CONFIG.apiUrl);
    url.searchParams.set('view','github-bridge'); url.searchParams.set('channel',channel);
    frame = document.createElement('iframe'); frame.hidden = true; frame.title = 'Sambungan QuizPro'; frame.src = url.href; document.body.append(frame);
    return ready.promise;
  }
  return async function(fn, args) {
    await connect();
    return new Promise((resolve,reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {pending.delete(id);reject(new Error('Permintaan mengambil masa terlalu lama. Semak keadaan sesi sebelum mengulang.'));},45000);
      pending.set(id,{resolve,reject,timer});
      remote.postMessage({type:'quiz-call',channel,id,fn,args},remoteOrigin);
    });
  };
})();
async function call(fn, ...args) {
  const data = await quizBridge(fn,args);
  const site = new URL(location.href); site.search = ''; site.hash = '';
  if (fn === 'adminGetData' && data) data.webAppUrl = site.href;
  if (fn === 'adminStartSession' && data) {site.searchParams.set('join',data.code);data.url=site.href;}
  return data;
}
