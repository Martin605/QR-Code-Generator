var CACHE_NAME = 'static-v20241130';
var urlsToCache = [
    '/QR-Code-Generator/',
    '/QR-Code-Generator/TW-pay/',
    '/QR-Code-Generator/TW-pay/js/main-tw.js',
    '/QR-Code-Generator/TW-pay/service_worker.js',
    '/QR-Code-Generator/TW-pay/img/icons/icons-512x512.png',
    '/QR-Code-Generator/TW-pay/img/icons/icons-192x192.png',
    '/QR-Code-Generator/TW-pay/img/icons/icons-100x100.png',
    '/QR-Code-Generator/TW-pay/img/icons/icons-32x32.png',
    '/QR-Code-Generator/TW-pay/img/icons/icons-16x16.png',
    '/QR-Code-Generator/TW-pay/img/icons/icons.svg',
    '/QR-Code-Generator/TW-pay/manifest.json',
    '/QR-Code-Generator/TW-pay/tw-bank-data.json',
    'https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Two+Tone|Material+Icons+Round|Material+Icons+Sharp',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://code.jquery.com/jquery-3.6.0.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/@popperjs/core@2.10.2/dist/umd/popper.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js',
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
    'https://avatars2.githubusercontent.com/u/23187664'
];
console.log('loading sw');

self.addEventListener('install', function(event) {
    // Perform install steps
    console.log('installing sw');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                var x = cache.addAll(urlsToCache);
                console.log('cache added');
                return x;
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                }
            )
    );
});