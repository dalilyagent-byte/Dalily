export default function handler(req, res) {
  const configured = Boolean(process.env.WAVE_API_KEY && process.env.WAVE_CALLER_ID);
  return res.status(200).json({
    ok: true,
    service: 'DALILY Voice',
    provider: 'wave',
    configured,
    capabilities: {
      outboundCalls: configured,
      callStatusWebhook: true,
      language: 'ar-SA',
      aiConversation: Boolean(process.env.WAVE_FLOW)
    },
    next: configured
      ? (process.env.WAVE_FLOW ? 'ready for Wave outbound calls' : 'set WAVE_FLOW for Dalily conversational flow')
      : 'add WAVE_API_KEY and WAVE_CALLER_ID as server environment variables'
  });
}
