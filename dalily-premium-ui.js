// Dalily — approved mockup match. Loaded before dalily-v2.js so native handlers bind to final DOM.
(()=>{
  const home=document.getElementById('home');
  const nav=document.querySelector('.bottom-nav');
  const topbar=document.querySelector('.topbar');
  const workspace=document.getElementById('ws');
  if(!home||!nav||!topbar||!workspace)return;

  const svg={
    user:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.6-7 8-7s7.2 2 8 7z"/></svg>`,
    bell:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
    search:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
    gear:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-2.83 2.83-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1.08 1.65V21h-4v-.08A1.8 1.8 0 0 0 8.85 19.3a1.8 1.8 0 0 0-1.98.36l-.06.06-2.83-2.83.06-.06A1.8 1.8 0 0 0 4.4 15a1.8 1.8 0 0 0-1.65-1.08H2v-4h.08A1.8 1.8 0 0 0 3.7 8.85a1.8 1.8 0 0 0-.36-1.98l-.06-.06 2.83-2.83.06.06A1.8 1.8 0 0 0 8.15 4.4 1.8 1.8 0 0 0 9.23 2.75V2h4v.08A1.8 1.8 0 0 0 14.3 3.7a1.8 1.8 0 0 0 1.98-.36l.06-.06 2.83 2.83-.06.06a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.65 1.08H21v4h-.08A1.8 1.8 0 0 0 19.4 15z"/></svg>`,
    trade:`<svg viewBox="0 0 48 48"><path d="M7 37h7V27H7zM20 37h7V20h-7zM33 37h7V12h-7z"/><path d="m8 22 10-8 8 5 13-12"/><path d="M34 7h5v5"/></svg>`,
    business:`<svg viewBox="0 0 48 48"><rect x="12" y="7" width="24" height="34" rx="3"/><path d="m17 15 2 2 4-4M17 23l2 2 4-4M17 31l2 2 4-4M27 15h5M27 23h5M27 31h5"/></svg>`,
    projects:`<svg class="fill" viewBox="0 0 48 48"><path d="M7 40V18l17-11 17 11v22H29V27H19v13z"/></svg>`,
    clients:`<svg class="fill" viewBox="0 0 48 48"><circle cx="24" cy="16" r="7"/><circle cx="10" cy="20" r="5"/><circle cx="38" cy="20" r="5"/><path d="M12 40c1-9 5-14 12-14s11 5 12 14zM1 39c1-7 4-11 9-11 3 0 5 1 7 4-1 2-2 4-2 7zM47 39c-1-7-4-11-9-11-3 0-5 1-7 4 1 2 2 4 2 7z"/></svg>`,
    phone:`<svg class="fill" viewBox="0 0 48 48"><path d="M11 5c3-2 7 5 8 9l-5 4c3 7 8 12 15 15l4-5c4 1 11 5 9 8-2 5-7 8-12 7C17 40 8 31 5 18 4 13 6 7 11 5z"/></svg>`,
    tasks:`<svg viewBox="0 0 48 48"><rect x="8" y="10" width="32" height="30" rx="4"/><path d="M15 6v8M33 6v8M8 18h32M15 24h5M28 24h5M15 31h5M28 31h5"/></svg>`,
    home:`<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`,
    chat:`<svg viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/></svg>`,
    star:`<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9z"/></svg>`,
    reports:`<svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>`,
    account:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 3.6-7 8-7s7 2 8 7"/></svg>`
  };

  let clients=document.getElementById('clients');
  if(!clients){clients=document.createElement('section');clients.id='clients';clients.className='panel';nav.before(clients)}
  let favorites=document.getElementById('favorites');
  if(!favorites){favorites=document.createElement('section');favorites.id='favorites';favorites.className='panel';nav.before(favorites)}

  topbar.innerHTML=`
    <div class="topbar-side topbar-left">
      <button class="profile-button" data-goto="settings" type="button" aria-label="حسابي">${svg.user}</button>
      <button class="notify-button" type="button" aria-label="التنبيهات">${svg.bell}<b>3</b></button>
    </div>
    <div class="dalily-brand" aria-label="دليلي">
      <div class="dalily-word">دليلي<span class="dalily-mark">›</span></div>
      <div class="dalily-en">D A L I L Y</div>
      <div class="dalily-tagline">مدير أعمالك الذكي</div>
    </div>
    <div class="topbar-side topbar-right">
      <button class="round-action" data-chatprompt="ابحث لي عن " type="button" aria-label="بحث">${svg.search}</button>
      <button class="round-action" data-goto="settings" type="button" aria-label="الإعدادات">${svg.gear}</button>
    </div>`;

  home.innerHTML=`
    <section class="approved-hero">
      <div class="hero-copy">
        <h2>مرحباً أبو بندر 👋</h2>
        <p class="hero-question">وش تبي نسوي اليوم؟</p>
        <p class="hero-sub">أنا هنا أدير أعمالك وأوفر لك الفرص وأنفذ مهامك</p>
      </div>
      <div class="hero-motto"><span class="motto-icon">⌁</span><span>خطوة صغيرة<br>نتائج كبيرة</span></div>
    </section>

    <section class="approved-command-grid" aria-label="الأوامر الرئيسية">
      <button class="approved-command trade" data-premium-run="ابحث الآن في الويب عن أفضل 3 فرص تجارية واستثمارية قابلة للتنفيذ الآن. ابدأ بالفرص منخفضة التكلفة وتحت 1000 ريال إن وجدت، وركز على السعودية وخصوصاً جدة والطائف أو الفرص الرقمية. رتّبها من الأفضل، ولكل فرصة أعطني التكلفة المتوقعة والربح المحتمل والمخاطر وسبب اختيارها وأول خطوة عملية، ثم دعني أختار منها." type="button"><span class="approved-icon">${svg.trade}</span><strong>التجارة</strong><small>البحث عن فرص استثمارية<br>وتنفيذها</small><i>→</i></button>
      <button class="approved-command business" data-goto="tasks" type="button"><span class="approved-icon">${svg.business}</span><strong>الأعمال</strong><small>مهامك اليومية<br>ومتابعة التنفيذ</small><i>→</i></button>
      <button class="approved-command projects" data-goto="projects" type="button"><span class="approved-icon">${svg.projects}</span><strong>المشاريع</strong><small>جميع مشاريعك<br>في مكان واحد</small><i>→</i></button>

      <button class="approved-command tasks" data-goto="tasks" type="button"><span class="approved-icon">${svg.tasks}</span><strong>مهامي</strong><small>المهام والمواعيد<br>والتذكيرات</small><i>→</i></button>
      <button class="approved-command calls" data-chatprompt="اتصل على " type="button"><span class="approved-icon">${svg.phone}</span><strong>اتصل</strong><small>دليلي يتصل بالعميل<br>ويعطيك تقرير</small><i>→</i></button>
      <button class="approved-command clients" data-goto="clients" type="button"><span class="approved-icon">${svg.clients}</span><strong>العملاء</strong><small>إدارة العملاء<br>والمتابعات</small><i>→</i></button>
    </section>

    <section class="approved-summary" aria-label="ملخص المهام">
      <div class="summary-card late"><span class="summary-symbol">!</span><strong id="homeAttention">0</strong><div><b>مهام متأخرة</b><small>تحتاج قرارك</small></div></div>
      <div class="summary-card running"><span class="summary-symbol">◷</span><strong id="homeTasks">0</strong><div><b>مهام قيد التنفيذ</b><small>بانتظار المتابعة</small></div></div>
      <div class="summary-card done"><span class="summary-symbol">✓</span><strong id="homeDone">0</strong><div><b>مهام مكتملة</b><small>هذا الأسبوع</small></div></div>
    </section>

    <section class="approved-activity section">
      <div class="section-head"><h3>آخر الأنشطة</h3><button class="activity-link" data-goto="reports" type="button">عرض الكل ‹</button></div>
      <div id="homeActivity" class="activity-list"><div class="empty">كل شيء هادئ الآن. أعط دليلي أول طلب.</div></div>
    </section>

    <section class="home-command-box" aria-label="تكلم مع دليلي">
      <button class="attach-button" type="button" aria-label="إرفاق">⌕</button>
      <div class="home-command-copy"><input id="homeCommand" maxlength="4000" placeholder="تكلم مع دليلي ..."><small>اكتب أي طلب وسيقوم دليلي بتنفيذه</small></div>
      <button id="homeCommandSend" class="home-send" type="button" aria-label="إرسال">➤</button>
    </section>`;

  clients.innerHTML=`
    <div class="content-card approved-inner-page">
      <div class="inner-page-title"><span class="inner-icon">♟</span><div><h2>العملاء</h2><p>إدارة العملاء والتواصل والمتابعات من مكان واحد.</p></div></div>
      <div class="client-actions">
        <button class="client-action featured" data-chatprompt="فحص العميل: " type="button">فحص العميل<span>اكتب اسم العميل أو رقمه ودليلي يجمع لك المعلومات المتاحة قبل التعامل.</span></button>
        <button class="client-action" data-premium-run="راجع مهامي المفتوحة وحدد أي عملاء أو أشخاص يحتاجون متابعة اليوم، ورتبهم حسب الأولوية مع سبب المتابعة والخطوة المطلوبة." type="button">متابعة اليوم<span>من يحتاج اتصال أو رد الآن</span></button>
        <button class="client-action" data-chatprompt="ابحث في جهات اتصالي عن " type="button">جهات الاتصال<span>ابحث عن شخص محفوظ لديك</span></button>
        <button class="client-action" data-chatprompt="أرسل بريد إلى " type="button">مراسلة عميل<span>جهّز الرسالة أو الإرسال</span></button>
        <button class="client-action" data-chatprompt="اتصل على " type="button">اتصال بعميل<span>رقم العميل وتعليمات المكالمة</span></button>
      </div>
    </div>`;

  favorites.innerHTML=`
    <div class="content-card approved-inner-page">
      <div class="inner-page-title"><span class="inner-icon">☆</span><div><h2>المفضلة</h2><p>أوامرك الأكثر استخداماً جاهزة بضغطة.</p></div></div>
      <div class="favorite-grid">
        <button data-chatprompt="أعطني تقرير المدير المختصر" type="button"><b>تقرير المدير</b><span>ملخص المشاريع والمهام</span></button>
        <button data-chatprompt="اعرض لي آخر 3 رسائل في بريدي" type="button"><b>آخر البريد</b><span>قراءة آخر الرسائل المهمة</span></button>
        <button data-chatprompt="أنشئ لي موعد في التقويم " type="button"><b>موعد جديد</b><span>إضافة موعد إلى التقويم</span></button>
        <button data-chatprompt="ابحث لي عن " type="button"><b>بحث سريع</b><span>ابحث ودع دليلي يلخص لك</span></button>
      </div>
    </div>`;

  nav.innerHTML=`
    <button class="tab active" data-tab="home" type="button"><span class="nav-icon">${svg.home}</span><span>الرئيسية</span></button>
    <button class="tab" data-tab="chat" type="button"><span class="nav-icon">${svg.chat}</span><span>المحادثة</span></button>
    <button class="tab" data-tab="favorites" type="button"><span class="nav-icon">${svg.star}</span><span>المفضلة</span></button>
    <button class="tab" data-tab="reports" type="button"><span class="nav-icon">${svg.reports}</span><span>التقارير</span></button>
    <button class="tab" data-tab="settings" type="button"><span class="nav-icon">${svg.account}</span><span>حسابي</span></button>`;

  const tasks=document.getElementById('tasks'),projects=document.getElementById('projects');
  function tabs(active){return `<div class="work-tabs"><button class="work-tab ${active==='tasks'?'active':''}" data-goto="tasks" type="button">الأعمال</button><button class="work-tab ${active==='projects'?'active':''}" data-goto="projects" type="button">المشاريع</button></div>`}
  tasks?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('tasks'));
  projects?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('projects'));

  function runPrompt(prompt){
    document.querySelector('.tab[data-tab="chat"]')?.click();
    setTimeout(()=>{const input=document.getElementById('ci'),form=document.getElementById('cf');if(!input||!form)return;input.value=prompt;input.focus();form.requestSubmit()},120);
  }
  document.querySelectorAll('[data-premium-run]').forEach(button=>button.addEventListener('click',()=>runPrompt(button.dataset.premiumRun||'')));

  const homeInput=document.getElementById('homeCommand'),homeSend=document.getElementById('homeCommandSend');
  const submitHome=()=>{const value=homeInput?.value.trim();if(value)runPrompt(value)};
  homeSend?.addEventListener('click',submitHome);
  homeInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitHome()}});

  const attention=document.getElementById('homeAttention');
  if(attention)attention.textContent='0';
})();