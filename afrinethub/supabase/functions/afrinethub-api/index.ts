// AfriNet Hub — secured customer API. Supabase Edge Functions / Deno.
// Service credentials come ONLY from Supabase-managed environment variables.
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const PROJECT = Deno.env.get('SUPABASE_URL') || '';
const defaultSecrets = Deno.env.get('SUPABASE_SECRET_KEYS');
const SERVER_KEY = (defaultSecrets ? JSON.parse(defaultSecrets).default : null)
  || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!PROJECT || !SERVER_KEY) throw new Error('Supabase managed runtime credentials are missing');
const db = createClient(PROJECT,SERVER_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const SITE_KEY = '0x4AAAAAAF62eebvoGKdOf2X';
const CORS_ALLOWED = new Set([
  'https://afrinethub.com.ng', 'https://www.afrinethub.com.ng',
  'https://afrinethub.vercel.app',
  'https://afrinethub-qj24wrwsl-kingsmt.vercel.app',
]);
const BUCKET = 'afrinethub-private';
const MAX_BYTES = 10*1024*1024;
const HEX64 = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const encoder = new TextEncoder();
const mimeExt: Record<string,string> = {
  'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'
};
function cors(origin:string|null){
 const matched=origin&&CORS_ALLOWED.has(origin);
 return {
 'Access-Control-Allow-Origin':matched?origin||'':'https://afrinethub.com.ng',
 'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
 'Access-Control-Allow-Headers':'content-type,authorization,apikey',
 'Access-Control-Max-Age':'600',
 'Vary':'Origin',
 'Cache-Control':'no-store'
 };
}
function reply(body:unknown,status=200,origin:string|null=null){
 return new Response(JSON.stringify(body),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8'}});
}
function cleanText(input:unknown,max=200){
 return String(input??'').trim().slice(0,max);
}
async function digest(input:string){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(input)));
 return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function getBody(req:Request,max=65536){
 const size=Number(req.headers.get('content-length')||0);
 if(size>max)throw new Error('Request too large');
 const text=await req.text();
 if(text.length>max)throw new Error('Request too large');
 return JSON.parse(text||'{}');
}
async function rpc<T=unknown>(name:string,params:Record<string,unknown>):Promise<T>{
 const {data,error}=await db.rpc(name,params);
 if(error)throw new Error('Database request failed: '+name);
 return data as T;
}
async function limit(action:string,identity:string,max:number,window:number){
 const permitted=await rpc<boolean>('afrinethub_throttle',{
   p_key:action+':'+identity,p_max:max,p_window_seconds:window
 });
 if(!permitted)throw new Error('Too many requests. Please try again later.');
}
async function guest(token:string){
 if(typeof token!=='string'||token.length<30||token.length>180)throw new Error('Guest verification required');
 const session=await rpc<string|null>('afrinethub_check_session',{p_hash:await digest(token)});
 if(!session||!UUID.test(session))throw new Error('Guest verification expired. Please verify again.');
 return session;
}
async function isAdmin(req:Request){
 const bearer=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'').trim()||'';
 if(!bearer||bearer.length>4096)return false;
 const {data:{user},error}=await db.auth.getUser(bearer);
 if(error||!user?.id||!user.email_confirmed_at)return false;
 const {data:row}=await db.from('admin_config').select('uid').eq('uid',user.id).maybeSingle();
 return Boolean(row?.uid===user.id);
}
async function validateTurnstile(token:string,ip:string,origin:string){
 if(!token||token.length>2048)throw new Error('Human verification is required');
 const secret=await rpc<string|null>('afrinethub_turnstile_secret',{});
 if(!secret)throw new Error('Verification server not configured');
 const values=new URLSearchParams({secret,response:token});
 if(/^[0-9a-f:.]+$/i.test(ip))values.set('remoteip',ip);
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:values,headers:{'Content-Type':'application/x-www-form-urlencoded'}});
 if(!response.ok)throw new Error('Verification service unavailable');
 const result=await response.json();
 if(result.success!==true||!CORS_ALLOWED.has('https://'+result.hostname))throw new Error('Human verification failed');
 // Validate action's requested hostname against the submitted page Origin.
 if(origin!=='https://'+result.hostname)throw new Error('Verification site mismatch');
}
async function signedUrl(path:string,seconds=180){
 const {data,error}=await db.storage.from(BUCKET).createSignedUrl(path,seconds);
 if(error||!data?.signedUrl)throw new Error('Could not prepare private download');
 return data.signedUrl;
}
function magicOK(bytes:Uint8Array,mime:string){
 if(mime==='application/pdf')return bytes.length>5 && String.fromCharCode(...bytes.slice(0,5))==='%PDF-';
 if(mime==='image/jpeg')return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 if(mime==='image/png')return bytes.length>8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a;
 if(mime==='image/webp')return bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return bytes[0]===0x50&&bytes[1]===0x4b;
 return false;
}
function validDoc(item:any){
 if(!item||typeof item!=='object')throw new Error('Invalid document details');
 const pages=Math.floor(Number(item.pageCount));
 const copies=Math.floor(Number(item.copies));
 if(!Number.isFinite(pages)||pages<1||pages>400||!Number.isFinite(copies)||copies<1||copies>50)throw new Error('Invalid document pages or copies');
 const printType=item.printType==='Color'?'Color':'B&W';
 const fileId=cleanText(item.fileId,180);
 if(!fileId||fileId.includes('..'))throw new Error('Missing uploaded document');
 const filename=cleanText(item.fileName,180)||'Document';
 const printed=pages*copies;
 const price=printType==='Color'?printed*100:Math.floor(printed/2)*150+(printed%2)*80;
 return {fileId,fileUrl:'',fileName:filename,pageCount:pages,copies,printType,price};
}
async function handler(req:Request,origin:string,ip:string){
 const action=new URL(req.url).pathname.split('/').filter(Boolean).pop()||'';
 if(req.method==='GET'&&action==='health')return {ok:true,service:'Afrinet Hub secure API',version:'1'};
 if(req.method!=='POST')throw new Error('Unsupported method');
 const body=action==='upload'?null:await getBody(req);
 const token=action==='upload'?'':cleanText(body?.guestToken,180);
 const ipKey=await digest(ip||'unknown');
 if(action==='session'){
   await limit('session-ip',ipKey,10,3600);
   await validateTurnstile(cleanText(body.turnstileToken,2100),ip,origin);
   const random=new Uint8Array(32);crypto.getRandomValues(random);
   const token=Array.from(random).map(n=>n.toString(16).padStart(2,'0')).join('');
   const sessionId=await rpc<string>('afrinethub_create_session',{p_hash:await digest(token),p_ip_hash:ipKey});
   return {ok:true,guestToken:token,expiresIn:7200,sessionId};
 }
 if(action==='upload'){
   const length=Number(req.headers.get('content-length')||0);
   if(length>MAX_BYTES+32768)throw new Error('Upload exceeds the 10 MB limit');
   const data=await req.formData();
   const guestToken=String(data.get('guestToken')||'');
   const session=await guest(guestToken);
   const kind=String(data.get('kind')||'document');
   if(kind!=='document'&&kind!=='receipt')throw new Error('Invalid file purpose');
   const file=data.get('file');
   if(!(file instanceof File)||file.size<=0||file.size>MAX_BYTES)throw new Error('Select a file under 10 MB');
   const mime=file.type;
   if(!mimeExt[mime])throw new Error('This file format is not supported');
   const bytes=new Uint8Array(await file.arrayBuffer());
   if(!magicOK(bytes,mime))throw new Error('File content does not match its type');
   await limit('upload-session',session,8,7200);
   await limit('upload-ip',ipKey,40,3600);
   const path=session+'/'+kind+'/'+crypto.randomUUID()+'.'+mimeExt[mime];
   const reserved=await rpc<boolean>('afrinethub_upload_slot',{p_session:session,p_path:path,p_filename:cleanText(file.name,180),p_content_type:mime,p_size:file.size});
   if(!reserved)throw new Error('Upload limit reached');
   const {error}=await db.storage.from(BUCKET).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'private, no-store'});
   if(error)throw new Error('Secure file upload failed');
   return {ok:true,fileId:path,originalName:cleanText(file.name,180),viewURL:await signedUrl(path,120)};
 }
 const session=await guest(token);
 if(action==='order'){
   await limit('order-session',session,3,7200);
   await limit('order-ip',ipKey,12,3600);
   const src=body.data;
   if(!src||typeof src!=='object'||!Array.isArray(src.items)||src.items.length<1||src.items.length>3)throw new Error('Add 1 to 3 documents');
   const studentName=cleanText(src.studentName,100);
   const phoneNumber=cleanText(src.phoneNumber,40);
   if(studentName.length<2||!/^\+?[\d\s()-]{8,22}$/.test(phoneNumber))throw new Error('Please enter your name and a valid phone number');
   const items=src.items.map(validDoc);
   for(const item of items){
     const ok=await rpc<boolean>('afrinethub_has_upload',{p_session:session,p_path:item.fileId});
     if(!ok||!item.fileId.includes('/document/'))throw new Error('Uploaded document is missing or expired');
   }
   const total=items.reduce((s,it)=>s+it.price,0);
   if(total>2000000)throw new Error('Order is too large. Contact the office directly');
   const orderId=crypto.randomUUID();
   const orderNumber=await rpc<string>('generate_order_number',{});
   const first=items[0];
   const payload={studentName,phoneNumber,notes:cleanText(src.notes,1000),items:items.map(({price,...it})=>it),
     printType:first.printType,copies:first.copies,fileId:first.fileId,fileUrl:'',fileName:first.fileName,pageCount:first.pageCount,
     totalPrice:total,status:'Pending',paymentStatus:'Awaiting bank transfer',timestamp:new Date().toISOString()};
   const {error}=await db.from('orders').insert({id:orderId,order_number:orderNumber,status:'Pending',data:payload});
   if(error)throw new Error('Could not save order');
   try{const linked=await rpc<boolean>('afrinethub_link_order',{p_session:session,p_order:orderId});
     if(!linked)throw new Error('Could not link order');
   }catch(e){await db.from('orders').delete().eq('id',orderId);throw e;}
   return {ok:true,orderId,orderNumber,totalPrice:total};
 }
 if(action==='order-get'){
   if(!UUID.test(String(body.orderId||'')))throw new Error('Invalid order reference');
   const has=await rpc<boolean>('afrinethub_guest_owns_order',{p_session:session,p_order:body.orderId});
   if(!has)throw new Error('Order not found in this verified session');
   const {data,error}=await db.from('orders').select('id,order_number,status,data,created_at').eq('id',body.orderId).maybeSingle();
   if(error||!data)throw new Error('Order not found');
   return {ok:true,order:{...data.data,id:data.id,orderNumber:data.order_number,status:data.status,createdAt:data.created_at}};
 }
 if(action==='receipt'){
   if(!UUID.test(String(body.orderId||'')))throw new Error('Invalid order reference');
   const has=await rpc<boolean>('afrinethub_guest_owns_order',{p_session:session,p_order:body.orderId});
   const path=cleanText(body.fileId,180);
   const uploaded=await rpc<boolean>('afrinethub_has_upload',{p_session:session,p_path:path});
   if(!has||!uploaded||!path.includes('/receipt/'))throw new Error('Receipt does not belong to this order');
   const {data:order,error}=await db.from('orders').select('data,status').eq('id',body.orderId).maybeSingle();
   if(error||!order||order.status!=='Pending')throw new Error('This order cannot accept a receipt');
   const newData={...order.data,receiptId:path,receiptUrl:'',paymentStatus:'Receipt submitted — awaiting manual verification',receiptSubmittedAt:new Date().toISOString()};
   const {error:writeError}=await db.from('orders').update({data:newData}).eq('id',body.orderId).eq('status','Pending');
   if(writeError)throw new Error('Could not record receipt');
   return {ok:true,status:'Receipt received; awaiting manual payment verification'};
 }
 if(action==='request'){
   await limit('request-session',session,8,7200);
   await limit('request-ip',ipKey,20,3600);
   const kinds:any={portal:'portal_requests',project:'project_requests',advert:'advert_requests',feedback:'feedback_suggestions'};
   const table=kinds[body.kind];
   if(!table)throw new Error('Invalid request type');
   const data=body.data;
   if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid form');
   const serialized=JSON.stringify(data);
   if(serialized.length>13000)throw new Error('Form too long');
   const {portalPassword,password,portal_password_plain,...safe}=data;
   const payload={...safe,timestamp:new Date().toISOString()};
   const {data:record,error}=await db.from(table).insert({status:'Pending',data:payload}).select('id').single();
   if(error||!record)throw new Error('Could not submit form');
   return {ok:true,id:record.id};
 }
 if(action==='file-url'||action==='file-delete'){
   const path=cleanText(body.fileId,180);
   if(!path||!path.startsWith(session+'/'))throw new Error('Access denied');
   const has=await rpc<boolean>('afrinethub_has_upload',{p_session:session,p_path:path});
   if(!has)throw new Error('File not found');
   if(action==='file-url')return {ok:true,url:await signedUrl(path)};
   const linked=await rpc<boolean>('afrinethub_guest_has_order',{p_session:session});
   if(linked)throw new Error('Files for submitted orders cannot be removed');
   const {error}=await db.storage.from(BUCKET).remove([path]);
   if(error)throw new Error('File deletion failed');
   return {ok:true};
 }
 throw new Error('Unknown operation');
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(origin&&!CORS_ALLOWED.has(origin))return reply({ok:false,error:'Origin not permitted'},403,origin);
 try{
   const ip=cleanText(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown',90);
   // Staff document links, from authenticated admin, intentionally bypass guest tokens.
   const action=new URL(req.url).pathname.split('/').filter(Boolean).pop();
   if(req.method==='POST'&&(action==='admin-file-url'||action==='admin-file-delete')){
     if(!await isAdmin(req))return reply({ok:false,error:'Admin login required'},403,origin);
     const body=await getBody(req);
     const path=cleanText(body.fileId,180);
     if(!/^[a-f0-9-]{36}\/(document|receipt)\/[a-f0-9-]{36}\.(pdf|jpg|png|webp|docx)$/.test(path))
       return reply({ok:false,error:'Invalid file ID'},400,origin);
     if(action==='admin-file-delete'){
       const {error}=await db.storage.from(BUCKET).remove([path]);
       if(error)throw new Error('File deletion failed');
       return reply({ok:true},200,origin);
     }
     return reply({ok:true,url:await signedUrl(path,180)},200,origin);
   }
   const result=await handler(req,origin||'',ip);
   return reply(result,200,origin);
 }catch(error){
   const message=error instanceof Error?error.message:'Request failed';
   // Avoid leaking internal Supabase details to untrusted clients.
   const safe=/^(?:Too many requests|Human verification|Verification site|Verification service|Guest verification|Invalid|Add |Please |Upload|File |Order |This |Select |Could not |Unsupported|Unknown|Secure file|Receipt |Access denied|Form |Uploaded document|Files for|Private |Request too large|Missing )/.test(message)
     ?message:'Request could not be completed';
   return reply({ok:false,error:safe},400,origin);
 }
});
