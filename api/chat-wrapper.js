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

export default async function handler(req, res) {
  const { state, fake } = captureResponse();
  await chatHandler(req, fake);

  try {
    const body = state.body;
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
