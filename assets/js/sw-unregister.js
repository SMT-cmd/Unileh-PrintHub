/**
 * Emergency Service Worker Unregistration Script
 * This script will completely remove the problematic service worker
 * and allow direct Appwrite API calls to work.
 */

// Force unregister all service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister().then(function(boolean) {
                console.log('Service Worker unregistered:', boolean);
            });
        }
    });
}

// Clear all caches
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
            console.log('Cache deleted:', name);
        }
    });
}

// Force reload the page without service worker
window.location.reload(true);