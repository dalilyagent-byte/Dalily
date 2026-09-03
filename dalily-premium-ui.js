// Dalily premium layout, loaded before dalily-v2.js so native handlers bind to final DOM.
(()=>{
  const home=document.getElementById('home');
  const clients=document.getElementById('clients');
  const nav=document.querySelector('.bottom-nav');
  const tasks=document.getElementById('tasks');
  const projects=document.getElementById('projects');
  if(!home||!clients||!nav)return;

  home.innerHTML=`
    <div class="hero-card"><div class="hero-text"><h2>هلا أبو بندر 👋</h2><p>كيف نقدر نساعدك اليوم؟</p></div></div>
    <div class="command-grid">
      <button class="command-card trade" data-premium-run="ابحث الآن في الويب عن أفضل 3 فرص تجارية واستثمارية قابلة للتنفيذ الآن. ابدأ بالفرص منخفضة التكلفة وتحت 1000 ريال إن وجدت، وركز على السعودية وخصوصاً جدة والطائف أو الفرص الرقمية. رتّبها من الأفضل، ولكل فرصة أعطني التكلفة المتوقعة والربح المحتمل والمخاطر وسبب اختيارها وأول خطوة عملية، ثم دعني أختار منها." type="button"><span class="command-icon">♧</span><span class="command-copy"><span class="command-title">التجارة</span><span class="command-note">فرص واستثمار ومتابعة التجارة</span></span></button>
      <button class="command-card business" data-goto="tasks" type="button"><span class="command-icon">▣</span><span class="command-copy"><span class="command-title">الأعمال</span><span class="command-note">إدارة أعمالك وتنظيم مهامك</span></span></button>
      <button class="command-card calls" data-chatprompt="اتصل على " type="button"><span class="command-icon">☎</span><span class="command-copy"><span class="command-title">الاتصالات</span><span class="command-note">إدارة وإجراء اتصالات العملاء</span></span></button>
      <button class="command-card projects" data-goto="projects" type="button"><span class="command-icon">◔</span><span class="command-copy"><span class="command-title">المشاريع</span><span class="command-note">متابعة مشاريعك والمهام اليومية</span></span></button>
    </div>
    <div class="section compact-today"><div class="section-head"><h3>اليوم</h3><span class="subtle">ملخص سريع</span></div><div class="today-grid">
      <div class="metric-card"><strong id="homeTasks">0</strong><span>مفتوحة</span></div>
      <div class="metric-card"><strong id="homeProjects">0</strong><span>مشاريع</span></div>
      <div class="metric-card"><strong id="homeOpps">0</strong><span>فرص</span></div>
      <div class="metric-card"><strong id="homeDone">0</strong><span>منجزة</span></div>
    </div></div>
    <div class="section"><div class="section-head"><h3>آخر النشاط</h3><button class="secondary mini" data-goto="reports" type="button">عرض الكل</button></div><div id="homeActivity" class="activity-list"><div class="empty">كل شيء هادئ الآن. اختر أمراً من الأعلى.</div></div></div>`;

  clients.innerHTML=`<div class="content-card"><div class="client-hero"><h2>العملاء</h2><p>إدارة التواصل والتحقق قبل التعامل من مكان واحد.</p></div><div class="client-actions">
    <button class="client-action featured" data-chatprompt="فحص العميل: " type="button">فحص العميل<span>اكتب اسم العميل أو رقمه ودليلي يجمع لك المعلومات المتاحة قبل التعامل.</span></button>
    <button class="client-action" data-premium-run="راجع مهامي المفتوحة وحدد أي عملاء أو أشخاص يحتاجون متابعة اليوم، ورتبهم حسب الأولوية مع سبب المتابعة والخطوة المطلوبة." type="button">متابعة اليوم<span>من يحتاج اتصال أو رد الآن</span></button>
    <button class="client-action" data-chatprompt="ابحث في جهات اتصالي عن " type="button">جهات الاتصال<span>ابحث عن شخص محفوظ لديك</span></button>
    <button class="client-action" data-chatprompt="أرسل بريد إلى " type="button">مراسلة عميل<span>جهّز الرسالة أو الإرسال</span></button>
    <button class="client-action" data-chatprompt="اتصل على " type="button">اتصال بعميل<span>رقم العميل وتعليمات المكالمة</span></button>
  </div></div>`;

  nav.innerHTML=`
    <button class="tab active" data-tab="home" type="button"><span class="nav-icon">⌂</span><span>الرئيسية</span></button>
    <button class="tab" data-tab="clients" type="button"><span class="nav-icon">♙</span><span>العملاء</span></button>
    <button class="tab" data-tab="chat" type="button"><span class="nav-icon">✦</span><span>دليلي</span></button>
    <button class="tab" data-tab="settings" type="button"><span class="nav-icon">⚙</span><span>الإعدادات</span></button>`;

  function tabs(active){return `<div class="work-tabs"><button class="work-tab ${active==='tasks'?'active':''}" data-goto="tasks" type="button">الأعمال</button><button class="work-tab ${active==='projects'?'active':''}" data-goto="projects" type="button">المشاريع</button></div>`}
  tasks?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('tasks'));
  projects?.querySelector('.content-card')?.insertAdjacentHTML('afterbegin',tabs('projects'));

  function runPrompt(prompt){
    document.querySelector('.tab[data-tab="chat"]')?.click();
    setTimeout(()=>{const input=document.getElementById('ci'),form=document.getElementById('cf');if(!input||!form)return;input.value=prompt;input.focus();form.requestSubmit()},120);
  }
  document.querySelectorAll('[data-premium-run]').forEach(button=>button.addEventListener('click',()=>runPrompt(button.dataset.premiumRun||'')));
})();
