function assertNoPreviewWrites() {
  if (location.hostname.endsWith('.vercel.app')) {
    throw new Error('This is a design preview. For orders and requests, please use afrinethub.com.ng.');
  }
}

// Loads the Supabase library from our own copy in assets/vendor (no outside CDN).
// Pages that already include the vendor <script> tag will have window.supabase ready;
// pages that don't (news, partners and so on) get it loaded here.
async function loadSupabaseLibrary() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    return window.supabase;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/supabase-2.117.2.js', import.meta.url).href;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the Supabase library'));
    document.head.appendChild(s);
  });
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase library did not initialise');
  }
  return window.supabase;
}

const { createClient } = await loadSupabaseLibrary();

const SUPABASE_URL = 'https://soqjthnzyntkhthcnucj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YVKFznQEfolCyUaHWz791g_lbxm-Imk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const API_BASE = SUPABASE_URL + '/functions/v1/afrinethub-api';
const TURNSTILE_SITEKEY = '0x4AAAAAAF62eebvoGKdOf2X';
let guestState = null;
try {
  guestState = JSON.parse(sessionStorage.getItem('afri-guest-session') || 'null');
} catch { guestState = null; }

async function apiCall(action, body, options={}) {
  const headers = { apikey: SUPABASE_ANON_KEY };
  if (options.bearer) headers.Authorization = 'Bearer ' + options.bearer;
  if (!options.form) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(API_BASE + '/' + action, {
      method:'POST', mode:'cors', credentials:'omit', cache:'no-store',
      headers, body: options.form ? body : JSON.stringify(body)
    });
  } catch {
    throw new Error('The secure server could not be reached. Please check your connection.');
  }
  const result = await response.json().catch(()=>null);
  if (!response.ok || !result?.ok) throw new Error(result?.error || 'Secure request failed. Please try again.');
  return result;
}

async function humanChallenge() {
  if (!window.turnstile) {
    await new Promise((resolve, reject) => {
      const script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;script.defer=true;
      script.onload=resolve;
      script.onerror=()=>reject(new Error('Could not load verification. Check your internet or browser extensions.'));
      document.head.appendChild(script);
    });
  }
  return new Promise((resolve,reject)=>{
    const layer=document.createElement('div');
    layer.setAttribute('role','dialog');
    layer.setAttribute('aria-label','Security verification');
    layer.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(9,25,48,.72);display:grid;place-items:center;padding:20px';
    const panel=document.createElement('div');
    panel.style.cssText='background:#fff;color:#0b2142;border-radius:12px;padding:24px;max-width:380px;width:100%;box-shadow:0 18px 70px rgba(0,0,0,.3);font-family:inherit';
    const title=document.createElement('h3');title.textContent='One quick security check';title.style.cssText='font-size:19px;margin:0 0 8px;color:#0b2142';
    const p=document.createElement('p');p.textContent='Verify that you are a person before sending your request or document.';p.style.cssText='font-size:14px;margin:0 0 18px;color:#4a5568';
    const slot=document.createElement('div');slot.style.cssText='min-height:70px';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.style.cssText='display:block;margin-top:16px;padding:8px 16px;border:1px solid #b6becb;border-radius:5px;background:#fff;color:#0b2142;cursor:pointer';
    panel.append(title,p,slot,cancel);layer.append(panel);document.body.appendChild(layer);
    let finished=false; let widgetId=null;
    const done=(err,token)=>{
      if(finished)return;finished=true;
      try{if(widgetId!==null)window.turnstile.remove(widgetId);}catch{}
      layer.remove();
      err?reject(err):resolve(token);
    };
    cancel.onclick=()=>done(new Error('Verification was cancelled'));
    try{
      widgetId=window.turnstile.render(slot,{
        sitekey:TURNSTILE_SITEKEY,
        callback:token=>done(null,token),
        'error-callback':()=>done(new Error('Verification failed. Please try again.')),
        'timeout-callback':()=>done(new Error('Verification timed out. Please try again.'))
      });
    }catch{done(new Error('Security verification is unavailable in this browser'));}
  });
}
async function ensureGuestSession() {
  if (guestState?.guestToken && Number(guestState.expiresAt) > Date.now()+60000) return guestState.guestToken;
  assertNoPreviewWrites();
  const token=await humanChallenge();
  const result=await apiCall('session',{turnstileToken:token});
  guestState={guestToken:result.guestToken,expiresAt:Date.now()+Number(result.expiresIn||7200)*1000};
  sessionStorage.setItem('afri-guest-session',JSON.stringify(guestState));
  return guestState.guestToken;
}
function existingGuestToken() {
  if (!guestState?.guestToken || Number(guestState.expiresAt)<=Date.now())
    throw new Error('This order was started in another browser or its secure session expired. Please begin a fresh order.');
  return guestState.guestToken;
}
window.afriBackend = {
  ensureGuestSession, apiCall,
  async uploadFile(file,kind='document'){
    assertNoPreviewWrites();
    const guestToken=await ensureGuestSession();
    const form=new FormData();
    form.append('guestToken',guestToken);form.append('kind',kind);form.append('file',file);
    const result=await apiCall('upload',form,{form:true});
    return {success:true,fileId:result.fileId,originalName:result.originalName,viewURL:result.viewURL};
  },
  async deleteFile(fileId){
    const guestToken=existingGuestToken();
    await apiCall('file-delete',{guestToken,fileId});
  },
  async receipt(orderId,fileId){
    const guestToken=existingGuestToken();
    return apiCall('receipt',{guestToken,orderId,fileId});
  },
  async adminFileUrl(fileId){
    const {data:{session}}=await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sign in as administrator to view private files');
    const res=await apiCall('admin-file-url',{fileId},{bearer:session.access_token});
    return res.url;
  },
  async adminDeleteFile(fileId){
    const {data:{session}}=await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sign in as administrator to manage files');
    return apiCall('admin-file-delete',{fileId},{bearer:session.access_token});
  }
};

