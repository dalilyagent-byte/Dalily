import crypto from 'node:crypto';
function keys(){const seed=crypto.createHash('sha256').update('dalily-web-push-v1:'+String(process.env.VAPI_API_KEY||'')).digest();const e=crypto.createECDH('prime256v1');e.setPrivateKey(seed);return{publicKey:e.getPublicKey().toString('base64url')}}
export default function handler(req,res){res.setHeader('Cache-Control','public, max-age=3600');if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});if(!process.env.VAPI_API_KEY)return res.status(503).json({error:'Push unavailable'});return res.status(200).json(keys());}
