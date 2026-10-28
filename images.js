const questionImageCache = new Map();
function imageEscape(value) {return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function questionImageInfo(raw) {
  try {
    const source=new URL(String(raw||'').trim());
    if(!['https:','http:'].includes(source.protocol))return null;
    const isDrive=['drive.google.com','www.drive.google.com','docs.google.com'].includes(source.hostname.toLowerCase());
    const match=isDrive?source.pathname.match(/\/file\/d\/([\w-]+)/):null;
    const id=isDrive?(match?.[1]||source.searchParams.get('id')):null;
    if(id&&/^[\w-]{10,}$/.test(id)) {
      const thumb=new URL('https://drive.google.com/thumbnail');thumb.searchParams.set('id',id);thumb.searchParams.set('sz','w1600');
      const key=source.searchParams.get('resourcekey');if(key)thumb.searchParams.set('resourcekey',key);
      const view=new URL('https://drive.google.com/file/d/'+id+'/view');if(key)view.searchParams.set('resourcekey',key);
      return {key:source.href,view:view.href,sources:[thumb.href,'https://lh3.googleusercontent.com/d/'+id+'=w1600']};
    }
    return {key:source.href,view:source.href,sources:[source.href]};
  }catch{return null;}
}
function questionImageMarkup(raw,kind='teacher',no='') {
  if(!raw)return '';
  const info=questionImageInfo(raw);
  if(!info)return '<p class="quiz-image-error">Pautan gambar tidak sah. Gunakan pautan https://.</p>';
  const cached=questionImageCache.get(info.key);
  const failed=cached?.failed&&Date.now()-cached.at<30000;
  const sources=cached?.url?[cached.url,...info.sources.filter(s=>s!==cached.url)]:info.sources;
  const mode=['bank','teacher','projector'].includes(kind)?kind:'teacher';
  return `<figure class="quiz-image quiz-image-${mode}"><img ${failed?'hidden':''} src="${failed?'':imageEscape(sources[0])}" data-image-key="${imageEscape(info.key)}" data-image-sources="${imageEscape(JSON.stringify(sources))}" data-image-step="0" alt="Gambar soalan ${imageEscape(no)}" loading="${mode==='bank'?'lazy':'eager'}" decoding="async" referrerpolicy="no-referrer" onload="questionImageReady(this)" onerror="questionImageFailed(this)"><figcaption class="quiz-image-error" ${failed?'':'hidden'}>Gambar tidak dapat dimuatkan. Semak akses pautan Drive.</figcaption><a class="quiz-image-link" href="${imageEscape(info.view)}" target="_blank" rel="noopener noreferrer">Buka gambar ↗</a></figure>`;
}
function questionImageReady(img) {
  questionImageCache.set(img.dataset.imageKey,{url:img.currentSrc||img.src});
  img.hidden=false;img.parentElement.querySelector('.quiz-image-error').hidden=true;
}
function questionImageFailed(img) {
  const sources=JSON.parse(img.dataset.imageSources||'[]'),next=Number(img.dataset.imageStep||0)+1;
  if(next<sources.length){img.dataset.imageStep=String(next);img.src=sources[next];return;}
  questionImageCache.set(img.dataset.imageKey,{failed:true,at:Date.now()});
  img.hidden=true;img.parentElement.querySelector('.quiz-image-error').hidden=false;
}
