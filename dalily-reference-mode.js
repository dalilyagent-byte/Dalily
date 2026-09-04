// Dalily — exact approved reference-image home mode.
(()=>{
  const READY=()=>new Promise(r=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',r,{once:true}):r());

  READY().then(()=>{
    const home=document.getElementById('home');
    const ws=document.getElementById('ws');
    const login=document.getElementById('loginView');
    if(!home||!ws)return;

    const screen=document.createElement('div');
    screen.className='reference-home-screen';
    screen.setAttribute('aria-label','واجهة دليلي الرئيسية المعتمدة');
    screen.innerHTML=`
      <img class="reference-home-img" alt="واجهة دليلي المعتمدة">
      <button class="reference-hotspot ref-profile" data-ref-action="settings" aria-label="حسابي"></button>
      <button class="reference-hotspot ref-bell" data-ref-action="bell" aria-label="التنبيهات"></button>
      <button class="reference-hotspot ref-search" data-ref-action="search" aria-label="بحث"></button>
      <button class="reference-hotspot ref-settings" data-ref-action="settings" aria-label="الإعدادات"></button>
      <button class="reference-hotspot ref-trade" data-ref-action="trade" aria-label="التجارة"></button>
      <button class="reference-hotspot ref-business" data-ref-action="business" aria-label="الأعمال"></button>
      <button class="reference-hotspot ref-projects" data-ref-action="projects" aria-label="المشاريع"></button>
      <button class="reference-hotspot ref-clients" data-ref-action="clients" aria-label="العملاء"></button>
      <button class="reference-hotspot ref-calls" data-ref-action="calls" aria-label="اتصل"></button>
      <button class="reference-hotspot ref-tasks" data-ref-action="tasks" aria-label="مهامي"></button>
      <button class="reference-hotspot ref-summary" data-ref-action="tasks" aria-label="ملخص المهام"></button>
      <button class="reference-hotspot ref-activity" data-ref-action="reports" aria-label="آخر الأنشطة"></button>
      <button class="reference-hotspot ref-command" data-ref-action="chat" aria-label="تكلم مع دليلي"></button>
      <button class="reference-hotspot ref-nav-account" data-ref-action="settings" aria-label="حسابي"></button>
      <button class="reference-hotspot ref-nav-reports" data-ref-action="reports" aria-label="التقارير"></button>
      <button class="reference-hotspot ref-nav-favorites" data-ref-action="favorites" aria-label="المفضلة"></button>
      <button class="reference-hotspot ref-nav-chat" data-ref-action="chat" aria-label="المحادثة"></button>
      <button class="reference-hotspot ref-nav-home" data-ref-action="home" aria-label="الرئيسية"></button>`;
    document.body.appendChild(screen);

    const image=screen.querySelector('.reference-home-img');

    async function loadApprovedReference(){
      try{
        const stamp='20260904-exact-7';
        const files=['0','1a','1b','1c','1d','2a','2b','2c','2d','3','4','5','6'];
        const parts=await Promise.all(files.map(async part=>{
          const res=await fetch(`/dalily-ref-${part}.txt?v=${stamp}`,{cache:'no-store'});
          if(!res.ok)throw new Error(`ref ${part}: ${res.status}`);
          return (await res.text()).trim();
        }));
        image.onload=()=>{
          screen.classList.add('reference-ready');
          syncVisibility();
        };
        image.onerror=()=>console.error('Dalily approved reference could not be decoded');
        image.src='data:image/webp;base64,'+parts.join('');
      }catch(err){
        console.error('Dalily approved reference load failed',err);
      }
    }

    function workspaceIsOpen(){
      const wsStyle=getComputedStyle(ws);
      const loginStyle=login?getComputedStyle(login):null;
      return wsStyle.display!=='none' && (!loginStyle || loginStyle.display==='none');
    }

    function syncVisibility(){
      const show=screen.classList.contains('reference-ready') && home.classList.contains('active') && workspaceIsOpen();
      screen.classList.toggle('is-visible',show);
      document.body.classList.toggle('reference-home-active',show);
    }

    function clickSelector(selector){
      const el=document.querySelector(selector);
      if(!el)return false;
      el.click();
      setTimeout(syncVisibility,0);
      return true;
    }

    function openChatWithPrompt(prompt=''){
      if(!clickSelector('.tab[data-tab="chat"]')) clickSelector('[data-goto="chat"]');
      setTimeout(()=>{
        const input=document.getElementById('ci');
        if(input){input.value=prompt;input.focus();}
      },30);
    }

    function perform(action){
      switch(action){
        case 'home': syncVisibility(); break;
        case 'settings': clickSelector('[data-goto="settings"]')||clickSelector('.tab[data-tab="settings"]'); break;
        case 'reports': clickSelector('.tab[data-tab="reports"]')||clickSelector('[data-goto="reports"]'); break;
        case 'favorites': clickSelector('.tab[data-tab="favorites"]')||clickSelector('[data-goto="favorites"]'); break;
        case 'chat': openChatWithPrompt(''); break;
        case 'search': openChatWithPrompt('ابحث لي عن '); break;
        case 'trade': clickSelector('#home .approved-command.trade'); break;
        case 'business': clickSelector('#home .approved-command.business'); break;
        case 'projects': clickSelector('#home .approved-command.projects'); break;
        case 'clients': clickSelector('#home .approved-command.clients'); break;
        case 'calls': clickSelector('#home .approved-command.calls'); break;
        case 'tasks': clickSelector('#home .approved-command.tasks'); break;
        case 'bell': break;
      }
    }

    screen.addEventListener('click',e=>{
      const hit=e.target.closest('[data-ref-action]');
      if(!hit)return;
      e.preventDefault();
      perform(hit.dataset.refAction);
    });

    const obs=new MutationObserver(syncVisibility);
    obs.observe(home,{attributes:true,attributeFilter:['class','style']});
    obs.observe(ws,{attributes:true,attributeFilter:['class','style','hidden']});
    if(login)obs.observe(login,{attributes:true,attributeFilter:['class','style','hidden']});
    document.addEventListener('click',()=>setTimeout(syncVisibility,0),true);
    window.addEventListener('pageshow',syncVisibility);
    window.addEventListener('resize',syncVisibility);

    loadApprovedReference();
    syncVisibility();
  });
})();
