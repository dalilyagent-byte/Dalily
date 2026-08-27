import crypto from 'node:crypto';
import { generateText } from 'ai';

const PROJECT_ID = 'dalily-15fbb';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const SYSTEM_PROMPT = 'أنت دليلي، مدير أعمال رقمي وموظف جوكر لأبو بندر. تحدث بلهجة سعودية واضحة ومختصرة، واجعل الرد عادة بين سطرين و5 أسطر إلا إذا طلب المستخدم تفاصيل. ساعد في البحث والتخطيط وإدارة المشاريع وصياغة الرسائل والتقارير. لا تدّع تنفيذ إجراء خارجي لم تنفذه فعلاً. اطلب موافقة صريحة قبل الدفع أو الرسائل للعملاء أو العقود أو القرارات المالية والقانونية المهمة.';
const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
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

function toGatewayMessages(messages) {
  return messages.map(message => ({
    role: message.role === 'model' ? 'assistant' : 'user',
    content: message.parts[0].text
  }));
}

async function gatewayReply(messages) {
  const models = ['openai/gpt-4.1-mini', 'openai/gpt-4o-mini'];
  for (const model of models) {
    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: toGatewayMessages(messages),
        maxOutputTokens: 500,
        temperature: 0.3
      });
      if (result.text?.trim()) return { text: result.text.trim(), model };
    } catch (error) {
      console.error('Dalily gateway failure', model, error?.message || String(error));
    }
  }
  return null;
}

async function geminiReply(messages) {
  if (!process.env.GEMINI_API_KEY) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages,
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        }),
        signal: AbortSignal.timeout(6500)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
        if (text) return { text, model };
      }
      console.error('Dalily Gemini failure', model, response.status, data?.error?.message || 'unknown_error');
    } catch (error) {
      console.error('Dalily Gemini request failure', model, error?.message || String(error));
    }
  }
  return null;
}

function detectAction(message) {
  const q = String(message || '').trim().slice(0, 500);
  let match = q.match(/^(?:أضف|اضف|أنشئ|انشئ|سجّل|سجل)\s+(?:لي\s+)?مهمة\s*[:：-]?\s*(.+)$/i);
  if (match?.[1]) return { type: 'create_task', title: match[1].trim().slice(0, 180) };
  match = q.match(/^(?:أضف|اضف|أنشئ|انشئ|سجّل|سجل)\s+(?:لي\s+)?مشروع\s*[:：-]?\s*(.+)$/i);
  if (match?.[1]) return { type: 'create_project', name: match[1].trim().slice(0, 180) };
  match = q.match(/^(?:أنجز|انجز|أكمل|اكمل|اقفل|أغلق|اغلق)\s+(?:مهمة\s+)?(.+)$/i);
  if (match?.[1]) return { type: 'complete_task', query: match[1].trim().slice(0, 180) };
  match = q.match(/^(?:احذف|الغ|ألغي|الغي)\s+(?:مهمة\s+)(.+)$/i);
  if (match?.[1]) return { type: 'delete_task', query: match[1].trim().slice(0, 180) };
  if (/تقرير.*(?:مدير|أعمال|اعمال)|ملخص.*(?:أعمال|اعمال)|وش وضعنا التنفيذي/i.test(q)) return { type: 'manager_report' };
  if (/المهام/i.test(q) && /اعرض|ورني|وش|ما هي|ماهي|مهامي/i.test(q)) return { type: 'list_tasks' };
  if (/المشاريع/i.test(q) && /اعرض|ورني|وش|ما هي|ماهي|مشاريعي/i.test(q)) return { type: 'list_projects' };
  if (/(?:نسبة|تقدم|تقدّم|انجاز|إنجاز).*المشروع|وش وصلنا|وين وصلنا/i.test(q)) return { type: 'project_progress' };
  if (/(?:المهمة|الخطوة).*التالية|وش بعد|وش التالي|التالي وش/i.test(q)) return { type: 'next_task' };
  if (/(?:متوقف|واقف|ينتظر|قرار).*علي|وش يحتاج موافقتي|وش المطلوب مني/i.test(q)) return { type: 'owner_blockers' };
  return null;
}

function actionReply(action) {
  const replies = {
    create_task: 'بسجّل المهمة في حسابك الآن.',
    create_project: 'بسجّل المشروع في حسابك الآن.',
    complete_task: 'ببحث عن المهمة وأعلّمها منجزة.',
    delete_task: 'ببحث عن المهمة وأحذفها.',
    list_tasks: 'بجيب لك مهامك الحالية من حسابك.',
    list_projects: 'بجيب لك مشاريعك الحالية من حسابك.',
    project_progress: 'براجع المشروع النشط وأحسب نسبة الإنجاز.',
    next_task: 'بحدد لك أول مهمة غير منجزة في المشروع النشط.',
    owner_blockers: 'براجع الأشياء المتوقفة على موافقتك.',
    manager_report: 'بجهز لك تقرير مدير أعمال من بيانات حسابك.'
  };
  return replies[action.type] || 'بنّفذ الطلب داخل دليلي.';
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
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await verifyFirebaseToken(token);
    if (!withinRateLimit(user.sub)) return res.status(429).json({ error: 'طلبات كثيرة، حاول بعد دقيقة' });

    const legacyMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const legacyHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const input = Array.isArray(req.body?.messages)
      ? req.body.messages.slice(-8)
      : [...legacyHistory.map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', text: item.content })), { role: 'user', text: legacyMessage }].slice(-12);
    const messages = input
      .filter(m => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 4000) }] }));

    if (!messages.length || messages.at(-1).role !== 'user') return res.status(400).json({ error: 'الرسالة غير صالحة' });

    const action = detectAction(messages.at(-1).parts[0].text);
    if (action) {
      const text = actionReply(action);
      return res.status(200).json({ text, reply: text, action, mode: 'action' });
    }

    const gemini = await geminiReply(messages);
    if (gemini) return res.status(200).json({ text: gemini.text, reply: gemini.text, mode: 'ai', provider: 'gemini', model: gemini.model });

    const gateway = await gatewayReply(messages);
    if (gateway) return res.status(200).json({ text: gateway.text, reply: gateway.text, mode: 'ai-fallback', provider: 'gateway', model: gateway.model });

    return res.status(503).json({ error: 'تعذر الوصول لمحرك دليلي الآن. حاول مرة ثانية بعد قليل.' });
  } catch (error) {
    console.error('Dalily chat handler failure', error?.message || String(error));
    return res.status(401).json({ error: 'انتهت جلسة الدخول، سجّل الدخول مرة ثانية' });
  }
}
