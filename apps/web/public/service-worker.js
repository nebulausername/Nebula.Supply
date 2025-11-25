// 🚀 Enhanced Service Worker für PWA Support mit Drops Integration
const CACHE_NAME = 'nebula-drops-v3';
const RUNTIME_CACHE = 'nebula-runtime-v3';
const DROPS_CACHE = 'nebula-drops-data-v2';
const PRODUCTS_CACHE = 'nebula-products-v1';
const CART_CACHE = 'nebula-cart-v1';
const INTEREST_QUEUE = 'nebula-interest-queue-v2';
const CART_QUEUE = 'nebula-cart-queue-v1';
const ORDER_QUEUE = 'nebula-order-queue-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/api/drops/featured', // Cache featured drops
];

// 🎯 Interest queue for offline functionality
let interestQueue = [];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 🎯 Enhanced drops API handling
  if (url.pathname.startsWith('/api/drops')) {
    event.respondWith(handleDropsAPI(request, url));
    return;
  }

  // 🎯 Products API - Cache with stale-while-revalidate
  if (url.pathname.startsWith('/api/products') || url.pathname.startsWith('/api/shop')) {
    event.respondWith(handleProductsAPI(request, url));
    return;
  }

  // 🎯 Cart API - Network first with queue for offline
  if (url.pathname.startsWith('/api/cart')) {
    event.respondWith(handleCartAPI(request, url));
    return;
  }

  // 🎯 Orders API - Network first with queue for offline
  if (url.pathname.startsWith('/api/orders')) {
    event.respondWith(handleOrdersAPI(request, url));
    return;
  }

  // 🎯 Rank API - Always network first with timeout, no caching (user-specific data)
  if (url.pathname.startsWith('/api/rank')) {
    event.respondWith(handleRankAPI(request, url));
    return;
  }

  // Network first for other API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cache if network fails
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a proper error response if no cache available
          return new Response(JSON.stringify({
            success: false,
            error: 'NetworkError',
            message: 'Request failed and no cached response available'
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && request.url.startsWith(self.location.origin)) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Return a custom offline response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 🎯 Enhanced drops API handler
async function handleDropsAPI(request, url) {
  const pathname = url.pathname;

  // Cache-first for featured drops (stale-while-revalidate)
  if (pathname === '/api/drops/featured') {
    return caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DROPS_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });

      return cachedResponse || fetchPromise;
    });
  }

  // Network-first for other drops API calls with caching
  if (pathname.startsWith('/api/drops/')) {
    return fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DROPS_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline response for drops
          return new Response(JSON.stringify({
            success: false,
            error: 'Offline',
            message: 'Drop data not available offline'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      });
  }

  return fetch(request);
}

// 🎯 Products API handler with stale-while-revalidate
async function handleProductsAPI(request, url) {
  const cache = await caches.open(PRODUCTS_CACHE);
  const cachedResponse = await cache.match(request);

  // Return cached response immediately if available
  if (cachedResponse) {
    // Fetch fresh data in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Ignore background fetch errors
      });
    
    return cachedResponse;
  }

  // No cache, fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline response
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline',
      message: 'Product data not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🎯 Cart API handler with offline queue
