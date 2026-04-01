// Medicine Reminder Service Worker
// Handles background push notifications even when the tab is closed

self.addEventListener('push', (event) => {
  let payload = { title: '💊 Medicine Reminder', body: 'Time to take your medicine', data: {} }
  try {
    payload = event.data.json()
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'medicine-reminder',          // replaces previous if still showing
      renotify: true,
      requireInteraction: true,          // stays until user dismisses
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data || {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/medicine-reminders') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/medicine-reminders')
      }
    })
  )
})
