import chatHandler from './chat.js';
import { executeGoogleAction, isGoogleAction } from './_google-tools.js';

function captureResponse() {
  const state = { statusCode: 200, headers: {}, body: null, sent: false };
  const fake = {
    setHeader(name, value) { state.headers[name] = value; return this; },
    status(code) { state.statusCode = code; return this; },
    json(value) { state.body = value; state.sent = true; return this; },
    send(value) { state.body = value; state.sent = true; return this; },
    end(value) { if (value !== undefined) state.body = value; state.sent = true; return this; }
  };
  return { state, fake };
}

function latestUserText(req) {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user' && typeof messages[i]?.text === 'string') return messages[i].text.trim();
  }
  return typeof req.body?.message === 'string' ? req.body.message.trim() : '';
}

function looksLikeQuestion(text = '') {
  const q = String(text).trim();
  if (!q) return false;
  if (/[؟?]\s*$/.test(q)) return true;
  return /^(?:وش|ايش|إيش|ما|ماذا|من|متى|وين|أين|كيف|كم|هل|ليش|لماذا|وشلون|شلون|وشو|وشي|وش عندنا|وش عندي|ايش عندنا|إيش عندنا)\b/i.test(q);
}

function isExplicitCommand(text = '') {
  const q = String(text).trim();
  return /^(?:اتصل|ارسل|أرسل|سو|سوي|نفذ|نفّذ|ابدأ|ابدا|أنشئ|انشئ|أضف|اضف|احذف|حذف|عدّل|عدل|غيّر|غير|احجز|سجل|سجّل|ذكّرني|ذكرني|اكتب|جهز|جهّز|اعتمد|فعّل|فعل|اطلب|حوّل|حول)\b/i.test(q);
}

function isShortContinuation(text = '') {
  return /^(?:يلا|كمل|كمّل|استمر|واصل|تابع|تمام|اوكي|أوكي|ايه|إيه|ابدأ|ابدا|نفذ|نفّذ|سوها|سوه)$/i.test(String(text).trim());
}

function previousContext(req) {
  const h = Array.isArray(req.body?.history) ? req.body.history : [];
  for (let i = h.length - 1; i >= 0; i--) {
    const m = h[i];
    if (m?.role === 'user' && typeof m?.content === 'string' && !isShortContinuation(m.content)) return m.content.trim();
  }
  const ms = Array.isArray(req.body?.messages) ? req.body.messages : [];
  for (let i = ms.length - 2; i >= 0; i--) {
    const m = ms[i];
    if (m?.role === 'user' && typeof m?.text === 'string' && !isShortContinuation(m.text)) return m.text.trim();
  }
  return '';
}

function enrichContinuation(req) {
  const latest = latestUserText(req);
  if (!isShortContinuation(latest)) return latest;
  const prev = previousContext(req);
  if (!prev) return latest;
  const expanded = `تابع ونفذ آخر طلب للمستخدم دون أن تطلب منه إعادة الكلام. آخر طلب واضح كان: ${prev}`;
  if (typeof req.body?.message === 'string') req.body.message = expanded;
  if (Array.isArray(req.body?.messages) && req.body.messages.length) {
    const last = req.body.messages.length - 1;
    if (req.body.messages[last]?.role === 'user') req.body.messages[last] = { ...req.body.messages[last], text: expanded };
  }
  return expanded;
}

function shouldStayConversational(text = '') {
  return (looksLikeQuestion(text) || isShortContinuation(text)) && !isExplicitCommand(text);
}

function conversationInput(req) {
  if (Array.isArray(req.body?.messages) && req.body.messages.length) {
    return req.body.messages.slice(-24)
      .filter(m => (m?.role === 'user' || m?.role === 'model' || m?.role === 'assistant') && typeof m?.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text.slice(0, 4000) }));
  }
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-23) : [];
  const input = history
    .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const latest = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (latest) input.push({ role: 'user', content: latest.slice(0, 4000) });
  return input;
}

