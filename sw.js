const CACHE_NAME = 'bare-bones-pwa-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    // 'style.css',
    // 'script.js',
    'manifest.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'icons/apple-touch-icon.png'
    // Add other essential assets here
];

// Utility function to log from Service Worker (can't use window.logEvent)
function swLog(message, type = 'SW_EVENT') {
    console.log(`[SW] [${new Date().toISOString()}] [${type}] ${message}`);
    // For more advanced logging, you could use clients.matchAll()
    // and postMessage to send logs to the main page.
}

self.addEventListener('install', event => {
    swLog('Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                swLog('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                swLog('App shell cached successfully');
                return self.skipWaiting(); // Activate new SW immediately
            })
            .catch(error => {
                swLog(`Caching failed: ${error}`, 'SW_ERROR');
            })
    );
});

self.addEventListener('activate', event => {
    swLog('Activate event');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        swLog(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            swLog('Old caches cleaned up');
            return self.clients.claim(); // Take control of open clients
        })
    );
});

self.addEventListener('fetch', event => {
    // swLog(`Fetch event for: ${event.request.url}`, 'SW_FETCH');
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // swLog(`Serving from cache: ${event.request.url}`);
                    return response; // Serve from cache if found
                }
                // swLog(`Fetching from network: ${event.request.url}`);
                return fetch(event.request).then(
                    networkResponse => {
                        // Optionally cache new requests dynamically
                        // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                        //     const responseToCache = networkResponse.clone();
                        //     caches.open(CACHE_NAME).then(cache => {
                        //         cache.put(event.request, responseToCache);
                        //     });
                        // }
                        return networkResponse;
                    }
                ).catch(error => {
                    swLog(`Fetch failed for ${event.request.url}: ${error}`, 'SW_NETWORK_ERROR');
                    // You could return a fallback offline page here if appropriate
                    // return new Response("Offline content not available.", { headers: { 'Content-Type': 'text/plain' }});
                });
            })
    );
});

// Listen for messages from clients (e.g., for advanced logging or commands)
self.addEventListener('message', event => {
    swLog(`Message received from client: ${event.data.type}`, 'SW_MESSAGE');
    if (event.data && event.data.type === 'GET_LOGS') {
        // Example: client requests SW logs (more complex to implement fully)
    }
});

// Handle errors within the service worker itself
self.addEventListener('error', function(event) {
    swLog(`Error in Service Worker: ${event.message} at ${event.filename}:${event.lineno}`, 'SW_ERROR_GLOBAL');
});