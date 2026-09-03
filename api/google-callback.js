import crypto from 'node:crypto';

function seal(value, secret) {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(503).send('Google OAuth is not configured');

  const { code, state, error } = req.query || {};
  if (error) return res.redirect(302, '/app.html?google=denied');
  const cookies = parseCookies(req.headers.cookie || '');
  if (!code || !state || !cookies['__Host-dalily_oauth_state'] || state !== cookies['__Host-dalily_oauth_state']) {
    return res.status(400).send('Invalid OAuth state');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/google-callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.refresh_token) {
    return res.status(502).send(tokens.error_description || 'Google did not return a refresh token');
  }

  const refresh = encodeURIComponent(seal(tokens.refresh_token, clientSecret));
  res.setHeader('Set-Cookie', [
    `__Host-dalily_google_refresh=${refresh}; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax`,
    '__Host-dalily_oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  ]);
  return res.redirect(302, '/app.html?google=connected');
}
