self.addEventListener('push',event=>{const data=event.data?.json?.()||{};event.waitUntil(self.registration.showNotification(data.title||'دليلي',{body:data.body||'عندك تحديث جديد.',icon:'/dalily-icon-v2.png?v=10',badge:'/dalily-icon-v2.png?v=10',tag:data.tag||'dalily-background',data:{url:data.url||'/app.html'}}));});
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification.data?.url||'/app.html';
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
    for(const client of clients){if('focus'in client){client.navigate(target);return client.focus();}}
    return self.clients.openWindow?self.clients.openWindow(target):undefined;
  }));
});