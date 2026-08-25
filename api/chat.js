import { generateText } from 'ai';

function cleanText(v, max = 180) {
  return String(v || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function requestedAction(message) {
  const q = cleanText(message, 500);
  const task = q.match(/^(?:أضف|اضف|أنشئ|انشئ|سجّل|سجل)\s+(?:لي\s+)?مهمة\s*[:：-]?\s*(.+)$/i);
  if (task?.[1]) return { type: 'create_task', title: cleanText(task[1]) };
  const project = q.match(/^(?:أضف|اضف|أنشئ|انشئ|سجّل|سجل)\s+(?:لي\s+)?مشروع\s*[:：-]?\s*(.+)$/i);
  if (project?.[1]) return { type: 'create_project', name: cleanText(project[1]) };
  return null;
}

function localManagerReply(message, context = {}, action = null) {
  const q = cleanText(message, 1000);
  const plan = context?.plan || null;
  const opportunities = Array.isArray(context?.opportunities) ? context.opportunities : [];
  const lastDecision = context?.lastDecision || null;
  const best = plan || [...opportunities].sort((a,b)=>(Number(b?.score)||0)-(Number(a?.score)||0))[0] || null;

  if (action?.type === 'create_task') return `تمام. بسجّل مهمة «${action.title}» في حسابك الآن.`;
  if (action?.type === 'create_project') return `تمام. بسجّل مشروع «${action.name}» في حسابك الآن.`;

  if (/شراء|ادفع|دفع|حوّل|حول|تحويل|قرض|وقّع|وقع|عقد/.test(q)) {
    return 'هذا إجراء مالي أو قانوني، لذلك ما أنفذه تلقائياً. أقدر أجهز لك القرار والخطوات، والتنفيذ الفعلي يحتاج موافقتك الصريحة وقناة تنفيذ مصرح بها.';
  }
  if (/وضع|الحالة|أعمالنا|اعمالنا/.test(q)) {
    const bestText = best ? `أفضل فرصة حالياً «${best.name || 'غير مسماة'}» بتقييم ${best.score || '—'}/100${best.budget != null ? `، وميزانية اختبار ${best.budget} ر.س` : ''}.` : 'ما عندي فرصة مختارة حالياً.';
    return `وضع الأعمال الآن: ${bestText} عندنا ${opportunities.length} فرصة محفوظة. الأولوية اختبار الطلب بأقل مخاطرة ثم قياس النتيجة.`;
  }
  if (/الأولوية|الاولوية|اليوم|وش أسوي|وش اسوي/.test(q)) {
    const firstStep = Array.isArray(plan?.steps) && plan.steps.length ? (plan.steps[0]?.task || plan.steps[0]?.action || plan.steps[0]) : null;
    return firstStep ? `أولوية اليوم: ${firstStep}. وبعدها نقيس النتيجة قبل الخطوة التالية.` : 'أولوية اليوم: نختار أعلى فرصة تقييماً وننفذ اختبار طلب صغير بدون التزام مالي كبير.';
  }
  if (/أفضل|افضل|فرصة|الفرص/.test(q)) {
    if (!best) return 'ما عندي بيانات كافية عن الفرص حالياً. حدّث قائمة الفرص وأنا أرتبها لك.';
    return `أفضل فرصة عندي الآن هي «${best.name || 'غير مسماة'}» بتقييم ${best.score || '—'}/100.${best.why ? ` السبب: ${best.why}` : ''}${best.goal7Days ? ` هدف 7 أيام: ${best.goal7Days}` : ''}`;
  }
  if (/قرار|موافقة|موافق|اعتمد|اعتماد/.test(q)) {
    if (lastDecision?.status === 'approved') return 'آخر قرار مسجل: موافق. أي تنفيذ مالي فعلي يظل متوقفاً حتى توجد قناة دفع مصرح بها.';
    if (lastDecision?.status === 'rejected') return 'آخر قرار مسجل: مرفوض، لذلك ما راح أعتمد الصرف المرتبط به.';
    return 'الدفع والتحويل والعقود والقروض تحتاج موافقتك الصريحة. أما إنشاء المهام والمشاريع ومتابعة العمل فأقدر أنفذها داخل دليلي.';
  }
  if (/خطة|خطه|سبع|7/.test(q)) {
    if (!plan) return 'ما عندي خطة تنفيذية محملة حالياً.';
    const steps = Array.isArray(plan.steps) ? plan.steps.slice(0,7).map((s,i)=>`${i+1}) ${s?.task || s?.action || s}`).join('، ') : '';
    return `الخطة الحالية لـ «${plan.name || 'الفرصة المختارة'}»: ${plan.goal7Days || 'اختبار الطلب خلال 7 أيام'}.${steps ? ` الخطوات: ${steps}` : ''}`;
  }
  return best
    ? `أنا متابع وضع الأعمال، وأولوية العمل حالياً «${best.name || 'أفضل فرصة'}». وتقدر تقول لي مباشرة: «أضف مهمة التواصل مع 5 عملاء» أو «أنشئ مشروع تجربة السوق».`
    : 'أنا متابع معك. تقدر تسألني عن وضع الأعمال أو الأولوية، أو تقول مباشرة: «أضف مهمة ...» أو «أنشئ مشروع ...».';
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'DALILY chat', mode: 'ai-with-executable-local-fallback' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], context = {} } = req.body || {};
  if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });

  const action = requestedAction(message);
  if (action) {
    return res.status(200).json({ reply: localManagerReply(message, context, action), action, model: 'dalily-action-engine', mode: 'action' });
  }

  const safeHistory = Array.isArray(history) ? history.slice(-10).map((m) => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: String(m?.content || '').slice(0, 3000) })) : [];
  const plan = context?.plan || null;
  const opportunities = Array.isArray(context?.opportunities) ? context.opportunities.slice(0, 10) : [];
  const lastDecision = context?.lastDecision || null;
  const system = `أنت "دليلي"، مدير أعمال رقمي تنفيذي. تحدث بالعربية السعودية الواضحة وباختصار عملي. حلل الفرص ورتب الأولويات وابنِ الخطط. لا تدّع تنفيذ شيء خارج الأنظمة المتصلة. الدفع والتحويل والشراء والعقود والقروض والالتزامات القانونية لا تُنفذ من المحادثة. إنشاء المهام والمشاريع داخل دليلي مسموح عند طلب المالك الصريح. استخدم السياق ولا تخترع أرقاماً.\nالخطة: ${JSON.stringify(plan)}\nالفرص: ${JSON.stringify(opportunities)}\nآخر قرار: ${JSON.stringify(lastDecision)}`;

  try {
    const result = await generateText({ model: 'openai/gpt-5.6-sol', system, messages: [...safeHistory, { role: 'user', content: message.slice(0, 5000) }] });
    return res.status(200).json({ reply: result.text, model: 'openai/gpt-5.6-sol', mode: 'ai' });
  } catch (error) {
    console.error('DALILY AI unavailable; using local fallback', error?.message || error);
    return res.status(200).json({ reply: localManagerReply(message, context), model: 'dalily-local-manager', mode: 'local-fallback' });
  }
}
