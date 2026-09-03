(()=>{
  const $=id=>document.getElementById(id);
  const KEY='dalily-executions';
  const READ_KEY='dalily-notifications-read-at';

  function safeHistory(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(value)?value.filter(Boolean).slice(0,30):[];
    }catch{return[]}
  }
  function readAt(){return Number(localStorage.getItem(READ_KEY)||0)||0}
  function iconFor(item){
    const text=String(item?.title||'');
    const status=String(item?.status||'');
    if(/تعذر|فشل|خطأ/.test(status+text))return['!','error'];
    if(/مكالمة|اتصال/.test(text))return['☎',''];
    if(/بريد|Gmail|مسودة/.test(text))return['✉',''];
    if(/موعد|تقويم/.test(text))return['▣',''];
    if(/مهمة/.test(text))return['✓',''];
    if(/Drive|مستند/.test(text))return['▤',''];
    return['✓',''];
  }
  function unreadCount(){
    const last=readAt();
    return safeHistory().filter(x=>Number(x.at||0)>last).length;
  }
  function updateBadge(){
    const badge=$('notificationBadge');
    if(!badge)return;
    const count=unreadCount();
    badge.textContent=count>9?'9+':String(count);
    badge.classList.toggle('show',count>0);
  }
  function render(){
    const list=$('notificationList');
    if(!list)return;
    const history=safeHistory();
    if(!history.length){
      list.innerHTML='<div class="notification-empty">ما عندك تنبيهات جديدة حالياً.<br>نتائج التنفيذ والمكالمات بتظهر هنا.</div>';
      return;
    }
    list.innerHTML='';
    history.slice(0,12).forEach(item=>{
      const [icon,cls]=iconFor(item);
      const row=document.createElement('div');
      row.className='notification-item';
      const iconBox=document.createElement('div');
      iconBox.className='notification-icon'+(cls?' '+cls:'');
      iconBox.textContent=icon;
      const main=document.createElement('div');
      main.className='notification-main';
      const title=document.createElement('div');
      title.className='notification-title';
      title.textContent=item.title||'نتيجة من دليلي';
      const meta=document.createElement('div');
      meta.className='notification-meta';
      meta.textContent=(item.status||'مكتمل')+' • '+(item.time||'الآن');
      main.append(title,meta);row.append(iconBox,main);list.appendChild(row);
    });
  }
  function open(){
    render();
    $('notificationBackdrop')?.classList.add('show');
    $('notificationSheet')?.classList.add('show');
    localStorage.setItem(READ_KEY,String(Date.now()));
    updateBadge();
  }
  function close(){
    $('notificationBackdrop')?.classList.remove('show');
    $('notificationSheet')?.classList.remove('show');
  }
  function init(){
    $('notificationBtn')?.addEventListener('click',open);
    $('notificationClose')?.addEventListener('click',close);
    $('notificationBackdrop')?.addEventListener('click',close);
    $('notificationReports')?.addEventListener('click',()=>{
      close();
      document.querySelector('.tab[data-tab="reports"]')?.click();
    });
    updateBadge();
    setInterval(updateBadge,2500);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateBadge()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
