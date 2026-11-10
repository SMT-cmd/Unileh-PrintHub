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

  // Trusted DB function grants a one-time admin slot ONLY to the verified owner email.
  // It never grants admin rights to another account or an unconfirmed signup.
  const { error: claimError } = await client.rpc('claim_afrinethub_admin');
  if (claimError) { console.warn('Administrator claim check failed'); return false; }
  // Fail closed: exact approved UUID in admin_config is still required.
  const { data: admin, error } = await client
    .from('admin_config')
    .select('uid')
    .eq('id', 'setup')
    .maybeSingle();
  if (error || !admin?.uid) return false;
  return admin.uid === result.user.id;
}

async function isAdminRegistrationOpen() {
  // The registration form is available, but the backend only ever admits
  // a VERIFIED account with the single approved owner email.
  return true;
}

async function signUpAdmin(email, password) {
  await waitForSupabase();
  if (String(email||'').trim().toLowerCase() !== 'timilehintallest@gmail.com')
    throw new Error('Only the approved owner email can register for administration.');
  if (typeof password !== 'string' || password.length < 12)
    throw new Error('Use a strong password of at least 12 characters.');
  const {data,error} = await window.supabaseClient.auth.signUp({
    email:'timilehintallest@gmail.com',
    password,
    options:{emailRedirectTo:window.location.origin+'/admin/'}
  });
  if(error)throw error;
  return {needsEmailConfirmation:!data?.session};
}

async function signInAdmin(email, password) {
  await waitForSupabase();
  const client = window.supabaseClient;
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const allowed = await isAuthorizedAdmin();
  if (!allowed) {
    await client.auth.signOut();
    throw new Error('This account is not authorized for administration.');
  }
}

async function signOutAdmin() {
  await waitForSupabase();
  await window.supabaseClient.auth.signOut();
  window.location.replace('../admin/');
}

function isDashboardPath() { return /\/admin\/dashboard\/?$/.test(window.location.pathname); }
function isLoginPath() { return /\/admin\/?$/.test(window.location.pathname); }

// Delay permission checks outside the Supabase auth callback to avoid nested auth requests.
waitForSupabase().then(() => {
  window.supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (!isDashboardPath() && !isLoginPath()) return;
    setTimeout(async () => {
      try {
        const allowed = Boolean(session?.user) && await isAuthorizedAdmin();
        if (isDashboardPath() && !allowed) {
          window.location.replace('../');
        } else if (isLoginPath() && allowed) {
          window.location.replace('dashboard/');
        }
      } catch (error) {
        console.error('Administrator permission check failed:', error);
        if (isDashboardPath()) window.location.replace('../');
      }
    }, 0);
  });
}).catch((error) => {
  console.error('Administrator authentication could not initialize:', error);
});

window.signInAdmin = signInAdmin;
window.signUpAdmin = signUpAdmin;
window.isAdminRegistrationOpen = isAdminRegistrationOpen;
window.isAuthorizedAdmin = isAuthorizedAdmin;
window.signOutAdmin = signOutAdmin;
