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

  // Every turn starts as a normal reply. The API promotes it only when a real action occurred.
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

// Load Dalily notification center without touching the main module or navigation handlers.
(()=>{
  if(document.querySelector('script[data-dalily-notifications]'))return;
  const script=document.createElement('script');
  script.src='/dalily-notifications.js?v=1';
  script.defer=true;
  script.dataset.dalilyNotifications='1';
  document.head.appendChild(script);
})();
