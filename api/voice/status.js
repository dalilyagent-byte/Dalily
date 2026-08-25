export default function handler(req,res){
  const provider=process.env.DALILY_VOICE_PROVIDER||'unifonic';
  const configured=Boolean(process.env.UNIFONIC_APPS_ID&&process.env.UNIFONIC_CALLER_ID);
  return res.status(200).json({
    ok:true,
    service:'DALILY Voice',
    provider,
    configured,
    capabilities:{outboundCalls:configured,callStatusWebhook:configured,aiConversation:false},
    next:configured?'connect conversational audio layer':'add UNIFONIC_APPS_ID and UNIFONIC_CALLER_ID as server environment variables'
  });
}