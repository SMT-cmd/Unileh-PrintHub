function waitForAuthDeps() {
  return new Promise((resolve) => {
    const depCheck = setInterval(() => {
      if (window.auth && window.db && window.firebaseMethods) {
        clearInterval(depCheck);
        resolve();
      }
    }, 100);
  });
}

async function signInAdmin(email, password) {
  try {
    await waitForAuthDeps();
    await window.firebaseMethods.signInWithEmailAndPassword(window.auth, email, password);
  } catch (error) {
    throw error;
  }
}

async function isAdminRegistrationOpen() {
  await waitForAuthDeps();
  const setupRef = window.firebaseMethods.doc(window.db, "adminConfig", "setup");
  const setupSnap = await window.firebaseMethods.getDoc(setupRef);
  return !setupSnap.exists();
}

async function signUpAdmin(email, password) {
  await waitForAuthDeps();
  const registrationOpen = await isAdminRegistrationOpen();
  if (!registrationOpen) {
    throw new Error("One-time admin registration is already completed.");
  }
  try {
    const userCredential = await window.firebaseMethods.createUserWithEmailAndPassword(window.auth, email, password);
    const setupRef = window.firebaseMethods.doc(window.db, "adminConfig", "setup");
    await window.firebaseMethods.setDoc(setupRef, {
      registeredAt: new Date().toISOString(),
      registeredBy: email,
      uid: userCredential.user.uid
    });
    await window.firebaseMethods.signOut(window.auth);
    return true;
  } catch (error) {
    throw error;
  }
}

async function signOutAdmin() {
  try {
    await waitForAuthDeps();
    await window.firebaseMethods.signOut(window.auth);
    window.location.href = '../admin/';
  } catch (error) {
    throw error;
  }
}

if (window.location.pathname.includes('/admin/dashboard') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin')) {
  const checkAuthDeps = setInterval(() => {
    if (window.auth && window.firebaseMethods && window.firebaseMethods.onAuthStateChanged) {
      clearInterval(checkAuthDeps);
      window.firebaseMethods.onAuthStateChanged(window.auth, (user) => {
        if (window.location.pathname.includes('/admin/dashboard') && !user) {
          window.location.href = '../admin/';
        }
        if ((window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin')) && user) {
          window.location.href = 'dashboard/';
        }
      });
    }
  }, 100);
}

window.signInAdmin = signInAdmin;
window.signUpAdmin = signUpAdmin;
window.isAdminRegistrationOpen = isAdminRegistrationOpen;
window.signOutAdmin = signOutAdmin;
