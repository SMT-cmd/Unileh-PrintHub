function waitForSupabase() {
  return new Promise((resolve) => {
    const depCheck = setInterval(() => {
      if (window.supabaseClient) {
        clearInterval(depCheck);
        resolve();
      }
    }, 100);
  });
}

async function isAdminRegistrationOpen() {
  await waitForSupabase();
  const { data, error } = await window.supabaseClient.rpc('is_registration_open');
  if (error) { console.error(error); return false; }
  return data;
}

async function signUpAdmin(email, password) {
  await waitForSupabase();
  const registrationOpen = await isAdminRegistrationOpen();
  if (!registrationOpen) {
    throw new Error('One-time admin registration is already completed.');
  }
  const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({ email, password });
  if (signUpError) throw signUpError;

  if (signUpData.session && signUpData.user) {
    await claimAdminSlot(signUpData.user.id, signUpData.user.email);
    await window.supabaseClient.auth.signOut();
    return { needsEmailConfirmation: false };
  }
  return { needsEmailConfirmation: true };
}

async function claimAdminSlot(uid, email) {
  const stillOpen = await isAdminRegistrationOpen();
  if (!stillOpen) return;
  const { error } = await window.supabaseClient.from('admin_config').insert({
    id: 'setup', uid, registered_by: email
  });
  if (error && error.code !== '23505') throw error;
}

async function signInAdmin(email, password) {
  await waitForSupabase();
  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Claiming now happens centrally below, so it covers this AND
  // sessions Supabase creates automatically (e.g. via a confirmation link).
}

async function signOutAdmin() {
  await waitForSupabase();
  await window.supabaseClient.auth.signOut();
  window.location.href = '../admin/';
}

// Runs on every admin page, for every session — whether it came from
// explicit sign-in or Supabase auto-establishing one after an email
// confirmation redirect. This is the one place that claims the slot.
if (window.location.pathname.includes('/admin/dashboard') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin')) {
  waitForSupabase().then(() => {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const user = session && session.user;
      if (user) {
        try {
          await claimAdminSlot(user.id, user.email);
        } catch (e) {
          console.error('Error claiming admin slot:', e);
        }
      }
      if (window.location.pathname.includes('/admin/dashboard') && !user) {
        window.location.href = '../admin/';
      }
      if ((window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin')) && user) {
        window.location.href = 'dashboard/';
      }
    });
  });
}

window.signInAdmin = signInAdmin;
window.signUpAdmin = signUpAdmin;
window.isAdminRegistrationOpen = isAdminRegistrationOpen;
window.signOutAdmin = signOutAdmin;