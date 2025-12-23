// public/sw.js

self.addEventListener('push', function(event) {
    let data = { title: 'Notification', body: 'มีข้อความใหม่จากคนรัก!' };
    if (event.data) {
        data = event.data.json();
    }

    const options = {
        body: data.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // ✅ แก้ไขจาก clients เป็น self.clients
    event.waitUntil(
        self.clients.openWindow(event.notification.data.url)
    );
});