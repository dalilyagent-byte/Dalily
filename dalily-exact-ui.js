// Dalily exact approved home composition — final reference 2026-09-04
(()=>{
  const home=document.getElementById('home');
  const hero=home?.querySelector('.approved-hero');
  if(!home||!hero)return;

  const svg={
    user:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.6-7 8-7s7.2 2 8 7z"/></svg>`,
    bell:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    search:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    gear:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1L14.3 3h-4.6l-.4 3a8 8 0 0 0-1.7 1l-2.5-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .7.1 1l-2 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 3h4.6l.4-3a8 8 0 0 0 1.7-1l2.5 1 2-3.4-2-1.6c.1-.3.1-.6.1-1z"/></svg>`,
    bars:`<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 23V15h4v8H4Zm8 0V10h4v13h-4Zm8 0V5h4v18h-4Z"/><path d="m4 11 7-6 5 3 8-7"/></svg>`
  };

  hero.className='approved-hero exact-approved-hero';
  hero.innerHTML=`
    <div class="exact-top-left">
      <button class="exact-top-btn profile" data-goto="settings" type="button" aria-label="حسابي">${svg.user}</button>
      <button class="exact-top-btn notify" type="button" aria-label="التنبيهات">${svg.bell}<b>3</b></button>
    </div>
    <div class="exact-brand" aria-label="دليلي">
      <div class="exact-brand-word">دليلي<span class="exact-brand-mark">›</span></div>
      <div class="exact-brand-en">D A L I L Y</div>
      <div class="exact-brand-tag">مدير أعمالك الذكي</div>
    </div>
    <div class="exact-top-right">
      <button class="exact-top-btn" data-chatprompt="ابحث لي عن " type="button" aria-label="بحث">${svg.search}</button>
      <button class="exact-top-btn" data-goto="settings" type="button" aria-label="الإعدادات">${svg.gear}</button>
    </div>
    <div class="exact-greeting">
      <h2>مرحباً أبو بندر 👋</h2>
      <p class="q">وش تبي نسوي اليوم؟</p>
      <p class="sub">أنا هنا لأدير أعمالك وأوفر لك الفرص وأنفذ مهامك</p>
    </div>
    <div class="exact-motto"><span class="bars">${svg.bars}</span><span>خطوة صغيرة<br>لنتائج كبيرة</span></div>`;

  const grid=home.querySelector('.approved-command-grid');
  if(grid){
    const byClass=name=>grid.querySelector(`.approved-command.${name}`);
    ['trade','business','projects','clients','calls','tasks'].forEach(name=>{
      const el=byClass(name); if(el) grid.appendChild(el);
    });
  }

  const summary=home.querySelector('.approved-summary');
  if(summary){
    const done=summary.querySelector('.done'), running=summary.querySelector('.running'), late=summary.querySelector('.late');
    [done,running,late].forEach(el=>el&&summary.appendChild(el));
  }

  const activity=home.querySelector('#homeActivity');
  if(activity) activity.setAttribute('data-reference-limit','3');

  // Load the final approved-reference lock after all prior UI styles, preventing older rules from drifting the approved design.
  if(!document.querySelector('link[data-dalily-reference-lock]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='/dalily-reference-lock.css?v=1';
    link.dataset.dalilyReferenceLock='1';
    document.head.appendChild(link);
  }
})();
