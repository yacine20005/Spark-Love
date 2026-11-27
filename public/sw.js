const CACHE_NAME = 'spark-love-shell-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
];

function isAuthRequest(url) {
  if (url.pathname.includes('/auth/')) return true;
  if (
    url.searchParams.has('code') ||
    url.searchParams.has('token_hash') ||
    url.searchParams.has('token') ||
    url.searchParams.has('access_token') ||
    url.searchParams.has('error')
  ) {
    return true;
  }
  return false;
}

function isStaticImmutableAsset(pathname) {
  return pathname.includes('/_expo/static/') || pathname.includes('/assets/');
}

function isSameOriginPwaAsset(pathname) {
  return pathname.includes('/icons/') || pathname.endsWith('/manifest.json') || pathname.endsWith('/favicon.ico');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((path) => cache.add(new Request(new URL(path, self.registration.scope), { cache: 'reload' }))),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('spark-love-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never intercept cross-origin calls (Supabase API, Auth, Storage, TMDB, OAuth) or non-HTTP schemes.
  if (url.origin !== self.location.origin) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Never cache the service worker itself or auth callback URLs.
  if (url.pathname.endsWith('/sw.js') || isAuthRequest(url)) return;

  // Navigation requests: network-first so fresh deployments & auth redirects always work,
  // with offline fallback to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && !url.search) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(new URL('./index.html', self.registration.scope), copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(new URL('./index.html', self.registration.scope))) ||
            (await cache.match(new URL('./', self.registration.scope))) ||
            Response.error()
          );
        }),
    );
    return;
  }

  // Content-hashed Expo bundles and font/image assets: cache-first.
  if (isStaticImmutableAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // Manifest and PWA icons: stale-while-revalidate.
  if (isSameOriginPwaAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      }),
    );
  }
});