async function handleCartAPI(request, url) {
  // POST/PUT/DELETE requests - queue for offline sync
  if (request.method !== 'GET') {
    try {
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      // Queue for background sync
      await queueCartAction(request, url);
      return new Response(JSON.stringify({
        success: true,
        queued: true,
        message: 'Cart action queued for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // GET requests - cache first
  const cache = await caches.open(CART_CACHE);
  const cachedResponse = await cache.match(request);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cachedResponse || new Response(JSON.stringify({
      success: false,
      error: 'Offline',
      message: 'Cart data not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🎯 Orders API handler with offline queue
async function handleOrdersAPI(request, url) {
  // POST requests - queue for offline sync
  if (request.method === 'POST') {
    try {
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      // Queue for background sync
      await queueOrderAction(request, url);
      return new Response(JSON.stringify({
        success: true,
        queued: true,
        message: 'Order queued for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // GET requests - network first
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    return cache.match(request) || new Response(JSON.stringify({
      success: false,
      error: 'Offline',
      message: 'Order data not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🎯 Rank API handler with timeout and better error handling
async function handleRankAPI(request, url) {
  const RANK_API_TIMEOUT = 8000; // 8 seconds timeout
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, RANK_API_TIMEOUT);
  });

  try {
    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);

    // If we get here, fetch completed before timeout
    if (!response.ok) {
      // Return structured error response for non-OK status codes
      return new Response(JSON.stringify({
        success: false,
        error: 'ServerError',
        status: response.status,
        statusText: response.statusText,
        message: `Server returned ${response.status}: ${response.statusText}`
      }), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return response;
  } catch (error) {
    // Handle timeout or network errors
    const errorType = error.message && error.message.includes('timeout')
      ? 'TimeoutError'
      : 'NetworkError';
    
    const errorMessage = errorType === 'TimeoutError'
      ? 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.'
      : 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';

    // Return structured error response (don't use cache for rank data)
    return new Response(JSON.stringify({
      success: false,
      error: errorType,
      message: errorMessage,
      originalError: error.message || String(error)
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 🎯 Enhanced background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync:', event.tag);

  if (event.tag === 'sync-cookies') {
    event.waitUntil(syncCookies());
  }

  if (event.tag === 'sync-interest') {
    event.waitUntil(syncInterestQueue());
  }

  if (event.tag === 'sync-drops') {
    event.waitUntil(syncDropsData());
  }

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartQueue());
  }

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrderQueue());
  }
});

// 🎯 Enhanced push notifications for drops
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  let notificationData = {
    title: 'Nebula',
    body: 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'nebula-notification'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Enhanced options for drops notifications
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      {
        action: 'view-drops',
        title: 'View Drops',
        icon: '/icons/icon-32x32.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: notificationData.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 🎯 Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  if (event.action === 'view-drops') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/drops') && 'focus' in client) {
            return client.focus();
          }
        }

        // Open drops page if not already open
        if (clients.openWindow) {
          return clients.openWindow('/drops');
        }
      })
    );
  } else if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 🎯 Sync functions for enhanced PWA functionality

// Sync offline interest queue
async function syncInterestQueue() {
  try {
    console.log('[ServiceWorker] Syncing offline interests...');

    // Get queued interests from IndexedDB (simplified for demo)
    const queuedInterests = await getStoredInterests();

    for (const interest of queuedInterests) {
      try {
        await fetch(`${self.location.origin}/api/drops/${interest.dropId}/interest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'pwa-offline-sync',
            metadata: interest.metadata
          })
        });

        // Remove from queue after successful sync
        await removeStoredInterest(interest.id);
        console.log(`[ServiceWorker] Synced interest for drop ${interest.dropId}`);
      } catch (error) {
        console.error(`[ServiceWorker] Failed to sync interest for drop ${interest.dropId}:`, error);
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Interest sync failed:', error);
    return Promise.reject(error);
  }
}

// Sync drops data for offline access
async function syncDropsData() {
  try {
    console.log('[ServiceWorker] Syncing drops data...');

    // Fetch latest featured drops for offline cache
    const response = await fetch(`${self.location.origin}/api/drops/featured`);
    if (response.ok) {
      const dropsData = await response.clone();
      const cache = await caches.open(DROPS_CACHE);
      await cache.put(new Request('/api/drops/featured'), dropsData);
      console.log('[ServiceWorker] Updated drops cache');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Drops sync failed:', error);
    return Promise.reject(error);
  }
}

// Simplified storage functions (in production, use IndexedDB)
async function getStoredInterests() {
  try {
    const cache = await caches.open(INTEREST_QUEUE);
    const response = await cache.match('interests-queue');
    if (response) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

async function removeStoredInterest(id) {
  try {
    const interests = await getStoredInterests();
    const filtered = interests.filter(i => i.id !== id);

    const cache = await caches.open(INTEREST_QUEUE);
    await cache.put(
      'interests-queue',
      new Response(JSON.stringify(filtered))
    );
  } catch (error) {
    console.error('[ServiceWorker] Failed to remove stored interest:', error);
  }
}

// Helper function to sync cookies (placeholder)
async function syncCookies() {
  try {
    console.log('[ServiceWorker] Syncing cookies...');
    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    return Promise.reject(error);
  }
}

// 🎯 Sync cart queue
async function syncCartQueue() {
  try {
    console.log('[ServiceWorker] Syncing cart queue...');
    const queuedActions = await getStoredCartActions();

    for (const action of queuedActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });

        if (response.ok) {
          await removeStoredCartAction(action.id);
          console.log(`[ServiceWorker] Synced cart action ${action.id}`);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Failed to sync cart action ${action.id}:`, error);
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Cart sync failed:', error);
    return Promise.reject(error);
  }
}

// 🎯 Sync order queue
async function syncOrderQueue() {
  try {
    console.log('[ServiceWorker] Syncing order queue...');
    const queuedOrders = await getStoredOrders();

    for (const order of queuedOrders) {
      try {
        const response = await fetch(`${self.location.origin}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order.data)
        });

        if (response.ok) {
          await removeStoredOrder(order.id);
          console.log(`[ServiceWorker] Synced order ${order.id}`);
        }
      } catch (error) {
        console.error(`[ServiceWorker] Failed to sync order ${order.id}:`, error);
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Order sync failed:', error);
    return Promise.reject(error);
  }
}

// 🎯 Queue cart action for offline sync
async function queueCartAction(request, url) {
  try {
    const body = await request.clone().text();
    const actions = await getStoredCartActions();
    
    const queuedAction = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: new Date().toISOString()
    };

    actions.push(queuedAction);

    const cache = await caches.open(CART_QUEUE);
    await cache.put(
      'cart-queue',
      new Response(JSON.stringify(actions))
    );

    // Register background sync
    if (navigator.onLine) {
      await self.registration.sync.register('sync-cart');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Failed to queue cart action:', error);
    return Promise.reject(error);
  }
}

// 🎯 Queue order for offline sync
async function queueOrderAction(request, url) {
  try {
    const body = await request.clone().json();
    const orders = await getStoredOrders();
    
    const queuedOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: body,
      timestamp: new Date().toISOString()
    };

    orders.push(queuedOrder);

    const cache = await caches.open(ORDER_QUEUE);
    await cache.put(
      'orders-queue',
      new Response(JSON.stringify(orders))
    );

    // Register background sync
    if (navigator.onLine) {
      await self.registration.sync.register('sync-orders');
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[ServiceWorker] Failed to queue order:', error);
    return Promise.reject(error);
  }
}

// 🎯 Get stored cart actions
async function getStoredCartActions() {
  try {
    const cache = await caches.open(CART_QUEUE);
    const response = await cache.match('cart-queue');
    if (response) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

// 🎯 Remove stored cart action
async function removeStoredCartAction(id) {
  try {
    const actions = await getStoredCartActions();
    const filtered = actions.filter(a => a.id !== id);

    const cache = await caches.open(CART_QUEUE);
    await cache.put(
      'cart-queue',
      new Response(JSON.stringify(filtered))
    );
  } catch (error) {
    console.error('[ServiceWorker] Failed to remove stored cart action:', error);
  }
}

// 🎯 Get stored orders
async function getStoredOrders() {
  try {
    const cache = await caches.open(ORDER_QUEUE);
    const response = await cache.match('orders-queue');
    if (response) {
      return await response.json();
    }
    return [];
  } catch {
    return [];
  }
}

// 🎯 Remove stored order
async function removeStoredOrder(id) {
  try {
    const orders = await getStoredOrders();
    const filtered = orders.filter(o => o.id !== id);

    const cache = await caches.open(ORDER_QUEUE);
    await cache.put(
      'orders-queue',
      new Response(JSON.stringify(filtered))
    );
  } catch (error) {
    console.error('[ServiceWorker] Failed to remove stored order:', error);
  }
}

// 🎯 Enhanced message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  // 🎯 Interest queue management
  if (event.data.type === 'QUEUE_INTEREST') {
    event.waitUntil(
      queueInterest(event.data.payload)
    );
  }

  if (event.data.type === 'GET_OFFLINE_STATUS') {
    event.ports[0].postMessage({
      type: 'OFFLINE_STATUS',
      isOnline: navigator.onLine,
      hasDropsCache: true // Simplified check
    });
  }

  // 🎯 Background sync registration
  if (event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    const syncTag = event.data.syncTag || 'sync-interest';
    event.waitUntil(
      self.registration.sync.register(syncTag)
        .then(() => {
          event.ports[0].postMessage({ type: 'SYNC_REGISTERED', tag: syncTag });
        })
        .catch((error) => {
          console.error('Failed to register background sync:', error);
          event.ports[0].postMessage({ type: 'SYNC_FAILED', error: error.message });
        })
    );
  }

  // 🎯 Prefetch routes for better performance
  if (event.data.type === 'PREFETCH_ROUTE') {
    event.waitUntil(
      prefetchRoute(event.data.url)
    );
  }
});

// 🎯 Prefetch route for faster navigation
async function prefetchRoute(url) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(new Request(url), response.clone());
      console.log(`[ServiceWorker] Prefetched route: ${url}`);
    }
  } catch (error) {
    console.error(`[ServiceWorker] Failed to prefetch route ${url}:`, error);
  }
}

// 🎯 Queue interest for offline sync
async function queueInterest(interestData) {
  try {
    const interests = await getStoredInterests();
    const queuedInterest = {
      id: `interest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...interestData,
      timestamp: new Date().toISOString(),
      synced: false
    };

    interests.push(queuedInterest);

    const cache = await caches.open(INTEREST_QUEUE);
    await cache.put(
      'interests-queue',
      new Response(JSON.stringify(interests))
    );

    console.log('[ServiceWorker] Interest queued for offline sync:', queuedInterest.id);

    // Register background sync if online
    if (navigator.onLine) {
      await self.registration.sync.register('sync-interest');
    }

    return Promise.resolve({ success: true, id: queuedInterest.id });
  } catch (error) {
    console.error('[ServiceWorker] Failed to queue interest:', error);
    return Promise.reject(error);
  }
}


