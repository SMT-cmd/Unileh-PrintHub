// AfriNet Hub administrator access. Only an existing, provisioned administrator may enter.
// The database must ALSO enforce row-level and write authorization on every admin table.
function waitForSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabaseClient) return resolve();
    let elapsed = 0;
    const watch = setInterval(() => {
      elapsed += 100;
      if (window.supabaseClient) {
        clearInterval(watch);
        resolve();
      } else if (elapsed >= 10000) {
        clearInterval(watch);
        reject(new Error('Unable to connect to the administration service. Please try again.'));
      }
    }, 100);
  });
}

async function isAuthorizedAdmin() {
  await waitForSupabase();
  const client = window.supabaseClient;
  const { data: result, error: authError } = await client.auth.getUser();
  if (authError || !result?.user?.id) return false;

  // Only the two confirmed, individually verified administrators may claim their own slot.
  // Access is restricted in the database, not just by this browser interface.
  const { error: claimError } = await client.rpc('claim_afrinethub_admin');
  if (claimError) { console.warn('Administrator claim check failed'); return false; }
  // Fail closed: a verified member must have an exact, authorized UUID mapping.
  const { data: admin, error } = await client
    .from('admin_config')
    .select('uid')
    .eq('uid', result.user.id)
    .maybeSingle();
  if (error || !admin?.uid) return false;
  return admin.uid === result.user.id;
}

async function isAdminRegistrationOpen() {
  // Two separate first-time accounts are permitted. Both must verify their own email.
  return true;
}

async function signUpAdmin(email) {
  await waitForSupabase();
  const allowed=['timilehintallest@gmail.com','afrinetnig@gmail.com'];
  const adminEmail=String(email||'').trim().toLowerCase();
  if(!allowed.includes(adminEmail))throw new Error('Only approved administrator emails can register.');
  if(!window.afriBackend)throw new Error('Account setup service unavailable.');
  const guestToken=await window.afriBackend.ensureGuestSession();
  const result=await window.afriBackend.apiCall('admin-setup',{email:adminEmail,guestToken});
  return {needsEmailConfirmation:true,status:result.status};
}

async function signInAdmin(email, password) {
  await waitForSupabase();
  const client = window.supabaseClient;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const role = await getAdminAccess();
  if (!role) {
    await client.auth.signOut();
    throw new Error('This account has not been approved for the AfriNet Hub dashboard.');
  }
  return role;
}

async function signOutAdmin() {
  await waitForSupabase();
  await window.supabaseClient.auth.signOut();
  window.location.replace('/admin/');
}

function isDashboardPath() { return /\/admin\/dashboard\/?$/.test(window.location.pathname); }
function isPrintPath() { return /\/admin\/print\/?$/.test(window.location.pathname); }
function isLoginPath() { return /\/admin\/?$/.test(window.location.pathname); }

// Never redirect staff to the financial/admin dashboard. Auth is checked again
// by the print-only Edge API on every request.
waitForSupabase().then(() => {
  window.supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!isDashboardPath() && !isPrintPath() && !isLoginPath()) return;
    setTimeout(async () => {
      try {
        if(!session?.user) {
          if(isDashboardPath()||isPrintPath())window.location.replace('../');
          return;
        }
        const role=await getAdminAccess();
        if(isDashboardPath() && role!=='admin')window.location.replace('../');
        else if(isPrintPath() && !role)window.location.replace('../');
        else if(isLoginPath() && role && !location.search.includes('staff-invite=1') && !location.search.includes('admin-setup=1') && !['invite','recovery'].includes(new URLSearchParams(location.hash.slice(1)).get('type'))) {
          window.location.replace(role==='print_staff'?'print/':'dashboard/');
        }
      }catch{
        if(isDashboardPath()||isPrintPath())window.location.replace('../');
      }
    },0);
  });
}).catch((error)=>console.error('Admin authentication initialization failed:',error));

window.signInAdmin = signInAdmin;
window.signUpAdmin = signUpAdmin;
window.isAdminRegistrationOpen = isAdminRegistrationOpen;
window.isAuthorizedAdmin = isAuthorizedAdmin;
window.signOutAdmin = signOutAdmin;

window.isAuthorizedPrintStaff = isAuthorizedPrintStaff;
window.getAdminAccess = getAdminAccess;
