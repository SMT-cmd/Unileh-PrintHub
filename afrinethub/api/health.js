// Lightweight server-side connectivity check; never exposes credentials.
export default async function handler(request,response) {
  response.setHeader('Cache-Control','no-store');
  if (request.method !== 'GET') return response.status(405).json({ok:false});
  try {
    const r=await fetch('https://soqjthnzyntkhthcnucj.supabase.co/functions/v1/afrinethub-api/health',{
      headers:{'apikey':process.env.VITE_SUPABASE_PUBLISHABLE_KEY||''},
      signal:AbortSignal.timeout(8000)
    });
    const data=await r.json().catch(()=>null);
    return response.status(r.ok&&data?.ok?200:503).json({
      ok:Boolean(r.ok&&data?.ok),
      service:'Afrinet Hub',
      backendReady:Boolean(r.ok&&data?.ok),
      status:data?.service==='Afrinet Hub secure API'?'connected':'unavailable'
    });
  }catch{
    return response.status(503).json({ok:false,service:'Afrinet Hub',backendReady:false,status:'unavailable'});
  }
}
