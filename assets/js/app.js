// --- Service Worker Removal & Cache Clearing ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log('✅ Service Worker Unregistered');
        window.location.reload(); // Force reload once after unregistering
      });
    }
  });

  // Clear all caches to force update to latest code
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) {
        caches.delete(name);
      }
      console.log('✅ All Caches Cleared');
    });
  }
}

// Dark/Light Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
  document.documentElement.setAttribute('data-theme', currentTheme);
  if (currentTheme === 'dark') {
    themeToggle.textContent = 'Light Mode';
  }
} else {
  // Default to light
  document.documentElement.setAttribute('data-theme', 'light');
}

themeToggle.addEventListener('click', () => {
  let theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'light') {
    theme = 'dark';
    themeToggle.textContent = 'Light Mode';
  } else {
    theme = 'light';
    themeToggle.textContent = 'Dark Mode';
  }
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
});

// PWA Install Prompt
let deferredPrompt;
const installPrompt = document.getElementById('install-prompt');
const installButton = document.getElementById('install-button');
const closeInstallPrompt = document.getElementById('close-install-prompt');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  if (installPrompt) installPrompt.style.display = 'flex';
});

if (installButton) {
  installButton.addEventListener('click', () => {
    // Hide our custom install UI
    if (installPrompt) installPrompt.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
  });
}

if (closeInstallPrompt) {
  closeInstallPrompt.addEventListener('click', () => {
    if (installPrompt) installPrompt.style.display = 'none';
  });
}

// Clean URL Navigation Helper (Smart Router for Local & Production)
document.querySelectorAll('a').forEach(link => {
  const href = link.getAttribute('href');
  
  // Only intercept internal links that look like clean URLs (no dots, not empty, not just /)
  if (href && !href.includes('.') && href !== '#' && href !== '/' && !href.startsWith('http') && !href.startsWith('wa.me')) {
    link.addEventListener('click', (e) => {
      const isLocal = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.protocol === 'file:';

      if (isLocal) {
        e.preventDefault();
        // If it's a relative link like 'order/', we need to point to 'order/index.html'
        // If it's 'order', point to 'order/index.html'
        let target = href;
        if (target.endsWith('/')) {
          target += 'index.html';
        } else {
          target += '/index.html';
        }
        window.location.href = target;
      }
    });
  }
});
