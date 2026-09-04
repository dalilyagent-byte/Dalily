// Dalily approved dashboard layout. Loaded before dalily-v2.js so native handlers bind to the final DOM.
(()=>{
  const home=document.getElementById('home');
  const nav=document.querySelector('.bottom-nav');
  const topbar=document.querySelector('.topbar');
  const workspace=document.getElementById('ws');
  if(!home||!nav||!topbar||!workspace)return;

  // Add panels used by the approved navigation before the main app binds handlers.
  let clients=document.getElementById('clients');
  if(!clients){
    clients=document.createElement('section');
    clients.id='clients';
    clients.className='panel';
    nav.before(clients);
  }
  let favorites=document.getElementById('favorites');
  if(!favorites){
    favorites=document.createElement('section');
    favorites.id='favorites';
    favorites.className='panel';
    nav.before(favorites);
  }

  topbar.innerHTML=`
    <div class="topbar-side topbar-left">
      <button class="profile-button" data-goto="settings" type="button" aria-label="حسابي"><span>👤</span></button>
      <button class="notify-button" type="button" aria-label="التنبيهات"><span>♧</span><b>3</b></button>
    </div>
    <div class="dalily-brand" aria-label="دليلي">
      <div class="dalily-word">دليلي<span class="dalily-mark">›</span></div>
      <div class="dalily-en">D A L I L Y</div>
      <div class="dalily-tagline">مدير أعمالك الذكي</div>
    </div>
    <div class="topbar-side topbar-right">
      <button class="round-action" data-chatprompt="ابحث لي عن " type="button" aria-label="بحث">⌕</button>
      <button class="round-action" data-goto="settings" type="button" aria-label="الإعدادات">⚙</button>
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
      <button class="approved-command trade" data-premium-run="ابحث الآن في الويب عن أفضل 3 فرص تجارية واستثمارية قابلة للتنفيذ الآن. ابدأ بالفرص منخفضة التكلفة وتحت 1000 ريال إن وجدت، وركز على السعودية وخصوصاً جدة والطائف أو الفرص الرقمية. رتّبها من الأفضل، ولكل فرصة أعطني التكلفة المتوقعة والربح المحتمل والمخاطر وسبب اختيارها وأول خطوة عملية، ثم دعني أختار منها." type="button"><span class="approved-icon">↗</span><strong>التجارة</strong><small>البحث عن فرص استثمارية<br>وتنفيذها</small><i>←</i></button>
      <button class="approved-command business" data-goto="tasks" type="button"><span class="approved-icon">☷</span><strong>الأعمال</strong><small>مهامك اليومية<br>ومتابعة التنفيذ</small><i>←</i></button>
      <button class="approved-command projects" data-goto="projects" type="button"><span class="approved-icon">⌂</span><strong>المشاريع</strong><small>جميع مشاريعك<br>في مكان واحد</small><i>←</i></button>
      <button class="approved-command clients" data-goto="clients" type="button"><span class="approved-icon">♟</span><strong>العملاء</strong><small>إدارة العملاء<br>والمتابعات</small><i>←</i></button>
      <button class="approved-command calls" data-chatprompt="اتصل على " type="button"><span class="approved-icon">☎</span><strong>اتصل</strong><small>دليلي يتصل بالعميل<br>ويعطيك تقرير</small><i>←</i></button>
      <button class="approved-command tasks" data-goto="tasks" type="button"><span class="approved-icon">▦</span><strong>مهامي</strong><small>المهام والمواعيد<br>والتذكيرات</small><i>←</i></button>
    </section>

    <section class="approved-summary" aria-label="ملخص المهام">
      <div class="summary-card done"><span class="summary-symbol">✓</span><strong id="homeDone">0</strong><div><b>مهام مكتملة</b><small>هذا الأسبوع</small></div></div>
      <div class="summary-card running"><span class="summary-symbol">◷</span><strong id="homeTasks">0</strong><div><b>مهام قيد التنفيذ</b><small>بانتظار المتابعة</small></div></div>
      <div class="summary-card late"><span class="summary-symbol">!</span><strong id="homeAttention">0</strong><div><b>مهام متأخرة</b><small>تحتاج قرارك</small></div></div>
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
    <button class="tab active" data-tab="home" type="button"><span class="nav-icon">⌂</span><span>الرئيسية</span></button>
    <button class="tab" data-tab="chat" type="button"><span class="nav-icon">▢</span><span>المحادثة</span></button>
    <button class="tab" data-tab="favorites" type="button"><span class="nav-icon">☆</span><span>المفضلة</span></button>
    <button class="tab" data-tab="reports" type="button"><span class="nav-icon">▥</span><span>التقارير</span></button>
    <button class="tab" data-tab="settings" type="button"><span class="nav-icon">♙</span><span>حسابي</span></button>`;

  const tasks=document.getElementById('tasks');
  const projects=document.getElementById('projects');
  function tabs(active){return `<div class="work-tabs"><button class="work-tab ${active==='tasks'?'active':''}" data-goto="tasks" type="button">الأعمال</button><button class="work-tab ${active==='projects'?'active':''}" data-goto="projects" type="button">المشاريع</button></div>`}
  tasks?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('tasks'));
  projects?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('projects'));

  function runPrompt(prompt){
    document.querySelector('.tab[data-tab="chat"]')?.click();
    setTimeout(()=>{const input=document.getElementById('ci'),form=document.getElementById('cf');if(!input||!form)return;input.value=prompt;input.focus();form.requestSubmit()},120);
  }
  document.querySelectorAll('[data-premium-run]').forEach(button=>button.addEventListener('click',()=>runPrompt(button.dataset.premiumRun||'')));

  const homeInput=document.getElementById('homeCommand');
  const homeSend=document.getElementById('homeCommandSend');
  const submitHome=()=>{const value=homeInput?.value.trim();if(value)runPrompt(value)};
  homeSend?.addEventListener('click',submitHome);
  homeInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitHome()}});

  // There is no due-date field in the current task model yet; keep overdue at zero until it is added.
  const attention=document.getElementById('homeAttention');
  if(attention)attention.textContent='0';
})();
