// Print Staff only: restricted backend; never query full orders or financial tables.
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const entries=document.getElementById('print-orders-list');
const feedback=document.getElementById('print-feedback');
const summary=document.getElementById('print-summary');
const refresh=document.getElementById('print-refresh');
const allowedStatus={Paid:'Printed',Printed:'Ready',Ready:'Collected'};
let busy=false;

async function ready(){
 for(let i=0;i<100;i++){
  if(window.afriBackend&&window.getAdminAccess)return;
  await delay(100);
 }
 throw new Error('The printing service could not initialize.');
}
async function bearer(){
 const {data:{session}}=await window.supabaseClient.auth.getSession();
 if(!session?.access_token)throw new Error('Please sign in again.');
 return session.access_token;
}
async function call(action,body={}){
 return window.afriBackend.apiCall(action,body,{bearer:await bearer()});
}
function el(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=String(text);
 return e;
}
async function openDocument(fileId){
 const viewer=window.open('about:blank','_blank');
 if(viewer) viewer.opener=null;
 try{
  const {url}=await call('staff-file-url',{fileId});
  if(viewer)viewer.location.replace(url);
  else {
   feedback.replaceChildren();
   const link=el('a','print-file','Open secure printing document');
   link.href=url;link.target='_blank';link.rel='noopener noreferrer';
   feedback.append(link);
  }
 }catch(error){
  if(viewer)viewer.close();
  feedback.textContent=error.message||'Could not open the printing document.';
 }
}
async function changeStatus(job,next,btn){
 if(next==='Collected'&&!confirm('Confirm this finished print job has been collected?'))return;
 btn.disabled=true;feedback.textContent='Updating print progress…';
 try{
  await call('staff-progress',{orderId:job.id,status:next});
  feedback.textContent='Print progress updated.';
  await load();
 }catch(e){feedback.textContent=e.message||'Could not update print job.';btn.disabled=false;}
}
function render(jobs){
 entries.replaceChildren();
 summary.textContent=jobs.length+' print job'+(jobs.length===1?'':'s');
 if(!jobs.length){
  entries.append(el('p','print-note','No paid print jobs are ready yet. Refresh the page when a payment has been verified.'));
  return;
 }
 for(const job of jobs){
  const card=el('article','print-job');
  const top=el('div','print-job-top'),head=el('div');
  head.append(el('h3','',job.orderNumber||'Print order'));
  head.append(el('p','print-meta',String(job.studentName||'Student')+' · '+String(job.phoneNumber||'')));
  top.append(head,el('span','print-pill',job.status||'Unknown'));
  card.append(top);
  const date=job.createdAt?new Date(job.createdAt).toLocaleString():'';
  card.append(el('p','print-meta',date));
  const files=el('div','print-files');
  for(const [i,file] of (Array.isArray(job.files)?job.files:[]).entries()){
   if(!file.fileId)continue;
   const btn=el('button','print-file','Download '+(file.fileName||'document '+(i+1)));
   btn.type='button';
   btn.title=(file.printType||'Print')+' · '+(file.pageCount||1)+' pages · '+(file.copies||1)+' copies';
   btn.addEventListener('click',()=>openDocument(file.fileId));
   files.append(btn);
  }
  card.append(files);
  const next=allowedStatus[job.status];
  if(next){
   const button=el('button','print-advance',job.status==='Paid'?'Mark as printed':job.status==='Printed'?'Mark ready for collection':'Mark collected');
   button.type='button';
   button.addEventListener('click',()=>changeStatus(job,next,button));
   card.append(button);
  }
  entries.append(card);
 }
}
async function load(){
 if(busy)return;busy=true;refresh.disabled=true;
 try{
  const result=await call('staff-orders');
  render(Array.isArray(result.jobs)?result.jobs:[]);
  feedback.textContent='';
 }catch(e){
  summary.textContent='Unable to load orders';
  feedback.textContent=e.message||'Could not reach the printing service.';
 }finally{busy=false;refresh.disabled=false;}
}
try{
 await ready();
 const role=await window.getAdminAccess();
 if(!role)location.replace('/admin/');
 else await load();
}catch(e){feedback.textContent=e.message||'Please sign in.';}
refresh.addEventListener('click',load);
document.getElementById('print-logout').addEventListener('click',()=>window.signOutAdmin());