async function textOnlyReply(req) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').replace(/[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
  if (!apiKey) return null;
  const input = conversationInput(req);
  if (!input.length) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        instructions: 'أنت دليلي، مدير أعمال أبو بندر الرقمي. افهم سياق المحادثة ولا تتعامل مع كلمات مثل يلا وكمل واستمر كرسائل مستقلة؛ اعتبرها أمراً بمتابعة آخر طلب واضح. جاوب مباشرة بلهجة سعودية طبيعية وبشكل عملي ومختصر. لا تدّع أنك نفذت شيئاً لم تنفذه فعلاً. مهم جداً: لا تعد المستخدم بأنك ستسلمه تقريراً أو نتيجة في يوم أو وقت مستقبلي إلا إذا تم إنشاء جدولة فعلية قابلة للتنفيذ. إذا لم توجد جدولة فعلية، قل بوضوح إنك تقدر تنجز الطلب الآن ولا تعد بموعد لاحق.',
        input,
        reasoning: { effort: 'low' },
        max_output_tokens: 700,
        store: false
      }),
      signal: AbortSignal.timeout(14000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    const text = String(data.output_text || '').trim() || (Array.isArray(data.output)
      ? data.output.flatMap(item => Array.isArray(item?.content) ? item.content : [])
        .filter(item => item?.type === 'output_text')
        .map(item => item.text || '').join('').trim()
      : '');
    return text || null;
  } catch (error) {
    console.error('Dalily conversational reply failure', error?.message || String(error));
    return null;
  }
}

function hasUnschedulablePromise(text = '') {
  const t = String(text || '');
  return /(?:بعطيك|أعطيك|برجع لك|أرجع لك|بسلمك|أسلمك|بجهزه لك|أجهزه لك|بأرسل لك|بارسل لك).*(?:بكرة|غد|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت|الأحد|الاحد|الساعة|يوم|الأسبوع|الاسبوع)/i.test(t);
}

function sanitizePromise(body) {
  if (!body || typeof body !== 'object') return body;
  const text = String(body.reply || body.text || '').trim();
  if (!text || !hasUnschedulablePromise(text)) return body;
  const fixed = 'ما راح أوعدك بموعد مستقبلي بدون جدولة تنفيذ فعلية. إذا تبي التقرير أو الدراسة أبدأ فيها الآن وأسلمك النتيجة هنا، وإذا ركّبنا جدولة خلفية فعلية وقتها أقدر ألتزم بموعد محدد.';
  return { ...body, text: fixed, reply: fixed, mode: 'chat', provider: body.provider || 'dalily-guard' };
}

export default async function handler(req, res) {
  const originalLatest = latestUserText(req);
  const enrichedLatest = enrichContinuation(req);

  if (shouldStayConversational(originalLatest)) {
    const text = await textOnlyReply(req);
    if (text) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ text, reply: text, mode: 'chat', provider: 'openai' });
    }
  }

  const { state, fake } = captureResponse();
  await chatHandler(req, fake);

  try {
    let body = sanitizePromise(state.body);

    if (state.statusCode === 200 && body?.mode === 'action' && shouldStayConversational(enrichedLatest)) {
      console.log('Dalily question/continuation action bypassed', body?.action?.type || 'unknown');
      const text = await textOnlyReply(req);
      if (text) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ text, reply: text, mode: 'chat', provider: 'openai' });
      }
      const safe = 'فهمت إنك تقصد أكمل آخر طلب. ما راح أحوله لمهمة جديدة؛ بكمل من نفس السياق.';
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ text: safe, reply: safe, mode: 'chat', provider: 'safe-fallback' });
    }

    if (state.statusCode === 200 && body?.mode === 'action' && isGoogleAction(body?.action?.type)) {
      const text = await executeGoogleAction(req, body.action);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ text, reply: text, mode: 'google-action', provider: 'google', action: body.action });
    }

    state.body = body;
  } catch (error) {
    console.error('Dalily wrapper action failure', error?.message || String(error));
    res.setHeader('Cache-Control', 'no-store');
    const text = `ما قدرت أنفذ الطلب الآن: ${error?.message || 'خطأ غير معروف'}`;
    return res.status(200).json({ text, reply: text, mode: 'action-error', provider: 'dalily' });
  }

  for (const [name, value] of Object.entries(state.headers)) res.setHeader(name, value);
  if (typeof state.body === 'object' && state.body !== null) return res.status(state.statusCode).json(state.body);
  return res.status(state.statusCode).send(state.body ?? '');
}
