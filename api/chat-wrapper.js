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

function isAdvisoryQuestion(text = '') {
  const q = String(text).trim();
  return /(?:وش|ايش|إيش|ماذا|ما)\s+(?:تقترح|تنصح)|(?:وش|ايش|إيش)\s+(?:رايك|رأيك)|(?:تقترح|تنصح)\s+(?:نسوي|اسوي|أسوي|اعمل|أعمل)|(?:وش|ايش|إيش)\s+(?:نسوي|نسويها)\s+(?:اليوم|الحين)|(?:اعطني|أعطني)\s+(?:اقتراح|نصيحة)|(?:اقترح|انصحني|أنصحني)/i.test(q);
}

async function textOnlyAdvisoryReply(req) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').replace(/[\s\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
  if (!apiKey) return null;
  const source = Array.isArray(req.body?.messages) ? req.body.messages.slice(-24) : [];
  const input = source
    .filter(m => (m?.role === 'user' || m?.role === 'model') && typeof m?.text === 'string' && m.text.trim())
    .map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text.slice(0, 4000) }));
  if (!input.length) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        instructions: 'أنت دليلي، مدير أعمال أبو بندر الرقمي. هذا سؤال استشاري أو طلب اقتراح فقط: جاوب عليه مباشرة بلهجة سعودية طبيعية وبشكل عملي ومختصر. لا تستخدم أي أداة، لا تنفذ أي إجراء، ولا تقل إنك نفذت شيئاً. استفد من سياق المحادثة الموجود في الرسائل.',
        input,
        reasoning: { effort: 'low' },
        max_output_tokens: 700,
        store: false
      }),
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Dalily advisory reply failure', response.status, data?.error?.code || data?.error?.type || 'unknown');
      return null;
    }
    const text = String(data.output_text || '').trim() || (Array.isArray(data.output)
      ? data.output.flatMap(item => Array.isArray(item?.content) ? item.content : [])
        .filter(item => item?.type === 'output_text')
        .map(item => item.text || '').join('').trim()
      : '');
    return text || null;
  } catch (error) {
    console.error('Dalily advisory request failure', error?.message || String(error));
    return null;
  }
}

export default async function handler(req, res) {
  const { state, fake } = captureResponse();
  await chatHandler(req, fake);

  try {
    const body = state.body;
    const latest = latestUserText(req);

    // Advice/opinion questions must stay conversational even if the model tried to call a tool.
    if (state.statusCode === 200 && body?.mode === 'action' && isAdvisoryQuestion(latest)) {
      console.log('Dalily advisory action bypassed', body?.action?.type || 'unknown');
      const text = await textOnlyAdvisoryReply(req);
      if (text) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ text, reply: text, mode: 'chat', provider: 'openai' });
      }
    }

    if (state.statusCode === 200 && body?.mode === 'action' && isGoogleAction(body?.action?.type)) {
      const text = await executeGoogleAction(req, body.action);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        text,
        reply: text,
        mode: 'google-action',
        provider: 'google',
        action: body.action
      });
    }
  } catch (error) {
    console.error('Dalily Google action failure', error?.message || String(error));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      text: `ما قدرت أنفذ أمر Google الآن: ${error?.message || 'خطأ غير معروف'}`,
      reply: `ما قدرت أنفذ أمر Google الآن: ${error?.message || 'خطأ غير معروف'}`,
      mode: 'google-action-error',
      provider: 'google'
    });
  }

  for (const [name, value] of Object.entries(state.headers)) res.setHeader(name, value);
  if (typeof state.body === 'object' && state.body !== null) return res.status(state.statusCode).json(state.body);
  return res.status(state.statusCode).send(state.body ?? '');
}
