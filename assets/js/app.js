// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Find the base path (handles GitHub Pages subfolders and Firebase root)
    let base = window.location.pathname.split('/index.html')[0];
    if (base.endsWith('/')) base = base.slice(0, -1);
    
    // If we are in a subfolder like /order/, we need to go to the root
    // But since app.js is loaded in all pages, we can just use a relative path to the root.
    // The most reliable way is to check the current depth.
    const depth = window.location.pathname.split('/').filter(p => p !== '').length;
    let swPath = 'service-worker.js';
    
    // If we are in a folder like /order/ (depth 1 or more depending on base)
    // Actually, let's just use the repo detection but make it more generic
    const isGitHub = window.location.hostname.includes('github.io');
    const pathParts = window.location.pathname.split('/');
    const repoName = isGitHub ? pathParts[1] : '';
    
    let finalSwPath = '/service-worker.js';
    if (isGitHub && repoName) {
      finalSwPath = `/${repoName}/service-worker.js`;
    } else if (window.location.protocol === 'file:') {
        // Local file system - SW won't work anyway
        return;
    }

    navigator.serviceWorker.register(finalSwPath)
      .then(reg => {
        console.log('Service Worker: Registered');
        
        // Check for updates periodically (every 10 minutes)
        setInterval(() => {
          reg.update();
        }, 10 * 60 * 1000);
      })
      .catch(err => console.log(`Service Worker: Error: ${err}`));

    // When the new service worker takes over, force reload the page to apply new assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
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
