// Dalily execution UI filter: only side-effecting operations count as "executed".
(()=>{
  const EXECUTION_ACTIONS=new Set([
    'create_task','create_project','complete_task','delete_task',
    'create_email_draft','send_email','create_calendar_event','create_drive_document'
  ]);
  let shouldRecord=false;
  let previousCard=null;
  const rawFetch=window.fetch.bind(window);
  const rawSetItem=Storage.prototype.setItem;

  function snapshotCard(){
    const card=document.getElementById('lastExecution');
    previousCard=card?{
      show:card.classList.contains('show'),
      title:document.getElementById('lastExecutionTitle')?.textContent||'',
      status:document.getElementById('lastExecutionStatus')?.textContent||''
    }:null;
  }

  function restoreCard(){
    if(shouldRecord)return;
    const card=document.getElementById('lastExecution');
    if(!card)return;
    if(!previousCard){
      card.classList.remove('show');
      return;
    }
    if(previousCard.show)card.classList.add('show');
    else card.classList.remove('show');
    const title=document.getElementById('lastExecutionTitle');
    const status=document.getElementById('lastExecutionStatus');
    if(title&&title.textContent!==previousCard.title)title.textContent=previousCard.title;
    if(status&&status.textContent!==previousCard.status)status.textContent=previousCard.status;
  }

  function isExecutionResponse(data){
    if(data?.mode==='voice')return true;
    const type=data?.action?.type||'';
    return EXECUTION_ACTIONS.has(type);
  }

  document.addEventListener('submit',e=>{
    if(e.target?.id!=='cf')return;
    shouldRecord=false;
    snapshotCard();
    setTimeout(()=>{
      const state=document.getElementById('chatState');
      if(state?.textContent==='ينفذ الآن')state.textContent='يفكر...';
      document.querySelectorAll('.bubble.thinking').forEach(b=>{
        if(b.textContent==='دليلي ينفذ...')b.textContent='دليلي يرد...';
      });
    },0);
  },true);

  window.fetch=async(...args)=>{
    const response=await rawFetch(...args);
    try{
      const input=args[0];
      const url=typeof input==='string'?input:input?.url||'';
      const method=String(args[1]?.method||input?.method||'GET').toUpperCase();
      if(url.includes('/api/chat')&&method==='POST'){
        const data=await response.clone().json().catch(()=>null);
        shouldRecord=isExecutionResponse(data);
        window.__dalilyRealExecution=shouldRecord;
        if(!shouldRecord){
          setTimeout(restoreCard,25);
          setTimeout(restoreCard,120);
          setTimeout(restoreCard,350);
        }
      }
    }catch{}
    return response;
  };

  Storage.prototype.setItem=function(key,value){
    if((key==='dalily-last-execution'||key==='dalily-executions')&&!shouldRecord)return;
    return rawSetItem.call(this,key,value);
  };
})();

(()=>{
  if(document.querySelector('script[data-dalily-notifications]'))return;
  const script=document.createElement('script');
  script.src='/dalily-notifications.js?v=1';
  script.defer=true;
  script.dataset.dalilyNotifications='1';
  document.head.appendChild(script);
})();

