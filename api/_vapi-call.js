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

function getVapiConfig() {
  return {
    apiKey: cleanApiKey(process.env.VAPI_API_KEY),
    assistantId: cleanEnv(process.env.VAPI_ASSISTANT_ID).replace(/^['"]+|['"]+$/g, ''),
    phoneNumberId: cleanEnv(process.env.VAPI_PHONE_NUMBER_ID).replace(/^['"]+|['"]+$/g, '')
  };
}

function zadarmaSaudiNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return String(value || '').replace(/^\+/, '');
}

function cleanCallScript(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}

async function ensureZadarmaNoLeadingPlus(apiKey, phoneNumberId) {
  try {
    const phoneResponse = await fetch(`https://api.vapi.ai/phone-number/${encodeURIComponent(phoneNumberId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!phoneResponse.ok) return false;
    const phone = await phoneResponse.json().catch(() => ({}));
    const credentialId = phone?.credentialId;
    if (!credentialId) return false;

    const credentialResponse = await fetch(`https://api.vapi.ai/credential/${encodeURIComponent(credentialId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!credentialResponse.ok) return false;
    const credential = await credentialResponse.json().catch(() => ({}));
    if (credential?.outboundLeadingPlusEnabled === false) return true;

    const updateResponse = await fetch(`https://api.vapi.ai/credential/${encodeURIComponent(credentialId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ outboundLeadingPlusEnabled: false }),
      signal: AbortSignal.timeout(10000)
    });
    if (!updateResponse.ok) {
      console.error('Vapi SIP credential update failed', updateResponse.status, await updateResponse.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Vapi SIP leading-plus configuration failed', error?.message || String(error));
    return false;
  }
}

export async function startVapiCall(to, purpose) {
  const { apiKey, assistantId, phoneNumberId } = getVapiConfig();

  if (!apiKey || !assistantId || !phoneNumberId) {
    return { ok: false, status: 503, error: 'إعدادات Vapi غير مكتملة في دليلي' };
  }

  try {
    const number = zadarmaSaudiNumber(to);
    const callScript = cleanCallScript(purpose);
    if (!callScript) {
      return { ok: false, status: 400, error: 'اكتب الجملة التي تريد من دليلي قولها بعد التحية' };
    }
    await ensureZadarmaNoLeadingPlus(apiKey, phoneNumberId);

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId,
        assistantOverrides: {
          firstMessage: `السلام عليكم انا مساعد ابو بندر الرقمي. ${callScript}`,
          variableValues: { callScript }
        },
        phoneNumberId,
        customer: {
          number,
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

export async function getLatestVapiCallReport() {
  const { apiKey, assistantId } = getVapiConfig();
  if (!apiKey || !assistantId) {
    return { ok: false, status: 503, error: 'إعدادات Vapi غير مكتملة في دليلي' };
  }

  try {
    const response = await fetch('https://api.vapi.ai/call', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000)
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      console.error('Vapi call history failed', response.status, data);
      return { ok: false, status: response.status, error: 'تعذر قراءة سجل مكالمات Vapi' };
    }

    const calls = Array.isArray(data) ? data : [];
    const relevant = calls
      .filter(call => call?.assistantId === assistantId || call?.assistant?.id === assistantId)
      .filter(call => call?.type === 'outboundPhoneCall' || call?.type === 'outbound')
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

    const call = relevant.find(item => {
      const transcript = item?.artifact?.transcript || item?.transcript;
      const messages = item?.artifact?.messages || item?.messages;
      return transcript || (Array.isArray(messages) && messages.length);
    }) || relevant[0];

    if (!call) return { ok: false, status: 404, error: 'ما لقيت مكالمة سابقة لدليلي' };

    let fullCall = call;
    if (call?.id) {
      const detailResponse = await fetch(`https://api.vapi.ai/call/${encodeURIComponent(call.id)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000)
      });
      if (detailResponse.ok) fullCall = await detailResponse.json().catch(() => call);
    }

    const transcript = String(fullCall?.artifact?.transcript || fullCall?.transcript || '').trim();
    const messages = fullCall?.artifact?.messages || fullCall?.messages || [];
    const summary = String(fullCall?.analysis?.summary || '').trim();
    const customerNumber = fullCall?.customer?.number || fullCall?.destination?.number || '';
    const endedReason = fullCall?.endedReason || '';

    const fallbackTranscript = Array.isArray(messages)
      ? messages
          .filter(m => m?.message)
          .map(m => `${m.role === 'assistant' ? 'دليلي' : 'العميل'}: ${m.message}`)
          .join('\n')
      : '';

    return {
      ok: true,
      id: fullCall?.id || null,
      customerNumber,
      summary,
      transcript: transcript || fallbackTranscript,
      endedReason,
      status: fullCall?.status || ''
    };
  } catch (error) {
    console.error('Vapi call history request failed', error?.message || String(error));
    return { ok: false, status: 502, error: 'تعذر قراءة نتيجة المكالمة من Vapi' };
  }
}
