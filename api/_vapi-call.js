function cleanEnv(value) {
  return String(value || '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '')
    .trim();
}

function cleanApiKey(value) {
  return cleanEnv(value)
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/^Bearer\s+/i, '')
    .trim();
}

export async function startVapiCall(to) {
  const apiKey = cleanApiKey(process.env.VAPI_API_KEY);
  const assistantId = cleanEnv(process.env.VAPI_ASSISTANT_ID).replace(/^['"]+|['"]+$/g, '');
  const phoneNumberId = cleanEnv(process.env.VAPI_PHONE_NUMBER_ID).replace(/^['"]+|['"]+$/g, '');

  if (!apiKey || !assistantId || !phoneNumberId) {
    return { ok: false, status: 503, error: 'إعدادات Vapi غير مكتملة في دليلي' };
  }

  try {
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: {
          number: to,
          numberE164CheckEnabled: false
        }
      }),
      signal: AbortSignal.timeout(15000)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Vapi outbound call failed', response.status, data);
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || 'Vapi رفض بدء المكالمة'
      };
    }

    return { ok: true, id: data?.id || null, status: data?.status || 'queued' };
  } catch (error) {
    console.error('Vapi outbound call request failed', error?.message || String(error));
    return { ok: false, status: 502, error: 'تعذر الاتصال بخدمة Vapi' };
  }
}
