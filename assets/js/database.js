import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://uuuoqexhuwwiwpvqgypy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dW9xZXhodXd3aXdwdnFneXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDMyMDEsImV4cCI6MjEwNjIxOTIwMX0.ktKrFp8EuYBq9CBLGbME9PEo4GaReiKRVBtEOdR-BYI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function saveOrder(orderData) {
  try {
    const id = crypto.randomUUID();
    const { data: orderNumber, error: rpcError } = await supabase.rpc('generate_order_number');
    if (rpcError) throw rpcError;

    const { error } = await supabase.from('orders').insert({
      id, order_number: orderNumber, status: 'Pending', data: orderData
    });
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Error saving order: ', error);
    throw error;
  }
}

async function getOrder(orderId) {
  try {
    const { data, error } = await supabase.rpc('get_order_by_id', { p_id: orderId });
    if (error) throw error;
    if (!data || data.length === 0) return null;
    const row = data[0];
    return { ...row.data, id: row.id, orderNumber: row.order_number, status: row.status, createdAt: row.created_at };
  } catch (error) {
    console.error('Error fetching order: ', error);
    throw error;
  }
}

async function savePortalRequest(requestData) {
  try {
    const id = crypto.randomUUID();
    const { portalPassword, ...rest } = requestData;
    const { error } = await supabase.from('portal_requests').insert({
      id,
      data: rest,
      portal_password_plain: portalPassword || null
    });
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Error saving portal request: ', error);
    throw error;
  }
}

async function saveAdvertRequest(advertData) {
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('advert_requests').insert({ id, status: 'Pending', data: advertData });
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Error saving advert request: ', error);
    throw error;
  }
}

async function saveFeedbackSuggestion(feedbackData) {
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('feedback_suggestions').insert({ id, status: 'Pending', data: feedbackData });
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Error saving feedback suggestion: ', error);
    throw error;
  }
}

async function saveProjectRequest(requestData) {
  try {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('project_requests').insert({ id, status: 'Pending', data: requestData });
    if (error) throw error;
    return id;
  } catch (error) {
    console.error('Error saving project request: ', error);
    throw error;
  }
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