async function saveOrder(orderData) {
  assertNoPreviewWrites();
  const guestToken=await ensureGuestSession();
  const result=await apiCall('order',{guestToken,data:orderData});
  return result.orderId;
}

async function getOrder(orderId) {
  const guestToken=existingGuestToken();
  const result=await apiCall('order-get',{guestToken,orderId});
  return result.order;
}

async function savePortalRequest(requestData) {
  assertNoPreviewWrites();
  const guestToken=await ensureGuestSession();
  const {portalPassword:discardedPassword,password:discardedOther,...safe}=requestData;
  const result=await apiCall('request',{kind:'portal',guestToken,data:safe});
  return result.id;
}

async function saveAdvertRequest(advertData) {
  assertNoPreviewWrites();
  const guestToken=await ensureGuestSession();
  const result=await apiCall('request',{kind:'advert',guestToken,data:advertData});
  return result.id;
}

async function saveFeedbackSuggestion(feedbackData) {
  assertNoPreviewWrites();
  const guestToken=await ensureGuestSession();
  const result=await apiCall('request',{kind:'feedback',guestToken,data:feedbackData});
  return result.id;
}

async function saveProjectRequest(requestData) {
  assertNoPreviewWrites();
  const guestToken=await ensureGuestSession();
  const result=await apiCall('request',{kind:'project',guestToken,data:requestData});
  return result.id;
}

function listenToActiveAdverts(placement, callback) {
  const fetchAndEmit = async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase.from('adverts').select('*').gte('end_date', nowIso);
    if (error) { console.warn('listenToActiveAdverts error:', error); callback([]); return; }
    const filtered = (data || []).filter(row => {
      if (row.start_date && row.start_date > nowIso) return false;
      return row.placement === placement || row.placement === 'Both';
    });
    callback(filtered.map(row => ({ id: row.id, ...row.data, placement: row.placement, startDate: row.start_date, endDate: row.end_date })));
  };
  fetchAndEmit();
  const channel = supabase
    .channel('adverts-' + placement)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'adverts' }, fetchAndEmit)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

function listenToAnnouncements(callback) {
  const fetchAndEmit = async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase.from('announcements').select('*').gte('expiry_date', nowIso).order('expiry_date', { ascending: true });
    if (error) { console.warn('listenToAnnouncements error:', error); callback([]); return; }
    callback((data || []).map(row => ({ id: row.id, ...row.data, expiryDate: row.expiry_date })));
  };
  fetchAndEmit();
  const channel = supabase
    .channel('announcements-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAndEmit)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

function listenToPartners(callback) {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase.from('partners').select('*').order('name', { ascending: true });
    if (error) { console.warn('listenToPartners error:', error); callback([]); return; }
    callback((data || []).map(row => ({ id: row.id, ...row.data, name: row.name })));
  };
  fetchAndEmit();
  const channel = supabase
    .channel('partners-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchAndEmit)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

function listenToGadgetProducts(callback) {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase.from('gadget_products').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('listenToGadgetProducts error:', error); callback([]); return; }
    callback((data || []).map(row => ({ id: row.id, category: row.category, ...row.data })));
  };
  fetchAndEmit();
  const channel = supabase
    .channel('gadget-products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gadget_products' }, fetchAndEmit)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

function listenToHousingListings(callback) {
  const fetchAndEmit = async () => {
    const { data, error } = await supabase.from('housing_listings').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('listenToHousingListings error:', error); callback([]); return; }
    callback((data || []).map(row => ({ id: row.id, type: row.type, pricePeriod: row.price_period, ...row.data })));
  };
  fetchAndEmit();
  const channel = supabase
    .channel('housing-listings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'housing_listings' }, fetchAndEmit)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

window.supabaseClient = supabase;
window.saveOrder = saveOrder;
window.getOrder = getOrder;
window.savePortalRequest = savePortalRequest;
window.saveAdvertRequest = saveAdvertRequest;
window.saveFeedbackSuggestion = saveFeedbackSuggestion;
window.saveProjectRequest = saveProjectRequest;
window.listenToActiveAdverts = listenToActiveAdverts;
window.listenToAnnouncements = listenToAnnouncements;
window.listenToPartners = listenToPartners;
window.listenToGadgetProducts = listenToGadgetProducts;
window.listenToHousingListings = listenToHousingListings;