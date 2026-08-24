export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [], context = {} } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });

    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!token) return res.status(503).json({ error: 'AI Gateway authentication is not available on this deployment.' });

    const safeHistory = Array.isArray(history) ? history.slice(-10).map(m => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || '').slice(0, 3000)
    })) : [];

    const plan = context?.plan || null;
    const opportunities = Array.isArray(context?.opportunities) ? context.opportunities.slice(0, 10) : [];
    const lastDecision = context?.lastDecision || null;

    const system = `أنت "دليلي"، مدير أعمال رقمي تنفيذي يعمل لصالح مالك الأعمال. تحدث بالعربية السعودية الواضحة وباختصار عملي. مهمتك إدارة الأعمال: تحليل الفرص، ترتيب الأولويات، بناء الخطط، متابعة النتائج، واقتراح قرارات تنفيذية. لا تدّع أنك نفذت إجراءً خارج الأنظمة المتصلة فعلياً. لا تنفذ أو توهم بتنفيذ تحويل مالي أو شراء أو عقد أو قرض أو التزام قانوني من خلال هذه المحادثة؛ هذه تحتاج موافقة صريحة وقناة تنفيذ مصرح بها. عند طلب قرار، أعط توصية واضحة مع السبب والخطوة التالية. استخدم بيانات السياق الحالية ولا تخترع أرقاماً غير موجودة.

السياق الحالي:
الخطة التنفيذية: ${JSON.stringify(plan)}
الفرص الحالية: ${JSON.stringify(opportunities)}
آخر قرار للمالك: ${JSON.stringify(lastDecision)}`;

    const gateway = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        messages: [
          { role: 'system', content: system },
          ...safeHistory,
          { role: 'user', content: message.slice(0, 5000) }
        ],
        stream: false
      })
    });

    const data = await gateway.json();
    if (!gateway.ok) {
      console.error('AI Gateway error', gateway.status, data);
      return res.status(502).json({ error: data?.error?.message || data?.message || 'AI Gateway request failed' });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: 'No response from AI model' });

    return res.status(200).json({ reply, model: data.model || 'openai/gpt-5.6-sol' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'DALILY chat failed', detail: error?.message || String(error) });
  }
}
