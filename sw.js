// Bump this version string any time you change index.html (or any cached file)
// so returning visits pick up the new version instead of a stale cached copy.
const CACHE_VERSION = 'salud.familiar-v1.3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './pill.gif',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigations (so you get the latest app when online),
// falling back to the cached shell when offline. Cache-first for everything else.
self.addEventListener('fetch', event => {
  const req = event.request;

  // 1. Only cache GET requests
  if (req.method !== 'GET') return;

  // 2. Never touch Supabase — network only, no cache
  const url = new URL(req.url);
  if (url.hostname.endsWith('.supabase.co')) return;

  // 3. Navigations: network-first, fall back to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION)
            .then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 4. Everything else: cache-first, then network, only cache successful responses
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res.ok && res.type !== 'opaque') {
          const copy = res.clone();
          caches.open(CACHE_VERSION)
            .then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
