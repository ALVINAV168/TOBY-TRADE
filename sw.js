const CACHE_NAME = 'toby-trade-v1';
const APP_SHELL = [
  '/TOBY-TRADE/',
  '/TOBY-TRADE/index.html',
  '/TOBY-TRADE/manifest.json'
];

// نصب: کش کردن فایل‌های اصلی
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// فعال‌سازی: پاک کردن کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// fetch: استراتژی Network-First برای API، Cache-First برای بقیه
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // درخواست‌های Binance API رو کش نکن (قیمت‌ها باید تازه باشن)
  if (url.hostname === 'data-api.binance.vision') {
    event.respondWith(fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // بقیه: اول کش، اگه نبود شبکه
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // فقط پاسخ‌های موفق رو کش کن
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // اگه آفلاین بودی و صفحه خواستی، index.html رو بده
      if (event.request.mode === 'navigate') {
        return caches.match('/TOBY-TRADE/index.html');
      }
    })
  );
});
