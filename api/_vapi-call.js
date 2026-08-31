export async function startVapiCall(to, purpose = '') {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!apiKey || !assistantId || !phoneNumberId) {
    return { ok: false, status: 503, error: 'إعدادات Vapi غير مكتملة في دليلي' };
  }

  const body = {
    assistantId,
    phoneNumberId,
    customer: { number: to, numberE164CheckEnabled: false }
  };
  if (purpose) {
    body.assistantOverrides = {
      variableValues: { callPurpose: purpose }
    };
  }

  try {
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Vapi outbound call failed', response.status, data);
      return { ok: false, status: response.status, error: data?.message || data?.error || 'Vapi رفض بدء المكالمة' };
    }
    return { ok: true, id: data?.id || null, status: data?.status || 'queued' };
  } catch (error) {
    console.error('Vapi outbound call request failed', error?.message || String(error));
    return { ok: false, status: 502, error: 'تعذر الاتصال بخدمة Vapi' };
  }
}
