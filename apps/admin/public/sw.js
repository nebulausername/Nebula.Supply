// Service Worker für Offline-Support und Asset-Caching
const CACHE_VERSION = 'nebula-admin-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets die beim Install gecacht werden sollen
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Vite generiert diese automatisch, werden zur Build-Zeit hinzugefügt
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Failed to cache some static assets:', err);
      });
    })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old caches that don't match current version
            return name.startsWith('nebula-admin-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== API_CACHE;
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch Event - Cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Static Assets: Cache First Strategy
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // API Calls: Network First with Cache Fallback
  if (isApiRequest(request.url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }
  
  // Dynamic Assets (JS/CSS): Stale While Revalidate
  if (isDynamicAsset(request.url)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }
  
  // Default: Network First
  event.respondWith(networkFirst(request));
});

// Cache First Strategy - für statische Assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    // Return offline page if available
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    throw error;
  }
}

// Network First with Cache Fallback - für API Calls
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    const cached = await cache.match(request);
    if (cached) {
      // Add cache header to indicate this is cached
      const headers = new Headers(cached.headers);
      headers.set('X-Served-From-Cache', 'true');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Offline',
        message: 'Keine Internetverbindung. Bitte versuche es später erneut.',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate - für dynamische Assets
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignore fetch errors in background
  });
  
  // Return cached version immediately if available
  if (cached) {
    return cached;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}

// Network First - Default Strategy
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Helper Functions
function isStaticAsset(url) {
  return url.includes('/assets/') || 
         url.endsWith('.png') || 
         url.endsWith('.jpg') || 
         url.endsWith('.jpeg') || 
         url.endsWith('.svg') || 
         url.endsWith('.ico') ||
         url.endsWith('.woff') ||
         url.endsWith('.woff2') ||
         url.endsWith('.ttf');
}

function isDynamicAsset(url) {
  return url.endsWith('.js') || 
         url.endsWith('.css') ||
         url.includes('/src/');
}

function isApiRequest(url) {
  return url.includes('/api/') || 
         url.includes('/auth/') ||
         url.includes('/health');
}

// Message Handler - für Cache Management vom Client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('nebula-admin-'))
            .map((name) => caches.delete(name))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => 
            caches.open(name).then((cache) => 
              cache.keys().then((keys) => ({ name, size: keys.length }))
            )
          )
        );
      }).then((sizes) => {
        event.ports[0].postMessage({ sizes });
      })
    );
  }
});

// Background Sync für Offline Actions (falls unterstützt)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implementiere Background Sync für offline Actions
  console.log('[Service Worker] Background sync triggered');
}

