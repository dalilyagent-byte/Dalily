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
    if(!previousCard){card.classList.remove('show');return;}
    card.classList.toggle('show',!!previousCard.show);
    const title=document.getElementById('lastExecutionTitle');
    const status=document.getElementById('lastExecutionStatus');
    if(title)title.textContent=previousCard.title;
    if(status)status.textContent=previousCard.status;
  }
  function isExecutionResponse(data){
    if(data?.mode==='voice')return true;
    const type=data?.action?.type||'';
    return EXECUTION_ACTIONS.has(type);
  }

  // Start every chat turn as a normal answer; promote it only when the API says a real action happened.
  document.addEventListener('submit',e=>{
    if(e.target?.id==='cf'){
      shouldRecord=false;
      snapshotCard();
      setTimeout(()=>{
        const state=document.getElementById('chatState');
        if(state?.textContent==='ينفذ الآن')state.textContent='يفكر...';
        document.querySelectorAll('.bubble.thinking').forEach(b=>{
          if(b.textContent==='دليلي ينفذ...')b.textContent='دليلي يرد...';
        });
      },0);
    }
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
        if(!shouldRecord){setTimeout(restoreCard,30);setTimeout(restoreCard,180);}
      }
    }catch{}
    return response;
  };

  Storage.prototype.setItem=function(key,value){
    if((key==='dalily-last-execution'||key==='dalily-executions')&&!shouldRecord)return;
    return rawSetItem.call(this,key,value);
  };

  const observer=new MutationObserver(()=>{
    if(!shouldRecord)restoreCard();
  });
  window.addEventListener('DOMContentLoaded',()=>{
    const card=document.getElementById('lastExecution');
    if(card)observer.observe(card,{subtree:true,childList:true,attributes:true,characterData:true});
  },{once:true});
})();
