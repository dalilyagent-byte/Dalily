import crypto from 'node:crypto';

const PROJECT_ID = 'dalily-15fbb';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache = { expires: 0, certs: null };

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
function normalizeSaudiNumber(value) {
  const raw = String(value || '').replace(/[\s()-]/g, '');
  if (/^05\d{8}$/.test(raw)) return `+966${raw.slice(1)}`;
  if (/^9665\d{8}$/.test(raw)) return `+${raw}`;
  if (/^\+9665\d{8}$/.test(raw)) return raw;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    await verifyFirebaseToken(token);
    const apiKey = process.env.WAVE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'خدمة الاتصال غير مهيأة بعد', code: 'wave_not_configured' });
    const to = normalizeSaudiNumber(req.body?.to);
    if (!to) return res.status(400).json({ error: 'رقم الجوال السعودي غير صحيح' });

    // Wave sandbox uses Web Callback. Production voice calling can be switched later
    // when Wave enables an sk_live_ key for the account.
    const sandbox = apiKey.startsWith('sk_sandbox_');
    const endpoint = sandbox ? 'https://api.wave.sa/v1/callback' : 'https://api.wave.sa/v1/calls';
    const payload = { to };

    if (!sandbox) {
      payload.language = 'ar-SA';
      payload.webhook = process.env.WAVE_WEBHOOK_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/voice/webhook`;
      if (process.env.WAVE_CALLER_ID) payload.from = process.env.WAVE_CALLER_ID;
      if (process.env.WAVE_FLOW) payload.flow = process.env.WAVE_FLOW;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Wave call failed', response.status, data);
      return res.status(502).json({
        error: data?.message_ar || data?.message || data?.error || 'تعذر بدء المكالمة عبر Wave',
        code: data?.error_code || null,
        providerStatus: response.status
      });
    }
    return res.status(202).json({ ok: true, provider: 'wave', callId: data.id || null, status: data.status || 'initiated', to, mode: sandbox ? 'sandbox' : 'production' });
  } catch (error) {
    console.error('Dalily voice call failure', error?.message || String(error));
    if (/token|signature|expired|auth_/.test(error?.message || '')) return res.status(401).json({ error: 'انتهت جلسة الدخول، سجّل الدخول مرة ثانية' });
    return res.status(500).json({ error: 'تعذر تشغيل الاتصال الآن' });
  }
}
