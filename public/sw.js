const CACHE_NAME = 'fdc-app-v2'; // Increment version for cache busting
const DATA_CACHE_NAME = 'fdc-data-v2';

// Static assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg'
];

// CSV data files that should be cached with compression
const CACHEABLE_DATA = [
  '/data/M819_Smoke_Shell_Ballistics.csv',
  '/data/M821_HE_mortar_data.csv',
  '/data/M853A1_Illumination_Round_Ballistics.csv',
  '/data/M879_Practice_Round_Ballistics.csv'
];

// Performance tracking
let installTime = null;
let activateTime = null;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle CSV data requests
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.csv')) {
    event.respondWith(
      handleDataRequest(request)
    );
    return;
  }

  // Handle static assets
  if (request.method === 'GET') {
    event.respondWith(
      handleStaticRequest(request)
    );
  }
});

// Handle data requests with cache-first strategy for CSV files
async function handleDataRequest(request) {
  const url = new URL(request.url);
  
  // For CSV data files, try cache first, then network
  if (CACHEABLE_DATA.some(dataFile => url.pathname === dataFile)) {
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Return cached data and update in background
        updateCacheInBackground(request, cache);
        return cachedResponse;
      }
      
      // No cache, fetch from network
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache the response
        await cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Try to return cached version as fallback
      const cache = await caches.open(DATA_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return error response
      return new Response(
        JSON.stringify({ error: 'Network error and no cached data available' }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For other requests, just try network
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Network error', { status: 503 });
  }
}

// Update cache in background without blocking response
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static request failed:', error);
    
    // For navigation requests, return cached index.html as fallback
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      const fallback = await cache.match('/index.html');
      if (fallback) {
        return fallback;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}
