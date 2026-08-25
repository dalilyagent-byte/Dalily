function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = parseCookies(req.headers.cookie || '')['__Host-dalily_google_refresh'];
  if (!clientId || !clientSecret) return res.status(503).json({ error: 'Google OAuth is not configured' });
  if (!refreshToken) return res.status(401).json({ error: 'Google manager permissions are not connected' });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) return res.status(401).json({ error: data.error_description || 'Could not refresh Google access' });
  return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in || 3600 });
}
