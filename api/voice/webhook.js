export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body || {};
    console.log('Wave webhook', JSON.stringify({
      id: event.id || event.call_id || null,
      status: event.status || event.event || null,
      duration: event.duration || null,
      outcome: event.outcome || null
    }));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Wave webhook failure', error?.message || String(error));
    return res.status(200).json({ ok: true });
  }
}
