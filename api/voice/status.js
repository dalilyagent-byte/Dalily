export default function handler(req, res) {
  const sandboxReady = Boolean(process.env.WAVE_API_KEY);
  const productionReady = Boolean(process.env.WAVE_API_KEY && process.env.WAVE_CALLER_ID && process.env.WAVE_FLOW);

  return res.status(200).json({
    ok: true,
    service: 'DALILY Voice',
    provider: 'wave',
    mode: productionReady ? 'production-ready-config' : 'sandbox-callback',
    configured: sandboxReady,
    capabilities: {
      outboundCalls: sandboxReady,
      callStatusWebhook: true,
      language: 'ar-SA',
      aiConversation: false
    },
    limits: productionReady
      ? ['Wave conversational voice API is not documented/available in the current public API docs yet']
      : ['Sandbox callback only', 'Calls are limited by Wave sandbox rules', 'Live AI conversation is not available in the documented sandbox API'],
    next: 'Enable Wave conversational voice support when Wave publishes the required production/AI call-flow API'
  });
}
