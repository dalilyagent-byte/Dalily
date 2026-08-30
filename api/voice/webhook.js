export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  // Wave verifies webhook reachability with a small ping. Accept common
  // verification methods as well as real POST event deliveries.
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, HEAD, POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({ ok: true, service: 'DALILY Wave webhook' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, HEAD, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body || {};
    console.log('Wave webhook', JSON.stringify({
      id: event.id || event.call_id || null,
      status: event.status || event.event || event.type || null,
      duration: event.duration || null,
      outcome: event.outcome || null
    }));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Wave webhook failure', error?.message || String(error));
    return res.status(200).json({ ok: true });
  }
}
