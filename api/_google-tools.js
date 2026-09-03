import crypto from 'node:crypto';

const GOOGLE_ACTIONS = new Set([
  'list_email','create_email_draft','send_email','list_calendar','create_calendar_event',
  'search_contacts','search_drive','create_drive_document'
]);

function unseal(value, secret) {
  const packed = Buffer.from(value, 'base64url');
  if (packed.length < 29) throw new Error('invalid_google_session');
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const encrypted = packed.subarray(28);
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

async function accessToken(req) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('إعدادات Google غير مكتملة في دليلي.');
  const sealed = parseCookies(req.headers.cookie || '')['__Host-dalily_google_refresh'];
  if (!sealed) throw new Error('صلاحيات Google تحتاج إعادة ربط من صفحة دليلي.');
  let refreshToken;
  try { refreshToken = unseal(sealed, clientSecret); }
  catch { throw new Error('صلاحيات Google تحتاج إعادة ربط من صفحة دليلي.'); }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token'})
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw new Error(data.error_description || 'تعذر تجديد صلاحية Google.');
  return data.access_token;
}

async function gfetch(token, url, options = {}) {
  const headers = {...(options.headers || {}), Authorization: `Bearer ${token}`};
  const r = await fetch(url, {...options, headers});
  const text = await r.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {text}; }
  if (!r.ok) throw new Error(data?.error?.message || `Google API ${r.status}`);
  return data;
}

function b64url(value) { return Buffer.from(value, 'utf8').toString('base64url'); }
function emailRaw({to, subject, body}) {
  return b64url(`To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\nMIME-Version: 1.0\r\n\r\n${body}`);
}
function header(message, name) { return message?.payload?.headers?.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''; }
function dt(value) {
  const s = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) return `${s}+03:00`;
  return s;
}

async function listEmail(token, a) {
  const q = String(a.query || '').trim();
  const limit = Math.min(Math.max(Number(a.limit || 5), 1), 10);
  const p = new URLSearchParams({maxResults: String(limit)}); if (q) p.set('q', q);
  const list = await gfetch(token, `https://gmail.googleapis.com/gmail/v1/users/me/messages?${p}`);
  const ids = (list.messages || []).slice(0, limit);
  if (!ids.length) return 'ما لقيت رسائل مطابقة في Gmail.';
  const msgs = await Promise.all(ids.map(x => gfetch(token, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${x.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)));
  return 'أحدث الرسائل:\n' + msgs.map((m,i) => `${i+1}. ${header(m,'Subject') || '(بدون عنوان)'} — من ${header(m,'From') || 'غير معروف'}\n${String(m.snippet || '').slice(0,180)}`).join('\n');
}

async function createDraft(token, a) {
  const data = await gfetch(token, 'https://gmail.googleapis.com/gmail/v1/users/me/drafts', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:{raw:emailRaw(a)}})});
  return `تم إنشاء مسودة البريد إلى ${a.to}${data.id ? ` — رقم المسودة ${data.id}` : ''}.`;
}
async function sendEmail(token, a) {
  const data = await gfetch(token, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({raw:emailRaw(a)})});
  return `تم إرسال البريد إلى ${a.to}${data.id ? ` — رقم الرسالة ${data.id}` : ''}.`;
}
async function listCalendar(token, a) {
  const limit = Math.min(Math.max(Number(a.limit || 5), 1), 10);
  const p = new URLSearchParams({timeMin:new Date().toISOString(), maxResults:String(limit), singleEvents:'true', orderBy:'startTime'});
  const data = await gfetch(token, `https://www.googleapis.com/calendar/v3/calendars/primary/events?${p}`);
  const items = data.items || [];
  if (!items.length) return 'ما عندك مواعيد قادمة في التقويم.';
  return 'مواعيدك القادمة:\n' + items.map((e,i) => `${i+1}. ${e.summary || '(بدون عنوان)'} — ${e.start?.dateTime || e.start?.date || ''}`).join('\n');
}
async function createCalendarEvent(token, a) {
  const payload = {summary:a.title, description:a.description || '', start:{dateTime:dt(a.start), timeZone:'Asia/Riyadh'}, end:{dateTime:dt(a.end), timeZone:'Asia/Riyadh'}};
  const data = await gfetch(token, 'https://www.googleapis.com/calendar/v3/calendars/primary/events', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
  return `تم إنشاء الموعد: ${a.title}${data.htmlLink ? `\n${data.htmlLink}` : ''}`;
}
async function searchContacts(token, a) {
  const q = String(a.query || '').trim();
  if (!q) return 'اكتب اسم جهة الاتصال اللي تبي أبحث عنها.';
  const p = new URLSearchParams({query:q, readMask:'names,emailAddresses,phoneNumbers', pageSize:'10'});
  const data = await gfetch(token, `https://people.googleapis.com/v1/people:searchContacts?${p}`);
  const out = (data.results || []).map(x => x.person).filter(Boolean);
  if (!out.length) return `ما لقيت جهة اتصال مطابقة لـ ${q}.`;
  return 'جهات الاتصال المطابقة:\n' + out.slice(0,10).map((p,i) => {
    const n=p.names?.[0]?.displayName || 'بدون اسم', ph=p.phoneNumbers?.[0]?.value || '', em=p.emailAddresses?.[0]?.value || '';
    return `${i+1}. ${n}${ph?` — ${ph}`:''}${em?` — ${em}`:''}`;
  }).join('\n');
}
async function searchDrive(token, a) {
  const q = String(a.query || '').trim().replace(/'/g,"\\'");
  const filter = q ? `name contains '${q}' and trashed = false` : 'trashed = false';
  const p = new URLSearchParams({q:filter, pageSize:'10', orderBy:'modifiedTime desc', fields:'files(id,name,mimeType,modifiedTime,webViewLink)'});
  const data = await gfetch(token, `https://www.googleapis.com/drive/v3/files?${p}`);
  const files = data.files || [];
  if (!files.length) return `ما لقيت ملفات مطابقة لـ ${a.query || ''}.`;
  return 'ملفات Drive المطابقة:\n' + files.map((f,i) => `${i+1}. ${f.name}${f.webViewLink?`\n${f.webViewLink}`:''}`).join('\n');
}
async function createDriveDocument(token, a) {
  const doc = await gfetch(token, 'https://docs.googleapis.com/v1/documents', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:a.name})});
  if (a.content) await gfetch(token, `https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({requests:[{insertText:{location:{index:1},text:String(a.content)}}]})});
  return `تم إنشاء مستند ${a.name} في Google Drive.\nhttps://docs.google.com/document/d/${doc.documentId}/edit`;
}

export function isGoogleAction(type) { return GOOGLE_ACTIONS.has(type); }
export async function executeGoogleAction(req, action) {
  const token = await accessToken(req);
  switch (action.type) {
    case 'list_email': return listEmail(token, action);
    case 'create_email_draft': return createDraft(token, action);
    case 'send_email': return sendEmail(token, action);
    case 'list_calendar': return listCalendar(token, action);
    case 'create_calendar_event': return createCalendarEvent(token, action);
    case 'search_contacts': return searchContacts(token, action);
    case 'search_drive': return searchDrive(token, action);
    case 'create_drive_document': return createDriveDocument(token, action);
    default: throw new Error('أداة Google غير مدعومة.');
  }
}