(()=>{
  const home=document.getElementById('home');
  const nav=document.querySelector('.bottom-nav');
  const settings=document.getElementById('settings');
  if(!home||!nav||!settings)return;

  const style=document.createElement('style');
  style.textContent=`
    .command-intro{margin-top:18px;display:flex;align-items:end;justify-content:space-between;gap:12px}
    .command-intro h3{margin:0;color:#1d2d44;font-size:20px}.command-intro p{margin:4px 0 0;color:#7e8b9b;font-size:13px}
    .command-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:11px}
    .command-card{min-height:132px;border:1px solid #e1e7ee;border-radius:23px;padding:17px;text-align:right;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:13px;box-shadow:0 8px 24px rgba(18,32,51,.055);color:#17345f;background:#fff}
    .command-card:active{transform:scale(.985)}
    .command-icon{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;font-size:23px;background:#fff;box-shadow:0 5px 14px rgba(18,32,51,.07)}
    .command-copy{display:block;width:100%}.command-title{display:block;font-size:19px;font-weight:900;margin-bottom:4px}.command-note{display:block;color:#748296;font-size:12px;line-height:1.55;font-weight:650}
    .command-card.trade{background:linear-gradient(145deg,#f0f7ff,#fff)}.command-card.business{background:linear-gradient(145deg,#effaf5,#fff)}
    .command-card.calls{background:linear-gradient(145deg,#fff7ee,#fff)}.command-card.projects{background:linear-gradient(145deg,#f6f2ff,#fff)}
    .compact-today{margin-top:18px}.compact-today .today-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
    .client-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.client-action{border:1px solid #e2e7ed;background:#fbfcfe;border-radius:17px;padding:15px;text-align:right;color:#17345f;font-weight:850;min-height:78px}.client-action span{display:block;font-size:12px;color:#7d8999;font-weight:600;margin-top:5px;line-height:1.5}
    @media(max-width:680px){.command-grid{gap:10px}.command-card{min-height:124px;padding:15px;border-radius:20px}.command-title{font-size:18px}.command-icon{width:43px;height:43px}.compact-today .metric-card{padding:10px 4px}.client-actions{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  home.innerHTML=`
    <div class="hero-card">
      <div class="hero-avatar">د</div>
      <div class="hero-text"><h2>هلا أبو بندر</h2><p>وش ننجز اليوم؟</p></div>
    </div>
    <div class="command-intro"><div><h3>مركز القيادة</h3><p>اختر القسم ودليلي يبدأ مباشرة</p></div><span class="status-pill"><span class="status-dot"></span><span>جاهز</span></span></div>
    <div class="command-grid">
      <button class="command-card trade" data-dalily-run="ابحث الآن في الويب عن أفضل 3 فرص تجارية واستثمارية قابلة للتنفيذ الآن. ابدأ بالفرص منخفضة التكلفة وتحت 1000 ريال إن وجدت، وركز على السعودية وخصوصاً جدة والطائف أو الفرص الرقمية. رتّبها من الأفضل، ولكل فرصة أعطني التكلفة المتوقعة والربح المحتمل والمخاطر وسبب اختيارها وأول خطوة عملية، ثم دعني أختار منها." type="button"><span class="command-icon">↗</span><span class="command-copy"><span class="command-title">التجارة</span><span class="command-note">يبحث عن أفضل الفرص ويقارنها لك</span></span></button>
      <button class="command-card business" data-goto="tasks" type="button"><span class="command-icon">✓</span><span class="command-copy"><span class="command-title">الأعمال</span><span class="command-note">افتح مهامك وأضف وتابع الأعمال مباشرة</span></span></button>
      <button class="command-card calls" data-chatprompt="اتصل على " type="button"><span class="command-icon">☎</span><span class="command-copy"><span class="command-title">الاتصالات</span><span class="command-note">اكتب الرقم وما تريد من دليلي قوله</span></span></button>
      <button class="command-card projects" data-goto="projects" type="button"><span class="command-icon">▣</span><span class="command-copy"><span class="command-title">المشاريع</span><span class="command-note">افتح قائمة المشاريع وحالة كل مشروع</span></span></button>
    </div>
    <div class="section compact-today">
      <div class="section-head"><h3>اليوم</h3><span class="subtle">ملخص سريع</span></div>
      <div class="today-grid">
        <div class="metric-card"><div class="metric-icon green">✓</div><strong id="homeTasks">0</strong><span>مفتوحة</span></div>
        <div class="metric-card"><div class="metric-icon blue">▣</div><strong id="homeProjects">0</strong><span>مشاريع</span></div>
        <div class="metric-card"><div class="metric-icon orange">↗</div><strong id="homeOpps">0</strong><span>فرص</span></div>
        <div class="metric-card"><div class="metric-icon purple">★</div><strong id="homeDone">0</strong><span>منجزة</span></div>
      </div>
    </div>
    <div class="section">
      <div class="section-head"><h3>آخر النشاط</h3><button class="secondary mini" data-goto="reports" type="button">التقارير</button></div>
      <div id="homeActivity" class="activity-list"><div class="empty">كل شيء هادئ الآن. اختر أمراً من الأعلى.</div></div>
    </div>`;

  const clients=document.createElement('section');
  clients.id='clients';
  clients.className='panel';
  clients.innerHTML=`<div class="content-card"><div class="section-head"><div><h2>العملاء</h2><div class="hint">متابعة العملاء وجهات الاتصال من مكان واحد.</div></div></div><div class="client-actions"><button class="client-action" data-dalily-run="راجع مهامي المفتوحة وحدد أي عملاء أو أشخاص يحتاجون متابعة اليوم، ورتبهم حسب الأولوية مع سبب المتابعة والخطوة المطلوبة." type="button">متابعة اليوم<span>من يحتاج اتصال أو رد الآن</span></button><button class="client-action" data-chatprompt="ابحث في جهات اتصالي عن " type="button">جهات الاتصال<span>ابحث عن شخص محفوظ لديك</span></button><button class="client-action" data-chatprompt="أرسل بريد إلى " type="button">مراسلة عميل<span>جهّز الإرسال من خلال دليلي</span></button><button class="client-action" data-chatprompt="اتصل على " type="button">اتصال بعميل<span>رقم + تعليمات المكالمة</span></button></div></div>`;
  settings.parentNode.insertBefore(clients,settings);

  nav.innerHTML=`<button class="tab active" data-tab="home" type="button"><span class="nav-icon">⌂</span><span>الرئيسية</span></button><button class="tab" data-tab="clients" type="button"><span class="nav-icon">♙</span><span>العملاء</span></button><button class="tab" data-tab="chat" type="button"><span class="nav-icon">◯</span><span>دليلي</span></button><button class="tab" data-tab="settings" type="button"><span class="nav-icon">⚙</span><span>الإعدادات</span></button>`;

  function runPrompt(prompt){
    const chatTab=document.querySelector('.tab[data-tab="chat"]');
    chatTab?.click();
    setTimeout(()=>{
      const input=document.getElementById('ci');
      const form=document.getElementById('cf');
      if(!input||!form)return;
      input.value=prompt;
      input.focus();
      form.requestSubmit();
    },120);
  }
  document.querySelectorAll('[data-dalily-run]').forEach(button=>button.addEventListener('click',()=>runPrompt(button.dataset.dalilyRun||'')));
})();
