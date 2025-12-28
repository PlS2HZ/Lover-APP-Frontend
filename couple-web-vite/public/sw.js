// public/sw.js

// 🌟 แก้ไข: ลบ _ ออกเพราะไม่ได้ใช้เช็คอะไรใน install
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    let data = { title: 'Notification', body: 'มีข้อความใหม่จากคนรัก!' };
    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            // 🌟 แก้ไข: ลบ (e) ออกเพราะเราไม่ได้เอา error มาพ่น log
            data = { title: 'Notification', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        actions: [
            { action: 'open', title: 'ดูรายละเอียด' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(event.notification.data.url);
            }
        })
    );
});