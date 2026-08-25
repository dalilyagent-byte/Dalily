import crypto from 'node:crypto';

const PROJECT_ID = 'dalily-15fbb';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache = { expires: 0, certs: null };
const rate = new Map();

function decodePart(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='), 'base64');
}

async function getCerts() {
  if (certCache.certs && Date.now() < certCache.expires) return certCache.certs;
  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new Error('auth_certs_unavailable');
  const maxAge = Number((response.headers.get('cache-control') || '').match(/max-age=(\d+)/)?.[1] || 3600);
  certCache = { certs: await response.json(), expires: Date.now() + maxAge * 1000 };
  return certCache.certs;
}

async function verifyFirebaseToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid_token');
  const header = JSON.parse(decodePart(parts[0]).toString('utf8'));
  const payload = JSON.parse(decodePart(parts[1]).toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('invalid_token');
  if (payload.aud !== PROJECT_ID || payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error('invalid_token');
  if (!payload.sub || payload.exp <= now || payload.iat > now + 60) throw new Error('expired_token');
  const cert = (await getCerts())[header.kid];
  if (!cert) throw new Error('unknown_signing_key');
  const valid = crypto.createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).end().verify(cert, decodePart(parts[2]));
  if (!valid) throw new Error('invalid_signature');
  return payload;
}

function withinRateLimit(uid) {
  const now = Date.now();
  const item = rate.get(uid);
  if (!item || now > item.reset) {
    rate.set(uid, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (item.count >= 15) return false;
  item.count += 1;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'خدمة دليلي غير مهيأة بعد' });
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await verifyFirebaseToken(token);
    if (!withinRateLimit(user.sub)) return res.status(429).json({ error: 'طلبات كثيرة، حاول بعد دقيقة' });

    const input = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : [];
    const messages = input
      .filter(m => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
      .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 4000) }] }));
    if (!messages.length || messages.at(-1).role !== 'user') return res.status(400).json({ error: 'الرسالة غير صالحة' });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'أنت دليلي، مدير أعمال رقمي وموظف جوكر لأبو بندر. تحدث بلهجة سعودية واضحة ومختصرة. ساعد في البحث والتخطيط وإدارة المشاريع وصياغة الرسائل والتقارير. لا تدّع تنفيذ إجراء خارجي لم تنفذه فعلاً. اطلب موافقة صريحة قبل الدفع أو الرسائل للعملاء أو العقود أو القرارات المالية والقانونية المهمة.' }] },
        contents: messages,
        generationConfig: { temperature: 0.35, maxOutputTokens: 1400 }
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const limited = response.status === 429;
      return res.status(limited ? 429 : 502).json({ error: limited ? 'وصلنا حد الاستخدام مؤقتًا، حاول بعد قليل' : 'تعذر اتصال دليلي بالذكاء الاصطناعي' });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!text) return res.status(502).json({ error: 'لم يصل رد من دليلي' });
    return res.status(200).json({ text });
  } catch {
    return res.status(401).json({ error: 'انتهت جلسة الدخول، سجّل الدخول مرة ثانية' });
  }
}
