const CACHE_NAME = 'halajobs-qa-v1.2';
const STATIC_CACHE = 'halajobs-static-v1.2';
const DYNAMIC_CACHE = 'halajobs-dynamic-v1.2';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/info.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Runtime caching patterns
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first',
  dynamic: 'network-first'
};

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE;
            })
            .map(cacheName => {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension and non-http requests
  if (!request.url.startsWith('http') || 
      request.url.includes('chrome-extension')) {
    return;
  }
  
  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  }
});

async function handleGetRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Strategy 1: Static files (cache-first)
    if (STATIC_FILES.some(file => request.url.includes(file))) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // Strategy 2: Images (cache-first)
    if (request.destination === 'image' || 
        request.url.includes('.jpg') || 
        request.url.includes('.jpeg') || 
        request.url.includes('.png') || 
        request.url.includes('.gif') || 
        request.url.includes('.webp')) {
      return await cacheFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 3: API calls (network-first)
    if (request.url.includes('supabase.co') || 
        request.url.includes('/api/')) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 4: CDN resources (cache-first)
    if (request.url.includes('cdn.jsdelivr.net') || 
        request.url.includes('cdnjs.cloudflare.com')) {
      return await cacheFirst(request, DYNAMIC_CACHE);
    }
    
    // Strategy 5: Default (network-first)
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('🚨 Service Worker: Fetch error', error);
    
    // Return offline fallback for HTML requests
    if (request.headers.get('accept').includes('text/html')) {
      return await getOfflineFallback();
    }
    
    // Return empty response for other requests
    return new Response('', {
      status: 408,
      statusText: 'Request Timeout'
    });
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Service Worker: Network failed for', request.url);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('🌐 Service Worker: Network failed, trying cache for', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match('/');
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Basic offline response
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Halajobs.qa</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }
        h1 { font-size: 2.5em; margin-bottom: 1em; }
        p { font-size: 1.2em; margin-bottom: 1em; }
        .offline-icon { font-size: 4em; margin-bottom: 1em; }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>You're Offline</h1>
      <p>Halajobs.qa is not available right now.</p>
      <p>Please check your internet connection and try again.</p>
      <button onclick="window.location.reload()" style="
        padding: 12px 24px; 
        background: white; 
        color: #667eea; 
        border: none; 
        border-radius: 8px; 
        font-size: 16px;
        cursor: pointer;
        font-weight: 600;
      ">Try Again</button>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync for job posts
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-job-posts') {
    event.waitUntil(syncJobPosts());
  }
});

async function syncJobPosts() {
  try {
    // Get pending job posts from IndexedDB
    const pendingPosts = await getPendingPosts();
    
    for (const post of pendingPosts) {
      try {
        // Attempt to post the job
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(post.data)
        });
        
        if (response.ok) {
          // Remove from pending posts
          await removePendingPost(post.id);
          console.log('✅ Service Worker: Synced job post', post.id);
          
          // Notify user of successful sync
          self.registration.showNotification('Job Posted Successfully!', {
            body: `Your job "${post.data.position}" has been posted.`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'job-posted',
            actions: [
              {
                action: 'view',
                title: 'View Jobs',
                icon: '/icons/action-view.png'
              }
            ]
          });
        }
      } catch (error) {
        console.error('🚨 Service Worker: Failed to sync job post', error);
      }
    }
  } catch (error) {
    console.error('🚨 Service Worker: Background sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('📬 Service Worker: Push notification received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'New job opportunities available!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Jobs',
        icon: '/icons/action-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'general'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Halajobs.qa', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🔔 Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Utility functions for IndexedDB operations
async function getPendingPosts() {
  // Implement IndexedDB operations for offline job posting
  return [];
}

async function removePendingPost(id) {
  // Implement IndexedDB operations for removing synced posts
  return true;
}

// Update notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker: Loaded and ready!');
