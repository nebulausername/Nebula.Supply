// 🚀 Service Worker für Nebula Cookie Clicker PWA
const CACHE_NAME = 'nebula-cookie-clicker-v1';
const urlsToCache = [
  '/',
  '/cookie-clicker',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/nebula-supply-favicon.png'
];

// 🎯 Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 🎯 Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 🎯 Background Sync für Game Data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync game data in background
  console.log('Background sync triggered');
}

// 🎯 Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New achievement unlocked!',
    icon: '/nebula-supply-favicon.png',
    badge: '/nebula-supply-favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Play Now',
        icon: '/nebula-supply-favicon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/nebula-supply-favicon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Nebula Cookie Clicker', options)
  );
});

// 🎯 Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/cookie-clicker')
    );
  }
});
