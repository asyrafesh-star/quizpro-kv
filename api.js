// Send secrets in the request body, never in URL parameters.
async function call(fn, ...args) {
  const apiUrl = window.QUIZPRO_CONFIG?.apiUrl || '';
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(apiUrl)) {
    throw new Error('URL Apps Script belum ditetapkan dengan betul dalam config.js.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST', redirect: 'follow', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, args }), signal: controller.signal
    });
    if (!response.ok) throw new Error('Pelayan tidak tersedia (' + response.status + ').');
    let envelope;
    try { envelope = JSON.parse(await response.text()); }
    catch { throw new Error('Apps Script belum dikemas kini. Pasang Code.gs baharu dan deploy versi baharu dengan akses Anyone.'); }
    if (!envelope || typeof envelope.ok !== 'boolean') throw new Error('Respons Apps Script tidak sah. Semak versi deployment.');
    if (!envelope.ok) throw new Error(envelope.error || 'Permintaan gagal.');
    const data = envelope.data;
    const site = new URL(location.href); site.search = ''; site.hash = '';
    if (fn === 'adminGetData' && data) data.webAppUrl = site.href;
    if (fn === 'adminStartSession' && data) { site.searchParams.set('join', data.code); data.url = site.href; }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Sambungan mengambil masa terlalu lama. Semak keadaan sesi sebelum mengulang tindakan.');
    if (error instanceof TypeError) throw new Error('Tidak dapat menghubungi Apps Script. Semak internet dan akses deployment Anyone.');
    throw error;
  } finally { clearTimeout(timer); }
}
