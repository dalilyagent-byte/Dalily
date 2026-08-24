import { generateText } from 'ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [], context = {} } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-10).map((m) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          content: String(m?.content || '').slice(0, 3000),
        }))
      : [];

    const plan = context?.plan || null;
    const opportunities = Array.isArray(context?.opportunities)
      ? context.opportunities.slice(0, 10)
      : [];
    const lastDecision = context?.lastDecision || null;

    const system = `أنت "دليلي"، مدير أعمال رقمي تنفيذي يعمل لصالح مالك الأعمال. تحدث بالعربية السعودية الواضحة وباختصار عملي. مهمتك إدارة الأعمال: تحليل الفرص، ترتيب الأولويات، بناء الخطط، متابعة النتائج، واقتراح قرارات تنفيذية. لا تدّع أنك نفذت إجراءً خارج الأنظمة المتصلة فعلياً. لا تنفذ أو توهم بتنفيذ تحويل مالي أو شراء أو عقد أو قرض أو التزام قانوني من خلال هذه المحادثة؛ هذه تحتاج موافقة صريحة وقناة تنفيذ مصرح بها. عند طلب قرار، أعط توصية واضحة مع السبب والخطوة التالية. استخدم بيانات السياق الحالية ولا تخترع أرقاماً غير موجودة.

السياق الحالي:
الخطة التنفيذية: ${JSON.stringify(plan)}
الفرص الحالية: ${JSON.stringify(opportunities)}
آخر قرار للمالك: ${JSON.stringify(lastDecision)}`;

    const messages = [
      ...safeHistory,
      { role: 'user', content: message.slice(0, 5000) },
    ];

    const result = await generateText({
      model: 'openai/gpt-5.6-sol',
      system,
      messages,
    });

    return res.status(200).json({
      reply: result.text,
      model: 'openai/gpt-5.6-sol',
    });
  } catch (error) {
    console.error('DALILY chat error', error);
    return res.status(500).json({
      error: 'DALILY chat failed',
      detail: error?.message || String(error),
    });
  }
}
