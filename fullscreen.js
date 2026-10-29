// Each section retains its live DOM, forms and timers while expanded.
(() => {
  let fallbackSection=null,previousScroll=0;
  const sections=[...document.querySelectorAll('.card, #projectorView')];
  const buttons=new Map();
  const current=()=>document.fullscreenElement||fallbackSection;
  function updateButtons(){
    for(const [section,button]of buttons){
      const active=current()===section;
      button.textContent=active?'⤢ Keluar skrin penuh':'⛶ Skrin penuh';
      button.setAttribute('aria-pressed',String(active));
      button.title=active?'Keluar skrin penuh (Esc)': 'Besarkan bahagian ini sahaja';
    }
  }
  function clearFallback(){
    if(!fallbackSection)return;
    const section=fallbackSection;fallbackSection=null;
    section.classList.remove('section-fullscreen-fallback');
    document.body.classList.remove('section-fullscreen-open');
    window.scrollTo(0,previousScroll);updateButtons();buttons.get(section)?.focus({preventScroll:true});
  }
  async function exitSection(){
    if(document.fullscreenElement){await document.exitFullscreen();return;}
    clearFallback();
  }
  async function toggleSection(section){
    if(current()===section){await exitSection();return;}
    if(current())await exitSection();
    if(section.requestFullscreen&&document.fullscreenEnabled){
      try{await section.requestFullscreen();updateButtons();return;}catch(e){/* Fall back to the full browser viewport. */}
    }
    previousScroll=window.scrollY;fallbackSection=section;
    section.classList.add('section-fullscreen-fallback');document.body.classList.add('section-fullscreen-open');
    updateButtons();buttons.get(section)?.focus({preventScroll:true});
  }
  window.installSectionFullscreen=function(){const sections=[...document.querySelectorAll('.card, #projectorView')].filter(s=>!buttons.has(s));sections.forEach((section,index)=>{
    section.classList.add('fullscreen-section');
    if(!section.id)section.id='quiz-section-'+(index+1);
    const bar=document.createElement('div');bar.className='section-fullscreen-toolbar';
    const button=document.createElement('button');button.type='button';button.className='secondary section-fullscreen-button';
    button.setAttribute('aria-controls',section.id);button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>toggleSection(section));bar.append(button);section.prepend(bar);buttons.set(section,button);
  });
  updateButtons();};
  installSectionFullscreen();
  document.addEventListener('fullscreenchange',updateButtons);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current()){e.preventDefault();exitSection().catch(()=>{});}});
  new MutationObserver(()=>{const section=current();if(section?.classList.contains('hidden'))exitSection();}).observe(document.querySelector('.wrap'),{attributes:true,attributeFilter:['class'],subtree:true});
  updateButtons();
})();

