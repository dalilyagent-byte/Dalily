import { generateText } from 'ai';

function localManagerReply(message, context = {}) {
  const q = String(message || '').trim();
  const plan = context?.plan || null;
  const opportunities = Array.isArray(context?.opportunities) ? context.opportunities : [];
  const lastDecision = context?.lastDecision || null;
  const best = plan || [...opportunities].sort((a,b)=>(Number(b?.score)||0)-(Number(a?.score)||0))[0] || null;

  if (/وضع|الحالة|أعمالنا|اعمالنا/.test(q)) {
    const bestText = best ? `أفضل فرصة حالياً «${best.name || 'غير مسماة'}» بتقييم ${best.score || '—'}/100${best.budget != null ? `، وميزانية اختبار ${best.budget} ر.س` : ''}.` : 'ما عندي فرصة مختارة حالياً.';
    return `وضع الأعمال الآن: ${bestText} عندنا ${opportunities.length} فرصة محفوظة. الأولوية هي تنفيذ اختبار صغير وقياس الطلب قبل أي توسع.`;
  }

  if (/الأولوية|الاولوية|اليوم|وش أسوي|وش اسوي/.test(q)) {
    const firstStep = Array.isArray(plan?.steps) && plan.steps.length
      ? (plan.steps[0]?.task || plan.steps[0]?.action || plan.steps[0])
      : null;
    return firstStep
      ? `أولوية اليوم: ${firstStep}. وبعدها نقيس النتيجة قبل الانتقال للخطوة التالية.`
      : `أولوية اليوم: نختار أعلى فرصة تقييماً، نحدد العميل المستهدف، وننفذ اختبار طلب صغير بدون التزام مالي كبير.`;
  }

  if (/أفضل|افضل|فرصة|الفرص/.test(q)) {
    if (!best) return 'ما عندي بيانات كافية عن الفرص حالياً. أضف أو حدّث قائمة الفرص وأنا أرتبها لك.';
    return `أفضل فرصة عندي الآن هي «${best.name || 'غير مسماة'}» بتقييم ${best.score || '—'}/100.${best.why ? ` السبب: ${best.why}` : ''}${best.goal7Days ? ` هدف 7 أيام: ${best.goal7Days}` : ''}`;
  }

  if (/قرار|موافقة|موافق|اعتمد|اعتماد/.test(q)) {
    if (lastDecision?.status === 'approved') return 'آخر قرار مسجل عندي: موافق. أي تنفيذ مالي فعلي يظل متوقفاً حتى توجد قناة دفع مصرح بها ومربوطة بالنظام.';
    if (lastDecision?.status === 'rejected') return 'آخر قرار مسجل عندي: مرفوض، لذلك ما راح أعتمد الصرف المرتبط به.';
    return 'حالياً أي دفع أو تحويل أو عقد أو قرض أو التزام قانوني يحتاج موافقتك الصريحة. القرارات التشغيلية منخفضة المخاطر أقدر أرتبها وأنفذ خطواتها غير المالية.';
  }

  if (/خطة|خطه|سبع|7/.test(q)) {
    if (!plan) return 'ما عندي خطة تنفيذية محملة حالياً. أول ما تتوفر أبني لك ملخص الأيام والأهداف.';
    const steps = Array.isArray(plan.steps) ? plan.steps.slice(0,7).map((s,i)=>`${i+1}) ${s?.task || s?.action || s}`).join('، ') : '';
    return `الخطة الحالية لـ «${plan.name || 'الفرصة المختارة'}»: ${plan.goal7Days || 'اختبار الطلب خلال 7 أيام'}.${steps ? ` الخطوات: ${steps}` : ''}`;
  }

  if (/ميزانية|صرف|فلوس|دفع|تكلفة|تكلفه/.test(q)) {
    return `قاعدتي المالية: ما أرفع المخاطرة قبل ظهور طلب حقيقي. ${plan?.budget != null ? `سقف الاختبار الحالي ${plan.budget} ر.س.` : 'أي ميزانية جديدة تحتاج تحديد سقف واضح.'} وأي دفع فعلي يحتاج موافقتك وقناة تنفيذ مصرح بها.`;
  }

  return best
    ? `أنا متابع وضع الأعمال. عندي حالياً «${best.name || 'أفضل فرصة'}» كأولوية. أقدر أجاوبك عن: وضع الأعمال، أولوية اليوم، أفضل فرصة، الخطة، الميزانية، أو القرارات التي تحتاج موافقتك.`
    : 'أنا متابع معك. أقدر أرتب الأولويات والخطة والقرارات من بيانات دليلي الحالية. اسألني عن وضع الأعمال أو أولوية اليوم أو أفضل فرصة.';
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'DALILY chat', mode: 'ai-with-local-fallback' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const system = `أنت "دليلي"، مدير أعمال رقمي تنفيذي يعمل لصالح مالك الأعمال. تحدث بالعربية السعودية الواضحة وباختصار عملي. مهمتك إدارة الأعمال: تحليل الفرص، ترتيب الأولويات، بناء الخطط، متابعة النتائج، واقتراح قرارات تنفيذية. لا تدّع أنك نفذت إجراءً خارج الأنظمة المتصلة فعلياً. لا تنفذ أو توهم بتنفيذ تحويل مالي أو شراء أو عقد أو قرض أو التزام قانوني من خلال هذه المحادثة؛ هذه تحتاج موافقة صريحة وقناة تنفيذ مصرح بها. عند طلب قرار، أعط توصية واضحة مع السبب والخطوة التالية. استخدم بيانات السياق الحالية ولا تخترع أرقاماً غير موجودة.\n\nالسياق الحالي:\nالخطة التنفيذية: ${JSON.stringify(plan)}\nالفرص الحالية: ${JSON.stringify(opportunities)}\nآخر قرار للمالك: ${JSON.stringify(lastDecision)}`;

  try {
    const result = await generateText({
      model: 'openai/gpt-5.6-sol',
      system,
      messages: [
        ...safeHistory,
        { role: 'user', content: message.slice(0, 5000) },
      ],
    });

    return res.status(200).json({
      reply: result.text,
      model: 'openai/gpt-5.6-sol',
      mode: 'ai',
    });
  } catch (error) {
    console.error('DALILY AI unavailable; using local fallback', error?.message || error);
    return res.status(200).json({
      reply: localManagerReply(message, context),
      model: 'dalily-local-manager',
      mode: 'local-fallback',
    });
  }
}
